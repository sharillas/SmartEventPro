"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Pencil, Trash2 } from "lucide-react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

const statusBadge: Record<string, string> = {
  DISPONIVEL: "bg-green-500/20 text-green-400",
  EM_USO: "bg-blue-500/20 text-blue-400",
  EM_MANUTENCAO: "bg-yellow-500/20 text-yellow-400",
  ABATIDO: "bg-red-500/20 text-red-400",
};
const statusLabel: Record<string, string> = {
  DISPONIVEL: "Disponível",
  EM_USO: "Em Uso",
  EM_MANUTENCAO: "Em Manutenção",
  ABATIDO: "Abatido",
};

export default function VeiculosRHPage() {
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editModal, setEditModal] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  interface Filters { name: string; licensePlate: string; status: string; }
  const initialFilters: Filters = { name: "", licensePlate: "", status: "" };
  const [filters, setFilters] = useState<Filters>(initialFilters);
  function setFilter(key: keyof Filters, value: string) { setFilters(prev => ({ ...prev, [key]: value })); }
  function clearFilters() { setFilters(initialFilters); }
  const hasAnyFilter = Object.values(filters).some(v => v !== "");

  const { matched, rest } = useMemo(() => {
    const lf = { name: filters.name.toLowerCase(), licensePlate: filters.licensePlate.toLowerCase(), status: filters.status };
    if (!hasAnyFilter) return { matched: vehicles, rest: [] };
    const m: any[] = []; const r: any[] = [];
    for (const v of vehicles) {
      let ok = true;
      if (lf.name && !(v.name || "").toLowerCase().includes(lf.name)) ok = false;
      if (lf.licensePlate && !(v.licensePlate || "").toLowerCase().includes(lf.licensePlate)) ok = false;
      if (lf.status && v.status !== lf.status) ok = false;
      if (ok) m.push({ ...v, _match: true }); else r.push(v);
    }
    return { matched: m, rest: r };
  }, [vehicles, filters, hasAnyFilter]);

  const displayed = [...matched, ...rest];

  useEffect(() => { fetchData(); }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const res = await fetch("/api/veiculos");
      const result = await res.json();
      setVehicles(result.data);
    } catch { toast.error("Erro ao carregar."); }
    setLoading(false);
  }

  function handleEdit(v: any) {
    setSelected({ ...v });
    setEditModal(true);
  }

  async function handleSave() {
    toast.success("Veículo atualizado (demo).");
    setEditModal(false);
  }

  async function handleDelete() {
    if (!deleteId) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/veiculos/${deleteId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
      toast.success("Eliminado com sucesso.");
      setVehicles(prev => prev.filter(v => v.id !== deleteId));
    } catch {
      toast.error("Erro ao eliminar.");
    } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Veículos (Edição)</h1>

      <div className="flex flex-wrap items-end justify-center gap-2 p-3 bg-card border border-border rounded-lg">
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] text-muted-foreground">Nome</span>
          <input placeholder="Nome" value={filters.name} onChange={e => setFilter("name", e.target.value)} className="w-[150px] h-7 text-xs bg-background border border-border rounded px-2 text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-primary/50" />
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] text-muted-foreground">Matrícula</span>
          <input placeholder="Matrícula" value={filters.licensePlate} onChange={e => setFilter("licensePlate", e.target.value)} className="w-[130px] h-7 text-xs bg-background border border-border rounded px-2 text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-primary/50" />
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] text-muted-foreground">Estado</span>
          <select value={filters.status} onChange={e => setFilter("status", e.target.value)} className="w-[130px] h-7 text-xs bg-background border border-border rounded px-2 text-foreground outline-none focus:border-primary/50">
            <option value="">Todos</option>
            {Object.entries(statusLabel).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
        {hasAnyFilter && (
          <button onClick={clearFilters} className="h-7 px-3 text-xs text-muted-foreground hover:text-foreground border border-border rounded hover:bg-accent/50 transition-colors mb-0.5">
            Limpar
          </button>
        )}
      </div>

      <Card className="border-border bg-card">
        <CardHeader><CardTitle className="text-card-foreground">Frota</CardTitle></CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <p className="text-muted-foreground text-center py-8">A carregar...</p>
          ) : displayed.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">Nenhum veículo registado.</p>
          ) : (
            <div className="overflow-x-auto">
              <div className="min-w-[900px]">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border">
                      <TableHead className="text-muted-foreground whitespace-nowrap text-sm">Nome</TableHead>
                      <TableHead className="text-muted-foreground whitespace-nowrap text-sm">Matrícula</TableHead>
                      <TableHead className="text-muted-foreground whitespace-nowrap text-sm">Tipo</TableHead>
                      <TableHead className="text-muted-foreground whitespace-nowrap text-sm">Estado</TableHead>
                      <TableHead className="text-muted-foreground whitespace-nowrap text-sm">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {displayed.map((v: any) => (
                      <TableRow key={v.id} className={`border-border ${v._match && hasAnyFilter ? "bg-primary/5 border-l-2 border-l-primary" : ""} ${!v._match && hasAnyFilter ? "opacity-40" : ""}`}>
                        <TableCell className="text-foreground whitespace-nowrap text-sm">{v.name}</TableCell>
                        <TableCell className="text-foreground whitespace-nowrap text-sm">{v.licensePlate}</TableCell>
                        <TableCell className="text-foreground whitespace-nowrap text-sm">{v.type}</TableCell>
                        <TableCell className="whitespace-nowrap text-sm"><Badge className={statusBadge[v.status] || ""}>{statusLabel[v.status] || v.status}</Badge></TableCell>
                        <TableCell className="whitespace-nowrap text-sm">
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="icon-xs" onClick={() => handleEdit(v)} className="h-8 w-8">
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
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={editModal} onOpenChange={setEditModal}>
        <DialogContent className="bg-card text-card-foreground border-border max-w-lg">
          <DialogHeader><DialogTitle>Editar Veículo</DialogTitle></DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">Nome</label>
                <Input value={selected.name} onChange={(e) => setSelected({ ...selected, name: e.target.value })} className="bg-background border-border" />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">Matrícula</label>
                <Input value={selected.licensePlate} onChange={(e) => setSelected({ ...selected, licensePlate: e.target.value })} className="bg-background border-border" />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">Tipo</label>
                <Select value={selected.type} onValueChange={(v) => v && setSelected({ ...selected, type: v })}>
                  <SelectTrigger className="bg-background border-border"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LIGEIRO">Ligeiro</SelectItem>
                    <SelectItem value="PESADO">Pesado</SelectItem>
                    <SelectItem value="CARRINHA">Carrinha</SelectItem>
                    <SelectItem value="CAMIAO">Camião</SelectItem>
                    <SelectItem value="EMPILHADOR">Empilhador</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">Estado</label>
                <Select value={selected.status} onValueChange={(v) => v && setSelected({ ...selected, status: v })}>
                  <SelectTrigger className="bg-background border-border"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DISPONIVEL">Disponível</SelectItem>
                    <SelectItem value="EM_USO">Em Uso</SelectItem>
                    <SelectItem value="EM_MANUTENCAO">Em Manutenção</SelectItem>
                    <SelectItem value="ABATIDO">Abatido</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditModal(false)} className="border-border">Cancelar</Button>
            <Button onClick={handleSave}>Guardar</Button>
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
