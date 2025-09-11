# Search Optimization Implementation

This document describes the implementation of PostgreSQL Full-Text Search with Trigram Index for the IT Asset Management system.

## Overview

We've implemented a comprehensive search optimization solution that includes:

1. PostgreSQL Full-Text Search with tsvector columns
2. GIN indexes for performance
3. Custom field integration in search vectors
4. Weighted search vectors for relevance ranking
5. Frontend optimizations for better user experience

## Database Implementation

### Search Vector Columns

Each asset table (PC, Laptop, Printer, License, WarehouseIT, Internet) now has a `search_vector` column of type `tsvector`.

### Trigger Functions

Each table has an associated trigger function that automatically populates the `search_vector` column when records are inserted or updated. The trigger functions:

1. Extract text from all relevant fields
2. Extract custom field values using the `extract_custom_field_values` function
3. Apply weights to different fields (A=Highest, B=High, C=Low, D=Lowest for custom fields)
4. Combine all weighted vectors into a single search vector

### Custom Field Integration

Custom fields are extracted from the JSON `customFields` column using the `extract_custom_field_values` function:

```sql
CREATE OR REPLACE FUNCTION extract_custom_field_values(custom_fields jsonb) RETURNS text AS $$
DECLARE
  custom_field_values TEXT := '';
BEGIN
  IF custom_fields IS NOT NULL THEN
    SELECT string_agg(value::TEXT, ' ') INTO custom_field_values
    FROM jsonb_each_text(custom_fields);
  END IF;
  RETURN coalesce(custom_field_values, '');
END;
$$ LANGUAGE plpgsql IMMUTABLE;
```

### GIN Indexes

Each table has a GIN index on the `search_vector` column for fast searching:

```sql
CREATE INDEX "PC_search_vector_idx" ON "PC" USING GIN ("search_vector");
```

## Backend Implementation

### API Handler

The `AssetApiHandler` class in `src/lib/asset-api-handler.ts` handles search queries using raw SQL for optimal performance:

1. Uses `websearch_to_tsquery` for natural language search
2. Falls back to `plainto_tsquery` for exact phrase matching
3. Calculates relevance ranking with `ts_rank`
4. Orders results by relevance and creation date

### Search Query Structure

```sql
SELECT *, ts_rank("search_vector", websearch_to_tsquery('english', $2)) AS rank
FROM "PC"
WHERE "tenantId" = $1
AND (
  "search_vector" @@ websearch_to_tsquery('english', $2)
  OR
  "search_vector" @@ plainto_tsquery('english', $2)
)
ORDER BY rank DESC, "createdAt" DESC
LIMIT $3 OFFSET $4
```

## Frontend Implementation

### Debounce Optimization

The search input in `src/components/assets/asset-list.tsx` uses an optimized debounce implementation:

1. Reduced debounce time from 300ms to 150ms for better responsiveness
2. Immediate search for very short terms (1 character or less)
3. Debounced search for longer terms to reduce API calls

### React Query Configuration

Optimized React Query settings in `useAssets` hook:

1. Disabled caching during search/filtering
2. Disabled automatic refetching on window focus/reconnect
3. Disabled retry mechanism to prevent delays
4. Proper cache management for better performance

## Performance Testing

### Verification Scripts

Two scripts are included to verify the implementation:

1. `script/verify-custom-field-search.js` - Verifies database setup
2. `script/measure-search-performance.js` - Provides guidance for performance testing

### Expected Performance

- Search queries should execute in under 100ms for datasets under 10,000 records
- Custom fields are fully searchable
- Typing delays should be minimal with the optimized debounce settings

## Troubleshooting

### If Search is Still Slow

1. Verify the database migration was applied correctly
2. Check that GIN indexes exist on all tables
3. Confirm trigger functions are working properly
4. Monitor network tab in browser developer tools for API response times

### If Custom Fields Aren't Searchable

1. Verify the `extract_custom_field_values` function exists
2. Check that trigger functions include custom field extraction
3. Confirm that assets have been updated since the migration (triggers populate search vectors)

## Testing Custom Field Search

To test that custom fields are searchable:

1. Create an asset with custom fields containing unique values
2. Search for those unique values in the application UI
3. The asset should appear in search results

Example:
1. Create a PC asset with a custom field "AssetTag" = "UNIQUE-TAG-123"
2. Search for "UNIQUE-TAG-123" in the PC assets search
3. The asset should appear in the results