import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();

    const { event, data, old_data } = payload;

    if (event.type !== 'update') {
      return Response.json({ success: true });
    }

    // Detectar mudanças significativas
    const changes = [];
    const criticalFields = ['is_active', 'accepts_new_contracts', 'max_margin_percentage'];

    criticalFields.forEach(field => {
      if (old_data?.[field] !== data?.[field]) {
        changes.push({
          field,
          old_value: String(old_data?.[field] || 'N/A'),
          new_value: String(data?.[field] || 'N/A'),
        });
      }
    });

    if (changes.length === 0) {
      return Response.json({ success: true });
    }

    // Determinar prioridade e áreas impactadas
    const isActivationChange = changes.some(c => c.field === 'is_active');
    const isMarginChange = changes.some(c => c.field === 'max_margin_percentage');

    let priority = 'medium';
    let affected_areas = ['Operações'];

    if (isActivationChange) {
      priority = 'high';
      affected_areas = ['Operações', 'Financeiro', 'Jurídico'];
    } else if (isMarginChange) {
      affected_areas = ['Operações', 'Financeiro'];
    }

    // Obter usuários das áreas impactadas
    const permissions = await base44.asServiceRole.entities.UserPermission.filter({});
    const affectedUsers = permissions
      .filter(p => p.allowed_pages?.includes('ConvenioRelationship'))
      .map(p => p.user_email);

    // Criar notificação
    const notification = await base44.asServiceRole.entities.ConvenioStatusNotification.create({
      convenio_id: event.entity_id,
      convenio_name: data.convenio_name,
      notification_type: isActivationChange ? 'status_change' : 'contract_update',
      status_change: changes[0],
      affected_areas,
      priority,
      triggered_by: 'system_automation',
      message: generateMessage(data, changes),
      action_required: isActivationChange,
      action_type: isActivationChange ? 'acknowledge' : null,
      notified_users: affectedUsers,
    });

    // Enviar email de notificação para áreas críticas
    if (isActivationChange) {
      const user = await base44.auth.me();
      await Promise.all(
        affectedUsers.map(email =>
          base44.integrations.Core.SendEmail({
            to: email,
            subject: `[AÇÃO REQUERIDA] Mudança de Status - Convênio ${data.convenio_name}`,
            body: `Convênio ${data.convenio_name} teve seu status alterado para ${data.is_active ? 'ATIVO' : 'INATIVO'}.\n\nPor favor revise as informações no sistema e confirme o recebimento dessa notificação.`,
          })
        )
      );
    }

    return Response.json({
      success: true,
      notificationId: notification.id,
      affectedUsers: affectedUsers.length,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function generateMessage(convenio, changes) {
  const change = changes[0];
  const fieldLabels = {
    is_active: 'Status',
    accepts_new_contracts: 'Aceita Novos Contratos',
    max_margin_percentage: 'Margem Consignável',
  };

  return `${fieldLabels[change.field] || change.field} alterado de "${change.old_value}" para "${change.new_value}" no convênio ${convenio.convenio_name}.`;
}