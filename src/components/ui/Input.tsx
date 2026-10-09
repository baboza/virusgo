"use client";

import React, { InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, leftIcon, className = '', ...props }, ref) => {
    return (
      <div className="flex flex-col space-y-1 w-full">
        {label && (
          <label className="text-sm font-medium text-slate-300">
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            className={`w-full bg-slate-800/70 backdrop-blur-sm border text-slate-200 placeholder-slate-500 ${
              error ? 'border-red-500 focus:ring-red-500' : 'border-slate-700 focus:ring-primary focus:border-primary'
            } rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-offset-1 focus:ring-offset-slate-950 transition-all duration-300 ${
              leftIcon ? 'pl-10' : ''
            } ${className}`}
            {...props}
          />
        </div>
        {error && (
          <span className="text-xs text-red-400 mt-1">{error}</span>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
