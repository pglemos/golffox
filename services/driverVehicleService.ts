
import { db } from '../lib/firebase';
import { collection, getDocs, doc, getDoc, addDoc, updateDoc, deleteDoc, query, where, writeBatch } from 'firebase/firestore';

// Interfaces para motoristas e veículos
export interface Driver {
  id: string;
  name: string;
  email: string;
  phone: string;
  cnh: string;
  cnh_validity: string;
  status: 'Ativo' | 'Inativo';
  company_id: string;
  vehicle_id?: string | null;
}

export interface Vehicle {
  id: string;
  plate: string;
  model: string;
  status: 'Disponível' | 'Em uso' | 'Manutenção' | 'Inativo';
  company_id: string;
  driver_id?: string | null;
}

export class DriverVehicleService {
  private driversCollection = collection(db, 'drivers');
  private vehiclesCollection = collection(db, 'vehicles');

  // Métodos para Motoristas
  async getDrivers(companyId: string): Promise<Driver[]> {
    const q = query(this.driversCollection, where('company_id', '==', companyId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Driver));
  }

  async getDriver(driverId: string): Promise<Driver | null> {
    const docRef = doc(db, 'drivers', driverId);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } as Driver : null;
  }

  async createDriver(data: Omit<Driver, 'id'>): Promise<Driver> {
    const docRef = await addDoc(this.driversCollection, data);
    return { id: docRef.id, ...data };
  }

  async updateDriver(driverId: string, data: Partial<Driver>): Promise<Driver> {
    const docRef = doc(db, 'drivers', driverId);
    await updateDoc(docRef, data);
    const updatedDoc = await getDoc(docRef);
    return { id: updatedDoc.id, ...updatedDoc.data() } as Driver;
  }

  async deleteDriver(driverId: string): Promise<void> {
    const batch = writeBatch(db);
    const driverRef = doc(db, 'drivers', driverId);
    
    // Desatribuir veículo, se houver
    const driver = await this.getDriver(driverId);
    if (driver?.vehicle_id) {
        const vehicleRef = doc(db, 'vehicles', driver.vehicle_id);
        batch.update(vehicleRef, { driver_id: null, status: 'Disponível' });
    }

    batch.delete(driverRef);
    await batch.commit();
  }

  // Métodos para Veículos
  async getVehicles(companyId: string): Promise<Vehicle[]> {
    const q = query(this.vehiclesCollection, where('company_id', '==', companyId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Vehicle));
  }

  async getVehicle(vehicleId: string): Promise<Vehicle | null> {
    const docRef = doc(db, 'vehicles', vehicleId);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } as Vehicle : null;
  }

  async createVehicle(data: Omit<Vehicle, 'id'>): Promise<Vehicle> {
    const docRef = await addDoc(this.vehiclesCollection, data);
    return { id: docRef.id, ...data };
  }

  async updateVehicle(vehicleId: string, data: Partial<Vehicle>): Promise<Vehicle> {
    const docRef = doc(db, 'vehicles', vehicleId);
    await updateDoc(docRef, data);
    const updatedDoc = await getDoc(docRef);
    return { id: updatedDoc.id, ...updatedDoc.data() } as Vehicle;
  }

  async deleteVehicle(vehicleId: string): Promise<void> {
    const batch = writeBatch(db);
    const vehicleRef = doc(db, 'vehicles', vehicleId);

    // Desatribuir motorista, se houver
    const vehicle = await this.getVehicle(vehicleId);
    if (vehicle?.driver_id) {
        const driverRef = doc(db, 'drivers', vehicle.driver_id);
        batch.update(driverRef, { vehicle_id: null });
    }

    batch.delete(vehicleRef);
    await batch.commit();
  }

  // Métodos de Associação
  async assignVehicleToDriver(vehicleId: string, driverId: string): Promise<void> {
    const batch = writeBatch(db);
    const vehicleRef = doc(db, 'vehicles', vehicleId);
    const driverRef = doc(db, 'drivers', driverId);

    batch.update(vehicleRef, { driver_id: driverId, status: 'Em uso' });
    batch.update(driverRef, { vehicle_id: vehicleId });

    await batch.commit();
  }

  async unassignVehicleFromDriver(vehicleId: string, driverId: string): Promise<void> {
    const batch = writeBatch(db);
    const vehicleRef = doc(db, 'vehicles', vehicleId);
    const driverRef = doc(db, 'drivers', driverId);

    batch.update(vehicleRef, { driver_id: null, status: 'Disponível' });
    batch.update(driverRef, { vehicle_id: null });

    await batch.commit();
  }
}

export const driverVehicleService = new DriverVehicleService();
