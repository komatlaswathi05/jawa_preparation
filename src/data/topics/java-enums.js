const topic = {
  id: 'java-enums',
  category: 'java',
  title: 'Enums',
  description: "Model a fixed set of constants in a type-safe way, with fields, methods, switch support, EnumMap/EnumSet and the enum singleton.",
  difficulty: 'Beginner',
  overview: "An enum (short for enumeration) is a special type whose values are a fixed, known list of constants, such as the days of the week, order statuses or user roles. Instead of passing around magic strings like \"PENDING\" or numbers like 2, you use `OrderStatus.PENDING`, and the compiler guarantees that only valid values are used.\n\nThink of an enum like the buttons on a lift: there is a fixed set of floors, and you cannot press a floor that does not exist. In Java, every enum is really a class that extends `java.lang.Enum`, and each constant is a single, pre-created object of that class. That means enums can have fields, constructors, methods and can even implement interfaces.\n\nEnums appear constantly in backend code: order and payment statuses, roles in Spring Security, `HttpStatus` in Spring, and entity columns mapped with `@Enumerated` in JPA. Interviewers ask about them because they test your understanding of type safety, `switch`, and patterns like the enum singleton.",
  subtopics: [
    {
      id: 'enum-basics',
      title: 'Enum Basics',
      explanation: "Declare an enum with the `enum` keyword and a comma-separated list of constants, written in UPPER_CASE by convention. Each constant is a `public static final` instance of the enum type, created once when the enum class is loaded.\n\nEnums are type safe: a method that takes an `OrderStatus` cannot receive a random string or number. You can compare enum values safely with `==` because each constant exists only once.",
      example: `public enum OrderStatus {
    PENDING, PAID, SHIPPED, DELIVERED, CANCELLED
}

public class Order {
    private OrderStatus status = OrderStatus.PENDING;

    public void ship() {
        if (status == OrderStatus.PAID) {   // == is safe for enums
            status = OrderStatus.SHIPPED;
        }
    }
}`,
      interviewPoints: [
        'Every enum implicitly extends java.lang.Enum, so it cannot extend another class',
        'Constants are public static final singletons',
        'Compare with == (null-safe and fast)',
        'Enums are type safe compared to int or String constants',
      ],
    },
    {
      id: 'fields-constructors-methods',
      title: 'Fields, Constructors and Methods in Enums',
      explanation: "Enums can hold data. Add fields and a constructor, then pass values in brackets after each constant. The constructor is always private (you can write `private` or leave it off; it cannot be public), because only the constants listed in the enum may exist.\n\nThe constant list must come first, followed by a semicolon, then fields and methods.",
      example: `public enum Planet {
    MERCURY(3.303e+23, 2.4397e6),
    EARTH(5.976e+24, 6.37814e6);        // semicolon ends the constant list

    private final double mass;          // kilograms
    private final double radius;        // metres

    Planet(double mass, double radius) { // implicitly private
        this.mass = mass;
        this.radius = radius;
    }

    public double surfaceGravity() {
        final double G = 6.67300E-11;
        return G * mass / (radius * radius);
    }
}

public enum HttpCode {
    OK(200, "OK"), NOT_FOUND(404, "Not Found");

    private final int code;
    private final String reason;

    HttpCode(int code, String reason) { this.code = code; this.reason = reason; }

    public int getCode() { return code; }
    public String getReason() { return reason; }
}

System.out.println(HttpCode.NOT_FOUND.getCode());  // 404`,
      interviewPoints: [
        'Enum constructors are always private',
        'You cannot call new on an enum',
        'Constants must be declared first, ending with a semicolon if more code follows',
        'Make enum fields final to keep them immutable',
      ],
    },
    {
      id: 'built-in-methods',
      title: 'values(), valueOf(), ordinal() and name()',
      explanation: "The compiler adds helpful methods to every enum. `values()` returns an array of all constants in declaration order. `valueOf(\"PAID\")` converts a string to the constant and throws `IllegalArgumentException` if no constant matches (the match is case-sensitive). `name()` returns the exact constant name, and `ordinal()` returns its zero-based position.\n\nAvoid storing or depending on `ordinal()`: if someone reorders or inserts a constant, every ordinal changes. Store `name()` or a dedicated field instead.",
      example: `enum Size { SMALL, MEDIUM, LARGE }

for (Size s : Size.values()) {
    System.out.println(s.name() + " -> " + s.ordinal());
}
// SMALL -> 0, MEDIUM -> 1, LARGE -> 2

Size m = Size.valueOf("MEDIUM");     // Size.MEDIUM
// Size.valueOf("medium");           // IllegalArgumentException

// Safe lookup helper
static Optional<Size> parse(String text) {
    return Arrays.stream(Size.values())
            .filter(s -> s.name().equalsIgnoreCase(text))
            .findFirst();
}

// Enums implement Comparable using ordinal order
System.out.println(Size.SMALL.compareTo(Size.LARGE));  // negative`,
      interviewPoints: [
        'values() and valueOf() are generated by the compiler',
        'valueOf is case-sensitive and throws IllegalArgumentException',
        'Do not persist ordinal(); use name() or a code field',
        'Enums implement Comparable and Serializable automatically',
      ],
    },
    {
      id: 'switch-on-enums',
      title: 'Switch on Enums',
      explanation: "Enums work naturally with `switch`. Inside the case labels you write only the constant name (`case PAID`, not `case OrderStatus.PAID` in older Java).\n\nThe modern switch expression (Java 14+) uses arrows, returns a value and has no fall-through. When you switch over an enum as an expression and cover every constant, no `default` is needed, and the compiler will complain if a new constant is added and not handled.",
      example: `enum Status { PENDING, PAID, SHIPPED, CANCELLED }

// Classic switch statement
switch (status) {
    case PENDING:
        System.out.println("Waiting for payment");
        break;
    case PAID:
        System.out.println("Ready to ship");
        break;
    default:
        System.out.println("Other");
}

// Switch expression (Java 14+): exhaustive, no default needed
String label = switch (status) {
    case PENDING -> "Waiting for payment";
    case PAID -> "Ready to ship";
    case SHIPPED -> "On the way";
    case CANCELLED -> "Cancelled";
};`,
      interviewPoints: [
        'Case labels use the bare constant name',
        'Switch expressions over enums must be exhaustive',
        'Arrow syntax has no fall-through, so no break needed',
      ],
    },
    {
      id: 'enums-implementing-interfaces',
      title: 'Enums Implementing Interfaces',
      explanation: "An enum cannot extend a class (it already extends `Enum`), but it can implement any number of interfaces. This is useful when enum constants should be usable wherever an interface is expected, for example a set of operations or a pluggable strategy.",
      example: `public interface Operation {
    int apply(int a, int b);
}

public enum BasicOperation implements Operation {
    ADD {
        public int apply(int a, int b) { return a + b; }
    },
    MULTIPLY {
        public int apply(int a, int b) { return a * b; }
    };
}

// Or with a lambda passed through the constructor
public enum MathOp implements IntBinaryOperator {
    PLUS((a, b) -> a + b),
    MINUS((a, b) -> a - b);

    private final IntBinaryOperator op;

    MathOp(IntBinaryOperator op) { this.op = op; }

    @Override
    public int applyAsInt(int a, int b) { return op.applyAsInt(a, b); }
}

Operation op = BasicOperation.ADD;
System.out.println(op.apply(2, 3));      // 5`,
      interviewPoints: [
        'Enums can implement interfaces but cannot extend classes',
        'Useful for strategy-like behaviour with a fixed set of options',
      ],
    },
    {
      id: 'constant-specific-methods',
      title: 'Abstract Methods per Constant',
      explanation: "An enum can declare an abstract method, and then every constant must provide its own body. This is called constant-specific behaviour. It replaces long `switch` statements: each constant carries its own logic, and adding a new constant forces you to implement the method.",
      example: `public enum DeliveryType {
    STANDARD {
        @Override
        public double cost(double weightKg) { return 40 + weightKg * 5; }
    },
    EXPRESS {
        @Override
        public double cost(double weightKg) { return 100 + weightKg * 10; }
    },
    PICKUP {
        @Override
        public double cost(double weightKg) { return 0; }
    };

    public abstract double cost(double weightKg);
}

double price = DeliveryType.EXPRESS.cost(2.0);   // 120.0`,
      interviewPoints: [
        'Each constant can override methods with its own class body',
        'An abstract method forces every constant to implement it',
        'A clean alternative to switch statements on the enum',
      ],
    },
    {
      id: 'enummap-enumset',
      title: 'EnumMap and EnumSet',
      explanation: "`EnumSet` and `EnumMap` are collections designed for enum keys. Internally they use the ordinal as an index: `EnumSet` is backed by a bit vector and `EnumMap` by an array. They are much faster and use less memory than `HashSet` or `HashMap` with enum keys, and they iterate in declaration order.\n\nNeither allows `null` keys, and both are not thread safe.",
      example: `enum Day { MON, TUE, WED, THU, FRI, SAT, SUN }

EnumSet<Day> weekend = EnumSet.of(Day.SAT, Day.SUN);
EnumSet<Day> weekdays = EnumSet.complementOf(weekend);
EnumSet<Day> midWeek = EnumSet.range(Day.TUE, Day.THU);
EnumSet<Day> all = EnumSet.allOf(Day.class);
EnumSet<Day> none = EnumSet.noneOf(Day.class);

EnumMap<Day, List<String>> schedule = new EnumMap<>(Day.class);
schedule.put(Day.MON, List.of("Standup", "Code review"));
schedule.put(Day.FRI, List.of("Demo"));

// Iterates in declaration order: MON, then FRI
schedule.forEach((day, tasks) -> System.out.println(day + " " + tasks));`,
      interviewPoints: [
        'EnumSet uses a bit vector; EnumMap uses an array indexed by ordinal',
        'Faster and more compact than HashSet/HashMap for enum keys',
        'Keep declaration order when iterating',
        'Null keys are not allowed',
      ],
    },
    {
      id: 'enum-singleton',
      title: 'Enum Singleton',
      explanation: "An enum with a single constant is the simplest and safest way to write a singleton (a class with exactly one instance). The JVM guarantees each enum constant is created once, in a thread-safe way, when the enum class is loaded.\n\nIt is also safe against the two classic ways of breaking a singleton: reflection (you cannot create enum instances reflectively) and serialization (deserializing an enum returns the existing constant). Effective Java calls it the best way to implement a singleton. Its limitation is that it cannot extend another class and is created eagerly.",
      example: `public enum AppConfig {
    INSTANCE;

    private final Map<String, String> settings = new ConcurrentHashMap<>();

    public String get(String key) { return settings.get(key); }
    public void set(String key, String value) { settings.put(key, value); }
}

AppConfig.INSTANCE.set("env", "prod");
String env = AppConfig.INSTANCE.get("env");`,
      interviewPoints: [
        'Thread safe by JVM class-loading guarantees',
        'Safe from reflection attacks and serialization duplicates',
        'Cannot extend a class; instance is created eagerly',
      ],
    },
    {
      id: 'enums-in-spring-jpa',
      title: 'Enums in Spring and JPA',
      explanation: "In JPA, map an enum column with `@Enumerated(EnumType.STRING)` so the database stores the name, like \"PAID\". The default `EnumType.ORDINAL` stores the position number, which silently corrupts data if the enum is reordered.\n\nSpring automatically converts request parameters and JSON strings into enum values, and Jackson serializes enums by name by default.",
      example: `@Entity
public class Order {
    @Id
    @GeneratedValue
    private Long id;

    @Enumerated(EnumType.STRING)     // stores "PAID", not 1
    private OrderStatus status;
}

@GetMapping("/orders")
public List<Order> byStatus(@RequestParam OrderStatus status) {
    // GET /orders?status=PAID is converted automatically
    return orderService.findByStatus(status);
}`,
      interviewPoints: [
        'Always use EnumType.STRING in JPA',
        'Spring converts strings to enums for request params and JSON',
      ],
    },
  ],
  commonMistakes: [
    "Persisting enums by `ordinal()` (JPA's default `EnumType.ORDINAL`), so reordering constants corrupts existing data.",
    "Calling `valueOf()` on user input without handling `IllegalArgumentException` for unknown or wrongly cased values.",
    "Using `String` or `int` constants for a fixed set of values instead of an enum, losing type safety.",
    "Forgetting the semicolon after the last constant when the enum also has fields or methods.",
    "Using `HashMap` or `HashSet` with enum keys where `EnumMap` or `EnumSet` would be faster and clearer.",
  ],
  interviewTips: [
    "Start by saying an enum is a class that extends `java.lang.Enum` with a fixed set of singleton instances; the rest follows from that.",
    "When asked about singletons, mention the enum singleton and why it survives reflection and serialization.",
    "Mention `@Enumerated(EnumType.STRING)` when talking about enums in a Spring Boot project; it shows practical experience.",
    "Show constant-specific methods as a cleaner alternative to large switch statements.",
  ],
  interviewQuestions: [
    {
      id: 'java-enums-q1',
      question: 'What is an enum in Java and why use it instead of constants?',
      answer: "An enum is a special type that has a fixed set of named instances, such as `PENDING`, `PAID` and `SHIPPED`. Compared to `int` or `String` constants, enums are type safe (a method taking `OrderStatus` cannot receive a random value), readable, easy to iterate with `values()`, work in `switch`, and can carry fields and behaviour.",
      example: `enum Role { ADMIN, USER, GUEST }

void grant(Role role) { /* only valid roles can be passed */ }`,
      points: ['Fixed set of constants', 'Compile-time type safety', 'Can have fields, methods and constructors', 'Works with switch'],
      difficulty: 'Beginner',
    },
    {
      id: 'java-enums-q2',
      question: 'What do values(), valueOf() and ordinal() do?',
      answer: "`values()` returns an array of all constants in declaration order. `valueOf(String)` returns the constant with exactly that name, throwing `IllegalArgumentException` if none matches. `ordinal()` returns the zero-based position of the constant. `values()` and `valueOf()` are generated by the compiler; `ordinal()` and `name()` come from `java.lang.Enum`.",
      example: `enum Size { S, M, L }
Size.values();        // [S, M, L]
Size.valueOf("M");    // M
Size.L.ordinal();     // 2`,
      points: ['values() lists all constants', 'valueOf is case-sensitive and can throw', 'ordinal is position-based and fragile'],
      difficulty: 'Beginner',
    },
    {
      id: 'java-enums-q3',
      question: 'Can an enum have a constructor? Can it be public?',
      answer: "Yes, enums can have constructors, fields and methods. The constructor is always private (explicitly or implicitly) and cannot be public or protected, because the only instances allowed are the constants declared in the enum. You cannot call `new` on an enum; the JVM creates each constant once when the enum class loads.",
      example: `enum Currency {
    INR("₹"), USD("$");
    private final String symbol;
    Currency(String symbol) { this.symbol = symbol; }
    String symbol() { return symbol; }
}`,
      points: ['Constructors are implicitly private', 'Cannot instantiate with new', 'Each constant is created once'],
      difficulty: 'Beginner',
    },
    {
      id: 'java-enums-q4',
      question: 'Can an enum extend a class or implement an interface?',
      answer: "An enum cannot extend any class because it already implicitly extends `java.lang.Enum` and Java has single class inheritance. It can implement any number of interfaces, and each constant can even implement the interface methods differently using constant-specific bodies.",
      example: `interface Discount { double apply(double price); }

enum Coupon implements Discount {
    NONE { public double apply(double p) { return p; } },
    HALF { public double apply(double p) { return p / 2; } };
}`,
      points: ['Implicitly extends java.lang.Enum', 'Can implement interfaces', 'Other classes can never extend an enum'],
      difficulty: 'Intermediate',
    },
    {
      id: 'java-enums-q5',
      question: 'What are EnumMap and EnumSet and when would you use them?',
      answer: "`EnumSet` is a `Set` for enum values backed by a bit vector, and `EnumMap` is a `Map` with enum keys backed by an array indexed by ordinal. They are faster and use less memory than `HashSet`/`HashMap` with enum keys, and iterate in declaration order. Use them whenever your keys or set members are enum constants, such as permissions per role or a schedule per day.",
      example: `EnumSet<Day> weekend = EnumSet.of(Day.SAT, Day.SUN);
EnumMap<Day, Integer> hours = new EnumMap<>(Day.class);
hours.put(Day.MON, 8);`,
      points: ['Bit vector / array internally', 'Declaration-order iteration', 'No null keys', 'Not synchronized'],
      difficulty: 'Intermediate',
    },
    {
      id: 'java-enums-q6',
      question: 'How do you store an enum in a database with JPA, and why does it matter?',
      answer: "Use `@Enumerated(EnumType.STRING)` so the column stores the constant name. The default is `EnumType.ORDINAL`, which stores the position number; if someone later inserts or reorders constants, existing rows will point to the wrong values without any error. An alternative for custom codes is a JPA `AttributeConverter`.",
      example: `@Enumerated(EnumType.STRING)
@Column(nullable = false)
private OrderStatus status;`,
      points: ['Default ORDINAL is fragile', 'STRING is safe against reordering', 'AttributeConverter for custom codes'],
      difficulty: 'Intermediate',
    },
    {
      id: 'java-enums-q7',
      question: 'Why is an enum considered the best way to implement a singleton?',
      answer: "An enum with a single constant is created exactly once by the JVM in a thread-safe manner during class initialization, with no synchronization code needed. It is also immune to the two common ways of breaking singletons: reflection cannot create enum instances (`Constructor.newInstance` throws `IllegalArgumentException` for enums), and deserialization returns the existing constant instead of a new object. Its trade-offs are eager creation and inability to extend another class.",
      example: `public enum IdGenerator {
    INSTANCE;
    private final AtomicLong counter = new AtomicLong();
    public long next() { return counter.incrementAndGet(); }
}`,
      points: ['Thread safe via class loading', 'Reflection-proof', 'Serialization-safe', 'Cannot extend classes; eager'],
      difficulty: 'Advanced',
    },
    {
      id: 'java-enums-q8',
      question: 'What are constant-specific method implementations in enums?',
      answer: "An enum can declare an abstract method (or a regular method), and each constant can provide its own body in curly braces after its name. Internally, each such constant becomes an anonymous subclass of the enum. This removes `switch` statements from business logic and forces every new constant to implement the behaviour, so you cannot forget a case.",
      example: `enum Tax {
    GST { double on(double amt) { return amt * 0.18; } },
    EXEMPT { double on(double amt) { return 0; } };

    abstract double on(double amt);
}`,
      points: ['Each constant supplies its own implementation', 'Constants with bodies are anonymous subclasses', 'Compiler forces implementing abstract methods', 'Replaces switch-based logic'],
      difficulty: 'Advanced',
    },
  ],
}

export default topic
