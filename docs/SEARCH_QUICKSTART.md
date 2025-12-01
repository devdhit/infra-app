# Enhanced Search Feature - Quick Start Guide

## Overview

The enhanced search feature provides a powerful, multi-layered search architecture with caching, suggestions, filtering, and history tracking.

## File Structure

```
src/
├── lib/
│   └── search/
│       ├── search-cache.ts          # Redis cache management for search
│       └── search-service.ts        # Search service layer with query builders
├── app/
│   └── api/
│       └── search/
│           └── [assetType]/
│               ├── route.ts         # Main search API endpoint
│               ├── suggestions/     # Search suggestions endpoint
│               └── filters/         # Filter options endpoint
├── hooks/
│   └── useEnhancedSearch.ts         # Custom hook for search functionality
├── contexts/
│   └── search-context.tsx           # Global search state management
└── components/
    └── search/
        ├── search-input.tsx         # Search input with suggestions
        ├── search-filters.tsx       # Dynamic filter component
        ├── search-results.tsx       # Results display component
        └── index.ts                 # Barrel export

components/assets/
└── enhanced-asset-search.tsx        # Example integration component
```

## Quick Usage

### 1. Basic Search Component

```typescript
import { SearchInput } from '@/components/search';
import useEnhancedSearch from '@/hooks/useEnhancedSearch';

function MySearchComponent() {
  const {
    query,
    results,
    isLoading,
    updateQuery,
    search,
  } = useEnhancedSearch('pc');

  return (
    <div>
      <SearchInput
        value={query}
        onChange={updateQuery}
        onSearch={search}
        isLoading={isLoading}
      />
      {results && <div>Found {results.total} results</div>}
    </div>
  );
}
```

### 2. With Filters

```typescript
import { SearchInput, SearchFilters } from '@/components/search';
import useEnhancedSearch from '@/hooks/useEnhancedSearch';

function MySearchWithFilters() {
  const {
    query,
    results,
    filterOptions,
    searchOptions,
    updateQuery,
    updateOptions,
  } = useEnhancedSearch('pc');

  return (
    <div>
      <SearchInput value={query} onChange={updateQuery} />
      <SearchFilters
        filters={searchOptions.filters || {}}
        filterOptions={filterOptions}
        onChange={(filters) => updateOptions({ filters })}
      />
    </div>
  );
}
```

### 3. With Context

```typescript
import { useSearchContext } from '@/contexts/search-context';
import useEnhancedSearch from '@/hooks/useEnhancedSearch';

function MySearchWithHistory() {
  const searchContext = useSearchContext();
  
  const { search } = useEnhancedSearch('pc');

  const handleSearch = (query: string) => {
    // Add to history
    searchContext.addToHistory({
      query,
      assetType: 'pc',
      timestamp: Date.now(),
    });
    
    search(query);
  };

  return (
    <div>
      <h3>Recent Searches:</h3>
      <ul>
        {searchContext.recentSearches.map((s, i) => (
          <li key={i} onClick={() => handleSearch(s)}>
            {s}
          </li>
        ))}
      </ul>
    </div>
  );
}
```

## API Endpoints

### Search
```
GET /api/search/[assetType]?q=query&page=1&limit=20&status=active
```

### Suggestions
```
GET /api/search/[assetType]/suggestions?prefix=com
```

### Filters
```
GET /api/search/[assetType]/filters
```

## Features

✅ **Multi-layer caching** (Client + Redis + PostgreSQL)  
✅ **Full-text search** with PostgreSQL tsvector  
✅ **Search suggestions** based on history  
✅ **Advanced filtering** (status, dept, date range, custom)  
✅ **Search history** with localStorage persistence  
✅ **Debounced search** with configurable delay  
✅ **Pagination** support  
✅ **Keyboard navigation** in suggestions  
✅ **Responsive UI** components  
✅ **TypeScript** fully typed  

## Configuration

### Environment Variables
```bash
# Optional: Redis for enhanced caching
REDIS_URL=redis://localhost:6379

# Required: PostgreSQL with search_vector columns
DATABASE_URL=postgresql://...
```

### User Preferences
Users can customize search behavior through the context:

```typescript
const { updatePreferences } = useSearchContext();

updatePreferences({
  defaultPageSize: 20,
  defaultSortOrder: 'desc',
  enableAutoSearch: true,
  debounceMs: 500,
  showSuggestions: true,
});
```

## Testing

Run the test script:
```bash
npx ts-node scripts/test-enhanced-search.ts
```

## Supported Asset Types

- `pc` - Desktop computers
- `laptop` - Laptops
- `printer` - Printers
- `license` - Software licenses
- `warehouse` - Warehouse items
- `internet` - Internet access
- `fixedasset` - Fixed assets

## Performance Tips

1. **Enable Redis** for best performance
2. **Use debouncing** to reduce API calls
3. **Limit page size** to 20-50 for optimal loading
4. **Use filters** to narrow results before searching
5. **Enable client-side caching** in the hook

## Migration from Old Search

1. Replace `useAssets` with `useEnhancedSearch`
2. Update search input to use `<SearchInput />`
3. Add `<SearchFilters />` for filtering
4. Wrap app in `<SearchContextProvider>`

## Documentation

- Full Architecture: [docs/ENHANCED_SEARCH_ARCHITECTURE.md](../docs/ENHANCED_SEARCH_ARCHITECTURE.md)
- Search Optimization: [docs/search-optimization.md](../docs/search-optimization.md)

## Support

For issues or questions, see the troubleshooting section in the full documentation.
