"use client";

import { Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Sidebar } from "@/components/layout/Sidebar";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { usePathname } from "next/navigation";
import styles from "./mobile-sidebar.module.css";

export const MobileSidebar = () => {
    const [open, setOpen] = useState(false);
    const pathname = usePathname();

    const handleOpenChange = (isOpen: boolean) => {
        setOpen(isOpen);
    };

    if (open && pathname) {
        setOpen(false);
    }

    return (
        <Sheet open={open} onOpenChange={handleOpenChange}>
            <SheetTrigger asChild>
                <Button variant="ghost" className={styles.triggerBtn}>
                    <Menu className={styles.menuIcon} />
                </Button>
            </SheetTrigger>
            <SheetContent side="left" className={styles.sheetContent}>
                <Sidebar />
            </SheetContent>
        </Sheet>
    );
};
