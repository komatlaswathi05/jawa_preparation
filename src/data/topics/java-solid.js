const topic = {
  id: 'java-solid',
  category: 'java',
  title: 'SOLID Principles',
  description: "Five object-oriented design principles for code that is easy to change, test and extend, each shown with bad vs good Java and how Spring supports them.",
  difficulty: 'Intermediate',
  overview: "SOLID is an acronym for five design principles collected by Robert C. Martin (\"Uncle Bob\"): Single Responsibility, Open/Closed, Liskov Substitution, Interface Segregation and Dependency Inversion. They are guidelines, not laws, that help you write classes which are easy to understand, change and test.\n\nThink of a well-organised kitchen. Each tool has one job (a knife cuts, a pan fries). You can add a new appliance without rebuilding the kitchen. Any brand of kettle that fits the socket works. You are not forced to own a gadget with 30 attachments you never use. And the appliances plug into a standard socket instead of being wired directly into the wall. Those five ideas map closely to the five SOLID principles.\n\nIn interviews, SOLID questions check whether you can design maintainable code, not just make it work. Spring itself is built around these ideas: dependency injection is Dependency Inversion in action, and small interfaces with swappable implementations let you follow Open/Closed and Liskov naturally. Be ready to explain each principle, show a violation and fix it.",
  subtopics: [
    {
      id: 'why-solid',
      title: 'Why SOLID Matters',
      explanation: "Code that violates SOLID tends to become rigid (one change forces many others), fragile (a change breaks unrelated things) and hard to test (you cannot test a class without its database, email server and more). SOLID reduces coupling (how much classes depend on each other) and increases cohesion (how focused each class is).\n\nThe principles work together. Small focused classes (S) behind small interfaces (I) that depend on abstractions (D) are easy to extend (O) and to swap safely (L).",
      interviewPoints: [
        'Goal: low coupling, high cohesion',
        'Makes code easier to change, test and reuse',
        'Guidelines to apply with judgement, not rigid rules',
      ],
    },
    {
      id: 'single-responsibility',
      title: 'S — Single Responsibility Principle (SRP)',
      explanation: "A class should have only one reason to change, meaning it should be responsible to one kind of requirement or one actor. If a class handles business rules, database access and email formatting, then changes from three different teams all hit the same class.\n\nThe fix is to split it into focused classes, each with a clear job, and have a coordinating service use them.",
      example: `// BAD: one class does validation, persistence and notification
public class UserService {
    public void register(String email, String password) {
        if (!email.contains("@")) throw new IllegalArgumentException("Bad email");
        // raw JDBC code to insert the user ...
        // SMTP code to send a welcome email ...
    }
}

// GOOD: each class has one reason to change
public class UserValidator {
    public void validate(String email) {
        if (!email.contains("@")) throw new IllegalArgumentException("Bad email");
    }
}

public interface UserRepository {
    void save(User user);
}

public interface EmailService {
    void sendWelcome(String email);
}

public class UserService {
    private final UserValidator validator;
    private final UserRepository repository;
    private final EmailService emailService;

    public UserService(UserValidator validator, UserRepository repository, EmailService emailService) {
        this.validator = validator;
        this.repository = repository;
        this.emailService = emailService;
    }

    public void register(String email, String password) {
        validator.validate(email);
        repository.save(new User(email, password));
        emailService.sendWelcome(email);
    }
}`,
      interviewPoints: [
        'One class, one reason to change',
        'Split by responsibility: validation, persistence, notification',
        'Smaller classes are easier to test and reuse',
        'Spring layers (controller, service, repository) reflect SRP',
      ],
    },
    {
      id: 'open-closed',
      title: 'O — Open/Closed Principle (OCP)',
      explanation: "Software entities should be open for extension but closed for modification. You should be able to add new behaviour by adding new code (a new class), not by editing existing, tested code.\n\nA common sign of violation is a growing `if/else` or `switch` on a type. The fix is usually an interface (a strategy) with one implementation per case.",
      example: `// BAD: every new payment type means editing this method
public class PaymentProcessor {
    public void pay(String type, double amount) {
        if (type.equals("CARD")) {
            System.out.println("Paying by card " + amount);
        } else if (type.equals("UPI")) {
            System.out.println("Paying by UPI " + amount);
        }
        // add "WALLET" here? must modify and retest this class
    }
}

// GOOD: extend by adding a class, no edits to existing code
public interface PaymentMethod {
    String type();
    void pay(double amount);
}

public class CardPayment implements PaymentMethod {
    public String type() { return "CARD"; }
    public void pay(double amount) { System.out.println("Card " + amount); }
}

public class UpiPayment implements PaymentMethod {
    public String type() { return "UPI"; }
    public void pay(double amount) { System.out.println("UPI " + amount); }
}

public class PaymentProcessor {
    private final Map<String, PaymentMethod> methods;

    public PaymentProcessor(List<PaymentMethod> methods) {
        this.methods = methods.stream()
                .collect(Collectors.toMap(PaymentMethod::type, m -> m));
    }

    public void pay(String type, double amount) {
        PaymentMethod method = methods.get(type);
        if (method == null) throw new IllegalArgumentException("Unsupported: " + type);
        method.pay(amount);
    }
}
// New WalletPayment class? Just add it. In Spring, annotate it with @Component
// and it is injected into the List automatically.`,
      interviewPoints: [
        'Open for extension, closed for modification',
        'Replace type switches with polymorphism (Strategy pattern)',
        'Spring can inject all implementations as a List or Map',
      ],
    },
    {
      id: 'liskov-substitution',
      title: 'L — Liskov Substitution Principle (LSP)',
      explanation: "Objects of a subclass must be usable anywhere the parent type is expected, without breaking the program's correctness. A subclass must keep the parent's promises: it should not throw unexpected exceptions, weaken guarantees, or require stronger inputs.\n\nThe classic violation is `Square extends Rectangle`: setting the width of a square also changes its height, which surprises code written for rectangles. Another is a subclass that throws `UnsupportedOperationException` for an inherited method. The fix is usually a better hierarchy, not inheritance for code reuse.",
      example: `// BAD: Penguin breaks the promise that every Bird can fly
public class Bird {
    public void fly() { System.out.println("Flying"); }
}

public class Penguin extends Bird {
    @Override
    public void fly() { throw new UnsupportedOperationException("Penguins cannot fly"); }
}

void migrate(List<Bird> birds) {
    birds.forEach(Bird::fly);   // crashes when a Penguin is in the list
}

// GOOD: model only what each type can really do
public abstract class Bird {
    public abstract void eat();
}

public interface Flyable {
    void fly();
}

public class Sparrow extends Bird implements Flyable {
    public void eat() { System.out.println("Seeds"); }
    public void fly() { System.out.println("Flying"); }
}

public class Penguin extends Bird {
    public void eat() { System.out.println("Fish"); }
}

void migrate(List<Flyable> flyers) {
    flyers.forEach(Flyable::fly);   // only things that can fly
}`,
      interviewPoints: [
        'A subtype must be substitutable for its base type',
        'Do not throw UnsupportedOperationException or change expected behaviour in overrides',
        'Classic examples: Square/Rectangle, Penguin/Bird',
        'Prefer composition or better abstractions over forced inheritance',
      ],
    },
    {
      id: 'interface-segregation',
      title: 'I — Interface Segregation Principle (ISP)',
      explanation: "Clients should not be forced to depend on methods they do not use. Instead of one large \"fat\" interface, create several small, focused interfaces. A class can implement as many as it needs.\n\nFat interfaces lead to empty or throwing method implementations and unnecessary recompilation when unrelated methods change.",
      example: `// BAD: a fat interface
public interface Worker {
    void work();
    void eat();
    void attendMeeting();
}

public class Robot implements Worker {
    public void work() { System.out.println("Assembling"); }
    public void eat() { throw new UnsupportedOperationException(); }   // forced
    public void attendMeeting() { }                                    // forced, empty
}

// GOOD: small, role-based interfaces
public interface Workable { void work(); }
public interface Eatable { void eat(); }
public interface MeetingAttendee { void attendMeeting(); }

public class Human implements Workable, Eatable, MeetingAttendee {
    public void work() { System.out.println("Coding"); }
    public void eat() { System.out.println("Lunch"); }
    public void attendMeeting() { System.out.println("Standup"); }
}

public class Robot implements Workable {
    public void work() { System.out.println("Assembling"); }
}`,
      interviewPoints: [
        'Many small interfaces are better than one fat interface',
        'No class should implement methods it does not need',
        'JDK examples: Runnable, Comparable, AutoCloseable',
        'Spring Data: CrudRepository, PagingAndSortingRepository, JpaRepository layers',
      ],
    },
    {
      id: 'dependency-inversion',
      title: 'D — Dependency Inversion Principle (DIP)',
      explanation: "High-level modules (business logic) should not depend on low-level modules (database, email, HTTP clients). Both should depend on abstractions (interfaces). Also, abstractions should not depend on details; details should depend on abstractions.\n\nIn practice: a service asks for an interface in its constructor instead of creating a concrete class with `new`. This makes it easy to swap implementations and to pass a mock in unit tests. Dependency Injection (DI) is the technique that supplies those implementations, and Spring's IoC container does it for you.",
      example: `// BAD: high-level class creates and depends on a concrete low-level class
public class OrderService {
    private final MySqlOrderRepository repository = new MySqlOrderRepository();

    public void place(Order order) {
        repository.insert(order);   // tied to MySQL, hard to test
    }
}

// GOOD: depend on an abstraction, receive it from outside
public interface OrderRepository {
    void save(Order order);
}

public class JpaOrderRepository implements OrderRepository {
    public void save(Order order) { /* JPA code */ }
}

public class OrderService {
    private final OrderRepository repository;

    public OrderService(OrderRepository repository) {   // injected
        this.repository = repository;
    }

    public void place(Order order) {
        repository.save(order);
    }
}

// In a unit test, pass a fake or a Mockito mock:
OrderService service = new OrderService(order -> System.out.println("saved"));`,
      interviewPoints: [
        'Depend on abstractions, not concretions',
        'DIP is the principle; Dependency Injection is a technique to achieve it',
        'Constructor injection makes dependencies explicit and testable',
        'Spring IoC container wires the implementations',
      ],
    },
    {
      id: 'spring-and-solid',
      title: 'How Spring Supports SOLID',
      explanation: "Spring makes SOLID practical. Dependency injection with constructor injection gives you DIP out of the box. The layered structure of `@RestController`, `@Service` and `@Repository` encourages SRP. Injecting `List<Interface>` or `Map<String, Interface>` of all implementations enables OCP-style strategies without switches. `@Qualifier`, `@Primary` and `@Profile` let you substitute implementations (relying on LSP). Spring Data's layered repository interfaces reflect ISP.\n\nAOP (`@Transactional`, `@Cacheable`) also supports SRP by moving cross-cutting concerns like transactions and caching out of business methods.",
      example: `public interface NotificationSender {
    String channel();
    void send(String to, String message);
}

@Component
public class EmailSender implements NotificationSender {
    public String channel() { return "EMAIL"; }
    public void send(String to, String message) { /* SMTP */ }
}

@Component
public class SmsSender implements NotificationSender {
    public String channel() { return "SMS"; }
    public void send(String to, String message) { /* SMS gateway */ }
}

@Service
public class NotificationService {                 // SRP: only routes notifications
    private final Map<String, NotificationSender> senders;

    public NotificationService(List<NotificationSender> all) {  // DIP: depends on interface
        this.senders = all.stream()
                .collect(Collectors.toMap(NotificationSender::channel, s -> s));
    }

    public void notify(String channel, String to, String msg) {
        senders.get(channel).send(to, msg);        // OCP: add PushSender without edits
    }
}

// LSP: a safe substitute used only in tests (mark the real EmailSender @Profile("!test"))
@Profile("test")
@Component
public class FakeEmailSender implements NotificationSender {
    public String channel() { return "EMAIL"; }
    public void send(String to, String message) { System.out.println("fake email to " + to); }
}`,
      interviewPoints: [
        'DI container = Dependency Inversion in practice',
        'Controller/Service/Repository layers = SRP',
        'Injecting List/Map of implementations = OCP',
        'AOP keeps cross-cutting concerns out of business code',
      ],
    },
  ],
  commonMistakes: [
    "Creating dependencies with `new` inside services instead of injecting interfaces, making classes hard to test.",
    "Building \"God classes\" like a huge `UserManager` that validates, saves, emails and generates reports.",
    "Using inheritance only to reuse code, then overriding methods to throw `UnsupportedOperationException`, which violates Liskov.",
    "Adding yet another `else if` for each new type instead of introducing a strategy interface.",
    "Over-applying SOLID by creating interfaces for every class even when only one implementation will ever exist and it adds no value.",
  ],
  interviewTips: [
    "For each principle, have a one-line definition, a bad example and the fix ready; interviewers usually ask for an example.",
    "Tie Dependency Inversion to Spring constructor injection and to unit testing with mocks.",
    "Use real project examples: payment methods or notification channels for Open/Closed, service/repository layers for SRP.",
    "Explain that DIP (principle), IoC (control flipped to a container) and DI (technique) are related but different terms.",
  ],
  interviewQuestions: [
    {
      id: 'java-solid-q1',
      question: 'What are the SOLID principles?',
      answer: "SOLID is five object-oriented design principles. Single Responsibility: a class should have one reason to change. Open/Closed: open for extension, closed for modification. Liskov Substitution: subtypes must be usable in place of their base types. Interface Segregation: prefer small, specific interfaces over large ones. Dependency Inversion: depend on abstractions, not concrete implementations. Together they make code easier to maintain, extend and test.",
      points: ['S: one reason to change', 'O: extend without modifying', 'L: substitutable subtypes', 'I: small interfaces', 'D: depend on abstractions'],
      difficulty: 'Beginner',
    },
    {
      id: 'java-solid-q2',
      question: 'Explain the Single Responsibility Principle with an example.',
      answer: "A class should have only one reason to change. For example, an `InvoiceService` that calculates totals, saves to the database and prints PDFs changes whenever tax rules, database schema or PDF layout change. Split it into `InvoiceCalculator`, `InvoiceRepository` and `InvoicePrinter`, and let the service coordinate them. Each piece is then smaller, easier to test and changes independently.",
      example: `class InvoiceCalculator { BigDecimal total(Invoice i) { /* ... */ return BigDecimal.ZERO; } }
interface InvoiceRepository { void save(Invoice i); }
class InvoicePrinter { byte[] toPdf(Invoice i) { /* ... */ return new byte[0]; } }`,
      points: ['One reason to change', 'Split mixed concerns into classes', 'Improves testability and readability'],
      difficulty: 'Beginner',
    },
    {
      id: 'java-solid-q3',
      question: 'What is the Open/Closed Principle and how do you apply it?',
      answer: "Classes should be open for extension but closed for modification: you add new behaviour by writing new code rather than editing existing, tested code. Typically you replace a `switch` or `if/else` chain on a type with an interface and one implementation per variant (the Strategy pattern). Adding a new variant means adding a class; the existing code that uses the interface is unchanged.",
      example: `interface DiscountPolicy { double apply(double amount); }
class FestivalDiscount implements DiscountPolicy { public double apply(double a) { return a * 0.8; } }
class NoDiscount implements DiscountPolicy { public double apply(double a) { return a; } }

class Checkout {
    private final DiscountPolicy policy;
    Checkout(DiscountPolicy policy) { this.policy = policy; }
    double total(double amount) { return policy.apply(amount); }
}`,
      points: ['Extend via new classes', 'Use interfaces/polymorphism', 'Avoid growing type switches'],
      difficulty: 'Beginner',
    },
    {
      id: 'java-solid-q4',
      question: 'Explain the Liskov Substitution Principle. Why is Square extends Rectangle a violation?',
      answer: "LSP says that code using a base type must work correctly with any subtype, without knowing which one it has. A `Rectangle` lets width and height change independently. If `Square` extends it and keeps both sides equal, then code like `r.setWidth(5); r.setHeight(4); assert r.area() == 20;` fails for a square (area becomes 16). The subclass broke the parent's behavioural contract. A better design is a common `Shape` interface with separate, immutable `Rectangle` and `Square` classes.",
      example: `interface Shape { double area(); }
record Rectangle(double w, double h) implements Shape { public double area() { return w * h; } }
record Square(double side) implements Shape { public double area() { return side * side; } }`,
      points: ['Subtypes must honour the base contract', 'Square/Rectangle breaks independent width/height', 'Fix with a shared abstraction or immutability', 'Inheritance should model behaviour, not just "is-a" in real life'],
      difficulty: 'Intermediate',
    },
    {
      id: 'java-solid-q5',
      question: 'What is the Interface Segregation Principle?',
      answer: "Clients should not be forced to depend on methods they do not use. Instead of one large interface, define small role-based interfaces and let classes implement only the ones they need. A `Printer` interface with `print`, `scan` and `fax` forces a simple printer to implement fax with an exception; splitting into `Printable`, `Scannable` and `Faxable` fixes it. Spring Data follows this with `Repository`, `CrudRepository`, `PagingAndSortingRepository` and `JpaRepository`.",
      example: `interface Printable { void print(Document d); }
interface Scannable { Document scan(); }

class BasicPrinter implements Printable {
    public void print(Document d) { /* ... */ }
}`,
      points: ['Small, focused interfaces', 'No dummy or throwing implementations', 'Classes can implement several interfaces'],
      difficulty: 'Intermediate',
    },
    {
      id: 'java-solid-q6',
      question: 'What is the Dependency Inversion Principle, and how is it different from Dependency Injection?',
      answer: "Dependency Inversion is a design principle: high-level modules should depend on abstractions, not on low-level details, and details should implement those abstractions. Dependency Injection is a technique for achieving it: instead of a class creating its dependencies with `new`, they are passed in from outside, usually via the constructor. Inversion of Control is the broader idea that a framework (like the Spring container) controls object creation and wiring. So DIP is the goal, DI is the mechanism, and Spring's IoC container provides it.",
      example: `@Service
public class ReportService {
    private final ReportRepository repo;   // interface
    public ReportService(ReportRepository repo) { this.repo = repo; }  // injected
}`,
      points: ['DIP: depend on abstractions', 'DI: dependencies supplied from outside', 'IoC: framework controls creation', 'Enables mocking in tests'],
      difficulty: 'Intermediate',
    },
    {
      id: 'java-solid-q7',
      question: 'How does Spring help you follow SOLID principles?',
      answer: "The IoC container and constructor injection implement Dependency Inversion: beans depend on interfaces and Spring supplies implementations. The standard controller, service and repository layers encourage Single Responsibility, and AOP moves transactions, caching and security out of business code. Injecting a `List` or `Map` of all beans implementing an interface lets you add new strategies without modifying existing code (Open/Closed). `@Primary`, `@Qualifier` and `@Profile` let you substitute implementations safely, which relies on Liskov. Spring Data's small repository interfaces illustrate Interface Segregation.",
      points: ['DI container supports DIP', 'Layered architecture supports SRP', 'Collection injection supports OCP', 'Profiles/qualifiers rely on LSP', 'AOP separates cross-cutting concerns'],
      difficulty: 'Advanced',
    },
    {
      id: 'java-solid-q8',
      question: 'Can following SOLID too strictly be harmful? How do you balance it?',
      answer: "Yes. Over-applying SOLID leads to over-engineering: an interface for every class, dozens of tiny classes, deep abstraction layers and indirection that make simple code hard to follow. Balance it with YAGNI (You Aren't Gonna Need It) and KISS: introduce an abstraction when you have a real second implementation, a testing need, or a clear expected change. Refactor toward SOLID when duplication or painful changes appear, rather than designing everything up front. SOLID is a set of heuristics for managing change, not a checklist.",
      points: ['Over-engineering risk', 'Apply when there is real variation or testing need', 'Balance with YAGNI and KISS', 'Refactor toward SOLID as the code evolves'],
      difficulty: 'Advanced',
    },
    {
      id: 'java-solid-q9',
      question: 'Which SOLID principles does this code violate, and how would you fix it?',
      answer: "Imagine a `ReportGenerator` that creates `new MySqlConnection()`, runs SQL, formats data as PDF or CSV using a `switch` on a format string, and emails the result. It violates SRP (data access, formatting and emailing in one class), OCP (adding Excel means editing the switch) and DIP (hard-coded MySQL and email classes). Fix: extract a `ReportRepository` interface, a `ReportFormatter` interface with `PdfFormatter` and `CsvFormatter` implementations, and a `ReportSender` interface; inject them through the constructor so `ReportGenerator` only coordinates.",
      example: `public class ReportGenerator {
    private final ReportRepository repository;
    private final Map<String, ReportFormatter> formatters;
    private final ReportSender sender;

    public ReportGenerator(ReportRepository repository,
                           Map<String, ReportFormatter> formatters,
                           ReportSender sender) {
        this.repository = repository;
        this.formatters = formatters;
        this.sender = sender;
    }

    public void generate(String format, String to) {
        List<Row> rows = repository.fetch();
        byte[] file = formatters.get(format).format(rows);
        sender.send(to, file);
    }
}`,
      points: ['Identify mixed responsibilities (SRP)', 'Type switch signals OCP violation', 'new on concrete infrastructure signals DIP violation', 'Fix with interfaces and constructor injection'],
      difficulty: 'Advanced',
    },
  ],
}

export default topic
