const questions = [
  {
    id: 'streams-01',
    category: 'Java 8 Streams',
    topicId: 'java-8',
    title: 'Filter Even Numbers and Square Them',
    problem: 'From a list of integers, collect (a) only the even numbers, and (b) the squares of those even numbers, using streams.',
    input: 'numbers = [1, 2, 3, 4, 5, 6]',
    output: 'evens = [2, 4, 6], squares = [4, 16, 36]',
    explanation: 'A stream is a pipeline: a source, zero or more intermediate operations, and one terminal operation. `filter` keeps only elements that match the condition, `map` transforms each element into a new value, and `toList()` (Java 16+) collects the result into an unmodifiable list. Nothing runs until the terminal operation is called; this is called lazy evaluation.',
    solution: `import java.util.List;

public static void main(String[] args) {
    List<Integer> numbers = List.of(1, 2, 3, 4, 5, 6);

    List<Integer> evens = numbers.stream()
        .filter(n -> n % 2 == 0)        // keep even numbers
        .toList();

    List<Integer> squares = numbers.stream()
        .filter(n -> n % 2 == 0)
        .map(n -> n * n)                // transform each value
        .toList();

    System.out.println("evens = " + evens + ", squares = " + squares);
}`,
    complexity: 'Time: O(n), Space: O(n)',
    difficulty: 'Easy',
  },
  {
    id: 'streams-02',
    category: 'Java 8 Streams',
    topicId: 'java-8',
    title: 'Max, Min, Sum and Average with Streams',
    problem: 'Find the maximum, minimum, sum and average of a list of integers using streams.',
    input: 'numbers = [4, 8, 15, 16, 23, 42]',
    output: 'max = 42, min = 4, sum = 108, average = 18.0',
    explanation: '`mapToInt(Integer::intValue)` turns a `Stream<Integer>` into an `IntStream`, which has number-friendly methods like `sum()`, `max()` and `average()`. `max`, `min` and `average` return an `Optional` type because the stream might be empty. If you need all four values, `summaryStatistics()` computes them in a single pass instead of four.',
    solution: `import java.util.IntSummaryStatistics;
import java.util.List;

public static void main(String[] args) {
    List<Integer> numbers = List.of(4, 8, 15, 16, 23, 42);

    // One value at a time
    int max = numbers.stream().mapToInt(Integer::intValue).max().orElseThrow();
    int min = numbers.stream().mapToInt(Integer::intValue).min().orElseThrow();
    int sum = numbers.stream().mapToInt(Integer::intValue).sum();
    double average = numbers.stream().mapToInt(Integer::intValue).average().orElse(0.0);
    System.out.println("max = " + max + ", min = " + min + ", sum = " + sum + ", average = " + average);

    // All at once, in a single pass
    IntSummaryStatistics stats = numbers.stream()
        .mapToInt(Integer::intValue)
        .summaryStatistics();
    System.out.println(stats.getMax() + " " + stats.getMin() + " " + stats.getSum() + " " + stats.getAverage());
}`,
    complexity: 'Time: O(n), Space: O(1)',
    difficulty: 'Easy',
  },
  {
    id: 'streams-03',
    category: 'Java 8 Streams',
    topicId: 'java-8',
    title: 'Group Employees by Department',
    problem: 'Group a list of employees by department, producing a `Map<String, List<Employee>>`. Also show how to get just the names per department.',
    input: '[Ravi(IT, 70000), Asha(HR, 50000), Neha(IT, 90000), Vikram(Sales, 60000)]',
    output: '{HR=[Asha], IT=[Ravi, Neha], Sales=[Vikram]}',
    explanation: '`Collectors.groupingBy(Employee::department)` puts each employee into a list under its department key. `groupingBy` accepts a second "downstream" collector that decides what to collect per group; `Collectors.mapping(Employee::name, Collectors.toList())` stores only the names. Passing `TreeMap::new` as the map factory keeps department names sorted.',
    solution: `import java.util.List;
import java.util.Map;
import java.util.TreeMap;
import java.util.stream.Collectors;

public record Employee(String name, String department, double salary) { }

public static void main(String[] args) {
    List<Employee> employees = List.of(
        new Employee("Ravi", "IT", 70000),
        new Employee("Asha", "HR", 50000),
        new Employee("Neha", "IT", 90000),
        new Employee("Vikram", "Sales", 60000));

    Map<String, List<Employee>> byDepartment = employees.stream()
        .collect(Collectors.groupingBy(Employee::department));

    Map<String, List<String>> namesByDepartment = employees.stream()
        .collect(Collectors.groupingBy(
            Employee::department,
            TreeMap::new,                                         // sorted keys
            Collectors.mapping(Employee::name, Collectors.toList())));

    System.out.println(namesByDepartment);   // {HR=[Asha], IT=[Ravi, Neha], Sales=[Vikram]}
}`,
    complexity: 'Time: O(n) (O(n log d) with TreeMap for d departments), Space: O(n)',
    difficulty: 'Medium',
  },
  {
    id: 'streams-04',
    category: 'Java 8 Streams',
    topicId: 'java-8',
    title: 'Count Employees per Department',
    problem: 'Count how many employees work in each department using streams.',
    input: '[Ravi(IT), Asha(HR), Neha(IT), Vikram(Sales), Priya(IT)]',
    output: '{HR=1, IT=3, Sales=1}',
    explanation: 'Use `groupingBy` with `Collectors.counting()` as the downstream collector. Instead of building a list for each department, it just counts the elements in each group. Note that `counting()` returns a `Long`, so the map type is `Map<String, Long>`.',
    solution: `import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

public record Employee(String name, String department, double salary) { }

public static Map<String, Long> countByDepartment(List<Employee> employees) {
    return employees.stream()
        .collect(Collectors.groupingBy(
            Employee::department,
            Collectors.counting()));
}`,
    complexity: 'Time: O(n), Space: O(d) where d is the number of departments',
    difficulty: 'Medium',
  },
  {
    id: 'streams-05',
    category: 'Java 8 Streams',
    topicId: 'java-8',
    title: 'Average Salary by Department',
    problem: 'Compute the average salary of each department using streams.',
    input: '[Ravi(IT, 70000), Asha(HR, 50000), Neha(IT, 90000), Kavya(HR, 60000)]',
    output: '{HR=55000.0, IT=80000.0}',
    explanation: 'Again use `groupingBy`, this time with `Collectors.averagingDouble(Employee::salary)` as the downstream collector. It sums salaries and counts employees inside each group, then divides, giving a `Double` per department. Similar collectors exist for totals (`summingDouble`) and for the highest earner (`maxBy`).',
    solution: `import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

public record Employee(String name, String department, double salary) { }

public static Map<String, Double> averageSalaryByDepartment(List<Employee> employees) {
    return employees.stream()
        .collect(Collectors.groupingBy(
            Employee::department,
            Collectors.averagingDouble(Employee::salary)));
}`,
    complexity: 'Time: O(n), Space: O(d) where d is the number of departments',
    difficulty: 'Medium',
  },
  {
    id: 'streams-06',
    category: 'Java 8 Streams',
    topicId: 'java-8',
    title: 'Second Highest Salary with Streams',
    problem: 'Find the second highest distinct salary among employees. Return an empty `Optional` if it does not exist.',
    input: 'salaries = [70000, 90000, 50000, 90000, 60000]',
    output: 'Optional[70000.0]',
    explanation: 'Map employees to their salaries, then call `distinct()` so that two people earning the top salary do not both count as first. Sort in descending order with `Comparator.reverseOrder()`, `skip(1)` to throw away the highest, and `findFirst()` to take the next one. `findFirst` returns an `Optional`, which is empty when there are fewer than two distinct salaries, so the caller never gets a surprise exception.',
    solution: `import java.util.Comparator;
import java.util.List;
import java.util.Optional;

public record Employee(String name, String department, double salary) { }

public static Optional<Double> secondHighestSalary(List<Employee> employees) {
    return employees.stream()
        .map(Employee::salary)
        .distinct()                         // ignore duplicate salaries
        .sorted(Comparator.reverseOrder())  // highest first
        .skip(1)                            // drop the highest
        .findFirst();
}`,
    complexity: 'Time: O(n log n), Space: O(n)',
    difficulty: 'Hard',
  },
  {
    id: 'streams-07',
    category: 'Java 8 Streams',
    topicId: 'java-8',
    title: 'Find Duplicate Elements with Streams',
    problem: 'Find all elements that appear more than once in a list, using streams.',
    input: 'numbers = [1, 2, 3, 2, 4, 5, 1, 2]',
    output: '[1, 2]',
    explanation: 'Group the elements by themselves with `Function.identity()` and count them, giving a map from value to count. Then stream over the map entries, keep those with a count greater than 1, and collect their keys. A shorter trick is `filter(n -> !seen.add(n))` with a `HashSet`, but it relies on a side effect inside a lambda, which is discouraged (it breaks with parallel streams).',
    solution: `import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

public static Set<Integer> findDuplicates(List<Integer> numbers) {
    Map<Integer, Long> counts = numbers.stream()
        .collect(Collectors.groupingBy(Function.identity(), Collectors.counting()));

    return counts.entrySet().stream()
        .filter(entry -> entry.getValue() > 1)
        .map(Map.Entry::getKey)
        .collect(Collectors.toSet());
}`,
    complexity: 'Time: O(n), Space: O(n)',
    difficulty: 'Medium',
  },
  {
    id: 'streams-08',
    category: 'Java 8 Streams',
    topicId: 'java-8',
    title: 'Join Strings with a Delimiter',
    problem: 'Join a list of names into one string separated by commas, wrapped in square brackets, and with every name in uppercase.',
    input: 'names = ["asha", "ravi", "neha"]',
    output: '"[ASHA, RAVI, NEHA]"',
    explanation: '`Collectors.joining(delimiter, prefix, suffix)` concatenates the stream elements into one String, putting the delimiter between them and the prefix and suffix around the whole result. It uses a `StringBuilder` internally, so it is efficient. Before joining, `map(String::toUpperCase)` converts each name.',
    solution: `import java.util.List;
import java.util.stream.Collectors;

public static String joinNames(List<String> names) {
    return names.stream()
        .map(String::toUpperCase)
        .collect(Collectors.joining(", ", "[", "]"));
}`,
    complexity: 'Time: O(n) in the total length of the names, Space: O(n)',
    difficulty: 'Easy',
  },
  {
    id: 'streams-09',
    category: 'Java 8 Streams',
    topicId: 'java-8',
    title: 'Flatten a List of Lists with flatMap',
    problem: 'Turn a list of lists of integers into a single flat list containing all the numbers.',
    input: 'nested = [[1, 2], [3, 4, 5], [6]]',
    output: '[1, 2, 3, 4, 5, 6]',
    explanation: '`map` would give a stream of lists (one element per inner list). `flatMap` instead takes a function that returns a stream for each element, then merges all of those small streams into one big stream. Passing `List::stream` turns each inner list into a stream of its numbers, so the result is a single stream of integers that we collect.',
    solution: `import java.util.List;

public static List<Integer> flatten(List<List<Integer>> nested) {
    return nested.stream()
        .flatMap(List::stream)          // each inner list becomes a stream
        .toList();
}`,
    complexity: 'Time: O(n) where n is the total number of elements, Space: O(n)',
    difficulty: 'Easy',
  },
  {
    id: 'streams-10',
    category: 'Java 8 Streams',
    topicId: 'java-8',
    title: 'Split a List with partitioningBy',
    problem: 'Split a list of numbers into two groups: even and odd. Also split employees into those earning more than 60000 and the rest.',
    input: 'numbers = [1, 2, 3, 4, 5, 6, 7]',
    output: '{false=[1, 3, 5, 7], true=[2, 4, 6]}',
    explanation: '`Collectors.partitioningBy(predicate)` is a special form of grouping with a boolean condition. It always returns a map with exactly two keys, `true` and `false`, even if one of the groups is empty. Like `groupingBy`, it accepts a downstream collector, for example `Collectors.counting()` to count each side.',
    solution: `import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

public record Employee(String name, String department, double salary) { }

public static void main(String[] args) {
    List<Integer> numbers = List.of(1, 2, 3, 4, 5, 6, 7);
    Map<Boolean, List<Integer>> evenAndOdd = numbers.stream()
        .collect(Collectors.partitioningBy(n -> n % 2 == 0));
    System.out.println(evenAndOdd);   // {false=[1, 3, 5, 7], true=[2, 4, 6]}

    List<Employee> employees = List.of(
        new Employee("Ravi", "IT", 70000),
        new Employee("Asha", "HR", 50000),
        new Employee("Neha", "IT", 90000));
    Map<Boolean, Long> highEarnerCount = employees.stream()
        .collect(Collectors.partitioningBy(
            e -> e.salary() > 60000,
            Collectors.counting()));
    System.out.println(highEarnerCount);   // {false=1, true=2}
}`,
    complexity: 'Time: O(n), Space: O(n)',
    difficulty: 'Medium',
  },
  {
    id: 'streams-11',
    category: 'Java 8 Streams',
    topicId: 'java-8',
    title: 'Sort by Salary Descending, then by Name',
    problem: 'Sort employees by salary from highest to lowest; when two salaries are equal, sort those employees by name alphabetically. Return the sorted names.',
    input: '[Ravi(70000), Asha(90000), Amit(70000), Neha(50000)]',
    output: '[Asha, Amit, Ravi, Neha]',
    explanation: '`sorted` takes a `Comparator`. `Comparator.comparingDouble(Employee::salary).reversed()` orders by salary descending, and `thenComparing(Employee::name)` breaks ties by name ascending. Be careful: calling `reversed()` at the end of the whole chain would reverse the name order too, so apply it only to the salary comparator. Streams never modify the source list; `sorted` produces a new ordering.',
    solution: `import java.util.Comparator;
import java.util.List;

public record Employee(String name, String department, double salary) { }

public static List<String> sortBySalaryThenName(List<Employee> employees) {
    Comparator<Employee> bySalaryDesc =
        Comparator.comparingDouble(Employee::salary).reversed();

    return employees.stream()
        .sorted(bySalaryDesc.thenComparing(Employee::name))
        .map(Employee::name)
        .toList();
}`,
    complexity: 'Time: O(n log n), Space: O(n)',
    difficulty: 'Medium',
  },
  {
    id: 'streams-12',
    category: 'Java 8 Streams',
    topicId: 'java-8',
    title: 'First Non-Repeated Character with Streams',
    problem: 'Find the first character in a string that does not repeat, using streams. Return an empty `Optional` if there is none.',
    input: 'str = "swiss"',
    output: 'Optional[w]',
    explanation: '`str.chars()` gives an `IntStream` of character codes, and `mapToObj(c -> (char) c)` turns them into `Character` objects. We group by the character itself and count, using `LinkedHashMap::new` so the map keeps the order in which characters first appear (a plain `HashMap` would lose it and give a wrong answer). Finally we stream the entries, keep those with count 1, and take the first one.',
    solution: `import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;
import java.util.function.Function;
import java.util.stream.Collectors;

public static Optional<Character> firstNonRepeated(String str) {
    Map<Character, Long> counts = str.chars()
        .mapToObj(c -> (char) c)
        .collect(Collectors.groupingBy(
            Function.identity(),
            LinkedHashMap::new,             // keep first-appearance order
            Collectors.counting()));

    return counts.entrySet().stream()
        .filter(entry -> entry.getValue() == 1)
        .map(Map.Entry::getKey)
        .findFirst();
}`,
    complexity: 'Time: O(n), Space: O(k) where k is the number of distinct characters',
    difficulty: 'Hard',
  },
]

export default questions
