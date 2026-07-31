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
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Pagination } from "@/components/ui/pagination";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

interface Service {
  id: string;
  name: string;
  category: string;
  basePrice: number;
  unit: string;
  status: string;
}

const statusBadge: Record<string, string> = {
  ATIVO: "bg-green-100 text-green-800",
  INATIVO: "bg-gray-100 text-gray-800",
};

const categoryLabel: Record<string, string> = {
  VIDEO: "Vídeo",
  SOM: "Som",
  ILUMINACAO: "Iluminação",
  ESTRUTURAS: "Estruturas",
  MOBILIARIO: "Mobiliário",
  TRANSPORTE: "Transporte",
  MONTAGEM: "Montagem",
  OUTRO: "Outro",
};

const unitLabel: Record<string, string> = {
  UN: "Unidade",
  HORA: "Hora",
  DIA: "Dia",
  SERVICO: "Serviço",
  KM: "Km",
};

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-PT", {
    style: "currency",
    currency: "EUR",
  }).format(value);
}

interface Filters {
  name: string;
  category: string;
}
const initialFilters: Filters = { name: "", category: "" };

const emptyForm = {
  name: "",
  description: "",
  category: "",
  basePrice: "",
  unit: "",
};

export default function ServicosPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState<Filters>(initialFilters);

  function fetchData() {
    setLoading(true);
    fetch(`/api/servicos?page=${page}&limit=10&type=EXTERNO`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch");
        return res.json();
      })
      .then((result) => {
        setServices(result.data);
        setTotalPages(result.totalPages);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }

  useEffect(() => { fetchData(); }, [page]);

  function handleChange(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleEditClick(svc: Service) {
    setEditId(svc.id);
    setForm({
      name: svc.name,
      description: (svc as any).description || "",
      category: svc.category,
      basePrice: String(svc.basePrice ?? ""),
      unit: svc.unit,
    });
    setDialogOpen(true);
  }

  async function handleSubmit() {
    setSubmitting(true);
    try {
      const url = editId ? `/api/servicos/${editId}` : "/api/servicos";
      const method = editId ? "PATCH" : "POST";
      const body = {
        name: form.name,
        description: form.description,
        category: form.category,
          basePrice: form.basePrice ? Number(form.basePrice) : null,
          unit: form.unit,
          serviceType: "EXTERNO",
      };
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Failed");
      toast.success(editId ? "Atualizado com sucesso." : "Serviço criado com sucesso.");
      fetchData();
      setDialogOpen(false);
      setForm(emptyForm);
    } catch {
      toast.error(editId ? "Erro ao atualizar." : "Erro ao criar serviço.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!deleteId) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/servicos/${deleteId}`, { method: "DELETE" });
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
    const arr = Array.isArray(services) ? services : [];
    const lf = { name: filters.name.toLowerCase(), category: filters.category.toLowerCase() };
    if (!hasAnyFilter) return { matched: arr, rest: [] };
    const m: Service[] = []; const r: Service[] = [];
    for (const s of arr) {
      let ok = true;
      if (lf.name && !(s.name || "").toLowerCase().includes(lf.name)) ok = false;
      if (lf.category && !(categoryLabel[s.category] || s.category || "").toLowerCase().includes(lf.category)) ok = false;
      if (ok) m.push({ ...s, _match: true } as any); else r.push(s);
    }
    return { matched: m, rest: r };
  }, [services, filters, hasAnyFilter]);

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
        <h1 className="text-2xl font-bold tracking-tight">Serviços Externos</h1>
        <Button onClick={() => { setEditId(null); setForm(emptyForm); setDialogOpen(true); }}>
          <Plus className="mr-1 h-4 w-4" />
          Novo Serviço
        </Button>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap items-end justify-center gap-2 p-3 bg-card border border-border rounded-lg">
        <div className="flex flex-col gap-0.5">
          <span className="text-xs text-muted-foreground">Nome</span>
          <input placeholder="Nome" value={filters.name} onChange={e => setFilter("name", e.target.value)} className="w-[170px] h-8 text-sm bg-background border border-border rounded px-2 text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-primary/50" />
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-xs text-muted-foreground">Categoria</span>
          <input placeholder="Categoria" value={filters.category} onChange={e => setFilter("category", e.target.value)} className="w-[150px] h-8 text-sm bg-background border border-border rounded px-2 text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-primary/50" />
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
                    <TableHead className="whitespace-nowrap text-sm">Categoria</TableHead>
                    <TableHead className="whitespace-nowrap text-sm">Preço Base</TableHead>
                    <TableHead className="whitespace-nowrap text-sm">Unidade</TableHead>
                    <TableHead className="whitespace-nowrap text-sm">Estado</TableHead>
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
                    displayed.map((svc: any) => {
                      const isMatch = svc._match || !hasAnyFilter;
                      return (
                      <TableRow key={svc.id} className={isMatch && hasAnyFilter ? "bg-primary/5 border-l-2 border-l-primary" : (!isMatch && hasAnyFilter ? "opacity-40" : "")}>
                        <TableCell className="font-medium whitespace-nowrap text-sm">{svc.name}</TableCell>
                        <TableCell className="whitespace-nowrap text-sm">{categoryLabel[svc.category] ?? svc.category}</TableCell>
                        <TableCell className="whitespace-nowrap text-sm">{formatCurrency(svc.basePrice)}</TableCell>
                        <TableCell className="whitespace-nowrap text-sm">{unitLabel[svc.unit] ?? svc.unit}</TableCell>
                        <TableCell className="whitespace-nowrap text-sm">
                          <Badge variant="secondary" className={statusBadge[svc.status] ?? ""}>
                            {svc.status === "ATIVO" ? "Ativo" : "Inativo"}
                          </Badge>
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-sm">
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            onClick={() => handleEditClick(svc)}
                            className="h-7 w-7"
                          >
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            onClick={() => setDeleteId(svc.id)}
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

      <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) { setEditId(null); setForm(emptyForm); } setDialogOpen(open); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editId ? "Editar Serviço" : "Novo Serviço"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="s-name">Nome</Label>
              <Input
                id="s-name"
                value={form.name}
                onChange={(e) => handleChange("name", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="s-desc">Descrição</Label>
              <Textarea
                id="s-desc"
                value={form.description}
                onChange={(e) => handleChange("description", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select
                value={form.category}
                onValueChange={(v) => v && handleChange("category", v)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecionar categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="VIDEO">Vídeo</SelectItem>
                  <SelectItem value="SOM">Som</SelectItem>
                  <SelectItem value="ILUMINACAO">Iluminação</SelectItem>
                  <SelectItem value="ESTRUTURAS">Estruturas</SelectItem>
                  <SelectItem value="MOBILIARIO">Mobiliário</SelectItem>
                  <SelectItem value="TRANSPORTE">Transporte</SelectItem>
                  <SelectItem value="MONTAGEM">Montagem</SelectItem>
                  <SelectItem value="OUTRO">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="s-price">Preço Base</Label>
              <Input
                id="s-price"
                type="number"
                step="0.01"
                value={form.basePrice}
                onChange={(e) => handleChange("basePrice", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Unidade</Label>
              <Select
                value={form.unit}
                onValueChange={(v) => v && handleChange("unit", v)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecionar unidade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="UN">Unidade</SelectItem>
                  <SelectItem value="HORA">Hora</SelectItem>
                  <SelectItem value="DIA">Dia</SelectItem>
                  <SelectItem value="SERVICO">Serviço</SelectItem>
                  <SelectItem value="KM">Km</SelectItem>
                </SelectContent>
              </Select>
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
