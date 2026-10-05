# Utiliza uma imagem leve do Python
FROM python:3.9-slim

WORKDIR /app

# Copia e instala as dependências
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copia o script do simulador
COPY simulator.py .

# Comando para iniciar o simulador
CMD ["python", "-u", "simulator.py"] 
# A flag -u garante que os prints aparecem imediatamente nos logs do Docker