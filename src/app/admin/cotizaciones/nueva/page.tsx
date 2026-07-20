"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
    crearCotizacion,
} from "@/lib/actions/cotizaciones";
import { obtenerLead } from "@/lib/actions/leads";
import { obtenerServiciosPublicos } from "@/lib/actions/servicios";
import type { Servicio, ItemCotizacion } from "@/types";
import { EstadoCotizacion } from "@/types";
import { toast } from "sonner";
import { formatearPrecio } from "@/lib/utils";
import {
    ArrowLeft,
    Plus,
    Trash2,
    Loader2,
    FileText,
    Save,
} from "lucide-react";
import Link from "next/link";

interface FormState {
    nombre: string;
    email: string;
    telefono: string;
    direccion: string;
    ciudad: string;
    servicioId: string;
    servicioNombre: string;
    servicioDescripcion: string;
    notas: string;
    terminos: string;
    validezDias: number;
    items: ItemCotizacion[];
    descuento: number;
}

const ITEM_DEFAULTS = { concepto: "", descripcion: "", cantidad: 1, precioUnitario: 0, total: 0 };

export default function NuevaCotizacionPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const leadId = searchParams.get("leadId");

    const [loading, setLoading] = useState(true);
    const [guardando, setGuardando] = useState(false);
    const [servicios, setServicios] = useState<Servicio[]>([]);

    const [form, setForm] = useState<FormState>({
        nombre: "", email: "", telefono: "", direccion: "", ciudad: "",
        servicioId: "", servicioNombre: "", servicioDescripcion: "",
        notas: "", terminos: "", validezDias: 30,
        items: [{ ...ITEM_DEFAULTS }],
        descuento: 0,
    });

    useEffect(() => {
        const init = async () => {
            try {
                const [serviciosData] = await Promise.all([
                    obtenerServiciosPublicos(),
                ]);
                setServicios(serviciosData);

                if (leadId) {
                    const lead = await obtenerLead(leadId);
                    if (lead) {
                        setForm(prev => ({
                            ...prev,
                            nombre: lead.nombre,
                            email: lead.email,
                            telefono: lead.telefono,
                            direccion: lead.direccion || "",
                            ciudad: lead.ciudad || "",
                            servicioId: lead.servicioInteresado || "",
                        }));
                    }
                }
            } catch {
                toast.error("Error al cargar datos");
            } finally {
                setLoading(false);
            }
        };
        init();
    }, [leadId]);

    const handleItemChange = (index: number, field: keyof ItemCotizacion, value: string | number) => {
        setForm(prev => {
            const items = [...prev.items];
            const item = { ...items[index] };

            if (field === "cantidad" || field === "precioUnitario") {
                const numVal = typeof value === "string" ? parseFloat(value) || 0 : value;
                (item as Record<string, unknown>)[field] = numVal;
                item.total = item.cantidad * item.precioUnitario;
            } else {
                (item as Record<string, unknown>)[field] = value;
            }

            items[index] = item;
            const subtotal = items.reduce((s, i) => s + i.total, 0);
            const total = Math.max(0, subtotal - prev.descuento);
            return { ...prev, items, subtotal, total };
        });
    };

    const agregarItem = () => {
        setForm(prev => ({
            ...prev,
            items: [...prev.items, { ...ITEM_DEFAULTS }],
        }));
    };

    const eliminarItem = (index: number) => {
        setForm(prev => {
            const items = prev.items.filter((_, i) => i !== index);
            if (items.length === 0) items.push({ ...ITEM_DEFAULTS });
            const subtotal = items.reduce((s, i) => s + i.total, 0);
            const total = Math.max(0, subtotal - prev.descuento);
            return { ...prev, items, subtotal, total };
        });
    };

    const seleccionarServicio = (servicioId: string) => {
        const servicio = servicios.find(s => s.$id === servicioId);
        if (!servicio) return;

        setForm(prev => {
            const nuevoItem: ItemCotizacion = {
                concepto: servicio.nombre,
                descripcion: servicio.descripcionCorta,
                cantidad: 1,
                precioUnitario: servicio.precioBase,
                total: servicio.precioBase,
            };
            const items = [...prev.items.filter(i => i.concepto !== servicio.nombre), nuevoItem];
            const subtotal = items.reduce((s, i) => s + i.total, 0);
            return {
                ...prev,
                servicioId,
                servicioNombre: servicio.nombre,
                servicioDescripcion: servicio.descripcionCorta,
                items,
                subtotal,
                total: Math.max(0, subtotal - prev.descuento),
            };
        });
    };

    const handleGuardar = async () => {
        if (!form.nombre || !form.email || !form.telefono) {
            toast.error("Nombre, email y teléfono son requeridos");
            return;
        }
        const itemsValidos = form.items.filter(i => i.concepto && i.precioUnitario > 0);
        if (itemsValidos.length === 0) {
            toast.error("Agrega al menos un item a la cotización");
            return;
        }

        setGuardando(true);
        try {
            const subtotal = itemsValidos.reduce((s, i) => s + i.total, 0);
            const total = Math.max(0, subtotal - form.descuento);
            const result = await crearCotizacion({
                leadId: leadId || undefined,
                nombre: form.nombre,
                email: form.email,
                telefono: form.telefono,
                direccion: form.direccion,
                ciudad: form.ciudad,
                servicioId: form.servicioId,
                servicioNombre: form.servicioNombre,
                servicioDescripcion: form.servicioDescripcion,
                items: itemsValidos,
                subtotal,
                descuento: form.descuento,
                total,
                notas: form.notas,
                terminos: form.terminos,
                validezDias: form.validezDias,
                estado: EstadoCotizacion.BORRADOR,
            });

            if (result.success && result.data) {
                toast.success("Cotización creada");
                router.push(`/admin/cotizaciones/${result.data.$id}`);
            } else {
                toast.error(result.error || "Error al crear cotización");
            }
        } catch {
            toast.error("Error al guardar");
        } finally {
            setGuardando(false);
        }
    };

    if (loading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-96" />
            </div>
        );
    }

    const subtotal = form.items.reduce((s, i) => s + i.total, 0);
    const total = Math.max(0, subtotal - form.descuento);

    return (
        <div className="space-y-6 animate-in fade-in duration-500 max-w-4xl mx-auto">
            <div className="flex items-center gap-4">
                <Link href="/admin/cotizaciones" className="text-gray-400 hover:text-gray-600">
                    <ArrowLeft className="h-5 w-5" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Nueva Cotización</h1>
                    <p className="text-gray-500 text-sm">Crea una cotización para un cliente o lead</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader><CardTitle className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Información del Cliente</CardTitle></CardHeader>
                        <CardContent className="grid grid-cols-2 gap-4">
                            <div className="col-span-2">
                                <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Nombre *</label>
                                <Input value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} placeholder="Nombre completo" />
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Email *</label>
                                <Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="correo@ejemplo.com" />
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Teléfono *</label>
                                <Input value={form.telefono} onChange={e => setForm({ ...form, telefono: e.target.value })} placeholder="300 123 4567" />
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Dirección</label>
                                <Input value={form.direccion} onChange={e => setForm({ ...form, direccion: e.target.value })} placeholder="Dirección" />
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Ciudad</label>
                                <Input value={form.ciudad} onChange={e => setForm({ ...form, ciudad: e.target.value })} placeholder="Ciudad" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Items</CardTitle>
                            <div className="flex items-center gap-2">
                                <select onChange={e => { if (e.target.value) { seleccionarServicio(e.target.value); e.target.value = ""; } }}
                                    className="text-xs px-2 py-1 rounded border text-gray-600">
                                    <option value="">+ Agregar desde servicio</option>
                                    {servicios.map(s => <option key={s.$id} value={s.$id}>{s.nombre} - {formatearPrecio(s.precioBase)}</option>)}
                                </select>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {form.items.map((item, i) => (
                                    <div key={i} className="flex items-start gap-3 p-3 rounded-lg border bg-gray-50/50">
                                        <div className="flex-1 grid grid-cols-12 gap-2">
                                            <div className="col-span-5">
                                                <label className="text-xs text-gray-400 mb-1 block">Concepto</label>
                                                <Input value={item.concepto} onChange={e => handleItemChange(i, "concepto", e.target.value)} placeholder="Ej: Limpieza General" className="h-9 text-sm" />
                                            </div>
                                            <div className="col-span-3">
                                                <label className="text-xs text-gray-400 mb-1 block">Cantidad</label>
                                                <Input type="number" min={1} value={item.cantidad} onChange={e => handleItemChange(i, "cantidad", e.target.value)} className="h-9 text-sm" />
                                            </div>
                                            <div className="col-span-2">
                                                <label className="text-xs text-gray-400 mb-1 block">P. Unit.</label>
                                                <Input type="number" min={0} value={item.precioUnitario} onChange={e => handleItemChange(i, "precioUnitario", e.target.value)} className="h-9 text-sm" />
                                            </div>
                                            <div className="col-span-2">
                                                <label className="text-xs text-gray-400 mb-1 block">Total</label>
                                                <p className="h-9 flex items-center text-sm font-semibold text-gray-900">
                                                    {formatearPrecio(item.total)}
                                                </p>
                                            </div>
                                        </div>
                                        <Button variant="ghost" size="icon" className="mt-5 h-9 w-9 hover:bg-red-50 text-gray-400 hover:text-red-500" onClick={() => eliminarItem(i)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                                <Button variant="outline" size="sm" onClick={agregarItem} className="w-full">
                                    <Plus className="h-4 w-4 mr-2" /> Agregar Item
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader><CardTitle className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Notas y Términos</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Notas</label>
                                <textarea value={form.notas} onChange={e => setForm({ ...form, notas: e.target.value })} rows={3}
                                    placeholder="Notas adicionales para el cliente..." className="w-full rounded-lg border border-input px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Términos y Condiciones</label>
                                <textarea value={form.terminos} onChange={e => setForm({ ...form, terminos: e.target.value })} rows={2}
                                    placeholder="Ej: Válido por 30 días. Forma de pago: transferencia o efectivo." className="w-full rounded-lg border border-input px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-6">
                    <Card>
                        <CardHeader><CardTitle className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Configuración</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Validez (días)</label>
                                <Input type="number" min={1} value={form.validezDias} onChange={e => setForm({ ...form, validezDias: parseInt(e.target.value) || 30 })} />
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Descuento</label>
                                <Input type="number" min={0} value={form.descuento} onChange={e => {
                                    const d = parseFloat(e.target.value) || 0;
                                    setForm(prev => ({ ...prev, descuento: d, total: Math.max(0, subtotal - d) }));
                                }} />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader><CardTitle className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Resumen</CardTitle></CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Subtotal</span>
                                <span className="font-medium">{formatearPrecio(subtotal)}</span>
                            </div>
                            {form.descuento > 0 && (
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Descuento</span>
                                    <span className="font-medium text-red-500">-{formatearPrecio(form.descuento)}</span>
                                </div>
                            )}
                            <div className="border-t pt-3 flex justify-between text-base">
                                <span className="font-semibold text-gray-900">Total</span>
                                <span className="font-bold text-primary text-lg">{formatearPrecio(total)}</span>
                            </div>
                        </CardContent>
                    </Card>

                    <Button size="lg" className="w-full" onClick={handleGuardar} disabled={guardando}>
                        {guardando ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        Guardar Cotización
                    </Button>
                </div>
            </div>
        </div>
    );
}
