import clsx from "clsx";
import { Loader2 } from "lucide-react";
import {
  type ButtonHTMLAttributes,
  type AnchorHTMLAttributes,
  type ReactNode,
  forwardRef,
} from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

type BaseProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  children: ReactNode;
  className?: string;
};

type ButtonAsButton = BaseProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, keyof BaseProps> & {
    as?: "button";
    href?: never;
  };

type ButtonAsAnchor = BaseProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof BaseProps> & {
    as: "a";
    href: string;
  };

export type ButtonProps = ButtonAsButton | ButtonAsAnchor;

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-gold text-[#0A0A0A] hover:bg-gold-light font-bold",
  secondary:
    "bg-transparent border border-border text-text-primary hover:border-gold hover:text-gold",
  ghost:
    "bg-transparent text-text-secondary hover:text-text-primary hover:bg-surface-hover",
  danger: "bg-error/15 text-error hover:bg-error/25",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-xs",
  md: "h-10 px-4 text-sm",
  lg: "h-12 px-6 text-base",
};

export const Button = forwardRef<
  HTMLButtonElement | HTMLAnchorElement,
  ButtonProps
>(function Button(props, ref) {
  const {
    variant = "primary",
    size = "md",
    loading = false,
    children,
    className,
    as,
    ...rest
  } = props;

  const classes = clsx(
    "inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-all duration-200 cursor-pointer select-none",
    "disabled:opacity-50 disabled:cursor-not-allowed",
    variantStyles[variant],
    sizeStyles[size],
    className,
  );

  if (as === "a") {
    const { href, ...anchorRest } = rest as Omit<
      AnchorHTMLAttributes<HTMLAnchorElement>,
      keyof BaseProps
    > & { href: string };
    return (
      <a
        ref={ref as React.Ref<HTMLAnchorElement>}
        href={href}
        className={classes}
        {...anchorRest}
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : children}
      </a>
    );
  }

  const buttonRest = rest as Omit<
    ButtonHTMLAttributes<HTMLButtonElement>,
    keyof BaseProps
  >;

  return (
    <button
      ref={ref as React.Ref<HTMLButtonElement>}
      className={classes}
      disabled={loading || buttonRest.disabled}
      {...buttonRest}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : children}
    </button>
  );
});
