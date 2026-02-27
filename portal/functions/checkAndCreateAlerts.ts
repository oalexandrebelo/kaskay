import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Get data
    const proposals = await base44.asServiceRole.entities.Proposal.list('-created_date', 2000);
    const installments = await base44.asServiceRole.entities.Installment.list();
    const convenios = await base44.asServiceRole.entities.ConvenioConfig.list();
    const paymentIssues = await base44.asServiceRole.entities.PaymentIssue.list();

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // --- ALERT: REJECTION SPIKE ---
    const todayRejected = proposals.filter(p => {
      const created = new Date(p.created_date);
      created.setHours(0, 0, 0, 0);
      return created.getTime() === today.getTime() && p.status === 'rejected';
    }).length;

    const yesterdayCreated = proposals.filter(p => {
      const created = new Date(p.created_date);
      created.setHours(0, 0, 0, 0);
      return created.getTime() === yesterday.getTime();
    }).length;

    const todayCreated = proposals.filter(p => {
      const created = new Date(p.created_date);
      created.setHours(0, 0, 0, 0);
      return created.getTime() === today.getTime();
    }).length;

    const todayRejectionRate = todayCreated > 0 ? (todayRejected / todayCreated) * 100 : 0;
    const yesterdayRejected = proposals.filter(p => {
      const created = new Date(p.created_date);
      created.setHours(0, 0, 0, 0);
      return created.getTime() === yesterday.getTime() && p.status === 'rejected';
    }).length;
    const yesterdayRejectionRate = yesterdayCreated > 0 ? (yesterdayRejected / yesterdayCreated) * 100 : 0;

    const rejectionSpike = todayRejectionRate > yesterdayRejectionRate * 1.5 && todayRejectionRate > 15;
    if (rejectionSpike) {
      const existingAlert = (await base44.asServiceRole.entities.Alert.filter({
        alert_type: 'rejection_spike',
        status: 'active',
      })).find(a => new Date(a.triggered_at).toDateString() === today.toDateString());

      if (!existingAlert) {
        await base44.asServiceRole.entities.Alert.create({
          alert_type: 'rejection_spike',
          severity: 'high',
          title: 'Pico de Rejeições Detectado',
          description: `Taxa de rejeição de ${todayRejectionRate.toFixed(1)}% hoje (limite: 15%). Verificar motivos principais.`,
          metrics: { spike_percentage: todayRejectionRate, threshold: 15, yesterday_rate: yesterdayRejectionRate },
          status: 'active',
          action_required: true,
          suggested_action: 'Revisar propostas rejeitadas e validar regras de elegibilidade',
          triggered_at: new Date().toISOString(),
        });
      }
    }

    // --- ALERT: HIGH DELINQUENCY ---
    const overdue = installments.filter(i => new Date(i.due_date) < today && i.status !== 'paid');
    const delinquencyRate = installments.length > 0 ? (overdue.length / installments.length) * 100 : 0;
    if (delinquencyRate > 10) {
      const existingAlert = (await base44.asServiceRole.entities.Alert.filter({
        alert_type: 'high_delinquency',
        status: 'active',
      })).find(a => new Date(a.triggered_at).toDateString() === today.toDateString());

      if (!existingAlert) {
        await base44.asServiceRole.entities.Alert.create({
          alert_type: 'high_delinquency',
          severity: 'critical',
          title: 'Inadimplência Acima do Limite',
          description: `Taxa de inadimplência de ${delinquencyRate.toFixed(1)}% (limite: 10%). ${overdue.length} parcelas vencidas.`,
          metrics: { delinquency_rate: delinquencyRate, threshold: 10, overdue_count: overdue.length },
          status: 'active',
          action_required: true,
          suggested_action: 'Ativar régua de cobrança intensiva',
          triggered_at: new Date().toISOString(),
        });
      }
    }

    // --- ALERT: SLA BREACH ---
    const slaCutoff = new Date(Date.now() - 48 * 60 * 60 * 1000);
    const slaBreached = proposals.filter(p => {
      const created = new Date(p.created_date);
      return created < slaCutoff && !['disbursed', 'rejected', 'cancelled'].includes(p.status);
    }).length;

    if (slaBreached > 5) {
      const existingAlert = (await base44.asServiceRole.entities.Alert.filter({
        alert_type: 'sla_breach',
        status: 'active',
      })).find(a => new Date(a.triggered_at).toDateString() === today.toDateString());

      if (!existingAlert) {
        await base44.asServiceRole.entities.Alert.create({
          alert_type: 'sla_breach',
          severity: 'high',
          title: 'SLA Estourado em Múltiplos Casos',
          description: `${slaBreached} propostas travadas há mais de 48h. Investigar gargalos.`,
          metrics: { breached_count: slaBreached, threshold: 5 },
          status: 'active',
          action_required: true,
          suggested_action: 'Revisar casos travados e resolver bloqueios',
          triggered_at: new Date().toISOString(),
        });
      }
    }

    // --- ALERT: RECONCILIATION DIVERGENCE ---
    const divergencies = paymentIssues.filter(i => i.status === 'open' || i.status === 'in_collection');
    const divergencyAmount = divergencies.reduce((sum, d) => sum + (d.outstanding_amount || 0), 0);

    if (divergencies.length > 20 || divergencyAmount > 500000) {
      const existingAlert = (await base44.asServiceRole.entities.Alert.filter({
        alert_type: 'reconciliation_divergence',
        status: 'active',
      })).find(a => new Date(a.triggered_at).toDateString() === today.toDateString());

      if (!existingAlert) {
        await base44.asServiceRole.entities.Alert.create({
          alert_type: 'reconciliation_divergence',
          severity: 'high',
          title: 'Divergências de Conciliação Críticas',
          description: `${divergencies.length} divergências pendentes totalizando R$ ${(divergencyAmount / 1000).toFixed(0)}k.`,
          metrics: { divergency_count: divergencies.length, total_amount: divergencyAmount, threshold_count: 20, threshold_amount: 500000 },
          status: 'active',
          action_required: true,
          suggested_action: 'Priorizar reconciliação de valores divergentes',
          triggered_at: new Date().toISOString(),
        });
      }
    }

    // --- Resolve old alerts if conditions improve ---
    const activeAlerts = await base44.asServiceRole.entities.Alert.filter({ status: 'active' });
    for (const alert of activeAlerts) {
      const alertDate = new Date(alert.triggered_at);
      alertDate.setHours(0, 0, 0, 0);

      // Only check alerts from today or yesterday
      if (alertDate.getTime() < yesterday.getTime()) {
        continue;
      }

      let shouldResolve = false;

      if (alert.alert_type === 'rejection_spike' && todayRejectionRate <= 15) {
        shouldResolve = true;
      }
      if (alert.alert_type === 'high_delinquency' && delinquencyRate <= 10) {
        shouldResolve = true;
      }
      if (alert.alert_type === 'sla_breach' && slaBreached <= 5) {
        shouldResolve = true;
      }
      if (alert.alert_type === 'reconciliation_divergence' && divergencies.length <= 20 && divergencyAmount <= 500000) {
        shouldResolve = true;
      }

      if (shouldResolve) {
        await base44.asServiceRole.entities.Alert.update(alert.id, {
          status: 'resolved',
          resolved_at: new Date().toISOString(),
        });
      }
    }

    return Response.json({ success: true, alerts_checked: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});