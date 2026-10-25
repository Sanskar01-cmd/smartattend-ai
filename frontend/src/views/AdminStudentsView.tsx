import React, { useState, useEffect, useCallback } from 'react';
import { getAdminOverviewApi } from '../services/api';
import { AdminOverviewResponse } from '../types';
import { Badge } from '../components/Badge';
import { UsersIcon, SearchIcon, RefreshIcon, AlertIcon } from '../components/Icons';

export const AdminStudentsView: React.FC = () => {
  const [data, setData] = useState<AdminOverviewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('All');

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getAdminOverviewApi();
      setData(res);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not fetch student registry.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  const students = data?.recent_students || [];

  const departments = ['All', ...Array.from(new Set(students.map((s) => s.department).filter(Boolean)))];

  const filteredStudents = students.filter((s) => {
    const matchesDept = selectedDept === 'All' || s.department === selectedDept;
    const matchesSearch =
      s.full_name.toLowerCase().includes(search.toLowerCase()) ||
      s.student_id.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase());
    return matchesDept && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Student Accounts Directory
            </h1>
            <Badge variant="outline" size="sm">LIVE MYSQL REGISTRY</Badge>
          </div>
          <p className="text-xs sm:text-sm text-slate-400">
            Institutional directory of enrolled students who have registered accounts in SmartAttend AI.
          </p>
        </div>

        <button
          onClick={fetchStudents}
          className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-2 self-start"
        >
          <RefreshIcon className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-950/70 border border-rose-800 text-xs text-rose-300 flex items-center gap-2">
          <AlertIcon className="w-4 h-4 text-rose-400 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
          {departments.map((dept) => (
            <button
              key={dept}
              onClick={() => setSelectedDept(dept)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                selectedDept === dept
                  ? 'bg-rose-700 text-white shadow-glow-sm'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white'
              }`}
            >
              {dept}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-72">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by student name, ID, or email..."
            className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg pl-9 pr-4 py-2 focus:outline-none focus:border-rose-500 placeholder:text-slate-500"
          />
        </div>
      </div>

      {/* Student Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UsersIcon className="w-4 h-4 text-rose-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Registered Students ({filteredStudents.length} Students)
            </h3>
          </div>
          <span className="text-[11px] font-mono text-cyan-400">Total Enrolled: {data?.stats.total_students || 0}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 text-slate-400 uppercase font-mono text-[11px] border-b border-slate-800">
              <tr>
                <th className="py-3 px-4 font-semibold">Student Name</th>
                <th className="py-3 px-4 font-semibold">Student ID</th>
                <th className="py-3 px-4 font-semibold">Email</th>
                <th className="py-3 px-4 font-semibold">Department</th>
                <th className="py-3 px-4 font-semibold">Course &amp; Year</th>
                <th className="py-3 px-4 font-semibold">Registered</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    Loading student directory...
                  </td>
                </tr>
              ) : filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    No student records matching your search criteria.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((st) => (
                  <tr key={st.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-4 font-semibold text-white">
                      {st.full_name}
                    </td>
                    <td className="py-3 px-4 font-mono text-cyan-400">
                      {st.student_id}
                    </td>
                    <td className="py-3 px-4 text-slate-300">
                      {st.email}
                    </td>
                    <td className="py-3 px-4 text-slate-300">
                      {st.department}
                    </td>
                    <td className="py-3 px-4 text-slate-400">
                      {st.course} • {st.academic_year}
                    </td>
                    <td className="py-3 px-4 text-slate-400">
                      {st.created_at ? new Date(st.created_at).toLocaleDateString() : 'N/A'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
