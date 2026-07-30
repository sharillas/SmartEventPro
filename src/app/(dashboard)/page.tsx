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
import { Package, Briefcase, Wrench, Truck, Users } from "lucide-react";
import { STATUS_COLORS, STATUS_LABELS, formatDate } from "@/lib/helpers";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface Stats {
  totalEquipment: number;
  equipmentAvailable: number;
  equipmentRented: number;
  equipmentInRepair: number;
  activeProjects: number;
  pendingQuotations: number;
  pendingRepairs: number;
  overdueInvoices: number;
  totalEmployees: number;
  pendingTransports: number;
}

interface RecentProject {
  id: string;
  name: string;
  number: string;
  clientName: string;
  status: string;
  startDate: string;
  endDate: string;
}

interface LowStockItem {
  id: string;
  name: string;
  sku: string;
  quantity: number;
  minStock: number;
}

interface UpcomingEvent {
  id: string;
  name: string;
  number: string;
  clientName: string;
  startDate: string;
  endDate: string;
  status: string;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentProjects, setRecentProjects] = useState<RecentProject[]>([]);
  const [lowStock, setLowStock] = useState<LowStockItem[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<UpcomingEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const [statsRes, projectsRes, stockRes, eventsRes] = await Promise.all([
          fetch("/api/dashboard/stats"),
          fetch("/api/dashboard/recent-projects"),
          fetch("/api/dashboard/low-stock"),
          fetch("/api/dashboard/upcoming-events"),
        ]);

        if (!statsRes.ok || !projectsRes.ok || !stockRes.ok || !eventsRes.ok) {
          throw new Error("Failed to fetch");
        }

        const [
          statsData,
          projectsData,
          stockData,
          eventsData,
        ] = await Promise.all([
          statsRes.json(),
          projectsRes.json(),
          stockRes.json(),
          eventsRes.json(),
        ]);

        setStats(statsData);
        setRecentProjects(projectsData);
        setLowStock(stockData);
        setUpcomingEvents(eventsData);
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

  const statCards = [
    {
      label: "Equipamentos",
      value: stats?.totalEquipment ?? 0,
      icon: Package,
      color: "text-blue-600",
    },
    {
      label: "Projetos Ativos",
      value: stats?.activeProjects ?? 0,
      icon: Briefcase,
      color: "text-indigo-600",
    },
    {
      label: "Reparações Pendentes",
      value: stats?.pendingRepairs ?? 0,
      icon: Wrench,
      color: "text-yellow-600",
    },
    {
      label: "Transportes Pendentes",
      value: stats?.pendingTransports ?? 0,
      icon: Truck,
      color: "text-purple-600",
    },
    {
      label: "Colaboradores",
      value: stats?.totalEmployees ?? 0,
      icon: Users,
      color: "text-green-600",
    },
  ];

  const lowStockFiltered = lowStock.filter((item) => item.quantity <= item.minStock);

  const equipmentChartData = [
    { name: "Disponível", value: stats?.equipmentAvailable ?? 0, color: "#22c55e" },
    { name: "Alugado", value: stats?.equipmentRented ?? 0, color: "#3b82f6" },
    { name: "Em Reparação", value: stats?.equipmentInRepair ?? 0, color: "#eab308" },
  ].filter((d) => d.value > 0);

  const overviewChartData = [
    { name: "Projetos Ativos", value: stats?.activeProjects ?? 0, fill: "#6366f1" },
    { name: "Orç. Pendentes", value: stats?.pendingQuotations ?? 0, fill: "#3b82f6" },
    { name: "Rep. Pendentes", value: stats?.pendingRepairs ?? 0, fill: "#eab308" },
    { name: "Faturas Vencidas", value: stats?.overdueInvoices ?? 0, fill: "#ef4444" },
    { name: "Transp. Pendentes", value: stats?.pendingTransports ?? 0, fill: "#8b5cf6" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {statCards.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="flex items-center gap-4 pt-6">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-lg bg-muted ${stat.color}`}
              >
                <stat.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className="text-2xl font-semibold">{stat.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Estado dos Equipamentos</CardTitle>
          </CardHeader>
          <CardContent>
            {equipmentChartData.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">Sem dados.</p>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={equipmentChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {equipmentChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "0.5rem",
                    }}
                    labelStyle={{ color: "hsl(var(--foreground))" }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Visão Geral</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={overviewChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  angle={-30}
                  textAnchor="end"
                  height={60}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "0.5rem",
                  }}
                  labelStyle={{ color: "hsl(var(--foreground))" }}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {overviewChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Projetos Recentes</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Projeto</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Data</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentProjects.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                      Sem projetos recentes.
                    </TableCell>
                  </TableRow>
                ) : (
                  recentProjects.map((project) => (
                    <TableRow key={project.id}>
                      <TableCell className="font-medium">
                        {project.number} - {project.name}
                      </TableCell>
                      <TableCell>{project.clientName}</TableCell>
                      <TableCell>
                        <Badge className={STATUS_COLORS[project.status] ?? ""}>
                          {STATUS_LABELS[project.status] ?? project.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDate(project.startDate)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Alertas de Stock</CardTitle>
          </CardHeader>
          <CardContent>
            {lowStockFiltered.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Sem alertas de stock.
              </p>
            ) : (
              <div className="space-y-3">
                {lowStockFiltered.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div>
                      <p className="font-medium text-sm">{item.name}</p>
                      <p className="text-xs text-muted-foreground">{item.sku}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-destructive">
                        {item.quantity}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        mín. {item.minStock}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Próximos Eventos</CardTitle>
        </CardHeader>
        <CardContent>
          {upcomingEvents.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Sem eventos próximos.
            </p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {upcomingEvents.map((event) => (
                <Card key={event.id} size="sm">
                  <CardContent className="space-y-2 pt-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-medium text-sm">
                          {event.number} - {event.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {event.clientName}
                        </p>
                      </div>
                      <Badge className={STATUS_COLORS[event.status] ?? ""}>
                        {STATUS_LABELS[event.status] ?? event.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(event.startDate)} – {formatDate(event.endDate)}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
