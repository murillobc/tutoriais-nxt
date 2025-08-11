
# API para Atualização de Status de Tutoriais

## Endpoint
```
POST /api/tutorial-releases/:id/status
```

## Parâmetros
- `:id` - **ID da liberação/requisição** (não do tutorial individual) que você quer atualizar

## Importante
⚠️ **O ID usado é da LIBERAÇÃO/REQUISIÇÃO, não do tutorial individual**
- Uma liberação pode conter múltiplos tutoriais
- Ao atualizar o status, você afeta toda a liberação com todos os tutoriais inclusos
- O ID da liberação é retornado quando você cria uma nova liberação via POST /api/tutorial-releases

## Corpo da Requisição (JSON)
```json
{
  "status": "success",
  "message": "Tutorial liberado com sucesso pelo sistema" (opcional)
}
```

## Status Válidos
- `"pending"` - Pendente
- `"success"` - Liberado/Sucesso (use este para marcar como liberado)
- `"failed"` - Falha

## Exemplos de Uso

### 1. Com cURL
```bash
curl -X POST "http://localhost:5000/api/tutorial-releases/24727cd9-5d90-4adc-9314-a653b8f41234/status" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "success",
    "message": "Liberação de tutoriais processada com sucesso"
  }'
```

### 2. Com JavaScript/Fetch
```javascript
async function liberarTutorialRelease(releaseId) {
  try {
    const response = await fetch(`http://localhost:5000/api/tutorial-releases/${releaseId}/status`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        status: 'success',
        message: 'Liberação processada pelo sistema externo'
      })
    });

    const result = await response.json();
    console.log('Status da liberação atualizado:', result);
    return result;
  } catch (error) {
    console.error('Erro ao atualizar status da liberação:', error);
  }
}

// Exemplo de uso
liberarTutorialRelease('24727cd9-5d90-4adc-9314-a653b8f41234');
```

### 3. Com Python
```python
import requests
import json

def liberar_tutorial_release(release_id):
    url = f"http://localhost:5000/api/tutorial-releases/{release_id}/status"
    
    data = {
        "status": "success",
        "message": "Liberação de tutoriais processada pelo sistema Python"
    }
    
    response = requests.post(
        url,
        headers={"Content-Type": "application/json"},
        data=json.dumps(data)
    )
    
    if response.ok:
        print("Status da liberação atualizado:", response.json())
    else:
        print("Erro:", response.status_code, response.text)

# Exemplo de uso
liberar_tutorial_release("24727cd9-5d90-4adc-9314-a653b8f41234")
```

### 4. Com PHP
```php
<?php
function liberarTutorialRelease($releaseId) {
    $url = "http://localhost:5000/api/tutorial-releases/$releaseId/status";
    
    $data = [
        'status' => 'success',
        'message' => 'Liberação de tutoriais processada pelo sistema PHP'
    ];
    
    $options = [
        'http' => [
            'header' => "Content-Type: application/json\r\n",
            'method' => 'POST',
            'content' => json_encode($data)
        ]
    ];
    
    $context = stream_context_create($options);
    $result = file_get_contents($url, false, $context);
    
    if ($result !== FALSE) {
        echo "Status da liberação atualizado: " . $result;
    } else {
        echo "Erro ao atualizar status da liberação";
    }
}

// Exemplo de uso
liberarTutorialRelease("24727cd9-5d90-4adc-9314-a653b8f41234");
?>
```

## Respostas da API

### Sucesso (200)
```json
{
  "message": "Status atualizado com sucesso",
  "releaseId": "24727cd9-5d90-4adc-9314-a653b8f41234",
  "status": "success"
}
```

### Erro (400)
```json
{
  "message": "Status inválido. Use: pending, success, failed"
}
```

### Erro (404)
```json
{
  "message": "Liberação não encontrada"
}
```

## Como Obter o ID da Liberação

### 1. Ao criar uma liberação
O ID é retornado quando você cria uma nova liberação:
```bash
curl -X POST "http://localhost:5000/api/tutorial-releases" \
  -H "Content-Type: application/json" \
  -d '{
    "clientName": "João Silva",
    "clientCpf": "123.456.789-00",
    "clientEmail": "joao@empresa.com",
    "companyName": "Empresa XYZ",
    "companyDocument": "12.345.678/0001-90",
    "companyRole": "Desenvolvedor",
    "tutorialIds": ["tutorial1-id", "tutorial2-id"]
  }'
```

**Resposta:**
```json
{
  "id": "24727cd9-5d90-4adc-9314-a653b8f41234",
  "clientName": "João Silva",
  "tutorialIds": ["tutorial1-id", "tutorial2-id"],
  "status": "pending",
  "createdAt": "2025-01-15T10:30:00Z"
}
```

### 2. Listando todas as liberações
```bash
curl -X GET "http://localhost:5000/api/tutorial-releases"
```

## APIs Auxiliares

**Criar nova liberação:**
```
POST /api/tutorial-releases
```

**Listar todas as liberações:**
```
GET /api/tutorial-releases
```

**Obter todos os tutoriais disponíveis:**
```
GET /api/tutorials
```

## Fluxo Completo

1. **Criar liberação** → Recebe ID da liberação
2. **Sistema externo processa** → Trabalha com múltiplos tutoriais
3. **Atualizar status** → Usa ID da liberação para marcar sucesso/falha
4. **Dashboard atualizado** → Mostra status da liberação completa

## URL de Produção

Quando colocar em produção, substitua `http://localhost:5000` pela URL real do seu servidor.

## Arquivo de Teste

Use o arquivo `test_status_update.html` na raiz do projeto para testar a API diretamente no browser.
