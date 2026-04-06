"use strict";var TetsuzukiQuest=(()=>{var D=Object.defineProperty;var ce=Object.getOwnPropertyDescriptor;var pe=Object.getOwnPropertyNames;var ue=Object.prototype.hasOwnProperty;var xe=(e,t)=>{for(var n in t)D(e,n,{get:t[n],enumerable:!0})},me=(e,t,n,i)=>{if(t&&typeof t=="object"||typeof t=="function")for(let o of pe(t))!ue.call(e,o)&&o!==n&&D(e,o,{get:()=>t[o],enumerable:!(i=ce(t,o))||i.enumerable});return e};var ge=e=>me(D({},"__esModule",{value:!0}),e);var Be={};xe(Be,{start:()=>Te,startWithPrompt:()=>Ie,startWithScenario:()=>Se,stop:()=>Ce});var S=0,_=0;function Y(e){S=0,_=e}function F(e,t){S=e,_=t}function G(e){S=e}function X(){S=0,_=0}function R(){return{current:S,total:_}}var N="tq-bubble";function be(e){return e==="happy"?"\u{1F60A}":e==="thinking"?"\u{1F914}":"\u{1F610}"}function J(e){return`
    <div style="
      width:56px;height:56px;border-radius:50%;
      background:linear-gradient(135deg,#3b82f6,#1d4ed8);
      display:flex;align-items:center;justify-content:center;
      font-size:28px;flex-shrink:0;
      box-shadow:0 2px 8px rgba(0,0,0,0.3);
    ">${be(e)}</div>
  `}function ee(e,t){let n=t>0?Math.min(100,Math.round(e/t*100)):0,i=document.createElement("div");i.style.cssText="display:flex;align-items:center;gap:8px;margin-bottom:10px;";let o=document.createElement("div");o.style.cssText=`
    flex:1;height:4px;background:#f3f4f6;border-radius:9999px;overflow:hidden;
  `;let r=document.createElement("div");r.style.cssText=`
    height:100%;width:${n}%;background:#f97316;border-radius:9999px;
    transition:width 0.4s ease;
  `;let l=document.createElement("span");return l.style.cssText="font-size:11px;color:#9ca3af;white-space:nowrap;flex-shrink:0;",l.textContent=`${e} / ${t}`,o.appendChild(r),i.appendChild(o),i.appendChild(l),i}function y(e,t,n,i=!1,o){b();let{current:r,total:l}=R(),c=document.createElement("div");c.id=N,c.style.cssText=`
    position:fixed;bottom:24px;left:24px;
    display:flex;align-items:flex-end;gap:12px;
    z-index:100000;max-width:420px;
    animation:tq-slide-in 0.3s ease;
  `;let p=document.createElement("div");p.style.cssText=`
    background:white;border-radius:16px 16px 16px 4px;
    padding:14px 16px;
    box-shadow:0 4px 20px rgba(0,0,0,0.15);
    flex:1;position:relative;
  `,l>0&&p.appendChild(ee(r,l));let m=document.createElement("p");m.style.cssText=`
    margin:0 0 10px;font-size:14px;line-height:1.6;
    color:#1f2937;min-height:20px;
  `;let u=0,a=()=>{u<e.length&&(m.textContent+=e[u++],setTimeout(a,16))};if(a(),p.appendChild(m),o||!i){let s=document.createElement("div");if(s.style.cssText="display:flex;justify-content:flex-end;align-items:center;gap:8px;margin-top:4px;",o){let d=document.createElement("button");d.textContent=o.label,d.style.cssText=`
        background:transparent;border:1.5px solid #0d9488;
        color:#0d9488;padding:5px 12px;border-radius:8px;font-size:12px;
        cursor:pointer;font-weight:600;transition:all 0.15s;
      `,d.onmouseover=()=>{d.style.background="#0d9488",d.style.color="white"},d.onmouseout=()=>{d.style.background="transparent",d.style.color="#0d9488"},d.onmousedown=h=>h.preventDefault(),d.onclick=o.onClick,s.appendChild(d)}if(!i){let d=document.createElement("button");d.textContent="\u6B21\u3078 \u2192",d.style.cssText=`
        background:#3b82f6;color:white;border:none;
        padding:6px 16px;border-radius:8px;font-size:13px;
        cursor:pointer;font-weight:600;transition:background 0.15s;
      `,d.onmouseover=()=>{d.style.background="#2563eb"},d.onmouseout=()=>{d.style.background="#3b82f6"},d.onclick=()=>{b(),t()},s.appendChild(d)}p.appendChild(s)}if(c.innerHTML=J(n),c.appendChild(p),document.body.appendChild(c),!document.getElementById("tq-styles")){let s=document.createElement("style");s.id="tq-styles",s.textContent=`
      @keyframes tq-slide-in {
        from { opacity:0; transform:translateY(20px); }
        to { opacity:1; transform:translateY(0); }
      }
      @keyframes tq-pulse-ring {
        0% { transform:scale(1); opacity:0.8; }
        100% { transform:scale(1.5); opacity:0; }
      }
    `,document.head.appendChild(s)}}var fe={green:{bg:"#22c55e",text:"white"},red:{bg:"#ef4444",text:"white"},blue:{bg:"#3b82f6",text:"white"},yellow:{bg:"#eab308",text:"white"},purple:{bg:"#a855f7",text:"white"},orange:{bg:"#f97316",text:"white"},pink:{bg:"#ec4899",text:"white"},cyan:{bg:"#06b6d4",text:"white"},amber:{bg:"#f59e0b",text:"white"},indigo:{bg:"#6366f1",text:"white"},lime:{bg:"#84cc16",text:"white"},white:{bg:"#f9fafb",text:"#374151"}};function te(e,t){b();let{current:n,total:i}=R(),o=document.createElement("div");o.id=N,o.style.cssText=`
    position:fixed;bottom:24px;left:24px;
    display:flex;align-items:flex-end;gap:12px;
    z-index:100000;max-width:420px;
    animation:tq-slide-in 0.3s ease;
  `;let r=document.createElement("div");r.style.cssText=`
    background:white;border-radius:16px 16px 16px 4px;
    padding:14px 16px;
    box-shadow:0 4px 20px rgba(0,0,0,0.15);
    flex:1;
  `,i>0&&r.appendChild(ee(n,i));let l=document.createElement("p");l.style.cssText=`
    margin:0 0 12px;font-size:14px;line-height:1.6;color:#1f2937;font-weight:600;
  `;let c=0,p=()=>{c<e.length&&(l.textContent+=e[c++],setTimeout(p,16))};p();let m=document.createElement("div");m.style.cssText="display:flex;gap:8px;flex-wrap:wrap;";for(let u of t){let a=fe[u.color]??{bg:"#6b7280",text:"white"},s=document.createElement("button");s.textContent=u.label,s.style.cssText=`
      background:${a.bg};color:${a.text};border:none;
      padding:6px 18px;border-radius:8px;font-size:13px;
      cursor:pointer;font-weight:600;flex:1;min-width:80px;
      transition:opacity 0.15s;
    `,s.onmouseover=()=>{s.style.opacity="0.85"},s.onmouseout=()=>{s.style.opacity="1"},s.onclick=()=>{b(),u.onSelect()},m.appendChild(s)}r.appendChild(l),r.appendChild(m),o.innerHTML=J("thinking"),o.appendChild(r),document.body.appendChild(o)}function b(){var e;(e=document.getElementById(N))==null||e.remove()}var ne="tq-overlay",ye="tq-ring",H=null,$=null,oe="";function K(){oe=document.body.style.overflow,document.body.style.overflow="hidden"}function C(){document.body.style.overflow=oe}function j(e,t,n,i,o,r,l=!0){let c="http://www.w3.org/2000/svg",p=document.createElementNS(c,"svg");p.setAttribute("width","100%"),p.setAttribute("height","100%"),p.style.cssText="position:absolute;inset:0;width:100%;height:100%;";let m=document.createElementNS(c,"defs"),u=document.createElementNS(c,"mask");u.id=r;let a=document.createElementNS(c,"rect");a.setAttribute("x","0"),a.setAttribute("y","0"),a.setAttribute("width","100%"),a.setAttribute("height","100%"),a.setAttribute("fill","white");let s=document.createElementNS(c,"rect");s.setAttribute("x",String(t)),s.setAttribute("y",String(n)),s.setAttribute("width",String(i-t)),s.setAttribute("height",String(o-n)),s.setAttribute("rx","4"),s.setAttribute("fill","black"),u.appendChild(a),u.appendChild(s),m.appendChild(u),p.appendChild(m);let d=document.createElementNS(c,"rect");d.setAttribute("x","0"),d.setAttribute("y","0"),d.setAttribute("width","100%"),d.setAttribute("height","100%"),d.setAttribute("fill","rgba(0,0,0,0.75)"),d.setAttribute("mask",`url(#${r})`),l||(d.style.pointerEvents="none"),p.appendChild(d),e.appendChild(p)}function A(){B();let e=document.createElement("div");e.id=ne,e.style.cssText=`
    position:fixed;inset:0;
    background:rgba(0,0,0,0.75);
    z-index:99998;
    pointer-events:all;
  `,document.body.appendChild(e)}function B(){var e,t;H==null||H(),$==null||$(),$=null,(e=document.getElementById(ne))==null||e.remove(),(t=document.getElementById(ye))==null||t.remove(),C()}var Z="tq-doc-modal";function he(e,t){if(e==="custom"&&t)return`<img src="${t}" alt="\u66F8\u985E\u306E\u898B\u672C" style="max-width:100%;border-radius:8px;">`;if(e.startsWith("cdoc-")){try{let o=JSON.parse(localStorage.getItem("tq_custom_doc_types")??"[]").find(r=>r.id===e);if(o)return`<img src="${o.imageBase64}" alt="${o.label}" style="max-width:100%;border-radius:8px;">`}catch{}return'<p style="color:#6b7280;text-align:center;">\u753B\u50CF\u304C\u898B\u3064\u304B\u308A\u307E\u305B\u3093</p>'}let n={"mynumber-card":`
      <div style="
        width:340px;height:200px;background:linear-gradient(135deg,#1e40af,#3b82f6);
        border-radius:12px;padding:16px;color:white;
        display:flex;flex-direction:column;justify-content:space-between;
        box-shadow:0 4px 20px rgba(0,0,0,0.2);
      ">
        <div style="font-size:11px;opacity:0.8">\u500B\u4EBA\u756A\u53F7\u30AB\u30FC\u30C9 (\u30DE\u30A4\u30CA\u30F3\u30D0\u30FC\u30AB\u30FC\u30C9)</div>
        <div style="display:flex;gap:12px;align-items:center;">
          <div style="width:60px;height:80px;background:rgba(255,255,255,0.3);border-radius:4px;display:flex;align-items:center;justify-content:center;font-size:28px;">\u{1F464}</div>
          <div>
            <div style="font-size:16px;font-weight:bold;margin-bottom:4px;">\u5C71\u7530 \u592A\u90CE</div>
            <div style="font-size:11px;opacity:0.8">\u751F\u5E74\u6708\u65E5: \u662D\u548C60\u5E741\u67081\u65E5</div>
            <div style="font-size:11px;opacity:0.8">\u6027\u5225: \u7537</div>
            <div style="font-size:11px;opacity:0.8;margin-top:8px;">\u4F4F\u6240: \u6771\u4EAC\u90FD\u5343\u4EE3\u7530\u533A...</div>
          </div>
        </div>
        <div style="font-size:10px;opacity:0.7">\u6709\u52B9\u671F\u9650: \u4EE4\u548C15\u5E741\u67081\u65E5\u307E\u3067\u6709\u52B9</div>
      </div>
    `,receipt:`
      <div style="
        width:280px;background:white;border:1px solid #e5e7eb;
        border-radius:8px;padding:20px;
        font-family:monospace;font-size:12px;
        box-shadow:0 2px 8px rgba(0,0,0,0.1);
      ">
        <div style="text-align:center;font-size:16px;font-weight:bold;margin-bottom:12px;border-bottom:2px solid #1f2937;padding-bottom:8px;">\u9818 \u53CE \u66F8</div>
        <div style="margin-bottom:8px;">\u5C71\u7530 \u592A\u90CE \u69D8</div>
        <div style="margin:12px 0;padding:8px;background:#f9fafb;border-radius:4px;">
          <div style="display:flex;justify-content:space-between;">
            <span>\u624B\u6570\u6599</span><span>\xA5500</span>
          </div>
        </div>
        <div style="display:flex;justify-content:space-between;font-weight:bold;border-top:1px solid #e5e7eb;padding-top:8px;">
          <span>\u5408\u8A08</span><span>\xA5500</span>
        </div>
        <div style="margin-top:16px;text-align:right;font-size:10px;color:#6b7280;">
          \u25CB\u25CB\u5E02\u5F79\u6240<br>\u4EE4\u548C6\u5E741\u67081\u65E5
        </div>
      </div>
    `,"residence-certificate":`
      <div style="
        width:320px;background:white;border:2px solid #1f2937;
        border-radius:4px;padding:20px;
        font-size:12px;
        box-shadow:0 2px 8px rgba(0,0,0,0.1);
      ">
        <div style="text-align:center;font-size:16px;font-weight:bold;margin-bottom:16px;">\u4F4F \u6C11 \u7968 \u306E \u5199 \u3057</div>
        <table style="width:100%;border-collapse:collapse;font-size:11px;">
          <tr><td style="padding:4px 8px;border:1px solid #d1d5db;background:#f9fafb;width:100px;">\u6C0F\u540D</td><td style="padding:4px 8px;border:1px solid #d1d5db;">\u5C71\u7530 \u592A\u90CE</td></tr>
          <tr><td style="padding:4px 8px;border:1px solid #d1d5db;background:#f9fafb;">\u751F\u5E74\u6708\u65E5</td><td style="padding:4px 8px;border:1px solid #d1d5db;">\u662D\u548C60\u5E741\u67081\u65E5\u751F</td></tr>
          <tr><td style="padding:4px 8px;border:1px solid #d1d5db;background:#f9fafb;">\u6027\u5225</td><td style="padding:4px 8px;border:1px solid #d1d5db;">\u7537</td></tr>
          <tr><td style="padding:4px 8px;border:1px solid #d1d5db;background:#f9fafb;">\u4F4F\u6240</td><td style="padding:4px 8px;border:1px solid #d1d5db;">\u6771\u4EAC\u90FD\u5343\u4EE3\u7530\u533A\u5343\u4EE3\u75301-1</td></tr>
          <tr><td style="padding:4px 8px;border:1px solid #d1d5db;background:#f9fafb;">\u4E16\u5E2F\u4E3B</td><td style="padding:4px 8px;border:1px solid #d1d5db;">\u5C71\u7530 \u592A\u90CE</td></tr>
        </table>
        <div style="margin-top:16px;text-align:right;font-size:10px;color:#6b7280;">
          \u767A\u884C\u65E5\uFF1A\u4EE4\u548C6\u5E741\u67081\u65E5<br>\u5343\u4EE3\u7530\u533A\u9577
        </div>
      </div>
    `};return n[e]??n["mynumber-card"]}function ie(e){var l;(l=document.getElementById(Z))==null||l.remove();let t=document.createElement("div");t.id=Z,t.style.cssText=`
    position:fixed;inset:0;background:rgba(0,0,0,0.6);
    z-index:200000;display:flex;align-items:center;justify-content:center;
    animation:tq-slide-in 0.2s ease;
  `;let n=document.createElement("div");n.style.cssText=`
    background:white;border-radius:16px;padding:24px;
    max-width:480px;width:90%;
    box-shadow:0 20px 60px rgba(0,0,0,0.3);
  `;let i=document.createElement("h3");i.textContent="\u66F8\u985E\u306E\u898B\u672C",i.style.cssText="margin:0 0 16px;font-size:16px;font-weight:700;color:#1f2937;";let o=document.createElement("div");o.style.cssText="display:flex;justify-content:center;margin-bottom:20px;",o.innerHTML=he(e.documentType,e.previewImageUrl);let r=document.createElement("button");r.textContent="\u9589\u3058\u308B",r.style.cssText=`
    width:100%;background:#f3f4f6;border:none;
    padding:10px;border-radius:8px;font-size:14px;
    cursor:pointer;font-weight:600;color:#374151;
    transition:background 0.15s;
  `,r.onmouseover=()=>{r.style.background="#e5e7eb"},r.onmouseout=()=>{r.style.background="#f3f4f6"},r.onclick=()=>t.remove(),t.onclick=c=>{c.target===t&&t.remove()},n.appendChild(i),n.appendChild(o),n.appendChild(r),t.appendChild(n),document.body.appendChild(t)}function Q(){var e;(e=document.getElementById(Z))==null||e.remove()}var k="tq-input-overlay",q="tq-input-ring",V="tq-input-error-tooltip";function re(e,t){if(z(),e.targetType==="button"){we(e,t);return}let n=document.getElementById(e.targetId);if(!n){y(e.message,t);return}n.scrollIntoView({block:"center",inline:"nearest"}),K();let i=()=>{var W;(W=document.getElementById(k))==null||W.remove();let x=n.getBoundingClientRect(),g=12,w=x.left-g,P=x.top-g,le=x.right+g,ae=x.bottom+g,M=document.createElement("div");M.id=k,M.style.cssText="position:fixed;inset:0;background:transparent;z-index:99998;pointer-events:none;",j(M,w,P,le,ae,"tq-input-mask",!1),document.body.appendChild(M)};i(),window.addEventListener("resize",i);let o=n.style.pointerEvents,r=n.style.zIndex,l=n.style.outline,c=n.style.boxShadow;n.style.pointerEvents="auto",n.style.zIndex="99999",n.style.position=n.style.position||"relative",n.focus();let p=e.documentType?{label:`\u{1F50D} ${e.buttonLabel??"\u898B\u672C\u3092\u78BA\u8A8D"}`,onClick:()=>ie({id:e.id,type:"document-preview",message:"",targetId:e.targetId,targetLabel:e.targetLabel,documentType:e.documentType,buttonLabel:e.buttonLabel,nextId:e.nextId})}:void 0;y(e.message,()=>{},void 0,!0,p);let m=e.validationPattern?new RegExp(e.validationPattern):null,u=null,a=()=>{var x;u&&(window.removeEventListener("resize",u),u=null),(x=document.getElementById(V))==null||x.remove()},s=x=>{a();let g=document.createElement("div");g.id=V,g.textContent=x,g.style.cssText=`
      position:fixed;
      background:white;color:#ef4444;
      border:1.5px solid #ef4444;border-radius:6px;
      padding:6px 10px;font-size:12px;font-weight:600;
      white-space:nowrap;
      box-shadow:0 2px 8px rgba(239,68,68,0.2);
      z-index:100001;pointer-events:none;
    `;let w=()=>{let P=n.getBoundingClientRect();g.style.left=`${P.left}px`,g.style.top=`${P.bottom+8}px`};w(),document.body.appendChild(g),u=w,window.addEventListener("resize",u)},d=()=>{window.removeEventListener("resize",i),n.removeEventListener("keydown",v),n.style.pointerEvents=o,n.style.zIndex=r,n.style.outline=l,n.style.boxShadow=c,a(),z(),b(),C()},h=!1,T=()=>{if(h)return;let x=n.value.trim();if(m){if(!x){n.style.outline="2px solid #ef4444",n.style.boxShadow="0 0 0 3px rgba(239,68,68,0.2)",s("\u5165\u529B\u3057\u3066\u304B\u3089\u6B21\u3078\u9032\u3093\u3067\u304F\u3060\u3055\u3044"),b(),y("\u5165\u529B\u3057\u3066\u304B\u3089\u6B21\u3078\u9032\u3093\u3067\u304F\u3060\u3055\u3044\u3002",()=>{},"thinking",!0,p),n.focus(),n.addEventListener("blur",E,{once:!0});return}if(!m.test(x)){n.style.outline="2px solid #ef4444",n.style.boxShadow="0 0 0 3px rgba(239,68,68,0.2)",s(e.errorMessage||"\u5165\u529B\u5185\u5BB9\u304C\u6B63\u3057\u304F\u3042\u308A\u307E\u305B\u3093"),b(),y(e.errorMessage||"\u5165\u529B\u5185\u5BB9\u304C\u6B63\u3057\u304F\u3042\u308A\u307E\u305B\u3093\u3002\u3082\u3046\u4E00\u5EA6\u78BA\u8A8D\u3057\u3066\u304F\u3060\u3055\u3044\u3002",()=>{},"thinking",!0,p),n.focus(),n.addEventListener("blur",E,{once:!0});return}}h=!0,n.removeEventListener("keydown",v),n.style.outline="2px solid #22c55e",n.style.boxShadow="0 0 0 3px rgba(34,197,94,0.2)",a(),setTimeout(()=>{d(),t()},400)},E=()=>T(),v=x=>{x.key==="Enter"&&(x.preventDefault(),T())};n.addEventListener("blur",E,{once:!0}),n.addEventListener("keydown",v)}function ve(e){var i;let t=e.tagName.toLowerCase(),n=(i=e.type)==null?void 0:i.toLowerCase();return t==="input"&&(n==="checkbox"||n==="radio")?{eventName:"change",shouldAdvance:o=>o.target.checked}:t==="select"?{eventName:"change",shouldAdvance:()=>!0}:{eventName:"click",shouldAdvance:()=>!0}}function we(e,t){let n=document.getElementById(e.targetId);if(!n){y(e.message,t);return}n.scrollIntoView({block:"center",inline:"nearest"}),K();let i=()=>{var g,w;(g=document.getElementById(k))==null||g.remove(),(w=document.getElementById(q))==null||w.remove();let a=n.getBoundingClientRect(),s=8,d=a.left-s,h=a.top-s,T=a.right+s,E=a.bottom+s,v=document.createElement("div");v.id=k,v.style.cssText="position:fixed;inset:0;background:transparent;z-index:99998;pointer-events:all;",j(v,d,h,T,E,"tq-input-button-mask"),document.body.appendChild(v);let x=document.createElement("div");x.id=q,x.style.cssText=`
      position:fixed;left:${d}px;top:${h}px;
      width:${T-d}px;height:${E-h}px;
      border:3px solid #fbbf24;border-radius:6px;
      z-index:99999;pointer-events:none;
      animation:tq-pulse-ring 1.2s ease-out infinite;
    `,document.body.appendChild(x)};i(),window.addEventListener("resize",i);let o=n.style.pointerEvents,r=n.style.position,l=n.style.zIndex;n.style.pointerEvents="auto",n.style.position=n.style.position||"relative",n.style.zIndex="99999";let c=()=>{var a,s;window.removeEventListener("resize",i),n.style.pointerEvents=o,n.style.position=r,n.style.zIndex=l,(a=document.getElementById(k))==null||a.remove(),(s=document.getElementById(q))==null||s.remove(),C()},{eventName:p,shouldAdvance:m}=ve(n),u=a=>{m(a)&&(n.removeEventListener(p,u),c(),b(),t())};n.addEventListener(p,u),y(e.message,()=>{},void 0,!0)}function z(){var e,t,n;(e=document.getElementById(k))==null||e.remove(),(t=document.getElementById(q))==null||t.remove(),(n=document.getElementById(V))==null||n.remove(),C()}var L=class{scenario;currentBlockId;currentStep;totalSteps;constructor(t){this.scenario=t,this.currentBlockId=null,this.currentStep=0,this.totalSteps=t.totalSteps??t.blocks.filter(n=>n.type!=="start"&&n.type!=="end").length}start(){this.currentBlockId=this.scenario.startBlockId,this.currentStep=0,Y(this.totalSteps),this.currentBlockId&&this.renderCurrentBlock()}next(t){if(!t){this.cleanup();return}this.currentBlockId=t,this.renderCurrentBlock()}renderCurrentBlock(){if(!this.currentBlockId)return;let t=this.scenario.blocks.find(n=>n.id===this.currentBlockId);if(!t){this.cleanup();return}this.currentStep++,F(this.currentStep,this.totalSteps),window.parent.postMessage({type:"TETSUZUKI_QUEST_BLOCK_ACTIVE",blockId:t.id},"*"),this.render(t)}render(t){switch(t.type){case"start":this.currentStep--,t.message?(A(),y(t.message,()=>this.next(t.nextId),t.characterMood)):this.next(t.nextId);break;case"end":this.finish(t.message);break;case"speech":A(),y(t.message,()=>this.next(t.nextId),t.characterMood);break;case"input-spotlight":B(),re(t,()=>this.next(t.nextId));break;case"branch":A(),te(t.question,t.options.map(n=>({label:n.label,color:n.color,onSelect:()=>this.next(n.nextId)})));break}}cleanup(){G(this.totalSteps),b(),B(),z(),Q(),window.parent.postMessage({type:"TETSUZUKI_QUEST_BLOCK_ACTIVE",blockId:null},"*")}finish(t){this.cleanup();let n=t??"\u624B\u7D9A\u304D\u306E\u6D41\u308C\u3092\u78BA\u8A8D\u3067\u304D\u307E\u3057\u305F\u3002",i=document.createElement("div");i.id="tq-completion-toast",i.style.cssText=`
      position:fixed;bottom:24px;right:24px;
      background:white;border-radius:16px;padding:20px 24px;
      box-shadow:0 8px 32px rgba(0,0,0,0.18);
      z-index:100001;display:flex;align-items:center;gap:16px;
      animation:tq-slide-in 0.3s ease;
      pointer-events:auto;
    `,i.innerHTML=`
      <div style="font-size:36px;">\u{1F389}</div>
      <div>
        <div style="font-size:15px;font-weight:700;color:#1f2937;margin-bottom:2px;">\u30C1\u30E5\u30FC\u30C8\u30EA\u30A2\u30EB\u5B8C\u4E86\uFF01</div>
        <div style="font-size:13px;color:#6b7280;">${n.replace(/</g,"&lt;")}</div>
      </div>
      <button id="tq-completion-close" style="
        background:transparent;border:none;color:#9ca3af;
        font-size:20px;cursor:pointer;padding:4px;line-height:1;
        margin-left:8px;
      ">\u2715</button>
    `,document.body.appendChild(i),document.getElementById("tq-completion-close").onclick=()=>i.remove(),setTimeout(()=>i.remove(),5e3),window.parent.postMessage({type:"TETSUZUKI_QUEST_FINISHED"},"*")}destroy(){var t;b(),B(),z(),Q(),X(),(t=document.getElementById("tq-completion-toast"))==null||t.remove()}};var f=null,Ee="tq-pick-highlight";function O(e){if(e.id)return`#${e.id}`;let t=e.tagName.toLowerCase(),n=e.parentElement;if(!n)return t;let i=Array.from(n.children).filter(r=>r.tagName===e.tagName);if(i.length===1)return`${O(n)} > ${t}`;let o=i.indexOf(e)+1;return`${O(n)} > ${t}:nth-of-type(${o})`}var I=null;function ke(){I&&I();let e=document.createElement("div");e.id=Ee,e.style.cssText=`
    position:fixed;pointer-events:none;z-index:999999;
    border:2px solid #f59e0b;border-radius:4px;
    background:rgba(245,158,11,0.15);transition:all 0.05s;
    display:none;
  `,document.body.appendChild(e);let t=document.createElement("div");t.style.cssText=`
    position:fixed;z-index:1000000;pointer-events:none;
    background:#1f2937;color:white;font-size:11px;font-family:monospace;
    padding:3px 8px;border-radius:4px;white-space:nowrap;display:none;
  `,document.body.appendChild(t);let n=o=>{let r=document.elementFromPoint(o.clientX,o.clientY);if(!r||r===e||r===t)return;let l=r.getBoundingClientRect();e.style.display="block",e.style.left=`${l.left-2}px`,e.style.top=`${l.top-2}px`,e.style.width=`${l.width+4}px`,e.style.height=`${l.height+4}px`;let c=O(r),p=r.id??"";t.textContent=p?`#${p}  (${r.tagName.toLowerCase()})`:c,t.style.display="block",t.style.left=`${Math.min(o.clientX+12,window.innerWidth-200)}px`,t.style.top=`${o.clientY+16}px`},i=o=>{o.preventDefault(),o.stopPropagation();let r=document.elementFromPoint(o.clientX,o.clientY);if(!r||r===e||r===t)return;let l=O(r),c=r.id??"";window.parent.postMessage({type:"TETSUZUKI_QUEST_ELEMENT_PICKED",selector:l,id:c},"*"),de()};document.addEventListener("mousemove",n,!0),document.addEventListener("click",i,!0),document.body.style.cursor="crosshair",I=()=>{document.removeEventListener("mousemove",n,!0),document.removeEventListener("click",i,!0),document.body.style.cursor="",e.remove(),t.remove(),I=null}}function de(){I&&I()}function se(e,t){let n=document.createElement("div");n.id="tq-start-dialog",n.style.cssText=`
    position:fixed;inset:0;
    background:rgba(0,0,0,0.45);
    z-index:100002;
    display:flex;align-items:center;justify-content:center;
  `;let i=document.createElement("div");i.style.cssText=`
    background:white;border-radius:20px;
    padding:32px 28px;max-width:360px;width:90%;
    box-shadow:0 16px 48px rgba(0,0,0,0.22);
    text-align:center;
  `,i.innerHTML=`
    <div style="font-size:48px;margin-bottom:12px;">\u{1F9ED}</div>
    <div style="font-size:17px;font-weight:700;color:#1f2937;margin-bottom:6px;">
      ${e.title.replace(/</g,"&lt;")}
    </div>
    <p style="font-size:13px;color:#6b7280;margin-bottom:24px;line-height:1.6;">
      \u3053\u306E\u30DA\u30FC\u30B8\u306E\u64CD\u4F5C\u624B\u9806\u3092\u30AC\u30A4\u30C9\u3057\u307E\u3059\u3002<br>\u30C1\u30E5\u30FC\u30C8\u30EA\u30A2\u30EB\u3092\u958B\u59CB\u3057\u307E\u3059\u304B\uFF1F
    </p>
    <div style="display:flex;flex-direction:column;gap:10px;">
      <button id="tq-start-btn" style="
        background:#3b82f6;color:white;border:none;
        border-radius:10px;padding:12px;font-size:15px;
        font-weight:700;cursor:pointer;
      ">\u25B6 \u958B\u59CB\u3059\u308B</button>
      <button id="tq-skip-btn" style="
        background:transparent;color:#9ca3af;
        border:1.5px solid #e5e7eb;border-radius:10px;
        padding:10px;font-size:14px;cursor:pointer;
      ">\u30B9\u30AD\u30C3\u30D7</button>
    </div>
  `,n.appendChild(i),document.body.appendChild(n);let o=()=>n.remove();document.getElementById("tq-start-btn").onclick=()=>{o(),t()},document.getElementById("tq-skip-btn").onclick=o,n.addEventListener("click",r=>{r.target===n&&o()})}var U={async start(e){try{let t=await fetch(e);if(!t.ok)throw new Error(`Failed to fetch scenario: ${t.status}`);let n=await t.json();U.startWithScenario(n)}catch(t){console.error("[TetsuzukiQuest] Failed to load scenario:",t)}},startWithScenario(e){f&&f.destroy(),f=new L(e),f.start()},stop(){f&&(f.destroy(),f=null)}};window.addEventListener("message",e=>{var t,n,i,o;((t=e.data)==null?void 0:t.type)==="TETSUZUKI_QUEST_START"&&U.startWithScenario(e.data.scenario),((n=e.data)==null?void 0:n.type)==="TETSUZUKI_QUEST_STOP"&&U.stop(),((i=e.data)==null?void 0:i.type)==="TETSUZUKI_QUEST_PICK_START"&&ke(),((o=e.data)==null?void 0:o.type)==="TETSUZUKI_QUEST_PICK_CANCEL"&&de()});function Ie(e){let t=()=>{f&&f.destroy(),f=new L(e),f.start()};document.readyState==="loading"?document.addEventListener("DOMContentLoaded",()=>se(e,t),{once:!0}):se(e,t)}var{start:Te,startWithScenario:Se,stop:Ce}=U;return ge(Be);})();
