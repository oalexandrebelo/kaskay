import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { Lock, User, AlertCircle, CheckCircle2 } from "lucide-react";

export default function PortalLogin() {
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const userType = "client";

  // Carregar CPF salvo ao montar componente
  useEffect(() => {
    const savedCPF = localStorage.getItem("kaskay_remembered_cpf");
    if (savedCPF) {
      setIdentifier(savedCPF);
      setRememberMe(true);
    }
  }, []);

  // Padronizar CPF removendo caracteres não numéricos
  const normalizeCPF = (value) => {
    return value.replace(/\D/g, '');
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    const normalizedCPF = normalizeCPF(identifier);
    
    if (!normalizedCPF || !password) {
      setError("Por favor, preencha todos os campos");
      return;
    }

    if (normalizedCPF.length !== 11) {
      setError("CPF inválido");
      return;
    }

    setLoading(true);

    try {
      const response = await base44.functions.invoke("portalLogin", {
        user_type: "client",
        identifier: normalizedCPF,
        password,
      });

      if (response.data.success) {
        if (response.data.is_active === false) {
          setError("Sua conta está pendente de aprovação. Procure o administrador.");
          return;
        }
        if (rememberMe) {
          localStorage.setItem("kaskay_remembered_cpf", normalizedCPF);
        } else {
          localStorage.removeItem("kaskay_remembered_cpf");
        }
        setSuccess("Login realizado com sucesso!");
        sessionStorage.setItem("portalSessionToken", response.data.session_token);
        setTimeout(() => navigate(createPageUrl("Dashboard")), 1500);
      } else {
        setError(response.data.error || "Credenciais inválidas");
      }
    } catch (err) {
      setError(err.message || "Erro ao fazer login");
    } finally {
      setLoading(false);
    }
  };



  return (
    <div className="min-h-screen relative flex items-center justify-center p-4">
      {/* Background artístico inspirado em finanças e crescimento */}
      <div className="absolute inset-0 bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-30">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
                <path d="M 60 0 L 0 0 0 60" fill="none" stroke="rgba(16, 185, 129, 0.1)" strokeWidth="1"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>
        {/* Gradient blobs */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-br from-green-400/20 to-emerald-600/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gradient-to-tr from-teal-400/20 to-green-600/20 rounded-full blur-3xl"></div>
        {/* Linha de crescimento abstrata */}
        <svg className="absolute bottom-0 left-0 w-full h-48 opacity-10" viewBox="0 0 1200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M0 150 Q300 100 600 120 T1200 80" stroke="url(#lineGradient)" strokeWidth="4" fill="none"/>
          <defs>
            <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.5"/>
              <stop offset="100%" stopColor="#059669" stopOpacity="0.8"/>
            </linearGradient>
          </defs>
        </svg>
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Card Principal */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl overflow-hidden border border-green-100">
          {/* Header com gradiente verde e pattern */}
          <div className="h-24 bg-gradient-to-r from-green-600 to-emerald-600 relative overflow-hidden">
            <div className="absolute inset-0 opacity-20">
              <div className="absolute inset-0" style={{
                backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.2) 1px, transparent 1px)",
                backgroundSize: "20px 20px"
              }}></div>
            </div>
            
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center shadow-xl">
                <span className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-emerald-600">K</span>
              </div>
            </div>
          </div>

          {/* Conteúdo */}
          <div className="px-6 py-8 space-y-6">
            <div className="text-center space-y-2">
              <h1 className="text-3xl font-bold text-gray-900">Kaskay</h1>
              <p className="text-gray-600 text-sm">Portal Colaborador</p>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="w-4 h-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="bg-green-50 border-green-200">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <AlertDescription className="text-green-800">{success}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label htmlFor="cpf-input" className="text-sm font-medium text-gray-700 block mb-2">
                    CPF
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 w-4 h-4 text-gray-400" aria-hidden="true" />
                    <Input
                      id="cpf-input"
                      type="text"
                      placeholder="Digite apenas os números"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      className="pl-10 border-gray-300 focus:border-green-500 focus:ring-green-500"
                      disabled={loading}
                      autoComplete="username"
                      aria-label="CPF"
                      aria-describedby="cpf-hint"
                    />
                  </div>
                  <p id="cpf-hint" className="text-xs text-gray-500 mt-1">Digite com ou sem pontos e traços</p>
                </div>

                <div>
                  <label htmlFor="password-input" className="text-sm font-medium text-gray-700 block mb-2">
                    Senha
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 w-4 h-4 text-gray-400" aria-hidden="true" />
                    <Input
                      id="password-input"
                      type="password"
                      placeholder="Sua senha"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 border-gray-300 focus:border-green-500 focus:ring-green-500"
                      disabled={loading}
                      autoComplete="current-password"
                      aria-label="Senha"
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="remember-me" 
                    checked={rememberMe}
                    onCheckedChange={setRememberMe}
                    aria-label="Lembrar meu CPF"
                  />
                  <label 
                    htmlFor="remember-me" 
                    className="text-sm text-gray-600 cursor-pointer select-none"
                  >
                    Lembrar meu CPF
                  </label>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold py-2.5 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl"
                  disabled={loading}
                >
                  {loading ? "Conectando..." : "Acessar Portal"}
                </Button>
              </form>

            <div className="pt-4 border-t border-gray-200 space-y-3 text-center text-sm">
              <p className="text-gray-600">
                Primeiro acesso?{' '}
                <button
                  type="button"
                  onClick={() => navigate(createPageUrl("PortalFirstAccess"))}
                  className="text-green-600 font-semibold hover:text-green-700 hover:underline transition-all"
                  aria-label="Ir para primeiro acesso"
                >
                  Cadastre-se
                </button>
              </p>
              <p className="text-gray-600">
                Esqueceu sua senha?{' '}
                <button
                  type="button"
                  onClick={() => navigate(createPageUrl("PasswordRecovery"))}
                  className="text-green-600 font-semibold hover:text-green-700 hover:underline transition-all"
                  aria-label="Recuperar senha"
                >
                  Recuperar aqui
                </button>
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6 text-sm text-gray-600">
          <p>© 2026 Kaskay. Todos os direitos reservados.</p>
        </div>
      </div>
    </div>
  );
}