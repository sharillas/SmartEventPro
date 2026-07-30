import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { getPaginationParams, paginatedResponse } from "@/lib/pagination";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  try {
    const { page, limit, skip, take } = getPaginationParams({
      page: request.nextUrl.searchParams.get("page"),
      limit: request.nextUrl.searchParams.get("limit"),
    });
    const search = request.nextUrl.searchParams.get("search");

    const where: Record<string, unknown> = {};
    if (search) where.name = { contains: search };

    const [data, total] = await Promise.all([
      prisma.equipment.findMany({
        where,
        include: { category: { select: { name: true } } },
        skip,
        take,
        orderBy: { createdAt: "desc" },
      }),
      prisma.equipment.count({ where }),
    ]);

    return NextResponse.json(paginatedResponse(data, total, page, limit));
  } catch {
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
