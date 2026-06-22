"use client";

import { ReactNode } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

interface ScrollStepProps {
    step: number;
    title: string;
    description: string;
    icon: ReactNode;
    image?: string;
    reverse?: boolean;
}

export function ScrollStep({ step, title, description, icon, image, reverse = false }: ScrollStepProps) {
    const ref = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({
        target: ref,
        offset: ["start end", "center center"],
    });

    const opacity = useTransform(scrollYProgress, [0, 0.5], [0, 1]);
    const x = useTransform(scrollYProgress, [0, 0.5], [reverse ? 100 : -100, 0]);
    const scale = useTransform(scrollYProgress, [0, 0.5], [0.9, 1]);

    return (
        <motion.div
            ref={ref}
            style={{ opacity, x, scale }}
            className={`flex flex-col ${reverse ? "lg:flex-row-reverse" : "lg:flex-row"} items-center gap-12 py-20`}
        >
            <div className="flex-1 space-y-6">
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-primary to-secondary rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-xl">
                        {step}
                    </div>
                    <div className="w-14 h-14 bg-white border-2 border-primary/20 rounded-xl flex items-center justify-center">
                        {icon}
                    </div>
                </div>
                <h3 className="text-4xl font-bold text-gray-900">{title}</h3>
                <p className="text-xl text-gray-600 leading-relaxed">{description}</p>
            </div>

            {image && (
                <div className="flex-1 relative">
                    <div className="relative h-80 lg:h-96 rounded-3xl overflow-hidden shadow-2xl">
                        <img src={image} alt={title} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                    </div>
                </div>
            )}
        </motion.div>
    );
}

interface ScrollProgressBarProps {
    steps: number;
    currentStep: number;
}

export function ScrollProgressBar({ steps, currentStep }: ScrollProgressBarProps) {
    return (
        <div className="fixed right-8 top-1/2 -translate-y-1/2 z-50 hidden lg:block">
            <div className="flex flex-col items-center gap-2">
                {Array.from({ length: steps }).map((_, i) => (
                    <div
                        key={i}
                        className={`w-3 h-3 rounded-full transition-all duration-300 ${i <= currentStep
                            ? "bg-primary scale-125 shadow-lg shadow-primary/50"
                            : "bg-gray-300"
                            }`}
                    />
                ))}
            </div>
        </div>
    );
}
