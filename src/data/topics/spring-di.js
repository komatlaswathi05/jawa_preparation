const topic = {
  id: 'spring-di',
  category: 'spring',
  title: 'Dependency Injection',
  description: 'How Spring hands objects the collaborators they need: constructor, setter and field injection, @Autowired, @Primary, @Qualifier and more.',
  difficulty: 'Beginner',
  overview: "A dependency is any object your class needs to do its job. An `OrderService` might need an `OrderRepository` to save orders and an `EmailSender` to send confirmations. Dependency Injection (DI) means the class does not create these objects itself; they are given (injected) to it from outside, usually by the Spring container.\n\nImagine a phone charger. A phone with the charger soldered on is useless when you travel to a country with different sockets. A phone with a standard port lets you plug in any compatible charger. DI gives your classes that standard port: they declare what they need, and you can plug in the real implementation in production and a fake one in tests.\n\nIn Spring you mostly use constructor injection, and Spring decides which bean to inject by type. When several beans have the same type, `@Primary` and `@Qualifier` help Spring choose. Understanding DI well is essential, because nearly every Spring interview starts here.",

  subtopics: [
    {
      id: 'dependency-injection',
      title: 'Dependency Injection',
      explanation: "Dependency Injection is a design pattern where an object receives its dependencies instead of creating them. Spring looks at what each bean needs, finds matching beans in the container, and passes them in when it creates the bean.\n\nThe benefits are loose coupling (classes depend on interfaces, not concrete classes), easy testing (you can pass mocks), and centralised configuration (the container decides which implementation is used).",
      example: `public interface NotificationSender {
    void send(String to, String message);
}

@Component
public class EmailSender implements NotificationSender {
    public void send(String to, String message) { /* send email */ }
}

@Service
public class SignupService {
    private final NotificationSender sender;

    public SignupService(NotificationSender sender) { // injected by Spring
        this.sender = sender;
    }

    public void signup(String email) {
        sender.send(email, "Welcome!");
    }
}`,
      interviewPoints: [
        'DI is how Spring implements Inversion of Control.',
        'Depend on abstractions (interfaces) so implementations can be swapped.',
        'Spring resolves dependencies by type first.',
      ],
    },
    {
      id: 'autowired',
      title: '@Autowired',
      explanation: "`@Autowired` tells Spring to inject a matching bean into a constructor, setter method or field. Spring finds the bean by type; if there are several candidates it tries to narrow them down using `@Primary`, `@Qualifier`, and finally the parameter or field name.\n\nIf a class has only one constructor, `@Autowired` on it is optional since Spring 4.3, and Spring uses it automatically. By default the dependency is required and startup fails if no bean matches. Use `@Autowired(required = false)`, `Optional<T>` or `ObjectProvider<T>` for optional dependencies.",
      example: `@Service
public class ReportService {

    private final ReportRepository repository;

    // @Autowired not needed: single constructor
    public ReportService(ReportRepository repository) {
        this.repository = repository;
    }
}

@Service
public class ExportService {
    private final Optional<S3Uploader> uploader; // optional dependency

    public ExportService(Optional<S3Uploader> uploader) {
        this.uploader = uploader;
    }
}`,
      interviewPoints: [
        '@Autowired resolves by type, then @Primary/@Qualifier, then name.',
        'Optional on a single constructor since Spring 4.3.',
        'Required by default: missing bean = NoSuchBeanDefinitionException at startup.',
      ],
    },
    {
      id: 'constructor-injection',
      title: 'Constructor injection',
      explanation: "With constructor injection, dependencies are parameters of the constructor. Spring calls the constructor with the right beans when creating the object. The fields can be `final`, so the object is fully built and cannot change after creation.\n\nThis is the style recommended by the Spring team. Many projects use Lombok's `@RequiredArgsConstructor` to generate the constructor for all `final` fields.",
      example: `@Service
public class PaymentService {

    private final PaymentGateway gateway;
    private final PaymentRepository repository;

    public PaymentService(PaymentGateway gateway, PaymentRepository repository) {
        this.gateway = gateway;
        this.repository = repository;
    }
}`,
      interviewPoints: [
        'Allows final fields and immutable, always-valid objects.',
        'Easy to unit test: just call new PaymentService(mockGateway, mockRepo).',
        'Recommended by the Spring team for mandatory dependencies.',
      ],
    },
    {
      id: 'field-injection',
      title: 'Field injection',
      explanation: "With field injection, you put `@Autowired` directly on a field. Spring sets the field using reflection after the object is created. It is short and was very popular, but it has real downsides.\n\nThe fields cannot be `final`, the dependencies are hidden (you cannot see them from the constructor), and in a plain unit test without Spring the fields stay `null` unless you use reflection or a mocking framework. It also makes it easy to keep adding dependencies without noticing the class is doing too much. Field injection is still acceptable in test classes, for example `@Autowired MockMvc mockMvc;`.",
      example: `@Service
public class LegacyOrderService {

    @Autowired
    private OrderRepository orderRepository; // works, but not recommended

    @Autowired
    private EmailSender emailSender;
}`,
      interviewPoints: [
        'Cannot use final; object can exist in a half-initialised state.',
        'Hides dependencies and makes plain unit tests harder.',
        'Fine in test classes, discouraged in production code.',
      ],
    },
    {
      id: 'setter-injection',
      title: 'Setter injection',
      explanation: "With setter injection, Spring calls a setter method annotated with `@Autowired` after constructing the object. It suits optional dependencies, or dependencies that may be changed after creation.\n\nThe drawback is that the object can be used before the setter is called, so the dependency might be `null`, and the field cannot be `final`.",
      example: `@Service
public class PricingService {

    private DiscountPolicy discountPolicy = new NoDiscountPolicy(); // default

    @Autowired(required = false)
    public void setDiscountPolicy(DiscountPolicy discountPolicy) {
        this.discountPolicy = discountPolicy;
    }
}`,
      interviewPoints: [
        'Good for optional dependencies with a sensible default.',
        'Allows reconfiguring a bean after creation.',
        'Dependency might be null if not set; not immutable.',
      ],
    },
    {
      id: 'why-constructor-injection',
      title: 'Why constructor injection is preferred',
      explanation: "Constructor injection makes required dependencies explicit and guarantees the object is complete as soon as it exists. Fields can be `final`, which gives immutability and thread-safety for those references.\n\nIt is also the easiest to test, because you can create the class with `new` and pass mocks without starting Spring. A constructor with many parameters is a visible warning that the class has too many responsibilities. Finally, circular dependencies between constructor-injected beans fail fast at startup instead of hiding a design problem.",
      example: `// Plain unit test, no Spring needed
@Test
void chargesCustomer() {
    PaymentGateway gateway = mock(PaymentGateway.class);
    PaymentRepository repo = mock(PaymentRepository.class);
    PaymentService service = new PaymentService(gateway, repo);

    service.pay(100L);

    verify(gateway).charge(100L);
}`,
      interviewPoints: [
        'Immutability (final fields) and no half-built objects.',
        'Easy unit testing without a Spring context.',
        'Long constructors reveal classes that do too much.',
        'Circular dependencies are detected at startup.',
      ],
    },
    {
      id: 'primary',
      title: '@Primary',
      explanation: "When more than one bean matches a required type, Spring does not know which one to inject and fails with `NoUniqueBeanDefinitionException`. Marking one of them with `@Primary` makes it the default choice whenever there is ambiguity.\n\nOther injection points can still ask for a specific bean using `@Qualifier`.",
      example: `@Component
@Primary
public class StripeGateway implements PaymentGateway { }

@Component
public class PaypalGateway implements PaymentGateway { }

@Service
public class CheckoutService {
    public CheckoutService(PaymentGateway gateway) { // gets StripeGateway
    }
}`,
      interviewPoints: [
        '@Primary sets the default bean for a type.',
        'Only one bean of a type should be @Primary.',
        '@Qualifier at the injection point overrides @Primary.',
      ],
    },
    {
      id: 'qualifier',
      title: '@Qualifier',
      explanation: "`@Qualifier` lets you choose a specific bean by name (or by a custom qualifier) at the injection point. The default bean name is the class name with a lowercase first letter, for example `paypalGateway`, or the method name for `@Bean` methods.\n\nYou can also put `@Qualifier(\"name\")` on the bean itself to give it a qualifier value, and create your own qualifier annotations for type-safe selection.",
      example: `@Service
public class RefundService {

    private final PaymentGateway gateway;

    public RefundService(@Qualifier("paypalGateway") PaymentGateway gateway) {
        this.gateway = gateway;
    }
}`,
      interviewPoints: [
        '@Qualifier picks a specific bean; @Primary sets the default.',
        'When both exist, @Qualifier wins at that injection point.',
        'Default bean name = uncapitalised class name or @Bean method name.',
      ],
    },
    {
      id: 'inject-collections',
      title: 'Injecting lists and maps of beans',
      explanation: "If you inject a `List<T>`, Spring gives you every bean of type `T`. Their order can be controlled with `@Order` or by implementing `Ordered`. If you inject a `Map<String, T>`, the keys are bean names and the values are the beans.\n\nThis is a clean way to implement the strategy pattern: add a new implementation as a bean and it is picked up automatically, with no if/else chain to update.",
      example: `public interface DiscountRule {
    String code();
    long apply(long amount);
}

@Component @Order(1)
public class StudentDiscount implements DiscountRule { /* ... */ }

@Component @Order(2)
public class FestiveDiscount implements DiscountRule { /* ... */ }

@Service
public class DiscountService {
    private final List<DiscountRule> rules;              // all rules, ordered
    private final Map<String, DiscountRule> rulesByName; // key = bean name

    public DiscountService(List<DiscountRule> rules,
                           Map<String, DiscountRule> rulesByName) {
        this.rules = rules;
        this.rulesByName = rulesByName;
    }

    public long applyAll(long amount) {
        for (DiscountRule rule : rules) {
            amount = rule.apply(amount);
        }
        return amount;
    }
}`,
      interviewPoints: [
        'List<T> injects all beans of type T; @Order controls order.',
        'Map<String, T> injects bean name to bean.',
        'Great for strategy / plugin patterns.',
      ],
    },
    {
      id: 'circular-dependencies',
      title: 'Circular dependencies',
      explanation: "A circular dependency happens when bean A needs bean B and bean B needs bean A (directly or through a longer chain). With constructor injection Spring cannot create either one first, so it fails at startup with `BeanCurrentlyInCreationException`.\n\nSince Spring Boot 2.6, circular references are forbidden by default even for field and setter injection. You can re-enable them with `spring.main.allow-circular-references=true`, but that only hides a design problem. The real fix is to redesign: extract the shared logic into a third bean, use events, or rethink responsibilities. As a last resort, `@Lazy` on one constructor parameter injects a proxy that breaks the cycle.",
      example: `// Problem: A -> B -> A
@Service
class OrderService {
    OrderService(InvoiceService invoiceService) { }
}

@Service
class InvoiceService {
    InvoiceService(OrderService orderService) { } // cycle!
}

// Better: move the shared logic into a third bean both can use
@Service
class PricingCalculator { }

@Service
class OrderService {
    OrderService(PricingCalculator pricing) { }
}

@Service
class InvoiceService {
    InvoiceService(PricingCalculator pricing) { }
}`,
      interviewPoints: [
        'Constructor-injection cycles fail fast with BeanCurrentlyInCreationException.',
        'Spring Boot 2.6+ disallows circular references by default.',
        'Fix by redesigning; @Lazy is a workaround, not a solution.',
      ],
    },
  ],

  commonMistakes: [
    "Using field injection everywhere and then struggling to write unit tests because the fields are `null` outside Spring.",
    "Having two beans of the same interface without `@Primary` or `@Qualifier`, which causes `NoUniqueBeanDefinitionException` at startup.",
    "Misspelling the bean name in `@Qualifier`, for example `@Qualifier(\"PaypalGateway\")` instead of `paypalGateway`.",
    "Calling `new` on a class that has `@Autowired` fields and being surprised they are `null`, because only Spring-created objects get injected.",
    "Fixing a circular dependency by turning on `allow-circular-references` instead of fixing the design.",
  ],

  interviewTips: [
    "Always say you prefer constructor injection and give at least three reasons: final fields, testability, and explicit dependencies.",
    "When asked how Spring picks a bean, walk through the order: by type, then `@Qualifier`/`@Primary`, then by name, otherwise an exception.",
    "Show a tiny unit test that constructs a service with mocks; it proves you understand why DI matters.",
    "Mention injecting `List<T>` for the strategy pattern; it is a practical detail many candidates miss.",
  ],

  interviewQuestions: [
    {
      id: 'spring-di-q1',
      question: 'What is Dependency Injection?',
      answer: "Dependency Injection is a design pattern where an object receives the objects it depends on from the outside instead of creating them itself. In Spring, the container creates beans and injects their dependencies through constructors, setters or fields.\n\nThis keeps classes loosely coupled, because they depend on interfaces rather than concrete implementations, and makes them easy to test with mocks.",
      points: [
        'Dependencies are provided, not created with new.',
        'Spring container performs the injection.',
        'Benefits: loose coupling, testability, flexible configuration.',
      ],
      difficulty: 'Beginner',
    },
    {
      id: 'spring-di-q2',
      question: 'What are the types of dependency injection in Spring?',
      answer: "Spring supports constructor injection, setter injection and field injection. Constructor injection passes dependencies as constructor parameters and is recommended for required dependencies. Setter injection calls an `@Autowired` setter after construction and suits optional dependencies. Field injection sets `@Autowired` fields directly through reflection; it is concise but discouraged in production code.",
      example: `@Service
public class OrderService {
    private final OrderRepository repo;           // constructor injection
    private AuditLogger auditLogger;

    public OrderService(OrderRepository repo) { this.repo = repo; }

    @Autowired(required = false)                  // setter injection
    public void setAuditLogger(AuditLogger auditLogger) { this.auditLogger = auditLogger; }
}`,
      points: [
        'Constructor: required dependencies, final fields.',
        'Setter: optional or changeable dependencies.',
        'Field: short but hard to test; avoid in production code.',
      ],
      difficulty: 'Beginner',
    },
    {
      id: 'spring-di-q3',
      question: 'What does @Autowired do and is it always required?',
      answer: "`@Autowired` marks a constructor, setter or field as an injection point, and Spring injects a matching bean by type. It is not always required: if a class has exactly one constructor, Spring uses it automatically without the annotation (since Spring 4.3).\n\nBy default the dependency is mandatory, and startup fails if no bean matches. For optional dependencies use `@Autowired(required = false)`, `Optional<T>` or `ObjectProvider<T>`.",
      points: [
        'Injects by type.',
        'Not needed on a single constructor.',
        'Required by default; use required=false, Optional or ObjectProvider for optional beans.',
      ],
      difficulty: 'Beginner',
    },
    {
      id: 'spring-di-q4',
      question: 'Why is constructor injection preferred over field injection?',
      answer: "Constructor injection lets fields be `final`, so the object is immutable and always fully initialised; it can never exist without its dependencies. Dependencies are explicit in the constructor signature, and you can unit test the class simply by calling `new` with mocks, without Spring or reflection.\n\nIt also makes design problems visible: a constructor with eight parameters shows the class does too much, and circular dependencies fail immediately at startup. Field injection hides all of this.",
      points: [
        'final fields and guaranteed complete objects.',
        'Explicit dependencies and easy unit testing.',
        'Reveals too many responsibilities and circular dependencies early.',
      ],
      difficulty: 'Beginner',
    },
    {
      id: 'spring-di-q5',
      question: 'What is the difference between @Primary and @Qualifier?',
      answer: "Both solve the problem of multiple beans of the same type. `@Primary` is placed on a bean definition and makes it the default choice whenever there is ambiguity. `@Qualifier` is placed at the injection point (and optionally on the bean) and selects a specific bean by name or qualifier value.\n\nIf both are present, `@Qualifier` at the injection point wins. A common pattern is to mark the usual implementation `@Primary` and use `@Qualifier` in the few places that need a different one.",
      example: `@Bean @Primary
public DataSource mainDataSource() { /* ... */ return ds; }

@Bean
public DataSource reportingDataSource() { /* ... */ return ds; }

public ReportJob(@Qualifier("reportingDataSource") DataSource ds) { }`,
      points: [
        '@Primary: default bean, declared on the bean.',
        '@Qualifier: explicit choice, declared at injection point.',
        '@Qualifier overrides @Primary.',
      ],
      difficulty: 'Intermediate',
    },
    {
      id: 'spring-di-q6',
      question: 'How does Spring resolve which bean to inject when there are multiple candidates?',
      answer: "Spring first finds all beans assignable to the required type. If there is exactly one, it is injected. If there are several, Spring applies `@Qualifier` from the injection point, then looks for a bean marked `@Primary`, then considers `@Priority`, and finally tries to match the parameter or field name against bean names.\n\nIf none of these narrows it to one bean, startup fails with `NoUniqueBeanDefinitionException`. If no bean matches at all and the dependency is required, it fails with `NoSuchBeanDefinitionException`.",
      points: [
        'Type match first.',
        'Then @Qualifier, @Primary, @Priority, then name.',
        'NoUniqueBeanDefinitionException vs NoSuchBeanDefinitionException.',
      ],
      difficulty: 'Intermediate',
    },
    {
      id: 'spring-di-q7',
      question: 'How can you inject all implementations of an interface?',
      answer: "Inject a `List<T>` (or `Set<T>`, or `Collection<T>`) and Spring provides every bean of that type. Use `@Order` or implement `Ordered` to control the list order. Inject a `Map<String, T>` to get bean names as keys and the beans as values.\n\nThis is a clean way to implement the strategy pattern: you can look up a strategy by key, or apply every rule in order, and new implementations are picked up just by adding a new bean.",
      example: `@Service
public class PaymentRouter {
    private final Map<String, PaymentGateway> gateways;

    public PaymentRouter(Map<String, PaymentGateway> gateways) {
        this.gateways = gateways; // e.g. {"stripeGateway"=..., "paypalGateway"=...}
    }

    public PaymentGateway forProvider(String beanName) {
        return gateways.get(beanName);
    }
}`,
      points: [
        'List<T> / Set<T>: all beans of type T.',
        'Map<String, T>: bean name to bean.',
        '@Order controls ordering in lists.',
      ],
      difficulty: 'Intermediate',
    },
    {
      id: 'spring-di-q8',
      question: 'What is a circular dependency and how do you resolve it?',
      answer: "A circular dependency occurs when bean A depends on B and B depends on A, directly or through a chain. With constructor injection neither bean can be created first, so Spring fails with `BeanCurrentlyInCreationException`. Since Spring Boot 2.6, circular references are also rejected by default for field and setter injection.\n\nThe proper fix is a redesign: extract the shared logic into a third bean, merge responsibilities, or decouple using application events. Workarounds include `@Lazy` on one injection point, which injects a lazy proxy, or setting `spring.main.allow-circular-references=true`, but these hide the underlying design issue.",
      points: [
        'Usually a sign of poor separation of responsibilities.',
        'Redesign first: extract a third bean or use events.',
        '@Lazy and allow-circular-references are workarounds.',
      ],
      difficulty: 'Advanced',
    },
    {
      id: 'spring-di-q9',
      question: 'How do you inject a prototype-scoped bean into a singleton so you get a new instance each time?',
      answer: "If a singleton gets a prototype bean through normal injection, it receives one instance at creation time and keeps it forever, so you lose the prototype behaviour. To get a fresh instance on every use, inject an `ObjectProvider<T>` (or `jakarta.inject.Provider<T>`) and call `getObject()` when you need one.\n\nAlternatives are `@Lookup` method injection, where Spring overrides an abstract-like method to return a new bean, or making the prototype a scoped proxy.",
      example: `@Service
public class ImportService {
    private final ObjectProvider<CsvParser> parserProvider;

    public ImportService(ObjectProvider<CsvParser> parserProvider) {
        this.parserProvider = parserProvider;
    }

    public void importFile(Path file) {
        CsvParser parser = parserProvider.getObject(); // new instance each call
        parser.parse(file);
    }
}`,
      points: [
        'Direct injection gives the singleton only one prototype instance.',
        'ObjectProvider.getObject() or Provider.get() gives a new one each time.',
        '@Lookup and scoped proxies are other options.',
      ],
      difficulty: 'Advanced',
    },
    {
      id: 'spring-di-q10',
      question: 'Why are @Autowired fields null when I create an object with new?',
      answer: "Dependency injection only happens for objects that the Spring container creates and manages. When you write `new OrderService()`, Spring is not involved, so it never processes the `@Autowired` annotations and the fields stay `null`, leading to a `NullPointerException`.\n\nThe fix is to let Spring create the object, by making it a bean and injecting it where needed, instead of instantiating it manually. With constructor injection this mistake is harder to make, because `new` would require passing the dependencies explicitly.",
      points: [
        'Only container-managed beans get injected.',
        'new bypasses Spring completely.',
        'Inject the bean instead of instantiating it.',
      ],
      difficulty: 'Intermediate',
    },
    {
      id: 'spring-di-q11',
      question: 'How would you choose a bean implementation at runtime based on configuration or input?',
      answer: "For configuration-based choice, use conditional beans: `@ConditionalOnProperty` (Spring Boot) or `@Profile` so that only one implementation is registered, based on a property or active profile. For input-based choice at runtime, inject a `Map<String, T>` or `List<T>` of all implementations and pick the right one per request, which is the strategy pattern.\n\nThis keeps callers depending only on the interface and avoids `if/else` chains that must change every time a new implementation is added.",
      example: `@Component
@ConditionalOnProperty(name = "storage.type", havingValue = "s3")
public class S3Storage implements FileStorage { }

@Component
@ConditionalOnProperty(name = "storage.type", havingValue = "local", matchIfMissing = true)
public class LocalStorage implements FileStorage { }`,
      points: [
        'Startup-time choice: @Profile, @ConditionalOnProperty.',
        'Per-request choice: Map/List injection plus a strategy lookup.',
        'Callers depend only on the interface.',
      ],
      difficulty: 'Advanced',
    },
  ],
}

export default topic
