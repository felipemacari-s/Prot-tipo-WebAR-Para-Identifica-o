// 1. Registamos o clique diretamente no motor A-Frame (MUITO mais fiável no telemóvel)
AFRAME.registerComponent('hotspot-clicavel', {
    schema: {
        tipo: { type: 'string' }
    },
    init: function () {
        const aoTocar = (evento) => {
            // Impede comportamentos padrão que podem cancelar o toque
            evento.preventDefault(); 
            
            const tipo = this.data.tipo;
            
            if (tipo === 'identificacao') {
                mostrarPainel("Identificação", "<b>Ativo:</b> Robô Industrial (ROBO-01)<br><b>Setor:</b> Manufatura Avançada<br><b>Função:</b> Soldadura e montagem.");
            } else if (tipo === 'componentes') {
                mostrarPainel("Componentes", "<b>Braço Articulado:</b> 6 eixos de liberdade.<br><b>Garra/Efetuador:</b> Sistema pneumático ativo.");
            } else if (tipo === 'manutencao') {
                mostrarPainel("Manutenção", "<b>Ação Recomendada:</b> Lubrificação das juntas a cada 500 horas.<br><b>Última revisão:</b> 15/09/2026.");
            } else if (tipo === 'monitoramento') {
                mostrarPainel("Monitorização (Ao Vivo)", "A consultar serviços...");
                carregarTelemetria("ROBO-01");
            }
        };

        // Escuta tanto o clique do rato (PC) como o toque no ecrã (Telemóvel)
        this.el.addEventListener('click', aoTocar);
    }
});

// 2. Variáveis e Lógica do Painel HTML
let painel, titulo, conteudo;

function mostrarPainel(novoTitulo, novoConteudo) {
    titulo.textContent = novoTitulo;
    conteudo.innerHTML = novoConteudo;
    painel.classList.remove("oculto");
}

async function carregarTelemetria(idEquipamento) {
    // IMPORTANTE: Mantenha aqui o IP do seu computador ou link do VS Code/Ngrok
    const URL_API = `http://10.110.12.47:5000/api/equipamentos/${idEquipamento}/telemetria`;

    try {
        const resposta = await fetch(URL_API);
        if (!resposta.ok) throw new Error("Erro na API");
        const dados = await resposta.json();
        
        const htmlDados = `
            <b>Status:</b> ${dados.status}<br>
            <b>Temperatura:</b> ${dados.temperatura} °C<br>
            <b>Vibração:</b> ${dados.vibracao} mm/s<br>
            <b>Última atualização:</b> ${dados.atualizacao}
        `;
        mostrarPainel("Monitorização (Ao Vivo)", htmlDados);
    } catch (erro) {
        mostrarPainel("Falha de Comunicação", "<p class='erro'>Não foi possível consultar os dados do equipamento. Verifique o serviço.</p>");
    }
}

// 3. Inicializa o botão de fechar quando a página carrega
document.addEventListener("DOMContentLoaded", () => {
    painel = document.getElementById("painel-info");
    titulo = document.getElementById("painel-titulo");
    conteudo = document.getElementById("painel-conteudo");
    
    document.getElementById("btn-fechar").addEventListener("click", () => {
        painel.classList.add("oculto");
    });
});