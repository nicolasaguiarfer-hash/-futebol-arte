// ==========================================
// FUTEBOL ARTE - SISTEMA DE AVATARES
// ==========================================

const avatarStyles = [
    {
        skin: "#8D5524",
        hair: "#17120F",
        shirt: "#E63946"
    },
    {
        skin: "#C68642",
        hair: "#24160E",
        shirt: "#2563EB"
    },
    {
        skin: "#F1C27D",
        hair: "#4A2C20",
        shirt: "#16A34A"
    },
    {
        skin: "#FFDBAC",
        hair: "#D4A017",
        shirt: "#7C3AED"
    },
    {
        skin: "#6B3F23",
        hair: "#080808",
        shirt: "#F59E0B"
    },
    {
        skin: "#E0AC69",
        hair: "#6B4423",
        shirt: "#0891B2"
    }
];

const hairStyles = [
    "short",
    "curly",
    "fade",
    "long"
];

/**
 * Cria um número fixo baseado no ID/nome do jogador.
 * Isso garante que o avatar não mude toda vez que o jogo abrir.
 */
function avatarSeed(value) {

    let hash = 0;

    const text = String(value);

    for (let i = 0; i < text.length; i++) {
        hash = ((hash << 5) - hash) + text.charCodeAt(i);
        hash |= 0;
    }

    return Math.abs(hash);
}


/**
 * Gera o SVG do avatar.
 */
function createPlayerAvatar(player) {

    const seed = avatarSeed(
        player.id || player.name || "player"
    );

    const style =
        avatarStyles[seed % avatarStyles.length];

    const hair =
        hairStyles[seed % hairStyles.length];

    return `
    <svg
        class="player-avatar"
        viewBox="0 0 100 100"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="Avatar de ${player.name || "jogador"}"
    >

        <!-- Fundo -->
        <rect
            width="100"
            height="100"
            rx="50"
            fill="#15263D"
        />

        <!-- Corpo / camisa -->
        <path
            d="M20 100
               C20 78 34 68 50 68
               C66 68 80 78 80 100"
            fill="${style.shirt}"
        />

        <!-- Pescoço -->
        <path
            d="M42 60 L42 72
               C42 78 58 78 58 72
               L58 60"
            fill="${style.skin}"
        />

        <!-- Cabeça -->
        <ellipse
            cx="50"
            cy="43"
            rx="23"
            ry="27"
            fill="${style.skin}"
        />

        ${generateHair(hair, style.hair)}

        <!-- Olhos -->
        <circle
            cx="42"
            cy="44"
            r="2"
            fill="#171717"
        />

        <circle
            cx="58"
            cy="44"
            r="2"
            fill="#171717"
        />

        <!-- Nariz -->
        <path
            d="M50 45 L48 52 L52 52"
            fill="none"
            stroke="#6B3F23"
            stroke-width="1.5"
        />

        <!-- Boca -->
        <path
            d="M44 58 Q50 62 56 58"
            fill="none"
            stroke="#7A3030"
            stroke-width="2"
            stroke-linecap="round"
        />

        <!-- Detalhe da camisa -->
        <path
            d="M43 72 L50 82 L57 72"
            fill="#ffffff22"
        />

    </svg>
    `;
}


/**
 * Diferentes estilos de cabelo.
 */
function generateHair(type, color) {

    if (type === "curly") {

        return `
        <path
            d="
            M27 40
            C24 27 33 15 48 15
            C64 14 76 25 73 41

            C69 34 64 30 57 28
            C49 25 40 27 34 34
            C31 37 29 40 27 40
            "
            fill="${color}"
        />

        <circle cx="31" cy="29" r="5" fill="${color}" />
        <circle cx="39" cy="21" r="5" fill="${color}" />
        <circle cx="49" cy="18" r="5" fill="${color}" />
        <circle cx="60" cy="21" r="5" fill="${color}" />
        <circle cx="69" cy="29" r="5" fill="${color}" />
        `;
    }

    if (type === "fade") {

        return `
        <path
            d="
            M28 40
            C25 26 34 15 50 15
            C66 15 75 26 72 40
            C66 32 60 29 50 29
            C40 29 34 33 28 40
            "
            fill="${color}"
        />

        <path
            d="M29 32 Q50 20 71 32"
            stroke="#00000044"
            stroke-width="4"
            fill="none"
        />
        `;
    }

    if (type === "long") {

        return `
        <path
            d="
            M28 48
            C20 25 32 12 50 12
            C68 12 80 27 72 51
            L68 65
            L62 42
            C60 31 55 27 50 27
            C42 27 35 34 34 44
            L32 65
            Z
            "
            fill="${color}"
        />
        `;
    }

    // Cabelo curto padrão

    return `
    <path
        d="
        M28 40
        C25 25 34 14 50 14
        C66 14 75 25 72 40
        C66 32 59 29 50 29
        C41 29 34 33 28 40
        "
        fill="${color}"
    />
    `;
}


/**
 * Coloca o avatar dentro de um elemento HTML.
 *
 * Exemplo:
 *
 * <div id="avatar-jogador"></div>
 *
 * renderPlayerAvatar(player, "avatar-jogador");
 */
function renderPlayerAvatar(player, elementId) {

    const element = document.getElementById(elementId);

    if (!element) {
        console.warn(
            "Elemento de avatar não encontrado:",
            elementId
        );

        return;
    }

    element.innerHTML = createPlayerAvatar(player);
}


/**
 * Retorna o avatar pronto para ser colocado
 * dentro de qualquer HTML.
 */
function getPlayerAvatar(player) {

    return createPlayerAvatar(player);

}
