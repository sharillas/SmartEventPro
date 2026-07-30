"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, X, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Pagination } from "@/components/ui/pagination";

const statusBadge: Record<string, string> = {
  DRAFT: "border-gray-500 text-gray-400",
  ORCAMENTADO: "border-blue-500 text-blue-400",
  CONFIRMADO: "border-green-500 text-green-400",
  CANCELADO: "border-red-500 text-red-400",
};
const statusLabel: Record<string, string> = {
  DRAFT: "Draft",
  ORCAMENTADO: "Orçamentado",
  CONFIRMADO: "Confirmado",
  CANCELADO: "Cancelado",
};

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-PT", { style: "currency", currency: "EUR" }).format(value);
}
function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("pt-PT");
}

interface Filters { project: string; client: string; location: string; dateStart: string; dateEnd: string; status: string; }
const initialFilters: Filters = { project: "", client: "", location: "", dateStart: "", dateEnd: "", status: "" };

export default function OrcamentosPage() {
  const router = useRouter();
  const [quotations, setQuotations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<Filters>(initialFilters);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [refreshKey, setRefreshKey] = useState(0);
  useEffect(() => {
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("limit", "10");
    fetch(`/api/orcamentos?${params.toString()}`)
      .then(r => r.json())
      .then((result) => { setQuotations(result.data); setTotalPages(result.totalPages); })
      .finally(() => setLoading(false));
  }, [page, refreshKey]);

  async function handleDelete() {
    if (!deleteId) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/orcamentos/${deleteId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
      toast.success("Eliminado com sucesso.");
      setQuotations(prev => prev.filter(item => item.id !== deleteId));
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
      project: filters.project.toLowerCase(), client: filters.client.toLowerCase(),
      location: filters.location.toLowerCase(), dateStart: filters.dateStart,
      dateEnd: filters.dateEnd, status: filters.status,
    };
    if (!hasAnyFilter) return { matched: quotations, rest: [] };
    const m: any[] = []; const r: any[] = [];
    for (const q of quotations) {
      let ok = true;
      if (lf.project && !(q.number || "").toLowerCase().includes(lf.project)) ok = false;
      if (lf.client && !(q.client?.name || "").toLowerCase().includes(lf.client)) ok = false;
      if (lf.location && !(q.location || "").toLowerCase().includes(lf.location)) ok = false;
      if (lf.status && q.status !== lf.status) ok = false;
      if (lf.dateStart) { const d = q.startDate ? new Date(q.startDate) : null; if (!d || d < new Date(lf.dateStart)) ok = false; }
      if (lf.dateEnd) { const d = q.endDate ? new Date(q.endDate) : null; if (!d || d > new Date(lf.dateEnd)) ok = false; }
      if (ok) m.push({ ...q, _match: true }); else r.push(q);
    }
    return { matched: m, rest: r };
  }, [quotations, filters, hasAnyFilter]);

  const displayed = [...matched, ...rest];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Orçamentos</h1>
        <div className="flex gap-2">
          {hasAnyFilter && <Button variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground"><X className="h-4 w-4 mr-1" /> Limpar</Button>}
          <Button onClick={() => router.push("/orcamentos/novo")} size="sm"><Plus className="h-4 w-4 mr-2" /> Criar Orçamento</Button>
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap items-end justify-center gap-2 p-3 bg-card border border-border rounded-lg">
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] text-muted-foreground">Nº Orçamento</span>
          <input placeholder="PR_..." value={filters.project} onChange={e => setFilter("project", e.target.value)} className="w-[130px] h-7 text-xs bg-background border border-border rounded px-2 text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-primary/50" />
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] text-muted-foreground">Cliente</span>
          <input placeholder="Cliente" value={filters.client} onChange={e => setFilter("client", e.target.value)} className="w-[150px] h-7 text-xs bg-background border border-border rounded px-2 text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-primary/50" />
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] text-muted-foreground">Local</span>
          <input placeholder="Local" value={filters.location} onChange={e => setFilter("location", e.target.value)} className="w-[170px] h-7 text-xs bg-background border border-border rounded px-2 text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-primary/50" />
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] text-muted-foreground">Início</span>
          <input type="date" value={filters.dateStart} onChange={e => setFilter("dateStart", e.target.value)} className="w-[130px] h-7 text-xs bg-background border border-border rounded px-2 text-foreground outline-none focus:border-primary/50" />
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] text-muted-foreground">Fim</span>
          <input type="date" value={filters.dateEnd} onChange={e => setFilter("dateEnd", e.target.value)} className="w-[130px] h-7 text-xs bg-background border border-border rounded px-2 text-foreground outline-none focus:border-primary/50" />
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] text-muted-foreground">Estado</span>
          <Select value={filters.status} onValueChange={(v) => setFilter("status", !v || v === "all" ? "" : v)}>
            <SelectTrigger className="w-[130px] h-7 text-xs">
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="DRAFT">Draft</SelectItem>
              <SelectItem value="ORCAMENTADO">Orçamentado</SelectItem>
              <SelectItem value="CONFIRMADO">Confirmado</SelectItem>
              <SelectItem value="CANCELADO">Cancelado</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {hasAnyFilter && (
          <button onClick={clearFilters} className="h-7 px-3 text-xs text-muted-foreground hover:text-foreground border border-border rounded hover:bg-accent/50 transition-colors mb-0.5">
            Limpar
          </button>
        )}
      </div>

      <Card className="border-border bg-card">
        <div className="overflow-x-auto">
          <div className="min-w-[900px]">
          {loading ? (
            <p className="text-muted-foreground text-center py-12">A carregar...</p>
          ) : (
            <Table className="w-full">
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="p-1.5 whitespace-nowrap text-sm text-muted-foreground">Nº Orçamento</TableHead>
                  <TableHead className="p-1.5 whitespace-nowrap text-sm text-muted-foreground">Cliente</TableHead>
                  <TableHead className="p-1.5 whitespace-nowrap text-sm text-muted-foreground">Local</TableHead>
                  <TableHead className="p-1.5 whitespace-nowrap text-sm text-muted-foreground">Início</TableHead>
                  <TableHead className="p-1.5 whitespace-nowrap text-sm text-muted-foreground">Fim</TableHead>
                  <TableHead className="p-1.5 whitespace-nowrap text-sm text-muted-foreground">Estado</TableHead>
                  <TableHead className="p-1.5 whitespace-nowrap text-right text-sm text-muted-foreground">Total c/IVA</TableHead>
                  <TableHead className="p-1.5 whitespace-nowrap text-sm text-muted-foreground">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayed.length === 0 ? (
                  <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-12">Nenhum orçamento encontrado.</TableCell></TableRow>
                ) : (
                  displayed.map((q: any) => {
                    const isMatch = q._match || !hasAnyFilter;
                    return (
                      <TableRow key={q.id} className={`border-border hover:bg-accent/20 cursor-pointer transition-colors ${isMatch && hasAnyFilter ? "bg-primary/5 border-l-2 border-l-primary" : ""} ${!isMatch && hasAnyFilter ? "opacity-40" : ""}`} onClick={() => router.push(`/orcamentos/${q.number}`)}>
                        <TableCell className="font-medium text-foreground text-sm p-1.5 whitespace-nowrap">{q.number}</TableCell>
                        <TableCell className="text-foreground text-sm p-1.5 whitespace-nowrap">{q.client?.name || "—"}</TableCell>
                        <TableCell className="text-muted-foreground text-sm p-1.5 whitespace-nowrap">{q.location || "—"}</TableCell>
                        <TableCell className="text-foreground text-sm p-1.5 whitespace-nowrap">{formatDate(q.startDate)}</TableCell>
                        <TableCell className="text-foreground text-sm p-1.5 whitespace-nowrap">{formatDate(q.endDate)}</TableCell>
                        <TableCell className="p-1.5 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                          <Select value={q.status} onValueChange={async (v) => {
                            if (!v) return;
                            await fetch(`/api/orcamentos/${q.number}`, {
                              method: "PATCH",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ status: v }),
                            });
                            setRefreshKey(k => k + 1);
                          }}>
                            <SelectTrigger className="h-7 w-[120px] text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="DRAFT">Draft</SelectItem>
                              <SelectItem value="ORCAMENTADO">Orçamentado</SelectItem>
                              <SelectItem value="CONFIRMADO">Confirmado</SelectItem>
                              <SelectItem value="CANCELADO">Cancelado</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="text-right font-semibold text-primary text-sm p-1.5 whitespace-nowrap">{formatCurrency(q.total)}</TableCell>
                        <TableCell className="p-1.5 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon-xs"
                              onClick={(e) => { e.stopPropagation(); router.push(`/orcamentos/${q.number}`); }}
                              className="h-8 w-8"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon-xs" onClick={() => setDeleteId(q.id)} className="h-8 w-8">
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          )}
          </div>
        </div>
      </Card>

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />

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
