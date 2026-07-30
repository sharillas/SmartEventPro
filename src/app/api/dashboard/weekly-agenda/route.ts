import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  try {
    const url = new URL(request.url);
    const refDate = url.searchParams.get("date");
    const now = refDate ? new Date(refDate) : new Date();
    const day = now.getDay();
    const monday = new Date(now);
    monday.setDate(now.getDate() - (day === 0 ? 6 : day - 1));
    monday.setHours(0, 0, 0, 0);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 7);

    const quotations = await prisma.quotation.findMany({
      where: {
        status: { in: ["CONFIRMADO", "ORCAMENTADO", "DRAFT"] },
        startDate: { not: null },
        endDate: { not: null },
        OR: [
          { startDate: { gte: monday, lt: sunday } },
          { endDate: { gte: monday, lt: sunday } },
          { startDate: { lte: monday }, endDate: { gte: sunday } },
        ],
      },
      include: {
        client: { select: { id: true, name: true } },
      },
      orderBy: { startDate: "asc" },
    });

    const events = quotations.map((q) => ({
      id: q.id,
      name: q.client?.name || "Orçamento",
      number: q.number,
      location: q.location || "",
      startDate: q.startDate,
      endDate: q.endDate,
      status: q.status,
      client: q.client,
      quotations: [{ number: q.number }],
    }));

    return NextResponse.json(events);
  } catch {
    return NextResponse.json({ error: "Erro ao buscar agenda" }, { status: 500 });
  }
}
