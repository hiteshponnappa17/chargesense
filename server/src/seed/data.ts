import type { ConnectorType, ChargerStatus, Amenity, Role } from '../utils/constants';

export interface SeedCar {
  brand: string;
  model: string;
  batteryCapacityKWh: number;
  supportedConnectors: ConnectorType[];
  maxChargingPowerKW: number;
  rangeKm: number;
  imageColor: string;
}

export interface SeedUser {
  key: string;
  name: string;
  email: string;
  phone: string;
  role: Role;
}

export interface SeedCharger {
  key: string;
  ownerKey: string;
  name: string;
  description: string;
  address: string;
  city: string;
  latitude: number;
  longitude: number;
  connectorType: ConnectorType;
  powerKW: number;
  pricePerKWh: number;
  availableFrom: string;
  availableUntil: string;
  amenities: Amenity[];
  status: ChargerStatus;
  rating: number;
  reviewCount: number;
}

// Realistic Indian EV specifications (approximate, for demo/estimation only).
export const SEED_CARS: SeedCar[] = [
  {
    brand: 'Tata',
    model: 'Nexon EV',
    batteryCapacityKWh: 40.5,
    supportedConnectors: ['CCS', 'Type 2'],
    maxChargingPowerKW: 50,
    rangeKm: 437,
    imageColor: '#0ea5e9',
  },
  {
    brand: 'Tata',
    model: 'Punch EV',
    batteryCapacityKWh: 35,
    supportedConnectors: ['CCS', 'Type 2'],
    maxChargingPowerKW: 50,
    rangeKm: 421,
    imageColor: '#8b5cf6',
  },
  {
    brand: 'MG',
    model: 'ZS EV',
    batteryCapacityKWh: 50.3,
    supportedConnectors: ['CCS', 'Type 2'],
    maxChargingPowerKW: 76,
    rangeKm: 461,
    imageColor: '#ef4444',
  },
  {
    brand: 'Hyundai',
    model: 'Ioniq 5',
    batteryCapacityKWh: 72.6,
    supportedConnectors: ['CCS', 'Type 2'],
    maxChargingPowerKW: 220,
    rangeKm: 631,
    imageColor: '#14b8a6',
  },
  {
    brand: 'Mahindra',
    model: 'XUV400',
    batteryCapacityKWh: 39.4,
    supportedConnectors: ['CCS', 'Type 2'],
    maxChargingPowerKW: 50,
    rangeKm: 456,
    imageColor: '#f59e0b',
  },
  {
    brand: 'BYD',
    model: 'Atto 3',
    batteryCapacityKWh: 60.48,
    supportedConnectors: ['CCS', 'Type 2'],
    maxChargingPowerKW: 88,
    rangeKm: 521,
    imageColor: '#22c55e',
  },
];

export const SEED_USERS: SeedUser[] = [
  { key: 'host1', name: 'Ravi Kumar', email: 'host@example.com', phone: '+91 98450 11223', role: 'host' },
  { key: 'host2', name: 'Anita Rao', email: 'host2@example.com', phone: '+91 98450 44556', role: 'host' },
  { key: 'driver1', name: 'Meera Nair', email: 'driver@example.com', phone: '+91 99860 77889', role: 'driver' },
  { key: 'driver2', name: 'Arjun Shetty', email: 'driver2@example.com', phone: '+91 99860 33110', role: 'driver' },
];

export const SEED_CHARGERS: SeedCharger[] = [
  {
    key: 'c1',
    ownerKey: 'host1',
    name: 'GreenVolt Home Charger',
    description: 'Reliable home charger in a quiet residential lane with easy street parking and covered bay.',
    address: '2nd Main, Vijayanagar 2nd Stage',
    city: 'Mysuru',
    latitude: 12.3099,
    longitude: 76.6206,
    connectorType: 'Type 2',
    powerKW: 7.4,
    pricePerKWh: 9.5,
    availableFrom: '06:00',
    availableUntil: '23:00',
    amenities: ['Parking', 'Covered'],
    status: 'active',
    rating: 4.7,
    reviewCount: 42,
  },
  {
    key: 'c2',
    ownerKey: 'host1',
    name: 'Hebbal FastCharge Hub',
    description: 'DC fast charging hub near the industrial area. Grab a coffee while you charge in minutes.',
    address: 'Hebbal Industrial Area, Ring Road',
    city: 'Mysuru',
    latitude: 12.3479,
    longitude: 76.6337,
    connectorType: 'CCS',
    powerKW: 50,
    pricePerKWh: 18,
    availableFrom: '05:00',
    availableUntil: '23:00',
    amenities: ['Parking', 'Security Camera', 'Cafe', 'Wi-Fi'],
    status: 'active',
    rating: 4.8,
    reviewCount: 88,
  },
  {
    key: 'c3',
    ownerKey: 'host1',
    name: 'Kuvempu EcoCharge',
    description: 'Neighbourhood AC charger with fast Wi-Fi. Ideal for a top-up while you run errands.',
    address: '9th Cross, Kuvempunagar',
    city: 'Mysuru',
    latitude: 12.2836,
    longitude: 76.6142,
    connectorType: 'Type 2',
    powerKW: 11,
    pricePerKWh: 11,
    availableFrom: '07:00',
    availableUntil: '22:00',
    amenities: ['Parking', 'Wi-Fi'],
    status: 'active',
    rating: 4.5,
    reviewCount: 29,
  },
  {
    key: 'c4',
    ownerKey: 'host1',
    name: 'Saraswathi PowerPoint',
    description: 'Secure covered charging with CCTV in a central location. Great for medium top-ups.',
    address: 'Chamundipuram Main Rd, Saraswathipuram',
    city: 'Mysuru',
    latitude: 12.3086,
    longitude: 76.6431,
    connectorType: 'CCS',
    powerKW: 22,
    pricePerKWh: 14.5,
    availableFrom: '06:00',
    availableUntil: '22:00',
    amenities: ['Parking', 'Covered', 'Security Camera'],
    status: 'active',
    rating: 4.6,
    reviewCount: 51,
  },
  {
    key: 'c5',
    ownerKey: 'host2',
    name: 'JLB Rapid Charger',
    description: 'CHAdeMO rapid charging beside a popular cafe. Perfect for older fast-charge EVs.',
    address: 'JLB Road, Jayalakshmipuram',
    city: 'Mysuru',
    latitude: 12.3169,
    longitude: 76.6289,
    connectorType: 'CHAdeMO',
    powerKW: 50,
    pricePerKWh: 19,
    availableFrom: '06:00',
    availableUntil: '23:00',
    amenities: ['Parking', 'Cafe'],
    status: 'active',
    rating: 4.4,
    reviewCount: 33,
  },
  {
    key: 'c6',
    ownerKey: 'host2',
    name: 'Bannur Road SuperCharge',
    description: 'High-power CCS charging on the highway edge with round-the-clock access and security.',
    address: 'Bannur Road, near Outer Ring Road',
    city: 'Mysuru',
    latitude: 12.2795,
    longitude: 76.6786,
    connectorType: 'CCS',
    powerKW: 50,
    pricePerKWh: 17.5,
    availableFrom: '05:00',
    availableUntil: '23:30',
    amenities: ['Parking', '24/7 Access', 'Wi-Fi'],
    status: 'active',
    rating: 4.3,
    reviewCount: 61,
  },
  {
    key: 'c7',
    ownerKey: 'host1',
    name: 'Gokulam Slow & Steady',
    description: 'Budget-friendly slow charger for overnight-style top-ups in a leafy neighbourhood.',
    address: '3rd Stage, Gokulam',
    city: 'Mysuru',
    latitude: 12.3255,
    longitude: 76.636,
    connectorType: 'Type 2',
    powerKW: 3.3,
    pricePerKWh: 8,
    availableFrom: '08:00',
    availableUntil: '20:00',
    amenities: ['Parking'],
    status: 'active',
    rating: 4.2,
    reviewCount: 18,
  },
  {
    key: 'c8',
    ownerKey: 'host1',
    name: 'City Center Charge Bay',
    description: 'Convenient covered bay in the heart of the city — currently down for scheduled maintenance.',
    address: 'Nazarbad Main Road',
    city: 'Mysuru',
    latitude: 12.2958,
    longitude: 76.6394,
    connectorType: 'Type 2',
    powerKW: 22,
    pricePerKWh: 13,
    availableFrom: '06:00',
    availableUntil: '23:00',
    amenities: ['Parking', 'Covered', 'Security Camera', 'Wi-Fi'],
    status: 'maintenance',
    rating: 4.6,
    reviewCount: 47,
  },
  {
    key: 'c9',
    ownerKey: 'host2',
    name: 'Metagalli Depot Charger',
    description: 'Depot-side charger temporarily de-listed by the host. Will be back online soon.',
    address: 'Metagalli Industrial Layout',
    city: 'Mysuru',
    latitude: 12.352,
    longitude: 76.622,
    connectorType: 'CCS',
    powerKW: 11,
    pricePerKWh: 12.5,
    availableFrom: '06:00',
    availableUntil: '22:00',
    amenities: ['Parking'],
    status: 'inactive',
    rating: 4.1,
    reviewCount: 12,
  },
];

export const DEMO_PASSWORD = 'password123';
