'use client';

import { useState, useEffect } from 'react';
import { usePermissions } from '@/hooks/use-permissions';
import { AuditLogsTable } from '@/components/settings/AuditLogsTable';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ShieldAlert } from 'lucide-react';

export default function AuditLogsPage() {
  const { canViewAuditLogs } = usePermissions();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  useEffect(() => {
    const checkPermission = async () => {
      const permission = await canViewAuditLogs();
      setHasPermission(permission);
    };
    
    checkPermission();
  }, [canViewAuditLogs]);

  // Show loading state
  if (hasPermission === null) {
    return <div className="space-y-6">Checking permissions...</div>;
  }

  // Show access denied message
  if (!hasPermission) {
    return (
      <div className="space-y-6">
        <Alert variant="destructive">
          <ShieldAlert className="h-4 w-4" />
          <AlertTitle>Access Denied</AlertTitle>
          <AlertDescription>
            You don&apos;t have permission to view audit logs.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Audit Logs</h1>
        <p className="text-muted-foreground">
          View system activity and changes made by users
        </p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Audit Logs</CardTitle>
          <CardDescription>
            View and manage system audit logs. All user actions and system events are recorded here for security and compliance purposes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AuditLogsTable />
        </CardContent>
      </Card>
    </div>
  );
}