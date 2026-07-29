import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  try {
    const transports = await prisma.transportGuide.findMany({
      include: {
        project: { select: { name: true } },
        vehicle: { select: { name: true } },
        driver: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(transports);
  } catch (error) {
    return NextResponse.json({ error: "Erro ao buscar transportes" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  try {
    const body = await request.json();
    const year = new Date().getFullYear();
    const count = await prisma.transportGuide.count({
      where: { number: { startsWith: `GUI_` } },
    });
    const number = `GUI_${String(count + 1).padStart(4, "0")}-${year}`;

    const data: Record<string, unknown> = {
      number,
      createdById: session.id,
    };
    if (body.projectId) data.projectId = body.projectId;
    if (body.vehicleId) data.vehicleId = body.vehicleId;
    if (body.driverId) data.driverId = body.driverId;
    if (body.departureDate) data.departureDate = new Date(body.departureDate).toISOString();
    if (body.returnDate) data.returnDate = new Date(body.returnDate).toISOString();
    if (body.origin) data.origin = body.origin;
    if (body.destination) data.destination = body.destination;
    if (body.notes) data.notes = body.notes;

    const transport = await prisma.transportGuide.create({ data: data as never });
    return NextResponse.json(transport, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Erro ao criar guia de transporte" }, { status: 500 });
  }
}
