const POINT_IMAGES = Array.from(
  { length: 9 },
  (_, i) => new URL(`../assets/points/Recurso ${i + 1}.png`, import.meta.url).href
);

export function generatePointImages(count: number): string[] {
  const result: string[] = [];
  for (let i = 0; i < count; i++) {
    const prev: string | undefined = result[i - 1];
    const available = POINT_IMAGES.filter((img) => img !== prev);
    result.push(available[Math.floor(Math.random() * available.length)]!);
  }
  return result;
}
