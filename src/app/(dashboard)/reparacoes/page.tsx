"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { Plus, Pencil, Trash2, Wrench } from "lucide-react";
import { Pagination } from "@/components/ui/pagination";
import { toast } from "sonner";
import { formatDate, formatCurrency } from "@/lib/helpers";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

interface Repair {
  id: string;
  number: string;
  description: string;
  status: string;
  reportDate: string;
  totalCost: number;
  externalRepairer: string;
}

const statusBadge: Record<string, string> = {
  PENDENTE: "bg-yellow-100 text-yellow-800",
  EM_REPARACAO: "bg-blue-100 text-blue-800",
  CONCLUIDO: "bg-green-100 text-green-800",
  DEVOLVIDO: "bg-gray-100 text-gray-800",
};

const statusLabel: Record<string, string> = {
  PENDENTE: "Pendente",
  EM_REPARACAO: "Em Reparação",
  CONCLUIDO: "Concluído",
  DEVOLVIDO: "Devolvido",
};

interface Filters {
  number: string;
  description: string;
  status: string;
}
const initialFilters: Filters = { number: "", description: "", status: "" };

const emptyForm = {
  description: "",
  externalRepairer: "",
  notes: "",
};

export default function ReparacoesPage() {
  const [repairs, setRepairs] = useState<Repair[]>([]);
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
  const [filters, setFilters] = useState<Filters>(initialFilters);

  function fetchData() {
    setLoading(true);
    fetch(`/api/reparacoes?page=${page}&limit=10`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch");
        return res.json();
      })
      .then((result) => {
        setRepairs(result.data);
        setTotalPages(result.totalPages);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }

  useEffect(() => { fetchData(); }, [page]);

  function handleChange(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit() {
    setSubmitting(true);
    try {
      if (editId) {
        const res = await fetch(`/api/reparacoes/${editId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        if (!res.ok) throw new Error("Failed to update");
        toast.success("Guia de reparação atualizada com sucesso.");
      } else {
        const res = await fetch("/api/reparacoes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        if (!res.ok) throw new Error("Failed to create");
        toast.success("Guia de reparação criada com sucesso.");
      }
      fetchData();
      setDialogOpen(false);
      setForm(emptyForm);
      setEditId(null);
    } catch {
      toast.error(editId ? "Erro ao atualizar guia de reparação." : "Erro ao criar guia de reparação.");
    } finally {
      setSubmitting(false);
    }
  }

  function handleEdit(rep: Repair) {
    setEditId(rep.id);
    setForm({
      description: rep.description || "",
      externalRepairer: rep.externalRepairer || "",
      notes: "",
    });
    setDialogOpen(true);
  }

  async function handleDelete() {
    if (!deleteId) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/reparacoes/${deleteId}`, { method: "DELETE" });
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

  function setFilter(key: keyof Filters, value: string) { setFilters(prev => ({ ...prev, [key]: value })); }
  function clearFilters() { setFilters(initialFilters); }
  const hasAnyFilter = Object.values(filters).some(v => v !== "");

  const { matched, rest } = useMemo(() => {
    const lf = {
      number: filters.number.toLowerCase(),
      description: filters.description.toLowerCase(),
      status: filters.status,
    };
    if (!hasAnyFilter) return { matched: repairs, rest: [] };
    const m: Repair[] = []; const r: Repair[] = [];
    for (const rep of repairs) {
      let ok = true;
      if (lf.number && !(rep.number || "").toLowerCase().includes(lf.number)) ok = false;
      if (lf.description && !(rep.description || "").toLowerCase().includes(lf.description)) ok = false;
      if (lf.status && rep.status !== lf.status) ok = false;
      if (ok) m.push({ ...rep, _match: true } as any); else r.push(rep);
    }
    return { matched: m, rest: r };
  }, [repairs, filters, hasAnyFilter]);

  const displayed = [...matched, ...rest];

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
        <h1 className="text-2xl font-bold tracking-tight">Reparações</h1>
        <Button onClick={() => { setEditId(null); setForm(emptyForm); setDialogOpen(true); }}>
          <Plus className="mr-1 h-4 w-4" />
          Nova Guia de Reparação
        </Button>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap items-end justify-center gap-2 p-3 bg-card border border-border rounded-lg">
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] text-muted-foreground">N.º Guia</span>
          <input placeholder="N.º" value={filters.number} onChange={e => setFilter("number", e.target.value)} className="w-[110px] h-7 text-xs bg-background border border-border rounded px-2 text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-primary/50" />
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] text-muted-foreground">Descrição</span>
          <input placeholder="Descrição" value={filters.description} onChange={e => setFilter("description", e.target.value)} className="w-[170px] h-7 text-xs bg-background border border-border rounded px-2 text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-primary/50" />
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] text-muted-foreground">Estado</span>
          <input placeholder="Estado" value={filters.status} onChange={e => setFilter("status", e.target.value)} className="w-[110px] h-7 text-xs bg-background border border-border rounded px-2 text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-primary/50" />
        </div>
        {hasAnyFilter && (
          <button onClick={clearFilters} className="h-7 px-3 text-xs text-muted-foreground hover:text-foreground border border-border rounded hover:bg-accent/50 transition-colors mb-0.5">
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
                    <TableHead className="whitespace-nowrap text-sm">N.º</TableHead>
                    <TableHead className="whitespace-nowrap text-sm">Descrição</TableHead>
                    <TableHead className="whitespace-nowrap text-sm">Estado</TableHead>
                    <TableHead className="whitespace-nowrap text-sm">Data Reporte</TableHead>
                    <TableHead className="whitespace-nowrap text-sm">Custo Total</TableHead>
                    <TableHead className="whitespace-nowrap text-sm">Reparador Externo</TableHead>
                    <TableHead className="whitespace-nowrap text-sm">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayed.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground text-sm whitespace-nowrap">
                        Nenhum registo encontrado.
                      </TableCell>
                    </TableRow>
                  ) : (
                    displayed.map((rep: any) => {
                      const isMatch = rep._match || !hasAnyFilter;
                      return (
                      <TableRow key={rep.id} className={isMatch && hasAnyFilter ? "bg-primary/5 border-l-2 border-l-primary" : (!isMatch && hasAnyFilter ? "opacity-40" : "")}>
                        <TableCell className="font-medium whitespace-nowrap text-sm">{rep.number}</TableCell>
                        <TableCell className="whitespace-nowrap text-sm">{rep.description}</TableCell>
                        <TableCell className="whitespace-nowrap text-sm">
                          <Badge variant="secondary" className={statusBadge[rep.status] ?? ""}>
                            {statusLabel[rep.status] ?? rep.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-sm">
                          {rep.reportDate ? formatDate(rep.reportDate) : "-"}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-sm">{formatCurrency(rep.totalCost)}</TableCell>
                        <TableCell className="whitespace-nowrap text-sm">{rep.externalRepairer || "-"}</TableCell>
                        <TableCell className="whitespace-nowrap text-sm">
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            onClick={() => handleEdit(rep)}
                            className="h-7 w-7"
                          >
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            onClick={() => setDeleteId(rep.id)}
                            className="h-7 w-7"
                          >
                            <Trash2 className="h-3 w-3 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>

      <Pagination page={page} totalPages={totalPages} onPageChange={(p) => setPage(p)} />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editId ? "Editar Guia de Reparação" : "Nova Guia de Reparação"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="r-desc">Descrição</Label>
              <Textarea
                id="r-desc"
                value={form.description}
                onChange={(e) => handleChange("description", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="r-repairer">Reparador Externo</Label>
              <Input
                id="r-repairer"
                value={form.externalRepairer}
                onChange={(e) => handleChange("externalRepairer", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="r-notes">Notas</Label>
              <Textarea
                id="r-notes"
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
              {submitting ? "A guardar..." : "Guardar"}
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
