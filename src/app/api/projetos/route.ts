import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  try {
    const projects = await prisma.project.findMany({
      include: {
        client: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(projects);
  } catch (error) {
    return NextResponse.json({ error: "Erro ao buscar projetos" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  try {
    const body = await request.json();
    const year = new Date().getFullYear();
    const count = await prisma.project.count({
      where: { number: { startsWith: `PROJ_` } },
    });
    const number = `PROJ_${String(count + 1).padStart(4, "0")}-${year}`;

    const data: Record<string, unknown> = {
      number,
      name: body.name,
      startDate: new Date(body.startDate || new Date()).toISOString(),
      endDate: new Date(body.endDate || new Date()).toISOString(),
    };
    if (body.clientId) data.clientId = body.clientId;
    if (body.description) data.description = body.description;
    if (body.location) data.location = body.location;
    if (body.notes) data.notes = body.notes;

    const project = await prisma.project.create({ data: data as never });
    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Erro ao criar projeto" }, { status: 500 });
  }
}
