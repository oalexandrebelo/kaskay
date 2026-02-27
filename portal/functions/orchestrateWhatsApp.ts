import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();

    const { conversation_id, client_message } = body;

    if (!conversation_id || !client_message) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get conversation
    const conversation = await base44.agents.getConversation(conversation_id);
    if (!conversation) {
      return Response.json({ error: 'Conversation not found' }, { status: 404 });
    }

    // Route based on stage
    const stage = identifyStage(conversation);
    let botResponse = '';
    let action = null;

    switch (stage) {
      case 'qualification':
        // Extract CPF, salary, employer
        botResponse = `Obrigado! Entendi que você trabalha em ${extractEmployer(client_message)}. Qual seu salário bruto aproximado?`;
        action = 'await_salary';
        break;

      case 'eligibility_check':
        // Check eligibility in background
        const eligibility = await base44.functions.invoke('checkEligibility', {
          client_id: extractCPF(client_message),
          convenio_id: 'default',
          requested_amount: 1000,
        });

        if (eligibility.data.eligible) {
          botResponse = `Ótimo! Você está elegível para um adiantamento. Qual valor você gostaria de solicitar?`;
          action = 'await_amount';
        } else {
          botResponse = `Desculpe, você não atende aos critérios no momento. Motivo: ${eligibility.data.rejection_reason || 'não qualificado'}`;
          action = 'end_conversation';
        }
        break;

      case 'pricing_calculation':
        // Calculate pricing
        const pricing = await calculateQuote(body.requested_amount);
        botResponse = `Sua simulação: Valor: R$ ${pricing.amount} | Taxa: ${pricing.rate}% a.m. | Parcela: R$ ${pricing.installment} | Aprovado? (sim/não)`;
        action = 'await_approval';
        break;

      case 'proposal_creation':
        // Create proposal
        const proposal = await base44.asServiceRole.entities.Proposal.create({
          client_name: extractName(conversation),
          client_cpf: extractCPF(conversation),
          requested_amount: body.requested_amount,
          product_type: 'adiantamento_salarial',
          channel: 'whatsapp',
          status: 'draft',
        });

        botResponse = `Proposta criada! Número: ${proposal.proposal_number}. Enviaremos documentos para assinatura via WhatsApp.`;
        action = 'send_documents';
        break;

      default:
        botResponse = `Como posso ajudá-lo? (1) Simular adiantamento (2) Status proposta (3) Falar com atendente`;
        action = 'main_menu';
    }

    // Add bot response to conversation
    await base44.agents.addMessage(conversation, {
      role: 'assistant',
      content: botResponse,
    });

    // Log orchestration
    try {
      await base44.asServiceRole.entities.OrchestrationLog.create({
        agent_name: 'whatsapp_orchestrator',
        conversation_id,
        stage,
        action,
        client_message,
        bot_response: botResponse,
        timestamp: new Date().toISOString(),
      });
    } catch (e) {
      // Silently fail logging
    }

    return Response.json({
      conversation_id,
      stage,
      action,
      bot_response: botResponse,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function identifyStage(conversation) {
  // Analyze conversation to identify current stage
  const messageCount = conversation.messages?.length || 0;
  
  if (messageCount < 2) return 'qualification';
  if (messageCount < 4) return 'eligibility_check';
  if (messageCount < 6) return 'pricing_calculation';
  if (messageCount < 8) return 'proposal_creation';
  return 'follow_up';
}

function extractCPF(text) {
  const cpfMatch = text.match(/\d{3}\.?\d{3}\.?\d{3}-?\d{2}/);
  return cpfMatch ? cpfMatch[0].replace(/\D/g, '') : null;
}

function extractEmployer(text) {
  // Simple employer extraction
  const employers = ['INSS', 'IBGE', 'CGU', 'Caixa', 'Banco do Brasil'];
  for (const emp of employers) {
    if (text.toUpperCase().includes(emp.toUpperCase())) return emp;
  }
  return 'Órgão Público';
}

function extractName(conversation) {
  // Extract from first message
  return conversation.messages?.[0]?.content?.split('\n')?.[0] || 'Cliente';
}

async function calculateQuote(amount) {
  // Simplified pricing calculation
  return {
    amount,
    rate: 2.5,
    installment: amount * 1.025,
  };
}