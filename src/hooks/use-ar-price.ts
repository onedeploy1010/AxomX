import { useQuery } from "@tanstack/react-query";
import { getArPrice } from "@/lib/api";

const DEFAULT_AR_PRICE = 0.1;

export function useArPrice() {
  const { data, isLoading } = useQuery({
    queryKey: ["ar-price"],
    queryFn: getArPrice,
    staleTime: 60_000,
    refetchInterval: 5 * 60_000,
  });

  const price = data?.price ?? DEFAULT_AR_PRICE;
  const source = data?.source ?? "DEFAULT";

  const usdcToAR = (usdc: number) => usdc / price;

  const formatAR = (usdc: number) => {
    const ar = usdcToAR(usdc);
    return `${new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(ar)} AR`;
  };

  const formatCompactAR = (usdc: number) => {
    const ar = usdcToAR(usdc);
    if (ar >= 1_000_000) return `${(ar / 1_000_000).toFixed(2)}M AR`;
    if (ar >= 1_000) return `${(ar / 1_000).toFixed(1)}K AR`;
    return `${ar.toFixed(2)} AR`;
  };

  return { price, source, isLoading, usdcToAR, formatAR, formatCompactAR };
}
