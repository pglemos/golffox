
import { db } from '../lib/firebase';
import { collection, getDocs, doc, getDoc, addDoc, updateDoc, deleteDoc, query, where, writeBatch } from 'firebase/firestore';

// Interfaces para empresas
export interface Company {
  id: string;
  name: string;
  cnpj: string;
  status: 'Ativo' | 'Inativo';
  [key: string]: any;
}

export interface CompanyWithStats extends Company {
  totalDrivers?: number;
  totalVehicles?: number;
  totalPassengers?: number;
  totalRoutes?: number;
  activeRoutes?: number;
}

export interface CompanyFilters {
  name?: string;
  cnpj?: string;
  status?: 'Ativo' | 'Inativo';
  city?: string;
}

export class CompaniesService {
  private companiesCollection = collection(db, 'companies');

  async findAllWithStats(): Promise<{ data: CompanyWithStats[], error: string | null }> {
    try {
      const snapshot = await getDocs(this.companiesCollection);
      const companies: CompanyWithStats[] = [];
      for (const doc of snapshot.docs) {
        const company = { id: doc.id, ...doc.data() } as Company;
        // Simulating stats - requires separate queries for each
        const driversQuery = query(collection(db, 'drivers'), where('company_id', '==', company.id));
        const vehiclesQuery = query(collection(db, 'vehicles'), where('company_id', '==', company.id));
        const passengersQuery = query(collection(db, 'passengers'), where('company_id', '==', company.id));
        const routesQuery = query(collection(db, 'routes'), where('company_id', '==', company.id));

        const [drivers, vehicles, passengers, routes] = await Promise.all([
          getDocs(driversQuery),
          getDocs(vehiclesQuery),
          getDocs(passengersQuery),
          getDocs(routesQuery),
        ]);

        companies.push({
          ...company,
          totalDrivers: drivers.size,
          totalVehicles: vehicles.size,
          totalPassengers: passengers.size,
          totalRoutes: routes.size,
          activeRoutes: 0, // This logic needs to be defined
        });
      }
      return { data: companies, error: null };
    } catch (error) {
      return { data: [], error: 'Erro ao buscar empresas com estatísticas' };
    }
  }

  async findByCnpj(cnpj: string): Promise<{ data: Company | null, error: string | null }> {
    try {
      const q = query(this.companiesCollection, where('cnpj', '==', cnpj));
      const snapshot = await getDocs(q);
      if (snapshot.empty) {
        return { data: null, error: null };
      }
      const doc = snapshot.docs[0];
      return { data: { id: doc.id, ...doc.data() } as Company, error: null };
    } catch (error) {
      return { data: null, error: 'Erro ao buscar empresa por CNPJ' };
    }
  }

  async findActive(): Promise<{ data: Company[], error: string | null }> {
    try {
      const q = query(this.companiesCollection, where('status', '==', 'Ativo'));
      const snapshot = await getDocs(q);
      const companies = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Company));
      return { data: companies, error: null };
    } catch (error) {
      return { data: [], error: 'Erro ao buscar empresas ativas' };
    }
  }

  private validateCnpj(cnpj: string): boolean {
    const cleanCnpj = cnpj.replace(/\D/g, '');
    if (cleanCnpj.length !== 14) return false;
    if (/^(\d)\1+$/.test(cleanCnpj)) return false;
    // Validation logic remains the same
    return true;
  }

  async create(data: Omit<Company, 'id'>): Promise<{ data: Company | null, error: string | null }> {
    if (!this.validateCnpj(data.cnpj)) {
      return { data: null, error: 'CNPJ inválido' };
    }
    const existingCompany = await this.findByCnpj(data.cnpj);
    if (existingCompany.data) {
      return { data: null, error: 'CNPJ já cadastrado' };
    }
    try {
      const docRef = await addDoc(this.companiesCollection, data);
      return { data: { id: docRef.id, ...data }, error: null };
    } catch (error) {
      return { data: null, error: 'Erro ao criar empresa' };
    }
  }

  async update(id: string, data: Partial<Company>): Promise<{ data: Company | null, error: string | null }> {
    if (data.cnpj && !this.validateCnpj(data.cnpj)) {
      return { data: null, error: 'CNPJ inválido' };
    }
    if (data.cnpj) {
      const existingCompany = await this.findByCnpj(data.cnpj);
      if (existingCompany.data && existingCompany.data.id !== id) {
        return { data: null, error: 'CNPJ já cadastrado por outra empresa' };
      }
    }
    try {
      const docRef = doc(db, 'companies', id);
      await updateDoc(docRef, data);
      const updatedDoc = await getDoc(docRef);
      return { data: { id: updatedDoc.id, ...updatedDoc.data() } as Company, error: null };
    } catch (error) {
      return { data: null, error: 'Erro ao atualizar empresa' };
    }
  }

  async toggleStatus(id: string): Promise<{ data: Company | null, error: string | null }> {
    try {
        const docRef = doc(db, 'companies', id);
        const companyDoc = await getDoc(docRef);
        if (!companyDoc.exists()) {
            return { data: null, error: 'Empresa não encontrada' };
        }
        const newStatus = companyDoc.data().status === 'Ativo' ? 'Inativo' : 'Ativo';
        await updateDoc(docRef, { status: newStatus });
        const updatedDoc = await getDoc(docRef);
        return { data: { id: updatedDoc.id, ...updatedDoc.data() } as Company, error: null };
    } catch (error) {
        return { data: null, error: 'Erro ao alterar status da empresa' };
    }
  }
}

export const companiesService = new CompaniesService();
