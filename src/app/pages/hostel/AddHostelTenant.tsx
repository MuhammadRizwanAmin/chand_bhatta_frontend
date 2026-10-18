import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import { Camera, Upload, Trash2, Plus, ChevronLeft, Save } from "lucide-react";
import api from "../../services/api";

const PLACEHOLDER = 'https://placehold.co/200';

export function AddHostelTenant() {
  const navigate = useNavigate();

  const [formValues, setFormValues] = useState({
    name: "",
    cnic: "",
    phone: "",
    hostelRoomId: "",
    rent: "",
    status: "Active",
    extraAmounts: [{ key: "", value: "", type: "Recurring" }],
  });

  const [rooms, setRooms] = useState<any[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  
  const [profileImagePreview, setProfileImagePreview] = useState(PLACEHOLDER);
  const [cnicFrontPreview, setCnicFrontPreview] = useState(PLACEHOLDER);
  const [cnicBackPreview, setCnicBackPreview] = useState(PLACEHOLDER);
  
  const [imageModal, setImageModal] = useState<{ show: boolean; target: string | null }>({ show: false, target: null });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const res = await api.get("/hostel-rooms/all");
        if (res.data && res.data.data) {
          const roomOptions = res.data.data
            .filter((r: any) => (r.tenants ? r.tenants.length : 0) < r.capacity)
            .map((r: any) => ({
              id: r.id,
              label: `Room ${r.roomNumber} (Cap: ${r.capacity}, Floor: ${r.floorNumber})`
            }));
          setRooms(roomOptions);
        }
      } catch (err) {
        console.error("Failed to fetch rooms", err);
      }
    };
    fetchRooms();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormValues(prev => ({ ...prev, [name]: value }));
  };

  const handleNumericInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (/^\d*\.?\d*$/.test(value)) {
      setFormValues((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const cleanValue = value.replace(/[^a-zA-Z\s]/g, "");
    setFormValues((prev) => ({ ...prev, [name]: cleanValue }));
  };

  const handleCNICChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    let cleanValue = value.replace(/\D/g, "");
    let formattedValue = cleanValue;
    if (cleanValue.length > 5 && cleanValue.length <= 12) {
      formattedValue = `${cleanValue.slice(0, 5)}-${cleanValue.slice(5)}`;
    } else if (cleanValue.length > 12) {
      formattedValue = `${cleanValue.slice(0, 5)}-${cleanValue.slice(5, 12)}-${cleanValue.slice(12, 13)}`;
    }
    setFormValues(prev => ({ ...prev, cnic: formattedValue }));
  };

  const handleExtraAmountChange = (index: number, field: string, value: string) => {
    const updated = [...formValues.extraAmounts];
    if (field === "value") {
      if (/^\d*\.?\d*$/.test(value)) {
        updated[index] = { ...updated[index], [field]: value };
        setFormValues(prev => ({ ...prev, extraAmounts: updated }));
      }
    } else {
      updated[index] = { ...updated[index], [field]: value };
      setFormValues(prev => ({ ...prev, extraAmounts: updated }));
    }
  };

  const addExtraAmountRow = () => {
    setFormValues(prev => ({
      ...prev,
      extraAmounts: [...prev.extraAmounts, { key: "", value: "", type: "Recurring" }]
    }));
  };

  const removeExtraAmountRow = (index: number) => {
    const updated = formValues.extraAmounts.filter((_, i) => i !== index);
    setFormValues(prev => ({ ...prev, extraAmounts: updated }));
  };

  const validateForm = () => {
    const e: Record<string, string> = {};
    if (!formValues.name) e.name = "Full Name is required";
    if (!formValues.cnic) e.cnic = "CNIC is required";
    if (!formValues.phone) e.phone = "Phone is required";
    if (!formValues.rent) e.rent = "Room Rent is required";
    if (!formValues.hostelRoomId) e.hostelRoomId = "Room selection is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("name", formValues.name);
      fd.append("cnic", formValues.cnic);
      fd.append("phone", formValues.phone);
      fd.append("hostelRoomId", formValues.hostelRoomId);
      fd.append("rent", formValues.rent);
      fd.append("status", formValues.status);
      
      const extra = formValues.extraAmounts.filter(x => x.key && x.value);
      fd.append("extraAmounts", JSON.stringify(extra));

      if (profileImagePreview && profileImagePreview !== PLACEHOLDER) {
        const blob = await (await fetch(profileImagePreview)).blob();
        fd.append("profileImage", blob);
      }
      if (cnicFrontPreview && cnicFrontPreview !== PLACEHOLDER) {
        const blob = await (await fetch(cnicFrontPreview)).blob();
        fd.append("cnicFront", blob);
      }
      if (cnicBackPreview && cnicBackPreview !== PLACEHOLDER) {
        const blob = await (await fetch(cnicBackPreview)).blob();
        fd.append("cnicBack", blob);
      }

      const res = await api.post("/hostel-tenants/add", fd, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      if (res.data) {
        navigate("/pms/rooms");
      }
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || "Error adding tenant");
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (imageModal.target === "profile") setProfileImagePreview(reader.result as string);
        if (imageModal.target === "cnicFront") setCnicFrontPreview(reader.result as string);
        if (imageModal.target === "cnicBack") setCnicBackPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      setImageModal({ show: false, target: null });
    }
  };

  const openCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      alert('Camera not accessible');
    }
  };

  const captureCamera = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      canvas.getContext('2d')?.drawImage(videoRef.current, 0, 0);
      canvas.toBlob(blob => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          if (imageModal.target === "profile") setProfileImagePreview(url);
          if (imageModal.target === "cnicFront") setCnicFrontPreview(url);
          if (imageModal.target === "cnicBack") setCnicBackPreview(url);
          stopCamera();
        }
      });
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setImageModal({ show: false, target: null });
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      <div className="flex items-center gap-4">
        <button 
          onClick={() => navigate(-1)}
          className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
        >
          <ChevronLeft size={20} className="text-slate-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Add Hostel Tenant</h1>
          <p className="text-sm text-slate-500 mt-1">Register a new tenant in the hostel system.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          
          <div className="flex flex-col items-center justify-center">
            <div className="relative group">
              <img
                src={profileImagePreview}
                alt="Profile"
                className="w-32 h-32 rounded-full object-cover border-4 border-slate-100 shadow-sm cursor-pointer"
                onClick={() => setImageModal({ show: true, target: "profile" })}
              />
              <div 
                onClick={() => setImageModal({ show: true, target: "profile" })}
                className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity"
              >
                <Camera className="text-white" />
              </div>
            </div>
            <p className="text-sm text-slate-500 mt-3 font-medium">Profile Picture</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
              <input 
                type="text" 
                name="name" 
                value={formValues.name} 
                onChange={handleTextChange} 
                className={`w-full px-3 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.name ? 'border-red-500' : 'border-slate-200'}`}
              />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">CNIC Number</label>
              <input 
                type="text" 
                name="cnic" 
                value={formValues.cnic} 
                onChange={handleCNICChange} 
                placeholder="XXXXX-XXXXXXX-X"
                className={`w-full px-3 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.cnic ? 'border-red-500' : 'border-slate-200'}`}
              />
              {errors.cnic && <p className="text-red-500 text-xs mt-1">{errors.cnic}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number</label>
              <input 
                type="text" 
                name="phone" 
                value={formValues.phone} 
                onChange={(e) => {
                  const clean = e.target.value.replace(/\D/g, "");
                  setFormValues(prev => ({ ...prev, phone: clean }));
                }}
                className={`w-full px-3 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.phone ? 'border-red-500' : 'border-slate-200'}`}
              />
              {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Assigned Room</label>
              <select
                name="hostelRoomId"
                value={formValues.hostelRoomId}
                onChange={handleInputChange}
                className={`w-full px-3 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white ${errors.hostelRoomId ? 'border-red-500' : 'border-slate-200'}`}
              >
                <option value="">Select a room...</option>
                {rooms.map(room => (
                  <option key={room.id} value={room.id}>{room.label}</option>
                ))}
              </select>
              {errors.hostelRoomId && <p className="text-red-500 text-xs mt-1">{errors.hostelRoomId}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Room Rent (Monthly)</label>
              <input 
                type="text" 
                name="rent" 
                value={formValues.rent} 
                onChange={handleNumericInput} 
                className={`w-full px-3 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.rent ? 'border-red-500' : 'border-slate-200'}`}
              />
              {errors.rent && <p className="text-red-500 text-xs mt-1">{errors.rent}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
              <select
                name="status"
                value={formValues.status}
                onChange={handleInputChange}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
            <div className="flex flex-col items-center">
              <label className="block text-sm font-medium text-slate-700 mb-3 w-full text-center">CNIC Front</label>
              <div 
                onClick={() => setImageModal({ show: true, target: "cnicFront" })}
                className="relative group w-full max-w-sm h-48 rounded-xl border-2 border-dashed border-slate-300 overflow-hidden cursor-pointer hover:border-blue-500 transition-colors"
              >
                <img src={cnicFrontPreview} alt="CNIC Front" className="w-full h-full object-contain bg-slate-50" />
                <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Upload className="text-white mb-2" />
                  <span className="text-white text-sm font-medium">Click to upload</span>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col items-center">
              <label className="block text-sm font-medium text-slate-700 mb-3 w-full text-center">CNIC Back</label>
              <div 
                onClick={() => setImageModal({ show: true, target: "cnicBack" })}
                className="relative group w-full max-w-sm h-48 rounded-xl border-2 border-dashed border-slate-300 overflow-hidden cursor-pointer hover:border-blue-500 transition-colors"
              >
                <img src={cnicBackPreview} alt="CNIC Back" className="w-full h-full object-contain bg-slate-50" />
                <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Upload className="text-white mb-2" />
                  <span className="text-white text-sm font-medium">Click to upload</span>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Extra Charges</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {formValues.extraAmounts.map((extra, index) => (
                <div key={index} className="p-4 rounded-xl border border-slate-200 bg-slate-50 relative group">
                  {formValues.extraAmounts.length > 1 && (
                    <button 
                      type="button"
                      onClick={() => removeExtraAmountRow(index)}
                      className="absolute -top-3 -right-3 p-1.5 bg-red-100 text-red-600 rounded-full hover:bg-red-200 transition-colors opacity-0 group-hover:opacity-100 shadow-sm"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">Description</label>
                      <input 
                        type="text" 
                        value={extra.key} 
                        onChange={(e) => handleExtraAmountChange(index, "key", e.target.value)} 
                        placeholder="e.g. AC Fee"
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">Amount</label>
                      <input 
                        type="text" 
                        value={extra.value} 
                        onChange={(e) => handleExtraAmountChange(index, "value", e.target.value)} 
                        placeholder="0.00"
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">Type</label>
                      <select 
                        value={extra.type}
                        onChange={(e) => handleExtraAmountChange(index, "type", e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 bg-white"
                      >
                        <option value="Recurring">Recurring</option>
                        <option value="Initial">Initial</option>
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <button 
              type="button" 
              onClick={addExtraAmountRow}
              className="mt-4 flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
            >
              <Plus size={16} />
              Add Extra Charge
            </button>
          </div>

          <div className="pt-8 border-t border-slate-100 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-6 py-3 bg-[#1D4ED8] text-white font-medium rounded-xl hover:bg-blue-700 transition-all shadow-sm hover:shadow-md disabled:opacity-50"
            >
              <Save size={18} />
              {loading ? "Saving..." : "Save Tenant"}
            </button>
          </div>
        </form>
      </div>

      {imageModal.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Select Image Source</h2>
              <button onClick={stopCamera} className="text-slate-400 hover:text-slate-600">&times;</button>
            </div>
            
            <div className="p-6">
              {!stream ? (
                <div className="flex justify-around gap-4">
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1 flex flex-col items-center justify-center p-6 border-2 border-slate-200 border-dashed rounded-xl cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors"
                  >
                    <Upload size={32} className="text-blue-600 mb-3" />
                    <span className="font-medium text-slate-700">Upload File</span>
                  </div>
                  <div 
                    onClick={openCamera}
                    className="flex-1 flex flex-col items-center justify-center p-6 border-2 border-slate-200 border-dashed rounded-xl cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors"
                  >
                    <Camera size={32} className="text-blue-600 mb-3" />
                    <span className="font-medium text-slate-700">Use Camera</span>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-4">
                  <video ref={videoRef} autoPlay playsInline className="w-full rounded-xl bg-black" />
                  <div className="flex gap-3 w-full">
                    <button 
                      onClick={stopCamera}
                      className="flex-1 py-2 bg-slate-100 text-slate-700 rounded-xl font-medium hover:bg-slate-200 transition-colors"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={captureCamera}
                      className="flex-1 py-2 bg-[#1D4ED8] text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
                    >
                      Capture
                    </button>
                  </div>
                </div>
              )}
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*" 
                onChange={handleFileSelect} 
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
