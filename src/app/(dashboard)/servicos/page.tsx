"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Pagination } from "@/components/ui/pagination";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

interface Service { id: string; name: string; category: string; basePrice: number; unit: string; active: boolean; }

const categoryLabel: Record<string, string> = {
  VIDEO: "Vídeo", SOM: "Som", ILUMINACAO: "Iluminação", ESTRUTURAS: "Estruturas",
  MOBILIARIO: "Mobiliário", TRANSPORTE: "Transporte", MONTAGEM: "Montagem", OUTRO: "Outro",
};
const unitLabel: Record<string, string> = { UN: "Unidade", HORA: "Hora", DIA: "Dia", SERVICO: "Serviço", KM: "Km" };

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-PT", { style: "currency", currency: "EUR" }).format(value);
}

interface Filters { name: string; category: string; }
const initialFilters: Filters = { name: "", category: "" };
const emptyForm = { name: "", description: "", category: "", basePrice: "", unit: "" };

export default function ServicosExternosPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
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
    fetch(`/api/servicos?page=${page}&limit=10&type=EXTERNO`)
      .then((r) => r.json()).then((result) => { setServices(result.data || []); setTotalPages(result.totalPages || 1); })
      .catch(() => setServices([])).finally(() => setLoading(false));
  }

  useEffect(() => { fetchData(); }, [page]);

  function handleChange(field: string, value: string) { setForm((p) => ({ ...p, [field]: value })); }

  function handleEditClick(svc: Service) {
    setEditId(svc.id);
    setForm({ name: svc.name, description: (svc as any).description || "", category: svc.category, basePrice: String(svc.basePrice ?? ""), unit: svc.unit });
    setDialogOpen(true);
  }

  async function handleSubmit() {
    setSubmitting(true);
    try {
      const url = editId ? `/api/servicos/${editId}` : "/api/servicos";
      const res = await fetch(url, {
        method: editId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: form.name, description: form.description, category: form.category, defaultPrice: form.basePrice ? Number(form.basePrice) : null, unit: form.unit, serviceType: "EXTERNO" }),
      });
      if (!res.ok) throw new Error();
      toast.success(editId ? "Atualizado." : "Criado.");
      fetchData(); setDialogOpen(false); setForm(emptyForm);
    } catch { toast.error(editId ? "Erro ao atualizar." : "Erro ao criar."); }
    finally { setSubmitting(false); }
  }

  async function handleDelete() {
    if (!deleteId) return;
    setDeleting(true);
    try { await fetch(`/api/servicos/${deleteId}`, { method: "DELETE" }); toast.success("Eliminado."); fetchData(); }
    catch { toast.error("Erro ao eliminar."); }
    finally { setDeleting(false); setDeleteId(null); }
  }

  function setFilter(key: keyof Filters, value: string) { setFilters(p => ({ ...p, [key]: value })); }
  function clearFilters() { setFilters(initialFilters); }
  const hasAnyFilter = Object.values(filters).some(v => v !== "");

  const { matched, rest } = useMemo(() => {
    const arr = Array.isArray(services) ? services : [];
    if (!hasAnyFilter) return { matched: arr, rest: [] };
    const lf = { name: filters.name.toLowerCase(), category: filters.category.toLowerCase() };
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

  if (loading) return <div className="flex min-h-[60vh] items-center justify-center"><p className="text-muted-foreground">A carregar...</p></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Serviços Externos</h1>
        <Button onClick={() => { setEditId(null); setForm(emptyForm); setDialogOpen(true); }}><Plus className="mr-1 h-4 w-4" />Novo Serviço</Button>
      </div>
      <div className="flex flex-wrap items-end justify-center gap-2 p-3 bg-card border border-border rounded-lg">
        <div className="flex flex-col gap-0.5"><span className="text-xs text-muted-foreground">Nome</span><input placeholder="Nome" value={filters.name} onChange={e => setFilter("name", e.target.value)} className="w-[170px] h-8 text-sm bg-background border border-border rounded px-2 text-foreground placeholder:text-muted-foreground/50 outline-none" /></div>
        <div className="flex flex-col gap-0.5"><span className="text-xs text-muted-foreground">Categoria</span><input placeholder="Categoria" value={filters.category} onChange={e => setFilter("category", e.target.value)} className="w-[150px] h-8 text-sm bg-background border border-border rounded px-2 text-foreground placeholder:text-muted-foreground/50 outline-none" /></div>
        {hasAnyFilter && <button onClick={clearFilters} className="h-8 px-3 text-sm text-muted-foreground hover:text-foreground border border-border rounded">Limpar</button>}
      </div>
      <Card><CardContent className="p-0"><div className="overflow-x-auto"><div className="min-w-[900px]">
        <Table><TableHeader><TableRow>
          <TableHead className="whitespace-nowrap text-sm">Nome</TableHead><TableHead className="whitespace-nowrap text-sm">Categoria</TableHead><TableHead className="whitespace-nowrap text-sm">Preço Base</TableHead><TableHead className="whitespace-nowrap text-sm">Unidade</TableHead><TableHead className="whitespace-nowrap text-sm">Estado</TableHead><TableHead className="whitespace-nowrap text-sm">Ações</TableHead>
        </TableRow></TableHeader><TableBody>
          {displayed.length === 0 ? <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground text-sm">Nenhum registo.</TableCell></TableRow> :
            displayed.map((svc: any) => {
              const isMatch = svc._match || !hasAnyFilter;
              return (
              <TableRow key={svc.id} className={isMatch && hasAnyFilter ? "bg-primary/5 border-l-2 border-l-primary" : (!isMatch && hasAnyFilter ? "opacity-40" : "")}>
                <TableCell className="font-medium text-sm">{svc.name}</TableCell>
                <TableCell className="text-sm">{categoryLabel[svc.category] ?? svc.category}</TableCell>
                <TableCell className="text-sm">{formatCurrency(svc.basePrice)}</TableCell>
                <TableCell className="text-sm">{unitLabel[svc.unit] ?? svc.unit}</TableCell>
                <TableCell className="text-sm"><Badge variant="secondary" className={svc.active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>{svc.active ? "Ativo" : "Inativo"}</Badge></TableCell>
                <TableCell className="text-sm">
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon-xs" onClick={() => handleEditClick(svc)} className="h-8 w-8"><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon-xs" onClick={() => setDeleteId(svc.id)} className="h-8 w-8"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </div>
                </TableCell>
              </TableRow>);
            })
          }
        </TableBody></Table>
      </div></div></CardContent></Card>
      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      <Dialog open={dialogOpen} onOpenChange={(o) => { if (!o) { setEditId(null); setForm(emptyForm); } setDialogOpen(o); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>{editId ? "Editar Serviço" : "Novo Serviço"}</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2"><Label>Nome</Label><Input value={form.name} onChange={e => handleChange("name", e.target.value)} required /></div>
            <div className="space-y-2"><Label>Descrição</Label><Textarea value={form.description} onChange={e => handleChange("description", e.target.value)} /></div>
            <div className="space-y-2"><Label>Categoria</Label><Select value={form.category} onValueChange={v => v && handleChange("category", v)}>
              <SelectTrigger><SelectValue placeholder="Categoria" /></SelectTrigger>
              <SelectContent>{Object.entries(categoryLabel).map(([v,l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}</SelectContent>
            </Select></div>
            <div className="space-y-2"><Label>Preço Base</Label><Input type="number" step="0.01" value={form.basePrice} onChange={e => handleChange("basePrice", e.target.value)} /></div>
            <div className="space-y-2"><Label>Unidade</Label><Select value={form.unit} onValueChange={v => v && handleChange("unit", v)}>
              <SelectTrigger><SelectValue placeholder="Unidade" /></SelectTrigger>
              <SelectContent>{Object.entries(unitLabel).map(([v,l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}</SelectContent>
            </Select></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button><Button onClick={handleSubmit} disabled={submitting}>{editId ? (submitting ? "A guardar..." : "Guardar") : (submitting ? "A criar..." : "Criar")}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
      <ConfirmDialog open={!!deleteId} onOpenChange={(o) => { if (!o) setDeleteId(null); }} title="Confirmar" description="Eliminar este serviço?" onConfirm={handleDelete} loading={deleting} />
    </div>
  );
}
