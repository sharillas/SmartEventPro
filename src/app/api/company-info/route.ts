import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  try {
    let info = await (prisma as any).companyInfo.findUnique({ where: { id: "default" } });
    if (!info) {
      info = await (prisma as any).companyInfo.create({ data: { id: "default" } });
    }
    return NextResponse.json(info);
  } catch {
    return NextResponse.json({ error: "Erro ao buscar dados da empresa" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  if (session.role !== "ADMIN") return NextResponse.json({ error: "Acesso negado" }, { status: 403 });

  try {
    const body = await request.json();
    const info = await (prisma as any).companyInfo.upsert({
      where: { id: "default" },
      update: {
        name: body.name,
        address: body.address,
        postal: body.postal,
        phone: body.phone,
        email: body.email,
        nif: body.nif,
        website: body.website,
      },
      create: {
        id: "default",
        name: body.name,
        address: body.address,
        postal: body.postal,
        phone: body.phone,
        email: body.email,
        nif: body.nif,
        website: body.website,
      },
    });
    return NextResponse.json(info);
  } catch {
    return NextResponse.json({ error: "Erro ao atualizar dados da empresa" }, { status: 500 });
  }
}
