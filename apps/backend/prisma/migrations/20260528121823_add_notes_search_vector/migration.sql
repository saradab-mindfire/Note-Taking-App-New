-- AlterTable
ALTER TABLE "notes" ADD COLUMN     "searchVector" tsvector;

-- AlterTable
ALTER TABLE "tags" ALTER COLUMN "color" SET DEFAULT '#6B7280',
ALTER COLUMN "updatedAt" DROP DEFAULT;

-- CreateFunction: maintains searchVector on INSERT/UPDATE
CREATE OR REPLACE FUNCTION notes_search_vector_update()
RETURNS trigger AS $$
BEGIN
  NEW."searchVector" :=
    setweight(to_tsvector('english', coalesce(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW.content, '')), 'B');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- CreateTrigger: fires before each INSERT or UPDATE on notes
CREATE TRIGGER notes_search_vector_trigger
  BEFORE INSERT OR UPDATE ON "notes"
  FOR EACH ROW EXECUTE FUNCTION notes_search_vector_update();

-- Backfill: populate searchVector for existing rows
UPDATE "notes"
SET "searchVector" =
  setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
  setweight(to_tsvector('english', coalesce(content, '')), 'B');

-- CreateIndex: GIN index for fast full-text search
CREATE INDEX "notes_search_vector_gin" ON "notes" USING GIN ("searchVector");
