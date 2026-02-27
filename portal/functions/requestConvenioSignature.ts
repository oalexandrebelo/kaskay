import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const {
      convenio_id,
      convenio_name,
      document_type,
      document_url,
      signer_name,
      signer_email,
      signer_cpf,
      signer_role,
      notes,
    } = await req.json();

    // Prazo de 7 dias para assinatura
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Criar solicitação de assinatura
    const signatureRequest = await base44.asServiceRole.entities.ConvenioSignatureRequest.create({
      convenio_id,
      convenio_name,
      document_type,
      document_url,
      signer_name,
      signer_email,
      signer_cpf,
      signer_role,
      status: 'pending',
      expires_at: expiresAt.toISOString(),
      requested_by: user.email,
      notes,
    });

    // Gerar tarefa automática para o assinante
    const task = await base44.asServiceRole.entities.Task.create({
      title: `Assinar ${getDocumentLabel(document_type)} - ${convenio_name}`,
      description: `Documento de credenciamento aguardando sua assinatura. Prazo: ${expiresAt.toLocaleDateString('pt-BR')}`,
      assigned_to: signer_email,
      assigned_by: user.email,
      priority: 'high',
      urgency: 'high',
      status: 'pending',
      source: 'automation',
      source_id: signatureRequest.id,
      related_entity_type: 'ConvenioSignatureRequest',
      related_entity_id: signatureRequest.id,
      due_date: expiresAt.toISOString(),
    });

    // Atualizar signature request com task_id
    await base44.asServiceRole.entities.ConvenioSignatureRequest.update(signatureRequest.id, {
      task_id: task.id,
      sent_at: new Date().toISOString(),
      status: 'sent',
    });

    // Enviar notificação por email
    await base44.asServiceRole.integrations.Core.SendEmail({
      to: signer_email,
      subject: `Documento para assinatura - ${convenio_name}`,
      body: `
        Olá ${signer_name},

        Você tem um documento de credenciamento aguardando sua assinatura:

        Convênio: ${convenio_name}
        Documento: ${getDocumentLabel(document_type)}
        Prazo: ${expiresAt.toLocaleDateString('pt-BR')}

        Acesse o portal para visualizar e assinar o documento:
        ${Deno.env.get('APP_URL') || 'https://app.kaskay.com'}/portal

        Atenciosamente,
        Equipe Kaskay
      `,
    });

    return Response.json({
      success: true,
      signature_request_id: signatureRequest.id,
      task_id: task.id,
      message: 'Solicitação de assinatura enviada com sucesso',
    });

  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function getDocumentLabel(type) {
  const labels = {
    contrato_credenciamento: 'Contrato de Credenciamento',
    termo_adesao: 'Termo de Adesão',
    procuracao: 'Procuração',
    contrato_cessao: 'Contrato de Cessão',
    aditivo_contratual: 'Aditivo Contratual',
    termo_confidencialidade: 'Termo de Confidencialidade',
  };
  return labels[type] || type;
}