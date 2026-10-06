'use client';

import { useRef, useState } from 'react';
import { withBasePath } from '@/lib/basePath';

interface Person {
  id: string;
  name: string;
  role: string;
}

interface MentionInputProps {
  value: string;
  onChange: (value: string) => void;
  id?: string;
  name?: string;
  placeholder?: string;
  required?: boolean;
  className?: string;
}

const SEP = /[\s,，]/;

const ROLE_LABEL: Record<string, string> = {
  trainer: '教練',
  member: '會員',
  'regular-member': '普通會員',
  'premium-member': '星級會員',
};

// Finds an "@query" token that ends at the caret
function detectToken(text: string, caret: number) {
  const before = text.slice(0, caret);
  const at = before.lastIndexOf('@');
  if (at === -1) return null;
  if (at > 0 && !SEP.test(before[at - 1])) return null; // e.g. an email address
  const query = before.slice(at + 1);
  if (SEP.test(query)) return null;
  return { at, query };
}

export default function MentionInput({
  value,
  onChange,
  id,
  name,
  placeholder,
  required,
  className = '',
}: MentionInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const loadedRef = useRef(false);
  const [people, setPeople] = useState<Person[]>([]);
  const [open, setOpen] = useState(false);
  const [token, setToken] = useState<{ at: number; query: string } | null>(null);
  const [active, setActive] = useState(0);

  const loadPeople = async () => {
    if (loadedRef.current) return;
    loadedRef.current = true;
    try {
      const res = await fetch(withBasePath('/api/accounts/members-trainers'), { cache: 'no-store' });
      const data = await res.json();
      if (data.success) setPeople(data.data);
      else loadedRef.current = false;
    } catch (e) {
      console.error('載入成員列表失敗:', e);
      loadedRef.current = false;
    }
  };

  // Dropdown rows: "all" first, then people filtered by the query
  const q = (token?.query ?? '').toLowerCase();
  const showAll = !q || 'all'.includes(q) || '全部'.includes(q);
  const filtered = people.filter((p) => p.name.toLowerCase().includes(q));
  const options: { key: string; label: string; hint?: string; names: string[] }[] = [
    ...(showAll && people.length > 0
      ? [{ key: '__all__', label: 'all', hint: `全部 ${people.length} 人`, names: people.map((p) => p.name) }]
      : []),
    ...filtered.map((p) => ({
      key: p.id,
      label: p.name,
      hint: ROLE_LABEL[p.role] ?? p.role,
      names: [p.name],
    })),
  ];

  const select = (names: string[]) => {
    if (!token) return;
    const caret = inputRef.current?.selectionStart ?? value.length;
    const before = value.slice(0, token.at);
    const after = value.slice(caret);

    // don't add names that are already in the field
    const existing = new Set(before.split(/[,，]/).map((s) => s.trim()).filter(Boolean));
    const toAdd = names.filter((n) => !existing.has(n));

    const insert = toAdd.join(', ');
    const next = before + insert + after;
    onChange(next);
    setOpen(false);
    setToken(null);

    const pos = (before + insert).length;
    requestAnimationFrame(() => {
      inputRef.current?.focus();
      inputRef.current?.setSelectionRange(pos, pos);
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value;
    onChange(text);
    const t = detectToken(text, e.target.selectionStart ?? text.length);
    setToken(t);
    setActive(0);
    if (t) {
      setOpen(true);
      loadPeople();
    } else {
      setOpen(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open || options.length === 0) return;
    if (e.nativeEvent.isComposing) return; // Chinese IME composition

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((i) => (i + 1) % options.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => (i - 1 + options.length) % options.length);
    } else if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault();
      select(options[active].names);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        id={id}
        name={name}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onBlur={() => setOpen(false)}
        placeholder={placeholder}
        required={required}
        autoComplete="off"
        className={className}
      />

      {open && (
        <div
          role="listbox"
          className="absolute left-0 top-full z-50 mt-1 w-full max-h-48 overflow-y-auto bg-white border border-gray-300 rounded-lg shadow-lg"
        >
          {people.length === 0 ? (
            <div className="px-3 py-2 text-sm text-gray-500">載入中...</div>
          ) : options.length === 0 ? (
            <div className="px-3 py-2 text-sm text-gray-500">找不到符合的成員</div>
          ) : (
            options.map((opt, i) => (
              <div
                key={opt.key}
                role="option"
                aria-selected={i === active}
                // mousedown + preventDefault keeps focus in the input, so onBlur doesn't close it first
                onMouseDown={(e) => {
                  e.preventDefault();
                  select(opt.names);
                }}
                onMouseEnter={() => setActive(i)}
                className={`px-3 py-2 cursor-pointer flex items-center justify-between text-slate-900 ${
                  i === active ? 'bg-blue-50' : ''
                }`}
              >
                <span className={opt.key === '__all__' ? 'font-semibold' : ''}>{opt.label}</span>
                {opt.hint && <span className="text-xs text-gray-500">{opt.hint}</span>}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}