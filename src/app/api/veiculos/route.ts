import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  try {
    const vehicles = await prisma.vehicle.findMany({
      where: { active: true },
    });
    return NextResponse.json(vehicles);
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
