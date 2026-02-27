import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();

    const { proposal_id, ip_address, device_fingerprint } = body;

    if (!proposal_id) {
      return Response.json({ error: 'Missing proposal_id' }, { status: 400 });
    }

    // Get proposal
    const proposals = await base44.asServiceRole.entities.Proposal.list();
    const proposal = proposals.find(p => p.id === proposal_id);

    if (!proposal) {
      return Response.json({ error: 'Proposal not found' }, { status: 404 });
    }

    const fraudIndicators = [];
    let overallScore = 100;

    // 1. Velocity abuse check
    const recentProposals = proposals.filter(p => 
      p.client_cpf === proposal.client_cpf &&
      (new Date() - new Date(p.created_date)) < 24 * 60 * 60 * 1000
    );

    if (recentProposals.length > 3) {
      fraudIndicators.push({
        indicator: 'velocity_abuse',
        severity: 'high',
        description: `${recentProposals.length} propostas nas últimas 24h`,
        score_impact: -30,
      });
      overallScore -= 30;
    }

    // 2. Device trust check
    if (device_fingerprint) {
      const trustedDevices = await base44.asServiceRole.entities.DeviceTrust.filter({
        user_email: proposal.client_cpf,
      });

      const isTrusted = trustedDevices.some(d => d.mac_address === device_fingerprint.device_id);

      if (!isTrusted) {
        fraudIndicators.push({
          indicator: 'device_mismatch',
          severity: 'medium',
          description: 'Dispositivo não confiável',
          score_impact: -15,
        });
        overallScore -= 15;
      }
    }

    // 3. Geolocation check
    if (ip_address) {
      const geoData = await checkGeolocation(ip_address);
      
      if (geoData.country !== 'BR') {
        fraudIndicators.push({
          indicator: 'geolocation_suspicious',
          severity: 'critical',
          description: `IP fora do Brasil: ${geoData.country}`,
          score_impact: -40,
        });
        overallScore -= 40;
      }

      // Distance check (if we have client address)
      if (geoData.distance_km > 500) {
        fraudIndicators.push({
          indicator: 'geolocation_suspicious',
          severity: 'medium',
          description: `Distância suspeita: ${geoData.distance_km}km`,
          score_impact: -20,
        });
        overallScore -= 20;
      }
    }

    // 4. Document inconsistency
    const documents = await base44.asServiceRole.entities.Document.filter({
      entity_id: proposal.client_id,
    });

    const rejectedDocs = documents.filter(d => d.status === 'rejected').length;
    if (rejectedDocs > 0) {
      fraudIndicators.push({
        indicator: 'document_inconsistency',
        severity: 'high',
        description: `${rejectedDocs} documentos rejeitados`,
        score_impact: -25,
      });
      overallScore -= 25;
    }

    // 5. Blacklist check (simulated)
    const isBlacklisted = await checkBlacklist(proposal.client_cpf);
    if (isBlacklisted) {
      fraudIndicators.push({
        indicator: 'blacklist_match',
        severity: 'critical',
        description: 'CPF em lista de bloqueio',
        score_impact: -50,
      });
      overallScore -= 50;
    }

    // Final score
    overallScore = Math.max(0, Math.min(100, overallScore));

    let riskLevel = 'low';
    if (overallScore < 30) riskLevel = 'critical';
    else if (overallScore < 50) riskLevel = 'high';
    else if (overallScore < 70) riskLevel = 'medium';

    let action = 'approve';
    if (riskLevel === 'critical') action = 'block';
    else if (riskLevel === 'high') action = 'reject';
    else if (riskLevel === 'medium') action = 'manual_review';

    // Save fraud score
    const fraudScore = await base44.asServiceRole.entities.FraudScore.create({
      entity_type: 'Proposal',
      entity_id: proposal_id,
      client_cpf: proposal.client_cpf,
      overall_score: overallScore,
      risk_level: riskLevel,
      fraud_indicators: fraudIndicators,
      action_taken: action,
      geolocation_data: ip_address ? await checkGeolocation(ip_address) : {},
      device_fingerprint: device_fingerprint || {},
      analyzed_at: new Date().toISOString(),
    });

    // Create alert if high risk
    if (riskLevel === 'critical' || riskLevel === 'high') {
      await base44.asServiceRole.entities.Alert.create({
        alert_type: 'fraud_spike',
        severity: riskLevel === 'critical' ? 'critical' : 'high',
        title: `Fraude detectada - ${proposal.client_name}`,
        description: `Score: ${overallScore} | Indicadores: ${fraudIndicators.length}`,
        related_entity_id: proposal_id,
        related_entity_type: 'Proposal',
        action_required: true,
        triggered_at: new Date().toISOString(),
      });
    }

    return Response.json({
      fraud_score_id: fraudScore.id,
      overall_score: overallScore,
      risk_level: riskLevel,
      action: action,
      indicators_count: fraudIndicators.length,
      fraud_indicators: fraudIndicators,
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});

async function checkGeolocation(ip) {
  // Simulated geolocation check
  return {
    ip_address: ip,
    country: 'BR',
    state: 'SP',
    city: 'São Paulo',
    latitude: -23.5505,
    longitude: -46.6333,
    distance_km: Math.random() * 1000,
  };
}

async function checkBlacklist(cpf) {
  // Simulated blacklist check
  return false;
}