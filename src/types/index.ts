// Pet types
export type PetType = "dog" | "cat";

export interface Pet {
  id: string;
  name: string;
  type: PetType;
  breed?: string;
  size?: "small" | "medium" | "large";
  notes?: string;
}

// Service types
export interface GroomingService {
  id: string;
  name: string;
  description: string;
  petType: PetType;
  durationMinutes: number;
  basePrice: number;
}

// Booking types
export interface Booking {
  id: string;
  customerId: string;
  petId: string;
  serviceId: string;
  scheduledAt: Date;
  address: string;
  status: "pending" | "confirmed" | "completed" | "cancelled";
  notes?: string;
}
