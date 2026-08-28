import { useHydrated } from "@tanstack/react-router";

/**
 * Renders a timestamp in the visitor's locale after hydration.
 * Server-rendered output stays empty so relative/seeded timestamps
 * can't cause a hydration mismatch.
 */
export function LocalTime({ at }: { at: string | number | Date }) {
  const hydrated = useHydrated();
  if (!hydrated) return <span suppressHydrationWarning />;
  return <span suppressHydrationWarning>{new Date(at).toLocaleString()}</span>;
}
