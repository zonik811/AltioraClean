"use client";

import { useState, useCallback } from "react";

export interface ValidationRule {
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    pattern?: RegExp;
    min?: number;
    max?: number;
    email?: boolean;
    phone?: boolean;
    custom?: (value: string) => string | null;
}

export interface FieldValidation {
    value: string;
    error: string | null;
    touched: boolean;
    valid: boolean;
}

export interface UseFormValidationReturn<T extends Record<string, ValidationRule>> {
    fields: Record<keyof T, FieldValidation>;
    isValid: boolean;
    setValue: (field: keyof T, value: string) => void;
    setTouched: (field: keyof T) => void;
    validateField: (field: keyof T) => boolean;
    validateAll: () => boolean;
    reset: () => void;
}

function validateValue(value: string, rules: ValidationRule): string | null {
    if (rules.required && !value.trim()) {
        return "Este campo es requerido";
    }

    if (value && rules.minLength && value.length < rules.minLength) {
        return `Mínimo ${rules.minLength} caracteres`;
    }

    if (value && rules.maxLength && value.length > rules.maxLength) {
        return `Máximo ${rules.maxLength} caracteres`;
    }

    if (value && rules.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        return "Email inválido";
    }

    if (value && rules.phone && !/^[\d\s\-\+\(\)]{7,15}$/.test(value)) {
        return "Teléfono inválido";
    }

    if (value && rules.pattern && !rules.pattern.test(value)) {
        return "Formato inválido";
    }

    if (value && rules.min !== undefined && Number(value) < rules.min) {
        return `Mínimo ${rules.min}`;
    }

    if (value && rules.max !== undefined && Number(value) > rules.max) {
        return `Máximo ${rules.max}`;
    }

    if (value && rules.custom) {
        return rules.custom(value);
    }

    return null;
}

export function useFormValidation<T extends Record<string, ValidationRule>>(
    rules: T,
    initialValues?: Partial<Record<keyof T, string>>
): UseFormValidationReturn<T> {
    const initialFields = Object.keys(rules).reduce((acc, key) => {
        const k = key as keyof T;
        acc[k] = {
            value: initialValues?.[k] || "",
            error: null,
            touched: false,
            valid: false,
        };
        return acc;
    }, {} as Record<keyof T, FieldValidation>);

    const [fields, setFields] = useState(initialFields);

    const setValue = useCallback((field: keyof T, value: string) => {
        setFields(prev => {
            const fieldRules = rules[field];
            const error = validateValue(value, fieldRules);
            return {
                ...prev,
                [field]: {
                    value,
                    error: prev[field].touched ? error : null,
                    touched: prev[field].touched,
                    valid: error === null,
                },
            };
        });
    }, [rules]);

    const setTouched = useCallback((field: keyof T) => {
        setFields(prev => {
            const fieldRules = rules[field];
            const error = validateValue(prev[field].value, fieldRules);
            return {
                ...prev,
                [field]: {
                    ...prev[field],
                    touched: true,
                    error,
                    valid: error === null,
                },
            };
        });
    }, [rules]);

    const validateField = useCallback((field: keyof T): boolean => {
        const fieldRules = rules[field];
        const error = validateValue(fields[field].value, fieldRules);
        setFields(prev => ({
            ...prev,
            [field]: {
                ...prev[field],
                touched: true,
                error,
                valid: error === null,
            },
        }));
        return error === null;
    }, [rules, fields]);

    const validateAll = useCallback((): boolean => {
        let allValid = true;
        setFields(prev => {
            const newFields = { ...prev };
            Object.keys(rules).forEach(key => {
                const k = key as keyof T;
                const fieldRules = rules[k];
                const error = validateValue(prev[k].value, fieldRules);
                newFields[k] = {
                    ...prev[k],
                    touched: true,
                    error,
                    valid: error === null,
                };
                if (error) allValid = false;
            });
            return newFields;
        });
        return allValid;
    }, [rules]);

    const reset = useCallback(() => {
        setFields(initialFields);
    }, [initialFields]);

    const isValid = Object.values(fields).every(f => f.valid);

    return {
        fields,
        isValid,
        setValue,
        setTouched,
        validateField,
        validateAll,
        reset,
    };
}
