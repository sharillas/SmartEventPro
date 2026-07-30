"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Pagination } from "@/components/ui/pagination";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

export default function FuncoesPage() {
  const [positions, setPositions] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  interface Filters { name: string; }
  const initialFilters: Filters = { name: "" };
  const [filters, setFilters] = useState<Filters>(initialFilters);
  function setFilter(key: keyof Filters, value: string) { setFilters(prev => ({ ...prev, [key]: value })); }
  function clearFilters() { setFilters(initialFilters); }
  const hasAnyFilter = Object.values(filters).some(v => v !== "");

  const { matched, rest } = useMemo(() => {
    const lf = { name: filters.name.toLowerCase() };
    if (!hasAnyFilter) return { matched: positions, rest: [] };
    const m: typeof positions = []; const r: typeof positions = [];
    for (const p of positions) {
      let ok = true;
      if (lf.name && !(p.name || "").toLowerCase().includes(lf.name)) ok = false;
      if (ok) m.push({ ...p, _match: true } as any); else r.push(p);
    }
    return { matched: m, rest: r };
  }, [positions, filters, hasAnyFilter]);

  const displayed = [...matched, ...rest];

  useEffect(() => { fetchData(); }, [page]);

  async function fetchData() {
    setLoading(true);
    try {
      const res = await fetch(`/api/funcoes?page=${page}&limit=10`);
      if (!res.ok) throw new Error("Erro");
      const result = await res.json();
      setPositions(result.data);
      setTotalPages(result.totalPages);
    } catch { toast.error("Erro ao carregar cargos."); }
    setLoading(false);
  }

  async function handleSubmit() {
    if (!newName.trim()) return;
    setSubmitting(true);
    try {
      const url = editId ? `/api/funcoes/${editId}` : "/api/funcoes";
      const method = editId ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim() }),
      });
      if (!res.ok) throw new Error("Failed");
      toast.success(editId ? "Atualizado com sucesso." : "Cargo criado.");
      fetchData();
      setNewName("");
      setModalOpen(false);
    } catch {
      toast.error(editId ? "Erro ao atualizar." : "Erro ao criar cargo.");
    } finally {
      setSubmitting(false);
    }
  }

  function handleEditClick(pos: { id: string; name: string }) {
    setEditId(pos.id);
    setNewName(pos.name);
    setModalOpen(true);
  }

  async function handleDelete() {
    if (!deleteId) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/funcoes/${deleteId}`, { method: "DELETE" });
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Cargos</h1>
        <Button onClick={() => { setEditId(null); setNewName(""); setModalOpen(true); }} size="sm">
          <Plus className="h-4 w-4 mr-2" /> Novo Cargo
        </Button>
      </div>

      <div className="flex flex-wrap items-end justify-center gap-2 p-3 bg-card border border-border rounded-lg">
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] text-muted-foreground">Nome</span>
          <input placeholder="Nome" value={filters.name} onChange={e => setFilter("name", e.target.value)} className="w-[200px] h-7 text-xs bg-background border border-border rounded px-2 text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-primary/50" />
        </div>
        {hasAnyFilter && (
          <button onClick={clearFilters} className="h-7 px-3 text-xs text-muted-foreground hover:text-foreground border border-border rounded hover:bg-accent/50 transition-colors mb-0.5">
            Limpar
          </button>
        )}
      </div>

      <Card className="border-border bg-card">
        <CardHeader><CardTitle className="text-card-foreground">Lista de Cargos</CardTitle></CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <p className="text-muted-foreground text-center py-8">A carregar...</p>
          ) : displayed.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">Nenhum cargo registado.</p>
          ) : (
            <div className="overflow-x-auto">
              <div className="min-w-[900px]">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border">
                      <TableHead className="text-muted-foreground whitespace-nowrap text-sm">Nome</TableHead>
                      <TableHead className="text-muted-foreground whitespace-nowrap text-sm">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {displayed.map((p: any) => (
                      <TableRow key={p.id} className={`border-border ${p._match && hasAnyFilter ? "bg-primary/5 border-l-2 border-l-primary" : ""} ${!p._match && hasAnyFilter ? "opacity-40" : ""}`}>
                        <TableCell className="text-foreground font-medium whitespace-nowrap text-sm">{p.name}</TableCell>
                        <TableCell className="whitespace-nowrap text-sm">
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            onClick={() => handleEditClick(p)}
                            className="h-7 w-7"
                          >
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            onClick={() => setDeleteId(p.id)}
                            className="h-7 w-7"
                          >
                            <Trash2 className="h-3 w-3 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Pagination page={page} totalPages={totalPages} onPageChange={(p) => setPage(p)} />

      <Dialog open={modalOpen} onOpenChange={(open) => { if (!open) { setEditId(null); setNewName(""); } setModalOpen(open); }}>
        <DialogContent className="bg-card text-card-foreground border-border">
          <DialogHeader><DialogTitle>{editId ? "Editar Cargo" : "Novo Cargo"}</DialogTitle></DialogHeader>
          <Input
            placeholder="Nome do cargo (ex: Técnico de Som)"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="bg-background border-border"
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)} className="border-border">Cancelar</Button>
            <Button onClick={handleSubmit} disabled={submitting}>{editId ? (submitting ? "A guardar..." : "Guardar") : (submitting ? "A criar..." : "Criar")}</Button>
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
