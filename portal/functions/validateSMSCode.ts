import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const { cpf, code, user_type } = await req.json();

    if (!cpf || !code || !user_type || !['client', 'server'].includes(user_type)) {
      return Response.json({ error: 'Parâmetros inválidos' }, { status: 400 });
    }

    const base44 = createClientFromRequest(req);
    const entityName = user_type === 'client' ? 'ClientUser' : 'ServerUser';

    // Buscar usuário
    const users = await base44.asServiceRole.entities[entityName].filter({ cpf });
    
    if (users.length === 0) {
      return Response.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    const user = users[0];

    // Validar código
    if (user.sms_code !== code) {
      return Response.json({ error: 'Código inválido' }, { status: 401 });
    }

    // Validar expiração
    if (new Date(user.sms_code_expires_at) < new Date()) {
      return Response.json({ error: 'Código expirado' }, { status: 401 });
    }

    // Gerar token de sessão temporário (válido por 24h)
    const sessionToken = btoa(JSON.stringify({
      user_id: user.id,
      phone: user.phone,
      user_type: user_type,
      timestamp: Date.now(),
      expires: Date.now() + 24 * 60 * 60 * 1000
    }));

    return Response.json({
      success: true,
      session_token: sessionToken,
      user: {
        id: user.id,
        cpf: user.cpf,
        full_name: user.full_name,
        email: user.email,
        phone: user.phone,
        first_access_completed: user.first_access_completed
      }
    });
  } catch (error) {
    console.error('Validation Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});