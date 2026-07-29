"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { formatDateTime } from "@/lib/helpers";

interface StockMovement {
  id: string;
  date: string;
  equipmentName: string;
  type: string;
  quantity: number;
  sourceWarehouse: string;
  destinationWarehouse: string;
  userName: string;
}

interface Equipment {
  id: string;
  name: string;
}

const typeBadge: Record<string, string> = {
  ENTRADA: "bg-green-100 text-green-800",
  SAIDA: "bg-red-100 text-red-800",
  TRANSFERENCIA: "bg-blue-100 text-blue-800",
  AVARIA: "bg-yellow-100 text-yellow-800",
  REPARACAO_CONCLUIDA: "bg-purple-100 text-purple-800",
};

const typeLabel: Record<string, string> = {
  ENTRADA: "Entrada",
  SAIDA: "Saída",
  TRANSFERENCIA: "Transferência",
  AVARIA: "Avaria",
  REPARACAO_CONCLUIDA: "Reparação Concluída",
};

export default function MovimentosStockPage() {
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [filterType, setFilterType] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    equipmentId: "",
    type: "",
    quantity: "",
    sourceWarehouse: "",
    destinationWarehouse: "",
    notes: "",
  });

  useEffect(() => {
    async function fetchData() {
      try {
        const [movRes, eqRes] = await Promise.all([
          fetch("/api/stock/movimentos"),
          fetch("/api/equipamentos"),
        ]);
        if (!movRes.ok) throw new Error("Failed to fetch");
        const movData = await movRes.json();
        const eqData = eqRes.ok ? await eqRes.json() : [];
        setMovements(movData);
        setEquipment(eqData);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  async function handleSubmit() {
    setSubmitting(true);
    try {
      const res = await fetch("/api/stock/movimentos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          equipmentId: form.equipmentId,
          type: form.type,
          quantity: Number(form.quantity),
          sourceWarehouse: form.sourceWarehouse,
          destinationWarehouse: form.destinationWarehouse,
          notes: form.notes,
        }),
      });
      if (!res.ok) throw new Error("Failed to create");
      toast.success("Movimento registado com sucesso.");
      setDialogOpen(false);
      setForm({ equipmentId: "", type: "", quantity: "", sourceWarehouse: "", destinationWarehouse: "", notes: "" });
      const movRes = await fetch("/api/stock/movimentos");
      const movData = await movRes.json();
      setMovements(movData);
    } catch {
      toast.error("Erro ao registar movimento.");
    } finally {
      setSubmitting(false);
    }
  }

  const filtered = filterType
    ? movements.filter((m) => m.type === filterType)
    : movements;

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
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Movimentos de Stock</h1>
      </div>

      <div className="flex items-center justify-between gap-4">
        <Select value={filterType} onValueChange={(v) => v && setFilterType(v)}>
          <SelectTrigger className="w-[180px] h-7 text-[11px]">
            <SelectValue placeholder="Todos os tipos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Todos</SelectItem>
            <SelectItem value="ENTRADA">Entrada</SelectItem>
            <SelectItem value="SAIDA">Saída</SelectItem>
            <SelectItem value="TRANSFERENCIA">Transferência</SelectItem>
            <SelectItem value="AVARIA">Avaria</SelectItem>
            <SelectItem value="REPARACAO_CONCLUIDA">Reparação Concluída</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-1 h-4 w-4" />
          Registar Movimento
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <div className="min-w-[900px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="whitespace-nowrap text-xs">Data</TableHead>
                    <TableHead className="whitespace-nowrap text-xs">Equipamento</TableHead>
                    <TableHead className="whitespace-nowrap text-xs">Tipo</TableHead>
                    <TableHead className="whitespace-nowrap text-xs">Quantidade</TableHead>
                    <TableHead className="whitespace-nowrap text-xs">Armazém Origem</TableHead>
                    <TableHead className="whitespace-nowrap text-xs">Armazém Destino</TableHead>
                    <TableHead className="whitespace-nowrap text-xs">Utilizador</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground text-xs whitespace-nowrap">
                        Nenhum registo encontrado.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filtered.map((mov) => (
                      <TableRow key={mov.id}>
                        <TableCell className="whitespace-nowrap text-xs">{formatDateTime(mov.date)}</TableCell>
                        <TableCell className="font-medium whitespace-nowrap text-xs">{mov.equipmentName}</TableCell>
                        <TableCell className="whitespace-nowrap text-xs">
                          <Badge variant="secondary" className={typeBadge[mov.type] ?? ""}>
                            {typeLabel[mov.type] ?? mov.type}
                          </Badge>
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-xs">{mov.quantity}</TableCell>
                        <TableCell className="whitespace-nowrap text-xs">{mov.sourceWarehouse}</TableCell>
                        <TableCell className="whitespace-nowrap text-xs">{mov.destinationWarehouse}</TableCell>
                        <TableCell className="whitespace-nowrap text-xs">{mov.userName}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Registar Movimento</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Equipamento</Label>
              <Select
                value={form.equipmentId}
                onValueChange={(v) => v && setForm((p) => ({ ...p, equipmentId: v }))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecionar equipamento" />
                </SelectTrigger>
                <SelectContent>
                  {equipment.map((eq) => (
                    <SelectItem key={eq.id} value={eq.id}>
                      {eq.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select
                value={form.type}
                onValueChange={(v) => v && setForm((p) => ({ ...p, type: v }))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecionar tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ENTRADA">Entrada</SelectItem>
                  <SelectItem value="SAIDA">Saída</SelectItem>
                  <SelectItem value="TRANSFERENCIA">Transferência</SelectItem>
                  <SelectItem value="AVARIA">Avaria</SelectItem>
                  <SelectItem value="REPARACAO_CONCLUIDA">Reparação Concluída</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="mov-quantity">Quantidade</Label>
              <Input
                id="mov-quantity"
                type="number"
                value={form.quantity}
                onChange={(e) => setForm((p) => ({ ...p, quantity: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mov-source">Armazém Origem</Label>
              <Input
                id="mov-source"
                value={form.sourceWarehouse}
                onChange={(e) => setForm((p) => ({ ...p, sourceWarehouse: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mov-dest">Armazém Destino</Label>
              <Input
                id="mov-dest"
                value={form.destinationWarehouse}
                onChange={(e) => setForm((p) => ({ ...p, destinationWarehouse: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mov-notes">Notas</Label>
              <Textarea
                id="mov-notes"
                value={form.notes}
                onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
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
    </div>
  );
}
