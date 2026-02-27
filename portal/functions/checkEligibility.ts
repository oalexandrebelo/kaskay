import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();

    const { client_id, convenio_id, requested_amount } = body;

    if (!client_id || !convenio_id) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Fetch client, convenio and rules
    const client = (await base44.asServiceRole.entities.Client.list()).find(c => c.id === client_id);
    if (!client) {
      return Response.json({ error: 'Client not found' }, { status: 404 });
    }

    const convenio = (await base44.asServiceRole.entities.ConvenioConfig.list()).find(c => c.id === convenio_id);
    if (!convenio) {
      return Response.json({ error: 'Convenio not found' }, { status: 404 });
    }

    const allRules = await base44.asServiceRole.entities.EligibilityRule.list();
    const applicableRules = allRules
      .filter(r => r.is_active && (!r.convenio_id || r.convenio_id === convenio_id))
      .sort((a, b) => (a.priority || 100) - (b.priority || 100));

    const results = {
      eligible: true,
      client_id,
      convenio_id,
      requested_amount,
      client_name: client.full_name,
      client_salary: client.net_salary,
      client_margin: client.available_margin,
      rules_applied: [],
      rejections: [],
      warnings: [],
      max_approved_amount: requested_amount,
    };

    // --- EXECUTE ELIGIBILITY RULES ---
    for (const rule of applicableRules) {
      const ruleResult = {
        rule_name: rule.rule_name,
        rule_type: rule.rule_type,
        status: 'passed',
      };

      // --- SALARY REQUIREMENTS ---
      if (rule.rule_type === 'minimum_salary') {
        const salary = client.gross_salary || client.net_salary || 0;
        if (salary < rule.value_min) {
          ruleResult.status = 'failed';
          results.rejections.push(rule.rejection_message || `Salário mínimo exigido: R$ ${rule.value_min}`);
          if (rule.action === 'reject') results.eligible = false;
        }
      }

      // --- EMPLOYMENT TENURE ---
      if (rule.rule_type === 'employment_tenure') {
        const months = Math.floor((Date.now() - new Date(client.created_date)) / (1000 * 60 * 60 * 24 * 30));
        if (months < rule.value_min) {
          ruleResult.status = 'failed';
          results.rejections.push(rule.rejection_message || `Tempo de vínculo mínimo: ${rule.value_min} meses`);
          if (rule.action === 'reject') results.eligible = false;
        }
      }

      // --- MAXIMUM REQUESTS PER MONTH ---
      if (rule.rule_type === 'maximum_requests_per_month') {
        const thisMonth = new Date();
        thisMonth.setDate(1);
        const monthProposals = (await base44.asServiceRole.entities.Proposal.filter({
          client_id,
          created_date: { $gte: thisMonth.toISOString() },
        })).length;

        if (monthProposals >= rule.value_min) {
          ruleResult.status = 'failed';
          results.rejections.push(rule.rejection_message || `Limite mensal já atingido (${rule.value_min} requisições)`);
          if (rule.action === 'reject') results.eligible = false;
        }
      }

      // --- MARGIN PERCENTAGE CHECK ---
      if (rule.rule_type === 'margin_percentage') {
        const maxMarginUsage = (client.gross_salary * rule.value_min) / 100;
        const usedMargin = client.gross_salary - client.available_margin;
        const remainingMargin = client.available_margin;

        if (remainingMargin < requested_amount) {
          ruleResult.status = 'failed';
          results.rejections.push(`Margem insuficiente. Disponível: R$ ${remainingMargin.toFixed(2)}, Solicitado: R$ ${requested_amount.toFixed(2)}`);
          results.max_approved_amount = Math.max(0, remainingMargin);
          if (rule.action === 'reject') results.eligible = false;
        }
      }

      // --- MINIMUM REMAINING SALARY ---
      if (rule.rule_type === 'minimum_remaining_salary') {
        const liquidAfterDeduction = client.net_salary - requested_amount;
        if (liquidAfterDeduction < rule.value_min) {
          ruleResult.status = 'failed';
          results.rejections.push(rule.rejection_message || `Salário mínimo líquido exigido: R$ ${rule.value_min}`);
          if (rule.action === 'reject') results.eligible = false;
        }
      }

      // --- CUTOFF DAY VALIDATION ---
      if (rule.rule_type === 'cutoff_day_validation' && rule.cutoff_config?.enabled) {
        const cutoffDay = rule.cutoff_config.cutoff_day || convenio.cut_off_day;
        const daysBeforeCutoff = rule.cutoff_config.days_before_cutoff || 3;
        const today = new Date();
        const currentDay = today.getDate();

        if (currentDay >= (cutoffDay - daysBeforeCutoff)) {
          ruleResult.status = 'warning';
          results.warnings.push(rule.cutoff_config.rejection_reason || `Próximo ao período de corte de folha (dia ${cutoffDay})`);
        }
      }

      // --- DOCUMENT COMPLETENESS ---
      if (rule.rule_type === 'document_completeness') {
        const requiredDocs = ['identity', 'proof_address', 'employment_proof'];
        const clientDocs = client.documents?.map(d => d.type) || [];
        const missingDocs = requiredDocs.filter(doc => !clientDocs.includes(doc));

        if (missingDocs.length > 0) {
          ruleResult.status = 'failed';
          results.rejections.push(rule.rejection_message || `Documentos pendentes: ${missingDocs.join(', ')}`);
          if (rule.action === 'require_review') ruleResult.status = 'requires_review';
          if (rule.action === 'reject') results.eligible = false;
        }
      }

      // --- SCORING THRESHOLD ---
      if (rule.rule_type === 'score_threshold') {
        // Simplified scoring (can be expanded)
        const score = 100 - (client.available_margin > 0 ? 0 : 50) - (requested_amount > client.net_salary ? 30 : 0);
        if (score < rule.value_min) {
          ruleResult.status = 'failed';
          results.rejections.push(rule.rejection_message || `Score insuficiente: ${score} (mínimo: ${rule.value_min})`);
          if (rule.action === 'require_review') ruleResult.status = 'requires_review';
          if (rule.action === 'reject') results.eligible = false;
        }
      }

      results.rules_applied.push(ruleResult);
    }

    // Final eligibility decision
    results.decision = results.eligible ? 'approved' : 'rejected';
    if (results.rules_applied.some(r => r.status === 'requires_review')) {
      results.decision = 'manual_review';
    }

    return Response.json(results);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});