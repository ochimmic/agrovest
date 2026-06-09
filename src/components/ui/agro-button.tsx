import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes } from "react";

const v = cva(
  "inline-flex items-center justify-center gap-2 rounded-2xl font-semibold tracking-tight transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60",
  {
    variants: {
      variant: {
        primary: "gradient-violet text-white shadow-glow hover:brightness-110",
        navy: "bg-navy text-white hover:bg-navy/90 shadow-card",
        agro: "gradient-agro text-white shadow-card hover:brightness-110",
        ghost: "bg-transparent text-foreground hover:bg-secondary",
        outline: "border border-border bg-card text-foreground hover:bg-secondary",
        soft: "bg-violet-soft text-violet hover:bg-violet-soft/80",
        danger: "bg-destructive text-destructive-foreground hover:opacity-90",
      },
      size: {
        sm: "h-9 px-3 text-sm",
        md: "h-11 px-4 text-sm",
        lg: "h-13 px-5 text-[15px] py-3.5",
        xl: "h-14 px-6 text-base w-full",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  }
);

type Props = ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof v> & { asChild?: boolean };

export function AgroButton({ className, variant, size, asChild, ...props }: Props) {
  const Comp: any = asChild ? Slot : "button";
  return <Comp className={cn(v({ variant, size }), className)} {...props} />;
}
