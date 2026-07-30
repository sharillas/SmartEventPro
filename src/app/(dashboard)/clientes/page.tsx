"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Pencil, Plus, Trash2, Users } from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Pagination } from "@/components/ui/pagination";

interface Client {
  id: string;
  name: string;
  type: string;
  company: string;
  email: string;
  phone: string;
  nif: string;
  city: string;
  address: string;
  postalCode: string;
  country: string;
  notes: string;
}

const typeBadgeClass: Record<string, string> = {
  CLIENTE: "border-blue-500 text-blue-400",
  FORNECEDOR: "border-green-500 text-green-400",
  ENTIDADE: "border-purple-500 text-purple-400",
};
const typeLabel: Record<string, string> = {
  CLIENTE: "Cliente",
  FORNECEDOR: "Fornecedor",
  ENTIDADE: "Entidade",
};

interface Filters {
  name: string;
  company: string;
  email: string;
  type: string;
  city: string;
}
const initialFilters: Filters = { name: "", company: "", email: "", type: "", city: "" };

const emptyForm = {
  name: "",
  type: "CLIENTE",
  company: "",
  email: "",
  phone: "",
  nif: "",
  address: "",
  city: "",
  postalCode: "",
  country: "Portugal",
  notes: "",
};

export default function ClientesPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [filters, setFilters] = useState<Filters>(initialFilters);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("limit", "10");
    const qs = params.toString();
    const url = qs ? `/api/clientes?${qs}` : "/api/clientes";
    setLoading(true);
    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch");
        return res.json();
      })
      .then((result) => { setClients(result.data); setTotalPages(result.totalPages); })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [page]);

  function handleChange(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleEditClick(client: Client) {
    setEditId(client.id);
    setForm({
      name: client.name,
      type: client.type,
      company: client.company,
      email: client.email,
      phone: client.phone,
      nif: client.nif,
      address: client.address,
      city: client.city,
      postalCode: client.postalCode,
      country: client.country,
      notes: client.notes,
    });
    setDialogOpen(true);
  }

  async function handleSubmit() {
    setSubmitting(true);
    try {
      const url = editId ? `/api/clientes/${editId}` : "/api/clientes";
      const method = editId ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Failed");
      toast.success(editId ? "Atualizado com sucesso." : "Cliente criado com sucesso.");
      if (editId) {
        const updated = await res.json();
        setClients(prev => prev.map(c => c.id === editId ? updated : c));
      } else {
        const created = await res.json();
        setClients(prev => [...prev, created]);
      }
      setDialogOpen(false);
      setForm(emptyForm);
    } catch {
      toast.error(editId ? "Erro ao atualizar." : "Erro ao criar cliente.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!deleteId) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/clientes/${deleteId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
      toast.success("Eliminado com sucesso.");
      setClients(prev => prev.filter(client => client.id !== deleteId));
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
      company: filters.company.toLowerCase(),
      email: filters.email.toLowerCase(),
      type: filters.type,
      city: filters.city.toLowerCase(),
    };
    if (!hasAnyFilter) return { matched: clients, rest: [] };
    const m: Client[] = []; const r: Client[] = [];
    for (const c of clients) {
      let ok = true;
      if (lf.name && !(c.name || "").toLowerCase().includes(lf.name)) ok = false;
      if (lf.company && !(c.company || "").toLowerCase().includes(lf.company)) ok = false;
      if (lf.email && !(c.email || "").toLowerCase().includes(lf.email)) ok = false;
      if (lf.type && c.type !== lf.type) ok = false;
      if (lf.city && !(c.city || "").toLowerCase().includes(lf.city)) ok = false;
      if (ok) m.push({ ...c, _match: true } as any); else r.push(c);
    }
    return { matched: m, rest: r };
  }, [clients, filters, hasAnyFilter]);

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
        <h1 className="text-2xl font-bold tracking-tight">Clientes</h1>
        <Button onClick={() => { setEditId(null); setForm(emptyForm); setDialogOpen(true); }}>
          <Plus className="mr-1 h-4 w-4" />
          Novo Cliente
        </Button>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap items-end justify-center gap-2 p-3 bg-card border border-border rounded-lg">
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] text-muted-foreground">Nome</span>
          <input placeholder="Nome" value={filters.name} onChange={e => setFilter("name", e.target.value)} className="w-[150px] h-7 text-xs bg-background border border-border rounded px-2 text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-primary/50" />
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] text-muted-foreground">Empresa</span>
          <input placeholder="Empresa" value={filters.company} onChange={e => setFilter("company", e.target.value)} className="w-[150px] h-7 text-xs bg-background border border-border rounded px-2 text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-primary/50" />
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] text-muted-foreground">Email</span>
          <input placeholder="Email" value={filters.email} onChange={e => setFilter("email", e.target.value)} className="w-[170px] h-7 text-xs bg-background border border-border rounded px-2 text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-primary/50" />
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] text-muted-foreground">Tipo</span>
          <select value={filters.type} onChange={e => setFilter("type", e.target.value)} className="w-[140px] h-7 text-xs bg-background border border-border rounded px-2 text-foreground outline-none focus:border-primary/50">
            <option value="">Todos</option>
            <option value="CLIENTE">Cliente</option>
            <option value="FORNECEDOR">Fornecedor</option>
            <option value="ENTIDADE">Entidade</option>
          </select>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] text-muted-foreground">Cidade</span>
          <input placeholder="Cidade" value={filters.city} onChange={e => setFilter("city", e.target.value)} className="w-[130px] h-7 text-xs bg-background border border-border rounded px-2 text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-primary/50" />
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
            <div className="min-w-[800px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="whitespace-nowrap text-sm p-1.5">Nome</TableHead>
                    <TableHead className="whitespace-nowrap text-sm p-1.5">Tipo</TableHead>
                    <TableHead className="whitespace-nowrap text-sm p-1.5">Empresa</TableHead>
                    <TableHead className="whitespace-nowrap text-sm p-1.5">Email</TableHead>
                    <TableHead className="whitespace-nowrap text-sm p-1.5">Telefone</TableHead>
                    <TableHead className="whitespace-nowrap text-sm p-1.5">NIF</TableHead>
                    <TableHead className="whitespace-nowrap text-sm p-1.5">Cidade</TableHead>
                    <TableHead className="whitespace-nowrap text-sm p-1.5">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayed.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-muted-foreground text-sm p-1.5 whitespace-nowrap">
                        Nenhum registo encontrado.
                      </TableCell>
                    </TableRow>
                  ) : (
                    displayed.map((client: any) => {
                      const isMatch = client._match || !hasAnyFilter;
                      return (
                      <TableRow key={client.id} className={isMatch && hasAnyFilter ? "bg-primary/5 border-l-2 border-l-primary" : (!isMatch && hasAnyFilter ? "opacity-40" : "")}>
                        <TableCell className="font-medium whitespace-nowrap text-sm p-1.5">{client.name}</TableCell>
                        <TableCell className="whitespace-nowrap text-sm p-1.5">
                          <Badge variant="outline" className={`bg-transparent text-xs px-1 py-0 ${typeBadgeClass[client.type] || ""}`}>
                            {typeLabel[client.type] || client.type}
                          </Badge>
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-sm p-1.5">{client.company}</TableCell>
                        <TableCell className="whitespace-nowrap text-sm p-1.5">{client.email}</TableCell>
                        <TableCell className="whitespace-nowrap text-sm p-1.5">{client.phone}</TableCell>
                        <TableCell className="whitespace-nowrap text-sm p-1.5">{client.nif}</TableCell>
                        <TableCell className="whitespace-nowrap text-sm p-1.5">{client.city}</TableCell>
                        <TableCell className="whitespace-nowrap text-sm p-1.5">
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            onClick={() => handleEditClick(client)}
                            className="h-7 w-7"
                          >
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            onClick={() => setDeleteId(client.id)}
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

      <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) { setEditId(null); setForm(emptyForm); } setDialogOpen(open); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editId ? "Editar Cliente" : "Novo Cliente"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="c-type">Tipo</Label>
              <Select value={form.type} onValueChange={(v) => v && handleChange("type", v)}>
                <SelectTrigger id="c-type" className="bg-background border-border">
                  <SelectValue placeholder="Selecionar tipo..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CLIENTE">Cliente</SelectItem>
                  <SelectItem value="FORNECEDOR">Fornecedor</SelectItem>
                  <SelectItem value="ENTIDADE">Entidade</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="c-name">Nome</Label>
              <Input
                id="c-name"
                value={form.name}
                onChange={(e) => handleChange("name", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="c-company">Empresa</Label>
              <Input
                id="c-company"
                value={form.company}
                onChange={(e) => handleChange("company", e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="c-email">Email</Label>
                <Input
                  id="c-email"
                  type="email"
                  value={form.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="c-phone">Telefone</Label>
                <Input
                  id="c-phone"
                  value={form.phone}
                  onChange={(e) => handleChange("phone", e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="c-nif">NIF</Label>
              <Input
                id="c-nif"
                value={form.nif}
                onChange={(e) => handleChange("nif", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="c-address">Morada</Label>
              <Input
                id="c-address"
                value={form.address}
                onChange={(e) => handleChange("address", e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="c-city">Cidade</Label>
                <Input
                  id="c-city"
                  value={form.city}
                  onChange={(e) => handleChange("city", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="c-postal">Código Postal</Label>
                <Input
                  id="c-postal"
                  value={form.postalCode}
                  onChange={(e) => handleChange("postalCode", e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="c-country">País</Label>
              <Input
                id="c-country"
                value={form.country}
                onChange={(e) => handleChange("country", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="c-notes">Notas</Label>
              <Input
                id="c-notes"
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
