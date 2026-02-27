-- ============================================================
-- Kaskay - Row Level Security (RLS)
-- Controle de acesso granular por role
-- ============================================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE convenio_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposal_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE averbation_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_reconciliations ENABLE ROW LEVEL SECURITY;
ALTER TABLE convenio_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE server_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- HELPER FUNCTIONS
-- ============================================================

-- Retorna o role do usuário autenticado
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
  SELECT COALESCE(
    (auth.jwt() -> 'user_metadata' ->> 'role'),
    'atendimento'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Verifica se o usuário é admin (admin_master ou admin)
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
  SELECT get_user_role() IN ('admin_master', 'admin');
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Verifica se é usuário do servidor (não cliente)
CREATE OR REPLACE FUNCTION is_server_user()
RETURNS BOOLEAN AS $$
  SELECT get_user_role() != 'cliente';
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================================
-- POLÍTICAS: convenio_configs
-- ============================================================

-- Leitura: todos os usuários do servidor
CREATE POLICY "convenio_read_server" ON convenio_configs
  FOR SELECT USING (is_server_user());

-- Escrita: apenas admins e gestores
CREATE POLICY "convenio_write_admin" ON convenio_configs
  FOR ALL USING (get_user_role() IN ('admin_master', 'admin', 'gestor'));

-- ============================================================
-- POLÍTICAS: clients
-- ============================================================

-- Leitura: usuários do servidor
CREATE POLICY "clients_read_server" ON clients
  FOR SELECT USING (is_server_user());

-- Cliente lê apenas seus próprios dados
CREATE POLICY "clients_read_own" ON clients
  FOR SELECT USING (
    get_user_role() = 'cliente' AND
    id = (
      SELECT client_id FROM client_users
      WHERE auth_user_id = auth.uid()
      LIMIT 1
    )
  );

-- Escrita: operadores e acima
CREATE POLICY "clients_write_operator" ON clients
  FOR ALL USING (
    get_user_role() IN ('admin_master', 'admin', 'gestor', 'analista_credito', 'analista_operacoes', 'operador', 'correspondente', 'atendimento')
  );

-- ============================================================
-- POLÍTICAS: proposals
-- ============================================================

-- Leitura: usuários do servidor
CREATE POLICY "proposals_read_server" ON proposals
  FOR SELECT USING (is_server_user());

-- Cliente lê apenas suas propostas
CREATE POLICY "proposals_read_own_client" ON proposals
  FOR SELECT USING (
    get_user_role() = 'cliente' AND
    client_id = (
      SELECT client_id FROM client_users
      WHERE auth_user_id = auth.uid()
      LIMIT 1
    )
  );

-- Criação: operadores e acima
CREATE POLICY "proposals_insert_operator" ON proposals
  FOR INSERT WITH CHECK (
    get_user_role() IN ('admin_master', 'admin', 'gestor', 'analista_credito', 'analista_operacoes', 'operador', 'correspondente', 'atendimento')
  );

-- Atualização: analistas e acima
CREATE POLICY "proposals_update_analyst" ON proposals
  FOR UPDATE USING (
    get_user_role() IN ('admin_master', 'admin', 'gestor', 'analista_credito', 'analista_operacoes', 'operador', 'financeiro')
  );

-- ============================================================
-- POLÍTICAS: proposal_history
-- ============================================================

CREATE POLICY "proposal_history_read_server" ON proposal_history
  FOR SELECT USING (is_server_user());

CREATE POLICY "proposal_history_insert_server" ON proposal_history
  FOR INSERT WITH CHECK (is_server_user());

-- ============================================================
-- POLÍTICAS: averbation_verifications
-- ============================================================

CREATE POLICY "averbation_read_server" ON averbation_verifications
  FOR SELECT USING (is_server_user());

CREATE POLICY "averbation_write_ops" ON averbation_verifications
  FOR ALL USING (
    get_user_role() IN ('admin_master', 'admin', 'gestor', 'analista_operacoes', 'operador', 'financeiro')
  );

-- ============================================================
-- POLÍTICAS: tasks
-- ============================================================

-- Cada usuário vê suas próprias tarefas + admins veem tudo
CREATE POLICY "tasks_read" ON tasks
  FOR SELECT USING (
    is_admin() OR
    get_user_role() IN ('gestor') OR
    responsavel_id = auth.uid()
  );

CREATE POLICY "tasks_write_server" ON tasks
  FOR ALL USING (is_server_user());

-- ============================================================
-- POLÍTICAS: alerts
-- ============================================================

-- Usuário vê alertas direcionados a ele ou ao seu role
CREATE POLICY "alerts_read" ON alerts
  FOR SELECT USING (
    is_admin() OR
    para_usuario_id = auth.uid() OR
    para_role::text = get_user_role()
  );

CREATE POLICY "alerts_update_own" ON alerts
  FOR UPDATE USING (
    para_usuario_id = auth.uid() OR is_admin()
  );

-- ============================================================
-- POLÍTICAS: financial_reconciliations
-- ============================================================

CREATE POLICY "reconciliation_read_financial" ON financial_reconciliations
  FOR SELECT USING (
    get_user_role() IN ('admin_master', 'admin', 'gestor', 'financeiro', 'compliance')
  );

CREATE POLICY "reconciliation_write_financial" ON financial_reconciliations
  FOR ALL USING (
    get_user_role() IN ('admin_master', 'admin', 'financeiro')
  );

-- ============================================================
-- POLÍTICAS: convenio_documents
-- ============================================================

CREATE POLICY "convenio_docs_read_server" ON convenio_documents
  FOR SELECT USING (is_server_user());

CREATE POLICY "convenio_docs_write" ON convenio_documents
  FOR ALL USING (
    get_user_role() IN ('admin_master', 'admin', 'gestor', 'compliance')
  );

-- ============================================================
-- POLÍTICAS: server_users
-- ============================================================

-- Cada usuário vê seu próprio perfil; admins veem todos
CREATE POLICY "server_users_read" ON server_users
  FOR SELECT USING (
    is_admin() OR
    auth_user_id = auth.uid()
  );

-- Apenas admins podem criar/editar outros usuários
CREATE POLICY "server_users_write_admin" ON server_users
  FOR ALL USING (is_admin());

-- ============================================================
-- POLÍTICAS: client_users
-- ============================================================

-- Cliente acessa apenas seu próprio registro
CREATE POLICY "client_users_read_own" ON client_users
  FOR SELECT USING (
    auth_user_id = auth.uid() OR is_server_user()
  );

CREATE POLICY "client_users_write_server" ON client_users
  FOR ALL USING (is_server_user());

-- ============================================================
-- POLÍTICAS: audit_logs
-- ============================================================

-- Apenas compliance e admins leem logs
CREATE POLICY "audit_read_compliance" ON audit_logs
  FOR SELECT USING (
    get_user_role() IN ('admin_master', 'admin', 'compliance')
  );

-- Qualquer usuário autenticado pode inserir (via service role nas Edge Functions)
CREATE POLICY "audit_insert_any" ON audit_logs
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
