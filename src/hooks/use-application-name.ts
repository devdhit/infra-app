import { useState, useEffect } from 'react';
import { getApplicationSettings } from '@/lib/api/application';

export function useApplicationName() {
  const [applicationName, setApplicationNameState] = useState('');
  const [shortName, setShortName] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Load application name from API
  useEffect(() => {
    const loadApplicationName = async () => {
      try {
        setIsLoading(true);
        const settings = await getApplicationSettings();
        setApplicationNameState(settings.applicationName);
        setShortName(settings.shortName);
      } catch (error) {
        console.error('Failed to load application name:', error);
        // Fallback to default values
        setApplicationNameState('IT Asset Management');
        setShortName('ITAMS');
      } finally {
        setIsLoading(false);
      }
    };

    loadApplicationName();
  }, []);

  return {
    applicationName,
    shortName,
    isLoading,
  };
}
