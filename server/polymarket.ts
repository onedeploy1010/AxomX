interface PolymarketEvent {
  id: string;
  title: string;
  slug: string;
  description: string;
  active: boolean;
  closed: boolean;
  startDate: string;
  endDate: string;
  volume: number;
  liquidity: number;
  markets: PolymarketMarket[];
}

interface PolymarketMarket {
  id: string;
  question: string;
  outcomePrices: string;
  volume: number;
  liquidity: number;
  endDate: string;
  groupItemTitle?: string;
  clobTokenIds?: string;
}

export interface PolymarketPrediction {
  id: string;
  question: string;
  yesPrice: number;
  noPrice: number;
  volume: number;
  liquidity: number;
  endDate: string;
  category: string;
  slug: string;
}

const polyCache: { data: PolymarketPrediction[] | null; timestamp: number } = {
  data: null,
  timestamp: 0,
};
const POLY_CACHE_TTL = 5 * 60 * 1000;

const CRYPTO_KEYWORDS = [
  "bitcoin", "btc", "ethereum", "eth", "solana", "sol", "bnb", "binance",
  "dogecoin", "doge", "xrp", "ripple", "crypto", "blockchain", "defi",
  "token", "coin", "mining", "stablecoin", "usdt", "usdc", "altcoin",
  "nft", "web3", "microstrategy", "satoshi", "halving", "memecoin",
  "cardano", "ada", "polygon", "matic", "avalanche", "avax", "chainlink",
  "litecoin", "ltc", "polkadot", "dot", "uniswap", "aave",
  "sec", "etf", "cbdc", "staking", "wallet",
];

function isCryptoRelated(question: string, eventTitle?: string): boolean {
  const text = ((question || "") + " " + (eventTitle || "")).toLowerCase();
  return CRYPTO_KEYWORDS.some((keyword) => text.includes(keyword));
}

export async function fetchPolymarketCryptoMarkets(): Promise<PolymarketPrediction[]> {
  const now = Date.now();
  if (polyCache.data && now - polyCache.timestamp < POLY_CACHE_TTL) {
    return polyCache.data;
  }

  try {
    const urls = [
      "https://gamma-api.polymarket.com/events?tag=crypto&active=true&closed=false&limit=50&offset=0",
      "https://gamma-api.polymarket.com/events?tag=bitcoin&active=true&closed=false&limit=30&offset=0",
    ];

    const responses = await Promise.allSettled(urls.map((url) =>
      fetch(url, {
        headers: { Accept: "application/json", "User-Agent": "AxomX/1.0" },
      }).then((r) => (r.ok ? r.json() : []))
    ));

    const allEvents: PolymarketEvent[] = [];
    const seenIds = new Set<string>();

    for (const result of responses) {
      if (result.status === "fulfilled" && Array.isArray(result.value)) {
        for (const event of result.value) {
          if (!seenIds.has(event.id)) {
            seenIds.add(event.id);
            allEvents.push(event);
          }
        }
      }
    }

    const predictions: PolymarketPrediction[] = [];

    for (const event of allEvents) {
      if (!event.markets || event.markets.length === 0) continue;

      for (const market of event.markets) {
        const question = market.question || event.title;
        if (!isCryptoRelated(question, event.title)) continue;

        let yesPrice = 0.5;
        let noPrice = 0.5;

        try {
          if (market.outcomePrices) {
            const parsed = JSON.parse(market.outcomePrices);
            if (Array.isArray(parsed) && parsed.length >= 2) {
              yesPrice = parseFloat(parsed[0]) || 0.5;
              noPrice = parseFloat(parsed[1]) || 0.5;
            }
          }
        } catch {
          yesPrice = 0.5;
          noPrice = 0.5;
        }

        predictions.push({
          id: market.id || event.id,
          question,
          yesPrice,
          noPrice,
          volume: market.volume || event.volume || 0,
          liquidity: market.liquidity || event.liquidity || 0,
          endDate: market.endDate || event.endDate || "",
          category: "Crypto",
          slug: event.slug || "",
        });
      }
    }

    predictions.sort((a, b) => b.volume - a.volume);
    const result = predictions.slice(0, 20);

    polyCache.data = result;
    polyCache.timestamp = now;

    return result;
  } catch (error) {
    console.error("Polymarket fetch error:", error);
    return polyCache.data || [];
  }
}
