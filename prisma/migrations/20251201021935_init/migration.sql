-- AlterTable
ALTER TABLE "FixedAsset" ADD COLUMN     "search_vector" tsvector;

-- CreateIndex
CREATE INDEX "FixedAsset_search_vector_idx" ON "FixedAsset" USING GIN ("search_vector");
