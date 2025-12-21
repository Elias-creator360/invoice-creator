'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'

export default function DebugPage() {
  const [debugData, setDebugData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchDebugData()
  }, [])

  const fetchDebugData = async () => {
    try {
      const token = localStorage.getItem('auth_token')
      if (!token) {
        setError('No auth token found. Please log in as admin first.')
        setLoading(false)
        return
      }

      const response = await fetch('http://localhost:3001/api/admin/debug/permissions', {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${await response.text()}`)
      }

      const data = await response.json()
      setDebugData(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div className="p-8">Loading...</div>
  if (error) return <div className="p-8 text-red-600">Error: {error}</div>

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Debug: Database State</h1>
      
      <Card className="p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Unique Roles in Database</h2>
        <pre className="bg-gray-100 p-4 rounded overflow-auto">
          {JSON.stringify(debugData?.uniqueRoles, null, 2)}
        </pre>
      </Card>

      <Card className="p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">All Users</h2>
        <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-96">
          {JSON.stringify(debugData?.users, null, 2)}
        </pre>
      </Card>

      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">All Role Permissions</h2>
        <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-96">
          {JSON.stringify(debugData?.permissions, null, 2)}
        </pre>
      </Card>
    </div>
  )
}
