import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types/civic';
import { X, Lock, Mail, User, Shield, CheckCircle2 } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { currentUser, login, register, logout, switchDemoRole } = useAuth();
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('citizen');
  const [department, setDepartment] = useState('Roads & Infrastructure Maintenance');
  const [statusMsg, setStatusMsg] = useState('');

  React.useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    if (isRegisterMode) {
      await register(name || 'Registered Citizen', email, selectedRole, department);
      setStatusMsg('Account created and signed in successfully.');
    } else {
      await login(email, selectedRole);
      setStatusMsg('Signed in successfully.');
    }

    setTimeout(() => {
      setStatusMsg('');
      onClose();
    }, 1000);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4"
    >
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-teal-700" />
            <h3 id="auth-modal-title" className="text-base font-extrabold text-slate-900">
              {isRegisterMode ? 'Create CivicAI Account' : 'Account & Access Management'}
            </h3>
          </div>
          <button
            onClick={onClose}
            aria-label="Close authentication modal"
            className="text-slate-400 hover:text-slate-700 min-h-[36px] min-w-[36px] flex items-center justify-center cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Active Account Box */}
        <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
          <div className="flex justify-between items-center">
            <span className="text-slate-400 font-semibold uppercase">Active Profile:</span>
            <span className="font-bold text-teal-700 uppercase font-mono">{currentUser.role}</span>
          </div>
          <div className="text-sm font-bold text-slate-900">{currentUser.name}</div>
          <div className="text-slate-500 font-mono text-[11px]">{currentUser.email}</div>
          {currentUser.department && (
            <div className="text-slate-600 font-medium text-[11px]">{currentUser.department}</div>
          )}
        </div>

        {/* Switch / Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {isRegisterMode && (
            <div>
              <label className="block text-slate-700 font-bold uppercase mb-1">Full Name</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Teja Sharma"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:border-teal-500"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-slate-700 font-bold uppercase mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="email"
                required
                placeholder="name@metro.gov or citizen@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:border-teal-500 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-bold uppercase mb-1">Assigned Role</label>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value as UserRole)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-medium"
            >
              <option value="citizen">Citizen (Submit &amp; Track Complaints)</option>
              <option value="officer">Municipal Officer (Triage, Dispatch &amp; Resolve)</option>
              <option value="admin">Administrator (Policy Weights, RBAC &amp; Audits)</option>
            </select>
          </div>

          {selectedRole !== 'citizen' && (
            <div>
              <label className="block text-slate-700 font-bold uppercase mb-1">Department</label>
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium"
              />
            </div>
          )}

          {statusMsg && (
            <div className="p-3 bg-teal-50 border border-teal-200 text-teal-800 rounded-lg font-semibold flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-teal-600" />
              <span>{statusMsg}</span>
            </div>
          )}

          <div className="pt-2 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setIsRegisterMode(!isRegisterMode)}
              className="text-teal-700 hover:underline font-semibold"
            >
              {isRegisterMode ? 'Already registered? Sign in' : 'Create new citizen account'}
            </button>

            <button
              type="submit"
              className="px-5 py-2 bg-slate-950 hover:bg-teal-700 text-white font-bold rounded-xl transition-colors cursor-pointer"
            >
              {isRegisterMode ? 'Register' : 'Sign In'}
            </button>
          </div>
        </form>

        {/* Quick Demo Role Switching Bar for Competition Judges */}
        <div className="pt-4 border-t border-slate-200">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
            Quick Competition Judge Persona Switch:
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => {
                switchDemoRole('citizen');
                onClose();
              }}
              className="p-2 text-center rounded-lg bg-slate-100 hover:bg-teal-50 hover:text-teal-900 border border-slate-200 font-semibold text-slate-700 text-xs transition-colors cursor-pointer"
            >
              Citizen
            </button>
            <button
              onClick={() => {
                switchDemoRole('officer');
                onClose();
              }}
              className="p-2 text-center rounded-lg bg-slate-100 hover:bg-teal-50 hover:text-teal-900 border border-slate-200 font-semibold text-slate-700 text-xs transition-colors cursor-pointer"
            >
              Officer
            </button>
            <button
              onClick={() => {
                switchDemoRole('admin');
                onClose();
              }}
              className="p-2 text-center rounded-lg bg-slate-100 hover:bg-teal-50 hover:text-teal-900 border border-slate-200 font-semibold text-slate-700 text-xs transition-colors cursor-pointer"
            >
              Administrator
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
