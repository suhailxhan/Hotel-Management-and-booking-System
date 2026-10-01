import React, { useState } from 'react';
import { useHotel } from '../../context/HotelContext.tsx';
import { Room, RoomType, RoomStatus } from '../../types/index.ts';
import { formatRupee } from '../../utils/formatters.ts';
import { Button } from '../common/Button.tsx';
import { Input } from '../common/Input.tsx';
import { StatusLabel } from '../common/StatusLabel.tsx';
import { Dialog } from '../common/Dialog.tsx';

export const RoomManagement: React.FC = () => {
  const { rooms, roomTypes, saveRoom, saveRoomType } = useHotel();

  const [activeTab, setActiveTab] = useState<'rooms' | 'types'>('rooms');
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [editingType, setEditingType] = useState<RoomType | null>(null);

  // New room modal
  const handleAddNewRoom = () => {
    setEditingRoom({
      id: `rm-${Date.now()}`,
      roomNumber: `${rooms.length + 101}`,
      floor: 1,
      roomTypeId: roomTypes[0]?.id || '',
      status: 'clean',
    });
  };

  const handleAddNewType = () => {
    setEditingType({
      id: `rt-${Date.now()}`,
      name: '',
      code: 'NEW',
      capacity: 2,
      baseRate: 4000,
      amenities: ['King Bed', 'Air Conditioning', 'Free Wi-Fi'],
      photos: ['https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80'],
      description: '',
    });
  };

  return (
    <div className="flex flex-col gap-5 text-left w-full max-w-6xl mx-auto pb-12">
      {/* Top Navbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-[6px] border border-[#D8DCD5]">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('rooms')}
            className={`px-3 py-1.5 rounded-[6px] text-xs font-semibold cursor-pointer transition-colors ${
              activeTab === 'rooms'
                ? 'bg-[#0F5E63] text-white'
                : 'bg-[#F4F5F2] text-[#14202B] hover:bg-[#E8ECE5]'
            }`}
          >
            All Rooms Inventory ({rooms.length})
          </button>
          <button
            onClick={() => setActiveTab('types')}
            className={`px-3 py-1.5 rounded-[6px] text-xs font-semibold cursor-pointer transition-colors ${
              activeTab === 'types'
                ? 'bg-[#0F5E63] text-white'
                : 'bg-[#F4F5F2] text-[#14202B] hover:bg-[#E8ECE5]'
            }`}
          >
            Room Types & Base Rates ({roomTypes.length})
          </button>
        </div>

        {activeTab === 'rooms' ? (
          <Button size="sm" variant="primary" onClick={handleAddNewRoom}>
            + Add Room
          </Button>
        ) : (
          <Button size="sm" variant="primary" onClick={handleAddNewType}>
            + Add Room Type
          </Button>
        )}
      </div>

      {/* TAB 1: Rooms Table */}
      {activeTab === 'rooms' && (
        <div className="bg-white border border-[#D8DCD5] rounded-[6px] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-[#F4F5F2] border-b border-[#D8DCD5] text-[#57636E]">
                  <th className="p-3 text-left">Room Number</th>
                  <th className="p-3 text-left">Floor</th>
                  <th className="p-3 text-left">Room Type</th>
                  <th className="p-3 text-left">Base Tariff</th>
                  <th className="p-3 text-center">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8ECE5]">
                {rooms.map((room) => {
                  const rType = roomTypes.find((rt) => rt.id === room.roomTypeId);
                  return (
                    <tr key={room.id} className="hover:bg-[#F9FAF8]">
                      <td className="p-3 font-mono font-bold text-sm text-[#14202B]">
                        Room {room.roomNumber}
                      </td>
                      <td className="p-3 text-[#57636E]">Floor {room.floor}</td>
                      <td className="p-3 font-semibold text-[#14202B]">{rType?.name || '-'}</td>
                      <td className="p-3 font-mono">{rType ? formatRupee(rType.baseRate) : '-'}</td>
                      <td className="p-3 text-center">
                        <StatusLabel status={room.status} />
                      </td>
                      <td className="p-3 text-right">
                        <Button size="sm" variant="ghost" onClick={() => setEditingRoom(room)}>
                          Edit
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: Room Types */}
      {activeTab === 'types' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {roomTypes.map((rt) => {
            const count = rooms.filter((r) => r.roomTypeId === rt.id).length;
            return (
              <div
                key={rt.id}
                className="bg-white border border-[#D8DCD5] rounded-[6px] p-4 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-base text-[#14202B]">{rt.name}</h4>
                      <div className="text-xs text-[#57636E] mt-0.5">
                        Code: {rt.code} • Max Capacity: {rt.capacity} Guests • Total Units: {count}
                      </div>
                    </div>
                    <div className="text-right font-mono font-bold text-base text-[#0F5E63]">
                      {formatRupee(rt.baseRate)}
                      <span className="text-xs font-normal text-[#57636E]"> / night</span>
                    </div>
                  </div>

                  <p className="text-xs text-[#57636E] mt-2">{rt.description}</p>

                  <div className="mt-3 flex flex-wrap gap-1">
                    {rt.amenities.map((a, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 bg-[#F4F5F2] border border-[#E8ECE5] text-[11px] rounded-[3px]"
                      >
                        {a}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-[#E8ECE5] flex justify-end">
                  <Button size="sm" variant="secondary" onClick={() => setEditingType(rt)}>
                    Edit Room Type & Amenities
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit Room Modal */}
      {editingRoom && (
        <Dialog
          isOpen={true}
          onClose={() => setEditingRoom(null)}
          title={`Edit Room: ${editingRoom.roomNumber}`}
          maxWidth="sm"
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              saveRoom(editingRoom);
              setEditingRoom(null);
            }}
            className="flex flex-col gap-3 text-left"
          >
            <Input
              label="Room Number *"
              value={editingRoom.roomNumber}
              onChange={(e) => setEditingRoom({ ...editingRoom, roomNumber: e.target.value })}
              required
              tabular
            />

            <div>
              <label className="text-xs font-semibold text-[#14202B] block mb-1">Floor *</label>
              <select
                value={editingRoom.floor}
                onChange={(e) => setEditingRoom({ ...editingRoom, floor: Number(e.target.value) })}
                className="w-full h-9 px-3 text-sm rounded-[6px] border border-[#D8DCD5] bg-white"
              >
                {[1, 2, 3, 4, 5].map((fl) => (
                  <option key={fl} value={fl}>
                    Floor {fl}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-[#14202B] block mb-1">Room Type *</label>
              <select
                value={editingRoom.roomTypeId}
                onChange={(e) => setEditingRoom({ ...editingRoom, roomTypeId: e.target.value })}
                className="w-full h-9 px-3 text-sm rounded-[6px] border border-[#D8DCD5] bg-white"
              >
                {roomTypes.map((rt) => (
                  <option key={rt.id} value={rt.id}>
                    {rt.name} ({formatRupee(rt.baseRate)})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-[#14202B] block mb-1">Status</label>
              <select
                value={editingRoom.status}
                onChange={(e) => setEditingRoom({ ...editingRoom, status: e.target.value as RoomStatus })}
                className="w-full h-9 px-3 text-sm rounded-[6px] border border-[#D8DCD5] bg-white font-semibold"
              >
                <option value="clean">Clean</option>
                <option value="inspected">Inspected</option>
                <option value="dirty">Dirty</option>
                <option value="in_progress">In Progress</option>
                <option value="out_of_service">Out of Service</option>
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-[#D8DCD5]">
              <Button type="button" size="sm" variant="secondary" onClick={() => setEditingRoom(null)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" variant="primary">
                Save Room
              </Button>
            </div>
          </form>
        </Dialog>
      )}

      {/* Edit Room Type Modal */}
      {editingType && (
        <Dialog
          isOpen={true}
          onClose={() => setEditingType(null)}
          title={`Edit Room Category: ${editingType.name || 'New Type'}`}
          maxWidth="md"
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              saveRoomType(editingType);
              setEditingType(null);
            }}
            className="flex flex-col gap-3 text-left"
          >
            <Input
              label="Room Type Name *"
              value={editingType.name}
              onChange={(e) => setEditingType({ ...editingType, name: e.target.value })}
              required
            />
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Short Code *"
                value={editingType.code}
                onChange={(e) => setEditingType({ ...editingType, code: e.target.value })}
                required
              />
              <Input
                label="Base Tariff / Night (₹) *"
                type="number"
                value={editingType.baseRate}
                onChange={(e) => setEditingType({ ...editingType, baseRate: Number(e.target.value) })}
                required
                tabular
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-[#14202B] block mb-1">Description</label>
              <textarea
                value={editingType.description}
                onChange={(e) => setEditingType({ ...editingType, description: e.target.value })}
                className="w-full h-16 p-2 text-sm rounded-[6px] border border-[#D8DCD5] outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-[#D8DCD5]">
              <Button type="button" size="sm" variant="secondary" onClick={() => setEditingType(null)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" variant="primary">
                Save Room Type
              </Button>
            </div>
          </form>
        </Dialog>
      )}
    </div>
  );
};
