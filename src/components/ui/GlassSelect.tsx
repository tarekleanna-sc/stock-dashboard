'use client';

import { SelectHTMLAttributes, forwardRef } from 'react';

interface GlassSelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
}

export const GlassSelect = forwardRef<HTMLSelectElement, GlassSelectProps>(
  ({ label, error, options, className = '', ...props }, ref) => {
    return (
      <div className="space-y-1.5">
        {label && (
          <label className="block text-sm font-medium text-white/70">
            {label}
          </label>
        )}
        <select
          ref={ref}
          className={`
            w-full px-4 py-2.5 rounded-xl text-sm text-white
            bg-white/[0.06] backdrop-blur-xl
            border border-white/[0.1] focus:border-cyan-400/40
            outline-none transition-all duration-200
            focus:bg-white/[0.09] focus:ring-1 focus:ring-cyan-400/20
            ${error ? 'border-rose-400/40' : ''}
            ${className}
          `}
          {...props}
        >
          <option value="" className="bg-[#0a0e27] text-white">
            Select...
          </option>
          {options.map((opt) => (
            <option
              key={opt.value}
              value={opt.value}
              className="bg-[#0a0e27] text-white"
            >
              {opt.label}
            </option>
          ))}
        </select>
        {error && <p className="text-xs text-rose-400">{error}</p>}
      </div>
    );
  }
);

GlassSelect.displayName = 'GlassSelect';
