import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { proposal_id } = await req.json();

    if (!proposal_id) {
      return Response.json({ error: 'proposal_id obrigatório' }, { status: 400 });
    }

    // Buscar proposta
    const proposal = await base44.asServiceRole.entities.Proposal.get(proposal_id);
    if (!proposal) {
      return Response.json({ error: 'Proposta não encontrada' }, { status: 404 });
    }

    // 1. VERIFICAR ELEGIBILIDADE
    const eligibilityResult = await base44.asServiceRole.functions.invoke('checkEligibility', {
      client_id: proposal.client_id,
      convenio_id: proposal.convenio_id,
      requested_amount: proposal.requested_amount,
    });

    // 2. CALCULAR SCORE
    const scoreResult = await base44.asServiceRole.functions.invoke('calculateAdvancedScore', {
      proposal_id: proposal.id,
      client_id: proposal.client_id,
    });

    // 3. VERIFICAR FRAUDE
    const fraudResult = await base44.asServiceRole.functions.invoke('detectFraud', {
      entity_id: proposal.id,
      entity_type: 'Proposal',
    });

    // === DECISÃO AUTOMATIZADA ===
    const decision = {
      proposal_id,
      timestamp: new Date().toISOString(),
      eligibility: eligibilityResult.data,
      score: scoreResult.data,
      fraud: fraudResult.data,
      decision: 'pending',
      decision_reason: [],
      confidence_level: 0,
      requires_manual_review: false,
      auto_approved: false,
      auto_rejected: false,
    };

    // Regras de aprovação automática
    const autoApproveConditions = [
      eligibilityResult.data.decision === 'approved',
      scoreResult.data.overall_score >= 75,
      scoreResult.data.risk_level === 'low' || scoreResult.data.risk_level === 'very_low',
      fraudResult.data.overall_score >= 70,
      fraudResult.data.risk_level !== 'critical' && fraudResult.data.risk_level !== 'high',
      proposal.requested_amount <= 5000, // Limite conservador para auto-aprovação
    ];

    const autoApproveScore = autoApproveConditions.filter(c => c).length;
    decision.confidence_level = (autoApproveScore / autoApproveConditions.length) * 100;

    // APROVAÇÃO AUTOMÁTICA (100% confiança)
    if (autoApproveScore === autoApproveConditions.length) {
      decision.decision = 'approved';
      decision.auto_approved = true;
      decision.decision_reason.push('✅ Todos critérios de aprovação automática atendidos');
      decision.decision_reason.push(`✅ Score: ${scoreResult.data.overall_score}/100 (≥75)`);
      decision.decision_reason.push(`✅ Risco: ${scoreResult.data.risk_level}`);
      decision.decision_reason.push(`✅ Fraude: ${fraudResult.data.overall_score}/100 (≥70)`);

      // Atualizar proposta automaticamente
      await base44.asServiceRole.entities.Proposal.update(proposal_id, {
        status: 'margin_check',
        decision_result: 'approved',
        decision_score: scoreResult.data.overall_score,
        notes: decision.decision_reason.join('\n'),
      });
    }
    // REJEIÇÃO AUTOMÁTICA
    else if (
      !eligibilityResult.data.eligible ||
      scoreResult.data.overall_score < 40 ||
      scoreResult.data.risk_level === 'critical' ||
      fraudResult.data.risk_level === 'critical' ||
      fraudResult.data.overall_score < 30
    ) {
      decision.decision = 'rejected';
      decision.auto_rejected = true;

      // Motivos claros de rejeição
      if (!eligibilityResult.data.eligible) {
        eligibilityResult.data.rejections.forEach(r => {
          decision.decision_reason.push(`❌ ${r}`);
        });
      }
      if (scoreResult.data.overall_score < 40) {
        decision.decision_reason.push(`❌ Score insuficiente: ${scoreResult.data.overall_score}/100 (mínimo: 40)`);
      }
      if (fraudResult.data.risk_level === 'critical') {
        decision.decision_reason.push('❌ Risco crítico de fraude detectado');
        fraudResult.data.fraud_indicators?.forEach(ind => {
          decision.decision_reason.push(`  • ${ind.description}`);
        });
      }

      // Atualizar proposta
      await base44.asServiceRole.entities.Proposal.update(proposal_id, {
        status: 'rejected',
        decision_result: 'rejected',
        decision_score: scoreResult.data.overall_score,
        rejection_reason: decision.decision_reason.join('\n'),
      });
    }
    // REVISÃO MANUAL (casos intermediários ou ambíguos)
    else {
      decision.decision = 'manual_review';
      decision.requires_manual_review = true;

      // Motivos para revisão manual
      if (scoreResult.data.overall_score < 75) {
        decision.decision_reason.push(`⚠️ Score moderado: ${scoreResult.data.overall_score}/100`);
      }
      if (scoreResult.data.risk_level === 'medium') {
        decision.decision_reason.push('⚠️ Risco médio detectado');
      }
      if (fraudResult.data.overall_score < 70) {
        decision.decision_reason.push(`⚠️ Score de fraude baixo: ${fraudResult.data.overall_score}/100`);
      }
      if (proposal.requested_amount > 5000) {
        decision.decision_reason.push(`⚠️ Valor acima do limite de auto-aprovação (R$ ${proposal.requested_amount.toFixed(2)})`);
      }
      if (eligibilityResult.data.warnings?.length > 0) {
        eligibilityResult.data.warnings.forEach(w => {
          decision.decision_reason.push(`⚠️ ${w}`);
        });
      }

      // Calcular prioridade de revisão
      let priority = 'normal';
      if (scoreResult.data.overall_score >= 65 && fraudResult.data.overall_score >= 60) {
        priority = 'high'; // Boa chance de aprovação
      } else if (scoreResult.data.overall_score < 50 || fraudResult.data.overall_score < 50) {
        priority = 'low'; // Pouca chance de aprovação
      }

      // Atualizar proposta
      await base44.asServiceRole.entities.Proposal.update(proposal_id, {
        status: 'under_analysis',
        decision_result: 'manual_review',
        decision_score: scoreResult.data.overall_score,
        notes: `Prioridade: ${priority.toUpperCase()}\n\n` + decision.decision_reason.join('\n'),
      });
    }

    return Response.json({
      success: true,
      decision: decision.decision,
      auto_approved: decision.auto_approved,
      auto_rejected: decision.auto_rejected,
      requires_manual_review: decision.requires_manual_review,
      confidence_level: Math.round(decision.confidence_level),
      reasons: decision.decision_reason,
      score: scoreResult.data.overall_score,
      risk_level: scoreResult.data.risk_level,
      fraud_score: fraudResult.data.overall_score,
    });

  } catch (error) {
    console.error('Auto Decision Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});