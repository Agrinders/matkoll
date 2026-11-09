/* Keeps all data on this device (browser storage), with a backup file the user can save and load. */
(function(){
  const KEY="matkoll.data.v1",sv=(navigator.language||"sv").toLowerCase().startsWith("sv");
  const L=sv?{save:"Spara säkerhetskopia",load:"Läs in säkerhetskopia",why:"Allt sparas bara på den här enheten. Spara en säkerhetskopia ibland, annars försvinner det om du byter telefon eller rensar webbläsaren.",askT:"Ersätt allt på den här enheten?",ask:"Säkerhetskopian ersätter det som finns sparat nu.",bad:"Filen kunde inte läsas. Välj en säkerhetskopia från Matkoll.",saved:"Säkerhetskopian är sparad"}:{save:"Save a backup",load:"Load a backup",why:"Everything is saved on this device only. Save a backup now and then, or it is lost if you change phone or clear the browser.",askT:"Replace everything on this device?",ask:"The backup replaces what is saved now.",bad:"The file could not be read. Choose a Matkoll backup.",saved:"Backup saved"};
  const read=()=>{try{return JSON.parse(localStorage.getItem(KEY)||"{}")||{}}catch(e){return {}}};
  /* Always starts from what is saved right now, so a second open copy of the app can never overwrite newer changes. */
  let data=read();const fresh=()=>{data=read()};
  const write=()=>{localStorage.setItem(KEY,JSON.stringify(data))};
  if(navigator.storage&&navigator.storage.persist)navigator.storage.persist().catch(()=>{});
  const subs={},copy=v=>JSON.parse(JSON.stringify(v));
  const snap=p=>{const m=data[p]||{},docs=Object.keys(m).sort().map(id=>({id,exists:true,data:()=>copy(m[id]),metadata:{fromCache:false,hasPendingWrites:false}}));return{docs,size:docs.length,empty:!docs.length,metadata:{fromCache:false,hasPendingWrites:false}}};
  const fire=p=>setTimeout(()=>(subs[p]||[]).forEach(f=>f(snap(p))),0);
  const col=p=>({path:p,doc:id=>({id,set:async d=>{fresh();(data[p]=data[p]||{})[id]=copy(d);write();fire(p)},update:async d=>{fresh();data[p][id]={...data[p][id],...copy(d)};write();fire(p)},delete:async()=>{fresh();if(data[p])delete data[p][id];write();fire(p)}}),get:async()=>snap(p),onSnapshot:n=>{(subs[p]=subs[p]||[]).push(n);setTimeout(()=>n(snap(p)),0);return()=>{subs[p]=subs[p].filter(f=>f!==n)}}});
  addEventListener("storage",e=>{if(e.key===KEY){fresh();Object.keys(subs).forEach(fire)}});
  const db={collection:col};
  window.claude={use:async n=>n==="db"?db:null};
  function backup(){const r=document.getElementById("reset");if(!r)return;
    const box=document.createElement("div");box.style.cssText="display:grid;gap:8px;margin-bottom:8px";
    box.innerHTML=`<button class="btn" id="bk_save">${L.save}</button><button class="btn out" id="bk_load">${L.load}</button><input id="bk_file" type="file" accept=".json,application/json" hidden>`;
    r.before(box);
    document.getElementById("bk_save").onclick=()=>{fresh();const d=new Date().toISOString().slice(0,10),a=document.createElement("a");a.href=URL.createObjectURL(new Blob([JSON.stringify({app:"matkoll",saved:new Date().toISOString(),data},null,1)],{type:"application/json"}));a.download=`matkoll-backup-${d}.json`;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),4000);toast(L.saved,"ok")};
    const f=document.getElementById("bk_file");document.getElementById("bk_load").onclick=()=>f.click();
    f.onchange=async()=>{const x=f.files[0];f.value="";if(!x)return;try{const v=JSON.parse(await x.text());if(v.app!=="matkoll"||!v.data||typeof v.data!=="object")throw 0;if(!await ask(L.askT,L.ask))return;data=v.data;write();location.reload()}catch(e){toast(L.bad,"bad")}};
    const st=setInterval(()=>{const c=document.getElementById("c_st");if(c){c.textContent=L.why;clearInterval(st)}},200);
    new MutationObserver(()=>{const c=document.getElementById("c_st");if(c&&c.textContent!==L.why)c.textContent=L.why}).observe(document.getElementById("c_st"),{childList:true,characterData:true,subtree:true});
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",backup);else backup();
})();
