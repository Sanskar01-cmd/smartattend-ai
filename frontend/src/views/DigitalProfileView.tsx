import React, { useState, useEffect } from 'react';
import { ApiStudentProfile, AuthUser } from '../types';
import { updateProfileApi } from '../services/api';
import { Badge } from '../components/Badge';
import {
  ProfileIcon,
  ShieldCheckIcon,
  SparklesIcon,
  AlertIcon,
  CheckIcon,
} from '../components/Icons';

interface DigitalProfileViewProps {
  currentUser: AuthUser | null;
  profile: ApiStudentProfile | null;
  onProfileUpdated: (freshProfile: ApiStudentProfile) => void;
  onRequireLogin: () => void;
}

export const DigitalProfileView: React.FC<DigitalProfileViewProps> = ({
  currentUser,
  profile,
  onProfileUpdated,
  onRequireLogin,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Editable form fields
  const [fullName, setFullName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [department, setDepartment] = useState('');
  const [course, setCourse] = useState('');
  const [academicYear, setAcademicYear] = useState('');
  const [photoBase64, setPhotoBase64] = useState('');

  // Sync state whenever profile changes
  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setStudentId(profile.student_id || '');
      setPhoneNumber(profile.phone_number || '');
      setDepartment(profile.department || '');
      setCourse(profile.course || '');
      setAcademicYear(profile.academic_year || '');
      setPhotoBase64(profile.photo_base64 || '');
    }
  }, [profile]);

  // Reset edits when cancel is clicked
  const handleCancel = () => {
    if (profile) {
      setFullName(profile.full_name || '');
      setStudentId(profile.student_id || '');
      setPhoneNumber(profile.phone_number || '');
      setDepartment(profile.department || '');
      setCourse(profile.course || '');
      setAcademicYear(profile.academic_year || '');
      setPhotoBase64(profile.photo_base64 || '');
    }
    setErrorMessage(null);
    setIsEditing(false);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setErrorMessage('Image size exceeds 2MB limit. Please choose a smaller photo.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setPhotoBase64(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!fullName.trim() || !studentId.trim() || !department.trim()) {
      setErrorMessage('Full name, Student ID, and Department are required.');
      return;
    }

    setLoading(true);
    try {
      const response = await updateProfileApi({
        full_name: fullName.trim(),
        student_id: studentId.trim(),
        phone_number: phoneNumber.trim(),
        department: department.trim(),
        course: course.trim(),
        academic_year: academicYear.trim(),
        photo_base64: photoBase64,
      });

      setSuccessMessage(response.message || 'Profile updated successfully in MySQL!');
      onProfileUpdated(response.profile);
      setIsEditing(false);
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update profile.';
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  // If user is not authenticated yet
  if (!currentUser) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 text-cyan-400 mx-auto flex items-center justify-center">
          <ProfileIcon className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-white">Institutional Authentication Required</h2>
        <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
          Sign in or register a verified student account to manage your official college digital identity and attendance credentials.
        </p>
        <button
          onClick={onRequireLogin}
          className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs transition-all shadow-glow-sm"
        >
          Sign In / Register Student
        </button>
      </div>
    );
  }

  const initials = fullName
    ? fullName
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'ST';

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Institutional Digital Student Profile
            </h1>
            <Badge variant="success" size="sm">
              <ShieldCheckIcon className="w-3.5 h-3.5" />
              <span>LIVE AUTHENTICATED</span>
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-slate-400">
            Official college digital identity card linked with SmartAttend attendance verification.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-brand-600 hover:bg-brand-500 text-white shadow-glow-sm transition-all flex items-center gap-1.5"
            >
              <span>Edit Profile</span>
            </button>
          ) : (
            <span className="text-xs text-amber-400 font-medium">
              Editing Digital Profile Mode
            </span>
          )}
        </div>
      </div>

      {/* Notifications */}
      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-rose-950/70 border border-rose-800 text-xs text-rose-300 flex items-start gap-2 animate-fadeIn">
          <AlertIcon className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1 leading-relaxed">{errorMessage}</div>
        </div>
      )}

      {successMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-950/70 border border-emerald-800 text-xs text-emerald-300 flex items-center gap-2 animate-fadeIn">
          <CheckIcon className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Profile Card View / Edit Form */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-navy-950 to-blue-950 border border-slate-700/80 p-6 sm:p-8 shadow-2xl">
        {/* Holographic Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-800 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-brand-600 to-cyan-500 p-0.5 shadow-glow-sm flex items-center justify-center">
              <div className="w-full h-full bg-navy-950 rounded-[10px] flex items-center justify-center font-bold text-lg text-cyan-400">
                {initials}
              </div>
            </div>
            <div>
              <h3 className="text-base font-bold text-white">SmartAttend College Identity</h3>
              <p className="text-xs text-slate-400">Digital Student Credential & Verification</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="primary" size="md">
              <SparklesIcon className="w-3.5 h-3.5 text-cyan-400" />
              <span>{currentUser.role === 'admin' ? 'Administrator' : 'Verified Student'}</span>
            </Badge>
          </div>
        </div>

        {isEditing ? (
          /* Editable Form Mode */
          <form onSubmit={handleSave} className="mt-6 space-y-4 text-xs">
            <div className="p-3.5 rounded-xl bg-blue-950/40 border border-blue-900/50 text-[11px] text-blue-300">
              <strong>Relational Safety:</strong> Student ID is safe to update. All event registrations and attendance records use an internal immutable primary key.
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
              {/* Profile Photo Uploader */}
              <div className="flex flex-col items-center text-center p-4 rounded-xl bg-slate-950/70 border border-slate-800">
                <div className="w-24 h-24 rounded-full overflow-hidden bg-slate-900 border-2 border-brand-500/60 flex items-center justify-center shadow-glow-md">
                  {photoBase64 ? (
                    <img src={photoBase64} alt="Avatar Preview" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-2xl font-bold text-white">{initials}</span>
                  )}
                </div>
                <label className="mt-3 cursor-pointer inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700">
                  <span>Upload Photo</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                </label>
                <span className="text-[10px] text-slate-400 mt-1">PNG, JPG up to 2MB</span>
              </div>

              {/* Form Input Fields */}
              <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    Full Legal Name <span className="text-cyan-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-3 py-2 focus:outline-none focus:border-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    Student ID <span className="text-cyan-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-cyan-300 font-mono rounded-xl px-3 py-2 focus:outline-none focus:border-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    Department <span className="text-cyan-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-3 py-2 focus:outline-none focus:border-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    Course / Degree <span className="text-cyan-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={course}
                    onChange={(e) => setCourse(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-3 py-2 focus:outline-none focus:border-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    Academic Year <span className="text-cyan-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={academicYear}
                    onChange={(e) => setAcademicYear(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-3 py-2 focus:outline-none focus:border-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-3 py-2 focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons: Save & Cancel */}
            <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={handleCancel}
                disabled={loading}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white font-semibold text-xs shadow-glow-sm transition-all flex items-center gap-1.5"
              >
                {loading ? 'Saving to MySQL...' : 'Save Changes'}
              </button>
            </div>
          </form>
        ) : (
          /* Read-Only Display Mode */
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
            {/* Avatar & Identifiers */}
            <div className="flex flex-col items-center text-center p-4 rounded-xl bg-slate-950/60 border border-slate-800">
              <div className="w-24 h-24 rounded-full overflow-hidden bg-gradient-to-tr from-brand-500 via-indigo-600 to-cyan-400 p-0.5 shadow-glow-md flex items-center justify-center">
                {profile?.photo_base64 ? (
                  <img src={profile.photo_base64} alt={profile.full_name} className="w-full h-full object-cover rounded-full" />
                ) : (
                  <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center text-2xl font-extrabold text-white">
                    {initials}
                  </div>
                )}
              </div>
              <h4 className="mt-3 text-base font-bold text-white">{profile?.full_name || currentUser.username}</h4>
              <span className="text-xs font-mono font-semibold text-cyan-400 mt-0.5">
                {profile?.student_id || 'ID: ' + currentUser.username}
              </span>
              <span className="text-[11px] text-slate-400 mt-1 capitalize">{currentUser.role}</span>
            </div>

            {/* Academic Details Form (Read-Only) */}
            <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3 bg-slate-950/40 rounded-xl border border-slate-800/80">
                <span className="text-slate-400 text-[10px] uppercase tracking-wider block">Full Legal Name</span>
                <span className="font-semibold text-white text-sm mt-0.5 block">{profile?.full_name || currentUser.username}</span>
              </div>

              <div className="p-3 bg-slate-950/40 rounded-xl border border-slate-800/80">
                <span className="text-slate-400 text-[10px] uppercase tracking-wider block">Student Roll ID</span>
                <span className="font-mono font-semibold text-cyan-300 text-sm mt-0.5 block">{profile?.student_id || 'N/A'}</span>
              </div>

              <div className="p-3 bg-slate-950/40 rounded-xl border border-slate-800/80">
                <span className="text-slate-400 text-[10px] uppercase tracking-wider block">Institutional Email</span>
                <span className="font-mono text-slate-200 mt-0.5 block truncate">{currentUser.email}</span>
              </div>

              <div className="p-3 bg-slate-950/40 rounded-xl border border-slate-800/80">
                <span className="text-slate-400 text-[10px] uppercase tracking-wider block">Department</span>
                <span className="font-semibold text-slate-200 mt-0.5 block">{profile?.department || 'Not configured'}</span>
              </div>

              <div className="p-3 bg-slate-950/40 rounded-xl border border-slate-800/80">
                <span className="text-slate-400 text-[10px] uppercase tracking-wider block">Program / Course</span>
                <span className="font-semibold text-slate-200 mt-0.5 block">{profile?.course || 'Not configured'}</span>
              </div>

              <div className="p-3 bg-slate-950/40 rounded-xl border border-slate-800/80">
                <span className="text-slate-400 text-[10px] uppercase tracking-wider block">Academic Year</span>
                <span className="font-semibold text-slate-200 mt-0.5 block">{profile?.academic_year || 'Current'}</span>
              </div>

              <div className="p-3 bg-slate-950/40 rounded-xl border border-slate-800/80 sm:col-span-2">
                <span className="text-slate-400 text-[10px] uppercase tracking-wider block">Contact Phone Number</span>
                <span className="font-mono text-slate-200 mt-0.5 block">{profile?.phone_number || 'No phone number added'}</span>
              </div>
            </div>
          </div>
        )}

        {/* Security watermark footer */}
        <div className="mt-6 pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-400">
          <div className="flex items-center gap-1.5">
            <ShieldCheckIcon className="w-3.5 h-3.5 text-emerald-400" />
            <span>Authenticated Database Record • MySQL Backend</span>
          </div>
          <span className="font-mono text-[10px] text-slate-400">
            INTERNAL PK: #{profile?.id || currentUser.id}
          </span>
        </div>
      </div>
    </div>
  );
};
