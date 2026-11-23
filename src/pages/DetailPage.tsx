import {useEffect,useState} from 'react';
import {Link,useParams} from 'react-router-dom';
import {useSelector} from 'react-redux';
import type {RootState} from '../store';
import type {UpsItem,UpsMedia} from '../mock';
import {rkApi} from '../api/rk';
import {mediaUrl} from '../api/media';
import {UpsQRCode} from '../components/UpsQRCode';
import {MOCK_DATA} from '../mock';
import {pagesDemo,publicAsset} from '../config/runtime';

export const DetailPage=()=>{
 const {id}=useParams();const n=Number(id);
 const stateItem=useSelector((s:RootState)=>s.uninterruptible_power_supplies.items.find(i=>i.id===n));
 const {isAuthenticated,token,isModerator}=useSelector((s:RootState)=>s.auth);
 const [item,setItem]=useState<UpsItem|null>(null);const [recent,setRecent]=useState<UpsItem[]>([]);
 const [error,setError]=useState('');const [index,setIndex]=useState(0);
 useEffect(()=>{
   let active=true;setItem(null);setError('');setIndex(0);
   if(!Number.isInteger(n)||n<=0){setError('Некорректный ID');return}
   if (pagesDemo) {
     const sample=MOCK_DATA.find(v=>v.id===n);
     if (sample) setItem(sample); else setError('ИБП не найден');
     return ()=>{active=false};
   }
   rkApi.detail(n,isAuthenticated?token:null).then(r=>{if(active)setItem(r.data)}).catch(e=>{
     if(!active)return;if(stateItem)setItem(stateItem);
     else setError(e?.response?.status===404?'ИБП не найден':'Не удалось получить ИБП с сервера');
   });
   rkApi.recent().then(r=>{if(active)setRecent(r.data.filter(v=>v.id!==n))}).catch(()=>{});
   return()=>{active=false};
 },[n,isAuthenticated,token,stateItem]);
 if(!item)return <section className="page-card"><h1>{error||'Загрузка услуги…'}</h1><Link to="/grid">Назад к каталогу</Link></section>;
 const files:UpsMedia[]=item.media?.length?item.media:[...(item.image_url?[{id:0,url:item.image_url,kind:'image' as const}]:[]),...(item.video_url?[{id:-1,url:item.video_url,kind:'video' as const}]:[])];
 const selected=files[Math.min(index,files.length-1)];
 return <article className="page-card detail-page">
   <Link to="/grid">← Каталог</Link>
   <h1 style={{marginTop:14}}>{item.ups_name}</h1>
   {selected ? <div className="media-carousel">
     {selected.kind==='video'?<video key={selected.id} className="detail-image" src={mediaUrl(selected.url)} autoPlay loop muted playsInline controls/>:
       <img className="detail-image" src={mediaUrl(selected.url)} alt={item.ups_name} onError={e=>{e.currentTarget.src=publicAsset('no-image.png')}}/>}
     {files.length>1&&<div className="carousel-controls"><button onClick={()=>setIndex(i=>(i+files.length-1)%files.length)}>← Назад</button><span>{index+1} / {files.length}</span><button onClick={()=>setIndex(i=>(i+1)%files.length)}>Далее →</button></div>}
   </div>:<img className="detail-image" src={publicAsset("no-image.png")} alt="Без фотографии"/>}
   <p className="muted">{item.description}</p>
   <h2>Характеристики ИБП</h2>
   <table className="properties"><tbody>
     <tr><th>Ёмкость</th><td>{item.capacity} А·ч</td></tr>
     <tr><th>Максимальный ток</th><td>{item.max_current} А</td></tr>
     {(item.attributes??[]).map(a=><tr key={a.id}><th>{a.name}</th><td>{a.value||'—'}</td></tr>)}
   </tbody></table>
   {isModerator&&<p style={{marginTop:12}}><Link to={`/moderator?edit=${item.id}`}>Редактировать (модератор)</Link></p>}
   {!pagesDemo&&<UpsQRCode id={item.id}/>}
   {!pagesDemo&&<h2>Недавно просмотренные</h2>}
   {!pagesDemo&&<div className="recent-links">{recent.length?recent.map(u=><Link key={u.id} to={`/detail/${u.id}`}>{u.ups_name}</Link>):<span className="muted">Пока нет других просмотренных услуг</span>}</div>}
   {!pagesDemo&&<p className="muted" style={{marginTop:18}}>Недавно просмотренные услуги хранятся в гостевой Redis-сессии на 20 минут, независимо от входа пользователя.</p>}
 </article>;
};
