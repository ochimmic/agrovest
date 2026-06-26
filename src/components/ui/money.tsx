import { fmtNgn, fmtUsd } from "@/lib/fx";

/**
 * Renders an amount in USD with the NGN equivalent below or inline.
 * Use everywhere the app shows a price, total, balance, or fee.
 */
export function Money({
  usd,
  layout = "stack",
  size = "md",
  decimals,
  emphasis = "primary",
  className = "",
}: {
  usd: number;
  layout?: "stack" | "inline";
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  decimals?: boolean;
  emphasis?: "primary" | "muted" | "agro" | "violet" | "white";
  className?: string;
}) {
  const sz = {
    xs: { main: "text-[11px]", sub: "text-[10px]" },
    sm: { main: "text-xs", sub: "text-[10px]" },
    md: { main: "text-sm", sub: "text-[10px]" },
    lg: { main: "text-base", sub: "text-[11px]" },
    xl: { main: "text-2xl", sub: "text-xs" },
  }[size];
  const tone = {
    primary: "text-navy",
    muted: "text-muted-foreground",
    agro: "text-agro",
    violet: "text-violet",
    white: "text-white",
  }[emphasis];

  if (layout === "inline") {
    return (
      <span className={`inline-flex items-baseline gap-1 ${className}`}>
        <span className={`${sz.main} font-semibold tabular ${tone}`}>{fmtUsd(usd, { decimals })}</span>
        <span className={`${sz.sub} text-muted-foreground tabular`}>≈ {fmtNgn(usd)}</span>
      </span>
    );
  }
  return (
    <span className={`inline-flex flex-col items-end leading-tight ${className}`}>
      <span className={`${sz.main} font-semibold tabular ${tone}`}>{fmtUsd(usd, { decimals })}</span>
      <span className={`${sz.sub} text-muted-foreground tabular`}>≈ {fmtNgn(usd)}</span>
    </span>
  );
}
