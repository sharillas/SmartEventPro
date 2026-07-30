"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Package, Briefcase, Wrench, Shield, Car, Users, ChevronLeft, ChevronRight } from "lucide-react";

interface Stats {
  equipmentAvailable: number;
  activeProjects: number;
  equipmentInRepair: number;
  expiringEPIs: number;
  vehiclesInRepair: number;
  activeTechnicians: number;
}

interface AgendaEvent {
  id: string; name: string; number: string; location: string;
  startDate: string; endDate: string; status: string;
  client: { name: string } | null;
  quotations: { number: string }[];
}

const statusBadge: Record<string, string> = {
  CONFIRMADO: "border-green-500 text-green-400 bg-green-500/5",
  EM_CURSO: "border-green-500 text-green-400 bg-green-500/5",
  RASCUNHO: "border-gray-500 text-gray-400 bg-gray-500/5",
  CANCELADO: "border-red-500 text-red-400 bg-red-500/5",
  DRAFT: "border-gray-500 text-gray-400 bg-gray-500/5",
};

const FERIADOS_2026: Record<string, string> = {
  "2026-01-01": "Ano Novo",
  "2026-04-03": "Sexta-Feira Santa",
  "2026-04-05": "Páscoa",
  "2026-04-25": "Dia da Liberdade",
  "2026-05-01": "Dia do Trabalhador",
  "2026-06-10": "Dia de Portugal",
  "2026-06-11": "Corpo de Deus",
  "2026-08-15": "Assunção de Nossa Senhora",
  "2026-10-05": "Implantação da República",
  "2026-11-01": "Todos os Santos",
  "2026-12-01": "Restauração da Independência",
  "2026-12-08": "Imaculada Conceição",
  "2026-12-25": "Natal",
};

function isHoliday(date: Date) {
  const key = date.toISOString().split("T")[0];
  return FERIADOS_2026[key] || null;
}

function getWeekDays(offset: number = 0) {
  const now = new Date();
  const day = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - (day === 0 ? 6 : day - 1) + offset * 7);
  monday.setHours(0, 0, 0, 0);
  const days: { date: Date; label: string; shortLabel: string; isToday: boolean; isWeekend: boolean; holiday: string | null }[] = [];
  const labels = ["Segunda-Feira", "Terça-Feira", "Quarta-Feira", "Quinta-Feira", "Sexta-Feira", "Sábado", "Domingo"];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const today = new Date();
    days.push({
      date: d,
      label: labels[i],
      shortLabel: labels[i].substring(0, 3),
      isToday: d.toDateString() === today.toDateString(),
      isWeekend: i >= 5,
      holiday: isHoliday(d),
    });
  }
  return days;
}

function getEventsForDay(events: AgendaEvent[], date: Date) {
  const dayStart = new Date(date);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(date);
  dayEnd.setHours(23, 59, 59, 999);
  return events.filter((e) => {
    const start = new Date(e.startDate);
    const end = new Date(e.endDate);
    return start <= dayEnd && end >= dayStart;
  });
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [agenda, setAgenda] = useState<AgendaEvent[]>([]);
  const [role, setRole] = useState("");
  const [hoveredEvent, setHoveredEvent] = useState<AgendaEvent | null>(null);
  const [hoverPos, setHoverPos] = useState({ x: 0, y: 0 });
  const [loading, setLoading] = useState(true);
  const [weekOffset, setWeekOffset] = useState(0);

  const weekDays = getWeekDays(weekOffset);
  const weekMonday = weekDays[0]?.date; // usado para o fetch da agenda

  useEffect(() => {
    async function fetchData() {
      try {
        const [s, a, me] = await Promise.all([
          fetch("/api/dashboard/stats").then((r) => r.json()),
          fetch(`/api/dashboard/weekly-agenda?date=${weekMonday?.toISOString() || ""}`).then((r) => r.json()),
          fetch("/api/auth/me").then((r) => r.json()),
        ]);
        setStats(s);
        setAgenda(Array.isArray(a) ? a : []);
        if (me.user) setRole(me.user.role);
      } catch {}
      setLoading(false);
    }
    fetchData();
  }, [weekOffset]);

  if (loading) return <div className="flex min-h-[60vh] items-center justify-center"><p className="text-muted-foreground">A carregar...</p></div>;

  const roleLabel: Record<string, string> = {
    ADMIN: "Administração", COMERCIAL: "Comercial", LOGISTICA: "Logística",
    FINANCEIRO: "Financeiro", RH: "Recursos Humanos", TECNICO: "Técnico",
  };

  const kpis = [
    { label: "Equipamentos Disponíveis", value: stats?.equipmentAvailable ?? 0, icon: Package, color: "text-blue-600" },
    { label: "Eventos Ativos", value: stats?.activeProjects ?? 0, icon: Briefcase, color: "text-indigo-600" },
    { label: "Equip. em Reparação", value: stats?.equipmentInRepair ?? 0, icon: Wrench, color: "text-yellow-600" },
    { label: "EPIs a Caducar", value: stats?.expiringEPIs ?? 0, icon: Shield, color: "text-red-500" },
    { label: "Veículos em Reparação", value: stats?.vehiclesInRepair ?? 0, icon: Car, color: "text-purple-600" },
    { label: "Técnicos Ativos", value: stats?.activeTechnicians ?? 0, icon: Users, color: "text-green-600" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          {role && <p className="text-sm text-muted-foreground">{roleLabel[role] || role}</p>}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {kpis.map((kpi) => (
          <Card key={kpi.label}>
            <CardContent className="flex items-center gap-3 pt-4 pb-4">
              <div className={`flex h-12 w-12 items-center justify-center rounded-lg bg-muted ${kpi.color}`}>
                <kpi.icon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground leading-tight">{kpi.label}</p>
                <p className="text-3xl font-bold">{kpi.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Weekly Agenda */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Agenda Semanal</CardTitle>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">
                {weekDays[0]?.date.toLocaleDateString("pt-PT", { day: "numeric", month: "short" })} –{" "}
                {weekDays[6]?.date.toLocaleDateString("pt-PT", { day: "numeric", month: "short" })}
              </span>
              <div className="flex gap-0.5">
                <Button variant="outline" size="icon-xs" className="h-7 w-7" onClick={() => setWeekOffset((o) => o - 1)}>
                  <ChevronLeft className="h-3.5 w-3.5" />
                </Button>
                <Button variant="outline" size="icon-xs" className="h-7 w-7" onClick={() => setWeekOffset(0)} disabled={weekOffset === 0}>
                  Hoje
                </Button>
                <Button variant="outline" size="icon-xs" className="h-7 w-7" onClick={() => setWeekOffset((o) => o + 1)}>
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-1">
            {weekDays.map((day) => {
              const dayEvents = getEventsForDay(agenda, day.date);
              return (
                <div
                  key={day.label}
                  className={`rounded-lg border min-h-[130px] p-1.5 ${
                    day.holiday ? "border-yellow-500/50 bg-yellow-500/5" :
                    day.isWeekend ? (day.label === "Domingo" ? "border-red-500/30 bg-red-500/5" : "border-muted-foreground/20 bg-muted/20") :
                    day.isToday ? "border-primary ring-1 ring-primary" : "border-border"
                  }`}
                >
                  <div className={`text-sm font-semibold mb-1 text-center ${
                    day.holiday ? "text-yellow-600" :
                    day.isWeekend ? (day.label === "Domingo" ? "text-red-400" : "text-muted-foreground") :
                    day.isToday ? "text-primary" : "text-muted-foreground"
                  }`}>
                    <span className="hidden sm:inline">{day.label}</span>
                    <span className="sm:hidden">{day.shortLabel}</span>
                    <span className="ml-1 font-bold text-base">{day.date.getDate()}</span>
                  </div>
                  {day.holiday && (
                    <div className="text-[10px] text-yellow-600 text-center mb-1">{day.holiday}</div>
                  )}
                  <div className="space-y-0.5">
                    {dayEvents.map((event) => (
                      <div
                        key={event.id}
                        className={`text-[10px] leading-tight px-1 py-0.5 rounded border cursor-pointer truncate ${
                          statusBadge[event.status] || "border-gray-500 text-gray-400"
                        }`}
                        onMouseEnter={(e) => {
                          setHoveredEvent(event);
                          setHoverPos({ x: e.clientX, y: e.clientY });
                        }}
                        onMouseLeave={() => setHoveredEvent(null)}
                      >
                        {event.quotations?.[0]?.number || event.number}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Popup */}
          {hoveredEvent && (
            <div
              className="fixed z-50 bg-popover border border-border rounded-lg shadow-lg p-3 text-sm max-w-[280px]"
              style={{ left: hoverPos.x + 10, top: hoverPos.y + 10 }}
            >
              <p className="font-bold">{hoveredEvent.quotations?.[0]?.number || hoveredEvent.number}</p>
              <p className="text-muted-foreground">{hoveredEvent.name}</p>
              {hoveredEvent.client && <p className="text-muted-foreground">Cliente: {hoveredEvent.client.name}</p>}
              {hoveredEvent.location && <p className="text-muted-foreground">Local: {hoveredEvent.location}</p>}
              <p className="text-muted-foreground text-xs mt-1">
                {new Date(hoveredEvent.startDate).toLocaleDateString("pt-PT")} – {new Date(hoveredEvent.endDate).toLocaleDateString("pt-PT")}
              </p>
            </div>
          )}

          {/* Legend */}
          <div className="flex gap-4 mt-4 justify-center flex-wrap">
            {[
              { label: "Confirmado", className: "border-green-500 text-green-400 bg-green-500/5" },
              { label: "Draft", className: "border-gray-500 text-gray-400 bg-gray-500/5" },
              { label: "Cancelado", className: "border-red-500 text-red-400 bg-red-500/5" },
              { label: "Feriado", className: "border-yellow-500 text-yellow-600 bg-yellow-500/5" },
            ].map((l) => (
              <div key={l.label} className="flex items-center gap-1.5">
                <span className={`inline-block w-3 h-3 rounded border ${l.className}`} />
                <span className="text-xs text-muted-foreground">{l.label}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
