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
    const record = await prisma.vehicle.findUnique({
      where: { id },
    });
    if (!record) return NextResponse.json({ error: "Veículo não encontrado" }, { status: 404 });
    return NextResponse.json(record);
  } catch {
    return NextResponse.json({ error: "Erro ao buscar veículo" }, { status: 500 });
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
    if (body.name) data.name = body.name;
    if (body.licensePlate) data.licensePlate = body.licensePlate;
    if (body.brand) data.brand = body.brand;
    if (body.model) data.model = body.model;
    if (body.type) data.type = body.type;
    if (body.fuelType) data.fuelType = body.fuelType;
    if (body.status) data.status = body.status;
    if (body.year !== undefined && body.year !== "") data.year = Number(body.year);
    if (body.capacityKg !== undefined && body.capacityKg !== "") data.capacityKg = Number(body.capacityKg);
    if (body.capacityM3 !== undefined && body.capacityM3 !== "") data.capacityM3 = Number(body.capacityM3);
    if (body.insuranceExpiry) data.insuranceExpiry = new Date(body.insuranceExpiry).toISOString();
    if (body.inspectionExpiry) data.inspectionExpiry = new Date(body.inspectionExpiry).toISOString();
    if (body.notes !== undefined) data.notes = body.notes;
    const record = await prisma.vehicle.update({
      where: { id },
      data: data as never,
    });
    return NextResponse.json(record);
  } catch {
    return NextResponse.json({ error: "Erro ao atualizar veículo" }, { status: 500 });
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
    await prisma.vehicle.update({
      where: { id },
      data: { active: false },
    });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Erro ao eliminar veículo" }, { status: 500 });
  }
}
