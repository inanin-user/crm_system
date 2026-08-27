// types/center.ts

export type CenterCode = "WC" | "DM" | "SM";

export const CENTER_LABELS: Record<CenterCode, string> = {
  WC: "灣仔",
  DM: "大馬",
  SM: "石門",
};

// All valid codes, useful for building <select> options or validating input
export const CENTER_CODES: CenterCode[] = ["WC", "DM", "SM"];

// Safe lookup for values coming from the DB/API that are typed as plain string,
// not necessarily narrowed to CenterCode — falls back to the raw code if unrecognized
// rather than throwing, so a bad/legacy value never crashes the UI.
export function centerLabel(code: string): string {
  return CENTER_LABELS[code as CenterCode] ?? code;
}