"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, FileDown } from "lucide-react";
import { toast } from "sonner";
import type { Cotizacion } from "@/types";

interface Props {
    cotizacion: Cotizacion;
}

export function GenerarPDFButton({ cotizacion }: Props) {
    const [generando, setGenerando] = useState(false);

    const generarPDF = async () => {
        setGenerando(true);
        try {
            const html2canvas = (await import("html2canvas")).default;
            const { jsPDF } = await import("jspdf");

            const element = document.getElementById("pdf-content");
            if (!element) {
                toast.error("No se encontró el contenido para PDF");
                return;
            }

            const canvas = await html2canvas(element, {
                scale: 2,
                useCORS: true,
                logging: false,
                backgroundColor: "#ffffff",
            });

            const imgData = canvas.toDataURL("image/png");
            const pdf = new jsPDF("p", "mm", "a4");
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

            let heightLeft = pdfHeight;
            let position = 0;
            const pageHeight = pdf.internal.pageSize.getHeight();

            pdf.addImage(imgData, "PNG", 0, position, pdfWidth, pdfHeight);
            heightLeft -= pageHeight;

            while (heightLeft > 0) {
                position = heightLeft - pdfHeight;
                pdf.addPage();
                pdf.addImage(imgData, "PNG", 0, position, pdfWidth, pdfHeight);
                heightLeft -= pageHeight;
            }

            const nombre = `cotizacion-${cotizacion.$id.slice(0, 8)}.pdf`;
            pdf.save(nombre);

            toast.success("PDF generado exitosamente");
        } catch (error) {
            console.error("Error generando PDF:", error);
            toast.error("Error al generar el PDF");
        } finally {
            setGenerando(false);
        }
    };

    return (
        <Button onClick={generarPDF} disabled={generando} className="bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20">
            {generando ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generando...</>
            ) : (
                <><FileDown className="mr-2 h-4 w-4" /> Descargar PDF</>
            )}
        </Button>
    );
}
