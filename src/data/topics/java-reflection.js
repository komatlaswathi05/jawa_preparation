const topic = {
  id: 'java-reflection',
  category: 'java',
  title: 'Reflection',
  description: "Inspect and manipulate classes, fields, methods and constructors at runtime, and learn how Spring, Hibernate and JUnit rely on reflection and dynamic proxies.",
  difficulty: 'Advanced',
  overview: "Reflection is the ability of a Java program to look at itself while it runs. Using the `java.lang.reflect` API you can ask a class which fields, methods and constructors it has, read and change field values (even private ones), call methods by name, and create objects without writing `new` in your code.\n\nThink of normal code as reading a book you already know: you call `user.getName()` because you knew about that method when you wrote the code. Reflection is like opening an unknown book and reading its table of contents at runtime, then jumping to any chapter you find interesting. That is exactly what a framework needs, because Spring or Hibernate was written long before your `User` class existed.\n\nYou rarely use reflection directly in business code, but frameworks are built on it: Spring creates beans and injects dependencies, Hibernate fills entity fields from database rows, Jackson maps JSON to objects, and JUnit finds and runs `@Test` methods. Interviewers ask about reflection to see if you understand how these frameworks work, and whether you know its costs: slower performance, broken encapsulation and security concerns.",
  subtopics: [
    {
      id: 'class-object',
      title: 'The Class Object',
      explanation: "Every type loaded by the JVM has exactly one `java.lang.Class` object that describes it: its name, superclass, interfaces, modifiers, fields, methods, constructors and annotations. The `Class` object is the entry point to all reflection.\n\n`Class<T>` is generic, so `String.class` has type `Class<String>`.",
      example: `Class<String> c = String.class;

System.out.println(c.getName());          // java.lang.String
System.out.println(c.getSimpleName());    // String
System.out.println(c.getSuperclass());    // class java.lang.Object
System.out.println(c.getPackageName());   // java.lang
System.out.println(Modifier.isFinal(c.getModifiers()));  // true

for (Class<?> iface : c.getInterfaces()) {
    System.out.println(iface.getSimpleName()); // Serializable, Comparable, CharSequence, ...
}`,
      interviewPoints: [
        'One Class object per loaded type per class loader',
        'Entry point for all reflection operations',
        'Class<T> is generic',
      ],
    },
    {
      id: 'getting-classes',
      title: 'Getting a Class Object',
      explanation: "There are three common ways. Use `.class` on a type when you know it at compile time (`User.class`, also works for primitives like `int.class`). Call `getClass()` on an existing object to get its actual runtime class. Call `Class.forName(\"com.example.User\")` to load a class from its fully qualified name string, which is how drivers and plugins were traditionally loaded; it throws `ClassNotFoundException` if the class is missing.",
      example: `// 1. Class literal
Class<User> a = User.class;

// 2. From an instance (runtime type, may be a subclass)
Object obj = new Admin();
Class<?> b = obj.getClass();          // class Admin, not Object

// 3. By name (loads and initializes the class)
try {
    Class<?> c = Class.forName("com.example.model.User");
} catch (ClassNotFoundException e) {
    System.out.println("Not on classpath");
}

Class<?> intType = int.class;          // primitives have Class objects too
Class<?> arr = String[].class;`,
      interviewPoints: [
        '.class, getClass(), Class.forName()',
        'getClass() returns the runtime type',
        'Class.forName initializes the class (runs static blocks) by default',
      ],
    },
    {
      id: 'inspecting-members',
      title: 'Inspecting Fields, Methods and Constructors',
      explanation: "`getFields()`, `getMethods()` and `getConstructors()` return only PUBLIC members, including inherited ones. `getDeclaredFields()`, `getDeclaredMethods()` and `getDeclaredConstructors()` return ALL members declared in that class (public, protected, package-private and private), but not inherited ones.\n\nEach member is represented by a `Field`, `Method` or `Constructor` object from which you can read the name, type, parameter types, modifiers and annotations.",
      example: `public class User {
    private Long id;
    private String name;
    public int age;

    public User() { }
    public User(Long id, String name) { this.id = id; this.name = name; }

    public String getName() { return name; }
    private void secret() { }
}

Class<User> c = User.class;

for (Field f : c.getDeclaredFields()) {
    System.out.println(Modifier.toString(f.getModifiers()) + " "
            + f.getType().getSimpleName() + " " + f.getName());
}
// private Long id, private String name, public int age

for (Method m : c.getDeclaredMethods()) {
    System.out.println(m.getName() + " params=" + m.getParameterCount());
}
// getName, secret (order is not guaranteed)

for (Constructor<?> ctor : c.getConstructors()) {
    System.out.println(Arrays.toString(ctor.getParameterTypes()));
}

System.out.println(c.getMethods().length); // includes public methods from Object`,
      interviewPoints: [
        'getX(): public only, including inherited',
        'getDeclaredX(): all access levels, this class only',
        'Order of returned members is not guaranteed',
      ],
    },
    {
      id: 'invoking-methods',
      title: 'Invoking Methods Dynamically',
      explanation: "Get a `Method` with `getMethod(name, parameterTypes...)` and call it with `method.invoke(target, args...)`. For static methods pass `null` as the target. If the invoked method throws an exception, reflection wraps it in `InvocationTargetException`; call `getCause()` to get the real exception.",
      example: `public class Calculator {
    public int add(int a, int b) { return a + b; }
    public static String hello(String name) { return "Hello " + name; }
}

Calculator calc = new Calculator();

Method add = Calculator.class.getMethod("add", int.class, int.class);
int result = (int) add.invoke(calc, 2, 3);               // 5

Method hello = Calculator.class.getMethod("hello", String.class);
String msg = (String) hello.invoke(null, "Asha");        // static: target is null

try {
    Method m = Calculator.class.getMethod("add", int.class, int.class);
    m.invoke(calc, 1, 2);
} catch (InvocationTargetException e) {
    Throwable real = e.getCause();   // the exception thrown inside add()
} catch (NoSuchMethodException | IllegalAccessException e) {
    e.printStackTrace();
}`,
      interviewPoints: [
        'getMethod needs the exact parameter types',
        'invoke(null, ...) for static methods',
        'Exceptions from the method are wrapped in InvocationTargetException',
      ],
    },
    {
      id: 'private-access',
      title: 'Accessing Private Members with setAccessible',
      explanation: "By default, reflection respects access rules, so reading a private field throws `IllegalAccessException`. Calling `setAccessible(true)` on the `Field`, `Method` or `Constructor` turns off this check, letting you read or write private fields and call private methods. Even `final` instance fields can be changed this way (though not reliably for static final or record fields).\n\nSince Java 9, the module system limits this: you cannot use `setAccessible` on private members of JDK internals or other modules unless the package is opened (`--add-opens` or `opens` in module-info). In Java 17 this is strongly enforced.",
      example: `public class Account {
    private double balance = 100;
    private void audit() { System.out.println("audit!"); }
}

Account acc = new Account();

Field balance = Account.class.getDeclaredField("balance");
balance.setAccessible(true);              // bypass private
System.out.println(balance.get(acc));     // 100.0
balance.set(acc, 999.0);                  // changed a private field!

Method audit = Account.class.getDeclaredMethod("audit");
audit.setAccessible(true);
audit.invoke(acc);                        // audit!

// Java 17: this fails with InaccessibleObjectException
// Field value = String.class.getDeclaredField("value");
// value.setAccessible(true);`,
      interviewPoints: [
        'setAccessible(true) disables Java access checks',
        'It breaks encapsulation, so use it sparingly',
        'Java 9+ modules restrict deep reflection (--add-opens)',
        'Frameworks like Hibernate use it to set private entity fields',
      ],
    },
    {
      id: 'creating-instances',
      title: 'Creating Instances with Reflection',
      explanation: "Use `clazz.getDeclaredConstructor(paramTypes...).newInstance(args...)` to create an object. The old `Class.newInstance()` is deprecated because it propagates checked exceptions from the constructor without declaring them.\n\nThis is how Spring creates beans and how JPA creates entities, which is why JPA requires a no-argument constructor on every entity.",
      example: `// No-arg constructor
User u1 = User.class.getDeclaredConstructor().newInstance();

// Constructor with parameters
Constructor<User> ctor = User.class.getDeclaredConstructor(Long.class, String.class);
User u2 = ctor.newInstance(1L, "Asha");

// Generic factory: create any class by name
public static Object create(String className) throws Exception {
    Class<?> clazz = Class.forName(className);
    return clazz.getDeclaredConstructor().newInstance();
}

// Deprecated since Java 9:
// User u3 = User.class.newInstance();`,
      interviewPoints: [
        'Prefer getDeclaredConstructor().newInstance()',
        'Class.newInstance() is deprecated',
        'JPA and many frameworks need a no-arg constructor for this reason',
      ],
    },
    {
      id: 'reading-annotations',
      title: 'Reading Annotations via Reflection',
      explanation: "`Class`, `Method`, `Field`, `Constructor` and `Parameter` all implement `AnnotatedElement`, so you can call `isAnnotationPresent()`, `getAnnotation()` and `getAnnotations()` on them. The annotation must have `@Retention(RetentionPolicy.RUNTIME)` to be visible. This is the core of how annotation-driven frameworks work.",
      example: `@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.METHOD)
@interface MyTest { }

public class CalculatorTests {
    @MyTest public void addsNumbers() { System.out.println("add ok"); }
    @MyTest public void subtracts()   { System.out.println("sub ok"); }
    public void helper() { }
}

// A tiny "JUnit": run every method annotated with @MyTest
public static void runTests(Class<?> testClass) throws Exception {
    Object instance = testClass.getDeclaredConstructor().newInstance();
    for (Method m : testClass.getDeclaredMethods()) {
        if (m.isAnnotationPresent(MyTest.class)) {
            try {
                m.invoke(instance);
                System.out.println("PASS " + m.getName());
            } catch (InvocationTargetException e) {
                System.out.println("FAIL " + m.getName() + ": " + e.getCause());
            }
        }
    }
}`,
      interviewPoints: [
        'AnnotatedElement is implemented by Class, Method, Field, Constructor, Parameter',
        'Only RUNTIME-retained annotations are visible',
        'This pattern is how JUnit discovers test methods',
      ],
    },
    {
      id: 'dynamic-proxies',
      title: 'Dynamic Proxies',
      explanation: "`java.lang.reflect.Proxy` can create, at runtime, an object that implements one or more interfaces. Every method call on the proxy goes to an `InvocationHandler`, which can add logic (logging, transactions, security) and then delegate to the real object. This is the heart of Spring AOP.\n\nJDK dynamic proxies work only with interfaces. To proxy a class without an interface, libraries like CGLIB or ByteBuddy generate a subclass at runtime; Spring Boot uses CGLIB class proxies by default.",
      example: `public interface PaymentService {
    void pay(double amount);
}

public class RealPaymentService implements PaymentService {
    public void pay(double amount) { System.out.println("Paid " + amount); }
}

PaymentService real = new RealPaymentService();

PaymentService proxy = (PaymentService) Proxy.newProxyInstance(
        PaymentService.class.getClassLoader(),
        new Class<?>[] { PaymentService.class },
        (proxyObj, method, args) -> {
            System.out.println("BEFORE " + method.getName());   // e.g. begin transaction
            Object result = method.invoke(real, args);
            System.out.println("AFTER " + method.getName());    // e.g. commit
            return result;
        });

proxy.pay(500);
// BEFORE pay
// Paid 500.0
// AFTER pay`,
      interviewPoints: [
        'Proxy.newProxyInstance + InvocationHandler',
        'JDK proxies require interfaces; CGLIB subclasses classes',
        'Spring AOP (@Transactional, @Cacheable) is built on proxies',
        'Final classes/methods cannot be proxied by CGLIB',
      ],
    },
    {
      id: 'framework-usage',
      title: 'How Spring, Hibernate and JUnit Use Reflection',
      explanation: "Spring scans classes for annotations like `@Component`, creates beans by calling constructors reflectively, injects dependencies into constructors, fields or setters, and wraps beans in proxies for `@Transactional` and other aspects. Hibernate/JPA creates entity instances through the no-arg constructor and reads or writes fields (often private) to map rows to objects. Jackson finds getters, setters and fields to convert JSON. JUnit 5 discovers methods annotated with `@Test`, `@BeforeEach` and so on, and invokes them reflectively.\n\nThis is why your code can stay simple: the framework does the wiring by reading your classes at runtime.",
      example: `// Roughly what Spring does for constructor injection
Class<?> beanClass = OrderService.class;
Constructor<?> ctor = beanClass.getDeclaredConstructors()[0];
Object[] deps = Arrays.stream(ctor.getParameterTypes())
        .map(type -> context.getBean(type))   // find matching beans
        .toArray();
Object bean = ctor.newInstance(deps);

// Roughly what Hibernate does when loading a row
User user = User.class.getDeclaredConstructor().newInstance();
Field name = User.class.getDeclaredField("name");
name.setAccessible(true);
name.set(user, resultSet.getString("name"));`,
      interviewPoints: [
        'Spring: scanning, bean creation, injection, proxies',
        'Hibernate: no-arg constructor and field access',
        'JUnit: finds and invokes @Test methods',
        'Jackson: introspects getters/setters/fields',
      ],
    },
    {
      id: 'costs',
      title: 'Performance and Security Costs',
      explanation: "Reflection is slower than direct calls because the JVM must look up members by name, check access, box primitive arguments and handle wrapped exceptions; it also limits JIT optimizations like inlining. Modern JDKs have improved this a lot (Java 18 reimplemented core reflection on method handles), and caching `Method`/`Field` objects helps. For hot paths, `MethodHandle` or generated code is faster.\n\nOther costs: it breaks encapsulation, errors appear only at runtime (a misspelled method name is a `NoSuchMethodException`, not a compile error), refactoring tools cannot see reflective uses, and it can be a security risk if attackers can control which class or method names are loaded. It also complicates native images (GraalVM), which need reflection configuration.",
      example: `// Cache reflective lookups instead of repeating them in a loop
private static final Method GET_NAME;
static {
    try {
        GET_NAME = User.class.getMethod("getName");
    } catch (NoSuchMethodException e) {
        throw new ExceptionInInitializerError(e);
    }
}

// Faster alternative for repeated calls
MethodHandle handle = MethodHandles.lookup()
        .findVirtual(User.class, "getName", MethodType.methodType(String.class));
String name = (String) handle.invokeExact(user);

// Dangerous: never load classes from untrusted input
// Class.forName(request.getParameter("type")).getDeclaredConstructor().newInstance();`,
      interviewPoints: [
        'Slower than direct calls; cache Method/Field objects',
        'No compile-time checking; errors surface at runtime',
        'Breaks encapsulation and can create security holes',
        'MethodHandle is a faster, access-checked alternative',
      ],
    },
  ],
  commonMistakes: [
    "Using reflection in normal business code when an interface, lambda or polymorphism would solve the problem safely.",
    "Using `getMethods()`/`getFields()` and wondering why private members are missing (use the `getDeclared...` variants).",
    "Catching only `Exception` and not unwrapping `InvocationTargetException`, which hides the real error thrown by the invoked method.",
    "Looking up the same `Method` or `Field` repeatedly inside a loop instead of caching it.",
    "Loading classes or invoking methods whose names come from user input, which can let attackers run unexpected code.",
  ],
  interviewTips: [
    "Always pair \"what reflection can do\" with \"why frameworks need it\": Spring DI, Hibernate mapping, JUnit test discovery, Jackson.",
    "Mention the trade-offs unprompted: performance, broken encapsulation, runtime-only errors, module restrictions in Java 9+.",
    "Explain that Spring AOP uses JDK dynamic proxies for interfaces and CGLIB subclasses for classes; this links reflection to `@Transactional` behaviour.",
    "Be able to write the three ways to get a `Class` object and the difference between `getMethods()` and `getDeclaredMethods()`.",
  ],
  interviewQuestions: [
    {
      id: 'java-reflection-q1',
      question: 'What is reflection in Java?',
      answer: "Reflection is an API (`java.lang.Class` and `java.lang.reflect`) that lets a program inspect and use classes at runtime: list fields, methods and constructors, read annotations, create instances, call methods and get or set field values, even if the class was not known when the code was compiled. Frameworks such as Spring, Hibernate, Jackson and JUnit rely on it.",
      points: ['Runtime inspection and manipulation of classes', 'Entry point is the Class object', 'Foundation of most Java frameworks'],
      difficulty: 'Beginner',
    },
    {
      id: 'java-reflection-q2',
      question: 'What are the ways to obtain a Class object?',
      answer: "Use a class literal `User.class` when the type is known at compile time; call `obj.getClass()` on an instance to get its runtime class; or call `Class.forName(\"com.example.User\")` to load a class from its fully qualified name, which throws `ClassNotFoundException` if it is not found and by default runs its static initializers.",
      example: `Class<?> a = User.class;
Class<?> b = new User().getClass();
Class<?> c = Class.forName("com.example.User");`,
      points: ['.class literal', 'getClass() on an instance', 'Class.forName(name)'],
      difficulty: 'Beginner',
    },
    {
      id: 'java-reflection-q3',
      question: 'What is the difference between getMethods() and getDeclaredMethods()?',
      answer: "`getMethods()` returns all public methods of the class, including public methods inherited from superclasses and interfaces (like `toString()` from `Object`). `getDeclaredMethods()` returns every method declared directly in that class regardless of access (public, protected, package-private, private), but no inherited ones. The same pattern applies to fields and constructors.",
      points: ['getMethods: public + inherited', 'getDeclaredMethods: all access levels, own class only', 'Same rule for fields and constructors'],
      difficulty: 'Beginner',
    },
    {
      id: 'java-reflection-q4',
      question: 'Can you access private fields with reflection? How?',
      answer: "Yes. Get the field with `getDeclaredField(\"name\")`, call `setAccessible(true)` to suppress Java access checks, then use `field.get(obj)` or `field.set(obj, value)`. The same works for private methods and constructors. Since Java 9, the module system blocks this for packages that are not opened, such as JDK internals, unless you use `--add-opens`.",
      example: `Field f = Account.class.getDeclaredField("balance");
f.setAccessible(true);
f.set(account, 0.0);`,
      points: ['getDeclaredField + setAccessible(true)', 'Breaks encapsulation', 'Restricted by Java modules (InaccessibleObjectException)'],
      difficulty: 'Intermediate',
    },
    {
      id: 'java-reflection-q5',
      question: 'How do you invoke a method using reflection, and how are exceptions handled?',
      answer: "Obtain the `Method` with `getMethod(name, paramTypes...)` (or `getDeclaredMethod` plus `setAccessible` for non-public methods), then call `method.invoke(target, args...)`; pass `null` as the target for static methods. The return value is an `Object` that you cast. If the invoked method throws, you receive an `InvocationTargetException` whose `getCause()` is the original exception; you may also get `NoSuchMethodException` or `IllegalAccessException`.",
      example: `Method m = Calculator.class.getMethod("add", int.class, int.class);
try {
    int sum = (int) m.invoke(new Calculator(), 2, 3);
} catch (InvocationTargetException e) {
    throw new RuntimeException(e.getCause());
}`,
      points: ['getMethod with exact parameter types', 'invoke(target, args)', 'InvocationTargetException wraps the real exception'],
      difficulty: 'Intermediate',
    },
    {
      id: 'java-reflection-q6',
      question: 'Why do JPA entities need a no-argument constructor?',
      answer: "Hibernate (and other JPA providers) creates entity objects reflectively when loading rows from the database, usually via `getDeclaredConstructor().newInstance()`, and then fills fields one by one. It cannot guess what arguments to pass to other constructors, so the JPA spec requires a public or protected no-arg constructor. It also needs the class to be non-final so it can create lazy-loading proxy subclasses.",
      points: ['Entities are instantiated via reflection', 'Fields set afterwards via reflection', 'Constructor may be protected', 'Non-final classes allow proxies'],
      difficulty: 'Intermediate',
    },
    {
      id: 'java-reflection-q7',
      question: 'What is a dynamic proxy and how does Spring use proxies?',
      answer: "A dynamic proxy is an object generated at runtime that implements given interfaces and routes every call to an `InvocationHandler`, created with `Proxy.newProxyInstance`. The handler can run logic before and after delegating to the real object. Spring AOP uses this to implement `@Transactional`, `@Cacheable`, `@Async` and security: callers get the proxy, not your bean directly.\n\nJDK proxies work only with interfaces, so Spring uses CGLIB (runtime subclass generation) for classes, and Spring Boot uses CGLIB by default. Because it is a proxy, internal calls within the same class (self-invocation) skip the advice, and final methods cannot be intercepted.",
      example: `Object proxy = Proxy.newProxyInstance(loader, new Class<?>[]{ Service.class },
        (p, method, args) -> {
            System.out.println("start tx");
            Object r = method.invoke(target, args);
            System.out.println("commit");
            return r;
        });`,
      points: ['Proxy + InvocationHandler', 'JDK proxy = interfaces, CGLIB = subclasses', 'Basis of Spring AOP', 'Self-invocation bypasses the proxy'],
      difficulty: 'Advanced',
    },
    {
      id: 'java-reflection-q8',
      question: 'What are the drawbacks of reflection?',
      answer: "Performance: reflective calls are slower than direct calls (lookup, access checks, boxing, fewer JIT optimizations), though caching `Method` objects and modern JDKs reduce the gap. Safety: there is no compile-time checking, so typos in names become runtime exceptions and refactoring can silently break code. Encapsulation: `setAccessible(true)` lets code change private state and invariants. Security: loading classes or calling methods from untrusted input can be exploited. Compatibility: Java modules restrict deep reflection, and GraalVM native images need explicit reflection metadata.",
      points: ['Slower; cache lookups or use MethodHandle', 'Errors only at runtime', 'Breaks encapsulation', 'Security and module restrictions'],
      difficulty: 'Advanced',
    },
    {
      id: 'java-reflection-q9',
      question: 'Can reflection break a singleton? How do you prevent it?',
      answer: "Yes. Even with a private constructor, an attacker can call `getDeclaredConstructor()`, `setAccessible(true)` and `newInstance()` to create a second instance. You can defend by throwing an exception from the constructor if an instance already exists, but the most robust solution is an enum singleton: the JVM forbids reflective creation of enum instances, throwing `IllegalArgumentException(\"Cannot reflectively create enum objects\")`.",
      example: `Constructor<Singleton> c = Singleton.class.getDeclaredConstructor();
c.setAccessible(true);
Singleton second = c.newInstance();   // a new instance!

// Guard
private Singleton() {
    if (INSTANCE != null) throw new IllegalStateException("Already created");
}`,
      points: ['setAccessible bypasses private constructors', 'Guard in constructor', 'Enum singleton is reflection-proof'],
      difficulty: 'Advanced',
    },
  ],
}

export default topic
