"use strict";var TetsuzukiQuest=(()=>{var U=Object.defineProperty;var ce=Object.getOwnPropertyDescriptor;var pe=Object.getOwnPropertyNames;var ue=Object.prototype.hasOwnProperty;var me=(n,t)=>{for(var e in t)U(n,e,{get:t[e],enumerable:!0})},xe=(n,t,e,o)=>{if(t&&typeof t=="object"||typeof t=="function")for(let i of pe(t))!ue.call(n,i)&&i!==e&&U(n,i,{get:()=>t[i],enumerable:!(o=ce(t,i))||o.enumerable});return n};var ge=n=>xe(U({},"__esModule",{value:!0}),n);var Le={};me(Le,{start:()=>Se,startWithPrompt:()=>Ce,startWithScenario:()=>Be,stop:()=>ze});var z=0,_=0;function F(n){z=0,_=n}function W(n,t){z=n,_=t}function Y(n){z=n}function G(){z=0,_=0}function R(){return{current:z,total:_}}var N="tq-bubble";function be(n){return n==="happy"?"\u{1F60A}":n==="thinking"?"\u{1F914}":"\u{1F610}"}function X(n){return`
    <div style="
      width:56px;height:56px;border-radius:50%;
      background:linear-gradient(135deg,#3b82f6,#1d4ed8);
      display:flex;align-items:center;justify-content:center;
      font-size:28px;flex-shrink:0;
      box-shadow:0 2px 8px rgba(0,0,0,0.3);
    ">${be(n)}</div>
  `}function J(n,t){let e=t>0?Math.min(100,Math.round(n/t*100)):0,o=document.createElement("div");o.style.cssText="display:flex;align-items:center;gap:8px;margin-bottom:10px;";let i=document.createElement("div");i.style.cssText=`
    flex:1;height:4px;background:#f3f4f6;border-radius:9999px;overflow:hidden;
  `;let s=document.createElement("div");s.style.cssText=`
    height:100%;width:${e}%;background:#f97316;border-radius:9999px;
    transition:width 0.4s ease;
  `;let c=document.createElement("span");return c.style.cssText="font-size:11px;color:#9ca3af;white-space:nowrap;flex-shrink:0;",c.textContent=`${n} / ${t}`,i.appendChild(s),o.appendChild(i),o.appendChild(c),o}function h(n,t,e,o=!1,i){f();let{current:s,total:c}=R(),r=document.createElement("div");r.id=N,r.style.cssText=`
    position:fixed;bottom:24px;left:24px;
    display:flex;align-items:flex-end;gap:12px;
    z-index:100000;max-width:420px;
    animation:tq-slide-in 0.3s ease;
  `;let d=document.createElement("div");d.style.cssText=`
    background:white;border-radius:16px 16px 16px 4px;
    padding:14px 16px;
    box-shadow:0 4px 20px rgba(0,0,0,0.15);
    flex:1;position:relative;
  `,c>0&&d.appendChild(J(s,c));let m=document.createElement("p");m.style.cssText=`
    margin:0 0 10px;font-size:14px;line-height:1.6;
    color:#1f2937;min-height:20px;
  `;let p=0,u=()=>{p<n.length&&(m.textContent+=n[p++],setTimeout(u,16))};if(u(),d.appendChild(m),i||!o){let l=document.createElement("div");if(l.style.cssText="display:flex;justify-content:flex-end;align-items:center;gap:8px;margin-top:4px;",i){let a=document.createElement("button");a.textContent=i.label,a.style.cssText=`
        background:transparent;border:1.5px solid #0d9488;
        color:#0d9488;padding:5px 12px;border-radius:8px;font-size:12px;
        cursor:pointer;font-weight:600;transition:all 0.15s;
      `,a.onmouseover=()=>{a.style.background="#0d9488",a.style.color="white"},a.onmouseout=()=>{a.style.background="transparent",a.style.color="#0d9488"},a.onmousedown=b=>b.preventDefault(),a.onclick=i.onClick,l.appendChild(a)}if(!o){let a=document.createElement("button");a.textContent="\u6B21\u3078 \u2192",a.style.cssText=`
        background:#3b82f6;color:white;border:none;
        padding:6px 16px;border-radius:8px;font-size:13px;
        cursor:pointer;font-weight:600;transition:background 0.15s;
      `,a.onmouseover=()=>{a.style.background="#2563eb"},a.onmouseout=()=>{a.style.background="#3b82f6"},a.onclick=()=>{f(),t()},l.appendChild(a)}d.appendChild(l)}if(r.innerHTML=X(e),r.appendChild(d),document.body.appendChild(r),!document.getElementById("tq-styles")){let l=document.createElement("style");l.id="tq-styles",l.textContent=`
      @keyframes tq-slide-in {
        from { opacity:0; transform:translateY(20px); }
        to { opacity:1; transform:translateY(0); }
      }
      @keyframes tq-pulse-ring {
        0% { transform:scale(1); opacity:0.8; }
        100% { transform:scale(1.5); opacity:0; }
      }
    `,document.head.appendChild(l)}}var fe={green:{bg:"#22c55e",text:"white"},red:{bg:"#ef4444",text:"white"},blue:{bg:"#3b82f6",text:"white"},yellow:{bg:"#eab308",text:"white"},purple:{bg:"#a855f7",text:"white"},orange:{bg:"#f97316",text:"white"},pink:{bg:"#ec4899",text:"white"},cyan:{bg:"#06b6d4",text:"white"},amber:{bg:"#f59e0b",text:"white"},indigo:{bg:"#6366f1",text:"white"},lime:{bg:"#84cc16",text:"white"},white:{bg:"#f9fafb",text:"#374151"}};function ee(n,t){f();let{current:e,total:o}=R(),i=document.createElement("div");i.id=N,i.style.cssText=`
    position:fixed;bottom:24px;left:24px;
    display:flex;align-items:flex-end;gap:12px;
    z-index:100000;max-width:420px;
    animation:tq-slide-in 0.3s ease;
  `;let s=document.createElement("div");s.style.cssText=`
    background:white;border-radius:16px 16px 16px 4px;
    padding:14px 16px;
    box-shadow:0 4px 20px rgba(0,0,0,0.15);
    flex:1;
  `,o>0&&s.appendChild(J(e,o));let c=document.createElement("p");c.style.cssText=`
    margin:0 0 12px;font-size:14px;line-height:1.6;color:#1f2937;font-weight:600;
  `;let r=0,d=()=>{r<n.length&&(c.textContent+=n[r++],setTimeout(d,16))};d();let m=document.createElement("div");m.style.cssText="display:flex;gap:8px;flex-wrap:wrap;";for(let p of t){let u=fe[p.color]??{bg:"#6b7280",text:"white"},l=document.createElement("button");l.textContent=p.label,l.style.cssText=`
      background:${u.bg};color:${u.text};border:none;
      padding:6px 18px;border-radius:8px;font-size:13px;
      cursor:pointer;font-weight:600;flex:1;min-width:80px;
      transition:opacity 0.15s;
    `,l.onmouseover=()=>{l.style.opacity="0.85"},l.onmouseout=()=>{l.style.opacity="1"},l.onclick=()=>{f(),p.onSelect()},m.appendChild(l)}s.appendChild(c),s.appendChild(m),i.innerHTML=X("thinking"),i.appendChild(s),document.body.appendChild(i)}function f(){var n;(n=document.getElementById(N))==null||n.remove()}var te="tq-overlay",he="tq-ring",K=null,$=null,ne="";function q(){ne=document.body.style.overflow,document.body.style.overflow="hidden"}function S(){document.body.style.overflow=ne}function H(n,t,e,o,i,s,c=!0){let r="http://www.w3.org/2000/svg",d=document.createElementNS(r,"svg");d.setAttribute("width","100%"),d.setAttribute("height","100%"),d.style.cssText="position:absolute;inset:0;width:100%;height:100%;";let m=document.createElementNS(r,"defs"),p=document.createElementNS(r,"mask");p.id=s;let u=document.createElementNS(r,"rect");u.setAttribute("x","0"),u.setAttribute("y","0"),u.setAttribute("width","100%"),u.setAttribute("height","100%"),u.setAttribute("fill","white");let l=document.createElementNS(r,"rect");l.setAttribute("x",String(t)),l.setAttribute("y",String(e)),l.setAttribute("width",String(o-t)),l.setAttribute("height",String(i-e)),l.setAttribute("rx","4"),l.setAttribute("fill","black"),p.appendChild(u),p.appendChild(l),m.appendChild(p),d.appendChild(m);let a=document.createElementNS(r,"rect");a.setAttribute("x","0"),a.setAttribute("y","0"),a.setAttribute("width","100%"),a.setAttribute("height","100%"),a.setAttribute("fill","rgba(0,0,0,0.75)"),a.setAttribute("mask",`url(#${s})`),c||(a.style.pointerEvents="none"),d.appendChild(a),n.appendChild(d)}function O(){L();let n=document.createElement("div");n.id=te,n.style.cssText=`
    position:fixed;inset:0;
    background:rgba(0,0,0,0.75);
    z-index:99998;
    pointer-events:all;
  `,document.body.appendChild(n)}function L(){var n,t;K==null||K(),$==null||$(),$=null,(n=document.getElementById(te))==null||n.remove(),(t=document.getElementById(he))==null||t.remove(),S()}var j="tq-doc-modal";function ye(n,t){if(n==="custom"&&t)return`<img src="${t}" alt="\u66F8\u985E\u306E\u898B\u672C" style="max-width:100%;border-radius:8px;">`;if(n.startsWith("cdoc-")){try{let i=JSON.parse(localStorage.getItem("tq_custom_doc_types")??"[]").find(s=>s.id===n);if(i)return`<img src="${i.imageBase64}" alt="${i.label}" style="max-width:100%;border-radius:8px;">`}catch{}return'<p style="color:#6b7280;text-align:center;">\u753B\u50CF\u304C\u898B\u3064\u304B\u308A\u307E\u305B\u3093</p>'}let e={"mynumber-card":`
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
    `};return e[n]??e["mynumber-card"]}function oe(n){var c;(c=document.getElementById(j))==null||c.remove();let t=document.createElement("div");t.id=j,t.style.cssText=`
    position:fixed;inset:0;background:rgba(0,0,0,0.6);
    z-index:200000;display:flex;align-items:center;justify-content:center;
    animation:tq-slide-in 0.2s ease;
  `;let e=document.createElement("div");e.style.cssText=`
    background:white;border-radius:16px;padding:24px;
    max-width:480px;width:90%;
    box-shadow:0 20px 60px rgba(0,0,0,0.3);
  `;let o=document.createElement("h3");o.textContent="\u66F8\u985E\u306E\u898B\u672C",o.style.cssText="margin:0 0 16px;font-size:16px;font-weight:700;color:#1f2937;";let i=document.createElement("div");i.style.cssText="display:flex;justify-content:center;margin-bottom:20px;",i.innerHTML=ye(n.documentType,n.previewImageUrl);let s=document.createElement("button");s.textContent="\u9589\u3058\u308B",s.style.cssText=`
    width:100%;background:#f3f4f6;border:none;
    padding:10px;border-radius:8px;font-size:14px;
    cursor:pointer;font-weight:600;color:#374151;
    transition:background 0.15s;
  `,s.onmouseover=()=>{s.style.background="#e5e7eb"},s.onmouseout=()=>{s.style.background="#f3f4f6"},s.onclick=()=>t.remove(),t.onclick=r=>{r.target===t&&t.remove()},e.appendChild(o),e.appendChild(i),e.appendChild(s),t.appendChild(e),document.body.appendChild(t)}function Z(){var n;(n=document.getElementById(j))==null||n.remove()}var T="tq-input-overlay",C="tq-input-ring",Q="tq-input-error-tooltip";function ie(n,t){if(M(),n.targetType==="button"){Ee(n,t);return}if(n.targetType==="element"){we(n,t);return}let e=document.getElementById(n.targetId);if(!e){h(n.message,t);return}e.scrollIntoView({block:"center",inline:"nearest"}),q();let o=()=>{var V;(V=document.getElementById(T))==null||V.remove();let x=e.getBoundingClientRect(),g=12,I=x.left-g,k=x.top-g,le=x.right+g,ae=x.bottom+g,A=document.createElement("div");A.id=T,A.style.cssText="position:fixed;inset:0;background:transparent;z-index:99998;pointer-events:none;",H(A,I,k,le,ae,"tq-input-mask",!1),document.body.appendChild(A)};o(),window.addEventListener("resize",o);let i=e.style.pointerEvents,s=e.style.zIndex,c=e.style.outline,r=e.style.boxShadow;e.style.pointerEvents="auto",e.style.zIndex="99999",e.style.position=e.style.position||"relative",e.focus();let d=n.documentType?{label:`\u{1F50D} ${n.buttonLabel??"\u898B\u672C\u3092\u78BA\u8A8D"}`,onClick:()=>oe({id:n.id,type:"document-preview",message:"",targetId:n.targetId,targetLabel:n.targetLabel,documentType:n.documentType,buttonLabel:n.buttonLabel,nextId:n.nextId})}:void 0;h(n.message,()=>{},void 0,!0,d);let m=n.validationPattern?new RegExp(n.validationPattern):null,p=null,u=()=>{var x;p&&(window.removeEventListener("resize",p),p=null),(x=document.getElementById(Q))==null||x.remove()},l=x=>{u();let g=document.createElement("div");g.id=Q,g.textContent=x,g.style.cssText=`
      position:fixed;
      background:white;color:#ef4444;
      border:1.5px solid #ef4444;border-radius:6px;
      padding:6px 10px;font-size:12px;font-weight:600;
      white-space:nowrap;
      box-shadow:0 2px 8px rgba(239,68,68,0.2);
      z-index:100001;pointer-events:none;
    `;let I=()=>{let k=e.getBoundingClientRect();g.style.left=`${k.left}px`,g.style.top=`${k.bottom+8}px`};I(),document.body.appendChild(g),p=I,window.addEventListener("resize",p)},a=()=>{window.removeEventListener("resize",o),e.removeEventListener("keydown",E),e.style.pointerEvents=i,e.style.zIndex=s,e.style.outline=c,e.style.boxShadow=r,u(),M(),f(),S()},b=!1,v=()=>{if(b)return;let x=e.value.trim();if(m){if(!x){e.style.outline="2px solid #ef4444",e.style.boxShadow="0 0 0 3px rgba(239,68,68,0.2)",l("\u5165\u529B\u3057\u3066\u304B\u3089\u6B21\u3078\u9032\u3093\u3067\u304F\u3060\u3055\u3044"),f(),h("\u5165\u529B\u3057\u3066\u304B\u3089\u6B21\u3078\u9032\u3093\u3067\u304F\u3060\u3055\u3044\u3002",()=>{},"thinking",!0,d),e.focus(),e.addEventListener("blur",w,{once:!0});return}if(!m.test(x)){e.style.outline="2px solid #ef4444",e.style.boxShadow="0 0 0 3px rgba(239,68,68,0.2)",l(n.errorMessage||"\u5165\u529B\u5185\u5BB9\u304C\u6B63\u3057\u304F\u3042\u308A\u307E\u305B\u3093"),f(),h(n.errorMessage||"\u5165\u529B\u5185\u5BB9\u304C\u6B63\u3057\u304F\u3042\u308A\u307E\u305B\u3093\u3002\u3082\u3046\u4E00\u5EA6\u78BA\u8A8D\u3057\u3066\u304F\u3060\u3055\u3044\u3002",()=>{},"thinking",!0,d),e.focus(),e.addEventListener("blur",w,{once:!0});return}}b=!0,e.removeEventListener("keydown",E),e.style.outline="2px solid #22c55e",e.style.boxShadow="0 0 0 3px rgba(34,197,94,0.2)",u(),setTimeout(()=>{a(),t()},400)},w=()=>v(),E=x=>{x.key==="Enter"&&(x.preventDefault(),v())};e.addEventListener("blur",w,{once:!0}),e.addEventListener("keydown",E)}function ve(n){var o;let t=n.tagName.toLowerCase(),e=(o=n.type)==null?void 0:o.toLowerCase();return t==="input"&&(e==="checkbox"||e==="radio")?{eventName:"change",shouldAdvance:i=>i.target.checked}:t==="select"?{eventName:"change",shouldAdvance:()=>!0}:{eventName:"click",shouldAdvance:()=>!0}}function we(n,t){let e=document.querySelector(n.targetId);if(!e){h(n.message,t);return}e.scrollIntoView({block:"center",inline:"nearest"}),q();let o=()=>{var w,E;(w=document.getElementById(T))==null||w.remove(),(E=document.getElementById(C))==null||E.remove();let d=e.getBoundingClientRect(),m=8,p=d.left-m,u=d.top-m,l=d.right+m,a=d.bottom+m,b=document.createElement("div");b.id=T,b.style.cssText="position:fixed;inset:0;background:transparent;z-index:99998;pointer-events:all;",H(b,p,u,l,a,"tq-element-mask"),document.body.appendChild(b);let v=document.createElement("div");v.id=C,v.style.cssText=`
      position:fixed;left:${p}px;top:${u}px;
      width:${l-p}px;height:${a-u}px;
      border:3px solid #fbbf24;border-radius:6px;
      z-index:99999;pointer-events:none;
      animation:tq-pulse-ring 1.2s ease-out infinite;
    `,document.body.appendChild(v)};o(),window.addEventListener("resize",o);let i=e.style.pointerEvents,s=e.style.position,c=e.style.zIndex;e.style.pointerEvents="auto",e.style.position=e.style.position||"relative",e.style.zIndex="99999";let r=()=>{var d,m;window.removeEventListener("resize",o),e.style.pointerEvents=i,e.style.position=s,e.style.zIndex=c,(d=document.getElementById(T))==null||d.remove(),(m=document.getElementById(C))==null||m.remove(),S()};h(n.message,()=>{r(),f(),t()})}function Ee(n,t){let e=document.getElementById(n.targetId);if(!e){h(n.message,t);return}e.scrollIntoView({block:"center",inline:"nearest"}),q();let o=()=>{var I,k;(I=document.getElementById(T))==null||I.remove(),(k=document.getElementById(C))==null||k.remove();let l=e.getBoundingClientRect(),a=8,b=l.left-a,v=l.top-a,w=l.right+a,E=l.bottom+a,x=document.createElement("div");x.id=T,x.style.cssText="position:fixed;inset:0;background:transparent;z-index:99998;pointer-events:all;",H(x,b,v,w,E,"tq-input-button-mask"),document.body.appendChild(x);let g=document.createElement("div");g.id=C,g.style.cssText=`
      position:fixed;left:${b}px;top:${v}px;
      width:${w-b}px;height:${E-v}px;
      border:3px solid #fbbf24;border-radius:6px;
      z-index:99999;pointer-events:none;
      animation:tq-pulse-ring 1.2s ease-out infinite;
    `,document.body.appendChild(g)};o(),window.addEventListener("resize",o);let i=e.style.pointerEvents,s=e.style.position,c=e.style.zIndex;e.style.pointerEvents="auto",e.style.position=e.style.position||"relative",e.style.zIndex="99999";let r=e.disabled;r&&(e.disabled=!1);let d=()=>{var l,a;window.removeEventListener("resize",o),e.style.pointerEvents=i,e.style.position=s,e.style.zIndex=c,r&&(e.disabled=!0),(l=document.getElementById(T))==null||l.remove(),(a=document.getElementById(C))==null||a.remove(),S()},{eventName:m,shouldAdvance:p}=ve(e),u=l=>{p(l)&&(e.removeEventListener(m,u),d(),f(),t())};e.addEventListener(m,u),h(n.message,()=>{},void 0,!0)}function M(){var n,t,e;(n=document.getElementById(T))==null||n.remove(),(t=document.getElementById(C))==null||t.remove(),(e=document.getElementById(Q))==null||e.remove(),S()}var P=class{scenario;currentBlockId;currentStep;totalSteps;constructor(t){this.scenario=t,this.currentBlockId=null,this.currentStep=0,this.totalSteps=t.totalSteps??t.blocks.filter(e=>e.type!=="start"&&e.type!=="end").length}start(){this.currentBlockId=this.scenario.startBlockId,this.currentStep=0,F(this.totalSteps),this.currentBlockId&&this.renderCurrentBlock()}next(t){if(!t){this.cleanup();return}this.currentBlockId=t,this.renderCurrentBlock()}renderCurrentBlock(){if(!this.currentBlockId)return;let t=this.scenario.blocks.find(e=>e.id===this.currentBlockId);if(!t){this.cleanup();return}this.currentStep++,W(this.currentStep,this.totalSteps),window.parent.postMessage({type:"TETSUZUKI_QUEST_BLOCK_ACTIVE",blockId:t.id},"*"),this.render(t)}render(t){switch(t.type){case"start":this.currentStep--,t.message?(O(),h(t.message,()=>this.next(t.nextId),t.characterMood)):this.next(t.nextId);break;case"end":this.finish(t.message);break;case"speech":O(),h(t.message,()=>this.next(t.nextId),t.characterMood);break;case"input-spotlight":L(),ie(t,()=>this.next(t.nextId));break;case"branch":O(),ee(t.question,t.options.map(e=>({label:e.label,color:e.color,onSelect:()=>this.next(e.nextId)})));break}}cleanup(){Y(this.totalSteps),f(),L(),M(),Z(),window.parent.postMessage({type:"TETSUZUKI_QUEST_BLOCK_ACTIVE",blockId:null},"*")}finish(t){this.cleanup();let e=t??"\u624B\u7D9A\u304D\u306E\u6D41\u308C\u3092\u78BA\u8A8D\u3067\u304D\u307E\u3057\u305F\u3002",o=document.createElement("div");o.id="tq-completion-toast",o.style.cssText=`
      position:fixed;bottom:24px;right:24px;
      background:white;border-radius:16px;padding:20px 24px;
      box-shadow:0 8px 32px rgba(0,0,0,0.18);
      z-index:100001;display:flex;align-items:center;gap:16px;
      animation:tq-slide-in 0.3s ease;
      pointer-events:auto;
    `,o.innerHTML=`
      <div style="font-size:36px;">\u{1F389}</div>
      <div>
        <div style="font-size:15px;font-weight:700;color:#1f2937;margin-bottom:2px;">\u30C1\u30E5\u30FC\u30C8\u30EA\u30A2\u30EB\u5B8C\u4E86\uFF01</div>
        <div style="font-size:13px;color:#6b7280;">${e.replace(/</g,"&lt;")}</div>
      </div>
      <button id="tq-completion-close" style="
        background:transparent;border:none;color:#9ca3af;
        font-size:20px;cursor:pointer;padding:4px;line-height:1;
        margin-left:8px;
      ">\u2715</button>
    `,document.body.appendChild(o),document.getElementById("tq-completion-close").onclick=()=>o.remove(),setTimeout(()=>o.remove(),5e3),window.parent.postMessage({type:"TETSUZUKI_QUEST_FINISHED"},"*")}destroy(){var t;f(),L(),M(),Z(),G(),(t=document.getElementById("tq-completion-toast"))==null||t.remove()}};var y=null,Te="tq-pick-highlight";function re(n){let t=[],e=n,o=0,i=50;for(;e&&o<i;){if(e.id){t.unshift(`#${CSS.escape(e.id)}`);break}let s=e.tagName.toLowerCase(),c=e.parentElement;if(!c){t.unshift(s);break}let r=Array.from(c.children).filter(d=>d.tagName===e.tagName);if(r.length===1)t.unshift(s);else{let d=r.indexOf(e)+1;t.unshift(`${s}:nth-of-type(${d})`)}e=c,o++}return t.join(" > ")}function Ie(n){let t=document.createElement("div");t.style.cssText="position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:999999;display:flex;align-items:center;justify-content:center;";let e=document.createElement("div");e.style.cssText="background:white;padding:24px;border-radius:8px;max-width:400px;";let o=document.createElement("h3");o.style.cssText="color:#ef4444;margin-bottom:12px;",o.textContent="\u30A8\u30E9\u30FC";let i=document.createElement("p");i.textContent=n;let s=document.createElement("button");s.style.cssText="margin-top:16px;padding:8px 16px;background:#3b82f6;color:white;border:none;border-radius:4px;cursor:pointer;",s.textContent="\u9589\u3058\u308B",s.onclick=()=>t.remove(),e.appendChild(o),e.appendChild(i),e.appendChild(s),t.appendChild(e),document.body.appendChild(t)}function se(n,t){let e=document.createElement("div");e.id="tq-start-dialog",e.style.cssText=`
    position:fixed;inset:0;
    background:rgba(0,0,0,0.45);
    z-index:100002;
    display:flex;align-items:center;justify-content:center;
  `;let o=document.createElement("div");o.style.cssText=`
    background:white;border-radius:20px;
    padding:32px 28px;max-width:360px;width:90%;
    box-shadow:0 16px 48px rgba(0,0,0,0.22);
    text-align:center;
  `;let i=document.createElement("div");i.style.cssText="font-size:48px;margin-bottom:12px;",i.textContent="\u{1F9ED}";let s=document.createElement("div");s.style.cssText="font-size:17px;font-weight:700;color:#1f2937;margin-bottom:6px;",s.textContent=n.title;let c=document.createElement("span");c.textContent="\u3053\u306E\u30DA\u30FC\u30B8\u306E\u64CD\u4F5C\u624B\u9806\u3092\u30AC\u30A4\u30C9\u3057\u307E\u3059\u3002";let r=document.createElement("span");r.textContent="\u30C1\u30E5\u30FC\u30C8\u30EA\u30A2\u30EB\u3092\u958B\u59CB\u3057\u307E\u3059\u304B\uFF1F";let d=document.createElement("p");d.style.cssText="font-size:13px;color:#6b7280;margin-bottom:24px;line-height:1.6;",d.appendChild(c),d.appendChild(document.createElement("br")),d.appendChild(r);let m=document.createElement("div");m.style.cssText="display:flex;flex-direction:column;gap:10px;";let p=document.createElement("button");p.id="tq-start-btn",p.style.cssText=`
    background:#3b82f6;color:white;border:none;
    border-radius:10px;padding:12px;font-size:15px;
    font-weight:700;cursor:pointer;
  `,p.textContent="\u25B6 \u958B\u59CB\u3059\u308B";let u=document.createElement("button");u.id="tq-skip-btn",u.style.cssText=`
    background:transparent;color:#9ca3af;
    border:1.5px solid #e5e7eb;border-radius:10px;
    padding:10px;font-size:14px;cursor:pointer;
  `,u.textContent="\u30B9\u30AD\u30C3\u30D7",m.appendChild(p),m.appendChild(u),o.appendChild(i),o.appendChild(s),o.appendChild(d),o.appendChild(m),e.appendChild(o),document.body.appendChild(e);let l=()=>e.remove();p.onclick=()=>{l(),t()},u.onclick=l,e.addEventListener("click",a=>{a.target===e&&l()})}var B=null;function ke(){B&&B();let n=Array.from(document.querySelectorAll("[disabled]"));n.forEach(c=>c.removeAttribute("disabled"));let t=document.createElement("div");t.id=Te,t.style.cssText=`
    position:fixed;pointer-events:none;z-index:999999;
    border:2px solid #f59e0b;border-radius:4px;
    background:rgba(245,158,11,0.15);transition:all 0.05s;
    display:none;
  `,document.body.appendChild(t);let e=document.createElement("div");e.style.cssText=`
    position:fixed;z-index:1000000;pointer-events:none;
    background:#1f2937;color:white;font-size:11px;font-family:monospace;
    padding:3px 8px;border-radius:4px;white-space:nowrap;display:none;
  `,document.body.appendChild(e);let o=null,i=c=>{let r=document.elementFromPoint(c.clientX,c.clientY);if(!r||r===t||r===e)return;o=r;let d=r.getBoundingClientRect();t.style.display="block",t.style.left=`${d.left-2}px`,t.style.top=`${d.top-2}px`,t.style.width=`${d.width+4}px`,t.style.height=`${d.height+4}px`;let m=re(r),p=r.id??"",u=!!p;e.style.background=u?"#1f2937":"#b45309",e.textContent=u?`#${p}  (${r.tagName.toLowerCase()})`:`(ID\u306A\u3057) ${m}`,e.style.display="block",e.style.left=`${Math.min(c.clientX+12,window.innerWidth-200)}px`,e.style.top=`${c.clientY+16}px`},s=c=>{c.preventDefault(),c.stopImmediatePropagation();let r=o??document.elementFromPoint(c.clientX,c.clientY);if(!r||r===t||r===e)return;if(r.tagName.toLowerCase()==="label"){let p=r,u=p.htmlFor?document.getElementById(p.htmlFor):p.querySelector("input, select, textarea, button");u&&(r=u)}let d=re(r),m=r.id??"";window.parent.postMessage({type:"TETSUZUKI_QUEST_ELEMENT_PICKED",selector:d,id:m},"*"),de()};document.addEventListener("mousemove",i,!0),document.addEventListener("mousedown",s,!0),document.body.style.cursor="crosshair",B=()=>{document.removeEventListener("mousemove",i,!0),document.removeEventListener("mousedown",s,!0),document.body.style.cursor="",t.remove(),e.remove(),n.forEach(c=>c.setAttribute("disabled","")),B=null}}function de(){B&&B()}var D={async start(n){try{let t=await fetch(n);if(!t.ok)throw new Error(`Failed to fetch scenario: ${t.status}`);let e=await t.json();D.startWithScenario(e)}catch(t){console.error("[TetsuzukiQuest] Failed to load scenario:",t),Ie("\u30B7\u30CA\u30EA\u30AA\u306E\u8AAD\u307F\u8FBC\u307F\u306B\u5931\u6557\u3057\u307E\u3057\u305F\u3002")}},startWithScenario(n){y&&y.destroy(),y=new P(n),y.start()},stop(){y&&(y.destroy(),y=null)}};window.addEventListener("message",n=>{var t,e,o,i;if(n.origin!==window.location.origin){console.warn("[TetsuzukiQuest] Untrusted origin:",n.origin);return}((t=n.data)==null?void 0:t.type)==="TETSUZUKI_QUEST_START"&&D.startWithScenario(n.data.scenario),((e=n.data)==null?void 0:e.type)==="TETSUZUKI_QUEST_STOP"&&D.stop(),((o=n.data)==null?void 0:o.type)==="TETSUZUKI_QUEST_PICK_START"&&ke(),((i=n.data)==null?void 0:i.type)==="TETSUZUKI_QUEST_PICK_CANCEL"&&de()});function Ce(n){let t=()=>{y&&y.destroy(),y=new P(n),y.start()};document.readyState==="loading"?document.addEventListener("DOMContentLoaded",()=>se(n,t),{once:!0}):se(n,t)}var{start:Se,startWithScenario:Be,stop:ze}=D;return ge(Le);})();
