import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  try {
    const body = await request.json();
    const { quotationId } = body;

    if (!quotationId) {
      return NextResponse.json({ error: "quotationId é obrigatório" }, { status: 400 });
    }

    const quotation = await (prisma as any).quotation.findUnique({
      where: { id: quotationId },
      include: { client: true },
    });

    if (!quotation) {
      return NextResponse.json({ error: "Orçamento não encontrado" }, { status: 404 });
    }
    if (quotation.status !== "CONFIRMADO" && quotation.status !== "ORCAMENTADO") {
      return NextResponse.json({ error: "Orçamento não está aceite ou enviado" }, { status: 400 });
    }

    const existingInvoice = await (prisma as any).invoice.findUnique({
      where: { quotationId },
    });
    if (existingInvoice) {
      return NextResponse.json({ error: "Já existe uma fatura para este orçamento" }, { status: 409 });
    }

    const year = new Date().getFullYear();
    const count = await (prisma as any).invoice.count({
      where: { number: { startsWith: "FT_" } },
    });
    const number = `FT_${String(count + 1).padStart(4, "0")}-${year}`;

    const invoice = await (prisma as any).invoice.create({
      data: {
        number,
        quotationId: quotation.id,
        clientId: quotation.clientId,
        projectId: quotation.projectId,
        date: new Date(),
        subtotal: quotation.subtotal,
        taxRate: quotation.taxRate,
        taxAmount: quotation.taxAmount,
        total: quotation.total,
        status: "PENDENTE",
      },
    });

    return NextResponse.json(invoice, { status: 201 });
  } catch (e) {
    console.error("Erro ao gerar fatura:", e);
    return NextResponse.json({ error: "Erro ao gerar fatura" }, { status: 500 });
  }
}
