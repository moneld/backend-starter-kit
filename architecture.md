# Architecture du projet

```
src/
├── domain/                 # Couche Domaine (Cœur métier)
│   ├── entities/          # Entités métier
│   ├── value-objects/     # Objets valeur
│   ├── exceptions/        # Exceptions métier
│   ├── events/           # Événements domaine
│   └── repositories/      # Interfaces des repositories
│
├── application/           # Couche Application (Use Cases)
│   ├── use-cases/        # Cas d'utilisation
│   ├── dto/              # DTOs application
│   ├── mappers/          # Mappers DTO <-> Entités
│   └── services/         # Services application
│
├── infrastructure/        # Couche Infrastructure
│   ├── persistence/      # Implémentation des repositories
│   │   ├── prisma/      # Configuration Prisma
│   │   └── repositories/ # Repositories concrets
│   ├── web/             # Adaptateurs web
│   │   ├── controllers/ # Controllers NestJS
│   │   ├── dto/        # DTOs web (request/response)
│   │   ├── guards/     # Guards
│   │   ├── filters/    # Exception filters
│   │   └── validators/ # Validateurs custom
│   └── config/         # Configuration
│
├── shared/              # Code partagé
│   ├── types/          # Types TypeScript
│   └── utils/          # Utilitaires
│
└── modules/            # Modules NestJS
    ├── auth/          # Module authentification
    └── users/         # Module utilisateurs

```