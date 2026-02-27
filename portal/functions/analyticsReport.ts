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

        // Buscar todas as previsões vs outcomes
        const learnings = await base44.asServiceRole.entities.ClientLearning.filter({});
        
        if (!learnings?.length) {
            return Response.json({ message: 'No data yet' });
        }

        // Calcular métricas
        const totalPredictions = learnings.length;
        const correctPredictions = learnings.filter(l => l.model_accuracy === 1).length;
        const accuracy = (correctPredictions / totalPredictions * 100).toFixed(1);

        // Accurácia por range de score
        const scoreRanges = {
            'Alto (70+)': learnings.filter(l => l.predicted_score >= 70).length,
            'Médio (50-69)': learnings.filter(l => l.predicted_score >= 50 && l.predicted_score < 70).length,
            'Baixo (<50)': learnings.filter(l => l.predicted_score < 50).length,
        };

        const highScoreAccuracy = learnings
            .filter(l => l.predicted_score >= 70)
            .filter(l => l.model_accuracy === 1).length / (scoreRanges['Alto (70+)'] || 1) * 100;

        // Tempo médio até outcome
        const avgDaysToOutcome = (learnings.reduce((sum, l) => sum + (l.days_to_outcome || 0), 0) / totalPredictions).toFixed(1);

        // Taxa de conversão real vs predita
        const actualConversions = learnings.filter(l => l.actual_conversion).length;
        const conversionRate = (actualConversions / totalPredictions * 100).toFixed(1);

        const report = `
📊 ANALYTICS MENSAL - Modelo de Score

Previsões Totais: ${totalPredictions}
Acurácia Geral: ${accuracy}%

🎯 ACURÁCIA POR RANGE
Alto (70+): ${scoreRanges['Alto (70+)'] || 0} propostas | ${highScoreAccuracy.toFixed(1)}% acertos
Médio (50-69): ${scoreRanges['Médio (50-69)'] || 0} propostas
Baixo (<50): ${scoreRanges['Baixo (<50)'] || 0} propostas

💰 CONVERSÃO
Taxa Real: ${conversionRate}%
Tempo Médio: ${avgDaysToOutcome} dias

🔍 RECOMENDAÇÕES
${accuracy < 70 ? '⚠️ Acurácia abaixo de 70% - revisar modelo' : '✅ Modelo performando bem'}
${highScoreAccuracy > 80 ? '✅ Score alto com alta acurácia - confiar nele' : '⚠️ Score alto com baixa acurácia - investigar'}
`;

        // Enviar para admins
        const admins = await base44.asServiceRole.entities.User.filter({ role: 'admin' });
        for (const admin of admins || []) {
            if (admin.phone) {
                await sendWhatsAppMessage(admin.phone, report);
            }
        }

        // Salvar relatório
        await base44.asServiceRole.entities.SystemConfig.create({
            config_key: `analytics_report_${new Date().toISOString().split('T')[0]}`,
            config_value: JSON.stringify({
                accuracy,
                total_predictions: totalPredictions,
                score_ranges: scoreRanges,
                conversion_rate: conversionRate,
                avg_days_to_outcome: avgDaysToOutcome
            })
        });

        return Response.json({ report, accuracy, totalPredictions });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});