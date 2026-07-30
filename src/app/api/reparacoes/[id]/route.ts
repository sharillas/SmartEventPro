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
    const record = await prisma.repairGuide.findUnique({
      where: { id },
    });
    if (!record) return NextResponse.json({ error: "Guia de reparação não encontrada" }, { status: 404 });
    return NextResponse.json(record);
  } catch {
    return NextResponse.json({ error: "Erro ao buscar guia de reparação" }, { status: 500 });
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
    if (body.description) data.description = body.description;
    if (body.reportedBy) data.reportedBy = body.reportedBy;
    if (body.externalRepairer) data.externalRepairer = body.externalRepairer;
    if (body.status) data.status = body.status;
    if (body.totalCost !== undefined && body.totalCost !== "") data.totalCost = Number(body.totalCost);
    if (body.reportedAt) data.reportedAt = new Date(body.reportedAt).toISOString();
    if (body.startDate) data.startDate = new Date(body.startDate).toISOString();
    if (body.endDate) data.endDate = new Date(body.endDate).toISOString();
    if (body.notes !== undefined) data.notes = body.notes;
    const record = await prisma.repairGuide.update({
      where: { id },
      data: data as never,
    });
    return NextResponse.json(record);
  } catch {
    return NextResponse.json({ error: "Erro ao atualizar guia de reparação" }, { status: 500 });
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
    await prisma.repairGuide.delete({
      where: { id },
    });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Erro ao eliminar guia de reparação" }, { status: 500 });
  }
}
