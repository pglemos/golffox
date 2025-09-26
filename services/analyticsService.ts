
import { db } from '../lib/firebase';
import { collection, getDocs, query, where, Timestamp } from 'firebase/firestore';

// Interfaces para dados de análise
export interface PerformanceMetrics {
  total_routes: number;
  total_distance: number; // em km
  average_passengers: number;
}

export interface RouteAnalysis {
  date: string;
  routes_completed: number;
  on_time_percentage: number;
}

export interface VehicleUsage {
  vehicle_id: string;
  plate: string;
  route_count: number;
  total_distance: number; // em km
}

class AnalyticsService {
  private routesCollection = collection(db, 'routes');
  private vehiclesCollection = collection(db, 'vehicles');

  /**
   * Gera métricas de desempenho gerais para a empresa.
   */
  async getPerformanceMetrics(companyId: string): Promise<PerformanceMetrics> {
    const q = query(this.routesCollection, where('company_id', '==', companyId));
    const snapshot = await getDocs(q);
    
    const total_routes = snapshot.size;
    let total_distance = 0;
    let total_passengers = 0;

    snapshot.forEach(doc => {
        total_distance += doc.data().distance || 0;
        total_passengers += doc.data().passengers?.length || 0;
    });

    return {
        total_routes,
        total_distance,
        average_passengers: total_routes > 0 ? total_passengers / total_routes : 0,
    };
  }

  /**
   * Analisa as rotas dos últimos 7 dias.
   */
  async getRouteAnalysis(companyId: string): Promise<RouteAnalysis[]> {
    const analysis: RouteAnalysis[] = [];
    for (let i = 0; i < 7; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        
        const startOfDay = Timestamp.fromDate(new Date(date.setHours(0, 0, 0, 0)));
        const endOfDay = Timestamp.fromDate(new Date(date.setHours(23, 59, 59, 999)));

        const q = query(
            this.routesCollection,
            where('company_id', '==', companyId),
            where('created_at', '>=', startOfDay),
            where('created_at', '<', endOfDay)
        );
        
        const snapshot = await getDocs(q);
        const routes_completed = snapshot.size;
        let on_time_routes = 0;

        snapshot.forEach(doc => {
            if (doc.data().status === 'Concluída') {
                on_time_routes++;
            }
        });

        analysis.push({
            date: date.toISOString().split('T')[0],
            routes_completed,
            on_time_percentage: routes_completed > 0 ? (on_time_routes / routes_completed) * 100 : 0,
        });
    }
    return analysis.reverse();
  }

  /**
   * Gera um relatório de uso de veículos.
   */
  async getVehicleUsage(companyId: string): Promise<VehicleUsage[]> {
    const vehicleUsage: { [key: string]: VehicleUsage } = {};
    
    const routesQuery = query(this.routesCollection, where('company_id', '==', companyId));
    const routesSnapshot = await getDocs(routesQuery);

    routesSnapshot.forEach(doc => {
        const route = doc.data();
        if (route.vehicle_id) {
            if (!vehicleUsage[route.vehicle_id]) {
                vehicleUsage[route.vehicle_id] = { vehicle_id: route.vehicle_id, plate: '', route_count: 0, total_distance: 0 };
            }
            vehicleUsage[route.vehicle_id].route_count++;
            vehicleUsage[route.vehicle_id].total_distance += route.distance || 0;
        }
    });

    const vehiclesQuery = query(this.vehiclesCollection, where('company_id', '==', companyId));
    const vehiclesSnapshot = await getDocs(vehiclesQuery);
    vehiclesSnapshot.forEach(doc => {
        if (vehicleUsage[doc.id]) {
            vehicleUsage[doc.id].plate = doc.data().plate;
        }
    });

    return Object.values(vehicleUsage);
  }

  /**
   * Coleta todos os dados para o painel de controle.
   */
  async getDashboardData(companyId: string): Promise<any> {
    const [performanceMetrics, routeAnalysis, vehicleUsage] = await Promise.all([
        this.getPerformanceMetrics(companyId),
        this.getRouteAnalysis(companyId),
        this.getVehicleUsage(companyId),
    ]);

    return {
        performanceMetrics,
        routeAnalysis,
        vehicleUsage,
    };
  }
}

export const analyticsService = new AnalyticsService();
