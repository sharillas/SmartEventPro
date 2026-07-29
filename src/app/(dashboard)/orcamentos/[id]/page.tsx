"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { ArrowLeft, FileText, User, Calendar, MapPin, Package, FileDown, Receipt } from "lucide-react";

const statusBadge: Record<string, string> = {
  RASCUNHO: "bg-gray-500/20 text-gray-400",
  ENVIADO: "bg-blue-500/20 text-blue-400",
  ACEITE: "bg-green-500/20 text-green-400",
  RECUSADO: "bg-red-500/20 text-red-400",
  EXPIRADO: "bg-yellow-500/20 text-yellow-400",
};
const statusLabel: Record<string, string> = {
  RASCUNHO: "Rascunho",
  ENVIADO: "Enviado",
  ACEITE: "Aceite",
  RECUSADO: "Recusado",
  EXPIRADO: "Expirado",
};

export default function OrcamentoDetalhePage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [quotation, setQuotation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("");

  useEffect(() => {
    fetch(`/api/orcamentos/${id}`)
      .then(r => r.json())
      .then(data => {
        setQuotation(data);
        setStatus(data.status);
      })
      .finally(() => setLoading(false));
  }, [id]);

  async function handleUpdateStatus(newStatus: string) {
    setSaving(true);
    const res = await fetch(`/api/orcamentos/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    if (res.ok) {
      setStatus(newStatus);
      setQuotation({ ...quotation, status: newStatus });
      toast.success("Estado atualizado.");
    } else {
      toast.error("Erro ao atualizar.");
    }
    setSaving(false);
  }

  async function handleGerarFatura() {
    setSaving(true);
    try {
      const res = await fetch("/api/faturas/gerar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quotationId: quotation.id }),
      });
      if (res.ok) {
        const invoice = await res.json();
        toast.success("Fatura gerada com sucesso.");
        router.push(`/faturas`);
      } else {
        const err = await res.json();
        toast.error(err.error || "Erro ao gerar fatura.");
      }
    } catch {
      toast.error("Erro ao gerar fatura.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-muted-foreground">A carregar...</p>
    </div>
  );

  if (!quotation) return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-muted-foreground">Orçamento não encontrado.</p>
    </div>
  );

  const f = new Intl.NumberFormat("pt-PT", { style: "currency", currency: "EUR" });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Button variant="ghost" size="sm" onClick={() => router.push("/orcamentos")} className="mb-2">
            <ArrowLeft className="h-4 w-4 mr-2" /> Voltar
          </Button>
          <h1 className="text-2xl font-bold text-foreground">{quotation.number}</h1>
        </div>
        <div className="flex items-center gap-3">
          <Badge className={statusBadge[status] || ""}>{statusLabel[status] || status}</Badge>
          <Select value={status} onValueChange={(v) => v && handleUpdateStatus(v)} disabled={saving}>
            <SelectTrigger className="w-[140px] bg-background border-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="RASCUNHO">Rascunho</SelectItem>
              <SelectItem value="ENVIADO">Enviado</SelectItem>
              <SelectItem value="ACEITE">Aceite</SelectItem>
              <SelectItem value="RECUSADO">Recusado</SelectItem>
              <SelectItem value="EXPIRADO">Expirado</SelectItem>
            </SelectContent>
          </Select>
          {(status === "ACEITE" || status === "ENVIADO") && (
            <Button variant="outline" size="sm" className="border-border" onClick={handleGerarFatura} disabled={saving}>
              <Receipt className="h-4 w-4 mr-1" /> Gerar Fatura
            </Button>
          )}
          <Button variant="outline" size="sm" className="border-border" onClick={() => window.open(`/api/pdf/orcamento/${id}`, "_blank")}><FileDown className="h-4 w-4 mr-1" /> PDF</Button>
        </div>
      </div>

      {/* Info */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="border-border bg-card">
          <CardContent className="p-4 flex items-center gap-3">
            <User className="h-8 w-8 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Cliente</p>
              <p className="font-semibold text-foreground">{quotation.client?.name || "—"}</p>
              {quotation.client?.companyName && (
                <p className="text-sm text-muted-foreground">{quotation.client.companyName}</p>
              )}
            </div>
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardContent className="p-4 flex items-center gap-3">
            <Calendar className="h-8 w-8 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Data</p>
              <p className="font-semibold text-foreground">{new Date(quotation.date).toLocaleDateString("pt-PT")}</p>
              {quotation.validUntil && (
                <p className="text-sm text-muted-foreground">Válido até {new Date(quotation.validUntil).toLocaleDateString("pt-PT")}</p>
              )}
            </div>
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardContent className="p-4 flex items-center gap-3">
            <FileText className="h-8 w-8 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Total</p>
              <p className="font-bold text-lg text-primary">{f.format(quotation.total)}</p>
              <p className="text-sm text-muted-foreground">IVA incl. (23%)</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Items */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-card-foreground flex items-center gap-2">
            <Package className="h-5 w-5 text-muted-foreground" /> Itens do Orçamento
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {!quotation.items || quotation.items.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">Nenhum item neste orçamento.</p>
          ) : (
            <div className="overflow-x-auto">
              <div className="min-w-[900px]">
                <div className="space-y-2 p-4">
                  <div className="grid grid-cols-12 gap-4 text-xs text-muted-foreground font-medium pb-2 border-b border-border">
                    <div className="col-span-5">Descrição</div>
                    <div className="col-span-2 text-center">Tipo</div>
                    <div className="col-span-1 text-center">Qt.</div>
                    <div className="col-span-2 text-right">Preço Un.</div>
                    <div className="col-span-2 text-right">Total</div>
                  </div>
                  {quotation.items.map((item: any, i: number) => (
                    <div key={i} className="grid grid-cols-12 gap-4 py-2 border-b border-border/50 text-sm">
                      <div className="col-span-5">
                        <p className="text-foreground font-medium">{item.description}</p>
                      </div>
                      <div className="col-span-2 text-center">
                        <Badge variant="outline" className="text-xs">
                          {item.type === "EQUIPAMENTO" ? "Equipamento" : item.type === "SERVICO" ? "Serviço" : item.type}
                        </Badge>
                      </div>
                      <div className="col-span-1 text-center text-foreground">{item.quantity}</div>
                      <div className="col-span-2 text-right text-foreground">{f.format(item.unitPrice)}</div>
                      <div className="col-span-2 text-right font-semibold text-foreground">{f.format(item.total)}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <Separator className="my-4 bg-border" />
          <div className="flex justify-end">
            <div className="space-y-1 text-right w-64">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="text-foreground">{f.format(quotation.subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">IVA ({quotation.taxRate}%)</span>
                <span className="text-foreground">{f.format(quotation.taxAmount)}</span>
              </div>
              <Separator className="my-2 bg-border" />
              <div className="flex justify-between font-bold text-base">
                <span className="text-foreground">Total</span>
                <span className="text-primary">{f.format(quotation.total)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
