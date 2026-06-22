"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Sparkles, Menu, X, LogIn } from "lucide-react";
import { cn } from "@/lib/utils";
import styles from "./marketing-navbar.module.css";

export function MarketingNavbar() {
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const navLinks = [
        { name: "Inicio", href: "#" },
        { name: "Servicios", href: "#servicios" },
        { name: "Equipo", href: "#equipo" },
        { name: "Testimonios", href: "#testimonios" },
    ];

    return (
        <nav className={cn(styles.nav, isScrolled ? styles.navScrolled : styles.navTransparent)}>
            <div className={styles.container}>
                <div className={styles.inner}>
                    <Link href="/" className={styles.logo}>
                        <div className={cn(styles.logoIcon, isScrolled ? styles.logoIconScrolled : styles.logoIconTransparent)}>
                            <Sparkles className={cn(styles.logoIconSvg, isScrolled ? styles.logoIconSvgScrolled : styles.logoIconSvgTransparent)} />
                        </div>
                        <span className={cn(styles.logoText, isScrolled ? styles.logoTextScrolled : styles.logoTextTransparent)}>
                            Altiora<span className={isScrolled ? styles.logoHighlight : styles.logoHighlightTransparent}>Clean</span>
                        </span>
                    </Link>

                    <div className={styles.desktopNav}>
                        {navLinks.map((link) => (
                            <Link
                                key={link.name}
                                href={link.href}
                                className={cn(styles.navLink, isScrolled ? styles.navLinkScrolled : styles.navLinkTransparent)}
                            >
                                {link.name}
                            </Link>
                        ))}
                    </div>

                    <div className={styles.desktopActions}>
                        <Link href="/login">
                            <Button
                                variant="ghost"
                                className={cn(styles.ghostBtn, isScrolled ? styles.ghostBtnScrolled : styles.ghostBtnTransparent)}
                            >
                                <LogIn className="w-4 h-4 mr-2" />
                                Ingresar
                            </Button>
                        </Link>
                        <Link href="/agendar">
                            <Button className={cn(styles.primaryBtn, isScrolled ? styles.primaryBtnScrolled : styles.primaryBtnTransparent)}>
                                Agendar Cita
                            </Button>
                        </Link>
                    </div>

                    <button
                        className={styles.mobileMenuBtn}
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    >
                        {isMobileMenuOpen ? (
                            <X className={cn(styles.mobileMenuIcon, isScrolled ? styles.mobileMenuIconScrolled : styles.mobileMenuIconTransparent)} />
                        ) : (
                            <Menu className={cn(styles.mobileMenuIcon, isScrolled ? styles.mobileMenuIconScrolled : styles.mobileMenuIconTransparent)} />
                        )}
                    </button>
                </div>
            </div>

            {isMobileMenuOpen && (
                <div className={styles.mobileMenu}>
                    <div className={styles.mobileLinks}>
                        {navLinks.map((link) => (
                            <Link
                                key={link.name}
                                href={link.href}
                                className={styles.mobileLink}
                                onClick={() => setIsMobileMenuOpen(false)}
                            >
                                {link.name}
                            </Link>
                        ))}
                        <hr className={styles.mobileDivider} />
                        <Link href="/login" onClick={() => setIsMobileMenuOpen(false)}>
                            <Button variant="ghost" className="w-full justify-start">
                                <LogIn className="w-4 h-4 mr-2" />
                                Iniciar Sesión
                            </Button>
                        </Link>
                        <Link href="/agendar" onClick={() => setIsMobileMenuOpen(false)}>
                            <Button className="w-full bg-primary mb-2">
                                Agendar Cita
                            </Button>
                        </Link>
                    </div>
                </div>
            )}
        </nav>
    );
}
