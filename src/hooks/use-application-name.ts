import { useState, useEffect } from 'react';
import { getApplicationName, setApplicationName as setAppName } from '@/lib/i18n';

export function useApplicationName() {
  const [applicationName, setApplicationNameState] = useState('');
  const [shortName, setShortName] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Load application name from localStorage
  useEffect(() => {
    const appName = getApplicationName();
    setApplicationNameState(appName);
    setShortName(appName.split(' ').map(word => word.charAt(0)).join('').toUpperCase() || 'ITAMS');
    setIsLoading(false);
  }, []);

  // Update application name
  const updateApplicationName = (name: string) => {
    if (!name.trim()) {
      // If name is empty, reset to default
      resetApplicationName();
      return;
    }
    
    setAppName(name);
    setApplicationNameState(name);
    setShortName(name.split(' ').map(word => word.charAt(0)).join('').toUpperCase() || 'ITAMS');
  };

  // Reset to default
  const resetApplicationName = () => {
    const defaultName = getApplicationName(); // This will return the default value
    setAppName(defaultName);
    setApplicationNameState(defaultName);
    setShortName(defaultName.split(' ').map(word => word.charAt(0)).join('').toUpperCase() || 'ITAMS');
  };

  return {
    applicationName,
    shortName,
    isLoading,
    updateApplicationName,
    resetApplicationName
  };
}