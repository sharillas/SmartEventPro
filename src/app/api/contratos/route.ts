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
      prisma.employeeContract.findMany({
        where,
        skip,
        take,
        include: { employee: { select: { id: true, name: true } } },
        orderBy: { createdAt: "desc" },
      }),
      prisma.employeeContract.count({ where }),
    ]);

    return NextResponse.json(paginatedResponse(data, total, page, limit));
  } catch {
    return NextResponse.json({ error: "Erro ao buscar contratos" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  try {
    const body = await request.json();
    const contract = await prisma.employeeContract.create({
      data: {
        employeeId: body.employeeId,
        type: body.type || "SEM_PRAZO",
        startDate: new Date(body.startDate),
        endDate: body.endDate ? new Date(body.endDate) : null,
        salary: body.salary ?? 0,
        notes: body.notes,
      },
      include: { employee: { select: { id: true, name: true } } },
    });
    return NextResponse.json(contract, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Erro ao criar contrato" }, { status: 500 });
  }
}
