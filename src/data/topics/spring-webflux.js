const topic = {
  id: 'spring-webflux',
  category: 'spring-boot',
  title: 'Reactive Programming & WebFlux',
  description: "Reactive Streams, Mono and Flux, operators, error handling, back-pressure and schedulers, WebFlux controllers and functional endpoints, WebClient, R2DBC, testing, and when to choose virtual threads instead.",
  difficulty: 'Advanced',
  overview: "Spring MVC uses one thread per request: while a request waits for the database or another service, its thread sits idle. Spring WebFlux is the reactive alternative. A small number of event-loop threads (Netty) handle many requests, and instead of waiting, code describes what should happen when data arrives. The building blocks come from Project Reactor: `Mono` (zero or one value) and `Flux` (zero to many values).\n\nThink of a restaurant. In the MVC model, each waiter takes an order and stands at the kitchen door until the food is ready. In the reactive model, a waiter takes an order, hands it to the kitchen with a note saying \"call me when it is ready\", and serves other tables meanwhile. Fewer waiters serve more guests, but the process is harder to follow.\n\nReactive code can handle huge numbers of concurrent connections with little memory, and it supports streaming and back-pressure. It is also harder to write, debug and test, and one blocking call can freeze the event loop. Since Java 21, virtual threads offer similar scalability with ordinary blocking code, so interviewers now expect you to explain when reactive is still worth it. Examples use an `OrderService` with `Order` and `OrderDto` types.",

  subtopics: [
    {
      id: 'reactive-streams',
      title: 'Reactive Streams and back-pressure',
      explanation: "Reactive Streams is a small specification (also in the JDK as `java.util.concurrent.Flow`) with four interfaces: `Publisher` produces items, `Subscriber` consumes them, `Subscription` links the two, and `Processor` is both. The key idea is demand: the subscriber calls `subscription.request(n)` to say how many items it can handle, and the publisher must not send more. This is back-pressure, and it stops a fast producer from overwhelming a slow consumer.\n\nThe publisher signals items with `onNext`, and finishes with exactly one terminal signal: `onComplete` or `onError`. Project Reactor (used by Spring), RxJava and Akka Streams all implement this specification, so they can interoperate.",
      example: `// The four interfaces (simplified from org.reactivestreams)
public interface Publisher<T>  { void subscribe(Subscriber<? super T> s); }
public interface Subscriber<T> {
    void onSubscribe(Subscription s);
    void onNext(T item);
    void onError(Throwable t);
    void onComplete();
}
public interface Subscription  { void request(long n); void cancel(); }
public interface Processor<T, R> extends Subscriber<T>, Publisher<R> { }

// Signal order: onSubscribe -> onNext* -> (onComplete | onError)`,
      interviewPoints: [
        "Publisher, Subscriber, Subscription, Processor.",
        "Subscriber requests n items: back-pressure.",
        "onNext zero or more times, then onComplete or onError.",
        "Reactor, RxJava and JDK Flow share the model.",
      ],
    },
    {
      id: 'mono-flux',
      title: 'Mono and Flux',
      explanation: "Project Reactor provides two publisher types. `Mono<T>` emits at most one value (or an error), like an asynchronous `Optional`: use it for \"find order by id\" or \"save order\". `Flux<T>` emits zero or more values, possibly infinitely: use it for \"all orders of a customer\" or a stream of price updates.\n\nMost importantly, nothing happens until someone subscribes. Building a pipeline only describes the work. In a WebFlux controller, you return the Mono or Flux and the framework subscribes. Most publishers are cold: each subscriber triggers the work again from the beginning, for example each subscription to a WebClient Mono sends a new HTTP request.",
      example: `Mono<String> one = Mono.just("order-1");
Mono<String> none = Mono.empty();
Mono<String> failed = Mono.error(new IllegalStateException("boom"));

Flux<Integer> numbers = Flux.just(1, 2, 3);
Flux<Long> ticks = Flux.interval(Duration.ofSeconds(1));    // infinite stream

// lazy: this prints nothing yet
Flux<Integer> pipeline = Flux.range(1, 5)
    .doOnNext(n -> System.out.println("processing " + n))
    .map(n -> n * 10);

pipeline.subscribe(
    value -> System.out.println("got " + value),
    error -> System.err.println("failed: " + error),
    () -> System.out.println("done"));

// Mono.fromCallable defers the call until subscription
Mono<Order> order = Mono.fromCallable(() -> legacyClient.fetch(42));`,
      interviewPoints: [
        "Mono: 0..1 values; Flux: 0..N values.",
        "Nothing happens until subscribe.",
        "Cold publishers repeat the work per subscriber.",
        "Controllers return Mono/Flux; Spring subscribes.",
      ],
    },
    {
      id: 'operators',
      title: 'Common operators: map, flatMap, filter, zip',
      explanation: "`map` transforms each value synchronously (Order to OrderDto). `flatMap` transforms each value into another publisher and merges the results, which is how you chain asynchronous calls: for each order, call the payment service. flatMap subscribes to the inner publishers concurrently, so results can arrive out of order. `concatMap` preserves order by handling one inner publisher at a time, and `flatMapSequential` runs concurrently but emits in the original order.\n\n`filter` keeps matching values, `take(n)` limits them, `collectList()` turns a Flux into a Mono of a List, and `zip` (or `Mono.zip`) waits for several publishers and combines their results, which is how you run independent calls in parallel. `switchIfEmpty` and `defaultIfEmpty` handle the empty case.",
      example: `// sequential async chain: find order, then load its customer
Mono<OrderDetails> details = orderRepository.findById(id)
    .switchIfEmpty(Mono.error(new OrderNotFoundException(id)))
    .flatMap(order -> customerClient.get(order.customerId())
        .map(customer -> new OrderDetails(order, customer)));

// parallel independent calls, combined when both finish
Mono<Dashboard> dashboard = Mono.zip(
        userClient.get(userId),
        orderClient.latest(userId),
        recommendationClient.forUser(userId))
    .map(t -> new Dashboard(t.getT1(), t.getT2(), t.getT3()));

// transform a stream
Flux<OrderDto> paid = orderRepository.findByCustomerId(customerId)
    .filter(o -> o.status() == Status.PAID)
    .map(OrderDto::from)
    .take(20);

// flatMap = concurrent, may reorder; concatMap = one at a time, keeps order
Flux<Receipt> receipts = paid.flatMap(o -> paymentClient.receipt(o.id()), 8);  // max 8 in flight`,
      interviewPoints: [
        "map for sync transforms, flatMap for async ones.",
        "flatMap is concurrent and may reorder; concatMap keeps order.",
        "zip combines independent calls in parallel.",
        "switchIfEmpty / defaultIfEmpty for empty results.",
      ],
    },
    {
      id: 'error-handling',
      title: 'Error handling, timeouts and retries',
      explanation: "An error travels down the pipeline as an `onError` signal and terminates the sequence; `try/catch` around the pipeline does not help, because the error happens later. Handle it with operators instead: `onErrorReturn` for a fallback value, `onErrorResume` for a fallback publisher (such as reading from a cache), `onErrorMap` to translate exceptions, and `doOnError` to log.\n\n`timeout(Duration)` fails if no value arrives in time, and `retryWhen(Retry.backoff(3, Duration.ofMillis(200)))` resubscribes with exponential backoff, which re-runs the whole upstream (for WebClient, it resends the request). Only retry idempotent operations and filter retries to transient errors.",
      example: `Mono<Price> price = pricingClient.priceFor(sku)
    .timeout(Duration.ofSeconds(2))
    .retryWhen(Retry.backoff(3, Duration.ofMillis(200))
        .filter(ex -> ex instanceof TimeoutException || ex instanceof WebClientRequestException))
    .onErrorResume(ex -> {
        log.warn("pricing unavailable for {}, using cached price", sku, ex);
        return priceCache.get(sku);
    });

Mono<Order> order = orderRepository.findById(id)
    .onErrorMap(DataAccessException.class, ex -> new ServiceUnavailableException("db down", ex));`,
      interviewPoints: [
        "Errors are signals; try/catch around the pipeline does not work.",
        "onErrorReturn, onErrorResume, onErrorMap, doOnError.",
        "timeout and retryWhen with backoff.",
        "Retry only idempotent, transient failures.",
      ],
    },
    {
      id: 'schedulers-blocking',
      title: 'Schedulers and never blocking the event loop',
      explanation: "WebFlux runs on a few Netty event-loop threads, about one per CPU core. If code on such a thread blocks, for example calling JDBC, `Thread.sleep`, a blocking HTTP client or `.block()`, that thread cannot serve any other request, and a handful of blocking calls can freeze the whole server.\n\nIf you must call blocking code, wrap it with `Mono.fromCallable(...)` and move it to a thread pool meant for blocking work with `.subscribeOn(Schedulers.boundedElastic())`. `subscribeOn` decides where the subscription (and the source) runs; `publishOn` switches the thread for the operators after it. BlockHound is a tool that detects blocking calls on non-blocking threads in tests.",
      example: `// WRONG: blocks an event-loop thread
@GetMapping("/reports/{id}")
public Mono<Report> report(@PathVariable long id) {
    Report r = legacyJdbcReportDao.load(id);        // blocking JDBC
    return Mono.just(r);
}

// RIGHT: offload blocking work
@GetMapping("/reports/{id}")
public Mono<Report> report(@PathVariable long id) {
    return Mono.fromCallable(() -> legacyJdbcReportDao.load(id))
               .subscribeOn(Schedulers.boundedElastic());
}

// never call block() inside a reactive pipeline or controller
// Order o = orderMono.block();   // IllegalStateException on Netty threads`,
      interviewPoints: [
        "Few event-loop threads; blocking one hurts everyone.",
        "Wrap blocking calls with fromCallable + boundedElastic.",
        "subscribeOn affects the source; publishOn affects what follows.",
        "Never call block() in reactive code; use BlockHound in tests.",
      ],
    },
    {
      id: 'webflux-controllers',
      title: 'WebFlux annotated controllers',
      explanation: "Add `spring-boot-starter-webflux` (instead of `spring-boot-starter-web`) and Spring Boot starts Netty. Controllers look almost the same as in Spring MVC: `@RestController`, `@GetMapping`, `@RequestBody`, `@Valid` and `@ControllerAdvice` all work. The difference is that methods return `Mono` or `Flux`, and request bodies can be reactive types too.\n\nReturning a Flux with media type `text/event-stream` (Server-Sent Events) or `application/x-ndjson` streams items to the client as they are produced, which is useful for live updates. If both web starters are present, Spring Boot chooses MVC.",
      example: `@RestController
@RequestMapping("/api/orders")
public class OrderController {

    private final OrderService orderService;

    public OrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    @GetMapping("/{id}")
    public Mono<ResponseEntity<OrderDto>> get(@PathVariable long id) {
        return orderService.find(id)
            .map(ResponseEntity::ok)
            .defaultIfEmpty(ResponseEntity.notFound().build());
    }

    @GetMapping
    public Flux<OrderDto> byCustomer(@RequestParam long customerId) {
        return orderService.findByCustomer(customerId);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Mono<OrderDto> create(@Valid @RequestBody Mono<CreateOrderRequest> request) {
        return request.flatMap(orderService::create);
    }

    // live status updates as Server-Sent Events
    @GetMapping(value = "/{id}/status", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public Flux<OrderStatusEvent> status(@PathVariable long id) {
        return orderService.statusUpdates(id);
    }
}`,
      interviewPoints: [
        "Same annotations as MVC, reactive return types.",
        "spring-boot-starter-webflux runs on Netty.",
        "Streaming with text/event-stream or NDJSON.",
        "If both starters are present, MVC wins.",
      ],
    },
    {
      id: 'functional-endpoints',
      title: 'Functional endpoints (RouterFunction)',
      explanation: "WebFlux also offers a functional style: routes are defined in code with `RouterFunctions`, and handler methods take a `ServerRequest` and return `Mono<ServerResponse>`. There are no annotations or reflection, so routing is explicit and easy to test, and it can be composed and nested.\n\nBoth styles are fully supported and can be mixed. Annotated controllers are more familiar to most teams; functional endpoints appeal to those who prefer explicit configuration. Spring MVC has the same functional model (`RouterFunction<ServerResponse>` with a servlet `ServerRequest`).",
      example: `@Configuration
public class OrderRoutes {

    @Bean
    RouterFunction<ServerResponse> orderRouter(OrderHandler handler) {
        return RouterFunctions.route()
            .GET("/api/orders/{id}", handler::get)
            .POST("/api/orders", handler::create)
            .build();
    }
}

@Component
public class OrderHandler {

    private final OrderService orderService;

    public OrderHandler(OrderService orderService) {
        this.orderService = orderService;
    }

    public Mono<ServerResponse> get(ServerRequest request) {
        long id = Long.parseLong(request.pathVariable("id"));
        return orderService.find(id)
            .flatMap(order -> ServerResponse.ok().bodyValue(order))
            .switchIfEmpty(ServerResponse.notFound().build());
    }

    public Mono<ServerResponse> create(ServerRequest request) {
        return request.bodyToMono(CreateOrderRequest.class)
            .flatMap(orderService::create)
            .flatMap(dto -> ServerResponse.created(URI.create("/api/orders/" + dto.id())).bodyValue(dto));
    }
}`,
      interviewPoints: [
        "Routes as code with RouterFunctions.",
        "Handlers: ServerRequest -> Mono<ServerResponse>.",
        "No annotations; explicit and testable.",
        "Can coexist with annotated controllers.",
      ],
    },
    {
      id: 'webclient',
      title: 'WebClient',
      explanation: "`WebClient` is Spring's non-blocking HTTP client with a fluent API. `retrieve()` turns 4xx and 5xx responses into `WebClientResponseException` (customisable with `onStatus`), and `bodyToMono` / `bodyToFlux` decode the body. Build one instance from the auto-configured `WebClient.Builder` (which includes codecs and observability) and reuse it.\n\nWebClient is the right client inside WebFlux. It can also be used in Spring MVC applications, where you call `.block()` at the end, but since Spring 6.1 `RestClient` is the simpler choice for blocking code. Always configure timeouts (connect and response) on the underlying HTTP client.",
      example: `@Configuration
public class ClientsConfig {

    @Bean
    WebClient inventoryClient(WebClient.Builder builder) {
        HttpClient http = HttpClient.create()
            .option(ChannelOption.CONNECT_TIMEOUT_MILLIS, 2_000)
            .responseTimeout(Duration.ofSeconds(3));
        return builder
            .baseUrl("http://inventory-service")
            .clientConnector(new ReactorClientHttpConnector(http))
            .build();
    }
}

public Mono<Stock> stock(String sku) {
    return inventoryClient.get()
        .uri("/api/stock/{sku}", sku)
        .retrieve()
        .onStatus(status -> status.value() == 404,
                  response -> Mono.error(new ProductNotFoundException(sku)))
        .bodyToMono(Stock.class);
}

public Mono<Reservation> reserve(ReserveRequest request) {
    return inventoryClient.post()
        .uri("/api/reservations")
        .bodyValue(request)
        .retrieve()
        .bodyToMono(Reservation.class);
}`,
      interviewPoints: [
        "Non-blocking HTTP client with a fluent API.",
        "retrieve() + onStatus for error handling.",
        "Build from the auto-configured builder and reuse.",
        "Configure timeouts; RestClient for blocking apps.",
      ],
    },
    {
      id: 'r2dbc',
      title: 'Reactive data access with R2DBC',
      explanation: "JDBC and JPA are blocking, so using them directly in WebFlux defeats the purpose. R2DBC (Reactive Relational Database Connectivity) is a non-blocking driver API for relational databases such as PostgreSQL and MySQL, and Spring Data R2DBC provides reactive repositories that return `Mono` and `Flux`.\n\nSpring Data R2DBC is deliberately simpler than JPA: there is no lazy loading, no entity relationships managed for you, no dirty checking and no first-level cache. You map tables with `@Table` and `@Id` and write joins yourself. Reactive transactions work with `@Transactional` on methods returning Mono/Flux (using `R2dbcTransactionManager`) or with `TransactionalOperator`. For MongoDB, Redis and Cassandra, Spring Data has reactive repositories too.",
      example: `# application.yml
spring:
  r2dbc:
    url: r2dbc:postgresql://localhost:5432/shop
    username: shop
    password: \${DB_PASSWORD}

@Table("orders")
public record OrderEntity(@Id Long id, Long customerId, BigDecimal amount, String status) {}

public interface OrderRepository extends ReactiveCrudRepository<OrderEntity, Long> {
    Flux<OrderEntity> findByCustomerId(Long customerId);

    @Query("SELECT * FROM orders WHERE status = :status ORDER BY id DESC LIMIT :limit")
    Flux<OrderEntity> latestByStatus(String status, int limit);
}

@Transactional
public Mono<OrderEntity> placeOrder(OrderEntity order) {
    return orderRepository.save(order)
        .flatMap(saved -> outboxRepository.save(OutboxEvent.orderPlaced(saved)).thenReturn(saved));
}`,
      interviewPoints: [
        "JDBC/JPA block; use R2DBC in WebFlux.",
        "Reactive repositories return Mono/Flux.",
        "No lazy loading, relationships or dirty checking.",
        "@Transactional works on reactive methods.",
      ],
    },
    {
      id: 'reactive-vs-virtual-threads',
      title: 'Reactive vs Spring MVC with virtual threads',
      explanation: "Reactive programming was adopted mainly to handle many concurrent, I/O-bound requests without thousands of expensive platform threads. With Java 21, `spring.threads.virtual.enabled=true` gives Spring MVC cheap virtual threads, so ordinary blocking code (JDBC, JPA, RestClient) scales to very high concurrency while staying easy to read, debug and test, with normal stack traces and ThreadLocal-based features working as usual.\n\nReactive remains a strong choice for streaming (Server-Sent Events, WebSockets, NDJSON), for real back-pressure between producer and consumer, for composing many concurrent calls with rich operators, for gateways and proxies (Spring Cloud Gateway is built on WebFlux), and for teams already fluent in it. For a typical CRUD service with a relational database, Spring MVC with virtual threads is now usually the simpler, equally scalable option.",
      example: `Spring MVC + virtual threads            Spring WebFlux + Reactor
------------------------------          ------------------------------
Order o = repo.findById(id)              repo.findById(id)
    .orElseThrow();                          .switchIfEmpty(Mono.error(...))
Customer c = client.get(o.cid());           .flatMap(o -> client.get(o.cid())
return new Details(o, c);                       .map(c -> new Details(o, c)));

+ plain Java, easy debugging             + streaming, back-pressure, rich operators
+ JPA, JDBC, ThreadLocal all work        + minimal threads, great for gateways
- no back-pressure, no streaming DSL     - steep learning curve, harder debugging
                                         - needs reactive drivers end to end`,
      interviewPoints: [
        "Virtual threads give MVC similar I/O scalability.",
        "Reactive shines for streaming and back-pressure.",
        "Reactive must be non-blocking end to end.",
        "CRUD + JPA: MVC with virtual threads is usually simpler.",
      ],
    },
    {
      id: 'testing-reactive',
      title: 'Testing with StepVerifier and WebTestClient',
      explanation: "Reactive code is lazy and asynchronous, so asserting on it needs special tools. `StepVerifier` (from reactor-test) subscribes to a publisher and checks each signal in order: `expectNext`, `expectNextCount`, `expectError`, and ends with `verifyComplete()` or `verify()`. Forgetting the final verify means nothing is actually tested.\n\nFor time-based operators such as `delayElements` or `interval`, `StepVerifier.withVirtualTime` lets you advance a virtual clock instead of waiting. For the web layer, `@WebFluxTest` with `WebTestClient` sends requests to controllers and asserts on the responses, similar to MockMvc.",
      example: `@Test
void findsPaidOrders() {
    when(orderRepository.findByCustomerId(7L)).thenReturn(Flux.just(paidOrder, pendingOrder));

    StepVerifier.create(orderService.paidOrders(7L))
        .expectNextMatches(dto -> dto.status() == Status.PAID)
        .verifyComplete();                      // without this, nothing is checked
}

@Test
void failsForUnknownOrder() {
    when(orderRepository.findById(99L)).thenReturn(Mono.empty());

    StepVerifier.create(orderService.find(99L))
        .expectError(OrderNotFoundException.class)
        .verify();
}

@WebFluxTest(OrderController.class)
class OrderControllerTest {
    @Autowired WebTestClient webTestClient;
    @MockitoBean OrderService orderService;

    @Test
    void returnsOrder() {
        when(orderService.find(1L)).thenReturn(Mono.just(new OrderDto(1L, Status.PAID)));

        webTestClient.get().uri("/api/orders/1")
            .exchange()
            .expectStatus().isOk()
            .expectBody(OrderDto.class)
            .value(dto -> assertThat(dto.status()).isEqualTo(Status.PAID));
    }
}`,
      interviewPoints: [
        "StepVerifier checks signals in order.",
        "Always end with verifyComplete() or verify().",
        "withVirtualTime for time-based operators.",
        "@WebFluxTest + WebTestClient for controllers.",
      ],
    },
  ],

  commonMistakes: [
    "Calling a blocking API (JDBC, JPA, RestTemplate, Thread.sleep) on an event-loop thread.",
    "Calling block() inside reactive code, or subscribing manually inside a controller instead of returning the publisher.",
    "Building a pipeline and forgetting that nothing runs until it is subscribed.",
    "Using map when the function returns a Mono, producing Mono<Mono<T>> instead of using flatMap.",
    "Using flatMap when order matters, instead of concatMap or flatMapSequential.",
    "Wrapping a pipeline in try/catch instead of using onErrorResume or onErrorMap.",
    "Retrying non-idempotent calls, or retrying without backoff and a limit.",
    "Mixing spring-boot-starter-web and spring-boot-starter-webflux and being surprised that MVC is used.",
    "Relying on ThreadLocal (MDC, SecurityContextHolder) in reactive code instead of Reactor Context.",
    "Writing StepVerifier tests without verify() or verifyComplete(), so they pass without checking anything.",
    "Choosing WebFlux for a simple CRUD service with JPA, gaining complexity without benefit.",
  ],

  interviewTips: [
    "Start with the problem reactive solves: many concurrent I/O-bound requests with few threads, plus back-pressure.",
    "Explain Mono vs Flux and that pipelines are lazy until subscription.",
    "Be precise about map vs flatMap vs concatMap; it is the most common reactive coding question.",
    "Show you know the golden rule: never block the event loop, and how to offload blocking code.",
    "Give a balanced comparison with virtual threads and say when you would pick each.",
    "Mention testing with StepVerifier; it shows hands-on experience.",
  ],

  interviewQuestions: [
    {
      id: 'spring-webflux-q1',
      question: "What is the difference between Spring MVC and Spring WebFlux?",
      answer: "Spring MVC is built on the Servlet API and uses one thread per request; when the request waits for I/O, the thread blocks. It usually runs on Tomcat with a pool of around 200 threads. Spring WebFlux is built on Reactive Streams and Project Reactor and uses a non-blocking model: a few event-loop threads (usually on Netty) handle many requests, and I/O completion triggers callbacks. WebFlux controllers return Mono and Flux, and the whole stack, including database drivers and HTTP clients, must be non-blocking (R2DBC, WebClient). WebFlux scales to many concurrent connections with little memory and supports streaming and back-pressure, but it is harder to write and debug. The programming model with annotations is very similar in both.",
      points: [
        "MVC: servlet, thread per request, blocking.",
        "WebFlux: reactive, event loop, non-blocking.",
        "WebFlux needs a non-blocking stack end to end.",
        "Similar annotations, different execution model.",
      ],
      difficulty: 'Intermediate',
    },
    {
      id: 'spring-webflux-q2',
      question: "What are Mono and Flux?",
      answer: "They are Project Reactor's implementations of the Reactive Streams Publisher. A Mono emits at most one item and then completes, or emits an error, so it represents an asynchronous single result such as a findById or save. A Flux emits zero to many items, possibly infinitely, followed by completion or an error, representing a list of results or a stream of events. Both are lazy: defining a pipeline does nothing until something subscribes, and each subscription to a cold publisher re-executes the work. Both provide a rich set of operators such as map, flatMap, filter, zip and onErrorResume.",
      example: `Mono<Order> order = repository.findById(1L);
Flux<Order> orders = repository.findByCustomerId(7L);`,
      points: [
        "Mono: 0..1; Flux: 0..N.",
        "Terminated by complete or error.",
        "Lazy until subscription.",
        "Rich operator library.",
      ],
      difficulty: 'Beginner',
    },
    {
      id: 'spring-webflux-q3',
      question: "What is the difference between map and flatMap in Reactor?",
      answer: "map applies a synchronous function to each element and emits the result: Order to OrderDto. flatMap applies a function that returns another publisher, subscribes to those inner publishers and merges their results into one stream. It is used for asynchronous steps such as calling another service or the database for each element. Using map with a function that returns a Mono gives Mono<Mono<T>>, which is almost always a mistake. flatMap subscribes to inner publishers eagerly and concurrently, so a Flux's output order may differ from the input; use concatMap to process one at a time in order, or flatMapSequential to run concurrently but keep the order. flatMap also accepts a concurrency argument to limit calls in flight.",
      example: `Flux<OrderDto> dtos = orders.map(OrderDto::from);                  // sync
Flux<Receipt> receipts = orders.flatMap(o -> payments.receipt(o.id())); // async, may reorder
Flux<Receipt> ordered = orders.concatMap(o -> payments.receipt(o.id())); // async, in order`,
      points: [
        "map: sync transform.",
        "flatMap: async transform, merges inner publishers.",
        "flatMap can reorder; concatMap keeps order.",
        "Concurrency limit on flatMap.",
      ],
      difficulty: 'Intermediate',
    },
    {
      id: 'spring-webflux-q4',
      question: "What is back-pressure?",
      answer: "Back-pressure is the ability of a consumer to control how fast a producer sends data, so a fast producer cannot overwhelm a slow consumer and exhaust its memory. In Reactive Streams, the subscriber calls subscription.request(n) to signal demand, and the publisher may send at most n items until more is requested. Reactor operators propagate demand upstream automatically; for sources that cannot slow down, such as UI events or ticks, you choose a strategy with onBackpressureBuffer, onBackpressureDrop or onBackpressureLatest. Over the network, WebFlux maps demand to TCP flow control, so a slow client naturally slows the server's stream.",
      points: [
        "Consumer controls the rate via request(n).",
        "Prevents memory exhaustion.",
        "Buffer, drop or latest strategies for uncontrollable sources.",
        "Propagates to TCP flow control.",
      ],
      difficulty: 'Intermediate',
    },
    {
      id: 'spring-webflux-q5',
      question: "What happens if you call a blocking method inside a WebFlux controller, and how do you handle legacy blocking code?",
      answer: "WebFlux runs on a small number of event-loop threads, roughly one per CPU core. A blocking call such as a JDBC query, a RestTemplate call or Thread.sleep occupies one of those threads for its whole duration, so it cannot process other requests; with a few concurrent blocking calls, the whole application stops responding, even though CPU usage is low. Calling block() on Netty threads throws an exception for this reason. If blocking code cannot be replaced, wrap it with Mono.fromCallable(() -> blockingCall()) and add .subscribeOn(Schedulers.boundedElastic()), which runs it on a bounded pool designed for blocking work. Better still is to use non-blocking libraries such as R2DBC and WebClient, and to use BlockHound in tests to detect accidental blocking.",
      example: `Mono.fromCallable(() -> legacyDao.load(id))
    .subscribeOn(Schedulers.boundedElastic());`,
      points: [
        "Blocking starves the event loop.",
        "block() is forbidden on Netty threads.",
        "fromCallable + boundedElastic for legacy code.",
        "Prefer non-blocking libraries; BlockHound.",
      ],
      difficulty: 'Advanced',
    },
    {
      id: 'spring-webflux-q6',
      question: "How do you handle errors in a reactive pipeline?",
      answer: "Errors are propagated as an onError signal that terminates the sequence, so a try/catch around the pipeline definition does not catch them; they occur later, during execution. Reactor provides operators: onErrorReturn to emit a fallback value, onErrorResume to switch to a fallback publisher such as a cache or a default, onErrorMap to translate exceptions into domain exceptions, doOnError for logging side effects, and onErrorContinue (to be used carefully) to skip bad elements in a Flux. timeout adds a deadline and retryWhen with Retry.backoff resubscribes with exponential backoff. In WebFlux, exceptions that reach the controller are handled by @ExceptionHandler and @ControllerAdvice just like in MVC.",
      points: [
        "Errors are signals, not thrown to the caller.",
        "onErrorReturn, onErrorResume, onErrorMap, doOnError.",
        "timeout and retryWhen with backoff.",
        "@ControllerAdvice still works.",
      ],
      difficulty: 'Intermediate',
    },
    {
      id: 'spring-webflux-q7',
      question: "What is the difference between subscribeOn and publishOn?",
      answer: "subscribeOn changes the scheduler on which the subscription happens, which means it affects where the source starts emitting. Its position in the chain does not matter, and if there are several, the one closest to the source wins. It is used to move a blocking source, such as Mono.fromCallable wrapping a JDBC call, onto Schedulers.boundedElastic(). publishOn switches the thread for all operators that come after it in the chain, so its position matters, and it can be used several times to hop between schedulers, for example to move CPU-heavy processing onto Schedulers.parallel(). Neither makes code parallel by itself; for parallel processing of a Flux you use flatMap with a scheduler or parallel().runOn(...).",
      points: [
        "subscribeOn: where the source runs; position irrelevant.",
        "publishOn: thread for downstream operators; position matters.",
        "boundedElastic for blocking, parallel for CPU work.",
      ],
      difficulty: 'Advanced',
    },
    {
      id: 'spring-webflux-q8',
      question: "With virtual threads available, when would you still choose WebFlux?",
      answer: "Virtual threads let Spring MVC handle very high numbers of concurrent blocking requests with simple imperative code, so for typical CRUD services using JPA or JDBC, MVC with spring.threads.virtual.enabled=true is usually the simpler and equally scalable choice. WebFlux is still a good fit when you need streaming responses such as Server-Sent Events, WebSockets or NDJSON; real back-pressure between a fast producer and slow consumers; complex composition of many concurrent calls with timeouts, retries and fallbacks using Reactor operators; very high numbers of long-lived connections with minimal memory; building gateways and proxies (Spring Cloud Gateway is reactive); or when the rest of the stack (R2DBC, reactive MongoDB, Kafka reactive clients) is already reactive and the team is experienced with it.",
      points: [
        "CRUD + JPA: MVC with virtual threads.",
        "WebFlux for streaming and back-pressure.",
        "Complex async composition and gateways.",
        "Team experience and existing reactive stack.",
      ],
      difficulty: 'Advanced',
    },
    {
      id: 'spring-webflux-q9',
      question: "How do you test reactive code?",
      answer: "Use StepVerifier from reactor-test for services and pipelines. StepVerifier.create(publisher) subscribes and lets you assert each signal in order with expectNext, expectNextMatches, expectNextCount, expectError or expectErrorMatches, finishing with verifyComplete() or verify(); without that last call nothing is executed. For operators involving time, such as delayElements, interval or timeout, use StepVerifier.withVirtualTime and thenAwait(Duration) to advance a virtual clock instantly. For controllers, use @WebFluxTest with WebTestClient to send requests and assert on status, headers and body, mocking the service with @MockitoBean. For full integration tests, @SpringBootTest with WebTestClient bound to the running server and Testcontainers for R2DBC databases.",
      example: `StepVerifier.create(service.find(1L))
    .expectNextMatches(o -> o.id() == 1L)
    .verifyComplete();`,
      points: [
        "StepVerifier for signals in order.",
        "Always verify()/verifyComplete().",
        "withVirtualTime for time-based code.",
        "@WebFluxTest + WebTestClient for controllers.",
      ],
      difficulty: 'Intermediate',
    },
  ],
}

export default topic
