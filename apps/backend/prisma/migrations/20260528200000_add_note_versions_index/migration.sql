-- CreateIndex
CREATE INDEX "note_versions_noteId_createdAt_idx" ON "note_versions"("noteId", "createdAt" DESC);
