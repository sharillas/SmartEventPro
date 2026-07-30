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
    const record = await prisma.employeeEPI.findUnique({
      where: { id },
    });
    if (!record) return NextResponse.json({ error: "EPI não encontrado" }, { status: 404 });
    return NextResponse.json(record);
  } catch {
    return NextResponse.json({ error: "Erro ao buscar EPI" }, { status: 500 });
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
    if (body.epiType) data.epiType = body.epiType;
    if (body.description) data.description = body.description;
    if (body.serialNumber) data.serialNumber = body.serialNumber;
    if (body.deliveredAt) data.deliveredAt = new Date(body.deliveredAt).toISOString();
    if (body.expiryDate) data.expiryDate = new Date(body.expiryDate).toISOString();
    if (body.notes !== undefined) data.notes = body.notes;
    const record = await prisma.employeeEPI.update({
      where: { id },
      data: data as never,
    });
    return NextResponse.json(record);
  } catch {
    return NextResponse.json({ error: "Erro ao atualizar EPI" }, { status: 500 });
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
    await prisma.employeeEPI.delete({
      where: { id },
    });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Erro ao eliminar EPI" }, { status: 500 });
  }
}
