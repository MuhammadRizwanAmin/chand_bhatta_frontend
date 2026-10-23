import { useState, useEffect, useRef } from 'react';
import { Calendar as CalendarIcon, ChevronDown, Check, Filter } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export type DateRange = {
  startDate: string;
  endDate: string;
};

export function getInitialTodayRange(): DateRange {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const todayStr = `${year}-${month}-${day}`;
  return { startDate: todayStr, endDate: todayStr };
}

export function getInitialMonthRange(): DateRange {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const firstDayStr = `${year}-${month}-01`;
  const lastDay = new Date(year, d.getMonth() + 1, 0).getDate();
  const lastDayStr = `${year}-${month}-${String(lastDay).padStart(2, '0')}`;
  return { startDate: firstDayStr, endDate: lastDayStr };
}

export function isWithinDateRange(dateStr: string, range?: DateRange): boolean {
  if (!range) return true;
  if (!range.startDate && !range.endDate) return true;
  if (!dateStr) return false;
  let target = String(dateStr).trim();
  if (/^\d{1,2}[-/]\d{1,2}[-/]\d{4}/.test(target)) {
    const parts = target.split(/[-/]/);
    target = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
  } else {
    target = target.slice(0, 10).replace(/\//g, '-');
  }
  if (range.startDate && target < range.startDate) return false;
  if (range.endDate && target > range.endDate) return false;
  return true;
}

interface DateRangeFilterProps {
  onChange: (range: DateRange) => void;
  defaultLabel?: string;
  darkMode?: boolean;
  value?: DateRange;
  variant?: 'buttons' | 'dropdown';
  defaultOption?: 'today' | 'this_week' | 'this_month' | 'custom';
}

export function DateRangeFilter({ onChange, darkMode = false, defaultLabel, variant, defaultOption = 'today' }: DateRangeFilterProps) {
  let isUrdu = false;
  try {
    const lang = useLanguage();
    isUrdu = lang.isUrdu;
  } catch {
    isUrdu = false;
  }

  const isDropdown = variant === 'dropdown' || Boolean(defaultLabel);

  const [isOpen, setIsOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState<'today' | 'this_week' | 'this_month' | 'custom'>(defaultOption);
  const [customRange, setCustomRange] = useState<DateRange>(() => {
    if (defaultOption === 'this_month') return getInitialMonthRange();
    return getInitialTodayRange();
  });
  const dropdownRef = useRef<HTMLDivElement>(null);
  const isMountedRef = useRef(false);

  const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Trigger initial default range on mount
  useEffect(() => {
    if (!isMountedRef.current) {
      isMountedRef.current = true;
      const initial = defaultOption === 'this_month' ? getInitialMonthRange() : getInitialTodayRange();
      onChange(initial);
    }
  }, [onChange, defaultOption]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectOption = (option: 'today' | 'this_week' | 'this_month' | 'custom') => {
    setSelectedOption(option);
    if (option === 'custom') return;

    let range = { startDate: '', endDate: '' };
    const today = new Date();

    if (option === 'today') {
      const todayStr = formatDate(today);
      range = { startDate: todayStr, endDate: todayStr };
    } else if (option === 'this_week') {
      const firstDay = new Date(today);
      const day = today.getDay();
      const diff = today.getDate() - day + (day === 0 ? -6 : 1);
      firstDay.setDate(diff);
      const lastDay = new Date(firstDay);
      lastDay.setDate(firstDay.getDate() + 6);
      range = { startDate: formatDate(firstDay), endDate: formatDate(lastDay) };
    } else if (option === 'this_month') {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      range = { startDate: formatDate(firstDay), endDate: formatDate(lastDay) };
    }

    setCustomRange(range);
    onChange(range);
    setIsOpen(false);
  };

  const handleCustomApply = () => {
    if (!customRange.startDate && !customRange.endDate) return;
    const finalRange = {
      startDate: customRange.startDate || customRange.endDate,
      endDate: customRange.endDate || customRange.startDate,
    };
    setCustomRange(finalRange);
    onChange(finalRange);
    setIsOpen(false);
  };

  // 1. Dropdown variant (for hotel pages or explicit dropdown request)
  if (isDropdown) {
    const displayLabel = () => {
      if (selectedOption === 'today') return isUrdu ? 'آج (Today)' : 'Today';
      if (selectedOption === 'this_week') return isUrdu ? 'اس ہفتے (This Week)' : 'This Week';
      if (selectedOption === 'this_month') return isUrdu ? 'اس مہینے (This Month)' : 'This Month';
      if (selectedOption === 'custom') {
        if (customRange.startDate && customRange.endDate) {
          return `${customRange.startDate} → ${customRange.endDate}`;
        }
        return isUrdu ? 'اپنی مرضی (Custom)' : 'Custom Range';
      }
      return defaultLabel || 'Today';
    };

    const filterOptions: Array<{ label: string; value: 'today' | 'this_week' | 'this_month' | 'custom' }> = [
      { label: isUrdu ? 'آج (Today)' : 'Today', value: 'today' },
      { label: isUrdu ? 'اس ہفتے (This Week)' : 'This Week', value: 'this_week' },
      { label: isUrdu ? 'اس مہینے (This Month)' : 'This Month', value: 'this_month' },
      { label: isUrdu ? 'اپنی مرضی (Custom Range)' : 'Custom Range', value: 'custom' },
    ];

    return (
      <div className="relative inline-block text-left" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`inline-flex justify-between items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-xl shadow-xs focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all cursor-pointer ${
            darkMode
              ? 'bg-slate-800 text-white border border-slate-700 hover:bg-slate-700'
              : 'bg-white text-blue-900 border border-blue-200 hover:border-blue-400 hover:bg-blue-50/50'
          }`}
        >
          <span className="flex items-center gap-2 min-w-0">
            <CalendarIcon className="w-3.5 h-3.5 shrink-0 text-[#1D4ED8]" />
            <span className="truncate">{displayLabel()}</span>
          </span>
          <ChevronDown
            className={`w-3.5 h-3.5 transition-transform duration-200 text-blue-600 ${isOpen ? 'rotate-180' : ''}`}
          />
        </button>

        {isOpen && (
          <div
            className={`absolute right-0 z-[9999] w-72 mt-2 origin-top-right rounded-2xl shadow-2xl ring-1 ring-black/10 overflow-hidden border ${
              darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            <div className="px-3.5 py-2 bg-slate-50 border-b border-slate-100 text-[11px] font-bold text-slate-500 flex justify-between items-center">
              <span>PERIOD FILTER (مدت فلٹر)</span>
              <span className="text-[10px] text-blue-600 font-semibold font-mono">4 Options</span>
            </div>

            <div className="p-1.5 space-y-1">
              {filterOptions.map(({ label, value }) => {
                const isSelected = selectedOption === value;
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => handleSelectOption(value)}
                    className={`w-full flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-xl text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-blue-50 text-blue-700 font-bold'
                        : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <span>{label}</span>
                    {isSelected && <Check size={14} className="text-blue-600" />}
                  </button>
                );
              })}
            </div>

            {selectedOption === 'custom' && (
              <div className="p-3.5 border-t border-slate-100 bg-slate-50/80">
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={customRange.startDate}
                      onChange={(e) => setCustomRange({ ...customRange, startDate: e.target.value })}
                      className="block w-full px-2 py-1.5 text-xs border border-slate-300 rounded-lg bg-white text-slate-900 font-mono focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                      End Date
                    </label>
                    <input
                      type="date"
                      value={customRange.endDate}
                      onChange={(e) => setCustomRange({ ...customRange, endDate: e.target.value })}
                      className="block w-full px-2 py-1.5 text-xs border border-slate-300 rounded-lg bg-white text-slate-900 font-mono focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleCustomApply}
                  disabled={!customRange.startDate && !customRange.endDate}
                  className="w-full py-1.5 text-xs font-bold text-white bg-[#1D4ED8] rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-xs cursor-pointer"
                >
                  Apply Range (فلٹر لگائیں)
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // 2. Uniform Button Group Variant (Strictly single horizontal row with inline custom inputs)
  return (
    <div className="flex items-center gap-1.5 flex-nowrap overflow-x-auto py-0.5 max-w-full">
      {/* 1. Today */}
      <button
        type="button"
        onClick={() => handleSelectOption('today')}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all shrink-0 cursor-pointer ${
          selectedOption === 'today'
            ? 'bg-[#1D4ED8] text-white border-[#1D4ED8] shadow-xs ring-2 ring-blue-200'
            : 'bg-white text-slate-700 hover:bg-slate-50 border-slate-300'
        }`}
      >
        <CalendarIcon size={13} />
        <span>{isUrdu ? 'آج (Today)' : 'Today'}</span>
      </button>

      {/* 2. This Week */}
      <button
        type="button"
        onClick={() => handleSelectOption('this_week')}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all shrink-0 cursor-pointer ${
          selectedOption === 'this_week'
            ? 'bg-[#1D4ED8] text-white border-[#1D4ED8] shadow-xs ring-2 ring-blue-200'
            : 'bg-white text-slate-700 hover:bg-slate-50 border-slate-300'
        }`}
      >
        <CalendarIcon size={13} />
        <span>{isUrdu ? 'اس ہفتے (This Week)' : 'This Week'}</span>
      </button>

      {/* 3. This Month */}
      <button
        type="button"
        onClick={() => handleSelectOption('this_month')}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all shrink-0 cursor-pointer ${
          selectedOption === 'this_month'
            ? 'bg-[#1D4ED8] text-white border-[#1D4ED8] shadow-xs ring-2 ring-blue-200'
            : 'bg-white text-slate-700 hover:bg-slate-50 border-slate-300'
        }`}
      >
        <CalendarIcon size={13} />
        <span>{isUrdu ? 'اس مہینے (This Month)' : 'This Month'}</span>
      </button>

      {/* 4. Custom Range Button */}
      <button
        type="button"
        onClick={() => setSelectedOption('custom')}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all shrink-0 cursor-pointer ${
          selectedOption === 'custom'
            ? 'bg-[#1D4ED8] text-white border-[#1D4ED8] shadow-xs ring-2 ring-blue-200'
            : 'bg-white text-slate-700 hover:bg-slate-50 border-slate-300'
        }`}
      >
        <Filter size={13} />
        <span>{isUrdu ? 'اپنی مرضی (Custom Range)' : 'Custom Range'}</span>
      </button>

      {/* Inline Start Date & End Date Inputs strictly in the SAME ROW */}
      {selectedOption === 'custom' && (
        <div className="flex items-center gap-1.5 flex-nowrap shrink-0 bg-slate-50 border border-slate-300 px-2.5 py-1 rounded-lg shadow-xs">
          <div className="flex items-center gap-1 shrink-0">
            <span className="text-[11px] font-bold text-slate-600 font-urdu">{isUrdu ? 'شروع:' : 'From:'}</span>
            <input
              type="date"
              value={customRange.startDate}
              onChange={(e) => setCustomRange(prev => ({ ...prev, startDate: e.target.value }))}
              className="text-xs font-mono px-2 py-0.5 bg-white border border-slate-300 rounded focus:ring-1 focus:ring-[#1D4ED8] outline-none shrink-0"
            />
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <span className="text-[11px] font-bold text-slate-600 font-urdu">{isUrdu ? 'تا:' : 'To:'}</span>
            <input
              type="date"
              value={customRange.endDate}
              onChange={(e) => setCustomRange(prev => ({ ...prev, endDate: e.target.value }))}
              className="text-xs font-mono px-2 py-0.5 bg-white border border-slate-300 rounded focus:ring-1 focus:ring-[#1D4ED8] outline-none shrink-0"
            />
          </div>
          <button
            type="button"
            onClick={handleCustomApply}
            className="px-3 py-1 bg-[#1D4ED8] hover:bg-blue-700 text-white rounded text-xs font-bold transition-colors shrink-0 cursor-pointer shadow-xs"
          >
            {isUrdu ? 'لاگو کریں' : 'Apply'}
          </button>
        </div>
      )}
    </div>
  );
}

