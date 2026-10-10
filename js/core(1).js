/* Core utilities and local-first state for Family Gallery. */
(function(){'use strict';
 const KEY='rezaei.gallery.v1', defaults={members:[
 {id:'1001',name:'بابا رضا',role:'پدربزرگ',emoji:'👨',parent:null},
 {id:'1002',name:'مامان زهرا',role:'مادربزرگ',emoji:'👩',parent:null},
 {id:'1003',name:'آقا حسین',role:'عمو',emoji:'🧑',parent:'1001'},
 {id:'1004',name:'آقا میلاد',role:'عمو',emoji:'🧑',parent:'1001'},
 {id:'1005',name:'مطهره خانم',role:'عمه',emoji:'👩',parent:'1001'},
 {id:'1006',name:'آقا محمد',role:'عمو',emoji:'🧑',parent:'1001'},
 {id:'1007',name:'پریا خانم',role:'همسر حسین',emoji:'👩',parent:'1003'},
 {id:'1008',name:'مهری خانم',role:'همسر میلاد',emoji:'👩',parent:'1004'},
 {id:'1009',name:'الیشا خانم',role:'همسر محمد',emoji:'👩',parent:'1006'},
 {id:'1010',name:'غزل خانم',role:'نوه',emoji:'👧',parent:'1003'}],media:[],memories:[],messages:[],settings:{theme:'gold',night:false}};
 function clone(x){return JSON.parse(JSON.stringify(x))} let state;
 try{state=JSON.parse(localStorage.getItem(KEY)||'null')}catch(e){state=null}
 if(!state||typeof state!=='object') state=clone(defaults);
 state.members=Array.isArray(state.members)?state.members:clone(defaults.members);
 ['media','memories','messages'].forEach(k=>{if(!Array.isArray(state[k]))state[k]=[]});state.settings=Object.assign({},defaults.settings,state.settings||{});
 function save(){try{localStorage.setItem(KEY,JSON.stringify(state));return true}catch(e){notify('فضای ذخیره‌سازی مرورگر کافی نیست؛ فایل‌های بزرگ را محلی نگه دارید.');return false}}
 function notify(msg){const n=document.getElementById('notice');if(!n)return;n.textContent=msg;n.classList.add('show');clearTimeout(notify.timer);notify.timer=setTimeout(()=>n.classList.remove('show'),3500)}
 function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
 window.FamilyGallery={state,save,notify,esc,defaults,KEY,activeMember:null,
  count(){const m=document.getElementById('mediaStat'),msg=document.getElementById('messageStat'),mem=document.getElementById('memberStat');if(m)m.textContent=state.media.length+state.memories.length;if(msg)msg.textContent=state.messages.length;if(mem)mem.textContent=state.members.length},
  openProfile(id){const p=state.members.find(x=>String(x.id)===String(id));if(!p)return;this.activeMember=p;document.getElementById('profileName').textContent=p.name;document.getElementById('profileRole').textContent=p.role;document.getElementById('profileAvatar').textContent=p.emoji||'👤';document.getElementById('profile').classList.remove('hidden');this.renderMedia();document.getElementById('profile').scrollIntoView({behavior:'smooth',block:'start'})},
  renderMembers(){const el=document.getElementById('grid');if(!el)return;el.innerHTML=state.members.map(p=>`<button class="member-card" data-person="${esc(p.id)}"><span class="member-avatar">${esc(p.emoji||'👤')}</span><b>${esc(p.name)}</b><small>${esc(p.role||'عضو خانواده')}</small></button>`).join('');el.querySelectorAll('[data-person]').forEach(b=>b.addEventListener('click',()=>this.openProfile(b.dataset.person)))},
  renderMedia(){const box=document.getElementById('mediaGallery');if(!box)return;const id=this.activeMember&&String(this.activeMember.id);const items=state.memories.filter(x=>String(x.memberId)===id).concat(state.media.filter(x=>String(x.memberId)===id));box.innerHTML=items.length?items.map(x=>`<article class="media-item"><b>${esc(x.title||x.name||'یادگار')}</b><small>${esc(x.visibility||'اختصاصی')}</small>${x.text?`<p>${esc(x.text)}</p>`:''}${x.url?(x.kind==='photo'?`<img src="${x.url}" alt="${esc(x.name)}">`:x.kind==='video'?`<video controls src="${x.url}"></video>`:`<audio controls src="${x.url}"></audio>`):''}</article>`).join(''):'<p class="muted">هنوز یادگاری ثبت نشده است.</p>';this.count()}
 };
})();