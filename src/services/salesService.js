import { db } from '../lib/firebase';
import {
   collection,
   addDoc,
   getDocs,
   query,
   doc,
   updateDoc,
   deleteDoc,
   setDoc,
   getDoc,
   orderBy
 } from 'firebase/firestore';

const SALES_COLLECTION = 'sales';
const SETTINGS_COLLECTION = 'monthly_settings';
const USERS_COLLECTION = 'users';

export const salesService = {
  // --- Gestión de Usuarios ---
  getUserProfile: async (uid) => {
    try {
      const docRef = doc(db, USERS_COLLECTION, uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return docSnap.data();
      }
      return null;
    } catch (error) {
      console.error("Error getting user profile:", error);
      return null;
    }
  },

  // Función para crear/actualizar perfil de usuario
  syncUserProfile: async (user) => {
    try {
      const docRef = doc(db, USERS_COLLECTION, user.uid);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        // Si el usuario es nuevo, lo creamos con rol 'user' por defecto
        await setDoc(docRef, {
          email: user.email,
          role: 'user', // Por defecto no es admin
          lastLogin: new Date().getTime()
        });
      } else {
        await updateDoc(docRef, {
          lastLogin: new Date().getTime()
        });
      }
    } catch (error) {
      console.error("Error syncing user profile:", error);
    }
  },

  // --- Ventas ---
  addSale: async (date, cash, card, invoice) => {
    try {
      const docRef = await addDoc(collection(db, SALES_COLLECTION), {
        date,
        cash: Number(cash),
        card: Number(card),
        invoice: Number(invoice),
        createdAt: new Date().getTime()
      });
      return { id: docRef.id };
    } catch (error) {
      console.error("Error adding document: ", error);
      throw error;
    }
  },

  // Obtener ventas del mes/año
  getSales: async (month, year) => {
    try {
      // Usaremos un filtro simple por fecha (string YYYY-MM-DD)
      // Buscamos todas las ventas que empiecen con YYYY-MM
      const prefix = `${year}-${String(month).padStart(2, '0')}`;
      const q = query(
        collection(db, SALES_COLLECTION),
        orderBy("date", "desc")
      );
      
      const querySnapshot = await getDocs(q);
      const allSales = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.date.startsWith(prefix)) {
          allSales.push({ id: doc.id, ...data });
        }
      });
      return allSales;
    } catch (error) {
      console.error("Error getting documents: ", error);
      return [];
    }
  },

  // Actualizar una venta
  updateSale: async (id, updatedData) => {
    try {
      const docRef = doc(db, SALES_COLLECTION, id);
      await updateDoc(docRef, {
        ...updatedData,
        updatedAt: new Date().getTime()
      });
    } catch (error) {
      console.error("Error updating document: ", error);
      throw error;
    }
  },

  // Eliminar una venta
  deleteSale: async (id) => {
    try {
      const docRef = doc(db, SALES_COLLECTION, id);
      await deleteDoc(docRef);
    } catch (error) {
      console.error("Error deleting document: ", error);
      throw error;
    }
  },

  // Manejo de IVA Recuperable y Factura Faltante Manual por mes
  getMonthlySettings: async (month, year) => {
    try {
      const docId = `settings_${year}_${month}`;
      const docRef = doc(db, SETTINGS_COLLECTION, docId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return docSnap.data();
      } else {
        return { ivaRecuperable: 0, facturaFaltante: 0 };
      }
    } catch (error) {
      console.error("Error getting settings: ", error);
      return { ivaRecuperable: 0, facturaFaltante: 0 };
    }
  },

  setMonthlySetting: async (month, year, field, amount) => {
    try {
      const docId = `settings_${year}_${month}`;
      const docRef = doc(db, SETTINGS_COLLECTION, docId);
      await setDoc(docRef, { [field]: amount }, { merge: true });
    } catch (error) {
      console.error("Error setting monthly setting: ", error);
      throw error;
    }
  },

  // Mapeadores específicos para compatibilidad con el código anterior
  getIvaRecuperable: async (month, year) => {
    const settings = await salesService.getMonthlySettings(month, year);
    return settings.ivaRecuperable || 0;
  },

  setIvaRecuperable: async (month, year, amount) => {
    await salesService.setMonthlySetting(month, year, 'ivaRecuperable', amount);
  },

  getFacturaFaltante: async (month, year) => {
    const settings = await salesService.getMonthlySettings(month, year);
    return settings.facturaFaltante || 0;
  },

  setFacturaFaltante: async (month, year, amount) => {
    await salesService.setMonthlySetting(month, year, 'facturaFaltante', amount);
  }
};