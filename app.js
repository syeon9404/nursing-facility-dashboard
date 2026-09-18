'use strict';
function mapError(){
 document.getElementById('count').textContent='지도 연결 오류';
 document.querySelector('.tip').textContent='카카오 지도를 불러오지 못했습니다. JavaScript 키의 등록 도메인과 카카오맵 사용 설정을 확인해 주세요.';
}
async function start(){
 try{
  await new Promise((resolve,reject)=>{
   const s=document.createElement('script');
   const timer=setTimeout(()=>reject(new Error('SDK timeout')),20000);
   s.src='https://dapi.kakao.com/v2/maps/sdk.js?appkey=739fde988c100a843f21b4109b2bdaff&autoload=false&libraries=clusterer';
   s.onerror=()=>{clearTimeout(timer);reject(new Error('SDK load'))};
   s.onload=()=>{if(!window.kakao?.maps){clearTimeout(timer);reject(new Error('SDK unavailable'));return;}kakao.maps.load(()=>{clearTimeout(timer);resolve()})};
   document.head.appendChild(s);
  });
  initializeMap();
 }catch(error){mapError()}
}
function initializeMap(){

const n=v=>v===null||v===undefined||v===''?'–':typeof v==='number'?v.toLocaleString('ko-KR'):v,d=v=>v===null||v===undefined?'–':v>=1000?(v/1000).toFixed(1)+' km':Math.round(v)+' m',t=v=>v===null||v===undefined?'–':Number(v).toFixed(1)+'분',id=x=>document.getElementById(x);let data=[],markers,dataLoaded=false;const c={sido:'',sigungu:'',ft:'',location_type:[],forest_zone:[],building_type:[],size_type:[],response_type:[]};const map=new kakao.maps.Map(id('map'),{center:new kakao.maps.LatLng(36.35,127.75),level:13});map.addControl(new kakao.maps.ZoomControl(),kakao.maps.ControlPosition.RIGHT);const vals=k=>[...document.querySelectorAll(`[data-k="${k}"]:checked`)].map(x=>x.value);function fill(){id('sido').innerHTML='<option value="">전체 시·도</option>'+[...new Set(data.map(x=>x.sido))].sort().map(x=>`<option>${x}</option>`).join('');sg()}function sg(){let s=id('sido').value;id('sigungu').innerHTML='<option value="">전체 시·군·구</option>'+[...new Set(data.filter(x=>!s||x.sido===s).map(x=>x.sigungu))].sort().map(x=>`<option>${x}</option>`).join('')}function list(){let q=id('search').value.trim().toLowerCase();return data.filter(f=>(!c.sido||f.sido===c.sido)&&(!c.sigungu||f.sigungu===c.sigungu)&&(!c.ft||f.facility_type===c.ft)&&['location_type','forest_zone','building_type','size_type','response_type'].every(k=>!c[k].length||c[k].includes(f[k]))&&(!q||String(f.facility_name).toLowerCase().includes(q)))}

function searchFacilities(){
 if(!dataLoaded){window.alert('시설 데이터를 불러오는 중입니다. 잠시 후 다시 검색해 주세요.');return;}
 render();
 if(!id('search').value.trim())return;
 const rows=list();
 if(!rows.length){window.alert('찾을 수 없습니다');return;}
 requestAnimationFrame(()=>{
  map.relayout();
  if(rows.length===1){
   map.setLevel(4);
   map.setCenter(new kakao.maps.LatLng(rows[0].latitude,rows[0].longitude));
  }else{
   const bounds=new kakao.maps.LatLngBounds();
   rows.forEach(f=>bounds.extend(new kakao.maps.LatLng(f.latitude,f.longitude)));
   map.setBounds(bounds,60,60,60,60);
   if(map.getLevel()<4)map.setLevel(4);
  }
 });
}

function escapeHtml(value){return String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
let responseLayers=[],responseRequest=0;
function clearResponse(){responseRequest++;responseLayers.forEach(layer=>layer.setMap(null));responseLayers=[];}
async function showResponse(f){
 clearResponse();const request=responseRequest,box=id('route-status'),station=f.fire_station;
 if(!station){box.textContent='지정 기관명과 좌표의 일치 여부를 확인해야 합니다. 기존 분석 결과는 위에 표시됩니다.';return;}
 const origin=new kakao.maps.LatLng(station.latitude,station.longitude),destination=new kakao.maps.LatLng(f.latitude,f.longitude);
 const label=document.createElement('div');label.className='station-label';label.textContent='119 · '+station.name;
 responseLayers.push(new kakao.maps.Marker({map,position:origin,title:station.name,zIndex:10}),new kakao.maps.CustomOverlay({map,position:origin,content:label,yAnchor:2,zIndex:11}));
 const bounds=new kakao.maps.LatLngBounds();bounds.extend(origin);bounds.extend(destination);map.setBounds(bounds,70,50,60,50);
 box.textContent='이동경로 확인 중…';
 try{
  const response=await fetch('routes/'+encodeURIComponent(f.facility_id)+'.json');
  if(!response.ok)throw Error('missing');const route=await response.json();
  if(request!==responseRequest)return;
  if(route.station_name!==station.name||JSON.stringify(route.origin)!==JSON.stringify([station.longitude,station.latitude])||JSON.stringify(route.destination)!==JSON.stringify([f.longitude,f.latitude])||!Array.isArray(route.path)||route.path.length<2)throw Error('stale');
  const path=route.path.map(([lng,lat])=>new kakao.maps.LatLng(lat,lng));
  responseLayers.push(new kakao.maps.Polyline({map,path,strokeWeight:5,strokeColor:'#c34333',strokeOpacity:.9,strokeStyle:'solid'}));
  path.forEach(p=>bounds.extend(p));map.setBounds(bounds,70,50,60,50);
  box.textContent='카카오 경로 조회 결과: '+d(route.distance_m)+' · '+t(route.duration_sec/60)+' (조회: '+new Date(route.fetched_at).toLocaleString('ko-KR')+'). 일반 자동차 경로이며 위의 기존 분석값과 별도입니다.';
 }catch(error){
  if(request!==responseRequest)return;
  responseLayers.push(new kakao.maps.Polyline({map,path:[origin,destination],strokeWeight:3,strokeColor:'#7c8799',strokeOpacity:.8,strokeStyle:'dash'}));
  box.textContent='지정 소방기관 위치를 표시했습니다. 점선은 두 위치의 직선 연결이며 도로 이동경로가 아닙니다. 도로 경로 데이터는 아직 없습니다.';
 }
}

const colors=['#1466be','#e87854'];
const clusterers=colors.map(color=>new kakao.maps.MarkerClusterer({
  map,averageCenter:true,minLevel:6,gridSize:55,
  styles:[{width:'42px',height:'42px',background:color,color:'#fff',border:'3px solid #fff',borderRadius:'50%',boxSizing:'border-box',display:'flex',alignItems:'center',justifyContent:'center',textAlign:'center',fontWeight:'bold',fontSize:'13px',lineHeight:'1',boxShadow:'0 1px 6px #2348'}]
}));
const markerImages=colors.map(color=>new kakao.maps.MarkerImage(
  'data:image/svg+xml;charset=utf-8,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22"><circle cx="11" cy="11" r="8" fill="'+color+'" stroke="white" stroke-width="3"/></svg>'),
  new kakao.maps.Size(22,22),{offset:new kakao.maps.Point(11,11)}
));
function render(){if(window.closeDetail)window.closeDetail();
 const rows=list(),groups=[[],[]];clusterers.forEach(x=>x.clear());
 rows.forEach(f=>{
  const group=f.facility_type==='요양병원'?0:1;
  const marker=new kakao.maps.Marker({position:new kakao.maps.LatLng(f.latitude,f.longitude),image:markerImages[group],title:f.facility_name});
  kakao.maps.event.addListener(marker,'click',()=>show(f));groups[group].push(marker);
 });
 groups.forEach((g,i)=>clusterers[i].addMarkers(g));
 id('count').textContent=n(rows.length);
 document.querySelector('.tip').textContent=rows.length?'(파란색) 요양병원 · (주황색) 요양원 : 시설을 누르면 상세정보를 볼 수 있습니다.':'선택 조건에 맞는 시설이 없습니다. 초기화하거나 조건을 변경하세요.';
}
new ResizeObserver(()=>{const center=map.getCenter();map.relayout();map.setCenter(center)}).observe(id('map'));
function show(original){clearResponse();const f=Object.fromEntries(Object.entries(original).map(([k,v])=>[k,typeof v==='string'?escapeHtml(v):v]));let h=f.facility_type==='요양병원',w=f.response_type==='119접근취약형';id('detail').innerHTML=`<button class="x" onclick="closeDetail()">×</button><span class="type ${h?'hospital':'home'}">${f.facility_type}</span><h1>${f.facility_name}</h1><div class="address">${f.road_address}</div><h2>시설 기본정보</h2><table class="info"><tr><th>시설유형</th><td>${f.facility_type}</td></tr><tr><th>시설명</th><td>${f.facility_name}</td></tr><tr><th>주소</th><td>${f.road_address}</td></tr><tr><th>건축물 준공일</th><td>${n(f.building_approval_date)}</td></tr><tr><th>시설 개설일</th><td>${n(f.opening_date)}</td></tr><tr><th>시설 규모</th><td>${h?`병상수 ${n(f.bed_count)}병상`:`정원 ${n(f.capacity)}명 · 현원 ${n(f.occupants)}명`}</td></tr><tr><th>주요 인력</th><td>${h?`간호인력등급 ${n(f.nursing_grade)}`:`총 종사자 ${n(f.staff_count)}명 · 요양보호사 ${n(f.care_worker_count)}명`}</td></tr></table><h2>시설 유형분류</h2><table class="info"><tr><th>입지유형</th><td>${n(f.location_type)}</td></tr><tr><th>산림인접유형</th><td>${f.forest_zone==='비해당'?'비산림인접형':n(f.forest_zone)}</td></tr><tr><th>건축유형</th><td>${n(f.building_type)}</td></tr><tr><th>규모유형</th><td>${n(f.size_type)}</td></tr></table><h2>소방대응여건</h2><div class="fire"><div class="firetitle">${n(f.final_nearest_119_name)}</div><div class="frow"><span>직선거리</span><b>${d(f.final_fire_station_linear_m)}</b></div><div class="frow"><span>도로거리</span><b>${d(f.final_fire_station_road_m)}</b></div><div class="frow"><span>예상 이동시간</span><b>${t(f.final_fire_response_min)}</b></div><div class="status ${w?'weak':f.response_type==='119접근양호형'?'good':'unknown'}">${n(f.response_type)}</div><button class="response-btn" id="show-response">지정 소방기관·이동경로 보기</button><div id="route-status" class="note" aria-live="polite">${original.fire_station?'지정 소방기관 좌표가 연결되어 있습니다. 위 버튼으로 위치를 확인하세요.':'최종 지정 소방기관의 좌표 확인이 필요합니다. 기존 계산 결과는 유지됩니다.'}</div></div>`;id('show-response').onclick=()=>showResponse(original);id('right').classList.add('open');document.querySelector('.main').classList.add('detailopen')}window.closeDetail=()=>{clearResponse();id('right').classList.remove('open');document.querySelector('.main').classList.remove('detailopen')};function apply(){c.sido=id('sido').value;c.sigungu=id('sigungu').value;c.ft=document.querySelector('input[name="ft"]:checked').value;['location_type','forest_zone','building_type','size_type','response_type'].forEach(k=>c[k]=vals(k));render();id('modal').classList.remove('on');document.querySelector('.main').classList.remove('layeropen')}function reset(){id('search').value='';Object.assign(c,{sido:'',sigungu:'',ft:'',location_type:[],forest_zone:[],building_type:[],size_type:[],response_type:[]});id('sido').value='';sg();document.querySelector('input[name="ft"][value=""]').checked=true;document.querySelectorAll('[data-k]').forEach(x=>x.checked=false);render()}id('layers').onclick=()=>{id('modal').classList.add('on');document.querySelector('.main').classList.add('layeropen')};id('close').onclick=()=>{id('modal').classList.remove('on');document.querySelector('.main').classList.remove('layeropen')};id('apply').onclick=apply;id('reset').onclick=reset;id('sido').onchange=()=>{sg();c.sido=id('sido').value;c.sigungu='';render()};id('sigungu').onchange=()=>{c.sigungu=id('sigungu').value;render()};document.querySelectorAll('[data-k],input[name="ft"]').forEach(e=>e.onchange=()=>{c.ft=document.querySelector('input[name="ft"]:checked').value;['location_type','forest_zone','building_type','size_type','response_type'].forEach(k=>c[k]=vals(k));render()});id('searchbtn').onclick=searchFacilities;id('search').addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.isComposing){e.preventDefault();searchFacilities()}});id('all').onclick=()=>{map.setLevel(13);map.setCenter(new kakao.maps.LatLng(36.35,127.75))};fetch('data/map/manifest.json').then(r=>{if(!r.ok)throw Error('data');return r.json()}).then(files=>Promise.all(files.map(path=>fetch(path).then(r=>{if(!r.ok)throw Error('data');return r.json()})))).then(chunks=>chunks.flat()).then(x=>{data=x;dataLoaded=true;fill();render()}).catch(()=>{id('count').textContent='오류';document.querySelector('.tip').textContent='시설 데이터를 불러오지 못했습니다. 새로고침해 주세요.'});

}
start();
