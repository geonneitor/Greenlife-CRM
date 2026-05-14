import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TrendingDown, 
  Truck, 
  Zap, 
  MoreHorizontal, 
  Calendar,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Utensils
} from 'lucide-react';
import { expensesApi } from '../api/expenses';
import { projectsApi } from '../api/projects';
import { useNotificationStore } from '../store/useNotificationStore';

const CATEGORIES = [
  { id: 'Operación', icon: Zap, color: '#00D084' },
  { id: 'Viáticos', icon: Truck, color: '#BFA98C' },
  { id: 'Comida', icon: Utensils, color: '#D4A050' },
  { id: 'Otros', icon: MoreHorizontal, color: '#6B7862' }
];

// ─── Estilos estándar del sistema ──────────────────────────────────────────
const panelStyle = {
  background: '#0A1A0F',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '16px',
  padding: '20px',
};

const labelStyle = {
  display: 'block',
  fontSize: '0.7rem',
  fontWeight: 700,
  color: 'rgba(255,255,255,0.35)',
  textTransform: 'uppercase',
  letterSpacing: '0.1em',
  marginBottom: '6px',
};

const inputStyle = {
  width: '100%',
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '10px',
  padding: '8px 12px',
  color: '#fff',
  fontSize: '0.875rem',
  outline: 'none',
  fontFamily: 'inherit',
  transition: 'border-color 0.2s',
  boxSizing: 'border-box',
};
// ────────────────────────────────────────────────────────────────────────────

export default function Expenses() {
  const { addNotification } = useNotificationStore();
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Operación');
  const [description, setDescription] = useState('');
  const [projectId, setProjectId] = useState('');
  const [activeProjects, setActiveProjects] = useState([]);

  useEffect(() => { 
    fetchExpenses(); 
    fetchActiveProjects();
  }, []);

  const fetchActiveProjects = async () => {
    try {
      const data = await projectsApi.getProjects();
      setActiveProjects(data.filter(p => p.status !== 'Estimate' && p.status !== 'cancelled'));
    } catch (err) {
      console.error("Error al cargar proyectos activos");
    }
  };

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const data = await expensesApi.getExpenses();
      setExpenses(data);
    } catch (err) {
      addNotification("Error al cargar gastos", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateExpense = async (e) => {
    e.preventDefault();
    if (!amount) return;
    setIsSubmitting(true);
    try {
      const payload = { amount: parseFloat(amount), category, description };
      if (projectId) payload.project_id = parseInt(projectId);
      await expensesApi.createExpense(payload);
      setShowSuccess(true);
      setAmount('');
      setDescription('');
      setProjectId('');
      fetchExpenses();
      setTimeout(() => setShowSuccess(false), 2500);
      addNotification(`Gasto de $${parseFloat(amount).toFixed(2)} registrado`, 'success');
    } catch (err) {
      addNotification("Error al registrar gasto", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading && expenses.length === 0) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '40vh' }}>
      <Loader2 className="text-brand animate-spin" size={32} />
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', height: '100%' }}>
      
      {/* ── Panel lateral: Formulario (ancho fijo, compacto) ── */}
      <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
        
        {/* FORM PANEL — Interactivo */}
        <div style={{ ...panelStyle, width: '320px', flexShrink: 0, position: 'relative', overflow: 'hidden' }}>
          
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <div style={{ background: 'rgba(212,104,90,0.15)', borderRadius: '10px', padding: '8px', display: 'flex' }}>
              <TrendingDown size={18} style={{ color: '#D4685A' }} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 800, color: '#fff', lineHeight: 1.2 }}>Registrar Gasto</h2>
              <p style={{ margin: 0, fontSize: '0.65rem', color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Salida de efectivo</p>
            </div>
          </div>

          <form onSubmit={handleCreateExpense} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            
            {/* Monto */}
            <div>
              <label style={labelStyle}>Monto ($)</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.25)', fontSize: '1rem', fontWeight: 800 }}>$</span>
                <input
                  type="number"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  style={{ ...inputStyle, paddingLeft: '28px', fontSize: '1.25rem', fontWeight: 900 }}
                  placeholder="0.00"
                  required
                  onFocus={e => e.target.style.borderColor = '#D4685A'}
                  onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
                />
              </div>
            </div>

            {/* Categoría */}
            <div>
              <label style={labelStyle}>Categoría</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                {CATEGORIES.map(cat => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategory(cat.id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '6px',
                      padding: '7px 10px',
                      borderRadius: '8px',
                      border: `1px solid ${category === cat.id ? cat.color + '60' : 'rgba(255,255,255,0.06)'}`,
                      background: category === cat.id ? cat.color + '15' : 'transparent',
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                      opacity: category === cat.id ? 1 : 0.5,
                    }}
                  >
                    <cat.icon size={14} style={{ color: cat.color }} />
                    <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{cat.id}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Descripción */}
            <div>
              <label style={labelStyle}>Concepto</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                placeholder="Descripción del gasto..."
                style={{ ...inputStyle, resize: 'none', lineHeight: 1.5 }}
                onFocus={e => e.target.style.borderColor = '#D4685A'}
                onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
              />
            </div>

            {/* Proyecto Asociado */}
            <div>
              <label style={labelStyle}>Asociar a Proyecto</label>
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                style={{ ...inputStyle, WebkitAppearance: 'none' }}
              >
                <option value="">Gasto General (Sin Proyecto)</option>
                {activeProjects.map(p => (
                  <option key={p.id} value={p.id}>#{p.id} - {p.title}</option>
                ))}
              </select>
            </div>

            {/* Botón */}
            <motion.button
              type="submit"
              disabled={isSubmitting || !amount}
              whileHover={amount ? { scale: 1.02 } : {}}
              whileTap={amount ? { scale: 0.97 } : {}}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '10px',
                border: 'none',
                background: amount ? '#D4685A' : 'rgba(255,255,255,0.05)',
                color: amount ? '#fff' : 'rgba(255,255,255,0.2)',
                fontWeight: 800,
                fontSize: '0.8125rem',
                cursor: amount ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                transition: 'all 0.2s',
                letterSpacing: '0.04em',
              }}
            >
              {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : 'Registrar Salida'}
            </motion.button>
          </form>

          {/* Success overlay */}
          <AnimatePresence>
            {showSuccess && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{
                  position: 'absolute', inset: 0,
                  background: 'rgba(10,26,15,0.97)',
                  borderRadius: '16px',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  gap: '8px'
                }}
              >
                <CheckCircle2 size={40} style={{ color: '#00D084' }} />
                <p style={{ margin: 0, fontWeight: 800, color: '#fff', fontSize: '0.9375rem' }}>¡Registrado!</p>
                <p style={{ margin: 0, fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Gasto guardado correctamente</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* HISTORIAL PANEL — Informativo */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <Calendar size={16} style={{ color: '#D4685A' }} />
            <h3 style={{ margin: 0, fontSize: '0.8125rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Gastos Recientes</h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {expenses.map((exp, index) => {
              const cat = CATEGORIES.find(c => c.id === exp.category) || CATEGORIES[3];
              return (
                <motion.div
                  key={exp.id}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.04 }}
                  style={{
                    ...panelStyle,
                    padding: '12px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                  }}
                >
                  <div style={{ background: cat.color + '18', borderRadius: '8px', padding: '6px', display: 'flex', flexShrink: 0 }}>
                    <cat.icon size={14} style={{ color: cat.color }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: '0.8125rem', fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {exp.description || 'Sin descripción'}
                    </p>
                    <p style={{ margin: 0, fontSize: '0.65rem', color: 'rgba(255,255,255,0.25)', marginTop: '2px' }}>
                      {exp.category} · {new Date(exp.timestamp).toLocaleDateString()}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <p style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 800, color: '#D4685A' }}>-${exp.amount.toFixed(2)}</p>
                  </div>
                </motion.div>
              );
            })}

            {expenses.length === 0 && !loading && (
              <div style={{ padding: '60px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', color: 'rgba(255,255,255,0.15)' }}>
                <AlertCircle size={40} />
                <p style={{ margin: 0, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700 }}>No hay egresos registrados</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
