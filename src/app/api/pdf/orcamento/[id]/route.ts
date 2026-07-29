import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { createPDF, addFooterToAllPages } from "@/lib/pdf-utils";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  try {
    const { id } = await params;
    const quotation = await prisma.quotation.findUnique({
      where: { number: id },
      include: { items: true, client: true },
    });
    if (!quotation) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });

    const { doc, addHeaderFooter } = createPDF("Orçamento");
    const f = (v: number) => `${v.toFixed(2)}€`;
    const pageWidth = doc.internal.pageSize.getWidth();
    let y = 48;

    // Title
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 41, 59);
    doc.text(`Orçamento ${quotation.number}`, 14, y);
    y += 10;

    // Info section
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(71, 85, 105);

    const infoLeft = [
      `Cliente: ${quotation.client?.name || "—"}`,
      `Empresa: ${quotation.client?.companyName || "—"}`,
      `NIF: ${quotation.client?.nif || "—"}`,
    ];
    infoLeft.forEach(line => { doc.text(line, 14, y); y += 5; });

    y = 48;
    const infoRight = [
      `Data: ${new Date(quotation.date).toLocaleDateString("pt-PT")}`,
      `Validade: ${quotation.validUntil ? new Date(quotation.validUntil).toLocaleDateString("pt-PT") : "—"}`,
      `Local: ${quotation.location || "—"}`,
      `Estado: ${quotation.status}`,
    ];
    infoRight.forEach(line => { doc.text(line, pageWidth - 70, y); y += 5; });

    y = Math.max(y, 85);

    // Items table
    const rows = (quotation.items || []).map((item: any) => [
      item.description,
      item.type === "EQUIPAMENTO" ? "Equip." : item.type === "SERVICO" ? "Serviço" : item.type,
      String(item.quantity),
      f(item.unitPrice),
      f(item.total),
    ]);

    const { default: autoTable } = await import("jspdf-autotable");
    if (rows.length > 0) {
      autoTable(doc, {
        startY: y,
        head: [["Descrição", "Tipo", "Qt", "Preço Un.", "Total"]],
        body: rows,
        headStyles: { fillColor: [30, 41, 59], textColor: 255, fontSize: 9, fontStyle: "bold" },
        bodyStyles: { fontSize: 8, textColor: [51, 65, 85] },
        alternateRowStyles: { fillColor: [241, 245, 249] },
        margin: { left: 14, right: 14 },
        styles: { cellPadding: 3 },
        columnStyles: {
          0: { cellWidth: "auto" },
          2: { halign: "center" },
          3: { halign: "right" },
          4: { halign: "right" },
        },
      });
      y = (doc as any).lastAutoTable.finalY + 10;
    } else {
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      doc.text("Nenhum item neste orçamento.", 14, y);
      y += 10;
    }

    // Totals
    doc.setFontSize(10);
    const tx = pageWidth - 70;
    doc.text("Subtotal:", tx, y);
    doc.text(f(quotation.subtotal), pageWidth - 14, y, { align: "right" });
    y += 6;
    doc.text(`IVA (${quotation.taxRate}%):`, tx, y);
    doc.text(f(quotation.taxAmount), pageWidth - 14, y, { align: "right" });
    y += 6;
    doc.setDrawColor(226, 232, 240);
    doc.line(tx - 5, y, pageWidth - 14, y);
    y += 6;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(37, 99, 235);
    doc.text("Total:", tx, y);
    doc.text(f(quotation.total), pageWidth - 14, y, { align: "right" });

    addFooterToAllPages(doc, addHeaderFooter);

    const pdfBuffer = Buffer.from(doc.output("arraybuffer"));
    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${quotation.number}.pdf"`,
      },
    });
  } catch (e) {
    console.error("PDF error:", e);
    return NextResponse.json({ error: "Erro ao gerar PDF" }, { status: 500 });
  }
}
