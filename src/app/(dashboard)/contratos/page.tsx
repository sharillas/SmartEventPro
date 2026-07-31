"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Pagination } from "@/components/ui/pagination";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

interface Employee {
  id: string;
  name: string;
}

interface Contract {
  id: string;
  employeeId: string;
  type: string;
  startDate: string;
  endDate: string | null;
  salary: number;
  notes: string | null;
  employee: Employee;
}

const typeLabel: Record<string, string> = {
  SEM_PRAZO: "Sem Prazo",
  PRAZO_CERTO: "Prazo Certo",
  PARCIAL: "Parcial",
  PRESTACAO_SERVICOS: "Prestação Serviços",
  ESTAGIO: "Estágio",
};

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-PT", {
    style: "currency",
    currency: "EUR",
  }).format(value);
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("pt-PT");
}

const emptyForm = {
  employeeId: "",
  type: "SEM_PRAZO",
  startDate: "",
  endDate: "",
  salary: "",
  notes: "",
};

export default function ContratosPage() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  interface Filters { employee: string; type: string; }
  const initialFilters: Filters = { employee: "", type: "" };
  const [filters, setFilters] = useState<Filters>(initialFilters);
  function setFilter(key: keyof Filters, value: string) { setFilters(prev => ({ ...prev, [key]: value })); }
  function clearFilters() { setFilters(initialFilters); }
  const hasAnyFilter = Object.values(filters).some(v => v !== "");

  const { matched, rest } = useMemo(() => {
    const lf = { employee: filters.employee.toLowerCase(), type: filters.type };
    if (!hasAnyFilter) return { matched: contracts, rest: [] };
    const m: Contract[] = []; const r: Contract[] = [];
    for (const ct of contracts) {
      let ok = true;
      if (lf.employee && !(ct.employee?.name || "").toLowerCase().includes(lf.employee)) ok = false;
      if (lf.type && ct.type !== lf.type) ok = false;
      if (ok) m.push({ ...ct, _match: true } as any); else r.push(ct);
    }
    return { matched: m, rest: r };
  }, [contracts, filters, hasAnyFilter]);

  const displayed = [...matched, ...rest];
  const employeeItems = useMemo(
    () => Object.fromEntries(employees.map((e) => [e.id, e.name] as const)),
    [employees]
  );

  useEffect(() => { fetchContracts(); }, [page]);
  useEffect(() => { fetchEmployees(); }, []);

  async function fetchContracts() {
    setLoading(true);
    try {
      const res = await fetch(`/api/contratos?page=${page}&limit=10`);
      if (!res.ok) throw new Error("Erro");
      const result = await res.json();
      setContracts(result.data);
      setTotalPages(result.totalPages);
    } catch {
      setError(true);
      toast.error("Erro ao carregar contratos.");
    }
    setLoading(false);
  }

  async function fetchEmployees() {
    try {
      const res = await fetch("/api/colaboradores?limit=100");
      if (!res.ok) return;
      const result = await res.json();
      setEmployees(result.data.filter((e: Employee & { active: boolean }) => e.active !== false));
    } catch { /* ignore */ }
  }

  function handleChange(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleEditClick(ct: Contract) {
    setEditId(ct.id);
    setForm({
      employeeId: ct.employeeId,
      type: ct.type,
      startDate: ct.startDate ? ct.startDate.slice(0, 10) : "",
      endDate: ct.endDate ? ct.endDate.slice(0, 10) : "",
      salary: String(ct.salary ?? ""),
      notes: ct.notes || "",
    });
    setDialogOpen(true);
  }

  async function handleSubmit() {
    setSubmitting(true);
    try {
      const url = editId ? `/api/contratos/${editId}` : "/api/contratos";
      const method = editId ? "PATCH" : "POST";
      const body = {
        employeeId: form.employeeId,
        type: form.type,
        startDate: form.startDate ? new Date(form.startDate).toISOString() : undefined,
        endDate: form.endDate || null,
        salary: form.salary ? Number(form.salary) : 0,
        notes: form.notes || null,
      };
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Failed");
      toast.success(editId ? "Atualizado com sucesso." : "Contrato criado com sucesso.");
      fetchContracts();
      setDialogOpen(false);
      setForm(emptyForm);
    } catch {
      toast.error(editId ? "Erro ao atualizar." : "Erro ao criar contrato.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!deleteId) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/contratos/${deleteId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
      toast.success("Eliminado com sucesso.");
      fetchContracts();
    } catch {
      toast.error("Erro ao eliminar.");
    } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-muted-foreground">A carregar...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-destructive font-medium">Erro ao carregar dados.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Contratos de Colaboradores</h1>
        <Button onClick={() => { setEditId(null); setForm(emptyForm); setDialogOpen(true); }}>
          <Plus className="mr-1 h-4 w-4" />
          Novo Contrato
        </Button>
      </div>

      <div className="flex flex-wrap items-end justify-center gap-2 p-3 bg-card border border-border rounded-lg">
        <div className="flex flex-col gap-0.5">
          <span className="text-xs text-muted-foreground">Colaborador</span>
          <input placeholder="Colaborador" value={filters.employee} onChange={e => setFilter("employee", e.target.value)} className="w-[160px] h-8 text-sm bg-background border border-border rounded px-2 text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-primary/50" />
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-xs text-muted-foreground">Tipo</span>
          <select value={filters.type} onChange={e => setFilter("type", e.target.value)} className="w-[150px] h-8 text-sm bg-background border border-border rounded px-2 text-foreground outline-none focus:border-primary/50">
            <option value="">Todos</option>
            {Object.entries(typeLabel).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
        {hasAnyFilter && (
          <button onClick={clearFilters} className="h-8 px-3 text-sm text-muted-foreground hover:text-foreground border border-border rounded hover:bg-accent/50 transition-colors mb-0.5">
            Limpar
          </button>
        )}
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <div className="min-w-[900px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="whitespace-nowrap text-sm">Colaborador</TableHead>
                    <TableHead className="whitespace-nowrap text-sm">Tipo</TableHead>
                    <TableHead className="whitespace-nowrap text-sm">Data Início</TableHead>
                    <TableHead className="whitespace-nowrap text-sm">Data Fim</TableHead>
                    <TableHead className="whitespace-nowrap text-sm">Salário</TableHead>
                    <TableHead className="whitespace-nowrap text-sm">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayed.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground text-sm whitespace-nowrap">
                        Nenhum registo encontrado.
                      </TableCell>
                    </TableRow>
                  ) : (
                    displayed.map((ct: any) => (
                      <TableRow key={ct.id} className={`${ct._match && hasAnyFilter ? "bg-primary/5 border-l-2 border-l-primary" : ""} ${!ct._match && hasAnyFilter ? "opacity-40" : ""}`}>
                        <TableCell className="font-medium whitespace-nowrap text-sm">{ct.employee.name}</TableCell>
                        <TableCell className="whitespace-nowrap text-sm">{typeLabel[ct.type] ?? ct.type}</TableCell>
                        <TableCell className="whitespace-nowrap text-sm">{formatDate(ct.startDate)}</TableCell>
                        <TableCell className="whitespace-nowrap text-sm">{formatDate(ct.endDate)}</TableCell>
                        <TableCell className="whitespace-nowrap text-sm">{formatCurrency(ct.salary)}</TableCell>
                        <TableCell className="whitespace-nowrap text-sm">
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            onClick={() => handleEditClick(ct)}
                            className="h-7 w-7"
                          >
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            onClick={() => setDeleteId(ct.id)}
                            className="h-7 w-7"
                          >
                            <Trash2 className="h-3 w-3 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>

      <Pagination page={page} totalPages={totalPages} onPageChange={(p) => setPage(p)} />

      <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) { setEditId(null); setForm(emptyForm); } setDialogOpen(open); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editId ? "Editar Contrato" : "Novo Contrato"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Colaborador</Label>
              <Select
                value={form.employeeId}
                onValueChange={(v) => v && handleChange("employeeId", v)}
                items={employeeItems}
              >
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
              <Label>Tipo de Contrato</Label>
              <Select
                value={form.type}
                onValueChange={(v) => v && handleChange("type", v)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecionar tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SEM_PRAZO">Sem Prazo</SelectItem>
                  <SelectItem value="PRAZO_CERTO">Prazo Certo</SelectItem>
                  <SelectItem value="PARCIAL">Parcial</SelectItem>
                  <SelectItem value="PRESTACAO_SERVICOS">Prestação Serviços</SelectItem>
                  <SelectItem value="ESTAGIO">Estágio</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="ct-start">Data Início</Label>
              <Input
                id="ct-start"
                type="date"
                value={form.startDate}
                onChange={(e) => handleChange("startDate", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ct-end">Data Fim</Label>
              <Input
                id="ct-end"
                type="date"
                value={form.endDate}
                onChange={(e) => handleChange("endDate", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ct-salary">Salário</Label>
              <Input
                id="ct-salary"
                type="number"
                step="0.01"
                value={form.salary}
                onChange={(e) => handleChange("salary", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ct-notes">Notas</Label>
              <Textarea
                id="ct-notes"
                value={form.notes}
                onChange={(e) => handleChange("notes", e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {editId ? (submitting ? "A guardar..." : "Guardar") : (submitting ? "A criar..." : "Criar")}
            </Button>
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
