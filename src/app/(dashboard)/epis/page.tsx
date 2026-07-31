"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Pagination } from "@/components/ui/pagination";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";

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

interface Employee {
  id: string;
  name: string;
}

interface EPIFormItem {
  epiType: string;
  serialNumber: string;
  deliveredAt: string;
  expiryDate: string;
}

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

const emptyForm = {
  employeeId: "",
  description: "",
  notes: "",
};

const emptyEpiItem: EPIFormItem = {
  epiType: "",
  serialNumber: "",
  deliveredAt: "",
  expiryDate: "",
};

function toDateInputValue(dateStr: string | null | undefined): string {
  if (!dateStr) return "";
  return new Date(dateStr).toISOString().split("T")[0];
}

function isExpiringSoon(dateStr: string): boolean {
  if (!dateStr) return false;
  const target = new Date(dateStr);
  const now = new Date();
  const daysDiff = (target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
  return daysDiff <= 30 && daysDiff >= 0;
}

export default function EpisPage() {
  const [epis, setEpis] = useState<EPI[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [epiItems, setEpiItems] = useState<Record<string, EPIFormItem>>({});
  const [originalEpiIds, setOriginalEpiIds] = useState<Record<string, string>>({});
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  interface Filters { employee: string; epiType: string; description: string; }
  const initialFilters: Filters = { employee: "", epiType: "", description: "" };
  const [filters, setFilters] = useState<Filters>(initialFilters);
  function setFilter(key: keyof Filters, value: string) { setFilters(prev => ({ ...prev, [key]: value })); }
  function clearFilters() { setFilters(initialFilters); }
  const hasAnyFilter = Object.values(filters).some(v => v !== "");

  const displayedEpis = useMemo(() => {
    if (!hasAnyFilter) return epis;
    const lf = { employee: filters.employee.toLowerCase(), epiType: filters.epiType, description: filters.description.toLowerCase() };
    return epis.filter(epi => {
      if (lf.employee && !(epi.employee?.name || "").toLowerCase().includes(lf.employee)) return false;
      if (lf.epiType && epi.epiType !== lf.epiType) return false;
      if (lf.description && !(epi.description || "").toLowerCase().includes(lf.description)) return false;
      return true;
    });
  }, [epis, filters, hasAnyFilter]);
  const employeeItems = useMemo(
    () => Object.fromEntries(employees.map((e) => [e.id, e.name] as const)),
    [employees]
  );

  useEffect(() => { fetchData(); }, [page]);
  useEffect(() => { fetchEmployees(); }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const res = await fetch(`/api/epis?page=${page}&limit=10`);
      if (!res.ok) throw new Error("Erro");
      const result = await res.json();
      setEpis(result.data);
      setTotalPages(result.totalPages);
    } catch { toast.error("Erro ao carregar EPIs."); }
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

  function handleChange(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function updateEpiItem(type: string, field: keyof EPIFormItem, value: string) {
    setEpiItems((prev) => ({
      ...prev,
      [type]: { ...(prev[type] || emptyEpiItem), epiType: type, [field]: value },
    }));
  }

  function handleTypeToggle(type: string, checked: boolean) {
    if (editId) {
      setEpiItems(checked ? { [type]: { epiType: type, serialNumber: "", deliveredAt: "", expiryDate: "" } } : {});
    } else {
      setEpiItems((prev) => {
        if (checked) {
          return { ...prev, [type]: { epiType: type, serialNumber: "", deliveredAt: "", expiryDate: "" } };
        }
        const next = { ...prev };
        delete next[type];
        return next;
      });
    }
  }

  function handleEditClick(epi: EPI) {
    setEditId(epi.id);
    setOriginalEpiIds({ [epi.epiType]: epi.id });
    setForm({
      employeeId: epi.employeeId,
      description: epi.description,
      notes: epi.notes || "",
    });
    setEpiItems({
      [epi.epiType]: {
        epiType: epi.epiType,
        serialNumber: epi.serialNumber || "",
        deliveredAt: toDateInputValue(epi.deliveredAt),
        expiryDate: toDateInputValue(epi.expiryDate),
      },
    });
    setDialogOpen(true);
  }

  function handleEditEmployeeGroup(employeeId: string, employeeName: string, epis: EPI[]) {
    setEditId(null);
    setForm({
      employeeId,
      description: "",
      notes: "",
    });
    const items: Record<string, EPIFormItem> = {};
    const ids: Record<string, string> = {};
    epis.forEach((epi) => {
      items[epi.epiType] = {
        epiType: epi.epiType,
        serialNumber: epi.serialNumber || "",
        deliveredAt: toDateInputValue(epi.deliveredAt),
        expiryDate: toDateInputValue(epi.expiryDate),
      };
      ids[epi.epiType] = epi.id;
    });
    setEpiItems(items);
    setOriginalEpiIds(ids);
    setDialogOpen(true);
  }

  function resetDialog() {
    setEditId(null);
    setForm(emptyForm);
    setEpiItems({});
    setOriginalEpiIds({});
  }

  async function handleSubmit() {
    if (!form.employeeId) {
      toast.error("Selecione um colaborador.");
      return;
    }
    const itemList = Object.values(epiItems);
    if (itemList.length === 0) {
      toast.error("Selecione pelo menos um tipo de EPI.");
      return;
    }
    for (const item of itemList) {
      if (!item.deliveredAt || !item.expiryDate) {
        toast.error("Preencha as datas de entrega e validade para todos os tipos selecionados.");
        return;
      }
    }
    setSubmitting(true);
    try {
      if (editId) {
        const item = itemList[0];
        const res = await fetch(`/api/epis/${editId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            employeeId: form.employeeId,
            epiType: item.epiType,
            description: form.description,
            serialNumber: item.serialNumber || null,
            deliveredAt: item.deliveredAt,
            expiryDate: item.expiryDate,
            notes: form.notes || null,
          }),
        });
        if (!res.ok) throw new Error("Failed");
        toast.success("Atualizado com sucesso.");
      } else {
        const hasOriginal = Object.keys(originalEpiIds).length > 0;
        const operations: Promise<unknown>[] = [];

        if (hasOriginal) {
          for (const type of Object.keys(originalEpiIds)) {
            if (!epiItems[type]) {
              operations.push(fetch(`/api/epis/${originalEpiIds[type]}`, { method: "DELETE" }));
            }
          }
        }

        for (const item of itemList) {
          if (hasOriginal && originalEpiIds[item.epiType]) {
            operations.push(
              fetch(`/api/epis/${originalEpiIds[item.epiType]}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  employeeId: form.employeeId,
                  epiType: item.epiType,
                  description: form.description,
                  serialNumber: item.serialNumber || null,
                  deliveredAt: item.deliveredAt,
                  expiryDate: item.expiryDate,
                  notes: form.notes || null,
                }),
              }).then(async (res) => {
                if (!res.ok) throw new Error("Failed to update " + item.epiType);
                return res.json();
              })
            );
          } else {
            operations.push(
              fetch("/api/epis", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  employeeId: form.employeeId,
                  epiType: item.epiType,
                  description: form.description,
                  serialNumber: item.serialNumber || null,
                  deliveredAt: item.deliveredAt,
                  expiryDate: item.expiryDate,
                  notes: form.notes || null,
                }),
              }).then(async (res) => {
                if (!res.ok) throw new Error("Failed to create " + item.epiType);
                return res.json();
              })
            );
          }
        }

        await Promise.all(operations);
        toast.success(hasOriginal ? "EPIs atualizados com sucesso." : `${itemList.length} EPI(s) criado(s) com sucesso.`);
      }
      fetchData();
      setDialogOpen(false);
      resetDialog();
    } catch {
      toast.error(editId ? "Erro ao atualizar." : "Erro ao criar EPIs.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!deleteId) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/epis/${deleteId}`, { method: "DELETE" });
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

  const selectedTypes = Object.keys(epiItems);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">EPIs</h1>
        <Button onClick={() => { resetDialog(); setDialogOpen(true); }}>
          <Plus className="mr-1 h-4 w-4" />
          Novo EPI
        </Button>
      </div>

      <div className="flex flex-wrap items-end justify-center gap-2 p-3 bg-card border border-border rounded-lg">
        <div className="flex flex-col gap-0.5">
          <span className="text-xs text-muted-foreground">Colaborador</span>
          <input placeholder="Colaborador" value={filters.employee} onChange={e => setFilter("employee", e.target.value)} className="w-[160px] h-8 text-sm bg-background border border-border rounded px-2 text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-primary/50" />
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-xs text-muted-foreground">Tipo</span>
          <select value={filters.epiType} onChange={e => setFilter("epiType", e.target.value)} className="w-[130px] h-8 text-sm bg-background border border-border rounded px-2 text-foreground outline-none focus:border-primary/50">
            <option value="">Todos</option>
            {Object.entries(epiTypeLabel).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-xs text-muted-foreground">Descrição</span>
          <input placeholder="Descrição" value={filters.description} onChange={e => setFilter("description", e.target.value)} className="w-[160px] h-8 text-sm bg-background border border-border rounded px-2 text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-primary/50" />
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
          ) : displayedEpis.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">Nenhum EPI registado.</p>
          ) : (
            <div className="overflow-x-auto">
              <div className="min-w-[800px]">
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
                    {(() => {
                      const grouped: Record<string, { name: string; epis: EPI[] }> = {};
                          displayedEpis.forEach((epi) => {
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
                            <TableCell className="whitespace-nowrap text-sm">
                              {deliveries.length > 0 ? toDateInputValue(deliveries[0]) : "-"}
                            </TableCell>
                            <TableCell className="whitespace-nowrap text-sm">
                              <span className={expiries.length > 0 && isExpiringSoon(expiries[0]) ? "text-red-600 font-medium" : ""}>
                                {expiries.length > 0 ? toDateInputValue(expiries[0]) : "-"}
                              </span>
                            </TableCell>
                            <TableCell className="whitespace-nowrap text-sm">
                              <div className="flex items-center gap-1">
                                <Button variant="ghost" size="icon-xs" onClick={() => handleEditEmployeeGroup(employeeId, group.name, group.epis)} className="h-8 w-8">
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon-xs" onClick={() => setDeleteId(group.epis[0].id)} className="h-8 w-8">
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      });
                    })()}
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
            <DialogTitle>{editId ? "Editar EPI" : "Novo EPI"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Colaborador</Label>
              <Select value={form.employeeId} onValueChange={(v) => v && handleChange("employeeId", v)} items={employeeItems}>
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
            <div className="space-y-2">
              <Label htmlFor="epi-desc">Descrição</Label>
              <Input id="epi-desc" value={form.description} onChange={(e) => handleChange("description", e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label>Tipo(s) de EPI</Label>
              <div className="rounded-lg border p-3 space-y-1">
                {Object.entries(epiTypeLabel).map(([value, label]) => (
                  <label key={value} className="flex items-center gap-2 text-sm py-0.5 cursor-pointer">
                    <Checkbox
                      checked={!!epiItems[value]}
                      onCheckedChange={(checked) => handleTypeToggle(value, checked as boolean)}
                    />
                    {label}
                  </label>
                ))}
              </div>
            </div>

            {Object.entries(epiItems).map(([type, item]) => (
              <div key={type} className="space-y-3 rounded-lg border p-4 bg-muted/30">
                <p className="text-sm font-semibold">{epiTypeLabel[item.epiType]}</p>
                <div className="space-y-2">
                  <Label className="text-[10px]">N.º Série / Cód. Certificação</Label>
                  <Input
                    value={item.serialNumber}
                    onChange={(e) => updateEpiItem(type, "serialNumber", e.target.value)}
                    placeholder="Ex: EPI-2026-001"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label className="text-[10px]">Data Entrega</Label>
                    <Input
                      type="date"
                      value={item.deliveredAt}
                      onChange={(e) => updateEpiItem(type, "deliveredAt", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px]">Validade</Label>
                    <Input
                      type="date"
                      value={item.expiryDate}
                      onChange={(e) => updateEpiItem(type, "expiryDate", e.target.value)}
                    />
                  </div>
                </div>
              </div>
            ))}

            <div className="space-y-2">
              <Label htmlFor="epi-notes">Observações</Label>
              <Textarea id="epi-notes" value={form.notes} onChange={(e) => handleChange("notes", e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {editId ? (submitting ? "A guardar..." : "Guardar") : (submitting ? "A criar..." : "Criar")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
