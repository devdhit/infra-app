-- Add search_vector trigger for ITPurchasing table

-- Create optimized trigger function for ITPurchasing table
CREATE OR REPLACE FUNCTION update_itpurchasing_search_vector() RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := 
    setweight(to_tsvector('english', coalesce(NEW."bpmName", '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW."bpmContent", '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW."bpmId", '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW."deptCode", '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW."statusBPM", '')), 'B') ||
    setweight(to_tsvector('english', coalesce(NEW."prId", '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW."statusPR", '')), 'B') ||
    setweight(to_tsvector('english', coalesce(NEW."statusReceive", '')), 'B') ||
    setweight(to_tsvector('english', coalesce(NEW."noted", '')), 'C') ||
    setweight(to_tsvector('english', extract_custom_field_values(NEW."customFields"::jsonb)), 'D');
  RETURN NEW;
END
$$ LANGUAGE plpgsql;

-- Create trigger for ITPurchasing table
DROP TRIGGER IF EXISTS itpurchasing_search_vector_trigger ON "ITPurchasing";
CREATE TRIGGER itpurchasing_search_vector_trigger
  BEFORE INSERT OR UPDATE ON "ITPurchasing"
  FOR EACH ROW EXECUTE FUNCTION update_itpurchasing_search_vector();

-- Populate existing records with search vectors
UPDATE "ITPurchasing" SET "search_vector" = 
  setweight(to_tsvector('english', coalesce("bpmName", '')), 'A') ||
  setweight(to_tsvector('english', coalesce("bpmContent", '')), 'A') ||
  setweight(to_tsvector('english', coalesce("bpmId", '')), 'A') ||
  setweight(to_tsvector('english', coalesce("deptCode", '')), 'A') ||
  setweight(to_tsvector('english', coalesce("statusBPM", '')), 'B') ||
  setweight(to_tsvector('english', coalesce("prId", '')), 'A') ||
  setweight(to_tsvector('english', coalesce("statusPR", '')), 'B') ||
  setweight(to_tsvector('english', coalesce("statusReceive", '')), 'B') ||
  setweight(to_tsvector('english', coalesce("noted", '')), 'C') ||
  setweight(to_tsvector('english', extract_custom_field_values("customFields"::jsonb)), 'D')
WHERE "search_vector" IS NULL;
