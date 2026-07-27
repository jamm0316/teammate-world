/* ===================== 종목 (games) =====================
   줄다리기 · 팀 계주 참가자 화면(세로).
   백엔드 이전 POC라 팀원/상대는 봇으로 시뮬레이션한다.
   index.html 인라인 스크립트의 전역(buildChar/GEN/GENC/shade/
   rollChar/toast/esc/me)을 공유하는 classic script로 로드된다. */
(function(){
  if(window.Games) return;
  const TEAMS=[1,2,3,4];
  // 시뮬레이션 인원(≈100명, 기수별 편차) — 평균 연타/진행 계산의 분모
  const MEMBERS={1:24,2:26,3:22,4:28};
  const vib=ms=>{try{navigator.vibrate&&navigator.vibrate(ms);}catch(e){}};
  const myGen=()=> (me&&me.gen)||1;

  /* ---- 공용 오버레이 ---- */
  function overlay(){
    const root=document.createElement('div');
    root.className='gm-ov';
    document.body.appendChild(root);
    let raf=0, alive=true;
    const stop=()=>{alive=false;if(raf)cancelAnimationFrame(raf);};
    const close=()=>{stop();root.remove();};
    const loop=fn=>{ const step=t=>{ if(!alive||!root.isConnected)return; fn(t); raf=requestAnimationFrame(step);}; raf=requestAnimationFrame(step); };
    return {root,close,stop,loop};
  }
  // 팀 캐릭터 몇 개를 미리 만들어 아레나/트랙에 세운다(매 프레임 재생성 방지)
  function teamChars(gen,n,mine){
    const out=[];
    for(let i=0;i<n;i++){
      if(mine&&i===0&&me){out.push(me);continue;}
      out.push({gender:Math.random()<.5?'M':'F',...rollChar(Math.random()<.5?'M':'F')});
    }
    return out;
  }
  const scaledChar=c=>`<div class="gm-ch">${buildChar(c)}</div>`;

  /* ===================== ① 줄다리기 토너먼트 ===================== */
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const shuffle=a=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
  const wait=ms=>new Promise(r=>setTimeout(r,ms));
  // 봇 선수 이름 풀(내 캐릭터는 실제 닉네임 사용)
  const NAMES=['민준','서연','도윤','하은','지호','수아','시우','예린','주원','다은','건우','서윤','현우','지유','유준','채원','정우','소율'];
  function fighterName(c,used){
    if(c===me) return (me&&me.nick)||'나';
    let n,g=0; do{ n=NAMES[Math.floor(Math.random()*NAMES.length)]; }while(used.has(n)&&g++<24); used.add(n); return n;
  }
  // requestAnimationFrame 러너(단계마다 stop 가능, 오버레이 닫히면 자동 종료)
  function animate(root,fn){
    let alive=true, last=performance.now(), id=0;
    const step=t=>{ if(!alive||!root.isConnected)return; const dt=Math.min(.05,(t-last)/1000); last=t; fn(dt,t); if(alive)id=requestAnimationFrame(step); };
    id=requestAnimationFrame(step);
    return ()=>{alive=false; if(id)cancelAnimationFrame(id);};
  }

  function startTug(){
    if(!me){toast('먼저 캐릭터를 만들어주세요');return;}
    const ov=overlay(), mg=myGen();
    let killed=false; const _close=ov.close; ov.close=()=>{killed=true;_close();};

    // 랜덤 대진표: 준결승 2경기 → 결승 (NBA 플레이오프식)
    const draw=shuffle(TEAMS);
    const semis=[[draw[0],draw[1]],[draw[2],draw[3]]];
    const bracket={winners:[null,null],champion:null};

    ov.root.innerHTML=`
      <div class="gm-top">
        <div class="gm-title">🪢 줄다리기 토너먼트</div>
        <div class="gm-status" id="tgStatus">대진 추첨…</div>
        <button class="btn gm-close" id="tgClose">✕</button>
      </div>
      <div class="tg-bracket" id="tgBracket"></div>
      <div class="tg-stage" id="tgStage"></div>`;
    ov.root.querySelector('#tgClose').onclick=ov.close;
    const stageEl=ov.root.querySelector('#tgStage');
    const statusEl=ov.root.querySelector('#tgStatus');

    function renderBracket(active){
      const cell=g=> g==null
        ? `<div class="brc empty">?</div>`
        : `<div class="brc ${g===mg?'mine':''}" style="--gc:${GENC[g]}"><b style="background:${GENC[g]}">${GEN[g]}</b></div>`;
      const m=(pair,winner,live)=>`<div class="brmatch ${live?'live':''}">
        <div class="brc-wrap ${winner!=null&&winner===pair[0]?'won':(winner!=null?'lost':'')}">${cell(pair[0])}</div>
        <div class="brc-wrap ${winner!=null&&winner===pair[1]?'won':(winner!=null?'lost':'')}">${cell(pair[1])}</div></div>`;
      ov.root.querySelector('#tgBracket').innerHTML=`
        <div class="brcol">
          ${m(semis[0],bracket.winners[0],active==='s0')}
          ${m(semis[1],bracket.winners[1],active==='s1')}
        </div>
        <div class="brline"></div>
        <div class="brcol">
          ${m([bracket.winners[0],bracket.winners[1]],bracket.champion,active==='f')}
        </div>
        <div class="brtrophy ${bracket.champion?'on':''}" style="--gc:${bracket.champion?GENC[bracket.champion]:'#8a7fb0'}">🏆</div>`;
    }
    renderBracket();

    run();
    async function run(){
      statusEl.textContent='대진표 확인!';
      await wait(1100); if(killed)return;
      const w0=await match(semis[0][0],semis[0][1],'s0'); if(killed)return;
      bracket.winners[0]=w0; renderBracket();
      await wait(700); if(killed)return;
      const w1=await match(semis[1][0],semis[1][1],'s1'); if(killed)return;
      bracket.winners[1]=w1; renderBracket();
      await wait(700); if(killed)return;
      const champ=await match(w0,w1,'f'); if(killed)return;
      bracket.champion=champ; renderBracket();
      await wait(500); if(killed)return;
      champion(champ);
    }

    // 철권식 VS 인트로
    function vsIntro(gA,gB){
      return new Promise(res=>{
        const v=document.createElement('div'); v.className='tg-vs';
        v.innerHTML=`<div class="vs-side vs-l" style="--c:${GENC[gA]}"><span>${GEN[gA]}</span></div>
          <div class="vs-mid">VS</div>
          <div class="vs-side vs-r" style="--c:${GENC[gB]}"><span>${GEN[gB]}</span></div>`;
        stageEl.appendChild(v);
        setTimeout(()=>{ if(!ov.root.isConnected)return res(); v.classList.add('out');
          setTimeout(()=>{v.remove();res();},380); },1450);
      });
    }

    // 한 경기: winner 기수를 resolve
    function match(gA,gB,tag){
      return new Promise(async resolve=>{
        renderBracket(tag);
        const iPlay=(gA===mg||gB===mg);
        await vsIntro(gA,gB); if(killed)return resolve(gA);

        stageEl.innerHTML=`
          <div class="tg-arena" id="tgArena">
            <div class="tg-center"></div>
            <div class="tg-rope"></div>
            <div class="tg-timer" id="tgTimer"></div>
            <div class="tg-badge tg-bl" style="background:${GENC[gA]}">${GEN[gA]}</div>
            <div class="tg-badge tg-br" style="background:${GENC[gB]}">${GEN[gB]}</div>
            <div class="tg-side left" id="tgL"></div>
            <div class="tg-side right" id="tgR"></div>
            <div class="tg-knot" id="tgKnot">🚩</div>
            <div class="tg-fanfare" id="tgFanfare"></div>
          </div>
          <div class="tg-foot">
            ${iPlay
              ? `<div class="tg-mine">내 연타 <b id="tgMy">0</b></div>
                 <button class="tg-mash" id="tgMash" style="--tc:${GENC[mg]}">연타!<small>${GEN[mg]} 힘내라!</small></button>`
              : `<div class="tg-spectate">👀 관전 중 · <b style="color:${GENC[gA]}">${GEN[gA]}</b> vs <b style="color:${GENC[gB]}">${GEN[gB]}</b></div>`}
          </div>`;

        const arena=ov.root.querySelector('#tgArena');
        const knotEl=ov.root.querySelector('#tgKnot');
        const timerEl=ov.root.querySelector('#tgTimer');
        const L=ov.root.querySelector('#tgL'), Rr=ov.root.querySelector('#tgR');
        const leftChars=teamChars(gA,4,gA===mg), rightChars=teamChars(gB,4,gB===mg);
        const usedN=new Set();
        const fighter=(c,flip)=>`<div class="tg-fighter"><div class="gm-ch${flip?' flip':''}">${buildChar(c)}</div><span class="tg-name">${esc(fighterName(c,usedN))}</span></div>`;
        L.innerHTML=leftChars.map(c=>fighter(c,false)).join('');
        Rr.innerHTML=rightChars.map(c=>fighter(c,true)).join('');
        const cells=[
          ...[...L.querySelectorAll('.gm-ch')].map((el,i)=>({el,char:leftChars[i],side:'L'})),
          ...[...Rr.querySelectorAll('.gm-ch')].map((el,i)=>({el,char:rightChars[i],side:'R'})),
        ];
        function setExpr(cell,ex){ if(!ov.root.isConnected)return; cell.el.innerHTML=buildChar(cell.char,ex); }
        // 이따금 힘든 표정으로 바뀌었다 돌아옴
        function sprinkleStrain(){
          const n=1+Math.floor(Math.random()*2);
          for(let k=0;k<n;k++){ const cell=cells[Math.floor(Math.random()*cells.length)];
            if(cell._busy)continue; cell._busy=true;
            setExpr(cell,'strain'); cell.el.classList.add('grit');
            setTimeout(()=>{ if(ov.root.isConnected){setExpr(cell,'normal');cell.el.classList.remove('grit');} cell._busy=false; },500+Math.random()*400);
          }
        }

        const memL=MEMBERS[gA], memR=MEMBERS[gB];
        let tapsL=0,tapsR=0,myTaps=0, frac=0.5, knot=0.5, tLeft=iPlay?15:6, running=true, strainAcc=0, stAcc=0;
        const rate={l:0.95,r:0.95};
        const HUMAN=4.2;                       // 솔로 데모: 내 연타 1회의 팀 기여 가중치
        // 관전 경기는 미리 살짝 편향을 줘 승부가 자연스럽게 갈리게
        const bias = iPlay ? {l:1,r:1} : (Math.random()<0.5?{l:1.09,r:0.93}:{l:0.93,r:1.09});

        if(iPlay){
          const mash=ov.root.querySelector('#tgMash'), myEl=ov.root.querySelector('#tgMy');
          mash.addEventListener('pointerdown',e=>{ e.preventDefault(); if(!running)return;
            myTaps++; if(gA===mg)tapsL+=HUMAN; else tapsR+=HUMAN; myEl.textContent=myTaps;
            mash.classList.remove('hit'); void mash.offsetWidth; mash.classList.add('hit'); vib(12);
            const s=document.createElement('div'); s.className='tg-plus'; s.textContent='+1';
            s.style.left=(gA===mg?15+Math.random()*25:60+Math.random()*25)+'%'; s.style.bottom='10px';
            arena.appendChild(s); setTimeout(()=>s.remove(),620);
          });
        }

        const stop=animate(ov.root,dt=>{
          if(running){
            tLeft-=dt; if(tLeft<=0){tLeft=0;running=false;stop();finish();return;}
            rate.l=clamp(rate.l+(Math.random()-.5)*dt*0.3,.8,1.15);
            rate.r=clamp(rate.r+(Math.random()-.5)*dt*0.3,.8,1.15);
            const botL=memL-(gA===mg?1:0), botR=memR-(gB===mg?1:0);
            tapsL+=botL*3.6*rate.l*bias.l*dt;
            tapsR+=botR*3.6*rate.r*bias.r*dt;
            strainAcc+=dt; if(strainAcc>1.3){strainAcc=0;sprinkleStrain();}
          }
          const avgL=tapsL/memL, avgR=tapsR/memR;
          frac=(avgL+avgR>0)?avgL/(avgL+avgR):0.5;
          knot+=(frac-knot)*Math.min(1,dt*4);
          arena.style.setProperty('--pull',(knot-0.5).toFixed(3));
          knotEl.style.left=((1-knot)*100)+'%';
          if(running){ timerEl.textContent=Math.ceil(tLeft); timerEl.classList.toggle('low',tLeft<=3);
            stAcc+=dt; if(stAcc>.2){stAcc=0;
            const lead = avgL>avgR?gA:gB;
            const name = tag==='f'?'결승':(tag==='s0'?'준결승 1':'준결승 2');
            statusEl.textContent=`${name} · 우세 ${GEN[lead]}`; } }
        });

        function finish(){
          timerEl.textContent=''; timerEl.classList.remove('low');
          const avgL=tapsL/memL, avgR=tapsR/memR;
          const win = avgL>=avgR?gA:gB, winSide = win===gA?'L':'R';
          statusEl.textContent = win===mg?'🎉 승리!':`${GEN[win]} 승리`;
          // 승팀 환호 점프 / 패팀 엎드려 아쉬워함
          cells.forEach(cell=>{ const won=cell.side===winSide;
            setExpr(cell,won?'cheer':'sad'); cell.el.classList.remove('grit');
            cell.el.classList.add(won?'cheer':'sad'); });
          knotEl.style.left=(winSide==='L'?4:96)+'%';
          fanfare(ov.root.querySelector('#tgFanfare'),GENC[win]);
          if(win===mg)vib([20,60,20]);
          setTimeout(()=>{ if(!killed)resolve(win); }, tag==='f'?1500:1300);
        }
      });
    }

    // 최종 우승 세리머니: 트로피 들어올리기 + 칭호 지급
    function champion(g){
      const isMine=(g===mg);
      const champs=teamChars(g,5,isMine);
      stageEl.innerHTML=`
        <div class="tg-champ">
          <div class="tg-fanfare" id="tgCF"></div>
          <div class="champ-title" style="color:${GENC[g]}">🏆 ${GEN[g]} 우승!</div>
          <div class="champ-row">${champs.map((c,i)=>
            `<div class="gm-ch champ-ch ${i===2?'lift':''}">${i===2?'<div class="champ-trophy">🏆</div>':''}${buildChar(c,'cheer')}</div>`).join('')}</div>
          <div class="champ-sub">${isMine?'우리 팀이 정상에 올랐어요! 🎊':GEN[g]+' 팀이 우승을 차지했어요'}</div>
          ${isMine?`<div class="champ-badge">🪢 <b>줄다리기의 달인</b> 칭호 획득!</div>`:''}
          <div class="gm-ract"><button class="btn hot" id="tgAgain">다시</button><button class="btn" id="tgDone">닫기</button></div>
        </div>`;
      statusEl.textContent='토너먼트 종료';
      fanfare(ov.root.querySelector('#tgCF'),GENC[g],true);
      if(isMine){ toast('🏆 우리 팀 우승! 「줄다리기의 달인」 획득'); if(typeof awardTitle==='function')awardTitle('줄다리기의 달인'); }
      ov.root.querySelector('#tgAgain').onclick=()=>{ov.close();startTug();};
      ov.root.querySelector('#tgDone').onclick=ov.close;
    }

    // 팡파레 색종이
    function fanfare(host,color,big){
      if(!host)return;
      const N=big?40:22;
      for(let i=0;i<N;i++){ const p=document.createElement('div'); p.className='confetti';
        p.style.left=Math.random()*100+'%';
        p.style.background=[color,'#ffd54a','#ff7a59','#8b8bff','#2ec4b6'][i%5];
        p.style.animationDelay=(Math.random()*0.6)+'s';
        p.style.animationDuration=(1.8+Math.random()*1.4)+'s';
        p.style.setProperty('--dx',(Math.random()*180-90)+'px');
        host.appendChild(p); setTimeout(()=>p.remove(),4200);
      }
    }
  }

  /* ===================== ② 팀 계주 (오벌 트랙) ===================== */
  function startRelay(){
    if(!me){toast('먼저 캐릭터를 만들어주세요');return;}
    const ov=overlay(), mg=myGen();
    let killed=false; const cleanups=[]; const _close=ov.close;
    ov.close=()=>{killed=true;cleanups.forEach(f=>{try{f();}catch(e){}});_close();};
    const R=4, MY=1, STEPS=28, SPAWN=0.97, GAP=0.05;   // 4주자·내가 2주자·한바퀴 28스텝
    const LANES=6, ZA=0.5;                             // 트랙 6레인 / 인계구역 반각(rad)
    const CHEER_TAP=0.20, CHEER_DECAY=1.8, CHEER_MAX=0.26;  // 응원: 탭당 충전 / 감쇠율 / 최대 가속

    /* ── 트랙 기하 ──────────────────────────────────────────────
       좌표계는 0~100 정규화(SVG viewBox + preserveAspectRatio=none와 공유)이지만,
       아레나의 실제 픽셀 비율(kx/ky)로 역보정해서 그리므로 곡선이 '타원'이 아니라
       진짜 '원'으로 렌더된다. 형태는 직선 2 + 반원 2 = 스타디움(육상 트랙) 곡선.
       내부 계산은 항상 '직선이 세로'인 정규 좌표로 하고, 가로가 더 긴 화면에서는
       orient()로 -90° 돌려 긴 축에 직선이 놓이게 한다.                        */
    const laneOf=g=>TEAMS.indexOf(g);
    let GEO=null;
    function measure(){
      const W=Math.max(160,arena.clientWidth), H=Math.max(160,arena.clientHeight);
      const S=Math.min(W,H), L=Math.max(W,H);
      const M=6, sw=Math.max(7,Math.min(13,S*0.032));  // 바깥 여백 / 관중석 두께(px)
      const rOut=S/2-M-sw;                             // 트랙 바깥 반경(px)
      const lw=Math.min(16,rOut*0.66/LANES);           // 레인 폭(px)
      return {W,H,kx:100/W,ky:100/H,sw,rOut,lw,rIn:rOut-lw*LANES,h:(L-S)/2,vert:H>=W};
    }
    const orient=p=>GEO.vert?p:{X:p.Y,Y:-p.X};
    /* 팀 레인 반경 — 6레인 중 안쪽에서 두 번째~다섯 번째를 4팀이 사용 */
    const laneR=g=>GEO.rOut-(laneOf(g)+1.5)*GEO.lw;
    /* 진행률 u(0~1) → 스타디움 곡선 위의 픽셀 오프셋(중심 기준). 반시계 방향, u=0은 결승선 */
    function ptPx(r,u){
      const h=GEO.h, qa=Math.PI*r/2, P=2*Math.PI*r+4*h;
      let s=(((u%1)+1)%1)*P, a;
      if(s<qa){ a=s/r; return{X:-r*Math.sin(a),Y:-h-r*Math.cos(a)}; }          // 좌상단 1/4 곡선
      if((s-=qa)<2*h) return{X:-r,Y:-h+s};                                      // 좌측 직선(하행)
      if((s-=2*h)<Math.PI*r){ a=s/r; return{X:-r*Math.cos(a),Y:h+r*Math.sin(a)}; } // 하단 반원
      if((s-=Math.PI*r)<2*h) return{X:r,Y:h-s};                                 // 우측 직선(상행)
      a=(s-2*h)/r; return{X:r*Math.cos(a),Y:-h-r*Math.sin(a)};                  // 우상단 1/4 곡선
    }
    /* 결승선 곡선 위, 결승선 기준 각 a·반경 r인 지점 */
    const curveAt=(r,a)=>orient({X:r*Math.sin(a),Y:-GEO.h-r*Math.cos(a)});
    const pt=(g,u)=>{const p=orient(ptPx(laneR(g),u));return{x:50+p.X*GEO.kx,y:50+p.Y*GEO.ky};};

    /* 팀 상태 */
    const T={};
    TEAMS.forEach(g=>{
      const chars=teamChars(g,R,false); if(g===mg)chars[MY]=me;
      const used=new Set(), myNick=(me&&me.nick)||'나'; if(g===mg)used.add(myNick);
      const names=chars.map((c,i)=>(g===mg&&i===MY)?myNick:fighterName(c,used));
      T[g]={chars,names,leg:0,u:0,nu:0,nextSpawned:false,handoff:null,canTouch:false,htAt:0,
        received:g!==mg,steps:0,speed:0.10+Math.random()*0.03,finished:false,rank:0,lapEvent:false,curShown:-1};
    });

    ov.root.innerHTML=`
      <div class="gm-top">
        <div class="gm-title">🏃 팀 계주</div>
        <div class="gm-status" id="rlStatus">잠시 후 출발!</div>
        <button class="btn gm-close" id="rlClose">✕</button>
      </div>
      <div class="rl-arena" id="rlArena">
        <div class="rl-world" id="rlWorld">
          <svg class="rl-svg" id="rlSvg" viewBox="0 0 100 100" preserveAspectRatio="none"></svg>
          <div class="rl-ribbon" id="rlRibbon"><span>FINISH</span></div>
          <div class="rl-runners" id="rlRunners">
            ${TEAMS.map(g=>`<div class="rl-run${g===mg?' mine':''}" id="rlCur${g}"><div class="gm-ch"></div></div>
              <div class="rl-run next${g===mg?' mine':''}" id="rlNxt${g}"><div class="gm-ch"></div></div>`).join('')}
          </div>
        </div>
        <div class="rl-banner-wrap" id="rlBanner"></div>
        <div class="rl-portraits" id="rlPort">
          ${TEAMS.map(g=>`<div class="rl-pcard ${g===mg?'me':''}" style="--gc:${GENC[g]}">
            <span class="rl-ptag" style="background:${GENC[g]}">${GEN[g]}</span>
            <div class="rl-pruns">
              <div class="rl-prow"><div class="rl-pav" id="rlPcur${g}"></div><span class="rl-pnm" id="rlPcurN${g}"></span></div>
              <div class="rl-prow next"><div class="rl-pav" id="rlPnxt${g}"></div><span class="rl-pnm" id="rlPnxtN${g}"></span></div>
            </div></div>`).join('')}
        </div>
        <div class="rl-rank" id="rlRank">
          ${TEAMS.map(g=>`<div class="rl-rankrow ${g===mg?'me':''}" id="rlRk${g}"><b class="rl-rkpos">–</b><span class="rl-rktag" style="background:${GENC[g]}">${GEN[g]}</span></div>`).join('')}
        </div>
        <div class="rl-count" id="rlCount"></div>
        <div class="gm-result" id="rlResult"></div>
      </div>
      <div class="rl-foot">
        <button class="rl-act" id="rlAct" hidden></button>
        <button class="rl-cheer" id="rlCheer" hidden><span id="rlCheerL">📣 응원하기!</span><i><b id="rlGauge"></b></i></button>
        <div class="rl-feet">
          <button class="rl-ftbtn" id="rlL" disabled>👟<small>왼발</small></button>
          <button class="rl-ftbtn" id="rlR" disabled>👟<small>오른발</small></button>
        </div>
        <div class="rl-hint" id="rlHint">4팀이 동시에 출발합니다</div>
      </div>`;
    ov.root.querySelector('#rlClose').onclick=ov.close;

    const $=id=>ov.root.querySelector(id);
    const arena=$('#rlArena'), svg=$('#rlSvg'),
          status=$('#rlStatus'), ribbon=$('#rlRibbon'), bannerWrap=$('#rlBanner'),
          countEl=$('#rlCount'), result=$('#rlResult'),
          bL=$('#rlL'), bR=$('#rlR'), act=$('#rlAct'), hint=$('#rlHint'),
          cheerBtn=$('#rlCheer'), cheerLbl=$('#rlCheerL'), gauge=$('#rlGauge');
    const curEl={},nxtEl={},curCh={},nxtCh={},pcur={},pnxt={},pcurN={},pnxtN={},rankRow={};
    TEAMS.forEach(g=>{
      curEl[g]=$('#rlCur'+g); nxtEl[g]=$('#rlNxt'+g);
      curCh[g]=curEl[g].firstElementChild; nxtCh[g]=nxtEl[g].firstElementChild;
      pcur[g]=$('#rlPcur'+g); pnxt[g]=$('#rlPnxt'+g); pcurN[g]=$('#rlPcurN'+g); pnxtN[g]=$('#rlPnxtN'+g);
      rankRow[g]=$('#rlRk'+g);
    });

    /* ── 트랙 그리기 ─────────────────────────────────────────── */
    function drawTrack(){
      GEO=measure();
      const {kx,ky,sw,rOut,rIn,lw,h,vert}=GEO, f=n=>n.toFixed(2);
      const xy=p=>`${f(50+p.X*kx)},${f(50+p.Y*ky)}`;          // 픽셀 오프셋 → viewBox 좌표
      /* 반경 r의 스타디움(직선2+반원2) 경로 — 픽셀 비율 역보정으로 곡선이 정원(正圓)이 된다 */
      const P=r=>{const rx=r*kx, ry=r*ky;
        if(vert){ const hy=h*ky;
          return `M${f(50-rx)} ${f(50-hy)}A${f(rx)} ${f(ry)} 0 0 1 ${f(50+rx)} ${f(50-hy)}`
               + `L${f(50+rx)} ${f(50+hy)}A${f(rx)} ${f(ry)} 0 0 1 ${f(50-rx)} ${f(50+hy)}Z`; }
        const hx=h*kx;
        return `M${f(50+hx)} ${f(50-ry)}A${f(rx)} ${f(ry)} 0 0 1 ${f(50+hx)} ${f(50+ry)}`
             + `L${f(50-hx)} ${f(50+ry)}A${f(rx)} ${f(ry)} 0 0 1 ${f(50-hx)} ${f(50-ry)}Z`;};

      /* 잔디 줄무늬(잔디깎기 자국) — 인필드 안쪽으로 클립 */
      let bands=''; for(let k=0;k<14;k++) bands+=vert
        ? `<rect x="0" y="${f(k*100/14)}" width="100" height="${f(100/14+.1)}" fill="${k%2?'#2c7a4b':'#348c57'}"/>`
        : `<rect y="0" x="${f(k*100/14)}" height="100" width="${f(100/14+.1)}" fill="${k%2?'#2c7a4b':'#348c57'}"/>`;
      /* 레인 라인 */
      let lines=''; for(let j=1;j<LANES;j++) lines+=`<path d="${P(rOut-j*lw)}" fill="none" stroke="rgba(255,255,255,.7)" stroke-width=".26"/>`;
      /* 인계 구역(테이크오버 존) — 결승선 기준 ±ZA. 바통 인계가 허용되는 구간을 그대로 칠한다 */
      const NZ=16; let zO='',zI='';
      for(let i=0;i<=NZ;i++){ const t=i/NZ;
        zO+=xy(curveAt(rOut,-ZA+2*ZA*t))+' ';
        zI=xy(curveAt(rIn,-ZA+2*ZA*t))+' '+zI; }
      const zone=`<polygon points="${zO}${zI}" fill="#2f6fd0" opacity=".72"/>`
        +[-ZA,ZA].map(a=>`<polyline points="${xy(curveAt(rOut,a))} ${xy(curveAt(rIn,a))}" fill="none" stroke="#dbe9ff" stroke-width=".3"/>`).join('');
      /* 결승선(체커) — 레인을 가로지르는 방사형 띠 */
      let fin=''; const NC=10, dr=(rOut-rIn)/NC, tw=7;
      for(let k=0;k<NC;k++){ const r0=rIn+k*dr, r1=r0+dr, a0=tw/(2*r0), a1=tw/(2*r1);
        fin+=`<polygon points="${xy(curveAt(r0,-a0))} ${xy(curveAt(r0,a0))} ${xy(curveAt(r1,a1))} ${xy(curveAt(r1,-a1))}" fill="${k%2?'#15121f':'#fff'}"/>`; }
      /* 조명탑 */
      let tow=''; [0.13,0.37,0.63,0.87].forEach(u=>{const p=orient(ptPx(rOut+sw*0.55,u)), c=xy(p).split(',');
        tow+=`<circle cx="${c[0]}" cy="${c[1]}" r="3.2" fill="#fff6c8" opacity=".13"/><circle cx="${c[0]}" cy="${c[1]}" r="1.05" fill="#fff8d8" opacity=".95"/>`;});
      /* 인필드 축구장 마킹 */
      const pw=(vert?rIn*0.6:(h+rIn)*0.58)*kx, ph=(vert?(h+rIn)*0.58:rIn*0.6)*ky, cr=rIn*0.16;
      const pitch=`<g fill="none" stroke="rgba(255,255,255,.3)" stroke-width=".24">
        <rect x="${f(50-pw)}" y="${f(50-ph)}" width="${f(pw*2)}" height="${f(ph*2)}"/>
        ${vert?`<line x1="${f(50-pw)}" y1="50" x2="${f(50+pw)}" y2="50"/>`
              :`<line x1="50" y1="${f(50-ph)}" x2="50" y2="${f(50+ph)}"/>`}
        <ellipse cx="50" cy="50" rx="${f(cr*kx)}" ry="${f(cr*ky)}"/></g>`;

      svg.innerHTML=`<defs><clipPath id="rlClipIF"><path d="${P(rIn)}"/></clipPath></defs>
        <rect x="0" y="0" width="100" height="100" fill="#1d2a33"/>
        <path d="${P(rOut+sw)}" fill="#39404f"/>
        <path d="${P(rOut+sw*0.55)}" fill="#565f75"/>
        <path d="${P(rOut+sw*0.55)}" fill="none" stroke="rgba(255,255,255,.22)" stroke-width="${f(sw*0.42*ky)}" stroke-dasharray=".9 1.3"/>
        <path d="${P(rOut)}" fill="#b3492c"/>
        <path d="${P(rIn)}" fill="#2f7d4f"/>
        <g clip-path="url(#rlClipIF)">${bands}</g>
        ${pitch}
        ${zone}
        ${lines}
        <path d="${P(rOut)}" fill="none" stroke="rgba(255,255,255,.85)" stroke-width=".34"/>
        <path d="${P(rIn)}" fill="none" stroke="#fff" stroke-width=".5"/>
        ${fin}${tow}`;

      /* 결승 테이프를 결승선 위·트랙 폭에 맞춤 */
      const c=curveAt((rOut+rIn)/2,0);
      ribbon.style.left=f(50+c.X*kx)+'%'; ribbon.style.top=f(50+c.Y*ky)+'%';
      ribbon.style.width=((rOut-rIn)*1.06).toFixed(1)+'px';
      ribbon.style.setProperty('--rz',vert?'0deg':'90deg');
    }
    drawTrack();
    const onResize=()=>{ if(killed)return; drawTrack(); TEAMS.forEach(positionTeam); };
    window.addEventListener('resize',onResize);
    cleanups.push(()=>window.removeEventListener('resize',onResize));

    /* 얼굴(트랙 슬롯 + 좌상단 초상) — 주자 교체 시에만 재생성 */
    function refresh(g){
      const s=T[g]; if(s.curShown===s.leg)return; s.curShown=s.leg;
      curCh[g].innerHTML=buildChar(s.chars[s.leg]);
      pcur[g].innerHTML=buildChar(s.chars[s.leg]); pcurN[g].textContent=s.names[s.leg];
      const ni=s.leg+1;
      if(ni<R){ nxtCh[g].innerHTML=buildChar(s.chars[ni]);
        pnxt[g].innerHTML=buildChar(s.chars[ni]); pnxtN[g].textContent=s.names[ni];
        pnxt[g].parentElement.style.visibility='visible'; }
      else { nxtCh[g].innerHTML=''; pnxt[g].innerHTML=''; pnxtN[g].textContent='';
        pnxt[g].parentElement.style.visibility='hidden'; }
    }
    TEAMS.forEach(refresh);

    /* 러너 트랙 배치(진행률 → 오벌 좌표) */
    function positionTeam(g){
      const s=T[g], u=s.finished?1:s.u, p=pt(g,u), p2=pt(g,u+0.01);
      const c=curEl[g]; c.style.left=p.x+'%'; c.style.top=p.y+'%';
      /* 직선 구간에서는 x 변화가 없으므로 진행 방향이 뚜렷할 때만 좌우 반전을 갱신 */
      if(Math.abs(p2.x-p.x)>0.08) c.classList.toggle('flip',p2.x>p.x);
      c.style.zIndex=200+((p.y*10)|0);
      const n=nxtEl[g];
      if(s.nextSpawned && s.leg+1<R && !s.finished){ const q=pt(g,s.nu),q2=pt(g,s.nu+0.01);
        n.style.display='block'; n.style.left=q.x+'%'; n.style.top=q.y+'%';
        if(Math.abs(q2.x-q.x)>0.08) n.classList.toggle('flip',q2.x>q.x);
        n.style.zIndex=200+((q.y*10)|0); }
      else n.style.display='none';
    }

    /* 상태 */
    let started=false, ended=false, place=0, lastFoot=null, handedOff=false, cheer=0,
        prevOrder=TEAMS.slice(), firstRank=true, lastOT=0, bq=[], bShow=false, last=performance.now();

    /* 바통 인계 완료: 다음 주자가 현재 주자가 됨 */
    function completeHandoff(g){
      const s=T[g]; s.leg++; s.u=s.nu; s.nu=0; s.nextSpawned=false; s.handoff=null; s.canTouch=false; s.lapEvent=true;
      if(g===mg){ if(s.leg===MY){ s.received=true; s.steps=Math.round(s.u*STEPS); lastFoot=null; hintFoot(); }
        else if(s.leg>MY) handedOff=true; }
      refresh(g);
    }

    /* 배너(우→좌) */
    function banner(text,kind){ bq.push({text,kind}); if(!bShow)nextBanner(); }
    function nextBanner(){ if(!bq.length){bShow=false;return;} bShow=true; const {text,kind}=bq.shift();
      const b=document.createElement('div'); b.className='rl-banner '+kind; b.textContent=text;
      bannerWrap.appendChild(b); setTimeout(()=>{b.remove();nextBanner();},2400); }

    /* 발 버튼 */
    function step(foot){
      const s=T[mg];
      if(!started||ended||handedOff||!(s.leg===MY&&s.received))return;
      if(lastFoot===foot){ (foot==='L'?bL:bR).classList.add('bad');
        setTimeout(()=>(foot==='L'?bL:bR).classList.remove('bad'),200); vib([8,30,8]); return; }
      lastFoot=foot; s.steps++; vib(10);
      curEl[mg].classList.remove('hop'); void curEl[mg].offsetWidth; curEl[mg].classList.add('hop');
      hintFoot();
    }
    function hintFoot(){ const nx=lastFoot==='L'?'R':(lastFoot==='R'?'L':null);
      bL.classList.toggle('nextfoot',nx==='L'||nx==null); bR.classList.toggle('nextfoot',nx==='R'||nx==null); }
    bL.addEventListener('pointerdown',e=>{e.preventDefault();step('L');});
    bR.addEventListener('pointerdown',e=>{e.preventDefault();step('R');});
    act.addEventListener('pointerdown',e=>{ e.preventDefault(); const s=T[mg];
      if(!started||ended||handedOff)return;
      if(s.leg<MY){ if(s.nextSpawned&&s.handoff==='touch'){ completeHandoff(mg); toast('🎽 바통 받기!'); } }
      else if(s.leg===MY){ if(s.nextSpawned&&s.canTouch&&s.handoff==null){ s.handoff='touch'; s.htAt=performance.now(); toast('🎽 바통 터치!'); } }
    });

    /* 응원 — 내가 달리지 않는 구간에 연타하면 우리 팀 봇 주자가 빨라진다(최대 +26%).
       감쇠는 지수형(비율 감쇠). 선형 감쇠로 하면 "초당 N회 미만은 효과 0"인 절벽이 생겨
       보통 연타 속도(초당 3~5회)에서 아무 일도 일어나지 않는다. 지수형이면
       게이지가 대략 연타 속도에 비례해 수렴한다(초당 4회≈0.44, 9회≈만땅). */
    cheerBtn.addEventListener('pointerdown',e=>{ e.preventDefault();
      if(!started||ended)return; cheer=Math.min(1,cheer+CHEER_TAP); vib(6);
      cheerBtn.classList.remove('pump'); void cheerBtn.offsetWidth; cheerBtn.classList.add('pump'); });

    /* 카운트다운 → 출발 */
    (function countdown(){ let n=3; countEl.classList.add('on'); countEl.textContent=n;
      const tick=()=>{ if(killed)return; n--;
        if(n>0){ countEl.textContent=n; countEl.classList.remove('pop'); void countEl.offsetWidth; countEl.classList.add('pop'); setTimeout(tick,750); }
        else { countEl.textContent='출발!'; countEl.classList.add('go');
          setTimeout(()=>{ if(killed)return; started=true; last=performance.now(); status.textContent='레이스 진행 중';
            setTimeout(()=>countEl.classList.remove('on'),500); },300); } };
      setTimeout(tick,750);
    })();

    /* 결과 */
    function endRace(win){
      ended=true; ribbon.classList.remove('on');
      const key=g=>T[g].finished?(1000-T[g].rank):(T[g].leg+T[g].u);
      let p=T[win].rank||1; if(!T[win].rank)T[win].rank=1;
      TEAMS.filter(g=>!T[g].rank).sort((a,b)=>key(b)-key(a)).forEach(g=>{ T[g].rank=++p; });
      status.textContent='경기 종료';
      setTimeout(()=>{ if(!killed)showResult(win); },1200);
    }
    function confetti(host,color){ if(!host)return;
      for(let i=0;i<40;i++){ const p=document.createElement('div'); p.className='confetti';
        p.style.left=Math.random()*100+'%'; p.style.background=[color,'#ffd54a','#ff7a59','#8b8bff','#2ec4b6'][i%5];
        p.style.animationDelay=(Math.random()*0.5)+'s'; p.style.animationDuration=(0.9+Math.random()*0.8)+'s';
        p.style.setProperty('--dx',(Math.random()*60-30)+'px'); host.appendChild(p); setTimeout(()=>p.remove(),2200); } }
    function showResult(win){
      const mine=(win===mg), order=TEAMS.slice().sort((a,b)=>(T[a].rank||9)-(T[b].rank||9)), champs=teamChars(win,5,mine);
      result.innerHTML=`<div class="tg-champ">
        <div class="tg-fanfare" id="rlCF"></div>
        <div class="champ-title" style="color:${GENC[win]}">🏆 ${GEN[win]} 우승!</div>
        <div class="champ-row">${champs.map((c,i)=>`<div class="gm-ch champ-ch ${i===2?'lift':''}">${i===2?'<div class="champ-trophy">🏆</div>':''}${buildChar(c,'cheer')}</div>`).join('')}</div>
        <div class="champ-sub">${mine?'우리 팀이 결승선을 가장 먼저 통과했어요! 🎊':GEN[win]+' 팀이 우승했어요'}</div>
        ${mine?`<div class="champ-badge">🏃 <b>계주의 달인</b> 칭호 획득!</div>`:''}
        <div class="gm-rrow">${order.map(g=>`<span class="gm-rpill" style="border-color:${GENC[g]}">${T[g].rank}. ${GEN[g]}${g===mg?' (우리)':''}</span>`).join('')}</div>
        <div class="gm-ract"><button class="btn hot" id="rlAgain">다시</button><button class="btn" id="rlDone">닫기</button></div>
      </div>`;
      result.classList.add('on'); confetti($('#rlCF'),GENC[win]);
      if(mine){ toast('🎉 우리 팀 우승! 「계주의 달인」 획득'); if(typeof awardTitle==='function')awardTitle('계주의 달인'); vib([20,60,20]); }
      $('#rlAgain').onclick=()=>{ov.close();startRelay();};
      $('#rlDone').onclick=ov.close;
    }

    /* 메인 루프 */
    ov.loop(t=>{
      if(killed)return;
      const dt=Math.min(.05,(t-last)/1000); last=t;
      cheer=Math.max(0,cheer*(1-CHEER_DECAY*dt)-0.02*dt);
      if(started&&!ended){
        TEAMS.forEach(g=>{
          const s=T[g]; if(s.finished)return;
          const humanRun=(g===mg&&s.leg===MY&&s.received);
          if(humanRun) s.u=Math.min(1,s.steps/STEPS);
          else s.u=Math.min(1,s.u+s.speed*dt*(0.8+Math.random()*0.4)*(g===mg?1+CHEER_MAX*cheer:1));
          if(s.leg===R-1&&s.u>=1){ s.finished=true; s.u=1; place++; s.rank=place; s.lapEvent=true; refresh(g);
            if(place===1)endRace(g); return; }
          if(s.leg<R-1&&!s.nextSpawned&&s.u>=SPAWN){ s.nextSpawned=true; s.nu=0; s.handoff=null; refresh(g); }
          if(s.nextSpawned){
            s.nu=Math.min(1,s.nu+0.5*s.speed*dt);
            s.canTouch=((1-s.u)+s.nu)<=GAP;
            const humanCur=(g===mg&&s.leg===MY&&s.received), humanNext=(g===mg&&s.leg===MY-1);
            if(s.handoff==null&&s.canTouch&&!humanCur){ s.handoff='touch'; s.htAt=t; }
            if(s.handoff==='touch'&&!humanNext&&t-s.htAt>350) completeHandoff(g);
          }
        });
      }
      /* 순위 */
      const key=g=>T[g].finished?(1000-T[g].rank):(T[g].leg+T[g].u);
      const order=TEAMS.slice().sort((a,b)=>key(b)-key(a));
      if(started&&!ended){
        const leader=order[0];
        if(T[leader].lapEvent) banner(`${GEN[leader]} 선두!`,'lead');
        TEAMS.forEach(g=>T[g].lapEvent=false);
        if(firstRank){ firstRank=false; prevOrder=order.slice(); }
        else { let i=0; while(i<R&&order[i]===prevOrder[i])i++;
          if(i<R&&t-lastOT>1500){ lastOT=t; banner(`${GEN[order[i]]}가 ${GEN[prevOrder[i]]}를 추월!!`,'ot'); }
          prevOrder=order.slice(); }
        ribbon.classList.toggle('on',T[leader].leg===R-1&&!T[leader].finished);
        if(T[leader].leg===R-1) ribbon.style.setProperty('--gc',GENC[leader]);
      }
      order.forEach((g,i)=>{ rankRow[g].style.transform=`translateY(${i*100}%)`;
        rankRow[g].querySelector('.rl-rkpos').textContent=i+1;
        rankRow[g].classList.toggle('lead',i===0); });
      TEAMS.forEach(positionTeam);

      /* 발/버튼 UI */
      const s=T[mg]; let phase;
      if(ended)phase='over'; else if(!started)phase='ready'; else if(handedOff)phase='spectate';
      else if(s.leg<MY)phase=s.nextSpawned?'receive':'wait';
      else if(s.leg===MY)phase=s.nextSpawned?'handoff':'run';
      else phase='spectate';
      bL.disabled=bR.disabled=!(phase==='run'||phase==='handoff');
      if(phase==='receive'){ act.hidden=false; act.textContent='🎽 바통 받기!'; act.classList.toggle('ready',s.handoff==='touch'); }
      else if(phase==='handoff'){ act.hidden=false; act.textContent='🎽 바통 터치!'; act.classList.toggle('ready',s.canTouch&&s.handoff==null); }
      else act.hidden=true;
      const canCheer=(phase==='wait'||phase==='spectate');
      cheerBtn.hidden=!canCheer;
      if(canCheer){ gauge.style.width=(cheer*100).toFixed(0)+'%';
        cheerLbl.textContent=cheer>0.02?`📣 응원하기! +${(CHEER_MAX*cheer*100).toFixed(0)}%`:'📣 응원하기!'; }
      hint.textContent = phase==='wait'?'앞 주자가 달리는 중 — 연타로 응원하면 더 빨라져요!'
        : phase==='receive'?'천천히 준비 주행 중 — 바통을 받으세요'
        : phase==='run'?'왼발·오른발 번갈아 질주!'
        : phase==='handoff'?'다음 주자에게 바통을 넘기세요'
        : phase==='spectate'?'바통 인계 완료 — 연타로 우리 팀을 응원하세요!'
        : phase==='over'?'경기 종료':'4팀이 동시에 출발합니다';
    });
  }

  /* ===================== 종목 메뉴 ===================== */
  function openMenu(){
    const bg=document.createElement('div'); bg.className='modalbg';
    bg.innerHTML=`<div class="modal">
      <div class="mhead">🎮 종목 선택<button class="x" id="gmX">✕</button></div>
      <div class="gm-pick"><button class="gm-card" id="gmTug"><span class="gm-ic">🪢</span>줄다리기<small>팀 연타 대결</small></button>
      <button class="gm-card" id="gmRelay"><span class="gm-ic">🏃</span>팀 계주<small>왼발·오른발 릴레이</small></button></div>
      <div class="gm-note">O/X 퀴즈는 월드의 퀴즈존에서 진행돼요</div>
    </div>`;
    document.body.appendChild(bg);
    const close=()=>bg.remove();
    bg.onclick=e=>{if(e.target===bg)close();};
    bg.querySelector('#gmX').onclick=close;
    bg.querySelector('#gmTug').onclick=()=>{close();startTug();};
    bg.querySelector('#gmRelay').onclick=()=>{close();startRelay();};
  }

  /* ===================== 스타일 ===================== */
  function css(){
    const s=document.createElement('style'); s.id='gm-css';
    s.textContent=`
    .gm-ov{position:fixed;inset:0;z-index:100;display:flex;flex-direction:column;color:var(--ink);
      background:radial-gradient(120% 90% at 80% -10%,rgba(255,122,89,.14),transparent 55%),
                 radial-gradient(120% 90% at -10% 0%,rgba(139,139,255,.14),transparent 55%),#14111d;
      padding:env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left);animation:fade .3s ease}
    .gm-top{display:flex;align-items:center;gap:10px;padding:12px 16px 6px}
    .gm-title{font-family:var(--display);font-size:22px}
    .gm-status{font-family:var(--round);font-size:13px;color:var(--mut)}
    .gm-close{margin-left:auto}
    .gm-stand{display:flex;flex-direction:column;gap:5px;padding:6px 16px}
    .gm-row{display:flex;align-items:center;gap:8px}
    .gm-row.me .gm-bar{box-shadow:0 0 0 1.5px rgba(255,122,89,.6)}
    .gm-tag{font-family:var(--round);font-size:11px;color:#15121f;padding:2px 8px;border-radius:9px;min-width:30px;text-align:center}
    .gm-bar{flex:1;height:13px;border-radius:8px;background:#241f37;overflow:hidden}
    .gm-fill{height:100%;width:0;border-radius:8px;transition:width .12s linear}
    .gm-num{font-family:var(--round);font-size:12px;color:var(--mut);min-width:38px;text-align:right}
    .gm-ch{width:52px;height:66px} .gm-ch svg{width:100%;height:100%;display:block}
    .gm-ch.flip svg{transform:scaleX(-1)}
    /* 결과 카드 */
    .gm-result{position:absolute;inset:0;display:none;align-items:center;justify-content:center;padding:16px;
      background:rgba(10,8,18,.72);backdrop-filter:blur(3px);z-index:20}
    .gm-result.on{display:flex;animation:fade .3s ease}
    .gm-rcard{width:min(94%,400px);background:#1b1730;border:1px solid #3a3352;border-radius:20px;padding:22px 18px;text-align:center}
    .gm-rwin{font-family:var(--display);font-size:30px}
    .gm-rsub{font-family:var(--round);font-size:13px;color:var(--mut);margin-top:8px;line-height:1.5}
    .gm-rrow{display:flex;flex-wrap:wrap;gap:6px;justify-content:center;margin:14px 0}
    .gm-rpill{font-family:var(--round);font-size:12px;padding:5px 10px;border-radius:14px;border:1.5px solid #3a3352;background:#241f37}
    .gm-ract{display:flex;gap:8px;justify-content:center;margin-top:6px}
    .gm-ract .btn{padding:11px 20px;font-size:15px}

    /* 줄다리기 토너먼트 */
    .tg-stage{flex:1;min-height:0;display:flex;flex-direction:column;position:relative}
    /* 남은 시간(화면 상단 가운데) */
    .tg-timer{position:absolute;top:8px;left:50%;transform:translateX(-50%);z-index:26;
      font-family:var(--display);font-size:34px;line-height:1.1;color:#fff;min-width:60px;text-align:center;
      padding:4px 18px;border-radius:16px;background:rgba(10,8,18,.62);box-shadow:0 4px 14px -4px rgba(0,0,0,.6);
      text-shadow:0 2px 6px rgba(0,0,0,.6);pointer-events:none}
    .tg-timer:empty{display:none}
    .tg-timer.low{color:#ff6b6b;animation:tgtick .5s ease infinite alternate}
    @keyframes tgtick{from{transform:translateX(-50%) scale(1)}to{transform:translateX(-50%) scale(1.14)}}
    /* 대진표 */
    .tg-bracket{display:flex;align-items:center;gap:6px;padding:8px 16px 2px;justify-content:center}
    .brcol{display:flex;flex-direction:column;gap:8px}
    .brmatch{display:flex;flex-direction:column;gap:3px;padding:4px;border-radius:10px;border:1.5px solid #2f2947;background:#1b1730;transition:.2s}
    .brmatch.live{border-color:var(--hot);box-shadow:0 0 12px -2px rgba(255,122,89,.6)}
    .brc-wrap{transition:.3s}
    .brc-wrap.lost{opacity:.32;filter:grayscale(.6)}
    .brc-wrap.won .brc{box-shadow:0 0 0 2px #ffd54a inset}
    .brc{display:flex;align-items:center;justify-content:center;min-width:44px;height:22px;border-radius:7px;background:#241f37}
    .brc b{font-family:var(--round);font-size:11px;color:#15121f;padding:2px 8px;border-radius:6px;font-weight:700}
    .brc.empty{color:var(--mut);font-family:var(--round);font-size:13px}
    .brc.mine{outline:1.5px dashed rgba(255,122,89,.8);outline-offset:1px}
    .brline{width:16px;height:2px;background:#3a3352}
    .brtrophy{font-size:26px;filter:grayscale(1) opacity(.4);transition:.4s}
    .brtrophy.on{filter:drop-shadow(0 0 8px var(--gc));transform:scale(1.15)}
    /* VS 인트로 */
    .tg-vs{position:absolute;inset:0;z-index:30;display:flex;align-items:center;justify-content:center;overflow:hidden;
      background:radial-gradient(circle at 50% 50%,rgba(0,0,0,.5),rgba(0,0,0,.85))}
    .tg-vs.out{animation:vsout .38s ease forwards}
    @keyframes vsout{to{opacity:0;transform:scale(1.1)}}
    .vs-side{flex:1;display:flex;align-items:center;font-family:var(--display);font-size:min(15vw,64px);color:#fff;
      height:38%;background:linear-gradient(90deg,var(--c),transparent);text-shadow:0 4px 12px rgba(0,0,0,.6)}
    .vs-side.vs-l{justify-content:flex-start;padding-left:8%;animation:vsl .5s cubic-bezier(.2,1.3,.4,1)}
    .vs-side.vs-r{justify-content:flex-end;padding-right:8%;background:linear-gradient(270deg,var(--c),transparent);animation:vsr .5s cubic-bezier(.2,1.3,.4,1)}
    @keyframes vsl{from{transform:translateX(-120%)}to{transform:translateX(0)}}
    @keyframes vsr{from{transform:translateX(120%)}to{transform:translateX(0)}}
    .vs-mid{position:absolute;font-family:var(--display);font-size:min(16vw,72px);color:#ffd54a;z-index:2;
      text-shadow:0 0 18px rgba(255,120,60,.9),0 4px 8px rgba(0,0,0,.7);animation:vsmid .6s cubic-bezier(.2,1.6,.4,1)}
    @keyframes vsmid{0%{transform:scale(0) rotate(-25deg);opacity:0}60%{transform:scale(1.3) rotate(8deg)}100%{transform:scale(1) rotate(0);opacity:1}}
    /* 아레나 */
    .tg-arena{position:relative;flex:1;min-height:0;margin:8px 12px;border-radius:18px;overflow:hidden;
      background:linear-gradient(180deg,#3a7a55,#2a5c42);box-shadow:inset 0 0 80px rgba(0,0,0,.4)}
    .tg-center{position:absolute;left:50%;top:0;bottom:0;width:2px;background:rgba(255,255,255,.25);transform:translateX(-50%)}
    .tg-rope{position:absolute;left:4%;right:4%;top:50%;height:7px;transform:translateY(-50%);border-radius:4px;
      background:repeating-linear-gradient(90deg,#d9a55b,#d9a55b 8px,#b5843f 8px,#b5843f 16px);box-shadow:0 2px 6px rgba(0,0,0,.4)}
    .tg-badge{position:absolute;top:10px;font-family:var(--round);font-size:12px;font-weight:700;color:#15121f;padding:3px 10px;border-radius:10px;z-index:5}
    .tg-badge.tg-bl{left:12px} .tg-badge.tg-br{right:12px}
    .tg-knot{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-size:30px;transition:left .12s linear;z-index:4;filter:drop-shadow(0 3px 4px rgba(0,0,0,.5))}
    .tg-side{position:absolute;top:50%;display:flex;align-items:flex-end;z-index:3;
      transform:translateY(-50%) translateX(calc(var(--pull,0) * -16px));transition:transform .12s linear}
    .tg-side.left{left:5%} .tg-side.right{right:5%}
    .tg-fighter{display:flex;flex-direction:column;align-items:center;margin:0 -5px}
    .tg-name{margin-top:1px;font-family:var(--round);font-size:9px;color:#fff;background:rgba(0,0,0,.42);
      padding:1px 5px;border-radius:6px;max-width:58px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .tg-side .gm-ch{width:46px;height:60px;transition:transform .3s,filter .3s}
    .gm-ch.grit svg{animation:tgshake .18s ease infinite}
    @keyframes tgshake{0%,100%{transform:translateY(0)}50%{transform:translateY(-1.5px)}}
    .gm-ch.cheer{animation:tgjump .55s ease infinite}
    @keyframes tgjump{0%,100%{transform:translateY(0)}30%{transform:translateY(-16px)}55%{transform:translateY(-3px)}}
    .gm-ch.sad{transform:translateY(8px) rotate(4deg)!important;filter:grayscale(.4) brightness(.82)}
    .gm-ch.sad.flip{transform:translateY(8px) rotate(-4deg)!important}
    .tg-plus{position:absolute;font-family:var(--display);font-size:20px;color:#fff;opacity:.9;pointer-events:none;
      animation:tgup .6s ease forwards;z-index:5}
    @keyframes tgup{from{transform:translateY(0);opacity:.9}to{transform:translateY(-60px);opacity:0}}
    .tg-fanfare{position:fixed;inset:0;pointer-events:none;z-index:50;overflow:hidden}
    .confetti{position:absolute;top:-16px;width:8px;height:12px;border-radius:2px;opacity:.95;animation:confall linear forwards}
    @keyframes confall{to{transform:translate(var(--dx,0),102vh) rotate(540deg);opacity:.25}}
    .tg-foot{padding:8px 16px 16px;display:flex;flex-direction:column;align-items:center;gap:8px}
    .tg-mine{font-family:var(--round);font-size:14px;color:var(--mut)} .tg-mine b{color:var(--ink);font-size:18px}
    .tg-spectate{font-family:var(--round);font-size:15px;color:var(--mut);padding:20px 0}
    .tg-mash{width:100%;max-width:460px;border:none;border-radius:22px;padding:26px;cursor:pointer;user-select:none;
      font-family:var(--display);font-size:32px;color:#fff;background:var(--tc);box-shadow:0 12px 26px -8px rgba(0,0,0,.6);
      display:flex;flex-direction:column;gap:2px;align-items:center;transition:transform .05s}
    .tg-mash small{font-family:var(--round);font-size:13px;opacity:.85;color:#fff}
    .tg-mash.hit{transform:scale(.95)}
    /* 우승 세리머니 */
    .tg-champ{flex:1;min-height:0;position:relative;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;padding:16px;text-align:center}
    .champ-title{font-family:var(--display);font-size:34px;animation:vsmid .6s cubic-bezier(.2,1.6,.4,1)}
    .champ-row{display:flex;align-items:flex-end;justify-content:center;gap:2px}
    .champ-ch{width:56px;height:72px;position:relative}
    .champ-ch.lift{width:72px;height:92px;animation:liftup 1.1s ease infinite alternate}
    @keyframes liftup{from{transform:translateY(2px)}to{transform:translateY(-12px)}}
    .champ-trophy{position:absolute;top:-24px;left:50%;transform:translateX(-50%);font-size:30px;z-index:2;
      filter:drop-shadow(0 0 8px rgba(255,213,74,.9));animation:trophysh .9s ease infinite alternate}
    @keyframes trophysh{from{filter:drop-shadow(0 0 5px rgba(255,213,74,.6))}to{filter:drop-shadow(0 0 14px rgba(255,213,74,1))}}
    .champ-sub{font-family:var(--round);font-size:14px;color:var(--mut)}
    .champ-badge{font-family:var(--round);font-size:15px;color:#ffd54a;background:rgba(255,213,74,.12);
      border:1px solid rgba(255,213,74,.4);padding:8px 16px;border-radius:14px;animation:ttlpop .5s ease}
    @keyframes ttlpop{from{transform:scale(.6);opacity:0}to{transform:scale(1);opacity:1}}

    /* 계주(오벌 트랙) */
    .rl-arena{--tilt:26deg;position:relative;flex:1;min-height:0;margin:4px 6px;border-radius:18px;overflow:hidden;background:#1d2a33;
      box-shadow:inset 0 0 70px rgba(0,0,0,.4);perspective:820px;perspective-origin:50% 42%}
    /* 트랙 평면 — SVG와 러너를 함께 기울여 % 좌표 정합을 유지한 채 '관중석 시점'을 만든다 */
    .rl-world{position:absolute;inset:0;transform-style:preserve-3d;transform:rotateX(var(--tilt)) scale(.93);transform-origin:50% 52%}
    .rl-svg{position:absolute;inset:0;width:100%;height:100%}
    .rl-runners{position:absolute;inset:0;pointer-events:none;transform-style:preserve-3d}
    /* 러너는 지면에 발을 두고 역회전(빌보드)시켜 세워 둔다 */
    .rl-run{position:absolute;width:19px;height:24px;transform-origin:50% 100%;
      transform:translate(-50%,-100%) rotateX(calc(-1 * var(--tilt)));transition:left .1s linear,top .1s linear}
    .rl-run .gm-ch{width:19px;height:24px}
    .rl-run.flip .gm-ch svg{transform:scaleX(-1)}
    .rl-run.next{opacity:.55}
    .rl-run.mine .gm-ch{filter:drop-shadow(0 0 3px rgba(255,255,255,.95))}
    .rl-run.mine::before{content:'▼';position:absolute;left:50%;top:-13px;transform:translateX(-50%);
      font-size:11px;line-height:1;color:#fff;text-shadow:0 1px 3px rgba(0,0,0,.85)}
    .rl-run.hop{animation:rlhop .18s ease}
    @keyframes rlhop{0%,100%{transform:translate(-50%,-100%) rotateX(calc(-1 * var(--tilt)))}
      50%{transform:translate(-50%,-118%) rotateX(calc(-1 * var(--tilt)))}}
    /* 결승선 띠 */
    .rl-ribbon{position:absolute;left:50%;top:7%;height:13px;transform-origin:center;
      transform:translate(-50%,-50%) rotateX(calc(-1 * var(--tilt))) rotate(var(--rz,0deg)) scaleX(0);
      background:repeating-linear-gradient(45deg,var(--gc,#fff),var(--gc,#fff) 8px,#fff 8px,#fff 16px);
      border-radius:3px;z-index:5;opacity:0;transition:transform .4s ease,opacity .3s;box-shadow:0 2px 8px rgba(0,0,0,.4);
      display:flex;align-items:center;justify-content:center}
    .rl-ribbon span{font-family:var(--display);font-size:9px;color:#15121f;background:rgba(255,255,255,.85);padding:0 4px;border-radius:3px;letter-spacing:1px}
    .rl-ribbon.on{opacity:1;transform:translate(-50%,-50%) rotateX(calc(-1 * var(--tilt))) rotate(var(--rz,0deg)) scaleX(1)}
    /* 순위 배너(우→좌) */
    .rl-banner-wrap{position:absolute;left:0;right:0;top:10px;height:36px;overflow:hidden;pointer-events:none;z-index:7}
    .rl-banner{position:absolute;white-space:nowrap;font-family:var(--display);font-size:19px;color:#fff;left:100%;
      padding:5px 16px;border-radius:14px;background:rgba(10,8,18,.7);text-shadow:0 2px 6px rgba(0,0,0,.6);
      animation:rlbannermove 2.4s linear forwards}
    .rl-banner.ot{color:#ffd54a} .rl-banner.lead{color:#7cffb2}
    @keyframes rlbannermove{from{transform:translateX(0)}to{transform:translateX(calc(-100vw - 100%))}}
    /* 좌상단 주자 초상 */
    /* 트랙(특히 좌측 직선)을 가리지 않도록 작고 반투명하게 */
    .rl-portraits{position:absolute;left:5px;top:6px;display:flex;flex-direction:column;gap:3px;z-index:6}
    .rl-pcard{display:flex;align-items:center;gap:4px;background:rgba(12,10,20,.46);border-left:2.5px solid var(--gc);
      border-radius:9px;padding:2px 5px 2px 4px;backdrop-filter:blur(2px)}
    .rl-pcard.me{background:rgba(12,10,20,.68);box-shadow:0 0 0 1.5px rgba(255,255,255,.55)}
    .rl-ptag{font-family:var(--round);font-size:8px;color:#15121f;padding:1px 4px;border-radius:5px}
    .rl-pruns{display:flex;flex-direction:column;gap:1px}
    .rl-prow{display:flex;align-items:center;gap:2px}
    .rl-prow.next{opacity:.5}
    .rl-pav{width:17px;height:20px;overflow:hidden}
    .rl-pav .gm-ch{width:17px;height:20px}
    .rl-pnm{font-family:var(--round);font-size:9px;color:#fff;max-width:42px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    /* 우상단 순위표 */
    .rl-rank{position:absolute;right:6px;top:6px;width:68px;height:92px;z-index:6}
    .rl-rankrow{position:absolute;left:0;right:0;height:21px;display:flex;align-items:center;gap:4px;
      background:rgba(12,10,20,.55);border-radius:8px;padding:0 6px;transition:transform .4s cubic-bezier(.4,1.4,.5,1);backdrop-filter:blur(2px)}
    .rl-rankrow.me{box-shadow:0 0 0 1.5px rgba(255,255,255,.5)}
    .rl-rankrow.lead{background:rgba(255,213,74,.22)}
    .rl-rkpos{font-family:var(--display);font-size:14px;color:#fff;min-width:14px;text-align:center}
    .rl-rankrow.lead .rl-rkpos{color:#ffd54a}
    .rl-rktag{font-family:var(--round);font-size:10px;color:#15121f;padding:1px 6px;border-radius:6px}
    /* 카운트다운 */
    .rl-count{position:absolute;inset:0;display:none;align-items:center;justify-content:center;z-index:12;
      font-family:var(--display);font-size:90px;color:#fff;text-shadow:0 6px 20px rgba(0,0,0,.6);background:rgba(6,5,12,.35)}
    .rl-count.on{display:flex} .rl-count.go{font-size:64px;color:#ffd54a}
    .rl-count.pop{animation:rlpop .4s ease}
    @keyframes rlpop{from{transform:scale(1.6);opacity:.2}to{transform:scale(1);opacity:1}}
    /* 하단 컨트롤 */
    .rl-foot{display:flex;flex-direction:column;gap:8px;padding:8px 16px 16px}
    .rl-hint{font-family:var(--round);font-size:12px;color:var(--mut);text-align:center;min-height:15px}
    .rl-act{border:none;border-radius:18px;padding:14px;cursor:pointer;user-select:none;font-family:var(--display);font-size:22px;color:#221206;
      background:linear-gradient(100deg,#ffd54a,#ffb454);box-shadow:0 8px 20px -8px rgba(0,0,0,.5);transition:transform .06s,filter .1s}
    .rl-act:not(.ready){filter:grayscale(.6) brightness(.62);cursor:not-allowed}
    .rl-act.ready{animation:rlactpulse .7s ease infinite alternate}
    .rl-act.ready:active{transform:scale(.97)}
    @keyframes rlactpulse{from{transform:scale(1)}to{transform:scale(1.03)}}
    /* 응원 버튼(내 차례가 아닐 때) */
    .rl-cheer{position:relative;border:none;border-radius:18px;padding:13px 14px 17px;cursor:pointer;user-select:none;overflow:hidden;
      font-family:var(--display);font-size:20px;color:#0d2b1d;background:linear-gradient(100deg,#8bffbe,#48d69b);
      box-shadow:0 8px 20px -8px rgba(0,0,0,.5);transition:transform .06s}
    .rl-cheer:active{transform:scale(.97)}
    .rl-cheer i{position:absolute;left:12px;right:12px;bottom:7px;height:4px;border-radius:3px;background:rgba(0,0,0,.2);display:block}
    .rl-cheer i b{display:block;height:100%;width:0;border-radius:3px;background:#0d2b1d;transition:width .12s linear}
    .rl-cheer.pump{animation:rlpump .18s ease}
    @keyframes rlpump{50%{transform:scale(1.04)}}
    .rl-feet{display:flex;gap:12px}
    .rl-ftbtn{flex:1;border:none;border-radius:20px;padding:22px 0;cursor:pointer;user-select:none;
      font-family:var(--round);font-size:32px;color:#221206;background:linear-gradient(100deg,var(--hot),var(--hot2));
      box-shadow:0 10px 22px -8px rgba(0,0,0,.5);display:flex;flex-direction:column;align-items:center;gap:2px;transition:transform .05s,filter .1s}
    .rl-ftbtn small{font-family:var(--round);font-size:14px}
    .rl-ftbtn:disabled{filter:grayscale(.7) brightness(.6);cursor:not-allowed}
    .rl-ftbtn.nextfoot:not(:disabled){outline:3px solid #fff;outline-offset:-3px}
    .rl-ftbtn.bad{background:#ff5c5c;transform:translateX(-4px)}
    .rl-ftbtn:active:not(:disabled){transform:scale(.96)}

    /* 메뉴 */
    .gm-pick{display:flex;gap:10px;margin-top:16px}
    .gm-card{flex:1;border:1.5px solid #3a3352;background:#241f37;color:var(--ink);border-radius:16px;padding:20px 10px;cursor:pointer;
      font-family:var(--round);font-size:16px;display:flex;flex-direction:column;align-items:center;gap:4px;transition:.15s}
    .gm-card:active{transform:scale(.97);border-color:var(--hot)}
    .gm-card .gm-ic{font-size:38px}
    .gm-card small{font-family:var(--body);font-size:12px;color:var(--mut)}
    .gm-note{font-family:var(--round);font-size:12px;color:var(--mut);text-align:center;margin-top:14px}`;
    document.head.appendChild(s);
  }
  css();
  window.Games={startTug,startRelay,openMenu};
})();
