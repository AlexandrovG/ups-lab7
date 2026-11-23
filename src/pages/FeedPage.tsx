import {useState,useEffect} from 'react';
import {useSelector,useDispatch} from 'react-redux';
import type {RootState,AppDispatch} from '../store';
import {fetchUpsList,likeUps,deleteUps} from '../slices/upsSlice';
import {publicAsset} from '../config/runtime';

export const FeedPage=()=>{
  const dispatch=useDispatch<AppDispatch>();
  const {items,loading,error,source}=useSelector((s:RootState)=>s.uninterruptible_power_supplies);
  const {isAuthenticated}=useSelector((s:RootState)=>s.auth);
  const [index,setIndex]=useState(0);const [expanded,setExpanded]=useState(false);
  useEffect(()=>{if(source===null)void dispatch(fetchUpsList());},[dispatch,source]);
  useEffect(()=>{if(index>=items.length)setIndex(0);},[index,items.length]);
  const item=items[index];
  const handleNext=()=>{setIndex(n=>(n+1)%items.length);setExpanded(false);};
  const handleLike=async()=>{
    if(!item)return;
    if(!isAuthenticated){window.alert('Для лайка необходимо войти');return;}
    try{await dispatch(likeUps({id:item.id,value:item.is_liked?0:1})).unwrap();}
    catch(e){window.alert(String(e));}
  };
  const handleDelete=async()=>{
    if(!item?.is_creator||!window.confirm('Удалить собственную услугу?'))return;
    try{await dispatch(deleteUps(item.id)).unwrap();setIndex(0);}
    catch(e){window.alert(String(e));}
  };
  if(!item)return <div className="page-card">{loading?'Загрузка…':error||'Услуг нет.'}</div>;
  return <section className="feed-container">
    {item.video_url?<video key={item.video_url} className="feed-video" src={item.video_url} autoPlay loop muted playsInline poster={item.image_url}/>
      :<img key={item.image_url} className="feed-video" src={item.image_url||publicAsset('no-image.png')} alt={item.ups_name} onError={e=>{if(!e.currentTarget.src.endsWith('/no-image.png'))e.currentTarget.src=publicAsset('no-image.png');}}/>}
    <div className="feed-shade"/>
    <div className="feed-overlay-info"><h1>{item.ups_name}</h1>
      <p>{expanded?item.description:`${item.description.slice(0,85)}${item.description.length>85?'…':''}`}</p>
      {item.description.length>85&&<button className="text-btn" onClick={()=>setExpanded(x=>!x)}>{expanded?'Свернуть':'Подробнее'}</button>}
      <p className="feed-specs">Ёмкость: {item.capacity} А·ч · Макс. ток: {item.max_current} А</p>
    </div>
    <div className="feed-overlay-actions">
      <button aria-label="Лайк" className="action-btn" disabled={loading} onClick={handleLike}><span aria-hidden="true">{item.is_liked?'♥':'♡'}</span><small>{item.likes_count}</small></button>
      {isAuthenticated&&item.is_creator&&<button aria-label="Удалить услугу" className="action-btn" disabled={loading} onClick={handleDelete}>✕</button>}
      <button aria-label="Следующая услуга" className="action-btn" disabled={loading} onClick={handleNext}>›</button>
    </div>
  </section>;
};
