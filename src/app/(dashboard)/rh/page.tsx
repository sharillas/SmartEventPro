"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, UserCircle, Pencil, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { formatDate } from "@/lib/helpers";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Pagination } from "@/components/ui/pagination";

interface Colaborador {
  id: string;
  name: string;
  email: string;
  phone: string;
  nif: string;
  address: string;
  position: string;
  department: string;
  hourlyRate: number;
  dailyRate: number;
  startDate: string;
  active: boolean;
  status: string;
  notes: string;
}

interface EPI {
  id: string;
  employeeId: string;
  epiType: string;
  description: string;
  serialNumber: string | null;
  deliveredAt: string;
  expiryDate: string;
  notes: string | null;
  employee: { name: string };
}

interface Certificacao {
  id: string;
  employeeId: string;
  name: string;
  issuingEntity: string | null;
  issueDate: string;
  expiryDate: string | null;
  documentUrl: string | null;
  notes: string | null;
  employee: { name: string };
}

const cargoLabel: Record<string, string> = {
  TECNICO_VIDEO: "Técnico de Vídeo",
  TECNICO_SOM: "Técnico de Som",
  TECNICO_ILUMINACAO: "Técnico de Iluminação",
  TECNICO_ESTRUTURAS: "Técnico de Estruturas",
  MOTORISTA: "Motorista",
  GESTOR: "Gestor",
  ADMIN: "Administrador",
};

const departamentoLabel: Record<string, string> = {
  VIDEO: "Vídeo",
  SOM: "Som",
  ILUMINACAO: "Iluminação",
  ESTRUTURAS: "Estruturas",
  TRANSPORTES: "Transportes",
  ADMINISTRACAO: "Administração",
};

const statusLabel: Record<string, string> = {
  ATIVO: "Ativo",
  FERIAS: "Férias",
  FOLGA: "Folga",
  BAIXA: "Baixa",
  DESATIVADO: "Desativado",
};
const statusBadgeClass: Record<string, string> = {
  ATIVO: "border-green-500 text-green-400 bg-green-500/10",
  FERIAS: "border-blue-500 text-blue-400 bg-blue-500/10",
  FOLGA: "border-purple-500 text-purple-400 bg-purple-500/10",
  BAIXA: "border-yellow-500 text-yellow-400 bg-yellow-500/10",
  DESATIVADO: "border-red-500 text-red-400 bg-red-500/10",
};

const epiTypeLabel: Record<string, string> = {
  CAPACETE: "Capacete",
  LUVAS: "Luvas",
  BOTAS: "Botas",
  ARNES: "Arnês",
  PROTETOR_AUDITIVO: "Protetor Auditivo",
  COLETE: "Colete",
  OCULOS: "Óculos",
  OUTRO: "Outro",
};

function isExpiringSoon(dateStr: string): boolean {
  if (!dateStr) return false;
  const target = new Date(dateStr);
  const now = new Date();
  const daysDiff = (target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
  return daysDiff <= 30 && daysDiff >= 0;
}

const emptyColaboradorForm = {
  name: "",
  email: "",
  phone: "",
  nif: "",
  address: "",
  position: "",
  department: "",
  hourlyRate: "",
  dailyRate: "",
  startDate: "",
  notes: "",
  status: "ATIVO",
};

const emptyEPIForm = {
  employeeId: "",
  description: "",
  notes: "",
};

const emptyCertificacaoForm = {
  employeeId: "",
  name: "",
  issuingEntity: "",
  issueDate: "",
  expiryDate: "",
  documentUrl: "",
  notes: "",
};

export default function RHPage() {
  const router = useRouter();
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([]);
  const [epis, setEpis] = useState<EPI[]>([]);
  const [certificacoes, setCertificacoes] = useState<Certificacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const [colabDialogOpen, setColabDialogOpen] = useState(false);
  const [colabEditId, setColabEditId] = useState<string | null>(null);
  const [epiDialogOpen, setEpiDialogOpen] = useState(false);
  const [certDialogOpen, setCertDialogOpen] = useState(false);
  const [colabForm, setColabForm] = useState(emptyColaboradorForm);
  const [epiForm, setEpiForm] = useState(emptyEPIForm);
  const [certForm, setCertForm] = useState(emptyCertificacaoForm);
  const [submitting, setSubmitting] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [epiDeleteId, setEpiDeleteId] = useState<string | null>(null);
  const [epiDeleting, setEpiDeleting] = useState(false);
  const [certDeleteId, setCertDeleteId] = useState<string | null>(null);
  const [certDeleting, setCertDeleting] = useState(false);
  const [certEditId, setCertEditId] = useState<string | null>(null);
  const [selectedEPITypes, setSelectedEPITypes] = useState<string[]>([]);
  const [epiItems, setEpiItems] = useState<Record<string, { serialNumber: string; deliveredAt: string; expiryDate: string }>>({});
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [refreshKey, setRefreshKey] = useState(0);
  const [employeesList, setEmployeesList] = useState<{ id: string; name: string }[]>([]);
  const [cargos, setCargos] = useState<{ id: string; name: string }[]>([]);

  interface ColabFilters { name: string; department: string; position: string; status: string; }
  const initialColabFilters: ColabFilters = { name: "", department: "", position: "", status: "" };
  const [colabFilters, setColabFilters] = useState<ColabFilters>(initialColabFilters);
  function setColabFilter(key: keyof ColabFilters, value: string) { setColabFilters(prev => ({ ...prev, [key]: value })); }
  function clearColabFilters() { setColabFilters(initialColabFilters); }
  const hasAnyColabFilter = Object.values(colabFilters).some(v => v !== "");

  const { matched: colabMatched, rest: colabRest } = useMemo(() => {
    const lf = {
      name: colabFilters.name.toLowerCase(),
      department: colabFilters.department.toLowerCase(),
      position: colabFilters.position.toLowerCase(),
      status: colabFilters.status,
    };
    if (!hasAnyColabFilter) return { matched: colaboradores, rest: [] };
    const m: any[] = []; const r: any[] = [];
    for (const c of colaboradores) {
      let ok = true;
      if (lf.name && !(c.name || "").toLowerCase().includes(lf.name)) ok = false;
      if (lf.department && !(departamentoLabel[c.department] || c.department || "").toLowerCase().includes(lf.department)) ok = false;
      const posDisplay = cargos.find(cg => cg.id === c.position)?.name ?? cargoLabel[c.position] ?? c.position ?? "";
      if (lf.position && !posDisplay.toLowerCase().includes(lf.position)) ok = false;
      if (lf.status && c.status !== lf.status) ok = false;
      if (ok) m.push({ ...c, _match: true }); else r.push(c);
    }
    return { matched: m, rest: r };
  }, [colaboradores, colabFilters, hasAnyColabFilter, cargos]);

  const displayedColaboradores = [...colabMatched, ...colabRest];

  useEffect(() => {
    fetch("/api/colaboradores?limit=1000")
      .then((res) => res.json())
      .then((result) => setEmployeesList(result.data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch("/api/funcoes?limit=100")
      .then((res) => res.json())
      .then((result) => setCargos(result.data))
      .catch(() => {});
  }, []);

  const employeeItems = useMemo(
    () => Object.fromEntries(employeesList.map((e) => [e.id, e.name] as const)),
    [employeesList]
  );

  const cargoItems = useMemo(
    () => Object.fromEntries(cargos.map((c) => [c.id, c.name] as const)),
    [cargos]
  );

  useEffect(() => {
    async function fetchData() {
      try {
        const params = new URLSearchParams();
        params.set("page", String(page));
        params.set("limit", "10");
        const [colabRes, epiRes, certRes] = await Promise.all([
          fetch(`/api/colaboradores?${params.toString()}`),
          fetch("/api/epis"),
          fetch("/api/certificacoes"),
        ]);
        if (!colabRes.ok) throw new Error("Failed to fetch");
        const colabResult = await colabRes.json();
        const epiData = epiRes.ok ? await epiRes.json() : { data: [] };
        const certData = certRes.ok ? await certRes.json() : { data: [] };
        setColaboradores(colabResult.data);
        setTotalPages(colabResult.totalPages);
        setEpis(epiData.data);
        setCertificacoes(certData.data);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [page, refreshKey]);

  async function handleDelete() {
    if (!deleteId) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/colaboradores/${deleteId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
      toast.success("Eliminado com sucesso.");
      setColaboradores(prev => prev.filter(item => item.id !== deleteId));
    } catch {
      toast.error("Erro ao eliminar.");
    } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  }

  async function handleColabSubmit() {
    setSubmitting(true);
    try {
      if (colabEditId) {
        const res = await fetch(`/api/colaboradores/${colabEditId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(colabForm),
        });
        if (!res.ok) throw new Error("Failed to update");
        toast.success("Colaborador atualizado com sucesso.");
        const data = await res.json();
        setColaboradores((prev) => prev.map((c) => (c.id === colabEditId ? data : c)));
      } else {
        const res = await fetch("/api/colaboradores", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(colabForm),
        });
        if (!res.ok) throw new Error("Failed to create");
        toast.success("Colaborador criado com sucesso.");
        const data = await res.json();
        setColaboradores((prev) => [...prev, data]);
      }
      setColabDialogOpen(false);
      setColabForm(emptyColaboradorForm);
      setColabEditId(null);
    } catch {
      toast.error(colabEditId ? "Erro ao atualizar colaborador." : "Erro ao criar colaborador.");
    } finally {
      setSubmitting(false);
    }
  }

  function handleColabEdit(colab: Colaborador) {
    setColabEditId(colab.id);
    setColabForm({
      name: colab.name || "",
      email: colab.email || "",
      phone: colab.phone || "",
      nif: colab.nif || "",
      address: colab.address || "",
      position: colab.position || "",
      department: colab.department || "",
      hourlyRate: colab.hourlyRate ? String(colab.hourlyRate) : "",
      dailyRate: colab.dailyRate ? String(colab.dailyRate) : "",
      startDate: colab.startDate ? new Date(colab.startDate).toISOString().split("T")[0] : "",
      notes: colab.notes || "",
      status: colab.status || "ATIVO",
    });
    setColabDialogOpen(true);
  }

  async function handleEPISubmit() {
    const types = Object.keys(epiItems);
    if (!epiForm.employeeId || types.length === 0 || !epiForm.description) {
      toast.error("Preencha os campos obrigatórios e selecione pelo menos um tipo.");
      return;
    }
    for (const type of types) {
      if (!epiItems[type].deliveredAt || !epiItems[type].expiryDate) {
        toast.error("Preencha as datas de entrega e validade para todos os tipos.");
        return;
      }
    }
    setSubmitting(true);
    try {
      const results = await Promise.all(
        types.map((type) =>
          fetch("/api/epis", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              employeeId: epiForm.employeeId,
              epiType: type,
              description: epiForm.description,
              serialNumber: epiItems[type].serialNumber || null,
              deliveredAt: epiItems[type].deliveredAt,
              expiryDate: epiItems[type].expiryDate,
              notes: epiForm.notes || null,
            }),
          }).then(async (res) => {
            if (!res.ok) throw new Error("Failed");
            return res.json();
          })
        )
      );
      toast.success(`${results.length} EPI(s) registado(s) com sucesso.`);
      setEpis((prev) => [...prev, ...results]);
      setEpiDialogOpen(false);
      setEpiForm(emptyEPIForm);
      setEpiItems({});
      setSelectedEPITypes([]);
    } catch {
      toast.error("Erro ao registar EPIs.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCertSubmit() {
    setSubmitting(true);
    try {
      if (certEditId) {
        const res = await fetch(`/api/certificacoes/${certEditId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(certForm),
        });
        if (!res.ok) throw new Error("Failed to update");
        toast.success("Certificação atualizada com sucesso.");
        const data = await res.json();
        setCertificacoes((prev) => prev.map((c) => (c.id === certEditId ? data : c)));
      } else {
        const res = await fetch("/api/certificacoes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(certForm),
        });
        if (!res.ok) throw new Error("Failed to create");
        toast.success("Certificação criada com sucesso.");
        const data = await res.json();
        setCertificacoes((prev) => [...prev, data]);
      }
      setCertDialogOpen(false);
      setCertForm(emptyCertificacaoForm);
      setCertEditId(null);
    } catch {
      toast.error(certEditId ? "Erro ao atualizar certificação." : "Erro ao criar certificação.");
    } finally {
      setSubmitting(false);
    }
  }

  function handleEPIEditGroup(employeeId: string, employeeName: string, epis: EPI[]) {
    router.push("/epis");
  }

  function handleCertEdit(cert: Certificacao) {
    setCertEditId(cert.id);
    setCertForm({
      employeeId: cert.employeeId,
      name: cert.name,
      issuingEntity: cert.issuingEntity || "",
      issueDate: cert.issueDate ? new Date(cert.issueDate).toISOString().split("T")[0] : "",
      expiryDate: cert.expiryDate ? new Date(cert.expiryDate).toISOString().split("T")[0] : "",
      documentUrl: cert.documentUrl || "",
      notes: cert.notes || "",
    });
    setCertDialogOpen(true);
  }

  async function handleEPIDelete() {
    if (!epiDeleteId) return;
    setEpiDeleting(true);
    try {
      const res = await fetch(`/api/epis/${epiDeleteId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
      toast.success("EPI eliminado com sucesso.");
      setEpis(prev => prev.filter(e => e.id !== epiDeleteId));
    } catch {
      toast.error("Erro ao eliminar EPI.");
    } finally {
      setEpiDeleting(false);
      setEpiDeleteId(null);
    }
  }

  async function handleCertDelete() {
    if (!certDeleteId) return;
    setCertDeleting(true);
    try {
      const res = await fetch(`/api/certificacoes/${certDeleteId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
      toast.success("Certificação eliminada com sucesso.");
      setCertificacoes(prev => prev.filter(c => c.id !== certDeleteId));
    } catch {
      toast.error("Erro ao eliminar certificação.");
    } finally {
      setCertDeleting(false);
      setCertDeleteId(null);
    }
  }

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
        <h1 className="text-2xl font-bold tracking-tight">Recursos Humanos</h1>
      </div>

      <Tabs defaultValue="colaboradores">
        <TabsList>
          <TabsTrigger value="colaboradores">Colaboradores</TabsTrigger>
          <TabsTrigger value="epis">EPIs</TabsTrigger>
          <TabsTrigger value="certificacoes">Certificações</TabsTrigger>
        </TabsList>

        {/* Tab 1: Colaboradores */}
        <TabsContent value="colaboradores" className="mt-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Colaboradores</h2>
            <Button onClick={() => { setColabEditId(null); setColabForm(emptyColaboradorForm); setColabDialogOpen(true); }}>
              <Plus className="mr-1 h-4 w-4" />
              Novo Colaborador
            </Button>
          </div>

          <div className="flex flex-wrap items-end justify-center gap-2 p-3 bg-card border border-border rounded-lg mb-4">
            <div className="flex flex-col gap-0.5">
              <span className="text-xs text-muted-foreground">Nome</span>
              <input placeholder="Nome" value={colabFilters.name} onChange={e => setColabFilter("name", e.target.value)} className="w-[150px] h-8 text-sm bg-background border border-border rounded px-2 text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-primary/50" />
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-xs text-muted-foreground">Departamento</span>
              <input placeholder="Departamento" value={colabFilters.department} onChange={e => setColabFilter("department", e.target.value)} className="w-[150px] h-8 text-sm bg-background border border-border rounded px-2 text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-primary/50" />
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-xs text-muted-foreground">Cargo</span>
              <input placeholder="Cargo" value={colabFilters.position} onChange={e => setColabFilter("position", e.target.value)} className="w-[140px] h-8 text-sm bg-background border border-border rounded px-2 text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-primary/50" />
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-xs text-muted-foreground">Estado</span>
              <select value={colabFilters.status} onChange={e => setColabFilter("status", e.target.value)} className="w-[120px] h-8 text-sm bg-background border border-border rounded px-2 text-foreground outline-none focus:border-primary/50">
                <option value="">Todos</option>
                {Object.entries(statusLabel).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
            {hasAnyColabFilter && (
              <button onClick={clearColabFilters} className="h-8 px-3 text-sm text-muted-foreground hover:text-foreground border border-border rounded hover:bg-accent/50 transition-colors mb-0.5">
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
                        <TableHead className="whitespace-nowrap text-sm">Nome</TableHead>
                        <TableHead className="whitespace-nowrap text-sm">Departamento</TableHead>
                        <TableHead className="whitespace-nowrap text-sm">Cargo</TableHead>
                        <TableHead className="whitespace-nowrap text-sm">Telemóvel</TableHead>
                        <TableHead className="whitespace-nowrap text-sm">Email</TableHead>
                        <TableHead className="whitespace-nowrap text-sm">B.I.</TableHead>
                        <TableHead className="whitespace-nowrap text-sm">Estado</TableHead>
                        <TableHead className="whitespace-nowrap text-sm p-1.5">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {displayedColaboradores.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center text-muted-foreground text-sm whitespace-nowrap">
                            Nenhum registo encontrado.
                          </TableCell>
                        </TableRow>
                      ) : (
                        displayedColaboradores.map((colab: any) => {
                          const isMatch = colab._match || !hasAnyColabFilter;
                          return (
                          <TableRow key={colab.id} className={`${isMatch && hasAnyColabFilter ? "bg-primary/5 border-l-2 border-l-primary" : ""} ${!isMatch && hasAnyColabFilter ? "opacity-40" : ""}`}>
                            <TableCell className="font-medium whitespace-nowrap text-sm">{colab.name}</TableCell>
                            <TableCell className="whitespace-nowrap text-sm">
                              {departamentoLabel[colab.department] ?? colab.department}
                            </TableCell>
                            <TableCell className="whitespace-nowrap text-sm">{cargos.find(c => c.id === colab.position)?.name ?? cargoLabel[colab.position] ?? colab.position}</TableCell>
                            <TableCell className="whitespace-nowrap text-sm">{colab.phone || "-"}</TableCell>
                            <TableCell className="whitespace-nowrap text-sm">{colab.email}</TableCell>
                            <TableCell className="whitespace-nowrap text-sm">{colab.nif || "-"}</TableCell>
                            <TableCell className="whitespace-nowrap text-sm">
                              <Badge variant="outline" className={`bg-transparent ${statusBadgeClass[colab.status] || ""}`}>
                                {statusLabel[colab.status] || colab.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="whitespace-nowrap text-sm p-1.5">
                              <div className="flex items-center gap-1">
                                <Button variant="ghost" size="icon-xs" onClick={() => handleColabEdit(colab)} className="h-8 w-8">
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon-xs" onClick={() => setDeleteId(colab.id)} className="h-8 w-8">
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        )
                      }
                    )
                  )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </CardContent>
          </Card>

          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />

          <Dialog open={colabDialogOpen} onOpenChange={setColabDialogOpen}>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>{colabEditId ? "Editar Colaborador" : "Novo Colaborador"}</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="colab-name">Nome</Label>
                  <Input
                    id="colab-name"
                    value={colabForm.name}
                    onChange={(e) =>
                      setColabForm((p) => ({ ...p, name: e.target.value }))
                    }
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="colab-email">Email</Label>
                    <Input
                      id="colab-email"
                      type="email"
                      value={colabForm.email}
                      onChange={(e) =>
                        setColabForm((p) => ({ ...p, email: e.target.value }))
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="colab-phone">Telefone</Label>
                    <Input
                      id="colab-phone"
                      value={colabForm.phone}
                      onChange={(e) =>
                        setColabForm((p) => ({ ...p, phone: e.target.value }))
                      }
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="colab-nif">NIF</Label>
                    <Input
                      id="colab-nif"
                      value={colabForm.nif}
                      onChange={(e) =>
                        setColabForm((p) => ({ ...p, nif: e.target.value }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="colab-address">Morada</Label>
                    <Input
                      id="colab-address"
                      value={colabForm.address}
                      onChange={(e) =>
                        setColabForm((p) => ({ ...p, address: e.target.value }))
                      }
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Cargo</Label>
                    <Select
                      value={colabForm.position}
                      onValueChange={(v) => v && setColabForm((p) => ({ ...p, position: v }))}
                      items={cargoItems}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Selecionar cargo" />
                      </SelectTrigger>
                      <SelectContent>
                        {cargos.map((c) => (
                          <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Departamento</Label>
                    <Select
                      value={colabForm.department}
                      onValueChange={(v) => v && setColabForm((p) => ({ ...p, department: v }))}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Selecionar departamento" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="VIDEO">Vídeo</SelectItem>
                        <SelectItem value="SOM">Som</SelectItem>
                        <SelectItem value="ILUMINACAO">Iluminação</SelectItem>
                        <SelectItem value="ESTRUTURAS">Estruturas</SelectItem>
                        <SelectItem value="TRANSPORTES">Transportes</SelectItem>
                        <SelectItem value="ADMINISTRACAO">Administração</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Estado</Label>
                  <Select value={colabForm.status} onValueChange={(v) => v && setColabForm((p) => ({ ...p, status: v }))}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecionar estado" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(statusLabel).map(([value, label]) => (
                        <SelectItem key={value} value={value}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="colab-hourly">Preço Hora</Label>
                    <Input
                      id="colab-hourly"
                      type="number"
                      step="0.01"
                      value={colabForm.hourlyRate}
                      onChange={(e) =>
                        setColabForm((p) => ({ ...p, hourlyRate: e.target.value }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="colab-daily">Preço Dia</Label>
                    <Input
                      id="colab-daily"
                      type="number"
                      step="0.01"
                      value={colabForm.dailyRate}
                      onChange={(e) =>
                        setColabForm((p) => ({ ...p, dailyRate: e.target.value }))
                      }
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="colab-start">Data Início</Label>
                  <Input
                    id="colab-start"
                    type="date"
                    value={colabForm.startDate}
                    onChange={(e) =>
                      setColabForm((p) => ({ ...p, startDate: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="colab-notes">Notas</Label>
                  <Textarea
                    id="colab-notes"
                    value={colabForm.notes}
                    onChange={(e) =>
                      setColabForm((p) => ({ ...p, notes: e.target.value }))
                    }
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setColabDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleColabSubmit} disabled={submitting}>
                  {submitting ? "A guardar..." : "Guardar"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* Tab 2: EPIs */}
        <TabsContent value="epis" className="mt-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">EPIs</h2>
            <Button onClick={() => { setSelectedEPITypes([]); setEpiItems({}); setEpiForm(emptyEPIForm); setEpiDialogOpen(true); }}>
              <Plus className="mr-1 h-4 w-4" />
              Registar EPI
            </Button>
          </div>

          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <div className="min-w-[900px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="whitespace-nowrap text-sm">Colaborador</TableHead>
                        <TableHead className="whitespace-nowrap text-sm">EPIs Fornecidos</TableHead>
                        <TableHead className="whitespace-nowrap text-sm">Data Entrega</TableHead>
                        <TableHead className="whitespace-nowrap text-sm">Validade</TableHead>
                        <TableHead className="whitespace-nowrap text-sm">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {epis.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-muted-foreground text-sm whitespace-nowrap">
                            Nenhum registo encontrado.
                          </TableCell>
                        </TableRow>
                      ) : (
                        (() => {
                          const grouped: Record<string, { name: string; epis: typeof epis }> = {};
                          epis.forEach((epi) => {
                            const key = epi.employeeId;
                            if (!grouped[key]) grouped[key] = { name: epi.employee?.name || "", epis: [] };
                            grouped[key].epis.push(epi);
                          });
                          return Object.entries(grouped).map(([employeeId, group]) => {
                            const types = group.epis.map((e) => epiTypeLabel[e.epiType] ?? e.epiType).filter((v, i, a) => a.indexOf(v) === i);
                            const expiries = group.epis.map((e) => e.expiryDate).filter(Boolean).sort();
                            const deliveries = group.epis.map((e) => e.deliveredAt).filter(Boolean).sort();
                            return (
                              <TableRow key={employeeId}>
                                <TableCell className="font-medium whitespace-nowrap text-sm">{group.name}</TableCell>
                                <TableCell className="text-sm">
                                  <div className="flex flex-wrap gap-1">
                                    {types.map((t) => (
                                      <Badge key={t} variant="secondary" className="text-xs">{t}</Badge>
                                    ))}
                                  </div>
                                </TableCell>
                                <TableCell className="whitespace-nowrap text-sm">{deliveries.length > 0 ? formatDate(deliveries[0]) : "-"}</TableCell>
                                <TableCell className="whitespace-nowrap text-sm">
                                  <span className={expiries.length > 0 && isExpiringSoon(expiries[0]) ? "text-red-600 font-medium" : ""}>
                                    {expiries.length > 0 ? formatDate(expiries[0]) : "-"}
                                  </span>
                                </TableCell>
                                <TableCell className="whitespace-nowrap text-sm">
                                  <div className="flex items-center gap-1">
                                    <Button variant="ghost" size="icon-xs" onClick={() => handleEPIEditGroup(employeeId, group.name, group.epis)} className="h-8 w-8">
                                      <Pencil className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon-xs" onClick={() => setEpiDeleteId(group.epis[0].id)} className="h-8 w-8">
                                      <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            );
                          });
                        })()
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </CardContent>
          </Card>

          <Dialog open={epiDialogOpen} onOpenChange={(open) => { if (!open) { setSelectedEPITypes([]); setEpiItems({}); setEpiForm(emptyEPIForm); } setEpiDialogOpen(open); }}>
            <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Registar EPI</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label>Colaborador</Label>
                  <Select value={epiForm.employeeId} onValueChange={(v) => v && setEpiForm((p) => ({ ...p, employeeId: v }))} items={employeeItems}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecionar colaborador" />
                    </SelectTrigger>
                    <SelectContent>
                      {employeesList.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Descrição</Label>
                  <Input value={epiForm.description} onChange={(e) => setEpiForm((p) => ({ ...p, description: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Tipo(s) de EPI</Label>
                  <div className="rounded-lg border p-3 space-y-1">
                    {Object.entries(epiTypeLabel).map(([value, label]) => (
                      <label key={value} className="flex items-center gap-2 text-sm py-0.5 cursor-pointer">
                        <Checkbox
                          checked={!!epiItems[value]}
                          onCheckedChange={(checked) => {
                            setSelectedEPITypes((prev) => checked ? [...prev, value] : prev.filter((t) => t !== value));
                            setEpiItems((prev) => {
                              if (checked) {
                                return { ...prev, [value]: { serialNumber: "", deliveredAt: "", expiryDate: "" } };
                              }
                              const next = { ...prev };
                              delete next[value];
                              return next;
                            });
                          }}
                        />
                        {label}
                      </label>
                    ))}
                  </div>
                </div>
                {Object.entries(epiItems).map(([type, item]) => (
                  <div key={type} className="space-y-3 rounded-lg border p-4 bg-muted/30">
                    <p className="text-sm font-semibold">{epiTypeLabel[type]}</p>
                    <div className="space-y-2">
                      <Label className="text-xs">N.º Série / Cód. Certificação</Label>
                      <Input
                        value={item.serialNumber}
                        onChange={(e) => setEpiItems((prev) => ({ ...prev, [type]: { ...prev[type], serialNumber: e.target.value } }))}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label className="text-xs">Data Entrega</Label>
                        <Input
                          type="date"
                          value={item.deliveredAt}
                          onChange={(e) => setEpiItems((prev) => ({ ...prev, [type]: { ...prev[type], deliveredAt: e.target.value } }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">Validade</Label>
                        <Input
                          type="date"
                          value={item.expiryDate}
                          onChange={(e) => setEpiItems((prev) => ({ ...prev, [type]: { ...prev[type], expiryDate: e.target.value } }))}
                        />
                      </div>
                    </div>
                  </div>
                ))}
                <div className="space-y-2">
                  <Label>Observações</Label>
                  <Textarea value={epiForm.notes} onChange={(e) => setEpiForm((p) => ({ ...p, notes: e.target.value }))} />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setEpiDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleEPISubmit} disabled={submitting}>
                  {submitting ? "A guardar..." : "Guardar"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* Tab 3: Certificações */}
        <TabsContent value="certificacoes" className="mt-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Certificações</h2>
            <Button onClick={() => setCertDialogOpen(true)}>
              <Plus className="mr-1 h-4 w-4" />
              Nova Certificação
            </Button>
          </div>

          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <div className="min-w-[900px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="whitespace-nowrap text-sm">Colaborador</TableHead>
                        <TableHead className="whitespace-nowrap text-sm">Certificação</TableHead>
                        <TableHead className="whitespace-nowrap text-sm">Entidade Formadora</TableHead>
                        <TableHead className="whitespace-nowrap text-sm">Data Emissão</TableHead>
                        <TableHead className="whitespace-nowrap text-sm">Validade</TableHead>
                        <TableHead className="whitespace-nowrap text-sm">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {certificacoes.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center text-muted-foreground text-sm whitespace-nowrap">
                            Nenhum registo encontrado.
                          </TableCell>
                        </TableRow>
                      ) : (
                        certificacoes.map((cert) => (
                          <TableRow key={cert.id}>
                            <TableCell className="font-medium whitespace-nowrap text-sm">
                              {cert.employee?.name}
                            </TableCell>
                            <TableCell className="whitespace-nowrap text-sm">{cert.name}</TableCell>
                            <TableCell className="whitespace-nowrap text-sm">{cert.issuingEntity || "-"}</TableCell>
                            <TableCell className="whitespace-nowrap text-sm">
                              {cert.issueDate ? formatDate(cert.issueDate) : "-"}
                            </TableCell>
                            <TableCell className="whitespace-nowrap text-sm">
                              <span
                                className={
                                  isExpiringSoon(cert.expiryDate ?? "")
                                    ? "text-red-600 font-medium"
                                    : ""
                                }
                              >
                                {cert.expiryDate ? formatDate(cert.expiryDate) : "-"}
                              </span>
                            </TableCell>
                            <TableCell className="whitespace-nowrap text-sm">
                              <div className="flex items-center gap-1">
                                <Button variant="ghost" size="icon-xs" onClick={() => handleCertEdit(cert)} className="h-8 w-8">
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon-xs" onClick={() => setCertDeleteId(cert.id)} className="h-8 w-8">
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </div>
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

          <Dialog open={certDialogOpen} onOpenChange={(open) => { if (!open) setCertEditId(null); setCertDialogOpen(open); }}>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>{certEditId ? "Editar Certificação" : "Nova Certificação"}</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label>Colaborador</Label>
                  <Select
                    value={certForm.employeeId}
                    onValueChange={(v) => v && setCertForm((p) => ({ ...p, employeeId: v }))}
                    items={employeeItems}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecionar colaborador" />
                    </SelectTrigger>
                    <SelectContent>
                      {employeesList.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cert-name">Certificação</Label>
                  <Input
                    id="cert-name"
                    value={certForm.name}
                    onChange={(e) =>
                      setCertForm((p) => ({ ...p, name: e.target.value }))
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cert-entity">Entidade</Label>
                  <Input
                    id="cert-entity"
                    value={certForm.issuingEntity}
                    onChange={(e) =>
                      setCertForm((p) => ({ ...p, issuingEntity: e.target.value }))
                    }
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="cert-emission">Emissão</Label>
                    <Input
                      id="cert-emission"
                      type="date"
                      value={certForm.issueDate}
                      onChange={(e) =>
                        setCertForm((p) => ({ ...p, issueDate: e.target.value }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cert-validity">Validade</Label>
                    <Input
                      id="cert-validity"
                      type="date"
                      value={certForm.expiryDate}
                      onChange={(e) =>
                        setCertForm((p) => ({ ...p, expiryDate: e.target.value }))
                      }
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cert-notes">Notas</Label>
                  <Textarea
                    id="cert-notes"
                    value={certForm.notes}
                    onChange={(e) =>
                      setCertForm((p) => ({ ...p, notes: e.target.value }))
                    }
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setCertDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleCertSubmit} disabled={submitting}>
                  {submitting ? "A guardar..." : "Guardar"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>
      </Tabs>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => { if (!open) setDeleteId(null); }}
        title="Confirmar Eliminação"
        description="Tem a certeza que deseja eliminar este registo? Esta ação não pode ser desfeita."
        onConfirm={handleDelete}
        loading={deleting}
      />
      <ConfirmDialog
        open={!!epiDeleteId}
        onOpenChange={(open) => { if (!open) setEpiDeleteId(null); }}
        title="Confirmar Eliminação"
        description="Tem a certeza que deseja eliminar este EPI? Esta ação não pode ser desfeita."
        onConfirm={handleEPIDelete}
        loading={epiDeleting}
      />
      <ConfirmDialog
        open={!!certDeleteId}
        onOpenChange={(open) => { if (!open) setCertDeleteId(null); }}
        title="Confirmar Eliminação"
        description="Tem a certeza que deseja eliminar esta certificação? Esta ação não pode ser desfeita."
        onConfirm={handleCertDelete}
        loading={certDeleting}
      />
    </div>
  );
}
