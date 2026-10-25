import React, { useState, useEffect, useCallback } from 'react';
import { getEventsApi, createEventApi, updateEventApi, cancelEventApi, deleteEventApi } from '../services/api';
import { BackendEvent } from '../types';
import { Badge } from '../components/Badge';
import {
  EventsIcon,
  RefreshIcon,
  AlertIcon,
  CheckIcon,
  XIcon,
} from '../components/Icons';

export const AdminEventsView: React.FC = () => {
  const [events, setEvents] = useState<BackendEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Modal State for Create / Edit
  const [showModal, setShowModal] = useState(false);
  const [editingEventId, setEditingEventId] = useState<number | null>(null);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Workshop');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [venue, setVenue] = useState('');
  const [organizer, setOrganizer] = useState('Dept. of Computer Science');
  const [speaker, setSpeaker] = useState('');
  const [speakerRole, setSpeakerRole] = useState('');
  const [capacity, setCapacity] = useState(100);
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('Technical,Hands-on');
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getEventsApi();
      setEvents(res.events || []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not fetch events.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const handleOpenCreateModal = () => {
    setEditingEventId(null);
    setTitle('');
    setCategory('Workshop');
    setDate('Oct 30, 2026');
    setTime('10:00 AM - 04:00 PM');
    setVenue('APJ Hall, Academic Block');
    setOrganizer('Department of Computer Science');
    setSpeaker('');
    setSpeakerRole('');
    setCapacity(100);
    setDescription('');
    setTags('Technical,Campus');
    setFormError(null);
    setShowModal(true);
  };

  const handleOpenEditModal = (ev: BackendEvent) => {
    setEditingEventId(ev.id);
    setTitle(ev.title);
    setCategory(ev.category);
    setDate(ev.date);
    setTime(ev.time);
    setVenue(ev.venue);
    setOrganizer(ev.organizer);
    setSpeaker(ev.speaker || '');
    setSpeakerRole(ev.speaker_role || '');
    setCapacity(ev.capacity);
    setDescription(ev.description || '');
    setTags(ev.tags || '');
    setFormError(null);
    setShowModal(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!title.trim() || !date.trim() || !time.trim() || !venue.trim()) {
      setFormError('Title, date, time, and venue are required.');
      return;
    }

    setFormSubmitting(true);
    try {
      if (editingEventId) {
        await updateEventApi(editingEventId, {
          title: title.trim(),
          category,
          date: date.trim(),
          time: time.trim(),
          venue: venue.trim(),
          organizer: organizer.trim(),
          speaker: speaker.trim(),
          speaker_role: speakerRole.trim(),
          capacity: Number(capacity),
          description: description.trim(),
          tags: tags.trim(),
        });
        setActionSuccess(`Event "${title}" updated successfully.`);
      } else {
        await createEventApi({
          title: title.trim(),
          category,
          date: date.trim(),
          time: time.trim(),
          venue: venue.trim(),
          organizer: organizer.trim(),
          speaker: speaker.trim(),
          speaker_role: speakerRole.trim(),
          capacity: Number(capacity),
          description: description.trim(),
          tags: tags.trim(),
        });
        setActionSuccess(`New event "${title}" scheduled successfully.`);
      }
      setShowModal(false);
      fetchEvents();
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Event operation failed.';
      setFormError(msg);
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleCancelEvent = async (id: number, evTitle: string) => {
    if (!window.confirm(`Are you sure you want to change status to Cancelled for "${evTitle}"?`)) {
      return;
    }
    try {
      await cancelEventApi(id);
      setActionSuccess(`Event "${evTitle}" marked as Cancelled.`);
      fetchEvents();
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not cancel event.';
      setError(msg);
    }
  };

  const handleDeleteEvent = async (id: number, evTitle: string) => {
    if (!window.confirm(`Warning: Are you sure you want to permanently delete "${evTitle}"? This cannot be undone.`)) {
      return;
    }
    try {
      await deleteEventApi(id);
      setActionSuccess(`Event "${evTitle}" deleted permanently.`);
      fetchEvents();
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not delete event.';
      setError(msg);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Manage Events & Workshops
            </h1>
            <Badge variant="outline" size="sm">ADMIN ACTIONABLE</Badge>
          </div>
          <p className="text-xs sm:text-sm text-slate-400">
            Create college sessions, configure seating capacity, modify hall venues, and cancel scheduled events.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleOpenCreateModal}
            className="px-4 py-2 rounded-xl bg-rose-700 hover:bg-rose-600 text-white text-xs font-semibold shadow-glow-sm transition-all flex items-center gap-1.5"
          >
            <EventsIcon className="w-4 h-4" />
            <span>Schedule New Event</span>
          </button>
          <button
            onClick={fetchEvents}
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5"
          >
            <RefreshIcon className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {actionSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-950/70 border border-emerald-800 text-xs text-emerald-300 flex items-center gap-2 animate-fadeIn">
          <CheckIcon className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-950/70 border border-rose-800 text-xs text-rose-300 flex items-center gap-2 animate-fadeIn">
          <AlertIcon className="w-4 h-4 text-rose-400 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Events Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
            Active Campus Schedule ({events.length} Events)
          </h3>
          <span className="text-[11px] font-mono text-cyan-400">Database Engine: MySQL</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 text-slate-400 uppercase font-mono text-[11px] border-b border-slate-800">
              <tr>
                <th className="py-3 px-4 font-semibold">Title & Category</th>
                <th className="py-3 px-4 font-semibold">Date & Time</th>
                <th className="py-3 px-4 font-semibold">Venue / Hall</th>
                <th className="py-3 px-4 font-semibold">Capacity</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    Loading campus events...
                  </td>
                </tr>
              ) : events.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    No events scheduled. Click &ldquo;Schedule New Event&rdquo; to create your first session.
                  </td>
                </tr>
              ) : (
                events.map((ev) => (
                  <tr key={ev.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-4">
                      <span className="font-semibold text-white block">{ev.title}</span>
                      <span className="text-[11px] font-mono text-cyan-400">{ev.category}</span>
                    </td>
                    <td className="py-3 px-4 text-slate-300 whitespace-nowrap">
                      <div>{ev.date}</div>
                      <div className="text-[11px] text-slate-400">{ev.time}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-300 whitespace-nowrap">
                      {ev.venue}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="font-mono text-white font-bold">{ev.registered_count}</span>
                      <span className="text-slate-500"> / {ev.capacity}</span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          ev.status === 'Cancelled'
                            ? 'bg-rose-950 text-rose-400 border border-rose-800'
                            : 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                        }`}
                      >
                        {ev.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right space-x-2 whitespace-nowrap">
                      <button
                        onClick={() => handleOpenEditModal(ev)}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-semibold"
                      >
                        Edit
                      </button>
                      {ev.status !== 'Cancelled' && (
                        <button
                          onClick={() => handleCancelEvent(ev.id, ev.title)}
                          className="px-2.5 py-1 rounded-lg bg-amber-950/60 hover:bg-amber-900 border border-amber-800/50 text-amber-300 text-[11px] font-semibold"
                        >
                          Cancel
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteEvent(ev.id, ev.title)}
                        className="px-2.5 py-1 rounded-lg bg-rose-950/60 hover:bg-rose-900 border border-rose-800/50 text-rose-300 text-[11px] font-semibold"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal for Create or Edit Event */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <EventsIcon className="w-5 h-5 text-rose-400" />
                <span>{editingEventId ? 'Edit Event Details' : 'Schedule New Campus Event'}</span>
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <XIcon className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mt-4 p-3 rounded-xl bg-rose-950/70 border border-rose-800 text-xs text-rose-300 flex items-center gap-2">
                <AlertIcon className="w-4 h-4 text-rose-400 flex-shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="mt-4 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-slate-300 font-semibold">Event Title *</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    placeholder="e.g. Deep Learning & Computer Vision Workshop"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-rose-500"
                  >
                    <option value="Workshop">Workshop</option>
                    <option value="Hackathon">Hackathon</option>
                    <option value="Seminar">Seminar</option>
                    <option value="Symposium">Symposium</option>
                    <option value="Conference">Conference</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold">Capacity (Seats) *</label>
                  <input
                    type="number"
                    min={1}
                    value={capacity}
                    onChange={(e) => setCapacity(Number(e.target.value))}
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold">Date *</label>
                  <input
                    type="text"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                    placeholder="e.g. Oct 30, 2026"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold">Time *</label>
                  <input
                    type="text"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    required
                    placeholder="e.g. 10:00 AM - 04:30 PM"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div className="sm:col-span-2 space-y-1">
                  <label className="text-slate-300 font-semibold">Venue / Hall *</label>
                  <input
                    type="text"
                    value={venue}
                    onChange={(e) => setVenue(e.target.value)}
                    required
                    placeholder="e.g. APJ Abdul Kalam Auditorium, Main Block"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold">Speaker Name</label>
                  <input
                    type="text"
                    value={speaker}
                    onChange={(e) => setSpeaker(e.target.value)}
                    placeholder="e.g. Dr. Aris Thorne"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold">Speaker Role / Affiliation</label>
                  <input
                    type="text"
                    value={speakerRole}
                    onChange={(e) => setSpeakerRole(e.target.value)}
                    placeholder="e.g. Principal AI Scientist"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div className="sm:col-span-2 space-y-1">
                  <label className="text-slate-300 font-semibold">Description</label>
                  <textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Overview of lecture topics and prerequisites..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-4 py-2 rounded-xl bg-rose-700 hover:bg-rose-600 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-1.5"
                >
                  {formSubmitting ? <span>Saving...</span> : <span>{editingEventId ? 'Update Event' : 'Create Event'}</span>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
