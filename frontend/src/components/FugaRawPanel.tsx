import { useState } from 'react';
import { Braces, ChevronDown, ChevronRight } from 'lucide-react';

/**
 * 100% FUGA field-parity fallback panel.
 *
 * Renders EVERY key in a FUGA raw payload (CatalogProduct/Asset/Artist
 * .fugaRaw) regardless of whether a curated UI field exists for it or
 * whether the value is empty. This is the structural guarantee behind the
 * user mandate "FUGA에 있는 건 전부, 값이 없어도 다 가져와서 반영" — new
 * FUGA fields surface automatically with no per-field schema/mapper/UI work.
 */

function humanizeKey(k: string): string {
  return k
    .replace(/_/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function RawValue({ value }: { value: any }) {
  if (value === null || value === undefined || value === '') {
    return <span className="italic text-zinc-500 dark:text-zinc-600">미입력</span>;
  }
  if (typeof value === 'boolean') {
    return <span className="text-zinc-700 dark:text-zinc-300">{value ? 'Yes' : 'No'}</span>;
  }
  if (typeof value === 'number' || typeof value === 'string') {
    return <span className="text-zinc-700 dark:text-zinc-300 break-words">{String(value)}</span>;
  }
  if (Array.isArray(value)) {
    if (value.length === 0) {
      return <span className="italic text-zinc-500 dark:text-zinc-600">[] 비어있음</span>;
    }
    if (value.every((v) => typeof v !== 'object' || v === null)) {
      return <span className="text-zinc-700 dark:text-zinc-300 break-words">{value.join(', ')}</span>;
    }
    return (
      <div className="space-y-2">
        {value.map((v, i) => (
          <div key={i} className="rounded-md bg-zinc-100 dark:bg-zinc-800/60 p-2">
            <RawValue value={v} />
          </div>
        ))}
      </div>
    );
  }
  if (typeof value === 'object') {
    return (
      <div className="space-y-1 pl-2 border-l border-zinc-200 dark:border-zinc-700">
        {Object.entries(value).map(([k, v]) => (
          <div key={k} className="grid grid-cols-[minmax(120px,200px)_1fr] gap-2 text-xs">
            <span className="text-zinc-400 dark:text-zinc-500">{humanizeKey(k)}</span>
            <RawValue value={v} />
          </div>
        ))}
      </div>
    );
  }
  return <span className="text-zinc-500">{String(value)}</span>;
}

export default function FugaRawPanel({
  raw,
  label = 'FUGA Raw Fields',
}: {
  raw: Record<string, any> | null | undefined;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  if (!raw || typeof raw !== 'object' || Object.keys(raw).length === 0) return null;
  const entries = Object.entries(raw).sort(([a], [b]) => a.localeCompare(b));
  return (
    <div className="mt-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800">
            <Braces className="h-4 w-4 text-slate-500" />
          </div>
          <div className="text-left">
            <p className="font-semibold text-zinc-800 dark:text-zinc-100">{label}</p>
            <p className="text-[11px] text-zinc-400 dark:text-zinc-500">
              FUGA가 보낸 모든 필드 ({entries.length}개) — 값이 없어도 전부 표시
            </p>
          </div>
        </div>
        {open ? (
          <ChevronDown className="h-5 w-5 text-zinc-400" />
        ) : (
          <ChevronRight className="h-5 w-5 text-zinc-400" />
        )}
      </button>
      {open && (
        <div className="px-5 pb-5 pt-1 space-y-2.5 border-t border-zinc-100 dark:border-zinc-800">
          {entries.map(([k, v]) => (
            <div
              key={k}
              className="grid grid-cols-1 sm:grid-cols-[minmax(140px,240px)_1fr] gap-1 sm:gap-3 py-1.5 border-b border-zinc-50 dark:border-zinc-800/50 last:border-0"
            >
              <span className="text-xs font-medium uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
                {humanizeKey(k)}
              </span>
              <div className="text-sm">
                <RawValue value={v} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
