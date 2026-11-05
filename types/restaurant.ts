export type TableStatus = "available" | "reserved" | "occupied" | "unavailable";

export interface TableData {
  id: string;
  name: string;
  position: [number, number, number];
  seats: number;
  status: TableStatus;
  zone: string;
}

export interface RestaurantData {
  name: string;
  tables: TableData[];
}