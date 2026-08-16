/* ================= MOTOR DO JOGO ================= */
const SAVE_KEY = "futebolarte_save_v1";
let G = null; // estado global do jogo

/* ---------- Geração de jogadores ---------- */
function genPlayerName(){
  const nat = pick(NATIONS);
  return {nat, name: pick(nat.first)+" "+pick(nat.last)};
}

function baseAttrsForOvr(ovr,pos){
  // gera atributos coerentes a partir do overall e posição (usado em telas de detalhe)
  const spread = ()=>clamp(ovr + rand(-8,8),30,99);
  const isGk = pos==="GOL";
  return {
    finalizacao: isGk? rand(10,25): spread(),
    passe: spread(),
    drible: isGk? rand(10,30): spread(),
    velocidade: spread(),
    defesa: pos==="ZAG"||pos==="VOL"||isGk? spread(): clamp(ovr+rand(-20,0),20,90),
    fisico: spread(),
  };
}

function generatePlayer(opts){
  opts = opts||{};
  const {name,nat} = genPlayerName();
  const pos = opts.pos || pick(POSITIONS);
  const age = opts.age || rand(16,34);
  // potencial decresce com a idade; jovens tem maior variação de potencial
  let potBase = rand(55,94);
  if(age<=19) potBase = clamp(potBase+rand(0,10),55,99);
  if(age>=30) potBase = clamp(opts.ovr?opts.ovr:rand(60,80), 40, 90);
  let ovr = opts.ovr!=null? opts.ovr : clamp(potBase - rand(0, age<21?25: age<26?8:2),35,potBase);
  if(age>=30) ovr = clamp(potBase - rand(0,5),40,95);
  const pot = clamp(Math.max(potBase,ovr),ovr,99);
  const marketValue = estimateValue(ovr,pot,age,pos);
  const wage = Math.round(marketValue*0.0022/ (opts.wageDiv||1) /100)*100 + rand(500,3000);
  return {
    id: nextId("p"),
    name, nat: nat.code, flag: nat.flag, pos,
    age, ovr, pot,
    value: marketValue,
    wage: Math.max(800,wage),
    contractWeeks: opts.contractWeeks!=null? opts.contractWeeks : rand(26,208),
    clubId: opts.clubId || null,
    morale: rand(55,85),
    form: rand(50,80),
    apps:0, goals:0, assists:0, yellow:0, red:0,
    seasonApps:0, seasonGoals:0, seasonAssists:0,
    attrs: baseAttrsForOvr(ovr,pos),
    isClient: !!opts.isClient,
    agentCommission: opts.isClient? 8: 0,
    clubHistory: opts.clubId? [{clubId:opts.clubId, from:"início"}] : [],
    transferHistory: [],
    evolution: [{week:0, ovr}],
    releaseClause: null,
    wantsToLeave: false,
    injuredWeeks: 0,
  };
}

function estimateValue(ovr,pot,age,pos){
  let base = Math.pow(1.16, ovr-50) * 90000;
  const potBonus = 1 + Math.max(0,(pot-ovr))*0.045;
  let ageMod = 1;
  if(age<=23) ageMod = 1.35; else if(age<=27) ageMod = 1.15; else if(age<=30) ageMod = 0.85; else ageMod = 0.45;
  if(pos==="GOL") base*=0.75;
  if(pos==="CA"||pos==="MEI"||pos==="PE"||pos==="PD") base*=1.1;
  return Math.max(20000, Math.round(base*potBonus*ageMod/1000)*1000);
}

/* ---------- Geração de clubes e ligas ---------- */
function generateClub(name,leagueId,tier){
  const budgetBase = tier===1? rand(15,80)*1000000 : rand(2,15)*1000000;
  return {
    id: nextId("c"),
    name, leagueId,
    country: LEAGUE_SEED.find(l=>l.id===leagueId)?.country||"—",
    reputation: tier===1? rand(55,88): rand(30,55),
    tier,
    budget: budgetBase,
    stadium: pick(STADIUMS),
    squadIds: [],
    titles: [],
    points:0, played:0, wins:0, draws:0, losses:0, gf:0, ga:0,
    financeHistory: [],
  };
}

function buildSquadForClub(club){
  const needs = ["GOL","GOL","ZAG","ZAG","ZAG","LD","LE","VOL","VOL","MC","MEI","MEI","PD","PE","SA","CA","CA","ZAG"];
  const baseOvr = clamp(club.reputation + rand(-6,6),40,92);
  needs.forEach(pos=>{
    const age = rand(18,33);
    const ovr = clamp(baseOvr + rand(-10,8) - (age<21?rand(0,10):0),35,95);
    const p = generatePlayer({pos, age, ovr, clubId:club.id, contractWeeks: rand(20,208)});
    club.squadIds.push(p.id);
    G.players.push(p);
  });
}

/* ---------- Inicialização de uma nova carreira ---------- */
function newGame(agentName, city){
  __idSeq = 1;
  G = {
    version:1,
    agent:{name: agentName||"Agente", city: city||"Rio de Janeiro", reputation: 18, tier:1, money: 250000},
    meta:{seasonYear:2026, week:1, totalWeeks:38, started:true},
    players:[],
    clubs:[],
    leagues:[],
    employees:[],
    scoutMissions:[],
    scoutedPool: [],
    offers:[], // negociações ativas {id, playerId, type:'buy'|'contract', status, log:[], ...}
    news:[],
    financeHistory:[],
    awards:[],
    seasonAwardsHistory:[],
    freeAgentsGenerated:false,
  };

  LEAGUE_SEED.forEach(seed=>{
    const league = {id:seed.id, name:seed.name, country:seed.country, flag:seed.flag, tier:seed.tier, clubIds:[], fixtures:[], round:0, champion:null};
    seed.clubs.forEach(cname=>{
      const club = generateClub(cname, seed.id, seed.tier);
      buildSquadForClub(club);
      league.clubIds.push(club.id);
      G.clubs.push(club);
    });
    league.fixtures = buildRoundRobin(league.clubIds);
    G.leagues.push(league);
  });
  const maxRound = Math.max(...G.leagues.map(l=>Math.max(...l.fixtures.map(f=>f.round))));
  G.meta.totalWeeks = maxRound;

  // agente começa com 2 jovens promessas como clientes iniciais (rede de contatos)
  for(let i=0;i<2;i++){
    const p = generatePlayer({pos: pick(["MEI","CA","PE","VOL"]), age: rand(17,21), isClient:true});
    p.clubId = pick(G.clubs.filter(c=>c.tier===2)).id;
    G.clubs.find(c=>c.id===p.clubId).squadIds.push(p.id);
    p.clubHistory.push({clubId:p.clubId, from:"base"});
    G.players.push(p);
  }

  // funcionário inicial: 1 scout júnior
  G.employees.push(makeEmployee("scout",1));

  addNews("💼 Nova carreira", `${G.agent.name} abriu uma agência de futebol em ${G.agent.city}. A jornada começa agora.`);
  saveGame();
  return G;
}

function makeEmployee(type,level){
  const names = {scout:"Scout",analista:"Analista",negociador:"Negociador",assistente:"Assistente"};
  const costByType = {scout:1500,analista:1800,negociador:2200,assistente:1200};
  return {
    id: nextId("e"), type, level: level||1,
    name: names[type]+" Nv."+(level||1),
    weeklyCost: costByType[type]*(level||1),
    hireCost: costByType[type]*(level||1)*8,
    busy:false,
  };
}

/* round-robin simples (turno único) */
function buildRoundRobin(clubIds){
  let ids = clubIds.slice();
  if(ids.length%2!==0) ids.push(null);
  const n = ids.length, rounds = n-1;
  const fixtures = [];
  let arr = ids.slice();
  for(let r=0;r<rounds;r++){
    for(let i=0;i<n/2;i++){
      const home = arr[i], away = arr[n-1-i];
      if(home && away) fixtures.push({round:r+1, home, away, played:false, hg:null, ag:null});
    }
    const fixed = arr[0];
    const rest = arr.slice(1);
    rest.unshift(rest.pop());
    arr = [fixed,...rest];
  }
  // turno de volta (mando invertido)
  const secondLeg = fixtures.map(f=>({round:f.round+rounds, home:f.away, away:f.home, played:false, hg:null, ag:null}));
  return fixtures.concat(secondLeg);
}

/* ---------- Persistência ---------- */
function saveGame(){
  try{
    localStorage.setItem(SAVE_KEY, JSON.stringify(G));
    localStorage.setItem(SAVE_KEY+"_idseq", String(__idSeq));
    return true;
  }catch(e){ console.error("Falha ao salvar",e); return false; }
}
function hasSave(){ return !!localStorage.getItem(SAVE_KEY); }
function loadGame(){
  const raw = localStorage.getItem(SAVE_KEY);
  if(!raw) return null;
  G = JSON.parse(raw);
  __idSeq = parseInt(localStorage.getItem(SAVE_KEY+"_idseq")||"1",10);
  return G;
}
function deleteSave(){
  localStorage.removeItem(SAVE_KEY);
  localStorage.removeItem(SAVE_KEY+"_idseq");
}

/* ---------- Utilidades de consulta ---------- */
function getPlayer(id){ return G.players.find(p=>p.id===id); }
function getClub(id){ return G.clubs.find(c=>c.id===id); }
function getLeague(id){ return G.leagues.find(l=>l.id===id); }
function clientPlayers(){ return G.players.filter(p=>p.isClient); }
function myPlayer(id){ const p=getPlayer(id); return p && p.isClient? p: null; }

function addNews(title, body){
  G.news.unshift({week:G.meta.week, year:G.meta.seasonYear, title, body, id: nextId("n")});
  if(G.news.length>120) G.news.length=120;
}

function addFinance(reason, amount){
  G.agent.money += amount;
  G.financeHistory.unshift({week:G.meta.week, year:G.meta.seasonYear, reason, amount, balance:G.agent.money});
  if(G.financeHistory.length>200) G.financeHistory.length=200;
}

function changeReputation(delta, reason){
  G.agent.reputation = clamp(G.agent.reputation+delta,0,100);
  const newTier = G.agent.reputation>=80?4:G.agent.reputation>=55?3:G.agent.reputation>=30?2:1;
  if(newTier!==G.agent.tier){
    G.agent.tier = newTier;
    addNews("⭐ Progressão do agente", `Sua reputação evoluiu para o nível ${newTier}. Novas oportunidades foram desbloqueadas.`);
  }
}
// Atualiza a tabela do campeonato após uma partida
function processarResultadoPartida(timeMandante, timeVisitante, golsMandante, golsVisitante) {
    timeMandante.jogos += 1;
    timeVisitante.jogos += 1;

    timeMandante.golsPro += golsMandante;
    timeMandante.golsContra += golsVisitante;
    timeVisitante.golsPro += golsVisitante;
    timeVisitante.golsContra += golsMandante;

    if (golsMandante > golsVisitante) {
        timeMandante.pontos += 3;
        timeMandante.vitorias += 1;
        timeVisitante.derrotas += 1;
    } else if (golsVisitante > golsMandante) {
        timeVisitante.pontos += 3;
        timeVisitante.vitorias += 1;
        timeMandante.derrotas += 1;
    } else {
        timeMandante.pontos += 1;
        timeVisitante.pontos += 1;
        timeMandante.empates += 1;
        timeVisitante.empates += 1;
    }
}

// Registra Gols e Assistências dos Jogadores
function registrarEstatisticaJogador(jogador, gols = 0, assistencias = 0) {
    if (!jogador.gols) jogador.gols = 0;
    if (!jogador.assistencias) jogador.assistencias = 0;

    jogador.gols += gols;
    jogador.assistencias += assistencias;
}

// Lógica para assinar Contrato de Patrocínio
function assinarPatrocinio(patrocinadorId, clube) {
    const patrocinador = listaPatrocinadores.find(p => p.id === patrocinadorId);
    if (!patrocinador) return;

    clube.patrocinadorAtual = patrocinador;
    clube.orcamento += patrocinador.valorTemporada;
    alert(`Contrato com ${patrocinador.nome} assinado com sucesso! +${formatarMoeda(patrocinador.valorTemporada)} adicionados ao orçamento.`);
}
