"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ValidatedInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string | null;
    touched?: boolean;
    valid?: boolean;
    icon?: React.ReactNode;
    description?: string;
}

export const ValidatedInput = React.forwardRef<HTMLInputElement, ValidatedInputProps>(
    ({ className, label, error, touched, valid, icon, description, id, ...props }, ref) => {
        const inputId = id || props.name;
        const showError = touched && error;
        const showSuccess = touched && valid && !error;

        return (
            <div className="space-y-2">
                {label && (
                    <Label htmlFor={inputId} className="text-sm font-medium text-gray-700">
                        {label}
                        {props.required && <span className="text-red-500 ml-1">*</span>}
                    </Label>
                )}
                <div className="relative">
                    {icon && (
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                            {icon}
                        </div>
                    )}
                    <Input
                        id={inputId}
                        ref={ref}
                        className={cn(
                            "transition-all duration-200",
                            icon && "pl-10",
                            (showError || showSuccess) && "pr-10",
                            showError && "border-red-300 focus:border-red-500 focus:ring-red-200 bg-red-50/50",
                            showSuccess && "border-green-300 focus:border-green-500 focus:ring-green-200 bg-green-50/50",
                            !showError && !showSuccess && "border-gray-200",
                            className
                        )}
                        aria-invalid={showError ? "true" : "false"}
                        aria-describedby={showError ? `${inputId}-error` : undefined}
                        {...props}
                    />
                    {(showError || showSuccess) && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                            {showError && (
                                <AlertCircle className="h-5 w-5 text-red-500 animate-in fade-in zoom-in duration-200" />
                            )}
                            {showSuccess && (
                                <CheckCircle2 className="h-5 w-5 text-green-500 animate-in fade-in zoom-in duration-200" />
                            )}
                        </div>
                    )}
                </div>
                {description && !showError && (
                    <p className="text-xs text-gray-500">{description}</p>
                )}
                {showError && (
                    <p
                        id={`${inputId}-error`}
                        className="text-xs text-red-600 animate-in slide-in-from-top-1 duration-200"
                        role="alert"
                    >
                        {error}
                    </p>
                )}
            </div>
        );
    }
);

ValidatedInput.displayName = "ValidatedInput";
