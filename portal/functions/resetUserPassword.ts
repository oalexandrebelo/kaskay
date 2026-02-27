import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import bcrypt from 'npm:bcryptjs@2.4.3';

const DEFAULT_PASSWORD = 'mudar@123';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { userId } = await req.json();

    if (!userId) {
      return Response.json({ error: 'userId is required' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, 10);

    await base44.asServiceRole.entities.User.update(userId, {
      password_hash: hashedPassword,
    });

    return Response.json({
      success: true,
      message: `Senha resetada para: ${DEFAULT_PASSWORD}`,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});