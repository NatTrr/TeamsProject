// A small web page with an interactive globe (MapLibre). It runs inside an
// iframe in Chrome and inside a WebView on a phone, and talks to the app with messages.
export const MAPLIBRE_VERSION = '5.6.0';

export function globeHtml(scriptBase = `https://cdn.jsdelivr.net/npm/maplibre-gl@${MAPLIBRE_VERSION}/dist`) {
  return `<!doctype html>
<html><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1">
<link rel="stylesheet" href="${scriptBase}/maplibre-gl.css">
<style>
html,body,#map{margin:0;height:100%;width:100%;background:#17372A;overflow:hidden}
.maplibregl-ctrl-attrib{font-size:10px}
</style></head>
<body><div id="map"></div>
<script src="${scriptBase}/maplibre-gl.js"></script>
<script>
(function(){
  function send(o){
    var m=JSON.stringify(o);
    if(window.ReactNativeWebView){window.ReactNativeWebView.postMessage(m);}
    else if(window.parent!==window){window.parent.postMessage(m,'*');}
  }
  var COLORS=['match',['get','placeType'],'Shop','#F47F68','DogPark','#D6F25B','Vet','#F6CB5B','EmergencyVet','#F6CB5B','#F5F6E1'];
  var map=new maplibregl.Map({
    container:'map',
    center:[21.4254,41.9981],zoom:1.2,
    attributionControl:{compact:true},
    style:{
      version:8,
      projection:{type:'globe'},
      sources:{osm:{type:'raster',tiles:['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],tileSize:256,maxzoom:19,attribution:'&copy; OpenStreetMap contributors'}},
      layers:[
        {id:'bg',type:'background',paint:{'background-color':'#1F5A44'}},
        {id:'osm',type:'raster',source:'osm',paint:{'raster-saturation':-0.25,'raster-contrast':0.05}}
      ],
      sky:{'atmosphere-blend':['interpolate',['linear'],['zoom'],0,1,5,1,7,0]}
    }
  });
  window.__map=map;window.__errs=[];map.on('error',function(e){window.__errs.push(String(e.error&&e.error.message||e.message||e).slice(0,160));});
  var ready=false,pending=null;
  function empty(){return{type:'FeatureCollection',features:[]};}
  function apply(d){
    if(!ready){pending=d;return;}
    map.getSource('pins').setData(d.geojson||empty());
    map.setFilter('sel',['==',['get','id'],d.selected||'']);
    if(d.focus&&d.focus.nonce!==apply.fn){apply.fn=d.focus.nonce;apply.moved=true;map.flyTo({center:d.focus.center,zoom:15,duration:1800});}
    else if(d.center&&!apply.moved){
      apply.moved=true;
      map.easeTo({center:d.center,zoom:d.zoom||11.5,duration:2800});
    }
  }
  map.on('load',function(){
    map.addSource('pins',{type:'geojson',data:empty()});
    map.addLayer({id:'sel',type:'circle',source:'pins',filter:['==',['get','id'],''],paint:{'circle-radius':20,'circle-color':'rgba(214,242,91,0.25)','circle-stroke-color':'#D6F25B','circle-stroke-width':3}});
    map.addLayer({id:'pins',type:'circle',source:'pins',paint:{
      'circle-radius':['interpolate',['linear'],['zoom'],1,4,8,8,14,11],
      'circle-color':COLORS,'circle-stroke-color':'#17372A','circle-stroke-width':2.5}});
    map.on('click','pins',function(e){var f=e.features&&e.features[0];if(f){send({type:'pin',id:f.properties.id});}});
    map.on('click',function(e){var f=map.queryRenderedFeatures(e.point,{layers:['pins']});if(!f.length){send({type:'empty'});}});
    map.on('mouseenter','pins',function(){map.getCanvas().style.cursor='pointer';});
    map.on('mouseleave','pins',function(){map.getCanvas().style.cursor='';});
    ready=true;
    if(pending){apply(pending);pending=null;}
    send({type:'ready'});
  });
  function onMsg(ev){
    try{var d=typeof ev.data==='string'?JSON.parse(ev.data):ev.data;if(d&&d.type==='data'){apply(d);}}catch(e){}
  }
  window.addEventListener('message',onMsg);
  document.addEventListener('message',onMsg);
  send({type:'boot'});
})();
</script></body></html>`;
}
