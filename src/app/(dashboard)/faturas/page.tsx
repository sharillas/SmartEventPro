"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate } from "@/lib/helpers";

interface Invoice {
  id: string;
  number: string;
  clientName: string;
  date: string;
  dueDate: string;
  subtotal: number;
  tax: number;
  total: number;
  status: string;
}

const statusBadge: Record<string, string> = {
  PENDENTE: "bg-yellow-100 text-yellow-800",
  PAGO: "bg-green-100 text-green-800",
  VENCIDO: "bg-red-100 text-red-800",
  CANCELADO: "bg-red-100 text-red-800",
};

const statusLabel: Record<string, string> = {
  PENDENTE: "Pendente",
  PAGO: "Pago",
  VENCIDO: "Vencido",
  CANCELADO: "Cancelado",
};

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-PT", {
    style: "currency",
    currency: "EUR",
  }).format(value);
}

export default function FaturasPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch("/api/faturas")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch");
        return res.json();
      })
      .then((data) => setInvoices(data))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

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
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Faturas</h1>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <div className="min-w-[900px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="whitespace-nowrap text-xs">N.º</TableHead>
                    <TableHead className="whitespace-nowrap text-xs">Cliente</TableHead>
                    <TableHead className="whitespace-nowrap text-xs">Data</TableHead>
                    <TableHead className="whitespace-nowrap text-xs">Vencimento</TableHead>
                    <TableHead className="whitespace-nowrap text-xs">Subtotal</TableHead>
                    <TableHead className="whitespace-nowrap text-xs">IVA</TableHead>
                    <TableHead className="whitespace-nowrap text-xs">Total</TableHead>
                    <TableHead className="whitespace-nowrap text-xs">Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-muted-foreground text-xs whitespace-nowrap">
                        Nenhum registo encontrado.
                      </TableCell>
                    </TableRow>
                  ) : (
                    invoices.map((inv) => (
                      <TableRow key={inv.id}>
                        <TableCell className="font-medium whitespace-nowrap text-xs">{inv.number}</TableCell>
                        <TableCell className="whitespace-nowrap text-xs">{inv.clientName}</TableCell>
                        <TableCell className="whitespace-nowrap text-xs">{inv.date ? formatDate(inv.date) : "-"}</TableCell>
                        <TableCell className="whitespace-nowrap text-xs">{inv.dueDate ? formatDate(inv.dueDate) : "-"}</TableCell>
                        <TableCell className="whitespace-nowrap text-xs">{formatCurrency(inv.subtotal)}</TableCell>
                        <TableCell className="whitespace-nowrap text-xs">{formatCurrency(inv.tax)}</TableCell>
                        <TableCell className="whitespace-nowrap text-xs">{formatCurrency(inv.total)}</TableCell>
                        <TableCell className="whitespace-nowrap text-xs">
                          <Badge variant="secondary" className={statusBadge[inv.status] ?? ""}>
                            {statusLabel[inv.status] ?? inv.status}
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
    </div>
  );
}
