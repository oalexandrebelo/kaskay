# Kaskay — Sistema de Gestão de Crédito Consignado

Monorepo do sistema Kaskay, plataforma completa de gestão de crédito consignado.

## Estrutura

```
kaskay/
├── portal/       # Painel operacional (React + Vite + Supabase)
├── lp/           # Landing page de captação (React + Vite + Supabase)
└── supabase/     # Migrations SQL e Edge Functions
    ├── migrations/
    └── functions/
```

## Stack

- **Frontend**: React 18, Vite, Tailwind CSS, shadcn/ui
- **Backend**: Supabase (PostgreSQL, Auth, Edge Functions)
- **Linguagem das funções**: TypeScript/Deno

## Setup Rápido

### Portal
```bash
cd portal
npm install
cp .env.example .env.local   # configurar VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY
npm run dev
```

### LP
```bash
cd lp
npm install
cp .env.example .env.local   # configurar VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY
npm run dev
```

### Supabase
```bash
# Aplicar migrations
supabase db push
# ou executar arquivos em supabase/migrations/ pelo Dashboard
```

## Variáveis de Ambiente

```env
VITE_SUPABASE_URL=https://awammkfmowcwpwobmzqg.supabase.co
VITE_SUPABASE_ANON_KEY=<sua_anon_key>
```

Obter chaves em: https://supabase.com/dashboard/project/awammkfmowcwpwobmzqg/settings/api
