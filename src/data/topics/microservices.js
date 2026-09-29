const topic = {
  id: 'microservices',
  category: 'microservices',
  title: 'Microservices',
  description: 'Designing, connecting and hardening microservices with Spring Cloud: gateways, discovery, config, resilience, tracing, sagas and idempotency.',
  difficulty: 'Advanced',
  overview: "A microservice architecture splits one big application into several small services, each owning one business capability (orders, payments, inventory) and its own database, and each deployed independently. Compare it with a restaurant: a monolith is one cook doing everything, while microservices are a kitchen with separate stations for grill, salad and desserts. Each station can be staffed and improved on its own, but they now need to communicate well, and one slow station can hold up every order.\n\nThat is the key trade-off. Microservices give independent deployment, independent scaling and team autonomy, but they turn in-process method calls into network calls that can be slow or fail. You suddenly need service discovery, an API gateway, centralized configuration, timeouts, retries, circuit breakers, distributed tracing and ways to keep data consistent without a single database transaction.\n\nThe Spring ecosystem covers these needs: Spring Cloud Gateway, Eureka, Spring Cloud Config, Resilience4j, RestClient and OpenFeign, Micrometer Tracing and Spring Kafka. Interviewers want to see that you understand both the patterns and the reasons behind them, and that you know when a monolith is actually the better choice.",

  subtopics: [
    {
      id: 'monolith',
      title: 'Monolith',
      explanation: "A monolith is a single deployable application that contains all features and usually one shared database. It is simple to develop, test, deploy and debug, and calls between modules are fast in-process method calls with real ACID transactions.\n\nProblems appear as the system and team grow: every small change requires redeploying everything, one memory leak can take the whole app down, you can only scale the entire app, and many teams working in one codebase slow each other down. A well-structured 'modular monolith' with clear module boundaries is often the best starting point.",
      interviewPoints: [
        'Single deployable unit, usually one database.',
        'Simple and fast to start; strong consistency via local transactions.',
        'Hard to scale teams and parts independently as it grows.',
        'A modular monolith is a valid, often recommended, first step.',
      ],
    },
    {
      id: 'microservices-intro',
      title: 'Microservices',
      explanation: "Microservices are small, independently deployable services, each responsible for one business capability and owning its data. They communicate over the network using HTTP/REST, gRPC or messaging.\n\nBenefits: independent deployment and scaling, fault isolation, freedom to choose technology per service and small autonomous teams. Costs: network latency and failures, distributed data consistency, harder debugging, more infrastructure (gateway, discovery, monitoring) and operational overhead. Microservices solve organisational scaling problems; they are not automatically better.",
      interviewPoints: [
        'Each service owns its own database (database per service).',
        'Independently deployable and scalable.',
        'Trade complexity of distribution for team and deployment autonomy.',
      ],
    },
    {
      id: 'service-decomposition',
      title: 'Service decomposition',
      explanation: "The hardest part is deciding where to split. Split by business capability or by bounded context from Domain-Driven Design (Order, Payment, Catalog, Shipping), not by technical layer (a 'database service' or 'validation service' is a bad split).\n\nGood services have high cohesion (things that change together live together) and loose coupling (they can be changed and deployed without coordinating with others). If two services always have to be deployed together or constantly call each other synchronously, you have built a 'distributed monolith'. The Strangler Fig pattern migrates a monolith gradually by routing one feature at a time to a new service.",
      interviewPoints: [
        'Split by business capability / bounded context.',
        'High cohesion, loose coupling, own data.',
        'Avoid the distributed monolith (services that must change together).',
        'Strangler Fig pattern for incremental migration.',
      ],
    },
    {
      id: 'rest-communication',
      title: 'REST communication & inter-service clients',
      explanation: "Synchronous communication means the caller waits for the answer, typically over HTTP/REST. In Spring Boot 3 you have three main options. `RestClient` (Spring 6.1+) is the modern, fluent, blocking client and the replacement for `RestTemplate`. `WebClient` is the reactive, non-blocking client from WebFlux, useful for many parallel calls or reactive apps. OpenFeign (Spring Cloud) lets you declare an interface and generates the HTTP client; it is now in maintenance mode, and Spring's own HTTP interface clients (`@HttpExchange`) offer the same declarative style.\n\nAdding `@LoadBalanced` to a `RestClient.Builder` lets you call services by their logical name (for example `http://inventory-service`), resolved through service discovery.",
      example: `@Configuration
public class ClientConfig {

    @Bean
    @LoadBalanced
    RestClient.Builder restClientBuilder() {
        return RestClient.builder();
    }
}

@Service
public class InventoryClient {

    private final RestClient restClient;

    public InventoryClient(RestClient.Builder builder) {
        this.restClient = builder.baseUrl("http://inventory-service").build();
    }

    public StockDto getStock(String sku) {
        return restClient.get()
                .uri("/api/stock/{sku}", sku)
                .retrieve()
                .body(StockDto.class);
    }
}

// OpenFeign alternative (needs @EnableFeignClients on a config class)
@FeignClient(name = "inventory-service")
public interface InventoryFeignClient {
    @GetMapping("/api/stock/{sku}")
    StockDto getStock(@PathVariable String sku);
}`,
      interviewPoints: [
        'RestClient = modern blocking client; RestTemplate is in maintenance mode.',
        'WebClient = reactive, non-blocking.',
        'OpenFeign / @HttpExchange = declarative interface clients.',
        '@LoadBalanced resolves service names via discovery.',
      ],
    },
    {
      id: 'sync-vs-async',
      title: 'Synchronous vs asynchronous communication',
      explanation: "Synchronous (REST, gRPC): the caller waits for a response. It is simple and good for queries where you need an answer now, but it couples availability: if Inventory is down, Order cannot complete, and long chains of calls add up latency.\n\nAsynchronous (Kafka, RabbitMQ): the sender publishes a message or event and moves on; consumers process it later. This decouples services in time, absorbs traffic spikes and survives temporary outages, at the cost of eventual consistency and more complex debugging. A common rule: use sync for reads that need an immediate answer, async for commands and events that can happen in the background.",
      interviewPoints: [
        'Sync = request/response, temporal coupling.',
        'Async = messages/events, loose coupling, eventual consistency.',
        'Long synchronous call chains multiply latency and failure risk.',
      ],
    },
    {
      id: 'api-gateway',
      title: 'API Gateway (Spring Cloud Gateway)',
      explanation: "An API gateway is the single entry point for all clients. It routes each request to the right service, and handles cross-cutting concerns in one place: authentication (validating JWTs), rate limiting, CORS, request logging, header manipulation and sometimes response aggregation.\n\nSpring Cloud Gateway is built on Spring WebFlux (non-blocking). Routes are defined with predicates (which requests match, for example a path) and filters (what to do, for example strip a prefix). The `lb://` scheme load-balances across instances found in service discovery.",
      example: `# application.yml of the gateway
# (Spring Cloud 2025.x moves these under spring.cloud.gateway.server.webflux)
spring:
  cloud:
    gateway:
      routes:
        - id: order-service
          uri: lb://order-service
          predicates:
            - Path=/api/orders/**
        - id: inventory-service
          uri: lb://inventory-service
          predicates:
            - Path=/api/stock/**
          filters:
            - StripPrefix=0
            - AddRequestHeader=X-Source, gateway`,
      interviewPoints: [
        'Single entry point: routing plus cross-cutting concerns.',
        'Routes = id + uri + predicates + filters.',
        'lb://service-name uses discovery and load balancing.',
        'Keep business logic out of the gateway.',
      ],
    },
    {
      id: 'service-discovery',
      title: 'Service discovery (Eureka)',
      explanation: "In the cloud, service instances start, stop and change IP addresses constantly, so hard-coding URLs does not work. With service discovery, each instance registers itself in a registry at startup and sends heartbeats; clients ask the registry for healthy instances of `inventory-service`.\n\nNetflix Eureka is the classic Spring Cloud registry: a Eureka Server app with `@EnableEurekaServer`, and clients that register automatically when `spring-cloud-starter-netflix-eureka-client` is on the classpath. On Kubernetes you usually do not need Eureka, because Kubernetes Services and DNS already provide discovery.",
      example: `// Eureka server
@SpringBootApplication
@EnableEurekaServer
public class DiscoveryServerApplication {
    public static void main(String[] args) {
        SpringApplication.run(DiscoveryServerApplication.class, args);
    }
}

# application.yml of each client service
spring:
  application:
    name: inventory-service
eureka:
  client:
    service-url:
      defaultZone: http://localhost:8761/eureka`,
      interviewPoints: [
        'Services register themselves and send heartbeats.',
        'Clients look up instances by logical name.',
        'Client-side discovery (Eureka) vs server-side (Kubernetes Service, load balancer).',
        'Kubernetes DNS often replaces Eureka.',
      ],
    },
    {
      id: 'config-server',
      title: 'Configuration server',
      explanation: "With dozens of services and several environments, copying properties into every jar becomes unmanageable. Spring Cloud Config Server serves configuration from a central place (usually a Git repository), per application and per profile, for example `order-service-prod.yml`.\n\nServices fetch their configuration at startup with `spring.config.import`. Changes can be picked up with `/actuator/refresh` on beans annotated with `@RefreshScope`. Secrets should come from a vault (HashiCorp Vault, cloud secret managers) rather than plain Git. On Kubernetes, ConfigMaps and Secrets are a common alternative.",
      example: `// Config server
@SpringBootApplication
@EnableConfigServer
public class ConfigServerApplication { /* main method */ }

# config server application.yml
server:
  port: 8888
spring:
  cloud:
    config:
      server:
        git:
          uri: https://github.com/acme/config-repo

# client (order-service) application.yml
spring:
  application:
    name: order-service
  config:
    import: "configserver:http://localhost:8888"`,
      interviewPoints: [
        'Centralized, versioned (Git) configuration per app and profile.',
        'Clients load it with spring.config.import.',
        '@RefreshScope + /actuator/refresh for runtime updates.',
        'Keep secrets in a vault, not plain text.',
      ],
    },
    {
      id: 'timeouts',
      title: 'Timeouts',
      explanation: "Every remote call must have a timeout. Without one, a slow downstream service keeps your threads waiting, the thread pool fills up and your service stops responding too; this is how failures cascade.\n\nSet a connect timeout (how long to establish the connection, typically 1 to 2 seconds) and a read timeout (how long to wait for the response). Choose values based on the downstream service's normal latency (for example its p99), and make the caller's total time budget larger than the sum of its downstream calls.",
      example: `@Bean
RestClient inventoryRestClient(RestClient.Builder builder) {
    HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(2))
            .build();
    JdkClientHttpRequestFactory factory = new JdkClientHttpRequestFactory(httpClient);
    factory.setReadTimeout(Duration.ofSeconds(3));

    return builder
            .baseUrl("http://inventory-service")
            .requestFactory(factory)
            .build();
}`,
      interviewPoints: [
        'No timeout = threads blocked forever = cascading failure.',
        'Connect timeout vs read timeout.',
        'Base values on real latency percentiles.',
      ],
    },
    {
      id: 'retries',
      title: 'Retries',
      explanation: "Many failures are transient: a brief network glitch or a restarting instance. Retrying a few times can turn them into successes. Retry only on transient errors (timeouts, 503) and never on client errors like 400.\n\nUse exponential backoff with jitter (wait 200 ms, 400 ms, 800 ms, plus some randomness) so thousands of clients do not retry in sync and overwhelm a recovering service (a 'retry storm'). Only retry operations that are idempotent, or make them idempotent, otherwise a retried payment might charge twice.",
      example: `# application.yml (Resilience4j)
resilience4j:
  retry:
    instances:
      inventory:
        max-attempts: 3
        wait-duration: 200ms
        enable-exponential-backoff: true
        exponential-backoff-multiplier: 2
        retry-exceptions:
          - java.io.IOException
          - org.springframework.web.client.ResourceAccessException`,
      interviewPoints: [
        'Retry only transient failures, only idempotent operations.',
        'Exponential backoff with jitter avoids retry storms.',
        'Limit attempts; combine with timeouts and circuit breakers.',
      ],
    },
    {
      id: 'circuit-breaker-resilience4j',
      title: 'Circuit breaker & Resilience4j',
      explanation: "A circuit breaker stops calling a service that keeps failing, like an electrical breaker. In the CLOSED state calls go through and failures are counted. When the failure rate crosses a threshold it moves to OPEN: calls fail immediately (or go to a fallback) without touching the broken service, giving it time to recover. After a wait it goes HALF_OPEN and lets a few test calls through; if they succeed it closes again, otherwise it reopens.\n\nResilience4j is the standard fault-tolerance library for Spring Boot 3 (Netflix Hystrix is dead). It provides CircuitBreaker, Retry, RateLimiter, Bulkhead and TimeLimiter, usable through annotations with `resilience4j-spring-boot3` or through Spring Cloud CircuitBreaker. Fallbacks should return something sensible, like cached data or a default, rather than hiding errors.",
      example: `@Service
public class InventoryService {

    private final InventoryClient client;

    public InventoryService(InventoryClient client) {
        this.client = client;
    }

    @CircuitBreaker(name = "inventory", fallbackMethod = "stockFallback")
    @Retry(name = "inventory")
    public StockDto getStock(String sku) {
        return client.getStock(sku);
    }

    // same parameters + the exception
    private StockDto stockFallback(String sku, Throwable ex) {
        return new StockDto(sku, 0, "UNKNOWN");
    }
}

# application.yml
resilience4j:
  circuitbreaker:
    instances:
      inventory:
        sliding-window-size: 20
        failure-rate-threshold: 50
        wait-duration-in-open-state: 10s
        permitted-number-of-calls-in-half-open-state: 3`,
      interviewPoints: [
        'States: CLOSED, OPEN, HALF_OPEN.',
        'Fails fast to protect both caller and callee.',
        'Resilience4j replaced Hystrix; modules: CircuitBreaker, Retry, RateLimiter, Bulkhead, TimeLimiter.',
        'Fallbacks must have the same signature plus a Throwable parameter.',
      ],
    },
    {
      id: 'load-balancing',
      title: 'Load balancing',
      explanation: "Load balancing spreads requests across multiple instances of a service. Server-side load balancing uses a separate component (NGINX, a cloud load balancer, a Kubernetes Service) in front of the instances. Client-side load balancing lets the caller pick an instance itself from the list provided by discovery.\n\nSpring Cloud LoadBalancer is the client-side implementation (it replaced Netflix Ribbon). It is activated by `@LoadBalanced` on a `RestClient.Builder` or `WebClient.Builder`, by Feign clients and by `lb://` URIs in the gateway, and uses round-robin by default. Stateless services make load balancing easy because any instance can serve any request.",
      interviewPoints: [
        'Server-side (NGINX, cloud LB, K8s Service) vs client-side (Spring Cloud LoadBalancer).',
        'Spring Cloud LoadBalancer replaced Ribbon; default round-robin.',
        'Stateless services scale horizontally behind a load balancer.',
      ],
    },
    {
      id: 'distributed-tracing',
      title: 'Distributed tracing (Micrometer Tracing, Zipkin)',
      explanation: "One user request may pass through a gateway and five services. Distributed tracing gives the whole journey one trace id, and each hop a span id with timing. A tracing UI like Zipkin or Jaeger shows the full tree of calls, so you can see which service was slow or failed.\n\nIn Spring Boot 3, Spring Cloud Sleuth is replaced by Micrometer Tracing. Add Actuator, a tracer bridge (Brave or OpenTelemetry) and a reporter. Spring automatically propagates the trace context in HTTP headers (W3C `traceparent`) for RestClient, WebClient and Kafka, and adds `traceId` and `spanId` to your log lines.",
      example: `<!-- pom.xml -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-actuator</artifactId>
</dependency>
<dependency>
    <groupId>io.micrometer</groupId>
    <artifactId>micrometer-tracing-bridge-brave</artifactId>
</dependency>
<dependency>
    <groupId>io.zipkin.reporter2</groupId>
    <artifactId>zipkin-reporter-brave</artifactId>
</dependency>

# application.yml
management:
  tracing:
    sampling:
      probability: 1.0      # sample everything in dev; lower it in production
  zipkin:
    tracing:
      endpoint: http://localhost:9411/api/v2/spans`,
      interviewPoints: [
        'Trace = whole request journey; span = one operation within it.',
        'Micrometer Tracing replaced Spring Cloud Sleuth in Boot 3.',
        'Context propagated via headers such as W3C traceparent.',
        'Sampling controls how many traces are recorded.',
      ],
    },
    {
      id: 'correlation-ids',
      title: 'Correlation IDs',
      explanation: "A correlation id is a unique id attached to a request at the edge (the gateway or first service) and passed along in a header such as `X-Correlation-Id` to every downstream call and message. Every log line includes it, so you can search all logs for one id and see the full story of a single request.\n\nWith Micrometer Tracing the trace id already plays this role and is added to logs automatically. When you need your own id (for example to return it to clients for support tickets), put it in the SLF4J MDC in a filter and forward it on outgoing calls.",
      example: `@Component
public class CorrelationIdFilter extends OncePerRequestFilter {

    private static final String HEADER = "X-Correlation-Id";

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                    FilterChain chain) throws ServletException, IOException {
        String id = Optional.ofNullable(request.getHeader(HEADER))
                .orElse(UUID.randomUUID().toString());
        MDC.put("correlationId", id);
        response.setHeader(HEADER, id);
        try {
            chain.doFilter(request, response);
        } finally {
            MDC.remove("correlationId");   // threads are reused
        }
    }
}`,
      interviewPoints: [
        'One id per request, passed through every hop.',
        'Stored in MDC so every log line includes it.',
        'Always clear the MDC because threads are pooled.',
        'Trace ids from Micrometer Tracing can serve as correlation ids.',
      ],
    },
    {
      id: 'centralized-logging',
      title: 'Centralized logging',
      explanation: "With many services and instances, logging in to each machine to read files is impossible. Instead every service writes logs to standard output, ideally as structured JSON, and a collector ships them to a central store where you can search and build dashboards: the ELK/EFK stack (Elasticsearch, Logstash or Fluentd, Kibana) or Grafana Loki.\n\nSpring Boot 3.4+ supports structured logging out of the box with `logging.structured.format.console=ecs` (or `logstash`). Include the service name, trace id and correlation id in every log entry. Logs, metrics and traces together are called the three pillars of observability.",
      example: `# application.yml (Spring Boot 3.4+)
logging:
  structured:
    format:
      console: ecs
spring:
  application:
    name: order-service`,
      interviewPoints: [
        'Log to stdout, ship to a central store (ELK, Loki).',
        'Structured JSON logs are searchable.',
        'Include service name and trace/correlation ids.',
        'Logs + metrics + traces = observability.',
      ],
    },
    {
      id: 'event-driven',
      title: 'Event-driven architecture (brief)',
      explanation: "In an event-driven architecture services publish events about things that happened, like `OrderPlaced`, to a broker such as Kafka. Other services subscribe and react: Inventory reserves stock, Notification sends an email. The publisher does not know or wait for its consumers.\n\nThis gives loose coupling and easy extension (add a new consumer without changing the publisher), but the system becomes eventually consistent and flows are harder to trace. It is the foundation of choreography-based sagas.",
      interviewPoints: [
        'Events describe facts in the past tense: OrderPlaced, PaymentFailed.',
        'Publishers do not know their consumers.',
        'Eventual consistency; need idempotent consumers.',
      ],
    },
    {
      id: 'saga-pattern',
      title: 'Saga pattern (choreography vs orchestration)',
      explanation: "With a database per service you cannot wrap 'create order, charge payment, reserve stock' in one ACID transaction, and two-phase commit is slow and fragile. A saga splits the business transaction into a sequence of local transactions, one per service. If a step fails, previously completed steps are undone with compensating actions (refund payment, cancel order).\n\nChoreography: there is no central coordinator; each service listens for events and publishes the next one (OrderCreated -> PaymentCompleted -> StockReserved). It is simple for a few steps but the flow is spread across services. Orchestration: a central orchestrator (a service or a workflow engine like Temporal or Camunda) tells each service what to do and handles compensation. It is easier to understand and monitor for complex flows, at the cost of a central component.",
      example: `// Orchestration sketch
public void placeOrder(OrderRequest request) {
    Order order = orderService.createPending(request);
    try {
        paymentClient.charge(order.getId(), order.getTotal());
    } catch (PaymentException e) {
        orderService.cancel(order.getId());                  // compensate
        return;
    }
    try {
        inventoryClient.reserve(order.getId(), order.getItems());
    } catch (OutOfStockException e) {
        paymentClient.refund(order.getId());                 // compensate
        orderService.cancel(order.getId());
        return;
    }
    orderService.confirm(order.getId());
}`,
      interviewPoints: [
        'Saga = sequence of local transactions with compensating actions.',
        'Choreography: events, no coordinator, decentralised.',
        'Orchestration: central coordinator, easier to follow.',
        'Compensations must be idempotent; the result is eventual consistency.',
      ],
    },
    {
      id: 'idempotency',
      title: 'Idempotency',
      explanation: "An operation is idempotent if doing it several times has the same effect as doing it once. In distributed systems retries and duplicate messages are normal, so every write that can be retried must be idempotent, or a retried 'create payment' will charge the customer twice.\n\nGET, PUT and DELETE are idempotent by definition; POST is not. Make POST safe with an `Idempotency-Key` header: the client generates a unique key per operation, the server stores the key with the result (with a unique constraint), and if the same key arrives again it returns the stored result instead of repeating the work. Message consumers do the same with the message or event id.",
      example: `@PostMapping("/api/payments")
public ResponseEntity<PaymentDto> pay(@RequestHeader("Idempotency-Key") String key,
                                      @RequestBody PaymentRequest request) {
    return idempotencyRepository.findByKey(key)
            .map(saved -> ResponseEntity.ok(saved.getResponse()))
            .orElseGet(() -> {
                PaymentDto result = paymentService.charge(request);
                // unique constraint on key protects against concurrent duplicates
                idempotencyRepository.save(new IdempotencyRecord(key, result));
                return ResponseEntity.status(HttpStatus.CREATED).body(result);
            });
}`,
      interviewPoints: [
        'Same request many times = same effect as once.',
        'Required because of retries and at-least-once delivery.',
        'Idempotency-Key header or message id stored with a unique constraint.',
        'GET/PUT/DELETE are idempotent; POST is not by default.',
      ],
    },
    {
      id: 'rate-limiting',
      title: 'Rate limiting',
      explanation: "Rate limiting restricts how many requests a client can make in a time window (for example 100 per minute per API key). It protects services from overload, abuse and runaway clients, and enforces fair usage. Exceeding the limit returns 429 Too Many Requests, often with a `Retry-After` header.\n\nCommon algorithms are token bucket and sliding window. It is usually applied at the API gateway: Spring Cloud Gateway has a `RequestRateLimiter` filter backed by Redis so limits are shared across gateway instances. Inside a service, Resilience4j's `@RateLimiter` or Bucket4j can protect specific operations.",
      example: `spring:
  cloud:
    gateway:
      routes:
        - id: order-service
          uri: lb://order-service
          predicates:
            - Path=/api/orders/**
          filters:
            - name: RequestRateLimiter
              args:
                redis-rate-limiter.replenishRate: 10     # tokens per second
                redis-rate-limiter.burstCapacity: 20
                key-resolver: "#{@userKeyResolver}"

// KeyResolver bean: limit per user
@Bean
KeyResolver userKeyResolver() {
    return exchange -> Mono.justOrEmpty(exchange.getRequest().getHeaders().getFirst("X-User-Id"))
            .defaultIfEmpty("anonymous");
}`,
      interviewPoints: [
        'Limit requests per client per time window; respond 429.',
        'Token bucket allows short bursts up to the bucket size.',
        'Apply at the gateway with Redis for a shared limit.',
      ],
    },
  ],

  commonMistakes: [
    'Starting a small new project with many microservices before the domain boundaries are understood, instead of a modular monolith.',
    'Sharing one database between several services, which couples them tightly and defeats independent deployment.',
    'Making remote calls without timeouts, so one slow service exhausts threads and causes cascading failures.',
    'Retrying non-idempotent operations such as payments, which creates duplicates.',
    'Building long chains of synchronous calls where one request fans out through five services, multiplying latency and failure risk.',
    'Not propagating trace or correlation ids, making production issues nearly impossible to debug.',
    'Using a circuit breaker fallback that silently returns fake success, hiding real outages from users and monitoring.',
  ],

  interviewTips: [
    'Always discuss trade-offs: say when a monolith is better, and that microservices mainly solve team and deployment scaling problems.',
    'Name the concrete Spring tools for each concern: Spring Cloud Gateway, Eureka, Config Server, Resilience4j, RestClient/OpenFeign, Micrometer Tracing.',
    'For resilience questions, combine the patterns: timeout, then retry with backoff, then circuit breaker with fallback, plus idempotency.',
    'For data consistency questions, explain database per service, why distributed transactions are avoided, and how sagas with compensations work.',
    'Use a running example like an e-commerce system (order, payment, inventory, notification) to make answers concrete.',
  ],

  interviewQuestions: [
    {
      id: 'microservices-q1',
      question: 'What is the difference between a monolith and microservices?',
      answer: "A monolith is a single application deployed as one unit, usually with one database. It is simple to build, test and deploy, and modules call each other in-process with local ACID transactions.\n\nMicroservices split the system into small services organised around business capabilities, each with its own database, deployed and scaled independently and communicating over the network. They offer team autonomy, independent deployments, targeted scaling and fault isolation, but add network failures, eventual consistency, and much more operational complexity. Many teams start with a modular monolith and extract services when there is a clear need.",
      points: [
        'Monolith: one deployable, shared database, simple.',
        'Microservices: independent services, database per service.',
        'Microservices trade simplicity for autonomy and scalability.',
      ],
      difficulty: 'Beginner',
    },
    {
      id: 'microservices-q2',
      question: 'What is an API gateway and why do you need one?',
      answer: "An API gateway is the single entry point that clients use to reach a microservice system. It routes requests to the correct service, so clients do not need to know every service's address, and it centralises cross-cutting concerns like authentication and JWT validation, rate limiting, CORS, logging and request or response transformation.\n\nIn Spring, Spring Cloud Gateway is the standard choice. Routes are defined with predicates (for example a path) and filters, and `lb://service-name` URIs use service discovery and load balancing.",
      points: [
        'Single entry point and routing.',
        'Central place for auth, rate limiting, CORS, logging.',
        'Spring Cloud Gateway uses predicates and filters.',
      ],
      difficulty: 'Beginner',
    },
    {
      id: 'microservices-q3',
      question: 'What is service discovery and how does Eureka work?',
      answer: "Service discovery lets services find each other without hard-coded addresses, which is essential because instances are created and destroyed dynamically. Each service instance registers its name and address with a registry at startup and sends regular heartbeats; instances that stop sending heartbeats are removed.\n\nWith Eureka you run a Eureka Server (`@EnableEurekaServer`) and add the Eureka client starter to each service. Callers use the logical name, for example `http://inventory-service`, and Spring Cloud LoadBalancer picks a healthy instance from the registry. On Kubernetes, built-in Services and DNS usually replace Eureka.",
      points: [
        'Register on startup, heartbeat, deregister.',
        'Callers look up by logical service name.',
        'Works with client-side load balancing.',
        'Kubernetes DNS is an alternative.',
      ],
      difficulty: 'Beginner',
    },
    {
      id: 'microservices-q4',
      question: 'Compare synchronous and asynchronous communication between microservices.',
      answer: "Synchronous communication (REST with RestClient, WebClient or OpenFeign, or gRPC) means the caller sends a request and waits for the response. It is easy to understand and suitable when you need an answer immediately, but it couples services in time: if the callee is slow or down, the caller suffers too.\n\nAsynchronous communication (Kafka, RabbitMQ) means the sender publishes a message and continues. Consumers process it when they can. This decouples availability, handles load spikes and allows many consumers, but results are eventually consistent, and you must handle duplicate messages, ordering and harder debugging. Typically reads that need data now are synchronous, while commands and domain events are asynchronous.",
      points: [
        'Sync: simple, immediate answer, temporal coupling.',
        'Async: decoupled, resilient, eventually consistent.',
        'Choose per interaction, often both in one system.',
      ],
      difficulty: 'Intermediate',
    },
    {
      id: 'microservices-q5',
      question: 'How does a circuit breaker work, and how do you use Resilience4j in Spring Boot?',
      answer: "A circuit breaker wraps calls to a remote service and tracks failures. In CLOSED state calls pass through. When the failure rate in a sliding window exceeds a threshold, it switches to OPEN and immediately rejects calls (or runs a fallback) for a wait duration, so the failing service is not hammered and the caller does not waste threads. It then moves to HALF_OPEN, allows a few trial calls, and closes again if they succeed or reopens if they fail.\n\nIn Spring Boot 3 you add `resilience4j-spring-boot3` (plus AOP), annotate a method with `@CircuitBreaker(name = \"inventory\", fallbackMethod = \"fallback\")` and configure thresholds under `resilience4j.circuitbreaker.instances.inventory` in application.yml. The fallback has the same parameters plus a `Throwable`.",
      example: `@CircuitBreaker(name = "inventory", fallbackMethod = "fallback")
public StockDto getStock(String sku) {
    return inventoryClient.getStock(sku);
}

private StockDto fallback(String sku, Throwable ex) {
    return new StockDto(sku, 0, "UNKNOWN");
}`,
      points: [
        'CLOSED, OPEN, HALF_OPEN states.',
        'Fail fast and let the downstream service recover.',
        'Configured per instance name in application.yml.',
        'Fallback signature: same params + Throwable.',
      ],
      difficulty: 'Intermediate',
    },
    {
      id: 'microservices-q6',
      question: 'Why are timeouts and retries important, and what are the risks of retries?',
      answer: "Without timeouts, a slow downstream service holds the caller's threads indefinitely; when the thread pool is exhausted the caller stops responding too, and failures cascade through the system. Every remote call should have a connect timeout and a read timeout based on normal latency.\n\nRetries recover from transient failures such as network glitches or a restarting instance. The risks: retrying non-idempotent operations can duplicate side effects (double charges), and many clients retrying at once can overwhelm a struggling service (retry storm). So retry only transient errors, limit attempts, use exponential backoff with jitter, make operations idempotent, and put a circuit breaker around the retries.",
      points: [
        'Timeouts prevent thread exhaustion and cascading failure.',
        'Retries only for transient errors and idempotent operations.',
        'Exponential backoff with jitter; limit attempts.',
        'Combine with a circuit breaker.',
      ],
      difficulty: 'Intermediate',
    },
    {
      id: 'microservices-q7',
      question: 'What is distributed tracing and how do you set it up in Spring Boot 3?',
      answer: "Distributed tracing follows a single request across all services it touches. The request gets a trace id, and each operation (an HTTP call, a database query, a Kafka message) gets a span with a start time and duration. Tracing tools like Zipkin or Jaeger visualise the tree of spans, showing where time was spent or where an error happened.\n\nIn Spring Boot 3, Micrometer Tracing replaced Spring Cloud Sleuth. You add Actuator, a bridge (`micrometer-tracing-bridge-brave` or `-otel`) and a reporter/exporter (for example `zipkin-reporter-brave`), then set `management.tracing.sampling.probability`. Spring automatically propagates the trace context through RestClient, WebClient and Kafka headers and adds the trace id and span id to log lines.",
      points: [
        'Trace id per request, span per operation.',
        'Micrometer Tracing with Brave or OpenTelemetry bridge.',
        'Export to Zipkin, Jaeger or an OTLP backend.',
        'Trace ids appear in logs for correlation.',
      ],
      difficulty: 'Intermediate',
    },
    {
      id: 'microservices-q8',
      question: 'What is Spring Cloud Config Server and why would you use it?',
      answer: "Spring Cloud Config Server is a service that provides externalised configuration to all other services from a central source, typically a Git repository. Files are organised by application name and profile, for example `order-service.yml` and `order-service-prod.yml`, so each environment gets the right values.\n\nClients import the configuration at startup with `spring.config.import=configserver:http://config:8888`. Benefits are one place to change settings, version history and review through Git, and consistency across environments. Beans annotated with `@RefreshScope` can reload values via `/actuator/refresh`. Secrets should come from a secure store such as Vault, not plain Git; on Kubernetes, ConfigMaps and Secrets are a common alternative.",
      points: [
        'Central, versioned configuration per app and profile.',
        'Clients use spring.config.import.',
        'Runtime refresh with @RefreshScope.',
        'Secrets belong in a vault.',
      ],
      difficulty: 'Intermediate',
    },
    {
      id: 'microservices-q9',
      question: 'Explain the Saga pattern. What is the difference between choreography and orchestration?',
      answer: "In microservices each service owns its database, so a business operation spanning services (create order, charge payment, reserve stock) cannot use a single ACID transaction, and distributed two-phase commit is slow and fragile. A saga models the operation as a series of local transactions, one per service. If a later step fails, the saga runs compensating transactions to undo the earlier steps, such as refunding the payment and cancelling the order.\n\nIn choreography there is no coordinator: each service reacts to events and emits new ones (OrderCreated triggers payment, PaymentCompleted triggers stock reservation). It is loosely coupled but the overall flow is implicit and hard to follow as it grows. In orchestration a central orchestrator sends commands to each service and decides the next step or compensation. It makes the flow explicit and easier to monitor, at the cost of a central component. Either way the system is eventually consistent and every step and compensation must be idempotent.",
      points: [
        'Saga = local transactions + compensating actions.',
        'Replaces distributed transactions / 2PC.',
        'Choreography: event-driven, decentralised.',
        'Orchestration: central coordinator, explicit flow.',
        'Steps must be idempotent; consistency is eventual.',
      ],
      difficulty: 'Advanced',
    },
    {
      id: 'microservices-q10',
      question: 'What is idempotency and how do you implement it for a payment API?',
      answer: "An idempotent operation produces the same result no matter how many times it is executed. In distributed systems clients retry after timeouts and brokers may deliver messages more than once, so without idempotency a single payment could be charged twice.\n\nFor a payment POST endpoint, require an `Idempotency-Key` header generated by the client for each logical operation. The server stores the key together with the result in a table with a unique constraint. If a request arrives with a key that already exists, the server returns the stored response instead of charging again; the unique constraint also protects against two concurrent duplicates. Keys expire after a retention period. Message consumers apply the same idea using the event id.",
      example: `CREATE TABLE idempotency_keys (
  idempotency_key VARCHAR(100) PRIMARY KEY,
  response_body   JSONB        NOT NULL,
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT now()
);`,
      points: [
        'Same effect whether executed once or many times.',
        'Needed because of retries and duplicate deliveries.',
        'Idempotency key + unique constraint + stored response.',
      ],
      difficulty: 'Advanced',
    },
    {
      id: 'microservices-q11',
      question: 'How would you make a microservice resilient to failures of its dependencies?',
      answer: "Combine several patterns. Put timeouts on every remote call so threads are never blocked indefinitely. Add limited retries with exponential backoff and jitter for transient failures, only for idempotent operations. Wrap the call in a circuit breaker so that a failing dependency is cut off quickly, and provide a meaningful fallback such as cached data or a degraded response. Use a bulkhead (separate thread pools or concurrency limits) so one slow dependency cannot consume all resources.\n\nWhere possible, replace synchronous calls with asynchronous messaging so temporary outages just delay processing. Add health checks and readiness probes so traffic is not sent to unhealthy instances, rate limiting to protect yourself from overload, and monitoring with metrics, tracing and alerts on circuit breaker state. Resilience4j provides TimeLimiter, Retry, CircuitBreaker, Bulkhead and RateLimiter in Spring Boot.",
      points: [
        'Timeouts, retries with backoff, circuit breaker, fallback.',
        'Bulkheads isolate resources per dependency.',
        'Async messaging decouples availability.',
        'Health checks, rate limiting and observability.',
      ],
      difficulty: 'Advanced',
    },
    {
      id: 'microservices-q12',
      question: 'How do you decide how to split a system into microservices?',
      answer: "Split around business capabilities or DDD bounded contexts, such as Catalog, Orders, Payments and Shipping, not around technical layers. Each service should own its data and be able to change and deploy independently. Signs of good boundaries: high cohesion inside a service, few and stable contracts between services, and teams that can work without constant coordination.\n\nSigns of bad boundaries: services that must be deployed together, chatty synchronous calls between them, or a shared database, which together create a distributed monolith. It is often wise to start with a modular monolith, learn the domain, and extract services gradually with the Strangler Fig pattern, beginning with parts that need independent scaling or change most often.",
      points: [
        'Business capability / bounded context, not technical layers.',
        'Database per service, loose coupling, high cohesion.',
        'Avoid the distributed monolith.',
        'Modular monolith first; Strangler Fig to extract.',
      ],
      difficulty: 'Advanced',
    },
  ],
}

export default topic
