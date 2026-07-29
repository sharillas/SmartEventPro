"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { ArrowLeft, FileDown, Building2, Tag, Calendar, FileText } from "lucide-react";

const statusBadge: Record<string, string> = {
  PENDENTE: "border-yellow-500 text-yellow-400",
  APROVADO: "border-blue-500 text-blue-400",
  ENCOMENDADO: "border-purple-500 text-purple-400",
  RECEBIDO: "border-green-500 text-green-400",
  CANCELADO: "border-red-500 text-red-400",
};
const statusLabel: Record<string, string> = {
  PENDENTE: "Pendente", APROVADO: "Aprovado", ENCOMENDADO: "Encomendado", RECEBIDO: "Recebido", CANCELADO: "Cancelado",
};
const f = (v: number) => new Intl.NumberFormat("pt-PT", { style: "currency", currency: "EUR" }).format(v);
const fd = (v: string) => v ? new Date(v).toLocaleDateString("pt-PT") : "—";

export default function NotaEncomendaDetalhePage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [note, setNote] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");

  useEffect(() => {
    fetch(`/api/notas-encomenda/${id}`).then(r => r.json()).then(data => { setNote(data); setStatus(data.status); }).finally(() => setLoading(false));
  }, [id]);

  async function handleUpdateStatus(newStatus: string) {
    const res = await fetch(`/api/notas-encomenda/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    if (res.ok) { setStatus(newStatus); setNote({ ...note, status: newStatus }); toast.success("Estado atualizado."); }
    else toast.error("Erro.");
  }

  if (loading) return <div className="flex items-center justify-center min-h-screen"><p className="text-muted-foreground">A carregar...</p></div>;
  if (!note) return <div className="flex items-center justify-center min-h-screen"><p className="text-muted-foreground">Nota não encontrada.</p></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <Button variant="ghost" size="sm" onClick={() => router.push("/notas-encomenda")} className="mb-1"><ArrowLeft className="h-4 w-4 mr-1" /> Voltar</Button>
          <h1 className="text-2xl font-bold text-foreground">{note.number}</h1>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className={`bg-transparent border text-xs ${statusBadge[status] || ""}`}>{statusLabel[status] || status}</Badge>
          <Select value={status} onValueChange={(v) => v && handleUpdateStatus(v)}>
            <SelectTrigger className="w-[140px] bg-background border-border h-8 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="PENDENTE">Pendente</SelectItem>
              <SelectItem value="APROVADO">Aprovado</SelectItem>
              <SelectItem value="ENCOMENDADO">Encomendado</SelectItem>
              <SelectItem value="RECEBIDO">Recebido</SelectItem>
              <SelectItem value="CANCELADO">Cancelado</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" className="border-border" onClick={() => window.open(`/api/pdf/nota-encomenda/${id}`, "_blank")}><FileDown className="h-4 w-4 mr-1" /> PDF</Button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3">
        <Card className="border-border bg-card"><CardContent className="p-3 flex items-center gap-2"><Building2 className="h-6 w-6 text-muted-foreground" /><div><p className="text-[10px] text-muted-foreground">Fornecedor</p><p className="text-sm font-semibold text-foreground">{note.supplier?.name || "—"}</p></div></CardContent></Card>
        <Card className="border-border bg-card"><CardContent className="p-3 flex items-center gap-2"><Tag className="h-6 w-6 text-muted-foreground" /><div><p className="text-[10px] text-muted-foreground">Departamento</p><p className="text-sm font-semibold text-foreground">{note.department || "—"}</p></div></CardContent></Card>
        <Card className="border-border bg-card"><CardContent className="p-3 flex items-center gap-2"><Calendar className="h-6 w-6 text-muted-foreground" /><div><p className="text-[10px] text-muted-foreground">Data</p><p className="text-sm font-semibold text-foreground">{fd(note.date)}</p></div></CardContent></Card>
        <Card className="border-border bg-card"><CardContent className="p-3 flex items-center gap-2"><FileText className="h-6 w-6 text-muted-foreground" /><div><p className="text-[10px] text-muted-foreground">Total</p><p className="text-sm font-bold text-primary">{f(note.total)}</p></div></CardContent></Card>
      </div>

      {note.projectCode && (
        <p className="text-xs text-muted-foreground">Código Projeto: <span className="text-foreground font-mono">{note.projectCode}</span></p>
      )}
      {note.fixedAsset && <Badge variant="outline" className="bg-transparent border border-blue-500/50 text-blue-400 text-xs">Imobilizado</Badge>}

      <Card className="border-border bg-card">
        <div className="overflow-x-auto"><div className="min-w-[700px]">
          <CardContent className="p-3">
            <p className="text-sm font-semibold text-foreground mb-2">Itens</p>
            {!note.items || note.items.length === 0 ? <p className="text-muted-foreground text-xs text-center py-4">Nenhum item.</p> : (
              <table className="w-full text-xs">
                <thead><tr className="border-b border-border text-muted-foreground"><th className="text-left p-1 font-medium">Descrição</th><th className="text-center p-1 font-medium w-16">Qt</th><th className="text-right p-1 font-medium w-20">Preço Un.</th><th className="text-right p-1 font-medium w-16">IVA%</th><th className="text-right p-1 font-medium w-20">IVA</th><th className="text-right p-1 font-medium w-20">Total</th></tr></thead>
                <tbody>{note.items.map((item: any, i: number) => (
                  <tr key={i} className="border-b border-border/50">
                    <td className="p-1 text-foreground">{item.description}</td>
                    <td className="p-1 text-center text-foreground">{item.quantity}</td>
                    <td className="p-1 text-right text-foreground">{f(item.unitPrice)}</td>
                    <td className="p-1 text-right text-foreground">{item.taxRate}%</td>
                    <td className="p-1 text-right text-foreground">{f(item.taxAmount)}</td>
                    <td className="p-1 text-right font-semibold text-foreground">{f(item.total)}</td>
                  </tr>
                ))}</tbody>
              </table>
            )}
            <Separator className="my-3 bg-border" />
            <div className="flex justify-end"><div className="space-y-1 text-right w-56">
              <div className="flex justify-between text-xs"><span className="text-muted-foreground">Subtotal</span><span className="text-foreground">{f(note.subtotal)}</span></div>
              <div className="flex justify-between text-xs"><span className="text-muted-foreground">IVA Total</span><span className="text-foreground">{f(note.taxAmount)}</span></div>
              <Separator className="my-1 bg-border" />
              <div className="flex justify-between font-bold text-sm"><span className="text-foreground">Total</span><span className="text-primary">{f(note.total)}</span></div>
            </div></div>
          </CardContent>
        </div></div>
      </Card>
    </div>
  );
}
