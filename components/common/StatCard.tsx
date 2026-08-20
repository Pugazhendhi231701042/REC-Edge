import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: string;
  colorClassName?: string;
  onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  colorClassName = 'text-brand-600 bg-brand-50 border-purple-100',
  onClick,
}) => {
  return (
    <div
      onClick={onClick}
      className={`glass-card rounded-xl p-5 border shadow-sm transition-all duration-200 ${
        onClick ? 'cursor-pointer hover:shadow-md hover:border-purple-200' : ''
      }`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-desc uppercase tracking-wider mb-1">{title}</p>
          <h3 className="text-2xl font-bold text-slate-900">{value}</h3>
          {subtitle && <p className="text-xs text-desc mt-1">{subtitle}</p>}
          {trend && <span className="inline-block text-xs font-medium text-emerald-600 mt-2">{trend}</span>}
        </div>
        {icon && (
          <div className={`p-3 rounded-lg border ${colorClassName}`}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
};
