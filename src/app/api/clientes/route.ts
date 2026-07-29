import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  try {
    const type = request.nextUrl.searchParams.get("type");
    const where: Record<string, unknown> = { active: true };
    if (type) where.type = type;

    const clients = await prisma.client.findMany({ where });
    return NextResponse.json(clients);
  } catch (error) {
    return NextResponse.json({ error: "Erro ao buscar clientes" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  try {
    const body = await request.json();
    const client = await prisma.client.create({
      data: {
        name: body.name,
        type: body.type || "CLIENTE",
        companyName: body.companyName,
        email: body.email,
        phone: body.phone,
        nif: body.nif,
        address: body.address,
        city: body.city,
        postalCode: body.postalCode,
        country: body.country,
        notes: body.notes,
      },
    });
    return NextResponse.json(client, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Erro ao criar cliente" }, { status: 500 });
  }
}
