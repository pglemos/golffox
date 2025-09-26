'use client'

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react'
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import GoogleMapsLoader from '../components/GoogleMapsLoader'
import type { Route as RouteType, Company, Employee, PermissionProfile } from '../types'
import { AuthProvider } from './auth/AuthContext'

interface AppContextType {
  routes: RouteType[]
  setRoutes: React.Dispatch<React.SetStateAction<RouteType[]>>
  companies: Company[]
  setCompanies: React.Dispatch<React.SetStateAction<Company[]>>
  employees: Employee[]
  setEmployees: React.Dispatch<React.SetStateAction<Employee[]>>
  permissionProfiles: PermissionProfile[]
  setPermissionProfiles: React.Dispatch<React.SetStateAction<PermissionProfile[]>>
}

const AppContext = createContext<AppContextType | undefined>(undefined)

export function useAppContext() {
  const context = useContext(AppContext)
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider')
  }
  return context
}

interface AppProviderProps {
  children: ReactNode
}

export function AppProvider({ children }: AppProviderProps) {
  const [routes, setRoutes] = useState<RouteType[]>([])
  const [companies, setCompanies] = useState<Company[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [permissionProfiles, setPermissionProfiles] = useState<PermissionProfile[]>([])

  useEffect(() => {
    const unsubscribes = [
      onSnapshot(collection(db, 'companies'), (snapshot) => {
        const companiesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Company));
        setCompanies(companiesData);
      }),
      onSnapshot(collection(db, 'employees'), (snapshot) => {
        const employeesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Employee));
        setEmployees(employeesData);
      }),
      onSnapshot(collection(db, 'routes'), (snapshot) => {
        const routesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as RouteType));
        setRoutes(routesData);
      }),
      onSnapshot(collection(db, 'permissionProfiles'), (snapshot) => {
        const permissionProfilesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PermissionProfile));
        setPermissionProfiles(permissionProfilesData);
      }),
    ];
    return () => unsubscribes.forEach(unsub => unsub());
  }, []);

  const value = {
    routes,
    setRoutes,
    companies,
    setCompanies,
    employees,
    setEmployees,
    permissionProfiles,
    setPermissionProfiles,
  }

  return (
    <AppContext.Provider value={value}>
      <AuthProvider>
        <GoogleMapsLoader>
          {children}
        </GoogleMapsLoader>
      </AuthProvider>
    </AppContext.Provider>
  )
}
