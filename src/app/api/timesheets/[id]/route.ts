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
    const record = await prisma.timeSheet.findUnique({
      where: { id },
      include: { employee: { select: { id: true, name: true } }, project: { select: { id: true, name: true, number: true } } },
    });
    if (!record) return NextResponse.json({ error: "Folha de horas não encontrada" }, { status: 404 });
    return NextResponse.json(record);
  } catch {
    return NextResponse.json({ error: "Erro ao buscar folha de horas" }, { status: 500 });
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
    if (body.employeeId) data.employeeId = body.employeeId;
    if (body.date) data.date = new Date(body.date);
    if (body.startTime) data.startTime = body.startTime;
    if (body.endTime) data.endTime = body.endTime;
    if (body.projectId !== undefined) data.projectId = body.projectId || null;
    if (body.hours !== undefined) data.hours = Number(body.hours);
    if (body.notes !== undefined) data.notes = body.notes;
    if (body.status) data.status = body.status;
    const record = await prisma.timeSheet.update({
      where: { id },
      data: data as never,
      include: { employee: { select: { id: true, name: true } }, project: { select: { id: true, name: true, number: true } } },
    });
    return NextResponse.json(record);
  } catch {
    return NextResponse.json({ error: "Erro ao atualizar folha de horas" }, { status: 500 });
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
    await prisma.timeSheet.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Erro ao eliminar folha de horas" }, { status: 500 });
  }
}
