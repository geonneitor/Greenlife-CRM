import { useState, useCallback } from 'react'
import { projectsApi } from '../api/projects'
import { useNotificationStore } from '../store/useNotificationStore'

/**
 * useProjects — Hook connected to the backend for Landscaping Projects.
 */
export const useProjects = () => {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(false)

  const fetchProjects = useCallback(async () => {
    setLoading(true)
    try {
      const data = await projectsApi.getProjects()
      setProjects(data)
      return data
    } catch (err) {
      useNotificationStore.getState().addNotification('Error al cargar proyectos', 'error')
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const createProject = useCallback(async (projectData) => {
    try {
      const result = await projectsApi.createProject(projectData)
      setProjects(prev => [result, ...prev])
      return result
    } catch (err) {
      useNotificationStore.getState().addNotification('Error al crear proyecto', 'error')
      throw err
    }
  }, [])

  return { projects, loading, fetchProjects, createProject }
}
