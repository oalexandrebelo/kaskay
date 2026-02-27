import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();

    const { proposal_id, operation_type } = body;
    // operation_type: 'ccb_issuance', 'signature_link', 'status_check'

    if (!proposal_id || !operation_type) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get proposal
    const proposal = (await base44.asServiceRole.entities.Proposal.list()).find(p => p.id === proposal_id);
    if (!proposal) {
      return Response.json({ error: 'Proposal not found' }, { status: 404 });
    }

    // Get primary SCD
    const scds = await base44.asServiceRole.entities.SCDIntegration.list();
    const activeSCDs = scds
      .filter(s => s.is_active && s.supported_products.includes(proposal.product_type))
      .sort((a, b) => (a.priority || 0) - (b.priority || 0));

    if (activeSCDs.length === 0) {
      return Response.json({ error: 'No SCD available for this product' }, { status: 404 });
    }

    let lastError = null;
    const results = {
      proposal_id,
      operation_type,
      scd_provider: null,
      status: 'failed',
      data: null,
      attempts: [],
    };

    // Try each SCD with fallback
    for (const scd of activeSCDs) {
      const attempt = {
        provider: scd.provider_name,
        status: 'pending',
        error: null,
      };

      try {
        const operationResult = await performSCDOperation(scd, proposal, operation_type);

        if (operationResult) {
          results.scd_provider = scd.provider_name;
          results.status = 'success';
          results.data = operationResult;
          attempt.status = 'success';
          results.attempts.push(attempt);

          // Update proposal with SCD info
          await base44.asServiceRole.entities.Proposal.update(proposal_id, {
            scd_partner: scd.provider_name,
            signature_id: operationResult.signature_id || proposal.signature_id,
            ccb_url: operationResult.ccb_url || proposal.ccb_url,
            ccb_number: operationResult.ccb_number || proposal.ccb_number,
          });

          break;
        }
      } catch (error) {
        lastError = error.message;
        attempt.status = 'failed';
        attempt.error = error.message;
        results.attempts.push(attempt);

        // Log error
        try {
          await base44.asServiceRole.entities.SCDIntegration.update(scd.id, {
            error_count_24h: (scd.error_count_24h || 0) + 1,
            last_error: error.message,
            health_status: 'degraded',
            last_health_check: new Date().toISOString(),
          });
        } catch (e) {
          // Silently fail
        }

        continue;
      }
    }

    if (results.status === 'failed') {
      return Response.json({ 
        error: 'All SCDs failed', 
        last_error: lastError,
        attempts: results.attempts 
      }, { status: 503 });
    }

    return Response.json(results);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});

// Simulated SCD operations
async function performSCDOperation(scd, proposal, operationType) {
  // This would be replaced with actual SCD API calls
  // Different for QI Tech, BMP, Celcoin, UY3
  
  if (Math.random() < 0.05) {
    throw new Error(`${scd.provider_name} API error`);
  }

  const baseData = {
    proposal_id: proposal.id,
    proposal_number: proposal.proposal_number,
    client_cpf: proposal.client_cpf,
    amount: proposal.approved_amount,
    scd_provider: scd.provider_name,
    timestamp: new Date().toISOString(),
  };

  switch (operationType) {
    case 'ccb_issuance':
      return {
        ...baseData,
        ccb_number: `CCB-${scd.provider_name.substring(0, 3).toUpperCase()}-${Date.now()}`,
        ccb_url: `https://ccb.${scd.provider_name.toLowerCase()}.com/${Date.now()}`,
        ccb_status: 'issued',
        issued_at: new Date().toISOString(),
      };

    case 'signature_link':
      return {
        ...baseData,
        signature_id: `SIG-${scd.provider_name.substring(0, 3).toUpperCase()}-${Date.now()}`,
        signature_link: `https://signature.${scd.provider_name.toLowerCase()}.com/${Date.now()}`,
        signature_status: 'pending',
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      };

    case 'status_check':
      return {
        ...baseData,
        status: 'active',
        ccb_status: 'issued',
        signature_status: 'signed',
        averbation_status: 'pending',
      };

    default:
      throw new Error('Unknown operation type');
  }
}