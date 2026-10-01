import React, { useState } from 'react';
import { useHotel } from '../../context/HotelContext.tsx';
import { HousekeepingTask, HousekeepingTaskStatus, RoomStatus } from '../../types/index.ts';
import { StatusLabel } from '../common/StatusLabel.tsx';
import { Button } from '../common/Button.tsx';
import { Dialog } from '../common/Dialog.tsx';
import { Input } from '../common/Input.tsx';
import { formatDateTime, formatDate, toISODateString } from '../../utils/formatters.ts';

export const HousekeepingView: React.FC = () => {
  const {
    housekeepingTasks,
    rooms,
    roomTypes,
    currentUser,
    updateHousekeepingTask,
    updateRoomStatus,
    logMaintenanceIssue,
    maintenanceIssues,
    resolveMaintenanceIssue,
  } = useHotel();

  const [activeSubTab, setActiveSubTab] = useState<'tasks' | 'rooms' | 'maintenance'>('tasks');
  const [taskFilter, setTaskFilter] = useState<'all' | 'pending' | 'in_progress' | 'completed'>('all');
  const [floorFilter, setFloorFilter] = useState<string>('all');

  // Maintenance issue modal states
  const [isMaintModalOpen, setIsMaintModalOpen] = useState(false);
  const [maintRoomId, setMaintRoomId] = useState(rooms[0]?.id || '');
  const [maintTitle, setMaintTitle] = useState('');
  const [maintDescription, setMaintDescription] = useState('');
  const [maintPriority, setMaintPriority] = useState<'urgent' | 'high' | 'medium' | 'low'>('high');
  const [blockRoom, setBlockRoom] = useState(false);
  const [blockEndDate, setBlockEndDate] = useState('2026-10-04');
  const [maintPhotoUrl, setMaintPhotoUrl] = useState('');

  // Priority sorting: High priority / checkout cleans first!
  const sortedTasks = [...housekeepingTasks].sort((a, b) => {
    // 1. Departures / High priority first
    if (a.priority === 'high' && b.priority !== 'high') return -1;
    if (a.priority !== 'high' && b.priority === 'high') return 1;

    // 2. Pending before completed
    if (a.status === 'pending' && b.status !== 'pending') return -1;
    if (a.status !== 'pending' && b.status === 'pending') return 1;

    return 0;
  });

  const filteredTasks = sortedTasks.filter((t) => {
    if (taskFilter === 'pending') return t.status === 'pending';
    if (taskFilter === 'in_progress') return t.status === 'in_progress';
    if (taskFilter === 'completed') return t.status === 'completed' || t.status === 'inspected';
    return true;
  });

  const handleStartTask = (taskId: string) => {
    updateHousekeepingTask(taskId, 'in_progress');
  };

  const handleCompleteTask = (taskId: string) => {
    updateHousekeepingTask(taskId, 'completed');
  };

  const handleInspectTask = (taskId: string) => {
    updateHousekeepingTask(taskId, 'inspected');
  };

  const handleCreateMaintenance = (e: React.FormEvent) => {
    e.preventDefault();
    const room = rooms.find((r) => r.id === maintRoomId);
    if (!room || !maintTitle.trim()) return;

    logMaintenanceIssue({
      roomId: room.id,
      roomNumber: room.roomNumber,
      title: maintTitle,
      description: maintDescription || 'Maintenance check required.',
      photoUrl: maintPhotoUrl || undefined,
      priority: maintPriority,
      blockedRoom: blockRoom,
      blockedStartDate: blockRoom ? toISODateString(new Date()) : undefined,
      blockedEndDate: blockRoom ? blockEndDate : undefined,
    });

    setIsMaintModalOpen(false);
    setMaintTitle('');
    setMaintDescription('');
    setBlockRoom(false);
    setMaintPhotoUrl('');
  };

  const isSupervisor = currentUser.role === 'housekeeping' || currentUser.role === 'manager';

  // Room status counts
  const cleanCount = rooms.filter((r) => r.status === 'clean').length;
  const dirtyCount = rooms.filter((r) => r.status === 'dirty').length;
  const inProgressCount = rooms.filter((r) => r.status === 'in_progress').length;
  const inspectedCount = rooms.filter((r) => r.status === 'inspected').length;
  const oosCount = rooms.filter((r) => r.status === 'out_of_service').length;

  return (
    <div className="flex flex-col gap-4 text-left w-full max-w-5xl mx-auto pb-16 md:pb-6">
      {/* Top Mobile/Desktop Navigation & Action */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-[6px] border border-[#D8DCD5]">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveSubTab('tasks')}
            className={`px-3 py-1.5 rounded-[6px] text-xs font-semibold cursor-pointer transition-colors ${
              activeSubTab === 'tasks'
                ? 'bg-[#0F5E63] text-white'
                : 'bg-[#F4F5F2] text-[#14202B] hover:bg-[#E8ECE5]'
            }`}
          >
            Tasks ({filteredTasks.length})
          </button>
          <button
            onClick={() => setActiveSubTab('rooms')}
            className={`px-3 py-1.5 rounded-[6px] text-xs font-semibold cursor-pointer transition-colors ${
              activeSubTab === 'rooms'
                ? 'bg-[#0F5E63] text-white'
                : 'bg-[#F4F5F2] text-[#14202B] hover:bg-[#E8ECE5]'
            }`}
          >
            Room Grid (40)
          </button>
          <button
            onClick={() => setActiveSubTab('maintenance')}
            className={`px-3 py-1.5 rounded-[6px] text-xs font-semibold cursor-pointer transition-colors ${
              activeSubTab === 'maintenance'
                ? 'bg-[#0F5E63] text-white'
                : 'bg-[#F4F5F2] text-[#14202B] hover:bg-[#E8ECE5]'
            }`}
          >
            Maintenance ({maintenanceIssues.filter((m) => m.status !== 'resolved').length})
          </button>
        </div>

        <Button size="sm" variant="primary" onClick={() => setIsMaintModalOpen(true)}>
          + Report Maintenance
        </Button>
      </div>

      {/* KPI Status Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-xs">
        <div className="bg-white border border-[#D8DCD5] rounded-[6px] p-2">
          <div className="text-[#57636E] text-[10px] uppercase font-bold">Clean</div>
          <div className="text-xl font-bold font-mono text-[#15803D] mt-0.5">{cleanCount}</div>
        </div>
        <div className="bg-white border border-[#D8DCD5] rounded-[6px] p-2">
          <div className="text-[#57636E] text-[10px] uppercase font-bold">Dirty</div>
          <div className="text-xl font-bold font-mono text-[#B45309] mt-0.5">{dirtyCount}</div>
        </div>
        <div className="bg-white border border-[#D8DCD5] rounded-[6px] p-2">
          <div className="text-[#57636E] text-[10px] uppercase font-bold">In Progress</div>
          <div className="text-xl font-bold font-mono text-[#0E7490] mt-0.5">{inProgressCount}</div>
        </div>
        <div className="bg-white border border-[#D8DCD5] rounded-[6px] p-2">
          <div className="text-[#57636E] text-[10px] uppercase font-bold">Inspected</div>
          <div className="text-xl font-bold font-mono text-[#1E293B] mt-0.5">{inspectedCount}</div>
        </div>
        <div className="bg-white border border-[#D8DCD5] rounded-[6px] p-2 col-span-2 sm:col-span-1">
          <div className="text-[#57636E] text-[10px] uppercase font-bold">Out of Service</div>
          <div className="text-xl font-bold font-mono text-[#B91C1C] mt-0.5">{oosCount}</div>
        </div>
      </div>

      {/* TAB 1: Tasks (Departures first) */}
      {activeSubTab === 'tasks' && (
        <div className="flex flex-col gap-3">
          {/* Filter Pills */}
          <div className="flex items-center gap-2 text-xs">
            <span className="font-semibold text-[#57636E]">Filter:</span>
            <button
              onClick={() => setTaskFilter('all')}
              className={`px-2.5 py-1 rounded-[4px] font-semibold transition-colors ${
                taskFilter === 'all' ? 'bg-[#14202B] text-white' : 'bg-white text-[#57636E] border'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setTaskFilter('pending')}
              className={`px-2.5 py-1 rounded-[4px] font-semibold transition-colors ${
                taskFilter === 'pending' ? 'bg-[#14202B] text-white' : 'bg-white text-[#57636E] border'
              }`}
            >
              Pending
            </button>
            <button
              onClick={() => setTaskFilter('in_progress')}
              className={`px-2.5 py-1 rounded-[4px] font-semibold transition-colors ${
                taskFilter === 'in_progress' ? 'bg-[#14202B] text-white' : 'bg-white text-[#57636E] border'
              }`}
            >
              In Progress
            </button>
            <button
              onClick={() => setTaskFilter('completed')}
              className={`px-2.5 py-1 rounded-[4px] font-semibold transition-colors ${
                taskFilter === 'completed' ? 'bg-[#14202B] text-white' : 'bg-white text-[#57636E] border'
              }`}
            >
              Completed / Inspected
            </button>
          </div>

          {/* Task Cards: Mobile-first 360px friendly */}
          <div className="flex flex-col gap-2.5">
            {filteredTasks.length === 0 ? (
              <div className="bg-white border border-[#D8DCD5] rounded-[6px] p-8 text-center text-sm text-[#57636E]">
                No housekeeping tasks match this filter.
              </div>
            ) : (
              filteredTasks.map((task) => {
                const room = rooms.find((r) => r.id === task.roomId);
                const rType = roomTypes.find((rt) => rt.id === room?.roomTypeId);

                return (
                  <div
                    key={task.id}
                    className="bg-white border border-[#D8DCD5] rounded-[6px] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs"
                  >
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-base text-[#14202B]">
                          Room {task.roomNumber}
                        </span>
                        <StatusLabel status={task.status} />
                        {task.priority === 'high' && (
                          <span className="px-1.5 py-0.5 bg-[#EA580C] text-white text-[10px] font-bold rounded-[3px]">
                            DEPARTURE PRIORITY
                          </span>
                        )}
                      </div>

                      <div className="text-xs text-[#57636E]">
                        <span className="font-semibold text-[#14202B]">
                          {task.type === 'checkout_clean'
                            ? 'Checkout Turnover Clean'
                            : task.type === 'stayover_clean'
                            ? 'Stayover Service'
                            : 'Deep Sanitization'}
                        </span>{' '}
                        • {rType?.name}
                      </div>

                      {task.notes && (
                        <div className="text-xs text-[#14202B] bg-[#F4F5F2] p-2 rounded-[4px] mt-1">
                          {task.notes}
                        </div>
                      )}

                      <div className="text-[11px] text-[#57636E] mt-0.5">
                        Assigned: {task.assignedStaffName || 'Unassigned'}
                        {task.startedAt && ` • Started: ${formatDateTime(task.startedAt)}`}
                        {task.inspectedAt && ` • Inspected by: ${task.inspectedByStaffName || 'Supervisor'}`}
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2 shrink-0">
                      {task.status === 'pending' && (
                        <Button
                          size="sm"
                          variant="primary"
                          onClick={() => handleStartTask(task.id)}
                        >
                          Start Cleaning
                        </Button>
                      )}

                      {task.status === 'in_progress' && (
                        <Button
                          size="sm"
                          variant="primary"
                          onClick={() => handleCompleteTask(task.id)}
                        >
                          Mark Finished
                        </Button>
                      )}

                      {task.status === 'completed' && isSupervisor && (
                        <Button
                          size="sm"
                          variant="primary"
                          onClick={() => handleInspectTask(task.id)}
                        >
                          Mark Inspected
                        </Button>
                      )}

                      {task.status === 'inspected' && (
                        <span className="text-xs font-bold text-[#15803D] px-2 py-1 bg-[#DCFCE7] rounded-[4px]">
                          Ready for Guest
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* TAB 2: Room Grid (All 40 rooms) */}
      {activeSubTab === 'rooms' && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between text-xs bg-white p-3 rounded-[6px] border border-[#D8DCD5]">
            <span className="font-semibold text-[#57636E]">Floor Filter:</span>
            <select
              value={floorFilter}
              onChange={(e) => setFloorFilter(e.target.value)}
              className="h-8 px-2 rounded-[6px] border border-[#D8DCD5] bg-white font-semibold"
            >
              <option value="all">All Floors (40 Rooms)</option>
              <option value="1">Floor 1 (Rooms 101-110)</option>
              <option value="2">Floor 2 (Rooms 201-210)</option>
              <option value="3">Floor 3 (Rooms 301-310)</option>
              <option value="4">Floor 4 (Rooms 401-410)</option>
            </select>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-2.5">
            {rooms
              .filter((r) => floorFilter === 'all' || r.floor === Number(floorFilter))
              .map((room) => {
                const rType = roomTypes.find((rt) => rt.id === room.roomTypeId);

                return (
                  <div
                    key={room.id}
                    className="bg-white border border-[#D8DCD5] rounded-[6px] p-3 flex flex-col justify-between text-left"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-sm text-[#14202B]">
                          Rm {room.roomNumber}
                        </span>
                        <span className="text-[10px] text-[#57636E]">Fl {room.floor}</span>
                      </div>
                      <div className="text-[11px] text-[#57636E] truncate mt-0.5">
                        {rType?.code}
                      </div>
                      <div className="mt-2">
                        <StatusLabel status={room.status} size="sm" />
                      </div>
                    </div>

                    {/* Quick status selector */}
                    <div className="mt-3 pt-2 border-t border-[#E8ECE5]">
                      <select
                        value={room.status}
                        onChange={(e) => updateRoomStatus(room.id, e.target.value as RoomStatus)}
                        className="w-full h-7 px-1 text-[11px] font-semibold rounded-[4px] border border-[#D8DCD5] bg-[#F4F5F2]"
                      >
                        <option value="clean">Clean</option>
                        <option value="inspected">Inspected</option>
                        <option value="dirty">Dirty</option>
                        <option value="in_progress">In Progress</option>
                        <option value="out_of_service">Out of Service</option>
                      </select>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* TAB 3: Maintenance Issues */}
      {activeSubTab === 'maintenance' && (
        <div className="flex flex-col gap-3">
          {maintenanceIssues.length === 0 ? (
            <div className="bg-white border border-[#D8DCD5] rounded-[6px] p-8 text-center text-sm text-[#57636E]">
              No maintenance issues logged.
            </div>
          ) : (
            maintenanceIssues.map((m) => (
              <div
                key={m.id}
                className="bg-white border border-[#D8DCD5] rounded-[6px] p-4 flex flex-col sm:flex-row sm:items-start justify-between gap-3 text-left"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-sm text-[#14202B]">
                      Room {m.roomNumber}
                    </span>
                    <span className="font-bold text-sm text-[#14202B]">{m.title}</span>
                    <StatusLabel status={m.priority} />
                    <StatusLabel status={m.status} />
                  </div>
                  <p className="text-xs text-[#57636E] mt-1">{m.description}</p>
                  <div className="text-[11px] text-[#57636E] mt-1">
                    Reported by: {m.reportedBy} on {formatDateTime(m.reportedAt)}
                    {m.blockedRoom && (
                      <span className="ml-2 font-bold text-[#B91C1C]">
                        • Room Blocked: {formatDate(m.blockedStartDate)} to {formatDate(m.blockedEndDate)}
                      </span>
                    )}
                  </div>
                </div>

                {m.status !== 'resolved' && (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => resolveMaintenanceIssue(m.id, 'Repaired by engineering staff.')}
                  >
                    Mark Resolved
                  </Button>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Log Maintenance Modal */}
      {isMaintModalOpen && (
        <Dialog
          isOpen={true}
          onClose={() => setIsMaintModalOpen(false)}
          title="Log Maintenance Work Order"
          maxWidth="md"
        >
          <form onSubmit={handleCreateMaintenance} className="flex flex-col gap-3 text-left">
            <div>
              <label className="text-xs font-semibold text-[#14202B] block mb-1">Room *</label>
              <select
                value={maintRoomId}
                onChange={(e) => setMaintRoomId(e.target.value)}
                className="w-full h-9 px-3 text-sm rounded-[6px] border border-[#D8DCD5] bg-white font-mono"
              >
                {rooms.map((r) => (
                  <option key={r.id} value={r.id}>
                    Room {r.roomNumber} (Floor {r.floor} • {r.status})
                  </option>
                ))}
              </select>
            </div>

            <Input
              label="Issue Title *"
              placeholder="e.g. Geyser thermostat failure / AC water drip"
              value={maintTitle}
              onChange={(e) => setMaintTitle(e.target.value)}
              required
            />

            <div>
              <label className="text-xs font-semibold text-[#14202B] block mb-1">Description</label>
              <textarea
                value={maintDescription}
                onChange={(e) => setMaintDescription(e.target.value)}
                placeholder="Provide details for the maintenance technician..."
                className="w-full h-20 p-2 text-sm rounded-[6px] border border-[#D8DCD5] bg-white outline-none focus:ring-2 focus:ring-[#0F5E63]"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-[#14202B] block mb-1">Priority</label>
              <select
                value={maintPriority}
                onChange={(e) => setMaintPriority(e.target.value as any)}
                className="w-full h-9 px-3 text-sm rounded-[6px] border border-[#D8DCD5] bg-white font-semibold"
              >
                <option value="urgent">Urgent (Immediate attention)</option>
                <option value="high">High (Before next guest)</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>

            {/* Block room toggle */}
            <div className="p-3 bg-[#F4F5F2] border border-[#D8DCD5] rounded-[6px] flex flex-col gap-2">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-[#14202B]">
                <input
                  type="checkbox"
                  checked={blockRoom}
                  onChange={(e) => setBlockRoom(e.target.checked)}
                  className="rounded-[3px] accent-[#0F5E63] w-4 h-4 cursor-pointer"
                />
                Block Room as Out of Service
              </label>

              {blockRoom && (
                <div className="pt-2 border-t border-[#D8DCD5]">
                  <label className="text-[11px] font-semibold text-[#57636E] block mb-1">
                    Expected Block End Date
                  </label>
                  <input
                    type="date"
                    value={blockEndDate}
                    onChange={(e) => setBlockEndDate(e.target.value)}
                    className="w-full h-8 px-2 text-xs rounded-[4px] border border-[#D8DCD5] font-mono"
                  />
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-[#D8DCD5]">
              <Button type="button" size="sm" variant="secondary" onClick={() => setIsMaintModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" variant="primary">
                Save Work Order
              </Button>
            </div>
          </form>
        </Dialog>
      )}
    </div>
  );
};
