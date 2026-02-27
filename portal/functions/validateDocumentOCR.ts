import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();

    const { document_id, auto_approve_threshold } = body;

    if (!document_id) {
      return Response.json({ error: 'Missing document_id' }, { status: 400 });
    }

    // Get document
    const docs = await base44.asServiceRole.entities.Document.list();
    const document = docs.find(d => d.id === document_id);

    if (!document) {
      return Response.json({ error: 'Document not found' }, { status: 404 });
    }

    // Perform OCR extraction (using base44 integrations)
    const ocrResult = await base44.integrations.Core.InvokeLLM({
      prompt: `Extract key information from this document: ${document.file_url}. Return structured JSON with: validity_date, issuer, confidence (0-100), extracted_text`,
      file_urls: [document.file_url],
      response_json_schema: {
        type: 'object',
        properties: {
          extracted_text: { type: 'string' },
          validity_date: { type: 'string' },
          issuer: { type: 'string' },
          confidence: { type: 'number' },
        },
      },
    });

    // Check validity
    const isExpired = new Date(ocrResult.validity_date) < new Date();
    const threshold = auto_approve_threshold || 85;
    const shouldApprove = !isExpired && ocrResult.confidence >= threshold;

    // Update document
    await base44.asServiceRole.entities.Document.update(document_id, {
      ocr_data: ocrResult,
      validity_date: ocrResult.validity_date,
      status: shouldApprove ? 'approved' : 'pending_review',
    });

    // Create audit log
    await logDocumentValidation(base44, document, ocrResult, shouldApprove);

    return Response.json({
      document_id,
      status: shouldApprove ? 'approved' : 'pending_review',
      ocr_data: ocrResult,
      is_expired: isExpired,
      confidence: ocrResult.confidence,
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});

async function logDocumentValidation(base44, document, ocrResult, approved) {
  try {
    await base44.asServiceRole.entities.AuditLog.create({
      entity_type: 'Document',
      entity_id: document.id,
      action: 'ocr_validation',
      details: {
        document_type: document.document_type,
        confidence: ocrResult.confidence,
        approved,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (e) {
    // Silently fail
  }
}