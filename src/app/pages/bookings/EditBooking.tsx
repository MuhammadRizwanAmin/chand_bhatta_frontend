import { useState, useEffect } from "react";

// ─── Mock / Static Data ───────────────────────────────────────────────────────
const agentsList = [
  { label: "Travel Pro Agency", value: 1 },
  { label: "Holiday Masters", value: 2 },
];

const banksList = [
  { id: 1, bankName: "HBL", accountTitle: "Hotel Account" },
  { id: 2, bankName: "Meezan Bank", accountTitle: "Hotel Account" },
];

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

// ─── Design tokens ────────────────────────────────────────────────────────────
const T = {
  bg: "#FFFFFF",
  bgPage: "#F8FAFC",
  bgInput: "#FFFFFF",
  bgCard: "#FFFFFF",
  border: "#E2E8F0",
  borderFocus: "#1D4ED8",
  text: "#0F172A",
  textMuted: "#64748B",
  textLight: "#94A3B8",
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
  sidebarMuted: "#94A3B8",
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

const Label = ({ children }: any) => (
  <div style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>{children}</div>
);

const inputBase = {
  width: "100%", background: T.bgInput, border: `1px solid ${T.border}`,
  borderRadius: 8, padding: "10px 13px", color: T.text,
  fontSize: 13, outline: "none", boxSizing: "border-box" as any,
  transition: "border-color 0.15s",
};

const Input = ({ label, type = "text", value, onChange, placeholder = "", readOnly = false, error = "" }: any) => (
  <div>
    <Label>{label}</Label>
    <input
      type={type} value={value} onChange={onChange} placeholder={placeholder} readOnly={readOnly}
      style={{ ...inputBase, background: readOnly ? T.bgPage : T.bgInput, color: readOnly ? T.textMuted : T.text, cursor: readOnly ? "not-allowed" : "text", border: `1px solid ${error ? T.danger : T.border}` }}
    />
    {error && <div style={{ color: T.danger, fontSize: 11, marginTop: 4 }}>{error}</div>}
  </div>
);

const Select2 = ({ label, value, onChange, options, placeholder = "Select...", error = "" }: any) => (
  <div>
    <Label>{label}</Label>
    <select value={value} onChange={(e) => onChange(e.target.value)}
      style={{ ...inputBase, appearance: "none" as any, cursor: "pointer", color: value ? T.text : T.textMuted, border: `1px solid ${error ? T.danger : T.border}`,
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
  const [errors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    customerCNIC: "", customerName: "", customerEmail: "",
    customerPhone: [""], customerAddress: "",
    maleGuests: "", femaleGuests: "", childrenGuests: "",
    purposeOfStay: "", channel: "", agent: "", referal: "",
    startDate: today, startTime: "12:00", endDate: "", endTime: "11:59",
    discount: "", discountType: "percentage", taxName: "GST", taxAmount: "0",
    advancePaid: "", method: "cash", bankId: "", transactionId: "", note: "", resNotes: "", paymentDate: today,
  });

  const setF = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }));

  const [apiRoomTypes, setApiRoomTypes] = useState<any[]>([]);
  const [apiFloors, setApiFloors] = useState<any[]>([]);
  const [availableRooms, setAvailableRooms] = useState<any[]>([]);
  const [refno, setRefno] = useState<string>('Generating...');

  // Fetch auto-generated refno on mount
  useEffect(() => {
    import('../../services/api').then(({ default: api }) => {
      api.get('/reservation/newnumber/get')
        .then(res => setRefno(res.data.refno || 'N/A'))
        .catch(() => setRefno('REF-ERR'));
    });
  }, []);

  useEffect(() => {
    const initData = async () => {
      try {
        const { roomTypeService } = await import('../../services/roomTypeService');
        const { floorService } = await import('../../services/floorService');
        const [rt, fl] = await Promise.all([
          roomTypeService.getAll(),
          floorService.getFloors()
        ]);
        setApiRoomTypes(rt.map((r: any) => ({ label: r.name, value: r.id })));
        setApiFloors(fl.map((f: any) => ({ label: f.name || f.floorName || `Floor ${f.id}`, value: f.id })));
      } catch (err) {
        console.error(err);
      }
    };
    initData();
  }, []);

  useEffect(() => {
    const fetchRooms = async () => {
      if (!form.startDate || !form.endDate || !selectedRoomType) {
        setAvailableRooms([]);
        return;
      }
      try {
        const { assignedRoomService } = await import('../../services/assignedRoomService');
        let rooms = [];
        if (fetchMode === 'roomType') {
          rooms = await assignedRoomService.getAvailableRoomsByRoomType(Number(selectedRoomType), form.startDate, form.endDate);
        } else {
          rooms = await assignedRoomService.getAvailableRoomsByFloor(Number(selectedRoomType), form.startDate, form.endDate);
        }
        setAvailableRooms(rooms.map((r: any) => ({
          id: r.id,
          roomNo: r.roomNo,
          floor: r.floor?.floorName || r.floor?.name || `Floor ${r.floorId}`,
          beds: 1, // placeholder if not populated
          capacity: r.RoomType?.capacity || 2,
          roomTypeId: r.roomTypeId,
          roomTypeName: r.RoomType?.name || 'Unknown Type',
          rate: r.RoomType?.price || 0,
          status: r.status
        })));
      } catch (err) {
        console.error(err);
        setAvailableRooms([]);
      }
    };
    fetchRooms();
  }, [fetchMode, selectedRoomType, form.startDate, form.endDate]);

  const toggleRoom = (room: any) => {
    setSelectedRooms(prev => {
      const exists = prev.some(r => r.id === room.id);
      const next = exists ? prev.filter(r => r.id !== room.id) : [...prev, room];
      if (!exists && roomTypeRates[room.roomTypeId] === undefined)
        setRoomTypeRates(rr => ({ ...rr, [room.roomTypeId]: room.rate }));
      return next;
    });
  };

  const days = calcDays(form.startDate, form.endDate);
  const roomTotal = selectedRooms.reduce((s, r) => s + (roomTypeRates[r.roomTypeId] ?? r.rate) * days, 0);
  const taxVal = roomTotal * (parseFloat(form.taxAmount) / 100 || 0);
  const amountWithTax = roomTotal + taxVal;
  const discVal = form.discountType === "percentage"
    ? amountWithTax * (parseFloat(form.discount) / 100 || 0)
    : parseFloat(form.discount) || 0;
  const grandTotal = Math.max(0, amountWithTax - discVal);
  const balance = grandTotal - (parseFloat(form.advancePaid) || 0);
  const uniqueTypeIds = [...new Set(selectedRooms.map(r => r.roomTypeId))];

  const statusDot: Record<string, string> = { dirty: T.warning, maintenance: T.danger, available: T.success };

  const handleSave = async (status: string) => {
    if (selectedRooms.length === 0 && status !== 'draft') {
      alert("Please select at least one room.");
      return;
    }
    setSubmitting(true);
    try {
      const { reservationService } = await import('../../services/reservationService');
      
      const assignedRoomIds = selectedRooms.map(r => ({
        id: r.id,
        startDate: form.startDate,
        endDate: form.endDate,
        pricePerDay: roomTypeRates[r.roomTypeId] ?? r.rate
      }));

      const payload = {
        ...form,
        refno,
        status,
        customerPhone: form.customerPhone.join(","),
        assignedRoomIds,
        totalAmount: grandTotal,
        balanceAmount: balance,
        roomRent: roomTotal,
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

      await reservationService.create(payload);
      alert("Reservation created successfully!");
    } catch (error) {
      console.error(error);
      alert("Failed to create reservation.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ background: T.bgPage, minHeight: "100vh", fontFamily: "'Inter', system-ui, sans-serif", color: T.text }}>

      {/* ── Sticky Header ── */}
      <div style={{ background: T.bg, borderBottom: `1px solid ${T.border}`, padding: "14px 28px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 100, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <button style={{ background: T.bgPage, border: `1px solid ${T.border}`, borderRadius: 8, color: T.textMuted, padding: "7px 14px", cursor: "pointer", fontSize: 13, fontWeight: 500 }}>← Back</button>
          <div>
            <div style={{ fontWeight: 800, fontSize: 17, color: T.text }}>main</div>
            <div style={{ fontSize: 12, color: T.textMuted }}>Home / Reservations / New</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => handleSave('draft')} disabled={submitting} style={{ background: T.warningLight, border: `1px solid #FCD34D`, borderRadius: 8, color: T.warning, padding: "8px 18px", cursor: "pointer", fontWeight: 600, fontSize: 13 }}>💾 Draft</button>
          <button onClick={() => handleSave('reserved')} disabled={submitting} style={{ background: T.primaryLight, border: `1px solid ${T.primaryMid}`, borderRadius: 8, color: T.primary, padding: "8px 18px", cursor: "pointer", fontWeight: 600, fontSize: 13 }}>← Save & Back</button>
          <button onClick={() => handleSave('reserved')} disabled={submitting} style={{ background: T.primary, border: "none", borderRadius: 8, color: "#fff", padding: "8px 20px", cursor: "pointer", fontWeight: 700, fontSize: 13, boxShadow: "0 2px 8px #1D4ED840" }}>{submitting ? "Saving..." : "Save & Add New +"}</button>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "flex-start" }}>

        {/* ── Main Form ── */}
        <div style={{ flex: 1, padding: "20px 24px 80px 28px", minWidth: 0 }}>

          {/* 1. Customer Info */}
          <SectionHeader step="1" title="Customer Information" subtitle="Primary guest details & identification" color="#1D4ED8" />
          <Card>
            <Grid cols={3}>
              <Input label="CNIC / Passport" value={form.customerCNIC} onChange={(e: any) => setF("customerCNIC", e.target.value)} placeholder="35202-1234567-1" error={errors.customerCNIC} />
              <Input label="Full Name" value={form.customerName} onChange={(e: any) => setF("customerName", e.target.value)} placeholder="Ahmad Raza" error={errors.customerName} />
              <Input label="Email Address" type="email" value={form.customerEmail} onChange={(e: any) => setF("customerEmail", e.target.value)} placeholder="ahmad@email.com" />
            </Grid>
            <div style={{ height: 14 }} />
            <Grid cols={3}>
              <div>
                <Label>Phone Number(s)</Label>
                {form.customerPhone.map((ph, i) => (
                  <div key={i} style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                    <input type="text" value={ph}
                      onChange={e => { const a = [...form.customerPhone]; a[i] = e.target.value; setF("customerPhone", a); }}
                      placeholder={`Phone ${i + 1}`} style={{ ...inputBase, flex: 1 }} />
                    {form.customerPhone.length > 1 && (
                      <button onClick={() => setF("customerPhone", form.customerPhone.filter((_, j) => j !== i))}
                        style={{ background: T.dangerLight, border: `1px solid #FECACA`, borderRadius: 8, color: T.danger, padding: "0 10px", cursor: "pointer", fontSize: 13 }}>✕</button>
                    )}
                  </div>
                ))}
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
              {[["CNIC Front Image", "Front"], ["CNIC Back Image", "Back"]].map(([lbl, side]) => (
                <div key={side}>
                  <Label>{lbl}</Label>
                  <label style={{ display: "flex", alignItems: "center", gap: 12, background: T.bgPage, border: `1px dashed ${T.border}`, borderRadius: 8, padding: "13px 16px", cursor: "pointer" }}>
                    <div style={{ width: 36, height: 36, borderRadius: 8, background: T.primaryLight, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>📎</div>
                    <div>
                      <div style={{ color: T.text, fontSize: 13, fontWeight: 500 }}>Upload {side} Side</div>
                      <div style={{ color: T.textLight, fontSize: 11 }}>JPG, PNG · max 5MB</div>
                    </div>
                    <input type="file" accept="image/*" style={{ display: "none" }} />
                  </label>
                </div>
              ))}
            </Grid>
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
          <SectionHeader step="3" title="Stay & Booking Details" subtitle="Dates, channel and purpose of visit" color="#059669" />
          <Card>
            <Grid cols={2}>
              <div>
                <Label>Check-in Date & Time</Label>
                <div style={{ display: "flex", gap: 8 }}>
                  <input type="date" value={form.startDate} onChange={e => setF("startDate", e.target.value)} style={{ ...inputBase, flex: 2 }} />
                  <input type="time" value={form.startTime} onChange={e => setF("startTime", e.target.value)} style={{ ...inputBase, flex: 1 }} />
                </div>
              </div>
              <div>
                <Label>Check-out Date & Time</Label>
                <div style={{ display: "flex", gap: 8 }}>
                  <input type="date" value={form.endDate} onChange={e => setF("endDate", e.target.value)} min={form.startDate} style={{ ...inputBase, flex: 2 }} />
                  <input type="time" value={form.endTime} onChange={e => setF("endTime", e.target.value)} style={{ ...inputBase, flex: 1 }} />
                </div>
                {errors.endDate && <div style={{ color: T.danger, fontSize: 11, marginTop: 4 }}>{errors.endDate}</div>}
              </div>
            </Grid>
            <div style={{ height: 14 }} />
            <Grid cols={3}>
              <Select2 label="Booking Channel" value={form.channel} onChange={(v: string) => setF("channel", v)} options={channelOptions} placeholder="Select channel..." error={errors.channel} />
              {form.channel === "agent" && <Select2 label="Select Agent" value={form.agent} onChange={(v: string) => setF("agent", v)} options={agentsList} placeholder="Choose agent..." />}
              {form.channel === "refernce" && <Input label="Reference Name" value={form.referal} onChange={(e: any) => setF("referal", e.target.value)} placeholder="Referred by..." />}
              <Input label="Purpose of Stay" value={form.purposeOfStay} onChange={(e: any) => setF("purposeOfStay", e.target.value)} placeholder="Business / Leisure" />
            </Grid>
          </Card>

          {/* 4. Room Selection */}
          <SectionHeader step="4" title="Room Selection" subtitle="Choose room type and assign rooms" color="#B45309" />
          <Card>
            {/* Mode toggle */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 18 }}>
              <span style={{ color: T.textMuted, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>Fetch by:</span>
              {(["roomType", "floor"] as const).map(m => (
                <button key={m} onClick={() => { setFetchMode(m); setSelectedRoomType(""); setSelectedRooms([]); }}
                  style={{
                    background: fetchMode === m ? T.primary : T.bgPage, border: `1px solid ${fetchMode === m ? T.primary : T.border}`,
                    borderRadius: 20, color: fetchMode === m ? "#fff" : T.textMuted,
                    padding: "5px 14px", cursor: "pointer", fontWeight: 600, fontSize: 12, transition: "all 0.15s"
                  }}>
                  {m === "roomType" ? "🏷 Room Type" : "🏢 Floor"}
                </button>
              ))}
            </div>

            <Grid cols={3}>
              <div style={{ gridColumn: "span 2" }}>
                <Select2
                  label={fetchMode === "roomType" ? "Select Room Type" : "Select Floor"}
                  value={selectedRoomType} onChange={(v: string) => { setSelectedRoomType(v); setSelectedRooms([]); }}
                  options={fetchMode === "roomType" ? apiRoomTypes : apiFloors}
                  placeholder={fetchMode === "roomType" ? "Choose room type..." : "Choose floor..."}
                  error={errors.roomType}
                />
              </div>
              <Input label="Search by Room No." placeholder="e.g. 301" onChange={() => {}} />
            </Grid>

            {/* Available rooms grid */}
            {selectedRoomType && (
              <div style={{ marginTop: 20 }}>
                <div style={{ fontSize: 12, color: T.textMuted, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 12 }}>
                  Available Rooms ({availableRooms.length})
                </div>
                {errors.room && <div style={{ color: T.danger, fontSize: 12, marginBottom: 10 }}>⚠ {errors.room}</div>}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))", gap: 10 }}>
                  {availableRooms.map(room => {
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
                        <div style={{ fontSize: 11, color: isSelected ? "#BFDBFE" : T.textMuted }}>🛏 {room.beds} · 👤 {room.capacity}</div>
                        {isSelected && <div style={{ marginTop: 6, background: "#ffffff33", borderRadius: 4, fontSize: 11, fontWeight: 700, color: "#fff", padding: "2px 6px" }}>✓ Selected</div>}
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

          {/* 5. Notes */}
          <SectionHeader step="5" title="Additional Notes" subtitle="Internal office record only" color="#475569" />
          <Card>
            <Textarea2 label="Special Notes / Instructions" value={form.resNotes} onChange={(e: any) => setF("resNotes", e.target.value)} placeholder="VIP guest, preferred floor 3, extra towels..." rows={3} />
          </Card>

          {/* 6. Billing */}
          <SectionHeader step="6" title="Billing Summary" subtitle="Taxes, discounts and advance payment" color="#DB2777" />
          <Card>
            {/* Readonly totals */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 18 }}>
              {[
                ["Room Total", fmt(roomTotal), T.text],
                ["Grand Total", fmt(grandTotal), T.primary],
                ["Balance Due", fmt(Math.max(0, balance)), balance > 0 ? T.danger : T.success],
              ].map(([l, v, c]) => (
                <div key={l as string} style={{ background: T.bgPage, borderRadius: 8, padding: "12px 14px", border: `1px solid ${T.border}` }}>
                  <div style={{ fontSize: 11, color: T.textMuted, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>{l as string}</div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: c as string }}>{v as string}</div>
                </div>
              ))}
            </div>
            <Grid cols={2}>
              <div>
                <Label>Discount</Label>
                <div style={{ display: "flex", gap: 8 }}>
                  <input type="number" value={form.discount} onChange={e => setF("discount", e.target.value)} min="0" max="100" placeholder="0" style={{ ...inputBase, flex: 1 }} />
                  <select value={form.discountType} onChange={e => setF("discountType", e.target.value)}
                    style={{ ...inputBase, width: "auto", paddingRight: 10 }}>
                    <option value="percentage">%</option>
                    <option value="fixed">Fixed</option>
                  </select>
                </div>
              </div>
              <Grid cols={2}>
                <Input label="Tax Name" value={form.taxName} onChange={(e: any) => setF("taxName", e.target.value)} placeholder="GST" />
                <Input label="Tax (%)" value={form.taxAmount} onChange={(e: any) => setF("taxAmount", e.target.value)} placeholder="0" />
              </Grid>
            </Grid>
            <div style={{ height: 14 }} />
            <Grid cols={3}>
              <Input label="Advance Paid" type="number" value={form.advancePaid} onChange={(e: any) => setF("advancePaid", e.target.value)} placeholder="0.00" />
              <Input label="Advance Payment Date" type="date" value={form.paymentDate} onChange={(e: any) => setF("paymentDate", e.target.value)} />
              <Input label="Remaining Balance" value={`${Math.max(0, balance).toFixed(0)}`} readOnly />
            </Grid>
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
                  options={banksList.map(b => ({ label: `${b.bankName} — ${b.accountTitle}`, value: String(b.id) }))} placeholder="Choose bank..." />
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
                <label style={{ display: "flex", alignItems: "center", gap: 12, background: T.bgPage, border: `1px dashed ${T.border}`, borderRadius: 8, padding: "16px", cursor: "pointer" }}>
                  <div style={{ width: 40, height: 40, borderRadius: 8, background: T.primaryLight, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>📷</div>
                  <div>
                    <div style={{ color: T.text, fontSize: 13, fontWeight: 500 }}>Upload Screenshot</div>
                    <div style={{ color: T.textLight, fontSize: 11 }}>JPG, PNG — proof of payment</div>
                  </div>
                  <input type="file" accept="image/*" style={{ display: "none" }} />
                </label>
              </div>
            </Grid>
          </Card>

          {/* Bottom actions */}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 28 }}>
            <button style={{ background: T.dangerLight, border: `1px solid #FECACA`, borderRadius: 8, color: T.danger, padding: "10px 20px", cursor: "pointer", fontWeight: 600, fontSize: 13 }}>✕ Discard</button>
            <button onClick={() => handleSave('draft')} disabled={submitting} style={{ background: T.warningLight, border: `1px solid #FCD34D`, borderRadius: 8, color: T.warning, padding: "10px 20px", cursor: "pointer", fontWeight: 600, fontSize: 13 }}>💾 Draft</button>
            <button onClick={() => handleSave('reserved')} disabled={submitting} style={{ background: T.primaryLight, border: `1px solid ${T.primaryMid}`, borderRadius: 8, color: T.primary, padding: "10px 20px", cursor: "pointer", fontWeight: 600, fontSize: 13 }}>← Save & Back</button>
            <button onClick={() => handleSave('reserved')} disabled={submitting} style={{ background: T.primary, border: "none", borderRadius: 8, color: "#fff", padding: "10px 24px", cursor: "pointer", fontWeight: 700, fontSize: 13, boxShadow: "0 2px 8px #1D4ED830" }}>{submitting ? "Saving..." : "Save & Add New +"}</button>
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
    </div>
    </div>
  );
}