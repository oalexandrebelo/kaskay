import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const TWILIO_ACCOUNT_SID = Deno.env.get('TWILIO_ACCOUNT_SID');
const TWILIO_AUTH_TOKEN = Deno.env.get('TWILIO_AUTH_TOKEN');
const TWILIO_PHONE_NUMBER = Deno.env.get('TWILIO_PHONE_NUMBER');

async function sendWhatsAppMessage(to, message) {
    const auth = btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`);
    
    const response = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`,
        {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${auth}`,
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                From: `whatsapp:${TWILIO_PHONE_NUMBER}`,
                To: `whatsapp:${to}`,
                Body: message,
            }).toString(),
        }
    );

    return response.json();
}

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const payload = await req.json();

        const { proposal_id, event_type, phone } = payload;

        if (!proposal_id || !event_type) {
            return Response.json({ error: 'Missing parameters' }, { status: 400 });
        }

        const proposal = await base44.asServiceRole.entities.Proposal.filter({ id: proposal_id });
        if (!proposal?.length) return Response.json({ error: 'Not found' }, { status: 404 });

        const prop = proposal[0];
        let message = '';

        switch (event_type) {
            case 'approved':
                message = `✅ Parabéns ${prop.client_name}! Sua proposta #${prop.proposal_number} foi aprovada! Valor: R$ ${prop.approved_amount?.toFixed(2) || 'N/A'}. Aguardando documentação para prosseguir.`;
                break;
            case 'rejected':
                message = `❌ Proposta #${prop.proposal_number} foi rejeitada. Motivo: ${prop.rejection_reason || 'Score insuficiente'}. Fale com nosso time para mais informações.`;
                break;
            case 'needs_documents':
                message = `📄 ${prop.client_name}, precisamos dos seus documentos para continuar com a proposta #${prop.proposal_number}. Envie para prosseguir!`;
                break;
            case 'overdue_payment':
                message = `⚠️ ${prop.client_name}, você tem um pagamento vencido. Valor: R$ ${prop.installment_value?.toFixed(2) || 'N/A'}. Regularize para evitar juros.`;
                break;
        }

        if (message && phone) {
            await sendWhatsAppMessage(phone, message);
        }

        // Registrar no AuditLog
        await base44.asServiceRole.entities.AuditLog.create({
            entity_type: 'Proposal',
            entity_id: proposal_id,
            action: 'notification_sent',
            details: `${event_type} notification sent to ${phone}`,
            performed_by: 'system'
        });

        return Response.json({ success: true, message });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});