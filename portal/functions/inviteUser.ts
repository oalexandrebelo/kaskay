import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Apenas admins podem convidar outros admins
    const body = await req.json();
    const { email, full_name, role } = body;

    if (!email || !full_name || !role) {
      return Response.json({ error: 'Missing fields' }, { status: 400 });
    }

    if (role === 'admin' && user.role !== 'admin') {
      return Response.json({ error: 'Only admins can invite other admins' }, { status: 403 });
    }

    // Verificar se usuário já existe
    const users = await base44.asServiceRole.entities.User.list();
    const existingUser = users.find(u => u.email === email);

    if (existingUser) {
      return Response.json({ error: 'User already exists' }, { status: 400 });
    }

    // Verificar convite pendente
    const invitations = await base44.asServiceRole.entities.UserInvitation.filter({ email });
    const pendingInvite = invitations.find(i => i.status === 'pending');

    if (pendingInvite) {
      return Response.json({ error: 'Invitation already sent' }, { status: 400 });
    }

    // Gerar token único
    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 dias

    // Criar convite
    const invitation = await base44.asServiceRole.entities.UserInvitation.create({
      email,
      full_name,
      role,
      token,
      invited_by: user.email,
      status: 'pending',
      expires_at: expiresAt.toISOString(),
    });

    // URL do app
    const appUrl = new URL(req.url).origin;
    const inviteLink = `${appUrl}/#/AcceptInvitation?token=${token}`;

    // Enviar email
    await base44.integrations.Core.SendEmail({
      from_name: 'Kaskay',
      to: email,
      subject: 'Você foi convidado para o sistema Kaskay',
      body: `
Olá ${full_name},

Você foi convidado por ${user.full_name} para acessar o sistema Kaskay como ${role === 'admin' ? 'Administrador' : 'Usuário'}.

Clique no link abaixo para aceitar o convite e criar sua senha:
${inviteLink}

Este convite expira em 7 dias.

Atenciosamente,
Equipe Kaskay
      `.trim(),
    });

    return Response.json({
      success: true,
      invitation_id: invitation.id,
      email,
      expires_at: expiresAt.toISOString(),
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});