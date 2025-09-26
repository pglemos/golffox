
import { db } from '../lib/firebase';
import { collection, getDocs, doc, getDoc, addDoc, updateDoc, deleteDoc, query, where, writeBatch } from 'firebase/firestore';

// Interfaces para passageiros
export interface Passenger {
  id: string;
  name: string;
  cpf: string;
  email?: string;
  status: 'Ativo' | 'Inativo';
  company_id?: string;
  [key: string]: any;
}

export interface PassengerWithRoutes extends Passenger {
  routes?: any[];
  company?: any;
}

export class PassengersService {
  private passengersCollection = collection(db, 'passengers');
  private routePassengersCollection = collection(db, 'route_passengers');

  async findAllWithDetails(): Promise<{ data: PassengerWithRoutes[], error: string | null }> {
    try {
      const snapshot = await getDocs(this.passengersCollection);
      const passengers: PassengerWithRoutes[] = [];
      for (const doc of snapshot.docs) {
        const passenger = { id: doc.id, ...doc.data() } as Passenger;
        
        const companyDoc = passenger.company_id ? await getDoc(doc(db, 'companies', passenger.company_id)) : null;
        
        const routePassengersQuery = query(this.routePassengersCollection, where('passenger_id', '==', passenger.id));
        const routePassengersSnapshot = await getDocs(routePassengersQuery);
        const routes = [];
        for (const rpDoc of routePassengersSnapshot.docs) {
            const routeDoc = await getDoc(doc(db, 'routes', rpDoc.data().route_id));
            if(routeDoc.exists()) routes.push({ id: routeDoc.id, ...routeDoc.data() });
        }

        passengers.push({
          ...passenger,
          company: companyDoc?.data(),
          routes: routes,
        });
      }
      return { data: passengers, error: null };
    } catch (error) {
      return { data: [], error: 'Erro ao buscar passageiros com detalhes' };
    }
  }

  async findByCpf(cpf: string): Promise<{ data: Passenger | null, error: string | null }> {
    try {
      const q = query(this.passengersCollection, where('cpf', '==', cpf));
      const snapshot = await getDocs(q);
      if (snapshot.empty) {
        return { data: null, error: null };
      }
      const doc = snapshot.docs[0];
      return { data: { id: doc.id, ...doc.data() } as Passenger, error: null };
    } catch (error) {
      return { data: null, error: 'Erro ao buscar passageiro por CPF' };
    }
  }

  private validateCpf(cpf: string): boolean {
    const cleanCpf = cpf.replace(/\D/g, '');
    return cleanCpf.length === 11 && !/^(\d)\1+$/.test(cleanCpf);
  }

  async create(data: Omit<Passenger, 'id'>): Promise<{ data: Passenger | null, error: string | null }> {
    if (!this.validateCpf(data.cpf)) return { data: null, error: 'CPF inválido' };
    const existing = await this.findByCpf(data.cpf);
    if (existing.data) return { data: null, error: 'CPF já cadastrado' };

    try {
      const docRef = await addDoc(this.passengersCollection, data);
      return { data: { id: docRef.id, ...data }, error: null };
    } catch (error) {
      return { data: null, error: 'Erro ao criar passageiro' };
    }
  }

  async update(id: string, data: Partial<Passenger>): Promise<{ data: Passenger | null, error: string | null }> {
    if (data.cpf && !this.validateCpf(data.cpf)) return { data: null, error: 'CPF inválido' };
    if (data.cpf) {
      const existing = await this.findByCpf(data.cpf);
      if (existing.data && existing.data.id !== id) {
        return { data: null, error: 'CPF já cadastrado por outro passageiro' };
      }
    }

    try {
      const docRef = doc(db, 'passengers', id);
      await updateDoc(docRef, data);
      const updatedDoc = await getDoc(docRef);
      return { data: { id: updatedDoc.id, ...updatedDoc.data() } as Passenger, error: null };
    } catch (error) {
      return { data: null, error: 'Erro ao atualizar passageiro' };
    }
  }

  async assignToRoute(passengerId: string, routeId: string): Promise<{ data: any, error: string | null }> {
    try {
      const docRef = await addDoc(this.routePassengersCollection, { passenger_id: passengerId, route_id: routeId });
      return { data: { id: docRef.id, passenger_id: passengerId, route_id: routeId }, error: null };
    } catch (error) {
      return { data: null, error: 'Erro ao atribuir passageiro à rota' };
    }
  }

  async removeFromRoute(passengerId: string, routeId: string): Promise<{ data: any, error: string | null }> {
    try {
        const q = query(this.routePassengersCollection, where('passenger_id', '==', passengerId), where('route_id', '==', routeId));
        const snapshot = await getDocs(q);
        if(snapshot.empty) {
            return { data: null, error: "Relação não encontrada" };
        }
        const batch = writeBatch(db);
        snapshot.docs.forEach(doc => batch.delete(doc.ref));
        await batch.commit();
        return { data: { success: true }, error: null };
    } catch (error) {
        return { data: null, error: 'Erro ao remover passageiro da rota' };
    }
  }
}

export const passengersService = new PassengersService();
