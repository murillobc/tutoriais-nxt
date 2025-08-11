# 🔗 Tutorial Status API - Guia de Integração

## ⚠️ **PROBLEMA RESOLVIDO - HTML vs JSON**

Se você estava recebendo HTML em vez de JSON, o problema foi identificado:

### ✅ **URL CORRETA (Use esta):**

```
https://tutoriais.educanextest.com.br/api/tutorial-releases/pending
```

**Em desenvolvimento:**
```
http://localhost:5000/api/tutorial-releases/pending
```

### ❌ **URLs Incorretas (que retornam HTML):**
```
/tutorials-release/pending    ❌ (singular/plural incorreto)
/api/tutorials-release/...    ❌ (singular/plural incorreto)
```

## 🔑 **Sua API Key (Obrigatória)**
```
nxt_api_2025_b8f4c9e1a7d3f6h9j2k5m8p1q4r7s0t3v6w9z2a5c8e1f4g7h0i3j6k9l2m5n8o1p4r7s0t3u6v9w2x5y8z1
```

## 🎯 **Teste Rápido - cURL**

### **Endpoint Principal:**
```bash
curl -X GET "https://tutoriais.educanextest.com.br/api/tutorial-releases/pending" \
  -H "x-api-key: nxt_api_2025_b8f4c9e1a7d3f6h9j2k5m8p1q4r7s0t3v6w9z2a5c8e1f4g7h0i3j6k9l2m5n8o1p4r7s0t3u6v9w2x5y8z1" \
  -H "Accept: application/json"
```

### **Endpoint Alternativo:**
```bash
curl -X GET "https://tutoriais.educanextest.com.br/tutorial-releases/pending" \
  -H "x-api-key: nxt_api_2025_b8f4c9e1a7d3f6h9j2k5m8p1q4r7s0t3v6w9z2a5c8e1f4g7h0i3j6k9l2m5n8o1p4r7s0t3u6v9w2x5y8z1" \
  -H "Accept: application/json"
```

## 📱 **Integração n8n - Configuração Completa**

### **HTTP Request Node:**
```json
{
  "name": "Get Pending Tutorials",
  "type": "n8n-nodes-base.httpRequest",
  "parameters": {
    "url": "https://tutoriais.educanextest.com.br/api/tutorial-releases/pending",
    "method": "GET",
    "headers": {
      "x-api-key": "nxt_api_2025_b8f4c9e1a7d3f6h9j2k5m8p1q4r7s0t3v6w9z2a5c8e1f4g7h0i3j6k9l2m5n8o1p4r7s0t3u6v9w2x5y8z1",
      "Accept": "application/json",
      "Content-Type": "application/json"
    }
  }
}
```

### **Resposta Esperada (JSON):**
```json
{
  "count": 2,
  "pending_releases": [
    {
      "id": "24727cd9-5d90-4adc-9314-a65350eac886",
      "client_name": "João Silva",
      "client_email": "joao@empresa.com",
      "client_company": "IT Solutions",
      "created_at": "2025-08-07T20:52:13.053Z",
      "status": "pending"
    }
  ]
}
```

## 🔄 **Workflow n8n Completo**

```json
{
  "name": "Tutorial Status Monitor",
  "nodes": [
    {
      "name": "Schedule",
      "type": "n8n-nodes-base.cron",
      "parameters": {
        "rule": {
          "interval": [5],
          "intervalSize": "minute"
        }
      }
    },
    {
      "name": "Check Pending",
      "type": "n8n-nodes-base.httpRequest",
      "parameters": {
        "url": "https://tutoriais.educanextest.com.br/api/tutorial-releases/pending",
        "method": "GET",
        "headers": {
          "x-api-key": "nxt_api_2025_b8f4c9e1a7d3f6h9j2k5m8p1q4r7s0t3v6w9z2a5c8e1f4g7h0i3j6k9l2m5n8o1p4r7s0t3u6v9w2x5y8z1",
          "Accept": "application/json"
        }
      }
    },
    {
      "name": "Has Pending?",
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
      "name": "Split Array",
      "type": "n8n-nodes-base.itemLists",
      "parameters": {
        "operation": "splitOutItems",
        "fieldToSplitOut": "pending_releases"
      }
    },
    {
      "name": "Process Tutorial",
      "type": "n8n-nodes-base.httpRequest",
      "parameters": {
        "url": "https://tutoriais.educanextest.com.br/api/tutorial-releases/{{ $json.id }}/status",
        "method": "POST",
        "headers": {
          "x-api-key": "nxt_api_2025_b8f4c9e1a7d3f6h9j2k5m8p1q4r7s0t3v6w9z2a5c8e1f4g7h0i3j6k9l2m5n8o1p4r7s0t3u6v9w2x5y8z1",
          "Content-Type": "application/json"
        },
        "body": {
          "status": "success",
          "message": "Processado automaticamente via n8n"
        }
      }
    },
    {
      "name": "Send Notification",
      "type": "n8n-nodes-base.slack",
      "parameters": {
        "text": "✅ Tutorial {{ $json.client_name }} processado com sucesso!"
      }
    }
  ]
}
```

## 💻 **Código JavaScript/Node.js**

```javascript
const API_KEY = 'nxt_api_2025_b8f4c9e1a7d3f6h9j2k5m8p1q4r7s0t3v6w9z2a5c8e1f4g7h0i3j6k9l2m5n8o1p4r7s0t3u6v9w2x5y8z1';
const BASE_URL = 'https://tutoriais.educanextest.com.br/api';

async function checkPendingTutorials() {
  try {
    const response = await fetch(`${BASE_URL}/tutorial-releases/pending`, {
      method: 'GET',
      headers: {
        'x-api-key': API_KEY,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log(`📊 Tutoriais pendentes: ${data.count}`);

    return data;
  } catch (error) {
    console.error('❌ Erro ao buscar tutoriais pendentes:', error);
    throw error;
  }
}

async function updateTutorialStatus(tutorialId, status, message) {
  try {
    const response = await fetch(`${BASE_URL}/tutorial-releases/${tutorialId}/status`, {
      method: 'POST',
      headers: {
        'x-api-key': API_KEY,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        status: status,
        message: message
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    console.log(`✅ Status atualizado para: ${status}`);

    return result;
  } catch (error) {
    console.error('❌ Erro ao atualizar status:', error);
    throw error;
  }
}

// Exemplo de uso
async function processAllPending() {
  try {
    const pendingData = await checkPendingTutorials();
    
    for (const tutorial of pendingData.pending_releases) {
      console.log(`🔄 Processando: ${tutorial.client_name}`);
      
      await updateTutorialStatus(
        tutorial.id,
        'success',
        'Processado automaticamente via integração'
      );
      
      console.log(`✅ ${tutorial.client_name} processado com sucesso`);
    }
  } catch (error) {
    console.error('❌ Erro no processamento:', error);
  }
}

// Executar a cada 5 minutos
setInterval(processAllPending, 5 * 60 * 1000);
```

## 🐍 **Código Python**

```python
import requests
import json
import time

API_KEY = 'nxt_api_2025_b8f4c9e1a7d3f6h9j2k5m8p1q4r7s0t3v6w9z2a5c8e1f4g7h0i3j6k9l2m5n8o1p4r7s0t3u6v9w2x5y8z1'
BASE_URL = 'https://tutoriais.educanextest.com.br/api'

def get_headers():
    return {
        'x-api-key': API_KEY,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
    }

def check_pending_tutorials():
    try:
        response = requests.get(
            f'{BASE_URL}/tutorial-releases/pending',
            headers=get_headers()
        )
        
        response.raise_for_status()
        data = response.json()
        
        print(f"📊 Tutoriais pendentes: {data['count']}")
        return data
        
    except requests.exceptions.RequestException as e:
        print(f"❌ Erro ao buscar tutoriais pendentes: {e}")
        raise

def update_tutorial_status(tutorial_id, status, message):
    try:
        response = requests.post(
            f'{BASE_URL}/tutorial-releases/{tutorial_id}/status',
            headers=get_headers(),
            json={
                'status': status,
                'message': message
            }
        )
        
        response.raise_for_status()
        result = response.json()
        
        print(f"✅ Status atualizado para: {status}")
        return result
        
    except requests.exceptions.RequestException as e:
        print(f"❌ Erro ao atualizar status: {e}")
        raise

def process_all_pending():
    try:
        pending_data = check_pending_tutorials()
        
        for tutorial in pending_data['pending_releases']:
            print(f"🔄 Processando: {tutorial['client_name']}")
            
            update_tutorial_status(
                tutorial['id'],
                'success',
                'Processado automaticamente via Python'
            )
            
            print(f"✅ {tutorial['client_name']} processado com sucesso")
            
    except Exception as e:
        print(f"❌ Erro no processamento: {e}")

# Loop de monitoramento
if __name__ == "__main__":
    while True:
        process_all_pending()
        time.sleep(300)  # 5 minutos
```

## 🧪 **Troubleshooting**

### **Problema: Recebendo HTML em vez de JSON**
✅ **Solução:** Use as URLs corretas:
- `/api/tutorial-releases/pending` ✅
- `/tutorial-releases/pending` ✅

❌ **NÃO use:**
- `/tutorials-release/pending` (singular/plural incorreto)
- URLs sem API key

### **Problema: Erro 401 - Não autorizado**
✅ **Solução:** Inclua a API key no header:
```
x-api-key: nxt_api_2025_b8f4c9e1a7d3f6h9j2k5m8p1q4r7s0t3v6w9z2a5c8e1f4g7h0i3j6k9l2m5n8o1p4r7s0t3u6v9w2x5y8z1
```

### **Problema: Timeout ou erro de conexão**
✅ **Verificações:**
1. URL correta com https:// em produção
2. API key incluída no header
3. Content-Type: application/json

## 📋 **Checklist de Integração**

- [x] ✅ API Key configurada
- [x] ✅ URLs corretas documentadas  
- [x] ✅ Content-Type forçado para JSON
- [x] ✅ Headers Accept configurados
- [x] ✅ Endpoints alternativos criados
- [x] ✅ Exemplos n8n documentados
- [x] ✅ Código JavaScript/Python prontos
- [x] ✅ Troubleshooting documentado

---

**🎯 API Status está 100% funcional e pronta para integração!**

**URLs funcionando:**
- `https://tutoriais.educanextest.com.br/api/tutorial-releases/pending`
- `https://tutoriais.educanextest.com.br/tutorial-releases/pending`

Teste com sua ferramenta usando uma dessas URLs com a API key fornecida.