import { useState, useEffect, useRef } from 'react';
import {
  Building2,
  Grid3X3,
  Wifi,
  Wind,
  Coffee,
  Tv,
  Plus,
  X,
  Edit,
  Trash2,
  ChevronDown,
} from 'lucide-react';
import { floorService } from '../../services/floorService';
import { roomTypeService, RoomType } from '../../services/roomTypeService';
import { assignedRoomService, AssignedRoomData } from '../../services/assignedRoomService';
import { usePermissions } from '../../hooks/usePermissions';

interface ApiFloor {
  id: number;
  floorName: string;
  numberOfRooms: number;
  roomNames: string;
}

const statusConfig = {
  available: { label: 'Available', bg: 'bg-green-500', text: 'text-white', card: 'border-green-400 bg-green-50' },
  occupied: { label: 'Occupied', bg: 'bg-red-500', text: 'text-white', card: 'border-red-400 bg-red-50' },
  cleaning: { label: 'Cleaning', bg: 'bg-yellow-400', text: 'text-white', card: 'border-yellow-400 bg-yellow-50' },
  maintenance: { label: 'Maintenance', bg: 'bg-gray-500', text: 'text-white', card: 'border-gray-400 bg-gray-100' },
  reserved: { label: 'Reserved', bg: 'bg-blue-500', text: 'text-white', card: 'border-blue-400 bg-blue-50' },
  dirty: { label: 'Dirty', bg: 'bg-orange-500', text: 'text-white', card: 'border-orange-400 bg-orange-50' },
  unassigned: { label: 'Unassigned', bg: 'bg-gray-400', text: 'text-gray-600', card: 'border-gray-300 bg-gray-50' },
};

const amenityIcons: Record<string, React.ReactNode> = {
  wifi: <Wifi size={11} />,
  ac: <Wind size={11} />,
  tv: <Tv size={11} />,
  coffee: <Coffee size={11} />,
};

export function FloorPlan() {
  const { canEdit, canDelete } = usePermissions();

  const [showAddModal, setShowAddModal] = useState(false);
  const [floorData, setFloorData] = useState({ name: '', roomNames: '' });
  const [apiFloors, setApiFloors] = useState<ApiFloor[]>([]);
  const [assignedRooms, setAssignedRooms] = useState<AssignedRoomData[]>([]);
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);

  const [editFloor, setEditFloor] = useState<ApiFloor | null>(null);
  const [editData, setEditData] = useState({ name: '', roomNames: '' });
  const [deleteFloorId, setDeleteFloorId] = useState<number | null>(null);

  // Accordion state: multiple floors can stay open at the same time
  const [openFloorIds, setOpenFloorIds] = useState<number[]>([]);
  const hasInitializedAccordion = useRef(false);

  // Assignment Mode States
  const [isAssignMode, setIsAssignMode] = useState(false);
  const [selectedRoomTypeId, setSelectedRoomTypeId] = useState<number | ''>('');
  const [selectedAssignments, setSelectedAssignments] = useState<{ roomNo: string; floorId: number }[]>([]);
  const [savingAssignments, setSavingAssignments] = useState(false);

  const fetchAllData = async () => {
    try {
      const [fData, aData, rtData] = await Promise.all([
        floorService.getFloors(),
        assignedRoomService.getAll(),
        roomTypeService.getAll(),
      ]);

      const floors = fData || [];

      setApiFloors(floors);
      setAssignedRooms(aData || []);
      setRoomTypes(rtData || []);

      setOpenFloorIds((prev) => {
        const validFloorIds = floors.map((floor: ApiFloor) => floor.id);

        if (!hasInitializedAccordion.current) {
          hasInitializedAccordion.current = true;
          return validFloorIds;
        }

        return prev.filter((id) => validFloorIds.includes(id));
      });
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  useEffect(() => {
    if (selectedRoomTypeId) {
      const existing = assignedRooms.filter((r) => r.roomTypeId === Number(selectedRoomTypeId));
      setSelectedAssignments(existing.map((r) => ({ roomNo: r.roomNo, floorId: r.floorId })));
    } else {
      setSelectedAssignments([]);
    }
  }, [selectedRoomTypeId, assignedRooms]);

  const toggleFloorAccordion = (floorId: number) => {
    setOpenFloorIds((prev) => {
      const isAlreadyOpen = prev.includes(floorId);

      if (isAlreadyOpen) {
        return prev.filter((id) => id !== floorId);
      }

      return [...prev, floorId];
    });
  };

  const toggleRoomSelection = (roomNo: string, floorId: number) => {
    if (!isAssignMode || !selectedRoomTypeId) return;

    setSelectedAssignments((prev) => {
      const exists = prev.some((a) => a.roomNo === roomNo && a.floorId === floorId);

      if (exists) {
        return prev.filter((a) => !(a.roomNo === roomNo && a.floorId === floorId));
      }

      return [...prev, { roomNo, floorId }];
    });
  };

  const saveAssignments = async () => {
    if (!selectedRoomTypeId) return;

    setSavingAssignments(true);

    try {
      await assignedRoomService.assignRoomType(Number(selectedRoomTypeId), selectedAssignments);
      alert('Rooms assigned successfully!');
      setIsAssignMode(false);
      setSelectedRoomTypeId('');
      fetchAllData();
    } catch (error) {
      console.error(error);
      alert('Failed to assign rooms. Please try again.');
    } finally {
      setSavingAssignments(false);
    }
  };

  const handleAddFloor = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await floorService.createFloor({
        name: floorData.name,
        roomNames: floorData.roomNames,
      });

      setShowAddModal(false);
      setFloorData({ name: '', roomNames: '' });
      fetchAllData();
    } catch (err) {
      console.error(err);
      alert('Failed to create floor.');
    }
  };

  const openEditModal = (floor: ApiFloor) => {
    setEditFloor(floor);
    setEditData({ name: floor.floorName, roomNames: floor.roomNames || '' });
  };

  const handleEditFloor = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editFloor) return;

    try {
      await floorService.updateFloor(editFloor.id, {
        name: editData.name,
        roomNames: editData.roomNames,
      });

      setEditFloor(null);
      fetchAllData();
    } catch (err) {
      console.error(err);
      alert('Failed to update floor.');
    }
  };

  const handleDeleteFloor = async () => {
    if (!deleteFloorId) return;

    try {
      await floorService.deleteFloor(deleteFloorId);
      setDeleteFloorId(null);
      fetchAllData();
    } catch (err) {
      console.error(err);
      alert('Failed to delete floor.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#0F172A]">Floor Plan</h1>
          <p className="text-gray-600 mt-1">Visual overview of all rooms by floor</p>
        </div>

        <div className="flex items-center gap-3">
          {canEdit && (
            <>
              <button
                onClick={() => setIsAssignMode(!isAssignMode)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors border ${
                  isAssignMode
                    ? 'border-gray-300 text-gray-700 bg-gray-100 hover:bg-gray-200'
                    : 'border-[#1D4ED8] text-[#1D4ED8] hover:bg-blue-50'
                }`}
              >
                {isAssignMode ? 'Cancel Assignment' : 'Assign Room Types'}
              </button>

              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 bg-[#1D4ED8] text-white px-6 py-2 rounded-lg hover:bg-[#1E40AF] transition-colors"
              >
                <Plus size={20} /> Add Floor
              </button>
            </>
          )}
        </div>
      </div>

      {isAssignMode && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex flex-wrap items-center gap-4">
          <div>
            <label className="block text-sm font-medium text-blue-900 mb-1">
              Select Room Type to Assign:
            </label>

            <select
              value={selectedRoomTypeId}
              onChange={(e) => setSelectedRoomTypeId(e.target.value === '' ? '' : Number(e.target.value))}
              className="w-48 px-3 py-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="">-- Select Type --</option>
              {roomTypes.map((rt) => (
                <option key={rt.id} value={rt.id}>
                  {rt.name}
                </option>
              ))}
            </select>
          </div>

          <div className="text-sm text-blue-800 flex-1 ml-2">
            {selectedRoomTypeId
              ? 'Click on rooms below to toggle assignment for this type.'
              : 'Please select a room type from the dropdown first.'}
          </div>

          {selectedRoomTypeId !== '' && (
            <button
              onClick={saveAssignments}
              disabled={savingAssignments}
              className="bg-[#1D4ED8] text-white px-6 py-2 rounded-lg hover:bg-[#1E40AF] transition-colors disabled:opacity-50"
            >
              {savingAssignments ? 'Saving...' : `Save (${selectedAssignments.length} rooms)`}
            </button>
          )}
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-[#0F172A]">Add New Floor</h2>

              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleAddFloor} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Floor Name</label>

                <input
                  type="text"
                  required
                  value={floorData.name}
                  onChange={(e) => setFloorData({ ...floorData, name: e.target.value })}
                  placeholder="e.g. Ground Floor, 1st Floor"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Room Names (comma separated)
                </label>

                <textarea
                  required
                  value={floorData.roomNames}
                  onChange={(e) => setFloorData({ ...floorData, roomNames: e.target.value })}
                  placeholder="e.g. loft 1, loft 2, 101, 102"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]"
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="px-4 py-2 bg-[#1D4ED8] text-white rounded-lg hover:bg-[#1E40AF] transition-colors"
                >
                  Create Floor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Legend */}
      {!isAssignMode && (
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex flex-wrap items-center gap-4">
            {Object.entries(statusConfig).map(([key, cfg]) => (
              <div key={key} className="flex items-center gap-2">
                <span className={`w-3 h-3 rounded-full ${cfg.bg}`} />
                <span className="text-sm text-gray-700">{cfg.label}</span>
              </div>
            ))}

            <div className="ml-auto text-sm text-gray-500">
              <span className="font-semibold text-[#0F172A]">
                {assignedRooms.filter((r) => r.status === 'available').length}
              </span>{' '}
              available out of {assignedRooms.length} assigned rooms
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      {!isAssignMode && (
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
          {Object.entries(statusConfig).map(([key, cfg]) => {
            const totalRooms = apiFloors.reduce((sum, f) => sum + (f.numberOfRooms || 0), 0);
            let val = 0;

            if (key === 'unassigned') {
              val = totalRooms - assignedRooms.length;
            } else {
              val = assignedRooms.filter((r) => r.status === key).length;
            }

            return (
              <div key={key} className={`rounded-xl p-3 border-2 ${cfg.card} text-center`}>
                <div className="text-xl font-bold text-gray-800">{val}</div>
                <div className="text-xs text-gray-600 mt-0.5">{cfg.label}</div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit Floor Modal */}
      {editFloor && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-[#0F172A]">Edit Floor</h2>

              <button
                onClick={() => setEditFloor(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleEditFloor} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Floor Name</label>

                <input
                  type="text"
                  required
                  value={editData.name}
                  onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Room Names (comma separated)
                </label>

                <textarea
                  required
                  value={editData.roomNames}
                  onChange={(e) => setEditData({ ...editData, roomNames: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]"
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setEditFloor(null)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="px-4 py-2 bg-[#1D4ED8] text-white rounded-lg hover:bg-[#1E40AF] transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {deleteFloorId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-sm p-6">
            <h2 className="text-lg font-bold text-[#0F172A] mb-2">Delete Floor</h2>

            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this floor? This will also remove all associated rooms.
            </p>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteFloorId(null)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>

              <button
                onClick={handleDeleteFloor}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floor Layouts Accordion */}
      {apiFloors.map((floor) => {
        const parsedRooms =
          typeof floor.roomNames === 'string'
            ? floor.roomNames
                .split(',')
                .map((r) => r.trim())
                .filter(Boolean)
            : [];

        const floorRooms = parsedRooms.map((r) => ({
          number: r,
          type: 'Unassigned',
          status: 'available' as const,
        }));

        const isFloorOpen = openFloorIds.includes(floor.id);

        return (
          <div key={floor.id} className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
            <button
              type="button"
              onClick={() => toggleFloorAccordion(floor.id)}
              className="w-full px-6 py-4 bg-[#0F172A] flex items-center gap-2 text-left hover:bg-[#111C33] transition-colors"
              aria-expanded={isFloorOpen}
            >
              <Building2 size={18} className="text-[#D4A017]" />

              <h2 className="font-semibold text-white">{floor.floorName}</h2>

              <span className="ml-2 text-gray-400 text-sm">({floorRooms.length} rooms)</span>

              <div className="ml-auto flex items-center gap-2">
                  <>
                   {canEdit && (
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditModal(floor);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.stopPropagation();
                          openEditModal(floor);
                        }
                      }}
                      className="p-1.5 text-gray-400 hover:text-blue-400 hover:bg-white/10 rounded-lg transition-colors"
                    >
                      <Edit size={15} />
                    </span>
                   )}

                   {canDelete && (
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteFloorId(floor.id);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.stopPropagation();
                          setDeleteFloorId(floor.id);
                        }
                      }}
                      className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-white/10 rounded-lg transition-colors"
                    >
                      <Trash2 size={15} />
                    </span>
                   )}
                  </>

                <ChevronDown
                  size={20}
                  className={`text-gray-300 transition-transform duration-200 ${
                    isFloorOpen ? 'rotate-180' : 'rotate-0'
                  }`}
                />
              </div>
            </button>

            {isFloorOpen && (
              <div className="p-6 border-t border-gray-100">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                  {floorRooms.map((room) => {
                    const roomNoStr = room.number;

                    const assignedData = assignedRooms.find(
                      (a) => String(a.roomNo) === roomNoStr && a.floorId === floor.id
                    );

                    const isSelected = selectedAssignments.some(
                      (a) => String(a.roomNo) === roomNoStr && a.floorId === floor.id
                    );

                    const displayType = assignedData?.RoomType?.name || 'Unassigned';

                    let cardStyle = statusConfig.unassigned.card;

                    if (isAssignMode) {
                      if (selectedRoomTypeId) {
                        cardStyle = isSelected
                          ? 'border-[#1D4ED8] bg-blue-50 ring-2 ring-[#1D4ED8]'
                          : 'border-gray-200 bg-white opacity-60';
                      } else {
                        cardStyle = 'border-gray-200 bg-white';
                      }
                    } else if (assignedData) {
                      const cfg =
                        statusConfig[assignedData.status as keyof typeof statusConfig] ||
                        statusConfig.available;

                      cardStyle = cfg.card;
                    }

                    return (
                      <div
                        key={room.number}
                        onClick={() => toggleRoomSelection(roomNoStr, floor.id)}
                        className={`border-2 rounded-xl p-4 transition-all ${
                          isAssignMode && selectedRoomTypeId
                            ? 'cursor-pointer hover:shadow-md'
                            : 'cursor-default'
                        } ${cardStyle}`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-1">
                            <Grid3X3
                              size={14}
                              className={isAssignMode && isSelected ? 'text-blue-600' : 'text-gray-500'}
                            />

                            <span className="font-bold text-gray-800 text-sm">{room.number}</span>
                          </div>

                          {!isAssignMode && (
                            <span
                              className={`w-2.5 h-2.5 rounded-full ${
                                assignedData
                                  ? statusConfig[assignedData.status as keyof typeof statusConfig]?.bg ||
                                    statusConfig.available.bg
                                  : statusConfig.unassigned.bg
                              }`}
                            />
                          )}
                        </div>

                        <div
                          className={`text-xs font-semibold ${
                            isAssignMode && isSelected ? 'text-blue-700' : 'text-gray-600'
                          } mb-2`}
                        >
                          {displayType}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}