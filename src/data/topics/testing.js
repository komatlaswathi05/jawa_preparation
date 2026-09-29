const topic = {
  id: 'testing',
  category: 'testing',
  title: 'Testing',
  description: 'Unit and integration testing for Spring Boot with JUnit 5, Mockito, MockMvc, test slices, Testcontainers and JaCoCo coverage.',
  difficulty: 'Intermediate',
  overview: "Automated tests are small programs that check your real code behaves as expected. They let you change code with confidence: if you break something, a test fails in seconds instead of a customer finding the bug in production. Think of them like the safety checks a mechanic runs after a repair: quick, repeatable, and they catch problems before the car is back on the road.\n\nIn the Java world the standard tools are JUnit 5 (to write and run tests), AssertJ (readable assertions) and Mockito (to replace real dependencies with fakes). Spring Boot adds `spring-boot-starter-test`, which bundles all of these plus Spring's testing support: `@SpringBootTest` for full integration tests and test slices like `@WebMvcTest` and `@DataJpaTest` that load only one layer.\n\nA healthy project follows the testing pyramid: many fast unit tests, fewer integration tests, and a handful of end-to-end tests. Interviewers want to know that you can test each layer (controller, service, repository), know when to mock and when not to, and can use real databases in tests with Testcontainers.",

  subtopics: [
    {
      id: 'unit-testing',
      title: 'Unit testing',
      explanation: "A unit test checks one small piece of code, usually one class or method, in isolation. Dependencies such as repositories or HTTP clients are replaced with mocks, so the test runs in milliseconds and fails only because of the code under test.\n\nA good unit test follows Arrange-Act-Assert (or Given-When-Then): set up the data, call the method, check the result. It does not start Spring, touch a database or call the network.",
      example: `class PriceCalculatorTest {

    private final PriceCalculator calculator = new PriceCalculator();

    @Test
    void appliesTenPercentDiscountForOrdersOver100() {
        // Arrange
        BigDecimal total = new BigDecimal("200.00");

        // Act
        BigDecimal result = calculator.applyDiscount(total);

        // Assert
        assertThat(result).isEqualByComparingTo("180.00");
    }
}`,
      interviewPoints: [
        'Tests one unit in isolation; dependencies are mocked.',
        'Fast (milliseconds), no Spring context, no database.',
        'Structure: Arrange-Act-Assert / Given-When-Then.',
      ],
    },
    {
      id: 'integration-testing',
      title: 'Integration testing',
      explanation: "An integration test checks that several parts work together correctly: your controller with Spring MVC and JSON serialization, your repository with a real database, or the whole application end to end. They are slower than unit tests but catch problems unit tests cannot, like wrong SQL, missing configuration or broken JSON mapping.\n\nIn Spring Boot you use `@SpringBootTest` for the full application or slice annotations (`@WebMvcTest`, `@DataJpaTest`) for one layer, often with Testcontainers for real infrastructure.",
      interviewPoints: [
        'Tests collaboration between components or with real infrastructure.',
        'Slower, so fewer of them than unit tests.',
        'Catches configuration, mapping and SQL problems.',
      ],
    },
    {
      id: 'junit5',
      title: 'JUnit 5 annotations & assertions',
      explanation: "JUnit 5 (JUnit Jupiter) is the standard test framework. Key annotations: `@Test` marks a test method, `@BeforeEach` / `@AfterEach` run before/after every test, `@BeforeAll` / `@AfterAll` run once per class (static methods), `@DisplayName` gives a readable name, `@Disabled` skips a test and `@Nested` groups related tests.\n\nAssertions from `org.junit.jupiter.api.Assertions` include `assertEquals`, `assertTrue`, `assertNotNull`, `assertThrows` and `assertAll`. Many teams prefer AssertJ (`assertThat(x).isEqualTo(y)`), which is included in `spring-boot-starter-test` and gives more readable failures. Test classes and methods do not need to be public in JUnit 5.",
      example: `class AccountTest {

    private Account account;

    @BeforeEach
    void setUp() {
        account = new Account(100);
    }

    @Test
    @DisplayName("withdraw reduces the balance")
    void withdraw() {
        account.withdraw(30);
        assertEquals(70, account.getBalance());
    }

    @Test
    void withdrawMoreThanBalanceThrows() {
        IllegalStateException ex = assertThrows(IllegalStateException.class,
                () -> account.withdraw(500));
        assertEquals("Insufficient funds", ex.getMessage());
    }

    @Test
    void groupedAssertions() {
        assertAll(
                () -> assertEquals(100, account.getBalance()),
                () -> assertTrue(account.isActive()));
    }
}`,
      interviewPoints: [
        '@BeforeEach runs before every test; @BeforeAll once per class (static).',
        'assertThrows returns the exception so you can inspect it.',
        'assertAll reports every failed assertion, not just the first.',
        'JUnit 5 replaced JUnit 4 annotations like @Before and @RunWith.',
      ],
    },
    {
      id: 'parameterized-tests',
      title: '@ParameterizedTest',
      explanation: "A parameterized test runs the same test method many times with different inputs, so you avoid copy-pasting tests. Supply inputs with `@ValueSource` (single values), `@CsvSource` (several columns per row), `@EnumSource`, or `@MethodSource` (a static method returning a stream of arguments).",
      example: `@ParameterizedTest
@ValueSource(strings = {"racecar", "level", "noon"})
void isPalindrome(String word) {
    assertTrue(StringUtils.isPalindrome(word));
}

@ParameterizedTest(name = "{0} + {1} = {2}")
@CsvSource({
        "1, 2, 3",
        "5, 5, 10",
        "-1, 1, 0"
})
void adds(int a, int b, int expected) {
    assertEquals(expected, calculator.add(a, b));
}

static Stream<Arguments> discounts() {
    return Stream.of(
            Arguments.of(50, 50),
            Arguments.of(200, 180));
}

@ParameterizedTest
@MethodSource("discounts")
void discount(int total, int expected) {
    assertEquals(expected, calculator.applyDiscount(total));
}`,
      interviewPoints: [
        'Use @ParameterizedTest instead of @Test.',
        'Sources: @ValueSource, @CsvSource, @EnumSource, @MethodSource.',
        'Great for boundary values and edge cases.',
      ],
    },
    {
      id: 'mockito',
      title: 'Mockito, @Mock and @InjectMocks',
      explanation: "Mockito creates mocks: fake objects that implement the same interface as a real dependency but do nothing unless told to. This lets you test a service without a real database.\n\nAdd `@ExtendWith(MockitoExtension.class)` to the test class. `@Mock` creates a mock, and `@InjectMocks` creates the real class under test and injects the mocks into it (preferably through its constructor). No Spring context is involved, so these tests are fast.",
      example: `@ExtendWith(MockitoExtension.class)
class OrderServiceTest {

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private PaymentClient paymentClient;

    @InjectMocks
    private OrderService orderService;   // real object, mocks injected

    @Test
    void placesOrder() {
        // ...
    }
}`,
      interviewPoints: [
        '@Mock creates a fake dependency; @InjectMocks creates the real class and injects mocks.',
        'Needs @ExtendWith(MockitoExtension.class) in JUnit 5.',
        'Unstubbed mock methods return defaults: null, 0, false, empty collections.',
        '@Spy wraps a real object and lets you stub only some methods.',
      ],
    },
    {
      id: 'stubbing-verify',
      title: 'when/thenReturn & verify',
      explanation: "Stubbing tells a mock what to return: `when(repo.findById(1L)).thenReturn(Optional.of(order))`. Use `thenThrow` to simulate errors. Argument matchers like `any()`, `eq()` and `anyLong()` match flexible inputs, but if you use a matcher for one argument you must use matchers for all.\n\n`verify` checks that a method was called, and how often: `verify(repo).save(order)`, `verify(repo, never()).delete(any())`, `verify(client, times(2)).charge(any())`. `ArgumentCaptor` captures the actual argument so you can assert on it. For void methods use `doThrow(...).when(mock).method()`.",
      example: `@Test
void placeOrderChargesPaymentAndSaves() {
    Order order = new Order(1L, new BigDecimal("99.00"));
    when(paymentClient.charge(any(BigDecimal.class))).thenReturn(PaymentResult.SUCCESS);
    when(orderRepository.save(any(Order.class))).thenAnswer(inv -> inv.getArgument(0));

    Order saved = orderService.placeOrder(order);

    assertThat(saved.getStatus()).isEqualTo(OrderStatus.PAID);
    verify(paymentClient).charge(new BigDecimal("99.00"));

    ArgumentCaptor<Order> captor = ArgumentCaptor.forClass(Order.class);
    verify(orderRepository).save(captor.capture());
    assertThat(captor.getValue().getStatus()).isEqualTo(OrderStatus.PAID);
}

@Test
void paymentFailureDoesNotSave() {
    when(paymentClient.charge(any())).thenThrow(new PaymentException("declined"));

    assertThrows(PaymentException.class, () -> orderService.placeOrder(new Order(1L, BigDecimal.TEN)));
    verify(orderRepository, never()).save(any());
}`,
      interviewPoints: [
        'when(...).thenReturn(...) for stubbing; thenThrow for errors.',
        'verify(mock, times(n)/never()).method(...) for interactions.',
        'Mixing raw values and matchers in one call is an error; use eq().',
        'ArgumentCaptor inspects what was passed.',
      ],
    },
    {
      id: 'spring-boot-test',
      title: '@SpringBootTest',
      explanation: "`@SpringBootTest` starts the full Spring application context, just like running the app, so you can test real wiring between beans. By default it uses a mock web environment; `webEnvironment = RANDOM_PORT` starts a real server on a random port so you can call it with `TestRestTemplate` or `WebTestClient`.\n\nIt is the most realistic but also the slowest option. Spring caches the context between test classes with the same configuration, so avoid changing configuration (for example different mock beans) in every class, or each one will start a new context.",
      example: `@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class OrderApiIntegrationTest {

    @Autowired
    private TestRestTemplate restTemplate;

    @Test
    void createsAndFetchesOrder() {
        ResponseEntity<OrderDto> created = restTemplate.postForEntity(
                "/api/orders", new CreateOrderRequest("book", 2), OrderDto.class);

        assertThat(created.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(created.getBody().quantity()).isEqualTo(2);
    }
}`,
      interviewPoints: [
        'Loads the whole application context.',
        'RANDOM_PORT starts a real embedded server.',
        'Slowest option; context caching helps.',
        'Use it for end-to-end flows, not for every test.',
      ],
    },
    {
      id: 'webmvctest-mockmvc',
      title: '@WebMvcTest, MockMvc & controller testing',
      explanation: "`@WebMvcTest(OrderController.class)` loads only the web layer: the controller, `@ControllerAdvice`, JSON converters, filters and Spring Security, but not services or repositories. You replace the service with a mock bean.\n\n`MockMvc` sends fake HTTP requests to the controller without starting a server and lets you assert on status, headers and JSON body with `jsonPath`. This is the standard way to test controllers: request mapping, validation, status codes and error handling. If Spring Security is on the classpath, use `@WithMockUser` or `.with(csrf())` from `spring-security-test`.",
      example: `@WebMvcTest(OrderController.class)
class OrderControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private OrderService orderService;

    @Test
    @WithMockUser
    void returnsOrderAsJson() throws Exception {
        when(orderService.findById(1L)).thenReturn(new OrderDto(1L, "book", 2));

        mockMvc.perform(get("/api/orders/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.product").value("book"))
                .andExpect(jsonPath("$.quantity").value(2));
    }

    @Test
    @WithMockUser
    void rejectsInvalidRequest() throws Exception {
        mockMvc.perform(post("/api/orders")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\\"product\\": \\"\\", \\"quantity\\": 0}"))
                .andExpect(status().isBadRequest());
    }
}`,
      interviewPoints: [
        '@WebMvcTest loads only MVC components; services must be mocked.',
        'MockMvc performs requests without a real server.',
        'jsonPath asserts on the JSON response body.',
        'Use @WithMockUser and csrf() when security is enabled.',
      ],
    },
    {
      id: 'mockitobean',
      title: '@MockitoBean (and the older @MockBean)',
      explanation: "`@Mock` creates a plain Mockito mock that Spring knows nothing about. When a test starts a Spring context (`@WebMvcTest`, `@SpringBootTest`), you need the mock to replace a bean inside that context. That is what `@MockitoBean` does (Spring Framework 6.2 / Spring Boot 3.4+). `@MockitoSpyBean` does the same for spies.\n\nIn older code you will see `@MockBean` and `@SpyBean` from Spring Boot; they do the same job but were deprecated in Spring Boot 3.4. Remember that every different set of mock beans creates a different context, which slows down the test suite.",
      example: `// Spring Boot 3.4+
@MockitoBean
private PaymentClient paymentClient;

// Spring Boot 3.3 and earlier (deprecated since 3.4)
@MockBean
private PaymentClient paymentClient;`,
      interviewPoints: [
        '@Mock = plain Mockito, no Spring. @MockitoBean = replaces a bean in the Spring context.',
        '@MockitoBean is the Spring Boot 3.4+ replacement for @MockBean.',
        'Different mock bean sets prevent context caching.',
      ],
    },
    {
      id: 'service-testing',
      title: 'Service testing',
      explanation: "Services hold business logic, so they deserve the most unit tests. Test them as plain Java objects with Mockito: mock the repositories and clients, call the service method, then assert the result and verify side effects (saved entities, published events, calls to other services).\n\nCover the happy path, validation failures, not-found cases and exceptions thrown by dependencies. Constructor injection makes this easy because you can also create the service yourself with `new OrderService(mockRepo, mockClient)`.",
      example: `@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock UserRepository userRepository;
    @InjectMocks UserService userService;

    @Test
    void throwsWhenUserNotFound() {
        when(userRepository.findById(42L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> userService.getUser(42L))
                .isInstanceOf(UserNotFoundException.class)
                .hasMessageContaining("42");
    }
}`,
      interviewPoints: [
        'Unit test services with Mockito; no Spring context needed.',
        'Test happy path, edge cases and error paths.',
        'Constructor injection makes services easy to test.',
      ],
    },
    {
      id: 'datajpatest',
      title: '@DataJpaTest & repository testing',
      explanation: "`@DataJpaTest` loads only JPA components: entities, repositories, `EntityManager` and a `TestEntityManager`. Each test runs in a transaction that is rolled back at the end, so tests do not affect each other.\n\nBy default it replaces your datasource with an embedded database (like H2) if one is on the classpath. Because H2 behaves differently from PostgreSQL, a better practice is `@AutoConfigureTestDatabase(replace = Replace.NONE)` combined with Testcontainers so repository tests run against the real database engine. Test your custom queries and derived query methods; there is no value in testing `save` from Spring Data itself.",
      example: `@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@Testcontainers
class UserRepositoryTest {

    @Container
    @ServiceConnection
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine");

    @Autowired
    private UserRepository userRepository;

    @Test
    void findsActiveUsersByEmailDomain() {
        userRepository.save(new AppUser("asha@shop.com", true));
        userRepository.save(new AppUser("ravi@other.com", true));

        List<AppUser> result = userRepository.findActiveByEmailDomain("shop.com");

        assertThat(result).extracting(AppUser::getEmail).containsExactly("asha@shop.com");
    }
}`,
      interviewPoints: [
        '@DataJpaTest loads only the JPA layer.',
        'Each test is transactional and rolled back.',
        'Prefer the real database (Testcontainers) over H2 for accuracy.',
        'Test custom queries, not Spring Data built-ins.',
      ],
    },
    {
      id: 'testcontainers',
      title: 'Testcontainers',
      explanation: "Testcontainers is a library that starts real Docker containers (PostgreSQL, Redis, Kafka and more) from your tests and throws them away afterwards. You test against the same database engine you use in production, so SQL dialect, JSON columns and constraints behave identically.\n\nSince Spring Boot 3.1, `@ServiceConnection` automatically wires the container's URL, username and password into Spring's configuration, replacing the older `@DynamicPropertySource` boilerplate. Docker must be available where the tests run, including your CI server.",
      example: `@SpringBootTest
@Testcontainers
class OrderFlowIT {

    @Container
    @ServiceConnection
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine");

    @Container
    @ServiceConnection(name = "redis")
    static GenericContainer<?> redis = new GenericContainer<>("redis:7-alpine").withExposedPorts(6379);

    @Autowired
    private OrderService orderService;

    @Test
    void placesOrderEndToEnd() {
        OrderDto order = orderService.place(new CreateOrderRequest("book", 1));
        assertThat(order.id()).isNotNull();
    }
}`,
      interviewPoints: [
        'Real infrastructure in disposable Docker containers.',
        '@ServiceConnection (Boot 3.1+) auto-configures connection details.',
        'Static containers are shared by all tests in the class.',
        'Requires Docker in CI.',
      ],
    },
    {
      id: 'jacoco',
      title: 'Test coverage (JaCoCo)',
      explanation: "Code coverage measures which lines and branches were executed by your tests. JaCoCo is the standard Java tool; its Maven or Gradle plugin produces an HTML report and can fail the build if coverage drops below a threshold.\n\nCoverage shows what is not tested, but high coverage does not prove good tests: a test with no assertions still counts. Aim for meaningful coverage of business logic (often 70 to 80 percent) rather than chasing 100 percent. Branch coverage is more telling than line coverage.",
      example: `<plugin>
    <groupId>org.jacoco</groupId>
    <artifactId>jacoco-maven-plugin</artifactId>
    <version>0.8.12</version>
    <executions>
        <execution>
            <goals><goal>prepare-agent</goal></goals>
        </execution>
        <execution>
            <id>report</id>
            <phase>verify</phase>
            <goals><goal>report</goal></goals>
        </execution>
    </executions>
</plugin>
<!-- mvn verify, then open target/site/jacoco/index.html -->`,
      interviewPoints: [
        'Line vs branch coverage: branch coverage checks both sides of every if.',
        'Coverage finds untested code but does not measure test quality.',
        'Can enforce a minimum in CI with the check goal.',
      ],
    },
    {
      id: 'testing-pyramid',
      title: 'Testing pyramid',
      explanation: "The testing pyramid is a guideline for how many tests of each kind to write. The wide base is many fast unit tests. The middle is fewer integration tests (slices, Testcontainers). The narrow top is a few slow end-to-end or UI tests that exercise the whole system.\n\nThe opposite shape, the 'ice cream cone' with mostly manual or end-to-end tests, gives slow, flaky feedback. Fast tests near the base let developers run the suite constantly.",
      interviewPoints: [
        'Many unit, some integration, few end-to-end tests.',
        'Lower levels are faster, cheaper and more stable.',
        'Higher levels give more confidence that the system works as a whole.',
      ],
    },
  ],

  commonMistakes: [
    'Using @SpringBootTest for every test, making the suite slow when a plain unit test or a slice would do.',
    'Using @Mock in a @WebMvcTest instead of @MockitoBean, so Spring still has no bean and the context fails to start.',
    'Writing tests without real assertions just to raise coverage numbers.',
    'Mixing raw values and argument matchers in one stubbing, for example when(repo.find(any(), 5)), which throws InvalidUseOfMatchersException.',
    'Testing repositories only against H2 and then hitting SQL differences with PostgreSQL in production.',
    'Tests that depend on each other or on execution order, often through shared static state or leftover database rows.',
    'Over-mocking: mocking value objects or the class under test itself instead of just its dependencies.',
  ],

  interviewTips: [
    'Explain the testing pyramid first, then map each Spring tool to a level: Mockito for unit, slices for layer tests, @SpringBootTest plus Testcontainers for integration.',
    'Be clear about @Mock vs @MockitoBean, and mention that @MockBean is the pre-3.4 name.',
    'Describe how you test each layer: services with Mockito, controllers with @WebMvcTest and MockMvc, repositories with @DataJpaTest.',
    'Show judgement about coverage: useful signal, not a goal on its own.',
    'Mention real examples: testing validation errors return 400, testing an exception path with assertThrows, verifying no save happens on failure.',
  ],

  interviewQuestions: [
    {
      id: 'testing-q1',
      question: 'What is the difference between unit tests and integration tests?',
      answer: "A unit test checks one class or method in isolation, with its dependencies replaced by mocks. It runs in milliseconds, needs no Spring context or database and pinpoints exactly what broke.\n\nAn integration test checks that several components work together or with real infrastructure: a controller with Spring MVC, a repository with a real database, or the full application. It is slower but catches problems unit tests miss, like wrong SQL, misconfigured beans or JSON mapping errors. A good suite has many unit tests and fewer integration tests.",
      points: [
        'Unit: isolated, mocked dependencies, very fast.',
        'Integration: real collaboration, slower, catches wiring and infrastructure issues.',
        'Both are needed; follow the testing pyramid.',
      ],
      difficulty: 'Beginner',
    },
    {
      id: 'testing-q2',
      question: 'What are the most important JUnit 5 annotations?',
      answer: "`@Test` marks a test method. `@BeforeEach` and `@AfterEach` run before and after every test, for setup and cleanup. `@BeforeAll` and `@AfterAll` run once for the whole class and must be static (unless you use `@TestInstance(PER_CLASS)`). `@DisplayName` gives readable names, `@Disabled` skips a test, `@Nested` groups tests in inner classes, `@ParameterizedTest` runs a test with multiple inputs, and `@ExtendWith` registers extensions such as `MockitoExtension` or `SpringExtension`.",
      points: [
        '@Test, @BeforeEach, @AfterEach, @BeforeAll, @AfterAll.',
        '@DisplayName, @Disabled, @Nested.',
        '@ParameterizedTest and @ExtendWith.',
      ],
      difficulty: 'Beginner',
    },
    {
      id: 'testing-q3',
      question: 'What is Mockito and what is the difference between @Mock and @InjectMocks?',
      answer: "Mockito is a library that creates mock objects: fake implementations of dependencies whose behaviour you control in a test. This lets you test a class without its real collaborators such as databases or remote APIs.\n\n`@Mock` creates a mock of a dependency. `@InjectMocks` creates a real instance of the class under test and injects the `@Mock` fields into it, trying constructor injection first, then setters, then fields. You enable them with `@ExtendWith(MockitoExtension.class)`.",
      example: `@ExtendWith(MockitoExtension.class)
class InvoiceServiceTest {
    @Mock InvoiceRepository repository;
    @InjectMocks InvoiceService service;
}`,
      points: [
        '@Mock = fake dependency.',
        '@InjectMocks = real class under test with mocks injected.',
        'Requires MockitoExtension in JUnit 5.',
      ],
      difficulty: 'Beginner',
    },
    {
      id: 'testing-q4',
      question: 'How do when/thenReturn and verify differ in Mockito?',
      answer: "`when(...).thenReturn(...)` is stubbing: it defines what a mock returns when called, so the code under test gets the data it needs. It prepares the input side of a test. `thenThrow` is the variant for simulating errors.\n\n`verify(...)` checks interactions afterwards: that a method was called, with which arguments and how many times, for example `verify(repo).save(order)` or `verify(emailClient, never()).send(any())`. Use it for side effects that have no return value. Avoid verifying every call you already stubbed, which makes tests brittle.",
      example: `when(userRepository.findById(1L)).thenReturn(Optional.of(user));

userService.deactivate(1L);

verify(userRepository).save(argThat(u -> !u.isActive()));
verify(auditClient, times(1)).log(anyString());`,
      points: [
        'Stubbing controls return values (input side).',
        'verify asserts on interactions (output side).',
        'times(), never(), atLeastOnce() control call counts.',
      ],
      difficulty: 'Beginner',
    },
    {
      id: 'testing-q5',
      question: 'What is the difference between @SpringBootTest, @WebMvcTest and @DataJpaTest?',
      answer: "`@SpringBootTest` loads the entire application context. It is used for integration tests of full flows and can start a real server with `RANDOM_PORT`, but it is the slowest.\n\n`@WebMvcTest` is a slice that loads only the web layer: controllers, advice, converters, filters and security. Services must be provided as mock beans, and you test with `MockMvc`. `@DataJpaTest` loads only JPA: entities, repositories and the EntityManager, runs each test in a rolled-back transaction and by default uses an embedded database. Slices start faster and keep tests focused on one layer.",
      points: [
        '@SpringBootTest: full context, slowest, most realistic.',
        '@WebMvcTest: controllers only, use MockMvc and mock services.',
        '@DataJpaTest: repositories only, transactional rollback.',
      ],
      difficulty: 'Intermediate',
    },
    {
      id: 'testing-q6',
      question: 'What is the difference between @Mock and @MockitoBean (or @MockBean)?',
      answer: "`@Mock` is pure Mockito. It creates a mock inside a plain unit test and Spring is not involved at all.\n\n`@MockitoBean` (Spring Boot 3.4+, from Spring Framework 6.2) creates a Mockito mock and registers it in the Spring application context, replacing any existing bean of that type. You use it in `@WebMvcTest` or `@SpringBootTest` when Spring needs to inject the mock into other beans, such as a mocked service inside a controller. `@MockBean` is the older Spring Boot annotation with the same purpose, deprecated since 3.4. Each unique combination of mock beans creates a new cached context, so use them sparingly.",
      points: [
        '@Mock: no Spring context.',
        '@MockitoBean: replaces a bean inside the Spring context.',
        '@MockBean is the deprecated pre-3.4 equivalent.',
        'Too many variants slow tests by preventing context reuse.',
      ],
      difficulty: 'Intermediate',
    },
    {
      id: 'testing-q7',
      question: 'How do you test a REST controller in Spring Boot?',
      answer: "Use `@WebMvcTest(MyController.class)` so only the web layer loads, mock the service with `@MockitoBean`, and inject `MockMvc`. Then perform requests with `mockMvc.perform(get(...))` or `post(...)` with a JSON body and assert on status, headers and the JSON response using `jsonPath`.\n\nTest the mapping, request validation (for example that invalid input returns 400), exception handling from `@ControllerAdvice` (for example 404 when the service throws not-found) and security rules using `@WithMockUser`. Business logic itself belongs in service tests.",
      example: `@Test
@WithMockUser
void returns404WhenOrderMissing() throws Exception {
    when(orderService.findById(99L)).thenThrow(new OrderNotFoundException(99L));

    mockMvc.perform(get("/api/orders/99"))
            .andExpect(status().isNotFound())
            .andExpect(jsonPath("$.message").value("Order 99 not found"));
}`,
      points: [
        '@WebMvcTest + MockMvc + @MockitoBean service.',
        'Assert status codes and JSON with jsonPath.',
        'Cover validation, error handling and security.',
      ],
      difficulty: 'Intermediate',
    },
    {
      id: 'testing-q8',
      question: 'What is a parameterized test and when would you use it?',
      answer: "A parameterized test runs one test method several times with different arguments. You annotate it with `@ParameterizedTest` and provide data with a source such as `@ValueSource`, `@CsvSource`, `@EnumSource` or `@MethodSource`.\n\nUse it when the same logic must be checked for many inputs, such as validation rules, boundary values (0, 1, max), or a calculation table. It removes duplicated tests and each case appears separately in the report.",
      example: `@ParameterizedTest
@CsvSource({"0, false", "17, false", "18, true", "65, true"})
void isAdult(int age, boolean expected) {
    assertEquals(expected, AgeRules.isAdult(age));
}`,
      points: [
        'One method, many inputs.',
        'Sources: ValueSource, CsvSource, EnumSource, MethodSource.',
        'Ideal for boundary and edge cases.',
      ],
      difficulty: 'Intermediate',
    },
    {
      id: 'testing-q9',
      question: 'Why and how would you use Testcontainers instead of H2 for tests?',
      answer: "H2 is an in-memory database that only imitates PostgreSQL or MySQL. Features like JSONB, specific functions, locking behaviour, sequences or native queries can behave differently or not work at all, so tests may pass on H2 and fail in production.\n\nTestcontainers starts the real database in a Docker container for the test run. In Spring Boot 3.1+ you declare a static `@Container` field with `@ServiceConnection` and Spring automatically points the datasource at it. Combined with `@DataJpaTest` (with `replace = NONE`) or `@SpringBootTest`, you get realistic tests. The cost is slower startup and a Docker requirement in CI, which you reduce by reusing containers across tests.",
      example: `@Container
@ServiceConnection
static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine");`,
      points: [
        'H2 differs from production databases in SQL dialect and features.',
        'Testcontainers runs the real engine in Docker.',
        '@ServiceConnection removes manual property wiring.',
        'Needs Docker; share containers to keep tests fast.',
      ],
      difficulty: 'Advanced',
    },
    {
      id: 'testing-q10',
      question: 'Is 100 percent code coverage a good goal?',
      answer: "Not usually. Coverage tools like JaCoCo only show which lines or branches ran during tests; they do not check whether the tests assert anything meaningful. You can reach 100 percent with tests that assert nothing, and chasing the last few percent often means testing trivial getters or framework code, which adds maintenance cost without catching bugs.\n\nA better approach is to require solid coverage of business logic (commonly 70 to 80 percent, with attention to branch coverage), review untested areas in the report, and judge test quality through code review. Mutation testing tools like PIT can measure whether tests actually detect changes in the code.",
      points: [
        'Coverage measures execution, not correctness.',
        'Focus on business logic and branch coverage.',
        'Use JaCoCo thresholds as a safety net, not a target.',
        'Mutation testing (PIT) measures test effectiveness.',
      ],
      difficulty: 'Advanced',
    },
    {
      id: 'testing-q11',
      question: 'How do you keep a large Spring Boot test suite fast?',
      answer: "Follow the testing pyramid so most tests are plain unit tests with no Spring context. Use test slices (`@WebMvcTest`, `@DataJpaTest`) instead of `@SpringBootTest` when only one layer is involved.\n\nTake advantage of Spring's context caching: keep the configuration of integration tests consistent, avoid many different `@MockitoBean` combinations, and avoid `@DirtiesContext`, all of which force new contexts. Share Testcontainers across test classes (for example a common base class with static containers). Finally, run tests in parallel where possible and separate slow integration tests (Maven Failsafe) from fast unit tests (Surefire).",
      points: [
        'Mostly unit tests, then slices, few full-context tests.',
        'Context caching: consistent config, avoid @DirtiesContext.',
        'Reuse containers across classes.',
        'Split unit and integration test phases.',
      ],
      difficulty: 'Advanced',
    },
    {
      id: 'testing-q12',
      question: 'How do you test code that uses Spring Security?',
      answer: "Add `spring-security-test`. In `@WebMvcTest` or `@SpringBootTest` with MockMvc, the security filter chain is applied, so unauthenticated requests get 401 or 403. Use `@WithMockUser(roles = \"ADMIN\")` to run a test as a fake authenticated user, or request post-processors like `.with(user(\"asha\").roles(\"USER\"))` and `.with(jwt())` for JWT resource servers. State-changing requests in session-based apps also need `.with(csrf())`.\n\nWrite both positive and negative tests: the admin endpoint works for an admin, returns 403 for a normal user and 401 without login. For method security, call the service in a Spring test with `@WithMockUser` and assert `AccessDeniedException` is thrown for the wrong role.",
      example: `@Test
@WithMockUser(roles = "USER")
void normalUserCannotDelete() throws Exception {
    mockMvc.perform(delete("/api/admin/products/1").with(csrf()))
            .andExpect(status().isForbidden());
}

@Test
void anonymousGets401() throws Exception {   // assumes a stateless API chain (form login would redirect with 302)
    mockMvc.perform(get("/api/orders"))
            .andExpect(status().isUnauthorized());
}`,
      points: [
        'spring-security-test provides @WithMockUser, user(), jwt(), csrf().',
        'Test allowed, forbidden (403) and unauthenticated (401) cases.',
        'Method security can be tested by expecting AccessDeniedException.',
      ],
      difficulty: 'Advanced',
    },
  ],
}

export default topic
