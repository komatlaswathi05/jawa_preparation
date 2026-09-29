const topic = {
  id: 'java-exceptions',
  category: 'java',
  title: 'Exception Handling',
  description: 'How Java reports and handles errors: the exception hierarchy, checked vs unchecked exceptions, try/catch/finally, throw vs throws, custom exceptions and try-with-resources.',
  difficulty: 'Beginner',
  overview: "An exception is an event that disrupts the normal flow of a program, such as dividing by zero, reading a file that doesn't exist, or calling a method on `null`. Instead of crashing silently or returning mysterious error codes, Java creates an exception object describing what went wrong and \"throws\" it up the call stack until some code \"catches\" and handles it.\n\nThink of it like a fire alarm in a building. When something goes wrong on one floor, the alarm propagates upward until someone responsible (a handler) responds. If nobody responds, the whole building is evacuated, which in Java means the thread terminates and prints a stack trace.\n\nGood exception handling makes backend services reliable: you recover when you can, clean up resources like database connections, and return meaningful error messages to clients. In Spring Boot, these same ideas power `@ControllerAdvice` and global error handling, so understanding the basics here pays off later.",

  subtopics: [
    {
      id: 'exception-vs-error',
      title: 'Exception & Error',
      explanation: "Both `Exception` and `Error` extend `Throwable`, the root of everything that can be thrown. An `Exception` represents a problem your application can reasonably anticipate and recover from, like invalid input or a missing file.\n\nAn `Error` represents a serious problem in the JVM or environment, such as `OutOfMemoryError` or `StackOverflowError`. You generally should not catch Errors, because the application is usually in a state where it cannot safely continue.",
      example: `// Exception: recoverable
try {
    int n = Integer.parseInt("abc");
} catch (NumberFormatException e) {
    System.out.println("Please enter a valid number");
}

// Error: not meant to be caught
static void recurse() {
    recurse();          // eventually throws StackOverflowError
}`,
      interviewPoints: [
        'Both extend Throwable',
        'Exceptions are recoverable application problems',
        'Errors are serious JVM/system problems you usually don\'t catch',
      ],
    },
    {
      id: 'exception-hierarchy',
      title: 'Exception Hierarchy',
      explanation: "At the top is `Throwable`, with two children: `Error` and `Exception`. Under `Exception` sits `RuntimeException`, the parent of all unchecked exceptions such as `NullPointerException`, `IllegalArgumentException` and `ArrayIndexOutOfBoundsException`.\n\nEvery other subclass of `Exception` (not under RuntimeException), like `IOException` and `SQLException`, is a checked exception. Knowing this tree tells you which exceptions the compiler forces you to handle.",
      example: `// Throwable
// ├── Error                      (unchecked)
// │   ├── OutOfMemoryError
// │   └── StackOverflowError
// └── Exception                  (checked, unless RuntimeException)
//     ├── IOException
//     │   └── FileNotFoundException
//     ├── SQLException
//     ├── InterruptedException
//     └── RuntimeException       (unchecked)
//         ├── NullPointerException
//         ├── IllegalArgumentException
//         │   └── NumberFormatException
//         ├── ArithmeticException
//         └── IndexOutOfBoundsException`,
      interviewPoints: [
        'Throwable -> Error and Exception',
        'RuntimeException and its subclasses are unchecked',
        'Error and its subclasses are also unchecked',
      ],
    },
    {
      id: 'checked-vs-unchecked',
      title: 'Checked & Unchecked Exceptions',
      explanation: "Checked exceptions are checked by the compiler. If a method can throw one, you must either catch it or declare it with `throws`. They represent expected, recoverable conditions outside your control, like a network failure (`IOException`).\n\nUnchecked exceptions (subclasses of `RuntimeException`) are not checked by the compiler. They usually indicate programming bugs, like `NullPointerException` or `IllegalArgumentException`, and should be fixed rather than caught. Modern frameworks like Spring prefer unchecked exceptions to avoid cluttering code with `throws` everywhere.",
      example: `// Checked: must handle or declare
public String readConfig(Path path) throws IOException {
    return Files.readString(path);
}

// Unchecked: compiler doesn't force handling
public void setAge(int age) {
    if (age < 0) {
        throw new IllegalArgumentException("Age cannot be negative");
    }
}`,
      interviewPoints: [
        'Checked: verified at compile time, extend Exception',
        'Unchecked: extend RuntimeException, not verified at compile time',
        'Checked for recoverable conditions, unchecked for programming errors',
      ],
    },
    {
      id: 'try-catch-finally',
      title: 'try, catch & finally',
      explanation: "Code that might fail goes inside a `try` block. If an exception is thrown, Java skips the rest of the try block and jumps to the first `catch` block whose type matches. The `finally` block runs afterwards no matter what: whether the try succeeded, an exception was caught, or even if the try contains a `return`.\n\n`finally` is used for cleanup like closing files or releasing locks. It is skipped only in extreme cases, such as `System.exit()` or the JVM crashing. A try must be followed by at least one catch or a finally.",
      example: `public int divide(int a, int b) {
    try {
        return a / b;
    } catch (ArithmeticException e) {
        System.out.println("Cannot divide by zero: " + e.getMessage());
        return 0;
    } finally {
        System.out.println("divide() finished");  // always runs
    }
}`,
      interviewPoints: [
        'finally runs even when try or catch returns',
        'finally does not run after System.exit()',
        'try needs at least a catch or a finally',
        'Returning from finally overrides the earlier return and swallows exceptions; avoid it',
      ],
    },
    {
      id: 'throw-and-throws',
      title: 'throw & throws',
      explanation: "`throw` is a statement that actually throws an exception object right now: `throw new IllegalStateException(\"...\")`. It is used inside a method body, and you can throw only one exception at a time.\n\n`throws` is part of a method signature. It declares which checked exceptions the method might throw, warning callers that they must handle them. You can list several: `throws IOException, SQLException`.",
      example: `public class UserService {

    // throws: declares that this method can fail with a checked exception
    public User loadUser(Path file) throws IOException {
        String data = Files.readString(file);
        if (data.isBlank()) {
            // throw: actually raises an exception
            throw new IllegalStateException("User file is empty");
        }
        return User.parse(data);
    }
}`,
      interviewPoints: [
        'throw raises an exception instance; throws declares possible exceptions',
        'throw is used in the body, throws in the method signature',
        'throws is only required for checked exceptions',
      ],
    },
    {
      id: 'multiple-catch',
      title: 'Multiple catch & Multi-catch',
      explanation: "A try block can have several catch blocks for different exception types. Java checks them from top to bottom and runs the first one that matches, so more specific exceptions must come before more general ones, otherwise the code won't compile.\n\nSince Java 7, multi-catch lets one block handle several unrelated types using `|`: `catch (IOException | SQLException e)`. The types in a multi-catch cannot be subclasses of each other, and the variable `e` is implicitly final.",
      example: `try {
    String text = Files.readString(Path.of("data.txt"));
    int value = Integer.parseInt(text.trim());
    System.out.println(100 / value);
} catch (NoSuchFileException e) {           // most specific first
    System.out.println("File missing");
} catch (IOException e) {                   // broader
    System.out.println("Could not read file");
} catch (NumberFormatException | ArithmeticException e) {  // multi-catch
    System.out.println("Bad data: " + e.getMessage());
}`,
      interviewPoints: [
        'Order catch blocks from specific to general',
        'Catching a parent before a child is a compile error (unreachable code)',
        'Multi-catch types must not be related by inheritance',
      ],
    },
    {
      id: 'nested-try-catch',
      title: 'Nested try-catch',
      explanation: "You can place a try-catch inside another try, catch or finally block. The inner block handles errors specific to one step, and anything it doesn't catch propagates to the outer block.\n\nNesting is useful when one step may fail without aborting the whole operation, such as skipping a bad row while processing a file. Keep nesting shallow; deep nesting is usually a sign you should extract a helper method.",
      example: `try {
    List<String> lines = Files.readAllLines(Path.of("scores.csv"));
    for (String line : lines) {
        try {
            int score = Integer.parseInt(line.trim());
            System.out.println("Score: " + score);
        } catch (NumberFormatException e) {
            System.out.println("Skipping bad line: " + line);  // inner handles
        }
    }
} catch (IOException e) {
    System.out.println("Cannot read file");                  // outer handles
}`,
      interviewPoints: [
        'Uncaught exceptions from the inner try go to the outer catch',
        'Useful for recovering per item in a loop',
        'Extract methods to avoid deep nesting',
      ],
    },
    {
      id: 'custom-exceptions',
      title: 'Custom Exceptions',
      explanation: "You can create your own exception classes to describe domain-specific problems, like `InsufficientFundsException` or `UserNotFoundException`. Extend `RuntimeException` for unchecked or `Exception` for checked.\n\nAlways provide constructors that accept a message and a cause, so you can wrap a lower-level exception without losing the original stack trace. Custom exceptions make code self-documenting and let a Spring `@ControllerAdvice` map each type to the right HTTP status.",
      example: `public class InsufficientFundsException extends RuntimeException {
    private final double shortfall;

    public InsufficientFundsException(String message, double shortfall) {
        super(message);
        this.shortfall = shortfall;
    }

    public InsufficientFundsException(String message, Throwable cause) {
        super(message, cause);
        this.shortfall = 0;
    }

    public double getShortfall() {
        return shortfall;
    }
}

public void withdraw(double amount) {
    if (amount > balance) {
        throw new InsufficientFundsException(
                "Balance too low", amount - balance);
    }
    balance -= amount;
}`,
      interviewPoints: [
        'Extend RuntimeException (unchecked) or Exception (checked)',
        'Provide message and cause constructors',
        'Name them clearly and end with "Exception"',
      ],
    },
    {
      id: 'try-with-resources',
      title: 'Try-with-resources',
      explanation: "Try-with-resources (Java 7+) automatically closes resources like files, streams and database connections when the block ends, even if an exception occurs. Declare the resources in parentheses after `try`; any class implementing `AutoCloseable` works.\n\nResources are closed in reverse order of declaration. If both the body and `close()` throw, the body's exception is kept and the close exception is attached as a suppressed exception, retrievable with `getSuppressed()`. This replaces the error-prone manual `finally { if (x != null) x.close(); }` pattern.",
      example: `public String firstLine(Path path) throws IOException {
    try (BufferedReader reader = Files.newBufferedReader(path)) {
        return reader.readLine();
    }   // reader.close() is called automatically
}

// Multiple resources, closed in reverse order (rs, ps, conn)
try (Connection conn = dataSource.getConnection();
     PreparedStatement ps = conn.prepareStatement("SELECT name FROM users WHERE id = ?")) {
    ps.setLong(1, 42L);
    try (ResultSet rs = ps.executeQuery()) {
        if (rs.next()) {
            System.out.println(rs.getString("name"));
        }
    }
}`,
      interviewPoints: [
        'Works with any AutoCloseable',
        'Resources close in reverse order of declaration',
        'Close exceptions become suppressed exceptions',
        'Java 9+ allows effectively final variables: `try (reader) { ... }`',
      ],
    },
    {
      id: 'exception-propagation',
      title: 'Exception Propagation',
      explanation: "When an exception is thrown and not caught in the current method, the method stops immediately and the exception propagates to its caller, then to the caller's caller, and so on up the call stack. This is called stack unwinding.\n\nIf no method catches it, the exception reaches the top of the thread, the default handler prints the stack trace, and the thread terminates. Checked exceptions only propagate if each method in the chain declares them with `throws`; unchecked exceptions propagate automatically.",
      example: `public class PropagationDemo {
    static void level3() {
        throw new IllegalStateException("Something broke in level3");
    }

    static void level2() {
        level3();                  // not caught here, propagates up
    }

    static void level1() {
        try {
            level2();
        } catch (IllegalStateException e) {
            System.out.println("Caught in level1: " + e.getMessage());
        }
    }

    public static void main(String[] args) {
        level1();
    }
}`,
      interviewPoints: [
        'Uncaught exceptions move up the call stack',
        'Checked exceptions need throws at every level they pass through',
        'An uncaught exception terminates the thread',
        'Catch where you can actually handle it, not everywhere',
      ],
    },
  ],

  commonMistakes: [
    'Swallowing exceptions with an empty catch block, which hides bugs and makes production issues impossible to debug.',
    'Catching the generic `Exception` or `Throwable` everywhere, which also traps programming bugs and Errors you should not handle.',
    'Placing a `catch (Exception e)` before `catch (IOException e)`, which is a compile error because the second block is unreachable.',
    'Wrapping an exception without passing the cause, e.g. `throw new ServiceException(\"failed\")`, losing the original stack trace.',
    'Closing resources manually in finally and forgetting null checks or nested failures, instead of using try-with-resources.',
    'Using exceptions for normal control flow, such as looping until an ArrayIndexOutOfBoundsException, which is slow and unclear.',
    'Logging an exception and then rethrowing it at every layer, which prints the same stack trace many times.',
  ],

  interviewTips: [
    'Start by sketching the hierarchy: Throwable, then Error and Exception, then RuntimeException. Most follow-up questions become easy from there.',
    'When comparing checked and unchecked exceptions, give one concrete example of each and say when you would pick each one.',
    'Mention try-with-resources and suppressed exceptions whenever resource handling comes up; it signals modern Java knowledge.',
    'Link to Spring: explain that custom unchecked exceptions plus `@RestControllerAdvice` give consistent API error responses.',
    'Be ready for tricky output questions about `return` inside try and finally; walk through the order of execution out loud.',
  ],

  interviewQuestions: [
    {
      id: 'java-exceptions-q1',
      question: 'What is the difference between checked and unchecked exceptions?',
      answer: "Checked exceptions are subclasses of `Exception` (but not `RuntimeException`) that the compiler forces you to handle, either with try-catch or by declaring `throws`. Examples: `IOException`, `SQLException`. They represent recoverable conditions outside the program's control.\n\nUnchecked exceptions are subclasses of `RuntimeException` (and `Error`). The compiler does not force handling. Examples: `NullPointerException`, `IllegalArgumentException`. They usually signal programming bugs that should be fixed in code rather than caught.",
      points: [
        'Checked: compile-time enforced, extend Exception',
        'Unchecked: extend RuntimeException, not enforced',
        'Checked for external failures, unchecked for bugs',
      ],
      difficulty: 'Beginner',
    },
    {
      id: 'java-exceptions-q2',
      question: 'What is the difference between throw and throws?',
      answer: "`throw` is a statement used inside a method body to actually throw a single exception object, for example `throw new IllegalArgumentException(\"id is required\");`.\n\n`throws` is a clause in a method signature that declares which exceptions the method may throw, so callers know to handle them. It can list multiple exceptions, and it is mandatory only for checked exceptions.",
      example: `public void save(User user) throws IOException {   // throws: declaration
    if (user == null) {
        throw new IllegalArgumentException("user is null"); // throw: action
    }
    Files.writeString(Path.of("user.txt"), user.toString());
}`,
      points: [
        'throw: raises one exception instance',
        'throws: declares possible exceptions in the signature',
        'throws is required only for checked exceptions',
      ],
      difficulty: 'Beginner',
    },
    {
      id: 'java-exceptions-q3',
      question: 'What is the difference between an Exception and an Error?',
      answer: "Both extend `Throwable`. An `Exception` represents a condition the application can reasonably catch and recover from, such as invalid input, a missing file or a failed network call.\n\nAn `Error` represents a serious problem with the JVM or environment, like `OutOfMemoryError`, `StackOverflowError` or `NoClassDefFoundError`. Applications normally should not catch Errors, because the JVM may be in an unstable state and there is little you can do to recover.",
      points: [
        'Both are subclasses of Throwable',
        'Exception: application-level, recoverable',
        'Error: JVM-level, generally not recoverable',
      ],
      difficulty: 'Beginner',
    },
    {
      id: 'java-exceptions-q4',
      question: 'Does the finally block always execute?',
      answer: "Almost always. `finally` runs whether the try block completes normally, throws an exception that is caught, throws one that is not caught, or executes a `return`, `break` or `continue`.\n\nIt does not run if the JVM exits first, e.g. via `System.exit()`, a JVM crash, the process being killed, or if the thread runs forever inside the try (an infinite loop or deadlock). Also note that a `return` inside finally overrides any earlier return value and silently discards any pending exception, so avoid returning from finally.",
      example: `static int test() {
    try {
        return 1;
    } finally {
        System.out.println("finally runs");  // printed before returning 1
    }
}`,
      points: [
        'Runs after return, break, continue and exceptions',
        'Skipped on System.exit() or JVM crash',
        'return in finally overrides other returns and swallows exceptions',
      ],
      difficulty: 'Intermediate',
    },
    {
      id: 'java-exceptions-q5',
      question: 'What is try-with-resources and what are suppressed exceptions?',
      answer: "Try-with-resources, introduced in Java 7, automatically calls `close()` on resources declared in the try header once the block finishes, whether normally or with an exception. Any class that implements `AutoCloseable` can be used, and multiple resources are closed in reverse order.\n\nIf the try body throws an exception and then `close()` also throws, the body's exception is the one propagated, and the close exception is attached to it as a suppressed exception. You can inspect these with `e.getSuppressed()`. With manual finally-based cleanup, the close exception would replace and hide the original one.",
      example: `try (FileInputStream in = new FileInputStream("a.bin")) {
    process(in);
} catch (IOException e) {
    for (Throwable s : e.getSuppressed()) {
        System.out.println("Suppressed: " + s);
    }
}`,
      points: [
        'Automatic resource closing for AutoCloseable',
        'Closed in reverse order of declaration',
        'Close failures are recorded as suppressed exceptions',
        'Prevents resource leaks and hidden original exceptions',
      ],
      difficulty: 'Intermediate',
    },
    {
      id: 'java-exceptions-q6',
      question: 'How do you create a custom exception, and should it be checked or unchecked?',
      answer: "Create a class that extends `Exception` (checked) or `RuntimeException` (unchecked), and provide constructors that take a message and optionally a cause, calling `super(message, cause)`. You can add extra fields such as an error code.\n\nMost modern code, including Spring applications, uses unchecked custom exceptions for business errors like `OrderNotFoundException`, because they don't pollute every method signature and are easy to map to HTTP responses in a global handler. Use a checked exception only when callers can realistically recover and you want the compiler to force them to think about it.",
      example: `public class OrderNotFoundException extends RuntimeException {
    public OrderNotFoundException(Long id) {
        super("Order not found: " + id);
    }
}

@ExceptionHandler(OrderNotFoundException.class)
@ResponseStatus(HttpStatus.NOT_FOUND)
public ErrorResponse handle(OrderNotFoundException ex) {
    return new ErrorResponse(ex.getMessage());
}`,
      points: [
        'Extend Exception or RuntimeException',
        'Include message and cause constructors',
        'Unchecked is the common choice in Spring apps',
        'Use checked when recovery by the caller is expected',
      ],
      difficulty: 'Intermediate',
    },
    {
      id: 'java-exceptions-q7',
      question: 'Explain exception propagation in Java.',
      answer: "When a method throws an exception and doesn't catch it, the method terminates immediately and the exception is passed to the calling method. This continues up the call stack until a matching catch block is found. This process is called stack unwinding.\n\nIf no method handles it, the exception reaches the thread's uncaught exception handler, which prints the stack trace, and the thread dies (for the main thread, the program ends). Unchecked exceptions propagate automatically; checked exceptions must be declared with `throws` in every method they pass through.",
      points: [
        'Travels up the call stack until caught',
        'Each method stops at the point of the throw',
        'Checked exceptions need throws declarations along the way',
        'Uncaught exceptions terminate the thread',
      ],
      difficulty: 'Beginner',
    },
    {
      id: 'java-exceptions-q8',
      question: 'What is exception chaining and why is it important?',
      answer: "Exception chaining means wrapping a low-level exception inside a higher-level one while keeping the original as its cause, e.g. `throw new DataAccessException(\"Could not load user\", sqlException)`. The cause can be retrieved with `getCause()` and appears in the stack trace as \"Caused by:\".\n\nIt lets each layer speak its own language (a service throws a business exception, not a raw SQLException) without losing the root cause needed for debugging. Forgetting to pass the cause is a common mistake that throws away the most important part of the stack trace.",
      example: `public User findUser(long id) {
    try {
        return jdbcDao.load(id);
    } catch (SQLException e) {
        throw new UserLookupException("Failed to load user " + id, e); // keep cause
    }
}`,
      points: [
        'Wrap with a cause: new X(message, cause)',
        'Stack trace shows the full "Caused by" chain',
        'Translates low-level errors into domain errors',
        'Spring translates SQLExceptions into DataAccessException this way',
      ],
      difficulty: 'Advanced',
    },
    {
      id: 'java-exceptions-q9',
      question: 'What are the rules for exceptions when overriding a method?',
      answer: "An overriding method may throw the same checked exceptions as the parent method, narrower (subclass) checked exceptions, fewer checked exceptions, or none at all. It may not throw new or broader checked exceptions, because code using the parent type would not be prepared to handle them (it would break the Liskov Substitution Principle).\n\nUnchecked exceptions are not restricted: an overriding method can throw any RuntimeException regardless of what the parent declares.",
      example: `class Reader {
    void read() throws IOException { }
}

class FileReaderImpl extends Reader {
    @Override
    void read() throws FileNotFoundException { }   // OK: narrower
}

class BadReader extends Reader {
    // @Override
    // void read() throws Exception { }           // compile error: broader
}`,
      points: [
        'Same, narrower or no checked exceptions are allowed',
        'Broader or new checked exceptions are not allowed',
        'Unchecked exceptions are unrestricted',
        'Rule protects callers using the parent type',
      ],
      difficulty: 'Advanced',
    },
    {
      id: 'java-exceptions-q10',
      question: 'What will this code return, and why? A try block returns 1 and its finally block returns 2.',
      answer: "It returns 2. When the try block executes `return 1`, the value 1 is saved, then the finally block runs. Because finally executes its own `return 2`, that return completes the method and replaces the pending return value.\n\nThe same thing happens with exceptions: a return in finally discards any exception thrown in try or catch, so the caller never learns something went wrong. That's why returning from finally is considered bad practice and many linters flag it.",
      example: `static int value() {
    try {
        return 1;
    } finally {
        return 2;      // overrides the return from try
    }
}
// value() returns 2

static int trap() {
    try {
        throw new RuntimeException("lost!");
    } finally {
        return 0;      // exception is silently swallowed
    }
}`,
      points: [
        'finally runs after the try return value is computed',
        'A return in finally overrides it',
        'It also swallows pending exceptions',
        'Never return from finally',
      ],
      difficulty: 'Advanced',
    },
    {
      id: 'java-exceptions-q11',
      question: 'Why is catching Exception or Throwable generally a bad idea?',
      answer: "Catching `Exception` traps every checked and unchecked exception, including programming bugs like `NullPointerException` that should crash loudly so they get fixed. Catching `Throwable` is even worse: it also catches `Error`s like `OutOfMemoryError`, which the application cannot sensibly recover from.\n\nBroad catches often lead to swallowed errors and misleading behaviour. Catch the most specific exceptions you can actually handle. A broad catch is acceptable only at a top-level boundary, such as a global error handler, a thread's run loop or a scheduled job, where you log the error and keep the system running.",
      points: [
        'Hides bugs that should be fixed',
        'Throwable also catches unrecoverable Errors',
        'Catch specific exceptions you can handle',
        'Broad catches belong only at top-level boundaries',
      ],
      difficulty: 'Intermediate',
    },
  ],
}

export default topic
