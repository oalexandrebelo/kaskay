import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import crypto from 'crypto';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { file_path, file_name, file_type, content, change_description, is_manual } = await req.json();

    if (!file_path || !file_name || !file_type || !content) {
      return Response.json(
        { error: 'Missing required fields: file_path, file_name, file_type, content' },
        { status: 400 }
      );
    }

    // Calcular hash do conteúdo
    const content_hash = crypto
      .createHash('sha256')
      .update(content)
      .digest('hex');

    // Verificar se já existe snapshot com mesmo hash
    const existingSnapshots = await base44.entities.FileSnapshot.filter({
      file_path,
      content_hash
    });

    if (existingSnapshots.length > 0) {
      return Response.json({
        message: 'Conteúdo idêntico já foi salvo',
        snapshot_id: existingSnapshots[0].id
      });
    }

    // Criar novo snapshot
    const snapshot = await base44.entities.FileSnapshot.create({
      file_path,
      file_name,
      file_type,
      content,
      content_hash,
      change_description: change_description || 'Backup automático',
      is_manual: is_manual || false,
      created_by: user.email,
      tags: is_manual ? ['manual'] : ['automático']
    });

    // Limpeza automática: manter só últimas 10 versões
    const allVersions = await base44.entities.FileSnapshot.filter({ file_path });
    
    if (allVersions.length > 10) {
      // Ordenar por data e pegar as mais antigas
      const sorted = allVersions.sort((a, b) => 
        new Date(a.created_date) - new Date(b.created_date)
      );
      
      // Deletar as antigas (manter as 10 mais recentes)
      const toDelete = sorted.slice(0, allVersions.length - 10);
      
      for (const old of toDelete) {
        await base44.entities.FileSnapshot.delete(old.id);
      }
    }

    return Response.json({
      success: true,
      snapshot_id: snapshot.id,
      file_path,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});