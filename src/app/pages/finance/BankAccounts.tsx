import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { Plus, Building2, Edit, Trash2, TrendingUp, TrendingDown, DollarSign, ScrollText } from 'lucide-react';
import api from '../../services/api';
import { usePermissions } from '../../hooks/usePermissions';

interface BankAccount {
  id: string;
  bankName: string;
  accountTitle: string;
  accountNumber: string;
  iban: string;
  branch: string;
  currency: string;
  currentBalance: string | number;
  type: 'current' | 'savings' | 'petty-cash';
  status: 'active' | 'inactive';
}

const recentTransactions = [
  { id: 'TXN001', description: 'BK001 – Room Payment', account: 'HBL Operations', amount: '+₹10,030', date: '2026-05-16', type: 'credit' },
  { id: 'TXN002', description: 'EXP002 – Kitchen Supplies', account: 'Petty Cash', amount: '-₹34,800', date: '2026-05-14', type: 'debit' },
  { id: 'TXN003', description: 'BK002 – Advance Payment', account: 'HBL Operations', amount: '+₹7,500', date: '2026-05-15', type: 'credit' },
  { id: 'TXN004', description: 'EXP005 – Staff Salaries', account: 'UBL Payroll', amount: '-₹55,000', date: '2026-05-10', type: 'debit' },
];

const typeColors = {
  current: 'bg-blue-100 text-blue-700',
  savings: 'bg-green-100 text-green-700',
  'petty-cash': 'bg-orange-100 text-orange-700',
};

export function BankAccounts() {
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<Partial<BankAccount & { openingBalance: string }>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
    const { canEdit, canDelete, canEditOrDelete } = usePermissions();


  const fetchAccounts = async () => {
    try {
      const { data } = await api.get('/banks');
      setAccounts(data);
    } catch (error) {
      console.error('Error fetching banks:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const totalBalance = accounts.reduce((sum, acc) => sum + Number(acc.currentBalance || 0), 0);

  const handleSave = async () => {
    try {
      if (editingId) {
        await api.put(`/banks/${editingId}`, formData);
      } else {
        await api.post('/banks', formData);
      }
      setShowForm(false);
      setFormData({});
      setEditingId(null);
      fetchAccounts();
    } catch (error) {
      console.error('Error saving bank:', error);
    }
  };

  const handleEdit = (acc: BankAccount) => {
    setFormData({
      bankName: acc.bankName,
      accountTitle: acc.accountTitle,
      accountNumber: acc.accountNumber,
      iban: acc.iban,
      branch: acc.branch,
      currency: acc.currency,
      type: acc.type,
    });
    setEditingId(acc.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this account?')) return;
    try {
      await api.delete(`/banks/${id}`);
      fetchAccounts();
    } catch (error) {
      console.error('Error deleting bank:', error);
    }
  };

  if (loading) {
    return <div className="p-6 text-center text-gray-500">Loading bank accounts...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#0F172A]">Bank Accounts</h1>
          <p className="text-gray-600 mt-1">Manage hotel bank accounts and cash balances</p>
        </div>
        <button onClick={() => {
            setFormData({});
            setEditingId(null);
            setShowForm(!showForm);
          }}
          className="flex items-center gap-2 bg-[#1D4ED8] text-white px-5 py-2.5 rounded-lg hover:bg-[#1E40AF] transition-colors">
          <Plus size={18} />Add Account
        </button>
      </div>

      {/* Total Balance Banner */}
      <div className="bg-gradient-to-r from-[#0F172A] to-[#1D4ED8] rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white/70 text-sm">Total Balance (All Accounts)</p>
            <p className="text-4xl font-bold mt-1">PKR {totalBalance.toLocaleString()}</p>
          </div>
          <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm">
            <DollarSign size={32} className="text-[#D4A017]" />
          </div>
        </div>
        {/* <div className="flex gap-6 mt-4 text-sm">
          <div className="flex items-center gap-1.5 text-green-300"><TrendingUp size={16} />This Month: +₹1,28,530</div>
          <div className="flex items-center gap-1.5 text-red-300"><TrendingDown size={16} />Expenses: -₹1,19,600</div>
        </div> */}
      </div>

      {/* Add Form */}
      {showForm && (
        <div className="bg-white rounded-xl shadow-sm p-6 border border-[#1D4ED8]/30">
          <h2 className="text-lg font-semibold text-[#0F172A] mb-4">{editingId ? 'Edit Bank Account' : 'Add Bank Account'}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { label: 'Bank Name', placeholder: 'e.g. HBL – Habib Bank', key: 'bankName' },
              { label: 'Account Title', placeholder: 'Account holder name', key: 'accountTitle' },
              { label: 'Account Number', placeholder: '1234567890', key: 'accountNumber' },
              { label: 'IBAN', placeholder: 'PK36HBL...', key: 'iban' },
              { label: 'Branch', placeholder: 'Branch name & city', key: 'branch' },
              { label: 'Currency', placeholder: 'PKR', key: 'currency' },
              ...(!editingId ? [{ label: 'Opening Balance', placeholder: '0.00', key: 'openingBalance' }] : []),
            ].map((f) => (
              <div key={f.key}>
                <label className="block text-sm font-medium text-gray-700 mb-1">{f.label}</label>
                <input type="text" placeholder={f.placeholder}
                  value={(formData as any)[f.key] || ''}
                  onChange={(e) => setFormData({ ...formData, [f.key]: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]" />
              </div>
            ))}
            <div>
               <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
               <select 
                 value={formData.type || 'current'}
                 onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                 className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]"
               >
                 <option value="current">Current</option>
                 <option value="savings">Savings</option>
                 <option value="petty-cash">Petty Cash</option>
               </select>
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button onClick={handleSave} className="bg-[#1D4ED8] text-white px-6 py-2 rounded-lg hover:bg-[#1E40AF] transition-colors">Save</button>
            <button onClick={() => setShowForm(false)} className="border border-gray-300 px-6 py-2 rounded-lg hover:bg-gray-50 transition-colors">Cancel</button>
          </div>
        </div>
      )}

      {/* Account Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {accounts.map((acc) => (
          <div key={acc.id} className={`bg-white rounded-xl shadow-sm overflow-hidden border ${acc.status === 'inactive' ? 'opacity-60' : ''}`}>
            <div className="p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-[#1D4ED8]/10 rounded-xl flex items-center justify-center">
                    <Building2 size={22} className="text-[#1D4ED8]" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">{acc.bankName}</div>
                    <div className="text-sm text-gray-500">{acc.accountTitle}</div>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Link to={`/finance/banks/${acc.id}/logs`} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="View Transaction Logs">
                    <ScrollText size={15} />
                  </Link>
                   {canEdit && (
                  <button onClick={() => handleEdit(acc)} className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"><Edit size={15} /></button>
                   )}
                   {canDelete && (
                  <button onClick={() => handleDelete(acc.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={15} /></button>
                   )}
                  
                  </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="flex items-end justify-between">
                  <div>
                    <div className="text-xs text-gray-500">Current Balance</div>
                    <div className="text-2xl font-bold text-[#0F172A] mt-0.5">{acc.currency || 'PKR'} {Number(acc.currentBalance || 0).toLocaleString()}</div>
                  </div>
                  <div className="text-right">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${typeColors[acc.type] || typeColors.current}`}>{acc.type || 'current'}</span>
                    <div className="text-xs text-gray-500 mt-1">{acc.currency}</div>
                  </div>
                </div>
              </div>

              <div className="mt-3 text-xs text-gray-500 space-y-0.5">
                <div>A/C No: <span className="font-mono text-gray-700">{acc.accountNumber}</span></div>
                {acc.iban && <div>IBAN: <span className="font-mono text-gray-700">{acc.iban}</span></div>}
                {acc.branch && <div>Branch: {acc.branch}</div>}
              </div>
            </div>
            {acc.status === 'inactive' && (
              <div className="bg-gray-100 px-5 py-2 text-xs text-gray-500 font-medium">⚠ Account Inactive</div>
            )}
          </div>
        ))}
        {accounts.length === 0 && !loading && (
          <div className="col-span-full py-8 text-center text-gray-500 border-2 border-dashed rounded-xl">
            No bank accounts found. Click "Add Account" to create one.
          </div>
        )}
      </div>

      {/* Recent Transactions */}
      {/* <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-[#0F172A]">Recent Transactions (Static Demo)</h2>
        </div>
        <div className="divide-y divide-gray-100">
          {recentTransactions.map((txn) => (
            <div key={txn.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center ${txn.type === 'credit' ? 'bg-green-100' : 'bg-red-100'}`}>
                  {txn.type === 'credit' ? <TrendingUp size={16} className="text-green-600" /> : <TrendingDown size={16} className="text-red-600" />}
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-900">{txn.description}</div>
                  <div className="text-xs text-gray-500">{txn.account} · {txn.date}</div>
                </div>
              </div>
              <div className={`text-sm font-bold ${txn.type === 'credit' ? 'text-green-700' : 'text-red-700'}`}>{txn.amount}</div>
            </div>
          ))}
        </div>
      </div> */}
    </div>
  );
}
