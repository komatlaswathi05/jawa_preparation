# Remaining Modules

Topics that are missing or only mentioned in passing in the existing material.
Implement **one module at a time**: create the topic file, register it in the category file, add the sidebar entry, then run `npm run lint` and `npm run build`.

## Checklist

- [x] **Module 1 — SQL: Views, Stored Procedures & Triggers** (`sql-views-procedures`)
  - Views, updatable views, `WITH CHECK OPTION`, materialized views and refresh
  - Functions vs stored procedures, PL/pgSQL basics, `CALL`, transaction control in procedures
  - Triggers (`BEFORE`/`AFTER`, row vs statement, `NEW`/`OLD`), audit-log example
  - Calling procedures from Spring (`@Procedure`, `JdbcTemplate`), when to keep logic in the database vs the app
- [ ] **Module 2 — Spring: Async, Scheduling & Application Events** (`spring-async-events`)
  - `@EnableAsync`, `@Async`, return types (`CompletableFuture`), custom `TaskExecutor`, self-invocation pitfall
  - Exception handling in async methods (`AsyncUncaughtExceptionHandler`)
  - `@EnableScheduling`, `@Scheduled` (fixedRate, fixedDelay, cron, zone), scheduler thread pool
  - Running scheduled jobs on multiple instances (ShedLock)
  - `ApplicationEventPublisher`, `@EventListener`, `@TransactionalEventListener`, async listeners
  - Virtual threads with `spring.threads.virtual.enabled`
- [ ] **Module 3 — Microservices: Kubernetes Basics** (`microservices-kubernetes`)
  - Pods, Deployments, ReplicaSets, Services, Ingress
  - ConfigMaps and Secrets, resource requests/limits
  - Liveness/readiness/startup probes with Actuator health groups
  - Rolling updates and rollback, Horizontal Pod Autoscaler
  - `kubectl` essentials, Helm (brief), Kubernetes vs Docker Compose
- [ ] **Module 4 — Security: OAuth2 & OpenID Connect in Depth** (`security-oauth2`)
  - Roles: resource owner, client, authorization server, resource server
  - Grant types: authorization code + PKCE, client credentials; why implicit/password are deprecated
  - Spring Boot resource server (JWT validation, issuer URI, JWK set, scopes → authorities)
  - `oauth2Login()` (login with Google/GitHub), Keycloak as the authorization server
  - Service-to-service calls with client credentials, token relay in the gateway
- [ ] **Module 5 — Java: Modern Java (9–21)** (`java-modern`)
  - `var`, text blocks, enhanced `instanceof`
  - Sealed classes and interfaces, record patterns, pattern matching for `switch`
  - Collection factory methods (`List.of`), `Stream.toList()`, sequenced collections (Java 21)
  - New String/Optional/Stream methods, `HttpClient`
  - Virtual threads and structured concurrency (overview), LTS versions (11, 17, 21)

## Per-module steps

1. Create `src/data/topics/<topic-id>.js` (same shape as existing topics).
2. Import it in the category file (e.g. `src/data/sqlData.js`).
3. Add the sidebar item in `src/data/navigation.js`.
4. `npm run lint && npm run build`.
5. Tick the box above.
