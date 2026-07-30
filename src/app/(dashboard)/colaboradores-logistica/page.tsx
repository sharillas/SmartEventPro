"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Pencil, Trash2 } from "lucide-react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

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

const statusLabel: Record<string, string> = {
  ATIVO: "Ativo",
  FERIAS: "Férias",
  FOLGA: "Folga",
  BAIXA: "Baixa",
  DESATIVADO: "Desativado",
};
const statusBadgeClass: Record<string, string> = {
  ATIVO: "border-green-500 text-green-400 bg-green-500/10",
  FERIAS: "border-blue-500 text-blue-400 bg-blue-500/10",
  FOLGA: "border-purple-500 text-purple-400 bg-purple-500/10",
  BAIXA: "border-yellow-500 text-yellow-400 bg-yellow-500/10",
  DESATIVADO: "border-red-500 text-red-400 bg-red-500/10",
};

export default function ColaboradoresLogisticaPage() {
  const router = useRouter();
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  interface Filters { name: string; position: string; status: string; }
  const initialFilters: Filters = { name: "", position: "", status: "" };
  const [filters, setFilters] = useState<Filters>(initialFilters);
  function setFilter(key: keyof Filters, value: string) { setFilters(prev => ({ ...prev, [key]: value })); }
  function clearFilters() { setFilters(initialFilters); }
  const hasAnyFilter = Object.values(filters).some(v => v !== "");

  const filteredEmployees = useMemo(() => {
    if (!hasAnyFilter) return employees;
    const lf = { name: filters.name.toLowerCase(), position: filters.position.toLowerCase(), status: filters.status };
    return employees.filter(emp => {
      if (lf.name && !(emp.name || "").toLowerCase().includes(lf.name)) return false;
      if (lf.position && !(emp.position || "").replace("_", " ").toLowerCase().includes(lf.position)) return false;
      if (lf.status && emp.status !== lf.status) return false;
      return true;
    });
  }, [employees, filters, hasAnyFilter]);

  useEffect(() => { fetchData(); }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const res = await fetch("/api/colaboradores?limit=1000");
      if (!res.ok) throw new Error("Erro");
      const result = await res.json();
      setEmployees(result.data || result);
    } catch { toast.error("Erro ao carregar."); }
    setLoading(false);
  }

  async function handleDelete() {
    if (!deleteId) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/colaboradores/${deleteId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
      toast.success("Eliminado com sucesso.");
      setEmployees(prev => prev.filter(item => item.id !== deleteId));
    } catch {
      toast.error("Erro ao eliminar.");
    } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  }

  const grouped = filteredEmployees.reduce((acc: Record<string, any[]>, emp: any) => {
    const dept = emp.department || "SEM_DEPARTAMENTO";
    if (!acc[dept]) acc[dept] = [];
    acc[dept].push(emp);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Colaboradores por Departamento</h1>

      <div className="flex flex-wrap items-end justify-center gap-2 p-3 bg-card border border-border rounded-lg">
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] text-muted-foreground">Nome</span>
          <input placeholder="Nome" value={filters.name} onChange={e => setFilter("name", e.target.value)} className="w-[150px] h-7 text-xs bg-background border border-border rounded px-2 text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-primary/50" />
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] text-muted-foreground">Cargo</span>
          <input placeholder="Cargo" value={filters.position} onChange={e => setFilter("position", e.target.value)} className="w-[140px] h-7 text-xs bg-background border border-border rounded px-2 text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-primary/50" />
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] text-muted-foreground">Estado</span>
          <select value={filters.status} onChange={e => setFilter("status", e.target.value)} className="w-[120px] h-7 text-xs bg-background border border-border rounded px-2 text-foreground outline-none focus:border-primary/50">
            <option value="">Todos</option>
            {Object.entries(statusLabel).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
        {hasAnyFilter && (
          <button onClick={clearFilters} className="h-7 px-3 text-xs text-muted-foreground hover:text-foreground border border-border rounded hover:bg-accent/50 transition-colors mb-0.5">
            Limpar
          </button>
        )}
      </div>

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
                          <TableHead className="text-muted-foreground whitespace-nowrap text-sm">Nome</TableHead>
                          <TableHead className="text-muted-foreground whitespace-nowrap text-sm">Cargo</TableHead>
                          <TableHead className="text-muted-foreground whitespace-nowrap text-sm">Estado</TableHead>
                          <TableHead className="text-muted-foreground whitespace-nowrap text-sm p-1.5">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {emps.map((emp: any) => (
                          <TableRow key={emp.id} className="border-border">
                            <TableCell className="text-foreground font-medium whitespace-nowrap text-sm">{emp.name}</TableCell>
                            <TableCell className="text-foreground whitespace-nowrap text-sm">{emp.position?.replace("_", " ") || "—"}</TableCell>
                            <TableCell className="whitespace-nowrap text-sm">
                              <Badge variant="outline" className={`bg-transparent ${statusBadgeClass[emp.status] || ""}`}>
                                {statusLabel[emp.status] || emp.status || "—"}
                              </Badge>
                            </TableCell>
                            <TableCell className="whitespace-nowrap text-sm p-1.5">
                              <div className="flex items-center gap-1">
                                <Button variant="ghost" size="icon-xs" onClick={() => router.push("/rh")} className="h-8 w-8">
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon-xs" onClick={() => setDeleteId(emp.id)} className="h-8 w-8">
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </div>
                            </TableCell>
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

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => { if (!open) setDeleteId(null); }}
        title="Confirmar Eliminação"
        description="Tem a certeza que deseja eliminar este registo? Esta ação não pode ser desfeita."
        onConfirm={handleDelete}
        loading={deleting}
      />
    </div>
  );
}
