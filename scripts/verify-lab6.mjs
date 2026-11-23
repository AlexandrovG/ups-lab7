// Integration smoke test: run only AFTER Go, PostgreSQL, Redis, MinIO and Vite are started.
// Checks the real Vite /api and /s3 proxy, CRUD, JWT, capacity filter and image replacement across records.
import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';

const host = process.env.LAB6_URL ?? 'http://127.0.0.1:5173';
let token = '';
const results=[];
async function request(path,{method='GET',body,withToken=false}={}){
 const headers = {};
 if(withToken) headers.Authorization=`Bearer ${token}`;
 if(body && !(body instanceof FormData)) {headers['Content-Type']='application/json';body=JSON.stringify(body);}
 const response=await fetch(host+path,{method,body,headers});
 let value;
 if(response.status!==204){const text=await response.text();try {value=JSON.parse(text);}catch {value=text;}}
 return {status:response.status,value,headers:response.headers};
}
function ok(condition,message){if(!condition)throw new Error(message);results.push('OK '+message);}
async function makeForm(name,pathToImg){
 const form = new FormData();
 if(name) form.append('ups_name',name);
 if(pathToImg) form.append('image',new Blob([await readFile(pathToImg)],{type:'image/jpeg'}),'proof.jpg');
 return form;
}
const username='lab6_check_'+Date.now();const password='check-only-DoNotReuse-123';
const created=[];
try{
 const guest=await request('/api/uninterruptible-power-supplies');
 ok(guest.status===200 && Array.isArray(guest.value),'Guest catalogue returns JSON through /api');
 const registered=await request('/api/auth/register',{method:'POST',body:{login:username,password}});
 ok(registered.status===201,`Register test user (HTTP ${registered.status})`);
 const login=await request('/api/auth/login',{method:'POST',body:{login:username,password}});
 ok(login.status===200 && !!login.value?.access_token && login.value?.user_id>0,'Login returns JWT and user_id');
 token=login.value.access_token;
 for(const [idx,imagePath] of [resolve('public/1.jpg'),resolve('public/router.jpg')].entries()){
   const name='TEST UPS LAB6 '+username+' '+idx;
   const draft=await request('/api/uninterruptible-power-supplies',{method:'POST',withToken:true,body:await makeForm(name)});
   ok(draft.status===201,`Create draft ${idx+1} via API`);
   const form=new FormData();form.append('description','Автоматический интеграционный тест');
   form.append('capacity',String(1200+idx*100));form.append('max_current','7.5');
   form.append('image',new Blob([await readFile(imagePath)],{type:'image/jpeg'}),`image-${idx}.jpg`);
   const published=await request('/api/uninterruptible-power-supplies/publish',{method:'PUT',body:form,withToken:true});
   ok(published.status===200&&published.value?.id>0,`Publish ${idx+1} with actual MinIO image`);
   const item=published.value;created.push(item);
   const imgPath='/s3'+new URL(item.image_url).pathname;
   const img=await fetch(host+imgPath);
   ok(img.status===200 && img.headers.get('content-type')?.startsWith('image/'),`S3 image ${idx+1} via second proxy route`);
 }
 ok(created[0].image_url!==created[1].image_url,'New pictures have different URLs');
 const all=await request('/api/uninterruptible-power-supplies?min_capacity=1300&max_capacity=1300',{withToken:true});
 ok(all.status===200&&all.value.some(x=>x.id===created[1].id)&&!all.value.some(x=>x.id===created[0].id),'Capacity filter runs in backend and returns matching object');
 const mine=all.value.find(x=>x.id===created[1].id);
 ok(mine.is_creator===true,'Owner flag is_creator is present for JWT user');
 const like=await request(`/api/uninterruptible-power-supplies/${created[1].id}/like`,{method:'POST',withToken:true,body:{value:1}});
 ok(like.status===204,'Like saved');
 const liked=await request('/api/uninterruptible-power-supplies',{withToken:true});
 ok(liked.value.find(x=>x.id===created[1].id)?.is_liked===true,'Like reflected in subsequent API response');
 const unlike=await request(`/api/uninterruptible-power-supplies/${created[1].id}/like`,{method:'POST',withToken:true,body:{value:0}});
 ok(unlike.status===204,'Unlike saved');
 for(const item of created){const deleted=await request(`/api/uninterruptible-power-supplies/${item.id}`,{method:'DELETE',withToken:true});ok(deleted.status===204,`Delete owned UPS ${item.id}`);}
 const logout=await request('/api/auth/logout',{method:'POST',withToken:true});
 ok(logout.status===200,'Logout blacklists token');
 const noRights=await request('/api/uninterruptible-power-supplies/draft',{withToken:true});
 ok(noRights.status===403,'Revoked token cannot access protected endpoint');
 console.log('\nLAB6 INTEGRATION CHECK: '+results.length+' checks passed');
 results.forEach(x=>console.log(x));
}catch(error){console.error('\nLAB6 INTEGRATION CHECK FAILED: '+error.message);results.forEach(x=>console.log(x));process.exitCode=1;}
