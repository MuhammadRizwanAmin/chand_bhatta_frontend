import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import { ArrowLeft } from 'lucide-react';
import api from '../../services/api';

export function AddEditExpense() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = Boolean(id);

  const [users, setUsers] = useState<any[]>([]);
  const [banks, setBanks] = useState<any[]>([]);
  const [expenseTypes, setExpenseTypes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState<any>({
    title: '',
    price: '',
    date_for: new Date().toISOString().split('T')[0],
    payment_type: 'cash',
    expenseTypeId: '',
    expense_type: '',
    if_other_expense_type: '',
    expense_made_by: '',
    bankId: '',
    description: '',
  });
  const [attachment, setAttachment] = useState<File | null>(null);

  useEffect(() => {
    const fetchDependencies = async () => {
      try {
        const [usersRes, banksRes, typesRes] = await Promise.all([
          api.get('/users'),
          api.get('/banks'),
          api.get('/expense-types')
        ]);
        setUsers(usersRes.data?.users || []);
        setBanks(banksRes.data || []);
        setExpenseTypes(typesRes.data || []);
        
        if (isEditing) {
          const res = await api.get(`/expenses/${id}`);
          const exp = res.data.data;
          if (exp) {
            setFormData({
              title: exp.title || '',
              price: exp.price || '',
              date_for: exp.date_for || '',
              payment_type: exp.payment_type || 'cash',
              expenseTypeId: exp.expenseTypeId || '',
              expense_type: exp.expense_type || '',
              if_other_expense_type: exp.if_other_expense_type || '',
              expense_made_by: exp.expense_made_by || '',
              bankId: exp.bankId || '',
              description: exp.description || '',
            });
          }
        }
      } catch (err) {
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDependencies();
  }, [id, isEditing]);

  const handleInputChange = (e: any) => {
    const { name, value } = e.target;
    setFormData((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e: any) => {
    e.preventDefault();
    try {
      const payload = new FormData();
      payload.append('title', formData.title);
      payload.append('price', formData.price);
      payload.append('date_for', formData.date_for);
      payload.append('payment_type', formData.payment_type);
      payload.append('description', formData.description);
      payload.append('expense_made_by', formData.expense_made_by);
      
      if (formData.expenseTypeId === 'Others') {
        payload.append('expense_type', 'Others');
        payload.append('if_other_expense_type', formData.if_other_expense_type);
      } else if (formData.expenseTypeId) {
        const selectedType = expenseTypes.find(t => t.id.toString() === formData.expenseTypeId.toString());
        if (selectedType) {
          payload.append('expense_type', selectedType.name);
          payload.append('expenseTypeId', selectedType.id.toString());
        }
      }

      if (['bank', 'bank_transfer', 'card'].includes(formData.payment_type) && formData.bankId) {
        payload.append('bankId', formData.bankId);
      }

      if (attachment) {
        payload.append('attachments[]', attachment);
      }

      if (isEditing) {
        await api.put(`/expenses/${id}`, payload, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        await api.post('/expenses', payload, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }
      
      navigate('/finance/expenses');
    } catch (error) {
      console.error('Error saving expense:', error);
      alert('Failed to save expense');
    }
  };

  if (loading) {
    return <div className="p-6 text-center text-gray-500">Loading form...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
          <ArrowLeft size={18} className="text-gray-600" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-[#0F172A]">{isEditing ? 'Edit Expense' : 'Add New Expense'}</h1>
          <p className="text-gray-600 mt-1">Fill in the details below to {isEditing ? 'update' : 'create'} an expense</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <form onSubmit={handleSave}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
              <input type="text" name="title" required value={formData.title} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]" placeholder="e.g. Office Supplies" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Price *</label>
              <input type="number" name="price" required value={formData.price} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]" placeholder="0.00" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
              <input type="date" name="date_for" required value={formData.date_for} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Expense Type *</label>
              <select name="expenseTypeId" required value={formData.expenseTypeId} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]">
                <option value="">Select Type</option>
                {expenseTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                <option value="Others">Others</option>
              </select>
            </div>

            {formData.expenseTypeId === 'Others' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Specify Other Type</label>
                <input type="text" name="if_other_expense_type" required value={formData.if_other_expense_type} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]" />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Payment Mode *</label>
              <select name="payment_type" required value={formData.payment_type} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]">
                <option value="cash">Cash</option>
                <option value="card">Card</option>
                <option value="bank">Bank</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="credit">Credit</option>
                <option value="other">Other</option>
              </select>
            </div>

            {['bank', 'bank_transfer', 'card'].includes(formData.payment_type) && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Select Bank *</label>
                <select name="bankId" required value={formData.bankId} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]">
                  <option value="">Select Bank</option>
                  {banks.map(b => <option key={b.id} value={b.id}>{b.bankName} - {b.accountNumber}</option>)}
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Made By (User) *</label>
              <select name="expense_made_by" required value={formData.expense_made_by} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]">
                <option value="">Select User</option>
                {users.map(u => <option key={u.id} value={u.id}>{u.fullName}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Attachment</label>
              <input type="file" onChange={(e) => setAttachment(e.target.files ? e.target.files[0] : null)} className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none text-sm bg-gray-50 file:mr-4 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-[#1D4ED8] file:text-white hover:file:bg-[#1E40AF]" />
            </div>

            <div className="md:col-span-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea name="description" value={formData.description} onChange={handleInputChange} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]"></textarea>
            </div>
          </div>
          
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button type="button" onClick={() => navigate('/finance/expenses')} className="px-6 py-2.5 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors">Cancel</button>
            <button type="submit" className="bg-[#1D4ED8] text-white px-8 py-2.5 rounded-lg font-medium hover:bg-[#1E40AF] shadow-sm transition-all">Save Expense</button>
          </div>
        </form>
      </div>
    </div>
  );
}
