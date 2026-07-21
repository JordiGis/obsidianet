import { atomWithStorage } from "jotai/utils";
import type { Entitlements } from "./entitlement.types";
import { Feature } from "@/ee/features";

// All EE features are permanently unlocked in Obsidianet.
// The atom initialises with every known feature, tier "enterprise".
// (Some UI code reads the atom directly rather than going through useHasFeature.)
export const entitlementAtom = atomWithStorage<Entitlements | null>(
  "entitlements",
  {
    cloud: false,
    tier: "enterprise",
    features: Object.values(Feature),
  },
);
