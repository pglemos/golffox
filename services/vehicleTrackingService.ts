
import { db } from '../lib/firebase';
import { collection, doc, getDoc, getDocs, updateDoc, addDoc, query, where, orderBy, limit, onSnapshot, GeoPoint, Timestamp } from 'firebase/firestore';

// Interfaces para rastreamento de veículos
export interface VehicleLocation {
    id?: string;
    vehicle_id: string;
    position: GeoPoint;
    speed: number;
    heading: number;
    timestamp: Timestamp;
}

export interface Vehicle {
    id: string;
    plate: string;
    model: string;
    company_id: string;
    driver_id?: string | null;
    current_location?: VehicleLocation;
    status: 'Disponível' | 'Em uso' | 'Manutenção' | 'Inativo';
}

class VehicleTrackingService {
    private vehiclesCollection = collection(db, 'vehicles');
    private locationsCollection = collection(db, 'vehicle_locations');
    private unsubscribes: Map<string, () => void> = new Map();

    /**
     * Busca a localização atual de todos os veículos ativos de uma empresa
     */
    async getActiveVehiclesLocation(companyId: string): Promise<Vehicle[]> {
        const q = query(this.vehiclesCollection, where('company_id', '==', companyId), where('status', '==', 'Em uso'));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Vehicle));
    }

    /**
     * Busca um veículo específico pelo ID
     */
    async getVehicle(vehicleId: string): Promise<Vehicle | null> {
        const docRef = doc(db, 'vehicles', vehicleId);
        const docSnap = await getDoc(docRef);
        return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } as Vehicle : null;
    }

    /**
     * Atualiza a localização de um veículo
     */
    async updateVehicleLocation(vehicleId: string, locationData: Omit<VehicleLocation, 'id' | 'vehicle_id' | 'timestamp'>): Promise<void> {
        const locationWithTimestamp = {
            ...locationData,
            vehicle_id: vehicleId,
            timestamp: Timestamp.now(),
        };

        // Adiciona o histórico de localização
        await addDoc(this.locationsCollection, locationWithTimestamp);

        // Atualiza a localização atual no documento do veículo
        const vehicleRef = doc(db, 'vehicles', vehicleId);
        await updateDoc(vehicleRef, { current_location: locationWithTimestamp });
    }

    /**
     * Busca o histórico de localizações de um veículo
     */
    async getVehicleLocationHistory(vehicleId: string, options: { limit?: number } = {}): Promise<VehicleLocation[]> {
        const q = query(
            this.locationsCollection,
            where("vehicle_id", "==", vehicleId),
            orderBy("timestamp", "desc"),
            limit(options.limit || 100)
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as VehicleLocation));
    }

    /**
     * Inscreve-se para receber atualizações de localização em tempo real de um veículo
     */
    subscribeToVehicleLocation(vehicleId: string, callback: (location: VehicleLocation) => void): () => void {
        const q = query(
            this.locationsCollection,
            where('vehicle_id', '==', vehicleId),
            orderBy('timestamp', 'desc'),
            limit(1)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            if (!snapshot.empty) {
                const doc = snapshot.docs[0];
                callback({ id: doc.id, ...doc.data() } as VehicleLocation);
            }
        });

        this.unsubscribes.set(vehicleId, unsubscribe);
        return unsubscribe;
    }

    /**
     * Cancela a inscrição de um veículo
     */
    unsubscribeFromVehicleLocation(vehicleId: string): void {
        const unsubscribe = this.unsubscribes.get(vehicleId);
        if (unsubscribe) {
            unsubscribe();
            this.unsubscribes.delete(vehicleId);
        }
    }

    /**
     * Cancela todas as inscrições ativas
     */
    unsubscribeFromAll(): void {
        this.unsubscribes.forEach(unsub => unsub());
        this.unsubscribes.clear();
    }
}

export const vehicleTrackingService = new VehicleTrackingService();
