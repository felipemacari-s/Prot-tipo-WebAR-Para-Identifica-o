document.addEventListener("DOMContentLoaded", () => {
    const painel = document.getElementById("painel-info");
    const titulo = document.getElementById("painel-titulo");
    const conteudo = document.getElementById("painel-conteudo");
    const btnFechar = document.getElementById("btn-fechar");

    btnFechar.addEventListener("click", () => {
        painel.classList.add("oculto");
    });

    function mostrarPainel(novoTitulo, novoConteudo) {
        titulo.textContent = novoTitulo;
        conteudo.innerHTML = novoConteudo;
        painel.classList.remove("oculto");
    }

    // Função auxiliar para garantir que o clique é registado corretamente
    function configurarHotspot(idElemento, tituloInfo, conteudoInfo) {
        const elemento = document.getElementById(idElemento);
        if (elemento) {
            elemento.addEventListener("click", () => {
                mostrarPainel(tituloInfo, conteudoInfo);
            });
        }
    }

    // --- HOTSPOTS ESTÁTICOS ---
    configurarHotspot("hs-identificacao", "Identificação", "<b>Ativo:</b> Robô Industrial (ROBO-01)<br><b>Setor:</b> Manufatura Avançada<br><b>Função:</b> Soldadura e montagem.");
    configurarHotspot("hs-componentes", "Componentes", "<b>Braço Articulado:</b> 6 eixos de liberdade.<br><b>Garra/Efetuador:</b> Sistema pneumático ativo.");
    configurarHotspot("hs-manutencao", "Manutenção", "<b>Ação Recomendada:</b> Lubrificação das juntas a cada 500 horas.<br><b>Última revisão:</b> 15/09/2026.");

    // --- HOTSPOT DINÂMICO (API FLASK + MQTT) ---
    const btnMonitoramento = document.getElementById("hs-monitoramento");
    if (btnMonitoramento) {
        btnMonitoramento.addEventListener("click", () => {
            mostrarPainel("Monitorização (Ao Vivo)", "A consultar serviços...");
            carregarTelemetria("ROBO-01");
        });
    }

    async function carregarTelemetria(idEquipamento) {
        // Substitua aqui pelo IP da sua máquina ou pelo link HTTPS gerado pelo VS Code
        const URL_API = `http://10.110.12.47:5000/api/equipamentos/${idEquipamento}/telemetria`;

        try {
            const resposta = await fetch(URL_API);
            
            if (!resposta.ok) {
                throw new Error(`Erro na API: HTTP ${resposta.status}`);
            }
            
            const dados = await resposta.json();
            
            // Apresenta status e dados simulados (RF06)[cite: 5]
            const htmlDados = `
                <b>Status:</b> ${dados.status}<br>
                <b>Temperatura:</b> ${dados.temperatura} °C<br>
                <b>Vibração:</b> ${dados.vibracao} mm/s<br>
                <b>Última atualização:</b> ${dados.atualizacao}
            `;
            mostrarPainel("Monitorização (Ao Vivo)", htmlDados);

        } catch (erro) {
            console.error("Falha ao consultar a API:", erro);
            // Mensagem de indisponibilidade (Etapa 10)[cite: 10]
            const htmlErro = `
                <p class="erro">Não foi possível consultar os dados do equipamento.</p>
                <p class="erro">Verifique a disponibilidade do serviço e tente novamente.</p>
            `;
            mostrarPainel("Falha de Comunicação", htmlErro);
        }
    }
});