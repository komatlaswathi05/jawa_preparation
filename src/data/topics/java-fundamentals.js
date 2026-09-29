const topic = {
  id: 'java-fundamentals',
  category: 'java',
  title: 'Java Fundamentals',
  description: 'The building blocks of Java: how code runs on the JVM, variables, data types, operators, control flow, arrays and wrapper classes.',
  difficulty: 'Beginner',
  overview: "Java is a general-purpose, object-oriented programming language created at Sun Microsystems in 1995 and now maintained by Oracle and the OpenJDK community. It is one of the most popular languages for backend services, Android apps and large enterprise systems. Frameworks like Spring Boot are built on top of it.\n\nThe big idea behind Java is \"write once, run anywhere\". You write your code once, compile it into a portable format called bytecode, and that bytecode runs on any machine that has a Java Virtual Machine (JVM). Think of bytecode like a movie file and the JVM like a media player: the same file plays on Windows, macOS or Linux as long as a player is installed.\n\nThis topic covers the fundamentals every interviewer expects you to know cold: the difference between JDK, JRE and JVM, how compilation works, variables and data types, operators, loops and conditions, arrays, and wrapper classes with autoboxing. Master these and every later topic (OOP, collections, Spring) becomes much easier.",

  subtopics: [
    {
      id: 'what-is-java',
      title: 'What is Java',
      explanation: "Java is a high-level, class-based, object-oriented language. High-level means you write code that reads close to English and don't manage hardware details like memory addresses yourself.\n\nEvery Java program is made of classes, and execution starts from a special method called `main`. Java is statically typed, which means every variable has a type that is checked when you compile, catching many bugs before the program ever runs.",
      example: `public class HelloWorld {
    public static void main(String[] args) {
        System.out.println("Hello, Java!");
    }
}`,
      interviewPoints: [
        'Java is statically typed, object-oriented and compiled to bytecode',
        'Program execution starts at `public static void main(String[] args)`',
        'Used heavily for backend services, Android and enterprise systems',
      ],
    },
    {
      id: 'features-of-java',
      title: 'Features of Java',
      explanation: "Java's main features are: simple (no pointers or manual memory management), object-oriented, platform independent, secure (runs inside the JVM sandbox, no direct memory access), robust (strong type checking, exception handling, garbage collection), multithreaded (built-in support for running tasks in parallel), and high performance thanks to the JIT (Just-In-Time) compiler.\n\nGarbage collection is a big one: the JVM automatically frees memory for objects that are no longer used, so you never call `free()` like in C.",
      interviewPoints: [
        'Key features: platform independent, object-oriented, robust, secure, multithreaded',
        'Automatic garbage collection removes most memory-leak and dangling-pointer bugs',
        'The JIT compiler turns hot bytecode into native machine code for speed',
      ],
    },
    {
      id: 'jdk-jre-jvm',
      title: 'JDK, JRE and JVM',
      explanation: "The JVM (Java Virtual Machine) is the engine that actually runs bytecode. It loads classes, verifies them, manages memory and garbage collection, and executes code.\n\nThe JRE (Java Runtime Environment) is the JVM plus the standard class libraries (like `java.lang` and `java.util`) needed to run programs. The JDK (Java Development Kit) is the JRE plus developer tools such as the compiler `javac`, the debugger and `jar`.\n\nA simple way to remember it: JDK = JRE + dev tools, and JRE = JVM + libraries. Since Java 11, Oracle no longer ships a separate JRE download; you usually install a JDK.",
      example: `# Compile with the JDK's compiler
javac HelloWorld.java

# Run with the JVM
java HelloWorld

# Check your installed version
java -version`,
      interviewPoints: [
        'JDK contains JRE; JRE contains JVM',
        'You need the JDK to compile code, only a runtime to run it',
        'The JVM is platform-specific, but the bytecode it runs is not',
      ],
    },
    {
      id: 'compilation-and-bytecode',
      title: 'Java Compilation and Bytecode',
      explanation: "Running a Java program is a two-step process. First, the compiler `javac` reads your `.java` source file and produces a `.class` file containing bytecode. Bytecode is a compact set of instructions for the JVM, not for any real CPU.\n\nSecond, the `java` command starts a JVM, which loads the `.class` file through the class loader, verifies the bytecode is safe, and executes it. At first the JVM interprets bytecode, and then the JIT compiler converts frequently used code into fast native machine code.",
      example: `// File: Greeter.java
public class Greeter {
    public static void main(String[] args) {
        System.out.println("Hi!");
    }
}

// Terminal:
// javac Greeter.java   -> produces Greeter.class (bytecode)
// java Greeter         -> JVM runs the bytecode
// javap -c Greeter     -> shows the bytecode instructions`,
      interviewPoints: [
        'Source (.java) -> javac -> bytecode (.class) -> JVM -> machine code',
        'The JVM uses both an interpreter and a JIT compiler',
        'Since Java 11 you can run a single file directly: `java Greeter.java`',
      ],
    },
    {
      id: 'platform-independence',
      title: 'Platform Independence',
      explanation: "Platform independence means the same compiled `.class` files run on any operating system without recompiling. This works because you compile to bytecode, not to Windows or Linux machine code.\n\nThe trick is that each operating system has its own JVM implementation. The JVM is platform-dependent, but it understands the same bytecode everywhere. So Java the language and its bytecode are platform independent, while the JVM itself is not.",
      interviewPoints: [
        'Bytecode is platform independent; the JVM is platform dependent',
        '"Write once, run anywhere" (WORA) is the classic slogan',
        'Contrast with C/C++, which compile to OS- and CPU-specific binaries',
      ],
    },
    {
      id: 'variables',
      title: 'Variables',
      explanation: "A variable is a named box that holds a value. In Java you declare the type first, then the name, e.g. `int age = 25;`.\n\nThere are three kinds: local variables (declared inside a method, must be initialised before use), instance variables (fields that belong to each object, get default values like 0 or null), and static variables (shared by all objects of the class). Since Java 10 you can use `var` for local variables and let the compiler infer the type, but the type is still fixed at compile time.",
      example: `public class Counter {
    static int totalCounters = 0;   // static variable (shared)
    int count;                       // instance variable (default 0)

    void increment() {
        int step = 1;                // local variable (no default!)
        count += step;
    }

    public static void main(String[] args) {
        var message = "inferred as String";  // Java 10+ local type inference
        System.out.println(message);
    }
}`,
      interviewPoints: [
        'Local variables have no default value; the compiler forces you to initialise them',
        'Instance and static fields get default values (0, false, null)',
        '`var` is type inference, not dynamic typing',
      ],
    },
    {
      id: 'data-types',
      title: 'Data Types: Primitive vs Reference',
      explanation: "Java has two families of types. Primitive types store the actual value directly and are not objects. Reference types (classes, interfaces, arrays, enums, records) store a reference, which is like an address pointing to an object on the heap.\n\nThis difference matters: copying a primitive copies the value, while copying a reference makes two variables point to the same object. Reference variables can also be `null`, meaning they point to nothing, while primitives can never be null.",
      example: `int a = 10;
int b = a;      // b gets a copy of the value
b = 20;         // a is still 10

int[] x = {1, 2, 3};
int[] y = x;    // y points to the SAME array
y[0] = 99;      // x[0] is now 99 too

String name = null;  // references can be null
// int n = null;     // compile error: primitives can't be null`,
      interviewPoints: [
        'Primitives hold values; references hold addresses of objects',
        'Java is always pass-by-value; for objects the value passed is the reference',
        'Only reference types can be null',
      ],
    },
    {
      id: 'primitive-types',
      title: 'Primitive Types',
      explanation: "Java has exactly 8 primitive types. Integers: `byte` (8-bit), `short` (16-bit), `int` (32-bit) and `long` (64-bit). Decimals: `float` (32-bit) and `double` (64-bit). Plus `char` (16-bit Unicode character) and `boolean` (true or false).\n\nUse `int` for most whole numbers, `long` for large values like timestamps, and `double` for decimals. Never use `float` or `double` for money because they cannot represent values like 0.1 exactly; use `BigDecimal` instead.",
      example: `byte small = 127;               // -128 to 127
short s = 32_000;               // underscores improve readability
int count = 2_000_000_000;      // about +/- 2.1 billion
long big = 9_000_000_000L;      // needs L suffix
float price = 9.99f;            // needs f suffix
double pi = 3.14159;            // default for decimals
char grade = 'A';
boolean active = true;

System.out.println(0.1 + 0.2);  // 0.30000000000000004`,
      interviewPoints: [
        '8 primitives: byte, short, int, long, float, double, char, boolean',
        'Integer literals default to int, decimal literals default to double',
        'Integer overflow wraps around silently (Integer.MAX_VALUE + 1 becomes negative)',
        'Use BigDecimal for currency',
      ],
    },
    {
      id: 'reference-types',
      title: 'Reference Types',
      explanation: "Any type that is not one of the 8 primitives is a reference type: `String`, arrays, your own classes, interfaces, enums and records. The variable lives on the stack (for locals) and holds a reference, while the actual object lives on the heap.\n\nThe default value of a reference field is `null`. Calling a method on a null reference throws a `NullPointerException`, the most common runtime error in Java.",
      example: `public class Person {
    String name;
}

Person p1 = new Person();   // object created on the heap
p1.name = "Asha";
Person p2 = p1;             // both refer to the same object
p2.name = "Ravi";
System.out.println(p1.name); // Ravi

Person p3 = null;
// p3.name.length();        // NullPointerException at runtime`,
      interviewPoints: [
        'Objects live on the heap; references to them can be on the stack',
        '`==` on references compares addresses, not content',
        'NullPointerException happens when you dereference null',
      ],
    },
    {
      id: 'type-casting',
      title: 'Type Casting',
      explanation: "Type casting converts a value from one type to another. Widening (implicit) casting goes from a smaller type to a bigger one, like `int` to `long`, and happens automatically because no data is lost.\n\nNarrowing (explicit) casting goes from bigger to smaller, like `double` to `int`. You must write the cast yourself, and data may be lost: decimals are truncated and large values can overflow. For objects, upcasting (child to parent) is automatic, while downcasting (parent to child) needs an explicit cast and can throw `ClassCastException`.",
      example: `int i = 100;
long l = i;              // widening: automatic
double d = i;            // widening: 100.0

double price = 9.99;
int whole = (int) price; // narrowing: 9 (decimal truncated)

int large = 300;
byte b = (byte) large;   // 44, value overflowed

Object obj = "hello";            // upcast
if (obj instanceof String str) { // pattern matching (Java 16+)
    System.out.println(str.length());
}`,
      interviewPoints: [
        'Widening is implicit and safe; narrowing is explicit and can lose data',
        'Order: byte -> short -> int -> long -> float -> double',
        'Use `instanceof` before downcasting objects to avoid ClassCastException',
      ],
    },
    {
      id: 'operators',
      title: 'Operators',
      explanation: "Operators perform actions on values. Arithmetic: `+ - * / %`. Relational: `== != > < >= <=`. Logical: `&&` (and), `||` (or), `!` (not). Assignment: `= += -= *=`. Unary: `++` and `--`. The ternary operator `condition ? a : b` is a compact if/else.\n\nTwo things trip up beginners. Integer division drops the remainder, so `7 / 2` is 3. And `&&` and `||` are short-circuit operators: if the left side already decides the result, the right side is never evaluated.",
      example: `int a = 7, b = 2;
System.out.println(a / b);     // 3 (integer division)
System.out.println(a % b);     // 1 (remainder)
System.out.println(a / 2.0);   // 3.5

int x = 5;
int y = x++;   // y = 5, then x becomes 6 (post-increment)
int z = ++x;   // x becomes 7, then z = 7 (pre-increment)

String s = null;
if (s != null && s.length() > 0) {  // short-circuit avoids NPE
    System.out.println(s);
}

String label = (a > b) ? "a is bigger" : "b is bigger";`,
      interviewPoints: [
        '`&&` and `||` short-circuit; `&` and `|` always evaluate both sides',
        '`x++` returns the old value, `++x` returns the new value',
        'Integer division truncates toward zero',
      ],
    },
    {
      id: 'if-else',
      title: 'if / else',
      explanation: "`if` runs a block of code only when a boolean condition is true. `else if` checks another condition, and `else` runs when nothing above matched. The condition must be a real `boolean`; unlike C, Java won't treat `0` or `1` as false or true.\n\nAlways use curly braces, even for one-line bodies. It prevents bugs when someone later adds a second line.",
      example: `int score = 82;

if (score >= 90) {
    System.out.println("Grade A");
} else if (score >= 75) {
    System.out.println("Grade B");
} else {
    System.out.println("Grade C");
}`,
      interviewPoints: [
        'The condition must be of type boolean',
        'Only the first matching branch runs',
      ],
    },
    {
      id: 'switch',
      title: 'switch',
      explanation: "`switch` picks one branch based on the value of an expression. It works with `int`, `char`, `String`, enums and their wrappers. In the classic form, each `case` needs a `break`, otherwise execution \"falls through\" into the next case.\n\nModern Java (14+) adds switch expressions with the arrow syntax `case X ->`. They don't fall through, can return a value, and the compiler checks that all enum values are covered.",
      example: `// Classic switch statement
String day = "SAT";
switch (day) {
    case "SAT":
    case "SUN":
        System.out.println("Weekend");
        break;
    default:
        System.out.println("Weekday");
}

// Modern switch expression (Java 14+)
int dayNumber = 3;
String name = switch (dayNumber) {
    case 1 -> "Monday";
    case 2 -> "Tuesday";
    case 3 -> "Wednesday";
    default -> "Unknown";
};`,
      interviewPoints: [
        'Forgetting `break` in a classic switch causes fall-through',
        'switch works with int-like types, String and enum, not long, float, double or boolean',
        'Arrow-style switch expressions return a value and have no fall-through',
      ],
    },
    {
      id: 'for-loop',
      title: 'for Loop and Enhanced for',
      explanation: "The classic `for` loop has three parts: initialisation, condition and update, e.g. `for (int i = 0; i < 5; i++)`. Use it when you know how many times to loop or need the index.\n\nThe enhanced for loop (for-each), `for (String s : list)`, walks through every element of an array or collection without an index. It is cleaner and less error-prone, but you can't use it to modify the array positions or remove items from a list.",
      example: `for (int i = 0; i < 5; i++) {
    System.out.println("i = " + i);
}

String[] fruits = {"apple", "banana", "cherry"};
for (String fruit : fruits) {
    System.out.println(fruit);
}`,
      interviewPoints: [
        'Use the index-based loop when you need the position',
        'Removing from a List inside for-each throws ConcurrentModificationException',
      ],
    },
    {
      id: 'while-and-do-while',
      title: 'while and do-while Loops',
      explanation: "A `while` loop checks the condition first and repeats while it is true. If the condition is false at the start, the body never runs. Use it when you don't know in advance how many iterations you need.\n\nA `do-while` loop runs the body first and checks the condition afterwards, so the body always runs at least once. It is handy for menus or \"ask until valid input\" logic. Note the semicolon after the `while (...)` in do-while.",
      example: `int n = 3;
while (n > 0) {
    System.out.println("Countdown: " + n);
    n--;
}

int attempts = 0;
do {
    attempts++;
    System.out.println("Attempt " + attempts);
} while (attempts < 3);`,
      interviewPoints: [
        'while may run zero times; do-while runs at least once',
        'Forgetting to update the loop variable causes an infinite loop',
      ],
    },
    {
      id: 'break-continue',
      title: 'break & continue',
      explanation: "`break` immediately exits the nearest loop (or switch). `continue` skips the rest of the current iteration and jumps to the next one.\n\nFor nested loops, you can put a label before the outer loop and use `break outer;` to exit both loops at once. Use labels sparingly, as they can make code harder to follow.",
      example: `for (int i = 1; i <= 10; i++) {
    if (i % 2 == 0) {
        continue;       // skip even numbers
    }
    if (i > 7) {
        break;          // stop the loop entirely
    }
    System.out.println(i);  // prints 1, 3, 5, 7
}

outer:
for (int r = 0; r < 3; r++) {
    for (int c = 0; c < 3; c++) {
        if (r * c == 2) {
            break outer;    // exits both loops
        }
    }
}`,
      interviewPoints: [
        '`break` exits the loop; `continue` skips to the next iteration',
        'Labeled break/continue control an outer loop',
      ],
    },
    {
      id: 'arrays',
      title: 'Arrays',
      explanation: "An array is a fixed-size container that holds values of one type in contiguous positions, accessed by a zero-based index. Once created, its length cannot change; use `ArrayList` if you need a growable list.\n\nArrays are objects in Java, so they live on the heap and have a `length` field (not a method). Accessing an index outside `0` to `length - 1` throws `ArrayIndexOutOfBoundsException`. The `java.util.Arrays` class has helpers like `sort`, `toString` and `fill`.",
      example: `int[] numbers = new int[5];          // all elements default to 0
numbers[0] = 42;

int[] primes = {2, 3, 5, 7, 11};    // array literal
System.out.println(primes.length);  // 5 (field, no parentheses)

java.util.Arrays.sort(primes);
System.out.println(java.util.Arrays.toString(primes)); // [2, 3, 5, 7, 11]

// primes[5] = 13;  // ArrayIndexOutOfBoundsException`,
      interviewPoints: [
        'Arrays have fixed size and zero-based indexes',
        '`array.length` is a field; `string.length()` is a method',
        'Printing an array directly shows something like [I@1b6d3586; use Arrays.toString',
      ],
    },
    {
      id: 'multidimensional-arrays',
      title: 'Multidimensional Arrays',
      explanation: "A multidimensional array is an array of arrays. A 2D array like `int[][] grid = new int[3][4];` is 3 rows, each an array of 4 ints. You access elements with two indexes: `grid[row][col]`.\n\nBecause each row is its own array, rows can have different lengths. These are called jagged arrays.",
      example: `int[][] matrix = {
    {1, 2, 3},
    {4, 5, 6}
};
System.out.println(matrix[1][2]);   // 6

for (int r = 0; r < matrix.length; r++) {
    for (int c = 0; c < matrix[r].length; c++) {
        System.out.print(matrix[r][c] + " ");
    }
    System.out.println();
}

int[][] jagged = new int[3][];
jagged[0] = new int[1];
jagged[1] = new int[4];   // rows of different sizes`,
      interviewPoints: [
        'A 2D array is an array whose elements are arrays',
        'Jagged arrays have rows of different lengths',
        'Use `Arrays.deepToString` to print nested arrays',
      ],
    },
    {
      id: 'wrapper-classes',
      title: 'Wrapper Classes',
      explanation: "Each primitive has a matching wrapper class that turns it into an object: `Integer`, `Long`, `Double`, `Float`, `Short`, `Byte`, `Character` and `Boolean`. You need them because collections like `List` and generics only work with objects, e.g. `List<Integer>`, never `List<int>`.\n\nWrappers also provide useful utilities such as `Integer.parseInt(\"42\")`, `Integer.MAX_VALUE` and `Character.isDigit('5')`. Wrapper objects are immutable, and unlike primitives they can be `null`.",
      example: `List<Integer> scores = new ArrayList<>();
scores.add(90);

int n = Integer.parseInt("123");      // String -> int
String s = Integer.toString(456);     // int -> String
Integer boxed = Integer.valueOf(10);  // uses a cache for -128..127

System.out.println(Integer.MAX_VALUE); // 2147483647
System.out.println(Character.isLetter('x')); // true`,
      interviewPoints: [
        'Wrappers let primitives be used in collections and generics',
        '`Integer.valueOf` caches values from -128 to 127',
        'Wrapper objects are immutable',
      ],
    },
    {
      id: 'autoboxing-unboxing',
      title: 'Autoboxing & Unboxing',
      explanation: "Autoboxing is the automatic conversion of a primitive into its wrapper, for example when you add an `int` to a `List<Integer>`. Unboxing is the reverse: the compiler turns an `Integer` back into an `int` when needed.\n\nIt's convenient but has two traps. Unboxing a `null` wrapper throws `NullPointerException`. And comparing wrappers with `==` compares object references, which works by accident for small cached values (-128 to 127) but fails for larger ones. Always use `equals()` to compare wrappers.",
      example: `Integer boxed = 5;          // autoboxing: Integer.valueOf(5)
int unboxed = boxed;        // unboxing: boxed.intValue()

Integer a = 127, b = 127;
System.out.println(a == b);       // true  (cached)

Integer c = 128, d = 128;
System.out.println(c == d);       // false (different objects!)
System.out.println(c.equals(d));  // true

Integer missing = null;
// int value = missing;     // NullPointerException on unboxing`,
      interviewPoints: [
        'Autoboxing: primitive -> wrapper; unboxing: wrapper -> primitive',
        'Unboxing null throws NullPointerException',
        'Compare wrappers with equals(), never ==',
        'Boxing inside tight loops creates extra objects and hurts performance',
      ],
    },
    {
      id: 'command-line-arguments',
      title: 'Command-line Arguments',
      explanation: "When you start a program with `java MyApp arg1 arg2`, the words after the class name are passed to `main` as the `String[] args` array. They always arrive as Strings, so you must convert them yourself, for example with `Integer.parseInt`.\n\nIf no arguments are passed, `args` is an empty array (length 0), not null. Always check `args.length` before reading elements.",
      example: `public class Sum {
    public static void main(String[] args) {
        if (args.length < 2) {
            System.out.println("Usage: java Sum <a> <b>");
            return;
        }
        int a = Integer.parseInt(args[0]);
        int b = Integer.parseInt(args[1]);
        System.out.println("Sum = " + (a + b));
    }
}

// Terminal: java Sum 4 5   ->   Sum = 9`,
      interviewPoints: [
        'Arguments arrive as a String array',
        'args is empty (not null) when no arguments are given',
        'Invalid numbers make parseInt throw NumberFormatException',
      ],
    },
  ],

  commonMistakes: [
    'Using `==` to compare `Integer` or `String` objects instead of `equals()`, which works for small cached values and then mysteriously breaks.',
    'Expecting `7 / 2` to equal 3.5; integer division truncates, so write `7 / 2.0` or cast one operand to double.',
    'Forgetting `break` in a classic switch statement, causing the next case to run as well.',
    'Using `double` or `float` for money, which leads to rounding errors like 0.1 + 0.2 = 0.30000000000000004.',
    'Accessing `arr[arr.length]` in a loop with `<=` instead of `<`, causing ArrayIndexOutOfBoundsException.',
    'Unboxing a null `Integer` (for example a value from a Map) into an `int`, which throws NullPointerException.',
  ],

  interviewTips: [
    'For JDK vs JRE vs JVM, draw the nesting: JDK contains JRE contains JVM, then say what each adds.',
    'When asked about platform independence, stress that bytecode is portable while the JVM itself is platform specific.',
    'Always state that Java is pass-by-value, and explain that for objects the value copied is the reference.',
    'Mention the Integer cache (-128 to 127) when talking about wrappers; it shows real-world depth.',
    'Use small code snippets to back up your answers; interviewers love seeing you predict output like `x++` vs `++x`.',
  ],

  interviewQuestions: [
    {
      id: 'java-fundamentals-q1',
      question: 'What is the difference between JDK, JRE and JVM?',
      answer: "The JVM (Java Virtual Machine) is the runtime engine that loads, verifies and executes bytecode, and manages memory through garbage collection. The JRE (Java Runtime Environment) is the JVM plus the standard class libraries needed to run Java programs.\n\nThe JDK (Java Development Kit) is the JRE plus development tools like `javac` (compiler), `jar`, `javadoc` and debuggers. Developers install the JDK; in the past, end users only needed the JRE to run apps.",
      points: [
        'JDK = JRE + development tools',
        'JRE = JVM + class libraries',
        'JVM executes bytecode and is platform specific',
      ],
      difficulty: 'Beginner',
    },
    {
      id: 'java-fundamentals-q2',
      question: 'Why is Java called platform independent?',
      answer: "Java source code is compiled into bytecode, an intermediate instruction set that no real CPU runs directly. Any machine with a compatible JVM can execute that same bytecode, so you don't need to recompile for Windows, Linux or macOS.\n\nThe JVM is the platform-specific piece: each OS has its own JVM that translates bytecode to that machine's native instructions. That's why the slogan is \"write once, run anywhere\".",
      points: [
        'Compiled to bytecode, not native machine code',
        'Each OS has its own JVM implementation',
        'Bytecode is portable; the JVM is not',
      ],
      difficulty: 'Beginner',
    },
    {
      id: 'java-fundamentals-q3',
      question: 'What are the primitive data types in Java and their sizes?',
      answer: "Java has 8 primitive types: `byte` (8 bits), `short` (16 bits), `int` (32 bits), `long` (64 bits), `float` (32 bits), `double` (64 bits), `char` (16 bits, an unsigned Unicode code unit) and `boolean` (true/false; its size is JVM-dependent).\n\nPrimitives store values directly, are not objects and cannot be null. Their sizes are fixed on every platform, which is part of what makes Java portable.",
      points: [
        'Four integer types, two floating-point types, char and boolean',
        'Sizes are the same on every platform',
        'Integer literals default to int, decimals to double',
      ],
      difficulty: 'Beginner',
    },
    {
      id: 'java-fundamentals-q4',
      question: 'Is Java pass-by-value or pass-by-reference?',
      answer: "Java is always pass-by-value. When you pass a primitive, the method gets a copy of the value. When you pass an object, the method gets a copy of the reference (the address), not the object itself.\n\nThat means a method can change the object's fields through the copied reference and the caller will see it. But if the method reassigns the parameter to a new object, the caller's variable is unaffected, which proves it's not pass-by-reference.",
      example: `static void rename(StringBuilder sb) {
    sb.append(" Kumar");        // visible to caller
    sb = new StringBuilder("X"); // NOT visible to caller
}

StringBuilder name = new StringBuilder("Ravi");
rename(name);
System.out.println(name);  // Ravi Kumar`,
      points: [
        'Always pass-by-value',
        'For objects, the value is a copy of the reference',
        'Mutating the object is visible; reassigning the parameter is not',
      ],
      difficulty: 'Intermediate',
    },
    {
      id: 'java-fundamentals-q5',
      question: 'What is autoboxing and unboxing, and what are the pitfalls?',
      answer: "Autoboxing is the compiler automatically converting a primitive to its wrapper object (e.g. `int` to `Integer`) and unboxing is the reverse. It lets you write `list.add(5)` on a `List<Integer>`.\n\nThe pitfalls: unboxing a null wrapper throws NullPointerException; comparing wrappers with `==` compares references and only seems to work for cached values -128 to 127; and boxing in hot loops creates many short-lived objects, hurting performance.",
      example: `Integer x = 1000, y = 1000;
System.out.println(x == y);      // false
System.out.println(x.equals(y)); // true

Map<String, Integer> stock = new HashMap<>();
int qty = stock.get("pen");      // NullPointerException`,
      points: [
        'Compiler inserts valueOf() and intValue() calls',
        'Null unboxing throws NullPointerException',
        'Use equals() to compare wrappers',
        'Avoid boxing in performance-critical loops',
      ],
      difficulty: 'Intermediate',
    },
    {
      id: 'java-fundamentals-q6',
      question: 'What is the difference between widening and narrowing type casting?',
      answer: "Widening casting converts a smaller type to a larger one, such as `int` to `long` or `int` to `double`. It is done automatically because no information is lost (though very large long values can lose precision when widened to float or double).\n\nNarrowing casting converts a larger type to a smaller one, such as `double` to `int`. It needs an explicit cast like `(int) 9.7`, and data can be lost: decimals are truncated and out-of-range values wrap around.",
      example: `double d = 9.7;
int i = (int) d;       // 9
int big = 130;
byte b = (byte) big;   // -126 (overflow)`,
      points: [
        'Widening is implicit, narrowing is explicit',
        'Narrowing can truncate or overflow',
        'Object downcasting can throw ClassCastException',
      ],
      difficulty: 'Beginner',
    },
    {
      id: 'java-fundamentals-q7',
      question: 'What is the difference between a while loop and a do-while loop?',
      answer: "A `while` loop checks its condition before each iteration, so if the condition is false initially, the body never executes. A `do-while` loop executes the body first and checks the condition afterwards, guaranteeing at least one execution.\n\nUse do-while when the action must happen once before you can decide whether to repeat, such as showing a menu or reading input until it is valid.",
      points: [
        'while: entry-controlled, may run zero times',
        'do-while: exit-controlled, runs at least once',
        'do-while ends with a semicolon after the condition',
      ],
      difficulty: 'Beginner',
    },
    {
      id: 'java-fundamentals-q8',
      question: 'Why does comparing two Integer objects with == sometimes return true and sometimes false?',
      answer: "`==` on objects compares references, not values. `Integer.valueOf()`, which autoboxing uses, returns cached objects for values between -128 and 127. So two boxed 100s point to the same cached object and `==` is true.\n\nFor values outside that range, each boxing creates a new object, so `==` is false even when the numbers are equal. The cache upper bound can be raised with the JVM flag `-XX:AutoBoxCacheMax`. The fix is always to use `equals()` or unbox to `int` before comparing.",
      example: `Integer a = 100, b = 100;
Integer c = 200, d = 200;
System.out.println(a == b);  // true
System.out.println(c == d);  // false
System.out.println(c.intValue() == d.intValue()); // true`,
      points: [
        '== compares references for objects',
        'Integer cache covers -128 to 127 by default',
        'Similar caches exist for Short, Byte, Long, Character (0-127) and Boolean',
        'Always use equals() for wrapper comparison',
      ],
      difficulty: 'Intermediate',
    },
    {
      id: 'java-fundamentals-q9',
      question: 'How does the JVM execute bytecode, and what is the JIT compiler?',
      answer: "When a program starts, the class loader loads `.class` files, the bytecode verifier checks they are safe, and the execution engine runs them. Initially, the JVM interprets bytecode one instruction at a time, which starts fast but runs slower.\n\nThe JVM profiles the running code and finds \"hot\" methods and loops that run often. The JIT (Just-In-Time) compiler then compiles them into optimised native machine code, applying tricks like inlining and escape analysis. HotSpot uses tiered compilation: C1 compiles quickly with light optimisation, and C2 later recompiles the hottest code aggressively. This is why Java apps often get faster after a warm-up period.",
      points: [
        'Class loading -> verification -> execution',
        'Interpreter first, JIT for hot code',
        'Tiered compilation: C1 (fast compile) and C2 (heavy optimisation)',
        'Explains JVM warm-up in benchmarks and production',
      ],
      difficulty: 'Advanced',
    },
    {
      id: 'java-fundamentals-q10',
      question: 'What happens when an int overflows, and how can you detect it?',
      answer: "Java integer arithmetic silently wraps around on overflow using two's complement. For example, `Integer.MAX_VALUE + 1` becomes `Integer.MIN_VALUE` (-2147483648) with no exception.\n\nTo detect overflow, use `Math.addExact`, `Math.multiplyExact` and similar methods, which throw `ArithmeticException` on overflow. Alternatively use `long` for larger ranges or `BigInteger` for arbitrary precision. A classic bug is computing a midpoint as `(low + high) / 2`, which can overflow; `low + (high - low) / 2` is safe.",
      example: `int max = Integer.MAX_VALUE;
System.out.println(max + 1);           // -2147483648

try {
    Math.addExact(max, 1);
} catch (ArithmeticException e) {
    System.out.println("Overflow detected");
}

int mid = low + (high - low) / 2;      // overflow-safe midpoint`,
      points: [
        'Overflow wraps silently, no exception',
        'Math.*Exact methods throw ArithmeticException',
        'Use long or BigInteger for large values',
        'Watch out for (low + high) / 2 in binary search',
      ],
      difficulty: 'Advanced',
    },
    {
      id: 'java-fundamentals-q11',
      question: 'Why should you not use double for monetary calculations?',
      answer: "`double` and `float` are binary floating-point types (IEEE 754). Many decimal fractions like 0.1 cannot be represented exactly in binary, so small rounding errors creep in and accumulate, e.g. `0.1 + 0.2` gives `0.30000000000000004`.\n\nFor money, use `BigDecimal` created from a String (not from a double), and control rounding explicitly with `setScale` and a `RoundingMode`. Another option is storing amounts as a `long` number of the smallest unit, like paise or cents.",
      example: `BigDecimal a = new BigDecimal("0.10");
BigDecimal b = new BigDecimal("0.20");
System.out.println(a.add(b));  // 0.30

BigDecimal total = new BigDecimal("10.00")
        .divide(new BigDecimal("3"), 2, RoundingMode.HALF_UP); // 3.33`,
      points: [
        'Binary floating point cannot represent most decimal fractions exactly',
        'Use BigDecimal with the String constructor',
        'Always specify scale and RoundingMode when dividing',
        'Or store amounts as long in minor units',
      ],
      difficulty: 'Advanced',
    },
  ],
}

export default topic
