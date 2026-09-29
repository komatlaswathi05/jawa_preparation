const questions = [
  {
    id: 'collections-01',
    category: 'Collections',
    topicId: 'java-collections',
    title: 'Remove Duplicates from an ArrayList',
    problem: 'Remove duplicate elements from an `ArrayList` while keeping the original order of first appearance.',
    input: 'list = [3, 1, 3, 2, 1, 4]',
    output: '[3, 1, 2, 4]',
    explanation: 'A `Set` never stores duplicates. `LinkedHashSet` is a set that also remembers insertion order, so passing the list to its constructor removes duplicates while keeping the first occurrence of each value in place. We then wrap it back into a new `ArrayList`. Using a plain `HashSet` would also remove duplicates but could scramble the order.',
    solution: `import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;

public static List<Integer> removeDuplicates(List<Integer> list) {
    return new ArrayList<>(new LinkedHashSet<>(list));
}`,
    complexity: 'Time: O(n), Space: O(n)',
    difficulty: 'Easy',
  },
  {
    id: 'collections-02',
    category: 'Collections',
    topicId: 'java-collections',
    title: 'Find Duplicate Elements in a List',
    problem: 'Given a list of strings, return the elements that appear more than once (each reported once).',
    input: 'list = ["apple", "banana", "apple", "cherry", "banana", "apple"]',
    output: '[apple, banana]',
    explanation: 'Walk the list with two sets. `seen` holds everything met so far. `Set.add` returns false when the element was already present, which tells us it is a duplicate, so we add it to `duplicates`. Because `duplicates` is a set too, "apple" appearing three times is still reported once. `LinkedHashSet` keeps the order in which duplicates were discovered.',
    solution: `import java.util.HashSet;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

public static Set<String> findDuplicates(List<String> list) {
    Set<String> seen = new HashSet<>();
    Set<String> duplicates = new LinkedHashSet<>();
    for (String item : list) {
        if (!seen.add(item)) {
            duplicates.add(item);
        }
    }
    return duplicates;
}`,
    complexity: 'Time: O(n), Space: O(n)',
    difficulty: 'Easy',
  },
  {
    id: 'collections-03',
    category: 'Collections',
    topicId: 'java-collections',
    title: 'Sort a List with Comparator on Multiple Fields',
    problem: 'Sort a list of employees by department (A to Z), then by salary (highest first), and then by name (A to Z) when salaries are equal.',
    input: '[Ravi(IT, 70000), Asha(HR, 50000), Neha(IT, 90000), Amit(IT, 70000)]',
    output: '[Asha(HR, 50000), Neha(IT, 90000), Amit(IT, 70000), Ravi(IT, 70000)]',
    explanation: 'A `Comparator` decides the order of two objects. `Comparator.comparing(Employee::department)` sorts by department first. `thenComparing` adds a tie-breaker used only when the previous fields are equal. `Comparator.reverseOrder()` flips the salary order so the highest comes first. `list.sort` sorts the list in place and is stable, meaning equal elements keep their relative order.',
    solution: `import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

public record Employee(String name, String department, double salary) { }

public static void main(String[] args) {
    List<Employee> employees = new ArrayList<>(List.of(
        new Employee("Ravi", "IT", 70000),
        new Employee("Asha", "HR", 50000),
        new Employee("Neha", "IT", 90000),
        new Employee("Amit", "IT", 70000)));

    employees.sort(Comparator
        .comparing(Employee::department)                              // 1st: department A-Z
        .thenComparing(Employee::salary, Comparator.reverseOrder())   // 2nd: salary high-low
        .thenComparing(Employee::name));                              // 3rd: name A-Z

    employees.forEach(System.out::println);
}`,
    complexity: 'Time: O(n log n), Space: O(n) (TimSort buffer)',
    difficulty: 'Medium',
  },
  {
    id: 'collections-04',
    category: 'Collections',
    topicId: 'java-collections',
    title: 'Sort Objects Using Comparable',
    problem: 'Make a `Student` class sortable by roll number using the `Comparable` interface, then sort a list of students with `Collections.sort`.',
    input: '[Student(3, "Kiran"), Student(1, "Meera"), Student(2, "Arjun")]',
    output: '[1 Meera, 2 Arjun, 3 Kiran]',
    explanation: '`Comparable` defines the natural order of a class through one method, `compareTo`. It must return a negative number if this object comes first, zero if they are equal, and a positive number if this object comes after. `Integer.compare` does this safely (subtracting ints can overflow). Once the class implements `Comparable`, `Collections.sort(list)` and `TreeSet` know how to order it without an extra comparator.',
    solution: `import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

public class Student implements Comparable<Student> {
    private final int rollNumber;
    private final String name;

    public Student(int rollNumber, String name) {
        this.rollNumber = rollNumber;
        this.name = name;
    }

    @Override
    public int compareTo(Student other) {
        return Integer.compare(this.rollNumber, other.rollNumber);
    }

    @Override
    public String toString() {
        return rollNumber + " " + name;
    }

    public static void main(String[] args) {
        List<Student> students = new ArrayList<>();
        students.add(new Student(3, "Kiran"));
        students.add(new Student(1, "Meera"));
        students.add(new Student(2, "Arjun"));

        Collections.sort(students);         // uses compareTo
        System.out.println(students);
    }
}`,
    complexity: 'Time: O(n log n), Space: O(n)',
    difficulty: 'Easy',
  },
  {
    id: 'collections-05',
    category: 'Collections',
    topicId: 'java-collections',
    title: 'Safely Remove Elements While Iterating',
    problem: 'Remove all even numbers from a list while looping over it, without getting a `ConcurrentModificationException`.',
    input: 'list = [1, 2, 3, 4, 5, 6]',
    output: '[1, 3, 5]',
    explanation: 'Calling `list.remove()` inside a for-each loop changes the list behind the iterator\'s back, so the next step throws `ConcurrentModificationException`. The safe way is to use an explicit `Iterator` and call `iterator.remove()`, which removes the last returned element and keeps the iterator in sync. Since Java 8 you can also write `list.removeIf(n -> n % 2 == 0)`, which does the same thing in one line.',
    solution: `import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;

public static void removeEvens(List<Integer> numbers) {
    Iterator<Integer> iterator = numbers.iterator();
    while (iterator.hasNext()) {
        int number = iterator.next();
        if (number % 2 == 0) {
            iterator.remove();      // safe: removes via the iterator
        }
    }
}

public static void main(String[] args) {
    List<Integer> numbers = new ArrayList<>(List.of(1, 2, 3, 4, 5, 6));
    removeEvens(numbers);
    System.out.println(numbers);    // [1, 3, 5]

    // Java 8+ one-liner doing the same thing:
    List<Integer> others = new ArrayList<>(List.of(1, 2, 3, 4, 5, 6));
    others.removeIf(n -> n % 2 == 0);
}`,
    complexity: 'Time: O(n²) worst case for ArrayList (each remove shifts elements); removeIf is O(n). Space: O(1)',
    difficulty: 'Medium',
  },
  {
    id: 'collections-06',
    category: 'Collections',
    topicId: 'java-collections',
    title: 'LRU Cache Using LinkedHashMap',
    problem: 'Implement a Least Recently Used (LRU) cache with a fixed capacity. `get` and `put` should be O(1), and when the cache is full, adding a new key must evict the key that was used least recently.',
    input: 'capacity = 2; put(1,"A"), put(2,"B"), get(1), put(3,"C")',
    output: 'Cache now holds {1=A, 3=C} (key 2 was evicted)',
    explanation: '`LinkedHashMap` can keep entries in access order when its constructor is called with `accessOrder = true`: every `get` or `put` moves that entry to the end, so the first entry is always the least recently used. It also has a hook method, `removeEldestEntry`, which it calls after each insert. By overriding it to return true when the size exceeds the capacity, the map evicts the eldest entry automatically.',
    solution: `import java.util.LinkedHashMap;
import java.util.Map;

public class LRUCache<K, V> extends LinkedHashMap<K, V> {
    private final int capacity;

    public LRUCache(int capacity) {
        // initialCapacity, loadFactor, accessOrder = true (order by recent use)
        super(capacity, 0.75f, true);
        this.capacity = capacity;
    }

    @Override
    protected boolean removeEldestEntry(Map.Entry<K, V> eldest) {
        return size() > capacity;   // evict least recently used when full
    }

    public static void main(String[] args) {
        LRUCache<Integer, String> cache = new LRUCache<>(2);
        cache.put(1, "A");
        cache.put(2, "B");
        cache.get(1);               // 1 is now the most recently used
        cache.put(3, "C");          // evicts 2
        System.out.println(cache);  // {1=A, 3=C}
    }
}`,
    complexity: 'Time: O(1) for get and put, Space: O(capacity)',
    difficulty: 'Hard',
  },
  {
    id: 'collections-07',
    category: 'Collections',
    topicId: 'java-collections',
    title: 'Count Word Frequency with a HashMap',
    problem: 'Count how many times each word appears in a sentence (case-insensitive).',
    input: 'text = "the cat and the hat and the bat"',
    output: '{the=3, cat=1, and=2, hat=1, bat=1}',
    explanation: 'Split the lowercase text into words, then update a map for each word. `getOrDefault(word, 0)` returns the current count, or 0 if the word has not been seen yet, and we store that plus one. A `LinkedHashMap` keeps the words in the order they first appeared, which makes the output easier to read.',
    solution: `import java.util.LinkedHashMap;
import java.util.Map;

public static Map<String, Integer> wordFrequency(String text) {
    Map<String, Integer> counts = new LinkedHashMap<>();
    for (String word : text.toLowerCase().split("\\\\s+")) {
        counts.put(word, counts.getOrDefault(word, 0) + 1);
    }
    return counts;
}`,
    complexity: 'Time: O(n), Space: O(k) where k is the number of distinct words',
    difficulty: 'Easy',
  },
  {
    id: 'collections-08',
    category: 'Collections',
    topicId: 'java-collections',
    title: 'Intersection and Union of Two Lists',
    problem: 'Given two lists of integers, return their intersection (elements in both) and their union (elements in either), without duplicates.',
    input: 'list1 = [1, 2, 3, 4], list2 = [3, 4, 5, 6]',
    output: 'Intersection: [3, 4], Union: [1, 2, 3, 4, 5, 6]',
    explanation: 'Sets have built-in bulk operations. `retainAll` keeps only the elements that are also in the other collection, which is exactly an intersection. `addAll` adds everything from the other collection, and since a set ignores duplicates the result is the union. We always copy into a new `LinkedHashSet` first so the original lists are not changed.',
    solution: `import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

public static Set<Integer> intersection(List<Integer> list1, List<Integer> list2) {
    Set<Integer> result = new LinkedHashSet<>(list1);
    result.retainAll(new LinkedHashSet<>(list2));   // keep only common elements
    return result;
}

public static Set<Integer> union(List<Integer> list1, List<Integer> list2) {
    Set<Integer> result = new LinkedHashSet<>(list1);
    result.addAll(list2);                           // duplicates are ignored
    return result;
}`,
    complexity: 'Time: O(n + m), Space: O(n + m)',
    difficulty: 'Medium',
  },
  {
    id: 'collections-09',
    category: 'Collections',
    topicId: 'java-collections',
    title: 'Top K Frequent Elements with PriorityQueue',
    problem: 'Return the k elements that appear most often in an array.',
    input: 'nums = [1, 1, 1, 2, 2, 3], k = 2',
    output: '[1, 2]',
    explanation: 'First count frequencies with a `HashMap`. Then use a `PriorityQueue` as a min-heap ordered by frequency and keep at most k entries in it: when it grows beyond k, `poll` removes the least frequent one. At the end the heap holds the k most frequent elements. Keeping the heap small makes this O(n log k), better than sorting all distinct values.',
    solution: `import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.PriorityQueue;

public static List<Integer> topKFrequent(int[] nums, int k) {
    Map<Integer, Integer> frequency = new HashMap<>();
    for (int num : nums) {
        frequency.merge(num, 1, Integer::sum);
    }

    // Min-heap: the entry with the LOWEST count sits at the top
    PriorityQueue<Map.Entry<Integer, Integer>> minHeap =
        new PriorityQueue<>((a, b) -> Integer.compare(a.getValue(), b.getValue()));

    for (Map.Entry<Integer, Integer> entry : frequency.entrySet()) {
        minHeap.offer(entry);
        if (minHeap.size() > k) {
            minHeap.poll();         // drop the least frequent
        }
    }

    List<Integer> result = new ArrayList<>();
    while (!minHeap.isEmpty()) {
        result.add(0, minHeap.poll().getKey());  // most frequent first
    }
    return result;
}`,
    complexity: 'Time: O(n log k), Space: O(n)',
    difficulty: 'Hard',
  },
  {
    id: 'collections-10',
    category: 'Collections',
    topicId: 'java-collections',
    title: 'Implement a Stack Using Deque',
    problem: 'Build a simple generic stack (last in, first out) with `push`, `pop`, `peek` and `isEmpty`, using `ArrayDeque` internally.',
    input: 'push(10), push(20), push(30), pop(), peek()',
    output: 'pop -> 30, peek -> 20',
    explanation: 'The legacy `Stack` class is synchronized and extends `Vector`, so the Java docs recommend `Deque` instead. `ArrayDeque` lets us add and remove at the front in O(1): `push` adds to the head, `pop` removes from the head, and `peek` reads it without removing. We throw an exception on an empty stack to make misuse obvious.',
    solution: `import java.util.ArrayDeque;
import java.util.Deque;
import java.util.NoSuchElementException;

public class MyStack<T> {
    private final Deque<T> items = new ArrayDeque<>();

    public void push(T item) {
        items.push(item);           // add to the top
    }

    public T pop() {
        if (items.isEmpty()) {
            throw new NoSuchElementException("Stack is empty");
        }
        return items.pop();         // remove from the top
    }

    public T peek() {
        if (items.isEmpty()) {
            throw new NoSuchElementException("Stack is empty");
        }
        return items.peek();        // look at the top without removing
    }

    public boolean isEmpty() {
        return items.isEmpty();
    }

    public int size() {
        return items.size();
    }
}`,
    complexity: 'Time: O(1) for every operation, Space: O(n)',
    difficulty: 'Easy',
  },
  {
    id: 'collections-11',
    category: 'Collections',
    topicId: 'java-collections',
    title: 'Group Objects by a Field',
    problem: 'Group a list of employees by their department into a `Map<String, List<Employee>>`, without using streams.',
    input: '[Ravi(IT), Asha(HR), Neha(IT), Vikram(Sales)]',
    output: '{IT=[Ravi, Neha], HR=[Asha], Sales=[Vikram]}',
    explanation: '`computeIfAbsent(key, k -> new ArrayList<>())` returns the list for that department, creating and storing an empty list first if the department is new. We then add the employee to that list. This replaces the older, longer pattern of checking `containsKey`, creating a list and calling `put`.',
    solution: `import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

public record Employee(String name, String department) { }

public static Map<String, List<Employee>> groupByDepartment(List<Employee> employees) {
    Map<String, List<Employee>> byDepartment = new LinkedHashMap<>();
    for (Employee employee : employees) {
        byDepartment
            .computeIfAbsent(employee.department(), dept -> new ArrayList<>())
            .add(employee);
    }
    return byDepartment;
}`,
    complexity: 'Time: O(n), Space: O(n)',
    difficulty: 'Medium',
  },
  {
    id: 'collections-12',
    category: 'Collections',
    topicId: 'java-collections',
    title: 'Convert a List to a Map',
    problem: 'Convert a list of products into a map from product id to product. If two products share the same id, keep the first one.',
    input: '[Product(101, "Pen"), Product(102, "Book"), Product(101, "Pencil")]',
    output: '{101=Product[id=101, name=Pen], 102=Product[id=102, name=Book]}',
    explanation: 'Loop over the list and call `putIfAbsent(id, product)`, which only stores the value if the key is not already present, so the first product with each id wins. The stream version uses `Collectors.toMap`; its third argument is a merge function that decides what to do on a duplicate key. Without it, `toMap` throws `IllegalStateException` on duplicates, which is a common interview gotcha.',
    solution: `import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

public record Product(int id, String name) { }

// Loop version
public static Map<Integer, Product> toMap(List<Product> products) {
    Map<Integer, Product> byId = new LinkedHashMap<>();
    for (Product product : products) {
        byId.putIfAbsent(product.id(), product);   // keep the first one
    }
    return byId;
}

// Stream version
public static Map<Integer, Product> toMapWithStream(List<Product> products) {
    return products.stream()
        .collect(Collectors.toMap(
            Product::id,                    // key
            product -> product,             // value
            (first, second) -> first,       // on duplicate key, keep first
            LinkedHashMap::new));           // keep insertion order
}`,
    complexity: 'Time: O(n), Space: O(n)',
    difficulty: 'Medium',
  },
]

export default questions
