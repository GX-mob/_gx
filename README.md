```
.
├── apps
│   ├── driver
│   └── voyager
│       ├── app.json
│       ├── assets
│       │   ├── favicon.png
│       │   ├── icon.png
│       │   └── splash.png
│       ├── babel.config.js
│       ├── package.json
│       ├── package-lock.json
│       ├── shared
│       │   ├── events
│       │   │   ├── events.ts
│       │   │   ├── index.ts
│       │   │   └── schemas
│       │   │       ├── am-i-running.ts
│       │   │       ├── canceled-ride.ts
│       │   │       ├── cancel-ride.ts
│       │   │       ├── common
│       │   │       │   ├── connection-data.ts
│       │   │       │   ├── driver.ts
│       │   │       │   ├── index.ts
│       │   │       │   ├── lat-lng.ts
│       │   │       │   ├── location.ts
│       │   │       │   ├── observer.ts
│       │   │       │   ├── user-basic.ts
│       │   │       │   └── voyager.ts
│       │   │       ├── configuration.ts
│       │   │       ├── delayed-offer-response.ts
│       │   │       ├── driver-ride-accepted-response.ts
│       │   │       ├── driver-setup.ts
│       │   │       ├── finish-ride.ts
│       │   │       ├── index.ts
│       │   │       ├── offer-got-too-long.ts
│       │   │       ├── offer-response.ts
│       │   │       ├── offer-sent.ts
│       │   │       ├── offer.ts
│       │   │       ├── picking-up-path.ts
│       │   │       ├── position.ts
│       │   │       ├── start-ride.ts
│       │   │       ├── state.ts
│       │   │       └── voyager-ride-accepted-response.ts
│       │   ├── http-exceptions
│       │   │   ├── http-exceptions-messages.ts
│       │   │   └── index.ts
│       │   └── interfaces
│       │       ├── general.interfaces.ts
│       │       ├── index.ts
│       │       ├── pendencie.interface.ts
│       │       ├── ride-area-configuration.interface.ts
│       │       ├── ride.interface.ts
│       │       ├── session.interface.ts
│       │       ├── sigin.interface.ts
│       │       ├── user.interface.ts
│       │       └── vehicle.interface.ts
│       ├── src
│       │   ├── api
│       │   │   ├── exceptions.ts
│       │   │   ├── http.ts
│       │   │   ├── index.ts
│       │   │   └── signin.ts
│       │   ├── App.tsx
│       │   ├── components
│       │   │   ├── atoms.tsx
│       │   │   ├── general.tsx
│       │   │   ├── google.tsx
│       │   │   ├── logo.tsx
│       │   │   └── molecules.tsx
│       │   ├── constants.ts
│       │   ├── interfaces
│       │   │   ├── index.ts
│       │   │   └── theme.ts
│       │   ├── Launcher.tsx
│       │   ├── modules
│       │   │   ├── create-styled.ts
│       │   │   ├── storage.ts
│       │   │   └── themeable-component-factory.tsx
│       │   ├── screens
│       │   │   ├── index.ts
│       │   │   ├── main
│       │   │   │   ├── index.ts
│       │   │   │   └── main.tsx
│       │   │   └── signin
│       │   │       ├── code.step.tsx
│       │   │       ├── common.tsx
│       │   │       ├── identify.step.tsx
│       │   │       ├── index.ts
│       │   │       ├── password.step.tsx
│       │   │       ├── recovey.screen.tsx
│       │   │       ├── signin.screen.tsx
│       │   │       └── styles.ts
│       │   ├── stores
│       │   │   ├── app.ts
│       │   │   ├── index.ts
│       │   │   ├── login.store.ts
│       │   │   └── ui.store.ts
│       │   └── styles
│       │       ├── index.tsx
│       │       └── themes
│       │           ├── dark.ts
│       │           ├── light.ts
│       │           └── matrix.ts
│       └── tsconfig.json
├── landings
│   ├── business
│   ├── driver
│   ├── enterprise
│   ├── home
│   └── voyager
├── LICENSE
├── package.json
├── package-lock.json
├── README-en.md
├── README.md
├── server
│   ├── apps
│   │   ├── common
│   │   │   ├── src
│   │   │   │   ├── account-management
│   │   │   │   │   ├── account-management.module.ts
│   │   │   │   │   ├── contact.controller.spec.ts
│   │   │   │   │   ├── contact.controller.ts
│   │   │   │   │   ├── dto.ts
│   │   │   │   │   ├── entities
│   │   │   │   │   │   └── user.entity.ts
│   │   │   │   │   ├── profile.controller.spec.ts
│   │   │   │   │   ├── profile.controller.ts
│   │   │   │   │   ├── security.controller.spec.ts
│   │   │   │   │   └── security.controller.ts
│   │   │   │   ├── app.module.ts
│   │   │   │   ├── constants.ts
│   │   │   │   ├── main.ts
│   │   │   │   ├── rides
│   │   │   │   │   ├── __mocks__
│   │   │   │   │   │   └── index.ts
│   │   │   │   │   ├── rides.controller.spec.ts
│   │   │   │   │   ├── rides.controller.ts
│   │   │   │   │   ├── rides.dto.ts
│   │   │   │   │   ├── rides.module.ts
│   │   │   │   │   ├── rides.service.spec.ts
│   │   │   │   │   ├── rides.service.ts
│   │   │   │   │   └── __snapshots__
│   │   │   │   │       └── rides.service.spec.ts.snap
│   │   │   │   ├── schemas
│   │   │   │   ├── sign-in
│   │   │   │   │   ├── google.controller.ts
│   │   │   │   │   ├── sign-in.controller.spec.ts
│   │   │   │   │   ├── sign-in.controller.ts
│   │   │   │   │   ├── sign-in.dto.ts
│   │   │   │   │   └── sign-in.module.ts
│   │   │   │   └── sign-up
│   │   │   │       ├── google.controller.ts
│   │   │   │       ├── sign-up.controller.spec.ts
│   │   │   │       ├── sign-up.controller.ts
│   │   │   │       ├── sign-up.dto.ts
│   │   │   │       └── sign-up.module.ts
│   │   │   ├── test
│   │   │   │   ├── app.e2e-spec.ts
│   │   │   │   └── jest-e2e.json
│   │   │   └── tsconfig.app.json
│   │   ├── development
│   │   │   ├── src
│   │   │   │   ├── main.ts
│   │   │   │   ├── setup-database.ts
│   │   │   │   └── util.ts
│   │   │   └── tsconfig.app.json
│   │   └── run
│   │       ├── src
│   │       │   ├── app.module.ts
│   │       │   ├── configuration
│   │       │   │   └── state.config.ts
│   │       │   ├── constants.ts
│   │       │   ├── events
│   │       │   │   └── nodes.ts
│   │       │   ├── exceptions.ts
│   │       │   ├── gateways
│   │       │   │   ├── common.ts
│   │       │   │   ├── drivers.gateway.ts
│   │       │   │   ├── gateways.module.ts
│   │       │   │   ├── test
│   │       │   │   │   ├── common.spec.ts
│   │       │   │   │   ├── drivers.gateway.spec.ts
│   │       │   │   │   ├── util.ts
│   │       │   │   │   └── voyagers.gateway.spec.ts
│   │       │   │   └── voyagers.gateway.ts
│   │       │   ├── index.d.ts
│   │       │   ├── main.ts
│   │       │   ├── state.service.spec.ts
│   │       │   └── state.service.ts
│   │       ├── test
│   │       │   ├── app.e2e-spec.ts
│   │       │   └── jest-e2e.json
│   │       └── tsconfig.app.json
│   ├── global.d.ts
│   ├── jpegtran.d.ts
│   ├── libs
│   │   ├── auth
│   │   │   ├── src
│   │   │   │   ├── auth.decorator.ts
│   │   │   │   ├── auth.guard.ts
│   │   │   │   └── index.ts
│   │   │   └── tsconfig.lib.json
│   │   ├── cache
│   │   │   ├── src
│   │   │   │   ├── cache.module.ts
│   │   │   │   ├── cache.service.spec.ts
│   │   │   │   ├── cache.service.ts
│   │   │   │   ├── constants.ts
│   │   │   │   ├── index.ts
│   │   │   │   └── redis.service.ts
│   │   │   └── tsconfig.lib.json
│   │   ├── contact-verification
│   │   │   ├── src
│   │   │   │   ├── constants.ts
│   │   │   │   ├── contact-verification.module.ts
│   │   │   │   ├── contact-verification.service.spec.ts
│   │   │   │   ├── contact-verification.service.ts
│   │   │   │   ├── index.ts
│   │   │   │   └── twilio.service.ts
│   │   │   └── tsconfig.lib.json
│   │   ├── helpers
│   │   │   ├── src
│   │   │   │   ├── geometry
│   │   │   │   │   ├── bounds.spec.ts
│   │   │   │   │   ├── bounds.ts
│   │   │   │   │   ├── distance.spec.ts
│   │   │   │   │   ├── distance.ts
│   │   │   │   │   ├── index.ts
│   │   │   │   │   ├── __snapshots__
│   │   │   │   │   │   ├── bounds.spec.ts.snap
│   │   │   │   │   │   └── distance.spec.ts.snap
│   │   │   │   │   └── types.d.ts
│   │   │   │   ├── index.ts
│   │   │   │   ├── logger.ts
│   │   │   │   ├── __snapshots__
│   │   │   │   │   └── util.spec.ts.snap
│   │   │   │   ├── util.spec.ts
│   │   │   │   └── util.ts
│   │   │   └── tsconfig.lib.json
│   │   ├── repositories
│   │   │   ├── src
│   │   │   │   ├── connections.ts
│   │   │   │   ├── index.ts
│   │   │   │   ├── models
│   │   │   │   │   ├── index.ts
│   │   │   │   │   ├── pendencie.spec.ts
│   │   │   │   │   ├── pendencie.ts
│   │   │   │   │   ├── ride-area-configuration.spec.ts
│   │   │   │   │   ├── ride-area-configuration.ts
│   │   │   │   │   ├── ride.spec.ts
│   │   │   │   │   ├── ride.ts
│   │   │   │   │   ├── session.spec.ts
│   │   │   │   │   ├── session.ts
│   │   │   │   │   ├── user.spec.ts
│   │   │   │   │   ├── user.ts
│   │   │   │   │   ├── vehicle-metadata.spec.ts
│   │   │   │   │   ├── vehicle-metadata.ts
│   │   │   │   │   ├── vehicle.spec.ts
│   │   │   │   │   └── vehicle.ts
│   │   │   │   ├── repositories
│   │   │   │   │   ├── index.ts
│   │   │   │   │   ├── pendencie.repository.ts
│   │   │   │   │   ├── ride.repository.ts
│   │   │   │   │   ├── session.repository.ts
│   │   │   │   │   ├── user.repository.ts
│   │   │   │   │   └── vehicle.repository.ts
│   │   │   │   ├── repository-factory.spec.ts
│   │   │   │   ├── repository-factory.ts
│   │   │   │   ├── repository.module.ts
│   │   │   │   └── repository.service.ts
│   │   │   └── tsconfig.lib.json
│   │   ├── session
│   │   │   ├── src
│   │   │   │   ├── constants.ts
│   │   │   │   ├── exceptions.ts
│   │   │   │   ├── index.ts
│   │   │   │   ├── session.module.ts
│   │   │   │   ├── session.service.spec.ts
│   │   │   │   └── session.service.ts
│   │   │   └── tsconfig.lib.json
│   │   ├── socket
│   │   │   ├── src
│   │   │   │   ├── constants.ts
│   │   │   │   ├── index.ts
│   │   │   │   ├── socket.adapter.ts
│   │   │   │   ├── socket.module.ts
│   │   │   │   ├── socket.service.spec.ts
│   │   │   │   ├── socket.service.ts
│   │   │   │   └── types.d.ts
│   │   │   └── tsconfig.lib.json
│   │   ├── storage
│   │   │   ├── src
│   │   │   │   ├── constants.ts
│   │   │   │   ├── google-storage.service.ts
│   │   │   │   ├── index.ts
│   │   │   │   ├── mock
│   │   │   │   │   ├── gcp-storage.mock.ts
│   │   │   │   │   ├── mock.jpeg
│   │   │   │   │   └── mock.png
│   │   │   │   ├── storage.module.ts
│   │   │   │   ├── storage.service.spec.ts
│   │   │   │   └── storage.service.ts
│   │   │   └── tsconfig.lib.json
│   │   └── testing
│   │       ├── src
│   │       │   └── index.ts
│   │       └── tsconfig.lib.json
│   ├── nest-cli.json
│   ├── package.json
│   ├── package-lock.json
│   ├── pngquant.d.ts
│   ├── README.md
│   ├── schemapack.d.ts
│   ├── tsconfig.build.json
│   └── tsconfig.json
└── shared
    ├── events
    │   ├── events.ts
    │   ├── index.ts
    │   └── schemas
    │       ├── am-i-running.ts
    │       ├── canceled-ride.ts
    │       ├── cancel-ride.ts
    │       ├── common
    │       │   ├── connection-data.ts
    │       │   ├── driver.ts
    │       │   ├── index.ts
    │       │   ├── lat-lng.ts
    │       │   ├── location.ts
    │       │   ├── observer.ts
    │       │   ├── user-basic.ts
    │       │   └── voyager.ts
    │       ├── configuration.ts
    │       ├── delayed-offer-response.ts
    │       ├── driver-ride-accepted-response.ts
    │       ├── driver-setup.ts
    │       ├── finish-ride.ts
    │       ├── index.ts
    │       ├── offer-got-too-long.ts
    │       ├── offer-response.ts
    │       ├── offer-sent.ts
    │       ├── offer.ts
    │       ├── picking-up-path.ts
    │       ├── position.ts
    │       ├── start-ride.ts
    │       ├── state.ts
    │       └── voyager-ride-accepted-response.ts
    ├── http-exceptions
    │   ├── http-exceptions-messages.ts
    │   └── index.ts
    └── interfaces
        ├── general.interfaces.ts
        ├── index.ts
        ├── pendencie.interface.ts
        ├── ride-area-configuration.interface.ts
        ├── ride.interface.ts
        ├── session.interface.ts
        ├── sigin.interface.ts
        ├── user.interface.ts
        └── vehicle.interface.ts


80 directories, 281 files
```
