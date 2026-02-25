import type { CardValue } from "../../server/types.js";

export const CARD_VALUES: CardValue[] = [1, 2, 3, 5, 8, 13, 21, "?", "coffee"];

export const CARD_LABELS: Record<string, string> = {
  "1": "1",
  "2": "2",
  "3": "3",
  "5": "5",
  "8": "8",
  "13": "13",
  "21": "21",
  "?": "?",
  coffee: "☕",
};
