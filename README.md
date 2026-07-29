# SmartEventManager

Sistema de gestão para empresas de aluguer de equipamentos de eventos (áudio, vídeo, iluminação, estruturas, mobiliário).

**Stack:** Next.js 16 + TypeScript + Prisma + SQLite + Shadcn/ui + Tailwind CSS

## Instalação Local

```bash
git clone https://github.com/sharillas/SmartEventApp.git
cd SmartEventApp
npm install
cp .env.example .env
npx prisma generate
npx prisma migrate dev --name init
npx tsx prisma/seed.ts
npx tsx prisma/seed-departments.ts
npm run dev
```

## Acesso

- **URL:** http://localhost:3000
- **Email:** admin@rentpro.pt
- **Senha:** admin123

## Instalação VPS (Debian/Ubuntu)

```bash
chmod +x install.sh
sudo ./install.sh
```

## Módulos

- Dashboard
- Logística: Equipamentos, Reparações, Guias Transporte, Veículos, Notas Encomenda
- Comercial: Orçamentos (com PDF), Clientes/Fornecedores/Entidades, Faturação
- RH: Colaboradores, Departamentos, Funções, EPIs, Certificações
- Financeiro: Faturas com PDF
- Definições: Dados da empresa, Utilizadores
