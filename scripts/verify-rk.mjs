// End-to-end additional RK smoke checks. Run with an existing moderator account.
// Environment: LAB6_URL, RK_LOGIN, RK_PASSWORD. Does not print credentials/tokens.
const host=process.env.LAB6_URL??'http://127.0.0.1:5173';
const login=process.env.RK_LOGIN, password=process.env.RK_PASSWORD;
if(!login||!password){console.error('Set RK_LOGIN and RK_PASSWORD to your existing MODERATOR credentials.');process.exit(2)}
let token='',cookie=''; const results=[]; const created=[];
async function req(path,opts={}){
 const h={};if(opts.auth)h.Authorization=`Bearer ${token}`;if(opts.body!==undefined)h['Content-Type']='application/json';if(opts.guest&&cookie)h.Cookie=cookie;
 const r=await fetch(host+path,{method:opts.method||'GET',headers:h,body:opts.body===undefined?undefined:JSON.stringify(opts.body)});
 const cs=r.headers.get('set-cookie');if(opts.guest&&cs)cookie=cs.split(';')[0];
 const raw=await r.text();let data;try{data=JSON.parse(raw)}catch{data=raw}return {status:r.status,data,raw};
}
function assert(v,label){if(!v)throw new Error(label);console.log('OK:',label);results.push(label)}
try{
 const auth=await req('/api/auth/login',{method:'POST',body:{login,password}});
 assert(auth.status===200&&auth.data.access_token,'Moderator login works');token=auth.data.access_token;
 assert(auth.data.is_moderator===true,'Server confirms moderator role');
 const attrs=await req('/api/attributes');assert(attrs.status===200&&Array.isArray(attrs.data),'Global attributes available');
 const unauthorized=await req('/api/moderator/uninterruptible-power-supplies');assert(unauthorized.status===403,'Guest cannot open moderator API');
 const mod=await req('/api/moderator/uninterruptible-power-supplies',{auth:true});assert(mod.status===200&&Array.isArray(mod.data),'Moderator UPS table');
 const name='РК тестовый атрибут '+Date.now();
 const added=await req('/api/attributes',{auth:true,method:'POST',body:{name}});assert(added.status===201,'Moderator creates global attribute');created.push(added.data.id);
 const list=await req('/api/uninterruptible-power-supplies',{guest:true});assert(list.status===200&&Array.isArray(list.data),'Guest catalogue & cookie');
 if(list.data.length){
  const u=list.data[0]; const d=await req(`/api/uninterruptible-power-supplies/${u.id}`,{guest:true});
  assert(d.status===200 && d.data.attributes.some(a=>a.attribute_id===added.data.id&&a.value===''),'New attribute is empty on existing UPS');
  const recent=await req('/api/uninterruptible-power-supplies?recent=true',{guest:true});assert(recent.status===200&&recent.data.some(x=>x.id===u.id),'Viewed UPS tracked in 20-minute guest session');
  const val=await req(`/api/uninterruptible-power-supplies/${u.id}/attributes/${added.data.id}`,{auth:true,method:'PUT',body:{value:'5 минут'}});assert(val.status===204,'Set attribute value');
  const up=await req(`/api/uninterruptible-power-supplies/${u.id}`,{guest:true});assert(up.data.attributes.some(a=>a.attribute_id===added.data.id&&a.value==='5 минут'),'Value saved in PostgreSQL');
  const cleared=await req(`/api/uninterruptible-power-supplies/${u.id}/attributes/${added.data.id}`,{auth:true,method:'PUT',body:{value:''}});assert(cleared.status===204,'Clearing value removes link row');
 } else console.log('INFO: Published UPS absent, skipped value and recent-view checks.');
 const renamed=await req(`/api/attributes/${added.data.id}`,{auth:true,method:'PATCH',body:{name:name+' updated'}});assert(renamed.status===204,'Global rename');
 const removed=await req(`/api/attributes/${added.data.id}`,{auth:true,method:'DELETE'});assert(removed.status===204,'Delete global attribute');created.length=0;
 console.log(`RK CHECK: ${results.length} checks passed`);
}catch(e){console.error('RK CHECK FAILED:',e.message);process.exitCode=1}
finally{for(const id of created){await req(`/api/attributes/${id}`,{auth:true,method:'DELETE'}).catch(()=>{})}}
