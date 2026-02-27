import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const { cpf, user_type, channel = 'whatsapp' } = await req.json();

    if (!cpf || !user_type || !['client', 'server'].includes(user_type)) {
      return Response.json({ error: 'Parâmetros inválidos' }, { status: 400 });
    }

    if (!['whatsapp', 'email'].includes(channel)) {
      return Response.json({ error: 'Canal inválido (whatsapp ou email)' }, { status: 400 });
    }

    // Gerar código de 6 dígitos
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutos

    const base44 = createClientFromRequest(req);
    const entityName = user_type === 'client' ? 'ClientUser' : 'ServerUser';
    
    // Buscar usuário
    const existingUsers = await base44.asServiceRole.entities[entityName].filter({ cpf });
    
    if (existingUsers.length === 0) {
      return Response.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    const user = existingUsers[0];

    // Atualizar com código de recuperação
    await base44.asServiceRole.entities[entityName].update(user.id, {
      sms_code: code,
      sms_code_expires_at: expiresAt.toISOString(),
    });

    // Enviar via canal escolhido
    if (channel === 'whatsapp') {
      const userPhone = user.phone;
      if (!userPhone) {
        return Response.json({ error: 'Usuário sem telefone cadastrado' }, { status: 400 });
      }

      const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
      const authToken = Deno.env.get('TWILIO_AUTH_TOKEN');
      const twilioPhone = Deno.env.get('TWILIO_PHONE_NUMBER');

      if (accountSid && authToken && twilioPhone) {
        const auth = btoa(`${accountSid}:${authToken}`);
        const message = `🔐 Kaskay - Recuperação de Senha\n\nSeu código é: ${code}\n\nValidade: 15 minutos\n\nNão compartilhe este código!`;
        
        try {
          const twilioRes = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
            method: 'POST',
            headers: {
              'Authorization': `Basic ${auth}`,
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
              From: `whatsapp:${twilioPhone}`,
              To: `whatsapp:${userPhone}`,
              Body: message,
            }),
          });

          if (!twilioRes.ok) {
            const error = await twilioRes.text();
            console.error('Twilio Error:', error);
            return Response.json({ error: 'Erro ao enviar WhatsApp' }, { status: 500 });
          }
        } catch (twilioError) {
          console.error('Twilio Request Error:', twilioError);
          return Response.json({ error: 'Erro na integração Twilio' }, { status: 500 });
        }
      }
    } else if (channel === 'email') {
      const userEmail = user.email;
      if (!userEmail) {
        return Response.json({ error: 'Usuário sem e-mail cadastrado' }, { status: 400 });
      }

      // Enviar e-mail via integração Base44
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: userEmail,
        subject: '🔐 Recuperação de Senha - Kaskay',
        body: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #16a34a, #059669); padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 28px;">Kaskay</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Recuperação de Senha</p>
            </div>
            <div style="background: white; padding: 40px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
              <p style="font-size: 16px; color: #374151; margin-bottom: 20px;">Olá, <strong>${user.full_name}</strong>!</p>
              <p style="font-size: 16px; color: #374151; margin-bottom: 30px;">Recebemos uma solicitação de recuperação de senha para sua conta.</p>
              
              <div style="background: #f3f4f6; border-left: 4px solid #16a34a; padding: 20px; margin: 30px 0; border-radius: 8px;">
                <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px;">Seu código de verificação:</p>
                <p style="margin: 0; font-size: 32px; font-weight: bold; color: #16a34a; letter-spacing: 8px; font-family: monospace;">${code}</p>
              </div>

              <p style="font-size: 14px; color: #6b7280; margin-bottom: 20px;">
                ⏱️ Este código expira em <strong>15 minutos</strong>
              </p>

              <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 8px;">
                <p style="margin: 0; font-size: 14px; color: #92400e;">
                  <strong>⚠️ Atenção:</strong> Nunca compartilhe este código com ninguém. A Kaskay nunca solicita códigos por telefone ou e-mail.
                </p>
              </div>

              <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">
                Se você não solicitou esta recuperação, ignore este e-mail.
              </p>
            </div>
            <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
              <p>© 2026 Kaskay. Todos os direitos reservados.</p>
            </div>
          </div>
        `
      });
    }

    return Response.json({ 
      success: true, 
      message: `Código enviado para o ${channel === 'whatsapp' ? 'WhatsApp' : 'e-mail'} cadastrado`,
      channel_used: channel
    });
  } catch (error) {
    console.error('Password Reset Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});