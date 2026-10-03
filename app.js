const tours = [
  {
    id:'fishing',
    title:'Câu cá lớn Phú Quốc',
    short:'Ra khơi, săn những con cá thật sự ngoài khơi Phú Quốc.',
    image:'https://images.unsplash.com/photo-1634043270873-f2f830e5d4bf?auto=format&fit=crop&q=84&w=1000',
    meta:['05:00-14:00 / 14:00-21:00','An Thới','Đáy & jig'],
    facts:{'Thời lượng':'Khoảng 9 giờ','Khu vực':'An Thới - Hòn Dăm Trong','Kiểu đi':'Theo lịch xác nhận','Phù hợp':'Người thật sự muốn câu cá'},
    description:'Chuyến câu cá tập trung vào trải nghiệm ngoài khơi, không ghép thêm một loạt điểm tham quan cho đủ lịch. JoTrip kiểm tra biển, lịch tàu và cách câu phù hợp trước khi xác nhận.'
  },
  {
    id:'snorkeling',
    title:'Lặn biển ngắm san hô',
    short:'Khám phá thế giới đầy màu sắc dưới lòng biển.',
    image:'https://images.unsplash.com/photo-1687708167559-edc5ee364615?auto=format&fit=crop&q=84&w=1000',
    meta:['Nửa / nguyên ngày','Gia đình','Theo visibility'],
    facts:{'Thời lượng':'Nửa ngày hoặc nguyên ngày','Trọng tâm':'Thời gian ở dưới nước','Kiểu đi':'Private / theo lịch','Lưu ý':'Visibility được kiểm tra trước chuyến'},
    description:'Không mặc định nước trong chỉ vì trời nắng. JoTrip ưu tiên điều kiện thực tế, khả năng của nhóm và thời gian thật sự ở dưới nước.'
  },
  {
    id:'islands',
    title:'Tour 3 - 4 đảo',
    short:'Những hòn đảo đẹp nhất, nước trong và bãi biển yên bình.',
    image:'https://images.pexels.com/photos/37045534/pexels-photo-37045534/free-photo-of-vista-aerea-de-una-estructura-flotante-cerca-de-una-isla-tropical.jpeg?auto=compress&cs=tinysrgb&w=1000',
    meta:['Nguyên ngày','Nam đảo','Shared / Private'],
    facts:{'Thời lượng':'Nguyên ngày','Khu vực':'Cụm đảo phía Nam','Kiểu đi':'Shared hoặc Private','Nhịp chuyến':'Ưu tiên thời gian ở điểm đẹp'},
    description:'Không chạy đảo chỉ để đủ số lượng. Lộ trình được sắp xếp theo điều kiện biển và cách nhóm của bạn muốn dành thời gian trong ngày.'
  },
  {
    id:'private',
    title:'Cano riêng theo yêu cầu',
    short:'Một ngày trên biển theo cách của bạn.',
    image:'https://images.pexels.com/photos/37571067/pexels-photo-37571067/free-photo-of-boats-on-turquoise-waters-in-phu-quoc-vietnam.jpeg?auto=compress&cs=tinysrgb&w=1000',
    meta:['Private','Linh hoạt','Thiết kế riêng'],
    facts:{'Thời lượng':'Theo lịch thiết kế','Điểm đi':'Theo vận hành thực tế','Kiểu đi':'Private','Có thể ưu tiên':'Bơi - lặn - bãi biển - ăn trưa - sunset'},
    description:'Đây là sản phẩm để bắt đầu từ người đi cùng bạn, không phải từ một route đóng sẵn. JoTrip đề xuất lộ trình sau khi biết nhóm, thời gian và điều bạn muốn nhất.'
  },
  {
    id:'yacht',
    title:'Du thuyền & Hoàng hôn',
    short:'Không gian riêng tư, dịch vụ chu đáo, khoảnh khắc khó quên.',
    image:'https://images.pexels.com/photos/37571062/pexels-photo-37571062/free-photo-of-beautiful-sunset-over-phu-quoc-sea.jpeg?auto=compress&cs=tinysrgb&w=1000',
    meta:['Private charter','2-4 giờ','Sunset'],
    facts:{'Thời lượng':'Khoảng 2-4 giờ','Trọng tâm':'Không gian riêng & sunset','Kiểu đi':'Private charter','Xác nhận':'Theo tàu và lịch thực tế'},
    description:'Chọn tàu trước, sau đó mới chốt cách sử dụng thời gian trên biển. Không dùng hình yacht đẹp để thay cho thông tin về tàu thật.'
  },
  {
    id:'squid',
    title:'Câu mực đêm',
    short:'Trải nghiệm đời sống biển đêm cùng ngư dân địa phương.',
    image:'https://images.unsplash.com/photo-1517825738774-7de9363ef735?auto=format&fit=crop&q=84&w=1000',
    meta:['Buổi tối','Đời sống biển','Không đảm bảo mực'],
    facts:{'Thời lượng':'Buổi tối','Trọng tâm':'Trải nghiệm biển đêm','Kiểu đi':'Theo lịch vận hành','Lưu ý':'Không cam kết sản lượng câu'},
    description:'Ánh đèn, mặt biển tối và nhịp làm việc của người đi biển là phần chính của chuyến đi. Việc câu được nhiều hay ít phụ thuộc điều kiện thực tế.'
  },
  {
    id:'sunset',
    title:'Ngắm hoàng hôn',
    short:'Một buổi chiều ít lịch trình hơn và nhiều thời gian hơn cho biển.',
    image:'https://images.pexels.com/photos/37571062/pexels-photo-37571062/free-photo-of-beautiful-sunset-over-phu-quoc-sea.jpeg?auto=compress&cs=tinysrgb&w=1000',
    meta:['Chiều muộn','Nhẹ nhàng','Theo thời tiết'],
    facts:{'Thời lượng':'Khoảng 2-3 giờ','Thời điểm':'Chiều muộn','Kiểu đi':'Theo lịch / Private','Lưu ý':'Mây có thể che sunset'},
    description:'Phù hợp khi bạn muốn một chuyến ngắn và thư thả. JoTrip theo dõi mây, gió và điều kiện biển thay vì hứa trước một hoàng hôn hoàn hảo.'
  }
];

const strip = document.getElementById('tour-strip');
const search = document.getElementById('experience-search');
const emptyState = document.getElementById('empty-state');
const requestDialog = document.getElementById('request-dialog');
const requestExperience = document.getElementById('request-experience');
const requestForm = document.getElementById('request-form');
const requestFeedback = document.getElementById('request-feedback');
const tourDialog = document.getElementById('tour-dialog');
const detailContent = document.getElementById('tour-detail-content');
let activeFilter = '';

function tourCard(t){
  return `<article class="tour-card" data-id="${t.id}">
    <div class="tour-media"><img src="${t.image}" alt="${t.title}" loading="lazy"></div>
    <div class="tour-body">
      <div class="tour-title-row"><h3>${t.title}</h3><button class="card-arrow" type="button" data-detail="${t.id}" aria-label="Xem ${t.title}">→</button></div>
      <p>${t.short}</p>
      <div class="tour-meta">${t.meta.map(x=>`<span>${x}</span>`).join('')}</div>
    </div>
  </article>`;
}

function renderTours(){
  const q = search.value.trim().toLowerCase();
  const list = tours.filter(t => (!activeFilter || t.id === activeFilter) && (!q || `${t.title} ${t.short} ${t.meta.join(' ')}`.toLowerCase().includes(q)));
  strip.innerHTML = list.map(tourCard).join('');
  emptyState.hidden = !!list.length;
  document.querySelectorAll('[data-detail]').forEach(btn => btn.addEventListener('click',()=>openTour(btn.dataset.detail)));
}

function filterTo(id){
  activeFilter = id;
  search.value = '';
  renderTours();
  document.getElementById('experiences').scrollIntoView({behavior:'smooth',block:'start'});
}

function openTour(id){
  const t = tours.find(x=>x.id===id);
  if(!t) return;
  detailContent.innerHTML = `
    <div class="detail-hero"><img src="${t.image}" alt="${t.title}"></div>
    <p class="section-kicker">JOTRIP SEA</p>
    <h2>${t.title}</h2>
    <p class="detail-desc">${t.description}</p>
    <div class="detail-grid">${Object.entries(t.facts).map(([k,v])=>`<div class="detail-fact"><small>${k}</small><strong>${v}</strong></div>`).join('')}</div>
    <div class="detail-actions"><button class="secondary" type="button" data-close-tour-secondary>Đóng</button><button class="primary" type="button" data-request-from-detail="${t.id}">Kiểm tra lịch →</button></div>`;
  detailContent.querySelector('[data-close-tour-secondary]').addEventListener('click',()=>tourDialog.close());
  detailContent.querySelector('[data-request-from-detail]').addEventListener('click',e=>{tourDialog.close();openRequest(e.currentTarget.dataset.requestFromDetail)});
  tourDialog.showModal();
}

function openRequest(id=''){
  requestExperience.value = id;
  requestFeedback.textContent='';
  requestDialog.showModal();
}

tours.forEach(t=>{const o=document.createElement('option');o.value=t.id;o.textContent=t.title;requestExperience.appendChild(o)});
renderTours();

search.addEventListener('input',()=>{activeFilter='';renderTours()});
document.querySelector('.search-go').addEventListener('click',()=>{activeFilter='';renderTours();document.getElementById('experiences').scrollIntoView({behavior:'smooth'})});
document.querySelectorAll('[data-filter]').forEach(b=>b.addEventListener('click',()=>filterTo(b.dataset.filter)));
document.querySelectorAll('[data-clear-filter]').forEach(b=>b.addEventListener('click',()=>{activeFilter='';search.value='';renderTours()}));
document.querySelectorAll('[data-open-request]').forEach(b=>b.addEventListener('click',()=>openRequest()));
document.querySelectorAll('[data-focus-search]').forEach(b=>b.addEventListener('click',()=>search.focus()));
document.querySelectorAll('[data-open-guide]').forEach(b=>b.addEventListener('click',()=>document.getElementById('about').scrollIntoView({behavior:'smooth'})));
document.querySelector('[data-close-tour]').addEventListener('click',()=>tourDialog.close());
requestForm.addEventListener('submit',e=>{e.preventDefault();requestFeedback.textContent='Đã ghi nhận trên giao diện. Kênh gửi yêu cầu sẽ được nối sau khi chốt luồng booking mới.'});

const navButtons = [...document.querySelectorAll('[data-nav]')];
const menus = {experiences:document.getElementById('menu-experiences'),destinations:document.getElementById('menu-destinations'),guide:document.getElementById('menu-guide')};
navButtons.forEach(btn=>btn.addEventListener('click',()=>{const target=menus[btn.dataset.nav];Object.values(menus).forEach(m=>{if(m!==target)m.hidden=true});target.hidden=!target.hidden}));
document.addEventListener('click',e=>{if(!e.target.closest('[data-nav]')&&!e.target.closest('.mega-menu'))Object.values(menus).forEach(m=>m.hidden=true)});

const mobileBtn=document.querySelector('.mobile-menu-btn');
mobileBtn.addEventListener('click',()=>{const opened=mobileBtn.getAttribute('aria-expanded')==='true';mobileBtn.setAttribute('aria-expanded',String(!opened));const m=menus.experiences;m.hidden=opened;if(!opened){m.style.left='12px';m.style.right='12px';m.style.transform='none'}});

async function loadWeather(){
  try{
    const [weatherRes,marineRes]=await Promise.all([
      fetch('https://api.open-meteo.com/v1/forecast?latitude=10.217&longitude=103.959&current=temperature_2m,precipitation,weather_code,wind_speed_10m&wind_speed_unit=ms&timezone=Asia%2FBangkok'),
      fetch('https://marine-api.open-meteo.com/v1/marine?latitude=10.217&longitude=103.959&current=wave_height&timezone=Asia%2FBangkok')
    ]);
    const weather=await weatherRes.json(); const marine=await marineRes.json();
    const c=weather.current||{}; const m=marine.current||{};
    document.getElementById('temperature').textContent=Number.isFinite(c.temperature_2m)?Math.round(c.temperature_2m):'--';
    document.getElementById('wind').textContent=Number.isFinite(c.wind_speed_10m)?`${c.wind_speed_10m.toFixed(1)} m/s`:'-- m/s';
    document.getElementById('wave').textContent=Number.isFinite(m.wave_height)?`${m.wave_height.toFixed(1)} m`:'-- m';
    document.getElementById('rain').textContent=Number.isFinite(c.precipitation)?`${c.precipitation.toFixed(1)} mm`:'-- mm';
    const label=weatherLabel(c.weather_code);document.getElementById('weather-condition').textContent=label.text;document.getElementById('weather-icon').textContent=label.icon;document.getElementById('weather-status').textContent='Live';
  }catch(err){document.getElementById('weather-status').textContent='Chưa tải được';}
}
function weatherLabel(code){
  if(code===0)return{icon:'☀︎',text:'Trời quang'};
  if([1,2].includes(code))return{icon:'⛅',text:'Ít mây'};
  if(code===3)return{icon:'☁',text:'Nhiều mây'};
  if([51,53,55,61,63,65,80,81,82].includes(code))return{icon:'🌦',text:'Có mưa cục bộ'};
  if([95,96,99].includes(code))return{icon:'⛈',text:'Có dông'};
  return{icon:'☁',text:'Đang cập nhật'};
}
loadWeather();
