import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  try {
    const body = await request.json();
    const year = new Date().getFullYear();

    const quotationCount = await prisma.quotation.count({
      where: { number: { startsWith: `PR_` } },
    });
    const number = `PR_${String(quotationCount + 1).padStart(4, "0")}-${year}`;

    const data: Record<string, unknown> = {
      number,
      clientId: body.clientId || null,
      location: body.location || null,
      startDate: body.startDate ? new Date(body.startDate).toISOString() : null,
      endDate: body.endDate ? new Date(body.endDate).toISOString() : null,
      subtotal: body.subtotal || 0,
      taxRate: body.taxRate || 23,
      taxAmount: body.taxAmount || 0,
      discount: body.discount || 0,
      total: body.total || 0,
      notes: body.notes || "",
    };

    if (body.items && body.items.length > 0) {
      data.items = {
        create: body.items.map((item: any) => ({
          type: item.type,
          referenceId: item.referenceId || null,
          description: item.description,
          quantity: item.quantity || 1,
          unitPrice: item.unitPrice || 0,
          taxRate: item.taxRate || 23,
          total: item.total || 0,
        })),
      };
    }

    const quotation = await prisma.quotation.create({
      data: data as never,
      include: { items: true, client: true },
    });

    return NextResponse.json(quotation, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar orçamento:", error);
    return NextResponse.json({ error: "Erro ao criar orçamento." }, { status: 500 });
  }
}
