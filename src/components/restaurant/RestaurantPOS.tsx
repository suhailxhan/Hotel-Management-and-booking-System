import React, { useState } from 'react';
import { useHotel } from '../../context/HotelContext.tsx';
import { MenuItem, MenuCategory, OrderLine, OrderStatus, RestaurantOrder } from '../../types/index.ts';
import { formatRupee, formatDateTime } from '../../utils/formatters.ts';
import { Button } from '../common/Button.tsx';
import { Input } from '../common/Input.tsx';
import { StatusLabel } from '../common/StatusLabel.tsx';
import { Dialog } from '../common/Dialog.tsx';

export const RestaurantPOS: React.FC = () => {
  const {
    menuItems,
    bookings,
    rooms,
    restaurantOrders,
    createRestaurantOrder,
    settleRestaurantOrderToRoom,
    updateOrderStatus,
    toggleMenuItemAvailability,
    saveMenuItem,
  } = useHotel();

  const [activeTab, setActiveTab] = useState<'pos' | 'kitchen' | 'menu'>('pos');
  const [selectedCategory, setSelectedCategory] = useState<MenuCategory | 'All'>('All');

  // Order Cart state
  const [cartItems, setCartItems] = useState<{ item: MenuItem; quantity: number }[]>([]);
  const [orderType, setOrderType] = useState<'room' | 'table'>('room');
  const [selectedRoomNumber, setSelectedRoomNumber] = useState<string>('');
  const [tableNumber, setTableNumber] = useState('Table 1');
  const [confirmRoomModalOrder, setConfirmRoomModalOrder] = useState<RestaurantOrder | null>(null);

  // Menu editing states
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);

  // Active checked in bookings for room delivery
  const inHouseBookings = bookings.filter((b) => b.status === 'checked_in');

  // Find guest in the selected room
  const activeBookingInSelectedRoom = inHouseBookings.find((b) => {
    const room = rooms.find((r) => r.id === b.roomId);
    return room && room.roomNumber === selectedRoomNumber;
  });

  // Calculate cart totals
  const subtotal = cartItems.reduce((sum, ci) => sum + ci.item.price * ci.quantity, 0);
  const taxAmount = Math.round((subtotal * 5) / 100); // 5% GST for restaurant
  const grandTotal = subtotal + taxAmount;

  const handleAddToCart = (item: MenuItem) => {
    setCartItems((prev) => {
      const existing = prev.find((ci) => ci.item.id === item.id);
      if (existing) {
        return prev.map((ci) =>
          ci.item.id === item.id ? { ...ci, quantity: ci.quantity + 1 } : ci
        );
      }
      return [...prev, { item, quantity: 1 }];
    });
  };

  const handleUpdateQuantity = (itemId: string, delta: number) => {
    setCartItems((prev) =>
      prev
        .map((ci) => {
          if (ci.item.id === itemId) {
            const newQty = ci.quantity + delta;
            return newQty > 0 ? { ...ci, quantity: newQty } : null;
          }
          return ci;
        })
        .filter(Boolean) as { item: MenuItem; quantity: number }[]
    );
  };

  const handlePlaceOrder = (settleMode: 'room' | 'counter') => {
    if (cartItems.length === 0) return;

    if (orderType === 'room' && !activeBookingInSelectedRoom) {
      alert('Please select an occupied room with an in-house checked-in guest.');
      return;
    }

    const orderLines: OrderLine[] = cartItems.map((ci) => ({
      id: `ol-${Date.now()}-${ci.item.id}`,
      menuItemId: ci.item.id,
      name: ci.item.name,
      quantity: ci.quantity,
      price: ci.item.price,
      total: ci.item.price * ci.quantity,
    }));

    const newOrder = createRestaurantOrder({
      orderType,
      tableNumber: orderType === 'table' ? tableNumber : undefined,
      roomNumber: orderType === 'room' ? selectedRoomNumber : undefined,
      guestName: orderType === 'room' ? activeBookingInSelectedRoom?.guestName : undefined,
      bookingId: orderType === 'room' ? activeBookingInSelectedRoom?.id : undefined,
      status: 'received',
      items: orderLines,
      subtotal,
      taxAmount,
      totalAmount: grandTotal,
    });

    if (settleMode === 'room' && activeBookingInSelectedRoom) {
      settleRestaurantOrderToRoom(newOrder.id, activeBookingInSelectedRoom.id);
    }

    // Reset cart
    setCartItems([]);
  };

  const categories: MenuCategory[] = [
    'Starters',
    'Mains',
    'Breads & Rice',
    'Beverages',
    'Desserts',
  ];

  const filteredMenuItems = menuItems.filter((i) =>
    selectedCategory === 'All' ? true : i.category === selectedCategory
  );

  return (
    <div className="flex flex-col gap-4 text-left w-full max-w-6xl mx-auto pb-12">
      {/* Top Navbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-[6px] border border-[#D8DCD5]">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('pos')}
            className={`px-3 py-1.5 rounded-[6px] text-xs font-semibold cursor-pointer transition-colors ${
              activeTab === 'pos'
                ? 'bg-[#0F5E63] text-white'
                : 'bg-[#F4F5F2] text-[#14202B] hover:bg-[#E8ECE5]'
            }`}
          >
            Restaurant POS & Room Service
          </button>
          <button
            onClick={() => setActiveTab('kitchen')}
            className={`px-3 py-1.5 rounded-[6px] text-xs font-semibold cursor-pointer transition-colors ${
              activeTab === 'kitchen'
                ? 'bg-[#0F5E63] text-white'
                : 'bg-[#F4F5F2] text-[#14202B] hover:bg-[#E8ECE5]'
            }`}
          >
            Kitchen Display (KDS) ({restaurantOrders.filter((o) => o.status !== 'delivered' && o.status !== 'cancelled').length})
          </button>
          <button
            onClick={() => setActiveTab('menu')}
            className={`px-3 py-1.5 rounded-[6px] text-xs font-semibold cursor-pointer transition-colors ${
              activeTab === 'menu'
                ? 'bg-[#0F5E63] text-white'
                : 'bg-[#F4F5F2] text-[#14202B] hover:bg-[#E8ECE5]'
            }`}
          >
            Menu Items & Pricing
          </button>
        </div>

        <div className="text-xs font-mono text-[#57636E]">
          Active In-House Rooms: <span className="font-bold text-[#14202B]">{inHouseBookings.length}</span>
        </div>
      </div>

      {/* TAB 1: POS & Cart */}
      {activeTab === 'pos' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Menu Catalog (2 cols on lg) */}
          <div className="lg:col-span-2 flex flex-col gap-3">
            {/* Category Filter */}
            <div className="flex flex-wrap items-center gap-1.5 bg-white p-2.5 rounded-[6px] border border-[#D8DCD5]">
              <button
                onClick={() => setSelectedCategory('All')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-[4px] cursor-pointer transition-colors ${
                  selectedCategory === 'All'
                    ? 'bg-[#14202B] text-white'
                    : 'bg-[#F4F5F2] text-[#14202B] hover:bg-[#E8ECE5]'
                }`}
              >
                All Items
              </button>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-[4px] cursor-pointer transition-colors ${
                    selectedCategory === cat
                      ? 'bg-[#14202B] text-white'
                      : 'bg-[#F4F5F2] text-[#14202B] hover:bg-[#E8ECE5]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Menu Items Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {filteredMenuItems.map((item) => (
                <div
                  key={item.id}
                  className={`bg-white border rounded-[6px] p-3 flex flex-col justify-between text-left transition-colors ${
                    item.isAvailable ? 'border-[#D8DCD5]' : 'border-[#E8ECE5] opacity-60'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-1">
                      <h4 className="font-bold text-sm text-[#14202B]">{item.name}</h4>
                      <span className="font-mono font-bold text-sm text-[#14202B]">
                        {formatRupee(item.price)}
                      </span>
                    </div>
                    <p className="text-xs text-[#57636E] mt-1 line-clamp-2">{item.description}</p>
                    <div className="text-[10px] text-[#57636E] mt-1 font-mono">
                      Category: {item.category} • GST: {item.gstRate}%
                    </div>
                  </div>

                  <div className="mt-3 pt-2 border-t border-[#E8ECE5] flex items-center justify-between">
                    <span
                      className={`text-[10px] font-bold uppercase ${
                        item.isAvailable ? 'text-[#15803D]' : 'text-[#B42318]'
                      }`}
                    >
                      {item.isAvailable ? 'Available' : 'Sold Out'}
                    </span>
                    <Button
                      size="sm"
                      variant="primary"
                      disabled={!item.isAvailable}
                      onClick={() => handleAddToCart(item)}
                    >
                      + Add
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Current Order Cart (1 col on lg) */}
          <div className="flex flex-col gap-3 bg-white border border-[#D8DCD5] rounded-[6px] p-4 text-left shadow-xs h-fit">
            <h3 className="font-bold text-base text-[#14202B]">Order Destination</h3>

            {/* Destination Toggle */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setOrderType('room')}
                className={`py-1.5 text-xs font-semibold rounded-[4px] border cursor-pointer ${
                  orderType === 'room'
                    ? 'bg-[#0F5E63] text-white border-[#0F5E63]'
                    : 'bg-[#F4F5F2] text-[#14202B] border-[#D8DCD5]'
                }`}
              >
                In-Room Dining
              </button>
              <button
                type="button"
                onClick={() => setOrderType('table')}
                className={`py-1.5 text-xs font-semibold rounded-[4px] border cursor-pointer ${
                  orderType === 'table'
                    ? 'bg-[#0F5E63] text-white border-[#0F5E63]'
                    : 'bg-[#F4F5F2] text-[#14202B] border-[#D8DCD5]'
                }`}
              >
                Restaurant Table
              </button>
            </div>

            {/* Destination Selector */}
            {orderType === 'room' ? (
              <div className="bg-[#F4F5F2] p-3 rounded-[6px] border border-[#D8DCD5] text-xs">
                <label className="font-semibold text-[#14202B] block mb-1">
                  Select In-House Room *
                </label>
                <select
                  value={selectedRoomNumber}
                  onChange={(e) => setSelectedRoomNumber(e.target.value)}
                  className="w-full h-8 px-2 rounded-[4px] border border-[#D8DCD5] bg-white font-mono"
                >
                  <option value="">Select occupied room...</option>
                  {inHouseBookings.map((b) => {
                    const r = rooms.find((rm) => rm.id === b.roomId);
                    return (
                      <option key={b.id} value={r?.roomNumber}>
                        Room {r?.roomNumber} - {b.guestName}
                      </option>
                    );
                  })}
                </select>

                {activeBookingInSelectedRoom && (
                  <div className="mt-2 text-[11px] text-[#15803D] font-medium">
                    Verified Guest: <span className="font-bold">{activeBookingInSelectedRoom.guestName}</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-[#F4F5F2] p-3 rounded-[6px] border border-[#D8DCD5] text-xs">
                <label className="font-semibold text-[#14202B] block mb-1">Table Number</label>
                <select
                  value={tableNumber}
                  onChange={(e) => setTableNumber(e.target.value)}
                  className="w-full h-8 px-2 rounded-[4px] border border-[#D8DCD5] bg-white font-semibold"
                >
                  {['Table 1', 'Table 2', 'Table 3', 'Table 4', 'Table 5', 'Poolside Deck', 'Courtyard Garden'].map(
                    (tbl) => (
                      <option key={tbl} value={tbl}>
                        {tbl}
                      </option>
                    )
                  )}
                </select>
              </div>
            )}

            {/* Cart Items List */}
            <div className="border border-[#D8DCD5] rounded-[6px] overflow-hidden my-2">
              <div className="p-2 bg-[#F4F5F2] border-b border-[#D8DCD5] text-[11px] font-bold uppercase text-[#57636E]">
                Items in Ticket ({cartItems.length})
              </div>
              <div className="divide-y divide-[#E8ECE5] max-h-56 overflow-y-auto">
                {cartItems.length === 0 ? (
                  <div className="p-4 text-center text-xs text-[#57636E]">
                    Your order ticket is empty. Click + Add on menu items.
                  </div>
                ) : (
                  cartItems.map((ci) => (
                    <div key={ci.item.id} className="p-2.5 flex items-center justify-between text-xs">
                      <div>
                        <div className="font-semibold text-[#14202B]">{ci.item.name}</div>
                        <div className="text-[11px] font-mono text-[#57636E]">
                          {formatRupee(ci.item.price)} each
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center border border-[#D8DCD5] rounded-[4px]">
                          <button
                            onClick={() => handleUpdateQuantity(ci.item.id, -1)}
                            className="px-1.5 py-0.5 text-xs text-[#57636E] hover:bg-[#E8ECE5]"
                          >
                            -
                          </button>
                          <span className="px-2 font-mono font-bold">{ci.quantity}</span>
                          <button
                            onClick={() => handleUpdateQuantity(ci.item.id, 1)}
                            className="px-1.5 py-0.5 text-xs text-[#57636E] hover:bg-[#E8ECE5]"
                          >
                            +
                          </button>
                        </div>
                        <span className="font-mono font-bold text-xs w-16 text-right">
                          {formatRupee(ci.item.price * ci.quantity)}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Totals */}
            <div className="bg-[#F4F5F2] p-3 rounded-[6px] border border-[#D8DCD5] text-xs font-mono flex flex-col gap-1">
              <div className="flex justify-between">
                <span className="text-[#57636E]">Item Subtotal:</span>
                <span>{formatRupee(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#57636E]">Restaurant GST (5%):</span>
                <span>{formatRupee(taxAmount)}</span>
              </div>
              <div className="flex justify-between font-bold text-sm text-[#14202B] pt-1 border-t border-[#D8DCD5]">
                <span>Total Amount:</span>
                <span>{formatRupee(grandTotal)}</span>
              </div>
            </div>

            {/* Place Order Actions */}
            <div className="flex flex-col gap-2 mt-2">
              {orderType === 'room' && (
                <Button
                  size="md"
                  variant="primary"
                  disabled={cartItems.length === 0 || !activeBookingInSelectedRoom}
                  onClick={() => handlePlaceOrder('room')}
                >
                  Post Direct to Room Folio
                </Button>
              )}
              <Button
                size="md"
                variant={orderType === 'room' ? 'secondary' : 'primary'}
                disabled={cartItems.length === 0}
                onClick={() => handlePlaceOrder('counter')}
              >
                Send to Kitchen (Pay at Counter)
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Kitchen Display View (KDS) */}
      {activeTab === 'kitchen' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {restaurantOrders
            .filter((o) => o.status !== 'cancelled')
            .map((order) => (
              <div
                key={order.id}
                className="bg-white border border-[#D8DCD5] rounded-[6px] p-4 flex flex-col justify-between text-left shadow-2xs"
              >
                <div>
                  <div className="flex items-center justify-between border-b border-[#E8ECE5] pb-2">
                    <div>
                      <span className="font-mono font-bold text-sm text-[#0F5E63]">
                        {order.orderNumber}
                      </span>
                      <div className="text-xs font-bold text-[#14202B] mt-0.5">
                        {order.orderType === 'room' ? `Room ${order.roomNumber}` : order.tableNumber}
                      </div>
                      {order.guestName && (
                        <div className="text-[11px] text-[#57636E]">Guest: {order.guestName}</div>
                      )}
                    </div>
                    <StatusLabel status={order.status} />
                  </div>

                  {/* Items */}
                  <div className="py-3 divide-y divide-[#F4F5F2] text-xs">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="py-1.5 flex justify-between">
                        <span className="font-medium text-[#14202B]">
                          {item.quantity}× {item.name}
                        </span>
                        <span className="font-mono text-[#57636E]">{formatRupee(item.total)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-3 border-t border-[#E8ECE5] flex items-center justify-between">
                  <div className="text-xs font-mono font-bold text-[#14202B]">
                    Total: {formatRupee(order.totalAmount)}
                  </div>
                  <div className="flex items-center gap-1.5">
                    {order.status === 'received' && (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => updateOrderStatus(order.id, 'preparing')}
                      >
                        Start Prep
                      </Button>
                    )}
                    {order.status === 'preparing' && (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => updateOrderStatus(order.id, 'ready')}
                      >
                        Mark Ready
                      </Button>
                    )}
                    {order.status === 'ready' && (
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => updateOrderStatus(order.id, 'delivered')}
                      >
                        Delivered
                      </Button>
                    )}
                    {order.status === 'delivered' && (
                      <span className="text-xs text-[#15803D] font-bold">Fulfilled</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
        </div>
      )}

      {/* TAB 3: Menu Management */}
      {activeTab === 'menu' && (
        <div className="flex flex-col gap-4 bg-white border border-[#D8DCD5] rounded-[6px] p-4 text-left">
          <div className="flex justify-between items-center pb-3 border-b border-[#D8DCD5]">
            <h3 className="font-bold text-base text-[#14202B]">Kitchen Menu & Price Catalog</h3>
            <Button
              size="sm"
              variant="primary"
              onClick={() =>
                setEditingItem({
                  id: `mi-${Date.now()}`,
                  name: '',
                  category: 'Starters',
                  price: 300,
                  gstRate: 5,
                  isAvailable: true,
                  description: '',
                })
              }
            >
              + Add Menu Item
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#D8DCD5] bg-[#F4F5F2] text-[#57636E]">
                  <th className="p-2.5 text-left">Item Name</th>
                  <th className="p-2.5 text-left">Category</th>
                  <th className="p-2.5 text-right font-mono">Price (₹)</th>
                  <th className="p-2.5 text-right font-mono">GST %</th>
                  <th className="p-2.5 text-center">In Stock?</th>
                  <th className="p-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8ECE5]">
                {menuItems.map((item) => (
                  <tr key={item.id} className="hover:bg-[#F9FAF8]">
                    <td className="p-2.5 font-semibold text-[#14202B]">{item.name}</td>
                    <td className="p-2.5 text-[#57636E]">{item.category}</td>
                    <td className="p-2.5 text-right font-mono font-bold">{formatRupee(item.price)}</td>
                    <td className="p-2.5 text-right font-mono">{item.gstRate}%</td>
                    <td className="p-2.5 text-center">
                      <button
                        onClick={() => toggleMenuItemAvailability(item.id)}
                        className={`px-2 py-0.5 text-[10px] font-bold rounded-[3px] cursor-pointer transition-colors ${
                          item.isAvailable
                            ? 'bg-[#15803D] text-white'
                            : 'bg-[#B42318] text-white'
                        }`}
                      >
                        {item.isAvailable ? 'ACTIVE' : 'OFF MENU'}
                      </button>
                    </td>
                    <td className="p-2.5 text-right">
                      <Button size="sm" variant="ghost" onClick={() => setEditingItem(item)}>
                        Edit
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit Menu Item Dialog */}
      {editingItem && (
        <Dialog
          isOpen={true}
          onClose={() => setEditingItem(null)}
          title="Edit Menu Item"
          maxWidth="md"
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              saveMenuItem(editingItem);
              setEditingItem(null);
            }}
            className="flex flex-col gap-3 text-left"
          >
            <Input
              label="Item Name *"
              value={editingItem.name}
              onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
              required
            />
            <div>
              <label className="text-xs font-semibold text-[#14202B] block mb-1">Category</label>
              <select
                value={editingItem.category}
                onChange={(e) => setEditingItem({ ...editingItem, category: e.target.value as MenuCategory })}
                className="w-full h-9 px-3 text-sm rounded-[6px] border border-[#D8DCD5] bg-white font-medium"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <Input
              label="Price (₹) *"
              type="number"
              value={editingItem.price}
              onChange={(e) => setEditingItem({ ...editingItem, price: Number(e.target.value) })}
              required
              tabular
            />
            <div>
              <label className="text-xs font-semibold text-[#14202B] block mb-1">Description</label>
              <textarea
                value={editingItem.description}
                onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                className="w-full h-16 p-2 text-sm rounded-[6px] border border-[#D8DCD5] outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-[#D8DCD5]">
              <Button type="button" size="sm" variant="secondary" onClick={() => setEditingItem(null)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" variant="primary">
                Save Item
              </Button>
            </div>
          </form>
        </Dialog>
      )}
    </div>
  );
};
