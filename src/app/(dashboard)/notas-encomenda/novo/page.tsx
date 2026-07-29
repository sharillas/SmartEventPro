"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { ArrowLeft, Plus, Trash2, FileDown } from "lucide-react";

const DEPARTMENTS = [
  { value: "AUDIO", label: "Áudio" },
  { value: "ILUMINACAO", label: "Iluminação" },
  { value: "VIDEO", label: "Vídeo" },
  { value: "ESTRUTURAS", label: "Estruturas" },
  { value: "MOBILIARIO", label: "Mobiliário" },
  { value: "ADMINISTRACAO", label: "Administração" },
  { value: "RECURSOS_HUMANOS", label: "Recursos Humanos" },
  { value: "COMERCIAL", label: "Comercial" },
  { value: "TRANSPORTES", label: "Transportes" },
];

interface OrderItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  taxAmount: number;
  total: number;
}

function newItem(): OrderItem {
  return {
    id: crypto.randomUUID(),
    description: "",
    quantity: 1,
    unitPrice: 0,
    taxRate: 23,
    taxAmount: 0,
    total: 0,
  };
}

function recalc(item: OrderItem): OrderItem {
  const subtotal = item.unitPrice * item.quantity;
  const taxAmount = subtotal * (item.taxRate / 100);
  return { ...item, taxAmount, total: subtotal + taxAmount };
}

export default function NovaNotaEncomendaPage() {
  const router = useRouter();
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [supplierId, setSupplierId] = useState("");
  const [department, setDepartment] = useState("");
  const [projectCode, setProjectCode] = useState("");
  const [fixedAsset, setFixedAsset] = useState(false);
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<OrderItem[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/clientes?type=FORNECEDOR")
      .then((r) => r.json())
      .then(setSuppliers);
  }, []);

  function addItem() {
    setItems([...items, newItem()]);
  }

  function removeItem(index: number) {
    setItems(items.filter((_, i) => i !== index));
  }

  function updateItem(index: number, field: keyof OrderItem, value: string | number) {
    setItems(
      items.map((item, i) => {
        if (i !== index) return item;
        const updated = recalc({ ...item, [field]: value });
        return updated;
      })
    );
  }

  const subtotal = items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
  const taxAmount = items.reduce((s, i) => s + i.taxAmount, 0);
  const total = subtotal + taxAmount;
  const f = (v: number) =>
    new Intl.NumberFormat("pt-PT", { style: "currency", currency: "EUR" }).format(v);

  async function handleSave() {
    if (!supplierId) {
      toast.error("Selecione um fornecedor.");
      return;
    }
    if (!department) {
      toast.error("Selecione um departamento.");
      return;
    }
    if (items.length === 0 || items.every((i) => !i.description.trim())) {
      toast.error("Adicione pelo menos um item com descrição.");
      return;
    }
    setSaving(true);
    const res = await fetch("/api/notas-encomenda", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        supplierId,
        department,
        projectCode: projectCode || null,
        fixedAsset,
        notes: notes || null,
        items: items.map((i) => ({
          description: i.description,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          taxRate: i.taxRate,
          taxAmount: i.taxAmount,
          total: i.total,
        })),
        subtotal,
        taxAmount,
        total,
      }),
    });
    if (!res.ok) {
      toast.error("Erro ao criar nota.");
      setSaving(false);
      return;
    }
    toast.success("Nota de encomenda criada!");
    router.push("/notas-encomenda");
  }

  function handleExportPDF() {
    toast.success("Exportação PDF iniciada (em desenvolvimento).");
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <Button variant="ghost" size="sm" onClick={() => router.push("/notas-encomenda")} className="mb-1">
            <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
          </Button>
          <h1 className="text-2xl font-bold text-foreground">Nova Nota de Encomenda</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExportPDF} className="border-border">
            <FileDown className="h-4 w-4 mr-1" /> Exportar PDF
          </Button>
          <Button onClick={handleSave} disabled={saving} size="sm">
            {saving ? "A guardar..." : "Guardar"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4">
        <Card className="col-span-4 border-border bg-card">
          <CardContent className="p-4 space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Fornecedor</Label>
              <Select value={supplierId} onValueChange={(v) => v && setSupplierId(v)}>
                <SelectTrigger className="bg-background border-border h-8 text-sm">
                  <SelectValue placeholder="Selecionar fornecedor..." />
                </SelectTrigger>
                <SelectContent>
                  {suppliers.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Departamento</Label>
              <Select value={department} onValueChange={(v) => v && setDepartment(v)}>
                <SelectTrigger className="bg-background border-border h-8 text-sm">
                  <SelectValue placeholder="Selecionar departamento..." />
                </SelectTrigger>
                <SelectContent>
                  {DEPARTMENTS.map((d) => (
                    <SelectItem key={d.value} value={d.value}>
                      {d.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Código Projeto</Label>
              <Input
                value={projectCode}
                onChange={(e) => setProjectCode(e.target.value)}
                placeholder="Ex: PROJ_0001-2026"
                className="bg-background border-border h-8 text-sm"
              />
            </div>

            <div className="flex items-center space-x-2 pt-1">
              <Checkbox
                id="fixed-asset"
                checked={fixedAsset}
                onCheckedChange={(v) => setFixedAsset(!!v)}
              />
              <Label htmlFor="fixed-asset" className="text-xs text-muted-foreground cursor-pointer">
                Registar como imobilizado da empresa
              </Label>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Notas</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Notas gerais da encomenda..."
                className="bg-background border-border resize-none text-sm"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        <div className="col-span-8 space-y-4">
          <Card className="border-border bg-card">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-semibold text-foreground">Itens ({items.length})</p>
                <Button variant="outline" size="sm" onClick={addItem} className="border-border h-7 text-xs">
                  <Plus className="h-3.5 w-3.5 mr-1" /> Adicionar Item
                </Button>
              </div>

              {items.length === 0 ? (
                <p className="text-muted-foreground text-xs text-center py-8">
                  Clique em &quot;Adicionar Item&quot; para começar.
                </p>
              ) : (
                <div className="space-y-2">
                  {items.map((item, idx) => (
                    <div key={item.id} className="flex items-center gap-2 p-2 rounded bg-background/50">
                      <Input
                        placeholder="Descrição"
                        value={item.description}
                        onChange={(e) => updateItem(idx, "description", e.target.value)}
                        className="flex-1 h-8 text-xs bg-background border-border"
                      />
                      <Input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateItem(idx, "quantity", Number(e.target.value) || 0)}
                        className="w-16 h-8 text-xs bg-background border-border text-center"
                        min={1}
                      />
                      <Input
                        type="number"
                        value={item.unitPrice || ""}
                        onChange={(e) => updateItem(idx, "unitPrice", Number(e.target.value) || 0)}
                        className="w-24 h-8 text-xs bg-background border-border text-right"
                        min={0}
                        step={0.01}
                      />
                      <Input
                        type="number"
                        value={item.taxRate}
                        onChange={(e) => updateItem(idx, "taxRate", Number(e.target.value) || 0)}
                        className="w-16 h-8 text-xs bg-background border-border text-center"
                        min={0}
                      />
                      <span className="w-24 text-xs font-semibold text-right text-foreground whitespace-nowrap">
                        {f(item.total)}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-red-400 shrink-0"
                        onClick={() => removeItem(idx)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardContent className="p-4 flex justify-end">
              <div className="space-y-1.5 text-right w-64">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="text-foreground">{f(subtotal)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">IVA</span>
                  <span className="text-foreground">{f(taxAmount)}</span>
                </div>
                <Separator className="my-1 bg-border" />
                <div className="flex justify-between font-bold">
                  <span className="text-foreground">Total</span>
                  <span className="text-primary">{f(total)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
