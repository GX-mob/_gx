## Proposta de feature:

Veja mais em: http://gx.com/construindo

## Recompensas

TODO

## Iniciando o ambiente de desenolvimento:

Clone o repositório.

Antes de tudo atualize os itens compartilhados do ecosistema na pasta do servidor e dos clientes usando `npm run up-shared` na respectiva pasta.

## Clientes

Comando padrão:

```shell
$ npm start
```

## Servidor:

### Construa as images:

```shell
docker-compose build
```

### Alimente os bancos de dados:

Ira criar contas administrativas, de passageiros, motoristas e adminstradores de negócios(venda antecipada de serviços dentro da plataforma).

```shell
docker-compose run seed-database
```

Veja os dados que são gerados em:
http://github.com/gx-alpha/server/development/fixtures/README.md

### Inicie o servidor:

```shell
docker-compose up
```

#### Divida técnica:

- Migração para microserviços
- Implementação de CQRS + EventSource

Seria interessante encarar esse desafio em um projeto open-source junto com a contribuição da comunidade, deixando um exemplo prático a ser seguido.
