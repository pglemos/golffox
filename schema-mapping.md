# Mapeamento do Schema: Supabase para Firestore

Este documento descreve o mapeamento das tabelas do Supabase para as coleções do Firestore.

## Coleções do Firestore

*   **companies**: Armazena informações sobre as empresas.
    *   `companies/{companyId}`
*   **branches**: Armazena informações sobre as filiais das empresas.
    *   `branches/{branchId}`
*   **vehicles**: Armazena informações sobre os veículos.
    *   `vehicles/{vehicleId}`
*   **drivers**: Armazena informações sobre os motoristas.
    *   `drivers/{driverId}`
*   **passengers**: Armazena informações sobre os passageiros.
    *   `passengers/{passengerId}`
*   **routes**: Armazena informações sobre as rotas.
    *   `routes/{routeId}`
*   **route_points**: Armazena informações sobre os pontos de uma rota.
    *   `route_points/{routePointId}`
*   **route_instances**: Armazena informações sobre as instâncias de uma rota.
    *   `route_instances/{routeInstanceId}`
*   **checkins**: Armazena informações sobre os check-ins dos passageiros.
    *   `checkins/{checkinId}`
*   **telemetry**: Armazena informações de telemetria dos veículos.
    *   `telemetry/{telemetryId}`
