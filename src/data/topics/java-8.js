const topic = {
  id: 'java-8',
  category: 'java',
  title: 'Java 8+ Features',
  description: 'Lambdas, streams, Optional, the new date-time API and modern additions like records and switch expressions.',
  difficulty: 'Intermediate',
  overview: "Java 8 (released in 2014) was the biggest change to the language in its history. It added lambda expressions and the Stream API, which let you write code in a functional style: you describe what you want (\"keep the active users, take their emails, sort them\") instead of writing loops that say how to do it step by step.\n\nThink of a stream like a factory conveyor belt. Items travel along the belt, one station filters out bad items, the next station paints them, and the last station packs them into a box. Each station is a small function you pass in as a lambda.\n\nJava 8 also brought `Optional` to reduce NullPointerExceptions, default and static methods in interfaces, and a brand-new date-time API (`LocalDate`, `LocalDateTime`). Later versions kept going: records (Java 16) remove boilerplate for data classes, and switch expressions (Java 14) make branching shorter and safer.\n\nModern Spring Boot code uses these features everywhere, so interviewers expect you to read and write streams and lambdas fluently.",

  subtopics: [
    {
      id: 'lambda-expressions',
      title: 'Lambda Expressions',
      explanation: "A lambda is a short anonymous function: a piece of behaviour you can pass around like a value. The syntax is `(parameters) -> expression` or `(parameters) -> { statements; }`. Types of parameters are usually inferred by the compiler.\n\nLambdas replace bulky anonymous inner classes. They can use local variables from the surrounding method only if those variables are effectively final (never reassigned).",
      example: `// Before Java 8: anonymous class
Runnable oldWay = new Runnable() {
    @Override
    public void run() {
        System.out.println("Hello");
    }
};

// Java 8 lambda
Runnable newWay = () -> System.out.println("Hello");

Comparator<String> byLength = (a, b) -> Integer.compare(a.length(), b.length());

BinaryOperator<Integer> add = (x, y) -> {
    int sum = x + y;
    return sum;
};`,
      interviewPoints: [
        'A lambda can only be used where a functional interface is expected.',
        'Captured local variables must be effectively final.',
        'Inside a lambda, this refers to the enclosing object, unlike in an anonymous class.',
      ],
    },
    {
      id: 'functional-interfaces',
      title: 'Functional Interfaces',
      explanation: "A functional interface is an interface with exactly one abstract method, such as `Runnable`, `Comparator` or `Callable`. Any lambda is really an implementation of that one method. You can mark such interfaces with `@FunctionalInterface` so the compiler complains if someone adds a second abstract method.\n\nDefault and static methods do not count, so an interface can have many of those and still be functional. The package `java.util.function` provides ready-made ones so you rarely need your own.",
      example: `@FunctionalInterface
interface Discount {
    double apply(double price);

    default Discount andThen(Discount next) {
        return p -> next.apply(apply(p));
    }
}

Discount tenPercent = p -> p * 0.9;
Discount minusFifty = p -> p - 50;
System.out.println(tenPercent.andThen(minusFifty).apply(1000)); // 850.0`,
      interviewPoints: [
        'Exactly one abstract method (SAM = Single Abstract Method).',
        '@FunctionalInterface is optional but recommended.',
        'Methods inherited from Object (like equals) do not count as abstract methods.',
      ],
    },
    {
      id: 'predicate-function-consumer-supplier',
      title: 'Predicate, Function, Consumer & Supplier',
      explanation: "These four are the core built-in functional interfaces. `Predicate<T>` takes a T and returns a boolean (`test`), used for filtering. `Function<T, R>` takes a T and returns an R (`apply`), used for transforming. `Consumer<T>` takes a T and returns nothing (`accept`), used for side effects like printing. `Supplier<T>` takes nothing and returns a T (`get`), used for creating values lazily.\n\nThere are also two-argument versions (`BiFunction`, `BiPredicate`, `BiConsumer`), `UnaryOperator<T>` and `BinaryOperator<T>`, and primitive versions like `IntPredicate` that avoid boxing.",
      example: `Predicate<String> isLong = s -> s.length() > 5;
Predicate<String> startsWithA = s -> s.startsWith("A");
System.out.println(isLong.and(startsWithA).test("Anirudh")); // true

Function<String, Integer> length = String::length;
Function<Integer, Integer> doubled = n -> n * 2;
System.out.println(length.andThen(doubled).apply("java")); // 8

Consumer<String> printer = s -> System.out.println("Hi " + s);
printer.accept("Asha");

Supplier<List<String>> listMaker = ArrayList::new;
List<String> fresh = listMaker.get();`,
      interviewPoints: [
        'Predicate: T -> boolean; Function: T -> R; Consumer: T -> void; Supplier: () -> T.',
        'Predicate has and(), or(), negate(); Function has andThen() and compose().',
        'Use IntPredicate, ToIntFunction etc. to avoid autoboxing costs.',
      ],
    },
    {
      id: 'method-references',
      title: 'Method References',
      explanation: "A method reference is a shorter way to write a lambda that just calls an existing method, using `::`. There are four kinds: static method (`Integer::parseInt`), instance method of a particular object (`System.out::println`), instance method of an arbitrary object of a type (`String::toUpperCase`), and constructor (`ArrayList::new`).\n\nUse them when they make code clearer; if the lambda does anything more than call one method, keep the lambda.",
      example: `List<String> nums = List.of("3", "1", "2");

// Static method: s -> Integer.parseInt(s)
List<Integer> ints = nums.stream().map(Integer::parseInt).toList();

// Instance method of a particular object: x -> System.out.println(x)
ints.forEach(System.out::println);

// Instance method of an arbitrary object: s -> s.toUpperCase()
List<String> upper = List.of("a", "b").stream().map(String::toUpperCase).toList();

// Constructor: () -> new ArrayList<>()
Supplier<List<String>> maker = ArrayList::new;`,
      interviewPoints: [
        'Four kinds: static, bound instance, unbound instance, constructor.',
        'Method references are just syntax sugar for lambdas.',
      ],
    },
    {
      id: 'stream-api',
      title: 'Stream API',
      explanation: "A stream is a pipeline for processing a sequence of elements. It has three parts: a source (a collection, array, or `Stream.of`), zero or more intermediate operations (`filter`, `map`, `sorted`...) that return a new stream, and one terminal operation (`collect`, `count`, `forEach`...) that produces a result.\n\nStreams are lazy: intermediate operations do nothing until a terminal operation runs. They do not modify the source collection, and a stream can be used only once. `parallelStream()` can split work across CPU cores, but only helps for large, CPU-heavy, stateless work.",
      example: `record Employee(String name, String dept, double salary) {}

List<Employee> staff = List.of(
    new Employee("Asha", "IT", 90000),
    new Employee("Ravi", "HR", 50000),
    new Employee("Neha", "IT", 120000));

List<String> itNames = staff.stream()              // source
        .filter(e -> e.dept().equals("IT"))        // intermediate
        .map(Employee::name)                       // intermediate
        .sorted()                                  // intermediate
        .toList();                                 // terminal (Java 16+)

System.out.println(itNames); // [Asha, Neha]`,
      interviewPoints: [
        'Source -> intermediate operations (lazy) -> one terminal operation.',
        'A stream cannot be reused after its terminal operation (IllegalStateException).',
        'Streams do not store data and do not change the source.',
      ],
    },
    {
      id: 'filter-map',
      title: 'filter() & map()',
      explanation: "`filter(predicate)` keeps only elements for which the predicate returns true. `map(function)` transforms each element into something else, possibly of a different type, so a `Stream<User>` can become a `Stream<String>` of emails.\n\n`flatMap()` is a close relative: it maps each element to a stream and flattens all those streams into one, which is useful for lists of lists.",
      example: `List<Integer> nums = List.of(1, 2, 3, 4, 5, 6);

List<Integer> evenSquares = nums.stream()
        .filter(n -> n % 2 == 0)   // 2, 4, 6
        .map(n -> n * n)           // 4, 16, 36
        .toList();

List<List<String>> nested = List.of(List.of("a", "b"), List.of("c"));
List<String> flat = nested.stream()
        .flatMap(List::stream)     // a, b, c
        .toList();`,
      interviewPoints: [
        'filter changes how many elements there are; map changes what each element is.',
        'map is one-to-one; flatMap is one-to-many then flattened.',
        'Use mapToInt/mapToDouble to get primitive streams with sum() and average().',
      ],
    },
    {
      id: 'sorted-distinct',
      title: 'sorted() & distinct()',
      explanation: "`sorted()` sorts elements by natural order, and `sorted(comparator)` uses a custom order. `distinct()` removes duplicates using `equals()` and `hashCode()`, keeping the first occurrence.\n\nBoth are stateful operations: they need to see many (or all) elements before passing any on, so they are more expensive than `filter` or `map`, especially on parallel streams.",
      example: `List<String> names = List.of("Ravi", "asha", "Neha", "Ravi", "Bala");

List<String> result = names.stream()
        .distinct()                                  // remove duplicate "Ravi"
        .sorted(String.CASE_INSENSITIVE_ORDER)       // asha, Bala, Neha, Ravi
        .toList();

List<String> byLengthDesc = names.stream()
        .distinct()
        .sorted(Comparator.comparingInt(String::length).reversed())
        .toList();`,
      interviewPoints: [
        'distinct() relies on equals()/hashCode().',
        'sorted() without arguments needs elements that implement Comparable.',
        'Both are stateful intermediate operations.',
      ],
    },
    {
      id: 'collect',
      title: 'collect()',
      explanation: "`collect()` is a terminal operation that gathers stream elements into a container, using a `Collector`. The `Collectors` class has ready-made ones: `toList()`, `toSet()`, `toMap()`, `joining()`, `groupingBy()`, `partitioningBy()`, `counting()` and `averagingDouble()`.\n\n`groupingBy` is the SQL GROUP BY of streams and appears in many interview questions. Since Java 16 you can use the shorter `stream.toList()`, which returns an unmodifiable list.",
      example: `record Employee(String name, String dept, double salary) {}
List<Employee> staff = List.of(
    new Employee("Asha", "IT", 90000),
    new Employee("Ravi", "HR", 50000),
    new Employee("Neha", "IT", 120000));

Map<String, List<Employee>> byDept = staff.stream()
        .collect(Collectors.groupingBy(Employee::dept));

Map<String, Double> avgSalary = staff.stream()
        .collect(Collectors.groupingBy(Employee::dept,
                Collectors.averagingDouble(Employee::salary)));

Map<String, Double> salaryByName = staff.stream()
        .collect(Collectors.toMap(Employee::name, Employee::salary));

String csv = staff.stream().map(Employee::name)
        .collect(Collectors.joining(", ", "[", "]")); // [Asha, Ravi, Neha]

Map<Boolean, List<Employee>> richOrNot = staff.stream()
        .collect(Collectors.partitioningBy(e -> e.salary() > 80000));`,
      interviewPoints: [
        'toMap throws IllegalStateException on duplicate keys unless you pass a merge function.',
        'groupingBy returns Map<K, List<V>> by default; pass a downstream collector to change V.',
        'partitioningBy always returns a map with keys true and false.',
      ],
    },
    {
      id: 'reduce',
      title: 'reduce()',
      explanation: "`reduce()` combines all elements into a single value by repeatedly applying a function, such as summing numbers or finding the maximum. The form `reduce(identity, accumulator)` starts from the identity value (0 for sum, 1 for product) and returns a plain value. The form `reduce(accumulator)` has no starting value and returns an `Optional`, because the stream might be empty.",
      example: `List<Integer> nums = List.of(1, 2, 3, 4);

int sum = nums.stream().reduce(0, Integer::sum);          // 10
int product = nums.stream().reduce(1, (a, b) -> a * b);   // 24
Optional<Integer> max = nums.stream().reduce(Integer::max); // Optional[4]

// For numbers, specialised streams are simpler
int sum2 = nums.stream().mapToInt(Integer::intValue).sum();`,
      interviewPoints: [
        'Identity must be neutral for the operation (0 for +, 1 for *).',
        'Without an identity, reduce returns Optional.',
        'The accumulator must be associative for correct parallel results.',
      ],
    },
    {
      id: 'foreach-count',
      title: 'forEach() & count()',
      explanation: "`forEach(consumer)` is a terminal operation that runs an action on each element, typically for side effects like printing or sending. `count()` returns the number of elements as a `long`.\n\nAvoid using `forEach` to add items to an outside list; use `collect` instead, which is cleaner and safe for parallel streams. Note that `Iterable.forEach` (on a list directly) exists too and does not need a stream.",
      example: `List<String> names = List.of("Asha", "Ravi", "Neha");

names.forEach(System.out::println);            // Iterable.forEach

long longNames = names.stream()
        .filter(n -> n.length() > 3)
        .count();                              // 3

// Bad: side effect into external list
List<String> out = new ArrayList<>();
names.stream().map(String::toUpperCase).forEach(out::add);
// Good:
List<String> upper = names.stream().map(String::toUpperCase).toList();`,
      interviewPoints: [
        'forEach and count are terminal operations.',
        'count() returns long.',
        'forEach on a parallel stream does not guarantee order; use forEachOrdered if needed.',
      ],
    },
    {
      id: 'optional',
      title: 'Optional, orElse() & orElseGet()',
      explanation: "`Optional<T>` is a container that either holds a value or is empty. It makes \"there might be no result\" explicit in a method's return type, so callers are forced to handle the empty case instead of getting a surprise `NullPointerException`. Spring Data's `findById()` returns an `Optional`.\n\nCreate one with `Optional.of(value)` (value must not be null), `Optional.ofNullable(value)` or `Optional.empty()`. Get the value safely with `orElse(default)`, `orElseGet(supplier)`, `orElseThrow()`, or transform it with `map()`, `filter()` and `ifPresent()`.\n\nThe key difference: `orElse(x)` always evaluates x, even when the Optional has a value. `orElseGet(() -> x)` only runs the supplier when the Optional is empty. Use `orElseGet` when the default is expensive, like a database call or object creation.",
      example: `Optional<String> name = Optional.ofNullable(findNameById(42));

String upper = name.map(String::toUpperCase).orElse("UNKNOWN");

name.ifPresent(n -> System.out.println("Found " + n));

// orElse vs orElseGet
String a = name.orElse(loadDefault());          // loadDefault() ALWAYS runs
String b = name.orElseGet(() -> loadDefault()); // runs only if empty

// Typical Spring usage
// User user = userRepository.findById(id)
//         .orElseThrow(() -> new UserNotFoundException(id));`,
      interviewPoints: [
        'Optional.of(null) throws NullPointerException; use ofNullable.',
        'orElse evaluates its argument eagerly; orElseGet is lazy.',
        'Use Optional for return types, not for fields, parameters or collections.',
        'Avoid calling get() without checking; prefer orElseThrow().',
      ],
    },
    {
      id: 'default-static-interface-methods',
      title: 'Default & Static Interface Methods',
      explanation: "Before Java 8, interfaces could only declare abstract methods. A default method has a body and is inherited by all implementing classes, which can override it. It was added so that old interfaces could gain new methods (like `List.sort()` or `Collection.stream()`) without breaking every existing implementation.\n\nA static interface method belongs to the interface itself and is called as `InterfaceName.method()`, like `Comparator.comparing()` or `List.of()`. It is not inherited by implementing classes. If a class implements two interfaces with the same default method, it must override the method and can pick one with `A.super.method()`.",
      example: `interface Greeter {
    String name();

    default String greet() {             // inherited, can be overridden
        return "Hello, " + name();
    }

    static Greeter of(String n) {        // called as Greeter.of(...)
        return () -> n;
    }
}

interface A { default String hi() { return "A"; } }
interface B { default String hi() { return "B"; } }

class C implements A, B {
    @Override
    public String hi() {
        return A.super.hi();             // resolve the diamond conflict
    }
}

System.out.println(Greeter.of("Asha").greet()); // Hello, Asha`,
      interviewPoints: [
        'Default methods enable backward-compatible interface evolution.',
        'Static interface methods are not inherited and cannot be overridden.',
        'Class methods win over interface defaults; conflicting defaults must be overridden.',
      ],
    },
    {
      id: 'date-time-api',
      title: 'LocalDate, LocalDateTime & Period',
      explanation: "Java 8 added the `java.time` package to replace the old, confusing `Date` and `Calendar` classes, which were mutable and not thread-safe. The new classes are immutable and thread-safe: every \"change\" returns a new object.\n\n`LocalDate` is a date without time (2026-09-29), `LocalTime` is a time without date, and `LocalDateTime` is both, all without a time zone. `ZonedDateTime` and `Instant` handle time zones and exact moments. `Period` measures a date-based amount (years, months, days), while `Duration` measures a time-based amount (hours, minutes, seconds). `DateTimeFormatter` formats and parses.",
      example: `LocalDate today = LocalDate.now();
LocalDate birthday = LocalDate.of(1998, Month.MARCH, 15);
LocalDate nextWeek = today.plusWeeks(1);   // today is unchanged

Period age = Period.between(birthday, today);
System.out.println(age.getYears() + " years");

LocalDateTime meeting = LocalDateTime.of(2026, 10, 1, 14, 30);
Duration length = Duration.ofMinutes(90);
LocalDateTime end = meeting.plus(length);

DateTimeFormatter fmt = DateTimeFormatter.ofPattern("dd-MM-yyyy");
LocalDate parsed = LocalDate.parse("29-09-2026", fmt);
System.out.println(today.isAfter(birthday)); // true`,
      interviewPoints: [
        'java.time classes are immutable and thread-safe; Date and SimpleDateFormat are not.',
        'Period = years/months/days; Duration = hours/minutes/seconds/nanos.',
        'Store timestamps as Instant or OffsetDateTime in UTC for backend systems.',
      ],
    },
    {
      id: 'records',
      title: 'Records',
      explanation: "A record (final in Java 16) is a compact way to declare an immutable data class. Writing `record Point(int x, int y) {}` automatically gives you private final fields, a constructor, accessor methods `x()` and `y()`, and correct `equals()`, `hashCode()` and `toString()`.\n\nRecords are ideal for DTOs (data transfer objects), API request/response bodies and map keys. They cannot extend other classes (they implicitly extend `Record`) but can implement interfaces, have static methods, and use a compact constructor for validation.",
      example: `public record UserDto(String name, String email, int age) {
    // Compact constructor for validation
    public UserDto {
        if (age < 0) {
            throw new IllegalArgumentException("age must be >= 0");
        }
    }

    public boolean isAdult() {
        return age >= 18;
    }
}

UserDto u = new UserDto("Asha", "asha@example.com", 25);
System.out.println(u.name());   // accessor, not getName()
System.out.println(u);          // UserDto[name=Asha, email=asha@example.com, age=25]
System.out.println(u.equals(new UserDto("Asha", "asha@example.com", 25))); // true`,
      interviewPoints: [
        'Fields are private final; records are shallowly immutable.',
        'equals, hashCode, toString and accessors are generated.',
        'Records cannot extend a class and cannot declare extra instance fields.',
        'Not suitable as JPA entities, which need a no-arg constructor and mutable fields.',
      ],
    },
    {
      id: 'switch-expressions',
      title: 'Switch Expressions',
      explanation: "Since Java 14, `switch` can be an expression that returns a value. The arrow form `case X -> value` has no fall-through, so you never forget a `break`. You can list several labels in one case (`case SAT, SUN ->`) and use `yield` to return a value from a block.\n\nWhen switching over an enum or sealed type, the compiler checks that all cases are covered (exhaustiveness). Java 21 adds pattern matching in switch, so you can switch on types: `case Circle c -> ...`.",
      example: `enum Day { MON, TUE, WED, THU, FRI, SAT, SUN }

Day day = Day.SAT;

String type = switch (day) {
    case SAT, SUN -> "Weekend";
    case MON, TUE, WED, THU, FRI -> "Weekday";
};  // no default needed: all enum values covered

int workHours = switch (day) {
    case SAT, SUN -> 0;
    default -> {
        int base = 8;
        yield day == Day.FRI ? base - 2 : base;
    }
};

// Java 21 pattern matching
Object obj = 42;
String desc = switch (obj) {
    case Integer i when i > 10 -> "big number " + i;
    case Integer i -> "number " + i;
    case String s -> "text " + s;
    default -> "other";
};`,
      interviewPoints: [
        'Arrow cases do not fall through.',
        'Use yield to return a value from a block case.',
        'Switch expressions must be exhaustive.',
      ],
    },
  ],

  commonMistakes: [
    'Reusing a stream after a terminal operation, which throws IllegalStateException: stream has already been operated upon or closed.',
    'Using orElse(expensiveCall()) and not realising the expensive call runs even when the Optional has a value.',
    'Calling Optional.get() without checking, which just replaces NullPointerException with NoSuchElementException.',
    'Using Collectors.toMap() with duplicate keys and no merge function, causing IllegalStateException.',
    'Trying to modify a local variable inside a lambda; captured variables must be effectively final.',
    'Forgetting that stream.toList() returns an unmodifiable list, then calling add() on it.',
    'Writing intermediate operations with no terminal operation and wondering why nothing happens (streams are lazy).',
  ],

  interviewTips: [
    'Be ready to write a stream live: grouping employees by department, finding the second-highest salary, or counting word frequencies with groupingBy and counting.',
    'When explaining orElse vs orElseGet, give a concrete example with a method that has a side effect such as a database call.',
    'Explain streams in terms of source, intermediate and terminal operations, and mention laziness.',
    'Connect features to Spring: Optional from findById, records for DTOs, lambdas in configuration beans.',
    'Know which version introduced what: lambdas/streams/Optional in 8, List.of in 9, var in 10, switch expressions in 14, records in 16, pattern matching for switch in 21.',
  ],

  interviewQuestions: [
    {
      id: 'java-8-q1',
      question: 'What is a lambda expression in Java?',
      answer: "A lambda expression is a short, anonymous function that you can pass as an argument or store in a variable. Its syntax is `(parameters) -> body`. It lets you treat behaviour as data, which makes code shorter and enables functional-style APIs like streams.\n\nA lambda always implements a functional interface (an interface with one abstract method). The compiler infers which method the lambda implements from the context.",
      example: `List<String> names = new ArrayList<>(List.of("Ravi", "Asha", "Neha"));
names.sort((a, b) -> a.compareTo(b));
names.forEach(n -> System.out.println(n));`,
      points: [
        'Anonymous function: parameters, arrow, body.',
        'Target type must be a functional interface.',
        'Captured local variables must be effectively final.',
      ],
      difficulty: 'Beginner',
    },
    {
      id: 'java-8-q2',
      question: 'What is a functional interface? Name some built-in ones.',
      answer: "A functional interface has exactly one abstract method, so it can be implemented by a lambda or method reference. It may still have any number of default and static methods. The optional `@FunctionalInterface` annotation makes the compiler enforce the single-abstract-method rule.\n\nCommon built-in examples are `Runnable`, `Callable`, `Comparator`, and the `java.util.function` family: `Predicate<T>` (T to boolean), `Function<T, R>` (T to R), `Consumer<T>` (T to nothing), `Supplier<T>` (nothing to T), `UnaryOperator<T>` and `BinaryOperator<T>`.",
      points: [
        'Exactly one abstract method.',
        'Default and static methods are allowed.',
        'Predicate, Function, Consumer, Supplier are the core four.',
      ],
      difficulty: 'Beginner',
    },
    {
      id: 'java-8-q3',
      question: 'What is the difference between map() and filter() in streams?',
      answer: "`filter()` takes a `Predicate` and keeps only elements that match, so it can reduce the number of elements but never changes them. `map()` takes a `Function` and transforms every element into a new value, possibly of a different type, but keeps the same count.\n\nThey are often combined: first filter to the elements you care about, then map them to the data you need.",
      example: `List<String> emails = users.stream()
        .filter(u -> u.isActive())   // fewer users
        .map(u -> u.getEmail())      // User -> String
        .toList();`,
      points: [
        'filter: Predicate, keeps or drops elements.',
        'map: Function, transforms each element.',
        'Both are lazy intermediate operations.',
      ],
      difficulty: 'Beginner',
    },
    {
      id: 'java-8-q4',
      question: 'What is the difference between intermediate and terminal operations in streams?',
      answer: "Intermediate operations such as `filter`, `map`, `sorted`, `distinct` and `limit` return a new stream and are lazy: they only describe work and do nothing on their own. Terminal operations such as `collect`, `forEach`, `reduce`, `count`, `findFirst` and `anyMatch` trigger the actual processing and produce a result or side effect.\n\nBecause of laziness, streams can optimise work: elements flow through the whole pipeline one at a time, and short-circuiting operations like `findFirst` or `limit` can stop early without processing the rest. After a terminal operation the stream is consumed and cannot be reused.",
      example: `Stream.of("a", "bb", "ccc")
      .filter(s -> {
          System.out.println("filter " + s);
          return s.length() > 1;
      })
      .findFirst();   // prints "filter a", "filter bb" and stops`,
      points: [
        'Intermediate = lazy, returns Stream.',
        'Terminal = eager, returns a result, closes the stream.',
        'Short-circuiting operations can skip remaining elements.',
      ],
      difficulty: 'Intermediate',
    },
    {
      id: 'java-8-q5',
      question: 'What is the difference between orElse() and orElseGet() in Optional?',
      answer: "Both return the contained value if present, or a fallback if the Optional is empty. The difference is when the fallback is computed. `orElse(value)` takes an already-computed value, so its argument is always evaluated, even when the Optional has a value. `orElseGet(supplier)` takes a `Supplier` that is only called when the Optional is empty.\n\nUse `orElse` for cheap constants like `\"\"` or `0`, and `orElseGet` when the fallback is expensive or has side effects, like a database query, a remote call or creating a new object.",
      example: `Optional<User> cached = Optional.of(user);

// createGuestUser() runs even though cached has a value!
User a = cached.orElse(createGuestUser());

// createGuestUser() is never called here
User b = cached.orElseGet(() -> createGuestUser());`,
      points: [
        'orElse is eager; orElseGet is lazy.',
        'orElseGet avoids unnecessary expensive work.',
        'orElseThrow() is the third option when absence is an error.',
      ],
      difficulty: 'Intermediate',
    },
    {
      id: 'java-8-q6',
      question: 'What is Optional and how should it be used correctly?',
      answer: "`Optional<T>` is a container that may or may not hold a non-null value. It was designed as a return type for methods that might not have a result, making that possibility visible in the method signature and pushing callers to handle it explicitly.\n\nGood usage: return `Optional` from lookups (`findById`), then chain `map`, `filter`, `orElse`, `orElseGet`, `orElseThrow` or `ifPresent`. Bad usage: calling `get()` without checking, using `Optional` for fields, method parameters or collections (return an empty list instead), and `isPresent()` plus `get()` pairs that are just null checks in disguise.",
      example: `public Optional<User> findByEmail(String email) {
    return Optional.ofNullable(users.get(email));
}

String city = findByEmail("a@x.com")
        .map(User::getAddress)
        .map(Address::getCity)
        .orElse("Unknown");`,
      points: [
        'Use it as a return type, not for fields or parameters.',
        'Create with of, ofNullable, empty.',
        'Prefer map/orElse/orElseThrow over isPresent + get.',
        'Never return null from a method whose return type is Optional.',
      ],
      difficulty: 'Intermediate',
    },
    {
      id: 'java-8-q7',
      question: 'What are default methods in interfaces and why were they introduced?',
      answer: "A default method is a method in an interface that has a body, declared with the `default` keyword. Implementing classes inherit it automatically and may override it.\n\nThey were introduced in Java 8 mainly for backward compatibility: the JDK needed to add methods like `forEach()`, `stream()` and `removeIf()` to existing interfaces such as `Collection` without breaking the millions of classes that already implemented them. If a class implements two interfaces with the same default method, it must override it and can call a specific one with `InterfaceName.super.method()`.",
      points: [
        'Interface methods with a body, marked default.',
        'Allow adding methods to interfaces without breaking implementers.',
        'Diamond conflicts must be resolved by overriding.',
        'Static interface methods are called on the interface and are not inherited.',
      ],
      difficulty: 'Intermediate',
    },
    {
      id: 'java-8-q8',
      question: 'What are method references? Explain the four types.',
      answer: "A method reference is a compact form of a lambda that simply calls an existing method, written with `::`. The four types are: a static method (`Integer::parseInt`, same as `s -> Integer.parseInt(s)`), an instance method of a particular object (`System.out::println`), an instance method of an arbitrary object of a given type (`String::length`, same as `s -> s.length()`), and a constructor reference (`ArrayList::new`).\n\nThey improve readability when the lambda does nothing more than delegate to one method.",
      example: `Function<String, Integer> parse = Integer::parseInt;
Consumer<String> print = System.out::println;
Function<String, Integer> len = String::length;
Supplier<List<String>> make = ArrayList::new;`,
      points: [
        'Syntax: ClassOrObject::method.',
        'Static, bound instance, unbound instance, constructor.',
        'Equivalent to a lambda; choose whichever is clearer.',
      ],
      difficulty: 'Beginner',
    },
    {
      id: 'java-8-q9',
      question: 'What are records, and when should you not use them?',
      answer: "A record is a special kind of class for immutable data carriers. From a header like `record Money(BigDecimal amount, String currency) {}`, the compiler generates private final fields, a canonical constructor, accessor methods, and `equals()`, `hashCode()` and `toString()` based on all components. A compact constructor can validate input.\n\nRecords are great for DTOs, API payloads, value objects and composite map keys. Avoid them for JPA entities (JPA needs a no-arg constructor, mutable state and proxies), for classes that need inheritance (records are final and cannot extend a class), and for objects with mutable state. Note they are only shallowly immutable: a `List` component can still be modified unless you copy it with `List.copyOf`.",
      example: `public record Money(BigDecimal amount, String currency) {
    public Money {
        Objects.requireNonNull(amount);
        if (amount.signum() < 0) throw new IllegalArgumentException("negative");
    }
}`,
      points: [
        'Generated constructor, accessors, equals, hashCode, toString.',
        'Implicitly final; cannot extend classes but can implement interfaces.',
        'Not suitable for JPA entities.',
        'Shallow immutability: defensively copy mutable components.',
      ],
      difficulty: 'Advanced',
    },
    {
      id: 'java-8-q10',
      question: 'How would you find the second highest salary and group employees by department using streams?',
      answer: "For the second highest distinct salary, map to salaries, remove duplicates, sort in descending order, skip the first, and take the next with `findFirst()`, which returns an `Optional` because there might not be a second value.\n\nFor grouping, use `Collectors.groupingBy` with a classifier function (the department) and optionally a downstream collector such as `counting()`, `averagingDouble()` or `mapping()`. For the highest-paid employee per department, use `maxBy` as the downstream collector.",
      example: `Optional<Double> secondHighest = employees.stream()
        .map(Employee::salary)
        .distinct()
        .sorted(Comparator.reverseOrder())
        .skip(1)
        .findFirst();

Map<String, Long> countByDept = employees.stream()
        .collect(Collectors.groupingBy(Employee::dept, Collectors.counting()));

Map<String, Optional<Employee>> topPaidByDept = employees.stream()
        .collect(Collectors.groupingBy(Employee::dept,
                Collectors.maxBy(Comparator.comparingDouble(Employee::salary))));

Map<String, List<String>> namesByDept = employees.stream()
        .collect(Collectors.groupingBy(Employee::dept,
                Collectors.mapping(Employee::name, Collectors.toList())));`,
      points: [
        'distinct + sorted(reverseOrder) + skip(1) + findFirst for the Nth highest.',
        'groupingBy(classifier, downstream) for SQL-like aggregation.',
        'Downstream collectors: counting, averagingX, mapping, maxBy, summingX.',
      ],
      difficulty: 'Advanced',
    },
    {
      id: 'java-8-q11',
      question: 'When should you use parallel streams, and what are the risks?',
      answer: "A parallel stream splits its data into chunks, processes them on multiple threads of the common `ForkJoinPool`, and combines the results. It can speed up CPU-heavy work on large data sets that split easily, such as big arrays or `ArrayList`s.\n\nThe risks: for small data or cheap operations, the overhead of splitting and merging makes it slower. Shared mutable state (adding to an outside `ArrayList` in `forEach`) causes race conditions and wrong results. Blocking I/O inside a parallel stream can starve the common pool that other parts of the app also use, which matters in a web server. Order-dependent operations like `findFirst`, `limit` and `sorted` get more expensive. Always measure before using it.",
      example: `// Good fit: large, CPU-bound, stateless, easy to split
long primes = LongStream.rangeClosed(1, 5_000_000)
        .parallel()
        .filter(Main::isPrime)
        .count();

// Bug: ArrayList is not thread-safe
List<Integer> out = new ArrayList<>();
IntStream.range(0, 1000).parallel().forEach(out::add); // lost elements / exceptions`,
      points: [
        'Uses the shared ForkJoinPool.commonPool().',
        'Helps only for large, CPU-bound, stateless work.',
        'Never mutate shared state from a parallel stream.',
        'Avoid blocking I/O in parallel streams in server applications.',
      ],
      difficulty: 'Advanced',
    },
    {
      id: 'java-8-q12',
      question: 'What problems did the old Date and Calendar classes have, and how does java.time fix them?',
      answer: "`java.util.Date` and `Calendar` are mutable, so a date passed to another method could be changed unexpectedly, and they are not thread-safe; `SimpleDateFormat` in particular breaks when shared across threads. Their API was also confusing: months start at 0, `Date` mixes date and time, and time zone handling is awkward.\n\nThe `java.time` API (based on Joda-Time) has immutable, thread-safe classes with clear roles: `LocalDate`, `LocalTime`, `LocalDateTime` for date/time without a zone, `ZonedDateTime` and `OffsetDateTime` with a zone or offset, `Instant` for a machine timestamp, and `Period`/`Duration` for amounts of time. `DateTimeFormatter` is thread-safe and can be stored in a static constant. Months are 1 to 12, and every operation returns a new object.",
      example: `LocalDate start = LocalDate.of(2026, 1, 31);
LocalDate next = start.plusMonths(1);      // 2026-02-28, start unchanged
Period p = Period.between(start, LocalDate.of(2026, 12, 25)); // P10M25D
Instant now = Instant.now();               // UTC timestamp for storage`,
      points: [
        'Old API: mutable, not thread-safe, 0-based months.',
        'java.time: immutable, thread-safe, clear separation of concepts.',
        'Period for date amounts, Duration for time amounts.',
        'Use Instant or OffsetDateTime for storing timestamps in backends.',
      ],
      difficulty: 'Advanced',
    },
  ],
}

export default topic
