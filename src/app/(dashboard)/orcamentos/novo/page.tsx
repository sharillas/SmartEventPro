"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Search, Plus, X, Minus, Trash2, Package, ClipboardList, User, MapPin, Calendar, FileText, Calculator, FileDown } from "lucide-react";

interface QuoteItem {
  id: string;
  type: "EQUIPAMENTO" | "SERVICO";
  name: string;
  sku?: string;
  category?: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export default function NovoOrcamentoPage() {
  const router = useRouter();

  // Dados
  const [equipment, setEquipment] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);

  // Filtro equipamentos
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("TODOS");
  const [activeTab, setActiveTab] = useState<"EQUIPAMENTO" | "SERVICO">("EQUIPAMENTO");

  // Orçamento
  const [items, setItems] = useState<QuoteItem[]>([]);
  const [clientId, setClientId] = useState("");
  const [newClient, setNewClient] = useState({ name: "", companyName: "", email: "", phone: "", nif: "" });
  const [clientMode, setClientMode] = useState<"existing" | "new">("existing");
  const [eventLocation, setEventLocation] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/equipamentos").then(r => r.json()),
      fetch("/api/servicos").then(r => r.json()),
      fetch("/api/clientes").then(r => r.json()),
    ]).then(([eq, sv, cl]) => {
      setEquipment(eq);
      setServices(sv);
      setClients(cl);
    }).catch(() => toast.error("Erro ao carregar dados."));
  }, []);

  // Categorias únicas
  const categories = useMemo(() => {
    const cats = new Set(equipment.map(e => e.category?.name).filter(Boolean));
    return ["TODOS", ...Array.from(cats)];
  }, [equipment]);

  // Filtrar equipamentos
  const filteredEquipment = useMemo(() => {
    return equipment.filter(e => {
      const matchSearch = e.name.toLowerCase().includes(search.toLowerCase()) || (e.sku || "").toLowerCase().includes(search.toLowerCase());
      const matchCat = filterCategory === "TODOS" || e.category?.name === filterCategory;
      return matchSearch && matchCat;
    });
  }, [equipment, search, filterCategory]);

  const filteredServices = useMemo(() => {
    return services.filter(s => s.name.toLowerCase().includes(search.toLowerCase()));
  }, [services, search]);

  function addItem(type: "EQUIPAMENTO" | "SERVICO", item: any) {
    const existing = items.find(i => i.id === item.id && i.type === type);
    if (existing) {
      setItems(items.map(i =>
        i.id === item.id && i.type === type
          ? { ...i, quantity: i.quantity + 1, total: (i.quantity + 1) * i.unitPrice }
          : i
      ));
    } else {
      const price = type === "EQUIPAMENTO" ? (item.rentalPriceDaily || 0) : (item.defaultPrice || 0);
      setItems([...items, {
        id: item.id,
        type,
        name: item.name,
        sku: item.sku,
        category: item.category?.name || item.category,
        quantity: 1,
        unitPrice: price,
        total: price,
      }]);
    }
  }

  function updateQty(index: number, delta: number) {
    setItems(items.map((item, i) => {
      if (i !== index) return item;
      const qty = Math.max(1, item.quantity + delta);
      return { ...item, quantity: qty, total: qty * item.unitPrice };
    }));
  }

  function removeItem(index: number) {
    setItems(items.filter((_, i) => i !== index));
  }

  function updatePrice(index: number, price: number) {
    setItems(items.map((item, i) => {
      if (i !== index) return item;
      return { ...item, unitPrice: price, total: item.quantity * price };
    }));
  }

  const subtotal = items.reduce((sum, i) => sum + i.total, 0);
  const ivaRate = 23;
  const ivaAmount = subtotal * (ivaRate / 100);
  const total = subtotal + ivaAmount;

  // Agrupar items por departamento/categoria
  const groupedItems = useMemo(() => {
    const groups: Record<string, QuoteItem[]> = {};
    items.forEach(item => {
      const key = item.category || item.type;
      if (!groups[key]) groups[key] = [];
      groups[key].push(item);
    });
    return groups;
  }, [items]);

  async function handleExportPDF() {
    if (items.length === 0) { toast.error("Adicione pelo menos um item."); return; }

    const selectedClient = clients.find(c => c.id === clientId);

    await fetch("/api/pdf/orcamento/preview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clientName: clientMode === "existing" ? (selectedClient?.name || "") : newClient.name,
        clientCompany: clientMode === "existing" ? (selectedClient?.companyName || "") : newClient.companyName,
        clientNif: clientMode === "existing" ? (selectedClient?.nif || "") : newClient.nif,
        location: eventLocation,
        startDate: startDate || null,
        endDate: endDate || null,
        items: items.map(i => ({
          name: i.name,
          type: i.type,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          total: i.total,
        })),
        subtotal,
        taxRate: ivaRate,
        taxAmount: ivaAmount,
        total,
      }),
    })
      .then(res => res.blob())
      .then(blob => {
        const url = URL.createObjectURL(blob);
        window.open(url, "_blank");
      })
      .catch(() => toast.error("Erro ao gerar PDF."));
  }

  async function handleSave() {
    if (items.length === 0) { toast.error("Adicione pelo menos um item."); return; }

    let finalClientId = clientId;

    if (clientMode === "new" && newClient.name.trim()) {
      const res = await fetch("/api/clientes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newClient),
      });
      const created = await res.json();
      finalClientId = created.id;
    } else if (clientMode === "existing" && !finalClientId) {
      toast.error("Selecione um cliente.");
      return;
    }

    setSaving(true);
    const res = await fetch("/api/orcamentos/novo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clientId: finalClientId,
        location: eventLocation,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        items: items.map(i => ({
          type: i.type,
          referenceId: i.id,
          description: i.name,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          taxRate: ivaRate,
          total: i.total,
        })),
        subtotal,
        taxRate: ivaRate,
        taxAmount: ivaAmount,
        total,
      }),
    });

    if (!res.ok) {
      toast.error("Erro ao criar orçamento.");
      setSaving(false);
      return;
    }

    toast.success("Orçamento criado com sucesso!");
    router.push("/orcamentos");
  }

  return (
    <div className="space-y-4 h-[calc(100vh-6rem)] flex flex-col">
      <div className="flex items-center justify-between shrink-0">
        <h1 className="text-2xl font-bold text-foreground">Novo Orçamento</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push("/orcamentos")} className="border-border text-foreground">Cancelar</Button>
          <Button variant="outline" onClick={handleExportPDF} className="border-border text-foreground">
            <FileDown className="h-4 w-4 mr-1" /> Exportar PDF
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "A guardar..." : "Guardar Orçamento"}
          </Button>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-12 gap-4 min-h-0">
        {/* LEFT PANEL - Equipamentos & Serviços */}
        <div className="col-span-5 flex flex-col min-h-0">
          <Card className="flex-1 flex flex-col border-border bg-card min-h-0">
            <CardHeader className="shrink-0 pb-3">
              <div className="flex items-center gap-2 mb-3">
                <Button
                  variant={activeTab === "EQUIPAMENTO" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setActiveTab("EQUIPAMENTO")}
                >
                  <Package className="h-4 w-4 mr-1" /> Equipamentos
                </Button>
                <Button
                  variant={activeTab === "SERVICO" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setActiveTab("SERVICO")}
                >
                  <ClipboardList className="h-4 w-4 mr-1" /> Serviços
                </Button>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Pesquisar..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 bg-background border-border"
                />
              </div>
              {activeTab === "EQUIPAMENTO" && (
                <div className="flex gap-1 mt-2 flex-wrap">
                  {categories.map(cat => (
                    <Badge
                      key={cat}
                      variant={filterCategory === cat ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => setFilterCategory(cat)}
                    >
                      {cat}
                    </Badge>
                  ))}
                </div>
              )}
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto min-h-0 p-3">
              {activeTab === "EQUIPAMENTO" ? (
                filteredEquipment.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8 text-sm">Nenhum equipamento encontrado.</p>
                ) : (
                  <div className="space-y-1">
                    {filteredEquipment.map(eq => (
                      <div
                        key={eq.id}
                        onClick={() => addItem("EQUIPAMENTO", eq)}
                        className="flex items-center justify-between p-2.5 rounded-lg hover:bg-accent/30 cursor-pointer transition-colors border border-transparent hover:border-border"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{eq.name}</p>
                          <p className="text-xs text-muted-foreground">{eq.sku} {eq.category?.name && `· ${eq.category.name}`}</p>
                        </div>
                        <div className="flex items-center gap-3 shrink-0 ml-3">
                          <p className="text-sm font-semibold text-primary">
                            {new Intl.NumberFormat("pt-PT", { style: "currency", currency: "EUR" }).format(eq.rentalPriceDaily || 0)}
                          </p>
                          <Plus className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </div>
                    ))}
                  </div>
                )
              ) : (
                filteredServices.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8 text-sm">Nenhum serviço encontrado.</p>
                ) : (
                  <div className="space-y-1">
                    {filteredServices.map(sv => (
                      <div
                        key={sv.id}
                        onClick={() => addItem("SERVICO", sv)}
                        className="flex items-center justify-between p-2.5 rounded-lg hover:bg-accent/30 cursor-pointer transition-colors border border-transparent hover:border-border"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{sv.name}</p>
                          <p className="text-xs text-muted-foreground">{sv.category} · {sv.unit}</p>
                        </div>
                        <div className="flex items-center gap-3 shrink-0 ml-3">
                          <p className="text-sm font-semibold text-primary">
                            {new Intl.NumberFormat("pt-PT", { style: "currency", currency: "EUR" }).format(sv.defaultPrice || 0)}
                          </p>
                          <Plus className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </div>
                    ))}
                  </div>
                )
              )}
            </CardContent>
          </Card>
        </div>

        {/* RIGHT PANEL */}
        <div className="col-span-7 flex flex-col gap-4 min-h-0">
          {/* TOP - Client info & Event details */}
          <Card className="border-border bg-card shrink-0">
            <CardContent className="p-4">
              <div className="grid grid-cols-2 gap-4">
                {/* Cliente */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-semibold text-foreground">Cliente</span>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant={clientMode === "existing" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setClientMode("existing")}
                      className="text-xs h-7"
                    >
                      Existente
                    </Button>
                    <Button
                      variant={clientMode === "new" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setClientMode("new")}
                      className="text-xs h-7"
                    >
                      Novo
                    </Button>
                  </div>
                  {clientMode === "existing" ? (
                    <Select value={clientId} onValueChange={(v) => v && setClientId(v)}>
                      <SelectTrigger className="bg-background border-border text-sm">
                        <SelectValue placeholder="Selecionar cliente..." />
                      </SelectTrigger>
                      <SelectContent>
                        {clients.map(c => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.companyName ? `${c.name} (${c.companyName})` : c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="space-y-1.5">
                      <Input placeholder="Nome *" className="bg-background border-border h-8 text-sm" value={newClient.name} onChange={e => setNewClient({...newClient, name: e.target.value})} />
                      <Input placeholder="Empresa" className="bg-background border-border h-8 text-sm" value={newClient.companyName} onChange={e => setNewClient({...newClient, companyName: e.target.value})} />
                    </div>
                  )}
                </div>

                {/* Evento */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-semibold text-foreground">Local do Evento</span>
                  </div>
                  <Input
                    placeholder="Local do evento"
                    value={eventLocation}
                    onChange={(e) => setEventLocation(e.target.value)}
                    className="bg-background border-border"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" /> Início
                      </div>
                      <Input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="bg-background border-border h-9 text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" /> Fim
                      </div>
                      <Input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="bg-background border-border h-9 text-sm"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* MIDDLE - Items list */}
          <Card className="flex-1 border-border bg-card flex flex-col min-h-0">
            <CardHeader className="shrink-0 py-3">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <CardTitle className="text-sm text-card-foreground">Itens do Orçamento ({items.length})</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto min-h-0 p-0">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground py-12">
                  <Package className="h-10 w-10 mb-2 opacity-30" />
                  <p className="text-sm">Selecione equipamentos ou serviços no painel esquerdo</p>
                </div>
              ) : (
                <div className="p-3 space-y-4">
                  {Object.entries(groupedItems).map(([group, groupItems]) => (
                    <div key={group}>
                      <div className="flex items-center gap-2 mb-2 px-1">
                        <Badge variant="outline" className="text-xs">{group}</Badge>
                        <span className="text-xs text-muted-foreground">{groupItems.length} itens</span>
                      </div>
                      <div className="space-y-1">
                        {groupItems.map((item, idx) => {
                          const globalIdx = items.indexOf(item);
                          return (
                            <div key={`${item.id}-${idx}`} className="flex items-center gap-3 p-2 rounded-lg bg-background/50">
                              <div className="flex items-center gap-1">
                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => updateQty(globalIdx, -1)}>
                                  <Minus className="h-3 w-3" />
                                </Button>
                                <span className="text-sm font-medium text-foreground w-6 text-center">{item.quantity}</span>
                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => updateQty(globalIdx, 1)}>
                                  <Plus className="h-3 w-3" />
                                </Button>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm text-foreground truncate">{item.name}</p>
                                {item.sku && <p className="text-xs text-muted-foreground">{item.sku}</p>}
                              </div>
                              <Input
                                type="number"
                                value={item.unitPrice}
                                onChange={(e) => updatePrice(globalIdx, Number(e.target.value))}
                                className="w-20 h-8 text-sm bg-background border-border text-right"
                                min={0}
                                step={0.01}
                              />
                              <span className="text-sm font-semibold text-foreground w-24 text-right">
                                {new Intl.NumberFormat("pt-PT", { style: "currency", currency: "EUR" }).format(item.total)}
                              </span>
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-red-400" onClick={() => removeItem(globalIdx)}>
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* BOTTOM - Totals */}
          <Card className="border-border bg-card shrink-0">
            <CardContent className="p-4">
              <div className="flex items-center justify-end gap-8">
                <div className="space-y-1 text-right">
                  <div className="flex items-center justify-end gap-4 text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="text-foreground font-medium w-28 text-right">
                      {new Intl.NumberFormat("pt-PT", { style: "currency", currency: "EUR" }).format(subtotal)}
                    </span>
                  </div>
                  <div className="flex items-center justify-end gap-4 text-sm">
                    <span className="text-muted-foreground">IVA (23%)</span>
                    <span className="text-foreground font-medium w-28 text-right">
                      {new Intl.NumberFormat("pt-PT", { style: "currency", currency: "EUR" }).format(ivaAmount)}
                    </span>
                  </div>
                  <Separator className="my-2 bg-border" />
                  <div className="flex items-center justify-end gap-4">
                    <span className="text-base font-bold text-foreground">Total</span>
                    <span className="text-lg font-bold text-primary w-28 text-right">
                      {new Intl.NumberFormat("pt-PT", { style: "currency", currency: "EUR" }).format(total)}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
