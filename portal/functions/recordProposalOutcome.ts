import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const { proposal_id, actual_outcome, conversion_status, days_to_close } = await req.json();

        if (!proposal_id || !actual_outcome) {
            return Response.json({ error: 'Missing parameters' }, { status: 400 });
        }

        // Buscar proposta e score
        const proposal = await base44.asServiceRole.entities.Proposal.filter({ id: proposal_id });
        if (!proposal?.length) return Response.json({ error: 'Not found' }, { status: 404 });

        const prop = proposal[0];
        const fraudScore = await base44.asServiceRole.entities.FraudScore.filter({ proposal_id });

        // Registrar resultado real
        await base44.asServiceRole.entities.ClientLearning.create({
            proposal_id,
            client_id: prop.client_id,
            predicted_result: prop.decision_result,
            predicted_score: prop.decision_score,
            actual_result: actual_outcome, // 'approved', 'rejected', 'paid', 'defaulted'
            actual_conversion: conversion_status === 'converted',
            model_accuracy: prop.decision_result === actual_outcome ? 1 : 0,
            days_to_outcome: days_to_close || 0,
            convenio_name: prop.client_name,
            analysis_notes: `Proposta #${prop.proposal_number} - Real outcome: ${actual_outcome}`
        });

        return Response.json({ success: true });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});