export interface AmenityItem {
  id: string;
  name: string;
  icon?: string;
  description?: string;
}

export interface RoomItem {
  id: string;
  name: string;
  roomCode: string;
  capacity: number;
  floor?: string;
  location?: string;
  description?: string;
  imageUrl?: string;
  status: 'AVAILABLE' | 'MAINTENANCE' | 'INACTIVE';
  amenities: {
    amenity: AmenityItem;
    quantity: number;
  }[];
  // สถานะคำนวณตามเวลาปัจจุบัน
  currentMeeting?: {
    id: string;
    title: string;
    userName: string;
    startTime: string;
    endTime: string;
  } | null;
  isCurrentlyOccupied?: boolean;
}
