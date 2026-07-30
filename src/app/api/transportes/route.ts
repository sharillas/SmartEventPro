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
    if (search) {
      where.number = { contains: search };
    }

    const include = {
      project: { select: { name: true } },
      vehicle: { select: { name: true } },
      driver: { select: { name: true } },
    };

    const [data, total] = await Promise.all([
      prisma.transportGuide.findMany({ where, skip, take, orderBy: { createdAt: "desc" }, include }),
      prisma.transportGuide.count({ where }),
    ]);

    return NextResponse.json(paginatedResponse(data, total, page, limit));
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
