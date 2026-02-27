import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import bcrypt from 'npm:bcryptjs@2.4.3';

Deno.serve(async (req) => {
  try {
    const { user_id, user_type, password } = await req.json();

    if (!user_id || !user_type || !password || !['client', 'server'].includes(user_type)) {
      return Response.json({ error: 'Parâmetros inválidos' }, { status: 400 });
    }

    if (password.length < 6) {
      return Response.json({ error: 'Senha deve ter no mínimo 6 caracteres' }, { status: 400 });
    }

    const base44 = createClientFromRequest(req);
    const entityName = user_type === 'client' ? 'ClientUser' : 'ServerUser';

    const passwordHash = await bcrypt.hash(password, 12);

    // Atualizar usuário
    await base44.asServiceRole.entities[entityName].update(user_id, {
      password_hash: passwordHash,
      first_access_completed: true,
      sms_code: null,
      sms_code_expires_at: null
    });

    return Response.json({
      success: true,
      message: 'Primeiro acesso completado com sucesso'
    });
  } catch (error) {
    console.error('First Access Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});