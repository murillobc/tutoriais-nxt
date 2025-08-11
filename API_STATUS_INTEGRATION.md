# 🔗 Integração API de Status com n8n

## 📡 Endpoint da API de Status

### URL Base
```
https://tutoriais.educanextest.com.br/api/tutorial-releases/:id/status
```

### Método
```
POST
```

### Headers Obrigatórios
```json
{
  "Content-Type": "application/json"
}
```

### Body da Requisição
```json
{
  "status": "success|failed|pending",
  "message": "Mensagem opcional para log"
}
```

## 🎯 Valores de Status Aceitos

- `pending` - Tutorial aguardando liberação
- `success` - Tutorial liberado com sucesso
- `failed` - Falha na liberação do tutorial

## 🔧 Integração com n8n

### 1. Configuração do Webhook no n8n

```json
{
  "nodes": [
    {
      "name": "Webhook Trigger",
      "type": "n8n-nodes-base.webhook",
      "parameters": {
        "httpMethod": "POST",
        "path": "tutorial-status-update",
        "responseMode": "responseNode"
      }
    },
    {
      "name": "Update Tutorial Status",
      "type": "n8n-nodes-base.httpRequest",
      "parameters": {
        "url": "https://tutoriais.educanextest.com.br/api/tutorial-releases/{{ $json.tutorialId }}/status",
        "method": "POST",
        "headers": {
          "Content-Type": "application/json"
        },
        "body": {
          "status": "{{ $json.status }}",
          "message": "Atualizado via n8n: {{ $json.message || 'Status atualizado automaticamente' }}"
        }
      }
    }
  ]
}
```

### 2. Exemplo de Payload para n8n
```json
{
  "tutorialId": "123e4567-e89b-12d3-a456-426614174000",
  "status": "success",
  "message": "Tutorial liberado automaticamente pelo sistema"
}
```

### 3. Workflow n8n Completo

#### Nó 1: Webhook Trigger
- **URL**: `https://seu-n8n.com/webhook/tutorial-status-update`
- **Método**: POST
- **Autenticação**: Configurar se necessário

#### Nó 2: Processar Dados
```javascript
// Code Node - Processar dados recebidos
const tutorialId = $input.item.json.tutorialId;
const status = $input.item.json.status || 'success';
const message = $input.item.json.message || 'Processado via n8n';

return {
  tutorialId,
  status,
  message,
  timestamp: new Date().toISOString()
};
```

#### Nó 3: HTTP Request - Atualizar Status
- **URL**: `https://tutoriais.educanextest.com.br/api/tutorial-releases/{{ $json.tutorialId }}/status`
- **Método**: POST
- **Headers**: 
  ```json
  {
    "Content-Type": "application/json"
  }
  ```
- **Body**:
  ```json
  {
    "status": "{{ $json.status }}",
    "message": "{{ $json.message }}"
  }
  ```

#### Nó 4: Response (Opcional)
```json
{
  "success": true,
  "tutorialId": "{{ $json.tutorialId }}",
  "statusUpdated": "{{ $json.status }}",
  "timestamp": "{{ $json.timestamp }}"
}
```

## 🧪 Como Testar a API

### 1. Teste Manual com cURL
```bash
# Obter lista de releases para pegar um ID
curl -X GET "https://tutoriais.educanextest.com.br/api/tutorial-releases"

# Atualizar status (substitua ID_REAL)
curl -X POST "https://tutoriais.educanextest.com.br/api/tutorial-releases/ID_REAL/status" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "success",
    "message": "Teste via cURL"
  }'
```

### 2. Teste com JavaScript/Fetch
```javascript
async function updateTutorialStatus(tutorialId, status, message) {
  try {
    const response = await fetch(`https://tutoriais.educanextest.com.br/api/tutorial-releases/${tutorialId}/status`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        status: status,
        message: message || 'Atualizado programaticamente'
      })
    });

    const result = await response.json();
    console.log('Status atualizado:', result);
    return result;
  } catch (error) {
    console.error('Erro ao atualizar status:', error);
    throw error;
  }
}

// Exemplo de uso
updateTutorialStatus('seu-tutorial-id', 'success', 'Liberado automaticamente');
```

### 3. Teste no Postman
```json
{
  "method": "POST",
  "url": "https://tutoriais.educanextest.com.br/api/tutorial-releases/{{tutorialId}}/status",
  "headers": {
    "Content-Type": "application/json"
  },
  "body": {
    "raw": {
      "status": "success",
      "message": "Teste via Postman"
    }
  }
}
```

## 🔍 Verificar Status da API

### 1. Health Check da API
```bash
curl -X GET "https://tutoriais.educanextest.com.br/api/tutorials"
```

### 2. Verificar Logs do Servidor
```bash
# Na VPS com Docker
docker logs $(docker ps -q --filter name=nextest)

# Ou ver logs em tempo real
docker logs -f $(docker ps -q --filter name=nextest)
```

### 3. Verificar Tutorial Releases
```bash
curl -X GET "https://tutoriais.educanextest.com.br/api/tutorial-releases"
```

## 🚨 Tratamento de Erros

### Respostas da API

#### Sucesso (200)
```json
{
  "success": true,
  "message": "Status atualizado com sucesso",
  "tutorialRelease": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "status": "success",
    "updatedAt": "2025-08-11T15:30:00Z"
  }
}
```

#### Erro 404 - Tutorial não encontrado
```json
{
  "error": "Tutorial release não encontrado"
}
```

#### Erro 400 - Status inválido
```json
{
  "error": "Status deve ser: pending, success ou failed"
}
```

### Tratamento no n8n
```javascript
// Nó de tratamento de erro
if ($input.item.json.error) {
  console.error('Erro na API:', $input.item.json.error);
  
  // Enviar notificação de erro
  return {
    error: true,
    message: $input.item.json.error,
    tutorialId: $input.item.json.tutorialId
  };
}

return $input.item.json;
```

## 📊 Monitoramento

### 1. Logs da Aplicação
Os logs mostrarão:
- Requisições recebidas na API de status
- IDs dos tutorials atualizados
- Status alterados (pending → success/failed)
- Erros de validação

### 2. Webhook de Notificação (Opcional)
A API pode enviar notificações para um webhook configurado:
```json
{
  "tutorialId": "123e4567-e89b-12d3-a456-426614174000",
  "oldStatus": "pending",
  "newStatus": "success",
  "updatedBy": "n8n-automation",
  "timestamp": "2025-08-11T15:30:00Z"
}
```

## 🎯 Casos de Uso Comuns

### 1. Sistema de Pagamento
```javascript
// Após confirmação de pagamento
updateTutorialStatus(tutorialId, 'success', 'Pagamento confirmado');
```

### 2. Falha no Processamento
```javascript
// Após falha em algum processo
updateTutorialStatus(tutorialId, 'failed', 'Erro no processamento do pagamento');
```

### 3. Cancelamento
```javascript
// Retornar para pending
updateTutorialStatus(tutorialId, 'pending', 'Cancelamento solicitado pelo cliente');
```

---

## 📋 Checklist de Integração

- [ ] API de status funcionando na VPS
- [ ] n8n configurado para receber webhooks
- [ ] Workflow n8n criado para atualizar status
- [ ] Testes realizados com IDs reais
- [ ] Tratamento de erros implementado
- [ ] Logs de monitoramento configurados
- [ ] Documentação da integração compartilhada

---

**Pronto para integração com n8n!**
Data: 11 de Agosto de 2025