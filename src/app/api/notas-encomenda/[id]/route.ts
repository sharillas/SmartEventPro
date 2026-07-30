import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  try {
    const { id } = await params;
    const note = await prisma.orderNote.findUnique({
      where: { number: id },
      include: { items: true, supplier: { select: { id: true, name: true, companyName: true } } },
    });
    if (!note) return NextResponse.json({ error: "Não encontrada" }, { status: 404 });
    return NextResponse.json(note);
  } catch { return NextResponse.json({ error: "Erro" }, { status: 500 }); }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  try {
    const { id } = await params;
    const body = await request.json();
    const data: Record<string, unknown> = {};
    if (body.status) data.status = body.status;
    if (body.notes !== undefined) data.notes = body.notes;
    const note = await prisma.orderNote.update({ where: { id }, data: data as never });
    return NextResponse.json(note);
  } catch { return NextResponse.json({ error: "Erro" }, { status: 500 }); }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  try {
    const { id } = await params;
    await prisma.orderNote.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch { return NextResponse.json({ error: "Erro ao eliminar nota de encomenda" }, { status: 500 }); }
}
