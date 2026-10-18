import { useState, useEffect } from 'react';
import { Settings, Save, Building2, Phone, Mail, Globe, MapPin, Clock, Check, FileText, Receipt, Key, MessageSquare, MailWarning } from 'lucide-react';
import api from '../../services/api';
import { toast } from 'sonner';
import templates from '../../components/InvoiceTemplates';
export function SettingsGeneral() {
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [settingsId, setSettingsId] = useState<number | null>(null);

  // Core organization details
  const [organizationName, setOrganizationName] = useState('');
  const [organizationLocation, setOrganizationLocation] = useState('');
  const [organizationPhone, setOrganizationPhone] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('a4_modern');
  const [termsAndCondition, setTermsAndCondition] = useState('');
  const [registrationTerms, setRegistrationTerms] = useState('');
  const [reservationTerms, setReservationTerms] = useState('');
  const [allowCheckout, setAllowCheckout] = useState(false);
  const [selfService, setSelfService] = useState(false);

  // Twilio Settings
  const [twilioAccountSid, setTwilioAccountSid] = useState('');
  const [twilioAuthToken, setTwilioAuthToken] = useState('');
  const [twilioPhoneNumber, setTwilioPhoneNumber] = useState('');
  const [twilioVerification, setTwilioVerification] = useState('');

  // WhatsApp Meta Settings
  const [whatsappPhoneNumberId, setWhatsappPhoneNumberId] = useState('');
  const [whatsappAccessToken, setWhatsappAccessToken] = useState('');
  const [whatsappBusinessId, setWhatsappBusinessId] = useState('');
  const [whatsappEnabled, setWhatsappEnabled] = useState(false);
  const [whatsappWelcomeTemplate, setWhatsappWelcomeTemplate] = useState('');
  const [whatsappInvoiceTemplate, setWhatsappInvoiceTemplate] = useState('');

  // SMTP Settings
  const [smtpHost, setSmtpHost] = useState('');
  const [smtpPort, setSmtpPort] = useState('');
  const [smtpUser, setSmtpUser] = useState('');
  const [smtpPass, setSmtpPass] = useState('');
  const [smtpSecure, setSmtpSecure] = useState(true);
  const [smtpFromEmail, setSmtpFromEmail] = useState('');
  
  const [thankYouEnabled, setThankYouEnabled] = useState(false);
  const [thankYouChannel, setThankYouChannel] = useState('email');
  const [thankYouTemplate, setThankYouTemplate] = useState('');

  // General configuration
  const [currency, setCurrency] = useState('PKR');
  const [taxPercentageEnabled, setTaxPercentageEnabled] = useState(false);
  const [taxPercentage, setTaxPercentage] = useState<number>(0);
  const [applyReservationTaxOnPos, setApplyReservationTaxOnPos] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.get('/setting')
      .then((res) => {
        const s = res.data?.settings;
        if (s) {
          setSettingsId(s.id);
          setOrganizationName(s.organization_name || '');
          setOrganizationLocation(s.organization_location || '');
          setOrganizationPhone(s.organization_phone || '');
          setSelectedTemplate(s.selected_invoice_template || 'a4_modern');
          setTermsAndCondition(s.termsandcondition || '');
          setRegistrationTerms(s.registration_terms || '');
          setReservationTerms(s.reservation_terms || '');
          setAllowCheckout(!!s.allowCheckout);
          setSelfService(!!s.self_service);
          
          if (s.currency) {
            setCurrency(s.currency);
            localStorage.setItem('currency', s.currency);
          }

          setTaxPercentageEnabled(!!s.tax_percentage_enabled);
          setTaxPercentage(Number(s.tax_percentage) || 0);
          setApplyReservationTaxOnPos(s.apply_reservation_tax_on_pos ?? true);

          // Twilio
          setTwilioAccountSid(s.twilio_account_sid || '');
          setTwilioAuthToken(s.twilio_auth_token || '');
          setTwilioPhoneNumber(s.twilio_phone_number || '');
          setTwilioVerification(s.twilio_verification || '');

          // WhatsApp
          setWhatsappPhoneNumberId(s.whatsapp_phone_number_id || '');
          setWhatsappAccessToken(s.whatsapp_access_token || '');
          setWhatsappBusinessId(s.whatsapp_business_id || '');
          setWhatsappEnabled(!!s.whatsapp_enabled);
          setWhatsappWelcomeTemplate(s.whatsapp_welcome_template || '');
          setWhatsappInvoiceTemplate(s.whatsapp_invoice_template || '');

          // SMTP
          setSmtpHost(s.smtp_host || '');
          setSmtpPort(s.smtp_port || '');
          setSmtpUser(s.smtp_user || '');
          setSmtpPass(s.smtp_pass || '');
          setSmtpSecure(!!s.smtp_secure);
          setSmtpFromEmail(s.smtp_from_email || '');
          setThankYouEnabled(!!s.thank_you_enabled);
          setThankYouChannel(s.thank_you_channel || 'email');
          setThankYouTemplate(s.thank_you_template || '');
        }
      })
      .catch((err) => {
        console.error("Failed to load settings:", err);
        toast.error("Failed to load settings from server.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const handleSave = () => {
    const payload = {
      id: settingsId,
      organization_name: organizationName,
      organization_location: organizationLocation,
      organization_phone: organizationPhone,
      selected_invoice_template: selectedTemplate,
      termsandcondition: termsAndCondition,
      registration_terms: registrationTerms,
      reservation_terms: reservationTerms,
      allowCheckout,
      self_service: selfService,
      currency,
      tax_percentage_enabled: taxPercentageEnabled,
      tax_percentage: taxPercentage,
      apply_reservation_tax_on_pos: applyReservationTaxOnPos,

      // Twilio keys can be saved as null if empty (flexible)
      twilio_account_sid: twilioAccountSid || null,
      twilio_auth_token: twilioAuthToken || null,
      twilio_phone_number: twilioPhoneNumber || null,
      twilio_verification: twilioVerification || null,

      // WhatsApp
      whatsapp_phone_number_id: whatsappPhoneNumberId || null,
      whatsapp_access_token: whatsappAccessToken || null,
      whatsapp_business_id: whatsappBusinessId || null,
      whatsapp_enabled: whatsappEnabled,
      whatsapp_welcome_template: whatsappWelcomeTemplate || null,
      whatsapp_invoice_template: whatsappInvoiceTemplate || null,

      // SMTP Settings
      smtp_host: smtpHost || null,
      smtp_port: smtpPort || null,
      smtp_user: smtpUser || null,
      smtp_pass: smtpPass || null,
      smtp_secure: smtpSecure,
      smtp_from_email: smtpFromEmail || null,
      thank_you_enabled: thankYouEnabled,
      thank_you_channel: thankYouChannel,
      thank_you_template: thankYouTemplate || null,
    };

    api.post('/setting', payload)
      .then(() => {
        setSaved(true);
        localStorage.setItem('currency', currency);
        toast.success("All configurations saved successfully!");
        setTimeout(() => setSaved(false), 2500);
      })
      .catch((err) => {
        console.error("Failed to save settings:", err);
        toast.error("Failed to save settings: " + (err.response?.data?.message || err.message));
      });
  };

  const templatesList = [
    { id: 'a4_modern', name: 'A4 Modern', desc: 'Professional & Sleek layout with blue accents', type: 'A4' },
    { id: 'a4_classic', name: 'A4 Classic', desc: 'Traditional & Formal layout with serif typography', type: 'A4' },
    { id: 'a4_luxury', name: 'A4 Luxury', desc: 'Premium dark sidebar look with gold-inspired layout', type: 'A4' },
    { id: 'a4_minimal', name: 'A4 Minimal', desc: 'Ultra-Clean, contemporary style with simple spacing', type: 'A4' },
    { id: 'thermal_standard', name: 'Thermal Standard', desc: 'Compact & Clear design optimized for 80mm roll paper', type: 'Thermal' },
    { id: 'thermal_premium', name: 'Thermal Premium', desc: 'Structured & Polished look for thermal receipts', type: 'Thermal' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <span className="ml-3 text-gray-600">Loading configurations...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#0F172A]">General Settings</h1>
          <p className="text-gray-600 mt-1">Configure hotel profile, system preferences, and notification keys</p>
        </div>
        <button onClick={handleSave}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium transition-all cursor-pointer ${saved ? 'bg-green-600 text-white shadow' : 'bg-[#1D4ED8] text-white hover:bg-[#1E40AF] shadow-md'}`}>
          <Save size={18} />{saved ? 'Saved!' : 'Save Changes'}
        </button>
      </div>

      {/* Organization Details */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <div className="flex items-center gap-2 mb-5">
          <Building2 size={20} className="text-[#1D4ED8]" />
          <h2 className="text-lg font-semibold text-[#0F172A]">Organization Details</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Organization Name</label>
            <input 
              type="text" 
              value={organizationName} 
              onChange={(e) => setOrganizationName(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Organization Phone</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><Phone size={15} /></span>
              <input 
                type="tel" 
                value={organizationPhone} 
                onChange={(e) => setOrganizationPhone(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]" 
              />
            </div>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Organization Location / Address</label>
            <div className="relative">
              <MapPin size={15} className="absolute left-3 top-3.5 text-gray-400" />
              <textarea 
                rows={2} 
                value={organizationLocation} 
                onChange={(e) => setOrganizationLocation(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]" 
              />
            </div>
          </div>
        </div>
      </div>

      {/* SMS Gateway (Twilio Configuration) */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <div className="flex items-center gap-2 mb-1">
          <Key size={20} className="text-[#1D4ED8]" />
          <h2 className="text-lg font-semibold text-[#0F172A]">Twilio SMS Gateway Configuration</h2>
        </div>
        <p className="text-gray-500 text-sm mb-5">Configure credentials to send automated text/SMS receipts to customers. Leave blank to skip.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Twilio Account SID</label>
            <input 
              type="text" 
              value={twilioAccountSid} 
              onChange={(e) => setTwilioAccountSid(e.target.value)}
              placeholder="e.g. ACxxxxxxxxxxxxxxxxx"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Twilio Auth Token</label>
            <input 
              type="password" 
              value={twilioAuthToken} 
              onChange={(e) => setTwilioAuthToken(e.target.value)}
              placeholder="Your Twilio Secret Token"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Twilio Phone Number / Sender ID</label>
            <input 
              type="text" 
              value={twilioPhoneNumber} 
              onChange={(e) => setTwilioPhoneNumber(e.target.value)}
              placeholder="e.g. +1855xxxxxxx"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Twilio Verification Service SID</label>
            <input 
              type="text" 
              value={twilioVerification} 
              onChange={(e) => setTwilioVerification(e.target.value)}
              placeholder="e.g. VAxxxxxxxxxxxxxxx"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]" 
            />
          </div>
        </div>
      </div>

      {/* WhatsApp Integration (Meta Platform API) */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <MessageSquare size={20} className="text-[#1D4ED8]" />
            <h2 className="text-lg font-semibold text-[#0F172A]">WhatsApp Meta API Integration</h2>
          </div>
          <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
            <input 
              type="checkbox" 
              checked={whatsappEnabled} 
              onChange={(e) => setWhatsappEnabled(e.target.checked)}
              className="sr-only peer" 
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:ring-2 peer-focus:ring-[#1D4ED8] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#1D4ED8]" />
            <span className="ml-2 text-xs font-semibold text-gray-600">{whatsappEnabled ? 'Enabled' : 'Disabled'}</span>
          </label>
        </div>
        <p className="text-gray-500 text-sm mb-5">Integrate with Facebook Developer Meta Portal for automated WhatsApp alerts.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone Number ID</label>
            <input 
              type="text" 
              value={whatsappPhoneNumberId} 
              onChange={(e) => setWhatsappPhoneNumberId(e.target.value)}
              placeholder="e.g. 1098485757xxxxx"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Meta Access Token</label>
            <input 
              type="password" 
              value={whatsappAccessToken} 
              onChange={(e) => setWhatsappAccessToken(e.target.value)}
              placeholder="EAAxxxxxxxxxxxxxxxxxxxxx"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Business Account ID</label>
            <input 
              type="text" 
              value={whatsappBusinessId} 
              onChange={(e) => setWhatsappBusinessId(e.target.value)}
              placeholder="Business Account ID"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]" 
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 border-t border-gray-100 pt-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Welcome Template Name</label>
            <input 
              type="text" 
              value={whatsappWelcomeTemplate} 
              onChange={(e) => setWhatsappWelcomeTemplate(e.target.value)}
              placeholder="welcome_guest_template"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Invoice Template Name</label>
            <input 
              type="text" 
              value={whatsappInvoiceTemplate} 
              onChange={(e) => setWhatsappInvoiceTemplate(e.target.value)}
              placeholder="send_invoice_template"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]" 
            />
          </div>
        </div>
      </div>

      {/* SMTP Email Server Configuration */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <div className="flex items-center gap-2 mb-1">
          <MailWarning size={20} className="text-[#1D4ED8]" />
          <h2 className="text-lg font-semibold text-[#0F172A]">SMTP Email Server Settings</h2>
        </div>
        <p className="text-gray-500 text-sm mb-5">Configure outgoing mail servers to send bookings and checkout reports via email.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">SMTP Host Address</label>
            <input 
              type="text" 
              value={smtpHost} 
              onChange={(e) => setSmtpHost(e.target.value)}
              placeholder="smtp.gmail.com"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">SMTP Port Number</label>
            <input 
              type="text" 
              value={smtpPort} 
              onChange={(e) => setSmtpPort(e.target.value)}
              placeholder="e.g. 465 or 587"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Sender Email Address</label>
            <input 
              type="email" 
              value={smtpFromEmail} 
              onChange={(e) => setSmtpFromEmail(e.target.value)}
              placeholder="no-reply@hotel.com"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]" 
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 border-t border-gray-100 pt-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">SMTP Username</label>
            <input 
              type="text" 
              value={smtpUser} 
              onChange={(e) => setSmtpUser(e.target.value)}
              placeholder="SMTP Account User"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">SMTP Password</label>
            <input 
              type="password" 
              value={smtpPass} 
              onChange={(e) => setSmtpPass(e.target.value)}
              placeholder="SMTP Account Password"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]" 
            />
          </div>
        </div>

        <div className="flex items-center gap-6 mt-4 border-t border-gray-100 pt-4">
          <label className="relative inline-flex items-center cursor-pointer">
            <input 
              type="checkbox" 
              checked={smtpSecure} 
              onChange={(e) => setSmtpSecure(e.target.checked)}
              className="sr-only peer" 
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:ring-2 peer-focus:ring-[#1D4ED8] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#1D4ED8]" />
            <span className="ml-2 text-xs font-semibold text-gray-600">Use Secure Connection (SSL/TLS)</span>
          </label>
        </div>
      </div>

      {/* Invoice Template Selection & Preview */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center gap-2 mb-1">
            <Receipt size={20} className="text-[#1D4ED8]" />
            <h2 className="text-lg font-semibold text-[#0F172A]">Invoice Template Configuration</h2>
          </div>
          <p className="text-gray-500 text-sm">Select a default template structure to use for reservations and payments billing.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
          {/* LEFT SIDE TEMPLATE LIST */}
          <div className="lg:col-span-4 p-6 bg-gray-50/50 border-r border-gray-100">
            <div className="space-y-3">
              {templatesList.map((t) => {
                const isSelected = selectedTemplate === t.id;
                return (
                  <div 
                    key={t.id}
                    onClick={() => setSelectedTemplate(t.id)}
                    className={`relative flex flex-col justify-between p-4 rounded-xl border-2 transition-all cursor-pointer hover:shadow-md ${
                      isSelected 
                        ? 'border-[#1D4ED8] bg-white shadow-sm' 
                        : 'border-transparent bg-white hover:border-gray-200'
                    }`}
                  >
                    {isSelected && (
                      <div className="absolute top-4 right-4 bg-[#1D4ED8] text-white p-1 rounded-full">
                        <Check size={12} className="stroke-[3]" />
                      </div>
                    )}
                    
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        {t.type === 'A4' ? (
                          <span className="px-2 py-0.5 text-xs font-semibold rounded bg-purple-100 text-purple-700">A4 Document</span>
                        ) : (
                          <span className="px-2 py-0.5 text-xs font-semibold rounded bg-amber-100 text-amber-700">Thermal Roll</span>
                        )}
                      </div>
                      <h3 className="text-sm font-bold text-gray-900 mb-1">{t.name}</h3>
                      <p className="text-xs text-gray-500 line-clamp-2">{t.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Invoice Terms & Conditions */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1.5">
                <FileText size={16} className="text-gray-400" />
                Invoice Terms & Conditions (HTML Allowed)
              </label>
              <textarea
                rows={4}
                value={termsAndCondition}
                onChange={(e) => setTermsAndCondition(e.target.value)}
                placeholder="e.g. <li>All rates are exclusive of taxes.</li><li>Checkout time is 12:00 PM.</li>"
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1D4ED8] font-mono text-sm"
              />
              <p className="text-xs text-gray-400 mt-1">These terms are printed at the bottom of the invoice page.</p>
            </div>

            {/* Registration Card Terms */}
            <div className="mt-4 pt-4 border-t border-gray-100">
              <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1.5">
                <FileText size={16} className="text-gray-400" />
                Registration Card Terms
              </label>
              <textarea
                rows={3}
                value={registrationTerms}
                onChange={(e) => setRegistrationTerms(e.target.value)}
                placeholder="Terms for the Guest Registration Card..."
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1D4ED8] text-sm"
              />
              <p className="text-xs text-gray-400 mt-1">Printed on the Registration Card PDF.</p>
            </div>

            {/* Reservation Form Terms */}
            <div className="mt-4 pt-4 border-t border-gray-100">
              <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1.5">
                <FileText size={16} className="text-gray-400" />
                Reservation Form Terms
              </label>
              <textarea
                rows={3}
                value={reservationTerms}
                onChange={(e) => setReservationTerms(e.target.value)}
                placeholder="Terms for the Reservation Form..."
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1D4ED8] text-sm"
              />
              <p className="text-xs text-gray-400 mt-1">Printed on the Reservation Form PDF.</p>
            </div>
          </div>

          {/* RIGHT SIDE PREVIEW */}
          <div className="lg:col-span-8 bg-[#f8f9fa] flex flex-col">
            <div className="p-4 border-b border-gray-200 bg-gray-100 flex justify-between items-center">
              <h3 className="text-sm font-semibold text-gray-700">Live Preview</h3>
            </div>
            <div className="flex-1 p-6 overflow-auto" style={{ maxHeight: '800px', display: 'flex', justifyContent: 'center' }}>
              <div style={{ transform: 'scale(0.8)', transformOrigin: 'top center', transition: 'all 0.3s ease' }}>
                {(() => {
                  const InvoiceTemplate = templates[selectedTemplate] || templates.a4_modern;
                  return (
                    <div className="shadow-lg bg-white">
                      <InvoiceTemplate
                        data={{
                          id: '12345',
                          refno: 'INV-00123',
                          updatedAt: new Date().toISOString(),
                          startDate: '2024-03-08',
                          endDate: '2024-03-10',
                          totalAmount: 5500,
                          advancePaid: 2000,
                          balanceAmount: 3500,
                          customer: {
                              name: 'Muhammad Ali',
                              phone: '0300-1234567',
                              email: 'ali@example.com',
                              cnic: '42101-1234567-1'
                          },
                          rooms: [{ roomNo: '201', RoomType: { name: 'Executive Deluxe' }, ReservationRoom: { pricePerDay: 5500, startDate: '2024-03-08', endDate: '2024-03-10' } }],
                          extras: [{
                              name: 'Breakfast Service',
                              price: 500,
                              ReservationExtra: {
                                  quantity: 2,
                                  totalPrice: 1000
                              }
                          }]
                        }}
                        settings={{
                          organization_name: organizationName || 'My Hotel',
                          termsandcondition: termsAndCondition
                        }}
                        location={{
                          name: organizationLocation || 'Branch',
                          address: organizationLocation || 'Hotel Address',
                          contactPhone: organizationPhone || '123-456-7890',
                        }}
                        logo={undefined}
                      />
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Thank You & Post-Checkout Messages */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <Mail size={20} className="text-[#1D4ED8]" />
            <h2 className="text-lg font-semibold text-[#0F172A]">Automated Thank You Messages</h2>
          </div>
          <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
            <input 
              type="checkbox" 
              checked={thankYouEnabled} 
              onChange={(e) => setThankYouEnabled(e.target.checked)}
              className="sr-only peer" 
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:ring-2 peer-focus:ring-[#1D4ED8] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#1D4ED8]" />
            <span className="ml-2 text-xs font-semibold text-gray-600">{thankYouEnabled ? 'Enabled' : 'Disabled'}</span>
          </label>
        </div>
        <p className="text-gray-500 text-sm mb-5">Automatically send a thank you message after checkout.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Message Channel</label>
            <select 
              value={thankYouChannel} 
              onChange={(e) => setThankYouChannel(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]"
            >
              <option value="email">Email</option>
              <option value="whatsapp">WhatsApp</option>
              <option value="sms">SMS</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Template Message</label>
            <textarea 
              rows={3} 
              value={thankYouTemplate} 
              onChange={(e) => setThankYouTemplate(e.target.value)}
              placeholder="e.g. Thank you for staying with us..."
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]" 
            />
          </div>
        </div>
      </div>

      {/* System Preferences */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <div className="flex items-center gap-2 mb-5">
          <Settings size={20} className="text-[#1D4ED8]" />
          <h2 className="text-lg font-semibold text-[#0F172A]">System Preferences</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Default Currency</label>
            <select value={currency} onChange={(e) => setCurrency(e.target.value)} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1D4ED8] bg-gray-50">
              <option value="PKR">PKR – Pakistani Rupee</option>
              <option value="USD">USD – US Dollar</option>
              <option value="EUR">EUR – Euro</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Fixed Tax Percentage (%)</label>
            <div className="flex items-center gap-3">
              <label className="relative inline-flex items-center cursor-pointer flex-shrink-0" title="Enable fixed tax">
                <input 
                  type="checkbox" 
                  checked={taxPercentageEnabled} 
                  onChange={(e) => setTaxPercentageEnabled(e.target.checked)}
                  className="sr-only peer" 
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:ring-2 peer-focus:ring-[#1D4ED8] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#1D4ED8]" />
              </label>
              <input
                type="number"
                min="0"
                max="100"
                disabled={!taxPercentageEnabled}
                value={taxPercentage || ''}
                onChange={(e) => setTaxPercentage(Number(e.target.value))}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1D4ED8] ${!taxPercentageEnabled ? 'bg-gray-100 border-gray-200 text-gray-400' : 'bg-white border-gray-300'}`}
                placeholder="e.g. 16"
              />
            </div>
          </div>
        </div>

        {/* Toggle Options */}
        <div className="mt-5 space-y-4 border-t border-gray-100 pt-5">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-sm font-medium text-gray-900">Allow Checkout with Outstanding Balance</div>
              <div className="text-xs text-gray-500 mt-0.5">Let front desk complete checkout even if invoice isn't fully paid</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer ml-4 flex-shrink-0">
              <input 
                type="checkbox" 
                checked={allowCheckout} 
                onChange={(e) => setAllowCheckout(e.target.checked)}
                className="sr-only peer" 
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:ring-2 peer-focus:ring-[#1D4ED8] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#1D4ED8]" />
            </label>
          </div>
          
          <div className="flex items-start justify-between">
            <div>
              <div className="text-sm font-medium text-gray-900">Enable Self-Service Portal</div>
              <div className="text-xs text-gray-500 mt-0.5">Allow guests to view invoices and request room services online</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer ml-4 flex-shrink-0">
              <input 
                type="checkbox" 
                checked={selfService} 
                onChange={(e) => setSelfService(e.target.checked)}
                className="sr-only peer" 
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:ring-2 peer-focus:ring-[#1D4ED8] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#1D4ED8]" />
            </label>
          </div>
          
          <div className="flex items-start justify-between">
            <div>
              <div className="text-sm font-medium text-gray-900">Apply Reservation Tax on POS Items</div>
              <div className="text-xs text-gray-500 mt-0.5">Apply the room's tax percentage to POS extra items automatically</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer ml-4 flex-shrink-0">
              <input 
                type="checkbox" 
                checked={applyReservationTaxOnPos} 
                onChange={(e) => setApplyReservationTaxOnPos(e.target.checked)}
                className="sr-only peer" 
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:ring-2 peer-focus:ring-[#1D4ED8] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#1D4ED8]" />
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
