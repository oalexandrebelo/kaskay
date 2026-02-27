import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Shield, AlertTriangle, Check, X, Trash2, Lock, Unlock, Monitor } from 'lucide-react';

export default function DeviceSecurityManagement() {
  const [selectedBlock, setSelectedBlock] = useState(null);
  const queryClient = useQueryClient();

  const { data: currentUser } = useQuery({
    queryKey: ['current_user'],
    queryFn: () => base44.auth.me()
  });

  // Apenas admin acessa
  if (currentUser?.role !== 'admin') {
    return (
      <div className="p-8 text-center">
        <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-red-700">Acesso Negado</h2>
        <p className="text-slate-600">Apenas administradores podem acessar esta página.</p>
      </div>
    );
  }

  const { data: securityBlocks = [] } = useQuery({
    queryKey: ['security_blocks'],
    queryFn: () => base44.entities.SecurityBlock.filter({ status: 'blocked' })
  });

  const { data: allDevices = [] } = useQuery({
    queryKey: ['all_devices'],
    queryFn: () => base44.entities.DeviceTrust.list()
  });

  const approveMutation = useMutation({
    mutationFn: (data) => base44.functions.invoke('trustDevice', {
      ...data,
      action: 'approve_block'
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['security_blocks'] });
      queryClient.invalidateQueries({ queryKey: ['all_devices'] });
      setSelectedBlock(null);
    }
  });

  const rejectMutation = useMutation({
    mutationFn: (data) => base44.functions.invoke('trustDevice', {
      ...data,
      action: 'reject_block'
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['security_blocks'] });
      setSelectedBlock(null);
    }
  });

  const removeTrustedMutation = useMutation({
    mutationFn: (data) => base44.functions.invoke('trustDevice', {
      ...data,
      action: 'remove_trusted'
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all_devices'] });
    }
  });

  const handleApprove = (block) => {
    approveMutation.mutate({
      user_email: block.user_email,
      mac_address: block.mac_address,
      device_name: block.device_name
    });
  };

  const handleReject = (block) => {
    rejectMutation.mutate({
      user_email: block.user_email,
      mac_address: block.mac_address
    });
  };

  const handleRemoveTrusted = (device) => {
    if (confirm(`Remover dispositivo confiável de ${device.user_email}?`)) {
      removeTrustedMutation.mutate({
        user_email: device.user_email,
        mac_address: device.mac_address
      });
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
          <Shield className="w-8 h-8 text-blue-600" />
          Gestão de Segurança de Dispositivos
        </h1>
        <p className="text-slate-600 mt-2">Gerencie acessos bloqueados e dispositivos confiáveis</p>
      </div>

      {/* Bloqueios Pendentes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            Acessos Bloqueados ({securityBlocks.length})
          </CardTitle>
          <CardDescription>Revise e aprove/rejeite dispositivos suspeitos</CardDescription>
        </CardHeader>
        <CardContent>
          {securityBlocks.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              Nenhum acesso bloqueado 🎉
            </div>
          ) : (
            <div className="space-y-3">
              {securityBlocks.map(block => (
                <div key={block.id} className="border border-red-100 rounded-lg p-4 bg-red-50">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="font-semibold text-slate-900">{block.user_name}</p>
                      <p className="text-sm text-slate-600">{block.user_email}</p>
                      <div className="flex gap-2 mt-2">
                        <Badge variant="outline" className="bg-red-100">{block.block_reason === 'mac_mismatch' ? 'MAC Diferente' : 'Novo Device'}</Badge>
                        <Badge variant="outline">{block.device_name}</Badge>
                      </div>
                    </div>
                    <Badge className="bg-red-500">BLOQUEADO</Badge>
                  </div>
                  
                  <div className="text-xs text-slate-600 space-y-1 mb-4">
                    <p><strong>MAC:</strong> {block.mac_address}</p>
                    <p><strong>IP:</strong> {block.ip_address}</p>
                    <p><strong>Bloqueado:</strong> {new Date(block.blocked_at).toLocaleString('pt-BR')}</p>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="bg-green-600 hover:bg-green-700"
                      onClick={() => handleApprove(block)}
                      disabled={approveMutation.isPending}
                    >
                      <Check className="w-4 h-4 mr-1" />
                      Aprovar Acesso
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleReject(block)}
                      disabled={rejectMutation.isPending}
                    >
                      <Lock className="w-4 h-4 mr-1" />
                      Manter Bloqueado
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dispositivos Confiáveis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Monitor className="w-5 h-5 text-green-600" />
            Dispositivos Confiáveis ({allDevices.filter(d => d.is_trusted).length})
          </CardTitle>
          <CardDescription>Dispositivos que têm acesso permitido</CardDescription>
        </CardHeader>
        <CardContent>
          {allDevices.filter(d => d.is_trusted).length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              Nenhum dispositivo confiável registrado
            </div>
          ) : (
            <div className="space-y-3">
              {allDevices.filter(d => d.is_trusted).map(device => (
                <div key={device.id} className="border border-green-100 rounded-lg p-4 bg-green-50">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold text-slate-900">{device.device_name}</p>
                      <p className="text-sm text-slate-600">{device.user_email}</p>
                      <div className="flex gap-2 mt-2">
                        <Badge className="bg-green-600">Confiável</Badge>
                        <Badge variant="outline" className="text-xs">MAC: {device.mac_address}</Badge>
                      </div>
                      <p className="text-xs text-slate-500 mt-2">
                        Último acesso: {device.last_access ? new Date(device.last_access).toLocaleString('pt-BR') : 'Nunca'}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleRemoveTrusted(device)}
                      disabled={removeTrustedMutation.isPending}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}