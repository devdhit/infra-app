'use client'

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { performanceMonitor } from '@/lib/performance-monitoring';

export function PerformanceMonitor() {
  const [metrics, setMetrics] = useState<Record<string, { count: number; average: number; min: number; max: number }>>({});
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      const currentMetrics = performanceMonitor.getMetrics();
      setMetrics(currentMetrics);
    }, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, []);

  const clearMetrics = () => {
    performanceMonitor.clearMetrics();
    setMetrics({});
  };

  if (!isVisible) {
    return (
      <Button 
        variant="outline" 
        size="sm" 
        className="fixed bottom-4 right-4 z-50"
        onClick={() => setIsVisible(true)}
      >
        Show Performance
      </Button>
    );
  }

  return (
    <Card className="fixed bottom-4 right-4 z-50 w-80 max-h-96 overflow-auto">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Performance Metrics</CardTitle>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={clearMetrics}>
            Clear
          </Button>
          <Button variant="outline" size="sm" onClick={() => setIsVisible(false)}>
            Hide
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {Object.keys(metrics).length === 0 ? (
          <p className="text-sm text-muted-foreground">No performance data yet</p>
        ) : (
          <div className="space-y-3">
            {Object.entries(metrics).map(([operation, data]) => (
              <div key={operation} className="text-sm">
                <div className="font-medium">{operation}</div>
                <div className="text-muted-foreground">
                  Count: {data.count} | Avg: {data.average.toFixed(2)}ms | Min: {data.min.toFixed(2)}ms | Max: {data.max.toFixed(2)}ms
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}