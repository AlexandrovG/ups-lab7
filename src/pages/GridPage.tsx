import {useEffect} from 'react';
import {useDispatch,useSelector} from 'react-redux';
import {Card,Col,Row,Form,Button,Spinner} from 'react-bootstrap';
import {useNavigate} from 'react-router-dom';
import type {AppDispatch,RootState} from '../store';
import {fetchUpsList,setFilterMin,setFilterMax} from '../slices/upsSlice';
import {pagesDemo,publicAsset} from '../config/runtime';

export const GridPage = () => {
  const dispatch=useDispatch<AppDispatch>();const navigate=useNavigate();
  const {items,loading,filterMinCapacity,filterMaxCapacity,error,source}=useSelector((s:RootState)=>s.uninterruptible_power_supplies);
  useEffect(()=>{void dispatch(fetchUpsList());},[dispatch]);
  const invalid=filterMaxCapacity>0 && filterMinCapacity>filterMaxCapacity;
  return <section className="page-card catalog-page">
    <header className="section-header"><h1>Каталог ИБП</h1><p>Источники бесперебойного питания для офиса</p></header>
    <Form className="capacity-filter" onSubmit={e=>{e.preventDefault();if(!invalid)void dispatch(fetchUpsList());}}>
      <Form.Group><Form.Label>Ёмкость от, А·ч</Form.Label><Form.Control type="number" min="0" step="any" aria-label="Минимальная ёмкость" disabled={loading} placeholder="От" value={filterMinCapacity||''} onChange={e=>dispatch(setFilterMin(Number(e.target.value)))}/></Form.Group>
      <Form.Group><Form.Label>Ёмкость до, А·ч</Form.Label><Form.Control type="number" min="0" step="any" aria-label="Максимальная ёмкость" disabled={loading} placeholder="До" value={filterMaxCapacity||''} onChange={e=>dispatch(setFilterMax(Number(e.target.value)))}/></Form.Group>
      <Button type="submit" disabled={loading||invalid}>Поиск</Button>
    </Form>
    {invalid && <p className="text-danger">Минимальная ёмкость не может быть больше максимальной.</p>}
    {error&&<div role="alert" className="alert alert-danger">{error}</div>}
    {source==='mock'&&<div className="mock-note">{pagesDemo?'GitHub Pages: автономный каталог с mock-данными (без бэкенда).':'Демонстрационный режим: сервер недоступен, показаны mock-данные гостя.'}</div>}
    {loading && !items.length ? <div className="center-loading"><Spinner animation="border"/></div>
      : <Row xs={1} sm={2} lg={3} xl={4} className="g-3 catalog-grid">{items.map(card=><Col key={card.id}>
        <Card className="ups-card" role="link" tabIndex={0} onClick={()=>!loading&&navigate(`/detail/${card.id}`)} onKeyDown={e=>{if(e.key==='Enter'&&!loading)navigate(`/detail/${card.id}`)}}>
          <Card.Img variant="top" src={card.image_url||publicAsset('no-image.png')} alt={card.ups_name} onError={e=>{if(!e.currentTarget.src.endsWith('/no-image.png')) e.currentTarget.src=publicAsset('no-image.png');}}/>
          <Card.Body><Card.Title>{card.ups_name}</Card.Title><Card.Text>Ёмкость: {card.capacity} А·ч</Card.Text><Card.Text>Макс. ток: {card.max_current} А</Card.Text></Card.Body>
        </Card>
      </Col>)}</Row>}
    {!loading&&!error&&items.length===0&&<p className="muted">ИБП по заданному диапазону не найдены.</p>}
  </section>;
};
