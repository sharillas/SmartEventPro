"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Plus, Car } from "lucide-react";
import { toast } from "sonner";
import { formatDate } from "@/lib/helpers";

interface Vehicle {
  id: string;
  name: string;
  plate: string;
  brand: string;
  model: string;
  type: string;
  status: string;
  insuranceDate: string;
  inspectionDate: string;
}

const statusBadge: Record<string, string> = {
  DISPONIVEL: "bg-green-100 text-green-800",
  EM_USO: "bg-blue-100 text-blue-800",
  EM_MANUTENCAO: "bg-orange-100 text-orange-800",
  ABATIDO: "bg-red-100 text-red-800",
};

const statusLabel: Record<string, string> = {
  DISPONIVEL: "Disponível",
  EM_USO: "Em Uso",
  EM_MANUTENCAO: "Em Manutenção",
  ABATIDO: "Abatido",
};

const emptyForm = {
  name: "",
  plate: "",
  brand: "",
  model: "",
  type: "",
  insuranceDate: "",
  inspectionDate: "",
  notes: "",
};

export default function VeiculosPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    fetch("/api/veiculos")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch");
        return res.json();
      })
      .then((data) => setVehicles(data))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  function handleChange(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit() {
    setSubmitting(true);
    try {
      const res = await fetch("/api/veiculos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Failed to create");
      toast.success("Veículo criado com sucesso.");
      const data = await res.json();
      setVehicles((prev) => [...prev, data]);
      setDialogOpen(false);
      setForm(emptyForm);
    } catch {
      toast.error("Erro ao criar veículo.");
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
        <h1 className="text-2xl font-bold tracking-tight">Veículos</h1>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-1 h-4 w-4" />
          Novo Veículo
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <div className="min-w-[900px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="whitespace-nowrap text-xs">Nome</TableHead>
                    <TableHead className="whitespace-nowrap text-xs">Matrícula</TableHead>
                    <TableHead className="whitespace-nowrap text-xs">Marca</TableHead>
                    <TableHead className="whitespace-nowrap text-xs">Modelo</TableHead>
                    <TableHead className="whitespace-nowrap text-xs">Tipo</TableHead>
                    <TableHead className="whitespace-nowrap text-xs">Estado</TableHead>
                    <TableHead className="whitespace-nowrap text-xs">Seguro</TableHead>
                    <TableHead className="whitespace-nowrap text-xs">Inspeção</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vehicles.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-muted-foreground text-xs whitespace-nowrap">
                        Nenhum registo encontrado.
                      </TableCell>
                    </TableRow>
                  ) : (
                    vehicles.map((v) => (
                      <TableRow key={v.id}>
                        <TableCell className="font-medium whitespace-nowrap text-xs">{v.name}</TableCell>
                        <TableCell className="whitespace-nowrap text-xs">{v.plate}</TableCell>
                        <TableCell className="whitespace-nowrap text-xs">{v.brand}</TableCell>
                        <TableCell className="whitespace-nowrap text-xs">{v.model}</TableCell>
                        <TableCell className="whitespace-nowrap text-xs">{v.type}</TableCell>
                        <TableCell className="whitespace-nowrap text-xs">
                          <Badge variant="secondary" className={statusBadge[v.status] ?? ""}>
                            {statusLabel[v.status] ?? v.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-xs">
                          {v.insuranceDate ? formatDate(v.insuranceDate) : "-"}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-xs">
                          {v.inspectionDate ? formatDate(v.inspectionDate) : "-"}
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
            <DialogTitle>Novo Veículo</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="v-name">Nome</Label>
              <Input
                id="v-name"
                value={form.name}
                onChange={(e) => handleChange("name", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="v-plate">Matrícula</Label>
              <Input
                id="v-plate"
                value={form.plate}
                onChange={(e) => handleChange("plate", e.target.value)}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="v-brand">Marca</Label>
                <Input
                  id="v-brand"
                  value={form.brand}
                  onChange={(e) => handleChange("brand", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="v-model">Modelo</Label>
                <Input
                  id="v-model"
                  value={form.model}
                  onChange={(e) => handleChange("model", e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="v-type">Tipo</Label>
              <Input
                id="v-type"
                value={form.type}
                onChange={(e) => handleChange("type", e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="v-insurance">Seguro</Label>
                <Input
                  id="v-insurance"
                  type="date"
                  value={form.insuranceDate}
                  onChange={(e) => handleChange("insuranceDate", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="v-inspection">Inspeção</Label>
                <Input
                  id="v-inspection"
                  type="date"
                  value={form.inspectionDate}
                  onChange={(e) => handleChange("inspectionDate", e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="v-notes">Notas</Label>
              <Input
                id="v-notes"
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
