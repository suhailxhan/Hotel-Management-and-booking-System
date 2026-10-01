import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  User,
  StaffRole,
  RoomType,
  Room,
  RoomStatus,
  Guest,
  Booking,
  BookingStatus,
  Folio,
  FolioLine,
  Payment,
  PaymentMethod,
  Invoice,
  MenuItem,
  RestaurantOrder,
  OrderStatus,
  HousekeepingTask,
  HousekeepingTaskStatus,
  MaintenanceIssue,
  AuditLog,
  AuditAction,
  ApprovalRequest,
  Settings,
  ExtraService,
  IDType,
} from '../types/index.ts';
import {
  initialSettings,
  initialUsers,
  initialRoomTypes,
  initialRooms,
  initialExtraServices,
  initialMenuItems,
  initialGuests,
  initialBookings,
  initialFolios,
  initialInvoices,
  initialRestaurantOrders,
  initialHousekeepingTasks,
  initialMaintenanceIssues,
  initialAuditLogs,
  initialApprovals,
} from '../data/seedData.ts';
import {
  isRoomAvailableForDates,
  canRoomBeAssignedForCheckIn,
  calculateBookingTotal,
  calculateTaxBreakdown,
  calculateCancellationFee,
  generateInvoiceNumber,
  generateCreditNoteNumber,
} from '../utils/calculations.ts';
import { toISODateString } from '../utils/formatters.ts';
import { ToastContainer, ToastMessage } from '../components/common/Toast.tsx';

interface HotelContextType {
  // Current session
  currentUser: User;
  currentRole: StaffRole;
  setCurrentRole: (role: StaffRole) => void;
  switchUser: (userId: string) => void;

  // Data
  settings: Settings;
  users: User[];
  roomTypes: RoomType[];
  rooms: Room[];
  extraServices: ExtraService[];
  guests: Guest[];
  bookings: Booking[];
  folios: Folio[];
  invoices: Invoice[];
  menuItems: MenuItem[];
  restaurantOrders: RestaurantOrder[];
  housekeepingTasks: HousekeepingTask[];
  maintenanceIssues: MaintenanceIssue[];
  auditLogs: AuditLog[];
  approvals: ApprovalRequest[];
  toasts: ToastMessage[];

  // Actions
  addToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  dismissToast: (id: string) => void;
  addAuditLog: (action: AuditAction, details: string, previousValue?: string, newValue?: string) => void;

  // Bookings
  createBooking: (
    bookingData: {
      guestName: string;
      guestPhone: string;
      guestEmail: string;
      guestCity?: string;
      roomTypeId: string;
      roomId: string | null;
      checkInDate: string;
      checkOutDate: string;
      adults: number;
      children: number;
      advancePaid: number;
      specialRequests?: string;
    }
  ) => { success: boolean; booking?: Booking; error?: string };
  updateBooking: (bookingId: string, updates: Partial<Booking>) => { success: boolean; error?: string };
  cancelBooking: (bookingId: string, reason: string) => { success: boolean; error?: string; refundAmount?: number };
  assignRoomToBooking: (bookingId: string, roomId: string) => { success: boolean; error?: string };
  checkInGuest: (
    bookingId: string,
    idData: { idType: IDType; idNumber: string; idPhotoUrl?: string },
    roomId: string,
    depositAmount: number,
    paymentMethod: PaymentMethod
  ) => { success: boolean; error?: string };
  checkOutGuest: (
    bookingId: string,
    paymentMethod?: PaymentMethod,
    lateFeeHours?: number
  ) => { success: boolean; invoice?: Invoice; error?: string };

  // Folios
  getFolioByBookingId: (bookingId: string) => Folio | undefined;
  addFolioLine: (folioId: string, line: Omit<FolioLine, 'id' | 'createdAt' | 'createdByStaff'>) => void;
  addPayment: (folioId: string, payment: Omit<Payment, 'id' | 'createdAt' | 'staffName'>) => void;
  issueCreditNote: (invoiceId: string, reason: string, refundAmount: number) => { success: boolean; creditNote?: Invoice; error?: string };

  // Housekeeping & Rooms
  updateRoomStatus: (
    roomId: string,
    status: RoomStatus,
    reason?: string,
    startDate?: string,
    endDate?: string
  ) => void;
  updateHousekeepingTask: (taskId: string, status: HousekeepingTaskStatus, notes?: string) => void;
  createHousekeepingTask: (task: Omit<HousekeepingTask, 'id'>) => void;
  logMaintenanceIssue: (issue: Omit<MaintenanceIssue, 'id' | 'reportedAt' | 'reportedBy' | 'status'>) => void;
  resolveMaintenanceIssue: (issueId: string, notes: string) => void;

  // Restaurant
  createRestaurantOrder: (order: Omit<RestaurantOrder, 'id' | 'orderNumber' | 'createdAt' | 'isSettled'>) => RestaurantOrder;
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;
  settleRestaurantOrderToRoom: (orderId: string, bookingId: string) => { success: boolean; error?: string };
  toggleMenuItemAvailability: (itemId: string) => void;
  saveMenuItem: (item: MenuItem) => void;

  // Manager & Settings
  updateSettings: (newSettings: Settings) => void;
  saveRoomType: (roomType: RoomType) => void;
  saveRoom: (room: Room) => void;
  saveStaffUser: (user: User) => void;
  toggleStaffActive: (userId: string) => void;
  createApprovalRequest: (request: Omit<ApprovalRequest, 'id' | 'requestedAt' | 'requestedBy' | 'status'>) => void;
  respondToApproval: (approvalId: string, approved: boolean) => void;
  resetToSeedData: () => void;
}

const HotelContext = createContext<HotelContextType | undefined>(undefined);

const STORAGE_KEY = 'hms_database_state_v1';

export const HotelProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load initial state or cached state from localStorage
  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_users`);
    return saved ? JSON.parse(saved) : initialUsers;
  });

  const [currentUser, setCurrentUser] = useState<User>(() => users[1] || initialUsers[1]); // Default to Priya Nair (Front Desk)
  const [currentRole, setCurrentRoleState] = useState<StaffRole>(currentUser.role);

  const [settings, setSettings] = useState<Settings>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_settings`);
    return saved ? JSON.parse(saved) : initialSettings;
  });

  const [roomTypes, setRoomTypes] = useState<RoomType[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_roomTypes`);
    return saved ? JSON.parse(saved) : initialRoomTypes;
  });

  const [rooms, setRooms] = useState<Room[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_rooms`);
    return saved ? JSON.parse(saved) : initialRooms;
  });

  const [extraServices, setExtraServices] = useState<ExtraService[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_services`);
    return saved ? JSON.parse(saved) : initialExtraServices;
  });

  const [guests, setGuests] = useState<Guest[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_guests`);
    return saved ? JSON.parse(saved) : initialGuests;
  });

  const [bookings, setBookings] = useState<Booking[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_bookings`);
    return saved ? JSON.parse(saved) : initialBookings;
  });

  const [folios, setFolios] = useState<Folio[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_folios`);
    return saved ? JSON.parse(saved) : initialFolios;
  });

  const [invoices, setInvoices] = useState<Invoice[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_invoices`);
    return saved ? JSON.parse(saved) : initialInvoices;
  });

  const [menuItems, setMenuItems] = useState<MenuItem[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_menu`);
    return saved ? JSON.parse(saved) : initialMenuItems;
  });

  const [restaurantOrders, setRestaurantOrders] = useState<RestaurantOrder[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_orders`);
    return saved ? JSON.parse(saved) : initialRestaurantOrders;
  });

  const [housekeepingTasks, setHousekeepingTasks] = useState<HousekeepingTask[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_hk`);
    return saved ? JSON.parse(saved) : initialHousekeepingTasks;
  });

  const [maintenanceIssues, setMaintenanceIssues] = useState<MaintenanceIssue[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_maint`);
    return saved ? JSON.parse(saved) : initialMaintenanceIssues;
  });

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_audit`);
    return saved ? JSON.parse(saved) : initialAuditLogs;
  });

  const [approvals, setApprovals] = useState<ApprovalRequest[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_approvals`);
    return saved ? JSON.parse(saved) : initialApprovals;
  });

  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Persist to localStorage on state changes
  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_users`, JSON.stringify(users));
    localStorage.setItem(`${STORAGE_KEY}_settings`, JSON.stringify(settings));
    localStorage.setItem(`${STORAGE_KEY}_roomTypes`, JSON.stringify(roomTypes));
    localStorage.setItem(`${STORAGE_KEY}_rooms`, JSON.stringify(rooms));
    localStorage.setItem(`${STORAGE_KEY}_services`, JSON.stringify(extraServices));
    localStorage.setItem(`${STORAGE_KEY}_guests`, JSON.stringify(guests));
    localStorage.setItem(`${STORAGE_KEY}_bookings`, JSON.stringify(bookings));
    localStorage.setItem(`${STORAGE_KEY}_folios`, JSON.stringify(folios));
    localStorage.setItem(`${STORAGE_KEY}_invoices`, JSON.stringify(invoices));
    localStorage.setItem(`${STORAGE_KEY}_menu`, JSON.stringify(menuItems));
    localStorage.setItem(`${STORAGE_KEY}_orders`, JSON.stringify(restaurantOrders));
    localStorage.setItem(`${STORAGE_KEY}_hk`, JSON.stringify(housekeepingTasks));
    localStorage.setItem(`${STORAGE_KEY}_maint`, JSON.stringify(maintenanceIssues));
    localStorage.setItem(`${STORAGE_KEY}_audit`, JSON.stringify(auditLogs));
    localStorage.setItem(`${STORAGE_KEY}_approvals`, JSON.stringify(approvals));
  }, [
    users,
    settings,
    roomTypes,
    rooms,
    extraServices,
    guests,
    bookings,
    folios,
    invoices,
    menuItems,
    restaurantOrders,
    housekeepingTasks,
    maintenanceIssues,
    auditLogs,
    approvals,
  ]);

  const addToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const newToast: ToastMessage = {
      id: `toast-${Date.now()}-${Math.random()}`,
      message,
      type,
    };
    setToasts((prev) => [...prev, newToast]);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const addAuditLog = (
    action: AuditAction,
    details: string,
    previousValue?: string,
    newValue?: string
  ) => {
    const newLog: AuditLog = {
      id: `aud-${Date.now()}`,
      timestamp: new Date().toISOString(),
      staffName: currentUser.name,
      staffRole: currentRole,
      action,
      details,
      previousValue,
      newValue,
    };
    setAuditLogs((prev) => [newLog, ...prev]);
  };

  const setCurrentRole = (role: StaffRole) => {
    setCurrentRoleState(role);
    // Find matching default user for that role
    const matchedUser = users.find((u) => u.role === role && u.active);
    if (matchedUser) {
      setCurrentUser(matchedUser);
    }
  };

  const switchUser = (userId: string) => {
    const user = users.find((u) => u.id === userId);
    if (user) {
      setCurrentUser(user);
      setCurrentRoleState(user.role);
      addToast(`Switched user to ${user.name} (${user.role})`, 'info');
    }
  };

  // Transaction-safe booking creation
  const createBooking = (bookingData: {
    guestName: string;
    guestPhone: string;
    guestEmail: string;
    guestCity?: string;
    roomTypeId: string;
    roomId: string | null;
    checkInDate: string;
    checkOutDate: string;
    adults: number;
    children: number;
    advancePaid: number;
    specialRequests?: string;
  }) => {
    const {
      guestName,
      guestPhone,
      guestEmail,
      guestCity,
      roomTypeId,
      roomId,
      checkInDate,
      checkOutDate,
      adults,
      children,
      advancePaid,
      specialRequests,
    } = bookingData;

    // 1. Double-booking check if room is explicitly chosen
    if (roomId) {
      const room = rooms.find((r) => r.id === roomId);
      if (!room) {
        return { success: false, error: 'Selected room does not exist in inventory.' };
      }

      const available = isRoomAvailableForDates(roomId, checkInDate, checkOutDate, bookings);
      if (!available) {
        return {
          success: false,
          error: `Room ${room.roomNumber} is already booked for these dates. Choose another room or dates.`,
        };
      }
    }

    // 2. Calculate nights and pricing
    const roomType = roomTypes.find((rt) => rt.id === roomTypeId);
    if (!roomType) {
      return { success: false, error: 'Invalid room type.' };
    }

    const start = new Date(checkInDate);
    const end = new Date(checkOutDate);
    const nights = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
    const pricing = calculateBookingTotal(roomType.baseRate, nights, settings.gstSlabs);

    // 3. Find or create guest record
    let guest = guests.find((g) => g.phone === guestPhone);
    const guestId = guest ? guest.id : `gst-${Date.now()}`;
    if (!guest) {
      guest = {
        id: guestId,
        name: guestName,
        phone: guestPhone,
        email: guestEmail,
        idType: 'Aadhaar',
        idNumber: '',
        address: '',
        city: guestCity || 'India',
        vip: false,
        createdAt: toISODateString(new Date()),
      };
      setGuests((prev) => [...prev, guest!]);
    }

    // 4. Generate reference
    const bookingRef = `BK-${new Date().getFullYear()}-${1000 + bookings.length + 1}`;
    const newBookingId = `bk-${Date.now()}`;

    const newBooking: Booking = {
      id: newBookingId,
      bookingReference: bookingRef,
      guestId,
      guestName,
      guestPhone,
      guestEmail,
      guestCity: guestCity || guest.city,
      roomTypeId,
      roomId,
      checkInDate,
      checkOutDate,
      adults,
      children,
      status: 'reserved',
      ratePerNight: roomType.baseRate,
      totalNights: nights,
      roomCharges: pricing.subtotal,
      taxAmount: pricing.taxAmount,
      totalAmount: pricing.totalAmount,
      advancePaid,
      specialRequests,
      createdAt: new Date().toISOString(),
    };

    // 5. Open associated Folio
    const newFolioId = `fol-${Date.now()}`;
    const folioLines: FolioLine[] = [
      {
        id: `fl-${Date.now()}-1`,
        folioId: newFolioId,
        date: checkInDate,
        type: 'room',
        description: `Accommodation: ${roomType.name} (${nights} night${nights > 1 ? 's' : ''})`,
        quantity: nights,
        unitPrice: roomType.baseRate,
        taxRate: pricing.gstRate,
        taxAmount: pricing.taxAmount,
        totalAmount: pricing.totalAmount,
        createdByStaff: currentUser.name,
        createdAt: new Date().toISOString(),
      },
    ];

    const folioPayments: Payment[] = [];
    if (advancePaid > 0) {
      folioPayments.push({
        id: `pay-${Date.now()}-adv`,
        folioId: newFolioId,
        amount: advancePaid,
        method: 'upi',
        reference: `ADV/${bookingRef}`,
        staffName: currentUser.name,
        notes: 'Advance booking deposit',
        isRefund: false,
        createdAt: new Date().toISOString(),
      });
    }

    const newFolio: Folio = {
      id: newFolioId,
      bookingId: newBookingId,
      guestId,
      status: 'open',
      lines: folioLines,
      payments: folioPayments,
    };

    setBookings((prev) => [newBooking, ...prev]);
    setFolios((prev) => [newFolio, ...prev]);

    addAuditLog(
      'check_in',
      `Created booking ${bookingRef} for ${guestName} (${roomType.name}, ${checkInDate} to ${checkOutDate}).`
    );
    addToast(`Booking ${bookingRef} created successfully`, 'success');

    return { success: true, booking: newBooking };
  };

  const updateBooking = (bookingId: string, updates: Partial<Booking>) => {
    const existing = bookings.find((b) => b.id === bookingId);
    if (!existing) return { success: false, error: 'Booking not found.' };

    // If changing room or dates, verify availability
    const targetRoomId = updates.roomId !== undefined ? updates.roomId : existing.roomId;
    const targetCheckIn = updates.checkInDate || existing.checkInDate;
    const targetCheckOut = updates.checkOutDate || existing.checkOutDate;

    if (targetRoomId) {
      const available = isRoomAvailableForDates(
        targetRoomId,
        targetCheckIn,
        targetCheckOut,
        bookings,
        bookingId
      );
      if (!available) {
        return {
          success: false,
          error: 'The assigned room is not available for the updated date range.',
        };
      }
    }

    setBookings((prev) =>
      prev.map((b) => (b.id === bookingId ? { ...b, ...updates } : b))
    );

    addAuditLog(
      'rate_change',
      `Updated booking ${existing.bookingReference}. Changed fields: ${Object.keys(updates).join(', ')}.`
    );
    addToast(`Booking ${existing.bookingReference} updated`, 'success');
    return { success: true };
  };

  const cancelBooking = (bookingId: string, reason: string) => {
    const booking = bookings.find((b) => b.id === bookingId);
    if (!booking) return { success: false, error: 'Booking not found.' };

    const cancelCalc = calculateCancellationFee(booking, new Date(), settings);

    setBookings((prev) =>
      prev.map((b) =>
        b.id === bookingId
          ? {
              ...b,
              status: 'cancelled',
              cancellationReason: reason,
              cancelledAt: new Date().toISOString(),
            }
          : b
      )
    );

    // If refund is due, record refund payment line in folio
    const folio = folios.find((f) => f.bookingId === bookingId);
    if (folio && cancelCalc.refundAmount > 0) {
      const refundPay: Payment = {
        id: `pay-ref-${Date.now()}`,
        folioId: folio.id,
        amount: -cancelCalc.refundAmount,
        method: 'upi',
        reference: `REFUND/${booking.bookingReference}`,
        staffName: currentUser.name,
        notes: `Cancellation refund (${cancelCalc.explanation})`,
        isRefund: true,
        createdAt: new Date().toISOString(),
      };
      setFolios((prev) =>
        prev.map((f) =>
          f.id === folio.id
            ? { ...f, status: 'settled', payments: [...f.payments, refundPay] }
            : f
        )
      );
    }

    addAuditLog(
      'cancellation',
      `Cancelled booking ${booking.bookingReference}. Reason: ${reason}. Refund: ₹${cancelCalc.refundAmount.toLocaleString('en-IN')}.`
    );
    addToast(`Booking ${booking.bookingReference} cancelled. ${cancelCalc.explanation}`, 'info');

    return {
      success: true,
      refundAmount: cancelCalc.refundAmount,
    };
  };

  const assignRoomToBooking = (bookingId: string, roomId: string) => {
    const booking = bookings.find((b) => b.id === bookingId);
    if (!booking) return { success: false, error: 'Booking not found.' };

    const room = rooms.find((r) => r.id === roomId);
    if (!room) return { success: false, error: 'Room not found.' };

    const available = isRoomAvailableForDates(
      roomId,
      booking.checkInDate,
      booking.checkOutDate,
      bookings,
      bookingId
    );
    if (!available) {
      return {
        success: false,
        error: `Room ${room.roomNumber} is not available for ${booking.checkInDate} to ${booking.checkOutDate}.`,
      };
    }

    setBookings((prev) =>
      prev.map((b) => (b.id === bookingId ? { ...b, roomId } : b))
    );
    addToast(`Assigned Room ${room.roomNumber} to ${booking.guestName}`, 'success');
    return { success: true };
  };

  // Check In Guest: checks room cleanliness, captures ID, adds deposit, opens folio
  const checkInGuest = (
    bookingId: string,
    idData: { idType: IDType; idNumber: string; idPhotoUrl?: string },
    roomId: string,
    depositAmount: number,
    paymentMethod: PaymentMethod
  ) => {
    const booking = bookings.find((b) => b.id === bookingId);
    if (!booking) return { success: false, error: 'Booking not found.' };

    const room = rooms.find((r) => r.id === roomId);
    if (!room) return { success: false, error: 'Room not found.' };

    // Core rule: A room that is Dirty, In progress or Out of service cannot be assigned to an arriving guest!
    const readiness = canRoomBeAssignedForCheckIn(room);
    if (!readiness.allowed) {
      return { success: false, error: readiness.reason };
    }

    // Update guest ID info
    setGuests((prev) =>
      prev.map((g) =>
        g.id === booking.guestId
          ? {
              ...g,
              idType: idData.idType,
              idNumber: idData.idNumber,
              idPhotoUrl: idData.idPhotoUrl || g.idPhotoUrl,
            }
          : g
      )
    );

    // Update booking status
    setBookings((prev) =>
      prev.map((b) =>
        b.id === bookingId
          ? {
              ...b,
              status: 'checked_in',
              roomId,
              idType: idData.idType,
              idNumber: idData.idNumber,
              idPhotoUrl: idData.idPhotoUrl,
              advancePaid: b.advancePaid + depositAmount,
              checkedInAt: new Date().toISOString(),
            }
          : b
      )
    );

    // Record deposit payment in folio if collected
    if (depositAmount > 0) {
      const folio = folios.find((f) => f.bookingId === bookingId);
      if (folio) {
        const depositPay: Payment = {
          id: `pay-chk-${Date.now()}`,
          folioId: folio.id,
          amount: depositAmount,
          method: paymentMethod,
          reference: `CHECKIN-DEP/${booking.bookingReference}`,
          staffName: currentUser.name,
          notes: 'Deposit collected at check-in',
          isRefund: false,
          createdAt: new Date().toISOString(),
        };
        setFolios((prev) =>
          prev.map((f) =>
            f.id === folio.id ? { ...f, payments: [...f.payments, depositPay] } : f
          )
        );
      }
    }

    addAuditLog(
      'check_in',
      `Checked in ${booking.guestName} into Room ${room.roomNumber}. Verified ${idData.idType}: ${idData.idNumber}.`
    );
    addToast(`Checked in ${booking.guestName} into Room ${room.roomNumber}`, 'success');

    return { success: true };
  };

  // Check Out Guest: settles pending charges, takes payment, generates GST invoice, sets room to Dirty, creates HK task
  const checkOutGuest = (
    bookingId: string,
    paymentMethod: PaymentMethod = 'upi',
    lateFeeHours: number = 0
  ) => {
    const booking = bookings.find((b) => b.id === bookingId);
    if (!booking) return { success: false, error: 'Booking not found.' };

    const folio = folios.find((f) => f.bookingId === bookingId);
    if (!folio) return { success: false, error: 'Folio not found for booking.' };

    let currentLines = [...folio.lines];

    // Add late checkout fee if applicable
    if (lateFeeHours > 0) {
      const lateFeeAmount = lateFeeHours * settings.lateCheckOutFeePerHour;
      const lateFeeTax = Math.round((lateFeeAmount * 12) / 100);
      currentLines.push({
        id: `fl-late-${Date.now()}`,
        folioId: folio.id,
        date: toISODateString(new Date()),
        type: 'late_checkout',
        description: `Late Check-out Charge (${lateFeeHours} hr${lateFeeHours > 1 ? 's' : ''})`,
        quantity: lateFeeHours,
        unitPrice: settings.lateCheckOutFeePerHour,
        taxRate: 12,
        taxAmount: lateFeeTax,
        totalAmount: lateFeeAmount + lateFeeTax,
        createdByStaff: currentUser.name,
        createdAt: new Date().toISOString(),
      });
    }

    const totalCharges = currentLines.reduce((sum, l) => sum + l.totalAmount, 0);
    const totalPaid = folio.payments.reduce((sum, p) => sum + p.amount, 0);
    const balanceDue = totalCharges - totalPaid;

    let updatedPayments = [...folio.payments];
    if (balanceDue > 0) {
      updatedPayments.push({
        id: `pay-settle-${Date.now()}`,
        folioId: folio.id,
        amount: balanceDue,
        method: paymentMethod,
        reference: `SETTLE/${booking.bookingReference}`,
        staffName: currentUser.name,
        notes: 'Final settlement at check-out',
        isRefund: false,
        createdAt: new Date().toISOString(),
      });
    }

    // Generate sequential GST Invoice
    const invoiceNum = generateInvoiceNumber(
      settings.invoicePrefix,
      settings.nextInvoiceNumber
    );

    const subtotal = currentLines.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0);
    const totalTax = currentLines.reduce((sum, l) => sum + l.taxAmount, 0);
    const cgst = Math.round(totalTax / 2);
    const sgst = totalTax - cgst;

    const guest = guests.find((g) => g.id === booking.guestId);

    const newInvoice: Invoice = {
      id: `inv-${Date.now()}`,
      invoiceNumber: invoiceNum,
      isCreditNote: false,
      bookingId,
      folioId: folio.id,
      guestName: booking.guestName,
      guestPhone: booking.guestPhone,
      guestAddress: guest ? `${guest.address}, ${guest.city}` : undefined,
      hotelGstin: settings.hotelGstin,
      date: toISODateString(new Date()),
      subtotal,
      cgst,
      sgst,
      igst: 0,
      total: subtotal + totalTax,
      paymentStatus: 'paid',
      lines: currentLines.map((l) => ({
        description: l.description,
        sacCode:
          l.type === 'restaurant'
            ? settings.sacCodeRestaurant
            : l.type === 'service'
            ? settings.sacCodeServices
            : settings.sacCodeAccommodation,
        qty: l.quantity,
        rate: l.unitPrice,
        amount: l.unitPrice * l.quantity,
        taxRate: l.taxRate,
        taxAmount: l.taxAmount,
      })),
    };

    // Increment next invoice number
    setSettings((prev) => ({
      ...prev,
      nextInvoiceNumber: prev.nextInvoiceNumber + 1,
    }));

    // Update Folio to settled
    setFolios((prev) =>
      prev.map((f) =>
        f.id === folio.id
          ? {
              ...f,
              status: 'settled',
              lines: currentLines,
              payments: updatedPayments,
            }
          : f
      )
    );

    // Update Booking status to checked_out
    setBookings((prev) =>
      prev.map((b) =>
        b.id === bookingId
          ? {
              ...b,
              status: 'checked_out',
              checkedOutAt: new Date().toISOString(),
            }
          : b
      )
    );

    // Save Invoice
    setInvoices((prev) => [newInvoice, ...prev]);

    // Update room status to Dirty & automatically create Housekeeping Task
    if (booking.roomId) {
      const room = rooms.find((r) => r.id === booking.roomId);
      if (room) {
        setRooms((prev) =>
          prev.map((r) => (r.id === room.id ? { ...r, status: 'dirty' } : r))
        );

        // Auto create housekeeping task (checkout_clean, high priority!)
        const hkTask: HousekeepingTask = {
          id: `hk-${Date.now()}`,
          roomId: room.id,
          roomNumber: room.roomNumber,
          type: 'checkout_clean',
          priority: 'high',
          status: 'pending',
          notes: `Guest ${booking.guestName} checked out. Clean and inspect for next arrival.`,
        };
        setHousekeepingTasks((prev) => [hkTask, ...prev]);
      }
    }

    addAuditLog(
      'check_out',
      `Checked out ${booking.guestName}. Generated invoice ${invoiceNum} for ₹${(subtotal + totalTax).toLocaleString('en-IN')}. Room marked Dirty.`
    );
    addToast(`Checked out ${booking.guestName}. Invoice ${invoiceNum} generated`, 'success');

    return { success: true, invoice: newInvoice };
  };

  const getFolioByBookingId = (bookingId: string) => {
    return folios.find((f) => f.bookingId === bookingId);
  };

  const addFolioLine = (
    folioId: string,
    line: Omit<FolioLine, 'id' | 'createdAt' | 'createdByStaff'>
  ) => {
    const newLine: FolioLine = {
      ...line,
      id: `fl-${Date.now()}`,
      createdByStaff: currentUser.name,
      createdAt: new Date().toISOString(),
    };

    setFolios((prev) =>
      prev.map((f) => (f.id === folioId ? { ...f, lines: [...f.lines, newLine] } : f))
    );
    addToast(`Added ${line.description} to folio`, 'info');
  };

  const addPayment = (
    folioId: string,
    payment: Omit<Payment, 'id' | 'createdAt' | 'staffName'>
  ) => {
    const newPayment: Payment = {
      ...payment,
      id: `pay-${Date.now()}`,
      staffName: currentUser.name,
      createdAt: new Date().toISOString(),
    };

    setFolios((prev) =>
      prev.map((f) => (f.id === folioId ? { ...f, payments: [...f.payments, newPayment] } : f))
    );
    addToast(`Recorded ₹${payment.amount.toLocaleString('en-IN')} payment (${payment.method})`, 'success');
  };

  // Issue credit note for invoice corrections (Invoices cannot be deleted!)
  const issueCreditNote = (invoiceId: string, reason: string, refundAmount: number) => {
    const invoice = invoices.find((inv) => inv.id === invoiceId);
    if (!invoice) return { success: false, error: 'Invoice not found.' };

    const creditNoteNum = generateCreditNoteNumber(
      settings.creditNotePrefix,
      settings.nextCreditNoteNumber
    );

    const taxPortion = Math.round((refundAmount * 12) / 112);
    const subtotalPortion = refundAmount - taxPortion;
    const halfTax = Math.round(taxPortion / 2);

    const creditNote: Invoice = {
      id: `cn-${Date.now()}`,
      invoiceNumber: creditNoteNum,
      isCreditNote: true,
      originalInvoiceId: invoice.id,
      bookingId: invoice.bookingId,
      folioId: invoice.folioId,
      guestName: invoice.guestName,
      guestPhone: invoice.guestPhone,
      guestAddress: invoice.guestAddress,
      hotelGstin: settings.hotelGstin,
      date: toISODateString(new Date()),
      subtotal: -subtotalPortion,
      cgst: -halfTax,
      sgst: -(taxPortion - halfTax),
      igst: 0,
      total: -refundAmount,
      paymentStatus: 'credit',
      lines: [
        {
          description: `Credit Note Adjustment against ${invoice.invoiceNumber}: ${reason}`,
          sacCode: settings.sacCodeAccommodation,
          qty: 1,
          rate: -subtotalPortion,
          amount: -subtotalPortion,
          taxRate: 12,
          taxAmount: -taxPortion,
        },
      ],
    };

    setSettings((prev) => ({
      ...prev,
      nextCreditNoteNumber: prev.nextCreditNoteNumber + 1,
    }));
    setInvoices((prev) => [creditNote, ...prev]);

    addAuditLog(
      'invoice_credit_note',
      `Issued Credit Note ${creditNoteNum} for ₹${refundAmount.toLocaleString('en-IN')} against ${invoice.invoiceNumber}. Reason: ${reason}.`
    );
    addToast(`Credit note ${creditNoteNum} issued for ₹${refundAmount.toLocaleString('en-IN')}`, 'info');

    return { success: true, creditNote };
  };

  // Room & Housekeeping operations
  const updateRoomStatus = (
    roomId: string,
    status: RoomStatus,
    reason?: string,
    startDate?: string,
    endDate?: string
  ) => {
    const room = rooms.find((r) => r.id === roomId);
    if (!room) return;

    const prevStatus = room.status;
    setRooms((prev) =>
      prev.map((r) =>
        r.id === roomId
          ? {
              ...r,
              status,
              outOfServiceReason: status === 'out_of_service' ? reason : undefined,
              outOfServiceStartDate: status === 'out_of_service' ? startDate : undefined,
              outOfServiceEndDate: status === 'out_of_service' ? endDate : undefined,
            }
          : r
      )
    );

    addAuditLog(
      'room_status_change',
      `Changed Room ${room.roomNumber} status from ${prevStatus} to ${status}.${reason ? ` Reason: ${reason}` : ''}`,
      prevStatus,
      status
    );
    addToast(`Room ${room.roomNumber} marked ${status.replace('_', ' ')}`, 'info');
  };

  const updateHousekeepingTask = (
    taskId: string,
    status: HousekeepingTaskStatus,
    notes?: string
  ) => {
    const task = housekeepingTasks.find((t) => t.id === taskId);
    if (!task) return;

    const updates: Partial<HousekeepingTask> = { status };
    if (notes) updates.notes = notes;

    if (status === 'in_progress' && !task.startedAt) {
      updates.startedAt = new Date().toISOString();
      // Also update room status to in_progress
      setRooms((prev) =>
        prev.map((r) => (r.id === task.roomId ? { ...r, status: 'in_progress' } : r))
      );
    } else if (status === 'completed') {
      updates.completedAt = new Date().toISOString();
      // Update room to clean
      setRooms((prev) =>
        prev.map((r) => (r.id === task.roomId ? { ...r, status: 'clean' } : r))
      );
    } else if (status === 'inspected') {
      updates.inspectedAt = new Date().toISOString();
      updates.inspectedByStaffName = currentUser.name;
      // Supervisor inspected room
      setRooms((prev) =>
        prev.map((r) => (r.id === task.roomId ? { ...r, status: 'inspected' } : r))
      );
    }

    setHousekeepingTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, ...updates } : t))
    );
    addToast(`Task for Room ${task.roomNumber} updated to ${status}`, 'success');
  };

  const createHousekeepingTask = (task: Omit<HousekeepingTask, 'id'>) => {
    const newTask: HousekeepingTask = {
      ...task,
      id: `hk-${Date.now()}`,
    };
    setHousekeepingTasks((prev) => [newTask, ...prev]);
    addToast(`Created housekeeping task for Room ${task.roomNumber}`, 'success');
  };

  const logMaintenanceIssue = (
    issue: Omit<MaintenanceIssue, 'id' | 'reportedAt' | 'reportedBy' | 'status'>
  ) => {
    const newIssue: MaintenanceIssue = {
      ...issue,
      id: `maint-${Date.now()}`,
      reportedBy: currentUser.name,
      reportedAt: new Date().toISOString(),
      status: 'open',
    };

    setMaintenanceIssues((prev) => [newIssue, ...prev]);

    // If blocked room, set room to out_of_service
    if (issue.blockedRoom) {
      updateRoomStatus(
        issue.roomId,
        'out_of_service',
        issue.title,
        issue.blockedStartDate,
        issue.blockedEndDate
      );
    }

    addToast(`Logged maintenance issue for Room ${issue.roomNumber}`, 'info');
  };

  const resolveMaintenanceIssue = (issueId: string, notes: string) => {
    const issue = maintenanceIssues.find((m) => m.id === issueId);
    if (!issue) return;

    setMaintenanceIssues((prev) =>
      prev.map((m) =>
        m.id === issueId
          ? {
              ...m,
              status: 'resolved',
              resolvedAt: new Date().toISOString(),
              resolutionNotes: notes,
            }
          : m
      )
    );

    // If room was blocked, restore to dirty for housekeeping inspection
    if (issue.blockedRoom) {
      updateRoomStatus(issue.roomId, 'dirty', 'Maintenance resolved. Ready for housekeeping.');
    }

    addToast(`Resolved maintenance issue for Room ${issue.roomNumber}`, 'success');
  };

  // Restaurant operations
  const createRestaurantOrder = (
    order: Omit<RestaurantOrder, 'id' | 'orderNumber' | 'createdAt' | 'isSettled'>
  ) => {
    const orderNumber = `ORD-${800 + restaurantOrders.length + 1}`;
    const newOrder: RestaurantOrder = {
      ...order,
      id: `ord-${Date.now()}`,
      orderNumber,
      createdAt: new Date().toISOString(),
      isSettled: false,
    };

    setRestaurantOrders((prev) => [newOrder, ...prev]);
    addToast(`Order ${orderNumber} placed (${order.orderType === 'room' ? `Room ${order.roomNumber}` : order.tableNumber})`, 'success');
    return newOrder;
  };

  const updateOrderStatus = (orderId: string, status: OrderStatus) => {
    setRestaurantOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status } : o))
    );
    addToast(`Order status updated to ${status}`, 'info');
  };

  const settleRestaurantOrderToRoom = (orderId: string, bookingId: string) => {
    const order = restaurantOrders.find((o) => o.id === orderId);
    if (!order) return { success: false, error: 'Order not found.' };

    const booking = bookings.find((b) => b.id === bookingId);
    if (!booking || booking.status !== 'checked_in') {
      return {
        success: false,
        error: 'Active checked-in booking not found for this room.',
      };
    }

    const folio = folios.find((f) => f.bookingId === bookingId);
    if (!folio) {
      return { success: false, error: 'Folio not found for booking.' };
    }

    const itemsSummary = order.items.map((i) => `${i.name} (x${i.quantity})`).join(', ');

    const line: FolioLine = {
      id: `fl-rest-${Date.now()}`,
      folioId: folio.id,
      date: toISODateString(new Date()),
      type: 'restaurant',
      description: `Restaurant Order #${order.orderNumber}: ${itemsSummary}`,
      quantity: 1,
      unitPrice: order.subtotal,
      taxRate: 5,
      taxAmount: order.taxAmount,
      totalAmount: order.totalAmount,
      referenceId: order.id,
      createdByStaff: currentUser.name,
      createdAt: new Date().toISOString(),
    };

    setFolios((prev) =>
      prev.map((f) => (f.id === folio.id ? { ...f, lines: [...f.lines, line] } : f))
    );

    setRestaurantOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? { ...o, isSettled: true, paymentMethod: 'room_folio', bookingId }
          : o
      )
    );

    addAuditLog(
      'check_in',
      `Posted Restaurant Order #${order.orderNumber} (₹${order.totalAmount.toLocaleString('en-IN')}) to Room ${booking.roomId ? rooms.find(r => r.id === booking.roomId)?.roomNumber : ''} (${booking.guestName}).`
    );
    addToast(
      `Order #${order.orderNumber} charged to Room Folio of ${booking.guestName}`,
      'success'
    );

    return { success: true };
  };

  const toggleMenuItemAvailability = (itemId: string) => {
    setMenuItems((prev) =>
      prev.map((item) =>
        item.id === itemId ? { ...item, isAvailable: !item.isAvailable } : item
      )
    );
  };

  const saveMenuItem = (item: MenuItem) => {
    setMenuItems((prev) => {
      const idx = prev.findIndex((i) => i.id === item.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = item;
        return copy;
      }
      return [...prev, item];
    });
    addToast(`Saved menu item "${item.name}"`, 'success');
  };

  // Manager & Settings
  const updateSettings = (newSettings: Settings) => {
    setSettings(newSettings);
    addAuditLog('setting_update', 'Updated hotel settings, GST slabs, and invoice prefixes.');
    addToast('Hotel settings updated successfully', 'success');
  };

  const saveRoomType = (roomType: RoomType) => {
    setRoomTypes((prev) => {
      const idx = prev.findIndex((rt) => rt.id === roomType.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = roomType;
        return copy;
      }
      return [...prev, roomType];
    });
    addAuditLog('rate_change', `Updated room type ${roomType.name} (Base rate ₹${roomType.baseRate}).`);
    addToast(`Room type "${roomType.name}" saved`, 'success');
  };

  const saveRoom = (room: Room) => {
    setRooms((prev) => {
      const idx = prev.findIndex((r) => r.id === room.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = room;
        return copy;
      }
      return [...prev, room];
    });
    addToast(`Room ${room.roomNumber} saved`, 'success');
  };

  const saveStaffUser = (user: User) => {
    setUsers((prev) => {
      const idx = prev.findIndex((u) => u.id === user.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = user;
        return copy;
      }
      return [...prev, user];
    });
    addToast(`Staff account for ${user.name} saved`, 'success');
  };

  const toggleStaffActive = (userId: string) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, active: !u.active } : u))
    );
  };

  const createApprovalRequest = (
    request: Omit<ApprovalRequest, 'id' | 'requestedAt' | 'requestedBy' | 'status'>
  ) => {
    const newReq: ApprovalRequest = {
      ...request,
      id: `appr-${Date.now()}`,
      requestedBy: currentUser.name,
      requestedAt: new Date().toISOString(),
      status: 'pending',
    };
    setApprovals((prev) => [newReq, ...prev]);
    addToast(`Submitted approval request for ₹${request.amount.toLocaleString('en-IN')}`, 'info');
  };

  const respondToApproval = (approvalId: string, approved: boolean) => {
    setApprovals((prev) =>
      prev.map((a) =>
        a.id === approvalId
          ? {
              ...a,
              status: approved ? 'approved' : 'rejected',
              reviewedBy: currentUser.name,
              reviewedAt: new Date().toISOString(),
            }
          : a
      )
    );
    addAuditLog(
      approved ? 'discount_applied' : 'cancellation',
      `${approved ? 'Approved' : 'Rejected'} approval request ${approvalId} by ${currentUser.name}.`
    );
    addToast(`Approval request ${approved ? 'approved' : 'rejected'}`, approved ? 'success' : 'info');
  };

  const resetToSeedData = () => {
    localStorage.clear();
    setUsers(initialUsers);
    setCurrentUser(initialUsers[1]);
    setCurrentRoleState('front_desk');
    setSettings(initialSettings);
    setRoomTypes(initialRoomTypes);
    setRooms(initialRooms);
    setExtraServices(initialExtraServices);
    setGuests(initialGuests);
    setBookings(initialBookings);
    setFolios(initialFolios);
    setInvoices(initialInvoices);
    setMenuItems(initialMenuItems);
    setRestaurantOrders(initialRestaurantOrders);
    setHousekeepingTasks(initialHousekeepingTasks);
    setMaintenanceIssues(initialMaintenanceIssues);
    setAuditLogs(initialAuditLogs);
    setApprovals(initialApprovals);
    addToast('Reset database to clean initial seed data', 'info');
  };

  return (
    <HotelContext.Provider
      value={{
        currentUser,
        currentRole,
        setCurrentRole,
        switchUser,
        settings,
        users,
        roomTypes,
        rooms,
        extraServices,
        guests,
        bookings,
        folios,
        invoices,
        menuItems,
        restaurantOrders,
        housekeepingTasks,
        maintenanceIssues,
        auditLogs,
        approvals,
        toasts,
        addToast,
        dismissToast,
        addAuditLog,
        createBooking,
        updateBooking,
        cancelBooking,
        assignRoomToBooking,
        checkInGuest,
        checkOutGuest,
        getFolioByBookingId,
        addFolioLine,
        addPayment,
        issueCreditNote,
        updateRoomStatus,
        updateHousekeepingTask,
        createHousekeepingTask,
        logMaintenanceIssue,
        resolveMaintenanceIssue,
        createRestaurantOrder,
        updateOrderStatus,
        settleRestaurantOrderToRoom,
        toggleMenuItemAvailability,
        saveMenuItem,
        updateSettings,
        saveRoomType,
        saveRoom,
        saveStaffUser,
        toggleStaffActive,
        createApprovalRequest,
        respondToApproval,
        resetToSeedData,
      }}
    >
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </HotelContext.Provider>
  );
};

export const useHotel = () => {
  const context = useContext(HotelContext);
  if (!context) {
    throw new Error('useHotel must be used within a HotelProvider');
  }
  return context;
};
