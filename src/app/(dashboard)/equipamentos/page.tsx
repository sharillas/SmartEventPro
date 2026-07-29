"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Package } from "lucide-react";
import { useRouter } from "next/navigation";
import { formatCurrency } from "@/lib/helpers";

interface Equipment {
  id: string;
  name: string;
  sku: string;
  categoryName: string;
  brand: string;
  quantity: number;
  pricePerDay: number;
  status: string;
}

const statusBadge: Record<string, string> = {
  DISPONIVEL: "bg-green-100 text-green-800",
  ALUGADO: "bg-blue-100 text-blue-800",
  EM_REPARACAO: "bg-yellow-100 text-yellow-800",
  ABATIDO: "bg-red-100 text-red-800",
  EXTRAVIADO: "bg-red-100 text-red-800",
};

const statusLabel: Record<string, string> = {
  DISPONIVEL: "Disponível",
  ALUGADO: "Alugado",
  EM_REPARACAO: "Em Reparação",
  ABATIDO: "Abatido",
  EXTRAVIADO: "Extraviado",
};

export default function EquipamentosPage() {
  const router = useRouter();
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/equipamentos");
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        setEquipment(data);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
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
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Equipamentos</h1>
        <Button onClick={() => router.push("/equipamentos/novo")}>
          <Plus className="mr-1 h-4 w-4" />
          Novo Equipamento
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <div className="min-w-[900px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="whitespace-nowrap text-xs">Nome</TableHead>
                    <TableHead className="whitespace-nowrap text-xs">SKU</TableHead>
                    <TableHead className="whitespace-nowrap text-xs">Categoria</TableHead>
                    <TableHead className="whitespace-nowrap text-xs">Marca</TableHead>
                    <TableHead className="whitespace-nowrap text-xs">Quantidade</TableHead>
                    <TableHead className="whitespace-nowrap text-xs">Preço/Dia</TableHead>
                    <TableHead className="whitespace-nowrap text-xs">Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {equipment.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground text-xs whitespace-nowrap">
                        Nenhum registo encontrado.
                      </TableCell>
                    </TableRow>
                  ) : (
                    equipment.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium whitespace-nowrap text-xs">{item.name}</TableCell>
                        <TableCell className="whitespace-nowrap text-xs">{item.sku}</TableCell>
                        <TableCell className="whitespace-nowrap text-xs">{item.categoryName}</TableCell>
                        <TableCell className="whitespace-nowrap text-xs">{item.brand}</TableCell>
                        <TableCell className="whitespace-nowrap text-xs">{item.quantity}</TableCell>
                        <TableCell className="whitespace-nowrap text-xs">{formatCurrency(item.pricePerDay)}</TableCell>
                        <TableCell className="whitespace-nowrap text-xs">
                          <Badge variant="secondary" className={statusBadge[item.status] ?? ""}>
                            {statusLabel[item.status] ?? item.status}
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
