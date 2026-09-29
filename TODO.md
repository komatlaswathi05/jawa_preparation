# Remaining Modules

Topics that are missing or only mentioned in passing in the existing material.
Implement **one module at a time**: create the topic file, register it in the category file, add the sidebar entry, then run `npm run lint` and `npm run build`.

## Checklist

### Coding questions (12 questions each, `src/data/coding/<file>.js`)

- [x] **Module 1 — Coding: Linked Lists** (`linkedLists.js`)
  - Node class, reverse (iterative/recursive), middle node, detect cycle (Floyd), cycle start
  - Merge two sorted lists, remove Nth from end, palindrome list, intersection, add two numbers
- [x] **Module 2 — Coding: Trees & BST** (`trees.js`)
  - Traversals (in/pre/post order, level order), height, balanced check, mirror/invert
  - Validate BST, insert/search in BST, lowest common ancestor, path sum, diameter, kth smallest
- [x] **Module 3 — Coding: Stacks & Queues** (`stacksQueues.js`)
  - Valid parentheses, min stack, next greater element, evaluate postfix, daily temperatures
  - Queue using two stacks, stack using queues, sliding window maximum (deque), circular queue
- [x] **Module 4 — Coding: Graphs** (`graphs.js`)
  - Adjacency list, BFS, DFS, number of islands, shortest path in unweighted graph
  - Cycle detection, topological sort (course schedule), Dijkstra, flood fill, connected components
- [x] **Module 5 — Coding: Dynamic Programming** (`dynamicProgramming.js`)
  - Climbing stairs, house robber, coin change, longest increasing subsequence
  - Longest common subsequence, 0/1 knapsack, edit distance, word break, minimum path sum
  - Partition equal subset sum, longest palindromic substring (Kadane already exists in Arrays)

### Study topics (`src/data/topics/<topic-id>.js`)

- [x] **Module 6 — Java: Concurrency Synchronizers** (`java-concurrency-utilities`)
  - `CountDownLatch`, `CyclicBarrier`, `Semaphore`, `Phaser`, `Exchanger`
  - `BlockingQueue` producer-consumer, `ConcurrentHashMap` atomic operations, `ForkJoinPool`
  - Java Memory Model and happens-before, classic threading coding problems
- [x] **Module 7 — Microservices: System Design Basics** (`microservices-system-design`)
  - Vertical vs horizontal scaling, load balancers, stateless services
  - Caching layers, CDN, database replication, sharding, consistent hashing
  - CAP and PACELC, message queues, rate limiting, designing a URL shortener
- [x] **Module 8 — Spring Boot: Reactive Programming & WebFlux** (`spring-webflux`)
  - Reactive Streams, `Mono`, `Flux`, operators, back-pressure
  - Reactive controllers and functional endpoints, `WebClient`, R2DBC
  - Reactive vs virtual threads, testing with `StepVerifier`
- [x] **Module 9 — Security: OWASP Top 10 & Web Security** (`security-owasp`)
  - Injection (SQL, JPQL), XSS, CSRF recap, SSRF, broken access control (IDOR)
  - Security headers, CORS pitfalls, secrets handling, dependency scanning
  - Input validation, logging without leaking sensitive data
- [x] **Module 10 — Database: NoSQL & MongoDB** (`sql-nosql-mongodb`)
  - SQL vs NoSQL, document/key-value/column/graph stores
  - MongoDB documents, embedding vs referencing, indexes, aggregation pipeline
  - Spring Data MongoDB, transactions, when to choose MongoDB
- [x] **Module 11 — Testing: Advanced Testing** (`testing-advanced`)
  - WireMock for HTTP dependencies, consumer-driven contract tests (Spring Cloud Contract, Pact)
  - Testing Kafka, security and async code, Awaitility
  - Mutation testing (PIT), flaky tests, test data builders
- [x] **Module 12 — Spring Boot: REST API Design in Depth** (`spring-rest-advanced`)
  - API versioning strategies, content negotiation, HATEOAS
  - ETags and conditional requests, idempotency keys, bulk operations
  - Problem Details (RFC 9457), cursor pagination, backward-compatible changes
- [x] **Module 13 — Microservices: GraphQL & gRPC** (`microservices-graphql-grpc`)
  - REST vs GraphQL vs gRPC
  - Spring for GraphQL: schema, `@QueryMapping`, `@SchemaMapping`, N+1 and `@BatchMapping`
  - gRPC: Protocol Buffers, service definitions, streaming, when to use it
- [x] **Module 14 — Spring Boot: Developer Tooling (Git, Maven/Gradle, Linux)** (`dev-tooling`)
  - Git workflows, rebase vs merge, resolving conflicts, cherry-pick, reverting
  - Maven lifecycle and dependency management vs Gradle
  - Linux commands for debugging a running service (logs, processes, ports, memory)

## Per-module steps

1. Create `src/data/topics/<topic-id>.js` (same shape as existing topics).
   For coding modules, create `src/data/coding/<file>.js` instead.
2. Import it in the category file (e.g. `src/data/sqlData.js`).
   For coding modules, import it in `src/data/codingQuestions.js` and add the category to `CODING_CATEGORIES`.
3. Add the sidebar item in `src/data/navigation.js` (study topics only).
4. `npm run lint && npm run build`.
5. Tick the box above.
