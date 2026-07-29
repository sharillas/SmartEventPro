import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  try {
    const notes = await prisma.orderNote.findMany({
      include: {
        supplier: { select: { name: true } },
        items: true,
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(notes);
  } catch {
    return NextResponse.json({ error: "Erro ao buscar notas de encomenda" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  try {
    const body = await request.json();
    const year = new Date().getFullYear();
    const count = await prisma.orderNote.count();
    const number = `NE_${String(count + 1).padStart(4, "0")}-${year}`;

    const data: Record<string, unknown> = {
      number,
      department: body.department || null,
      projectCode: body.projectCode || null,
      fixedAsset: body.fixedAsset ?? false,
      notes: body.notes || null,
      subtotal: body.subtotal ?? 0,
      taxAmount: body.taxAmount ?? 0,
      total: body.total ?? 0,
    };

    if (body.supplierId) data.supplierId = body.supplierId;

    if (body.items && body.items.length > 0) {
      data.items = {
        create: body.items.map((i: { description: string; quantity: number; unitPrice: number; taxRate: number; taxAmount: number; total: number }) => ({
          description: i.description,
          quantity: i.quantity || 1,
          unitPrice: i.unitPrice || 0,
          taxRate: i.taxRate ?? 23,
          taxAmount: i.taxAmount || 0,
          total: i.total || 0,
        })),
      };
    }

    const note = await prisma.orderNote.create({
      data: data as never,
      include: { items: true, supplier: { select: { name: true } } },
    });
    return NextResponse.json(note, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Erro ao criar nota de encomenda" }, { status: 500 });
  }
}
