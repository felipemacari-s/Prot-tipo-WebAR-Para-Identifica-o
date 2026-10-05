document.addEventListener("DOMContentLoaded", () => {
  /* ---------- Configuração ---------- */

  // Endereço da API Flask. No celular, "localhost" aponta para o próprio
  // celular: use o IP do computador na rede (ex.: http://192.168.0.10:5000).
  const API_BASE = "http://localhost:5000";
  const EQUIPAMENTO_ID = "ROBO-01";
  const POLLING_MS = 3000;
  const TIMEOUT_MS = 4000;

  /* ---------- Elementos ---------- */

  const scene = document.querySelector("#ar-scene");
  const target = document.querySelector("#target");
  const cameraElement = document.querySelector("#ar-camera");

  const status = document.querySelector("#status");
  const badge = document.querySelector("#badge");
  const panel = document.querySelector("#info-panel");
  const panelTitle = document.querySelector("#info-title");
  const panelText = document.querySelector("#info-text");
  const panelDetail = document.querySelector("#info-detail");
  const closeButton = document.querySelector("#close-panel");

  const hotspots = Array.from(document.querySelectorAll(".hotspot"));

  let tracking = false;
  let pollTimer = null;
  let telemetryActive = false;  

  /* ---------- Conteúdo estático (didático) ---------- */

  const information = {
    base: {
      title: "Base e armário de controle",
      text: "Controlador: modelo XYZ-100, alimentação trifásica 380 V, firmware v2.4.1.",
      detail: "A base deve ser ancorada ao piso conforme a especificação do fabricante."
    },
    braco: {
      title: "Braço articulado e punho",
      text: "6 eixos, alcance máximo de 1,4 m e carga útil de 10 kg.",
      detail: "A graxa/óleo das redutoras deve ser substituída no intervalo indicado no manual."
    },
    efetuador: {
      title: "Efetuador final / garra",
      text: "Garra pneumática com pressão de acionamento de 6 bar e troca rápida de ferramenta.",
      detail: "Despressurize o circuito e bloqueie o robô antes de trocar a ferramenta."
    }
    // "telemetria" é dinâmico: vem da API Flask.
  };

  /* ---------- Painel ---------- */

  function showPanel(title, text, detail) {
    panelTitle.textContent = title;
    panelText.textContent = text;
    panelDetail.textContent = detail;
    panel.classList.remove("hidden");
  }

  function stopPolling() {
    telemetryActive = false;
    if (pollTimer !== null) {
      clearInterval(pollTimer);
      pollTimer = null;
    }
  }

  function hideInformation() {
    stopPolling();
    panel.classList.add("hidden");
  }

  /* ---------- Telemetria (API Flask) ---------- */

  async function fetchTelemetry() {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);
    

    try {
      const response = await fetch(
        `${API_BASE}/api/equipamentos/${EQUIPAMENTO_ID}/telemetria`,
        { signal: controller.signal }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      if (!telemetryActive) return; 


      showPanel(
        `Telemetria — ${EQUIPAMENTO_ID}`,
        `Status: ${data.status} | Temperatura: ${data.temperatura} °C | Vibração: ${data.vibracao} mm/s`,
        `Última atualização: ${data.atualizacao}`
      );
    } catch (error) {
      if (!telemetryActive) return; 
      const fmt = (v, un = "") => (v == null ? "—" : v + un);

      // Tratamento de indisponibilidade: a RA continua funcionando.
      showPanel(
        `Telemetria — ${EQUIPAMENTO_ID}`,
         `Status: ${fmt(data.status)} | Temperatura: ${fmt(data.temperatura, " °C")} | Vibração: ${fmt(data.vibracao, " mm/s")}`,
  `Última atualização: ${fmt(data.atualizacao)}`
      );
    } finally {
      clearTimeout(timeoutId);
    }
  }

  function startTelemetry() {
    stopPolling();
    telemetryActive = true;
    fetchTelemetry();
    
    pollTimer = setInterval(fetchTelemetry, POLLING_MS);
  }
  

  /* ---------- Hotspots ---------- */

  function handleHotspot(topicName) {
    stopPolling();

    if (topicName === "telemetria") {
      startTelemetry();
      return;
    }

    const selected = information[topicName];
    if (!selected) {
      return;
    }
    showPanel(selected.title, selected.text, selected.detail);
  }

  hotspots.forEach((button) => {
    button.addEventListener("pointerup", (event) => {
      event.preventDefault();
      event.stopPropagation();
      handleHotspot(button.dataset.topic);
    });
  });

  closeButton.addEventListener("pointerup", (event) => {
    event.preventDefault();
    hideInformation();
  });

  /* ---------- Eventos da cena e do target ---------- */

  scene.addEventListener("arReady", () => {
    status.textContent = "Câmera pronta. Aponte para a imagem do robô.";
    badge.textContent = "PROCURANDO ALVO";
  });

  scene.addEventListener("arError", () => {
    status.textContent = "Não foi possível iniciar a câmera.";
    badge.textContent = "ERRO";
  });

  target.addEventListener("targetFound", () => {
    tracking = true;
    status.textContent = "Robô reconhecido. Toque em um ponto numerado.";
    badge.textContent = "● RA ATIVA";
    hotspots.forEach((button) => button.classList.add("visible"));
  });

  target.addEventListener("targetLost", () => {
    tracking = false;
    status.textContent = "Alvo perdido. Aponte novamente para a imagem.";
    badge.textContent = "PROCURANDO ALVO";
    hotspots.forEach((button) => button.classList.remove("visible"));
    hideInformation();
  });

  /* ---------- Projeção 3D -> tela ---------- */

  function updateHotspotPositions() {
    requestAnimationFrame(updateHotspotPositions);

    if (!tracking) {
      return;
    }

    const camera = cameraElement.getObject3D("camera");
    if (!camera || !target.object3D) {
      return;
    }

    target.object3D.updateMatrixWorld(true);
    camera.updateMatrixWorld(true);

    hotspots.forEach((button) => {
      const localPoint = new THREE.Vector3(
        Number(button.dataset.x),
        Number(button.dataset.y),
        Number(button.dataset.z)
      );

      const worldPoint = target.object3D.localToWorld(localPoint);
      const projectedPoint = worldPoint.clone().project(camera);

      const screenX = (projectedPoint.x * 0.5 + 0.5) * window.innerWidth;
      const screenY = (-projectedPoint.y * 0.5 + 0.5) * window.innerHeight;

      button.style.left = `${screenX}px`;
      button.style.top = `${screenY}px`;

      const insideScreen =
        projectedPoint.z > -1 &&
        projectedPoint.z < 1 &&
        screenX > -80 &&
        screenX < window.innerWidth + 80 &&
        screenY > -80 &&
        screenY < window.innerHeight + 80;

      button.style.visibility = insideScreen ? "visible" : "hidden";
    });
  }

  updateHotspotPositions();
});






/*O que falta:
*Gerar o robo01.mind no MindAR Target Compiler e colocá-lo em frontend/assets/targets/.
Ajustar as posições dos hotspots em HOTSPOTS, no app.js. As coordenadas atuais são só um ponto de partida, de -0.5 a 0.5 em relação ao centro da imagem.
Ajustar API_BASE no app.js. No celular com HTTPS, a API também precisa estar em HTTPS (túnel ngrok/cloudflared, por exemplo), senão o navegador bloqueia a chamada.
Criar docs/arquitetura.png.
No teste T06, pare o simulador antes de publicar o valor manual, senão ele sobrescreve em 3 s.*/
