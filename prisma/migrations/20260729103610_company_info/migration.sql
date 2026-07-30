-- CreateTable
CREATE TABLE "CompanyInfo" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'default',
    "name" TEXT NOT NULL DEFAULT 'Smartchoice Audiovisuais Lda.',
    "address" TEXT NOT NULL DEFAULT 'Rua Francisco Simões Carneiro Nº 4',
    "postal" TEXT NOT NULL DEFAULT '2700-402 Venda Nova, Amadora',
    "phone" TEXT NOT NULL DEFAULT '+351 218 688 035',
    "email" TEXT NOT NULL DEFAULT 'geral@smartchoice.pt',
    "nif" TEXT NOT NULL DEFAULT '506219240',
    "website" TEXT NOT NULL DEFAULT 'smartchoice.pt'
);
