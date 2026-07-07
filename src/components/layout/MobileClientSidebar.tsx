"use client";

import { Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ClientSidebar } from "@/components/layout/ClientSidebar";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import styles from "./mobile-sidebar.module.css";

export const MobileClientSidebar = () => {
    const [open, setOpen] = useState(false);

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button variant="ghost" className={styles.triggerBtn}>
                    <Menu className={styles.menuIcon} />
                </Button>
            </SheetTrigger>
            <SheetContent side="left" className={styles.sheetContent}>
                <ClientSidebar />
            </SheetContent>
        </Sheet>
    );
};
