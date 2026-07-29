import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  try {
    const epis = await prisma.employeeEPI.findMany({
      include: {
        employee: { select: { name: true } },
      },
      orderBy: { expiryDate: "asc" },
    });
    return NextResponse.json(epis);
  } catch (error) {
    return NextResponse.json({ error: "Erro ao buscar EPIs" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  try {
    const body = await request.json();
    const data: Record<string, unknown> = {
      employeeId: body.employeeId,
      epiType: body.epiType,
      description: body.description,
      expiryDate: new Date(body.expiryDate).toISOString(),
      deliveredAt: body.deliveredAt ? new Date(body.deliveredAt).toISOString() : new Date().toISOString(),
    };
    if (body.serialNumber) data.serialNumber = body.serialNumber;
    if (body.notes) data.notes = body.notes;

    const epi = await prisma.employeeEPI.create({ data: data as never });
    return NextResponse.json(epi, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Erro ao criar EPI" }, { status: 500 });
  }
}
