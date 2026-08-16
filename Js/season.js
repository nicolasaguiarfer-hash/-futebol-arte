/* ================= SIMULAÇÃO DE TEMPORADA ================= */

function clubStrength(club){
  const squad = club.squadIds.map(getPlayer).filter(Boolean);
  if(!squad.length) return club.reputation;
  const top = squad.sort((a,b)=>b.ovr-a.ovr).slice(0,11);
  const avg = top.reduce((s,p)=>s+p.ovr,0)/top.length;
  return avg*0.75 + club.reputation*0.25;
}

function simulateMatch(fixture, league){
  const home = getClub(fixture.home), away = getClub(fixture.away);
  if(!home||!away) return;
  const hs = clubStrength(home)+4; // vantagem de mando
  const as = clubStrength(away);
  const diff = (hs-as)/10;
  const hg = clamp(Math.round(poisson(1.25+diff*0.35)),0,9);
  const ag = clamp(Math.round(poisson(1.0-diff*0.3)),0,9);
  fixture.hg=hg; fixture.ag=ag; fixture.played=true;

  updateTable(home,hg,ag>0? -1:0); // placeholder, real update below
  applyResult(home,hg,ag);
  applyResult(away,ag,hg);

  distributeMatchStats(home, hg);
  distributeMatchStats(away, ag);

  if(hg>ag) champTitlePush(home); else if(ag>hg) champTitlePush(away);
}

function poisson(lambda){
  // aproximação simples e rápida para gerar placares plausíveis
  let L=Math.exp(-lambda), k=0, p=1;
  do{ k++; p*=Math.random(); }while(p>L && k<10);
  return k-1;
}
function updateTable(){/* mantido por compatibilidade, cálculo real em applyResult */}

function applyResult(club,gf,ga){
  club.played++; club.gf+=gf; club.ga+=ga;
  if(gf>ga){ club.wins++; club.points+=3; }
  else if(gf===ga){ club.draws++; club.points+=1; }
  else { club.losses++; }
}
function champTitlePush(){/* reservado para eventos futuros */}

function distributeMatchStats(club,goalsScored){
  const squad = club.squadIds.map(getPlayer).filter(Boolean);
  if(!squad.length) return;
  // define escalação: 11 melhores, com leve rotação por forma/moral
  const lineup = squad.sort((a,b)=> (b.ovr+b.form*0.2) - (a.ovr+a.form*0.2)).slice(0,11);
  lineup.forEach(p=>{
    p.apps++; p.seasonApps++;
    // pequena chance de lesão ou cartão
    if(chance(1.2)){ p.injuredWeeks = rand(1,4); addInjuryNews(p); }
    if(chance(6)) p.yellow++;
    if(chance(0.4)) p.red++;
  });
  const attackers = lineup.filter(p=>["CA","SA","PD","PE","MEI"].includes(p.pos));
  const scorerPool = attackers.length? attackers: lineup;
  for(let g=0; g<goalsScored; g++){
    const weighted = weightedPick(scorerPool, p=>Math.pow(p.ovr,2));
    weighted.goals++; weighted.seasonGoals++;
    const assistCandidates = lineup.filter(p=>p.id!==weighted.id && ["MEI","MC","PD","PE","VOL"].includes(p.pos));
    if(assistCandidates.length && chance(65)){
      const assister = weightedPick(assistCandidates, p=>p.ovr);
      assister.assists++; assister.seasonAssists++;
    }
  }
  // moral/forma flutuam de acordo com desempenho
  lineup.forEach(p=>{
    p.form = clamp(p.form + rand(-4,5),20,99);
    p.morale = clamp(p.morale + (p.goals>0?rand(0,2):rand(-1,1)),10,100);
  });
}

function weightedPick(arr, weightFn){
  const total = arr.reduce((s,p)=>s+weightFn(p),0);
  let r = Math.random()*total;
  for(const p of arr){ r-=weightFn(p); if(r<=0) return p; }
  return arr[arr.length-1];
}

function addInjuryNews(p){
  addNews("🩹 Lesão", `${p.name} sofreu uma lesão e ficará fora por aproximadamente ${p.injuredWeeks} semana(s).`);
  if(p.isClient) changeReputation(-1,"lesão de cliente");
}

/* ---------- IA de mercado: clubes fazem propostas por clientes do agente ---------- */
function aiClubOffers(){
  clientPlayers().forEach(p=>{
    if(p.clubId && chance(4)){
      const suitor = pick(G.clubs.filter(c=>c.id!==p.clubId && c.budget>p.value*0.6));
      if(!suitor) return;
      const amount = Math.round(p.value*rand(85,115)/100);
      G.offers.push({
        id: nextId("io"), playerId:p.id, type:"incoming", fromClubId:suitor.id,
        amount, status:"pending_agent", log:[{from:"club", text:`${suitor.name} enviou proposta de ${fmtMoney(amount)} por ${p.name}.`}],
      });
      addNews("📨 Proposta recebida", `${suitor.name} apresentou uma proposta por ${p.name}.`);
    }
    if(!p.clubId && chance(3)){
      const suitor = pick(G.clubs.filter(c=>c.budget>p.value*0.6));
      if(!suitor) return;
      G.offers.push({
        id: nextId("io"), playerId:p.id, type:"incoming_free", fromClubId:suitor.id,
        amount:0, wage: Math.round(p.wage*rand(90,140)/100), status:"pending_agent",
        log:[{from:"club", text:`${suitor.name} quer contratar ${p.name} (sem clube).`}],
      });
      addNews("📨 Interesse recebido", `${suitor.name} quer assinar com ${p.name}, atualmente sem clube.`);
    }
  });
}

function respondIncomingOffer(offerId, accept){
  const offer = G.offers.find(o=>o.id===offerId);
  if(!offer) return;
  const p = getPlayer(offer.playerId);
  const club = getClub(offer.fromClubId);
  if(accept){
    if(offer.type==="incoming"){
      const fromClub = getClub(p.clubId);
      if(fromClub) fromClub.squadIds = fromClub.squadIds.filter(id=>id!==p.id);
      club.squadIds.push(p.id);
      p.clubId = club.id;
      p.clubHistory.push({clubId:club.id, from:fromClub?fromClub.name:"—", to:club.name, week:G.meta.week});
      p.transferHistory.push({week:G.meta.week, year:G.meta.seasonYear, from:fromClub?fromClub.name:"—", to:club.name, amount:offer.amount});
      const commission = Math.round(offer.amount*0.10);
      addFinance(`Comissão — venda de ${p.name}`, commission);
      addNews("💰 Venda concluída", `${p.name} foi transferido para ${club.name} por ${fmtMoney(offer.amount)}.`);
      changeReputation(rand(2,5),"venda concluída");
    } else if(offer.type==="incoming_free"){
      club.squadIds.push(p.id);
      p.clubId = club.id; p.wage = offer.wage;
      p.clubHistory.push({clubId:club.id, from:"Livre", to:club.name, week:G.meta.week});
      const commission = Math.round(offer.wage*4*0.08);
      addFinance(`Comissão — contrato de ${p.name}`, commission);
      addNews("✍️ Novo contrato", `${p.name} assinou com ${club.name}.`);
      changeReputation(1,"contrato fechado");
    }
    offer.status="accepted";
  } else {
    offer.status="rejected";
    p.morale = clamp(p.morale-2,0,100);
  }
  saveGame();
}

/* ---------- Eventos aleatórios semanais ---------- */
function randomEvents(){
  clientPlayers().forEach(p=>{
    if(!p.clubId) return;
    const club = getClub(p.clubId);
    if(chance(2)){
      addNews("📈 Boa fase", `${p.name} está em ótima fase e chamou atenção da imprensa.`);
      p.form = clamp(p.form+10,0,99); p.value = Math.round(p.value*1.04);
    } else if(chance(1.5)){
      addNews("📉 Queda de rendimento", `${p.name} vive momento de queda de rendimento.`);
      p.form = clamp(p.form-10,0,99); p.value = Math.round(p.value*0.97);
    } else if(chance(1.2)){
      p.wantsToLeave = true;
      addNews("🚪 Pedido de saída", `${p.name} sinalizou ao ${club?club.name:"clube"} o desejo de deixar a equipe.`);
    } else if(chance(1)){
      addNews("💬 Pedido de aumento", `${p.name} solicitou uma renegociação salarial ao seu agente.`);
    }
  });
  if(chance(3)){
    const club = pick(G.clubs);
    if(club.budget < club.reputation*300000*0.4){
      addNews("🏦 Crise financeira", `${club.name} enfrenta dificuldades financeiras e pode vender jogadores abaixo do valor.`);
      club.budget = Math.round(club.budget*0.9);
    }
  }
}

/* ---------- Avanço de semana ---------- */
function advanceWeek(){
  const wk = G.meta.week;
  G.leagues.forEach(league=>{
    const roundFixtures = league.fixtures.filter(f=>f.round===wk && !f.played);
    roundFixtures.forEach(f=>simulateMatch(f, league));
  });

  // custos semanais: salários de clientes (comissão já é o ganho; aqui pagamos operação) + funcionários
  const staffCost = G.employees.reduce((s,e)=>s+e.weeklyCost,0);
  addFinance("Folha de funcionários", -staffCost);

  // contratos avançam
  G.players.forEach(p=>{
    if(p.contractWeeks!=null && p.clubId) p.contractWeeks = Math.max(0,p.contractWeeks-1);
    if(p.injuredWeeks>0) p.injuredWeeks--;
    // pequena variação natural do valor de mercado
    if(chance(20)) p.value = Math.max(15000, Math.round(p.value * (1+ (rand(-3,4)/100))));
  });

  tickScoutMissions();
  aiClubOffers();
  randomEvents();

  // ofertas antigas expiram
  G.offers.forEach(o=>{ if(o.status==="countered" && o.round>=5) o.status="expired"; });

  G.meta.week++;
  if(G.meta.week>G.meta.totalWeeks){
    endSeason();
  }
  saveGame();
}

/* ---------- Fim de temporada ---------- */
function endSeason(){
  G.leagues.forEach(league=>{
    const table = league.clubIds.map(getClub).sort((a,b)=> b.points-a.points || (b.gf-b.ga)-(a.gf-a.ga) || b.gf-a.gf);
    const champion = table[0];
    if(champion){
      champion.titles.push(G.meta.seasonYear);
      addNews("🏆 Campeão da temporada", `${champion.name} conquistou o título da ${league.name} em ${G.meta.seasonYear}.`);
    }
  });

  // artilheiro e melhor jogador da temporada (entre todos os jogadores)
  const scorers = G.players.filter(p=>p.seasonApps>0).sort((a,b)=>b.seasonGoals-a.seasonGoals);
  const bestOverall = G.players.filter(p=>p.seasonApps>0).sort((a,b)=> (b.ovr+b.seasonGoals*0.5+b.seasonAssists*0.3) - (a.ovr+a.seasonGoals*0.5+a.seasonAssists*0.3));
  const bestYoung = G.players.filter(p=>p.seasonApps>0 && p.age<=21).sort((a,b)=>b.ovr-a.ovr);
  const awards = {
    year: G.meta.seasonYear,
    artilheiro: scorers[0]? {id:scorers[0].id, name:scorers[0].name, goals:scorers[0].seasonGoals}: null,
    melhorJogador: bestOverall[0]? {id:bestOverall[0].id, name:bestOverall[0].name}: null,
    melhorJovem: bestYoung[0]? {id:bestYoung[0].id, name:bestYoung[0].name}: null,
  };
  G.seasonAwardsHistory.unshift(awards);
  if(awards.artilheiro) addNews("🥇 Artilheiro da temporada", `${awards.artilheiro.name} terminou como artilheiro, com ${awards.artilheiro.goals} gols.`);
  if(awards.melhorJogador) addNews("🌟 Melhor jogador da temporada", `${awards.melhorJogador.name} foi eleito o melhor jogador da temporada.`);
  if(awards.melhorJovem) addNews("🌱 Melhor jovem", `${awards.melhorJovem.name} se destacou como o melhor jovem da temporada.`);

  clientPlayers().forEach(p=>{
    if(p.isClient) changeReputation(Math.round(p.seasonGoals*0.2 + p.seasonAssists*0.15),"desempenho de clientes na temporada");
  });

  // evolução de fim de temporada — jogadores caminham em direção ao potencial (ou regridem se velhos)
  G.players.forEach(p=>{
    let delta;
    if(p.age<=23) delta = rand(0,4);
    else if(p.age<=29) delta = rand(-1,2);
    else delta = -rand(1,4);
    p.ovr = clamp(p.ovr+delta, 30, p.age<=23? p.pot: 99);
    p.value = estimateValue(p.ovr,p.pot,p.age,p.pos);
    p.age++;
    p.seasonApps=0; p.seasonGoals=0; p.seasonAssists=0;
    p.evolution.push({week:0, season:G.meta.seasonYear+1, ovr:p.ovr});
    if(p.evolution.length>15) p.evolution.shift();
  });

  // reinicia tabelas e novas temporadas
  G.leagues.forEach(league=>{
    league.clubIds.forEach(cid=>{
      const c = getClub(cid);
      c.points=0;c.played=0;c.wins=0;c.draws=0;c.losses=0;c.gf=0;c.ga=0;
      c.budget = Math.round(c.budget*(0.85+Math.random()*0.35));
    });
    league.fixtures = buildRoundRobin(league.clubIds);
  });
  const maxRound = Math.max(...G.leagues.map(l=>Math.max(...l.fixtures.map(f=>f.round))));
  G.meta.totalWeeks = maxRound;

  G.meta.seasonYear++;
  G.meta.week=1;
  addNews("📅 Nova temporada", `A temporada ${G.meta.seasonYear}/${(G.meta.seasonYear+1).toString().slice(2)} começou.`);
}
