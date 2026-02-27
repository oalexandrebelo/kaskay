import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Lock, User, AlertCircle, CheckCircle2, Mail, MessageSquare, ArrowLeft } from "lucide-react";

export default function PasswordRecovery() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [cpf, setCpf] = useState("");
  const [channel, setChannel] = useState("whatsapp");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [userId, setUserId] = useState(null);

  // Padronizar CPF removendo caracteres não numéricos
  const normalizeCPF = (value) => {
    return value.replace(/\D/g, '');
  };

  const handleRequestCode = async (e) => {
    e.preventDefault();
    setError("");

    const normalizedCPF = normalizeCPF(cpf);
    if (!normalizedCPF || normalizedCPF.length !== 11) {
      setError("Por favor, informe um CPF válido.");
      return;
    }

    setLoading(true);
    try {
      const response = await base44.functions.invoke("requestPasswordReset", {
        cpf: normalizedCPF,
        user_type: "client",
        channel: channel
      });

      if (response.data.success) {
        setSuccess(`Código enviado para o seu ${channel === 'whatsapp' ? 'WhatsApp' : 'e-mail'} cadastrado.`);
        setStep(2);
      } else {
        setError(response.data.error || "Não foi possível enviar o código.");
      }
    } catch (err) {
      setError(err.message || "Erro ao solicitar código.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!code || code.length !== 6) {
      setError("Por favor, informe o código de 6 dígitos.");
      return;
    }

    setLoading(true);
    try {
      const normalizedCPF = normalizeCPF(cpf);
      const response = await base44.functions.invoke("validateSMSCode", {
        cpf: normalizedCPF,
        code: code,
        user_type: "client"
      });

      if (response.data.success) {
        setUserId(response.data.user.id);
        setStep(3);
        setSuccess("Código validado! Defina sua nova senha.");
      } else {
        setError(response.data.error || "Código inválido ou expirado.");
      }
    } catch (err) {
      setError(err.message || "Erro ao validar código.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!password || !confirmPassword) {
      setError("Por favor, preencha todos os campos.");
      return;
    }

    if (password !== confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }

    if (password.length < 6) {
      setError("A senha deve ter no mínimo 6 caracteres.");
      return;
    }

    setLoading(true);
    try {
      const response = await base44.functions.invoke("completeFirstAccess", {
        user_id: userId,
        user_type: "client",
        password: password
      });

      if (response.data.success) {
        setSuccess("Senha redefinida com sucesso! Redirecionando...");
        setTimeout(() => {
          navigate(createPageUrl("PortalLogin"));
        }, 2000);
      } else {
        setError(response.data.error || "Erro ao redefinir senha.");
      }
    } catch (err) {
      setError(err.message || "Erro ao redefinir senha.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4">
      {/* Background decorativo */}
      <div className="absolute inset-0 bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
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
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-br from-green-400/20 to-emerald-600/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gradient-to-tr from-teal-400/20 to-green-600/20 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl overflow-hidden border border-green-100">
          <div className="h-24 bg-gradient-to-r from-green-600 to-emerald-600 relative overflow-hidden">
            <div className="absolute inset-0 opacity-20">
              <div className="absolute inset-0" style={{
                backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.2) 1px, transparent 1px)",
                backgroundSize: "20px 20px"
              }}></div>
            </div>
            <div className="absolute top-4 left-4">
              <button 
                onClick={() => navigate(createPageUrl("PortalLogin"))}
                className="text-white hover:text-green-100 flex items-center gap-1.5 text-sm font-medium transition-colors"
                aria-label="Voltar para login"
              >
                <ArrowLeft className="w-4 h-4" /> Voltar
              </button>
            </div>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center shadow-xl">
                <span className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-emerald-600">K</span>
              </div>
            </div>
          </div>

          <div className="px-6 py-8 space-y-6">
            <div className="text-center space-y-2">
              <h1 className="text-2xl font-bold text-gray-900">Recuperar Senha</h1>
              <p className="text-gray-600 text-sm">
                {step === 1 && "Informe seu CPF para receber o código"}
                {step === 2 && "Digite o código recebido"}
                {step === 3 && "Defina sua nova senha"}
              </p>
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

            {step === 1 && (
              <form onSubmit={handleRequestCode} className="space-y-4">
                <div>
                  <label htmlFor="cpf-input" className="text-sm font-medium text-gray-700 block mb-2">
                    Seu CPF
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 w-4 h-4 text-gray-400" aria-hidden="true" />
                    <Input
                      id="cpf-input"
                      type="text"
                      placeholder="Digite apenas os números"
                      value={cpf}
                      onChange={(e) => setCpf(e.target.value)}
                      className="pl-10 border-gray-300 focus:border-green-500 focus:ring-green-500"
                      disabled={loading}
                      autoComplete="username"
                      aria-label="CPF"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-3">
                    Como deseja receber o código?
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setChannel("whatsapp")}
                      className={`flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all ${
                        channel === "whatsapp"
                          ? "border-green-600 bg-green-50 text-green-700"
                          : "border-gray-200 hover:border-gray-300 text-gray-600"
                      }`}
                      aria-pressed={channel === "whatsapp"}
                    >
                      <MessageSquare className="w-5 h-5" />
                      <span className="font-medium">WhatsApp</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setChannel("email")}
                      className={`flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all ${
                        channel === "email"
                          ? "border-green-600 bg-green-50 text-green-700"
                          : "border-gray-200 hover:border-gray-300 text-gray-600"
                      }`}
                      aria-pressed={channel === "email"}
                    >
                      <Mail className="w-5 h-5" />
                      <span className="font-medium">E-mail</span>
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold py-2.5 rounded-xl transition-all duration-200"
                  disabled={loading}
                >
                  {loading ? "Enviando..." : "Receber Código"}
                </Button>
              </form>
            )}

            {step === 2 && (
              <form onSubmit={handleVerifyCode} className="space-y-4">
                <div>
                  <label htmlFor="code-input" className="text-sm font-medium text-gray-700 block mb-2">
                    Código de Verificação
                  </label>
                  <div className="relative">
                    {channel === "whatsapp" ? (
                      <MessageSquare className="absolute left-3 top-3 w-4 h-4 text-gray-400" aria-hidden="true" />
                    ) : (
                      <Mail className="absolute left-3 top-3 w-4 h-4 text-gray-400" aria-hidden="true" />
                    )}
                    <Input
                      id="code-input"
                      type="text"
                      placeholder="000000"
                      value={code}
                      onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      className="pl-10 border-gray-300 focus:border-green-500 focus:ring-green-500 text-center tracking-widest text-lg font-semibold"
                      maxLength={6}
                      disabled={loading}
                      autoComplete="one-time-code"
                      inputMode="numeric"
                      aria-label="Código de verificação de 6 dígitos"
                    />
                  </div>
                  <p className="text-xs text-gray-500 text-center mt-2">
                    Enviamos um código de 6 dígitos para o {channel === 'whatsapp' ? 'WhatsApp' : 'e-mail'} cadastrado.
                  </p>
                </div>
                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold py-2.5 rounded-xl transition-all duration-200"
                  disabled={loading}
                >
                  {loading ? "Validando..." : "Validar Código"}
                </Button>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="w-full text-sm text-gray-600 hover:text-gray-900 underline"
                >
                  Reenviar código
                </button>
              </form>
            )}

            {step === 3 && (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div>
                  <label htmlFor="new-password" className="text-sm font-medium text-gray-700 block mb-2">
                    Nova Senha
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 w-4 h-4 text-gray-400" aria-hidden="true" />
                    <Input
                      id="new-password"
                      type="password"
                      placeholder="Mínimo 6 caracteres"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 border-gray-300 focus:border-green-500 focus:ring-green-500"
                      disabled={loading}
                      autoComplete="new-password"
                      aria-label="Nova senha"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="confirm-password" className="text-sm font-medium text-gray-700 block mb-2">
                    Confirmar Nova Senha
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 w-4 h-4 text-gray-400" aria-hidden="true" />
                    <Input
                      id="confirm-password"
                      type="password"
                      placeholder="Repita a senha"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="pl-10 border-gray-300 focus:border-green-500 focus:ring-green-500"
                      disabled={loading}
                      autoComplete="new-password"
                      aria-label="Confirmar nova senha"
                    />
                  </div>
                </div>
                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold py-2.5 rounded-xl transition-all duration-200"
                  disabled={loading}
                >
                  {loading ? "Salvando..." : "Redefinir Senha"}
                </Button>
              </form>
            )}
          </div>
        </div>

        <div className="text-center mt-6 text-sm text-gray-600">
          <p>© 2026 Kaskay. Todos os direitos reservados.</p>
        </div>
      </div>
    </div>
  );
}