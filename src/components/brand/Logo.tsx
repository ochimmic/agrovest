import logoAsset from "@/assets/agrovest-logo.png.asset.json";

type Props = { size?: number; variant?: "full" | "mark"; tone?: "light" | "dark" };

export function Logo({ size = 28, variant = "full", tone = "dark" }: Props) {
  const text = tone === "dark" ? "text-navy" : "text-white";
  return (
    <div className="inline-flex items-center gap-2">
      <img
        src={logoAsset.url}
        alt="AgroVest"
        width={size}
        height={size}
        className="rounded-[10px] shadow-glow"
        style={{ width: size, height: size }}
      />
      {variant === "full" && (
        <span className={`${text} font-semibold tracking-tight`} style={{ fontSize: size * 0.6 }}>
          AgroVest
        </span>
      )}
    </div>
  );
}
