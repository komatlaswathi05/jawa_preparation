const topic = {
  id: 'testing-advanced',
  category: 'testing',
  title: 'Advanced Testing',
  description: "Test the hard parts: HTTP dependencies with WireMock and MockRestServiceServer, consumer-driven contracts with Spring Cloud Contract and Pact, Kafka and async code with Awaitility, time, architecture rules, mutation testing and flaky tests.",
  difficulty: 'Advanced',
  overview: "The Testing topic covers the foundations: JUnit 5, Mockito, test slices, MockMvc, Testcontainers and security tests. Real services also call other services over HTTP, publish and consume Kafka messages, run work asynchronously and depend on the current time. These are exactly the places where bugs hide and where naive tests become slow or flaky.\n\nThink of testing a restaurant kitchen. Unit tests check each cook's technique. Integration tests with Testcontainers use a real oven. Now you need a pretend supplier who delivers exactly the ingredients you ask for, or arrives late on purpose (WireMock), a signed agreement with each supplier about what a delivery looks like (contract tests), and a way to fast-forward the clock instead of waiting for the dough to rise (a controllable Clock and Awaitility).\n\nThis topic covers those techniques, plus tools that raise the quality of the test suite itself: ArchUnit for architecture rules, mutation testing to check whether tests actually catch bugs, test data builders, and a checklist for finding and fixing flaky tests. Examples use an `order-service` that calls `inventory-service` over HTTP and publishes events to Kafka.",

  subtopics: [
    {
      id: 'wiremock',
      title: 'WireMock for HTTP dependencies',
      explanation: "Mocking your HTTP client class with Mockito tests almost nothing about the real integration: URL building, headers, JSON mapping, timeouts and error handling are all skipped. WireMock starts a real HTTP server in the test, which you program to return canned responses. Your production client code talks to it over the network, exactly as it would talk to the real service.\n\nYou can stub successful responses, error statuses, malformed bodies and slow responses (`withFixedDelay`) to test timeouts, retries and circuit breakers. Afterwards you can `verify` which requests were made, including their headers and bodies. Point the application at WireMock's random port with `@DynamicPropertySource`.",
      example: `@SpringBootTest
class InventoryClientTest {

    @RegisterExtension
    static WireMockExtension inventory = WireMockExtension.newInstance()
        .options(wireMockConfig().dynamicPort())
        .build();

    @DynamicPropertySource
    static void props(DynamicPropertyRegistry registry) {
        registry.add("clients.inventory.base-url", inventory::baseUrl);
    }

    @Autowired InventoryClient client;

    @Test
    void readsStock() {
        inventory.stubFor(get(urlEqualTo("/api/stock/KB-01"))
            .willReturn(okJson("""
                { "sku": "KB-01", "available": 5 }
                """)));

        assertThat(client.stock("KB-01").available()).isEqualTo(5);
        inventory.verify(getRequestedFor(urlEqualTo("/api/stock/KB-01"))
            .withHeader("Accept", containing("application/json")));
    }

    @Test
    void timesOutWhenInventoryIsSlow() {
        inventory.stubFor(get(anyUrl()).willReturn(ok().withFixedDelay(5_000)));

        assertThatThrownBy(() -> client.stock("KB-01"))
            .isInstanceOf(InventoryUnavailableException.class);
    }

    @Test
    void mapsServerErrors() {
        inventory.stubFor(get(anyUrl()).willReturn(serverError()));

        assertThatThrownBy(() -> client.stock("KB-01"))
            .isInstanceOf(InventoryUnavailableException.class);
    }
}`,
      interviewPoints: [
        "Real HTTP server with programmable responses.",
        "Tests URL, headers, JSON mapping and error handling.",
        "Simulate delays and failures for timeouts and retries.",
        "verify() the requests that were sent.",
      ],
    },
    {
      id: 'rest-client-test',
      title: '@RestClientTest and MockRestServiceServer',
      explanation: "`@RestClientTest` is a test slice for HTTP client code. It loads only the client bean, Jackson and a `MockRestServiceServer`, which intercepts requests made through `RestTemplate` or a `RestClient` built from the auto-configured builder. No network is used, so these tests are very fast.\n\nUse it for focused tests of request building and response mapping. Use WireMock when you need real network behaviour, such as timeouts, connection errors or testing through the full Spring context.",
      example: `@RestClientTest(InventoryClient.class)
class InventoryClientSliceTest {

    @Autowired InventoryClient client;
    @Autowired MockRestServiceServer server;

    @Test
    void readsStock() {
        server.expect(requestTo(endsWith("/api/stock/KB-01")))
              .andExpect(method(HttpMethod.GET))
              .andRespond(withSuccess("""
                  { "sku": "KB-01", "available": 5 }
                  """, MediaType.APPLICATION_JSON));

        assertThat(client.stock("KB-01").available()).isEqualTo(5);
        server.verify();
    }

    @Test
    void notFoundBecomesDomainException() {
        server.expect(requestTo(endsWith("/api/stock/NOPE")))
              .andRespond(withStatus(HttpStatus.NOT_FOUND));

        assertThatThrownBy(() -> client.stock("NOPE")).isInstanceOf(ProductNotFoundException.class);
    }
}`,
      interviewPoints: [
        "Slice test for RestTemplate/RestClient code.",
        "MockRestServiceServer intercepts requests, no network.",
        "Fast; good for mapping and error translation.",
        "WireMock for real network behaviour.",
      ],
    },
    {
      id: 'contract-testing',
      title: 'Consumer-driven contract testing',
      explanation: "In a microservice system, the consumer's tests use a stub of the provider, and the provider's tests do not know what consumers expect. Both test suites pass, and production breaks when the provider renames a field. End-to-end tests catch this, but they are slow, brittle and run late.\n\nContract tests close the gap. A contract describes one interaction: \"for GET /api/stock/KB-01 the provider returns 200 with sku and available\". The consumer's tests run against a stub generated from the contract, and the provider's build verifies that its real API satisfies every contract. If the provider changes something a consumer relies on, the provider's build fails before deployment. In consumer-driven contracts, consumers define what they need, so providers know which parts of the API are actually used.",
      example: `Without contracts                     With contracts
-------------------------------       -----------------------------------------
consumer tests  -> hand-written stub  consumer tests  -> stub generated from contract
provider tests  -> own assumptions    provider build  -> verifies every contract
both green, production breaks         incompatible change fails the provider build

Tools
  Spring Cloud Contract   contracts in YAML/Groovy, generated provider tests, stub jars,
                          Stub Runner for consumers; best for Spring-to-Spring teams
  Pact                    consumer tests generate pact files, shared via a Pact Broker,
                          provider verifies; language-agnostic (Java, JS, Go, ...)`,
      interviewPoints: [
        "Catch breaking API changes without end-to-end tests.",
        "Consumer tests use stubs derived from contracts.",
        "Provider build verifies all contracts.",
        "Spring Cloud Contract vs Pact.",
      ],
    },
    {
      id: 'spring-cloud-contract',
      title: 'Spring Cloud Contract in practice',
      explanation: "On the provider side (inventory-service), contracts live in `src/test/resources/contracts`. The Spring Cloud Contract Maven or Gradle plugin generates a JUnit test for each contract, which calls your real controller (through MockMvc or RestAssured) using a base class you provide to set up mocks, and it packages WireMock stubs into a `stubs` jar published alongside the application.\n\nOn the consumer side (order-service), `@AutoConfigureStubRunner` downloads that stubs jar (from a Maven repository or the local one) and starts a WireMock server that answers exactly as the contracts describe. The consumer's client is then tested against behaviour the provider has proven it supports.",
      example: `# provider: src/test/resources/contracts/stock/shouldReturnStock.yml
request:
  method: GET
  url: /api/stock/KB-01
response:
  status: 200
  headers:
    Content-Type: application/json
  body:
    sku: KB-01
    available: 5

// provider: base class for generated tests
public abstract class ContractBase {
    @BeforeEach
    void setup() {
        StockService stock = mock(StockService.class);
        when(stock.find("KB-01")).thenReturn(new Stock("KB-01", 5));
        RestAssuredMockMvc.standaloneSetup(new StockController(stock));
    }
}

// consumer: test against the provider's published stubs
@SpringBootTest
@AutoConfigureStubRunner(
    ids = "com.shop:inventory-service:+:stubs:8090",
    stubsMode = StubRunnerProperties.StubsMode.LOCAL)
class InventoryClientContractTest {
    @Autowired InventoryClient client;   // configured to call http://localhost:8090

    @Test
    void readsStockAccordingToContract() {
        assertThat(client.stock("KB-01").available()).isEqualTo(5);
    }
}`,
      interviewPoints: [
        "Provider: contracts generate tests and a stubs jar.",
        "Base class sets up the provider's test context.",
        "Consumer: Stub Runner serves the published stubs.",
        "Both sides test against the same contract.",
      ],
    },
    {
      id: 'pact',
      title: 'Pact consumer tests',
      explanation: "With Pact, the consumer writes the contract in its own tests. A `@Pact` method describes the expected request and response, Pact starts a mock server that behaves accordingly, and your real client code is exercised against it. When the test passes, Pact writes a JSON pact file, which is published to a Pact Broker.\n\nThe provider then runs a verification test annotated with `@Provider` that replays every interaction from the broker against the running provider, using provider states (`given(...)`) to set up the needed data. Matchers such as `integerType` check types rather than exact values, which keeps contracts from being too strict. The broker's can-i-deploy check tells you whether a version is compatible with what is deployed.",
      example: `@ExtendWith(PactConsumerTestExt.class)
@PactTestFor(providerName = "inventory-service")
class InventoryClientPactTest {

    @Pact(consumer = "order-service")
    RequestResponsePact stockForKeyboard(PactDslWithProvider builder) {
        return builder
            .given("product KB-01 has 5 in stock")
            .uponReceiving("a stock request for KB-01")
                .path("/api/stock/KB-01")
                .method("GET")
            .willRespondWith()
                .status(200)
                .body(new PactDslJsonBody()
                    .stringValue("sku", "KB-01")
                    .integerType("available", 5))
            .toPact();
    }

    @Test
    void readsStock(MockServer mockServer) {
        InventoryClient client = new InventoryClient(RestClient.create(mockServer.getUrl()));
        assertThat(client.stock("KB-01").available()).isEqualTo(5);
    }
}

// provider side
@Provider("inventory-service")
@PactBroker
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class InventoryProviderPactTest {
    @State("product KB-01 has 5 in stock")
    void keyboardInStock() { stockRepository.save(new Stock("KB-01", 5)); }
    // plus @TestTemplate with PactVerificationInvocationContextProvider to verify
}`,
      interviewPoints: [
        "Consumer tests produce pact files.",
        "Pact Broker shares contracts and results.",
        "Provider states set up test data.",
        "Type matchers avoid brittle contracts.",
      ],
    },
    {
      id: 'kafka-testing',
      title: 'Testing Kafka producers and consumers',
      explanation: "For Kafka code, test three levels. Unit-test the business logic of listeners by calling the listener method directly. Test serialization with plain JSON tests. And run integration tests against a real broker: either Spring Kafka's `@EmbeddedKafka` (an in-memory broker, fast but not identical to production) or a Kafka Testcontainer with `@ServiceConnection` (a real broker in Docker, closest to production).\n\nIn integration tests, send a message and then wait for its effect, such as a row saved in the database, with Awaitility instead of `Thread.sleep`. To test a producer, consume from the topic in the test with a consumer and assert on the record's key, headers and value. Remember that consumers start asynchronously; waiting for partition assignment avoids missing messages.",
      example: `@SpringBootTest
@Testcontainers
class OrderEventsIntegrationTest {

    // org.testcontainers.kafka.KafkaContainer (Testcontainers 1.20+, @ServiceConnection since Boot 3.4)
    @Container
    @ServiceConnection
    static KafkaContainer kafka = new KafkaContainer(DockerImageName.parse("apache/kafka-native:3.8.0"));

    @Container
    @ServiceConnection
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine");

    @Autowired KafkaTemplate<String, OrderPlacedEvent> kafkaTemplate;
    @Autowired ShipmentRepository shipments;

    @Test
    void createsShipmentWhenOrderIsPlaced() {
        kafkaTemplate.send("orders", "42", new OrderPlacedEvent(42L, 7L, new BigDecimal("89.97")));

        await().atMost(Duration.ofSeconds(10))
               .untilAsserted(() -> assertThat(shipments.findByOrderId(42L)).isPresent());
    }
}

// lighter alternative: in-memory broker
@SpringBootTest
@EmbeddedKafka(partitions = 1, topics = "orders",
               bootstrapServersProperty = "spring.kafka.bootstrap-servers")
class OrderEventsEmbeddedTest { ... }`,
      interviewPoints: [
        "Unit-test listener logic directly.",
        "@EmbeddedKafka for speed, Testcontainers for realism.",
        "Wait for effects with Awaitility, not sleep.",
        "Consume in the test to verify producers.",
      ],
    },
    {
      id: 'awaitility',
      title: 'Testing asynchronous code with Awaitility',
      explanation: "Asynchronous code (`@Async`, message listeners, scheduled jobs, CompletableFuture) finishes at an unknown time. `Thread.sleep(2000)` makes tests either slow (the sleep is too long) or flaky (it is too short on a busy CI machine). Awaitility polls a condition repeatedly until it holds or a timeout expires, so the test finishes as soon as the work is done and fails with a clear message if it never is.\n\nUse `untilAsserted` with AssertJ assertions for readable failures, set a sensible `atMost`, and optionally `pollInterval` or `pollDelay`. For futures you can simply call `get(timeout, unit)`. For code that must not happen, `during(...)` checks that a condition stays true for a period.",
      example: `// BAD: slow and flaky
emailService.sendWelcomeEmailAsync(user);
Thread.sleep(2000);
assertThat(mailbox.messages()).hasSize(1);

// GOOD: returns as soon as the email arrives, fails clearly after 5 s
emailService.sendWelcomeEmailAsync(user);
await().atMost(Duration.ofSeconds(5))
       .pollInterval(Duration.ofMillis(100))
       .untilAsserted(() -> assertThat(mailbox.messages())
           .singleElement()
           .extracting(Mail::to).isEqualTo("asha@example.com"));

// something must NOT happen for a while
await().during(Duration.ofSeconds(1)).atMost(Duration.ofSeconds(2))
       .until(() -> mailbox.messages().isEmpty());

// CompletableFuture: just wait with a timeout
Report report = reportService.generate(7L).get(5, TimeUnit.SECONDS);`,
      interviewPoints: [
        "Never use Thread.sleep in tests.",
        "Poll a condition with a timeout.",
        "untilAsserted gives readable failures.",
        "during() for things that must not happen.",
      ],
    },
    {
      id: 'time',
      title: 'Controlling time with Clock',
      explanation: "Code that calls `LocalDate.now()` or `Instant.now()` directly is hard to test: \"orders older than 30 days are archived\" or \"coupons expire at midnight\" would require waiting or changing the system clock. Inject a `java.time.Clock` instead and call `LocalDate.now(clock)`. Production uses `Clock.systemUTC()`; tests use `Clock.fixed(...)` for a specific instant, or a mutable test clock that can be advanced.\n\nThe same idea applies to anything non-deterministic: inject random number generators, UUID suppliers and ID generators so tests can control them.",
      example: `@Configuration
public class TimeConfig {
    @Bean
    Clock clock() { return Clock.systemUTC(); }
}

@Service
public class CouponService {
    private final Clock clock;

    public CouponService(Clock clock) { this.clock = clock; }

    public boolean isValid(Coupon coupon) {
        return Instant.now(clock).isBefore(coupon.expiresAt());
    }
}

@Test
void couponExpiresAtItsExpiryInstant() {
    Instant expiry = Instant.parse("2026-12-31T23:59:59Z");
    Coupon coupon = new Coupon("XMAS", expiry);

    var before = new CouponService(Clock.fixed(expiry.minusSeconds(1), ZoneOffset.UTC));
    var after  = new CouponService(Clock.fixed(expiry.plusSeconds(1), ZoneOffset.UTC));

    assertThat(before.isValid(coupon)).isTrue();
    assertThat(after.isValid(coupon)).isFalse();
}`,
      interviewPoints: [
        "Inject Clock instead of calling now() directly.",
        "Clock.fixed in tests for deterministic time.",
        "Also inject randomness and ID generators.",
      ],
    },
    {
      id: 'test-data-builders',
      title: 'Test data builders and fixtures',
      explanation: "Tests that build large objects inline become long and fragile: every new required field breaks dozens of tests, and the values that matter for the test are hidden among irrelevant ones. A test data builder creates a valid object with sensible defaults and lets each test override only what it cares about: `anOrder().withStatus(PAID).build()`.\n\nThe Object Mother pattern provides named, ready-made examples (`Orders.paidOrderOfAsha()`). Keep builders in test code, give defaults that are always valid, and make each test state explicitly the values its assertion depends on. For database tests, prefer creating data in each test (or with `@Sql` scripts per test) over one huge shared dataset that couples tests together.",
      example: `public class OrderBuilder {
    private Long id = 1L;
    private String customerId = "customer-1";
    private Status status = Status.NEW;
    private List<OrderItem> items = new ArrayList<>(List.of(new OrderItem("KB-01", 1, new BigDecimal("49.99"))));

    public static OrderBuilder anOrder() { return new OrderBuilder(); }

    public OrderBuilder withStatus(Status status) { this.status = status; return this; }
    public OrderBuilder forCustomer(String customerId) { this.customerId = customerId; return this; }
    public OrderBuilder withItem(String sku, int qty, String price) {
        items.add(new OrderItem(sku, qty, new BigDecimal(price)));
        return this;
    }

    public Order build() { return new Order(id, customerId, status, List.copyOf(items)); }
}

@Test
void paidOrdersCanBeShipped() {
    Order order = anOrder().withStatus(Status.PAID).build();   // only what matters
    assertThat(shippingPolicy.canShip(order)).isTrue();
}`,
      interviewPoints: [
        "Builders with valid defaults; override what matters.",
        "Tests become short and resilient to model changes.",
        "Object Mother for named scenarios.",
        "Avoid large shared datasets.",
      ],
    },
    {
      id: 'archunit',
      title: 'Architecture tests with ArchUnit',
      explanation: "Architecture rules such as \"controllers must not call repositories directly\" or \"the domain package must not depend on Spring\" usually live in a wiki and slowly erode. ArchUnit lets you write them as ordinary JUnit tests that analyse the compiled classes, so a violating change fails the build.\n\nTypical rules: layer dependencies (controller to service to repository), no cycles between packages, naming conventions (classes annotated with @RestController end with Controller), no use of forbidden APIs (java.util.Date, field injection with @Autowired, System.out). Spring Modulith builds on the same idea to verify module boundaries in a modular monolith.",
      example: `@AnalyzeClasses(packages = "com.shop", importOptions = ImportOption.DoNotIncludeTests.class)
class ArchitectureTest {

    @ArchTest
    static final ArchRule layers = layeredArchitecture().consideringAllDependencies()
        .layer("Controller").definedBy("..controller..")
        .layer("Service").definedBy("..service..")
        .layer("Repository").definedBy("..repository..")
        .whereLayer("Controller").mayNotBeAccessedByAnyLayer()
        .whereLayer("Service").mayOnlyBeAccessedByLayers("Controller")
        .whereLayer("Repository").mayOnlyBeAccessedByLayers("Service");

    @ArchTest
    static final ArchRule noFieldInjection = noFields()
        .should().beAnnotatedWith(Autowired.class)
        .because("use constructor injection");

    @ArchTest
    static final ArchRule noCycles = slices().matching("com.shop.(*)..").should().beFreeOfCycles();
}`,
      interviewPoints: [
        "Architecture rules as executable tests.",
        "Layering, cycles, naming, forbidden APIs.",
        "Fails the build on violations.",
        "Spring Modulith for module boundaries.",
      ],
    },
    {
      id: 'mutation-testing',
      title: 'Mutation testing with PIT',
      explanation: "Code coverage says which lines ran during tests, not whether the tests would notice a bug. A test that calls a method but asserts nothing gives 100% coverage. Mutation testing measures test quality directly: the tool makes small changes (mutants) to your code, such as replacing `>` with `>=`, `+` with `-`, or returning null, and runs the tests against each mutant. If a test fails, the mutant is killed; if all tests still pass, it survived, which reveals a missing or weak assertion.\n\nPIT (pitest) is the standard Java tool and integrates with Maven, Gradle and JUnit 5. It is slower than a normal test run, so it is typically run on important modules, on changed code only, or nightly, rather than on every build.",
      example: `// production code
public boolean isFreeShipping(BigDecimal total) {
    return total.compareTo(new BigDecimal("50")) >= 0;
}

// weak test: 100% line coverage, but the mutant ">= -> >" survives
@Test
void freeShippingForLargeOrders() {
    assertThat(policy.isFreeShipping(new BigDecimal("80"))).isTrue();
}

// strong test: checks the boundary, kills the mutant
@Test
void freeShippingStartsAtExactlyFifty() {
    assertThat(policy.isFreeShipping(new BigDecimal("50.00"))).isTrue();
    assertThat(policy.isFreeShipping(new BigDecimal("49.99"))).isFalse();
}

<!-- pom.xml -->
<plugin>
    <groupId>org.pitest</groupId>
    <artifactId>pitest-maven</artifactId>
    <dependencies>
        <dependency>
            <groupId>org.pitest</groupId>
            <artifactId>pitest-junit5-plugin</artifactId>
        </dependency>
    </dependencies>
</plugin>
$ mvn test org.pitest:pitest-maven:mutationCoverage`,
      interviewPoints: [
        "Coverage shows execution, not verification.",
        "Mutants: small code changes the tests should catch.",
        "Surviving mutants reveal weak assertions.",
        "PIT; run selectively because it is slow.",
      ],
    },
    {
      id: 'flaky-tests',
      title: 'Finding and fixing flaky tests',
      explanation: "A flaky test sometimes passes and sometimes fails without any code change. Flaky tests destroy trust: people start re-running builds and ignoring red results, and real bugs slip through. Common causes: fixed sleeps with asynchronous code; dependence on the current time or time zone; test order dependence through shared static state, a shared database or a Spring context modified by one test (for example with @MockitoBean changes or leftover data); relying on iteration order of HashMap or HashSet; random data without a fixed seed; fixed ports; and real external services.\n\nFixes: Awaitility instead of sleeps, an injected Clock, cleaning up or isolating data per test (transactions rolled back, unique IDs, Testcontainers), random ports, deterministic seeds, and no calls to real external systems. JUnit's `@RepeatedTest` or running tests in random order (`junit.jupiter.testmethod.order.default=org.junit.jupiter.api.MethodOrderer$Random`) helps reproduce order problems. Quarantine a flaky test with a ticket rather than leaving it failing randomly.",
      example: `Symptom                               Likely cause                   Fix
------------------------------------  -----------------------------  ---------------------------------
fails on CI, passes locally           timing, slower machine         Awaitility, no sleeps
fails around midnight / month end     LocalDate.now()                inject Clock
fails only when run with other tests  shared state, leftover data    isolate data, @Transactional tests
fails with "port already in use"      fixed ports                    RANDOM_PORT, dynamic ports
assertion on list order fails         HashMap/HashSet ordering       assert without order, or sort
fails occasionally with random data   unseeded Random                fixed seed, print the seed

# junit-platform.properties: surface order dependence
junit.jupiter.testmethod.order.default=org.junit.jupiter.api.MethodOrderer$Random`,
      interviewPoints: [
        "Flaky tests destroy trust in the suite.",
        "Causes: sleeps, time, shared state, ordering, ports, randomness.",
        "Fixes: Awaitility, Clock, isolation, random ports, seeds.",
        "Quarantine with a ticket, never ignore.",
      ],
    },
  ],

  commonMistakes: [
    "Mocking your own HTTP client class instead of testing it against WireMock or MockRestServiceServer.",
    "Relying only on end-to-end tests to catch breaking API changes between services.",
    "Writing contract tests with exact values everywhere, making them break on harmless changes.",
    "Using Thread.sleep to wait for async code, Kafka listeners or scheduled jobs.",
    "Calling LocalDate.now() or Instant.now() directly in business logic, making time-based rules untestable.",
    "Building huge objects inline in every test instead of using test data builders.",
    "Sharing one big dataset between tests, so they depend on each other and on execution order.",
    "Chasing 100% line coverage while assertions are weak; mutation testing reveals it.",
    "Using @EmbeddedKafka or H2 and assuming production behaviour is identical.",
    "Ignoring or re-running flaky tests instead of fixing their root cause.",
    "Keeping architecture rules only in documentation, where they are not enforced.",
  ],

  interviewTips: [
    "Explain why mocking an HTTP client with Mockito tests too little, and propose WireMock.",
    "Describe contract testing as the fix for \"both sides green, production broken\", and name Spring Cloud Contract and Pact.",
    "Mention Awaitility whenever async code or messaging comes up in a testing question.",
    "Show you design for testability: injected Clock, injected randomness, constructor injection.",
    "Bring up mutation testing when asked about coverage targets.",
    "Have a concrete flaky-test story: the cause and how you fixed it.",
  ],

  interviewQuestions: [
    {
      id: 'testing-advanced-q1',
      question: "How do you test code that calls another service over HTTP?",
      answer: "For focused tests of request building and response mapping, use @RestClientTest with MockRestServiceServer, which intercepts RestTemplate or RestClient calls without a network. For more realistic tests, use WireMock: it runs a real HTTP server with stubbed responses, so the production client code is exercised over the network, including URL encoding, headers, JSON mapping, timeouts and error handling. Stub success, error statuses, malformed bodies and slow responses to test timeouts, retries and circuit breakers, and verify the requests that were sent. Point the application at WireMock's dynamic port with @DynamicPropertySource. To make sure the stubs match the real provider, add contract tests. Mocking the client class itself with Mockito is fine when testing the calling service's logic, but it tests nothing about the HTTP integration.",
      points: [
        "MockRestServiceServer for fast slice tests.",
        "WireMock for real HTTP behaviour and failures.",
        "Test timeouts, retries, error mapping.",
        "Contract tests keep stubs honest.",
      ],
      difficulty: 'Intermediate',
    },
    {
      id: 'testing-advanced-q2',
      question: "What is consumer-driven contract testing and why is it useful for microservices?",
      answer: "A contract describes an interaction between a consumer and a provider: the request the consumer sends and the response it relies on. In consumer-driven contract testing, consumers define these contracts. The consumer's tests run against a stub generated from the contracts, and the provider's build automatically verifies its real API against every consumer's contracts. If the provider makes a change that breaks a consumer, for example renaming or removing a field, its build fails before deployment. This catches integration problems early and quickly, without slow and brittle end-to-end environments, and tells providers which parts of their API are actually used. Spring Cloud Contract suits Spring-to-Spring teams, generating provider tests and stub jars; Pact is language-agnostic and uses a Pact Broker to share contracts and verification results, including a can-i-deploy check.",
      points: [
        "Contracts define expected interactions.",
        "Consumer uses generated stubs; provider verifies.",
        "Breaking changes fail the provider build.",
        "Spring Cloud Contract vs Pact.",
      ],
      difficulty: 'Intermediate',
    },
    {
      id: 'testing-advanced-q3',
      question: "How do you test a Kafka consumer in Spring Boot?",
      answer: "Test the listener's business logic in a plain unit test by calling the listener method or the service it delegates to. Test the JSON serialization of events separately. For an integration test, start a real broker: a Kafka Testcontainer with @ServiceConnection is closest to production, while @EmbeddedKafka is faster but less realistic. Send a message with KafkaTemplate, then wait for the observable effect, such as a database row or a call to a stubbed service, using Awaitility with a timeout rather than Thread.sleep. Also test failure paths: a message that fails processing should be retried and end up in the dead-letter topic, which you can check by consuming from it in the test. Make sure consumers use unique group ids per test run or that the topic is fresh, so tests do not interfere.",
      points: [
        "Unit-test listener logic directly.",
        "Testcontainers Kafka or @EmbeddedKafka.",
        "Awaitility for the effect.",
        "Test retries and dead-letter topics.",
      ],
      difficulty: 'Intermediate',
    },
    {
      id: 'testing-advanced-q4',
      question: "Why is Thread.sleep bad in tests, and what do you use instead?",
      answer: "A fixed sleep has to guess how long the asynchronous work takes. If the guess is too long, every test run wastes that time and the suite becomes slow; if it is too short, the test fails randomly on slower or busier machines such as CI servers, which makes it flaky. Instead, wait for the condition itself with a timeout. Awaitility polls a condition or an assertion until it succeeds, returning immediately when it does and failing with a clear message after atMost. For futures, call get with a timeout; for latches, await with a timeout. Where possible, also make code testable synchronously, for example by injecting a synchronous executor in unit tests.",
      example: `await().atMost(Duration.ofSeconds(5))
       .untilAsserted(() -> assertThat(repository.findByOrderId(42L)).isPresent());`,
      points: [
        "Sleeps are slow or flaky.",
        "Wait for the condition with a timeout.",
        "Awaitility untilAsserted.",
        "Synchronous executors in unit tests.",
      ],
      difficulty: 'Beginner',
    },
    {
      id: 'testing-advanced-q5',
      question: "How do you test code that depends on the current date or time?",
      answer: "Do not call LocalDate.now(), LocalDateTime.now() or Instant.now() without arguments in business logic. Inject a java.time.Clock, registered as a bean returning Clock.systemUTC() in production, and call now(clock). In tests, construct the class with Clock.fixed(instant, zone) to freeze time at a chosen moment, or use a small mutable test clock that can be advanced, so you can test boundaries such as exactly at expiry, one second before and one second after, month ends, leap years and time zones. The same approach applies to other non-deterministic inputs such as random numbers and UUIDs.",
      points: [
        "Inject Clock; avoid argument-less now().",
        "Clock.fixed in tests.",
        "Test boundaries precisely.",
        "Same for randomness and IDs.",
      ],
      difficulty: 'Beginner',
    },
    {
      id: 'testing-advanced-q6',
      question: "Is high code coverage enough to trust a test suite? What is mutation testing?",
      answer: "No. Coverage only shows which lines were executed while tests ran; a test with no assertions can achieve 100% coverage. Mutation testing measures whether tests actually detect faults. A tool like PIT creates many slightly modified versions of the code, called mutants, for example by changing a conditional boundary, negating a condition, replacing arithmetic operators or returning default values. It runs the tests against each mutant. If a test fails, the mutant is killed; if all tests pass, it survived, meaning no test checks that behaviour. The mutation score is the share of killed mutants. Surviving mutants point to missing edge-case tests or weak assertions. Because it is expensive, it is usually run on critical modules, incrementally on changed code, or in nightly builds.",
      points: [
        "Coverage measures execution, not verification.",
        "Mutants simulate bugs.",
        "Surviving mutants reveal weak tests.",
        "PIT; run selectively.",
      ],
      difficulty: 'Intermediate',
    },
    {
      id: 'testing-advanced-q7',
      question: "What causes flaky tests and how do you fix them?",
      answer: "Common causes are timing assumptions with asynchronous code (fixed sleeps), dependence on the current time, date or time zone, shared state between tests (static fields, a shared database, a Spring context modified by one test, leftover data), dependence on execution order, iteration order of unordered collections, unseeded randomness, fixed ports that may already be in use, and calls to real external services or networks. Fixes: wait for conditions with Awaitility; inject a Clock; isolate test data by rolling back transactions, cleaning up, or using unique identifiers and Testcontainers; use random ports; avoid asserting on the order of unordered collections; seed randomness and log the seed; and stub external services with WireMock. To reproduce, run the test repeatedly with @RepeatedTest or in random order. A flaky test should be quarantined with a ticket and fixed, never simply re-run until green.",
      points: [
        "Timing, time, shared state, order, randomness, ports, externals.",
        "Awaitility, Clock, isolation, random ports, seeds.",
        "Reproduce with repetition and random order.",
        "Quarantine and fix, do not ignore.",
      ],
      difficulty: 'Intermediate',
    },
    {
      id: 'testing-advanced-q8',
      question: "How can you enforce architecture rules in a Java project?",
      answer: "Use ArchUnit, which analyses compiled bytecode in ordinary JUnit tests. You can express rules such as layered architecture constraints (controllers may use services but not repositories), no dependency cycles between packages, domain classes must not depend on Spring or JPA, naming conventions for classes with certain annotations, bans on field injection or on legacy APIs such as java.util.Date, and restrictions on which packages may access others. Violations fail the build, so the architecture is enforced continuously instead of eroding. For modular monoliths, Spring Modulith verifies module boundaries and documents them. Static analysis tools such as SonarQube and Checkstyle complement this for code-level rules.",
      points: [
        "ArchUnit rules as JUnit tests.",
        "Layers, cycles, naming, forbidden APIs.",
        "Build fails on violations.",
        "Spring Modulith for module boundaries.",
      ],
      difficulty: 'Intermediate',
    },
    {
      id: 'testing-advanced-q9',
      question: "How would you design the test strategy for an order service that calls an inventory service and publishes events to Kafka?",
      answer: "Follow the testing pyramid. Many fast unit tests for domain rules and services, using test data builders and an injected Clock, with collaborators mocked. Slice tests: @WebMvcTest for controllers with MockMvc, @DataJpaTest with a PostgreSQL Testcontainer for repositories, and @RestClientTest or WireMock tests for the inventory client, including timeouts, retries and error mapping. Contract tests with Spring Cloud Contract or Pact so the inventory client's expectations are verified by the inventory service's build, and the order events consumed by other services are covered by message contracts. A few integration tests with @SpringBootTest, PostgreSQL and Kafka Testcontainers, WireMock for inventory, and Awaitility to check that placing an order saves it and publishes the event, including the outbox relay if used. Add ArchUnit rules for layering and optionally mutation testing on the core domain. Keep end-to-end tests to a handful of critical journeys in a shared environment.",
      points: [
        "Unit tests for domain rules.",
        "Slices + WireMock for HTTP client.",
        "Contract tests for HTTP and messages.",
        "Few full integration tests; minimal end-to-end.",
      ],
      difficulty: 'Advanced',
    },
  ],
}

export default topic
