import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient({
  adapter: new PrismaLibSql({ url: "file:./dev.db" }),
});

async function main() {
  console.log("A criar dados de exemplo...");

  // Admin user
  const hashedPassword = await bcrypt.hash("114494", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@admin.pt" },
    update: { password: hashedPassword },
    create: {
      name: "Administrador",
      email: "admin@admin.pt",
      password: hashedPassword,
      role: "ADMIN",
    },
  });
  console.log("  Utilizador admin criado:", admin.email);

  // Warehouse
  const warehouse = await prisma.warehouse.upsert({
    where: { id: "warehouse-main" },
    update: {},
    create: { id: "warehouse-main", name: "Armazém Principal", location: "Lisboa" },
  });

  // Categories
  const categoriesData = [
    { name: "Som", slug: "som", description: "Equipamentos de áudio" },
    { name: "Vídeo", slug: "video", description: "Equipamentos de vídeo e projeção" },
    { name: "Iluminação", slug: "iluminacao", description: "Equipamentos de iluminação cénica" },
    { name: "Estruturas", slug: "estruturas", description: "Estruturas, palcos e rigging" },
    { name: "Mobiliário", slug: "mobiliario", description: "Mobiliário para eventos" },
    { name: "Cablagem", slug: "cablagem", description: "Cabos e conectores" },
  ];

  const categories: Record<string, string> = {};
  for (const cat of categoriesData) {
    const c = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    });
    categories[cat.slug] = c.id;
  }
  console.log("  Categorias criadas:", Object.keys(categories).length);

  // Equipment
  const equipmentData = [
    // Som
    { name: "Coluna Ativa JBL EON715", sku: "SOM-001", categoryId: categories["som"], brand: "JBL", model: "EON715", rentalPriceDaily: 45, quantity: 8, minStock: 2 },
    { name: "Subwoofer JBL PRX818XLFW", sku: "SOM-002", categoryId: categories["som"], brand: "JBL", model: "PRX818XLFW", rentalPriceDaily: 60, quantity: 4, minStock: 1 },
    { name: "Mesa Digital Behringer X32", sku: "SOM-003", categoryId: categories["som"], brand: "Behringer", model: "X32", rentalPriceDaily: 120, quantity: 2, minStock: 1 },
    { name: "Microfone Sennheiser EW100 G4", sku: "SOM-004", categoryId: categories["som"], brand: "Sennheiser", model: "EW100 G4", rentalPriceDaily: 25, quantity: 12, minStock: 2 },
    { name: "Microfone Shure SM58", sku: "SOM-005", categoryId: categories["som"], brand: "Shure", model: "SM58", rentalPriceDaily: 8, quantity: 20, minStock: 3 },
    { name: "DI Box Radial ProDI", sku: "SOM-006", categoryId: categories["som"], brand: "Radial", model: "ProDI", rentalPriceDaily: 5, quantity: 10, minStock: 2 },
    // Vídeo
    { name: "Projetor Panasonic PT-RZ770", sku: "VID-001", categoryId: categories["video"], brand: "Panasonic", model: "PT-RZ770", rentalPriceDaily: 250, quantity: 3, minStock: 1 },
    { name: "Ecrã Projeção 3x2m Tripé", sku: "VID-002", categoryId: categories["video"], brand: "Elite Screens", model: "Tripé 3x2", rentalPriceDaily: 30, quantity: 5, minStock: 1 },
    { name: "LED Wall P3.9 50x50cm", sku: "VID-003", categoryId: categories["video"], brand: "Absen", model: "P3.9", rentalPriceDaily: 8, quantity: 60, minStock: 10 },
    { name: "Câmara PTZ Sony SRG-X120", sku: "VID-004", categoryId: categories["video"], brand: "Sony", model: "SRG-X120", rentalPriceDaily: 95, quantity: 4, minStock: 1 },
    { name: "Monitor 24\" Marshal", sku: "VID-005", categoryId: categories["video"], brand: "Marshall", model: "V-LCD241", rentalPriceDaily: 55, quantity: 4, minStock: 1 },
    // Iluminação
    { name: "Moving Head Chauvet Rogue R2", sku: "ILU-001", categoryId: categories["iluminacao"], brand: "Chauvet", model: "Rogue R2", rentalPriceDaily: 45, quantity: 12, minStock: 2 },
    { name: "Par LED 64 RGBW", sku: "ILU-002", categoryId: categories["iluminacao"], brand: "Stairville", model: "LED Par 64", rentalPriceDaily: 8, quantity: 30, minStock: 4 },
    { name: "Máquina Fumo Look Unique 2.1", sku: "ILU-003", categoryId: categories["iluminacao"], brand: "Look Solutions", model: "Unique 2.1", rentalPriceDaily: 55, quantity: 3, minStock: 1 },
    { name: "Light Desk GrandMA3", sku: "ILU-004", categoryId: categories["iluminacao"], brand: "MA Lighting", model: "grandMA3", rentalPriceDaily: 350, quantity: 1, minStock: 1 },
    // Estruturas
    { name: "Palco Modular 2x1m", sku: "EST-001", categoryId: categories["estruturas"], brand: "Layher", model: "Palco 2x1", rentalPriceDaily: 12, quantity: 40, minStock: 5 },
    { name: "Torre de Delay 4m", sku: "EST-002", categoryId: categories["estruturas"], brand: "Prolyte", model: "Torre 4m", rentalPriceDaily: 20, quantity: 8, minStock: 2 },
    { name: "Gradil Crowd Barrier 2.3m", sku: "EST-003", categoryId: categories["estruturas"], brand: "Gradil", model: "Barreira 2.3", rentalPriceDaily: 4, quantity: 50, minStock: 5 },
    // Mobiliário
    { name: "Mesa Cocktail Alta", sku: "MOB-001", categoryId: categories["mobiliario"], brand: "Eventos", model: "Cocktail", rentalPriceDaily: 6, quantity: 25, minStock: 3 },
    { name: "Cadeira Branca Dobrável", sku: "MOB-002", categoryId: categories["mobiliario"], brand: "Eventos", model: "Dobrável Branca", rentalPriceDaily: 3, quantity: 100, minStock: 10 },
    { name: "Sofá Lounge Veludo", sku: "MOB-003", categoryId: categories["mobiliario"], brand: "Eventos", model: "Lounge", rentalPriceDaily: 35, quantity: 8, minStock: 1 },
    // Cablagem
    { name: "Cabo XLR 10m", sku: "CAB-001", categoryId: categories["cablagem"], brand: "Cordial", model: "XLR 10m", rentalPriceDaily: 1.5, quantity: 50, minStock: 5 },
    { name: "Cabo PowerCON 5m", sku: "CAB-002", categoryId: categories["cablagem"], brand: "Cordial", model: "PowerCON 5m", rentalPriceDaily: 2, quantity: 30, minStock: 3 },
  ];

  for (const eq of equipmentData) {
    await prisma.equipment.upsert({
      where: { sku: eq.sku },
      update: {},
      create: { ...eq, status: "DISPONIVEL" },
    });
  }
  console.log("  Equipamentos criados:", equipmentData.length);

  // Clients
  const clientsData = [
    { name: "João Silva", companyName: "Eventos Premium Lda", email: "joao@eventospremium.pt", phone: "912345678", nif: "500000001", city: "Lisboa", country: "Portugal" },
    { name: "Maria Santos", companyName: "Casamentos de Sonho", email: "maria@casamentossonho.pt", phone: "923456789", nif: "500000002", city: "Porto", country: "Portugal" },
    { name: "António Costa", companyName: "Festivais do Sul SA", email: "antonio@festivaissul.pt", phone: "934567890", nif: "500000003", city: "Faro", country: "Portugal" },
    { name: "Sofia Ferreira", companyName: "Corporate Events Unip Lda", email: "sofia@corpevents.pt", phone: "945678901", nif: "500000004", city: "Coimbra", country: "Portugal" },
    { name: "Pedro Alves", companyName: null, email: "pedro.alves@gmail.com", phone: "956789012", nif: "500000005", city: "Braga", country: "Portugal" },
  ];

  const clients: string[] = [];
  for (const cl of clientsData) {
    const c = await prisma.client.create({ data: cl });
    clients.push(c.id);
  }
  console.log("  Clientes criados:", clients.length);

  // Suppliers
  const suppliersData = [
    { name: "Audiotech Lda", type: "FORNECEDOR", email: "vendas@audiotech.pt", phone: "910000001", nif: "500000101", city: "Lisboa", country: "Portugal" },
    { name: "LightParts SA", type: "FORNECEDOR", email: "info@lightparts.pt", phone: "910000002", nif: "500000102", city: "Porto", country: "Portugal" },
    { name: "StageEquip Unip", type: "FORNECEDOR", email: "encomendas@stageequip.pt", phone: "910000003", nif: "500000103", city: "Faro", country: "Portugal" },
  ];

  for (const sup of suppliersData) {
    await prisma.client.create({ data: sup });
  }
  console.log("  Fornecedores criados:", suppliersData.length);

  // Employees
  const employeesData = [
    { name: "Carlos Rodrigues", email: "carlos@rentpro.pt", phone: "961234567", position: "TECNICO_SOM", department: "SOM", hourlyRate: 25, dailyRate: 180 },
    { name: "Rui Pereira", email: "rui@rentpro.pt", phone: "962345678", position: "TECNICO_VIDEO", department: "VIDEO", hourlyRate: 28, dailyRate: 200 },
    { name: "André Martins", email: "andre@rentpro.pt", phone: "963456789", position: "TECNICO_ILUMINACAO", department: "ILUMINACAO", hourlyRate: 25, dailyRate: 180 },
    { name: "Nuno Cardoso", email: "nuno@rentpro.pt", phone: "964567890", position: "TECNICO_ESTRUTURAS", department: "ESTRUTURAS", hourlyRate: 22, dailyRate: 160 },
    { name: "Miguel Lopes", email: "miguel@rentpro.pt", phone: "965678901", position: "MOTORISTA", department: "TRANSPORTES", hourlyRate: 18, dailyRate: 130 },
  ];

  const empIds: string[] = [];
  for (const emp of employeesData) {
    const e = await prisma.employee.create({ data: emp });
    empIds.push(e.id);
  }
  console.log("  Colaboradores criados:", empIds.length);

  // EPIs
  const episData = [
    { employeeId: empIds[0], epiType: "CAPACETE", description: "Capacete Segurança", expiryDate: new Date("2026-12-31"), deliveredAt: new Date("2026-01-15") },
    { employeeId: empIds[0], epiType: "BOTAS", description: "Botas Segurança", expiryDate: new Date("2026-08-15"), deliveredAt: new Date("2026-01-15") },
    { employeeId: empIds[1], epiType: "ARNES", description: "Arnês Trabalho Altura", expiryDate: new Date("2026-10-01"), deliveredAt: new Date("2026-03-01") },
    { employeeId: empIds[2], epiType: "LUVAS", description: "Luvas Proteção Térmica", expiryDate: new Date("2026-11-30"), deliveredAt: new Date("2026-02-01") },
    { employeeId: empIds[3], epiType: "CAPACETE", description: "Capacete Segurança", expiryDate: new Date("2026-09-15"), deliveredAt: new Date("2026-01-10") },
    { employeeId: empIds[3], epiType: "COLETE", description: "Colete Alta Visibilidade", expiryDate: new Date("2026-07-20"), deliveredAt: new Date("2026-01-10") },
  ];

  for (const epi of episData) {
    await prisma.employeeEPI.create({ data: epi });
  }
  console.log("  EPIs criados:", episData.length);

  // Services
  const servicesData = [
    { name: "Técnico de Som (Dia)", category: "SOM", defaultPrice: 180, unit: "DIA" },
    { name: "Técnico de Vídeo (Dia)", category: "VIDEO", defaultPrice: 200, unit: "DIA" },
    { name: "Técnico de Iluminação (Dia)", category: "ILUMINACAO", defaultPrice: 180, unit: "DIA" },
    { name: "Técnico de Estruturas (Dia)", category: "ESTRUTURAS", defaultPrice: 160, unit: "DIA" },
    { name: "Transporte Carrinha (Serviço)", category: "TRANSPORTE", defaultPrice: 120, unit: "SERVICO" },
    { name: "Montagem de Palco", category: "MONTAGEM", defaultPrice: 350, unit: "SERVICO" },
    { name: "Operador de Streaming", category: "VIDEO", defaultPrice: 250, unit: "DIA" },
  ];

  for (const svc of servicesData) {
    await prisma.service.create({ data: svc });
  }
  console.log("  Serviços criados:", servicesData.length);

  // Vehicles
  const vehiclesData = [
    { name: "Carrinha Mercedes Sprinter", licensePlate: "AA-00-BB", brand: "Mercedes", model: "Sprinter", year: 2022, type: "CARRINHA", fuelType: "GASOLEO", capacityKg: 1500, capacityM3: 14, insuranceExpiry: new Date("2026-12-31"), inspectionExpiry: new Date("2027-03-15") },
    { name: "Carrinha Renault Master", licensePlate: "11-CC-22", brand: "Renault", model: "Master", year: 2021, type: "CARRINHA", fuelType: "GASOLEO", capacityKg: 1200, capacityM3: 11, insuranceExpiry: new Date("2026-11-30"), inspectionExpiry: new Date("2027-01-20") },
    { name: "Empilhador Elétrico", licensePlate: "EMP-01", brand: "Toyota", model: "Traigo", year: 2020, type: "EMPILHADOR", fuelType: "ELETRICO", capacityKg: 2000, capacityM3: null },
  ];

  const vehicleIds: string[] = [];
  for (const v of vehiclesData) {
    const veh = await prisma.vehicle.upsert({
      where: { licensePlate: v.licensePlate },
      update: {},
      create: v,
    });
    vehicleIds.push(veh.id);
  }
  console.log("  Veículos criados:", vehicleIds.length);

  // Projects
  const today = new Date();
  const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 15);
  const nextWeek = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 7);
  const nextWeekEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 8);
  const twoWeeks = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 14);
  const threeWeeks = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 21);

  const project = await prisma.project.upsert({
    where: { number: "PROJ_0001-2026" },
    update: {},
    create: {
      name: "Festival Summer Sounds 2026",
      number: "PROJ_0001-2026",
      clientId: clients[2],
      description: "Festival de música com 3 palcos",
      location: "Parque das Nações, Lisboa",
      startDate: nextWeek,
      endDate: nextWeekEnd,
      status: "CONFIRMADO",
    },
  });

  await prisma.project.upsert({
    where: { number: "PROJ_0002-2026" },
    update: {},
    create: {
      name: "Casamento Silva & Costa",
      number: "PROJ_0002-2026",
      clientId: clients[1],
      description: "Casamento com 250 convidados",
      location: "Quinta dos Amores, Porto",
      startDate: twoWeeks,
      endDate: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 15),
      status: "CONFIRMADO",
    },
  });

  await prisma.project.upsert({
    where: { number: "PROJ_0003-2026" },
    update: {},
    create: {
      name: "Conferência Tech Summit",
      number: "PROJ_0003-2026",
      clientId: clients[3],
      description: "Conferência tecnologia com streaming",
      location: "Centro Congressos, Coimbra",
      startDate: threeWeeks,
      endDate: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 22),
      status: "CONFIRMADO",
    },
  });

  await prisma.project.upsert({
    where: { number: "PROJ_0004-2026" },
    update: {},
    create: {
      name: "Festa Aniversário Pedro Alves",
      number: "PROJ_0004-2026",
      clientId: clients[4],
      description: "Festa de aniversário 50 anos",
      location: "Quinta da Alegria, Braga",
      startDate: nextMonth,
      endDate: new Date(today.getFullYear(), today.getMonth() + 1, 16),
      status: "ORCAMENTADO",
    },
  });

  // Add some equipment to a project
  const allEquipment = await prisma.equipment.findMany({ take: 5 });
  for (const eq of allEquipment) {
    await prisma.projectEquipment.create({
      data: {
        projectId: project.id,
        equipmentId: eq.id,
        quantity: 2,
      },
    });
  }

  console.log("  Projetos e alocações criados.");

  // Quotation
  await prisma.quotation.upsert({
    where: { number: "PR_0001-2026" },
    update: {},
    create: {
      number: "PR_0001-2026",
      clientId: clients[0],
      location: "Parque das Nações, Lisboa",
      startDate: nextWeek,
      endDate: nextWeekEnd,
      date: today,
      validUntil: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 30),
      subtotal: 2500,
      taxRate: 23,
      taxAmount: 575,
      total: 3075,
      status: "ENVIADO",
    },
  });

  console.log("  Orçamento criado.");

  // Departments & Positions
  const depts = ["AUDIO", "ILUMINACAO", "VIDEO", "ESTRUTURAS", "MOBILIARIO", "ADMINISTRACAO", "RECURSOS_HUMANOS", "COMERCIAL", "TRANSPORTES", "SOM"];
  for (const d of depts) {
    await prisma.department.upsert({ where: { name: d }, update: {}, create: { name: d } });
  }
  const positions = ["TECNICO_SOM", "TECNICO_VIDEO", "TECNICO_ILUMINACAO", "TECNICO_ESTRUTURAS", "MOTORISTA", "GESTOR_PROJETO", "ADMINISTRATIVO", "COMERCIAL", "DIRETOR_TECNICO", "OPERADOR_LOGISTICA"];
  for (const p of positions) {
    await prisma.position.upsert({ where: { name: p }, update: {}, create: { name: p } });
  }
  console.log("  Departamentos e Funções criados.");

  // Company info
  await prisma.companyInfo.upsert({ where: { id: "default" }, update: {}, create: { id: "default" } });
  console.log("  Dados da empresa inicializados.");

  console.log("\nSeed concluído com sucesso!");
  console.log("\nCredenciais de acesso:");
  console.log("  Email: admin@admin.pt");
  console.log("  Senha: 114494");
}

main()
  .catch((e) => {
    console.error("Erro no seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
