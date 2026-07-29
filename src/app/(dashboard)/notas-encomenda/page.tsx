"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, FileText } from "lucide-react";

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

function f(value: number) {
  return new Intl.NumberFormat("pt-PT", { style: "currency", currency: "EUR" }).format(value);
}

function fd(value: string) {
  return value ? new Date(value).toLocaleDateString("pt-PT") : "—";
}

export default function NotasEncomendaPage() {
  const router = useRouter();
  const [notes, setNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/notas-encomenda")
      .then((r) => r.json())
      .then(setNotes)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Notas de Encomenda</h1>
        <Button onClick={() => router.push("/notas-encomenda/novo")} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Nova Nota de Encomenda
        </Button>
      </div>
      <Card className="border-border bg-card">
        <div className="overflow-x-auto">
          <div className="min-w-[800px]">
            {loading ? (
              <p className="text-muted-foreground text-center py-12">A carregar...</p>
            ) : notes.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-40" />
                <p className="text-muted-foreground">Nenhuma nota de encomenda.</p>
              </div>
            ) : (
              <Table className="w-full">
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="p-1.5 whitespace-nowrap text-[11px] text-muted-foreground">N.º</TableHead>
                    <TableHead className="p-1.5 whitespace-nowrap text-[11px] text-muted-foreground">Fornecedor</TableHead>
                    <TableHead className="p-1.5 whitespace-nowrap text-[11px] text-muted-foreground">Departamento</TableHead>
                    <TableHead className="p-1.5 whitespace-nowrap text-[11px] text-muted-foreground">Data</TableHead>
                    <TableHead className="p-1.5 whitespace-nowrap text-[11px] text-muted-foreground">Estado</TableHead>
                    <TableHead className="p-1.5 whitespace-nowrap text-right text-[11px] text-muted-foreground">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {notes.map((n) => (
                    <TableRow
                      key={n.id}
                      className="border-border hover:bg-accent/20 cursor-pointer"
                      onClick={() => router.push(`/notas-encomenda/${n.number}`)}
                    >
                      <TableCell className="font-medium text-foreground text-xs p-1.5 whitespace-nowrap">{n.number}</TableCell>
                      <TableCell className="text-foreground text-xs p-1.5 whitespace-nowrap">{n.supplier?.name || "—"}</TableCell>
                      <TableCell className="text-foreground text-xs p-1.5 whitespace-nowrap">
                        {n.department ? (DEPARTMENT_LABELS[n.department] || n.department) : "—"}
                      </TableCell>
                      <TableCell className="text-foreground text-xs p-1.5 whitespace-nowrap">{fd(n.date)}</TableCell>
                      <TableCell className="p-1.5 whitespace-nowrap">
                        <Badge
                          variant="outline"
                          className={`bg-transparent border text-[10px] px-1 py-0 ${statusBadge[n.status] || ""}`}
                        >
                          {statusLabel[n.status] || n.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-semibold text-primary text-xs p-1.5 whitespace-nowrap">
                        {f(n.total)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
