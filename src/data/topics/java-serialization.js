const topic = {
  id: 'java-serialization',
  category: 'java',
  title: 'Serialization',
  description: "Convert Java objects to bytes and back with Serializable, serialVersionUID, transient and Externalizable, and learn why JSON with Jackson is the modern choice.",
  difficulty: 'Intermediate',
  overview: "Serialization means turning an object in memory into a stream of bytes so it can be saved to a file, sent over a network or put into a cache. Deserialization is the reverse: reading those bytes and rebuilding an equivalent object.\n\nA good analogy is packing furniture for moving house. Serialization is taking the furniture apart and packing it flat into a box with instructions; deserialization is unpacking the box at the new house and assembling the same furniture again. Java's built-in mechanism does this with `Serializable`, `ObjectOutputStream` and `ObjectInputStream`.\n\nIn modern backend work, built-in Java serialization is rarely used for new code because it is fragile and has serious security risks. REST APIs, Kafka messages and Redis caches usually use JSON (with Jackson) or other formats like Protobuf. Interviews still ask about `Serializable`, `serialVersionUID`, `transient` and the security problems, because they reveal how well you understand object lifecycles and safe design.",
  subtopics: [
    {
      id: 'what-is-serialization',
      title: 'Serialization and Deserialization',
      explanation: "Serialization converts an object's state (its field values, plus the objects it references) into bytes. Deserialization reads those bytes and creates a new object with the same state. The whole object graph is written: if a `User` has an `Address`, the address is serialized too, and shared references and cycles are handled correctly.\n\nUses include saving objects to disk, sending them between JVMs (old RMI), HTTP session replication and caching.",
      example: `User user = new User("Asha", 28);

// Serialization: object -> bytes
byte[] bytes;
try (ByteArrayOutputStream bos = new ByteArrayOutputStream();
     ObjectOutputStream out = new ObjectOutputStream(bos)) {
    out.writeObject(user);
    out.flush();
    bytes = bos.toByteArray();
}

// Deserialization: bytes -> new object
try (ObjectInputStream in = new ObjectInputStream(new ByteArrayInputStream(bytes))) {
    User copy = (User) in.readObject();
    System.out.println(copy.getName());   // Asha
    System.out.println(copy == user);     // false: a new object
}`,
      interviewPoints: [
        'Serialization: object state to bytes; deserialization: bytes to object',
        'The whole reachable object graph is serialized',
        'Deserialized object is a new instance, not the original',
      ],
    },
    {
      id: 'serializable-interface',
      title: 'The Serializable Interface',
      explanation: "A class opts in to Java serialization by implementing `java.io.Serializable`. It is a marker interface: it has no methods, it just tells the JVM \"this class may be serialized\". If you try to serialize an object whose class (or any non-transient field's class) is not serializable, you get a `NotSerializableException`.\n\nMost JDK types such as `String`, wrapper classes, `ArrayList` and `HashMap` already implement it.",
      example: `public class Address implements Serializable {
    private String city;
    public Address(String city) { this.city = city; }
}

public class User implements Serializable {
    private static final long serialVersionUID = 1L;

    private String name;
    private int age;
    private Address address;        // must also be Serializable
    private List<String> tags = new ArrayList<>();  // ArrayList is Serializable

    public User(String name, int age) { this.name = name; this.age = age; }
    public String getName() { return name; }
}

// If Address did not implement Serializable:
// java.io.NotSerializableException: Address`,
      interviewPoints: [
        'Serializable is a marker interface with no methods',
        'All non-transient fields must be serializable too',
        'Otherwise NotSerializableException is thrown at runtime',
      ],
    },
    {
      id: 'object-streams',
      title: 'ObjectOutputStream and ObjectInputStream',
      explanation: "`ObjectOutputStream.writeObject(obj)` writes an object graph to any underlying `OutputStream` (a file, socket or byte array). `ObjectInputStream.readObject()` reads it back and returns `Object`, which you cast. `readObject` can throw `ClassNotFoundException` if the class is not on the classpath, and `IOException` for stream problems. Always use try-with-resources so streams are closed.\n\nDuring deserialization, the constructor of your Serializable class is NOT called; fields are restored directly.",
      example: `Path file = Path.of("users.ser");

// Write to a file
try (ObjectOutputStream out = new ObjectOutputStream(Files.newOutputStream(file))) {
    out.writeObject(List.of(new User("Asha", 28), new User("Ravi", 31)));
}

// Read from the file
try (ObjectInputStream in = new ObjectInputStream(Files.newInputStream(file))) {
    @SuppressWarnings("unchecked")
    List<User> users = (List<User>) in.readObject();
    users.forEach(u -> System.out.println(u.getName()));
} catch (ClassNotFoundException e) {
    throw new IllegalStateException("User class missing", e);
}`,
      interviewPoints: [
        'writeObject / readObject',
        'readObject throws IOException and ClassNotFoundException',
        'Constructors of Serializable classes are not run during deserialization',
      ],
    },
    {
      id: 'serial-version-uid',
      title: 'serialVersionUID',
      explanation: "`serialVersionUID` is a version number for a serializable class. When deserializing, Java compares the UID stored in the bytes with the UID of the class currently loaded. If they differ, it throws `InvalidClassException`.\n\nIf you do not declare it, the JVM computes one from the class structure (fields, methods, interfaces). Even a harmless change, like adding a method, changes the computed value, and old data can no longer be read. Declaring `private static final long serialVersionUID = 1L;` yourself gives you control: compatible changes (adding a field) keep the same UID, and you change it only when you intentionally break compatibility.",
      example: `public class Product implements Serializable {
    private static final long serialVersionUID = 1L;   // declare it explicitly

    private String name;
    private double price;
    // Adding a new field later keeps compatibility:
    // old data is read and the new field gets its default value (null / 0)
    private String category;
}

// Without an explicit UID, after changing the class:
// java.io.InvalidClassException: Product; local class incompatible:
// stream classdesc serialVersionUID = 4125965473324325111,
// local class serialVersionUID = -2349880117493456729`,
      interviewPoints: [
        'Used to verify class compatibility during deserialization',
        'Mismatch causes InvalidClassException',
        'If missing, the JVM computes one, which changes with almost any edit',
        'Always declare it explicitly as private static final long',
      ],
    },
    {
      id: 'transient',
      title: 'The transient Keyword',
      explanation: "Mark a field `transient` to exclude it from serialization. On deserialization, it gets its default value (`null`, `0` or `false`), because constructors and field initializers are not run.\n\nUse it for sensitive data (passwords, tokens), values that can be recalculated (caches, derived totals), and fields whose types are not serializable (a `Thread`, a database `Connection`, a logger).",
      example: `public class Session implements Serializable {
    private static final long serialVersionUID = 1L;

    private String username;
    private transient String password;        // never written
    private transient Connection dbConnection; // not serializable anyway
    private transient int cachedHash = -1;     // initializer does NOT rerun

    public Session(String username, String password) {
        this.username = username;
        this.password = password;
    }
}

// After deserialization:
// username   -> "asha"
// password   -> null
// cachedHash -> 0 (not -1!)`,
      interviewPoints: [
        'transient fields are skipped during serialization',
        'They come back as default values, not initializer values',
        'Use for secrets, derived data and non-serializable resources',
      ],
    },
    {
      id: 'static-fields',
      title: 'Static Fields and Serialization',
      explanation: "Static fields belong to the class, not to any single object, so they are never serialized. After deserialization, a static field simply has whatever value the class currently has in that JVM. `serialVersionUID` is a special static field that Java reads as metadata, not as object state.",
      example: `public class Counter implements Serializable {
    private static final long serialVersionUID = 1L;
    static int instances = 0;       // class-level, not serialized
    private int value;

    public Counter(int value) { this.value = value; instances++; }
}

Counter c = new Counter(5);    // instances = 1
// serialize c to a file, then restart the JVM and deserialize:
// value     -> 5 (restored)
// instances -> 0 (the fresh JVM's value; the constructor was not run)`,
      interviewPoints: [
        'Static fields are not part of object state and are not serialized',
        'serialVersionUID is static but used as class metadata',
      ],
    },
    {
      id: 'custom-serialization',
      title: 'Customizing: writeObject, readObject and readResolve',
      explanation: "A Serializable class can define private `writeObject(ObjectOutputStream)` and `readObject(ObjectInputStream)` methods to control the process: encrypt a field, validate invariants after reading, or write extra data. Call `defaultWriteObject()`/`defaultReadObject()` inside them to handle the normal fields.\n\n`readResolve()` lets you replace the deserialized object with another one, which is used to keep singletons single. `writeReplace()` does the same on the writing side.",
      example: `public class Account implements Serializable {
    private static final long serialVersionUID = 1L;
    private String owner;
    private double balance;

    private void writeObject(ObjectOutputStream out) throws IOException {
        out.defaultWriteObject();                  // owner, balance
    }

    private void readObject(ObjectInputStream in) throws IOException, ClassNotFoundException {
        in.defaultReadObject();
        if (balance < 0) {                         // validate untrusted data
            throw new InvalidObjectException("Negative balance");
        }
    }
}

public class Registry implements Serializable {
    public static final Registry INSTANCE = new Registry();
    private Registry() { }

    private Object readResolve() {                  // keep the singleton single
        return INSTANCE;
    }
}`,
      interviewPoints: [
        'Private writeObject/readObject hooks customize serialization',
        'Validate invariants in readObject',
        'readResolve preserves singletons',
      ],
    },
    {
      id: 'externalizable',
      title: 'Externalizable',
      explanation: "`Externalizable` extends `Serializable` and gives you full control. You must implement `writeExternal(ObjectOutput)` and `readExternal(ObjectInput)` and write/read every field yourself, in the same order. The class must have a public no-arg constructor, because Java calls it first and then calls `readExternal`.\n\nIt can produce smaller, faster output, but it is more work and easy to get wrong.",
      example: `public class Point implements Externalizable {
    private int x;
    private int y;

    public Point() { }                          // required: public no-arg constructor

    public Point(int x, int y) { this.x = x; this.y = y; }

    @Override
    public void writeExternal(ObjectOutput out) throws IOException {
        out.writeInt(x);
        out.writeInt(y);
    }

    @Override
    public void readExternal(ObjectInput in) throws IOException {
        x = in.readInt();                      // same order as written
        y = in.readInt();
    }
}`,
      interviewPoints: [
        'Externalizable: you write and read every field manually',
        'Requires a public no-arg constructor',
        'Serializable: automatic; Externalizable: full control and possibly faster',
      ],
    },
    {
      id: 'inheritance',
      title: 'Inheritance and Serialization',
      explanation: "If a parent class implements `Serializable`, all subclasses are serializable automatically. If a child is serializable but its parent is NOT, the parent's fields are not saved. During deserialization, Java calls the no-arg constructor of the first non-serializable superclass to initialize those fields, so that parent must have an accessible no-arg constructor, otherwise you get `InvalidClassException`.\n\nTo stop a subclass of a serializable class from being serialized, throw `NotSerializableException` from its `writeObject` and `readObject`.",
      example: `public class Person {                 // NOT Serializable
    protected String name = "unknown";
    public Person() { }                  // needed for deserialization
}

public class Employee extends Person implements Serializable {
    private static final long serialVersionUID = 1L;
    private double salary;

    public Employee(String name, double salary) {
        this.name = name;
        this.salary = salary;
    }
}

Employee e = new Employee("Asha", 50000);
// after serialize + deserialize:
// salary -> 50000.0  (Employee is Serializable)
// name   -> "unknown" (Person() constructor ran, its state was not saved)`,
      interviewPoints: [
        'Subclasses of a Serializable class are Serializable',
        'Non-serializable parent fields are not saved',
        'The non-serializable parent needs a no-arg constructor',
      ],
    },
    {
      id: 'security-risks',
      title: 'Security Risks of Java Deserialization',
      explanation: "Deserializing data from an untrusted source is dangerous. `readObject()` can instantiate any serializable class on the classpath and run its `readObject` logic before your code even checks the type. Attackers chain existing library classes (\"gadget chains\", found in old versions of Apache Commons Collections and others) to achieve remote code execution. This caused many real-world breaches.\n\nDefences: never deserialize untrusted data with Java serialization; prefer JSON or Protobuf; if you must, use serialization filters (`ObjectInputFilter`, Java 9+) with an allow-list of classes; keep libraries updated. Effective Java advises: avoid Java serialization in new systems.",
      example: `// Java 9+: allow only specific classes and limit graph size
ObjectInputFilter filter = ObjectInputFilter.Config.createFilter(
        "com.example.model.*;java.util.*;java.lang.*;maxdepth=10;maxbytes=100000;!*");

try (ObjectInputStream in = new ObjectInputStream(input)) {
    in.setObjectInputFilter(filter);
    Object obj = in.readObject();   // rejected classes throw InvalidClassException
}

// Or set a JVM-wide filter:
// -Djdk.serialFilter=com.example.model.*;!*`,
      interviewPoints: [
        'Untrusted deserialization can lead to remote code execution',
        'Gadget chains reuse classes already on the classpath',
        'Use ObjectInputFilter allow-lists or avoid Java serialization',
        'Prefer JSON/Protobuf for data exchange',
      ],
    },
    {
      id: 'jackson-json',
      title: 'JSON Serialization with Jackson (Modern Alternative)',
      explanation: "Jackson's `ObjectMapper` converts Java objects to JSON and back. JSON is human-readable, language independent, easy to version and does not execute arbitrary classes, so it is the standard for REST APIs, Kafka messages and Redis caches. Spring Boot configures Jackson automatically: returning an object from a `@RestController` serializes it to JSON, and `@RequestBody` deserializes it.\n\nJackson does not need `Serializable`. It uses getters, setters, fields or constructors, and you control it with annotations like `@JsonIgnore`, `@JsonProperty` and `@JsonFormat`. Records work out of the box.",
      example: `public record UserDto(
        Long id,
        @JsonProperty("full_name") String name,
        @JsonIgnore String password,
        @JsonFormat(pattern = "yyyy-MM-dd") LocalDate joined) { }

ObjectMapper mapper = new ObjectMapper()
        .registerModule(new JavaTimeModule())
        .configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);

String json = mapper.writeValueAsString(
        new UserDto(1L, "Asha Rao", "secret", LocalDate.of(2024, 1, 15)));
// {"id":1,"full_name":"Asha Rao","joined":"2024-01-15"}

UserDto dto = mapper.readValue(json, UserDto.class);

List<UserDto> list = mapper.readValue("[]", new TypeReference<List<UserDto>>() {});

// In Spring Boot this happens automatically:
@PostMapping("/users")
public UserDto create(@RequestBody UserDto request) { return request; }`,
      interviewPoints: [
        'ObjectMapper: writeValueAsString / readValue',
        'No Serializable needed; works with getters, fields, constructors, records',
        '@JsonIgnore, @JsonProperty, @JsonFormat customize output',
        'Spring Boot auto-configures Jackson for REST',
      ],
    },
  ],
  commonMistakes: [
    "Not declaring `serialVersionUID`, so a small class change makes old serialized data unreadable with `InvalidClassException`.",
    "Forgetting that a field's type must also be `Serializable`, causing `NotSerializableException` at runtime.",
    "Expecting `transient` fields or field initializers to be restored; they come back as default values.",
    "Deserializing untrusted input with `ObjectInputStream`, opening the door to remote code execution.",
    "Thinking static fields are saved with the object; they belong to the class and are never serialized.",
  ],
  interviewTips: [
    "Start with a one-line definition, then mention `Serializable` as a marker interface and the role of `serialVersionUID`.",
    "Show awareness of security: mention gadget-chain attacks and that modern systems use JSON or Protobuf instead.",
    "Know the quick facts: `transient` and static fields are not serialized, constructors are not called on deserialization (except for non-serializable parents and `Externalizable`).",
    "Relate it to Spring Boot: Jackson handles JSON for REST and Kafka, and Redis caching often uses a JSON serializer.",
  ],
  interviewQuestions: [
    {
      id: 'java-serialization-q1',
      question: 'What is serialization and deserialization in Java?',
      answer: "Serialization is converting an object's state into a byte stream so it can be stored or transmitted. Deserialization is reconstructing an object from that byte stream. In Java, a class must implement `Serializable`, and you use `ObjectOutputStream.writeObject()` and `ObjectInputStream.readObject()`.",
      example: `try (ObjectOutputStream out = new ObjectOutputStream(new FileOutputStream("u.ser"))) {
    out.writeObject(user);
}
try (ObjectInputStream in = new ObjectInputStream(new FileInputStream("u.ser"))) {
    User u = (User) in.readObject();
}`,
      points: ['Object to bytes and back', 'Requires Serializable', 'Used for files, networks, caches, sessions'],
      difficulty: 'Beginner',
    },
    {
      id: 'java-serialization-q2',
      question: 'What is a marker interface? Why is Serializable a marker interface?',
      answer: "A marker interface has no methods; it only marks a class as having a certain property. `Serializable` tells the serialization mechanism that the class's objects may be converted to bytes. `ObjectOutputStream` checks `instanceof Serializable` and throws `NotSerializableException` if the check fails. Today annotations often replace marker interfaces, but `Serializable` and `Cloneable` remain for historic reasons.",
      points: ['No methods, just a type tag', 'Checked with instanceof at runtime', 'Other example: Cloneable'],
      difficulty: 'Beginner',
    },
    {
      id: 'java-serialization-q3',
      question: 'What does the transient keyword do?',
      answer: "A `transient` field is skipped during serialization. After deserialization it has the default value for its type (`null`, `0`, `false`), even if the field has an initializer, because constructors and initializers are not run. Use it for passwords and secrets, data that can be recomputed, and non-serializable resources like connections or threads.",
      example: `private transient String password;   // not saved`,
      points: ['Excluded from serialization', 'Restored as default value', 'Good for secrets and derived data'],
      difficulty: 'Beginner',
    },
    {
      id: 'java-serialization-q4',
      question: 'What is serialVersionUID and what happens if you do not declare it?',
      answer: "`serialVersionUID` is a `private static final long` version identifier for a serializable class. During deserialization, Java compares the UID in the stream with the loaded class's UID and throws `InvalidClassException` on a mismatch. If you do not declare it, the JVM computes one from class details, so almost any change to the class (and even different compilers) can produce a different value, breaking old data. Declaring it explicitly lets you keep compatible changes working.",
      example: `private static final long serialVersionUID = 1L;`,
      points: ['Version check during deserialization', 'InvalidClassException on mismatch', 'Auto-generated value is fragile', 'Declare it explicitly'],
      difficulty: 'Intermediate',
    },
    {
      id: 'java-serialization-q5',
      question: 'What is the difference between Serializable and Externalizable?',
      answer: "With `Serializable`, the JVM automatically writes all non-transient, non-static fields; you can optionally customize it with private `writeObject`/`readObject`. With `Externalizable`, you must implement `writeExternal` and `readExternal` and handle every field yourself. `Externalizable` requires a public no-arg constructor, which is called before `readExternal`; `Serializable` does not call your class's constructor. Externalizable can be more compact and faster but is more error-prone.",
      points: ['Serializable: automatic, marker interface', 'Externalizable: manual, two methods', 'Externalizable needs a public no-arg constructor', 'Externalizable can be faster'],
      difficulty: 'Intermediate',
    },
    {
      id: 'java-serialization-q6',
      question: 'How does serialization work with inheritance?',
      answer: "If a superclass implements `Serializable`, all subclasses are serializable. If a subclass is serializable but its superclass is not, the superclass's fields are not saved; during deserialization the no-arg constructor of the nearest non-serializable superclass is called to initialize them, so it must exist and be accessible. If a field type is not serializable and not transient, serialization fails with `NotSerializableException`.",
      points: ['Serializability is inherited', 'Non-serializable parent state is lost', 'Parent needs an accessible no-arg constructor', 'Constructor of the first non-serializable ancestor runs'],
      difficulty: 'Intermediate',
    },
    {
      id: 'java-serialization-q7',
      question: 'Why is Java deserialization considered a security risk, and how do you mitigate it?',
      answer: "`ObjectInputStream.readObject()` creates objects of whatever serializable classes the byte stream names and runs their deserialization logic before your code can check anything. Attackers craft payloads using \"gadget chains\" of classes already on the classpath (for example old Commons Collections versions) to execute arbitrary code, a class of vulnerability behind many real breaches.\n\nMitigations: never deserialize untrusted data with Java serialization; use JSON, Protobuf or similar data-only formats; if unavoidable, apply `ObjectInputFilter` with a strict allow-list and size/depth limits; validate in `readObject`; keep dependencies patched.",
      example: `in.setObjectInputFilter(ObjectInputFilter.Config.createFilter(
        "com.example.dto.*;java.base/*;maxdepth=5;!*"));`,
      points: ['Can lead to remote code execution', 'Gadget chains', 'ObjectInputFilter allow-lists (Java 9+)', 'Prefer JSON/Protobuf'],
      difficulty: 'Advanced',
    },
    {
      id: 'java-serialization-q8',
      question: 'How can serialization break a singleton, and how do you prevent it?',
      answer: "Deserializing a serialized singleton creates a brand-new instance, because `readObject` builds a new object without using your private constructor, so you end up with two instances. To prevent this, implement `readResolve()` to return the existing instance, and make instance fields transient. The simplest and safest option is an enum singleton, whose serialization is handled specially by the JVM and always returns the same constant.",
      example: `public class Config implements Serializable {
    public static final Config INSTANCE = new Config();
    private Config() { }
    private Object readResolve() { return INSTANCE; }
}`,
      points: ['Deserialization creates a new object', 'readResolve returns the canonical instance', 'Enum singletons are serialization-safe'],
      difficulty: 'Advanced',
    },
    {
      id: 'java-serialization-q9',
      question: 'Why do modern applications prefer JSON (Jackson) over Java serialization?',
      answer: "JSON is language independent, human readable, easy to debug and safer because it only carries data; Jackson creates only the target types you ask for. It tolerates schema changes well (for example ignoring unknown properties), while Java serialization is tightly coupled to class structure and `serialVersionUID`. Java serialization is also Java-only and has a long history of security vulnerabilities. Spring Boot uses Jackson for REST APIs out of the box, and it is common for Kafka and Redis payloads too.",
      example: `ObjectMapper mapper = new ObjectMapper();
String json = mapper.writeValueAsString(order);
Order back = mapper.readValue(json, Order.class);`,
      points: ['Interoperable and readable', 'Safer data-only format', 'Easier versioning', 'Auto-configured in Spring Boot'],
      difficulty: 'Intermediate',
    },
  ],
}

export default topic
