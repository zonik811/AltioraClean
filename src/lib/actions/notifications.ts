"use server";

import webpush from "web-push";
import { databases } from "@/lib/appwrite-admin";
import { DATABASE_ID } from "@/lib/appwrite";
import { Query, ID } from "node-appwrite";

// Configure web-push
const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim()!;
const privateKey = process.env.VAPID_PRIVATE_KEY?.trim()!;

// Configure web-push
try {
    if (publicKey && privateKey) {
        webpush.setVapidDetails(
            "mailto:admin@altioraclean.com",
            publicKey,
            privateKey
        );
    } else {
        console.warn("VAPID keys missing, push notifications disabled.");
    }
} catch (error) {
    console.warn("Failed to initialize Web Push (check VAPID keys):", error);
}

const COLLECTION_SUBSCRIPTIONS = "push_subscriptions"; // Ensure this matches your Appwrite Collection ID

export interface PushSubscriptionData {
    endpoint: string;
    keys: {
        p256dh: string;
        auth: string;
    };
}

/**
 * Save a new subscription to Appwrite
 */
export async function subscribeUser(subscription: PushSubscriptionData, userId?: string) {
    try {
        // Check if subscription already exists (deduplication)
        const existing = await databases.listDocuments(
            DATABASE_ID,
            COLLECTION_SUBSCRIPTIONS,
            [Query.equal("endpoint", subscription.endpoint)]
        );

        if (existing.documents.length > 0) {
            // Update userId if changed or just return success
            if (userId && existing.documents[0].userId !== userId) {
                await databases.updateDocument(DATABASE_ID, COLLECTION_SUBSCRIPTIONS, existing.documents[0].$id, {
                    userId: userId
                });
            }
            return { success: true, message: "Already subscribed" };
        }

        // Create new
        await databases.createDocument(DATABASE_ID, COLLECTION_SUBSCRIPTIONS, ID.unique(), {
            endpoint: subscription.endpoint,
            keys: JSON.stringify(subscription.keys),
            userId: userId || null,
            userAgent: "Web Client"
        });

        return { success: true };
    } catch (error) {
        console.error("Error saving subscription:", error);
        return { success: false, error: "Failed to save subscription" };
    }
}

/**
 * Unsubscribe (remove from DB)
 */
export async function unsubscribeUser(endpoint: string) {
    try {
        const existing = await databases.listDocuments(
            DATABASE_ID,
            COLLECTION_SUBSCRIPTIONS,
            [Query.equal("endpoint", endpoint)]
        );

        if (existing.documents.length > 0) {
            await databases.deleteDocument(DATABASE_ID, COLLECTION_SUBSCRIPTIONS, existing.documents[0].$id);
        }
        return { success: true };
    } catch (error) {
        console.error("Error removing subscription:", error);
        return { success: false };
    }
}

/**
 * Send Notification to all or specific user
 */
export async function sendNotification(message: string, title: string = "Notificación", userId?: string) {
    try {
        let filters = [];
        if (userId) {
            filters.push(Query.equal("userId", userId));
        }

        const subscriptions = await databases.listDocuments(DATABASE_ID, COLLECTION_SUBSCRIPTIONS, filters);

        const payload = JSON.stringify({ title, body: message });

        const promises = subscriptions.documents.map(async (doc) => {
            const sub = {
                endpoint: doc.endpoint,
                keys: JSON.parse(doc.keys)
            };

            try {
                await webpush.sendNotification(sub, payload);
            } catch (err: any) {
                if (err.statusCode === 410 || err.statusCode === 404) {
                    // Subscription expired/invalid, remove from DB
                    await databases.deleteDocument(DATABASE_ID, COLLECTION_SUBSCRIPTIONS, doc.$id);
                } else {
                    console.error("Error sending push:", err);
                }
            }
        });

        await Promise.all(promises);
        return { success: true, count: promises.length };
    } catch (error) {
        console.error("Error sending notifications:", error);
        return { success: false, error: "Failed to send" };
    }
}
