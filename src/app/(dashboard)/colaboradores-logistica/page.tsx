"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

const deptColors: Record<string, string> = {
  AUDIO: "bg-blue-500/20 text-blue-400",
  ILUMINACAO: "bg-yellow-500/20 text-yellow-400",
  VIDEO: "bg-purple-500/20 text-purple-400",
  ESTRUTURAS: "bg-orange-500/20 text-orange-400",
  MOBILIARIO: "bg-green-500/20 text-green-400",
  ADMINISTRACAO: "bg-gray-500/20 text-gray-400",
  RECURSOS_HUMANOS: "bg-pink-500/20 text-pink-400",
  COMERCIAL: "bg-cyan-500/20 text-cyan-400",
  TRANSPORTES: "bg-red-500/20 text-red-400",
};

export default function ColaboradoresLogisticaPage() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchData(); }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const res = await fetch("/api/colaboradores");
      setEmployees(await res.json());
    } catch { toast.error("Erro ao carregar."); }
    setLoading(false);
  }

  const grouped = employees.reduce((acc: Record<string, any[]>, emp: any) => {
    const dept = emp.department || "SEM_DEPARTAMENTO";
    if (!acc[dept]) acc[dept] = [];
    acc[dept].push(emp);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Colaboradores por Departamento</h1>

      {loading ? (
        <p className="text-muted-foreground text-center py-8">A carregar...</p>
      ) : (
        Object.entries(grouped).map(([dept, emps]) => (
          <Card key={dept} className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-card-foreground flex items-center gap-2">
                <Badge className={deptColors[dept] || "bg-gray-500/20 text-gray-400"}>{dept.replace("_", " ")}</Badge>
                <span className="text-sm text-muted-foreground">({emps.length} colaboradores)</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {emps.length === 0 ? (
                <p className="text-muted-foreground p-4">Nenhum colaborador neste departamento.</p>
              ) : (
                <div className="overflow-x-auto">
                  <div className="min-w-[900px]">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-border">
                          <TableHead className="text-muted-foreground whitespace-nowrap text-xs">Nome</TableHead>
                          <TableHead className="text-muted-foreground whitespace-nowrap text-xs">Função</TableHead>
                          <TableHead className="text-muted-foreground whitespace-nowrap text-xs">Email</TableHead>
                          <TableHead className="text-muted-foreground whitespace-nowrap text-xs">Preço/Dia</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {emps.map((emp: any) => (
                          <TableRow key={emp.id} className="border-border">
                            <TableCell className="text-foreground font-medium whitespace-nowrap text-xs">{emp.name}</TableCell>
                            <TableCell className="text-foreground whitespace-nowrap text-xs">{emp.position?.replace("_", " ") || "—"}</TableCell>
                            <TableCell className="text-muted-foreground whitespace-nowrap text-xs">{emp.email || "—"}</TableCell>
                            <TableCell className="text-foreground whitespace-nowrap text-xs">{new Intl.NumberFormat("pt-PT", { style: "currency", currency: "EUR" }).format(emp.dailyRate)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
