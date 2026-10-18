import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { X, Printer, Settings, Layout, Receipt, RefreshCw, FileText } from "lucide-react";
import api from "../services/api";
import templates from "./InvoiceTemplates";
import pdfTemplates from "./InvoiceTemplatesPDF";
import { toast } from "sonner";
import { pdf } from "@react-pdf/renderer";

interface InvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: any;
}

export function InvoiceModal({ isOpen, onClose, booking }: InvoiceModalProps) {
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<any>(null);
  const [templateKey, setTemplateKey] = useState("a4_modern");
  const [billingMode, setBillingMode] = useState("all"); // "all" | "rooms" | "extras"
  const printRef = useRef<HTMLDivElement>(null);
  const [locationDetails, setLocationDetails] = useState<any>({
    name: "Main Branch",
    address: "Hotel Street, Sect 2, Islamabad",
    contactPhone: "+92 300 4333458",
    contactEmail: "info@hotelerp.com",
    ntn: "7464220-7"
  });

  useEffect(() => {
    if (!isOpen) return;

    setLoading(true);
    // Fetch Settings and Locations
    Promise.all([
      api.get("/setting").catch(() => null),
      api.get("/locations").catch(() => null)
    ])
      .then(([settingRes, locationRes]) => {
        const s = settingRes?.data?.settings;
        if (s) {
          setSettings(s);
          if (s.selected_invoice_template) {
            setTemplateKey(s.selected_invoice_template);
          }
        }

        const locs = locationRes?.data || [];
        const currentLocId = localStorage.getItem('locationId');
        const currentLoc = locs.find((l: any) => String(l.id) === currentLocId) || locs[0];

        if (currentLoc) {
          setLocationDetails({
            name: currentLoc.name || s?.organization_name || "Main Branch",
            address: currentLoc.address || s?.organization_location || "Hotel Street, Sect 2, Islamabad",
            contactPhone: (currentLoc.contactPhone && currentLoc.contactPhone !== "+92 51 1234567") ? currentLoc.contactPhone : (s?.organization_phone || "+92 300 4333458"),
            contactEmail: currentLoc.contactEmail || "info@hotelerp.com",
            logo: currentLoc.logo || null,
            ntn: currentLoc.ntn || s?.ntn_number || s?.ntn || "7464220-7"
          });
        } else if (s) {
          setLocationDetails((prev: any) => ({
            ...prev,
            name: s.organization_name || prev.name,
            address: s.organization_location || prev.address,
            contactPhone: s.organization_phone || "+92 300 4333458",
            ntn: s.ntn_number || s.ntn || "7464220-7"
          }));
        }
      })
      .catch((err) => {
        console.error("Failed to load settings in invoice modal:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [isOpen]);

  if (!isOpen) return null;

  const SelectedTemplateComponent = templates[templateKey] || templates["a4_modern"];

  const handlePrint = async () => {
    try {
      const SelectedPDFTemplate = pdfTemplates[templateKey] || pdfTemplates["a4_modern"];
      const activeLogo = locationDetails.logo || settings?.organization_logo || undefined;
      const doc = <SelectedPDFTemplate data={booking} settings={settings} location={locationDetails} mode={billingMode} logo={activeLogo} />;
      const asPdf = pdf();
      asPdf.updateContainer(doc);
      const blob = await asPdf.toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Invoice_${booking?.refno || booking?.id}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), 100);
      toast.success("Invoice PDF downloaded successfully!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate PDF");
    }
  };

  const handleBrowserPrint = () => {
    const printContent = printRef.current?.innerHTML || '';
    const printWindow = window.open('', '', 'width=900,height=800');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Print Invoice - ${booking?.refno || booking?.id}</title>
            <style>
              body { margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
              @media print {
                @page { margin: 0; }
                body { margin: 0.5cm; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
              }
            </style>
          </head>
          <body>
            ${printContent}
            <script>
              window.onload = () => {
                setTimeout(() => {
                  window.print();
                }, 300);
              };
              window.onafterprint = () => window.close();
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  const isSale = booking?.channel === "POS Sale" || (booking?.rooms && booking.rooms.length === 0);

  return (
    <>
      <div className="fixed inset-0 z-9999 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm no-print">
        <div className="bg-white rounded-2xl w-full max-w-5xl h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          
          {/* Modal Header */}
          <div className="px-6 py-4 bg-[#0F172A] text-white flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="bg-[#D4A017] p-2 rounded-lg text-white">
                <Receipt size={20} />
              </div>
              <div>
                <h2 className="text-lg font-bold">Invoice Manager</h2>
                <p className="text-xs text-gray-400">Reservation Reference: {booking?.refno || booking?.id}</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors cursor-pointer">
              <X size={18} />
            </button>
          </div>

          {/* Modal Toolbar */}
          <div className="px-6 py-3.5 bg-gray-50 border-b border-gray-200 flex flex-wrap items-center justify-between gap-4 flex-shrink-0">
            <div className="flex flex-wrap items-center gap-4">
              
              {/* Billing Mode (All / Rooms / Extras) */}
              {!isSale && (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-gray-500 flex items-center gap-1.5"><FileText size={14} /> Filter Bill:</span>
                  <div className="bg-gray-200/70 p-0.5 rounded-lg flex">
                    {[
                      { id: "all", label: "Full Bill" },
                      { id: "rooms", label: "Rooms Only" },
                      { id: "extras", label: "POS / Extras" }
                    ].map((item) => (
                      <button
                        key={item.id}
                        onClick={() => setBillingMode(item.id)}
                        className={`px-3 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                          billingMode === item.id 
                            ? "bg-white text-[#1D4ED8] shadow-sm" 
                            : "text-gray-600 hover:text-gray-900"
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

            </div>

            <div className="flex items-center gap-2">
              <button 
                onClick={handlePrint}
                className="flex items-center gap-2 bg-[#1D4ED8] hover:bg-[#1E40AF] text-white px-5 py-2 rounded-lg text-xs font-bold transition-all shadow-md hover:shadow-lg cursor-pointer"
              >
                <Printer size={15} /> Download PDF
              </button>
            </div>
          </div>

          {/* Modal Body (Scrollable preview area) */}
          <div className="flex-1 bg-gray-100 overflow-y-auto p-8 flex justify-center items-start">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <RefreshCw className="animate-spin text-[#1D4ED8] mb-3" size={28} />
                <p className="text-sm text-gray-500">Loading invoice configuration...</p>
              </div>
            ) : (
              <div ref={printRef} className="bg-white shadow-xl rounded-lg border border-gray-200 overflow-hidden transform origin-top scale-95 transition-transform duration-300 hover:scale-100">
                <SelectedTemplateComponent
                  data={booking}
                  settings={settings}
                  location={locationDetails}
                  mode={billingMode}
                  logo={locationDetails.logo || settings?.organization_logo || undefined}
                />
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-end gap-3 flex-shrink-0">
            <button 
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
            >
              Close Preview
          </button>
            <button 
              onClick={handleBrowserPrint}
              className="flex items-center gap-1.5 bg-[#D4A017] hover:bg-[#B8860B] text-white px-5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer"
            >
              <Printer size={14} /> Send to Print
            </button>
          </div>

        </div>
      </div>

    </>
  );
}

