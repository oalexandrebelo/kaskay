import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { approval_request_id, action, notes } = await req.json();

    if (!approval_request_id || !action) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Buscar solicitação de aprovação
    const approvalRequest = (await base44.asServiceRole.entities.ApprovalRequest.list())
      .find(ar => ar.id === approval_request_id);

    if (!approvalRequest) {
      return Response.json({ error: 'Approval request not found' }, { status: 404 });
    }

    // Verificar se já expirou
    if (approvalRequest.expires_at && new Date(approvalRequest.expires_at) < new Date()) {
      await base44.asServiceRole.entities.ApprovalRequest.update(approval_request_id, {
        status: 'expired',
      });
      return Response.json({ error: 'Approval request expired' }, { status: 400 });
    }

    // Buscar regra de aprovação
    const rule = (await base44.asServiceRole.entities.ApprovalRule.list())
      .find(r => r.id === approvalRequest.rule_id);

    if (!rule) {
      return Response.json({ error: 'Approval rule not found' }, { status: 404 });
    }

    // Verificar permissões do usuário
    const userPermissions = await base44.asServiceRole.entities.UserPermission.filter({
      user_email: user.email,
    });

    const userRole = userPermissions[0]?.role_profile || user.role;

    // === PROCESSAR APROVAÇÃO ===
    if (action === 'approve') {
      if (approvalRequest.status === 'pending_first') {
        // Primeira aprovação
        if (userRole !== rule.first_approver_role && userRole !== 'admin_master') {
          return Response.json({ error: 'Insufficient permissions for first approval' }, { status: 403 });
        }

        await base44.asServiceRole.entities.ApprovalRequest.update(approval_request_id, {
          status: 'pending_second',
          first_approver: user.email,
          first_approval_at: new Date().toISOString(),
          first_approval_notes: notes,
        });

        // Criar alerta para segundo aprovador
        await base44.asServiceRole.entities.Alert.create({
          alert_type: 'custom',
          severity: 'medium',
          title: `Aprovação Pendente - ${approvalRequest.rule_type}`,
          description: `Aguardando segunda aprovação. Solicitado por: ${approvalRequest.requested_by}`,
          related_entity_id: approval_request_id,
          related_entity_type: 'ApprovalRequest',
          status: 'active',
          action_required: true,
          suggested_action: 'Revisar e aprovar/rejeitar solicitação',
          triggered_at: new Date().toISOString(),
        });

        return Response.json({
          success: true,
          message: 'First approval completed. Waiting for second approval.',
          status: 'pending_second',
        });

      } else if (approvalRequest.status === 'pending_second') {
        // Segunda aprovação
        if (userRole !== rule.second_approver_role && userRole !== 'admin_master') {
          return Response.json({ error: 'Insufficient permissions for second approval' }, { status: 403 });
        }

        // Não pode ser o mesmo aprovador
        if (user.email === approvalRequest.first_approver) {
          return Response.json({ error: 'Same user cannot approve twice' }, { status: 403 });
        }

        await base44.asServiceRole.entities.ApprovalRequest.update(approval_request_id, {
          status: 'approved',
          second_approver: user.email,
          second_approval_at: new Date().toISOString(),
          second_approval_notes: notes,
          completed_at: new Date().toISOString(),
        });

        // Executar mudança aprovada
        await executeApprovedChange(base44, approvalRequest);

        return Response.json({
          success: true,
          message: 'Request fully approved and executed.',
          status: 'approved',
        });
      }
    }

    // === PROCESSAR REJEIÇÃO ===
    if (action === 'reject') {
      await base44.asServiceRole.entities.ApprovalRequest.update(approval_request_id, {
        status: 'rejected',
        rejected_by: user.email,
        rejected_at: new Date().toISOString(),
        rejection_reason: notes,
        completed_at: new Date().toISOString(),
      });

      return Response.json({
        success: true,
        message: 'Request rejected.',
        status: 'rejected',
      });
    }

    return Response.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error) {
    console.error('Process Approval Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

// Executar mudança aprovada
async function executeApprovedChange(base44, approvalRequest) {
  const { entity_type, entity_id, change_details, rule_type } = approvalRequest;

  if (rule_type === 'bank_account_change') {
    await base44.asServiceRole.entities[entity_type].update(entity_id, {
      disbursement_bank: change_details.new_value,
    });
  } else if (rule_type === 'override_decision') {
    await base44.asServiceRole.entities.Proposal.update(entity_id, {
      status: 'approved',
      decision_result: 'approved',
      notes: `Override aprovado via dupla aprovação`,
    });
  } else if (rule_type === 'manual_release') {
    await base44.asServiceRole.entities.Proposal.update(entity_id, {
      status: 'disbursed',
      disbursement_date: new Date().toISOString(),
    });
  }
  // Adicionar outros tipos conforme necessário
}