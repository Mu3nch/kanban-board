import { useState } from 'react'
import { mockTasks } from '../data/mockTasks'

// Later: replace mockTasks with a Supabase fetch
export function useTasks() {
  const [tasks, setTasks] = useState(mockTasks)

  function addTask(task) {
    setTasks(prev => [...prev, { ...task, id: crypto.randomUUID() }])
  }

  function updateTask(updated) {
    setTasks(prev => prev.map(t => (t.id === updated.id ? updated : t)))
  }

  function deleteTask(id) {
    setTasks(prev => prev.filter(t => t.id !== id))
  }

  return { tasks, addTask, updateTask, deleteTask }
}
