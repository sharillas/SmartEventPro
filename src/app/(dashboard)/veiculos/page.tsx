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
import { Plus, Car, Pencil, Trash2 } from "lucide-react";
import { Pagination } from "@/components/ui/pagination";
import { toast } from "sonner";
import { formatDate } from "@/lib/helpers";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

interface Vehicle {
  id: string;
  name: string;
  plate: string;
  brand: string;
  model: string;
  type: string;
  status: string;
  insuranceDate: string;
  inspectionDate: string;
}

const statusBadge: Record<string, string> = {
  DISPONIVEL: "bg-green-100 text-green-800",
  EM_USO: "bg-blue-100 text-blue-800",
  EM_MANUTENCAO: "bg-orange-100 text-orange-800",
  ABATIDO: "bg-red-100 text-red-800",
};

const statusLabel: Record<string, string> = {
  DISPONIVEL: "Disponível",
  EM_USO: "Em Uso",
  EM_MANUTENCAO: "Em Manutenção",
  ABATIDO: "Abatido",
};

interface Filters {
  name: string;
  licensePlate: string;
  brand: string;
  type: string;
  status: string;
}
const initialFilters: Filters = { name: "", licensePlate: "", brand: "", type: "", status: "" };

const emptyForm = {
  name: "",
  plate: "",
  brand: "",
  model: "",
  type: "",
  insuranceDate: "",
  inspectionDate: "",
  notes: "",
};

export default function VeiculosPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
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
    fetch(`/api/veiculos?page=${page}&limit=10`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch");
        return res.json();
      })
      .then((result) => {
        setVehicles(result.data);
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
        const res = await fetch(`/api/veiculos/${editId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        if (!res.ok) throw new Error("Failed to update");
        toast.success("Veículo atualizado com sucesso.");
      } else {
        const res = await fetch("/api/veiculos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        if (!res.ok) throw new Error("Failed to create");
        toast.success("Veículo criado com sucesso.");
      }
      fetchData();
      setDialogOpen(false);
      setForm(emptyForm);
      setEditId(null);
    } catch {
      toast.error(editId ? "Erro ao atualizar veículo." : "Erro ao criar veículo.");
    } finally {
      setSubmitting(false);
    }
  }

  function handleEdit(v: Vehicle) {
    setEditId(v.id);
    setForm({
      name: v.name || "",
      plate: v.plate || "",
      brand: v.brand || "",
      model: v.model || "",
      type: v.type || "",
      insuranceDate: v.insuranceDate ? v.insuranceDate.split("T")[0] : "",
      inspectionDate: v.inspectionDate ? v.inspectionDate.split("T")[0] : "",
      notes: "",
    });
    setDialogOpen(true);
  }

  async function handleDelete() {
    if (!deleteId) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/veiculos/${deleteId}`, { method: "DELETE" });
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
      name: filters.name.toLowerCase(),
      licensePlate: filters.licensePlate.toLowerCase(),
      brand: filters.brand.toLowerCase(),
      type: filters.type.toLowerCase(),
      status: filters.status,
    };
    if (!hasAnyFilter) return { matched: vehicles, rest: [] };
    const m: Vehicle[] = []; const r: Vehicle[] = [];
    for (const v of vehicles) {
      let ok = true;
      if (lf.name && !(v.name || "").toLowerCase().includes(lf.name)) ok = false;
      if (lf.licensePlate && !(v.plate || "").toLowerCase().includes(lf.licensePlate)) ok = false;
      if (lf.brand && !(v.brand || "").toLowerCase().includes(lf.brand)) ok = false;
      if (lf.type && !(v.type || "").toLowerCase().includes(lf.type)) ok = false;
      if (lf.status && v.status !== lf.status) ok = false;
      if (ok) m.push({ ...v, _match: true } as any); else r.push(v);
    }
    return { matched: m, rest: r };
  }, [vehicles, filters, hasAnyFilter]);

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
        <h1 className="text-2xl font-bold tracking-tight">Veículos</h1>
        <Button onClick={() => { setEditId(null); setForm(emptyForm); setDialogOpen(true); }}>
          <Plus className="mr-1 h-4 w-4" />
          Novo Veículo
        </Button>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap items-end justify-center gap-2 p-3 bg-card border border-border rounded-lg">
        <div className="flex flex-col gap-0.5">
          <span className="text-xs text-muted-foreground">Nome</span>
          <input placeholder="Nome" value={filters.name} onChange={e => setFilter("name", e.target.value)} className="w-[130px] h-8 text-sm bg-background border border-border rounded px-2 text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-primary/50" />
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-xs text-muted-foreground">Matrícula</span>
          <input placeholder="Matrícula" value={filters.licensePlate} onChange={e => setFilter("licensePlate", e.target.value)} className="w-[110px] h-8 text-sm bg-background border border-border rounded px-2 text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-primary/50" />
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-xs text-muted-foreground">Marca</span>
          <input placeholder="Marca" value={filters.brand} onChange={e => setFilter("brand", e.target.value)} className="w-[110px] h-8 text-sm bg-background border border-border rounded px-2 text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-primary/50" />
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-xs text-muted-foreground">Tipo</span>
          <input placeholder="Tipo" value={filters.type} onChange={e => setFilter("type", e.target.value)} className="w-[100px] h-8 text-sm bg-background border border-border rounded px-2 text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-primary/50" />
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
                    <TableHead className="whitespace-nowrap text-sm">Nome</TableHead>
                    <TableHead className="whitespace-nowrap text-sm">Matrícula</TableHead>
                    <TableHead className="whitespace-nowrap text-sm">Marca</TableHead>
                    <TableHead className="whitespace-nowrap text-sm">Modelo</TableHead>
                    <TableHead className="whitespace-nowrap text-sm">Tipo</TableHead>
                    <TableHead className="whitespace-nowrap text-sm">Estado</TableHead>
                    <TableHead className="whitespace-nowrap text-sm">Seguro</TableHead>
                    <TableHead className="whitespace-nowrap text-sm">Inspeção</TableHead>
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
                    displayed.map((v: any) => {
                      const isMatch = v._match || !hasAnyFilter;
                      return (
                      <TableRow key={v.id} className={isMatch && hasAnyFilter ? "bg-primary/5 border-l-2 border-l-primary" : (!isMatch && hasAnyFilter ? "opacity-40" : "")}>
                        <TableCell className="font-medium whitespace-nowrap text-sm">{v.name}</TableCell>
                        <TableCell className="whitespace-nowrap text-sm">{v.plate}</TableCell>
                        <TableCell className="whitespace-nowrap text-sm">{v.brand}</TableCell>
                        <TableCell className="whitespace-nowrap text-sm">{v.model}</TableCell>
                        <TableCell className="whitespace-nowrap text-sm">{v.type}</TableCell>
                        <TableCell className="whitespace-nowrap text-sm">
                          <Badge variant="secondary" className={statusBadge[v.status] ?? ""}>
                            {statusLabel[v.status] ?? v.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-sm">
                          {v.insuranceDate ? formatDate(v.insuranceDate) : "-"}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-sm">
                          {v.inspectionDate ? formatDate(v.inspectionDate) : "-"}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-sm">
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon-xs"
                              onClick={() => handleEdit(v)}
                              className="h-8 w-8"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon-xs"
                              onClick={() => setDeleteId(v.id)}
                              className="h-8 w-8"
                            >
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

      <Pagination page={page} totalPages={totalPages} onPageChange={(p) => setPage(p)} />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editId ? "Editar Veículo" : "Novo Veículo"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="v-name">Nome</Label>
              <Input
                id="v-name"
                value={form.name}
                onChange={(e) => handleChange("name", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="v-plate">Matrícula</Label>
              <Input
                id="v-plate"
                value={form.plate}
                onChange={(e) => handleChange("plate", e.target.value)}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="v-brand">Marca</Label>
                <Input
                  id="v-brand"
                  value={form.brand}
                  onChange={(e) => handleChange("brand", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="v-model">Modelo</Label>
                <Input
                  id="v-model"
                  value={form.model}
                  onChange={(e) => handleChange("model", e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="v-type">Tipo</Label>
              <Input
                id="v-type"
                value={form.type}
                onChange={(e) => handleChange("type", e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="v-insurance">Seguro</Label>
                <Input
                  id="v-insurance"
                  type="date"
                  value={form.insuranceDate}
                  onChange={(e) => handleChange("insuranceDate", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="v-inspection">Inspeção</Label>
                <Input
                  id="v-inspection"
                  type="date"
                  value={form.inspectionDate}
                  onChange={(e) => handleChange("inspectionDate", e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="v-notes">Notas</Label>
              <Input
                id="v-notes"
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
