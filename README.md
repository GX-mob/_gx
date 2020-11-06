<center>
  <h1>GX</h1>
</center>

## GX-Platform

Uma plataform open-source de uso livre licenciada sobre a AGPL 3.0 criada para sustentar projeto da fundação GX que visa direcionar os frutos de um esforço mútuo a projetos e pessoas que dedicam seu tempo a boas causas.

Leia mais sobre o projeto aqui: http://gx.com/porque

### Conteúdo desse repositório

Contém apps/pwa's de clientes e servidor.

### Servidor

Arquitetura monolitíca altamente acoplada a Google Cloud usando serviços gerenciados como App Engine, MongoDB Atlas, MemoryStore(Redis), etc, para diminuir ao máximo operações de DevOps.

#### Bancos de dados:

- **Entities** - _Usuários, Negócios, Empresas_
- **Operational** - _Corridas, Pendências_
- ...

#### Serviços:

- **Gateway** - HTTP - _CRUD: corridas, usuários, serviços de terceiros_
- **RidesFlows** - WebSockets - _Gerencia fluxos dos eventos de negociação e controle de corridas_
- **ServicesFlows** - WebSockets - _Gerencia fluxos dos eventos de negociações entre clientes e provedores de serviços_
- **Chat** - WebSockets - _Comunicação geral entre usuários_

## Clientes

Aplicativos nativos com Expo gerenciado e Next.js em PWA's.

### Aplicativos nativos:

- **GX Passageiro**
- **GX Motorista**

### PWA's:

- **GX Passageiro**
- **GX Negócios**
  - _Direcionado a negócios possibilitando prover serviços antecipadamente ao passageiro com destino direcionado ao estabelecimento_
- **GX Empresas**
- **GX Helpdesk** - Cliente e colaborador

## Tech stack overview:

#### Servidor

- NestJS
  - Api HTTP com fastify
  - Api WebSocket com Socket.io.
    - [Diagrama de funcionamento e estrategia de escalabilidade](https://www.figma.com/proto/chjANlM2wRPIgejwWPE3R2/Diagrama-do-servi%C3%A7o-de-corridas?node-id=1%3A3&scaling=scale-down-width)
- MongoDB
- Redis

#### Clientes:

- Expo
- Next.js
- Gatsby - _Landing pages_
- Netlify - _Provedor de sites estáticos_
- MobX - _Gerenciamento de estados_

#### CI/CD

- Github Actions

#### Deseja contribuir?

http://github.com/gx-project/gx-platform/CONTRIBUTING.md
