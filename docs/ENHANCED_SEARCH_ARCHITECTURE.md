# Enhanced Search Architecture

This document describes the redesigned search feature architecture for the IT Asset Management System.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│ Client Layer                                                         │
├─────────────────────────────────────────────────────────────────────┤
│ ┌─────────────────┐ ┌──────────────────┐ ┌────────────────────┐   │
│ │ SearchInput     │ │ SearchResults    │ │ SearchFilters      │   │
│ │ Component       │ │ Component        │ │ Component          │   │
│ └─────────────────┘ └──────────────────┘ └────────────────────┘   │
│         │                   │                        │              │
│         ▼                   ▼                        ▼              │
│ ┌──────────────────────────────────────────────────────────────┐   │
│ │ SearchContextProvider                                        │   │
│ │ (Manages search state, history, and preferences)            │   │
│ └──────────────────────────────────────────────────────────────┘   │
│         │                                                            │
│         ▼                                                            │
│ ┌──────────────────────────────────────────────────────────────┐   │
│ │ useEnhancedSearch Hook                                       │   │
│ │ (Handles API calls, caching, debouncing, and search logic)  │   │
│ └──────────────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────────────┤
│ Service Layer                                                        │
├─────────────────────────────────────────────────────────────────────┤
│ ┌──────────────────────────────────────────────────────────────┐   │
│ │ Search Service Functions                                     │   │
│ │ (Search utilities, query builders, result processors)       │   │
│ └──────────────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────────────┤
│ API Layer                                                            │
├─────────────────────────────────────────────────────────────────────┤
│ ┌──────────────────────────────────────────────────────────────┐   │
│ │ Enhanced Search API                                           │   │
│ │ (New search endpoint with advanced features)                 │   │
│ └──────────────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────────────┤
│ Database & Cache Layer                                              │
├─────────────────────────────────────────────────────────────────────┤
│ ┌─────────────┐ ┌──────────────┐ ┌──────────────────────────┐     │
│ │ PostgreSQL  │ │ Redis        │ │ Search Indexes           │     │
│ │ DB          │ │ Cache        │ │ (Enhanced FTS)           │     │
│ └─────────────┘ └──────────────┘ └──────────────────────────┘     │
└─────────────────────────────────────────────────────────────────────┘
```

## Components

### 1. Database & Cache Layer

#### Search Cache Manager (`src/lib/search/search-cache.ts`)
- Specialized caching for search operations
- Stores search results, suggestions, and user history
- TTL-based cache expiration
- Automatic cache invalidation

**Features:**
- Search result caching (1 minute TTL)
- Search suggestions with usage tracking
- Per-user search history (24 hour TTL)
- Cache cleanup and optimization

#### PostgreSQL Full-Text Search
- Uses existing `search_vector` tsvector columns
- GIN indexes for fast searching
- Weighted field importance (A, B, C, D)
- Custom field integration

### 2. Service Layer

#### Search Service (`src/lib/search/search-service.ts`)
- Query builder for complex searches
- Result processing and ranking
- Filter option generation
- Search suggestion management

**Key Functions:**
- `executeEnhancedSearch()` - Main search execution with caching
- `buildSearchQuery()` - SQL query construction
- `getSearchSuggestions()` - Get suggestions based on history
- `getFilterOptions()` - Dynamic filter options per asset type

### 3. API Layer

#### Enhanced Search API (`src/app/api/search/[assetType]/route.ts`)
Main search endpoint supporting:
- Full-text search with PostgreSQL tsvector
- Pagination (page, limit)
- Sorting (sortBy, sortOrder)
- Advanced filtering (status, dept, dateFrom, dateTo, custom filters)
- Result caching with Redis

**Endpoint:**
```
GET /api/search/[assetType]?q=query&page=1&limit=20&status=active
```

**Response:**
```json
{
  "success": true,
  "data": [...],
  "total": 150,
  "page": 1,
  "limit": 20,
  "totalPages": 8,
  "hasMore": true,
  "query": "search term",
  "assetType": "pc"
}
```

#### Suggestions API (`src/app/api/search/[assetType]/suggestions/route.ts`)
Returns search suggestions based on:
- User search history
- Popular searches
- Prefix matching

**Endpoint:**
```
GET /api/search/[assetType]/suggestions?prefix=com
```

#### Filters API (`src/app/api/search/[assetType]/filters/route.ts`)
Returns available filter options for an asset type

**Endpoint:**
```
GET /api/search/[assetType]/filters
```

### 4. Client Layer

#### useEnhancedSearch Hook (`src/hooks/useEnhancedSearch.ts`)
Custom React hook providing:
- Debounced search (configurable delay)
- Client-side result caching
- Loading and error states
- Search suggestions
- Filter options
- Pagination support

**Usage:**
```typescript
const {
  query,
  results,
  isLoading,
  error,
  suggestions,
  filterOptions,
  updateQuery,
  updateOptions,
  search,
  clearSearch,
  fetchSuggestions,
} = useEnhancedSearch('pc', {
  debounceMs: 500,
  enableCache: true,
  autoSearch: true,
});
```

#### SearchContextProvider (`src/contexts/search-context.tsx`)
Global state management for:
- User preferences (page size, sort order, auto-search)
- Search history across sessions
- Saved filters per asset type
- Recent searches

**Features:**
- localStorage persistence
- Per-asset-type filter saving
- Search history with timestamps
- Configurable preferences

#### Search Components

##### SearchInput (`src/components/search/search-input.tsx`)
- Real-time search with debouncing
- Dropdown suggestions
- Recent searches display
- Keyboard navigation (Arrow keys, Enter, Escape)
- Clear button

##### SearchFilters (`src/components/search/search-filters.tsx`)
- Dynamic filter UI based on asset type
- Status, department, date range filters
- Active filters display with badges
- Clear all functionality

##### SearchResults (`src/components/search/search-results.tsx`)
- Customizable result renderer
- Loading state
- Empty state
- Error state
- Result count display

## Usage Example

### Basic Integration

```typescript
import { SearchInput, SearchFilters } from '@/components/search';
import useEnhancedSearch from '@/hooks/useEnhancedSearch';
import { useSearchContext } from '@/contexts/search-context';

function AssetSearchPage() {
  const searchContext = useSearchContext();
  
  const {
    query,
    results,
    isLoading,
    suggestions,
    filterOptions,
    searchOptions,
    updateQuery,
    updateOptions,
    search,
  } = useEnhancedSearch('pc', {
    autoSearch: searchContext.preferences.enableAutoSearch,
  });

  return (
    <div>
      <SearchInput
        value={query}
        onChange={updateQuery}
        onSearch={search}
        suggestions={suggestions}
        isLoading={isLoading}
      />
      
      <SearchFilters
        filters={searchOptions.filters || {}}
        filterOptions={filterOptions}
        onChange={(filters) => updateOptions({ filters })}
      />
      
      {results && (
        <div>
          Found {results.total} results
          {/* Render results */}
        </div>
      )}
    </div>
  );
}
```

### Advanced Usage with Context

```typescript
function EnhancedAssetList({ assetType }: { assetType: string }) {
  const searchContext = useSearchContext();
  
  // Set active asset type
  useEffect(() => {
    searchContext.setActiveAssetType(assetType);
  }, [assetType]);

  // Load saved filters
  useEffect(() => {
    const savedFilters = searchContext.getSavedFilters(assetType);
    if (savedFilters) {
      updateOptions({ filters: savedFilters });
    }
  }, [assetType]);

  // Add to history on search
  const handleSearch = (query: string) => {
    searchContext.addToHistory({
      query,
      assetType,
      timestamp: Date.now(),
      filters: searchOptions.filters,
    });
    search(query);
  };

  // Save filters on change
  const handleFilterChange = (filters: any) => {
    searchContext.setSavedFilters(assetType, filters);
    updateOptions({ filters });
  };

  // ... rest of component
}
```

## Performance Optimizations

### 1. Multi-Level Caching
- **Client-side**: In-memory cache for recent searches (60s TTL)
- **Redis**: Shared cache for all users (60s TTL)
- **PostgreSQL**: GIN indexes on tsvector columns

### 2. Debouncing
- Configurable debounce delay (default 500ms)
- Prevents excessive API calls during typing
- Immediate search on Enter key

### 3. Request Cancellation
- AbortController for canceling in-flight requests
- Prevents race conditions
- Reduces unnecessary processing

### 4. Lazy Loading
- Pagination support
- Only load visible results
- Progressive result loading

## Configuration

### Environment Variables
```bash
# Redis cache (optional but recommended)
REDIS_URL=redis://localhost:6379

# PostgreSQL connection
DATABASE_URL=postgresql://...
```

### Search Preferences (Client-side)
```typescript
// Stored in localStorage: 'search:preferences'
{
  defaultPageSize: 20,
  defaultSortBy: 'updatedAt',
  defaultSortOrder: 'desc',
  enableAutoSearch: true,
  debounceMs: 500,
  showSuggestions: true,
}
```

## Supported Asset Types

- `pc` - Desktop computers
- `laptop` - Laptop computers
- `printer` - Printers
- `license` - Software licenses
- `warehouse` - Warehouse IT items
- `internet` - Internet access records
- `fixedasset` - Fixed assets

## API Reference

### Search Endpoint

**GET** `/api/search/[assetType]`

**Query Parameters:**
- `q` (required): Search query
- `page` (optional): Page number (default: 1)
- `limit` (optional): Results per page (default: 20, max: 100)
- `sortBy` (optional): Sort field
- `sortOrder` (optional): 'asc' or 'desc'
- `status` (optional): Filter by status
- `dept` (optional): Filter by department
- `dateFrom` (optional): Filter by creation date (ISO format)
- `dateTo` (optional): Filter by creation date (ISO format)
- `filters` (optional): JSON string of additional filters

### Suggestions Endpoint

**GET** `/api/search/[assetType]/suggestions`

**Query Parameters:**
- `prefix` (optional): Prefix to filter suggestions

### Filters Endpoint

**GET** `/api/search/[assetType]/filters`

No query parameters required.

## Testing

### Unit Tests
```bash
npm test -- search
```

### Integration Tests
```bash
npm test -- search.integration
```

### Manual Testing
1. Navigate to any asset page
2. Enter a search query
3. Verify results appear
4. Test filters
5. Check search history
6. Verify suggestions

## Migration Guide

### From Old Search to Enhanced Search

1. **Update imports:**
```typescript
// Old
import { useAssets } from '@/hooks/useApi';

// New
import useEnhancedSearch from '@/hooks/useEnhancedSearch';
```

2. **Replace search logic:**
```typescript
// Old
const { data, isLoading } = useAssets(assetType, page, limit, search);

// New
const { results, isLoading, search: executeSearch } = useEnhancedSearch(assetType);
```

3. **Update UI components:**
- Replace standard input with `<SearchInput />`
- Add `<SearchFilters />` component
- Use `<SearchResults />` for result display

## Troubleshooting

### Search not working
1. Check Redis connection
2. Verify PostgreSQL search_vector columns exist
3. Check network requests in browser DevTools

### Slow search performance
1. Verify GIN indexes are created
2. Check Redis cache hit rate
3. Review PostgreSQL query execution plan

### Suggestions not appearing
1. Check search history in localStorage
2. Verify Redis connection
3. Check API endpoint responses

## Future Enhancements

1. **Fuzzy Search**: Implement fuzzy matching for typos
2. **Autocomplete**: Real-time autocomplete as you type
3. **Search Analytics**: Track popular searches and trends
4. **Advanced Filters**: More filter types (ranges, multi-select)
5. **Saved Searches**: Save and name common searches
6. **Export Results**: Export search results to Excel/CSV
7. **Search Operators**: Support for AND, OR, NOT operators
8. **Faceted Search**: Show result counts per filter option

## References

- PostgreSQL Full-Text Search: https://www.postgresql.org/docs/current/textsearch.html
- Redis Caching: https://redis.io/docs/
- React Query Patterns: https://tkdodo.eu/blog/practical-react-query
