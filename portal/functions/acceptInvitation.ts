import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import bcrypt from 'npm:bcryptjs@2.4.3';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { token, password } = body;

    if (!token || !password) {
      return Response.json({ error: 'Missing fields' }, { status: 400 });
    }

    // Buscar convite
    const invitations = await base44.asServiceRole.entities.UserInvitation.filter({ token });
    const invitation = invitations[0];

    if (!invitation) {
      return Response.json({ error: 'Invalid invitation token' }, { status: 404 });
    }

    if (invitation.status !== 'pending') {
      return Response.json({ error: 'Invitation already used or expired' }, { status: 400 });
    }

    // Verificar expiração
    if (new Date() > new Date(invitation.expires_at)) {
      await base44.asServiceRole.entities.UserInvitation.update(invitation.id, {
        status: 'expired',
      });
      return Response.json({ error: 'Invitation expired' }, { status: 400 });
    }

    // Verificar se usuário já existe
    const users = await base44.asServiceRole.entities.User.list();
    const existingUser = users.find(u => u.email === invitation.email);

    if (existingUser) {
      return Response.json({ error: 'User already exists' }, { status: 400 });
    }

    // Hash da senha
    const passwordHash = await bcrypt.hash(password, 10);

    // Criar usuário no ServerUser (para autenticação)
    await base44.asServiceRole.entities.ServerUser.create({
      email: invitation.email,
      full_name: invitation.full_name,
      password_hash: passwordHash,
      role: invitation.role,
      is_active: true,
    });

    // Marcar convite como aceito
    await base44.asServiceRole.entities.UserInvitation.update(invitation.id, {
      status: 'accepted',
      accepted_at: new Date().toISOString(),
    });

    // Log
    await base44.asServiceRole.entities.AuditLog.create({
      action: 'user_created',
      entity_type: 'User',
      entity_id: invitation.email,
      user_email: invitation.email,
      details: `User ${invitation.full_name} accepted invitation and created account`,
    });

    return Response.json({
      success: true,
      email: invitation.email,
      role: invitation.role,
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});