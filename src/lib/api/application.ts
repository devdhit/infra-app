import { api } from '@/lib/api';

export interface ApplicationSettings {
  applicationName: string;
  shortName: string;
}

export interface UpdateApplicationSettings {
  applicationName: string;
}

// Get application settings
export async function getApplicationSettings(): Promise<ApplicationSettings> {
  const response = await api.get<ApplicationSettings>('/application');
  return response;
}

// Update application settings
export async function updateApplicationSettings(data: UpdateApplicationSettings): Promise<ApplicationSettings> {
  const response = await api.post<ApplicationSettings>('/application', data);
  return response;
}

// Reset application settings to default
export async function resetApplicationSettings(): Promise<ApplicationSettings> {
  const response = await api.post<ApplicationSettings>('/application', {
    applicationName: 'IT Asset Management'
  });
  return response;
}