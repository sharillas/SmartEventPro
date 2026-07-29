import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  try {
    const positions = await prisma.position.findMany({ where: { active: true }, orderBy: { name: "asc" } });
    return NextResponse.json(positions);
  } catch {
    return NextResponse.json({ error: "Erro ao buscar funções" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  try {
    const body = await request.json();
    const pos = await prisma.position.create({ data: { name: body.name } });
    return NextResponse.json(pos, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Erro ao criar função" }, { status: 500 });
  }
}
