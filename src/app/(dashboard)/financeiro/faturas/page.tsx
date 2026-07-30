"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { FileDown, FileUp, Paperclip, Pencil, Trash2 } from "lucide-react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Pagination } from "@/components/ui/pagination";

const statusBadge: Record<string, string> = {
  PENDENTE: "bg-yellow-500/20 text-yellow-400",
  PAGO: "bg-green-500/20 text-green-400",
  VENCIDO: "bg-red-500/20 text-red-400",
  CANCELADO: "bg-gray-500/20 text-gray-400",
};
const statusLabel: Record<string, string> = {
  PENDENTE: "Pendente",
  PAGO: "Pago",
  VENCIDO: "Vencido",
  CANCELADO: "Cancelado",
};

export default function FinanceiroFaturasPage() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editModal, setEditModal] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  interface Filters { number: string; client: string; status: string; }
  const initialFilters: Filters = { number: "", client: "", status: "" };
  const [filters, setFilters] = useState<Filters>(initialFilters);
  function setFilter(key: keyof Filters, value: string) { setFilters(prev => ({ ...prev, [key]: value })); }
  function clearFilters() { setFilters(initialFilters); }
  const hasAnyFilter = Object.values(filters).some(v => v !== "");

  const { matched, rest } = useMemo(() => {
    const lf = { number: filters.number.toLowerCase(), client: filters.client.toLowerCase(), status: filters.status };
    if (!hasAnyFilter) return { matched: invoices, rest: [] };
    const m: any[] = []; const r: any[] = [];
    for (const inv of invoices) {
      let ok = true;
      if (lf.number && !(inv.number || "").toLowerCase().includes(lf.number)) ok = false;
      if (lf.client && !(inv.client?.name || "").toLowerCase().includes(lf.client)) ok = false;
      if (lf.status && inv.status !== lf.status) ok = false;
      if (ok) m.push({ ...inv, _match: true }); else r.push(inv);
    }
    return { matched: m, rest: r };
  }, [invoices, filters, hasAnyFilter]);

  const displayed = [...matched, ...rest];

  useEffect(() => { fetchData(); }, [page]);

  async function fetchData() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", "10");
      const res = await fetch(`/api/faturas?${params.toString()}`);
      const result = await res.json();
      setInvoices(result.data);
      setTotalPages(result.totalPages);
    } catch { toast.error("Erro ao carregar faturas."); }
    setLoading(false);
  }

  function handleEdit(invoice: any) {
    setSelected({ ...invoice });
    setEditModal(true);
  }

  async function handleSave() {
    try {
      const res = await fetch(`/api/faturas/${selected.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(selected),
      });
      if (!res.ok) throw new Error("Failed to update");
      toast.success("Fatura atualizada com sucesso.");
      const data = await res.json();
      setInvoices((prev) => prev.map((inv) => (inv.id === selected.id ? data : inv)));
      setEditModal(false);
    } catch {
      toast.error("Erro ao atualizar fatura.");
    }
  }

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Faturas</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="border-border">
            <FileUp className="h-4 w-4 mr-2" /> Importar PDF
          </Button>
          <Button variant="outline" size="sm" className="border-border">
            <FileDown className="h-4 w-4 mr-2" /> Exportar
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-end justify-center gap-2 p-3 bg-card border border-border rounded-lg">
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] text-muted-foreground">N.º Fatura</span>
          <input placeholder="N.º" value={filters.number} onChange={e => setFilter("number", e.target.value)} className="w-[130px] h-7 text-xs bg-background border border-border rounded px-2 text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-primary/50" />
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] text-muted-foreground">Cliente</span>
          <input placeholder="Cliente" value={filters.client} onChange={e => setFilter("client", e.target.value)} className="w-[150px] h-7 text-xs bg-background border border-border rounded px-2 text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-primary/50" />
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

      <Card className="border-border bg-card">
        <CardHeader><CardTitle className="text-card-foreground">Lista de Faturas</CardTitle></CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <p className="text-muted-foreground text-center py-8">A carregar...</p>
          ) : displayed.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">Nenhuma fatura encontrada.</p>
          ) : (
            <div className="overflow-x-auto">
              <div className="min-w-[900px]">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border">
                      <TableHead className="text-muted-foreground whitespace-nowrap text-sm">N.º</TableHead>
                      <TableHead className="text-muted-foreground whitespace-nowrap text-sm">Cliente</TableHead>
                      <TableHead className="text-muted-foreground whitespace-nowrap text-sm">Data</TableHead>
                      <TableHead className="text-muted-foreground whitespace-nowrap text-sm">Total</TableHead>
                      <TableHead className="text-muted-foreground whitespace-nowrap text-sm">Estado</TableHead>
                      <TableHead className="text-muted-foreground whitespace-nowrap text-sm">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {displayed.map((inv: any) => (
                      <TableRow key={inv.id} className={`border-border ${inv._match && hasAnyFilter ? "bg-primary/5 border-l-2 border-l-primary" : ""} ${!inv._match && hasAnyFilter ? "opacity-40" : ""}`}>
                        <TableCell className="text-foreground whitespace-nowrap text-sm">{inv.number}</TableCell>
                        <TableCell className="text-foreground whitespace-nowrap text-sm">{inv.client?.name || "—"}</TableCell>
                        <TableCell className="text-foreground whitespace-nowrap text-sm">{new Date(inv.date).toLocaleDateString("pt-PT")}</TableCell>
                        <TableCell className="text-foreground whitespace-nowrap text-sm">{new Intl.NumberFormat("pt-PT", { style: "currency", currency: "EUR" }).format(inv.total)}</TableCell>
                        <TableCell className="whitespace-nowrap text-sm"><Badge className={statusBadge[inv.status] || ""}>{statusLabel[inv.status] || inv.status}</Badge></TableCell>
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
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />

      <Dialog open={editModal} onOpenChange={setEditModal}>
        <DialogContent className="bg-card text-card-foreground border-border max-w-lg">
          <DialogHeader><DialogTitle>Editar Fatura</DialogTitle></DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">N.º Fatura</label>
                <Input value={selected.number} disabled className="bg-background border-border" />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">Estado</label>
                <Select value={selected.status} onValueChange={(v) => v && setSelected({ ...selected, status: v })}>
                  <SelectTrigger className="bg-background border-border"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PENDENTE">Pendente</SelectItem>
                    <SelectItem value="PAGO">Pago</SelectItem>
                    <SelectItem value="VENCIDO">Vencido</SelectItem>
                    <SelectItem value="CANCELADO">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">Anexos</label>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Paperclip className="h-4 w-4" /> Nenhum anexo
                </div>
                <Button variant="outline" size="sm" className="border-border">
                  <FileUp className="h-4 w-4 mr-2" /> Anexar PDF
                </Button>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditModal(false)} className="border-border">Cancelar</Button>
            <Button onClick={handleSave}>Guardar</Button>
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
