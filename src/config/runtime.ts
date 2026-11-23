/** Build-time mode for public GitHub Pages: deliberately no backend requests. */
export const pagesDemo = import.meta.env.VITE_DEMO_MODE === '1';
/** BASE_URL contains /repo/ on Pages and / for the LAN build. */
export const basePath = import.meta.env.BASE_URL || '/';
export function publicAsset(file: string): string {
  return `${basePath}${file.replace(/^\//, '')}`;
}
