import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { period } = await req.json(); // Format: YYYY-MM

    const periodStart = new Date(period + '-01');
    const periodEnd = new Date(periodStart);
    periodEnd.setMonth(periodEnd.getMonth() + 1);

    // Buscar propostas do período
    const allProposals = await base44.asServiceRole.entities.Proposal.list('-created_date', 5000);
    
    const proposals = allProposals.filter(p => {
      const created = new Date(p.created_date);
      return created >= periodStart && created < periodEnd;
    });

    // Classificar por tipo de análise
    const automatic = proposals.filter(p => 
      p.decision_result && 
      p.decision_result !== 'manual_review' &&
      !p.notes?.includes('manual') &&
      !p.notes?.includes('analista')
    );

    const manual = proposals.filter(p => 
      p.notes?.includes('manual') || 
      p.notes?.includes('analista') ||
      p.notes?.includes('override')
    );

    const semiAutomatic = proposals.filter(p => 
      p.decision_result === 'manual_review' &&
      !manual.includes(p)
    );

    // Calcular métricas por tipo
    const calculateMetrics = (subset, analysisType) => {
      const approved = subset.filter(p => ['disbursed', 'approved', 'margin_approved'].includes(p.status));
      const rejected = subset.filter(p => p.status === 'rejected');
      
      const totalAmount = subset.reduce((sum, p) => sum + (p.requested_amount || 0), 0);
      const approvedAmount = approved.reduce((sum, p) => sum + (p.approved_amount || 0), 0);
      const rejectedAmount = rejected.reduce((sum, p) => sum + (p.requested_amount || 0), 0);

      // Agregação de motivos de rejeição
      const rejectionReasons = {};
      rejected.forEach(p => {
        const reason = p.rejection_reason || 'Não especificado';
        rejectionReasons[reason] = (rejectionReasons[reason] || 0) + 1;
      });

      return {
        period,
        analysis_type: analysisType,
        total_proposals: subset.length,
        approved_count: approved.length,
        rejected_count: rejected.length,
        approval_rate: subset.length > 0 ? (approved.length / subset.length) * 100 : 0,
        rejection_rate: subset.length > 0 ? (rejected.length / subset.length) * 100 : 0,
        total_amount_approved: approvedAmount,
        total_amount_rejected: rejectedAmount,
        rejection_reasons: rejectionReasons,
      };
    };

    const automaticMetrics = calculateMetrics(automatic, 'automatic');
    const manualMetrics = calculateMetrics(manual, 'manual');
    const semiAutomaticMetrics = calculateMetrics(semiAutomatic, 'semi_automatic');

    // Salvar métricas
    await base44.asServiceRole.entities.AnalysisMetrics.create(automaticMetrics);
    await base44.asServiceRole.entities.AnalysisMetrics.create(manualMetrics);
    await base44.asServiceRole.entities.AnalysisMetrics.create(semiAutomaticMetrics);

    return Response.json({
      success: true,
      period,
      summary: {
        total: proposals.length,
        automatic: {
          count: automatic.length,
          approval_rate: automaticMetrics.approval_rate.toFixed(1),
        },
        manual: {
          count: manual.length,
          approval_rate: manualMetrics.approval_rate.toFixed(1),
        },
        semi_automatic: {
          count: semiAutomatic.length,
          approval_rate: semiAutomaticMetrics.approval_rate.toFixed(1),
        },
      },
      metrics: [automaticMetrics, manualMetrics, semiAutomaticMetrics],
    });

  } catch (error) {
    console.error('Analysis Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});