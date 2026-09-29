const topic = {
  id: 'java-design-patterns',
  category: 'java',
  title: 'Design Patterns',
  description: "Proven solutions to common design problems: Singleton, Factory, Builder, Strategy, Observer, Decorator, Adapter, Proxy and Template Method, and where Spring uses them.",
  difficulty: 'Intermediate',
  overview: "A design pattern is a reusable, named solution to a problem that keeps appearing in software design. It is not finished code you copy, but a proven template for arranging classes and objects. Many patterns were catalogued in the 1994 \"Gang of Four\" (GoF) book, which groups them into creational (how objects are created), structural (how objects are composed) and behavioural (how objects communicate).\n\nThink of patterns like standard recipes in cooking. \"Make a roux\" tells an experienced cook exactly what to do without explaining each step. In the same way, saying \"use a Builder\" or \"this is a Strategy\" gives developers a shared vocabulary and a tested design in one word.\n\nPatterns are everywhere in Java and Spring: every Spring bean is a Singleton by default, `BeanFactory` is a Factory, `@Transactional` works through a Proxy, `JdbcTemplate` uses Template Method, and application events are Observer. Interviewers ask about patterns to check your design thinking; be ready to explain the problem each pattern solves, sketch its code, and name a real JDK or Spring example.",
  subtopics: [
    {
      id: 'what-are-patterns',
      title: 'What Are Design Patterns?',
      explanation: "Design patterns are general, reusable solutions to recurring design problems. The GoF book describes 23 patterns in three groups. Creational patterns deal with object creation (Singleton, Factory Method, Abstract Factory, Builder, Prototype). Structural patterns deal with composing classes and objects (Adapter, Decorator, Proxy, Facade, Composite, Bridge, Flyweight). Behavioural patterns deal with responsibilities and communication (Strategy, Observer, Template Method, Command, Iterator, State, Chain of Responsibility and others).\n\nUse patterns when they fit a real problem. Forcing patterns into simple code adds needless complexity.",
      interviewPoints: [
        'Three categories: creational, structural, behavioural',
        'Patterns give a shared vocabulary between developers',
        'Many build on SOLID: program to interfaces, prefer composition',
        'Do not over-apply them',
      ],
    },
    {
      id: 'singleton',
      title: 'Singleton (and Thread-Safe Variants)',
      explanation: "Singleton ensures a class has only one instance and gives global access to it. Use it for shared, stateless or carefully synchronized resources like configuration or a registry.\n\nThe naive lazy version is not thread safe: two threads can both see `null` and create two instances. Thread-safe options: eager initialization (created when the class loads), a `synchronized` getter (simple but locks every call), double-checked locking with a `volatile` field (lazy and fast), the Bill Pugh holder idiom (lazy, uses class-loading guarantees, no locking), and the enum singleton (simplest, also safe against reflection and serialization).",
      example: `// 1. Eager: thread safe, created at class load
public class EagerSingleton {
    private static final EagerSingleton INSTANCE = new EagerSingleton();
    private EagerSingleton() { }
    public static EagerSingleton getInstance() { return INSTANCE; }
}

// 2. Lazy, NOT thread safe (do not use with multiple threads)
public class LazySingleton {
    private static LazySingleton instance;
    private LazySingleton() { }
    public static LazySingleton getInstance() {
        if (instance == null) instance = new LazySingleton();  // race condition
        return instance;
    }
}

// 3. Double-checked locking: volatile is essential
public class DclSingleton {
    private static volatile DclSingleton instance;
    private DclSingleton() { }
    public static DclSingleton getInstance() {
        if (instance == null) {                       // first check, no lock
            synchronized (DclSingleton.class) {
                if (instance == null) {               // second check, with lock
                    instance = new DclSingleton();
                }
            }
        }
        return instance;
    }
}

// 4. Bill Pugh holder: lazy and thread safe without locks
public class HolderSingleton {
    private HolderSingleton() { }
    private static class Holder {
        private static final HolderSingleton INSTANCE = new HolderSingleton();
    }
    public static HolderSingleton getInstance() { return Holder.INSTANCE; }
}

// 5. Enum: recommended by Effective Java
public enum EnumSingleton {
    INSTANCE;
    public void doWork() { System.out.println("working"); }
}`,
      interviewPoints: [
        'Private constructor + static access method',
        'volatile is required in double-checked locking to prevent seeing a half-constructed object',
        'Holder idiom is lazy and lock-free thanks to class loading',
        'Enum singleton resists reflection and serialization attacks',
        'Spring beans are singletons per container, not per JVM',
      ],
    },
    {
      id: 'factory',
      title: 'Factory Method and Simple Factory',
      explanation: "A factory hides the logic of creating objects. The caller asks for \"a notification for EMAIL\" and gets an object implementing `Notification`, without knowing the concrete class or calling `new` itself. This keeps creation logic in one place and lets you add new types easily.\n\nA Simple Factory is a class with a method that returns different implementations based on input. The GoF Factory Method pattern defines a method in a base class that subclasses override to decide which object to create. Abstract Factory goes further and creates families of related objects. JDK examples: `Calendar.getInstance()`, `List.of()`, `NumberFormat.getInstance()`.",
      example: `public interface Notification {
    void send(String to, String message);
}

public class EmailNotification implements Notification {
    public void send(String to, String message) { System.out.println("Email to " + to); }
}

public class SmsNotification implements Notification {
    public void send(String to, String message) { System.out.println("SMS to " + to); }
}

// Simple factory
public class NotificationFactory {
    public static Notification create(String channel) {
        return switch (channel) {
            case "EMAIL" -> new EmailNotification();
            case "SMS" -> new SmsNotification();
            default -> throw new IllegalArgumentException("Unknown channel " + channel);
        };
    }
}

Notification n = NotificationFactory.create("SMS");
n.send("9876543210", "Your OTP is 1234");

// Factory Method: subclasses decide what to create
public abstract class Dialog {
    protected abstract Button createButton();      // the factory method
    public void render() { createButton().draw(); }
}

public class WebDialog extends Dialog {
    protected Button createButton() { return new HtmlButton(); }
}`,
      interviewPoints: [
        'Hides object-creation logic from callers',
        'Callers depend on an interface, not concrete classes',
        'Factory Method: subclasses choose the product',
        'Spring BeanFactory/ApplicationContext and FactoryBean are factories',
      ],
    },
    {
      id: 'builder',
      title: 'Builder',
      explanation: "Builder constructs complex objects step by step with readable, named method calls, then creates the final object with `build()`. It solves the \"telescoping constructor\" problem, where a class has many constructors with long lists of parameters that are easy to mix up, and it works well with immutable objects and optional fields.\n\nJDK and library examples: `StringBuilder`, `HttpRequest.newBuilder()`, `Stream.builder()`, Lombok's `@Builder`, Spring's `ResponseEntity.ok().header(...).body(...)` and `WebClient.builder()`.",
      example: `public final class User {
    private final String name;          // required
    private final String email;         // required
    private final int age;              // optional
    private final String phone;         // optional

    private User(Builder b) {
        this.name = b.name;
        this.email = b.email;
        this.age = b.age;
        this.phone = b.phone;
    }

    public static Builder builder(String name, String email) {
        return new Builder(name, email);
    }

    public static class Builder {
        private final String name;
        private final String email;
        private int age;
        private String phone;

        private Builder(String name, String email) {
            this.name = name;
            this.email = email;
        }

        public Builder age(int age) { this.age = age; return this; }
        public Builder phone(String phone) { this.phone = phone; return this; }

        public User build() {
            if (age < 0) throw new IllegalStateException("age must be >= 0");
            return new User(this);
        }
    }
}

User user = User.builder("Asha", "asha@example.com")
        .age(28)
        .phone("9876543210")
        .build();`,
      interviewPoints: [
        'Solves telescoping constructors and unreadable parameter lists',
        'Pairs well with immutable objects',
        'Validation can happen in build()',
        'Lombok @Builder generates it automatically',
      ],
    },
    {
      id: 'strategy',
      title: 'Strategy',
      explanation: "Strategy defines a family of interchangeable algorithms behind one interface and lets you pick one at runtime. The class using it (the context) holds a reference to the interface and delegates the work. This removes big `if/else` blocks and follows the Open/Closed Principle: to add an algorithm, add a class.\n\nJDK example: `Comparator` is a strategy for sorting passed to `List.sort()`. With Java 8, a strategy can often be just a lambda.",
      example: `public interface ShippingStrategy {
    double cost(double weightKg);
}

public class StandardShipping implements ShippingStrategy {
    public double cost(double weightKg) { return 40 + weightKg * 5; }
}

public class ExpressShipping implements ShippingStrategy {
    public double cost(double weightKg) { return 100 + weightKg * 10; }
}

public class Checkout {
    private ShippingStrategy strategy;

    public Checkout(ShippingStrategy strategy) { this.strategy = strategy; }
    public void setStrategy(ShippingStrategy strategy) { this.strategy = strategy; }

    public double shippingCost(double weightKg) {
        return strategy.cost(weightKg);            // delegate
    }
}

Checkout checkout = new Checkout(new StandardShipping());
checkout.shippingCost(2);                          // 50.0
checkout.setStrategy(new ExpressShipping());
checkout.shippingCost(2);                          // 120.0
checkout.setStrategy(w -> 0);                      // lambda: free shipping

// JDK: Comparator is a strategy
users.sort(Comparator.comparing(User::getAge));`,
      interviewPoints: [
        'Encapsulates interchangeable algorithms behind an interface',
        'Chosen at runtime; replaces conditionals',
        'Comparator is the classic JDK example',
        'Lambdas make simple strategies concise',
      ],
    },
    {
      id: 'observer',
      title: 'Observer',
      explanation: "Observer defines a one-to-many relationship: when one object (the subject or publisher) changes, all registered observers (subscribers) are notified automatically. The subject does not need to know the concrete observer classes, which keeps them loosely coupled.\n\nExamples: GUI event listeners, Spring's `ApplicationEventPublisher` with `@EventListener`, and at a larger scale, message brokers like Kafka follow the same publish/subscribe idea.",
      example: `public interface OrderListener {
    void onOrderPlaced(Order order);
}

public class OrderService {
    private final List<OrderListener> listeners = new ArrayList<>();

    public void subscribe(OrderListener listener) { listeners.add(listener); }

    public void placeOrder(Order order) {
        // ... save order ...
        listeners.forEach(l -> l.onOrderPlaced(order));   // notify all
    }
}

OrderService service = new OrderService();
service.subscribe(o -> System.out.println("Email receipt for " + o.id()));
service.subscribe(o -> System.out.println("Update inventory for " + o.id()));

// Spring version
public record OrderPlacedEvent(Long orderId) { }

@Service
public class CheckoutService {
    private final ApplicationEventPublisher publisher;
    public CheckoutService(ApplicationEventPublisher publisher) { this.publisher = publisher; }

    public void checkout(Long orderId) {
        publisher.publishEvent(new OrderPlacedEvent(orderId));
    }
}

@Component
public class InvoiceListener {
    @EventListener
    public void handle(OrderPlacedEvent event) {
        System.out.println("Create invoice for " + event.orderId());
    }
}`,
      interviewPoints: [
        'One-to-many notification on state change',
        'Subject knows only the observer interface',
        'Spring: ApplicationEventPublisher + @EventListener',
        'Watch for memory leaks from listeners never unsubscribed',
      ],
    },
    {
      id: 'decorator',
      title: 'Decorator',
      explanation: "Decorator adds behaviour to an object dynamically by wrapping it in another object that implements the same interface. Each decorator does its extra work and then delegates to the wrapped object. You can stack decorators in any combination, which avoids an explosion of subclasses.\n\nThe Java I/O library is the classic example: `new BufferedReader(new InputStreamReader(new FileInputStream(file)))`. `Collections.unmodifiableList()` and `synchronizedList()` are decorators too.",
      example: `public interface Coffee {
    double cost();
    String description();
}

public class SimpleCoffee implements Coffee {
    public double cost() { return 100; }
    public String description() { return "Coffee"; }
}

public abstract class CoffeeDecorator implements Coffee {
    protected final Coffee inner;
    protected CoffeeDecorator(Coffee inner) { this.inner = inner; }
}

public class Milk extends CoffeeDecorator {
    public Milk(Coffee inner) { super(inner); }
    public double cost() { return inner.cost() + 20; }
    public String description() { return inner.description() + ", milk"; }
}

public class Caramel extends CoffeeDecorator {
    public Caramel(Coffee inner) { super(inner); }
    public double cost() { return inner.cost() + 30; }
    public String description() { return inner.description() + ", caramel"; }
}

Coffee order = new Caramel(new Milk(new SimpleCoffee()));
System.out.println(order.description() + " = " + order.cost());
// Coffee, milk, caramel = 150.0

// JDK I/O decorators
BufferedReader reader = new BufferedReader(new InputStreamReader(new FileInputStream("a.txt")));`,
      interviewPoints: [
        'Wraps an object with the same interface to add behaviour',
        'Decorators can be stacked at runtime',
        'Alternative to many subclasses (composition over inheritance)',
        'Java I/O streams are decorators',
      ],
    },
    {
      id: 'adapter',
      title: 'Adapter',
      explanation: "Adapter converts the interface of an existing class into the interface a client expects, so classes with incompatible interfaces can work together. It is like a travel plug adapter: the device and the socket stay the same, the adapter sits in between.\n\nIt is often used to integrate a third-party or legacy library without changing your code or theirs. JDK examples: `Arrays.asList()` (array to List), `InputStreamReader` (byte stream to character reader). In Spring MVC, `HandlerAdapter` lets the `DispatcherServlet` call different kinds of handlers in a uniform way.",
      example: `// What our application expects
public interface PaymentGateway {
    boolean pay(String orderId, double amountInRupees);
}

// Third-party SDK we cannot change: different method and units
public class StripeClient {
    public String charge(long amountInPaise, String reference) {
        return "SUCCESS";
    }
}

// Adapter: implements our interface, delegates to the SDK
public class StripeAdapter implements PaymentGateway {
    private final StripeClient client;

    public StripeAdapter(StripeClient client) { this.client = client; }

    @Override
    public boolean pay(String orderId, double amountInRupees) {
        long paise = Math.round(amountInRupees * 100);
        return "SUCCESS".equals(client.charge(paise, orderId));
    }
}

PaymentGateway gateway = new StripeAdapter(new StripeClient());
gateway.pay("ORD-1", 499.0);`,
      interviewPoints: [
        'Makes incompatible interfaces work together',
        'Wraps an existing class (object adapter via composition)',
        'Great for third-party and legacy integrations',
        'Spring MVC HandlerAdapter is an example',
      ],
    },
    {
      id: 'proxy',
      title: 'Proxy',
      explanation: "Proxy provides a stand-in object that controls access to the real object. It has the same interface, so the client does not notice, but it can add logic before or after delegating: lazy loading, access control, caching, logging, remote calls or transactions.\n\nDecorator and Proxy look similar in code. The difference is intent: a decorator adds features chosen by the client, while a proxy controls access to the object, often created by a framework. Spring AOP creates proxies for `@Transactional`, `@Cacheable` and `@Async`; Hibernate uses proxies for lazy-loaded entities.",
      example: `public interface ReportService {
    String generate(String id);
}

public class RealReportService implements ReportService {
    public String generate(String id) {
        System.out.println("Expensive generation for " + id);
        return "Report " + id;
    }
}

// Caching proxy
public class CachingReportProxy implements ReportService {
    private final ReportService target;
    private final Map<String, String> cache = new ConcurrentHashMap<>();

    public CachingReportProxy(ReportService target) { this.target = target; }

    @Override
    public String generate(String id) {
        return cache.computeIfAbsent(id, target::generate);
    }
}

ReportService service = new CachingReportProxy(new RealReportService());
service.generate("42");   // Expensive generation for 42
service.generate("42");   // served from cache

// Spring creates such proxies for you:
// @Cacheable("reports") public String generate(String id) { ... }`,
      interviewPoints: [
        'Same interface as the real object; controls access',
        'Uses: lazy loading, security, caching, logging, remote access',
        'Spring AOP uses JDK dynamic proxies or CGLIB',
        'Self-invocation bypasses Spring proxies',
      ],
    },
    {
      id: 'template-method',
      title: 'Template Method',
      explanation: "Template Method defines the skeleton of an algorithm in a base class method (usually `final`) and lets subclasses fill in specific steps by overriding abstract or hook methods. The overall order of steps stays fixed and reused; only the variable parts change.\n\nExamples: `AbstractList` (you implement `get` and `size`, it provides the rest), JUnit's lifecycle, and Spring's `JdbcTemplate`, `RestTemplate` and `TransactionTemplate`, which handle the boilerplate (open connection, handle errors, close resources) while you supply the variable part, usually as a callback lambda.",
      example: `public abstract class DataImporter {

    // The template method: fixed order of steps
    public final void importData(String source) {
        List<String> raw = read(source);
        List<String> clean = validate(raw);
        save(clean);
        afterImport();                         // optional hook
    }

    protected abstract List<String> read(String source);
    protected abstract void save(List<String> rows);

    protected List<String> validate(List<String> rows) {   // default step
        return rows.stream().filter(r -> !r.isBlank()).toList();
    }

    protected void afterImport() { }           // hook: empty by default
}

public class CsvImporter extends DataImporter {
    protected List<String> read(String source) { return List.of("a,1", "", "b,2"); }
    protected void save(List<String> rows) { System.out.println("Saved " + rows.size()); }
}

new CsvImporter().importData("users.csv");   // Saved 2

// Spring's JdbcTemplate: it handles connections and exceptions, you supply the mapping
List<String> names = jdbcTemplate.query("SELECT name FROM users",
        (rs, rowNum) -> rs.getString("name"));`,
      interviewPoints: [
        'Base class fixes the algorithm skeleton; subclasses supply steps',
        'Template method is often final',
        'Hooks are optional steps with default behaviour',
        'JdbcTemplate, RestTemplate, TransactionTemplate use this idea',
      ],
    },
    {
      id: 'patterns-in-spring',
      title: 'Design Patterns Used Inside Spring',
      explanation: "Spring is a great catalogue of patterns. Singleton: beans are singleton-scoped by default (one instance per container). Factory: `BeanFactory` and `ApplicationContext` create beans, and `FactoryBean` lets you customize creation. Proxy: AOP features like `@Transactional`, `@Cacheable`, `@Async` and `@PreAuthorize` use proxies. Template Method: `JdbcTemplate`, `RestTemplate`, `JmsTemplate`, `TransactionTemplate`. Observer: `ApplicationEvent`, `ApplicationEventPublisher` and `@EventListener`. Strategy: `PlatformTransactionManager`, `Resource` loaders and many pluggable interfaces. Adapter: `HandlerAdapter` in Spring MVC. Front Controller: `DispatcherServlet`. Decorator: `BeanPostProcessor` wrapping beans, `HttpServletRequestWrapper`. Builder: `UriComponentsBuilder`, `ResponseEntity`, `WebClient.builder()`. Dependency Injection itself is an implementation of Inversion of Control.",
      example: `// Singleton + Factory + Proxy all at once
@Service                                    // singleton bean created by the container (factory)
public class TransferService {

    @Transactional                          // called through a proxy
    public void transfer(Long from, Long to, BigDecimal amount) { /* ... */ }
}

// Template Method
jdbcTemplate.update("UPDATE account SET balance = balance - ? WHERE id = ?", amount, from);

// Builder
URI uri = UriComponentsBuilder.fromUriString("https://api.example.com")
        .path("/users/{id}")
        .buildAndExpand(42)
        .toUri();

ResponseEntity<User> resp = ResponseEntity.ok().header("X-Trace", "abc").body(user);`,
      interviewPoints: [
        'Singleton scope, BeanFactory, AOP proxies',
        'JdbcTemplate and RestTemplate = Template Method',
        'ApplicationEvents = Observer',
        'DispatcherServlet = Front Controller; HandlerAdapter = Adapter',
      ],
    },
  ],
  commonMistakes: [
    "Writing a lazy singleton without synchronization, or using double-checked locking without `volatile`.",
    "Confusing a Spring singleton bean (one per application context) with the GoF Singleton (one per class loader/JVM).",
    "Forcing patterns into simple code, adding factories and interfaces where a plain class would be clearer.",
    "Mixing up Decorator and Proxy: they look alike, but a decorator adds features while a proxy controls access.",
    "Putting mutable state in a singleton (or singleton Spring bean) without thread safety, causing race conditions between requests.",
  ],
  interviewTips: [
    "For every pattern prepare four things: the problem it solves, a short code sketch, a JDK example and a Spring example.",
    "Know at least three thread-safe Singleton implementations and explain why `volatile` is needed in double-checked locking.",
    "When asked which patterns Spring uses, list several confidently: Singleton, Factory, Proxy, Template Method, Observer, Adapter, Front Controller.",
    "Link patterns to SOLID: Strategy and Decorator support Open/Closed, Factory supports Dependency Inversion.",
  ],
  interviewQuestions: [
    {
      id: 'java-design-patterns-q1',
      question: 'What are design patterns, and what are their main categories?',
      answer: "Design patterns are proven, reusable solutions to common software design problems, described as templates rather than finished code. The Gang of Four catalogue has three categories: creational (object creation, e.g. Singleton, Factory, Builder), structural (composition of classes and objects, e.g. Adapter, Decorator, Proxy) and behavioural (communication and responsibilities, e.g. Strategy, Observer, Template Method). They give teams a shared vocabulary and tested designs.",
      points: ['Reusable solutions to recurring problems', 'Creational, structural, behavioural', 'Shared vocabulary', 'Not to be over-applied'],
      difficulty: 'Beginner',
    },
    {
      id: 'java-design-patterns-q2',
      question: 'What is the Singleton pattern? Give a simple implementation.',
      answer: "Singleton ensures a class has exactly one instance and provides a global point of access to it. You make the constructor private, keep the single instance in a static field and expose it through a static method. The simplest thread-safe version is eager initialization, where the instance is created when the class is loaded.",
      example: `public class AppConfig {
    private static final AppConfig INSTANCE = new AppConfig();
    private AppConfig() { }
    public static AppConfig getInstance() { return INSTANCE; }
}`,
      points: ['Private constructor', 'Static instance field', 'Static access method', 'Eager initialization is thread safe'],
      difficulty: 'Beginner',
    },
    {
      id: 'java-design-patterns-q3',
      question: 'What is the Builder pattern and when would you use it?',
      answer: "Builder constructs a complex object step by step with named methods and a final `build()` call. Use it when a class has many parameters, especially optional ones, where multiple constructors (telescoping constructors) would be confusing and error-prone. It produces readable code, supports immutable objects and allows validation in `build()`. Lombok's `@Builder` generates builders automatically.",
      example: `Pizza pizza = Pizza.builder()
        .size("LARGE")
        .cheese(true)
        .topping("olives")
        .build();`,
      points: ['Avoids telescoping constructors', 'Readable, named parameters', 'Works well with immutability', 'Lombok @Builder'],
      difficulty: 'Beginner',
    },
    {
      id: 'java-design-patterns-q4',
      question: 'What is the Factory pattern, and how is it different from Builder?',
      answer: "A Factory decides which concrete class to create and returns it through a common interface, hiding the `new` and the selection logic from the caller (e.g. `NotificationFactory.create(\"SMS\")` returns an `SmsNotification`). Builder focuses on how to assemble one complex object step by step. So Factory answers \"which type?\" in one call, while Builder answers \"how to configure this object?\" through several calls.",
      example: `Notification n = NotificationFactory.create("EMAIL");   // factory: picks the type
HttpRequest req = HttpRequest.newBuilder()               // builder: configures one object
        .uri(URI.create("https://example.com"))
        .GET()
        .build();`,
      points: ['Factory: selects and creates an implementation', 'Builder: step-by-step construction', 'Both hide construction details', 'Factory supports Dependency Inversion'],
      difficulty: 'Intermediate',
    },
    {
      id: 'java-design-patterns-q5',
      question: 'Explain the Strategy pattern with a real example.',
      answer: "Strategy puts interchangeable algorithms behind a common interface so the client can choose one at runtime without conditionals. For example, a checkout service can use a `DiscountStrategy` with implementations like `NoDiscount`, `PercentageDiscount` and `FestivalDiscount`. The service simply calls `strategy.apply(amount)`. In the JDK, `Comparator` is a strategy passed to `sort()`. In Spring, you can inject all strategy beans as a `Map<String, DiscountStrategy>` and pick one by name.",
      example: `@Service
public class PricingService {
    private final Map<String, DiscountStrategy> strategies;  // bean name -> strategy

    public PricingService(Map<String, DiscountStrategy> strategies) {
        this.strategies = strategies;
    }

    public double price(String code, double amount) {
        return strategies.getOrDefault(code, a -> a).apply(amount);
    }
}`,
      points: ['Family of interchangeable algorithms', 'Selected at runtime', 'Removes if/else chains', 'Comparator is a JDK example'],
      difficulty: 'Intermediate',
    },
    {
      id: 'java-design-patterns-q6',
      question: 'What is the difference between the Decorator, Proxy and Adapter patterns?',
      answer: "All three wrap another object, but for different reasons. Adapter changes the interface: it makes an existing class fit the interface a client expects. Decorator keeps the same interface and adds behaviour, and decorators can be stacked (e.g. `BufferedReader` around `FileReader`). Proxy keeps the same interface and controls access to the real object, for lazy loading, security, caching or transactions (e.g. Spring's `@Transactional` proxies, Hibernate lazy proxies).",
      points: ['Adapter: different interface, compatibility', 'Decorator: same interface, added features, stackable', 'Proxy: same interface, controlled access', 'All use composition'],
      difficulty: 'Intermediate',
    },
    {
      id: 'java-design-patterns-q7',
      question: 'Explain the Observer pattern and how Spring supports it.',
      answer: "In Observer, a subject keeps a list of observers and notifies all of them when something happens, so the subject does not depend on concrete observer classes. Spring supports it with application events: a bean publishes an event with `ApplicationEventPublisher.publishEvent(event)`, and any bean with an `@EventListener` method for that event type is called. `@TransactionalEventListener` can delay listeners until the transaction commits, and `@Async` can run them in another thread.",
      example: `publisher.publishEvent(new UserRegisteredEvent(user.getId()));

@EventListener
public void sendWelcome(UserRegisteredEvent e) { /* send email */ }`,
      points: ['One-to-many notifications', 'Loose coupling between publisher and listeners', 'ApplicationEventPublisher + @EventListener', '@TransactionalEventListener for after-commit'],
      difficulty: 'Intermediate',
    },
    {
      id: 'java-design-patterns-q8',
      question: 'How do you make a Singleton thread safe? Why is volatile needed in double-checked locking?',
      answer: "Options: eager initialization; a `synchronized` `getInstance()` (correct but locks every call); double-checked locking with a `volatile` field; the Bill Pugh initialization-on-demand holder (a static nested class holds the instance, created lazily and safely by the JVM's class-loading rules); or an enum singleton.\n\nIn double-checked locking, `instance = new Singleton()` is not atomic: allocate memory, run the constructor, assign the reference. Without `volatile`, the JVM may reorder these so another thread sees a non-null reference to an object whose constructor has not finished. `volatile` forbids that reordering and guarantees visibility across threads.",
      example: `private static volatile Singleton instance;

public static Singleton getInstance() {
    if (instance == null) {
        synchronized (Singleton.class) {
            if (instance == null) instance = new Singleton();
        }
    }
    return instance;
}`,
      points: ['Eager, synchronized, DCL, holder idiom, enum', 'Object creation can be reordered', 'volatile prevents reordering and ensures visibility', 'Holder idiom is lazy without locks'],
      difficulty: 'Advanced',
    },
    {
      id: 'java-design-patterns-q9',
      question: 'Which design patterns does the Spring Framework use internally?',
      answer: "Singleton: beans are singleton-scoped by default. Factory: `BeanFactory`, `ApplicationContext` and `FactoryBean` create beans. Proxy: AOP (`@Transactional`, `@Cacheable`, `@Async`, method security) uses JDK dynamic proxies or CGLIB. Template Method: `JdbcTemplate`, `RestTemplate`, `TransactionTemplate`. Observer: application events and `@EventListener`. Front Controller: `DispatcherServlet`. Adapter: `HandlerAdapter`. Strategy: pluggable interfaces like `PlatformTransactionManager` and `ViewResolver`. Builder: `UriComponentsBuilder`, `WebClient.builder()`. Dependency Injection is Spring's implementation of Inversion of Control.",
      points: ['Singleton and Factory for beans', 'Proxy for AOP', 'Template Method for *Template classes', 'Observer for events', 'Front Controller and Adapter in MVC'],
      difficulty: 'Advanced',
    },
    {
      id: 'java-design-patterns-q10',
      question: 'Is a Spring singleton bean the same as the GoF Singleton pattern? What are the thread-safety implications?',
      answer: "No. A GoF Singleton guarantees one instance per class loader, enforced by the class itself with a private constructor. A Spring singleton bean means one instance per Spring container for that bean definition; the class is a normal class, you can still create other instances with `new`, and you could define two beans of the same class. In both cases the single instance is shared by all threads (every HTTP request), so singleton beans should be stateless or hold only thread-safe state; never store request-specific data in instance fields. Use method parameters, local variables, `ThreadLocal`, or a request/prototype scope when per-request state is needed.",
      example: `@Service
public class CounterService {
    private int count;                                  // BAD: shared by all requests
    private final AtomicInteger safeCount = new AtomicInteger(); // OK

    public int next() { return safeCount.incrementAndGet(); }
}`,
      points: ['GoF: one per class loader, enforced by the class', 'Spring: one per container per bean definition', 'Shared across threads', 'Keep singleton beans stateless or thread safe'],
      difficulty: 'Advanced',
    },
  ],
}

export default topic
