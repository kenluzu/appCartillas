const POINT_IMAGES = Array.from(
  { length: 10 },
  (_, i) => new URL(`../assets/points/Recurso ${i + 1}.png`, import.meta.url).href
);

export function generatePointImages(count: number): string[] {
  return Array.from({ length: count }, (_, i) => POINT_IMAGES[i % POINT_IMAGES.length]!);
}
