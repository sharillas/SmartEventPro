import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  try {
    const services = await prisma.service.findMany({
      where: { active: true },
    });
    return NextResponse.json(services);
  } catch (error) {
    return NextResponse.json({ error: "Erro ao buscar serviços" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  try {
    const body = await request.json();
    const service = await prisma.service.create({
      data: {
        name: body.name,
        description: body.description,
        category: body.category,
        defaultPrice: body.defaultPrice,
        unit: body.unit,
      },
    });
    return NextResponse.json(service, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Erro ao criar serviço" }, { status: 500 });
  }
}
