
import { adminDb } from '../lib/firebaseAdmin';
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
  private vehiclesCollection = adminDb.collection('vehicles');

  async findAllWithDetails(): Promise<{ data: VehicleWithDriver[], error: string | null }> {
    try {
      const snapshot = await this.vehiclesCollection.get();
      const vehicles: VehicleWithDriver[] = [];
      for (const doc of snapshot.docs) {
        const vehicle = { id: doc.id, ...doc.data() } as Vehicle;
        
        let driverData: any = undefined;
        if (vehicle.driver_id) {
            const driverDoc = await adminDb.collection('drivers').doc(vehicle.driver_id).get();
            if (driverDoc.exists) {
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

  async findById(id: string): Promise<{ data: Vehicle | null, error: string | null }> {
    try {
      const docRef = this.vehiclesCollection.doc(id);
      const doc = await docRef.get();
      if (!doc.exists) {
        return { data: null, error: 'Veículo não encontrado' };
      }
      return { data: { id: doc.id, ...doc.data() } as Vehicle, error: null };
    } catch (error) {
      return { data: null, error: 'Erro ao buscar veículo por ID' };
    }
  }

  async findByPlate(plate: string): Promise<{ data: Vehicle | null, error: string | null }> {
    try {
      const q = this.vehiclesCollection.where('plate', '==', plate.toUpperCase());
      const snapshot = await q.get();
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
      const docRef = await this.vehiclesCollection.add(data);
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
      const docRef = this.vehiclesCollection.doc(id);
      await docRef.update(data);
      const updatedDoc = await docRef.get();
      return { data: { id: updatedDoc.id, ...updatedDoc.data() } as Vehicle, error: null };
    } catch (error) {
      return { data: null, error: 'Erro ao atualizar veículo' };
    }
  }

  async delete(id: string): Promise<{ error: string | null }> {
    try {
      const docRef = this.vehiclesCollection.doc(id);
      await docRef.delete();
      return { error: null };
    } catch (error) {
      return { error: 'Erro ao excluir veículo' };
    }
  }

  async assignDriver(vehicleId: string, driverId: string): Promise<{ data: Vehicle | null, error: string | null }> {
    try {
        const vehicleRef = this.vehiclesCollection.doc(vehicleId);
        const vehicleDoc = await vehicleRef.get();
        if (!vehicleDoc.exists || vehicleDoc.data()?.driver_id) {
            return { data: null, error: 'Veículo não encontrado ou já possui motorista' };
        }
        await vehicleRef.update({ driver_id: driverId });
        const updatedDoc = await vehicleRef.get();
        return { data: { id: updatedDoc.id, ...updatedDoc.data() } as Vehicle, error: null };
    } catch (error) {
        return { data: null, error: 'Erro ao atribuir motorista' };
    }
  }

  async unassignDriver(vehicleId: string): Promise<{ data: Vehicle | null, error: string | null }> {
    try {
        const vehicleRef = this.vehiclesCollection.doc(vehicleId);
        await vehicleRef.update({ driver_id: null });
        const updatedDoc = await vehicleRef.get();
        return { data: { id: updatedDoc.id, ...updatedDoc.data() } as Vehicle, error: null };
    } catch (error) {
        return { data: null, error: 'Erro ao remover motorista' };
    }
  }
}

export const vehiclesService = new VehiclesService();
