import jsPDF from "jspdf";
import "jspdf-autotable";
import fs from "fs";
import path from "path";

const COMPANY = {
  name: "Smartchoice Audiovisuais Lda.",
  address: "Rua Francisco Simões Carneiro Nº 4",
  postal: "2700-402 Venda Nova, Amadora",
  phone: "Telf: +351 218 688 035",
  email: "Email: geral@smartchoice.pt",
  nif: "NIF: 506219240",
};

function drawLogo(doc: jsPDF, x: number, y: number) {
  // Circle
  doc.setDrawColor(30, 41, 59);
  doc.setLineWidth(0.8);
  doc.setFillColor(255, 255, 255);
  doc.circle(x + 8, y + 8, 7.5, "FD");
  // "S" letter inside
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 41, 59);
  doc.text("S", x + 8, y + 12, { align: "center" });
}

export function createPDF(title: string): { doc: jsPDF; addHeaderFooter: (doc: jsPDF, pageNum: number, totalPages: number) => void } {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();

  function addHeaderFooter(doc: jsPDF, pageNum: number, totalPages: number) {
    drawLogo(doc, 14, 8);

    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 41, 59);
    doc.text(COMPANY.name, 34, 13);

    doc.setFontSize(7.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(71, 85, 105);
    doc.text(COMPANY.address, 34, 18);
    doc.text(COMPANY.postal, 34, 22.5);
    doc.text(`${COMPANY.phone}  |  ${COMPANY.email}`, 34, 27);
    doc.text(COMPANY.nif, 34, 31.5);

    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 41, 59);
    doc.text(title, pageWidth - 14, 16, { align: "right" });

    doc.setDrawColor(226, 232, 240);
    doc.line(14, 37, pageWidth - 14, 37);

    const footerY = doc.internal.pageSize.getHeight() - 12;
    doc.setDrawColor(226, 232, 240);
    doc.line(14, footerY - 2, pageWidth - 14, footerY - 2);
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text("Smartchoice@2026", 14, footerY);
    doc.text("all rights reserved smartchoice.pt@2026", pageWidth / 2, footerY, { align: "center" });
    doc.text(`Pág. ${pageNum}/${totalPages}  |  ${new Date().toLocaleDateString("pt-PT")}`, pageWidth - 14, footerY, { align: "right" });
  }

  return { doc, addHeaderFooter };
}

export function addFooterToAllPages(doc: jsPDF, fn: (doc: jsPDF, pageNum: number, totalPages: number) => void) {
  const totalPages = doc.getNumberOfPages?.() || 1;
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    fn(doc, i, totalPages);
  }
}
