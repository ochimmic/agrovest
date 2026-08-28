import { useEffect, useState } from "react";
import QRCode from "qrcode";

export function QrCode({ value, size = 180 }: { value: string; size?: number }) {
  const [src, setSrc] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    void QRCode.toDataURL(value, { width: size * 2, margin: 1 }).then((d) => {
      if (alive) setSrc(d);
    });
    return () => { alive = false; };
  }, [value, size]);
  return (
    <div
      className="rounded-2xl bg-white p-3 shadow-card inline-block"
      style={{ width: size + 24, height: size + 24 }}
    >
      {src ? <img src={src} alt="Wallet address QR code" width={size} height={size} /> : null}
    </div>
  );
}
