import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { createPDF, addFooterToAllPages } from "@/lib/pdf-utils";

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  try {
    const body = await request.json();
    const {
      clientName = "—",
      clientCompany = "—",
      clientNif = "—",
      location = "—",
      startDate,
      endDate,
      items = [],
      subtotal = 0,
      taxRate = 23,
      taxAmount = 0,
      total = 0,
    } = body;

    const { doc, addHeaderFooter } = createPDF("Orçamento");
    const f = (v: number) => `${v.toFixed(2)}€`;
    const pageWidth = doc.internal.pageSize.getWidth();
    let y = 48;

    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 41, 59);
    doc.text("Pré-visualização do Orçamento", 14, y);
    y += 10;

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(71, 85, 105);

    const infoLeft = [
      `Cliente: ${clientName}`,
      `Empresa: ${clientCompany}`,
      `NIF: ${clientNif}`,
    ];
    infoLeft.forEach(line => { doc.text(line, 14, y); y += 5; });

    y = 48;
    const infoRight = [
      `Data: ${new Date().toLocaleDateString("pt-PT")}`,
      `Local: ${location}`,
    ];
    if (startDate) {
      infoRight.push(`Início: ${new Date(startDate).toLocaleDateString("pt-PT")}`);
    }
    if (endDate) {
      infoRight.push(`Fim: ${new Date(endDate).toLocaleDateString("pt-PT")}`);
    }
    infoRight.forEach(line => { doc.text(line, pageWidth - 70, y); y += 5; });

    y = Math.max(y, 85);

    const rows = items.map((item: any) => [
      item.name || item.description || "—",
      item.type === "EQUIPAMENTO" ? "Equip." : item.type === "SERVICO" ? "Serviço" : item.type || "—",
      String(item.quantity || 1),
      f(item.unitPrice || 0),
      f(item.total || 0),
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

    doc.setFontSize(10);
    const tx = pageWidth - 70;
    doc.text("Subtotal:", tx, y);
    doc.text(f(subtotal), pageWidth - 14, y, { align: "right" });
    y += 6;
    doc.text(`IVA (${taxRate}%):`, tx, y);
    doc.text(f(taxAmount), pageWidth - 14, y, { align: "right" });
    y += 6;
    doc.setDrawColor(226, 232, 240);
    doc.line(tx - 5, y, pageWidth - 14, y);
    y += 6;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(37, 99, 235);
    doc.text("Total:", tx, y);
    doc.text(f(total), pageWidth - 14, y, { align: "right" });

    addFooterToAllPages(doc, addHeaderFooter);

    const pdfBuffer = Buffer.from(doc.output("arraybuffer"));
    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="orcamento-preview.pdf"`,
      },
    });
  } catch (e) {
    console.error("PDF preview error:", e);
    return NextResponse.json({ error: "Erro ao gerar PDF" }, { status: 500 });
  }
}
