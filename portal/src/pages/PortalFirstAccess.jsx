import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Lock, User, AlertCircle, CheckCircle2, Phone, ArrowLeft } from "lucide-react";

export default function PortalFirstAccess() {
  const navigate = useNavigate();
  const [cpf, setCpf] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const normalizeCPF = (value) => {
    return value.replace(/\D/g, '');
  };

  const normalizePhone = (value) => {
    return value.replace(/\D/g, '');
  };

  const handleCreateAccount = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const normalizedCPF = normalizeCPF(cpf);
    const normalizedPhone = normalizePhone(phone);

    if (!normalizedCPF || !normalizedPhone || !password || !confirmPassword) {
      setError("Por favor, preencha todos os campos.");
      return;
    }

    if (normalizedCPF.length !== 11) {
      setError("CPF inválido.");
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
      const response = await base44.functions.invoke("createClientUser", {
        cpf: normalizedCPF,
        phone: normalizedPhone,
        password: password
      });

      if (response.data.success) {
        setSuccess("Cadastro realizado! Aguarde aprovação do administrador para acessar.");
        setTimeout(() => {
          navigate(createPageUrl("PortalLogin"));
        }, 2500);
      } else {
        setError(response.data.error || "Erro ao criar conta.");
      }
    } catch (err) {
      setError(err.message || "Erro ao finalizar cadastro. Procure o RH.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 flex items-center justify-center p-4">
      {/* Decoração de fundo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-green-100 rounded-full blur-3xl opacity-30"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-emerald-100 rounded-full blur-3xl opacity-30"></div>
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div className="h-24 bg-gradient-to-r from-green-600 to-emerald-600 relative overflow-hidden">
            <div className="absolute inset-0 opacity-10" style={{
              backgroundImage: "linear-gradient(45deg, rgba(255,255,255,.1) 25%, transparent 25%, transparent 50%, rgba(255,255,255,.1) 50%, rgba(255,255,255,.1) 75%, transparent 75%, transparent)",
              backgroundSize: "40px 40px"
            }}></div>
            <div className="absolute top-4 left-4">
              <button 
                onClick={() => navigate(createPageUrl("PortalLogin"))}
                className="text-white hover:text-green-100 flex items-center gap-1 text-sm font-medium transition-colors"
              >
                <ArrowLeft className="w-4 h-4" /> Voltar
              </button>
            </div>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-lg">
                <span className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-emerald-600">K</span>
              </div>
            </div>
          </div>

          <div className="px-6 py-8 space-y-6">
            <div className="text-center space-y-2">
              <h1 className="text-2xl font-bold text-gray-900">Primeiro Acesso</h1>
              <p className="text-gray-600 text-sm">Cadastre sua senha para acessar o portal</p>
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

            <form onSubmit={handleCreateAccount} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-2">CPF</label>
                <div className="relative">
                  <User className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Digite apenas os números"
                    value={cpf}
                    onChange={(e) => setCpf(e.target.value)}
                    className="pl-10 border-gray-300 focus:border-green-500 focus:ring-green-500"
                    disabled={loading}
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 block mb-2">Telefone</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="(11) 9999-9999"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="pl-10 border-gray-300 focus:border-green-500 focus:ring-green-500"
                    disabled={loading}
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 block mb-2">Senha</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <Input
                    type="password"
                    placeholder="Mínimo 6 caracteres"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 border-gray-300 focus:border-green-500 focus:ring-green-500"
                    disabled={loading}
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 block mb-2">Confirmar Senha</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <Input
                    type="password"
                    placeholder="Repita a senha"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-10 border-gray-300 focus:border-green-500 focus:ring-green-500"
                    disabled={loading}
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold py-2.5 rounded-xl transition-all duration-200"
                disabled={loading}
              >
                {loading ? "Criando conta..." : "Criar Conta"}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}