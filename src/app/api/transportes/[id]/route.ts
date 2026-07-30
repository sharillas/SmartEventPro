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
    const record = await prisma.transportGuide.findUnique({
      where: { id },
    });
    if (!record) return NextResponse.json({ error: "Guia de transporte não encontrada" }, { status: 404 });
    return NextResponse.json(record);
  } catch {
    return NextResponse.json({ error: "Erro ao buscar guia de transporte" }, { status: 500 });
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
    if (body.projectId) data.projectId = body.projectId;
    if (body.vehicleId) data.vehicleId = body.vehicleId;
    if (body.driverId) data.driverId = body.driverId;
    if (body.origin) data.origin = body.origin;
    if (body.destination) data.destination = body.destination;
    if (body.status) data.status = body.status;
    if (body.departureDate) data.departureDate = new Date(body.departureDate).toISOString();
    if (body.returnDate) data.returnDate = new Date(body.returnDate).toISOString();
    if (body.notes !== undefined) data.notes = body.notes;
    const record = await prisma.transportGuide.update({
      where: { id },
      data: data as never,
    });
    return NextResponse.json(record);
  } catch {
    return NextResponse.json({ error: "Erro ao atualizar guia de transporte" }, { status: 500 });
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
    await prisma.transportGuide.delete({
      where: { id },
    });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Erro ao eliminar guia de transporte" }, { status: 500 });
  }
}
