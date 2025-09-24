'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { 
  RefreshCw,
  AlertCircle,
  Clock,
  Wifi,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Search,
  Circle,
  Filter,
  Info,
  HelpCircle
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

// Confirmation dialog component
const ConfirmationDialog = ({ 
  open, 
  onOpenChange, 
  onConfirm, 
  title, 
  description, 
  confirmText, 
  cancelText,
  confirmVariant = "destructive"
}: { 
  open: boolean; 
  onOpenChange: (open: boolean) => void; 
  onConfirm: () => void; 
  title: string; 
  description: string; 
  confirmText: string; 
  cancelText: string;
  confirmVariant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:space-x-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {cancelText}
          </Button>
          <Button variant={confirmVariant} onClick={onConfirm}>
            {confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Help dialog component
const HelpDialog = ({ open, onOpenChange, t }: { open: boolean; onOpenChange: (open: boolean) => void; t: (key: string, fallback?: string, ...args: any[]) => string }) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5" />
            {t('agents.help.title', 'Agent Management Help')}
          </DialogTitle>
          <DialogDescription>
            {t('agents.help.description', 'Learn how to manage your IT asset agents effectively.')}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <h4 className="font-medium">{t('agents.help.addingAgents', 'Adding Agents')}</h4>
            <p className="text-sm text-muted-foreground">
              {t('agents.help.addingAgentsDesc', 'To add a new agent, click the "Add Agent" button and enter the agent\'s IP address. The agent will need to be configured to connect to this server.')}
            </p>
          </div>
          
          <div className="space-y-2">
            <h4 className="font-medium">{t('agents.help.statusIndicators', 'Status Indicators')}</h4>
            <div className="space-y-1 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                  <Circle className="mr-1 h-2 w-2 fill-current" />
                  {t('agents.status.online', 'Online')}
                </span>
                <span>{t('agents.help.onlineDesc', 'Agent is connected and reporting status')}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100">
                  <Circle className="mr-1 h-2 w-2 fill-current" />
                  {t('agents.status.offline', 'Offline')}
                </span>
                <span>{t('agents.help.offlineDesc', 'Agent is not currently connected')}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100">
                  <RefreshCw className="mr-1 h-2 w-2 animate-spin" />
                  {t('agents.status.updating', 'Updating')}
                </span>
                <span>{t('agents.help.updatingDesc', 'Agent is currently receiving updates')}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100">
                  <AlertCircle className="mr-1 h-2 w-2" />
                  {t('agents.status.error', 'Error')}
                </span>
                <span>{t('agents.help.errorDesc', 'Agent encountered an error')}</span>
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <h4 className="font-medium">{t('agents.help.actions', 'Actions')}</h4>
            <p className="text-sm text-muted-foreground">
              {t('agents.help.actionsDesc', 'Use the Update button to trigger an immediate update on an agent. Use the Delete button to remove an agent from monitoring.')}
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>
            {t('common.close', 'Close')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Skeleton row component for loading state
const AgentRowSkeleton = () => (
  <tr>
    <td className="px-4 py-3"><Skeleton className="h-4 w-24" /></td>
    <td className="px-4 py-3"><Skeleton className="h-4 w-20" /></td>
    <td className="px-4 py-3"><Skeleton className="h-4 w-20" /></td>
    <td className="px-4 py-3">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-3 w-20 mt-1" />
    </td>
    <td className="px-4 py-3">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-3 w-20 mt-1" />
    </td>
    <td className="px-4 py-3"><Skeleton className="h-6 w-20 rounded-full" /></td>
    <td className="px-4 py-3">
      <div className="flex space-x-2">
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-8 w-8" />
      </div>
    </td>
  </tr>
)

// Mobile card component for agent data
const AgentCard = ({ agent, onTriggerUpdate, onDeleteAgent, t }: { 
  agent: Agent; 
  onTriggerUpdate: (id: string) => void; 
  onDeleteAgent: (id: string, name: string) => void;
  t: (key: string, fallback?: string, ...args: any[]) => string;
}) => {
  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
    
    if (diffInSeconds < 60) {
      return t('common.time.secondsAgo', '{0} seconds ago', diffInSeconds)
    }
    
    const diffInMinutes = Math.floor(diffInSeconds / 60)
    if (diffInMinutes < 60) {
      return t('common.time.minutesAgo', '{0} minutes ago', diffInMinutes)
    }
    
    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours < 24) {
      return t('common.time.hoursAgo', '{0} hours ago', diffInHours)
    }
    
    const diffInDays = Math.floor(diffInHours / 24)
    return t('common.time.daysAgo', '{0} days ago', diffInDays)
  }

  const getStatusBadge = (status: Agent['status']) => {
    const baseClasses = "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
    
    switch (status) {
      case 'online':
        return (
          <span className={`${baseClasses} bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100`}>
            <Circle className="mr-1 h-2 w-2 fill-current" />
            {t('agents.status.online') || 'Online'}
          </span>
        )
      case 'offline':
        return (
          <span className={`${baseClasses} bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100`}>
            <Circle className="mr-1 h-2 w-2 fill-current" />
            {t('agents.status.offline') || 'Offline'}
          </span>
        )
      case 'updating':
        return (
          <span className={`${baseClasses} bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100`}>
            <RefreshCw className="mr-1 h-2 w-2 animate-spin" />
            {t('agents.status.updating') || 'Updating'}
          </span>
        )
      case 'error':
        return (
          <span className={`${baseClasses} bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100`}>
            <AlertCircle className="mr-1 h-2 w-2" />
            {t('agents.status.error') || 'Error'}
          </span>
        )
      default:
        return (
          <span className={`${baseClasses} bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-100`}>
            <Clock className="mr-1 h-2 w-2" />
            {t('agents.status.unknown') || 'Unknown'}
          </span>
        )
    }
  }

  return (
    <div className="border rounded-lg p-4 mb-4">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-medium">{agent.name}</h3>
          <p className="text-sm text-muted-foreground">{agent.ipAddress}</p>
          <p className="text-sm text-muted-foreground">{agent.pcName}</p>
        </div>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onTriggerUpdate(agent.id)}
            disabled={agent.status === 'updating'}
            aria-label={t('agents.actions.updateAgent', 'Update agent {0}', agent.name)}
          >
            <RefreshCw className="h-4 w-4" />
            <span className="sr-only">{t('agents.actions.update') || 'Update'}</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDeleteAgent(agent.id, agent.name)}
            className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
            aria-label={t('agents.actions.deleteAgent', 'Delete agent {0}', agent.name)}
          >
            <Trash2 className="h-4 w-4" />
            <span className="sr-only">{t('common.delete') || 'Delete'}</span>
          </Button>
        </div>
      </div>
      
      <div className="mt-3 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">{t('agents.table.lastSeen') || 'Last Seen'}:</span>
          <div className="text-right">
            <div>{formatDateTime(agent.lastSeen)}</div>
            <div className="text-xs text-muted-foreground/70">
              {getTimeAgo(agent.lastSeen)}
            </div>
          </div>
        </div>
        
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">{t('agents.table.lastUpdate') || 'Last Update'}:</span>
          <div className="text-right">
            <div>{formatDateTime(agent.lastUpdate)}</div>
            <div className="text-xs text-muted-foreground/70">
              {getTimeAgo(agent.lastUpdate)}
            </div>
          </div>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">{t('agents.table.status') || 'Status'}:</span>
          <div>{getStatusBadge(agent.status)}</div>
        </div>
      </div>
    </div>
  )
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
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<string>('lastSeen')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [isMobileView, setIsMobileView] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showHelpDialog, setShowHelpDialog] = useState(false)
  const [agentToDelete, setAgentToDelete] = useState<{id: string, name: string} | null>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const refreshButtonRef = useRef<HTMLButtonElement>(null)

  // Check if we're on mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobileView(window.innerWidth < 768)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Fetch agents data using Axios with pagination and search
  const fetchAgents = useCallback(async (page: number = 1, searchTerm: string = '', status: string = 'all', sort: string = 'lastSeen', order: 'asc' | 'desc' = 'desc') => {
    try {
      setLoading(true)
      setError(null)
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        search: encodeURIComponent(searchTerm),
        status: status !== 'all' ? status : '',
        sortBy: sort,
        sortOrder: order
      })
      
      const data = await api.get<AgentsResponse>(`/agents?${params.toString()}`)
      setAgents(data.data)
      setPagination(data.pagination)
      setCurrentPage(data.pagination.page)
      setLastUpdated(new Date())
    } catch (error: any) {
      logger.error('Error fetching agents:', error)
      const errorMessage = error.message || t('agents.errors.fetchFailed') || 'Failed to fetch agents'
      setError(errorMessage)
      toast.error(errorMessage)
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

  // Handle status filter change
  const handleStatusFilterChange = useCallback((value: string) => {
    setStatusFilter(value)
    setCurrentPage(1)
  }, [])

  // Handle sort change
  const handleSortChange = useCallback((value: string) => {
    const [field, order] = value.split(':')
    setSortBy(field || 'lastSeen')
    setSortOrder((order as 'asc' | 'desc') || 'desc')
    setCurrentPage(1)
  }, [])

  // Start polling for real-time updates
  const startPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current)
    }
    
    // Poll every 30 seconds for status updates
    pollingIntervalRef.current = setInterval(() => {
      fetchAgents(currentPage, search, statusFilter, sortBy, sortOrder)
    }, 30000)
  }, [currentPage, search, statusFilter, sortBy, sortOrder, fetchAgents])

  // Stop polling
  const stopPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current)
      pollingIntervalRef.current = null
    }
  }, [])

  // Fetch agents on component mount and when filters change
  useEffect(() => {
    fetchAgents(currentPage, search, statusFilter, sortBy, sortOrder)
    startPolling()
    
    // Cleanup polling on unmount
    return () => {
      stopPolling()
    }
  }, [currentPage, search, statusFilter, sortBy, sortOrder, fetchAgents, startPolling, stopPolling])

  // Reset to first page when search or filters change
  useEffect(() => {
    if (search !== '' || statusFilter !== 'all') {
      setCurrentPage(1)
    }
  }, [search, statusFilter])

  const handleTriggerUpdate = useCallback(async (agentId: string) => {
    try {
      // Update UI immediately to show updating status
      setAgents(agents => agents.map(agent => 
        agent.id === agentId 
          ? { ...agent, status: 'updating' } 
          : agent
      ))
      
      const response = await api.put<{ message: string; agentId: string }>(`/agents/${agentId}/trigger-update`)
      
      toast.success(t('agents.success.updateTriggered') || 'Update triggered successfully')
      
      // Show additional info if provided
      if (response.message) {
        toast.info(response.message)
      }
      
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
      const errorMessage = error.message || t('agents.errors.updateFailed') || 'Failed to trigger update'
      toast.error(errorMessage)
      
      // Reset status on error
      setAgents(agents => agents.map(agent => 
        agent.id === agentId 
          ? { ...agent, status: 'error' } 
          : agent
      ))
    }
  }, [t])

  const handleDeleteClick = (agentId: string, agentName: string) => {
    setAgentToDelete({ id: agentId, name: agentName })
    setShowDeleteDialog(true)
  }

  const handleDeleteConfirm = useCallback(async () => {
    if (!agentToDelete) return;
    
    try {
      const response = await api.delete<{ message: string; pcId: string }>(`/agents/${agentToDelete.id}`)
      
      // Remove the agent from the state
      setAgents(agents => agents.filter(agent => agent.id !== agentToDelete.id))
      
      // Show success message
      const successMessage = response.message || t('agents.delete.success', 'Agent deleted successfully')
      toast.success(successMessage)
      
      // If we're on the last page and this was the only item, go to the previous page
      if (agents.length === 1 && currentPage > 1) {
        setCurrentPage(currentPage - 1)
      }
    } catch (error: any) {
      logger.error('Error deleting agent:', error)
      const errorMessage = error.message || t('agents.delete.error', 'Failed to delete agent')
      toast.error(errorMessage)
    } finally {
      setShowDeleteDialog(false)
      setAgentToDelete(null)
    }
  }, [agentToDelete, t, agents.length, currentPage])

  const getStatusBadge = (status: Agent['status']) => {
    const baseClasses = "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
    
    switch (status) {
      case 'online':
        return (
          <span className={`${baseClasses} bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100`}>
            <Circle className="mr-1 h-2 w-2 fill-current" />
            {t('agents.status.online') || 'Online'}
          </span>
        )
      case 'offline':
        return (
          <span className={`${baseClasses} bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100`}>
            <Circle className="mr-1 h-2 w-2 fill-current" />
            {t('agents.status.offline') || 'Offline'}
          </span>
        )
      case 'updating':
        return (
          <span className={`${baseClasses} bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100`}>
            <RefreshCw className="mr-1 h-2 w-2 animate-spin" />
            {t('agents.status.updating') || 'Updating'}
          </span>
        )
      case 'error':
        return (
          <span className={`${baseClasses} bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100`}>
            <AlertCircle className="mr-1 h-2 w-2" />
            {t('agents.status.error') || 'Error'}
          </span>
        )
      default:
        return (
          <span className={`${baseClasses} bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-100`}>
            <Clock className="mr-1 h-2 w-2" />
            {t('agents.status.unknown') || 'Unknown'}
          </span>
        )
    }
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
    
    if (diffInSeconds < 60) {
      return t('common.time.secondsAgo', '{0} seconds ago', diffInSeconds)
    }
    
    const diffInMinutes = Math.floor(diffInSeconds / 60)
    if (diffInMinutes < 60) {
      return t('common.time.minutesAgo', '{0} minutes ago', diffInMinutes)
    }
    
    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours < 24) {
      return t('common.time.hoursAgo', '{0} hours ago', diffInHours)
    }
    
    const diffInDays = Math.floor(diffInHours / 24)
    return t('common.time.daysAgo', '{0} days ago', diffInDays)
  }

  // Reset all filters
  const resetFilters = useCallback(() => {
    setSearch('')
    setSearchInputValue('')
    setStatusFilter('all')
    setSortBy('lastSeen')
    setSortOrder('desc')
    setCurrentPage(1)
  }, [])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+R or F5 to refresh
      if ((e.ctrlKey && e.key === 'r') || e.key === 'F5') {
        e.preventDefault()
        fetchAgents(currentPage, search, statusFilter, sortBy, sortOrder)
      }
      
      // Ctrl+Shift+F to focus search
      if (e.ctrlKey && e.shiftKey && e.key === 'F') {
        e.preventDefault()
        searchInputRef.current?.focus()
      }
      
      // Esc to clear search
      if (e.key === 'Escape' && searchInputRef.current === document.activeElement) {
        resetFilters()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [currentPage, search, statusFilter, sortBy, sortOrder, fetchAgents, resetFilters])

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
                aria-current={page === currentPage ? "page" : undefined}
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

  // Render table rows with skeleton loading
  const renderTableRows = () => {
    if (loading) {
      // Show skeleton rows while loading
      return Array.from({ length: pagination.limit }).map((_, index) => (
        <AgentRowSkeleton key={index} />
      ));
    }
    
    if (agents.length === 0) {
      return null;
    }
    
    return agents.map((agent) => (
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
            <div className="text-xs text-muted-foreground/70">
              {getTimeAgo(agent.lastSeen)}
            </div>
          </div>
        </td>
        <td className="px-4 py-3">
          <div className="text-sm text-muted-foreground">
            {formatDateTime(agent.lastUpdate)}
            <div className="text-xs text-muted-foreground/70">
              {getTimeAgo(agent.lastUpdate)}
            </div>
          </div>
        </td>
        <td className="px-4 py-3">
          <div className="flex items-center">
            {getStatusBadge(agent.status)}
          </div>
        </td>
        <td className="px-4 py-3">
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleTriggerUpdate(agent.id)}
              disabled={agent.status === 'updating'}
              aria-label={t('agents.actions.updateAgent', 'Update agent {0}', agent.name)}
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              <span className="sr-only sm:not-sr-only">{t('agents.actions.update') || 'Update'}</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleDeleteClick(agent.id, agent.name)}
              className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
              aria-label={t('agents.actions.deleteAgent', 'Delete agent {0}', agent.name)}
            >
              <Trash2 className="h-4 w-4" />
              <span className="sr-only sm:not-sr-only">{t('common.delete') || 'Delete'}</span>
            </Button>
          </div>
        </td>
      </tr>
    ));
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
            onClick={() => setShowHelpDialog(true)}
            aria-label={t('common.help', 'Help')}
          >
            <HelpCircle className="h-4 w-4" />
            <span className="sr-only sm:not-sr-only ml-2">{t('common.help', 'Help')}</span>
          </Button>
          <Button 
            ref={refreshButtonRef}
            variant="outline" 
            onClick={() => {
              setSearch('')
              setSearchInputValue('')
              setStatusFilter('all')
              setSortBy('lastSeen')
              setSortOrder('desc')
              setCurrentPage(1)
              fetchAgents(1, '', 'all', 'lastSeen', 'desc')
            }}
            disabled={loading}
            aria-label={t('common.refresh', 'Refresh')}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            <span className="sr-only sm:not-sr-only">{t('common.refresh') || 'Refresh'}</span>
          </Button>
        </div>
      </div>

      {/* Info alert for last updated time */}
      {lastUpdated && (
        <Alert variant="default">
          <Info className="h-4 w-4" />
          <AlertTitle>{t('agents.info.lastUpdated', 'Last updated')}</AlertTitle>
          <AlertDescription>
            {t('agents.info.lastUpdatedDescription', 'Data was last refreshed {0}', getTimeAgo(lastUpdated.toISOString()))}
          </AlertDescription>
        </Alert>
      )}

      {/* Error alert */}
      {error && (
        <Alert variant="destructive" role="alert">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>{t('common.error', 'Error')}</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{t('agents.list.title') || 'Registered Agents'}</CardTitle>
          <CardDescription>
            {t('agents.list.description') || 'View and manage all registered agents'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Search and Filter Controls */}
          <div className="mb-4 space-y-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  ref={searchInputRef}
                  placeholder={t('agents.search.placeholder') || "Search agents by PC name, IP or MAC address..."}
                  value={searchInputValue}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-8"
                  aria-label={t('agents.search.placeholder') || "Search agents by PC name, IP or MAC address..."}
                />
              </div>
              
              <div className="flex gap-2 flex-wrap">
                <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
                  <SelectTrigger className="w-[120px]" aria-label={t('common.filter.status', 'Status filter')}>
                    <SelectValue placeholder={t('common.filter.status', 'Status')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('common.filter.all', 'All')}</SelectItem>
                    <SelectItem value="online">{t('agents.status.online', 'Online')}</SelectItem>
                    <SelectItem value="offline">{t('agents.status.offline', 'Offline')}</SelectItem>
                    <SelectItem value="updating">{t('agents.status.updating', 'Updating')}</SelectItem>
                    <SelectItem value="error">{t('agents.status.error', 'Error')}</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select 
                  value={`${sortBy}:${sortOrder}`} 
                  onValueChange={handleSortChange}
                >
                  <SelectTrigger className="w-[180px]" aria-label={t('common.sort', 'Sort by')}>
                    <SelectValue placeholder={t('common.sort', 'Sort by')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lastSeen:desc">{t('agents.sort.lastSeenDesc', 'Last Seen (Newest first)')}</SelectItem>
                    <SelectItem value="lastSeen:asc">{t('agents.sort.lastSeenAsc', 'Last Seen (Oldest first)')}</SelectItem>
                    <SelectItem value="lastUpdate:desc">{t('agents.sort.lastUpdateDesc', 'Last Update (Newest first)')}</SelectItem>
                    <SelectItem value="lastUpdate:asc">{t('agents.sort.lastUpdateAsc', 'Last Update (Oldest first)')}</SelectItem>
                    <SelectItem value="pcName:asc">{t('agents.sort.pcNameAsc', 'PC Name (A-Z)')}</SelectItem>
                    <SelectItem value="pcName:desc">{t('agents.sort.pcNameDesc', 'PC Name (Z-A)')}</SelectItem>
                    <SelectItem value="ipAddress:asc">{t('agents.sort.ipAddressAsc', 'IP Address (A-Z)')}</SelectItem>
                    <SelectItem value="ipAddress:desc">{t('agents.sort.ipAddressDesc', 'IP Address (Z-A)')}</SelectItem>
                  </SelectContent>
                </Select>
                
                <Button 
                  variant="outline" 
                  onClick={resetFilters}
                  disabled={search === '' && statusFilter === 'all'}
                  aria-label={t('common.filter.reset', 'Reset filters')}
                >
                  <Filter className="h-4 w-4 mr-2" />
                  <span className="sr-only sm:not-sr-only">{t('common.filter.reset', 'Reset')}</span>
                </Button>
              </div>
            </div>
          </div>

          {/* Mobile view - card layout */}
          {isMobileView ? (
            <div>
              {loading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="border rounded-lg p-4 mb-4">
                      <div className="flex justify-between">
                        <Skeleton className="h-5 w-32" />
                        <div className="flex space-x-2">
                          <Skeleton className="h-8 w-8" />
                          <Skeleton className="h-8 w-8" />
                        </div>
                      </div>
                      <div className="mt-3 space-y-2">
                        <div className="flex justify-between">
                          <Skeleton className="h-4 w-20" />
                          <Skeleton className="h-4 w-24" />
                        </div>
                        <div className="flex justify-between">
                          <Skeleton className="h-4 w-20" />
                          <Skeleton className="h-4 w-24" />
                        </div>
                        <div className="flex justify-between">
                          <Skeleton className="h-4 w-20" />
                          <Skeleton className="h-6 w-20 rounded-full" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : agents.length > 0 ? (
                <div>
                  {agents.map(agent => (
                    <AgentCard 
                      key={agent.id} 
                      agent={agent} 
                      onTriggerUpdate={handleTriggerUpdate} 
                      onDeleteAgent={handleDeleteClick} 
                      t={t} 
                    />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Wifi className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">
                    {search || statusFilter !== 'all' ? 
                      (t('agents.search.noResults') || 'No agents found matching your search') : 
                      (t('agents.empty.title') || 'No agents registered')}
                  </h3>
                  <p className="text-muted-foreground">
                    {search || statusFilter !== 'all' ? 
                      (t('agents.search.tryAgain') || 'Try adjusting your search terms') : 
                      (t('agents.empty.description') || 'Add your first agent to start monitoring IT assets')}
                  </p>
                  
                  {(search !== '' || statusFilter !== 'all') && (
                    <Button 
                      variant="outline" 
                      className="mt-4"
                      onClick={resetFilters}
                      aria-label={t('common.filter.clearAll', 'Clear all filters')}
                    >
                      {t('common.filter.clearAll', 'Clear all filters')}
                    </Button>
                  )}
                </div>
              )}
              
              {renderPagination()}
            </div>
          ) : (
            // Desktop view - table layout
            <div>
              <div className="overflow-hidden rounded-md border">
                <table className="w-full" aria-label={t('agents.table.label', 'Agents table')}>
                  <thead className="bg-muted">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground" scope="col">
                        {t('agents.table.agent') || 'Agent'}
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground" scope="col">
                        {t('agents.table.ipAddress') || 'IP Address'}
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground" scope="col">
                        {t('agents.table.pcName') || 'PC Name'}
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground" scope="col">
                        {t('agents.table.lastSeen') || 'Last Seen'}
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground" scope="col">
                        {t('agents.table.lastUpdate') || 'Last Update'}
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground" scope="col">
                        {t('agents.table.status') || 'Status'}
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground" scope="col">
                        {t('agents.table.actions') || 'Actions'}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {renderTableRows()}
                  </tbody>
                </table>
                
                {/* Empty state */}
                {!loading && agents.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Wifi className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">
                      {search || statusFilter !== 'all' ? 
                        (t('agents.search.noResults') || 'No agents found matching your search') : 
                        (t('agents.empty.title') || 'No agents registered')}
                    </h3>
                    <p className="text-muted-foreground">
                      {search || statusFilter !== 'all' ? 
                        (t('agents.search.tryAgain') || 'Try adjusting your search terms') : 
                        (t('agents.empty.description') || 'Add your first agent to start monitoring IT assets')}
                    </p>
                    
                    {(search !== '' || statusFilter !== 'all') && (
                      <Button 
                        variant="outline" 
                        className="mt-4"
                        onClick={resetFilters}
                        aria-label={t('common.filter.clearAll', 'Clear all filters')}
                      >
                        {t('common.filter.clearAll', 'Clear all filters')}
                      </Button>
                    )}
                  </div>
                )}
              </div>
              
              {renderPagination()}
            </div>
          )}
        </CardContent>
      </Card>
      {/* Confirmation Dialog */}
      <ConfirmationDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onConfirm={handleDeleteConfirm}
        title={t('agents.delete.confirmTitle', 'Delete Agent')}
        description={agentToDelete ? t('agents.delete.confirm', 'Are you sure you want to delete agent {0}? This action cannot be undone.', agentToDelete.name) : ''}
        confirmText={t('common.delete', 'Delete')}
        cancelText={t('common.cancel', 'Cancel')}
        confirmVariant="destructive"
      />

      {/* Help Dialog */}
      <HelpDialog open={showHelpDialog} onOpenChange={setShowHelpDialog} t={t} />
    </div>
  )
}