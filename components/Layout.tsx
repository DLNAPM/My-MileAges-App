import React, { useState } from 'react';
import { User, ViewState } from '../types';
import { Menu, X, HelpCircle, LogOut, LayoutDashboard, Car, PlusCircle, FileText, Eye } from 'lucide-react';

interface LayoutProps {
  user: User | null;
  currentView: ViewState;
  setView: (view: ViewState) => void;
  onLogout: () => void;
  onShowHelp: () => void;
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ user, currentView, setView, onLogout, onShowHelp, children }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  if (!user) {
    return <>{children}</>;
  }

  const NavItem = ({ view, icon: Icon, label }: { view: ViewState; icon: any; label: string }) => (
    <button
      onClick={() => {
        setView(view);
        setIsMobileMenuOpen(false);
      }}
      className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors w-full md:w-auto ${
        currentView === view
          ? 'bg-blue-600 text-white'
          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
      }`}
    >
      <Icon size={18} />
      <span>{label}</span>
    </button>
  );

  return (
    <div className="flex flex-col h-screen bg-slate-50">
      {user.isGuest && (
        <div className="bg-indigo-600 text-white text-xs font-bold text-center py-1 px-4 flex items-center justify-center gap-2">
          <Eye size={14} />
          <span>GUEST MODE: READ ONLY. Data changes will not be saved.</span>
        </div>
      )}
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center cursor-pointer" onClick={() => setView('dashboard')}>
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                My MileAges
              </span>
            </div>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center space-x-2">
              <NavItem view="dashboard" icon={LayoutDashboard} label="Dashboard" />
              <NavItem view="log_trip" icon={PlusCircle} label="Log Trip" />
              <NavItem view="vehicles" icon={Car} label="Vehicles" />
              <NavItem view="reports" icon={FileText} label="Reports" />
              
              <div className="h-6 w-px bg-slate-200 mx-2"></div>
              
              <button 
                onClick={onShowHelp}
                className="p-2 text-slate-500 hover:text-blue-600 transition-colors"
                title="Help"
              >
                <HelpCircle size={20} />
              </button>
              
              <div className="flex items-center space-x-3 ml-4 pl-4 border-l border-slate-200">
                <img 
                  src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}`} 
                  alt={user.displayName} 
                  className="h-8 w-8 rounded-full bg-slate-200"
                />
                <button
                  onClick={onLogout}
                  className="text-sm font-medium text-slate-600 hover:text-red-600 flex items-center gap-1"
                >
                  <LogOut size={16} />
                </button>
              </div>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden flex items-center">
               <button 
                onClick={onShowHelp}
                className="p-2 mr-2 text-slate-500 hover:text-blue-600 transition-colors"
              >
                <HelpCircle size={20} />
              </button>
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 rounded-md text-slate-600 hover:text-slate-900 focus:outline-none"
              >
                {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Nav */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-slate-200">
            <div className="px-2 pt-2 pb-3 space-y-1">
              <NavItem view="dashboard" icon={LayoutDashboard} label="Dashboard" />
              <NavItem view="log_trip" icon={PlusCircle} label="Log Trip" />
              <NavItem view="vehicles" icon={Car} label="Vehicles" />
              <NavItem view="reports" icon={FileText} label="Reports" />
              <div className="border-t border-slate-200 my-2"></div>
              <button
                onClick={onLogout}
                className="flex items-center space-x-2 px-4 py-2 w-full text-left text-red-600 hover:bg-red-50 rounded-lg"
              >
                <LogOut size={18} />
                <span>Logout</span>
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto h-full">
          {children}
        </div>
      </main>
    </div>
  );
};