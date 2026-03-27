export default function SkeletonLoader({ rows = 3, height = 60 }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: 24 }}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} style={{ height, background: 'linear-gradient(90deg, #1e1e3a 25%, #2a2a4a 50%, #1e1e3a 75%)', backgroundSize: '200% 100%', borderRadius: 10, animation: 'shimmer 1.5s infinite' }} />
      ))}
      <style>{`@keyframes shimmer { 0% { background-position: 200% 0 } 100% { background-position: -200% 0 } }`}</style>
    </div>
  )
}
