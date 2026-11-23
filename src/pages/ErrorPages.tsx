import {Link} from 'react-router-dom';
export const ForbiddenPage=()=> <section className="page-card"><h1>403 — Доступ запрещён</h1><p>Для этого действия у вас недостаточно прав.</p><Link to="/grid">Вернуться в каталог</Link></section>;
export const NotFoundPage=()=> <section className="page-card"><h1>404 — Страница не найдена</h1><p>Проверьте адрес страницы.</p><Link to="/grid">Вернуться в каталог</Link></section>;
