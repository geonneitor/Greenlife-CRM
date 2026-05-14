/**
 * useExchangeRate — Tipo de cambio USD/MXN en tiempo real
 * Fuente: Frankfurter API (gratis, sin API key, datos del BCE)
 * Cachea en localStorage por 1 hora para no saturar la API
 */
import { useState, useEffect, useCallback } from 'react';

const CACHE_KEY = 'gle_exchange_rate';
const CACHE_TTL = 60 * 60 * 1000; // 1 hora en ms
const FALLBACK_RATE = 17.5; // tasa de respaldo si falla la API

function getCached() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const { rate, timestamp } = JSON.parse(raw);
    if (Date.now() - timestamp > CACHE_TTL) return null;
    return rate;
  } catch {
    return null;
  }
}

function setCache(rate) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ rate, timestamp: Date.now() }));
  } catch {
    // ignore storage errors
  }
}

export function useExchangeRate() {
  const [rate, setRate] = useState(() => getCached() || FALLBACK_RATE);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchRate = useCallback(async () => {
    // Si hay cache válido, usarlo sin hacer request
    const cached = getCached();
    if (cached) {
      setRate(cached);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch('https://api.frankfurter.app/latest?from=USD&to=MXN', {
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const mxnRate = data?.rates?.MXN;
      if (!mxnRate || typeof mxnRate !== 'number') throw new Error('Datos inválidos');

      setRate(mxnRate);
      setCache(mxnRate);
      setLastUpdated(new Date());
    } catch (err) {
      setError('No se pudo actualizar el tipo de cambio');
      // Mantener valor previo o fallback
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRate();
    // Refrescar cada hora
    const interval = setInterval(fetchRate, CACHE_TTL);
    return () => clearInterval(interval);
  }, [fetchRate]);

  /**
   * Convierte USD a MXN usando la tasa actual
   * @param {number} usdAmount
   * @returns {number}
   */
  const usdToMxn = useCallback((usdAmount) => {
    return parseFloat((usdAmount * rate).toFixed(2));
  }, [rate]);

  /**
   * Convierte MXN a USD usando la tasa actual
   * @param {number} mxnAmount
   * @returns {number}
   */
  const mxnToUsd = useCallback((mxnAmount) => {
    return parseFloat((mxnAmount / rate).toFixed(2));
  }, [rate]);

  return { rate, loading, error, lastUpdated, fetchRate, usdToMxn, mxnToUsd };
}
