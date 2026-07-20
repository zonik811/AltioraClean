"use client";

import { useRef } from "react";
import type { Cotizacion } from "@/types";
import { formatearPrecio, formatearFecha } from "@/lib/utils";

interface Props {
    cotizacion: Cotizacion;
    logoUrl?: string;
    empresaNombre?: string;
    empresaDireccion?: string;
    empresaTelefono?: string;
    empresaEmail?: string;
}

export function PDFPreview({ cotizacion, logoUrl, empresaNombre = "AltioraClean", empresaDireccion, empresaTelefono, empresaEmail }: Props) {
    const ref = useRef<HTMLDivElement>(null);
    return (
        <div ref={ref} id="pdf-content" className="bg-white p-8 rounded-lg border shadow-sm" style={{ width: "210mm", minHeight: "297mm" }}>
            {/* Header */}
            <div className="flex justify-between items-start border-b pb-6 mb-6">
                <div>
                    {logoUrl ? (
                        <img src={logoUrl} alt="Logo" className="h-16 mb-2 object-contain" />
                    ) : (
                        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-teal-500 rounded-xl flex items-center justify-center mb-2">
                            <span className="text-2xl font-bold text-white">AC</span>
                        </div>
                    )}
                    <h2 className="text-xl font-bold text-gray-900">{empresaNombre}</h2>
                    {empresaDireccion && <p className="text-sm text-gray-500">{empresaDireccion}</p>}
                    {empresaTelefono && <p className="text-sm text-gray-500">Tel: {empresaTelefono}</p>}
                    {empresaEmail && <p className="text-sm text-gray-500">{empresaEmail}</p>}
                </div>
                <div className="text-right">
                    <h1 className="text-3xl font-bold text-primary mb-2">COTIZACIÓN</h1>
                    <p className="text-sm text-gray-500">No. {cotizacion.$id.slice(0, 8).toUpperCase()}</p>
                    <p className="text-sm text-gray-500">Fecha: {formatearFecha(cotizacion.createdAt)}</p>
                    {cotizacion.fechaVencimiento && (
                        <p className="text-sm text-gray-500">Válida hasta: {formatearFecha(cotizacion.fechaVencimiento)}</p>
                    )}
                </div>
            </div>

            {/* Cliente info */}
            <div className="mb-6">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Cliente</h3>
                <p className="font-semibold text-gray-900">{cotizacion.nombre}</p>
                <p className="text-sm text-gray-600">{cotizacion.email}</p>
                <p className="text-sm text-gray-600">{cotizacion.telefono}</p>
                {cotizacion.direccion && <p className="text-sm text-gray-600">{cotizacion.direccion}</p>}
            </div>

            {/* Items */}
            <table className="w-full mb-6">
                <thead>
                    <tr className="border-y-2 border-gray-200">
                        <th className="text-left py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Concepto</th>
                        <th className="text-center py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Cant.</th>
                        <th className="text-right py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">P. Unit.</th>
                        <th className="text-right py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Total</th>
                    </tr>
                </thead>
                <tbody>
                    {cotizacion.items.map((item, i) => (
                        <tr key={i} className="border-b border-gray-100">
                            <td className="py-3">
                                <p className="font-medium text-gray-900">{item.concepto}</p>
                                {item.descripcion && <p className="text-xs text-gray-500">{item.descripcion}</p>}
                            </td>
                            <td className="text-center py-3 text-gray-700">{item.cantidad}</td>
                            <td className="text-right py-3 text-gray-700">{formatearPrecio(item.precioUnitario)}</td>
                            <td className="text-right py-3 font-medium text-gray-900">{formatearPrecio(item.total)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* Totals */}
            <div className="flex justify-end mb-6">
                <div className="w-64 space-y-2">
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Subtotal</span>
                        <span>{formatearPrecio(cotizacion.subtotal)}</span>
                    </div>
                    {cotizacion.descuento > 0 && (
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Descuento</span>
                            <span className="text-red-500">-{formatearPrecio(cotizacion.descuento)}</span>
                        </div>
                    )}
                    <div className="flex justify-between text-lg font-bold border-t pt-2">
                        <span className="text-gray-900">Total</span>
                        <span className="text-primary">{formatearPrecio(cotizacion.total)}</span>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="border-t pt-6 mt-6">
                {cotizacion.notas && (
                    <div className="mb-4">
                        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Notas</h3>
                        <p className="text-sm text-gray-600 whitespace-pre-wrap">{cotizacion.notas}</p>
                    </div>
                )}
                {cotizacion.terminos && (
                    <div>
                        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Términos</h3>
                        <p className="text-sm text-gray-600 whitespace-pre-wrap">{cotizacion.terminos}</p>
                    </div>
                )}
                <div className="mt-6 text-center text-xs text-gray-400">
                    <p>AltioraClean - Servicios de Limpieza Profesional</p>
                    <p>Esta cotización es válida por {cotizacion.validezDias} días desde su fecha de emisión.</p>
                </div>
            </div>
        </div>
    );
}
