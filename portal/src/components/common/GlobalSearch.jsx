import React, { useState, useEffect } from "react";
import { Search, X, FileText, Users, Building2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { cn } from "@/lib/utils";
import { useDebounce } from "./useDebounce";
import { motion, AnimatePresence } from "framer-motion";

export default function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 300);
  const navigate = useNavigate();

  // Fetch com debounce
  const { data: proposals = [] } = useQuery({
    queryKey: ["search_proposals", debouncedQuery],
    queryFn: () => base44.entities.Proposal.list(),
    enabled: debouncedQuery.length > 0,
    staleTime: 60000,
  });

  const { data: clients = [] } = useQuery({
    queryKey: ["search_clients", debouncedQuery],
    queryFn: () => base44.entities.Client.list(),
    enabled: debouncedQuery.length > 0,
    staleTime: 60000,
  });

  const { data: convenios = [] } = useQuery({
    queryKey: ["search_convenios", debouncedQuery],
    queryFn: () => base44.entities.ConvenioConfig.list(),
    enabled: debouncedQuery.length > 0,
    staleTime: 60000,
  });

  // Listen para Cmd/Ctrl + K e Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen(!open);
      }
      if (e.key === "Escape" && open) {
        e.preventDefault();
        setOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  // Filtra resultados (com debouncedQuery)
  const searchResults = [
    ...proposals
      .filter(p => 
        p.proposal_number?.toLowerCase().includes(debouncedQuery.toLowerCase()) ||
        p.client_name?.toLowerCase().includes(debouncedQuery.toLowerCase())
      )
      .slice(0, 5)
      .map(p => ({
        type: "proposal",
        title: `${p.proposal_number} - ${p.client_name}`,
        description: `Status: ${p.status}`,
        icon: FileText,
        action: () => navigate(createPageUrl("ProposalDetail") + `?id=${p.id}`),
      })),
    ...clients
      .filter(c => 
        c.full_name?.toLowerCase().includes(debouncedQuery.toLowerCase()) ||
        c.cpf?.includes(debouncedQuery)
      )
      .slice(0, 5)
      .map(c => ({
        type: "client",
        title: c.full_name,
        description: `CPF: ${c.cpf}`,
        icon: Users,
        action: () => navigate(createPageUrl("ClientDetail") + `?id=${c.id}`),
      })),
    ...convenios
      .filter(c => 
        c.convenio_name?.toLowerCase().includes(debouncedQuery.toLowerCase())
      )
      .slice(0, 5)
      .map(c => ({
        type: "convenio",
        title: c.convenio_name,
        description: c.employer_type,
        icon: Building2,
        action: () => navigate(createPageUrl("ConvenioSettings") + `?id=${c.id}`),
      })),
  ];

  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={() => setOpen(true)}
        className="hidden md:flex items-center gap-3 px-4 py-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors w-72 text-sm"
      >
        <Search className="w-5 h-5 shrink-0" />
        <span className="text-slate-600">Buscar propostas, clientes...</span>
        <kbd className="ml-auto text-xs text-slate-400 bg-white/50 px-2 py-1 rounded border border-slate-200">⌘K</kbd>
      </button>

      {/* Modal com Animação */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-50 bg-black/40 cursor-pointer"
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="fixed inset-0 z-50 flex items-start justify-center pt-24 pointer-events-none"
              onClick={() => setOpen(false)}
            >
              <div 
                className="pointer-events-auto bg-white rounded-xl shadow-2xl w-full max-w-3xl mx-4"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Input */}
                <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-200 bg-slate-50">
                  <Search className="w-5 h-5 text-slate-400 shrink-0" />
                  <input
                    autoFocus
                    type="text"
                    placeholder="Buscar propostas, clientes, convênios..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="flex-1 outline-none text-base bg-transparent text-slate-900 placeholder-slate-500"
                  />
                  <button 
                    onClick={() => setOpen(false)} 
                    className="p-2 hover:bg-slate-200 rounded-lg transition-colors group"
                    title="Fechar (ESC)"
                  >
                    <X className="w-5 h-5 text-slate-400 group-hover:text-slate-600" />
                  </button>
                </div>

                {/* Results */}
                <div className="max-h-[400px] overflow-y-auto">
                  {query.length === 0 ? (
                    <div className="p-12 text-center">
                      <Search className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                      <p className="text-slate-500 mb-4">Comece a digitar para buscar...</p>
                      <p className="text-xs text-slate-400">Pressione <kbd className="bg-slate-100 px-2 py-1 rounded border border-slate-200 text-slate-600">ESC</kbd> para fechar</p>
                    </div>
                  ) : searchResults.length === 0 ? (
                    <div className="p-12 text-center">
                      <p className="text-slate-500">Nenhum resultado encontrado para "{query}"</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {searchResults.map((result, idx) => {
                        const Icon = result.icon;
                        return (
                          <motion.button
                            key={idx}
                            whileHover={{ backgroundColor: "rgb(248, 250, 252)" }}
                            onClick={() => {
                              result.action();
                              setOpen(false);
                              setQuery("");
                            }}
                            className="w-full text-left px-6 py-4 transition-colors flex items-start gap-4"
                          >
                            <Icon className="w-5 h-5 text-slate-400 mt-0.5 shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-slate-900">{result.title}</p>
                              <p className="text-xs text-slate-500 mt-1">{result.description}</p>
                            </div>
                          </motion.button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}