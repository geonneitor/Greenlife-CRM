import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Briefcase, FileText, PlusCircle } from 'lucide-react';
import History from './History';
import Quotes from './Quotes';
import Projects from './Projects';

export default function Operations() {
  const [activeTab, setActiveTab] = useState('management');

  const tabs = [
    { id: 'management', label: 'Gestión', icon: Briefcase },
    { id: 'quotes', label: 'Cotizaciones', icon: FileText },
    { id: 'new', label: 'Nueva Cotización', icon: PlusCircle },
  ];

  return (
    <div className="space-y-6">
      {/* Selector de Pestañas */}
      <div className="flex bg-black/40 p-1.5 rounded-[2rem] border border-white/5 w-fit mb-8 overflow-x-auto max-w-full">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex items-center gap-3 px-8 py-4 rounded-[1.5rem] text-[11px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                active ? 'text-black' : 'text-white/40 hover:text-white/60'
              }`}
            >
              {active && (
                <motion.div
                  layoutId="activeTabOps"
                  className="absolute inset-0 bg-brand rounded-[1.5rem] shadow-brand-glow"
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                />
              )}
              <Icon size={16} className="relative z-10" />
              <span className="relative z-10">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Contenido Dinámico */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {activeTab === 'management' && <History />}
        {activeTab === 'quotes' && <Quotes />}
        {activeTab === 'new' && <Projects />}
      </motion.div>
    </div>
  );
}
