import os
import threading
from datetime import datetime

import paho.mqtt.client as mqtt
from flask import Flask, jsonify
from flask_cors import CORS

MQTT_HOST = os.getenv("MQTT_HOST", "localhost")
MQTT_PORT = int(os.getenv("MQTT_PORT", "1883"))
TOPICO_BASE = "industria"

app = Flask(__name__)
CORS(app)  # permite a WebAR (outra origem) consultar a API

# Dados de identificação (cadastro do ativo)
EQUIPAMENTOS = {
    "ROBO-01": {
        "id": "ROBO-01",
        "tipo": "Robô industrial 6 eixos",
        "setor": "Manufatura",
        "status": "operacional",
    }
}

# Último dado recebido por MQTT, mantido EM MEMÓRIA (se a API reiniciar, zera
# até chegar nova publicação).
lock = threading.Lock()
telemetria = {
    eid: {"temperatura": None, "vibracao": None, "status": "sem dados", "atualizacao": None}
    for eid in EQUIPAMENTOS
}
mqtt_conectado = False


# ---------- MQTT ----------
def on_connect(client, userdata, flags, reason_code, properties=None):
    global mqtt_conectado
    mqtt_conectado = not reason_code.is_failure
    if mqtt_conectado:
        client.subscribe(f"{TOPICO_BASE}/+/+")  # industria/<id>/<campo>
        print("MQTT conectado e inscrito em", f"{TOPICO_BASE}/+/+", flush=True)


def on_disconnect(client, userdata, disconnect_flags, reason_code, properties=None):
    global mqtt_conectado
    mqtt_conectado = False
    print("MQTT desconectado", flush=True)


def on_message(client, userdata, msg):
    partes = msg.topic.split("/")
    if len(partes) != 3:
        return
    _, eid, campo = partes
    if eid not in telemetria or campo not in ("temperatura", "vibracao", "status"):
        return
    valor = msg.payload.decode(errors="ignore").strip()
    if campo in ("temperatura", "vibracao"):
        try:
            valor = float(valor)
        except ValueError:
            return  # ignora payload inválido
    with lock:
        telemetria[eid][campo] = valor
        telemetria[eid]["atualizacao"] = datetime.now().strftime("%H:%M:%S")


def iniciar_mqtt():
    client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2)
    client.on_connect = on_connect
    client.on_disconnect = on_disconnect
    client.on_message = on_message
    client.reconnect_delay_set(min_delay=1, max_delay=10)
    # connect_async + loop_start: a API sobe mesmo com o broker fora do ar
    # e reconecta sozinha quando ele voltar.
    client.connect_async(MQTT_HOST, MQTT_PORT)
    client.loop_start()


iniciar_mqtt()


# ---------- ROTAS ----------
@app.get("/api/equipamentos/<eid>")
def identificacao(eid):
    if eid not in EQUIPAMENTOS:
        return jsonify({"erro": "equipamento não encontrado"}), 404
    return jsonify(EQUIPAMENTOS[eid])


@app.get("/api/equipamentos/<eid>/telemetria")
def telemetria_equipamento(eid):
    if eid not in EQUIPAMENTOS:
        return jsonify({"erro": "equipamento não encontrado"}), 404
    with lock:
        return jsonify(dict(telemetria[eid]))


@app.get("/health")
def health():
    return jsonify({"api": "ok", "mqtt": "conectado" if mqtt_conectado else "desconectado"})


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
