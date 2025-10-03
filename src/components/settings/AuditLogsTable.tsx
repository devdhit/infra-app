'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { usePermissions } from '@/hooks/use-permissions';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { 
  Pagination, 
  PaginationContent, 
  PaginationItem, 
  PaginationLink, 
  PaginationNext, 
  PaginationPrevious 
} from '@/components/ui/pagination';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ShieldAlert } from 'lucide-react';
import { RolePermissionDetails } from '@/components/settings/RolePermissionDetails';
import { PermissionChangeDetails } from '@/components/settings/PermissionChangeDetails';

interface AuditLog {
  id: string;
  action: string;
  modelType: string;
  recordId: string;
  changes: any;
  userId: string;
  tenantId: string;
  createdAt: string;
  user?: {
    name: string;
    email: string;
    role?: {
      name: string;
      permissions: Record<string, string[]>;
    };
  };
}

export function AuditLogsTable() {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [pages, setPages] = useState(0);
  const [modelType, setModelType] = useState<string>('');
  const [action, setAction] = useState<string>('');
  const [search, setSearch] = useState<string>('');

  const { canViewAuditLogs } = usePermissions();

  // Check permissions
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  useEffect(() => {
    const checkPermission = async () => {
      const permission = await canViewAuditLogs();
      setHasPermission(permission);
    };
    
    checkPermission();
  }, [canViewAuditLogs]);

  const fetchAuditLogs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', limit.toString());
      
      if (modelType) params.append('modelType', modelType);
      if (action) params.append('action', action);
      if (search) params.append('search', search);
      
      // Fix: Remove the extra /api prefix since the api client already includes it
      const response: any = await api.get(`/settings/audit-logs/logs?${params.toString()}`);
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      setAuditLogs(response.data);
      setPages(response.pagination.pages);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch audit logs');
    } finally {
      setLoading(false);
    }
  }, [page, limit, modelType, action, search]);

  useEffect(() => {
    // Only fetch if we have permission
    if (hasPermission === true) {
      fetchAuditLogs();
    }
  }, [hasPermission, fetchAuditLogs]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pages) {
      setPage(newPage);
    }
  };

  const formatChanges = (changes: any) => {
    if (!changes) return 'No changes';
    
    // Special formatting for role permission changes
    if (typeof changes === 'object' && (changes.permissions || changes.permissionChanges)) {
      return 'Permission changes (see details below)';
    }
    
    if (typeof changes === 'object') {
      return JSON.stringify(changes, null, 2);
    }
    
    return String(changes);
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const getPermissionSummary = (changes: any) => {
    if (!changes || !changes.permissions) return 'No permission changes';
    
    const permissions = changes.permissions;
    const permissionCount = Object.keys(permissions).length;
    
    if (permissionCount === 0) return 'No permissions';
    
    // Get a summary of the permissions
    const resourceList = Object.keys(permissions).slice(0, 3);
    const summary = resourceList.join(', ');
    
    return permissionCount > 3 
      ? `${summary} and ${permissionCount - 3} more resources` 
      : summary;
  };

  // Show loading state
  if (hasPermission === null) {
    return <div>Checking permissions...</div>;
  }

  // Show access denied message
  if (hasPermission === false) {
    return (
      <Alert variant="destructive">
        <ShieldAlert className="h-4 w-4" />
        <AlertTitle>Access Denied</AlertTitle>
        <AlertDescription>
          You don&apos;t have permission to view audit logs.
        </AlertDescription>
      </Alert>
    );
  }

  if (loading) {
    return <div>Loading audit logs...</div>;
  }

  if (error) {
    return <div className="text-red-500">Error: {error}</div>;
  }

  return (
    <div className="space-y-4">
      {/* <Card>
        <CardTitle>Audit Logs</CardTitle>
        <CardDescription>
          View and manage system audit logs. All user actions and system events are recorded here for security and compliance purposes.
        </CardDescription>
      </Card> */}
      <div className="flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-[200px]">
          <label className="text-sm font-medium">Model Type</label>
          <Select value={modelType} onValueChange={setModelType}>
            <SelectTrigger>
              <SelectValue placeholder="All models" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="PC">PC</SelectItem>
              <SelectItem value="Laptop">Laptop</SelectItem>
              <SelectItem value="Printer">Printer</SelectItem>
              <SelectItem value="License">License</SelectItem>
              <SelectItem value="WarehouseIT">Warehouse</SelectItem>
              <SelectItem value="Internet">Internet</SelectItem>
              <SelectItem value="User">User</SelectItem>
              <SelectItem value="Role">Role</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex-1 min-w-[200px]">
          <label className="text-sm font-medium">Action</label>
          <Select value={action} onValueChange={setAction}>
            <SelectTrigger>
              <SelectValue placeholder="All actions" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="create">Create</SelectItem>
              <SelectItem value="update">Update</SelectItem>
              <SelectItem value="delete">Delete</SelectItem>
              <SelectItem value="bulkDelete">Bulk Delete</SelectItem>
              <SelectItem value="import">Import</SelectItem>
              <SelectItem value="export">Export</SelectItem>
              <SelectItem value="login">Login</SelectItem>
              <SelectItem value="logout">Logout</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex-1 min-w-[200px]">
          <label className="text-sm font-medium">Search</label>
          <Input 
            placeholder="Search..." 
            value={search}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
          />
        </div>
        
        <Button onClick={() => fetchAuditLogs()}>Filter</Button>
        <Button 
          variant="outline" 
          onClick={() => {
            setModelType('Role');
            setAction('');
            setSearch('');
          }}
        >
          Show Role Changes
        </Button>
      </div>
      
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date/Time</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Model</TableHead>
              <TableHead>Record ID</TableHead>
              <TableHead>Changes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {auditLogs.map((log) => (
              <TableRow key={log.id}>
                <TableCell>{formatTimestamp(log.createdAt)}</TableCell>
                <TableCell>
                  {log.user ? (
                    <div>
                      <div>{log.user.name}</div>
                      <div className="text-sm text-muted-foreground">{log.user.email}</div>
                    </div>
                  ) : (
                    'System'
                  )}
                </TableCell>
                <TableCell>
                  {log.user?.role ? (
                    <div>
                      <div className="font-medium">{log.user.role.name}</div>
                      {log.action === 'update' && log.modelType === 'Role' && log.changes && (
                        <div className="text-xs text-muted-foreground">
                          {getPermissionSummary(log.changes)}
                        </div>
                      )}
                    </div>
                  ) : (
                    'N/A'
                  )}
                </TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    log.action === 'create' ? 'bg-green-100 text-green-800' :
                    log.action === 'update' ? 'bg-blue-100 text-blue-800' :
                    log.action === 'delete' ? 'bg-red-100 text-red-800' :
                    log.action === 'bulkDelete' ? 'bg-red-100 text-red-800' :
                    log.action === 'import' ? 'bg-purple-100 text-purple-800' :
                    log.action === 'export' ? 'bg-indigo-100 text-indigo-800' :
                    log.action === 'login' ? 'bg-cyan-100 text-cyan-800' :
                    log.action === 'logout' ? 'bg-gray-100 text-gray-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {log.action}
                  </span>
                </TableCell>
                <TableCell>{log.modelType}</TableCell>
                <TableCell>{log.recordId}</TableCell>
                <TableCell>
                  <pre className="text-xs max-w-md overflow-hidden text-ellipsis">
                    {formatChanges(log.changes)}
                  </pre>
                  {log.action === 'update' && log.modelType === 'Role' && log.changes && log.changes.permissions && (
                    <RolePermissionDetails permissions={log.changes.permissions} />
                  )}
                  {log.action === 'update' && log.modelType === 'Role' && log.changes && log.changes.permissionChanges && (
                    <PermissionChangeDetails permissionChanges={log.changes.permissionChanges} />
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      
      {auditLogs.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No audit logs found
        </div>
      )}
      
      {pages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious 
                href="#"
                onClick={(e: React.MouseEvent<HTMLAnchorElement>) => {
                  e.preventDefault();
                  if (page > 1) handlePageChange(page - 1);
                }}
                className={page === 1 ? 'pointer-events-none opacity-50' : ''}
                size="default"
              />
            </PaginationItem>
            
            {Array.from({ length: Math.min(5, pages) }, (_, i) => {
              let pageNum;
              if (pages <= 5) {
                pageNum = i + 1;
              } else if (page <= 3) {
                pageNum = i + 1;
              } else if (page >= pages - 2) {
                pageNum = pages - 4 + i;
              } else {
                pageNum = page - 2 + i;
              }
              
              return (
                <PaginationItem key={pageNum}>
                  <PaginationLink
                    href="#"
                    onClick={(e: React.MouseEvent<HTMLAnchorElement>) => {
                      e.preventDefault();
                      handlePageChange(pageNum);
                    }}
                    isActive={page === pageNum}
                    size="default"
                  >
                    {pageNum}
                  </PaginationLink>
                </PaginationItem>
              );
            })}
            
            <PaginationItem>
              <PaginationNext 
                href="#"
                onClick={(e: React.MouseEvent<HTMLAnchorElement>) => {
                  e.preventDefault();
                  if (page < pages) handlePageChange(page + 1);
                }}
                className={page === pages ? 'pointer-events-none opacity-50' : ''}
                size="default"
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
}