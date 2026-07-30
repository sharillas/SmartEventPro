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
    const record = await prisma.employee.findUnique({
      where: { id },
    });
    if (!record) return NextResponse.json({ error: "Colaborador não encontrado" }, { status: 404 });
    return NextResponse.json(record);
  } catch {
    return NextResponse.json({ error: "Erro ao buscar colaborador" }, { status: 500 });
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
    console.log("PATCH colaborador body:", JSON.stringify(body));
    const data: Record<string, unknown> = {};
    if (body.name) data.name = body.name;
    if (body.email) data.email = body.email;
    if (body.phone !== undefined) data.phone = body.phone || null;
    if (body.nif !== undefined) data.nif = body.nif || null;
    if (body.address !== undefined) data.address = body.address || null;
    if (body.position) data.position = body.position;
    if (body.department) data.department = body.department;
    if (body.hourlyRate !== undefined && body.hourlyRate !== "") data.hourlyRate = Number(body.hourlyRate);
    if (body.dailyRate !== undefined && body.dailyRate !== "") data.dailyRate = Number(body.dailyRate);
    if (body.startDate) data.startDate = new Date(body.startDate).toISOString();
    if (body.notes !== undefined) data.notes = body.notes;
    if (body.status) data.status = body.status;
    const record = await prisma.employee.update({
      where: { id },
      data: data as never,
    });
    return NextResponse.json(record);
  } catch (error) {
    console.error("PATCH colaborador error:", error);
    return NextResponse.json({ error: "Erro ao atualizar colaborador" }, { status: 500 });
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
    await prisma.employee.update({
      where: { id },
      data: { active: false },
    });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Erro ao eliminar colaborador" }, { status: 500 });
  }
}
