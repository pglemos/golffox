
import { db } from '../lib/firebase';
import { collection, getDocs, doc, getDoc, addDoc, updateDoc, deleteDoc, query, where } from 'firebase/firestore';

// Interfaces para veículos
export interface Vehicle {
  id: string;
  plate: string;
  model: string;
  brand: string;
  status: 'Ativo' | 'Manutenção' | 'Inativo';
  type: 'van' | 'micro-ônibus' | 'ônibus';
  driver_id?: string;
  [key: string]: any;
}

export interface VehicleWithDriver extends Vehicle {
  driver?: {
    id: string;
    name: string;
    cpf: string;
    status: string;
  };
}

export class VehiclesService {
  private vehiclesCollection = collection(db, 'vehicles');

  async findAllWithDetails(): Promise<{ data: VehicleWithDriver[], error: string | null }> {
    try {
      const snapshot = await getDocs(this.vehiclesCollection);
      const vehicles: VehicleWithDriver[] = [];
      for (const doc of snapshot.docs) {
        const vehicle = { id: doc.id, ...doc.data() } as Vehicle;
        
        let driverData: any = undefined;
        if (vehicle.driver_id) {
            const driverDoc = await getDoc(doc(db, 'drivers', vehicle.driver_id));
            if (driverDoc.exists()) {
                driverData = { id: driverDoc.id, ...driverDoc.data() };
            }
        }

        vehicles.push({
          ...vehicle,
          driver: driverData,
        });
      }
      return { data: vehicles, error: null };
    } catch (error) {
      return { data: [], error: 'Erro ao buscar veículos com detalhes' };
    }
  }

  async findByPlate(plate: string): Promise<{ data: Vehicle | null, error: string | null }> {
    try {
      const q = query(this.vehiclesCollection, where('plate', '==', plate.toUpperCase()));
      const snapshot = await getDocs(q);
      if (snapshot.empty) {
        return { data: null, error: null };
      }
      const doc = snapshot.docs[0];
      return { data: { id: doc.id, ...doc.data() } as Vehicle, error: null };
    } catch (error) {
      return { data: null, error: 'Erro ao buscar veículo por placa' };
    }
  }

  private validatePlate(plate: string): boolean {
    const cleanPlate = plate.replace(/[^A-Z0-9]/g, '').toUpperCase();
    const oldFormat = /^[A-Z]{3}[0-9]{4}$/;
    const mercosulFormat = /^[A-Z]{3}[0-9][A-Z][0-9]{2}$/;
    return oldFormat.test(cleanPlate) || mercosulFormat.test(cleanPlate);
  }

  async create(data: Omit<Vehicle, 'id'>): Promise<{ data: Vehicle | null, error: string | null }> {
    if (!this.validatePlate(data.plate)) {
      return { data: null, error: 'Placa inválida' };
    }
    const existingVehicle = await this.findByPlate(data.plate);
    if (existingVehicle.data) {
      return { data: null, error: 'Placa já cadastrada' };
    }
    try {
      const docRef = await addDoc(this.vehiclesCollection, data);
      return { data: { id: docRef.id, ...data }, error: null };
    } catch (error) {
      return { data: null, error: 'Erro ao criar veículo' };
    }
  }

  async update(id: string, data: Partial<Vehicle>): Promise<{ data: Vehicle | null, error: string | null }> {
    if (data.plate && !this.validatePlate(data.plate)) {
      return { data: null, error: 'Placa inválida' };
    }
    if (data.plate) {
      const existingVehicle = await this.findByPlate(data.plate);
      if (existingVehicle.data && existingVehicle.data.id !== id) {
        return { data: null, error: 'Placa já cadastrada por outro veículo' };
      }
    }
    try {
      const docRef = doc(db, 'vehicles', id);
      await updateDoc(docRef, data);
      const updatedDoc = await getDoc(docRef);
      return { data: { id: updatedDoc.id, ...updatedDoc.data() } as Vehicle, error: null };
    } catch (error) {
      return { data: null, error: 'Erro ao atualizar veículo' };
    }
  }

  async assignDriver(vehicleId: string, driverId: string): Promise<{ data: Vehicle | null, error: string | null }> {
    try {
        const vehicleRef = doc(db, 'vehicles', vehicleId);
        const vehicleDoc = await getDoc(vehicleRef);
        if (!vehicleDoc.exists() || vehicleDoc.data().driver_id) {
            return { data: null, error: 'Veículo não encontrado ou já possui motorista' };
        }
        await updateDoc(vehicleRef, { driver_id: driverId });
        const updatedDoc = await getDoc(vehicleRef);
        return { data: { id: updatedDoc.id, ...updatedDoc.data() } as Vehicle, error: null };
    } catch (error) {
        return { data: null, error: 'Erro ao atribuir motorista' };
    }
  }

  async unassignDriver(vehicleId: string): Promise<{ data: Vehicle | null, error: string | null }> {
    try {
        const vehicleRef = doc(db, 'vehicles', vehicleId);
        await updateDoc(vehicleRef, { driver_id: null });
        const updatedDoc = await getDoc(vehicleRef);
        return { data: { id: updatedDoc.id, ...updatedDoc.data() } as Vehicle, error: null };
    } catch (error) {
        return { data: null, error: 'Erro ao remover motorista' };
    }
  }
}

export const vehiclesService = new VehiclesService();
