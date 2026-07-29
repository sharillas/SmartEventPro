import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const projects = await prisma.project.findMany({
    where: {
      startDate: { gte: new Date() },
      status: { in: ["CONFIRMADO", "EM_CURSO"] },
    },
    take: 6,
    orderBy: { startDate: "asc" },
    include: { client: { select: { name: true } } },
  });

  return NextResponse.json(
    projects.map((p) => ({
      id: p.id,
      name: p.name,
      number: p.number,
      clientName: p.client?.name || "—",
      startDate: p.startDate,
      endDate: p.endDate,
      status: p.status,
    }))
  );
}
