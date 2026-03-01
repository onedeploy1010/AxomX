import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ── Market data ─────────────────────────────────────

async function fetchFearGreedIndex() {
  try {
    const res = await fetch("https://api.alternative.me/fng/?limit=1");
    const data = await res.json();
    return { value: parseInt(data.data[0].value), classification: data.data[0].value_classification };
  } catch {
    return { value: 50, classification: "Neutral" };
  }
}

async function fetchCurrentPrice(asset: string): Promise<number> {
  try {
    const res = await fetch(`https://api.binance.us/api/v3/ticker/price?symbol=${asset}USDT`);
    if (res.ok) { const d = await res.json(); const p = parseFloat(d.price); if (p > 0) return p; }
  } catch {}
  const ids: Record<string, string> = { BTC: "bitcoin", ETH: "ethereum", SOL: "solana", BNB: "binancecoin", DOGE: "dogecoin" };
  try {
    const id = ids[asset] || "bitcoin";
    const res = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${id}&vs_currency=usd`);
    const data = await res.json();
    return data[id]?.usd || 0;
  } catch { return 0; }
}

// ── Constants ───────────────────────────────────────

const TIMEFRAME_LABELS: Record<string, string> = {
  "1m": "1-minute", "5m": "5-minute", "15m": "15-minute",
  "30m": "30-minute", "1H": "1-hour", "4H": "4-hour",
  "1D": "1-day", "1W": "1-week",
};

const tfMinutes: Record<string, number> = {
  "1m": 1, "5m": 5, "15m": 15, "30m": 30,
  "1H": 60, "4H": 240, "1D": 1440, "1W": 10080,
};

const SYSTEM_PROMPT =
  "You are a crypto market analyst. Provide a prediction in JSON format only. " +
  "Fields: prediction (BULLISH/BEARISH/NEUTRAL), confidence (0-100), targetPrice (number), reasoning (1 sentence). " +
  "Respond with valid JSON only, no markdown, no extra text.";

// ── Models via CF AI Gateway Universal Endpoint ─────
// All called through: {gateway_url}/compat/chat/completions
// Just change the "model" field — same OpenAI-compatible format.

interface ModelDef {
  model: string;   // model ID passed to the API
  label: string;   // display name in UI
}

const MODELS: ModelDef[] = [
  { model: "@cf/meta/llama-3.1-70b-instruct",      label: "Llama 3.1" },
  { model: "@cf/meta/llama-3.1-8b-instruct",       label: "Llama 8B" },
  { model: "@cf/mistral/mistral-7b-instruct-v0.2",  label: "Mistral" },
  { model: "@cf/google/gemma-7b-it",                label: "Gemma" },
  { model: "@cf/qwen/qwen1.5-14b-chat-awq",        label: "Qwen" },
];

// ── Call model via gateway ──────────────────────────

interface ModelResult {
  model: string;
  prediction: string;
  confidence: number;
  targetPrice: number;
  reasoning: string;
}

function parseJsonSafe(text: string): Record<string, any> {
  try { return JSON.parse(text); } catch {}
  const m = text.match(/\{[\s\S]*?\}/);
  if (m) try { return JSON.parse(m[0]); } catch {}
  return {};
}

async function callModel(
  gatewayUrl: string,
  token: string,
  def: ModelDef,
  userPrompt: string,
): Promise<ModelResult> {
  const res = await fetch(gatewayUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
    body: JSON.stringify({
      model: def.model,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      max_tokens: 256,
    }),
  });

  const result = await res.json();

  // Universal endpoint returns OpenAI-compatible format:
  // { choices: [{ message: { content: "..." } }] }
  // Some Workers AI models may return { result: { response: "..." } }
  const text =
    result?.choices?.[0]?.message?.content ||
    result?.result?.response ||
    "{}";

  const parsed = parseJsonSafe(text);
  return {
    model: def.label,
    prediction: parsed.prediction || "NEUTRAL",
    confidence: Number(parsed.confidence) || 50,
    targetPrice: Number(parsed.targetPrice) || 0,
    reasoning: parsed.reasoning || "",
  };
}

// ── Forecast points generator ───────────────────────

function generateForecastPoints(currentPrice: number, targetPrice: number, tf: string) {
  const totalMinutes = tfMinutes[tf] || 60;
  const numPoints = 8;
  const stepMs = (totalMinutes * 60 * 1000) / numPoints;
  const now = Date.now();
  const diff = targetPrice - currentPrice;

  const points: { timestamp: number; time: string; price: number; predicted: boolean }[] = [];
  for (let i = 1; i <= numPoints; i++) {
    const t = i / numPoints;
    const ease = t * t * (3 - 2 * t);
    const noise = (Math.random() - 0.5) * Math.abs(diff) * 0.15 * (1 - t);
    const price = currentPrice + diff * ease + noise;
    const ts = now + stepMs * i;
    const d = new Date(ts);
    const time = totalMinutes >= 1440
      ? d.toLocaleDateString([], { month: "short", day: "numeric" }) + " " + d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      : d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    points.push({ timestamp: ts, time, price: parseFloat(price.toFixed(currentPrice < 1 ? 6 : 2)), predicted: true });
  }
  return points;
}

// ── Main ────────────────────────────────────────────

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { asset, timeframe } = await req.json();
    const assetUp = (asset || "BTC").toUpperCase();
    const tf = timeframe || "1H";
    const tfLabel = TIMEFRAME_LABELS[tf] || tf;

    // Env: only 2 vars needed
    //   CF_AI_GATEWAY_URL = https://gateway.ai.cloudflare.com/v1/{account_id}/{gateway}/compat/chat/completions
    //   CF_AI_TOKEN       = your Cloudflare API token
    const gatewayUrl = Deno.env.get("CF_AI_GATEWAY_URL");
    const cfToken = Deno.env.get("CF_AI_TOKEN");
    if (!gatewayUrl || !cfToken) throw new Error("CF_AI_GATEWAY_URL and CF_AI_TOKEN must be set");

    const [fearGreed, currentPrice] = await Promise.all([fetchFearGreedIndex(), fetchCurrentPrice(assetUp)]);
    const userPrompt = `Analyze ${assetUp} at $${currentPrice}. Fear & Greed Index: ${fearGreed.value} (${fearGreed.classification}). Predict ${tfLabel} movement.`;

    // Call all models in parallel through the same gateway endpoint
    const results = await Promise.allSettled(
      MODELS.map(def => callModel(gatewayUrl, cfToken, def, userPrompt))
    );

    const forecasts = results
      .filter((r): r is PromiseFulfilledResult<ModelResult> => r.status === "fulfilled")
      .map(r => {
        const m = r.value;
        const target = m.targetPrice > 0 ? m.targetPrice : currentPrice;
        return {
          model: m.model,
          asset: assetUp,
          timeframe: tf,
          direction: m.prediction,
          confidence: m.confidence,
          currentPrice,
          targetPrice: target,
          reasoning: m.reasoning,
          forecastPoints: generateForecastPoints(currentPrice, target, tf),
        };
      });

    if (forecasts.length === 0) throw new Error("All AI models failed");

    // Sort by confidence descending — best first
    forecasts.sort((a, b) => b.confidence - a.confidence);

    return new Response(JSON.stringify({ forecasts }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
