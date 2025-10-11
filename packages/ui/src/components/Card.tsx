import * as React from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));

export type CardProps = React.HTMLAttributes<HTMLDivElement> & {
  muted?: boolean;
};

export function Card({ className, muted = false, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border bg-card text-card-foreground shadow-lg",
        muted ? "border-border/60 bg-muted/60" : "border-border",
        "transition-colors duration-200",
        className
      )}
      {...props}
    />
  );
}

export type CardHeaderProps = React.HTMLAttributes<HTMLDivElement> & {
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
};

export function CardHeader({ title, subtitle, action, className, children, ...props }: CardHeaderProps) {
  return (
    <header
      className={cn(
        "flex flex-col gap-3 border-b border-border/60 bg-muted/40 p-6 sm:flex-row sm:items-center sm:justify-between",
        className
      )}
      {...props}
    >
      <div className="space-y-1">
        {title ? <h2 className="text-xl font-semibold leading-tight tracking-tight text-foreground">{title}</h2> : null}
        {subtitle ? <p className="text-sm text-muted-foreground">{subtitle}</p> : null}
        {children}
      </div>
      {action}
    </header>
  );
}

export type CardBodyProps = React.HTMLAttributes<HTMLDivElement>;

export function CardBody({ className, ...props }: CardBodyProps) {
  return <div className={cn("flex flex-col gap-6 p-6", className)} {...props} />;
}
