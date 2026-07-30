"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Package, Pencil, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { formatCurrency } from "@/lib/helpers";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Pagination } from "@/components/ui/pagination";
import { toast } from "sonner";

interface Equipment {
  id: string;
  name: string;
  sku: string;
  categoryName: string;
  brand: string;
  quantity: number;
  pricePerDay: number;
  status: string;
  imageUrl?: string;
}

const statusBadge: Record<string, string> = {
  DISPONIVEL: "bg-green-100 text-green-800",
  ALUGADO: "bg-blue-100 text-blue-800",
  EM_REPARACAO: "bg-yellow-100 text-yellow-800",
  ABATIDO: "bg-red-100 text-red-800",
  EXTRAVIADO: "bg-red-100 text-red-800",
};

const statusLabel: Record<string, string> = {
  DISPONIVEL: "Disponível",
  ALUGADO: "Alugado",
  EM_REPARACAO: "Em Reparação",
  ABATIDO: "Abatido",
  EXTRAVIADO: "Extraviado",
};

interface Filters {
  name: string;
  sku: string;
  category: string;
  brand: string;
  status: string;
}
const initialFilters: Filters = { name: "", sku: "", category: "", brand: "", status: "" };

export default function EquipamentosPage() {
  const router = useRouter();
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState<Filters>(initialFilters);

  useEffect(() => {
    async function fetchData() {
      try {
        const params = new URLSearchParams();
        params.set("page", String(page));
        params.set("limit", "10");
        const res = await fetch(`/api/equipamentos?${params.toString()}`);
        if (!res.ok) throw new Error("Failed to fetch");
        const result = await res.json();
        setEquipment(result.data);
        setTotalPages(result.totalPages);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [page]);

  async function handleDelete() {
    if (!deleteId) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/equipamentos/${deleteId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
      toast.success("Eliminado com sucesso.");
      setEquipment(prev => prev.filter(item => item.id !== deleteId));
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
      name: filters.name.toLowerCase(),
      sku: filters.sku.toLowerCase(),
      category: filters.category.toLowerCase(),
      brand: filters.brand.toLowerCase(),
      status: filters.status,
    };
    if (!hasAnyFilter) return { matched: equipment, rest: [] };
    const m: Equipment[] = []; const r: Equipment[] = [];
    for (const e of equipment) {
      let ok = true;
      if (lf.name && !(e.name || "").toLowerCase().includes(lf.name)) ok = false;
      if (lf.sku && !(e.sku || "").toLowerCase().includes(lf.sku)) ok = false;
      if (lf.category && !(e.categoryName || "").toLowerCase().includes(lf.category)) ok = false;
      if (lf.brand && !(e.brand || "").toLowerCase().includes(lf.brand)) ok = false;
      if (lf.status && e.status !== lf.status) ok = false;
      if (ok) m.push({ ...e, _match: true } as any); else r.push(e);
    }
    return { matched: m, rest: r };
  }, [equipment, filters, hasAnyFilter]);

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
        <h1 className="text-2xl font-bold tracking-tight">Equipamentos</h1>
        <Button onClick={() => router.push("/equipamentos/novo")}>
          <Plus className="mr-1 h-4 w-4" />
          Novo Equipamento
        </Button>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap items-end justify-center gap-2 p-3 bg-card border border-border rounded-lg">
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] text-muted-foreground">Nome</span>
          <input placeholder="Nome" value={filters.name} onChange={e => setFilter("name", e.target.value)} className="w-[150px] h-7 text-xs bg-background border border-border rounded px-2 text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-primary/50" />
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] text-muted-foreground">SKU</span>
          <input placeholder="SKU" value={filters.sku} onChange={e => setFilter("sku", e.target.value)} className="w-[120px] h-7 text-xs bg-background border border-border rounded px-2 text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-primary/50" />
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] text-muted-foreground">Categoria</span>
          <input placeholder="Categoria" value={filters.category} onChange={e => setFilter("category", e.target.value)} className="w-[130px] h-7 text-xs bg-background border border-border rounded px-2 text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-primary/50" />
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] text-muted-foreground">Marca</span>
          <input placeholder="Marca" value={filters.brand} onChange={e => setFilter("brand", e.target.value)} className="w-[120px] h-7 text-xs bg-background border border-border rounded px-2 text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-primary/50" />
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
                    <TableHead className="whitespace-nowrap text-sm">Imagem</TableHead>
                  <TableHead className="whitespace-nowrap text-sm">Nome</TableHead>
                    <TableHead className="whitespace-nowrap text-sm">SKU</TableHead>
                    <TableHead className="whitespace-nowrap text-sm">Categoria</TableHead>
                    <TableHead className="whitespace-nowrap text-sm">Marca</TableHead>
                    <TableHead className="whitespace-nowrap text-sm">Quantidade</TableHead>
                    <TableHead className="whitespace-nowrap text-sm">Preço/Dia</TableHead>
                    <TableHead className="whitespace-nowrap text-sm">Estado</TableHead>
                    <TableHead className="whitespace-nowrap text-sm p-1.5">Ações</TableHead>
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
                    displayed.map((item: any) => {
                      const isMatch = item._match || !hasAnyFilter;
                      return (
                      <TableRow key={item.id} className={isMatch && hasAnyFilter ? "bg-primary/5 border-l-2 border-l-primary" : (!isMatch && hasAnyFilter ? "opacity-40" : "")}>
                        <TableCell className="whitespace-nowrap text-sm">
                          {item.imageUrl ? (
                            <img src={item.imageUrl} className="h-10 w-10 rounded object-cover" />
                          ) : (
                            <Package className="h-10 w-10 text-muted-foreground" />
                          )}
                        </TableCell>
                        <TableCell className="font-medium whitespace-nowrap text-sm">{item.name}</TableCell>
                        <TableCell className="whitespace-nowrap text-sm">{item.sku}</TableCell>
                        <TableCell className="whitespace-nowrap text-sm">{item.categoryName}</TableCell>
                        <TableCell className="whitespace-nowrap text-sm">{item.brand}</TableCell>
                        <TableCell className="whitespace-nowrap text-sm">{item.quantity}</TableCell>
                        <TableCell className="whitespace-nowrap text-sm">{formatCurrency(item.pricePerDay)}</TableCell>
                        <TableCell className="whitespace-nowrap text-sm">
                          <Badge variant="secondary" className={statusBadge[item.status] ?? ""}>
                            {statusLabel[item.status] ?? item.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-sm p-1.5">
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="icon-xs" onClick={() => router.push(`/equipamentos/${item.id}`)} className="h-8 w-8">
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon-xs" onClick={() => setDeleteId(item.id)} className="h-8 w-8">
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
            </div>
          </div>
        </CardContent>
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
