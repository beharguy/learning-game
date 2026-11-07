export function icon(name, cls='') {
  const paths={
    play:'<path d="m8 4 12 8-12 8Z" fill="currentColor" stroke="none"/>',
    sprout:'<path d="M12 21v-9M12 16C5 16 3 12 3 6c6 0 9 3 9 10ZM12 12c0-6 3-9 9-9 0 6-3 9-9 9Z"/>',
    flower:'<path d="M12 21v-6m0 5c-5 0-6-2-6-4 4 0 6 1 6 4"/><path d="M12 4c-4-7-9 1-5 4-6 3 0 9 5 5 5 4 11-2 5-5 4-3-1-11-5-4Z"/><circle cx="12" cy="9" r="2"/>',
    leaf:'<path d="M20 3C8 2 1 6 4 15s16 6 16-12ZM4 21 15 10"/>',
    sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l2 2m10 10 2 2M5 19l2-2M17 7l2-2"/>',
    home:'<path d="m3 10 9-7 9 7v10H3ZM9 20v-7h6v7"/>',
    book:'<path d="M12 5C8 2 4 3 2 4v15c4-2 7-1 10 1 3-2 6-3 10-1V4c-2-1-6-2-10 1Zm0 0v15"/>',
    volume:'<path d="m11 4-6 5H2v6h3l6 5ZM15 8c3 2 3 6 0 8m3-11c5 4 5 10 0 14"/>',
    mute:'<path d="m11 4-6 5H2v6h3l6 5Zm5 5 6 6m0-6-6 6"/>',
    arrow:'<path d="M5 12h14m-6-6 6 6-6 6"/>',
    left:'<path d="M19 12H5m6-6-6 6 6 6"/>',
    check:'<path d="m5 12 4 4L19 6"/>',
    close:'<path d="m6 6 12 12M6 18 18 6"/>',
    lock:'<rect x="5" y="10" width="14" height="11" rx="3"/><path d="M8 10V7a4 4 0 0 1 8 0v3m-4 4v3"/>',
    star:'<path d="m12 2 3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1Z"/>',
    search:'<circle cx="10" cy="10" r="6"/><path d="m15 15 6 6"/>',
    blocks:'<rect x="2" y="12" width="9" height="9" rx="2"/><rect x="13" y="12" width="9" height="9" rx="2"/><rect x="7.5" y="2" width="9" height="9" rx="2"/>',
    cards:'<rect x="3" y="3" width="12" height="16" rx="3"/><path d="M18 6h1a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-9"/>',
    settings:'<path d="M4 7h16M4 17h16"/><circle cx="8" cy="7" r="3" fill="currentColor"/><circle cx="16" cy="17" r="3" fill="currentColor"/>',
    download:'<path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5"/>',
    undo:'<path d="m8 3-5 5 5 5M3 8h11a6 6 0 0 1 0 12h-3"/>',
    heart:'<path d="M12 21S1 14 2 8c1-6 8-6 10-1 2-5 9-5 10 1 1 6-10 13-10 13Z"/>',
    clock:'<circle cx="12" cy="12" r="9"/><path d="M12 6v6l4 2"/>',
    help:'<circle cx="12" cy="12" r="9"/><path d="M9 8c1-3 6-2 6 1 0 2-3 2-3 5m0 3v.1"/>',
  };
  return `<svg class="icon ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name]||paths.sprout}</svg>`;
}
export function mascot(extra='') {
  return `<svg class="mascot ${extra}" viewBox="0 0 330 300" fill="none" aria-hidden="true">
    <ellipse cx="168" cy="271" rx="101" ry="12" fill="#c8d8bf" opacity=".5"/>
    <path d="M70 198C28 179 22 145 39 138c17-7 19 29 49 31" fill="#638753"/>
    <path d="M248 167c23-13 23-46 39-39 19 9 7 47-29 67" fill="#638753"/>
    <path d="M125 243c-2 29-13 31-24 26-10-4-7-17-1-36m111 9c-1 28 9 33 21 27 12-6 6-20 1-34" fill="#56774b"/>
    <path d="M163 68c-13-30-29-48-55-41 0 31 25 50 55 41Z" fill="#86a774"/>
    <path d="M163 68c5-39 31-56 59-44-8 33-26 47-59 44Z" fill="#4b7545"/>
    <path d="M164 69c-5-12-13-21-23-28" stroke="#4b7545" stroke-width="4" stroke-linecap="round"/>
    <path d="M62 175c0-66 30-108 100-108s105 46 105 108c0 58-36 89-101 89S62 237 62 175Z" fill="#a7bf8b"/>
    <path d="M84 186c0-45 32-78 81-78s83 32 83 78c0 44-31 68-82 68s-82-25-82-68Z" fill="#d7e4bb"/>
    <ellipse cx="126" cy="158" rx="7" ry="10" fill="#354b37"/><ellipse cx="204" cy="158" rx="7" ry="10" fill="#354b37"/>
    <circle cx="128" cy="155" r="2" fill="#fff"/><circle cx="206" cy="155" r="2" fill="#fff"/>
    <ellipse cx="110" cy="178" rx="13" ry="8" fill="#eda992"/><ellipse cx="220" cy="178" rx="13" ry="8" fill="#eda992"/>
    <path d="M150 177q15 21 30 0" stroke="#354b37" stroke-width="5" stroke-linecap="round"/>
    <path d="m128 217 37 7 37-7v32l-37 7-37-7Z" fill="#f9f4df"/><path d="M165 224v32" stroke="#d4cba6" stroke-width="3"/>
    <path d="M139 230l16 3m-16 6 16 3m21-9 16-3m-16 12 16-3" stroke="#8e9e7a" stroke-width="3" stroke-linecap="round"/>
    <path d="m55 83 4-11 4 11 11 4-11 4-4 11-4-11-11-4Z" fill="#e8b44b"/>
    <path d="m272 77 3-8 3 8 8 3-8 3-3 8-3-8-8-3Z" fill="#e8b44b"/>
  </svg>`;
}
export function plant(index=0) {
  const colors=['#d9866d','#c2a0ce','#e6bd60','#89a892','#88aebe'];
  const c=colors[index%colors.length];
  return `<svg class="plant" viewBox="0 0 100 120" aria-hidden="true"><path d="M50 102V42M50 82C23 83 21 63 21 63c21-2 29 19 29 19M50 70c24 0 29-22 29-22-25 0-29 22-29 22" fill="#8da97f" stroke="#6a875d" stroke-width="3"/><g fill="${c}"><ellipse cx="50" cy="26" rx="11" ry="17"/><ellipse cx="50" cy="56" rx="11" ry="17"/><ellipse cx="35" cy="41" rx="17" ry="11"/><ellipse cx="65" cy="41" rx="17" ry="11"/></g><circle cx="50" cy="41" r="10" fill="#fbebae"/><path d="m30 94 7 23h26l7-23Z" fill="#d5ac83"/></svg>`;
}

export function visual(value) {
  const drawings={
    date:'<path d="M22 38Q52 4 88 31" fill="none" stroke="#67804d" stroke-width="6"/><path d="M56 27 69 14M41 31 45 13M69 27 84 21" stroke="#7b975a" stroke-width="5"/><ellipse cx="49" cy="64" rx="22" ry="36" transform="rotate(26 49 64)" fill="#a7683b"/><ellipse cx="79" cy="72" rx="20" ry="32" transform="rotate(-17 79 72)" fill="#bf8150"/><path d="M45 41Q29 61 39 84M74 48Q64 67 77 91" fill="none" stroke="#754a2e" stroke-width="3" stroke-linecap="round"/>',
    belt:'<path d="M20 42h68q29 0 27 24T88 88H14V68h72q12 0 10-6T84 59H20Z" fill="#986b43"/><rect x="10" y="36" width="35" height="32" rx="5" fill="none" stroke="#d9b65f" stroke-width="7"/><path d="M28 52h28" stroke="#d9b65f" stroke-width="5"/><circle cx="74" cy="51" r="2" fill="#543b2e"/>',
    carpet:'<path d="M20 30h80v66H20Z" fill="#bc9271"/><path d="M30 39h60v48H30Z" fill="#d5b086"/><path d="m60 47 18 16-18 16-18-16Z" fill="#9c7964"/><path d="M22 24v-8m13 8v-8m13 8v-8m13 8v-8m13 8v-8m13 8v-8m13 8v-8M22 102v8m13-8v8m13-8v8m13-8v8m13-8v8m13-8v8m13-8v8" stroke="#bc9271" stroke-width="4"/>',
    pencilcase:'<rect x="9" y="35" width="104" height="63" rx="17" fill="#d99885"/><path d="M10 52h101" stroke="#876654" stroke-width="4"/><path d="M20 41v40m16-40v40m16-40v40m16-40v40m16-40v40m16-40v40" stroke="#f1c9b7" stroke-width="2"/><rect x="27" y="53" width="13" height="9" rx="3" fill="#f3d394"/><path d="m78 34 10-24 7 3-8 21" fill="#74988a"/><path d="m58 34 4-29 8 1-3 28" fill="#d6b651"/>',
    eraser:'<path d="m13 55 21-28h70L82 55v40H13Z" fill="#f2eee6"/><path d="M13 55h69v40H13Z" fill="#7f9aab"/><path d="m82 55 22-28v40L82 95Z" fill="#b4c8d0"/><path d="M62 55h20v40H62Z" fill="#f2eee6"/>'
  };
  return drawings[value]?`<svg class="object-picture" viewBox="0 0 120 120" aria-hidden="true">${drawings[value]}</svg>`:value;
}
