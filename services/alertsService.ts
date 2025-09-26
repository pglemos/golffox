
import { db } from '../lib/firebase';
import { collection, getDocs, doc, getDoc, addDoc, updateDoc, query, where, Timestamp } from 'firebase/firestore';

// Interfaces para alertas
export interface Alert {
  id: string;
  type: 'Crítico' | 'Atenção' | 'Informativo';
  title: string;
  message: string;
  is_read: boolean;
  user_id?: string;
  route_id?: string;
  vehicle_id?: string;
  driver_id?: string;
  created_at: Timestamp;
}

export interface AlertWithDetails extends Alert {
  user?: any;
  route?: any;
  vehicle?: any;
  driver?: any;
}

export class AlertsService {
  private alertsCollection = collection(db, 'alerts');

  async findAllWithDetails(): Promise<{ data: AlertWithDetails[], error: string | null }> {
    try {
      const snapshot = await getDocs(this.alertsCollection);
      const alerts: AlertWithDetails[] = [];
      for (const doc of snapshot.docs) {
        const alert = { id: doc.id, ...doc.data() } as Alert;

        const [user, route, vehicle, driver] = await Promise.all([
          alert.user_id ? getDoc(doc(db, 'users', alert.user_id)) : null,
          alert.route_id ? getDoc(doc(db, 'routes', alert.route_id)) : null,
          alert.vehicle_id ? getDoc(doc(db, 'vehicles', alert.vehicle_id)) : null,
          alert.driver_id ? getDoc(doc(db, 'drivers', alert.driver_id)) : null,
        ]);

        alerts.push({
          ...alert,
          user: user?.data(),
          route: route?.data(),
          vehicle: vehicle?.data(),
          driver: driver?.data(),
        });
      }
      return { data: alerts, error: null };
    } catch (error) {
      return { data: [], error: 'Erro ao buscar alertas com detalhes' };
    }
  }

  async findUnread(): Promise<{ data: Alert[], error: string | null }> {
    try {
      const q = query(this.alertsCollection, where('is_read', '==', false));
      const snapshot = await getDocs(q);
      const alerts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Alert));
      return { data: alerts, error: null };
    } catch (error) {
      return { data: [], error: 'Erro ao buscar alertas não lidos' };
    }
  }

  async create(data: Omit<Alert, 'id' | 'created_at'>): Promise<{ data: Alert | null, error: string | null }> {
    try {
      const alertData = {
        ...data,
        is_read: data.is_read ?? false,
        created_at: Timestamp.now(),
      };
      const docRef = await addDoc(this.alertsCollection, alertData);
      return { data: { id: docRef.id, ...alertData } as Alert, error: null };
    } catch (error) {
      return { data: null, error: 'Erro ao criar alerta' };
    }
  }

  async markAsRead(alertId: string): Promise<{ data: Alert | null, error: string | null }> {
    try {
      const docRef = doc(db, 'alerts', alertId);
      await updateDoc(docRef, { is_read: true });
      const updatedDoc = await getDoc(docRef);
      return { data: { id: updatedDoc.id, ...updatedDoc.data() } as Alert, error: null };
    } catch (error) {
      return { data: null, error: 'Erro ao marcar alerta como lido' };
    }
  }

  async createEmergencyAlert(data: { user_id: string; description: string; route_id?: string; vehicle_id?: string; }): Promise<{ data: Alert | null, error: string | null }> {
      return this.create({
        type: 'Crítico',
        title: 'Emergência',
        message: data.description,
        user_id: data.user_id,
        route_id: data.route_id,
        vehicle_id: data.vehicle_id,
      });
  }
}

export const alertsService = new AlertsService();
