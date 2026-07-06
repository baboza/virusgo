"use client";

import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';

interface CardProps extends HTMLMotionProps<"div"> {
  glass?: boolean;
  hoverEffect?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  glass = true,
  hoverEffect = true,
  className = '',
  ...props
}) => {
  const baseStyles = "rounded-3xl border overflow-hidden transition-all duration-300";
  
  const glassStyles = glass 
    ? "bg-slate-900/70 backdrop-blur-xl border-slate-700/50 shadow-xl shadow-black/30" 
    : "bg-slate-900 border-slate-700 shadow-md";

  const hoverStyles = hoverEffect 
    ? "hover:shadow-2xl hover:-translate-y-1" 
    : "";

  return (
    <motion.div
      className={`${baseStyles} ${glassStyles} ${hoverStyles} ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      {...props}
    >
      {children}
    </motion.div>
  );
};
