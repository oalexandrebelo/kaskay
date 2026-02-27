import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();

    const { proposal_id, document_url, signers } = body;

    if (!proposal_id || !document_url || !signers) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get active e-signature providers
    const providers = (await base44.asServiceRole.entities.ESignatureConfig.list())
      .filter(p => p.is_active)
      .sort((a, b) => a.priority - b.priority);

    if (providers.length === 0) {
      return Response.json({ error: 'No active signature providers' }, { status: 503 });
    }

    // Create signature request
    const signatureRequest = await base44.asServiceRole.entities.SignatureRequest.create({
      proposal_id,
      document_url,
      document_type: 'CCB',
      signers,
      status: 'pending',
    });

    let lastError = null;

    // Try each provider with fallback
    for (const provider of providers) {
      try {
        const result = await sendToProvider(provider, {
          document_url,
          signers,
          callback_url: provider.webhook_url,
        });

        // Update signature request with success
        await base44.asServiceRole.entities.SignatureRequest.update(signatureRequest.id, {
          provider_used: provider.provider_name,
          provider_request_id: result.request_id,
          status: 'sent',
          sent_at: new Date().toISOString(),
          expires_at: result.expires_at,
        });

        // Update provider stats
        await base44.asServiceRole.entities.ESignatureConfig.update(provider.id, {
          success_count: (provider.success_count || 0) + 1,
          health_status: 'healthy',
          last_health_check: new Date().toISOString(),
        });

        return Response.json({
          signature_request_id: signatureRequest.id,
          provider: provider.provider_name,
          provider_request_id: result.request_id,
          status: 'sent',
          signature_link: result.signature_link,
        });

      } catch (error) {
        lastError = error.message;

        // Log error
        const errorLog = signatureRequest.error_log || [];
        errorLog.push({
          provider: provider.provider_name,
          error: error.message,
          timestamp: new Date().toISOString(),
        });

        await base44.asServiceRole.entities.SignatureRequest.update(signatureRequest.id, {
          error_log: errorLog,
          fallback_attempts: (signatureRequest.fallback_attempts || 0) + 1,
        });

        // Update provider stats
        await base44.asServiceRole.entities.ESignatureConfig.update(provider.id, {
          failure_count: (provider.failure_count || 0) + 1,
          health_status: 'degraded',
          last_health_check: new Date().toISOString(),
        });

        // Continue to next provider
        continue;
      }
    }

    // All providers failed
    await base44.asServiceRole.entities.SignatureRequest.update(signatureRequest.id, {
      status: 'error',
    });

    return Response.json({
      error: 'All signature providers failed',
      last_error: lastError,
      attempts: providers.length,
    }, { status: 503 });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});

async function sendToProvider(provider, data) {
  // Simulated provider integration
  // In production, integrate with actual APIs (DocuSign, ClickSign, etc.)
  
  const simulateFailure = Math.random() < 0.1; // 10% failure rate for testing
  
  if (simulateFailure) {
    throw new Error(`${provider.provider_name} API error: timeout`);
  }

  return {
    request_id: `${provider.provider_name.toLowerCase()}_${Date.now()}`,
    signature_link: `https://${provider.provider_name.toLowerCase()}.com/sign/${Date.now()}`,
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  };
}