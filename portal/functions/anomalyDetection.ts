import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const TWILIO_ACCOUNT_SID = Deno.env.get('TWILIO_ACCOUNT_SID');
const TWILIO_AUTH_TOKEN = Deno.env.get('TWILIO_AUTH_TOKEN');
const TWILIO_PHONE_NUMBER = Deno.env.get('TWILIO_PHONE_NUMBER');

async function sendWhatsAppMessage(to, message) {
    const auth = btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`);
    
    await fetch(
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
}

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user || user.role !== 'admin') {
            return Response.json({ error: 'Admin only' }, { status: 403 });
        }

        // Buscar propostas dos últimos 7 dias
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
        const proposals = await base44.asServiceRole.entities.Proposal.filter({});
        
        const recentProposals = proposals?.filter(p => 
            p.created_date > sevenDaysAgo
        ) || [];

        if (recentProposals.length === 0) {
            return Response.json({ message: 'No recent data' });
        }

        // Calcular taxa de aprovação
        const totalRecent = recentProposals.length;
        const approvedRecent = recentProposals.filter(p => p.decision_result === 'approved').length;
        const approvalRate = (approvedRecent / totalRecent * 100).toFixed(1);

        // Comparar com histórico (últimos 30 dias)
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
        const historicalProposals = proposals?.filter(p => 
            p.created_date > thirtyDaysAgo
        ) || [];
        
        const historicalApprovalRate = historicalProposals.length > 0
            ? (historicalProposals.filter(p => p.decision_result === 'approved').length / historicalProposals.length * 100)
            : 50;

        // Buscar pagamentos vencidos
        const overdue = await base44.asServiceRole.entities.Installment.filter({ 
            status: 'overdue' 
        });

        const overdueRate = overdue?.length ? (overdue.length / recentProposals.length * 100).toFixed(1) : 0;

        // Detectar anomalias
        const alerts = [];

        if (Math.abs(approvalRate - historicalApprovalRate) > 20) {
            alerts.push(`⚠️ TAXA APROVAÇÃO ANOMALIA: ${approvalRate}% (histórico: ${historicalApprovalRate.toFixed(1)}%)`);
        }

        if (overdueRate > 15) {
            alerts.push(`🚨 INADIMPLÊNCIA ALTA: ${overdueRate}% de vencidos`);
        }

        const rejectionRate = (100 - approvalRate);
        if (rejectionRate > 60) {
            alerts.push(`⛔ TAXA REJEIÇÃO MUITO ALTA: ${rejectionRate.toFixed(1)}% - modelo pode estar muito restritivo`);
        }

        // Verificar velocidade de processamento
        const durations = recentProposals
            .map(p => {
                const start = new Date(p.created_date);
                const end = new Date();
                return (end - start) / (1000 * 60 * 60); // horas
            });

        const avgProcessingTime = (durations.reduce((a, b) => a + b, 0) / durations.length).toFixed(1);
        if (avgProcessingTime > 48) {
            alerts.push(`📉 PROCESSAMENTO LENTO: ${avgProcessingTime}h média (alvo: <24h)`);
        }

        if (alerts.length > 0) {
            const alertMessage = `🚨 ALERTAS DETECTADOS:\n\n${alerts.join('\n')}\n\nAnalise as tendências e revise o modelo se necessário.`;
            
            const admins = await base44.asServiceRole.entities.User.filter({ role: 'admin' });
            for (const admin of admins || []) {
                if (admin.phone) {
                    await sendWhatsAppMessage(admin.phone, alertMessage);
                }
            }

            // Registrar alertas
            for (const alert of alerts) {
                await base44.asServiceRole.entities.AuditLog.create({
                    entity_type: 'System',
                    action: 'anomaly_detected',
                    details: alert,
                    performed_by: 'system'
                });
            }
        }

        return Response.json({ 
            alerts,
            metrics: {
                approval_rate: approvalRate,
                historical_rate: historicalApprovalRate.toFixed(1),
                overdue_rate: overdueRate,
                avg_processing_time: avgProcessingTime
            }
        });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});