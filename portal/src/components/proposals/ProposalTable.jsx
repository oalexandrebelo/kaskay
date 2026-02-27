import React from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import StatusBadge from "@/components/common/StatusBadge";
import { MessageSquare, Globe, MapPin, FileText, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

const channelIcons = {
  whatsapp: <MessageSquare className="w-3.5 h-3.5 text-green-600" />,
  web: <Globe className="w-3.5 h-3.5 text-blue-500" />,
  presencial: <MapPin className="w-3.5 h-3.5 text-slate-500" />,
};

const ProposalRow = React.memo(({ proposal }) => (
  <TableRow className="hover:bg-slate-50/50 transition-colors group">
    <TableCell>
      <Link to={createPageUrl("ProposalDetail") + `?id=${proposal.id}`} className="text-sm font-mono font-semibold text-blue-600 hover:text-blue-700">
        {proposal.proposal_number || `#${proposal.id?.slice(-6)}`}
      </Link>
    </TableCell>
    <TableCell>
      <div>
        <p className="text-sm font-medium text-slate-900">{proposal.client_name || "—"}</p>
        <p className="text-xs text-slate-400">{proposal.client_cpf || ""}</p>
      </div>
    </TableCell>
    <TableCell className="text-sm font-semibold text-slate-700">
      R$ {(proposal.requested_amount || 0).toLocaleString("pt-BR")}
    </TableCell>
    <TableCell><StatusBadge status={proposal.status} /></TableCell>
    <TableCell>
      <div className="flex items-center gap-1.5">
        {channelIcons[proposal.channel]}
        <span className="text-xs text-slate-500 capitalize">{proposal.channel || "—"}</span>
      </div>
    </TableCell>
    <TableCell>
      {proposal.ccb_url ? (
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-mono">{proposal.ccb_number}</span>
          <a
            href={proposal.ccb_url}
            target="_blank"
            rel="noopener noreferrer"
            className="opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Button size="sm" variant="ghost" className="h-7 px-2">
              <FileText className="w-3.5 h-3.5 mr-1" />
              Ver CCB
              <ExternalLink className="w-3 h-3 ml-1" />
            </Button>
          </a>
        </div>
      ) : (
        <span className="text-xs text-slate-400">—</span>
      )}
    </TableCell>
    <TableCell className="text-xs text-slate-400">
      {proposal.created_date ? format(new Date(proposal.created_date), "dd/MM/yy HH:mm") : "—"}
    </TableCell>
  </TableRow>
));

ProposalRow.displayName = "ProposalRow";

export default function ProposalTable({ proposals = [] }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-slate-50/50">
            <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Nº Proposta</TableHead>
            <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Cliente</TableHead>
            <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Valor</TableHead>
            <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</TableHead>
            <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Canal</TableHead>
            <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider">CCB</TableHead>
            <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Data</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {proposals.length === 0 && (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-12 text-slate-400">
                Nenhuma proposta encontrada
              </TableCell>
            </TableRow>
          )}
          {proposals.map(p => (
            <ProposalRow key={p.id} proposal={p} />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}