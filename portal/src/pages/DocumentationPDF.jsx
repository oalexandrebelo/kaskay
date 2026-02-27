import React from 'react';
import { Button } from '@/components/ui/button';
import { FileText, Download } from 'lucide-react';

export default function DocumentationPDF() {

  const generatePDF = async () => {
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

    // Função para adicionar nova página
    const addPage = () => {
      doc.addPage();
      yPos = margin;
    };

    // Função para adicionar título
    const addTitle = (text, size = 20) => {
      doc.setFontSize(size);
      doc.setFont(undefined, 'bold');
      doc.text(text, margin, yPos);
      yPos += size / 2 + 5;
    };

    // Função para adicionar subtítulo
    const addSubtitle = (text) => {
      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(33, 150, 243);
      doc.text(text, margin, yPos);
      yPos += 8;
    };

    // Função para adicionar texto
    const addText = (text, size = 11) => {
      doc.setFontSize(size);
      doc.setFont(undefined, 'normal');
      doc.setTextColor(0, 0, 0);
      const lines = doc.splitTextToSize(text, contentWidth);
      doc.text(lines, margin, yPos);
      yPos += lines.length * 5 + 3;
    };

    // Função para adicionar lista
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

    // CAPA
    doc.setFillColor(33, 150, 243);
    doc.rect(0, 0, pageWidth, pageHeight, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(32);
    doc.setFont(undefined, 'bold');
    doc.text('KASKAY', pageWidth / 2, pageHeight / 3, { align: 'center' });
    doc.setFontSize(16);
    doc.text('Plataforma de Crédito Consignado', pageWidth / 2, pageHeight / 3 + 20, { align: 'center' });
    doc.setFontSize(12);
    doc.text('Documentação Completa de Funcionalidades', pageWidth / 2, pageHeight / 2 + 20, { align: 'center' });
    doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, pageWidth / 2, pageHeight - 30, { align: 'center' });

    addPage();

    // ÍNDICE
    addTitle('ÍNDICE', 18);
    addText('1. Visão Geral do Sistema');
    addText('2. Módulo de Operações');
    addText('3. Módulo Comercial');
    addText('4. Módulo de Atendimento');
    addText('5. Módulo Financeiro');
    addText('6. Módulo Jurídico');
    addText('7. Módulo de Governança');
    addText('8. Módulo de Tecnologia');
    addText('9. Automações Programadas');
    addText('10. Integrações e APIs');
    yPos += 10;

    // 1. VISÃO GERAL
    addSubtitle('1. VISÃO GERAL DO SISTEMA');
    addText('A plataforma KASKAY é um sistema integral de gestão de crédito consignado, desenvolvido para otimizar operações de concessão, acompanhamento e cobrança de empréstimos consignados em folha de pagamento.');
    addText('Principais características:');
    addList([
      'Plataforma multi-tenant com suporte a múltiplos convênios',
      'Dashboard operacional em tempo real',
      'Automação de processos financeiros e administrativos',
      'Integração com sistemas de folha de pagamento',
      'Motor de decisão creditícia automatizada',
      'Gestão de averbação digital'
    ]);

    // 2. MÓDULO DE OPERAÇÕES
    if (yPos > pageHeight - 50) addPage();
    addSubtitle('2. MÓDULO DE OPERAÇÕES');
    addText('Gerenciamento centralizado de todas as propostas e operações de crédito.');
    
    addText('Principais Funcionalidades:', 10);
    addText('bold');
    addList([
      'Dashboard Operacional: Visão em tempo real de propostas, alertas críticos e exceções',
      'Gestão de Propostas: Criação, análise, aprovação e acompanhamento de propostas',
      'Clientes: Cadastro e gestão de dados de clientes',
      'Monitoramento de Exceções: Identificação e tratamento de propostas fora dos padrões',
      'Averbação: Controle de averiguação junto às gestoras de margem',
      'Gestão Multi-CNPJ: Roteamento de propostas entre múltiplos operadores'
    ]);

    // 3. MÓDULO COMERCIAL
    if (yPos > pageHeight - 50) addPage();
    addSubtitle('3. MÓDULO COMERCIAL');
    addText('Dashboard comercial com indicadores de negócio e performance.');
    
    addText('Funcionalidades Principais:', 10);
    addList([
      'KPIs Comerciais: Propostas criadas, aprovadas, rejeitadas, volume por convênio',
      'Análise de Rejections: Motivos de rejeição e tendências',
      'Pipeline de Operações: Status das propostas em cada etapa',
      'Customização de Dashboard: Widgets configuráveis por usuário',
      'Exportação de Relatórios: Dados em Excel e PDF'
    ]);

    // 4. MÓDULO DE ATENDIMENTO
    if (yPos > pageHeight - 50) addPage();
    addSubtitle('4. MÓDULO DE ATENDIMENTO');
    addText('Plataforma omnichannel de atendimento ao cliente.');
    
    addText('Canais de Atendimento:', 10);
    addList([
      'Central de Atendimento: Interface desktop para operadores',
      'WhatsApp: Contratação rápida via aplicativo',
      'Web: Simulador de crédito e solicitação online',
      'Simulador de Crédito: Cálculo de parcelas e taxas',
      'Agente de IA: Assistente inteligente por WhatsApp'
    ]);

    // 5. MÓDULO FINANCEIRO
    if (yPos > pageHeight - 50) addPage();
    addSubtitle('5. MÓDULO FINANCEIRO');
    addText('Gestão completa de fluxos financeiros e contábeis.');
    
    addText('Funcionalidades Principais:', 10);
    addList([
      'Dashboard de Caixa: Fluxo de entrada/saída em tempo real',
      'Conciliação Financeira: Automática de folhas de repasse',
      'Gestão de Carteira: Acompanhamento de portfólio',
      'Contas a Pagar/Receber: Controle de obrigações financeiras',
      'Folha de Pagamento: Integração com sistema de folha',
      'Comissões: Cálculo automático e gestão de comissões',
      'DRE: Demonstrativo de resultado em tempo real',
      'FIDC: Gestão de fundos de investimento em direitos creditórios',
      'FP&A: Análise financeira e previsões'
    ]);

    // 6. MÓDULO JURÍDICO
    if (yPos > pageHeight - 50) addPage();
    addSubtitle('6. MÓDULO JURÍDICO');
    addText('Gestão de conformidade, processos legais e documentação.');
    
    addText('Funcionalidades Principais:', 10);
    addList([
      'Gestão de Processos: Acompanhamento de ações legais',
      'Notificações: Alertas de prazos e obrigações legais',
      'Documentos: Armazenamento centralizado de documentação',
      'Conformidade: Verificação de LGPD e regulamentações',
      'Auditoria: Trilha de todas as operações do sistema',
      'Assinaturas Digitais: Gerenciamento de assinatura de convênios'
    ]);

    // 7. MÓDULO DE GOVERNANÇA
    if (yPos > pageHeight - 50) addPage();
    addSubtitle('7. MÓDULO DE GOVERNANÇA');
    addText('Controle de aprovações, permissões e segurança.');
    
    addText('Funcionalidades Principais:', 10);
    addList([
      'Dupla Aprovação: Workflow de aprovação para operações críticas',
      'Gestão de Permissões: Controle granular de acessos',
      'Auditoria de Segurança: Monitoramento de acessos e mudanças',
      'Dispositivos: Gerenciamento de dispositivos de confiança'
    ]);

    // 8. MÓDULO DE TECNOLOGIA
    if (yPos > pageHeight - 50) addPage();
    addSubtitle('8. MÓDULO DE TECNOLOGIA');
    addText('Configuração de integrações, automações e motor de decisão.');
    
    addText('Funcionalidades Principais:', 10);
    addList([
      'Motor de Decisão: Regras de aprovação automática com IA',
      'Orquestração: Fluxo automatizado de processos',
      'Verificações: Validação de documentos e CPF',
      'Webhooks: Integrações com sistemas externos',
      'Workflows: Designer visual de processos',
      'Parametrizações: Configuração de limites e regras de negócio'
    ]);

    // 9. AUTOMAÇÕES
    if (yPos > pageHeight - 50) addPage();
    addSubtitle('9. AUTOMAÇÕES PROGRAMADAS');
    addText('Processos executados automaticamente em horários programados.');
    
    const automacoes = [
      { nome: 'Conciliação Automática Diária', freq: 'Diariamente às 9h', desc: 'Concilia arquivos de remessa/retorno com desembolsos' },
      { nome: 'Verificação de Alertas (Financeiro)', freq: 'A cada 6 horas', desc: 'Verifica divergências e cria alertas automáticos' },
      { nome: 'Executar Régua de Cobrança', freq: '2x ao dia', desc: 'Envia SMS/email conforme fase de atraso' },
      { nome: 'Detectar Oportunidades de Refinanciamento', freq: 'Semanalmente (seg)', desc: 'Identifica clientes elegíveis para refin' },
      { nome: 'Análise de Propostas por Tipo (Mensal)', freq: '1º dia do mês', desc: 'Gera métricas de análise manual vs automática' },
      { nome: 'Backup Automático Diário', freq: 'Diariamente às 6h', desc: 'Snapshots de páginas críticas' },
      { nome: 'Daily Report at 8AM', freq: 'Diariamente às 8h', desc: 'Relatório operacional com KPIs do dia' },
      { nome: 'Weekly Analytics Report', freq: 'Semanalmente (seg)', desc: 'Relatório analítico semanal' }
    ];
    
    automacoes.forEach((auto) => {
      if (yPos > pageHeight - 25) addPage();
      doc.setFont(undefined, 'bold');
      addText(`${auto.nome}`, 10);
      doc.setFont(undefined, 'normal');
      addText(`Frequência: ${auto.freq}`, 9);
      addText(`${auto.desc}`, 9);
      yPos += 2;
    });

    // 10. INTEGRAÇÕES
    if (yPos > pageHeight - 50) addPage();
    addSubtitle('10. INTEGRAÇÕES E APIS');
    addText('Conexões com sistemas externos e APIs de terceiros.');
    
    addText('Integrações Principais:', 10);
    addList([
      'Gestoras de Margem: Consulta de margem consignada',
      'SCDs (Serasa): Emissão de CCB digital',
      'TWILIO/SMS: Envio de mensagens SMS',
      'Telegram: Alertas internos para time',
      'Webhook: Recebimento de eventos externos',
      'APIs REST: Integração com sistemas de clientes'
    ]);

    // FOOTERS EM TODAS AS PÁGINAS
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

    // Gerar PDF
    doc.save('Kaskay-Documentacao-Completa.pdf');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="mb-6 inline-block p-4 bg-blue-50 rounded-full">
            <FileText className="w-12 h-12 text-blue-600" />
          </div>
          
          <h1 className="text-3xl font-bold text-slate-900 mb-3">
            Documentação Completa
          </h1>
          
          <p className="text-slate-600 text-lg mb-8">
            PDF com todas as funcionalidades, módulos, automações e integrações da plataforma KASKAY
          </p>

          <div className="bg-slate-50 rounded-xl p-6 mb-8 text-left">
            <h2 className="font-semibold text-slate-900 mb-4">Conteúdo do Documento:</h2>
            <ul className="space-y-2 text-sm text-slate-600">
              <li>✓ Visão geral do sistema</li>
              <li>✓ 8 módulos principais (Operações, Comercial, Atendimento, Financeiro, etc)</li>
              <li>✓ Descrição detalhada de cada funcionalidade</li>
              <li>✓ 8 automações programadas com frequências</li>
              <li>✓ Integrações e APIs disponíveis</li>
            </ul>
          </div>

          <Button
            onClick={generatePDF}
            size="lg"
            className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
          >
            <Download className="w-5 h-5" />
            Gerar PDF
          </Button>
        </div>
      </div>
    </div>
  );
}