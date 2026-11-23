import {useState} from 'react';
import {Outlet, NavLink, useNavigate} from 'react-router-dom';
import {useDispatch, useSelector} from 'react-redux';
import axios from 'axios';
import type {RootState,AppDispatch} from '../store';
import {logout} from '../slices/authSlice';
import {resetFilters, fetchUpsList} from '../slices/upsSlice';
import {pagesDemo} from '../config/runtime';

export const AppLayout = () => {
  const {isAuthenticated, isModerator, token, loading:loginLoading} = useSelector((s:RootState)=>s.auth);
  const requests = useSelector((s:RootState)=>s.uninterruptible_power_supplies.pendingRequests);
  const dispatch=useDispatch<AppDispatch>();
  const navigate=useNavigate();
  const [loggingOut,setLoggingOut]=useState(false);
  const busy=!!(requests || loginLoading || loggingOut);
  const handleLogout=async()=>{
    if(!token || loggingOut) return;
    setLoggingOut(true);
    try {
      // Авторизация / деавторизация: только обычный axios, БЕЗ thunk и кодогенерации.
      await axios.post('/api/auth/logout', {}, {headers:{Authorization:`Bearer ${token}`}});
      localStorage.removeItem('token');
      localStorage.removeItem('userID');
      dispatch(logout());
      dispatch(resetFilters());
      navigate('/grid');
      void dispatch(fetchUpsList());
    } catch {
      window.alert('Не удалось завершить сессию. Повторите попытку.');
    } finally {setLoggingOut(false);}
  };
  return <div className="app-shell">
    <main className="page-content"><Outlet/></main>
    <nav className="bottom-nav" aria-label="Главная навигация">
      <NavLink to="/" aria-disabled={busy} tabIndex={busy?-1:0} onClick={e=>busy&&e.preventDefault()}>Лента</NavLink>
      {!pagesDemo&&<NavLink to="/add" aria-disabled={busy} tabIndex={busy?-1:0} onClick={e=>busy&&e.preventDefault()}>Добавление</NavLink>}
      <NavLink to="/grid" aria-disabled={busy} tabIndex={busy?-1:0} onClick={e=>busy&&e.preventDefault()}>Плитка</NavLink>
      {!pagesDemo&&isAuthenticated&&isModerator&&<NavLink to="/moderator" aria-disabled={busy} tabIndex={busy?-1:0} onClick={e=>busy&&e.preventDefault()}>Модератор</NavLink>}
      {!pagesDemo&&(isAuthenticated ? <button type="button" disabled={busy} onClick={handleLogout}>Выход</button>
        : <NavLink to="/login" aria-disabled={busy} tabIndex={busy?-1:0} onClick={e=>busy&&e.preventDefault()}>Вход</NavLink>)}
    </nav>
    {busy && <div className="request-blocker" role="status" aria-label="Выполняется запрос">
      <div className="loading-panel"><span className="busy-wheel"/> Выполняется запрос…</div>
    </div>}
  </div>;
};
