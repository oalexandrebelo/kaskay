import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";

const SESSION_DURATION = 30 * 60 * 1000; // 30 minutos

export function useSessionTimeout() {
  const navigate = useNavigate();

  // Registra o login
  const recordLogin = () => {
    localStorage.setItem("lastLoginTime", Date.now().toString());
  };

  // Verifica expiração da sessão
  const checkSessionExpiry = async () => {
    const lastLoginTime = localStorage.getItem("lastLoginTime");
    
    if (!lastLoginTime) return false;

    const now = Date.now();
    const elapsed = now - parseInt(lastLoginTime);

    if (elapsed > SESSION_DURATION) {
      localStorage.removeItem("lastLoginTime");
      await base44.auth.logout();
      navigate("/Home");
      return true;
    }

    return false;
  };

  // Hook que verifica periodicamente
  useEffect(() => {
    const interval = setInterval(checkSessionExpiry, 60000); // Verifica a cada 1 minuto
    return () => clearInterval(interval);
  }, [navigate]);

  return { recordLogin, checkSessionExpiry };
}