type Props = { size?: number; variant?: "full" | "mark"; tone?: "light" | "dark" };

export function Logo({ size = 28, variant = "full", tone = "dark" }: Props) {
  const text = tone === "dark" ? "text-navy" : "text-white";
  return (
    <div className="inline-flex items-center gap-2">
      <span
        aria-hidden
        className="relative inline-flex items-center justify-center rounded-[10px] gradient-violet shadow-glow"
        style={{ width: size, height: size }}
      >
        <svg width={size * 0.62} height={size * 0.62} viewBox="0 0 24 24" fill="none">
          <path
            d="M12 2c4 4 6 7.5 6 11a6 6 0 1 1-12 0c0-3.5 2-7 6-11Z"
            fill="white"
            opacity="0.95"
          />
          <path d="M12 8v9" stroke="#00D084" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      </span>
      {variant === "full" && (
        <span className={`${text} font-semibold tracking-tight`} style={{ fontSize: size * 0.6 }}>
          AgroVest
        </span>
      )}
    </div>
  );
}
