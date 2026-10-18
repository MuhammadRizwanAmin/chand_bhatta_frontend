//@ts-nocheck
import { useState, useEffect, forwardRef } from "react";
import { ArrowLeft, Save, Paperclip, CalendarDays, Tag, Building2, AlertTriangle, BedDouble, User, Camera, X, Check, Plus, ShoppingCart, Trash2 } from "lucide-react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { toast } from 'sonner';
import "./modern-datepicker.css";
import { useNavigate } from "react-router";
import { ExtrasModal } from "./ExtrasModal";
// ─── Static Channel Options ───────────────────────────────────────────────────

const channelOptions = [
  { label: "Walk-in", value: "walkin" },
  { label: "Reference", value: "refernce" },
  { label: "Agent", value: "agent" },
  { label: "Phone", value: "phone" },
  { label: "Booking.com", value: "booking.com" },
  { label: "AirBnb", value: "airbnb" },
  { label: "Website", value: "website" },
  { label: "C/O Adil Khan", value: "C/O Adil Khan" },
  { label: "C/O Muhammad Kashif", value: "C/O Muhammad Kashif" },
  { label: "C/O Muhammad Aasif", value: "C/O Muhammad Aasif" },
  { label: "FO", value: "FO" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (n: number) =>
  "PKR " + Number(n || 0).toLocaleString("en-PK", { minimumFractionDigits: 0, maximumFractionDigits: 0 });

const calcDays = (s: string, e: string) => {
  if (!s || !e) return 0;
  const diff = new Date(e).getTime() - new Date(s).getTime();
  const d = Math.ceil(diff / 86400000);
  return d > 0 ? d : 1;
};

const today = new Date().toLocaleDateString("en-CA");
const tomorrowDate = new Date();
tomorrowDate.setDate(tomorrowDate.getDate() + 1);
const tomorrow = tomorrowDate.toLocaleDateString("en-CA");
const pad = (n: number) => String(n).padStart(2, "0");

const defaultForm = {
  customerCNIC: "", customerName: "", customerEmail: "",
  customerPhone: [""], customerAddress: "",
  maleGuests: "", femaleGuests: "", childrenGuests: "",
  purposeOfStay: "", channel: "", agent: "", referal: "",
  startDateTime: `${today}T12:00`,
  endDateTime: `${tomorrow}T12:00`,
  startDate: "",
  endDate: "",
  discount: "", discountType: "percentage", taxName: "GST", taxAmount: "0", isTaxInclusive: true,
  advancePaid: "", method: "cash", bankId: "", transactionId: "", note: "", resNotes: "",
  paymentDate: today,
  complimentary: "",
};

const toLocalDateTimeString = (date: Date | null) => {
  if (!date) return "";

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}`;
};

const fromLocalDateTimeString = (value: string) => {
  if (!value) return null;

  const [datePart, timePart = "00:00"] = value.split("T");
  const [year, month, day] = datePart.split("-").map(Number);
  const [hour, minute] = timePart.split(":").map(Number);

  if (!year || !month || !day) return null;

  return new Date(year, month - 1, day, hour || 0, minute || 0);
};
// ─── Design tokens ────────────────────────────────────────────────────────────
const T = {
  bg: "#FFFFFF",
  bgPage: "#F8FAFC",
  bgInput: "#FFFFFF",
  bgCard: "#FFFFFF",
  border: "#E2E8F0",
  borderFocus: "#1D4ED8",
  text: "#0F172A",
  textMuted: "#334155",
  textLight: "#475569",
  primary: "#1D4ED8",
  primaryLight: "#EFF6FF",
  primaryMid: "#DBEAFE",
  gold: "#B45309",
  goldLight: "#FFFBEB",
  success: "#059669",
  successLight: "#ECFDF5",
  danger: "#DC2626",
  dangerLight: "#FEF2F2",
  warning: "#D97706",
  warningLight: "#FFFBEB",
  sidebarBg: "#0F172A",
  sidebarText: "#F1F5F9",
  sidebarMuted: "#CBD5E1",
  sidebarBorder: "#1E293B",
  sidebarCard: "#1E293B",
};

// ─── Reusable UI ──────────────────────────────────────────────────────────────
const SectionHeader = ({ step, title, subtitle, color = T.primary }: any) => (
  <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16, marginTop: 28 }}>
    <div style={{
      width: 32, height: 32, borderRadius: "50%", background: color,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontWeight: 800, fontSize: 13, color: "#fff", flexShrink: 0,
      boxShadow: `0 0 0 4px ${color}18`,
    }}>{step}</div>
    <div>
      <div style={{ fontWeight: 700, fontSize: 14, color: T.text }}>{title}</div>
      {subtitle && <div style={{ fontSize: 12, color: T.textMuted, marginTop: 1 }}>{subtitle}</div>}
    </div>
    <div style={{ flex: 1, height: 1, background: T.border, marginLeft: 4 }} />
  </div>
);

const Label = ({ children, required }: any) => (
  <div style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>
    {children}
    {required && <span style={{ color: T.danger, marginLeft: 2 }}>*</span>}
  </div>
);

const inputBase = {
  width: "100%", background: T.bgInput, border: `1px solid ${T.border}`,
  borderRadius: 8, padding: "10px 13px", color: T.text,
  fontSize: 13, outline: "none", boxSizing: "border-box" as any,
  transition: "border-color 0.15s",
};
const DatePickerInput = forwardRef(
  ({ value, onClick, placeholder }, ref) => (
    <div
      onClick={onClick}
      style={{
        position: "relative",
        width: "100%",
        cursor: "pointer",
      }}
    >
      <input
        ref={ref}
        value={value || ""}
        readOnly
        placeholder={placeholder}
        style={{
          ...inputBase,
          paddingLeft: 42,
          height: 46,
          borderRadius: 12,
          border: `1px solid ${T.border}`,
          background: "#fff",
          fontWeight: 500,
          boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
        }}
      />

      <div
        style={{
          position: "absolute",
          left: 14,
          top: "50%",
          transform: "translateY(-50%)",
          color: T.primary,
          display: "flex",
          alignItems: "center",
        }}
      >
        <CalendarDays size={18} strokeWidth={2.2} />
      </div>
    </div>
  )
);

DatePickerInput.displayName = "DatePickerInput";
const Input = ({ label, type = "text", value, onChange, onBlur, placeholder = "", readOnly = false, error = "", required = false, ...props }: any) => (
  <div>
    <Label required={required}>{label}</Label>
    <input
      type={type} value={value} onChange={onChange} onBlur={onBlur} placeholder={placeholder} readOnly={readOnly}
      {...props}
      style={{
        ...inputBase,
        background: error ? T.dangerLight : (readOnly ? T.bgPage : T.bgInput),
        color: readOnly ? T.textMuted : T.text,
        cursor: readOnly ? "not-allowed" : "text",
        border: `1px solid ${error ? T.danger : T.border}`,
        boxShadow: error ? `0 0 0 2px ${T.danger}40` : 'none',
        transition: 'all 0.2s'
      }}
    />
    {error && <div style={{ color: T.danger, fontSize: 11, marginTop: 4, fontWeight: 500 }}>{error}</div>}
  </div>
);

const Select2 = ({ label, value, onChange, options, placeholder = "Select...", error = "", required = false, ...props }: any) => (
  <div>
    <Label required={required}>{label}</Label>
    <select value={value} onChange={(e) => onChange(e.target.value)}
      {...props}
      style={{
        ...inputBase, appearance: "none" as any, cursor: "pointer", color: value ? T.text : T.textMuted,
        border: `1px solid ${error ? T.danger : T.border}`,
        background: error ? T.dangerLight : T.bgInput,
        boxShadow: error ? `0 0 0 2px ${T.danger}40` : 'none',
        transition: 'all 0.2s',
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%2364748B' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`,
        backgroundRepeat: "no-repeat", backgroundPosition: "right 12px center", paddingRight: 32,
      }}>
      <option value="">{placeholder}</option>
      {options.map((o: any) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
    {error && <div style={{ color: T.danger, fontSize: 11, marginTop: 4, fontWeight: 500 }}>{error}</div>}
  </div>
);

const Textarea2 = ({ label, value, onChange, placeholder = "", rows = 3 }: any) => (
  <div>
    <Label>{label}</Label>
    <textarea value={value} onChange={onChange} placeholder={placeholder} rows={rows}
      style={{ ...inputBase, resize: "vertical" }} />
  </div>
);

const Card = ({ children, style = {} }: any) => (
  <div style={{ background: T.bgCard, borderRadius: 12, border: `1px solid ${T.border}`, padding: 20, ...style }}>{children}</div>
);

const Grid = ({ cols = 3, children, gap = 16 }: any) => (
  <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, 1fr)`, gap }}>{children}</div>
);

// ─── Main Component ───────────────────────────────────────────────────────────
export default function AddReservation() {
  const [fetchMode, setFetchMode] = useState<"roomType" | "floor">("roomType");
  const [selectedRoomType, setSelectedRoomType] = useState("");
  const [selectedRooms, setSelectedRooms] = useState<any[]>([]);
  const [roomTypeRates, setRoomTypeRates] = useState<Record<number, number>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  // Extras / POS items state
  const [selectedExtras, setSelectedExtras] = useState<any[]>([]);
  const [isExtrasModalOpen, setIsExtrasModalOpen] = useState(false);

  // Company Reservation State
  const [isCompanyReservation, setIsCompanyReservation] = useState(false);
  const [selectedCompanyId, setSelectedCompanyId] = useState("");
  const [companies, setCompanies] = useState<any[]>([]);
  const [companyRates, setCompanyRates] = useState<Record<number, number>>({});
  const [lastSearchedCNIC, setLastSearchedCNIC] = useState("");
  const [form, setForm] = useState({ ...defaultForm });

  const [cnicFrontFile, setCnicFrontFile] = useState<File | null>(null);
  const [cnicFrontPreview, setCnicFrontPreview] = useState<string>('');
  const [cnicBackFile, setCnicBackFile] = useState<File | null>(null);
  const [cnicBackPreview, setCnicBackPreview] = useState<string>('');
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [documentFileName, setDocumentFileName] = useState<string>('');

  const [proofImageFile, setProofImageFile] = useState<File | null>(null);
  const [proofImagePreview, setProofImagePreview] = useState<string>('');
  const [fileInputKey, setFileInputKey] = useState(0);

  const handleProofImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProofImageFile(file);
      setProofImagePreview(URL.createObjectURL(file));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, side: 'Front' | 'Back') => {
    const file = e.target.files?.[0];
    if (file) {
      if (side === 'Front') {
        setCnicFrontFile(file);
        setCnicFrontPreview(URL.createObjectURL(file));
      } else {
        setCnicBackFile(file);
        setCnicBackPreview(URL.createObjectURL(file));
      }
    }
  };

  const setF = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }));
  const navigate = useNavigate();
  const [apiRoomTypes, setApiRoomTypes] = useState<any[]>([]);
  const [apiFloors, setApiFloors] = useState<any[]>([]);
  const [availableRooms, setAvailableRooms] = useState<any[]>([]);
  const [apiAgents, setApiAgents] = useState<any[]>([]);
  const [apiBanks, setApiBanks] = useState<any[]>([]);
  const [refno, setRefno] = useState<string>('Generating...');

  // Derive startDate / endDate from datetime strings for room fetching & calcs
  const startDate = form.startDateTime ? form.startDateTime.split('T')[0] : '';
  const startTime = form.startDateTime ? form.startDateTime.split('T')[1] : '';
  const endDate = form.endDateTime ? form.endDateTime.split('T')[0] : '';
  const endTime = form.endDateTime ? form.endDateTime.split('T')[1] : '';



  // Auto status: today = checked_in, future = reserved
  const autoStatus = startDate === today ? 'checked_in' : 'reserved';
  const [reservationStatus, setReservationStatus] = useState<string>(autoStatus);
  const [isTaxFixed, setIsTaxFixed] = useState(false);
  const [defaultTaxAmount, setDefaultTaxAmount] = useState<string>("0");

  // Keep auto-status in sync whenever startDate changes
  useEffect(() => {
    setReservationStatus(startDate === today ? 'checked_in' : 'reserved');
  }, [startDate]);

  // Fetch auto-generated refno
  const fetchResnp = async () => {
    try {
      const { default: api } = await import('../../services/api');
      const location = localStorage.getItem("locationId");

      let prefix = "PW";
      if (location && location !== "undefined") {
        try {
          const locRes = await api.get(`/locations/${location}`);
          prefix = locRes.data?.prefix || "PW";
        } catch (e) {
          console.error(e);
        }
      }

      const res = await api.get('/reservation/newnumber/get');
      const reservations = res.data;

      const count = Number(reservations.nextNumber || 0);
      const formattedNumber = String(count).padStart(4, "0");
      const finalPrefix = `${prefix.toUpperCase()}${formattedNumber}`;

      setRefno(finalPrefix);
    } catch (error) {
      console.error(error);
      setRefno('REF-ERR');
    }
  };

  // Fetch auto-generated refno on mount
  useEffect(() => {
    fetchResnp();
  }, []);

  // Fetch banks and agents from API
  useEffect(() => {
    import('../../services/api').then(({ default: api }) => {
      api.get('/banks').then(res => setApiBanks(res.data || [])).catch(() => { });
      api.get('/agent').then(res => setApiAgents((res.data?.agents || res.data || []).map((a: any) => ({ label: a.fullName || a.name, value: a.id })))).catch(() => { });
    });
  }, []);

  useEffect(() => {
    const initData = async () => {
      try {
        const { roomTypeService } = await import('../../services/roomTypeService');
        const { floorService } = await import('../../services/floorService');
        const [rt, fl, settingsRes] = await Promise.all([
          roomTypeService.getAll(),
          floorService.getFloors(),
          import('../../services/api').then(({ default: api }) => api.get('/setting').catch(() => ({ data: { settings: {} } })))
        ]);
        setApiRoomTypes(rt.map((r: any) => ({ label: r.name, value: r.id })));
        setApiFloors(fl.map((f: any) => ({ label: f.name || f.floorName || `Floor ${f.id}`, value: f.id })));

        const settings = settingsRes?.data?.settings;
        if (settings?.tax_percentage_enabled) {
          setIsTaxFixed(true);
          const taxAmt = (settings.tax_percentage || 0).toString();
          setF('taxAmount', taxAmt);
          setDefaultTaxAmount(taxAmt);
        }
      } catch (err) {
        console.error(err);
      }
    };
    initData();
  }, []);

  useEffect(() => {
    const fetchRooms = async () => {
      if (!form.startDateTime || !form.endDateTime || !selectedRoomType) {
        setAvailableRooms([]);
        return;
      }
      try {
        const { assignedRoomService } = await import('../../services/assignedRoomService');
        let rooms = [];
        if (fetchMode === 'roomType') {
          rooms = await assignedRoomService.getAvailableRoomsByRoomType(Number(selectedRoomType), startDate, endDate);
        } else {
          rooms = await assignedRoomService.getAvailableRoomsByFloor(Number(selectedRoomType), startDate, endDate);
        }
        setAvailableRooms(rooms.map((r: any) => ({
          id: r.id,
          roomNo: r.roomNo,
          floor: r.Floor?.floorName || r.Floor?.name || `Floor ${r.floorId}`,
          beds: 1, // placeholder if not populated
          capacity: r.RoomType?.capacity || 2,
          roomTypeId: r.roomTypeId,
          roomTypeName: r.RoomType?.name || 'Unknown Type',
          rate: r.RoomType?.rooms?.[0]?.rate || 0,
          status: r.status
        })));
      } catch (err) {
        console.error(err);
        setAvailableRooms([]);
      }
    };
    fetchRooms();
  }, [fetchMode, selectedRoomType, startDate, endDate]);

  useEffect(() => {
    if (isCompanyReservation && companies.length === 0) {
      import('../../services/groupService').then(({ groupService }) => {
        groupService.getAll().then(res => setCompanies(res.groups || res));
      });
    }
  }, [isCompanyReservation]);

  useEffect(() => {
    if (selectedCompanyId) {
      import('../../services/groupService').then(({ groupService }) => {
        groupService.getById(selectedCompanyId).then(res => {
          const ratesObj: Record<number, number> = {};
          if (res.roomTypeRates && Array.isArray(res.roomTypeRates)) {
            res.roomTypeRates.forEach((rt: any) => {
              if (rt.rate) {
                ratesObj[rt.roomTypeId] = Number(rt.rate);
              }
            });
          }
          setCompanyRates(ratesObj);

          setRoomTypeRates(prev => {
            const next = { ...prev };
            Object.keys(next).forEach(typeIdStr => {
              const tid = Number(typeIdStr);
              if (ratesObj[tid] !== undefined) {
                next[tid] = ratesObj[tid];
              }
            });
            return next;
          });
        });
      });
    } else {
      setCompanyRates({});
    }
  }, [selectedCompanyId]);

  useEffect(() => {
    if (!isCompanyReservation) {
      setSelectedCompanyId("");
      setCompanyRates({});
      // Revert to default rates for currently selected rooms
      setRoomTypeRates(prev => {
        const next = { ...prev };
        selectedRooms.forEach(room => {
          next[room.roomTypeId] = room.rate;
        });
        return next;
      });
    }
  }, [isCompanyReservation, selectedRooms]);

  const toggleRoom = (room: any) => {
    setSelectedRooms(prev => {
      const exists = prev.some(r => r.id === room.id);
      const next = exists ? prev.filter(r => r.id !== room.id) : [...prev, room];
      if (!exists && roomTypeRates[room.roomTypeId] === undefined) {
        const initialRate = companyRates[room.roomTypeId] !== undefined ? companyRates[room.roomTypeId] : room.rate;
        setRoomTypeRates(rr => ({ ...rr, [room.roomTypeId]: initialRate }));
      }
      return next;
    });
  };

  const handleCNICChange = async (value: string) => {
    let cleanValue = value.replace(/\D/g, "").slice(0, 13);

    let formattedValue = cleanValue;

    if (cleanValue.length > 5) {
      formattedValue = cleanValue.slice(0, 5) + "-" + cleanValue.slice(5);
    }

    if (cleanValue.length > 12) {
      formattedValue =
        cleanValue.slice(0, 5) +
        "-" +
        cleanValue.slice(5, 12) +
        "-" +
        cleanValue.slice(12, 13);
    }

    setF("customerCNIC", formattedValue);

    // CNIC incomplete hai to lookup reset
    if (cleanValue.length !== 13) {
      setLastSearchedCNIC("");
      return;
    }

    // Isi CNIC par pehle lookup ho chuka hai
    if (lastSearchedCNIC === cleanValue) {
      return;
    }

    setLastSearchedCNIC(cleanValue);

    try {
      const { default: api } = await import("../../services/api");

      const res = await api.get(
        `/customer/by-cnic?cnic=${formattedValue}`
      );

      const data = res.data;

      if (data?.customer) {
        const c = data.customer;

        setForm(prev => ({
          ...prev,
          customerName: c.name || "",
          customerPhone: c.phone ? [c.phone] : [""],
          customerEmail: c.email || "",
          customerAddress: c.address || "",
        }));

        toast.success("Customer found");
      }
    } catch (error) {
      console.log("CNIC not found or fetch error");
    }
  };

  const days = calcDays(startDate, endDate);
  const roomTotal = selectedRooms.reduce((s, r) => s + (roomTypeRates[r.roomTypeId] ?? r.rate) * days, 0);
  const extrasTotal = selectedExtras.reduce((s, item) => s + (Number(item.total) || 0), 0);
  const taxVal = roomTotal * (parseFloat(form.taxAmount) / 100 || 0);
  const roomWithTax = form.isTaxInclusive ? roomTotal : roomTotal + taxVal;
  const amountWithTax = roomWithTax + extrasTotal;
  const discVal = form.discountType === "percentage"
    ? roomWithTax * (parseFloat(form.discount) / 100 || 0)
    : parseFloat(form.discount) || 0;
  const grandTotal = Math.max(0, amountWithTax - discVal);
  const balance = grandTotal - (parseFloat(form.advancePaid) || 0);
  const uniqueTypeIds = [...new Set(selectedRooms.map(r => r.roomTypeId))];

  const statusDot: Record<string, string> = { dirty: T.warning, maintenance: T.danger, available: T.success };

  const resetForm = () => {
    setForm({ ...defaultForm });
    setSelectedRooms([]);
    setSelectedExtras([]);
    setAvailableRooms([]);
    setSelectedRoomType("");
    setIsCompanyReservation(false);
    setSelectedCompanyId("");
    setCompanyRates({});
    setRoomTypeRates({});
    setLastSearchedCNIC("");
    // Clear image uploads
    setCnicFrontFile(null);
    setCnicFrontPreview('');
    setCnicBackFile(null);
    setCnicBackPreview('');
    setDocumentFile(null);
    setDocumentFileName('');
    setProofImageFile(null);
    setProofImagePreview('');
    setFileInputKey(k => k + 1); // force file inputs to remount and clear
    // Refresh refno for new reservation
    fetchResnp();
  };

  const isValidEmail = (email: string) => {
    if (!email) return true; // empty allowed. Use false if required.
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSave = async (overrideStatus?: string, afterSave?: 'back' | 'new') => {
    const finalStatus = overrideStatus || reservationStatus;
    const newErrors: Record<string, string> = {};


    if (finalStatus !== 'draft') {
      if (form.customerEmail && !isValidEmail(form.customerEmail)) {
        newErrors.customerEmail = "Please enter a valid email address";
      }

      if (!form.customerName.trim()) {
        newErrors.customerName = "Customer name is required";
      }

      if (!form.customerPhone[0]?.trim()) {
        newErrors.customerPhone = "Phone number is required";
      }

      if (!form.channel) {
        newErrors.channel = "Booking channel is required";
      } else if (form.channel === "agent" && !form.agent) {
        newErrors.agent = "Please select an agent";
      }

      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        toast.error("Please fill required fields ");
        return;
      }

      if (selectedRooms.length === 0) {
        toast.info("Please select at least one room.");
        return;
      }
    }

    setErrors({});

    setSubmitting(true);
    try {
      const { reservationService } = await import('../../services/reservationService');

      const assignedRoomIds = selectedRooms.map(r => ({
        id: r.id,
        startDate,
        endDate,
        pricePerDay: roomTypeRates[r.roomTypeId] ?? r.rate
      }));

      const formattedExtras = selectedExtras.map(item => ({
        id: item.extraId || item.id,
        extraId: item.extraId || item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        totalPrice: item.total
      }));

      const payload = {
        ...form,
        agentId: form.agent || undefined,
        startDate,
        startTime,
        endDate,
        endTime,
        groupId: isCompanyReservation && selectedCompanyId ? selectedCompanyId : undefined,
        refno: refno ? refno.toUpperCase() : refno,
        status: finalStatus,
        customerPhone: form.customerPhone.join(","),
        assignedRoomIds,
        extras: formattedExtras,
        guests: { male: Number(form.maleGuests || 0), female: Number(form.femaleGuests || 0), children: Number(form.childrenGuests || 0) },
        totalAmount: grandTotal,
        balanceAmount: balance,
        roomRent: roomTotal,
        isTaxInclusive: form.isTaxInclusive,
        payment: {
          method: form.method,
          bankId: form.bankId,
          transactionId: form.transactionId,
          note: form.note,
          amount: form.advancePaid || 0,
          date: form.paymentDate || today,
          status: "paid",
        },
      };

      const files: any = {};
      if (cnicFrontFile) files.cnicFront = cnicFrontFile;
      if (cnicBackFile) files.cnicBack = cnicBackFile;
      if (proofImageFile) files.proofImage = proofImageFile;
      if (documentFile) files.document = documentFile;

      await reservationService.create(payload, Object.keys(files).length > 0 ? files : undefined);
      if (finalStatus === 'draft') {
        toast.success("Draft saved successfully!");
        resetForm();
      } else {
        toast.success("Reservation created successfully!");
        if (afterSave === 'back') {
          navigate('/bookings');
        } else if (afterSave === 'new') {
          resetForm();
        }
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to create reservation.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ background: T.bgPage, minHeight: "100vh", fontFamily: "'Inter', system-ui, sans-serif", color: T.text }}>

      {/* ── Sticky Header ── */}
      <div style={{ background: T.bg, borderBottom: `1px solid ${T.border}`, padding: "14px 28px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 100, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              navigate("/bookings");
            }}
            style={{
              background: T.bgPage,
              border: `1px solid ${T.border}`,
              borderRadius: 8,
              color: T.textMuted,
              padding: "7px 14px",
              cursor: "pointer",
              fontSize: 13,
              fontWeight: 500,
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              position: "relative",
              zIndex: 101,
            }}
          >
            <ArrowLeft size={15} /> Back
          </button>          <div>
            <div style={{ fontWeight: 800, fontSize: 17, color: T.text }}>Add New Reservation</div>
            <div style={{ fontSize: 12, color: T.textMuted }}>Home / Reservations / New</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => handleSave('draft', 'new')} disabled={submitting} style={{ background: T.warningLight, border: `1px solid #FCD34D`, borderRadius: 8, color: T.warning, padding: "8px 18px", cursor: submitting ? "not-allowed" : "pointer", fontWeight: 600, fontSize: 13, display: "inline-flex", alignItems: "center", gap: 7, opacity: submitting ? 0.6 : 1 }}><Save size={15} /> Save as Draft</button>
          <button onClick={() => handleSave(reservationStatus, 'back')} disabled={submitting} style={{ background: T.primary, border: "none", borderRadius: 8, color: "#fff", padding: "8px 20px", cursor: submitting ? "not-allowed" : "pointer", fontWeight: 700, fontSize: 13, boxShadow: "0 2px 8px #1D4ED840", opacity: submitting ? 0.6 : 1 }}>{submitting ? "Saving..." : "Save Reservation"}</button>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "flex-start" }}>

        {/* ── Main Form ── */}
        <div style={{ flex: 1, padding: "20px 24px 80px 28px", minWidth: 0 }}>

          {/* Company Reservation Toggle */}
          <div style={{ background: T.bgCard, borderRadius: 12, border: `1px solid ${T.border}`, padding: "16px 20px", marginBottom: 20, display: "flex", alignItems: "center", gap: 20 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", userSelect: "none" }}>
              <div style={{ position: "relative" }}>
                <input type="checkbox" checked={isCompanyReservation} onChange={e => setIsCompanyReservation(e.target.checked)} style={{ position: "absolute", opacity: 0 }} />
                <div style={{ width: 44, height: 24, background: isCompanyReservation ? T.primary : T.border, borderRadius: 12, transition: "0.2s", position: "relative" }}>
                  <div style={{ width: 20, height: 20, background: "#fff", borderRadius: 10, position: "absolute", top: 2, left: isCompanyReservation ? 22 : 2, transition: "0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }} />
                </div>
              </div>
              <span style={{ fontWeight: 600, fontSize: 14, color: T.text }}>Company / Group Reservation</span>
            </label>

            {isCompanyReservation && (
              <div style={{ flex: 1, borderLeft: `1px solid ${T.border}`, paddingLeft: 20 }}>
                <Select2
                  label="Select Company"
                  value={selectedCompanyId}
                  onChange={setSelectedCompanyId}
                  options={companies.map(c => ({ label: c.name, value: String(c.id) }))}
                  placeholder="Choose a company..."
                />
              </div>
            )}
          </div>

          {/* 1. Customer Info */}
          <SectionHeader step="1" title="Customer Information" subtitle="Primary guest details & identification" color="#1D4ED8" />
          <Card>
            <Grid cols={3}>
              <Input
                label="CNIC / Passport"

                value={form.customerCNIC}
                onChange={(e: any) => handleCNICChange(e.target.value)}
                placeholder="35202-1234567-1"
                error={errors.customerCNIC}
                maxLength={15} // 13 digits + 2 dashes
              />
              <Input label="Full Name" required value={form.customerName} onChange={(e: any) => setF("customerName", e.target.value)} placeholder="Ahmad Raza" error={errors.customerName} />
              <Input
                label="Email Address"
                type="email"
                value={form.customerEmail}
                onChange={(e: any) => {
                  setF("customerEmail", e.target.value);
                  if (errors.customerEmail) {
                    setErrors(prev => ({ ...prev, customerEmail: "" }));
                  }
                }}
                placeholder="ahmad@email.com"
                error={errors.customerEmail}
              />
            </Grid>
            <div style={{ height: 14 }} />
            <Grid cols={3}>
              <div>
                <Label required>Phone Number(s)</Label>
                {form.customerPhone.map((ph, i) => (
                  <div key={i} style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                    <input type="text" value={ph}
                      onChange={e => {
                        const val = e.target.value.replace(/[^0-9+ -]/g, '').slice(0, 16);
                        const a = [...form.customerPhone];
                        a[i] = val;
                        setF("customerPhone", a);
                      }}
                      maxLength={16}
                      placeholder={`Phone ${i + 1}`} style={{
                        ...inputBase,
                        flex: 1,
                        border: `1px solid ${i === 0 && errors.customerPhone ? T.danger : T.border}`,
                        background: i === 0 && errors.customerPhone ? T.dangerLight : T.bgInput,
                        boxShadow: i === 0 && errors.customerPhone ? `0 0 0 2px ${T.danger}40` : 'none',
                        transition: 'all 0.2s'
                      }} />
                    {form.customerPhone.length > 1 && (
                      <button onClick={() => setF("customerPhone", form.customerPhone.filter((_, j) => j !== i))}
                        style={{ background: T.dangerLight, border: `1px solid #FECACA`, borderRadius: 8, color: T.danger, padding: "0 10px", cursor: "pointer", fontSize: 13, display: "inline-flex", alignItems: "center", justifyContent: "center" }}><X size={14} /></button>
                    )}
                  </div>
                ))}
                {errors.customerPhone && <div style={{ color: T.danger, fontSize: 11, marginTop: -4, marginBottom: 8 }}>{errors.customerPhone}</div>}
                <button onClick={() => setF("customerPhone", [...form.customerPhone, ""])}
                  style={{ background: "transparent", border: `1px dashed ${T.border}`, borderRadius: 8, color: T.textMuted, padding: "7px 14px", cursor: "pointer", fontSize: 12, width: "100%" }}>
                  + Add Phone
                </button>
              </div>
              <div style={{ gridColumn: "span 2" }}>
                <Input label="Address" value={form.customerAddress} onChange={(e: any) => setF("customerAddress", e.target.value)} placeholder="House 14, Block C, Gulberg III, Lahore" error={errors.customerAddress} />
              </div>
            </Grid>
            <div style={{ height: 14 }} />
            <Grid cols={2}>
              {[["CNIC Front Image", "Front", cnicFrontPreview, () => { setCnicFrontFile(null); setCnicFrontPreview(''); }], ["CNIC Back Image", "Back", cnicBackPreview, () => { setCnicBackFile(null); setCnicBackPreview(''); }]].map(([lbl, side, preview, clearPreview]) => (
                <div key={side as string}>
                  <Label>{lbl}</Label>
                  {preview ? (
                    <div style={{ position: 'relative', width: '100%', height: 120, border: `1px solid ${T.border}`, borderRadius: 8, overflow: 'hidden' }}>
                      <img src={preview as string} alt={`${side} preview`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <button onClick={clearPreview as any} style={{ position: 'absolute', top: 6, right: 6, background: 'rgba(255,255,255,0.9)', border: 'none', borderRadius: '50%', padding: 4, cursor: 'pointer', color: T.danger }}>
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <label key={fileInputKey} style={{ display: "flex", alignItems: "center", gap: 12, background: T.bgPage, border: `1px dashed ${T.border}`, borderRadius: 8, padding: "13px 16px", cursor: "pointer" }}>
                      <div style={{ width: 36, height: 36, borderRadius: 8, background: T.primaryLight, color: T.primary, display: "flex", alignItems: "center", justifyContent: "center" }}><Paperclip size={18} /></div>
                      <div>
                        <div style={{ color: T.text, fontSize: 13, fontWeight: 500 }}>Upload {side} Side</div>
                        <div style={{ color: T.textLight, fontSize: 11 }}>JPG, PNG · max 5MB</div>
                      </div>
                      <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, side as 'Front' | 'Back')} style={{ display: "none" }} />
                    </label>
                  )}
                </div>
              ))}
            </Grid>
            <div style={{ height: 14 }} />
            {/* Document Upload */}
            <div>
              <Label>Reservation Document (PDF / Image)</Label>
              {documentFile ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: T.bgPage, border: `1px solid ${T.border}`, borderRadius: 8, padding: '12px 16px' }}>
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: '#EFF6FF', color: '#1D4ED8', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Paperclip size={18} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: T.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{documentFileName}</div>
                    <div style={{ fontSize: 11, color: T.textLight }}>Ready to upload</div>
                  </div>
                  <button onClick={() => { setDocumentFile(null); setDocumentFileName(''); }} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: T.danger, padding: 4 }}>
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <label key={fileInputKey} style={{ display: 'flex', alignItems: 'center', gap: 12, background: T.bgPage, border: `1px dashed ${T.border}`, borderRadius: 8, padding: '13px 16px', cursor: 'pointer' }}>
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: '#F0FDF4', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Paperclip size={18} />
                  </div>
                  <div>
                    <div style={{ color: T.text, fontSize: 13, fontWeight: 500 }}>Upload Document</div>
                    <div style={{ color: T.textLight, fontSize: 11 }}>PDF, JPG, PNG, DOCX · max 10MB</div>
                  </div>
                  <input type="file" accept=".pdf,.doc,.docx,image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) { setDocumentFile(f); setDocumentFileName(f.name); } }} style={{ display: 'none' }} />
                </label>
              )}
            </div>
          </Card>

          {/* 2. Guest Composition */}
          <SectionHeader step="2" title="Guest Composition" subtitle="Number of guests by category" color="#7C3AED" />
          <Card>
            <Grid cols={3}>
              {([["maleGuests", " Male Guests"], ["femaleGuests", " Female Guests"], ["childrenGuests", " Children"]] as [string, string][]).map(([k, l]) => (
                <div key={k}>
                  <Label>{l}</Label>
                  <input type="number" min="0" value={(form as any)[k]} onChange={e => setF(k, e.target.value)} style={{ ...inputBase }} />
                </div>
              ))}
            </Grid>
          </Card>

          {/* 3. Stay Details */}
          <SectionHeader step="3" title="Stay & Booking Details" subtitle="Dates, channel, status and purpose of visit" color="#059669" />
          <Card>
            {/* <Grid cols={2}> */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr auto 1fr",
                gap: 12,
                alignItems: "end",
              }}
            >
              {/* Check In */}
              <div>
                <Label required>Check-in Date & Time</Label>
                <DatePicker
                  selected={fromLocalDateTimeString(form.startDateTime)}
                  onChange={(date) => {
                    const startValue = toLocalDateTimeString(date);
                    setF("startDateTime", startValue);

                    if (date) {
                      const nextDay = new Date(date);
                      nextDay.setDate(nextDay.getDate() + 1);

                      setF("endDateTime", toLocalDateTimeString(nextDay));
                    }

                    setSelectedRooms([]);
                    setAvailableRooms([]);
                  }}
                  showTimeSelect
                  timeIntervals={15}
                  dateFormat="yyyy-MM-dd h:mm aa"
                  customInput={<DatePickerInput />}
                />
              </div>

              {/* Nights Badge */}
              <div
                style={{
                  marginBottom: 8,
                  padding: "10px 18px",
                  borderRadius: 12,
                  background: T.primaryLight,
                  border: `1px solid ${T.primaryMid}`,
                  textAlign: "center",
                  minWidth: 90,
                }}
              >
                <div
                  style={{
                    fontSize: 10,
                    color: T.textMuted,
                    textTransform: "uppercase",
                    fontWeight: 700,
                  }}
                >
                  Duration
                </div>

                <div
                  style={{
                    fontSize: 18,
                    fontWeight: 800,
                    color: T.primary,
                  }}
                >
                  {days || 0}
                </div>

                <div
                  style={{
                    fontSize: 11,
                    color: T.textMuted,
                  }}
                >
                  Night{days !== 1 ? "s" : ""}
                </div>
              </div>

              {/* Check Out */}
              <div style={{ display: 'flex', justifyContent: 'end' }}>
                <div>
                  <Label required>Check-out Date & Time</Label>
                  <DatePicker
                    selected={fromLocalDateTimeString(form.endDateTime)}
                    onChange={(date) => {
                      setF("endDateTime", toLocalDateTimeString(date));
                      setSelectedRooms([]);
                      setAvailableRooms([]);
                    }}
                    showTimeSelect
                    timeIntervals={15}
                    dateFormat="yyyy-MM-dd h:mm aa"
                    minDate={fromLocalDateTimeString(form.startDateTime) || undefined}
                    customInput={<DatePickerInput />}
                  />

                  {errors.endDate && (
                    <div
                      style={{
                        color: T.danger,
                        fontSize: 11,
                        marginTop: 4,
                      }}
                    >
                      {errors.endDate}
                    </div>
                  )}
                </div>
              </div>
            </div>
            {/* </Grid> */}
            <div style={{ height: 14 }} />
            <Grid cols={3}>
              <div>
                <Label>Reservation Status</Label>
                <select
                  value={reservationStatus}
                  onChange={e => setReservationStatus(e.target.value)}
                  style={{
                    ...inputBase, appearance: "none" as any, cursor: "pointer",
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%2364748B' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`,
                    backgroundRepeat: "no-repeat", backgroundPosition: "right 12px center", paddingRight: 32,
                    color: reservationStatus === 'checked_in' ? T.success : reservationStatus === 'reserved' ? T.primary : reservationStatus === 'cancelled' ? T.danger : T.warning,
                    fontWeight: 600,
                  }}
                >
                  <option value="reserved">Reserved</option>
                  <option value="checked_in">Checked In</option>
                  <option value="checked_out">Checked Out</option>
                  {/* <option value="draft">Draft</option> */}
                  {/* <option value="cancelled">Cancelled</option> */}
                </select>
                <div style={{ fontSize: 11, color: T.textMuted, marginTop: 4 }}>
                  {startDate === today ? 'Auto-set: Check-in is today' : startDate ? 'Auto-set: Future date → Reserved' : ''}
                </div>
              </div>
              <Select2 label="Booking Channel" required={true} value={form.channel} onChange={(v: string) => setF("channel", v)} options={channelOptions} placeholder="Select channel..." error={errors.channel} />
              <Input label="Purpose of Stay" value={form.purposeOfStay} onChange={(e: any) => setF("purposeOfStay", e.target.value)} placeholder="Business / Leisure" />
            </Grid>
            {(form.channel === "agent" || form.channel === "refernce") && (
              <>
                <div style={{ height: 14 }} />
                <Grid cols={3}>
                  {form.channel === "agent" && <Select2 label="Select Agent" required={true} value={form.agent} onChange={(v: string) => setF("agent", v)} options={apiAgents} placeholder="Choose agent..." error={errors.agent} />}
                  {form.channel === "refernce" && <Input label="Reference Name" value={form.referal} onChange={(e: any) => setF("referal", e.target.value)} placeholder="Referred by..." />}
                </Grid>
              </>
            )}
          </Card>

          {/* 4. Room Selection */}
          <SectionHeader step="4" title="Room Selection" subtitle="Choose room type and assign rooms" color="#B45309" />
          <Card>
            {/* Mode toggle */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 18 }}>
              <span style={{ color: T.textMuted, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>Filter by:</span>
              {(["roomType", "floor"] as const).map(m => (
                <button key={m} onClick={() => { setFetchMode(m); setSelectedRoomType(""); }}
                  style={{
                    background: fetchMode === m ? T.primary : T.bgPage, border: `1px solid ${fetchMode === m ? T.primary : T.border}`,
                    borderRadius: 20, color: fetchMode === m ? "#fff" : T.textMuted,
                    padding: "5px 14px", cursor: "pointer", fontWeight: 600, fontSize: 12, transition: "all 0.15s", display: "inline-flex", alignItems: "center", gap: 6
                  }}>
                  {m === "roomType" ? <><Tag size={13} /> Room Type</> : <><Building2 size={13} /> Floor</>}
                </button>
              ))}
            </div>

            <Grid cols={3}>
              <div style={{ gridColumn: "span 2" }}>
                <Select2
                  label={fetchMode === "roomType" ? "Select Room Type" : "Select Floor"}
                  value={selectedRoomType} onChange={(v: string) => { setSelectedRoomType(v); }}
                  options={fetchMode === "roomType" ? apiRoomTypes : apiFloors}
                  placeholder={fetchMode === "roomType" ? "Choose room type..." : "Choose floor..."}
                  error={errors.roomType}
                />
              </div>
              <Input label="Search by Room No." placeholder="e.g. 301" onChange={() => { }} />
            </Grid>

            {/* Available rooms grid */}
            {selectedRoomType && (
              <div style={{ marginTop: 20 }}>
                <div style={{ fontSize: 12, color: T.textMuted, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 12 }}>
                  Available Rooms ({availableRooms.length})
                </div>
                {errors.room && <div style={{ color: T.danger, fontSize: 12, marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}><AlertTriangle size={14} /> {errors.room}</div>}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))", gap: 10 }}>
                  {[...selectedRooms, ...availableRooms.filter(ar => !selectedRooms.some(sr => sr.id === ar.id))].map(room => {
                    const isSelected = selectedRooms.some(r => r.id === room.id);
                    const sc = statusDot[room.status] || T.success;
                    return (
                      <div key={room.id} onClick={() => toggleRoom(room)} style={{
                        background: isSelected ? T.primary : T.bgPage,
                        border: `2px solid ${isSelected ? T.primary : T.border}`,
                        borderRadius: 10, padding: 12, cursor: "pointer", textAlign: "center",
                        position: "relative", transition: "all 0.15s",
                        boxShadow: isSelected ? "0 2px 8px #1D4ED830" : "none",
                      }}>
                        {room.status !== "available" && (
                          <div style={{ position: "absolute", top: 6, right: 6, width: 7, height: 7, borderRadius: "50%", background: sc }} />
                        )}
                        <div style={{ fontWeight: 800, fontSize: 15, color: isSelected ? "#fff" : T.text }}>{room.roomNo}</div>
                        <div style={{ fontSize: 11, color: isSelected ? "#BFDBFE" : T.textMuted, marginTop: 3 }}>{room.floor}</div>
                        <div style={{ fontSize: 11, color: isSelected ? "#BFDBFE" : T.textMuted, display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}><BedDouble size={12} /> {room.beds} <span>·</span> <User size={12} /> {room.capacity}</div>
                        {isSelected && <div style={{ marginTop: 6, background: "#ffffff33", borderRadius: 4, fontSize: 11, fontWeight: 700, color: "#fff", padding: "2px 6px", display: "inline-flex", alignItems: "center", gap: 4 }}><Check size={12} /> Selected</div>}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Selected rooms table */}
            {selectedRooms.length > 0 && (
              <div style={{ marginTop: 24 }}>
                <div style={{ fontSize: 12, color: T.textMuted, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 12 }}>
                  Selected Rooms · {days} Night{days !== 1 ? "s" : ""}
                </div>
                <div style={{ border: `1px solid ${T.border}`, borderRadius: 10, overflow: "hidden" }}>
                  {selectedRooms.map((room, i) => {
                    const rate = roomTypeRates[room.roomTypeId] ?? room.rate;
                    return (
                      <div key={room.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "11px 16px", borderBottom: i < selectedRooms.length - 1 ? `1px solid ${T.border}` : "none", background: i % 2 === 0 ? T.bg : T.bgPage }}>
                        <div>
                          <span style={{ fontWeight: 700, color: T.text, fontSize: 13 }}>Room {room.roomNo}</span>
                          <span style={{ color: T.textMuted, fontSize: 12, marginLeft: 8 }}>{room.roomTypeName}</span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                          <span style={{ color: "#B45309", fontWeight: 700, fontSize: 13 }}>{fmt(rate * days)}</span>
                          <span style={{ color: T.textLight, fontSize: 11 }}>{days}n × {fmt(rate)}</span>
                          <button onClick={() => toggleRoom(room)} style={{ background: T.dangerLight, border: `1px solid #FECACA`, borderRadius: 6, color: T.danger, padding: "4px 10px", cursor: "pointer", fontSize: 12 }}>Remove</button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Per-type rate edit */}
                <div style={{ marginTop: 16 }}>
                  <div style={{ fontSize: 12, color: T.textMuted, fontWeight: 700, marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.05em" }}>Edit Nightly Rate (Per Type)</div>
                  <Grid cols={3}>
                    {uniqueTypeIds.map(typeId => {
                      const room = selectedRooms.find(r => r.roomTypeId === typeId);
                      return (
                        <div key={typeId}>
                          <Label>Rate · {room?.roomTypeName}</Label>
                          <div style={{ display: "flex", alignItems: "center", border: `1px solid ${T.border}`, borderRadius: 8, overflow: "hidden" }}>
                            <span style={{ padding: "10px 10px", color: T.textMuted, fontSize: 12, borderRight: `1px solid ${T.border}`, background: T.bgPage }}>PKR</span>
                            <input type="number" value={roomTypeRates[typeId] ?? ""}
                              onChange={e => setRoomTypeRates(r => ({ ...r, [typeId]: Number(e.target.value) }))}
                              style={{ flex: 1, border: "none", padding: "10px 12px", color: T.text, fontSize: 13, outline: "none", background: T.bgInput }} />
                          </div>
                        </div>
                      );
                    })}
                  </Grid>
                </div>
              </div>
            )}
          </Card>

          {/* 5. Complimentary Services */}
          <SectionHeader step="5" title="Complimentary Services" subtitle="Optional complimentary amenities included with this stay (shown on Reg Card & Reg Form)" color="#059669" />
          <Card>
            <Input
              label="Complimentary Services / Amenities"
              placeholder="e.g. Breakfast, Mineral Water, Hi-Tea, Airport Shuttle..."
              value={form.complimentary || ""}
              onChange={(e: any) => setF("complimentary", e.target.value)}
            />
          </Card>

          {/* 6. Notes */}
          <SectionHeader step="6" title="Additional Notes" subtitle="Internal office record only" color="#475569" />
          <Card>
            <Textarea2 label="Special Notes / Instructions" value={form.resNotes} onChange={(e: any) => setF("resNotes", e.target.value)} placeholder="VIP guest, preferred floor 3, extra towels..." rows={3} />
          </Card>

          {/* 7. Billing */}
          <SectionHeader
            step="7"
            title="Billing Summary"
            subtitle="Taxes, discounts and advance payment"
            color="#DB2777"
          />

          <Card>
            {/* Readonly totals */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                gap: 12,
                marginBottom: 20,
              }}
            >
              {[
                ["Room Total", fmt(roomTotal), T.text],
                ["Grand Total", fmt(grandTotal), T.primary],
                ["Balance Due", fmt(Math.max(0, balance)), balance > 0 ? T.danger : T.success],
              ].map(([l, v, c]) => (
                <div
                  key={l as string}
                  style={{
                    background: T.bgPage,
                    borderRadius: 10,
                    padding: "14px 16px",
                    border: `1px solid ${T.border}`,
                    minWidth: 0,
                  }}
                >
                  <div
                    style={{
                      fontSize: 11,
                      color: T.textMuted,
                      fontWeight: 800,
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                      marginBottom: 6,
                    }}
                  >
                    {l as string}
                  </div>
                  <div
                    style={{
                      fontSize: 18,
                      fontWeight: 900,
                      color: c as string,
                      wordBreak: "break-word",
                    }}
                  >
                    {v as string}
                  </div>
                </div>
              ))}
            </div>

            {/* Discount + Tax */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                gap: 16,
                marginBottom: 18,
              }}
            >
              {/* Discount Block */}
              <div
                style={{
                  background: "#fff",
                  border: `1px solid ${T.border}`,
                  borderRadius: 12,
                  padding: 14,
                }}
              >
                <Label>Discount</Label>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 120px",
                    gap: 10,
                    alignItems: "center",
                  }}
                >
                  <input
                    type="number"
                    value={form.discount}
                    onChange={(e) => setF("discount", e.target.value)}
                    min="0"
                    max="100"
                    placeholder="0"
                    style={{ ...inputBase, width: "100%" }}
                  />

                  <select
                    value={form.discountType}
                    onChange={(e) => setF("discountType", e.target.value)}
                    style={{ ...inputBase, width: "100%" }}
                  >
                    <option value="percentage">%</option>
                    <option value="fixed">Fixed</option>
                  </select>
                </div>
              </div>

              {/* Tax Block */}
              <div
                style={{
                  background: "#fff",
                  border: `1px solid ${T.border}`,
                  borderRadius: 12,
                  padding: 14,
                }}
              >
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 120px 105px",
                    gap: 10,
                    alignItems: "end",
                  }}
                >
                  <Input
                    label="Tax Name"
                    value={form.taxName}
                    onChange={(e: any) => setF("taxName", e.target.value)}
                    placeholder="GST"
                  />

                  <Input
                    label={`Tax (%)`}
                    value={form.taxAmount}
                    onChange={(e: any) => setF("taxAmount", e.target.value)}
                    placeholder="0"
                    readOnly={form.isTaxInclusive}
                  />

                  <div>
                    <Label>Tax Type</Label>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 10 }}>
                      <span style={{ fontSize: 13, color: form.isTaxInclusive ? T.primary : T.textLight, fontWeight: form.isTaxInclusive ? 600 : 400 }}>Inc</span>
                      <button
                        type="button"
                        onClick={() => {
                          const newIsInc = !form.isTaxInclusive;
                          if (newIsInc) {
                            setF("isTaxInclusive", true);
                            setF("taxAmount", defaultTaxAmount);
                          } else {
                            setF("isTaxInclusive", false);
                          }
                        }}
                        style={{
                          width: 44,
                          height: 24,
                          borderRadius: 12,
                          background: form.isTaxInclusive ? "#E5E7EB" : T.primary,
                          position: "relative",
                          cursor: "pointer",
                          border: "none",
                          transition: "all 0.2s"
                        }}
                      >
                        <div style={{
                          width: 20,
                          height: 20,
                          borderRadius: "50%",
                          background: "#fff",
                          position: "absolute",
                          top: 2,
                          left: form.isTaxInclusive ? 2 : 22,
                          transition: "all 0.2s",
                          boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
                        }} />
                      </button>
                      <span style={{ fontSize: 13, color: !form.isTaxInclusive ? T.primary : T.textLight, fontWeight: !form.isTaxInclusive ? 600 : 400 }}>Exc</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* POS Extras Button & List */}
              <div style={{ marginTop: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <Label>Reservation Extras (POS Items)</Label>
                </div>

                {selectedExtras.length > 0 ? (
                  <div style={{ background: T.bgPage, border: `1px solid ${T.border}`, borderRadius: 10, overflow: "hidden" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                      <thead>
                        <tr style={{ borderBottom: `1px solid ${T.border}`, background: "#F1F5F9", textAlign: "left" }}>
                          <th style={{ padding: "8px 12px", color: T.textMuted }}>Item</th>
                          <th style={{ padding: "8px 12px", color: T.textMuted, textAlign: "center" }}>Price</th>
                          <th style={{ padding: "8px 12px", color: T.textMuted, textAlign: "center" }}>Qty</th>
                          <th style={{ padding: "8px 12px", color: T.textMuted, textAlign: "right" }}>Total</th>
                          <th style={{ padding: "8px 12px", width: 40 }}></th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedExtras.map((item, idx) => (
                          <tr key={idx} style={{ borderBottom: idx < selectedExtras.length - 1 ? `1px solid ${T.border}` : "none" }}>
                            <td style={{ padding: "8px 12px", fontWeight: 600, color: T.text }}>{item.name}</td>
                            <td style={{ padding: "8px 12px", textAlign: "center", color: T.textMuted }}>{fmt(item.price)}</td>
                            <td style={{ padding: "8px 12px", textAlign: "center", color: T.text }}>{item.quantity}</td>
                            <td style={{ padding: "8px 12px", textAlign: "right", fontWeight: 600, color: T.primary }}>{fmt(item.total)}</td>
                            <td style={{ padding: "8px 12px", textAlign: "center" }}>
                              <button
                                type="button"
                                onClick={() => setSelectedExtras(prev => prev.filter((_, i) => i !== idx))}
                                style={{ background: "transparent", border: "none", color: T.danger, cursor: "pointer", padding: 4 }}
                              >
                                <Trash2 size={15} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div style={{ background: T.bgPage, border: `1px dashed ${T.border}`, borderRadius: 10, padding: 14, textAlign: "center", color: T.textMuted, fontSize: 12 }}>
                    No extras added yet. Click "Add Extras / POS Items" button to select items.
                  </div>
                )}
              </div>
            </div>

            {/* Payment / Advance */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: 16,
                marginTop: 16
              }}
            >
              <Input
                label="Advance Paid"
                type="number"
                value={form.advancePaid}
                onChange={(e: any) => setF("advancePaid", e.target.value)}
                placeholder="0.00"
              />

              <Input
                label="Advance Payment Date"
                type="date"
                value={form.paymentDate}
                onChange={(e: any) => setF("paymentDate", e.target.value)}
              />

              <Input
                label="Remaining Balance"
                value={`${Math.max(0, balance).toFixed(0)}`}
                readOnly
              />
            </div>
          </Card>

          {/* 7. Payment */}
          <SectionHeader step="7" title="Payment Information" subtitle="Method, bank details and proof" color="#0891B2" />
          <Card>
            <Grid cols={3}>
              <Select2 label="Payment Method" value={form.method} onChange={(v: string) => setF("method", v)} options={[
                { label: "Cash", value: "cash" },
                { label: "Card", value: "card" },
                { label: "Bank Transfer", value: "bank" },
                { label: "Other", value: "other" },
              ]} />
              {(form.method === "bank" || form.method === "card") && (
                <Select2 label="Select Bank" value={form.bankId} onChange={(v: string) => setF("bankId", v)}
                  options={apiBanks.map((b: any) => ({ label: `${b.bankName} — ${b.accountTitle}`, value: String(b.id) }))} placeholder="Choose bank..." />
              )}
              {(form.method === "bank" || form.method === "card") && (
                <Input label="Transaction ID" value={form.transactionId} onChange={(e: any) => setF("transactionId", e.target.value)} placeholder="TXN123456" />
              )}
            </Grid>
            <div style={{ height: 14 }} />
            <Grid cols={2}>
              <Textarea2 label="Payment Note" value={form.note} onChange={(e: any) => setF("note", e.target.value)} placeholder="e.g. Cash received at reception" rows={2} />
              <div>
                <Label>Payment Proof / Screenshot</Label>
                {proofImagePreview ? (
                  <div style={{ position: 'relative', width: '100%', height: 120, border: `1px solid ${T.border}`, borderRadius: 8, overflow: 'hidden' }}>
                    <img src={proofImagePreview} alt="Proof preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <button onClick={() => { setProofImageFile(null); setProofImagePreview(''); }} style={{ position: 'absolute', top: 6, right: 6, background: 'rgba(255,255,255,0.9)', border: 'none', borderRadius: '50%', padding: 4, cursor: 'pointer', color: T.danger }}>
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <label key={fileInputKey} style={{ display: "flex", alignItems: "center", gap: 12, background: T.bgPage, border: `1px dashed ${T.border}`, borderRadius: 8, padding: "16px", cursor: "pointer" }}>
                    <div style={{ width: 40, height: 40, borderRadius: 8, background: T.primaryLight, color: T.primary, display: "flex", alignItems: "center", justifyContent: "center" }}><Camera size={20} /></div>
                    <div>
                      <div style={{ color: T.text, fontSize: 13, fontWeight: 500 }}>Upload Screenshot</div>
                      <div style={{ color: T.textLight, fontSize: 11 }}>JPG, PNG — proof of payment</div>
                    </div>
                    <input type="file" accept="image/*" onChange={handleProofImageChange} style={{ display: "none" }} />
                  </label>
                )}
              </div>
            </Grid>
          </Card>

          {/* Bottom actions */}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 28 }}>
            <button onClick={() => navigate('/bookings')} disabled={submitting} style={{ background: T.dangerLight, border: `1px solid #FECACA`, borderRadius: 8, color: T.danger, padding: "10px 20px", cursor: submitting ? "not-allowed" : "pointer", fontWeight: 600, fontSize: 13, display: "inline-flex", alignItems: "center", gap: 7, opacity: submitting ? 0.6 : 1 }}><X size={15} /> Discard</button>
            <button onClick={() => handleSave('draft')} disabled={submitting} style={{ background: T.warningLight, border: `1px solid #FCD34D`, borderRadius: 8, color: T.warning, padding: "10px 20px", cursor: submitting ? "not-allowed" : "pointer", fontWeight: 600, fontSize: 13, display: "inline-flex", alignItems: "center", gap: 7, opacity: submitting ? 0.6 : 1 }}><Save size={15} /> Draft</button>
            <button onClick={() => handleSave(reservationStatus, 'back')} disabled={submitting} style={{ background: T.primaryLight, border: `1px solid ${T.primaryMid}`, borderRadius: 8, color: T.primary, padding: "10px 20px", cursor: submitting ? "not-allowed" : "pointer", fontWeight: 600, fontSize: 13, display: "inline-flex", alignItems: "center", gap: 7, opacity: submitting ? 0.6 : 1 }}><ArrowLeft size={15} /> {submitting ? "Saving..." : "Save & Back"}</button>
            <button onClick={() => handleSave(reservationStatus, 'new')} disabled={submitting} style={{ background: T.primary, border: "none", borderRadius: 8, color: "#fff", padding: "10px 24px", cursor: submitting ? "not-allowed" : "pointer", fontWeight: 700, fontSize: 13, boxShadow: "0 2px 8px #1D4ED830", display: "inline-flex", alignItems: "center", gap: 7, opacity: submitting ? 0.6 : 1 }}>{submitting ? "Saving..." : <><Plus size={15} /> Save & Add New</>}</button>
          </div>
        </div>

        {/* ── Right Sidebar (dark) ── */}
        <div style={{ width: 292, flexShrink: 0, padding: "20px 24px 20px 0", position: "sticky", top: 57, maxHeight: "calc(100vh - 57px)", overflowY: "auto" }}>

          {/* Live summary */}
          <div style={{ background: T.sidebarBg, borderRadius: 14, overflow: "hidden", marginBottom: 14 }}>
            <div style={{ background: "linear-gradient(135deg, #1D4ED8, #1E40AF)", padding: "18px 18px 14px" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#93C5FD", textTransform: "uppercase", letterSpacing: "0.07em" }}>Booking Summary</div>
              <div style={{ fontSize: 26, fontWeight: 800, color: "#fff", marginTop: 6, lineHeight: 1 }}>{fmt(grandTotal)}</div>
              <div style={{ fontSize: 11, color: "#BFDBFE", marginTop: 4 }}>Grand Total (incl. tax & discount)</div>
            </div>
            <div style={{ padding: "14px 18px" }}>
              {([
                ["Room Total", fmt(roomTotal), T.sidebarText],
                ["Extras Total", fmt(extrasTotal), "#A7F3D0"],
                [`Tax (${form.taxAmount || 0}%)`, fmt(taxVal), "#38BDF8"],
                ["Discount", `−${fmt(discVal)}`, "#FCD34D"],
                ["Grand Total", fmt(grandTotal), "#D4A017"],
                ["Advance Paid", fmt(parseFloat(form.advancePaid) || 0), "#4ADE80"],
                ["Balance Due", fmt(Math.max(0, balance)), balance > 0 ? "#F87171" : "#4ADE80"],
              ] as [string, string, string][]).map(([l, v, c]) => (
                <div key={l} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 0", borderBottom: `1px solid ${T.sidebarBorder}` }}>
                  <span style={{ color: T.sidebarMuted, fontSize: 12 }}>{l}</span>
                  <span style={{ color: c, fontWeight: 600, fontSize: 12 }}>{v}</span>
                </div>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsExtrasModalOpen(true)}
            style={{
              width: "100%",
              background: T.primaryLight,
              border: `1px solid ${T.primaryMid}`,
              color: T.primary,
              borderRadius: 8,
              padding: "10px",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: 8,
              marginBottom: 14
            }}
          >
            <ShoppingCart size={16} /> Add Extras / POS Items
          </button>

          {/* Stay duration */}
          {form.startDate && form.endDate && (
            <div style={{ background: T.sidebarBg, borderRadius: 12, padding: 16, marginBottom: 14 }}>
              <div style={{ fontSize: 11, color: T.sidebarMuted, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 12 }}>Stay Duration</div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ textAlign: "center" }}>
                  <div style={{ color: T.sidebarMuted, fontSize: 10 }}>Check-in</div>
                  <div style={{ color: T.sidebarText, fontWeight: 600, fontSize: 12, marginTop: 2 }}>{form.startDate}</div>
                </div>
                <div style={{ background: T.primary, borderRadius: 20, padding: "4px 12px", color: "#fff", fontWeight: 800, fontSize: 13 }}>{days}N</div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ color: T.sidebarMuted, fontSize: 10 }}>Check-out</div>
                  <div style={{ color: T.sidebarText, fontWeight: 600, fontSize: 12, marginTop: 2 }}>{form.endDate}</div>
                </div>
              </div>
            </div>
          )}

          {/* Selected rooms */}
          {selectedRooms.length > 0 && (
            <div style={{ background: T.sidebarBg, borderRadius: 12, padding: 16 }}>
              <div style={{ fontSize: 11, color: T.sidebarMuted, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 12 }}>
                Selected Rooms ({selectedRooms.length})
              </div>
              {selectedRooms.map((r, i) => (
                <div key={r.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: i < selectedRooms.length - 1 ? `1px solid ${T.sidebarBorder}` : "none" }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 13, color: T.sidebarText }}>Room {r.roomNo}</div>
                    <div style={{ fontSize: 11, color: T.sidebarMuted }}>{r.roomTypeName}</div>
                  </div>
                  <div style={{ color: "#D4A017", fontWeight: 700, fontSize: 13 }}>
                    {fmt((roomTypeRates[r.roomTypeId] ?? r.rate) * days)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Extras Modal */}
      {isExtrasModalOpen && (
        <ExtrasModal
          isOpen={isExtrasModalOpen}
          onClose={() => setIsExtrasModalOpen(false)}
          reservationId="New"
          initialItems={selectedExtras}
          onSelection={(items) => {
            setSelectedExtras(items);
            setIsExtrasModalOpen(false);
          }}
        />
      )}
    </div>
  );
}