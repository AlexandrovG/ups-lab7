import {useMemo} from 'react';
import matrixForURL from '../qr/matrix.js';
export function UpsQRCode({id}:{id:number}){
 // On a phone, 127.0.0.1 points to the phone, not to the computer.
 // Set VITE_PUBLIC_URL to the PC ZeroTier IP before demoing phone scanning.
 const base=(import.meta.env.VITE_PUBLIC_URL||window.location.origin).replace(/\/$/,'');
 const link=`${base}/detail/${id}`;
 const cells=useMemo(()=>matrixForURL(link),[link]);
 const scale=4,margin=4,size=cells.length+margin*2;
 return <section className="qr-section">
  <h2>QR-код этой услуги</h2>
  <svg aria-label="QR-код ссылки на ИБП" role="img" width={size*scale} height={size*scale} viewBox={`0 0 ${size} ${size}`} shapeRendering="crispEdges" style={{maxWidth:'100%'}}>
   <rect width={size} height={size} fill="#FFFFFF"/>
   {cells.map((row,y)=>row.map((cell,x)=>cell?<rect key={`${x}-${y}`} x={x+margin} y={y+margin} width={1} height={1} fill="#1F2429"/>:null))}
  </svg>
  <a href={link} className="qr-link">{link}</a>
  {link.includes('127.0.0.1')||link.includes('localhost')?<p className="muted">Для сканирования телефоном укажи VITE_PUBLIC_URL с IP-адресом компьютера в ZeroTier и настрой доступ к Vite в сети.</p>:null}
 </section>;
}
