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
    const quotation = await prisma.quotation.findUnique({
      where: { number: id },
      include: { items: true, client: true },
    });
    if (!quotation) return NextResponse.json({ error: "Orçamento não encontrado" }, { status: 404 });
    return NextResponse.json(quotation);
  } catch {
    return NextResponse.json({ error: "Erro ao buscar orçamento" }, { status: 500 });
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
    if (body.status) data.status = body.status;
    if (body.notes !== undefined) data.notes = body.notes;

    const quotation = await prisma.quotation.update({
      where: { number: id },
      data: data as never,
    });

    return NextResponse.json(quotation);
  } catch {
    return NextResponse.json({ error: "Erro ao atualizar orçamento" }, { status: 500 });
  }
}
