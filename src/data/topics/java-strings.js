const topic = {
  id: 'java-strings',
  category: 'java',
  title: 'Strings',
  description: 'How Java strings work: immutability, the string pool, StringBuilder vs StringBuffer, comparison, common methods, formatting and regex basics.',
  difficulty: 'Beginner',
  overview: "A `String` in Java is a sequence of characters, such as a name, an email or a JSON payload. It is the most used class in almost every Java program, which is why interviewers love asking about it.\n\nJava strings are immutable: once created, a String object can never change. Any \"modification\" like `toUpperCase()` returns a brand-new String. Think of a String like a printed page: you can't erase a word, you can only print a new page. Because strings never change, Java can safely share them through a special memory area called the string pool.\n\nWhen you need to build text piece by piece, you use the mutable helpers `StringBuilder` (fast, single-threaded) or `StringBuffer` (synchronized, thread-safe). This topic also covers comparing strings correctly with `equals()`, the most useful String methods, formatting, and a gentle introduction to regular expressions.",

  subtopics: [
    {
      id: 'string-basics',
      title: 'String',
      explanation: "`String` is a final class in `java.lang` that represents a sequence of characters. You can create one with a literal like `\"hello\"` or with `new String(\"hello\")`, but literals are preferred because they use the string pool.\n\nSince Java 9, strings are stored internally as a `byte[]` with a Latin-1 or UTF-16 encoding flag (Compact Strings), which saves memory for plain English text. Java 15 added text blocks (triple quotes) for multi-line strings.",
      example: `String greeting = "Hello";               // literal (pooled)
String copy = new String("Hello");      // explicit new object on the heap
char first = greeting.charAt(0);        // 'H'
int len = greeting.length();            // 5

String json = """
    {
      "name": "Asha",
      "age": 28
    }
    """;                                // text block (Java 15+)`,
      interviewPoints: [
        'String is a final class, so it cannot be subclassed',
        'Prefer literals over `new String(...)`',
        'Compact Strings (Java 9) store Latin-1 text in 1 byte per char',
      ],
    },
    {
      id: 'string-immutability',
      title: 'String Immutability',
      explanation: "Immutable means a String object's content can never change after it is created. Methods like `concat`, `replace` or `toUpperCase` return a new String and leave the original untouched. If you don't assign the result, the change is lost.\n\nJava made strings immutable for four reasons: security (file paths, URLs and database credentials can't be altered after checks), thread safety (they can be shared across threads without locks), caching of the hash code (great for HashMap keys), and the string pool (sharing is only safe if nobody can modify the shared object).",
      example: `String name = "java";
name.toUpperCase();              // result discarded!
System.out.println(name);        // java

name = name.toUpperCase();       // reassign the variable
System.out.println(name);        // JAVA  (a new object)

String a = "hi";
String b = a;
a = a + " there";                // a now points to a NEW string
System.out.println(b);           // hi (unchanged)`,
      interviewPoints: [
        'String methods return new objects; the original never changes',
        'Immutability enables the string pool, thread safety and hash caching',
        'Reassigning a variable is not the same as mutating the object',
      ],
    },
    {
      id: 'string-pool',
      title: 'String Pool',
      explanation: "The string pool (or string constant pool) is a special area in the heap where Java stores one shared copy of each string literal. When you write `\"hello\"` twice, both variables point to the same pooled object, saving memory.\n\nUsing `new String(\"hello\")` always creates a separate object outside the pool. You can call `intern()` to get the pooled version of any string. Since Java 7 the pool lives in the regular heap (not PermGen), so it is garbage collected like other objects.",
      example: `String s1 = "hello";
String s2 = "hello";
String s3 = new String("hello");

System.out.println(s1 == s2);            // true  (same pooled object)
System.out.println(s1 == s3);            // false (s3 is a new heap object)
System.out.println(s1 == s3.intern());   // true  (intern returns pooled copy)

String s4 = "hel" + "lo";                // compile-time constant, pooled
System.out.println(s1 == s4);            // true`,
      interviewPoints: [
        'Literals are pooled automatically; `new String` is not',
        '`intern()` returns the canonical pooled instance',
        'Compile-time constant expressions are pooled; runtime concatenation is not',
        '`new String(\"x\")` may create up to two objects: the literal in the pool and the new heap object',
      ],
    },
    {
      id: 'stringbuilder-stringbuffer',
      title: 'StringBuilder & StringBuffer',
      explanation: "`StringBuilder` and `StringBuffer` are mutable sequences of characters. You can append, insert, delete or reverse text in place without creating a new object every time, which is much faster when building strings in a loop.\n\nThe difference: `StringBuffer` methods are `synchronized`, so it is thread-safe but slower. `StringBuilder` (added in Java 5) is not synchronized and is faster. In practice use `StringBuilder` almost always, since string building usually happens inside a single method on one thread.",
      example: `StringBuilder sb = new StringBuilder();
for (int i = 1; i <= 5; i++) {
    sb.append(i).append(", ");
}
sb.setLength(sb.length() - 2);        // remove the last ", "
System.out.println(sb);               // 1, 2, 3, 4, 5

String reversed = new StringBuilder("racecar").reverse().toString();
sb.insert(0, "Numbers: ");
sb.deleteCharAt(0);

StringBuffer safe = new StringBuffer("thread-safe");
safe.append("!");`,
      interviewPoints: [
        'String: immutable; StringBuilder: mutable, not thread-safe; StringBuffer: mutable, thread-safe',
        'StringBuilder is the default choice for building strings',
        'Neither overrides equals(); compare via toString() or compareTo (Java 11+)',
      ],
    },
    {
      id: 'equals-vs-double-equals',
      title: '== vs equals()',
      explanation: "`==` checks whether two references point to the exact same object in memory. `equals()` checks whether two strings have the same characters. For comparing text you almost always want `equals()`.\n\n`==` sometimes appears to work because pooled literals share one object, but strings that come from user input, a database, or runtime concatenation are separate objects, so `==` returns false. Use `equalsIgnoreCase()` to ignore case, and call `equals` on a known non-null value (or use `Objects.equals`) to avoid NullPointerException.",
      example: `String a = "admin";
String b = new StringBuilder("ad").append("min").toString();

System.out.println(a == b);          // false (different objects)
System.out.println(a.equals(b));     // true  (same content)

String role = null;
System.out.println("admin".equals(role));      // false, no NPE
System.out.println(Objects.equals(role, a));   // false, null-safe
System.out.println("ADMIN".equalsIgnoreCase(a)); // true`,
      interviewPoints: [
        '== compares references, equals() compares content',
        'Put the literal first: `\"yes\".equals(input)` is null-safe',
        'String overrides equals() and hashCode() from Object',
      ],
    },
    {
      id: 'string-methods',
      title: 'Common String Methods',
      explanation: "The String class has many helpful methods. The ones you'll use daily: `length()`, `charAt(i)`, `substring(start, end)` (end is exclusive), `indexOf`, `contains`, `startsWith`, `endsWith`, `toUpperCase`, `toLowerCase`, `trim`, `replace`, `split`, `toCharArray` and `compareTo`.\n\nModern Java added `isBlank()`, `strip()` (Unicode-aware trim), `repeat(n)` and `lines()` in Java 11, and `String.join` and `chars()` in Java 8.",
      example: `String s = "  Hello, World  ";

s.trim();                     // "Hello, World"
s.strip();                    // "Hello, World" (Unicode-aware)
s.isBlank();                  // false

String t = "Hello, World";
t.substring(0, 5);            // "Hello" (end index exclusive)
t.indexOf('o');               // 4
t.contains("World");          // true
t.replace("World", "Java");   // "Hello, Java"
t.split(", ");                // ["Hello", "World"]
t.toCharArray();              // ['H','e','l','l','o',...]
"ab".repeat(3);               // "ababab"
String.join("-", "a", "b", "c"); // "a-b-c"
"apple".compareTo("banana");  // negative (a comes before b)`,
      interviewPoints: [
        '`substring(begin, end)` excludes the end index',
        '`split` takes a regex, so `split(\".\")` needs escaping',
        '`compareTo` returns negative, zero or positive for ordering',
      ],
    },
    {
      id: 'string-concatenation',
      title: 'String Concatenation',
      explanation: "You can join strings with the `+` operator, `concat()`, `StringBuilder`, `String.join` or `Collectors.joining`. For a single expression like `\"Hi \" + name`, `+` is perfectly fine and readable; the compiler optimises it (since Java 9 via `invokedynamic` and `StringConcatFactory`).\n\nThe problem is using `+` inside a loop. Each iteration creates a new String and copies all previous characters, turning a linear job into quadratic time. Use a `StringBuilder` for loops.",
      example: `String name = "Asha";
String msg = "Hello, " + name + "!";   // fine for one-off expressions

// Bad: O(n^2), creates a new String every iteration
String slow = "";
for (int i = 0; i < 1000; i++) {
    slow += i;
}

// Good: O(n)
StringBuilder sb = new StringBuilder();
for (int i = 0; i < 1000; i++) {
    sb.append(i);
}
String fast = sb.toString();

String csv = String.join(",", List.of("a", "b", "c"));  // a,b,c
System.out.println(1 + 2 + "3");   // "33" (left to right)
System.out.println("1" + 2 + 3);   // "123"`,
      interviewPoints: [
        'Avoid + in loops; use StringBuilder',
        'Concatenation is evaluated left to right, so 1 + 2 + "3" is "33"',
        'Concatenating null gives the text "null", not an exception',
      ],
    },
    {
      id: 'string-formatting',
      title: 'String Formatting',
      explanation: "`String.format` builds a string from a template with placeholders. Common placeholders: `%s` (string), `%d` (integer), `%f` (decimal, e.g. `%.2f` for 2 places), `%n` (platform newline) and `%,d` (thousands separator). Java 15 added the instance method `formatted()` which does the same thing.\n\n`System.out.printf` prints a formatted string directly. For complex text use text blocks with `formatted()`.",
      example: `String name = "Ravi";
int items = 3;
double total = 1499.5;

String msg = String.format("%s bought %d items for %.2f", name, items, total);
// "Ravi bought 3 items for 1499.50"

String same = "%s bought %d items".formatted(name, items); // Java 15+

System.out.printf("Total: %,d%n", 1234567);   // Total: 1,234,567
System.out.printf("|%-10s|%5d|%n", "left", 42); // padding and alignment`,
      interviewPoints: [
        '%s string, %d integer, %f float, %n newline',
        'Use %.2f to round to two decimals for display',
        'Mismatched placeholder types throw IllegalFormatException at runtime',
      ],
    },
    {
      id: 'regex-basics',
      title: 'Regular Expressions Basics',
      explanation: "A regular expression (regex) is a pattern that describes text, used for validating, searching and splitting. Key symbols: `.` any character, `\\d` digit, `\\w` word character, `\\s` whitespace, `*` zero or more, `+` one or more, `?` optional, `{n,m}` a range of repeats, `[abc]` any of a, b or c, `^` start and `$` end.\n\nIn Java strings, a backslash must be escaped, so the regex `\\d` is written `\"\\\\d\"`. Use `String.matches` for quick checks, and `Pattern` plus `Matcher` when you reuse a pattern or need to extract groups. Compile patterns once and reuse them, as compiling is expensive.",
      example: `// Quick validation (matches the WHOLE string)
boolean isPin = "560001".matches("\\\\d{6}");          // true

// Split on one or more whitespace characters
String[] words = "a  b   c".split("\\\\s+");            // [a, b, c]

// Replace all digits
String masked = "Card 4111".replaceAll("\\\\d", "*");  // Card ****

// Reusable compiled pattern with groups
private static final Pattern EMAIL =
        Pattern.compile("^([\\\\w.]+)@([\\\\w.]+)\\\\.(\\\\w{2,})$");

Matcher m = EMAIL.matcher("asha@example.com");
if (m.matches()) {
    System.out.println(m.group(1));   // asha
    System.out.println(m.group(2));   // example
}`,
      interviewPoints: [
        '`matches()` must match the entire string, `find()` looks for a substring',
        'Escape backslashes twice in Java string literals',
        'Precompile Pattern objects as static final constants',
        'split, replaceAll and matches all take regex, not plain text',
      ],
    },
  ],

  commonMistakes: [
    'Comparing strings with `==` instead of `equals()`, which fails for strings read from input, files or databases.',
    'Calling `s.toUpperCase()` or `s.trim()` without assigning the result, forgetting that strings are immutable.',
    'Concatenating strings with `+=` inside a large loop, creating thousands of temporary objects and O(n^2) work.',
    'Using `split(\".\")` or `split(\"|\")` expecting a literal split; these are regex metacharacters and must be escaped as `\"\\\\.\"`.',
    'Calling `input.equals(\"yes\")` when `input` may be null, causing a NullPointerException; use `\"yes\".equals(input)`.',
    'Storing passwords in a String, which stays in memory (and possibly the pool) until garbage collected; prefer `char[]` that can be cleared.',
  ],

  interviewTips: [
    'When asked why String is immutable, list the four reasons: security, thread safety, hash code caching and the string pool.',
    'Draw the heap and the string pool when explaining `==` with literals versus `new String()`; it makes the answer crystal clear.',
    'For String vs StringBuilder vs StringBuffer, answer in three dimensions: mutability, thread safety and performance.',
    'Mention modern features (text blocks, `isBlank`, `strip`, `repeat`, `formatted`) to show you keep up with Java versions.',
    'If asked to reverse or manipulate strings in code, reach for `StringBuilder` or a `char[]`, and state the time complexity.',
  ],

  interviewQuestions: [
    {
      id: 'java-strings-q1',
      question: 'Why are Strings immutable in Java?',
      answer: "Once a String object is created, its content cannot change; every modifying method returns a new String. Java designed it this way for several reasons.\n\nSecurity: strings hold file paths, URLs, class names and credentials, and immutability prevents them from being changed after validation. Thread safety: immutable objects can be shared between threads without synchronization. Hash code caching: the hash is computed once and reused, making Strings fast HashMap keys. String pool: sharing one literal among many variables is only safe if nobody can change it.",
      points: [
        'Security of sensitive values',
        'Thread safety without locks',
        'Cached hashCode for fast HashMap keys',
        'Enables the string pool',
      ],
      difficulty: 'Beginner',
    },
    {
      id: 'java-strings-q2',
      question: 'What is the difference between == and equals() when comparing Strings?',
      answer: "`==` compares references: it returns true only when both variables point to the exact same object. `equals()` is overridden in `String` to compare the actual characters.\n\nTwo literals with the same value share one pooled object, so `==` happens to return true, which misleads beginners. Strings created at runtime (from `new`, concatenation of variables, user input or a database) are different objects, so `==` returns false even though the text is equal. Always use `equals()` for content comparison.",
      example: `String a = "java";
String b = "java";
String c = new String("java");
System.out.println(a == b);       // true
System.out.println(a == c);       // false
System.out.println(a.equals(c));  // true`,
      points: [
        '== checks reference identity',
        'equals() checks character content',
        'Use equalsIgnoreCase for case-insensitive comparison',
      ],
      difficulty: 'Beginner',
    },
    {
      id: 'java-strings-q3',
      question: 'What is the difference between String, StringBuilder and StringBuffer?',
      answer: "`String` is immutable: every change creates a new object. It is thread-safe because it cannot change. `StringBuilder` is mutable and not synchronized, making it the fastest way to build strings on a single thread. `StringBuffer` is also mutable, but its methods are synchronized, so it is thread-safe and slower.\n\nUse `String` for fixed values, `StringBuilder` for building text in loops or methods (the common case), and `StringBuffer` only when multiple threads really modify the same buffer, which is rare.",
      points: [
        'String: immutable',
        'StringBuilder: mutable, not synchronized, fastest',
        'StringBuffer: mutable, synchronized, legacy choice',
      ],
      difficulty: 'Beginner',
    },
    {
      id: 'java-strings-q4',
      question: 'What is the String pool, and how many objects does new String("hello") create?',
      answer: "The String pool is a special area in the heap where the JVM keeps a single shared copy of each string literal. When code uses a literal, the JVM returns the pooled object if it exists, otherwise it adds one.\n\n`new String(\"hello\")` can create up to two objects: the literal `\"hello\"` in the pool (if it's not already there, which happens when the class is loaded) and a new String object on the heap every time the expression runs. The variable refers to the heap object, not the pooled one. Calling `intern()` on it returns the pooled instance.",
      points: [
        'Pool stores one instance per distinct literal',
        'new String always creates a new heap object',
        'The literal may already exist in the pool',
        'intern() returns the canonical pooled copy',
      ],
      difficulty: 'Intermediate',
    },
    {
      id: 'java-strings-q5',
      question: 'Why should you avoid using + to concatenate Strings in a loop?',
      answer: "Because String is immutable, `s += x` creates a brand-new String each time and copies all existing characters into it. For n iterations that is roughly 1 + 2 + ... + n character copies, i.e. O(n^2) time, plus lots of garbage for the garbage collector.\n\nA `StringBuilder` keeps an internal resizable array and appends in amortised O(1), so building the string is O(n) overall. The compiler optimises single-expression concatenation, but it cannot fix repeated concatenation across loop iterations.",
      example: `StringBuilder sb = new StringBuilder();
for (String word : words) {
    sb.append(word).append(' ');
}
String sentence = sb.toString().trim();`,
      points: [
        'Each += creates a new String and copies characters',
        'Loop concatenation is O(n^2)',
        'StringBuilder makes it O(n)',
      ],
      difficulty: 'Intermediate',
    },
    {
      id: 'java-strings-q6',
      question: 'What does String.intern() do, and when would you use it?',
      answer: "`intern()` checks the string pool for a string equal to the current one. If found, it returns the pooled reference; otherwise it adds this string to the pool and returns it. After interning, equal strings share one object, so they can even be compared with `==`.\n\nIt can save memory when an application holds many duplicate strings created at runtime, such as country codes parsed from millions of records. However, interning costs a hash-table lookup, and overusing it can bloat the pool. Modern JVMs also offer G1 string deduplication (`-XX:+UseStringDeduplication`), which deduplicates the underlying char arrays automatically.",
      points: [
        'Returns the canonical pooled instance',
        'Useful for many runtime duplicates',
        'Has a lookup cost; don\'t use it everywhere',
        'G1 string deduplication is an automatic alternative',
      ],
      difficulty: 'Advanced',
    },
    {
      id: 'java-strings-q7',
      question: 'Why is char[] preferred over String for storing passwords?',
      answer: "A String is immutable, so you can't wipe its contents after use. It stays in memory until the garbage collector reclaims it, which could be a long time, and if it is a literal it may live in the pool for the app's lifetime. Anyone with a heap dump could read it. Strings are also easy to accidentally print in logs.\n\nA `char[]` can be overwritten with zeros (`Arrays.fill(password, '0')`) as soon as you are done, shrinking the window in which the secret is exposed. That's why APIs like `JPasswordField.getPassword()` and `KeyStore` use `char[]`.",
      example: `char[] password = console.readPassword("Password: ");
try {
    authenticate(password);
} finally {
    Arrays.fill(password, '\\0');   // wipe from memory
}`,
      points: [
        'Strings cannot be cleared and linger in memory',
        'char[] can be zeroed immediately after use',
        'Reduces exposure in heap dumps and logs',
      ],
      difficulty: 'Advanced',
    },
    {
      id: 'java-strings-q8',
      question: 'How does String.hashCode() work, and why is it good for HashMap keys?',
      answer: "`String.hashCode()` computes `s[0]*31^(n-1) + s[1]*31^(n-2) + ... + s[n-1]` using int arithmetic. The multiplier 31 is an odd prime that spreads values well and can be optimised by the JIT as `(i << 5) - i`.\n\nBecause Strings are immutable, the hash never changes, so it is computed lazily once and cached in a private field. That makes repeated lookups fast. Immutability also guarantees a key can't change after being inserted into a HashMap, which would otherwise make it impossible to find.",
      points: [
        'Polynomial hash with multiplier 31',
        'Cached after first computation',
        'Immutability keeps keys stable in hash-based collections',
        'Different strings can still collide (e.g. "Aa" and "BB")',
      ],
      difficulty: 'Advanced',
    },
    {
      id: 'java-strings-q9',
      question: 'What is the difference between String.matches() and Matcher.find()?',
      answer: "`String.matches(regex)` returns true only if the entire string matches the pattern; it behaves as if the regex were wrapped in `^` and `$`. It also compiles the regex on every call.\n\n`Matcher.find()` searches for the next substring that matches, and can be called repeatedly in a loop to find all occurrences, extracting groups each time. For repeated use, compile a `Pattern` once as a `static final` field and create matchers from it.",
      example: `private static final Pattern NUMBER = Pattern.compile("\\\\d+");

"abc123".matches("\\\\d+");        // false (whole string isn't digits)

Matcher m = NUMBER.matcher("a1b22c333");
while (m.find()) {
    System.out.println(m.group()); // 1, 22, 333
}`,
      points: [
        'matches() requires a full match',
        'find() locates matching substrings one by one',
        'Precompile Pattern for performance',
      ],
      difficulty: 'Intermediate',
    },
    {
      id: 'java-strings-q10',
      question: 'Is String thread-safe? Is StringBuilder?',
      answer: "Yes, String is thread-safe because it is immutable: no thread can change it, so sharing is always safe without locks. StringBuilder is not thread-safe; if two threads append to the same instance at the same time, the internal array and length can become corrupted or you may get an exception.\n\nIf multiple threads must build one string, use `StringBuffer` or external synchronization. In practice, the better design is for each thread to use its own local StringBuilder and combine results afterwards.",
      points: [
        'Immutability makes String inherently thread-safe',
        'StringBuilder has no synchronization',
        'StringBuffer synchronizes each method',
        'Prefer thread-local builders over sharing',
      ],
      difficulty: 'Intermediate',
    },
  ],
}

export default topic
