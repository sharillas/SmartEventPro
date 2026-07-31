"use client";

import { useEffect, useMemo, useState } from "react";
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
import { Plus, Briefcase, Trash2 } from "lucide-react";
import { Pagination } from "@/components/ui/pagination";
import { formatDate } from "@/lib/helpers";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { toast } from "sonner";

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

interface Filters {
  name: string;
  number: string;
  client: string;
  status: string;
}
const initialFilters: Filters = { name: "", number: "", client: "", status: "" };

export default function ProjetosPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState<Filters>(initialFilters);

  function fetchData() {
    setLoading(true);
    fetch(`/api/projetos?page=${page}&limit=10`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch");
        return res.json();
      })
      .then((result) => {
        setProjects(result.data);
        setTotalPages(result.totalPages);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }

  useEffect(() => { fetchData(); }, [page]);

  async function handleDelete() {
    if (!deleteId) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/projetos/${deleteId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
      toast.success("Eliminado com sucesso.");
      fetchData();
    } catch {
      toast.error("Erro ao eliminar.");
    } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  }

  function setFilter(key: keyof Filters, value: string) { setFilters(prev => ({ ...prev, [key]: value })); }
  function clearFilters() { setFilters(initialFilters); }
  const hasAnyFilter = Object.values(filters).some(v => v !== "");

  const { matched, rest } = useMemo(() => {
    const lf = {
      name: filters.name.toLowerCase(),
      number: filters.number.toLowerCase(),
      client: filters.client.toLowerCase(),
      status: filters.status,
    };
    if (!hasAnyFilter) return { matched: projects, rest: [] };
    const m: Project[] = []; const r: Project[] = [];
    for (const p of projects) {
      let ok = true;
      if (lf.name && !(p.name || "").toLowerCase().includes(lf.name)) ok = false;
      if (lf.number && !(p.number || "").toLowerCase().includes(lf.number)) ok = false;
      if (lf.client && !(p.clientName || "").toLowerCase().includes(lf.client)) ok = false;
      if (lf.status && p.status !== lf.status) ok = false;
      if (ok) m.push({ ...p, _match: true } as any); else r.push(p);
    }
    return { matched: m, rest: r };
  }, [projects, filters, hasAnyFilter]);

  const displayed = [...matched, ...rest];

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
        <h1 className="text-2xl font-bold tracking-tight">Eventos</h1>
        <Button onClick={() => router.push("/projetos/novo")}>
          <Plus className="mr-1 h-4 w-4" />
          Novo Evento
        </Button>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap items-end justify-center gap-2 p-3 bg-card border border-border rounded-lg">
        <div className="flex flex-col gap-0.5">
          <span className="text-xs text-muted-foreground">Nome</span>
          <input placeholder="Nome" value={filters.name} onChange={e => setFilter("name", e.target.value)} className="w-[150px] h-8 text-sm bg-background border border-border rounded px-2 text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-primary/50" />
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-xs text-muted-foreground">N.º Evento</span>
          <input placeholder="N.º" value={filters.number} onChange={e => setFilter("number", e.target.value)} className="w-[120px] h-8 text-sm bg-background border border-border rounded px-2 text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-primary/50" />
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-xs text-muted-foreground">Cliente</span>
          <input placeholder="Cliente" value={filters.client} onChange={e => setFilter("client", e.target.value)} className="w-[150px] h-8 text-sm bg-background border border-border rounded px-2 text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-primary/50" />
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-xs text-muted-foreground">Estado</span>
          <input placeholder="Estado" value={filters.status} onChange={e => setFilter("status", e.target.value)} className="w-[110px] h-8 text-sm bg-background border border-border rounded px-2 text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-primary/50" />
        </div>
        {hasAnyFilter && (
          <button onClick={clearFilters} className="h-8 px-3 text-sm text-muted-foreground hover:text-foreground border border-border rounded hover:bg-accent/50 transition-colors mb-0.5">
            Limpar
          </button>
        )}
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <div className="min-w-[900px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="whitespace-nowrap text-sm">N.º</TableHead>
                    <TableHead className="whitespace-nowrap text-sm">Nome</TableHead>
                    <TableHead className="whitespace-nowrap text-sm">Cliente</TableHead>
                    <TableHead className="whitespace-nowrap text-sm">Início</TableHead>
                    <TableHead className="whitespace-nowrap text-sm">Fim</TableHead>
                    <TableHead className="whitespace-nowrap text-sm">Estado</TableHead>
                    <TableHead className="whitespace-nowrap text-sm p-1.5">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayed.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground text-sm whitespace-nowrap">
                        Nenhum registo encontrado.
                      </TableCell>
                    </TableRow>
                  ) : (
                    displayed.map((project: any) => {
                      const isMatch = project._match || !hasAnyFilter;
                      return (
                      <TableRow key={project.id} className={isMatch && hasAnyFilter ? "bg-primary/5 border-l-2 border-l-primary" : (!isMatch && hasAnyFilter ? "opacity-40" : "")}>
                        <TableCell className="font-medium whitespace-nowrap text-sm">{project.number}</TableCell>
                        <TableCell className="whitespace-nowrap text-sm">{project.name}</TableCell>
                        <TableCell className="whitespace-nowrap text-sm">{project.clientName}</TableCell>
                        <TableCell className="whitespace-nowrap text-sm">{project.startDate ? formatDate(project.startDate) : "-"}</TableCell>
                        <TableCell className="whitespace-nowrap text-sm">{project.endDate ? formatDate(project.endDate) : "-"}</TableCell>
                        <TableCell className="whitespace-nowrap text-sm">
                          <Badge variant="secondary" className={statusBadge[project.status] ?? ""}>
                            {statusLabel[project.status] ?? project.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-sm p-1.5">
                          <Button variant="ghost" size="icon-xs" onClick={() => setDeleteId(project.id)} className="h-7 w-7">
                            <Trash2 className="h-3 w-3 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>

      <Pagination page={page} totalPages={totalPages} onPageChange={(p) => setPage(p)} />

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => { if (!open) setDeleteId(null); }}
        title="Confirmar Eliminação"
        description="Tem a certeza que deseja eliminar este registo? Esta ação não pode ser desfeita."
        onConfirm={handleDelete}
        loading={deleting}
      />
    </div>
  );
}
