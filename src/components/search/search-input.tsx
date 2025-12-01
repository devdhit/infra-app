'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Search, X, Clock, TrendingUp, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { useSearchContextOptional } from '@/contexts/search-context';

/**
 * SearchInput Component
 * 
 * Features:
 * - Real-time search with debouncing
 * - Search suggestions dropdown
 * - Recent searches
 * - Clear button
 * - Keyboard navigation
 */

export interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  onSearch?: (value: string) => void;
  onClear?: () => void;
  onDeleteHistory?: (query: string) => void;
  placeholder?: string;
  suggestions?: string[];
  disabled?: boolean;
  className?: string;
  showSuggestions?: boolean;
  autoFocus?: boolean;
}

export function SearchInput({
  value,
  onChange,
  onSearch,
  onClear,
  onDeleteHistory,
  placeholder = 'Search...',
  suggestions = [],
  disabled = false,
  className,
  showSuggestions = true,
  autoFocus = false,
}: SearchInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isTyping, setIsTyping] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const searchContext = useSearchContextOptional();

  // Combine suggestions with recent searches (only show when not typing)
  const allSuggestions = React.useMemo(() => {
    // Don't show suggestions while typing
    if (isTyping) {
      return [];
    }
    
    const items: Array<{ text: string; type: 'recent' | 'suggestion' }> = [];
    
    // Add recent searches from context (only complete searches)
    if (searchContext?.recentSearches) {
      items.push(
        ...searchContext.recentSearches
          .filter(s => s.length >= 3) // Only show searches with 3+ chars
          .filter(s => !value || s.toLowerCase().includes(value.toLowerCase()))
          .map(s => ({ text: s, type: 'recent' as const }))
      );
    }
    
    // Add suggestions
    items.push(
      ...suggestions
        .filter(s => !items.some(i => i.text === s))
        .map(s => ({ text: s, type: 'suggestion' as const }))
    );
    
    return items.slice(0, 10); // Limit to 10 items
  }, [suggestions, searchContext?.recentSearches, value, isTyping]);

  /**
   * Handle input change
   */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    setSelectedIndex(-1);
    
    // Set typing state
    setIsTyping(true);
    
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Show suggestions after user stops typing (500ms)
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      if (newValue && showSuggestions) {
        setIsOpen(true);
      }
    }, 500);
    
    // Close suggestions if empty
    if (!newValue) {
      setIsOpen(false);
      setIsTyping(false);
    }
  };

  /**
   * Handle delete history item
   */
  const handleDeleteHistory = useCallback((e: React.MouseEvent, query: string) => {
    e.stopPropagation();
    if (onDeleteHistory) {
      onDeleteHistory(query);
    }
  }, [onDeleteHistory]);

  /**
   * Handle clear button
   */
  const handleClear = () => {
    onChange('');
    setIsOpen(false);
    setSelectedIndex(-1);
    inputRef.current?.focus();
    if (onClear) {
      onClear();
    }
  };

  /**
   * Handle suggestion selection
   */
  const handleSelectSuggestion = (suggestion: string) => {
    onChange(suggestion);
    setIsOpen(false);
    setSelectedIndex(-1);
    if (onSearch) {
      onSearch(suggestion);
    }
  };

  /**
   * Handle keyboard navigation
   */
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || allSuggestions.length === 0) {
      if (e.key === 'Enter' && onSearch) {
        onSearch(value);
        setIsOpen(false);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < allSuggestions.length - 1 ? prev + 1 : prev
        );
        break;
      
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : -1));
        break;
      
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && allSuggestions[selectedIndex]) {
          handleSelectSuggestion(allSuggestions[selectedIndex].text);
        } else if (onSearch) {
          onSearch(value);
          setIsOpen(false);
        }
        break;
      
      case 'Escape':
        setIsOpen(false);
        setSelectedIndex(-1);
        break;
    }
  };

  /**
   * Handle focus
   */
  const handleFocus = () => {
    if (value && showSuggestions && allSuggestions.length > 0) {
      setIsOpen(true);
    }
  };

  /**
   * Clean up timeout on unmount
   */
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  /**
   * Auto focus on mount
   */
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  return (
    <Popover open={isOpen && allSuggestions.length > 0} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <div className={cn('relative flex items-center', className)}>
          <Search className="absolute left-3 h-4 w-4 text-muted-foreground" />
          <Input
            ref={inputRef}
            type="text"
            value={value}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onFocus={handleFocus}
            placeholder={placeholder}
            disabled={disabled}
            className={cn(
              'pl-9',
              value && 'pr-9'
            )}
          />
          {value && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClear}
              disabled={disabled}
              className="absolute right-1 h-7 w-7 p-0"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Clear search</span>
            </Button>
          )}
        </div>
      </PopoverTrigger>
      
      <PopoverContent
        className="w-[var(--radix-popover-trigger-width)] p-0"
        align="start"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <div className="max-h-[300px] overflow-y-auto">
          {allSuggestions.map((item, index) => (
            <div
              key={`${item.type}-${item.text}-${index}`}
              className={cn(
                'flex w-full items-center gap-2 px-4 py-2 text-sm transition-colors group',
                'hover:bg-accent hover:text-accent-foreground',
                selectedIndex === index && 'bg-accent text-accent-foreground'
              )}
            >
              <button
                type="button"
                onClick={() => handleSelectSuggestion(item.text)}
                className="flex flex-1 items-center gap-2 min-w-0"
              >
                {item.type === 'recent' ? (
                  <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                ) : (
                  <TrendingUp className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                )}
                <span className="flex-1 text-left truncate">{item.text}</span>
              </button>
              {item.type === 'recent' && onDeleteHistory && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={(e) => handleDeleteHistory(e, item.text)}
                  className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                >
                  <Trash2 className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                  <span className="sr-only">Delete</span>
                </Button>
              )}
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export default SearchInput;
