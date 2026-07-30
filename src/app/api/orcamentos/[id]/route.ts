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
    const quotation = await prisma.quotation.findUnique({
      where: { number: id },
      include: { items: true, client: true },
    });
    if (!quotation) return NextResponse.json({ error: "Orçamento não encontrado" }, { status: 404 });
    return NextResponse.json(quotation);
  } catch {
    return NextResponse.json({ error: "Erro ao buscar orçamento" }, { status: 500 });
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

    const data: Record<string, unknown> = {};
    if (body.status) data.status = body.status;
    if (body.notes !== undefined) data.notes = body.notes;

    const quotation = await prisma.quotation.update({
      where: { number: id },
      data: data as never,
      include: { client: true },
    });

    if (body.status === "CONFIRMADO" && !quotation.projectId) {
      const year = new Date().getFullYear();

      const projectCount = await prisma.project.count({
        where: { number: { startsWith: "PROJ_" } },
      });
      const projectNumber = `PROJ_${String(projectCount + 1).padStart(4, "0")}-${year}`;

      const project = await prisma.project.create({
        data: {
          name: quotation.client?.name ? `Evento ${quotation.client.name}` : "Evento",
          number: projectNumber,
          clientId: quotation.clientId,
          location: quotation.location || "",
          startDate: quotation.startDate || new Date(),
          endDate: quotation.endDate || new Date(),
          status: "CONFIRMADO",
        },
      });

      await prisma.quotation.update({
        where: { number: id },
        data: { projectId: project.id } as never,
      });

      const invoiceCount = await prisma.invoice.count({
        where: { number: { startsWith: "FT_" } },
      });
      const invoiceNumber = `FT_${String(invoiceCount + 1).padStart(4, "0")}-${year}`;

      await prisma.invoice.create({
        data: {
          number: invoiceNumber,
          quotationId: quotation.id,
          clientId: quotation.clientId,
          projectId: project.id,
          date: new Date(),
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          subtotal: quotation.subtotal,
          taxRate: quotation.taxRate,
          taxAmount: quotation.taxAmount,
          total: quotation.total,
          status: "PENDENTE",
        },
      });

      return NextResponse.json({
        ...quotation,
        projectId: project.id,
        message: "Evento e fatura criados automaticamente.",
      });
    }

    return NextResponse.json(quotation);
  } catch (error) {
    console.error("PATCH orcamento error:", error);
    return NextResponse.json({ error: "Erro ao atualizar orçamento" }, { status: 500 });
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
    await prisma.quotation.delete({
      where: { number: id },
    });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Erro ao eliminar orçamento" }, { status: 500 });
  }
}
