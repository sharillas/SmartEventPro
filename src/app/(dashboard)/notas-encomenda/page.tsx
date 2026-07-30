"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, FileText, Pencil, Trash2 } from "lucide-react";
import { Pagination } from "@/components/ui/pagination";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

const statusBadge: Record<string, string> = {
  PENDENTE: "border-yellow-500 text-yellow-400",
  APROVADO: "border-blue-500 text-blue-400",
  ENCOMENDADO: "border-purple-500 text-purple-400",
  RECEBIDO: "border-green-500 text-green-400",
  CANCELADO: "border-red-500 text-red-400",
};
const statusLabel: Record<string, string> = {
  PENDENTE: "Pendente",
  APROVADO: "Aprovado",
  ENCOMENDADO: "Encomendado",
  RECEBIDO: "Recebido",
  CANCELADO: "Cancelado",
};

const DEPARTMENT_LABELS: Record<string, string> = {
  AUDIO: "Áudio",
  ILUMINACAO: "Iluminação",
  VIDEO: "Vídeo",
  ESTRUTURAS: "Estruturas",
  MOBILIARIO: "Mobiliário",
  ADMINISTRACAO: "Administração",
  RECURSOS_HUMANOS: "Recursos Humanos",
  COMERCIAL: "Comercial",
  TRANSPORTES: "Transportes",
};

function f(value: number) {
  return new Intl.NumberFormat("pt-PT", { style: "currency", currency: "EUR" }).format(value);
}

function fd(value: string) {
  return value ? new Date(value).toLocaleDateString("pt-PT") : "—";
}

interface Filters {
  number: string;
  supplier: string;
  status: string;
}
const initialFilters: Filters = { number: "", supplier: "", status: "" };

export default function NotasEncomendaPage() {
  const router = useRouter();
  const [notes, setNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState<Filters>(initialFilters);

  function fetchData() {
    setLoading(true);
    fetch(`/api/notas-encomenda?page=${page}&limit=10`)
      .then((r) => r.json())
      .then((result) => {
        setNotes(result.data);
        setTotalPages(result.totalPages);
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => { fetchData(); }, [page]);

  async function handleDelete() {
    if (!deleteId) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/notas-encomenda/${deleteId}`, { method: "DELETE" });
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
      supplier: filters.supplier.toLowerCase(),
      status: filters.status,
    };
    if (!hasAnyFilter) return { matched: notes, rest: [] };
    const m: any[] = []; const r: any[] = [];
    for (const n of notes) {
      let ok = true;
      if (lf.number && !(n.number || "").toLowerCase().includes(lf.number)) ok = false;
      if (lf.supplier && !(n.supplier?.name || "").toLowerCase().includes(lf.supplier)) ok = false;
      if (lf.status && n.status !== lf.status) ok = false;
      if (ok) m.push({ ...n, _match: true }); else r.push(n);
    }
    return { matched: m, rest: r };
  }, [notes, filters, hasAnyFilter]);

  const displayed = [...matched, ...rest];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Notas de Encomenda</h1>
        <Button onClick={() => router.push("/notas-encomenda/novo")} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Nova Nota de Encomenda
        </Button>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap items-end justify-center gap-2 p-3 bg-card border border-border rounded-lg">
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] text-muted-foreground">N.º NE</span>
          <input placeholder="N.º" value={filters.number} onChange={e => setFilter("number", e.target.value)} className="w-[110px] h-7 text-xs bg-background border border-border rounded px-2 text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-primary/50" />
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] text-muted-foreground">Fornecedor</span>
          <input placeholder="Fornecedor" value={filters.supplier} onChange={e => setFilter("supplier", e.target.value)} className="w-[150px] h-7 text-xs bg-background border border-border rounded px-2 text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-primary/50" />
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

      <Card className="border-border bg-card">
        <div className="overflow-x-auto">
          <div className="min-w-[800px]">
            {loading ? (
              <p className="text-muted-foreground text-center py-12">A carregar...</p>
            ) : displayed.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-40" />
                <p className="text-muted-foreground">Nenhuma nota de encomenda.</p>
              </div>
            ) : (
              <Table className="w-full">
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="p-1.5 whitespace-nowrap text-sm text-muted-foreground">N.º</TableHead>
                    <TableHead className="p-1.5 whitespace-nowrap text-sm text-muted-foreground">Fornecedor</TableHead>
                    <TableHead className="p-1.5 whitespace-nowrap text-sm text-muted-foreground">Departamento</TableHead>
                    <TableHead className="p-1.5 whitespace-nowrap text-sm text-muted-foreground">Data</TableHead>
                    <TableHead className="p-1.5 whitespace-nowrap text-sm text-muted-foreground">Estado</TableHead>
                    <TableHead className="p-1.5 whitespace-nowrap text-right text-sm text-muted-foreground">Total</TableHead>
                    <TableHead className="p-1.5 whitespace-nowrap text-sm text-muted-foreground">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayed.map((n: any) => (
                    <TableRow
                      key={n.id}
                      className={`border-border hover:bg-accent/20 cursor-pointer ${n._match && hasAnyFilter ? "bg-primary/5 border-l-2 border-l-primary" : (!n._match && hasAnyFilter ? "opacity-40" : "")}`}
                      onClick={() => router.push(`/notas-encomenda/${n.number}`)}
                    >
                      <TableCell className="font-medium text-foreground text-sm p-1.5 whitespace-nowrap">{n.number}</TableCell>
                      <TableCell className="text-foreground text-sm p-1.5 whitespace-nowrap">{n.supplier?.name || "—"}</TableCell>
                      <TableCell className="text-foreground text-sm p-1.5 whitespace-nowrap">
                        {n.department ? (DEPARTMENT_LABELS[n.department] || n.department) : "—"}
                      </TableCell>
                      <TableCell className="text-foreground text-sm p-1.5 whitespace-nowrap">{fd(n.date)}</TableCell>
                      <TableCell className="p-1.5 whitespace-nowrap">
                        <Badge variant="outline" className={`bg-transparent border text-xs px-1 py-0 ${statusBadge[n.status] || ""}`}>
                          {statusLabel[n.status] || n.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-semibold text-primary text-sm p-1.5 whitespace-nowrap">
                        {f(n.total)}
                      </TableCell>
                      <TableCell className="p-1.5 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon-xs" onClick={(e) => { e.stopPropagation(); router.push(`/notas-encomenda/${n.number}`); }} className="h-8 w-8">
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon-xs" onClick={() => setDeleteId(n.id)} className="h-8 w-8">
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </div>
      </Card>

      <Pagination page={page} totalPages={totalPages} onPageChange={(p) => setPage(p)} />

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
