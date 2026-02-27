import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();

    const { event_type, entity_id, data } = body;

    if (!event_type || !entity_id) {
      return Response.json({ error: 'Missing fields' }, { status: 400 });
    }

    // Get active webhooks for this event type
    const webhooks = (await base44.asServiceRole.entities.WebhookConfig.list())
      .filter(w => w.is_active && w.event_types.includes(event_type));

    if (webhooks.length === 0) {
      return Response.json({ message: 'No webhooks configured for this event' });
    }

    const results = [];

    for (const webhook of webhooks) {
      try {
        const payload = {
          event: event_type,
          entity_id,
          data,
          timestamp: new Date().toISOString(),
        };

        // Generate HMAC signature
        const signature = await generateHMAC(JSON.stringify(payload), webhook.secret);

        // Send webhook
        const response = await fetch(webhook.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Webhook-Signature': signature,
            ...webhook.headers,
          },
          body: JSON.stringify(payload),
        });

        if (response.ok) {
          await base44.asServiceRole.entities.WebhookConfig.update(webhook.id, {
            last_triggered: new Date().toISOString(),
            success_count: (webhook.success_count || 0) + 1,
          });

          results.push({
            webhook_id: webhook.id,
            status: 'success',
            response_status: response.status,
          });
        } else {
          throw new Error(`HTTP ${response.status}`);
        }

      } catch (error) {
        // Retry logic
        await retryWebhook(base44, webhook, { event_type, entity_id, data }, error);

        await base44.asServiceRole.entities.WebhookConfig.update(webhook.id, {
          failure_count: (webhook.failure_count || 0) + 1,
        });

        results.push({
          webhook_id: webhook.id,
          status: 'failed',
          error: error.message,
        });
      }
    }

    return Response.json({
      event_type,
      webhooks_triggered: webhooks.length,
      results,
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});

async function generateHMAC(payload, secret) {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const payloadData = encoder.encode(payload);

  const key = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', key, payloadData);
  
  return Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

async function retryWebhook(base44, webhook, payload, error) {
  const maxRetries = webhook.retry_policy?.max_retries || 3;
  const delay = webhook.retry_policy?.retry_delay_seconds || 60;

  // Schedule retry (simplified - in production use a queue system)
  console.log(`Scheduling retry for webhook ${webhook.id} in ${delay}s`);
}