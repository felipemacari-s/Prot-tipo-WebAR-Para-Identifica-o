from flask import Flask, jsonify
from flask_cors import CORS
import paho.mqtt.client as mqtt
import os
from datetime import datetime

app = Flask(__name__)
# O CORS permite que a sua página WebAR faça chamadas fetch() para esta API
CORS(app) 

# 1. Base de Dados em Memória (Dados Estáticos)[cite: 7]
equipamentos_info = {
    "ROBO-01": {
        "id": "ROBO-01",
        "tipo": "Robô Industrial",
        "setor": "Manufatura",
        "status": "operacional"
    }
}

# 2. Base de Dados Dinâmica para Telemetria[cite: 7, 8]
telemetria_data = {
    "ROBO-01": {
        "temperatura": 41.8,
        "vibracao": 2.3,
        "status": "operando",
        "atualizacao": datetime.now().strftime("%H:%M:%S")
    }
}

# --- CONFIGURAÇÃO MQTT ---
# A API vai ler estas variáveis do docker-compose.yml
MQTT_BROKER = os.getenv("MQTT_BROKER_HOST", "localhost")
MQTT_PORT = int(os.getenv("MQTT_BROKER_PORT", 1883))

def on_connect(client, userdata, flags, rc):
    print(f"Conectado ao broker MQTT com código {rc}")
    # Subscreve a todos os sensores de qualquer equipamento (ex: industria/ROBO-01/temperatura)
    client.subscribe("industria/+/+")

def on_message(client, userdata, msg):
    topic_parts = msg.topic.split("/")
    if len(topic_parts) == 3:
        _, equip_id, sensor = topic_parts
        payload = msg.payload.decode("utf-8")
        
        # Se o equipamento não existir na telemetria, cria-o
        if equip_id not in telemetria_data:
            telemetria_data[equip_id] = {}
            
        # Converte valores numéricos se necessário e atualiza
        if sensor in ["temperatura", "vibracao"]:
            telemetria_data[equip_id][sensor] = float(payload)
        else:
            telemetria_data[equip_id][sensor] = payload
            
        # Grava a hora da última atualização
        telemetria_data[equip_id]["atualizacao"] = datetime.now().strftime("%H:%M:%S")
        print(f"Dado MQTT recebido: [{equip_id}] {sensor} = {payload}")

# Inicializa o cliente MQTT em background
mqtt_client = mqtt.Client()
mqtt_client.on_connect = on_connect
mqtt_client.on_message = on_message

try:
    mqtt_client.connect(MQTT_BROKER, MQTT_PORT, 60)
    mqtt_client.loop_start() # Mantém o MQTT a correr sem bloquear o Flask
except Exception as e:
    print(f"Aviso: Não foi possível conectar ao MQTT: {e}")

# --- ENDPOINTS FLASK ---

@app.route('/api/equipamentos/<equip_id>', methods=['GET'])
def get_equipamento(equip_id):
    dados = equipamentos_info.get(equip_id)
    if dados:
        return jsonify(dados)
    return jsonify({"erro": "Equipamento não encontrado"}), 404

@app.route('/api/equipamentos/<equip_id>/telemetria', methods=['GET'])
def get_telemetria(equip_id):
    dados = telemetria_data.get(equip_id)
    if dados:
        return jsonify(dados)
    return jsonify({"erro": "Telemetria não encontrada"}), 404

if __name__ == '__main__':
    # host='0.0.0.0' é obrigatório no Docker para que a API seja acessível fora do contentor
    app.run(host='0.0.0.0', port=5000)