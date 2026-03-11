import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function useTasks() {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: true })
      .then(({ data, error }) => {
        if (!error) setTasks(data)
        setLoading(false)
      })
  }, [])

  async function addTask(task) {
    const { data, error } = await supabase
      .from('tasks')
      .insert([{ ...task, dependency_id: task.dependency_id || null }])
      .select()
      .single()
    if (!error) setTasks(prev => [...prev, data])
  }

  async function updateTask(updated) {
    const { data, error } = await supabase
      .from('tasks')
      .update({ ...updated, updated_at: new Date().toISOString() })
      .eq('id', updated.id)
      .select()
      .single()
    if (!error) setTasks(prev => prev.map(t => (t.id === updated.id ? data : t)))
  }

  async function deleteTask(id) {
    const { error } = await supabase.from('tasks').delete().eq('id', id)
    if (!error) setTasks(prev => prev.filter(t => t.id !== id))
  }

  return { tasks, loading, addTask, updateTask, deleteTask }
}
