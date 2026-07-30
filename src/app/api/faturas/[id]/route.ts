import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  try {
    const { id } = await params;
    const record = await prisma.invoice.findUnique({
      where: { id },
    });
    if (!record) return NextResponse.json({ error: "Fatura não encontrada" }, { status: 404 });
    return NextResponse.json(record);
  } catch {
    return NextResponse.json({ error: "Erro ao buscar fatura" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  try {
    const { id } = await params;
    const body = await request.json();
    const data: Record<string, unknown> = {};
    if (body.clientId) data.clientId = body.clientId;
    if (body.projectId) data.projectId = body.projectId;
    if (body.quotationId) data.quotationId = body.quotationId;
    if (body.date) data.date = new Date(body.date).toISOString();
    if (body.dueDate) data.dueDate = new Date(body.dueDate).toISOString();
    if (body.status) data.status = body.status;
    if (body.subtotal !== undefined && body.subtotal !== "") data.subtotal = Number(body.subtotal);
    if (body.taxRate !== undefined && body.taxRate !== "") data.taxRate = Number(body.taxRate);
    if (body.taxAmount !== undefined && body.taxAmount !== "") data.taxAmount = Number(body.taxAmount);
    if (body.total !== undefined && body.total !== "") data.total = Number(body.total);
    if (body.notes !== undefined) data.notes = body.notes;
    const record = await prisma.invoice.update({
      where: { id },
      data: data as never,
    });
    return NextResponse.json(record);
  } catch {
    return NextResponse.json({ error: "Erro ao atualizar fatura" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  try {
    const { id } = await params;
    await prisma.invoice.delete({
      where: { id },
    });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Erro ao eliminar fatura" }, { status: 500 });
  }
}
