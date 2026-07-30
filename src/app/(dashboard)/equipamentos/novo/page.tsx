"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Image } from "lucide-react";
import { toast } from "sonner";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";

interface Category { id: string; name: string; }

export default function NovoEquipamentoPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");
  const [categories, setCategories] = useState<Category[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(!!editId);

  const [form, setForm] = useState({
    name: "", sku: "", description: "", categoryId: "", brand: "", model: "",
    serialNumber: "", purchaseDate: "", purchasePrice: "",
    rentalPriceDaily: "", rentalPriceWeekly: "",
    quantity: "1", minStock: "0", unit: "UN",
    powerWatts: "", weightKg: "", dimensions: "", notes: "",
  });

  useEffect(() => {
    fetch("/api/categorias").then(r => r.json()).then(d => setCategories(d)).catch(() => {});
  }, []);

  useEffect(() => {
    if (editId) {
      fetch(`/api/equipamentos/${editId}`)
        .then(r => r.json())
        .then((eq) => {
          setForm({
            name: eq.name || "", sku: eq.sku || "", description: eq.description || "",
            categoryId: eq.categoryId || "", brand: eq.brand || "", model: eq.model || "",
            serialNumber: eq.serialNumber || "",
            purchaseDate: eq.purchaseDate ? new Date(eq.purchaseDate).toISOString().split("T")[0] : "",
            purchasePrice: eq.purchasePrice ? String(eq.purchasePrice) : "",
            rentalPriceDaily: eq.rentalPriceDaily ? String(eq.rentalPriceDaily) : "",
            rentalPriceWeekly: eq.rentalPriceWeekly ? String(eq.rentalPriceWeekly) : "",
            quantity: String(eq.quantity ?? 1), minStock: String(eq.minStock ?? 0),
            unit: eq.unit || "UN",
            powerWatts: eq.powerWatts ? String(eq.powerWatts) : "",
            weightKg: eq.weightKg ? String(eq.weightKg) : "",
            dimensions: eq.dimensions || "", notes: eq.notes || "",
          });
          if (eq.imageUrl) setImagePreview(eq.imageUrl);
        })
        .finally(() => setLoading(false));
    }
  }, [editId]);

  const categoryItems = useMemo(() => Object.fromEntries(categories.map((c) => [c.id, c.name] as const)), [categories]);

  function handleChange(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      let imageUrl = imagePreview && !imagePreview.startsWith("blob:") ? imagePreview : "";
      if (imageFile) {
        const fd = new FormData();
        fd.append("file", imageFile);
        const uploadRes = await fetch("/api/upload", { method: "POST", body: fd });
        if (uploadRes.ok) { const d = await uploadRes.json(); imageUrl = d.url; }
      }
      const payload = {
        name: form.name, sku: form.sku, description: form.description,
        categoryId: form.categoryId || null, brand: form.brand, model: form.model,
        serialNumber: form.serialNumber, purchaseDate: form.purchaseDate || null,
        purchasePrice: form.purchasePrice ? Number(form.purchasePrice) : 0,
        rentalPriceDaily: form.rentalPriceDaily ? Number(form.rentalPriceDaily) : 0,
        rentalPriceWeekly: form.rentalPriceWeekly ? Number(form.rentalPriceWeekly) : 0,
        quantity: Number(form.quantity), minStock: Number(form.minStock), unit: form.unit,
        powerWatts: form.powerWatts ? Number(form.powerWatts) : null,
        weightKg: form.weightKg ? Number(form.weightKg) : null,
        dimensions: form.dimensions, notes: form.notes, imageUrl,
      };
      const url = editId ? `/api/equipamentos/${editId}` : "/api/equipamentos";
      const res = await fetch(url, {
        method: editId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error();
      toast.success(editId ? "Equipamento atualizado." : "Equipamento criado.");
      router.push("/equipamentos");
    } catch {
      toast.error(editId ? "Erro ao atualizar." : "Erro ao criar.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <div className="flex min-h-[60vh] items-center justify-center"><p className="text-muted-foreground">A carregar...</p></div>;

  return (
    <div className="space-y-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem><BreadcrumbLink href="/">Dashboard</BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbLink href="/equipamentos">Equipamentos</BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbPage>{editId ? "Editar" : "Novo"}</BreadcrumbPage></BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}><ArrowLeft className="h-5 w-5" /></Button>
        <h1 className="text-2xl font-bold tracking-tight">{editId ? "Editar Equipamento" : "Novo Equipamento"}</h1>
      </div>

      <Card>
        <CardContent className="pt-4">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="equip-image">Imagem</Label>
              <div className="flex items-center gap-4">
                {imagePreview ? (
                  <img src={imagePreview} alt="Preview" className="h-20 w-20 rounded-lg object-cover border" />
                ) : (
                  <div className="flex h-20 w-20 items-center justify-center rounded-lg border border-dashed bg-muted/50">
                    <Image className="h-6 w-6 text-muted-foreground" />
                  </div>
                )}
                <Input id="equip-image" type="file" accept="image/*" onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) { setImageFile(file); setImagePreview(URL.createObjectURL(file)); }
                }} className="max-w-xs" />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2"><Label htmlFor="name">Nome</Label><Input id="name" value={form.name} onChange={e => handleChange("name", e.target.value)} required /></div>
              <div className="space-y-2"><Label htmlFor="sku">SKU</Label><Input id="sku" value={form.sku} onChange={e => handleChange("sku", e.target.value)} required /></div>
              <div className="space-y-2 sm:col-span-2"><Label htmlFor="description">Descrição</Label><Textarea id="description" value={form.description} onChange={e => handleChange("description", e.target.value)} /></div>
              <div className="space-y-2"><Label htmlFor="categoryId">Categoria</Label>
                <Select value={form.categoryId} onValueChange={v => v && handleChange("categoryId", v)} items={categoryItems}>
                  <SelectTrigger className="w-full"><SelectValue placeholder="Selecionar categoria" /></SelectTrigger>
                  <SelectContent>{categories.map(cat => <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label htmlFor="brand">Marca</Label><Input id="brand" value={form.brand} onChange={e => handleChange("brand", e.target.value)} /></div>
              <div className="space-y-2"><Label htmlFor="model">Modelo</Label><Input id="model" value={form.model} onChange={e => handleChange("model", e.target.value)} /></div>
              <div className="space-y-2"><Label htmlFor="serialNumber">N.º Série</Label><Input id="serialNumber" value={form.serialNumber} onChange={e => handleChange("serialNumber", e.target.value)} /></div>
              <div className="space-y-2"><Label htmlFor="purchaseDate">Data Compra</Label><Input id="purchaseDate" type="date" value={form.purchaseDate} onChange={e => handleChange("purchaseDate", e.target.value)} /></div>
              <div className="space-y-2"><Label htmlFor="purchasePrice">Preço Compra</Label><Input id="purchasePrice" type="number" step="0.01" value={form.purchasePrice} onChange={e => handleChange("purchasePrice", e.target.value)} /></div>
              <div className="space-y-2"><Label htmlFor="rentalPriceDaily">Preço Aluguer/Dia</Label><Input id="rentalPriceDaily" type="number" step="0.01" value={form.rentalPriceDaily} onChange={e => handleChange("rentalPriceDaily", e.target.value)} required /></div>
              <div className="space-y-2"><Label htmlFor="rentalPriceWeekly">Preço Aluguer/Semana</Label><Input id="rentalPriceWeekly" type="number" step="0.01" value={form.rentalPriceWeekly} onChange={e => handleChange("rentalPriceWeekly", e.target.value)} /></div>
              <div className="space-y-2"><Label htmlFor="quantity">Quantidade</Label><Input id="quantity" type="number" value={form.quantity} onChange={e => handleChange("quantity", e.target.value)} required /></div>
              <div className="space-y-2"><Label htmlFor="minStock">Stock Mínimo</Label><Input id="minStock" type="number" value={form.minStock} onChange={e => handleChange("minStock", e.target.value)} /></div>
              <div className="space-y-2"><Label htmlFor="unit">Unidade</Label>
                <Select value={form.unit} onValueChange={v => v && handleChange("unit", v)}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>{["UN","KG","M","M2","L","PAR"].map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label htmlFor="powerWatts">Potência (W)</Label><Input id="powerWatts" type="number" value={form.powerWatts} onChange={e => handleChange("powerWatts", e.target.value)} /></div>
              <div className="space-y-2"><Label htmlFor="weightKg">Peso (kg)</Label><Input id="weightKg" type="number" step="0.01" value={form.weightKg} onChange={e => handleChange("weightKg", e.target.value)} /></div>
              <div className="space-y-2"><Label htmlFor="dimensions">Dimensões</Label><Input id="dimensions" value={form.dimensions} onChange={e => handleChange("dimensions", e.target.value)} placeholder="C x L x A" /></div>
              <div className="space-y-2 sm:col-span-2"><Label htmlFor="notes">Notas</Label><Textarea id="notes" value={form.notes} onChange={e => handleChange("notes", e.target.value)} /></div>
            </div>
            <div className="flex items-center gap-3 justify-end">
              <Button type="button" variant="outline" onClick={() => router.back()}>Cancelar</Button>
              <Button type="submit" disabled={submitting}>{submitting ? "A guardar..." : "Guardar"}</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
