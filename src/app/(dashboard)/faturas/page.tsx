"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
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
import { Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Pagination } from "@/components/ui/pagination";
import { formatDate } from "@/lib/helpers";

interface Invoice {
  id: string;
  number: string;
  clientName: string;
  date: string;
  dueDate: string;
  subtotal: number;
  tax: number;
  total: number;
  status: string;
}

const statusBadge: Record<string, string> = {
  PENDENTE: "bg-yellow-100 text-yellow-800",
  PAGO: "bg-green-100 text-green-800",
  VENCIDO: "bg-red-100 text-red-800",
  CANCELADO: "bg-red-100 text-red-800",
};

const statusLabel: Record<string, string> = {
  PENDENTE: "Pendente",
  PAGO: "Pago",
  VENCIDO: "Vencido",
  CANCELADO: "Cancelado",
};

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-PT", {
    style: "currency",
    currency: "EUR",
  }).format(value);
}

interface Filters {
  number: string;
  client: string;
  status: string;
  date: string;
}
const initialFilters: Filters = { number: "", client: "", status: "", date: "" };

export default function FaturasPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ number: "", clientName: "", date: "", dueDate: "", status: "", notes: "" });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState<Filters>(initialFilters);

  useEffect(() => {
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("limit", "10");
    fetch(`/api/faturas?${params.toString()}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch");
        return res.json();
      })
      .then((result) => { setInvoices(result.data); setTotalPages(result.totalPages); })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [page]);

  async function handleDelete() {
    if (!deleteId) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/faturas/${deleteId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
      toast.success("Eliminado com sucesso.");
      setInvoices(prev => prev.filter(inv => inv.id !== deleteId));
    } catch {
      toast.error("Erro ao eliminar.");
    } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  }

  function handleEdit(inv: Invoice) {
    setEditId(inv.id);
    setForm({
      number: inv.number || "",
      clientName: inv.clientName || "",
      date: inv.date ? inv.date.split("T")[0] : "",
      dueDate: inv.dueDate ? inv.dueDate.split("T")[0] : "",
      status: inv.status || "",
      notes: "",
    });
    setDialogOpen(true);
  }

  async function handleSubmit() {
    if (!editId) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/faturas/${editId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Failed to update");
      toast.success("Fatura atualizada com sucesso.");
      const data = await res.json();
      setInvoices((prev) => prev.map((inv) => (inv.id === editId ? data : inv)));
      setDialogOpen(false);
      setEditId(null);
    } catch {
      toast.error("Erro ao atualizar fatura.");
    } finally {
      setSubmitting(false);
    }
  }

  function setFilter(key: keyof Filters, value: string) { setFilters(prev => ({ ...prev, [key]: value })); }
  function clearFilters() { setFilters(initialFilters); }
  const hasAnyFilter = Object.values(filters).some(v => v !== "");

  const { matched, rest } = useMemo(() => {
    const lf = {
      number: filters.number.toLowerCase(),
      client: filters.client.toLowerCase(),
      status: filters.status,
      date: filters.date,
    };
    if (!hasAnyFilter) return { matched: invoices, rest: [] };
    const m: Invoice[] = []; const r: Invoice[] = [];
    for (const inv of invoices) {
      let ok = true;
      if (lf.number && !(inv.number || "").toLowerCase().includes(lf.number)) ok = false;
      if (lf.client && !(inv.clientName || "").toLowerCase().includes(lf.client)) ok = false;
      if (lf.status && inv.status !== lf.status) ok = false;
      if (lf.date) {
        const d = inv.date ? new Date(inv.date) : null;
        if (!d || d.toISOString().split("T")[0] !== lf.date) ok = false;
      }
      if (ok) m.push({ ...inv, _match: true } as any); else r.push(inv);
    }
    return { matched: m, rest: r };
  }, [invoices, filters, hasAnyFilter]);

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
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Faturas</h1>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap items-end justify-center gap-2 p-3 bg-card border border-border rounded-lg">
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] text-muted-foreground">N.º Fatura</span>
          <input placeholder="N.º" value={filters.number} onChange={e => setFilter("number", e.target.value)} className="w-[120px] h-7 text-xs bg-background border border-border rounded px-2 text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-primary/50" />
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] text-muted-foreground">Cliente</span>
          <input placeholder="Cliente" value={filters.client} onChange={e => setFilter("client", e.target.value)} className="w-[150px] h-7 text-xs bg-background border border-border rounded px-2 text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-primary/50" />
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] text-muted-foreground">Estado</span>
          <input placeholder="Estado" value={filters.status} onChange={e => setFilter("status", e.target.value)} className="w-[110px] h-7 text-xs bg-background border border-border rounded px-2 text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-primary/50" />
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] text-muted-foreground">Data</span>
          <input type="date" value={filters.date} onChange={e => setFilter("date", e.target.value)} className="w-[130px] h-7 text-xs bg-background border border-border rounded px-2 text-foreground outline-none focus:border-primary/50" />
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
                    <TableHead className="whitespace-nowrap text-sm">Cliente</TableHead>
                    <TableHead className="whitespace-nowrap text-sm">Data</TableHead>
                    <TableHead className="whitespace-nowrap text-sm">Vencimento</TableHead>
                    <TableHead className="whitespace-nowrap text-sm">Subtotal</TableHead>
                    <TableHead className="whitespace-nowrap text-sm">IVA</TableHead>
                    <TableHead className="whitespace-nowrap text-sm">Total</TableHead>
                    <TableHead className="whitespace-nowrap text-sm">Estado</TableHead>
                    <TableHead className="whitespace-nowrap text-sm">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayed.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center text-muted-foreground text-sm whitespace-nowrap">
                        Nenhum registo encontrado.
                      </TableCell>
                    </TableRow>
                  ) : (
                    displayed.map((inv: any) => {
                      const isMatch = inv._match || !hasAnyFilter;
                      return (
                      <TableRow key={inv.id} className={isMatch && hasAnyFilter ? "bg-primary/5 border-l-2 border-l-primary" : (!isMatch && hasAnyFilter ? "opacity-40" : "")}>
                        <TableCell className="font-medium whitespace-nowrap text-sm">{inv.number}</TableCell>
                        <TableCell className="whitespace-nowrap text-sm">{inv.clientName}</TableCell>
                        <TableCell className="whitespace-nowrap text-sm">{inv.date ? formatDate(inv.date) : "-"}</TableCell>
                        <TableCell className="whitespace-nowrap text-sm">{inv.dueDate ? formatDate(inv.dueDate) : "-"}</TableCell>
                        <TableCell className="whitespace-nowrap text-sm">{formatCurrency(inv.subtotal)}</TableCell>
                        <TableCell className="whitespace-nowrap text-sm">{formatCurrency(inv.tax)}</TableCell>
                        <TableCell className="whitespace-nowrap text-sm">{formatCurrency(inv.total)}</TableCell>
                        <TableCell className="whitespace-nowrap text-sm">
                          <Badge variant="secondary" className={statusBadge[inv.status] ?? ""}>
                            {statusLabel[inv.status] ?? inv.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-sm">
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            onClick={() => handleEdit(inv)}
                            className="h-7 w-7"
                          >
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            onClick={() => setDeleteId(inv.id)}
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
      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar Fatura</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="inv-number">N.º Fatura</Label>
              <Input
                id="inv-number"
                value={form.number}
                onChange={(e) => setForm((p) => ({ ...p, number: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="inv-client">Cliente</Label>
              <Input
                id="inv-client"
                value={form.clientName}
                onChange={(e) => setForm((p) => ({ ...p, clientName: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="inv-date">Data</Label>
                <Input
                  id="inv-date"
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="inv-due">Vencimento</Label>
                <Input
                  id="inv-due"
                  type="date"
                  value={form.dueDate}
                  onChange={(e) => setForm((p) => ({ ...p, dueDate: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="inv-status">Estado</Label>
              <Select
                value={form.status}
                onValueChange={(v) => v && setForm((p) => ({ ...p, status: v }))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecionar estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PENDENTE">Pendente</SelectItem>
                  <SelectItem value="PAGO">Pago</SelectItem>
                  <SelectItem value="VENCIDO">Vencido</SelectItem>
                  <SelectItem value="CANCELADO">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="inv-notes">Notas</Label>
              <Input
                id="inv-notes"
                value={form.notes}
                onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
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
