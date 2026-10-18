//@ts-nocheck
import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer";
import DefaultLogo from "../../assets/logo.png";
import { TermsAndConditionsPDF } from "./TermsAndConditionsPDF";
const getLogoPath = (logo?: any) => {
    let src = logo;
    if (logo) {
        if (typeof logo === 'object' && logo.src) src = logo.src;
    } else {
        src = DefaultLogo?.src || DefaultLogo;
    }

    if (typeof src === 'string') {
        if (src.startsWith('/')) {
            let origin = '';
            if (typeof window !== 'undefined' && window.location) {
                origin = window.location.origin;
            } else if (typeof self !== 'undefined' && self.location) {
                origin = self.location.origin;
            }
            if (origin) {
                src = origin + src;
            }
        } else if (src.startsWith('http')) {
            const separator = src.includes('?') ? '&' : '?';
            src = src + separator + `cb=${new Date().getTime()}`;
        }
        return src;
    }
    return src;
};

// Helper to format currency
const formatPKR = (amount) => {
    return new Intl.NumberFormat('en-PK', {
        style: 'currency',
        currency: 'PKR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    }).format(amount || 0);
};

const formatDate = (date) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("en-GB");
};

const formatDateTime = (date) => {
    if (!date) return "-";
    const d = new Date(date);
    if (isNaN(d.getTime())) return String(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    let hours = d.getHours();
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    const strHours = String(hours).padStart(2, '0');
    return `${day}/${month}/${year} ${strHours}:${minutes} ${ampm}`;
};

const getPaymentTypeLabel = (p) => {
    if (p.isAdvance || p.isOpeningBalance) return 'Advance';
    if (p.saleId != null || p.isPos) return 'POS / Extras';
    if (p.tripId != null || p.isTrip) return 'Transport';
    if (p.note && typeof p.note === 'string' && p.note.trim() && p.note.trim().length <= 25) return p.note.trim();
    return 'Room Payment';
};

const getPaymentMethodLabel = (p) => {
    const m = String(p.method || p.paymentMode || 'Cash').toUpperCase();
    const bank = p.bank_name ? ` (${p.bank_name})` : '';
    return `${m}${bank}`;
};

const getContactPhone = (location, settings) => {
    if (location?.contactPhone && location.contactPhone !== "+92 51 1234567") {
        return location.contactPhone;
    }
    return settings?.organization_phone || "+92 300 4333458";
};

const getNTN = (location, settings) => {
    return location?.ntn || settings?.ntn_number || settings?.ntn || "7464220-7";
};

const stripHtml = (html) => {
    if (!html) return "";
    return html.replace(/<[^>]*>?/gm, '');
};

const decodeHtmlText = (text = "") =>
    text
        .replace(/&nbsp;/g, " ")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">");

const parseTermsHtmlToListRows = (html) => {
    // Legacy parser no longer used since terms are hardcoded.
    return [];
};


export const calculateInvoice = (data, mode = "all") => {
    const safeParseJSON = (value) => {
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

    const calculateDays = (start, end) => {
        if (!start || !end) return 1;
        const startDate = new Date(start);
        const endDate = new Date(end);
        const diff = endDate - startDate;
        return Math.max(Math.ceil(diff / (1000 * 60 * 60 * 24)), 1);
    };

    const roomRent = safeParseJSON(data?.roomRent) || [];

    // ROOM BREAKDOWN
    const roomBreakdown = (data?.reservationRooms && data.reservationRooms.length > 0)
        ? data.reservationRooms.map((rr) => {
            const room = (data?.rooms || []).find((r) => Number(r.id) === Number(rr.assignedRoomId));
            const rStart = rr.startDate || data?.startDate;
            const rEnd = rr.endDate || data?.endDate;
            const rDays = calculateDays(rStart, rEnd);
            let rRate = Number(rr.pricePerDay || 0);
            if (rRate === 0 && Array.isArray(roomRent) && roomRent.length > 0) {
                const rentItem = roomRent.find((rent) => String(rent.assignedRoomId || rent.id || rent.roomNo) === String(rr.assignedRoomId || room?.roomNo));
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
        : (data?.rooms || []).map((room) => {
            const resRoom = room.ReservationRoom || {};
            const rStart = resRoom.startDate || data?.startDate;
            const rEnd = resRoom.endDate || data?.endDate;
            const rDays = calculateDays(rStart, rEnd);
            let rRate = Number(resRoom.pricePerDay || 0);
            if (rRate === 0 && Array.isArray(roomRent) && roomRent.length > 0) {
                const rentItem = roomRent.find((rent) => String(rent.assignedRoomId || rent.id || rent.roomNo) === String(room.id || room.roomNo));
                if (rentItem && rentItem.rate) {
                    rRate = Number(rentItem.rate);
                }
            }
            const rTotal = rRate * rDays;
            const cleanRoomNo = room.roomNo ? String(room.roomNo).replace(/^room\s*/i, '') : '';
            return { roomNo: cleanRoomNo, roomType: room?.RoomType?.name || "Room", startDate: rStart, endDate: rEnd, days: rDays, rate: rRate, total: rTotal };
        });

    const roomTotalComputed = roomBreakdown.reduce((sum, r) => sum + r.total, 0);
    const stayDays = calculateDays(data?.startDate, data?.endDate);
    const discountPercent = mode === "extras" ? 0 : Number(data?.discount || 0);
    const taxPercent = mode === "extras" ? 0 : Number(data?.taxAmount || 0);

    let roomRateTotal = 0;
    if (Array.isArray(roomRent)) {
        roomRateTotal = roomRent.reduce((sum, r) => sum + (Number(r.rate) * (Number(r.count) || 1)), 0);
    }
    const legacyRoomTotal = roomRateTotal * stayDays;
    const currentRoomTotal = roomTotalComputed > 0 ? roomTotalComputed : (isNaN(legacyRoomTotal) ? 0 : legacyRoomTotal);

    const extrasTotal = (data?.extras || []).reduce((sum, e) => sum + Number(e?.ReservationExtra?.totalPrice || 0), 0);
    const customExtrasTotal = (data?.customExtras || []).reduce((sum, e) => sum + Number(e?.totalPrice || (e?.price || 0) * (e?.quantity || 1)), 0);

    const trips = data?.trips || [];
    // Use explicit flag if provided, otherwise fall back to detection
    const hasRoomCharges = (data?.rooms?.length || 0) > 0;
    const isStandaloneTrip: boolean = data?.isStandaloneTripInvoice === true || (trips.length > 0 && !hasRoomCharges);

    const tripsTotal = trips.reduce((sum, t) => {
        if (isStandaloneTrip) return sum + Number(t.amount || 0);
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
    const rawPayments = [];
    const seenPaymentIds = new Set();

    if (Array.isArray(data?.payments)) {
        data.payments.forEach((p) => {
            if (p && Number(p.amount || 0) > 0) {
                if (p.id) seenPaymentIds.add(p.id);
                rawPayments.push(p);
            }
        });
    }

    if (Array.isArray(data?.sales)) {
        data.sales.forEach((s) => {
            if (Array.isArray(s.payments)) {
                s.payments.forEach((sp) => {
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
        data.trips.forEach((t) => {
            if (Array.isArray(t.payments)) {
                t.payments.forEach((tp) => {
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

    // Full bill includes all extras, room mode excludes extras, extras mode shows extras only
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
        // Hotel reservation full bill: include total extras
        finalTotalExtras = totalPosCost;
        extrasList = rawExtrasList;
    }

    const finalTripsTotal = (isRoomsMode || isExtrasMode) ? 0 : tripsTotal;

    const halfDayAmountPDF = (isExtrasMode || isSale) ? 0 : Number(data?.halfDayAmount || 0);

    let roomDiscountValue = 0;
    if (data?.discountType === "fixed") {
        roomDiscountValue = (isExtrasMode || isSale) ? 0 : discountPercent;
    } else {
        roomDiscountValue = finalRoomTotal * (discountPercent / 100);
    }

    // 4. balance Total = Room Rent Total - Discount + half room rent
    const netRoomRent = Math.max(0, finalRoomTotal - roomDiscountValue);
    const balanceTotal = (isExtrasMode || isSale) ? 0 : Math.max(0, netRoomRent + halfDayAmountPDF);

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
    const grandTotal = roomAfterTax + halfDayAmountPDF + finalTotalExtras + finalTripsTotal - waivedAmount;

    // POS tax: only apply if in extras mode OR if there is unpaid POS on room bill
    const posTaxRaw = Number(data?.posTaxAmount || 0);
    const posTaxAmount = (isExtrasMode || (!isRoomsMode && !isSale && unpaidPos > 0)) ? posTaxRaw : (isSale ? posTaxRaw : 0);

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

    const posPaymentsListTotal = rawPayments.filter(isPosPayment).reduce((sum, p) => sum + Number(p.amount || 0), 0);
    const roomPaymentsListTotal = rawPayments.filter(isRoomPayment).reduce((sum, p) => sum + Number(p.amount || 0), 0);

    const advancePaidRaw = data?.advancepaid1 || data?.advancePaid || 0;
    const rawAdvance = Array.isArray(advancePaidRaw) ? 0 : Number(advancePaidRaw || 0);

    let grossPaid = 0;
    let advancePaid = 0;

    if (isExtrasMode) {
        grossPaid = Math.max(totalPosPaid, posPaymentsListTotal);
        advancePaid = grossPaid;
    } else if (isSale) {
        grossPaid = Math.max(
            allPayments.reduce((sum, p) => sum + Number(p.amount || 0), 0),
            rawAdvance
        );
        advancePaid = rawAdvance;
    } else if (isRoomsMode) {
        const roomPayments = allPayments.filter((p: any) => !isPosPayment(p));
        const roomAdvancePaid = roomPayments.length > 0
            ? roomPayments.reduce((sum, p) => sum + Number(p.amount || 0), 0)
            : Math.max(0, rawAdvance - totalPosPaid);
        grossPaid = roomPaymentsListTotal > 0 ? roomPaymentsListTotal : roomAdvancePaid;
        advancePaid = grossPaid;
    } else {
        // Hotel reservation full bill: grossPaid equals all payments on the folio
        const paymentsListTotal = rawPayments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
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
    const totalPaid = grossPaid - refundedAmount;
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
    const halfDayChargeName = data?.halfDayChargeName || 'half room rent';
    const finalRoomBreakdownPDF = (isExtrasMode || isSale) ? [] : roomBreakdown;

    return {
        stayDays,
        roomTotal: finalRoomTotal,
        totalExtras: finalTotalExtras,
        tripsTotal: finalTripsTotal,
        baseTotal,
        roomTaxValue: effectiveTaxValue,
        posTax: posTaxAmount,
        roomDiscountValue,
        grandTotal: effectiveGrandTotal,
        discountPercent,
        discountType: data?.discountType,
        taxPercent: effectiveTaxPercent,
        roomRent,
        roomBreakdown: finalRoomBreakdownPDF,
        trips: isRoomsMode ? [] : trips,
        totalPaid,
        refundedAmount,
        grossPaid,
        advancePaid,
        isSale,
        isRoomsMode,
        isExtrasMode,
        waivedAmount,
        totalGuests,
        halfDayAmount: halfDayAmountPDF,
        halfDayChargeName,
        balanceTotal,
        balanceDue,
        isTaxInclusive,
        statusDisplay,
        extrasList,
        paymentsList
    };
};

// ============================================================
// A4 MODERN PDF — mirrors A4ModernHTML exactly
// ============================================================
const modernStyles = StyleSheet.create({
    page: { padding: "40px", fontFamily: "Helvetica", backgroundColor: "#fff", color: "#334155" },

    // Header
    header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 30, borderBottom: "2px solid #f1f5f9", paddingBottom: 20 },
    hotelName: { fontSize: 18, fontWeight: "bold", color: "#1e293b", textTransform: "uppercase", marginBottom: 3 },
    hotelSub: { fontSize: 9, color: "#64748b", marginBottom: 2 },
    invoiceTitle: { fontSize: 28, fontWeight: "bold", color: "#e2e8f0", textAlign: "right" },
    logo: { width: 120, height: 80, marginBottom: 8 },

    // 2-column info grid
    infoGrid: { flexDirection: "row", gap: 40, marginBottom: 30 },
    infoCol: { flex: 1 },
    sectionTitle: { fontSize: 10, fontWeight: "bold", textTransform: "uppercase", color: "#3b82f6", borderBottom: "1px solid #e2e8f0", paddingBottom: 4, marginBottom: 8 },
    infoRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
    infoLabel: { fontSize: 10, color: "#64748b", fontWeight: "bold" },
    infoValue: { fontSize: 10, color: "#1e293b", fontWeight: "bold" },

    // Table
    tableHeader: { flexDirection: "row", backgroundColor: "#f8fafc", borderBottom: "2px solid #e2e8f0", paddingVertical: 10, paddingHorizontal: 8 },
    th: { fontSize: 9, color: "#475569", textTransform: "uppercase", fontWeight: "bold" },
    tableRow: { flexDirection: "row", borderBottom: "1px solid #f1f5f9", paddingVertical: 10, paddingHorizontal: 8 },
    td: { fontSize: 10, color: "#334155" },
    tdSub: { fontSize: 8, color: "#64748b", marginTop: 2 },
    tdBold: { fontSize: 10, color: "#1e293b", fontWeight: "bold" },
    col1: { flex: 3 },
    col2: { flex: 1, textAlign: "center" },
    col3: { flex: 1, textAlign: "right" },

    // Summary
    summaryWrapper: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginTop: 20 },
    paymentLogWrapper: { width: 230, paddingRight: 8 },
    paymentLogTitle: { fontSize: 10, fontWeight: "bold", textTransform: "uppercase", color: "#1e293b", borderBottom: "1px solid #e2e8f0", paddingBottom: 4, marginBottom: 6 },
    paymentLogRow: { paddingVertical: 4, borderBottom: "1px solid #f1f5f9" },
    paymentLogTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 2 },
    paymentLogDate: { fontSize: 8, color: "#64748b" },
    paymentLogAmount: { fontSize: 9, fontWeight: "bold", color: "#16a34a" },
    paymentLogBottom: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    paymentLogDetails: { fontSize: 8, color: "#1e293b", fontWeight: "bold" },
    paymentLogMethod: { fontSize: 8, color: "#475569" },
    paymentLogNote: { fontSize: 7, color: "#94a3b8", marginTop: 1 },
    summaryBox: { width: 260 },
    totalRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 7, borderBottom: "1px solid #f1f5f9" },
    totalLabel: { fontSize: 10, color: "#64748b" },
    totalValue: { fontSize: 10, color: "#1e293b", fontWeight: "bold" },
    grandTotalBox: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 12, paddingHorizontal: 14, marginTop: 10, backgroundColor: "#1e293b", borderRadius: 3 },
    grandTotalLabel: { fontSize: 11, fontWeight: "bold", color: "#fff", textTransform: "uppercase" },
    grandTotalValue: { fontSize: 13, fontWeight: "bold", color: "#fff" },
    redText: { color: "#ef4444", fontWeight: "bold" },
    greenText: { color: "#16a34a", fontWeight: "bold" },

    // Terms
    termsBlock: { marginTop: 32, paddingLeft: 10, borderLeft: "2px solid #e2e8f0" },
    termsTitle: { fontSize: 9, fontWeight: "bold", color: "#1e293b", textTransform: "uppercase", marginBottom: 4 },
    termsListRow: { flexDirection: "row", marginBottom: 2 },
    termsMarker: { fontSize: 8, color: "#334155", width: 12 },
    termsText: { fontSize: 8, color: "#334155", flex: 1 },

    // Footer
    footer: { marginTop: 40, textAlign: "center", borderTop: "1px solid #f1f5f9", paddingTop: 10 },
    footerText: { fontSize: 8, color: "#000", textAlign: "center" },
    badge: { marginLeft: 8, padding: "2 6", backgroundColor: "#3b82f6", color: "#fff", borderRadius: 4, fontSize: 8 },
    sigRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 40, paddingHorizontal: 20 },
    sigBox: { width: 140, borderTop: "1px solid #1e293b", textAlign: "center", paddingTop: 5 },
    sigText: { fontSize: 9, fontWeight: "bold", textAlign: "center", color: "#1e293b" },
});

export const A4Modern = ({ data, logo, settings, location, mode = "all" }) => {
    const { stayDays, roomTotal, totalExtras, advancePaid, tripsTotal, baseTotal, roomTaxValue, posTax, roomDiscountValue, grandTotal, taxPercent, discountPercent, roomRent, roomBreakdown, trips, grossPaid, refundedAmount, isSale, isRoomsMode, isExtrasMode, waivedAmount, totalGuests, halfDayAmount, halfDayChargeName, balanceTotal, balanceDue, isTaxInclusive, statusDisplay, extrasList, paymentsList } = calculateInvoice(data, mode);
    const termsRows = parseTermsHtmlToListRows(settings?.termsandcondition);
    const allExtras = extrasList;
    const isTripsOnly = (!data?.rooms || data.rooms.length === 0) && trips.length > 0;

    return (
        <Document>
            <Page size="A4" style={modernStyles.page}>

                {/* HEADER */}
                <View style={modernStyles.header}>
                    <View>
                        <Image src={getLogoPath(location?.logo || logo)} style={modernStyles.logo} />
                        <Text style={modernStyles.hotelName}>{location?.name || settings?.organization_name || "LE AURA GRAND"}</Text>
                        <Text style={modernStyles.hotelSub}>{location?.address}</Text>
                        <Text style={modernStyles.hotelSub}>Phone: {getContactPhone(location, settings)} | Email: {location?.contactEmail}</Text>
                        <Text style={[modernStyles.hotelSub, { fontWeight: "bold", color: "#475569" }]}>NTN: {getNTN(location, settings)}</Text>
                    </View>
                    <View style={{ alignItems: "flex-end" }}>
                        <Text style={modernStyles.invoiceTitle}>{isTripsOnly ? "TRIP INVOICE" : "INVOICE"}</Text>
                        <Text style={modernStyles.hotelSub}># {data?.refno}</Text>
                        <Text style={modernStyles.hotelSub}>Date: {formatDate(data?.updatedAt || new Date())}</Text>
                        {statusDisplay && <Text style={[modernStyles.hotelSub, { fontWeight: "bold", color: "#1D4ED8", marginTop: 2 }]}>Status: {statusDisplay}</Text>}
                    </View>
                </View>

                {/* INFO GRID */}
                <View style={modernStyles.infoGrid}>
                    {/* Guest */}
                    <View style={modernStyles.infoCol}>
                        <Text style={modernStyles.sectionTitle}>Guest Information</Text>
                        <View style={modernStyles.infoRow}>
                            <Text style={modernStyles.infoLabel}>Name:</Text>
                            <View style={{ flexDirection: "row", alignItems: "center" }}>
                                <Text style={modernStyles.infoValue}>{data?.customer?.name}</Text>
                                {data?.userMembership && (
                                    <View style={modernStyles.badge}>
                                        <Text style={{ color: "#fff" }}>{data.userMembership.plan?.name || "Member"}</Text>
                                    </View>
                                )}
                            </View>
                        </View>
                        <View style={modernStyles.infoRow}><Text style={modernStyles.infoLabel}>Phone:</Text><Text style={modernStyles.infoValue}>{data?.customer?.phone}</Text></View>
                        <View style={modernStyles.infoRow}><Text style={modernStyles.infoLabel}>CNIC/ID:</Text><Text style={modernStyles.infoValue}>{data?.customer?.cnic || "-"}</Text></View>
                        <View style={modernStyles.infoRow}><Text style={modernStyles.infoLabel}>EMAIL:</Text><Text style={modernStyles.infoValue}>{data?.customer?.email || "-"}</Text></View>
                        {data?.group && <View style={modernStyles.infoRow}><Text style={modernStyles.infoLabel}>Group:</Text><Text style={modernStyles.infoValue}>{data?.group?.name}</Text></View>}
                    </View>

                    {/* Reservation or Trip */}
                    {data?.rooms && data.rooms.length > 0 && mode !== "extras" && (
                        <View style={modernStyles.infoCol}>
                            <Text style={modernStyles.sectionTitle}>Reservation Details</Text>
                            <View style={modernStyles.infoRow}><Text style={modernStyles.infoLabel}>Stay:</Text><Text style={modernStyles.infoValue}>{formatDate(data?.startDate)} - {formatDate(data?.endDate)} ({stayDays} Nights)</Text></View>
                            <View style={modernStyles.infoRow}><Text style={modernStyles.infoLabel}>Guests:</Text><Text style={modernStyles.infoValue}>{totalGuests}</Text></View>
                            <View style={modernStyles.infoRow}><Text style={modernStyles.infoLabel}>Rooms:</Text><Text style={modernStyles.infoValue}>{data?.rooms?.map(r => r.roomNo).join(", ")}</Text></View>
                            <View style={modernStyles.infoRow}><Text style={modernStyles.infoLabel}>Room Type:</Text><Text style={modernStyles.infoValue}>{data?.rooms?.[0]?.RoomType?.name || "Standard"}</Text></View>
                            <View style={modernStyles.infoRow}><Text style={modernStyles.infoLabel}>Channel:</Text><Text style={modernStyles.infoValue}>{data?.channel === "refernce" ? "Reference" : data?.channel}{data?.Referal ? ` (${data.Referal})` : ""}</Text></View>
                        </View>
                    )}
                    {isTripsOnly && (
                        <View style={modernStyles.infoCol}>
                            <Text style={modernStyles.sectionTitle}>Trip Details</Text>
                            <View style={modernStyles.infoRow}><Text style={modernStyles.infoLabel}>Date(s):</Text><Text style={modernStyles.infoValue}>{trips.map(t => formatDate(t.startTime)).join(", ")}</Text></View>
                            <View style={modernStyles.infoRow}><Text style={modernStyles.infoLabel}>Vehicle:</Text><Text style={modernStyles.infoValue}>{trips[0]?.vehicle?.name} ({trips[0]?.vehicle?.plateNumber})</Text></View>
                            <View style={modernStyles.infoRow}><Text style={modernStyles.infoLabel}>Purpose:</Text><Text style={modernStyles.infoValue}>{trips[0]?.purpose}</Text></View>
                        </View>
                    )}
                </View>

                {/* TABLE */}
                <View style={modernStyles.tableHeader}>
                    <Text style={[modernStyles.th, modernStyles.col1]}>Description</Text>
                    <Text style={[modernStyles.th, modernStyles.col2]}>Qty/Nights</Text>
                    <Text style={[modernStyles.th, modernStyles.col3]}>Amount</Text>
                </View>

                {roomBreakdown.length > 0 ? (
                    roomBreakdown.map((row, i) => (
                        <View key={`r-${i}`} style={modernStyles.tableRow}>
                            <View style={modernStyles.col1}>
                                <Text style={modernStyles.tdBold}>Room {row.roomNo} ({row.roomType})</Text>
                                <Text style={modernStyles.tdSub}>{formatDate(row.startDate)} to {formatDate(row.endDate)}</Text>
                            </View>
                            <Text style={[modernStyles.td, modernStyles.col2]}>{row.days} Night(s)</Text>
                            <Text style={[modernStyles.td, modernStyles.col3]}>{formatPKR(row.total)}</Text>
                        </View>
                    ))
                ) : roomTotal > 0 && (
                    <View style={modernStyles.tableRow}>
                        <Text style={[modernStyles.td, modernStyles.col1]}>Room Rent - {roomRent?.[0]?.roomTypeName || "Accommodation"}</Text>
                        <Text style={[modernStyles.td, modernStyles.col2]}>{stayDays} Night(s)</Text>
                        <Text style={[modernStyles.td, modernStyles.col3]}>{formatPKR(roomTotal)}</Text>
                    </View>
                )}

                {allExtras.map((ex, i) => (
                    <View key={`ex-${i}`} style={modernStyles.tableRow}>
                        <Text style={[modernStyles.td, modernStyles.col1]}>{ex.name || ex.title || ex.names}</Text>
                        <Text style={[modernStyles.td, modernStyles.col2]}>
                            {ex.ReservationExtra?.quantity || ex.quantity || 1}
                            {ex.returnedQuantity ? ` (Ret: ${ex.returnedQuantity})` : ""}
                        </Text>
                        <Text style={[modernStyles.td, modernStyles.col3]}>{formatPKR(ex.ReservationExtra?.totalPrice || ex.totalPrice || (ex.price * ex.quantity))}</Text>
                    </View>
                ))}

                {trips.map((trip, i) => (
                    <View key={`trip-${i}`} style={modernStyles.tableRow}>
                        <View style={modernStyles.col1}>
                            <Text style={modernStyles.tdBold}>Transport: {trip.vehicle?.name} ({trip.vehicle?.plateNumber})</Text>
                            <Text style={modernStyles.tdSub}>{formatDate(trip.startTime)} - {trip.purpose}</Text>
                        </View>
                        <Text style={[modernStyles.td, modernStyles.col2]}>1 Trip{trip.billingType?.toLowerCase()?.replace(/\s/g, "") === 'paynow' ? " (Pay Now)" : ""}</Text>
                        <Text style={[modernStyles.td, modernStyles.col3]}>{formatPKR(trip.amount)}</Text>
                    </View>
                ))}

                {/* SUMMARY & PAYMENTS */}
                <View style={modernStyles.summaryWrapper}>
                    {paymentsList && paymentsList.length > 0 ? (
                        <View style={modernStyles.paymentLogWrapper}>
                            <Text style={modernStyles.paymentLogTitle}>Payments Log</Text>
                            {paymentsList.map((p, idx) => (
                                <View key={idx} style={modernStyles.paymentLogRow}>
                                    <View style={modernStyles.paymentLogTop}>
                                        <Text style={modernStyles.paymentLogDate}>{formatDateTime(p.createdAt || p.date)}</Text>
                                        <Text style={modernStyles.paymentLogAmount}>{formatPKR(p.amount)}</Text>
                                    </View>
                                    <View style={modernStyles.paymentLogBottom}>
                                        <Text style={modernStyles.paymentLogDetails}>{getPaymentTypeLabel(p)}</Text>
                                        <Text style={modernStyles.paymentLogMethod}>{getPaymentMethodLabel(p)}</Text>
                                    </View>
                                    {p.note && p.note !== getPaymentTypeLabel(p) && (
                                        <Text style={modernStyles.paymentLogNote}>{p.note}</Text>
                                    )}
                                </View>
                            ))}
                            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 6, paddingTop: 4, borderTop: "1px dashed #cbd5e1" }}>
                                <Text style={{ fontSize: 8, fontWeight: "bold", color: "#1e293b" }}>Total Paid Amount</Text>
                                <Text style={{ fontSize: 9, fontWeight: "bold", color: "#16a34a" }}>{formatPKR(paymentsList.reduce((sum, p) => sum + Number(p.amount || 0), 0))}</Text>
                            </View>
                        </View>
                    ) : (
                        <View style={{ flex: 1 }} />
                    )}

                    <View style={modernStyles.summaryBox}>
                        {!isSale && mode !== "extras" && (
                            <>
                                <View style={modernStyles.totalRow}>
                                    <Text style={modernStyles.totalLabel}>Room Rent Total</Text>
                                    <Text style={modernStyles.totalValue}>{formatPKR(roomTotal)}</Text>
                                </View>
                                {roomDiscountValue > 0 && (
                                    <View style={modernStyles.totalRow}>
                                        <Text style={modernStyles.totalLabel}>Discount {discountPercent > 0 ? (data?.discountType === 'fixed' ? '(Fixed)' : `(${discountPercent}%)`) : ''}</Text>
                                        <Text style={[modernStyles.totalValue, { color: "#16a34a" }]}>-{formatPKR(roomDiscountValue)}</Text>
                                    </View>
                                )}
                                {halfDayAmount > 0 && (
                                    <View style={modernStyles.totalRow}>
                                        <Text style={[modernStyles.totalLabel, { color: "#b45309" }]}>{halfDayChargeName || 'half room rent'}</Text>
                                        <Text style={[modernStyles.totalValue, { color: "#b45309" }]}>{formatPKR(halfDayAmount)}</Text>
                                    </View>
                                )}
                                <View style={modernStyles.totalRow}>
                                    <Text style={[modernStyles.totalLabel, { fontWeight: "bold", color: "#1e293b" }]}>Balance Total</Text>
                                    <Text style={[modernStyles.totalValue, { fontWeight: "bold", color: "#1e293b" }]}>{formatPKR(balanceTotal)}</Text>
                                </View>
                                {taxPercent > 0 && (
                                    <View style={modernStyles.totalRow}>
                                        <Text style={modernStyles.totalLabel}>GST {taxPercent}%{isTaxInclusive ? " (Incl.)" : ""}</Text>
                                        <Text style={modernStyles.totalValue}>{formatPKR(roomTaxValue)}</Text>
                                    </View>
                                )}
                            </>
                        )}
                        {totalExtras > 0 && (
                            <View style={modernStyles.totalRow}>
                                <Text style={modernStyles.totalLabel}>POS Items / Extras</Text>
                                <Text style={modernStyles.totalValue}>{formatPKR(totalExtras)}</Text>
                            </View>
                        )}
                        {posTax > 0 && (
                            <View style={modernStyles.totalRow}>
                                <Text style={modernStyles.totalLabel}>POS Tax</Text>
                                <Text style={modernStyles.totalValue}>{formatPKR(posTax)}</Text>
                            </View>
                        )}
                        {tripsTotal > 0 && (
                            <View style={modernStyles.totalRow}>
                                <Text style={modernStyles.totalLabel}>Transport</Text>
                                <Text style={modernStyles.totalValue}>{formatPKR(tripsTotal)}</Text>
                            </View>
                        )}
                        {waivedAmount > 0 && (
                            <View style={modernStyles.totalRow}>
                                <Text style={modernStyles.totalLabel}>Waived Amount</Text>
                                <Text style={[modernStyles.totalValue, { color: "#f97316" }]}>-{formatPKR(waivedAmount)}</Text>
                            </View>
                        )}
                        <View style={modernStyles.grandTotalBox}>
                            <Text style={modernStyles.grandTotalLabel}>GRAND TOTAL</Text>
                            <Text style={modernStyles.grandTotalValue}>{formatPKR(grandTotal)}</Text>
                        </View>
                        {(mode !== "extras" || grossPaid > 0) && (
                            <View style={modernStyles.totalRow}>
                                <Text style={modernStyles.totalLabel}>Total Paid</Text>
                                <Text style={[modernStyles.totalValue, modernStyles.greenText]}>{formatPKR(grossPaid)}</Text>
                            </View>
                        )}
                        {refundedAmount > 0 && (
                            <View style={modernStyles.totalRow}>
                                <Text style={[modernStyles.totalLabel, modernStyles.redText]}>Amount Refunded</Text>
                                <Text style={[modernStyles.totalValue, modernStyles.redText]}>-{formatPKR(refundedAmount)}</Text>
                            </View>
                        )}
                        {!isSale && (
                            <View style={modernStyles.totalRow}>
                                <Text style={[modernStyles.totalLabel, { color: balanceDue > 0 ? "#ef4444" : "#16a34a", fontWeight: "bold" }]}>Balance</Text>
                                <Text style={[modernStyles.totalValue, { color: balanceDue > 0 ? "#ef4444" : "#16a34a", fontWeight: "bold" }]}>{formatPKR(balanceDue)}</Text>
                            </View>
                        )}
                    </View>
                </View>

                {/* TERMS */}
                {settings?.termsandcondition && (
                    <TermsAndConditionsPDF
                        terms={settings?.termsandcondition ? stripHtml(settings.termsandcondition).split('\n').filter((t: string) => t.trim() !== '') : undefined}
                        containerStyle={modernStyles.termsBlock}
                        titleStyle={modernStyles.termsTitle}
                        textStyle={modernStyles.termsText}
                        itemStyle={modernStyles.termsListRow}
                        numberStyle={modernStyles.termsMarker}
                    />
                )}

                {/* SIGNATURES */}
                <View style={modernStyles.sigRow}>
                    <View style={modernStyles.sigBox}><Text style={modernStyles.sigText}>Cashier</Text></View>
                    <View style={modernStyles.sigBox}><Text style={modernStyles.sigText}>Guest</Text></View>
                </View>

                {/* FOOTER */}
                <View style={modernStyles.footer}>
                    <Text style={modernStyles.footerText}>Thank you for choosing {location?.name || settings?.organization_name || "Le Aura Grand"}. Software by Unisoftwares (+92-300-4333458).</Text>
                </View>
            </Page>
        </Document>
    );
};

// ============================================================
// A4 CLASSIC PDF — mirrors A4ClassicHTML exactly
// ============================================================
const classicStyles = StyleSheet.create({
    page: { padding: "50px", fontFamily: "Helvetica", backgroundColor: "#fff", color: "#000" },

    // Header
    hotelHeader: { textAlign: "center", borderBottom: "2px solid #000", paddingBottom: 10, marginBottom: 10 },
    hotelName: { fontSize: 22, fontWeight: "bold", marginBottom: 3 },
    hotelSub: { fontSize: 12, marginBottom: 2 },
    receiptTitle: { fontSize: 18, textAlign: "center", textDecoration: "underline", marginVertical: 16 },

    // Billing row
    billingRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 16 },
    billingText: { fontSize: 10, marginBottom: 3 },

    // Table
    table: { width: "100%", borderTop: "1px solid #000", borderLeft: "1px solid #000" },
    tableHeader: { flexDirection: "row", backgroundColor: "#f2f2f2", borderBottom: "1px solid #000" },
    th: { padding: "8px 10px", fontSize: 10, fontWeight: "bold", borderRight: "1px solid #000" },
    tableRow: { flexDirection: "row", borderBottom: "1px solid #000" },
    td: { padding: "10px", fontSize: 10, borderRight: "1px solid #000" },
    tdSub: { fontSize: 8, fontStyle: "italic", marginTop: 4 },

    // Summary
    summaryWrapper: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginTop: 16 },
    classicPaymentLogWrapper: { width: 230, paddingRight: 8 },
    classicPaymentLogTitle: { fontSize: 10, fontWeight: "bold", textTransform: "uppercase", borderBottom: "1px solid #000", paddingBottom: 4, marginBottom: 6 },
    classicPaymentLogRow: { paddingVertical: 4, borderBottom: "1px dashed #ccc" },
    summaryBox: { width: 220 },
    summaryRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 4, borderBottom: "1px solid #000" },
    summaryLabel: { fontSize: 10 },
    summaryValue: { fontSize: 10 },
    summaryBold: { fontWeight: "bold" },

    // Terms
    termsBlock: { marginTop: 16 },
    termsTitle: { fontSize: 10, fontWeight: "bold", color: "#111827", marginBottom: 4 },
    termsListRow: { flexDirection: "row", marginBottom: 2 },
    termsMarker: { fontSize: 8, color: "#111827", width: 12 },
    termsText: { fontSize: 8, color: "#111827", flex: 1 },

    // Signature
    sigRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 80 },
    sigBox: { width: 120, borderTop: "1px solid #000", textAlign: "center", paddingTop: 4 },
    sigText: { fontSize: 10 },
    logo: { width: 90, height: 90, marginBottom: 6, alignSelf: "center" },
    badge: { marginLeft: 6, padding: "1 4", border: "1pt solid #000", fontSize: 8 },
});

export const A4Classic = ({ data, logo, settings, location, mode = "all" }) => {
    const { stayDays, roomTotal, totalExtras, tripsTotal, advancePaid, baseTotal, roomTaxValue, posTax, roomDiscountValue, grandTotal, discountPercent, taxPercent, roomBreakdown, trips, grossPaid, refundedAmount, isSale, isRoomsMode, isExtrasMode, waivedAmount, totalGuests, halfDayAmount, halfDayChargeName, balanceTotal, balanceDue, isTaxInclusive, statusDisplay, extrasList, paymentsList } = calculateInvoice(data, mode);
    const termsRows = parseTermsHtmlToListRows(settings?.termsandcondition);
    const allExtras = extrasList;
    const isTripsOnly = (!data?.rooms || data.rooms.length === 0) && trips.length > 0;

    return (
        <Document>
            <Page size="A4" style={classicStyles.page}>

                {/* HOTEL HEADER */}
                <View style={classicStyles.hotelHeader}>
                    <Image src={getLogoPath(location?.logo || logo)} style={classicStyles.logo} />
                    <View>
                        <Text style={classicStyles.hotelName}>{location?.name || settings?.organization_name || "LE AURA GRAND"}</Text>
                        <Text style={classicStyles.hotelSub}>{location?.address}</Text>
                        <Text style={classicStyles.hotelSub}>Phone: {getContactPhone(location, settings)} | Email: {location?.contactEmail}</Text>
                        <Text style={[classicStyles.hotelSub, { fontWeight: "bold" }]}>NTN: {getNTN(location, settings)}</Text>
                    </View>
                </View>

                <Text style={classicStyles.receiptTitle}>{isTripsOnly ? "TRIP RECEIPT" : "PAYMENT RECEIPT"}</Text>

                {/* BILLING + INVOICE META */}
                <View style={classicStyles.billingRow}>
                    <View>
                        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 3 }}>
                            <Text style={{ fontSize: 10, fontWeight: "bold" }}>Bill To: </Text>
                            <Text style={{ fontSize: 10 }}>{data?.customer?.name}</Text>
                            {data?.userMembership && (
                                <View style={classicStyles.badge}>
                                    <Text>{data.userMembership.plan?.name || "Member"}</Text>
                                </View>
                            )}
                        </View>
                        <Text style={classicStyles.billingText}><Text style={{ fontWeight: "bold" }}>Contact: </Text>{data?.customer?.phone}</Text>
                        <Text style={classicStyles.billingText}><Text style={{ fontWeight: "bold" }}>CNIC: </Text>{data?.customer?.cnic || "---"}</Text>
                        <Text style={classicStyles.billingText}><Text style={{ fontWeight: "bold" }}>Email: </Text>{data?.customer?.email || "---"}</Text>
                    </View>
                    <View style={{ alignItems: "flex-end" }}>
                        <Text style={classicStyles.billingText}><Text style={{ fontWeight: "bold" }}>Invoice #: </Text>{data?.refno}</Text>
                        <Text style={classicStyles.billingText}><Text style={{ fontWeight: "bold" }}>Date: </Text>{formatDate(new Date())}</Text>
                        <Text style={classicStyles.billingText}><Text style={{ fontWeight: "bold" }}>Stay: </Text>{mode === "extras" ? "0" : stayDays} Night(s)</Text>
                        <Text style={classicStyles.billingText}><Text style={{ fontWeight: "bold" }}>Guests: </Text>{totalGuests}</Text>
                        {statusDisplay && <Text style={classicStyles.billingText}><Text style={{ fontWeight: "bold" }}>Status: </Text>{statusDisplay}</Text>}
                    </View>
                </View>

                {/* TABLE */}
                <View style={classicStyles.table}>
                    <View style={classicStyles.tableHeader}>
                        <Text style={[classicStyles.th, { flex: 3 }]}>Description</Text>
                        <Text style={[classicStyles.th, { flex: 1, borderRight: 0, textAlign: "right" }]}>Total (PKR)</Text>
                    </View>

                    {roomBreakdown.length > 0 ? (
                        roomBreakdown.map((row, i) => (
                            <View key={`r-${i}`} style={classicStyles.tableRow}>
                                <View style={[classicStyles.td, { flex: 3 }]}>
                                    <Text style={{ fontWeight: "bold" }}>Room {row.roomNo} ({row.roomType})</Text>
                                    <Text style={classicStyles.tdSub}>{formatDate(row.startDate)} to {formatDate(row.endDate)} ({row.days} Nights)</Text>
                                </View>
                                <Text style={[classicStyles.td, { flex: 1, textAlign: "right", borderRight: 0 }]}>{formatPKR(row.total)}</Text>
                            </View>
                        ))
                    ) : roomTotal > 0 && (
                        <View style={classicStyles.tableRow}>
                            <View style={[classicStyles.td, { flex: 3 }]}>
                                <Text>Room Charges ({data?.rooms?.map(r => r.roomNo).join(", ")})</Text>
                                <Text style={classicStyles.tdSub}>{formatDate(data?.startDate)} to {formatDate(data?.endDate)}</Text>
                            </View>
                            <Text style={[classicStyles.td, { flex: 1, textAlign: "right", borderRight: 0 }]}>{formatPKR(roomTotal)}</Text>
                        </View>
                    )}

                    {allExtras.map((ex, i) => (
                        <View key={`ex-${i}`} style={classicStyles.tableRow}>
                            <Text style={[classicStyles.td, { flex: 3 }]}>{ex.name || ex.title || ex.names} x {ex.ReservationExtra?.quantity || ex.quantity || 1}{ex.returnedQuantity ? ` (Ret: ${ex.returnedQuantity})` : ""}</Text>
                            <Text style={[classicStyles.td, { flex: 1, textAlign: "right", borderRight: 0 }]}>{formatPKR(ex.ReservationExtra?.totalPrice || ex.totalPrice || (ex.price * ex.quantity))}</Text>
                        </View>
                    ))}

                    {trips.map((trip, i) => (
                        <View key={`trip-${i}`} style={classicStyles.tableRow}>
                            <View style={[classicStyles.td, { flex: 3 }]}>
                                <Text style={{ fontWeight: "bold" }}>Transport: {trip.vehicle?.name} ({trip.vehicle?.plateNumber})</Text>
                                <Text style={classicStyles.tdSub}>{formatDate(trip.startTime)} - {trip.purpose}{trip.billingType?.toLowerCase()?.replace(/\s/g, "") === 'paynow' ? ' (Pay Now)' : ''}</Text>
                            </View>
                            <Text style={[classicStyles.td, { flex: 1, textAlign: "right", borderRight: 0 }]}>{formatPKR(trip.amount)}</Text>
                        </View>
                    ))}
                </View>

                {/* SUMMARY & PAYMENTS */}
                <View style={classicStyles.summaryWrapper}>
                    {paymentsList && paymentsList.length > 0 ? (
                        <View style={classicStyles.classicPaymentLogWrapper}>
                            <Text style={classicStyles.classicPaymentLogTitle}>Payments Log</Text>
                            {paymentsList.map((p, idx) => (
                                <View key={idx} style={classicStyles.classicPaymentLogRow}>
                                    <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 2 }}>
                                        <Text style={{ fontSize: 8, color: "#555" }}>{formatDateTime(p.createdAt || p.date)}</Text>
                                        <Text style={{ fontSize: 9, fontWeight: "bold", color: "green" }}>{formatPKR(p.amount)}</Text>
                                    </View>
                                    <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                                        <Text style={{ fontSize: 8, fontWeight: "bold" }}>{getPaymentTypeLabel(p)}</Text>
                                        <Text style={{ fontSize: 8, color: "#444" }}>{getPaymentMethodLabel(p)}</Text>
                                    </View>
                                    {p.note && p.note !== getPaymentTypeLabel(p) && (
                                        <Text style={{ fontSize: 7, color: "#777", marginTop: 1 }}>{p.note}</Text>
                                    )}
                                </View>
                            ))}
                            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 6, paddingTop: 4, borderTop: "1px dashed #000" }}>
                                <Text style={{ fontSize: 8, fontWeight: "bold" }}>Total Paid Amount</Text>
                                <Text style={{ fontSize: 9, fontWeight: "bold", color: "green" }}>{formatPKR(paymentsList.reduce((sum, p) => sum + Number(p.amount || 0), 0))}</Text>
                            </View>
                        </View>
                    ) : (
                        <View style={{ flex: 1 }} />
                    )}

                    <View style={classicStyles.summaryBox}>
                        {!isSale && mode !== "extras" && (
                            <>
                                <View style={classicStyles.summaryRow}><Text style={classicStyles.summaryLabel}>Room Rent Total:</Text><Text style={classicStyles.summaryValue}>{formatPKR(roomTotal)}</Text></View>
                                {roomDiscountValue > 0 && (
                                    <View style={classicStyles.summaryRow}><Text style={[classicStyles.summaryLabel, { color: "green" }]}>Discount {discountPercent > 0 ? (data?.discountType === 'fixed' ? '(Fixed)' : `(${discountPercent}%)`) : ''}:</Text><Text style={[classicStyles.summaryValue, { color: "green" }]}>-{formatPKR(roomDiscountValue)}</Text></View>
                                )}
                                {halfDayAmount > 0 && (
                                    <View style={classicStyles.summaryRow}><Text style={[classicStyles.summaryLabel, { color: "#b45309" }]}>{halfDayChargeName || 'half room rent'}:</Text><Text style={[classicStyles.summaryValue, { color: "#b45309" }]}>{formatPKR(halfDayAmount)}</Text></View>
                                )}
                                <View style={classicStyles.summaryRow}><Text style={[classicStyles.summaryLabel, classicStyles.summaryBold]}>Balance Total:</Text><Text style={[classicStyles.summaryValue, classicStyles.summaryBold]}>{formatPKR(balanceTotal)}</Text></View>
                                {taxPercent > 0 && <View style={classicStyles.summaryRow}><Text style={classicStyles.summaryLabel}>GST {taxPercent}%{isTaxInclusive ? " (Incl.):" : ":"}</Text><Text style={classicStyles.summaryValue}>{formatPKR(roomTaxValue)}</Text></View>}
                            </>
                        )}
                        {totalExtras > 0 && <View style={classicStyles.summaryRow}><Text style={classicStyles.summaryLabel}>POS Items / Extras:</Text><Text style={classicStyles.summaryValue}>{formatPKR(totalExtras)}</Text></View>}
                        {posTax > 0 && <View style={classicStyles.summaryRow}><Text style={classicStyles.summaryLabel}>POS Tax:</Text><Text style={classicStyles.summaryValue}>{formatPKR(posTax)}</Text></View>}
                        {waivedAmount > 0 && <View style={classicStyles.summaryRow}><Text style={[classicStyles.summaryLabel, { color: "orange" }]}>Waived Amount:</Text><Text style={[classicStyles.summaryValue, { color: "orange" }]}>-{formatPKR(waivedAmount)}</Text></View>}
                        <View style={[classicStyles.summaryRow, { backgroundColor: "#eee" }]}><Text style={[classicStyles.summaryLabel, classicStyles.summaryBold]}>Grand Total:</Text><Text style={[classicStyles.summaryValue, classicStyles.summaryBold]}>{formatPKR(grandTotal)}</Text></View>
                        {(mode !== "extras" || grossPaid > 0) && <View style={classicStyles.summaryRow}><Text style={classicStyles.summaryLabel}>Total Paid:</Text><Text style={classicStyles.summaryValue}>{formatPKR(grossPaid)}</Text></View>}
                        {refundedAmount > 0 && mode !== "extras" && (
                            <View style={classicStyles.summaryRow}><Text style={[classicStyles.summaryLabel, { color: "#ef4444" }]}>Refunded:</Text><Text style={[classicStyles.summaryValue, { color: "#ef4444" }]}>-{formatPKR(refundedAmount)}</Text></View>
                        )}
                        {!isSale && (
                            <View style={classicStyles.summaryRow}><Text style={[classicStyles.summaryLabel, classicStyles.summaryBold, { color: balanceDue > 0 ? "#ef4444" : "#16a34a" }]}>Balance:</Text><Text style={[classicStyles.summaryValue, classicStyles.summaryBold, { color: balanceDue > 0 ? "#ef4444" : "#16a34a" }]}>{formatPKR(balanceDue)}</Text></View>
                        )}
                    </View>
                </View>

                {/* TERMS */}
                {settings?.termsandcondition && (
                    <TermsAndConditionsPDF
                        terms={settings?.termsandcondition ? stripHtml(settings.termsandcondition).split('\n').filter((t: string) => t.trim() !== '') : undefined}
                        containerStyle={classicStyles.termsBlock}
                        titleStyle={classicStyles.termsTitle}
                        textStyle={classicStyles.termsText}
                        itemStyle={classicStyles.termsListRow}
                        numberStyle={classicStyles.termsMarker}
                    />
                )}

                {/* SIGNATURE */}
                <View style={classicStyles.sigRow}>
                    <View style={classicStyles.sigBox}><Text style={classicStyles.sigText}>Cashier</Text></View>
                    <View style={classicStyles.sigBox}><Text style={classicStyles.sigText}>Guest</Text></View>
                </View>
            </Page>
        </Document>
    );
};

// ============================================================
// THERMAL STANDARD PDF — mirrors ThermalHTML exactly
// ============================================================
const thermalStyles = StyleSheet.create({
    page: { padding: "6mm 5mm", width: 226, fontFamily: "Courier", fontSize: 11, color: "#000", backgroundColor: "#fff" },
    center: { textAlign: "center" },
    hotelName: { fontSize: 13, fontWeight: "bold", textTransform: "uppercase", marginBottom: 2 },
    hotelSub: { fontSize: 8, color: "#444", marginBottom: 1 },
    logo: { width: 70, height: 70, marginBottom: 5, alignSelf: "center" },
    divider: { borderBottom: "1px dashed #000", marginVertical: 6 },
    receiptTitle: { fontSize: 12, fontWeight: "bold", textAlign: "center", marginBottom: 5 },
    metaRow: { fontSize: 10, marginBottom: 2 },
    itemRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 3 },
    itemLabel: { fontSize: 10, flex: 1 },
    itemValue: { fontSize: 10 },
    itemSub: { fontSize: 7, color: "#666", marginBottom: 3 },
    totalRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 3 },
    totalLabel: { fontSize: 10 },
    totalValue: { fontSize: 10 },
    grandRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 3 },
    grandLabel: { fontSize: 11, fontWeight: "bold" },
    grandValue: { fontSize: 11, fontWeight: "bold" },
    footer: { marginTop: 16, textAlign: "center" },
    footerText: { fontSize: 9, color: "#000", textAlign: "center", marginBottom: 2 },
    termsTitle: { fontSize: 9, fontWeight: "bold", marginBottom: 2 },
    termsText: { fontSize: 7, color: "#555", marginBottom: 1 },
    sigRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 20, marginBottom: 8, paddingHorizontal: 4 },
    sigBox: { width: 70, borderTop: "1px dashed #000", textAlign: "center", paddingTop: 3 },
    sigText: { fontSize: 9, fontWeight: "bold", textAlign: "center" },
});

export const ThermalStandard = ({ data, logo, settings, location, mode = "all" }) => {
    const { roomTotal, baseTotal, roomTaxValue, posTax, roomDiscountValue, grandTotal, discountPercent, roomBreakdown, trips, grossPaid, refundedAmount, advancePaid, isSale, isRoomsMode, isExtrasMode, taxPercent, waivedAmount, totalGuests, halfDayAmount, halfDayChargeName, balanceTotal, balanceDue, isTaxInclusive, statusDisplay, extrasList } = calculateInvoice(data, mode);
    const allExtras = extrasList;
    const termsText = settings?.termsandcondition ? stripHtml(settings.termsandcondition) : null;

    return (
        <Document>
            <Page size={[226, 800]} style={thermalStyles.page}>

                {/* HEADER */}
                <View style={thermalStyles.center}>
                    <Image src={getLogoPath(location?.logo || logo)} style={thermalStyles.logo} />
                    <Text style={thermalStyles.hotelName}>{location?.name || settings?.organization_name || "HOTEL"}</Text>
                    <Text style={thermalStyles.hotelSub}>{location?.address}</Text>
                    <Text style={thermalStyles.hotelSub}>Phone: {getContactPhone(location, settings)}</Text>
                    <Text style={thermalStyles.hotelSub}>Email: {location?.contactEmail}</Text>
                    <Text style={[thermalStyles.hotelSub, { fontWeight: "bold" }]}>NTN: {getNTN(location, settings)}</Text>
                </View>

                <View style={thermalStyles.divider} />
                <Text style={thermalStyles.receiptTitle}>CASH RECEIPT</Text>

                {/* META */}
                <Text style={thermalStyles.metaRow}>Date: {formatDate(new Date())}</Text>
                <Text style={thermalStyles.metaRow}>Inv: #{data?.refno}</Text>
                <Text style={thermalStyles.metaRow}>
                    Guest: {data?.customer?.name}
                    {data?.userMembership ? ` (${data.userMembership.plan?.name || "Member"})` : ""}
                </Text>
                <Text style={thermalStyles.metaRow}>Total Guests: {totalGuests}</Text>
                {statusDisplay && <Text style={thermalStyles.metaRow}>Status: {statusDisplay}</Text>}
                {data?.rooms && data.rooms.length > 0 && mode !== "extras" && (
                    <Text style={thermalStyles.metaRow}>Room: {data?.rooms?.map(r => r.roomNo).join(", ")}</Text>
                )}

                <View style={thermalStyles.divider} />

                {/* ITEMS */}
                {roomBreakdown.length > 0 ? (
                    roomBreakdown.map((row, idx) => (
                        <View key={`room-${idx}`}>
                            <View style={thermalStyles.itemRow}>
                                <Text style={thermalStyles.itemLabel}>Room {row.roomNo}</Text>
                                <Text style={thermalStyles.itemValue}>{formatPKR(row.total)}</Text>
                            </View>
                            <Text style={thermalStyles.itemSub}>{row.days} Nights @ {row.rate}</Text>
                        </View>
                    ))
                ) : roomTotal > 0 && (
                    <View style={thermalStyles.itemRow}>
                        <Text style={thermalStyles.itemLabel}>Room Rent</Text>
                        <Text style={thermalStyles.itemValue}>{formatPKR(roomTotal)}</Text>
                    </View>
                )}

                {allExtras.map((ex, i) => (
                    <View key={`ex-${i}`} style={thermalStyles.itemRow}>
                        <Text style={thermalStyles.itemLabel}>{(ex.name || ex.title || ex.names || "").substring(0, 15)} x {ex.ReservationExtra?.quantity || ex.quantity || 1}{ex.returnedQuantity ? ` (Ret: ${ex.returnedQuantity})` : ""}</Text>
                        <Text style={thermalStyles.itemValue}>{formatPKR(ex.ReservationExtra?.totalPrice || ex.totalPrice || (ex.price * ex.quantity))}</Text>
                    </View>
                ))}

                {trips.map((trip, i) => (
                    <View key={`trip-${i}`}>
                        <View style={thermalStyles.itemRow}>
                            <Text style={thermalStyles.itemLabel}>TRIP: {(trip.vehicle?.name || "").substring(0, 10)}</Text>
                            <Text style={thermalStyles.itemValue}>{formatPKR(trip.amount)}</Text>
                        </View>
                        <Text style={thermalStyles.itemSub}>{formatDate(trip.startTime)}{trip.billingType?.toLowerCase()?.replace(/\s/g, "") === 'paynow' ? ' (Paid)' : ''}</Text>
                    </View>
                ))}

                <View style={thermalStyles.divider} />

                {/* TOTALS */}
                {!isSale && mode !== "extras" && (
                    <>
                        <View style={thermalStyles.totalRow}><Text style={thermalStyles.totalLabel}>Room Rent Total</Text><Text style={thermalStyles.totalValue}>{formatPKR(roomTotal)}</Text></View>
                        {roomDiscountValue > 0 && (
                            <View style={thermalStyles.totalRow}><Text style={[thermalStyles.totalLabel, { color: "green" }]}>Discount {discountPercent > 0 ? (data?.discountType === 'fixed' ? '(Fixed)' : `(${discountPercent}%)`) : ''}</Text><Text style={[thermalStyles.totalValue, { color: "green" }]}>-{formatPKR(roomDiscountValue)}</Text></View>
                        )}
                        {halfDayAmount > 0 && (
                            <View style={thermalStyles.totalRow}><Text style={[thermalStyles.totalLabel, { color: "#b45309" }]}>{halfDayChargeName || 'half room rent'}</Text><Text style={[thermalStyles.totalValue, { color: "#b45309" }]}>{formatPKR(halfDayAmount)}</Text></View>
                        )}
                        <View style={thermalStyles.totalRow}><Text style={[thermalStyles.totalLabel, { fontWeight: "bold" }]}>Balance Total</Text><Text style={[thermalStyles.totalValue, { fontWeight: "bold" }]}>{formatPKR(balanceTotal)}</Text></View>
                        <View style={thermalStyles.totalRow}><Text style={thermalStyles.totalLabel}>GST {taxPercent}%{isTaxInclusive ? " (Incl.)" : ""}</Text><Text style={thermalStyles.totalValue}>{formatPKR(roomTaxValue)}</Text></View>
                    </>
                )}
                {totalExtras > 0 && <View style={thermalStyles.totalRow}><Text style={thermalStyles.totalLabel}>POS Items / Extras</Text><Text style={thermalStyles.totalValue}>{formatPKR(totalExtras)}</Text></View>}
                {posTax > 0 && <View style={thermalStyles.totalRow}><Text style={thermalStyles.totalLabel}>POS Tax</Text><Text style={thermalStyles.totalValue}>{formatPKR(posTax)}</Text></View>}
                {waivedAmount > 0 && <View style={thermalStyles.totalRow}><Text style={thermalStyles.totalLabel}>Waived Amount</Text><Text style={thermalStyles.totalValue}>-{formatPKR(waivedAmount)}</Text></View>}

                <View style={thermalStyles.divider} />

                <View style={thermalStyles.grandRow}><Text style={thermalStyles.grandLabel}>TOTAL</Text><Text style={thermalStyles.grandValue}>{formatPKR(grandTotal)}</Text></View>

                <View style={thermalStyles.divider} />

                <View style={thermalStyles.totalRow}><Text style={thermalStyles.totalLabel}>Total Paid</Text><Text style={thermalStyles.totalValue}>{formatPKR(grossPaid)}</Text></View>
                {refundedAmount > 0 && (
                    <View style={thermalStyles.totalRow}>
                        <Text style={[thermalStyles.totalLabel, { color: "#ef4444" }]}>Refunded</Text>
                        <Text style={[thermalStyles.totalValue, { color: "#ef4444" }]}>-{formatPKR(refundedAmount)}</Text>
                    </View>
                )}
                {!isSale && (
                    <View style={thermalStyles.grandRow}>
                        <Text style={[thermalStyles.grandLabel, { color: balanceDue > 0 ? "#ef4444" : "#000" }]}>Balance</Text>
                        <Text style={[thermalStyles.grandValue, { color: balanceDue > 0 ? "#ef4444" : "#000" }]}>{formatPKR(balanceDue)}</Text>
                    </View>
                )}

                <View style={thermalStyles.divider} />

                {/* T&C */}
                <View>
                    <Text style={thermalStyles.termsTitle}>T&C:</Text>
                    <Text style={thermalStyles.termsText}>
                        {termsText ? termsText : "1. Standard check-in 12PM, check-out 2PM. 2. Complimentary breakfast 9AM-11AM. 3. Mgt not responsible for vehicle damage or lost valuables. 4. Guest responsible for room damage. 5. Outside food/cooking prohibited. 6. ID/Deposit required on check-in."}
                    </Text>
                </View>

                {/* SIGNATURE */}
                <View style={thermalStyles.sigRow}>
                    <View style={thermalStyles.sigBox}><Text style={thermalStyles.sigText}>Cashier</Text></View>
                    <View style={thermalStyles.sigBox}><Text style={thermalStyles.sigText}>Guest</Text></View>
                </View>

                {/* FOOTER */}
                <View style={thermalStyles.footer}>
                    <Text style={thermalStyles.footerText}>Thank you for staying with us!</Text>
                    <Text style={[thermalStyles.footerText, { fontSize: 8, color: "#000" }]}>Software by Unisoftwares (+92 304 5694733)</Text>
                </View>
            </Page>
        </Document>
    );
};

// ============================================================
// FALLBACK ALIASES
// ============================================================
export const A4Professional = (props) => <A4Modern {...props} />;
export const A4Elegant = (props) => <A4Classic {...props} />;
export const ThermalDetailed = (props) => <ThermalStandard {...props} />;

const templates = {
    a4_standard: A4Modern,
    a4_modern: A4Modern,
    a4_classic: A4Classic,
    a4_professional: A4Professional,
    a4_elegant: A4Elegant,
    thermal_standard: ThermalStandard,
    thermal_detailed: ThermalDetailed,
};

export default templates;
