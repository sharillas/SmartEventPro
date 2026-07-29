"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { Plus, Wrench } from "lucide-react";
import { toast } from "sonner";
import { formatDate, formatCurrency } from "@/lib/helpers";

interface Repair {
  id: string;
  number: string;
  description: string;
  status: string;
  reportDate: string;
  totalCost: number;
  externalRepairer: string;
}

const statusBadge: Record<string, string> = {
  PENDENTE: "bg-yellow-100 text-yellow-800",
  EM_REPARACAO: "bg-blue-100 text-blue-800",
  CONCLUIDO: "bg-green-100 text-green-800",
  DEVOLVIDO: "bg-gray-100 text-gray-800",
};

const statusLabel: Record<string, string> = {
  PENDENTE: "Pendente",
  EM_REPARACAO: "Em Reparação",
  CONCLUIDO: "Concluído",
  DEVOLVIDO: "Devolvido",
};

const emptyForm = {
  description: "",
  externalRepairer: "",
  notes: "",
};

export default function ReparacoesPage() {
  const [repairs, setRepairs] = useState<Repair[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    fetch("/api/reparacoes")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch");
        return res.json();
      })
      .then((data) => setRepairs(data))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  function handleChange(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit() {
    setSubmitting(true);
    try {
      const res = await fetch("/api/reparacoes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Failed to create");
      toast.success("Guia de reparação criada com sucesso.");
      const data = await res.json();
      setRepairs((prev) => [...prev, data]);
      setDialogOpen(false);
      setForm(emptyForm);
    } catch {
      toast.error("Erro ao criar guia de reparação.");
    } finally {
      setSubmitting(false);
    }
  }

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
        <h1 className="text-2xl font-bold tracking-tight">Reparações</h1>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-1 h-4 w-4" />
          Nova Guia de Reparação
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <div className="min-w-[900px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="whitespace-nowrap text-xs">N.º</TableHead>
                    <TableHead className="whitespace-nowrap text-xs">Descrição</TableHead>
                    <TableHead className="whitespace-nowrap text-xs">Estado</TableHead>
                    <TableHead className="whitespace-nowrap text-xs">Data Reporte</TableHead>
                    <TableHead className="whitespace-nowrap text-xs">Custo Total</TableHead>
                    <TableHead className="whitespace-nowrap text-xs">Reparador Externo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {repairs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground text-xs whitespace-nowrap">
                        Nenhum registo encontrado.
                      </TableCell>
                    </TableRow>
                  ) : (
                    repairs.map((rep) => (
                      <TableRow key={rep.id}>
                        <TableCell className="font-medium whitespace-nowrap text-xs">{rep.number}</TableCell>
                        <TableCell className="whitespace-nowrap text-xs">{rep.description}</TableCell>
                        <TableCell className="whitespace-nowrap text-xs">
                          <Badge variant="secondary" className={statusBadge[rep.status] ?? ""}>
                            {statusLabel[rep.status] ?? rep.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-xs">
                          {rep.reportDate ? formatDate(rep.reportDate) : "-"}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-xs">{formatCurrency(rep.totalCost)}</TableCell>
                        <TableCell className="whitespace-nowrap text-xs">{rep.externalRepairer || "-"}</TableCell>
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
            <DialogTitle>Nova Guia de Reparação</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="r-desc">Descrição</Label>
              <Textarea
                id="r-desc"
                value={form.description}
                onChange={(e) => handleChange("description", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="r-repairer">Reparador Externo</Label>
              <Input
                id="r-repairer"
                value={form.externalRepairer}
                onChange={(e) => handleChange("externalRepairer", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="r-notes">Notas</Label>
              <Textarea
                id="r-notes"
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
    </div>
  );
}
