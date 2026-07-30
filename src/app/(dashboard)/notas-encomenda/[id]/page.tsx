"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { ArrowLeft, Truck, Building2, Calendar, FileText } from "lucide-react";

const statusBadge: Record<string, string> = {
  PENDENTE: "border-yellow-500 text-yellow-400",
  APROVADO: "border-blue-500 text-blue-400",
  ENCOMENDADO: "border-purple-500 text-purple-400",
  RECEBIDO: "border-green-500 text-green-400",
  CANCELADO: "border-red-500 text-red-400",
};
const statusLabel: Record<string, string> = {
  PENDENTE: "Pendente",
  APROVADO: "Aprovado",
  ENCOMENDADO: "Encomendado",
  RECEBIDO: "Recebido",
  CANCELADO: "Cancelado",
};

const DEPARTMENT_LABELS: Record<string, string> = {
  AUDIO: "Áudio",
  ILUMINACAO: "Iluminação",
  VIDEO: "Vídeo",
  ESTRUTURAS: "Estruturas",
  MOBILIARIO: "Mobiliário",
  ADMINISTRACAO: "Administração",
  RECURSOS_HUMANOS: "Recursos Humanos",
  COMERCIAL: "Comercial",
  TRANSPORTES: "Transportes",
};

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-PT", { style: "currency", currency: "EUR" }).format(value);
}
function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("pt-PT");
}

export default function NotaEncomendaDetailPage() {
  const params = useParams();
  const router = useRouter();
  const number = params.id as string;

  const [note, setNote] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!number) return;
    fetch(`/api/notas-encomenda/${number}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          setNote(null);
        } else {
          setNote(data);
        }
      })
      .finally(() => setLoading(false));
  }, [number]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">Dashboard</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/notas-encomenda">Notas de Encomenda</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>A carregar...</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <p className="text-muted-foreground text-center py-12">A carregar...</p>
      </div>
    );
  }

  if (!note) {
    return (
      <div className="space-y-4">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">Dashboard</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/notas-encomenda">Notas de Encomenda</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{number}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <p className="text-muted-foreground text-center py-12">Nota de encomenda não encontrada.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">Dashboard</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/notas-encomenda">Notas de Encomenda</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{note.number}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold text-foreground">Nota de Encomenda {note.number}</h1>
        <Badge variant="outline" className={`bg-transparent border text-xs px-2 py-0.5 ${statusBadge[note.status] || ""}`}>
          {statusLabel[note.status] || note.status}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="border-border bg-card lg:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-card-foreground">Detalhes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2">
              <Truck className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Fornecedor</p>
                <p className="text-sm font-medium text-foreground">
                  {note.supplier?.companyName ? `${note.supplier.name} (${note.supplier.companyName})` : note.supplier?.name || "—"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Departamento</p>
                <p className="text-sm font-medium text-foreground">
                  {note.department ? (DEPARTMENT_LABELS[note.department] || note.department) : "—"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Data</p>
                <p className="text-sm font-medium text-foreground">{formatDate(note.date)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card lg:col-span-2">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-sm text-card-foreground">Itens</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {note.items && note.items.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="p-1.5 text-sm text-muted-foreground">Descrição</TableHead>
                    <TableHead className="p-1.5 text-sm text-muted-foreground text-right">Qtd.</TableHead>
                    <TableHead className="p-1.5 text-sm text-muted-foreground text-right">Preço Un.</TableHead>
                    <TableHead className="p-1.5 text-sm text-muted-foreground text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {note.items.map((item: any, idx: number) => (
                    <TableRow key={idx} className="border-border">
                      <TableCell className="p-1.5 text-sm text-foreground">{item.description}</TableCell>
                      <TableCell className="p-1.5 text-sm text-foreground text-right">{item.quantity}</TableCell>
                      <TableCell className="p-1.5 text-sm text-foreground text-right">{formatCurrency(item.unitPrice)}</TableCell>
                      <TableCell className="p-1.5 text-sm text-foreground text-right font-semibold">{formatCurrency(item.total)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-muted-foreground text-sm text-center py-6">Nenhum item.</p>
            )}

            <Separator className="my-4 bg-border" />

            <div className="flex items-center justify-end gap-4">
              <span className="text-base font-bold text-foreground">Total</span>
              <span className="text-lg font-bold text-primary w-28 text-right">{formatCurrency(note.total || 0)}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
