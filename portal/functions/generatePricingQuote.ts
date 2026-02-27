import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();

    const { requested_amount, convenio_id, client_cpf } = body;

    if (!requested_amount) {
      return Response.json({ error: 'Missing requested_amount' }, { status: 400 });
    }

    // Get pricing rules
    const rules = (await base44.asServiceRole.entities.PricingRule.list())
      .filter(r => r.is_active)
      .sort((a, b) => a.priority - b.priority);

    // Find applicable rule
    let applicableRule = null;
    for (const rule of rules) {
      // Match by convenio
      if (convenio_id && rule.convenio_id && rule.convenio_id !== convenio_id) continue;

      applicableRule = rule;
      break;
    }

    if (!applicableRule) {
      return Response.json({ error: 'No pricing rule found' }, { status: 404 });
    }

    // Calculate interest rate
    let monthlyRate = applicableRule.base_rate;

    // Apply amount-based tiers
    if (applicableRule.amount_ranges?.length > 0) {
      for (const range of applicableRule.amount_ranges) {
        if (requested_amount >= range.min_amount && 
            requested_amount <= range.max_amount) {
          monthlyRate = range.rate;
          break;
        }
      }
    }

    // Apply risk adjustments
    if (client_cpf && applicableRule.risk_factors) {
      const clients = await base44.asServiceRole.entities.Client.list();
      const client = clients.find(c => c.cpf === client_cpf);

      if (client) {
        // Check delinquency history
        const installments = await base44.asServiceRole.entities.Installment.filter({
          client_cpf,
        });
        
        const hasDelinquency = installments.some(i => i.status === 'overdue' || i.status === 'defaulted');
        if (hasDelinquency && applicableRule.risk_factors.delinquency_multiplier) {
          monthlyRate *= applicableRule.risk_factors.delinquency_multiplier;
        }

        // New customer premium
        const proposals = await base44.asServiceRole.entities.Proposal.filter({ client_cpf });
        if (proposals.length === 0 && applicableRule.risk_factors.new_customer_multiplier) {
          monthlyRate *= applicableRule.risk_factors.new_customer_multiplier;
        }
      }
    }

    // Apply caps
    if (applicableRule.minimum_rate && monthlyRate < applicableRule.minimum_rate) {
      monthlyRate = applicableRule.minimum_rate;
    }
    if (applicableRule.maximum_rate && monthlyRate > applicableRule.maximum_rate) {
      monthlyRate = applicableRule.maximum_rate;
    }

    // Calculate fees
    const fees = applicableRule.fees || {};
    const originationFee = (fees.origination_fee_percent || 0) * requested_amount / 100 + 
                          (fees.origination_fee_fixed || 0);
    const insuranceFee = (fees.insurance_fee_percent || 0) * requested_amount / 100;
    const averbationFee = fees.averbation_fee || 0;

    const totalFees = originationFee + insuranceFee + averbationFee;

    // Calculate totals (single installment for salary advance)
    const interestAmount = requested_amount * (monthlyRate / 100);
    const totalAmount = requested_amount + interestAmount + totalFees;
    const netAmount = requested_amount - totalFees; // Amount client receives

    // Annual rate and CET
    const annualRate = ((1 + monthlyRate / 100) ** 12 - 1) * 100;
    const cet = ((totalAmount / netAmount - 1) * 12) * 100; // Simplified CET

    return Response.json({
      requested_amount,
      net_amount: Math.round(netAmount * 100) / 100,
      monthly_rate: Math.round(monthlyRate * 100) / 100,
      annual_rate: Math.round(annualRate * 100) / 100,
      cet: Math.round(cet * 100) / 100,
      interest_amount: Math.round(interestAmount * 100) / 100,
      fees: {
        origination: Math.round(originationFee * 100) / 100,
        insurance: Math.round(insuranceFee * 100) / 100,
        averbation: Math.round(averbationFee * 100) / 100,
        total: Math.round(totalFees * 100) / 100,
      },
      total_amount: Math.round(totalAmount * 100) / 100,
      installment_value: Math.round(totalAmount * 100) / 100,
      rule_applied: applicableRule.rule_name,
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});