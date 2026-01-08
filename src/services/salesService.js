// Temporary implementation using LocalStorage until Firebase is ready
// Data structure: { id: string, date: string (YYYY-MM-DD), cash: number, card: number, timestamp: number }

const STORAGE_KEY = 'ventas_app_data';

const generateId = () => Math.random().toString(36).substr(2, 9);

export const salesService = {
  addSale: async (date, cash, card, invoice) => {
    const sales = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    const newSale = {
      id: generateId(),
      date,
      cash: Number(cash),
      card: Number(card),
      invoice: Number(invoice),
      createdAt: Date.now(),
    };
    sales.push(newSale);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sales));
    return newSale;
  },

  getSales: async (month, year) => {
    // Month is 0-indexed in JS Date, but let's expect 1-12 or handle "YYYY-MM"
    const sales = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    return sales.filter(sale => {
      const saleDate = new Date(sale.date);
      // Handle timezone offset issues by just checking substring if string is YYYY-MM-DD
      const [y, m] = sale.date.split('-');
      return parseInt(y) === year && parseInt(m) === month;
    }).sort((a, b) => new Date(b.date) - new Date(a.date)); // Newest first
  },

  getAllSales: async () => {
      const sales = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      return sales.sort((a, b) => new Date(b.date) - new Date(a.date));
  },

  deleteSale: async (id) => {
    const sales = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    const newSales = sales.filter(s => s.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newSales));
  },
  
  updateSale: async (id, updatedData) => {
      const sales = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      const index = sales.findIndex(s => s.id === id);
      if (index !== -1) {
          sales[index] = { ...sales[index], ...updatedData };
          localStorage.setItem(STORAGE_KEY, JSON.stringify(sales));
      }
  },

  getIvaRecuperable: async (month, year) => {
    const key = `iva_rec_v2_${year}_${month}`;
    return Number(localStorage.getItem(key) || 0);
  },

  setIvaRecuperable: async (month, year, amount) => {
    const key = `iva_rec_v2_${year}_${month}`;
    localStorage.setItem(key, amount.toString());
  },

  getFacturaFaltante: async (month, year) => {
    const key = `fact_falt_${year}_${month}`;
    return Number(localStorage.getItem(key) || 0);
  },

  setFacturaFaltante: async (month, year, amount) => {
    const key = `fact_falt_${year}_${month}`;
    localStorage.setItem(key, amount.toString());
  }
};
