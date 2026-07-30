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
      prisma.absence.findMany({
        where,
        skip,
        take,
        include: { employee: { select: { id: true, name: true } } },
        orderBy: { startDate: "desc" },
      }),
      prisma.absence.count({ where }),
    ]);

    return NextResponse.json(paginatedResponse(data, total, page, limit));
  } catch {
    return NextResponse.json({ error: "Erro ao buscar ausências" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  try {
    const body = await request.json();
    const data: Record<string, unknown> = {
      employeeId: body.employeeId,
      type: body.type,
      startDate: new Date(body.startDate),
      endDate: new Date(body.endDate),
    };
    if (body.notes) data.notes = body.notes;
    if (body.status) data.status = body.status;

    const absence = await prisma.absence.create({
      data: data as never,
      include: { employee: { select: { id: true, name: true } } },
    });
    return NextResponse.json(absence, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Erro ao criar ausência" }, { status: 500 });
  }
}
