const topic = {
  id: 'spring-beans',
  category: 'spring',
  title: 'Spring Beans',
  description: 'What beans are, how Spring finds and creates them, their scopes and lifecycle, stereotype annotations, profiles and lazy initialization.',
  difficulty: 'Intermediate',
  overview: "A bean is simply a Java object that is created and managed by the Spring container. Your services, repositories, controllers and configuration objects are all beans. Spring decides when to create them, how many copies to keep, which dependencies to give them, and when to destroy them.\n\nThink of the container as a hotel front desk. Guests (your classes) do not build their own rooms; the hotel prepares them, keeps track of who is in which room, provides room service, and cleans up at checkout. Bean scopes decide whether everyone shares one room (singleton) or each guest gets a new one (prototype), and lifecycle callbacks are the check-in and checkout steps.\n\nIn this topic you will learn how Spring discovers beans through component scanning and `@Bean` methods, the meaning of stereotype annotations such as `@Service` and `@Repository`, how scopes and lifecycle callbacks work, and how profiles and lazy initialization control which beans are created and when.",

  subtopics: [
    {
      id: 'beans',
      title: 'Beans',
      explanation: "A Spring bean is an object whose creation, wiring and lifecycle are managed by the IoC container. Each bean has a bean definition that describes its class, scope, dependencies and lifecycle methods, and a name (id) that identifies it.\n\nAn ordinary object you create with `new` is not a bean, even if its class has Spring annotations. Only objects registered in the container are beans.",
      example: `@Service // registered as a bean named "orderService"
public class OrderService {
    public String status() {
        return "ok";
    }
}`,
      interviewPoints: [
        'Bean = object managed by the Spring container.',
        'Default bean name: class name with lowercase first letter, or @Bean method name.',
        'Objects created with new are not beans.',
      ],
    },
    {
      id: 'bean-scopes',
      title: 'Bean scopes',
      explanation: "A bean's scope decides how many instances Spring creates and how long they live. The core scopes are `singleton` (the default: one instance per container) and `prototype` (a new instance every time the bean is requested).\n\nWeb-aware applications also get `request`, `session`, `application` and `websocket` scopes. You set the scope with `@Scope`, or use shortcuts like `@RequestScope` and `@SessionScope`.",
      example: `@Component
@Scope("prototype") // or @Scope(ConfigurableBeanFactory.SCOPE_PROTOTYPE)
public class ReportBuilder { }`,
      interviewPoints: [
        'Default scope is singleton.',
        'Core: singleton, prototype. Web: request, session, application, websocket.',
      ],
    },
    {
      id: 'singleton-scope',
      title: 'Singleton scope',
      explanation: "A singleton bean has exactly one shared instance per Spring container, created at startup by default and reused for every injection. Most service, repository and controller beans are singletons.\n\nBecause many threads (for example, concurrent HTTP requests) use the same instance, singletons should be stateless or thread-safe. Never store per-request data such as the current user in a singleton's fields. Note that a Spring singleton is one instance per container, which is different from the Gang of Four Singleton pattern, which is one instance per class loader.",
      example: `@Service
public class CounterService {
    // BAD: shared mutable state in a singleton, not thread-safe
    private int count;

    // BETTER: thread-safe type if state is truly needed
    private final AtomicInteger safeCount = new AtomicInteger();

    public int next() {
        return safeCount.incrementAndGet();
    }
}`,
      interviewPoints: [
        'One instance per container, shared by all threads.',
        'Keep singletons stateless or thread-safe.',
        'Differs from the GoF Singleton pattern (per container vs per class loader).',
      ],
    },
    {
      id: 'prototype-scope',
      title: 'Prototype scope',
      explanation: "A prototype bean gets a brand-new instance each time it is requested from the container or injected. It is useful for stateful, short-lived helper objects.\n\nSpring creates and configures a prototype but does not manage its full lifecycle: `@PreDestroy` methods are not called for prototypes, so you must clean up resources yourself. Also, injecting a prototype into a singleton gives the singleton only one instance; use `ObjectProvider<T>` to get a new one each time.",
      example: `@Component
@Scope(ConfigurableBeanFactory.SCOPE_PROTOTYPE)
public class ShoppingCartCalculator {
    private final List<Long> prices = new ArrayList<>(); // per-instance state
}

@Service
public class CheckoutService {
    private final ObjectProvider<ShoppingCartCalculator> calculators;

    public CheckoutService(ObjectProvider<ShoppingCartCalculator> calculators) {
        this.calculators = calculators;
    }

    public void checkout() {
        ShoppingCartCalculator calc = calculators.getObject(); // fresh instance
    }
}`,
      interviewPoints: [
        'New instance per request to the container.',
        'Destruction callbacks are not called for prototypes.',
        'Use ObjectProvider to get new prototypes inside a singleton.',
      ],
    },
    {
      id: 'request-session-scopes',
      title: 'Request & session scopes',
      explanation: "In a web application, a `request`-scoped bean lives for a single HTTP request, and a `session`-scoped bean lives for one user's HTTP session. They are handy for per-request context (like a correlation id) or per-user data (like a wizard's progress).\n\nWhen you inject such a bean into a singleton, Spring injects a scoped proxy. Each method call on the proxy is forwarded to the correct instance for the current request or session. The annotations `@RequestScope` and `@SessionScope` set this proxy up automatically.",
      example: `@Component
@RequestScope
public class RequestContext {
    private String correlationId;

    public String getCorrelationId() { return correlationId; }
    public void setCorrelationId(String id) { this.correlationId = id; }
}

@Service
public class AuditService {
    private final RequestContext requestContext; // actually a proxy

    public AuditService(RequestContext requestContext) {
        this.requestContext = requestContext;
    }

    public void log(String action) {
        System.out.println(requestContext.getCorrelationId() + " " + action);
    }
}`,
      interviewPoints: [
        'request: one per HTTP request. session: one per HTTP session.',
        'Only available in web-aware application contexts.',
        'Injected into singletons through a scoped proxy.',
      ],
    },
    {
      id: 'bean-lifecycle',
      title: 'Bean lifecycle (@PostConstruct / @PreDestroy)',
      explanation: "A bean goes through these main steps: Spring instantiates it (calls the constructor), injects dependencies, calls `BeanPostProcessor` hooks and initialisation callbacks, then the bean is ready to use. When the container shuts down, destruction callbacks run.\n\nThe simplest way to hook in is `@PostConstruct` (runs once after dependencies are injected) and `@PreDestroy` (runs before a singleton is destroyed). In Spring 6 these come from `jakarta.annotation`. Alternatives are implementing `InitializingBean` / `DisposableBean`, or `@Bean(initMethod = ..., destroyMethod = ...)`.",
      example: `import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;

@Component
public class ExchangeRateCache {

    private final Map<String, BigDecimal> rates = new ConcurrentHashMap<>();
    private final RateClient client;

    public ExchangeRateCache(RateClient client) {
        this.client = client;
    }

    @PostConstruct
    void loadRates() {        // dependencies are ready here
        rates.putAll(client.fetchAll());
    }

    @PreDestroy
    void shutdown() {          // called on graceful shutdown
        rates.clear();
    }
}`,
      interviewPoints: [
        'Order: constructor, dependency injection, Aware callbacks, BeanPostProcessor before-init, @PostConstruct, afterPropertiesSet, init-method, post-processor after-init (proxies created here), ready.',
        '@PostConstruct runs after injection, so dependencies are usable.',
        '@PreDestroy is not called for prototype beans.',
        'Spring 6 uses jakarta.annotation, not javax.annotation.',
      ],
    },
    {
      id: 'component-scanning',
      title: 'Component scanning',
      explanation: "Component scanning is how Spring finds your annotated classes automatically. It scans a base package and all its sub-packages for classes marked with `@Component` or a stereotype built on it, and registers each as a bean.\n\nIn Spring Boot, `@SpringBootApplication` includes `@ComponentScan` for the package of the main class. That is why the main class should sit in the root package: classes in sibling or parent packages are not found unless you add them with `@ComponentScan(basePackages = ...)`.",
      example: `package com.shop; // root package

@SpringBootApplication // scans com.shop and all sub-packages
public class ShopApplication {
    public static void main(String[] args) {
        SpringApplication.run(ShopApplication.class, args);
    }
}

// Plain Spring
@Configuration
@ComponentScan(basePackages = "com.shop")
public class AppConfig { }`,
      interviewPoints: [
        'Scans the base package and sub-packages for @Component-based annotations.',
        'Spring Boot scans from the main class package.',
        'A class outside the scanned packages is silently ignored.',
      ],
    },
    {
      id: 'stereotype-annotations',
      title: '@Component, @Service, @Repository, @Controller',
      explanation: "`@Component` is the generic annotation that marks a class as a Spring bean. `@Service`, `@Repository` and `@Controller` are specialisations of it (they are themselves annotated with `@Component`), so they are all picked up by component scanning.\n\nThey communicate the role of a class. `@Service` marks business logic and currently adds no extra behaviour. `@Repository` marks data access code and enables exception translation, turning database-specific exceptions into Spring's `DataAccessException` hierarchy. `@Controller` marks a Spring MVC web controller, and `@RestController` is `@Controller` plus `@ResponseBody`.",
      example: `@Repository
public class JdbcProductRepository { /* SQL access */ }

@Service
public class ProductService { /* business rules */ }

@RestController
@RequestMapping("/api/products")
public class ProductController { /* HTTP endpoints */ }

@Component
public class SlugGenerator { /* generic helper */ }`,
      interviewPoints: [
        'All are @Component specialisations and are detected by scanning.',
        '@Repository adds persistence exception translation.',
        '@Controller is for MVC; @RestController = @Controller + @ResponseBody.',
        '@Service is semantic only, but improves readability and AOP targeting.',
      ],
    },
    {
      id: 'configuration-and-bean',
      title: '@Configuration & @Bean',
      explanation: "A `@Configuration` class is a source of bean definitions. Each method annotated with `@Bean` returns an object that Spring registers as a bean, with the method name as the default bean name. Parameters of a `@Bean` method are injected automatically.\n\nSpring proxies `@Configuration` classes with CGLIB, so calling one `@Bean` method from another returns the same singleton instead of creating a new object. With `@Configuration(proxyBeanMethods = false)` (the lite mode used by many Spring Boot auto-configurations) that interception is turned off for faster startup, so you should pass dependencies as method parameters instead.",
      example: `@Configuration
public class HttpConfig {

    @Bean
    public RestClient.Builder restClientBuilder() {
        return RestClient.builder();
    }

    @Bean
    public RestClient weatherClient(RestClient.Builder builder,
                                    @Value("\${weather.url}") String url) {
        return builder.baseUrl(url).build();
    }
}`,
      interviewPoints: [
        '@Bean methods define beans; method name is the default bean name.',
        '@Configuration is proxied so inter-bean method calls return singletons.',
        'proxyBeanMethods = false gives lite mode: faster, no interception.',
      ],
    },
    {
      id: 'bean-vs-component',
      title: '@Bean vs @Component',
      explanation: "`@Component` goes on a class you wrote, and Spring discovers it through component scanning. `@Bean` goes on a method inside a `@Configuration` class, and you write the code that creates the object yourself.\n\nUse `@Component` (or its stereotypes) for your own classes. Use `@Bean` for classes from third-party libraries that you cannot annotate, when you need several differently-configured beans of the same class, or when creation involves custom logic.",
      example: `// Your own class: annotate it
@Component
public class PriceFormatter { }

// Third-party class: declare it with @Bean
@Configuration
public class JsonConfig {
    @Bean
    public ObjectMapper objectMapper() {
        return new ObjectMapper()
                .registerModule(new JavaTimeModule())
                .disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
    }
}`,
      interviewPoints: [
        '@Component: class-level, auto-detected by scanning.',
        '@Bean: method-level, explicit creation code.',
        '@Bean for third-party classes or multiple configured instances.',
      ],
    },
    {
      id: 'profiles',
      title: 'Profiles (@Profile)',
      explanation: "Profiles let you register different beans in different environments, such as `dev`, `test` and `prod`. A bean annotated with `@Profile(\"dev\")` is created only when the `dev` profile is active. You can also negate with `@Profile(\"!prod\")`.\n\nActivate profiles with `spring.profiles.active=prod` in configuration, the environment variable `SPRING_PROFILES_ACTIVE=prod`, or `@ActiveProfiles` in tests. Spring Boot also loads profile-specific files such as `application-prod.yml`.",
      example: `public interface MailSender { void send(String to, String body); }

@Component
@Profile("dev")
public class ConsoleMailSender implements MailSender {
    public void send(String to, String body) {
        System.out.println("Mail to " + to + ": " + body);
    }
}

@Component
@Profile("prod")
public class SmtpMailSender implements MailSender {
    public void send(String to, String body) { /* real SMTP */ }
}`,
      interviewPoints: [
        '@Profile controls whether a bean is registered.',
        'Activate with spring.profiles.active or SPRING_PROFILES_ACTIVE.',
        'Supports expressions like !prod and dev | test.',
      ],
    },
    {
      id: 'lazy-initialization',
      title: 'Lazy initialization (@Lazy)',
      explanation: "By default, singleton beans are created eagerly when the application starts. That makes startup slower but catches configuration errors immediately. `@Lazy` delays creation of a bean until it is first used.\n\nYou can put `@Lazy` on a bean class, on a `@Bean` method, or on an injection point (Spring then injects a proxy that creates the real bean on first call). Spring Boot can make every bean lazy with `spring.main.lazy-initialization=true`, which speeds up startup in development but may hide errors until the first request and add latency to it.",
      example: `@Component
@Lazy
public class HeavyPdfRenderer {
    public HeavyPdfRenderer() {
        System.out.println("Loading fonts..."); // runs on first use, not at startup
    }
}`,
      interviewPoints: [
        'Singletons are eager by default; @Lazy defers creation.',
        'Trade-off: faster startup vs errors discovered later.',
        '@Lazy on an injection point injects a lazy-resolving proxy.',
      ],
    },
  ],

  commonMistakes: [
    "Storing per-request or per-user data in fields of a singleton bean, causing data to leak between concurrent requests.",
    "Placing the main `@SpringBootApplication` class in a sub-package so some components are outside the scan path and never registered.",
    "Expecting a prototype bean injected into a singleton to be new on every use, when it is actually created only once.",
    "Importing `javax.annotation.PostConstruct` in a Spring Boot 3 project instead of `jakarta.annotation.PostConstruct`.",
    "Using `@Component` on a class and also declaring the same class with a `@Bean` method, which creates two beans and causes ambiguity.",
  ],

  interviewTips: [
    "When asked about scopes, start with singleton as the default, then explain the thread-safety consequence; interviewers love that follow-up.",
    "Be ready to recite the lifecycle in a few steps: instantiate, inject, post-processors and init callbacks, use, destroy.",
    "Explain `@Bean` vs `@Component` with a concrete example like configuring an `ObjectMapper` or `RestClient`.",
    "Mention the special behaviour of `@Repository` (exception translation) to show you know more than just the names.",
  ],

  interviewQuestions: [
    {
      id: 'spring-beans-q1',
      question: 'What is a Spring bean?',
      answer: "A Spring bean is an object that is instantiated, configured, wired and managed by the Spring IoC container. Beans are defined through annotations like `@Component`, `@Bean` methods in `@Configuration` classes, or XML.\n\nThe container tracks each bean's definition: its class, scope, dependencies and lifecycle callbacks. An object you create yourself with `new` is not a bean and gets none of Spring's features, such as injection or AOP proxies.",
      points: [
        'Object managed by the Spring container.',
        'Defined by stereotype annotations, @Bean methods or XML.',
        'Has a name, scope, dependencies and lifecycle.',
      ],
      difficulty: 'Beginner',
    },
    {
      id: 'spring-beans-q2',
      question: 'What bean scopes does Spring support?',
      answer: "The two core scopes are `singleton` (the default, one instance per container) and `prototype` (a new instance each time it is requested). In web applications you also have `request` (one per HTTP request), `session` (one per HTTP session), `application` (one per `ServletContext`) and `websocket` (one per WebSocket session).\n\nYou set the scope with `@Scope(\"prototype\")` or shortcuts like `@RequestScope` and `@SessionScope`.",
      points: [
        'singleton (default) and prototype.',
        'Web: request, session, application, websocket.',
        'Set via @Scope or @RequestScope / @SessionScope.',
      ],
      difficulty: 'Beginner',
    },
    {
      id: 'spring-beans-q3',
      question: 'What is the difference between @Component, @Service, @Repository and @Controller?',
      answer: "All four mark a class as a Spring bean and are detected by component scanning, because `@Service`, `@Repository` and `@Controller` are themselves meta-annotated with `@Component`. The difference is their role and small extra behaviours.\n\n`@Component` is generic. `@Service` marks the business layer and adds no behaviour today. `@Repository` marks the data access layer and enables translation of persistence exceptions into Spring's `DataAccessException`. `@Controller` marks a Spring MVC controller whose methods handle web requests; `@RestController` adds `@ResponseBody` so return values are written as JSON.",
      points: [
        'All are @Component specialisations.',
        '@Repository: persistence exception translation.',
        '@Controller: handles HTTP requests in Spring MVC.',
        'Using the right one documents the layer.',
      ],
      difficulty: 'Beginner',
    },
    {
      id: 'spring-beans-q4',
      question: 'What is the difference between @Bean and @Component?',
      answer: "`@Component` is a class-level annotation: Spring finds the class through component scanning and creates it using its constructor. `@Bean` is a method-level annotation inside a `@Configuration` class: you write the creation code yourself and Spring registers whatever the method returns.\n\nUse `@Component` for your own classes. Use `@Bean` for third-party classes you cannot annotate (like `ObjectMapper` or a `DataSource`), for creating several differently configured instances of one class, or when construction needs custom logic.",
      points: [
        '@Component: on the class, auto-detected.',
        '@Bean: on a factory method, explicit.',
        '@Bean for library classes and custom construction.',
      ],
      difficulty: 'Beginner',
    },
    {
      id: 'spring-beans-q5',
      question: 'Are singleton beans thread-safe?',
      answer: "No, Spring does not make singleton beans thread-safe. One instance is shared by all threads, for example every concurrent HTTP request, so any mutable field is shared state and can cause race conditions.\n\nThe standard approach is to keep singletons stateless: only store dependencies (other beans) and configuration in `final` fields, and keep per-request data in local variables or method parameters. If shared state is truly needed, use thread-safe types like `ConcurrentHashMap` or `AtomicLong`, or move the state to a request-scoped bean.",
      points: [
        'Spring gives no automatic thread-safety.',
        'Keep singletons stateless; use local variables for request data.',
        'Use concurrent types or narrower scopes if state is required.',
      ],
      difficulty: 'Intermediate',
    },
    {
      id: 'spring-beans-q6',
      question: 'Explain the Spring bean lifecycle.',
      answer: "First Spring creates the bean instance by calling its constructor (injecting constructor dependencies). Then it performs setter and field injection and calls any `Aware` interfaces, such as `BeanNameAware` or `ApplicationContextAware`. Next, `BeanPostProcessor.postProcessBeforeInitialization` runs, followed by initialisation callbacks: `@PostConstruct`, then `InitializingBean.afterPropertiesSet()`, then a custom `initMethod`. Then `postProcessAfterInitialization` runs, and this is where AOP proxies are usually created.\n\nThe bean is now ready and used. On container shutdown, destruction callbacks run for singletons: `@PreDestroy`, then `DisposableBean.destroy()`, then a custom `destroyMethod`. Prototype beans do not receive destruction callbacks.",
      example: `@Component
public class ConnectionPoolMonitor {
    @PostConstruct
    void start() { System.out.println("monitor started"); }

    @PreDestroy
    void stop() { System.out.println("monitor stopped"); }
}`,
      points: [
        'Instantiate, populate dependencies, Aware callbacks.',
        'BeanPostProcessor before, init callbacks, BeanPostProcessor after (proxies).',
        'Destroy callbacks on shutdown, singletons only.',
      ],
      difficulty: 'Intermediate',
    },
    {
      id: 'spring-beans-q7',
      question: 'What happens when you inject a prototype bean into a singleton bean?',
      answer: "The prototype is created only once, at the moment the singleton is created and its dependencies are injected. After that, the singleton keeps using the same prototype instance, so it effectively behaves like a singleton.\n\nTo get a new prototype on each use, inject `ObjectProvider<T>` and call `getObject()`, use `@Lookup` method injection, or declare the prototype with a scoped proxy (`@Scope(value = \"prototype\", proxyMode = ScopedProxyMode.TARGET_CLASS)`) so every method call goes to a fresh instance.",
      points: [
        'Injection happens once, so you get one prototype instance.',
        'ObjectProvider.getObject() returns a new instance each call.',
        '@Lookup and scoped proxies are alternatives.',
      ],
      difficulty: 'Intermediate',
    },
    {
      id: 'spring-beans-q8',
      question: 'What are Spring profiles and how do you use them?',
      answer: "Profiles are named groups of beans and configuration that are active only in certain environments. Annotating a bean or `@Configuration` class with `@Profile(\"prod\")` means it is registered only when the `prod` profile is active. Spring Boot also loads `application-{profile}.yml` files for active profiles.\n\nProfiles are activated with the `spring.profiles.active` property, the `SPRING_PROFILES_ACTIVE` environment variable, a command-line argument like `--spring.profiles.active=prod`, or `@ActiveProfiles` in tests.",
      example: `@Configuration
@Profile("!prod")
public class DevDataLoader {
    @Bean
    CommandLineRunner seed(ProductRepository repo) {
        return args -> repo.save(new Product("Sample", 100));
    }
}`,
      points: [
        '@Profile conditionally registers beans.',
        'Profile-specific files: application-dev.yml, application-prod.yml.',
        'Activate via property, env var, CLI arg or @ActiveProfiles.',
      ],
      difficulty: 'Intermediate',
    },
    {
      id: 'spring-beans-q9',
      question: 'What is the difference between @Configuration and @Component when declaring @Bean methods?',
      answer: "In a `@Configuration` class (full mode), Spring creates a CGLIB subclass that intercepts `@Bean` method calls. If one `@Bean` method calls another, the proxy returns the existing singleton from the container instead of running the method again, so singleton semantics are preserved.\n\nIn a `@Component` class, or `@Configuration(proxyBeanMethods = false)`, `@Bean` methods run in lite mode: there is no interception, so calling one `@Bean` method from another simply creates a new object that is not the container-managed bean. In lite mode, inject dependencies as method parameters instead. Lite mode starts faster, which is why Spring Boot's auto-configurations use it.",
      example: `@Configuration
public class AppConfig {
    @Bean
    public Clock clock() { return Clock.systemUTC(); }

    @Bean
    public InvoiceService invoiceService() {
        return new InvoiceService(clock()); // same Clock bean thanks to the proxy
    }
}`,
      points: [
        'Full mode: CGLIB proxy, inter-bean calls return singletons.',
        'Lite mode: no proxy, method calls create new objects.',
        'Prefer method parameters for dependencies in lite mode.',
      ],
      difficulty: 'Advanced',
    },
    {
      id: 'spring-beans-q10',
      question: 'How do request- and session-scoped beans work when injected into a singleton?',
      answer: "A singleton is created once at startup, when no HTTP request exists, so Spring cannot inject a real request-scoped instance. Instead it injects a scoped proxy: an object of the same type that, on each method call, looks up the actual bean for the current request or session and delegates to it.\n\n`@RequestScope` and `@SessionScope` enable this proxy by default (`proxyMode = TARGET_CLASS`). If you use plain `@Scope(\"request\")` without a proxy mode and inject it into a singleton, startup fails because there is no active request. Session-scoped beans should be `Serializable` if sessions are replicated or persisted.",
      points: [
        'Singleton gets a proxy, not the real instance.',
        'Proxy resolves the correct instance per request/session on each call.',
        'Requires a proxy mode; @RequestScope sets it automatically.',
      ],
      difficulty: 'Advanced',
    },
    {
      id: 'spring-beans-q11',
      question: 'What is a BeanPostProcessor and how is it different from a BeanFactoryPostProcessor?',
      answer: "A `BeanPostProcessor` works on bean instances. Its `postProcessBeforeInitialization` and `postProcessAfterInitialization` methods run around the init callbacks of every bean, and they can modify or even replace the bean. Spring uses them to process `@Autowired` and `@PostConstruct`, and to wrap beans in AOP proxies for `@Transactional`.\n\nA `BeanFactoryPostProcessor` works earlier, on bean definitions (the metadata), before any beans are created. It can change definitions, for example resolving `\${...}` placeholders (`PropertySourcesPlaceholderConfigurer`) or registering new definitions (`ConfigurationClassPostProcessor`, which processes `@Configuration` classes).",
      points: [
        'BeanPostProcessor: modifies bean instances around initialisation.',
        'BeanFactoryPostProcessor: modifies bean definitions before instantiation.',
        'AOP proxies and @Autowired rely on BeanPostProcessors.',
      ],
      difficulty: 'Advanced',
    },
    {
      id: 'spring-beans-q12',
      question: 'What is lazy initialization and when should you use it?',
      answer: "By default Spring creates all singleton beans eagerly at startup, so wiring errors and misconfigurations are found immediately. With `@Lazy`, a bean is created only when it is first requested. Spring Boot can make every bean lazy with `spring.main.lazy-initialization=true`.\n\nLazy initialization speeds up startup and saves memory for rarely used, expensive beans. The downsides are that configuration errors appear only at first use, possibly in production, and the first request pays the creation cost. A good use is heavy beans that are not always needed, or faster startup during local development.",
      points: [
        'Eager by default; @Lazy defers creation to first use.',
        'Faster startup vs errors discovered later.',
        'Global switch: spring.main.lazy-initialization=true.',
      ],
      difficulty: 'Beginner',
    },
  ],
}

export default topic
