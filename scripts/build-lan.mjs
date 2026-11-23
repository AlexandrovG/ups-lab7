import {spawnSync} from 'node:child_process';
const windows = process.platform === 'win32';
const command = windows ? 'cmd.exe' : 'npm';
const args = windows ? ['/d','/s','/c','npm run build'] : ['run','build'];
const r=spawnSync(command,args,{stdio:'inherit',env:{...process.env,VITE_DEMO_MODE:'0',VITE_BASE_PATH:'/'}});
if(r.error) throw r.error;
process.exit(r.status??1);
