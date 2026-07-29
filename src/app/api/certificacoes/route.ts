import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  try {
    const certifications = await prisma.employeeCertification.findMany({
      include: {
        employee: { select: { name: true } },
      },
      orderBy: { expiryDate: "asc" },
    });
    return NextResponse.json(certifications);
  } catch (error) {
    return NextResponse.json({ error: "Erro ao buscar certificações" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  try {
    const body = await request.json();
    const data: Record<string, unknown> = {
      employeeId: body.employeeId,
      name: body.name,
      issueDate: new Date(body.issueDate || new Date()).toISOString(),
    };
    if (body.issuingEntity) data.issuingEntity = body.issuingEntity;
    if (body.expiryDate) data.expiryDate = new Date(body.expiryDate).toISOString();
    if (body.documentUrl) data.documentUrl = body.documentUrl;
    if (body.notes) data.notes = body.notes;

    const certification = await prisma.employeeCertification.create({ data: data as never });
    return NextResponse.json(certification, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Erro ao criar certificação" }, { status: 500 });
  }
}
