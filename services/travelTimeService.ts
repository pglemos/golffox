
import { google } from 'google-maps';

// Definição da interface para os dados de tempo de viagem
export interface TravelTimeData {
    origin: google.maps.LatLngLiteral;
    destination: google.maps.LatLngLiteral;
    travelTime: number; // em segundos
    distance: number; // em metros
}

class TravelTimeService {
    private distanceMatrixService: google.maps.DistanceMatrixService;

    constructor() {
        this.distanceMatrixService = new google.maps.DistanceMatrixService();
    }

    /**
     * Calcula o tempo de viagem e a distância entre uma origem e um destino.
     * @param origin - A coordenada de origem.
     * @param destination - A coordenada de destino.
     * @returns Uma promessa que resolve com os dados de tempo de viagem.
     */
    async getTravelTime(origin: google.maps.LatLngLiteral, destination: google.maps.LatLngLiteral): Promise<TravelTimeData> {
        return new Promise((resolve, reject) => {
            this.distanceMatrixService.getDistanceMatrix(
                {
                    origins: [origin],
                    destinations: [destination],
                    travelMode: google.maps.TravelMode.DRIVING,
                },
                (response, status) => {
                    if (status === google.maps.DistanceMatrixStatus.OK) {
                        const result = response.rows[0].elements[0];
                        if (result.status === google.maps.DistanceMatrixElementStatus.OK) {
                            resolve({
                                origin,
                                destination,
                                travelTime: result.duration.value, // Tempo em segundos
                                distance: result.distance.value, // Distância em metros
                            });
                        } else {
                            reject(`Erro ao calcular a distância: ${result.status}`);
                        }
                    } else {
                        reject(`Erro na API de Matriz de Distância: ${status}`);
                    }
                }
            );
        });
    }
}

export const travelTimeService = new TravelTimeService();
