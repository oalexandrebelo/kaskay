import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get all active scheduled reports
    const reports = (await base44.asServiceRole.entities.ScheduledReport.list())
      .filter(r => r.is_active);

    const results = [];

    for (const report of reports) {
      try {
        const reportData = await generateReport(report, base44);
        
        // Send email
        await base44.integrations.Core.SendEmail({
          to: report.recipients.join(','),
          subject: `Relatório: ${report.title}`,
          body: formatReportEmail(report, reportData),
        });

        // Update last_sent
        await base44.asServiceRole.entities.ScheduledReport.update(report.id, {
          last_sent: new Date().toISOString(),
          next_scheduled: calculateNextExecution(report),
        });

        results.push({
          report_id: report.id,
          title: report.title,
          status: 'sent',
          recipients: report.recipients.length,
        });
      } catch (error) {
        results.push({
          report_id: report.id,
          title: report.title,
          status: 'error',
          error: error.message,
        });
      }
    }

    return Response.json({
      total_reports: results.length,
      sent: results.filter(r => r.status === 'sent').length,
      errors: results.filter(r => r.status === 'error').length,
      details: results,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});

async function generateReport(reportConfig, base44) {
  const filters = reportConfig.filters ? JSON.parse(reportConfig.filters) : {};

  switch (reportConfig.type) {
    case 'proposals':
      const proposals = await base44.asServiceRole.entities.Proposal.list();
      return {
        total: proposals.length,
        approved: proposals.filter(p => p.status === 'disbursed').length,
        pending: proposals.filter(p => p.status.includes('pending')).length,
        rejected: proposals.filter(p => p.status === 'rejected').length,
      };

    case 'collections':
      const installments = await base44.asServiceRole.entities.Installment.list();
      return {
        total: installments.length,
        paid: installments.filter(i => i.status === 'paid').length,
        overdue: installments.filter(i => i.status === 'overdue').length,
        defaulted: installments.filter(i => i.status === 'defaulted').length,
      };

    case 'financial':
      const issues = await base44.asServiceRole.entities.PaymentIssue.list();
      return {
        total_issues: issues.length,
        outstanding: issues.reduce((sum, i) => sum + (i.outstanding_amount || 0), 0),
        critical: issues.filter(i => i.severity === 'critical').length,
      };

    default:
      return { status: 'generated', timestamp: new Date().toISOString() };
  }
}

function calculateNextExecution(report) {
  const now = new Date();
  
  switch (report.frequency) {
    case 'daily':
      now.setDate(now.getDate() + 1);
      break;
    case 'weekly':
      now.setDate(now.getDate() + 7);
      break;
    case 'monthly':
      now.setMonth(now.getMonth() + 1);
      break;
  }
  
  return now.toISOString();
}

function formatReportEmail(report, data) {
  return `
Relatório: ${report.title}
Data: ${new Date().toLocaleDateString('pt-BR')}

${JSON.stringify(data, null, 2)}

---
Gerado automaticamente pelo sistema Kaskay
  `;
}