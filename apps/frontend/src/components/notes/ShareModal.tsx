import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useShareLinks } from '@/hooks/useShareLinks';
import { useCreateShareLink } from '@/hooks/useCreateShareLink';
import { useRevokeShareLink } from '@/hooks/useRevokeShareLink';
import type { ShareLinksListItem } from '@notepad/shared';

interface ShareModalProps {
  noteId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function LinkRow({ link, noteId }: { link: ShareLinksListItem; noteId: string }) {
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'error'>('idle');
  const revoke = useRevokeShareLink(noteId);
  const isExpired = link.expiresAt !== null && new Date(link.expiresAt) < new Date();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(link.shareUrl);
      setCopyState('copied');
      setTimeout(() => setCopyState('idle'), 2000);
    } catch {
      setCopyState('error');
      setTimeout(() => setCopyState('idle'), 3000);
    }
  };

  return (
    <div className="flex flex-col gap-1 rounded-md border p-3 text-sm">
      <div className="flex items-center justify-between gap-2">
        <span className="truncate text-muted-foreground flex-1 min-w-0">{link.shareUrl}</span>
        <div className="flex items-center gap-1 shrink-0">
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs px-2"
            onClick={() => void handleCopy()}
          >
            {copyState === 'copied' ? 'Copied!' : 'Copy'}
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs px-2 text-destructive hover:text-destructive"
            disabled={revoke.isPending}
            onClick={() => revoke.mutate(link.token)}
          >
            Revoke
          </Button>
        </div>
      </div>
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span>{link.viewCount} {link.viewCount === 1 ? 'view' : 'views'}</span>
        {link.expiresAt ? (
          <>
            <span>·</span>
            <span>
              Expires {new Date(link.expiresAt).toLocaleDateString()}
            </span>
          </>
        ) : (
          <>
            <span>·</span>
            <span>No expiry</span>
          </>
        )}
        {isExpired && (
          <span className="ml-1 rounded bg-destructive/10 px-1.5 py-0.5 text-destructive font-medium">
            Expired
          </span>
        )}
      </div>
      {copyState === 'error' && (
        <p className="text-xs text-destructive">Failed to copy — please copy the link manually.</p>
      )}
      {revoke.isError && (
        <p className="text-xs text-destructive">Failed to revoke. Please try again.</p>
      )}
    </div>
  );
}

export function ShareModal({ noteId, open, onOpenChange }: ShareModalProps) {
  const { data: links, isLoading, isError, refetch } = useShareLinks(open ? noteId : undefined);
  const createLink = useCreateShareLink(noteId);
  const [expiresAt, setExpiresAt] = useState('');

  const activeLinks = links?.filter((l) => l.revokedAt === null) ?? [];

  const handleGenerate = () => {
    createLink.mutate(
      { expiresAt: expiresAt || undefined },
      { onSuccess: () => setExpiresAt('') },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-md sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Share Note</DialogTitle>
        </DialogHeader>

        {/* Generate link form */}
        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <input
              type="datetime-local"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              className="flex-1 rounded-md border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              placeholder="Expiry (optional)"
            />
            <Button
              size="sm"
              onClick={handleGenerate}
              disabled={createLink.isPending}
            >
              {createLink.isPending ? 'Generating…' : 'Generate link'}
            </Button>
          </div>
          {createLink.isError && (
            <p className="text-xs text-destructive">
              {(createLink.error as Error).message ?? 'Failed to generate link.'}
            </p>
          )}
        </div>

        {/* Links list */}
        <div className="flex flex-col gap-2 max-h-72 overflow-y-auto">
          {isLoading && (
            <>
              <div className="h-14 rounded-md bg-muted animate-pulse" />
              <div className="h-14 rounded-md bg-muted animate-pulse" />
            </>
          )}

          {isError && (
            <div className="flex flex-col items-center gap-2 py-4 text-sm text-muted-foreground">
              <p>Failed to load share links.</p>
              <Button size="sm" variant="outline" onClick={() => void refetch()}>
                Retry
              </Button>
            </div>
          )}

          {!isLoading && !isError && activeLinks.length === 0 && (
            <p className="py-4 text-center text-sm text-muted-foreground">
              No active share links
            </p>
          )}

          {!isLoading &&
            !isError &&
            activeLinks.map((link) => (
              <LinkRow key={link.token} link={link} noteId={noteId} />
            ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
