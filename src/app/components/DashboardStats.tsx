import { TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  bgColor: string;
}

export function StatCard({ title, value, icon, trend, bgColor }: StatCardProps) {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-[#E2E8F0] hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-[#64748B] text-sm font-medium mb-1">{title}</p>
          <h3 className="text-[#0F172A] text-3xl font-bold mb-2">{value}</h3>
          {/* {trend && (
            <div className="flex items-center gap-1">
              {trend.isPositive ? (
                <TrendingUp size={16} className="text-[#10B981]" />
              ) : (
                <TrendingDown size={16} className="text-[#EF4444]" />
              )}
              <span
                className={`text-sm font-medium ${
                  trend.isPositive ? 'text-[#10B981]' : 'text-[#EF4444]'
                }`}
              >
                {trend.value}% from last month
              </span>
            </div>
          )} */}
        </div>
        <div
          className={`w-14 h-14 rounded-xl flex items-center justify-center ${bgColor}`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}
