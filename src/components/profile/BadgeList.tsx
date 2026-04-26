import type { Badge } from '../../types/domain'

export function BadgeList({ badges }: { badges: Badge[] }) {
  return (
    <section className="rounded-md border border-stone-200 bg-white p-4 shadow-sm">
      <h2 className="text-base font-semibold text-stone-950">徽章信号</h2>
      <div className="mt-3 flex flex-wrap gap-2">
        {badges.length === 0 ? (
          <p className="text-sm text-stone-500">继续记录后会自动获得持续性和推进类 badge。</p>
        ) : (
          badges.map((badge) => (
            <span
              key={badge.id}
              className="rounded-full bg-teal-50 px-3 py-1.5 text-xs font-semibold text-teal-800"
              title={badge.description}
            >
              {badge.name}
            </span>
          ))
        )}
      </div>
    </section>
  )
}
