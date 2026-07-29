import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const items = await prisma.equipment.findMany({
    where: { active: true, quantity: { lte: prisma.equipment.fields.minStock } },
    select: { id: true, name: true, sku: true, quantity: true, minStock: true },
  });

  return NextResponse.json(items.filter((i) => i.quantity <= i.minStock));
}
