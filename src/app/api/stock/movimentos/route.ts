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
      where.notes = { contains: search };
    }

    const include = {
      equipment: { select: { name: true } },
      sourceWarehouse: { select: { name: true } },
      destinationWarehouse: { select: { name: true } },
      user: { select: { name: true } },
    };

    const [data, total] = await Promise.all([
      prisma.stockMovement.findMany({ where, skip, take, orderBy: { createdAt: "desc" }, include }),
      prisma.stockMovement.count({ where }),
    ]);

    return NextResponse.json(paginatedResponse(data, total, page, limit));
  } catch (error) {
    return NextResponse.json({ error: "Erro ao buscar movimentos" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  try {
    const body = await request.json();
    const movement = await prisma.stockMovement.create({
      data: {
        equipmentId: body.equipmentId,
        type: body.type,
        quantity: body.quantity,
        sourceWarehouseId: body.sourceWarehouseId ?? null,
        destinationWarehouseId: body.destinationWarehouseId ?? null,
        projectId: body.projectId ?? null,
        notes: body.notes,
        userId: session.id,
      },
    });
    return NextResponse.json(movement, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Erro ao criar movimento" }, { status: 500 });
  }
}
