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
    const type = request.nextUrl.searchParams.get("type");

    const where: Record<string, unknown> = { active: true };
    if (search) where.name = { contains: search };
    if (type) where.serviceType = type;

    const [data, total] = await Promise.all([
      prisma.service.findMany({ where, skip, take, orderBy: { createdAt: "desc" } }),
      prisma.service.count({ where }),
    ]);

    return NextResponse.json(paginatedResponse(data, total, page, limit));
  } catch (error) {
    return NextResponse.json({ error: "Erro ao buscar serviços" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  try {
    const body = await request.json();
    const service = await prisma.service.create({
      data: {
        name: body.name,
        description: body.description,
        category: body.category,
        defaultPrice: body.defaultPrice,
        unit: body.unit,
        serviceType: body.serviceType || "EXTERNO",
      } as never,
    });
    return NextResponse.json(service, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Erro ao criar serviço" }, { status: 500 });
  }
}
