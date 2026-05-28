import type { SearchResultItem, SearchResultsResponse, SearchQuery } from '@notepad/shared';
import prisma from '../../lib/prisma.js';
import { Prisma } from '@prisma/client';

// ─── Types ────────────────────────────────────────────────────────────────────

type RawSearchRow = {
  id: string;
  title: string;
  snippet: string;
  score: number;
  total_count: bigint;
};

// ─── Service ─────────────────────────────────────────────────────────────────

export class SearchService {
  async searchNotes(
    userId: string,
    query: SearchQuery,
  ): Promise<SearchResultsResponse> {
    const { q, page, limit } = query;
    const offset = (page - 1) * limit;

    const rows = await prisma.$queryRaw<RawSearchRow[]>`
      SELECT
        n.id,
        n.title,
        ts_headline(
          'english',
          n.content,
          websearch_to_tsquery('english', ${q}),
          'MaxWords=50, MinWords=20, MaxFragments=2'
        ) AS snippet,
        ts_rank(n."searchVector", websearch_to_tsquery('english', ${q})) AS score,
        COUNT(*) OVER() AS total_count
      FROM "notes" n
      WHERE
        n."userId" = ${userId}
        AND n."deletedAt" IS NULL
        AND n."searchVector" @@ websearch_to_tsquery('english', ${q})
      ORDER BY score DESC
      LIMIT ${Prisma.raw(String(limit))}
      OFFSET ${Prisma.raw(String(offset))}
    `;

    const total = rows.length > 0 ? Number(rows[0]!.total_count) : 0;

    const results: SearchResultItem[] = rows.map((row) => ({
      id: row.id,
      title: row.title,
      snippet: row.snippet,
      score: Number(row.score),
    }));

    return { results, total, page, limit };
  }
}
