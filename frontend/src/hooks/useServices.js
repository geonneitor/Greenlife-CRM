import { useState, useCallback } from 'react'
import { servicesApi } from '../api/services'
import { useNotificationStore } from '../store/useNotificationStore'

export const useServices = () => {
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(false)

  const fetchServices = useCallback(async () => {
    setLoading(true)
    try {
      const data = await servicesApi.getServices()
      setServices(data)
      return data
    } catch (err) {
      useNotificationStore.getState().addNotification('Error al cargar servicios', 'error')
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const createService = useCallback(async (serviceData) => {
    try {
      const result = await servicesApi.createService(serviceData)
      setServices(prev => [result, ...prev])
      return result
    } catch (err) {
      useNotificationStore.getState().addNotification('Error al crear servicio', 'error')
      throw err
    }
  }, [])

  return { services, loading, fetchServices, createService }
}
