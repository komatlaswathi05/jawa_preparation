const topic = {
  id: 'java-modern',
  category: 'java',
  title: 'Modern Java (9–21 and beyond)',
  description: "The features added after Java 8 that interviewers ask about: var, sealed classes, pattern matching, record patterns, sequenced collections, new API methods, HttpClient and virtual threads.",
  difficulty: 'Intermediate',
  overview: "Java 8 (2014) introduced lambdas and streams. Since Java 9 (2017) a new version ships every six months, and every two years one becomes a Long-Term Support (LTS) release: 11, 17, 21 and 25. Most companies run on an LTS version, and Spring Boot 3 requires at least Java 17, so interviewers increasingly expect you to know what changed after Java 8.\n\nThe changes follow one theme: less boilerplate and safer data modelling. `var` removes repeated type names. Records (covered in the Java 8+ topic) give you data classes in one line. Sealed classes let you say exactly which subclasses exist, and pattern matching lets the compiler check that you handled all of them. Virtual threads make simple blocking code scale to huge numbers of concurrent tasks.\n\nThink of it as Java learning from its younger languages without breaking old code: every Java 8 program still compiles, but modern Java lets you write the same logic in half the lines, with the compiler catching more mistakes. Examples use a shop domain with `Order`, `Payment` and `Shape` types.",

  subtopics: [
    {
      id: 'release-cadence',
      title: 'Release cadence and LTS versions',
      explanation: "Java releases a new feature version every March and September. Most versions receive updates for only six months, but LTS versions get years of support from vendors such as Oracle, Eclipse Temurin, Amazon Corretto and Azul. The LTS versions are 8, 11, 17, 21 and 25.\n\nNew language features often arrive first as preview features (you must enable them with `--enable-preview`), are refined over one or more releases, and then become final. When answering \"which version introduced X?\", knowing the final version is what matters.",
      example: `// Java 9  (2017): modules, JShell, List.of/Set.of/Map.of, private interface methods
// Java 10 (2018): var
// Java 11 (2018, LTS): HttpClient, String.isBlank/strip/lines/repeat, run single-file programs
// Java 14 (2020): switch expressions, helpful NullPointerExceptions
// Java 15 (2020): text blocks
// Java 16 (2021): records, pattern matching for instanceof, Stream.toList()
// Java 17 (2021, LTS): sealed classes  <- Spring Boot 3 baseline
// Java 21 (2023, LTS): virtual threads, record patterns, pattern matching for switch,
//                      sequenced collections
// Java 25 (2025, LTS): scoped values, compact source files and instance main methods,
//                      flexible constructor bodies`,
      interviewPoints: [
        "Six-month releases; LTS every two years.",
        "LTS: 8, 11, 17, 21, 25.",
        "Spring Boot 3 needs Java 17+.",
        "Features go preview, then final.",
      ],
    },
    {
      id: 'var',
      title: 'Local variable type inference (var)',
      explanation: "Since Java 10 you can declare local variables with `var` and let the compiler infer the type from the initializer. The variable is still statically typed: `var list = new ArrayList<String>()` is an `ArrayList<String>` forever. `var` is not a keyword but a reserved type name, so existing variables named `var` still compile.\n\n`var` works only for local variables with an initializer, in for loops and in try-with-resources, and (Java 11) for lambda parameters so you can add annotations. It cannot be used for fields, method parameters or return types, and not with `null` or an array initializer alone. Use it when the type is obvious from the right-hand side; avoid it when it hides important information.",
      example: `var orders = new ArrayList<Order>();                  // ArrayList<Order>
var byCustomer = new HashMap<Long, List<Order>>();     // no repetition

for (var order : orders) {
    System.out.println(order.id());
}

try (var reader = Files.newBufferedReader(Path.of("orders.csv"))) {
    reader.lines().forEach(System.out::println);
}

BiFunction<Integer, Integer, Integer> add = (@NonNull var a, @NonNull var b) -> a + b;

// var x;                 // ERROR: no initializer
// var y = null;          // ERROR: cannot infer type
// var total = service.calculate();   // compiles, but what type is total?`,
      interviewPoints: [
        "Compile-time inference; still statically typed.",
        "Only for local variables (plus loops, try-with-resources, lambda params).",
        "Not for fields, parameters or return types.",
        "Use when the type is obvious from the right-hand side.",
      ],
    },
    {
      id: 'instanceof-pattern',
      title: 'Pattern matching for instanceof',
      explanation: "Before Java 16, checking a type and using it needed a cast on the next line: `if (obj instanceof String) { String s = (String) obj; ... }`. Pattern matching combines the test and the cast: `if (obj instanceof String s)` declares `s` only when the test succeeds.\n\nThe pattern variable is in scope wherever the compiler knows the match succeeded, including the rest of an `&&` condition and after an early return. It makes `equals()` implementations noticeably shorter.",
      example: `Object value = "hello";

// before
if (value instanceof String) {
    String s = (String) value;
    System.out.println(s.length());
}

// Java 16+
if (value instanceof String s && !s.isBlank()) {
    System.out.println(s.length());
}

// scope after an early return
if (!(value instanceof String s)) {
    return;
}
System.out.println(s.toUpperCase());

// shorter equals()
@Override
public boolean equals(Object o) {
    return o instanceof Money m
        && amount.equals(m.amount)
        && currency.equals(m.currency);
}`,
      interviewPoints: [
        "Combines type test and cast.",
        "Pattern variable is scoped by flow analysis.",
        "Works with && but not with ||.",
        "Final since Java 16.",
      ],
    },
    {
      id: 'sealed-classes',
      title: 'Sealed classes and interfaces',
      explanation: "A sealed class or interface (Java 17) lists exactly which classes may extend or implement it with `permits`. Every permitted subclass must be `final`, `sealed` (with its own permits list) or `non-sealed` (open again). The permitted classes must be in the same module, or the same package if you do not use modules. If they are in the same file, `permits` can be omitted.\n\nSealed types model a closed set of alternatives, such as the payment methods your shop supports. Unlike an enum, each alternative can hold different data. The real benefit comes with pattern matching: the compiler knows all subtypes, so a `switch` over a sealed type needs no `default`, and adding a new subtype produces compile errors wherever it is not handled.",
      example: `public sealed interface Payment permits CardPayment, UpiPayment, CashOnDelivery {
}

public record CardPayment(String cardNumber, YearMonth expiry) implements Payment {}
public record UpiPayment(String upiId) implements Payment {}
public record CashOnDelivery() implements Payment {}

// a class hierarchy
public sealed abstract class Shape permits Circle, Rectangle, Polygon {}
public final class Circle extends Shape { ... }
public final class Rectangle extends Shape { ... }
public non-sealed class Polygon extends Shape { ... }   // anyone may extend Polygon

// class Triangle extends Shape {}   // ERROR: Triangle is not permitted`,
      interviewPoints: [
        "permits lists the allowed subtypes.",
        "Subtypes must be final, sealed or non-sealed.",
        "Closed hierarchy enables exhaustive switch.",
        "Like an enum whose constants carry different data.",
      ],
    },
    {
      id: 'switch-patterns',
      title: 'Pattern matching for switch',
      explanation: "Java 21 lets `switch` match on types, not just constants. Each `case` can be a type pattern (`case CardPayment c ->`), optionally with a guard (`when`). The compiler checks that the switch is exhaustive: for a sealed type, covering every permitted subtype is enough, without a `default`.\n\nOrder matters: a more specific case must come before a more general one, or the compiler reports dominance. Switch can now also handle `null` explicitly with `case null`; without it, a null selector still throws `NullPointerException`. Switch expressions themselves (arrow form, `yield`) are covered in the Java 8+ topic.",
      example: `static String describe(Payment payment) {
    return switch (payment) {
        case CardPayment c when c.expiry().isBefore(YearMonth.now()) -> "Expired card";
        case CardPayment c -> "Card ending " + c.cardNumber().substring(c.cardNumber().length() - 4);
        case UpiPayment u -> "UPI " + u.upiId();
        case CashOnDelivery cod -> "Cash on delivery";
    };   // no default: the sealed interface is fully covered
}

static String format(Object o) {
    return switch (o) {
        case null -> "null";
        case Integer i when i < 0 -> "negative " + i;
        case Integer i -> "int " + i;
        case String s -> "string of length " + s.length();
        default -> "something else";
    };
}`,
      interviewPoints: [
        "Type patterns and when guards in case labels.",
        "Exhaustive for sealed types without default.",
        "Specific cases before general ones (dominance).",
        "case null handles null explicitly.",
      ],
    },
    {
      id: 'record-patterns',
      title: 'Record patterns and deconstruction',
      explanation: "Records (Java 16) are transparent data carriers. Record patterns (Java 21) let you take a record apart in the pattern itself: `case Rectangle(double w, double h)` checks the type and binds its components in one step. Patterns can be nested to reach inside records within records, and `var` can be used for the component types.\n\nJava 22 made unnamed variables `_` final, so you can ignore components you do not need: `case Circle(_, var radius)`. Together, sealed interfaces, records and pattern matching give Java a style of data-oriented programming similar to algebraic data types in functional languages.",
      example: `sealed interface Shape permits Circle, Rectangle {}
record Point(double x, double y) {}
record Circle(Point center, double radius) implements Shape {}
record Rectangle(Point topLeft, double width, double height) implements Shape {}

static double area(Shape shape) {
    return switch (shape) {
        case Circle(var center, var r) -> Math.PI * r * r;
        case Rectangle(var topLeft, var w, var h) -> w * h;
    };
}

// nested pattern
static boolean startsAtOrigin(Shape shape) {
    return shape instanceof Rectangle(Point(var x, var y), var w, var h)
        && x == 0 && y == 0;
}

// Java 22+: ignore components with _
static double radius(Shape s) {
    return s instanceof Circle(_, var r) ? r : 0;
}`,
      interviewPoints: [
        "Deconstruct records directly in patterns.",
        "Patterns can be nested.",
        "var in patterns infers component types.",
        "Sealed + records + patterns = data-oriented programming.",
      ],
    },
    {
      id: 'collection-factories',
      title: 'Immutable collection factories and Stream.toList()',
      explanation: "Java 9 added `List.of`, `Set.of` and `Map.of` (and `Map.ofEntries`) to create small immutable collections in one expression. They reject `null` elements, `Set.of` and `Map.of` reject duplicates, and any modification throws `UnsupportedOperationException`. `Set.of` and `Map.of` do not guarantee iteration order. Java 10 added `List.copyOf` and friends, which create an immutable copy.\n\nFor streams, Java 10 added `Collectors.toUnmodifiableList()`, and Java 16 added the shorter `stream.toList()`, which returns an unmodifiable list (unlike `Collectors.toList()`, which returns a mutable `ArrayList` in practice). Note that `toList()` allows nulls while `List.of` does not.",
      example: `List<String> statuses = List.of("NEW", "PAID", "SHIPPED");
Set<String> roles = Set.of("ADMIN", "CUSTOMER");
Map<String, Integer> stock = Map.of("SKU-1", 10, "SKU-2", 0);
Map<String, Integer> big = Map.ofEntries(Map.entry("SKU-1", 10), Map.entry("SKU-2", 0));

// statuses.add("CANCELLED");     // UnsupportedOperationException
// List.of("a", null);            // NullPointerException
// Set.of("a", "a");              // IllegalArgumentException: duplicate element

List<String> copy = List.copyOf(mutableList);   // immutable snapshot

List<String> paidIds = orders.stream()
    .filter(o -> o.status() == Status.PAID)
    .map(Order::id)
    .toList();                    // Java 16, unmodifiable`,
      interviewPoints: [
        "List.of/Set.of/Map.of are immutable and null-hostile.",
        "Set.of/Map.of reject duplicates and have no fixed order.",
        "List.copyOf for defensive copies.",
        "stream.toList() is unmodifiable; Collectors.toList() is not guaranteed to be.",
      ],
    },
    {
      id: 'sequenced-collections',
      title: 'Sequenced collections (Java 21)',
      explanation: "Before Java 21, getting the last element was different for every type: `list.get(list.size() - 1)`, `deque.getLast()`, `sortedSet.last()`, and for a `LinkedHashSet` there was no direct way at all. Java 21 added three interfaces: `SequencedCollection` (with `getFirst`, `getLast`, `addFirst`, `addLast`, `removeFirst`, `removeLast` and `reversed`), `SequencedSet` and `SequencedMap` (with `firstEntry`, `lastEntry`, `pollFirstEntry`, `putFirst` and `reversed`).\n\n`List`, `Deque`, `LinkedHashSet`, `SortedSet`, `LinkedHashMap` and `SortedMap` all implement them. `reversed()` returns a view, not a copy, so it is cheap.",
      example: `List<String> steps = new ArrayList<>(List.of("placed", "paid", "shipped"));
steps.getFirst();                // "placed"   (was steps.get(0))
steps.getLast();                 // "shipped"  (was steps.get(steps.size() - 1))
steps.reversed();                // [shipped, paid, placed]  - a view

LinkedHashSet<String> recent = new LinkedHashSet<>();
recent.add("SKU-1");
recent.add("SKU-2");
recent.getLast();                // "SKU-2"  (impossible directly before Java 21)

LinkedHashMap<String, Integer> cart = new LinkedHashMap<>();
cart.put("SKU-1", 2);
cart.put("SKU-2", 1);
cart.firstEntry();               // SKU-1=2
cart.pollLastEntry();            // removes and returns SKU-2=1`,
      interviewPoints: [
        "Uniform getFirst/getLast/reversed across ordered collections.",
        "SequencedCollection, SequencedSet, SequencedMap.",
        "reversed() is a view.",
        "Finally a direct way to get the last element of a LinkedHashSet.",
      ],
    },
    {
      id: 'api-improvements',
      title: 'New String, Optional and Stream methods',
      explanation: "Many small additions make everyday code shorter. String (Java 11): `isBlank()`, `strip()` (Unicode-aware `trim()`), `lines()`, `repeat()`; Java 12: `indent()`, `transform()`; Java 15: `formatted()`, plus text blocks for multi-line strings.\n\nOptional: `ifPresentOrElse()`, `or()` and `stream()` (Java 9), `orElseThrow()` with no arguments (Java 10) as a clearer `get()`, and `isEmpty()` (Java 11).\n\nStream: `takeWhile()`, `dropWhile()`, `ofNullable()` and a three-argument `iterate()` (Java 9), `Collectors.teeing()` (Java 12) to combine two collectors, and `mapMulti()` (Java 16). Java 14 also added helpful NullPointerException messages that say exactly which variable was null.",
      example: `"   ".isBlank();                         // true
"  hi  ".strip();                         // "hi"
"a\\nb\\nc".lines().count();                // 3
"ab".repeat(3);                           // "ababab"
"Order %d is %s".formatted(42, "PAID");   // "Order 42 is PAID"

String json = """
    {
      "id": 42,
      "status": "PAID"
    }
    """;

Optional<User> user = repository.findByEmail(email);
user.ifPresentOrElse(this::greet, () -> log.info("unknown user"));
User u = user.orElseThrow();              // NoSuchElementException if empty

Stream.iterate(1, i -> i <= 100, i -> i * 2).toList();       // [1, 2, 4, ..., 64]
Stream.of(1, 2, 3, 10, 4).takeWhile(i -> i < 5).toList();   // [1, 2, 3]

var stats = orders.stream().collect(Collectors.teeing(
    Collectors.counting(),
    Collectors.summingDouble(Order::amount),
    (count, total) -> new OrderStats(count, total)));

// Helpful NPE (Java 14+):
// Cannot invoke "String.length()" because "order.customer().name()" is null`,
      interviewPoints: [
        "String: isBlank, strip, lines, repeat, formatted.",
        "Optional: ifPresentOrElse, or, orElseThrow(), isEmpty.",
        "Stream: takeWhile, dropWhile, iterate with predicate, teeing.",
        "Helpful NPE messages name the null expression.",
      ],
    },
    {
      id: 'http-client',
      title: 'HttpClient (Java 11)',
      explanation: "`java.net.http.HttpClient` replaced the old, awkward `HttpURLConnection`. It supports HTTP/1.1 and HTTP/2, synchronous `send()` and asynchronous `sendAsync()` returning a `CompletableFuture`, timeouts, redirects and WebSockets, with a fluent builder API.\n\nIn Spring Boot applications you normally use Spring's `RestClient` or `WebClient`, which add JSON mapping, error handling and observability, but `HttpClient` is useful in plain Java and can even serve as the underlying engine for `RestClient`. Create one client and reuse it; it is thread-safe and keeps a connection pool.",
      example: `HttpClient client = HttpClient.newBuilder()
    .connectTimeout(Duration.ofSeconds(5))
    .followRedirects(HttpClient.Redirect.NORMAL)
    .build();

HttpRequest request = HttpRequest.newBuilder(URI.create("https://api.example.com/orders/42"))
    .header("Accept", "application/json")
    .timeout(Duration.ofSeconds(10))
    .GET()
    .build();

// synchronous
HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
System.out.println(response.statusCode() + " " + response.body());

// asynchronous
client.sendAsync(request, HttpResponse.BodyHandlers.ofString())
    .thenApply(HttpResponse::body)
    .thenAccept(System.out::println);`,
      interviewPoints: [
        "Replaces HttpURLConnection.",
        "HTTP/2, sync and async (CompletableFuture).",
        "Immutable and thread-safe; reuse one instance.",
        "In Spring, RestClient/WebClient are preferred.",
      ],
    },
    {
      id: 'virtual-threads',
      title: 'Virtual threads (Java 21)',
      explanation: "A platform thread maps one-to-one to an operating-system thread, which costs about a megabyte of stack and is expensive to create, so servers limit themselves to a few hundred. A virtual thread is managed by the JVM: it is mounted on a small pool of carrier threads only while it is running, and when it blocks on I/O (a JDBC query, an HTTP call, `Thread.sleep`), the JVM unmounts it and the carrier runs another virtual thread. You can have millions of them.\n\nThis gives the scalability of reactive programming while keeping simple, blocking, thread-per-request code that is easy to read and debug. Do not pool virtual threads; create one per task. They help I/O-bound work, not CPU-bound work. Limit access to scarce resources such as database connections with a semaphore or the connection pool, not by limiting threads. In Java 21 to 23, blocking inside `synchronized` pins the virtual thread to its carrier; Java 24 removed that limitation.",
      example: `// one virtual thread per task
try (ExecutorService executor = Executors.newVirtualThreadPerTaskExecutor()) {
    List<Future<Order>> futures = orderIds.stream()
        .map(id -> executor.submit(() -> orderClient.fetch(id)))   // blocking HTTP call
        .toList();

    for (Future<Order> f : futures) {
        process(f.get());
    }
}   // close() waits for all tasks

Thread.ofVirtual().name("report-", 0).start(() -> generateReport());
Thread.startVirtualThread(() -> System.out.println(Thread.currentThread().isVirtual()));

// Spring Boot 3.2+
// spring.threads.virtual.enabled=true`,
      interviewPoints: [
        "Cheap JVM-managed threads, millions possible.",
        "Unmounted from the carrier while blocked on I/O.",
        "Keep blocking code; no reactive style needed.",
        "Don't pool them; not faster for CPU-bound work.",
      ],
    },
    {
      id: 'structured-concurrency',
      title: 'Structured concurrency and scoped values (overview)',
      explanation: "Structured concurrency treats a group of related subtasks as one unit: if you start two lookups in parallel, they run inside a scope, the scope waits for both, and if one fails the other is cancelled automatically. This avoids leaked threads and makes error handling and cancellation follow the code's block structure. It is a preview API (`StructuredTaskScope`) whose design has changed between releases, so check the version you run before using it.\n\nScoped values (final in Java 25) are an immutable, bounded alternative to `ThreadLocal` for sharing data such as the current user or request id with code called deeper in the stack, and they work efficiently with millions of virtual threads.",
      example: `// idea (preview API; exact method names differ between Java versions)
// try (var scope = StructuredTaskScope.open()) {
//     Subtask<User>  user   = scope.fork(() -> userService.find(userId));
//     Subtask<Order> orders = scope.fork(() -> orderService.latest(userId));
//     scope.join();                    // waits; if one fails, the other is cancelled
//     return new Dashboard(user.get(), orders.get());
// }

// Scoped values (Java 25)
static final ScopedValue<String> REQUEST_ID = ScopedValue.newInstance();

ScopedValue.where(REQUEST_ID, "req-42").run(() -> handleRequest());

void handleRequest() {
    log.info("processing {}", REQUEST_ID.get());   // "req-42"
}`,
      interviewPoints: [
        "Subtasks live and die with their scope.",
        "Automatic cancellation on failure, no leaked threads.",
        "StructuredTaskScope is still evolving (preview).",
        "Scoped values: immutable, bounded ThreadLocal replacement.",
      ],
    },
    {
      id: 'other-features',
      title: 'Other notable changes: modules, JShell, single-file programs',
      explanation: "The Java Platform Module System (Java 9) splits the JDK into modules and lets libraries declare what they export and require in `module-info.java`, giving strong encapsulation. Most Spring Boot applications still run on the classpath without their own modules, but the JDK's internals are now encapsulated, which is why old libraries using internal APIs broke when upgrading from Java 8.\n\nJShell (Java 9) is an interactive REPL for trying snippets. Since Java 11 you can run a single source file with `java Hello.java` without compiling it first, and Java 25 finalised compact source files and instance `main` methods, so a beginner program can be just `void main() { IO.println(\"Hello\"); }`. Interfaces have allowed private methods since Java 9.",
      example: `// module-info.java
module com.shop.orders {
    requires java.net.http;
    exports com.shop.orders.api;         // only this package is visible to others
}

$ jshell
jshell> List.of(1, 2, 3).stream().mapToInt(i -> i).sum()
$1 ==> 6

$ java Hello.java                          # Java 11+: compile and run in one step

// Hello.java (Java 25)
void main() {
    IO.println("Hello, modern Java!");
}`,
      interviewPoints: [
        "Modules: explicit exports/requires, strong encapsulation.",
        "Encapsulated JDK internals broke some Java 8 libraries.",
        "JShell for quick experiments.",
        "Single-file launch and compact source files simplify small programs.",
      ],
    },
  ],

  commonMistakes: [
    "Thinking var makes Java dynamically typed; the type is fixed at compile time.",
    "Using var for fields or method parameters, which is not allowed.",
    "Trying to add to a List.of() or stream.toList() result and getting UnsupportedOperationException.",
    "Putting null into List.of, Set.of or Map.of, which throws NullPointerException.",
    "Relying on the iteration order of Set.of or Map.of.",
    "Adding a default branch to a switch over a sealed type, which hides missing cases when a new subtype is added.",
    "Ordering a general case (case Integer i) before a guarded specific one (case Integer i when i < 0), which does not compile.",
    "Pooling virtual threads or expecting them to speed up CPU-heavy work.",
    "Using preview features such as structured concurrency in production code without --enable-preview and a plan for API changes.",
  ],

  interviewTips: [
    "Know which LTS you use and name two or three features from each: 11 (HttpClient, String methods), 17 (sealed, records), 21 (virtual threads, pattern matching for switch).",
    "Show sealed interface + records + exhaustive switch as one combined example; it demonstrates modern data modelling.",
    "When asked about virtual threads, explain mounting and unmounting on carriers and when they do not help.",
    "Mention that Spring Boot 3 requires Java 17 and supports virtual threads with one property.",
    "Be precise about immutability: List.of and toList() are unmodifiable, Collectors.toList() is not guaranteed to be.",
  ],

  interviewQuestions: [
    {
      id: 'java-modern-q1',
      question: "What are the most important features added between Java 8 and Java 21?",
      answer: "Java 9: modules, JShell, and List.of/Set.of/Map.of. Java 10: var for local variables. Java 11 (LTS): the new HttpClient, String methods such as isBlank, strip, lines and repeat, and running single-file programs. Java 14: switch expressions and helpful NullPointerException messages. Java 15: text blocks. Java 16: records, pattern matching for instanceof and Stream.toList(). Java 17 (LTS): sealed classes. Java 21 (LTS): virtual threads, record patterns, pattern matching for switch and sequenced collections. The main themes are less boilerplate, safer data modelling and scalable concurrency.",
      points: [
        "11: HttpClient, String API, var in lambdas.",
        "14–16: switch expressions, text blocks, records, instanceof patterns.",
        "17: sealed classes; the LTS that Spring Boot 3 requires.",
        "21: virtual threads, pattern matching for switch, sequenced collections.",
      ],
      difficulty: 'Beginner',
    },
    {
      id: 'java-modern-q2',
      question: "What is var in Java? Does it make Java dynamically typed?",
      answer: "var (Java 10) is local variable type inference: the compiler infers the variable's type from its initializer. It does not make Java dynamically typed; the inferred type is fixed at compile time, exactly as if you had written it, and assigning a value of another type is a compile error. var can be used only for local variables with an initializer, in enhanced for loops, in try-with-resources and (Java 11) for lambda parameters. It cannot be used for fields, method parameters or return types, or be initialized with null. It improves readability when the type is obvious, for example var map = new HashMap<String, List<Order>>(), and hurts it when the type is not.",
      example: `var count = 10;       // int
// count = "ten";     // compile error: incompatible types`,
      points: [
        "Compile-time inference, static typing.",
        "Local variables only.",
        "Not for fields, parameters, return types.",
      ],
      difficulty: 'Beginner',
    },
    {
      id: 'java-modern-q3',
      question: "What are sealed classes and why are they useful?",
      answer: "A sealed class or interface (Java 17) restricts which classes may extend or implement it, using a permits clause. Each permitted subclass must be declared final, sealed or non-sealed. This models a closed set of alternatives, such as the payment methods CardPayment, UpiPayment and CashOnDelivery. Unlike an enum, each alternative can be a different class with its own fields. The main advantage is that the compiler knows all subtypes, so a switch with pattern matching over a sealed type can be checked for exhaustiveness without a default branch. When someone adds a new subtype, every switch that does not handle it fails to compile, instead of failing at runtime.",
      example: `public sealed interface Payment permits CardPayment, UpiPayment, CashOnDelivery {}`,
      points: [
        "permits limits the subtypes.",
        "Subtypes are final, sealed or non-sealed.",
        "Enables exhaustive switch.",
        "Adding a subtype produces compile errors where it is not handled.",
      ],
      difficulty: 'Intermediate',
    },
    {
      id: 'java-modern-q4',
      question: "Explain pattern matching for switch with an example.",
      answer: "Since Java 21, case labels can be type patterns with an optional when guard, and record patterns that deconstruct records. The switch tests the selector against each pattern in order, binds variables for the first match and runs that branch. Over a sealed type the compiler checks that all subtypes are covered, so no default is needed. More specific patterns must come before more general ones, and case null can handle null explicitly.",
      example: `sealed interface Shape permits Circle, Rectangle {}
record Circle(double radius) implements Shape {}
record Rectangle(double width, double height) implements Shape {}

double area(Shape shape) {
    return switch (shape) {
        case Circle c -> Math.PI * c.radius() * c.radius();
        case Rectangle(var w, var h) when w == h -> w * w;   // square
        case Rectangle(var w, var h) -> w * h;
    };
}`,
      points: [
        "Type patterns and record patterns in case labels.",
        "when guards.",
        "Exhaustive over sealed types.",
        "Specific before general.",
      ],
      difficulty: 'Intermediate',
    },
    {
      id: 'java-modern-q5',
      question: "What is the difference between List.of(), Arrays.asList(), Collectors.toList() and Stream.toList()?",
      answer: "List.of() (Java 9) returns an immutable list: no add, remove or set, and it rejects null elements. Arrays.asList() returns a fixed-size list backed by the array: set() works and writes through to the array, but add and remove throw UnsupportedOperationException; nulls are allowed. Collectors.toList() makes no guarantee about mutability, but in practice returns a mutable ArrayList. Stream.toList() (Java 16) returns an unmodifiable list and allows null elements. Use List.of for constants, Stream.toList() for stream results you will not modify, and new ArrayList<>(...) when you need a mutable list.",
      points: [
        "List.of: immutable, no nulls.",
        "Arrays.asList: fixed size, backed by the array.",
        "Collectors.toList: mutable in practice, not guaranteed.",
        "Stream.toList: unmodifiable, nulls allowed.",
      ],
      difficulty: 'Intermediate',
    },
    {
      id: 'java-modern-q6',
      question: "What are virtual threads and how do they differ from platform threads?",
      answer: "A platform thread is a thin wrapper around an operating-system thread: it has a large stack, is expensive to create and switch, and a server can only afford a few thousand. A virtual thread (final in Java 21) is a lightweight thread managed by the JVM. Virtual threads run on a small pool of carrier platform threads; when a virtual thread blocks on I/O, the JVM saves its stack to the heap and unmounts it, freeing the carrier to run another. This allows millions of concurrent virtual threads with simple blocking code, which is ideal for thread-per-request servers that mostly wait on databases and HTTP calls. They do not make CPU-bound code faster, should not be pooled, and still need limits on scarce resources such as database connections.",
      example: `try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
    ids.forEach(id -> executor.submit(() -> client.fetch(id)));
}`,
      points: [
        "Platform thread = OS thread; virtual thread = JVM-managed.",
        "Unmount on blocking I/O.",
        "Millions possible; don't pool them.",
        "Helps I/O-bound work only.",
      ],
      difficulty: 'Intermediate',
    },
    {
      id: 'java-modern-q7',
      question: "What are sequenced collections in Java 21?",
      answer: "Java 21 introduced SequencedCollection, SequencedSet and SequencedMap to give all collections with a defined encounter order a common API. SequencedCollection adds getFirst(), getLast(), addFirst(), addLast(), removeFirst(), removeLast() and reversed(); SequencedMap adds firstEntry(), lastEntry(), pollFirstEntry(), pollLastEntry(), putFirst(), putLast() and reversed(). List, Deque, LinkedHashSet, SortedSet, LinkedHashMap and SortedMap implement them. Before this, each type had different methods, for example list.get(list.size() - 1) versus deque.getLast(), and LinkedHashSet had no direct way to get its last element. reversed() returns a view, not a copy.",
      points: [
        "Common API for ordered collections.",
        "getFirst, getLast, reversed and friends.",
        "Implemented by List, Deque, LinkedHashSet/Map, sorted types.",
        "reversed() is a view.",
      ],
      difficulty: 'Beginner',
    },
    {
      id: 'java-modern-q8',
      question: "How would you model an API result that can be Success, NotFound or Error in modern Java?",
      answer: "Use a sealed interface with record implementations and handle it with an exhaustive pattern-matching switch. The sealed interface lists the only possible outcomes, each record carries exactly the data that outcome needs, and the switch needs no default. If a new outcome such as RateLimited is added later, every switch that does not handle it fails to compile, so no case is forgotten. This is safer than returning null, throwing exceptions for expected situations, or using an enum plus nullable fields.",
      example: `sealed interface Result<T> permits Success, NotFound, Failure {}
record Success<T>(T value) implements Result<T> {}
record NotFound<T>(String id) implements Result<T> {}
record Failure<T>(Exception error) implements Result<T> {}

ResponseEntity<?> toResponse(Result<Order> result) {
    return switch (result) {
        case Success<Order>(var order) -> ResponseEntity.ok(order);
        case NotFound<Order>(var id) -> ResponseEntity.notFound().build();
        case Failure<Order>(var e) -> ResponseEntity.internalServerError().body(e.getMessage());
    };
}`,
      points: [
        "Sealed interface for the closed set of outcomes.",
        "Records carry per-outcome data.",
        "Exhaustive switch with record patterns.",
        "Compiler catches unhandled new cases.",
      ],
      difficulty: 'Advanced',
    },
    {
      id: 'java-modern-q9',
      question: "What problems might you face when migrating a Spring application from Java 8 to Java 17 or 21?",
      answer: "The JDK's internal APIs are strongly encapsulated since Java 16/17, so old libraries using reflection on internals (older Lombok, Mockito, ByteBuddy, some serialization or bytecode tools) fail with InaccessibleObjectException; upgrade them. Java EE modules such as JAXB and JAX-WS were removed from the JDK in Java 11, so they must be added as dependencies. Spring Boot 3 requires Java 17 and moves from javax.* to jakarta.* packages, which touches JPA, validation and servlet imports. Build tools and plugins (Maven compiler, Surefire, JaCoCo) need recent versions. Default garbage collector changed to G1, and container-aware memory settings may change behaviour. A safe path is upgrading dependencies first, then the JDK, then Spring Boot, with the test suite running at each step, and using tools such as OpenRewrite to automate the javax to jakarta migration.",
      points: [
        "Encapsulated JDK internals break old libraries.",
        "JAXB/JAX-WS removed from the JDK.",
        "Spring Boot 3: Java 17 and javax to jakarta.",
        "Upgrade plugins; use OpenRewrite; test each step.",
      ],
      difficulty: 'Advanced',
    },
  ],
}

export default topic
