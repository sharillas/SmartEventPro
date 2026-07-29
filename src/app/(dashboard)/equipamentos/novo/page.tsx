"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

interface Category {
  id: string;
  name: string;
}

export default function NovoEquipamentoPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    name: "",
    sku: "",
    description: "",
    categoryId: "",
    brand: "",
    model: "",
    serialNumber: "",
    purchaseDate: "",
    purchasePrice: "",
    pricePerDay: "",
    pricePerWeek: "",
    quantity: "1",
    minStock: "0",
    unit: "UN",
    power: "",
    weight: "",
    dimensions: "",
    notes: "",
  });

  useEffect(() => {
    fetch("/api/categorias")
      .then((res) => res.json())
      .then((data) => setCategories(data))
      .catch(() => {});
  }, []);

  function handleChange(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/equipamentos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          sku: form.sku,
          description: form.description,
          categoryId: form.categoryId || null,
          brand: form.brand,
          model: form.model,
          serialNumber: form.serialNumber,
          purchaseDate: form.purchaseDate || null,
          purchasePrice: form.purchasePrice ? Number(form.purchasePrice) : null,
          pricePerDay: form.pricePerDay ? Number(form.pricePerDay) : null,
          pricePerWeek: form.pricePerWeek ? Number(form.pricePerWeek) : null,
          quantity: Number(form.quantity),
          minStock: Number(form.minStock),
          unit: form.unit,
          power: form.power ? Number(form.power) : null,
          weight: form.weight ? Number(form.weight) : null,
          dimensions: form.dimensions,
          notes: form.notes,
        }),
      });
      if (!res.ok) throw new Error("Failed to create");
      toast.success("Equipamento criado com sucesso.");
      router.push("/equipamentos");
    } catch {
      toast.error("Erro ao criar equipamento.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">Novo Equipamento</h1>
      </div>

      <Card>
        <CardContent className="pt-4">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Nome</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sku">SKU</Label>
                <Input
                  id="sku"
                  value={form.sku}
                  onChange={(e) => handleChange("sku", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={form.description}
                  onChange={(e) => handleChange("description", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="categoryId">Categoria</Label>
                <Select
                  value={form.categoryId}
                  onValueChange={(v) => v && handleChange("categoryId", v)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecionar categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="brand">Marca</Label>
                <Input
                  id="brand"
                  value={form.brand}
                  onChange={(e) => handleChange("brand", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="model">Modelo</Label>
                <Input
                  id="model"
                  value={form.model}
                  onChange={(e) => handleChange("model", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="serialNumber">N.º Série</Label>
                <Input
                  id="serialNumber"
                  value={form.serialNumber}
                  onChange={(e) => handleChange("serialNumber", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="purchaseDate">Data Compra</Label>
                <Input
                  id="purchaseDate"
                  type="date"
                  value={form.purchaseDate}
                  onChange={(e) => handleChange("purchaseDate", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="purchasePrice">Preço Compra</Label>
                <Input
                  id="purchasePrice"
                  type="number"
                  step="0.01"
                  value={form.purchasePrice}
                  onChange={(e) => handleChange("purchasePrice", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pricePerDay">Preço Aluguer/Dia</Label>
                <Input
                  id="pricePerDay"
                  type="number"
                  step="0.01"
                  value={form.pricePerDay}
                  onChange={(e) => handleChange("pricePerDay", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pricePerWeek">Preço Aluguer/Semana</Label>
                <Input
                  id="pricePerWeek"
                  type="number"
                  step="0.01"
                  value={form.pricePerWeek}
                  onChange={(e) => handleChange("pricePerWeek", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantidade</Label>
                <Input
                  id="quantity"
                  type="number"
                  value={form.quantity}
                  onChange={(e) => handleChange("quantity", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="minStock">Stock Mínimo</Label>
                <Input
                  id="minStock"
                  type="number"
                  value={form.minStock}
                  onChange={(e) => handleChange("minStock", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="unit">Unidade</Label>
                <Select value={form.unit} onValueChange={(v) => v && handleChange("unit", v)}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="UN">UN</SelectItem>
                    <SelectItem value="KG">KG</SelectItem>
                    <SelectItem value="M">M</SelectItem>
                    <SelectItem value="M2">M2</SelectItem>
                    <SelectItem value="L">L</SelectItem>
                    <SelectItem value="PAR">PAR</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="power">Potência (W)</Label>
                <Input
                  id="power"
                  type="number"
                  value={form.power}
                  onChange={(e) => handleChange("power", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="weight">Peso (kg)</Label>
                <Input
                  id="weight"
                  type="number"
                  step="0.01"
                  value={form.weight}
                  onChange={(e) => handleChange("weight", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dimensions">Dimensões</Label>
                <Input
                  id="dimensions"
                  value={form.dimensions}
                  onChange={(e) => handleChange("dimensions", e.target.value)}
                  placeholder="C x L x A"
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="notes">Notas</Label>
                <Textarea
                  id="notes"
                  value={form.notes}
                  onChange={(e) => handleChange("notes", e.target.value)}
                />
              </div>
            </div>
            <div className="flex items-center gap-3 justify-end">
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Cancelar
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "A guardar..." : "Guardar"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
