import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  try {
    const equipment = await prisma.equipment.findMany({
      include: {
        category: { select: { name: true } },
      },
    });
    return NextResponse.json(equipment);
  } catch (error) {
    return NextResponse.json({ error: "Erro ao buscar equipamentos" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  try {
    const body = await request.json();
    const data: Record<string, unknown> = {
      name: body.name,
      sku: body.sku,
      quantity: body.quantity ?? 0,
      minStock: body.minStock ?? 0,
      purchasePrice: body.purchasePrice ?? 0,
      rentalPriceDaily: body.rentalPriceDaily ?? 0,
      rentalPriceWeekly: body.rentalPriceWeekly ?? 0,
      status: body.status ?? "DISPONIVEL",
    };
    if (body.description) data.description = body.description;
    if (body.categoryId) data.categoryId = body.categoryId;
    if (body.brand) data.brand = body.brand;
    if (body.model) data.model = body.model;
    if (body.serialNumber) data.serialNumber = body.serialNumber;
    if (body.purchaseDate) data.purchaseDate = new Date(body.purchaseDate).toISOString();
    if (body.unit) data.unit = body.unit;
    if (body.powerWatts !== undefined && body.powerWatts !== "") data.powerWatts = Number(body.powerWatts);
    if (body.weightKg !== undefined && body.weightKg !== "") data.weightKg = Number(body.weightKg);
    if (body.dimensions) data.dimensions = body.dimensions;
    if (body.notes) data.notes = body.notes;

    const equipment = await prisma.equipment.create({ data: data as never });
    return NextResponse.json(equipment, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Erro ao criar equipamento" }, { status: 500 });
  }
}
