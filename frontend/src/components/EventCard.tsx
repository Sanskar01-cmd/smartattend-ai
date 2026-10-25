import React from 'react';
import { CollegeEvent } from '../types';
import { Badge } from './Badge';
import { ClockIcon, MapPinIcon, UsersIcon, ShieldCheckIcon } from './Icons';

interface EventCardProps {
  event: CollegeEvent;
  onViewDetails?: (event: CollegeEvent) => void;
  onViewPass?: (event: CollegeEvent) => void;
}

export const EventCard: React.FC<EventCardProps> = ({
  event,
  onViewDetails,
  onViewPass,
}) => {
  const getCategoryBadgeVariant = (cat: string) => {
    switch (cat) {
      case 'Workshop':
        return 'primary';
      case 'Hackathon':
        return 'warning';
      case 'Seminar':
        return 'info';
      default:
        return 'outline';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Upcoming':
        return <Badge variant="success" size="sm">Upcoming</Badge>;
      case 'Completed':
        return <Badge variant="outline" size="sm">Completed</Badge>;
      default:
        return <Badge variant="warning" size="sm">{status}</Badge>;
    }
  };

  return (
    <div className="group bg-slate-900/90 border border-slate-800 hover:border-brand-500/50 rounded-xl p-5 flex flex-col justify-between transition-all duration-200 hover:shadow-glow-sm">
      <div>
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <Badge variant={getCategoryBadgeVariant(event.category)} size="sm">
              {event.category}
            </Badge>
            {getStatusBadge(event.status)}
          </div>
          <Badge variant="demo" size="sm">DEMO</Badge>
        </div>

        <h3 className="text-base font-semibold text-white group-hover:text-brand-300 transition-colors line-clamp-2">
          {event.title}
        </h3>

        <p className="mt-2 text-xs text-slate-400 line-clamp-2 leading-relaxed">
          {event.description}
        </p>

        <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-2 text-xs text-slate-300">
          <div className="flex items-center gap-2">
            <ClockIcon className="w-3.5 h-3.5 text-brand-400 flex-shrink-0" />
            <span>{event.date} • {event.time}</span>
          </div>

          <div className="flex items-center gap-2">
            <MapPinIcon className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
            <span className="truncate">{event.venue}</span>
          </div>

          <div className="flex items-center gap-2">
            <UsersIcon className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
            <span>
              Speaker: <strong className="font-medium text-slate-200">{event.speaker}</strong>
            </span>
          </div>
        </div>

        {event.tags && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {event.tags.map((tag, idx) => (
              <span
                key={idx}
                className="px-2 py-0.5 text-[11px] font-mono bg-slate-800 text-slate-300 rounded border border-slate-700/60"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="mt-5 pt-3 border-t border-slate-800/80 flex items-center justify-between gap-3">
        <div className="text-[11px] text-slate-400">
          Registered: <span className="font-semibold text-slate-200">{event.registeredCount}</span> / {event.capacity}
        </div>

        <div className="flex items-center gap-2">
          {event.isRegistered ? (
            <button
              onClick={() => onViewPass && onViewPass(event)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-brand-600 hover:bg-brand-500 text-white shadow transition-colors"
            >
              <ShieldCheckIcon className="w-3.5 h-3.5" />
              View Pass
            </button>
          ) : (
            <button
              onClick={() => onViewDetails && onViewDetails(event)}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
            >
              Details
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
