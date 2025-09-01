import { useState, useEffect } from 'react';
import { getApplicationName, setApplicationName as setAppName } from '@/lib/i18n';

export function useApplicationName() {
  const [applicationName, setApplicationNameState] = useState('IT Asset Management');
  const [shortName, setShortName] = useState('ITAMS');

  // Load application name from localStorage
  useEffect(() => {
    const appName = getApplicationName();
    setApplicationNameState(appName);
    setShortName(appName.split(' ').map(word => word.charAt(0)).join('').toUpperCase() || 'ITAMS');
  }, []);

  // Update application name
  const updateApplicationName = (name: string) => {
    setAppName(name);
    setApplicationNameState(name);
    setShortName(name.split(' ').map(word => word.charAt(0)).join('').toUpperCase() || 'ITAMS');
  };

  // Reset to default
  const resetApplicationName = () => {
    const defaultName = 'IT Asset Management';
    setAppName(defaultName);
    setApplicationNameState(defaultName);
    setShortName('ITAMS');
  };

  return {
    applicationName,
    shortName,
    updateApplicationName,
    resetApplicationName
  };
}