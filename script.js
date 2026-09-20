(function(){
"use strict";

const KEY="ticketwaves_state_v10";
const LEGACY_KEYS=["ticketwaves_state_v9","ticketwaves_state_v8","ticketwaves_state_v7","ticketwaves_state_v6"];
const FALLBACK="https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=1200&q=85";

const defaultState={
  country:"US",
  tickets:[{
    id:"demo",
    eventName:"Your Event",
    artistName:"Artist / Performer",
    venue:"Your Venue",
    location:"City, Country",
    date:"2026-12-12",
    time:"20:00",
    image:FALLBACK,
    mapQuery:"Your Venue, City, Country",
    order:"ORDER-000001",
    extraInfo:"Mobile Ticket",
    tickets:[{id:"seat-1",section:"A1",row:"1",seat:"1",barcode:"000000000001"}]
  }],
  transfers:[],
  profile:{firstName:"",lastName:"",email:""}
};

const countries=[
 ["US","🇺🇸","United States"],["NG","🇳🇬","Nigeria"],["CA","🇨🇦","Canada"],["GB","🇬🇧","United Kingdom"],
 ["AU","🇦🇺","Australia"],["DE","🇩🇪","Germany"],["FR","🇫🇷","France"],["ES","🇪🇸","Spain"],
 ["BE","🇧🇪","Belgium"],["NL","🇳🇱","Netherlands"],["IE","🇮🇪","Ireland"],["ZA","🇿🇦","South Africa"],
 ["AE","🇦🇪","United Arab Emirates"],["JP","🇯🇵","Japan"],["KR","🇰🇷","South Korea"],["MX","🇲🇽","Mexico"]
];

function clone(v){return JSON.parse(JSON.stringify(v))}
function uid(p){return p+"-"+Date.now().toString(36)+"-"+Math.random().toString(36).slice(2,8)}
function esc(v){return String(v==null?"":v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]))}
function el(id){return document.getElementById(id)}
function q(s){return document.querySelector(s)}
function qa(s){return [...document.querySelectorAll(s)]}
function save(){localStorage.setItem(KEY,JSON.stringify(state))}
function readSaved(){
  const keys=[KEY,...LEGACY_KEYS];
  for(const k of keys){
    try{
      const v=JSON.parse(localStorage.getItem(k)||"");
      if(v&&typeof v==="object"){
        if(Array.isArray(v.tickets)) return normalize(v);
      }
    }catch(e){}
  }
  return clone(defaultState);
}
function normalize(v){
  const s=clone(defaultState);
  s.country=v.country||"US";
  s.tickets=Array.isArray(v.tickets)?v.tickets.map(t=>({
    id:t.id||uid("event"),
    eventName:t.eventName||"Your Event",
    artistName:t.artistName||"",
    venue:t.venue||"Your Venue",
    location:t.location||"",
    date:t.date||"",
    time:t.time||"",
    image:t.image||t.eventImage||FALLBACK,
    mapQuery:t.mapQuery||t.venue||"",
    order:t.order||t.orderNumber||"ORDER-000001",
    extraInfo:t.extraInfo||"Mobile Ticket",
    tickets:Array.isArray(t.tickets)?t.tickets.map(x=>({
      id:x.id||uid("seat"),
      section:x.section||"",
      row:x.row||"",
      seat:x.seat||"",
      barcode:x.barcode||uid("code")
    })):[],
  })):clone(defaultState.tickets);
  s.transfers=Array.isArray(v.transfers)?v.transfers:[]; 
  s.profile=Object.assign({},clone(defaultState.profile),v.profile||v.user||{});
  return s;
}
let state=readSaved();

function route(){
  const r=location.hash.replace(/^#/,"");
  return r||"/my-tickets";
}
function go(r){
  location.hash=r;
}
function currentCountry(){
  return countries.find(c=>c[0]===state.country)||countries[0];
}
function dateLabel(d,t){
  if(!d) return "";
  const x=new Date(d+"T12:00:00");
  if(Number.isNaN(x.getTime())) return d;
  const day=x.toLocaleDateString(undefined,{weekday:"short"}).toUpperCase();
  const mon=x.toLocaleDateString(undefined,{month:"short"}).toUpperCase();
  return day+" • "+mon+" "+x.getDate()+", "+x.getFullYear()+(t?" • "+timeLabel(t):"");
}
function timeLabel(t){
  if(!t)return "";
  const [hh,mm]=(String(t).split(":").concat("00")).slice(0,2);
  let h=Number(hh); const ap=h>=12?"PM":"AM"; h=h%12||12;
  return h+":"+mm+" "+ap;
}
function img(url){return url||FALLBACK}
function ticketGlyph(){return "▣"}

function bottom(active){
  const items=[
    ["/discover","⌕","Discover"],["/for-you","♥","For You"],["/my-tickets","◇","My Tickets"],
    ["/sell","$","Sell"],["/account","●","Account"]
  ];
  return '<nav class="bottom-nav">'+items.map(i=>
    '<button class="nav-item '+(i[0]===active?"active":"")+'" onclick="go(\''+i[0]+'\')"><span class="nav-icon">'+i[1]+'</span><span class="nav-label">'+i[2]+'</span></button>'
  ).join("")+"</nav>";
}
function header(title,back=true){
  return '<header class="header"><div class="left">'+(back?'<button class="back" onclick="history.back()">‹</button>':'')+'</div><div class="title">'+esc(title)+'</div><div class="right"><button class="help" onclick="showHelp()">Help</button></div></header>';
}
function render(body,active){
  el("app").innerHTML='<div class="app"><div class="shell">'+body+'</div>'+bottom(active)+'</div>';
}
function showHelp(){
  alert("Need help? Use For You to edit your event and tickets.");
}
function toast(text){
  const x=document.createElement("div");x.className="toast";x.textContent=text;document.body.appendChild(x);
  setTimeout(()=>x.remove(),2200);
}

function myTickets(){
  const upcoming=state.tickets.filter(t=>new Date((t.date||"9999-12-31")+"T23:59:59")>=new Date());
  const past=state.tickets.filter(t=>!upcoming.includes(t));
  return render(
    header("My Events",false)+
    '<div class="subnav"><button class="subtab active">UPCOMING ('+upcoming.length+')</button><button class="subtab" onclick="showPast()">PAST ('+past.length+')</button></div>'+
    '<div class="event-list">'+(upcoming.length?upcoming.map(eventCard).join(""):'<div class="empty"><h2>No upcoming events</h2><p>Add one from For You.</p></div>')+'</div>',
    "/my-tickets"
  );
}
function showPast(){
  const past=state.tickets.filter(t=>new Date((t.date||"1900-01-01")+"T23:59:59")<new Date());
  render(
    header("My Events",false)+
    '<div class="subnav"><button class="subtab" onclick="myTickets()">UPCOMING ('+state.tickets.filter(t=>new Date((t.date||"9999-12-31")+"T23:59:59")>=new Date()).length+')</button><button class="subtab active">PAST ('+past.length+')</button></div>'+
    '<div class="event-list">'+(past.length?past.map(eventCard).join(""):'<div class="empty"><h2>No past events</h2><p>Your past events will appear here.</p></div>')+'</div>',
    "/my-tickets"
  );
}
function eventCard(g){
  return '<article class="event-card">'+
    '<img src="'+esc(img(g.image))+'" alt="">'+
    '<div class="shade"></div>'+
    '<div class="event-copy">'+
      '<div class="event-date">'+esc(dateLabel(g.date,g.time))+'</div>'+
      '<div class="event-title">'+esc(g.eventName)+'</div>'+
      '<div class="event-venue">'+esc(g.venue)+(g.location?" • "+esc(g.location):"")+'</div>'+
    '</div>'+
    '<button class="view-button" onclick="go(\'/event/'+encodeURIComponent(g.id)+'\')"><span class="small-icon">'+ticketGlyph()+'</span>View Tickets</button>'+
  '</article>';
}

function eventPage(id){
  const g=state.tickets.find(x=>x.id===decodeURIComponent(id));
  if(!g){go("/my-tickets");return}
  const count=g.tickets.length;
  return render(
    header("",true)+
    '<main class="content">'+
      '<section class="hero">'+
        '<img src="'+esc(img(g.image))+'" alt="">'+
        '<div class="hero-shade"></div>'+
        '<div class="hero-info">'+
          '<div class="hero-date">'+esc(dateLabel(g.date,g.time))+'</div>'+
          '<div class="hero-name">'+esc(g.eventName)+'</div>'+
          '<div class="hero-meta">'+esc(g.venue)+(g.location?" • "+esc(g.location):"")+'</div>'+
        '</div>'+
        '<div class="hero-count">'+ticketGlyph()+' x'+count+'</div>'+
      '</section>'+
      '<div class="ticket-action"><button onclick="viewTickets(\''+encodeURIComponent(g.id)+'\')">▣ View Tickets</button></div>'+
      '<section class="order">'+
        '<div class="order-head"><div><div class="order-num">Order #'+esc(g.order)+'</div><div class="order-sub">x'+count+' Ticket'+(count===1?"":"s")+'</div></div><button class="dots" onclick="eventMenu(\''+encodeURIComponent(g.id)+'\')">⋮</button></div>'+
        g.tickets.map((t,i)=>ticketCard(g,t,i)).join("")+
        '<div class="more-options">MORE OPTIONS</div>'+
        '<div class="map"><iframe loading="lazy" title="Map" src="https://www.openstreetmap.org/export/embed.html?bbox=-79.43%2C43.63%2C-79.32%2C43.72&layer=mapnik"></iframe></div>'+
        '<div class="map-actions">'+
          '<button onclick="toast(\'Upgrade options\')">↥ Upgrade</button>'+
          '<button onclick="openTransfer(\''+encodeURIComponent(g.id)+'\')">↗ Transfer</button>'+
          '<button onclick="startSell(\''+encodeURIComponent(g.id)+'\')">⟳ Sell</button>'+
        '</div>'+
        '<a class="directions" target="_blank" rel="noopener" href="https://www.openstreetmap.org/search?query='+encodeURIComponent((g.mapQuery||g.venue+" "+g.location)||"venue")+'">Get Directions</a>'+
      '</section>'+
      '<section class="extras">'+
        '<h2>EXTRAS</h2>'+
        '<div class="got-card">'+
          '<div class="got-visual"><img src="'+esc(img(g.image))+'" alt=""><div class="got-word">YOU GOT<br>TICKETS!</div></div>'+
          '<div class="share"><h3>Post on Social Media</h3><p>Build hype for the event, and share that you got tickets with your friends and family.</p><button onclick="shareEvent(\''+encodeURIComponent(g.id)+'\')">Share You’re Going ↗</button></div>'+
        '</div>'+
      '</section>'+
    '</main>',
    "/my-tickets"
  );
}
function ticketCard(g,t,i){
  const p=state.transfers.find(x=>x.eventId===g.id&&x.ticketIndex===i&&x.status==="pending");
  return '<div class="ticket-card"><div class="ticket-head">'+esc(g.extraInfo||"TICKET")+'</div>'+
    '<div class="seats"><div><div class="seat-label">SECTION</div><div class="seat-value">'+esc(t.section||"—")+'</div></div>'+
    '<div><div class="seat-label">ROW</div><div class="seat-value">'+esc(t.row||"—")+'</div></div>'+
    '<div><div class="seat-label">SEAT</div><div class="seat-value">'+esc(t.seat||"—")+'</div></div></div>'+
    (p?'<div class="pending"><span>↗ Transfer Pending: '+esc(p.firstName+" "+p.lastName)+'</span><button onclick="cancelTransfer(\''+encodeURIComponent(g.id)+'\','+i+')">Cancel</button></div>':"")+
  '</div>';
}

function viewTickets(id){
  const g=state.tickets.find(x=>x.id===decodeURIComponent(id));
  if(!g)return;
  const m=el("modal");
  const cards=g.tickets.map((t,i)=>
    '<div class="entry-card"><div class="entry-blue">'+
      '<div class="entry-name">'+esc(g.eventName)+'</div>'+
      '<div class="entry-grid"><div><span>SEC</span><strong>'+esc(t.section||"—")+'</strong></div><div><span>ROW</span><strong>'+esc(t.row||"—")+'</strong></div><div><span>SEAT</span><strong>'+esc(t.seat||"—")+'</strong></div></div>'+
      '<div class="entry-venue">'+esc(g.venue)+(g.location?" • "+esc(g.location):"")+'</div>'+
    '</div><div class="barcode"></div><div class="barcode-number">'+esc(t.barcode||g.order||"")+'</div><button class="wallet" onclick="toast(\'Wallet action ready to connect\')">Add to Wallet</button><div class="qr-note">Entry code appears only in View Tickets.</div></div>'
  ).join("");
  m.innerHTML='<div class="sheet"><div class="sheet-handle"></div><div class="sheet-head"><span>'+g.tickets.length+' Ticket'+(g.tickets.length===1?"":"s")+'</span><button class="close" onclick="closeModal()">Done</button></div><div class="entry-wrap">'+cards+'</div></div>';
  m.classList.add("show");m.setAttribute("aria-hidden","false");
}
function closeModal(){const m=el("modal");m.className="modal";m.innerHTML="";m.setAttribute("aria-hidden","true")}
function eventMenu(id){
  const g=state.tickets.find(x=>x.id===decodeURIComponent(id));
  if(!g)return;
  const m=el("modal");
  m.innerHTML='<div class="sheet"><div class="sheet-handle"></div><div class="sheet-head"><span>Event Options</span><button class="close" onclick="closeModal()">Close</button></div><div class="sheet-body"><button class="primary" onclick="editEvent(\''+encodeURIComponent(g.id)+'\');closeModal()">Edit Event</button><button class="secondary" onclick="deleteEvent(\''+encodeURIComponent(g.id)+'\')">Delete Event</button></div></div>';
  m.classList.add("show");
}
function deleteEvent(id){
  const d=decodeURIComponent(id);
  if(!confirm("Delete this event?"))return;
  state.tickets=state.tickets.filter(t=>t.id!==d);save();closeModal();go("/my-tickets");
}
function shareEvent(id){
  const g=state.tickets.find(x=>x.id===decodeURIComponent(id));if(!g)return;
  const text="I got tickets for "+g.eventName+"!";
  if(navigator.share){navigator.share({title:g.eventName,text}).catch(()=>{})}
  else {navigator.clipboard?.writeText(text).then(()=>toast("Share text copied")); }
}

function openTransfer(id){
  const g=state.tickets.find(x=>x.id===decodeURIComponent(id));if(!g)return;
  const m=el("modal");
  const options=g.tickets.map((t,i)=>'<option value="'+i+'">Ticket '+(i+1)+' — Section '+esc(t.section||"—")+' / Row '+esc(t.row||"—")+' / Seat '+esc(t.seat||"—")+'</option>').join("");
  m.innerHTML='<div class="sheet"><div class="sheet-handle"></div><div class="sheet-head"><span>TRANSFER TICKETS</span><button class="close" onclick="closeModal()">Done</button></div>'+
    '<div class="sheet-body"><div class="transfer-row"><label>SELECT TICKET</label><select id="trTicket" class="select">'+options+'</select></div>'+
    '<div class="transfer-row"><label>FIRST NAME*</label><input id="trFirst" class="input" placeholder="Enter First Name"></div>'+
    '<div class="transfer-row"><label>LAST NAME*</label><input id="trLast" class="input" placeholder="Enter Last Name"></div>'+
    '<div class="transfer-row"><label>EMAIL*</label><input id="trEmail" class="input" type="email" placeholder="Enter Email Address"></div>'+
    '<div class="transfer-row"><label>NOTE</label><textarea id="trNote" class="textarea" placeholder="Add a note"></textarea></div></div>'+
    '<div class="transfer-actions"><button class="back-btn" onclick="closeModal()">Back</button><button id="forwardBtn" class="forward-btn" onclick="submitTransfer(\''+encodeURIComponent(g.id)+'\')">Forward Ticket</button></div></div>';
  m.classList.add("show");
  ["trFirst","trLast","trEmail"].forEach(x=>el(x).addEventListener("input",transferReady));
  transferReady();
}
function transferReady(){
  const ok=el("trFirst")?.value.trim()&&el("trLast")?.value.trim()&&el("trEmail")?.value.trim();
  el("forwardBtn")?.classList.toggle("ready",!!ok);
}
function submitTransfer(id){
  const g=state.tickets.find(x=>x.id===decodeURIComponent(id));if(!g)return;
  const first=el("trFirst")?.value.trim(),last=el("trLast")?.value.trim(),email=el("trEmail")?.value.trim(),idx=Number(el("trTicket")?.value||0);
  if(!first||!last||!email){toast("Complete the required fields");return}
  state.transfers=state.transfers.filter(x=>!(x.eventId===g.id&&x.ticketIndex===idx&&x.status==="pending"));
  state.transfers.push({id:uid("transfer"),eventId:g.id,ticketId:g.tickets[idx]?.id||"",ticketIndex:idx,firstName:first,lastName:last,email,note:el("trNote")?.value||"",status:"pending"});
  save();closeModal();go("/event/"+encodeURIComponent(g.id));toast("Transfer Pending");
}
function cancelTransfer(id,i){
  const d=decodeURIComponent(id);
  state.transfers=state.transfers.filter(x=>!(x.eventId===d&&x.ticketIndex===i&&x.status==="pending"));
  save();eventPage(d);
}
function startSell(id){
  const g=state.tickets.find(x=>x.id===decodeURIComponent(id));if(!g)return;
  toast("Sell flow ready for connection");
}

function discover(){
  render(header("Discover",false)+'<main class="content"><div class="discover-hero"><input class="search" id="discoverSearch" placeholder="Artist, Event or Venue"></div>'+
    '<div class="list-card"><h3>Find your next event</h3><p>Browse events and use For You to create or edit your ticket details.</p></div></main>',"/discover");
  const box=el("discoverSearch");
  if(box) box.addEventListener("keydown",function(event){ if(event.key==="Enter") toast("Search ready"); });
}
function forYou(editId){
  const editing=editId?state.tickets.find(t=>t.id===decodeURIComponent(editId)):null;
  let g=editing||{eventName:"",artistName:"",venue:"",location:"",date:"",time:"",image:"",mapQuery:"",order:"",extraInfo:"Mobile Ticket",tickets:[{id:uid("seat"),section:"",row:"",seat:"",barcode:""}]};
  render(header(editing?"Edit Event":"For You",true)+'<form class="form" onsubmit="saveEvent(event,\''+(editing?encodeURIComponent(editing.id):"")+'\')">'+
    '<div class="field"><label>Event Name</label><input id="fName" class="input" required value="'+esc(g.eventName)+'"></div>'+
    '<div class="field"><label>Artist / Performer</label><input id="fArtist" class="input" value="'+esc(g.artistName)+'"></div>'+
    '<div class="field"><label>Venue</label><input id="fVenue" class="input" value="'+esc(g.venue)+'"></div>'+
    '<div class="field"><label>Location</label><input id="fLocation" class="input" value="'+esc(g.location)+'"></div>'+
    '<div class="field"><label>Date</label><input id="fDate" class="input" type="date" value="'+esc(g.date)+'"></div>'+
    '<div class="field"><label>Time</label><input id="fTime" class="input" type="time" value="'+esc(g.time)+'"></div>'+
    '<div class="field"><label>Map Search</label><input id="fMap" class="input" value="'+esc(g.mapQuery)+'" placeholder="Venue, city, country"></div>'+
    '<div class="field"><label>Order Number</label><input id="fOrder" class="input" value="'+esc(g.order)+'"></div>'+
    '<div class="field"><label>Ticket Label</label><input id="fExtra" class="input" value="'+esc(g.extraInfo)+'"></div>'+
    '<div class="field"><label>Event Image</label><input id="fImageFile" class="file-input" type="file" accept="image/*" onchange="previewImage(event)"><input id="fImage" class="input" placeholder="Or paste image URL" value="'+(g.image&&g.image.startsWith("data:")?"":esc(g.image))+'"><div id="imagePreview"></div></div>'+
    '<div class="field"><label>Tickets / Seats</label><div id="seatEditors">'+g.tickets.map(seatEditor).join("")+'</div><button type="button" class="secondary" onclick="addSeat()">+ Add Another Ticket</button></div>'+
    '<button class="primary" type="submit">'+(editing?"Save Changes":"Add Event / Tickets")+'</button>'+
    (editing?'<button type="button" class="secondary" onclick="deleteEventFromForm(\''+encodeURIComponent(editing.id)+'\')">Delete Event</button>':"")+
  '</form>',"/for-you");
}
function seatEditor(t){
  return '<div class="seat-editor" data-seat="'+esc(t.id)+'"><button type="button" class="remove" onclick="this.parentElement.remove()">Remove</button>'+
    '<div class="field"><label>Section</label><input class="input sec" value="'+esc(t.section)+'"></div>'+
    '<div class="field"><label>Row</label><input class="input row" value="'+esc(t.row)+'"></div>'+
    '<div class="field"><label>Seat</label><input class="input seat" value="'+esc(t.seat)+'"></div>'+
    '<div class="field"><label>Barcode / Entry Code</label><input class="input code" value="'+esc(t.barcode)+'"></div></div>';
}
function addSeat(){
  const w=el("seatEditors");if(w)w.insertAdjacentHTML("beforeend",seatEditor({id:uid("seat"),section:"",row:"",seat:"",barcode:""}));
}
function previewImage(e){
  const file=e.target.files?.[0];if(!file)return;
  const reader=new FileReader();
  reader.onload=()=>{const p=el("imagePreview");if(p)p.innerHTML='<img src="'+reader.result+'" style="width:100%;height:150px;object-fit:cover;border-radius:8px;margin-top:8px">';window.__pickedImage=reader.result};
  reader.readAsDataURL(file);
}
function saveEvent(e,id){
  e.preventDefault();
  const seats=qa(".seat-editor").map(x=>({id:x.dataset.seat||uid("seat"),section:x.querySelector(".sec")?.value.trim()||"",row:x.querySelector(".row")?.value.trim()||"",seat:x.querySelector(".seat")?.value.trim()||"",barcode:x.querySelector(".code")?.value.trim()||""}));
  let image=window.__pickedImage||el("fImage")?.value.trim()||"";
  const data={eventName:el("fName").value.trim(),artistName:el("fArtist").value.trim(),venue:el("fVenue").value.trim(),location:el("fLocation").value.trim(),date:el("fDate").value,time:el("fTime").value,mapQuery:el("fMap").value.trim(),order:el("fOrder").value.trim()||"ORDER-000001",extraInfo:el("fExtra").value.trim()||"Mobile Ticket",image:image||FALLBACK,tickets:seats.length?seats:[{id:uid("seat"),section:"",row:"",seat:"",barcode:uid("code")}]};
  if(id){
    const d=decodeURIComponent(id),i=state.tickets.findIndex(x=>x.id===d);if(i>=0)state.tickets[i]=Object.assign({id:d},data);
  }else state.tickets.push(Object.assign({id:uid("event")},data));
  window.__pickedImage=null;save();go("/my-tickets");
}
function editEvent(id){go("/for-you/edit/"+id)}
function deleteEventFromForm(id){
  if(confirm("Delete this event?"))deleteEvent(id);
}
function account(){
  render(header("Account",false)+'<main class="content"><div class="form">'+
    '<div class="field"><label>First Name</label><input class="input" id="pFirst" value="'+esc(state.profile.firstName)+'"></div>'+
    '<div class="field"><label>Last Name</label><input class="input" id="pLast" value="'+esc(state.profile.lastName)+'"></div>'+
    '<div class="field"><label>Email</label><input class="input" id="pEmail" value="'+esc(state.profile.email)+'"></div>'+
    '<button class="primary" onclick="saveProfile()">Save Profile</button></div></main>',"/account");
}
function saveProfile(){
  state.profile.firstName=el("pFirst").value.trim();state.profile.lastName=el("pLast").value.trim();state.profile.email=el("pEmail").value.trim();save();toast("Profile saved");
}
function sellPage(){
  render(header("Sell",false)+'<main class="content"><div class="section"><h1>Sell Tickets</h1><p>Choose an event from My Events to continue a sale.</p></div></main>',"/sell");
}

function main(){
  const r=route();
  if(r==="/discover")return discover();
  if(r==="/for-you")return forYou();
  if(r==="/account")return account();
  if(r==="/sell")return sellPage();
  if(r.startsWith("/for-you/edit/"))return forYou(r.slice("/for-you/edit/".length));
  if(r.startsWith("/event/"))return eventPage(r.slice("/event/".length));
  return myTickets();
}

window.go=go;window.myTickets=myTickets;window.showPast=showPast;window.viewTickets=viewTickets;window.closeModal=closeModal;window.eventMenu=eventMenu;
window.deleteEvent=deleteEvent;window.shareEvent=shareEvent;window.openTransfer=openTransfer;window.transferReady=transferReady;window.submitTransfer=submitTransfer;window.cancelTransfer=cancelTransfer;
window.startSell=startSell;window.discover=discover;window.forYou=forYou;window.addSeat=addSeat;window.previewImage=previewImage;window.saveEvent=saveEvent;window.editEvent=editEvent;
window.deleteEventFromForm=deleteEventFromForm;window.account=account;window.saveProfile=saveProfile;window.sellPage=sellPage;window.showHelp=showHelp;

window.addEventListener("hashchange",main);
document.addEventListener("DOMContentLoaded",main);
save();

})();
