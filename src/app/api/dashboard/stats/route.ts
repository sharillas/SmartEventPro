import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const [
    equipmentAvailable,
    activeProjects,
    equipmentInRepair,
    expiringEPIs,
    vehiclesInRepair,
    activeTechnicians,
  ] = await Promise.all([
    prisma.equipment.count({ where: { status: "DISPONIVEL", active: true } }),
    prisma.project.count({ where: { status: { in: ["CONFIRMADO", "EM_CURSO"] } } }),
    prisma.equipment.count({ where: { status: "EM_REPARACAO", active: true } }),
    prisma.employeeEPI.count({
      where: {
        expiryDate: {
          lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          gte: new Date(),
        },
      },
    }),
    prisma.vehicle.count({ where: { status: "EM_MANUTENCAO", active: true } }),
    prisma.employee.count({
      where: {
        active: true,
        position: { in: ["TECNICO_SOM", "TECNICO_VIDEO", "TECNICO_ILUMINACAO", "TECNICO_ESTRUTURAS"] },
      },
    }),
  ]);

  return NextResponse.json({
    equipmentAvailable,
    activeProjects,
    equipmentInRepair,
    expiringEPIs,
    vehiclesInRepair,
    activeTechnicians,
  });
}
