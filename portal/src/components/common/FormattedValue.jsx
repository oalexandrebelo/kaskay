import React from "react";
import { formatCurrency, formatNumber, formatPercentage } from "./formatters";

/**
 * Componente para exibir valores formatados em padrão brasileiro
 */
export function FormattedCurrency({ value, showSymbol = true }) {
  return <span>{formatCurrency(value, showSymbol)}</span>;
}

export function FormattedNumber({ value, decimals = 2 }) {
  return <span>{formatNumber(value, decimals)}</span>;
}

export function FormattedPercentage({ value, decimals = 2 }) {
  return <span>{formatPercentage(value, decimals)}</span>;
}

// Componente genérico
export default function FormattedValue({ value, type = 'currency', ...props }) {
  switch (type) {
    case 'currency':
      return <FormattedCurrency value={value} {...props} />;
    case 'percentage':
      return <FormattedPercentage value={value} {...props} />;
    case 'number':
      return <FormattedNumber value={value} {...props} />;
    default:
      return <span>{value}</span>;
  }
}