import darkAsset from "@/assets/agrovest-logo.png.asset.json";
import lightAsset from "@/assets/agrovest-logo-light.png.asset.json";

type Props = { size?: number; variant?: "full" | "mark"; tone?: "light" | "dark" };

export function Logo({ size = 28, variant = "full", tone = "dark" }: Props) {
  // tone="dark" => for use on light backgrounds (use dark/standard mark)
  // tone="light" => for use on dark backgrounds (use light variant mark)
  const src = tone === "light" ? lightAsset.url : darkAsset.url;
  const text = tone === "dark" ? "text-navy" : "text-white";
  return (
    <div className="inline-flex items-center gap-2">
      <img
        src={src}
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
