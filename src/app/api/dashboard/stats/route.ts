import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const [
    totalEquipment,
    equipmentAvailable,
    equipmentRented,
    equipmentInRepair,
    activeProjects,
    pendingQuotations,
    pendingRepairs,
    overdueInvoices,
    totalEmployees,
    pendingTransports,
  ] = await Promise.all([
    prisma.equipment.count({ where: { active: true } }),
    prisma.equipment.count({ where: { status: "DISPONIVEL", active: true } }),
    prisma.equipment.count({ where: { status: "ALUGADO", active: true } }),
    prisma.equipment.count({ where: { status: "EM_REPARACAO", active: true } }),
    prisma.project.count({ where: { status: { in: ["CONFIRMADO", "EM_CURSO"] } } }),
    prisma.quotation.count({ where: { status: "RASCUNHO" } }),
    prisma.repairGuide.count({ where: { status: { in: ["PENDENTE", "EM_REPARACAO"] } } }),
    prisma.invoice.count({ where: { status: "VENCIDO" } }),
    prisma.employee.count({ where: { active: true } }),
    prisma.transportGuide.count({ where: { status: { in: ["PENDENTE", "EM_TRANSITO"] } } }),
  ]);

  return NextResponse.json({
    totalEquipment,
    equipmentAvailable,
    equipmentRented,
    equipmentInRepair,
    activeProjects,
    pendingQuotations,
    pendingRepairs,
    overdueInvoices,
    totalEmployees,
    pendingTransports,
  });
}
