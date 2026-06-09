import darkAsset from "@/assets/agrovest-logo.png.asset.json";
import lightAsset from "@/assets/agrovest-logo-light.png.asset.json";

type Props = { size?: number; variant?: "full" | "mark"; tone?: "light" | "dark" };

export function Logo({ size = 28, variant = "full", tone }: Props) {
  // When tone is forced, honor it. Otherwise auto-pick light mark in dark mode,
  // dark mark in light mode, and color the wordmark with the current foreground.
  const forced = tone !== undefined;
  const src = tone === "light" ? lightAsset.url : tone === "dark" ? darkAsset.url : darkAsset.url;
  const textClass = forced
    ? tone === "light" ? "text-white" : "text-foreground"
    : "text-foreground";
  return (
    <div className="inline-flex items-center gap-2">
      {/* In dark mode auto-swap to the light mark for legibility */}
      <img
        src={src}
        alt="AgroVest"
        width={size}
        height={size}
        className={`rounded-[10px] shadow-glow ${!forced ? "dark:hidden" : ""}`}
        style={{ width: size, height: size }}
      />
      {!forced && (
        <img
          src={lightAsset.url}
          alt=""
          aria-hidden
          width={size}
          height={size}
          className="rounded-[10px] shadow-glow hidden dark:block"
          style={{ width: size, height: size }}
        />
      )}
      {variant === "full" && (
        <span className={`${textClass} font-semibold tracking-tight`} style={{ fontSize: size * 0.6 }}>
          AgroVest
        </span>
      )}
    </div>
  );
}
