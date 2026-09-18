let map,facilities=[],fires=[],markers=[],fireMarkers=[],routeLine=null,selected=null;
const $=id=>document.getElementById(id);
const esc=v=>String(v??'-').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const show=v=>(v===null||v===undefined||v===""?'-':v);
async function loadJSON(p){const r=await fetch(p);if(!r.ok)throw new Error(p);return r.json()}
function initMap(){const c=APP_CONFIG.DEFAULT_CENTER;map=new kakao.maps.Map($('map'),{center:new kakao.maps.LatLng(c.lat,c.lng),level:APP_CONFIG.DEFAULT_LEVEL});}
function unique(key, arr=facilities){return [...new Set(arr.map(x=>x[key]).filter(Boolean))].sort((a,b)=>String(a).localeCompare(String(b),'ko'))}
function setOptions(id,vals){const el=$(id), cur=el.value;el.innerHTML='<option value="">전체</option>';vals.forEach(x=>{const o=document.createElement('option');o.value=o.textContent=x;el.appendChild(o)});if(vals.includes(cur))el.value=cur}
function clearMarkers(a){a.forEach(m=>m.setMap(null));a.length=0}
function filtered(){const keys=['sido','sigungu','facilityType','locationType','forestType','buildingType','scaleType'];return facilities.filter(x=>keys.every(k=>!$(k).value||String(x[k])===$(k).value))}
function updateSigungu(){const sd=$('sido').value;setOptions('sigungu',unique('sigungu',sd?facilities.filter(x=>x.sido===sd):facilities))}
function render(){clearMarkers(markers);clearMarkers(fireMarkers);if(routeLine){routeLine.setMap(null);routeLine=null}const list=filtered();$('count').textContent=`표시 시설 ${list.length.toLocaleString()}개 / 전체 ${facilities.length.toLocaleString()}개`;
list.forEach(x=>{if(!x.lat||!x.lng)return;const m=new kakao.maps.Marker({map,position:new kakao.maps.LatLng(+x.lat,+x.lng),title:x.name});kakao.maps.event.addListener(m,'click',()=>selectFacility(x));markers.push(m)});if(selected && list.some(x=>x.id===selected.id)) showFireFor(selected)}
function row(k,v){return `<div class="row"><div class="k">${esc(k)}</div><div class="v">${esc(show(v))}</div></div>`}
function fmtM(v){return v==null?'-':(+v>=1000?(+v/1000).toFixed(2)+' km':Math.round(+v).toLocaleString()+' m')}
function selectFacility(x){selected=x;map.panTo(new kakao.maps.LatLng(+x.lat,+x.lng));$('detailBody').innerHTML=
row('시설유형',x.facilityType)+row('시설명',x.name)+row('주소',x.address)+row('시·도 / 시·군·구',`${show(x.sido)} / ${show(x.sigungu)}`)+
row('준공일',x.completionDate)+row('개설일',x.openDate)+row('병상 / 정원 / 현원',`${show(x.beds)} / ${show(x.capacity)} / ${show(x.current)}`)+
row('종사자 수',x.staffCount)+row('주요 인력',x.staff)+row('시설 사용층',x.floors)+
`<div style="padding-top:10px"><span class="badge">${esc(show(x.locationType))}</span><span class="badge">${esc(show(x.forestType))}</span><span class="badge">${esc(show(x.buildingType))}</span><span class="badge">${esc(show(x.scaleType))}</span></div>`+
`<div class="firebox"><b>소방대응여건</b>${row('지정 소방기관',x.fireName)}${row('기관 유형',x.fireType)}${row('기관 주소',x.fireAddress)}${row('도로거리',fmtM(x.fireDistanceM))}${row('직선거리',fmtM(x.fireLinearM))}${row('예상 대응시간',x.fireTravelMin==null?'-':Number(x.fireTravelMin).toFixed(1)+'분')}${row('대응유형',x.responseType)}</div>`;
showFireFor(x)}
function showFireFor(x){clearMarkers(fireMarkers);if(routeLine){routeLine.setMap(null);routeLine=null}if(!$('showFire').checked||!x.fireLat||!x.fireLng)return;
const fp=new kakao.maps.LatLng(+x.fireLat,+x.fireLng);const fm=new kakao.maps.Marker({map,position:fp,title:x.fireName||'소방기관'});fireMarkers.push(fm);
const ip=new kakao.maps.InfoWindow({content:`<div style="padding:6px 8px;font-size:12px;white-space:nowrap">${esc(x.fireName||'소방기관')}</div>`});ip.open(map,fm);
routeLine=new kakao.maps.Polyline({map,path:[fp,new kakao.maps.LatLng(+x.lat,+x.lng)],strokeWeight:4,strokeOpacity:.75,strokeStyle:'shortdash'});}
function search(){const q=$('search').value.trim();if(!q)return;const list=facilities.filter(f=>(f.name||'').includes(q));if(!list.length)return alert('시설을 찾지 못했습니다.');selectFacility(list[0])}
async function main(){initMap();try{[facilities,fires]=await Promise.all([loadJSON(APP_CONFIG.FACILITY_DATA),loadJSON(APP_CONFIG.FIRE_DATA)]);
['sido','facilityType','locationType','forestType','buildingType','scaleType'].forEach(id=>setOptions(id,unique(id)));updateSigungu();render()
}catch(e){$('detailBody').innerHTML='데이터를 불러오지 못했습니다. GitHub Pages에서 실행하고 data 폴더를 확인하세요.';console.error(e)}
['sigungu','facilityType','locationType','forestType','buildingType','scaleType'].forEach(id=>$(id).addEventListener('change',render));
$('sido').addEventListener('change',()=>{updateSigungu();render()});$('showFire').addEventListener('change',()=>selected?showFireFor(selected):null);
$('searchBtn').onclick=search;$('search').addEventListener('keydown',e=>e.key==='Enter'&&search());$('resetBtn').onclick=()=>{selected=null;clearMarkers(fireMarkers);if(routeLine){routeLine.setMap(null);routeLine=null}map.setCenter(new kakao.maps.LatLng(APP_CONFIG.DEFAULT_CENTER.lat,APP_CONFIG.DEFAULT_CENTER.lng));map.setLevel(APP_CONFIG.DEFAULT_LEVEL)}}
window.addEventListener('load',main);
