// The page that draws the globe. It runs inside an iframe (web) or a WebView (phone)
// and talks to the app with postMessage.
export const MAP_HTML = `<!doctype html>
<html><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1">
<link rel="stylesheet" href="https://unpkg.com/maplibre-gl@5.6.0/dist/maplibre-gl.css">
<style>
html,body,#map{margin:0;height:100%;width:100%;background:#17372A;overflow:hidden}
#err{position:absolute;inset:0;display:none;align-items:center;justify-content:center;text-align:center;color:#F5F6E1;font:500 14px sans-serif;padding:24px}
.maplibregl-ctrl-attrib{font-size:10px}
</style></head>
<body><div id="map"></div><div id="err">Could not load the map. Check your internet connection.</div>
<script src="https://unpkg.com/maplibre-gl@5.6.0/dist/maplibre-gl.js"></script>
<script>
function send(m){var s=JSON.stringify(m);try{if(window.ReactNativeWebView)window.ReactNativeWebView.postMessage(s);else parent.postMessage(s,'*');}catch(e){}}
if(typeof maplibregl==='undefined'){document.getElementById('err').style.display='flex';send({type:'error'});}
else{
var map=new maplibregl.Map({
  container:'map',
  style:{version:8,
    sources:{osm:{type:'raster',tiles:['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],tileSize:256,maxzoom:19,attribution:'© OpenStreetMap contributors'}},
    layers:[{id:'bg',type:'background',paint:{'background-color':'#1F5A44'}},{id:'osm',type:'raster',source:'osm'}]},
  center:[21.4254,41.9981],zoom:11.5,attributionControl:{compact:true}
});
map.addControl(new maplibregl.NavigationControl({showCompass:false}),'top-right');
var ready=false,pending=null,selected=null;
var colors={Shop:'#F47F68',DogPark:'#D6F25B',Vet:'#F6CB5B',EmergencyVet:'#F6CB5B'};
map.on('style.load',function(){try{map.setProjection({type:'globe'});}catch(e){}});
map.on('load',function(){
  map.addSource('pins',{type:'geojson',data:{type:'FeatureCollection',features:[]}});
  map.addLayer({id:'halo',type:'circle',source:'pins',filter:['==',['get','id'],''],paint:{'circle-radius':20,'circle-color':'rgba(214,242,91,0.25)','circle-stroke-color':'#D6F25B','circle-stroke-width':3}});
  ['Shop','DogPark','Vet','EmergencyVet'].forEach(function(t){
    map.addLayer({id:'pin-'+t,type:'circle',source:'pins',filter:['==',['get','placeType'],t],paint:{
      'circle-radius':t==='EmergencyVet'?10:9,'circle-color':colors[t],'circle-stroke-color':t==='EmergencyVet'?'#F47F68':'#17372A','circle-stroke-width':t==='EmergencyVet'?3.5:2.5}});
    map.on('click','pin-'+t,function(e){var f=e.features&&e.features[0];if(!f)return;select(f.properties.id);send({type:'select',id:f.properties.id});});
    map.on('mouseenter','pin-'+t,function(){map.getCanvas().style.cursor='pointer';});
    map.on('mouseleave','pin-'+t,function(){map.getCanvas().style.cursor='';});
  });
  ready=true;send({type:'ready'});if(pending){apply(pending);pending=null;}
});
function select(id){selected=id;if(map.getLayer('halo'))map.setFilter('halo',['==',['get','id'],id||'']);}
function apply(m){
  if(m.type==='pins'){map.getSource('pins').setData(m.data);}
  else if(m.type==='fly'){map.flyTo({center:m.center,zoom:m.zoom||12,essential:true});}
  else if(m.type==='select'){select(m.id);}
}
function onMsg(e){var m;try{m=typeof e.data==='string'?JSON.parse(e.data):e.data;}catch(x){return;}if(!m||!m.type)return;if(!ready){if(m.type==='pins')pending=m;return;}apply(m);}
window.addEventListener('message',onMsg);document.addEventListener('message',onMsg);
}
</script></body></html>`;
