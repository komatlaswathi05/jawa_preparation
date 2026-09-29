const topic = {
  id: 'java-jvm',
  category: 'java',
  title: 'JVM & Memory',
  description: 'How the Java Virtual Machine loads, runs and cleans up your code: class loaders, heap, stack, metaspace, garbage collection and debugging memory problems.',
  difficulty: 'Advanced',
  overview: "The JVM (Java Virtual Machine) is the program that actually runs your Java code. The compiler `javac` turns your `.java` files into bytecode (`.class` files), a portable instruction set. The JVM loads that bytecode, checks it, and executes it, first by interpreting it and then by compiling hot code into fast machine code with the JIT (Just-In-Time) compiler. This is why Java is \"write once, run anywhere\": the same bytecode runs on any machine that has a JVM.\n\nThink of the JVM as a well-run office building. The class loader is the reception desk that lets people (classes) in. The heap is the big shared warehouse where all objects are stored. Each worker (thread) has a personal notepad (the stack) for the task at hand. The garbage collector is the cleaning crew that throws away boxes nobody uses any more.\n\nUnderstanding the JVM matters for backend developers because production problems like slow responses, `OutOfMemoryError`, memory leaks and long GC pauses can only be fixed if you know where memory lives and how to inspect it. Interviewers use these questions to see if you can debug real systems, not just write code.",

  subtopics: [
    {
      id: 'jvm-architecture',
      title: 'JVM Architecture',
      explanation: "The JVM has three main parts. The class loader subsystem loads, links and initializes classes. The runtime data areas are the memory regions: heap, stacks, metaspace (method area), program counter registers and native method stacks. The execution engine runs the bytecode using an interpreter, the JIT compiler (which compiles frequently used methods to native code), and the garbage collector.\n\nAlso know the three acronyms: JDK (Java Development Kit: compiler, tools and a JRE), JRE (Java Runtime Environment: the JVM plus core libraries), and JVM (the engine itself). The heap and metaspace are shared by all threads; stacks, PC registers and native stacks are per thread.",
      example: `// Source -> bytecode -> JVM
// 1. javac Hello.java       -> Hello.class (bytecode)
// 2. java Hello             -> JVM loads, verifies, runs it
// 3. javap -c Hello         -> shows the bytecode instructions

public class Hello {
    public static void main(String[] args) {
        System.out.println("Hello JVM");
    }
}`,
      interviewPoints: [
        'Class loader, runtime data areas, execution engine.',
        'Shared: heap, metaspace. Per thread: stack, PC register, native method stack.',
        'JIT compiles hot methods to native code for speed.',
      ],
    },
    {
      id: 'classloader',
      title: 'ClassLoader',
      explanation: "A class loader finds a class's bytecode and loads it into the JVM, usually the first time the class is used (lazy loading). There are three built-in loaders: the Bootstrap loader (loads core classes like `java.lang.String`), the Platform loader (other JDK modules, called Extension loader before Java 9), and the Application or System loader (your classes and libraries on the classpath).\n\nThey follow the parent delegation model: a loader first asks its parent to load a class and only tries itself if the parent cannot. This stops anyone from replacing core classes with a fake `java.lang.String`. Loading has three phases: loading (read bytes), linking (verify, prepare static fields with default values, resolve references), and initialization (run static initializers).",
      example: `public class LoaderDemo {
    public static void main(String[] args) {
        System.out.println(String.class.getClassLoader());     // null (Bootstrap)
        System.out.println(java.sql.Connection.class.getClassLoader()); // PlatformClassLoader
        System.out.println(LoaderDemo.class.getClassLoader()); // AppClassLoader
    }
}

// Common errors:
// ClassNotFoundException - Class.forName("x.Y") could not find the class at runtime
// NoClassDefFoundError    - class existed at compile time but is missing or failed init at runtime`,
      interviewPoints: [
        'Bootstrap -> Platform -> Application loaders.',
        'Parent delegation protects core classes.',
        'A class is identified by its name plus the class loader that loaded it.',
        'ClassNotFoundException vs NoClassDefFoundError.',
      ],
    },
    {
      id: 'heap',
      title: 'Heap',
      explanation: "The heap is the shared memory area where all objects and arrays live, whenever you write `new`. It is created when the JVM starts and is managed by the garbage collector, so you never free memory yourself. Its size is controlled with `-Xms` (initial size) and `-Xmx` (maximum size).\n\nThe heap is typically divided into a young generation (where new objects are created) and an old generation (where long-lived objects end up). Because all threads share it, objects on the heap can be accessed by any thread that has a reference to them.",
      example: `// JVM options
// java -Xms512m -Xmx2g -jar app.jar

User u = new User("Asha");   // User object on the heap, reference u on the stack
int[] scores = new int[1000]; // array object on the heap

Runtime rt = Runtime.getRuntime();
System.out.println("Max heap MB: " + rt.maxMemory() / 1024 / 1024);
System.out.println("Used MB: " + (rt.totalMemory() - rt.freeMemory()) / 1024 / 1024);`,
      interviewPoints: [
        'All objects and arrays live on the heap.',
        'Shared by all threads; managed by GC.',
        '-Xms initial, -Xmx maximum heap size.',
        'Running out gives OutOfMemoryError: Java heap space.',
      ],
    },
    {
      id: 'stack',
      title: 'Stack',
      explanation: "Every thread has its own stack. Each method call pushes a stack frame containing the method's local variables, parameters, partial results and the return address; when the method returns, its frame is popped. Primitive local variables (like `int x = 5`) are stored directly in the frame, while for objects the frame holds only the reference and the object itself is on the heap.\n\nStack memory is freed automatically and very fast, and it is thread-safe by nature because no other thread can see it. Its size per thread is set with `-Xss` (often 512 KB to 1 MB by default).",
      example: `public class StackDemo {
    public static void main(String[] args) {  // frame: args
        int a = 10;                           // frame: a = 10
        String name = "Ravi";                 // frame: reference -> String on heap
        int result = square(a);               // new frame pushed for square
        System.out.println(result);
    }

    static int square(int n) {                // frame: n
        int r = n * n;                        // frame: r
        return r;                             // frame popped
    }
}`,
      interviewPoints: [
        'One stack per thread; LIFO frames per method call.',
        'Holds primitives and object references, not objects.',
        'Freed automatically when methods return; not managed by GC.',
        'Too deep recursion gives StackOverflowError.',
      ],
    },
    {
      id: 'metaspace',
      title: 'Metaspace',
      explanation: "Metaspace stores class metadata: the structure of each loaded class, method bytecode, the runtime constant pool and similar information. It replaced the old PermGen (Permanent Generation) in Java 8. Unlike PermGen, metaspace lives in native memory outside the heap and grows automatically by default.\n\nYou can cap it with `-XX:MaxMetaspaceSize`. If an application keeps generating or loading classes without unloading them (for example repeated redeploys in an app server, or heavy use of dynamic proxies), you get `OutOfMemoryError: Metaspace`. Note that static variables and the String pool live on the heap, not in metaspace.",
      example: `// Limit metaspace
// java -XX:MetaspaceSize=128m -XX:MaxMetaspaceSize=256m -jar app.jar

// Check metaspace usage of a running JVM
// jcmd <pid> VM.metaspace
// jstat -gc <pid>        (MC / MU columns = metaspace capacity / used)`,
      interviewPoints: [
        'Java 8 replaced PermGen with Metaspace.',
        'Metaspace uses native memory, not the heap.',
        'Holds class metadata; class leaks cause OutOfMemoryError: Metaspace.',
      ],
    },
    {
      id: 'garbage-collection',
      title: 'Garbage Collection',
      explanation: "Garbage collection (GC) automatically frees memory used by objects that are no longer reachable. An object is reachable if you can get to it by following references starting from GC roots: local variables on thread stacks, static fields, active threads and JNI references. Anything not reachable is garbage, even if objects reference each other in a cycle.\n\nMost collectors work in phases: mark (find live objects), sweep (free the dead ones) and often compact (move live objects together to avoid fragmentation). Some phases pause application threads, called stop-the-world pauses. Common collectors: Serial (single thread, small apps), Parallel (throughput), G1 (default since Java 9, balances throughput and pause time), and ZGC/Shenandoah (very low pauses, even for huge heaps).\n\nYou cannot force GC: `System.gc()` is only a hint. Setting a reference to null only helps if nothing else still points to the object.",
      example: `// Choosing a collector
// java -XX:+UseG1GC -XX:MaxGCPauseMillis=200 -jar app.jar   (default)
// java -XX:+UseZGC -jar app.jar                            (low latency)
// java -XX:+UseParallelGC -jar app.jar                     (batch throughput)

void process() {
    User temp = new User("temp");  // reachable while process() runs
    temp.doWork();
}   // after return, temp is unreachable -> eligible for GC`,
      interviewPoints: [
        'GC reclaims unreachable objects, starting from GC roots.',
        'Mark, sweep, compact; stop-the-world pauses.',
        'G1 is the default collector since Java 9; ZGC for low latency.',
        'System.gc() is only a request.',
      ],
    },
    {
      id: 'generational-gc',
      title: 'Generational GC',
      explanation: "Generational GC is based on the weak generational hypothesis: most objects die young (like temporary objects in a request), and objects that survive a while tend to live long. So the heap is split into a young generation and an old generation.\n\nThe young generation has Eden, where new objects are allocated, and two Survivor spaces (S0 and S1). When Eden fills, a fast minor GC copies live objects into a survivor space and wipes Eden. Objects that survive several minor GCs (the tenuring threshold, up to 15) are promoted to the old generation. When the old generation fills, a major or full GC runs, which is slower and causes longer pauses. G1 applies the same idea but divides the heap into many equal regions, each acting as Eden, Survivor or Old.",
      example: `// Young gen:  [ Eden | S0 | S1 ]   Old gen: [ long-lived objects ]
//
// 1. new objects        -> Eden
// 2. Eden full          -> minor GC: live objects -> S0, Eden cleared
// 3. next minor GC      -> live objects from Eden + S0 -> S1 (age + 1)
// 4. age > threshold    -> promoted to Old gen
// 5. Old gen full       -> major / full GC (slower, longer pause)

// Tuning examples
// -Xmn512m                        young generation size
// -XX:MaxTenuringThreshold=10     promote after 10 survivals`,
      interviewPoints: [
        'Most objects die young, so young-gen GC is frequent and cheap.',
        'Eden + two Survivor spaces; survivors age and get promoted.',
        'Minor GC = young gen; major/full GC = old gen or whole heap.',
      ],
    },
    {
      id: 'memory-leaks',
      title: 'Memory Leaks',
      explanation: "In Java a memory leak means objects that you no longer need are still reachable, so the GC cannot free them. The heap slowly fills up, GC runs more often and takes longer, and eventually the application crashes with `OutOfMemoryError`.\n\nTypical causes: static collections or caches that only grow, listeners or callbacks registered and never removed, `ThreadLocal` values not removed in thread pools, unclosed resources (streams, connections), mutable objects used as `HashMap` keys, and inner classes holding a hidden reference to a large outer object. Fix them with bounded caches (like Caffeine with a maximum size), try-with-resources, `ThreadLocal.remove()` in a finally block, and removing listeners.",
      example: `public class ReportService {
    // LEAK: grows forever, never cleared
    private static final Map<String, byte[]> CACHE = new HashMap<>();

    public byte[] getReport(String id) {
        return CACHE.computeIfAbsent(id, this::generate);
    }

    private byte[] generate(String id) {
        return new byte[1024 * 1024]; // 1 MB per report
    }
}

// ThreadLocal in a thread pool: always clean up
private static final ThreadLocal<UserContext> CTX = new ThreadLocal<>();
void handle(Request r) {
    CTX.set(new UserContext(r.user()));
    try {
        process(r);
    } finally {
        CTX.remove();   // otherwise the pooled thread keeps it forever
    }
}`,
      interviewPoints: [
        'Leak = unwanted objects still reachable.',
        'Static collections, listeners, ThreadLocals and unclosed resources are common culprits.',
        'Find leaks by comparing heap dumps and looking at the largest retained sizes.',
      ],
    },
    {
      id: 'stackoverflowerror-outofmemoryerror',
      title: 'StackOverflowError & OutOfMemoryError',
      explanation: "`StackOverflowError` happens when a thread's stack runs out of space, almost always because of infinite or very deep recursion (a method calling itself with no working base case), or cyclic calls such as two `toString()` methods calling each other. Fix the recursion or convert it to a loop; increasing `-Xss` only helps for legitimately deep recursion.\n\n`OutOfMemoryError` means the JVM cannot allocate memory. The message tells you where: \"Java heap space\" (heap full: leak or heap too small), \"GC overhead limit exceeded\" (GC spends most of its time freeing almost nothing), \"Metaspace\" (too many classes), \"unable to create native thread\" (too many threads for the OS), and \"Direct buffer memory\" (off-heap NIO buffers). Both are `Error`s, not `Exception`s, and should generally not be caught.",
      example: `// StackOverflowError
static int factorial(int n) {
    return n * factorial(n - 1);    // no base case!
}

// Fixed
static long factorialSafe(int n) {
    long result = 1;
    for (int i = 2; i <= n; i++) result *= i;
    return result;
}

// OutOfMemoryError: Java heap space
List<byte[]> hog = new ArrayList<>();
while (true) {
    hog.add(new byte[10 * 1024 * 1024]); // 10 MB each, never released
}`,
      interviewPoints: [
        'StackOverflowError: stack exhausted, usually recursion.',
        'OutOfMemoryError: heap, metaspace, native threads or direct memory exhausted.',
        'Both extend VirtualMachineError, which extends Error.',
      ],
    },
    {
      id: 'jvm-debugging',
      title: 'JVM Debugging Basics (jstack, jmap, jcmd, heap dumps, GC logs, VisualVM/JFR)',
      explanation: "The JDK ships with tools to look inside a running JVM. `jps` lists Java process ids. `jstack <pid>` prints a thread dump showing every thread's state and stack trace; use it for hangs, high CPU and deadlocks. `jmap -dump:live,format=b,file=heap.hprof <pid>` writes a heap dump, a snapshot of every object in memory. `jcmd` is the modern all-in-one tool: `jcmd <pid> Thread.print`, `jcmd <pid> GC.heap_dump file.hprof`, `jcmd <pid> GC.heap_info`, `jcmd <pid> VM.flags`.\n\nAlways run production apps with `-XX:+HeapDumpOnOutOfMemoryError` so you automatically get a dump when it crashes, and enable GC logs with `-Xlog:gc*` to see how often GC runs and how long pauses are. Analyse heap dumps with Eclipse MAT or VisualVM: look at the dominator tree and objects with the largest retained size. VisualVM gives live graphs of heap, threads and CPU. Java Flight Recorder (JFR) records low-overhead profiling data in production (`jcmd <pid> JFR.start duration=60s filename=rec.jfr`), which you open in JDK Mission Control.",
      example: `# Find the process id
jps -l

# Thread dump (hangs, deadlocks, high CPU)
jstack 12345 > threads.txt
jcmd 12345 Thread.print

# Heap dump (memory leaks)
jcmd 12345 GC.heap_dump /tmp/heap.hprof
jmap -dump:live,format=b,file=/tmp/heap.hprof 12345

# Live GC statistics every 1 second
jstat -gcutil 12345 1000

# Recommended production flags
java -Xmx2g \\
     -XX:+HeapDumpOnOutOfMemoryError \\
     -XX:HeapDumpPath=/var/log/app/ \\
     -Xlog:gc*:file=/var/log/app/gc.log:time,uptime \\
     -jar app.jar

# 60-second Java Flight Recorder profile
jcmd 12345 JFR.start duration=60s filename=/tmp/rec.jfr`,
      interviewPoints: [
        'Thread dump (jstack / jcmd Thread.print) for hangs and deadlocks.',
        'Heap dump (jmap / jcmd GC.heap_dump) analysed in Eclipse MAT or VisualVM for leaks.',
        'Always enable HeapDumpOnOutOfMemoryError and GC logging in production.',
        'JFR is low-overhead enough to run in production.',
      ],
    },
  ],

  commonMistakes: [
    'Thinking objects are stored on the stack; only primitives and references are, the objects themselves live on the heap.',
    'Calling System.gc() to "fix" memory problems; it is only a hint and does not fix leaks.',
    'Believing Java cannot have memory leaks because it has a garbage collector.',
    'Simply increasing -Xmx when OutOfMemoryError appears, without taking a heap dump to find the real cause.',
    'Catching StackOverflowError or OutOfMemoryError and continuing, leaving the application in an unreliable state.',
    'Confusing ClassNotFoundException (class not found when loading dynamically) with NoClassDefFoundError (class present at compile time but missing or broken at runtime).',
    'Setting container memory limits equal to -Xmx and forgetting that metaspace, thread stacks and direct buffers also use memory outside the heap.',
  ],

  interviewTips: [
    'Draw the memory layout while you explain: stack per thread with references pointing into a shared heap, plus metaspace for classes.',
    'When asked how you would debug a memory problem, give a concrete sequence: check GC logs, take a heap dump, open it in MAT, find the largest retained objects, trace them back to GC roots.',
    'For a hanging application, say you would take two or three thread dumps a few seconds apart and compare them.',
    'Mention real flags such as -Xmx, -Xss, -XX:+HeapDumpOnOutOfMemoryError and -Xlog:gc*; it shows production experience.',
    'Know which GC is default (G1 since Java 9) and when you might choose ZGC (large heaps, strict latency requirements).',
  ],

  interviewQuestions: [
    {
      id: 'java-jvm-q1',
      question: 'What is the difference between JDK, JRE and JVM?',
      answer: "The JVM (Java Virtual Machine) is the engine that loads and executes bytecode on a specific platform, handling memory management and garbage collection. The JRE (Java Runtime Environment) is the JVM plus the core class libraries needed to run Java programs. The JDK (Java Development Kit) is the JRE plus development tools such as the compiler `javac`, `jar`, `javadoc`, and diagnostic tools like `jcmd`, `jstack` and `jmap`.\n\nSince Java 11, Oracle no longer ships a separate JRE download; you install a JDK and can build a minimal runtime with `jlink`.",
      points: [
        'JVM runs bytecode.',
        'JRE = JVM + libraries.',
        'JDK = JRE + development and diagnostic tools.',
      ],
      difficulty: 'Beginner',
    },
    {
      id: 'java-jvm-q2',
      question: 'What is the difference between stack and heap memory?',
      answer: "The stack is per thread and stores method call frames: local primitive variables, parameters and object references. Memory is allocated and freed automatically as methods are called and return, which is very fast, and it is private to the thread. The heap is shared by all threads and stores every object and array created with `new`. It is managed by the garbage collector.\n\nIf the stack runs out (usually deep recursion) you get `StackOverflowError`; if the heap runs out you get `OutOfMemoryError: Java heap space`. The stack is much smaller than the heap and its size is set with `-Xss`, while the heap size is set with `-Xms`/`-Xmx`.",
      example: `void createUser() {
    int age = 30;                  // stack
    User u = new User("Asha", age); // reference u on stack, User object on heap
}`,
      points: [
        'Stack: per thread, frames, primitives and references, LIFO.',
        'Heap: shared, all objects, garbage collected.',
        'StackOverflowError vs OutOfMemoryError.',
      ],
      difficulty: 'Beginner',
    },
    {
      id: 'java-jvm-q3',
      question: 'What is garbage collection and how does the JVM decide an object is garbage?',
      answer: "Garbage collection is the JVM's automatic process of reclaiming memory from objects that are no longer used, so developers do not free memory manually. The JVM decides an object is garbage using reachability: it starts from GC roots (local variables in active stack frames, static fields, active threads, JNI references) and follows references. Every object it can reach is alive; everything else is garbage.\n\nBecause of this, objects that only reference each other in a cycle are still collected if nothing reachable points to them. You cannot force GC; `System.gc()` is only a suggestion.",
      points: [
        'Reachability from GC roots, not reference counting.',
        'Cycles of unreachable objects are collected.',
        'Mark, sweep, compact phases.',
      ],
      difficulty: 'Beginner',
    },
    {
      id: 'java-jvm-q4',
      question: 'Explain the class loading mechanism and the parent delegation model.',
      answer: "When a class is needed for the first time, a class loader finds its bytecode, then the JVM links it (verifies the bytecode, allocates static fields with default values, resolves symbolic references) and initializes it (runs static initializers and assigns static field values).\n\nJava has a hierarchy of loaders: Bootstrap (core JDK classes), Platform (other JDK modules) and Application (classpath). With parent delegation, a loader first delegates the request to its parent and only loads the class itself if the parent cannot. This ensures core classes like `java.lang.String` always come from the Bootstrap loader, prevents duplicate loading, and blocks malicious replacements. Frameworks and app servers use custom class loaders for features like hot reload (Spring Boot DevTools uses a restart class loader).",
      points: [
        'Loading, linking (verify, prepare, resolve), initialization.',
        'Bootstrap, Platform, Application loaders.',
        'Delegate to parent first for safety and consistency.',
        'Same class name loaded by two loaders = two different classes.',
      ],
      difficulty: 'Intermediate',
    },
    {
      id: 'java-jvm-q5',
      question: 'How does generational garbage collection work?',
      answer: "Generational GC relies on the observation that most objects die young. The heap is divided into a young generation (Eden plus two Survivor spaces) and an old generation. New objects go into Eden. When Eden is full, a minor GC copies the surviving objects into a survivor space and clears Eden completely; survivors are copied back and forth between the two survivor spaces, and their age increases each time.\n\nObjects that survive enough minor GCs (the tenuring threshold) are promoted to the old generation. Minor GCs are frequent but fast because they only look at a small area with mostly dead objects. When the old generation fills up, a major or full GC runs, which is slower and pauses the application longer. G1 uses the same generational idea with the heap split into many regions.",
      points: [
        'Young gen: Eden + S0 + S1; old gen for long-lived objects.',
        'Minor GC is frequent and cheap; full GC is rare and expensive.',
        'Objects are promoted after surviving several minor GCs.',
      ],
      difficulty: 'Intermediate',
    },
    {
      id: 'java-jvm-q6',
      question: 'What is Metaspace, and how is it different from PermGen?',
      answer: "Metaspace is the memory area that stores class metadata such as class structures, method bytecode and the runtime constant pool. It was introduced in Java 8 to replace PermGen.\n\nPermGen was part of the heap with a fixed maximum size (`-XX:MaxPermSize`), so applications that loaded many classes often crashed with `OutOfMemoryError: PermGen space`. Metaspace uses native memory and grows automatically by default, which removes most of those failures, though you can still cap it with `-XX:MaxMetaspaceSize` and get `OutOfMemoryError: Metaspace` if classes leak. Interned strings and static variables moved to the heap.",
      points: [
        'Metaspace replaced PermGen in Java 8.',
        'Native memory, auto-growing, cap with MaxMetaspaceSize.',
        'Class loader leaks can still exhaust it.',
      ],
      difficulty: 'Intermediate',
    },
    {
      id: 'java-jvm-q7',
      question: 'What causes StackOverflowError and OutOfMemoryError, and how do you fix them?',
      answer: "`StackOverflowError` occurs when a thread's stack has no room for another frame. The usual cause is recursion without a proper base case, or unintended mutual recursion such as two entities whose `toString()` or `hashCode()` call each other (common with bidirectional JPA relationships). Fix the logic or rewrite deep recursion as a loop; raising `-Xss` is only for genuinely deep, correct recursion.\n\n`OutOfMemoryError` occurs when the JVM cannot allocate memory in some area. For \"Java heap space\", check for leaks with a heap dump and only then consider raising `-Xmx`. For \"Metaspace\", look for class loader leaks. For \"unable to create native thread\", reduce thread count or use a pool. Read the message, because it tells you which memory area ran out.",
      example: `@Entity
class Author {
    @OneToMany(mappedBy = "author")
    List<Book> books;
    public String toString() { return "Author" + books; }   // calls Book.toString
}

@Entity
class Book {
    @ManyToOne
    Author author;
    public String toString() { return "Book" + author; }    // calls Author.toString -> StackOverflowError
}`,
      points: [
        'StackOverflowError: recursion depth, cyclic toString/hashCode.',
        'OutOfMemoryError: read the message to know which area.',
        'Diagnose with heap dumps before increasing memory.',
        'Both are Errors and should not normally be caught.',
      ],
      difficulty: 'Intermediate',
    },
    {
      id: 'java-jvm-q8',
      question: 'Can Java have memory leaks? How would you find and fix one in production?',
      answer: "Yes. Java has no leaks of unreachable memory, but it leaks when objects you no longer need are still reachable, so the GC is not allowed to free them. Classic causes are static maps or caches that only grow, listeners never unregistered, `ThreadLocal` values left on pooled threads, unclosed resources, and sessions holding large objects.\n\nTo find one: watch heap usage in monitoring or GC logs; a sawtooth pattern whose low point keeps rising after each full GC is the classic sign. Take heap dumps (`jcmd <pid> GC.heap_dump`) at two points in time, or rely on `-XX:+HeapDumpOnOutOfMemoryError`. Open them in Eclipse MAT or VisualVM, check the dominator tree and the objects with the largest retained size, and follow the path to GC roots to see what is holding them. Fix the root cause: bound or expire the cache, remove listeners, call `ThreadLocal.remove()` in finally, use try-with-resources.",
      example: `# Production diagnosis steps
jcmd 12345 GC.heap_info                 # current heap usage
jcmd 12345 GC.heap_dump /tmp/before.hprof
# ...wait while memory grows...
jcmd 12345 GC.heap_dump /tmp/after.hprof
# Open both in Eclipse MAT -> Dominator Tree -> Path to GC Roots`,
      points: [
        'Leak = unwanted but still reachable objects.',
        'Rising post-GC baseline in GC logs indicates a leak.',
        'Heap dump + MAT dominator tree + path to GC roots.',
        'Use bounded caches (e.g. Caffeine with maximumSize or expireAfterWrite).',
      ],
      difficulty: 'Advanced',
    },
    {
      id: 'java-jvm-q9',
      question: 'Your Spring Boot application is hanging or using 100% CPU. How do you investigate?',
      answer: "Start with a thread dump, because it shows what every thread is doing. Find the process id with `jps -l`, then run `jstack <pid>` or `jcmd <pid> Thread.print` two or three times, a few seconds apart. Threads stuck in the same place across dumps are the suspects. Many threads BLOCKED on the same lock point to lock contention; \"Found one Java-level deadlock\" points to a deadlock; many threads WAITING on a connection pool suggest pool exhaustion or a slow database.\n\nFor high CPU, use `top -H -p <pid>` to find the busiest native thread id, convert it to hex, and match it to the `nid` field in the thread dump. Also check GC logs: if the JVM is constantly running full GCs, the CPU is burned by the garbage collector because the heap is nearly full. For deeper profiling, record a Java Flight Recorder session with `jcmd <pid> JFR.start duration=60s filename=rec.jfr` and open it in JDK Mission Control.",
      example: `jps -l
top -H -p 12345                   # find hot thread, e.g. 12400
printf '%x\\n' 12400               # -> 3070
jstack 12345 | grep -A 20 'nid=0x3070'
jcmd 12345 JFR.start duration=60s filename=/tmp/cpu.jfr`,
      points: [
        'Take multiple thread dumps and compare.',
        'Look for BLOCKED threads, deadlocks and pool waits.',
        'Map hot OS threads to Java threads via nid in hex.',
        'Rule out GC thrashing using GC logs; profile with JFR.',
      ],
      difficulty: 'Advanced',
    },
    {
      id: 'java-jvm-q10',
      question: 'Compare the main garbage collectors: Serial, Parallel, G1 and ZGC.',
      answer: "Serial GC uses a single thread and stops the application for every collection; it suits small heaps and single-CPU containers. Parallel GC uses many threads for collection and maximises throughput (total work done), but pauses can be long; good for batch jobs. G1 (Garbage First), the default since Java 9, splits the heap into regions, collects the regions with the most garbage first, and aims for a configurable pause target (`-XX:MaxGCPauseMillis`, 200 ms by default); it is a good general choice for services.\n\nZGC (production-ready since Java 15, generational since Java 21) does almost all its work concurrently with the application, keeping pauses typically under a millisecond even for heaps of many gigabytes or terabytes, at some cost in throughput and memory. Shenandoah is a similar low-pause collector. Choose based on the priority: throughput, predictable latency, or footprint.",
      example: `java -XX:+UseSerialGC   -jar app.jar
java -XX:+UseParallelGC -jar app.jar
java -XX:+UseG1GC -XX:MaxGCPauseMillis=100 -jar app.jar
java -XX:+UseZGC -jar app.jar`,
      points: [
        'Serial: simple, small heaps.',
        'Parallel: maximum throughput, longer pauses.',
        'G1: default, region-based, pause-time goals.',
        'ZGC/Shenandoah: concurrent, sub-millisecond pauses, large heaps.',
      ],
      difficulty: 'Advanced',
    },
  ],
}

export default topic
