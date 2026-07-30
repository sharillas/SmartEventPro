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
    const contract = await prisma.employeeContract.findUnique({
      where: { id },
      include: { employee: { select: { id: true, name: true } } },
    });
    if (!contract) return NextResponse.json({ error: "Contrato não encontrado" }, { status: 404 });
    return NextResponse.json(contract);
  } catch {
    return NextResponse.json({ error: "Erro ao buscar contrato" }, { status: 500 });
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
    if (body.type) data.type = body.type;
    if (body.startDate) data.startDate = new Date(body.startDate);
    if (body.endDate !== undefined) data.endDate = body.endDate ? new Date(body.endDate) : null;
    if (body.salary !== undefined) data.salary = body.salary;
    if (body.notes !== undefined) data.notes = body.notes;
    const contract = await prisma.employeeContract.update({
      where: { id },
      data,
      include: { employee: { select: { id: true, name: true } } },
    });
    return NextResponse.json(contract);
  } catch {
    return NextResponse.json({ error: "Erro ao atualizar contrato" }, { status: 500 });
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
    await prisma.employeeContract.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Erro ao eliminar contrato" }, { status: 500 });
  }
}
