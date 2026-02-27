import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Buscar parcelas vencidas
    const installments = await base44.asServiceRole.entities.Installment.filter({
      status: 'pending',
    });

    const overdueInstallments = installments.filter(inst => {
      const dueDate = new Date(inst.due_date);
      return dueDate < today;
    });

    // Buscar réguas de cobrança ativas
    const collectionRules = await base44.asServiceRole.entities.CollectionRule.filter({
      is_active: true,
    });

    const actionsScheduled = [];

    for (const installment of overdueInstallments) {
      const dueDate = new Date(installment.due_date);
      const daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));

      // Encontrar régua aplicável
      const applicableRule = collectionRules.find(rule => {
        const amountMatch = 
          (!rule.applies_to_amount_from || installment.expected_amount >= rule.applies_to_amount_from) &&
          (!rule.applies_to_amount_to || installment.expected_amount <= rule.applies_to_amount_to);
        
        const daysMatch = 
          daysOverdue >= rule.days_overdue_from &&
          (!rule.days_overdue_to || daysOverdue <= rule.days_overdue_to);
        
        return amountMatch && daysMatch;
      });

      if (!applicableRule) continue;

      // Verificar ações a executar hoje
      for (const action of applicableRule.actions || []) {
        if (action.day === daysOverdue) {
          // Verificar se ação já foi executada
          const existingActions = await base44.asServiceRole.entities.CollectionAction.filter({
            installment_id: installment.id,
            action_type: action.action_type,
            days_overdue: daysOverdue,
          });

          if (existingActions.length === 0) {
            // Criar ação de cobrança
            const scheduledTime = new Date();
            if (action.time) {
              const [hours, minutes] = action.time.split(':');
              scheduledTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
            }

            const collectionAction = await base44.asServiceRole.entities.CollectionAction.create({
              installment_id: installment.id,
              proposal_id: installment.proposal_id,
              client_cpf: installment.client_cpf,
              client_name: installment.client_name,
              action_type: action.action_type,
              action_template: action.template,
              days_overdue: daysOverdue,
              outstanding_amount: installment.expected_amount,
              action_status: 'scheduled',
              scheduled_for: scheduledTime.toISOString(),
              executed_by: 'system',
            });

            actionsScheduled.push({
              action_id: collectionAction.id,
              client: installment.client_name,
              type: action.action_type,
              days_overdue: daysOverdue,
            });

            // Executar ação (simulado)
            if (action.action_type === 'sms' || action.action_type === 'whatsapp') {
              // Integrar com Twilio/WhatsApp
              await base44.asServiceRole.entities.CollectionAction.update(collectionAction.id, {
                action_status: 'sent',
                executed_at: new Date().toISOString(),
              });
            }
          }
        }
      }
    }

    return Response.json({
      success: true,
      overdue_installments: overdueInstallments.length,
      actions_scheduled: actionsScheduled.length,
      actions: actionsScheduled,
    });

  } catch (error) {
    console.error('Collection Rule Execution Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});