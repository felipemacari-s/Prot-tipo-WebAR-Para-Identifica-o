# Prot-tipo-WebAR-Para-Identifica-o
final: Protótipo funcional de uma aplicação WebAR para identificação, consulta e monitoramento simulado de ativos industriais, integrada a uma API Flask, MQTT, Docker e Docker Compose.
Teste de baixo para cima: primeiro a API, depois a RA no computador, depois o celular.

1. Backend (sem a RA)

bash
docker compose up --build

Em outro terminal:

bash
curl http://localhost:5000/health
curl http://localhost:5000/api/equipamentos/ROBO-01
curl http://localhost:5000/api/equipamentos/ROBO-01/telemetria

O /health deve mostrar "mqtt": "conectado". Repita a telemetria e veja atualizacao mudar a cada poucos segundos. Isso confirma o simulador, o broker e a API (checkpoints 3, 5 e 6).

2. RA no computador

A câmera funciona em localhost sem HTTPS. Dentro da pasta do frontend:

bash
python -m http.server 8080

Abra http://localhost:8080, permita a webcam e aponte para a imagem do robô aberta no celular ou impressa. Confira nesta ordem:

o selo muda para "RA ATIVA" e os quatro hotspots aparecem sobre a imagem;
eles acompanham quando você mexe a imagem (T03);
os hotspots 1, 2 e 3 abrem o texto (T04);
o 4 mostra a telemetria e se atualiza sozinho, por causa do polling (T05);
se algo falhar, abra o DevTools (F12) e veja a aba Console. Um 404 na aba Network quase sempre é o caminho do .mind.

3. Atualização via MQTT e falha da API (T06 a T09)

bash
docker compose stop simulator
docker compose exec mqtt mosquitto_pub -t industria/ROBO-01/temperatura -m 47.2

Com o painel de telemetria aberto, o valor deve mudar para 47.2 em até 3 s. Depois:

bash
docker compose stop backend    # deve aparecer a mensagem de indisponibilidade
docker compose start backend   # a consulta volta sozinha

Pare o simulador antes de publicar à mão, senão ele sobrescreve o seu valor.

4. No celular

A câmera exige HTTPS, e o localhost do celular não é o do seu computador. Você precisa publicar o frontend (GitHub Pages) ou usar um túnel HTTPS para ele.
A API também precisa de HTTPS, senão o navegador bloqueia a chamada. Um túnel (ngrok ou cloudflared) apontando para a porta 5000 resolve para o teste.
Troque o API_BASE no app.js pela URL HTTPS da API.
Se o celular e o computador estão na mesma rede, o IP da máquina (http://192.168.x.x:5000) funciona só enquanto a página não estiver em HTTPS. Para a demonstração real, use HTTPS nos dois.