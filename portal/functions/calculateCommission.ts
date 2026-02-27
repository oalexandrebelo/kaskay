import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();

    const { user_id, proposal_id } = body;

    if (!user_id || !proposal_id) {
      return Response.json({ error: 'Missing fields' }, { status: 400 });
    }

    // Get proposal
    const proposals = await base44.asServiceRole.entities.Proposal.list();
    const proposal = proposals.find(p => p.id === proposal_id);

    if (!proposal) {
      return Response.json({ error: 'Proposal not found' }, { status: 404 });
    }

    // Get user
    const users = await base44.asServiceRole.entities.User.list();
    const user = users.find(u => u.id === user_id);

    if (!user) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    // Get commission rules
    const rules = (await base44.asServiceRole.entities.CommissionRule.list())
      .filter(r => r.is_active)
      .sort((a, b) => a.priority - b.priority);

    // Find applicable rule
    let applicableRule = null;
    for (const rule of rules) {
      // Match by role
      if (rule.user_role && rule.user_role !== user.role) continue;

      // Match by product
      if (rule.product_type && rule.product_type !== proposal.product_type) continue;

      // Match by amount range
      if (rule.amount_min && proposal.approved_amount < rule.amount_min) continue;
      if (rule.amount_max && proposal.approved_amount > rule.amount_max) continue;

      applicableRule = rule;
      break;
    }

    if (!applicableRule) {
      return Response.json({
        message: 'No applicable commission rule',
        commission_amount: 0,
      });
    }

    // Calculate commission
    let commissionAmount = 0;

    if (applicableRule.calculation_method === 'percentage') {
      commissionAmount = proposal.approved_amount * (applicableRule.commission_rate / 100);
    } else if (applicableRule.calculation_method === 'fixed') {
      commissionAmount = applicableRule.fixed_amount;
    } else if (applicableRule.calculation_method === 'tiered') {
      // Tiered calculation based on amount ranges
      const tiers = applicableRule.tiers || [];
      for (const tier of tiers) {
        if (proposal.approved_amount >= tier.min_amount && 
            (!tier.max_amount || proposal.approved_amount <= tier.max_amount)) {
          commissionAmount = proposal.approved_amount * (tier.rate / 100);
          break;
        }
      }
    }

    // Apply caps
    if (applicableRule.max_commission && commissionAmount > applicableRule.max_commission) {
      commissionAmount = applicableRule.max_commission;
    }

    // Create commission record
    const commission = await base44.asServiceRole.entities.Commission.create({
      user_id,
      user_email: user.email,
      proposal_id,
      commission_type: 'sale',
      base_amount: proposal.approved_amount,
      commission_rate: applicableRule.commission_rate,
      commission_amount: commissionAmount,
      status: 'pending',
    });

    // Update proposal with commission info
    await base44.asServiceRole.entities.Proposal.update(proposal_id, {
      commission_amount: commissionAmount,
      commission_id: commission.id,
    });

    return Response.json({
      commission_id: commission.id,
      user_email: user.email,
      proposal_id,
      rule_applied: applicableRule.name,
      base_amount: proposal.approved_amount,
      commission_rate: applicableRule.commission_rate,
      commission_amount: commissionAmount,
      status: 'pending',
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});