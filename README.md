# Desafio Email + Scrap (Node.js - Terra Esportes)

Este projeto implementa um backend em Node.js que realiza o scraping de notícias de futebol do portal Terra Esportes (seção de futebol) e envia um email com as últimas 5 manchetes encontradas.

## Funcionalidades

- Realiza scraping da página de futebol do Terra Esportes (https://www.terra.com.br/esportes/futebol/).
- Extrai as 5 notícias mais recentes (título e link).
- Formata as notícias em um corpo de email HTML.
- Envia o email para um destinatário configurado via variáveis de ambiente.
- Se as variáveis de ambiente para envio de email não estiverem configuradas, o script simula o envio imprimindo o conteúdo do email no console.

## Tecnologias Utilizadas

- Node.js
- Axios: Para realizar as requisições HTTP e buscar o HTML da página.
- Cheerio: Para fazer o parsing do HTML e extrair os dados (similar ao jQuery no servidor).
- Nodemailer: Para o envio dos emails.
- dotenv: Para carregar variáveis de ambiente a partir de um arquivo `.env`.

## Configuração

   **1. Clone o repositório (ou copie os arquivos):**
    Certifique-se de ter os arquivos `index.js` e `package.json` no diretório do seu projeto.

 **1. Instale as dependências:**
    Navegue até o diretório do projeto no terminal e execute:
    ```bash
    npm install
    ```

 **1.onfigure as Variáveis de Ambiente:**
    Crie um arquivo chamado `.env` na raiz do projeto e adicione as seguintes variáveis (substitua pelos seus dados):

    ```dotenv
    # Configurações de Email
    SENDER_EMAIL=seu_email@exemplo.com
    SENDER_PASSWORD=sua_senha_ou_senha_de_app
    RECEIVER_EMAIL=email_destino@exemplo.com

    # Configurações SMTP (Opcional - Padrão Gmail)
    # SMTP_SERVER=smtp.exemplo.com
    # SMTP_PORT=587
    ```

    *   `SENDER_EMAIL`: O endereço de email que enviará as notícias.
    *   `SENDER_PASSWORD`: A senha do seu email. **Importante:** Para serviços como o Gmail, é altamente recomendável usar uma "Senha de App" em vez da sua senha principal por motivos de segurança. Consulte a documentação do seu provedor de email para gerar uma.
    *   `RECEIVER_EMAIL`: O endereço de email que receberá as notícias.
    *   `SMTP_SERVER` (Opcional): O endereço do servidor SMTP do seu provedor. O padrão é `smtp.gmail.com`.
    *   `SMTP_PORT` (Opcional): A porta do servidor SMTP. O padrão é `587` (TLS).

    **Observação:** Se as variáveis `SENDER_EMAIL`, `SENDER_PASSWORD`, ou `RECEIVER_EMAIL` não forem definidas no arquivo `.env`, o script apenas imprimirá o conteúdo do email no console em vez de enviá-lo.

## Execução

Após configurar as dependências e as variáveis de ambiente, execute o script com:

```bash```
```node index.js```

O script buscará as notícias, formatará o email e o enviará (ou simulará o envio no console).
