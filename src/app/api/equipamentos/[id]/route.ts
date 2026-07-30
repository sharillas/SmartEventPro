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
    const record = await prisma.equipment.findUnique({
      where: { id },
    });
    if (!record) return NextResponse.json({ error: "Equipamento não encontrado" }, { status: 404 });
    return NextResponse.json(record);
  } catch {
    return NextResponse.json({ error: "Erro ao buscar equipamento" }, { status: 500 });
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
    if (body.sku) data.sku = body.sku;
    if (body.quantity !== undefined && body.quantity !== "") data.quantity = Number(body.quantity);
    if (body.minStock !== undefined && body.minStock !== "") data.minStock = Number(body.minStock);
    if (body.purchasePrice !== undefined && body.purchasePrice !== "") data.purchasePrice = Number(body.purchasePrice);
    if (body.rentalPriceDaily !== undefined && body.rentalPriceDaily !== "") data.rentalPriceDaily = Number(body.rentalPriceDaily);
    if (body.rentalPriceWeekly !== undefined && body.rentalPriceWeekly !== "") data.rentalPriceWeekly = Number(body.rentalPriceWeekly);
    if (body.status) data.status = body.status;
    if (body.description !== undefined) data.description = body.description;
    if (body.categoryId) data.categoryId = body.categoryId;
    if (body.brand) data.brand = body.brand;
    if (body.model) data.model = body.model;
    if (body.serialNumber) data.serialNumber = body.serialNumber;
    if (body.purchaseDate) data.purchaseDate = new Date(body.purchaseDate).toISOString();
    if (body.unit) data.unit = body.unit;
    if (body.powerWatts !== undefined && body.powerWatts !== "") data.powerWatts = Number(body.powerWatts);
    if (body.weightKg !== undefined && body.weightKg !== "") data.weightKg = Number(body.weightKg);
    if (body.dimensions) data.dimensions = body.dimensions;
    if (body.notes !== undefined) data.notes = body.notes;
    const record = await prisma.equipment.update({
      where: { id },
      data: data as never,
    });
    return NextResponse.json(record);
  } catch {
    return NextResponse.json({ error: "Erro ao atualizar equipamento" }, { status: 500 });
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
    await prisma.equipment.update({
      where: { id },
      data: { active: false },
    });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Erro ao eliminar equipamento" }, { status: 500 });
  }
}
