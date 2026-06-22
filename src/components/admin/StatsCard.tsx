"use client";

import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatsCardProps {
    title: string;
    value: string | number;
    description?: string;
    icon: LucideIcon;
    trend?: {
        value: number;
        isPositive: boolean;
    };
    variant?: "default" | "primary" | "secondary" | "warning" | "destructive";
}

const variantConfig = {
    default: {
        glow: "bg-slate-500/10",
        icon: "bg-slate-500/20 text-slate-300",
        label: "text-slate-400",
    },
    primary: {
        glow: "bg-blue-500/10",
        icon: "bg-blue-500/20 text-blue-400",
        label: "text-blue-400",
    },
    secondary: {
        glow: "bg-emerald-500/10",
        icon: "bg-emerald-500/20 text-emerald-400",
        label: "text-emerald-400",
    },
    warning: {
        glow: "bg-orange-500/10",
        icon: "bg-orange-500/20 text-orange-400",
        label: "text-orange-400",
    },
    destructive: {
        glow: "bg-rose-500/10",
        icon: "bg-rose-500/20 text-rose-400",
        label: "text-rose-400",
    },
};

export function StatsCard({
    title,
    value,
    description,
    icon: Icon,
    trend,
    variant = "default",
}: StatsCardProps) {
    const config = variantConfig[variant];

    return (
        <Card className="group relative overflow-hidden border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
            <div className={cn("absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl transition-colors", config.glow, "group-hover:opacity-150")} />
            <CardContent className="relative z-10 p-5">
                <div className="flex items-start justify-between mb-3">
                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", config.icon)}>
                        <Icon className="h-5 w-5" />
                    </div>
                    <span className={cn("text-[10px] font-bold uppercase tracking-wider", config.label)}>
                        {title}
                    </span>
                </div>
                <div className="text-2xl font-bold text-white">
                    {value}
                </div>
                {description && (
                    <p className="text-xs text-slate-400 mt-1">{description}</p>
                )}
                {trend && (
                    <div className="flex items-center gap-1.5 mt-2">
                        <span className={cn("text-xs font-bold", trend.isPositive ? "text-emerald-400" : "text-rose-400")}>
                            {trend.isPositive ? "+" : ""}{trend.value}%
                        </span>
                        <span className="text-[10px] text-slate-500">vs mes anterior</span>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
