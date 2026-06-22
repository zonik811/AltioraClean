"use client";

import { usePushNotifications } from "@/lib/hooks/usePushNotifications";
import { Button } from "@/components/ui/button";
import { Bell, BellOff, Loader2 } from "lucide-react";
import styles from "./notification-toggle.module.css";

export function NotificationToggle() {
    const { isSubscribed, subscribe, unsubscribe, loading, permission } = usePushNotifications();

    if (permission === 'denied') {
        return (
            <Button variant="ghost" size="icon" disabled title="Notificaciones bloqueadas">
                <BellOff className={styles.iconDenied} />
            </Button>
        );
    }

    if (loading) {
        return (
            <Button variant="ghost" size="icon" disabled>
                <Loader2 className={styles.icon} />
            </Button>
        );
    }

    return (
        <Button
            variant="ghost"
            size="icon"
            onClick={isSubscribed ? unsubscribe : subscribe}
            title={isSubscribed ? "Desactivar notificaciones" : "Activar notificaciones"}
            className={isSubscribed ? styles.active : styles.inactive}
        >
            {isSubscribed ? <Bell className={styles.iconBellActive} /> : <Bell className={styles.iconBell} />}
        </Button>
    );
}
