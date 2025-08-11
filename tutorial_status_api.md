# API para Atualização de Status de Tutoriais

## Endpoint
```
POST /api/tutorial-releases/:id/status
```

## Parâmetros
- `:id` - ID do tutorial release que você quer atualizar

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
curl -X POST "http://localhost:5000/api/tutorial-releases/SEU_ID_AQUI/status" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "success",
    "message": "Tutorial liberado automaticamente pelo sistema"
  }'
```

### 2. Com JavaScript/Fetch
```javascript
async function liberarTutorial(tutorialReleaseId) {
  try {
    const response = await fetch(`http://localhost:5000/api/tutorial-releases/${tutorialReleaseId}/status`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        status: 'success',
        message: 'Tutorial liberado pelo sistema externo'
      })
    });

    const result = await response.json();
    console.log('Status atualizado:', result);
    return result;
  } catch (error) {
    console.error('Erro ao atualizar status:', error);
  }
}

// Exemplo de uso
liberarTutorial('24727cd9-5d90-4adc-9314-a653...');
```

### 3. Com Python
```python
import requests
import json

def liberar_tutorial(tutorial_release_id):
    url = f"http://localhost:5000/api/tutorial-releases/{tutorial_release_id}/status"
    
    data = {
        "status": "success",
        "message": "Tutorial liberado pelo sistema Python"
    }
    
    response = requests.post(
        url,
        headers={"Content-Type": "application/json"},
        data=json.dumps(data)
    )
    
    if response.ok:
        print("Status atualizado com sucesso:", response.json())
    else:
        print("Erro:", response.status_code, response.text)

# Exemplo de uso
liberar_tutorial("24727cd9-5d90-4adc-9314-a653...")
```

### 4. Com PHP
```php
<?php
function liberarTutorial($tutorialReleaseId) {
    $url = "http://localhost:5000/api/tutorial-releases/$tutorialReleaseId/status";
    
    $data = [
        'status' => 'success',
        'message' => 'Tutorial liberado pelo sistema PHP'
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
        echo "Status atualizado: " . $result;
    } else {
        echo "Erro ao atualizar status";
    }
}

// Exemplo de uso
liberarTutorial("24727cd9-5d90-4adc-9314-a653...");
?>
```

## Resposta da API

### Sucesso (200)
```json
{
  "message": "Status atualizado com sucesso",
  "releaseId": "24727cd9-5d90-4adc-9314-a653...",
  "status": "success"
}
```

### Erro (400)
```json
{
  "message": "Status inválido. Use: pending, success, failed"
}
```

## Como Obter o ID do Tutorial Release

O ID do tutorial release é retornado quando você cria uma nova liberação através do endpoint:
```
POST /api/tutorial-releases
```

Ou você pode listar todas as liberações para encontrar o ID:
```
GET /api/tutorial-releases
```

## URL de Produção

Quando você colocar o sistema em produção, substitua:
- `http://localhost:5000` pela URL real do seu servidor
- Por exemplo: `https://seu-dominio.com`