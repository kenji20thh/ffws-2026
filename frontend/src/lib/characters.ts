// Characters are pictures in public/characters/<name>.png (e.g. skyler.png).
// To support a new character just drop its picture in that folder and type its file
// name (without .png) in the admin panel — no code change needed.

/** Normalises what an admin types to the picture's file name: "Skyler " -> "skyler". */
export function normalizeCharacter(input: string): string {
  return input.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "");
}

export function characterImageSrc(character: string): string {
  return `/characters/${character}.png`;
}

/** "dj_alok" -> "DJ ALOK" style label source (uppercased by CSS). */
export function characterLabel(character: string): string {
  return character.replace(/[_-]+/g, " ");
}

/** Suggestions shown in the admin panel's autocomplete. Edit freely. */
export const CHARACTER_SUGGESTIONS = [
  "skyler",
  "maro",
  "suzy",
  "moco",
  "beaston",
];
