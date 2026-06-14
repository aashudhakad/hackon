/** Loading skeleton for the homepage sections. */
export function HomeSkeleton() {
  return (
    <div className="space-y-8 py-2">
      {[0, 1].map((s) => (
        <div key={s}>
          <div className="mb-3 h-5 w-40 animate-pulse rounded bg-gray-200" />
          <div className="flex gap-3 overflow-hidden">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-32 w-56 shrink-0 animate-pulse rounded-2xl bg-gray-200" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
