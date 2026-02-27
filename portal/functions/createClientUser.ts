import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import bcrypt from 'npm:bcryptjs@2.4.3';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { cpf, phone, password } = await req.json();

    if (!cpf || !phone || !password) {
      return Response.json({ error: 'CPF, telefone e senha são obrigatórios' }, { status: 400 });
    }

    // Verificar se usuário já existe
    const existing = await base44.entities.ClientUser.filter({ cpf });
    if (existing.length > 0) {
      return Response.json({ error: 'Usuário com este CPF já existe' }, { status: 409 });
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(password, 10);

    // Criar usuário inativo (pendente de aprovação)
    const newUser = await base44.entities.ClientUser.create({
      cpf,
      phone,
      full_name: cpf,
      password_hash: hashedPassword,
      is_active: false,
      first_access_completed: false,
    });

    return Response.json({ 
      success: true, 
      message: 'Cadastro criado! Aguarde aprovação do administrador.',
      user_id: newUser.id,
      cpf: newUser.cpf,
      pending_approval: true
    });
  } catch (error) {
    console.error('Erro ao criar usuário:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});