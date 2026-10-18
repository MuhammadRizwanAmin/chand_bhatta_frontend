import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { 
  User, Phone, Mail, DollarSign, Calendar, FileText, 
  Wallet as WalletIcon, Edit, ArrowLeft, Loader2, Download, BadgeCheck
} from 'lucide-react';
import api from '../../services/api';
import { toast } from 'sonner';

interface AgentWallet {
  id: number;
  amount: number;
  status: 'paid' | 'unpaid';
  createdAt: string;
}

interface Agent {
  id: number;
  fullName: string;
  cnic?: string;
  phone: string;
  email?: string;
  commission_type: 'fixed' | 'percentage';
  commission_value: number;
  payout_date: string;
  profile_image?: string;
  letter?: string;
  AgentWallets?: AgentWallet[];
}

export default function ViewAgent() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [agent, setAgent] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview'|'commission'|'documents'|'wallet'>('overview');

  const fetchAgent = async () => {
    try {
      const response = await api.get(`/agent/${id}`);
      setAgent(response.data?.agent || response.data);
    } catch (error) {
      toast.error("Failed to load agent details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchAgent();
  }, [id]);

  const handleStatusChange = async (walletId: number, newStatus: string) => {
    try {
      await api.put(`/agent/wallet/${walletId}/pay`, { status: newStatus });
      toast.success("Status updated successfully");
      fetchAgent();
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 size={32} className="animate-spin text-[#1D4ED8]" />
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <h2 className="text-2xl font-bold text-gray-800">Agent not found</h2>
        <button onClick={() => navigate('/agents')} className="mt-4 text-[#1D4ED8] hover:underline">
          Back to Agents
        </button>
      </div>
    );
  }

  const walletBalance = agent.AgentWallets?.reduce((acc, w) => {
    if (w.status === "unpaid") {
      return acc + Number(w.amount);
    }
    return acc;
  }, 0) || 0;

  const tabs = [
    { id: 'overview', label: 'Overview', icon: <User size={16} /> },
    { id: 'commission', label: 'Commission & Payout', icon: <DollarSign size={16} /> },
    { id: 'documents', label: 'Documents', icon: <FileText size={16} /> },
    { id: 'wallet', label: 'Wallet', icon: <WalletIcon size={16} /> },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/agents')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-[#0F172A]">{agent.fullName}</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs font-semibold uppercase tracking-wider">
                Agent
              </span>
              <span className="text-sm text-gray-500">ID: {agent.id}</span>
            </div>
          </div>
        </div>
        {/* <button
          onClick={() => navigate(`/agents/edit/${id}`)}
          className="flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors font-medium shadow-sm"
        >
          <Edit size={16} /> Edit Agent
        </button> */}
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 flex flex-col items-center justify-center">
          <div className="text-gray-500 text-sm font-medium mb-1">Commission</div>
          <div className="text-3xl font-bold text-[#0F172A]">
            {agent.commission_value}
            <span className="text-xl ml-1 text-gray-400">
              {agent.commission_type === 'percentage' ? '%' : ' PKR'}
            </span>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 flex flex-col items-center justify-center">
          <div className="text-gray-500 text-sm font-medium mb-1">Wallet Balance (Unpaid)</div>
          <div className="text-3xl font-bold text-amber-600">
            <span className="text-xl mr-1 text-amber-500/70">PKR</span>
            {walletBalance.toLocaleString()}
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 flex flex-col items-center justify-center">
          <div className="text-gray-500 text-sm font-medium mb-1">Total Transactions</div>
          <div className="text-3xl font-bold text-[#0F172A]">
            {agent.AgentWallets?.length || 0}
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar */}
        <div className="w-full lg:w-1/4">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <div className="flex flex-col items-center mb-6 pb-6 border-b border-gray-100">
              <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-gray-50 bg-gradient-to-br from-[#1D4ED8] to-[#D4A017] flex items-center justify-center mb-3 shadow-sm">
                {agent.profile_image ? (
                  <img src={agent.profile_image} alt={agent.fullName} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-white font-bold text-3xl">{agent.fullName.slice(0, 2).toUpperCase()}</span>
                )}
              </div>
              <h2 className="text-lg font-bold text-[#0F172A] text-center">{agent.fullName}</h2>
              {agent.email && <div className="text-sm text-gray-500 mt-1">{agent.email}</div>}
              <div className="flex items-center gap-1.5 text-sm text-gray-600 mt-2 bg-gray-50 px-3 py-1.5 rounded-full">
                <Phone size={14} className="text-gray-400" />
                {agent.phone}
              </div>
            </div>

            <nav className="flex flex-col space-y-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'bg-blue-50 text-[#1D4ED8]'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <span className={activeTab === tab.id ? 'text-[#1D4ED8]' : 'text-gray-400'}>
                    {tab.icon}
                  </span>
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Content Area */}
        <div className="w-full lg:w-3/4">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            
            {activeTab === 'overview' && (
              <div>
                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                  <h3 className="text-lg font-semibold text-[#0F172A]">Personal Information</h3>
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Full Name</div>
                    <div className="font-medium text-gray-900">{agent.fullName}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500 mb-1">CNIC</div>
                    <div className="font-medium text-gray-900">{agent.cnic || 'N/A'}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Email</div>
                    <div className="font-medium text-gray-900">{agent.email || 'N/A'}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Phone</div>
                    <div className="font-medium text-gray-900">{agent.phone}</div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'commission' && (
              <div>
                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                  <h3 className="text-lg font-semibold text-[#0F172A]">Commission & Payout Details</h3>
                </div>
                <div className="p-6 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                      <div className="flex items-center gap-2 text-gray-500 mb-2">
                        <BadgeCheck size={16} />
                        <span className="text-sm font-medium">Commission Structure</span>
                      </div>
                      <div className="flex items-end gap-2">
                        <span className="text-2xl font-bold text-[#1D4ED8]">
                          {agent.commission_value}
                          {agent.commission_type === 'percentage' ? '%' : ' PKR'}
                        </span>
                        <span className="text-sm text-gray-500 mb-1 capitalize bg-white px-2 py-0.5 rounded border border-gray-200">
                          {agent.commission_type}
                        </span>
                      </div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                      <div className="flex items-center gap-2 text-gray-500 mb-2">
                        <Calendar size={16} />
                        <span className="text-sm font-medium">Payout Schedule</span>
                      </div>
                      <div className="text-lg font-bold text-gray-900">
                        Day {agent.payout_date} of each month
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'documents' && (
              <div>
                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                  <h3 className="text-lg font-semibold text-[#0F172A]">Documents</h3>
                </div>
                <div className="p-6">
                  {agent.letter ? (
                    <div className="flex items-center justify-between p-4 border border-gray-200 rounded-xl bg-gray-50 max-w-md hover:border-blue-300 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 text-[#1D4ED8] rounded-lg">
                          <FileText size={20} />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">Offer Letter</div>
                          <div className="text-xs text-gray-500">Document available</div>
                        </div>
                      </div>
                      <a
                        href={agent.letter}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 shadow-sm rounded-lg text-sm font-medium text-[#1D4ED8] hover:bg-gray-50 transition-colors"
                      >
                        <Download size={14} /> Download
                      </a>
                    </div>
                  ) : (
                    <div className="text-center py-10">
                      <FileText size={40} className="mx-auto text-gray-300 mb-3" />
                      <p className="text-gray-500 font-medium">No document uploaded</p>
                      <p className="text-gray-400 text-sm mt-1">This agent does not have an offer letter on file.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'wallet' && (
              <div className="flex flex-col h-full">
                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-[#0F172A]">Agent Wallet Transactions</h3>
                </div>
                <div className="p-0 flex-1 overflow-x-auto">
                  {agent.AgentWallets && agent.AgentWallets.length > 0 ? (
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-white border-b border-gray-100">
                          <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">#</th>
                          <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                          <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
                          <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {agent.AgentWallets.map((w, i) => (
                          <tr key={w.id || i} className="hover:bg-gray-50/50 transition-colors">
                            <td className="px-6 py-4 text-sm text-gray-500">{i + 1}</td>
                            <td className="px-6 py-4 text-sm text-gray-900">
                              {new Date(w.createdAt).toLocaleDateString("en-GB", {
                                day: "2-digit", month: "short", year: "numeric",
                              })}
                            </td>
                            <td className="px-6 py-4 text-sm font-medium text-gray-900">
                              ₨ {Number(w.amount).toLocaleString()}
                            </td>
                            <td className="px-6 py-4 text-right">
                              <select
                                className={`text-xs font-semibold rounded-full px-3 py-1 outline-none cursor-pointer border ${
                                  w.status === 'paid' 
                                    ? 'bg-green-50 text-green-700 border-green-200' 
                                    : 'bg-amber-50 text-amber-700 border-amber-200'
                                }`}
                                value={w.status}
                                onChange={(e) => handleStatusChange(w.id, e.target.value)}
                              >
                                <option value="paid">Paid</option>
                                <option value="unpaid">Unpaid</option>
                              </select>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="text-center py-12">
                      <WalletIcon size={40} className="mx-auto text-gray-300 mb-3" />
                      <p className="text-gray-500 font-medium">No wallet transactions found</p>
                    </div>
                  )}
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
