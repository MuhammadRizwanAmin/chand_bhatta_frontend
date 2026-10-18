import React from 'react';
import { Text, View } from "@react-pdf/renderer";

export const HARDCODED_INVOICE_TERMS = [
    "Payment can be made through Credit or Debit Card, Bank Transfer, or Cash at the resort.",
    "A 50% advance payment is required to confirm the reservation, while the remaining 50% must be paid at least 7 days before arrival.",
    "Bookings made within 7 days of arrival, promotional bookings, and special offers require 100% advance payment.",
    "Standard check-in time is 2:00 PM and check-out time is 12:00 PM. Early check-in and late check-out are subject to availability and additional charges.",
    "Cancellations made 10 or more days before arrival will be subject to a 10% deduction from the total booking amount.",
    "Cancellations made less than 5 days before arrival will be subject to a 30% deduction from the total booking amount.",
    "No refund will be provided for no-shows or early departures unless approved by resort management.",
    "In case of flight cancellation or road closure, the booking amount will be converted into hotel credit valid for 6 months instead of a cash refund, subject to supporting documents and applicable terms.",
    "Extension of stay due to flight cancellation is subject to room availability and applicable room rates.",
    "Separate terms and conditions apply to group bookings of 5 or more rooms. A 25% administrative charge may apply, with the remaining amount issued as hotel credit valid for 6 months.",
    "Corporate bookings require a 50% advance payment, with the remaining balance payable before arrival. Credit facilities are available only for approved corporate accounts.",
    "Children under 5 years may stay free when sharing existing bedding with their parents. Extra beds and breakfast will be charged separately.",
    "Guests must present a valid identification document at check-in, remain responsible for any damages, and comply with all resort rules.",
    "Misconduct or violation of resort policies may result in removal from the property without a refund.",
    "The resort will not be responsible for delays, cancellations, or losses caused by flight cancellations, road closures, natural disasters, government restrictions, or other unforeseen events.",
    "Approved refunds will be processed through the original payment method and may be subject to applicable bank charges, payment processing fees, and processing time.",
    "Complimentary parking is available for registered guests. Vehicles are parked at the owner's risk.",
    "Pets are permitted only with prior approval from resort management.",
    "The resort reserves the right to refuse accommodation, change its policies, or cancel reservations due to unforeseen operational circumstances.",
    "Complimentary breakfast is served from 8:00 AM to 10:00 AM.",
    "Outside food supplies, external catering services, and cooking inside hotel rooms are strictly prohibited.",
    "Foreign guests must present an original passport and valid visa, while Pakistani guests must present an original CNIC.",
    "Reservations without a deposit are not guaranteed and will remain tentative until the required payment is received.",
    "Cancellations or amendments must be communicated in writing at least 48 hours before arrival. Late cancellations and no-shows will be handled according to the resort's cancellation policy.",
    "Refundable amounts will be transferred through the bank within 30 working days.",
    "A 100% advance payment is required to confirm a room reservation.",
    "An extra mattress is available for PKR 5,000, including breakfast.",
    "For temporary reservations, the required advance payment must be made within 24 hours. Otherwise, the booking will be automatically cancelled.",
    "The deposit slip or payment receipt must be shared as proof of payment.",
    "The resort will not be responsible for damage to guest vehicles caused by natural disasters, severe weather, or other weather-related incidents.",
    "All guest vehicles are monitored through 24/7 surveillance for protection against theft."
];

export const HARDCODED_REGISTRATION_TERMS = [
    "Standard check-in time is 2:00 PM and check-out time is 12:00 PM. Early check-in and late check-out are subject to availability and additional charges.",
    "Extension of stay due to flight cancellation is subject to room availability and applicable room rates.",
    "Children under 5 years may stay free when sharing existing bedding with their parents. Extra beds and breakfast will be charged separately.",
    "Guests must present a valid identification document at check-in, remain responsible for any damages, and comply with all resort rules.",
    "Misconduct or violation of resort policies may result in removal from the property without a refund.",
    "Complimentary parking is available for registered guests. Vehicles are parked at the owner's risk.",
    "Pets are permitted only with prior approval from resort management.",
    "The resort reserves the right to refuse accommodation, change its policies, or cancel reservations due to unforeseen operational circumstances.",
    "Outside food supplies, external catering services, and cooking inside hotel rooms are strictly prohibited.",
    "An extra mattress is available for PKR 5,000, including breakfast.",
    "The resort will not be responsible for damage to guest vehicles caused by natural disasters, severe weather, or other weather-related incidents.",
    "All guest vehicles are monitored through 24/7 surveillance for protection against theft.",
    "Smoking is strictly prohibited inside the room, dedicated smoking areas are available at the Resort."
];

export const HARDCODED_RESERVATION_FORM_TERMS = [
    "Payment can be made through Credit or Debit Card, Bank Transfer, or Cash at the resort.",
    "A 50% advance payment is required to confirm the reservation, while the remaining 50% must be paid at least 7 days before arrival.",
    "Bookings made within 7 days of arrival, promotional bookings, and special offers require 100% advance payment.",
    "Standard check-in time is 2:00 PM and check-out time is 12:00 PM. Early check-in and late check-out are subject to availability and additional charges.",
    "Cancellations made 10 or more days before arrival will be subject to a 10% deduction from the total booking amount.",
    "Cancellations made less than 5 days before arrival will be subject to a 30% deduction from the total booking amount.",
    "No refund will be provided for no-shows or early departures unless approved by resort management.",
    "In case of flight cancellation or road closure, the booking amount will be converted into hotel credit valid for 6 months instead of a cash refund, subject to supporting documents and applicable terms.",
    "Extension of stay due to flight cancellation is subject to room availability and applicable room rates.",
    "Corporate bookings require a 50% advance payment, with the remaining balance payable before arrival. Credit facilities are available only for approved corporate accounts.",
    "Children under 5 years may stay free when sharing existing bedding with their parents. Extra beds and breakfast will be charged separately.",
    "Guests must present a valid identification document at check-in, remain responsible for any damages, and comply with all resort rules.",
    "Misconduct or violation of resort policies may result in removal from the property without a refund.",
    "Approved refunds will be processed through the original payment method and may be subject to applicable bank charges, payment processing fees, and processing time.",
    "Complimentary parking is available for registered guests. Vehicles are parked at the owner's risk.",
    "Separate terms and conditions apply to group bookings of 5 or more rooms. A 30% administrative charge may apply, with the remaining amount issued as hotel credit valid for 6 months.",
    "Pets are permitted only with prior approval from resort management.",
    "The resort reserves the right to refuse accommodation, change its policies, or cancel reservations due to unforeseen operational circumstances.",
    "Outside food supplies, external catering services, and cooking inside hotel rooms are strictly prohibited.",
    "Foreign guests must present an original passport and valid visa, while Pakistani guests must present an original CNIC.",
    "Reservations without a deposit are not guaranteed and will remain tentative until the required payment is received.",
    "Cancellations or amendments must be communicated in writing at least 48 hours before arrival. Late cancellations and no-shows will be handled according to the resort's cancellation policy.",
    "Refundable amounts will be transferred through the bank within 30 working days.",
    "An extra mattress is available for PKR 5,000, including breakfast.",
    "For temporary reservations, the required advance payment must be made within 24 hours. Otherwise, the booking will be automatically cancelled.",
    "The deposit slip or payment receipt must be shared as proof of payment.",
    "The resort will not be responsible for damage to guest vehicles caused by natural disasters, severe weather, or other weather-related incidents.",
    "All guest vehicles are monitored through 24/7 surveillance for protection against theft.",
    "Smoking is strictly prohibited inside the room, dedicated smoking areas are available at the Resort."
];

export const HARDCODED_RESERVATION_TERMS = HARDCODED_RESERVATION_FORM_TERMS;
export const HARDCODED_TERMS = HARDCODED_INVOICE_TERMS;

interface TermsAndConditionsPDFProps {
    containerStyle?: any;
    titleStyle?: any;
    textStyle?: any;
    itemStyle?: any;
    numberStyle?: any;
    title?: string;
    intro?: string;
    introStyle?: any;
    bulletType?: "number" | "bullet";
    terms?: string[];
}

export const TermsAndConditionsPDF = ({
    containerStyle,
    titleStyle,
    textStyle,
    itemStyle,
    numberStyle,
    title = "Terms & Conditions:",
    intro = "",
    introStyle,
    bulletType = "number",
    terms = HARDCODED_INVOICE_TERMS
}: TermsAndConditionsPDFProps) => {
    const cleanTerms = (terms || []).filter((t: string) => {
        if (!t || typeof t !== "string") return false;
        const lower = t.trim().toLowerCase();
        return lower !== "" && !lower.includes("complimentary services for in-house guests include");
    });

    return (
        <View style={containerStyle}>
            {title && <Text style={titleStyle}>{title}</Text>}
            {intro && (
                <Text style={introStyle || [textStyle, { marginBottom: 4 }]}>
                    {intro}
                </Text>
            )}
            {cleanTerms.map((text, idx) => (
                <View key={idx} style={itemStyle}>
                    <Text style={numberStyle}>{bulletType === "number" ? `${idx + 1}.` : "•"}</Text>
                    <Text style={textStyle}>{text}</Text>
                </View>
            ))}
        </View>
    );
};
