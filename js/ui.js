/* ================= INTERFACE ================= */
const SCREENS = ["inicio","clientes","mercado","scouting","clubes","ligas","ofertas","financas","premios","noticias","config"];
const SCREEN_LABEL = {inicio:"🏠 Início",clientes:"👥 Clientes",mercado:"🔎 Mercado",scouting:"🧭 Scouting",clubes:"🏟️ Clubes",ligas:"🏆 Ligas",ofertas:"📨 Ofertas",financas:"💰 Financeiro",premios:"🥇 Prêmios",noticias:"📰 FA News",config:"⚙️ Config"};

function toast(msg, bad){
  const wrap = document.getElementById("toastWrap");
  const el = document.createElement("div");
  el.className = "toast"+(bad?" bad":"");
  el.textContent = msg;
  wrap.appendChild(el);
  setTimeout(()=>el.remove(),3600);
}

function openModal(html){
  const ov = document.getElementById("overlay");
  document.getElementById("modalBody").innerHTML = html;
  ov.classList.add("show");
}
function closeModal(){ document.getElementById("overlay").classList.remove("show"); }

function refreshChrome(){
  document.getElementById("agentNameTop").textContent = G.agent.name;
  document.getElementById("agentRepTop").textContent = `Reputação ${G.agent.reputation} • Nível ${G.agent.tier}`;
  document.getElementById("agentMoneyTop").textContent = fmtMoney(G.agent.money);
}

function goScreen(id){
  SCREENS.forEach(s=>{
    document.getElementById("scr-"+s).style.display = s===id? "block":"none";
  });
  document.querySelectorAll("[data-nav]").forEach(btn=>{
    btn.classList.toggle("active", btn.getAttribute("data-nav")===id);
  });
  window.scrollTo(0,0);
  const renderFn = window["render_"+id];
  if(renderFn) renderFn();
  refreshChrome();
}

/* -------- componentes reutilizáveis -------- */
function playerCard(p, opts){
  opts = opts||{};
  const club = p.clubId? getClub(p.clubId): null;
  return `<div class="player">
    <div class="ovr">${p.ovr}</div>
    <div class="face">${p.flag||"⚽"}</div>
    <div class="pname">${p.name}</div>
    <div class="meta">${POS_GROUP[p.pos]||p.pos} • ${p.age} anos</div>
    <div class="meta">${club? club.name : (p.loanActive? "Empréstimo": "Sem clube")}</div>
    <div class="value">${fmtMoney(p.value)}</div>
    ${p.isClient?'<span class="tag-client">MEU CLIENTE</span>':""}
    <button class="view" onclick="openPlayerModal('${p.id}')">Ver perfil</button>
  </div>`;
}

function playerRow(p){
  const club = p.clubId? getClub(p.clubId): null;
  return `<tr onclick="openPlayerModal('${p.id}')" style="cursor:pointer">
    <td><b>${p.flag}</b> ${p.name} ${p.isClient?'<span class="badge green">CLIENTE</span>':''}</td>
    <td>${p.pos}</td><td>${p.age}</td><td>${p.ovr}</td><td>${p.pot}</td>
    <td>${club?club.name:"—"}</td><td>${fmtMoney(p.value)}</td>
  </tr>`;
}

/* ================= DASHBOARD ================= */
function render_inicio(){
  const el = document.getElementById("scr-inicio");
  const clients = clientPlayers();
  const pendingOffers = G.offers.filter(o=>o.status==="pending_agent"||o.status==="countered").length;
  const highlight = clients.slice().sort((a,b)=>b.ovr-a.ovr).slice(0,8);
  const news = G.news.slice(0,5);
  const nextFixtures = [];
  G.leagues.forEach(l=>{ l.fixtures.filter(f=>f.round===G.meta.week && !f.played).slice(0,2).forEach(f=>nextFixtures.push({l,f})); });

  el.innerHTML = `
  <div class="welcome">
    <div><div class="eyebrow">Escritório • ${G.agent.city}</div>
    <h1>Bem-vindo, ${G.agent.name}.</h1>
    <div class="date">Temporada ${G.meta.seasonYear}/${(G.meta.seasonYear+1).toString().slice(2)} • Semana ${G.meta.week} de ${G.meta.totalWeeks}</div></div>
    <button class="btn" onclick="doAdvanceWeek()">⏭ Avançar semana</button>
  </div>
  <div class="grid">
    <div class="card"><h2>Visão geral da carreira</h2><div class="stats">
      <div class="stat"><b>${G.agent.reputation}</b><span>REPUTAÇÃO (Nv.${G.agent.tier})</span></div>
      <div class="stat"><b>${fmtMoney(G.agent.money)}</b><span>SALDO</span></div>
      <div class="stat"><b>${clients.length}</b><span>JOGADORES</span></div>
      <div class="stat"><b>${pendingOffers}</b><span>PROPOSTAS ATIVAS</span></div>
      <div class="stat"><b>${G.employees.filter(e=>e.type==='scout').length}</b><span>SCOUTS</span></div>
      <div class="stat"><b>${G.employees.length}</b><span>FUNCIONÁRIOS</span></div>
      <div class="stat"><b>${G.meta.seasonYear}</b><span>TEMPORADA</span></div>
      <div class="stat"><b>${G.meta.week}/${G.meta.totalWeeks}</b><span>SEMANA</span></div>
    </div></div>
    <div class="card"><h2>FA News <small>últimas notícias</small></h2><div class="news">
      ${news.length? news.map(n=>`<article><strong>${n.title}</strong><p>${n.body}</p><time>Sem. ${n.week} • ${n.year}</time></article>`).join(""): '<div class="empty">Nenhuma notícia ainda.</div>'}
    </div></div>
  </div>
  <div class="card" style="margin-top:18px"><h2>Próximos jogos <small>rodada atual</small></h2>
    ${nextFixtures.length? nextFixtures.map(x=>`<div class="list-item"><div class="info"><b>${getClub(x.f.home)?.name} x ${getClub(x.f.away)?.name}</b><span>${x.l.name}</span></div><span class="badge muted">Semana ${x.f.round}</span></div>`).join(""): '<div class="empty">Sem jogos pendentes nesta semana.</div>'}
  </div>
  <div class="card market" style="margin-top:18px"><h2>Meus jogadores em destaque</h2>
    <div class="players">${highlight.length? highlight.map(p=>playerCard(p)).join(""): '<div class="empty">Você ainda não representa nenhum jogador. Visite o Mercado ou o Scouting.</div>'}</div>
  </div>`;
}

function doAdvanceWeek(){
  advanceWeek();
  toast("Semana avançada. Confira as novidades no FA News.");
  goScreen("inicio");
}

/* ================= CLIENTES ================= */
function render_clientes(){
  const el = document.getElementById("scr-clientes");
  const clients = clientPlayers();
  el.innerHTML = `
  <div class="section-title">Meus clientes (${clients.length})</div>
  <div class="card">
    ${clients.length? `<table class="tbl"><thead><tr><th>Nome</th><th>Pos</th><th>Idade</th><th>OVR</th><th>POT</th><th>Clube</th><th>Valor</th></tr></thead>
    <tbody>${clients.map(playerRow).join("")}</tbody></table>` : '<div class="empty">Você ainda não tem clientes. Assine jogadores livres no Mercado ou descubra talentos no Scouting.</div>'}
  </div>`;
}

/* ================= MERCADO ================= */
function render_mercado(){
  const el = document.getElementById("scr-mercado");
  el.innerHTML = `
  <div class="section-title">Mercado de transferências</div>
  <div class="card">
    <div class="filters">
      <input id="mSearch" placeholder="Pesquisar jogador..." oninput="renderMarketList()">
      <select id="mPos" onchange="renderMarketList()"><option value="">Todas posições</option>${POSITIONS.map(p=>`<option value="${p}">${p}</option>`).join("")}</select>
      <select id="mAge" onchange="renderMarketList()"><option value="">Qualquer idade</option><option value="u21">Até 21</option><option value="u27">Até 27</option><option value="o30">30+</option></select>
      <select id="mOvr" onchange="renderMarketList()"><option value="">Qualquer nível</option><option value="70">OVR 70+</option><option value="80">OVR 80+</option><option value="85">OVR 85+</option></select>
      <select id="mSort" onchange="renderMarketList()"><option value="ovr">Ordenar por OVR</option><option value="pot">Potencial</option><option value="value">Valor</option><option value="age">Idade</option></select>
    </div>
    <div class="players" id="marketPlayers"></div>
  </div>`;
  renderMarketList();
}
function renderMarketList(){
  const q=(document.getElementById("mSearch")?.value||"").toLowerCase();
  const pos=document.getElementById("mPos")?.value||"";
  const ageF=document.getElementById("mAge")?.value||"";
  const ovrF=document.getElementById("mOvr")?.value||"";
  const sort=document.getElementById("mSort")?.value||"ovr";
  let list = G.players.filter(p=>p.clubId && !p.isClient);
  if(q) list = list.filter(p=>p.name.toLowerCase().includes(q));
  if(pos) list = list.filter(p=>p.pos===pos);
  if(ageF==="u21") list=list.filter(p=>p.age<=21);
  if(ageF==="u27") list=list.filter(p=>p.age<=27);
  if(ageF==="o30") list=list.filter(p=>p.age>=30);
  if(ovrF) list=list.filter(p=>p.ovr>=parseInt(ovrF));
  list.sort((a,b)=> sort==="age"? a.age-b.age : b[sort]-a[sort]);
  document.getElementById("marketPlayers").innerHTML = list.slice(0,60).map(p=>playerCard(p)).join("") || '<div class="empty">Nenhum jogador encontrado com esses filtros.</div>';
}

/* ================= SCOUTING ================= */
function render_scouting(){
  const el = document.getElementById("scr-scouting");
  const scouts = G.employees.filter(e=>e.type==="scout");
  const active = G.scoutMissions.filter(m=>!m.done);
  const pool = G.scoutedPool.map(getPlayer).filter(p=>p && !p.isClient && !p.clubId);
  el.innerHTML = `
  <div class="section-title">Scouting</div>
  <div class="grid2">
    <div class="card"><h2>Seus scouts</h2>
      ${scouts.length? scouts.map(s=>`<div class="list-item"><div class="info"><b>${s.name}</b><span>${s.busy?"Em missão":"Disponível"} • custo semanal ${fmtMoney(s.weeklyCost)}</span></div>
      <div class="row">${!s.busy?`<button class="btn small" onclick="openScoutMissionModal('${s.id}')">Enviar</button>`:""}<button class="btn small secondary" onclick="doUpgradeEmployee('${s.id}')">Treinar</button></div></div>`).join(""):'<div class="empty">Nenhum scout contratado.</div>'}
      <button class="btn secondary" style="margin-top:10px" onclick="doHireEmployee('scout')">+ Contratar novo scout</button>
    </div>
    <div class="card"><h2>Missões ativas</h2>
      ${active.length? active.map(m=>{const r=REGIONS.find(x=>x.id===m.regionId);return `<div class="list-item"><div class="info"><b>${r?.flag||""} ${r?.name||""}</b><span>Foco: ${focusLabel(m.focus)} • faltam ${m.weeksLeft} semana(s)</span></div></div>`}).join(""):'<div class="empty">Nenhuma missão em andamento.</div>'}
    </div>
  </div>
  <div class="card" style="margin-top:18px"><h2>Jogadores descobertos</h2>
    <div class="players">${pool.length? pool.map(p=>playerCard(p)).join(""):'<div class="empty">Nenhum jogador descoberto ainda. Envie um scout em missão.</div>'}</div>
  </div>`;
}
function openScoutMissionModal(scoutId){
  openModal(`<button class="close" onclick="closeModal()">✕</button>
  <h3>Enviar scout em missão</h3><div class="sub">Escolha a região e o foco da busca.</div>
  <div class="field"><label>Região</label><select id="regSel">${REGIONS.map(r=>`<option value="${r.id}">${r.flag} ${r.name} — ${fmtMoney(r.cost)}</option>`).join("")}</select></div>
  <div class="field"><label>Foco</label><select id="focusSel"><option value="qualquer">Qualquer talento</option><option value="jovens">Jovens promessas</option><option value="GOL">Goleiros</option><option value="ZAG">Zagueiros</option><option value="MEI">Meias</option><option value="CA">Atacantes</option></select></div>
  <button class="btn" onclick="doStartMission('${scoutId}')">Enviar scout</button>`);
}
function doStartMission(scoutId){
  const region = document.getElementById("regSel").value;
  const focus = document.getElementById("focusSel").value;
  const r = startScoutMission(scoutId, region, focus);
  if(!r.ok){ toast(r.reason||"Não foi possível iniciar a missão.", true); return; }
  toast("Scout enviado em missão.");
  closeModal(); goScreen("scouting");
}
function doHireEmployee(type){
  const r = hireEmployee(type);
  if(!r.ok){ toast(r.reason||"Não foi possível contratar.", true); return; }
  toast(`${r.emp.name} contratado.`);
  goScreen(document.querySelector(".active[data-nav]")?.getAttribute("data-nav")||"scouting");
}
function doUpgradeEmployee(id){
  const r = upgradeEmployee(id);
  if(!r.ok){ toast(r.reason||"Não foi possível treinar.", true); return; }
  toast("Funcionário treinado com sucesso.");
  goScreen(document.querySelector(".active[data-nav]")?.getAttribute("data-nav")||"scouting");
}

/* ================= CLUBES ================= */
function render_clubes(){
  const el = document.getElementById("scr-clubes");
  el.innerHTML = `<div class="section-title">Clubes</div>
  <div class="card"><div class="filters"><select id="clLeague" onchange="renderClubList()"><option value="">Todas as ligas</option>${G.leagues.map(l=>`<option value="${l.id}">${l.name}</option>`).join("")}</select></div>
  <div id="clubList"></div></div>`;
  renderClubList();
}
function renderClubList(){
  const lf = document.getElementById("clLeague")?.value||"";
  const list = G.clubs.filter(c=>!lf||c.leagueId===lf).sort((a,b)=>b.reputation-a.reputation);
  document.getElementById("clubList").innerHTML = list.map(c=>`<div class="list-item" onclick="openClubModal('${c.id}')" style="cursor:pointer">
    <div class="info"><b>${c.name}</b><span>${getLeague(c.leagueId)?.name} • Reputação ${c.reputation} • ${c.squadIds.length} jogadores</span></div>
    <span class="badge gold">${fmtMoney(c.budget)}</span></div>`).join("");
}
function openClubModal(clubId){
  const c = getClub(clubId);
  const squad = c.squadIds.map(getPlayer).filter(Boolean).sort((a,b)=>b.ovr-a.ovr);
  openModal(`<button class="close" onclick="closeModal()">✕</button>
  <h3>${c.name}</h3><div class="sub">${getLeague(c.leagueId)?.name} • Estádio ${c.stadium}</div>
  <div class="row" style="margin-bottom:12px">
    <span class="badge blue">Reputação ${c.reputation}</span>
    <span class="badge gold">${fmtMoney(c.budget)} orçamento</span>
    <span class="badge muted">${c.titles.length} título(s)</span>
  </div>
  <table class="tbl"><thead><tr><th>Nome</th><th>Pos</th><th>Idade</th><th>OVR</th><th>Valor</th></tr></thead>
  <tbody>${squad.map(p=>`<tr onclick="openPlayerModal('${p.id}')" style="cursor:pointer"><td>${p.flag} ${p.name}</td><td>${p.pos}</td><td>${p.age}</td><td>${p.ovr}</td><td>${fmtMoney(p.value)}</td></tr>`).join("")}</tbody></table>`);
}

/* ================= LIGAS ================= */
function render_ligas(){
  const el = document.getElementById("scr-ligas");
  el.innerHTML = `<div class="section-title">Ligas e competições</div>
  <div class="tabs-inline" id="ligaTabs">${G.leagues.map((l,i)=>`<button class="${i===0?'active':''}" onclick="selectLeagueTab('${l.id}',this)">${l.flag} ${l.name}</button>`).join("")}</div>
  <div id="ligaContent"></div>`;
  selectLeagueTab(G.leagues[0].id);
}
function selectLeagueTab(leagueId, btn){
  if(btn){document.querySelectorAll("#ligaTabs button").forEach(b=>b.classList.remove("active"));btn.classList.add("active");}
  const league = getLeague(leagueId);
  const table = league.clubIds.map(getClub).sort((a,b)=> b.points-a.points || (b.gf-b.ga)-(a.gf-a.ga));
  const scorers = G.players.filter(p=> league.clubIds.includes(p.clubId)).sort((a,b)=>b.seasonGoals-a.seasonGoals).slice(0,8);
  document.getElementById("ligaContent").innerHTML = `
  <div class="grid2">
    <div class="card"><h2>Classificação</h2><table class="tbl"><thead><tr><th>#</th><th>Clube</th><th>P</th><th>J</th><th>V</th><th>E</th><th>D</th><th>SG</th></tr></thead>
    <tbody>${table.map((c,i)=>`<tr onclick="openClubModal('${c.id}')" style="cursor:pointer"><td>${i+1}</td><td>${c.name}</td><td><b>${c.points}</b></td><td>${c.played}</td><td>${c.wins}</td><td>${c.draws}</td><td>${c.losses}</td><td>${c.gf-c.ga}</td></tr>`).join("")}</tbody></table></div>
    <div class="card"><h2>Artilharia</h2>${scorers.length? scorers.map(p=>`<div class="list-item"><div class="info"><b>${p.flag} ${p.name}</b><span>${getClub(p.clubId)?.name}</span></div><span class="badge green">${p.seasonGoals} gols</span></div>`).join(""):'<div class="empty">Nenhum gol registrado ainda nesta temporada.</div>'}</div>
  </div>`;
}

/* ================= OFERTAS ================= */
function render_ofertas(){
  const el = document.getElementById("scr-ofertas");
  const incoming = G.offers.filter(o=>o.status==="pending_agent");
  const active = G.offers.filter(o=>["pending","countered"].includes(o.status));
  const history = G.offers.filter(o=>["accepted","rejected","done","expired"].includes(o.status)).slice(-15).reverse();
  el.innerHTML = `<div class="section-title">Ofertas e negociações</div>
  <div class="card"><h2>Propostas recebidas de clubes <small>${incoming.length}</small></h2>
  ${incoming.length? incoming.map(o=>{const p=getPlayer(o.playerId);const c=getClub(o.fromClubId);
    return `<div class="list-item"><div class="info"><b>${p?.name}</b><span>${c?.name} • ${o.type==='incoming_free'? 'contrato ('+fmtMoney(o.wage)+'/sem)': fmtMoney(o.amount)}</span></div>
    <div class="row"><button class="btn small" onclick="respondIncomingOffer('${o.id}',true);goScreen('ofertas')">Aceitar</button><button class="btn small danger" onclick="respondIncomingOffer('${o.id}',false);goScreen('ofertas')">Recusar</button></div></div>`;
  }).join(""): '<div class="empty">Nenhuma proposta recebida no momento.</div>'}</div>

  <div class="card" style="margin-top:16px"><h2>Minhas negociações em andamento <small>${active.length}</small></h2>
  ${active.length? active.map(o=>{const p=getPlayer(o.playerId);
    return `<div class="list-item" onclick="openNegotiationModal('${o.id}')" style="cursor:pointer"><div class="info"><b>${p?.name}</b><span>${o.status==='countered'?'Contraproposta recebida':'Aguardando resposta do clube'}</span></div><span class="badge blue">${fmtMoney(o.amount)}</span></div>`;
  }).join(""): '<div class="empty">Nenhuma negociação em andamento. Faça propostas no Mercado.</div>'}</div>

  <div class="card" style="margin-top:16px"><h2>Histórico recente</h2>
  ${history.length? history.map(o=>{const p=getPlayer(o.playerId);
    return `<div class="list-item"><div class="info"><b>${p?.name||"—"}</b><span>${fmtMoney(o.amount||0)}</span></div><span class="badge ${o.status==='rejected'||o.status==='expired'?'red':'green'}">${o.status}</span></div>`;
  }).join(""):'<div class="empty">Sem histórico ainda.</div>'}</div>`;
}
function openNegotiationModal(offerId){
  const o = G.offers.find(x=>x.id===offerId);
  const p = getPlayer(o.playerId);
  let actions = "";
  if(o.status==="countered"){
    actions = `<div class="row">
      <button class="btn" onclick="respondToCounter('${o.id}','accept');openNegotiationModal('${o.id}')">Aceitar ${fmtMoney(o.counterAmount)}</button>
      <button class="btn secondary" onclick="respondToCounter('${o.id}','raise');openNegotiationModal('${o.id}')">Fazer nova proposta</button>
      <button class="btn danger" onclick="respondToCounter('${o.id}','reject');closeModal();goScreen('ofertas')">Recusar</button>
    </div>`;
  }
  openModal(`<button class="close" onclick="closeModal()">✕</button>
  <h3>Negociação — ${p?.name}</h3><div class="sub">Status: ${o.status}</div>
  <div class="neg-log">${o.log.map(l=>`<div class="msg ${l.from==='me'?'me':'club'}">${l.text}</div>`).join("")}</div>
  ${actions}`);
}

/* ================= FINANCEIRO ================= */
function render_financas(){
  const el = document.getElementById("scr-financas");
  const hist = G.financeHistory.slice(0,40);
  const income = hist.filter(h=>h.amount>0).reduce((s,h)=>s+h.amount,0);
  const expense = hist.filter(h=>h.amount<0).reduce((s,h)=>s+h.amount,0);
  el.innerHTML = `<div class="section-title">Financeiro</div>
  <div class="grid2">
    <div class="card"><div class="stats">
      <div class="stat"><b>${fmtMoney(G.agent.money)}</b><span>SALDO ATUAL</span></div>
      <div class="stat"><b style="color:var(--green)">${fmtMoney(income)}</b><span>RECEITAS (recentes)</span></div>
      <div class="stat"><b style="color:var(--red)">${fmtMoney(expense)}</b><span>DESPESAS (recentes)</span></div>
      <div class="stat"><b>${fmtMoney(G.employees.reduce((s,e)=>s+e.weeklyCost,0))}</b><span>CUSTO SEMANAL FIXO</span></div>
    </div></div>
    <div class="card"><h2>Extrato</h2><div style="max-height:320px;overflow:auto">
    ${hist.length? hist.map(h=>`<div class="list-item"><div class="info"><b>${h.reason}</b><span>Semana ${h.week} • ${h.year}</span></div><span class="badge ${h.amount<0?'red':'green'}">${fmtMoney(h.amount)}</span></div>`).join(""):'<div class="empty">Sem movimentações ainda.</div>'}
    </div></div>
  </div>`;
}

/* ================= PRÊMIOS ================= */
function render_premios(){
  const el = document.getElementById("scr-premios");
  el.innerHTML = `<div class="section-title">Prêmios</div>
  <div class="card">${G.seasonAwardsHistory.length? G.seasonAwardsHistory.map(a=>`
    <div class="list-item" style="display:block">
      <b>Temporada ${a.year}</b>
      <div style="margin-top:8px;display:flex;gap:8px;flex-wrap:wrap">
        ${a.artilheiro?`<span class="badge gold">🥇 Artilheiro: ${a.artilheiro.name} (${a.artilheiro.goals})</span>`:""}
        ${a.melhorJogador?`<span class="badge green">🌟 Melhor jogador: ${a.melhorJogador.name}</span>`:""}
        ${a.melhorJovem?`<span class="badge blue">🌱 Melhor jovem: ${a.melhorJovem.name}</span>`:""}
      </div>
    </div>`).join(""): '<div class="empty">Prêmios serão concedidos ao final de cada temporada.</div>'}
  </div>`;
}

/* ================= NOTÍCIAS ================= */
function render_noticias(){
  const el = document.getElementById("scr-noticias");
  el.innerHTML = `<div class="section-title">FA News</div>
  <div class="card"><div class="news" style="max-height:none">
  ${G.news.length? G.news.map(n=>`<article><strong>${n.title}</strong><p>${n.body}</p><time>Semana ${n.week} • Temporada ${n.year}</time></article>`).join(""):'<div class="empty">Nenhuma notícia ainda.</div>'}
  </div></div>`;
}

/* ================= CONFIG ================= */
function render_config(){
  const el = document.getElementById("scr-config");
  el.innerHTML = `<div class="section-title">Configurações</div>
  <div class="card">
    <div class="row between"><div><b>Salvamento automático</b><div class="meta">O progresso é salvo automaticamente a cada ação.</div></div><button class="btn secondary" onclick="saveGame();toast('Jogo salvo.')">Salvar agora</button></div>
  </div>
  <div class="card" style="margin-top:14px">
    <div class="row between"><div><b>Reiniciar carreira</b><div class="meta">Apaga o progresso atual e começa uma nova carreira.</div></div><button class="btn danger" onclick="confirmRestart()">Reiniciar</button></div>
  </div>`;
}
function confirmRestart(){
  openModal(`<button class="close" onclick="closeModal()">✕</button><h3>Reiniciar carreira?</h3>
  <div class="sub">Essa ação apaga permanentemente o progresso atual.</div>
  <button class="btn danger" onclick="deleteSave();location.reload()">Sim, apagar e recomeçar</button>`);
}

/* ================= PERFIL DE JOGADOR ================= */
function openPlayerModal(playerId){
  const p = getPlayer(playerId);
  if(!p) return;
  const club = p.clubId? getClub(p.clubId): null;
  const canOffer = !p.isClient && p.clubId;
  const canSign = !p.isClient && !p.clubId;
  let actions = "";
  if(canOffer) actions += `<button class="btn" onclick="closeModal();openOfferModal('${p.id}')">Fazer proposta</button>`;
  if(canSign) actions += `<button class="btn" onclick="signAsClient('${p.id}');closeModal();toast('${p.name} agora é seu cliente.');goScreen('clientes')">Assinar como cliente</button>`;
  if(p.isClient) actions += `<button class="btn gold" onclick="closeModal();openContractModal('${p.id}')">Renegociar contrato</button>`;

  const attrs = p.attrs;
  openModal(`<button class="close" onclick="closeModal()">✕</button>
  <h3>${p.flag} ${p.name}</h3><div class="sub">${POS_GROUP[p.pos]} • ${p.age} anos • ${club?club.name:(p.loanActive?"Empréstimo":"Sem clube")}</div>
  <div class="row" style="margin-bottom:12px">
    <span class="badge green">OVR ${p.ovr}</span><span class="badge gold">POT ${p.pot}</span>
    <span class="badge blue">${fmtMoney(p.value)}</span><span class="badge muted">${fmtMoney(p.wage)}/sem</span>
  </div>
  <div class="field"><label>Moral</label><div class="progress"><i style="width:${p.morale}%"></i></div></div>
  <div class="field"><label>Forma</label><div class="progress"><i style="width:${p.form}%;background:var(--gold)"></i></div></div>
  <table class="tbl"><tr><td>Finalização</td><td>${attrs.finalizacao}</td><td>Passe</td><td>${attrs.passe}</td></tr>
  <tr><td>Drible</td><td>${attrs.drible}</td><td>Velocidade</td><td>${attrs.velocidade}</td></tr>
  <tr><td>Defesa</td><td>${attrs.defesa}</td><td>Físico</td><td>${attrs.fisico}</td></tr></table>
  <div class="row" style="margin:10px 0"><span class="badge muted">${p.apps} jogos</span><span class="badge muted">${p.goals} gols</span><span class="badge muted">${p.assists} assist.</span><span class="badge muted">Contrato: ${p.contractWeeks??"—"} sem.</span></div>
  ${p.transferHistory.length? `<div class="field"><label>Histórico de transferências</label>${p.transferHistory.map(t=>`<div class="meta">Sem.${t.week}/${t.year}: ${t.from} → ${t.to||"você"} (${fmtMoney(t.amount)})</div>`).join("")}</div>`:""}
  <div class="row" style="margin-top:14px">${actions}</div>`);
}

function openOfferModal(playerId){
  const p = getPlayer(playerId);
  openModal(`<button class="close" onclick="closeModal()">✕</button>
  <h3>Proposta por ${p.name}</h3><div class="sub">Valor de mercado estimado: ${fmtMoney(p.value)}</div>
  <div class="field"><label>Tipo</label><select id="offType"><option value="buy">Compra definitiva</option><option value="loan">Empréstimo</option></select></div>
  <div class="field"><label>Valor da proposta (€)</label><input id="offAmount" type="number" value="${p.value}"></div>
  <button class="btn" onclick="doMakeOffer('${p.id}')">Enviar proposta</button>`);
}
function doMakeOffer(playerId){
  const amount = parseInt(document.getElementById("offAmount").value||"0",10);
  const type = document.getElementById("offType").value;
  if(amount<=0){ toast("Informe um valor válido.", true); return; }
  if(amount>G.agent.money && type==="buy"){ toast("Você não tem saldo suficiente para essa proposta.", true); return; }
  const offer = makeOffer(playerId, amount, type);
  closeModal();
  if(offer.status==="accepted"){ toast("Proposta aceita! Transferência concluída."); }
  else if(offer.status==="rejected"){ toast("O clube recusou a proposta.", true); }
  else { toast("O clube respondeu à sua proposta."); openNegotiationModal(offer.id); }
  goScreen("ofertas");
}

function openContractModal(playerId){
  const p = getPlayer(playerId);
  openModal(`<button class="close" onclick="closeModal()">✕</button>
  <h3>Renegociar contrato — ${p.name}</h3><div class="sub">Salário atual: ${fmtMoney(p.wage)}/semana • ${p.contractWeeks} semanas restantes</div>
  <div class="field"><label>Novo salário semanal (€)</label><input id="cWage" type="number" value="${Math.round(p.wage*1.15)}"></div>
  <div class="field"><label>Duração do novo contrato (semanas)</label><input id="cWeeks" type="number" value="104"></div>
  <button class="btn" onclick="doProposeContract('${p.id}')">Propor</button>`);
}
function doProposeContract(playerId){
  const wage = parseInt(document.getElementById("cWage").value||"0",10);
  const weeks = parseInt(document.getElementById("cWeeks").value||"0",10);
  const r = proposeContract(playerId, wage, weeks);
  closeModal();
  toast(r.accepted? "Contrato renovado com sucesso!" : "O jogador recusou a proposta de contrato.", !r.accepted);
  goScreen("clientes");
}
// Renderiza a Tabela do Campeonato com detalhes completos (P, J, V, E, D, GP, GC, SG)
function renderizarTabelaCampeonato(clubes) {
    let html = `
    <div class="tabela-container">
        <h3>Tabela do Campeonato</h3>
        <table class="tabela-classificacao">
            <thead>
                <tr>
                    <th>Pos</th>
                    <th>Clube</th>
                    <th>P</th>
                    <th>J</th>
                    <th>V</th>
                    <th>E</th>
                    <th>D</th>
                    <th>GP</th>
                    <th>GC</th>
                    <th>SG</th>
                </tr>
            </thead>
            <tbody>`;

    // Ordena por Pontos, Vitórias e Saldo de Gols
    const ordenados = [...clubes].sort((a, b) => {
        if (b.pontos !== a.pontos) return b.pontos - a.pontos;
        if (b.vitorias !== a.vitorias) return b.vitorias - a.vitorias;
        return (b.golsPro - b.golsContra) - (a.golsPro - a.golsContra);
    });

    ordenados.forEach((clube, index) => {
        const saldo = clube.golsPro - clube.golsContra;
        html += `
            <tr>
                <td>${index + 1}º</td>
                <td><strong>${clube.nome}</strong></td>
                <td><strong>${clube.pontos}</strong></td>
                <td>${clube.jogos}</td>
                <td>${clube.vitorias}</td>
                <td>${clube.empates}</td>
                <td>${clube.derrotas}</td>
                <td>${clube.golsPro}</td>
                <td>${clube.golsContra}</td>
                <td>${saldo > 0 ? '+' + saldo : saldo}</td>
            </tr>`;
    });

    html += `</tbody></table></div>`;
    return html;
}

// Renderiza o Perfil do Jogador com Avatar e Estatísticas (Gols / Assistências)
function renderizarPerfilJogador(jogador) {
    const avatar = gerarAvatarSVG(jogador.id);
    const salarioFormatado = formatarMoeda(jogador.salario || 0);
    const valorFormatado = formatarMoeda(jogador.valorMercado || 0);

    return `
    <div class="card-jogador">
        <div class="avatar-box">
            ${avatar}
        </div>
        <div class="info-jogador">
            <h4>${jogador.nome} (${jogador.posicao})</h4>
            <p><strong>Over:</strong> ${jogador.overall} | <strong>Idade:</strong> ${jogador.idade} anos</p>
            <p><strong>Valor:</strong> ${valorFormatado} | <strong>Salário:</strong> ${salarioFormatado}/mês</p>
            <div class="stats-jogador">
                <span>⚽ <strong>Gols:</strong> ${jogador.gols || 0}</span>
                <span>👟 <strong>Assistências:</strong> ${jogador.assistencias || 0}</span>
            </div>
        </div>
    </div>`;
}

// Renderiza a Painel de Patrocinadores
function renderizarPainelPatrocinio(patrocinadores, nivelClube) {
    let html = `<h3>Painel de Patrocinadores</h3><div class="lista-patrocinio">`;

    patrocinadores.forEach(p => {
        const disponivel = nivelClube >= p.nivelExigido;
        html += `
        <div class="card-patrocinio ${disponivel ? 'disponivel' : 'bloqueado'}">
            <h4>${p.nome}</h4>
            <p><strong>Renda por Temporada:</strong> ${formatarMoeda(p.valorTemporada)}</p>
            <p><strong>Duração:</strong> ${p.duracaoAnos} temporada(s)</p>
            ${disponivel 
                ? `<button onclick="assinarPatrocinio(${p.id})">Assinar Contrato</button>` 
                : `<p class="aviso">Requer Nível de Clube ${p.nivelExigido}</p>`}
        </div>`;
    });

    html += `</div>`;
    return html;
}
