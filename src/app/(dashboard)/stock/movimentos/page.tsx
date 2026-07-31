"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
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
import { Plus, Trash2 } from "lucide-react";
import { Pagination } from "@/components/ui/pagination";
import { toast } from "sonner";
import { formatDateTime } from "@/lib/helpers";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

interface StockMovement {
  id: string;
  date: string;
  equipmentName: string;
  type: string;
  quantity: number;
  sourceWarehouse: string;
  destinationWarehouse: string;
  userName: string;
}

interface Equipment {
  id: string;
  name: string;
}

const typeBadge: Record<string, string> = {
  ENTRADA: "bg-green-100 text-green-800",
  SAIDA: "bg-red-100 text-red-800",
  TRANSFERENCIA: "bg-blue-100 text-blue-800",
  AVARIA: "bg-yellow-100 text-yellow-800",
  REPARACAO_CONCLUIDA: "bg-purple-100 text-purple-800",
};

const typeLabel: Record<string, string> = {
  ENTRADA: "Entrada",
  SAIDA: "Saída",
  TRANSFERENCIA: "Transferência",
  AVARIA: "Avaria",
  REPARACAO_CONCLUIDA: "Reparação Concluída",
};

interface Filters {
  equipment: string;
  type: string;
  warehouse: string;
}
const initialFilters: Filters = { equipment: "", type: "", warehouse: "" };

export default function MovimentosStockPage() {
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [filters, setFilters] = useState<Filters>(initialFilters);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [form, setForm] = useState({
    equipmentId: "",
    type: "",
    quantity: "",
    sourceWarehouse: "",
    destinationWarehouse: "",
    notes: "",
  });

  useEffect(() => { fetchMovements(); }, [page]);

  function fetchMovements() {
    setLoading(true);
    fetch(`/api/stock/movimentos?page=${page}&limit=10`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch");
        return res.json();
      })
      .then((result) => {
        setMovements(result.data);
        setTotalPages(result.totalPages);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    fetch("/api/equipamentos?limit=1000")
      .then((r) => (r.ok ? r.json() : { data: [] }))
      .then((result) => setEquipment(result.data || result))
      .catch(() => {});
  }, []);

  const equipmentItems = useMemo(() => Object.fromEntries(equipment.map((e) => [e.id, e.name] as const)), [equipment]);

  async function handleDelete() {
    if (!deleteId) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/stock/movimentos/${deleteId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
      toast.success("Eliminado com sucesso.");
      fetchMovements();
    } catch {
      toast.error("Erro ao eliminar.");
    } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  }

  async function handleSubmit() {
    setSubmitting(true);
    try {
      const res = await fetch("/api/stock/movimentos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          equipmentId: form.equipmentId,
          type: form.type,
          quantity: Number(form.quantity),
          sourceWarehouse: form.sourceWarehouse,
          destinationWarehouse: form.destinationWarehouse,
          notes: form.notes,
        }),
      });
      if (!res.ok) throw new Error("Failed to create");
      toast.success("Movimento registado com sucesso.");
      setDialogOpen(false);
      setForm({ equipmentId: "", type: "", quantity: "", sourceWarehouse: "", destinationWarehouse: "", notes: "" });
      fetchMovements();
    } catch {
      toast.error("Erro ao registar movimento.");
    } finally {
      setSubmitting(false);
    }
  }

  function setFilter(key: keyof Filters, value: string) { setFilters(prev => ({ ...prev, [key]: value })); }
  function clearFilters() { setFilters(initialFilters); }
  const hasAnyFilter = Object.values(filters).some(v => v !== "");

  const { matched, rest } = useMemo(() => {
    const lf = {
      equipment: filters.equipment.toLowerCase(),
      type: filters.type,
      warehouse: filters.warehouse.toLowerCase(),
    };
    if (!hasAnyFilter) return { matched: movements, rest: [] };
    const m: StockMovement[] = []; const r: StockMovement[] = [];
    for (const mov of movements) {
      let ok = true;
      if (lf.equipment && !(mov.equipmentName || "").toLowerCase().includes(lf.equipment)) ok = false;
      if (lf.type && mov.type !== lf.type) ok = false;
      if (lf.warehouse && !((mov.sourceWarehouse || "") + " " + (mov.destinationWarehouse || "")).toLowerCase().includes(lf.warehouse)) ok = false;
      if (ok) m.push({ ...mov, _match: true } as any); else r.push(mov);
    }
    return { matched: m, rest: r };
  }, [movements, filters, hasAnyFilter]);

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
        <h1 className="text-2xl font-bold tracking-tight">Movimentos de Stock</h1>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap items-end justify-center gap-2 p-3 bg-card border border-border rounded-lg">
        <div className="flex flex-col gap-0.5">
          <span className="text-xs text-muted-foreground">Equipamento</span>
          <input placeholder="Equipamento" value={filters.equipment} onChange={e => setFilter("equipment", e.target.value)} className="w-[160px] h-8 text-sm bg-background border border-border rounded px-2 text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-primary/50" />
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-xs text-muted-foreground">Tipo</span>
          <select value={filters.type} onChange={e => setFilter("type", e.target.value)} className="w-[140px] h-8 text-sm bg-background border border-border rounded px-2 text-foreground outline-none focus:border-primary/50">
            <option value="">Todos</option>
            <option value="ENTRADA">Entrada</option>
            <option value="SAIDA">Saída</option>
            <option value="TRANSFERENCIA">Transferência</option>
            <option value="AVARIA">Avaria</option>
            <option value="REPARACAO_CONCLUIDA">Reparação Concluída</option>
          </select>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-xs text-muted-foreground">Armazém</span>
          <input placeholder="Armazém" value={filters.warehouse} onChange={e => setFilter("warehouse", e.target.value)} className="w-[130px] h-8 text-sm bg-background border border-border rounded px-2 text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-primary/50" />
        </div>
        {hasAnyFilter && (
          <button onClick={clearFilters} className="h-8 px-3 text-sm text-muted-foreground hover:text-foreground border border-border rounded hover:bg-accent/50 transition-colors mb-0.5">
            Limpar
          </button>
        )}
      </div>

      <div className="flex items-center justify-end">
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-1 h-4 w-4" />
          Registar Movimento
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <div className="min-w-[900px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="whitespace-nowrap text-sm">Data</TableHead>
                    <TableHead className="whitespace-nowrap text-sm">Equipamento</TableHead>
                    <TableHead className="whitespace-nowrap text-sm">Tipo</TableHead>
                    <TableHead className="whitespace-nowrap text-sm">Quantidade</TableHead>
                    <TableHead className="whitespace-nowrap text-sm">Armazém Origem</TableHead>
                    <TableHead className="whitespace-nowrap text-sm">Armazém Destino</TableHead>
                    <TableHead className="whitespace-nowrap text-sm">Utilizador</TableHead>
                    <TableHead className="whitespace-nowrap text-sm p-1.5">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayed.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-muted-foreground text-sm whitespace-nowrap">
                        Nenhum registo encontrado.
                      </TableCell>
                    </TableRow>
                  ) : (
                    displayed.map((mov: any) => {
                      const isMatch = mov._match || !hasAnyFilter;
                      return (
                      <TableRow key={mov.id} className={isMatch && hasAnyFilter ? "bg-primary/5 border-l-2 border-l-primary" : (!isMatch && hasAnyFilter ? "opacity-40" : "")}>
                        <TableCell className="whitespace-nowrap text-sm">{formatDateTime(mov.date)}</TableCell>
                        <TableCell className="font-medium whitespace-nowrap text-sm">{mov.equipmentName}</TableCell>
                        <TableCell className="whitespace-nowrap text-sm">
                          <Badge variant="secondary" className={typeBadge[mov.type] ?? ""}>
                            {typeLabel[mov.type] ?? mov.type}
                          </Badge>
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-sm">{mov.quantity}</TableCell>
                        <TableCell className="whitespace-nowrap text-sm">{mov.sourceWarehouse}</TableCell>
                        <TableCell className="whitespace-nowrap text-sm">{mov.destinationWarehouse}</TableCell>
                        <TableCell className="whitespace-nowrap text-sm">{mov.userName}</TableCell>
                        <TableCell className="whitespace-nowrap text-sm p-1.5">
                          <Button variant="ghost" size="icon-xs" onClick={() => setDeleteId(mov.id)} className="h-7 w-7">
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
            <DialogTitle>Registar Movimento</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Equipamento</Label>
              <Select
                value={form.equipmentId}
                onValueChange={(v) => v && setForm((p) => ({ ...p, equipmentId: v }))}
                items={equipmentItems}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecionar equipamento" />
                </SelectTrigger>
                <SelectContent>
                  {equipment.map((eq) => (
                    <SelectItem key={eq.id} value={eq.id}>
                      {eq.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select
                value={form.type}
                onValueChange={(v) => v && setForm((p) => ({ ...p, type: v }))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecionar tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ENTRADA">Entrada</SelectItem>
                  <SelectItem value="SAIDA">Saída</SelectItem>
                  <SelectItem value="TRANSFERENCIA">Transferência</SelectItem>
                  <SelectItem value="AVARIA">Avaria</SelectItem>
                  <SelectItem value="REPARACAO_CONCLUIDA">Reparação Concluída</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="mov-quantity">Quantidade</Label>
              <Input
                id="mov-quantity"
                type="number"
                value={form.quantity}
                onChange={(e) => setForm((p) => ({ ...p, quantity: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mov-source">Armazém Origem</Label>
              <Input
                id="mov-source"
                value={form.sourceWarehouse}
                onChange={(e) => setForm((p) => ({ ...p, sourceWarehouse: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mov-dest">Armazém Destino</Label>
              <Input
                id="mov-dest"
                value={form.destinationWarehouse}
                onChange={(e) => setForm((p) => ({ ...p, destinationWarehouse: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mov-notes">Notas</Label>
              <Textarea
                id="mov-notes"
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
