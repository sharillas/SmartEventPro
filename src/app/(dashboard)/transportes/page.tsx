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
import { Plus, Pencil, Trash2, Truck } from "lucide-react";
import { Pagination } from "@/components/ui/pagination";
import { toast } from "sonner";
import { formatDateTime } from "@/lib/helpers";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

interface Transport {
  id: string;
  number: string;
  projectName: string;
  vehicleName: string;
  driverName: string;
  departure: string;
  arrival: string;
  status: string;
}

const statusBadge: Record<string, string> = {
  PENDENTE: "bg-yellow-100 text-yellow-800",
  EM_TRANSITO: "bg-purple-100 text-purple-800",
  CONCLUIDO: "bg-green-100 text-green-800",
  CANCELADO: "bg-red-100 text-red-800",
};

const statusLabel: Record<string, string> = {
  PENDENTE: "Pendente",
  EM_TRANSITO: "Em Trânsito",
  CONCLUIDO: "Concluído",
  CANCELADO: "Cancelado",
};

interface Filters {
  number: string;
  origin: string;
  destination: string;
  status: string;
}
const initialFilters: Filters = { number: "", origin: "", destination: "", status: "" };

const emptyForm = {
  projectId: "",
  vehicleId: "",
  driver: "",
  departure: "",
  arrival: "",
  notes: "",
};

export default function TransportesPage() {
  const [transports, setTransports] = useState<Transport[]>([]);
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
    fetch(`/api/transportes?page=${page}&limit=10`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch");
        return res.json();
      })
      .then((result) => {
        setTransports(result.data);
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
        const res = await fetch(`/api/transportes/${editId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        if (!res.ok) throw new Error("Failed to update");
        toast.success("Guia de transporte atualizada com sucesso.");
      } else {
        const res = await fetch("/api/transportes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        if (!res.ok) throw new Error("Failed to create");
        toast.success("Guia de transporte criada com sucesso.");
      }
      fetchData();
      setDialogOpen(false);
      setForm(emptyForm);
      setEditId(null);
    } catch {
      toast.error(editId ? "Erro ao atualizar guia de transporte." : "Erro ao criar guia de transporte.");
    } finally {
      setSubmitting(false);
    }
  }

  function handleEdit(t: Transport) {
    setEditId(t.id);
    setForm({
      projectId: "",
      vehicleId: "",
      driver: t.driverName || "",
      departure: t.departure ? t.departure.slice(0, 16) : "",
      arrival: t.arrival ? t.arrival.slice(0, 16) : "",
      notes: "",
    });
    setDialogOpen(true);
  }

  async function handleDelete() {
    if (!deleteId) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/transportes/${deleteId}`, { method: "DELETE" });
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
      origin: filters.origin.toLowerCase(),
      destination: filters.destination.toLowerCase(),
      status: filters.status,
    };
    if (!hasAnyFilter) return { matched: transports, rest: [] };
    const m: Transport[] = []; const r: Transport[] = [];
    for (const t of transports) {
      let ok = true;
      if (lf.number && !(t.number || "").toLowerCase().includes(lf.number)) ok = false;
      if (lf.origin && !(t.projectName || "").toLowerCase().includes(lf.origin)) ok = false;
      if (lf.destination && !(t.vehicleName || "").toLowerCase().includes(lf.destination)) ok = false;
      if (lf.status && t.status !== lf.status) ok = false;
      if (ok) m.push({ ...t, _match: true } as any); else r.push(t);
    }
    return { matched: m, rest: r };
  }, [transports, filters, hasAnyFilter]);

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
        <h1 className="text-2xl font-bold text-foreground">Guias de Transporte</h1>
        <Button onClick={() => { setEditId(null); setForm(emptyForm); setDialogOpen(true); }}>
          <Plus className="mr-1 h-4 w-4" />
          Nova Guia de Transporte
        </Button>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap items-end justify-center gap-2 p-3 bg-card border border-border rounded-lg">
        <div className="flex flex-col gap-0.5">
          <span className="text-xs text-muted-foreground">N.º Guia</span>
          <input placeholder="N.º" value={filters.number} onChange={e => setFilter("number", e.target.value)} className="w-[110px] h-8 text-sm bg-background border border-border rounded px-2 text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-primary/50" />
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-xs text-muted-foreground">Origem</span>
          <input placeholder="Origem" value={filters.origin} onChange={e => setFilter("origin", e.target.value)} className="w-[150px] h-8 text-sm bg-background border border-border rounded px-2 text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-primary/50" />
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-xs text-muted-foreground">Destino</span>
          <input placeholder="Destino" value={filters.destination} onChange={e => setFilter("destination", e.target.value)} className="w-[150px] h-8 text-sm bg-background border border-border rounded px-2 text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-primary/50" />
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-xs text-muted-foreground">Estado</span>
          <input placeholder="Estado" value={filters.status} onChange={e => setFilter("status", e.target.value)} className="w-[110px] h-8 text-sm bg-background border border-border rounded px-2 text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-primary/50" />
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
                    <TableHead className="whitespace-nowrap text-sm">N.º</TableHead>
                    <TableHead className="whitespace-nowrap text-sm">Projeto</TableHead>
                    <TableHead className="whitespace-nowrap text-sm">Veículo</TableHead>
                    <TableHead className="whitespace-nowrap text-sm">Motorista</TableHead>
                    <TableHead className="whitespace-nowrap text-sm">Partida</TableHead>
                    <TableHead className="whitespace-nowrap text-sm">Chegada</TableHead>
                    <TableHead className="whitespace-nowrap text-sm">Estado</TableHead>
                    <TableHead className="whitespace-nowrap text-sm">Ações</TableHead>
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
                    displayed.map((t: any) => {
                      const isMatch = t._match || !hasAnyFilter;
                      return (
                      <TableRow key={t.id} className={isMatch && hasAnyFilter ? "bg-primary/5 border-l-2 border-l-primary" : (!isMatch && hasAnyFilter ? "opacity-40" : "")}>
                        <TableCell className="font-medium whitespace-nowrap text-sm">{t.number}</TableCell>
                        <TableCell className="whitespace-nowrap text-sm">{t.projectName}</TableCell>
                        <TableCell className="whitespace-nowrap text-sm">{t.vehicleName}</TableCell>
                        <TableCell className="whitespace-nowrap text-sm">{t.driverName}</TableCell>
                        <TableCell className="whitespace-nowrap text-sm">
                          {t.departure ? formatDateTime(t.departure) : "-"}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-sm">
                          {t.arrival ? formatDateTime(t.arrival) : "-"}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-sm">
                          <Badge variant="secondary" className={statusBadge[t.status] ?? ""}>
                            {statusLabel[t.status] ?? t.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-sm">
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            onClick={() => handleEdit(t)}
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
            <DialogTitle>{editId ? "Editar Guia de Transporte" : "Nova Guia de Transporte"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="t-project">Projeto</Label>
              <Select
                value={form.projectId}
                onValueChange={(v) => v && handleChange("projectId", v)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecionar projeto" />
                </SelectTrigger>
                <SelectContent>
                  {/* Projects will be populated from API in production */}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="t-vehicle">Veículo</Label>
              <Select
                value={form.vehicleId}
                onValueChange={(v) => v && handleChange("vehicleId", v)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecionar veículo" />
                </SelectTrigger>
                <SelectContent>
                  {/* Vehicles will be populated from API in production */}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="t-driver">Motorista</Label>
              <Input
                id="t-driver"
                value={form.driver}
                onChange={(e) => handleChange("driver", e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="t-departure">Partida</Label>
                <Input
                  id="t-departure"
                  type="datetime-local"
                  value={form.departure}
                  onChange={(e) => handleChange("departure", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="t-arrival">Chegada</Label>
                <Input
                  id="t-arrival"
                  type="datetime-local"
                  value={form.arrival}
                  onChange={(e) => handleChange("arrival", e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="t-notes">Notas</Label>
              <Textarea
                id="t-notes"
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
