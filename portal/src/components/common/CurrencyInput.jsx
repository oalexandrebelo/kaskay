import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { formatCurrency, formatNumber, formatPercentage, maskInput, parseNumber } from "./formatters";

/**
 * Input inteligente para valores numéricos brasileiros
 * Aceita: 1234, 1.234, 1.234,50 ou 1234,50
 * Converte automaticamente para o formato correto
 */
const CurrencyInput = React.forwardRef(({
  value,
  onChange,
  type = 'currency', // 'currency', 'percentage', 'number'
  label,
  hint,
  error,
  showSymbol = true,
  disabled = false,
  min = 0,
  max,
  decimals = 2,
  className,
  ...props
}, ref) => {
  const [displayValue, setDisplayValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  // Atualiza display quando value externo muda
  useEffect(() => {
    if (value || value === 0) {
      const num = parseNumber(value.toString());
      if (!isFocused) {
        setDisplayValue(formatForDisplay(num));
      }
    } else {
      setDisplayValue('');
    }
  }, [value, isFocused]);

  // Formata de acordo com o tipo
  const formatForDisplay = (num) => {
    if (type === 'currency') {
      return formatCurrency(num, false);
    } else if (type === 'percentage') {
      return formatPercentage(num, decimals);
    } else {
      return formatNumber(num, decimals);
    }
  };

  const handleChange = (e) => {
    let input = e.target.value;
    
    // Aplica máscara
    const masked = maskInput(input, type);
    setDisplayValue(masked);
    
    // Converte para número para callback
    const numValue = parseNumber(masked);
    
    // Validação
    if (min !== undefined && numValue < min) {
      return;
    }
    if (max !== undefined && numValue > max) {
      return;
    }
    
    onChange(numValue);
  };

  const handleBlur = () => {
    setIsFocused(false);
    // Formata quando sai do foco
    if (displayValue) {
      const num = parseNumber(displayValue);
      setDisplayValue(formatForDisplay(num));
    }
  };

  const handleFocus = () => {
    setIsFocused(true);
  };

  return (
    <div className="w-full space-y-2">
      {label && (
        <label className="text-sm font-medium text-slate-700">
          {label}
        </label>
      )}
      
      <div className="relative">
        {type === 'currency' && showSymbol && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm pointer-events-none">
            R$
          </span>
        )}
        
        <input
          ref={ref}
          type="text"
          inputMode="decimal"
          value={displayValue}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          disabled={disabled}
          placeholder={type === 'currency' ? '0,00' : type === 'percentage' ? '0,00%' : '0'}
          className={cn(
            "w-full px-3 py-2 rounded-lg border transition-colors",
            "bg-white text-sm font-medium",
            "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
            type === 'currency' && showSymbol && "pl-8",
            error ? "border-red-300 focus:ring-red-500" : "border-slate-200",
            disabled && "bg-slate-50 text-slate-400 cursor-not-allowed",
            className
          )}
          {...props}
        />
      </div>
      
      {hint && (
        <p className="text-xs text-slate-500">
          💡 {hint}
        </p>
      )}
      
      {error && (
        <p className="text-xs text-red-600">
          ❌ {error}
        </p>
      )}
    </div>
  );
});

CurrencyInput.displayName = "CurrencyInput";

export default CurrencyInput;