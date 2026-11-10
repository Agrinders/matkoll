/* Always tries the network first, so a published change shows up the next time the app opens. Falls back to the saved copy offline.
   The saved copy lives in Matkoll's own database, so no other app on the same web address can ever remove it. */
const VER="12ec808d6661",FILES=['./', 'index.html', 'app-shell.js', 'manifest.webmanifest', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/icon-maskable-512.png'],DB="matkoll-offline";
const opendb=()=>new Promise((ok,no)=>{const q=indexedDB.open(DB,1);q.onupgradeneeded=()=>q.result.createObjectStore("f");q.onsuccess=()=>ok(q.result);q.onerror=()=>no(q.error)});
const run=(mode,fn)=>opendb().then(d=>new Promise((ok,no)=>{const t=d.transaction("f",mode),r=fn(t.objectStore("f"));t.oncomplete=()=>{d.close();ok(r.result)};t.onerror=()=>{d.close();no(t.error)}}));
const key=u=>{const x=new URL(u,location.href);return x.origin===location.origin?x.pathname.replace(/index\.html$/,""):x.href};
const put=async(u,res)=>{const b=await res.arrayBuffer();await run("readwrite",s=>s.put({b,t:res.headers.get("content-type")||""},key(u)))};
const get=async u=>{const v=await run("readonly",s=>s.get(key(u)));return v?new Response(v.b,{headers:{"content-type":v.t}}):null};
self.addEventListener("install",e=>{self.skipWaiting();e.waitUntil(Promise.all(FILES.map(f=>fetch(f,{cache:"no-cache"}).then(r=>r.ok?put(f,r):null))))});
self.addEventListener("activate",e=>e.waitUntil(self.clients.claim()));
self.addEventListener("fetch",e=>{const r=e.request;if(r.method!=="GET")return;const u=new URL(r.url);
  if(u.hostname==="fonts.googleapis.com"||u.hostname==="fonts.gstatic.com"){e.respondWith(get(r.url).then(m=>m||fetch(r.url,{mode:"cors"}).then(x=>{if(x.ok)put(r.url,x.clone()).catch(()=>{});return x})));return}
  if(u.origin!==location.origin)return;
  e.respondWith(fetch(r,{cache:"no-cache"}).then(x=>{if(x.ok)put(r.url,x.clone()).catch(()=>{});return x}).catch(()=>get(r.url).then(m=>m||(r.mode==="navigate"?get("./"):null)).then(m=>m||Response.error())))});
