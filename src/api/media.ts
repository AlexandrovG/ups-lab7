import {publicAsset} from '../config/runtime';
// Только файлы MinIO направляются через второй маршрут Vite Proxy: /s3.
// Не подменяем произвольные внешние ссылки и локальные изображения.
export function mediaUrl(input?: string): string {
  if(!input) return publicAsset('no-image.png');
  if(input.startsWith('blob:')||input.startsWith('data:')) return input;
  if (/^\/(no-image\.png|1\.jpg|nas\.jpg|default\.png)$/.test(input)) return publicAsset(input);
  try {
    const url=new URL(input,window.location.origin);
    if(url.pathname.startsWith('/s3/')) return url.pathname+url.search;
    if(url.port==='9000' && ['localhost','127.0.0.1','minio'].includes(url.hostname))
      return '/s3'+url.pathname+url.search;
    if(input.startsWith('ups-media/')) return '/s3/'+input;
    return input;
  } catch {return publicAsset('no-image.png');}
}
