/* ================= DADOS ESTÁTICOS ================= */
/* Pools de nomes por nacionalidade, clubes e ligas iniciais.
   Usados para gerar uma base de jogadores coerente e jogável. */

const NATIONS = [
  {code:"BRA",name:"Brasil",flag:"🇧🇷",first:["Gabriel","Lucas","Matheus","Rafael","Bruno","Kaique","Vinícius","Yuri","Erick","Wesley","João","Pedro","Caio","Igor","Anderson","Renan","Tiago","Douglas","Vitor","Everton"],last:["Silva","Santos","Oliveira","Souza","Costa","Pereira","Almeida","Ribeiro","Carvalho","Gomes","Barbosa","Rocha","Dias","Nascimento","Teixeira","Moreira","Lima","Araújo"]},
  {code:"ARG",name:"Argentina",flag:"🇦🇷",first:["Franco","Lautaro","Nicolás","Tomás","Iván","Enzo","Julián","Nahuel","Thiago","Bautista","Máximo","Agustín","Joaquín","Facundo","Ezequiel"],last:["González","Rodríguez","Fernández","López","Martínez","Díaz","Romero","Sosa","Torres","Álvarez","Molina","Acosta"]},
  {code:"ESP",name:"Espanha",flag:"🇪🇸",first:["Alejandro","Pablo","Álvaro","Marc","Iker","Hugo","Adrián","Mateo","Diego","Jorge","Rubén","Sergio","Nico","Pau"],last:["García","Martín","Fernández","Sánchez","Pérez","Gómez","Ruiz","Navarro","Serra","Vidal","Torres","Muñoz"]},
  {code:"POR",name:"Portugal",flag:"🇵🇹",first:["João","Rui","Tiago","André","Gonçalo","Francisco","Diogo","Bernardo","Rafael","Vasco","Miguel"],last:["Silva","Sousa","Fernandes","Pereira","Costa","Ribeiro","Carvalho","Gonçalves","Lopes","Neves"]},
  {code:"FRA",name:"França",flag:"🇫🇷",first:["Lucas","Hugo","Nathan","Enzo","Théo","Maxime","Antoine","Kylian","Bastien","Rayan","Jules"],last:["Bernard","Dubois","Moreau","Laurent","Simon","Michel","Lefebvre","Roux","Fontaine","Girard"]},
  {code:"ENG",name:"Inglaterra",flag:"🏴",first:["Jack","Harry","George","Oliver","Callum","James","Charlie","Alfie","Ethan","Ryan","Dylan"],last:["Smith","Taylor","Brown","Wilson","Evans","Walker","Hughes","Edwards","Green","Baker"]},
  {code:"ALE",name:"Alemanha",flag:"🇩🇪",first:["Lukas","Finn","Jonas","Max","Leon","Tim","Niklas","Paul","Elias","David"],last:["Müller","Schmidt","Schneider","Fischer","Weber","Wagner","Becker","Hoffmann","Koch","Richter"]},
  {code:"ITA",name:"Itália",flag:"🇮🇹",first:["Matteo","Lorenzo","Andrea","Francesco","Davide","Alessandro","Riccardo","Gabriele","Simone"],last:["Rossi","Russo","Ferrari","Esposito","Bianchi","Romano","Gallo","Conti","Marino","Greco"]},
  {code:"HOL",name:"Holanda",flag:"🇳🇱",first:["Daan","Sem","Milan","Levi","Bram","Luuk","Thijs","Niek","Ties"],last:["de Jong","Jansen","de Vries","Bakker","Visser","Smit","Meijer","Mulder","Dekker"]},
  {code:"URU",name:"Uruguai",flag:"🇺🇾",first:["Facundo","Agustín","Bruno","Rodrigo","Nicolás","Federico","Santiago"],last:["Rodríguez","Pereira","Fernández","Silva","González","Correa"]},
  {code:"CRO",name:"Croácia",flag:"🇭🇷",first:["Luka","Ivan","Marko","Josip","Ante","Filip","Domagoj"],last:["Kovačić","Perić","Horvat","Barišić","Jurić","Vuković"]},
  {code:"JAP",name:"Japão",flag:"🇯🇵",first:["Ren","Sota","Yuto","Riku","Kaito","Haruto","Daiki"],last:["Sato","Suzuki","Takahashi","Tanaka","Watanabe","Itō","Yamamoto"]},
  {code:"NIG",name:"Nigéria",flag:"🇳🇬",first:["Chidi","Emeka","Kelechi","Ifeanyi","Obinna","Tunde","Ayo"],last:["Okafor","Eze","Adeyemi","Balogun","Chukwu","Okonkwo"]},
  {code:"USA",name:"Estados Unidos",flag:"🇺🇸",first:["Tyler","Jackson","Caleb","Mason","Aiden","Logan","Owen"],last:["Johnson","Williams","Miller","Davis","Anderson","Thompson"]},
  {code:"BEL",name:"Bélgica",flag:"🇧🇪",first:["Arno","Wout","Senne","Milan","Louis","Nathan"],last:["Peeters","Janssens","Maes","Jacobs","Willems"]},
];

const POSITIONS = ["GOL","ZAG","LD","LE","VOL","MC","MEI","PD","PE","SA","CA"];
const POS_GROUP = {GOL:"Goleiro",ZAG:"Zagueiro",LD:"Lateral Direito",LE:"Lateral Esquerdo",VOL:"Volante",MC:"Meio-Campo",MEI:"Meia Atacante",PD:"Ponta Direita",PE:"Ponta Esquerda",SA:"Segundo Atacante",CA:"Centroavante"};

/* Ligas e clubes iniciais (fictícios/genéricos para evitar uso de marcas reais) */
const LEAGUE_SEED = [
  {id:"BRA1",name:"Liga Brasileira A",country:"Brasil",flag:"🇧🇷",tier:1,
    clubs:["Rio Estrela","São Paulo United","Grêmio Sul","Bahia Costa","Palmeira Real","Corinthia AC","Fluminense Praia","Atlético Serra"]},
  {id:"EUR1",name:"Liga Europa Elite",country:"Europa",flag:"🇪🇺",tier:1,
    clubs:["Real Marítimo","Manchester Rovers","Milano Calcio","Paris Étoile","München Adler","Ajax Norte","Lisboa Atlantic","Torino Grifo"]},
  {id:"BRA2",name:"Liga Brasileira B",country:"Brasil",flag:"🇧🇷",tier:2,
    clubs:["Santos Praiano","Vasco Marinho","Ceará Sol","Sport Recifense","Coritiba Pinheiros","Goiás Central","Cuiabá Pantanal","Vitória Baiano"]},
];

const STADIUMS = ["Arena Central","Estádio Municipal","Parque das Águias","Arena Litoral","Estádio Nacional","Arena Vitória","Coliseu do Sul","Arena Norte"];

/* IDs sequenciais globais para entidades geradas em runtime */
let __idSeq = 1;
function nextId(prefix){return prefix + (__idSeq++);}

function rand(min,max){return Math.floor(Math.random()*(max-min+1))+min;}
function pick(arr){return arr[Math.floor(Math.random()*arr.length)];}
function chance(pct){return Math.random()*100 < pct;}
function clamp(v,min,max){return Math.max(min,Math.min(max,v));}
function fmtMoney(v){
  const sign = v<0?"-":"";
  v = Math.abs(v);
  if(v>=1000000) return sign+"€"+(v/1000000).toFixed(v>=10000000?0:1)+"M";
  if(v>=1000) return sign+"€"+(v/1000).toFixed(0)+"K";
  return sign+"€"+v.toFixed(0);
}
