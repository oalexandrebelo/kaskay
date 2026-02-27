import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const TELEGRAM_BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN');
const TELEGRAM_API_URL = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;

async function sendTelegramMessage(chatId, text, replyMarkup = null) {
  const payload = {
    chat_id: chatId,
    text: text,
    parse_mode: 'Markdown'
  };

  if (replyMarkup) {
    payload.reply_markup = replyMarkup;
  }

  const response = await fetch(`${TELEGRAM_API_URL}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  return response.json();
}

async function handleTelegramMessage(message, base44) {
  const chatId = message.chat.id;
  const userId = message.from.id;
  const text = message.text || '';

  // Commands
  if (text === '/start') {
    await sendTelegramMessage(chatId, 
      'Olá! Sou o BD Advisor. Posso ajudá-lo com:\n\n' +
      '📊 /propostas - Ver propostas\n' +
      '👥 /clientes - Ver clientes\n' +
      '🎯 /leads - Ver leads\n' +
      '📝 /nova_proposta - Criar proposta\n' +
      '❓ /ajuda - Mais informações\n\n' +
      'Ou me envie uma mensagem e vou ajudar!'
    );
    return;
  }

  if (text === '/propostas') {
    const proposals = await base44.entities.Proposal.list();
    if (proposals.length === 0) {
      await sendTelegramMessage(chatId, '📭 Nenhuma proposta cadastrada ainda.');
      return;
    }
    let msg = '📋 *Propostas*:\n\n';
    proposals.slice(0, 5).forEach(p => {
      msg += `• ${p.proposal_number} - ${p.client_name} (${p.status})\n`;
    });
    if (proposals.length > 5) msg += `\n... e mais ${proposals.length - 5}`;
    await sendTelegramMessage(chatId, msg);
    return;
  }

  if (text === '/clientes') {
    const clients = await base44.entities.Client.list();
    if (clients.length === 0) {
      await sendTelegramMessage(chatId, '📭 Nenhum cliente cadastrado ainda.');
      return;
    }
    let msg = '👥 *Clientes*:\n\n';
    clients.slice(0, 5).forEach(c => {
      msg += `• ${c.full_name} (${c.employer})\n`;
    });
    if (clients.length > 5) msg += `\n... e mais ${clients.length - 5}`;
    await sendTelegramMessage(chatId, msg);
    return;
  }

  if (text === '/ajuda') {
    await sendTelegramMessage(chatId,
      '*Comandos disponíveis:*\n\n' +
      '/propostas - Listar propostas\n' +
      '/clientes - Listar clientes\n' +
      '/leads - Listar leads\n' +
      '/nova_proposta - Criar nova proposta\n' +
      '/start - Menu principal\n\n' +
      'Ou descreva o que precisa fazer!'
    );
    return;
  }

  // For general messages, use the agent
  try {
    const conversation = await base44.agents.createConversation({
      agent_name: 'bd_advisor',
      metadata: {
        telegram_user_id: userId,
        telegram_chat_id: chatId,
        name: message.from.first_name
      }
    });

    await base44.agents.addMessage(conversation, {
      role: 'user',
      content: text
    });

    // Subscribe to updates
    await new Promise((resolve) => {
      const unsubscribe = base44.agents.subscribeToConversation(conversation.id, async (data) => {
        if (data.messages && data.messages.length > 0) {
          const lastMessage = data.messages[data.messages.length - 1];
          
          // When agent responds
          if (lastMessage.role === 'assistant' && lastMessage.content) {
            await sendTelegramMessage(chatId, lastMessage.content);
            unsubscribe();
            resolve();
          }
        }
      });

      // Timeout after 30s
      setTimeout(() => {
        unsubscribe();
        resolve();
      }, 30000);
    });
  } catch (error) {
    await sendTelegramMessage(chatId, `❌ Erro: ${error.message}`);
  }
}

Deno.serve(async (req) => {
  try {
    if (req.method === 'POST') {
      const body = await req.json();
      
      if (body.message) {
        const base44 = createClientFromRequest(req);
        
        // Check if user is authenticated (optional for Telegram webhook)
        try {
          const user = await base44.auth.me();
        } catch {
          // Allow unauthenticated Telegram messages
        }

        await handleTelegramMessage(body.message, base44);
      }

      return Response.json({ ok: true });
    }

    if (req.method === 'GET') {
      return Response.json({
        status: 'Telegram BD Advisor webhook is running',
        webhook: `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook`
      });
    }

    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  } catch (error) {
    console.error('Telegram webhook error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});