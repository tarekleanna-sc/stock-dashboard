'use client';

import { motion } from 'framer-motion';
import { ButtonHTMLAttributes, ReactNode } from 'react';

interface GlassButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'default' | 'primary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

const variantStyles = {
  default:
    'bg-white/[0.08] border-white/[0.12] hover:bg-white/[0.14] text-white',
  primary:
    'bg-cyan-500/20 border-cyan-400/30 hover:bg-cyan-500/30 text-cyan-300',
  danger:
    'bg-rose-500/20 border-rose-400/30 hover:bg-rose-500/30 text-rose-300',
  ghost:
    'bg-transparent border-transparent hover:bg-white/[0.06] text-white/70 hover:text-white',
};

const sizeStyles = {
  sm: 'px-3 py-1.5 text-xs rounded-lg',
  md: 'px-4 py-2 text-sm rounded-xl',
  lg: 'px-6 py-3 text-base rounded-xl',
};

export function GlassButton({
  children,
  variant = 'default',
  size = 'md',
  className = '',
  ...props
}: GlassButtonProps) {
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`
        inline-flex items-center justify-center gap-2 font-medium
        backdrop-blur-xl border transition-colors duration-200
        cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${className}
      `}
      {...(props as React.ComponentProps<typeof motion.button>)}
    >
      {children}
    </motion.button>
  );
}
