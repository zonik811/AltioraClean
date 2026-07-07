"use client";

import { useState, useEffect } from "react";
import { subscribeUser, unsubscribeUser } from "@/lib/actions/notifications";
import { useAuth } from "@/lib/hooks/useAuth";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

function urlBase64ToUint8Array(base64String: string) {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
        .replace(/\-/g, "+")
        .replace(/_/g, "/");

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

export function usePushNotifications() {
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [subscription, setSubscription] = useState<PushSubscription | null>(null);
    const [loading, setLoading] = useState(true);
    const [permission, setPermission] = useState<NotificationPermission>("default");
    const { user } = useAuth();

    useEffect(() => {
        if (typeof window !== "undefined" && "serviceWorker" in navigator) {
            setPermission(Notification.permission);
            navigator.serviceWorker.ready.then((registration) => {
                registration.pushManager.getSubscription().then((sub) => {
                    if (sub) {
                        setSubscription(sub);
                        setIsSubscribed(true);
                    }
                    setLoading(false);
                });
            });
        } else {
            setLoading(false);
        }
    }, []);

    const subscribe = async () => {
        if (!VAPID_PUBLIC_KEY) {
            console.error("VAPID Public Key not found");
            return;
        }

        setLoading(true);
        try {
            const registration = await navigator.serviceWorker.ready;
            const sub = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
            });

            setSubscription(sub);
            setIsSubscribed(true);
            setPermission(Notification.permission);

            // Save to database
            const subData = {
                endpoint: sub.endpoint,
                keys: {
                    p256dh: sub.toJSON().keys?.p256dh || "",
                    auth: sub.toJSON().keys?.auth || "",
                },
            };

            await subscribeUser(subData, user?.$id);
        } catch (error) {
            console.error("Failed to subscribe:", error);
            setPermission(Notification.permission);
        } finally {
            setLoading(false);
        }
    };

    const unsubscribe = async () => {
        if (!subscription) return;

        setLoading(true);
        try {
            await subscription.unsubscribe();
            // Remove from database
            await unsubscribeUser(subscription.endpoint);

            setSubscription(null);
            setIsSubscribed(false);
        } catch (error) {
            console.error("Failed to unsubscribe:", error);
        } finally {
            setLoading(false);
        }
    };

    return {
        isSubscribed,
        subscribe,
        unsubscribe,
        loading,
        permission,
    };
}
