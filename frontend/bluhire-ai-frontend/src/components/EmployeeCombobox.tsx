import React, { useState, useEffect, useRef } from 'react';
import { Search, ChevronDown, User, Check } from 'lucide-react';

export interface Employee {
  _id: string;
  firstName: string;
  lastName: string;
  employeeCode: string;
  email?: string;
}

interface EmployeeComboboxProps {
  employees: Employee[];
  selectedId: string;
  onChange: (id: string) => void;
  placeholder?: string;
  className?: string;
}

export function EmployeeCombobox({
  employees,
  selectedId,
  onChange,
  placeholder = 'Select employee...',
  className = '',
}: EmployeeComboboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedEmployee = employees.find((emp) => emp._id === selectedId);

  const filtered = employees.filter((emp) => {
    const fullName = `${emp.firstName} ${emp.lastName}`.toLowerCase();
    const code = emp.employeeCode.toLowerCase();
    const term = search.toLowerCase();
    return fullName.includes(term) || code.includes(term);
  });

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full px-4 h-10 text-xs text-white bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/35 transition-all text-left shadow-sm"
      >
        {selectedEmployee ? (
          <div className="flex items-center gap-2.5 truncate">
            <div className="w-5 h-5 rounded-lg bg-indigo-500/10 text-indigo-400 font-bold flex items-center justify-center text-[9px] border border-indigo-500/20 shrink-0">
              {selectedEmployee.firstName.charAt(0)}
              {selectedEmployee.lastName.charAt(0)}
            </div>
            <span className="font-semibold text-white/95">
              {selectedEmployee.firstName} {selectedEmployee.lastName}
            </span>
            <span className="text-[10px] text-white/40 font-mono">
              ({selectedEmployee.employeeCode})
            </span>
          </div>
        ) : (
          <span className="text-white/40">{placeholder}</span>
        )}
        <ChevronDown className="w-4 h-4 text-white/40 shrink-0" />
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-[#090d16] border border-white/10 rounded-2xl shadow-2xl p-2 space-y-2 backdrop-blur-3xl animate-in fade-in slide-in-from-top-1 duration-150">
          <div className="relative flex items-center">
            <Search className="absolute left-3 w-3.5 h-3.5 text-white/30" />
            <input
              type="text"
              placeholder="Search by name or code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 h-9 bg-white/[0.03] border border-white/5 focus:border-indigo-500/50 focus:ring-indigo-500/10 text-xs text-white rounded-xl focus:outline-none"
            />
          </div>

          <div className="max-h-52 overflow-y-auto space-y-0.5 custom-scrollbar">
            {filtered.length === 0 ? (
              <div className="text-center py-4 text-xs text-white/40 italic">
                No employees found
              </div>
            ) : (
              filtered.map((emp) => {
                const isSelected = emp._id === selectedId;
                return (
                  <button
                    key={emp._id}
                    type="button"
                    onClick={() => {
                      onChange(emp._id);
                      setIsOpen(false);
                      setSearch('');
                    }}
                    className={`flex items-center justify-between w-full px-3 py-2 text-xs rounded-xl transition-all text-left ${
                      isSelected
                        ? 'bg-indigo-500/10 text-white border border-indigo-500/20'
                        : 'text-white/70 hover:bg-white/[0.04] hover:text-white border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-6 h-6 rounded-lg bg-indigo-500/10 text-indigo-400 font-bold flex items-center justify-center text-[10px] border border-indigo-500/20 shrink-0">
                        {emp.firstName.charAt(0)}
                        {emp.lastName.charAt(0)}
                      </div>
                      <div className="truncate">
                        <p className="font-semibold">{emp.firstName} {emp.lastName}</p>
                        <p className="text-[10px] text-white/40 mt-0.5 font-mono">{emp.employeeCode}</p>
                      </div>
                    </div>
                    {isSelected && <Check className="w-3.5 h-3.5 text-indigo-400 shrink-0 ml-2" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
