"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Pagination } from "@/components/ui/pagination";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { formatDate } from "@/lib/helpers";

interface Ausencia {
  id: string;
  employeeId: string;
  type: string;
  startDate: string;
  endDate: string;
  status: string;
  notes: string | null;
  employee: { name: string };
}

interface Employee {
  id: string;
  name: string;
}

const statusBadge: Record<string, string> = {
  PENDENTE: "border-yellow-500 text-yellow-400 bg-yellow-500/10",
  APROVADO: "border-green-500 text-green-400 bg-green-500/10",
  REJEITADO: "border-red-500 text-red-400 bg-red-500/10",
};
const statusLabel: Record<string, string> = {
  PENDENTE: "Pendente",
  APROVADO: "Aprovado",
  REJEITADO: "Rejeitado",
};

const typeLabel: Record<string, string> = {
  FERIAS: "Férias",
  FALTA_JUSTIFICADA: "Falta Justificada",
  FALTA_INJUSTIFICADA: "Falta Injustificada",
  BAIXA: "Baixa",
  FOLGA: "Folga",
};

function toDateInputValue(dateStr: string | null | undefined): string {
  if (!dateStr) return "";
  return new Date(dateStr).toISOString().split("T")[0];
}

const emptyForm = {
  employeeId: "",
  type: "",
  startDate: "",
  endDate: "",
  notes: "",
};

export default function AusenciasPage() {
  const [ausencias, setAusencias] = useState<Ausencia[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  interface Filters { employee: string; }
  const initialFilters: Filters = { employee: "" };
  const [filters, setFilters] = useState<Filters>(initialFilters);
  function setFilter(key: keyof Filters, value: string) { setFilters(prev => ({ ...prev, [key]: value })); }
  function clearFilters() { setFilters(initialFilters); }
  const hasAnyFilter = Object.values(filters).some(v => v !== "");

  const { matched, rest } = useMemo(() => {
    const lf = { employee: filters.employee.toLowerCase() };
    if (!hasAnyFilter) return { matched: ausencias, rest: [] };
    const m: typeof ausencias = []; const r: typeof ausencias = [];
    for (const a of ausencias) {
      let ok = true;
      if (lf.employee && !(a.employee?.name || "").toLowerCase().includes(lf.employee)) ok = false;
      if (ok) m.push({ ...a, _match: true } as any); else r.push(a);
    }
    return { matched: m, rest: r };
  }, [ausencias, filters, hasAnyFilter]);

  const displayed = [...matched, ...rest];

  useEffect(() => { fetchData(); }, [page]);
  useEffect(() => { fetchEmployees(); }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const res = await fetch(`/api/ausencias?page=${page}&limit=10`);
      if (!res.ok) throw new Error("Erro");
      const result = await res.json();
      setAusencias(result.data);
      setTotalPages(result.totalPages);
    } catch { toast.error("Erro ao carregar ausências."); }
    setLoading(false);
  }

  async function fetchEmployees() {
    try {
      const res = await fetch("/api/colaboradores?limit=1000");
      if (!res.ok) throw new Error("Erro");
      const result = await res.json();
      setEmployees(result.data);
    } catch { /* ignore */ }
  }

  const employeeItems = useMemo(() => Object.fromEntries(employees.map((e) => [e.id, e.name] as const)), [employees]);

  function handleChange(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleEditClick(a: Ausencia) {
    setEditId(a.id);
    setForm({
      employeeId: a.employeeId,
      type: a.type,
      startDate: toDateInputValue(a.startDate),
      endDate: toDateInputValue(a.endDate),
      notes: a.notes || "",
    });
    setDialogOpen(true);
  }

  function resetDialog() {
    setEditId(null);
    setForm(emptyForm);
  }

  async function handleSubmit() {
    if (!form.employeeId || !form.type || !form.startDate || !form.endDate) {
      toast.error("Preencha os campos obrigatórios.");
      return;
    }
    setSubmitting(true);
    try {
      const url = editId ? `/api/ausencias/${editId}` : "/api/ausencias";
      const method = editId ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId: form.employeeId,
          type: form.type,
          startDate: form.startDate,
          endDate: form.endDate,
          notes: form.notes || null,
        }),
      });
      if (!res.ok) throw new Error("Failed");
      toast.success(editId ? "Atualizado com sucesso." : "Ausência criada.");
      fetchData();
      setDialogOpen(false);
      resetDialog();
    } catch {
      toast.error(editId ? "Erro ao atualizar." : "Erro ao criar ausência.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!deleteId) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/ausencias/${deleteId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
      toast.success("Eliminado com sucesso.");
      fetchData();
    } catch {
      toast.error("Erro ao eliminar.");
    } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Ausências</h1>
        <Button onClick={() => { resetDialog(); setDialogOpen(true); }} size="sm">
          <Plus className="h-4 w-4 mr-2" /> Nova Ausência
        </Button>
      </div>

      <div className="flex flex-wrap items-end justify-center gap-2 p-3 bg-card border border-border rounded-lg">
        <div className="flex flex-col gap-0.5">
          <span className="text-xs text-muted-foreground">Colaborador</span>
          <input placeholder="Colaborador" value={filters.employee} onChange={e => setFilter("employee", e.target.value)} className="w-[200px] h-8 text-sm bg-background border border-border rounded px-2 text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-primary/50" />
        </div>
        {hasAnyFilter && (
          <button onClick={clearFilters} className="h-8 px-3 text-sm text-muted-foreground hover:text-foreground border border-border rounded hover:bg-accent/50 transition-colors mb-0.5">
            Limpar
          </button>
        )}
      </div>

      <Card className="border-border bg-card">
        <CardHeader><CardTitle className="text-card-foreground">Lista de Ausências</CardTitle></CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <p className="text-muted-foreground text-center py-8">A carregar...</p>
          ) : displayed.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">Nenhuma ausência registada.</p>
          ) : (
            <div className="overflow-x-auto">
              <div className="min-w-[900px]">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border">
                      <TableHead className="text-muted-foreground whitespace-nowrap text-sm">Colaborador</TableHead>
                      <TableHead className="text-muted-foreground whitespace-nowrap text-sm">Tipo</TableHead>
                      <TableHead className="text-muted-foreground whitespace-nowrap text-sm">Início</TableHead>
                      <TableHead className="text-muted-foreground whitespace-nowrap text-sm">Fim</TableHead>
                      <TableHead className="text-muted-foreground whitespace-nowrap text-sm">Estado</TableHead>
                      <TableHead className="text-muted-foreground whitespace-nowrap text-sm">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {displayed.map((a: any) => (
                      <TableRow key={a.id} className={`border-border ${a._match && hasAnyFilter ? "bg-primary/5 border-l-2 border-l-primary" : ""} ${!a._match && hasAnyFilter ? "opacity-40" : ""}`}>
                        <TableCell className="text-foreground font-medium whitespace-nowrap text-sm">{a.employee?.name}</TableCell>
                        <TableCell className="text-foreground whitespace-nowrap text-sm">{typeLabel[a.type] || a.type}</TableCell>
                        <TableCell className="text-foreground whitespace-nowrap text-sm">{formatDate(a.startDate)}</TableCell>
                        <TableCell className="text-foreground whitespace-nowrap text-sm">{formatDate(a.endDate)}</TableCell>
                        <TableCell className="whitespace-nowrap text-sm">
                          <Badge variant="outline" className={`bg-transparent ${statusBadge[a.status] || ""}`}>
                            {statusLabel[a.status] || a.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-sm">
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            onClick={() => handleEditClick(a)}
                            className="h-7 w-7"
                          >
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            onClick={() => setDeleteId(a.id)}
                            className="h-7 w-7"
                          >
                            <Trash2 className="h-3 w-3 text-destructive" />
                          </Button>
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

      <Pagination page={page} totalPages={totalPages} onPageChange={(p) => setPage(p)} />

      <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) resetDialog(); setDialogOpen(open); }}>
        <DialogContent className="sm:max-w-lg bg-card text-card-foreground border-border">
          <DialogHeader><DialogTitle>{editId ? "Editar Ausência" : "Nova Ausência"}</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Colaborador</Label>
              <Select value={form.employeeId} onValueChange={(v) => v && handleChange("employeeId", v)} items={employeeItems}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecionar colaborador" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((emp) => (
                    <SelectItem key={emp.id} value={emp.id}>{emp.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select value={form.type} onValueChange={(v) => v && handleChange("type", v)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecionar tipo" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(typeLabel).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Data Início</Label>
                <Input
                  type="date"
                  value={form.startDate}
                  onChange={(e) => handleChange("startDate", e.target.value)}
                  className="bg-background border-border"
                />
              </div>
              <div className="space-y-2">
                <Label>Data Fim</Label>
                <Input
                  type="date"
                  value={form.endDate}
                  onChange={(e) => handleChange("endDate", e.target.value)}
                  className="bg-background border-border"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Notas</Label>
              <Textarea
                value={form.notes}
                onChange={(e) => handleChange("notes", e.target.value)}
                className="bg-background border-border"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} className="border-border">Cancelar</Button>
            <Button onClick={handleSubmit} disabled={submitting}>{editId ? (submitting ? "A guardar..." : "Guardar") : (submitting ? "A criar..." : "Criar")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
