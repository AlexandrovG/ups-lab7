import {useCallback,useEffect,useState,type FormEvent} from 'react';
import {Link,useNavigate,useSearchParams} from 'react-router-dom';
import {useSelector} from 'react-redux';
import {Button,Form,Alert} from 'react-bootstrap';
import type {RootState} from '../store';
import type {UpsItem,UpsMedia} from '../mock';
import {rkApi,type AttributeDefinition} from '../api/rk';
import {mediaUrl} from '../api/media';

export const ModeratorPage=()=>{
 const {isAuthenticated,isModerator,token}=useSelector((s:RootState)=>s.auth);
 const [items,setItems]=useState<UpsItem[]>([]),[attrs,setAttrs]=useState<AttributeDefinition[]>([]);
 const [params,setParams]=useSearchParams(),nav=useNavigate();
 const [busy,setBusy]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState('');
 const [newName,setNewName]=useState(''),[file,setFile]=useState<File|null>(null);
 const [data,setData]=useState({ups_name:'',description:'',capacity:0,max_current:0});
 const [values,setValues]=useState<Record<number,string>>({});
 const activeID=Number(params.get('edit')||0);
 const selected=items.find(i=>i.id===activeID);
 const reload=useCallback(async()=>{if(!token||!isModerator)return;
  const [list,definitions]=await Promise.all([rkApi.moderatorList(token),rkApi.definitions()]);
  setItems(list.data);setAttrs(definitions.data);},[token,isModerator]);
 useEffect(()=>{void reload().catch(e=>setError('Ошибка загрузки модератора: '+String(e)))},[reload]);
 useEffect(()=>{if(!selected)return;
  setData({ups_name:selected.ups_name,description:selected.description,capacity:selected.capacity,max_current:selected.max_current});
  setValues(Object.fromEntries(selected.attributes.map(a=>[a.id,a.value])));setFile(null);
 },[activeID,selected?.id,selected?.attributes.length,items]);
 const run=async(fn:()=>Promise<unknown>)=>{setBusy(true);setError('');setNotice('');try{await fn();await reload();setNotice('Изменения сохранены.')}catch(e){setError('Не удалось выполнить действие: '+String(e))}finally{setBusy(false)}};
 if(!isAuthenticated)return <section className="page-card"><h1>403 — доступ запрещён</h1><p>Войдите под учётной записью модератора.</p><Link to="/login">Вход</Link></section>;
 if(!isModerator)return <section className="page-card"><h1>403 — доступ запрещён</h1><p>У вашего пользователя нет роли модератора.</p><Link to="/grid">Каталог</Link></section>;
 if(!selected)return <section className="page-card moderator-page">
    <h1>Управление ИБП</h1><p className="muted">Список услуг таблицей; изменение и удаление доступны модератору.</p>
    {error&&<Alert variant="danger">{error}</Alert>}
    {notice&&<Alert variant="success">{notice}</Alert>}
    <Button onClick={()=>nav('/add')}>Добавить услугу</Button>
    <div className="table-scroll"><table className="properties"><thead><tr><th>ID</th><th>Название</th><th>Ёмкость</th><th>Статус</th><th>Действие</th></tr></thead><tbody>
     {items.map(u=><tr key={u.id}><td>{u.id}</td><td>{u.ups_name}</td><td>{u.capacity}</td><td>{u.status}</td><td><button onClick={()=>setParams({edit:String(u.id)})}>Редактировать</button></td></tr>)}
    </tbody></table></div>
   </section>;
 return <section className="page-card moderator-page">
   <button className="subtle-button" onClick={()=>setParams({})}>← Список услуг</button><h1>Редактирование ИБП №{selected.id}</h1>
   {error&&<Alert variant="danger">{error}</Alert>}{notice&&<Alert variant="success">{notice}</Alert>}
   <Form onSubmit={(e:FormEvent)=>{e.preventDefault();if(!token)return;void run(()=>rkApi.update(selected.id,data,token))}}>
    <Form.Group className="mb-2"><Form.Label>Название</Form.Label><Form.Control disabled={busy} required maxLength={100} value={data.ups_name} onChange={e=>setData({...data,ups_name:e.target.value})}/></Form.Group>
    <Form.Group className="mb-2"><Form.Label>Описание</Form.Label><Form.Control as="textarea" rows={2} disabled={busy} required value={data.description} onChange={e=>setData({...data,description:e.target.value})}/></Form.Group>
    <Form.Group className="mb-2"><Form.Label>Ёмкость, А·ч</Form.Label><Form.Control type="number" step="any" min="0.01" disabled={busy} required value={data.capacity} onChange={e=>setData({...data,capacity:Number(e.target.value)})}/></Form.Group>
    <Form.Group className="mb-3"><Form.Label>Максимальный ток, А</Form.Label><Form.Control type="number" step="any" min="0.01" disabled={busy} required value={data.max_current} onChange={e=>setData({...data,max_current:Number(e.target.value)})}/></Form.Group>
    <Button disabled={busy} type="submit">Сохранить основные поля</Button>
   </Form>
   <h2>Дополнительные атрибуты (РК)</h2>
   <p className="muted">Название характеристики едино для всех ИБП. Пустые значения не хранятся в таблице связи.</p>
   <table className="properties"><thead><tr><th>Название атрибута</th><th>Значение</th></tr></thead><tbody>
    {attrs.map(a=><tr key={a.id}><td><input className="form-control" aria-label={`Название атрибута ${a.id}`} defaultValue={a.name} key={`name-${a.id}-${a.name}`} onBlur={e=>{const v=e.target.value.trim();if(token&&v&&v!==a.name)void run(()=>rkApi.renameAttribute(a.id,v,token))}}/>
      <button className="subtle-button danger-link" disabled={busy} onClick={()=>{if(token&&window.confirm(`Удалить атрибут «${a.name}» для всех услуг?`))void run(()=>rkApi.deleteAttribute(a.id,token))}}>Удалить атрибут</button>
     </td><td><input className="form-control" placeholder="Пусто" aria-label={`Значение ${a.name}`} value={values[a.id]??''} onChange={e=>setValues(v=>({...v,[a.id]:e.target.value}))}/>
      <button disabled={busy} className="subtle-button" onClick={()=>{if(token)void run(()=>rkApi.value(selected.id,a.id,values[a.id]||'',token))}}>Сохранить</button>
     </td></tr>)}
   </tbody></table>
   <Form className="mt-3" onSubmit={e=>{e.preventDefault();if(!token||!newName.trim())return;void run(async()=>{await rkApi.createAttribute(newName.trim(),token);setNewName('')})}}>
    <Form.Label>Новая общая характеристика</Form.Label>
    <div className="row-inline"><Form.Control maxLength={100} disabled={busy} placeholder="Например, Время автономии" value={newName} onChange={e=>setNewName(e.target.value)}/><Button disabled={busy||!newName.trim()} type="submit">Добавить</Button></div>
   </Form>
   <h2>Фото и видео (MinIO)</h2>
   <div className="media-mini-list">{(selected.media??[]).map((m:UpsMedia)=><div className="media-mini" key={m.id}>
     {m.kind==='image'?<img src={mediaUrl(m.url)} alt={`Файл ${m.id}`}/>:<video src={mediaUrl(m.url)} muted controls/>}
     <span>#{m.id} · {m.kind}</span><button disabled={busy} onClick={()=>{if(token&&window.confirm('Удалить этот файл?'))void run(()=>rkApi.removeMedia(m.id,token))}}>Удалить</button>
   </div>)}</div>
   <Form onSubmit={e=>{e.preventDefault();if(token&&file)void run(async()=>{await rkApi.addMedia(selected.id,file,token);setFile(null)})}}>
    <Form.Control type="file" accept="image/*,video/*" disabled={busy} onChange={e=>setFile(e.target.files?.[0]??null)}/>
    <Button disabled={!file||busy} type="submit" className="mt-2">Добавить фото/видео</Button>
   </Form>
   <div className="row-inline" style={{marginTop:24}}><Link to={`/detail/${selected.id}`}>Подробнее</Link>
    <Button variant="danger" disabled={busy} onClick={()=>{if(token&&window.confirm('Удалить услугу?'))void run(async()=>{await rkApi.deleteUPS(selected.id,token);setParams({})})}}>Удалить услугу</Button>
   </div>
 </section>;
};
