import React, { useState, useEffect } from 'react';
import { HotelProvider, useHotel } from './context/HotelContext.tsx';
import { AppHeader } from './components/layout/AppHeader.tsx';
import { DesktopSidebar } from './components/layout/DesktopSidebar.tsx';
import { MobileTabBar } from './components/layout/MobileTabBar.tsx';

// Front Desk
import { TapeChart } from './components/frontdesk/TapeChart.tsx';
import { BookingList } from './components/frontdesk/BookingList.tsx';
import { AvailabilitySearch } from './components/frontdesk/AvailabilitySearch.tsx';
import { GuestDirectory } from './components/frontdesk/GuestDirectory.tsx';
import { NewBookingModal } from './components/frontdesk/NewBookingModal.tsx';
import { CheckInModal } from './components/frontdesk/CheckInModal.tsx';
import { FolioModal } from './components/frontdesk/FolioModal.tsx';
import { CheckOutModal } from './components/frontdesk/CheckOutModal.tsx';
import { ShiftSummaryModal } from './components/frontdesk/ShiftSummaryModal.tsx';

// Manager
import { ManagerDashboard } from './components/manager/ManagerDashboard.tsx';
import { RoomManagement } from './components/manager/RoomManagement.tsx';
import { RateSettings } from './components/manager/RateSettings.tsx';
import { TaxAndHotelSettings } from './components/manager/TaxAndHotelSettings.tsx';
import { StaffManagement } from './components/manager/StaffManagement.tsx';
import { ApprovalsView } from './components/manager/ApprovalsView.tsx';
import { ReportsView } from './components/manager/ReportsView.tsx';
import { AuditLogView } from './components/manager/AuditLogView.tsx';

// Housekeeping
import { HousekeepingView } from './components/housekeeping/HousekeepingView.tsx';

// Restaurant
import { RestaurantPOS } from './components/restaurant/RestaurantPOS.tsx';

// Guest
import { PublicBookingPage } from './components/guest/PublicBookingPage.tsx';
import { BookingLookupModal } from './components/guest/BookingLookupModal.tsx';

// Invoice & Test Suite
import { GSTInvoiceView } from './components/invoice/GSTInvoiceView.tsx';
import { Booking, Invoice } from './types/index.ts';
import { runBusinessRulesTests } from './utils/calculations.test.ts';
import { Dialog } from './components/common/Dialog.tsx';
import { Button } from './components/common/Button.tsx';

function MainApp() {
  const { currentRole, bookings, invoices, settings, issueCreditNote } = useHotel();

  // Active navigation tab
  const [currentTab, setCurrentTab] = useState<string>('tape_chart');

  // Modal states
  const [isNewBookingOpen, setIsNewBookingOpen] = useState(false);
  const [newBookingRoomId, setNewBookingRoomId] = useState<string | undefined>(undefined);
  const [newBookingDate, setNewBookingDate] = useState<string | undefined>(undefined);

  const [activeBookingForCheckIn, setActiveBookingForCheckIn] = useState<Booking | null>(null);
  const [activeBookingForFolio, setActiveBookingForFolio] = useState<Booking | null>(null);
  const [activeBookingForCheckOut, setActiveBookingForCheckOut] = useState<Booking | null>(null);
  const [activeInvoiceForView, setActiveInvoiceForView] = useState<Invoice | null>(null);

  const [isGuestLookupOpen, setIsGuestLookupOpen] = useState(false);
  const [isShiftSummaryOpen, setIsShiftSummaryOpen] = useState(false);
  const [testResults, setTestResults] = useState<{ passed: boolean; results: { name: string; success: boolean; detail: string }[] } | null>(null);

  // Sync default tab when role switches
  useEffect(() => {
    switch (currentRole) {
      case 'front_desk':
        setCurrentTab('tape_chart');
        break;
      case 'manager':
        setCurrentTab('dashboard');
        break;
      case 'housekeeping':
        setCurrentTab('tasks');
        break;
      case 'restaurant':
        setCurrentTab('pos');
        break;
      case 'guest':
        setCurrentTab('book');
        break;
    }
  }, [currentRole]);

  // Keyboard shortcut: F2 for new booking
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F2') {
        e.preventDefault();
        setIsNewBookingOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleTapeChartBookingClick = (booking: Booking) => {
    if (booking.status === 'checked_in' || booking.status === 'checked_out') {
      setActiveBookingForFolio(booking);
    } else if (booking.status === 'reserved') {
      setActiveBookingForCheckIn(booking);
    }
  };

  const handleTapeChartNewBooking = (roomId: string, date: string) => {
    setNewBookingRoomId(roomId);
    setNewBookingDate(date);
    setIsNewBookingOpen(true);
  };

  const handleOpenInvoiceFromFolio = (bookingId: string) => {
    const inv = invoices.find((i) => i.bookingId === bookingId && !i.isCreditNote);
    if (inv) {
      setActiveInvoiceForView(inv);
    }
  };

  const handleRunTests = () => {
    const res = runBusinessRulesTests();
    setTestResults(res);
  };

  return (
    <div className="min-h-screen bg-[#F4F5F2] text-[#14202B] flex flex-col font-sans">
      {/* Global Header */}
      <AppHeader
        onOpenNewBooking={() => {
          setNewBookingRoomId(undefined);
          setNewBookingDate(undefined);
          setIsNewBookingOpen(true);
        }}
        onOpenGuestLookup={() => setIsGuestLookupOpen(true)}
        onOpenShiftSummary={() => setIsShiftSummaryOpen(true)}
      />

      <div className="flex flex-1 w-full">
        {/* Desktop Sidebar (hidden on small screens) */}
        <div className="hidden md:block">
          <DesktopSidebar currentTab={currentTab} onTabChange={setCurrentTab} />
        </div>

        {/* Main Content Area */}
        <main className="flex-1 p-4 md:p-6 overflow-y-auto max-w-full">
          {/* If viewing a specific Invoice */}
          {activeInvoiceForView ? (
            <GSTInvoiceView
              invoice={activeInvoiceForView}
              settings={settings}
              onClose={() => setActiveInvoiceForView(null)}
              onIssueCreditNote={(invoiceId) => {
                const reason = prompt('Enter reason for Credit Note adjustment:');
                if (reason) {
                  const amtStr = prompt('Enter refund adjustment amount (₹):');
                  const amt = Number(amtStr);
                  if (amt && amt > 0) {
                    issueCreditNote(invoiceId, reason, amt);
                  }
                }
              }}
            />
          ) : (
            <>
              {/* FRONT DESK VIEWS */}
              {currentRole === 'front_desk' && (
                <>
                  {currentTab === 'tape_chart' && (
                    <TapeChart
                      onSelectBooking={handleTapeChartBookingClick}
                      onNewBookingForRoomDate={handleTapeChartNewBooking}
                    />
                  )}

                  {currentTab === 'bookings' && (
                    <div className="flex flex-col gap-6">
                      <AvailabilitySearch
                        onBookRoomType={(rtId, checkIn, checkOut) => {
                          setNewBookingDate(checkIn);
                          setIsNewBookingOpen(true);
                        }}
                      />
                      <BookingList
                        onSelectBooking={handleTapeChartBookingClick}
                        onCheckInBooking={(b) => setActiveBookingForCheckIn(b)}
                        onCheckOutBooking={(b) => setActiveBookingForCheckOut(b)}
                        onOpenFolio={(b) => setActiveBookingForFolio(b)}
                      />
                    </div>
                  )}

                  {currentTab === 'folios' && (
                    <div className="flex flex-col gap-4">
                      <div className="bg-white p-4 rounded-[6px] border border-[#D8DCD5] text-left">
                        <h2 className="text-base font-bold text-[#14202B]">
                          In-House Folios & GST Invoices
                        </h2>
                        <p className="text-xs text-[#57636E] mt-0.5">
                          View running guest bills, post service charges, or reprint GST invoices
                        </p>
                      </div>

                      <BookingList
                        onSelectBooking={handleTapeChartBookingClick}
                        onCheckInBooking={(b) => setActiveBookingForCheckIn(b)}
                        onCheckOutBooking={(b) => setActiveBookingForCheckOut(b)}
                        onOpenFolio={(b) => setActiveBookingForFolio(b)}
                      />
                    </div>
                  )}

                  {currentTab === 'guests' && <GuestDirectory />}

                  {currentTab === 'housekeeping_overview' && <HousekeepingView />}
                </>
              )}

              {/* MANAGER VIEWS */}
              {currentRole === 'manager' && (
                <>
                  {currentTab === 'dashboard' && <ManagerDashboard />}
                  {currentTab === 'rooms' && <RoomManagement />}
                  {currentTab === 'rates' && <RateSettings />}
                  {currentTab === 'approvals' && <ApprovalsView />}
                  {currentTab === 'reports' && <ReportsView />}
                  {currentTab === 'staff' && <StaffManagement />}
                  {currentTab === 'settings' && <TaxAndHotelSettings />}
                  {currentTab === 'audit' && <AuditLogView />}
                </>
              )}

              {/* HOUSEKEEPING VIEW (Mobile First) */}
              {currentRole === 'housekeeping' && <HousekeepingView />}

              {/* RESTAURANT VIEW */}
              {currentRole === 'restaurant' && <RestaurantPOS />}

              {/* GUEST PORTAL VIEW */}
              {currentRole === 'guest' && (
                <>
                  {currentTab === 'book' && (
                    <PublicBookingPage onOpenLookup={() => setIsGuestLookupOpen(true)} />
                  )}
                  {currentTab === 'my_booking' && (
                    <div className="max-w-md mx-auto">
                      <BookingLookupModal isOpen={true} onClose={() => setCurrentTab('book')} />
                    </div>
                  )}
                </>
              )}
            </>
          )}

          {/* Test Runner Trigger in Footer (Compliance verification) */}
          <div className="no-print mt-12 pt-4 border-t border-[#D8DCD5] flex flex-wrap items-center justify-between text-xs text-[#57636E]">
            <div>
              <span>Hotel Management System • Indian GST & Form C Compliant</span>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="ghost" onClick={handleRunTests}>
                Run Business Rules Test Suite
              </Button>
            </div>
          </div>
        </main>
      </div>

      {/* Mobile Bottom Tab Bar */}
      <MobileTabBar currentTab={currentTab} onTabChange={setCurrentTab} />

      {/* Global Modals */}
      <NewBookingModal
        isOpen={isNewBookingOpen}
        onClose={() => {
          setIsNewBookingOpen(false);
          setNewBookingRoomId(undefined);
          setNewBookingDate(undefined);
        }}
        initialRoomId={newBookingRoomId}
        initialDate={newBookingDate}
      />

      <CheckInModal
        isOpen={Boolean(activeBookingForCheckIn)}
        onClose={() => setActiveBookingForCheckIn(null)}
        booking={activeBookingForCheckIn}
        onSuccess={(bookingId) => {
          const updated = bookings.find((b) => b.id === bookingId);
          if (updated) {
            setActiveBookingForFolio(updated);
          }
        }}
      />

      <FolioModal
        isOpen={Boolean(activeBookingForFolio)}
        onClose={() => setActiveBookingForFolio(null)}
        booking={activeBookingForFolio}
        onCheckOut={(booking) => {
          setActiveBookingForFolio(null);
          setActiveBookingForCheckOut(booking);
        }}
        onViewInvoice={handleOpenInvoiceFromFolio}
      />

      <CheckOutModal
        isOpen={Boolean(activeBookingForCheckOut)}
        onClose={() => setActiveBookingForCheckOut(null)}
        booking={activeBookingForCheckOut}
        onSuccess={(bookingId) => {
          handleOpenInvoiceFromFolio(bookingId);
        }}
      />

      <BookingLookupModal
        isOpen={isGuestLookupOpen}
        onClose={() => setIsGuestLookupOpen(false)}
      />

      <ShiftSummaryModal
        isOpen={isShiftSummaryOpen}
        onClose={() => setIsShiftSummaryOpen(false)}
      />

      {/* Business Rules Test Suite Results Modal */}
      {testResults && (
        <Dialog
          isOpen={true}
          onClose={() => setTestResults(null)}
          title="Automated Business Rules Test Suite"
          maxWidth="lg"
        >
          <div className="flex flex-col gap-3 text-left text-xs">
            <div
              className={`p-3 rounded-[6px] border font-bold ${
                testResults.passed
                  ? 'bg-[#DCFCE7] text-[#15803D] border-[#15803D]'
                  : 'bg-[#FEE2E2] text-[#B42318] border-[#B42318]'
              }`}
            >
              {testResults.passed
                ? 'All Business Rules & Statutory Invoicing Tests Passed (6/6)'
                : 'Some Tests Failed'}
            </div>

            <div className="border border-[#D8DCD5] rounded-[6px] overflow-hidden divide-y divide-[#E8ECE5]">
              {testResults.results.map((r, i) => (
                <div key={i} className="p-3 flex items-start justify-between gap-2">
                  <div>
                    <div className="font-bold text-[#14202B]">{r.name}</div>
                    <div className="text-[#57636E] mt-0.5">{r.detail}</div>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-[4px] font-bold text-[10px] uppercase font-mono ${
                      r.success ? 'bg-[#15803D] text-white' : 'bg-[#B42318] text-white'
                    }`}
                  >
                    {r.success ? 'PASS' : 'FAIL'}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-3 border-t border-[#D8DCD5]">
              <Button size="sm" variant="primary" onClick={() => setTestResults(null)}>
                Close
              </Button>
            </div>
          </div>
        </Dialog>
      )}
    </div>
  );
}

export default function App() {
  return (
    <HotelProvider>
      <MainApp />
    </HotelProvider>
  );
}
