import { useState, useEffect, useRef } from 'react';
import { Calendar as CalendarIcon, ChevronDown, X } from 'lucide-react';

export type DateRange = {
  startDate: string;
  endDate: string;
};

interface DateRangeFilterProps {
  onChange: (range: DateRange) => void;
  defaultLabel?: string;
  darkMode?: boolean;
}

export function DateRangeFilter({ onChange, defaultLabel = 'Filter by Date', darkMode = false }: DateRangeFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string>('');
  const [customRange, setCustomRange] = useState<DateRange>({ startDate: '', endDate: '' });
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleSelectOption = (option: string) => {
    setSelectedOption(option);
    if (option === 'custom') return; // Keep open for custom date entry

    let range = { startDate: '', endDate: '' };
    const today = new Date();

    if (option === 'today') {
      range = { startDate: formatDate(today), endDate: formatDate(today) };
    } else if (option === 'yesterday') {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      range = { startDate: formatDate(yesterday), endDate: formatDate(yesterday) };
    } else if (option === 'this_week') {
      const firstDay = new Date(today);
      firstDay.setDate(today.getDate() - today.getDay());
      const lastDay = new Date(firstDay);
      lastDay.setDate(firstDay.getDate() + 6);
      range = { startDate: formatDate(firstDay), endDate: formatDate(lastDay) };
    } else if (option === 'this_month') {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      range = { startDate: formatDate(firstDay), endDate: formatDate(lastDay) };
    } else if (option === 'all_time') {
      range = { startDate: '', endDate: '' };
    }

    setCustomRange(range);
    onChange(range);
    setIsOpen(false);
  };

  const handleCustomApply = () => {
    onChange(customRange);
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedOption('');
    setCustomRange({ startDate: '', endDate: '' });
    onChange({ startDate: '', endDate: '' });
  };

  const displayLabel = () => {
    if (selectedOption === 'today') return 'Today';
    if (selectedOption === 'yesterday') return 'Yesterday';
    if (selectedOption === 'this_week') return 'This Week';
    if (selectedOption === 'this_month') return 'This Month';
    if (selectedOption === 'custom' && (customRange.startDate || customRange.endDate)) {
      return `${customRange.startDate || 'Start'} → ${customRange.endDate || 'End'}`;
    }
    if (selectedOption === 'all_time') return 'All Time';
    return defaultLabel;
  };

  const hasActiveFilter = selectedOption !== '' && selectedOption !== 'all_time';

  const presetBtnClass = (opt: string) =>
    `block w-full px-4 py-2.5 text-sm text-left transition-colors ${
      selectedOption === opt
        ? darkMode
          ? 'bg-blue-500/20 text-blue-400 font-semibold'
          : 'bg-blue-50 text-blue-700 font-semibold'
        : darkMode
          ? 'text-slate-300 hover:bg-slate-700 hover:text-white'
          : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
    }`;

  return (
    <div className="relative inline-block text-left w-full" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`inline-flex justify-between items-center w-full px-3 py-2 text-sm font-medium rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
          darkMode
            ? 'bg-white/10 text-white border border-white/20 hover:bg-white/20 backdrop-blur-md'
            : hasActiveFilter
              ? 'bg-blue-50 text-blue-700 border border-blue-300 hover:bg-blue-100'
              : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
        }`}
      >
        <span className="flex items-center gap-2 min-w-0">
          <CalendarIcon className={`w-4 h-4 shrink-0 ${darkMode ? 'text-white/70' : hasActiveFilter ? 'text-blue-500' : 'text-gray-500'}`} />
          <span className="truncate">{displayLabel()}</span>
        </span>
        <span className="flex items-center gap-1 ml-2 shrink-0">
          {hasActiveFilter && (
            <span
              role="button"
              onClick={handleClear}
              className="p-0.5 rounded hover:bg-blue-200 transition-colors"
              title="Clear filter"
            >
              <X className="w-3 h-3" />
            </span>
          )}
          <ChevronDown
            className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''} ${
              darkMode ? 'text-white/70' : 'text-gray-500'
            }`}
          />
        </span>
      </button>

      {/* Dropdown Panel — floats absolutely, never pushes layout */}
      {isOpen && (
        <div
          className={`absolute right-0 z-[999] w-72 mt-2 origin-top-right rounded-xl shadow-xl ring-1 ring-black/10 overflow-hidden ${
            darkMode ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-gray-200'
          }`}
        >
          {/* Custom date inputs — shown at TOP when "Custom Date" is selected */}
          {selectedOption === 'custom' && (
            <div className={`p-4 border-b ${darkMode ? 'bg-slate-900/60 border-slate-700' : 'bg-blue-50 border-blue-100'}`}>
              <p className={`text-xs font-bold uppercase tracking-wider mb-3 ${darkMode ? 'text-slate-400' : 'text-blue-700'}`}>
                Custom Range
              </p>
              <div className="grid grid-cols-2 gap-2 mb-3">
                <div>
                  <label className={`block text-xs font-medium mb-1 ${darkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={customRange.startDate}
                    onChange={(e) => setCustomRange({ ...customRange, startDate: e.target.value })}
                    className={`block w-full px-2.5 py-1.5 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors ${
                      darkMode ? 'bg-slate-800 border-slate-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  />
                </div>
                <div>
                  <label className={`block text-xs font-medium mb-1 ${darkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                    End Date
                  </label>
                  <input
                    type="date"
                    value={customRange.endDate}
                    onChange={(e) => setCustomRange({ ...customRange, endDate: e.target.value })}
                    className={`block w-full px-2.5 py-1.5 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors ${
                      darkMode ? 'bg-slate-800 border-slate-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  />
                </div>
              </div>
              <button
                onClick={handleCustomApply}
                disabled={!customRange.startDate && !customRange.endDate}
                className="w-full px-3 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 transition-colors"
              >
                Apply Range
              </button>
            </div>
          )}

          {/* Preset Options */}
          <div className="py-1">
            {[
              { label: 'All Time',    value: 'all_time'   },
              { label: 'Today',       value: 'today'      },
              { label: 'Yesterday',   value: 'yesterday'  },
              { label: 'This Week',   value: 'this_week'  },
              { label: 'This Month',  value: 'this_month' },
              { label: 'Custom Date', value: 'custom'     },
            ].map(({ label, value }) => (
              <button
                key={value}
                onClick={() => handleSelectOption(value)}
                className={presetBtnClass(value)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
