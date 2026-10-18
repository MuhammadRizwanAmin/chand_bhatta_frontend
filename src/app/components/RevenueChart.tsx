import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

export function RevenueChart({ data }: { data?: any[] }) {
  // Use provided data or fallback to empty array
  const chartData = data && data.length > 0 ? data : [];
  return (
    <div className="bg-white rounded-xl shadow-sm border border-[#E2E8F0] p-6">
      <div className="mb-6">
        <h3 className="text-[#0F172A] text-lg font-semibold">Revenue vs Expenses</h3>
        <p className="text-[#64748B] text-sm mt-1">Monthly financial overview for 2026</p>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart
          data={chartData}
          margin={{
            top: 10,
            right: 30,
            left: 0,
            bottom: 0,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
          <XAxis dataKey="month" stroke="#64748B" />
          <YAxis stroke="#64748B" />
          <Tooltip
            contentStyle={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #E2E8F0',
              borderRadius: '8px',
            }}
          />
          <Legend />
          <Area
            type="monotone"
            dataKey="revenue"
            stackId="1"
            stroke="#1D4ED8"
            fill="#1D4ED8"
            fillOpacity={0.6}
          />
          <Area
            type="monotone"
            dataKey="expenses"
            stackId="2"
            stroke="#EF4444"
            fill="#EF4444"
            fillOpacity={0.6}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
