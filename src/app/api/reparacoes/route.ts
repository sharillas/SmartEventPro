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
      where.OR = [
        { number: { contains: search } },
        { description: { contains: search } },
      ];
    }

    const [data, total] = await Promise.all([
      prisma.repairGuide.findMany({ where, skip, take, orderBy: { createdAt: "desc" } }),
      prisma.repairGuide.count({ where }),
    ]);

    return NextResponse.json(paginatedResponse(data, total, page, limit));
  } catch (error) {
    return NextResponse.json({ error: "Erro ao buscar reparações" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  try {
    const body = await request.json();
    const year = new Date().getFullYear();
    const count = await prisma.repairGuide.count({
      where: { number: { startsWith: `RP_` } },
    });
    const number = `RP_${String(count + 1).padStart(4, "0")}-${year}`;

    const repair = await prisma.repairGuide.create({
      data: {
        number,
        description: body.description,
        reportedBy: body.reportedBy,
        externalRepairer: body.externalRepairer,
        notes: body.notes,
      },
    });
    return NextResponse.json(repair, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Erro ao criar guia de reparação" }, { status: 500 });
  }
}
