// Workshop panel. A separate module: it reads model/workshop.json (catalog,
// mounts, measured arches) and only drives the viewer through window.lcBuild
// and window.lcView. It never touches meshes, materials or the camera directly.
import * as THREE from 'three';

const lcBuild=window.lcBuild,lcView=window.lcView;
if(!lcBuild||!lcView)throw Error('Viewer API not ready');
const data=await (await fetch(new URL('model/workshop.json',import.meta.url))).json();
const manifest=lcBuild.getManifest();
const entries=new Map([manifest.base,...manifest.parts].map(entry=>[entry.id,entry]));
const STOCK=data.stockTyre_mm;

// ── Pure logic (also exercised by tests through window.lcWorkshop) ─────────
const available=option=>(option.requires||[]).every(id=>entries.has(id));
const categoryPartSlots=category=>[...new Set(category.options.flatMap(option=>(option.requires||[]).map(id=>entries.get(id)?.slot).filter(Boolean)))];
function patchFor(category,option){
 // Start from the category's stock state, then add this option's parts and fields.
 const slots={};
 for(const slot of categoryPartSlots(category))slots[slot]=manifest.slots[slot]?.default??null;
 for(const id of option.requires||[])slots[entries.get(id).slot]=id;
 const patch={...(option.patch||{})};
 if(Object.keys(slots).length)patch.slots={...slots,...(patch.slots||{})};
 return patch;
}
function isSelected(option,state){
 if(option.requires?.length)return option.requires.every(id=>state.slots[entries.get(id)?.slot]===id);
 if(option.patch)return Object.entries(option.patch).every(([key,value])=>typeof value!=='object'&&state[key]===value);
 return false;
}
function selectedOption(category,state){
 return category.options.find(option=>available(option)&&isSelected(option,state))||
  category.options.find(option=>!option.requires&&!option.patch)||null;
}
function tyreClearance(tyre_mm,lift_mm){
 const r=tyre_mm/2000,lift=lift_mm/1000,limits=data.clearance_mm;
 return ['front','rear'].map(name=>{
  // Lifting the body raises the arch relative to the hub; the tyre sits on the hub.
  const mm=Math.round(Math.min(...data.arches[name].points.map(([x,y])=>Math.hypot(x,y+lift)-r))*1000);
  return {arch:name,mm,status:mm>=limits.ok?'ok':mm>=limits.tight?'tight':'clash'};
 });
}
function mountChecks(state){
 const out=[];
 for(const [slot,id] of Object.entries(state.slots)){
  const entry=entries.get(id);if(!entry?.mount||state.hidden.includes(id))continue;
  const mount=data.mounts[entry.mount];
  if(!mount){out.push({id,status:'clash',note:`unknown mount ${entry.mount}`});continue;}
  const offset=Math.hypot(...entry.pivot.map((v,i)=>v-mount.pos[i]));
  const inside=[0,1,2].every(i=>entry.bounds.min[i]>=mount.envelope.min[i]-1e-6&&entry.bounds.max[i]<=mount.envelope.max[i]+1e-6);
  out.push({id,mount:entry.mount,status:offset<=0.002&&inside?'ok':'clash',
   note:offset>0.002?`origin ${(offset*1000).toFixed(0)} mm off the mount`:inside?'on its mount':'outside the mount envelope'});
 }
 return out;
}
function fitCheck(state=lcBuild.getState()){
 const tyre=lcBuild.tyreDiameterMM(),tyres=tyreClearance(tyre,state.lift_mm),mounts=mountChecks(state);
 const notes=[...tyres.filter(t=>t.status!=='ok').map(t=>({level:t.status,text:`${t.arch==='front'?'Front':'Rear'} arch ${t.mm} mm clearance${t.status==='tight'?': liner trim likely':': tyre hits the arch'}`})),
  ...mounts.filter(m=>m.status!=='ok').map(m=>({level:'clash',text:`${m.id}: ${m.note}`}))];
 const level=notes.some(n=>n.level==='clash')?'clash':notes.length?'tight':'ok';
 return {level,tyre_mm:tyre,tyres,mounts,notes};
}
function dimensions(){
 const box=new THREE.Box3();
 for(const group of [lcBuild.groups.body,lcBuild.groups.wheels])box.expandByObject(group);
 const body=new THREE.Box3().expandByObject(lcBuild.groups.body),size=box.getSize(new THREE.Vector3());
 return {length:Math.round(size.x*1000),height:Math.round(box.max.y*1000),width:Math.round(size.z*1000),clearance:Math.round(body.min.y*1000)};
}
function shareState(state){
 const base=lcBuild.getBaseState(),diff={};
 const slots=Object.fromEntries(Object.entries(state.slots).filter(([slot,id])=>base.slots[slot]!==id));
 if(Object.keys(slots).length)diff.slots=slots;
 if(state.lift_mm!==base.lift_mm)diff.lift_mm=state.lift_mm;
 if(state.lamps_on!==base.lamps_on)diff.lamps_on=state.lamps_on;
 const paint=Object.fromEntries(Object.entries(state.paint).filter(([key,value])=>base.paint[key]!==value));
 if(Object.keys(paint).length)diff.paint=paint;
 return diff;
}

// ── Panel ──────────────────────────────────────────────────────────────────
const css=`
#workshop{position:absolute;z-index:6;left:clamp(14px,2.6vw,40px);top:96px;bottom:22px;width:340px;display:none;flex-direction:column;gap:12px;
 border:1px solid var(--line);background:var(--panel);backdrop-filter:blur(24px);-webkit-backdrop-filter:blur(24px);border-radius:18px;
 box-shadow:0 10px 40px rgba(0,0,0,.06);padding:18px 16px;color:var(--ink);font-size:11px;overflow:hidden}
body.workshop-open #workshop{display:flex}
body.clean-view #workshop{display:none}
#workshop .ws-scroll{overflow:auto;flex:1;min-height:0;display:flex;flex-direction:column;gap:12px;margin:0 -6px;padding:0 6px}
#workshop .ws-micro{font-size:9px;font-weight:650;text-transform:uppercase;letter-spacing:.2em;opacity:.6}
#workshop .ws-title{font-size:17px;font-weight:600;margin-top:3px;letter-spacing:.01em}
#workshop .ws-head{display:flex;align-items:center;gap:10px}
#workshop button{font:inherit;color:inherit;cursor:pointer;-webkit-tap-highlight-color:transparent}
#workshop .ws-back,#workshop .ws-x{width:30px;height:30px;flex:none;border-radius:50%;border:1px solid var(--line);background:transparent;font-size:15px;line-height:1}
#workshop .ws-x{margin-left:auto}
#workshop .ws-seg{display:flex;border:1px solid var(--line);border-radius:10px;padding:3px;gap:2px}
#workshop .ws-seg button{flex:1;border:0;background:transparent;border-radius:7px;padding:7px 0;font-weight:600;opacity:.65}
#workshop .ws-seg button[aria-pressed=true]{background:var(--ink);color:var(--bg-ink,#f4f4ef);opacity:1}
#workshop .ws-list{display:flex;flex-direction:column;border-top:1px solid var(--line)}
#workshop .ws-row{display:flex;align-items:center;gap:11px;padding:9px 4px;border:0;border-bottom:1px solid var(--line);background:transparent;text-align:left;width:100%}
#workshop .ws-row:hover,#workshop .ws-opt:not([disabled]):hover{background:rgba(127,140,150,.08)}
#workshop .ws-num{width:22px;height:22px;flex:none;border-radius:50%;display:grid;place-items:center;font-size:10px;font-weight:700;background:rgba(127,140,150,.16)}
#workshop .ws-t{flex:1;min-width:0}
#workshop .ws-n{font-size:12px;font-weight:600}
#workshop .ws-v{opacity:.62;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#workshop .ws-row.mod .ws-v{opacity:1;color:var(--accent);font-weight:600}
#workshop .ws-opts{display:flex;flex-direction:column;gap:7px}
#workshop .ws-opt{display:flex;align-items:center;gap:11px;border:1px solid var(--line);border-radius:12px;padding:10px 11px;background:transparent;text-align:left;width:100%}
#workshop .ws-opt[aria-checked=true]{border-color:var(--accent);box-shadow:0 0 0 1px var(--accent) inset}
#workshop .ws-opt[disabled]{opacity:.45;cursor:default}
#workshop .ws-radio{width:14px;height:14px;flex:none;border-radius:50%;border:1.5px solid currentColor;opacity:.6}
#workshop .ws-opt[aria-checked=true] .ws-radio{border:4px solid var(--accent);opacity:1}
#workshop .ws-soon{font-size:9px;font-weight:650;letter-spacing:.08em;text-transform:uppercase;border:1px solid var(--line);border-radius:100px;padding:3px 7px;white-space:nowrap}
#workshop .ws-status{display:flex;gap:10px;align-items:flex-start;border:1px solid var(--line);border-radius:12px;padding:10px 12px;font-weight:600}
#workshop .ws-status small{display:block;font-weight:500;opacity:.65;margin-top:2px;line-height:1.45}
#workshop .ws-led{width:9px;height:9px;flex:none;border-radius:50%;margin-top:3px}
#workshop .ws-led.ok{background:#3f7a5a;box-shadow:0 0 0 3px rgba(63,122,90,.18)}
#workshop .ws-led.tight{background:#b07a1f;box-shadow:0 0 0 3px rgba(176,122,31,.2)}
#workshop .ws-led.clash{background:#b23b2e;box-shadow:0 0 0 3px rgba(178,59,46,.2)}
#workshop table{width:100%;border-collapse:collapse;font-size:11px}
#workshop th{font-size:9px;letter-spacing:.14em;text-transform:uppercase;opacity:.6;text-align:right;font-weight:650;padding:0 0 6px}
#workshop th:first-child,#workshop td:first-child{text-align:left}
#workshop td{padding:7px 0;border-top:1px solid var(--line);text-align:right}
#workshop td.d{color:var(--accent);font-weight:650}
#workshop .ws-actions{display:grid;grid-template-columns:1fr 1fr;gap:8px}
#workshop .ws-btn{border:1px solid var(--line);border-radius:10px;padding:10px;font-weight:650;background:transparent}
#workshop .ws-btn.pri{background:var(--ink);color:#f4f4ef;border-color:var(--ink)}
#workshop .ws-note{opacity:.6;line-height:1.5}
#workshopToggle[aria-pressed=true]{background:var(--ink);color:#f4f4ef;border-color:var(--ink)}
@media (max-width:650px){#workshop{left:10px;right:10px;width:auto;top:auto;bottom:10px;height:52vh;padding:14px 14px}
 body.workshop-open .bottom{visibility:hidden}}
`;
document.head.append(Object.assign(document.createElement('style'),{textContent:css}));
const panel=Object.assign(document.createElement('aside'),{id:'workshop'});
panel.setAttribute('aria-label','Workshop');
document.body.append(panel);
const toggle=document.getElementById('workshopToggle');

let view='home',compareBase=null,flash='';
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const statusHTML=fit=>{
 const title=fit.level==='ok'?'Fit check · everything fits':fit.level==='tight'?`Fit check · ${fit.notes.length} note${fit.notes.length>1?'s':''}`:'Fit check · clash';
 const detail=fit.notes.length?fit.notes.map(n=>esc(n.text)).join('<br>'):`Tyre ${fit.tyre_mm} mm · front ${fit.tyres[0].mm} mm / rear ${fit.tyres[1].mm} mm arch clearance${fit.mounts.length?` · ${fit.mounts.length} parts on mounts`:''}`;
 return `<div class="ws-status"><span class="ws-led ${fit.level}"></span><div>${title}<small>${detail}</small></div></div>`;
};
function render(){
 const state=lcBuild.getState(),fit=fitCheck(state),locked=!!compareBase;
 const compare=`<div class="ws-seg" role="group" aria-label="Compare"><button data-compare="base" aria-pressed="${locked}">Base car</button><button data-compare="build" aria-pressed="${!locked}">My build</button></div>`;
 let body='';
 if(view==='home'){
  body=`<div class="ws-head"><div><div class="ws-micro">Workshop</div><div class="ws-title">My build</div></div><button class="ws-x" data-close aria-label="Close workshop">×</button></div>${compare}
  <div class="ws-scroll"><div class="ws-list">${data.categories.map((category,i)=>{const option=selectedOption(category,state),mod=option&&option!==category.options[0];
   return `<button class="ws-row${mod?' mod':''}" data-cat="${category.id}" ${locked?'disabled':''}><span class="ws-num">${i+1}</span><span class="ws-t"><div class="ws-n">${esc(category.label)}</div><div class="ws-v">${esc(option?option.label:'Stock')}</div></span><span aria-hidden="true">›</span></button>`;}).join('')}</div>
  <p class="ws-note">Options marked “soon” need their 3D parts first. Mount points, tyre clearance and the fit check are already live.</p></div>
  ${statusHTML(fit)}<div class="ws-actions"><button class="ws-btn" data-sheet>Build sheet</button><button class="ws-btn pri" data-share>${flash||'Copy share link'}</button></div>`;
 }else if(view==='sheet'){
  const now=dimensions(),base=baseDims,row=(label,a,b)=>`<tr><td>${label}</td><td>${a.toLocaleString()}</td><td>${b.toLocaleString()}</td><td class="${a!==b?'d':''}">${a===b?'0':(b>a?'+':'')+(b-a).toLocaleString()}</td></tr>`;
  body=`<div class="ws-head"><button class="ws-back" data-home aria-label="Back">‹</button><div><div class="ws-micro">Workshop</div><div class="ws-title">Build sheet</div></div></div>
  <div class="ws-scroll"><table><tr><th>mm</th><th>Base</th><th>Build</th><th>Δ</th></tr>${row('Length',base.length,now.length)}${row('Height',base.height,now.height)}${row('Width (mirrors)',base.width,now.width)}${row('Lowest body point',base.clearance,now.clearance)}${row('Tyre diameter',STOCK,fit.tyre_mm)}</table>
  <div class="ws-micro">Installed</div><div class="ws-list">${data.categories.map(category=>{const option=selectedOption(category,state);return `<div class="ws-row" style="cursor:default"><span class="ws-t"><div class="ws-n">${esc(option?option.label:'Stock')}</div><div class="ws-v">${esc(category.label)}</div></span></div>`;}).join('')}</div>
  <p class="ws-note">${esc(data.clearanceNote)}</p></div>${statusHTML(fit)}
  <div class="ws-actions"><button class="ws-btn" data-reset>Reset to base</button><button class="ws-btn pri" data-share>${flash||'Copy share link'}</button></div>`;
 }else{
  const category=data.categories.find(c=>c.id===view),current=selectedOption(category,state);
  body=`<div class="ws-head"><button class="ws-back" data-home aria-label="Back">‹</button><div><div class="ws-micro">Workshop</div><div class="ws-title">${esc(category.label)}</div></div></div>
  <div class="ws-scroll"><div class="ws-opts" role="radiogroup" aria-label="${esc(category.label)}">${category.options.map(option=>{const ok=available(option);
   return `<button class="ws-opt" role="radio" data-opt="${option.id}" aria-checked="${option===current}" ${ok?'':'disabled'}><span class="ws-radio"></span><span class="ws-t"><div class="ws-n">${esc(option.label)}</div><div class="ws-v">${esc(option.detail||'')}</div></span>${ok?'':'<span class="ws-soon">soon</span>'}</button>`;}).join('')}</div>
  ${category.id==='wheels'||category.id==='stance'?`<p class="ws-note">${esc(data.clearanceNote)}</p>`:''}</div>${statusHTML(fit)}`;
 }
 panel.innerHTML=body;
}
const baseDims=(()=>{
 // Base numbers come from the stored part bounds of the default build (lift 0, stock tyres).
 const box=new THREE.Box3(),bodyBox=new THREE.Box3(),base=lcBuild.getBaseState();
 for(const [slot,id] of Object.entries(base.slots)){const e=entries.get(id);if(!e||base.hidden.includes(id))continue;
  const b=new THREE.Box3(new THREE.Vector3(...e.bounds.min),new THREE.Vector3(...e.bounds.max));box.union(b);if(e.rigidClass!=='wheel')bodyBox.union(b);}
 box.union(new THREE.Box3(new THREE.Vector3(...manifest.base.bounds.min),new THREE.Vector3(...manifest.base.bounds.max)));
 const size=box.getSize(new THREE.Vector3());
 return {length:Math.round(size.x*1000),height:Math.round(box.max.y*1000),width:Math.round(size.z*1000),clearance:Math.round(bodyBox.min.y*1000)};
})();

async function share(){
 const diff=shareState(compareBase||lcBuild.getState());
 const url=location.href.split('#')[0]+(Object.keys(diff).length?'#build='+encodeURIComponent(JSON.stringify(diff)):'');
 history.replaceState(null,'',url);
 try{await navigator.clipboard.writeText(url);flash='Link copied ✓';}catch{flash='Link in address bar';}
 render();setTimeout(()=>{flash='';render();},1800);
}
function setOpen(open){
 document.body.classList.toggle('workshop-open',open);toggle.setAttribute('aria-pressed',String(open));
 const shown=open&&!document.body.classList.contains('clean-view'),side=innerWidth>650,rect=panel.getBoundingClientRect();
 // Side panel on wide screens, bottom sheet on phones: the car refits into what is left.
 lcView.setInset(shown&&side?rect.right+12:0,shown&&!side?innerHeight-rect.top+8:0);
 if(open)render();
}
panel.addEventListener('click',async event=>{
 const t=event.target.closest('button');if(!t||t.disabled)return;
 if(t.dataset.close!==undefined)return setOpen(false);
 if(t.dataset.home!==undefined){view='home';return render();}
 if(t.dataset.sheet!==undefined){view='sheet';return render();}
 if(t.dataset.cat){view=t.dataset.cat;return render();}
 if(t.dataset.share!==undefined)return share();
 if(t.dataset.reset!==undefined){compareBase=null;await lcBuild.replaceState({});return render();}
 if(t.dataset.compare){
  if(t.dataset.compare==='base'&&!compareBase){compareBase=lcBuild.getState();await lcBuild.replaceState({});}
  else if(t.dataset.compare==='build'&&compareBase){const saved=compareBase;compareBase=null;await lcBuild.replaceState(saved);}
  return render();
 }
 if(t.dataset.opt){
  const category=data.categories.find(c=>c.id===view),option=category.options.find(o=>o.id===t.dataset.opt);
  await lcBuild.setState(patchFor(category,option));render();
 }
});
toggle.addEventListener('click',()=>setOpen(!document.body.classList.contains('workshop-open')));
addEventListener('keydown',event=>{if(event.key==='Escape'&&document.body.classList.contains('workshop-open'))setOpen(false);});
addEventListener('resize',()=>{if(document.body.classList.contains('workshop-open'))setOpen(true);},{passive:true});
addEventListener('lcbuild-change',()=>{if(document.body.classList.contains('workshop-open'))render();});
new MutationObserver(()=>{if(document.body.classList.contains('workshop-open'))setOpen(true);}).observe(document.body,{attributes:true,attributeFilter:['class']});

window.lcWorkshop=Object.freeze({data,fitCheck,tyreClearance,mountChecks,dimensions,baseDims,patchFor,selectedOption,shareState,open:()=>setOpen(true),close:()=>setOpen(false)});
