import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DollarSign, User, TrendingUp, ArrowRight } from "lucide-react";

export default function PagosPage() {
    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div>
                <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Pagos</h1>
                <p className="text-gray-500 mt-1">Gestión de cobros a clientes y pagos a empleados</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Link href="/admin/pagos/clientes" className="group block">
                    <Card className="border-none shadow-md bg-gradient-to-br from-blue-500 to-indigo-600 text-white overflow-hidden relative transition-all group-hover:shadow-xl group-hover:scale-[1.02]">
                        <div className="absolute top-0 right-0 -mt-4 -mr-4 p-8 bg-white/10 rounded-full blur-2xl" />
                        <CardHeader className="relative z-10">
                            <CardTitle className="text-blue-100 font-medium text-sm flex items-center">
                                <DollarSign className="mr-2 h-4 w-4" /> Cobros a Clientes
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="relative z-10">
                            <p className="text-blue-100/80 text-sm mb-4">
                                Registra y gestiona los pagos recibidos por servicios de limpieza
                            </p>
                            <Button variant="secondary" className="bg-white/20 text-white hover:bg-white/30 border-0 backdrop-blur-sm group-hover:bg-white/30 transition-all">
                                Ir a Cobros <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </CardContent>
                    </Card>
                </Link>

                <Link href="/admin/pagos/empleados" className="group block">
                    <Card className="border-none shadow-md bg-gradient-to-br from-emerald-500 to-teal-600 text-white overflow-hidden relative transition-all group-hover:shadow-xl group-hover:scale-[1.02]">
                        <div className="absolute top-0 right-0 -mt-4 -mr-4 p-8 bg-white/10 rounded-full blur-2xl" />
                        <CardHeader className="relative z-10">
                            <CardTitle className="text-emerald-100 font-medium text-sm flex items-center">
                                <User className="mr-2 h-4 w-4" /> Pagos a Empleados
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="relative z-10">
                            <p className="text-emerald-100/80 text-sm mb-4">
                                Administra nómina y pagos por servicios del personal
                            </p>
                            <Button variant="secondary" className="bg-white/20 text-white hover:bg-white/30 border-0 backdrop-blur-sm group-hover:bg-white/30 transition-all">
                                Ir a Pagos <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </CardContent>
                    </Card>
                </Link>
            </div>

            <Card className="border-none shadow-sm bg-white">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-gray-700">
                        <TrendingUp className="h-5 w-5 text-blue-600" /> Resumen
                    </CardTitle>
                    <CardDescription>
                        Selecciona una sección para ver el detalle de cobros o pagos
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="bg-blue-50 rounded-xl p-5 border border-blue-100">
                            <p className="text-sm font-medium text-blue-700">Cobros a Clientes</p>
                            <p className="text-xs text-blue-500 mt-1">Registro de pagos recibidos por servicios</p>
                        </div>
                        <div className="bg-emerald-50 rounded-xl p-5 border border-emerald-100">
                            <p className="text-sm font-medium text-emerald-700">Pagos a Empleados</p>
                            <p className="text-xs text-emerald-500 mt-1">Gestión de nómina y compensaciones</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
