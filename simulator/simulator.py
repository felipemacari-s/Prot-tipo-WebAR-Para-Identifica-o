import paho.mqtt.client as mqtt
import time
import random
import os

# Lê as configurações a partir das variáveis de ambiente do Docker Compose
MQTT_BROKER = os.getenv("MQTT_BROKER_HOST", "localhost")
MQTT_PORT = int(os.getenv("MQTT_BROKER_PORT", 1883))

# Identificação do equipamento (deve corresponder ao que está no backend)
EQUIPAMENTO_ID = "ROBO-01"

# Cria a instância do cliente MQTT
client = mqtt.Client("Simulador_ROBO_01")

def conectar_mqtt():
    """Tenta conectar ao broker MQTT em loop até ter sucesso."""
    while True:
        try:
            print(f"A tentar conectar ao broker MQTT em {MQTT_BROKER}:{MQTT_PORT}...")
            client.connect(MQTT_BROKER, MQTT_PORT, 60)
            print("Conectado com sucesso ao Broker MQTT!")
            break
        except Exception as e:
            print(f"Falha na conexão: {e}. A tentar novamente em 5 segundos...")
            time.sleep(5)

# Inicia a conexão e a thread de rede do MQTT
conectar_mqtt()
client.loop_start()

print(f"A iniciar a simulação de telemetria para o equipamento {EQUIPAMENTO_ID}...")

try:
    while True:
        # Gera dados numéricos simulados (didáticos)[cite: 2]
        temperatura = round(random.uniform(35.0, 65.0), 1)
        vibracao = round(random.uniform(1.0, 4.5), 1)
        
        # Gera o status operacional (maior probabilidade de estar "operando")
        status = random.choice(["operando", "operando", "operando", "alerta", "manutencao"])

        # Publica os valores nos respetivos tópicos do equipamento
        client.publish(f"industria/{EQUIPAMENTO_ID}/temperatura", temperatura)
        client.publish(f"industria/{EQUIPAMENTO_ID}/vibracao", vibracao)
        client.publish(f"industria/{EQUIPAMENTO_ID}/status", status)

        print(f"Publicado: Tópico industria/{EQUIPAMENTO_ID} | Temp: {temperatura}°C, Vibração: {vibracao}mm/s, Status: {status}")
        
        # Aguarda 5 segundos antes da próxima atualização
        time.sleep(5)

except KeyboardInterrupt:
    print("\nSimulador interrompido pelo utilizador.")
finally:
    client.loop_stop()
    client.disconnect()
    print("Desconectado do Broker MQTT.")