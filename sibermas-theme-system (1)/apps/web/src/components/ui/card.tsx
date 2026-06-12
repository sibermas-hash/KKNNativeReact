// apps/web/src/components/ui/card.tsx
// Token-based card + subparts. Set `glass` for a frosted glassmorphism surface.
import * as React from "react";
import { cn } from "@/lib/utils";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Render as a frosted glassmorphism surface (uses the .glass primitive). */
  glass?: boolean;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, glass = false, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "rounded-[var(--profile-radius)] p-5",
        glass
          ? "glass shadow-lg"
          : "border border-[var(--profile-border)] bg-[var(--profile-surface)] shadow-sm",
        className,
      )}
      {...props}
    />
  ),
);
Card.displayName = "Card";

export function CardTitle({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn(
        "text-[var(--profile-text)] font-semibold tracking-tight",
        className,
      )}
      {...props}
    />
  );
}

export function CardDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn(
        "text-[var(--profile-muted)] text-sm leading-relaxed",
        className,
      )}
      {...props}
    />
  );
}
