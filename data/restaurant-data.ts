import { RestaurantData } from "../types/restaurant";

export const restaurantData: RestaurantData = {
  name: "Le Gourmet XR",
  tables: [
    { id: "t1", name: "Table 1", position: [-4, 0, -3], seats: 2, status: "available", zone: "Fenêtre" },
    { id: "t2", name: "Table 2", position: [-2, 0, -3], seats: 4, status: "available", zone: "Fenêtre" },
    { id: "t3", name: "Table 3", position: [0, 0, -3], seats: 2, status: "available", zone: "Fenêtre" },
    { id: "t4", name: "Table 4", position: [-4, 0, 0], seats: 4, status: "occupied", zone: "Centre" },
    { id: "t5", name: "Table 5", position: [-2, 0, 0], seats: 6, status: "reserved", zone: "Centre" },
    { id: "t6", name: "Table 6", position: [0, 0, 0], seats: 2, status: "available", zone: "Centre" },
    { id: "t7", name: "Table 7", position: [-4, 0, 3], seats: 4, status: "occupied", zone: "Terrasse" },
    { id: "t8", name: "Table 8", position: [-2, 0, 3], seats: 2, status: "available", zone: "Terrasse" },
    { id: "t9", name: "Table 9", position: [0, 0, 3], seats: 4, status: "reserved", zone: "Terrasse" },
  ],
};

export const statusColors: Record<string, string> = {
  available: "#00ff00",
  reserved: "#ffaa00",
  occupied: "#ff0000",
  unavailable: "#888888",
};

export const statusLabels: Record<string, string> = {
  available: "Disponible",
  reserved: "Réservée",
  occupied: "Occupée",
  unavailable: "Indisponible",
};