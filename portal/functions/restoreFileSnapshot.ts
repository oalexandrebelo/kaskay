import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { snapshot_id } = await req.json();

    if (!snapshot_id) {
      return Response.json(
        { error: 'Missing required field: snapshot_id' },
        { status: 400 }
      );
    }

    // Buscar snapshot
    const snapshots = await base44.entities.FileSnapshot.filter({ id: snapshot_id });
    
    if (snapshots.length === 0) {
      return Response.json(
        { error: 'Snapshot não encontrado' },
        { status: 404 }
      );
    }

    const snapshot = snapshots[0];

    // Marcar como restaurado
    await base44.entities.FileSnapshot.update(snapshot.id, {
      is_restored: true,
      tags: [...(snapshot.tags || []), 'restaurado']
    });

    return Response.json({
      success: true,
      message: `Arquivo ${snapshot.file_name} restaurado com sucesso`,
      snapshot: {
        id: snapshot.id,
        file_path: snapshot.file_path,
        file_name: snapshot.file_name,
        content: snapshot.content,
        created_date: snapshot.created_date,
        created_by: snapshot.created_by,
        change_description: snapshot.change_description
      }
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});