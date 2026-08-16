/* ================= BOOTSTRAP / NAVEGAÇÃO ================= */

function buildNav(){
  const desktop = document.getElementById("desktopNav");
  const tabbar = document.getElementById("tabbarScroll");
  desktop.innerHTML = SCREENS.map((s,i)=>`<button data-nav="${s}" class="${i===0?'active':''}" onclick="goScreen('${s}')">${SCREEN_LABEL[s]}</button>`).join("");
  tabbar.innerHTML = SCREENS.map((s,i)=>{
    const [ic,...rest] = SCREEN_LABEL[s].split(" ");
    return `<button data-nav="${s}" class="${i===0?'active':''}" onclick="goScreen('${s}')"><span class="ic">${ic}</span>${rest.join(" ")}</button>`;
  }).join("");
  document.getElementById("appMain").innerHTML = SCREENS.map(s=>`<section id="scr-${s}" style="display:none"></section>`).join("");
}

function bootHero(){
  const hero = document.getElementById("hero");
  if(hasSave()){
    hero.innerHTML = `
    <div class="office"></div>
    <div class="content">
      <div class="brand">Futebol <span>Arte</span></div>
      <div class="tag">Sua carreira. Suas decisões. Seu futebol.</div>
      <button class="start" onclick="continueCareer()">▶ CONTINUAR CARREIRA</button>
      <div><button class="continue-btn" onclick="showNewGameForm()">Começar nova carreira</button></div>
    </div>`;
  } else {
    showNewGameForm();
  }
}

function showNewGameForm(){
  document.getElementById("hero").innerHTML = `
    <div class="office"></div>
    <div class="content">
      <div class="brand">Futebol <span>Arte</span></div>
      <div class="tag">Sua carreira. Suas decisões. Seu futebol.</div>
      <div class="newgame-box">
        <input id="ngName" placeholder="Seu nome de agente" maxlength="24">
        <input id="ngCity" placeholder="Cidade do escritório" maxlength="24" value="Rio de Janeiro">
        <button class="start" onclick="doStartNewGame()">▶ INICIAR CARREIRA</button>
      </div>
      <div class="demo">Agente • Mercado • Scouting • Ligas • Finanças</div>
    </div>`;
}

function doStartNewGame(){
  const name = (document.getElementById("ngName").value||"Novo Agente").trim() || "Novo Agente";
  const city = (document.getElementById("ngCity").value||"Rio de Janeiro").trim() || "Rio de Janeiro";
  newGame(name, city);
  enterApp();
}
function continueCareer(){
  loadGame();
  enterApp();
}
function enterApp(){
  document.getElementById("hero").style.display="none";
  document.getElementById("app").style.display="block";
  document.getElementById("tabbar").style.display="";
  buildNav();
  goScreen("inicio");
}

document.addEventListener("DOMContentLoaded", ()=>{
  buildNav();
  bootHero();
});
function abrirAbaInvestimentos() {
    const conteiner = document.getElementById('conteudo-principal'); // Use o ID da sua área principal
    if (conteiner) {
        conteiner.innerHTML = renderizarLojaPropriedades(perfilUsuario.saldoPessoal);
    }
}
function abrirAbaConfrontos() {
    const conteiner = document.getElementById('conteudo-principal');
    if (conteiner && perfilUsuario.clubeComprado) {
        conteiner.innerHTML = renderizarSimulacaoConfrontos(perfilUsuario.clubeComprado.id);
    } else {
        alert("Você precisa comprar um clube primeiro na loja de investimentos!");
    }
}
