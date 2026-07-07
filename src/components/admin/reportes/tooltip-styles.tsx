import type { TooltipProps } from "recharts";
import type { NameType, ValueType } from "recharts/types/component/DefaultTooltipContent";

export const tooltipContentStyle: React.CSSProperties = {
    borderRadius: "12px",
    border: "1px solid rgba(255,255,255,0.1)",
    background: "rgba(15,23,42,0.95)",
    boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
    color: "#fff",
};

export const labelStyle: React.CSSProperties = {
    color: "#94a3b8",
    fontSize: "12px",
};

export const itemStyle: React.CSSProperties = {
    color: "#fff",
};

export function GradientCard({
    children,
    className = "",
    accent = "blue",
}: {
    children: React.ReactNode;
    className?: string;
    accent?: "blue" | "emerald" | "violet" | "sky" | "pink" | "primary";
}) {
    const accentColors: Record<string, string> = {
        blue: "bg-blue-500/10",
        emerald: "bg-emerald-500/10",
        violet: "bg-violet-500/10",
        sky: "bg-sky-500/10",
        pink: "bg-pink-500/10",
        primary: "bg-primary/10",
    };

    return (
        <div className={`relative overflow-hidden border-0 shadow-xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white ${className}`}>
            <div className={`absolute top-0 right-0 w-64 h-64 ${accentColors[accent] || accentColors.blue} rounded-full blur-3xl`}></div>
            {children}
        </div>
    );
}
