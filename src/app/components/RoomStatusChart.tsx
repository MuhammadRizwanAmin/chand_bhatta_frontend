import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

export function RoomStatusChart({ data }: { data?: any[] }) {
  const chartData = data && data.length > 0 ? data : [];
  return (
    <div className="bg-white rounded-xl shadow-sm border border-[#E2E8F0] p-6">
      <h3 className="text-[#0F172A] text-lg font-semibold mb-4">Room Status Overview</h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
      <div className="mt-6 grid grid-cols-2 gap-4">
        {chartData.map((item) => (
          <div key={item.name} className="flex items-center gap-3">
            <div
              className="w-4 h-4 rounded"
              style={{ backgroundColor: item.color }}
            />
            <div>
              <p className="text-[#64748B] text-xs">{item.name}</p>
              <p className="text-[#0F172A] font-semibold">{item.value} rooms</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
