/* ===================== 운세 (fortune) — 사주 · 타로 =====================
   월드 '🔮 운세존'의 점술가 NPC를 탭하면 열리는 상담 흐름.
   ① 메뉴(사주/타로) → ② 사주 입력·풀이 / ③ 타로 카테고리·22장 중 3장 뽑기·풀이
   index.html 인라인 스크립트의 전역(shade/esc/toast/me)을 공유하는 classic script.

   [MX] 백엔드 구현 시 이 파일의 전송 계약(파일 내 각 [MX] 참고, ADR-012):
   - 풀이 요청은 실시간 입력이 아니므로 전부 REST (WS 아님, ADR-011 판별식)
   - POST /api/fortune/saju   {name,birthDate,hourBranch} → 사주 풀이 응답
   - POST /api/fortune/tarot  {category,cards:[n,n,n]}    → 3장 스프레드 풀이 응답
   - 아래 demoSaju()/demoTarot()는 서버 응답을 흉내 낸 POC 데모다.
     응답 스키마를 그대로 맞춰 두었으므로 연동 시 함수 호출만 fetch로 교체하면 된다.
   - 카드 뽑기(셔플·선택)는 클라 연출이고, 뽑힌 카드 번호만 서버로 보낸다.
     ※ 서버가 결과에 보상(칭호 등)을 걸게 되면 셔플도 서버 권위로 옮겨야 함(ADR-006 원칙) */
(function(){
  if(window.Fortune) return;

  const NPC_NAME='점술가 미르';

  /* ===================== 픽셀 아트 유틸 ===================== */
  /* buildChar()와 같은 격자→RLE 방식. 월드의 다른 캐릭터와 톤을 맞추기 위함 */
  function pixel(W,H,draw,outline){
    const g=Array.from({length:H},()=>Array(W).fill(null));
    const inb=(x,y)=>x>=0&&x<W&&y>=0&&y<H;
    const P=(x,y,c)=>{x=Math.round(x);y=Math.round(y);if(inb(x,y))g[y][x]=c;};
    const R=(x0,y0,x1,y1,c)=>{for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++)P(x,y,c);};
    const E=(cx,cy,rx,ry,c)=>{for(let y=Math.floor(cy-ry);y<=Math.ceil(cy+ry);y++)
      for(let x=Math.floor(cx-rx);x<=Math.ceil(cx+rx);x++){
        const dx=(x-cx)/rx,dy=(y-cy)/ry; if(dx*dx+dy*dy<=1)P(x,y,c); }};
    draw({P,R,E});
    if(outline){
      const out=[];
      for(let y=0;y<H;y++)for(let x=0;x<W;x++){ if(g[y][x]!=null)continue;
        if((inb(x-1,y)&&g[y][x-1]!=null)||(inb(x+1,y)&&g[y][x+1]!=null)
         ||(inb(x,y-1)&&g[y-1][x]!=null)||(inb(x,y+1)&&g[y+1][x]!=null)) out.push([x,y]); }
      out.forEach(([x,y])=>g[y][x]=outline);
    }
    let rects='';
    for(let y=0;y<H;y++){let x=0;while(x<W){const c=g[y][x];if(c==null){x++;continue;}
      let x2=x;while(x2+1<W&&g[y][x2+1]===c)x2++;
      rects+=`<rect x="${x}" y="${y}" width="${x2-x+1}" height="1" fill="${c}"/>`;x=x2+1;}}
    return `<svg viewBox="0 0 ${W} ${H}" shape-rendering="crispEdges">${rects}</svg>`;
  }

  // 정면을 보고 앉은 점술가 — 금발 롱헤어 · 빨간 물방울 두건 · 하늘색 드레스
  function npcSVG(){
    const hair='#ffc93a', hairD='#dd9a1c', hairL='#fff2ae';
    const band='#e5453f', bandD='#b32e29', bandL='#f4736c', dot='#fff3f0';
    const skin='#ffe0c4', skinD='#efba92';
    const dress='#66bce8', dressD='#3d8ec2', dressL='#a9dcf5', frill='#ffffff';
    const eye='#a3453f', dk='#3a2a38', wt='#ffffff', mo='#c47b72', line='#7a6470';
    const bl='rgba(255,120,135,.42)';
    return pixel(44,56,({P,R,E})=>{
      // 뒤로 크게 퍼진 금발 실루엣
      E(22,20,17,17,hairD); E(22,20,15.4,15.4,hair);
      R(5,20,10,46,hair);  R(4,22,5,44,hairD);
      R(34,20,39,44,hair); R(38,22,39,42,hairD);
      // 위로 솟은 큰 포니테일 + 반대쪽 머리 뭉치
      E(8,8,7,8,hairD);  E(8,8,5.6,6.6,hair);  E(6,5,2.6,1.5,hairL);
      E(37,13,5,6,hairD); E(37,13,3.6,4.6,hair);
      // 얼굴
      E(22,21,12,12,skin);
      // 두건(빨강 + 흰 물방울) — 오른쪽에 매듭
      R(9,7,35,13,band); R(9,7,35,7,bandL); R(9,13,35,13,bandD);
      E(37,11,3.4,3.2,band); E(37,10,3.2,2,bandL);      // 매듭
      R(37,13,39,18,band); R(39,14,39,18,bandD);        // 흘러내린 자락
      [[13,9],[20,8],[27,9],[16,11],[24,11],[31,11]]
        .forEach(([x,y])=>{P(x,y,dot);P(x+1,y,dot);P(x,y+1,dot);P(x+1,y+1,dot);});
      P(37,11,dot);P(38,16,dot);
      // 두건 아래 앞머리
      R(10,14,34,15,hair); R(10,15,15,18,hair); R(29,15,34,18,hair); R(12,16,32,16,hairD);
      // 눈썹
      P(14,18,line);P(15,17.6,line);P(16,17.4,line);P(17,17.7,line);
      P(27,17.7,line);P(28,17.4,line);P(29,17.6,line);P(30,18,line);
      // 눈
      const eyeAt=cx=>{
        R(cx-3,19,cx+3,19,line); P(cx-4,20,line); P(cx+4,20,line);
        E(cx,22,3.2,4,wt);
        E(cx,22.6,2.6,3.3,shade(eye,30));
        E(cx,23,2.0,2.6,eye);
        E(cx,23.6,1.0,1.3,dk);
        P(cx-1,21,wt); P(cx-2,21,wt); P(cx+1,25,'rgba(255,255,255,.8)');
      };
      eyeAt(16); eyeAt(28);
      // 코 · 입 · 볼터치
      P(22,26,skinD);
      P(20,28,mo);P(21,29,mo);P(22,29,mo);P(23,29,mo);P(24,28,mo);
      R(12,25,14,26,bl); R(30,25,32,26,bl);
      // 목
      R(19,31,25,34,skinD);
      // 드레스 + 프릴
      R(15,34,29,38,dress); R(16,34,28,35,dressL);
      R(13,38,31,47,dress); R(11,45,33,50,dress);
      R(13,38,14,47,dressD); R(30,38,31,47,dressD); R(11,49,33,50,dressD);
      R(10,50,34,52,frill);
      R(16,34,28,36,frill); R(17,36,27,36,'#e2eff9');
      // 팔 — 왼팔은 턱을 괴고, 오른팔은 테이블 쪽으로 내린 포즈
      R(10,38,13,42,dress); R(10,38,11,42,dressD);   // 왼쪽 소매
      R(12,33,15,39,skin);  R(12,33,12,39,skinD);    // 위로 올린 팔뚝
      E(17,31,3.2,2.8,skin); E(17,30,3,1.4,'#fff0dd'); // 턱을 괸 손
      R(30,38,33,43,dress); R(32,38,33,43,dressD);   // 오른쪽 소매
      R(31,43,34,49,skin);  R(34,44,34,49,skinD);    // 내린 팔뚝
      E(33,50,2.8,2.6,skin);
      // 어깨 앞으로 흘러내린 머리
      R(5,30,9,48,hair); R(4,32,5,46,hairD); R(35,30,39,44,hair);
      E(7,34,2,4,hairL);
    },'#473a47');
  }

  // 1인용 원형 테이블 + 수정구 (앵커: bottom-center)
  function tableSVG(){
    return `<svg width="96" height="80" viewBox="0 0 96 80">
      <defs><radialGradient id="ftOrb" cx="34%" cy="28%" r="72%">
        <stop offset="0" stop-color="#f2c4ff"/><stop offset="45%" stop-color="#b04ee0"/>
        <stop offset="100%" stop-color="#54187e"/></radialGradient></defs>
      <ellipse cx="48" cy="75" rx="33" ry="5" fill="rgba(0,0,0,.2)"/>
      <path d="M28 60 q-5 8 -7 14" stroke="#8a5a34" stroke-width="4" fill="none" stroke-linecap="round"/>
      <path d="M68 60 q5 8 7 14" stroke="#8a5a34" stroke-width="4" fill="none" stroke-linecap="round"/>
      <path d="M48 60 v14" stroke="#8a5a34" stroke-width="5" stroke-linecap="round"/>
      <path d="M10 40 C10 62, 22 68, 48 68 C74 68, 86 62, 86 40 Z" fill="#eec9da"/>
      <ellipse cx="48" cy="40" rx="38" ry="13" fill="#f7dbe8"/>
      <ellipse cx="48" cy="38" rx="38" ry="13" fill="#fff4f9"/>
      <g class="orb">
        <ellipse cx="48" cy="36" rx="12" ry="4" fill="rgba(160,90,220,.35)"/>
        <path d="M39 35 h18 l-4 -7 h-10 z" fill="#e0a72a"/>
        <path d="M39 35 h18 l-1 2 h-16 z" fill="#b8821a"/>
        <circle cx="48" cy="19" r="12" fill="url(#ftOrb)"/>
        <circle cx="44" cy="15" r="3.4" fill="rgba(255,255,255,.68)"/>
        <circle cx="52" cy="24" r="1.6" fill="rgba(255,255,255,.35)"/>
      </g>
    </svg>`;
  }

  // 월드 지면에 얹을 마크업 (buildGround에서 호출)
  function groundHTML(f){
    return `<div class="fteller" id="fteller" style="left:${f.x}px;top:${f.y}px">
        <div class="ftag">🔮 ${NPC_NAME}</div>
        <div class="fbub">탭해서 운세 보기</div>
        <div class="fbox">${npcSVG()}</div>
      </div>
      <div class="ftable" style="left:${f.tx}px;top:${f.ty}px">${tableSVG()}</div>`;
  }

  /* ===================== 결정론적 데모 시드 ===================== */
  /* [MX] 서버 연동 후 삭제 — 풀이 선택은 서버가 한다.
     같은 입력이면 항상 같은 결과가 나오도록 FNV-1a 해시로 풀에서 고른다 */
  function hash(s){
    let h=0x811c9dc5;
    for(let i=0;i<s.length;i++){ h^=s.charCodeAt(i); h=Math.imul(h,0x01000193); }
    return h>>>0;
  }
  const pickBy=(arr,h)=>arr[h%arr.length];
  // 받침 유무에 따른 조사
  function josa(s,withJong,noJong){
    const c=s.charCodeAt(s.length-1);
    if(c<0xac00||c>0xd7a3) return noJong;
    return ((c-0xac00)%28)?withJong:noJong;
  }

  /* ===================== 공용 UI ===================== */
  function modal(inner){
    const bg=document.createElement('div'); bg.className='modalbg ft-bg';
    bg.innerHTML=`<div class="modal">${inner}</div>`;
    document.body.appendChild(bg);
    bg.onclick=e=>{if(e.target===bg)bg.remove();};
    return bg;
  }
  function overlay(inner){
    const ov=document.createElement('div'); ov.className='ft-ov';
    ov.innerHTML=inner;
    document.body.appendChild(ov);
    return ov;
  }
  const vib=ms=>{try{navigator.vibrate&&navigator.vibrate(ms);}catch(e){}};

  /* ===================== ① 상담 메뉴 ===================== */
  function open(){
    const bg=modal(`
      <div class="mhead">🔮 ${NPC_NAME}<button class="x" id="ftX">✕</button></div>
      <div class="ft-say">어떤 것을 보고 싶니?</div>
      <div class="gm-pick">
        <button class="gm-card" id="ftSaju"><span class="gm-ic">📜</span>사주<small>타고난 기운 풀이</small></button>
        <button class="gm-card" id="ftTarot"><span class="gm-ic">🃏</span>타로<small>메이저 22장 · 3장 뽑기</small></button>
      </div>
      <div class="gm-note">POC 데모 — 풀이는 아직 서버가 아닌 로컬에서 나와요</div>`);
    const close=()=>bg.remove();
    bg.querySelector('#ftX').onclick=close;
    bg.querySelector('#ftSaju').onclick=()=>{close();openSaju();};
    bg.querySelector('#ftTarot').onclick=()=>{close();openTarotCats();};
  }

  /* ===================== ② 사주 ===================== */
  const GAN=['갑','을','병','정','무','기','경','신','임','계'];
  const JI =['자','축','인','묘','진','사','오','미','신','유','술','해'];
  const GAN_EL=['목','목','화','화','토','토','금','금','수','수'];
  const JI_EL =['수','토','목','목','토','화','화','토','금','금','토','수'];
  const EL_C={목:'#4caf7d',화:'#ff6b6b',토:'#d3a04a',금:'#b9c2d0',수:'#5aa6ff'};
  const ELS=['목','화','토','금','수'];
  // 태어난 시간 = 12지지 (+ 시간모름)
  const HOURS=[
    {k:'자',n:'자시 · 23:30~01:30'},{k:'축',n:'축시 · 01:30~03:30'},
    {k:'인',n:'인시 · 03:30~05:30'},{k:'묘',n:'묘시 · 05:30~07:30'},
    {k:'진',n:'진시 · 07:30~09:30'},{k:'사',n:'사시 · 09:30~11:30'},
    {k:'오',n:'오시 · 11:30~13:30'},{k:'미',n:'미시 · 13:30~15:30'},
    {k:'신',n:'신시 · 15:30~17:30'},{k:'유',n:'유시 · 17:30~19:30'},
    {k:'술',n:'술시 · 19:30~21:30'},{k:'해',n:'해시 · 21:30~23:30'},
  ];
  const GAN_DESC={
    '갑':'곧게 뻗는 큰 나무 — 원칙이 분명하고 앞장서는 자리를 두려워하지 않아요.',
    '을':'유연한 덩굴 — 부드럽게 감싸면서도 결국 원하는 곳까지 닿는 끈기가 있어요.',
    '병':'한낮의 태양 — 주변을 환하게 만들고, 감정을 숨기지 못하는 솔직함이 매력이에요.',
    '정':'등불의 불꽃 — 조용하지만 오래 타오르고, 곁의 사람을 세심하게 챙겨요.',
    '무':'너른 산 — 웬만한 일에는 흔들리지 않아 사람들이 기대러 오는 자리예요.',
    '기':'기름진 밭 — 남을 길러내는 데 재능이 있고, 실속을 야무지게 챙겨요.',
    '경':'벼려진 쇠 — 결단이 빠르고 승부처에 강하지만, 말이 날카로워질 때가 있어요.',
    '신':'세공된 보석 — 감각이 예민하고 완성도에 집착하는 장인 기질이 있어요.',
    '임':'큰 물 — 품이 넓어 사람을 모으고, 흐름을 읽는 눈이 좋아요.',
    '계':'이슬비 — 조용히 스며들어 상대의 마음을 먼저 알아채요.',
  };
  const P_TOTAL=[
    '올해는 벌여 놓은 일이 하나씩 자리를 찾아가는 해예요. 급하게 결론 내지 않아도 흐름이 알아서 정리해 줍니다.',
    '묵혀 둔 인연과 기회가 다시 문을 두드리는 시기예요. 지난 봄에 접어 둔 일을 다시 펼쳐 보세요.',
    '바깥보다 안이 단단해지는 해예요. 눈에 띄는 성과보다 실력이 먼저 쌓입니다.',
    '움직일수록 길이 열리는 해예요. 익숙한 자리를 한 번 벗어나 보는 게 전환점이 됩니다.',
    '주변이 시끄러워도 중심만 지키면 되는 해예요. 남의 속도에 말려들지 않는 게 최고의 전략입니다.',
    '노력이 뒤늦게 몰려서 돌아오는 해예요. 상반기의 답답함은 하반기의 이자로 붙습니다.',
  ];
  const P_MONEY=[
    '큰 한 방보다 새는 곳을 막는 쪽이 훨씬 빠릅니다. 고정비 한 줄만 줄여도 체감이 달라져요.',
    '사람을 통해 재물이 들어오는 구조예요. 오래 연락 못 한 사람에게 먼저 안부를 건네 보세요.',
    '내 기술이 곧 재물입니다. 배워 두면 반드시 돈으로 환산되는 해예요.',
    '보증·공동명의 같은 얽히는 돈은 피하세요. 혼자 결정할 수 있는 크기로 굴리는 게 좋습니다.',
    '들어오는 자리보다 나가는 자리가 눈에 띄는 시기예요. 지출 시점을 한 달만 미뤄도 이득입니다.',
  ];
  const P_WORK=[
    '실무보다 조율하는 자리에서 빛나요. 중간에서 말을 옮기는 역할이 곧 평판이 됩니다.',
    '한 우물이 유리한 해예요. 새 판을 벌이기보다 하던 일의 완성도를 올리세요.',
    '윗사람 인복이 좋은 시기예요. 도와 달라는 말을 먼저 꺼내는 쪽이 이득입니다.',
    '경쟁 구도에서 오히려 힘이 나는 배치예요. 피하지 말고 정면에서 겨루는 게 낫습니다.',
    '이동수가 있습니다. 자리·팀·도시 중 하나가 바뀌면서 흐름이 트여요.',
  ];
  const P_LOVE=[
    '먼저 다가가는 쪽이 유리해요. 기다리는 자세로는 반 발짝이 계속 좁혀지지 않습니다.',
    '오래 알던 사이에서 인연이 열립니다. 새 사람을 찾기보다 주변을 다시 보세요.',
    '말수를 줄이고 듣는 시간을 늘리면 관계가 깊어져요. 설명하려는 마음을 잠시 내려놓으세요.',
    '봄과 가을에 인연의 문이 크게 열립니다. 그 시기에 약속을 미루지 마세요.',
    '혼자 있는 시간이 오히려 매력을 채우는 시기예요. 급하게 채우려 하지 않아도 됩니다.',
  ];
  const P_CARE=[
    '어깨와 목에 기운이 몰려요. 오래 앉아 있는 날일수록 의식적으로 일어나세요.',
    '잠을 줄여서 만든 시간은 결국 이자까지 붙여 되갚게 됩니다. 취침 시각을 먼저 지키세요.',
    '소화기 쪽이 예민한 배치예요. 늦은 시간 식사를 줄이는 것만으로 컨디션이 달라져요.',
    '말로 다 풀지 못한 감정이 몸으로 갑니다. 마음을 털어놓을 창구 하나는 만들어 두세요.',
    '환절기에 잔병이 붙기 쉬워요. 무리한 일정은 계절이 바뀌는 주에 몰지 마세요.',
  ];
  const P_TIP=[
    '올해의 열쇠말은 「기다림」 — 반 박자 늦게 답하는 습관이 당신을 지켜 줍니다.',
    '올해의 열쇠말은 「정리」 — 관계든 물건이든 비운 만큼 새것이 들어옵니다.',
    '올해의 열쇠말은 「기록」 — 남긴 만큼 나중에 증거가 되고 기회가 됩니다.',
    '올해의 열쇠말은 「연결」 — 혼자 하려 들수록 늦어지는 배치예요.',
    '올해의 열쇠말은 「담백함」 — 설명을 줄일수록 신뢰가 붙습니다.',
    '올해의 열쇠말은 「복구」 — 끊어진 것을 다시 잇는 데서 운이 열립니다.',
  ];

  function openSaju(){
    const bg=modal(`
      <div class="mhead">📜 사주 보기<button class="x" id="ftX">✕</button></div>
      <div class="ft-say">이름과 태어난 날, 그리고 시간을 알려 줄래?</div>
      <h2>이름</h2>
      <input class="field" id="sjName" maxlength="10" placeholder="이름을 알려 주세요"
        value="${esc((typeof me!=='undefined'&&me&&me.nick)||'')}">
      <h2>생년월일</h2>
      <input class="field ft-date" id="sjBirth" type="date" min="1900-01-01" max="2030-12-31">
      <h2>태어난 시간</h2>
      <select class="field ft-sel" id="sjHour">
        ${HOURS.map(h=>`<option value="${h.k}">${h.n}</option>`).join('')}
        <option value="">시간모름</option>
      </select>
      <div class="ft-hint">시간을 모르면 「시간모름」을 골라도 괜찮아요. 시주(時柱)만 비워 둡니다.</div>
      <button class="cta" id="sjGo">사주 보기 📜</button>`);
    const close=()=>bg.remove();
    bg.querySelector('#ftX').onclick=close;
    bg.querySelector('#sjHour').value='';
    bg.querySelector('#sjGo').onclick=()=>{
      const name=bg.querySelector('#sjName').value.trim();
      const birth=bg.querySelector('#sjBirth').value;
      const hour=bg.querySelector('#sjHour').value;
      if(!name){toast('이름을 알려 주세요');return;}
      if(!birth){toast('생년월일을 골라 주세요');return;}
      close();
      /* [MX] 백엔드 구현 시: 아래 demoSaju()를
         const r=await fetch('/api/fortune/saju',{method:'POST',headers:{'Content-Type':'application/json'},
           body:JSON.stringify({name,birthDate:birth,hourBranch:hour||null})}).then(r=>r.json());
         로 교체 (응답 스키마는 demoSaju() 반환값과 동일 — ADR-012) */
      showSaju(demoSaju({name,birthDate:birth,hourBranch:hour||null}));
    };
  }

  // 사주 8자 구성. 년주·월주·시주는 실제 간지 규칙, 일주는 데모(만세력은 서버 몫)
  function demoSaju(input){
    const [y,m,d]=input.birthDate.split('-').map(Number);
    const h=hash(`${input.name}|${input.birthDate}|${input.hourBranch||'-'}`);
    const gi=((y-4)%10+10)%10, zi=((y-4)%12+12)%12;
    const year={g:GAN[gi],j:JI[zi]};
    const mj=m%12;                                  // 12월=자월, 1월=축월, 2월=인월
    const mg=(((gi%5)*2+2)+((mj-2+12)%12))%10;      // 갑기년 → 병인월
    const month={g:GAN[mg],j:JI[mj]};
    const dgi=h%10, dji=(h>>>5)%12;                 // [MX] 데모값 — 실제 일주는 서버 만세력
    const day={g:GAN[dgi],j:JI[dji]};
    let hour=null;
    if(input.hourBranch){
      const hj=JI.indexOf(input.hourBranch);
      hour={g:GAN[(((dgi%5)*2)+hj)%10],j:input.hourBranch};   // 갑기일 → 갑자시
    }
    const pillars=[hour,day,month,year];
    // 오행 분포
    const el={목:0,화:0,토:0,금:0,수:0};
    pillars.forEach(p=>{ if(!p)return; el[GAN_EL[GAN.indexOf(p.g)]]++; el[JI_EL[JI.indexOf(p.j)]]++; });
    const total=Object.values(el).reduce((a,b)=>a+b,0)||1;
    const strong=ELS.slice().sort((a,b)=>el[b]-el[a])[0];
    const weak=ELS.slice().sort((a,b)=>el[a]-el[b])[0];
    return {
      name:input.name, birthDate:input.birthDate, hourBranch:input.hourBranch,
      pillars:{hour,day,month,year},
      elements:el, elementTotal:total, strongest:strong, weakest:weak,
      dayMaster:day.g, dayMasterDesc:GAN_DESC[day.g],
      sections:[
        {t:'총운',        ic:'🌕', body:pickBy(P_TOTAL,h)},
        {t:'재물운',      ic:'💰', body:pickBy(P_MONEY,h>>>3)},
        {t:'직업·커리어', ic:'💼', body:pickBy(P_WORK ,h>>>7)},
        {t:'인연운',      ic:'💗', body:pickBy(P_LOVE ,h>>>11)},
        {t:'건강',        ic:'🌿', body:pickBy(P_CARE ,h>>>15)},
      ],
      advice:pickBy(P_TIP,h>>>19),
      demo:true,
    };
  }

  function showSaju(r){
    const cell=(p,label)=>p
      ? `<div class="sj-col"><div class="sj-lab">${label}</div>
           <div class="sj-ch" style="--c:${EL_C[GAN_EL[GAN.indexOf(p.g)]]}">${p.g}</div>
           <div class="sj-ch" style="--c:${EL_C[JI_EL[JI.indexOf(p.j)]]}">${p.j}</div></div>`
      : `<div class="sj-col dim"><div class="sj-lab">${label}</div>
           <div class="sj-ch">—</div><div class="sj-ch">—</div></div>`;
    const bars=ELS.map(e=>`<div class="sj-bar">
        <span class="n">${e}</span>
        <span class="t"><i style="width:${Math.round(r.elements[e]/r.elementTotal*100)}%;background:${EL_C[e]}"></i></span>
        <span class="v">${r.elements[e]}</span></div>`).join('');
    const ov=overlay(`
      <div class="ft-top">
        <div class="ft-title">📜 ${esc(r.name)} 님의 사주</div>
        <button class="btn ft-x" id="sjX">✕ 닫기</button>
      </div>
      <div class="ft-scroll">
        <div class="ft-panel">
          <div class="ft-sub">${r.birthDate} · ${r.hourBranch?r.hourBranch+'시':'시간모름'}</div>
          <div class="sj-grid">${cell(r.pillars.hour,'시주')}${cell(r.pillars.day,'일주')}${cell(r.pillars.month,'월주')}${cell(r.pillars.year,'년주')}</div>
          <div class="ft-note">※ POC 데모 — 절기·진태양시 보정과 일주 계산은 서버 연동 시 적용됩니다</div>
        </div>
        <div class="ft-panel">
          <div class="ft-h">🌱 일간 ${r.dayMaster} — 타고난 결</div>
          <p>${r.dayMasterDesc}</p>
          <div class="sj-bars">${bars}</div>
          <p class="ft-dim">기운은 <b style="color:${EL_C[r.strongest]}">${r.strongest}</b>이 가장 두텁고 <b style="color:${EL_C[r.weakest]}">${r.weakest}</b>이 가장 옅어요.
            ${r.weakest} 기운을 채워 주는 습관 하나를 곁에 두면 균형이 잡힙니다.</p>
        </div>
        ${r.sections.map(s=>`<div class="ft-panel"><div class="ft-h">${s.ic} ${s.t}</div><p>${s.body}</p></div>`).join('')}
        <div class="ft-panel key"><div class="ft-h">🔑 미르의 한마디</div><p>${r.advice}</p></div>
        <div class="ft-act">
          <button class="ghost" id="sjAgain">다시 보기</button>
          <button class="cta" id="sjDone">고마워요 🔮</button>
        </div>
      </div>`);
    const close=()=>ov.remove();
    ov.querySelector('#sjX').onclick=close;
    ov.querySelector('#sjDone').onclick=close;
    ov.querySelector('#sjAgain').onclick=()=>{close();openSaju();};
  }

  /* ===================== ③ 타로 (메이저 아르카나 22장) ===================== */
  const ROMAN=['0','I','II','III','IV','V','VI','VII','VIII','IX','X',
               'XI','XII','XIII','XIV','XV','XVI','XVII','XVIII','XIX','XX','XXI'];
  const CATS=[
    {k:'love',   ic:'💗', n:'연애운',       s:'마음과 인연의 흐름'},
    {k:'money',  ic:'💰', n:'금전운',       s:'들어오고 나가는 재물'},
    {k:'work',   ic:'💼', n:'직장·커리어운', s:'일과 자리의 방향'},
    {k:'health', ic:'🌿', n:'건강운',       s:'몸과 마음의 컨디션'},
  ];
  const CATBY={}; CATS.forEach(c=>CATBY[c.k]=c);
  const MAJOR=[
    {n:0, ko:'바보', en:'The Fool', ic:'🎒', kw:'겁 없는 시작', m:{
      love:'계산 없이 뛰어드는 설렘', money:'모험이 필요한 자리', work:'백지에서 다시 그리는 판', health:'가벼워진 몸과 마음'}},
    {n:1, ko:'마법사', en:'The Magician', ic:'🪄', kw:'가진 것을 쓰는 힘', m:{
      love:'먼저 손 내밀 타이밍', money:'수완이 통하는 시기', work:'실력이 눈에 띄는 무대', health:'회복을 스스로 만드는 힘'}},
    {n:2, ko:'여사제', en:'The High Priestess', ic:'🌙', kw:'말하지 않은 진심', m:{
      love:'아직 꺼내지 않은 마음', money:'드러나지 않은 정보', work:'조용히 쌓이는 신뢰', health:'몸이 보내는 작은 신호'}},
    {n:3, ko:'여황제', en:'The Empress', ic:'🌷', kw:'넉넉한 품', m:{
      love:'풍요롭게 채워지는 관계', money:'불어나는 결실', work:'사람을 길러 내는 자리', health:'잘 먹고 잘 쉬는 회복'}},
    {n:4, ko:'황제', en:'The Emperor', ic:'🏛', kw:'세워야 할 기준', m:{
      love:'책임을 지는 사랑', money:'원칙 있는 관리', work:'주도권을 잡는 자리', health:'규칙적인 생활의 힘'}},
    {n:5, ko:'교황', en:'The Hierophant', ic:'📿', kw:'배움과 조언', m:{
      love:'주변이 인정하는 인연', money:'전문가에게 묻는 편이 나은 돈', work:'선배·멘토의 도움', health:'검증된 방법으로의 관리'}},
    {n:6, ko:'연인', en:'The Lovers', ic:'💞', kw:'선택의 갈림길', m:{
      love:'마음이 통하는 만남', money:'둘 중 하나를 골라야 할 지출', work:'함께할 사람을 고르는 일', health:'생활 습관의 선택'}},
    {n:7, ko:'전차', en:'The Chariot', ic:'🏇', kw:'밀어붙이는 추진력', m:{
      love:'적극적으로 나아가는 관계', money:'속도가 붙는 수입', work:'경쟁에서 앞서는 흐름', health:'움직일수록 좋아지는 몸'}},
    {n:8, ko:'힘', en:'Strength', ic:'🦁', kw:'부드러운 용기', m:{
      love:'참고 기다려 얻는 신뢰', money:'조급함을 다스릴 자리', work:'감정을 누르고 버티는 힘', health:'천천히 회복되는 체력'}},
    {n:9, ko:'은둔자', en:'The Hermit', ic:'🏮', kw:'혼자 있는 시간', m:{
      love:'거리를 두고 보는 마음', money:'덜 쓰고 지키는 시기', work:'깊이 파고드는 몰입', health:'쉼이 곧 처방인 상태'}},
    {n:10, ko:'운명의 수레바퀴', en:'Wheel of Fortune', ic:'🎡', kw:'돌아오는 흐름', m:{
      love:'우연처럼 찾아오는 인연', money:'흐름이 바뀌는 전환점', work:'예상 밖의 기회', health:'주기를 타는 컨디션'}},
    {n:11, ko:'정의', en:'Justice', ic:'⚖️', kw:'공정한 결산', m:{
      love:'솔직해야 풀리는 관계', money:'계약과 정산의 문제', work:'평가가 제자리를 찾는 때', health:'균형이 무너진 부분'}},
    {n:12, ko:'매달린 사람', en:'The Hanged Man', ic:'🙃', kw:'멈춰 선 시간', m:{
      love:'답을 기다려야 하는 마음', money:'묶여 있는 돈', work:'잠시 멈춰 다시 보는 일', health:'무리하면 탈 나는 시기'}},
    {n:13, ko:'죽음', en:'Death', ic:'🦋', kw:'끝에서 시작되는 것', m:{
      love:'정리되고 새로 시작되는 관계', money:'구조를 바꿔야 할 지출', work:'매듭짓고 넘어가는 단계', health:'습관을 갈아엎을 때'}},
    {n:14, ko:'절제', en:'Temperance', ic:'🍷', kw:'알맞은 배합', m:{
      love:'서로 속도를 맞추는 사이', money:'덜어 내며 맞추는 균형', work:'조율이 성과가 되는 일', health:'과하지 않게 지키는 컨디션'}},
    {n:15, ko:'악마', en:'The Devil', ic:'😈', kw:'끊기 어려운 것', m:{
      love:'놓지 못하는 집착', money:'습관처럼 새는 돈', work:'익숙함에 묶인 자리', health:'끊어야 할 나쁜 습관'}},
    {n:16, ko:'탑', en:'The Tower', ic:'🗼', kw:'갑작스러운 흔들림', m:{
      love:'예고 없이 흔들리는 마음', money:'예상 못 한 목돈 지출', work:'판이 뒤집히는 사건', health:'갑자기 찾아오는 신호'}},
    {n:17, ko:'별', en:'The Star', ic:'⭐', kw:'다시 켜지는 희망', m:{
      love:'조용히 되살아나는 마음', money:'서서히 회복되는 흐름', work:'오래 품은 목표의 실마리', health:'회복으로 향하는 몸'}},
    {n:18, ko:'달', en:'The Moon', ic:'🌕', kw:'흐릿한 안개', m:{
      love:'확신이 서지 않는 관계', money:'불투명한 조건', work:'정보가 부족한 판단', health:'예민해진 마음과 수면'}},
    {n:19, ko:'태양', en:'The Sun', ic:'☀️', kw:'환하게 드러나는 성과', m:{
      love:'숨김없이 밝은 사이', money:'뚜렷하게 늘어나는 수입', work:'인정받는 결과', health:'또렷해지는 활력'}},
    {n:20, ko:'심판', en:'Judgement', ic:'📯', kw:'되돌아온 결론', m:{
      love:'다시 마주하게 되는 인연', money:'과거의 결정이 정산되는 때', work:'평가와 재도전의 자리', health:'묵은 문제를 정리할 기회'}},
    {n:21, ko:'세계', en:'The World', ic:'🌍', kw:'완성과 다음 문', m:{
      love:'한 단계 정리되는 관계', money:'목표에 닿는 결실', work:'한 챕터를 끝내는 성취', health:'제자리를 찾은 몸'}},
  ];
  const POS=[
    {k:'past', lab:'과거', ic:'⏪', lead:'지나온 자리에는'},
    {k:'now',  lab:'현재', ic:'🎯', lead:'지금 이 순간에는'},
    {k:'next', lab:'미래', ic:'⏩', lead:'앞으로 다가올 흐름에는'},
  ];
  const T_SUM={
    love:[
      '지금 필요한 건 더 많은 말이 아니라, 한 번의 솔직한 표현이에요.',
      '상대를 바꾸려는 마음을 내려놓으면 관계가 훨씬 가벼워집니다.',
      '기다림이 손해처럼 느껴져도, 이 관계에서는 시간이 당신 편이에요.',
      '가까운 곳에 답이 있어요. 새 사람을 찾기 전에 주변을 한 번 더 보세요.',
    ],
    money:[
      '버는 방법을 늘리기보다, 새는 곳을 막는 쪽이 이번 흐름에는 훨씬 빠릅니다.',
      '큰 결정은 한 달만 미뤄 두세요. 조건이 더 좋아진 채로 다시 돌아옵니다.',
      '혼자 판단하기 어려운 돈이라면, 아는 사람보다 전문가에게 물어야 할 자리예요.',
      '들어오는 흐름은 분명 있습니다. 다만 한 번에 오지 않고 나눠서 옵니다.',
    ],
    work: [
      '실력보다 타이밍의 문제였어요. 지금 판이 당신 쪽으로 돌아오고 있습니다.',
      '벌여 놓은 것부터 매듭지으세요. 새 판은 그다음에 훨씬 좋은 조건으로 옵니다.',
      '혼자 끌고 가려는 순간 늦어집니다. 도와 달라는 말이 이번 흐름의 열쇠예요.',
      '평가는 결국 제자리를 찾습니다. 지금 기록을 남겨 두는 게 나중의 근거가 돼요.',
    ],
    health:[
      '몸보다 마음이 먼저 지쳤어요. 쉬는 시간을 일정처럼 고정해 두세요.',
      '잠의 시작 시각 하나만 지켜도 이번 흐름의 절반은 해결됩니다.',
      '작은 신호를 미루지 마세요. 지금은 크게 키우지 않는 것이 최선의 관리예요.',
      '회복은 이미 시작됐어요. 조급하게 확인하려 들지만 않으면 됩니다.',
    ],
  };
  const T_LUCK=['🌿 초록','💧 파랑','🔥 빨강','🌕 노랑','🤍 하양','💜 보라'];

  /* ---- 카드 아트 ----
     앞면은 라이더-웨이트 실사 이미지(assets/tarot/NN.jpg)를 쓴다. 파일명 NN = 카드 번호 = MAJOR 인덱스.
     원본 비율 ≈ 58:100이라 카드 박스도 전부 58/100으로 맞췄다(뒷면 SVG 포함). */
  const CARD_SRC=n=>`assets/tarot/${String(n).padStart(2,'0')}.jpg`;

  function backSVG(){
    let pet='';
    for(let i=0;i<8;i++) pet+=`<ellipse cx="29" cy="36" rx="4.2" ry="9" transform="rotate(${i*45} 29 50)"/>`;
    let ray='';
    for(let i=0;i<12;i++) ray+=`<line x1="29" y1="28" x2="29" y2="32" transform="rotate(${i*30} 29 50)"/>`;
    return `<svg viewBox="0 0 58 100" class="ft-svg">
      <rect width="58" height="100" rx="5" fill="#f2f0f8"/>
      <rect x="2.6" y="2.6" width="52.8" height="94.8" rx="4" fill="none" stroke="#b6aed4" stroke-width="1.1"/>
      <g fill="none" stroke="#c6bee0" stroke-width=".9">
        <circle cx="29" cy="50" r="18"/><circle cx="29" cy="50" r="12.5"/><circle cx="29" cy="50" r="6"/>
        ${pet}${ray}
      </g>
      <circle cx="29" cy="50" r="2.4" fill="#b6aed4"/>
      <circle cx="29" cy="15" r="2" fill="#c6bee0"/><circle cx="29" cy="85" r="2" fill="#c6bee0"/>
    </svg>`;
  }
  // 카드 앞면 — 이미지. 오프라인 첫 방문 등으로 못 받으면 faceSVG()로 대체한다(bindFaces)
  function faceHTML(c){
    return `<img class="ft-img" src="${CARD_SRC(c.n)}" data-n="${c.n}" alt="${esc(c.ko)} (${esc(c.en)})" decoding="async">`;
  }
  function bindFaces(root){
    root.querySelectorAll('.ft-img').forEach(im=>{
      im.onerror=()=>{ im.outerHTML=faceSVG(MAJOR[+im.dataset.n]); };
    });
  }
  // 이미지 폴백 앞면 (텍스트 카드)
  function faceSVG(c){
    // 긴 이름만 자간을 눌러 담는다 (짧은 이름까지 늘리면 글자가 벌어져 보인다)
    const fit=c.ko.length>=7?' textLength="48" lengthAdjust="spacingAndGlyphs"':'';
    const enSize=c.en.length>=16?4.4:5;
    return `<svg viewBox="0 0 58 100" class="ft-svg">
      <rect width="58" height="100" rx="5" fill="#fdf7ec"/>
      <rect x="2.6" y="2.6" width="52.8" height="94.8" rx="4" fill="none" stroke="#c9a44e" stroke-width="1.1"/>
      <line x1="8" y1="19" x2="50" y2="19" stroke="#e0cfa4" stroke-width=".8"/>
      <line x1="8" y1="69" x2="50" y2="69" stroke="#e0cfa4" stroke-width=".8"/>
      <text x="29" y="15" text-anchor="middle" font-size="7.5" fill="#8a6a2a" font-family="serif">${ROMAN[c.n]}</text>
      <text x="29" y="52" text-anchor="middle" font-size="24">${c.ic}</text>
      <text x="29" y="81" text-anchor="middle" font-size="8" fill="#4a3a1e"${fit}>${c.ko}</text>
      <text x="29" y="91" text-anchor="middle" font-size="${enSize}" fill="#a1906c">${c.en}</text>
    </svg>`;
  }
  // 뒤집기 전에 3장을 미리 받아 둔다 (뒤집었더니 빈 칸인 상황 방지). 실패해도 그대로 진행 — faceHTML이 폴백을 갖는다
  function preloadCards(nos){
    return Promise.all(nos.map(n=>new Promise(res=>{
      const im=new Image(); im.onload=im.onerror=()=>res(); im.src=CARD_SRC(n);
    })));
  }

  /* ---- 카테고리 선택 ---- */
  function openTarotCats(){
    const bg=modal(`
      <div class="mhead">🃏 타로<button class="x" id="ftX">✕</button></div>
      <div class="ft-say">무슨 운을 보고 싶어?</div>
      <div class="ft-cats">
        ${CATS.map(c=>`<button class="ft-cat" data-k="${c.k}"><span class="ic">${c.ic}</span>${c.n}<small>${c.s}</small></button>`).join('')}
      </div>
      <div class="gm-note">메이저 아르카나 22장 중 3장을 뽑아요</div>`);
    const close=()=>bg.remove();
    bg.querySelector('#ftX').onclick=close;
    bg.querySelectorAll('.ft-cat').forEach(el=>el.onclick=()=>{close();openTarotPick(el.dataset.k);});
  }

  /* ---- 카드 선택 화면 ---- */
  function openTarotPick(catKey){
    const cat=CATBY[catKey];
    let deck=shuffle(MAJOR.slice());   // [MX] 서버 권위 전환 시 서버가 셔플 결과를 내려 줌
    let picked=[], shuffled=false, busy=false;
    const ov=overlay(`
      <div class="ft-top">
        <button class="btn ft-back" id="trBack">‹</button>
        <div class="ft-title">${cat.ic} ${cat.n}</div>
        <button class="btn ft-x" id="trX">✕</button>
      </div>
      <div class="tr-guide">
        <div class="tr-say">${cat.n}${josa(cat.n,'을','를')} 보시는군요. 신중하게 카드 <b>3장</b>을 선택하세요.</div>
        <div class="tr-count"><span id="trCnt">0</span> / 3 선택</div>
      </div>
      <div class="tr-wrap">
        <div class="tr-grid" id="trGrid"></div>
        <div class="tr-shufov" id="trShuf"><div class="tr-stack">
          ${[0,1,2,3,4].map(i=>`<div class="tr-sc" style="--i:${i}">${backSVG()}</div>`).join('')}
        </div><div class="tr-shufmsg">카드를 섞는 중…</div></div>
      </div>
      <div class="tr-foot">
        <button class="cta" id="trShufBtn">카드섞기</button>
        <div class="ft-note">카드섞기는 카드 선택 전 1번 가능해요</div>
      </div>`);
    const grid=ov.querySelector('#trGrid'), shufOv=ov.querySelector('#trShuf');
    const btnShuf=ov.querySelector('#trShufBtn'), cnt=ov.querySelector('#trCnt');
    const close=()=>ov.remove();
    ov.querySelector('#trX').onclick=close;
    ov.querySelector('#trBack').onclick=()=>{close();openTarotCats();};

    function paintGrid(){
      grid.innerHTML=deck.map((c,i)=>
        `<button class="tr-card" data-i="${i}" style="--i:${i}">${backSVG()}<span class="tr-num"></span></button>`).join('');
      grid.querySelectorAll('.tr-card').forEach(el=>el.onclick=()=>toggle(el));
    }
    function toggle(el){
      if(busy)return;
      const i=+el.dataset.i, at=picked.indexOf(i);
      if(at>=0){ picked.splice(at,1); }
      else{ if(picked.length>=3)return; picked.push(i); vib(12); }
      grid.querySelectorAll('.tr-card').forEach(c=>{
        const k=picked.indexOf(+c.dataset.i);
        c.classList.toggle('sel',k>=0);
        c.querySelector('.tr-num').textContent=k>=0?k+1:'';
      });
      cnt.textContent=picked.length;
      btnShuf.disabled=picked.length>0;
      if(picked.length===3){
        busy=true;
        const nos=picked.map(i=>deck[i].n);
        /* [MX] 백엔드 구현 시: 아래 demoTarot()를
           await fetch('/api/fortune/tarot',{method:'POST',headers:{'Content-Type':'application/json'},
             body:JSON.stringify({category:catKey,cards:nos})}).then(r=>r.json())
           로 교체 (응답 스키마는 demoTarot() 반환값과 동일 — ADR-012) */
        // 카드 이미지 로딩과 마무리 연출을 함께 기다린다 (둘 중 늦는 쪽 기준)
        Promise.all([preloadCards(nos), new Promise(res=>setTimeout(res,520))])
          .then(()=>{ close(); showTarot(demoTarot(catKey,nos)); });
      }
    }
    function runShuffle(then){
      busy=true; shufOv.classList.add('on'); grid.classList.add('hide');
      setTimeout(()=>{
        deck=shuffle(deck); paintGrid();
        shufOv.classList.remove('on'); grid.classList.remove('hide');
        busy=false; then&&then();
      },1000);
    }
    btnShuf.onclick=()=>{
      if(shuffled||busy||picked.length)return;
      shuffled=true; vib(20);
      runShuffle(()=>{ btnShuf.disabled=true; btnShuf.textContent='섞기 완료'; });
    };
    paintGrid();
    runShuffle();   // 진입 시 셔플 연출 후 펼치기
  }
  function shuffle(a){ for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];} return a; }

  // 서버 응답 형태의 데모 풀이 — 같은 (카테고리, 카드 3장)이면 항상 같은 결과
  function demoTarot(catKey,cardNos){
    const h=hash(catKey+'|'+cardNos.join(','));
    return {
      category:catKey,
      cards:cardNos.map((n,i)=>{
        const c=MAJOR[n];
        return {
          no:n, position:POS[i].k, name:c.ko, nameEn:c.en, keyword:c.kw,
          text:`${POS[i].lead} ${c.m[catKey]}${josa(c.m[catKey],'이라는','라는')} 기운이 놓여 있어요.`,
        };
      }),
      summary:pickBy(T_SUM[catKey],h),
      luckyColor:pickBy(T_LUCK,h>>>7),
      demo:true,
    };
  }

  function showTarot(r){
    const cat=CATBY[r.category];
    const ov=overlay(`
      <div class="ft-top">
        <div class="ft-title">${cat.ic} ${cat.n} 풀이</div>
        <button class="btn ft-x" id="trRX">✕ 닫기</button>
      </div>
      <div class="ft-scroll">
        <div class="tr-spread">
          ${r.cards.map((c,i)=>`
            <div class="tr-slot">
              <div class="tr-pos">${POS[i].ic} ${POS[i].lab}</div>
              <div class="tr-flip" data-i="${i}"><div class="tr-in">
                <div class="tr-face back">${backSVG()}</div>
                <div class="tr-face front">${faceHTML(MAJOR[c.no])}</div>
              </div></div>
            </div>`).join('')}
        </div>
        ${r.cards.map((c,i)=>`
          <div class="ft-panel">
            <div class="ft-h">${POS[i].ic} ${POS[i].lab} — ${c.name} <span class="tr-kw">${c.keyword}</span></div>
            <p>${c.text}</p>
          </div>`).join('')}
        <div class="ft-panel key">
          <div class="ft-h">🔮 미르의 풀이</div>
          <p>${r.summary}</p>
          <div class="tr-luck">오늘의 행운 색 · ${r.luckyColor}</div>
        </div>
        <div class="ft-note">※ POC 데모 — 실제 풀이는 서버 연동 시 대체됩니다</div>
        <div class="ft-act">
          <button class="ghost" id="trAgain">다시 뽑기</button>
          <button class="cta" id="trDone">고마워요 🔮</button>
        </div>
      </div>`);
    const close=()=>ov.remove();
    ov.querySelector('#trRX').onclick=close;
    ov.querySelector('#trDone').onclick=close;
    ov.querySelector('#trAgain').onclick=()=>{close();openTarotCats();};
    bindFaces(ov);
    // 3장을 순서대로 뒤집는다
    ov.querySelectorAll('.tr-flip').forEach((el,i)=>setTimeout(()=>{el.classList.add('on');vib(10);},260+i*280));
  }

  /* ===================== 스타일 ===================== */
  function css(){
    const s=document.createElement('style'); s.id='ft-css';
    s.textContent=`
    /* ---- 월드: 점술가 · 1인용 테이블 ---- */
    .fteller{position:absolute;transform:translate(-50%,-100%);width:66px;height:84px;cursor:pointer;z-index:2}
    .fteller .fbox{position:absolute;inset:0}
    .fteller .fbox svg{width:100%;height:100%;display:block;
      filter:drop-shadow(0 0 5px rgba(190,120,255,.55)) drop-shadow(0 0 12px rgba(150,80,220,.3))}
    .fteller:active .fbox{transform:scale(.95)}
    .fteller .ftag{position:absolute;bottom:88px;left:50%;transform:translateX(-50%);white-space:nowrap;
      font-family:var(--round);font-size:11px;color:#fff;background:rgba(74,32,110,.82);
      padding:2px 9px;border-radius:10px;box-shadow:0 2px 8px rgba(0,0,0,.35)}
    .fteller .fbub{position:absolute;bottom:108px;left:50%;transform:translateX(-50%) scale(.6);white-space:nowrap;
      font-family:var(--round);font-size:11px;color:#3a1a5a;background:#ffe9a8;padding:4px 11px;border-radius:12px;
      opacity:0;pointer-events:none;transition:.2s;box-shadow:0 3px 10px rgba(0,0,0,.35)}
    .fteller .fbub::after{content:'';position:absolute;left:50%;bottom:-5px;transform:translateX(-50%);
      border:5px solid transparent;border-top-color:#ffe9a8;border-bottom:0}
    .fteller.near .fbub{opacity:1;transform:translateX(-50%) scale(1);animation:ftBub 1.4s ease-in-out infinite}
    @keyframes ftBub{0%,100%{translate:0 0}50%{translate:0 -4px}}
    .ftable{position:absolute;transform:translate(-50%,-100%);cursor:pointer;z-index:2}
    .ftable svg{display:block;overflow:visible}
    .ftable .orb{animation:ftOrbGlow 2.6s ease-in-out infinite;transform-origin:48px 19px}
    @keyframes ftOrbGlow{0%,100%{filter:drop-shadow(0 0 3px rgba(200,110,255,.7))}
      50%{filter:drop-shadow(0 0 10px rgba(220,150,255,.95))}}

    /* ---- 공용 ---- */
    .ft-say{font-family:var(--round);font-size:15px;color:var(--ink);margin-top:14px;line-height:1.5}
    .ft-hint{font-family:var(--round);font-size:12px;color:var(--mut);margin-top:8px;line-height:1.5}
    .ft-sel{appearance:none;-webkit-appearance:none;cursor:pointer;
      background-image:linear-gradient(45deg,transparent 50%,#8b83a8 50%),linear-gradient(135deg,#8b83a8 50%,transparent 50%);
      background-position:calc(100% - 20px) 50%,calc(100% - 14px) 50%;background-size:6px 6px;background-repeat:no-repeat}
    .ft-date{color-scheme:dark}

    /* .app과 같은 폭으로 가둬 세로 화면 기준 레이아웃을 유지한다 */
    .ft-ov{position:fixed;inset:0;z-index:100;display:flex;flex-direction:column;align-items:center;color:var(--ink);
      background:radial-gradient(120% 80% at 80% -10%,rgba(180,90,255,.20),transparent 55%),
                 radial-gradient(120% 80% at -10% 5%,rgba(90,120,255,.18),transparent 55%),#140f22;
      padding:env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left);
      animation:fade .28s ease}
    .ft-ov>*{width:100%;max-width:520px}
    .ft-top{display:flex;align-items:center;gap:10px;padding:12px 14px 8px}
    .ft-title{font-family:var(--display);font-size:21px;flex:1;text-align:center}
    .ft-back,.ft-x{flex:0 0 auto}
    .ft-back{font-size:20px;line-height:1;padding:6px 14px}
    .ft-top .ft-title+.ft-x{margin-left:0}
    .ft-top>.ft-title:first-child{text-align:left}
    .ft-scroll{flex:1;min-height:0;overflow-y:auto;padding:4px 14px 24px;-webkit-overflow-scrolling:touch}
    .ft-panel{background:#1d1830;border:1px solid #3a3352;border-radius:16px;padding:14px 16px;margin-bottom:10px}
    .ft-panel.key{border-color:#6b4bb0;background:linear-gradient(180deg,#241a3d,#1d1830)}
    .ft-panel p{font-size:14px;line-height:1.65;color:var(--ink);margin:6px 0 0}
    .ft-panel p.ft-dim{color:var(--mut);font-size:13px}
    .ft-h{font-family:var(--round);font-size:15px;color:var(--hot2)}
    .ft-sub{font-family:var(--round);font-size:13px;color:var(--mut);text-align:center}
    .ft-note{font-family:var(--round);font-size:11px;color:var(--mut);text-align:center;margin-top:10px;line-height:1.5}
    .ft-act{display:grid;grid-template-columns:1fr 1.3fr;gap:8px;margin:16px 0 10px}
    .ft-act .cta{margin-top:0}
    .ft-act .ghost{border:1.5px solid #3a3352;background:#241f37;color:var(--mut);border-radius:16px;
      font-family:var(--round);font-size:16px;padding:16px;cursor:pointer}

    /* ---- 사주 ---- */
    .sj-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-top:12px}
    .sj-col{background:#241f37;border:1px solid #3a3352;border-radius:12px;padding:8px 0;text-align:center}
    .sj-col.dim{opacity:.45}
    .sj-lab{font-family:var(--round);font-size:11px;color:var(--mut);margin-bottom:6px}
    .sj-ch{font-family:var(--display);font-size:27px;line-height:1.22;color:var(--c,#8b83a8);
      text-shadow:0 0 12px color-mix(in srgb,var(--c,#8b83a8) 45%,transparent)}
    .sj-bars{display:flex;flex-direction:column;gap:6px;margin-top:12px}
    .sj-bar{display:flex;align-items:center;gap:8px}
    .sj-bar .n{font-family:var(--round);font-size:12px;width:16px;color:var(--ink)}
    .sj-bar .t{flex:1;height:10px;border-radius:6px;background:#2b2440;overflow:hidden}
    .sj-bar .t i{display:block;height:100%;border-radius:6px;transition:width .6s cubic-bezier(.2,1,.3,1)}
    .sj-bar .v{font-family:var(--round);font-size:12px;color:var(--mut);width:14px;text-align:right}

    /* ---- 타로: 카테고리 ---- */
    .ft-cats{display:grid;grid-template-columns:1fr 1fr;gap:9px;margin-top:16px}
    .ft-cat{border:1.5px solid #3a3352;background:#241f37;color:var(--ink);border-radius:16px;padding:16px 8px;
      cursor:pointer;font-family:var(--round);font-size:15px;display:flex;flex-direction:column;align-items:center;gap:3px;transition:.15s}
    .ft-cat:active{transform:scale(.97);border-color:var(--hot)}
    .ft-cat .ic{font-size:30px}
    .ft-cat small{font-family:var(--body);font-size:11px;color:var(--mut)}

    /* ---- 타로: 카드 고르기 ---- */
    .tr-guide{text-align:center;padding:2px 18px 10px}
    .tr-say{font-family:var(--round);font-size:14px;line-height:1.55;color:var(--ink)}
    .tr-say b{color:var(--hot2)}
    .tr-count{font-family:var(--round);font-size:12px;color:var(--mut);margin-top:6px}
    .tr-count span{color:var(--hot2);font-size:15px}
    .tr-wrap{flex:1;min-height:0;position:relative;overflow-y:auto;padding:2px 12px 8px}
    .tr-grid{display:grid;grid-template-columns:repeat(6,1fr);gap:7px;align-content:start;transition:opacity .2s}
    .tr-grid.hide{opacity:0;pointer-events:none}
    .tr-card{position:relative;padding:0;border:none;background:none;cursor:pointer;aspect-ratio:58/100;
      border-radius:6px;transition:transform .18s cubic-bezier(.2,1.5,.4,1),filter .18s;
      animation:trDeal .4s cubic-bezier(.2,1.3,.4,1) both;animation-delay:calc(var(--i)*26ms)}
    .tr-card .ft-svg{width:100%;height:100%;display:block;border-radius:6px;box-shadow:0 3px 8px rgba(0,0,0,.5)}
    .tr-card:active{transform:translateY(-4px)}
    .tr-card.sel{transform:translateY(-11px);filter:drop-shadow(0 0 8px rgba(255,180,84,.9))}
    .tr-card.sel .ft-svg{outline:2px solid var(--hot2);outline-offset:-1px;border-radius:6px}
    .tr-num{position:absolute;top:-7px;right:-5px;min-width:19px;height:19px;border-radius:10px;
      font-family:var(--round);font-size:11px;color:#221206;background:linear-gradient(100deg,var(--hot),var(--hot2));
      display:flex;align-items:center;justify-content:center;opacity:0;transition:.15s}
    .tr-card.sel .tr-num{opacity:1}
    @keyframes trDeal{from{opacity:0;transform:translateY(26px) rotate(-8deg) scale(.8)}
      to{opacity:1;transform:none}}
    .tr-shufov{position:absolute;inset:0;display:none;flex-direction:column;align-items:center;justify-content:center;gap:16px}
    .tr-shufov.on{display:flex}
    .tr-stack{position:relative;width:72px;height:124px}
    .tr-sc{position:absolute;inset:0;animation:trShuf .5s ease-in-out infinite alternate;
      animation-delay:calc(var(--i)*70ms)}
    .tr-sc .ft-svg{width:100%;height:100%;display:block;border-radius:7px;box-shadow:0 6px 16px rgba(0,0,0,.55)}
    @keyframes trShuf{from{transform:translate(-26px,-6px) rotate(-13deg)}
      to{transform:translate(26px,6px) rotate(13deg)}}
    .tr-shufmsg{font-family:var(--round);font-size:14px;color:var(--mut)}
    .tr-foot{padding:6px 16px calc(14px + env(safe-area-inset-bottom))}
    .tr-foot .cta{margin-top:0}

    /* ---- 타로: 결과 ---- */
    .tr-spread{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin:6px 0 14px}
    .tr-slot{text-align:center}
    .tr-pos{font-family:var(--round);font-size:12px;color:var(--hot2);margin-bottom:6px}
    .tr-flip{perspective:700px;aspect-ratio:58/100}
    .tr-in{position:relative;width:100%;height:100%;transform-style:preserve-3d;
      transition:transform .6s cubic-bezier(.3,1.1,.4,1)}
    .tr-flip.on .tr-in{transform:rotateY(180deg)}
    .tr-face{position:absolute;inset:0;backface-visibility:hidden;-webkit-backface-visibility:hidden}
    .tr-face.front{transform:rotateY(180deg)}
    .tr-face .ft-svg,.tr-face .ft-img{width:100%;height:100%;display:block;border-radius:7px;
      box-shadow:0 6px 16px rgba(0,0,0,.5)}
    /* 실사 카드는 원본 비율이 58:100이라 cover로 잘려 나가는 부분이 없다 */
    .tr-face .ft-img{object-fit:cover;background:#efe7d8}
    .tr-flip.on{animation:trPop .6s cubic-bezier(.3,1.2,.4,1)}
    @keyframes trPop{0%{transform:none}45%{transform:translateY(-8px) scale(1.06)}100%{transform:none}}
    .tr-kw{font-family:var(--body);font-size:11px;color:#221206;background:linear-gradient(100deg,var(--hot),var(--hot2));
      padding:2px 8px;border-radius:10px;margin-left:4px;white-space:nowrap}
    .tr-luck{font-family:var(--round);font-size:13px;color:var(--hot2);margin-top:10px}
    `;
    document.head.appendChild(s);
  }
  css();

  window.Fortune={open,groundHTML,npcSVG,tableSVG,NPC_NAME};
})();
