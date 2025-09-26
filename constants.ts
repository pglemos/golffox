
import { AlertType } from './types';
import type { Alert, Route, Vehicle } from './types';
import { RouteStatus, VehicleStatus } from './types';

export const APP_VIEWS = {
  MANAGEMENT: 'management',
  DRIVER: 'driver',
  PASSENGER: 'passenger',
  CLIENT: 'client',
};

export const GOLFFOX_LOGO_BASE64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';

export const MOCK_ALERTS: Alert[] = [
  {
    id: 'mock-1',
    type: AlertType.Critical,
    title: 'Motorista com Fadiga Excessiva',
    message: 'O motorista João Silva (Rota 101) excedeu 10 horas de direção contínua.',
    timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
  },
  {
    id: 'mock-2',
    type: AlertType.Warning,
    title: 'Manutenção de Veículo Próxima',
    message: 'O veículo Placa ABC-1234 precisa de troca de óleo em 500km.',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
  },
  {
    id: 'mock-3',
    type: AlertType.Info,
    title: 'Rota Concluída com Sucesso',
    message: 'A Rota 205 (Motorista: Carlos Pereira) foi concluída no horário.',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
  },
    {
    id: 'mock-4',
    type: AlertType.Warning,
    title: 'Documentação do Motorista Vencendo',
    message: 'A CNH de Maria Oliveira vence em 30 dias.',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
  },
];

export const MOCK_ROUTES: Route[] = [
    {
        id: 'route-1',
        name: 'Rota 101',
        driver: 'João Silva',
        vehicle: 'ABC-1234',
        status: RouteStatus.OnTime,
        passengers: { onboard: 15, total: 20, list: [] },
        scheduledStart: '08:00',
        actualStart: '08:02',
        punctuality: 2,
    },
    {
        id: 'route-2',
        name: 'Rota 102',
        driver: 'Maria Oliveira',
        vehicle: 'DEF-5678',
        status: RouteStatus.Delayed,
        passengers: { onboard: 18, total: 18, list: [] },
        scheduledStart: '08:15',
        actualStart: '08:30',
        punctuality: 15,
    },
];

export const MOCK_VEHICLES: Vehicle[] = [
    {
        id: 'vehicle-1',
        plate: 'ABC-1234',
        model: 'Mercedes Sprinter',
        driver: 'João Silva',
        status: VehicleStatus.Moving,
        position: { lat: -23.55052, lng: -46.633308 },
        isRegistered: true,
        lastMaintenance: '2023-10-26',
        nextMaintenance: '2024-04-26',
    },
    {
        id: 'vehicle-2',
        plate: 'DEF-5678',
        model: 'Renault Master',
        driver: 'Maria Oliveira',
        status: VehicleStatus.Stopped,
        position: { lat: -23.5613, lng: -46.6564 },
        isRegistered: true,
        lastMaintenance: '2023-11-15',
        nextMaintenance: '2024-05-15',
    },
];
