const topic = {
  id: 'spring-performance',
  category: 'spring-boot',
  title: 'Performance & Production',
  description: "Make a Spring Boot service fast and production-ready: database tuning, connection pools, batching, JVM settings, logging, monitoring, secrets and CI/CD.",
  difficulty: 'Advanced',
  overview: "Writing code that works on your laptop is only half the job. In production the same service must handle many concurrent users, large tables, slow networks and deployments without downtime. Performance and production readiness are about making the app fast, observable and safe to operate.\n\nThink of running a restaurant. Cooking a good dish (writing working code) is essential, but you also need enough tables and waiters (connection pools and threads), an efficient kitchen layout (indexes and queries), a way to see what is happening (logs, metrics, dashboards), a safe place for the keys (secrets management) and a routine for opening and closing (CI/CD and graceful shutdown).\n\nIn most Spring Boot services the biggest wins come from the database: good indexes, fewer and smarter queries, pagination and batching. Next comes caching, then JVM tuning. None of it matters if you cannot see problems, so monitoring with Actuator, Micrometer, Prometheus and Grafana is part of the picture.\n\nSenior interviews often ask 'Your API is slow, how do you investigate?' or 'How do you prepare a service for production?'. This topic gives you a structured answer.",

  subtopics: [
    {
      id: 'database-optimization',
      title: 'Database optimization',
      explanation: "The database is the most common bottleneck. Start by measuring: find the slowest and most frequent queries using PostgreSQL's `pg_stat_statements`, slow query logs, or APM tools. Then reduce the number of queries (fix N+1 problems, batch writes), reduce the work per query (indexes, selecting only needed columns), and reduce data volume (pagination, archiving old rows).\n\nAlso keep transactions short, use read replicas for heavy read traffic if needed, and make sure the connection pool is sized sensibly. Optimise based on evidence, not guesses.",
      example: `-- PostgreSQL: find the most expensive queries
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

SELECT query, calls, mean_exec_time, total_exec_time
FROM pg_stat_statements
ORDER BY total_exec_time DESC
LIMIT 10;`,
      interviewPoints: [
        'Measure first: slow query log, pg_stat_statements, APM',
        'Fewer queries, cheaper queries, less data',
        'Most backend latency comes from I/O, usually the DB',
      ],
    },
    {
      id: 'query-optimization',
      title: 'Query optimization',
      explanation: "Use `EXPLAIN ANALYZE` to see how the database executes a query: whether it uses an index or scans the whole table (Seq Scan), how many rows it reads, and where time is spent.\n\nCommon fixes: add an index for the WHERE, JOIN and ORDER BY columns; avoid `SELECT *` and fetch only what you need (projections); avoid wrapping indexed columns in functions (`WHERE lower(email) = ?` needs an expression index); replace N+1 queries with JOIN FETCH or batch fetching; and turn on Hibernate SQL logging in development to see what is actually sent.",
      example: `EXPLAIN ANALYZE
SELECT id, total
FROM orders
WHERE customer_id = 42 AND status = 'PAID'
ORDER BY created_at DESC
LIMIT 20;

-- application-dev.yml: see generated SQL and bind values
logging:
  level:
    org.hibernate.SQL: debug
    org.hibernate.orm.jdbc.bind: trace`,
      interviewPoints: [
        'EXPLAIN ANALYZE shows the real plan and timings',
        'Seq Scan on a large table is a red flag',
        'Log SQL in dev to catch N+1 and heavy queries',
      ],
    },
    {
      id: 'indexes',
      title: 'Indexes',
      explanation: "An index is a separate data structure (usually a B-tree) that lets the database find rows without scanning the whole table, like the index at the back of a book. Index columns used in WHERE, JOIN and ORDER BY clauses, and foreign keys (PostgreSQL does not index them automatically).\n\nA composite index on `(customer_id, created_at)` helps queries that filter by customer and sort by date; column order matters (leftmost prefix rule). Indexes are not free: each one slows down INSERT and UPDATE and uses disk, so do not index everything. Create indexes on big production tables with `CREATE INDEX CONCURRENTLY` to avoid locking writes, via a Flyway migration.",
      example: `-- Flyway migration V7__order_indexes.sql
-- (CONCURRENTLY cannot run inside a transaction, so configure this migration to run non-transactionally)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_customer_created
  ON orders (customer_id, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_customers_email_lower
  ON customers (lower(email));

// JPA can declare indexes for generated DDL too
@Table(name = "orders", indexes = @Index(name = "idx_orders_status", columnList = "status"))`,
      interviewPoints: [
        'Index WHERE/JOIN/ORDER BY columns and foreign keys',
        'Composite index order matters (leftmost prefix)',
        'Indexes speed reads but slow writes',
        'CREATE INDEX CONCURRENTLY on large live tables',
      ],
    },
    {
      id: 'connection-pooling',
      title: 'Connection pooling',
      explanation: "Opening a database connection is slow (TCP handshake, authentication, session setup: often tens of milliseconds). A connection pool opens a set of connections once and lends them to requests, which return them when finished. This makes each query much faster and limits how many connections hit the database.\n\nIf all connections are busy, new requests wait. If they wait longer than the timeout, they fail with an error like 'Connection is not available, request timed out'. The usual causes are long transactions, slow queries, connection leaks or a pool that is too small for the load.",
      interviewPoints: [
        'Reusing connections avoids expensive setup per request',
        'Pool size caps DB connections from each instance',
        'Pool exhaustion usually means slow or long transactions, not a too-small pool',
      ],
    },
    {
      id: 'hikaricp',
      title: 'HikariCP (key settings)',
      explanation: "HikariCP is the default connection pool in Spring Boot, known for being fast and lightweight. Key settings: `maximum-pool-size` (default 10) is the most connections it will open; `minimum-idle` defaults to the max, giving a fixed-size pool, which Hikari recommends; `connection-timeout` (default 30 s) is how long a request waits for a connection; `idle-timeout` closes idle extra connections; `max-lifetime` (default 30 min) retires connections before the database or a firewall kills them; `leak-detection-threshold` logs a warning if a connection is held too long.\n\nBigger is not better: a pool of 10 to 20 per instance is usually enough, because the database can only run so many queries in parallel. Remember total connections = pool size x number of instances, which must stay below the database's `max_connections`.",
      example: `# application.yml
spring:
  datasource:
    url: jdbc:postgresql://db:5432/shop
    username: \${DB_USER}
    password: \${DB_PASSWORD}
    hikari:
      maximum-pool-size: 15
      minimum-idle: 15
      connection-timeout: 5000        # ms, fail fast instead of 30 s
      max-lifetime: 1500000           # 25 min, below DB/firewall limits
      leak-detection-threshold: 20000 # warn if held > 20 s
      pool-name: shop-pool`,
      interviewPoints: [
        'Default pool in Spring Boot; default max size 10',
        'Small fixed-size pools usually perform best',
        'Pool size x instances must fit DB max_connections',
        'Watch hikaricp_connections_pending in metrics',
      ],
    },
    {
      id: 'pagination',
      title: 'Pagination',
      explanation: "Never return unbounded lists from an API. Pagination returns data in pages, which keeps responses small, memory use flat and queries fast. Spring Data supports it with `Pageable`, and you should cap the maximum page size.\n\nOFFSET pagination (`LIMIT 20 OFFSET 100000`) gets slower on deep pages because the database still reads and skips all earlier rows. Keyset (cursor) pagination uses the last seen value (`WHERE id > :lastId ORDER BY id LIMIT 20`) and stays fast at any depth, which is ideal for feeds and exports.",
      example: `# Cap page size for all endpoints
spring:
  data:
    web:
      pageable:
        max-page-size: 100
        default-page-size: 20

// Keyset pagination
@Query("SELECT o FROM Order o WHERE o.id > :afterId ORDER BY o.id")
List<Order> nextPage(@Param("afterId") Long afterId, Limit limit);

List<Order> page = orderRepository.nextPage(lastSeenId, Limit.of(50));`,
      interviewPoints: [
        'Always paginate list endpoints and cap page size',
        'OFFSET is slow for deep pages',
        'Keyset pagination scales for large datasets',
      ],
    },
    {
      id: 'batch-processing',
      title: 'Batch processing (JDBC batching, hibernate.jdbc.batch_size, Spring Batch)',
      explanation: "Inserting 10,000 rows one statement at a time means 10,000 network round trips. JDBC batching sends many statements in one round trip. In Hibernate enable it with `hibernate.jdbc.batch_size` (for example 50) plus `order_inserts` and `order_updates` so similar statements are grouped. Batching does not work with `GenerationType.IDENTITY` ids, so use SEQUENCE. For PostgreSQL, `reWriteBatchedInserts=true` on the JDBC URL rewrites batches into multi-row inserts for more speed.\n\nIn long loops, call `flush()` and `clear()` every batch so the persistence context does not grow without limit. For big scheduled jobs such as nightly imports, Spring Batch provides chunk processing, restartability, skip and retry policies and job tracking.",
      example: `# application.yml
spring:
  datasource:
    url: jdbc:postgresql://db:5432/shop?reWriteBatchedInserts=true
  jpa:
    properties:
      hibernate:
        jdbc:
          batch_size: 50
        order_inserts: true
        order_updates: true

// Service
@Transactional
public void importProducts(List<ProductRow> rows) {
    for (int i = 0; i < rows.size(); i++) {
        entityManager.persist(Product.from(rows.get(i)));
        if (i > 0 && i % 50 == 0) {
            entityManager.flush();  // send the batch
            entityManager.clear();  // free memory
        }
    }
}`,
      interviewPoints: [
        'Batching cuts round trips drastically',
        'hibernate.jdbc.batch_size + order_inserts/order_updates',
        'IDENTITY ids disable insert batching',
        'flush/clear periodically; Spring Batch for large jobs',
      ],
    },
    {
      id: 'caching',
      title: 'Caching',
      explanation: "Caching stores results of expensive operations so repeat requests are served from memory. Use Spring's `@Cacheable` with Caffeine for local caches or Redis for caches shared by all instances. Always set a TTL and a size limit, and evict entries when data changes.\n\nCache after you have fixed obvious query problems, not instead of fixing them; a cache hides slowness only for hits. Monitor the hit ratio through Micrometer's cache metrics to confirm it helps.",
      example: `@Cacheable(cacheNames = "productDetails", key = "#id")
public ProductDto details(Long id) {
    return ProductDto.from(productRepository.findById(id).orElseThrow());
}

# application.yml
spring:
  cache:
    type: caffeine
    caffeine:
      spec: maximumSize=10000,expireAfterWrite=10m,recordStats`,
      interviewPoints: [
        'Caffeine local, Redis distributed',
        'TTL, size limit and invalidation plan',
        'Track hit ratio (recordStats + Micrometer)',
      ],
    },
    {
      id: 'jvm-memory',
      title: 'JVM memory settings (-Xms/-Xmx)',
      explanation: "`-Xmx` sets the maximum heap size and `-Xms` the initial size. Setting them equal avoids the heap growing and shrinking at runtime. If the heap is too small you get frequent GC pauses and `OutOfMemoryError`; too large and GC pauses may be longer and you waste memory.\n\nIn containers, prefer `-XX:MaxRAMPercentage=75` so the heap is a share of the container memory limit, leaving room for metaspace, thread stacks, direct buffers and the OS. Add `-XX:+HeapDumpOnOutOfMemoryError` so you can analyse memory problems later.",
      example: `# Classic VM
java -Xms1g -Xmx1g -XX:+HeapDumpOnOutOfMemoryError -XX:HeapDumpPath=/tmp -jar app.jar

# Container (Dockerfile or Kubernetes env)
ENV JAVA_TOOL_OPTIONS="-XX:MaxRAMPercentage=75 -XX:+HeapDumpOnOutOfMemoryError -XX:+ExitOnOutOfMemoryError"`,
      interviewPoints: [
        '-Xmx = max heap, -Xms = initial heap',
        'Heap is not the whole process memory',
        'MaxRAMPercentage for containers',
        'Heap dump on OOM for diagnosis',
      ],
    },
    {
      id: 'garbage-collection',
      title: 'Garbage collection choice',
      explanation: "The garbage collector (GC) frees memory from objects that are no longer used. Different collectors trade throughput for pause time. G1 is the default since Java 9 and a good choice for most services (balanced pauses, heaps from a few hundred MB to tens of GB). ZGC (generational in Java 21+) keeps pauses under a millisecond even on huge heaps, good for latency-sensitive services. Parallel GC maximises throughput for batch jobs that can tolerate pauses. Serial GC suits tiny containers with one CPU.\n\nStart with G1, enable GC logging, and switch only if metrics show GC pauses are a problem. Most performance issues are in the code or database, not the GC.",
      example: `# G1 (default) with a pause-time goal
java -XX:+UseG1GC -XX:MaxGCPauseMillis=200 -jar app.jar

# Low-latency: generational ZGC (Java 21+)
java -XX:+UseZGC -XX:+ZGenerational -jar app.jar

# GC logging
java -Xlog:gc*:file=/var/log/app/gc.log:time,uptime:filecount=5,filesize=20m -jar app.jar`,
      interviewPoints: [
        'G1 is the default and fits most services',
        'ZGC for very low pauses, Parallel for throughput',
        'Measure GC with logs and jvm_gc_pause metrics before tuning',
      ],
    },
    {
      id: 'logging',
      title: 'Logging (levels, structured logs)',
      explanation: "Spring Boot uses SLF4J with Logback by default. Levels from most to least detailed: TRACE, DEBUG, INFO, WARN, ERROR. Use INFO in production, WARN for unusual but handled situations, ERROR for failures that need attention, and DEBUG only while diagnosing. Use parameterised messages (`log.info(\"Order {} placed\", id)`) so strings are not built when the level is off.\n\nStructured logs (JSON) are machine-readable, so tools like ELK, Loki or Datadog can search and filter by fields such as `traceId` or `orderId`. Spring Boot 3.4+ supports this natively with `logging.structured.format.console=ecs` (or `logstash`, `gelf`). Never log passwords, tokens or full card numbers.",
      example: `@Slf4j
@Service
public class OrderService {
    public void place(Order order) {
        log.info("Placing order {} for customer {}", order.getId(), order.getCustomerId());
        try {
            paymentClient.charge(order);
        } catch (PaymentException e) {
            log.error("Payment failed for order {}", order.getId(), e); // include the exception
            throw e;
        }
    }
}

# application.yml
logging:
  level:
    root: info
    com.example.shop: info
    org.hibernate.SQL: warn
  structured:
    format:
      console: ecs`,
      interviewPoints: [
        'SLF4J + Logback by default',
        'INFO in prod; change levels at runtime via /actuator/loggers',
        'JSON structured logs with trace ids for searchability',
        'Never log secrets or personal data',
      ],
    },
    {
      id: 'monitoring-actuator',
      title: 'Monitoring and Actuator',
      explanation: "Monitoring means continuously collecting signals about your running app so you notice problems before users complain. The three pillars of observability are logs (what happened), metrics (numbers over time: request rate, latency, errors) and traces (the path of one request across services).\n\nSpring Boot Actuator adds production endpoints: `/actuator/health` (with liveness and readiness groups for Kubernetes probes), `/actuator/metrics`, `/actuator/prometheus`, `/actuator/info`, `/actuator/loggers` and more. Only expose what you need, and protect sensitive endpoints, ideally on a separate management port.",
      example: `<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-actuator</artifactId>
</dependency>

# application.yml
management:
  server:
    port: 8081
  endpoints:
    web:
      exposure:
        include: health,info,metrics,prometheus
  endpoint:
    health:
      probes:
        enabled: true      # /actuator/health/liveness and /readiness
      show-details: when-authorized`,
      interviewPoints: [
        'Logs, metrics, traces',
        'Actuator: health, metrics, prometheus, loggers, info',
        'Liveness vs readiness probes',
        'Do not expose all endpoints publicly',
      ],
    },
    {
      id: 'metrics',
      title: 'Metrics (Micrometer, Prometheus, Grafana)',
      explanation: "Micrometer is the metrics library inside Spring Boot, like SLF4J but for metrics: you record counters, timers and gauges once, and it exports them to many systems. Boot automatically records HTTP request timings, JVM memory and GC, HikariCP pool usage, cache stats and more.\n\nAdd `micrometer-registry-prometheus` and Actuator exposes `/actuator/prometheus`. Prometheus scrapes that endpoint regularly and stores time series. Grafana queries Prometheus to build dashboards and alerts. Watch the 'golden signals': latency (p95/p99), traffic, errors and saturation (CPU, heap, pool usage).",
      example: `<dependency>
    <groupId>io.micrometer</groupId>
    <artifactId>micrometer-registry-prometheus</artifactId>
</dependency>

// Custom business metrics
@Service
public class CheckoutService {
    private final Counter ordersPlaced;
    private final Timer checkoutTimer;

    public CheckoutService(MeterRegistry registry) {
        this.ordersPlaced = Counter.builder("shop.orders.placed").register(registry);
        this.checkoutTimer = Timer.builder("shop.checkout.duration")
                .publishPercentiles(0.95, 0.99)
                .register(registry);
    }

    public void checkout(Cart cart) {
        checkoutTimer.record(() -> doCheckout(cart));
        ordersPlaced.increment();
    }
}

# prometheus.yml
scrape_configs:
  - job_name: shop
    metrics_path: /actuator/prometheus
    static_configs:
      - targets: ["shop:8081"]`,
      interviewPoints: [
        'Micrometer = vendor-neutral metrics facade',
        'Prometheus scrapes, Grafana visualises and alerts',
        'Track p95/p99 latency, error rate, throughput, saturation',
        'Use @Timed or Timer for custom metrics',
      ],
    },
    {
      id: 'graceful-shutdown',
      title: 'Graceful shutdown',
      explanation: "When a new version is deployed, old instances are stopped. Without graceful shutdown, in-flight requests are cut off and users see errors. With `server.shutdown=graceful`, Spring Boot stops accepting new requests on SIGTERM, waits for active requests to finish (up to `spring.lifecycle.timeout-per-shutdown-phase`), then closes the application context, connection pools and consumers cleanly.\n\nGraceful shutdown is enabled by default since Spring Boot 3.4. In Kubernetes, combine it with readiness probes (so the instance is removed from the load balancer) and a short `preStop` sleep, and make sure `terminationGracePeriodSeconds` is longer than the shutdown timeout.",
      example: `# application.yml
server:
  shutdown: graceful
spring:
  lifecycle:
    timeout-per-shutdown-phase: 30s

# Kubernetes deployment snippet
spec:
  terminationGracePeriodSeconds: 45
  containers:
    - name: shop
      lifecycle:
        preStop:
          exec:
            command: ["sh", "-c", "sleep 5"]`,
      interviewPoints: [
        'Finish in-flight requests, reject new ones',
        'server.shutdown=graceful (default in Boot 3.4+)',
        'Align with K8s terminationGracePeriodSeconds and readiness',
      ],
    },
    {
      id: 'environment-variables',
      title: 'Environment variables and configuration',
      explanation: "Follow the twelve-factor rule: build one artifact and configure it per environment from the outside. Spring Boot reads environment variables with relaxed binding, so `SPRING_DATASOURCE_URL` sets `spring.datasource.url`, and you can reference variables with placeholders and defaults like `\${DB_HOST:localhost}`.\n\nUse profiles (`application-dev.yml`, `application-prod.yml`, activated with `SPRING_PROFILES_ACTIVE`) for environment-specific defaults, and `@ConfigurationProperties` records for type-safe, validated settings. Precedence: command-line args, then environment variables, then profile files, then `application.yml`.",
      example: `# application.yml
spring:
  datasource:
    url: jdbc:postgresql://\${DB_HOST:localhost}:5432/\${DB_NAME:shop}
    username: \${DB_USER}
    password: \${DB_PASSWORD}

payment:
  base-url: \${PAYMENT_URL:http://localhost:9090}
  timeout: 3s

// Type-safe config
@ConfigurationProperties(prefix = "payment")
@Validated
public record PaymentProperties(@NotBlank String baseUrl, Duration timeout) { }

# Run
SPRING_PROFILES_ACTIVE=prod DB_HOST=db.internal java -jar app.jar`,
      interviewPoints: [
        'Same artifact, config from the environment',
        'Relaxed binding: SPRING_DATASOURCE_URL -> spring.datasource.url',
        'Profiles for environment defaults',
        '@ConfigurationProperties for type-safe config',
      ],
    },
    {
      id: 'secrets-management',
      title: 'Secrets management',
      explanation: "Secrets are passwords, API keys, tokens and private keys. Never commit them to Git (even in private repos): history keeps them forever and anyone with access can read them. Add `.env` files to `.gitignore` and use secret scanning (for example GitHub secret scanning or gitleaks) in CI.\n\nIn production, store secrets in a dedicated manager: HashiCorp Vault (Spring Cloud Vault), AWS Secrets Manager, Azure Key Vault or Google Secret Manager, or Kubernetes Secrets (base64-encoded, not encrypted by default, so enable encryption at rest and restrict RBAC, or sync from an external manager). Inject them as environment variables or mounted files, grant least privilege, and rotate them regularly. If a secret leaks, rotate it immediately; deleting the commit is not enough.",
      example: `# Kubernetes Secret (values provided by CI or an external secrets operator, not committed)
apiVersion: v1
kind: Secret
metadata:
  name: shop-db
type: Opaque
stringData:
  DB_PASSWORD: "set-by-pipeline"

# Deployment: expose it as an environment variable
env:
  - name: DB_PASSWORD
    valueFrom:
      secretKeyRef:
        name: shop-db
        key: DB_PASSWORD

# application.yml reads it
spring:
  datasource:
    password: \${DB_PASSWORD}`,
      interviewPoints: [
        'Never commit secrets; scan for them in CI',
        'Use Vault or a cloud secret manager',
        'K8s Secrets are only base64 by default',
        'Least privilege and rotation; rotate on leak',
      ],
    },
    {
      id: 'ci-cd',
      title: 'CI/CD basics',
      explanation: "Continuous Integration (CI) means every push is automatically built and tested: compile, run unit and integration tests (Testcontainers), static analysis and dependency vulnerability scans. Continuous Delivery/Deployment (CD) means passing builds are packaged (for example a Docker image tagged with the commit SHA) and deployed automatically to staging and, after checks or approval, to production.\n\nGood pipelines are fast, reproducible and safe: database migrations run with Flyway on startup or as a pipeline step, deployments use rolling, blue-green or canary strategies with health checks, and you can roll back quickly. Common tools are GitHub Actions, GitLab CI, Jenkins and Argo CD.",
      example: `# .github/workflows/ci.yml
name: ci
on:
  push:
    branches: [main]
  pull_request:
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-java@v4
        with:
          distribution: temurin
          java-version: "21"
          cache: maven
      - run: ./mvnw -B verify
      - run: ./mvnw -B spring-boot:build-image -Dspring-boot.build-image.imageName=ghcr.io/acme/shop:\${{ github.sha }}`,
      interviewPoints: [
        'CI: build + test on every change',
        'CD: automatic packaging and deployment',
        'Immutable images tagged by commit',
        'Rolling/blue-green/canary with health checks and fast rollback',
      ],
    },
  ],

  commonMistakes: [
    "Guessing at performance problems and adding caches or bigger servers before measuring with metrics, logs or `EXPLAIN ANALYZE`.",
    "Setting a huge HikariCP pool (for example 200) per instance, which overloads the database instead of speeding things up.",
    "Returning unpaginated lists from API endpoints, which works in testing and fails on real data volumes.",
    "Using `GenerationType.IDENTITY` and expecting `hibernate.jdbc.batch_size` to batch inserts.",
    "Setting `-Xmx` equal to the container memory limit, leaving no room for non-heap memory so the container is OOM-killed.",
    "Committing passwords or API keys in `application.yml` or `.env` files to Git.",
    "Exposing all Actuator endpoints (`include: \"*\"`) publicly, leaking environment details and heap dumps.",
    "Logging at DEBUG in production or logging sensitive data like tokens and passwords.",
  ],

  interviewTips: [
    "For 'the API is slow' questions, describe a process: reproduce, measure (metrics, traces, slow query logs), find the bottleneck, fix the biggest one, verify with metrics.",
    "Mention concrete numbers and settings, like HikariCP's default pool size of 10, `hibernate.jdbc.batch_size`, `MaxRAMPercentage` and `server.shutdown=graceful`.",
    "Say that the database is usually the bottleneck and explain indexes, N+1 fixes, pagination and batching before talking about JVM tuning.",
    "Show production maturity: health probes, metrics dashboards with alerts, structured logs, secrets in a vault, and an automated CI/CD pipeline with rollback.",
    "Always tie monitoring to action: which metric would alert you, and what you would do next.",
  ],

  interviewQuestions: [
    {
      id: 'spring-performance-q1',
      question: 'What is connection pooling and why is it important?',
      answer: "Creating a new database connection involves a network handshake, authentication and session setup, which can take tens of milliseconds. A connection pool keeps a set of open connections and lends one to each request, which returns it when done. Requests skip the expensive setup, and the pool limits how many connections the app opens, protecting the database.\n\nSpring Boot uses HikariCP by default with a maximum of 10 connections. If all are busy, requests wait up to `connection-timeout` and then fail, so pool exhaustion is a common symptom of slow queries or long transactions.",
      points: [
        'Reuses expensive connections',
        'Limits concurrent DB connections',
        'HikariCP is the Spring Boot default (max 10)',
        'Exhaustion usually signals slow queries or long transactions',
      ],
      difficulty: 'Beginner',
    },
    {
      id: 'spring-performance-q2',
      question: 'What is Spring Boot Actuator and which endpoints would you enable in production?',
      answer: "Actuator adds production-ready features to a Spring Boot app: health checks, metrics, info, logger configuration, thread dumps and more, exposed over HTTP or JMX.\n\nIn production I would typically expose `health` (with liveness and readiness probes for Kubernetes), `info`, `metrics` and `prometheus` for scraping, preferably on a separate management port that is not reachable from the internet. Sensitive endpoints like `env`, `heapdump`, `threaddump` and `loggers` should be disabled or protected by authentication.",
      example: `management:
  server:
    port: 8081
  endpoints:
    web:
      exposure:
        include: health,info,metrics,prometheus
  endpoint:
    health:
      probes:
        enabled: true`,
      points: [
        'health, info, metrics, prometheus are the usual set',
        'Liveness/readiness probes for Kubernetes',
        'Separate management port, protect sensitive endpoints',
      ],
      difficulty: 'Beginner',
    },
    {
      id: 'spring-performance-q3',
      question: 'How do you handle secrets like database passwords in a Spring Boot application?',
      answer: "Never hard-code or commit secrets to Git. The application reads them from its environment through placeholders like `\${DB_PASSWORD}`, so the same artifact runs everywhere. In production, secrets are stored in a secret manager such as HashiCorp Vault, AWS Secrets Manager, Azure Key Vault or Google Secret Manager, or in Kubernetes Secrets (with encryption at rest and restricted access), and injected as environment variables or mounted files.\n\nGive each service only the secrets it needs, rotate them regularly, and scan repositories for leaked secrets in CI. If a secret is ever committed, rotate it immediately; rewriting Git history is not enough because copies may exist.",
      points: [
        'Never commit secrets',
        'Environment variables or mounted files via placeholders',
        'Vault / cloud secret managers / K8s Secrets',
        'Least privilege, rotation, secret scanning',
      ],
      difficulty: 'Beginner',
    },
    {
      id: 'spring-performance-q4',
      question: 'An API endpoint is slow in production. How do you investigate?',
      answer: "First confirm and quantify it with metrics: p95/p99 latency, error rate and throughput for that endpoint in Grafana, and whether it is always slow or only under load. Then use distributed tracing (Micrometer Tracing with Zipkin or Tempo) or an APM tool to see where the time goes: database, a downstream HTTP call, or the application itself.\n\nIf it is the database, check the SQL: enable SQL logging to spot N+1 queries, run `EXPLAIN ANALYZE` on slow queries, add missing indexes, add pagination or projections. Check HikariCP metrics for pending connections, and JVM metrics for GC pauses or CPU saturation. Fix the biggest bottleneck first, deploy, and verify the improvement with the same metrics.",
      points: [
        'Measure with metrics and traces before changing anything',
        'Most often the DB: N+1, missing index, unbounded query',
        'Check pool saturation, downstream calls, GC and CPU',
        'Fix one thing at a time and verify',
      ],
      difficulty: 'Intermediate',
    },
    {
      id: 'spring-performance-q5',
      question: 'How do you choose indexes, and what is the cost of adding them?',
      answer: "Add indexes to columns that appear in frequent WHERE clauses, JOIN conditions and ORDER BY, and to foreign key columns, which PostgreSQL does not index automatically. For queries filtering on several columns, a composite index helps, with the most selective equality columns first and range or sort columns after, because of the leftmost prefix rule. Confirm with `EXPLAIN ANALYZE` that the planner uses it.\n\nIndexes are not free: every INSERT, UPDATE and DELETE must also update each index, they use disk and memory, and unused ones just add cost. On large live tables create them with `CREATE INDEX CONCURRENTLY` in a migration to avoid blocking writes.",
      example: `CREATE INDEX CONCURRENTLY idx_orders_customer_status_created
  ON orders (customer_id, status, created_at DESC);`,
      points: [
        'Index filter, join, sort columns and FKs',
        'Composite index column order matters',
        'Indexes slow writes and use storage',
        'Verify with EXPLAIN ANALYZE',
      ],
      difficulty: 'Intermediate',
    },
    {
      id: 'spring-performance-q6',
      question: 'How do you make bulk inserts fast with Spring Data JPA and Hibernate?',
      answer: "Enable JDBC batching with `spring.jpa.properties.hibernate.jdbc.batch_size` (for example 50) and set `hibernate.order_inserts` and `hibernate.order_updates` to true so statements for the same table are grouped. Use `GenerationType.SEQUENCE` with an `allocationSize` matching the batch size, because `IDENTITY` forces one INSERT at a time. For PostgreSQL, add `reWriteBatchedInserts=true` to the JDBC URL.\n\nIn the loop, call `flush()` and `clear()` on the `EntityManager` after each batch to keep the persistence context small. For very large imports, consider plain `JdbcTemplate.batchUpdate`, PostgreSQL `COPY`, or Spring Batch for chunked, restartable jobs.",
      example: `spring:
  jpa:
    properties:
      hibernate:
        jdbc:
          batch_size: 50
        order_inserts: true
        order_updates: true`,
      points: [
        'hibernate.jdbc.batch_size + order_inserts/updates',
        'SEQUENCE ids, not IDENTITY',
        'flush() and clear() per batch',
        'JdbcTemplate batch, COPY or Spring Batch for huge loads',
      ],
      difficulty: 'Intermediate',
    },
    {
      id: 'spring-performance-q7',
      question: 'How do Micrometer, Prometheus and Grafana work together?',
      answer: "Micrometer is the metrics facade built into Spring Boot. Your app and Spring itself record metrics such as HTTP request timers, JVM memory, GC pauses, HikariCP pool usage and custom business counters into a `MeterRegistry`. With `micrometer-registry-prometheus`, Actuator exposes them at `/actuator/prometheus` in Prometheus text format.\n\nPrometheus periodically scrapes (pulls) that endpoint from every instance and stores the values as time series. Grafana queries Prometheus with PromQL to draw dashboards and trigger alerts, for example when p99 latency or error rate rises. Alertmanager can route those alerts to Slack or on-call tools.",
      example: `# PromQL: p99 latency per endpoint over 5 minutes
histogram_quantile(0.99,
  sum(rate(http_server_requests_seconds_bucket[5m])) by (le, uri))`,
      points: [
        'Micrometer records, Prometheus scrapes and stores, Grafana visualises',
        'Pull model via /actuator/prometheus',
        'Golden signals: latency, traffic, errors, saturation',
      ],
      difficulty: 'Intermediate',
    },
    {
      id: 'spring-performance-q8',
      question: 'How would you configure HikariCP for production, and how do you size the pool?',
      answer: "Keep the pool small and usually fixed (`minimum-idle` equal to `maximum-pool-size`). A database can only execute a limited number of queries in parallel, roughly related to its CPU cores, so hundreds of connections just add contention. Start around 10 to 20 per instance and tune using metrics such as `hikaricp_connections_pending` and connection acquire time. Remember total connections equal pool size times instances, which must stay below the database `max_connections`.\n\nSet `connection-timeout` lower than the 30-second default (for example 3 to 5 seconds) to fail fast, `max-lifetime` a bit shorter than any database or firewall idle limit, and `leak-detection-threshold` to find code that holds connections too long. If the pool is exhausted, first look for slow queries and long transactions before increasing its size.",
      points: [
        'Small, fixed-size pools perform best',
        'Pool size x instances <= DB max_connections',
        'Tune timeouts: connection-timeout, max-lifetime, leak detection',
        'Exhaustion is usually a query/transaction problem',
      ],
      difficulty: 'Advanced',
    },
    {
      id: 'spring-performance-q9',
      question: 'How do you configure JVM memory and garbage collection for a Spring Boot service in a container?',
      answer: "Modern JVMs are container-aware, so instead of a fixed `-Xmx` you can set `-XX:MaxRAMPercentage=75` (and often `-XX:InitialRAMPercentage` to the same value) so the heap is sized from the container memory limit, leaving about a quarter for metaspace, thread stacks, direct buffers, code cache and the OS. Setting `-Xmx` equal to the container limit gets the container OOM-killed. Add `-XX:+HeapDumpOnOutOfMemoryError` and `-XX:+ExitOnOutOfMemoryError` so failures are diagnosable and the orchestrator restarts a broken instance.\n\nFor GC, G1 is the default and fits most services. Choose ZGC (generational in Java 21+) when you need very low pause times, or Parallel GC for throughput-oriented batch jobs. Note that with fewer than 2 CPUs and under about 1792 MB of memory the JVM picks Serial GC automatically. Decide based on GC logs and `jvm_gc_pause` metrics, not guesses.",
      example: `ENV JAVA_TOOL_OPTIONS="-XX:MaxRAMPercentage=75 -XX:InitialRAMPercentage=75 -XX:+UseG1GC -XX:+HeapDumpOnOutOfMemoryError -XX:+ExitOnOutOfMemoryError"`,
      points: [
        'MaxRAMPercentage instead of fixed -Xmx in containers',
        'Leave room for non-heap memory',
        'G1 default; ZGC for low latency; Parallel for throughput',
        'Heap dumps and GC metrics for diagnosis',
      ],
      difficulty: 'Advanced',
    },
    {
      id: 'spring-performance-q10',
      question: 'How do you achieve zero-downtime deployments for a Spring Boot service?',
      answer: "Run several instances behind a load balancer and deploy with a rolling, blue-green or canary strategy, so some instances always serve traffic. New instances only receive traffic once their readiness probe (`/actuator/health/readiness`) passes. Old instances shut down gracefully: with `server.shutdown=graceful` (default since Boot 3.4) they stop accepting new requests and finish in-flight ones within `spring.lifecycle.timeout-per-shutdown-phase`, while Kubernetes' `terminationGracePeriodSeconds` gives them enough time.\n\nDatabase changes must be backward compatible, because old and new versions run at the same time: use the expand-and-contract pattern (add a nullable column first, deploy code that uses it, remove the old column in a later release) with Flyway or Liquibase. Finally, monitor error rates during rollout and be able to roll back quickly.",
      points: [
        'Rolling/blue-green/canary with multiple instances',
        'Readiness probes gate traffic',
        'Graceful shutdown drains in-flight requests',
        'Backward-compatible migrations (expand and contract)',
      ],
      difficulty: 'Advanced',
    },
  ],
}

export default topic
