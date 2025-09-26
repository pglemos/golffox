
import { db } from '../lib/firebase';
import { collection, getDocs, doc, getDoc, addDoc, updateDoc, deleteDoc, query, where } from 'firebase/firestore';

// Interfaces para motoristas
export interface Driver {
  id: string;
  name: string;
  cpf: string;
  email: string;
  cnh: string;
  cnh_validity: string;
  status: 'Ativo' | 'Em análise' | 'Inativo';
  linked_company: string;
  cnh_category: 'D' | 'E';
  contract_type: 'CLT' | 'terceirizado' | 'autônomo';
  assigned_routes?: string[];
  [key: string]: any;
}

export interface DriverWithVehicle extends Driver {
  vehicle?: {
    id: string;
    plate: string;
    model: string;
    status: string;
  };
  currentRoute?: {
    id: string;
    name: string;
    status: string;
  };
}

export class DriversService {
  private driversCollection = collection(db, 'drivers');

  async findAllWithDetails(): Promise<{ data: DriverWithVehicle[], error: string | null }> {
    try {
      const snapshot = await getDocs(this.driversCollection);
      const drivers: DriverWithVehicle[] = [];
      for (const doc of snapshot.docs) {
        const driver = { id: doc.id, ...doc.data() } as Driver;
        
        let vehicleData: any = undefined;
        if (driver.vehicle_id) {
            const vehicleDoc = await getDoc(doc(db, 'vehicles', driver.vehicle_id));
            if (vehicleDoc.exists()) {
                vehicleData = { id: vehicleDoc.id, ...vehicleDoc.data() };
            }
        }

        drivers.push({
          ...driver,
          vehicle: vehicleData,
        });
      }
      return { data: drivers, error: null };
    } catch (error) {
      return { data: [], error: 'Erro ao buscar motoristas com detalhes' };
    }
  }

  async findByCpf(cpf: string): Promise<{ data: Driver | null, error: string | null }> {
    try {
      const q = query(this.driversCollection, where('cpf', '==', cpf));
      const snapshot = await getDocs(q);
      if (snapshot.empty) {
        return { data: null, error: null };
      }
      const doc = snapshot.docs[0];
      return { data: { id: doc.id, ...doc.data() } as Driver, error: null };
    } catch (error) {
      return { data: null, error: 'Erro ao buscar motorista por CPF' };
    }
  }

  private validateCpf(cpf: string): boolean {
    const cleanCpf = cpf.replace(/\D/g, '');
    if (cleanCpf.length !== 11) return false;
    if (/^(\d)\1+$/.test(cleanCpf)) return false;
    return true; // Simplified for brevity
  }

  private validateCnh(cnh: string): boolean {
    const cleanCnh = cnh.replace(/\D/g, '');
    return cleanCnh.length === 11;
  }

  private isCnhExpired(validity: string): boolean {
    const validityDate = new Date(validity);
    const today = new Date();
    return validityDate < today;
  }

  async create(data: Omit<Driver, 'id'>): Promise<{ data: Driver | null, error: string | null }> {
    if (!this.validateCpf(data.cpf)) return { data: null, error: 'CPF inválido' };
    if (!this.validateCnh(data.cnh)) return { data: null, error: 'CNH inválida' };
    if (this.isCnhExpired(data.cnh_validity)) return { data: null, error: 'CNH vencida' };

    const existingDriver = await this.findByCpf(data.cpf);
    if (existingDriver.data) {
      return { data: null, error: 'CPF já cadastrado' };
    }

    try {
      const docRef = await addDoc(this.driversCollection, data);
      return { data: { id: docRef.id, ...data }, error: null };
    } catch (error) {
      return { data: null, error: 'Erro ao criar motorista' };
    }
  }

  async update(id: string, data: Partial<Driver>): Promise<{ data: Driver | null, error: string | null }> {
    if (data.cpf && !this.validateCpf(data.cpf)) return { data: null, error: 'CPF inválido' };
    if (data.cnh && !this.validateCnh(data.cnh)) return { data: null, error: 'CNH inválida' };
    if (data.cnh_validity && this.isCnhExpired(data.cnh_validity)) return { data: null, error: 'CNH vencida' };

    if (data.cpf) {
      const existingDriver = await this.findByCpf(data.cpf);
      if (existingDriver.data && existingDriver.data.id !== id) {
        return { data: null, error: 'CPF já cadastrado por outro motorista' };
      }
    }

    try {
      const docRef = doc(db, 'drivers', id);
      await updateDoc(docRef, data);
      const updatedDoc = await getDoc(docRef);
      return { data: { id: updatedDoc.id, ...updatedDoc.data() } as Driver, error: null };
    } catch (error) {
      return { data: null, error: 'Erro ao atualizar motorista' };
    }
  }
}

export const driversService = new DriversService();
