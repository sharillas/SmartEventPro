import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  try {
    const employees = await prisma.employee.findMany();
    return NextResponse.json(employees);
  } catch (error) {
    return NextResponse.json({ error: "Erro ao buscar colaboradores" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  try {
    const body = await request.json();
    const data: Record<string, unknown> = {
      name: body.name,
      position: body.position,
      hourlyRate: body.hourlyRate ?? 0,
      dailyRate: body.dailyRate ?? 0,
    };
    if (body.email) data.email = body.email;
    if (body.phone) data.phone = body.phone;
    if (body.nif) data.nif = body.nif;
    if (body.address) data.address = body.address;
    if (body.department) data.department = body.department;
    if (body.startDate) data.startDate = new Date(body.startDate).toISOString();
    if (body.notes) data.notes = body.notes;

    const employee = await prisma.employee.create({ data: data as never });
    return NextResponse.json(employee, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Erro ao criar colaborador" }, { status: 500 });
  }
}
