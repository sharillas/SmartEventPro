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
import { Plus, Truck } from "lucide-react";
import { toast } from "sonner";
import { formatDateTime } from "@/lib/helpers";

interface Transport {
  id: string;
  number: string;
  projectName: string;
  vehicleName: string;
  driverName: string;
  departure: string;
  arrival: string;
  status: string;
}

const statusBadge: Record<string, string> = {
  PENDENTE: "bg-yellow-100 text-yellow-800",
  EM_TRANSITO: "bg-purple-100 text-purple-800",
  CONCLUIDO: "bg-green-100 text-green-800",
  CANCELADO: "bg-red-100 text-red-800",
};

const statusLabel: Record<string, string> = {
  PENDENTE: "Pendente",
  EM_TRANSITO: "Em Trânsito",
  CONCLUIDO: "Concluído",
  CANCELADO: "Cancelado",
};

const emptyForm = {
  projectId: "",
  vehicleId: "",
  driver: "",
  departure: "",
  arrival: "",
  notes: "",
};

export default function TransportesPage() {
  const [transports, setTransports] = useState<Transport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    fetch("/api/transportes")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch");
        return res.json();
      })
      .then((data) => setTransports(data))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  function handleChange(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit() {
    setSubmitting(true);
    try {
      const res = await fetch("/api/transportes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Failed to create");
      toast.success("Guia de transporte criada com sucesso.");
      const data = await res.json();
      setTransports((prev) => [...prev, data]);
      setDialogOpen(false);
      setForm(emptyForm);
    } catch {
      toast.error("Erro ao criar guia de transporte.");
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
        <h1 className="text-2xl font-bold text-foreground">Guias de Transporte</h1>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-1 h-4 w-4" />
          Nova Guia de Transporte
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
                    <TableHead className="whitespace-nowrap text-xs">Projeto</TableHead>
                    <TableHead className="whitespace-nowrap text-xs">Veículo</TableHead>
                    <TableHead className="whitespace-nowrap text-xs">Motorista</TableHead>
                    <TableHead className="whitespace-nowrap text-xs">Partida</TableHead>
                    <TableHead className="whitespace-nowrap text-xs">Chegada</TableHead>
                    <TableHead className="whitespace-nowrap text-xs">Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transports.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground text-xs whitespace-nowrap">
                        Nenhum registo encontrado.
                      </TableCell>
                    </TableRow>
                  ) : (
                    transports.map((t) => (
                      <TableRow key={t.id}>
                        <TableCell className="font-medium whitespace-nowrap text-xs">{t.number}</TableCell>
                        <TableCell className="whitespace-nowrap text-xs">{t.projectName}</TableCell>
                        <TableCell className="whitespace-nowrap text-xs">{t.vehicleName}</TableCell>
                        <TableCell className="whitespace-nowrap text-xs">{t.driverName}</TableCell>
                        <TableCell className="whitespace-nowrap text-xs">
                          {t.departure ? formatDateTime(t.departure) : "-"}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-xs">
                          {t.arrival ? formatDateTime(t.arrival) : "-"}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-xs">
                          <Badge variant="secondary" className={statusBadge[t.status] ?? ""}>
                            {statusLabel[t.status] ?? t.status}
                          </Badge>
                        </TableCell>
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
            <DialogTitle>Nova Guia de Transporte</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="t-project">Projeto</Label>
              <Select
                value={form.projectId}
                onValueChange={(v) => v && handleChange("projectId", v)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecionar projeto" />
                </SelectTrigger>
                <SelectContent>
                  {/* Projects will be populated from API in production */}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="t-vehicle">Veículo</Label>
              <Select
                value={form.vehicleId}
                onValueChange={(v) => v && handleChange("vehicleId", v)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecionar veículo" />
                </SelectTrigger>
                <SelectContent>
                  {/* Vehicles will be populated from API in production */}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="t-driver">Motorista</Label>
              <Input
                id="t-driver"
                value={form.driver}
                onChange={(e) => handleChange("driver", e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="t-departure">Partida</Label>
                <Input
                  id="t-departure"
                  type="datetime-local"
                  value={form.departure}
                  onChange={(e) => handleChange("departure", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="t-arrival">Chegada</Label>
                <Input
                  id="t-arrival"
                  type="datetime-local"
                  value={form.arrival}
                  onChange={(e) => handleChange("arrival", e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="t-notes">Notas</Label>
              <Textarea
                id="t-notes"
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
