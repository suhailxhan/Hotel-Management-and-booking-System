# Hotel Management System (HMS)

Production-grade property management system engineered for independent hotels in India, featuring front desk tape chart calendar, folio settlement, Indian GST compliance, housekeeping dispatch, restaurant POS room charging, executive KPI reporting with Excel export, and guest direct booking portal.

---

## 1. Architectural Decisions & Tech Stack

- **Frontend Architecture:** React 19 SPA with TypeScript, Tailwind CSS v4 design tokens, and modular domain-driven context architecture.
- **Data Persistence:** LocalStorage transactional engine simulating relational ACID constraints:
  - Atomic room collision checks inside transaction creation.
  - Monotonically increasing sequential invoices (`INV-YYYY-XXXX`) and credit notes (`CN-YYYY-XXXX`).
  - Immutable audit logs for sensitive operations (rate changes, discounts, cancellations, refunds).
- **Design Tokens:** Strict visual identity following the 20 non-vibecoded design rules:
  - Cool stone background (`#F4F5F2`), white surfaces (`#FFFFFF`), deep ink (`#14202B`), single solid accent deep teal (`#0F5E63`).
  - Strict 6px border radius (`rounded-[6px]`), 1px borders, minimal shadow.
  - Body in **Source Sans 3**, monetary figures, room numbers, dates, and invoice lines in **IBM Plex Mono** (tabular figures).
  - Indian currency formatting with lakh grouping (`₹1,25,000`) and `DD-MM-YYYY` dates.
- **Reporting & Exports:** Excel workbook export via `xlsx` library and printable GST tax invoice layout with SAC codes.
- **Mobile First:** Housekeeping mobile view and guest booking portal optimized for 360px viewport with bottom navigation bar.

---

## 2. Five Roles & Workflows

### 1. Front Desk
- **Tape Chart Calendar Grid:** Interactive room-by-date matrix spanning all 40 rooms across 4 floors. Displays bookings as solid color-coded bars. Click empty dates to book; click occupied bars to open folios or check-in.
- **Booking & Availability:** Quick walk-in or advance booking with live tariff calculations, double-booking collision checks, and advance collection.
- **Check-In Verification:** Mandatory Govt ID capture (Aadhaar, Passport, Driving License, Voter ID) with document photo scan storage. Validates room readiness (Dirty, In progress, or Out of service rooms cannot be assigned to arriving guests).
- **Guest Folio:** Real-time running bill with room nights, restaurant orders posted from kitchen, extra services (Airport transfers, Laundry, Extra Bed, Spa), taxes (CGST 6%, SGST 6%), and multi-tender payments (UPI, Card, Cash, Bank Transfer).
- **Check-Out Settlement:** Settles outstanding dues, adds late check-out charges if applicable, generates sequential GST invoice, automatically marks room **DIRTY**, and dispatches a high-priority departure clean task to housekeeping.
- **Shift Handover Summary:** Cashier shift summary by tender method (UPI, Card, Cash, Bank Transfer) and staff member.

### 2. Housekeeping & Maintenance
- **Priority Task Dispatch:** Daily cleaning queue sorted by departures first (`checkout_clean`, high priority), followed by early arrivals and stayover services.
- **Status Workflow:** Clean, Dirty, In Progress, Inspected, Out of Service. Attendants mark start and finish; supervisors mark Inspected.
- **Maintenance Work Orders:** Log issues with photos and block rooms as Out of Service with start and end dates.

### 3. Restaurant Staff (Spice Harbour POS & KDS)
- **Menu Management:** Categories (Starters, Mains, Breads & Rice, Beverages, Desserts), prices, 5% GST, and instant in-stock availability toggles.
- **Direct Folio Room Posting:** Takes orders by room number, verifies active checked-in guest name for confirmation, and posts itemized charges directly to the room folio.
- **Kitchen Display System (KDS):** Real-time order status lifecycle: Received → Preparing → Ready → Delivered.

### 4. General Manager
- **Executive KPI Dashboard:** Occupancy Rate (%), Average Daily Rate (ADR), Revenue Per Available Room (RevPAR), revenue apportionment by source (Rooms, Dining, Services), today's arrivals/departures, and outstanding dues.
- **Room & Rate Inventory:** CRUD for room types and 40 individual rooms across 4 floors. Seasonal and weekend dynamic yield rate adjustments.
- **GST & Legal Settings:** Configurable GST slabs (12% for tariff ≤ ₹7,500, 18% for > ₹7,500), hotel GSTIN (`32AABCG1234F1Z8`), invoice prefixes, and cancellation policy window.
- **Approvals & Authorizations:** Manager authorization queue for front desk discounts exceeding limits (>15%), refunds, and credit note corrections.
- **Excel Export Reports:** Export multi-sheet or single-sheet workbooks (`.xlsx`) and print performance reports.
- **Immutable Audit Trail:** Comprehensive event log tracking who changed what, timestamp, previous value, and new value.

### 5. Guest Portal
- Direct public booking portal with photography slots, amenities, and total stay pricing including GST.
- Booking lookup by reference code or mobile phone with self-service cancellation option based on 48-hour free cancellation policy.

---

## 3. Core Business Rules & Built-In Verification

A built-in automated test suite is accessible from the footer ("Run Business Rules Test Suite"):
1. **Double-Booking Prevention:** Collision algorithm ensures no room can have overlapping date intervals, while allowing same-day transition (check-out at 11:00 AM, check-in at 14:00 PM).
2. **Room Readiness Constraint:** Prevents assigning any room that is `dirty`, `in_progress`, or `out_of_service` to an arriving guest.
3. **Indian GST Slabs:** Accurately applies 12% GST for tariffs ≤ ₹7,500 and 18% for tariffs > ₹7,500, apportioning 50% to CGST and 50% to SGST.
4. **Cancellation Policy:** Full refund for cancellations made >48 hours before check-in; retains 1-night fee for cancellations made within 48 hours.
5. **Sequential Invoicing:** Generates monotonically increasing invoice numbers (`INV-2026-XXXX`) and credit notes (`CN-2026-XXXX`). Invoices cannot be deleted.

---

## 4. Design Review Against the 20 DO NOT Rules

- [x] No purple-to-blue gradients anywhere.
- [x] No gradient text on headings or labels.
- [x] No emojis in headings, buttons, or labels.
- [x] Font: Source Sans 3 for body; IBM Plex Mono for amounts, room numbers, dates, and invoice figures.
- [x] Plain bordered surfaces (`border border-[#D8DCD5]`), no cards with colored left/top accent borders.
- [x] No glassmorphism or translucent blurry cards.
- [x] High-contrast accessible text pairings.
- [x] Summary stats are plain numbers with labels sized by importance (no icon-in-a-box tiles).
- [x] No pill badges above headlines.
- [x] Buttons are text-only with deliberate labels; no extraneous decorative icons.
- [x] Flat solid color fills with 100-150ms transitions (no fade on hover).
- [x] Spacing adheres strictly to 4px-based scale (4, 8, 12, 16, 24, 32, 48px).
- [x] Strictly no em dashes in UI copy; commas, colons, or periods used instead.
- [x] Quiet, specific hospitality copy (e.g. "Check-out by 11:00 AM", "Room 204 is ready for inspection").
- [x] One border radius (`rounded-[6px]`) throughout the entire application.
