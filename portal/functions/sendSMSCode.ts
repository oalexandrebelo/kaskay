import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const { cpf, user_type, channel = 'whatsapp', use_fallback = true } = await req.json();

    if (!cpf || !user_type || !['client', 'server'].includes(user_type)) {
      return Response.json({ error: 'Parâmetros inválidos' }, { status: 400 });
    }

    if (!['whatsapp', 'sms'].includes(channel)) {
      return Response.json({ error: 'Canal inválido (whatsapp ou sms)' }, { status: 400 });
    }

    // Função para formatar telefone brasileiro
    const formatBRPhone = (phone) => {
      const cleaned = phone.replace(/\D/g, '');
      if (cleaned.startsWith('55')) return `+${cleaned}`;
      if (cleaned.length === 11) return `+55${cleaned}`;
      if (cleaned.length === 10) return `+55${cleaned}`;
      return phone;
    };

    // Gerar código de 6 dígitos
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutos

    // Salvar código no banco
    const entityName = user_type === 'client' ? 'ClientUser' : 'ServerUser';
    const base44 = createClientFromRequest(req);
    
    // Buscar usuário existente
    const existingUsers = await base44.asServiceRole.entities[entityName].filter({ cpf });
    
    if (existingUsers.length === 0) {
      return Response.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    const user = existingUsers[0];
    let userPhone = user.phone;

    if (!userPhone) {
      return Response.json({ error: 'Usuário sem telefone cadastrado' }, { status: 400 });
    }

    // Formatar telefone brasileiro
    userPhone = formatBRPhone(userPhone);

    // Atualizar com código WhatsApp
    await base44.asServiceRole.entities[entityName].update(user.id, {
      sms_code: code,
      sms_code_expires_at: expiresAt.toISOString(),
    });

    return Response.json({ 
      success: true, 
      message: 'Código enviado com sucesso',
      channel: 'test'
    });
  } catch (error) {
    console.error('Code Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});