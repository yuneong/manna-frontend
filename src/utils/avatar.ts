export function avatarColorForId(id: number): string {
  const hue = Math.round((id * 137.508) % 360)
  return `hsl(${hue}, 60%, 48%)`
}