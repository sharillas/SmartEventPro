import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  try {
    const { id } = await params;
    const record = await prisma.employeeCertification.findUnique({
      where: { id },
    });
    if (!record) return NextResponse.json({ error: "Certificação não encontrada" }, { status: 404 });
    return NextResponse.json(record);
  } catch {
    return NextResponse.json({ error: "Erro ao buscar certificação" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  try {
    const { id } = await params;
    const body = await request.json();
    console.log("PATCH certificacao body:", JSON.stringify(body));
    const data: Record<string, unknown> = {};
    if (body.employeeId) data.employeeId = body.employeeId;
    if (body.name) data.name = body.name;
    if (body.issueDate) data.issueDate = new Date(body.issueDate).toISOString();
    if (body.issuingEntity) data.issuingEntity = body.issuingEntity;
    if (body.expiryDate) data.expiryDate = new Date(body.expiryDate).toISOString();
    if (body.documentUrl) data.documentUrl = body.documentUrl;
    if (body.notes !== undefined) data.notes = body.notes;
    console.log("PATCH certificacao data:", JSON.stringify(data));
    const record = await prisma.employeeCertification.update({
      where: { id },
      data: data as never,
    });
    return NextResponse.json(record);
  } catch (error) {
    console.error("PATCH certificacao error:", error);
    return NextResponse.json({ error: "Erro ao atualizar certificação" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  try {
    const { id } = await params;
    await prisma.employeeCertification.delete({
      where: { id },
    });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Erro ao eliminar certificação" }, { status: 500 });
  }
}
