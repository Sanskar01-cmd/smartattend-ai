import React from 'react';
import { StatItem } from '../types';
import { Badge } from './Badge';
import { EventsIcon, QrCodeIcon, AttendanceIcon, BotIcon, UsersIcon } from './Icons';

interface StatCardProps {
  stat: StatItem;
}

export const StatCard: React.FC<StatCardProps> = ({ stat }) => {
  const getIcon = (name: StatItem['iconName']) => {
    switch (name) {
      case 'calendar':
        return <EventsIcon className="w-5 h-5 text-blue-400" />;
      case 'qr':
        return <QrCodeIcon className="w-5 h-5 text-cyan-400" />;
      case 'check':
        return <AttendanceIcon className="w-5 h-5 text-emerald-400" />;
      case 'bot':
        return <BotIcon className="w-5 h-5 text-indigo-400" />;
      default:
        return <UsersIcon className="w-5 h-5 text-blue-400" />;
    }
  };

  return (
    <div className="relative bg-slate-900/80 border border-slate-800/80 hover:border-slate-700/80 rounded-xl p-5 shadow-lg transition-all duration-200 hover:-translate-y-0.5">
      <div className="flex items-start justify-between">
        <div className="p-2.5 rounded-lg bg-slate-800/80 border border-slate-700/50">
          {getIcon(stat.iconName)}
        </div>
        <Badge variant="demo" size="sm">
          DEMO
        </Badge>
      </div>

      <div className="mt-4">
        <span className="text-xs uppercase tracking-wider font-semibold text-slate-400">
          {stat.title}
        </span>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="text-2xl sm:text-3xl font-bold text-white tracking-tight font-sans">
            {stat.value}
          </span>
          <span className="text-xs text-brand-400 font-medium">
            {stat.trendValue}
          </span>
        </div>
        <p className="mt-1 text-xs text-slate-400 truncate">
          {stat.subtext}
        </p>
      </div>
    </div>
  );
};
