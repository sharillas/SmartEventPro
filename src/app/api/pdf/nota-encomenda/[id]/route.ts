import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { createPDF, addFooterToAllPages } from "@/lib/pdf-utils";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  try {
    const { id } = await params;
    const note = await prisma.orderNote.findUnique({
      where: { number: id },
      include: { items: true, supplier: true },
    });
    if (!note) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });

    const { doc, addHeaderFooter } = createPDF("Nota de Encomenda");
    const f = (v: number) => `${v.toFixed(2)}€`;
    const pageWidth = doc.internal.pageSize.getWidth();
    let y = 48;

    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 41, 59);
    doc.text(`Nota de Encomenda ${note.number}`, 14, y);
    y += 12;

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(71, 85, 105);

    const infoLeft = [
      `Fornecedor: ${note.supplier?.name || "—"}`,
      `Empresa: ${note.supplier?.companyName || "—"}`,
      `Departamento: ${note.department || "—"}`,
      note.projectCode ? `Cód. Projeto: ${note.projectCode}` : null,
      note.fixedAsset ? "Imobilizado: Sim" : null,
    ].filter(Boolean) as string[];
    infoLeft.forEach(line => { doc.text(line, 14, y); y += 5; });

    y = 48;
    const infoRight = [
      `Data: ${new Date(note.date).toLocaleDateString("pt-PT")}`,
      `Estado: ${note.status}`,
    ];
    infoRight.forEach(line => { doc.text(line, pageWidth - 70, y); y += 5; });

    y = Math.max(y, 85);

    const rows = (note.items || []).map((item: any) => [
      item.description,
      String(item.quantity),
      f(item.unitPrice),
      `${item.taxRate}%`,
      f(item.taxAmount),
      f(item.total),
    ]);

    const { default: autoTable } = await import("jspdf-autotable");
    if (rows.length > 0) {
      autoTable(doc, {
        startY: y,
        head: [["Descrição", "Qt", "Preço Un.", "IVA", "Valor IVA", "Total"]],
        body: rows,
        headStyles: { fillColor: [30, 41, 59], textColor: 255, fontSize: 9, fontStyle: "bold" },
        bodyStyles: { fontSize: 8, textColor: [51, 65, 85] },
        alternateRowStyles: { fillColor: [241, 245, 249] },
        margin: { left: 14, right: 14 },
        styles: { cellPadding: 3 },
        columnStyles: { 0: { cellWidth: "auto" }, 1: { halign: "center", cellWidth: 15 }, 2: { halign: "right" }, 3: { halign: "center", cellWidth: 16 }, 4: { halign: "right" }, 5: { halign: "right" } },
      });
      y = (doc as any).lastAutoTable.finalY + 10;
    }

    doc.setFontSize(10);
    const tx = pageWidth - 70;
    doc.text("Subtotal:", tx, y);
    doc.text(f(note.subtotal), pageWidth - 14, y, { align: "right" });
    y += 6;
    doc.text("IVA Total:", tx, y);
    doc.text(f(note.taxAmount), pageWidth - 14, y, { align: "right" });
    y += 6;
    doc.setDrawColor(226, 232, 240);
    doc.line(tx - 5, y, pageWidth - 14, y);
    y += 6;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(37, 99, 235);
    doc.text("Total:", tx, y);
    doc.text(f(note.total), pageWidth - 14, y, { align: "right" });

    addFooterToAllPages(doc, addHeaderFooter);

    const pdfBuffer = Buffer.from(doc.output("arraybuffer"));
    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${note.number}.pdf"`,
      },
    });
  } catch (e) {
    console.error("PDF error:", e);
    return NextResponse.json({ error: "Erro ao gerar PDF" }, { status: 500 });
  }
}
