import type { PetType } from './auth';

export type PlaceType = 'Shop' | 'DogPark' | 'Vet' | 'EmergencyVet';

export type PlaceSummary = {
  id: string;
  type: PlaceType;
  name: string;
  address: string | null;
  latitude: number;
  longitude: number;
  distanceKm: number | null;
  isOpen24h: boolean;
  servesPetTypes: PetType[];
  avgRating: number | null;
  reviewCount: number;
};

export type WalkerSummary = {
  id: string;
  name: string;
  bio: string | null;
  pricePerWalk: number;
  serviceRadiusKm: number;
  latitude: number;
  longitude: number;
  distanceKm: number | null;
  avgRating: number | null;
  reviewCount: number;
};

export type HomeResponse = {
  petType: PetType;
  features: string[];
  shops: PlaceSummary[];
  dogParks: PlaceSummary[];
  vets: PlaceSummary[];
  walkers: WalkerSummary[];
};

export type ReminderItem = {
  id: string;
  title: string;
  dueAt: string;
  isDone?: boolean;
  petName?: string | null;
};

export type PlaceDetailT = PlaceSummary & {
  description: string | null;
  city: string | null;
  websiteUrl: string | null;
  phone: string | null;
  workingHours: { day: string; opens: string; closes: string }[];
};

export type Review = {
  id: string;
  userId: string;
  userName: string;
  targetType: 'Place' | 'Walker';
  targetId: string;
  rating: number;
  comment: string | null;
  createdAt: string;
};

export type Paged<T> = { items: T[]; page: number; pageSize: number; total: number };
