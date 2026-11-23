import {useState,type FormEvent} from 'react';
import axios from 'axios';
import {useDispatch,useSelector} from 'react-redux';
import {useNavigate} from 'react-router-dom';
import {Form,Button,Alert} from 'react-bootstrap';
import {loginStarted,loginSuccess,loginFailed} from '../slices/authSlice';
import type {AppDispatch,RootState} from '../store';
import {pagesDemo} from '../config/runtime';

export const LoginPage = () => {
  const [login,setLogin]=useState('');
  const [password,setPassword]=useState('');
  const {loading,error,isAuthenticated}=useSelector((s:RootState)=>s.auth);
  const dispatch=useDispatch<AppDispatch>();
  const navigate=useNavigate();
  const handleLogin=async (e:FormEvent)=>{
    e.preventDefault();
    dispatch(loginStarted());
    try {
      // Только Axios (НЕ codegen и НЕ thunk). /api перенаправляется Vite Proxy.
      const response=await axios.post<{access_token:string;user_id:number;is_moderator:boolean}>('/api/auth/login',{login,password});
      const token=response.data.access_token;
      const userID=Number(response.data.user_id);
      if(!token || !Number.isInteger(userID) || userID<=0) throw new Error('Некорректный ответ сервера');
      localStorage.setItem('token',token);  // Остаётся после F5 для показа в Application.
      localStorage.setItem('userID',String(userID));
      dispatch(loginSuccess({userID,token,isModerator:!!response.data.is_moderator}));  // Redux задаётся вручную.
      navigate('/grid');
    } catch {
      dispatch(loginFailed('Ошибка входа. Проверьте логин, пароль и доступность бэкенда.'));
    }
  };
  if (pagesDemo) return <section className="page-card login-page"><h1>Вход</h1><p className="mock-note">GitHub Pages работает только с mock-данными. Авторизация и создание услуг доступны по HTTPS на ноутбуке с запущенным Go-бэкендом.</p></section>;
  if(isAuthenticated) return <div className="page-card"><h1>Вы уже вошли</h1><Button onClick={()=>navigate('/grid')}>В каталог</Button></div>;
  return <div className="page-card login-page"><h1>Вход в систему</h1><p className="muted">Каталог источников бесперебойного питания</p>
    {error&&<Alert variant="danger">{error}</Alert>}
    <Form onSubmit={handleLogin}>
      <Form.Group className="mb-3"><Form.Label>Логин</Form.Label><Form.Control required value={login} disabled={loading} onChange={e=>setLogin(e.target.value)} autoComplete="username"/></Form.Group>
      <Form.Group className="mb-3"><Form.Label>Пароль</Form.Label><Form.Control required type="password" value={password} disabled={loading} onChange={e=>setPassword(e.target.value)} autoComplete="current-password"/></Form.Group>
      <Button type="submit" disabled={loading} className="w-100">Войти</Button>
    </Form>
  </div>;
};
