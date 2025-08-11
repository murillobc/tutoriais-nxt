# 📡 API Reference - Tutorial Status

## ✅ Endpoints Disponíveis - FUNCIONANDO

### 1. **Consultar Tutoriais Pendentes**
```
GET /api/tutorial-releases/pending
```

**Resposta:**
```json
{
  "count": 0,
  "pending_releases": []
}
```

### 2. **Consultar por Status Específico**
```
GET /api/tutorial-releases/status/{status}
```

**Parâmetros:** `status` = `pending`, `success`, `failed`

**Exemplo:**
```bash
curl -X GET "https://tutoriais.educanextest.com.br/api/tutorial-releases/status/success"
```

### 3. **Estatísticas Gerais**
```
GET /api/tutorial-releases/stats
```

**Resposta:**
```json
{
  "total": 1,
  "pending": 0,
  "success": 1,
  "failed": 0,
  "success_rate": 100
}
```

### 4. **Atualizar Status (Existente)**
```
POST /api/tutorial-releases/:id/status
```

**Body:**
```json
{
  "status": "success|pending|failed",
  "message": "Mensagem opcional"
}
```

## 🎯 Para Integração n8n

### **Verificar Pendentes (Polling)**
```javascript
// HTTP Request Node no n8n
URL: https://tutoriais.educanextest.com.br/api/tutorial-releases/pending
Method: GET
```

### **Workflow Automático n8n**
```json
{
  "name": "Check Pending Tutorials",
  "nodes": [
    {
      "name": "Cron Trigger",
      "type": "n8n-nodes-base.cron",
      "parameters": {
        "rule": {
          "interval": [5],
          "intervalSize": "minute"
        }
      }
    },
    {
      "name": "Get Pending",
      "type": "n8n-nodes-base.httpRequest",
      "parameters": {
        "url": "https://tutoriais.educanextest.com.br/api/tutorial-releases/pending",
        "method": "GET"
      }
    },
    {
      "name": "Check If Any Pending",
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
    }
  ]
}
```

## 📊 Casos de Uso

### **1. Monitoramento Automático**
```bash
# Verificar se existem pendentes
curl https://tutoriais.educanextest.com.br/api/tutorial-releases/pending

# Se count > 0, processar cada item
```

### **2. Dashboard/Relatórios**
```bash
# Obter estatísticas para dashboard
curl https://tutoriais.educanextest.com.br/api/tutorial-releases/stats
```

### **3. Filtros por Status**
```bash
# Ver todos com sucesso
curl https://tutoriais.educanextest.com.br/api/tutorial-releases/status/success

# Ver todos com falha
curl https://tutoriais.educanextest.com.br/api/tutorial-releases/status/failed
```

## 🔧 Exemplos Práticos

### **Script Bash para Monitoramento**
```bash
#!/bin/bash
PENDING=$(curl -s https://tutoriais.educanextest.com.br/api/tutorial-releases/pending | jq '.count')

if [ "$PENDING" -gt 0 ]; then
    echo "⚠️  Existem $PENDING tutoriais pendentes!"
    # Enviar notificação, processar, etc.
else
    echo "✅ Nenhum tutorial pendente"
fi
```

### **JavaScript/Node.js**
```javascript
async function checkPendingTutorials() {
    try {
        const response = await fetch('https://tutoriais.educanextest.com.br/api/tutorial-releases/pending');
        const data = await response.json();
        
        if (data.count > 0) {
            console.log(`⚠️ ${data.count} tutoriais pendentes encontrados:`);
            data.pending_releases.forEach(release => {
                console.log(`- ${release.client_name} (${release.client_company}) - ${release.id}`);
            });
            
            // Processar automaticamente
            for (const release of data.pending_releases) {
                await updateTutorialStatus(release.id, 'success', 'Processado automaticamente');
            }
        } else {
            console.log('✅ Nenhum tutorial pendente');
        }
    } catch (error) {
        console.error('Erro ao verificar tutoriais pendentes:', error);
    }
}

async function updateTutorialStatus(id, status, message) {
    const response = await fetch(`https://tutoriais.educanextest.com.br/api/tutorial-releases/${id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, message })
    });
    return response.json();
}

// Executar a cada 5 minutos
setInterval(checkPendingTutorials, 5 * 60 * 1000);
```

### **Python**
```python
import requests
import time

def check_pending_tutorials():
    try:
        response = requests.get('https://tutoriais.educanextest.com.br/api/tutorial-releases/pending')
        data = response.json()
        
        if data['count'] > 0:
            print(f"⚠️  {data['count']} tutoriais pendentes encontrados:")
            for release in data['pending_releases']:
                print(f"- {release['client_name']} ({release['client_company']}) - {release['id']}")
                
                # Processar automaticamente
                update_response = requests.post(
                    f"https://tutoriais.educanextest.com.br/api/tutorial-releases/{release['id']}/status",
                    json={
                        "status": "success",
                        "message": "Processado automaticamente via Python"
                    }
                )
                print(f"✅ Status atualizado: {update_response.json()}")
        else:
            print('✅ Nenhum tutorial pendente')
            
    except Exception as e:
        print(f'Erro ao verificar tutoriais pendentes: {e}')

# Loop de monitoramento
while True:
    check_pending_tutorials()
    time.sleep(300)  # 5 minutos
```

## 🚀 Implementação no Sistema Existente

### **Adicionar ao Dashboard Web**
```javascript
// No frontend React
useEffect(() => {
    const fetchStats = async () => {
        const response = await fetch('/api/tutorial-releases/stats');
        const stats = await response.json();
        setDashboardStats(stats);
    };
    
    fetchStats();
    const interval = setInterval(fetchStats, 30000); // Atualizar a cada 30s
    return () => clearInterval(interval);
}, []);
```

### **Webhook para Slack/Discord**
```javascript
// Notificar quando há pendentes
const pendingResponse = await fetch('/api/tutorial-releases/pending');
const pendingData = await pendingResponse.json();

if (pendingData.count > 0) {
    await fetch(SLACK_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            text: `⚠️ ${pendingData.count} tutoriais pendentes precisam de atenção!`
        })
    });
}
```

## 📋 Checklist de Integração

- [x] API de status funcionando
- [x] Endpoint para consultar pendentes
- [x] Endpoint para estatísticas
- [x] Filtros por status
- [ ] Integração com n8n configurada
- [ ] Monitoramento automático ativo
- [ ] Notificações configuradas
- [ ] Dashboard atualizado

---

**APIs de consulta implementadas e testadas com sucesso!**
Prontas para integração com n8n e outros sistemas.
Data: 11 de Agosto de 2025