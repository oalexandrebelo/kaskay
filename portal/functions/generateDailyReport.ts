import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Para automação agendada, usar service role
    let user;
    try {
      user = await base44.auth.me();
    } catch {
      user = null;
    }
    
    // Se chamado por usuário, verificar se é admin
    if (user && user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Fetch proposals, installments, clients
    const proposals = await base44.entities.Proposal.list('-created_date', 2000);
    const installments = await base44.entities.Installment.list();
    const paymentIssues = await base44.entities.PaymentIssue.list();
    const convenios = await base44.entities.ConvenioConfig.list();

    // --- TODAY'S METRICS ---
    const todayProposals = proposals.filter(p => {
      const created = new Date(p.created_date);
      created.setHours(0, 0, 0, 0);
      return created.getTime() === today.getTime();
    });

    const createdToday = todayProposals.length;
    const approvedToday = todayProposals.filter(p => p.status === 'disbursed').length;
    const rejectedToday = todayProposals.filter(p => p.status === 'rejected').length;

    // --- MONTH-TO-DATE ---
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const mtdProposals = proposals.filter(p => new Date(p.created_date) >= monthStart);
    const mtdCreated = mtdProposals.length;
    const mtdApproved = mtdProposals.filter(p => p.status === 'disbursed').length;
    const mtdDisbursed = mtdProposals.filter(p => p.status === 'disbursed').reduce((sum, p) => sum + (p.approved_amount || 0), 0);

    // --- DELINQUENCY ---
    const overdue = installments.filter(i => new Date(i.due_date) < today && i.status !== 'paid');
    const delinquencyRate = installments.length > 0 ? ((overdue.length / installments.length) * 100).toFixed(2) : 0;

    // --- REJECTIONS ANALYSIS ---
    const rejectionReasons = proposals.filter(p => p.status === 'rejected').reduce((acc, p) => {
      const reason = p.rejection_reason || 'Unknown';
      acc[reason] = (acc[reason] || 0) + 1;
      return acc;
    }, {});

    const totalRejected = Object.values(rejectionReasons).reduce((a, b) => a + b, 0);
    const rejectionRate = proposals.length > 0 ? ((totalRejected / proposals.length) * 100).toFixed(2) : 0;

    // --- TOP CONVENIOS BY VOLUME ---
    const convVolume = {};
    mtdProposals.forEach(p => {
      const conv = p.client_cpf; // Simplified grouping
      convVolume[conv] = (convVolume[conv] || 0) + 1;
    });

    const topConvenios = Object.entries(convVolume)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([conv, count]) => ({ convenio: conv, count }));

    // --- DIVERGENCIES ---
    const divergencies = paymentIssues.filter(i => i.status === 'open' || i.status === 'in_collection');
    const divergencyAmount = divergencies.reduce((sum, d) => sum + (d.outstanding_amount || 0), 0);

    // --- AVERAGE METRICS ---
    const approvedProposals = proposals.filter(p => p.status === 'disbursed');
    const avgAmount = approvedProposals.length > 0
      ? (approvedProposals.reduce((sum, p) => sum + (p.approved_amount || 0), 0) / approvedProposals.length).toFixed(2)
      : 0;

    const avgRate = approvedProposals.length > 0
      ? (approvedProposals.reduce((sum, p) => sum + (p.interest_rate || 0), 0) / approvedProposals.length).toFixed(2)
      : 0;

    // --- BUILD REPORT ---
    const reportData = {
      generated_at: new Date().toISOString(),
      period: 'daily',
      date: today.toISOString().split('T')[0],
      summary: {
        created_today: createdToday,
        approved_today: approvedToday,
        rejected_today: rejectedToday,
        rejection_rate: rejectionRate,
      },
      mtd: {
        created: mtdCreated,
        approved: mtdApproved,
        disbursed: parseFloat(mtdDisbursed),
      },
      portfolio: {
        total_proposals: proposals.length,
        total_active: proposals.filter(p => !['rejected', 'cancelled'].includes(p.status)).length,
        total_disbursed: parseFloat(approvedProposals.reduce((sum, p) => sum + (p.approved_amount || 0), 0)),
        average_amount: parseFloat(avgAmount),
        average_rate: parseFloat(avgRate),
      },
      delinquency: {
        overdue_count: overdue.length,
        delinquency_rate: parseFloat(delinquencyRate),
        overdue_amount: parseFloat(overdue.reduce((sum, i) => sum + (i.expected_amount - (i.paid_amount || 0)), 0)),
      },
      rejections: rejectionReasons,
      divergencies: {
        count: divergencies.length,
        total_amount: parseFloat(divergencyAmount),
      },
      top_convenios: topConvenios,
    };

    // Log report creation (apenas se houver usuário autenticado)
    if (user) {
      await base44.asServiceRole.entities.Task.create({
        title: `Relatório Diário Gerado - ${today.toLocaleDateString('pt-BR')}`,
        description: `Relatório operacional automático com ${createdToday} propostas, ${approvedToday} aprovadas, taxa rejeição ${rejectionRate}%`,
        status: 'completed',
        priority: 'medium',
        assigned_to: user.email,
        assigned_by: user.email,
      });
    }

    return Response.json({
      success: true,
      report: reportData,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});