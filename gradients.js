const state={
  colorA:'#c4522a',
  colorB:'#e8946a',
  colorC:'#f4ece5',
  hasColorC:false,
  direction:'to right top',
  motion:false,
  frame:0,
  raf:null
};
const SYSTEM_STATE_KEY='paletta-system-state-v1';

const canvas=document.getElementById('gradientCanvas');
const ctx=canvas.getContext('2d');
const gradientLabel=document.getElementById('gradientLabel');
const toast=document.getElementById('toast');

const hexA=document.getElementById('colorHexA');
const hexB=document.getElementById('colorHexB');
const hexC=document.getElementById('colorHexC');
const pickerA=document.getElementById('colorPickerA');
const pickerB=document.getElementById('colorPickerB');
const pickerC=document.getElementById('colorPickerC');
const swatchA=document.getElementById('swatchA');
const swatchB=document.getElementById('swatchB');
const swatchC=document.getElementById('swatchC');
const thirdColorField=document.getElementById('thirdColorField');
const thirdColorToggle=document.getElementById('thirdColorToggle');

function clamp(value,min,max){
  return Math.min(max,Math.max(min,value));
}

function cleanHex(value){
  return value.replace(/[^0-9a-fA-F]/g,'').slice(0,6);
}

function validHex(value){
  return /^[0-9a-fA-F]{6}$/.test(value);
}

function isHexColor(value){
  return /^#[0-9a-fA-F]{6}$/.test(value||'');
}

function savedCompanionColour(saved,labels){
  const companions=Array.isArray(saved.companionPalette)?saved.companionPalette:[];
  const labelled=labels
    .map(label=>companions.find(item=>item.label===label&&isHexColor(item.hex)))
    .find(Boolean);
  const nonAnchor=companions.find(item=>!item.anchor&&isHexColor(item.hex));
  return labelled?.hex||nonAnchor?.hex||null;
}

function loadSystemColours(){
  try{
    const saved=JSON.parse(localStorage.getItem(SYSTEM_STATE_KEY)||'null');
    if(!saved) return;
    const palette=saved.palette||{};
    const primary=isHexColor(saved.primary)?saved.primary:palette.primary;
    const secondary=saved.hasSecondary
      ? (isHexColor(saved.secondary)?saved.secondary:palette.secondary)
      : null;
    const companion=savedCompanionColour(saved,['Accent','Deep']);
    const third=savedCompanionColour(saved,['Neutral','Soft','Light','Deep']);
    if(isHexColor(primary)) state.colorA=primary.toLowerCase();
    if(isHexColor(secondary)) state.colorB=secondary.toLowerCase();
    else if(isHexColor(companion)) state.colorB=companion.toLowerCase();
    else if(isHexColor(palette.deep)) state.colorB=palette.deep.toLowerCase();
    if(isHexColor(third)) state.colorC=third.toLowerCase();
    else if(isHexColor(palette.surface)) state.colorC=palette.surface.toLowerCase();
  }catch(e){}
}

function showToast(msg){
  toast.textContent=msg;
  toast.classList.add('show');
  clearTimeout(toast._timer);
  toast._timer=setTimeout(()=>toast.classList.remove('show'),1800);
}

function gradientCss(){
  const colours=state.hasColorC
    ? `${state.colorA}, ${state.colorB}, ${state.colorC}`
    : `${state.colorA}, ${state.colorB}`;
  return `background-image: linear-gradient(${state.direction}, ${colours});`;
}

function fullCssOutput(){
  return `.paletta-gradient {\n  ${gradientCss()}\n}`;
}

function readableDirection(){
  return state.direction.replace(/\b\w/g,c=>c.toUpperCase());
}

function parseRgb(hex){
  const raw=hex.replace('#','');
  const n=parseInt(raw,16);
  return {r:(n>>16)&255,g:(n>>8)&255,b:n&255};
}

function rgba(hex,alpha){
  const c=parseRgb(hex);
  return `rgba(${c.r}, ${c.g}, ${c.b}, ${alpha})`;
}

function activeColours(){
  return state.hasColorC
    ? [state.colorA,state.colorB,state.colorC]
    : [state.colorA,state.colorB];
}

function mix(a,b,t){
  return {
    r:Math.round(a.r+(b.r-a.r)*t),
    g:Math.round(a.g+(b.g-a.g)*t),
    b:Math.round(a.b+(b.b-a.b)*t)
  };
}

function directionPoints(direction,w,h,offset=0){
  const map={
    'to right top':[0,h,w,0],
    'to right':[0,0,w,0],
    'to right bottom':[0,0,w,h],
    'to bottom':[0,0,0,h],
    'to left bottom':[w,0,0,h],
    'to left':[w,0,0,0],
    'to left top':[w,h,0,0],
    'to top':[0,h,0,0],
    '135deg':[w,h,0,0]
  };
  const pts=map[direction]||map['to right top'];
  if(!offset) return pts;
  const drift=Math.sin(offset)*w*.14;
  const lift=Math.cos(offset*.8)*h*.14;
  return [pts[0]+drift,pts[1]-lift,pts[2]-drift,pts[3]+lift];
}

function drawGradient(targetCtx,w,h,animated=false){
  const time=state.frame/30;
  const pts=directionPoints(state.direction,w,h,animated?time:0);
  const grad=targetCtx.createLinearGradient(...pts);
  const a=parseRgb(state.colorA);
  const endHex=state.hasColorC?state.colorC:state.colorB;
  const b=parseRgb(endHex);
  const mid=state.hasColorC
    ? parseRgb(state.colorB)
    : mix(a,b,.5+.34*Math.sin(time*.9));
  const stopA=animated?clamp(.18+.2*Math.sin(time*.8),0,.42):0;
  const midStop=animated?clamp(.5+.26*Math.cos(time*.7),.2,.8):.5;
  const stopB=animated?clamp(.82+.14*Math.cos(time*.75),.58,1):1;
  grad.addColorStop(0,state.colorA);
  if(state.hasColorC){
    grad.addColorStop(animated?midStop:.5,state.colorB);
  }else if(animated){
    grad.addColorStop(stopA,state.colorA);
    grad.addColorStop(midStop,`rgb(${mid.r}, ${mid.g}, ${mid.b})`);
    grad.addColorStop(stopB,endHex);
  }
  grad.addColorStop(1,endHex);
  targetCtx.fillStyle=grad;
  targetCtx.fillRect(0,0,w,h);

  if(animated){
    const bloomA=targetCtx.createRadialGradient(
      w*(.26+.18*Math.sin(time*.72)),
      h*(.32+.2*Math.cos(time*.58)),
      0,
      w*(.32+.08*Math.sin(time*.4)),
      h*.42,
      w*.58
    );
    bloomA.addColorStop(0,rgba(state.colorA,.58));
    bloomA.addColorStop(1,rgba(state.colorA,0));
    targetCtx.fillStyle=bloomA;
    targetCtx.fillRect(0,0,w,h);

    const bloomB=targetCtx.createRadialGradient(
      w*(.74+.16*Math.cos(time*.64)),
      h*(.64+.18*Math.sin(time*.52)),
      0,
      w*(.68+.08*Math.cos(time*.45)),
      h*.58,
      w*.62
    );
    bloomB.addColorStop(0,rgba(state.colorB,.52));
    bloomB.addColorStop(1,rgba(state.colorB,0));
    targetCtx.fillStyle=bloomB;
    targetCtx.fillRect(0,0,w,h);

    if(state.hasColorC){
      const bloomC=targetCtx.createRadialGradient(
        w*(.5+.2*Math.sin(time*.5)),
        h*(.5+.18*Math.cos(time*.68)),
        0,
        w*.5,
        h*.48,
        w*.7
      );
      bloomC.addColorStop(0,rgba(state.colorC,.42));
      bloomC.addColorStop(1,rgba(state.colorC,0));
      targetCtx.fillStyle=bloomC;
      targetCtx.fillRect(0,0,w,h);
    }

    const sheen=targetCtx.createLinearGradient(
      w*(.12+.28*Math.sin(time*.9)),
      0,
      w*(.72+.22*Math.sin(time*.9)),
      h
    );
    sheen.addColorStop(0,'rgba(255,255,255,0)');
    sheen.addColorStop(.5,'rgba(255,255,255,.24)');
    sheen.addColorStop(1,'rgba(255,255,255,0)');
    targetCtx.fillStyle=sheen;
    targetCtx.fillRect(0,0,w,h);
  }
}

function render(){
  swatchA.style.background=state.colorA;
  swatchB.style.background=state.colorB;
  swatchC.style.background=state.colorC;
  pickerA.value=state.colorA;
  pickerB.value=state.colorB;
  pickerC.value=state.colorC;
  hexA.value=state.colorA.replace('#','');
  hexB.value=state.colorB.replace('#','');
  hexC.value=state.colorC.replace('#','');
  thirdColorField.hidden=!state.hasColorC;
  thirdColorToggle.textContent=state.hasColorC?'Remove third colour':'+ Add third colour';
  gradientLabel.textContent=`Linear · ${readableDirection()}`;
  drawGradient(ctx,canvas.width,canvas.height,state.motion);
}

function animate(){
  if(!state.motion) return;
  state.frame+=1;
  render();
  state.raf=requestAnimationFrame(animate);
}

function setMotion(on){
  state.motion=on;
  const btn=document.getElementById('motionToggle');
  btn.setAttribute('aria-pressed',on?'true':'false');
  btn.textContent=on?'Motion on':'Preview motion';
  cancelAnimationFrame(state.raf);
  if(on) animate();
  else render();
}

function syncText(input,key){
  const cleaned=cleanHex(input.value);
  input.value=cleaned;
  input.closest('.gradient-color-field')?.classList.toggle('invalid',cleaned.length>0&&!validHex(cleaned));
  if(validHex(cleaned)){
    state[key]='#'+cleaned.toLowerCase();
    render();
  }
}

function downloadFile(name,content,type){
  const a=document.createElement('a');
  a.href=URL.createObjectURL(new Blob([content],{type}));
  a.download=name;
  a.click();
  URL.revokeObjectURL(a.href);
}

function downloadPng(){
  const out=document.createElement('canvas');
  out.width=1600;
  out.height=1000;
  drawGradient(out.getContext('2d'),out.width,out.height,false);
  const nameParts=activeColours().map(color=>color.slice(1)).join('-');
  const a=document.createElement('a');
  a.href=out.toDataURL('image/png');
  a.download=`paletta-gradient-${nameParts}.png`;
  a.click();
  showToast('PNG downloaded');
}

function downloadWebm(){
  if(!canvas.captureStream||!window.MediaRecorder){
    showToast('Video export not supported');
    return;
  }
  const wasMotion=state.motion;
  setMotion(true);
  const stream=canvas.captureStream(30);
  const chunks=[];
  const mime=MediaRecorder.isTypeSupported('video/webm;codecs=vp9')?'video/webm;codecs=vp9':'video/webm';
  const recorder=new MediaRecorder(stream,{mimeType:mime});
  recorder.ondataavailable=e=>{if(e.data.size) chunks.push(e.data)};
  recorder.onstop=()=>{
    const nameParts=activeColours().map(color=>color.slice(1)).join('-');
    downloadFile(
      `paletta-gradient-${nameParts}.webm`,
      new Blob(chunks,{type:'video/webm'}),
      'video/webm'
    );
    if(!wasMotion) setMotion(false);
    showToast('WebM downloaded');
  };
  recorder.start();
  showToast('Recording 3 seconds');
  setTimeout(()=>recorder.stop(),3000);
}

function randomColor(){
  return '#'+Math.floor(Math.random()*0xffffff).toString(16).padStart(6,'0');
}

document.getElementById('orientationGrid').addEventListener('click',e=>{
  const btn=e.target.closest('.orientation-btn');
  if(!btn) return;
  document.querySelectorAll('.orientation-btn').forEach(item=>item.classList.remove('active'));
  btn.classList.add('active');
  state.direction=btn.dataset.direction;
  render();
});

hexA.addEventListener('input',()=>syncText(hexA,'colorA'));
hexB.addEventListener('input',()=>syncText(hexB,'colorB'));
hexC.addEventListener('input',()=>syncText(hexC,'colorC'));
pickerA.addEventListener('input',e=>{state.colorA=e.target.value;render()});
pickerB.addEventListener('input',e=>{state.colorB=e.target.value;render()});
pickerC.addEventListener('input',e=>{state.colorC=e.target.value;render()});

thirdColorToggle.addEventListener('click',()=>{
  state.hasColorC=!state.hasColorC;
  render();
  showToast(state.hasColorC?'Third colour added':'Third colour removed');
});

document.getElementById('motionToggle').addEventListener('click',()=>{
  setMotion(!state.motion);
});

document.getElementById('randomGradientBtn').addEventListener('click',()=>{
  state.colorA=randomColor();
  state.colorB=randomColor();
  if(state.hasColorC) state.colorC=randomColor();
  render();
  showToast('Random gradient');
});

document.getElementById('copyCssBtn').addEventListener('click',()=>{
  navigator.clipboard?.writeText(fullCssOutput());
  showToast('CSS copied');
});

document.getElementById('downloadPngBtn').addEventListener('click',downloadPng);
document.getElementById('downloadWebmBtn').addEventListener('click',downloadWebm);

const themeToggle=document.getElementById('themeToggle');
if(localStorage.getItem('paletta-theme')==='light') document.body.classList.add('light');
themeToggle.addEventListener('click',()=>{
  document.body.classList.toggle('light');
  localStorage.setItem('paletta-theme',document.body.classList.contains('light')?'light':'dark');
});

function setupPageTransitions(){
  if(window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  document.querySelectorAll('.site-nav-link').forEach(link=>{
    link.addEventListener('click',e=>{
      if(e.defaultPrevented||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey||e.button!==0) return;
      if(link.classList.contains('active')) return;
      const url=new URL(link.href,window.location.href);
      if(url.origin!==window.location.origin) return;
      e.preventDefault();
      document.body.classList.add('page-leaving');
      setTimeout(()=>{window.location.href=url.href},95);
    });
  });
}

setupPageTransitions();
loadSystemColours();
render();
