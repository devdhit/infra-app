'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  RefreshCw,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  Wifi,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Search
} from "lucide-react"
import { useTranslation } from "@/hooks/use-translation"
import { toast } from "sonner"
import logger from '@/lib/logger'
import { api } from '@/lib/api'

interface Agent {
  id: string
  name: string
  ipAddress: string
  lastSeen: string
  status: 'online' | 'offline' | 'updating' | 'error'
  lastUpdate: string
  pcName: string
}

interface AgentsResponse {
  data: Agent[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

export default function AgentsSettingsPage() {
  const { t } = useTranslation()
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 1
  })
  const [search, setSearch] = useState('')
  const [searchInputValue, setSearchInputValue] = useState('')
  const searchInputRef = useRef<HTMLInputElement>(null)
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Fetch agents data using Axios with pagination and search
  const fetchAgents = useCallback(async (page: number = 1, searchTerm: string = '') => {
    try {
      setLoading(true)
      const data = await api.get<AgentsResponse>(`/agents?page=${page}&limit=10&search=${encodeURIComponent(searchTerm)}`)
      setAgents(data.data)
      setPagination(data.pagination)
      setCurrentPage(data.pagination.page)
    } catch (error: any) {
      logger.error('Error fetching agents:', error)
      toast.error(t('agents.errors.fetchFailed') || 'Failed to fetch agents')
    } finally {
      setLoading(false)
    }
  }, [t])

  // Handle search with debounce
  const handleSearch = useCallback((value: string) => {
    setSearchInputValue(value)
    
    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }
    
    // Set new timeout
    searchTimeoutRef.current = setTimeout(() => {
      setSearch(value)
      setCurrentPage(1) // Reset to first page when searching
    }, 300)
  }, [])

  // Fetch agents on component mount
  useEffect(() => {
    fetchAgents(currentPage, search)
  }, [currentPage, search, fetchAgents])

  // Reset to first page when search changes
  useEffect(() => {
    if (search !== '') {
      setCurrentPage(1)
    }
  }, [search])

  const handleTriggerUpdate = useCallback(async (agentId: string) => {
    try {
      // Update UI immediately to show updating status
      setAgents(agents => agents.map(agent => 
        agent.id === agentId 
          ? { ...agent, status: 'updating' } 
          : agent
      ))
      
      await api.put<{ message: string; agentId: string }>(`/agents/${agentId}/trigger-update`)

      toast.success(t('agents.success.updateTriggered') || 'Update triggered successfully')
      
      // Simulate update completion (in a real implementation, this would be handled by webhooks or polling)
      setTimeout(() => {
        setAgents(agents => agents.map(agent => 
          agent.id === agentId 
            ? { 
                ...agent, 
                status: 'online',
                lastUpdate: new Date().toISOString(),
                lastSeen: new Date().toISOString()
              } 
            : agent
        ))
      }, 3000)
    } catch (error: any) {
      logger.error('Error triggering update:', error)
      toast.error(t('agents.errors.updateFailed') || 'Failed to trigger update')
      
      // Reset status on error
      setAgents(agents => agents.map(agent => 
        agent.id === agentId 
          ? { ...agent, status: 'error' } 
          : agent
      ))
    }
  }, [t])

  const handleDeleteAgent = useCallback(async (agentId: string, agentName: string) => {
    try {
      if (!confirm(t('agents.delete.confirm', `Are you sure you want to delete agent ${agentName}? This action cannot be undone.`))) {
        return;
      }

      await api.delete<{ message: string; pcId: string }>(`/agents/${agentId}`)
      
      // Remove the agent from the state
      setAgents(agents => agents.filter(agent => agent.id !== agentId))
      
      toast.success(t('agents.delete.success', 'Agent deleted successfully'))
    } catch (error: any) {
      logger.error('Error deleting agent:', error)
      toast.error(t('agents.delete.error', 'Failed to delete agent'))
    }
  }, [t])

  const getStatusIcon = (status: Agent['status']) => {
    switch (status) {
      case 'online':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'offline':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'updating':
        return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />
      case 'error':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusText = (status: Agent['status']) => {
    switch (status) {
      case 'online':
        return t('agents.status.online') || 'Online'
      case 'offline':
        return t('agents.status.offline') || 'Offline'
      case 'updating':
        return t('agents.status.updating') || 'Updating'
      case 'error':
        return t('agents.status.error') || 'Error'
      default:
        return t('agents.status.unknown') || 'Unknown'
    }
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  // Pagination component
  const renderPagination = () => {
    if (pagination.pages <= 1) return null;
    
    const getPageNumbers = () => {
      const pages = [];
      const maxVisiblePages = 5;
      
      if (pagination.pages <= maxVisiblePages) {
        // Show all pages
        for (let i = 1; i <= pagination.pages; i++) {
          pages.push(i);
        }
      } else {
        // Show first page, current page, and last page with ellipses
        if (currentPage <= 3) {
          // Show first 5 pages
          for (let i = 1; i <= Math.min(5, pagination.pages); i++) {
            pages.push(i);
          }
          if (pagination.pages > 5) {
            pages.push('ellipsis');
            pages.push(pagination.pages);
          }
        } else if (currentPage >= pagination.pages - 2) {
          // Show last 5 pages
          pages.push(1);
          pages.push('ellipsis');
          for (let i = pagination.pages - 4; i <= pagination.pages; i++) {
            pages.push(i);
          }
        } else {
          // Show current page with 2 pages on each side
          pages.push(1);
          pages.push('ellipsis');
          for (let i = currentPage - 2; i <= currentPage + 2; i++) {
            pages.push(i);
          }
          pages.push('ellipsis');
          pages.push(pagination.pages);
        }
      }
      
      return pages;
    };
    
    const pageNumbers = getPageNumbers();
    
    return (
      <div className="flex items-center justify-between gap-2 flex-wrap mt-4">
        <div className="text-sm text-muted-foreground">
          {t('common.pagination.showing', 
            `Showing {0} to {1} of {2} items`,
            ((currentPage - 1) * pagination.limit) + 1,
            Math.min(currentPage * pagination.limit, pagination.total),
            pagination.total
          )}
        </div>
        <div className="flex gap-1 items-center">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(currentPage - 1)}
            disabled={currentPage === 1 || loading}
            aria-label={t('common.pagination.previous', "Previous page")}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          {pageNumbers.map((page, index) => (
            page === 'ellipsis' ? (
              <span key={`ellipsis-${index}`} className="px-2 py-1 text-muted-foreground">...</span>
            ) : (
              <Button
                key={page}
                variant={page === currentPage ? "default" : "outline"}
                size="sm"
                onClick={() => setCurrentPage(page as number)}
                disabled={loading}
                className={page === currentPage ? "bg-primary text-primary-foreground" : ""}
              >
                {page}
              </Button>
            )
          ))}
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(currentPage + 1)}
            disabled={currentPage === pagination.pages || loading}
            aria-label={t('common.pagination.next', "Next page")}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            {t('agents.title') || 'Agent Management'}
          </h1>
          <p className="text-muted-foreground">
            {t('agents.description') || 'Manage and monitor your IT asset agents'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => {
              setSearch('')
              setSearchInputValue('')
              setCurrentPage(1)
              fetchAgents(1, '')
            }}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            {t('common.refresh') || 'Refresh'}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('agents.list.title') || 'Registered Agents'}</CardTitle>
          <CardDescription>
            {t('agents.list.description') || 'View and manage all registered agents'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Search Input */}
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                ref={searchInputRef}
                placeholder={t('agents.search.placeholder') || "Search agents by PC name, IP or MAC address..."}
                value={searchInputValue}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
              <span className="ml-2 text-muted-foreground">
                {t('agents.loading') || 'Loading agents...'}
              </span>
            </div>
          ) : agents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Wifi className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">
                {search ? 
                  (t('agents.search.noResults') || 'No agents found matching your search') : 
                  (t('agents.empty.title') || 'No agents registered')}
              </h3>
              <p className="text-muted-foreground">
                {search ? 
                  (t('agents.search.tryAgain') || 'Try adjusting your search terms') : 
                  (t('agents.empty.description') || 'Add your first agent to start monitoring IT assets')}
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-hidden rounded-md border">
                <table className="w-full">
                  <thead className="bg-muted">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                        {t('agents.table.agent') || 'Agent'}
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                        {t('agents.table.ipAddress') || 'IP Address'}
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                        {t('agents.table.pcName') || 'PC Name'}
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                        {t('agents.table.lastSeen') || 'Last Seen'}
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                        {t('agents.table.lastUpdate') || 'Last Update'}
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                        {t('agents.table.status') || 'Status'}
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                        {t('agents.table.actions') || 'Actions'}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {agents.map((agent) => (
                      <tr key={agent.id} className="hover:bg-muted/50">
                        <td className="px-4 py-3">
                          <div className="font-medium">{agent.name}</div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm">{agent.ipAddress}</div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm">{agent.pcName}</div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm text-muted-foreground">
                            {formatDateTime(agent.lastSeen)}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm text-muted-foreground">
                            {formatDateTime(agent.lastUpdate)}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center">
                            {getStatusIcon(agent.status)}
                            <span className="ml-2 text-sm">
                              {getStatusText(agent.status)}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleTriggerUpdate(agent.id)}
                              disabled={agent.status === 'updating'}
                            >
                              <RefreshCw className="h-4 w-4 mr-1" />
                              {t('agents.actions.update') || 'Update'}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteAgent(agent.id, agent.name)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {renderPagination()}
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('agents.configuration.title') || 'Agent Configuration'}</CardTitle>
          <CardDescription>
            {t('agents.configuration.description') || 'Configure agent update settings'}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="update-interval">
              {t('agents.configuration.updateInterval') || 'Update Interval (minutes)'}
            </Label>
            <Input
              id="update-interval"
              type="number"
              min="1"
              max="60"
              defaultValue="10"
              className="w-full"
            />
            <p className="text-sm text-muted-foreground">
              {t('agents.configuration.updateIntervalHelp') || 'How often agents should automatically send updates'}
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="retry-attempts">
              {t('agents.configuration.retryAttempts') || 'Retry Attempts'}
            </Label>
            <Input
              id="retry-attempts"
              type="number"
              min="0"
              max="10"
              defaultValue="3"
              className="w-full"
            />
            <p className="text-sm text-muted-foreground">
              {t('agents.configuration.retryAttemptsHelp') || 'Number of retry attempts for failed updates'}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}