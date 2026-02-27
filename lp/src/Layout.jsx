import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Menu, X, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

const navLinks = [
  { label: "Benefícios", href: "#beneficios" },
  { label: "Como funciona", href: "#como-funciona" },
  { label: "Para órgãos", href: "#para-orgaos" },
  { label: "FAQ", href: "#faq" },
  { label: "Contato", href: "#contato" },
];

const PORTAL_URL = import.meta.env.VITE_PORTAL_URL || '#';
const WHATSAPP_URL = import.meta.env.VITE_WHATSAPP_URL || '#';

export default function Layout({ children }) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleNavClick = (href) => {
    setMobileOpen(false);
    if (href.startsWith("#")) {
      const el = document.getElementById(href.slice(1));
      if (el) el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="min-h-screen">
      {/* Navbar */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-white/90 backdrop-blur-xl shadow-sm border-b border-slate-100"
            : "bg-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <Link to={createPageUrl("Home")} className="flex items-center gap-2 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:shadow-emerald-500/40 transition-shadow">
                <span className="text-white font-black text-lg">K</span>
              </div>
              <span className={`text-2xl font-bold tracking-tight transition-colors ${scrolled ? "text-slate-900" : "text-white"}`}>
                Kaskay
              </span>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden lg:flex items-center gap-1">
              {navLinks.map((link) => (
                <button
                  key={link.href}
                  onClick={() => handleNavClick(link.href)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    scrolled
                      ? "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                      : "text-slate-300 hover:text-white hover:bg-white/10"
                  }`}
                >
                  {link.label}
                </button>
              ))}
            </nav>

            {/* Desktop CTA */}
            <div className="hidden lg:flex items-center gap-3">
              <a
                href={PORTAL_URL}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button
                  variant={scrolled ? "outline" : "ghost"}
                  className={`font-medium rounded-xl ${
                    scrolled
                      ? "border-slate-200 text-slate-700 hover:bg-slate-50"
                      : "text-white border-white/20 hover:bg-white/10"
                  }`}
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Portal do Colaborador
                </Button>
              </a>
              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button
                  className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold rounded-xl shadow-lg shadow-emerald-500/25"
                >
                  Quero contratar
                </Button>
              </a>
            </div>

            {/* Mobile Menu Button */}
            <button
              className="lg:hidden p-2 rounded-xl"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? (
                <X className={`w-6 h-6 ${scrolled ? "text-slate-900" : "text-white"}`} />
              ) : (
                <Menu className={`w-6 h-6 ${scrolled ? "text-slate-900" : "text-white"}`} />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="lg:hidden bg-white border-b border-slate-100 overflow-hidden"
            >
              <div className="px-6 py-6 space-y-1">
                {navLinks.map((link) => (
                  <button
                    key={link.href}
                    onClick={() => handleNavClick(link.href)}
                    className="block w-full text-left px-4 py-3 rounded-xl text-slate-700 hover:bg-slate-50 font-medium transition-colors"
                  >
                    {link.label}
                  </button>
                ))}
                <hr className="my-4 border-slate-100" />
                <a
                  href={PORTAL_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-3 rounded-xl text-emerald-700 bg-emerald-50 font-semibold"
                  onClick={() => setMobileOpen(false)}
                >
                  <ExternalLink className="w-4 h-4" />
                  Portal do Colaborador
                </a>
                <a
                  href={WHATSAPP_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                >
                  <Button
                    className="w-full mt-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold rounded-xl py-6"
                  >
                    Quero contratar
                  </Button>
                </a>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Page Content */}
      <main>{children}</main>
    </div>
  );
}