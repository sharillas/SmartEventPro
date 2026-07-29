"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { Plus, UserCircle } from "lucide-react";
import { toast } from "sonner";
import { formatDate } from "@/lib/helpers";

interface Colaborador {
  id: string;
  name: string;
  email: string;
  position: string;
  department: string;
  hourlyRate: number;
  active: boolean;
}

interface EPI {
  id: string;
  colaboradorName: string;
  type: string;
  description: string;
  deliveryDate: string;
  validity: string;
}

interface Certificacao {
  id: string;
  colaboradorName: string;
  certification: string;
  entity: string;
  emissionDate: string;
  validity: string;
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
};

const emptyEPIForm = {
  colaboradorId: "",
  type: "",
  description: "",
  serialNumber: "",
  validity: "",
  deliveryDate: "",
  notes: "",
};

const emptyCertificacaoForm = {
  colaboradorId: "",
  certification: "",
  entity: "",
  emissionDate: "",
  validity: "",
  notes: "",
};

export default function RHPage() {
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([]);
  const [epis, setEpis] = useState<EPI[]>([]);
  const [certificacoes, setCertificacoes] = useState<Certificacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const [colabDialogOpen, setColabDialogOpen] = useState(false);
  const [epiDialogOpen, setEpiDialogOpen] = useState(false);
  const [certDialogOpen, setCertDialogOpen] = useState(false);
  const [colabForm, setColabForm] = useState(emptyColaboradorForm);
  const [epiForm, setEpiForm] = useState(emptyEPIForm);
  const [certForm, setCertForm] = useState(emptyCertificacaoForm);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const [colabRes, epiRes, certRes] = await Promise.all([
          fetch("/api/colaboradores"),
          fetch("/api/epis"),
          fetch("/api/certificacoes"),
        ]);
        if (!colabRes.ok) throw new Error("Failed to fetch");
        const colabData = await colabRes.json();
        const epiData = epiRes.ok ? await epiRes.json() : [];
        const certData = certRes.ok ? await certRes.json() : [];
        setColaboradores(colabData);
        setEpis(epiData);
        setCertificacoes(certData);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  async function handleColabSubmit() {
    setSubmitting(true);
    try {
      const res = await fetch("/api/colaboradores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(colabForm),
      });
      if (!res.ok) throw new Error("Failed to create");
      toast.success("Colaborador criado com sucesso.");
      const data = await res.json();
      setColaboradores((prev) => [...prev, data]);
      setColabDialogOpen(false);
      setColabForm(emptyColaboradorForm);
    } catch {
      toast.error("Erro ao criar colaborador.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleEPISubmit() {
    setSubmitting(true);
    try {
      const res = await fetch("/api/epis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(epiForm),
      });
      if (!res.ok) throw new Error("Failed to create");
      toast.success("EPI registado com sucesso.");
      const data = await res.json();
      setEpis((prev) => [...prev, data]);
      setEpiDialogOpen(false);
      setEpiForm(emptyEPIForm);
    } catch {
      toast.error("Erro ao registar EPI.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCertSubmit() {
    setSubmitting(true);
    try {
      const res = await fetch("/api/certificacoes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(certForm),
      });
      if (!res.ok) throw new Error("Failed to create");
      toast.success("Certificação criada com sucesso.");
      const data = await res.json();
      setCertificacoes((prev) => [...prev, data]);
      setCertDialogOpen(false);
      setCertForm(emptyCertificacaoForm);
    } catch {
      toast.error("Erro ao criar certificação.");
    } finally {
      setSubmitting(false);
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
            <Button onClick={() => setColabDialogOpen(true)}>
              <Plus className="mr-1 h-4 w-4" />
              Novo Colaborador
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
                        <TableHead className="whitespace-nowrap text-xs">Email</TableHead>
                        <TableHead className="whitespace-nowrap text-xs">Cargo</TableHead>
                        <TableHead className="whitespace-nowrap text-xs">Departamento</TableHead>
                        <TableHead className="whitespace-nowrap text-xs">Preço/Hora</TableHead>
                        <TableHead className="whitespace-nowrap text-xs">Ativo</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {colaboradores.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center text-muted-foreground text-xs whitespace-nowrap">
                            Nenhum registo encontrado.
                          </TableCell>
                        </TableRow>
                      ) : (
                        colaboradores.map((colab) => (
                          <TableRow key={colab.id}>
                            <TableCell className="font-medium whitespace-nowrap text-xs">{colab.name}</TableCell>
                            <TableCell className="whitespace-nowrap text-xs">{colab.email}</TableCell>
                            <TableCell className="whitespace-nowrap text-xs">{cargoLabel[colab.position] ?? colab.position}</TableCell>
                            <TableCell className="whitespace-nowrap text-xs">
                              {departamentoLabel[colab.department] ?? colab.department}
                            </TableCell>
                            <TableCell className="whitespace-nowrap text-xs">
                              {colab.hourlyRate ? `€ ${colab.hourlyRate}` : "-"}
                            </TableCell>
                            <TableCell className="whitespace-nowrap text-xs">
                              <Badge
                                variant="secondary"
                                className={
                                  colab.active
                                    ? "bg-green-100 text-green-800"
                                    : "bg-gray-100 text-gray-800"
                                }
                              >
                                {colab.active ? "Sim" : "Não"}
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

          <Dialog open={colabDialogOpen} onOpenChange={setColabDialogOpen}>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Novo Colaborador</DialogTitle>
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
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Selecionar cargo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="TECNICO_VIDEO">Técnico de Vídeo</SelectItem>
                        <SelectItem value="TECNICO_SOM">Técnico de Som</SelectItem>
                        <SelectItem value="TECNICO_ILUMINACAO">Técnico de Iluminação</SelectItem>
                        <SelectItem value="TECNICO_ESTRUTURAS">Técnico de Estruturas</SelectItem>
                        <SelectItem value="MOTORISTA">Motorista</SelectItem>
                        <SelectItem value="GESTOR">Gestor</SelectItem>
                        <SelectItem value="ADMIN">Administrador</SelectItem>
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
            <Button onClick={() => setEpiDialogOpen(true)}>
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
                        <TableHead className="whitespace-nowrap text-xs">Colaborador</TableHead>
                        <TableHead className="whitespace-nowrap text-xs">Tipo EPI</TableHead>
                        <TableHead className="whitespace-nowrap text-xs">Descrição</TableHead>
                        <TableHead className="whitespace-nowrap text-xs">Data Entrega</TableHead>
                        <TableHead className="whitespace-nowrap text-xs">Validade</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {epis.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-muted-foreground text-xs whitespace-nowrap">
                            Nenhum registo encontrado.
                          </TableCell>
                        </TableRow>
                      ) : (
                        epis.map((epi) => (
                          <TableRow key={epi.id}>
                            <TableCell className="font-medium whitespace-nowrap text-xs">
                              {epi.colaboradorName}
                            </TableCell>
                            <TableCell className="whitespace-nowrap text-xs">{epiTypeLabel[epi.type] ?? epi.type}</TableCell>
                            <TableCell className="whitespace-nowrap text-xs">{epi.description}</TableCell>
                            <TableCell className="whitespace-nowrap text-xs">
                              {epi.deliveryDate ? formatDate(epi.deliveryDate) : "-"}
                            </TableCell>
                            <TableCell className="whitespace-nowrap text-xs">
                              <span
                                className={
                                  isExpiringSoon(epi.validity)
                                    ? "text-red-600 font-medium"
                                    : ""
                                }
                              >
                                {epi.validity ? formatDate(epi.validity) : "-"}
                              </span>
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

          <Dialog open={epiDialogOpen} onOpenChange={setEpiDialogOpen}>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Registar EPI</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label>Colaborador</Label>
                  <Select
                    value={epiForm.colaboradorId}
                    onValueChange={(v) => v && setEpiForm((p) => ({ ...p, colaboradorId: v }))}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecionar colaborador" />
                    </SelectTrigger>
                    <SelectContent>
                      {colaboradores.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <Select
                    value={epiForm.type}
                    onValueChange={(v) => v && setEpiForm((p) => ({ ...p, type: v }))}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecionar tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CAPACETE">Capacete</SelectItem>
                      <SelectItem value="LUVAS">Luvas</SelectItem>
                      <SelectItem value="BOTAS">Botas</SelectItem>
                      <SelectItem value="ARNES">Arnês</SelectItem>
                      <SelectItem value="PROTETOR_AUDITIVO">Protetor Auditivo</SelectItem>
                      <SelectItem value="COLETE">Colete</SelectItem>
                      <SelectItem value="OCULOS">Óculos</SelectItem>
                      <SelectItem value="OUTRO">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="epi-desc">Descrição</Label>
                  <Input
                    id="epi-desc"
                    value={epiForm.description}
                    onChange={(e) =>
                      setEpiForm((p) => ({ ...p, description: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="epi-serial">N.º Série</Label>
                  <Input
                    id="epi-serial"
                    value={epiForm.serialNumber}
                    onChange={(e) =>
                      setEpiForm((p) => ({ ...p, serialNumber: e.target.value }))
                    }
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="epi-validity">Data Validade</Label>
                    <Input
                      id="epi-validity"
                      type="date"
                      value={epiForm.validity}
                      onChange={(e) =>
                        setEpiForm((p) => ({ ...p, validity: e.target.value }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="epi-delivery">Data Entrega</Label>
                    <Input
                      id="epi-delivery"
                      type="date"
                      value={epiForm.deliveryDate}
                      onChange={(e) =>
                        setEpiForm((p) => ({ ...p, deliveryDate: e.target.value }))
                      }
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="epi-notes">Notas</Label>
                  <Textarea
                    id="epi-notes"
                    value={epiForm.notes}
                    onChange={(e) =>
                      setEpiForm((p) => ({ ...p, notes: e.target.value }))
                    }
                  />
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
                        <TableHead className="whitespace-nowrap text-xs">Colaborador</TableHead>
                        <TableHead className="whitespace-nowrap text-xs">Certificação</TableHead>
                        <TableHead className="whitespace-nowrap text-xs">Entidade</TableHead>
                        <TableHead className="whitespace-nowrap text-xs">Emissão</TableHead>
                        <TableHead className="whitespace-nowrap text-xs">Validade</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {certificacoes.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-muted-foreground text-xs whitespace-nowrap">
                            Nenhum registo encontrado.
                          </TableCell>
                        </TableRow>
                      ) : (
                        certificacoes.map((cert) => (
                          <TableRow key={cert.id}>
                            <TableCell className="font-medium whitespace-nowrap text-xs">
                              {cert.colaboradorName}
                            </TableCell>
                            <TableCell className="whitespace-nowrap text-xs">{cert.certification}</TableCell>
                            <TableCell className="whitespace-nowrap text-xs">{cert.entity}</TableCell>
                            <TableCell className="whitespace-nowrap text-xs">
                              {cert.emissionDate ? formatDate(cert.emissionDate) : "-"}
                            </TableCell>
                            <TableCell className="whitespace-nowrap text-xs">
                              <span
                                className={
                                  isExpiringSoon(cert.validity)
                                    ? "text-red-600 font-medium"
                                    : ""
                                }
                              >
                                {cert.validity ? formatDate(cert.validity) : "-"}
                              </span>
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

          <Dialog open={certDialogOpen} onOpenChange={setCertDialogOpen}>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Nova Certificação</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label>Colaborador</Label>
                  <Select
                    value={certForm.colaboradorId}
                    onValueChange={(v) => v && setCertForm((p) => ({ ...p, colaboradorId: v }))}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecionar colaborador" />
                    </SelectTrigger>
                    <SelectContent>
                      {colaboradores.map((c) => (
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
                    value={certForm.certification}
                    onChange={(e) =>
                      setCertForm((p) => ({ ...p, certification: e.target.value }))
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cert-entity">Entidade</Label>
                  <Input
                    id="cert-entity"
                    value={certForm.entity}
                    onChange={(e) =>
                      setCertForm((p) => ({ ...p, entity: e.target.value }))
                    }
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="cert-emission">Emissão</Label>
                    <Input
                      id="cert-emission"
                      type="date"
                      value={certForm.emissionDate}
                      onChange={(e) =>
                        setCertForm((p) => ({ ...p, emissionDate: e.target.value }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cert-validity">Validade</Label>
                    <Input
                      id="cert-validity"
                      type="date"
                      value={certForm.validity}
                      onChange={(e) =>
                        setCertForm((p) => ({ ...p, validity: e.target.value }))
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
    </div>
  );
}
