/* ================= MERCADO / NEGOCIAÇÕES / SCOUTING ================= */

/* Cria uma proposta de compra por um jogador de outro clube.
   type: 'buy' (compra definitiva) | 'loan' (empréstimo) */
function makeOffer(playerId, amount, type, extra){
  const p = getPlayer(playerId);
  if(!p || p.isClient) return null;
  extra = extra||{};
  const offer = {
    id: nextId("o"), playerId, type: type||"buy",
    amount, sellOnPct: extra.sellOnPct||0, buyOption: extra.buyOption||false,
    status:"pending", round:1,
    log:[{from:"me", text:`Proposta de ${fmtMoney(amount)} por ${p.name}${type==="loan"?" (empréstimo)":""}.`}],
  };
  G.offers.push(offer);
  resolveClubResponse(offer);
  saveGame();
  return offer;
}

function clubDecisionFactors(club, player){
  const negociadorBonus = employeeBonus("negociador");
  const askPrice = player.value * rand(100,130)/100;
  return {askPrice, negociadorBonus};
}

function employeeBonus(type){
  const emp = G.employees.filter(e=>e.type===type);
  if(!emp.length) return 0;
  return Math.max(...emp.map(e=>e.level))*4; // % de bônus
}

function resolveClubResponse(offer){
  const p = getPlayer(offer.playerId);
  const club = getClub(p.clubId);
  if(!club){ offer.status="accepted"; return; }
  const {askPrice, negociadorBonus} = clubDecisionFactors(club, p);
  const ratio = offer.amount / askPrice;
  const willingness = ratio*100 + negociadorBonus + (p.wantsToLeave?15:0) - (club.reputation>75?10:0);

  if(willingness>=105 || offer.round>=4){
    offer.status = ratio>=0.55 || offer.round>=4 ? "accepted" : "rejected";
  }
  if(offer.status!=="pending") {
    if(offer.status==="accepted") finalizeTransfer(offer);
    else offer.log.push({from:"club", text:`${club.name} recusou definitivamente a proposta.`});
    return;
  }

  if(willingness<70){
    offer.status="rejected";
    offer.log.push({from:"club", text:`${club.name} recusou a proposta — considerada muito abaixo do valor.`});
  } else {
    const counter = Math.round(askPrice*(1 - negociadorBonus/400));
    offer.counterAmount = Math.max(offer.amount+Math.round(offer.amount*0.08), counter);
    offer.status="countered";
    const wantsClause = chance(30) && !offer.sellOnPct;
    offer.suggestedClausePct = wantsClause? rand(10,25): 0;
    offer.log.push({from:"club", text:`${club.name} pede ${fmtMoney(offer.counterAmount)}${wantsClause?` e uma cláusula de ${offer.suggestedClausePct}% em revenda futura`:""}.`});
  }
}

function respondToCounter(offerId, action){
  const offer = G.offers.find(o=>o.id===offerId);
  if(!offer || offer.status!=="countered") return offer;
  if(action==="accept"){
    offer.amount = offer.counterAmount;
    if(offer.suggestedClausePct) offer.sellOnPct = offer.suggestedClausePct;
    offer.status="accepted";
    offer.log.push({from:"me", text:`Aceito pagar ${fmtMoney(offer.amount)}.`});
    finalizeTransfer(offer);
  } else if(action==="reject"){
    offer.status="rejected";
    offer.log.push({from:"me", text:"Proposta recusada. Negociação encerrada."});
  } else if(action==="raise"){
    offer.round++;
    const newAmount = Math.round((offer.amount + offer.counterAmount)/2);
    offer.amount = newAmount;
    offer.log.push({from:"me", text:`Nova proposta: ${fmtMoney(newAmount)}.`});
    resolveClubResponse(offer);
  }
  saveGame();
  return offer;
}

function finalizeTransfer(offer){
  const p = getPlayer(offer.playerId);
  const fromClub = getClub(p.clubId);
  if(offer.type==="loan"){
    p.onLoanFrom = fromClub? fromClub.name : null;
    if(fromClub){ fromClub.squadIds = fromClub.squadIds.filter(id=>id!==p.id); }
    p.clubId = null;
    p.loanActive = true;
    offer.log.push({from:"system", text:`Empréstimo fechado. ${p.name} está sob observação do seu escritório.`});
    addNews("🔄 Empréstimo fechado", `${p.name} foi emprestado com sucesso via negociação do seu escritório.`);
  } else {
    if(fromClub){ fromClub.squadIds = fromClub.squadIds.filter(id=>id!==p.id); }
    p.clubHistory.push({clubId:null, from:fromClub?fromClub.name:"—", to:"Livre/Cliente", week:G.meta.week});
    p.transferHistory.push({week:G.meta.week, year:G.meta.seasonYear, from:fromClub?fromClub.name:"—", amount:offer.amount});
    p.clubId = null;
    p.value = Math.round(p.value*1.03);
    addNews("💰 Transferência concluída", `Seu escritório intermediou a saída de ${p.name} de ${fromClub?fromClub.name:"clube livre"} por ${fmtMoney(offer.amount)}.`);
  }
  const commission = Math.round(offer.amount*0.10*(1+employeeBonus("negociador")/200));
  addFinance(`Comissão — transferência de ${p.name}`, commission);
  changeReputation(rand(1,4)+(offer.amount>20000000?3:0), "transferência concluída");
  offer.status="done";
}

/* ---------- Assinar jogador livre / sem clube como cliente ---------- */
function signAsClient(playerId){
  const p = getPlayer(playerId);
  if(!p || p.clubId) return false;
  p.isClient = true;
  p.agentCommission = 8;
  addNews("🤝 Novo cliente", `${p.name} agora é representado pelo seu escritório.`);
  changeReputation(1,"novo cliente");
  saveGame();
  return true;
}

/* ---------- Renovação / negociação de contrato de um cliente ---------- */
function proposeContract(playerId, newWage, newWeeks, bonusClause){
  const p = getPlayer(playerId);
  if(!p || !p.isClient) return null;
  const wageGrowth = (newWage-p.wage)/Math.max(p.wage,1);
  const happiness = p.morale + (wageGrowth>0.15?15: wageGrowth>0?5: -15) + (newWeeks>p.contractWeeks?5:-5);
  const accepted = happiness>=60 || chance(clamp(happiness,5,90));
  const result = {playerId, accepted, wage:newWage, weeks:newWeeks};
  if(accepted){
    p.wage = newWage; p.contractWeeks = newWeeks;
    p.morale = clamp(p.morale+10,0,100);
    const commission = Math.round(newWage*4*0.08);
    addFinance(`Comissão — renovação de ${p.name}`, commission);
    addNews("✍️ Contrato renovado", `${p.name} assinou novo contrato: ${fmtMoney(newWage)}/semana por ${newWeeks} semanas.`);
    changeReputation(1,"renovação bem-sucedida");
  } else {
    p.morale = clamp(p.morale-5,0,100);
  }
  saveGame();
  return result;
}

/* ================= SCOUTING ================= */
const REGIONS = [
  {id:"BR", name:"Brasil", flag:"🇧🇷", cost:2500},
  {id:"SA", name:"América do Sul", flag:"🌎", cost:3200},
  {id:"EU", name:"Europa", flag:"🇪🇺", cost:5200},
  {id:"AS", name:"Ásia", flag:"🌏", cost:4200},
  {id:"AF", name:"África", flag:"🌍", cost:3800},
  {id:"NA", name:"América do Norte", flag:"🌎", cost:3600},
];

function hireEmployee(type){
  const level = 1;
  const emp = makeEmployee(type, level);
  if(G.agent.money < emp.hireCost) return {ok:false, reason:"Dinheiro insuficiente."};
  addFinance(`Contratação de funcionário (${emp.name})`, -emp.hireCost);
  G.employees.push(emp);
  addNews("👔 Nova contratação", `${emp.name} agora faz parte do seu escritório.`);
  saveGame();
  return {ok:true, emp};
}

function upgradeEmployee(empId){
  const emp = G.employees.find(e=>e.id===empId);
  if(!emp) return {ok:false};
  const cost = emp.level*3000;
  if(G.agent.money<cost) return {ok:false, reason:"Dinheiro insuficiente."};
  addFinance(`Treinamento de ${emp.name}`, -cost);
  emp.level++;
  emp.name = emp.name.replace(/Nv\.\d+/, "Nv."+emp.level);
  emp.weeklyCost = Math.round(emp.weeklyCost*1.3);
  saveGame();
  return {ok:true};
}

function startScoutMission(scoutId, regionId, focus){
  const scout = G.employees.find(e=>e.id===scoutId && e.type==="scout");
  const region = REGIONS.find(r=>r.id===regionId);
  if(!scout || !region || scout.busy) return {ok:false};
  const cost = Math.round(region.cost * (1+ (4-scout.level)*0.15));
  if(G.agent.money<cost) return {ok:false, reason:"Dinheiro insuficiente."};
  addFinance(`Missão de scouting (${region.name})`, -cost);
  scout.busy = true;
  const mission = {
    id: nextId("m"), scoutId, regionId, focus: focus||"qualquer",
    weeksLeft: rand(2,4), cost, done:false,
  };
  G.scoutMissions.push(mission);
  addNews("🔎 Missão de scouting iniciada", `${scout.name} foi enviado para ${region.name} em busca de ${focusLabel(focus)}.`);
  saveGame();
  return {ok:true, mission};
}

function focusLabel(focus){
  return {jovens:"jovens promessas", potencial:"jogadores de alto potencial", qualquer:"talentos em geral",
    GOL:"goleiros",ZAG:"zagueiros",MEI:"meias",CA:"atacantes"}[focus]||"talentos";
}

function tickScoutMissions(){
  G.scoutMissions.forEach(m=>{
    if(m.done) return;
    m.weeksLeft--;
    if(m.weeksLeft<=0){
      m.done = true;
      const scout = G.employees.find(e=>e.id===m.scoutId);
      if(scout) scout.busy = false;
      const region = REGIONS.find(r=>r.id===m.regionId);
      const quality = scout? scout.level: 1;
      const found = rand(1,2);
      const results = [];
      for(let i=0;i<found;i++){
        let pos = ["GOL","ZAG","MEI","CA"].includes(m.focus)? m.focus : pick(POSITIONS);
        const age = m.focus==="jovens"? rand(15,19): rand(16,29);
        let ovr = clamp(rand(48,68)+quality*3,40,88);
        const p = generatePlayer({pos, age, ovr});
        // erro de avaliação do scout: quanto menor o nível, maior a incerteza do potencial reportado
        const uncertainty = Math.max(2, 16-quality*3);
        p.scoutReportedPot = clamp(p.pot + rand(-uncertainty,uncertainty),p.ovr,99);
        p.discovered = true;
        p.discoveredWeek = G.meta.week;
        G.players.push(p);
        G.scoutedPool.push(p.id);
        results.push(p.id);
      }
      m.resultPlayers = results;
      addNews("📋 Relatório de scouting", `${scout?scout.name:"Scout"} retornou de ${region?region.name:"missão"} com ${found} jogador(es) observado(s).`);
    }
  });
}
