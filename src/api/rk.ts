// Typed additions to the generated Swagger client, for RK-specific endpoints.
// Existing service-list and draft operations still use the generated Api.ts in Redux thunks.
import axios from 'axios';
import type {UpsItem} from '../mock';
import {mediaUrl} from './media';

export interface AttributeDefinition {id:number;name:string}
export interface MediaFile {id:number;ups_id:number;url:string;kind:'image'|'video';created_at?:string}
export type ServiceDetail = UpsItem;
export const authConfig = (token:string|null) => ({headers:token?{Authorization:`Bearer ${token}`}:{}});
const API='/api';
type BackendAttribute={id?:number;attribute_id?:number;value?:string;attribute?:{name?:string}};
type BackendUPS=Omit<UpsItem,'attributes'|'media'> & {attributes?:BackendAttribute[];media?:Array<{id:number;ups_id:number;url:string;kind:'image'|'video'}>};
function asUPS(x:BackendUPS):UpsItem{return {...x,
  image_url:mediaUrl(x.image_url),video_url:x.video_url?mediaUrl(x.video_url):'',
  attributes:(x.attributes??[]).map(a=>({id:a.attribute_id??a.id??0,name:a.attribute?.name??'',value:a.value??''})),
  media:(x.media??[]).map(m=>({...m,url:mediaUrl(m.url)}))};}
export const rkApi={
  detail:(id:number,token:string|null)=>axios.get<BackendUPS>(`${API}/uninterruptible-power-supplies/${id}`,authConfig(token)).then(r=>({...r,data:asUPS(r.data)})),
  recent:()=>axios.get<BackendUPS[]>(`${API}/uninterruptible-power-supplies`,{params:{recent:true}}).then(r=>({...r,data:r.data.map(asUPS)})),
  definitions:()=>axios.get<AttributeDefinition[]>(`${API}/attributes`),
  moderatorList:(token:string)=>axios.get<BackendUPS[]>(`${API}/moderator/uninterruptible-power-supplies`,authConfig(token)).then(r=>({...r,data:r.data.map(asUPS)})),
  createAttribute:(name:string,token:string)=>axios.post<AttributeDefinition>(`${API}/attributes`,{name},authConfig(token)),
  renameAttribute:(id:number,name:string,token:string)=>axios.patch(`${API}/attributes/${id}`,{name},authConfig(token)),
  deleteAttribute:(id:number,token:string)=>axios.delete(`${API}/attributes/${id}`,authConfig(token)),
  value:(upsID:number,attributeID:number,value:string,token:string)=>axios.put(`${API}/uninterruptible-power-supplies/${upsID}/attributes/${attributeID}`,{value},authConfig(token)),
  update:(id:number,data:Pick<UpsItem,'ups_name'|'description'|'capacity'|'max_current'>,token:string)=>axios.put(`${API}/uninterruptible-power-supplies/${id}`,data,authConfig(token)),
  deleteUPS:(id:number,token:string)=>axios.delete(`${API}/moderator/uninterruptible-power-supplies/${id}`,authConfig(token)),
  addMedia:(id:number,file:File,token:string)=>{const form=new FormData();form.append('file',file);return axios.post<MediaFile>(`${API}/uninterruptible-power-supplies/${id}/media`,form,authConfig(token));},
  removeMedia:(id:number,token:string)=>axios.delete(`${API}/media/${id}`,authConfig(token)),
};
