# 🚀 Guia de Configuração - Projeto Golffox com Firebase

Este guia irá te ajudar a configurar completamente o projeto Golffox com Firebase.

## 📋 Pré-requisitos

- Node.js 18+ instalado
- Conta no Firebase (plano Spark, gratuito)
- Editor de código (VS Code recomendado)

## 🎯 Configuração Rápida

### 1. Configurar o Projeto Firebase

1.  Acesse o [Console do Firebase](https://console.firebase.google.com/).
2.  Crie um novo projeto (ou use um existente).
3.  Adicione um aplicativo da Web ao seu projeto.
4.  Copie o objeto de configuração do Firebase. Ele será usado no próximo passo.

### 2. Configurar Variáveis de Ambiente

1.  Crie um arquivo `.env.local` na raiz do projeto.
2.  Adicione as seguintes variáveis de ambiente, substituindo os valores pelos do seu projeto Firebase:

    ```
    NEXT_PUBLIC_FIREBASE_API_KEY="Your API Key"
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="Your Auth Domain"
    NEXT_PUBLIC_FIREBASE_PROJECT_ID="Your Project ID"
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="Your Storage Bucket"
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="Your Messaging Sender ID"
    NEXT_PUBLIC_FIREBASE_APP_ID="Your App ID"
    ```

### 3. Instalar Dependências

```bash
npm install
```

### 4. Iniciar o Projeto

```bash
npm run dev
```

Acesse: http://localhost:3000

## 🔑 Credenciais de Acesso

Como o sistema agora usa o Firebase Authentication, você pode criar usuários de teste diretamente no console do Firebase ou através da interface da aplicação (se houver uma página de registro).

## 📊 Scripts Disponíveis

| Script | Descrição |
|--------|-----------|
| `npm run dev` | Inicia o servidor de desenvolvimento |
| `npm run build` | Gera build de produção |
| `npm run start` | Inicia o servidor de produção |
| `npm run lint` | Executa o linter de código |

## 🗄️ Estrutura do Banco de Dados (Firestore)

O projeto usa o Firestore como banco de dados NoSQL. As coleções principais são:

-   **companies**: Empresas cadastradas
-   **users**: Usuários do sistema (gerenciados pelo Firebase Auth)
-   **drivers**: Motoristas
-   **vehicles**: Veículos da frota
-   **passengers**: Passageiros das rotas
-   **routes**: Rotas de transporte
-   **alerts**: Alertas do sistema
-   **route_history**: Histórico das rotas

## 🔐 Segurança

O projeto implementa:

-   ✅ **Regras de Segurança do Firestore** para proteger o acesso aos dados.
-   ✅ **Autenticação** via Firebase Authentication.
-   ✅ **Autorização** baseada em claims customizadas (se implementado).
-   ✅ **Isolamento** de dados por empresa (multi-tenant) através de regras de segurança.

## 🎨 Funcionalidades Implementadas

### ✅ Autenticação e Autorização
-   Login/logout de usuários com Firebase Auth.
-   Controle de acesso por perfil.
-   Proteção de rotas.

### ✅ Gestão de Frota
-   Cadastro de motoristas no Firestore.
-   Gestão de veículos no Firestore.
-   Rastreamento em tempo real (se implementado).

### ✅ Gestão de Rotas
-   Criação e edição de rotas no Firestore.
-   Associação de passageiros.
-   Histórico de execução.

### ✅ Analytics e Relatórios
-   Dashboard com métricas.
-   Relatórios de performance.
-   Controle de custos.

### ✅ Sistema de Alertas
-   Notificações em tempo real (usando Firestore listeners).
-   Diferentes tipos de alerta.
-   Histórico de alertas.

## 🚨 Troubleshooting

### Erro: "Firebase: Error (auth/invalid-api-key)"
**Solução:** Verifique se as chaves do Firebase no arquivo `.env.local` estão corretas.

### Erro: "Missing or insufficient permissions"
**Solução:** Verifique as Regras de Segurança do Firestore no console do Firebase para garantir que o usuário autenticado tenha permissão para acessar os dados.

### Aplicação não carrega
**Solução:**

1.  Verifique se o servidor está rodando: `npm run dev`
2.  Verifique se não há erros no console do navegador.
3.  Verifique se as variáveis de ambiente do Firebase estão configuradas corretamente.

## 🔄 Próximos Passos

1.  **Personalização**: Adapte o sistema às suas necessidades.
2.  **Integração**: Configure APIs externas (Google Maps, etc.).
3.  **Deploy**: Publique em produção (Vercel, Netlify, Firebase Hosting, etc.).
4.  **Monitoramento**: Configure o Firebase Performance Monitoring e o Crashlytics.

## 🎉 Conclusão

Parabéns! Seu sistema Golffox está configurado com o Firebase. O projeto agora possui:

-   ✅ Banco de dados Firestore configurado.
-   ✅ Autenticação com Firebase Authentication.
-   ✅ Interface completa para gestão de transporte.
-   ✅ Sistema de relatórios e analytics.

Explore todas as funcionalidades e adapte o sistema conforme suas necessidades!
