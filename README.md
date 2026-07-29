# SmartEventManager

Sistema de gestão para empresas de aluguer de equipamentos de eventos (áudio, vídeo, iluminação, estruturas, mobiliário).

**Stack:** Next.js 16 + TypeScript + Prisma + SQLite + Shadcn/ui + Tailwind CSS

## Instalação Local

```bash
git clone https://github.com/sharillas/SmartEventPro.git
cd SmartEventPro
npm install
cp .env.example .env
npx prisma generate
npx prisma migrate dev --name init
npx tsx prisma/seed.ts
npm run dev
```

Aceder: http://localhost:3000
- Email: admin@admin.pt
- Senha: 114494

## Instalação VPS (Debian/Ubuntu)

```bash
git clone https://github.com/sharillas/SmartEventPro.git
cd SmartEventPro
chmod +x install.sh
sudo ./install.sh
```

O script instala automaticamente: Node.js, Nginx, PM2, dependências, base de dados, build e SSL (opcional).

## Atualizar App na VPS

```bash
cd /opt/smartevent
git pull
npm install
npx prisma generate
npx prisma migrate deploy
npm run build
pm2 restart smartevent
```

## Módulos

- **Dashboard** — Visão geral, projetos recentes, alertas stock
- **Logística** — Equipamentos, Reparações, Guias Transporte, Veículos, Notas Encomenda
- **Comercial** — Orçamentos (com PDF), Clientes/Fornecedores/Entidades, Faturação
- **RH** — Colaboradores, Departamentos, Funções, EPIs, Certificações
- **Financeiro** — Faturas com PDF, geração a partir de orçamento aceite
- **Definições** — Dados da empresa, Utilizadores
