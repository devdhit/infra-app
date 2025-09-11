# PostgreSQL Full-Text Search and Trigram Index Optimization

## Overview

This document describes the implementation of search optimization in the IT Asset Management System using PostgreSQL's Full-Text Search (FTS) combined with Trigram Indexes. The optimization improves search performance for large datasets while maintaining compatibility with the existing codebase.

## Implementation Details

### 1. Full-Text Search Vector

Each asset table (PC, Laptop, Printer, License, WarehouseIT, Internet) includes a `search_vector` column of type `tsvector`. This column stores pre-computed text search vectors for efficient querying.

### 2. Search Vector Population

Search vectors are automatically maintained using database triggers:

- **Trigger Functions**: Custom PostgreSQL functions extract text from all relevant fields and custom fields, then generate weighted tsvector values
- **Weights**: Fields are assigned weights (A=Highest, B=High, C=Low, D=Lowest) based on their importance:
  - A: Primary identifiers (CPU barcode, PC name, user name, etc.)
  - B: Secondary identifiers (SAP barcodes, model, status, etc.)
  - C: Descriptive fields (notes, location, etc.)
  - D: Custom fields (lowest priority)

### 3. Custom Fields Integration

Custom fields are extracted from the JSON `customFields` column and included in the search vector with weight D:

```sql
-- Extract custom field values from JSON
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

### 4. Index Strategy

Multiple index types are used for optimal performance:

#### GIN Indexes on Search Vectors
```sql
CREATE INDEX "PC_search_vector_idx" ON "PC" USING GIN ("search_vector");
```

#### Trigram Indexes for Similarity Search
```sql
CREATE INDEX "PC_dept_trigram_idx" ON "PC" USING GIN ("dept" gin_trgm_ops);
CREATE INDEX "PC_cpuBarcode_trigram_idx" ON "PC" USING GIN ("cpuBarcode" gin_trgm_ops);
```

### 5. Search Query Optimization

The API uses a hybrid search approach combining full-text search with trigram similarity:

```sql
SELECT *,
       ts_rank("search_vector", websearch_to_tsquery('english', $2)) AS rank
FROM "PC"
WHERE "tenantId" = $1
AND (
  "search_vector" @@ websearch_to_tsquery('english', $2)  -- FTS match
  OR
  "search_vector" @@ plainto_tsquery('english', $2)       -- Simple FTS match
)
ORDER BY rank DESC,
         GREATEST(
           similarity("dept", $2),
           similarity("userName", $2),
           similarity("note", $2)
         ) DESC,
         "createdAt" DESC
LIMIT $3 OFFSET $4
```

## Performance Benefits

1. **Fast Query Execution**: GIN indexes on tsvector columns enable sub-millisecond query times
2. **Relevance Ranking**: Results are ranked by text search relevance and similarity scores
3. **Flexible Search**: Supports both exact term matching and fuzzy matching
4. **Custom Field Search**: Custom fields are fully searchable with proper indexing
5. **Multi-tenant Isolation**: All queries are automatically scoped to tenant data

## Migration Process

The optimization is implemented as a Prisma migration that:

1. Adds `search_vector` columns to all asset tables
2. Creates trigger functions to maintain search vectors
3. Sets up triggers to automatically update search vectors on INSERT/UPDATE
4. Creates GIN indexes on search vectors
5. Creates trigram indexes on key text fields
6. Populates existing records with search vectors

## Usage in Application

The frontend search functionality remains unchanged. When users enter search terms in the asset list pages:

1. Search terms are sent to the API as query parameters
2. API handlers use optimized raw SQL queries with full-text search
3. Results are ranked by relevance and returned to the frontend
4. Pagination and filtering continue to work as expected

## Testing

A benchmark script (`script/benchmark-search.js`) compares performance between:
- Traditional LIKE-based searches
- Optimized full-text search with GIN indexes
- Hybrid search combining FTS and trigram similarity

## Maintenance

- Search vectors are automatically maintained by database triggers
- Indexes are automatically used by the query planner
- No application-level changes are required for ongoing maintenance
- Custom field schema changes may require updating trigger functions