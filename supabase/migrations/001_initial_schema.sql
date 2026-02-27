-- ============================================================
-- Kaskay - Schema Inicial
-- Sistema de Gestão de Crédito Consignado
-- Criado em: 2026-02-26
-- ============================================================

-- Extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- busca textual eficiente em CPF/nome

-- ============================================================
-- ENUM TYPES
-- ============================================================

CREATE TYPE user_role AS ENUM (
  'admin_master',
  'admin',
  'gestor',
  'analista_credito',
  'analista_operacoes',
  'operador',
  'correspondente',
  'financeiro',
  'compliance',
  'atendimento'
);

CREATE TYPE proposal_status AS ENUM (
  'rascunho',
  'em_analise',
  'aprovada',
  'reprovada',
  'pendente_assinatura',
  'assinada',
  'em_averbacao',
  'averbada',
  'em_desembolso',
  'desembolsada',
  'cancelada',
  'em_recurso'
);

CREATE TYPE client_status AS ENUM (
  'ativo',
  'inativo',
  'bloqueado',
  'blacklist'
);

CREATE TYPE convenio_status AS ENUM (
  'ativo',
  'inativo',
  'em_implantacao',
  'suspenso'
);

CREATE TYPE document_status AS ENUM (
  'pendente',
  'enviado',
  'aprovado',
  'reprovado'
);

CREATE TYPE task_priority AS ENUM (
  'critica',
  'alta',
  'media',
  'baixa'
);

CREATE TYPE task_status AS ENUM (
  'pendente',
  'em_andamento',
  'concluida',
  'cancelada'
);

CREATE TYPE alert_severity AS ENUM (
  'critico',
  'alto',
  'medio',
  'baixo',
  'info'
);

CREATE TYPE product_type AS ENUM (
  'emprestimo_pessoal',
  'refinanciamento',
  'portabilidade',
  'cartao_consignado',
  'saque_fgts'
);

CREATE TYPE margin_manager AS ENUM (
  'consignet',
  'konsi',
  'bmg_consig',
  'qi_tech',
  'dataprev',
  'outro'
);

CREATE TYPE averbation_status AS ENUM (
  'pendente',
  'reservada',
  'averbada',
  'cancelada',
  'erro'
);

CREATE TYPE reconciliation_status AS ENUM (
  'pendente',
  'processando',
  'concluida',
  'com_divergencias',
  'erro'
);

-- ============================================================
-- TABELA: convenio_configs (Convênios/Empregadores)
-- ============================================================

CREATE TABLE convenio_configs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome VARCHAR(255) NOT NULL,
  cnpj VARCHAR(18) NOT NULL UNIQUE,
  tipo VARCHAR(50) NOT NULL DEFAULT 'publico', -- publico, privado, inss
  status convenio_status NOT NULL DEFAULT 'em_implantacao',
  gerenciadora_margem margin_manager,
  codigo_convenio VARCHAR(100),
  margem_maxima_percentual DECIMAL(5,2) DEFAULT 30.00,
  prazo_max_meses INTEGER DEFAULT 96,
  taxa_minima DECIMAL(6,4),
  taxa_maxima DECIMAL(6,4),
  produtos_habilitados product_type[] DEFAULT '{}',
  regras_elegibilidade JSONB DEFAULT '{}',
  credenciais_integracao JSONB DEFAULT '{}', -- criptografado
  cnpjs_operadores TEXT[] DEFAULT '{}',
  contato_responsavel JSONB DEFAULT '{}',
  documentos_necessarios TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABELA: clients (Clientes)
-- ============================================================

CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cpf VARCHAR(14) NOT NULL UNIQUE,
  nome VARCHAR(255) NOT NULL,
  nome_mae VARCHAR(255),
  data_nascimento DATE,
  email VARCHAR(255),
  telefone VARCHAR(20),
  telefone_secundario VARCHAR(20),
  status client_status NOT NULL DEFAULT 'ativo',

  -- Endereço
  cep VARCHAR(10),
  logradouro VARCHAR(255),
  numero VARCHAR(20),
  complemento VARCHAR(100),
  bairro VARCHAR(100),
  cidade VARCHAR(100),
  uf CHAR(2),

  -- Dados bancários
  banco_codigo VARCHAR(10),
  banco_nome VARCHAR(100),
  agencia VARCHAR(10),
  conta VARCHAR(20),
  conta_tipo VARCHAR(20), -- corrente, poupanca, pagamento
  pix_chave VARCHAR(255),

  -- Vínculo empregatício
  convenio_id UUID REFERENCES convenio_configs(id),
  matricula VARCHAR(100),
  cargo VARCHAR(100),
  data_admissao DATE,
  salario_bruto DECIMAL(12,2),

  -- Scores
  score_credito INTEGER, -- 0-1000
  score_fraude INTEGER,  -- 0-100 (quanto maior, mais suspeito)
  nivel_risco VARCHAR(20), -- baixo, medio, alto, muito_alto

  -- Documentos
  rg VARCHAR(30),
  rg_orgao_emissor VARCHAR(50),
  rg_uf CHAR(2),
  rg_data_emissao DATE,
  cnh VARCHAR(20),

  -- Flags
  em_blacklist BOOLEAN NOT NULL DEFAULT FALSE,
  blacklist_motivo TEXT,
  lgpd_consentimento BOOLEAN DEFAULT FALSE,
  lgpd_data_consentimento TIMESTAMPTZ,

  -- Metadados
  origem VARCHAR(50), -- portal, whatsapp, atendimento, api
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_clients_cpf ON clients(cpf);
CREATE INDEX idx_clients_nome ON clients USING gin(nome gin_trgm_ops);
CREATE INDEX idx_clients_convenio ON clients(convenio_id);
CREATE INDEX idx_clients_status ON clients(status);

-- ============================================================
-- TABELA: proposals (Propostas)
-- ============================================================

CREATE TABLE proposals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  numero VARCHAR(30) NOT NULL UNIQUE, -- PROP-202602-0001
  client_id UUID NOT NULL REFERENCES clients(id),
  convenio_id UUID REFERENCES convenio_configs(id),

  -- Produto e valores
  produto_tipo product_type NOT NULL DEFAULT 'emprestimo_pessoal',
  valor_solicitado DECIMAL(12,2) NOT NULL,
  valor_aprovado DECIMAL(12,2),
  valor_parcela DECIMAL(12,2),
  prazo_meses INTEGER NOT NULL,
  taxa_mensal DECIMAL(6,4),
  taxa_anual DECIMAL(6,4),
  cet DECIMAL(6,4), -- Custo Efetivo Total
  iof DECIMAL(12,2),
  valor_liquido DECIMAL(12,2), -- valor desembolsado ao cliente

  -- Status e fluxo
  status proposal_status NOT NULL DEFAULT 'rascunho',
  motivo_reprovacao TEXT,
  observacoes TEXT,

  -- Dados de decisão de crédito
  score_proposta INTEGER,
  score_fraude INTEGER,
  decisao_automatica VARCHAR(20), -- aprovada, reprovada, manual
  analista_id UUID, -- quem analisou manualmente

  -- CCB e Assinatura
  ccb_numero VARCHAR(100),
  ccb_id_externo VARCHAR(255),
  ccb_gerada_em TIMESTAMPTZ,
  signature_id VARCHAR(255),
  signature_provider VARCHAR(50), -- clicksign, d4sign, docusign
  signature_url TEXT,
  assinada_em TIMESTAMPTZ,

  -- Averbação
  averbation_id UUID,
  margem_reservada DECIMAL(12,2),
  margem_averbada DECIMAL(12,2),
  data_reserva_margem TIMESTAMPTZ,
  data_averbacao TIMESTAMPTZ,

  -- Desembolso
  cnpj_operador VARCHAR(18), -- CNPJ que vai receber
  banco_destino_codigo VARCHAR(10),
  banco_destino_nome VARCHAR(100),
  agencia_destino VARCHAR(10),
  conta_destino VARCHAR(20),
  pix_destino VARCHAR(255),
  data_desembolso TIMESTAMPTZ,
  id_transacao_desembolso VARCHAR(255),

  -- Metadados
  canal_origem VARCHAR(50), -- portal, whatsapp, atendimento, api
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_proposals_numero ON proposals(numero);
CREATE INDEX idx_proposals_client ON proposals(client_id);
CREATE INDEX idx_proposals_status ON proposals(status);
CREATE INDEX idx_proposals_convenio ON proposals(convenio_id);
CREATE INDEX idx_proposals_created_at ON proposals(created_at DESC);

-- ============================================================
-- TABELA: proposal_history (Histórico de Status das Propostas)
-- ============================================================

CREATE TABLE proposal_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  proposal_id UUID NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
  status_anterior proposal_status,
  status_novo proposal_status NOT NULL,
  descricao TEXT,
  usuario_id UUID,
  usuario_nome VARCHAR(255),
  dados_extras JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_proposal_history_proposal ON proposal_history(proposal_id);

-- ============================================================
-- TABELA: averbation_verifications (Verificações de Averbação)
-- ============================================================

CREATE TABLE averbation_verifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  proposal_id UUID NOT NULL REFERENCES proposals(id),
  convenio_id UUID REFERENCES convenio_configs(id),
  client_id UUID NOT NULL REFERENCES clients(id),

  status averbation_status NOT NULL DEFAULT 'pendente',
  gerenciadora margin_manager,

  -- Margem
  margem_disponivel DECIMAL(12,2),
  margem_reservada DECIMAL(12,2),
  margem_averbada DECIMAL(12,2),

  -- Verificação dupla
  verificacao_1_usuario UUID,
  verificacao_1_em TIMESTAMPTZ,
  verificacao_2_usuario UUID,
  verificacao_2_em TIMESTAMPTZ,

  -- Dados externos
  protocolo_externo VARCHAR(255),
  resposta_gerenciadora JSONB DEFAULT '{}',
  tentativas INTEGER DEFAULT 0,
  erro_mensagem TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_averbation_proposal ON averbation_verifications(proposal_id);
CREATE INDEX idx_averbation_status ON averbation_verifications(status);

-- ============================================================
-- TABELA: tasks (Fila de Tarefas)
-- ============================================================

CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tipo VARCHAR(100) NOT NULL,
  titulo VARCHAR(255) NOT NULL,
  descricao TEXT,
  priority task_priority NOT NULL DEFAULT 'media',
  status task_status NOT NULL DEFAULT 'pendente',

  -- Vínculo
  proposal_id UUID REFERENCES proposals(id),
  client_id UUID REFERENCES clients(id),
  convenio_id UUID REFERENCES convenio_configs(id),

  -- Responsabilidade
  responsavel_id UUID,
  responsavel_nome VARCHAR(255),
  equipe VARCHAR(100),

  -- SLA
  sla_horas INTEGER,
  prazo TIMESTAMPTZ,
  concluida_em TIMESTAMPTZ,

  -- Dados extras
  dados JSONB DEFAULT '{}',

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_priority ON tasks(priority);
CREATE INDEX idx_tasks_responsavel ON tasks(responsavel_id);
CREATE INDEX idx_tasks_proposal ON tasks(proposal_id);

-- ============================================================
-- TABELA: alerts (Alertas do Sistema)
-- ============================================================

CREATE TABLE alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tipo VARCHAR(100) NOT NULL,
  titulo VARCHAR(255) NOT NULL,
  mensagem TEXT NOT NULL,
  severity alert_severity NOT NULL DEFAULT 'info',

  -- Vínculo opcional
  proposal_id UUID REFERENCES proposals(id),
  client_id UUID REFERENCES clients(id),

  -- Controle
  lido BOOLEAN NOT NULL DEFAULT FALSE,
  lido_por UUID,
  lido_em TIMESTAMPTZ,
  resolvido BOOLEAN NOT NULL DEFAULT FALSE,
  resolvido_por UUID,
  resolvido_em TIMESTAMPTZ,

  -- Destinatário
  para_usuario_id UUID,
  para_role user_role,

  dados JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_alerts_lido ON alerts(lido);
CREATE INDEX idx_alerts_severity ON alerts(severity);
CREATE INDEX idx_alerts_created_at ON alerts(created_at DESC);

-- ============================================================
-- TABELA: financial_reconciliations (Reconciliação Financeira)
-- ============================================================

CREATE TABLE financial_reconciliations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tipo VARCHAR(50) NOT NULL, -- remessa, retorno
  nome_arquivo VARCHAR(255) NOT NULL,
  cnpj VARCHAR(18),
  banco VARCHAR(100),
  competencia DATE,
  status reconciliation_status NOT NULL DEFAULT 'pendente',

  -- Totais
  total_registros INTEGER DEFAULT 0,
  total_conciliados INTEGER DEFAULT 0,
  total_divergencias INTEGER DEFAULT 0,
  valor_total DECIMAL(15,2),
  valor_conciliado DECIMAL(15,2),
  valor_divergencias DECIMAL(15,2),

  -- Resultado
  divergencias JSONB DEFAULT '[]',
  relatorio_url TEXT,

  -- Metadados
  processado_por UUID,
  processado_em TIMESTAMPTZ,
  dados_extras JSONB DEFAULT '{}',

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABELA: convenio_documents (Documentos dos Convênios)
-- ============================================================

CREATE TABLE convenio_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  convenio_id UUID NOT NULL REFERENCES convenio_configs(id) ON DELETE CASCADE,
  tipo VARCHAR(100) NOT NULL,
  nome VARCHAR(255) NOT NULL,
  url TEXT,
  storage_path TEXT,
  status document_status NOT NULL DEFAULT 'pendente',
  validade DATE,
  observacoes TEXT,
  uploaded_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_convenio_documents_convenio ON convenio_documents(convenio_id);
CREATE INDEX idx_convenio_documents_status ON convenio_documents(status);

-- ============================================================
-- TABELA: server_users (Operadores, Analistas, Admins)
-- ============================================================

CREATE TABLE server_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_user_id UUID UNIQUE, -- vinculado a auth.users do Supabase
  nome VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  cpf VARCHAR(14) UNIQUE,
  telefone VARCHAR(20),
  role user_role NOT NULL DEFAULT 'operador',
  ativo BOOLEAN NOT NULL DEFAULT TRUE,

  -- Permissões extras
  convenios_ids UUID[] DEFAULT '{}', -- convênios que pode operar
  cnpjs_ids TEXT[] DEFAULT '{}',     -- CNPJs que pode operar

  -- Segurança
  ultimo_login TIMESTAMPTZ,
  dispositivos_confiados JSONB DEFAULT '[]',
  tentativas_login INTEGER DEFAULT 0,
  bloqueado_ate TIMESTAMPTZ,

  -- Convite
  convidado_por UUID,
  convite_token VARCHAR(255),
  convite_expira TIMESTAMPTZ,
  convite_aceito BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_server_users_email ON server_users(email);
CREATE INDEX idx_server_users_role ON server_users(role);

-- ============================================================
-- TABELA: client_users (Clientes com acesso ao Portal do Cliente)
-- ============================================================

CREATE TABLE client_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_user_id UUID UNIQUE, -- vinculado a auth.users do Supabase
  client_id UUID NOT NULL REFERENCES clients(id),
  cpf VARCHAR(14) NOT NULL UNIQUE,
  email VARCHAR(255),
  telefone VARCHAR(20),
  ativo BOOLEAN NOT NULL DEFAULT TRUE,

  -- Primeiro acesso
  primeiro_acesso_concluido BOOLEAN DEFAULT FALSE,
  codigo_verificacao VARCHAR(10),
  codigo_expira TIMESTAMPTZ,

  ultimo_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_client_users_cpf ON client_users(cpf);
CREATE INDEX idx_client_users_client ON client_users(client_id);

-- ============================================================
-- TABELA: audit_logs (Logs de Auditoria)
-- ============================================================

CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuario_id UUID,
  usuario_email VARCHAR(255),
  usuario_role VARCHAR(50),
  acao VARCHAR(100) NOT NULL,
  entidade VARCHAR(100) NOT NULL,
  entidade_id UUID,
  dados_antes JSONB,
  dados_depois JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_usuario ON audit_logs(usuario_id);
CREATE INDEX idx_audit_logs_entidade ON audit_logs(entidade, entidade_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- ============================================================
-- FUNCTIONS: updated_at automático
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_convenio_configs_updated_at
  BEFORE UPDATE ON convenio_configs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_clients_updated_at
  BEFORE UPDATE ON clients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_proposals_updated_at
  BEFORE UPDATE ON proposals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_averbation_updated_at
  BEFORE UPDATE ON averbation_verifications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_financial_reconciliations_updated_at
  BEFORE UPDATE ON financial_reconciliations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_convenio_documents_updated_at
  BEFORE UPDATE ON convenio_documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_server_users_updated_at
  BEFORE UPDATE ON server_users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_client_users_updated_at
  BEFORE UPDATE ON client_users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
