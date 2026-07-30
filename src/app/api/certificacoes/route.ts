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
        { name: { contains: search } },
        { issuingEntity: { contains: search } },
        { employee: { name: { contains: search } } },
      ];
    }

    const [data, total] = await Promise.all([
      prisma.employeeCertification.findMany({
        where: where as never,
        skip,
        take,
        include: { employee: { select: { name: true } } },
        orderBy: { expiryDate: "asc" },
      }),
      prisma.employeeCertification.count({ where: where as never }),
    ]);

    return NextResponse.json(paginatedResponse(data, total, page, limit));
  } catch (error) {
    return NextResponse.json({ error: "Erro ao buscar certificações" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  try {
    const body = await request.json();
    console.log("POST certificacao body:", JSON.stringify(body));
    const data: Record<string, unknown> = {
      employeeId: body.employeeId,
      name: body.name,
      issueDate: new Date(body.issueDate || new Date()).toISOString(),
    };
    if (body.issuingEntity) data.issuingEntity = body.issuingEntity;
    if (body.expiryDate) data.expiryDate = new Date(body.expiryDate).toISOString();
    if (body.documentUrl) data.documentUrl = body.documentUrl;
    if (body.notes) data.notes = body.notes;
    console.log("POST certificacao data:", JSON.stringify(data));

    const certification = await prisma.employeeCertification.create({ data: data as never });
    return NextResponse.json(certification, { status: 201 });
  } catch (error) {
    console.error("POST certificacao error:", error);
    return NextResponse.json({ error: "Erro ao criar certificação" }, { status: 500 });
  }
}
