"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Pagination } from "@/components/ui/pagination";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";

interface Category { id: string; name: string; slug: string; description: string | null; active: boolean; _match?: boolean; }

interface Filters { name: string; }
const initialFilters: Filters = { name: "" };

export default function CategoriasPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ name: "", slug: "", description: "" });
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState<Filters>(initialFilters);

  function setFilter(key: keyof Filters, value: string) { setFilters(p => ({ ...p, [key]: value })); }
  function clearFilters() { setFilters(initialFilters); }
  const hasAnyFilter = Object.values(filters).some(v => v !== "");

  const { matched, rest } = useMemo(() => {
    if (!hasAnyFilter) return { matched: categories, rest: [] };
    const lf = filters.name.toLowerCase();
    const m: Category[] = []; const r: Category[] = [];
    for (const c of categories) {
      if (c.name.toLowerCase().includes(lf)) m.push({ ...c, _match: true }); else r.push(c);
    }
    return { matched: m, rest: r };
  }, [categories, filters, hasAnyFilter]);

  const displayed = [...matched, ...rest];

  useEffect(() => { fetchData(); }, [page]);

  async function fetchData() {
    setLoading(true);
    try {
      const res = await fetch(`/api/categorias?page=${page}&limit=10`);
      const result = await res.json();
      setCategories(result.data || result);
      setTotalPages(result.totalPages || 1);
    } catch { toast.error("Erro ao carregar."); }
    setLoading(false);
  }

  async function handleSubmit() {
    if (!form.name.trim()) { toast.error("Preencha o nome."); return; }
    setSubmitting(true);
    try {
      const url = editId ? `/api/categorias/${editId}` : "/api/categorias";
      const res = await fetch(url, {
        method: editId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: form.name.trim(), slug: form.slug.trim() || form.name.toLowerCase().replace(/\s+/g, "-"), description: form.description }),
      });
      if (!res.ok) throw new Error();
      toast.success(editId ? "Atualizado." : "Criado.");
      fetchData();
      setDialogOpen(false);
      setForm({ name: "", slug: "", description: "" });
      setEditId(null);
    } catch { toast.error(editId ? "Erro ao atualizar." : "Erro ao criar."); }
    finally { setSubmitting(false); }
  }

  async function handleDelete() {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await fetch(`/api/categorias/${deleteId}`, { method: "DELETE" });
      toast.success("Eliminado.");
      fetchData();
    } catch { toast.error("Erro ao eliminar."); }
    finally { setDeleting(false); setDeleteId(null); }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Categorias</h1>
        <Button onClick={() => { setEditId(null); setForm({ name: "", slug: "", description: "" }); setDialogOpen(true); }}>
          <Plus className="mr-1 h-4 w-4" /> Nova Categoria
        </Button>
      </div>

      <div className="flex flex-wrap items-end justify-center gap-2 p-3 bg-card border border-border rounded-lg">
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] text-muted-foreground">Nome</span>
          <input placeholder="Nome" value={filters.name} onChange={e => setFilter("name", e.target.value)} className="w-[180px] h-7 text-xs bg-background border border-border rounded px-2 text-foreground placeholder:text-muted-foreground/50 outline-none" />
        </div>
        {hasAnyFilter && <button onClick={clearFilters} className="h-7 px-3 text-xs text-muted-foreground hover:text-foreground border border-border rounded">Limpar</button>}
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? <p className="text-muted-foreground text-center py-8">A carregar...</p> :
           displayed.length === 0 ? <p className="text-muted-foreground text-center py-8">Nenhuma categoria.</p> : (
            <div className="overflow-x-auto"><div className="min-w-[500px]"><Table>
              <TableHeader><TableRow>
                <TableHead className="whitespace-nowrap text-sm">Nome</TableHead>
                <TableHead className="whitespace-nowrap text-sm">Slug</TableHead>
                <TableHead className="whitespace-nowrap text-sm">Descrição</TableHead>
                <TableHead className="whitespace-nowrap text-sm">Ações</TableHead>
              </TableRow></TableHeader>
              <TableBody>{displayed.map((c: any) => (
                <TableRow key={c.id} className={c._match && hasAnyFilter ? "bg-primary/5 border-l-2 border-l-primary" : (!c._match && hasAnyFilter ? "opacity-40" : "")}>
                  <TableCell className="font-medium text-sm">{c.name}</TableCell>
                  <TableCell className="text-sm">{c.slug}</TableCell>
                  <TableCell className="text-sm">{c.description || "-"}</TableCell>
                  <TableCell className="text-sm">
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon-xs" onClick={() => { setEditId(c.id); setForm({ name: c.name, slug: c.slug, description: c.description || "" }); setDialogOpen(true); }} className="h-8 w-8"><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon-xs" onClick={() => setDeleteId(c.id)} className="h-8 w-8"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}</TableBody>
            </Table></div></div>
          )}
        </CardContent>
      </Card>

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />

      <Dialog open={dialogOpen} onOpenChange={(o) => { if (!o) { setEditId(null); setForm({ name: "", slug: "", description: "" }); } setDialogOpen(o); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editId ? "Editar Categoria" : "Nova Categoria"}</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2"><Label htmlFor="cat-name">Nome</Label><Input id="cat-name" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} /></div>
            <div className="space-y-2"><Label htmlFor="cat-slug">Slug</Label><Input id="cat-slug" value={form.slug} onChange={e => setForm(p => ({ ...p, slug: e.target.value }))} /></div>
            <div className="space-y-2"><Label htmlFor="cat-desc">Descrição</Label><Input id="cat-desc" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSubmit} disabled={submitting}>{editId ? (submitting ? "A guardar..." : "Guardar") : (submitting ? "A criar..." : "Criar")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <ConfirmDialog open={!!deleteId} onOpenChange={(o) => { if (!o) setDeleteId(null); }} title="Confirmar" description="Eliminar esta categoria?" onConfirm={handleDelete} loading={deleting} />
    </div>
  );
}
