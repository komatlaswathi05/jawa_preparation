const topic = {
  id: 'java-annotations',
  category: 'java',
  title: 'Annotations',
  description: "Understand built-in and meta-annotations, write your own custom annotations, and see how Spring reads them to wire your application.",
  difficulty: 'Intermediate',
  overview: "An annotation is a label you attach to code (a class, method, field, parameter and more) using the `@` symbol, like `@Override` or `@Service`. The annotation itself does nothing. It is metadata: extra information about the code that the compiler, build tools or frameworks can read and act on.\n\nThink of annotations like sticky notes on files in an office. The note \"urgent\" does not change what is inside the file, but the person who processes the files reads the note and treats that file differently. In Java, the \"person\" reading the note might be the compiler (`@Override`), an annotation processor at build time (Lombok, MapStruct), or a framework at runtime (Spring, JPA, JUnit) using reflection.\n\nModern Spring Boot applications are driven almost entirely by annotations: `@SpringBootApplication`, `@RestController`, `@Autowired`, `@Transactional`, `@Entity`. Knowing how annotations are defined, how long they are kept (retention) and how frameworks read them helps you understand what Spring is doing behind the scenes, and it is a common interview topic.",
  subtopics: [
    {
      id: 'what-are-annotations',
      title: 'What Are Annotations?',
      explanation: "Annotations are metadata attached to program elements. They start with `@` and can have elements (parameters), like `@Table(name = \"users\")`. By themselves they have no behaviour; some other code must read them.\n\nThey are read at three possible times: by the compiler (for checks and warnings), at build time by annotation processors (to generate code), or at runtime through reflection (by frameworks).",
      example: `@Entity                               // marker annotation: no elements
@Table(name = "users")                // annotation with an element
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String email;

    @Override                         // read by the compiler
    public String toString() { return email; }
}`,
      interviewPoints: [
        'Annotations are metadata; they do not change code behaviour by themselves',
        'Read by the compiler, annotation processors, or at runtime via reflection',
        'Can be placed on classes, methods, fields, parameters, constructors, packages and more',
      ],
    },
    {
      id: 'built-in-annotations',
      title: 'Built-in Annotations: @Override, @Deprecated, @SuppressWarnings, @FunctionalInterface',
      explanation: "`@Override` tells the compiler you intend to override a parent method; if the signature does not match, you get a compile error instead of a silent new method. `@Deprecated` marks code that should no longer be used; callers get a warning (you can add `since` and `forRemoval`). `@SuppressWarnings(\"unchecked\")` hides specific compiler warnings in a small scope. `@FunctionalInterface` makes the compiler check that an interface has exactly one abstract method, so it can be used with lambdas.\n\nOther built-ins include `@SafeVarargs` (for generic varargs methods).",
      example: `public class Animal {
    public String sound() { return "..."; }
}

public class Dog extends Animal {
    @Override
    public String sound() { return "Woof"; }

    // @Override
    // public String Sound() { }   // compile error: nothing to override
}

public class LegacyApi {
    @Deprecated(since = "2.0", forRemoval = true)
    public void oldMethod() { }
}

@SuppressWarnings("unchecked")
List<String> list = (List<String>) someObject;

@FunctionalInterface
public interface Validator<T> {
    boolean validate(T value);
    // boolean other(T v);        // compile error: two abstract methods
    default Validator<T> and(Validator<T> other) {
        return v -> validate(v) && other.validate(v);
    }
}`,
      interviewPoints: [
        '@Override catches signature mistakes at compile time',
        '@Deprecated(since, forRemoval) warns callers',
        '@SuppressWarnings should be as narrow in scope as possible',
        '@FunctionalInterface is optional but enforces a single abstract method',
      ],
    },
    {
      id: 'meta-annotations',
      title: 'Meta-annotations: @Retention, @Target, @Documented, @Inherited',
      explanation: "Meta-annotations are annotations that you put on annotation definitions. `@Retention` decides how long the annotation is kept. `@Target` decides where it may be used (`TYPE`, `METHOD`, `FIELD`, `PARAMETER`, and so on). `@Documented` makes the annotation appear in the generated Javadoc of the annotated element. `@Inherited` means a class-level annotation is automatically inherited by subclasses (only for classes, not interfaces or methods).\n\n`@Repeatable` is another meta-annotation that allows the same annotation more than once on one element.",
      example: `import java.lang.annotation.*;

@Retention(RetentionPolicy.RUNTIME)            // keep it at runtime
@Target({ElementType.TYPE, ElementType.METHOD}) // allowed on classes and methods
@Documented                                     // show in Javadoc
@Inherited                                      // subclasses inherit it
public @interface Audited {
    String value() default "";
}

@Audited("orders")
public class OrderService { }

public class SpecialOrderService extends OrderService { }
// SpecialOrderService.class.isAnnotationPresent(Audited.class) -> true (because of @Inherited)`,
      interviewPoints: [
        '@Retention: SOURCE, CLASS (default) or RUNTIME',
        '@Target limits where the annotation can be placed',
        '@Inherited works only for class-level annotations on superclasses',
        '@Documented includes the annotation in Javadoc',
      ],
    },
    {
      id: 'retention-policies',
      title: 'Retention Policies',
      explanation: "`RetentionPolicy.SOURCE` annotations are discarded by the compiler and never reach the class file (for example `@Override`, `@SuppressWarnings`, Lombok's `@Getter`). `RetentionPolicy.CLASS` annotations are stored in the class file but not available through reflection at runtime; this is the default if you do not specify `@Retention`. `RetentionPolicy.RUNTIME` annotations are stored in the class file and readable with reflection at runtime; all Spring, JPA and JUnit annotations use this.\n\nA very common bug is writing a custom annotation, forgetting `@Retention(RUNTIME)`, and then wondering why reflection cannot find it.",
      example: `@Retention(RetentionPolicy.SOURCE)   // gone after compilation
@interface Todo { String value(); }

@Retention(RetentionPolicy.CLASS)    // in bytecode, invisible to reflection (default)
@interface BuildInfo { }

@Retention(RetentionPolicy.RUNTIME)  // readable via reflection
@interface Secured { String role(); }`,
      interviewPoints: [
        'SOURCE: compiler only',
        'CLASS: in bytecode, not visible at runtime (the default)',
        'RUNTIME: visible to reflection; needed for frameworks',
      ],
    },
    {
      id: 'custom-annotations',
      title: 'Creating Custom Annotations',
      explanation: "Declare an annotation with `@interface`. Its elements look like methods with no parameters, and may have `default` values. Allowed element types are primitives, `String`, `Class`, enums, other annotations and arrays of these; `null` is not allowed as a value.\n\nIf an annotation has a single element named `value`, users can omit the name: `@Loggable(\"INFO\")` instead of `@Loggable(value = \"INFO\")`.",
      example: `@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.FIELD)
public @interface Length {
    int min() default 0;
    int max() default Integer.MAX_VALUE;
    String message() default "invalid length";
}

@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.METHOD)
public @interface Loggable {
    String value() default "INFO";   // 'value' can be passed without a name
}

public class SignupRequest {
    @Length(min = 3, max = 20, message = "username must be 3-20 characters")
    private String username;
}

public class PaymentService {
    @Loggable("DEBUG")
    public void pay() { }
}`,
      interviewPoints: [
        'Defined with @interface',
        'Element types: primitives, String, Class, enum, annotation, arrays of these',
        'Defaults via default; null is not a legal value',
        'A single element named value can be passed without its name',
      ],
    },
    {
      id: 'runtime-processing',
      title: 'Processing Annotations at Runtime',
      explanation: "With `RUNTIME` retention, you can read annotations through reflection. `isAnnotationPresent(X.class)` checks if it exists, and `getAnnotation(X.class)` returns the annotation object so you can read its elements. This is exactly how a simple validation or logging framework works.\n\nThere is also compile-time processing: an annotation processor (implementing `javax.annotation.processing.Processor`) runs during `javac` and can generate new source files. Lombok, MapStruct and Dagger work this way.",
      example: `public class LengthValidator {

    public static List<String> validate(Object obj) throws IllegalAccessException {
        List<String> errors = new ArrayList<>();

        for (Field field : obj.getClass().getDeclaredFields()) {
            Length rule = field.getAnnotation(Length.class);
            if (rule == null) continue;

            field.setAccessible(true);
            String value = (String) field.get(obj);
            int len = value == null ? 0 : value.length();

            if (len < rule.min() || len > rule.max()) {
                errors.add(field.getName() + ": " + rule.message());
            }
        }
        return errors;
    }
}

SignupRequest req = new SignupRequest();   // username = "ab"
List<String> errors = LengthValidator.validate(req);
// [username: username must be 3-20 characters]`,
      interviewPoints: [
        'Use getAnnotation / isAnnotationPresent on Class, Method, Field, etc.',
        'Only RUNTIME-retained annotations are visible',
        'Annotation processors generate code at compile time (Lombok, MapStruct)',
      ],
    },
    {
      id: 'spring-annotations',
      title: 'How Spring Uses Annotations',
      explanation: "At startup, Spring scans your packages (component scanning) and uses reflection to find classes annotated with `@Component`, `@Service`, `@Repository`, `@Controller` or `@Configuration`. It creates beans for them and injects dependencies into constructors or fields (`@Autowired`, `@Value`).\n\nFor annotations like `@Transactional`, `@Cacheable` or `@Async`, Spring wraps your bean in a proxy that runs extra logic before and after your method. Spring also supports composed (meta) annotations: `@RestController` is itself annotated with `@Controller` and `@ResponseBody`, and `@SpringBootApplication` combines `@Configuration`, `@EnableAutoConfiguration` and `@ComponentScan`.",
      example: `@Service                                  // found by component scanning
public class OrderService {

    private final OrderRepository repo;

    public OrderService(OrderRepository repo) {  // injected by Spring
        this.repo = repo;
    }

    @Transactional                        // proxy starts/commits a transaction
    public Order place(Order order) {
        return repo.save(order);
    }
}

// Your own composed annotation
@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.TYPE)
@Service
@Transactional(readOnly = true)
public @interface ReadOnlyService { }

@ReadOnlyService
public class ReportService { }   // behaves like @Service + @Transactional(readOnly = true)`,
      interviewPoints: [
        'Component scanning finds stereotype annotations via reflection',
        '@Transactional, @Cacheable, @Async work through proxies (AOP)',
        'Spring supports meta-annotations to compose new annotations',
        '@SpringBootApplication = @Configuration + @EnableAutoConfiguration + @ComponentScan',
      ],
    },
    {
      id: 'annotation-aop-example',
      title: 'Custom Annotation with Spring AOP',
      explanation: "A common real-world use is a custom annotation plus a Spring AOP aspect. The aspect runs around every method that carries your annotation, for example to measure execution time. This keeps cross-cutting concerns (logging, timing, security) out of business code.",
      example: `@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.METHOD)
public @interface LogExecutionTime { }

@Aspect
@Component
public class TimingAspect {

    private static final Logger log = LoggerFactory.getLogger(TimingAspect.class);

    @Around("@annotation(com.example.demo.LogExecutionTime)")
    public Object time(ProceedingJoinPoint pjp) throws Throwable {
        long start = System.currentTimeMillis();
        try {
            return pjp.proceed();
        } finally {
            log.info("{} took {} ms", pjp.getSignature(), System.currentTimeMillis() - start);
        }
    }
}

@Service
public class ReportService {
    @LogExecutionTime
    public Report generate() { /* ... */ return new Report(); }
}`,
      interviewPoints: [
        'Annotation marks the join point; the aspect contains the logic',
        'Requires spring-boot-starter-aop',
        'Self-invocation inside the same class bypasses the proxy',
      ],
    },
  ],
  commonMistakes: [
    "Forgetting `@Retention(RetentionPolicy.RUNTIME)` on a custom annotation, so `getAnnotation()` always returns null.",
    "Thinking an annotation does something by itself; without code (compiler, processor or framework) reading it, it has no effect.",
    "Expecting `@Inherited` to work on interfaces or methods; it only applies to class-level annotations inherited from superclasses.",
    "Putting `@SuppressWarnings` on a whole class instead of the smallest possible scope, hiding real problems.",
    "Calling a `@Transactional` or custom-aspect method from another method in the same class and expecting the annotation to apply (the proxy is bypassed).",
  ],
  interviewTips: [
    "Define annotations as metadata first, then explain the three consumers: compiler, annotation processors and runtime reflection.",
    "Know all three retention policies and that the default is CLASS; mention that frameworks need RUNTIME.",
    "Link annotations to Spring: component scanning, proxies for `@Transactional`, and composed annotations like `@RestController`.",
    "If you can, describe a custom annotation you built (for example with an AOP aspect for logging or rate limiting).",
  ],
  interviewQuestions: [
    {
      id: 'java-annotations-q1',
      question: 'What are annotations in Java?',
      answer: "Annotations are metadata attached to code elements such as classes, methods, fields and parameters, written with `@`. They do not change the code's behaviour directly; instead the compiler, annotation processors or frameworks read them and act on them. For example `@Override` is checked by the compiler, while `@Service` and `@Entity` are read by Spring and JPA at runtime.",
      points: ['Metadata, not logic', 'Read by compiler, processors or runtime reflection', 'Heavily used by frameworks'],
      difficulty: 'Beginner',
    },
    {
      id: 'java-annotations-q2',
      question: 'What is the purpose of @Override, and what happens if you leave it out?',
      answer: "`@Override` tells the compiler that a method is meant to override a method from a superclass or interface. If no matching method exists (for example you misspelled the name or used a wrong parameter type), compilation fails. Without it, the code still compiles, but a typo silently creates a new method instead of overriding, which leads to hard-to-find bugs.",
      example: `class Point {
    @Override
    public boolean equals(Point other) { return false; } // compile error: wrong parameter type
}                                              // equals must take Object`,
      points: ['Compile-time safety check', 'Optional but strongly recommended', 'Catches wrong signatures like equals(Point)'],
      difficulty: 'Beginner',
    },
    {
      id: 'java-annotations-q3',
      question: 'What does @FunctionalInterface do?',
      answer: "`@FunctionalInterface` makes the compiler verify that an interface has exactly one abstract method, so it can be the target of a lambda or method reference. Default and static methods, and methods overriding `Object` methods like `equals`, do not count. The annotation is optional: any interface with a single abstract method is already functional, but the annotation prevents someone from accidentally adding a second abstract method.",
      example: `@FunctionalInterface
interface Converter<A, B> {
    B convert(A input);
}
Converter<String, Integer> len = String::length;`,
      points: ['Exactly one abstract method', 'Default/static methods allowed', 'Optional, but documents intent and adds a check'],
      difficulty: 'Beginner',
    },
    {
      id: 'java-annotations-q4',
      question: 'What are meta-annotations? Name the main ones.',
      answer: "Meta-annotations are annotations applied to other annotation definitions. `@Retention` sets how long the annotation lives (SOURCE, CLASS, RUNTIME). `@Target` sets where it can be used (TYPE, METHOD, FIELD, PARAMETER and so on). `@Documented` includes it in Javadoc. `@Inherited` lets subclasses inherit a class-level annotation from their superclass. `@Repeatable` allows using it multiple times on the same element.",
      example: `@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.METHOD)
@Documented
public @interface RateLimited { int perMinute(); }`,
      points: ['@Retention', '@Target', '@Documented', '@Inherited', '@Repeatable'],
      difficulty: 'Intermediate',
    },
    {
      id: 'java-annotations-q5',
      question: 'Explain the three retention policies.',
      answer: "SOURCE annotations are discarded by the compiler (e.g. `@Override`, Lombok annotations). CLASS annotations are written into the .class file but are not available at runtime through reflection; this is the default. RUNTIME annotations are kept in the class file and loaded by the JVM, so reflection can read them; Spring, JPA, Jackson and JUnit annotations all use RUNTIME.",
      points: ['SOURCE: compile time only', 'CLASS: default, not reflective', 'RUNTIME: readable via reflection'],
      difficulty: 'Intermediate',
    },
    {
      id: 'java-annotations-q6',
      question: 'How do you create a custom annotation and read it at runtime?',
      answer: "Declare it with `@interface`, add `@Retention(RetentionPolicy.RUNTIME)` and a suitable `@Target`, and define elements with optional defaults. At runtime, get the `Class`, `Method` or `Field` via reflection and call `getAnnotation(MyAnnotation.class)` or `isAnnotationPresent(...)`, then read its element values like method calls.",
      example: `@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.METHOD)
@interface Role { String value(); }

class Admin {
    @Role("ADMIN")
    public void deleteUser() { }
}

Method m = Admin.class.getMethod("deleteUser");
if (m.isAnnotationPresent(Role.class)) {
    System.out.println(m.getAnnotation(Role.class).value());  // ADMIN
}`,
      points: ['Use @interface', 'RUNTIME retention is required for reflection', 'getAnnotation returns an object with element accessors'],
      difficulty: 'Intermediate',
    },
    {
      id: 'java-annotations-q7',
      question: 'How does Spring use annotations internally?',
      answer: "At startup Spring scans the classpath for classes with stereotype annotations (`@Component`, `@Service`, `@Repository`, `@Controller`, `@Configuration`) and registers them as beans. It reads metadata such as `@Autowired`, `@Value` and `@Qualifier` to inject dependencies. For behavioural annotations (`@Transactional`, `@Cacheable`, `@Async`, `@PreAuthorize`), bean post-processors wrap the bean in a proxy that applies the extra logic around method calls.\n\nSpring also merges meta-annotations, so composed annotations like `@RestController` (`@Controller` + `@ResponseBody`) or `@SpringBootApplication` work, using utilities such as `AnnotatedElementUtils`. For speed, component scanning reads class files with ASM instead of loading every class.",
      points: ['Component scanning + bean registration', 'Dependency injection via annotation metadata', 'Proxies for @Transactional, @Cacheable, @Async', 'Composed/meta-annotation support'],
      difficulty: 'Advanced',
    },
    {
      id: 'java-annotations-q8',
      question: 'What is the difference between runtime annotation processing and compile-time annotation processing?',
      answer: "Runtime processing uses reflection on RUNTIME-retained annotations while the program runs; Spring, Hibernate and JUnit do this. It is flexible but costs startup time. Compile-time processing uses an annotation processor (implementing `javax.annotation.processing.Processor`, registered with the compiler) that runs during `javac`, reads annotations (often SOURCE or CLASS retention) and generates new source files. Lombok, MapStruct, Dagger and the JPA metamodel generator work this way, giving zero runtime reflection overhead and earlier error detection.",
      points: ['Runtime: reflection, flexible, slower startup', 'Compile time: generated code, no reflection', 'Examples: Spring vs MapStruct/Dagger', 'Lombok modifies the compiler AST'],
      difficulty: 'Advanced',
    },
  ],
}

export default topic
