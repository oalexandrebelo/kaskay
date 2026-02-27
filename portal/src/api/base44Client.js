/**
 * SHIM DE COMPATIBILIDADE — Base44 → Supabase
 *
 * Este arquivo é um stub temporário para que as páginas que ainda usam
 * `base44.entities.*` não quebrem o build enquanto são migradas para Supabase.
 *
 * Use sempre `supabaseClient.js` para novos desenvolvimentos.
 * Migre os imports deste arquivo progressivamente.
 */

import { supabase } from './supabaseClient';

const makeEntityShim = (tableName) => ({
  list: async (ordering, limit) => {
    let q = supabase.from(tableName).select('*');
    if (limit) q = q.limit(limit);
    const { data } = await q;
    return data ?? [];
  },
  filter: async (filters) => {
    let q = supabase.from(tableName).select('*');
    for (const [key, value] of Object.entries(filters)) {
      q = q.eq(key, value);
    }
    const { data } = await q;
    return data ?? [];
  },
  get: async (id) => {
    const { data } = await supabase.from(tableName).select('*').eq('id', id).single();
    return data;
  },
  create: async (payload) => {
    const { data } = await supabase.from(tableName).insert(payload).select().single();
    return data;
  },
  update: async (id, payload) => {
    const { data } = await supabase.from(tableName).update(payload).eq('id', id).select().single();
    return data;
  },
  delete: async (id) => {
    await supabase.from(tableName).delete().eq('id', id);
  },
});

// Mapeamento Base44 entity name → Supabase table name
const entityMap = {
  Proposal: 'proposals',
  Client: 'clients',
  AverbationVerification: 'averbation_verifications',
  ConvenioConfig: 'convenio_configs',
  ConvenioDocument: 'convenio_documents',
  Task: 'tasks',
  Alert: 'alerts',
  FinancialReconciliation: 'financial_reconciliations',
  ClientUser: 'client_users',
  ServerUser: 'server_users',
};

const entitiesProxy = new Proxy({}, {
  get(_, entityName) {
    const table = entityMap[entityName];
    if (!table) {
      console.warn(`[base44 shim] Entidade '${entityName}' não mapeada. Adicione em entityMap.`);
      return makeEntityShim(entityName.toLowerCase() + 's');
    }
    return makeEntityShim(table);
  }
});

// Funções remotas — chamam Supabase Edge Functions
const callFunction = async (name, payload = {}) => {
  const { data, error } = await supabase.functions.invoke(name, { body: payload });
  if (error) throw error;
  return data;
};

export const base44 = {
  entities: entitiesProxy,
  auth: {
    me: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    },
    logout: async () => {
      await supabase.auth.signOut();
      window.location.href = '/PortalLogin';
    },
    redirectToLogin: () => {
      window.location.href = '/PortalLogin';
    },
  },
  functions: {
    invoke: callFunction,
  },
  // Alias compatível com base44.asServiceRole.entities
  asServiceRole: {
    entities: entitiesProxy,
  },
  appLogs: {
    logUserInApp: async () => {}, // no-op
  },
};
