//@ts-nocheck
import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer";
import { TermsAndConditionsPDF, HARDCODED_REGISTRATION_TERMS } from "../../components/TermsAndConditionsPDF";
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

// Helper to format date
const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
};

const styles = StyleSheet.create({
    page: { padding: "34px", fontFamily: "Helvetica", backgroundColor: "#fff", color: "#000" },
    logoContainer: { alignItems: "center", marginBottom: 10 },
    logo: { width: 80, height: 60, objectFit: "contain" },
    title: { fontSize: 20, fontWeight: "bold", textAlign: "center", textTransform: "uppercase", marginBottom: 20 },
    
    table: { width: "100%", borderTop: "1px solid #000", borderLeft: "1px solid #000", marginBottom: 20 },
    row: { flexDirection: "row", borderBottom: "1px solid #000" },
    colLeftLabel: { width: "20%", padding: 6, fontSize: 10, fontWeight: "bold", borderRight: "1px solid #000" },
    colLeftValue: { width: "30%", padding: 6, fontSize: 10, borderRight: "1px solid #000" },
    colRightLabel: { width: "20%", padding: 6, fontSize: 10, fontWeight: "bold", borderRight: "1px solid #000" },
    colRightValue: { width: "30%", padding: 6, fontSize: 10, borderRight: "1px solid #000" },
    
    termsContainer: { marginTop: 10 },
    termsHeader: { fontSize: 10, fontWeight: "bold", marginBottom: 4 },
    termItem: { flexDirection: "row", marginBottom: 2 },
    termNumber: { width: 16, fontSize: 8, textAlign: "right", marginRight: 4 },
    termText: { flex: 1, fontSize: 8, lineHeight: 1.3 },
    
    signatureContainer: { flexDirection: "row", justifyContent: "space-between", marginTop: 70, paddingHorizontal: 10 },
    signatureBox: { width: "28%" },
    signatureLine: { borderBottom: "1px solid #000", marginBottom: 5 },
    signatureText: { fontSize: 10, textAlign: "left" }
});

export const RegistrationCardTemplate = ({ data, logo, settings, location }) => {
    // Parse rooms
    const roomNo = data?.rooms && data.rooms.length > 0
        ? data.rooms.map(r => r.roomNo).join(", ")
        : "";

    // Parse pax
    let pax = 1;
    if (data?.guests) {
        let parsedGuests = data.guests;
        if (typeof parsedGuests === "string") {
            try {
                let cleaned = parsedGuests.replace(/\\"/g, '"');
                if (cleaned.startsWith('"') && cleaned.endsWith('"')) {
                    cleaned = cleaned.substring(1, cleaned.length - 1);
                }
                parsedGuests = JSON.parse(cleaned);
            } catch(e) {
                try { parsedGuests = JSON.parse(parsedGuests); } catch(e) {}
            }
        }
        if (typeof parsedGuests === "string") {
            try { parsedGuests = JSON.parse(parsedGuests); } catch(e) {}
        }
        if (typeof parsedGuests === "number") {
            pax = parsedGuests;
        } else if (Array.isArray(parsedGuests)) {
            pax = parsedGuests.length || 1;
        } else if (parsedGuests && typeof parsedGuests === "object") {
            pax = (Number(parsedGuests.male || 0) + Number(parsedGuests.female || 0) + Number(parsedGuests.children || 0) + Number(parsedGuests.adults || 0)) || 1;
        }
    }

    // Room Rate
    let roomRate = 0;
    let roomRent = data?.roomRent;
    if (typeof roomRent === "string") {
        try {
            let cleaned = roomRent.replace(/\\"/g, '"');
            if (cleaned.startsWith('"') && cleaned.endsWith('"')) {
                cleaned = cleaned.substring(1, cleaned.length - 1);
            }
            roomRent = JSON.parse(cleaned);
        } catch(e) {
            roomRent = [];
        }
    }
    if (Array.isArray(roomRent) && roomRent.length > 0) {
        roomRate = Number(roomRent[0].rate || 0);
    } else if (data?.rooms && data.rooms.length > 0 && data.rooms[0].ReservationRoom?.pricePerDay) {
        roomRate = Number(data.rooms[0].ReservationRoom.pricePerDay || 0);
    }

    // Apply Discount to get the actual rate given to the customer
    let days = 1;
    if (data?.startDate && data?.endDate) {
        const s = new Date(data.startDate);
        const e = new Date(data.endDate);
        days = Math.ceil((e.getTime() - s.getTime()) / 86400000);
        if (days <= 0) days = 1;
    }

    let finalRoomRate = roomRate;
    const discountVal = Number(data?.discount || 0);
    if (discountVal > 0) {
        if (data?.discountType === "percentage") {
            finalRoomRate = roomRate - (roomRate * discountVal / 100);
        } else {
            // Fixed discount is on the total reservation, find the discount per room per day
            const numRooms = data?.rooms?.length || 1;
            const discountPerRoomPerDay = discountVal / (days * numRooms);
            finalRoomRate = roomRate - discountPerRoomPerDay;
        }
    }
    
    if (finalRoomRate < 0) finalRoomRate = 0;
    
    const taxText = data?.taxAmount > 0 ? " + Tax" : "";
    const roomRateDisplay = finalRoomRate > 0 ? `${finalRoomRate.toFixed(2)}${taxText}` : "";

    // Payment method
    let rawPaymentMethod = "";
    if (data?.payments && data.payments.length > 0) {
        rawPaymentMethod = data.payments[0].method || "cash";
    } else {
        rawPaymentMethod = "cash";
    }
    const paymentMethod = rawPaymentMethod.charAt(0).toUpperCase() + rawPaymentMethod.slice(1);

    const arrivalDate = formatDate(data?.startDate);
    const departureDate = formatDate(data?.endDate);
    
    // Create reservation ID formatted string
    const resId = arrivalDate ? `${arrivalDate} ${data?.refno || data?.id || ""}` : (data?.refno || data?.id || "");

    const hotelName = location?.name || settings?.organization_name || "Qubed Hotel";
    const logoToDisplay = getLogoPath(location?.logo || logo);

    let rawChannel = data?.channel || "Direct";
    let channelDisplay = "Direct";
    const rawChannelLower = rawChannel.toLowerCase();
    if (rawChannelLower === "refernce" || rawChannelLower === "reference") {
        channelDisplay = data?.Referal ? `Reference - ${data.Referal}` : "Reference";
    } else if (rawChannelLower === "walk_in" || rawChannelLower === "walkin") {
        channelDisplay = "Walk-in";
    } else if (data?.channel) {
        channelDisplay = data.channel;
    }

    if (data?.Agent?.fullName) {
        channelDisplay += ` - ${data.Agent.fullName}`;
    }

    // Complimentary services
    let complimentaryDisplay = "None";
    if (data?.complimentary) {
        let comp = data.complimentary;
        if (typeof comp === "string") {
            try { comp = JSON.parse(comp); } catch(e) { /* keep as string */ }
        }
        if (Array.isArray(comp) && comp.length > 0) {
            complimentaryDisplay = comp.join(", ");
        } else if (typeof comp === "string" && comp.trim()) {
            complimentaryDisplay = comp.trim();
        }
    }

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {/* LOGO & LOCATION */}
                <View style={styles.logoContainer}>
                    {logoToDisplay && <Image src={logoToDisplay} style={styles.logo} />}
                    <Text style={{ fontSize: 13, fontWeight: "bold", marginTop: 4, textTransform: "uppercase" }}>{hotelName}</Text>
                    {location?.address && <Text style={{ fontSize: 8, color: "#475569", marginTop: 1 }}>{location.address}</Text>}
                    {(location?.contactPhone || location?.contactEmail) && (
                        <Text style={{ fontSize: 8, color: "#475569", marginTop: 1 }}>
                            {location?.contactPhone ? `Phone: ${location.contactPhone}` : ''} {location?.contactEmail ? ` | Email: ${location.contactEmail}` : ''}
                        </Text>
                    )}
                </View>

                {/* TITLE */}
                <Text style={styles.title}>REGISTRATION CARD</Text>

                {/* TABLE */}
                <View style={styles.table}>
                    <View style={styles.row}>
                        <Text style={styles.colLeftLabel}>Guest Name</Text>
                        <Text style={styles.colLeftValue}>{data?.customer?.name || ""}</Text>
                        <Text style={styles.colRightLabel}>Reservation ID</Text>
                        <Text style={styles.colRightValue}>{resId}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.colLeftLabel}>Room No</Text>
                        <Text style={styles.colLeftValue}>{roomNo}</Text>
                        <Text style={styles.colRightLabel}>Billing Instructions</Text>
                        <Text style={styles.colRightValue}>{data?.groupId ? "Bill to Company" : ""}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.colLeftLabel}>Guests</Text>
                        <Text style={styles.colLeftValue}>{pax}</Text>
                        <Text style={styles.colRightLabel}>Mode of Payment</Text>
                        <Text style={styles.colRightValue}>{paymentMethod}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.colLeftLabel}>Room Rate</Text>
                        <Text style={styles.colLeftValue}>{roomRateDisplay}</Text>
                        <Text style={styles.colRightLabel}>Mobile #</Text>
                        <Text style={styles.colRightValue}>{data?.customer?.phone || ""}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.colLeftLabel}>CNIC/Passport</Text>
                        <Text style={styles.colLeftValue}>{data?.customer?.cnic || ""}</Text>
                        <Text style={styles.colRightLabel}>Email</Text>
                        <Text style={styles.colRightValue}>{data?.customer?.email || ""}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.colLeftLabel}>Channel</Text>
                        <Text style={styles.colLeftValue}>{channelDisplay}</Text>
                        <Text style={styles.colRightLabel}>Company</Text>
                        <Text style={styles.colRightValue}>
                            {data?.groupId && data?.group ? data.group.name : ""}
                        </Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.colLeftLabel}>Address</Text>
                        <Text style={styles.colLeftValue}>{data?.customer?.address || ""}</Text>
                        <Text style={styles.colRightLabel}>Nationality</Text>
                        <Text style={styles.colRightValue}></Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.colLeftLabel}>Arrival Date</Text>
                        <Text style={styles.colLeftValue}>{arrivalDate}</Text>
                        <Text style={styles.colRightLabel}>Reservation Remarks</Text>
                        <Text style={styles.colRightValue}>{data?.resNotes || ""}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.colLeftLabel}>Departure Date</Text>
                        <Text style={styles.colLeftValue}>{departureDate}</Text>
                        <Text style={styles.colRightLabel}>Reference Company</Text>
                        <Text style={styles.colRightValue}></Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.colLeftLabel}>Complimentary</Text>
                        <Text style={styles.colLeftValue}>{complimentaryDisplay}</Text>
                        <Text style={styles.colRightLabel}>Next Destination</Text>
                        <Text style={styles.colRightValue}></Text>
                    </View>
                </View>

                {/* COMPLIMENTARY SERVICES */}
                <View style={{ backgroundColor: '#F8FAFC', border: '1pt solid #CBD5E1', padding: 5, marginBottom: 8, borderRadius: 3 }}>
                    <Text style={{ fontSize: 7.5, fontFamily: 'Helvetica-Bold', color: '#1E293B' }}>
                        Complimentary Services Included: {complimentaryDisplay !== "None" ? complimentaryDisplay : "None"}
                    </Text>
                    {complimentaryDisplay.toLowerCase().includes("breakfast") && (
                        <Text style={{ fontSize: 7, color: '#334155', marginTop: 2 }}>
                            * Breakfast is served daily from 8:00 AM to 10:00 AM.
                        </Text>
                    )}
                </View>

                {/* TERMS */}
                <TermsAndConditionsPDF
                    title=""
                    intro="I / We have checked the condition of the room and acknowledge the following:"
                    introStyle={styles.termsHeader}
                    containerStyle={styles.termsContainer}
                    textStyle={styles.termText}
                    itemStyle={styles.termItem}
                    numberStyle={styles.termNumber}
                    terms={(settings?.registration_terms ? settings.registration_terms.split('\n') : HARDCODED_REGISTRATION_TERMS)
                        .map((t: string) => t.trim())
                        .filter((t: string) => t !== '' && !t.toLowerCase().includes('complimentary services for in-house guests include'))}
                />

                {/* SIGNATURES */}
                <View style={styles.signatureContainer}>
                    <View style={styles.signatureBox}>
                        <View style={styles.signatureLine} />
                        <Text style={styles.signatureText}>Guest</Text>
                    </View>
                    <View style={styles.signatureBox}>
                        <View style={styles.signatureLine} />
                        <Text style={styles.signatureText}>F.D.O</Text>
                    </View>
                    <View style={styles.signatureBox}>
                        <View style={styles.signatureLine} />
                        <Text style={styles.signatureText}>Duty Manager</Text>
                    </View>
                </View>

            </Page>
        </Document>
    );
};

export default RegistrationCardTemplate;
