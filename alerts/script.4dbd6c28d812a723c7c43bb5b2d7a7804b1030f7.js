function ready(){function setupDarkMode(){let darkMode=localStorage.getItem("darkMode");if(darkMode===null){darkMode=window.matchMedia&&!!window.matchMedia("(prefers-color-scheme: dark)").matches;localStorage.setItem("darkMode",darkMode)}else{darkMode=JSON.parse(darkMode)}if(!darkMode){console.log("dark mode is off");document.documentElement.classList.add("light")}else{console.log("dark mode is on");document.documentElement.classList.remove("light")}return darkMode}function detectOs(){if(navigator.userAgent.match(/(iPad|iPhone|iPod)/i)){return"ios"}else if(navigator.userAgent.match(/Android/i)){return"android"}else{return"desktop"}}const darkMode=setupDarkMode();const data={dailyDuration:{alerts:[],meta:{},loaded:false,updatedAt:null,error:false},active:{alerts:[],meta:{},loaded:false,updatedAt:null},timer:30,errorAttempts:3,screen:"map",os:detectOs()||"desktop",darkMode:darkMode,scaled:false,online:navigator.onLine===undefined?true:navigator.onLine};function formatDate(date,addDayOfWar=false){if(!date){return""}else{if(typeof date!=="Date"){date=new Date(date)}result=date.toLocaleDateString("uk-UA",{day:"numeric",month:"long",hour:"2-digit",minute:"2-digit",timeZone:"Europe/Kiev"});if(addDayOfWar){const ONE_DAY=1e3*60*60*24;result=`${result} (${Math.round((date.getTime()-new Date(2022,1,24).getTime())/ONE_DAY)} день);`}return result}}function toggleDarkMode(){app.darkMode=!app.darkMode;localStorage.setItem("darkMode",app.darkMode);document.documentElement.classList.toggle("light");fetchData()}const dev=["127.0.0.1","localhost"].includes(location.hostname);let prefix,prefixSvg;if(dev){prefix="/";prefixSvg="/"}else{prefix="https://war-api.ukrzen.in.ua/alerts/";prefixSvg="https://war.ukrzen.in.ua/alerts/"}function processData(alerts){if(alerts){alerts.forEach(alert=>{alert.duration=calculateDuration(alert.started_at,alert.finished_at);alert.fresh=calculateDuration(alert.updated_at)<6e4})}}const calculateDuration=function(startDate,endDate){if(!endDate){endDate=new Date}return new Date(endDate).getTime()-new Date(startDate).getTime()};const clearMap=function(){document.querySelectorAll('[data-oblast]:not([data-oblast="Автономна Республіка Крим"])').forEach(el=>{let fill,stroke;if(!data.darkMode){fill="#e9ddce";stroke="#c2b9ad"}else{fill="rgba(25, 38, 56,0.9)";stroke="rgba(255, 255, 255, 0.2)"}el.setAttribute("fill",fill);el.setAttribute("stroke",stroke);el.setAttribute("fill-opacity","0.9");el.setAttribute("class","")})};const highlightRegion=function(alert,opacity="0.3",color=null){if(alert.finished_at){color="#F6E7D8"}else{color="rgba(230,25,25,0.4)";const duration=calculateDuration(alert.started_at,alert.finished_at)/6e4;const hours=4*60;let koef=1;if(duration<hours){koef=duration/hours}opacity=1-.3*koef}let locationType=alert.location_type,locationTitle=alert.location_title;if(alert.location_type==="hromada"){locationType="raion";locationTitle=alert.location_raion}document.querySelectorAll("[data-"+locationType+'="'+locationTitle+'"]').forEach(el=>{el.setAttribute("fill",color);el.setAttribute("fill-opacity",opacity);el.setAttribute("class","active")})};const updateTimer=function(){if(data.timer!==undefined){if(data.timer>0){data.timer-=1}else{if(!document.hidden&&navigator.onLine!==false){fetchData()}}}if(data.dailyDuration){}};const timezoneHomeOffset=function(d,tz="Europe/Kiev"){const utc=new Date(d.getTime());const dHome=new Date(d.toLocaleString("en-US",{timeZone:tz}));const diff=Math.round((utc-dHome)/6e4);d.setMinutes(d.getMinutes()+diff);return d};const fetchDailyDuration=function(){const MS_IN_DAY=1e3*60*60*24;const url=prefix+"api/stats/daily_duration";const nowMs=timezoneHomeOffset(new Date).getTime();const todayDate=timezoneHomeOffset(new Date);todayDate.setHours(0,0,0,0);const todayMs=todayDate.getTime();const elapsedMs=nowMs-todayMs;fetch(url).then(r=>r.json()).then(json=>{const diff=(new Date).getTime()-new Date(json.meta.last_updated_at).getTime();json.data.forEach(item=>{if(item.active){item.duration=item.duration+diff}item.duration_percentage=item.duration/elapsedMs*100});data.dailyDuration.data=json.data;data.dailyDuration.meta=json.meta;data.dailyDuration.updatedAt=new Date;data.dailyDuration.loaded=true}).catch(e=>{data.dailyDuration.loaded=true;data.dailyDuration.error=true})};const fetchData=function(){const url=prefix+"api/alerts/active.json";fetch(url).then(r=>r.json()).then(json=>{const changed=data.active.meta.last_updated_at!==json.meta.last_updated_at&&data.active.meta.last_updated_at!==undefined;processData(json.alerts);data.active.alerts=json.alerts.reverse();data.active.meta=json.meta;data.active.updatedAt=new Date;data.timer=changed?15:25;data.errorAttempts=4;clearMap();["oblast","raion","city","hromada"].forEach(locationType=>{let alerts=json.alerts.filter(it=>it.location_type===locationType);alerts.forEach(alert=>highlightRegion(alert))});requestAnimationFrame(()=>{data.active.loaded=true})}).catch(e=>{console.error(e);data.errorAttempts-=1;data.timer=30;if(data.errorAttempts===0){clearInterval(updateIntervalTimer)}})};const fetchSvg=function(){fetch(prefixSvg+document.querySelector('[name="map:url"]').getAttribute("content")).then(r=>r.text()).then(text=>{clearMap();const map=document.getElementById("map");map.innerHTML=text;fetchData()}).catch(console.error.bind(console))};const app=new Vue({el:"#app",data:data,methods:{formatDate:formatDate,fetchDailyDuration:fetchDailyDuration,toggleDarkMode:toggleDarkMode,formatDuration(ms,separator){function formatNumber(word,value){if(value===0){return""}return`${value} ${word}`}let seconds=ms/1e3;const hours=parseInt(seconds/60/60);const minutes=parseInt(seconds/60%60);return`${formatNumber("год.",hours)} ${formatNumber("хв.",minutes)}`}}});const updateIntervalTimer=setInterval(updateTimer,1e3);requestAnimationFrame(fetchSvg);document.addEventListener("visibilitychange",function(event){if(!document.hidden){data.timer=0}});window.addEventListener("offline",function(e){data.online=false});window.addEventListener("online",function(e){data.online=true});if(window.matchMedia){window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change",event=>{if(data.darkMode!==!!event.matches){toggleDarkMode()}})}}document.addEventListener("DOMContentLoaded",ready);
