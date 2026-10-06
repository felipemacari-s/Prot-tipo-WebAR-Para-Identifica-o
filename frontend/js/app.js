// Registra o componente ANTES da cena ser renderizada
AFRAME.registerComponent('ar-event-listener', {
    init: function () {
        const scene = this.el;
        const status = document.querySelector("#status");
        const badge = document.querySelector("#badge");

        badge.addEventListener("pointerup", (event) => {
            event.preventDefault(); // Evita comportamentos duplos no mobile

            status.textContent = "Acessando câmera...";
            badge.textContent = "INICIANDO...";
            badge.disabled = true;

            scene.systems["mindar-image-system"].start();
        });

        // Escuta quando a câmera liga
        scene.addEventListener("arReady", () => {
            status.textContent = "Câmera pronta. Aponte para a imagem.";
            badge.textContent = "PROCURANDO ALVO";
            console.log("EVENTO: arReady disparado!"); // Para você ver no Eruda
        });

        // Escuta se houver erro
        scene.addEventListener("arError", () => {
            status.textContent = "Erro ao ligar a câmera.";
            badge.textContent = "ERRO";
            console.log("EVENTO: arError disparado!");
        });
    }
});

document.addEventListener("DOMContentLoaded", () => {
    // Seleciona todos os botões que são hotspots
    const hotspots = document.querySelectorAll(".hotspot");

    hotspots.forEach(hotspot => {
        hotspot.addEventListener("click", (e) => {
            // Captura as informações do botão clicado a partir dos atributos HTML
            const componenteNome = hotspot.getAttribute("aria-label");
            const topico = hotspot.getAttribute("data-topic");

            // Envia os dados para o backend Flask silenciosamente
            fetch("/registro", {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                },
                // Formata os dados como se fossem enviados por um formulário HTML
                body: new URLSearchParams({
                    "componente": componenteNome,
                    "observacao": `Interação no hotspot do tópico: ${topico}`
                })
            })
                .then(response => {
                    if (response.ok) {
                        console.log(`Sucesso: Entrada registrada para ${componenteNome}`);
                        // Opcional: Você pode adicionar um aviso visual rápido (toast) aqui
                    } else {
                        console.error("Erro ao registrar a entrada no servidor.");
                    }
                })
                .catch(error => {
                    console.error("Erro de comunicação com o servidor:", error);
                });

            // --------------------------------------------------------
            // LÓGICA DO PAINEL DE INFORMAÇÕES (Mantenha a sua existente)
            // --------------------------------------------------------
            const infoPanel = document.getElementById("info-panel");
            const infoTitle = document.getElementById("info-title");

            infoTitle.textContent = componenteNome;
            infoPanel.classList.remove("hidden");
        });
    });

    // Lógica para fechar o painel
    document.getElementById("close-panel").addEventListener("click", () => {
        document.getElementById("info-panel").classList.add("hidden");
    });
});

function atualizarDadosSensor() {
    fetch("/api/sensor")
        .then(response => response.json())
        .then(data => {
            if (data.temperatura !== "--") {
                const statusElement = document.getElementById("status");
                if (statusElement) {
                    statusElement.textContent = `Temperatura do Motor: ${data.temperatura} °${data.unidade}`;
                    // Pode adicionar lógica para mudar a cor se a temperatura passar dos 28 graus, por exemplo:
                    if (data.temperatura > 28) {
                        statusElement.style.color = "#ff4444";
                        statusElement.style.fontWeight = "bold";
                    } else {
                        statusElement.style.color = "#ffffff";
                    }
                }
            }
        })
        .catch(error => console.error("Erro ao buscar dados do sensor:", error));
}

// Inicia o ciclo de atualização a cada 2 segundos (2000 ms)
setInterval(atualizarDadosSensor, 2000);

document.addEventListener(
    "DOMContentLoaded",
    () => {
        /* =========================================================
        1. REFERÊNCIAS À CENA DE RA
        ========================================================= */
        const scene =
            document.querySelector("#ar-scene");
        const target =
            document.querySelector("#target");
        const cameraElement =
            document.querySelector("#ar-camera");

        /* =========================================================
        2. REFERÊNCIAS À INTERFACE HTML
        ========================================================= */
        const status =
            document.querySelector("#status");
        const badge =
            document.querySelector("#badge");
        const panel =
            document.querySelector("#info-panel");
        const panelTitle =
            document.querySelector("#info-title");
        const panelText =
            document.querySelector("#info-text");
        const panelDetail =
            document.querySelector("#info-detail");
        const closeButton =
            document.querySelector("#close-panel");

        /*
        * Busca os quatro BOTÕES HTML.
        *
        * Se este resultado estiver vazio, significa que
        * index.html e app.js estão em versões incompatíveis.
        */
        const hotspots =
            Array.from(
                document.querySelectorAll(".hotspot")
            );

        /*
        * Guarda se o MindAR está rastreando o target.
        */
        let tracking =
            false;

        /* =========================================================
        3. BASE DE DADOS DIDÁTICA
        ========================================================= */
        const information = {
            cabeca: {
                title:
                    "Controlador do Robô",
                text:
                    "O controlador é o 'cérebro' do sistema. Ele processa o programa de automação e envia os comandos de movimento para os servo motores.",
                detail:
                    "Garante a precisão das trajetórias e faz a comunicação com outros equipamentos da célula de manufatura."
            },
            tronco: {
                title:
                    "Base e Coluna",
                text:
                    "A base fixa o robô firmemente ao piso, enquanto a coluna suporta o peso da estrutura e permite o eixo de rotação principal.",
                detail:
                    "Uma fixação rígida e estável é essencial para absorver inércias e garantir a repetibilidade dos movimentos."
            },
            braco: {
                title:
                    "Braço Manipulador",
                text:
                    "Composto por elos e articulações, o braço proporciona os graus de liberdade necessários para posicionar a ferramenta no espaço.",
                detail:
                    "A geometria e o comprimento do braço definem o alcance e o volume de trabalho (envelope) do robô."
            },
            mao: {
                title:
                    "Efetor Final (Garra / Ferramenta)",
                text:
                    "Acoplado na extremidade do braço, é o dispositivo que interage diretamente com a peça, como garras mecânicas, tochas de solda ou ventosas.",
                detail:
                    "O efetor final é sempre customizado de acordo com a aplicação específica da linha de produção."
            }
        };

        /* =========================================================
        4. FUNÇÃO QUE ABRE O PAINEL
        ========================================================= */
        function showInformation(topicName) {
            const selected =
                information[topicName];

            /*
            * Proteção contra data-topic inexistente.
            */
            if (!selected) {
                return;
            }

            panelTitle.textContent =
                selected.title;
            panelText.textContent =


                selected.text;
            panelDetail.textContent =
                selected.detail;

            /*
            * Remove hidden e mostra o painel.
            */
            panel.classList.remove(
                "hidden"
            );
        }

        /* =========================================================
        5. FUNÇÃO QUE FECHA O PAINEL
        ========================================================= */
        function hideInformation() {
            panel.classList.add(
                "hidden"
            );
        }

        /* =========================================================
        6. EVENTOS DOS HOTSPOTS
        pointerup funciona com:
        - mouse;
        - toque;
        - caneta.
        Não dependemos mais do raycaster para o clique.
        ========================================================= */
        hotspots.forEach(
            (button) => {
                button.addEventListener(
                    "pointerup",
                    (event) => {
                        event.preventDefault();
                        event.stopPropagation();

                        const topicName =
                            button.dataset.topic;

                        showInformation(
                            topicName
                        );
                    }
                );
            }
        );

        /* =========================================================
        
        Realidade Aumentada — Manual Interativo do Torno CNC | Roteiro do Aluno
        
        7. BOTÃO DE FECHAR
        ========================================================= */
        closeButton.addEventListener(
            "pointerup",
            (event) => {
                event.preventDefault();
                hideInformation();
            }
        );

        /* =========================================================
        8. MINDAR PRONTO
        ========================================================= */
        scene.addEventListener(
            "arReady",
            () => {
                status.textContent =
                    "Câmera pronta. Aponte para a imagem do torno.";
                badge.textContent =
                    "PROCURANDO ALVO";
            }
        );

        /* =========================================================
        9. ERRO AO INICIAR RA
        ========================================================= */
        scene.addEventListener(
            "arError",
            () => {
                status.textContent =
                    "Não foi possível iniciar a câmera.";
                badge.textContent =
                    "ERRO";
            }
        );

        /* =========================================================
        10. TARGET ENCONTRADO
        ========================================================= */
        target.addEventListener(
            "targetFound",
            () => {
                tracking =
                    true;

                status.textContent =
                    "Torno reconhecido. Toque em um ponto numerado.";
                badge.textContent =
                    "● RA ATIVA";
                /*
                * Agora os botões podem aparecer.
                */
                hotspots.forEach(
                    (button) => {
                        button.classList.add(
                            "visible"
                        );
                    }
                );
            }
        );

        /* =========================================================
        11. TARGET PERDIDO
        ========================================================= */
        target.addEventListener(
            "targetLost",
            () => {
                tracking =
                    false;

                status.textContent =
                    "Alvo perdido. Aponte novamente para a imagem.";
                badge.textContent =
                    "PROCURANDO ALVO";

                hotspots.forEach(
                    (button) => {
                        button.classList.remove(
                            "visible"
                        );
                    }
                );

                hideInformation();
            }
        );

        /* =========================================================
        12. CONVERTER POSIÇÃO 3D EM POSIÇÃO 2D
        Cada botão possui:
        data-x
        data-y
        data-z
        Essas coordenadas representam um ponto local no target.
        O processo é:
        posição local
        ↓
        posição no mundo 3D
        
        Realidade Aumentada — Manual Interativo do Torno CNC | Roteiro do Aluno
        
        ↓
        projeção pela câmera
        ↓
        pixels da tela
        ========================================================= */
        function updateHotspotPositions() {
            /*
            * Agenda a próxima atualização.
            */
            requestAnimationFrame(
                updateHotspotPositions
            );

            /*
            * Não precisamos calcular nada
            * enquanto o target não estiver ativo.
            */
            if (!tracking) {
                return;
            }

            /*
            * Obtém a câmera Three.js interna do A-Frame.
            */
            const camera =
                cameraElement.getObject3D(
                    "camera"
                );

            /*
            * Aguarda a inicialização completa.
            */
            if (
                !camera ||
                !target.object3D
            ) {
                return;
            }

            /*
            * Atualiza as matrizes antes do cálculo.
            */
            target.object3D.updateMatrixWorld(
                true
            );
            camera.updateMatrixWorld(
                true
            );

            /*
            * Recalcula a posição de cada botão.
            */
            hotspots.forEach(
                (button) => {
                    /*
                    * Cria o ponto local relativo ao target.
                    */
                    const localPoint =
                        new THREE.Vector3(
                            Number(button.dataset.x),
                            Number(button.dataset.y),
                            Number(button.dataset.z)
                        );


                    /*
                    * Converte de coordenadas locais
                    * para coordenadas do mundo 3D.
                    */
                    const worldPoint =
                        target.object3D.localToWorld(
                            localPoint
                        );

                    /*
                    * Projeta o ponto usando a câmera.
                    */
                    const projectedPoint =
                        worldPoint
                            .clone()
                            .project(camera);

                    /*
                    * Converte -1..+1 para pixels.
                    */
                    const screenX =
                        (
                            projectedPoint.x * 0.5 +
                            0.5
                        ) *
                        window.innerWidth;

                    const screenY =
                        (
                            -projectedPoint.y * 0.5 +
                            0.5
                        ) *
                        window.innerHeight;

                    /*
                    * Posiciona o botão HTML.
                    */
                    button.style.left =
                        `${screenX}px`;
                    button.style.top =
                        `${screenY}px`;

                    /*
                    * Evita exibir botões fora da área útil.
                    */
                    const insideScreen =
                        projectedPoint.z > -1 &&
                        projectedPoint.z < 1 &&
                        screenX > -80 &&
                        screenX < window.innerWidth + 80 &&
                        screenY > -80 &&
                        screenY < window.innerHeight + 80;

                    button.style.visibility =
                        insideScreen
                            ? "visible"
                            : "hidden";
                }
            );
        }

        /* =========================================================
        13. INICIA A ATUALIZAÇÃO DOS HOTSPOTS
        ========================================================= */

        updateHotspotPositions();
    }
);
