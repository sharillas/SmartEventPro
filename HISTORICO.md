# SmartEventManager — Histórico de Desenvolvimento v0.2.0

**Data:** Julho 2026  
**Versão inicial:** 0.1.0 → **Versão final:** 0.2.0  
**Repositório:** https://github.com/sharillas/SmartEventPro

---

## Resumo de Todas as Implementações

### 1. Segurança
- `src/proxy.ts` — Proteção de rotas (Next.js 16), redireciona não autenticados para /login, retorna 401 para APIs
- `src/lib/auth.ts` — JWT_SECRET sem fallback hardcoded em produção, cookie `secure` condicional por NODE_ENV

### 2. Correções de Bugs
- **PATCH endpoints**: Todos os 15 corrigidos para filtrar campos vazios e converter tipos (números, datas)
- **Select Base UI**: Adicionado prop `items` (mapeamento id→nome) em todos os Selects de colaborador
- **Formulário edição RH**: `handleColabEdit` populava campos com strings vazias em vez dos dados reais
- **Resposta paginada**: `veiculos-rh` e RH page (EPIs/Certs) corrigidos para usar `result.data`
- **Sintaxe notas-encomenda**: Corrigido bug de parsing no map com `return (<TableRow>`

### 3. CRUD Completo
- **17 endpoints DELETE** (8 soft delete + 9 hard delete)
- **15 endpoints GET + PATCH** por ID
- **UI unificada**: coluna "Ações" com Lápis + Caixote em todas as listagens
- **ConfirmDialog**: componente reutilizável de confirmação antes de eliminar

### 4. Paginação + Filtros
- **Paginação**: componente `Pagination`, utilitários `lib/pagination.ts`, aplicado a todas as APIs
- **Filtros client-side**: template dos orçamentos aplicado a todas as listagens
- **Pesquisa removida** de todas as páginas

### 5. Novas Funcionalidades
- **Gráficos dashboard**: pizza (estado equipamentos) + barras (visão geral) com recharts
- **Páginas novas**: `/certificacoes`, `/epis`, `/contratos` (CRUD completo)
- **EPIs multi-tipo**: checkboxes + campos individuais por tipo (N.º Série, Data Entrega, Validade)
- **Certificações multi-registo**: botão "Adicionar" para múltiplas certificações de uma vez
- **Upload imagem**: endpoint `/api/upload`, input no formulário de equipamentos
- **Status colaboradores**: campo `status` (ATIVO, FERIAS, FOLGA, BAIXA, DESATIVADO) com badges coloridos
- **Renomeação**: Funções → Cargos, dropdown no formulário de colaborador

### 6. UI/UX
- **Tamanho de letra**: `text-xs` → `text-sm` em todas as tabelas
- **Breadcrumbs**: adicionados nas páginas de detalhe e criação
- **Sidebar atualizada**: links para Contratos, EPIs, Certificações, Cargos
- **Tabelas reformuladas**: Colaboradores, EPIs (agrupados), Certificações
- **Coluna "Ações" unificada**: Lápis + Caixote em todo o projeto

### 7. Base de Dados
- **Migration nova**: `20260730010238_add_employee_status`
- **Campo `status`** adicionado ao modelo Employee

### 8. Documentação
- `DOCUMENTACAO.txt` atualizada com secção 14 completa
- `README.md` mantido
- `package.json` versão 0.1.0 → 0.2.0

---

## Estatísticas Finais

| Métrica | Antes | Depois |
|---|---|---|
| Páginas | 57 | 62 |
| Endpoints API | 54 | 74 |
| Modelos Prisma | 19 | 19 (+ campo status) |
| Migrations | 6 | 7 |
| Componentes UI | 21 | 23 (+ ConfirmDialog, Pagination) |

---

## Ficheiros Novos Criados

```
src/proxy.ts
src/middleware.ts (deprecated, substituído por proxy.ts)
src/components/ui/confirm-dialog.tsx
src/components/ui/pagination.tsx
src/lib/pagination.ts
src/app/api/upload/route.ts
src/app/api/contratos/route.ts
src/app/api/contratos/[id]/route.ts
src/app/(dashboard)/certificacoes/page.tsx
src/app/(dashboard)/epis/page.tsx
src/app/(dashboard)/contratos/page.tsx
src/app/(dashboard)/orcamentos/[id]/page.tsx
src/app/(dashboard)/notas-encomenda/[id]/page.tsx
public/uploads/
prisma/migrations/20260730010238_add_employee_status/
```

---

## Comandos Úteis

```bash
# Instalar dependências
npm install

# Gerar Prisma Client e base de dados
npx prisma generate
npx prisma migrate dev --name init
npx tsx prisma/seed.ts

# Iniciar desenvolvimento
npm run dev

# Build produção
npm run build

# Push para GitHub
git add .
git commit -m "mensagem"
git push origin main
```

---

## Acesso

- **URL:** http://localhost:3000
- **Email:** admin@admin.pt
- **Senha:** 114494
