
import { db } from '../lib/firebase';
import {
    collection,
    doc,
    getDoc,
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    Timestamp,
    arrayUnion,
    arrayRemove,
    writeBatch,
} from 'firebase/firestore';

// Interfaces para o serviço de rotas
export interface Passenger {
    id: string;
    name: string;
    email: string;
    phone?: string;
    address: string;
    company_id: string;
    status: 'Ativo' | 'Inativo';
}

export interface Route {
    id: string;
    name: string;
    company_id: string;
    driver_id?: string;
    vehicle_id?: string;
    status: 'Pendente' | 'Em andamento' | 'Concluída' | 'Cancelada';
    starts_at: Timestamp;
    ends_at?: Timestamp;
    passenger_ids: string[];
    passengers?: Passenger[]; // Populado sob demanda
    distance?: number; // em km
}

export interface RouteHistory {
    id: string;
    route_id: string;
    driver_id: string;
    vehicle_id: string;
    status: 'Iniciada' | 'Concluída' | 'Cancelada';
    timestamp: Timestamp;
    notes?: string;
}

class RouteService {
    private routesCollection = collection(db, 'routes');
    private passengersCollection = collection(db, 'passengers');
    private historyCollection = collection(db, 'route_history');

    /**
     * Busca todas as rotas de uma empresa, com detalhes dos passageiros.
     */
    async getRoutes(companyId: string): Promise<Route[]> {
        const q = query(this.routesCollection, where("company_id", "==", companyId));
        const snapshot = await getDocs(q);
        const routes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Route));
        
        // Opcional: popular detalhes dos passageiros em cada rota
        for (const route of routes) {
            if (route.passenger_ids && route.passenger_ids.length > 0) {
                route.passengers = await this.getPassengersForRoute(route.passenger_ids);
            }
        }

        return routes;
    }

    /**
     * Busca uma única rota pelo ID, com detalhes dos passageiros.
     */
    async getRoute(routeId: string): Promise<Route | null> {
        const docRef = doc(db, 'routes', routeId);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) return null;

        const route = { id: docSnap.id, ...docSnap.data() } as Route;
        if (route.passenger_ids && route.passenger_ids.length > 0) {
            route.passengers = await this.getPassengersForRoute(route.passenger_ids);
        }

        return route;
    }

    /**
     * Cria uma nova rota.
     */
    async createRoute(routeData: Omit<Route, 'id'>): Promise<Route> {
        const docRef = await addDoc(this.routesCollection, routeData);
        return { id: docRef.id, ...routeData };
    }

    /**
     * Atualiza uma rota existente.
     */
    async updateRoute(routeId: string, updateData: Partial<Route>): Promise<void> {
        const routeRef = doc(db, 'routes', routeId);
        await updateDoc(routeRef, updateData);
    }

    /**
     * Deleta uma rota.
     */
    async deleteRoute(routeId: string): Promise<void> {
        const routeRef = doc(db, 'routes', routeId);
        await deleteDoc(routeRef);
    }

    /**
     * Adiciona um passageiro a uma rota.
     */
    async addPassengerToRoute(routeId: string, passengerId: string): Promise<void> {
        const routeRef = doc(db, 'routes', routeId);
        await updateDoc(routeRef, { passenger_ids: arrayUnion(passengerId) });
    }

    /**
     * Remove um passageiro de uma rota.
     */
    async removePassengerFromRoute(routeId: string, passengerId: string): Promise<void> {
        const routeRef = doc(db, 'routes', routeId);
        await updateDoc(routeRef, { passenger_ids: arrayRemove(passengerId) });
    }

    /**
     * Inicia uma rota, atualizando seu status e criando um registro de histórico.
     */
    async startRoute(routeId: string, driverId: string, vehicleId: string): Promise<void> {
        const batch = writeBatch(db);
        
        const routeRef = doc(db, 'routes', routeId);
        batch.update(routeRef, { status: 'Em andamento', driver_id: driverId, vehicle_id: vehicleId });

        const historyRef = doc(collection(db, 'route_history'));
        batch.set(historyRef, {
            route_id: routeId,
            driver_id: driverId,
            vehicle_id: vehicleId,
            status: 'Iniciada',
            timestamp: Timestamp.now(),
        });

        await batch.commit();
    }

    /**
     * Finaliza uma rota.
     */
    async completeRoute(routeId: string): Promise<void> {
        const batch = writeBatch(db);
        
        const routeRef = doc(db, 'routes', routeId);
        batch.update(routeRef, { status: 'Concluída', ends_at: Timestamp.now() });
        
        // Adicionar ao histórico
        const historyRef = doc(collection(db, 'route_history'));
        batch.set(historyRef, {
            route_id: routeId,
            status: 'Concluída',
            timestamp: Timestamp.now(),
        } as Partial<RouteHistory>);

        await batch.commit();
    }

    /**
     * Cancela uma rota.
     */
    async cancelRoute(routeId: string, notes: string): Promise<void> {
        const batch = writeBatch(db);
        
        const routeRef = doc(db, 'routes', routeId);
        batch.update(routeRef, { status: 'Cancelada' });

        // Adicionar ao histórico
        const historyRef = doc(collection(db, 'route_history'));
        batch.set(historyRef, {
            route_id: routeId,
            status: 'Cancelada',
            timestamp: Timestamp.now(),
            notes,
        } as Partial<RouteHistory>);

        await batch.commit();
    }

    /**
     * Busca todos os passageiros de uma empresa.
     */
    async getPassengers(companyId: string): Promise<Passenger[]> {
        const q = query(this.passengersCollection, where("company_id", "==", companyId));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Passenger));
    }

    /**
     * Adiciona um novo passageiro.
     */
    async addPassenger(passengerData: Omit<Passenger, 'id'>): Promise<Passenger> {
        const docRef = await addDoc(this.passengersCollection, passengerData);
        return { id: docRef.id, ...passengerData };
    }
    
    /**
     * Busca os detalhes dos passageiros com base em uma lista de IDs.
     */
    private async getPassengersForRoute(passengerIds: string[]): Promise<Passenger[]> {
        if (passengerIds.length === 0) return [];
        const q = query(this.passengersCollection, where("__name__", "in", passengerIds));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Passenger));
    }
}

export const routeService = new RouteService();
