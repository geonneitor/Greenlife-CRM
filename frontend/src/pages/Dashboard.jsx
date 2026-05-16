import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer as RechartsContainer
} from 'recharts'
import {
  TrendingUp, DollarSign, Briefcase, Users, Loader2,
  BarChart2, RefreshCw, Bell, PieChart, Info, ChevronRight, X, CreditCard, Download, CalendarClock
} from 'lucide-react'
import { projectsApi } from '../api/projects'
import { useAuthStore } from '../store/useAuthStore'
import { useNotificationStore } from '../store/useNotificationStore'
import AnimatedNumber from '../components/AnimatedNumber'
import { useTranslation } from 'react-i18next'

// ─── Tooltip personalizado para la gráfica ───────────────────────────────────
const CustomTooltip = ({ active, payload, label, t }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: '16px',
      padding: '12px 16px',
    }}>
      <p style={{ color: 'var(--text-muted)', fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color, fontWeight: 900, fontSize: '14px', margin: '2px 0' }}>
          {p.name === 'quoted_usd' ? t('dashboard.quoted_usd') : t('dashboard.quoted_mxn')}: ${Number(p.value).toFixed(2)}
        </p>
      ))}
    </div>
  )
}

// ─── Tarjeta de métrica ───────────────────────────────────────────────────────
// ─── Modal de Detalles de Proyecto ──────────────────────────────────────────
const ProjectDetailsModal = ({ project, onClose, t }) => {
  if (!project) return null
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md no-print"
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }}
        className="glass w-full max-w-2xl rounded-[2.5rem] overflow-hidden shadow-2xl"
      >
        <div className="p-8 border-b border-white/5 flex justify-between items-center bg-brand/10">
          <div>
            <h2 className="text-white font-black text-2xl uppercase tracking-tighter">{project.title}</h2>
            <p className="text-brand font-bold text-xs">ID: #{project.id} · {project.status}</p>
          </div>
          <button onClick={onClose} className="p-3 bg-black/20 hover:bg-black/40 rounded-full text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-8 space-y-8 max-height-[70vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-1">
              <p className="text-white/30 text-[10px] font-black uppercase tracking-widest">{t('settings.clients') || 'Cliente'}</p>
              <p className="text-white font-bold">{project.client?.first_name} {project.client?.last_name}</p>
            </div>
            <div className="space-y-1">
              <p className="text-white/30 text-[10px] font-black uppercase tracking-widest">{t('dashboard.quoted_usd')}</p>
              <p className="text-brand font-black text-xl">${project.total_quoted_usd} USD</p>
            </div>
          </div>

          <div className="space-y-1">
            <p className="text-white/30 text-[10px] font-black uppercase tracking-widest">Descripción</p>
            <p className="text-white/60 text-sm italic">"{project.description || 'Sin descripción'}"</p>
          </div>

          <div className="space-y-4">
            <p className="text-white/30 text-[10px] font-black uppercase tracking-widest">Ítems del Proyecto</p>
            <div className="space-y-3">
              {project.items?.map(item => (
                <div key={item.id} className="flex justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                  <div>
                    <p className="text-white font-bold text-sm">{item.service?.name}</p>
                    <p className="text-white/40 text-[10px]">Cantidad: {item.quantity}</p>
                  </div>
                  <p className="text-white font-black text-sm">${item.price_at_quote_usd} USD</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="p-8 bg-black/20 flex justify-end gap-3">
          <button onClick={onClose} className="px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold text-xs uppercase tracking-widest transition-all">{t('common.cancel')}</button>
          <button onClick={() => window.print()} className="px-6 py-3 rounded-xl bg-brand text-black font-black text-xs uppercase tracking-widest shadow-brand-glow hover:scale-105 transition-all">Imprimir Detalle</button>
        </div>
      </motion.div>
    </motion.div>
  )
}

const MetricCard = ({ icon: Icon, label, value, prefix = '$', suffix = '', decimals = 2, color = 'var(--brand)', delay = 0, onClick }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    className="glass group cursor-pointer hover:border-brand/40 transition-all"
    onClick={onClick}
    style={{
      borderRadius: '2rem',
      padding: '24px',
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
    }}
  >
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      <div style={{
        width: 32, height: 32, borderRadius: '10px',
        background: `rgba(var(--brand-rgb, 0,208,132), 0.1)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center'
      }}>
        <Icon size={16} style={{ color }} />
      </div>
      <span style={{ color: 'var(--text-muted)', fontSize: '9px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.15em' }}>
        {label}
      </span>
    </div>
    <span style={{ color: 'var(--text-main)', fontSize: '1.6rem', fontWeight: 900 }}>
      <AnimatedNumber value={value} prefix={prefix} />
      {suffix && <span style={{ fontSize: '0.8rem', marginLeft: 4 }}>{suffix}</span>}
    </span>
    <div className="flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
      <ChevronRight size={14} style={{ color: 'var(--brand)' }} />
    </div>
  </motion.div>
)

export default function Dashboard() {
  const { t } = useTranslation()
  const { user } = useAuthStore()
  const { addNotification } = useNotificationStore()

  const [period, setPeriod] = useState('week')
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [activeModal, setActiveModal] = useState(null)
  const [followUps, setFollowUps] = useState([])

  const fetchFollowUps = useCallback(async () => {
    try {
      const maintenanceProjects = await projectsApi.getProjects({ status: 'Maintenance', limit: 5 })
      const estimateProjects = await projectsApi.getProjects({ status: 'Estimate', limit: 5 })
      setFollowUps([...maintenanceProjects, ...estimateProjects].slice(0, 5))
    } catch (err) {
      console.error('Error fetching follow ups', err)
    }
  }, [])

  const fetchDashboard = useCallback(async (p = period, isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    else setLoading(true)
    try {
      const result = await projectsApi.getSummary(p)
      setData(result)
    } catch (err) {
      addNotification('Error al cargar métricas del dashboard', 'error')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [period])

  useEffect(() => {
    fetchDashboard(period)
  }, [period, fetchDashboard])

  useEffect(() => {
    fetchFollowUps()
  }, [fetchFollowUps])

  const handlePrint = () => {
    window.print();
    addNotification('Reporte generado en PDF', 'success');
  }

  const PERIODS = [
    { key: 'today', label: t('dashboard.periods.today') },
    { key: 'week',  label: t('dashboard.periods.week') },
    { key: 'month', label: t('dashboard.periods.month') },
  ]

  if (loading) return (
    <div style={{ display: 'flex', height: '60vh', alignItems: 'center', justifyContent: 'center' }}>
      <Loader2 size={48} style={{ color: 'var(--brand)', animation: 'spin 1s linear infinite' }} />
    </div>
  )

  const m = data?.metrics || {}
  const chart = data?.chartData || []

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      
      {/* ── Controles ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', background: 'rgba(0,0,0,0.4)', padding: '4px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', gap: 4 }}>
          {PERIODS.map(({ key, label }) => (
            <button key={key} onClick={() => setPeriod(key)} style={{ padding: '8px 20px', borderRadius: '12px', border: 'none', background: period === key ? 'var(--brand)' : 'transparent', color: period === key ? '#000' : 'rgba(255,255,255,0.4)', fontWeight: 900, fontSize: '10px', textTransform: 'uppercase', cursor: 'pointer' }}>{label}</button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-brand text-white hover:text-black hover:shadow-brand-glow transition-all cursor-pointer font-bold text-xs uppercase tracking-wider no-print">
            <Download size={14} /> {t('dashboard.export_pdf')}
          </button>
          <button onClick={() => fetchDashboard(period, true)} disabled={refreshing} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '11px', fontWeight: 700 }} className="no-print">
            <RefreshCw size={14} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} /> {t('dashboard.update')}
          </button>
        </div>
      </div>

      {/* ── Métricas principales ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <MetricCard icon={DollarSign} label={t('dashboard.quoted_usd')} value={m.quoted_usd || 0} />
        <MetricCard icon={TrendingUp} label={t('dashboard.quoted_mxn')} value={m.quoted_mxn || 0} color="#D4A050" />
        <MetricCard icon={CreditCard} label={t('dashboard.paid_usd')} value={m.paid_usd || 0} color="#5098D4" />
        <MetricCard icon={Briefcase} label={t('dashboard.active_projects')} value={m.active_projects || 0} prefix="" decimals={0} color="var(--brand)" onClick={() => window.location.href = '/operations'} />
        <MetricCard icon={Users} label={t('dashboard.total_clients')} value={m.total_clients || 0} prefix="" decimals={0} color="#C9A84C" onClick={() => window.location.href = '/crm'} />
        <MetricCard icon={PieChart} label={t('dashboard.expenses')} value={m.expenses || 0} color="#ff6b6b" onClick={() => window.location.href = '/finances'} />
      </div>

      {/* ── Gráfica de Tendencia ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass"
        style={{
          borderRadius: '2.5rem',
          padding: '32px',
          height: '400px'
        }}
      >
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ color: 'var(--text-main)', fontWeight: 900, fontSize: '18px', margin: 0 }}>{t('dashboard.trend_title')}</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px', margin: '4px 0 0' }}>{t('dashboard.trend_subtitle')}</p>
        </div>
        <div style={{ height: '300px', width: '100%', minHeight: '300px' }}>
          <RechartsContainer width="100%" height={300}>

            <AreaChart data={chart}>
              <defs>
                <linearGradient id="colorUSD" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--brand)" stopOpacity={0.3} /><stop offset="95%" stopColor="var(--brand)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorMXN" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#D4A050" stopOpacity={0.3} /><stop offset="95%" stopColor="#D4A050" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="rgba(255,255,255,0.03)" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip t={t} />} />
              <Area type="monotone" dataKey="quoted_usd" name="USD" stroke="var(--brand)" strokeWidth={3} fill="url(#colorUSD)" />
              <Area type="monotone" dataKey="quoted_mxn" name="MXN" stroke="#D4A050" strokeWidth={3} fill="url(#colorMXN)" />
            </AreaChart>
          </RechartsContainer>
        </div>
      </motion.div>

      {/* ── Seguimientos Pendientes ── */}
      <div className="mt-4 no-print">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
            <CalendarClock size={18} className="text-orange-500" />
          </div>
          <div>
            <h3 className="text-white font-black text-lg">{t('dashboard.follow_up_title')}</h3>
            <p className="text-white/30 text-[10px] font-bold uppercase tracking-widest">{t('dashboard.follow_up_subtitle')}</p>
          </div>
        </div>

        {followUps.length === 0 ? (
          <div className="bg-surface-card border border-border-glass rounded-3xl p-8 text-center">
            <p className="text-white/40 font-bold text-sm">{t('dashboard.no_follow_ups')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {followUps.map(p => (
              <div 
                key={p.id} 
                onClick={() => setActiveModal(p)}
                className="glass rounded-2xl p-5 hover:border-brand/30 transition-colors cursor-pointer group"
              >
                <div className="flex justify-between items-start mb-4">
                  <span className="px-3 py-1 bg-white/5 rounded-lg text-[9px] font-black text-white/50 uppercase tracking-widest">
                    {p.status}
                  </span>
                  <span className="text-brand font-black text-sm">${p.total_quoted_usd}</span>
                </div>
                <h4 className="text-white font-bold text-base mb-1 truncate">{p.title}</h4>
                <p className="text-white/40 text-xs truncate">{p.client?.first_name} {p.client?.last_name}</p>
                
                <div className="mt-4 flex justify-end">
                  <ChevronRight size={16} className="text-white/10 group-hover:text-brand transition-colors" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Modal de Detalles ── */}
      <AnimatePresence>
        {activeModal && (
          <ProjectDetailsModal 
            project={activeModal} 
            onClose={() => setActiveModal(null)} 
            t={t}
          />
        )}
      </AnimatePresence>

    </div>
  )
}
