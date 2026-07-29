import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  try {
    const invoices = await prisma.invoice.findMany({
      include: {
        client: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(invoices);
  } catch (error) {
    return NextResponse.json({ error: "Erro ao buscar faturas" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  try {
    const body = await request.json();
    const year = new Date().getFullYear();
    const count = await prisma.invoice.count({
      where: { number: { startsWith: `FT_` } },
    });
    const number = `FT_${String(count + 1).padStart(4, "0")}-${year}`;

    const data: Record<string, unknown> = {
      number,
      date: body.date ? new Date(body.date).toISOString() : new Date().toISOString(),
      subtotal: body.subtotal ?? 0,
      taxRate: body.taxRate ?? 0,
      total: body.total ?? 0,
    };
    if (body.clientId) data.clientId = body.clientId;
    if (body.projectId) data.projectId = body.projectId;
    if (body.quotationId) data.quotationId = body.quotationId;
    if (body.dueDate) data.dueDate = new Date(body.dueDate).toISOString();
    if (body.notes) data.notes = body.notes;

    const invoice = await prisma.invoice.create({ data: data as never });
    return NextResponse.json(invoice, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Erro ao criar fatura" }, { status: 500 });
  }
}
