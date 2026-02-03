import React from 'react';
import { CheckCircle, Shield, BarChart3, Cloud, HelpCircle, Mail, FileText, Lock } from 'lucide-react';

interface LandingPageProps {
  onLogin: () => void;
  onHelp: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onLogin, onHelp }) => {
  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Navigation */}
      <nav className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md fixed w-full z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                My MileAges
              </span>
            </div>
            <div className="flex items-center space-x-6">
              <a href="#features" className="text-slate-300 hover:text-white transition-colors hidden md:block">Features</a>
              <a href="#support" className="text-slate-300 hover:text-white transition-colors hidden md:block">Support</a>
               <button onClick={onHelp} className="text-slate-300 hover:text-white p-1">
                 <HelpCircle size={20} />
               </button>
              <button 
                onClick={onLogin}
                className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-full font-medium transition-all shadow-lg shadow-blue-900/20"
              >
                Sign In
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
        <div className="inline-block mb-4 px-4 py-1 rounded-full bg-slate-800 border border-slate-700 text-blue-400 text-sm font-semibold tracking-wide">
          POWERED BY GEMINI
        </div>
        <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight mb-6">
          Smart Mileage Tracking <br />
          <span className="text-slate-400">Reimagined for You.</span>
        </h1>
        <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-10">
          Effortlessly log trips, manage vehicles, and generate tax-ready reports with the power of AI. Your data, visualized and secure.
        </p>
        
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <button 
            onClick={onLogin}
            className="px-8 py-4 bg-white text-slate-900 rounded-lg font-bold text-lg hover:bg-slate-100 transition-colors flex items-center justify-center gap-2"
          >
            <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
            Continue with Google
          </button>
          <a 
            href="#features"
            className="px-8 py-4 bg-slate-800 text-white rounded-lg font-bold text-lg hover:bg-slate-700 transition-colors"
          >
            Learn More
          </a>
        </div>
      </div>

      {/* Features Section */}
      <div id="features" className="py-24 bg-slate-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Everything you need to track miles</h2>
            <p className="text-slate-400">Simple yet powerful tools for freelancers, employees, and businesses.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-slate-800 p-8 rounded-2xl border border-slate-700 hover:border-blue-500/50 transition-colors">
              <div className="w-12 h-12 bg-blue-900/30 rounded-lg flex items-center justify-center text-blue-400 mb-6">
                <BarChart3 size={24} />
              </div>
              <h3 className="text-xl font-bold mb-3">Detailed Reporting</h3>
              <p className="text-slate-400">
                Generate reports for any period: day, week, month, or year. Export to CSV, Excel-compatible formats, or PDF instantly.
              </p>
            </div>

            <div className="bg-slate-800 p-8 rounded-2xl border border-slate-700 hover:border-blue-500/50 transition-colors">
              <div className="w-12 h-12 bg-purple-900/30 rounded-lg flex items-center justify-center text-purple-400 mb-6">
                <Cloud size={24} />
              </div>
              <h3 className="text-xl font-bold mb-3">Cloud Sync & Secure</h3>
              <p className="text-slate-400">
                Your data is stored securely. Log in from any device to access your mileage history, vehicle lists, and preferences.
              </p>
            </div>

            <div className="bg-slate-800 p-8 rounded-2xl border border-slate-700 hover:border-blue-500/50 transition-colors">
              <div className="w-12 h-12 bg-green-900/30 rounded-lg flex items-center justify-center text-green-400 mb-6">
                <CheckCircle size={24} />
              </div>
              <h3 className="text-xl font-bold mb-3">Smart Auto-Fill</h3>
              <p className="text-slate-400">
                Save time with remembered destinations and companies. Select from your history instead of typing every time.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer / Support */}
      <footer id="support" className="bg-slate-900 border-t border-slate-800 pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div className="col-span-1 md:col-span-2">
              <span className="text-xl font-bold text-white mb-4 block">My MileAges</span>
              <p className="text-slate-400 mb-6 max-w-sm">
                The intelligent way to track your vehicle mileage. Built with modern web technologies and powered by Gemini AI for smart insights.
              </p>
            </div>
            
            <div>
              <h4 className="text-white font-bold mb-4">Legal</h4>
              <ul className="space-y-2 text-slate-400">
                <li className="flex items-center gap-2"><Lock size={14} /> Privacy Policy</li>
                <li className="flex items-center gap-2"><FileText size={14} /> Terms of Service</li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-bold mb-4">Contact & Support</h4>
              <ul className="space-y-2 text-slate-400">
                <li className="flex items-center gap-2"><Mail size={14} /> support@mymileages.com</li>
                <li className="flex items-center gap-2"><HelpCircle size={14} /> Help Center</li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-slate-800 pt-8 text-center text-slate-500 text-sm">
            &copy; {new Date().getFullYear()} My MileAges. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};