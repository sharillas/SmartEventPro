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
    const record = await prisma.stockMovement.findUnique({
      where: { id },
    });
    if (!record) return NextResponse.json({ error: "Movimento de stock não encontrado" }, { status: 404 });
    return NextResponse.json(record);
  } catch {
    return NextResponse.json({ error: "Erro ao buscar movimento de stock" }, { status: 500 });
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
    if (body.equipmentId) data.equipmentId = body.equipmentId;
    if (body.type) data.type = body.type;
    if (body.quantity !== undefined && body.quantity !== "") data.quantity = Number(body.quantity);
    if (body.sourceWarehouseId) data.sourceWarehouseId = body.sourceWarehouseId;
    if (body.destinationWarehouseId) data.destinationWarehouseId = body.destinationWarehouseId;
    if (body.projectId) data.projectId = body.projectId;
    if (body.notes !== undefined) data.notes = body.notes;
    const record = await prisma.stockMovement.update({
      where: { id },
      data: data as never,
    });
    return NextResponse.json(record);
  } catch {
    return NextResponse.json({ error: "Erro ao atualizar movimento de stock" }, { status: 500 });
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
    await prisma.stockMovement.delete({
      where: { id },
    });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Erro ao eliminar movimento de stock" }, { status: 500 });
  }
}
