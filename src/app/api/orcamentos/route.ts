import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  try {
    const quotations = await prisma.quotation.findMany({
      include: { client: { select: { id: true, name: true, companyName: true } } },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(quotations);
  } catch (error) {
    return NextResponse.json({ error: "Erro ao buscar orçamentos" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  try {
    const body = await request.json();
    const year = new Date().getFullYear();
    const count = await prisma.quotation.count({
      where: { number: { startsWith: `PR_` } },
    });
    const number = `PR_${String(count + 1).padStart(4, "0")}-${year}`;

    const data: Record<string, unknown> = {
      number,
      date: body.date ? new Date(body.date).toISOString() : new Date().toISOString(),
      subtotal: body.subtotal ?? 0,
      taxRate: body.taxRate ?? 0,
      discount: body.discount ?? 0,
      total: body.total ?? 0,
    };
    if (body.clientId) data.clientId = body.clientId;
    if (body.location) data.location = body.location;
    if (body.startDate) data.startDate = new Date(body.startDate).toISOString();
    if (body.endDate) data.endDate = new Date(body.endDate).toISOString();
    if (body.validUntil) data.validUntil = new Date(body.validUntil).toISOString();
    if (body.notes) data.notes = body.notes;

    const quotation = await prisma.quotation.create({ data: data as never });
    return NextResponse.json(quotation, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Erro ao criar orçamento" }, { status: 500 });
  }
}
