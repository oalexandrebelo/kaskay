import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin only' }, { status: 403 });
    }

    // Get pending commissions
    const commissions = await base44.asServiceRole.entities.Commission.filter({
      status: 'pending',
    });

    const now = new Date();
    const processed = [];
    const errors = [];

    for (const commission of commissions) {
      try {
        // Check if proposal is fully disbursed
        const proposals = await base44.asServiceRole.entities.Proposal.list();
        const proposal = proposals.find(p => p.id === commission.proposal_id);

        if (!proposal || proposal.status !== 'disbursed') {
          continue; // Skip if not disbursed
        }

        // Check payment (installment paid)
        const installments = await base44.asServiceRole.entities.Installment.filter({
          proposal_id: proposal.id,
        });

        const allPaid = installments.every(i => i.status === 'paid');

        if (!allPaid) {
          continue; // Wait for payment
        }

        // Approve commission
        await base44.asServiceRole.entities.Commission.update(commission.id, {
          status: 'approved',
          payment_date: now.toISOString(),
        });

        // Send notification
        await base44.integrations.Core.SendEmail({
          to: commission.user_email,
          subject: 'Comissão Aprovada',
          body: `Sua comissão de R$ ${commission.commission_amount.toFixed(2)} foi aprovada e será paga em breve.`,
        });

        processed.push({
          commission_id: commission.id,
          user_email: commission.user_email,
          amount: commission.commission_amount,
        });

      } catch (error) {
        errors.push({
          commission_id: commission.id,
          error: error.message,
        });
      }
    }

    return Response.json({
      total_commissions: commissions.length,
      processed: processed.length,
      errors: errors.length,
      total_amount: processed.reduce((sum, c) => sum + c.amount, 0),
      details: processed,
      error_details: errors,
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});