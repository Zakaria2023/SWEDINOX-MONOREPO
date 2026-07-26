import type { ScorecardRow } from "./types";
import { SCORECARD } from "./types";

export const getBalancedScorecard = async (): Promise<ScorecardRow[]> =>
  SCORECARD.map((row) => ({
    ...row,
    value: 0,
    target: 0,
    status: "on_target",
    trend: "flat",
  }));
