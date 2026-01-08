export const formatCLP = (amount) => {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatNumberWithDots = (num) => {
  if (num === '' || num === undefined || num === null) return '';
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
};

export const parseNumberFromDots = (str) => {
  if (typeof str !== 'string') return Number(str) || 0;
  return Number(str.replace(/\./g, '')) || 0;
};
