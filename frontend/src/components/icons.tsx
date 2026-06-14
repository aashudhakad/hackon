/** Lightning bolt (DC-Flash style) used to brand Flash mode. */
export function BoltIcon({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M13 2 4.5 13.5H11l-1.5 8.5L20 9.5h-6.8z" />
    </svg>
  );
}

/** Simple lightning-in-circle mark used as the Flash logo. */
export function FlashMark({ className = '' }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center justify-center rounded-full bg-yellow-400 text-red-600 ${className}`}
    >
      <BoltIcon className="h-1/2 w-1/2" />
    </span>
  );
}

/** Grid icon for Quick mode. */
export function GridIcon({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M3 3h8v8H3zm10 0h8v8h-8zM3 13h8v8H3zm10 0h8v8h-8z" />
    </svg>
  );
}
