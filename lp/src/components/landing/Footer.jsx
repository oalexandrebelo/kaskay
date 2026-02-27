import React from "react";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-slate-950 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16">
        <div className="grid md:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
                <span className="text-white font-black text-lg">K</span>
              </div>
              <span className="text-2xl font-bold text-white tracking-tight">Kaskay</span>
            </div>
            <p className="text-slate-400 leading-relaxed max-w-md">
              Plataforma de adiantamento salarial para servidores públicos. Rápido, seguro e transparente.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-white font-semibold mb-4">Navegação</h4>
            <ul className="space-y-3">
              {[
                { label: "Benefícios", href: "#beneficios" },
                { label: "Como funciona", href: "#como-funciona" },
                { label: "Para órgãos", href: "#para-orgaos" },
                { label: "FAQ", href: "#faq" },
                { label: "Contato", href: "#contato" },
              ].map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="text-slate-400 hover:text-emerald-400 transition-colors text-sm"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-white font-semibold mb-4">Legal</h4>
            <ul className="space-y-3">
              {[
                "Termos de uso",
                "Política de privacidade",
                "LGPD",
              ].map((item) => (
                <li key={item}>
                  <a href="#" className="text-slate-400 hover:text-emerald-400 transition-colors text-sm">
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-16 pt-8 border-t border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-slate-500 text-sm">
            © {currentYear} Kaskay. Todos os direitos reservados.
          </p>
          <p className="text-slate-600 text-xs">
            A Kaskay atua como correspondente bancário nos termos da Resolução CMN nº 3.954/2011. Não somos uma instituição financeira e não realizamos operações de crédito diretamente.
          </p>
        </div>
      </div>
    </footer>
  );
}