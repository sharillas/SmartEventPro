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

interface Timesheet {
  id: string;
  employeeId: string;
  date: string;
  startTime: string;
  endTime: string;
  hours: number;
  projectId: string | null;
  status: string;
  notes: string | null;
  employee: { name: string };
  project?: { name: string } | null;
}

interface Employee {
  id: string;
  name: string;
}

interface Project {
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

function toDateInputValue(dateStr: string | null | undefined): string {
  if (!dateStr) return "";
  return new Date(dateStr).toISOString().split("T")[0];
}

function toTimeInputValue(dateStr: string | null | undefined): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

const emptyForm = {
  employeeId: "",
  date: "",
  startTime: "",
  endTime: "",
  projectId: "",
  notes: "",
};

export default function TimesheetsPage() {
  const [timesheets, setTimesheets] = useState<Timesheet[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
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
    if (!hasAnyFilter) return { matched: timesheets, rest: [] };
    const m: typeof timesheets = []; const r: typeof timesheets = [];
    for (const t of timesheets) {
      let ok = true;
      if (lf.employee && !(t.employee?.name || "").toLowerCase().includes(lf.employee)) ok = false;
      if (ok) m.push({ ...t, _match: true } as any); else r.push(t);
    }
    return { matched: m, rest: r };
  }, [timesheets, filters, hasAnyFilter]);

  const displayed = [...matched, ...rest];

  useEffect(() => { fetchData(); }, [page]);
  useEffect(() => { fetchEmployees(); fetchProjects(); }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const res = await fetch(`/api/timesheets?page=${page}&limit=10`);
      if (!res.ok) throw new Error("Erro");
      const result = await res.json();
      setTimesheets(result.data);
      setTotalPages(result.totalPages);
    } catch { toast.error("Erro ao carregar registos de horas."); }
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

  async function fetchProjects() {
    try {
      const res = await fetch("/api/projetos?limit=100");
      if (!res.ok) throw new Error("Erro");
      const result = await res.json();
      setProjects(result.data);
    } catch { /* ignore */ }
  }

  const employeeItems = useMemo(() => Object.fromEntries(employees.map((e) => [e.id, e.name] as const)), [employees]);
  const projectItems = useMemo(() => Object.fromEntries(projects.map((p) => [p.id, p.name] as const)), [projects]);

  function handleChange(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleEditClick(t: Timesheet) {
    setEditId(t.id);
    setForm({
      employeeId: t.employeeId,
      date: toDateInputValue(t.date),
      startTime: toTimeInputValue(t.startTime),
      endTime: toTimeInputValue(t.endTime),
      projectId: t.projectId || "",
      notes: t.notes || "",
    });
    setDialogOpen(true);
  }

  function resetDialog() {
    setEditId(null);
    setForm(emptyForm);
  }

  async function handleSubmit() {
    if (!form.employeeId || !form.date || !form.startTime || !form.endTime) {
      toast.error("Preencha os campos obrigatórios.");
      return;
    }
    setSubmitting(true);
    try {
      const url = editId ? `/api/timesheets/${editId}` : "/api/timesheets";
      const method = editId ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId: form.employeeId,
          date: form.date,
          startTime: form.startTime,
          endTime: form.endTime,
          projectId: form.projectId || null,
          notes: form.notes || null,
        }),
      });
      if (!res.ok) throw new Error("Failed");
      toast.success(editId ? "Atualizado com sucesso." : "Registo de horas criado.");
      fetchData();
      setDialogOpen(false);
      resetDialog();
    } catch {
      toast.error(editId ? "Erro ao atualizar." : "Erro ao criar registo de horas.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!deleteId) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/timesheets/${deleteId}`, { method: "DELETE" });
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
        <h1 className="text-2xl font-bold text-foreground">Folha de Horas</h1>
        <Button onClick={() => { resetDialog(); setDialogOpen(true); }} size="sm">
          <Plus className="h-4 w-4 mr-2" /> Novo Registo
        </Button>
      </div>

      <div className="flex flex-wrap items-end justify-center gap-2 p-3 bg-card border border-border rounded-lg">
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] text-muted-foreground">Colaborador</span>
          <input placeholder="Colaborador" value={filters.employee} onChange={e => setFilter("employee", e.target.value)} className="w-[200px] h-7 text-xs bg-background border border-border rounded px-2 text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-primary/50" />
        </div>
        {hasAnyFilter && (
          <button onClick={clearFilters} className="h-7 px-3 text-xs text-muted-foreground hover:text-foreground border border-border rounded hover:bg-accent/50 transition-colors mb-0.5">
            Limpar
          </button>
        )}
      </div>

      <Card className="border-border bg-card">
        <CardHeader><CardTitle className="text-card-foreground">Lista de Registos</CardTitle></CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <p className="text-muted-foreground text-center py-8">A carregar...</p>
          ) : displayed.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">Nenhum registo encontrado.</p>
          ) : (
            <div className="overflow-x-auto">
              <div className="min-w-[900px]">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border">
                      <TableHead className="text-muted-foreground whitespace-nowrap text-sm">Colaborador</TableHead>
                      <TableHead className="text-muted-foreground whitespace-nowrap text-sm">Data</TableHead>
                      <TableHead className="text-muted-foreground whitespace-nowrap text-sm">Entrada</TableHead>
                      <TableHead className="text-muted-foreground whitespace-nowrap text-sm">Saída</TableHead>
                      <TableHead className="text-muted-foreground whitespace-nowrap text-sm">Horas</TableHead>
                      <TableHead className="text-muted-foreground whitespace-nowrap text-sm">Projeto</TableHead>
                      <TableHead className="text-muted-foreground whitespace-nowrap text-sm">Estado</TableHead>
                      <TableHead className="text-muted-foreground whitespace-nowrap text-sm">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {displayed.map((t: any) => (
                      <TableRow key={t.id} className={`border-border ${t._match && hasAnyFilter ? "bg-primary/5 border-l-2 border-l-primary" : ""} ${!t._match && hasAnyFilter ? "opacity-40" : ""}`}>
                        <TableCell className="text-foreground font-medium whitespace-nowrap text-sm">{t.employee?.name}</TableCell>
                        <TableCell className="text-foreground whitespace-nowrap text-sm">{formatDate(t.date)}</TableCell>
                        <TableCell className="text-foreground whitespace-nowrap text-sm">{toTimeInputValue(t.startTime)}</TableCell>
                        <TableCell className="text-foreground whitespace-nowrap text-sm">{toTimeInputValue(t.endTime)}</TableCell>
                        <TableCell className="text-foreground whitespace-nowrap text-sm">{t.hours}</TableCell>
                        <TableCell className="text-foreground whitespace-nowrap text-sm">{t.project?.name || "-"}</TableCell>
                        <TableCell className="whitespace-nowrap text-sm">
                          <Badge variant="outline" className={`bg-transparent ${statusBadge[t.status] || ""}`}>
                            {statusLabel[t.status] || t.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-sm">
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            onClick={() => handleEditClick(t)}
                            className="h-7 w-7"
                          >
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            onClick={() => setDeleteId(t.id)}
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
          <DialogHeader><DialogTitle>{editId ? "Editar Registo" : "Novo Registo"}</DialogTitle></DialogHeader>
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
              <Label>Data</Label>
              <Input
                type="date"
                value={form.date}
                onChange={(e) => handleChange("date", e.target.value)}
                className="bg-background border-border"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Hora Entrada</Label>
                <Input
                  type="time"
                  step="1"
                  value={form.startTime}
                  onChange={(e) => handleChange("startTime", e.target.value)}
                  className="bg-background border-border"
                />
              </div>
              <div className="space-y-2">
                <Label>Hora Saída</Label>
                <Input
                  type="time"
                  step="1"
                  value={form.endTime}
                  onChange={(e) => handleChange("endTime", e.target.value)}
                  className="bg-background border-border"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Projeto</Label>
              <Select value={form.projectId} onValueChange={(v) => handleChange("projectId", v === "__none__" || !v ? "" : v)} items={projectItems}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecionar projeto" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Sem projeto</SelectItem>
                  {projects.map((proj) => (
                    <SelectItem key={proj.id} value={proj.id}>{proj.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
