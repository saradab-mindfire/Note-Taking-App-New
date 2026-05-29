import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useSearchNotes } from '@/hooks/useSearchNotes';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import type { SearchResultItem } from '@notepad/shared';

const DEFAULT_LIMIT = 20;

export function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const qParam = searchParams.get('q') ?? '';
  const pageParam = Math.max(1, Number(searchParams.get('page') ?? '1'));
  const limitParam = Math.max(1, Math.min(100, Number(searchParams.get('limit') ?? String(DEFAULT_LIMIT))));

  const [inputValue, setInputValue] = useState(qParam);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync input with URL on external navigation (browser back/forward)
  useEffect(() => {
    setInputValue(qParam);
  }, [qParam]);

  function handleInputChange(value: string) {
    setInputValue(value);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(() => {
      const next = new URLSearchParams(searchParams);
      if (value.trim()) {
        next.set('q', value);
        next.set('page', '1');
      } else {
        next.delete('q');
        next.delete('page');
      }
      setSearchParams(next, { replace: true });
    }, 300);
  }

  function setPage(page: number) {
    const next = new URLSearchParams(searchParams);
    next.set('page', String(page));
    setSearchParams(next);
  }

  const { data, isLoading, isError, error } = useSearchNotes({
    q: qParam,
    page: pageParam,
    limit: limitParam,
  });

  const results = data?.results ?? [];
  const total = data?.total ?? 0;
  const isLastPage = pageParam * limitParam >= total;
  const hasQuery = qParam.trim().length > 0;

  const is401 = isError && (error as { status?: number })?.status === 401;

  useEffect(() => {
    if (is401) {
      navigate('/login', { replace: true });
    }
  }, [is401, navigate]);

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-4 py-8 space-y-6">
        <header>
          <h1 className="text-2xl font-bold tracking-tight">Search Notes</h1>
        </header>

        <Input
          type="search"
          placeholder="Search notes…"
          value={inputValue}
          onChange={(e) => handleInputChange(e.target.value)}
          autoFocus
        />

        {hasQuery && isLoading && <LoadingSkeleton />}

        {hasQuery && isError && !is401 && (
          <p className="text-sm text-destructive">
            Search failed: {(error as Error).message ?? 'Something went wrong'}
          </p>
        )}

        {hasQuery && !isLoading && !isError && results.length === 0 && (
          <p className="text-sm text-muted-foreground">No notes found for &quot;{qParam}&quot;.</p>
        )}

        {results.length > 0 && (
          <>
            <p className="text-sm text-muted-foreground">
              {total} {total === 1 ? 'result' : 'results'}
            </p>

            <ul className="space-y-3">
              {results.map((item: SearchResultItem) => (
                <li key={item.id}>
                  <Card
                    className="p-4 cursor-pointer hover:bg-accent transition-colors"
                    onClick={() => navigate(`/notes/${item.id}`)}
                  >
                    <h2 className="font-semibold text-base mb-1">{item.title}</h2>
                    <p
                      className="text-sm text-muted-foreground line-clamp-3 [&_b]:font-semibold [&_b]:text-foreground"
                      // snippet HTML is generated server-side by ts_headline (only <b> tags)
                      dangerouslySetInnerHTML={{ __html: item.snippet }}
                    />
                  </Card>
                </li>
              ))}
            </ul>

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(pageParam - 1)}
                disabled={pageParam <= 1}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">Page {pageParam}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(pageParam + 1)}
                disabled={isLastPage}
              >
                Next
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <ul className="space-y-3" aria-label="Loading results">
      {Array.from({ length: 3 }).map((_, i) => (
        <li key={i}>
          <Card className="p-4 space-y-2">
            <div className="h-4 w-1/2 rounded bg-muted animate-pulse" />
            <div className="h-3 w-full rounded bg-muted animate-pulse" />
            <div className="h-3 w-3/4 rounded bg-muted animate-pulse" />
          </Card>
        </li>
      ))}
    </ul>
  );
}
