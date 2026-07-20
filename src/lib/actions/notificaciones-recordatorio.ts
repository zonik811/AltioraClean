"use server";

import { databases } from "@/lib/appwrite-admin";
import { getDatabaseId, COLLECTIONS } from "@/lib/appwrite/config";
import { Query } from "node-appwrite";
import { requireAdmin } from "@/lib/auth-server";
import { sendNotification } from "@/lib/actions/notifications";

export async function enviarRecordatoriosProximasCitas() {
    try {
        await requireAdmin();

        const manana = new Date();
        manana.setDate(manana.getDate() + 1);
        const mananaStr = manana.toISOString().split("T")[0];

        const response = await databases.listDocuments(
            getDatabaseId(),
            COLLECTIONS.CITAS,
            [
                Query.equal("fechaCita", mananaStr),
                Query.equal("estado", "pendiente"),
                Query.limit(50),
            ]
        );

        const citas = response.documents;
        let enviadas = 0;

        for (const cita of citas) {
            const email = cita.clienteEmail as string;
            const nombre = cita.clienteNombre as string;
            const hora = cita.horaCita as string;
            const esRecurrente = cita.origen === "plan_recurrente" || !!cita.planId;

            const mensaje = esRecurrente
                ? `Recordatorio: Tienes una visita de tu plan recurrente mañana ${mananaStr} a las ${hora}. ¡Te esperamos!`
                : `Recordatorio: Tienes una cita agendada mañana ${mananaStr} a las ${hora}.`;

            const result = await sendNotification(
                mensaje,
                `Visita ${esRecurrente ? "de tu plan" : "agendada"} — ${nombre}`,
            );

            if (result.success) {
                enviadas += result.count || 0;
            }
        }

        return { success: true, count: enviadas };
    } catch (error: unknown) {
        console.error("Error enviando recordatorios:", error);
        return { success: false, error: error instanceof Error ? error.message : "Error al enviar recordatorios" };
    }
}
