
import { auth, db, adminAuth, adminDb } from '../lib/firebase';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  sendPasswordResetEmail, 
  updatePassword, 
  User 
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, collection, getDocs, query, where } from 'firebase/firestore';

// Interfaces para autenticação
export type UserRole = 'admin' | 'operator' | 'driver' | 'passenger';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  companyId: string;
  companyName: string;
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  role: UserRole;
  companyId: string;
}

export interface AuthResponse {
  user: AuthUser | null;
  error: string | null;
}

export interface PasswordResetData {
  email: string;
}

export interface PasswordUpdateData {
  newPassword: string;
}

export class AuthService {
  private static instance: AuthService;
  private currentUser: AuthUser | null = null;
  private authListeners: ((user: AuthUser | null) => void)[] = [];

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  constructor() {
    onAuthStateChanged(auth, async (user) => {
      if (user) {
        await this.loadUserProfile(user);
      } else {
        this.currentUser = null;
        this.notifyAuthListeners(null);
      }
    });
  }

  private async loadUserProfile(user: User): Promise<void> {
    try {
      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        const userProfile = userDoc.data();
        const companyDocRef = doc(db, 'companies', userProfile.company_id);
        const companyDoc = await getDoc(companyDocRef);

        this.currentUser = {
          id: user.uid,
          email: user.email || '',
          name: userProfile.name,
          role: userProfile.role as UserRole,
          companyId: userProfile.company_id,
          companyName: companyDoc.exists() ? companyDoc.data().name : 'Empresa não encontrada',
          isActive: userProfile.is_active,
          lastLogin: userProfile.last_login?.toDate(),
          createdAt: userProfile.created_at?.toDate(),
        };

        await this.updateLastLogin();
        this.notifyAuthListeners(this.currentUser);
      }
    } catch (error) {
      console.error('Erro ao carregar perfil do usuário:', error);
      this.currentUser = null;
      this.notifyAuthListeners(null);
    }
  }

  private async updateLastLogin(): Promise<void> {
    if (!this.currentUser) return;

    try {
      const userDocRef = doc(db, 'users', this.currentUser.id);
      await updateDoc(userDocRef, { last_login: new Date() });
    } catch (error) {
      console.error('Erro ao atualizar último login:', error);
    }
  }

  private notifyAuthListeners(user: AuthUser | null): void {
    this.authListeners.forEach(listener => {
      try {
        listener(user);
      } catch (error) {
        console.error('Erro ao notificar listener de autenticação:', error);
      }
    });
  }

  onAuthStateChange(callback: (user: AuthUser | null) => void): () => void {
    this.authListeners.push(callback);
    return () => {
      const index = this.authListeners.indexOf(callback);
      if (index > -1) {
        this.authListeners.splice(index, 1);
      }
    };
  }

  async signIn(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, credentials.email, credentials.password);
      await this.loadUserProfile(userCredential.user);
      return { user: this.currentUser, error: null };
    } catch (error: any) {
      return { user: null, error: this.translateAuthError(error.code) };
    }
  }

  async signUp(registerData: RegisterData): Promise<AuthResponse> {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, registerData.email, registerData.password);
      const user = userCredential.user;

      await setDoc(doc(db, 'users', user.uid), {
        name: registerData.name,
        email: registerData.email,
        role: registerData.role,
        company_id: registerData.companyId,
        is_active: true,
        created_at: new Date(),
      });

      await this.loadUserProfile(user);

      return { user: this.currentUser, error: null };
    } catch (error: any) {
      return { user: null, error: this.translateAuthError(error.code) };
    }
  }

  async signOut(): Promise<{ error: string | null }> {
    try {
      await signOut(auth);
      this.currentUser = null;
      this.notifyAuthListeners(null);
      return { error: null };
    } catch (error: any) {
      return { error: this.translateAuthError(error.code) };
    }
  }

  async resetPassword(data: PasswordResetData): Promise<{ error: string | null }> {
    try {
      await sendPasswordResetEmail(auth, data.email);
      return { error: null };
    } catch (error: any) {
      return { error: this.translateAuthError(error.code) };
    }
  }

  async updatePassword(data: PasswordUpdateData): Promise<{ error: string | null }> {
    if (!auth.currentUser) {
      return { error: 'Usuário não autenticado' };
    }
    try {
      await updatePassword(auth.currentUser, data.newPassword);
      return { error: null };
    } catch (error: any) {
      return { error: this.translateAuthError(error.code) };
    }
  }

  async updateProfile(updates: Partial<Pick<AuthUser, 'name' | 'role'>>): Promise<{ error: string | null }> {
    if (!this.currentUser) {
      return { error: 'Usuário não autenticado' };
    }
    try {
      const userDocRef = doc(db, 'users', this.currentUser.id);
      await updateDoc(userDocRef, updates);
      if (auth.currentUser) {
        await this.loadUserProfile(auth.currentUser);
      }
      return { error: null };
    } catch (error: any) {
      return { error: 'Erro ao atualizar perfil' };
    }
  }

  hasRole(roles: UserRole | UserRole[]): boolean {
    if (!this.currentUser) return false;
    const roleArray = Array.isArray(roles) ? roles : [roles];
    return roleArray.includes(this.currentUser.role);
  }

  getCurrentUser(): AuthUser | null {
    return this.currentUser;
  }

  isAuthenticated(): boolean {
    return this.currentUser !== null;
  }

  async getSession(): Promise<string | null> {
    try {
      return auth.currentUser?.getIdToken() || null;
    } catch (error) {
      console.error('Erro ao obter sessão:', error);
      return null;
    }
  }
  
  private translateAuthError(error: string): string {
    const errorMap: Record<string, string> = {
      'auth/invalid-email': 'Email inválido',
      'auth/user-not-found': 'Usuário não encontrado',
      'auth/wrong-password': 'Credenciais de login inválidas',
      'auth/email-already-in-use': 'Email já cadastrado',
      'auth/weak-password': 'A senha deve ter pelo menos 6 caracteres',
    };
    return errorMap[error] || error;
  }

  async getCompanyUsers(): Promise<AuthUser[]> {
    if (!this.currentUser || !this.hasRole(['admin', 'operator'])) {
      throw new Error('Acesso negado');
    }
    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('company_id', '==', this.currentUser.companyId));
      const querySnapshot = await getDocs(q);
      const users: AuthUser[] = [];
      for (const doc of querySnapshot.docs) {
        const userData = doc.data();
        const companyDocRef = doc(db, 'companies', userData.company_id);
        const companyDoc = await getDoc(companyDocRef);
        users.push({
          id: doc.id,
          email: userData.email,
          name: userData.name,
          role: userData.role,
          companyId: userData.company_id,
          companyName: companyDoc.exists() ? companyDoc.data().name : 'Empresa não encontrada',
          isActive: userData.is_active,
          lastLogin: userData.last_login?.toDate(),
          createdAt: userData.created_at?.toDate(),
        });
      }
      return users;
    } catch (error) {
      console.error('Erro ao buscar usuários da empresa:', error);
      throw error;
    }
  }

  async toggleUserStatus(userId: string, isActive: boolean): Promise<{ error: string | null }> {
    if (!this.currentUser || !this.hasRole('admin')) {
      return { error: 'Acesso negado' };
    }
    try {
      const userDocRef = doc(db, 'users', userId);
      await updateDoc(userDocRef, { is_active: isActive });
      return { error: null };
    } catch (error: any) {
      console.error('Erro ao alterar status do usuário:', error);
      return { error: 'Erro ao alterar status do usuário' };
    }
  }
}

export const authService = AuthService.getInstance();
