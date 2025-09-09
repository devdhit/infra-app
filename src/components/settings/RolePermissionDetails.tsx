'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface PermissionDetailsProps {
  permissions: Record<string, string[]> | undefined;
  title?: string;
}

export function RolePermissionDetails({ permissions, title = 'Role Permissions' }: PermissionDetailsProps) {
  if (!permissions) {
    return (
      <Card className="mt-2">
        <CardHeader>
          <CardTitle className="text-sm">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No permissions assigned</p>
        </CardContent>
      </Card>
    );
  }

  const permissionEntries = Object.entries(permissions);
  
  if (permissionEntries.length === 0) {
    return (
      <Card className="mt-2">
        <CardHeader>
          <CardTitle className="text-sm">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No permissions assigned</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mt-2">
      <CardHeader>
        <CardTitle className="text-sm">{title}</CardTitle>
        <CardDescription>
          {permissionEntries.length} resource{permissionEntries.length !== 1 ? 's' : ''} with permissions
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {permissionEntries.map(([resource, actions]) => (
            <div key={resource} className="border rounded-md p-3">
              <h4 className="font-medium text-sm mb-2">{resource}</h4>
              <div className="flex flex-wrap gap-1">
                {actions.map((action) => (
                  <span 
                    key={action} 
                    className="inline-flex items-center rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800"
                  >
                    {action}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}