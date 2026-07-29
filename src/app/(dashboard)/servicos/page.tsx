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

interface Service {
  id: string;
  name: string;
  category: string;
  basePrice: number;
  unit: string;
  status: string;
}

const statusBadge: Record<string, string> = {
  ATIVO: "bg-green-100 text-green-800",
  INATIVO: "bg-gray-100 text-gray-800",
};

const categoryLabel: Record<string, string> = {
  VIDEO: "Vídeo",
  SOM: "Som",
  ILUMINACAO: "Iluminação",
  ESTRUTURAS: "Estruturas",
  MOBILIARIO: "Mobiliário",
  TRANSPORTE: "Transporte",
  MONTAGEM: "Montagem",
  OUTRO: "Outro",
};

const unitLabel: Record<string, string> = {
  UN: "Unidade",
  HORA: "Hora",
  DIA: "Dia",
  SERVICO: "Serviço",
  KM: "Km",
};

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-PT", {
    style: "currency",
    currency: "EUR",
  }).format(value);
}

const emptyForm = {
  name: "",
  description: "",
  category: "",
  basePrice: "",
  unit: "",
};

export default function ServicosPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    fetch("/api/servicos")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch");
        return res.json();
      })
      .then((data) => setServices(data))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  function handleChange(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit() {
    setSubmitting(true);
    try {
      const res = await fetch("/api/servicos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          description: form.description,
          category: form.category,
          basePrice: form.basePrice ? Number(form.basePrice) : null,
          unit: form.unit,
        }),
      });
      if (!res.ok) throw new Error("Failed to create");
      toast.success("Serviço criado com sucesso.");
      const data = await res.json();
      setServices((prev) => [...prev, data]);
      setDialogOpen(false);
      setForm(emptyForm);
    } catch {
      toast.error("Erro ao criar serviço.");
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
        <h1 className="text-2xl font-bold tracking-tight">Serviços</h1>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-1 h-4 w-4" />
          Novo Serviço
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
                    <TableHead className="whitespace-nowrap text-xs">Categoria</TableHead>
                    <TableHead className="whitespace-nowrap text-xs">Preço Base</TableHead>
                    <TableHead className="whitespace-nowrap text-xs">Unidade</TableHead>
                    <TableHead className="whitespace-nowrap text-xs">Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {services.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground text-xs whitespace-nowrap">
                        Nenhum registo encontrado.
                      </TableCell>
                    </TableRow>
                  ) : (
                    services.map((svc) => (
                      <TableRow key={svc.id}>
                        <TableCell className="font-medium whitespace-nowrap text-xs">{svc.name}</TableCell>
                        <TableCell className="whitespace-nowrap text-xs">{categoryLabel[svc.category] ?? svc.category}</TableCell>
                        <TableCell className="whitespace-nowrap text-xs">{formatCurrency(svc.basePrice)}</TableCell>
                        <TableCell className="whitespace-nowrap text-xs">{unitLabel[svc.unit] ?? svc.unit}</TableCell>
                        <TableCell className="whitespace-nowrap text-xs">
                          <Badge variant="secondary" className={statusBadge[svc.status] ?? ""}>
                            {svc.status === "ATIVO" ? "Ativo" : "Inativo"}
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
            <DialogTitle>Novo Serviço</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="s-name">Nome</Label>
              <Input
                id="s-name"
                value={form.name}
                onChange={(e) => handleChange("name", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="s-desc">Descrição</Label>
              <Textarea
                id="s-desc"
                value={form.description}
                onChange={(e) => handleChange("description", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select
                value={form.category}
                onValueChange={(v) => v && handleChange("category", v)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecionar categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="VIDEO">Vídeo</SelectItem>
                  <SelectItem value="SOM">Som</SelectItem>
                  <SelectItem value="ILUMINACAO">Iluminação</SelectItem>
                  <SelectItem value="ESTRUTURAS">Estruturas</SelectItem>
                  <SelectItem value="MOBILIARIO">Mobiliário</SelectItem>
                  <SelectItem value="TRANSPORTE">Transporte</SelectItem>
                  <SelectItem value="MONTAGEM">Montagem</SelectItem>
                  <SelectItem value="OUTRO">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="s-price">Preço Base</Label>
              <Input
                id="s-price"
                type="number"
                step="0.01"
                value={form.basePrice}
                onChange={(e) => handleChange("basePrice", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Unidade</Label>
              <Select
                value={form.unit}
                onValueChange={(v) => v && handleChange("unit", v)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecionar unidade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="UN">Unidade</SelectItem>
                  <SelectItem value="HORA">Hora</SelectItem>
                  <SelectItem value="DIA">Dia</SelectItem>
                  <SelectItem value="SERVICO">Serviço</SelectItem>
                  <SelectItem value="KM">Km</SelectItem>
                </SelectContent>
              </Select>
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
