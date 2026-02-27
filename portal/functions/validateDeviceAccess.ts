import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { mac_address, device_name, ip_address, browser_info } = await req.json();

    if (!mac_address) {
      return Response.json({ error: 'MAC address required' }, { status: 400 });
    }

    // Buscar dispositivos confiáveis do usuário
    const trustedDevices = await base44.entities.DeviceTrust.filter({
      user_email: user.email,
      is_trusted: true
    });

    // Verificar se MAC é confiável
    const isTrusted = trustedDevices.some(device => device.mac_address === mac_address);

    if (isTrusted) {
      // Atualizar last_access
      const device = trustedDevices.find(d => d.mac_address === mac_address);
      await base44.entities.DeviceTrust.update(device.id, {
        last_access: new Date().toISOString()
      });

      return Response.json({
        allowed: true,
        message: 'Device is trusted'
      });
    }

    // Device não está no trust list
    // Criar SecurityBlock
    const blockRecord = await base44.entities.SecurityBlock.create({
      user_email: user.email,
      user_name: user.full_name,
      mac_address: mac_address,
      expected_mac: trustedDevices.length > 0 ? trustedDevices[0].mac_address : 'unknown',
      ip_address: ip_address,
      block_reason: trustedDevices.length > 0 ? 'mac_mismatch' : 'new_device',
      status: 'blocked',
      device_name: device_name,
      browser_info: browser_info,
      blocked_at: new Date().toISOString()
    });

    // Se tem confiáveis, é suspeito (MAC diferente)
    if (trustedDevices.length > 0) {
      return Response.json({
        allowed: false,
        error: 'Device MAC mismatch - access blocked',
        block_id: blockRecord.id,
        message: 'Seu acesso foi bloqueado por segurança. Contacte administrador.'
      }, { status: 403 });
    }

    // Se não tem nenhum confiável, é novo device - permitir mas registrar
    // Admin vai revisar depois
    return Response.json({
      allowed: true,
      warning: 'New device registered',
      block_id: blockRecord.id,
      message: 'Novo dispositivo registrado. Será verificado por segurança.'
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});