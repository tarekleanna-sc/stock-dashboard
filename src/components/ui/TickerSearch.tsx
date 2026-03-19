'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';

interface SearchResult {
  symbol: string;
  name: string;
  exchange: string;
}

interface TickerSearchProps {
  value: string;
  onChange: (ticker: string) => void;
  onSelect?: (result: SearchResult) => void;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  className?: string;
  autoFocus?: boolean;
}

export function TickerSearch({
  value,
  onChange,
  onSelect,
  placeholder = 'Search ticker or company...',
  error,
  disabled = false,
  className = '',
  autoFocus = false,
}: TickerSearchProps) {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, width: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const updateDropdownPosition = useCallback(() => {
    if (inputRef.current) {
      const rect = inputRef.current.getBoundingClientRect();
      setDropdownPos({
        top: rect.bottom + 4,
        left: rect.left,
        width: rect.width,
      });
    }
  }, []);

  const fetchResults = useCallback(async (query: string) => {
    if (query.trim().length === 0) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`/api/stock/search?q=${encodeURIComponent(query)}&limit=8`);
      if (res.ok) {
        const data: SearchResult[] = await res.json();
        setResults(data);
        setIsOpen(data.length > 0);
        setHighlightedIndex(-1);
      }
    } catch {
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.toUpperCase();
    onChange(val);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchResults(val);
    }, 250);
  };

  const handleSelect = (result: SearchResult) => {
    onChange(result.symbol);
    onSelect?.(result);
    setIsOpen(false);
    setResults([]);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || results.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev < results.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : results.length - 1));
    } else if (e.key === 'Enter' && highlightedIndex >= 0) {
      e.preventDefault();
      handleSelect(results[highlightedIndex]);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  // Update dropdown position when open
  useEffect(() => {
    if (isOpen) {
      updateDropdownPosition();
      window.addEventListener('scroll', updateDropdownPosition, true);
      window.addEventListener('resize', updateDropdownPosition);
      return () => {
        window.removeEventListener('scroll', updateDropdownPosition, true);
        window.removeEventListener('resize', updateDropdownPosition);
      };
    }
  }, [isOpen, updateDropdownPosition]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        containerRef.current &&
        !containerRef.current.contains(target) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const dropdown =
    isOpen && results.length > 0 && mounted
      ? createPortal(
          <div
            ref={dropdownRef}
            style={{
              position: 'fixed',
              top: dropdownPos.top,
              left: dropdownPos.left,
              width: dropdownPos.width,
              zIndex: 9999,
            }}
            className="py-1 rounded-xl bg-gray-900/95 backdrop-blur-2xl border border-white/[0.12] shadow-2xl shadow-black/40 overflow-hidden max-h-[280px] overflow-y-auto"
          >
            {results.map((result, index) => (
              <button
                key={result.symbol}
                type="button"
                onClick={() => handleSelect(result)}
                onMouseEnter={() => setHighlightedIndex(index)}
                className={`
                  w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors
                  ${highlightedIndex === index ? 'bg-white/[0.08]' : 'hover:bg-white/[0.05]'}
                `}
              >
                <span className="text-sm font-semibold text-cyan-400 min-w-[60px]">
                  {result.symbol}
                </span>
                <span className="text-sm text-white/70 truncate flex-1">
                  {result.name}
                </span>
                <span className="text-[10px] text-white/30 uppercase tracking-wider">
                  {result.exchange}
                </span>
              </button>
            ))}
          </div>,
          document.body
        )
      : null;

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div className="space-y-1.5">
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              if (results.length > 0) {
                updateDropdownPosition();
                setIsOpen(true);
              }
            }}
            placeholder={placeholder}
            disabled={disabled}
            autoFocus={autoFocus}
            className={`
              w-full px-4 py-2.5 rounded-xl text-sm text-white
              bg-white/[0.06] backdrop-blur-xl
              border border-white/[0.1] focus:border-cyan-400/40
              outline-none transition-all duration-200
              placeholder:text-white/30
              focus:bg-white/[0.09] focus:ring-1 focus:ring-cyan-400/20
              ${error ? 'border-rose-400/40' : ''}
              ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          />
          {isLoading && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <div className="w-4 h-4 border-2 border-white/20 border-t-cyan-400/60 rounded-full animate-spin" />
            </div>
          )}
        </div>
        {error && <p className="text-xs text-rose-400">{error}</p>}
      </div>
      {dropdown}
    </div>
  );
}
