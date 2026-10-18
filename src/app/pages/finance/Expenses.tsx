import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Plus, Search, Download, Trash2, Receipt, TrendingDown, Edit, ListTree, Eye } from 'lucide-react';
import { DataTable, Column } from '../../components/DataTable';
import api from '../../services/api';
import { getCurrency } from '../../utils/currency';
import { usePermissions } from '../../hooks/usePermissions';

export function Expenses() {
  const navigate = useNavigate();
  const [expenses, setExpenses] = useState<any[]>([]);
  const [expenseTypes, setExpenseTypes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
    const { canEdit, canDelete, canEditOrDelete } = usePermissions();

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  
  // Pagination State
  const [page, setPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const limit = 10;

  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 500);
    return () => clearTimeout(handler);
  }, [search]);

  const handleCategoryChange = (cat: string) => {
    setCategoryFilter(cat);
    setPage(1);
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(debouncedSearch && { search: debouncedSearch }),
        ...(categoryFilter !== 'All' && { category: categoryFilter }),
      });

      const [expRes, typesRes] = await Promise.all([
        api.get(`/expenses?${queryParams.toString()}`),
        api.get('/expense-types')
      ]);
      
      setExpenses(expRes.data?.data || []);
      setTotalItems(expRes.data?.total || 0);
      setExpenseTypes(typesRes.data || []);
    } catch (err) {
      console.error('Error fetching expenses data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [page, debouncedSearch, categoryFilter]);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this expense?')) return;
    try {
      await api.delete(`/expenses/${id}`);
      fetchData();
    } catch (error) {
      console.error('Error deleting expense:', error);
    }
  };

  // Prepare filter categories
  const categoriesList = ['All', ...expenseTypes.map(t => t.name), 'Others'];

  const filteredData = expenses; // Backend now handles filtering

  const columns: Column<any>[] = [
    {
      header: 'ID',
      accessorKey: 'id',
      sortable: true,
      cell: (exp) => <span className="text-sm font-medium text-[#1D4ED8]">EXP{exp.id}</span>
    },
    {
      header: 'Title',
      accessorKey: 'title',
      sortable: true,
      cell: (exp) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
            <Receipt size={15} className="text-red-600" />
          </div>
          <span className="text-sm font-medium text-gray-900">{exp.title}</span>
        </div>
      )
    },
    {
      header: 'Category',
      accessorKey: 'expense_type',
      sortable: true,
      cell: (exp) => {
        const catName = exp.category?.name || exp.expense_type || 'Others';
        return <span className={`px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700`}>{catName}</span>
      }
    },
    {
      header: 'Amount',
      accessorKey: 'price',
      sortable: true,
      cell: (exp) => <span className="text-sm font-bold text-red-700">{getCurrency()} {Number(exp.price).toLocaleString()}</span>
    },
    {
      header: 'Created By',
      accessorKey: 'user',
      sortable: true,
      cell: (exp) => <span className="text-sm text-gray-700">{exp.user?.fullName || 'N/A'}</span>
    },
    {
      header: 'Date',
      accessorKey: 'date_for',
      sortable: true,
      cell: (exp) => <span className="text-sm text-gray-600">{exp.date_for}</span>
    },
    {
      header: 'Method',
      accessorKey: 'payment_type',
      sortable: true,
      cell: (exp) => <span className="text-sm capitalize text-gray-700">{exp.payment_type?.replace('_', ' ')}</span>
    },
    {
      header: 'Actions',
      cell: (exp) => (
        <div className="flex gap-1">
          <button onClick={() => navigate(`/finance/expenses/view/${exp.id}`)} className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Eye size={15} /></button>
           {canEdit && (
          <button onClick={() => navigate(`/finance/expenses/edit/${exp.id}`)} className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"><Edit size={15} /></button>
           )}
           {canDelete && (
          <button onClick={() => handleDelete(exp.id)} className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={15} /></button>
           )}
          </div>
      )
    }
  ];

  const totalThisMonth = expenses.reduce((sum, e) => sum + Number(e.price || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#0F172A]">Expenses</h1>
          <p className="text-gray-600 mt-1">Track and manage hotel operational expenses</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => navigate('/finance/expense-categories')} className="flex items-center gap-2 border border-gray-300 bg-white text-gray-700 px-4 py-2.5 rounded-lg hover:bg-gray-50 transition-colors">
            <ListTree size={18} />Categories
          </button>
          <button onClick={() => navigate('/finance/expenses/add')} className="flex items-center gap-2 bg-[#1D4ED8] text-white px-5 py-2.5 rounded-lg hover:bg-[#1E40AF] transition-colors">
            <Plus size={18} />Add Expense
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl p-5 text-white">
          <div className="flex items-center gap-2 mb-2"><TrendingDown size={18} /><span className="text-sm text-white/80">Page Expenses Sum</span></div>
          <div className="text-2xl font-bold">{getCurrency()} {totalThisMonth.toLocaleString()}</div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border-l-4 border-blue-500">
          <div className="text-gray-500 text-sm">Total Records</div>
          <div className="text-2xl font-bold text-blue-600 mt-1">{totalItems}</div>
        </div>
      </div>

      {/* Category Filter Pills & Search */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex flex-wrap gap-3 mb-4">
          {categoriesList.map((cat) => (
            <button key={cat} onClick={() => handleCategoryChange(cat)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${categoryFilter === cat ? 'bg-[#1D4ED8] text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
              {cat}
            </button>
          ))}
        </div>
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input type="text" placeholder="Search expense..." value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]" />
        </div>
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={filteredData}
        searchQuery=""
        searchKeys={[]}
        pageSize={limit}
        serverSide={true}
        totalItems={totalItems}
        page={page}
        onPageChange={(p) => setPage(p)}
        loading={loading}
      />
    </div>
  );
}
