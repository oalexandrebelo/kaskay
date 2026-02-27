import React from 'react';
import { Button } from '@/components/ui/button';
import { FileText, Download } from 'lucide-react';

export default function TrainingPDF() {
  const generateTrainingPDF = async () => {
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let yPos = 15;
    const margin = 15;
    const contentWidth = pageWidth - 2 * margin;

    const addPage = () => {
      doc.addPage();
      yPos = margin;
    };

    const addTitle = (text, size = 20) => {
      doc.setFontSize(size);
      doc.setFont(undefined, 'bold');
      doc.text(text, margin, yPos);
      yPos += size / 2 + 5;
    };

    const addSubtitle = (text) => {
      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(33, 150, 243);
      doc.text(text, margin, yPos);
      yPos += 8;
    };

    const addText = (text, size = 11) => {
      doc.setFontSize(size);
      doc.setFont(undefined, 'normal');
      doc.setTextColor(0, 0, 0);
      const lines = doc.splitTextToSize(text, contentWidth);
      doc.text(lines, margin, yPos);
      yPos += lines.length * 5 + 3;
    };

    const addList = (items) => {
      doc.setFontSize(10);
      items.forEach((item) => {
        if (yPos > pageHeight - margin) addPage();
        doc.setFont(undefined, 'normal');
        doc.text(`• ${item}`, margin + 5, yPos);
        yPos += 5;
      });
      yPos += 2;
    };

    const addStep = (stepNum, title, description, tips = []) => {
      if (yPos > pageHeight - 30) addPage();
      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(33, 150, 243);
      doc.text(`Passo ${stepNum}: ${title}`, margin, yPos);
      yPos += 7;
      
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      doc.setTextColor(0, 0, 0);
      const lines = doc.splitTextToSize(description, contentWidth);
      doc.text(lines, margin, yPos);
      yPos += lines.length * 4 + 3;

      if (tips.length > 0) {
        doc.setFontSize(9);
        doc.setFont(undefined, 'italic');
        doc.setTextColor(100, 100, 100);
        addList(tips);
      }
    };

    // CAPA
    doc.setFillColor(33, 150, 243);
    doc.rect(0, 0, pageWidth, pageHeight, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(32);
    doc.setFont(undefined, 'bold');
    doc.text('KASKAY', pageWidth / 2, pageHeight / 3, { align: 'center' });
    doc.setFontSize(16);
    doc.text('Guia de Treinamento e Tutorial', pageWidth / 2, pageHeight / 3 + 20, { align: 'center' });
    doc.setFontSize(12);
    doc.text('Como usar todas as funcionalidades da plataforma', pageWidth / 2, pageHeight / 2, { align: 'center' });
    doc.text(`Versão: ${new Date().toLocaleDateString('pt-BR')}`, pageWidth / 2, pageHeight - 30, { align: 'center' });

    addPage();

    // ÍNDICE
    addTitle('ÍNDICE', 18);
    addText('1. Iniciando na Plataforma');
    addText('2. Home Operacional - Seu Painel Principal');
    addText('3. Gestão de Propostas');
    addText('4. Atendimento ao Cliente');
    addText('5. Dashboard Comercial');
    addText('6. Operações Financeiras');
    addText('7. Convênios e Relacionamento');
    addText('8. Governança e Aprovações');
    addText('9. Configurações e Integrações');
    addText('10. Dicas e Boas Práticas');
    yPos += 10;

    // 1. INICIANDO
    if (yPos > pageHeight - 50) addPage();
    addSubtitle('1. INICIANDO NA PLATAFORMA');
    addText('Bem-vindo ao KASKAY! Neste guia, você aprenderá a usar todas as funcionalidades da plataforma passo a passo.');
    
    addStep(1, 'Login', 'Acesse a plataforma usando suas credenciais. Se for seu primeiro acesso, você receberá um SMS com um código de verificação.');
    addStep(2, 'Entender o Menu Principal', 'Após logar, você verá o menu lateral esquerdo com todas as seções. Clique em cada seção para explorar as funcionalidades disponíveis para seu perfil.');
    addStep(3, 'Personalizar seu Menu', 'Clique em "Personalizar Menu" no rodapé do sidebar para reordenar as opções conforme sua preferência.');

    // 2. HOME OPERACIONAL
    if (yPos > pageHeight - 50) addPage();
    addSubtitle('2. HOME OPERACIONAL - SEU PAINEL PRINCIPAL');
    addText('A Home Operacional é seu painel de controle com visão em tempo real de todas as operações críticas.');
    
    addStep(1, 'Visualizar Tarefas Pendentes', 'No topo esquerdo, você verá o widget "Tarefas Pendentes" com todas as tarefas atribuídas. As cores dos badges indicam a prioridade (Urgente = Vermelho, Alta = Laranja, Média = Amarelo, Baixa = Azul).');
    addStep(2, 'Monitorar Alertas Críticos', 'No topo direito, verifique os "Alertas Críticos" em tempo real. Se nenhum alerta aparecer, sua operação está saudável.');
    addStep(3, 'Acompanhar Métricas Operacionais', 'Observe as 4 caixas de métricas: propostas em análise, averbações pendentes, tarefas urgentes e saúde operacional.');
    addStep(4, 'Revisar Exceções', 'Scroll para baixo e veja as "Exceções em Aberto". Cada exceção é um item que precisa atenção especial.');

    // 3. PROPOSTAS
    if (yPos > pageHeight - 50) addPage();
    addSubtitle('3. GESTÃO DE PROPOSTAS');
    addText('As propostas são o coração do negócio. Aqui você cria, analisa, aprova e acompanha todas as solicitações de crédito.');
    
    addStep(1, 'Acessar Propostas', 'Clique em "Propostas" no menu "Operações". Você verá uma lista de todas as propostas com filtros disponíveis.');
    addStep(2, 'Criar Nova Proposta', 'Clique no botão "Nova Proposta". Preencha os dados do cliente (CPF, nome, telefone), escolha o tipo de produto e defina o valor solicitado.');
    addStep(3, 'Analisar Proposta', 'Clique na proposta para ver seus detalhes. Revise os documentos anexados, a margem disponível e o score automático gerado pelo sistema.');
    addStep(4, 'Aprovar ou Rejeitar', 'Use os botões de ação para aprovar (a proposta segue para emissão de CCB) ou rejeitar (indique o motivo da rejeição).');
    addStep(5, 'Acompanhar Status', 'Observe o status atual: Draft → Análise → Aprovação → Averbação → Desembolso. Cada etapa tem ações específicas.', [
      'Draft: Proposta em criação',
      'Under Analysis: Aguardando análise',
      'Margin Check: Validando margem com gestora',
      'Averbated: Pronta para desembolso',
      'Disbursed: Desembolsada'
    ]);

    // 4. ATENDIMENTO
    if (yPos > pageHeight - 50) addPage();
    addSubtitle('4. ATENDIMENTO AO CLIENTE');
    addText('Múltiplos canais para atender seus clientes: Central de Atendimento, WhatsApp, Web e Simulador de Crédito.');
    
    addStep(1, 'Central de Atendimento', 'Acesse "Central de Atendimento" para gerenciar chamados de clientes. Aqui você tem uma visão unificada de todas as interações.');
    addStep(2, 'Simulador de Crédito', 'Use o "Simulador de Crédito" para calcular parcelas e taxas. O cliente insere o valor desejado e vê as opções de parcelamento.');
    addStep(3, 'WhatsApp Automático', 'O agente de IA responde automaticamente via WhatsApp. Para casos complexos, transfira para um operador humano clicando em "Transferir".');
    addStep(4, 'Responder Cliente', 'Toda interação fica registrada. Use as templates disponíveis para responder rapidamente e manter histórico de conversas.');

    // 5. DASHBOARD COMERCIAL
    if (yPos > pageHeight - 50) addPage();
    addSubtitle('5. DASHBOARD COMERCIAL');
    addText('Acompanhe os indicadores comerciais, volume de propostas, taxas de aprovação e performance por convênio.');
    
    addStep(1, 'KPIs Comerciais', 'Na primeira seção, veja o total de propostas criadas no período, aprovadas, rejeitadas e volume por convênio.');
    addStep(2, 'Análise de Rejeições', 'Identifique os motivos mais frequentes de rejeição. Use esses dados para melhorar sua abordagem.');
    addStep(3, 'Pipeline de Operações', 'Veja o funil de propostas: quantas em cada etapa (análise, averbação, desembolso, etc).');
    addStep(4, 'Customizar Dashboard', 'Clique em "Personalizar Dashboard" para adicionar/remover widgets conforme sua necessidade.');

    // 6. FINANCEIRO
    if (yPos > pageHeight - 50) addPage();
    addSubtitle('6. OPERAÇÕES FINANCEIRAS');
    addText('Gestão completa de fluxos financeiros: caixa, conciliação, carteira, comissões e relatórios contábeis.');
    
    addStep(1, 'Dashboard de Caixa', 'Veja o saldo diário, entradas e saídas. Filtrar por período para análises específicas.');
    addStep(2, 'Conciliação', 'Acesse "Conciliação" para validar arquivos de remessa/retorno. O sistema identifica automaticamente divergências.');
    addStep(3, 'Carteira', 'Em "Gestão de Carteira", acompanhe os contratos vigentes, saldos e proximas vencimentos.');
    addStep(4, 'Comissões', 'Calcule comissões de operadores em "Comissões Avançadas". Configure as regras em "Regras de Comissão".');
    addStep(5, 'Relatórios', 'Gere DRE (Demonstrativo de Resultado), FP&A (projeções) e FIDC (dados de fundos).');

    // 7. CONVÊNIOS
    if (yPos > pageHeight - 50) addPage();
    addSubtitle('7. CONVÊNIOS E RELACIONAMENTO');
    addText('Gerencie o relacionamento com convênios (órgãos públicos), configurações e documentação obrigatória.');
    
    addStep(1, 'Gestão de Convênios', 'Em "Gestão", veja todos os convênios cadastrados com seus dados principais.');
    addStep(2, 'BI Convênios', 'Acompanhe métricas por convênio: propostas, volume, performance.');
    addStep(3, 'Documentos', 'Em "Documentos", manage certidões, alvarás e documentação obrigatória. O sistema alerta quando um documento está vencendo.');
    addStep(4, 'Assinaturas', 'Solicit assinatura de contratos em "Assinaturas". O sistema envia um link para o convênio assinar digitalmente.');
    addStep(5, 'Notificações', 'Configure e envie notificações para convênios sobre novos contratos, divergências ou informações importantes.');

    // 8. GOVERNANÇA
    if (yPos > pageHeight - 50) addPage();
    addSubtitle('8. GOVERNANÇA E APROVAÇÕES');
    addText('Sistema de dupla aprovação para operações críticas, controle de acesso e auditoria de tudo que acontece.');
    
    addStep(1, 'Dupla Aprovação', 'Em "Dupla Aprovação", revise e aprove/rejeite operações que exigem validação. Indique o motivo em comentários.');
    addStep(2, 'Controle de Acesso', 'Em "Administração", gerencie usuários: crie, edite e remova acessos conforme necessário.');
    addStep(3, 'Permissões', 'Configure quem pode acessar cada módulo da plataforma em "Permissões".');
    addStep(4, 'Auditoria', 'Em "Auditoria", veja o histórico completo de todas as ações: quem fez, quando e o quê foi alterado.');

    // 9. CONFIGURAÇÕES
    if (yPos > pageHeight - 50) addPage();
    addSubtitle('9. CONFIGURAÇÕES E INTEGRAÇÕES');
    addText('Configure a plataforma de acordo com as regras do seu negócio: decisão automática, workflows, parâmetros.');
    
    addStep(1, 'Motor de Decisão', 'Em "Motor de Decisão", configure as regras de aprovação automática. Defina scores, limites e exceções.');
    addStep(2, 'Orquestração', 'Configure o fluxo automático de processos em "Orquestração". Defina quem faz o quê e em que ordem.');
    addStep(3, 'Integrações', 'Em "Integrações", configure conexões com gestoras de margem, SCDs (Serasa), SMS (Twilio) e outras APIs.');
    addStep(4, 'Parâmetros do Sistema', 'Em "Parametrizações", ajuste limites globais, taxas padrão, prazos e outros valores configuráveis.');

    // 10. DICAS
    if (yPos > pageHeight - 50) addPage();
    addSubtitle('10. DICAS E BOAS PRÁTICAS');
    
    addText('Dicas para usar melhor a plataforma:', 10);
    addList([
      'Use filtros: Todos os listados têm filtros avançados. Utilize-os para encontrar rapidamente o que procura.',
      'Personalize: Customize seu menu e dashboard para ter acesso rápido às funcionalidades mais usadas.',
      'Atalhos: Muitos campos suportam busca rápida. Comece a digitar para filtrar opções.',
      'Notificações: Ative notificações para alertas críticos e nunca perder prazos importantes.',
      'Relatórios: Gere relatórios periodicamente para acompanhar performance e tomar decisões.',
      'Treinamento: Volte a este documento sempre que tiver dúvidas sobre como usar uma funcionalidade.',
      'Suporte: Se encontrar um erro, documente o passo que causou e entre em contato com o suporte.',
      'Feedback: Suas sugestões de melhoria são bem-vindas. Entre em contato com a equipe de produto.',
      'Segurança: Nunca compartilhe suas credenciais. Sempre faça logout ao sair da plataforma.',
      'Backup: Exporte dados importantes periodicamente para manter registros locais.'
    ]);

    // FOOTERS
    const totalPages = doc.internal.pages.length;
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(9);
      doc.setTextColor(128, 128, 128);
      doc.text(
        `Página ${i} de ${totalPages}`,
        pageWidth / 2,
        pageHeight - 10,
        { align: 'center' }
      );
    }

    doc.save('Kaskay-Guia-Treinamento.pdf');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="mb-6 inline-block p-4 bg-blue-50 rounded-full">
            <FileText className="w-12 h-12 text-blue-600" />
          </div>
          
          <h1 className="text-3xl font-bold text-slate-900 mb-3">
            Guia de Treinamento
          </h1>
          
          <p className="text-slate-600 text-lg mb-8">
            Tutorial completo com passo a passo para dominar todas as funcionalidades da plataforma KASKAY
          </p>

          <div className="bg-slate-50 rounded-xl p-6 mb-8 text-left">
            <h2 className="font-semibold text-slate-900 mb-4">O que você vai aprender:</h2>
            <ul className="space-y-2 text-sm text-slate-600">
              <li>✓ Como fazer login e personalizar sua experiência</li>
              <li>✓ Navegar pela Home Operacional</li>
              <li>✓ Criar e gerenciar propostas de crédito</li>
              <li>✓ Atender clientes por múltiplos canais</li>
              <li>✓ Acompanhar indicadores comerciais</li>
              <li>✓ Gerenciar operações financeiras e conciliação</li>
              <li>✓ Administrar relacionamento com convênios</li>
              <li>✓ Aplicar governança e dupla aprovação</li>
              <li>✓ Configurar automações e integrações</li>
              <li>✓ Boas práticas e dicas profissionais</li>
            </ul>
          </div>

          <Button
            onClick={generateTrainingPDF}
            size="lg"
            className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
          >
            <Download className="w-5 h-5" />
            Gerar Guia de Treinamento
          </Button>
        </div>
      </div>
    </div>
  );
}