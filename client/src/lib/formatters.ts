// Utilitários para formatação e validação de CPF e CNPJ

/**
 * Formata CPF para exibição (000.000.000-00)
 */
export function formatCpf(cpf: string): string {
  if (!cpf) return '';
  
  // Remove tudo que não é dígito
  const numbers = cpf.replace(/\D/g, '');
  
  // Se não tem 11 dígitos, retorna como está
  if (numbers.length !== 11) return cpf;
  
  // Aplica a formatação
  return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

/**
 * Formata CNPJ para exibição (00.000.000/0000-00)
 */
export function formatCnpj(cnpj: string): string {
  if (!cnpj) return '';
  
  // Remove tudo que não é dígito
  const numbers = cnpj.replace(/\D/g, '');
  
  // Se não tem 14 dígitos, retorna como está
  if (numbers.length !== 14) return cnpj;
  
  // Aplica a formatação
  return numbers.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
}

/**
 * Valida CPF usando algoritmo oficial
 */
export function isValidCpf(cpf: string): boolean {
  if (!cpf) return false;
  
  // Remove tudo que não é dígito
  const numbers = cpf.replace(/\D/g, '');
  
  // Verifica se tem 11 dígitos
  if (numbers.length !== 11) return false;
  
  // Verifica se não são todos os dígitos iguais
  if (/^(\d)\1{10}$/.test(numbers)) return false;
  
  // Calcula o primeiro dígito verificador
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(numbers[i]) * (10 - i);
  }
  let remainder = sum % 11;
  let digit1 = remainder < 2 ? 0 : 11 - remainder;
  
  // Verifica o primeiro dígito
  if (parseInt(numbers[9]) !== digit1) return false;
  
  // Calcula o segundo dígito verificador
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(numbers[i]) * (11 - i);
  }
  remainder = sum % 11;
  let digit2 = remainder < 2 ? 0 : 11 - remainder;
  
  // Verifica o segundo dígito
  return parseInt(numbers[10]) === digit2;
}

/**
 * Valida CNPJ usando algoritmo oficial
 */
export function isValidCnpj(cnpj: string): boolean {
  if (!cnpj) return false;
  
  // Remove tudo que não é dígito
  const numbers = cnpj.replace(/\D/g, '');
  
  // Verifica se tem 14 dígitos
  if (numbers.length !== 14) return false;
  
  // Verifica se não são todos os dígitos iguais
  if (/^(\d)\1{13}$/.test(numbers)) return false;
  
  // Calcula o primeiro dígito verificador
  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(numbers[i]) * weights1[i];
  }
  let remainder = sum % 11;
  let digit1 = remainder < 2 ? 0 : 11 - remainder;
  
  // Verifica o primeiro dígito
  if (parseInt(numbers[12]) !== digit1) return false;
  
  // Calcula o segundo dígito verificador
  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  sum = 0;
  for (let i = 0; i < 13; i++) {
    sum += parseInt(numbers[i]) * weights2[i];
  }
  remainder = sum % 11;
  let digit2 = remainder < 2 ? 0 : 11 - remainder;
  
  // Verifica o segundo dígito
  return parseInt(numbers[13]) === digit2;
}

/**
 * Formata documento automaticamente (CPF ou CNPJ)
 */
export function formatDocument(document: string): string {
  if (!document) return '';
  
  const numbers = document.replace(/\D/g, '');
  
  if (numbers.length === 11) {
    return formatCpf(document);
  } else if (numbers.length === 14) {
    return formatCnpj(document);
  }
  
  return document;
}

/**
 * Valida documento automaticamente (CPF ou CNPJ)
 */
export function isValidDocument(document: string): boolean {
  if (!document) return false;
  
  const numbers = document.replace(/\D/g, '');
  
  if (numbers.length === 11) {
    return isValidCpf(document);
  } else if (numbers.length === 14) {
    return isValidCnpj(document);
  }
  
  return false;
}