import React, { useState, useEffect, useCallback } from 'react';
import { getEventsApi, registerForEventApi } from '../services/api';
import { BackendEvent, NavigationTab, AuthUser } from '../types';
import { DEMO_RECENT_EVENTS } from '../data/demoData';
import { Badge } from '../components/Badge';
import {
  SearchIcon,
  EventsIcon,
  ClockIcon,
  MapPinIcon,
  UsersIcon,
  CheckIcon,
  AlertIcon,
  RefreshIcon,
  QrCodeIcon,
} from '../components/Icons';

interface EventsViewProps {
  onNavigate: (tab: NavigationTab) => void;
  currentUser?: AuthUser | null;
  onRequireLogin?: () => void;
}

export const EventsView: React.FC<EventsViewProps> = ({
  onNavigate,
  currentUser,
  onRequireLogin,
}) => {
  const [events, setEvents] = useState<BackendEvent[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [registeringId, setRegisteringId] = useState<number | null>(null);
  const [registrationMsg, setRegistrationMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const categories = ['All', 'Workshop', 'Hackathon', 'Seminar', 'Symposium', 'Conference'];

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getEventsApi();
      if (res.events && res.events.length > 0) {
        setEvents(res.events);
      } else {
        // Fallback to formatted demo events if database is empty
        const mappedDemo: BackendEvent[] = DEMO_RECENT_EVENTS.map((e, idx) => ({
          id: idx + 1,
          title: e.title,
          category: e.category,
          date: e.date,
          time: e.time,
          venue: e.venue,
          organizer: e.organizer,
          speaker: e.speaker,
          speaker_role: e.speakerRole,
          capacity: e.capacity,
          registered_count: e.registeredCount,
          is_full: e.registeredCount >= e.capacity,
          status: e.status,
          description: e.description,
          tags: e.tags.join(','),
          is_registered: e.isRegistered,
        }));
        setEvents(mappedDemo);
      }
    } catch {
      // Fallback to formatted demo events if network fails
      const mappedDemo: BackendEvent[] = DEMO_RECENT_EVENTS.map((e, idx) => ({
        id: idx + 1,
        title: e.title,
        category: e.category,
        date: e.date,
        time: e.time,
        venue: e.venue,
        organizer: e.organizer,
        speaker: e.speaker,
        speaker_role: e.speakerRole,
        capacity: e.capacity,
        registered_count: e.registeredCount,
        is_full: e.registeredCount >= e.capacity,
        status: e.status,
        description: e.description,
        tags: e.tags.join(','),
        is_registered: e.isRegistered,
      }));
      setEvents(mappedDemo);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const handleRegister = async (event: BackendEvent) => {
    if (!currentUser) {
      if (onRequireLogin) onRequireLogin();
      return;
    }

    setRegisteringId(event.id);
    setRegistrationMsg(null);
    try {
      const res = await registerForEventApi(event.id);
      setRegistrationMsg({
        type: 'success',
        text: res.message || `Successfully registered! QR Pass: ${res.registration?.pass_token}`,
      });
      fetchEvents();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Registration failed.';
      setRegistrationMsg({ type: 'error', text: msg });
    } finally {
      setRegisteringId(null);
    }
  };

  const filteredEvents = events.filter((ev) => {
    const matchesCategory = selectedCategory === 'All' || ev.category.toLowerCase() === selectedCategory.toLowerCase();
    const matchesSearch =
      ev.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ev.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ev.venue.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ev.speaker.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Campus Events & Workshops
            </h1>
            <Badge variant="primary" size="sm">LIVE CATALOG</Badge>
          </div>
          <p className="text-xs sm:text-sm text-slate-400">
            Browse upcoming academic lectures, technical workshops, and hackathons with instant QR pass ticketing.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchEvents}
            className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-2"
          >
            <RefreshIcon className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Registration alert notification */}
      {registrationMsg && (
        <div
          className={`p-4 rounded-xl text-xs flex items-center justify-between gap-3 animate-fadeIn ${
            registrationMsg.type === 'success'
              ? 'bg-emerald-950/70 border border-emerald-800 text-emerald-300'
              : 'bg-rose-950/70 border border-rose-800 text-rose-300'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {registrationMsg.type === 'success' ? (
              <CheckIcon className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            ) : (
              <AlertIcon className="w-4 h-4 text-rose-400 flex-shrink-0" />
            )}
            <span>{registrationMsg.text}</span>
          </div>
          {registrationMsg.type === 'success' && (
            <button
              onClick={() => onNavigate('passes')}
              className="px-3 py-1 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white font-semibold flex items-center gap-1.5 whitespace-nowrap"
            >
              <QrCodeIcon className="w-3.5 h-3.5" />
              <span>View My QR Pass</span>
            </button>
          )}
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                selectedCategory.toLowerCase() === cat.toLowerCase()
                  ? 'bg-brand-600 text-white shadow-glow-sm'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search input */}
        <div className="relative w-full md:w-72">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search title, venue, speaker..."
            className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg pl-9 pr-4 py-2 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 placeholder:text-slate-500"
          />
        </div>
      </div>

      {/* Events Grid */}
      {loading ? (
        <div className="py-16 text-center text-slate-500 text-xs">
          Loading campus events...
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-12 text-center">
          <EventsIcon className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-300">No events found</h3>
          <p className="text-xs text-slate-500 mt-1">Try adjusting your category filter or search query</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredEvents.map((event) => {
            const isFull = event.registered_count >= event.capacity;
            const isRegistered = event.is_registered;

            return (
              <div
                key={event.id}
                className="bg-slate-900/80 border border-slate-800 hover:border-slate-700/80 rounded-2xl p-5 shadow-lg flex flex-col justify-between transition-all duration-200"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[10px] font-mono uppercase tracking-wider font-bold px-2 py-0.5 rounded bg-blue-950 text-cyan-400 border border-blue-800/40">
                      {event.category}
                    </span>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded font-semibold ${
                        event.status === 'Cancelled'
                          ? 'bg-rose-950 text-rose-400 border border-rose-800'
                          : isFull
                          ? 'bg-amber-950 text-amber-400 border border-amber-800'
                          : 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                      }`}
                    >
                      {event.status === 'Cancelled' ? 'Cancelled' : isFull ? 'Full' : 'Open'}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-white line-clamp-2 leading-snug">
                      {event.title}
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                      {event.description || 'Hands-on college session with verified attendance.'}
                    </p>
                  </div>

                  <div className="space-y-1.5 pt-2 border-t border-slate-800 text-xs text-slate-300">
                    <div className="flex items-center gap-2">
                      <ClockIcon className="w-3.5 h-3.5 text-brand-400 flex-shrink-0" />
                      <span className="truncate">{event.date} • {event.time}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPinIcon className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                      <span className="truncate">{event.venue}</span>
                    </div>
                    {event.speaker && (
                      <div className="flex items-center gap-2">
                        <UsersIcon className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                        <span className="truncate">{event.speaker}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-2">
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>Seats Occupied</span>
                    <span className="font-mono text-slate-300">
                      <strong className="text-white">{event.registered_count}</strong> / {event.capacity}
                    </span>
                  </div>

                  <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        isFull ? 'bg-amber-500' : 'bg-brand-500'
                      }`}
                      style={{
                        width: `${Math.min(100, Math.round((event.registered_count / event.capacity) * 100))}%`,
                      }}
                    />
                  </div>

                  <div className="pt-1 flex gap-2">
                    {isRegistered ? (
                      <button
                        onClick={() => onNavigate('passes')}
                        className="w-full py-2 px-3 rounded-xl bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-800 text-emerald-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <CheckIcon className="w-4 h-4 text-emerald-400" />
                        <span>Registered • View QR Pass</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => handleRegister(event)}
                        disabled={isFull || event.status === 'Cancelled' || registeringId === event.id}
                        className={`w-full py-2 px-3 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                          isFull || event.status === 'Cancelled'
                            ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                            : 'bg-brand-600 hover:bg-brand-500 text-white shadow-glow-sm'
                        }`}
                      >
                        {registeringId === event.id ? (
                          <span>Generating Pass...</span>
                        ) : isFull ? (
                          <span>Registration Full</span>
                        ) : event.status === 'Cancelled' ? (
                          <span>Event Cancelled</span>
                        ) : (
                          <>
                            <QrCodeIcon className="w-4 h-4" />
                            <span>Register &amp; Get Pass</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
