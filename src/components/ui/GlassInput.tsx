'use client';

import { InputHTMLAttributes, forwardRef } from 'react';

interface GlassInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const GlassInput = forwardRef<HTMLInputElement, GlassInputProps>(
  ({ label, error, className = '', ...props }, ref) => {
    return (
      <div className="space-y-1.5">
        {label && (
          <label className="block text-sm font-medium text-white/70">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={`
            w-full px-4 py-2.5 rounded-xl text-sm text-white
            bg-white/[0.06] backdrop-blur-xl
            border border-white/[0.1] focus:border-cyan-400/40
            outline-none transition-all duration-200
            placeholder:text-white/30
            focus:bg-white/[0.09] focus:ring-1 focus:ring-cyan-400/20
            ${error ? 'border-rose-400/40' : ''}
            ${className}
          `}
          {...props}
        />
        {error && <p className="text-xs text-rose-400">{error}</p>}
      </div>
    );
  }
);

GlassInput.displayName = 'GlassInput';
