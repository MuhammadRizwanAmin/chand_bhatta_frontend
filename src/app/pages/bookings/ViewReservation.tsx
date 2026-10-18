//@ts-nocheck
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import api from "../../services/api";
import {
  Home, CreditCard, BedDouble, ShoppingCart, Car, MessageCircle,
  Pencil, LogOut, Receipt, Banknote, Wallet, Building2, User,
  Users, ClipboardList, Baby, FileText, Bed, ArrowLeft, Phone, Mail, AlertCircle,
  CalendarDays, Clock3, Hash, ShieldCheck, Image as ImageIcon, Search, X
} from "lucide-react";
import { PaymentModal } from "./PaymentModal";
import { PosPaymentModal } from "./PosPaymentModal";
import { CheckoutModal } from "./CheckoutModal";
import { InvoiceModal } from "../../components/InvoiceModal";
import { ExtrasModal } from "./ExtrasModal";
import { usePermissions } from "../../hooks/usePermissions";
import { toast } from "sonner";
import RegistrationCardTemplate from "./RegistrationCardTemplate";
import ReservationFormTemplate from "./ReservationFormTemplate";
import { pdf } from "@react-pdf/renderer";
import localLogo from "../../../../logo.png";

// ─── Type Definitions ────────────────────────────────────────────
interface Customer {
  name: string;
  email: string;
  phone: string;
  address: string;
  cnic: string;
}

interface Room {
  id: number;
  roomNo: string;
  Floor?: { floorName: string };
  RoomType?: { name: string };
  ReservationRoom?: {
    startDate: string;
    endDate: string;
    pricePerDay: number;
    status: string;
  };
}

interface Payment {
  id: number;
  method: string;
  amount: number;
  date: string;
  status: string;
  note?: string;
  proofImage?: string;
  isAdvance?: boolean;
}

interface Extra {
  id: number;
  name: string;
  sellPrice: number;
  description?: string;
  ReservationExtra?: { quantity: number; totalPrice: number; createdAt: string };
}

interface Trip {
  id: number;
  startTime: string;
  amount: number;
  purpose?: string;
  status: string;
  billingType?: string;
  vehicle?: { name: string; plateNumber: string };
}

interface Reservation {
  id: number | string;
  refno?: string | number;
  customer: Customer;
  status: string;
  startDate: string;
  endDate: string;
  startTime?: string;
  endTime?: string;
  rentalType: string;
  roomSpace: string;
  numOfSeats: number;
  purposeOfStay: string;
  channel?: string;
  resNotes?: string;
  complimentary?: any;
  discount?: number;
  discountType?: string;
  taxAmount?: number;
  isTaxInclusive?: boolean;
  advancePaid: number;
  balanceAmount: number;
  waivedAmount?: number;
  rooms: Room[];
  payments: Payment[];
  extras: Extra[];
  customExtras?: any[];
  trips?: Trip[];
  guests?: any;
  createdAt: string;
  checkoutPerson?: string;
  group?: { name: string; billingCycle: string; creditLimit: number };
  Agent?: { fullName: string; phone?: string; email?: string };
  cnicFront?: string;
  cnicBack?: string;
  documentPath?: string;
  refundExpense?: {
    description?: string;
    price: number;
    date_for?: string;
    payment_type?: string;
  };
}

// Mock data removed — data is now fetched from the API

// ─── Helpers ──────────────────────────────────────────────────────

const UI = {
  bg: "#F8FAFC",
  card: "#FFFFFF",
  border: "#E2E8F0",
  borderSoft: "#EEF2F7",
  text: "#0F172A",
  muted: "#475569",
  light: "#64748B",
  primary: "#1D4ED8",
  primaryDark: "#1E3A8A",
  primaryLight: "#EFF6FF",
  gold: "#B45309",
  goldLight: "#FFFBEB",
  success: "#059669",
  danger: "#DC2626",
  warning: "#D97706",
};
const fmt = (n: number) =>
  new Intl.NumberFormat("en-PK", { style: "currency", currency: "PKR", minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(n);

const fmtDate = (s?: string) => {
  if (!s) return "N/A";
  return new Date(s).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};

// Format HH:MM:SS → 12-hour AM/PM
const fmtTime = (t?: string) => {
  if (!t) return "—";
  // t can be "HH:MM:SS" or "HH:MM"
  const [h, m] = t.split(":").map(Number);
  if (isNaN(h)) return t;
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m).padStart(2, "0")} ${period}`;
};

const calcDays = (s?: string, e?: string) => {
  if (!s || !e) return 1;
  const diff = new Date(e).getTime() - new Date(s).getTime();
  return Math.max(1, Math.ceil(diff / 86400000));
};

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  checked_in: { label: "Checked In", color: "#065f46", bg: "#d1fae5", dot: "#059669" },
  checked_out: { label: "Checked Out", color: "#1e40af", bg: "#dbeafe", dot: "#3b82f6" },
  pending: { label: "Pending", color: "#92400e", bg: "#fef3c7", dot: "#f59e0b" },
  cancelled: { label: "Cancelled", color: "#991b1b", bg: "#fee2e2", dot: "#ef4444" },
  overdue: { label: "Overdue", color: "#7c2d12", bg: "#ffedd5", dot: "#f97316" },
};

// ─── Sub-Components ───────────────────────────────────────────────
const StatusBadge = ({ status }: { status: string }) => {
  const cfg = STATUS_CONFIG[status] || { label: status, color: "#374151", bg: "#f3f4f6", dot: "#6b7280" };
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      padding: "5px 12px", borderRadius: 100,
      background: cfg.bg, color: cfg.color,
      fontSize: 12, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase",
    }}>
      <span style={{ width: 7, height: 7, borderRadius: "50%", background: cfg.dot, flexShrink: 0 }} />
      {cfg.label}
    </span>
  );
};

const InfoRow = ({ label, value, accent }: { label: string; value: React.ReactNode; accent?: string }) => (
  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 14, padding: "10px 0", borderBottom: `1px solid ${UI.borderSoft}` }}>
    <span style={{ fontSize: 13, color: UI.muted, flexShrink: 0, fontWeight: 600 }}>{label}</span>
    <span style={{ fontSize: 13, fontWeight: 700, textAlign: "right", color: accent || UI.text }}>{value || "—"}</span>
  </div>
);

const SummaryCard = ({ label, value, color }: { label: string; value: string; color?: string }) => (
  <div style={{
    background: UI.bg, borderRadius: 12, padding: "13px 14px", border: `1px solid ${UI.border}`,
    display: "flex", flexDirection: "column", gap: 5,
  }}>
    <span style={{ fontSize: 10.5, color: UI.muted, textTransform: "uppercase", letterSpacing: "0.07em", fontWeight: 800 }}>{label}</span>
    <span style={{ fontSize: 17, fontWeight: 900, color: color || UI.text, lineHeight: 1.2 }}>{value}</span>
  </div>
);

const SectionHeading = ({ icon, title }: { icon: React.ReactNode; title: string }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16, paddingBottom: 14, borderBottom: `1px solid ${UI.borderSoft}` }}>
    <div style={{
      width: 34, height: 34, borderRadius: 10, background: UI.primaryLight, display: "flex", alignItems: "center", justifyContent: "center", color: UI.primary
    }}>
      {icon}
    </div>
    <h3 style={{ margin: 0, fontSize: 14, fontWeight: 900, color: UI.text, textTransform: "uppercase", letterSpacing: "0.055em" }}>{title}</h3>
  </div>
);

const Card = ({ children, style }: any) => (
  <div style={{
    background: UI.card, border: `1px solid ${UI.border}`, borderRadius: 18,
    padding: "22px 24px", marginBottom: 20, boxShadow: "0 12px 32px rgba(15, 23, 42, 0.045)", ...style,
  }}>
    {children}
  </div>
);

// ─── Tab Navigation ───────────────────────────────────────────────
const TABS = [
  { key: "overview", label: "Overview", icon: <Home size={16} /> },
  { key: "payments", label: "Payments", icon: <CreditCard size={16} /> },
  { key: "rooms", label: "Rooms", icon: <BedDouble size={16} /> },
  { key: "extras", label: "POS Items", icon: <ShoppingCart size={16} /> },
  { key: "transport", label: "Transport", icon: <Car size={16} /> },
];

// ─── Main Component ───────────────────────────────────────────────
export default function ViewReservation() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  const [r, setR] = useState<Reservation | null>(null);
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isPosPaymentModalOpen, setIsPosPaymentModalOpen] = useState(false);
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [isExtrasModalOpen, setIsExtrasModalOpen] = useState(false);
  const [extrasSearchQuery, setExtrasSearchQuery] = useState("");
  const { canEdit, canDelete, canEditOrDelete } = usePermissions();
  const [isRegCardLoading, setIsRegCardLoading] = useState(false);
  const [locationDetails, setLocationDetails] = useState<any>(null);

  const loadReservation = () => {
    if (!id) return;
    setLoading(true);
    Promise.all([
      api.get(`/reservation/${id}`),
      api.get('/setting'),
      api.get('/locations').catch(() => null)
    ])
      .then(([resRes, setRes, locRes]) => {
        setR(resRes.data);
        const s = setRes.data?.settings;
        setSettings(s);

        const locs = locRes?.data || [];
        const currentLocId = localStorage.getItem('locationId');
        const currentLoc = locs.find((l: any) => String(l.id) === currentLocId) || locs[0];
        if (currentLoc) {
          setLocationDetails({
            name: currentLoc.name || s?.organization_name || "Main Branch",
            address: currentLoc.address || s?.organization_location || "",
            contactPhone: currentLoc.contactPhone || s?.organization_phone || "",
            contactEmail: currentLoc.contactEmail || "",
            logo: currentLoc.logo || null,
          });
        } else if (s) {
          setLocationDetails({
            name: s.organization_name || "Main Branch",
            address: s.organization_location || "",
            contactPhone: s.organization_phone || "",
            contactEmail: "",
            logo: s.organization_logo || s.logo || null,
          });
        }
      })
      .catch(() => setError("Failed to load reservation."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadReservation();
  }, [id]);

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ width: 40, height: 40, border: "3px solid #1D4ED8", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 12px" }} />
        <p style={{ color: "#64748b" }}>Loading reservation...</p>
      </div>
    </div>
  );
// Converts an image URL (relative or absolute) to a base64 data URL for react-pdf
  const toBase64 = (url: string): Promise<string> =>
    fetch(url)
      .then((res) => res.blob())
      .then(
        (blob) =>
          new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          })
      );

  const downloadRegistrationCard = async () => {
    if (!r) {
      toast.error("Reservation data not loaded");
      return;
    }

    try {
      setIsRegCardLoading(true);

      // Resolve the logo to a base64 data URL (required by react-pdf)
      // Prefer settings logo, fall back to local logo.png bundled with the app
      let logoSrc: string = "";
      const rawLogo = locationDetails?.logo || settings?.organization_logo || settings?.logo;
      const logoToLoad = rawLogo || localLogo;
      try {
        const logoUrl = logoToLoad.startsWith("http")
          ? logoToLoad
          : `${window.location.origin}${logoToLoad.startsWith("/") ? "" : "/"}${logoToLoad}`;
        logoSrc = await toBase64(logoUrl);
      } catch {
        // If fetch fails, pass the raw URL as last resort
        logoSrc = localLogo;
      }

      const blob = await pdf(
        <RegistrationCardTemplate
          data={r}
          logo={logoSrc}
          settings={settings}
          location={locationDetails}
        />
      ).toBlob();

      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");

      toast.success("Registration Card opened successfully!");
    } catch (error) {
      console.error("Error generating PDF", error);
      toast.error("Failed to generate Registration Card");
    } finally {
      setIsRegCardLoading(false);
    }
  };

  const downloadReservationForm = async () => {
    if (!r) { toast.error("Reservation data not loaded"); return; }
    try {
      setIsRegCardLoading(true);
      let logoSrc: string = "";
      const rawLogo = locationDetails?.logo || settings?.organization_logo || settings?.logo;
      const logoToLoad = rawLogo || localLogo;
      try {
        const logoUrl = logoToLoad.startsWith("http")
          ? logoToLoad
          : `${window.location.origin}${logoToLoad.startsWith("/") ? "" : "/"}${logoToLoad}`;
        logoSrc = await toBase64(logoUrl);
      } catch {
        logoSrc = localLogo;
      }
      const blob = await pdf(
        <ReservationFormTemplate data={r} logo={logoSrc} settings={settings} location={locationDetails} />
      ).toBlob();
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
      toast.success("Reservation Form opened successfully!");
    } catch (error) {
      console.error("Error generating Reservation Form PDF", error);
      toast.error("Failed to generate Reservation Form");
    } finally {
      setIsRegCardLoading(false);
    }
  };
  if (error || !r) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
      <div style={{ textAlign: "center" }}>
        <p style={{ fontSize: 18, color: "#ef4444", marginBottom: 12, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}><AlertCircle size={20} /> {error || "Reservation not found"}</p>
        <button onClick={() => navigate(-1)} style={{ background: "#1D4ED8", color: "#fff", border: "none", borderRadius: 8, padding: "8px 20px", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6 }}><ArrowLeft size={16} /> Go Back</button>
      </div>
    </div>
  );

  // Calculations
  const roomTotal = (r.reservationRooms && r.reservationRooms.length > 0)
    ? r.reservationRooms.reduce((sum: number, rr: any) => {
        const days = calcDays(rr.startDate || r.startDate, rr.endDate || r.endDate);
        return sum + (Number(rr.pricePerDay) || 0) * days;
      }, 0)
    : r.rooms.reduce((sum, room) => {
        const rr = room.ReservationRoom;
        const days = calcDays(rr?.startDate || r.startDate, rr?.endDate || r.endDate);
        return sum + (Number(rr?.pricePerDay) || 0) * days;
      }, 0);
  const extrasTotal = r.extras.reduce((s, e) => s + Number(e.sellPrice) * (e.ReservationExtra?.quantity || 0), 0);
  const customExtrasTotal = (r.customExtras || []).reduce((s: number, e: any) => s + Number(e.totalPrice), 0);
  const tripsTotal = (r.trips || []).filter(t => t.billingType !== "Pay Now").reduce((s, t) => s + Number(t.amount), 0);
  const taxPct = Number(r.taxAmount) || 0;
  const discPct = Number(r.discount) || 0;
  const isTaxInclusive = Boolean(r.isTaxInclusive);
  const roomTax = isTaxInclusive 
    ? roomTotal - (roomTotal / (1 + taxPct / 100))
    : roomTotal * (taxPct / 100);
  const roomAfterTax = isTaxInclusive ? roomTotal : roomTotal + roomTax;

  const extrasSubtotal = extrasTotal + customExtrasTotal;
  
  let posExplicitTax = Number((r as any).posTaxAmount) || 0;
  
  const discValue = r.discountType === "percentage" ? roomAfterTax * (discPct / 100) : discPct;
  const halfDayAmount = Number(r.halfDayAmount || 0);
  const halfDayChargeName = (r as any).halfDayChargeName || 'Extra Charge';
  const linkedSales = (r as any).sales || [];
  const posSalesTotal = linkedSales.reduce((sum: number, s: any) => sum + Number(s.totalAmount || 0), 0);
  const posItemsTotal = posSalesTotal > 0 ? posSalesTotal : extrasSubtotal;
  const posPaidAmount = linkedSales.reduce((sum: number, s: any) => sum + Number(s.advancePaid || 0), 0);
  const posBalanceAmount = Math.max(0, posItemsTotal - posPaidAmount);
  const posStatus = posItemsTotal === 0
    ? 'none'
    : posBalanceAmount <= 0
      ? 'Paid'
      : posPaidAmount > 0
        ? 'Partial'
        : 'Pending';

  // Only UNPAID POS items (pending balance) add to the reservation room bill
  const unpaidPosItems = posBalanceAmount;
  const unpaidPosTax = posBalanceAmount > 0 ? posExplicitTax : 0;

  const roomPayments = (r.payments || []).filter((p: any) => !p.saleId);
  const roomAdvancePaid = roomPayments.length > 0
    ? roomPayments.reduce((s: number, p: any) => s + Number(p.amount || 0), 0)
    : Math.max(0, Number(r.advancePaid || 0) - posPaidAmount);

  const waivedAmount = Number(r.waivedAmount) || 0;
  const grandTotal = (roomAfterTax - discValue) + halfDayAmount + unpaidPosItems + unpaidPosTax + tripsTotal - waivedAmount;
  const balance = Math.max(0, grandTotal - roomAdvancePaid);
  const days = calcDays(r.startDate, r.endDate);
  const paidPct = Math.min(100, Math.round((roomAdvancePaid / (grandTotal || 1)) * 100));

  return (
    <div style={{
      minHeight: "100vh",
      background: UI.bg,
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      color: UI.text,
    }}>
      {/* ── HEADER ── */}
      <div style={{
        background: "rgba(255,255,255,0.96)",
        padding: "13px 32px",
        position: "sticky", top: 0, zIndex: 80,
        display: "flex", alignItems: "center", justifyContent: "space-between", gap: 18,
        minHeight: 66, borderBottom: `1px solid ${UI.border}`,
        backdropFilter: "blur(14px)",
        boxShadow: "0 8px 24px rgba(15, 23, 42, 0.06)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, minWidth: 0 }}>
          <button type="button" onClick={() => navigate("/bookings")} style={{
            background: UI.card, border: `1px solid ${UI.border}`, borderRadius: 12,
            color: UI.text, padding: "8px 14px", fontSize: 13, fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", gap: 7,
            boxShadow: "0 1px 2px rgba(15,23,42,0.04)",
          }}>
            <ArrowLeft size={15} /> Back
          </button>

          <div style={{ width: 1, height: 36, background: UI.border }} />

          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 18, color: UI.text, fontWeight: 900, letterSpacing: "-0.02em", whiteSpace: "nowrap" }}>
              Reservation Details
            </div>
            <div style={{ fontSize: 12, color: UI.muted, marginTop: 2, fontWeight: 700 }}>
              Home / Reservations / {String(r.refno || r.id)}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "flex-end", gap: 8 }}>
          {/* <button type="button" style={{
            background: "#ECFDF5", border: "1px solid #A7F3D0", borderRadius: 10,
            color: "#047857", padding: "8px 14px", fontSize: 12, fontWeight: 800, cursor: "pointer",
            display: "flex", alignItems: "center", gap: 6
          }}><MessageCircle size={14} /> WhatsApp</button> */}
           {canEdit && r.status !== "checked_out" && (
          <button type="button" onClick={() => navigate(`/booking/${id}/edit`)} style={{
            background: UI.primaryLight, border: "1px solid #BFDBFE", borderRadius: 10,
            color: UI.primary, padding: "8px 14px", fontSize: 12, fontWeight: 800, cursor: "pointer",
            display: "flex", alignItems: "center", gap: 6
          }}><Pencil size={14} /> Edit</button>
        )}
          {r.status !== "checked_out" && (
          <button type="button" onClick={() => {
            const hasGroupBilling = !!(r as any).groupId;
            // Always block checkout if balance is outstanding (unless group billing)
            if (!hasGroupBilling && balance > 0) {
              toast.warning(`⚠️ Pending balance of PKR ${balance.toLocaleString()} must be cleared before checkout! Please add payment first.`, {
                duration: 5000,
              });
              return;
            }
            setIsCheckoutModalOpen(true);
          }} style={{
            background: UI.goldLight, border: "1px solid #FDE68A", borderRadius: 10,
            color: UI.gold, padding: "8px 14px", fontSize: 12, fontWeight: 800, cursor: "pointer",
            display: "flex", alignItems: "center", gap: 6
          }}><LogOut size={14} /> Checkout</button>
          )}
          <button type="button" onClick={() => setIsInvoiceModalOpen(true)} style={{
            background: "#F8FAFC", border: `1px solid ${UI.border}`, borderRadius: 10,
            color: UI.text, padding: "8px 14px", fontSize: 12, fontWeight: 800, cursor: "pointer",
            display: "flex", alignItems: "center", gap: 6
          }}><Receipt size={14} /> Invoice</button>
          <button type="button"
            onClick={downloadRegistrationCard}
            disabled={isRegCardLoading}
            style={{
            background: "#F8FAFC", border: `1px solid ${UI.border}`, borderRadius: 10,
            color: UI.text, padding: "8px 14px", fontSize: 12, fontWeight: 800, cursor: "pointer",
            display: "flex", alignItems: "center", gap: 6
          }}
          >
            <Receipt size={14} />
            <span> {isRegCardLoading ? "..." : " Reg Card"}</span>
          </button>
          <button type="button"
            onClick={downloadReservationForm}
            disabled={isRegCardLoading}
            style={{
            background: "#F8FAFC", border: `1px solid ${UI.border}`, borderRadius: 10,
            color: UI.text, padding: "8px 14px", fontSize: 12, fontWeight: 800, cursor: "pointer",
            display: "flex", alignItems: "center", gap: 6
          }}
          >
            <FileText size={14} />
            <span>{isRegCardLoading ? "..." : "Res Form"}</span>
          </button>
          <button type="button" onClick={() => setIsPaymentModalOpen(true)} style={{
            background: `linear-gradient(135deg, ${UI.primary} 0%, ${UI.primaryDark} 100%)`, border: "none", borderRadius: 10,
            color: "#fff", padding: "8px 15px", fontSize: 12, fontWeight: 900, cursor: "pointer",
            display: "flex", alignItems: "center", gap: 6, boxShadow: "0 8px 18px rgba(29,78,216,0.22)"
          }}><Banknote size={14} /> Add Payment</button>
        </div>
      </div>

      {/* ── PROFESSIONAL SUMMARY STRIP ── */}
      <div style={{ padding: "28px 32px 0" }}>
        <div style={{
          maxWidth: 1400, margin: "0 auto", background: UI.card, border: `1px solid ${UI.border}`, borderRadius: 22,
          padding: 24, boxShadow: "0 18px 45px rgba(15,23,42,0.06)", overflow: "hidden", position: "relative"
        }}>
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 4, background: `linear-gradient(90deg, ${UI.primary}, #F59E0B)` }} />

          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 24, flexWrap: "wrap" }}>
            {/* Guest info */}
            <div style={{ display: "flex", gap: 16, alignItems: "center", minWidth: 280 }}>
              <div style={{
                width: 64, height: 64, borderRadius: 18, background: `linear-gradient(135deg, ${UI.primary} 0%, ${UI.primaryDark} 100%)`,
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: 900, color: "#fff", flexShrink: 0,
                boxShadow: "0 12px 24px rgba(29,78,216,0.22)",
              }}>
                {(r.customer?.name || 'G').split(" ").map((w: string) => w[0]).filter(Boolean).slice(0, 2).join("") || 'G'}
              </div>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                  <h1 style={{ margin: 0, fontSize: 24, fontWeight: 900, color: UI.text, letterSpacing: "-0.03em" }}>{r.customer?.name || 'Unknown Guest'}</h1>
                  <StatusBadge status={r.status} />
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 7, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 12, color: UI.muted, fontWeight: 700, display: "flex", alignItems: "center", gap: 5 }}><Hash size={13} /> {String(r.refno || r.id)}</span>
                  <span style={{ fontSize: 12, color: UI.muted, display: "flex", alignItems: "center", gap: 5 }}><Phone size={13} /> {r.customer?.phone || '—'}</span>
                  <span style={{ fontSize: 12, color: UI.muted, display: "flex", alignItems: "center", gap: 5 }}><Mail size={13} /> {r.customer?.email || '—'}</span>
                </div>
              </div>
            </div>

            {/* Quick stats */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(96px, 1fr))", gap: 10, flex: 1, minWidth: 480 }}>
              {[
                { label: "Check In", value: fmtDate(r.startDate), sub: fmtTime(r.startTime), icon: <CalendarDays size={15} /> },
                { label: "Check Out", value: fmtDate(r.endDate), sub: fmtTime(r.endTime), icon: <CalendarDays size={15} /> },
                { label: "Duration", value: `${days} Night${days > 1 ? "s" : ""}`, sub: undefined, icon: <Clock3 size={15} /> },
                { label: "Rooms", value: String(r.rooms.length), sub: undefined, icon: <BedDouble size={15} /> },
              ].map(stat => (
                <div key={stat.label} style={{
                  background: UI.bg, borderRadius: 14, padding: "12px 13px", border: `1px solid ${UI.border}`,
                  minWidth: 0,
                }}>
                  <div style={{ fontSize: 11, color: UI.muted, textTransform: "uppercase", letterSpacing: "0.07em", fontWeight: 900, display: "flex", alignItems: "center", gap: 6 }}>{stat.icon}{stat.label}</div>
                  <div style={{ fontSize: 14, fontWeight: 900, color: UI.text, marginTop: 7, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{stat.value}</div>
                  {stat.sub && stat.sub !== "—" && (
                    <div style={{ fontSize: 11, fontWeight: 600, color: UI.primary, marginTop: 3, display: "flex", alignItems: "center", gap: 4 }}>
                      <Clock3 size={11} />{stat.sub}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Payment progress bar */}
          <div style={{ marginTop: 22, background: UI.bg, border: `1px solid ${UI.border}`, borderRadius: 16, padding: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 14, marginBottom: 10, flexWrap: "wrap" }}>
              <span style={{ fontSize: 13, color: UI.text, fontWeight: 900, display: "flex", alignItems: "center", gap: 7 }}><ShieldCheck size={15} /> Payment progress — {paidPct}% settled</span>
              <span style={{ fontSize: 13, color: UI.muted, fontWeight: 800 }}>
                {fmt(roomAdvancePaid)} of {fmt(grandTotal)}
              </span>
            </div>
            <div style={{ height: 8, background: "#E2E8F0", borderRadius: 99, overflow: "hidden" }}>
              <div style={{
                height: "100%", width: `${paidPct}%`, borderRadius: 99,
                background: `linear-gradient(90deg, ${UI.primary}, #F59E0B)`,
                transition: "width 0.6s ease",
              }} />
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
              <span style={{ fontSize: 12, color: balance > 0 ? UI.danger : UI.success, fontWeight: 900 }}>
                {balance > 0 ? `Balance due: ${fmt(balance)}` : "Fully paid"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── MAIN LAYOUT ── */}
      <div style={{ display: "flex", gap: 0, maxWidth: 1400, margin: "0 auto", padding: "24px 32px 44px" }}>

        {/* ── LEFT SIDEBAR ── */}
        <div style={{ width: 280, flexShrink: 0, paddingTop: 24, paddingRight: 20 }}>

          {/* Financial Summary */}
          <Card style={{ marginBottom: 16 }}>
            <SectionHeading icon={<Wallet size={18} />} title="Financials" />
            <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              <InfoRow label="Room Total" value={fmt(roomTotal)} />
              <InfoRow label={`Room Tax (${taxPct}%)${r.isTaxInclusive ? ' (Incl.)' : ''}`} value={fmt(roomTax)} accent={UI.muted} />
              <InfoRow label={`Discount (${r.discountType === 'fixed' ? 'Fixed' : `${discPct}%`})`} value={`-${fmt(discValue)}`} accent="#f97316" />
              {halfDayAmount > 0 && <InfoRow label={halfDayChargeName} value={fmt(halfDayAmount)} accent="#b45309" />}
              {posBalanceAmount > 0 ? (
                <InfoRow label="POS Pending Amount" value={fmt(posBalanceAmount)} accent="#dc2626" />
              ) : posPaidAmount > 0 ? (
                <InfoRow label="POS Items" value={`${fmt(posItemsTotal)} (Paid)`} accent="#059669" />
              ) : extrasSubtotal > 0 ? (
                <InfoRow label="POS Items" value={fmt(extrasSubtotal)} />
              ) : null}
              {unpaidPosTax > 0 && <InfoRow label="POS Tax" value={fmt(unpaidPosTax)} accent={UI.muted} />}
              <InfoRow label="Transport" value={fmt(tripsTotal)} />
              {waivedAmount > 0 && <InfoRow label="Waived Amount" value={`-${fmt(waivedAmount)}`} accent={UI.warning} />}
              <div style={{ marginTop: 8, paddingTop: 8, borderTop: `2px solid ${UI.primary}` }}>
                <InfoRow label="Grand Total" value={fmt(grandTotal)} accent={UI.primary} />
                <InfoRow label="Total Paid" value={fmt(roomAdvancePaid)} accent="#059669" />
                <InfoRow label="Balance" value={fmt(balance)} accent={balance > 0 ? "#dc2626" : "#059669"} />
                {Boolean(r.refundedAmount && Number(r.refundedAmount) > 0) && (
                  <InfoRow
                    label="Refund Issued"
                    value={`-${fmt(Number(r.refundedAmount))}`}
                    accent="#dc2626"
                  />
                )}
                {r.refundExpense && !r.refundedAmount && (
                  <InfoRow
                    label="Refund Issued"
                    value={`-${fmt(Number(r.refundExpense.price))}`}
                    accent="#dc2626"
                  />
                )}
              </div>
            </div>
          </Card>

          {/* Group */}
          {r.group && (
            <Card style={{ marginBottom: 16 }}>
              <SectionHeading icon={<Building2 size={18} />} title="Group" />
              <InfoRow label="Group" value={r.group.name} />
              <InfoRow label="Billing" value={r.group.billingCycle} />
              <InfoRow label="Credit Limit" value={fmt(r.group.creditLimit)} />
              <button
                onClick={() => navigate(`/companies/${r.groupId}`)}
                style={{
                  marginTop: 12, width: "100%", padding: "8px", borderRadius: 8,
                  background: "transparent", border: `1px solid ${UI.primary}`,
                  color: UI.primary, fontSize: 13, fontWeight: 600, cursor: "pointer",
                }}>
                View Group Ledger →
              </button>
            </Card>
          )}

          {/* Quick summary grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <SummaryCard label="Nights" value={String(days)} />
            <SummaryCard label="Rooms" value={String(r.rooms.length)} />
            <SummaryCard label="Channel" value={r.channel === "refernce" ? "Reference" : r.channel || "Direct"} />
            <SummaryCard label="Type" value={r.rentalType || "Daily"} />
          </div>

          {/* Documents */}
          {(r.cnicFront || r.cnicBack || r.documentPath) && (
            <Card style={{ marginTop: 16 }}>
              <SectionHeading icon={<FileText size={18} />} title="Documents" />
              {r.cnicFront && (
                <div style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: 12, color: UI.muted, marginBottom: 4 }}>CNIC Front</div>
                  <a href={r.cnicFront} target="_blank" rel="noreferrer">
                    <img src={r.cnicFront} alt="CNIC Front" style={{ width: '100%', borderRadius: 8, border: `1px solid ${UI.border}` }} />
                  </a>
                </div>
              )}
              {r.cnicBack && (
                <div style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: 12, color: UI.muted, marginBottom: 4 }}>CNIC Back</div>
                  <a href={r.cnicBack} target="_blank" rel="noreferrer">
                    <img src={r.cnicBack} alt="CNIC Back" style={{ width: '100%', borderRadius: 8, border: `1px solid ${UI.border}` }} />
                  </a>
                </div>
              )}
              {r.documentPath && (
                <div style={{ marginTop: 4 }}>
                  <div style={{ fontSize: 12, color: UI.muted, marginBottom: 6 }}>Reservation Document</div>
                  {/\.(jpg|jpeg|png|gif|webp)$/i.test(r.documentPath) ? (
                    <a href={r.documentPath} target="_blank" rel="noreferrer">
                      <img src={r.documentPath} alt="Document" style={{ width: '100%', borderRadius: 8, border: `1px solid ${UI.border}` }} />
                    </a>
                  ) : (
                    <a
                      href={r.documentPath}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        background: UI.primaryLight, border: `1px solid #BFDBFE`,
                        borderRadius: 8, padding: '10px 14px', textDecoration: 'none',
                      }}
                    >
                      <FileText size={18} color={UI.primary} />
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: UI.primary }}>View Document</div>
                        <div style={{ fontSize: 11, color: UI.muted }}>Click to open</div>
                      </div>
                    </a>
                  )}
                </div>
              )}
            </Card>
          )}
        </div>

        {/* ── RIGHT CONTENT ── */}
        <div style={{ flex: 1, paddingTop: 24 }}>

          {/* Tab Bar */}
          <div style={{
            display: "flex", gap: 2, background: UI.card,
            border: `1px solid ${UI.border}`, borderRadius: 12, padding: 4, marginBottom: 20,
          }}>
            {TABS.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                style={{
                  flex: 1, padding: "9px 14px", borderRadius: 9, border: "none",
                  background: activeTab === tab.key ? UI.primary : "transparent",
                  color: activeTab === tab.key ? "#fff" : UI.muted,
                  fontSize: 13, fontWeight: 600, cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                  transition: "all 0.15s",
                }}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* ── OVERVIEW TAB ── */}
          {activeTab === "overview" && (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
                {/* Customer */}
                <Card style={{ marginBottom: 0 }}>
                  <SectionHeading icon={<User size={18} />} title="Customer Info" />
                  <InfoRow label="Full Name" value={r.customer?.name || '—'} />
                  <InfoRow label="CNIC" value={r.customer?.cnic || '—'} />
                  <InfoRow label="Phone" value={r.customer?.phone || '—'} />
                  <InfoRow label="Email" value={r.customer?.email || '—'} />
                  <InfoRow label="Address" value={r.customer?.address || '—'} />
                </Card>

                {/* Guests */}
                <Card style={{ marginBottom: 0 }}>
                  <SectionHeading icon={<Users size={18} />} title="Guest Breakdown" />
                  {(() => {
                    const g = typeof r.guests === "string" ? JSON.parse(r.guests) : r.guests;
                    return (
                      <>
                        {[
                          { label: "Males", val: g?.male || 0, icon: <User size={14} /> },
                          { label: "Females", val: g?.female || 0, icon: <User size={14} /> },
                          { label: "Children", val: g?.children || 0, icon: <Baby size={14} /> },
                        ].map(({ label, val, icon }) => (
                          <div key={label} style={{
                            display: "flex", justifyContent: "space-between", alignItems: "center",
                            padding: "10px 0", borderBottom: `1px solid ${UI.border}`,
                          }}>
                            <span style={{ fontSize: 13, color: UI.muted, display: "flex", alignItems: "center", gap: 6 }}>{icon} {label}</span>
                            <span style={{
                              fontSize: 20, fontWeight: 700, color: UI.primary,
                              background: UI.bg, borderRadius: 8, padding: "2px 14px",
                            }}>{val}</span>
                          </div>
                        ))}
                        <div style={{
                          marginTop: 12, padding: "8px 14px", background: UI.bg, borderRadius: 8,
                          display: "flex", justifyContent: "space-between",
                        }}>
                          <span style={{ fontSize: 13, fontWeight: 600 }}>Total Guests</span>
                          <span style={{ fontSize: 13, fontWeight: 700, color: UI.primary }}>
                            {(g?.male || 0) + (g?.female || 0) + (g?.children || 0)}
                          </span>
                        </div>
                      </>
                    );
                  })()}
                </Card>
              </div>

              {/* Reservation Details */}
              <Card>
                <SectionHeading icon={<ClipboardList size={18} />} title="Reservation Details" />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 32px" }}>
                  <div>
                    <InfoRow label="Reservation ID" value={String(r.refno || r.id)} />
                    {/* <InfoRow label="Rental Type" value={(r.rentalType || 'daily').charAt(0).toUpperCase() + (r.rentalType || 'daily').slice(1)} /> */}
                    {/* <InfoRow label="Room Space" value={(r.roomSpace || 'private').charAt(0).toUpperCase() + (r.roomSpace || 'private').slice(1)} /> */}
                    <InfoRow label="Purpose of Stay" value={r.purposeOfStay || '—'} />
                    <InfoRow label="Booking Channel" value={r.channel === "refernce" ? "Reference" : r.channel || "Direct"} />
                    {r.Agent?.fullName && (
                      <>
                        <InfoRow label="Agent" value={r.Agent.fullName} accent={UI.primary} />
                        {r.Agent.phone && <InfoRow label="Agent Phone" value={r.Agent.phone} accent={UI.muted} />}
                        {r.Agent.email && <InfoRow label="Agent Email" value={r.Agent.email} accent={UI.muted} />}
                      </>
                    )}
                  </div>
                  <div>
                    <InfoRow
                      label="Check In"
                      value={
                        <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
                          <span>{fmtDate(r.startDate)}</span>
                          {r.startTime && <span style={{ fontSize: 11, color: UI.primary, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 3 }}><Clock3 size={11} />{fmtTime(r.startTime)}</span>}
                        </span>
                      }
                    />
                    <InfoRow
                      label="Check Out"
                      value={
                        <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
                          <span>{fmtDate(r.endDate)}</span>
                          {r.endTime && <span style={{ fontSize: 11, color: UI.primary, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 3 }}><Clock3 size={11} />{fmtTime(r.endTime)}</span>}
                        </span>
                      }
                    />
                    <InfoRow label="Duration" value={`${days} Night${days > 1 ? "s" : ""}`} />
                    {/* <InfoRow label="Seats" value={String(r.numOfSeats)} /> */}
                    {/* <InfoRow label="Created" value={fmtDate(r.createdAt)} /> */}
                  </div>
                </div>
                {(() => {
                  let comp = r.complimentary;
                  if (typeof comp === "string") {
                    try { comp = JSON.parse(comp); } catch (e) { /* keep as string */ }
                  }
                  if (Array.isArray(comp) && comp.length > 0) {
                    return (
                      <div style={{
                        marginTop: 14, padding: "12px 16px",
                        background: "#ecfdf5", borderLeft: "3px solid #059669",
                        borderRadius: "0 8px 8px 0", fontSize: 13, color: "#065f46",
                      }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                          <span style={{ fontWeight: 700 }}>🎁 Complimentary:</span>
                          {comp.map((c: string, idx: number) => (
                            <span key={idx} style={{
                              background: "#d1fae5", border: "1px solid #a7f3d0",
                              padding: "2px 8px", borderRadius: 4, fontWeight: 600, fontSize: 12
                            }}>
                              {c}
                            </span>
                          ))}
                        </div>
                      </div>
                    );
                  }
                  if (typeof comp === "string" && comp.trim()) {
                    return (
                      <div style={{
                        marginTop: 14, padding: "12px 16px",
                        background: "#ecfdf5", borderLeft: "3px solid #059669",
                        borderRadius: "0 8px 8px 0", fontSize: 13, color: "#065f46",
                      }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                          <span style={{ fontWeight: 700 }}>🎁 Complimentary:</span>
                          <span style={{ fontWeight: 600, fontSize: 13 }}>{comp.trim()}</span>
                        </div>
                      </div>
                    );
                  }
                  return null;
                })()}

                {r.resNotes && (
                  <div style={{
                    marginTop: 14, padding: "12px 16px",
                    background: "#fffbeb", borderLeft: "3px solid #f59e0b",
                    borderRadius: "0 8px 8px 0", fontSize: 13, color: "#92400e",
                  }}>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 6 }}>
                      <FileText size={16} style={{ flexShrink: 0, marginTop: 2 }} />
                      <span><strong>Notes:</strong> {r.resNotes}</span>
                    </div>
                  </div>
                )}
              </Card>
            </>
          )}

          {/* ── PAYMENTS TAB ── */}
          {activeTab === "payments" && (
            <Card>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <SectionHeading icon={<CreditCard size={18} />} title="Payment History" />
                <button onClick={() => setIsPaymentModalOpen(true)} style={{
                  background: UI.primary, border: "none", borderRadius: 8,
                  color: "#fff", padding: "8px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer",
                }}>
                  + Add Payment
                </button>
              </div>

              {/* Summary cards */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 20 }}>
                <SummaryCard label="Grand Total" value={fmt(grandTotal)} />
                <SummaryCard label="Total Paid" value={fmt(Number(r.advancePaid))} color="#059669" />
                <SummaryCard label="Balance Due" value={fmt(balance)} color={balance > 0 ? "#dc2626" : "#059669"} />
              </div>

              {/* Payments table */}
              <div style={{ border: `1px solid ${UI.border}`, borderRadius: 10, overflow: "hidden" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: UI.bg }}>
                      {["#", "Method", "Amount", "Date", "Status", "Note", "Proof"].map(h => (
                        <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontWeight: 600, fontSize: 11, color: UI.muted, textTransform: "uppercase", letterSpacing: "0.07em", borderBottom: `1px solid ${UI.border}` }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {r.payments.filter(p => p.amount !== 0).map((p, i) => (
                      <tr key={p.id} style={{ borderBottom: `1px solid ${UI.border}` }}>
                        <td style={{ padding: "11px 14px", color: UI.muted }}>{i + 1}</td>
                        <td style={{ padding: "11px 14px" }}>
                          <span style={{ textTransform: "capitalize", fontWeight: 500 }}>{p.method}</span>
                          {p.isAdvance && (
                            <span style={{
                              marginLeft: 6, fontSize: 10, padding: "2px 7px", borderRadius: 100,
                              background: "#dbeafe", color: "#1e40af", fontWeight: 700,
                            }}>ADV</span>
                          )}
                        </td>
                        <td style={{ padding: "11px 14px", fontWeight: 600 }}>{fmt(p.amount)}</td>
                        <td style={{ padding: "11px 14px", color: UI.muted }}>{p.date}</td>
                        <td style={{ padding: "11px 14px" }}>
                          <span style={{
                            padding: "3px 10px", borderRadius: 100, fontSize: 11, fontWeight: 700,
                            background: p.status === "paid" ? "#d1fae5" : "#fef3c7",
                            color: p.status === "paid" ? "#065f46" : "#92400e",
                          }}>{p.status}</span>
                        </td>
                        <td style={{ padding: "11px 14px", color: UI.muted }}>{p.note || "—"}</td>
                        <td style={{ padding: "11px 14px" }}>
                          {p.proofImage ? (
                            <a href={p.proofImage} target="_blank" rel="noreferrer" style={{ color: UI.primary, display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 600, textDecoration: 'none' }}>
                              <ImageIcon size={14} /> View
                            </a>
                          ) : "—"}
                        </td>
                      </tr>
                    ))}

                    {/* ── Refund Row ── */}
                    {r.refundExpense && (
                      <tr style={{
                        borderTop: "2px solid #059669",
                        background: "#f0fdf4",
                      }}>
                        <td style={{ padding: "11px 14px", color: UI.muted
                        }}>
                          <span style={{
                            fontSize: 10, padding: "2px 7px", borderRadius: 100,
                            background: "#d1fae5", color: "#065f46", fontWeight: 700,
                          }}>REFUND</span>
                        </td>
                        <td style={{ padding: "11px 14px", textTransform: "capitalize", fontWeight: 500 }}>
                          {(r.refundExpense.payment_type || "cash").replace("_", " ")}
                        </td>
                        <td style={{ padding: "11px 14px", fontWeight: 700, color: "#dc2626" }}>
                          -{fmt(Number(r.refundExpense.price))}
                        </td>
                        <td style={{ padding: "11px 14px", color: UI.muted, fontSize: 12 }}>
                          {r.refundExpense.date_for ? fmtDate(r.refundExpense.date_for) : "—"}
                        </td>
                        <td style={{ padding: "11px 14px" }}>
                          <span style={{
                            padding: "3px 10px", borderRadius: 100, fontSize: 11, fontWeight: 700,
                            background: "#d1fae5", color: "#065f46",
                          }}>Refunded</span>
                        </td>
                        <td style={{ padding: "11px 14px", color: UI.muted }}>
                          {r.refundExpense.description || "Security deposit refund"}
                        </td>
                        <td style={{ padding: "11px 14px", color: UI.muted }}>—</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* ── ROOMS TAB ── */}
          {activeTab === "rooms" && (
            <div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
                {(r.reservationRooms && r.reservationRooms.length > 0
                  ? r.reservationRooms.map((rr: any, idx: number) => {
                      const room = (r.rooms || []).find((rm: any) => Number(rm.id) === Number(rr.assignedRoomId)) || {};
                      const roomDays = calcDays(rr.startDate || r.startDate, rr.endDate || r.endDate);
                      const roomSubtotal = (Number(rr.pricePerDay) || 0) * roomDays;
                      return (
                        <Card key={rr.id || idx} style={{ marginBottom: 0 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                            <div>
                              <div style={{
                                fontSize: 28, fontWeight: 800, color: UI.primary, lineHeight: 1,
                              }}>
                                {room.roomNo || `Room ${rr.assignedRoomId}`}
                              </div>
                              <div style={{ fontSize: 12, color: UI.muted, marginTop: 2 }}>
                                {room.Floor?.floorName || ""}
                              </div>
                            </div>
                            <div>
                              <span style={{
                                padding: "4px 12px", borderRadius: 100, fontSize: 11, fontWeight: 700,
                                background: rr?.status === "active" ? "#d1fae5" : "#dbeafe",
                                color: rr?.status === "active" ? "#065f46" : "#1e40af",
                              }}>
                                {rr?.status?.toUpperCase() || "ACTIVE"}
                              </span>
                            </div>
                          </div>
                          <div style={{
                            padding: "10px 14px", background: UI.bg, borderRadius: 8, marginBottom: 12,
                            fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 6
                          }}>
                            <Bed size={16} /> {room.RoomType?.name || "Room"}
                          </div>
                          <InfoRow label="Check In" value={fmtDate(rr?.startDate || r.startDate)} />
                          <InfoRow label="Check Out" value={fmtDate(rr?.endDate || r.endDate)} />
                          <InfoRow label="Nights" value={String(roomDays)} />
                          <InfoRow label="Rate/Night" value={fmt(rr?.pricePerDay || 0)} />
                          <div style={{
                            marginTop: 12, padding: "10px 14px",
                            background: UI.primary, borderRadius: 8,
                            display: "flex", justifyContent: "space-between", alignItems: "center",
                          }}>
                            <span style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", fontWeight: 500 }}>Period Total</span>
                            <span style={{ fontSize: 16, fontWeight: 800, color: "#fff" }}>{fmt(roomSubtotal)}</span>
                          </div>
                        </Card>
                      );
                    })
                  : r.rooms.map((room, idx) => {
                      const rr = room.ReservationRoom;
                      const roomDays = calcDays(rr?.startDate || r.startDate, rr?.endDate || r.endDate);
                      const roomSubtotal = (rr?.pricePerDay || 0) * roomDays;
                      return (
                        <Card key={room.id || idx} style={{ marginBottom: 0 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                            <div>
                              <div style={{
                                fontSize: 28, fontWeight: 800, color: UI.primary, lineHeight: 1,
                              }}>
                                {room.roomNo}
                              </div>
                              <div style={{ fontSize: 12, color: UI.muted, marginTop: 2 }}>
                                {room.Floor?.floorName}
                              </div>
                            </div>
                            <div>
                              <span style={{
                                padding: "4px 12px", borderRadius: 100, fontSize: 11, fontWeight: 700,
                                background: rr?.status === "active" ? "#d1fae5" : "#dbeafe",
                                color: rr?.status === "active" ? "#065f46" : "#1e40af",
                              }}>
                                {rr?.status?.toUpperCase() || "ACTIVE"}
                              </span>
                            </div>
                          </div>
                          <div style={{
                            padding: "10px 14px", background: UI.bg, borderRadius: 8, marginBottom: 12,
                            fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 6
                          }}>
                            <Bed size={16} /> {room.RoomType?.name}
                          </div>
                          <InfoRow label="Check In" value={fmtDate(rr?.startDate || r.startDate)} />
                          <InfoRow label="Check Out" value={fmtDate(rr?.endDate || r.endDate)} />
                          <InfoRow label="Nights" value={String(roomDays)} />
                          <InfoRow label="Rate/Night" value={fmt(rr?.pricePerDay || 0)} />
                          <div style={{
                            marginTop: 12, padding: "10px 14px",
                            background: UI.primary, borderRadius: 8,
                            display: "flex", justifyContent: "space-between", alignItems: "center",
                          }}>
                            <span style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", fontWeight: 500 }}>Room Total</span>
                            <span style={{ fontSize: 16, fontWeight: 800, color: "#fff" }}>{fmt(roomSubtotal)}</span>
                          </div>
                        </Card>
                      );
                    }))}
              </div>
            </div>
          )}

          {/* ── EXTRAS TAB ── */}
          {activeTab === "extras" && (() => {
            const query = extrasSearchQuery.trim().toLowerCase();
            const filteredExtras = (r.extras || []).filter((e: any) => {
              if (!query) return true;
              return (
                (e.name && e.name.toLowerCase().includes(query)) ||
                (e.description && e.description.toLowerCase().includes(query)) ||
                String(e.sellPrice).includes(query)
              );
            });
            const filteredCustom = (r.customExtras || []).filter((ce: any) => {
              if (!query) return true;
              return (
                (ce.name && ce.name.toLowerCase().includes(query)) ||
                String(ce.price).includes(query)
              );
            });
            const hasMatches = filteredExtras.length > 0 || filteredCustom.length > 0;

            return (
              <Card>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <SectionHeading icon={<ShoppingCart size={18} />} title="POS Items & Services" />
                    {posItemsTotal > 0 && (
                      <span style={{
                        padding: "3px 10px", borderRadius: 99, fontSize: 11, fontWeight: 700,
                        background: posStatus === 'Paid' ? '#dcfce7' : posStatus === 'Partial' ? '#dbeafe' : '#fef3c7',
                        color: posStatus === 'Paid' ? '#15803d' : posStatus === 'Partial' ? '#1e40af' : '#b45309',
                        border: `1px solid ${posStatus === 'Paid' ? '#bbf7d0' : posStatus === 'Partial' ? '#bfdbfe' : '#fde68a'}`
                      }}>
                        {posStatus === 'Paid' ? '● Fully Paid' : posStatus === 'Partial' ? '● Partially Paid' : '● Payment Pending'}
                      </span>
                    )}
                  </div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    {posItemsTotal > 0 && posBalanceAmount > 0 && (
                      <button
                        type="button"
                        onClick={() => setIsPosPaymentModalOpen(true)}
                        style={{
                          background: "#059669", border: "none", borderRadius: 8,
                          color: "#fff", padding: "7px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer",
                          display: "flex", alignItems: "center", gap: 6, boxShadow: "0 1px 2px rgba(5,150,105,0.2)"
                        }}
                      >
                        <Banknote size={15} /> + Add POS Payment
                      </button>
                    )}
                    {posItemsTotal > 0 && posBalanceAmount <= 0 && (
                      <span style={{
                        padding: "6px 12px", borderRadius: 8, fontSize: 12, fontWeight: 700,
                        background: "#f0fdf4", color: "#166534", border: "1px solid #bbf7d0",
                        display: "flex", alignItems: "center", gap: 5
                      }}>
                        <ShieldCheck size={14} /> POS Paid
                      </span>
                    )}
                    {r.status !== "checked_out" && (
                      <>
                        <button onClick={() => setIsExtrasModalOpen(true)} style={{
                          background: "transparent", border: `1px solid ${UI.border}`, borderRadius: 8,
                          color: UI.text, padding: "7px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer",
                        }}>
                          + Custom Item
                        </button>
                        <button onClick={() => setIsExtrasModalOpen(true)} style={{
                          background: UI.primary, border: "none", borderRadius: 8,
                          color: "#fff", padding: "7px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer",
                        }}>
                          + Add from POS
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {posItemsTotal > 0 && (
                  <div style={{
                    display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                    gap: 12, marginBottom: 18, padding: 14, background: UI.bg,
                    borderRadius: 12, border: `1px solid ${UI.border}`
                  }}>
                    <div>
                      <div style={{ fontSize: 11, color: UI.muted, textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.05em" }}>POS Total</div>
                      <div style={{ fontSize: 16, fontWeight: 800, color: UI.text, marginTop: 4 }}>{fmt(posItemsTotal)}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: "#059669", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.05em" }}>POS Paid</div>
                      <div style={{ fontSize: 16, fontWeight: 800, color: "#059669", marginTop: 4 }}>{fmt(posPaidAmount)}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: posBalanceAmount > 0 ? "#dc2626" : UI.muted, textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.05em" }}>POS Balance Due</div>
                      <div style={{ fontSize: 16, fontWeight: 800, color: posBalanceAmount > 0 ? "#dc2626" : "#059669", marginTop: 4 }}>
                        {fmt(posBalanceAmount)}
                      </div>
                    </div>
                    {linkedSales.length > 0 && (
                      <div>
                        <div style={{ fontSize: 11, color: UI.muted, textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.05em" }}>POS Sale Ref</div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: UI.primary, marginTop: 4 }}>
                          {linkedSales.map((s: any) => s.prefix).join(", ")}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div style={{ position: "relative", marginBottom: 16, maxWidth: 320 }}>
                  <Search size={16} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: UI.muted }} />
                  <input
                    type="text"
                    placeholder="Search POS items..."
                    value={extrasSearchQuery}
                    onChange={(e) => setExtrasSearchQuery(e.target.value)}
                    style={{
                      width: "100%", paddingLeft: 36, paddingRight: 32, paddingTop: 8, paddingBottom: 8,
                      fontSize: 13, border: `1px solid ${UI.border}`, borderRadius: 8, outline: "none", background: UI.bg
                    }}
                  />
                  {extrasSearchQuery && (
                    <button
                      onClick={() => setExtrasSearchQuery("")}
                      style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: UI.muted }}
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                <div style={{ border: `1px solid ${UI.border}`, borderRadius: 10, overflow: "hidden", marginBottom: 16 }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                    <thead>
                      <tr style={{ background: UI.bg }}>
                        {["Item", "Unit Price", "Qty", "Total", "Date"].map(h => (
                          <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontWeight: 600, fontSize: 11, color: UI.muted, textTransform: "uppercase", letterSpacing: "0.07em", borderBottom: `1px solid ${UI.border}` }}>
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {!hasMatches ? (
                        <tr>
                          <td colSpan={5} style={{ padding: "20px", textAlign: "center", color: UI.muted }}>
                            {query ? "No matching POS items found." : "No POS items added yet."}
                          </td>
                        </tr>
                      ) : (
                        <>
                          {filteredExtras.map((e, i) => (
                            <tr key={e.id || i} style={{ borderBottom: `1px solid ${UI.border}` }}>
                              <td style={{ padding: "11px 14px", fontWeight: 500 }}>
                                {e.name}
                                {e.description && <div style={{ fontSize: 11, color: UI.muted, marginTop: 2 }}>{e.description}</div>}
                              </td>
                              <td style={{ padding: "11px 14px" }}>{fmt(e.sellPrice)}</td>
                              <td style={{ padding: "11px 14px" }}>{e.ReservationExtra?.quantity}</td>
                              <td style={{ padding: "11px 14px", fontWeight: 700, color: UI.primary }}>
                                {fmt(e.ReservationExtra?.totalPrice || 0)}
                              </td>
                              <td style={{ padding: "11px 14px", color: UI.muted, fontSize: 12 }}>
                                {fmtDate(e.ReservationExtra?.createdAt)}
                              </td>
                            </tr>
                          ))}
                          {filteredCustom.map((ce: any, i: number) => (
                            <tr key={`ce-${i}`} style={{ borderBottom: `1px solid ${UI.border}`, background: "rgba(212,160,23,0.04)" }}>
                              <td style={{ padding: "11px 14px", fontWeight: 500 }}>
                                <span style={{
                                  fontSize: 10, padding: "2px 7px", borderRadius: 100,
                                  background: "#fef3c7", color: "#92400e", fontWeight: 700, marginRight: 6,
                                }}>CUSTOM</span>
                                {ce.name}
                              </td>
                              <td style={{ padding: "11px 14px" }}>{fmt(ce.price)}</td>
                              <td style={{ padding: "11px 14px" }}>{ce.quantity}</td>
                              <td style={{ padding: "11px 14px", fontWeight: 700, color: UI.primary }}>{fmt(ce.totalPrice)}</td>
                              <td style={{ padding: "11px 14px", color: UI.muted, fontSize: 12 }}>{fmtDate(ce.createdAt)}</td>
                            </tr>
                          ))}
                        </>
                      )}
                    </tbody>
                    <tfoot>
                      <tr style={{ background: UI.bg }}>
                        <td colSpan={3} style={{ padding: "11px 14px", fontWeight: 700, textAlign: "right", fontSize: 13 }}>POS Total</td>
                        <td colSpan={2} style={{ padding: "11px 14px", fontWeight: 800, color: UI.primary, fontSize: 15 }}>
                          {fmt(extrasTotal + customExtrasTotal)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </Card>
            );
          })()}

          {/* ── TRANSPORT TAB ── */}
          {activeTab === "transport" && (
            <Card>
              <SectionHeading icon={<Car size={18} />} title="Transportation Trips" />
              <div style={{ border: `1px solid ${UI.border}`, borderRadius: 10, overflow: "hidden" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: UI.bg }}>
                      {["Date", "Vehicle", "Purpose", "Billing", "Status", "Amount"].map(h => (
                        <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontWeight: 600, fontSize: 11, color: UI.muted, textTransform: "uppercase", letterSpacing: "0.07em", borderBottom: `1px solid ${UI.border}` }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(r.trips || []).length === 0 ? (
                      <tr>
                        <td colSpan={6} style={{ padding: 32, textAlign: "center", color: UI.muted }}>
                          No trips recorded
                        </td>
                      </tr>
                    ) : (r.trips || []).map(t => (
                      <tr key={t.id} style={{ borderBottom: `1px solid ${UI.border}` }}>
                        <td style={{ padding: "11px 14px", color: UI.muted, fontSize: 12 }}>{fmtDate(t.startTime)}</td>
                        <td style={{ padding: "11px 14px", fontWeight: 500 }}>
                          {t.vehicle?.name}
                          <div style={{ fontSize: 11, color: UI.muted }}>{t.vehicle?.plateNumber}</div>
                        </td>
                        <td style={{ padding: "11px 14px" }}>{t.purpose || "—"}</td>
                        <td style={{ padding: "11px 14px" }}>
                          <span style={{
                            padding: "3px 10px", borderRadius: 100, fontSize: 11, fontWeight: 700,
                            background: t.billingType === "Pay Now" ? "#fee2e2" : "#dbeafe",
                            color: t.billingType === "Pay Now" ? "#991b1b" : "#1e40af",
                          }}>{t.billingType || "Room Bill"}</span>
                        </td>
                        <td style={{ padding: "11px 14px" }}>
                          <span style={{
                            padding: "3px 10px", borderRadius: 100, fontSize: 11, fontWeight: 700,
                            background: t.status === "Completed" ? "#d1fae5" : "#fef3c7",
                            color: t.status === "Completed" ? "#065f46" : "#92400e",
                          }}>{t.status}</span>
                        </td>
                        <td style={{ padding: "11px 14px", fontWeight: 700 }}>{fmt(t.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                  {(r.trips || []).length > 0 && (
                    <tfoot>
                      <tr style={{ background: UI.bg }}>
                        <td colSpan={5} style={{ padding: "11px 14px", fontWeight: 700, textAlign: "right" }}>Trip Total</td>
                        <td style={{ padding: "11px 14px", fontWeight: 800, color: UI.primary, fontSize: 15 }}>{fmt(tripsTotal)}</td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </Card>
          )}
        </div>
      </div>

      {isPaymentModalOpen && r && (
        <PaymentModal
          isOpen={isPaymentModalOpen}
          onClose={() => setIsPaymentModalOpen(false)}
          booking={r}
          onSuccess={() => loadReservation()}
        />
      )}

      {isPosPaymentModalOpen && r && (
        <PosPaymentModal
          isOpen={isPosPaymentModalOpen}
          onClose={() => setIsPosPaymentModalOpen(false)}
          booking={r}
          posTotal={posItemsTotal}
          posBalance={posBalanceAmount}
          onSuccess={() => loadReservation()}
        />
      )}

      {isCheckoutModalOpen && r && (
        <CheckoutModal
          isOpen={isCheckoutModalOpen}
          onClose={() => setIsCheckoutModalOpen(false)}
          booking={{ ...r, balanceAmount: balance }}
          onSuccess={() => loadReservation()}
        />
      )}

      {r && (
        <InvoiceModal
          isOpen={isInvoiceModalOpen}
          onClose={() => setIsInvoiceModalOpen(false)}
          booking={r}
        />
      )}
      {isExtrasModalOpen && r && (
        <ExtrasModal
          isOpen={isExtrasModalOpen}
          onClose={() => setIsExtrasModalOpen(false)}
          reservationId={r.id}
          onSuccess={() => loadReservation()}
        />
      )}
    </div>
  );
}