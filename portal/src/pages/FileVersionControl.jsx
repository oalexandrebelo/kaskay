import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Clock, Download, RotateCcw, Trash2, Tag } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function FileVersionControl() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [fileTypeFilter, setFileTypeFilter] = useState("all");
  const queryClient = useQueryClient();

  // Buscar todos os snapshots
  const { data: snapshots = [], isLoading } = useQuery({
    queryKey: ["file_snapshots", searchTerm, fileTypeFilter],
    queryFn: async () => {
      let query = {};

      if (fileTypeFilter !== "all") {
        query.file_type = fileTypeFilter;
      }

      const result = await base44.entities.FileSnapshot.list();

      if (searchTerm) {
        return result.filter(
          s =>
            s.file_path.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.file_name.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }

      return result;
    }
  });

  // Agrupar snapshots por arquivo
  const groupedSnapshots = snapshots.reduce((acc, snapshot) => {
    const key = snapshot.file_path;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(snapshot);
    return acc;
  }, {});

  // Restaurar snapshot
  const restoreMutation = useMutation({
    mutationFn: async (snapshot_id) => {
      const { data } = await base44.functions.invoke('restoreFileSnapshot', { snapshot_id });
      return data;
    },
    onSuccess: (data) => {
      alert(data.message);
      queryClient.invalidateQueries({ queryKey: ["file_snapshots"] });
    },
    onError: (error) => {
      alert(`Erro ao restaurar: ${error.message}`);
    }
  });

  // Deletar snapshot
  const deleteMutation = useMutation({
    mutationFn: async (snapshot_id) => {
      await base44.entities.FileSnapshot.delete(snapshot_id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["file_snapshots"] });
    }
  });

  // Baixar conteúdo
  const downloadSnapshot = (snapshot) => {
    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(snapshot.content));
    element.setAttribute('download', `${snapshot.file_name}.backup`);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Controle de Versões</h1>
        <p className="text-slate-600 mt-2">Gerenciar snapshots e restaurar versões anteriores dos arquivos</p>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-2">Buscar arquivo</label>
              <Input
                placeholder="Buscar por nome ou caminho..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 block mb-2">Tipo de arquivo</label>
              <select
                value={fileTypeFilter}
                onChange={(e) => setFileTypeFilter(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              >
                <option value="all">Todos</option>
                <option value="page">Páginas</option>
                <option value="component">Componentes</option>
                <option value="function">Funções</option>
                <option value="entity">Entidades</option>
                <option value="layout">Layout</option>
              </select>
            </div>

            <div className="flex items-end">
              <div className="text-sm text-slate-600">
                {snapshots.length} versão{snapshots.length !== 1 ? "s" : ""} encontrada{snapshots.length !== 1 ? "s" : ""}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Snapshots */}
      {isLoading ? (
        <div className="text-center py-8 text-slate-500">Carregando versões...</div>
      ) : Object.keys(groupedSnapshots).length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-slate-500">
            Nenhum snapshot encontrado
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {Object.entries(groupedSnapshots).map(([filePath, versions]) => (
            <Card key={filePath}>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <span className="text-slate-600">{versions[0].file_name}</span>
                  <span className="text-xs font-normal text-slate-400">{filePath}</span>
                  <span className="ml-auto text-xs bg-slate-100 px-2 py-1 rounded text-slate-700">
                    {versions.length} versão{versions.length !== 1 ? "s" : ""}
                  </span>
                </CardTitle>
              </CardHeader>

              <CardContent>
                <div className="space-y-2">
                  {versions
                    .sort((a, b) => new Date(b.created_date) - new Date(a.created_date))
                    .map((snapshot, idx) => (
                    <div
                      key={snapshot.id}
                      className="p-4 bg-slate-50 rounded-lg border border-slate-200 hover:border-blue-300 transition"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Clock className="w-4 h-4 text-slate-400" />
                            <span className="font-medium text-slate-900">
                              {format(new Date(snapshot.created_date), "dd MMM yyyy HH:mm", { locale: ptBR })}
                            </span>
                            {snapshot.is_restored && (
                              <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                                Restaurado
                              </span>
                            )}
                          </div>

                          <p className="text-sm text-slate-700 mb-2">
                            {snapshot.change_description}
                          </p>

                          <div className="flex items-center gap-2 text-xs text-slate-500">
                            <span>Por: {snapshot.created_by}</span>
                            {snapshot.is_manual && (
                              <span className="text-yellow-600">● Manual</span>
                            )}
                          </div>

                          {snapshot.tags && snapshot.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {snapshot.tags.map((tag, i) => (
                                <span key={i} className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded flex items-center gap-1">
                                  <Tag className="w-3 h-3" />
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="flex gap-2 ml-4">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => downloadSnapshot(snapshot)}
                            title="Baixar conteúdo"
                          >
                            <Download className="w-4 h-4" />
                          </Button>

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => restoreMutation.mutate(snapshot.id)}
                            disabled={restoreMutation.isPending || snapshot.is_restored}
                            title="Restaurar esta versão"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </Button>

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              if (confirm("Tem certeza que deseja deletar este snapshot?")) {
                                deleteMutation.mutate(snapshot.id);
                              }
                            }}
                            disabled={deleteMutation.isPending}
                            className="text-red-600 hover:text-red-700"
                            title="Deletar snapshot"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}