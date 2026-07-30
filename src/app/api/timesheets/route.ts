import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { getPaginationParams, paginatedResponse } from "@/lib/pagination";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  try {
    const { page, limit, skip, take } = getPaginationParams({
      page: request.nextUrl.searchParams.get("page"),
      limit: request.nextUrl.searchParams.get("limit"),
    });
    const search = request.nextUrl.searchParams.get("search");

    const where: Record<string, unknown> = {};
    if (search) {
      where.employee = { name: { contains: search } };
    }

    const [data, total] = await Promise.all([
      prisma.timeSheet.findMany({
        where,
        skip,
        take,
        include: { employee: { select: { id: true, name: true } }, project: { select: { id: true, name: true, number: true } } },
        orderBy: { date: "desc" },
      }),
      prisma.timeSheet.count({ where }),
    ]);

    return NextResponse.json(paginatedResponse(data, total, page, limit));
  } catch {
    return NextResponse.json({ error: "Erro ao buscar folhas de horas" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  try {
    const body = await request.json();
    const startTime = body.startTime || "00:00";
    const endTime = body.endTime || "00:00";
    const [sh, sm] = startTime.split(":").map(Number);
    const [eh, em] = endTime.split(":").map(Number);
    const hours = (eh + em / 60) - (sh + sm / 60);

    const ts = await prisma.timeSheet.create({
      data: {
        employeeId: body.employeeId,
        date: new Date(body.date),
        startTime,
        endTime,
        projectId: body.projectId || null,
        hours: hours > 0 ? hours : 0,
        notes: body.notes,
      },
      include: { employee: { select: { id: true, name: true } } },
    });
    return NextResponse.json(ts, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Erro ao criar registo" }, { status: 500 });
  }
}
