import { useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useVersionList } from '@/hooks/useVersionList';
import type { NoteVersion } from '@notepad/shared';

interface VersionHistoryDrawerProps {
  noteId: string;
  open: boolean;
  onClose: () => void;
  isSaving: boolean;
  isRestoring: boolean;
  restoreError: Error | null;
  onRestore: (versionId: string) => void;
}

function VersionList({
  noteId,
  isOpen,
  selected,
  onSelect,
}: {
  noteId: string;
  isOpen: boolean;
  selected: NoteVersion | null;
  onSelect: (v: NoteVersion) => void;
}) {
  const { data, isLoading, isError, refetch } = useVersionList(noteId, isOpen);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-12 rounded-md bg-muted animate-pulse" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center gap-2 py-6 text-sm text-muted-foreground">
        <p>Failed to load version history.</p>
        <Button size="sm" variant="outline" onClick={() => void refetch()}>
          Retry
        </Button>
      </div>
    );
  }

  const versions = data?.versions ?? [];

  if (versions.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">
        No saved versions yet.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-1 overflow-y-auto max-h-64">
      {versions.map((v) => (
        <button
          key={v.id}
          type="button"
          onClick={() => onSelect(v)}
          className={`w-full text-left rounded-md px-3 py-2 text-sm transition-colors hover:bg-muted ${
            selected?.id === v.id ? 'bg-muted font-medium' : ''
          }`}
        >
          <span className="block truncate font-medium">{v.title}</span>
          <span className="block text-xs text-muted-foreground">
            {new Date(v.createdAt).toLocaleString()}
          </span>
        </button>
      ))}
    </div>
  );
}

function VersionPreviewPanel({
  version,
  onRestoreClick,
  isRestoreDisabled,
}: {
  version: NoteVersion | null;
  onRestoreClick: () => void;
  isRestoreDisabled: boolean;
}) {
  if (!version) {
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">
        Select a version to preview its content.
      </p>
    );
  }

  let contentText = version.content;
  try {
    const parsed = JSON.parse(version.content) as {
      content?: Array<{ type?: string; text?: string; content?: unknown[] }>;
    };
    const extractText = (
      nodes: Array<{ type?: string; text?: string; content?: unknown[] }>,
    ): string =>
      nodes
        .map((n) =>
          n.text != null
            ? n.text
            : extractText(
                (n.content ?? []) as Array<{ type?: string; text?: string; content?: unknown[] }>,
              ),
        )
        .join('');
    contentText = extractText(parsed.content ?? []);
  } catch {
    // raw string fallback
  }

  return (
    <div className="flex flex-col gap-3">
      <div>
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
          Title
        </p>
        <p className="text-sm font-semibold">{version.title}</p>
      </div>
      <div>
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
          Content
        </p>
        <p className="text-sm whitespace-pre-wrap break-words max-h-48 overflow-y-auto rounded-md border bg-muted/30 p-2">
          {contentText || <span className="italic text-muted-foreground">Empty</span>}
        </p>
      </div>
      <Button
        size="sm"
        variant="destructive"
        disabled={isRestoreDisabled}
        onClick={onRestoreClick}
      >
        Restore this version
      </Button>
    </div>
  );
}

function RestoreConfirmDialog({
  open,
  onConfirm,
  onCancel,
  isPending,
}: {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  isPending: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onCancel(); }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Restore this version?</DialogTitle>
          <DialogDescription>
            The current note content will be replaced with the selected version.
            A new version snapshot will be created automatically.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={onCancel} disabled={isPending}>
            Cancel
          </Button>
          <Button variant="destructive" size="sm" onClick={onConfirm} disabled={isPending}>
            {isPending ? 'Restoring…' : 'Restore'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function VersionHistoryDrawer({
  noteId,
  open,
  onClose,
  isSaving,
  isRestoring,
  restoreError,
  onRestore,
}: VersionHistoryDrawerProps) {
  const [selectedVersion, setSelectedVersion] = useState<NoteVersion | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const handleRestoreClick = () => {
    setConfirmOpen(true);
  };

  const handleConfirm = () => {
    if (!selectedVersion) return;
    setConfirmOpen(false);
    onRestore(selectedVersion.id);
  };

  const handleCancel = () => {
    if (!isRestoring) setConfirmOpen(false);
  };

  const handleOpenChange = (v: boolean) => {
    if (!v) {
      setSelectedVersion(null);
      setConfirmOpen(false);
      onClose();
    }
  };

  return (
    <>
      <Sheet open={open} onOpenChange={handleOpenChange}>
        <SheetContent side="right" className="w-full sm:max-w-md flex flex-col gap-4 overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Version History</SheetTitle>
          </SheetHeader>

          <div className="flex flex-col gap-4">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                Versions
              </p>
              <VersionList
                noteId={noteId}
                isOpen={open}
                selected={selectedVersion}
                onSelect={setSelectedVersion}
              />
            </div>

            <div className="border-t pt-4">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                Preview
              </p>
              <VersionPreviewPanel
                version={selectedVersion}
                onRestoreClick={handleRestoreClick}
                isRestoreDisabled={isSaving || isRestoring}
              />
              {restoreError && !confirmOpen && (
                <p className="mt-2 text-sm text-destructive">
                  {restoreError.message ?? 'Restore failed. Please try again.'}
                </p>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <RestoreConfirmDialog
        open={confirmOpen}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
        isPending={isRestoring}
      />
    </>
  );
}
