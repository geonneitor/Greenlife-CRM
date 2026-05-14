import { useState, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search, Briefcase, Plus, X, Loader2,
  DollarSign, CheckCircle2, User, Calendar,
  Trash2, ChevronRight, RefreshCw, Download, TrendingUp
} from 'lucide-react'
import { useServices } from '../hooks/useServices'
import { useProjects } from '../hooks/useProjects'
import { useExchangeRate } from '../hooks/useExchangeRate'
import { useNotificationStore } from '../store/useNotificationStore'
import { generateQuotePDF } from '../services/quotePDF'
import client from '../api/client'

// ── Badge de tipo de cambio ───────────────────────────────────────────────────
function ExchangeBadge({ rate, loading, error, onRefresh }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '8px',
      padding: '8px 14px', borderRadius: '14px',
      background: 'rgba(10,26,15,0.8)',
      border: '1px solid rgba(0,208,132,0.2)',
      fontSize: '0.75rem',
    }}>
      <TrendingUp size={14} style={{ color: 'var(--brand)' }} />
      {loading ? (
        <span style={{ color: 'rgba(255,255,255,0.3)', fontWeight: 700 }}>Actualizando...</span>
      ) : error ? (
        <span style={{ color: '#D4685A', fontWeight: 700 }}>T.C. no disponible</span>
      ) : (
        <>
          <span style={{ color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>1 USD =</span>
          <span style={{ color: 'var(--brand)', fontWeight: 900 }}>{rate.toFixed(4)} MXN</span>
        </>
      )}
      <button
        onClick={onRefresh}
        disabled={loading}
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.3)', padding: '2px', display: 'flex' }}
        title="Actualizar tipo de cambio"
      >
        <RefreshCw size={12} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
      </button>
    </div>
  )
}

export default function Projects() {
  const [clientsList, setClientsList] = useState([])
  const [selectedClient, setSelectedClient] = useState(null)
  const [projectTitle, setProjectTitle] = useState('')
  const [projectDesc, setProjectDesc] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [items, setItems] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [pdfLoading, setPdfLoading] = useState(false)

  const { services, loading: servicesLoading, fetchServices } = useServices()
  const { createProject, loading: projectLoading } = useProjects()
  const { addNotification } = useNotificationStore()
  const { rate, loading: rateLoading, error: rateError, fetchRate, usdToMxn } = useExchangeRate()

  useEffect(() => {
    fetchServices()
    fetchClients()
  }, [])

  const fetchClients = async () => {
    try {
      const res = await client.get('/clients')
      setClientsList(res.data)
    } catch (err) {
      addNotification('Error al cargar clientes', 'error')
    }
  }

  const filteredServices = services.filter(s =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.category.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const addItem = (service) => {
    const exists = items.find(i => i.service_id === service.id)
    if (exists) {
      setItems(items.map(i => i.service_id === service.id ? { ...i, quantity: i.quantity + 1 } : i))
    } else {
      const priceUsd = parseFloat(service.base_price_usd || 0)
      setItems([...items, {
        service_id: service.id,
        name: service.name,
        category: service.category,
        quantity: 1,
        price_usd: priceUsd,
        price_mxn: usdToMxn(priceUsd),
        // guardamos referencia al service completo para el PDF
        service,
      }])
    }
    addNotification(`${service.name} añadido`, 'success', 1000)
  }

  const removeItem = (serviceId) => {
    setItems(items.filter(i => i.service_id !== serviceId))
  }

  const updateQuantity = (serviceId, delta) => {
    setItems(prev => prev.map(i => {
      if (i.service_id !== serviceId) return i
      const newQty = Math.max(1, i.quantity + delta)
      return { ...i, quantity: newQty }
    }))
  }

  const totals = useMemo(() => {
    return items.reduce((acc, item) => {
      acc.usd += (item.price_usd || 0) * item.quantity
      acc.mxn += (item.price_mxn || 0) * item.quantity
      return acc
    }, { usd: 0, mxn: 0 })
  }, [items])

  // Recalcular MXN cuando cambia el tipo de cambio
  useEffect(() => {
    if (items.length === 0) return
    setItems(prev => prev.map(i => ({
      ...i,
      price_mxn: usdToMxn(i.price_usd),
    })))
  }, [rate])

  const handleCreate = async () => {
    if (!selectedClient) return addNotification('Selecciona un cliente', 'warning')
    if (!projectTitle) return addNotification('Ingresa un título para el proyecto', 'warning')
    if (items.length === 0) return addNotification('Agrega al menos un servicio', 'warning')

    try {
      const payload = {
        client_id: selectedClient.id,
        title: projectTitle,
        description: projectDesc,
        status: 'Estimate',
        start_date: startDate || null,
        end_date: endDate || null,
        total_quoted_usd: parseFloat(totals.usd.toFixed(2)),
        total_quoted_mxn: parseFloat(totals.mxn.toFixed(2)),
        items: items.map(i => ({
          service_id: i.service_id,
          quantity: i.quantity,
          price_at_quote_usd: parseFloat(i.price_usd.toFixed(2)),
          price_at_quote_mxn: parseFloat(i.price_mxn.toFixed(2)),
        }))
      }
      const created = await createProject(payload)
      addNotification('¡Proyecto creado con éxito!', 'success')

      // Auto-generar PDF si hay datos del cliente
      if (created && selectedClient) {
        const projectForPDF = {
          ...payload,
          id: created.id || 0,
          client: selectedClient,
          items: items.map(i => ({
            service: i.service,
            quantity: i.quantity,
            price_at_quote_usd: i.price_usd,
            price_at_quote_mxn: i.price_mxn,
          }))
        }
        try {
          generateQuotePDF(projectForPDF, rate)
          addNotification('PDF de cotización generado', 'success')
        } catch {
          // No bloquear si el PDF falla
        }
      }

      // Reset
      setProjectTitle('')
      setProjectDesc('')
      setItems([])
      setSelectedClient(null)
      setStartDate('')
      setEndDate('')
    } catch (err) {
      addNotification('Error al crear el proyecto', 'error')
    }
  }

  const handleDownloadPDF = () => {
    if (!selectedClient) return addNotification('Selecciona un cliente para el PDF', 'warning')
    if (!projectTitle) return addNotification('Ingresa un título para el PDF', 'warning')
    if (items.length === 0) return addNotification('Agrega servicios para generar el PDF', 'warning')

    setPdfLoading(true)
    try {
      const projectForPDF = {
        id: 'BORRADOR',
        title: projectTitle,
        description: projectDesc,
        status: 'Estimate',
        start_date: startDate || null,
        total_quoted_usd: totals.usd,
        total_quoted_mxn: totals.mxn,
        client: selectedClient,
        items: items.map(i => ({
          service: i.service,
          quantity: i.quantity,
          price_at_quote_usd: i.price_usd,
          price_at_quote_mxn: i.price_mxn,
        }))
      }
      generateQuotePDF(projectForPDF, rate)
      addNotification('PDF generado correctamente', 'success')
    } catch (err) {
      addNotification('Error al generar PDF', 'error')
    } finally {
      setPdfLoading(false)
    }
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 pb-20">

      {/* ── Left: Project Config ── */}
      <div className="xl:col-span-2 space-y-6">

        {/* Tipo de cambio */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <ExchangeBadge rate={rate} loading={rateLoading} error={rateError} onRefresh={fetchRate} />
          <p className="text-[9px] font-bold text-white/20 uppercase tracking-widest">
            Los precios MXN se actualizan automáticamente
          </p>
        </div>

        <div className="bg-[#0A1A0F] border border-white/5 rounded-[2.5rem] p-8 md:p-10 space-y-8">
          <h2 className="text-2xl font-black text-white uppercase tracking-tight flex items-center gap-3">
            <Briefcase className="text-brand" /> Nueva Cotización
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-3 block">Cliente</label>
              <select
                value={selectedClient?.id || ''}
                onChange={(e) => {
                  const id = parseInt(e.target.value)
                  setSelectedClient(clientsList.find(c => c.id === id) || null)
                }}
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white focus:border-brand/40 outline-none appearance-none"
              >
                <option value="">Seleccionar Cliente...</option>
                {clientsList.map(c => (
                  <option key={c.id} value={c.id}>{c.first_name} {c.last_name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-3 block">Título del Proyecto</label>
              <input
                value={projectTitle} onChange={e => setProjectTitle(e.target.value)}
                placeholder="Ej: Mantenimiento Residencial - Smith"
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white focus:border-brand/40 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-3 block">Descripción</label>
            <textarea
              value={projectDesc} onChange={e => setProjectDesc(e.target.value)}
              placeholder="Detalles del trabajo a realizar..."
              rows={3}
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white focus:border-brand/40 outline-none resize-none"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-3 block">Fecha Inicio</label>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white outline-none" />
            </div>
            <div>
              <label className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-3 block">Fecha Fin (Est.)</label>
              <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white outline-none" />
            </div>
          </div>
        </div>

        {/* Catálogo de Servicios */}
        <div className="bg-[#0A1A0F] border border-white/5 rounded-[2.5rem] p-8 md:p-10">
          <div className="flex justify-between items-center mb-8 flex-wrap gap-4">
            <h3 className="text-lg font-black text-white uppercase tracking-widest">Catálogo de Servicios</h3>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={16} />
              <input
                value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                placeholder="Buscar servicio..."
                className="bg-white/5 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-xs text-white outline-none focus:border-brand/40"
              />
            </div>
          </div>

          {servicesLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="animate-spin text-brand" size={28} />
            </div>
          ) : filteredServices.length === 0 ? (
            <p className="text-center text-white/20 py-10 font-bold text-sm">Sin servicios disponibles</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {filteredServices.map(service => (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  key={service.id}
                  onClick={() => addItem(service)}
                  className="bg-white/5 border border-white/5 p-5 rounded-2xl text-left hover:border-brand/40 transition-all group"
                >
                  <p className="text-[8px] font-black text-white/20 uppercase tracking-widest mb-1">{service.category}</p>
                  <p className="text-white font-bold text-sm mb-2 group-hover:text-brand leading-tight">{service.name}</p>
                  <div className="flex gap-2 flex-wrap">
                    <p className="text-brand font-black text-xs">${parseFloat(service.base_price_usd || 0).toFixed(2)} USD</p>
                    <p className="text-white/30 font-bold text-xs">${usdToMxn(parseFloat(service.base_price_usd || 0)).toFixed(2)} MXN</p>
                  </div>
                </motion.button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Right: Summary ── */}
      <div className="space-y-6">
        <div className="bg-brand rounded-[2.5rem] p-8 md:p-10 shadow-brand-glow sticky top-8">
          <h3 className="text-black font-black text-xl uppercase tracking-tighter mb-8">Resumen</h3>

          <div className="space-y-4 mb-8 min-h-[80px]">
            {items.length === 0 ? (
              <p className="text-black/40 text-xs font-bold uppercase text-center py-6 border-2 border-dashed border-black/10 rounded-2xl">
                Sin servicios agregados
              </p>
            ) : (
              items.map(item => (
                <div key={item.service_id} className="flex justify-between items-center bg-black/5 p-3 rounded-xl gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-black font-bold text-xs truncate">{item.name}</p>
                    <p className="text-black/40 text-[9px] mt-0.5">${item.price_usd.toFixed(2)}/u</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => updateQuantity(item.service_id, -1)}
                      className="w-6 h-6 rounded-full bg-black/10 text-black font-black text-sm flex items-center justify-center hover:bg-black/20">−</button>
                    <span className="text-black font-black text-sm w-4 text-center">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.service_id, 1)}
                      className="w-6 h-6 rounded-full bg-black/10 text-black font-black text-sm flex items-center justify-center hover:bg-black/20">+</button>
                    <button onClick={() => removeItem(item.service_id)} className="text-black/30 hover:text-red-700 ml-1">
                      <Trash2 size={13} />
                    </button>
                  </div>
                  <p className="text-black font-black text-sm w-16 text-right">${(item.price_usd * item.quantity).toFixed(2)}</p>
                </div>
              ))
            )}
          </div>

          <div className="space-y-3 pt-6 border-t border-black/10">
            <div className="flex justify-between items-center">
              <p className="text-black/60 text-[10px] font-black uppercase">Total USD</p>
              <p className="text-2xl font-black text-black">${totals.usd.toFixed(2)}</p>
            </div>
            <div className="flex justify-between items-center">
              <p className="text-black/60 text-[10px] font-black uppercase">Total MXN</p>
              <p className="text-lg font-black text-black/70">${totals.mxn.toFixed(2)}</p>
            </div>
            <p className="text-black/30 text-[8px] font-bold">T.C.: 1 USD = {rate.toFixed(4)} MXN</p>
          </div>

          {/* Botón PDF borrador */}
          <button
            onClick={handleDownloadPDF}
            disabled={pdfLoading || items.length === 0}
            className="w-full mt-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all"
            style={{ background: 'rgba(0,0,0,0.12)', color: items.length === 0 ? 'rgba(0,0,0,0.25)' : 'rgba(0,0,0,0.7)', cursor: items.length === 0 ? 'not-allowed' : 'pointer' }}
          >
            {pdfLoading ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}
            Previsualizar PDF
          </button>

          <button
            onClick={handleCreate}
            disabled={projectLoading}
            className="w-full bg-black text-brand py-5 rounded-2xl font-black text-xs uppercase tracking-widest mt-3 hover:scale-[1.02] transition-all flex items-center justify-center gap-3"
          >
            {projectLoading ? <Loader2 className="animate-spin" size={18} /> : <><CheckCircle2 size={18} /> Crear + Descargar PDF</>}
          </button>
        </div>
      </div>

    </div>
  )
}
