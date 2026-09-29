const topic = {
  id: 'java-generics',
  category: 'java',
  title: 'Generics',
  description: "Write type-safe, reusable classes and methods with type parameters, bounds, wildcards and an understanding of type erasure.",
  difficulty: 'Intermediate',
  overview: "Generics let you write a class or method once and use it with many types, while the compiler still checks that you use the right type. A `List<String>` can only hold strings; if you try to add an `Integer`, the code does not compile. Before generics (Java 5), collections held plain `Object`s and you had to cast everything, which caused `ClassCastException` at runtime.\n\nThink of a generic class like a labelled storage box. The box design is the same for every box, but the label (the type parameter, such as `<String>`) tells everyone what is allowed inside. The compiler reads the label and stops you from putting the wrong thing in.\n\nGenerics matter in interviews because they show up everywhere: collections, `Optional<T>`, `Stream<T>`, Spring's `ResponseEntity<T>` and `JpaRepository<T, ID>`. Interviewers love questions about wildcards (`? extends` vs `? super`), the PECS rule and type erasure, because they reveal whether you understand how Java really works under the hood.",
  subtopics: [
    {
      id: 'why-generics',
      title: 'Why Generics?',
      explanation: "Generics give you compile-time type safety and remove the need for manual casts. Without them, a collection returns `Object` and you must cast, and a wrong cast only fails at runtime.\n\nWith generics, type mistakes are caught by the compiler, which is much cheaper than finding them in production.",
      example: `// Without generics (raw, pre-Java 5 style)
List list = new ArrayList();
list.add("hello");
list.add(42);                      // compiles, nobody stops you
String s = (String) list.get(1);   // ClassCastException at runtime!

// With generics
List<String> names = new ArrayList<>();
names.add("hello");
// names.add(42);                  // compile error, caught early
String first = names.get(0);       // no cast needed`,
      interviewPoints: [
        'Generics move type errors from runtime to compile time',
        'They remove explicit casts and make code more readable',
        'Introduced in Java 5',
      ],
    },
    {
      id: 'generic-classes',
      title: 'Generic Classes',
      explanation: "A generic class declares one or more type parameters in angle brackets after its name, such as `class Box<T>`. Inside the class, `T` is used like a normal type. When you create an object you supply the real type, for example `new Box<String>()`.\n\nBy convention type parameters are single capital letters: `T` (type), `E` (element), `K` and `V` (key and value), `R` (return type). The diamond operator `<>` lets the compiler infer the type on the right-hand side.",
      example: `public class Box<T> {
    private T value;

    public void set(T value) { this.value = value; }
    public T get() { return value; }
}

public class Pair<K, V> {
    private final K key;
    private final V value;

    public Pair(K key, V value) {
        this.key = key;
        this.value = value;
    }
    public K getKey() { return key; }
    public V getValue() { return value; }
}

Box<String> box = new Box<>();     // diamond operator infers String
box.set("Java");
String v = box.get();

Pair<String, Integer> age = new Pair<>("Asha", 28);`,
      interviewPoints: [
        'Type parameters are declared after the class name: class Box<T>',
        'The diamond operator <> (Java 7) infers type arguments',
        'Common names: T, E, K, V, R',
      ],
    },
    {
      id: 'generic-methods',
      title: 'Generic Methods',
      explanation: "A generic method declares its own type parameter before the return type, like `public static <T> T first(List<T> list)`. The type is inferred from the arguments each time you call it, so the method works for any type without making the whole class generic.\n\nGeneric methods can be static or instance methods, and they can live in non-generic classes. `Collections.emptyList()` and `List.of()` are well-known examples.",
      example: `public class Utils {
    // <T> before the return type declares the method's type parameter
    public static <T> T firstOrNull(List<T> list) {
        return list.isEmpty() ? null : list.get(0);
    }

    public static <K, V> Map<V, K> invert(Map<K, V> map) {
        Map<V, K> result = new HashMap<>();
        map.forEach((k, v) -> result.put(v, k));
        return result;
    }
}

String s = Utils.firstOrNull(List.of("a", "b"));   // T inferred as String
Integer n = Utils.firstOrNull(List.of(1, 2, 3));   // T inferred as Integer
String none = Utils.<String>firstOrNull(new ArrayList<>()); // explicit type witness`,
      interviewPoints: [
        'The type parameter goes before the return type: <T> T method(...)',
        'Type is inferred from the arguments at each call site',
        'A generic method can exist in a non-generic class',
      ],
    },
    {
      id: 'bounded-types',
      title: 'Bounded Type Parameters',
      explanation: "A bound restricts which types can be used for a type parameter. `<T extends Number>` means T must be `Number` or a subclass, which also lets you call `Number` methods like `doubleValue()` on T.\n\nThe keyword is always `extends`, even for interfaces. You can combine bounds with `&`, for example `<T extends Number & Comparable<T>>`; the class (if any) must come first.",
      example: `public static <T extends Number> double sum(List<T> numbers) {
    double total = 0;
    for (T n : numbers) {
        total += n.doubleValue();   // allowed because T is a Number
    }
    return total;
}

// Multiple bounds: class first, then interfaces
public static <T extends Comparable<T>> T max(List<T> items) {
    T best = items.get(0);
    for (T item : items) {
        if (item.compareTo(best) > 0) best = item;
    }
    return best;
}

sum(List.of(1, 2, 3));          // 6.0
sum(List.of(1.5, 2.5));         // 4.0
// sum(List.of("a"));           // compile error: String is not a Number
max(List.of("pear", "apple"));  // "pear"`,
      interviewPoints: [
        'Upper bound: <T extends Type> — T must be Type or a subtype',
        'extends is used for both classes and interfaces in bounds',
        'Multiple bounds use &, and a class bound must come first',
      ],
    },
    {
      id: 'wildcards',
      title: 'Wildcards: ?, ? extends, ? super',
      explanation: "Generics are invariant: `List<Integer>` is NOT a subtype of `List<Number>`, even though `Integer` is a subtype of `Number`. Wildcards add flexibility.\n\n`List<?>` (unbounded) means a list of some unknown type; you can read elements as `Object` but cannot add anything except `null`. `List<? extends Number>` (upper bounded) accepts a list of `Number` or any subtype; you can read `Number`s but cannot add. `List<? super Integer>` (lower bounded) accepts a list of `Integer` or any supertype; you can add `Integer`s but reading only gives `Object`.",
      example: `// Unbounded: works for any list, read-only as Object
public static void printAll(List<?> list) {
    for (Object o : list) System.out.println(o);
}

// Upper bounded: read Numbers from any list of Number subtypes
public static double total(List<? extends Number> list) {
    double sum = 0;
    for (Number n : list) sum += n.doubleValue();
    // list.add(1);  // compile error: the real type might be List<Double>
    return sum;
}

// Lower bounded: safely add Integers
public static void addNumbers(List<? super Integer> list) {
    list.add(1);
    list.add(2);
    Object o = list.get(0);  // reading only gives Object
}

total(List.of(1, 2));          // List<Integer> accepted
total(List.of(1.5, 2.5));      // List<Double> accepted
addNumbers(new ArrayList<Number>());
addNumbers(new ArrayList<Object>());`,
      interviewPoints: [
        'Generics are invariant: List<Integer> is not a List<Number>',
        '? extends T: read as T, cannot add (except null)',
        '? super T: can add T, reading gives Object',
        '? alone means "some unknown type"',
      ],
    },
    {
      id: 'pecs',
      title: 'PECS: Producer Extends, Consumer Super',
      explanation: "PECS is a memory rule from the book Effective Java. If a parameter PRODUCES values that your method reads, use `? extends T`. If a parameter CONSUMES values that your method writes into it, use `? super T`. If it does both, use plain `T` with no wildcard.\n\n`Collections.copy(List<? super T> dest, List<? extends T> src)` is the classic example: the source produces elements and the destination consumes them.",
      example: `// src produces T values (we read), dest consumes them (we write)
public static <T> void copy(List<? super T> dest, List<? extends T> src) {
    for (T item : src) {
        dest.add(item);
    }
}

List<Integer> ints = List.of(1, 2, 3);
List<Number> numbers = new ArrayList<>();
List<Object> objects = new ArrayList<>();

copy(numbers, ints);   // T = Integer, Number is a super type
copy(objects, ints);   // Object is also a super type

// Same idea in the JDK:
// Collections.copy(List<? super T> dest, List<? extends T> src)
// Comparator<? super T> in List.sort and Collections.sort`,
      interviewPoints: [
        'Producer (you read from it) → ? extends',
        'Consumer (you write into it) → ? super',
        'Both read and write → no wildcard, use T',
        'Example: Collections.copy and Comparator<? super T>',
      ],
    },
    {
      id: 'generic-interfaces',
      title: 'Generic Interfaces',
      explanation: "Interfaces can be generic too, like `Comparable<T>`, `Comparator<T>`, `Function<T, R>` and Spring Data's `JpaRepository<T, ID>`. A class implementing the interface either fixes the type (`implements Comparable<Employee>`) or stays generic itself (`class Repo<T> implements Store<T>`).",
      example: `public interface Repository<T, ID> {
    void save(T entity);
    Optional<T> findById(ID id);
    List<T> findAll();
}

// Fixing the types
public class UserRepository implements Repository<User, Long> {
    private final Map<Long, User> store = new HashMap<>();

    public void save(User user) { store.put(user.getId(), user); }
    public Optional<User> findById(Long id) { return Optional.ofNullable(store.get(id)); }
    public List<User> findAll() { return new ArrayList<>(store.values()); }
}

// Keeping the class generic
public class InMemoryRepository<T, ID> implements Repository<T, ID> {
    // ...
}

// Spring Data uses exactly this idea:
// public interface UserRepo extends JpaRepository<User, Long> { }`,
      interviewPoints: [
        'Implementers can fix the type or remain generic',
        'Comparable<T>, Function<T, R> and JpaRepository<T, ID> are generic interfaces',
      ],
    },
    {
      id: 'type-erasure',
      title: 'Type Erasure',
      explanation: "Java generics exist only at compile time. After checking types, the compiler erases them: `List<String>` and `List<Integer>` both become plain `List` in bytecode, and `T` is replaced by its bound (or `Object` if unbounded). The compiler inserts casts where needed and may generate bridge methods to keep polymorphism working.\n\nErasure was chosen so that generic code stays compatible with old, pre-Java 5 code. The downside is that at runtime you cannot ask what `T` is.",
      example: `List<String> strings = new ArrayList<>();
List<Integer> ints = new ArrayList<>();

// Both have the same runtime class
System.out.println(strings.getClass() == ints.getClass());  // true

// What you write:
public class Box<T extends Number> {
    private T value;
    public T get() { return value; }
}

// Roughly what the bytecode looks like after erasure:
// public class Box {
//     private Number value;
//     public Number get() { return value; }
// }
// and callers get an inserted cast: Integer i = (Integer) box.get();`,
      interviewPoints: [
        'Generic type info is removed at compile time',
        'Unbounded T becomes Object; bounded T becomes its first bound',
        'Done for backward compatibility with pre-generics code',
        'The compiler inserts casts and bridge methods',
      ],
    },
    {
      id: 'raw-types',
      title: 'Raw Types',
      explanation: "A raw type is a generic type used without type arguments, like `List` instead of `List<String>`. Raw types exist only for backward compatibility. Using them switches off generic type checking, so the compiler gives an \"unchecked\" warning and you lose type safety.\n\n`List<Object>` is different from raw `List`: `List<Object>` is still type checked and you cannot pass a `List<String>` to it, while a raw `List` accepts anything with no checks.",
      example: `List raw = new ArrayList();          // raw type: warning
raw.add("text");
raw.add(10);                          // no check at all

List<String> strings = new ArrayList<>();
List unsafe = strings;               // allowed, with a warning
unsafe.add(99);                      // heap pollution!
String s = strings.get(0);           // ClassCastException here

// Prefer List<?> when you do not know the type
static int size(List<?> list) { return list.size(); }`,
      interviewPoints: [
        'Raw types disable generic type checking',
        'They exist only for compatibility with old code',
        'Use List<?> instead of a raw List when the type is unknown',
      ],
    },
    {
      id: 'limitations',
      title: 'Limitations of Generics',
      explanation: "Because of erasure and the way generics are designed, some things are not allowed. You cannot use primitives as type arguments (`List<int>` is illegal, use `List<Integer>`). You cannot write `new T()` or `new T[10]`. You cannot use `instanceof List<String>` (only `instanceof List<?>`). Static fields cannot use the class type parameter. You cannot create generic exception classes or overload methods that differ only by generic type.\n\nThe usual workaround for creating instances is to pass a `Class<T>` or a `Supplier<T>`.",
      example: `public class Factory<T> {
    // private static T instance;      // error: static cannot use T
    // T obj = new T();                 // error: cannot instantiate T
    // T[] arr = new T[10];             // error: generic array creation

    private final Supplier<T> supplier;

    public Factory(Supplier<T> supplier) { this.supplier = supplier; }

    public T create() { return supplier.get(); }  // workaround
}

Factory<StringBuilder> f = new Factory<>(StringBuilder::new);

Object obj = new ArrayList<String>();
// List<int> nums;                     // error: use List<Integer>
// if (obj instanceof List<String>)    // error
if (obj instanceof List<?> list) { /* fine */ }

// These two do not compile together: same erasure
// void process(List<String> a) { }
// void process(List<Integer> a) { }`,
      interviewPoints: [
        'No primitives as type arguments — use wrapper classes',
        'No new T(), new T[], or instanceof with a concrete type argument',
        'No static fields of type T; no generic exception classes',
        'Pass Class<T> or Supplier<T> to create instances',
      ],
    },
  ],
  commonMistakes: [
    "Using raw types like `List` instead of `List<String>`, which silently disables type checking.",
    "Assuming `List<Integer>` can be passed where `List<Number>` is expected; generics are invariant, so use `List<? extends Number>`.",
    "Trying to add elements to a `List<? extends T>` and being confused by the compile error.",
    "Writing `List<int>`; primitives are not allowed as type arguments, use `Integer`.",
    "Expecting to read the type argument at runtime with `T.class` or `instanceof List<String>`, which erasure makes impossible.",
  ],
  interviewTips: [
    "Explain PECS with the `Collections.copy(dest, src)` signature; it is the quickest way to show you understand wildcards.",
    "When asked about type erasure, mention the reason (backward compatibility) and a consequence (no `new T()`, same runtime class for all `List<X>`).",
    "Connect generics to real code you use: `ResponseEntity<T>`, `Optional<T>`, `JpaRepository<User, Long>`.",
    "Always contrast `List<Object>`, `List<?>` and raw `List`; interviewers like this distinction.",
  ],
  interviewQuestions: [
    {
      id: 'java-generics-q1',
      question: 'What are generics in Java and why were they introduced?',
      answer: "Generics let classes, interfaces and methods take type parameters, like `List<String>` or `Map<Long, User>`. They were introduced in Java 5 to provide compile-time type safety and to remove manual casts.\n\nBefore generics, collections stored `Object`, so a wrong type was only discovered at runtime as a `ClassCastException`. With generics the compiler rejects the wrong type immediately.",
      example: `List<String> names = new ArrayList<>();
names.add("Ravi");
// names.add(5);          // compile error
String n = names.get(0);  // no cast`,
      points: ['Compile-time type safety', 'No explicit casts', 'Code reuse across types', 'Added in Java 5'],
      difficulty: 'Beginner',
    },
    {
      id: 'java-generics-q2',
      question: 'What is the diamond operator?',
      answer: "The diamond operator `<>` (Java 7) lets you skip repeating type arguments on the right-hand side of a declaration. The compiler infers them from the left-hand side, so `Map<String, List<Integer>> m = new HashMap<>();` is the same as writing the full types twice. It keeps code shorter without losing type safety.",
      example: `Map<String, List<Integer>> scores = new HashMap<>();  // inferred`,
      points: ['Introduced in Java 7', 'Type arguments are inferred from the target type', 'Not the same as a raw type'],
      difficulty: 'Beginner',
    },
    {
      id: 'java-generics-q3',
      question: 'What is the difference between a generic class and a generic method?',
      answer: "A generic class declares its type parameter on the class (`class Box<T>`), and that type is fixed for the whole object when it is created. A generic method declares its own type parameter before the return type (`<T> T first(List<T> list)`), and the type is inferred separately at each call. Generic methods can live inside normal, non-generic classes and can be static.",
      example: `class Box<T> { T value; }                       // generic class

class Utils {
    static <T> T first(List<T> list) {            // generic method
        return list.get(0);
    }
}`,
      points: ['Class type parameter: fixed per instance', 'Method type parameter: inferred per call', 'Generic methods can be static'],
      difficulty: 'Beginner',
    },
    {
      id: 'java-generics-q4',
      question: 'What are bounded type parameters?',
      answer: "A bounded type parameter limits which types can be used. `<T extends Number>` means T must be `Number` or a subclass. This also lets you call methods of the bound, such as `doubleValue()`, on values of type T.\n\nYou use `extends` for both classes and interfaces, and you can combine bounds with `&`, like `<T extends Number & Comparable<T>>`.",
      example: `static <T extends Comparable<T>> T max(T a, T b) {
    return a.compareTo(b) >= 0 ? a : b;
}`,
      points: ['extends keyword for classes and interfaces', 'Lets you call methods of the bound', 'Multiple bounds with &, class first'],
      difficulty: 'Intermediate',
    },
    {
      id: 'java-generics-q5',
      question: 'Explain ? extends and ? super wildcards and the PECS rule.',
      answer: "`? extends T` means \"T or any subtype\". You can safely read elements as T, but you cannot add (the exact type is unknown). `? super T` means \"T or any supertype\". You can safely add T values, but reading only gives `Object`.\n\nPECS means Producer Extends, Consumer Super: if a collection produces values you read, use `extends`; if it consumes values you write, use `super`. `Collections.copy(List<? super T> dest, List<? extends T> src)` follows this rule.",
      example: `static <T> void copy(List<? super T> dest, List<? extends T> src) {
    for (T t : src) dest.add(t);
}`,
      points: ['extends = read (producer)', 'super = write (consumer)', 'Both = use plain T', 'Increases API flexibility'],
      difficulty: 'Intermediate',
    },
    {
      id: 'java-generics-q6',
      question: 'Why is List<Integer> not a subtype of List<Number>?',
      answer: "Generics are invariant for type safety. If `List<Integer>` were a `List<Number>`, you could add a `Double` to it through the `List<Number>` reference, and code reading it as `Integer` would crash. Arrays are covariant (`Integer[]` is a `Number[]`), which is why arrays can throw `ArrayStoreException` at runtime. To accept lists of any Number subtype, use `List<? extends Number>`.",
      example: `List<Integer> ints = new ArrayList<>();
// List<Number> nums = ints;          // compile error
List<? extends Number> ok = ints;    // fine, read-only view

Number[] arr = new Integer[1];
arr[0] = 1.5;                         // ArrayStoreException at runtime`,
      points: ['Generics are invariant, arrays are covariant', 'Invariance prevents inserting the wrong type', 'Use ? extends for flexibility'],
      difficulty: 'Intermediate',
    },
    {
      id: 'java-generics-q7',
      question: 'What is type erasure and what are its consequences?',
      answer: "Type erasure means the compiler removes generic type information after type checking. `T` becomes its bound (or `Object`), `List<String>` becomes `List`, and the compiler adds casts and bridge methods. This kept bytecode compatible with pre-Java 5 code.\n\nConsequences: you cannot do `new T()`, `new T[]`, or `instanceof List<String>`; all `List<X>` share one runtime class; you cannot overload methods that differ only by type argument; and you cannot use primitives as type arguments.",
      example: `System.out.println(new ArrayList<String>().getClass()
        == new ArrayList<Integer>().getClass()); // true`,
      points: ['Generics are compile-time only', 'Done for backward compatibility', 'No runtime access to T', 'Bridge methods preserve polymorphism'],
      difficulty: 'Advanced',
    },
    {
      id: 'java-generics-q8',
      question: 'How can you create an instance of T or read the generic type at runtime despite type erasure?',
      answer: "Since `new T()` is illegal, pass a `Class<T>` (then call `clazz.getDeclaredConstructor().newInstance()`) or a `Supplier<T>` (like `ArrayList::new`) into the constructor or method.\n\nTo read type arguments at runtime, frameworks use the fact that erasure does not remove generic info from class declarations: a subclass like `class UserRepo extends BaseRepo<User>` keeps `BaseRepo<User>` in its metadata, readable via `getGenericSuperclass()`. Jackson's `TypeReference` and Spring's `ParameterizedTypeReference` use this \"super type token\" trick.",
      example: `abstract class TypeRef<T> {
    final Type type;
    protected TypeRef() {
        ParameterizedType p = (ParameterizedType) getClass().getGenericSuperclass();
        this.type = p.getActualTypeArguments()[0];
    }
}

Type t = new TypeRef<List<String>>() {}.type;  // java.util.List<java.lang.String>

// Jackson:
List<User> users = mapper.readValue(json, new TypeReference<List<User>>() {});`,
      points: ['Pass Class<T> or Supplier<T> to create instances', 'Generic superclass info survives erasure', 'Super type token: anonymous subclass trick', 'Used by Jackson TypeReference and Spring ParameterizedTypeReference'],
      difficulty: 'Advanced',
    },
    {
      id: 'java-generics-q9',
      question: 'What is the difference between List<Object>, List<?> and a raw List?',
      answer: "`List<Object>` is a type-checked list that can hold any object, but you cannot assign a `List<String>` to it. `List<?>` is a list of some unknown type; you can assign any list to it and read `Object`s, but you cannot add anything except `null`. A raw `List` switches off generic checking entirely, so you can add anything and assign anything, with only unchecked warnings.\n\nUse `List<?>` when you just need to read from any list; avoid raw types.",
      example: `List<String> s = new ArrayList<>();
// List<Object> a = s;   // error
List<?> b = s;           // ok, cannot add
List c = s;              // ok, unsafe, warning
c.add(1);                // heap pollution`,
      points: ['List<Object>: checked, accepts only List<Object>', 'List<?>: any list, read-only', 'Raw List: no checking, avoid'],
      difficulty: 'Advanced',
    },
  ],
}

export default topic
