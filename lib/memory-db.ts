// Cloudflare D1 veya Supabase bağlantısı henüz hazır olmadığında (veya yer tutucu D1 binding hatasında)
// uygulamanın hiçbir zaman 503 ("Arşiv bağlantısı henüz hazır değil") vermemesi için bellek içi D1 ve R2 yedeği.

type Row=Record<string,unknown>;
const tables=new Map<string,Row[]>();
const blobs=new Map<string,{data:Uint8Array;contentType:string}>();

function getTable(name:string):Row[]{
 const k=name.toLowerCase();
 let t=tables.get(k);
 if(!t){t=[];tables.set(k,t)}
 return t;
}

function matchConds(row:Row,whereRaw:string|undefined,params:unknown[],startIdx=0):{ok:boolean;nextIdx:number}{
 if(!whereRaw)return {ok:true,nextIdx:startIdx};
 let pIdx=startIdx;
 for(const cond of whereRaw.split(/\s+AND\s+/i)){
  const c=cond.trim();
  let m=/^(\w+)\s*=\s*\?$/.exec(c);
  if(m){if(String(row[m[1]]??'')!==String(params[pIdx++]??''))return {ok:false,nextIdx:pIdx};continue}
  m=/^(\w+)\s*<\s*\?$/.exec(c);
  if(m){if(!(String(row[m[1]]??'')<String(params[pIdx++]??'')))return {ok:false,nextIdx:pIdx};continue}
  m=/^(\w+)\s*>\s*\?$/.exec(c);
  if(m){if(!(String(row[m[1]]??'')>String(params[pIdx++]??'')))return {ok:false,nextIdx:pIdx};continue}
  m=/^(\w+)\s*<>\s*\?$/.exec(c);
  if(m){if(String(row[m[1]]??'')===String(params[pIdx++]??''))return {ok:false,nextIdx:pIdx};continue}
  m=/^(\w+)\s+IS\s+NOT\s+NULL$/i.exec(c);
  if(m){if(row[m[1]]===null||row[m[1]]===undefined)return {ok:false,nextIdx:pIdx};continue}
 }
 return {ok:true,nextIdx:pIdx};
}

function execMemorySql(rawSql:string,params:unknown[],mode:'first'|'all'|'run'):{results:Row[];meta:{changes:number}}{
 const sql=rawSql.trim().replace(/\s+/g,' ');
 if(/^(CREATE|ALTER|DROP|PRAGMA)\b/i.test(sql))return {results:[],meta:{changes:0}};

 // 1. Oturum birleştirme sorgusu (sessions JOIN users)
 if(/FROM sessions s JOIN users u/i.test(sql)){
  const [sid,nowIso]=params;
  const sessions=getTable('sessions');
  const users=getTable('users');
  const sess=sessions.find(s=>String(s.id)===String(sid)&&String(s.expires_at)>String(nowIso));
  if(!sess)return {results:[],meta:{changes:0}};
  const u=users.find(x=>String(x.id)===String(sess.user_id));
  if(!u)return {results:[],meta:{changes:0}};
  const sortedUsers=[...users].sort((a,b)=>String(a.created_at||'').localeCompare(String(b.created_at||'')));
  const first=sortedUsers.length>0&&sortedUsers[0].id===u.id?1:0;
  return {
   results:[{
    ...u,
    session_tenant_id:sess.tenant_id||null,
    sb_access_token:sess.sb_access_token||null,
    sb_refresh_token:sess.sb_refresh_token||null,
    first
   }],
   meta:{changes:0}
  };
 }

 // 2. SELECT COUNT(*) AS n FROM users
 if(/^SELECT COUNT\(\*\)\s+AS\s+n\s+FROM\s+users$/i.test(sql)){
  return {results:[{n:getTable('users').length}],meta:{changes:0}};
 }

 // 3. auth_attempts upsert
 if(/^INSERT INTO auth_attempts/i.test(sql)){
  const [key,resetIso,nowIso]=params as [string,string,string];
  const rows=getTable('auth_attempts');
  const existing=rows.find(r=>String(r.key)===String(key));
  if(!existing){
   rows.push({key,count:1,reset_at:resetIso});
  }else if(String(existing.reset_at)<String(nowIso)){
   existing.count=1;
   existing.reset_at=resetIso;
  }else{
   existing.count=Number(existing.count||0)+1;
  }
  return {results:[],meta:{changes:1}};
 }

 // 4. ai_usage artırma / azaltma
 if(/^INSERT INTO ai_usage/i.test(sql)){
  const [user_id,day,kind,limit]=params as [string,string,string,number];
  const rows=getTable('ai_usage');
  const existing=rows.find(r=>r.user_id===user_id&&r.day===day&&r.kind===kind);
  const cur=Number(existing?.count||0);
  if(existing&&cur>=Number(limit))return {results:[],meta:{changes:0}};
  if(existing)existing.count=cur+1;
  else rows.push({user_id,day,kind,count:1});
  return {results:[],meta:{changes:1}};
 }
 if(/^UPDATE ai_usage SET count=MAX\(count-1,0\)/i.test(sql)){
  const [user_id,day,kind]=params as [string,string,string];
  const rows=getTable('ai_usage');
  const existing=rows.find(r=>r.user_id===user_id&&r.day===day&&r.kind===kind);
  if(existing)existing.count=Math.max(0,Number(existing.count||0)-1);
  return {results:[],meta:{changes:existing?1:0}};
 }

 // 5. UPDATE OR IGNORE
 if(/^UPDATE OR IGNORE\s+(\w+)\s+SET user_id=\?/i.test(sql)){
  return {results:[],meta:{changes:0}};
 }

 // 6. Genel SELECT
 const selMatch=/^SELECT\s+(.+?)\s+FROM\s+(\w+)(?:\s+WHERE\s+(.+?))?(?:\s+ORDER BY\s+(.+?))?(?:\s+LIMIT\s+(\d+))?$/i.exec(sql);
 if(selMatch){
  const [,,table,whereRaw,orderRaw,limitRaw]=selMatch;
  let rows=getTable(table).filter(r=>matchConds(r,whereRaw,params).ok).map(r=>({...r}));
  if(orderRaw){
   const [col,dir]=orderRaw.trim().split(',')[0].trim().split(/\s+/);
   const desc=/^DESC$/i.test(dir||'');
   rows.sort((a,b)=>desc?String(b[col]??'').localeCompare(String(a[col]??'')):String(a[col]??'').localeCompare(String(b[col]??'')));
  }
  const lim=limitRaw?Number(limitRaw):mode==='first'?1:rows.length;
  return {results:rows.slice(0,lim),meta:{changes:0}};
 }

 // 7. Genel INSERT
 const insMatch=/^INSERT\s+(?:OR\s+IGNORE\s+)?INTO\s+(\w+)\s*\(([^)]+)\)\s*VALUES\s*\(([^)]+)\)(?:\s*ON\s+CONFLICT\s*\(([^)]+)\)\s*DO\s+(NOTHING|UPDATE\s+SET\s+.+))?$/i.exec(sql);
 if(insMatch){
  const isIgnore=/^INSERT\s+OR\s+IGNORE/i.test(sql);
  const [,table,colsStr,valsStr,conflictCols,conflictAction]=insMatch;
  const cols=colsStr.split(',').map(c=>c.trim());
  const valTokens=valsStr.split(',').map(v=>v.trim());
  const body:Row={};
  let pIdx=0;
  for(let i=0;i<cols.length;i++){
   const tok=valTokens[i];
   if(tok==='?')body[cols[i]]=params[pIdx++]??null;
   else if(/^NULL$/i.test(tok))body[cols[i]]=null;
   else if(/^'\d+'$/.test(tok)||/^\d+$/.test(tok))body[cols[i]]=Number(tok.replace(/'/g,''));
   else if(/^'.*'$/.test(tok))body[cols[i]]=tok.slice(1,-1);
   else body[cols[i]]=params[pIdx++]??null;
  }
  const rows=getTable(table);
  const keyCols=conflictCols?conflictCols.split(',').map(c=>c.trim()):[cols[0]];
  const existingIdx=rows.findIndex(r=>keyCols.every(k=>r[k]!==undefined&&String(r[k])===String(body[k])));
  const doNothing=isIgnore||(conflictAction&&/^NOTHING$/i.test(conflictAction.trim()));
  if(existingIdx>=0){
   if(!doNothing)rows[existingIdx]={...rows[existingIdx],...body};
   return {results:[],meta:{changes:doNothing?0:1}};
  }
  rows.push(body);
  return {results:[],meta:{changes:1}};
 }

 // 8. Genel UPDATE
 const updMatch=/^UPDATE\s+(\w+)\s+SET\s+(.+?)\s+WHERE\s+(.+)$/i.exec(sql);
 if(updMatch){
  const [,table,setRaw,whereRaw]=updMatch;
  const patch:Row={};
  let pIdx=0;
  for(const part of setRaw.split(',')){
   const [col,valExpr]=part.split('=').map(s=>s.trim());
   if(valExpr==='?')patch[col]=params[pIdx++]??null;
   else if(/^NULL$/i.test(valExpr))patch[col]=null;
   else if(/^\d+$/.test(valExpr))patch[col]=Number(valExpr);
   else if(/^'.*'$/.test(valExpr))patch[col]=valExpr.slice(1,-1);
  }
  const rows=getTable(table);
  let changes=0;
  for(const r of rows){
   if(matchConds(r,whereRaw,params,pIdx).ok){
    Object.assign(r,patch);
    changes++;
   }
  }
  return {results:[],meta:{changes}};
 }

 // 9. Genel DELETE
 const delMatch=/^DELETE\s+FROM\s+(\w+)\s+WHERE\s+(.+)$/i.exec(sql);
 if(delMatch){
  const [,table,whereRaw]=delMatch;
  const rows=getTable(table);
  const keep=rows.filter(r=>!matchConds(r,whereRaw,params).ok);
  const changes=rows.length-keep.length;
  tables.set(table.toLowerCase(),keep);
  return {results:[],meta:{changes}};
 }

 return {results:[],meta:{changes:0}};
}

class MemoryPreparedStatement{
 private params:unknown[]=[];
 constructor(private sql:string){}
 bind(...values:unknown[]){
  const next=new MemoryPreparedStatement(this.sql);
  next.params=values;
  return next;
 }
 async first<T=Row>():Promise<T|null>{
  const r=execMemorySql(this.sql,this.params,'first');
  return (r.results[0] as T)||null;
 }
 async all<T=Row>():Promise<{results:T[];success:boolean;meta:{changes:number}}>{
  const r=execMemorySql(this.sql,this.params,'all');
  return {results:r.results as T[],success:true,meta:r.meta};
 }
 async run():Promise<{success:boolean;meta:{changes:number}}>{
  const r=execMemorySql(this.sql,this.params,'run');
  return {success:true,meta:r.meta};
 }
}

export function createMemoryD1():D1Database{
 return {
  prepare(sql:string){
   return new MemoryPreparedStatement(sql) as unknown as D1PreparedStatement;
  },
  async batch<T=unknown>(statements:D1PreparedStatement[]){
   const out:D1Result<T>[]=[];
   for(const st of statements){
    const s=st as unknown as MemoryPreparedStatement;
    const isSelect=/^\s*SELECT\b/i.test((s as any).sql||'');
    if(isSelect){
     const r=await s.all<T>();
     out.push({results:r.results,success:true,meta:r.meta as any});
    }else{
     const r=await s.run();
     out.push({results:[],success:true,meta:r.meta as any});
    }
   }
   return out;
  },
  async exec(){return {count:0,duration:0}},
  async dump(){return new ArrayBuffer(0)},
  withSession(){return this as unknown as D1DatabaseSession}
 } as unknown as D1Database;
}

export function createMemoryBucket():R2Bucket{
 return {
  async put(key:string,value:Uint8Array|ArrayBuffer|ReadableStream|string,options?:{httpMetadata?:{contentType?:string}}){
   const contentType=options?.httpMetadata?.contentType||'application/octet-stream';
   let bytes:Uint8Array;
   if(value instanceof Uint8Array)bytes=value;
   else if(value instanceof ArrayBuffer)bytes=new Uint8Array(value);
   else if(typeof value==='string')bytes=new TextEncoder().encode(value);
   else bytes=new Uint8Array(0);
   blobs.set(key,{data:bytes,contentType});
   return null as unknown as R2Object;
  },
  async get(key:string){
   const item=blobs.get(key);
   if(!item)return null;
   const stream=new ReadableStream({
    start(controller){
     controller.enqueue(item.data);
     controller.close();
    }
   });
   return {body:stream} as unknown as R2ObjectBody;
  },
  async delete(keys:string|string[]){
   const list=Array.isArray(keys)?keys:[keys];
   for(const k of list)blobs.delete(k);
  }
 } as unknown as R2Bucket;
}
