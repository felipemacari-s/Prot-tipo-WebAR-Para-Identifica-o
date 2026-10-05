document.addEventListener("DOMContentLoaded", () => {
    // Referências ao painel de interface
    const painel = document.getElementById("painel-info");
    const titulo = document.getElementById("painel-titulo");
    const conteudo = document.getElementById("painel-conteudo");
    const btnFechar = document.getElementById("btn-fechar");

    // Fecha o painel
    btnFechar.addEventListener("click", () => {
        painel.classList.add("oculto");
    });

    function mostrarPainel(novoTitulo, novoConteudo) {
        titulo.textContent = novoTitulo;
        conteudo.innerHTML = novoConteudo;
        painel.classList.remove("oculto");
    }

// --- HOTSPOTS ESTÁTICOS ---
    document.getElementById("hs-identificacao").addEventListener("mousedown", () => {
        mostrarPainel("Identificação", "<b>Ativo:</b> Robô Industrial (ROBO-01)<br><b>Setor:</b> Manufatura Avançada<br><b>Função:</b> Soldadura e montagem.");
    });

    document.getElementById("hs-componentes").addEventListener("mousedown", () => {
        mostrarPainel("Componentes", "<b>Braço Articulado:</b> 6 eixos de liberdade.<br><b>Garra/Efetuador:</b> Sistema pneumático ativo.");
    });

    document.getElementById("hs-manutencao").addEventListener("mousedown", () => {
        mostrarPainel("Manutenção", "<b>Ação Recomendada:</b> Lubrificação das juntas a cada 500 horas.<br><b>Última revisão:</b> 15/09/2026.");
    });

    // --- HOTSPOT DINÂMICO (API FLASK + MQTT) ---
    document.getElementById("hs-monitoramento").addEventListener("mousedown", () => {
        mostrarPainel("Monitorização (Ao Vivo)", "A consultar serviços...");
        carregarTelemetria("ROBO-01");
    });

    async function carregarTelemetria(idEquipamento) {
        // IMPORTANTE: Substitua IP_DO_SEU_COMPUTADOR pelo endereço IPv4 da sua máquina na rede Wi-Fi
        const URL_API = `http://10.110.12.47:5000/api/equipamentos/${idEquipamento}/telemetria`;

        try {
            const resposta = await fetch(URL_API);
            
            if (!resposta.ok) {
                throw new Error(`Erro na API: HTTP ${resposta.status}`);
            }
            
            const dados = await resposta.json();
            
            // Apresenta status e dois dados simulados (RF06)
            const htmlDados = `
                <b>Status:</b> ${dados.status}<br>
                <b>Temperatura:</b> ${dados.temperatura} °C<br>
                <b>Vibração:</b> ${dados.vibracao} mm/s<br>
                <b>Última atualização:</b> ${dados.atualizacao}
            `;
            mostrarPainel("Monitorização (Ao Vivo)", htmlDados);

        } catch (erro) {
            console.error("Falha ao consultar a API:", erro);
            // Mensagem de indisponibilidade exigida na Etapa 10[cite: 10]
            const htmlErro = `
                <p class="erro">Não foi possível consultar os dados do equipamento.</p>
                <p class="erro">Verifique a disponibilidade do serviço e tente novamente.</p>
            `;
            mostrarPainel("Falha de Comunicação", htmlErro);
        }
    }
});



/*O que falta:
*Gerar o robo01.mind no MindAR Target Compiler e colocá-lo em frontend/assets/targets/.
Ajustar as posições dos hotspots em HOTSPOTS, no app.js. As coordenadas atuais são só um ponto de partida, de -0.5 a 0.5 em relação ao centro da imagem.
Ajustar API_BASE no app.js. No celular com HTTPS, a API também precisa estar em HTTPS (túnel ngrok/cloudflared, por exemplo), senão o navegador bloqueia a chamada.
Criar docs/arquitetura.png.
No teste T06, pare o simulador antes de publicar o valor manual, senão ele sobrescreve em 3 s.*/
