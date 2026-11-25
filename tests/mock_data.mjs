// mock-data.mjs — paste into tests or a dev-only seed file
export const PROFILES = [
  { id: '11111111-1111-1111-1111-111111111111', full_name: 'Slim Selmi',    role: 'admin',  created_at: '2026-11-01T10:00:00Z' },
  { id: '22222222-2222-2222-2222-222222222222', full_name: 'Hazem Bellili', role: 'client', created_at: '2026-11-02T11:30:00Z' },
  { id: '33333333-3333-3333-3333-333333333333', full_name: 'Wassim Hajji',  role: 'client', created_at: '2026-11-03T09:15:00Z' },
  { id: '44444444-4444-4444-4444-444444444444', full_name: 'Ines Trabelsi', role: 'client', created_at: '2026-11-10T14:45:00Z' },
  { id: '55555555-5555-5555-5555-555555555555', full_name: 'Karim Ben Ali', role: 'client', created_at: '2026-11-15T18:20:00Z' },
];

export const TABLES = [
  { id: 1,  zone: 'fenêtre',  capacity: 2, features: ['window', 'quiet'] },
  { id: 2,  zone: 'fenêtre',  capacity: 4, features: ['window'] },
  { id: 3,  zone: 'fenêtre',  capacity: 2, features: ['window', 'banquette'] },
  { id: 4,  zone: 'coin',     capacity: 4, features: ['corner', 'quiet'] },
  { id: 5,  zone: 'coin',     capacity: 2, features: ['corner'] },
  { id: 6,  zone: 'banquette',capacity: 6, features: ['banquette'] },
  { id: 7,  zone: 'banquette',capacity: 4, features: ['banquette', 'quiet'] },
  { id: 8,  zone: 'bar',      capacity: 2, features: ['bar'] },
  { id: 9,  zone: 'bar',      capacity: 2, features: ['bar'] },
  { id: 10, zone: 'bar',      capacity: 4, features: ['bar'] },
  { id: 11, zone: 'salle',    capacity: 4, features: [] },
  { id: 12, zone: 'salle',    capacity: 2, features: [] },
  { id: 13, zone: 'salle',    capacity: 6, features: ['quiet'] },
  { id: 14, zone: 'salle',    capacity: 4, features: [] },
  { id: 15, zone: 'salle',    capacity: 2, features: [] },
  { id: 16, zone: 'terrasse', capacity: 4, features: ['window'] },
  { id: 17, zone: 'terrasse', capacity: 2, features: ['window'] },
  { id: 18, zone: 'terrasse', capacity: 6, features: ['quiet'] },
  { id: 19, zone: 'bar',      capacity: 2, features: ['bar'] },
  { id: 20, zone: 'coin',     capacity: 4, features: ['corner', 'quiet'] },
];

// tests/mock-data.mjs — replace RESERVATIONS with:
export const RESERVATIONS = [
  // free: table 1, 2, 5, 6, 8, 10, 11, 12, 14, 15, 16, 17, 19, 20
  // reserved (yellow):
  { id: 1, table_id: 3,  user_id: PROFILES[1].id, guest_name: 'Hazem Bellili', status: 'confirmed', created_at: '2026-11-20T19:00:00Z' },
  { id: 2, table_id: 7,  user_id: PROFILES[2].id, guest_name: 'Wassim Hajji',  status: 'confirmed', created_at: '2026-11-21T20:30:00Z' },
  { id: 3, table_id: 13, user_id: PROFILES[3].id, guest_name: 'Ines Trabelsi', status: 'confirmed', created_at: '2026-11-22T12:15:00Z' },
  // occupied (red):
  { id: 4, table_id: 4,  user_id: PROFILES[0].id, guest_name: 'Slim Selmi',    status: 'occupied',  created_at: '2026-11-24T20:00:00Z' },
  { id: 5, table_id: 18, user_id: PROFILES[4].id, guest_name: 'Karim Ben Ali', status: 'occupied',  created_at: '2026-11-23T21:00:00Z' },
  // cancelled — should NOT colour the table
  { id: 6, table_id: 9,  user_id: PROFILES[2].id, guest_name: 'Wassim Hajji',  status: 'cancelled', created_at: '2026-11-19T13:45:00Z' },
];