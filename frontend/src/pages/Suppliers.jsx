import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Bell, Calendar, Clock, AlertCircle
} from 'lucide-react'
import { useAuthStore } from '../store/useAuthStore'

export default function Reminders() {
  const { user } = useAuthStore()

  const [reminders] = useState([
    { id: 1, title: 'Mantenimiento Res. Smith', date: '2026-05-15', type: 'Work' },
    { id: 2, title: 'Cobro Proyecto Jones', date: '2026-05-12', type: 'Payment' },
  ])

  return (
    <div className="space-y-10 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-4xl font-black text-white uppercase tracking-tight">Recordatorios</h1>
          <p className="text-white/30 text-xs font-bold uppercase tracking-widest mt-1">Próximas tareas y notificaciones</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {reminders.map(r => (
          <motion.div 
            key={r.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#0A1A0F] border border-white/5 rounded-[2.5rem] p-8 hover:border-brand/30 transition-all flex items-center gap-6"
          >
            <div className="w-14 h-14 bg-brand/10 border border-brand/20 rounded-2xl flex items-center justify-center">
              <Bell className="text-brand" size={24} />
            </div>
            <div>
              <h3 className="text-white font-black text-lg">{r.title}</h3>
              <div className="flex items-center gap-4 mt-2">
                <span className="flex items-center gap-1.5 text-white/30 text-[10px] font-black uppercase"><Calendar size={12} /> {r.date}</span>
                <span className="px-2 py-0.5 bg-brand/10 text-brand text-[8px] font-black uppercase rounded-full">{r.type}</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="bg-brand/5 border border-brand/10 rounded-[2.5rem] p-10 flex flex-col items-center text-center">
        <AlertCircle className="text-brand/40 mb-4" size={48} />
        <h3 className="text-white font-black text-xl mb-2">Módulo de Notificaciones</h3>
        <p className="text-white/40 max-w-md text-sm">Estamos integrando el sistema de recordatorios automáticos por SMS y Email para mantener a los clientes informados.</p>
      </div>

    </div>
  )
}
