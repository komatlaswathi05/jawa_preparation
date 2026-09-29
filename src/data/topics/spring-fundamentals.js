const topic = {
  id: 'spring-fundamentals',
  category: 'spring',
  title: 'Spring Fundamentals',
  description: "The core ideas behind the Spring Framework: IoC, the Spring container, configuration styles and AOP.",
  difficulty: 'Beginner',
  overview: "Spring is a Java framework that helps you build applications out of small, loosely connected objects. Instead of every class creating the objects it needs with `new`, Spring creates them for you, wires them together and manages their whole life. This idea is called Inversion of Control (IoC), and the part of Spring that does the work is called the container.\n\nThink of a restaurant kitchen. A cook does not go out to buy vegetables, sharpen knives and wash plates before cooking each dish. The kitchen manager makes sure everything the cook needs is already on the counter. Spring is that kitchen manager for your objects: your classes just say what they need, and Spring hands it to them.\n\nOn top of IoC, Spring offers Aspect-Oriented Programming (AOP), which lets you add cross-cutting behaviour such as logging, security checks or transactions around many methods without copying that code everywhere. Spring Boot, Spring Data, Spring Security and most of the Spring ecosystem are built on these fundamentals, so understanding them makes everything else easier.",

  subtopics: [
    {
      id: 'spring-framework',
      title: 'Spring Framework',
      explanation: "The Spring Framework is an open-source framework for building Java applications, especially backend and web applications. Its heart is the IoC container, and around it are modules such as Spring MVC (web), Spring JDBC, transaction management, AOP and testing support.\n\nSpring Framework 6 requires Java 17+ and uses the `jakarta.*` packages (for example `jakarta.annotation.PostConstruct`) instead of the old `javax.*` ones. Spring Boot 3 is built on top of Spring Framework 6.",
      interviewPoints: [
        'Spring is modular: you use only the modules you need (core, web, data, security, etc.).',
        'Its main goals are loose coupling, testability and less boilerplate.',
        'Spring Framework 6 / Spring Boot 3 need Java 17+ and use jakarta.* packages.',
      ],
    },
    {
      id: 'ioc',
      title: 'Inversion of Control (IoC)',
      explanation: "Normally a class controls its own dependencies: it calls `new` to create the objects it uses. With Inversion of Control, that control is flipped. A framework (the Spring container) creates the objects and gives them to your class.\n\nDependency Injection (DI) is the most common way Spring implements IoC: dependencies are passed in through the constructor, a setter or a field. The result is code that is loosely coupled, because a class depends on an interface rather than on a specific implementation it created itself.",
      example: `// Without IoC: the class creates its own dependency (tight coupling)
public class OrderService {
    private final PaymentGateway gateway = new StripePaymentGateway();
}

// With IoC: Spring creates the dependency and passes it in
@Service
public class OrderService {
    private final PaymentGateway gateway;

    public OrderService(PaymentGateway gateway) {
        this.gateway = gateway;
    }
}`,
      interviewPoints: [
        'IoC is the principle; Dependency Injection is one way to implement it.',
        'IoC makes it easy to swap implementations, for example a fake gateway in tests.',
      ],
    },
    {
      id: 'spring-container',
      title: 'Spring Container',
      explanation: "The Spring container (also called the IoC container) is the part of Spring that creates objects, wires their dependencies, configures them and manages their lifecycle. Objects managed by the container are called beans.\n\nThe container reads configuration metadata (Java `@Configuration` classes, annotations like `@Component`, or XML) to learn which beans to create and how to connect them. In Java, the container is represented by the `BeanFactory` and `ApplicationContext` interfaces.",
      example: `ApplicationContext context =
        new AnnotationConfigApplicationContext(AppConfig.class);

OrderService orderService = context.getBean(OrderService.class);
orderService.placeOrder(42L);`,
      interviewPoints: [
        'Container = creates beans, injects dependencies, manages lifecycle.',
        'Configuration metadata tells the container what to build.',
      ],
    },
    {
      id: 'beanfactory',
      title: 'BeanFactory',
      explanation: "`BeanFactory` is the most basic Spring container interface. It knows how to create beans and hand them out through methods like `getBean()`. By default it creates beans lazily, only when they are first requested.\n\nYou rarely use `BeanFactory` directly in modern code. It is mainly useful to know as the foundation that `ApplicationContext` extends.",
      interviewPoints: [
        'BeanFactory is the root container interface with basic DI features.',
        'It creates beans lazily, on first getBean() call.',
      ],
    },
    {
      id: 'applicationcontext',
      title: 'ApplicationContext',
      explanation: "`ApplicationContext` extends `BeanFactory` and adds enterprise features: eager creation of singleton beans at startup, event publishing, internationalisation (message sources), environment and profile support, and automatic registration of bean post-processors (which power features like `@Autowired` and AOP).\n\nCommon implementations are `AnnotationConfigApplicationContext` (plain Java config) and the web contexts used by Spring Boot. In a Spring Boot app, `SpringApplication.run(...)` creates and returns an `ApplicationContext` for you.",
      example: `@SpringBootApplication
public class ShopApplication {
    public static void main(String[] args) {
        ApplicationContext ctx = SpringApplication.run(ShopApplication.class, args);
        System.out.println("Beans loaded: " + ctx.getBeanDefinitionCount());
    }
}`,
      interviewPoints: [
        'ApplicationContext is a superset of BeanFactory and is what you use in practice.',
        'It pre-instantiates singletons at startup, so configuration errors show up early.',
        'Adds events, i18n, profiles/environment and automatic BeanPostProcessor registration.',
      ],
    },
    {
      id: 'configuration-styles',
      title: 'Configuration: Java config vs XML vs annotations',
      explanation: "Spring can learn about your beans in three ways. XML configuration was the original style: beans are declared in an XML file. Annotation-based configuration puts stereotype annotations such as `@Component` and `@Service` directly on your classes and lets component scanning find them. Java-based configuration uses `@Configuration` classes with `@Bean` methods that return objects.\n\nModern applications mix annotations (for your own classes) with Java config (for third-party classes you cannot annotate, or when creation needs custom logic). XML is mostly found in older, legacy projects.",
      example: `// 1. Annotations on your own class, found by component scanning
@Service
public class EmailService { }

// 2. Java config for a third-party class
@Configuration
public class AppConfig {
    @Bean
    public ObjectMapper objectMapper() {
        return new ObjectMapper().findAndRegisterModules();
    }
}

// 3. Legacy XML (beans.xml)
// <bean id="emailService" class="com.shop.EmailService"/>`,
      interviewPoints: [
        'Java config is type-safe and refactor-friendly; XML is verbose and checked only at runtime.',
        'Use @Bean for classes you do not own; use @Component-style annotations for your own classes.',
        'All three styles can be combined in one application.',
      ],
    },
    {
      id: 'aop',
      title: 'Aspect-Oriented Programming (AOP)',
      explanation: "Some concerns, like logging, security, transactions and metrics, are needed in many places across an application. These are called cross-cutting concerns. Copying the same code into every method is repetitive and error-prone.\n\nAOP lets you write that logic once, in an aspect, and tell Spring where to apply it. Spring then runs your logic before, after or around the matching methods automatically. Features such as `@Transactional`, `@Cacheable` and method security are all implemented with Spring AOP. In Spring Boot, add `spring-boot-starter-aop` to use your own aspects.",
      interviewPoints: [
        'AOP separates cross-cutting concerns from business logic.',
        '@Transactional, @Cacheable and @PreAuthorize are built on Spring AOP.',
      ],
    },
    {
      id: 'aspect',
      title: 'Aspect',
      explanation: "An aspect is a class that bundles a cross-cutting concern: it contains advice (the code to run) and pointcuts (where to run it). In Spring you create one by annotating a bean with `@Aspect` and `@Component`.",
      example: `@Aspect
@Component
public class LoggingAspect {

    private static final Logger log = LoggerFactory.getLogger(LoggingAspect.class);

    @Before("execution(* com.shop.service.*.*(..))")
    public void logCall(JoinPoint joinPoint) {
        log.info("Calling {}", joinPoint.getSignature().toShortString());
    }
}`,
      interviewPoints: [
        'An aspect = pointcut (where) + advice (what and when).',
        'The aspect class must itself be a Spring bean (@Component) to be picked up.',
      ],
    },
    {
      id: 'advice',
      title: 'Advice (before, after, around)',
      explanation: "Advice is the actual code an aspect runs, and its type says when it runs. `@Before` runs before the method. `@AfterReturning` runs after the method returns normally, `@AfterThrowing` runs if it throws an exception, and `@After` runs in both cases, like a finally block.\n\n`@Around` is the most powerful: it wraps the method call, can run code before and after, change arguments or the return value, and decides whether to call the real method at all by calling `proceed()`.",
      example: `@Around("execution(* com.shop.service.*.*(..))")
public Object measureTime(ProceedingJoinPoint pjp) throws Throwable {
    long start = System.currentTimeMillis();
    try {
        return pjp.proceed(); // call the real method
    } finally {
        long took = System.currentTimeMillis() - start;
        log.info("{} took {} ms", pjp.getSignature().toShortString(), took);
    }
}

@AfterThrowing(pointcut = "execution(* com.shop.service.*.*(..))", throwing = "ex")
public void logError(JoinPoint jp, Exception ex) {
    log.error("{} failed: {}", jp.getSignature().getName(), ex.getMessage());
}`,
      interviewPoints: [
        'Five advice types: @Before, @After, @AfterReturning, @AfterThrowing, @Around.',
        '@Around must call proceed(), otherwise the real method never runs.',
        'Use the least powerful advice that does the job.',
      ],
    },
    {
      id: 'pointcut-join-points',
      title: 'Pointcut & Join Points',
      explanation: "A join point is a point during program execution where an aspect could be applied. In Spring AOP, a join point is always a method execution on a Spring bean.\n\nA pointcut is an expression that selects which join points the advice should apply to. The most common form is `execution(...)`, which matches method signatures. You can also match by annotation, for example `@annotation(com.shop.Audited)`, and give a pointcut a name with `@Pointcut` to reuse it.",
      example: `@Aspect
@Component
public class AuditAspect {

    // matches any public method in any class under com.shop.service
    @Pointcut("execution(public * com.shop.service..*(..))")
    public void serviceMethods() { }

    // matches any method annotated with @Audited
    @Pointcut("@annotation(com.shop.audit.Audited)")
    public void auditedMethods() { }

    @AfterReturning("serviceMethods() && auditedMethods()")
    public void audit(JoinPoint jp) {
        // write an audit record
    }
}`,
      interviewPoints: [
        'Join point = a candidate place (in Spring: a method execution).',
        'Pointcut = the expression that picks which join points get advice.',
        'execution(modifiers? returnType package.Class.method(args)) is the usual syntax.',
      ],
    },
    {
      id: 'proxies',
      title: 'Proxies (JDK dynamic proxy vs CGLIB)',
      explanation: "Spring AOP works by wrapping your bean in a proxy: an object that looks like your bean but runs the advice before or after delegating to the real object. Other beans receive the proxy, not the original object.\n\nIf the bean implements an interface, Spring can use a JDK dynamic proxy that implements the same interface. Otherwise it uses CGLIB, which creates a subclass at runtime. Spring Boot uses CGLIB by default. Because of this design, advice only runs when a method is called through the proxy. A method calling another method on `this` (self-invocation) skips the proxy, so `@Transactional` or your aspect will not apply to that inner call. Final classes and final or private methods cannot be advised with CGLIB.",
      example: `@Service
public class ReportService {

    public void generateAll() {
        // Self-invocation: goes directly to 'this', NOT through the proxy,
        // so @Transactional on generate() is ignored here.
        generate();
    }

    @Transactional
    public void generate() {
        // ...
    }
}`,
      interviewPoints: [
        'Spring AOP is proxy-based and only intercepts calls coming from outside the bean.',
        'JDK proxy for interfaces, CGLIB subclass otherwise (Spring Boot default is CGLIB).',
        'Self-invocation, private and final methods are not intercepted.',
        'AspectJ weaving is the alternative when you need more than method-level join points.',
      ],
    },
  ],

  commonMistakes: [
    "Creating dependencies with `new` inside a Spring bean, which bypasses the container and makes the object impossible to replace in tests.",
    "Expecting `@Transactional` or a custom aspect to work when a method calls another method on the same object (self-invocation skips the proxy).",
    "Forgetting to add `@Component` to an `@Aspect` class, so Spring never registers it and the advice never runs.",
    "Writing an `@Around` advice that forgets to call `proceed()` or forgets to return its result, silently breaking the target method.",
    "Mixing up IoC and DI, or describing Spring AOP as able to intercept field access or constructor calls (only AspectJ can).",
  ],

  interviewTips: [
    "Explain IoC with a simple before/after example: a class using `new` versus a class receiving its dependency through the constructor.",
    "When asked about BeanFactory vs ApplicationContext, say that ApplicationContext is what you actually use and list two or three extra features it adds.",
    "For AOP questions, name a real feature built on it, such as `@Transactional`, to show you understand why it matters.",
    "Mention the self-invocation proxy limitation proactively; it is a favourite follow-up question and shows real-world experience.",
  ],

  interviewQuestions: [
    {
      id: 'spring-fundamentals-q1',
      question: 'What is the Spring Framework and why is it used?',
      answer: "Spring is an open-source Java framework for building applications, mostly backend and web services. Its core is an IoC container that creates objects (beans), injects their dependencies and manages their lifecycle.\n\nIt is used because it promotes loose coupling and testability, removes a lot of boilerplate (transactions, JDBC, web handling), and provides a large ecosystem: Spring MVC, Spring Data, Spring Security and Spring Boot.",
      points: [
        'Core: IoC container and dependency injection.',
        'Modules: web (MVC/WebFlux), data access, transactions, AOP, testing.',
        'Benefits: loose coupling, easy testing, less boilerplate, huge ecosystem.',
      ],
      difficulty: 'Beginner',
    },
    {
      id: 'spring-fundamentals-q2',
      question: 'What is Inversion of Control (IoC)?',
      answer: "Inversion of Control means an object does not create or look up its own dependencies. Instead, an external party, the Spring container, creates them and provides them to the object. Control over object creation and wiring is inverted from your code to the framework.\n\nIn Spring, IoC is implemented through Dependency Injection: dependencies are passed in through constructors, setters or fields.",
      example: `@Service
public class InvoiceService {
    private final TaxCalculator taxCalculator;

    public InvoiceService(TaxCalculator taxCalculator) { // provided by Spring
        this.taxCalculator = taxCalculator;
    }
}`,
      points: [
        'The framework, not your class, controls object creation.',
        'DI is the technique Spring uses to implement IoC.',
        'Leads to loose coupling and easier unit testing.',
      ],
      difficulty: 'Beginner',
    },
    {
      id: 'spring-fundamentals-q3',
      question: 'What is the Spring IoC container?',
      answer: "The IoC container is the core of Spring. It reads configuration metadata (annotations, `@Configuration` classes or XML), creates the beans described there, injects their dependencies and manages their lifecycle from creation to destruction.\n\nIn code, the container is represented by the `BeanFactory` and `ApplicationContext` interfaces. In Spring Boot, `SpringApplication.run()` creates the container for you.",
      points: [
        'Creates, configures, wires and destroys beans.',
        'Driven by configuration metadata.',
        'Represented by BeanFactory / ApplicationContext.',
      ],
      difficulty: 'Beginner',
    },
    {
      id: 'spring-fundamentals-q4',
      question: 'What is the difference between BeanFactory and ApplicationContext?',
      answer: "`BeanFactory` is the basic container interface: it creates and provides beans, and creates them lazily when first requested. `ApplicationContext` extends `BeanFactory` and adds features needed by real applications.\n\nThose extras include eager creation of singleton beans at startup (so errors appear early), event publishing, internationalisation through `MessageSource`, environment and profile support, and automatic registration of `BeanPostProcessor`s, which is what makes `@Autowired`, `@PostConstruct` and AOP work without extra setup. In practice you almost always use `ApplicationContext`.",
      points: [
        'ApplicationContext is a sub-interface of BeanFactory.',
        'BeanFactory: lazy by default. ApplicationContext: eagerly creates singletons.',
        'ApplicationContext adds events, i18n, profiles, automatic post-processors.',
      ],
      difficulty: 'Intermediate',
    },
    {
      id: 'spring-fundamentals-q5',
      question: 'What are the ways to configure a Spring application?',
      answer: "There are three styles. XML configuration declares beans in XML files and is mostly seen in legacy projects. Annotation-based configuration uses stereotype annotations like `@Component`, `@Service` and `@Repository` on classes, discovered by component scanning. Java-based configuration uses `@Configuration` classes with `@Bean` methods.\n\nModern Spring Boot apps combine annotations for their own classes with Java config for third-party objects or objects that need custom creation logic.",
      example: `@Configuration
public class ClientConfig {
    @Bean
    public RestClient paymentClient() {
        return RestClient.builder().baseUrl("https://api.payments.example").build();
    }
}`,
      points: [
        'XML, annotations (component scanning), and Java config (@Configuration + @Bean).',
        'Java config is type-safe and refactor-friendly.',
        '@Bean is ideal for classes you cannot annotate yourself.',
      ],
      difficulty: 'Beginner',
    },
    {
      id: 'spring-fundamentals-q6',
      question: 'What is AOP and what problems does it solve?',
      answer: "Aspect-Oriented Programming is a way to modularise cross-cutting concerns: behaviour like logging, security, transactions, caching and metrics that is needed across many classes. Without AOP, that code gets duplicated in every method and mixed with business logic.\n\nWith AOP you write the concern once in an aspect and declare, with a pointcut, where it should apply. Spring then applies it automatically at runtime using proxies. `@Transactional`, `@Cacheable` and `@PreAuthorize` are all examples of AOP in Spring.",
      points: [
        'Cross-cutting concerns: logging, security, transactions, caching, metrics.',
        'Keeps business code clean and avoids duplication.',
        'Spring AOP is proxy-based and works on method executions of beans.',
      ],
      difficulty: 'Intermediate',
    },
    {
      id: 'spring-fundamentals-q7',
      question: 'Explain aspect, advice, pointcut and join point.',
      answer: "A join point is a point in program execution where extra behaviour could be applied; in Spring AOP that is always a method execution. A pointcut is an expression that selects a set of join points, such as all public methods in the service package.\n\nAdvice is the code that runs at the selected join points, together with when it runs (before, after, around). An aspect is the class that groups pointcuts and advice for one concern, marked with `@Aspect`.",
      example: `@Aspect
@Component
public class SecurityAuditAspect {
    @Before("execution(* com.shop.admin..*(..))") // pointcut
    public void audit(JoinPoint jp) {             // advice
        System.out.println("Admin call: " + jp.getSignature());
    }
}`,
      points: [
        'Join point: where advice can run (method execution in Spring).',
        'Pointcut: which join points are selected.',
        'Advice: what runs and when. Aspect: the module holding them.',
      ],
      difficulty: 'Intermediate',
    },
    {
      id: 'spring-fundamentals-q8',
      question: 'What types of advice exist and when would you use @Around?',
      answer: "Spring supports `@Before`, `@AfterReturning` (after a normal return, with access to the result), `@AfterThrowing` (when an exception is thrown), `@After` (always, like finally) and `@Around`.\n\n`@Around` wraps the method: it receives a `ProceedingJoinPoint`, can run code before and after, change arguments, replace the return value, handle exceptions, or skip the call entirely. Use it for timing, retries or caching. Because it is so powerful, the best practice is to choose the simplest advice type that works.",
      example: `@Around("@annotation(com.shop.Timed)")
public Object time(ProceedingJoinPoint pjp) throws Throwable {
    long start = System.nanoTime();
    Object result = pjp.proceed();
    log.info("took {} µs", (System.nanoTime() - start) / 1000);
    return result;
}`,
      points: [
        'Five types: Before, AfterReturning, AfterThrowing, After, Around.',
        '@Around must call proceed() and return its result.',
        'Prefer simpler advice when you do not need full control.',
      ],
      difficulty: 'Intermediate',
    },
    {
      id: 'spring-fundamentals-q9',
      question: 'How does Spring AOP work internally? What is the difference between JDK dynamic proxies and CGLIB?',
      answer: "Spring AOP is proxy-based. When a bean matches a pointcut, a `BeanPostProcessor` replaces it in the container with a proxy object. Callers get the proxy, which runs the advice chain and then delegates to the real bean.\n\nA JDK dynamic proxy implements the bean's interfaces and can only proxy interface methods. CGLIB generates a runtime subclass of the bean class, so it works without interfaces but cannot override final classes or final methods. Spring Boot defaults to CGLIB (`spring.aop.proxy-target-class=true`).",
      points: [
        'Proxies are created by a BeanPostProcessor during bean initialisation.',
        'JDK proxy: interface-based. CGLIB: subclass-based.',
        'Final classes/methods and private methods cannot be advised.',
        'Spring Boot uses CGLIB by default.',
      ],
      difficulty: 'Advanced',
    },
    {
      id: 'spring-fundamentals-q10',
      question: 'Why does @Transactional (or any aspect) not work when a method calls another method of the same class?',
      answer: "Because Spring AOP works through proxies. An external caller calls the proxy, which applies the advice and then calls the real object. But when the real object calls `this.otherMethod()`, the call goes straight to the object itself and never passes through the proxy, so no advice runs. This is called the self-invocation problem.\n\nFixes include moving the method into a separate bean and injecting it, restructuring so the transactional method is the entry point, or (rarely) using AspectJ compile-time or load-time weaving, which modifies the bytecode instead of using proxies.",
      example: `@Service
public class UserService {
    private final AuditService auditService; // separate bean -> goes through proxy

    public UserService(AuditService auditService) {
        this.auditService = auditService;
    }

    public void register(User user) {
        auditService.recordInNewTransaction(user); // advice applies
    }
}`,
      points: [
        'Self-invocation bypasses the proxy.',
        'Fix: move the method to another bean, or restructure the entry point.',
        'AspectJ weaving avoids the limitation but adds build complexity.',
      ],
      difficulty: 'Advanced',
    },
    {
      id: 'spring-fundamentals-q11',
      question: 'What is the difference between Spring AOP and AspectJ?',
      answer: "Spring AOP is a lightweight, proxy-based implementation built into Spring. It only supports method-execution join points on Spring beans, is applied at runtime, and needs no special compiler. It covers most real-world needs such as transactions, security and logging.\n\nAspectJ is a full AOP framework that weaves aspects directly into bytecode at compile time, post-compile or class-load time. It supports more join points (field access, constructors, static methods, calls on non-Spring objects) and has no self-invocation problem, but needs extra tooling. Spring AOP borrows AspectJ's annotation and pointcut syntax, which is why you see `org.aspectj` imports even in pure Spring AOP code.",
      points: [
        'Spring AOP: runtime proxies, method executions on beans only.',
        'AspectJ: bytecode weaving, many more join point types.',
        'Spring AOP reuses the AspectJ annotation syntax (@Aspect, @Before...).',
      ],
      difficulty: 'Advanced',
    },
  ],
}

export default topic
