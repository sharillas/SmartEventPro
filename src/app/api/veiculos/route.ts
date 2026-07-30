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

    const where: Record<string, unknown> = { active: true };
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { licensePlate: { contains: search } },
      ];
    }

    const [data, total] = await Promise.all([
      prisma.vehicle.findMany({ where, skip, take, orderBy: { createdAt: "desc" } }),
      prisma.vehicle.count({ where }),
    ]);

    return NextResponse.json(paginatedResponse(data, total, page, limit));
  } catch (error) {
    return NextResponse.json({ error: "Erro ao buscar veículos" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  try {
    const body = await request.json();
    const year = new Date().getFullYear();
    const count = await prisma.vehicle.count({
      where: { number: { startsWith: `VC_` } },
    });
    const number = `VC_${String(count + 1).padStart(4, "0")}-${year}`;

    const data: Record<string, unknown> = {
      number,
      name: body.name,
      licensePlate: body.licensePlate,
      type: body.type,
    };
    if (body.brand) data.brand = body.brand;
    if (body.model) data.model = body.model;
    if (body.year !== undefined) data.year = body.year;
    if (body.fuelType) data.fuelType = body.fuelType;
    if (body.capacityKg !== undefined) data.capacityKg = body.capacityKg;
    if (body.capacityM3 !== undefined) data.capacityM3 = body.capacityM3;
    if (body.insuranceExpiry) data.insuranceExpiry = new Date(body.insuranceExpiry).toISOString();
    if (body.inspectionExpiry) data.inspectionExpiry = new Date(body.inspectionExpiry).toISOString();
    if (body.notes) data.notes = body.notes;

    const vehicle = await prisma.vehicle.create({ data: data as never });
    return NextResponse.json(vehicle, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Erro ao criar veículo" }, { status: 500 });
  }
}
