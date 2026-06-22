"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { sendNotification } from "@/lib/actions/notifications";
import { useAuth } from "@/lib/hooks/useAuth";
import { BellRing, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import styles from "./test-notification.module.css";

export function TestNotification() {
    const [loading, setLoading] = useState(false);
    const { user } = useAuth();
    const [success, setSuccess] = useState(false);

    const handleTest = async () => {
        if (!user?.$id) return;

        setLoading(true);
        try {
            const result = await sendNotification(
                "¡Hola! Esta es una notificación de prueba desde el Panel Admin.",
                "Prueba de Sistema",
                user.$id
            );

            if (result.success) {
                setSuccess(true);
                setTimeout(() => setSuccess(false), 3000);
            } else {
                console.error("Error envío:", result.error);
                toast.error("Error enviando notificación");
            }
        } catch (error) {
            console.error("Error:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Button
            onClick={handleTest}
            disabled={loading}
            variant="outline"
            size="sm"
            className={styles.button}
        >
            {loading ? (
                <Loader2 className={styles.iconLoading} />
            ) : success ? (
                <CheckCircle2 className={styles.iconSuccess} />
            ) : (
                <BellRing className={styles.icon} />
            )}
            {success ? "Enviado" : "Probar Push"}
        </Button>
    );
}
