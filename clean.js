const { PrismaClient } = require("./src/generated/prisma/client");
const { PrismaLibSql } = require("@prisma/adapter-libsql");
const p = new PrismaClient({ adapter: new PrismaLibSql({ url: "file:./dev.db" }) });
(async () => {
  await p.projectEquipment.deleteMany();
  await p.projectService.deleteMany();
  await p.projectEmployee.deleteMany();
  await p.stockMovement.updateMany({ data: { projectId: null } });
  await p.transportGuide.updateMany({ data: { projectId: null } });
  await p.quotation.updateMany({ data: { projectId: null } });
  await p.invoice.updateMany({ data: { projectId: null } });
  await p.project.deleteMany();
  console.log("Projetos limpos");
  await p.$disconnect();
})();
