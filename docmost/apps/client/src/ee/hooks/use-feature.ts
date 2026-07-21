// All EE features are permanently unlocked in Obsidianet.
// This hook always returns true — no feature gating.
export const useHasFeature = (_feature: string): boolean => {
  return true;
};
