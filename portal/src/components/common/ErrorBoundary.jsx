import React from "react";
import { AlertTriangle, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createPageUrl } from "@/utils";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Error caught by boundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
          <div className="max-w-md w-full mx-auto p-8 bg-white rounded-2xl shadow-xl border border-slate-100">
            <div className="flex justify-center mb-4">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
            </div>
            <h2 className="text-xl font-bold text-center text-slate-900 mb-2">
              Algo deu errado
            </h2>
            <p className="text-center text-slate-600 text-sm mb-6">
              Desculpe, ocorreu um erro inesperado. Por favor, tente novamente ou retorne à página inicial.
            </p>
            <div className="space-y-3">
              <Button
                onClick={() => window.location.reload()}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                Recarregar Página
              </Button>
              <Button
                variant="outline"
                onClick={() => window.location.href = createPageUrl("Dashboard")}
                className="w-full"
              >
                <Home className="w-4 h-4 mr-2" />
                Ir para Dashboard
              </Button>
            </div>
            {process.env.NODE_ENV === "development" && (
              <details className="mt-4 p-3 bg-slate-50 rounded text-xs text-slate-600">
                <summary className="font-medium cursor-pointer mb-2">Detalhes do erro</summary>
                <pre className="overflow-auto">{this.state.error?.toString()}</pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;