export type StaffRole = 'manager' | 'front_desk' | 'housekeeping' | 'restaurant' | 'guest';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: StaffRole;
  active: boolean;
  department?: string;
}

export interface RoomType {
  id: string;
  name: string;
  code: string;
  capacity: number;
  baseRate: number;
  amenities: string[];
  photos: string[];
  description: string;
}

export type RoomStatus = 'clean' | 'dirty' | 'in_progress' | 'inspected' | 'out_of_service';

export interface Room {
  id: string;
  roomNumber: string;
  floor: number;
  roomTypeId: string;
  status: RoomStatus;
  outOfServiceReason?: string;
  outOfServiceStartDate?: string;
  outOfServiceEndDate?: string;
}

export interface RatePlan {
  id: string;
  name: string;
  roomTypeId: string;
  seasonalMultiplier: number;
  weekendMultiplier: number;
  startDate?: string;
  endDate?: string;
  active: boolean;
}

export interface ExtraService {
  id: string;
  name: string;
  category: 'Dining' | 'Laundry' | 'Transport' | 'Spa' | 'Miscellaneous';
  price: number;
  gstRate: number;
}

export type IDType = 'Aadhaar' | 'Passport' | 'Driving License' | 'Voter ID';

export interface Guest {
  id: string;
  name: string;
  phone: string;
  email: string;
  idType: IDType;
  idNumber: string;
  idPhotoUrl?: string;
  address: string;
  city: string;
  vip: boolean;
  notes?: string;
  createdAt: string;
}

export type BookingStatus = 'reserved' | 'checked_in' | 'checked_out' | 'cancelled' | 'no_show';

export interface Booking {
  id: string;
  bookingReference: string;
  guestId: string;
  guestName: string;
  guestPhone: string;
  guestEmail: string;
  guestCity?: string;
  idType?: IDType;
  idNumber?: string;
  idPhotoUrl?: string;
  roomTypeId: string;
  roomId: string | null;
  checkInDate: string; // YYYY-MM-DD
  checkOutDate: string; // YYYY-MM-DD
  adults: number;
  children: number;
  status: BookingStatus;
  ratePerNight: number;
  totalNights: number;
  roomCharges: number;
  taxAmount: number;
  totalAmount: number;
  advancePaid: number;
  specialRequests?: string;
  createdAt: string;
  checkedInAt?: string;
  checkedOutAt?: string;
  cancellationReason?: string;
  cancelledAt?: string;
}

export type FolioLineType = 'room' | 'restaurant' | 'service' | 'tax' | 'discount' | 'late_checkout';

export interface FolioLine {
  id: string;
  folioId: string;
  date: string;
  type: FolioLineType;
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  taxAmount: number;
  totalAmount: number;
  referenceId?: string;
  createdByStaff: string;
  createdAt: string;
}

export type PaymentMethod = 'cash' | 'upi' | 'card' | 'bank_transfer';

export interface Payment {
  id: string;
  folioId: string;
  amount: number;
  method: PaymentMethod;
  reference?: string;
  staffName: string;
  notes?: string;
  isRefund: boolean;
  createdAt: string;
}

export interface Folio {
  id: string;
  bookingId: string;
  guestId: string;
  status: 'open' | 'settled' | 'closed';
  lines: FolioLine[];
  payments: Payment[];
}

export interface Invoice {
  id: string;
  invoiceNumber: string; // e.g. INV-2026-0001
  isCreditNote: boolean;
  originalInvoiceId?: string;
  bookingId: string;
  folioId: string;
  guestName: string;
  guestPhone: string;
  guestAddress?: string;
  guestGstin?: string;
  hotelGstin: string;
  date: string;
  subtotal: number;
  cgst: number;
  sgst: number;
  igst: number;
  total: number;
  paymentStatus: 'paid' | 'credit';
  lines: {
    description: string;
    sacCode: string;
    qty: number;
    rate: number;
    amount: number;
    taxRate: number;
    taxAmount: number;
  }[];
}

export type MenuCategory = 'Starters' | 'Mains' | 'Breads & Rice' | 'Beverages' | 'Desserts';

export interface MenuItem {
  id: string;
  name: string;
  category: MenuCategory;
  price: number;
  gstRate: number;
  isAvailable: boolean;
  description: string;
}

export type OrderStatus = 'received' | 'preparing' | 'ready' | 'delivered' | 'cancelled';

export interface OrderLine {
  id: string;
  menuItemId: string;
  name: string;
  quantity: number;
  price: number;
  total: number;
}

export interface RestaurantOrder {
  id: string;
  orderNumber: string;
  orderType: 'table' | 'room';
  tableNumber?: string;
  roomNumber?: string;
  guestName?: string;
  bookingId?: string;
  status: OrderStatus;
  items: OrderLine[];
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  paymentMethod?: 'room_folio' | 'cash' | 'upi' | 'card';
  isSettled: boolean;
  createdAt: string;
}

export type HousekeepingPriority = 'high' | 'normal' | 'low';
export type HousekeepingTaskType = 'checkout_clean' | 'stayover_clean' | 'deep_clean' | 'inspection';
export type HousekeepingTaskStatus = 'pending' | 'in_progress' | 'completed' | 'inspected';

export interface HousekeepingTask {
  id: string;
  roomId: string;
  roomNumber: string;
  type: HousekeepingTaskType;
  priority: HousekeepingPriority;
  status: HousekeepingTaskStatus;
  assignedStaffName?: string;
  notes?: string;
  startedAt?: string;
  completedAt?: string;
  inspectedAt?: string;
  inspectedByStaffName?: string;
}

export type MaintenancePriority = 'urgent' | 'high' | 'medium' | 'low';
export type MaintenanceStatus = 'open' | 'in_progress' | 'resolved';

export interface MaintenanceIssue {
  id: string;
  roomId: string;
  roomNumber: string;
  title: string;
  description: string;
  photoUrl?: string;
  reportedBy: string;
  reportedAt: string;
  priority: MaintenancePriority;
  status: MaintenanceStatus;
  blockedRoom: boolean;
  blockedStartDate?: string;
  blockedEndDate?: string;
  resolvedAt?: string;
  resolutionNotes?: string;
}

export type AuditAction = 
  | 'rate_change' 
  | 'discount_applied' 
  | 'cancellation' 
  | 'refund' 
  | 'invoice_credit_note' 
  | 'room_status_change' 
  | 'setting_update'
  | 'check_in'
  | 'check_out';

export interface AuditLog {
  id: string;
  timestamp: string;
  staffName: string;
  staffRole: StaffRole;
  action: AuditAction;
  details: string;
  previousValue?: string;
  newValue?: string;
}

export type ApprovalType = 'discount' | 'refund' | 'invoice_correction';
export type ApprovalStatus = 'pending' | 'approved' | 'rejected';

export interface ApprovalRequest {
  id: string;
  type: ApprovalType;
  requestedBy: string;
  requestedAt: string;
  amount: number;
  details: string;
  status: ApprovalStatus;
  reviewedBy?: string;
  reviewedAt?: string;
  referenceId: string;
}

export interface GSTSlab {
  minTariff: number;
  maxTariff: number;
  gstRate: number; // e.g. 12 or 18
}

export interface Settings {
  hotelName: string;
  hotelTagline: string;
  hotelAddress: string;
  hotelCity: string;
  hotelState: string;
  hotelPincode: string;
  hotelPhone: string;
  hotelEmail: string;
  hotelGstin: string;
  invoicePrefix: string;
  creditNotePrefix: string;
  nextInvoiceNumber: number;
  nextCreditNoteNumber: number;
  defaultCheckInTime: string;
  defaultCheckOutTime: string;
  lateCheckOutFeePerHour: number;
  cancellationFreeHours: number;
  maxDiscountPercentWithoutApproval: number;
  gstSlabs: GSTSlab[];
  sacCodeAccommodation: string;
  sacCodeRestaurant: string;
  sacCodeServices: string;
}
