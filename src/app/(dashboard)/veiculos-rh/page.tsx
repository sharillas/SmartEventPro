"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

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

  useEffect(() => { fetchData(); }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const res = await fetch("/api/veiculos");
      setVehicles(await res.json());
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

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Veículos (Edição)</h1>

      <Card className="border-border bg-card">
        <CardHeader><CardTitle className="text-card-foreground">Frota</CardTitle></CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <p className="text-muted-foreground text-center py-8">A carregar...</p>
          ) : vehicles.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">Nenhum veículo registado.</p>
          ) : (
            <div className="overflow-x-auto">
              <div className="min-w-[900px]">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border">
                      <TableHead className="text-muted-foreground whitespace-nowrap text-xs">Nome</TableHead>
                      <TableHead className="text-muted-foreground whitespace-nowrap text-xs">Matrícula</TableHead>
                      <TableHead className="text-muted-foreground whitespace-nowrap text-xs">Tipo</TableHead>
                      <TableHead className="text-muted-foreground whitespace-nowrap text-xs">Estado</TableHead>
                      <TableHead className="text-muted-foreground whitespace-nowrap text-xs">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {vehicles.map((v: any) => (
                      <TableRow key={v.id} className="border-border">
                        <TableCell className="text-foreground whitespace-nowrap text-xs">{v.name}</TableCell>
                        <TableCell className="text-foreground whitespace-nowrap text-xs">{v.licensePlate}</TableCell>
                        <TableCell className="text-foreground whitespace-nowrap text-xs">{v.type}</TableCell>
                        <TableCell className="whitespace-nowrap text-xs"><Badge className={statusBadge[v.status] || ""}>{statusLabel[v.status] || v.status}</Badge></TableCell>
                        <TableCell className="whitespace-nowrap text-xs">
                          <Button variant="ghost" size="sm" onClick={() => handleEdit(v)}>Editar</Button>
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
    </div>
  );
}
