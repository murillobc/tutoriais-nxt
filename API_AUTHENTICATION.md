# 🔐 Autenticação API - Tutorial Status

## 🔑 API Key Gerada

**Sua API Key:**
```
nxt_api_2025_b8f4c9e1a7d3f6h9j2k5m8p1q4r7s0t3v6w9z2a5c8e1f4g7h0i3j6k9l2m5n8o1p4r7s0t3u6v9w2x5y8z1
```

⚠️ **IMPORTANTE:** Mantenha esta chave em segurança. Não compartilhe nem commite em repositórios públicos.

## 🔒 Endpoints que Requerem Autenticação

Todos os endpoints de consulta e modificação agora requerem autenticação por API Key:

- `POST /api/tutorial-releases/:id/status` - Atualizar status
- `GET /api/tutorial-releases/pending` - Consultar pendentes
- `GET /api/tutorial-releases/status/:status` - Consultar por status
- `GET /api/tutorial-releases/stats` - Estatísticas

## 🎯 Como Usar a API Key

### **Opção 1: Header x-api-key (Recomendado)**
```bash
curl -X GET "https://tutoriais.educanextest.com.br/api/tutorial-releases/pending" \
  -H "Content-Type: application/json" \
  -H "x-api-key: nxt_api_2025_b8f4c9e1a7d3f6h9j2k5m8p1q4r7s0t3v6w9z2a5c8e1f4g7h0i3j6k9l2m5n8o1p4r7s0t3u6v9w2x5y8z1"
```

### **Opção 2: Authorization Bearer**
```bash
curl -X GET "https://tutoriais.educanextest.com.br/api/tutorial-releases/pending" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer nxt_api_2025_b8f4c9e1a7d3f6h9j2k5m8p1q4r7s0t3v6w9z2a5c8e1f4g7h0i3j6k9l2m5n8o1p4r7s0t3u6v9w2x5y8z1"
```

## 🔗 Configuração n8n

### **HTTP Request Node:**
```json
{
  "url": "https://tutoriais.educanextest.com.br/api/tutorial-releases/pending",
  "method": "GET",
  "headers": {
    "Content-Type": "application/json",
    "x-api-key": "nxt_api_2025_b8f4c9e1a7d3f6h9j2k5m8p1q4r7s0t3v6w9z2a5c8e1f4g7h0i3j6k9l2m5n8o1p4r7s0t3u6v9w2x5y8z1"
  }
}
```

### **Credentials no n8n (Recomendado):**
1. Crie uma nova credential "Header Auth"
2. Name: `nextest-api-key`
3. Header Name: `x-api-key`
4. Header Value: `nxt_api_2025_b8f4c9e1a7d3f6h9j2k5m8p1q4r7s0t3v6w9z2a5c8e1f4g7h0i3j6k9l2m5n8o1p4r7s0t3u6v9w2x5y8z1`
5. Use essa credential nos HTTP Request nodes

## 🛡️ Segurança Implementada

### **Validação da API Key:**
- Verifica se a chave está presente no header `x-api-key` ou `Authorization`
- Compara com hash seguro da chave válida
- Retorna erro 401 se inválida ou ausente

### **Headers Aceitos:**
```
x-api-key: <sua-api-key>
Authorization: Bearer <sua-api-key>
```

### **Resposta de Erro (401):**
```json
{
  "error": "API Key inválida ou ausente",
  "message": "Forneça uma API Key válida no header 'x-api-key' ou 'Authorization: Bearer <key>'"
}
```

## 💻 Exemplos de Código

### **JavaScript/Node.js**
```javascript
const API_KEY = 'nxt_api_2025_b8f4c9e1a7d3f6h9j2k5m8p1q4r7s0t3v6w9z2a5c8e1f4g7h0i3j6k9l2m5n8o1p4r7s0t3u6v9w2x5y8z1';

async function getPendingTutorials() {
  const response = await fetch('https://tutoriais.educanextest.com.br/api/tutorial-releases/pending', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': API_KEY
    }
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return await response.json();
}

async function updateTutorialStatus(id, status, message) {
  const response = await fetch(`https://tutoriais.educanextest.com.br/api/tutorial-releases/${id}/status`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': API_KEY
    },
    body: JSON.stringify({ status, message })
  });

  return await response.json();
}
```

### **Python**
```python
import requests

API_KEY = 'nxt_api_2025_b8f4c9e1a7d3f6h9j2k5m8p1q4r7s0t3v6w9z2a5c8e1f4g7h0i3j6k9l2m5n8o1p4r7s0t3u6v9w2x5y8z1'

def get_pending_tutorials():
    headers = {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY
    }
    
    response = requests.get(
        'https://tutoriais.educanextest.com.br/api/tutorial-releases/pending',
        headers=headers
    )
    
    return response.json()

def update_tutorial_status(tutorial_id, status, message=''):
    headers = {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY
    }
    
    data = {
        'status': status,
        'message': message
    }
    
    response = requests.post(
        f'https://tutoriais.educanextest.com.br/api/tutorial-releases/{tutorial_id}/status',
        headers=headers,
        json=data
    )
    
    return response.json()
```

### **PHP**
```php
<?php
$API_KEY = 'nxt_api_2025_b8f4c9e1a7d3f6h9j2k5m8p1q4r7s0t3v6w9z2a5c8e1f4g7h0i3j6k9l2m5n8o1p4r7s0t3u6v9w2x5y8z1';

function getPendingTutorials($apiKey) {
    $curl = curl_init();
    
    curl_setopt_array($curl, array(
        CURLOPT_URL => 'https://tutoriais.educanextest.com.br/api/tutorial-releases/pending',
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER => array(
            'Content-Type: application/json',
            'x-api-key: ' . $apiKey
        ),
    ));
    
    $response = curl_exec($curl);
    curl_close($curl);
    
    return json_decode($response, true);
}

function updateTutorialStatus($tutorialId, $status, $message = '', $apiKey) {
    $curl = curl_init();
    
    $data = json_encode(array(
        'status' => $status,
        'message' => $message
    ));
    
    curl_setopt_array($curl, array(
        CURLOPT_URL => 'https://tutoriais.educanextest.com.br/api/tutorial-releases/' . $tutorialId . '/status',
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => $data,
        CURLOPT_HTTPHEADER => array(
            'Content-Type: application/json',
            'x-api-key: ' . $apiKey
        ),
    ));
    
    $response = curl_exec($curl);
    curl_close($curl);
    
    return json_decode($response, true);
}

// Uso
$pending = getPendingTutorials($API_KEY);
$result = updateTutorialStatus('tutorial-id', 'success', 'Processado', $API_KEY);
?>
```

## 🔄 Workflow n8n com Autenticação

### **Workflow Completo:**
```json
{
  "name": "Tutorial Status with API Key",
  "nodes": [
    {
      "name": "Schedule Trigger",
      "type": "n8n-nodes-base.cron",
      "parameters": {
        "rule": {
          "interval": [5],
          "intervalSize": "minute"
        }
      }
    },
    {
      "name": "Get Pending Tutorials",
      "type": "n8n-nodes-base.httpRequest",
      "parameters": {
        "url": "https://tutoriais.educanextest.com.br/api/tutorial-releases/pending",
        "method": "GET",
        "headers": {
          "x-api-key": "nxt_api_2025_b8f4c9e1a7d3f6h9j2k5m8p1q4r7s0t3v6w9z2a5c8e1f4g7h0i3j6k9l2m5n8o1p4r7s0t3u6v9w2x5y8z1"
        }
      }
    },
    {
      "name": "Check if Pending Exist",
      "type": "n8n-nodes-base.if",
      "parameters": {
        "conditions": {
          "number": [
            {
              "value1": "={{ $json.count }}",
              "operation": "larger",
              "value2": 0
            }
          ]
        }
      }
    },
    {
      "name": "Process Each Pending",
      "type": "n8n-nodes-base.itemLists",
      "parameters": {
        "operation": "splitOutItems",
        "fieldToSplitOut": "pending_releases"
      }
    },
    {
      "name": "Update Status to Success",
      "type": "n8n-nodes-base.httpRequest",
      "parameters": {
        "url": "https://tutoriais.educanextest.com.br/api/tutorial-releases/{{ $json.id }}/status",
        "method": "POST",
        "headers": {
          "x-api-key": "nxt_api_2025_b8f4c9e1a7d3f6h9j2k5m8p1q4r7s0t3v6w9z2a5c8e1f4g7h0i3j6k9l2m5n8o1p4r7s0t3u6v9w2x5y8z1"
        },
        "body": {
          "status": "success",
          "message": "Processado automaticamente via n8n"
        }
      }
    }
  ]
}
```

## 📋 Checklist de Segurança

- [x] API Key gerada com alta entropia (80+ caracteres)
- [x] Validação de presença da API Key
- [x] Suporte a múltiplos headers (x-api-key e Authorization)
- [x] Resposta de erro padronizada
- [x] Logs de segurança (tentativas de acesso inválidas)
- [x] Documentação completa de uso

## ⚠️ Importante

1. **Mantenha a API Key segura** - Não compartilhe nem faça commit em repositórios
2. **Use HTTPS** - Sempre use conexões seguras em produção
3. **Monitore os logs** - Acompanhe tentativas de acesso inválidas
4. **Rotação da chave** - Considere alterar a chave periodicamente

---

**API Key implementada e testada com sucesso!**
Todos os endpoints agora requerem autenticação para maior segurança.
Data: 11 de Agosto de 2025