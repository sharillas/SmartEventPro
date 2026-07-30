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

    const where: Record<string, unknown> = { active: true };
    if (search) {
      where.name = { contains: search };
    }

    const [data, total] = await Promise.all([
      prisma.department.findMany({ where, skip, take, orderBy: { name: "asc" } }),
      prisma.department.count({ where }),
    ]);

    return NextResponse.json(paginatedResponse(data, total, page, limit));
  } catch {
    return NextResponse.json({ error: "Erro ao buscar departamentos" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  try {
    const body = await request.json();
    const dept = await prisma.department.create({ data: { name: body.name } });
    return NextResponse.json(dept, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Erro ao criar departamento" }, { status: 500 });
  }
}
