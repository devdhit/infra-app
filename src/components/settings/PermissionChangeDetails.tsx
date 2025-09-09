'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface PermissionChangeDetailsProps {
  permissionChanges: {
    added?: Record<string, string[]>;
    removed?: Record<string, string[]>;
    modified?: Record<string, { added: string[]; removed: string[] }>;
  };
}

export function PermissionChangeDetails({ permissionChanges }: PermissionChangeDetailsProps) {
  if (!permissionChanges) {
    return null;
  }

  const { added = {}, removed = {}, modified = {} } = permissionChanges;

  const hasChanges = 
    Object.keys(added).length > 0 || 
    Object.keys(removed).length > 0 || 
    Object.keys(modified).length > 0;

  if (!hasChanges) {
    return (
      <Card className="mt-2">
        <CardHeader>
          <CardTitle className="text-sm">Permission Changes</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No permission changes detected</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mt-2">
      <CardHeader>
        <CardTitle className="text-sm">Permission Changes</CardTitle>
        <CardDescription>Detailed breakdown of permission modifications</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {Object.keys(added).length > 0 && (
          <div>
            <h4 className="font-medium text-sm mb-2 text-green-700">Added Resources</h4>
            <div className="space-y-2">
              {Object.entries(added).map(([resource, actions]) => (
                <div key={`added-${resource}`} className="border border-green-200 rounded-md p-3 bg-green-50">
                  <h5 className="font-medium text-sm mb-1">{resource}</h5>
                  <div className="flex flex-wrap gap-1">
                    {actions.map((action) => (
                      <span 
                        key={`added-${resource}-${action}`} 
                        className="inline-flex items-center rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800"
                      >
                        {action}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {Object.keys(removed).length > 0 && (
          <div>
            <h4 className="font-medium text-sm mb-2 text-red-700">Removed Resources</h4>
            <div className="space-y-2">
              {Object.entries(removed).map(([resource, actions]) => (
                <div key={`removed-${resource}`} className="border border-red-200 rounded-md p-3 bg-red-50">
                  <h5 className="font-medium text-sm mb-1">{resource}</h5>
                  <div className="flex flex-wrap gap-1">
                    {actions.map((action) => (
                      <span 
                        key={`removed-${resource}-${action}`} 
                        className="inline-flex items-center rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-800"
                      >
                        {action}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {Object.keys(modified).length > 0 && (
          <div>
            <h4 className="font-medium text-sm mb-2 text-blue-700">Modified Resources</h4>
            <div className="space-y-2">
              {Object.entries(modified).map(([resource, changes]) => (
                <div key={`modified-${resource}`} className="border border-blue-200 rounded-md p-3 bg-blue-50">
                  <h5 className="font-medium text-sm mb-1">{resource}</h5>
                  <div className="flex flex-wrap gap-2">
                    {changes.added.length > 0 && (
                      <div>
                        <span className="text-xs text-muted-foreground">Added:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {changes.added.map((action) => (
                            <span 
                              key={`modified-${resource}-added-${action}`} 
                              className="inline-flex items-center rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800"
                            >
                              {action}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {changes.removed.length > 0 && (
                      <div>
                        <span className="text-xs text-muted-foreground">Removed:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {changes.removed.map((action) => (
                            <span 
                              key={`modified-${resource}-removed-${action}`} 
                              className="inline-flex items-center rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-800"
                            >
                              {action}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}