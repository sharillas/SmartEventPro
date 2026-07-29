import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  try {
    const movements = await prisma.stockMovement.findMany({
      include: {
        equipment: { select: { name: true } },
        sourceWarehouse: { select: { name: true } },
        destinationWarehouse: { select: { name: true } },
        user: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(movements);
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
