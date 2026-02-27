/**
 * Formatadores para padrão brasileiro (vírgula decimal, ponto de milhar)
 */

// Formata número para moeda brasileira (R$ 1.234.567,89)
export function formatCurrency(value, showSymbol = true) {
  if (!value && value !== 0) return '';
  const num = parseFloat(value);
  if (isNaN(num)) return '';
  
  const formatted = num.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  
  return showSymbol ? `R$ ${formatted}` : formatted;
}

// Formata número com 2 casas decimais (1.234.567,89)
export function formatNumber(value, decimals = 2) {
  if (!value && value !== 0) return '';
  const num = parseFloat(value);
  if (isNaN(num)) return '';
  
  return num.toLocaleString('pt-BR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

// Formata percentual (12,50%)
export function formatPercentage(value, decimals = 2) {
  if (!value && value !== 0) return '';
  const num = parseFloat(value);
  if (isNaN(num)) return '';
  
  return `${num.toLocaleString('pt-BR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}%`;
}

// Converte entrada do usuário (1.234,50) para número (1234.50)
export function parseNumber(value) {
  if (!value) return 0;
  
  // Remove espaços
  let cleaned = value.toString().trim();
  
  // Substitui ponto de milhar por vazio
  cleaned = cleaned.replace(/\./g, '');
  
  // Substitui vírgula decimal por ponto
  cleaned = cleaned.replace(',', '.');
  
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

// Valida se é um número válido (brasileiro)
export function isValidBRNumber(value) {
  if (!value) return false;
  const num = parseNumber(value);
  return !isNaN(num) && num >= 0;
}

// Formata entrada para display (com separadores)
export function formatInputDisplay(value, type = 'currency') {
  if (!value) return '';
  
  const num = parseNumber(value);
  
  switch (type) {
    case 'currency':
      return formatCurrency(num, false);
    case 'percentage':
      return formatPercentage(num);
    case 'number':
      return formatNumber(num, 0);
    default:
      return formatNumber(num, 2);
  }
}

// Mascara de input para tipo (remove caracteres inválidos, mantém separadores)
export function maskInput(value, type = 'currency') {
  if (!value) return '';
  
  // Remove caracteres que não são números, pontos ou vírgulas
  let cleaned = value.replace(/[^\d.,]/g, '');
  
  // Limita a uma vírgula
  const parts = cleaned.split(',');
  if (parts.length > 2) {
    cleaned = parts[0] + ',' + parts.slice(1).join('');
  }
  
  // Limita a uma vírgula e casas decimais
  if (cleaned.includes(',')) {
    const [integer, decimal] = cleaned.split(',');
    return integer + ',' + decimal.slice(0, 2);
  }
  
  return cleaned;
}