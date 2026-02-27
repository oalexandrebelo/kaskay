import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();

    const { client_cpf, convenio_id } = body;

    if (!client_cpf || !convenio_id) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get primary margin manager
    const managers = await base44.asServiceRole.entities.MarginManagerIntegration.list();
    const activeManagers = managers
      .filter(m => m.is_active && (!m.supported_convenios?.length || m.supported_convenios.includes(convenio_id)))
      .sort((a, b) => (a.priority || 0) - (b.priority || 0));

    if (activeManagers.length === 0) {
      return Response.json({ error: 'No margin managers available for this convenio' }, { status: 404 });
    }

    let lastError = null;
    const results = {
      cpf: client_cpf,
      convenio_id,
      margin_available: 0,
      total_margin: 0,
      used_margin: 0,
      provider_consulted: null,
      status: 'failed',
      attempts: [],
    };

    // Try each manager with fallback
    for (const manager of activeManagers) {
      const attempt = {
        provider: manager.provider_name,
        status: 'pending',
        error: null,
        data: null,
      };

      try {
        // Simulating API call - replace with actual integration
        const marginData = await queryMarginManager(manager, client_cpf, convenio_id);

        if (marginData) {
          results.margin_available = marginData.margin_available || 0;
          results.total_margin = marginData.total_margin || 0;
          results.used_margin = marginData.used_margin || 0;
          results.provider_consulted = manager.provider_name;
          results.status = 'success';
          attempt.status = 'success';
          attempt.data = marginData;
          results.attempts.push(attempt);
          break;
        }
      } catch (error) {
        lastError = error.message;
        attempt.status = 'failed';
        attempt.error = error.message;
        results.attempts.push(attempt);

        // Log error for monitoring
        try {
          await base44.asServiceRole.entities.MarginManagerIntegration.update(manager.id, {
            error_count_24h: (manager.error_count_24h || 0) + 1,
            last_error: error.message,
            health_status: 'degraded',
            last_health_check: new Date().toISOString(),
          });
        } catch (e) {
          // Silently fail update
        }

        continue;
      }
    }

    if (results.status === 'failed') {
      return Response.json({ 
        error: 'All margin managers failed', 
        last_error: lastError,
        attempts: results.attempts 
      }, { status: 503 });
    }

    return Response.json(results);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});

// Simulated margin manager query
async function queryMarginManager(manager, cpf, convenioId) {
  // This would be replaced with actual API calls
  // Example: QI Tech, Zetra, etc have different APIs
  
  // Simulating 10% chance of failure for demo
  if (Math.random() < 0.1) {
    throw new Error(`${manager.provider_name} temporarily unavailable`);
  }

  // Return mock data
  return {
    cpf: cpf,
    total_margin: 5000 + Math.random() * 10000,
    used_margin: Math.random() * 5000,
    margin_available: Math.random() * 10000,
    last_updated: new Date().toISOString(),
    valid_until: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  };
}