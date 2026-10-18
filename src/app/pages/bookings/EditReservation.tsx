//@ts-nocheck
import { useState, useEffect, useRef, forwardRef } from "react";
import { useParams, useNavigate } from "react-router";
import { toast } from "sonner";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "./modern-datepicker.css";
import { Paperclip, X } from "lucide-react";

// ─── Static Channel Options ───────────────────────────────────────────────────────
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
  "PKR " + Number(n || 0).toLocaleString("en-PK", { minimumFractionDigits: 0, maximumFractionDigits: 2 });

const calcDays = (s: string, e: string) => {
  if (!s || !e) return 0;
  const diff = new Date(e).getTime() - new Date(s).getTime();
  const d = Math.ceil(diff / 86400000);
  return d > 0 ? d : 1;
};

const safeISODate = (dateStr: string, defaultVal = "") => {
  if (!dateStr || dateStr === "0000-00-00") return defaultVal;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return defaultVal;
  return d.toISOString().split("T")[0];
};

const today = new Date().toLocaleDateString("en-CA");
const pad = (n: number) => String(n).padStart(2, "0");

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

const dateOnlyToTime = (value: string) => {
  if (!value) return 0;
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return 0;
  return new Date(year, month - 1, day).getTime();
};

const isDateAfter = (a: string, b: string) => {
  if (!a || !b) return false;
  return dateOnlyToTime(a) > dateOnlyToTime(b);
};

const isDateBefore = (a: string, b: string) => {
  if (!a || !b) return false;
  return dateOnlyToTime(a) < dateOnlyToTime(b);
};

const syncRoomDatesWithCheckout = (rooms: any[], nextEndDate: string, startDate: string, previousEndDate = "") => {
  if (!nextEndDate) return rooms;

  return rooms.map((room) => {
    const currentEndDate = room.endDate || "";
    const currentStartDate = room.startDate || startDate;
    const isSingleRoom = rooms.length === 1;
    const wasAutoSynced = !room.endDateManuallyEdited || !currentEndDate || currentEndDate === previousEndDate;

    let syncedEndDate = currentEndDate;
    let endDateManuallyEdited = Boolean(room.endDateManuallyEdited);

    if (isSingleRoom) {
      syncedEndDate = nextEndDate;
      endDateManuallyEdited = false;
    } else if (wasAutoSynced || isDateAfter(currentEndDate, nextEndDate)) {
      syncedEndDate = nextEndDate;
      endDateManuallyEdited = false;
    }

    const syncedStartDate = currentStartDate && syncedEndDate && isDateAfter(currentStartDate, syncedEndDate)
      ? startDate
      : currentStartDate;

    let syncedSegments = room.segments ? [...room.segments] : [];
    if (syncedSegments.length === 1) {
      syncedSegments = [{
        ...syncedSegments[0],
        startDate: syncedStartDate || startDate,
        endDate: syncedEndDate,
      }];
    } else if (syncedSegments.length > 1) {
      const lastIdx = syncedSegments.length - 1;
      syncedSegments[lastIdx] = {
        ...syncedSegments[lastIdx],
        endDate: syncedEndDate,
      };
    }

    return {
      ...room,
      startDate: syncedStartDate || startDate,
      endDate: syncedEndDate,
      endDateManuallyEdited,
      segments: syncedSegments,
    };
  });
};

// ─── Design tokens ────────────────────────────────────────────────────────────
const T = {
  bg: "#FFFFFF", bgPage: "#F8FAFC", bgInput: "#FFFFFF", bgCard: "#FFFFFF",
  border: "#E2E8F0", text: "#0F172A", textMuted: "#64748B", textLight: "#94A3B8",
  primary: "#1D4ED8", primaryLight: "#EFF6FF", primaryMid: "#DBEAFE",
  gold: "#B45309", success: "#059669", danger: "#DC2626", dangerLight: "#FEF2F2",
  warning: "#D97706", warningLight: "#FFFBEB", sidebarBg: "#0F172A",
  sidebarText: "#F1F5F9", sidebarMuted: "#94A3B8", sidebarBorder: "#1E293B",
};

// ─── Reusable UI ──────────────────────────────────────────────────────────────
const SectionHeader = ({ step, title, subtitle, color = T.primary }: any) => (
  <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16, marginTop: 28 }}>
    <div style={{
      width: 32, height: 32, borderRadius: "50%", background: color, display: "flex", alignItems: "center",
      justifyContent: "center", fontWeight: 800, fontSize: 13, color: "#fff", flexShrink: 0, boxShadow: `0 0 0 4px ${color}18`,
    }}>{step}</div>
    <div>
      <div style={{ fontWeight: 700, fontSize: 14, color: T.text }}>{title}</div>
      {subtitle && <div style={{ fontSize: 12, color: T.textMuted, marginTop: 1 }}>{subtitle}</div>}
    </div>
    <div style={{ flex: 1, height: 1, background: T.border, marginLeft: 4 }} />
  </div>
);

const Label = ({ children }: any) => (
  <div style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>{children}</div>
);

const inputBase = {
  width: "100%", background: T.bgInput, border: `1px solid ${T.border}`, borderRadius: 8, padding: "10px 13px",
  color: T.text, fontSize: 13, outline: "none", boxSizing: "border-box" as any, transition: "border-color 0.15s",
};

const DatePickerInput = forwardRef<HTMLInputElement, any>(
  ({ value, onClick, placeholder }, ref) => (
    <input
      ref={ref}
      value={value || ""}
      onClick={onClick}
      onChange={() => { }}
      placeholder={placeholder}
      readOnly
      style={{
        ...inputBase,
        cursor: "pointer",
        background: T.bgInput,
      }}
    />
  )
);

DatePickerInput.displayName = "DatePickerInput";

const Input = ({ label, type = "text", value, onChange, placeholder = "", readOnly = false, error = "", disabled = false }: any) => (
  <div>
    <Label>{label}</Label>
    <input type={type} value={value} onChange={onChange} placeholder={placeholder} readOnly={readOnly} disabled={disabled}
      style={{ ...inputBase, background: (readOnly || disabled) ? T.bgPage : T.bgInput, color: (readOnly || disabled) ? T.textMuted : T.text, cursor: (readOnly || disabled) ? "not-allowed" : "text", border: `1px solid ${error ? T.danger : T.border}` }}
    />
    {error && <div style={{ color: T.danger, fontSize: 11, marginTop: 4 }}>{error}</div>}
  </div>
);

const Select2 = ({ label, value, onChange, options, placeholder = "Select...", error = "" }: any) => (
  <div>
    <Label>{label}</Label>
    <select value={value} onChange={(e) => onChange(e.target.value)}
      style={{
        ...inputBase, appearance: "none" as any, cursor: "pointer", color: value ? T.text : T.textMuted, border: `1px solid ${error ? T.danger : T.border}`,
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%2364748B' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`,
        backgroundRepeat: "no-repeat", backgroundPosition: "right 12px center", paddingRight: 32,
      }}>
      <option value="">{placeholder}</option>
      {options.map((o: any) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
    {error && <div style={{ color: T.danger, fontSize: 11, marginTop: 4 }}>{error}</div>}
  </div>
);

const Textarea2 = ({ label, value, onChange, placeholder = "", rows = 3 }: any) => (
  <div>
    <Label>{label}</Label>
    <textarea value={value} onChange={onChange} placeholder={placeholder} rows={rows} style={{ ...inputBase, resize: "vertical" }} />
  </div>
);

const Card = ({ children, style = {} }: any) => (
  <div style={{ background: T.bgCard, borderRadius: 12, border: `1px solid ${T.border}`, padding: 20, ...style }}>{children}</div>
);

const Grid = ({ cols = 3, children, gap = 16 }: any) => (
  <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, 1fr)`, gap }}>{children}</div>
);

// ─── Main Component ───────────────────────────────────────────────────────────
export default function EditReservation() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [fetchMode, setFetchMode] = useState<"roomType" | "floor">("roomType");
  const [selectedRoomType, setSelectedRoomType] = useState("");
  const [selectedRooms, setSelectedRooms] = useState<any[]>([]);
  const [roomTypeRates, setRoomTypeRates] = useState<Record<number, number>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  // Hidden/preserved fields
  const [originalReservation, setOriginalReservation] = useState<any>(null);
  const [extrasList, setExtrasList] = useState<any[]>([]);
  const [tripsList, setTripsList] = useState<any[]>([]);

  // Company Reservation State
  const [isCompanyReservation, setIsCompanyReservation] = useState(false);
  const [selectedCompanyId, setSelectedCompanyId] = useState("");
  const [companies, setCompanies] = useState<any[]>([]);
  const [companyRates, setCompanyRates] = useState<Record<number, number>>({});

  const [form, setForm] = useState({
    customerCNIC: "", customerName: "", customerEmail: "",
    customerPhone: [""], customerAddress: "",
    maleGuests: "", femaleGuests: "", childrenGuests: "",
    purposeOfStay: "", channel: "", agent: "", referal: "",
    startDateTime: `${today}T12:00`,
    endDateTime: "",
    discount: "0", discountType: "percentage", taxName: "GST", taxAmount: "0", isTaxInclusive: true,
    advancePaid: "0", method: "cash", bankId: "", transactionId: "", note: "", resNotes: "", status: "", paymentDate: today,
    complimentary: "",
  });



  const setF = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }));

  const [cnicFrontFile, setCnicFrontFile] = useState<File | null>(null);
  const [cnicFrontPreview, setCnicFrontPreview] = useState<string>('');
  const [cnicBackFile, setCnicBackFile] = useState<File | null>(null);
  const [cnicBackPreview, setCnicBackPreview] = useState<string>('');
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [documentFileName, setDocumentFileName] = useState<string>('');
  const [existingDocumentPath, setExistingDocumentPath] = useState<string>('');
  const [paymentProofFile, setPaymentProofFile] = useState<File | null>(null);
  const [paymentProofPreview, setPaymentProofPreview] = useState<string>('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, side: 'Front' | 'Back' | 'Proof') => {
    const file = e.target.files?.[0];
    if (file) {
      if (side === 'Front') {
        setCnicFrontFile(file);
        setCnicFrontPreview(URL.createObjectURL(file));
      } else if (side === 'Back') {
        setCnicBackFile(file);
        setCnicBackPreview(URL.createObjectURL(file));
      } else if (side === 'Proof') {
        setPaymentProofFile(file);
        setPaymentProofPreview(URL.createObjectURL(file));
      }
    }
  };

  const [apiRoomTypes, setApiRoomTypes] = useState<any[]>([]);
  const [apiFloors, setApiFloors] = useState<any[]>([]);
  const [availableRooms, setAvailableRooms] = useState<any[]>([]);
  const [refno, setRefno] = useState<string>('');
  const [apiAgents, setApiAgents] = useState<any[]>([]);
  const [apiBanks, setApiBanks] = useState<any[]>([]);
  const [isTaxFixed, setIsTaxFixed] = useState(false);
  const [defaultTaxAmount, setDefaultTaxAmount] = useState<string>("0");

  // Derived dates
  const startDate = form.startDateTime ? form.startDateTime.split('T')[0] : '';
  const startTime = form.startDateTime ? form.startDateTime.split('T')[1] : '';
  const endDate = form.endDateTime ? form.endDateTime.split('T')[0] : '';
  const endTime = form.endDateTime ? form.endDateTime.split('T')[1] : '';
  const previousCheckoutDateRef = useRef(endDate);



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

        if (settings?.tax_percentage_enabled) {
          setIsTaxFixed(true);
          const taxAmt = (settings.tax_percentage || 0).toString();
          // Don't overwrite if it's already set by reservation data, but store default
          setDefaultTaxAmount(taxAmt);
        }
      } catch (err) {
        console.error(err);
      }
    };
    initData();
  }, []);

  // Fetch banks and agents from API
  useEffect(() => {
    import('../../services/api').then(({ default: api }) => {
      api.get('/banks').then(res => setApiBanks(res.data || [])).catch(() => { });
      api.get('/agent').then(res => setApiAgents((res.data?.agents || res.data || []).map((a: any) => ({ label: a.fullName || a.name, value: a.id })))).catch(() => { });
    });
  }, []);

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
    if (!isCompanyReservation && !loading) {
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
  }, [isCompanyReservation, selectedRooms, loading]);

  useEffect(() => {
    const fetchReservation = async () => {
      if (!id) return;
      try {
        const { default: api } = await import('../../services/api');
        const response = await api.get(`/reservation/${id}`);
        const data = response.data;
        setOriginalReservation(data);

        setRefno(data.refno || `RES-${id}`);

        let parsedGuests = { male: 0, female: 0, children: 0 };
        if (data.guests) {
          try {
            let temp = typeof data.guests === 'string' ? JSON.parse(data.guests) : data.guests;
            if (typeof temp === "string") temp = JSON.parse(temp);
            parsedGuests = { male: Number(temp.male || 0), female: Number(temp.female || 0), children: Number(temp.children || 0) };
          } catch (e) {
            console.error("Error parsing guests:", e);
          }
        }

        const payment = data.payments && data.payments.length > 0 ? data.payments[0] : {};

        let loadedRoomTypeRates: Record<number, number> = {};
        if (data.roomRent) {
          try {
            let parsed = JSON.parse(data.roomRent);
            if (typeof parsed === "string") parsed = JSON.parse(parsed);
            parsed.forEach((r: any) => {
              loadedRoomTypeRates[r.roomTypeId] = Number(r.rate);
            });
            setRoomTypeRates(loadedRoomTypeRates);
          } catch (e) { }
        }

        const sDate = safeISODate(data.startDate, today);
        const sTime = data.startTime || "12:00";
        const eDate = safeISODate(data.endDate, "");
        const eTime = data.endTime || "12:00";

        const formattedRoomsRaw = (data.rooms || []).map((r: any) => {
          // Dates and rates: check if multiple reservation_rooms rows exist for this assigned room
          const roomRows = (data.reservationRooms || []).filter((rr: any) => Number(rr.assignedRoomId) === Number(r.id));

          let segments: any[] = [];
          if (roomRows.length > 0) {
            segments = roomRows.map((rr: any, idx: number) => ({
              id: String(rr.id || `seg_${r.id}_${idx}`),
              startDate: safeISODate(rr.startDate, sDate),
              endDate: safeISODate(rr.endDate, eDate),
              rate: Number(rr.pricePerDay !== undefined && rr.pricePerDay !== null ? rr.pricePerDay : (loadedRoomTypeRates[r.roomTypeId] || r.RoomType?.rooms?.[0]?.rate || 0)),
            }));
          } else {
            const apiRoomStartDate = safeISODate(r.ReservationRoom?.startDate || r.reservationRoom?.startDate || r.startDate, sDate);
            const apiRoomEndDate = safeISODate(r.ReservationRoom?.endDate || r.reservationRoom?.endDate || r.endDate, eDate);
            const baseRate = loadedRoomTypeRates[r.roomTypeId] || r.ReservationRoom?.pricePerDay || r.reservationRoom?.pricePerDay || r.RoomType?.rooms?.[0]?.rate || 0;
            segments = [{
              id: `seg_${r.id}_0`,
              startDate: apiRoomStartDate,
              endDate: apiRoomEndDate,
              rate: Number(baseRate) || 0,
            }];
          }

          const apiRoomStartDate = segments[0]?.startDate || sDate;
          const apiRoomEndDate = segments[segments.length - 1]?.endDate || eDate;

          return {
            id: r.id,
            roomNo: r.roomNo,
            floor: r.Floor?.floorName || `Floor ${r.floorId}`,
            beds: r.RoomType?.rooms?.[0]?.bedNo || 1,
            capacity: r.RoomType?.rooms?.[0]?.capacity || 2,
            roomTypeId: r.roomTypeId,
            roomTypeName: r.RoomType?.name || 'Unknown Type',
            rate: segments[0]?.rate || 0,
            status: r.status,
            startDate: apiRoomStartDate,
            endDate: apiRoomEndDate,
            endDateManuallyEdited: Boolean(apiRoomEndDate && eDate && apiRoomEndDate !== eDate),
            segments,
          };
        });

        const formattedRooms = formattedRoomsRaw.length === 1
          ? syncRoomDatesWithCheckout(formattedRoomsRaw, eDate, sDate)
          : formattedRoomsRaw;
        setSelectedRooms(formattedRooms);

        if (formattedRooms.length > 0) {
          setSelectedRoomType(String(formattedRooms[0].roomTypeId));
        }

        let exList: any[] = [];
        if (data.extras && data.extras.length > 0) {
          exList = data.extras.map((extra: any) => ({
            id: extra.id,
            name: extra.title || extra.name || "POS Item",
            price: Number(extra.ReservationExtra?.price || extra.sellPrice || extra.price),
            qty: extra.ReservationExtra?.quantity || 1,
            taxAmount: Number(extra.ReservationExtra?.taxAmount || 0),
            isCustom: false
          }));
        }
        if (data.customExtras && data.customExtras.length > 0) {
          exList = [...exList, ...data.customExtras.map((extra: any) => ({
            id: extra.id,
            name: extra.name || "Custom Extra",
            price: Number(extra.price),
            qty: Number(extra.quantity || 1),
            taxAmount: Number(extra.taxAmount || 0),
            isCustom: true
          }))];
        }
        setExtrasList(exList);
        setTripsList(data.trips || []);

        if (data.groupId) {
          setIsCompanyReservation(true);
          setSelectedCompanyId(String(data.groupId));
        }

        if (data.cnicFront) setCnicFrontPreview(data.cnicFront);
        if (data.cnicBack) setCnicBackPreview(data.cnicBack);
        if (data.documentPath) setExistingDocumentPath(data.documentPath);

        // Use payment data if available
        if (payment && payment.paymentProof) setPaymentProofPreview(payment.paymentProof);

        setForm(prev => ({
          ...prev,
          customerName: data.customer?.name || "",
          customerCNIC: data.customer?.cnic || "",
          customerEmail: data.customer?.email || "",
          customerPhone: data.customer?.phone ? data.customer.phone.split(",") : [""],
          customerAddress: data.customer?.address || "",
          maleGuests: String(parsedGuests.male || 0),
          femaleGuests: String(parsedGuests.female || 0),
          childrenGuests: String(parsedGuests.children || 0),
          purposeOfStay: data.purposeOfStay || "",
          channel: data.channel || "",
          agent: data.agentId ? String(data.agentId) : "",
          referal: data.Referal || "",
          startDateTime: `${sDate}T${sTime}`,
          endDateTime: eDate ? `${eDate}T${eTime}` : "",
          discount: String(parseFloat(data.discount) || 0),
          discountType: data.discountType || "percentage",
          taxName: data.taxName || "GST",
          taxAmount: String(parseFloat(data.taxAmount) || 0),
          isTaxInclusive: data.isTaxInclusive ?? true,
          advancePaid: String(parseFloat(data.advancePaid) || 0),
          paymentDate: payment.date ? payment.date.split('T')[0] : today,
          method: payment.method || "cash",
          bankId: payment.bankId || "",
          transactionId: payment.transactionId || "",
          note: payment.note || "",
          resNotes: data.resNotes || "",
          status: data.status || "reserved",
          complimentary: (() => {
            let comp = data.complimentary;
            if (typeof comp === "string") {
              try { comp = JSON.parse(comp); } catch (e) { return comp; }
            }
            if (Array.isArray(comp)) return comp.join(", ");
            return typeof comp === "string" ? comp : "";
          })()
        }));
      } catch (err) {
        console.error("Failed to load reservation:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchReservation();
  }, [id]);

  useEffect(() => {
    const fetchAvailableRooms = async () => {
      if (!startDate || !endDate || !selectedRoomType) {
        setAvailableRooms([]);
        return;
      }
      try {
        const { default: api } = await import('../../services/api');
        let url = fetchMode === 'roomType'
          ? `/assignRoom/available/${selectedRoomType}`
          : `/assignRoom/available/floor/${selectedRoomType}`;

        const res = await api.get(`${url}?startDate=${startDate}&endDate=${endDate}&reservationId=${id}`);
        const availableRoomsData = (res.data.data || []).filter((e: any) => e.status === "available" || e.status === "dirty" || e.status === "maintenance");

        setAvailableRooms(availableRoomsData.map((r: any) => ({
          id: r.id,
          roomNo: r.roomNo,
          floor: r.Floor?.floorName || `Floor ${r.floorId}`,
          beds: r.RoomType?.rooms?.[0]?.bedNo || 1,
          capacity: r.RoomType?.rooms?.[0]?.capacity || 2,
          roomTypeId: r.roomTypeId,
          roomTypeName: r.RoomType?.name || 'Unknown Type',
          rate: r.RoomType?.rooms?.[0]?.rate || 0,
          status: r.status
        })));
      } catch (err) {
        console.error(err);
      }
    };
    if (!loading) fetchAvailableRooms();
  }, [fetchMode, selectedRoomType, startDate, endDate, loading, id]);

  useEffect(() => {
    if (loading) {
      previousCheckoutDateRef.current = endDate;
      return;
    }

    const previousCheckoutDate = previousCheckoutDateRef.current;
    previousCheckoutDateRef.current = endDate;

    if (!endDate || selectedRooms.length === 0) return;

    setSelectedRooms(prev => {
      const synced = syncRoomDatesWithCheckout(prev, endDate, startDate, previousCheckoutDate);
      const changed = synced.some((room, index) =>
        room.startDate !== prev[index]?.startDate ||
        room.endDate !== prev[index]?.endDate ||
        room.endDateManuallyEdited !== prev[index]?.endDateManuallyEdited
      );
      return changed ? synced : prev;
    });
  }, [endDate, startDate, loading, selectedRooms.length]);

  const toggleRoom = (room: any) => {
    setSelectedRooms(prev => {
      const exists = prev.some(r => r.id === room.id);
      const initialRate = roomTypeRates[room.roomTypeId] !== undefined
        ? roomTypeRates[room.roomTypeId]
        : (companyRates[room.roomTypeId] !== undefined ? companyRates[room.roomTypeId] : (room.rate || 0));

      const next = exists
        ? prev.filter(r => r.id !== room.id)
        : [...prev, {
            ...room,
            startDate: startDate,
            endDate: endDate,
            endDateManuallyEdited: false,
            rate: initialRate,
            segments: [{
              id: `seg_${room.id}_${Date.now()}`,
              startDate: startDate,
              endDate: endDate,
              rate: initialRate,
            }]
          }];

      if (!exists && roomTypeRates[room.roomTypeId] === undefined) {
        setRoomTypeRates(rr => ({ ...rr, [room.roomTypeId]: initialRate }));
      }

      return syncRoomDatesWithCheckout(next, endDate, startDate, endDate);
    });
  };

  // Add a new rate segment to a room (e.g. extra guest arrives on day 8)
  const addSegmentToRoom = (roomId: number) => {
    setSelectedRooms(prev => prev.map(room => {
      if (room.id !== roomId) return room;

      const segs = room.segments && room.segments.length > 0
        ? [...room.segments]
        : [{
            id: `seg_${room.id}_0`,
            startDate: room.startDate || startDate,
            endDate: room.endDate || endDate,
            rate: roomTypeRates[room.roomTypeId] ?? room.rate ?? 0,
          }];

      const lastSeg = segs[segs.length - 1];
      const s = lastSeg.startDate || startDate;
      const e = lastSeg.endDate || endDate;
      const totalDays = calcDays(s, e);

      // Default split: if at least 2 days, split off the last 2 days (or 1 day)
      let splitDateStr = e;
      if (totalDays > 1) {
        const eDateObj = new Date(e);
        const daysToSubtract = totalDays > 2 ? 2 : 1;
        const splitTime = new Date(eDateObj.getTime() - (daysToSubtract * 24 * 60 * 60 * 1000));
        splitDateStr = splitTime.toISOString().split("T")[0];
        if (splitDateStr <= s || splitDateStr >= e) {
          const sTime = new Date(s).getTime();
          const eTime = new Date(e).getTime();
          const midTime = new Date(sTime + (eTime - sTime) / 2);
          splitDateStr = midTime.toISOString().split("T")[0];
        }
      }

      segs[segs.length - 1] = {
        ...lastSeg,
        endDate: splitDateStr,
      };

      const newSeg = {
        id: `seg_${room.id}_${Date.now()}`,
        startDate: splitDateStr,
        endDate: e,
        rate: lastSeg.rate,
      };
      segs.push(newSeg);

      return {
        ...room,
        segments: segs,
      };
    }));
  };

  // Remove a rate segment from a room
  const removeSegmentFromRoom = (roomId: number, segmentId: string) => {
    setSelectedRooms(prev => prev.map(room => {
      if (room.id !== roomId) return room;
      if (!room.segments || room.segments.length <= 1) return room;

      const segIdx = room.segments.findIndex((s: any) => s.id === segmentId);
      if (segIdx === -1) return room;

      const segToRemove = room.segments[segIdx];
      const nextSegs = room.segments.filter((s: any) => s.id !== segmentId);

      if (segIdx > 0) {
        nextSegs[segIdx - 1] = {
          ...nextSegs[segIdx - 1],
          endDate: segToRemove.endDate,
        };
      } else if (nextSegs.length > 0) {
        nextSegs[0] = {
          ...nextSegs[0],
          startDate: segToRemove.startDate,
        };
      }

      return {
        ...room,
        startDate: nextSegs[0]?.startDate || room.startDate,
        endDate: nextSegs[nextSegs.length - 1]?.endDate || room.endDate,
        segments: nextSegs,
      };
    }));
  };

  // Update a specific segment's start date, end date, or rate
  const updateRoomSegment = (roomId: number, segmentId: string, field: "startDate" | "endDate" | "rate", value: any) => {
    setSelectedRooms(prev => prev.map(room => {
      if (room.id !== roomId) return room;
      if (!room.segments) return room;

      const segIdx = room.segments.findIndex((s: any) => s.id === segmentId);
      if (segIdx === -1) return room;

      const nextSegs = [...room.segments];
      const cur = { ...nextSegs[segIdx] };

      if (field === "rate") {
        cur.rate = Math.max(0, Number(value) || 0);
        nextSegs[segIdx] = cur;
      } else if (field === "startDate") {
        if (startDate && isDateBefore(value, startDate)) {
          value = startDate;
        }
        cur.startDate = value;
        if (segIdx > 0) {
          nextSegs[segIdx - 1] = {
            ...nextSegs[segIdx - 1],
            endDate: value,
          };
        }
        nextSegs[segIdx] = cur;
      } else if (field === "endDate") {
        if (endDate && isDateAfter(value, endDate)) {
          value = endDate;
        }
        cur.endDate = value;
        if (segIdx < nextSegs.length - 1) {
          nextSegs[segIdx + 1] = {
            ...nextSegs[segIdx + 1],
            startDate: value,
          };
        }
        nextSegs[segIdx] = cur;
      }

      return {
        ...room,
        startDate: nextSegs[0]?.startDate || room.startDate,
        endDate: nextSegs[nextSegs.length - 1]?.endDate || room.endDate,
        segments: nextSegs,
      };
    }));
  };

  const updateRoomDate = (roomId: number, field: "startDate" | "endDate", value: string) => {
    setSelectedRooms(prev => {
      return prev.map(r => {
        if (r.id !== roomId) return r;
        const segs = r.segments && r.segments.length > 0 ? r.segments : [{ id: `seg_${r.id}_0`, startDate: r.startDate || startDate, endDate: r.endDate || endDate, rate: r.rate }];
        if (field === "startDate") {
          return {
            ...r,
            startDate: value,
            segments: segs.map((s: any, idx: number) => idx === 0 ? { ...s, startDate: value } : s),
          };
        } else {
          return {
            ...r,
            endDate: value,
            endDateManuallyEdited: endDate ? value !== endDate : true,
            segments: segs.map((s: any, idx: number) => idx === segs.length - 1 ? { ...s, endDate: value } : s),
          };
        }
      });
    });
  };

  const roomTotal = selectedRooms.reduce((s, r) => {
    if (r.segments && r.segments.length > 0) {
      return s + r.segments.reduce((segSum: number, seg: any) => {
        const sDate = seg.startDate || r.startDate || startDate;
        const eDate = seg.endDate || r.endDate || endDate;
        const days = calcDays(sDate, eDate);
        const rate = Number(seg.rate) >= 0 ? Number(seg.rate) : (roomTypeRates[r.roomTypeId] ?? r.rate ?? 0);
        return segSum + (rate * days);
      }, 0);
    }
    const days = calcDays(r.startDate || startDate, r.endDate || endDate);
    const rate = roomTypeRates[r.roomTypeId] ?? r.rate;
    return s + (rate * days);
  }, 0);
  const taxVal = roomTotal * (parseFloat(form.taxAmount) / 100 || 0);
  const amountWithTax = form.isTaxInclusive ? roomTotal : roomTotal + taxVal;

  let discVal = 0;
  if (form.discountType === "percentage") {
    discVal = amountWithTax * (parseFloat(form.discount) / 100 || 0);
  } else {
    discVal = parseFloat(form.discount) || 0;
  }

  const finalRoomTotal = amountWithTax - discVal;
  const extrasTotal = extrasList.reduce((sum, e) => sum + e.price * e.qty, 0);
  const posTaxTotal = extrasList.reduce((sum, e) => sum + (e.taxAmount || 0), 0);
  const tripsTotalLive = tripsList.filter(t => t.billingType?.toLowerCase()?.replace(/\s/g, "") !== "paynow").reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  const grandTotal = Math.max(0, finalRoomTotal + extrasTotal + posTaxTotal + tripsTotalLive);
  const balance = grandTotal - (parseFloat(form.advancePaid) || 0);
  const uniqueTypeIds = [...new Set(selectedRooms.map(r => r.roomTypeId))];

  const roomDateErrors = selectedRooms.reduce((acc: Record<number, string>, room: any) => {
    const segs = room.segments && room.segments.length > 0
      ? room.segments
      : [{ startDate: room.startDate || startDate, endDate: room.endDate || endDate }];

    for (let i = 0; i < segs.length; i++) {
      const seg = segs[i];
      const rStart = seg.startDate || startDate;
      const rEnd = seg.endDate || endDate;
      const segLabel = segs.length > 1 ? `Room ${room.roomNo} (Period ${i + 1})` : `Room ${room.roomNo}`;

      if (!rStart || !rEnd) {
        acc[room.id] = `${segLabel}: Start aur end date required hain.`;
        break;
      } else if (startDate && isDateBefore(rStart, startDate)) {
        acc[room.id] = `${segLabel}: Start date check-in date (${startDate}) se pehle nahi ho sakti.`;
        break;
      } else if (endDate && isDateAfter(rStart, endDate)) {
        acc[room.id] = `${segLabel}: Start date checkout date (${endDate}) se agay nahi ho sakti.`;
        break;
      } else if (isDateAfter(rStart, rEnd) || rStart === rEnd) {
        acc[room.id] = `${segLabel}: Start date end date se pehle honi chahiye.`;
        break;
      } else if (endDate && isDateAfter(rEnd, endDate)) {
        acc[room.id] = `${segLabel}: End date checkout date (${endDate}) se agay nahi ho sakti.`;
        break;
      } else if (startDate && isDateBefore(rEnd, startDate)) {
        acc[room.id] = `${segLabel}: End date check-in date (${startDate}) se pehle nahi ho sakti.`;
        break;
      }
    }

    return acc;
  }, {});

  const statusDot: Record<string, string> = { dirty: T.warning, maintenance: T.danger, available: T.success };

  const handleSave = async (submitStatus?: string) => {
    const finalStatus = submitStatus === 'draft' ? 'draft' : form.status;
    const newErrors: Record<string, string> = {};

    if (finalStatus !== 'draft') {
      if (!form.customerName?.trim()) {
        newErrors.customerName = "Customer name is required";
      }
      if (!form.customerPhone[0]?.trim()) {
        newErrors.customerPhone = "Phone number is required";
      }
      if (form.customerEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.customerEmail)) {
        newErrors.customerEmail = "Please enter a valid email address";
      }
      if (!form.channel) {
        newErrors.channel = "Booking channel is required";
      } else if (form.channel === "agent" && !form.agent) {
        newErrors.agent = "Please select an agent";
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error("Please fix validation errors.");
      return;
    }
    setErrors({});

    if (selectedRooms.length === 0 && finalStatus !== 'draft') {
      toast.info("Please select at least one room.");
      return;
    }

    if (!endDate && finalStatus !== 'draft') {
      toast.error("Please select checkout date first.");
      return;
    }

    const invalidRoom = selectedRooms.find(room => {
      const segs = room.segments && room.segments.length > 0
        ? room.segments
        : [{ startDate: room.startDate || startDate, endDate: room.endDate || endDate }];

      return segs.some((seg: any) => {
        const s = seg.startDate || startDate;
        const e = seg.endDate || endDate;
        return (
          !s ||
          !e ||
          isDateBefore(s, startDate) ||
          isDateAfter(s, endDate) ||
          isDateAfter(s, e) ||
          s === e ||
          isDateAfter(e, endDate) ||
          isDateBefore(e, startDate)
        );
      });
    });

    if (invalidRoom && finalStatus !== 'draft') {
      toast.error(`Room ${invalidRoom.roomNo}: Dates must be valid and within reservation dates (${startDate} to ${endDate}).`);
      return;
    }

    setSubmitting(true);
    try {
      const { default: api } = await import('../../services/api');

      const roomRentDetailsObject: Record<number, any> = {};
      selectedRooms.forEach(room => {
        const typeId = room.roomTypeId;
        const rate = room.segments?.[0]?.rate ?? roomTypeRates[typeId] ?? room.rate ?? 0;
        if (!roomRentDetailsObject[typeId]) {
          roomRentDetailsObject[typeId] = { roomTypeId: typeId, roomTypeName: room.roomTypeName, rate, count: 0, roomIds: [] };
        }
        roomRentDetailsObject[typeId].count += 1;
        roomRentDetailsObject[typeId].roomIds.push(room.id);
      });
      const roomRentJson = JSON.stringify(Object.values(roomRentDetailsObject));

      const assignedRoomIds = selectedRooms.flatMap(r => {
        if (r.segments && r.segments.length > 0) {
          return r.segments.map((seg: any) => ({
            assignedRoomId: r.id,
            startDate: seg.startDate || r.startDate || startDate,
            endDate: seg.endDate || r.endDate || endDate,
            pricePerDay: Number(seg.rate) >= 0 ? Number(seg.rate) : (roomTypeRates[r.roomTypeId] ?? r.rate ?? 0),
            status: r.status === "cancelled" ? "cancelled" : "active",
          }));
        }
        return [{
          assignedRoomId: r.id,
          startDate: r.startDate || startDate,
          endDate: r.endDate || endDate,
          pricePerDay: roomTypeRates[r.roomTypeId] ?? r.rate ?? 0,
          status: r.status === "cancelled" ? "cancelled" : "active",
        }];
      });

      const payload = {
        ...form,
        agentId: form.agent || "",
        startDate,
        startTime,
        endDate,
        endTime,
        groupId: isCompanyReservation && selectedCompanyId ? selectedCompanyId : null,
        numOfSeats: 0,
        customerPhone: form.customerPhone.join(","),
        assignedRoomIds,
        totalAmount: grandTotal,
        balanceAmount: balance,
        posTaxAmount: posTaxTotal,
        roomRent: roomRentJson,
        isTaxInclusive: form.isTaxInclusive,
        status: finalStatus,
        guests: JSON.stringify({ male: Number(form.maleGuests), female: Number(form.femaleGuests), children: Number(form.childrenGuests) }),
        payment: {
          method: form.method,
          amount: Number(form.advancePaid) || 0,
          transactionId: form.transactionId,
          note: form.note,
          date: form.paymentDate || today,
          status: "paid",
        },
        extras: JSON.stringify(extrasList.map(ex => ex.isCustom ? { ...ex, id: `custom-${ex.id}` } : ex)),
      };

      const formData = new FormData();
      Object.keys(payload).forEach((key) => {
        if (key === 'assignedRoomIds' || key === 'payment') {
          formData.append(key, JSON.stringify((payload as any)[key]));
        } else if (key === 'complimentary') {
          formData.append(key, (payload as any)[key] || "");
        } else if (key === 'groupId') {
          formData.append(key, (payload as any)[key] !== null && (payload as any)[key] !== undefined ? String((payload as any)[key]) : "");
        } else if ((payload as any)[key] !== null && (payload as any)[key] !== undefined) {
          formData.append(key, (payload as any)[key]);
        }
      });

      if (cnicFrontFile) formData.append('cnicFront', cnicFrontFile);
      if (cnicBackFile) formData.append('cnicBack', cnicBackFile);
      if (documentFile) formData.append('document', documentFile);
      if (paymentProofFile) formData.append('proofImage', paymentProofFile);

      await api.put(`/reservation/edit/${id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      navigate('/bookings');
    } catch (error) {
      console.error(error);
      alert("Failed to update reservation.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div style={{ padding: 40, textAlign: "center", color: T.textMuted }}>Loading reservation...</div>;

  return (
    <div style={{ background: T.bgPage, minHeight: "100vh", fontFamily: "'Inter', system-ui, sans-serif", color: T.text }}>
      <div style={{ background: T.bg, borderBottom: `1px solid ${T.border}`, padding: "14px 28px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 100, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <button onClick={() => navigate(-1)} style={{ background: T.bgPage, border: `1px solid ${T.border}`, borderRadius: 8, color: T.textMuted, padding: "7px 14px", cursor: "pointer", fontSize: 13, fontWeight: 500 }}>← Back</button>
          <div>
            <div style={{ fontWeight: 800, fontSize: 17, color: T.text }}>Edit Reservation #{refno}</div>
            <div style={{ fontSize: 12, color: T.textMuted }}>Home / Reservations / Edit</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => navigate(-1)} disabled={submitting} style={{ background: T.bgPage, border: `1px solid ${T.border}`, borderRadius: 8, color: T.text, padding: "8px 18px", cursor: "pointer", fontWeight: 600, fontSize: 13 }}>Cancel</button>
          <button onClick={() => handleSave('active')} disabled={submitting} style={{ background: T.primary, border: "none", borderRadius: 8, color: "#fff", padding: "8px 24px", cursor: "pointer", fontWeight: 700, fontSize: 13, boxShadow: "0 2px 8px #1D4ED840" }}>{submitting ? "Updating..." : "Finalize & Update"}</button>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "flex-start" }}>
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

          <SectionHeader step="1" title="Customer Information" subtitle="Primary guest details & identification" color="#1D4ED8" />
          <Card>
            <Grid cols={3}>
              <Input label="CNIC / Passport" value={form.customerCNIC} onChange={(e: any) => setF("customerCNIC", e.target.value)} placeholder="35202-1234567-1" error={errors.customerCNIC} />
              <Input label="Full Name" value={form.customerName} onChange={(e: any) => setF("customerName", e.target.value)} placeholder="Ahmad Raza" error={errors.customerName} />
              <Input label="Email Address" type="email" value={form.customerEmail} onChange={(e: any) => setF("customerEmail", e.target.value)} placeholder="ahmad@email.com" error={errors.customerEmail} />
            </Grid>
            <div style={{ height: 14 }} />
            <Grid cols={3}>
              <div>
                <Label>Phone Number(s)</Label>
                {form.customerPhone.map((ph, i) => (
                  <div key={i} style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                    <input type="text" value={ph} onChange={e => { const val = e.target.value.replace(/[^0-9+ -]/g, '').slice(0, 16); const a = [...form.customerPhone]; a[i] = val; setF("customerPhone", a); if (errors.customerPhone) setErrors(p => ({ ...p, customerPhone: '' })); }} maxLength={16} placeholder={`Phone ${i + 1}`}
                      style={{ ...inputBase, flex: 1, border: `1px solid ${i === 0 && errors.customerPhone ? T.danger : T.border}`, background: i === 0 && errors.customerPhone ? T.dangerLight : T.bgInput }} />
                    {form.customerPhone.length > 1 && (
                      <button onClick={() => setF("customerPhone", form.customerPhone.filter((_, j) => j !== i))} style={{ background: T.dangerLight, border: `1px solid #FECACA`, borderRadius: 8, color: T.danger, padding: "0 10px", cursor: "pointer", fontSize: 13 }}>✕</button>
                    )}
                  </div>
                ))}
                {errors.customerPhone && <div style={{ color: T.danger, fontSize: 11, marginTop: -4, marginBottom: 8 }}>{errors.customerPhone}</div>}
                <button onClick={() => setF("customerPhone", [...form.customerPhone, ""])} style={{ background: "transparent", border: `1px dashed ${T.border}`, borderRadius: 8, color: T.textMuted, padding: "7px 14px", cursor: "pointer", fontSize: 12, width: "100%" }}>+ Add Phone</button>
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
                    <label style={{ display: "flex", alignItems: "center", gap: 12, background: T.bgPage, border: `1px dashed ${T.border}`, borderRadius: 8, padding: "13px 16px", cursor: "pointer" }}>
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
                    <div style={{ fontSize: 11, color: T.textLight }}>Will replace existing document</div>
                  </div>
                  <button onClick={() => { setDocumentFile(null); setDocumentFileName(''); }} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: T.danger, padding: 4 }}>
                    <X size={16} />
                  </button>
                </div>
              ) : existingDocumentPath ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: T.bgPage, border: `1px solid ${T.border}`, borderRadius: 8, padding: '12px 16px' }}>
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: '#F0FDF4', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Paperclip size={18} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>Document already uploaded</div>
                    <a href={existingDocumentPath} target="_blank" rel="noreferrer" style={{ fontSize: 11, color: '#1D4ED8' }}>View current document →</a>
                  </div>
                  <label style={{ cursor: 'pointer', fontSize: 12, color: '#1D4ED8', fontWeight: 600 }}>
                    Replace
                    <input type="file" accept=".pdf,.doc,.docx,image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) { setDocumentFile(f); setDocumentFileName(f.name); } }} style={{ display: 'none' }} />
                  </label>
                </div>
              ) : (
                <label style={{ display: 'flex', alignItems: 'center', gap: 12, background: T.bgPage, border: `1px dashed ${T.border}`, borderRadius: 8, padding: '13px 16px', cursor: 'pointer' }}>
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

          <SectionHeader step="2" title="Guest Composition" subtitle="Number of guests by category" color="#7C3AED" />
          <Card>
            <Grid cols={3}>
              <Input label=" Male Guests" type="number" value={form.maleGuests} onChange={(e: any) => setF("maleGuests", e.target.value)} />
              <Input label=" Female Guests" type="number" value={form.femaleGuests} onChange={(e: any) => setF("femaleGuests", e.target.value)} />
              <Input label=" Children" type="number" value={form.childrenGuests} onChange={(e: any) => setF("childrenGuests", e.target.value)} />
            </Grid>
          </Card>

          <SectionHeader step="3" title="Stay & Booking Details" subtitle="Dates, channel and purpose of visit" color="#059669" />
          <Card>
            <Grid cols={3}>
              <div>
                <Label>Check-in Date & Time</Label>
                <DatePicker
                  selected={fromLocalDateTimeString(form.startDateTime)}
                  onChange={(date: Date | null) => {
                    setF("startDateTime", toLocalDateTimeString(date));
                    setSelectedRooms([]);
                    setAvailableRooms([]);
                  }}
                  showTimeSelect
                  timeIntervals={15}
                  dateFormat="yyyy-MM-dd h:mm aa"
                  placeholderText="Select check-in date & time"
                  customInput={<DatePickerInput />}
                />
              </div>
              <div>
                <Label>Check-out Date & Time</Label>
                <DatePicker
                  selected={fromLocalDateTimeString(form.endDateTime)}
                  onChange={(date: Date | null) => {
                    const nextEndDateTime = toLocalDateTimeString(date);
                    const nextEndDate = nextEndDateTime ? nextEndDateTime.split("T")[0] : "";

                    setF("endDateTime", nextEndDateTime);
                    setSelectedRooms(prev => syncRoomDatesWithCheckout(prev, nextEndDate, startDate, endDate));
                    setAvailableRooms([]);
                  }}
                  showTimeSelect
                  timeIntervals={15}
                  dateFormat="yyyy-MM-dd h:mm aa"
                  placeholderText="Select check-out date & time"
                  minDate={fromLocalDateTimeString(form.startDateTime) || undefined}
                  customInput={<DatePickerInput />}
                />
              </div>
              <div>
                <Label>Reservation Status</Label>
                <select
                  value={form.status}
                  onChange={e => {
                    if (e.target.value === "checked_out" && balance > 0) {
                      toast.warning(`⚠️ Pending balance of PKR ${balance.toLocaleString()} must be cleared before checkout! Please add payment first.`, {
                        duration: 5000,
                      });
                      return;
                    }
                    setF("status", e.target.value);
                  }}
                  style={{
                    ...inputBase, appearance: "none" as any, cursor: "pointer",
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%2364748B' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`,
                    backgroundRepeat: "no-repeat", backgroundPosition: "right 12px center", paddingRight: 32,
                    color: form.status === 'checked_in' ? T.success : form.status === 'reserved' ? T.primary : form.status === 'cancelled' ? T.danger : T.warning,
                    fontWeight: 600,
                  }}
                >
                  <option value="reserved">Reserved</option>
                  <option value="checked_in">Checked In</option>
                  <option value="checked_out">Checked Out</option>
                  {form.status === "cancelled" && (
                    <option value="cancelled">Cancelled</option>
                  )}
                </select>
                <div style={{ fontSize: 11, color: T.textMuted, marginTop: 4 }}>
                  {startDate === today ? '✅ Auto-set: Check-in is today' : startDate ? '📅 Auto-set: Future date → Reserved' : ''}
                </div>
              </div>
            </Grid>
            <div style={{ height: 14 }} />
            <Grid cols={3}>
              <Select2 label="Booking Channel" value={form.channel} onChange={(v: string) => { setF("channel", v); if (errors.channel) setErrors(p => ({ ...p, channel: '' })); }} options={channelOptions} error={errors.channel} />
              <Input label="Purpose of Stay" value={form.purposeOfStay} onChange={(e: any) => setF("purposeOfStay", e.target.value)} />
              {form.channel === "agent" && (
                <Select2 label="Select Agent" value={form.agent} onChange={(v: string) => { setF("agent", v); if (errors.agent) setErrors(p => ({ ...p, agent: '' })); }} options={apiAgents} placeholder="Choose agent..." error={errors.agent} />
              )}
              {form.channel === "refernce" && (
                <Input label="Reference Name" value={form.referal} onChange={(e: any) => setF("referal", e.target.value)} placeholder="Referred by..." />
              )}
            </Grid>
          </Card>

          <SectionHeader step="4" title="Room Selection" subtitle="Choose room type and assign rooms" color="#B45309" />
          <Card>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 18 }}>
              <span style={{ color: T.textMuted, fontSize: 11, fontWeight: 700, textTransform: "uppercase" }}>Filter by:</span>
              {(["roomType", "floor"] as const).map(m => (
                <button key={m} onClick={() => { setFetchMode(m); setSelectedRoomType(""); }}
                  style={{ background: fetchMode === m ? T.primary : T.bgPage, border: `1px solid ${fetchMode === m ? T.primary : T.border}`, borderRadius: 20, color: fetchMode === m ? "#fff" : T.textMuted, padding: "5px 14px", cursor: "pointer", fontWeight: 600, fontSize: 12 }}>
                  {m === "roomType" ? "🏷 Room Type" : "🏢 Floor"}
                </button>
              ))}
            </div>

            <Grid cols={3}>
              <div style={{ gridColumn: "span 2" }}>
                <Select2 label={fetchMode === "roomType" ? "Select Room Type" : "Select Floor"} value={selectedRoomType} onChange={(v: string) => setSelectedRoomType(v)} options={fetchMode === "roomType" ? apiRoomTypes : apiFloors} />
              </div>
            </Grid>

            {selectedRoomType && (
              <div style={{ marginTop: 20 }}>
                <div style={{ fontSize: 12, color: T.textMuted, fontWeight: 700, textTransform: "uppercase", marginBottom: 12 }}>Available Rooms</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))", gap: 10 }}>
                  {[...selectedRooms, ...availableRooms.filter(ar => !selectedRooms.some(sr => sr.id === ar.id))].map(room => {
                    const isSelected = selectedRooms.some(r => r.id === room.id);
                    const sc = statusDot[room.status] || T.success;
                    return (
                      <div key={room.id} onClick={() => toggleRoom(room)} style={{ background: isSelected ? T.primary : T.bgPage, border: `2px solid ${isSelected ? T.primary : T.border}`, borderRadius: 10, padding: 12, cursor: "pointer", textAlign: "center", position: "relative" }}>
                        {room.status !== "available" && <div style={{ position: "absolute", top: 6, right: 6, width: 7, height: 7, borderRadius: "50%", background: sc }} />}
                        <div style={{ fontWeight: 800, fontSize: 15, color: isSelected ? "#fff" : T.text }}>{room.roomNo}</div>
                        <div style={{ fontSize: 11, color: isSelected ? "#BFDBFE" : T.textMuted, marginTop: 3 }}>{room.floor}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {selectedRooms.length > 0 && (
              <div style={{ marginTop: 24 }}>
                <div style={{ fontSize: 12, color: T.textMuted, fontWeight: 700, textTransform: "uppercase", marginBottom: 12 }}>Selected Rooms</div>
                {Object.keys(roomDateErrors).length > 0 && (
                  <div style={{ background: T.dangerLight, border: `1px solid #FECACA`, color: T.danger, borderRadius: 8, padding: "9px 12px", fontSize: 12, fontWeight: 600, marginBottom: 10 }}>
                    Reservation update tab hogi jab har room ki date range reservation dates ({startDate} to {endDate}) ke andar hogi.
                  </div>
                )}
                <div style={{ border: `1px solid ${T.border}`, borderRadius: 10, overflow: "hidden" }}>
                  {selectedRooms.map((room, i) => {
                    const segs = room.segments && room.segments.length > 0
                      ? room.segments
                      : [{
                          id: `seg_${room.id}_0`,
                          startDate: room.startDate || startDate,
                          endDate: room.endDate || endDate,
                          rate: roomTypeRates[room.roomTypeId] ?? room.rate ?? 0,
                        }];

                    const roomTotalCalc = segs.reduce((sum: number, s: any) => {
                      const sD = s.startDate || startDate;
                      const eD = s.endDate || endDate;
                      const d = calcDays(sD, eD);
                      const r = Number(s.rate) >= 0 ? Number(s.rate) : (roomTypeRates[room.roomTypeId] ?? room.rate ?? 0);
                      return sum + (r * d);
                    }, 0);

                    return (
                      <div key={room.id} style={{ padding: "14px 16px", borderBottom: i < selectedRooms.length - 1 ? `1px solid ${T.border}` : "none", background: i % 2 === 0 ? T.bg : T.bgPage }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                            <span style={{ fontWeight: 700, color: T.text, fontSize: 13 }}>Room {room.roomNo}</span>
                            <span style={{ color: T.textMuted, fontSize: 12 }}>{room.roomTypeName}</span>
                            {segs.length > 1 && (
                              <span style={{ padding: "2px 8px", background: "#eff6ff", color: "#1d4ed8", border: "1px solid #bfdbfe", borderRadius: 12, fontSize: 11, fontWeight: 700 }}>
                                {segs.length} Date Rates
                              </span>
                            )}
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                            <span style={{ color: "#B45309", fontWeight: 700, fontSize: 14 }}>{fmt(roomTotalCalc)}</span>
                            <button type="button" onClick={() => toggleRoom(room)} style={{ background: T.dangerLight, border: `1px solid #FECACA`, borderRadius: 6, color: T.danger, padding: "4px 10px", cursor: "pointer", fontSize: 12 }}>Remove</button>
                          </div>
                        </div>

                        {/* Date & Rate Segments */}
                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                          {segs.map((seg: any, segIdx: number) => {
                            const sVal = seg.startDate || startDate;
                            const eVal = seg.endDate || endDate;
                            const segDays = calcDays(sVal, eVal);
                            const segRate = Number(seg.rate) >= 0 ? Number(seg.rate) : (roomTypeRates[room.roomTypeId] ?? room.rate ?? 0);
                            const segSubtotal = segRate * segDays;

                            return (
                              <div
                                key={seg.id || segIdx}
                                style={{
                                  display: "flex",
                                  flexWrap: "wrap",
                                  alignItems: "center",
                                  gap: 10,
                                  padding: "8px 12px",
                                  background: segs.length > 1 ? (segIdx % 2 === 0 ? "#f8fafc" : "#ffffff") : "transparent",
                                  border: segs.length > 1 ? `1px solid ${T.border}` : "none",
                                  borderRadius: 8,
                                }}
                              >
                                {segs.length > 1 && (
                                  <span style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, minWidth: 54 }}>
                                    Period {segIdx + 1}:
                                  </span>
                                )}
                                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                  <span style={{ fontSize: 11, color: T.textMuted, fontWeight: 600 }}>Start:</span>
                                  <input
                                    type="date"
                                    value={sVal}
                                    onChange={e => updateRoomSegment(room.id, seg.id, "startDate", e.target.value)}
                                    min={startDate || undefined}
                                    max={eVal || endDate || undefined}
                                    style={{ ...inputBase, padding: "4px 8px", fontSize: 12, width: "auto" }}
                                  />
                                </div>
                                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                  <span style={{ fontSize: 11, color: T.textMuted, fontWeight: 600 }}>End:</span>
                                  <input
                                    type="date"
                                    value={eVal}
                                    onChange={e => updateRoomSegment(room.id, seg.id, "endDate", e.target.value)}
                                    min={sVal || startDate || undefined}
                                    max={endDate || undefined}
                                    disabled={selectedRooms.length === 1 && segs.length === 1}
                                    style={{
                                      ...inputBase,
                                      padding: "4px 8px",
                                      fontSize: 12,
                                      width: "auto",
                                      border: `1px solid ${roomDateErrors[room.id] ? T.danger : T.border}`,
                                      background: (selectedRooms.length === 1 && segs.length === 1) ? T.bgPage : T.bgInput,
                                      color: (selectedRooms.length === 1 && segs.length === 1) ? T.textMuted : T.text,
                                      cursor: (selectedRooms.length === 1 && segs.length === 1) ? "not-allowed" : "text",
                                    }}
                                  />
                                </div>

                                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                  <span style={{ fontSize: 11, color: T.textMuted, fontWeight: 600 }}>Rate/Night:</span>
                                  <div style={{ display: "flex", alignItems: "center", border: `1px solid ${T.border}`, borderRadius: 6, overflow: "hidden", background: T.bgInput }}>
                                    <span style={{ padding: "3px 6px", fontSize: 11, color: T.textMuted, background: T.bgPage, borderRight: `1px solid ${T.border}` }}>PKR</span>
                                    <input
                                      type="number"
                                      value={seg.rate ?? ""}
                                      placeholder={String(roomTypeRates[room.roomTypeId] ?? room.rate ?? 0)}
                                      onChange={e => updateRoomSegment(room.id, seg.id, "rate", e.target.value)}
                                      style={{ width: 85, padding: "3px 6px", fontSize: 12, border: "none", outline: "none", background: "transparent", color: T.text }}
                                    />
                                  </div>
                                </div>

                                <div style={{ fontSize: 11, color: T.textMuted }}>
                                  ({segDays} nights × {fmt(segRate)} = <strong style={{ color: T.text }}>{fmt(segSubtotal)}</strong>)
                                </div>

                                {segs.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => removeSegmentFromRoom(room.id, seg.id)}
                                    title="Remove this rate period"
                                    style={{
                                      marginLeft: "auto",
                                      background: T.dangerLight,
                                      border: `1px solid #fecaca`,
                                      borderRadius: 4,
                                      color: T.danger,
                                      cursor: "pointer",
                                      padding: "3px 8px",
                                      fontSize: 11,
                                      fontWeight: 600,
                                    }}
                                  >
                                    ✕ Remove
                                  </button>
                                )}
                              </div>
                            );
                          })}
                        </div>

                        {/* Add custom rate period button */}
                        <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 8 }}>
                          <button
                            type="button"
                            onClick={() => addSegmentToRoom(room.id)}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 4,
                              background: "#eff6ff",
                              color: "#1d4ed8",
                              border: "1px dashed #93c5fd",
                              borderRadius: 6,
                              padding: "4px 10px",
                              fontSize: 11,
                              fontWeight: 600,
                              cursor: "pointer",
                            }}
                          >
                            + Add Custom Date Rate / Split Stay (Extra Guest / Changed Rate)
                          </button>
                        </div>

                        {roomDateErrors[room.id] && (
                          <div style={{ marginTop: 7, color: T.danger, fontSize: 11, fontWeight: 600 }}>
                            {roomDateErrors[room.id]}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div style={{ marginTop: 16 }}>
                  <div style={{ fontSize: 12, color: T.textMuted, fontWeight: 700, marginBottom: 10, textTransform: "uppercase" }}>Edit Nightly Rate (Per Type)</div>
                  <Grid cols={3}>
                    {uniqueTypeIds.map(typeId => {
                      const room = selectedRooms.find(r => r.roomTypeId === typeId);
                      return (
                        <div key={typeId}>
                          <Label>Rate · {room?.roomTypeName}</Label>
                          <div style={{ display: "flex", alignItems: "center", border: `1px solid ${T.border}`, borderRadius: 8, overflow: "hidden" }}>
                            <span style={{ padding: "10px 10px", color: T.textMuted, fontSize: 12, borderRight: `1px solid ${T.border}`, background: T.bgPage }}>PKR</span>
                            <input
                              type="number"
                              value={roomTypeRates[typeId] ?? ""}
                              onChange={e => {
                                const val = Number(e.target.value);
                                setRoomTypeRates(r => ({ ...r, [typeId]: val }));
                                setSelectedRooms(prev => prev.map(roomItem => {
                                  if (roomItem.roomTypeId === typeId && (!roomItem.segments || roomItem.segments.length <= 1)) {
                                    return {
                                      ...roomItem,
                                      rate: val,
                                      segments: [{
                                        id: roomItem.segments?.[0]?.id || `seg_${roomItem.id}_0`,
                                        startDate: roomItem.segments?.[0]?.startDate || roomItem.startDate || startDate,
                                        endDate: roomItem.segments?.[0]?.endDate || roomItem.endDate || endDate,
                                        rate: val,
                                      }],
                                    };
                                  }
                                  return roomItem;
                                }));
                              }}
                              style={{ flex: 1, border: "none", padding: "10px 12px", color: T.text, fontSize: 13, outline: "none", background: T.bgInput }}
                            />
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

          <SectionHeader step="6" title="Additional Notes" subtitle="Internal office record only" color="#475569" />
          <Card>
            <Textarea2 label="Special Notes / Instructions" value={form.resNotes} onChange={(e: any) => setF("resNotes", e.target.value)} rows={3} />
          </Card>

          {extrasList.length > 0 && (
            <>
              <SectionHeader step="5.5" title="POS & Custom Extras" subtitle="Items added from POS or custom charges" color="#8B5CF6" />
              <Card>
                <div style={{ border: `1px solid ${T.border}`, borderRadius: 10, overflow: "hidden" }}>
                  {extrasList.map((ex, i) => (
                    <div key={i} style={{ padding: "12px 16px", borderBottom: i < extrasList.length - 1 ? `1px solid ${T.border}` : "none", background: i % 2 === 0 ? T.bg : T.bgPage, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <span style={{ fontWeight: 600, color: T.text, fontSize: 13 }}>{ex.name}</span>
                        {ex.isCustom && <span style={{ marginLeft: 8, fontSize: 11, background: T.primaryLight, color: T.primary, padding: "2px 6px", borderRadius: 4 }}>Custom</span>}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
                        <div style={{ fontSize: 12, color: T.textMuted }}>{fmt(ex.price)} x {ex.qty}</div>
                        <div style={{ fontWeight: 700, fontSize: 13, color: T.text, width: 80, textAlign: "right" }}>{fmt(ex.price * ex.qty)}</div>
                        <button onClick={() => setExtrasList(prev => prev.filter((_, idx) => idx !== i))} style={{ background: T.dangerLight, border: `1px solid #FECACA`, borderRadius: 6, color: T.danger, padding: "4px 10px", cursor: "pointer", fontSize: 12 }}>Remove</button>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </>
          )}

          <SectionHeader
            step="6"
            title="Billing Summary"
            subtitle="Taxes, discounts and advance payment"
            color="#DB2777"
          />

          <Card>
            {/* Totals */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                gap: 12,
                marginBottom: 20,
              }}
            >
              {Object.entries({
                "Room Total": fmt(roomTotal),
                "Grand Total": fmt(grandTotal),
                "Balance Due": fmt(Math.max(0, balance)),
              }).map(([l, v]) => (
                <div
                  key={l}
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
                    {l}
                  </div>

                  <div
                    style={{
                      fontSize: 18,
                      fontWeight: 900,
                      color:
                        l === "Grand Total"
                          ? T.primary
                          : l === "Balance Due"
                            ? balance > 0
                              ? T.danger
                              : T.success
                            : T.text,
                      wordBreak: "break-word",
                    }}
                  >
                    {v}
                  </div>
                </div>
              ))}
            </div>

            {/* Discount + Tax */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
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
                  minWidth: 0,
                }}
              >
                <Label>Discount</Label>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 110px",
                    gap: 10,
                    alignItems: "center",
                  }}
                >
                  <input
                    type="number"
                    value={form.discount}
                    onChange={(e) => setF("discount", e.target.value)}
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
                  minWidth: 0,
                }}
              >
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 115px 105px",
                    gap: 10,
                    alignItems: "end",
                  }}
                >
                  <Input
                    label="Tax Name"
                    value={form.taxName}
                    onChange={(e: any) => setF("taxName", e.target.value)}
                  />

                  <Input
                    label={`Tax (%)`}
                    type="number"
                    value={form.taxAmount}
                    onChange={(e: any) => setF("taxAmount", e.target.value)}
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
                            if (defaultTaxAmount) setF("taxAmount", defaultTaxAmount);
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
            </div>

            {/* Balance */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: 16,
                marginBottom: 18,
              }}
            >
              <Input
                label={`Advance Paid ${originalReservation?.status === "draft" ? "" : "(Read-only)"}`}
                type="number"
                value={form.advancePaid}
                onChange={(e: any) => setF("advancePaid", e.target.value)}
                readOnly={originalReservation?.status !== "draft"}
              />

              <Input
                label={`Advance Payment Date ${originalReservation?.status === "draft" ? "" : "(Read-only)"}`}
                type="date"
                value={form.paymentDate}
                onChange={(e: any) => setF("paymentDate", e.target.value)}
                readOnly={originalReservation?.status !== "draft"}
              />

              <Input
                label="Remaining Balance"
                value={Math.max(0, balance).toFixed(2)}
                readOnly
              />
            </div>

            {/* Payment */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: 16,
              }}
            >
              <Select2
                label="Payment Method"
                value={form.method}
                onChange={(v: string) => setF("method", v)}
                options={[
                  { label: "Cash", value: "cash" },
                  { label: "Card", value: "card" },
                  { label: "Bank Transfer", value: "bank" },
                  { label: "Other", value: "other" },
                ]}
              />

              {(form.method === "bank" || form.method === "card") && (
                <Select2
                  label="Select Bank"
                  value={form.bankId}
                  onChange={(v: string) => setF("bankId", v)}
                  options={apiBanks.map((b: any) => ({
                    label: `${b.bankName} — ${b.accountTitle}`,
                    value: String(b.id),
                  }))}
                  placeholder="Choose bank..."
                />
              )}

              {(form.method === "bank" || form.method === "card") && (
                <Input
                  label="Transaction ID"
                  value={form.transactionId}
                  onChange={(e: any) => setF("transactionId", e.target.value)}
                  placeholder="TXN123456"
                />
              )}

              <div>
                <Label>Payment Proof</Label>
                <div style={{ position: "relative", width: "100%", height: 42, background: T.bgInput, border: `1px dashed ${T.primary}`, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", cursor: "pointer" }}>
                  {paymentProofPreview ? (
                    <>
                      <img src={paymentProofPreview} alt="Proof" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", opacity: 0, transition: "opacity 0.2s" }} onMouseEnter={(e) => e.currentTarget.style.opacity = "1"} onMouseLeave={(e) => e.currentTarget.style.opacity = "0"}>
                        <span style={{ color: "#fff", fontSize: 12, fontWeight: 600 }}>Change</span>
                      </div>
                    </>
                  ) : (
                    <div style={{ display: "flex", alignItems: "center", gap: 8, color: T.primary }}>
                      <Paperclip size={16} />
                      <span style={{ fontSize: 13, fontWeight: 600 }}>Upload Proof</span>
                    </div>
                  )}
                  <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, "Proof")} style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", opacity: 0, cursor: "pointer" }} />
                </div>
              </div>
            </div>
          </Card>
        </div>

        <div style={{ width: 292, flexShrink: 0, padding: "20px 24px 20px 0", position: "sticky", top: 57, maxHeight: "calc(100vh - 57px)", overflowY: "auto" }}>
          <div style={{ background: T.sidebarBg, borderRadius: 14, overflow: "hidden", marginBottom: 14 }}>
            <div style={{ background: "linear-gradient(135deg, #1D4ED8, #1E40AF)", padding: "18px 18px 14px" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#93C5FD", textTransform: "uppercase" }}>Booking Summary</div>
              <div style={{ fontSize: 26, fontWeight: 800, color: "#fff", marginTop: 6, lineHeight: 1 }}>{fmt(grandTotal)}</div>
              <div style={{ fontSize: 11, color: "#BFDBFE", marginTop: 4 }}>Grand Total</div>
            </div>
            <div style={{ padding: "14px 18px" }}>
              {[["Room Total", fmt(roomTotal), T.sidebarText], ["Extras", fmt(extrasTotal), "#38BDF8"], [`Room Tax (${form.taxAmount}%)`, fmt(taxVal), "#38BDF8"], ["POS Tax", fmt(posTaxTotal), "#38BDF8"], ["Discount", `−${fmt(discVal)}`, "#FCD34D"], ["Grand Total", fmt(grandTotal), "#D4A017"], ["Advance Paid", fmt(parseFloat(form.advancePaid) || 0), "#4ADE80"], ["Balance Due", fmt(Math.max(0, balance)), balance > 0 ? "#F87171" : "#4ADE80"]].map(([l, v, c]) => (
                <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: `1px solid ${T.sidebarBorder}` }}><span style={{ color: T.sidebarMuted, fontSize: 12 }}>{l}</span><span style={{ color: c as string, fontWeight: 600, fontSize: 12 }}>{v}</span></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
