"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { FileDown, FileUp, Paperclip } from "lucide-react";

const statusBadge: Record<string, string> = {
  PENDENTE: "bg-yellow-500/20 text-yellow-400",
  PAGO: "bg-green-500/20 text-green-400",
  VENCIDO: "bg-red-500/20 text-red-400",
  CANCELADO: "bg-gray-500/20 text-gray-400",
};
const statusLabel: Record<string, string> = {
  PENDENTE: "Pendente",
  PAGO: "Pago",
  VENCIDO: "Vencido",
  CANCELADO: "Cancelado",
};

export default function FinanceiroFaturasPage() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editModal, setEditModal] = useState(false);
  const [selected, setSelected] = useState<any>(null);

  useEffect(() => { fetchData(); }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const res = await fetch("/api/faturas");
      setInvoices(await res.json());
    } catch { toast.error("Erro ao carregar faturas."); }
    setLoading(false);
  }

  function handleEdit(invoice: any) {
    setSelected({ ...invoice });
    setEditModal(true);
  }

  async function handleSave() {
    toast.success("Fatura atualizada (demo).");
    setEditModal(false);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Faturas</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="border-border">
            <FileUp className="h-4 w-4 mr-2" /> Importar PDF
          </Button>
          <Button variant="outline" size="sm" className="border-border">
            <FileDown className="h-4 w-4 mr-2" /> Exportar
          </Button>
        </div>
      </div>

      <Card className="border-border bg-card">
        <CardHeader><CardTitle className="text-card-foreground">Lista de Faturas</CardTitle></CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <p className="text-muted-foreground text-center py-8">A carregar...</p>
          ) : invoices.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">Nenhuma fatura encontrada.</p>
          ) : (
            <div className="overflow-x-auto">
              <div className="min-w-[900px]">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border">
                      <TableHead className="text-muted-foreground whitespace-nowrap text-xs">N.º</TableHead>
                      <TableHead className="text-muted-foreground whitespace-nowrap text-xs">Cliente</TableHead>
                      <TableHead className="text-muted-foreground whitespace-nowrap text-xs">Data</TableHead>
                      <TableHead className="text-muted-foreground whitespace-nowrap text-xs">Total</TableHead>
                      <TableHead className="text-muted-foreground whitespace-nowrap text-xs">Estado</TableHead>
                      <TableHead className="text-muted-foreground whitespace-nowrap text-xs">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoices.map((inv: any) => (
                      <TableRow key={inv.id} className="border-border">
                        <TableCell className="text-foreground whitespace-nowrap text-xs">{inv.number}</TableCell>
                        <TableCell className="text-foreground whitespace-nowrap text-xs">{inv.client?.name || "—"}</TableCell>
                        <TableCell className="text-foreground whitespace-nowrap text-xs">{new Date(inv.date).toLocaleDateString("pt-PT")}</TableCell>
                        <TableCell className="text-foreground whitespace-nowrap text-xs">{new Intl.NumberFormat("pt-PT", { style: "currency", currency: "EUR" }).format(inv.total)}</TableCell>
                        <TableCell className="whitespace-nowrap text-xs"><Badge className={statusBadge[inv.status] || ""}>{statusLabel[inv.status] || inv.status}</Badge></TableCell>
                        <TableCell className="whitespace-nowrap text-xs">
                          <Button variant="ghost" size="sm" onClick={() => handleEdit(inv)}>Editar</Button>
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
          <DialogHeader><DialogTitle>Editar Fatura</DialogTitle></DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">N.º Fatura</label>
                <Input value={selected.number} disabled className="bg-background border-border" />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">Estado</label>
                <Select value={selected.status} onValueChange={(v) => v && setSelected({ ...selected, status: v })}>
                  <SelectTrigger className="bg-background border-border"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PENDENTE">Pendente</SelectItem>
                    <SelectItem value="PAGO">Pago</SelectItem>
                    <SelectItem value="VENCIDO">Vencido</SelectItem>
                    <SelectItem value="CANCELADO">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">Anexos</label>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Paperclip className="h-4 w-4" /> Nenhum anexo
                </div>
                <Button variant="outline" size="sm" className="border-border">
                  <FileUp className="h-4 w-4 mr-2" /> Anexar PDF
                </Button>
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
