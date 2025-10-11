import { forwardRef } from "react";
import type { InputHTMLAttributes } from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));

type TextFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  hint?: string;
  error?: string;
};

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(
  ({ id, label, type = "text", hint, error, className, ...props }, ref) => {
    const inputId = id ?? props.name;

    return (
      <div className={cn("flex flex-col gap-1", className)}>
        <label className="text-sm font-medium text-foreground" htmlFor={inputId}>
          {label}
        </label>
        <input
          ref={ref}
          id={inputId}
          type={type}
          className={cn(
            "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60",
            error ? "border-destructive/60" : null
          )}
          {...props}
        />
        {hint && !error ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
        {error ? <p className="text-xs text-destructive">{error}</p> : null}
      </div>
    );
  }
);

TextField.displayName = "TextField";
