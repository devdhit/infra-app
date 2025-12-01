'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { SearchFilters } from '@/hooks/useEnhancedSearch';

/**
 * Search Context Provider
 * 
 * Manages global search state, history, and preferences
 */

export interface SearchPreferences {
  defaultPageSize: number;
  defaultSortBy: string;
  defaultSortOrder: 'asc' | 'desc';
  enableAutoSearch: boolean;
  debounceMs: number;
  showSuggestions: boolean;
}

export interface SearchHistoryItem {
  query: string;
  assetType: string;
  timestamp: number;
  filters?: SearchFilters;
}

interface SearchContextValue {
  // Preferences
  preferences: SearchPreferences;
  updatePreferences: (prefs: Partial<SearchPreferences>) => void;
  
  // History
  history: SearchHistoryItem[];
  addToHistory: (item: SearchHistoryItem) => void;
  clearHistory: () => void;
  removeFromHistory: (index: number) => void;
  removeSearchFromHistory: (query: string) => void; // Remove by query text
  
  // Recent searches
  recentSearches: string[];
  
  // Active search state
  activeAssetType: string | null;
  setActiveAssetType: (type: string | null) => void;
  
  // Saved filters per asset type
  savedFilters: Record<string, SearchFilters>;
  setSavedFilters: (assetType: string, filters: SearchFilters) => void;
  getSavedFilters: (assetType: string) => SearchFilters | undefined;
}

const SearchContext = createContext<SearchContextValue | undefined>(undefined);

const DEFAULT_PREFERENCES: SearchPreferences = {
  defaultPageSize: 20,
  defaultSortBy: 'updatedAt',
  defaultSortOrder: 'desc',
  enableAutoSearch: true,
  debounceMs: 500,
  showSuggestions: true,
};

const STORAGE_KEYS = {
  PREFERENCES: 'search:preferences',
  HISTORY: 'search:history',
  SAVED_FILTERS: 'search:savedFilters',
};

const MAX_HISTORY_ITEMS = 50;
const MAX_RECENT_SEARCHES = 10;

/**
 * Search Context Provider Component
 */
export function SearchContextProvider({ children }: { children: React.ReactNode }) {
  const [preferences, setPreferences] = useState<SearchPreferences>(DEFAULT_PREFERENCES);
  const [history, setHistory] = useState<SearchHistoryItem[]>([]);
  const [activeAssetType, setActiveAssetType] = useState<string | null>(null);
  const [savedFilters, setSavedFiltersState] = useState<Record<string, SearchFilters>>({});

  /**
   * Load state from localStorage on mount
   */
  useEffect(() => {
    try {
      // Load preferences
      const storedPrefs = localStorage.getItem(STORAGE_KEYS.PREFERENCES);
      if (storedPrefs) {
        setPreferences({ ...DEFAULT_PREFERENCES, ...JSON.parse(storedPrefs) });
      }

      // Load history
      const storedHistory = localStorage.getItem(STORAGE_KEYS.HISTORY);
      if (storedHistory) {
        setHistory(JSON.parse(storedHistory));
      }

      // Load saved filters
      const storedFilters = localStorage.getItem(STORAGE_KEYS.SAVED_FILTERS);
      if (storedFilters) {
        setSavedFiltersState(JSON.parse(storedFilters));
      }
    } catch (error) {
      console.error('Error loading search context from localStorage:', error);
    }
  }, []);

  /**
   * Update preferences and persist to localStorage
   */
  const updatePreferences = useCallback((prefs: Partial<SearchPreferences>) => {
    setPreferences(current => {
      const updated = { ...current, ...prefs };
      try {
        localStorage.setItem(STORAGE_KEYS.PREFERENCES, JSON.stringify(updated));
      } catch (error) {
        console.error('Error saving preferences:', error);
      }
      return updated;
    });
  }, []);

  /**
   * Add item to search history (only complete searches with 3+ chars)
   */
  const addToHistory = useCallback((item: SearchHistoryItem) => {
    // Only save complete searches (3+ characters)
    if (!item.query || item.query.trim().length < 3) {
      return;
    }
    
    setHistory(current => {
      // Remove duplicates based on query and asset type
      const filtered = current.filter(
        h => !(h.query === item.query && h.assetType === item.assetType)
      );
      
      // Add new item at the beginning
      const updated = [{ ...item, query: item.query.trim() }, ...filtered].slice(0, MAX_HISTORY_ITEMS);
      
      try {
        localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(updated));
      } catch (error) {
        console.error('Error saving history:', error);
      }
      
      return updated;
    });
  }, []);

  /**
   * Clear search history
   */
  const clearHistory = useCallback(() => {
    setHistory([]);
    try {
      localStorage.removeItem(STORAGE_KEYS.HISTORY);
    } catch (error) {
      console.error('Error clearing history:', error);
    }
  }, []);

  /**
   * Remove specific item from history
   */
  const removeFromHistory = useCallback((index: number) => {
    setHistory(current => {
      const updated = [...current];
      updated.splice(index, 1);
      
      try {
        localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(updated));
      } catch (error) {
        console.error('Error saving history:', error);
      }
      
      return updated;
    });
  }, []);

  /**
   * Remove specific item from history by query text
   */
  const removeSearchFromHistory = useCallback((query: string) => {
    setHistory(current => {
      const updated = current.filter(h => h.query !== query);
      
      try {
        localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(updated));
      } catch (error) {
        console.error('Error saving history:', error);
      }
      
      return updated;
    });
  }, []);

  /**
   * Get recent unique search queries (only complete searches 3+ chars)
   */
  const recentSearches = React.useMemo(() => {
    const queries = history
      .filter(h => !activeAssetType || h.assetType === activeAssetType)
      .map(h => h.query);
    
    // Remove duplicates and limit
    return Array.from(new Set(queries)).slice(0, MAX_RECENT_SEARCHES);
  }, [history, activeAssetType]);

  /**
   * Save filters for an asset type
   */
  const setSavedFilters = useCallback((assetType: string, filters: SearchFilters) => {
    setSavedFiltersState(current => {
      const updated = { ...current, [assetType]: filters };
      
      try {
        localStorage.setItem(STORAGE_KEYS.SAVED_FILTERS, JSON.stringify(updated));
      } catch (error) {
        console.error('Error saving filters:', error);
      }
      
      return updated;
    });
  }, []);

  /**
   * Get saved filters for an asset type
   */
  const getSavedFilters = useCallback((assetType: string): SearchFilters | undefined => {
    return savedFilters[assetType];
  }, [savedFilters]);

  const value: SearchContextValue = {
    preferences,
    updatePreferences,
    history,
    addToHistory,
    clearHistory,
    removeFromHistory,
    removeSearchFromHistory,
    recentSearches,
    activeAssetType,
    setActiveAssetType,
    savedFilters,
    setSavedFilters,
    getSavedFilters,
  };

  return (
    <SearchContext.Provider value={value}>
      {children}
    </SearchContext.Provider>
  );
}

/**
 * Hook to use search context
 */
export function useSearchContext() {
  const context = useContext(SearchContext);
  if (context === undefined) {
    throw new Error('useSearchContext must be used within a SearchContextProvider');
  }
  return context;
}

/**
 * Hook to use search context with optional fallback
 */
export function useSearchContextOptional() {
  return useContext(SearchContext);
}

export default SearchContext;
