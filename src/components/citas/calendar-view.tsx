"use client";

import { useState } from "react";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, addMonths, subMonths, addWeeks, subWeeks } from "date-fns";
import { es } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Cita, EstadoCita, Empleado } from "@/types";
import { nombreCompleto } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { obtenerURLArchivo } from "@/lib/appwrite";
import Link from "next/link";
import styles from "./calendar-view.module.css";

interface CalendarViewProps {
    citas: Cita[];
    empleadosMap: Record<string, Empleado>;
}

type ViewMode = "month" | "week";

const estadoStyles: Partial<Record<EstadoCita, string>> = {
    [EstadoCita.PENDIENTE]: "bg-amber-100 border-amber-200 text-amber-700 hover:bg-amber-200",
    [EstadoCita.CONFIRMADA]: "bg-blue-100 border-blue-200 text-blue-700 hover:bg-blue-200",
    [EstadoCita.COMPLETADA]: "bg-emerald-100 border-emerald-200 text-emerald-700 hover:bg-emerald-200",
    [EstadoCita.CANCELADA]: "bg-rose-100 border-rose-200 text-rose-700 hover:bg-rose-200",
};

export function CalendarView({ citas, empleadosMap }: CalendarViewProps) {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [viewMode, setViewMode] = useState<ViewMode>("month");

    const next = () => {
        if (viewMode === "month") {
            setCurrentDate(addMonths(currentDate, 1));
        } else {
            setCurrentDate(addWeeks(currentDate, 1));
        }
    };

    const prev = () => {
        if (viewMode === "month") {
            setCurrentDate(subMonths(currentDate, 1));
        } else {
            setCurrentDate(subWeeks(currentDate, 1));
        }
    };

    const today = () => setCurrentDate(new Date());

    const days = viewMode === "month"
        ? eachDayOfInterval({
            start: startOfWeek(startOfMonth(currentDate), { weekStartsOn: 1 }),
            end: endOfWeek(endOfMonth(currentDate), { weekStartsOn: 1 })
        })
        : eachDayOfInterval({
            start: startOfWeek(currentDate, { weekStartsOn: 1 }),
            end: endOfWeek(currentDate, { weekStartsOn: 1 })
        });

    const getCitasForDay = (date: Date) => {
        const dateStr = format(date, "yyyy-MM-dd");
        return citas.filter(cita => {
            return cita.fechaCita && cita.fechaCita.split("T")[0] === dateStr;
        }).sort((a, b) => a.horaCita.localeCompare(b.horaCita));
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div className={styles.navGroup}>
                    <Button variant="outline" size="icon" onClick={prev} className={styles.navButton}>
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <h2 className={styles.title}>
                        {format(currentDate, viewMode === "month" ? "MMMM yyyy" : "'Semana del' d", { locale: es })}
                    </h2>
                    <Button variant="outline" size="icon" onClick={next} className={styles.navButton}>
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>

                <div className={styles.controls}>
                    <Button variant="ghost" onClick={today} className="text-sm">
                        Hoy
                    </Button>
                    <div className={styles.viewToggle}>
                        <button
                            onClick={() => setViewMode("month")}
                            className={`${styles.viewToggleBtn} ${viewMode === "month" ? styles.viewToggleActive : styles.viewToggleInactive}`}
                        >
                            Mes
                        </button>
                        <button
                            onClick={() => setViewMode("week")}
                            className={`${styles.viewToggleBtn} ${viewMode === "week" ? styles.viewToggleActive : styles.viewToggleInactive}`}
                        >
                            Semana
                        </button>
                    </div>
                </div>
            </div>

            <Card className={styles.gridCard}>
                <div className={styles.dayHeaders}>
                    {["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map(day => (
                        <div key={day} className={styles.dayHeader}>
                            {day}
                        </div>
                    ))}
                </div>

                <div className={`${styles.grid} ${viewMode === "month" ? styles.gridMonth : styles.gridWeek}`}>
                    {days.map((day, idx) => {
                        const dayCitas = getCitasForDay(day);
                        const isToday = isSameDay(day, new Date());
                        const isCurrentMonth = isSameMonth(day, currentDate);

                        return (
                            <div
                                key={day.toString()}
                                className={`
                                    ${styles.dayCell}
                                    ${!isCurrentMonth && viewMode === "month" ? styles.dayCellOutside : styles.dayCellInside}
                                    ${idx % 7 === 6 ? "border-r-0" : ""}
                                `}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <span className={`${styles.dayNumber} ${isToday ? styles.dayNumberToday : styles.dayNumberNormal}`}>
                                        {format(day, "d")}
                                    </span>
                                    {dayCitas.length > 0 && <span className={styles.citaCount}>{dayCitas.length} citas</span>}
                                </div>

                                <div className="space-y-1.5">
                                    {dayCitas.map(cita => (
                                        <Link href={`/admin/citas/${cita.$id}`} key={cita.$id}>
                                            <div className={`${styles.citaItem} ${estadoStyles[cita.estado] || ""}`}>
                                                <div className={styles.citaHeader}>
                                                    <span className={styles.citaTime}>
                                                        <Clock className={styles.citaTimeIcon} />
                                                        {cita.horaCita}
                                                    </span>
                                                </div>
                                                <div className={styles.citaClient} title={cita.clienteNombre}>
                                                    {cita.clienteNombre}
                                                </div>

                                                {cita.empleadosAsignados && cita.empleadosAsignados.length > 0 && (
                                                    <div className={styles.avatarGroup}>
                                                        {cita.empleadosAsignados.slice(0, 3).map((empId, i) => {
                                                            const emp = empleadosMap[empId];
                                                            if (!emp) return null;
                                                            return (
                                                                <Avatar key={i} className={styles.avatarMini}>
                                                                    {emp.foto && <AvatarImage src={obtenerURLArchivo(emp.foto)} />}
                                                                    <AvatarFallback className={styles.avatarFallbackMini}>
                                                                        {emp.nombre?.[0]}{emp.apellido?.[0]}
                                                                    </AvatarFallback>
                                                                </Avatar>
                                                            )
                                                        })}
                                                    </div>
                                                )}
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </Card>
        </div>
    );
}
