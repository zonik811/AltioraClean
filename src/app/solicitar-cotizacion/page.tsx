"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
    Sparkles,
    Building2,
    Zap,
    CheckCircle2,
    Phone,
    Mail,
    MapPin,
    Send,
    Loader2,
} from "lucide-react";
import Link from "next/link";
import { crearLead } from "@/lib/actions/leads";
import { obtenerServiciosPublicos } from "@/lib/actions/servicios";
import { FuenteLead, TipoPropiedad } from "@/types";
import type { Servicio } from "@/types";

const ICONOS_SERVICIO: Record<string, React.ComponentType<{ className?: string }>> = {
    residencial: Sparkles,
    comercial: Building2,
    especializado: Zap,
};

const COLORES_SERVICIO: Record<string, string> = {
    residencial: "from-sky-500 to-blue-600",
    comercial: "from-emerald-500 to-green-600",
    especializado: "from-purple-500 to-violet-600",
};

const TIPOS_PROPIEDAD = [
    { value: TipoPropiedad.CASA, label: "Casa" },
    { value: TipoPropiedad.APARTAMENTO, label: "Apartamento" },
    { value: TipoPropiedad.OFICINA, label: "Oficina" },
    { value: TipoPropiedad.LOCAL, label: "Local Comercial" },
];

export default function SolicitarCotizacionPage() {
    const [servicios, setServicios] = useState<Servicio[]>([]);
    const [loadingServicios, setLoadingServicios] = useState(true);
    const [enviando, setEnviando] = useState(false);
    const [success, setSuccess] = useState(false);

    const [form, setForm] = useState({
        nombre: "",
        email: "",
        telefono: "",
        direccion: "",
        ciudad: "",
        tipoPropiedad: TipoPropiedad.CASA,
        servicioInteresado: "",
        descripcion: "",
    });

    useEffect(() => {
        obtenerServiciosPublicos().then(setServicios).catch(() => {}).finally(() => setLoadingServicios(false));
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.nombre || !form.email || !form.telefono) {
            return;
        }
        setEnviando(true);
        try {
            const result = await crearLead({
                ...form,
                fuente: FuenteLead.WEB,
            });
            if (result.success) {
                setSuccess(true);
            }
        } catch {
            // silently fail
        } finally {
            setEnviando(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center p-4">
                <Card className="max-w-lg w-full text-center border-none shadow-xl">
                    <CardContent className="py-16 px-8">
                        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <CheckCircle2 className="h-10 w-10 text-green-600" />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900 mb-3">¡Solicitud Recibida!</h1>
                        <p className="text-gray-500 mb-8">
                            Hemos recibido tu solicitud de cotización. Nuestro equipo se pondrá en contacto contigo pronto.
                        </p>
                        <div className="flex justify-center gap-4">
                            <Link href="/">
                                <Button variant="outline">Volver al Inicio</Button>
                            </Link>
                            <Link href="/agendar">
                                <Button>Agendar Directamente</Button>
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
            <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-teal-500 rounded-lg flex items-center justify-center">
                            <Sparkles className="h-4 w-4 text-white" />
                        </div>
                        <span className="font-bold text-gray-900">AltioraClean</span>
                    </Link>
                    <Link href="/agendar" className="text-sm text-primary hover:underline">
                        Agendar Cita
                    </Link>
                </div>
            </header>

            <div className="max-w-3xl mx-auto px-4 py-12">
                <div className="text-center mb-10">
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">Solicita tu Cotización</h1>
                    <p className="text-lg text-gray-600 max-w-xl mx-auto">
                        Cuéntanos qué necesitas y te enviaremos una cotización personalizada sin compromiso.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <Card className="border-none shadow-lg">
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <span className="w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">1</span>
                                Tus Datos
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2">
                                <label className="text-sm font-medium text-gray-700 mb-1 block">Nombre completo *</label>
                                <Input value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} placeholder="Tu nombre" required />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700 mb-1 block">
                                    <Mail className="h-3.5 w-3.5 inline mr-1 text-gray-400" /> Email *
                                </label>
                                <Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="correo@ejemplo.com" required />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700 mb-1 block">
                                    <Phone className="h-3.5 w-3.5 inline mr-1 text-gray-400" /> Teléfono *
                                </label>
                                <Input value={form.telefono} onChange={e => setForm({ ...form, telefono: e.target.value })} placeholder="300 123 4567" required />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700 mb-1 block">
                                    <MapPin className="h-3.5 w-3.5 inline mr-1 text-gray-400" /> Ciudad
                                </label>
                                <Input value={form.ciudad} onChange={e => setForm({ ...form, ciudad: e.target.value })} placeholder="Tu ciudad" />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700 mb-1 block">Dirección</label>
                                <Input value={form.direccion} onChange={e => setForm({ ...form, direccion: e.target.value })} placeholder="Dirección del servicio" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-lg">
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <span className="w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">2</span>
                                Tipo de Propiedad
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                {TIPOS_PROPIEDAD.map((tipo) => (
                                    <button
                                        key={tipo.value}
                                        type="button"
                                        onClick={() => setForm({ ...form, tipoPropiedad: tipo.value as TipoPropiedad })}
                                        className={`p-4 rounded-xl border-2 text-center transition-all ${
                                            form.tipoPropiedad === tipo.value
                                                ? "border-primary bg-primary/5"
                                                : "border-gray-200 hover:border-gray-300 bg-white"
                                        }`}
                                    >
                                        <p className="text-sm font-medium text-gray-900">{tipo.label}</p>
                                    </button>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {!loadingServicios && servicios.length > 0 && (
                        <Card className="border-none shadow-lg">
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <span className="w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">3</span>
                                    Servicio de Interés
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {servicios.filter(s => s.activo).map((servicio) => {
                                        const Icon = ICONOS_SERVICIO[servicio.categoria] || Sparkles;
                                        const color = COLORES_SERVICIO[servicio.categoria] || "from-sky-500 to-blue-600";
                                        const selected = form.servicioInteresado === servicio.$id;
                                        return (
                                            <button
                                                key={servicio.$id}
                                                type="button"
                                                onClick={() => setForm({ ...form, servicioInteresado: selected ? "" : servicio.$id })}
                                                className={`p-4 rounded-xl border-2 text-left transition-all ${
                                                    selected ? "border-primary bg-primary/5 ring-2 ring-primary/20" : "border-gray-200 hover:border-gray-300 bg-white"
                                                }`}
                                            >
                                                <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${color} flex items-center justify-center mb-3`}>
                                                    <Icon className="h-5 w-5 text-white" />
                                                </div>
                                                <p className="font-medium text-sm text-gray-900">{servicio.nombre}</p>
                                                <p className="text-xs text-gray-500 mt-1 line-clamp-2">{servicio.descripcionCorta}</p>
                                            </button>
                                        );
                                    })}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    <Card className="border-none shadow-lg">
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <span className="w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">4</span>
                                Detalles Adicionales
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <label className="text-sm font-medium text-gray-700 mb-1 block">Descripción del servicio que necesitas</label>
                            <textarea
                                value={form.descripcion}
                                onChange={e => setForm({ ...form, descripcion: e.target.value })}
                                rows={4}
                                placeholder="Describe el servicio que estás buscando, superficie aproximada, frecuencia deseada, etc."
                                className="w-full rounded-xl border border-input px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                            />
                        </CardContent>
                    </Card>

                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-6 rounded-xl shadow-lg border border-gray-100">
                        <p className="text-sm text-gray-500">
                            Al enviar, un asesor te contactará con una cotización personalizada.
                        </p>
                        <Button type="submit" size="lg" disabled={enviando || !form.nombre || !form.email || !form.telefono}
                            className="bg-gradient-to-r from-blue-500 to-teal-500 hover:from-blue-600 hover:to-teal-600 text-white shadow-lg shadow-primary/20 min-w-[200px]">
                            {enviando ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                            {enviando ? "Enviando..." : "Solicitar Cotización"}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
