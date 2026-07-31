"use client";

import { useEffect, useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Pagination } from "@/components/ui/pagination";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, X } from "lucide-react";

interface Certification {
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

interface Employee {
  id: string;
  name: string;
}

interface CertFormItem {
  name: string;
  issuingEntity: string;
  issueDate: string;
  expiryDate: string;
}

const emptyCertItem: CertFormItem = { name: "", issuingEntity: "", issueDate: "", expiryDate: "" };

function toDateInputValue(dateStr: string | null | undefined): string {
  if (!dateStr) return "";
  return new Date(dateStr).toISOString().split("T")[0];
}

export default function CertificacoesPage() {
  const [certifications, setCertifications] = useState<Certification[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ employeeId: "", notes: "" });
  const [certItems, setCertItems] = useState<CertFormItem[]>([{ ...emptyCertItem }]);
  const [editId, setEditId] = useState<string | null>(null);
  const [originalCertIds, setOriginalCertIds] = useState<Record<number, string>>({});
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  interface Filters { employee: string; name: string; issuingEntity: string; }
  const initialFilters: Filters = { employee: "", name: "", issuingEntity: "" };
  const [filters, setFilters] = useState<Filters>(initialFilters);
  function setFilter(key: keyof Filters, value: string) { setFilters(prev => ({ ...prev, [key]: value })); }
  function clearFilters() { setFilters(initialFilters); }
  const hasAnyFilter = Object.values(filters).some(v => v !== "");

  const { matched, rest } = useMemo(() => {
    const lf = { employee: filters.employee.toLowerCase(), name: filters.name.toLowerCase(), issuingEntity: filters.issuingEntity.toLowerCase() };
    if (!hasAnyFilter) return { matched: certifications, rest: [] };
    const m: Certification[] = []; const r: Certification[] = [];
    for (const cert of certifications) {
      let ok = true;
      if (lf.employee && !(cert.employee?.name || "").toLowerCase().includes(lf.employee)) ok = false;
      if (lf.name && !(cert.name || "").toLowerCase().includes(lf.name)) ok = false;
      if (lf.issuingEntity && !(cert.issuingEntity || "").toLowerCase().includes(lf.issuingEntity)) ok = false;
      if (ok) m.push({ ...cert, _match: true } as any); else r.push(cert);
    }
    return { matched: m, rest: r };
  }, [certifications, filters, hasAnyFilter]);

  const displayed = [...matched, ...rest];

  const employeeItems = useMemo(
    () => Object.fromEntries(employees.map((e) => [e.id, e.name] as const)),
    [employees]
  );

  useEffect(() => { fetchData(); }, [page]);
  useEffect(() => { fetchEmployees(); }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const res = await fetch(`/api/certificacoes?page=${page}&limit=10`);
      if (!res.ok) throw new Error("Erro");
      const result = await res.json();
      setCertifications(result.data);
      setTotalPages(result.totalPages);
    } catch { toast.error("Erro ao carregar certificações."); }
    setLoading(false);
  }

  async function fetchEmployees() {
    try {
      const res = await fetch("/api/colaboradores?limit=1000");
      if (!res.ok) throw new Error("Erro");
      const result = await res.json();
      setEmployees(result.data);
    } catch { /* ignore */ }
  }

  function addCertItem() {
    setCertItems((prev) => [...prev, { ...emptyCertItem }]);
  }

  function removeCertItem(index: number) {
    setCertItems((prev) => prev.filter((_, i) => i !== index));
  }

  function updateCertItem(index: number, field: keyof CertFormItem, value: string) {
    setCertItems((prev) => prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)));
  }

  function handleEditClick(cert: Certification) {
    const employeeCerts = certifications.filter((c) => c.employeeId === cert.employeeId);
    setEditId(null);
    setForm({ employeeId: cert.employeeId, notes: "" });
    const ids: Record<number, string> = {};
    const items: CertFormItem[] = employeeCerts.map((c, i) => {
      ids[i] = c.id;
      return {
        name: c.name,
        issuingEntity: c.issuingEntity || "",
        issueDate: toDateInputValue(c.issueDate),
        expiryDate: toDateInputValue(c.expiryDate),
      };
    });
    setCertItems(items.length > 0 ? items : [{ ...emptyCertItem }]);
    setOriginalCertIds(ids);
    setDialogOpen(true);
  }

  function resetDialog() {
    setEditId(null);
    setForm({ employeeId: "", notes: "" });
    setCertItems([{ ...emptyCertItem }]);
    setOriginalCertIds({});
  }

  async function handleSubmit() {
    if (!form.employeeId) { toast.error("Selecione um colaborador."); return; }
    const validItems = certItems.filter((item) => item.name.trim());
    if (validItems.length === 0) { toast.error("Adicione pelo menos uma certificação com nome."); return; }
    for (const item of validItems) {
      if (!item.issueDate) { toast.error("Preencha a data de emissão para todas as certificações."); return; }
    }
    setSubmitting(true);
    try {
      const hasOriginals = Object.keys(originalCertIds).length > 0;
      const operations: Promise<unknown>[] = [];

      if (hasOriginals) {
        const existingKeys = new Set(Object.keys(originalCertIds));
        validItems.forEach((_, i) => existingKeys.delete(String(i)));
        for (const idx of existingKeys) {
          operations.push(fetch(`/api/certificacoes/${originalCertIds[Number(idx)]}`, { method: "DELETE" }));
        }
      }

      validItems.forEach((item, i) => {
        if (hasOriginals && originalCertIds[i]) {
          operations.push(
            fetch(`/api/certificacoes/${originalCertIds[i]}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                employeeId: form.employeeId,
                name: item.name,
                issuingEntity: item.issuingEntity || null,
                issueDate: item.issueDate,
                expiryDate: item.expiryDate || null,
                notes: form.notes || null,
              }),
            }).then(async (res) => {
              if (!res.ok) throw new Error("Failed");
              return res.json();
            })
          );
        } else {
          operations.push(
            fetch("/api/certificacoes", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                employeeId: form.employeeId,
                name: item.name,
                issuingEntity: item.issuingEntity || null,
                issueDate: item.issueDate,
                expiryDate: item.expiryDate || null,
                notes: form.notes || null,
              }),
            }).then(async (res) => {
              if (!res.ok) throw new Error("Failed");
              return res.json();
            })
          );
        }
      });

      await Promise.all(operations);
      toast.success(hasOriginals ? "Certificações atualizadas." : `${validItems.length} certificação(ões) criada(s).`);
      fetchData();
      setDialogOpen(false);
      resetDialog();
    } catch {
      toast.error("Erro ao guardar certificações.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await fetch(`/api/certificacoes/${deleteId}`, { method: "DELETE" });
      toast.success("Eliminado com sucesso.");
      fetchData();
    } catch { toast.error("Erro ao eliminar."); }
    finally { setDeleting(false); setDeleteId(null); }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Certificações</h1>
        <Button onClick={() => { resetDialog(); setDialogOpen(true); }}>
          <Plus className="mr-1 h-4 w-4" /> Nova Certificação
        </Button>
      </div>

      <div className="flex flex-wrap items-end justify-center gap-2 p-3 bg-card border border-border rounded-lg">
        <div className="flex flex-col gap-0.5">
          <span className="text-xs text-muted-foreground">Colaborador</span>
          <input placeholder="Colaborador" value={filters.employee} onChange={e => setFilter("employee", e.target.value)} className="w-[160px] h-8 text-sm bg-background border border-border rounded px-2 text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-primary/50" />
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-xs text-muted-foreground">Nome</span>
          <input placeholder="Certificação" value={filters.name} onChange={e => setFilter("name", e.target.value)} className="w-[160px] h-8 text-sm bg-background border border-border rounded px-2 text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-primary/50" />
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-xs text-muted-foreground">Entidade</span>
          <input placeholder="Entidade" value={filters.issuingEntity} onChange={e => setFilter("issuingEntity", e.target.value)} className="w-[160px] h-8 text-sm bg-background border border-border rounded px-2 text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-primary/50" />
        </div>
        {hasAnyFilter && (
          <button onClick={clearFilters} className="h-8 px-3 text-sm text-muted-foreground hover:text-foreground border border-border rounded hover:bg-accent/50 transition-colors mb-0.5">
            Limpar
          </button>
        )}
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <p className="text-muted-foreground text-center py-8">A carregar...</p>
          ) : displayed.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">Nenhuma certificação registada.</p>
          ) : (
            <div className="overflow-x-auto">
              <div className="min-w-[800px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="whitespace-nowrap text-sm">Colaborador</TableHead>
                      <TableHead className="whitespace-nowrap text-sm">Certificado</TableHead>
                      <TableHead className="whitespace-nowrap text-sm">Entidade Formadora</TableHead>
                      <TableHead className="whitespace-nowrap text-sm">Data Emissão</TableHead>
                      <TableHead className="whitespace-nowrap text-sm">Validade</TableHead>
                      <TableHead className="whitespace-nowrap text-sm">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {displayed.map((cert: any) => (
                      <TableRow key={cert.id} className={`${cert._match && hasAnyFilter ? "bg-primary/5 border-l-2 border-l-primary" : ""} ${!cert._match && hasAnyFilter ? "opacity-40" : ""}`}>
                        <TableCell className="font-medium whitespace-nowrap text-sm">{cert.employee?.name}</TableCell>
                        <TableCell className="whitespace-nowrap text-sm">{cert.name}</TableCell>
                        <TableCell className="whitespace-nowrap text-sm">{cert.issuingEntity || "-"}</TableCell>
                        <TableCell className="whitespace-nowrap text-sm">{toDateInputValue(cert.issueDate)}</TableCell>
                        <TableCell className="whitespace-nowrap text-sm">{cert.expiryDate ? toDateInputValue(cert.expiryDate) : "-"}</TableCell>
                        <TableCell className="whitespace-nowrap text-sm">
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="icon-xs" onClick={() => handleEditClick(cert)} className="h-8 w-8">
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon-xs" onClick={() => setDeleteId(cert.id)} className="h-8 w-8">
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Pagination page={page} totalPages={totalPages} onPageChange={(p) => setPage(p)} />

      <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) resetDialog(); setDialogOpen(open); }}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{originalCertIds && Object.keys(originalCertIds).length > 0 ? "Editar Certificações" : "Nova Certificação"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Colaborador</Label>
              <Select value={form.employeeId} onValueChange={(v) => v && setForm((p) => ({ ...p, employeeId: v }))} items={employeeItems}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecionar colaborador" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((emp) => (
                    <SelectItem key={emp.id} value={emp.id}>{emp.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Certificações</Label>
                <Button type="button" variant="outline" size="sm" onClick={addCertItem}>
                    <Plus className="mr-1 h-3 w-3" /> Adicionar
                  </Button>
              </div>
              {certItems.map((item, index) => (
                <div key={index} className="space-y-3 rounded-lg border p-4 bg-muted/30">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold">Certificação #{index + 1}</p>
                    {certItems.length > 1 && (
                      <Button variant="ghost" size="icon-xs" onClick={() => removeCertItem(index)} className="h-6 w-6">
                        <X className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Nome do Certificado</Label>
                    <Input value={item.name} onChange={(e) => updateCertItem(index, "name", e.target.value)} placeholder="Ex: Certificado de Trabalho em Altura" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Entidade Formadora</Label>
                    <Input value={item.issuingEntity} onChange={(e) => updateCertItem(index, "issuingEntity", e.target.value)} placeholder="Ex: DGERT" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label className="text-xs">Data Emissão</Label>
                      <Input type="date" value={item.issueDate} onChange={(e) => updateCertItem(index, "issueDate", e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Validade</Label>
                      <Input type="date" value={item.expiryDate} onChange={(e) => updateCertItem(index, "expiryDate", e.target.value)} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {Object.keys(originalCertIds).length > 0 ? (submitting ? "A guardar..." : "Guardar") : (submitting ? "A criar..." : "Criar")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => { if (!open) setDeleteId(null); }}
        title="Confirmar Eliminação"
        description="Tem a certeza que deseja eliminar este registo?"
        onConfirm={handleDelete}
        loading={deleting}
      />
    </div>
  );
}
