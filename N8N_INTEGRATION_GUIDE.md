# 🔗 Guia de Integração n8n - API Status Tutorial

## ✅ Status da API - FUNCIONANDO

**Endpoint Testado:** `POST /api/tutorial-releases/:id/status`
**Resultado:** ✅ API operacional e atualizando banco de dados corretamente

```bash
# Teste realizado com sucesso:
curl -X POST "http://localhost:5000/api/tutorial-releases/24727cd9-5d90-4adc-9314-a65350eac886/status" \
  -H "Content-Type: application/json" \
  -d '{"status": "success", "message": "Teste da API via cURL - integração n8n"}'

# Resposta:
{"message":"Status atualizado com sucesso","releaseId":"24727cd9-5d90-4adc-9314-a65350eac886","status":"success"}
```

## 🎯 Configuração n8n - Passo a Passo

### 1. **Webhook Trigger (Entrada)**
```json
{
  "name": "Webhook - Receber Status",
  "type": "n8n-nodes-base.webhook",
  "parameters": {
    "httpMethod": "POST",
    "path": "tutorial-status-update",
    "responseMode": "responseNode"
  }
}
```

**URL do seu webhook:** `https://seu-n8n.com/webhook/tutorial-status-update`

### 2. **HTTP Request (Saída para API)**
```json
{
  "name": "Atualizar Status Tutorial",
  "type": "n8n-nodes-base.httpRequest",
  "parameters": {
    "url": "https://tutoriais.educanextest.com.br/api/tutorial-releases/{{ $json.tutorialId }}/status",
    "method": "POST",
    "headers": {
      "Content-Type": "application/json"
    },
    "body": {
      "status": "{{ $json.status }}",
      "message": "{{ $json.message || 'Atualizado automaticamente via n8n' }}"
    }
  }
}
```

### 3. **Code Node (Processamento)**
```javascript
// Processar dados recebidos no webhook
const inputData = $input.item.json;

// Validar dados obrigatórios
if (!inputData.tutorialId) {
  throw new Error('tutorialId é obrigatório');
}

if (!inputData.status || !['pending', 'success', 'failed'].includes(inputData.status)) {
  throw new Error('status deve ser: pending, success ou failed');
}

// Preparar dados para API
return {
  tutorialId: inputData.tutorialId,
  status: inputData.status,
  message: inputData.message || `Atualizado via n8n em ${new Date().toISOString()}`,
  originalData: inputData
};
```

## 📡 Payloads de Exemplo

### Para receber no seu webhook n8n:
```json
{
  "tutorialId": "24727cd9-5d90-4adc-9314-a65350eac886",
  "status": "success",
  "message": "Pagamento confirmado - liberar tutorial",
  "clientData": {
    "name": "João da Silva",
    "email": "joao@exemplo.com"
  }
}
```

### Que será enviado para a API Nextest:
```json
{
  "status": "success",
  "message": "Pagamento confirmado - liberar tutorial"
}
```

## 🔄 Fluxos Comuns de Integração

### 1. **Fluxo de Pagamento Aprovado**
```
Webhook Pagamento → n8n → API Status (success)
```

### 2. **Fluxo de Pagamento Rejeitado**
```
Webhook Pagamento → n8n → API Status (failed)
```

### 3. **Fluxo de Cancelamento**
```
Webhook Cancelamento → n8n → API Status (pending)
```

## 🧪 URLs para Teste

### Desenvolvimento:
- **API Base:** `http://localhost:5000`
- **Teste Interface:** `http://localhost:5000/test_status_update.html`

### Produção:
- **API Base:** `https://tutoriais.educanextest.com.br`
- **Teste Interface:** `https://tutoriais.educanextest.com.br/test_status_update.html`

## 📋 Workflow n8n Completo (JSON)

```json
{
  "name": "Tutorial Status Update",
  "nodes": [
    {
      "parameters": {
        "httpMethod": "POST",
        "path": "tutorial-status-update",
        "responseMode": "responseNode"
      },
      "name": "Webhook",
      "type": "n8n-nodes-base.webhook",
      "typeVersion": 1,
      "position": [240, 300]
    },
    {
      "parameters": {
        "jsCode": "const inputData = $input.item.json;\n\nif (!inputData.tutorialId) {\n  throw new Error('tutorialId é obrigatório');\n}\n\nif (!inputData.status || !['pending', 'success', 'failed'].includes(inputData.status)) {\n  throw new Error('status deve ser: pending, success ou failed');\n}\n\nreturn {\n  tutorialId: inputData.tutorialId,\n  status: inputData.status,\n  message: inputData.message || `Atualizado via n8n em ${new Date().toISOString()}`,\n  originalData: inputData\n};"
      },
      "name": "Processar Dados",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [460, 300]
    },
    {
      "parameters": {
        "url": "https://tutoriais.educanextest.com.br/api/tutorial-releases/{{ $json.tutorialId }}/status",
        "method": "POST",
        "headers": {
          "Content-Type": "application/json"
        },
        "body": {
          "status": "{{ $json.status }}",
          "message": "{{ $json.message }}"
        }
      },
      "name": "Atualizar Status",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4,
      "position": [680, 300]
    },
    {
      "parameters": {
        "respondWith": "json",
        "responseBody": {
          "success": true,
          "tutorialId": "{{ $json.tutorialId }}",
          "statusUpdated": "{{ $json.status }}",
          "timestamp": "{{ new Date().toISOString() }}"
        }
      },
      "name": "Responder Webhook",
      "type": "n8n-nodes-base.respondToWebhook",
      "typeVersion": 1,
      "position": [900, 300]
    }
  ],
  "connections": {
    "Webhook": {
      "main": [
        [
          {
            "node": "Processar Dados",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Processar Dados": {
      "main": [
        [
          {
            "node": "Atualizar Status",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Atualizar Status": {
      "main": [
        [
          {
            "node": "Responder Webhook",
            "type": "main",
            "index": 0
          }
        ]
      ]
    }
  }
}
```

## ⚠️ Tratamento de Erros

### No n8n, adicione um nó de erro:
```javascript
// Error Handler Node
if ($input.item.error) {
  console.error('Erro na atualização:', $input.item.error);
  
  // Opcional: notificar via Slack/Discord/Email
  return {
    error: true,
    message: $input.item.error,
    tutorialId: $input.item.json.tutorialId,
    timestamp: new Date().toISOString()
  };
}

return $input.item.json;
```

## 🎯 Casos de Uso Práticos

### 1. **E-commerce/Pagamento**
```json
{
  "tutorialId": "abc123",
  "status": "success",
  "message": "Pagamento PIX confirmado R$ 150,00"
}
```

### 2. **Sistema de Aprovação**
```json
{
  "tutorialId": "def456",
  "status": "failed",
  "message": "Documentação incompleta - aguardando correção"
}
```

### 3. **Processamento em Lote**
```json
{
  "tutorials": [
    {"tutorialId": "abc123", "status": "success"},
    {"tutorialId": "def456", "status": "pending"}
  ]
}
```

## 📊 Monitoramento

### Logs da API (VPS):
```bash
docker logs -f nextest-app
```

### Verificar atualizações no banco:
```sql
SELECT id, client_name, status, created_at 
FROM tutorial_releases 
WHERE id = 'seu-tutorial-id';
```

## 🚀 Próximos Passos

1. **Configure seu webhook n8n** com o JSON fornecido
2. **Teste com o ID real:** `24727cd9-5d90-4adc-9314-a65350eac886`
3. **Use a interface de teste:** `/test_status_update.html`
4. **Monitore os logs** para confirmar funcionamento
5. **Integre com seu sistema** de pagamento/aprovação

---

**API Status funcionando perfeitamente para integração n8n!**
Testado em: 11 de Agosto de 2025