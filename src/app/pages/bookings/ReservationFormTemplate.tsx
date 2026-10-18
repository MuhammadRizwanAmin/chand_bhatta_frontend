//@ts-nocheck
import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image, Font } from "@react-pdf/renderer";
import { TermsAndConditionsPDF, HARDCODED_RESERVATION_FORM_TERMS } from "../../components/TermsAndConditionsPDF";
import DefaultLogo from "../../../assets/logo.png";

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
        }
        return src;
    }
    return src;
};

const formatDate = (d?: string) => {
  if (!d) return '';
  const dt = new Date(d);
  return `${String(dt.getDate()).padStart(2, '0')}-${String(dt.getMonth() + 1).padStart(2, '0')}-${dt.getFullYear()}`;
};

const calcDays = (s?: string, e?: string) => {
  if (!s || !e) return 1;
  const diff = new Date(e).getTime() - new Date(s).getTime();
  return Math.max(1, Math.ceil(diff / 86400000));
};

const TERMS = HARDCODED_RESERVATION_FORM_TERMS;

const s = StyleSheet.create({
  page: { padding: 36, fontFamily: 'Helvetica', fontSize: 9, color: '#000', backgroundColor: '#fff' },

  // Header
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  logo: { width: 70, height: 55, objectFit: 'contain' },
  hotelName: { fontSize: 15, fontFamily: 'Helvetica-Bold', textAlign: 'center' },

  // Intro line
  intro: { fontSize: 9, marginBottom: 14, lineHeight: 1.5 },
  bold: { fontFamily: 'Helvetica-Bold' },

  // Info grid (2-column label/value pairs)
  infoGrid: { flexDirection: 'row', marginBottom: 2 },
  infoLeft: { width: '50%', flexDirection: 'row', marginBottom: 3 },
  infoRight: { width: '50%', flexDirection: 'row', marginBottom: 3 },
  infoLabel: { fontFamily: 'Helvetica-Bold', width: 100, fontSize: 9 },
  infoValue: { flex: 1, fontSize: 9 },

  // Room table
  table: { width: '100%', border: '1pt solid #000', marginBottom: 0, marginTop: 12 },
  thead: { flexDirection: 'row', backgroundColor: '#f0f0f0', borderBottom: '1pt solid #000' },
  trow: { flexDirection: 'row', borderBottom: '1pt solid #000' },
  th: { fontFamily: 'Helvetica-Bold', fontSize: 8, padding: '4 3', textAlign: 'center', borderRight: '1pt solid #000' },
  td: { fontSize: 8, padding: '4 3', textAlign: 'center', borderRight: '1pt solid #000' },
  tdLeft: { fontSize: 8, padding: '4 3', textAlign: 'left', borderRight: '1pt solid #000' },
  lastCell: { borderRight: 0 },

  // Summary rows
  sumRow: { flexDirection: 'row', borderBottom: '1pt solid #000' },
  sumLabel: { fontFamily: 'Helvetica-Bold', fontSize: 9, padding: '4 6', textAlign: 'right', borderRight: '1pt solid #000', flex: 1 },
  sumValue: { fontSize: 9, padding: '4 6', textAlign: 'center', width: 80, borderRight: '1pt solid #000' },
  sumEmpty: { fontSize: 9, padding: '4 6', flex: 2, borderRight: '1pt solid #000' },

  // Amenities
  amenityBar: { flexDirection: 'row', border: '1pt solid #000', marginTop: 0 },
  amenityCell: { flex: 1, fontSize: 8, fontFamily: 'Helvetica-Bold', padding: '3 2', textAlign: 'center', borderRight: '1pt solid #000' },
  amenityCellLast: { flex: 1, fontSize: 8, fontFamily: 'Helvetica-Bold', padding: '3 2', textAlign: 'center' },
  amenityNote: { fontSize: 8, marginBottom: 4, marginTop: 4 },

  // Terms
  termsHeader: { fontFamily: 'Helvetica-Bold', fontSize: 10, marginTop: 14, marginBottom: 6, textDecoration: 'underline' },
  termRow: { flexDirection: 'row', marginBottom: 3 },
  termBullet: { width: 10, fontSize: 9 },
  termText: { flex: 1, fontSize: 10, lineHeight: 1.45 },

  // Footer
  thankYou: { fontSize: 9, marginTop: 12, lineHeight: 1.5 },
});

interface Props {
  data: any;
  logo: string;
  settings: any;
  location?: any;
}

const ReservationFormTemplate: React.FC<Props> = ({ data, logo, settings, location }) => {
  const hotelName = location?.name || settings?.organization_name || 'Abbots Manor';
  const logoToDisplay = getLogoPath(location?.logo || logo);

  // Guest info
  const guestName = data?.customer?.name || '';
  const phone = data?.customer?.phone || '';
  const cnic = data?.customer?.cnic || '';
  const email = data?.customer?.email || '';
  
  // Parse adults count
  let parsedGuests: any = data?.guests;
  if (typeof parsedGuests === 'string') {
    try {
      let cleaned = parsedGuests.replace(/\\"/g, '"');
      if (cleaned.startsWith('"') && cleaned.endsWith('"')) {
        cleaned = cleaned.substring(1, cleaned.length - 1);
      }
      parsedGuests = JSON.parse(cleaned);
    } catch {
      try { parsedGuests = JSON.parse(parsedGuests); } catch { parsedGuests = {}; }
    }
  }
  if (typeof parsedGuests === 'string') {
    try { parsedGuests = JSON.parse(parsedGuests); } catch {}
  }

  let adults = 1;
  if (typeof parsedGuests === 'number') {
    adults = parsedGuests;
  } else if (Array.isArray(parsedGuests)) {
    adults = parsedGuests.length || 1;
  } else if (parsedGuests && typeof parsedGuests === 'object') {
    const male = Number(parsedGuests.male || 0);
    const female = Number(parsedGuests.female || 0);
    const explicitAdults = Number(parsedGuests.adults || parsedGuests.adult || parsedGuests.numOfAdults || 0);
    adults = (male + female) > 0 ? (male + female) : (explicitAdults > 0 ? explicitAdults : 1);
  }

  // Dates
  const arrivalDate = formatDate(data?.startDate);
  const departureDate = formatDate(data?.endDate);
  const nights = calcDays(data?.startDate, data?.endDate);

  // Payment method
  const rawPaymentMethod = data?.payments?.length ? (data.payments[0].method || 'cash') : 'cash';
  const paymentMethod = rawPaymentMethod.charAt(0).toUpperCase() + rawPaymentMethod.slice(1);

  // Channel / agent
  let rawChannel = data?.channel || 'Direct';
  let channelDisplay = 'Direct';
  const rawChannelLower = rawChannel.toLowerCase();
  if (rawChannelLower === 'refernce' || rawChannelLower === 'reference') {
    channelDisplay = data?.Referal ? `Reference - ${data.Referal}` : 'Reference';
  } else if (rawChannelLower === 'walk_in' || rawChannelLower === 'walkin') {
    channelDisplay = 'Walk-in';
  } else if (data?.channel) {
    channelDisplay = data.channel;
  }
  if (data?.Agent?.fullName) channelDisplay += ` - ${data.Agent.fullName}`;

  // Room
  const rooms: any[] = data?.rooms || [];

  // Per-room rows
  const roomRows = (data?.reservationRooms && data.reservationRooms.length > 0)
    ? data.reservationRooms.map((rr: any) => {
        const room = rooms.find((r: any) => Number(r.id) === Number(rr.assignedRoomId));
        const roomNights = calcDays(rr.startDate || data?.startDate, rr.endDate || data?.endDate);
        const rate = Number(rr.pricePerDay || 0);
        const amount = rate * roomNights;
        const roomType = room?.RoomType?.name || 'Room';
        const roomLabel = room?.roomNo ? `Room ${room.roomNo} (${roomType})` : roomType;
        return { resId: data?.refno || data?.id || '', name: guestName, roomType: roomLabel, rate, nights: roomNights, amount };
      })
    : rooms.map((room: any) => {
        const rr = room.ReservationRoom;
        const roomNights = calcDays(rr?.startDate || data?.startDate, rr?.endDate || data?.endDate);
        const rate = Number(rr?.pricePerDay || 0);
        const amount = rate * roomNights;
        const roomType = room.RoomType?.name || '';
        return { resId: data?.refno || data?.id || '', name: guestName, roomType, rate, nights: roomNights, amount };
      });

  const roomsTotal = roomRows.reduce((s, r) => s + r.amount, 0);

  // POS / Extras Items
  const standardExtras = (data?.extras || []).map((e: any) => {
    const qty = Number(e.ReservationExtra?.quantity || e.quantity || 1);
    const price = Number(e.sellPrice || e.price || 0);
    const totalPrice = Number(e.ReservationExtra?.totalPrice || (price * qty));
    return {
      name: e.name || 'POS Service/Item',
      price,
      qty,
      totalPrice
    };
  });

  const customExtras = (data?.customExtras || []).map((ce: any) => {
    const qty = Number(ce.quantity || ce.qty || 1);
    const price = Number(ce.price || ce.amount || 0);
    const totalPrice = Number(ce.totalPrice || (price * qty));
    return {
      name: ce.name || 'Custom Item',
      price,
      qty,
      totalPrice
    };
  });

  const posItems = [...standardExtras, ...customExtras];
  const posTotal = posItems.reduce((acc, item) => acc + item.totalPrice, 0);

  // Transportation Trips
  const trips = (data?.trips || []).map((t: any) => {
    const vehicleName = t.vehicle?.name || 'Vehicle';
    const vehiclePlate = t.vehicle?.plateNumber ? ` (${t.vehicle.plateNumber})` : '';
    return {
      date: formatDate(t.startTime),
      vehicle: `${vehicleName}${vehiclePlate}`,
      purpose: t.purpose || '-',
      billingType: t.billingType || '-',
      status: t.status || '-',
      amount: Number(t.amount || 0)
    };
  });
  const tripsTotal = trips.reduce((acc, trip) => acc + trip.amount, 0);

  // Financials
  const taxPct = Number(data?.taxAmount) != null && !isNaN(Number(data?.taxAmount)) && Number(data?.taxAmount) > 0 ? Number(data?.taxAmount) : 0;
  const taxName = data?.taxName || 'GST';
  const isTaxInclusive = data?.isTaxInclusive === true || data?.isTaxInclusive === 'true';

  const discountVal = Number(data?.discount || 0);
  const discountType = data?.discountType || 'percentage';
  const discountAmount = discountType === 'fixed'
    ? discountVal
    : (roomsTotal * (discountVal / 100));

  const halfDayAmount = Number(data?.halfDayAmount || 0);
  const halfDayChargeName = data?.halfDayChargeName || 'half room rent';
  const netRoomRent = Math.max(0, roomsTotal - discountAmount);
  // 4. balance Total = Room Rent Total - Discount + half room rent
  const balanceTotal = Math.max(0, netRoomRent + halfDayAmount);

  // 5. GST (calculated on net room rent, consistent with booking page and database)
  const roomTax = taxPct > 0
    ? (isTaxInclusive
        ? netRoomRent - (netRoomRent / (1 + taxPct / 100))
        : netRoomRent * (taxPct / 100))
    : 0;
  const roomAfterTax = isTaxInclusive ? netRoomRent : netRoomRent + roomTax;

  const waivedAmount = Number(data?.waivedAmount || 0);

  const grandTotal = roomAfterTax + halfDayAmount + tripsTotal - waivedAmount;
  const nonPosPayments = (data?.payments || []).filter((p: any) => !p.saleId);
  const advancePaid = nonPosPayments.length > 0
    ? nonPosPayments.reduce((s: number, p: any) => s + Number(p.amount || 0), 0)
    : Number(data?.advancePaid || 0);
  const balance = grandTotal - advancePaid;

  let complimentaryDisplay = "None";
  if (data?.complimentary) {
    let comp = data.complimentary;
    if (typeof comp === "string") {
      try { comp = JSON.parse(comp); } catch (e) { /* keep as string */ }
    }
    if (Array.isArray(comp) && comp.length > 0) {
      complimentaryDisplay = comp.join(", ");
    } else if (typeof comp === "string" && comp.trim()) {
      complimentaryDisplay = comp.trim();
    }
  }

  // Column widths (total = 100%)
  const COL = { resId: '9%', name: '18%', type: '18%', rate: '12%', nights: '11%', amount: '12%', pickup: '10%', drop: '10%' };

  return (
    <Document>
      <Page size="A4" style={s.page}>

        {/* ── HEADER ── */}
        <View style={s.header}>
          {logoToDisplay ? <Image src={logoToDisplay} style={s.logo} /> : <View style={{ width: 70 }} />}
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Text style={s.hotelName}>{hotelName}</Text>
            {location?.address && <Text style={{ fontSize: 8, color: '#475569', marginTop: 1 }}>{location.address}</Text>}
            <Text style={{ fontSize: 8, color: '#475569', marginTop: 1 }}>
              {`Phone: ${(location?.contactPhone && location.contactPhone !== "+92 51 1234567") ? location.contactPhone : (settings?.organization_phone || "+92 300 4333458")}`} {location?.contactEmail ? ` | Email: ${location.contactEmail}` : ''}
            </Text>
          </View>
          <View style={{ width: 70 }} />
        </View>

        {/* ── INTRO LINE ── */}
        <Text style={s.intro}>
          We feel immense pleasure to confirm your reservation at <Text style={s.bold}>"{hotelName}"</Text>. Below is the summary of your initial itinerary as desired by yourself.
        </Text>

        {/* ── INFO GRID ── */}
        <View style={s.infoGrid}>
          <View style={s.infoLeft}>
            <Text style={s.infoLabel}>Confirmation Number:</Text>
            <Text style={s.infoValue}>{data?.refno || data?.id || ''}</Text>
          </View>
          <View style={s.infoRight} />
        </View>

        <View style={s.infoGrid}>
          <View style={s.infoLeft}>
            <Text style={s.infoLabel}>Guest Name:</Text>
            <Text style={s.infoValue}>{guestName}</Text>
          </View>
          <View style={s.infoRight}>
            <Text style={s.infoLabel}>Res Made by:</Text>
            <Text style={s.infoValue}>{channelDisplay}</Text>
          </View>
        </View>

        <View style={s.infoGrid}>
          {/* <View style={s.infoLeft}>
            <Text style={s.infoLabel}>Guest Name2:</Text>
            <Text style={s.infoValue}></Text>
          </View> */}
          <View style={s.infoRight}>
            <Text style={s.infoLabel}>Room Category:</Text>
            <Text style={s.infoValue}>{rooms[0]?.RoomType?.name || ''}</Text>
          </View>
        </View> 

        <View style={s.infoGrid}>
          {/* <View style={s.infoLeft}>
            <Text style={s.infoLabel}>Guest Name3:</Text>
            <Text style={s.infoValue}></Text>
          </View> */}
          <View style={s.infoRight}>
            <Text style={s.infoLabel}>Payment Mode:</Text>
            <Text style={s.infoValue}>{paymentMethod}</Text>
          </View>
        </View>

        <View style={s.infoGrid}>
          <View style={s.infoLeft}>
            <Text style={s.infoLabel}>Company:</Text>
            <Text style={s.infoValue}>{data?.group?.name || ''}</Text>
          </View>
          <View style={s.infoRight}>
            <Text style={s.infoLabel}>Complimentary:</Text>
            <Text style={s.infoValue}>{complimentaryDisplay}</Text>
          </View>
        </View>

        <View style={s.infoGrid}>
          <View style={s.infoLeft}>
            <Text style={s.infoLabel}>Arrival Date:</Text>
            <Text style={s.infoValue}>{arrivalDate}</Text>
          </View>
          <View style={s.infoRight}>
            <Text style={s.infoLabel}>Res Remarks:</Text>
            <Text style={s.infoValue}>{data?.resNotes || ''}</Text>
          </View>
        </View>

        <View style={s.infoGrid}>
          <View style={s.infoLeft}>
            <Text style={s.infoLabel}>Departure Date:</Text>
            <Text style={s.infoValue}>{departureDate}</Text>
          </View>
          <View style={s.infoRight}>
            <Text style={s.infoLabel}>No. of Rooms:</Text>
            <Text style={s.infoValue}>{rooms.length}</Text>
          </View>
        </View>

        <View style={s.infoGrid}>
          <View style={s.infoLeft}>
            <Text style={s.infoLabel}>No. of nights:</Text>
            <Text style={s.infoValue}>{nights}</Text>
          </View>
          <View style={s.infoRight}>
            <Text style={s.infoLabel}>Entered By:</Text>
            <Text style={s.infoValue}></Text>
          </View>
        </View>

        <View style={s.infoGrid}>
          <View style={s.infoLeft}>
            <Text style={s.infoLabel}>No. of adult:</Text>
            <Text style={s.infoValue}>{adults}</Text>
          </View>
        </View>

        {/* ── ROOM TABLE ── */}
        <View style={s.table}>
          {/* Header */}
          <View style={s.thead}>
            <Text style={[s.th, { width: COL.resId }]}>Res{'\n'}ID</Text>
            <Text style={[s.th, { width: COL.name }]}>Name</Text>
            <Text style={[s.th, { width: COL.type }]}>Room Type</Text>
            <Text style={[s.th, { width: COL.rate }]}>Rate</Text>
            <Text style={[s.th, { width: COL.nights }]}>Nights</Text>
            <Text style={[s.th, { width: COL.amount }]}>Amount</Text>
            <Text style={[s.th, { width: COL.pickup }]}>Pickup /{'\n'}Time</Text>
            <Text style={[s.th, s.lastCell, { width: COL.drop }]}>Drop /{'\n'}Time</Text>
          </View>

          {/* Room Rows */}
          {roomRows.map((row, i) => (
            <View key={i} style={s.trow}>
              <Text style={[s.td, { width: COL.resId }]}>{row.resId}</Text>
              <Text style={[s.tdLeft, { width: COL.name }]}>{row.name}</Text>
              <Text style={[s.tdLeft, { width: COL.type }]}>{row.roomType}</Text>
              <Text style={[s.td, { width: COL.rate }]}>{row.rate.toFixed(2)}</Text>
              <Text style={[s.td, { width: COL.nights }]}>{row.nights}</Text>
              <Text style={[s.td, { width: COL.amount }]}>{row.amount.toFixed(2)}</Text>
              <Text style={[s.td, { width: COL.pickup }]}></Text>
              <Text style={[s.td, s.lastCell, { width: COL.drop }]}></Text>
            </View>
          ))}

          {/* Room Rent Total */}
          <View style={s.sumRow}>
            <Text style={[s.sumEmpty, { flex: 3 }]}></Text>
            <Text style={[s.sumLabel, { flex: 1 }]}>Room Rent Total</Text>
            <Text style={[s.sumValue]}>{roomsTotal.toFixed(2)}</Text>
            <Text style={[s.td, { width: COL.pickup, borderRight: '1pt solid #000' }]}></Text>
            <Text style={[s.td, s.lastCell, { width: COL.drop }]}></Text>
          </View>

          {/* Discount (only shown if discount > 0) */}
          {discountAmount > 0 && (
            <View style={s.sumRow}>
              <Text style={[s.sumEmpty, { flex: 3 }]}></Text>
              <Text style={[s.sumLabel, { flex: 1 }]}>Discount ({discountType === 'fixed' ? 'Fixed' : `${discountVal}%`})</Text>
              <Text style={[s.sumValue, { color: '#16a34a' }]}>-{discountAmount.toFixed(2)}</Text>
              <Text style={[s.td, { width: COL.pickup, borderRight: '1pt solid #000' }]}></Text>
              <Text style={[s.td, s.lastCell, { width: COL.drop }]}></Text>
            </View>
          )}

          {/* Balance Total */}
          <View style={s.sumRow}>
            <Text style={[s.sumEmpty, { flex: 3 }]}></Text>
            <Text style={[s.sumLabel, { flex: 1, fontFamily: 'Helvetica-Bold' }]}>Balance Total</Text>
            <Text style={[s.sumValue, { fontFamily: 'Helvetica-Bold' }]}>{balanceTotal.toFixed(2)}</Text>
            <Text style={[s.td, { width: COL.pickup, borderRight: '1pt solid #000' }]}></Text>
            <Text style={[s.td, s.lastCell, { width: COL.drop }]}></Text>
          </View>

          {/* GST */}
          {taxPct > 0 && (
            <View style={s.sumRow}>
              <Text style={[s.sumEmpty, { flex: 3 }]}></Text>
              <Text style={[s.sumLabel, { flex: 1 }]}>{taxName || 'GST'} {taxPct}%{isTaxInclusive ? ' (Incl.)' : ''}</Text>
              <Text style={[s.sumValue]}>{roomTax.toFixed(2)}</Text>
              <Text style={[s.td, { width: COL.pickup, borderRight: '1pt solid #000' }]}></Text>
              <Text style={[s.td, s.lastCell, { width: COL.drop }]}></Text>
            </View>
          )}

          {/* Waived Amount (if any) */}
          {waivedAmount > 0 && (
            <View style={s.sumRow}>
              <Text style={[s.sumEmpty, { flex: 3 }]}></Text>
              <Text style={[s.sumLabel, { flex: 1 }]}>Waived Amount</Text>
              <Text style={[s.sumValue, { color: '#ea580c' }]}>-{waivedAmount.toFixed(2)}</Text>
              <Text style={[s.td, { width: COL.pickup, borderRight: '1pt solid #000' }]}></Text>
              <Text style={[s.td, s.lastCell, { width: COL.drop }]}></Text>
            </View>
          )}

          {/* Grand Total */}
          <View style={s.sumRow}>
            <Text style={[s.sumEmpty, { flex: 3 }]}></Text>
            <Text style={[s.sumLabel, { flex: 1, fontFamily: 'Helvetica-Bold' }]}>Grand Total</Text>
            <Text style={[s.sumValue, { fontFamily: 'Helvetica-Bold' }]}>{grandTotal.toFixed(2)}</Text>
            <Text style={[s.td, { width: COL.pickup, borderRight: '1pt solid #000' }]}></Text>
            <Text style={[s.td, s.lastCell, { width: COL.drop }]}></Text>
          </View>

          {/* Total Pay */}
          <View style={s.sumRow}>
            <Text style={[s.sumEmpty, { flex: 3 }]}></Text>
            <Text style={[s.sumLabel, { flex: 1 }]}>Total Pay</Text>
            <Text style={[s.sumValue]}>{advancePaid.toFixed(2)}</Text>
            <Text style={[s.td, { width: COL.pickup, borderRight: '1pt solid #000' }]}></Text>
            <Text style={[s.td, s.lastCell, { width: COL.drop }]}></Text>
          </View>

          {/* Balance */}
          <View style={[s.sumRow, { borderBottom: 0 }]}>
            <Text style={[s.sumEmpty, { flex: 3 }]}></Text>
            <Text style={[s.sumLabel, { flex: 1, fontFamily: 'Helvetica-Bold', color: balance > 0 ? '#dc2626' : '#16a34a' }]}>Balance</Text>
            <Text style={[s.sumValue, { fontFamily: 'Helvetica-Bold', color: balance > 0 ? '#dc2626' : '#16a34a' }]}>{balance.toFixed(2)}</Text>
            <Text style={[s.td, { width: COL.pickup, borderRight: '1pt solid #000' }]}></Text>
            <Text style={[s.td, s.lastCell, { width: COL.drop }]}></Text>
          </View>
        </View>


        {/* ── TRANSPORTATION TRIPS TABLE ── */}
        {trips.length > 0 && (
          <View style={{ marginTop: 10 }}>
            <Text style={{ fontFamily: 'Helvetica-Bold', fontSize: 9, marginBottom: 4 }}>Transportation Trips</Text>
            <View style={s.table}>
              <View style={s.thead}>
                <Text style={[s.th, { width: '18%' }]}>Date</Text>
                <Text style={[s.th, { width: '25%' }]}>Vehicle</Text>
                <Text style={[s.th, { width: '20%' }]}>Purpose</Text>
                <Text style={[s.th, { width: '17%' }]}>Billing / Status</Text>
                <Text style={[s.th, s.lastCell, { width: '20%' }]}>Amount</Text>
              </View>
              {trips.map((trip, idx) => (
                <View key={idx} style={s.trow}>
                  <Text style={[s.td, { width: '18%' }]}>{trip.date}</Text>
                  <Text style={[s.tdLeft, { width: '25%' }]}>{trip.vehicle}</Text>
                  <Text style={[s.tdLeft, { width: '20%' }]}>{trip.purpose}</Text>
                  <Text style={[s.td, { width: '17%' }]}>{trip.billingType}</Text>
                  <Text style={[s.td, s.lastCell, { width: '20%' }]}>{trip.amount.toFixed(2)}</Text>
                </View>
              ))}
              <View style={[s.sumRow, { borderBottom: 0 }]}>
                <Text style={[s.sumLabel, { flex: 1 }]}>Trips Subtotal</Text>
                <Text style={[s.sumValue, s.lastCell]}>{tripsTotal.toFixed(2)}</Text>
              </View>
            </View>
          </View>
        )}

        {/* ── TERMS ── */}
        <TermsAndConditionsPDF
          title="Reservation Form T&Cs"
          intro=""
          titleStyle={s.termsHeader}
          itemStyle={s.termRow}
          numberStyle={s.termBullet}
          textStyle={s.termText}
          bulletType="bullet"
          terms={(settings?.reservation_terms ? settings.reservation_terms.split('\n') : TERMS)
            .map((t: string) => t.trim())
            .filter((t: string) => t !== '' && !t.toLowerCase().includes('complimentary services for in-house guests include'))}
        />

        {/* ── THANK YOU ── */}
        <Text style={s.thankYou}>
          We thank you for choosing to stay at {hotelName} and look forward to welcoming you or your guest on this date.
        </Text>

      </Page>
    </Document>
  );
};

export default ReservationFormTemplate;
