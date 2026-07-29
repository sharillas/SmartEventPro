import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  try {
    const departments = await prisma.department.findMany({ where: { active: true }, orderBy: { name: "asc" } });
    return NextResponse.json(departments);
  } catch {
    return NextResponse.json({ error: "Erro ao buscar departamentos" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  try {
    const body = await request.json();
    const dept = await prisma.department.create({ data: { name: body.name } });
    return NextResponse.json(dept, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Erro ao criar departamento" }, { status: 500 });
  }
}
