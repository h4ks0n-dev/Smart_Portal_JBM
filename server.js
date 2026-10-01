const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = __dirname;
const DATA_DIR = path.join(ROOT, 'data');
const DATA = process.env.DATA_FILE || path.join(DATA_DIR, 'db.json');
const PUBLIC = path.join(ROOT, 'public');
const PORT = Number(process.env.PORT || 3000);
const HOST = process.env.HOST || '0.0.0.0';
const COMPANY_DOMAIN = (process.env.COMPANY_EMAIL_DOMAIN || 'jbmech.net').toLowerCase();
const COMPANY_NAME = process.env.COMPANY_NAME || 'JB Mechanical Metal Industries LLC';
const COMPANY_SLOGAN = process.env.COMPANY_SLOGAN || 'Precision in Motion. Expertise at Work.';

const departments = ['Management','HR','Accounts','Sales','Production','Estimation','Admin','IT','Security','Purchase'];
const roles = ['Admin','Management','HR','IT','Department User'];
const sessions = new Map();

const seed = {
  settings: { companyName: COMPANY_NAME, slogan: COMPANY_SLOGAN, emailDomain: COMPANY_DOMAIN },
  users: [
    {id:1,name:'System Administrator',email:'admin@jbmech.net',role:'Admin',department:'IT',password:'Admin@123',active:true},
    {id:2,name:'HR Manager',email:'hr@jbmech.net',role:'HR',department:'HR',password:'HrDepart@26',active:true},
    {id:3,name:'IT Support',email:'it@jbmech.net',role:'IT',department:'IT',password:'ItDepart@26',active:true},
    {id:4,name:'Accounts Department',email:'accounts@jbmech.net',role:'Department User',department:'Accounts',password:'AccDepart@26',active:true},
    {id:5,name:'Sales Department',email:'sales@jbmech.net',role:'Department User',department:'Sales',password:'SalesDep@26',active:true},
    {id:6,name:'Operation Department',email:'operation@jbmech.net',role:'Department User',department:'Operation',password:'OperDep@26',active:true},
    {id:7,name:'Estimation Department',email:'estimation@jbmech.net',role:'Department User',department:'Estimation',password:'EstDep@26',active:true},
    {id:8,name:'Managing Director',email:'biju@jbmech.net',role:'Management',department:'Management',password:'Mdbiju@123',active:true}
  ],
  tickets: [
    {id:'IT-0001',department:'Accounts',requester:'Accounts Department',category:'Printer',problem:'Printer not printing',priority:'Medium',status:'Resolved',assignedTo:'IT Support',description:'Test ticket',createdAt:'2026-09-24T08:10:00Z',updatedAt:'2026-09-24T09:15:00Z'},
    {id:'IT-0002',department:'HR',requester:'HR Manager',category:'Attendance',problem:'Attendance terminal issue',priority:'High',status:'In Progress',assignedTo:'IT Support',description:'Attendance device needs checking',createdAt:'2026-09-24T09:20:00Z',updatedAt:'2026-09-24T10:00:00Z'}
  ],
  assets: [
    {id:'JB-IT-PC-001',type:'Computer',name:'Accounts PC',department:'Accounts',user:'Employee',model:'Dell OptiPlex',serial:'DEMO-001',ip:'192.168.100.101',status:'Active'},
    {id:'PRN-001',type:'Printer',name:'Accounts Printer',department:'Accounts',user:'',model:'HP LaserJet',serial:'PRN-DEMO-001',ip:'192.168.100.201',status:'Operational'},
    {id:'CAM-001',type:'CCTV',name:'Main Entrance',department:'Security',user:'',model:'Hikvision',serial:'CAM-DEMO-001',ip:'192.168.100.242',status:'Active'},
    {id:'SW-001',type:'Network',name:'Main Switch',department:'IT',user:'',model:'Managed Switch',serial:'SW-DEMO-001',ip:'192.168.100.2',status:'Active'}
  ],
  purchases: [
    {id:'PR-0001',item:'HP Toner',quantity:2,department:'Accounts',estimatedCost:480,reason:'Printer toner required',urgency:'Normal',status:'Pending Department Approval',requester:'Accounts Department',createdAt:'2026-09-24T07:30:00Z'}
  ],
  employees: [],
  maintenance: [
    {id:'MNT-0001',assetType:'CCTV',title:'Monthly CCTV health check',frequency:'Monthly',nextDue:'2026-10-01',owner:'IT',status:'Scheduled'},
    {id:'MNT-0002',assetType:'Computer',title:'Windows / Defender / disk health check',frequency:'Monthly',nextDue:'2026-10-05',owner:'IT',status:'Scheduled'},
    {id:'MNT-0003',assetType:'Printer',title:'Printer test / toner / cleaning',frequency:'Monthly',nextDue:'2026-10-07',owner:'IT',status:'Scheduled'}
  ],
  inventory: [
    {id:'INV-0001',item:'Printer Paper',category:'Stationery',quantity:20,minQuantity:10,unit:'reams'},
    {id:'INV-0002',item:'HP Toner',category:'Printer Consumable',quantity:2,minQuantity:3,unit:'pcs'},
    {id:'INV-0003',item:'LAN Cable Cat6',category:'IT Consumable',quantity:12,minQuantity:5,unit:'pcs'},
    {id:'INV-0004',item:'RJ45 Connector',category:'IT Consumable',quantity:18,minQuantity:10,unit:'pcs'}
  ]
};

function ensureDb(){
  if(!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR,{recursive:true});
  if(!fs.existsSync(DATA)) fs.writeFileSync(DATA, JSON.stringify(seed,null,2));
}
function readDb(){ ensureDb(); const db=JSON.parse(fs.readFileSync(DATA,'utf8')); db.settings ||= seed.settings; db.employees ||= []; db.maintenance ||= seed.maintenance; db.inventory ||= seed.inventory; return db; }
function writeDb(db){ fs.writeFileSync(DATA, JSON.stringify(db,null,2)); }
function json(res, code, body, extra={}){ res.writeHead(code, {'Content-Type':'application/json','Cache-Control':'no-store',...extra}); res.end(JSON.stringify(body)); }
function body(req){ return new Promise((resolve,reject)=>{let b=''; req.on('data',c=>{b+=c;if(b.length>2_000_000) req.destroy()}); req.on('end',()=>{try{resolve(b?JSON.parse(b):{})}catch(e){reject(e)}})}); }
function nextId(prefix, arr){ const n=arr.reduce((m,x)=>{const q=String(x.id).match(/(\d+)$/);return Math.max(m,q?+q[1]:0)},0)+1; return prefix+String(n).padStart(4,'0'); }
function safeUser(u){ return {id:u.id,name:u.name,email:u.email,role:u.role,department:u.department,active:u.active!==false}; }
function parseCookies(req){ const out={}; for(const part of String(req.headers.cookie||'').split(';')){const [k,...v]=part.trim().split('=');if(k)out[k]=decodeURIComponent(v.join('='));} return out; }
function currentUser(req){ const token=parseCookies(req).jb_session; return token ? sessions.get(token) : null; }
function requireAuth(req,res){ const u=currentUser(req); if(!u){json(res,401,{error:'Authentication required'});return null;} return u; }
function canSeeAll(u){ return ['Admin','Management','HR','IT'].includes(u.role); }
function canManageUsers(u){ return ['Admin'].includes(u.role); }
function filterByUser(arr,u){ return canSeeAll(u) ? arr : arr.filter(x=>x.department===u.department || x.requester===u.name); }
function passwordHash(p){ return crypto.createHash('sha256').update(String(p)).digest('hex'); }

function staticFile(req,res){
  let p = new URL(req.url,'http://localhost').pathname;
  if(p === '/') p='/index.html';
  p = path.normalize(p).replace(/^\.\.(\/|\\)/,'');
  const file=path.join(PUBLIC,p);
  if(!file.startsWith(PUBLIC) || !fs.existsSync(file) || fs.statSync(file).isDirectory()){ res.writeHead(404); return res.end('Not found'); }
  const ext=path.extname(file); const types={'.html':'text/html','.css':'text/css','.js':'application/javascript','.svg':'image/svg+xml','.png':'image/png','.ico':'image/x-icon'};
  res.writeHead(200,{'Content-Type':types[ext]||'application/octet-stream','Cache-Control':'no-cache'}); fs.createReadStream(file).pipe(res);
}

const server=http.createServer(async(req,res)=>{
  if(req.method==='OPTIONS'){res.writeHead(204,{'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'Content-Type','Access-Control-Allow-Methods':'GET,POST,PATCH,DELETE,OPTIONS'});return res.end();}
  const url=new URL(req.url,'http://localhost');
  try{
    if(url.pathname==='/api/health' && req.method==='GET') return json(res,200,{ok:true,company:COMPANY_NAME,time:new Date().toISOString()});

    if(url.pathname==='/api/config' && req.method==='GET') return json(res,200,{companyName:COMPANY_NAME,slogan:COMPANY_SLOGAN,emailDomain:COMPANY_DOMAIN,departments});

    if(url.pathname==='/api/login' && req.method==='POST'){
      const b=await body(req), db=readDb();
      const email=String(b.email||'').trim().toLowerCase();
      const u=db.users.find(x=>x.email.toLowerCase()===email&&x.password===b.password&&x.active!==false);
      if(!u) return json(res,401,{error:'Invalid company email or password'});
      if(!email.endsWith('@'+COMPANY_DOMAIN)) return json(res,403,{error:`Use your @${COMPANY_DOMAIN} company account`});
      const token=crypto.randomBytes(32).toString('hex'); sessions.set(token,safeUser(u));
      res.setHeader('Set-Cookie',`jb_session=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=28800`);
      return json(res,200,{user:safeUser(u)});
    }
    if(url.pathname==='/api/logout' && req.method==='POST'){
      const token=parseCookies(req).jb_session; if(token) sessions.delete(token);
      res.setHeader('Set-Cookie','jb_session=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0'); return json(res,200,{ok:true});
    }
    if(url.pathname==='/api/me' && req.method==='GET'){
      const u=requireAuth(req,res); if(!u)return; return json(res,200,{user:u});
    }

    // Public frontend assets must be served before authentication.
    // API routes above remain protected where appropriate.
    if(!url.pathname.startsWith('/api/')) return staticFile(req,res);

    const u=requireAuth(req,res); if(!u)return;
    const db=readDb();

    if(url.pathname==='/api/dashboard' && req.method==='GET'){
      const tickets=filterByUser(db.tickets,u), purchases=filterByUser(db.purchases,u), assets=canSeeAll(u)?db.assets:db.assets.filter(x=>x.department===u.department);
      return json(res,200,{tickets:tickets.length,openRequests:tickets.filter(x=>!['Resolved','Closed'].includes(x.status)).length,pendingApprovals:purchases.filter(x=>x.status.toLowerCase().includes('approval')).length,purchases:purchases.filter(x=>!['Received','Closed'].includes(x.status)).length,assets:assets.length,lowStock:db.inventory.filter(x=>Number(x.quantity)<=Number(x.minQuantity)).length,highPriority:tickets.filter(x=>['High','Critical'].includes(x.priority)).length,completedToday:tickets.filter(x=>['Resolved','Closed'].includes(x.status)).length});
    }

    if(url.pathname==='/api/maintenance' && req.method==='GET') return json(res,200,db.maintenance);
    if(url.pathname==='/api/inventory' && req.method==='GET') return json(res,200,db.inventory);
    if(url.pathname==='/api/inventory' && req.method==='POST'){
      if(!['Admin','IT','Management'].includes(u.role)) return json(res,403,{error:'Admin/IT/Management access required'});
      const b=await body(req); const item={id:nextId('INV-',db.inventory),item:b.item||'',category:b.category||'General',quantity:Number(b.quantity||0),minQuantity:Number(b.minQuantity||0),unit:b.unit||'pcs'};
      db.inventory.unshift(item); writeDb(db); return json(res,201,item);
    }
    if(url.pathname==='/api/change-password' && req.method==='POST'){
      const b=await body(req); const me=db.users.find(x=>x.id===u.id);
      if(!me || me.password!==String(b.currentPassword||'')) return json(res,400,{error:'Current password is incorrect'});
      if(String(b.newPassword||'').length < 10) return json(res,400,{error:'New password must be at least 10 characters'});
      me.password=String(b.newPassword); writeDb(db); return json(res,200,{ok:true});
    }
    if(url.pathname==='/api/users' && req.method==='GET'){
      if(!canManageUsers(u)) return json(res,403,{error:'Admin access required'}); return json(res,200,db.users.map(safeUser));
    }
    if(url.pathname==='/api/users' && req.method==='POST'){
      if(!canManageUsers(u)) return json(res,403,{error:'Admin access required'});
      const b=await body(req), email=String(b.email||'').trim().toLowerCase();
      if(!email.endsWith('@'+COMPANY_DOMAIN)) return json(res,400,{error:`Email must use @${COMPANY_DOMAIN}`});
      if(db.users.some(x=>x.email.toLowerCase()===email)) return json(res,409,{error:'User already exists'});
      const item={id:Date.now(),name:String(b.name||'New User'),email,role:b.role||'Department User',department:b.department||'Admin',password:String(b.password||'ChangeMe123!'),active:true};
      db.users.push(item); writeDb(db); return json(res,201,safeUser(item));
    }

    const collections={tickets:'tickets',assets:'assets',purchases:'purchases'};
    for(const [route,key] of Object.entries(collections)){
      if(url.pathname===`/api/${route}` && req.method==='GET') return json(res,200,filterByUser(db[key],u));
      if(url.pathname===`/api/${route}` && req.method==='POST'){
        const b=await body(req); let item;
        if(key==='tickets'){
          const department=canSeeAll(u)&&b.department?b.department:u.department;
          item={id:nextId('IT-',db.tickets),department,requester:u.name,requesterEmail:u.email,category:b.category||'Other',problem:b.problem||'',priority:b.priority||'Medium',status:'New',assignedTo:'',description:b.description||'',createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()};
        }
        if(key==='assets'){
          if(!['Admin','IT'].includes(u.role)) return json(res,403,{error:'IT/Admin access required'});
          item={id:b.id||nextId('AS-',db.assets),type:b.type||'Computer',name:b.name||'',department:b.department||'',user:b.user||'',model:b.model||'',serial:b.serial||'',ip:b.ip||'',status:b.status||'Active'};
        }
        if(key==='purchases'){
          const department=canSeeAll(u)&&b.department?b.department:u.department;
          item={id:nextId('PR-',db.purchases),item:b.item||'',quantity:Number(b.quantity||1),department,estimatedCost:Number(b.estimatedCost||0),reason:b.reason||'',urgency:b.urgency||'Normal',status:'Pending Department Approval',requester:u.name,requesterEmail:u.email,createdAt:new Date().toISOString()};
        }
        db[key].unshift(item); writeDb(db); return json(res,201,item);
      }
    }
    const match=url.pathname.match(/^\/api\/(tickets|assets|purchases)\/([^/]+)$/);
    if(match && req.method==='PATCH'){
      const [,key,id]=match, b=await body(req), arr=db[key], item=arr.find(x=>x.id===id); if(!item)return json(res,404,{error:'Not found'});
      if(!canSeeAll(u) && item.department!==u.department) return json(res,403,{error:'Access denied'});
      if(key==='tickets' && !['Admin','IT','Management'].includes(u.role) && ['status','assignedTo'].some(k=>k in b)) return json(res,403,{error:'IT/Management access required'});
      if(key==='purchases' && ['status'].some(k=>k in b) && !['Admin','Management','HR','IT'].includes(u.role)) return json(res,403,{error:'Management/HR/IT access required'});
      Object.assign(item,b); item.updatedAt=new Date().toISOString(); writeDb(db); return json(res,200,item);
    }

    if(url.pathname==='/api/employees' && req.method==='GET') return json(res,200,canSeeAll(u)?db.employees:[]);
    if(url.pathname==='/api/employees' && req.method==='POST'){
      if(!['Admin','HR','IT'].includes(u.role)) return json(res,403,{error:'HR/Admin/IT access required'});
      const b=await body(req); const item={id:nextId('EMP-',db.employees),name:b.name||'',department:b.department||'',designation:b.designation||'',joiningDate:b.joiningDate||'',status:'Onboarding',checklist:{pc:false,email:false,network:false,printer:false,software:false,accessCard:false,training:false}}; db.employees.unshift(item); writeDb(db); return json(res,201,item);
    }
    if(url.pathname==='/api/settings' && req.method==='GET') return json(res,200,db.settings);

    return json(res,404,{error:'API endpoint not found'});
  }catch(e){ console.error(e); json(res,500,{error:e.message}); }
});

ensureDb();
server.listen(PORT,HOST,()=>console.log(`${COMPANY_NAME} — ${COMPANY_SLOGAN}`),);
