/**
 * Map.jsx — Mapa interactivo de clientes
 * React-Leaflet + OpenStreetMap (gratis, sin API key)
 * Geocoding: Nominatim (OpenStreetMap, respeta 1 req/s)
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin, Loader2, RefreshCw, Users, Briefcase,
  AlertCircle, Phone, Mail, ChevronRight, X
} from 'lucide-react';
import client from '../api/client';
import { useNotificationStore } from '../store/useNotificationStore';

// Fix Leaflet default marker icons (problema conocido con bundlers)
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl:       'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl:     'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Colores por estado de proyecto
const STATUS_COLORS = {
  'In Progress': '#00D084',
  'Approved':    '#5098D4',
  'Maintenance': '#D4A050',
  'Estimate':    '#8B9E92',
  'Completed':   '#6B7862',
  'Cancelled':   '#D4685A',
};

// Icono personalizado SVG por estado
function createColoredIcon(color) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="36" viewBox="0 0 28 36">
      <path d="M14 0C6.27 0 0 6.27 0 14c0 9.33 14 22 14 22S28 23.33 28 14C28 6.27 21.73 0 14 0z"
            fill="${color}" stroke="rgba(0,0,0,0.3)" stroke-width="1"/>
      <circle cx="14" cy="14" r="6" fill="white" fill-opacity="0.9"/>
    </svg>
  `;
  return L.divIcon({
    html: svg,
    className: '',
    iconSize: [28, 36],
    iconAnchor: [14, 36],
    popupAnchor: [0, -36],
  });
}

// Icono de fallback (cliente sin proyectos)
const grayIcon = createColoredIcon('#6B7862');

// Cache de geocoding en sessionStorage
const GEOCODE_CACHE_KEY = 'gle_geocode_cache';

function getGeocodeCache() {
  try {
    return JSON.parse(sessionStorage.getItem(GEOCODE_CACHE_KEY) || '{}');
  } catch { return {}; }
}

function saveGeocodeCache(cache) {
  try {
    sessionStorage.setItem(GEOCODE_CACHE_KEY, JSON.stringify(cache));
  } catch { /* ignore */ }
}

/**
 * Geocodifica una dirección usando Nominatim (OpenStreetMap).
 * Respeta el rate limit de 1 req/s con un delay configurable.
 */
async function geocodeAddress(address, delay = 0) {
  if (!address || address.trim().length < 5) return null;

  const cache = getGeocodeCache();
  const key = address.trim().toLowerCase();
  if (cache[key]) return cache[key];

  if (delay > 0) await new Promise(r => setTimeout(r, delay));

  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1&countrycodes=us,mx`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'GreenlifeCRM/1.0 (landscaping business)' },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.length) return null;

    const coords = { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
    cache[key] = coords;
    saveGeocodeCache(cache);
    return coords;
  } catch {
    return null;
  }
}

// Componente para re-centrar el mapa cuando haya marcadores
function MapFitter({ bounds }) {
  const map = useMap();
  useEffect(() => {
    if (bounds && bounds.length > 1) {
      try {
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
      } catch { /* ignore */ }
    }
  }, [bounds, map]);
  return null;
}

// ─── Panel lateral de cliente ─────────────────────────────────────────────────
function ClientPanel({ clientData, onClose }) {
  if (!clientData) return null;
  const { client: c, projects } = clientData;
  const fullName = `${c.first_name} ${c.last_name}`;
  const topProject = projects[0];
  const statusColor = topProject ? (STATUS_COLORS[topProject.status] || '#8B9E92') : '#8B9E92';

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      style={{
        position: 'absolute', top: 12, right: 12, zIndex: 1000,
        width: '280px',
        background: '#0A1A0F',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '20px',
        overflow: 'hidden',
        boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
      }}
    >
      {/* Header */}
      <div style={{ background: statusColor + '20', borderBottom: `2px solid ${statusColor}`, padding: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ flex: 1 }}>
            <p style={{ margin: 0, fontSize: '0.65rem', fontWeight: 800, color: statusColor, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Cliente
            </p>
            <h3 style={{ margin: '4px 0 0', fontSize: '1rem', fontWeight: 900, color: '#fff' }}>
              {fullName}
            </h3>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)', padding: '2px' }}>
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Info */}
      <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {c.phone && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)' }}>
            <Phone size={13} style={{ color: statusColor, flexShrink: 0 }} />
            <span>{c.phone}</span>
          </div>
        )}
        {c.email && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)' }}>
            <Mail size={13} style={{ color: statusColor, flexShrink: 0 }} />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.email}</span>
          </div>
        )}
        {c.address && (
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)' }}>
            <MapPin size={13} style={{ color: statusColor, flexShrink: 0, marginTop: 2 }} />
            <span style={{ lineHeight: 1.4 }}>{c.address}</span>
          </div>
        )}
      </div>

      {/* Proyectos */}
      {projects.length > 0 && (
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '12px 16px' }}>
          <p style={{ margin: '0 0 8px', fontSize: '0.6rem', fontWeight: 800, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Proyectos ({projects.length})
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {projects.slice(0, 3).map(p => (
              <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 10px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: STATUS_COLORS[p.status] || '#6B7862', flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: '0.75rem', fontWeight: 700, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.title}</p>
                  <p style={{ margin: 0, fontSize: '0.6rem', color: 'rgba(255,255,255,0.3)' }}>{p.status} · ${parseFloat(p.total_quoted_usd || 0).toFixed(0)} USD</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────
export default function Map() {
  const { addNotification } = useNotificationStore();
  const [clients, setClients] = useState([]);
  const [projects, setProjects] = useState([]);
  const [markers, setMarkers] = useState([]); // { client, projects, coords }
  const [loading, setLoading] = useState(true);
  const [geocoding, setGeocoding] = useState(false);
  const [geocodingProgress, setGeocodingProgress] = useState({ done: 0, total: 0 });
  const [selectedClient, setSelectedClient] = useState(null);
  const [statusFilter, setStatusFilter] = useState('All');

  // Cargar datos
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [clientsRes, projectsRes] = await Promise.all([
        client.get('/clients'),
        client.get('/projects'),
      ]);
      setClients(clientsRes.data);
      setProjects(projectsRes.data);
    } catch (err) {
      addNotification('Error al cargar datos del mapa', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Geocodificar clientes cuando los datos están listos
  useEffect(() => {
    if (clients.length === 0) return;

    const clientsWithAddress = clients.filter(c => c.address && c.address.trim().length > 5);
    if (clientsWithAddress.length === 0) return;

    setGeocoding(true);
    setGeocodingProgress({ done: 0, total: clientsWithAddress.length });

    let cancelled = false;

    const geocodeAll = async () => {
      const results = [];
      for (let i = 0; i < clientsWithAddress.length; i++) {
        if (cancelled) break;
        const c = clientsWithAddress[i];
        const coords = await geocodeAddress(c.address, i === 0 ? 0 : 1200); // 1.2s entre requests
        if (!cancelled) {
          setGeocodingProgress({ done: i + 1, total: clientsWithAddress.length });
        }
        if (coords) {
          const clientProjects = projects.filter(p => p.client_id === c.id);
          results.push({ client: c, projects: clientProjects, coords });
        }
      }
      if (!cancelled) {
        setMarkers(results);
        setGeocoding(false);
      }
    };

    geocodeAll();
    return () => { cancelled = true; };
  }, [clients, projects]);

  // Bounds para auto-ajustar el mapa
  const bounds = markers.map(m => [m.coords.lat, m.coords.lng]);

  // Estadísticas
  const stats = {
    total: clients.length,
    withAddress: clients.filter(c => c.address).length,
    mapped: markers.length,
    inProgress: markers.filter(m => m.projects.some(p => p.status === 'In Progress')).length,
  };

  // Filtrar marcadores por estado
  const filteredMarkers = markers.filter(m => {
    if (statusFilter === 'All') return true;
    if (statusFilter === 'No Projects') return m.projects.length === 0;
    return m.projects.some(p => p.status === statusFilter);
  });

  // Determinar color del marcador
  const getMarkerColor = (markerData) => {
    if (markerData.projects.length === 0) return '#6B7862';
    const priority = ['In Progress', 'Approved', 'Maintenance', 'Estimate', 'Completed', 'Cancelled'];
    for (const status of priority) {
      if (markerData.projects.some(p => p.status === status)) return STATUS_COLORS[status];
    }
    return '#6B7862';
  };

  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: 16 }}>
      <Loader2 size={40} style={{ color: 'var(--brand)', animation: 'spin 1s linear infinite' }} />
      <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.875rem', fontWeight: 700 }}>Cargando datos del mapa...</p>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', height: '100%' }}>

      {/* ── Estadísticas ── */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        {[
          { label: 'Total Clientes', value: stats.total, icon: Users, color: '#8B9E92' },
          { label: 'Con Dirección', value: stats.withAddress, icon: MapPin, color: 'var(--brand)' },
          { label: 'En el Mapa', value: stats.mapped, icon: MapPin, color: '#5098D4' },
          { label: 'En Progreso', value: stats.inProgress, icon: Briefcase, color: '#00D084' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} style={{ background: '#0A1A0F', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '14px', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '10px', flex: '1 1 140px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icon size={16} style={{ color }} />
            </div>
            <div>
              <p style={{ margin: 0, fontSize: '0.6rem', fontWeight: 800, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{label}</p>
              <p style={{ margin: 0, fontSize: '1.125rem', fontWeight: 900, color: '#fff' }}>{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Filtros por estado ── */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', background: 'rgba(0,0,0,0.4)', padding: '4px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.05)', gap: '4px', flexWrap: 'wrap' }}>
          {['All', 'In Progress', 'Approved', 'Maintenance', 'Estimate', 'Completed'].map(f => (
            <button
              key={f}
              onClick={() => setStatusFilter(f)}
              style={{
                padding: '6px 14px', borderRadius: '10px', border: 'none', cursor: 'pointer',
                background: statusFilter === f ? (STATUS_COLORS[f] || 'var(--brand)') : 'transparent',
                color: statusFilter === f ? '#000' : 'rgba(255,255,255,0.4)',
                fontWeight: 800, fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.08em',
                transition: 'all 0.2s',
              }}
            >
              {f === 'All' ? 'Todos' : f}
            </button>
          ))}
        </div>

        {geocoding && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem', fontWeight: 600 }}>
            <Loader2 size={14} style={{ animation: 'spin 1s linear infinite', color: 'var(--brand)' }} />
            Geocodificando {geocodingProgress.done}/{geocodingProgress.total}...
          </div>
        )}

        <button
          onClick={() => {
            sessionStorage.removeItem('gle_geocode_cache');
            setMarkers([]);
            fetchData();
          }}
          style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: '11px', fontWeight: 700 }}
        >
          <RefreshCw size={14} /> Actualizar
        </button>
      </div>

      {/* ── Leyenda ── */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        {Object.entries(STATUS_COLORS).map(([status, color]) => (
          <div key={status} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: color }} />
            <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.35)', fontWeight: 700 }}>{status}</span>
          </div>
        ))}
      </div>

      {/* ── Mapa ── */}
      <div style={{ flex: 1, borderRadius: '20px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)', minHeight: '400px', position: 'relative' }}>
        {markers.length === 0 && !geocoding && (
          <div style={{ position: 'absolute', inset: 0, zIndex: 999, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px', background: 'rgba(10,26,15,0.85)', backdropFilter: 'blur(4px)' }}>
            <AlertCircle size={36} style={{ color: 'rgba(255,255,255,0.2)' }} />
            <p style={{ color: 'rgba(255,255,255,0.4)', fontWeight: 700, fontSize: '0.875rem', margin: 0 }}>
              {clients.filter(c => c.address).length === 0
                ? 'Los clientes no tienen dirección registrada'
                : 'No se pudo geocodificar ninguna dirección'}
            </p>
            <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: '0.75rem', margin: 0 }}>
              Agrega direcciones completas a los clientes (ciudad, estado, país)
            </p>
          </div>
        )}

        <MapContainer
          center={[29.0, -102.0]}
          zoom={5}
          style={{ width: '100%', height: '100%', minHeight: '400px' }}
          zoomControl={true}
          attributionControl={true}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          />

          {bounds.length > 0 && <MapFitter bounds={bounds} />}

          {filteredMarkers.map((markerData, i) => {
            const color = getMarkerColor(markerData);
            const icon = createColoredIcon(color);
            const { client: c, projects: cProjects, coords } = markerData;
            const fullName = `${c.first_name} ${c.last_name}`;
            const topProject = cProjects[0];

            return (
              <Marker
                key={c.id}
                position={[coords.lat, coords.lng]}
                icon={icon}
                eventHandlers={{
                  click: () => setSelectedClient(markerData),
                }}
              >
                <Popup>
                  <div style={{ minWidth: '180px', fontFamily: 'inherit' }}>
                    <strong style={{ fontSize: '0.9rem', display: 'block', marginBottom: '4px' }}>{fullName}</strong>
                    {c.phone && <p style={{ margin: '2px 0', fontSize: '0.75rem', color: '#555' }}>📞 {c.phone}</p>}
                    {topProject && (
                      <div style={{ marginTop: '8px', padding: '6px 8px', background: color + '20', borderRadius: '6px', borderLeft: `3px solid ${color}` }}>
                        <p style={{ margin: 0, fontSize: '0.75rem', fontWeight: 700 }}>{topProject.title}</p>
                        <p style={{ margin: 0, fontSize: '0.7rem', color: '#666' }}>{topProject.status}</p>
                      </div>
                    )}
                    {cProjects.length > 1 && (
                      <p style={{ margin: '6px 0 0', fontSize: '0.7rem', color: '#888' }}>+{cProjects.length - 1} proyectos más</p>
                    )}
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>

        {/* Panel lateral de cliente seleccionado */}
        <AnimatePresence>
          {selectedClient && (
            <ClientPanel
              clientData={selectedClient}
              onClose={() => setSelectedClient(null)}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Nota sin clientes geocodificados */}
      {!geocoding && markers.length > 0 && markers.length < clients.filter(c => c.address).length && (
        <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: '0.7rem', textAlign: 'center', margin: 0 }}>
          ℹ️ {clients.filter(c => c.address).length - markers.length} dirección(es) no pudieron ser localizadas. Verifica que sean direcciones completas (calle, ciudad, estado, país).
        </p>
      )}
    </div>
  );
}
