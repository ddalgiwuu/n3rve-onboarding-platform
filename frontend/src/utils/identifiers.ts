// Utility functions for generating and validating identifiers (UPC/EAN)

// Generate a random UPC (12 digits)
export function generateUPC(): string {
  const digits = Array.from({ length: 11 }, () => Math.floor(Math.random() * 10));
  const checkDigit = calculateUPCCheckDigit(digits.join(''));
  return digits.join('') + checkDigit;
}

// Generate a random EAN (13 digits)
export function generateEAN(): string {
  const digits = Array.from({ length: 12 }, () => Math.floor(Math.random() * 10));
  const checkDigit = calculateEANCheckDigit(digits.join(''));
  return digits.join('') + checkDigit;
}

// Calculate UPC check digit
function calculateUPCCheckDigit(digits: string): string {
  let sum = 0;
  for (let i = 0; i < 11; i++) {
    sum += parseInt(digits[i]) * (i % 2 === 0 ? 3 : 1);
  }
  const checkDigit = (10 - (sum % 10)) % 10;
  return checkDigit.toString();
}

// Calculate EAN check digit
function calculateEANCheckDigit(digits: string): string {
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(digits[i]) * (i % 2 === 0 ? 1 : 3);
  }
  const checkDigit = (10 - (sum % 10)) % 10;
  return checkDigit.toString();
}

// Validate UPC
export function validateUPC(upc: string): boolean {
  if (!/^\d{12}$/.test(upc)) return false;
  
  const checkDigit = calculateUPCCheckDigit(upc.slice(0, 11));
  return checkDigit === upc[11];
}

// Validate EAN
export function validateEAN(ean: string): boolean {
  if (!/^\d{13}$/.test(ean)) return false;
  
  const checkDigit = calculateEANCheckDigit(ean.slice(0, 12));
  return checkDigit === ean[12];
}

// Format identifier for display
export function formatIdentifier(identifier: string, type: 'upc' | 'ean'): string {
  if (type === 'upc' && identifier.length === 12) {
    return `${identifier.slice(0, 1)} ${identifier.slice(1, 6)} ${identifier.slice(6, 11)} ${identifier.slice(11)}`;
  } else if (type === 'ean' && identifier.length === 13) {
    return `${identifier.slice(0, 3)} ${identifier.slice(3, 7)} ${identifier.slice(7, 12)} ${identifier.slice(12)}`;
  }
  return identifier;
}