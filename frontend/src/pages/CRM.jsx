import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Bell, Map as MapIcon } from 'lucide-react';
import LeadsDashboard from './LeadsDashboard';
import Clients from './Clients';
import Map from './Map';

export default function CRM() {
  const [activeTab, setActiveTab] = useState('leads');

  const tabs = [
    { id: 'leads', label: 'Prospectos', icon: Bell },
    { id: 'clients', label: 'Clientes', icon: Users },
    { id: 'map', label: 'Mapa', icon: MapIcon },
  ];

  return (
    <div className="space-y-6">
      {/* Selector de Pestañas Estilo Premium */}
      <div className="flex bg-black/40 p-1.5 rounded-[2rem] border border-white/5 w-fit mb-8">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex items-center gap-3 px-8 py-4 rounded-[1.5rem] text-[11px] font-black uppercase tracking-widest transition-all ${
                active ? 'text-black' : 'text-white/40 hover:text-white/60'
              }`}
            >
              {active && (
                <motion.div
                  layoutId="activeTabCRM"
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
        {activeTab === 'leads' && <LeadsDashboard />}
        {activeTab === 'clients' && <Clients />}
        {activeTab === 'map' && <Map />}
      </motion.div>
    </div>
  );
}
