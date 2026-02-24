import { forwardRef } from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ label, error, className = "", ...props }, ref) => {
        return (
            <div className="flex flex-col gap-1 w-full">
                {label && (
                    <label className="text-sm font-medium text-foreground">
                        {label}
                    </label>
                )}
                <input
                    ref={ref}
                    className={`w-full p-2.5 text-sm text-foreground bg-background border border-border-default rounded-xl focus:outline-none focus:border-primary transition-colors placeholder:text-text-muted ${error ? "border-red-500" : ""} ${className}`}
                    {...props}
                />
                {error && (
                    <span className="text-xs text-red-500">{error}</span>
                )}
            </div>
        );
    }
);

Input.displayName = "Input";
