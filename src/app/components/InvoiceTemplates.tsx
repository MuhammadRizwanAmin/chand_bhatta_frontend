import React from "react";
import DefaultLogo from "../../assets/logo.png";
import { TermsAndConditionsHTML } from "./TermsAndConditionsHTML";

// Currency formatter
const formatPKR = (amount: number) => {
  return new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount || 0);
};

const formatDate = (date: any) => (date ? new Date(date).toLocaleDateString("en-GB") : "-");

const formatDateTime = (date: any) => (
  date
    ? new Date(date).toLocaleString("en-GB", {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }).toUpperCase()
    : "-"
);

const getPaymentTypeLabel = (p: any) => {
  if (p.isAdvance || p.isOpeningBalance) return "Advance";
  if (p.saleId != null || p.isPos) return "POS / Extras";
  if (p.tripId != null || p.isTrip) return "Transport";
  if (p.note && typeof p.note === "string" && p.note.trim() && p.note.trim().length <= 25) return p.note.trim();
  return "Room Payment";
};

const getPaymentMethodLabel = (p: any) => {
  const m = String(p.method || p.paymentMode || "Cash").toUpperCase();
  const bank = p.bank_name ? ` (${p.bank_name})` : "";
  return `${m}${bank}`;
};

const getContactPhone = (location: any, settings: any) => {
  if (location?.contactPhone && location.contactPhone !== "+92 51 1234567") {
    return location.contactPhone;
  }
  return settings?.organization_phone || "+92 300 4333458";
};

const getNTN = (location?: any, settings?: any) => {
  return location?.ntn || settings?.ntn_number || settings?.ntn || "7464220-7";
};

export function formatGroupedDates(datesArray: any, fallbackDate: any) {
  let parsedDates = datesArray;
  if (typeof parsedDates === 'string') {
    try {
      parsedDates = JSON.parse(parsedDates);
    } catch (e) {
      parsedDates = [];
    }
  }
  if (!parsedDates || !Array.isArray(parsedDates) || parsedDates.length === 0) {
    return formatDateTime(fallbackDate);
  }
  const counts: Record<string, number> = {};
  parsedDates.forEach(d => {
    if (typeof d === 'string' && d.length < 10) return;
    const formatted = formatDateTime(d);
    counts[formatted] = (counts[formatted] || 0) + 1;
  });
  const results = Object.entries(counts).map(([date, count]) => `${date} (x${count})`);
  return results.length > 0 ? results.join(' | ') : formatDateTime(fallbackDate);
}

// ---------- CALCULATION LOGIC ----------
export const calculateInvoice = (data: any, mode = "all") => {
  const safeParseJSON = (value: any) => {
    if (!value) return [];
    if (typeof value === "object") return value;
    try {
      let cleaned = value;
      if (typeof cleaned === "string") {
        cleaned = cleaned.replace(/\\"/g, '"');
        if (cleaned.startsWith('"') && cleaned.endsWith('"')) {
          cleaned = cleaned.substring(1, cleaned.length - 1);
        }
      }
      return JSON.parse(cleaned);
    } catch (e) {
      return [];
    }
  };

  const calculateDays = (start: any, end: any) => {
    if (!start || !end) return 1;
    const startDate = new Date(start).getTime();
    const endDate = new Date(end).getTime();
    const diff = endDate - startDate;
    return Math.max(Math.ceil(diff / (1000 * 60 * 60 * 24)), 1);
  };

  const parsedRoomRent = safeParseJSON(data?.roomRent);
  const roomRent = Array.isArray(parsedRoomRent) ? parsedRoomRent : [];

  // ROOM BREAKDOWN
  const roomBreakdown = (data?.reservationRooms && data.reservationRooms.length > 0)
    ? data.reservationRooms.map((rr: any) => {
        const room = (data?.rooms || []).find((r: any) => Number(r.id) === Number(rr.assignedRoomId));
        const rStart = rr.startDate || data?.startDate;
        const rEnd = rr.endDate || data?.endDate;
        const rDays = calculateDays(rStart, rEnd);
        let rRate = Number(rr.pricePerDay || 0);
        if (rRate === 0 && roomRent.length > 0) {
          const rentItem = roomRent.find((rent: any) => String(rent.assignedRoomId || rent.id || rent.roomNo) === String(rr.assignedRoomId || room?.roomNo));
          if (rentItem && rentItem.rate) {
            rRate = Number(rentItem.rate);
          }
        }
        const rTotal = rRate * rDays;
        const cleanRoomNo = room?.roomNo ? String(room.roomNo).replace(/^room\s*/i, '') : String(rr.assignedRoomId);
        return {
          roomNo: cleanRoomNo,
          roomType: room?.RoomType?.name || "Room",
          startDate: rStart,
          endDate: rEnd,
          days: rDays,
          rate: rRate,
          total: rTotal
        };
      })
    : (data?.rooms || []).map((room: any) => {
        const resRoom = room.ReservationRoom || {};
        const rStart = resRoom.startDate || data?.startDate;
        const rEnd = resRoom.endDate || data?.endDate;
        const rDays = calculateDays(rStart, rEnd);
        let rRate = Number(resRoom.pricePerDay || 0);
        if (rRate === 0 && roomRent.length > 0) {
          const rentItem = roomRent.find((rent: any) => String(rent.assignedRoomId || rent.id || rent.roomNo) === String(room.id || room.roomNo));
          if (rentItem && rentItem.rate) {
            rRate = Number(rentItem.rate);
          }
        }
        const rTotal = rRate * rDays;
        const cleanRoomNo = room.roomNo ? String(room.roomNo).replace(/^room\s*/i, '') : '';
        return {
          roomNo: cleanRoomNo,
          roomType: room?.RoomType?.name || "Room",
          startDate: rStart,
          endDate: rEnd,
          days: rDays,
          rate: rRate,
          total: rTotal
        };
      });

  const roomTotalComputed = roomBreakdown.reduce((sum: number, r: any) => sum + r.total, 0);

  // LEGACY FALLBACK
  const stayDays = calculateDays(data?.startDate, data?.endDate);
  const discountPercent = mode === "extras" ? 0 : Number(data?.discount || 0);
  const taxPercent = mode === "extras" ? 0 : Number(data?.taxAmount || 0);

  let roomRateTotal = roomRent.reduce((sum: number, r: any) => sum + Number(r.rate) * (Number(r.count) || 1), 0);
  const legacyRoomTotal = roomRateTotal * stayDays;

  const currentRoomTotal = roomTotalComputed > 0 ? roomTotalComputed : (isNaN(legacyRoomTotal) ? 0 : legacyRoomTotal);

  const extrasTotal = (data?.extras || []).reduce((sum: number, e: any) => sum + Number(e?.ReservationExtra?.totalPrice || 0), 0);
  const customExtrasTotal = (data?.customExtras || []).reduce(
    (sum: number, e: any) => sum + Number(e?.totalPrice || (e?.price || 0) * (e?.quantity || 1)),
    0
  );

  // TRIP CALCULATION
  const trips = Array.isArray(data?.trips)
    ? data.trips
    : data?.amount !== undefined && data?.vehicle
      ? [data]
      : [];

  const hasRoomCharges = roomTotalComputed > 0 || legacyRoomTotal > 0;
  // Use explicit flag if provided, otherwise fall back to detection
  const isStandaloneTrip: boolean = data?.isStandaloneTripInvoice === true || (trips.length > 0 && !hasRoomCharges);

  console.log("=== INVOICE DEBUG ===");
  console.log("data.isStandaloneTripInvoice:", data?.isStandaloneTripInvoice);
  console.log("trips array:", trips);
  console.log("trips.length:", trips.length);
  console.log("hasRoomCharges:", hasRoomCharges);
  console.log("isStandaloneTrip:", isStandaloneTrip);
  console.log("roomTotalComputed:", roomTotalComputed);
  console.log("legacyRoomTotal:", legacyRoomTotal);

  const tripsTotal = trips.reduce((sum: number, t: any) => {
    console.log("  Trip item:", t.id, "| amount:", t.amount, "| billingType:", t.billingType, "| isStandaloneTrip:", isStandaloneTrip);
    // Standalone trip invoice: always include the amount regardless of billing type
    if (isStandaloneTrip) return sum + Number(t.amount || 0);
    // Hotel/reservation invoice: exclude trips that were paid separately (Pay Now)
    const isPayNow = t.billingType?.toLowerCase().replace(/\s/g, "") === "paynow";
    if (isPayNow) return sum;
    return sum + Number(t.amount || 0);
  }, 0);

  const isSale = Boolean(
    data?.channel === "POS Sale" ||
    data?.isSale ||
    data?.isStandaloneSale ||
    (data?.prefix && String(data.prefix).startsWith("SL")) ||
    (data?.refno && String(data.refno).startsWith("SL")) ||
    (data?.rooms && data.rooms.length === 0) ||
    data?.saleItems
  );

  const linkedSales = Array.isArray(data?.sales) ? data.sales : [];
  const posSalesTotal = linkedSales.reduce((sum: number, s: any) => sum + Number(s.totalAmount || 0), 0);
  const posPaidFromSales = linkedSales.reduce((sum: number, s: any) => sum + Number(s.advancePaid || 0), 0);
  const allPayments = Array.isArray(data?.payments) ? data.payments : [];
  const posPayments = allPayments.filter((p: any) => p.saleId != null && p.saleId !== '');
  const posPaidFromPayments = posPayments.reduce((sum: number, p: any) => sum + Number(p.amount || 0), 0);
  const totalPosPaid = Math.max(posPaidFromSales, posPaidFromPayments);

  // Merge all payments (room, POS sales, trips, advance) for Payment Log
  const rawPayments: any[] = [];
  const seenPaymentIds = new Set();

  if (Array.isArray(data?.payments)) {
    data.payments.forEach((p: any) => {
      if (p && Number(p.amount || 0) > 0) {
        if (p.id) seenPaymentIds.add(p.id);
        rawPayments.push(p);
      }
    });
  }

  if (Array.isArray(data?.sales)) {
    data.sales.forEach((s: any) => {
      if (Array.isArray(s.payments)) {
        s.payments.forEach((sp: any) => {
          if (sp && Number(sp.amount || 0) > 0) {
            if (!sp.id || !seenPaymentIds.has(sp.id)) {
              if (sp.id) seenPaymentIds.add(sp.id);
              rawPayments.push({ ...sp, isPos: true, saleRef: s.id || s.invoiceNo });
            }
          }
        });
      }
    });
  }

  if (Array.isArray(data?.trips)) {
    data.trips.forEach((t: any) => {
      if (Array.isArray(t.payments)) {
        t.payments.forEach((tp: any) => {
          if (tp && Number(tp.amount || 0) > 0) {
            if (!tp.id || !seenPaymentIds.has(tp.id)) {
              if (tp.id) seenPaymentIds.add(tp.id);
              rawPayments.push({ ...tp, isTrip: true });
            }
          }
        });
      }
    });
  }

  if (rawPayments.length === 0 && Number(data?.advancePaid || data?.advancepaid1 || 0) > 0) {
    rawPayments.push({
      amount: Number(data?.advancePaid || data?.advancepaid1),
      method: data?.paymentMethod || data?.mode || 'advance',
      createdAt: data?.createdAt || data?.date || data?.startDate,
      isAdvance: true,
      note: 'Advance Payment'
    });
  }

  rawPayments.sort((a, b) => {
    const ta = new Date(a.createdAt || a.date || 0).getTime();
    const tb = new Date(b.createdAt || b.date || 0).getTime();
    return ta - tb;
  });

  const rawExtrasList = [...(data?.extras || []), ...(data?.customExtras || [])];
  const rawExtrasTotal = extrasTotal + customExtrasTotal;
  const totalPosCost = posSalesTotal > 0 ? posSalesTotal : rawExtrasTotal;
  const unpaidPos = Math.max(0, totalPosCost - totalPosPaid);

  const isRoomsMode = mode === "rooms";
  const isExtrasMode = mode === "extras";

  const finalRoomTotal = (isExtrasMode || isSale) ? 0 : currentRoomTotal;
  
  // Full bill shows unpaid POS balance only, room mode excludes extras, extras mode shows extras only
  let finalTotalExtras = 0;
  let extrasList: any[] = [];
  if (isExtrasMode) {
    finalTotalExtras = totalPosCost;
    extrasList = rawExtrasList;
  } else if (isRoomsMode) {
    finalTotalExtras = 0;
    extrasList = [];
  } else if (isSale) {
    finalTotalExtras = totalPosCost;
    extrasList = rawExtrasList;
  } else {
    // Hotel reservation full bill: include total POS/extras charges
    finalTotalExtras = totalPosCost;
    extrasList = rawExtrasList;
  }

  const finalTripsTotal = (isRoomsMode || isExtrasMode) ? 0 : tripsTotal;

  const halfDayAmount = (isExtrasMode || isSale) ? 0 : Number(data?.halfDayAmount || 0);
  const halfDayChargeName = data?.halfDayChargeName || 'half room rent';

  let roomDiscountValue = 0;
  if (data?.discountType === "fixed") {
    roomDiscountValue = (isExtrasMode || isSale) ? 0 : discountPercent;
  } else {
    roomDiscountValue = finalRoomTotal * (discountPercent / 100);
  }

  // 4. balance Total = Room Rent Total - Discount + half room rent
  const netRoomRent = Math.max(0, finalRoomTotal - roomDiscountValue);
  const balanceTotal = (isExtrasMode || isSale) ? 0 : Math.max(0, netRoomRent + halfDayAmount);

  // 5. GST (configured taxPercent, default 0 if not provided)
  const effectiveTaxPercent = (taxPercent && taxPercent > 0) ? taxPercent : 0;
  const isTaxInclusive = data?.isTaxInclusive === true || data?.isTaxInclusive === "true";
  const roomTaxValue = effectiveTaxPercent > 0
    ? (isTaxInclusive
      ? netRoomRent - (netRoomRent / (1 + (effectiveTaxPercent / 100)))
      : netRoomRent * (effectiveTaxPercent / 100))
    : 0;

  const roomAfterTax = isTaxInclusive ? netRoomRent : netRoomRent + roomTaxValue;

  const baseTotal = isTaxInclusive
    ? (finalRoomTotal - roomTaxValue) + finalTotalExtras + finalTripsTotal
    : finalRoomTotal + finalTotalExtras + finalTripsTotal;

  const waivedAmount = Number(data?.waivedAmount || 0);
  const grandTotal = roomAfterTax + halfDayAmount + finalTotalExtras + finalTripsTotal - waivedAmount;

  // POS tax: only apply if in extras mode OR if there are POS items on room bill
  const posTaxRaw = Number(data?.posTaxAmount || 0);
  const posTaxAmount = (isExtrasMode || (!isRoomsMode && !isSale && totalPosCost > 0)) ? posTaxRaw : (isSale ? posTaxRaw : 0);

  // Sale-specific: override computed tax with actual sale tax value from data
  const saleTaxValue = isSale && data?.saleTaxValue != null ? Number(data.saleTaxValue) : 0;
  const effectiveTaxValue = saleTaxValue > 0 ? saleTaxValue : roomTaxValue;
  const effectiveGrandTotal = saleTaxValue > 0 ? grandTotal + saleTaxValue : grandTotal + posTaxAmount;

  const isPosPayment = (p: any) => Boolean(
    isSale ||
    p.isPos ||
    (p.saleId != null && p.saleId !== '') ||
    (p.sale_id != null && p.sale_id !== '') ||
    (p.note && /pos/i.test(p.note))
  );

  const isTripPayment = (p: any) => Boolean(
    p.isTrip ||
    (p.tripId != null && p.tripId !== '') ||
    (p.trip_id != null && p.trip_id !== '')
  );

  const isRoomPayment = (p: any) => !isPosPayment(p) && !isTripPayment(p);

  const posPaymentsListTotal = rawPayments.filter(isPosPayment).reduce((sum: number, p: any) => sum + Number(p.amount || 0), 0);
  const roomPaymentsListTotal = rawPayments.filter(isRoomPayment).reduce((sum: number, p: any) => sum + Number(p.amount || 0), 0);

  const advancePaidRaw = data?.advancepaid1 || data?.advancePaid || 0;
  const rawAdvance = Array.isArray(advancePaidRaw) ? 0 : Number(advancePaidRaw || 0);

  let grossPaid = 0;
  let advancePaid = 0;

  if (isExtrasMode) {
    grossPaid = Math.max(totalPosPaid, posPaymentsListTotal);
    advancePaid = grossPaid;
  } else if (isSale) {
    grossPaid = Math.max(
      allPayments.reduce((sum: number, p: any) => sum + Number(p.amount || 0), 0),
      rawAdvance
    );
    advancePaid = rawAdvance;
  } else if (isRoomsMode) {
    const roomPayments = allPayments.filter((p: any) => !isPosPayment(p));
    const roomAdvancePaid = roomPayments.length > 0
      ? roomPayments.reduce((sum: number, p: any) => sum + Number(p.amount || 0), 0)
      : Math.max(0, rawAdvance - totalPosPaid);
    grossPaid = roomPaymentsListTotal > 0 ? roomPaymentsListTotal : roomAdvancePaid;
    advancePaid = grossPaid;
  } else {
    // Hotel reservation full bill: grossPaid equals all payments on the folio
    const paymentsListTotal = rawPayments.reduce((sum: number, p: any) => sum + Number(p.amount || 0), 0);
    grossPaid = Math.max(paymentsListTotal, rawAdvance);
    advancePaid = grossPaid;
  }

  let paymentsList = rawPayments;
  if (isRoomsMode) {
    paymentsList = rawPayments.filter(isRoomPayment);
  } else if (isExtrasMode) {
    paymentsList = rawPayments.filter(isPosPayment);
  }

  const refundedAmount = Number(data?.refundedAmount || (data?.refundExpense ? data.refundExpense.price : 0) || 0);
  // Compute balance from grandTotal minus what has been paid (allow negative for refunds/overpayment)
  const balanceDue = effectiveGrandTotal - grossPaid + refundedAmount;

  let totalGuests = 0;
  if (data?.guests) {
    try {
      let temp = typeof data.guests === 'string' ? JSON.parse(data.guests) : data.guests;
      if (typeof temp === "string") temp = JSON.parse(temp);
      totalGuests = Number(temp?.male || 0) + Number(temp?.female || 0) + Number(temp?.children || 0);
    } catch (e) {
      console.error("Error parsing guests:", e);
    }
  }

  const statusDisplay = (() => {
    const s = String(data?.status || '').toLowerCase();
    if (s === 'reserved') return 'Reserved';
    if (s === 'checked_in') return 'Checked In';
    if (s === 'checked_out') return 'Checked Out';
    if (s === 'cancelled' || s === 'canceled') return 'Cancelled';
    if (s === 'draft') return 'Draft';
    if (s === 'overdue') return 'Overdue';
    return data?.status ? String(data.status).replace(/_/g, ' ').toUpperCase() : '';
  })();

  // Room breakdown should strictly contain actual room stays; halfDay/mattress charge is shown in the summary totals
  const finalRoomBreakdown = (isExtrasMode || isSale) ? [] : roomBreakdown;

  return {
    stayDays, roomTotal: finalRoomTotal, totalExtras: finalTotalExtras, tripsTotal: finalTripsTotal, baseTotal, roomTaxValue: effectiveTaxValue,
    posTax: posTaxAmount, roomDiscountValue, grandTotal: effectiveGrandTotal, discountPercent, discountType: data?.discountType, taxPercent: effectiveTaxPercent, roomRent,
    roomBreakdown: finalRoomBreakdown,
    trips: isRoomsMode ? [] : trips,
    halfDayAmount,
    halfDayChargeName,
    balanceTotal,
    refundedAmount, grossPaid, advancePaid, isSale, isRoomsMode, isExtrasMode, isTaxInclusive, balanceDue, waivedAmount, totalGuests,
    statusDisplay, extrasList,
    paymentsList
  };
};

interface InvoiceProps {
  data: any;
  settings: any;
  logo?: string;
  location?: any;
  mode?: string;
}

const getLogoPath = (logo?: any) => {
  if (logo) {
    if (typeof logo === 'object' && logo.src) return logo.src;
    return logo;
  }
  return DefaultLogo?.src || DefaultLogo;
};

// =============================
// 1. A4 MODERN (Professional & Sleek)
// =============================
export const A4ModernHTML: React.FC<InvoiceProps> = ({ data, settings, logo, location, mode = "all" }) => {
  const { stayDays, roomTotal, totalExtras, tripsTotal, baseTotal, roomTaxValue, posTax, roomDiscountValue, grandTotal, taxPercent, discountPercent, roomRent, advancePaid, roomBreakdown, trips, grossPaid, refundedAmount, isSale, isRoomsMode, isExtrasMode, isTaxInclusive, balanceDue, waivedAmount, totalGuests, halfDayAmount, halfDayChargeName, balanceTotal, statusDisplay, extrasList, paymentsList } = calculateInvoice(data, mode);
  console.log("=== A4ModernHTML RENDER ===", { baseTotal, grandTotal, tripsTotal, balanceDue, isSale });

  const styles = {
    container: { width: "210mm", minHeight: "297mm", padding: "40px", fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif", color: "#334155", backgroundColor: "#fff" },
    header: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "30px", borderBottom: "2px solid #f1f5f9", paddingBottom: "20px" },
    hotelInfo: { flex: 2 },
    hotelName: { fontSize: "24px", fontWeight: "bold" as const, color: "#1e293b", margin: "0 0 5px 0", textTransform: "uppercase" as const },
    hotelSub: { fontSize: "11px", color: "#64748b", margin: "2px 0" },
    metaInfo: { flex: 1, textAlign: "right" as const },
    title: { fontSize: "32px", fontWeight: "900" as const, color: "#e2e8f0", margin: 0 },
    grid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "40px", marginBottom: "30px" },
    sectionTitle: { fontSize: "12px", fontWeight: "bold" as const, textTransform: "uppercase" as const, color: "#3b82f6", borderBottom: "1px solid #e2e8f0", paddingBottom: "5px", marginBottom: "10px" },
    infoRow: { display: "flex", justifyContent: "space-between", marginBottom: "4px", fontSize: "12px" },
    label: { color: "#64748b", fontWeight: "500" as const },
    value: { color: "#1e293b", fontWeight: "600" as const },
    table: { width: "100%", borderCollapse: "collapse" as const, marginTop: "10px" },
    th: { backgroundColor: "#f8fafc", color: "#475569", textAlign: "left" as const, padding: "12px 8px", fontSize: "11px", textTransform: "uppercase" as const, borderBottom: "2px solid #e2e8f0" },
    td: { padding: "10px 8px", borderBottom: "1px solid #f1f5f9", fontSize: "12px" },
    summaryWrapper: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginTop: "20px" },
    paymentLogWrapper: { width: "320px", paddingRight: "15px" },
    paymentLogTitle: { fontSize: "11px", fontWeight: "bold" as const, textTransform: "uppercase" as const, color: "#1e293b", borderBottom: "1px solid #e2e8f0", paddingBottom: "5px", marginBottom: "8px" },
    paymentLogRow: { padding: "6px 0", borderBottom: "1px solid #f1f5f9" },
    paymentLogDate: { fontSize: "11px", color: "#64748b" },
    paymentLogAmount: { fontSize: "12px", fontWeight: "bold" as const, color: "#16a34a" },
    paymentLogDetails: { fontSize: "11px", color: "#1e293b", fontWeight: "600" as const },
    paymentLogMethod: { fontSize: "11px", color: "#475569" },
    paymentLogNote: { fontSize: "10px", color: "#94a3b8", marginTop: "2px" },
    summaryBox: { width: "300px" },
    totalRow: { display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #f1f5f9" },
    grandTotal: { display: "flex", justifyContent: "space-between", padding: "12px 14px", marginTop: "10px", backgroundColor: "#1e293b", borderRadius: "3px", fontWeight: "bold" as const, fontSize: "14px", color: "#fff" },
    signatureSection: { display: "flex", justifyContent: "space-between", marginTop: "80px" },
    sigLine: { width: "150px", borderTop: "1px solid #cbd5e1", textAlign: "center" as const, paddingTop: "5px", fontSize: "10px", color: "#64748b" }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.hotelInfo}>
          <img src={getLogoPath(location?.logo || logo)} alt="logo" style={{ height: "80px", marginBottom: "10px" }} />
          <h1 style={styles.hotelName}>{location?.name || settings?.organization_name || "LE AURA GRAND"}</h1>
          <p style={styles.hotelSub}>{location?.address}</p>
          <p style={styles.hotelSub}>Phone: {getContactPhone(location, settings)} | Email: {location?.contactEmail}</p>
          <p style={{ ...styles.hotelSub, fontWeight: "600", color: "#334155" }}>NTN: {getNTN(location, settings)}</p>
        </div>
        <div style={styles.metaInfo}>
          <h2 style={styles.title}>{(!data?.rooms || data.rooms.length === 0) && trips.length > 0 ? "TRIP INVOICE" : "INVOICE"}</h2>
          <p style={styles.hotelSub}># {data?.refno}</p>
          <p style={styles.hotelSub}>Date: {formatDate(data?.updatedAt || new Date())}</p>
        </div>
      </div>

      <div style={styles.grid}>
        <div>
          <h4 style={styles.sectionTitle}>Guest Information</h4>
          <div style={styles.infoRow}>
            <span style={styles.label}>Name:</span>
            <span style={styles.value}>
              {data?.customer?.name}
              {data?.userMembership && (
                <span style={{
                  marginLeft: "8px",
                  padding: "2px 6px",
                  backgroundColor: "#3b82f6",
                  color: "#fff",
                  borderRadius: "4px",
                  fontSize: "9px",
                  verticalAlign: "middle"
                }}>
                  {data.userMembership.plan?.name || "Member"}
                </span>
              )}
            </span>
          </div>
          <div style={styles.infoRow}><span style={styles.label}>Phone:</span><span style={styles.value}>{data?.customer?.phone}</span></div>
          <div style={styles.infoRow}><span style={styles.label}>CNIC/ID:</span><span style={styles.value}>{data?.customer?.cnic || "-"}</span></div>
          <div style={styles.infoRow}><span style={styles.label}>Email:</span><span style={styles.value}>{data?.customer?.email || "-"}</span></div>
          {data?.group && <div style={styles.infoRow}><span style={styles.label}>Group:</span><span style={styles.value}>{data?.group?.name}</span></div>}
        </div>
        {data?.rooms && data.rooms.length > 0 && mode !== "extras" && (
          <div>
            <h4 style={styles.sectionTitle}>Reservation Details</h4>
            <div style={styles.infoRow}><span style={styles.label}>Stay:</span><span style={styles.value}>{formatDate(data?.startDate)} - {formatDate(data?.endDate)} ({stayDays} Nights)</span></div>
            <div style={styles.infoRow}><span style={styles.label}>Guests:</span><span style={styles.value}>{totalGuests}</span></div>
            <div style={styles.infoRow}><span style={styles.label}>Rooms:</span><span style={styles.value}>{data?.rooms?.map((r: any) => r.roomNo).join(", ")}</span></div>
            <div style={styles.infoRow}><span style={styles.label}>Room Type:</span><span style={styles.value}>{data?.rooms?.[0]?.RoomType?.name || "Standard"}</span></div>
            <div style={styles.infoRow}><span style={styles.label}>Channel:</span><span style={styles.value}>{data?.channel === "refernce" ? "Reference" : data?.channel} {data?.Referal ? `(${data.Referal})` : ""}</span></div>
            {statusDisplay && <div style={styles.infoRow}><span style={styles.label}>Status:</span><span style={{ ...styles.value, color: "#1D4ED8", fontWeight: "bold" }}>{statusDisplay}</span></div>}
          </div>
        )}
        {(!data?.rooms || data.rooms.length === 0) && trips.length > 0 && (
          <div>
            <h4 style={styles.sectionTitle}>Trip Details</h4>
            <div style={styles.infoRow}><span style={styles.label}>Date(s):</span><span style={styles.value}>{trips.map((t: any) => formatDate(t.startTime)).join(", ")}</span></div>
            <div style={styles.infoRow}><span style={styles.label}>Vehicle:</span><span style={styles.value}>{trips[0]?.vehicle?.name} ({trips[0]?.vehicle?.plateNumber})</span></div>
            <div style={styles.infoRow}><span style={styles.label}>Purpose:</span><span style={styles.value}>{trips[0]?.purpose}</span></div>
          </div>
        )}
      </div>

      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>Description</th>
            <th style={styles.th}>Qty/Nights</th>
            <th style={{ ...styles.th, textAlign: "right" }}>Amount</th>
          </tr>
        </thead>
        <tbody>
          {roomBreakdown.length > 0 ? (
            roomBreakdown.map((row: any, idx: number) => (
              <tr key={`room-${idx}`}>
                <td style={styles.td}>
                  <div style={{ fontWeight: "bold" }}>Room {row.roomNo} ({row.roomType})</div>
                  <div style={{ fontSize: "10px", color: "#64748b" }}>{formatDate(row.startDate)} to {formatDate(row.endDate)}</div>
                </td>
                <td style={styles.td}>{row.days} Night(s)</td>
                <td style={{ ...styles.td, textAlign: "right" }}>{formatPKR(row.total)}</td>
              </tr>
            ))
          ) : roomTotal > 0 && (
            <tr>
              <td style={styles.td}>Room Rent - {roomRent?.[0]?.roomTypeName || "Accommodation"}</td>
              <td style={styles.td}>{stayDays} Night(s)</td>
              <td style={{ ...styles.td, textAlign: "right" }}>{formatPKR(roomTotal)}</td>
            </tr>
          )}
          {mode !== "rooms" && extrasList.map((ex, i) => (
            <tr key={i}>
              <td style={styles.td}>
                <div>{ex.name || ex.title || ex.names}</div>
                <div style={{ fontSize: "10px", color: "#64748b" }}>
                  {formatGroupedDates(ex.ReservationExtra?.addedDates || ex.addedDates, ex.ReservationExtra?.createdAt || ex.createdAt)}
                </div>
              </td>
              <td style={styles.td}>
                {ex.ReservationExtra?.quantity || ex.quantity || 1}
                {ex.returnedQuantity ? ` (Ret: ${ex.returnedQuantity})` : ""}
              </td>
              <td style={{ ...styles.td, textAlign: "right" }}>{formatPKR(ex.ReservationExtra?.totalPrice || ex.totalPrice || (ex.price * ex.quantity))}</td>
            </tr>
          ))}
          {trips.map((trip: any, i: number) => (
            <tr key={`trip-${i}`}>
              <td style={styles.td}>
                <div style={{ fontWeight: "bold" }}>Transport: {trip.vehicle?.name} ({trip.vehicle?.plateNumber})</div>
                <div style={{ fontSize: "10px", color: "#64748b" }}>{formatDate(trip.startTime)} - {trip.purpose}</div>
              </td>
              <td style={styles.td}>1 Trip {trip.billingType?.toLowerCase()?.replace(/\s/g, "") === 'paynow' && <span style={{ color: 'orange' }}>(Pay Now)</span>}</td>
              <td style={{ ...styles.td, textAlign: "right" }}>{formatPKR(trip.amount)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={styles.summaryWrapper}>
        {paymentsList && paymentsList.length > 0 ? (
          <div style={styles.paymentLogWrapper}>
            <h4 style={styles.paymentLogTitle}>Payments Log</h4>
            {paymentsList.map((p: any, idx: number) => (
              <div key={idx} style={styles.paymentLogRow}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2px" }}>
                  <span style={styles.paymentLogDate}>{formatDateTime(p.createdAt || p.date)}</span>
                  <span style={styles.paymentLogAmount}>{formatPKR(p.amount)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={styles.paymentLogDetails}>{getPaymentTypeLabel(p)}</span>
                  <span style={styles.paymentLogMethod}>{getPaymentMethodLabel(p)}</span>
                </div>
                {p.note && p.note !== getPaymentTypeLabel(p) && (
                  <div style={styles.paymentLogNote}>{p.note}</div>
                )}
              </div>
            ))}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "8px", paddingTop: "6px", borderTop: "1px dashed #cbd5e1", fontSize: "11px", fontWeight: "bold" }}>
              <span style={{ color: "#1e293b" }}>Total Paid Amount</span>
              <span style={{ color: "#16a34a" }}>{formatPKR(paymentsList.reduce((sum: number, p: any) => sum + Number(p.amount || 0), 0))}</span>
            </div>
          </div>
        ) : (
          <div style={{ flex: 1 }} />
        )}
        <div style={styles.summaryBox}>
          {!isSale && mode !== "extras" && (
            <>
              <div style={styles.totalRow}><span style={styles.label}>Room Rent Total</span><span style={styles.value}>{formatPKR(roomTotal)}</span></div>
              {roomDiscountValue > 0 && (
                <div style={styles.totalRow}><span style={styles.label}>Discount {discountPercent > 0 ? (data?.discountType === 'fixed' ? '(Fixed)' : `(${discountPercent}%)`) : ''}</span><span style={{ ...styles.value, color: "green" }}>-{formatPKR(roomDiscountValue)}</span></div>
              )}
              {halfDayAmount > 0 && <div style={styles.totalRow}><span style={{ ...styles.label, color: "#b45309" }}>{halfDayChargeName}</span><span style={{ ...styles.value, color: "#b45309" }}>{formatPKR(halfDayAmount)}</span></div>}
              <div style={styles.totalRow}><span style={{ ...styles.label, fontWeight: "600" }}>Balance Total</span><span style={{ ...styles.value, fontWeight: "600" }}>{formatPKR(balanceTotal)}</span></div>
              {taxPercent > 0 && <div style={styles.totalRow}><span style={styles.label}>GST {taxPercent}%{isTaxInclusive ? " (Incl.)" : ""}</span><span style={styles.value}>{formatPKR(roomTaxValue)}</span></div>}
            </>
          )}
          {totalExtras > 0 && <div style={styles.totalRow}><span style={styles.label}>POS Items / Extras</span><span style={styles.value}>{formatPKR(totalExtras)}</span></div>}
          {posTax > 0 && <div style={styles.totalRow}><span style={styles.label}>POS Tax</span><span style={styles.value}>{formatPKR(posTax)}</span></div>}
          {tripsTotal > 0 && <div style={styles.totalRow}><span style={styles.label}>Transport</span><span style={styles.value}>{formatPKR(tripsTotal)}</span></div>}
          {waivedAmount > 0 && <div style={styles.totalRow}><span style={styles.label}>Waived Amount</span><span style={{ ...styles.value, color: "orange" }}>-{formatPKR(waivedAmount)}</span></div>}
          <div style={styles.grandTotal}><span>Grand Total</span><span>{formatPKR(grandTotal)}</span></div>
          {(mode !== "extras" || grossPaid > 0) && (
            <div style={styles.totalRow}>
              <span style={styles.label}>Total Paid</span>
              <span style={{ ...styles.value, color: "#16a34a" }}>{formatPKR(grossPaid)}</span>
            </div>
          )}
          {refundedAmount > 0 && mode !== "extras" && (
            <div style={styles.totalRow}>
              <span style={{ ...styles.label, color: "#ef4444" }}>Amount Refunded</span>
              <span style={{ ...styles.value, color: "#ef4444" }}>-{formatPKR(refundedAmount)}</span>
            </div>
          )}
          {!isSale && (
            <div style={styles.totalRow}>
              <span style={{ ...styles.label, fontWeight: 'bold', color: balanceDue > 0 ? '#ef4444' : '#16a34a' }}>
                Balance
              </span>
              <span style={{ ...styles.value, fontWeight: 'bold', color: balanceDue > 0 ? '#ef4444' : '#16a34a' }}>
                {formatPKR(balanceDue)}
              </span>
            </div>
          )}
        </div>
      </div>

      {settings?.termsandcondition && (
        <TermsAndConditionsHTML htmlTerms={settings?.termsandcondition} />
      )}

      {/* ── SIGNATURES ── */}
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: "60px", padding: "0 20px" }}>
        <div style={{ width: "160px", borderTop: "1px solid #1e293b", textAlign: "center", paddingTop: "6px", fontSize: "11px", fontWeight: "bold", color: "#1e293b" }}>Cashier</div>
        <div style={{ width: "160px", borderTop: "1px solid #1e293b", textAlign: "center", paddingTop: "6px", fontSize: "11px", fontWeight: "bold", color: "#1e293b" }}>Guest</div>
      </div>

      <div style={{ textAlign: "center", marginTop: "50px", borderTop: "1px solid #f1f5f9", paddingTop: "10px", fontSize: "10px", color: "#cbd5e1" }}>
        Thank you for choosing {location?.name || settings?.organization_name || "Le Aura Grand"}. Software by Unisoftwares (+92 304 5694733).
      </div>
    </div>
  );
};

// =============================
// 2. A4 CLASSIC (Traditional & Formal)
// =============================
export const A4ClassicHTML: React.FC<InvoiceProps> = ({ data, settings, logo, location, mode = "all" }) => {
  const { stayDays, roomTotal, totalExtras, tripsTotal, advancePaid, baseTotal, roomTaxValue, posTax, roomDiscountValue, grandTotal, taxPercent, discountPercent, roomRent, roomBreakdown, trips, grossPaid, refundedAmount, isSale, isRoomsMode, isExtrasMode, isTaxInclusive, balanceDue, waivedAmount, halfDayAmount, halfDayChargeName, balanceTotal, statusDisplay, extrasList, paymentsList } = calculateInvoice(data, mode);

  return (
    <div style={{ width: "210mm", minHeight: "297mm", padding: "40px", fontFamily: "'Times New Roman', Times, serif", color: "#000", backgroundColor: "#fff" }}>
      {/* ── HEADER ── */}
      <div style={{ textAlign: "center", borderBottom: "2px solid #000", paddingBottom: "10px", marginBottom: "10px" }}>
        <h1 style={{ fontSize: "28px", fontWeight: "bold", margin: "0 0 5px 0", textTransform: "uppercase" }}>{location?.name || settings?.organization_name || "LE AURA GRAND"}</h1>
        <p style={{ margin: "2px 0", fontSize: "13px" }}>{location?.address}</p>
        <p style={{ margin: "2px 0", fontSize: "13px" }}>Phone: {getContactPhone(location, settings)} | Email: {location?.contactEmail}</p>
        <p style={{ margin: "2px 0", fontSize: "13px", fontWeight: "bold" }}>NTN: {getNTN(location, settings)}</p>
      </div>

      <h2 style={{ textAlign: "center", textDecoration: "underline", margin: "20px 0", fontSize: "20px", textTransform: "uppercase" }}>
        {(!data?.rooms || data.rooms.length === 0) && trips.length > 0 ? "TRIP INVOICE" : "RECEIPT / INVOICE"}
      </h2>

      {/* ── GUEST & RESERVATION DETAILS ── */}
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px", fontSize: "13px" }}>
        <div>
          <div><strong>Billed To:</strong> {data?.customer?.name}</div>
          <div><strong>Contact:</strong> {data?.customer?.contact}</div>
          {data?.customer?.email && <div><strong>Email:</strong> {data?.customer?.email}</div>}
        </div>
        <div style={{ textAlign: "right" }}>
          <div><strong>Invoice #:</strong> {data?.refno}</div>
          <div><strong>Date:</strong> {formatDate(data?.updatedAt || new Date())}</div>
          <div><strong>Status:</strong> {statusDisplay}</div>
        </div>
      </div>

      {/* ── TABLE ── */}
      <table style={{ width: "100%", borderCollapse: "collapse", border: "1px solid #000" }}>
        <thead>
          <tr style={{ backgroundColor: "#f2f2f2", borderBottom: "1px solid #000" }}>
            <th style={{ padding: "8px", textAlign: "left", borderRight: "1px solid #000" }}>Description</th>
            <th style={{ padding: "8px", textAlign: "center", borderRight: "1px solid #000", width: "100px" }}>Qty/Nights</th>
            <th style={{ padding: "8px", textAlign: "right", width: "120px" }}>Amount</th>
          </tr>
        </thead>
        <tbody>
          {roomBreakdown.length > 0 ? (
            roomBreakdown.map((row: any, idx: number) => (
              <tr key={`room-${idx}`} style={{ borderBottom: "1px solid #000" }}>
                <td style={{ padding: "8px", borderRight: "1px solid #000" }}>
                  <strong>Room {row.roomNo} ({row.roomType})</strong>
                  <div style={{ fontSize: "11px", fontStyle: "italic" }}>{formatDate(row.startDate)} to {formatDate(row.endDate)}</div>
                </td>
                <td style={{ padding: "8px", textAlign: "center", borderRight: "1px solid #000" }}>{row.days} Night(s)</td>
                <td style={{ padding: "8px", textAlign: "right" }}>{formatPKR(row.total)}</td>
              </tr>
            ))
          ) : roomTotal > 0 && (
            <tr style={{ borderBottom: "1px solid #000" }}>
              <td style={{ padding: "8px", borderRight: "1px solid #000" }}>Room Rent - {roomRent?.[0]?.roomTypeName || "Accommodation"}</td>
              <td style={{ padding: "8px", textAlign: "center", borderRight: "1px solid #000" }}>{stayDays} Night(s)</td>
              <td style={{ padding: "8px", textAlign: "right" }}>{formatPKR(roomTotal)}</td>
            </tr>
          )}
          {mode !== "rooms" && extrasList.map((ex, i) => (
            <tr key={`extra-${i}`} style={{ borderBottom: "1px solid #000" }}>
              <td style={{ padding: "8px", borderRight: "1px solid #000" }}>
                {ex.name || ex.title || ex.names}
                <div style={{ fontSize: "11px", fontStyle: "italic" }}>
                  {formatGroupedDates(ex.ReservationExtra?.addedDates || ex.addedDates, ex.ReservationExtra?.createdAt || ex.createdAt)}
                </div>
              </td>
              <td style={{ padding: "8px", textAlign: "center", borderRight: "1px solid #000" }}>
                {ex.ReservationExtra?.quantity || ex.quantity || 1}
                {ex.returnedQuantity ? ` (Ret: ${ex.returnedQuantity})` : ""}
              </td>
              <td style={{ padding: "8px", textAlign: "right" }}>{formatPKR(ex.ReservationExtra?.totalPrice || ex.totalPrice || (ex.price * ex.quantity))}</td>
            </tr>
          ))}
          {trips.map((trip: any, i: number) => (
            <tr key={`trip-${i}`} style={{ borderBottom: "1px solid #000" }}>
              <td style={{ padding: "8px", borderRight: "1px solid #000" }}>
                <strong>Transport: {trip.vehicle?.name} ({trip.vehicle?.plateNumber})</strong>
                <div style={{ fontSize: "11px", fontStyle: "italic" }}>{formatDate(trip.startTime)} - {trip.purpose}</div>
              </td>
              <td style={{ padding: "8px", textAlign: "center", borderRight: "1px solid #000" }}>1 Trip {trip.billingType?.toLowerCase()?.replace(/\s/g, "") === 'paynow' && '(Pay Now)'}</td>
              <td style={{ padding: "8px", textAlign: "right" }}>{formatPKR(trip.amount)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ marginTop: "20px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        {paymentsList && paymentsList.length > 0 ? (
          <div style={{ width: "300px", paddingRight: "15px" }}>
            <h4 style={{ fontSize: "11px", fontWeight: "bold", textTransform: "uppercase", borderBottom: "1px solid #000", paddingBottom: "4px", marginBottom: "8px" }}>Payments Log</h4>
            {paymentsList.map((p: any, idx: number) => (
              <div key={idx} style={{ padding: "5px 0", borderBottom: "1px dashed #ccc" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2px" }}>
                  <span style={{ fontSize: "11px", color: "#555" }}>{formatDateTime(p.createdAt || p.date)}</span>
                  <span style={{ fontSize: "11px", fontWeight: "bold", color: "green" }}>{formatPKR(p.amount)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "11px", fontWeight: "bold" }}>{getPaymentTypeLabel(p)}</span>
                  <span style={{ fontSize: "11px", color: "#444" }}>{getPaymentMethodLabel(p)}</span>
                </div>
                {p.note && p.note !== getPaymentTypeLabel(p) && (
                  <div style={{ fontSize: "10px", color: "#777", marginTop: "1px" }}>{p.note}</div>
                )}
              </div>
            ))}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "8px", paddingTop: "6px", borderTop: "1px dashed #000", fontSize: "11px", fontWeight: "bold" }}>
              <span>Total Paid Amount</span>
              <span style={{ color: "green" }}>{formatPKR(paymentsList.reduce((sum: number, p: any) => sum + Number(p.amount || 0), 0))}</span>
            </div>
          </div>
        ) : (
          <div style={{ flex: 1 }} />
        )}
        <div style={{ width: "270px" }}>
        {!isSale && mode !== "extras" && (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "5px 0" }}><span>Room Rent Total:</span><span>{formatPKR(roomTotal)}</span></div>
            {roomDiscountValue > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", color: "green" }}><span>Discount {discountPercent > 0 ? (data?.discountType === 'fixed' ? '(Fixed)' : `(${discountPercent}%)`) : ''}:</span><span>-{formatPKR(roomDiscountValue)}</span></div>
            )}
            {halfDayAmount > 0 && <div style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", color: "#b45309" }}><span>{halfDayChargeName}:</span><span>{formatPKR(halfDayAmount)}</span></div>}
            <div style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", fontWeight: "600" }}><span>Balance Total:</span><span>{formatPKR(balanceTotal)}</span></div>
            {taxPercent > 0 && <div style={{ display: "flex", justifyContent: "space-between", padding: "5px 0" }}><span>GST {taxPercent}%{isTaxInclusive ? " (Incl.):" : ":"}</span><span>{formatPKR(roomTaxValue)}</span></div>}
          </>
        )}
        {totalExtras > 0 && <div style={{ display: "flex", justifyContent: "space-between", padding: "5px 0" }}><span>POS Items / Extras:</span><span>{formatPKR(totalExtras)}</span></div>}
        {posTax > 0 && <div style={{ display: "flex", justifyContent: "space-between", padding: "5px 0" }}><span>POS Tax:</span><span>{formatPKR(posTax)}</span></div>}
        {waivedAmount > 0 && <div style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", color: "orange" }}><span>Waived Amount:</span><span>-{formatPKR(waivedAmount)}</span></div>}
        <div style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", fontWeight: "bold", backgroundColor: "#eee" }}><span>Grand Total:</span><span>{formatPKR(grandTotal)}</span></div>
        {(mode !== "extras" || grossPaid > 0) && <div style={{ display: "flex", justifyContent: "space-between", padding: "5px 0" }}><span>Total Paid:</span><span>{formatPKR(grossPaid)}</span></div>}
        {refundedAmount > 0 && mode !== "extras" && (
          <div style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", color: "#ef4444" }}>
            <span>Refunded:</span>
            <span>-{formatPKR(refundedAmount)}</span>
          </div>
        )}
        {!isSale && (
          <div style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", fontWeight: "bold", color: balanceDue > 0 ? "#ef4444" : "#16a34a" }}>
            <span>Balance:</span>
            <span>{formatPKR(balanceDue)}</span>
          </div>
        )}
      </div>
      </div>

      {settings?.termsandcondition && (
        <TermsAndConditionsHTML htmlTerms={settings?.termsandcondition} />
      )}

      <div style={{ marginTop: "100px", display: "flex", justifyContent: "space-between" }}>
        <div style={{ borderTop: "1px solid #000", width: "150px", textAlign: "center" as const, fontWeight: "bold" }}>Cashier</div>
        <div style={{ borderTop: "1px solid #000", width: "150px", textAlign: "center" as const, fontWeight: "bold" }}>Guest</div>
      </div>
    </div>
  );
};

// =============================
// 3. THERMAL STANDARD (Compact & Clear)
// =============================
export const ThermalHTML: React.FC<InvoiceProps> = ({ data, settings, logo, location, mode = "all" }) => {
  const { roomTotal, totalExtras, tripsTotal, advancePaid, baseTotal, roomTaxValue, posTax, roomDiscountValue, grandTotal, discountPercent, taxPercent, roomBreakdown, trips, grossPaid, refundedAmount, isSale, isRoomsMode, isExtrasMode, isTaxInclusive, balanceDue, waivedAmount, totalGuests, halfDayAmount, halfDayChargeName, balanceTotal, statusDisplay, extrasList } = calculateInvoice(data, mode);

  return (
    <div style={{ width: "80mm", padding: "5mm", fontFamily: "monospace", fontSize: "12px", color: "#000" }}>
      <center>
        <img src={getLogoPath(location?.logo || logo)} width="80" alt="logo" />
        <h2 style={{ margin: "5px 0" }}>{location?.name || settings?.organization_name}  </h2>
        <p style={{ margin: "0", fontSize: "10px" }}>{location?.address}</p>
        <p style={{ margin: "0", fontSize: "10px" }}>Phone: {getContactPhone(location, settings)}</p>
        <p style={{ margin: "0", fontSize: "10px" }}>Email: {location?.contactEmail}</p>
        <p style={{ margin: "0", fontSize: "10px", fontWeight: "bold" }}>NTN: {getNTN(location, settings)}</p>
        <div style={{ margin: "10px 0", borderTop: "1px dashed #000" }}></div>
        <h3 style={{ margin: "5px 0" }}>CASH RECEIPT</h3>
      </center>

      <p>Date: {formatDate(new Date())}</p>
      <p>Inv: #{data?.refno}</p>
      <p>
        Guest: {data?.customer?.name}
        {data?.userMembership && (
          <span style={{ marginLeft: "5px", textTransform: "uppercase", fontSize: "10px" }}>
            ({data.userMembership.plan?.name || "Member"})
          </span>
        )}
      </p>
      <p>Total Guests: {totalGuests}</p>
      {statusDisplay && <p>Status: <b>{statusDisplay}</b></p>}
      {data?.rooms && data.rooms.length > 0 && mode !== "extras" && <p>Room: {data?.rooms?.map((r: any) => r.roomNo).join(", ")}</p>}

      <div style={{ margin: "10px 0", borderTop: "1px dashed #000" }}></div>

      {roomBreakdown.length > 0 ? (
        roomBreakdown.map((row: any, idx: number) => (
          <div key={`room-${idx}`} style={{ marginBottom: "5px" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Room {row.roomNo}</span>
              <span>{formatPKR(row.total)}</span>
            </div>
            <div style={{ fontSize: "10px" }}>{row.days} Nights @ {row.rate}</div>
          </div>
        ))
      ) : roomTotal > 0 && <div style={{ display: "flex", justifyContent: "space-between" }}><span>Room Rent</span><span>{formatPKR(roomTotal)}</span></div>}
      {mode !== "rooms" && extrasList.map((ex, i) => (
        <div key={i} style={{ marginBottom: "5px" }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span>{ex.name?.substring(0, 15) || ex.title?.substring(0, 15) || ex.names?.substring(0, 15)} x {ex.ReservationExtra?.quantity || ex.quantity || 1}{ex.returnedQuantity ? ` (Ret: ${ex.returnedQuantity})` : ""}</span>
            <span>{formatPKR(ex.ReservationExtra?.totalPrice || ex.totalPrice || (ex.price * ex.quantity))}</span>
          </div>
          <div style={{ fontSize: "10px" }}>
            {formatGroupedDates(ex.ReservationExtra?.addedDates || ex.addedDates, ex.ReservationExtra?.createdAt || ex.createdAt)}
          </div>
        </div>
      ))}
      {trips.map((trip: any, i: number) => (
        <div key={`trip-${i}`} style={{ marginBottom: "5px" }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span>TRIP: {trip.vehicle?.name?.substring(0, 10)}</span>
            <span>{formatPKR(trip.amount)}</span>
          </div>
          <div style={{ fontSize: "10px" }}>{formatDate(trip.startTime)} {trip.billingType?.toLowerCase()?.replace(/\s/g, "") === 'paynow' ? '(Paid)' : ''}</div>
        </div>
      ))}

      <div style={{ margin: "5px 0", borderTop: "1px dashed #000" }}></div>
      {!isSale && mode !== "extras" && (
        <>
          <div style={{ display: "flex", justifyContent: "space-between" }}><span>Room Rent Total</span><span>{formatPKR(roomTotal)}</span></div>
          {roomDiscountValue > 0 && (
            <div style={{ display: "flex", justifyContent: "space-between", color: "green" }}><span>Discount {discountPercent > 0 ? (data?.discountType === 'fixed' ? '(Fixed)' : `(${discountPercent}%)`) : ''}</span><span>-{formatPKR(roomDiscountValue)}</span></div>
          )}
          {halfDayAmount > 0 && <div style={{ display: "flex", justifyContent: "space-between", color: "#b45309" }}><span>{halfDayChargeName}</span><span>{formatPKR(halfDayAmount)}</span></div>}
          <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "bold" }}><span>Balance Total</span><span>{formatPKR(balanceTotal)}</span></div>
          {taxPercent > 0 && <div style={{ display: "flex", justifyContent: "space-between" }}><span>GST {taxPercent}%{isTaxInclusive ? " (Incl.)" : ""}</span><span>{formatPKR(roomTaxValue)}</span></div>}
        </>
      )}
      {totalExtras > 0 && <div style={{ display: "flex", justifyContent: "space-between" }}><span>POS Items / Extras</span><span>{formatPKR(totalExtras)}</span></div>}
      {posTax > 0 && <div style={{ display: "flex", justifyContent: "space-between" }}><span>POS Tax</span><span>{formatPKR(posTax)}</span></div>}
      {tripsTotal > 0 && <div style={{ display: "flex", justifyContent: "space-between" }}><span>Transport</span><span>{formatPKR(tripsTotal)}</span></div>}
      {waivedAmount > 0 && <div style={{ display: "flex", justifyContent: "space-between" }}><span>Waived Amount</span><span>-{formatPKR(waivedAmount)}</span></div>}
      <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "bold", fontSize: "14px" }}><span>Grand Total</span><span>{formatPKR(grandTotal)}</span></div>

      {mode !== "extras" && <div style={{ margin: "5px 0", borderTop: "1px dashed #000" }}></div>}
      {mode !== "extras" && <div style={{ display: "flex", justifyContent: "space-between" }}><span>Total Paid</span><span>{formatPKR(grossPaid)}</span></div>}
      {refundedAmount > 0 && mode !== "extras" && (
        <div style={{ display: "flex", justifyContent: "space-between", color: "#ef4444" }}>
          <span>Refunded</span>
          <span>-{formatPKR(refundedAmount)}</span>
        </div>
      )}
      {mode !== "extras" && !isSale && <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "bold", color: balanceDue > 0 ? "#ef4444" : "#16a34a" }}><span>Balance</span><span>{formatPKR(balanceDue)}</span></div>}

      {/* ── SIGNATURES ── */}
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: "35px", fontSize: "10px" }}>
        <div style={{ borderTop: "1px dashed #000", width: "70px", textAlign: "center" as const, paddingTop: "4px", fontWeight: "bold" }}>Cashier</div>
        <div style={{ borderTop: "1px dashed #000", width: "70px", textAlign: "center" as const, paddingTop: "4px", fontWeight: "bold" }}>Guest</div>
      </div>

      <center style={{ marginTop: "20px" }}>
        {settings?.termsandcondition && (
          <TermsAndConditionsHTML htmlTerms={settings?.termsandcondition} />
        )}
        <p>Thank you for staying with us!</p>
        <p style={{ fontSize: "10px" }}>Software by Unisoftwares (+92 304 5694733)</p>
      </center>
    </div>
  );
};

// =============================
// 4. A4 LUXURY (Dark Sidebar, Gold Accents)
// =============================
export const A4LuxuryHTML: React.FC<InvoiceProps> = ({ data, settings, logo, location, mode = "all" }) => {
  const {
    stayDays, roomTotal, advancePaid, totalExtras, tripsTotal, baseTotal, roomTaxValue, posTax, roomDiscountValue,
    grandTotal, taxPercent, discountPercent, roomRent, roomBreakdown, trips, grossPaid, refundedAmount, isSale, isRoomsMode, isExtrasMode, isTaxInclusive, balanceDue, waivedAmount, totalGuests, halfDayAmount, halfDayChargeName, balanceTotal, statusDisplay, extrasList, paymentsList
  } = calculateInvoice(data, mode);

  const black = "#111111";
  const white = "#FFFFFF";
  const offWhite = "#F8F8F8";
  const border = "#DDDDDD";
  const muted = "#888888";
  const text = "#222222";
  const light = "#F2F2F2";

  return (
    <div style={{
      width: "210mm",
      minHeight: "297mm",
      backgroundColor: white,
      fontFamily: "'Helvetica Neue', 'Arial', sans-serif",
      display: "flex",
      flexDirection: "column",
      color: text,
    }}>

      {/* ── HEADER ── */}
      <div style={{
        backgroundColor: black,
        padding: "32px 40px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
      }}>
        {/* Left: Hotel Branding */}
        <div>
          <img src={getLogoPath(location?.logo || logo)} alt="logo"
            style={{ height: "70px", marginBottom: "12px", filter: "brightness(0) invert(1)", display: "block" }} />
          <h1 style={{
            margin: 0, fontSize: "20px", fontWeight: "800",
            letterSpacing: "3px", textTransform: "uppercase" as const, color: white,
          }}>
            {location?.name || settings?.organization_name || "LE AURA GRAND"}
          </h1>
          <p style={{ margin: "8px 0 0 0", fontSize: "10px", color: "#888888", lineHeight: 1.7 }}>
            {location?.address}<br />
            Phone: {getContactPhone(location, settings)} &nbsp;|&nbsp; Email: {location?.contactEmail}<br />
            <span style={{ color: "#CCCCCC", fontWeight: "600" }}>NTN: {getNTN(location, settings)}</span>
          </p>
        </div>

        {/* Right: Invoice Number */}
        <div style={{ textAlign: "right" as const }}>
          <p style={{ margin: 0, fontSize: "11px", letterSpacing: "3px", textTransform: "uppercase" as const, color: muted }}>
            INVOICE
          </p>
          <p style={{ margin: "6px 0 0 0", fontSize: "32px", fontWeight: "800", color: white, letterSpacing: "-1px" }}>
            #{data?.refno}
          </p>
          <p style={{ margin: "6px 0 0 0", fontSize: "11px", color: "#AAAAAA" }}>
            {formatDate(data?.updatedAt || new Date())}
          </p>
        </div>
      </div>

      {/* ── GUEST + RESERVATION INFO BAR ── */}
      <div style={{
        display: "flex",
        borderBottom: `2px solid ${black}`,
        backgroundColor: offWhite,
      }}>
        {/* Guest */}
        <div style={{ flex: 1, padding: "20px 40px", borderRight: `1px solid ${border}` }}>
          <p style={{ margin: "0 0 8px 0", fontSize: "9px", letterSpacing: "2px", textTransform: "uppercase" as const, color: muted, fontWeight: "600" }}>
            Billed To
          </p>
          <p style={{ margin: "0 0 3px 0", fontSize: "14px", fontWeight: "700", color: black }}>
            {data?.customer?.name}
            {data?.userMembership && (
              <span style={{
                marginLeft: "8px",
                padding: "2px 6px",
                backgroundColor: white,
                color: black,
                border: `1px solid ${black}`,
                borderRadius: "2px",
                fontSize: "9px",
                letterSpacing: "1px"
              }}>
                {data.userMembership.plan?.name || "Member"}
              </span>
            )}
          </p>
          <p style={{ margin: "2px 0", fontSize: "10px", color: muted }}>{data?.customer?.phone}</p>
          <p style={{ margin: "2px 0", fontSize: "10px", color: muted }}>CNIC: {data?.customer?.cnic || "N/A"}</p>
          <p style={{ margin: "2px 0", fontSize: "10px", color: muted }}>Email: {data?.customer?.email || "N/A"}</p>
          {data?.group && <p style={{ margin: "2px 0", fontSize: "10px", color: muted }}>Group: {data?.group?.name}</p>}
        </div>

        {/* Reservation */}
        {data?.rooms && data.rooms.length > 0 && mode !== "extras" && (
          <div style={{ flex: 2, padding: "20px 40px", display: "flex", gap: "40px" }}>
            <div>
              <p style={{ margin: "0 0 8px 0", fontSize: "9px", letterSpacing: "2px", textTransform: "uppercase" as const, color: muted, fontWeight: "600" }}>
                Stay Details
              </p>
              {[
                ["Check-in", formatDate(data?.startDate)],
                ["Check-out", formatDate(data?.endDate)],
                ["Duration", `${stayDays} Night(s)`],
                ["Guests", `${totalGuests}`],
              ].map(([l, v]) => (
                <p key={l} style={{ margin: "4px 0", fontSize: "10px", color: text }}>
                  <span style={{ color: muted, minWidth: "70px", display: "inline-block" }}>{l}</span>
                  <span style={{ fontWeight: "600", color: black }}>{v}</span>
                </p>
              ))}
            </div>
            <div>
              <p style={{ margin: "0 0 8px 0", fontSize: "9px", letterSpacing: "2px", textTransform: "uppercase" as const, color: muted, fontWeight: "600" }}>
                Room Info
              </p>
              {[
                ["Room(s)", data?.rooms?.map((r: any) => r.roomNo).join(", ")],
                ["Type", data?.rooms?.[0]?.RoomType?.name || "Standard"],
                ["Channel", data?.channel === "refernce" ? "Reference" : data?.channel],
                ...(statusDisplay ? [["Status", statusDisplay]] : []),
              ].map(([l, v]) => (
                <p key={l} style={{ margin: "4px 0", fontSize: "10px", color: text }}>
                  <span style={{ color: muted, minWidth: "60px", display: "inline-block" }}>{l}</span>
                  <span style={{ fontWeight: "600", color: black }}>{v}</span>
                </p>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── ITEMS TABLE ── */}
      <div style={{ padding: "30px 40px 0 40px", flex: 1 }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ backgroundColor: black }}>
              {[
                ["Service Description", "left"],
                ["Qty / Nights", "center"],
                ["Unit Rate", "right"],
                ["Amount", "right"],
              ].map(([h, align]) => (
                <th key={h} style={{
                  padding: "11px 14px",
                  textAlign: align as any,
                  fontSize: "9px",
                  letterSpacing: "1.5px",
                  textTransform: "uppercase" as const,
                  color: white,
                  fontWeight: "600",
                }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {/* Room Rows Breakdown */}
            {roomBreakdown.length > 0 ? (
              roomBreakdown.map((row: any, idx: number) => (
                <tr key={`room-${idx}`} style={{ borderBottom: `1px solid ${border}` }}>
                  <td style={{ padding: "16px 14px" }}>
                    <p style={{ margin: 0, fontSize: "12px", fontWeight: "700", color: black }}>
                      Room {row.roomNo} ({row.roomType})
                    </p>
                    <p style={{ margin: "3px 0 0 0", fontSize: "10px", color: muted }}>
                      {formatDate(row.startDate)} to {formatDate(row.endDate)}
                    </p>
                  </td>
                  <td style={{ padding: "16px 14px", textAlign: "center", fontSize: "12px", color: text }}>
                    {row.days}
                  </td>
                  <td style={{ padding: "16px 14px", textAlign: "right", fontSize: "12px", color: text }}>
                    {formatPKR(row.rate)}
                  </td>
                  <td style={{ padding: "16px 14px", textAlign: "right", fontSize: "12px", fontWeight: "700", color: black }}>
                    {formatPKR(row.total)}
                  </td>
                </tr>
              ))
            ) : roomTotal > 0 && (
              <tr style={{ borderBottom: `1px solid ${border}` }}>
                <td style={{ padding: "16px 14px" }}>
                  <p style={{ margin: 0, fontSize: "12px", fontWeight: "700", color: black }}>
                    Room Accommodation
                  </p>
                  <p style={{ margin: "3px 0 0 0", fontSize: "10px", color: muted }}>
                    {roomRent?.[0]?.roomTypeName || "Standard Room"} — Rooms: {data?.rooms?.map((r: any) => r.roomNo).join(", ")}
                  </p>
                </td>
                <td style={{ padding: "16px 14px", textAlign: "center", fontSize: "12px", color: text }}>
                  {stayDays}
                </td>
                <td style={{ padding: "16px 14px", textAlign: "right", fontSize: "12px", color: text }}>
                  {stayDays > 0 ? formatPKR(roomTotal / stayDays) : "—"}
                </td>
                <td style={{ padding: "16px 14px", textAlign: "right", fontSize: "12px", fontWeight: "700", color: black }}>
                  {formatPKR(roomTotal)}
                </td>
              </tr>
            )}

            {/* Extras */}
            {mode !== "rooms" && extrasList.map((ex, i) => (
              <tr key={i} style={{ borderBottom: `1px solid ${border}`, backgroundColor: i % 2 === 0 ? offWhite : white }}>
                <td style={{ padding: "13px 14px", fontSize: "12px", color: text }}>
                  <div>{ex.name || ex.title || ex.names}</div>
                  <div style={{ fontSize: "9px", color: muted, marginTop: "3px" }}>
                    {formatGroupedDates(ex.ReservationExtra?.addedDates || ex.addedDates, ex.ReservationExtra?.createdAt || ex.createdAt)}
                  </div>
                </td>
                <td style={{ padding: "13px 14px", textAlign: "center", fontSize: "12px", color: text }}>
                  {ex.ReservationExtra?.quantity || ex.quantity || 1}
                  {ex.returnedQuantity ? ` (Ret: ${ex.returnedQuantity})` : ""}
                </td>
                <td style={{ padding: "13px 14px", textAlign: "right", fontSize: "12px", color: text }}>
                  {formatPKR(ex.price)}
                </td>
                <td style={{ padding: "13px 14px", textAlign: "right", fontSize: "12px", fontWeight: "700", color: black }}>
                  {formatPKR(ex.ReservationExtra?.totalPrice || ex.totalPrice || (ex.price * ex.quantity))}
                </td>
              </tr>
            ))}

            {trips.map((trip: any, i: number) => (
              <tr key={`trip-${i}`} style={{ borderBottom: `1px solid ${border}` }}>
                <td style={{ padding: "16px 14px" }}>
                  <p style={{ margin: 0, fontSize: "12px", fontWeight: "700", color: black }}>
                    Transport: {trip.vehicle?.name}
                  </p>
                  <p style={{ margin: "3px 0 0 0", fontSize: "10px", color: muted }}>
                    {formatDate(trip.startTime)} — {trip.purpose}
                  </p>
                </td>
                <td style={{ padding: "16px 14px", textAlign: "center", fontSize: "12px", color: text }}>
                  1 Trip
                </td>
                <td style={{ padding: "16px 14px", textAlign: "right", fontSize: "12px", color: text }}>
                  {formatPKR(trip.amount)}
                </td>
                <td style={{ padding: "16px 14px", textAlign: "right", fontSize: "12px", fontWeight: "700", color: black }}>
                  {formatPKR(trip.amount)} {trip.billingType?.toLowerCase() === 'paynow' && <div style={{ fontSize: '8px', color: 'orange' }}>PAY NOW</div>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* ── TOTALS & PAYMENTS ── */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginTop: "24px" }}>
          {paymentsList && paymentsList.length > 0 ? (
            <div style={{ width: "300px", paddingRight: "15px" }}>
              <div style={{ fontSize: "11px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "1px", color: black, borderBottom: `1px solid ${border}`, paddingBottom: "6px", marginBottom: "8px" }}>Payments Log</div>
              {paymentsList.map((p: any, idx: number) => (
                <div key={idx} style={{ padding: "6px 0", borderBottom: `1px solid ${border}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2px" }}>
                    <span style={{ fontSize: "11px", color: muted }}>{formatDateTime(p.createdAt || p.date)}</span>
                    <span style={{ fontSize: "11px", fontWeight: "700", color: "#16a34a" }}>{formatPKR(p.amount)}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "11px", fontWeight: "600", color: black }}>{getPaymentTypeLabel(p)}</span>
                    <span style={{ fontSize: "11px", color: muted }}>{getPaymentMethodLabel(p)}</span>
                  </div>
                  {p.note && p.note !== getPaymentTypeLabel(p) && (
                    <div style={{ fontSize: "10px", color: muted, marginTop: "1px" }}>{p.note}</div>
                  )}
                </div>
              ))}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "8px", paddingTop: "6px", borderTop: `1px dashed ${border}`, fontSize: "11px", fontWeight: "700" }}>
                <span style={{ color: black }}>Total Paid Amount</span>
                <span style={{ color: "#16a34a" }}>{formatPKR(paymentsList.reduce((sum: number, p: any) => sum + Number(p.amount || 0), 0))}</span>
              </div>
            </div>
          ) : (
            <div style={{ flex: 1 }} />
          )}
          <div style={{ width: "300px" }}>
            {[
              ...((!isSale && mode !== "extras") ? [
                ["Room Rent Total", formatPKR(roomTotal), null, false],
                ...(roomDiscountValue > 0 ? [[`Discount ${discountPercent > 0 ? (data?.discountType === 'fixed' ? '(Fixed)' : `(${discountPercent}%)`) : ''}`, `-${formatPKR(roomDiscountValue)}`, "#16a34a", false]] : []),
                ...(halfDayAmount > 0 ? [[halfDayChargeName, formatPKR(halfDayAmount), "#b45309", false]] : []),
                ["Balance Total", formatPKR(balanceTotal), null, true],
                ...(taxPercent > 0 ? [[`GST ${taxPercent}%${isTaxInclusive ? " (Incl.)" : ""}`, formatPKR(roomTaxValue), null, false]] : []),
              ] : []),
              totalExtras > 0 ? ["POS Items / Extras", formatPKR(totalExtras), null, false] : null,
              posTax > 0 ? ["POS Tax", formatPKR(posTax), null, false] : null,
              tripsTotal > 0 ? ["Transport", formatPKR(tripsTotal), null, false] : null,
              waivedAmount > 0 ? ["Waived Amount", `-${formatPKR(waivedAmount)}`, "#f97316", false] : null,
            ].filter(Boolean).map(([label, value, color, bold]: any) => (
              <div key={label} style={{
                display: "flex", justifyContent: "space-between",
                padding: "8px 0", fontSize: "12px",
                borderBottom: `1px solid ${border}`,
                fontWeight: bold ? "700" : "normal"
              }}>
                <span style={{ color: bold ? black : muted }}>{label}</span>
                <span style={{ color: color || text, fontWeight: bold ? "700" : "500" }}>{value}</span>
              </div>
            ))}

            {/* Grand Total */}
            <div style={{
              display: "flex", justifyContent: "space-between",
              padding: "14px 16px", marginTop: "10px",
              backgroundColor: black, borderRadius: "3px",
              fontSize: "14px", fontWeight: "800", color: white,
            }}>
              <span style={{ letterSpacing: "1px", textTransform: "uppercase" as const, fontSize: "11px" }}>Grand Total</span>
              <span>{formatPKR(grandTotal)}</span>
            </div>

            {(mode !== "extras" || grossPaid > 0) && (
              <div style={{
                display: "flex", justifyContent: "space-between",
                padding: "8px 0", fontSize: "12px", borderBottom: `1px solid ${border}`
              }}>
                <span style={{ color: muted }}>Total Paid</span>
                <span style={{ color: "#16a34a", fontWeight: "700" }}>{formatPKR(grossPaid)}</span>
              </div>
            )}
            {refundedAmount > 0 && mode !== "extras" && (
              <div style={{
                display: "flex", justifyContent: "space-between",
                padding: "8px 0", fontSize: "12px", borderBottom: `1px solid ${border}`
              }}>
                <span style={{ color: "#ef4444" }}>Amount Refunded</span>
                <span style={{ color: "#ef4444", fontWeight: "700" }}>-{formatPKR(refundedAmount)}</span>
              </div>
            )}
            {!isSale && (
              <div style={{
                display: "flex", justifyContent: "space-between",
                padding: "10px 0", fontSize: "13px", fontWeight: "800",
              }}>
                <span style={{ color: muted }}>Balance</span>
                <span style={{ color: balanceDue > 0 ? "#dc2626" : "#16a34a" }}>
                  {formatPKR(balanceDue)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* ── TERMS ── */}
        {settings?.termsandcondition && (
          <TermsAndConditionsHTML htmlTerms={settings?.termsandcondition} />
        )}

        {/* ── SIGNATURES ── */}
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: "50px", padding: "0 10px 20px 10px" }}>
          <div style={{ width: "160px", borderTop: `1px solid ${black}`, textAlign: "center" as const, paddingTop: "6px", fontSize: "11px", fontWeight: "bold", color: black }}>Cashier</div>
          <div style={{ width: "160px", borderTop: `1px solid ${black}`, textAlign: "center" as const, paddingTop: "6px", fontSize: "11px", fontWeight: "bold", color: black }}>Guest</div>
        </div>
      </div>

      {/* ── FOOTER ── */}
      <div style={{
        backgroundColor: black,
        padding: "14px 40px",
        marginTop: "auto",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}>
        <p style={{ margin: 0, fontSize: "9px", color: "#666666", letterSpacing: "1px", textTransform: "uppercase" as const }}>
          Thank you for choosing {location?.name || settings?.organization_name || "Le Aura Grand"}
        </p>
        <p style={{ margin: 0, fontSize: "9px", color: "#444444", letterSpacing: "1px" }}>
          Software by Unisoftwares (+92 304 5694733)
        </p>
      </div>
    </div>
  );
};

// =============================
// 5. A4 MINIMAL (Ultra-Clean, Contemporary)
// =============================
export const A4MinimalHTML: React.FC<InvoiceProps> = ({ data, settings, logo, location, mode = "all" }) => {
  const { stayDays, roomTotal, advancePaid, totalExtras, tripsTotal, baseTotal, roomTaxValue, posTax, roomDiscountValue, grandTotal, taxPercent, discountPercent, roomRent, roomBreakdown, trips, grossPaid, refundedAmount, isSale, isRoomsMode, isExtrasMode, isTaxInclusive, balanceDue, waivedAmount, halfDayAmount, halfDayChargeName, balanceTotal, statusDisplay, extrasList, paymentsList } = calculateInvoice(data, mode);

  const accent = "#2563EB";
  const white = "#FFFFFF";
  const dark = "#0F172A";
  const muted = "#94A3B8";
  const border = "#E2E8F0";
  const bg = "#FFFFFF";

  return (
    <div style={{ width: "210mm", minHeight: "297mm", padding: "48px 52px", backgroundColor: bg, fontFamily: "'Helvetica Neue', Arial, sans-serif", color: dark, boxSizing: "border-box" }}>

      {/* TOP BAR */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "48px" }}>
        <div>
          <img src={getLogoPath(location?.logo || logo)} alt="logo" style={{ height: "38px", marginBottom: "10px", display: "block" }} />
          <p style={{ margin: 0, fontSize: "18px", fontWeight: "700", letterSpacing: "-0.3px", color: dark }}>{location?.name || settings?.organization_name || "LE AURA GRAND"}</p>
          <p style={{ margin: "3px 0 0 0", fontSize: "10px", color: muted }}>{location?.address}</p>
          <p style={{ margin: "1px 0", fontSize: "10px", color: muted }}>{getContactPhone(location, settings)} · {location?.contactEmail}</p>
          <p style={{ margin: "1px 0", fontSize: "10px", color: "#334155", fontWeight: "600" }}>NTN: {getNTN(location, settings)}</p>
        </div>
        <div style={{ textAlign: "right" as const }}>
          <p style={{ margin: 0, fontSize: "11px", fontWeight: "600", color: accent, textTransform: "uppercase" as const, letterSpacing: "2px" }}>Invoice</p>
          <p style={{ margin: "4px 0 2px 0", fontSize: "26px", fontWeight: "800", color: dark, letterSpacing: "-1px" }}>#{data?.refno}</p>
          <p style={{ margin: 0, fontSize: "10px", color: muted }}>{formatDate(data?.updatedAt || new Date())}</p>
        </div>
      </div>

      {/* FULL-WIDTH DIVIDER */}
      <div style={{ height: "2px", backgroundColor: dark, marginBottom: "32px" }}></div>

      {/* BILLING + STAY INFO — 3 COLUMNS */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "24px", marginBottom: "36px" }}>
        <div>
          <p style={{ fontSize: "9px", textTransform: "uppercase" as const, letterSpacing: "1.5px", color: accent, margin: "0 0 8px 0", fontWeight: "600" }}>Billed To</p>
          <p style={{ fontSize: "13px", fontWeight: "700", margin: "0 0 4px 0", color: dark }}>
            {data?.customer?.name}
            {data?.userMembership && (
              <span style={{
                marginLeft: "8px",
                padding: "1px 6px",
                backgroundColor: accent,
                color: white,
                borderRadius: "3px",
                fontSize: "9px",
                fontWeight: "600"
              }}>
                {data.userMembership.plan?.name || "Member"}
              </span>
            )}
          </p>
          <p style={{ fontSize: "10px", color: muted, margin: "2px 0" }}>{data?.customer?.phone}</p>
          <p style={{ fontSize: "10px", color: muted, margin: "2px 0" }}>CNIC: {data?.customer?.cnic || "N/A"}</p>
          <p style={{ fontSize: "10px", color: muted, margin: "2px 0" }}>Email: {data?.customer?.email || "N/A"}</p>
          {data?.group && <p style={{ fontSize: "10px", color: muted, margin: "2px 0" }}>Group: {data?.group?.name}</p>}
        </div>
        {data?.rooms && data.rooms.length > 0 && mode !== "extras" && (
          <>
            <div>
              <p style={{ fontSize: "9px", textTransform: "uppercase" as const, letterSpacing: "1.5px", color: accent, margin: "0 0 8px 0", fontWeight: "600" }}>Stay Period</p>
              <p style={{ fontSize: "12px", fontWeight: "600", margin: "0 0 4px 0", color: dark }}>{formatDate(data?.startDate)}</p>
              <p style={{ fontSize: "10px", color: muted, margin: "0 0 4px 0" }}>to {formatDate(data?.endDate)}</p>
              <p style={{ fontSize: "12px", fontWeight: "700", color: dark, margin: "4px 0 0 0" }}>{stayDays} Night(s)</p>
              <p style={{ fontSize: "10px", color: dark, margin: "4px 0 0 0", fontWeight: "600" }}>{totalGuests} Guest(s)</p>
            </div>
            <div>
              <p style={{ fontSize: "9px", textTransform: "uppercase" as const, letterSpacing: "1.5px", color: accent, margin: "0 0 8px 0", fontWeight: "600" }}>Room Details</p>
              <p style={{ fontSize: "12px", fontWeight: "600", margin: "0 0 4px 0", color: dark }}>{data?.rooms?.map((r: any) => r.roomNo).join(", ")}</p>
              <p style={{ fontSize: "10px", color: muted, margin: "2px 0" }}>{data?.rooms?.[0]?.RoomType?.name || "Standard Room"}</p>
              <p style={{ fontSize: "10px", color: muted, margin: "2px 0" }}>via {data?.channel === "refernce" ? "Reference" : data?.channel}</p>
              {statusDisplay && <p style={{ fontSize: "11px", color: accent, margin: "4px 0 0 0", fontWeight: "700" }}>Status: {statusDisplay}</p>}
            </div>
          </>
        )}
      </div>

      {/* ITEMS TABLE */}
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ borderBottom: `2px solid ${dark}` }}>
            <th style={{ textAlign: "left", padding: "10px 0", fontSize: "9px", textTransform: "uppercase" as const, letterSpacing: "1.5px", color: muted, fontWeight: "600" }}>Description</th>
            <th style={{ textAlign: "center", padding: "10px 0", fontSize: "9px", textTransform: "uppercase" as const, letterSpacing: "1.5px", color: muted, fontWeight: "600" }}>Qty</th>
            <th style={{ textAlign: "right", padding: "10px 0", fontSize: "9px", textTransform: "uppercase" as const, letterSpacing: "1.5px", color: muted, fontWeight: "600" }}>Amount</th>
          </tr>
        </thead>
        <tbody>
          {roomBreakdown.length > 0 ? (
            roomBreakdown.map((row: any, idx: number) => (
              <tr key={`room-${idx}`} style={{ borderBottom: `1px solid ${border}` }}>
                <td style={{ padding: "14px 0", fontSize: "12px", color: dark }}>
                  <span style={{ fontWeight: "600" }}>Room {row.roomNo} ({row.roomType})</span>
                  <span style={{ display: "block", fontSize: "10px", color: muted, marginTop: "2px" }}>{formatDate(row.startDate)} to {formatDate(row.endDate)}</span>
                </td>
                <td style={{ padding: "14px 0", textAlign: "center", fontSize: "12px", color: dark }}>{row.days}</td>
                <td style={{ padding: "14px 0", textAlign: "right", fontSize: "12px", fontWeight: "700", color: dark }}>{formatPKR(row.total)}</td>
              </tr>
            ))
          ) : roomTotal > 0 && (
            <tr style={{ borderBottom: `1px solid ${border}` }}>
              <td style={{ padding: "14px 0", fontSize: "12px", color: dark }}>
                <span style={{ fontWeight: "600" }}>Room Accommodation</span>
                <span style={{ display: "block", fontSize: "10px", color: muted, marginTop: "2px" }}>{roomRent?.[0]?.roomTypeName || "Standard"}</span>
              </td>
              <td style={{ padding: "14px 0", textAlign: "center", fontSize: "12px", color: dark }}>{stayDays}</td>
              <td style={{ padding: "14px 0", textAlign: "right", fontSize: "12px", fontWeight: "700", color: dark }}>{formatPKR(roomTotal)}</td>
            </tr>
          )}
          {mode !== "rooms" && extrasList.map((ex, i) => (
            <tr key={i} style={{ borderBottom: `1px solid ${border}` }}>
              <td style={{ padding: "12px 0", fontSize: "12px", color: dark }}>{ex.name || ex.title || ex.names}</td>
              <td style={{ padding: "12px 0", textAlign: "center", fontSize: "12px", color: dark }}>
                {ex.ReservationExtra?.quantity || ex.quantity || 1}
                {ex.returnedQuantity ? ` (Ret: ${ex.returnedQuantity})` : ""}
              </td>
              <td style={{ padding: "12px 0", textAlign: "right", fontSize: "12px", fontWeight: "700", color: dark }}>{formatPKR(ex.ReservationExtra?.totalPrice || ex.totalPrice || (ex.price * ex.quantity))}</td>
            </tr>
          ))}
          {trips.map((trip: any, i: number) => (
            <tr key={`trip-${i}`} style={{ borderBottom: `1px solid ${border}` }}>
              <td style={{ padding: "14px 0", fontSize: "12px", color: dark }}>
                <span style={{ fontWeight: "600" }}>Transport: {trip.vehicle?.name}</span>
                <span style={{ display: "block", fontSize: "10px", color: muted, marginTop: "2px" }}>{formatDate(trip.startTime)} · {trip.purpose}</span>
              </td>
              <td style={{ padding: "14px 0", textAlign: "center", fontSize: "12px", color: dark }}>1 Trip {trip.billingType?.toLowerCase() === 'paynow' && <span style={{ fontSize: '8px', color: accent }}>(PAID)</span>}</td>
              <td style={{ padding: "14px 0", textAlign: "right", fontSize: "12px", fontWeight: "700", color: dark }}>{formatPKR(trip.amount)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* SUMMARY & PAYMENTS BLOCK */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginTop: "24px" }}>
        {paymentsList && paymentsList.length > 0 ? (
          <div style={{ width: "300px", paddingRight: "15px" }}>
            <div style={{ fontSize: "11px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "1px", color: dark, borderBottom: `1px solid ${border}`, paddingBottom: "6px", marginBottom: "8px" }}>Payments Log</div>
            {paymentsList.map((p: any, idx: number) => (
              <div key={idx} style={{ padding: "6px 0", borderBottom: `1px solid ${border}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2px" }}>
                  <span style={{ fontSize: "11px", color: muted }}>{formatDateTime(p.createdAt || p.date)}</span>
                  <span style={{ fontSize: "11px", fontWeight: "700", color: "#16a34a" }}>{formatPKR(p.amount)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "11px", fontWeight: "600", color: dark }}>{getPaymentTypeLabel(p)}</span>
                  <span style={{ fontSize: "11px", color: muted }}>{getPaymentMethodLabel(p)}</span>
                </div>
                {p.note && p.note !== getPaymentTypeLabel(p) && (
                  <div style={{ fontSize: "10px", color: muted, marginTop: "1px" }}>{p.note}</div>
                )}
              </div>
            ))}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "8px", paddingTop: "6px", borderTop: `1px dashed ${border}`, fontSize: "11px", fontWeight: "700" }}>
              <span style={{ color: dark }}>Total Paid Amount</span>
              <span style={{ color: "#16a34a" }}>{formatPKR(paymentsList.reduce((sum: number, p: any) => sum + Number(p.amount || 0), 0))}</span>
            </div>
          </div>
        ) : (
          <div style={{ flex: 1 }} />
        )}
        <div style={{ width: "290px" }}>
          {!isSale && mode !== "extras" && (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", fontSize: "11px", borderBottom: `1px solid ${border}` }}>
                <span style={{ color: muted }}>Room Rent Total</span>
                <span style={{ fontWeight: "600", color: dark }}>{formatPKR(roomTotal)}</span>
              </div>
              {roomDiscountValue > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", fontSize: "11px", borderBottom: `1px solid ${border}` }}>
                  <span style={{ color: muted }}>Discount {discountPercent > 0 ? (data?.discountType === 'fixed' ? '(Fixed)' : `(${discountPercent}%)`) : ''}</span>
                  <span style={{ fontWeight: "600", color: "#16a34a" }}>-{formatPKR(roomDiscountValue)}</span>
                </div>
              )}
              {halfDayAmount > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", fontSize: "11px", borderBottom: `1px solid ${border}`, color: "#b45309" }}>
                  <span style={{ color: "#b45309" }}>{halfDayChargeName}</span>
                  <span style={{ fontWeight: "600" }}>{formatPKR(halfDayAmount)}</span>
                </div>
              )}
              <div style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", fontSize: "11px", borderBottom: `1px solid ${border}`, fontWeight: "700" }}>
                <span style={{ color: dark }}>Balance Total</span>
                <span style={{ fontWeight: "700", color: dark }}>{formatPKR(balanceTotal)}</span>
              </div>
              {taxPercent > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", fontSize: "11px", borderBottom: `1px solid ${border}` }}>
                  <span style={{ color: muted }}>GST {taxPercent}%{isTaxInclusive ? " (Incl.)" : ""}</span>
                  <span style={{ fontWeight: "600", color: dark }}>{formatPKR(roomTaxValue)}</span>
                </div>
              )}
            </>
          )}
          {totalExtras > 0 && (
            <div style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", fontSize: "11px", borderBottom: `1px solid ${border}` }}>
              <span style={{ color: muted }}>POS Items / Extras</span>
              <span style={{ fontWeight: "600", color: dark }}>{formatPKR(totalExtras)}</span>
            </div>
          )}
          {posTax > 0 && (
            <div style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", fontSize: "11px", borderBottom: `1px solid ${border}` }}>
              <span style={{ color: muted }}>POS Tax</span>
              <span style={{ fontWeight: "600", color: dark }}>{formatPKR(posTax)}</span>
            </div>
          )}
          {tripsTotal > 0 && (
            <div style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", fontSize: "11px", borderBottom: `1px solid ${border}` }}>
              <span style={{ color: muted }}>Transport</span>
              <span style={{ fontWeight: "600", color: dark }}>{formatPKR(tripsTotal)}</span>
            </div>
          )}
          {waivedAmount > 0 && (
            <div style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", fontSize: "11px", borderBottom: `1px solid ${border}` }}>
              <span style={{ color: muted }}>Waived Amount</span>
              <span style={{ fontWeight: "600", color: "#f97316" }}>-{formatPKR(waivedAmount)}</span>
            </div>
          )}
          <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 14px", marginTop: "10px", backgroundColor: dark, borderRadius: "4px" }}>
            <span style={{ fontSize: "11px", fontWeight: "700", color: "#fff", textTransform: "uppercase" as const, letterSpacing: "0.5px" }}>Grand Total</span>
            <span style={{ fontSize: "13px", fontWeight: "800", color: "#fff" }}>{formatPKR(grandTotal)}</span>
          </div>
          {(mode !== "extras" || grossPaid > 0) && (
            <div style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", fontSize: "11px", borderBottom: `1px solid ${border}` }}>
              <span style={{ color: muted }}>Total Paid</span>
              <span style={{ fontWeight: "600", color: "#16a34a" }}>{formatPKR(grossPaid)}</span>
            </div>
          )}
          {!isSale && (
            <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", fontSize: "12px" }}>
              <span style={{ fontWeight: "700", color: balanceDue > 0 ? "#dc2626" : "#16a34a" }}>Balance</span>
              <span style={{ fontWeight: "800", color: balanceDue > 0 ? "#dc2626" : "#16a34a" }}>{formatPKR(balanceDue)}</span>
            </div>
          )}
        </div>
      </div>

      {/* BOTTOM SECTION */}
      <div style={{ marginTop: "36px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", alignItems: "flex-end" }}>
        {settings?.termsandcondition && (
          <div
            style={{
              fontSize: "9px",
              color: muted,
              lineHeight: 1.8,
              borderLeft: `2px solid ${border}`,
              paddingLeft: "12px",
            }}
          >
            <p
              style={{
                fontWeight: "700",
                color: dark,
                fontSize: "10px",
                margin: "0 0 4px 0",
              }}
            >
              Terms & Conditions
            </p>

            <TermsAndConditionsHTML title="" containerStyle={{}} />
          </div>
        )}
        <div style={{ display: "flex", justifyContent: "space-between", gap: "20px" }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ width: "90px", height: "1px", backgroundColor: dark, marginBottom: "5px" }}></div>
            <p style={{ fontSize: "10px", fontWeight: "bold", color: dark, margin: 0 }}>Cashier</p>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ width: "90px", height: "1px", backgroundColor: dark, marginBottom: "5px" }}></div>
            <p style={{ fontSize: "10px", fontWeight: "bold", color: dark, margin: 0 }}>Guest</p>
          </div>
        </div>
      </div>

      <div style={{ marginTop: "28px", height: "3px", background: `linear-gradient(90deg, ${accent} 0%, ${dark} 100%)`, borderRadius: "2px" }}></div>
      <p style={{ fontSize: "9px", color: muted, margin: "8px 0 0 0", textAlign: "center" as const }}>
        Thank you for choosing {location?.name || settings?.organization_name || "Le Aura Grand"} · Software by Unisoftwares (+92 304 5694733)
      </p>
    </div>
  );
};

// =============================
// 6. THERMAL PREMIUM (Structured & Polished)
// =============================
export const ThermalPremiumHTML: React.FC<InvoiceProps> = ({ data, settings, logo, location, mode = "all" }) => {
  const { stayDays, roomTotal, totalExtras, advancePaid, tripsTotal, baseTotal, roomTaxValue, posTax, roomDiscountValue, grandTotal, roomBreakdown, trips, grossPaid, refundedAmount, isSale, isRoomsMode, isExtrasMode, taxPercent, discountPercent, isTaxInclusive, balanceDue, waivedAmount, totalGuests, halfDayAmount, halfDayChargeName, balanceTotal, statusDisplay, extrasList } = calculateInvoice(data, mode);

  const lineStyle = { display: "flex", justifyContent: "space-between", marginBottom: "3px", fontSize: "11px" };
  const boldLineStyle = { display: "flex", justifyContent: "space-between", marginBottom: "3px", fontSize: "12px", fontWeight: "bold" };

  return (
    <div style={{ width: "80mm", padding: "6mm 5mm", fontFamily: "'Courier New', Courier, monospace", fontSize: "11px", color: "#000", backgroundColor: "#fff" }}>

      {/* HEADER */}
      <div style={{ textAlign: "center", marginBottom: "8px" }}>
        <img src={getLogoPath(location?.logo || logo)} width="44" alt="logo" style={{ display: "block", margin: "0 auto 6px auto" }} />
        <div style={{ fontSize: "14px", fontWeight: "bold", letterSpacing: "1px", textTransform: "uppercase" as const }}>{location?.name || settings?.organization_name || "LE AURA GRAND"}</div>
        <div style={{ fontSize: "9px", marginTop: "2px", color: "#444" }}>{location?.address}</div>
        <div style={{ fontSize: "9px", color: "#444" }}>{getContactPhone(location, settings)}</div>
        <div style={{ fontSize: "9px", color: "#222", fontWeight: "bold" }}>NTN: {getNTN(location, settings)}</div>
      </div>

      {/* DIVIDER */}
      <div style={{ textAlign: "center" as const, fontSize: "10px", letterSpacing: "2px", margin: "6px 0" }}>{"━".repeat(24)}</div>

      {/* RECEIPT TITLE */}
      <div style={{ textAlign: "center" as const, fontWeight: "bold", fontSize: "13px", marginBottom: "6px", letterSpacing: "2px" }}>OFFICIAL RECEIPT</div>
      <div style={{ textAlign: "center" as const, fontSize: "9px", letterSpacing: "1px", marginBottom: "8px", color: "#555" }}>{"─".repeat(30)}</div>

      {/* INVOICE META */}
      <div style={lineStyle}><span>Invoice No:</span><span style={{ fontWeight: "bold" }}>#{data?.refno}</span></div>
      <div style={lineStyle}><span>Date:</span><span>{formatDate(new Date())}</span></div>
      <div style={lineStyle}><span>Guest:</span><span style={{ fontWeight: "bold" }}>{data?.customer?.name}</span></div>
      <div style={lineStyle}><span>Phone:</span><span>{data?.customer?.phone}</span></div>
      <div style={lineStyle}><span>CNIC:</span><span>{data?.customer?.cnic || "N/A"}</span></div>
      <div style={lineStyle}><span>Email:</span><span>{data?.customer?.email || "N/A"}</span></div>

      <div style={{ textAlign: "center" as const, fontSize: "9px", letterSpacing: "1px", margin: "8px 0" }}>{"─".repeat(30)}</div>

      {/* STAY INFO */}
      {data?.rooms && data.rooms.length > 0 && mode !== "extras" && (
        <>
          <div style={lineStyle}><span>Room(s):</span><span>{data?.rooms?.map((r: any) => r.roomNo).join(", ")}</span></div>
          <div style={lineStyle}><span>Check-in:</span><span>{formatDate(data?.startDate)}</span></div>
          <div style={lineStyle}><span>Check-out:</span><span>{formatDate(data?.endDate)}</span></div>
          <div style={lineStyle}><span>Duration:</span><span>{stayDays} Night(s)</span></div>
          <div style={lineStyle}><span>Guests:</span><span>{totalGuests}</span></div>
          {statusDisplay && <div style={lineStyle}><span>Status:</span><span style={{ fontWeight: "bold" }}>{statusDisplay}</span></div>}
        </>
      )}

      <div style={{ textAlign: "center" as const, fontSize: "9px", letterSpacing: "1px", margin: "8px 0" }}>{"─".repeat(30)}</div>

      {/* CHARGES */}
      <div style={{ fontWeight: "bold", fontSize: "10px", textTransform: "uppercase" as const, letterSpacing: "1px", marginBottom: "5px" }}>Charges</div>
      {roomTotal > 0 && <div style={lineStyle}><span>Room Rent</span><span>{formatPKR(roomTotal)}</span></div>}
      {mode !== "rooms" && extrasList.map((ex, i) => (
        <div key={i} style={lineStyle}>
          <span style={{ maxWidth: "100px", overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>
            {ex?.name?.substring(0, 16) || ex?.title?.substring(0, 16)} x {ex.ReservationExtra?.quantity || ex.quantity || 1}
            {ex.returnedQuantity ? ` (Ret: ${ex.returnedQuantity})` : ""}
          </span>
          <span>{formatPKR(ex.ReservationExtra?.totalPrice || ex.totalPrice || (ex.price * ex.quantity))}</span>
        </div>
      ))}

      <div style={{ textAlign: "center" as const, fontSize: "9px", letterSpacing: "1px", margin: "8px 0" }}>{"─".repeat(30)}</div>

      {/* TOTALS */}
      {!isSale && mode !== "extras" && (
        <>
          <div style={lineStyle}><span>Room Rent Total</span><span>{formatPKR(roomTotal)}</span></div>
          {roomDiscountValue > 0 && (
            <div style={{ ...lineStyle, color: "green" }}><span>Discount {discountPercent > 0 ? (data?.discountType === 'fixed' ? '(Fixed)' : `(${discountPercent}%)`) : ''}</span><span>-{formatPKR(roomDiscountValue)}</span></div>
          )}
          {halfDayAmount > 0 && <div style={{ ...lineStyle, color: "#b45309" }}><span>{halfDayChargeName}</span><span>{formatPKR(halfDayAmount)}</span></div>}
          <div style={{ ...lineStyle, fontWeight: "bold" }}><span>Balance Total</span><span>{formatPKR(balanceTotal)}</span></div>
          {taxPercent > 0 && <div style={lineStyle}><span>GST {taxPercent}%{isTaxInclusive ? " (Incl.)" : ""}</span><span>{formatPKR(roomTaxValue)}</span></div>}
        </>
      )}
      {posTax > 0 && <div style={lineStyle}><span>POS Tax</span><span>{formatPKR(posTax)}</span></div>}
      {waivedAmount > 0 && <div style={lineStyle}><span>Waived Amount</span><span>-{formatPKR(waivedAmount)}</span></div>}

      <div style={{ textAlign: "center" as const, fontSize: "9px", letterSpacing: "1px", margin: "6px 0" }}>{"━".repeat(24)}</div>

      <div style={boldLineStyle}><span>GRAND TOTAL</span><span>{formatPKR(grandTotal)}</span></div>

      {mode !== "extras" && <div style={{ textAlign: "center" as const, fontSize: "9px", letterSpacing: "1px", margin: "6px 0" }}>{"─".repeat(30)}</div>}

      {mode !== "extras" && <div style={lineStyle}><span>Total Paid</span><span>{formatPKR(grossPaid)}</span></div>}
      {mode !== "extras" && !isSale && <div style={{ ...boldLineStyle, color: balanceDue > 0 ? "#dc2626" : "#16a34a" }}><span>BALANCE</span><span>{formatPKR(balanceDue)}</span></div>}

      <div style={{ textAlign: "center" as const, fontSize: "9px", letterSpacing: "1px", margin: "8px 0" }}>{"─".repeat(30)}</div>

      {/* T&C */}
      {settings?.termsandcondition && (
        <div
          style={{
            fontSize: "9px",
            color: muted,
            lineHeight: 1.8,
            borderLeft: `2px solid ${border}`,
            paddingLeft: "12px",
          }}
        >
          <p
            style={{
              fontWeight: "700",
              color: dark,
              fontSize: "10px",
              margin: "0 0 4px 0",
            }}
          >
            Terms & Conditions
          </p>

          <TermsAndConditionsHTML title="" containerStyle={{}} />
        </div>
      )}

      <div style={{ textAlign: "center" as const, fontSize: "9px", letterSpacing: "1px", margin: "6px 0" }}>{"━".repeat(24)}</div>

      {/* FOOTER */}
      <div style={{ textAlign: "center" as const }}>
        <div style={{ fontSize: "11px", fontWeight: "bold", marginBottom: "3px" }}>Thank You!</div>
        <div style={{ fontSize: "9px", color: "#555", marginBottom: "4px" }}>We hope to see you again.</div>

        {/* Signature line */}
        <div style={{ marginTop: "20px", display: "flex", justifyContent: "space-between", fontSize: "9px" }}>
          <div style={{ width: "65px", textAlign: "center" as const }}>
            <div style={{ borderBottom: "1px solid #000", width: "100%", marginBottom: "3px" }}></div>
            <div style={{ fontWeight: "bold", color: "#000" }}>Cashier</div>
          </div>
          <div style={{ width: "65px", textAlign: "center" as const }}>
            <div style={{ borderBottom: "1px solid #000", width: "100%", marginBottom: "3px" }}></div>
            <div style={{ fontWeight: "bold", color: "#000" }}>Guest</div>
          </div>
        </div>

        <div style={{ marginTop: "10px", fontSize: "8px", color: "#aaa" }}>Software by Unisoftwares (+92 304 5694733)</div>
      </div>
    </div>
  );
};

// =============================
// TEMPLATE REGISTRY
// =============================
export const templates: Record<string, React.FC<InvoiceProps>> = {
  a4_modern: A4ModernHTML,
  a4_classic: A4ClassicHTML,
  thermal_standard: ThermalHTML,
  a4_luxury: A4LuxuryHTML,
  a4_minimal: A4MinimalHTML,
  thermal_premium: ThermalPremiumHTML,
};

export default templates;
