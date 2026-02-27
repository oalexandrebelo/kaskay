import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const admin = await base44.auth.me();

    // Apenas admin e role Security
    if (admin?.role !== 'admin') {
      return Response.json(
        { error: 'Forbidden: Only admins can approve devices' },
        { status: 403 }
      );
    }

    const { user_email, mac_address, device_name, action } = await req.json();

    if (action === 'approve_block') {
      // Desbloquear dispositivo - criar DeviceTrust
      const existing = await base44.entities.DeviceTrust.filter({
        user_email: user_email,
        mac_address: mac_address
      });

      if (existing.length === 0) {
        await base44.entities.DeviceTrust.create({
          user_email: user_email,
          mac_address: mac_address,
          device_name: device_name,
          is_trusted: true,
          trusted_at: new Date().toISOString(),
          trusted_by: admin.email
        });
      } else {
        await base44.entities.DeviceTrust.update(existing[0].id, {
          is_trusted: true,
          trusted_at: new Date().toISOString(),
          trusted_by: admin.email
        });
      }

      // Atualizar SecurityBlock
      const blocks = await base44.entities.SecurityBlock.filter({
        user_email: user_email,
        mac_address: mac_address,
        status: 'blocked'
      });

      for (const block of blocks) {
        await base44.entities.SecurityBlock.update(block.id, {
          status: 'approved',
          unblocked_at: new Date().toISOString(),
          unblocked_by: admin.email
        });
      }

      return Response.json({
        success: true,
        message: 'Device approved and trusted'
      });
    }

    if (action === 'reject_block') {
      // Rejeitar/manter bloqueado
      const blocks = await base44.entities.SecurityBlock.filter({
        user_email: user_email,
        mac_address: mac_address,
        status: 'blocked'
      });

      for (const block of blocks) {
        await base44.entities.SecurityBlock.update(block.id, {
          status: 'unblocked',
          unblocked_at: new Date().toISOString(),
          unblocked_by: admin.email
        });
      }

      return Response.json({
        success: true,
        message: 'Device blocked'
      });
    }

    if (action === 'remove_trusted') {
      // Remover dispositivo da lista de confiáveis
      const devices = await base44.entities.DeviceTrust.filter({
        user_email: user_email,
        mac_address: mac_address
      });

      for (const device of devices) {
        await base44.entities.DeviceTrust.update(device.id, {
          is_trusted: false
        });
      }

      return Response.json({
        success: true,
        message: 'Device removed from trust list'
      });
    }

    return Response.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});