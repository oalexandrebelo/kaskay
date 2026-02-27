import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import bcrypt from 'npm:bcryptjs@2.4.3';

Deno.serve(async (req) => {
  try {
    const { user_type, identifier, password } = await req.json();

    if (!user_type || !identifier || !password || !['client', 'server'].includes(user_type)) {
      return Response.json({ error: 'Parâmetros inválidos' }, { status: 400 });
    }

    const base44 = createClientFromRequest(req);
    const entityName = user_type === 'client' ? 'ClientUser' : 'ServerUser';

    // Buscar usuário por CPF
    const users = await base44.asServiceRole.entities[entityName].filter({ cpf: identifier });
    
    if (users.length === 0) {
      return Response.json({ error: 'Credenciais inválidas' }, { status: 401 });
    }

    const user = users[0];

    // Verificar se completou primeiro acesso
    if (!user.first_access_completed || !user.password_hash) {
      return Response.json({ error: 'Primeiro acesso não completado' }, { status: 403 });
    }

    // Verificar senha com bcrypt
    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    
    if (!passwordMatch) {
      return Response.json({ error: 'Credenciais inválidas' }, { status: 401 });
    }

    // Verificar se usuário está ativo
    if (!user.is_active) {
      return Response.json({ error: 'Usuário inativo' }, { status: 403 });
    }

    // Atualizar último login
    await base44.asServiceRole.entities[entityName].update(user.id, {
      last_login: new Date().toISOString()
    });

    // Gerar token de sessão
    const sessionToken = btoa(JSON.stringify({
      user_id: user.id,
      cpf: user.cpf,
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
        phone: user.phone
      }
    });
  } catch (error) {
    console.error('Login Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});