// ── Colour utilities ──────────────────────────────────────────────────

function hexToRgb(hex) {
  hex = hex.replace(/^#/,'');
  if(hex.length===3) hex=hex.split('').map(c=>c+c).join('');
  const n=parseInt(hex,16);
  return {r:(n>>16)&255,g:(n>>8)&255,b:n&255};
}

function clamp(v,mn,mx){return Math.min(Math.max(v,mn),mx)}

function luminance(hex){
  const {r,g,b}=hexToRgb(hex);
  return[r,g,b].reduce((acc,v,i)=>{
    const c=v/255;
    return acc+(c<=.03928?c/12.92:Math.pow((c+.055)/1.055,2.4))*[.2126,.7152,.0722][i];
  },0);
}

function contrast(a,b){
  const l1=luminance(a),l2=luminance(b);
  return(Math.max(l1,l2)+.05)/(Math.min(l1,l2)+.05);
}

function bestText(bg){
  return contrast(bg,'#ffffff')>=contrast(bg,'#111111')?'#ffffff':'#111111';
}

function okStr(hex){
  const o=culori.oklch(hex);
  return `oklch(${(o.l||0).toFixed(2)} ${(o.c||0).toFixed(3)} ${(o.h||0).toFixed(0)})`;
}

// ── OKLCH palette generation (via Culori) ─────────────────────────────

function toHex(l,c,h){
  const rgb=culori.rgb({mode:'oklch',l,c:Math.max(0,c),h:h||0});
  if(!rgb) return'#000000';
  return culori.formatHex({
    mode:'rgb',
    r:clamp(isNaN(rgb.r)?0:rgb.r,0,1),
    g:clamp(isNaN(rgb.g)?0:rgb.g,0,1),
    b:clamp(isNaN(rgb.b)?0:rgb.b,0,1)
  });
}

const ROLES=[
  {key:'bgDark',  name:'Background Dark',  usedFor:'Hero, nav, footer, dark statement sections',        never:'Body text on its own. Never as a card background.'},
  {key:'bgLight', name:'Background Light', usedFor:'Content sections, card surfaces, page background',  never:'Dark sections. Avoid pairing with similarly light tones.'},
  {key:'primary', name:'Primary Accent',   usedFor:'CTA buttons, eyebrow labels, active borders',       never:'Large section backgrounds over 200px. Body text.'},
  {key:'light',   name:'Light Accent',     usedFor:'Italic headline highlights, subtle hover effects',  never:'Buttons. Backgrounds. Body text. Anything functional.'},
  {key:'deep',    name:'Deep Accent',      usedFor:'Pressed/hover states on buttons, overlay gradients',never:'Main CTA colour. Use only as depth of Primary Accent.'},
  {key:'muted',   name:'Muted Text',       usedFor:'Body copy, captions, secondary labels, metadata',   never:'Text on dark backgrounds. Buttons.'}
];

const SECONDARY_ROLES=[
  {key:'secondary',      name:'Secondary Accent',  usedFor:'Secondary CTAs, links, alternative interactive elements',        never:'Primary Accent roles. Never body text or large backgrounds.'},
  {key:'secondaryLight', name:'Secondary Light',    usedFor:'Secondary hover states, tinted surfaces, decorative highlights', never:'Main secondary CTA. Functional UI elements.'},
  {key:'secondaryDeep',  name:'Secondary Deep',     usedFor:'Secondary pressed/hover states, overlay depth',                  never:'Main secondary colour. Use only as depth of Secondary Accent.'}
];

function generatePalette(anchorHex){
  const ok=culori.oklch(anchorHex);
  if(!ok) return null;
  const l=isNaN(ok.l)?0.5:(ok.l||0);
  const c=isNaN(ok.c)?0:(ok.c||0);
  const h=isNaN(ok.h)?0:(ok.h||0);
  // Preserve the anchor's true lightness & chroma — only nudge at extremes so
  // a bright yellow stays a bright yellow instead of being flattened to mid gold.
  const aL=clamp(l,0.42,0.90);
  const aC=clamp(c,0,0.37);
  return{
    bgDark: toHex(0.09,  clamp(c*.35,0,0.040), h),
    bgLight:toHex(0.97,  clamp(c*.10,0,0.016), h),
    primary:toHex(aL,    aC,                   h),
    light:  toHex(clamp(aL+.17,.67,.83), clamp(aC*.68,0,.15),  h),
    deep:   toHex(clamp(aL-.16,.22,.44), clamp(aC*1.06,0,.24), h),
    muted:  toHex(clamp(l*.68,.28,.46),  clamp(c*.22,0,.080),  h)
  };
}

function generateSecondaryPalette(anchorHex){
  const ok=culori.oklch(anchorHex);
  if(!ok) return{secondary:'#666666',secondaryLight:'#999999',secondaryDeep:'#444444'};
  const l=isNaN(ok.l)?0.5:(ok.l||0);
  const c=isNaN(ok.c)?0:(ok.c||0);
  const h=isNaN(ok.h)?0:(ok.h||0);
  const aL=clamp(l,0.42,0.90);
  const aC=clamp(c,0,0.37);
  return{
    secondary:      toHex(aL,    aC,                   h),
    secondaryLight: toHex(clamp(aL+.17,.67,.83), clamp(aC*.68,0,.15),  h),
    secondaryDeep:  toHex(clamp(aL-.16,.22,.44), clamp(aC*1.06,0,.24), h)
  };
}

// ── State ─────────────────────────────────────────────────────────────

let currentPalette=null;
let currentAnchor='#c4522a';
let currentSecondaryAnchor='#2a6dc4';
let hasSec=false;
let autoSort=true;  // role list: sort dark → light vs. declaration order

// ── Render role gallery (editorial swatch row) ────────────────────────

const CC_SVG=`<svg class="rl-cc-copy" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="5.5" y="5.5" width="7" height="7" rx="1.5"/><path d="M10.5 5.5V4A1.5 1.5 0 009 2.5H4A1.5 1.5 0 002.5 4v5A1.5 1.5 0 004 10.5h1.5"/></svg><svg class="rl-cc-tick" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M3 8l3.5 3.5L13 4.5"/></svg>`;

// One role row: colour swatch on the left, name → dashed leader line → hex pill
// on the right. Clicking the row expands a detail strip (usage + live oklch);
// clicking the hex pill copies the value without toggling the row.
function roleRow(role,hex){
  const HEX=hex.toUpperCase();
  return`<button class="rl-row" data-hex="${hex}">
    <span class="rl-sw" style="background:${hex}"></span>
    <span class="rl-content">
      <span class="rl-line1">
        <span class="rl-name">${role.name}</span>
        <span class="rl-lead"></span>
        <span class="rl-copy" data-hex="${hex}" role="button" tabindex="0" aria-label="Copy ${HEX}">
          <span class="rl-hexval">${HEX}</span>
          <span class="rl-cc">${CC_SVG}</span>
        </span>
      </span>
      <span class="rl-meta">
        <span class="rl-use">${role.usedFor}</span>
        <span class="rl-ok">${okStr(hex)}</span>
      </span>
    </span>
  </button>`;
}

// Order rows dark → light by perceptual luminance unless auto-sort is off.
function roleList(roles,palette){
  const items=roles.map(r=>({role:r,hex:palette[r.key]}));
  const ordered=autoSort?[...items].sort((a,b)=>luminance(a.hex)-luminance(b.hex)):items;
  return`<div class="rl">${ordered.map(i=>roleRow(i.role,i.hex)).join('')}</div>`;
}

function renderCards(palette){
  const grid=document.getElementById('paletteGrid');
  let inner=roleList(ROLES,palette);
  if(palette.secondary){
    inner+=`<div class="rg-sublabel">Secondary</div>${roleList(SECONDARY_ROLES,palette)}`;
  }
  inner+=`<div class="rl-foot"><button class="rl-toggle${autoSort?' on':''}" id="rlToggle" aria-pressed="${autoSort}" aria-label="Toggle auto-sort"></button> Auto-sort · dark → light</div>`;
  grid.innerHTML=inner;
}

// Click or Enter/Space on a swatch copies its hex. Optimistic feedback with an
// execCommand fallback so it never hangs on a clipboard-permission rejection.
function writeClipboard(text){
  if(navigator.clipboard&&navigator.clipboard.writeText){
    return navigator.clipboard.writeText(text).catch(()=>fallbackCopy(text));
  }
  return Promise.resolve(fallbackCopy(text));
}
function fallbackCopy(text){
  const ta=document.createElement('textarea');
  ta.value=text;ta.style.cssText='position:fixed;top:-9999px';
  document.body.appendChild(ta);ta.select();
  try{document.execCommand('copy');}catch(e){}
  document.body.removeChild(ta);
}
function copyPill(el){
  const hex=el.dataset.hex;
  writeClipboard(hex);
  el.classList.add('copied');
  showToast('Copied '+hex.toUpperCase());
  clearTimeout(el._t);
  el._t=setTimeout(()=>el.classList.remove('copied'),1500);
}
function toggleRow(row){
  const wasOpen=row.classList.contains('open');
  row.parentElement.querySelectorAll('.rl-row').forEach(x=>x.classList.remove('open'));
  if(!wasOpen) row.classList.add('open');
}
document.addEventListener('click',e=>{
  // Auto-sort toggle: re-render with the new sort preference.
  if(e.target.closest&&e.target.closest('#rlToggle')){
    autoSort=!autoSort;
    if(currentPalette) renderCards(currentPalette);
    return;
  }
  // Hex pill copies and does NOT toggle the row.
  const copy=e.target.closest&&e.target.closest('.rl-copy');
  if(copy){e.stopPropagation();copyPill(copy);return;}
  // Anywhere else on the row expands / collapses the detail.
  const row=e.target.closest&&e.target.closest('.rl-row');
  if(row) toggleRow(row);
});
document.addEventListener('keydown',e=>{
  if(e.key!=='Enter'&&e.key!==' ')return;
  const copy=e.target.closest&&e.target.closest('.rl-copy');
  if(copy){e.preventDefault();copyPill(copy);return;}
  const row=e.target.closest&&e.target.closest('.rl-row');
  if(row&&e.target===row){e.preventDefault();toggleRow(row);}
});

// ── Render wireframe preview ──────────────────────────────────────────

function renderPreview(p){
  const frame=document.getElementById('pagePreview');
  const w=(op)=>`rgba(255,255,255,${op})`;
  const tod=w(.82);
  const navCta=p.secondary||p.primary;
  const footerStrip=p.secondary||p.deep;

  frame.innerHTML=`
    <div class="pv-nav" style="background:${p.bgDark}" ${ci('Background',p.bgDark)}>
      <div class="pv-nav-logo" style="background:${p.light}" ${ci('Light',p.light)}></div>
      <div class="pv-nav-links">
        ${[1,2,3].map(()=>`<div class="pv-nav-link" style="background:${tod}"></div>`).join('')}
      </div>
      <div class="pv-nav-cta" style="background:${navCta}" ${ci(p.secondary?'Secondary':'Primary',navCta)}></div>
    </div>

    <div class="pv-hero" style="background:${p.bgDark}" ${ci('Background',p.bgDark)}>
      <div class="pv-hero-tag" style="background:${p.primary}" ${ci('Primary',p.primary)}></div>
      <div class="pv-hero-h1a" style="background:${tod}"></div>
      <div class="pv-hero-h1b" style="background:${p.light}" ${ci('Light',p.light)}></div>
      <div class="pv-hero-p" style="background:${tod};width:58%"></div>
      <div class="pv-hero-p" style="background:${tod};width:44%"></div>
      <div class="pv-btns">
        <div class="pv-btn" style="background:${p.primary}" ${ci('Primary',p.primary)}></div>
        <div class="pv-btn pv-btn-ghost" style="background:${tod};border:1px solid ${tod}"></div>
      </div>
    </div>

    <div class="pv-quote" style="background:${p.primary}" ${ci('Primary',p.primary)}>
      <div class="pv-quote-eyebrow"></div>
      <div class="pv-quote-line"></div>
      <div class="pv-quote-line" style="width:80%"></div>
      <div class="pv-quote-line" style="width:56%"></div>
      <div class="pv-quote-attr"></div>
    </div>

    <div class="pv-content" style="background:${p.bgLight}" ${ci('Surface',p.bgLight)}>
      <div class="pv-content-head" style="background:${p.muted}" ${ci('Muted',p.muted)}></div>
      <div class="pv-cards">
        ${[1,2,3].map(()=>`
          <div class="pv-card" style="background:#fff;border-color:${p.bgDark}18">
            <div class="pv-card-img" style="background:${p.primary}" ${ci('Primary',p.primary)}></div>
            <div class="pv-card-line" style="background:${p.bgDark}"></div>
            <div class="pv-card-line-sm" style="background:${p.muted}"></div>
          </div>`).join('')}
      </div>
    </div>

    <div class="pv-split" style="background:${p.bgLight};border-top:1px solid ${ra(p.bgDark,.08)}" ${ci('Surface',p.bgLight)}>
      <div class="pv-split-text">
        <div style="height:5px;background:${p.primary};opacity:.2;border-radius:3px;width:44%;margin-bottom:10px"></div>
        <div style="height:8px;background:${p.bgDark};opacity:.7;border-radius:3px;width:88%;margin-bottom:4px"></div>
        <div style="height:8px;background:${p.bgDark};opacity:.7;border-radius:3px;width:66%;margin-bottom:4px"></div>
        <div style="height:6px;background:${p.primary};opacity:.8;border-radius:3px;width:50%;font-style:italic;margin-bottom:12px"></div>
        <div style="height:4px;background:${p.muted};opacity:.3;border-radius:2px;width:92%;margin-bottom:4px"></div>
        <div style="height:4px;background:${p.muted};opacity:.2;border-radius:2px;width:74%;margin-bottom:14px"></div>
        <div style="height:22px;background:${p.primary};border-radius:5px;width:58px"></div>
      </div>
      <div class="pv-split-img" style="background:${ra(p.muted,.18)}"></div>
    </div>

    <div class="pv-deep" style="background:${p.deep}" ${ci('Deep',p.deep)}>
      <div style="height:7px;background:${w(.82)};border-radius:3px;width:52%;margin-bottom:5px"></div>
      <div style="height:7px;background:${w(.5)};border-radius:3px;width:36%;margin-bottom:12px"></div>
      <div style="height:4px;background:${w(.26)};border-radius:2px;width:80%;margin-bottom:4px"></div>
      <div style="height:4px;background:${w(.18)};border-radius:2px;width:60%"></div>
    </div>

    <div class="pv-footer-strip" style="background:${footerStrip}" ${ci(p.secondary?'Secondary':'Deep',footerStrip)}></div>
    <div class="pv-footer" style="background:${p.bgDark}" ${ci('Background',p.bgDark)}>
      <div class="pv-footer-logo" style="background:#fff"></div>
      <div class="pv-footer-links">
        ${[1,2,3].map(()=>`<div class="pv-footer-link" style="background:#fff"></div>`).join('')}
      </div>
    </div>`;
}

// ── Render light page preview ─────────────────────────────────────────

function renderLightPreview(p){
  const frame=document.getElementById('lightPreview');
  const d=(op)=>ra(p.bgDark,op);
  const pt=bestText(p.primary);
  const navCta=p.secondary||p.primary;
  const footerStrip=p.secondary||p.deep;

  frame.innerHTML=`
    <div class="pv-nav" style="background:#fff;border-bottom:1px solid ${d(.07)}">
      <div class="pv-nav-logo" style="background:${p.primary}" ${ci('Primary',p.primary)}></div>
      <div class="pv-nav-links">
        ${[1,2,3].map(()=>`<div class="pv-nav-link" style="background:${d(.22)}"></div>`).join('')}
      </div>
      <div class="pv-nav-cta" style="background:${navCta}" ${ci(p.secondary?'Secondary':'Primary',navCta)}></div>
    </div>

    <div class="pv-hero" style="background:#fff">
      <div class="pv-hero-tag" style="background:${ra(p.primary,.18)};border-radius:100px"></div>
      <div class="pv-hero-h1a" style="background:${d(.72)}"></div>
      <div class="pv-hero-h1b" style="background:${p.primary};opacity:.7" ${ci('Primary',p.primary)}></div>
      <div class="pv-hero-p" style="background:${d(.18)};width:58%"></div>
      <div class="pv-hero-p" style="background:${d(.18)};width:44%"></div>
      <div class="pv-btns">
        <div class="pv-btn" style="background:${p.primary}" ${ci('Primary',p.primary)}></div>
        <div class="pv-btn" style="background:transparent;border:1.5px solid ${d(.16)};opacity:.7"></div>
      </div>
    </div>

    <div style="background:${ra(p.primary,.07)};padding:14px 20px;display:flex;align-items:center;gap:14px">
      ${[1,2,3].map((_,i)=>`<div style="flex:${[5,4,6][i]};height:5px;border-radius:3px;background:${ra(p.primary,.38)}"></div>`).join('')}
    </div>

    <div class="pv-content" style="background:${p.bgLight}" ${ci('Surface',p.bgLight)}>
      <div class="pv-content-head" style="background:${d(.28)}"></div>
      <div class="pv-cards">
        ${[1,2,3].map(()=>`
          <div class="pv-card" style="background:#fff;border-color:${d(.08)}">
            <div class="pv-card-img" style="background:${p.primary};opacity:.18"></div>
            <div class="pv-card-line" style="background:${d(.65)}"></div>
            <div class="pv-card-line-sm" style="background:${p.muted}" ${ci('Muted',p.muted)}></div>
          </div>`).join('')}
      </div>
    </div>

    <div class="pv-quote" style="background:${p.primary}" ${ci('Primary',p.primary)}>
      <div class="pv-quote-eyebrow"></div>
      <div class="pv-quote-line"></div>
      <div class="pv-quote-line" style="width:74%"></div>
      <div class="pv-quote-line" style="width:50%"></div>
      <div class="pv-quote-attr"></div>
    </div>

    <div class="pv-split" style="background:#fff;border-top:1px solid ${d(.07)}">
      <div class="pv-split-img" style="background:${ra(p.primary,.12)}"></div>
      <div class="pv-split-text">
        <div style="height:5px;background:${p.primary};opacity:.22;border-radius:3px;width:44%;margin-bottom:10px"></div>
        <div style="height:8px;background:${d(.68)};border-radius:3px;width:88%;margin-bottom:4px"></div>
        <div style="height:8px;background:${d(.68)};border-radius:3px;width:66%;margin-bottom:4px"></div>
        <div style="height:6px;background:${p.primary};opacity:.7;border-radius:3px;width:50%;margin-bottom:12px"></div>
        <div style="height:4px;background:${p.muted};opacity:.35;border-radius:2px;width:92%;margin-bottom:4px"></div>
        <div style="height:4px;background:${p.muted};opacity:.25;border-radius:2px;width:74%;margin-bottom:14px"></div>
        <div style="height:22px;background:${p.primary};border-radius:5px;width:58px"></div>
      </div>
    </div>

    <div class="pv-footer-strip" style="background:${footerStrip}" ${ci(p.secondary?'Secondary':'Deep',footerStrip)}></div>
    <div class="pv-footer" style="background:${p.bgDark}" ${ci('Background',p.bgDark)}>
      <div class="pv-footer-logo" style="background:#fff"></div>
      <div class="pv-footer-links">
        ${[1,2,3].map(()=>`<div class="pv-footer-link" style="background:#fff"></div>`).join('')}
      </div>
    </div>`;
}

// ── Poster cards & brand sheet ────────────────────────────────────────

function ra(hex,a){const{r,g,b}=hexToRgb(hex);return`rgba(${r},${g},${b},${a})`}

// Tag a coloured block so the hover peek can reveal its role + hex
function ci(label,hex){return hex?`data-ci="${label}|${hex.toString().toUpperCase()}"`:'';}

function makeArt(p,v){
  const s=[
    `<rect width="400" height="260" fill="${p.bgDark}"/>
     <ellipse cx="252" cy="318" rx="208" ry="190" fill="${ra(p.primary,.80)}"/>
     <ellipse cx="18"  cy="252" rx="158" ry="142" fill="${ra(p.light,.52)}"/>
     <circle  cx="326" cy="68"  r="108"           fill="${ra(p.deep,.62)}"/>
     <circle  cx="70"  cy="312" r="138"           fill="${ra(p.primary,.26)}"/>`,
    `<rect width="400" height="260" fill="${p.primary}"/>
     <ellipse cx="252" cy="312" rx="208" ry="188" fill="${ra(p.deep,.65)}"/>
     <ellipse cx="18"  cy="250" rx="155" ry="140" fill="${ra(p.light,.52)}"/>
     <circle  cx="322" cy="66"  r="105"           fill="${ra(p.bgLight,.28)}"/>
     <circle  cx="68"  cy="308" r="136"           fill="${ra(p.bgDark,.26)}"/>`,
    `<rect width="400" height="260" fill="${p.bgLight}"/>
     <ellipse cx="252" cy="314" rx="206" ry="188" fill="${ra(p.primary,.38)}"/>
     <ellipse cx="18"  cy="250" rx="155" ry="140" fill="${ra(p.deep,.30)}"/>
     <circle  cx="324" cy="66"  r="106"           fill="${ra(p.light,.44)}"/>
     <circle  cx="68"  cy="310" r="136"           fill="${ra(p.primary,.18)}"/>`
  ];
  return`<svg viewBox="0 0 400 260" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice" style="display:block;width:100%;height:100%">${s[v%3]}</svg>`;
}

function renderPosterCards(p){
  const el=document.getElementById('posterCards');
  const dt=bestText(p.bgDark);
  const pt=bestText(p.primary);
  const lt=bestText(p.bgLight);

  // Card 1: Santé-style — primary strip + bgDark + real typography + primary badge
  const card1=`
    <div style="border-radius:16px;overflow:hidden;aspect-ratio:3/4;display:flex;flex-direction:column;background:${p.bgDark};font-family:'DM Sans',sans-serif">
      <div style="height:7px;background:${p.primary};flex-shrink:0"></div>
      <div style="flex:1;padding:20px 22px 22px;display:flex;flex-direction:column">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:22px">
          <span style="font-size:13px;font-weight:700;color:${dt};letter-spacing:-.2px">Brand.</span>
          <span style="font-size:7.5px;font-weight:600;letter-spacing:.18em;text-transform:uppercase;color:${dt};opacity:.38">Visual Story</span>
        </div>
        <div style="font-size:22px;font-weight:700;color:${dt};opacity:.55;line-height:1;margin-bottom:8px">"</div>
        <div style="font-size:clamp(14px,1.7vw,17px);font-weight:600;line-height:1.42;color:${dt};letter-spacing:-.3px;flex:1">Design that speaks<br>before you say<br>a word.</div>
        <div style="height:1px;background:${dt};opacity:.1;margin:16px 0"></div>
        <div style="display:flex;align-items:center;gap:11px;margin-bottom:12px">
          <div style="width:30px;height:30px;border-radius:7px;background:${p.primary};flex-shrink:0;display:flex;align-items:center;justify-content:center">
            <div style="width:10px;height:13px;background:${pt};opacity:.7;border-radius:2px"></div>
          </div>
          <div>
            <div style="font-size:11px;font-weight:600;color:${dt};letter-spacing:-.1px;margin-bottom:2px">Studio Client</div>
            <div style="font-size:7.5px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:${p.primary};opacity:.75">Paletta System</div>
          </div>
        </div>
        <div style="font-size:9px;color:${dt};opacity:.28;line-height:1.6">Colour systems that hold across every single touchpoint of your brand.</div>
      </div>
    </div>`;

  // Card 2: bgLight + circle art + real headline (like tSocial but as a poster)
  const card2=`
    <div style="border-radius:16px;overflow:hidden;aspect-ratio:3/4;display:flex;flex-direction:column;background:${p.primary};position:relative;padding:22px 22px 24px;font-family:'DM Sans',sans-serif">
      <div style="position:absolute;top:-24px;right:-24px;pointer-events:none">
        <svg width="170" height="170" viewBox="0 0 170 170" xmlns="http://www.w3.org/2000/svg">
          <circle cx="114" cy="56" r="56" fill="${ra(p.deep,.72)}"/>
          <circle cx="70" cy="98" r="40" fill="${ra(p.bgDark,.40)}"/>
        </svg>
      </div>
      <div style="font-size:8px;font-weight:700;letter-spacing:.18em;text-transform:uppercase;color:${pt};opacity:.42;position:relative">Brand Story</div>
      <div style="flex:1"></div>
      <div style="position:relative">
        <div style="font-size:clamp(18px,2.2vw,23px);font-weight:700;line-height:1.3;letter-spacing:-.5px;color:${pt};margin-bottom:10px">Building brand<br>identity with<br>intention.</div>
        <div style="font-size:10.5px;color:${pt};opacity:.52;line-height:1.6">Colour systems that hold across every touchpoint.</div>
      </div>
    </div>`;

  // Card 3: COLOUR. logotype — bgLight surface, browser-chrome bars + primary rule + wordmark
  const card3=`
    <div style="border-radius:16px;overflow:hidden;aspect-ratio:3/4;display:flex;flex-direction:column;background:${p.bgLight};padding:24px 26px;font-family:'DM Sans',sans-serif">
      <div style="display:flex;justify-content:space-between;align-items:center">
        <div style="height:7px;width:48px;background:${p.bgDark};opacity:.28;border-radius:4px"></div>
        <div style="height:7px;width:26px;background:${p.bgDark};opacity:.14;border-radius:4px"></div>
      </div>
      <div style="flex:1"></div>
      <div>
        <div style="height:3px;width:30px;background:${p.primary};margin-bottom:13px"></div>
        <div style="font-size:clamp(34px,4.4vw,52px);font-weight:800;letter-spacing:-2px;line-height:.88;color:${p.bgDark}">COLOUR.</div>
      </div>
    </div>`;

  el.innerHTML=card1+card2+card3;
}

// ── Generate & sync ───────────────────────────────────────────────────

function generate(hex,hex2){
  hex=hex.toLowerCase();
  if(!/^#[0-9a-f]{6}$/.test(hex)) return;
  currentAnchor=hex;
  if(hasSec&&hex2){
    const h2=hex2.toLowerCase();
    if(/^#[0-9a-f]{6}$/.test(h2)){
      currentSecondaryAnchor=h2;
      currentPalette={...generatePalette(hex),...generateSecondaryPalette(h2)};
    } else {
      currentPalette=generatePalette(hex);
    }
  } else {
    currentPalette=generatePalette(hex);
  }
  renderCards(currentPalette);
  renderPreview(currentPalette);
  renderLightPreview(currentPalette);
  renderPosterCards(currentPalette);
  if(!hasSec) renderSchemeRow(hex);
  document.getElementById('swatchFace').style.background=hex;
  document.getElementById('colorPicker').value=hex;
  document.getElementById('hexInput').value=hex.replace('#','');
  if(hasSec){
    const s2=currentSecondaryAnchor;
    document.getElementById('swatchFace2').style.background=s2;
    document.getElementById('colorPicker2').value=s2;
    document.getElementById('hexInput2').value=s2.replace('#','');
  }
}

// ── Copy helpers ──────────────────────────────────────────────────────

function copyHex(el){
  const hex=el.dataset.hex;
  navigator.clipboard.writeText(hex).then(()=>{
    el.classList.add('copied');
    showToast('Copied '+hex);
    setTimeout(()=>el.classList.remove('copied'),2000);
  });
}

function showToast(msg){
  const t=document.getElementById('toast');
  t.textContent=msg;
  t.classList.add('show');
  clearTimeout(t._timer);
  t._timer=setTimeout(()=>t.classList.remove('show'),2200);
}

// ── Export ────────────────────────────────────────────────────────────

function buildCssString(){
  const map={bgDark:'bg-dark',bgLight:'bg-light',primary:'primary',light:'light-accent',deep:'deep-accent',muted:'muted-text'};
  if(currentPalette.secondary) Object.assign(map,{secondary:'secondary',secondaryLight:'secondary-light',secondaryDeep:'secondary-deep'});
  return':root {\n'+Object.entries(map).map(([k,v])=>`  --color-${v}: ${currentPalette[k]};`).join('\n')+'\n}';
}

function buildJsonObj(){
  const allRoles=currentPalette.secondary?[...ROLES,...SECONDARY_ROLES]:ROLES;
  const obj={anchor:currentAnchor};
  if(currentPalette.secondary) obj.secondaryAnchor=currentSecondaryAnchor;
  allRoles.forEach(r=>{obj[r.key]={hex:currentPalette[r.key],role:r.name}});
  return obj;
}

function downloadFile(name,content,type){
  const a=document.createElement('a');
  a.href=URL.createObjectURL(new Blob([content],{type}));
  a.download=name;
  a.click();
  URL.revokeObjectURL(a.href);
}

document.getElementById('exportCssBtn').addEventListener('click',()=>{
  if(!currentPalette) return;
  navigator.clipboard.writeText(buildCssString()).then(()=>showToast('CSS variables copied!'));
});

document.getElementById('exportJsonBtn').addEventListener('click',()=>{
  if(!currentPalette) return;
  navigator.clipboard.writeText(JSON.stringify(buildJsonObj(),null,2)).then(()=>showToast('JSON copied!'));
});

document.getElementById('dlCssBtn').addEventListener('click',()=>{
  if(!currentPalette) return;
  const slug=currentAnchor.replace('#','');
  downloadFile(`paletta-${slug}.css`,buildCssString(),'text/css');
  showToast('CSS file downloaded');
});

document.getElementById('dlJsonBtn').addEventListener('click',()=>{
  if(!currentPalette) return;
  const slug=currentAnchor.replace('#','');
  downloadFile(`paletta-${slug}.json`,JSON.stringify(buildJsonObj(),null,2),'application/json');
  showToast('JSON file downloaded');
});

document.getElementById('dlPngBtn').addEventListener('click',()=>{
  if(!currentPalette) downloadPNG();
  else downloadPNG();
});

function downloadPNG(){
  if(!currentPalette) return;
  const p=currentPalette;
  const allRoles=p.secondary?[...ROLES,...SECONDARY_ROLES]:ROLES;
  const COLS=3;
  const ROWS=p.secondary?3:2;
  const SC=2;
  const W=1260;
  const PAD=28;
  const GAP=12;
  const HDR=86;
  const swW=Math.floor((W-PAD*2-GAP*(COLS-1))/COLS);
  const swH=ROWS===3?200:248;
  const H=PAD+HDR+12+ROWS*swH+GAP*(ROWS-1)+PAD;

  const canvas=document.createElement('canvas');
  canvas.width=W*SC; canvas.height=H*SC;
  const ctx=canvas.getContext('2d');
  ctx.scale(SC,SC);

  function rr(x,y,w,h,r){
    ctx.beginPath();
    ctx.moveTo(x+r,y);
    ctx.lineTo(x+w-r,y);
    ctx.arcTo(x+w,y,x+w,y+r,r);
    ctx.lineTo(x+w,y+h-r);
    ctx.arcTo(x+w,y+h,x+w-r,y+h,r);
    ctx.lineTo(x+r,y+h);
    ctx.arcTo(x,y+h,x,y+h-r,r);
    ctx.lineTo(x,y+r);
    ctx.arcTo(x,y,x+r,y,r);
    ctx.closePath();
  }

  // Page bg
  ctx.fillStyle='#0d0d10';
  ctx.fillRect(0,0,W,H);

  // Header card
  ctx.fillStyle='rgba(255,255,255,.05)';
  rr(PAD,PAD,W-PAD*2,HDR,12); ctx.fill();

  ctx.fillStyle='rgba(255,255,255,.3)';
  ctx.font='700 9px DM Sans,system-ui,sans-serif';
  ctx.fillText('COLOUR SYSTEM',PAD+18,PAD+24);

  ctx.fillStyle='rgba(255,255,255,.78)';
  ctx.font='500 18px DM Mono,monospace';
  ctx.fillText(currentAnchor,PAD+18,PAD+58);

  if(p.secondary){
    ctx.fillStyle='rgba(255,255,255,.36)';
    ctx.font='500 14px DM Mono,monospace';
    ctx.fillText('+ '+currentSecondaryAnchor,PAD+18+104,PAD+60);
  }

  ctx.fillStyle='rgba(255,255,255,.18)';
  ctx.font='700 9px DM Sans,system-ui,sans-serif';
  ctx.textAlign='right';
  ctx.fillText('PALETTA',W-PAD-16,PAD+24);
  ctx.textAlign='left';

  // Primary swatch chip in header
  const chipX=W-PAD-16-32-8;
  rr(chipX,PAD+HDR/2-12,32,24,7);
  ctx.fillStyle=p.primary; ctx.fill();

  // Swatches
  const gridY=PAD+HDR+12;
  allRoles.forEach((role,i)=>{
    const col=i%COLS;
    const row=Math.floor(i/COLS);
    const x=PAD+col*(swW+GAP);
    const y=gridY+row*(swH+GAP);
    const hex=p[role.key];
    const isLight=bestText(hex)==='#111111';
    const fade=(op)=>isLight?`rgba(0,0,0,${op})`:`rgba(255,255,255,${op})`;

    // Swatch bg
    ctx.fillStyle=hex;
    rr(x,y,swW,swH,14); ctx.fill();

    // Role label
    ctx.fillStyle=fade(.34);
    ctx.font='700 8px DM Sans,system-ui,sans-serif';
    ctx.fillText(role.name.toUpperCase(),x+16,y+22);

    // Hex
    ctx.fillStyle=fade(.88);
    ctx.font='500 20px DM Mono,monospace';
    ctx.fillText(hex,x+16,y+swH-32);

    // Usage (first clause, truncated)
    const useRaw=role.usedFor.split(',')[0].trim();
    ctx.font='400 10px DM Sans,system-ui,sans-serif';
    const maxW=swW-32;
    let useTxt=useRaw;
    while(ctx.measureText(useTxt).width>maxW&&useTxt.length>1) useTxt=useTxt.slice(0,-1);
    if(useTxt!==useRaw) useTxt+='…';
    ctx.fillStyle=fade(.38);
    ctx.fillText(useTxt,x+16,y+swH-12);
  });

  const dataUrl=canvas.toDataURL('image/png');
  const a=document.createElement('a');
  a.href=dataUrl;
  a.download=`paletta-${currentAnchor.replace('#','')}.png`;
  a.click();
  showToast('PNG downloaded');
}

// ── Companion suggestions ─────────────────────────────────────────────
// Applies a suggested hex as the secondary anchor and regenerates.
function applyCompanion(hex){
  document.querySelectorAll('#schemeRow .scheme-tile')
    .forEach(b=>b.classList.remove('active'));
  hasSec=true;
  document.getElementById('secRow').style.display='flex';
  document.getElementById('addSecBtn').style.display='none';
  currentSecondaryAnchor=hex;
  generate(currentAnchor,hex);
}

// ── Designed 4-role scheme (anchor · deep · accent · neutral) ──────────
// Unlike the harmony chips, each companion sits at its OWN lightness and
// chroma — mirroring a hand-built palette like the Switch Palette reference.
function schemeColors(anchorHex){
  const ok=culori.oklch(anchorHex);
  if(!ok) return[];
  const l=isNaN(ok.l)?0.5:(ok.l||0);
  const c=isNaN(ok.c)?0:(ok.c||0);
  const h=isNaN(ok.h)?0:(ok.h||0);
  return[
    {label:'Anchor', hex:anchorHex.toLowerCase(), anchor:true},
    // Deep shade — same hue family, dropped dark & calmer (yellow → brown).
    {label:'Deep',    hex:toHex(clamp(l*0.40,0.20,0.34), clamp(c*0.58,0.02,0.095), h)},
    // Contrast accent — complement, balanced mid-tone.
    {label:'Accent',  hex:toHex(clamp(l*0.62,0.44,0.58), clamp(Math.max(c*0.72,0.07),0,0.13), (h+180)%360)},
    // Light neutral — near-white, faintly tinted by the hue.
    {label:'Neutral', hex:toHex(clamp(Math.max(l,0.80)+0.07,0.86,0.94), 0.006, h)},
  ];
}

function renderSchemeRow(anchorHex){
  const row=document.getElementById('schemeRow');
  row.innerHTML=schemeColors(anchorHex).map(({label,hex,anchor})=>`
    <button class="scheme-tile${anchor?' is-anchor':''}" data-hex="${hex}"${anchor?' disabled':''}>
      <span class="scheme-swatch" style="background:${hex}"></span>
      <span class="scheme-meta">
        <span class="scheme-label">${label}</span>
        <span class="scheme-hex">${hex.toUpperCase()}</span>
      </span>
    </button>`).join('');

  row.querySelectorAll('.scheme-tile:not(.is-anchor)').forEach(btn=>{
    btn.addEventListener('click',()=>{
      applyCompanion(btn.dataset.hex);
      btn.classList.add('active');
    });
  });
}

// ── Input sync ────────────────────────────────────────────────────────

const picker=document.getElementById('colorPicker');
const hexInput=document.getElementById('hexInput');
const picker2=document.getElementById('colorPicker2');
const hexInput2=document.getElementById('hexInput2');
const genBtn=document.getElementById('genBtn');
const addSecBtn=document.getElementById('addSecBtn');
const secRemove=document.getElementById('secRemove');

picker.addEventListener('input',e=>{
  hexInput.value=e.target.value.replace('#','');
  generate(e.target.value,currentSecondaryAnchor);
});

hexInput.addEventListener('input',e=>{
  const v=e.target.value.replace(/[^0-9a-fA-F]/g,'').slice(0,6);
  e.target.value=v;
  if(v.length===6) generate('#'+v,currentSecondaryAnchor);
});

picker2.addEventListener('input',e=>{
  hexInput2.value=e.target.value.replace('#','');
  generate(currentAnchor,e.target.value);
});

hexInput2.addEventListener('input',e=>{
  const v=e.target.value.replace(/[^0-9a-fA-F]/g,'').slice(0,6);
  e.target.value=v;
  if(v.length===6) generate(currentAnchor,'#'+v);
});

genBtn.addEventListener('click',()=>{
  const v1=hexInput.value.trim();
  const v2=hexInput2.value.trim();
  if(v1.length===6) generate('#'+v1,v2.length===6?'#'+v2:currentSecondaryAnchor);
});

hexInput.addEventListener('keydown',e=>{if(e.key==='Enter') genBtn.click()});
hexInput2.addEventListener('keydown',e=>{if(e.key==='Enter') genBtn.click()});

addSecBtn.addEventListener('click',()=>{
  hasSec=true;
  document.getElementById('secRow').style.display='flex';
  document.getElementById('schemeRow').style.display='none';
  document.getElementById('schemeCaption').style.display='none';
  addSecBtn.style.display='none';
  generate(currentAnchor,currentSecondaryAnchor);
});

secRemove.addEventListener('click',()=>{
  hasSec=false;
  document.getElementById('secRow').style.display='none';
  document.getElementById('schemeRow').style.display='flex';
  document.getElementById('schemeCaption').style.display='';
  document.querySelectorAll('#schemeRow .scheme-tile').forEach(b=>b.classList.remove('active'));
  addSecBtn.style.display='';
  generate(currentAnchor);
});

// ── Preview tabs ─────────────────────────────────────────────────────

document.querySelectorAll('.preview-tab').forEach(btn=>{
  btn.addEventListener('click',()=>{
    document.querySelectorAll('.preview-tab').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    const tab=btn.dataset.tab;
    document.getElementById('pagePreview').style.display=tab==='dark'?'':'none';
    document.getElementById('lightPreview').style.display=tab==='light'?'':'none';
  });
});

// ── Preview colour peek (hover a block to reveal its role + hex) ─────
(function(){
  const tip=document.createElement('div');
  tip.className='pv-peek';
  document.body.appendChild(tip);
  let raf=null,x=0,y=0,cur=null;
  const place=()=>{raf=null;tip.style.left=x+'px';tip.style.top=y+'px';};
  document.querySelectorAll('.preview-wrap').forEach(wrap=>{
    wrap.addEventListener('mousemove',e=>{
      const el=e.target.closest('[data-ci]');
      if(!el){tip.classList.remove('show');cur=null;return;}
      const key=el.getAttribute('data-ci');
      if(key!==cur){
        cur=key;
        const [label,hex]=key.split('|');
        tip.innerHTML=`<span class="pv-peek-dot" style="background:${hex}"></span><span class="pv-peek-name">${label}</span><span class="pv-peek-hex">${hex}</span>`;
        tip.classList.add('show');
      }
      x=e.clientX+14;y=e.clientY+16;
      if(!raf) raf=requestAnimationFrame(place);
    });
    wrap.addEventListener('mouseleave',()=>{tip.classList.remove('show');cur=null;});
    wrap.addEventListener('click',e=>{
      const el=e.target.closest('[data-ci]');
      if(!el) return;
      const hex=el.getAttribute('data-ci').split('|')[1];
      navigator.clipboard?.writeText(hex);
      tip.classList.add('copied');
      setTimeout(()=>tip.classList.remove('copied'),650);
    });
  });
})();

// ── Theme toggle ─────────────────────────────────────────────────────

const themeToggle=document.getElementById('themeToggle');
if(localStorage.getItem('paletta-theme')==='light') document.body.classList.add('light');

themeToggle.addEventListener('click',()=>{
  document.body.classList.toggle('light');
  localStorage.setItem('paletta-theme',document.body.classList.contains('light')?'light':'dark');
});

// ── Init ──────────────────────────────────────────────────────────────
generate('#c4522a');
