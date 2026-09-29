const topic = {
  id: 'java-immutability',
  category: 'java',
  title: 'Immutability & Object Cloning',
  description: "Design immutable classes, use defensive copies, records and immutable collections, and understand clone(), shallow vs deep copy and copy constructors.",
  difficulty: 'Intermediate',
  overview: "An immutable object is an object whose state cannot change after it is created. `String`, `Integer`, `LocalDate` and `BigDecimal` are all immutable: methods like `toUpperCase()` or `plusDays()` do not modify the object, they return a new one.\n\nThink of an immutable object like a printed receipt. Once it is printed, nobody can change the amount on it; if something needs to change, you print a new receipt. A mutable object is like a whiteboard that anyone can wipe and rewrite at any moment, which is convenient but makes it hard to trust what is written, especially when many people (threads) share it.\n\nImmutability makes code safer and simpler: immutable objects are automatically thread safe, can be shared and cached freely, and make reliable `HashMap` keys. This topic also covers copying objects, because when you work with mutable objects you often need a copy, and the difference between shallow and deep copies, `clone()` and copy constructors is a favourite interview question.",
  subtopics: [
    {
      id: 'immutable-class-rules',
      title: 'Rules to Create an Immutable Class',
      explanation: "Follow these rules: 1) declare the class `final` so no subclass can add mutable behaviour; 2) make all fields `private final`; 3) set every field in the constructor; 4) provide no setters or other methods that change state; 5) for mutable fields (like `List` or `Date`), make a defensive copy when receiving them in the constructor and when returning them from getters. \"Changing\" methods return a new object instead (often named `withX`).",
      example: `public final class Money {                      // 1. final class
    private final String currency;             // 2. private final fields
    private final BigDecimal amount;

    public Money(String currency, BigDecimal amount) {  // 3. set everything here
        this.currency = Objects.requireNonNull(currency);
        this.amount = Objects.requireNonNull(amount);
    }

    public String getCurrency() { return currency; }    // 4. getters only
    public BigDecimal getAmount() { return amount; }    // BigDecimal is immutable

    public Money add(Money other) {                     // returns a NEW object
        if (!currency.equals(other.currency)) {
            throw new IllegalArgumentException("Currency mismatch");
        }
        return new Money(currency, amount.add(other.amount));
    }

    @Override
    public boolean equals(Object o) {
        return o instanceof Money m && currency.equals(m.currency) && amount.equals(m.amount);
    }

    @Override
    public int hashCode() { return Objects.hash(currency, amount); }
}`,
      interviewPoints: [
        'final class, private final fields, no setters',
        'Initialize all state in the constructor',
        'Defensive copies for mutable fields',
        'Modifier methods return new instances',
      ],
    },
    {
      id: 'final-fields',
      title: 'final Fields vs Immutability',
      explanation: "A `final` field can be assigned only once, but that does not make the object it points to immutable. `final List<String> names` means the reference cannot be changed to another list, yet you can still call `names.add(...)`. So `final` protects the reference, not the contents.\n\n`final` fields also have a memory-model benefit: once the constructor finishes, other threads are guaranteed to see the correctly initialized values of final fields without synchronization.",
      example: `public class Team {
    private final List<String> members = new ArrayList<>();

    public void demo() {
        members.add("Asha");          // allowed: the list itself is mutable
        // members = new ArrayList<>(); // compile error: reference is final
    }
}

final StringBuilder sb = new StringBuilder("a");
sb.append("b");                        // still mutable
System.out.println(sb);                // ab`,
      interviewPoints: [
        'final = the reference cannot be reassigned',
        'The referenced object may still be mutable',
        'final fields get safe publication guarantees in the Java Memory Model',
      ],
    },
    {
      id: 'defensive-copies',
      title: 'Defensive Copies',
      explanation: "If an immutable class stores a mutable object passed in by the caller, the caller can keep a reference and change it later, breaking immutability. The fix is a defensive copy: copy the incoming object in the constructor, and return a copy (or an unmodifiable view) from getters.\n\nCopy first, then validate the copy, so a malicious caller cannot change the value between your check and your copy.",
      example: `public final class Course {
    private final String name;
    private final List<String> students;
    private final Date startDate;              // Date is mutable (prefer LocalDate)

    public Course(String name, List<String> students, Date startDate) {
        this.name = name;
        this.students = List.copyOf(students);          // copy in (also rejects nulls)
        this.startDate = new Date(startDate.getTime()); // copy in
    }

    public List<String> getStudents() {
        return students;                    // List.copyOf is already unmodifiable
    }

    public Date getStartDate() {
        return new Date(startDate.getTime()); // copy out
    }
}

List<String> list = new ArrayList<>(List.of("Asha"));
Course c = new Course("Java", list, new Date());
list.add("Hacker");                         // does not affect c
// c.getStudents().add("x");                // UnsupportedOperationException`,
      interviewPoints: [
        'Copy mutable inputs in the constructor',
        'Return copies or unmodifiable views from getters',
        'Copy before validating to avoid time-of-check/time-of-use issues',
        'Prefer immutable types like LocalDate over Date',
      ],
    },
    {
      id: 'immutable-collections',
      title: 'Immutable Collections',
      explanation: "`List.of()`, `Set.of()`, `Map.of()` (Java 9) and `List.copyOf()` (Java 10) create truly unmodifiable collections: any `add`, `remove` or `set` throws `UnsupportedOperationException`, and they do not allow `null` elements. `Stream.toList()` (Java 16) also returns an unmodifiable list.\n\n`Collections.unmodifiableList(list)` is different: it is a read-only VIEW of another list. You cannot modify it through the view, but if the original list changes, the view shows the change.",
      example: `List<String> fixed = List.of("a", "b");
// fixed.add("c");                       // UnsupportedOperationException
// List.of("a", null);                   // NullPointerException

List<String> original = new ArrayList<>(List.of("x"));
List<String> view = Collections.unmodifiableList(original);
List<String> copy = List.copyOf(original);

original.add("y");
System.out.println(view);   // [x, y]  view reflects the change
System.out.println(copy);   // [x]     true independent copy

Map<String, Integer> ages = Map.of("Asha", 28, "Ravi", 31);`,
      interviewPoints: [
        'List.of / Set.of / Map.of: unmodifiable, no nulls',
        'List.copyOf: independent unmodifiable copy',
        'Collections.unmodifiableList: read-only view of a mutable list',
        'Unmodifiable collections of mutable objects are only shallowly immutable',
      ],
    },
    {
      id: 'string-immutability',
      title: 'Why String Is Immutable',
      explanation: "`String` is immutable for several reasons. The String Pool: literals are shared, so if one reference could change \"hello\", every other user of that literal would see the change. Security: strings are used for file paths, URLs, class names and database credentials, and they must not change after being validated. Thread safety: strings can be shared between threads without locks. Hash caching: `String` caches its `hashCode`, which makes it a fast and reliable `HashMap` key.\n\nThe `String` class is `final` and its internal array is private and never exposed, so the guarantee cannot be broken by normal code.",
      example: `String a = "hello";
String b = "hello";          // same pooled object as a
String c = a.toUpperCase();  // returns a new String

System.out.println(a);       // hello (unchanged)
System.out.println(c);       // HELLO
System.out.println(a == b);  // true, safe to share because it cannot change

// For many modifications use a mutable builder
StringBuilder sb = new StringBuilder();
for (int i = 0; i < 3; i++) sb.append(i);
String result = sb.toString(); // "012"`,
      interviewPoints: [
        'Enables the String Pool (safe sharing of literals)',
        'Security for paths, URLs, credentials, class loading',
        'Thread safe without synchronization',
        'hashCode is cached, great for HashMap keys',
      ],
    },
    {
      id: 'records',
      title: 'Records as Immutable Data Carriers',
      explanation: "A record (Java 16+) is a compact way to declare an immutable data class. `record Point(int x, int y) {}` automatically gets `private final` fields, a canonical constructor, accessor methods `x()` and `y()`, and `equals`, `hashCode` and `toString`. Records are implicitly `final` and have no setters.\n\nRecords are shallowly immutable: if a component is a mutable `List`, you still need a defensive copy in a compact constructor. They are ideal for DTOs, API request/response bodies and value objects.",
      example: `public record Point(int x, int y) { }

Point p = new Point(1, 2);
System.out.println(p.x());          // 1
System.out.println(p);              // Point[x=1, y=2]
Point moved = new Point(p.x() + 1, p.y()); // create a new one to "change"

public record Order(String id, List<String> items) {
    public Order {                               // compact constructor
        Objects.requireNonNull(id);
        items = List.copyOf(items);              // defensive copy
    }
}

// Great as Spring DTOs
public record CreateUserRequest(@NotBlank String name, @Email String email) { }`,
      interviewPoints: [
        'Records generate final fields, accessors, equals, hashCode, toString',
        'Implicitly final; cannot extend other classes',
        'Shallowly immutable: copy mutable components',
        'Compact constructors for validation',
      ],
    },
    {
      id: 'benefits',
      title: 'Benefits: Thread Safety, Caching and Hash Keys',
      explanation: "Immutable objects are thread safe by design: no thread can modify them, so there are no race conditions and no locks are needed. They can be cached and reused freely, like `Integer.valueOf()` caching values from -128 to 127. They make safe `HashMap` keys and `HashSet` elements, because their `hashCode` never changes after insertion. They are also easier to reason about, test and share, and they fail atomically: an operation either creates a valid new object or fails, never leaving a half-changed one.\n\nThe cost is creating new objects for every change, which is usually cheap, but for heavy modification use a mutable builder (like `StringBuilder`).",
      example: `// Mutable key: a classic bug
class MutableKey {
    int id;
    MutableKey(int id) { this.id = id; }
    @Override public int hashCode() { return id; }
    @Override public boolean equals(Object o) { return o instanceof MutableKey k && k.id == id; }
}

Map<MutableKey, String> map = new HashMap<>();
MutableKey key = new MutableKey(1);
map.put(key, "value");
key.id = 2;                                   // hashCode changed!
System.out.println(map.get(key));             // null: entry is "lost"

// Immutable key: always safe
record Key(int id) { }
Map<Key, String> safe = new HashMap<>();
safe.put(new Key(1), "value");
System.out.println(safe.get(new Key(1)));     // value`,
      interviewPoints: [
        'Thread safe without synchronization',
        'Safe to cache and share',
        'Reliable HashMap keys (hashCode never changes)',
        'Downside: more objects; use builders for heavy changes',
      ],
    },
    {
      id: 'clone-cloneable',
      title: 'clone() and Cloneable',
      explanation: "`Object.clone()` creates a field-by-field copy of an object. It is `protected` and only works if the class implements the marker interface `Cloneable`; otherwise it throws `CloneNotSupportedException`. To make cloning public, override `clone()`, make it `public`, call `super.clone()` and return your own type (covariant return type).\n\n`clone()` does not call any constructor, returns a shallow copy by default, and does not work with `final` fields that need deep copying. Because of these problems, Effective Java recommends copy constructors or static factory methods instead. Arrays are the main exception: `array.clone()` is fine and commonly used.",
      example: `public class Employee implements Cloneable {
    private String name;
    private int age;

    public Employee(String name, int age) { this.name = name; this.age = age; }

    @Override
    public Employee clone() {                 // public + covariant return type
        try {
            return (Employee) super.clone();  // field-by-field copy
        } catch (CloneNotSupportedException e) {
            throw new AssertionError("Cannot happen, we implement Cloneable", e);
        }
    }
}

Employee a = new Employee("Asha", 28);
Employee b = a.clone();
System.out.println(a == b);   // false: different objects

int[] nums = {1, 2, 3};
int[] copy = nums.clone();    // arrays: clone works well`,
      interviewPoints: [
        'Cloneable is a marker interface; without it clone() throws CloneNotSupportedException',
        'Object.clone() is protected and makes a shallow copy',
        'No constructor is called during clone()',
        'Prefer copy constructors; array.clone() is fine',
      ],
    },
    {
      id: 'shallow-vs-deep-copy',
      title: 'Shallow Copy vs Deep Copy',
      explanation: "A shallow copy copies the fields of the object, but for reference fields it copies only the reference, so the original and the copy share the same inner objects. Changing a shared inner object through one is visible through the other.\n\nA deep copy also copies the objects referenced by the fields (recursively), so the copy is completely independent. Immutable inner objects like `String` do not need to be copied, since nobody can change them.",
      example: `public class Address {
    String city;
    Address(String city) { this.city = city; }
    Address(Address other) { this.city = other.city; }   // copy constructor
}

public class Person implements Cloneable {
    String name;
    Address address;

    Person(String name, Address address) { this.name = name; this.address = address; }

    // Shallow: the Address object is shared
    @Override
    public Person clone() throws CloneNotSupportedException {
        return (Person) super.clone();
    }

    // Deep: copy the Address too
    public Person deepCopy() {
        return new Person(name, new Address(address));
    }
}

Person p1 = new Person("Asha", new Address("Pune"));
Person shallow = p1.clone();
Person deep = p1.deepCopy();

p1.address.city = "Delhi";
System.out.println(shallow.address.city);  // Delhi (shared!)
System.out.println(deep.address.city);     // Pune  (independent)`,
      interviewPoints: [
        'Shallow copy shares referenced objects',
        'Deep copy duplicates referenced mutable objects recursively',
        'Immutable fields can be shared safely',
        'Deep copy can also be done via serialization or libraries, at a cost',
      ],
    },
    {
      id: 'copy-constructors',
      title: 'Copy Constructors and Factory Methods',
      explanation: "A copy constructor takes an object of the same class and builds a new one from it: `new Person(otherPerson)`. A static copy factory does the same: `Person.copyOf(other)`. They are the preferred alternative to `clone()` because they are explicit, do not need `Cloneable` or casts, do not throw checked exceptions, work with `final` fields, and let you choose exactly how deep to copy.\n\nThe JDK uses this style too: `new ArrayList<>(otherList)`, `new HashMap<>(otherMap)`, `List.copyOf(list)`.",
      example: `public class Person {
    private final String name;
    private final Address address;
    private final List<String> skills;

    public Person(String name, Address address, List<String> skills) {
        this.name = name;
        this.address = address;
        this.skills = new ArrayList<>(skills);
    }

    // Copy constructor: deep copy of mutable parts
    public Person(Person other) {
        this.name = other.name;                       // String is immutable
        this.address = new Address(other.address);    // copy mutable object
        this.skills = new ArrayList<>(other.skills);  // copy the list
    }

    // Static factory alternative
    public static Person copyOf(Person other) {
        return new Person(other);
    }
}

List<String> copy = new ArrayList<>(originalList);  // JDK copy constructor`,
      interviewPoints: [
        'Copy constructors are explicit and type safe',
        'No Cloneable, no casts, no checked exceptions',
        'Work with final fields',
        'JDK collections provide copy constructors',
      ],
    },
  ],
  commonMistakes: [
    "Thinking `final` makes an object immutable; a `final List` can still have elements added.",
    "Returning an internal mutable `List` or `Date` directly from a getter, letting callers modify the \"immutable\" object.",
    "Forgetting to make the class `final`, so a subclass can override methods and expose mutable state.",
    "Using `clone()` and assuming it makes a deep copy; by default it is shallow and shares inner objects.",
    "Using mutable objects as `HashMap` keys and changing them after insertion, which makes entries impossible to find.",
    "Confusing `Collections.unmodifiableList()` (a view that reflects changes) with `List.copyOf()` (an independent copy).",
  ],
  interviewTips: [
    "When asked to create an immutable class, list the rules in order: final class, private final fields, constructor initialization, no setters, defensive copies.",
    "Mention records as the modern way to write immutable data classes, and that they are only shallowly immutable.",
    "For String immutability, give at least three reasons: string pool, security, thread safety and hash caching.",
    "Explain why copy constructors are preferred over `clone()`, citing Effective Java, and draw the shallow vs deep copy difference with a nested object.",
  ],
  interviewQuestions: [
    {
      id: 'java-immutability-q1',
      question: 'What is an immutable object? Give examples from the JDK.',
      answer: "An immutable object is one whose state cannot change after construction. Any operation that seems to change it returns a new object instead. JDK examples include `String`, all wrapper classes (`Integer`, `Long`, ...), `BigDecimal`, `BigInteger`, `LocalDate`/`LocalDateTime` and other java.time classes, `UUID`, and collections created with `List.of()`.",
      example: `LocalDate d = LocalDate.of(2024, 1, 1);
LocalDate next = d.plusDays(1);   // d is unchanged`,
      points: ['State fixed after construction', 'Changes produce new objects', 'String, wrappers, BigDecimal, java.time'],
      difficulty: 'Beginner',
    },
    {
      id: 'java-immutability-q2',
      question: 'Why is String immutable in Java?',
      answer: "String is immutable so that string literals can be safely shared in the String Pool, saving memory. It is also important for security, because strings hold file paths, URLs, class names and credentials that must not change after validation. Immutability makes strings thread safe without locking, and allows caching of the hash code, making strings fast and reliable `HashMap` keys.",
      points: ['String Pool sharing', 'Security', 'Thread safety', 'Cached hashCode'],
      difficulty: 'Beginner',
    },
    {
      id: 'java-immutability-q3',
      question: 'What is the difference between final and immutable?',
      answer: "`final` on a variable or field means the reference cannot be reassigned after initialization. Immutable means the object's state cannot change. A `final List<String>` cannot point to a different list, but you can still add elements to it. An immutable object stays the same no matter how many references point to it; you usually build immutability with final fields plus no mutators plus defensive copies.",
      example: `final List<String> list = new ArrayList<>();
list.add("ok");            // allowed
// list = new ArrayList<>();  // not allowed`,
      points: ['final: the reference is fixed', 'Immutable: the state is fixed', 'final alone does not guarantee immutability'],
      difficulty: 'Beginner',
    },
    {
      id: 'java-immutability-q4',
      question: 'How do you create an immutable class in Java?',
      answer: "Declare the class `final`; make all fields `private final`; initialize them in the constructor; provide no setters; for mutable fields, copy them in the constructor and return copies or unmodifiable views in getters; and have \"modifying\" methods return new instances. Also avoid leaking `this` during construction. For simple data holders, a record gives most of this automatically.",
      example: `public final class Employee {
    private final String name;
    private final List<String> skills;

    public Employee(String name, List<String> skills) {
        this.name = name;
        this.skills = List.copyOf(skills);
    }
    public String getName() { return name; }
    public List<String> getSkills() { return skills; }
    public Employee withName(String newName) { return new Employee(newName, skills); }
}`,
      points: ['final class', 'private final fields, no setters', 'Defensive copies', 'Return new objects for changes'],
      difficulty: 'Intermediate',
    },
    {
      id: 'java-immutability-q5',
      question: 'What is the difference between a shallow copy and a deep copy?',
      answer: "A shallow copy creates a new object and copies field values as-is, so reference fields point to the same inner objects as the original; changes to shared inner objects are visible in both. A deep copy creates new copies of the referenced mutable objects as well (recursively), so the copy is fully independent. `Object.clone()` is shallow by default; deep copies are usually written with copy constructors.",
      example: `Person shallow = original.clone();                 // shares address
Person deep = new Person(original.name, new Address(original.address)); // independent`,
      points: ['Shallow: shares inner objects', 'Deep: copies inner mutable objects', 'clone() is shallow by default', 'Immutable fields need no copying'],
      difficulty: 'Intermediate',
    },
    {
      id: 'java-immutability-q6',
      question: 'What is the difference between Collections.unmodifiableList() and List.copyOf()?',
      answer: "`Collections.unmodifiableList(list)` returns a read-only view wrapping the original list: you cannot modify it through the view, but changes to the original list are visible through it. `List.copyOf(list)` creates a new unmodifiable list that is independent of the original, and it rejects `null` elements. For immutable classes, `List.copyOf` is the safer choice.",
      example: `List<String> src = new ArrayList<>(List.of("a"));
List<String> view = Collections.unmodifiableList(src);
List<String> copy = List.copyOf(src);
src.add("b");
// view -> [a, b], copy -> [a]`,
      points: ['unmodifiableList is a view', 'copyOf is an independent copy', 'copyOf rejects nulls', 'Both throw UnsupportedOperationException on modification'],
      difficulty: 'Intermediate',
    },
    {
      id: 'java-immutability-q7',
      question: 'Why are immutable objects thread safe, and why are they good HashMap keys?',
      answer: "Threads cause bugs when one thread modifies shared state while another reads it. Immutable objects cannot be modified, so there is nothing to race on and no locks are needed; with final fields, the Java Memory Model also guarantees other threads see the fully constructed state. As `HashMap` keys, their `hashCode` and `equals` results never change after insertion, so the entry always stays in the right bucket. A mutable key changed after `put` can make the entry unreachable.",
      points: ['No shared mutable state, no races', 'final fields give safe publication', 'Stable hashCode for hash-based collections', 'Mutable keys can get lost in HashMap'],
      difficulty: 'Advanced',
    },
    {
      id: 'java-immutability-q8',
      question: 'Why is clone() considered broken, and what should you use instead?',
      answer: "`Cloneable` has no `clone()` method, so the interface does not describe what it enables; `Object.clone()` is protected, needs casts, throws the checked `CloneNotSupportedException`, creates objects without calling constructors (bypassing validation), produces shallow copies, and cannot reassign `final` fields during a deep copy. Subclasses must also cooperate correctly. Effective Java recommends a copy constructor (`new Person(other)`) or a static copy factory (`Person.copyOf(other)`) instead; the exception is arrays, where `array.clone()` is fine.",
      example: `public Person(Person other) {
    this.name = other.name;
    this.address = new Address(other.address);
}`,
      points: ['Cloneable is a marker without clone()', 'No constructor call, shallow by default', 'Conflicts with final fields', 'Prefer copy constructors or factories'],
      difficulty: 'Advanced',
    },
    {
      id: 'java-immutability-q9',
      question: 'Are records fully immutable?',
      answer: "Records are shallowly immutable. Their fields are `private final` and there are no setters, but if a component is a mutable type such as `List` or an array, the contents can still be changed by whoever holds a reference. To make a record effectively immutable, make defensive copies in the compact constructor (for example `items = List.copyOf(items);`) and avoid exposing mutable arrays.",
      example: `public record Cart(List<String> items) {
    public Cart {
        items = List.copyOf(items);
    }
}`,
      points: ['Fields are final, no setters', 'Mutable components can still change', 'Copy in the compact constructor'],
      difficulty: 'Advanced',
    },
  ],
}

export default topic
