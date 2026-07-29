"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
import { Plus, Briefcase } from "lucide-react";
import { formatDate } from "@/lib/helpers";

interface Project {
  id: string;
  number: string;
  name: string;
  clientName: string;
  startDate: string;
  endDate: string;
  status: string;
}

const statusBadge: Record<string, string> = {
  RASCUNHO: "bg-gray-100 text-gray-800",
  ORCAMENTADO: "bg-blue-100 text-blue-800",
  CONFIRMADO: "bg-green-100 text-green-800",
  EM_CURSO: "bg-indigo-100 text-indigo-800",
  CONCLUIDO: "bg-green-100 text-green-800",
  CANCELADO: "bg-red-100 text-red-800",
};

const statusLabel: Record<string, string> = {
  RASCUNHO: "Rascunho",
  ORCAMENTADO: "Orçamentado",
  CONFIRMADO: "Confirmado",
  EM_CURSO: "Em Curso",
  CONCLUIDO: "Concluído",
  CANCELADO: "Cancelado",
};

export default function ProjetosPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch("/api/projetos")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch");
        return res.json();
      })
      .then((data) => setProjects(data))
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
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Projetos</h1>
        <Button onClick={() => router.push("/projetos/novo")}>
          <Plus className="mr-1 h-4 w-4" />
          Novo Projeto
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <div className="min-w-[900px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="whitespace-nowrap text-xs">N.º</TableHead>
                    <TableHead className="whitespace-nowrap text-xs">Nome</TableHead>
                    <TableHead className="whitespace-nowrap text-xs">Cliente</TableHead>
                    <TableHead className="whitespace-nowrap text-xs">Início</TableHead>
                    <TableHead className="whitespace-nowrap text-xs">Fim</TableHead>
                    <TableHead className="whitespace-nowrap text-xs">Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {projects.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground text-xs whitespace-nowrap">
                        Nenhum registo encontrado.
                      </TableCell>
                    </TableRow>
                  ) : (
                    projects.map((project) => (
                      <TableRow key={project.id}>
                        <TableCell className="font-medium whitespace-nowrap text-xs">{project.number}</TableCell>
                        <TableCell className="whitespace-nowrap text-xs">{project.name}</TableCell>
                        <TableCell className="whitespace-nowrap text-xs">{project.clientName}</TableCell>
                        <TableCell className="whitespace-nowrap text-xs">{project.startDate ? formatDate(project.startDate) : "-"}</TableCell>
                        <TableCell className="whitespace-nowrap text-xs">{project.endDate ? formatDate(project.endDate) : "-"}</TableCell>
                        <TableCell className="whitespace-nowrap text-xs">
                          <Badge variant="secondary" className={statusBadge[project.status] ?? ""}>
                            {statusLabel[project.status] ?? project.status}
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
