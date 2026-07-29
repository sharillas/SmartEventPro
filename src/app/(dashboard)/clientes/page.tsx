"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Users } from "lucide-react";
import { toast } from "sonner";

interface Client {
  id: string;
  name: string;
  type: string;
  company: string;
  email: string;
  phone: string;
  nif: string;
  city: string;
  address: string;
  postalCode: string;
  country: string;
  notes: string;
}

const typeBadgeClass: Record<string, string> = {
  CLIENTE: "border-blue-500 text-blue-400",
  FORNECEDOR: "border-green-500 text-green-400",
  ENTIDADE: "border-purple-500 text-purple-400",
};
const typeLabel: Record<string, string> = {
  CLIENTE: "Cliente",
  FORNECEDOR: "Fornecedor",
  ENTIDADE: "Entidade",
};

const FILTERS = [
  { key: "", label: "Todos" },
  { key: "CLIENTE", label: "Clientes" },
  { key: "FORNECEDOR", label: "Fornecedores" },
  { key: "ENTIDADE", label: "Entidades" },
] as const;

const emptyForm = {
  name: "",
  type: "CLIENTE",
  company: "",
  email: "",
  phone: "",
  nif: "",
  address: "",
  city: "",
  postalCode: "",
  country: "Portugal",
  notes: "",
};

export default function ClientesPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    const url = filter ? `/api/clientes?type=${filter}` : "/api/clientes";
    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch");
        return res.json();
      })
      .then((data) => setClients(data))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [filter]);

  function handleChange(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit() {
    setSubmitting(true);
    try {
      const res = await fetch("/api/clientes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Failed to create");
      toast.success("Cliente criado com sucesso.");
      const data = await res.json();
      setClients((prev) => [...prev, data]);
      setDialogOpen(false);
      setForm(emptyForm);
    } catch {
      toast.error("Erro ao criar cliente.");
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
        <h1 className="text-2xl font-bold tracking-tight">Clientes</h1>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-1 h-4 w-4" />
          Novo Cliente
        </Button>
      </div>

      <div className="flex gap-2">
        {FILTERS.map((f) => (
          <Button
            key={f.key}
            variant={filter === f.key ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(f.key)}
          >
            {f.label}
          </Button>
        ))}
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <div className="min-w-[800px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="whitespace-nowrap text-xs p-1.5">Nome</TableHead>
                    <TableHead className="whitespace-nowrap text-xs p-1.5">Tipo</TableHead>
                    <TableHead className="whitespace-nowrap text-xs p-1.5">Empresa</TableHead>
                    <TableHead className="whitespace-nowrap text-xs p-1.5">Email</TableHead>
                    <TableHead className="whitespace-nowrap text-xs p-1.5">Telefone</TableHead>
                    <TableHead className="whitespace-nowrap text-xs p-1.5">NIF</TableHead>
                    <TableHead className="whitespace-nowrap text-xs p-1.5">Cidade</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clients.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground text-xs p-1.5 whitespace-nowrap">
                        Nenhum registo encontrado.
                      </TableCell>
                    </TableRow>
                  ) : (
                    clients.map((client) => (
                      <TableRow key={client.id}>
                        <TableCell className="font-medium whitespace-nowrap text-xs p-1.5">{client.name}</TableCell>
                        <TableCell className="whitespace-nowrap text-xs p-1.5">
                          <Badge variant="outline" className={`bg-transparent text-[10px] px-1 py-0 ${typeBadgeClass[client.type] || ""}`}>
                            {typeLabel[client.type] || client.type}
                          </Badge>
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-xs p-1.5">{client.company}</TableCell>
                        <TableCell className="whitespace-nowrap text-xs p-1.5">{client.email}</TableCell>
                        <TableCell className="whitespace-nowrap text-xs p-1.5">{client.phone}</TableCell>
                        <TableCell className="whitespace-nowrap text-xs p-1.5">{client.nif}</TableCell>
                        <TableCell className="whitespace-nowrap text-xs p-1.5">{client.city}</TableCell>
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
            <DialogTitle>Novo Cliente</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="c-type">Tipo</Label>
              <Select value={form.type} onValueChange={(v) => v && handleChange("type", v)}>
                <SelectTrigger id="c-type" className="bg-background border-border">
                  <SelectValue placeholder="Selecionar tipo..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CLIENTE">Cliente</SelectItem>
                  <SelectItem value="FORNECEDOR">Fornecedor</SelectItem>
                  <SelectItem value="ENTIDADE">Entidade</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="c-name">Nome</Label>
              <Input
                id="c-name"
                value={form.name}
                onChange={(e) => handleChange("name", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="c-company">Empresa</Label>
              <Input
                id="c-company"
                value={form.company}
                onChange={(e) => handleChange("company", e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="c-email">Email</Label>
                <Input
                  id="c-email"
                  type="email"
                  value={form.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="c-phone">Telefone</Label>
                <Input
                  id="c-phone"
                  value={form.phone}
                  onChange={(e) => handleChange("phone", e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="c-nif">NIF</Label>
              <Input
                id="c-nif"
                value={form.nif}
                onChange={(e) => handleChange("nif", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="c-address">Morada</Label>
              <Input
                id="c-address"
                value={form.address}
                onChange={(e) => handleChange("address", e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="c-city">Cidade</Label>
                <Input
                  id="c-city"
                  value={form.city}
                  onChange={(e) => handleChange("city", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="c-postal">Código Postal</Label>
                <Input
                  id="c-postal"
                  value={form.postalCode}
                  onChange={(e) => handleChange("postalCode", e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="c-country">País</Label>
              <Input
                id="c-country"
                value={form.country}
                onChange={(e) => handleChange("country", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="c-notes">Notas</Label>
              <Input
                id="c-notes"
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
