"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    Calendar,
    MapPin,
    UserCircle,
    Sparkles,
    LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/hooks/useAuth";
import styles from "./sidebar.module.css";

const navigation = [
    { name: "Dashboard", href: "/portal/dashboard", icon: LayoutDashboard },
    { name: "Mis Servicios", href: "/portal/servicios", icon: Calendar },
    { name: "Direcciones", href: "/portal/direcciones", icon: MapPin },
    { name: "Mi Perfil", href: "/portal/perfil", icon: UserCircle },
];

export function ClientSidebar() {
    const pathname = usePathname();
    const { logout, user } = useAuth();

    const handleLogout = async () => {
        try {
            await logout();
            window.location.href = "/login";
        } catch (error) {
            console.error("Error cerrando sesión:", error);
        }
    };

    const isActiveLink = (href: string) => {
        if (href === "/portal/dashboard") return pathname === href;
        return pathname.startsWith(href + "/") || pathname === href;
    };

    return (
        <div className={styles.sidebar}>
            <div className={styles.logoArea}>
                <div className={styles.logoInner}>
                    <div className={styles.logoIcon}>
                        <Sparkles className={styles.logoIconSvg} />
                    </div>
                    <div>
                        <h1 className={styles.logoTitle}>AltioraClean</h1>
                        <p className={styles.logoSubtitle}>Mi Portal</p>
                    </div>
                </div>
            </div>

            <nav className={styles.nav}>
                {navigation.map((item) => {
                    const isActive = isActiveLink(item.href);
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={`${styles.navLink} ${
                                isActive
                                    ? styles.navLinkActive
                                    : styles.navLinkInactive
                            }`}
                        >
                            <item.icon className={styles.navIcon} />
                            <span className={styles.navLabel}>{item.name}</span>
                        </Link>
                    );
                })}
            </nav>

            <div className={styles.userArea}>
                <div className={styles.userInfo}>
                    <div className={styles.userDetails}>
                        <p className={styles.userName}>
                            {user?.name || user?.email || "Cliente"}
                        </p>
                        <p className={styles.userEmail}>{user?.email}</p>
                    </div>
                </div>
                <Button
                    onClick={handleLogout}
                    variant="outline"
                    className={styles.logoutBtn}
                >
                    <LogOut className="h-4 w-4 mr-2" />
                    Cerrar Sesión
                </Button>
            </div>
        </div>
    );
}
