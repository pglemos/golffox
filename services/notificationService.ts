
import { db } from '../lib/firebase';
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, query, where, orderBy, Timestamp } from 'firebase/firestore';

// Interface para Notificações
export interface Notification {
    id: string;
    user_id: string; // ID do usuário a quem a notificação se destina
    title: string;
    message: string;
    type: 'info' | 'warning' | 'error' | 'success';
    is_read: boolean;
    created_at: Timestamp;
    link?: string; // Link para a página relevante (ex: detalhes da rota)
}

class NotificationService {
    private notificationsCollection = collection(db, 'notifications');

    /**
     * Cria uma nova notificação para um usuário
     */
    async createNotification(notification: Omit<Notification, 'id' | 'created_at' | 'is_read'>): Promise<Notification> {
        try {
            const newNotificationData = {
                ...notification,
                is_read: false,
                created_at: Timestamp.now(),
            };
            const docRef = await addDoc(this.notificationsCollection, newNotificationData);
            return { id: docRef.id, ...newNotificationData } as Notification;
        } catch (error) {
            console.error("Erro ao criar notificação:", error);
            throw new Error("Não foi possível criar a notificação.");
        }
    }

    /**
     * Busca as notificações de um usuário
     */
    async getUserNotifications(userId: string): Promise<Notification[]> {
        try {
            const q = query(
                this.notificationsCollection,
                where("user_id", "==", userId),
                orderBy("created_at", "desc")
            );
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Notification));
        } catch (error) {
            console.error("Erro ao buscar notificações do usuário:", error);
            return [];
        }
    }

    /**
     * Busca notificações não lidas de um usuário
     */
    async getUnreadUserNotifications(userId: string): Promise<Notification[]> {
        try {
            const q = query(
                this.notificationsCollection,
                where("user_id", "==", userId),
                where("is_read", "==", false),
                orderBy("created_at", "desc")
            );
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Notification));
        } catch (error) {
            console.error("Erro ao buscar notificações não lidas:", error);
            return [];
        }
    }

    /**
     * Marca uma notificação como lida
     */
    async markAsRead(notificationId: string): Promise<void> {
        try {
            const notificationRef = doc(db, 'notifications', notificationId);
            await updateDoc(notificationRef, { is_read: true });
        } catch (error) {
            console.error("Erro ao marcar notificação como lida:", error);
            throw new Error("Não foi possível atualizar a notificação.");
        }
    }

    /**
     * Marca todas as notificações de um usuário como lidas
     */
    async markAllAsRead(userId: string): Promise<void> {
        try {
            const q = query(
                this.notificationsCollection,
                where("user_id", "==", userId),
                where("is_read", "==", false)
            );
            const querySnapshot = await getDocs(q);
            const batch = db.batch();
            querySnapshot.docs.forEach(doc => {
                batch.update(doc.ref, { is_read: true });
            });
            await batch.commit();
        } catch (error) {
            console.error("Erro ao marcar todas as notificações como lidas:", error);
            throw new Error("Não foi possível atualizar as notificações.");
        }
    }

    /**
     * Deleta uma notificação
     */
    async deleteNotification(notificationId: string): Promise<void> {
        try {
            const notificationRef = doc(db, 'notifications', notificationId);
            await deleteDoc(notificationRef);
        } catch (error) {
            console.error("Erro ao deletar notificação:", error);
            throw new Error("Não foi possível deletar a notificação.");
        }
    }

    /**
     * Deleta todas as notificações de um usuário
     */
    async deleteAllUserNotifications(userId: string): Promise<void> {
        try {
            const q = query(this.notificationsCollection, where("user_id", "==", userId));
            const querySnapshot = await getDocs(q);
            const batch = db.batch();
            querySnapshot.docs.forEach(doc => {
                batch.delete(doc.ref);
            });
            await batch.commit();
        } catch (error) {
            console.error("Erro ao deletar todas as notificações do usuário:", error);
            throw new Error("Não foi possível deletar as notificações.");
        }
    }
}

// Instância singleton do serviço
export const notificationService = new NotificationService();
