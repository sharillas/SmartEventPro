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
    if (search) where.name = { contains: search };

    const [data, total] = await Promise.all([
      prisma.employee.findMany({ where, skip, take, orderBy: { createdAt: "desc" } }),
      prisma.employee.count({ where }),
    ]);

    return NextResponse.json(paginatedResponse(data, total, page, limit));
  } catch {
    return NextResponse.json({ error: "Erro ao buscar colaboradores" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  try {
    const body = await request.json();
    const data: Record<string, unknown> = {
      name: body.name,
      position: body.position,
      hourlyRate: body.hourlyRate ?? 0,
      dailyRate: body.dailyRate ?? 0,
    };
    if (body.email) data.email = body.email;
    if (body.phone) data.phone = body.phone;
    if (body.nif) data.nif = body.nif;
    if (body.address) data.address = body.address;
    if (body.department) data.department = body.department;
    if (body.startDate) data.startDate = new Date(body.startDate).toISOString();
    if (body.notes) data.notes = body.notes;
    if (body.status) data.status = body.status;

    const employee = await prisma.employee.create({ data: data as never });
    return NextResponse.json(employee, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Erro ao criar colaborador" }, { status: 500 });
  }
}
