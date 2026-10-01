import React, { useState } from 'react';
import { useHotel } from '../../context/HotelContext.tsx';
import { User, StaffRole } from '../../types/index.ts';
import { Button } from '../common/Button.tsx';
import { Input } from '../common/Input.tsx';
import { Dialog } from '../common/Dialog.tsx';

export const StaffManagement: React.FC = () => {
  const { users, saveStaffUser, toggleStaffActive, switchUser, currentUser } = useHotel();

  const [editingUser, setEditingUser] = useState<User | null>(null);

  const handleAddNewStaff = () => {
    setEditingUser({
      id: `u-${Date.now()}`,
      name: '',
      email: '',
      phone: '',
      role: 'front_desk',
      active: true,
      department: 'Front Office',
    });
  };

  const roleLabels: Record<StaffRole, string> = {
    manager: 'General Manager',
    front_desk: 'Front Desk Agent',
    housekeeping: 'Housekeeping Staff',
    restaurant: 'Restaurant Staff',
    guest: 'Guest (Portal)',
  };

  return (
    <div className="flex flex-col gap-5 text-left w-full max-w-5xl mx-auto pb-12">
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-[6px] border border-[#D8DCD5]">
        <div>
          <h2 className="text-base font-bold text-[#14202B]">Staff Accounts & Role-Based Access</h2>
          <div className="text-xs text-[#57636E] mt-0.5">
            Manage staff credentials, access levels, and active status
          </div>
        </div>
        <Button size="sm" variant="primary" onClick={handleAddNewStaff}>
          + Add Staff Account
        </Button>
      </div>

      <div className="bg-white border border-[#D8DCD5] rounded-[6px] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-[#F4F5F2] border-b border-[#D8DCD5] text-[#57636E]">
                <th className="p-3 text-left">Staff Name</th>
                <th className="p-3 text-left">Role Assigned</th>
                <th className="p-3 text-left">Department</th>
                <th className="p-3 text-left">Contact</th>
                <th className="p-3 text-center">Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8ECE5]">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-[#F9FAF8]">
                  <td className="p-3 font-semibold text-[#14202B]">
                    {u.name}
                    {u.id === currentUser.id && (
                      <span className="ml-2 text-[10px] px-1.5 py-0.2 bg-[#0F5E63] text-white rounded-[3px]">
                        YOU
                      </span>
                    )}
                  </td>
                  <td className="p-3">
                    <span className="font-semibold text-[#0F5E63]">{roleLabels[u.role]}</span>
                  </td>
                  <td className="p-3 text-[#57636E]">{u.department || '-'}</td>
                  <td className="p-3 font-mono text-xs">
                    <div>{u.phone}</div>
                    <div className="text-[#57636E]">{u.email}</div>
                  </td>
                  <td className="p-3 text-center">
                    <button
                      onClick={() => toggleStaffActive(u.id)}
                      className={`px-2 py-0.5 text-[10px] font-bold rounded-[3px] cursor-pointer transition-colors ${
                        u.active ? 'bg-[#15803D] text-white' : 'bg-[#B42318] text-white'
                      }`}
                    >
                      {u.active ? 'ACTIVE' : 'DEACTIVATED'}
                    </button>
                  </td>
                  <td className="p-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => switchUser(u.id)}
                        className="text-xs"
                      >
                        Log In As
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => setEditingUser(u)}
                        className="text-xs"
                      >
                        Edit
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Staff Dialog */}
      {editingUser && (
        <Dialog
          isOpen={true}
          onClose={() => setEditingUser(null)}
          title={`Staff Account: ${editingUser.name || 'New Staff'}`}
          maxWidth="sm"
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              saveStaffUser(editingUser);
              setEditingUser(null);
            }}
            className="flex flex-col gap-3 text-left"
          >
            <Input
              label="Staff Full Name *"
              value={editingUser.name}
              onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
              required
            />
            <Input
              label="Email Address *"
              type="email"
              value={editingUser.email}
              onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
              required
            />
            <Input
              label="Mobile Phone *"
              value={editingUser.phone}
              onChange={(e) => setEditingUser({ ...editingUser, phone: e.target.value })}
              required
              tabular
            />
            <div>
              <label className="text-xs font-semibold text-[#14202B] block mb-1">Assigned Role *</label>
              <select
                value={editingUser.role}
                onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value as StaffRole })}
                className="w-full h-9 px-3 text-sm rounded-[6px] border border-[#D8DCD5] bg-white font-semibold"
              >
                <option value="front_desk">Front Desk</option>
                <option value="manager">Manager</option>
                <option value="housekeeping">Housekeeping</option>
                <option value="restaurant">Restaurant Staff</option>
                <option value="guest">Guest</option>
              </select>
            </div>
            <Input
              label="Department / Shift"
              value={editingUser.department || ''}
              onChange={(e) => setEditingUser({ ...editingUser, department: e.target.value })}
            />

            <div className="flex justify-end gap-2 pt-3 border-t border-[#D8DCD5]">
              <Button type="button" size="sm" variant="secondary" onClick={() => setEditingUser(null)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" variant="primary">
                Save Staff
              </Button>
            </div>
          </form>
        </Dialog>
      )}
    </div>
  );
};
