import {useEffect,useState,type FormEvent} from 'react';
import {useDispatch,useSelector} from 'react-redux';
import {useNavigate} from 'react-router-dom';
import {Form,Button,Alert} from 'react-bootstrap';
import type {RootState,AppDispatch} from '../store';
import {fetchUpsDraft,createUpsDraft,publishUps,fetchUpsList} from '../slices/upsSlice';
import {pagesDemo} from '../config/runtime';

export const AddPage=()=>{
  const authenticated=useSelector((s:RootState)=>s.auth.isAuthenticated);
  const {draft,loading}=useSelector((s:RootState)=>s.uninterruptible_power_supplies);
  const dispatch=useDispatch<AppDispatch>();const navigate=useNavigate();
  const [name,setName]=useState('');const [description,setDescription]=useState('');
  const [capacity,setCapacity]=useState('');const [current,setCurrent]=useState('');
  const [image,setImage]=useState<File>();const [video,setVideo]=useState<File>();
  const [error,setError]=useState('');
  useEffect(()=>{if(authenticated)void dispatch(fetchUpsDraft());},[authenticated,dispatch]);
  useEffect(()=>{if(draft)setName(draft.ups_name);},[draft]);
  const submit=async(e:FormEvent)=>{
    e.preventDefault();if(!authenticated||loading)return;
    const c=Number(capacity), m=Number(current);
    if(!name.trim()||!description.trim()||!Number.isFinite(c)||c<=0||!Number.isFinite(m)||m<=0){setError('Введите название, описание, положительные ёмкость и ток.');return;}
    setError('');
    try {
      if(!draft)await dispatch(createUpsDraft(name.trim())).unwrap();
      // Фото/видео загружаются на этапе публикации: ошибка сохранит черновик
      // и позволит повторить запрос без создания второго черновика.
      await dispatch(publishUps({description:description.trim(),capacity:c,max_current:m,image,video})).unwrap();
      await dispatch(fetchUpsList()).unwrap();navigate('/grid');
    }catch(e){setError(String(e));}
  };
  if(pagesDemo) return <section className="page-card"><h1>Добавление ИБП</h1><p className="mock-note">На GitHub Pages используется только mock-режим. Создание услуг доступно в локальном приложении с Go-бэкендом.</p></section>;
  if(!authenticated) return <div className="page-card"><h1>Добавление ИБП</h1><Alert variant="secondary">Для создания услуги выполните вход.</Alert><Button onClick={()=>navigate('/login')}>Войти</Button></div>;
  return <section className="page-card add-page"><h1>Добавление ИБП</h1>
    <p className="muted">Параметры ИБП: ёмкость и максимальный ток.</p>
    {draft&&<div className="mock-note">Найден черновик «{draft.ups_name}». Можно завершить публикацию; название сохранено при создании.</div>}
    {error&&<Alert variant="danger">{error}</Alert>}
    <Form onSubmit={submit}>
      <Form.Group className="mb-3"><Form.Label>Название ИБП</Form.Label><Form.Control required maxLength={100} disabled={loading||!!draft} value={name} onChange={e=>setName(e.target.value)} placeholder="Например, APC Smart-UPS"/></Form.Group>
      <Form.Group className="mb-3"><Form.Label>Описание</Form.Label><Form.Control required as="textarea" rows={3} disabled={loading} value={description} onChange={e=>setDescription(e.target.value)}/></Form.Group>
      <Form.Group className="mb-3"><Form.Label>Ёмкость (А·ч)</Form.Label><Form.Control required type="number" min="0.01" step="any" disabled={loading} value={capacity} onChange={e=>setCapacity(e.target.value)}/></Form.Group>
      <Form.Group className="mb-3"><Form.Label>Максимальный ток (А)</Form.Label><Form.Control required type="number" min="0.01" step="any" disabled={loading} value={current} onChange={e=>setCurrent(e.target.value)}/></Form.Group>
      <Form.Group className="mb-3"><Form.Label>Фото (MinIO)</Form.Label><Form.Control type="file" accept="image/*" disabled={loading} onChange={e=>setImage(e.target.files?.[0])}/></Form.Group>
      <Form.Group className="mb-3"><Form.Label>Видео (необязательно)</Form.Label><Form.Control type="file" accept="video/*" disabled={loading} onChange={e=>setVideo(e.target.files?.[0])}/></Form.Group>
      <Button type="submit" className="w-100" disabled={loading}>{draft?'Опубликовать черновик':'Создать и опубликовать'}</Button>
    </Form>
  </section>;
};
