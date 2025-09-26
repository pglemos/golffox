
import { db } from '../lib/firebase';
import { collection, getDocs, doc, getDoc, addDoc, updateDoc, deleteDoc, query, where } from 'firebase/firestore';

// Interfaces para rotas
export interface Route {
  id: string;
  name: string;
  status: 'Ativa' | 'Inativa' | 'Em andamento' | 'Concluída';
  driver_id?: string;
  vehicle_id?: string;
  company_id?: string;
  scheduled_start?: string;
  [key: string]: any;
}

export interface RouteWithDetails extends Route {
  driver?: any;
  vehicle?: any;
  company?: any;
  passengers?: any[];
}

export class RoutesService {
  private routesCollection = collection(db, 'routes');

  async findAllWithDetails(): Promise<{ data: RouteWithDetails[], error: string | null }> {
    try {
      const snapshot = await getDocs(this.routesCollection);
      const routes: RouteWithDetails[] = [];
      for (const doc of snapshot.docs) {
        const route = { id: doc.id, ...doc.data() } as Route;
        
        const [driver, vehicle, company, passengers] = await Promise.all([
          route.driver_id ? getDoc(doc(db, 'drivers', route.driver_id)) : Promise.resolve(null),
          route.vehicle_id ? getDoc(doc(db, 'vehicles', route.vehicle_id)) : Promise.resolve(null),
          route.company_id ? getDoc(doc(db, 'companies', route.company_id)) : Promise.resolve(null),
          // Simplified passenger query
          getDocs(query(collection(db, 'passengers'), where('route_id', '==', route.id)))
        ]);

        routes.push({
          ...route,
          driver: driver?.data(),
          vehicle: vehicle?.data(),
          company: company?.data(),
          passengers: passengers.docs.map(d => d.data()),
        });
      }
      return { data: routes, error: null };
    } catch (error) {
      return { data: [], error: 'Erro ao buscar rotas com detalhes' };
    }
  }

  async findByDriver(driverId: string): Promise<{ data: Route[], error: string | null }> {
    try {
      const q = query(this.routesCollection, where('driver_id', '==', driverId));
      const snapshot = await getDocs(q);
      const routes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Route));
      return { data: routes, error: null };
    } catch (error) {
      return { data: [], error: 'Erro ao buscar rotas por motorista' };
    }
  }

  async findByVehicle(vehicleId: string): Promise<{ data: Route[], error: string | null }> {
    try {
      const q = query(this.routesCollection, where('vehicle_id', '==', vehicleId));
      const snapshot = await getDocs(q);
      const routes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Route));
      return { data: routes, error: null };
    } catch (error) {
      return { data: [], error: 'Erro ao buscar rotas por veículo' };
    }
  }

  async create(data: Omit<Route, 'id'>): Promise<{ data: Route | null, error: string | null }> {
    try {
      if (data.driver_id) {
        const driverRoutes = await this.findByDriver(data.driver_id);
        const hasConflict = driverRoutes.data.some(route => route.status === 'Ativa' && route.scheduled_start === data.scheduled_start);
        if (hasConflict) return { data: null, error: 'Motorista já possui rota no mesmo horário' };
      }
      if (data.vehicle_id) {
        const vehicleRoutes = await this.findByVehicle(data.vehicle_id);
        const hasConflict = vehicleRoutes.data.some(route => route.status === 'Ativa' && route.scheduled_start === data.scheduled_start);
        if (hasConflict) return { data: null, error: 'Veículo já possui rota no mesmo horário' };
      }

      const docRef = await addDoc(this.routesCollection, data);
      return { data: { id: docRef.id, ...data }, error: null };
    } catch (error) {
      return { data: null, error: 'Erro ao criar rota' };
    }
  }

  async update(id: string, data: Partial<Route>): Promise<{ data: Route | null, error: string | null }> {
    try {
      const docRef = doc(db, 'routes', id);
      await updateDoc(docRef, data);
      const updatedDoc = await getDoc(docRef);
      return { data: { id: updatedDoc.id, ...updatedDoc.data() } as Route, error: null };
    } catch (error) {
      return { data: null, error: 'Erro ao atualizar rota' };
    }
  }

  async startRoute(routeId: string): Promise<{ data: Route | null, error: string | null }> {
    try {
        const routeRef = doc(db, 'routes', routeId);
        const routeDoc = await getDoc(routeRef);
        if (!routeDoc.exists() || routeDoc.data().status !== 'Ativa') {
            return { data: null, error: 'Apenas rotas ativas podem ser iniciadas' };
        }
        await updateDoc(routeRef, { status: 'Em andamento', actual_start: new Date().toISOString() });
        const updatedDoc = await getDoc(routeRef);
        return { data: { id: updatedDoc.id, ...updatedDoc.data() } as Route, error: null };
    } catch (error) {
        return { data: null, error: 'Erro ao iniciar rota' };
    }
  }

  async finishRoute(routeId: string): Promise<{ data: Route | null, error: string | null }> {
    try {
        const routeRef = doc(db, 'routes', routeId);
        const routeDoc = await getDoc(routeRef);
        if (!routeDoc.exists() || routeDoc.data().status !== 'Em andamento') {
            return { data: null, error: 'Apenas rotas em andamento podem ser finalizadas' };
        }
        await updateDoc(routeRef, { status: 'Concluída' });
        const updatedDoc = await getDoc(routeRef);
        return { data: { id: updatedDoc.id, ...updatedDoc.data() } as Route, error: null };
    } catch (error) {
        return { data: null, error: 'Erro ao finalizar rota' };
    }
  }
}

export const routesService = new RoutesService();
