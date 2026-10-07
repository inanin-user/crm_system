import type { AvatarConfig, EyePoint } from "./avatarConfig";

export function getGlancePosition(
  progress: number,
  glancePath: AvatarConfig["eyes"]["glancePath"],
): EyePoint {
  if (glancePath.length === 0) return { x: 0, y: 0 };
  if (glancePath.length === 1) return glancePath[0];

  const safeProgress = Math.max(0, Math.min(progress, 1));
  const scaled = safeProgress * (glancePath.length - 1);
  const index = Math.floor(scaled);
  const nextIndex = Math.min(index + 1, glancePath.length - 1);
  const localProgress = scaled - index;

  const current = glancePath[index];
  const next = glancePath[nextIndex];

  return {
    x: current.x + (next.x - current.x) * localProgress,
    y: current.y + (next.y - current.y) * localProgress,
  };
}