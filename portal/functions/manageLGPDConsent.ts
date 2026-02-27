import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();

    const { client_cpf, action, consent_type, email } = body;

    if (!client_cpf || !action) {
      return Response.json({ error: 'Missing fields' }, { status: 400 });
    }

    // Check existing consents
    const existing = await base44.asServiceRole.entities.LGPDConsent.filter({
      client_cpf,
      consent_type,
    });

    const now = new Date().toISOString();

    if (action === 'accept') {
      if (existing.length > 0 && existing[0].status === 'accepted') {
        return Response.json({ status: 'already_accepted', consent_id: existing[0].id });
      }

      const consent = existing.length > 0 
        ? await base44.asServiceRole.entities.LGPDConsent.update(existing[0].id, {
            status: 'accepted',
            accepted_at: now,
            ip_address: extractIP(req),
            user_agent: req.headers.get('user-agent'),
          })
        : await base44.asServiceRole.entities.LGPDConsent.create({
            client_cpf,
            client_email: email,
            consent_type,
            status: 'accepted',
            accepted_at: now,
            ip_address: extractIP(req),
            user_agent: req.headers.get('user-agent'),
            legal_basis: 'consent',
            consent_version: '1.0',
          });

      // Log LGPD event
      await logLGPDEvent(base44, client_cpf, 'consent_accepted', consent_type);

      return Response.json({
        status: 'accepted',
        consent_id: consent.id,
      });

    } else if (action === 'reject') {
      if (existing.length === 0) {
        const consent = await base44.asServiceRole.entities.LGPDConsent.create({
          client_cpf,
          client_email: email,
          consent_type,
          status: 'rejected',
          legal_basis: 'consent',
          consent_version: '1.0',
        });
        return Response.json({ status: 'rejected', consent_id: consent.id });
      }

      await base44.asServiceRole.entities.LGPDConsent.update(existing[0].id, {
        status: 'rejected',
      });

      await logLGPDEvent(base44, client_cpf, 'consent_rejected', consent_type);

      return Response.json({ status: 'rejected', consent_id: existing[0].id });

    } else if (action === 'revoke') {
      if (existing.length === 0) {
        return Response.json({ error: 'Consent not found' }, { status: 404 });
      }

      await base44.asServiceRole.entities.LGPDConsent.update(existing[0].id, {
        status: 'revoked',
        revoked_at: now,
      });

      await logLGPDEvent(base44, client_cpf, 'consent_revoked', consent_type);

      return Response.json({ status: 'revoked', consent_id: existing[0].id });
    }

    return Response.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});

async function logLGPDEvent(base44, cpf, event_type, consent_type) {
  try {
    await base44.asServiceRole.entities.AuditLog.create({
      entity_type: 'LGPDConsent',
      entity_id: cpf,
      action: event_type,
      details: { consent_type },
      timestamp: new Date().toISOString(),
    });
  } catch (e) {
    // Silently fail
  }
}

function extractIP(req) {
  return req.headers.get('x-forwarded-for')?.split(',')[0] || 
         req.headers.get('cf-connecting-ip') ||
         req.headers.get('x-real-ip') ||
         'unknown';
}