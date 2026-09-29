const topic = {
  id: 'java-collections',
  category: 'java',
  title: 'Java Collections',
  description: "Java's ready-made data structures for storing, searching and sorting groups of objects: List, Set, Map, Queue and their implementations.",
  difficulty: 'Intermediate',
  overview: "The Java Collections Framework is a set of interfaces and classes in `java.util` that store groups of objects. Instead of writing your own dynamic array, linked list or hash table, you use `ArrayList`, `LinkedList` or `HashMap`, which are already tested and fast.\n\nThink of it like a kitchen. A `List` is a stack of plates in order, a `Set` is a spice rack where every spice appears only once, a `Map` is a set of labelled jars (label = key, contents = value), and a `Queue` is the line of orders waiting to be cooked. You pick the container that matches how you need to use the data.\n\nCollections come up in almost every backend interview because every real application uses them: a REST API returns a `List` of users, a cache is a `Map`, a job scheduler uses a `Queue`. Interviewers love asking how `HashMap` works internally, the difference between `ArrayList` and `LinkedList`, and the `equals()`/`hashCode()` contract.\n\nThe key skill is choosing the right collection: know what each one guarantees (order, uniqueness, sorting, thread-safety) and how fast its main operations are.",

  subtopics: [
    {
      id: 'collection-framework',
      title: 'Collection Framework',
      explanation: "The framework is built from interfaces (what a collection can do) and implementations (how it does it). The root interface `Collection` has three main children: `List`, `Set` and `Queue`. `Map` is part of the framework but does NOT extend `Collection`, because it stores key-value pairs instead of single elements.\n\nYou should program to the interface: declare variables as `List` or `Map` and choose the implementation only on the right side. That way you can swap `ArrayList` for `LinkedList` without changing the rest of your code.",
      example: `// Program to the interface, choose the implementation once
List<String> names = new ArrayList<>();
Set<Integer> ids = new HashSet<>();
Map<String, Integer> stock = new HashMap<>();
Queue<String> tasks = new ArrayDeque<>();

// Utility class with static helpers
Collections.sort(names);
Collections.unmodifiableList(names);`,
      interviewPoints: [
        'Collection is an interface; Collections is a utility class with static helper methods.',
        'Map is not a subtype of Collection.',
        'Iterable is the parent of Collection, which is why every collection works in a for-each loop.',
      ],
    },
    {
      id: 'list',
      title: 'List',
      explanation: "A `List` is an ordered collection that allows duplicates. Every element has an index starting at 0, so you can get, set, insert or remove by position. Use a `List` when order matters and repeated values are allowed, for example a list of orders in the order they arrived.",
      example: `List<String> cities = new ArrayList<>();
cities.add("Delhi");
cities.add("Pune");
cities.add("Delhi");          // duplicates allowed
cities.add(1, "Mumbai");      // insert at index 1
System.out.println(cities.get(0));   // Delhi
System.out.println(cities);          // [Delhi, Mumbai, Pune, Delhi]
cities.remove("Pune");`,
      interviewPoints: [
        'Ordered by insertion (index-based) and allows duplicates and nulls.',
        'Main implementations: ArrayList, LinkedList, and the legacy Vector.',
      ],
    },
    {
      id: 'set',
      title: 'Set',
      explanation: "A `Set` stores unique elements only: adding an element that is already present does nothing and `add()` returns false. Uniqueness is decided by `equals()` and `hashCode()` (or by `compareTo()` for sorted sets). Use a `Set` when you need to remove duplicates or check membership quickly.",
      example: `Set<String> tags = new HashSet<>();
System.out.println(tags.add("java"));   // true
System.out.println(tags.add("java"));   // false, already present
System.out.println(tags.contains("java")); // true
System.out.println(tags.size());        // 1`,
      interviewPoints: [
        'No duplicates; at most one null for HashSet and LinkedHashSet.',
        'HashSet = no order, LinkedHashSet = insertion order, TreeSet = sorted order.',
      ],
    },
    {
      id: 'map',
      title: 'Map',
      explanation: "A `Map` stores key-value pairs. Keys are unique; values can repeat. Putting a value with an existing key replaces the old value. Maps are perfect for lookups by id, counting things, and caching.\n\nUseful modern methods include `getOrDefault()`, `putIfAbsent()`, `computeIfAbsent()` and `merge()`.",
      example: `Map<String, Integer> wordCount = new HashMap<>();
for (String w : "to be or not to be".split(" ")) {
    wordCount.merge(w, 1, Integer::sum);
}
System.out.println(wordCount.get("to"));            // 2
System.out.println(wordCount.getOrDefault("xyz", 0)); // 0

for (Map.Entry<String, Integer> e : wordCount.entrySet()) {
    System.out.println(e.getKey() + " = " + e.getValue());
}`,
      interviewPoints: [
        'Keys are unique; a second put() with the same key overwrites the value and returns the old one.',
        'Iterate with entrySet() to get key and value together efficiently.',
        'Implementations: HashMap, LinkedHashMap, TreeMap, Hashtable, ConcurrentHashMap.',
      ],
    },
    {
      id: 'queue-deque',
      title: 'Queue & Deque',
      explanation: "A `Queue` holds elements waiting to be processed, usually in FIFO order (first in, first out), like people in a line. `offer()` adds, `poll()` removes the head, and `peek()` looks at the head without removing it. These return special values (false/null) instead of throwing exceptions like `add()`, `remove()` and `element()` do.\n\nA `Deque` (double-ended queue, pronounced \"deck\") lets you add and remove at both ends, so it works as both a queue and a stack. `ArrayDeque` is the recommended stack implementation instead of the old `Stack` class.",
      example: `Queue<String> queue = new ArrayDeque<>();
queue.offer("A");
queue.offer("B");
System.out.println(queue.poll()); // A (FIFO)

Deque<Integer> stack = new ArrayDeque<>();
stack.push(1);
stack.push(2);
System.out.println(stack.pop());  // 2 (LIFO)
System.out.println(stack.peek()); // 1`,
      interviewPoints: [
        'offer/poll/peek return false/null; add/remove/element throw exceptions.',
        'Use ArrayDeque for stacks and queues; it is faster than Stack and LinkedList.',
        'ArrayDeque does not allow null elements.',
      ],
    },
    {
      id: 'arraylist',
      title: 'ArrayList',
      explanation: "`ArrayList` is a resizable array. Internally it keeps an `Object[]`; when that array is full, it creates a bigger one (about 1.5 times the size) and copies the elements over. Reading by index is instant (O(1)), and adding at the end is O(1) on average. Inserting or removing in the middle is O(n) because elements must shift.\n\nIt is the default choice for a `List` in almost all code.",
      example: `List<Integer> nums = new ArrayList<>(100); // optional initial capacity
nums.add(10);          // O(1) amortized
nums.add(20);
int first = nums.get(0);   // O(1) random access
nums.add(0, 5);        // O(n): shifts elements right
nums.remove(Integer.valueOf(20)); // remove by value, not index`,
      interviewPoints: [
        'Backed by a dynamic array; default capacity 10, grows by about 50%.',
        'Fast random access, slow middle insert/delete.',
        'Not synchronized (not thread-safe).',
      ],
    },
    {
      id: 'linkedlist',
      title: 'LinkedList',
      explanation: "`LinkedList` is a doubly linked list: each element is a node that points to the previous and next node. Adding or removing at the start or end is O(1), but getting element number 500 means walking through 500 nodes, so `get(i)` is O(n). It implements both `List` and `Deque`.\n\nIn practice `ArrayList` is faster for almost everything because arrays are cache-friendly, so `LinkedList` is rarely the best choice.",
      example: `LinkedList<String> list = new LinkedList<>();
list.add("B");
list.addFirst("A");   // O(1)
list.addLast("C");    // O(1)
System.out.println(list.getFirst()); // A
System.out.println(list.get(1));     // B, but O(n) walk
list.removeFirst();`,
      interviewPoints: [
        'Doubly linked list; implements List and Deque.',
        'O(1) insert/remove at ends, O(n) access by index.',
        'Uses more memory per element than ArrayList (two extra pointers per node).',
      ],
    },
    {
      id: 'hashset-linkedhashset-treeset',
      title: 'HashSet, LinkedHashSet & TreeSet',
      explanation: "`HashSet` is backed by a `HashMap` (elements are stored as keys). It gives O(1) add/contains/remove but no ordering guarantee. `LinkedHashSet` adds a linked list through the entries, so it remembers insertion order, at a small memory cost.\n\n`TreeSet` keeps elements sorted using a red-black tree (a self-balancing binary search tree). Operations are O(log n), and it offers navigation methods like `first()`, `last()`, `floor()` and `ceiling()`. Elements must be `Comparable` or you must pass a `Comparator`. `TreeSet` does not allow null.",
      example: `Set<String> hash = new HashSet<>(List.of("banana", "apple", "cherry"));
Set<String> linked = new LinkedHashSet<>(List.of("banana", "apple", "cherry"));
TreeSet<String> tree = new TreeSet<>(List.of("banana", "apple", "cherry"));

System.out.println(hash);   // some unpredictable order
System.out.println(linked); // [banana, apple, cherry]
System.out.println(tree);   // [apple, banana, cherry]
System.out.println(tree.first());           // apple
System.out.println(tree.ceiling("b"));      // banana`,
      interviewPoints: [
        'HashSet uses a HashMap internally with a dummy value.',
        'TreeSet uses compareTo()/compare() for uniqueness, not equals().',
        'Use LinkedHashSet to remove duplicates while keeping the original order.',
      ],
    },
    {
      id: 'hashmap-internals',
      title: 'HashMap & How It Works Internally',
      explanation: "A `HashMap` stores entries in an array of buckets. When you call `put(key, value)`, Java computes `key.hashCode()`, mixes the high bits into the low bits (hashing), and uses `hash & (n - 1)` to pick a bucket index, where n is the array length (always a power of two).\n\nIf two different keys land in the same bucket, that is a collision. The bucket then holds a linked list of nodes; on `get()`, Java goes to the bucket and compares keys with `equals()` to find the right one. Since Java 8, when one bucket has more than 8 nodes (and the table has at least 64 buckets), the list is converted into a red-black tree, called treeification, so worst-case lookup becomes O(log n) instead of O(n).\n\nThe load factor (default 0.75) controls when the map grows: when size exceeds capacity times load factor (16 x 0.75 = 12 by default), the table doubles and every entry is redistributed into the new buckets. This resizing is expensive, so pass an initial capacity if you know the size in advance. `HashMap` allows one null key and many null values, and is not thread-safe.",
      example: `Map<String, Integer> map = new HashMap<>(); // capacity 16, load factor 0.75

// put("apple", 1) roughly does:
// 1. h = "apple".hashCode();  h = h ^ (h >>> 16);
// 2. index = h & (table.length - 1);
// 3. if bucket empty -> store new node
//    else walk the bucket: if a key equals("apple") -> replace value
//    else append node (treeify if bucket size > 8)
// 4. if ++size > threshold (12) -> resize to 32 and rehash
map.put("apple", 1);
map.put("apple", 2);     // same key: value replaced
System.out.println(map.get("apple")); // 2

// Pre-size when you know you'll store about 1000 entries
Map<Integer, String> big = new HashMap<>(2048);`,
      interviewPoints: [
        'Array of buckets; index = (hash ^ hash >>> 16) & (capacity - 1).',
        'Collisions go into a linked list; converted to a red-black tree when a bucket exceeds 8 entries (TREEIFY_THRESHOLD) and capacity is at least 64.',
        'Default capacity 16, load factor 0.75; it doubles when size > capacity x load factor.',
        'Average O(1) get/put, worst case O(log n) since Java 8.',
      ],
    },
    {
      id: 'linkedhashmap-treemap',
      title: 'LinkedHashMap & TreeMap',
      explanation: "`LinkedHashMap` is a `HashMap` with a doubly linked list running through its entries, so iteration follows insertion order. With `accessOrder = true`, it orders entries by most recent access, and by overriding `removeEldestEntry()` you get a simple LRU (least recently used) cache.\n\n`TreeMap` keeps keys sorted using a red-black tree. `get`/`put` are O(log n), and it provides range methods like `firstKey()`, `headMap()`, `tailMap()` and `floorKey()`. Keys must be comparable, and null keys are not allowed.",
      example: `// Simple LRU cache with capacity 3
class LruCache<K, V> extends LinkedHashMap<K, V> {
    private final int capacity;

    LruCache(int capacity) {
        super(16, 0.75f, true); // true = access order
        this.capacity = capacity;
    }

    @Override
    protected boolean removeEldestEntry(Map.Entry<K, V> eldest) {
        return size() > capacity;
    }
}

TreeMap<Integer, String> grades = new TreeMap<>();
grades.put(90, "A");
grades.put(75, "B");
grades.put(60, "C");
System.out.println(grades.floorEntry(82).getValue()); // B`,
      interviewPoints: [
        'LinkedHashMap keeps insertion order (or access order for LRU caches).',
        'TreeMap sorts by key, O(log n) operations, no null keys.',
      ],
    },
    {
      id: 'hashtable',
      title: 'Hashtable',
      explanation: "`Hashtable` is the old (Java 1.0) version of a hash map. Every method is `synchronized`, so only one thread can use it at a time, which makes it slow under load. It does not allow null keys or null values.\n\nDo not use it in new code. Use `HashMap` for single-threaded code and `ConcurrentHashMap` when many threads share the map.",
      example: `Map<String, Integer> legacy = new Hashtable<>();
legacy.put("a", 1);
// legacy.put(null, 1);  // NullPointerException
// legacy.put("b", null); // NullPointerException

// Modern thread-safe alternative
Map<String, Integer> safe = new ConcurrentHashMap<>();`,
      interviewPoints: [
        'Hashtable: synchronized, no null keys/values, legacy.',
        'HashMap: not synchronized, one null key and many null values allowed.',
        'ConcurrentHashMap: thread-safe with fine-grained locking, no nulls.',
      ],
    },
    {
      id: 'priorityqueue',
      title: 'PriorityQueue',
      explanation: "A `PriorityQueue` always gives you the smallest element first (a min-heap), not the oldest. Internally it is a binary heap stored in an array. `offer()` and `poll()` are O(log n), and `peek()` is O(1). Pass a `Comparator` to change the order, for example `Comparator.reverseOrder()` for a max-heap.\n\nIterating over a `PriorityQueue` does NOT give sorted order; only repeated `poll()` does.",
      example: `PriorityQueue<Integer> minHeap = new PriorityQueue<>();
minHeap.addAll(List.of(5, 1, 8, 3));
System.out.println(minHeap.poll()); // 1
System.out.println(minHeap.poll()); // 3

PriorityQueue<Integer> maxHeap = new PriorityQueue<>(Comparator.reverseOrder());
maxHeap.addAll(List.of(5, 1, 8, 3));
System.out.println(maxHeap.peek()); // 8

// Tasks ordered by priority
record Task(String name, int priority) {}
PriorityQueue<Task> tasks = new PriorityQueue<>(Comparator.comparingInt(Task::priority));`,
      interviewPoints: [
        'Binary heap; min-heap by default.',
        'O(log n) offer/poll, O(1) peek.',
        'Common in "top K elements" and scheduling problems.',
      ],
    },
    {
      id: 'iterator-listiterator',
      title: 'Iterator & ListIterator',
      explanation: "An `Iterator` walks through a collection one element at a time with `hasNext()` and `next()`. Its `remove()` method is the safe way to delete elements while looping. If you call `list.remove()` directly inside a for-each loop, you get a `ConcurrentModificationException`, because most collections are fail-fast: they detect that the structure changed during iteration.\n\n`ListIterator` works only on lists and can move both forward and backward (`hasPrevious()`, `previous()`), and can also `set()` and `add()` elements.",
      example: `List<Integer> nums = new ArrayList<>(List.of(1, 2, 3, 4, 5));

Iterator<Integer> it = nums.iterator();
while (it.hasNext()) {
    if (it.next() % 2 == 0) {
        it.remove();          // safe removal
    }
}
System.out.println(nums); // [1, 3, 5]

// Shorter alternative
nums.removeIf(n -> n > 3);

ListIterator<Integer> li = nums.listIterator();
while (li.hasNext()) {
    li.set(li.next() * 10);   // replace in place
}`,
      interviewPoints: [
        'Fail-fast iterators throw ConcurrentModificationException if the collection is modified outside the iterator.',
        'Fail-safe iterators (e.g. CopyOnWriteArrayList, ConcurrentHashMap) work on a copy or snapshot and do not throw.',
        'ListIterator is bidirectional and supports add() and set().',
      ],
    },
    {
      id: 'comparable-comparator',
      title: 'Comparable & Comparator',
      explanation: "`Comparable` defines the natural order of a class by implementing `compareTo()` inside the class itself, for example Strings sort alphabetically. It returns a negative number, zero, or a positive number when this object is less than, equal to, or greater than the other.\n\n`Comparator` is a separate object that defines a custom order, so you can sort the same class in many ways (by name, by salary, by date). Java 8 made comparators easy to build with `Comparator.comparing()`, `thenComparing()` and `reversed()`.",
      example: `class Employee implements Comparable<Employee> {
    String name;
    double salary;

    Employee(String name, double salary) {
        this.name = name;
        this.salary = salary;
    }

    @Override
    public int compareTo(Employee other) {
        return this.name.compareTo(other.name); // natural order: by name
    }
}

List<Employee> staff = new ArrayList<>();
Collections.sort(staff); // uses compareTo

// Custom order with Comparator: salary desc, then name
staff.sort(Comparator.comparingDouble((Employee e) -> e.salary)
        .reversed()
        .thenComparing(e -> e.name));`,
      interviewPoints: [
        'Comparable is in java.lang and has compareTo(); Comparator is in java.util and has compare().',
        'Comparable = one natural order, inside the class; Comparator = many orders, outside the class.',
        'Use Integer.compare(a, b) instead of a - b to avoid integer overflow.',
      ],
    },
    {
      id: 'equals-hashcode',
      title: 'equals() & hashCode()',
      explanation: "`equals()` decides whether two objects are logically equal; `hashCode()` returns an int used to pick a bucket in hash-based collections. The contract: if two objects are equal, they MUST have the same hash code. The reverse is not required: two different objects may share a hash code (a collision).\n\nIf you override `equals()` but not `hashCode()`, two equal objects may land in different buckets, so a `HashSet` could contain \"duplicates\" and `map.get()` may return null for a key that is really there. Always override both together, using the same fields. Records do this for you automatically.",
      example: `public class Point {
    private final int x;
    private final int y;

    public Point(int x, int y) {
        this.x = x;
        this.y = y;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof Point p)) return false;
        return x == p.x && y == p.y;
    }

    @Override
    public int hashCode() {
        return Objects.hash(x, y);
    }
}

Set<Point> points = new HashSet<>();
points.add(new Point(1, 2));
System.out.println(points.contains(new Point(1, 2))); // true`,
      interviewPoints: [
        'Equal objects must have equal hash codes; equal hash codes do not imply equal objects.',
        'Default equals() compares references (==); default hashCode() is identity-based.',
        'Never use mutable fields as keys: changing them after insertion makes the entry unreachable.',
      ],
    },
    {
      id: 'generics-in-collections',
      title: 'Generics in Collections',
      explanation: "Generics let you say what type a collection holds, like `List<String>`. The compiler then stops you from adding the wrong type and you do not need casts when reading. Before Java 5, collections held plain `Object` and mistakes only showed up at runtime as `ClassCastException`.\n\nWildcards make methods flexible: `List<? extends Number>` means \"a list of some subtype of Number\" (you can read Numbers from it), and `List<? super Integer>` means \"a list that can accept Integers\" (you can add to it). Remember PECS: Producer Extends, Consumer Super. Generics are erased at runtime (type erasure), so `List<String>` and `List<Integer>` are the same class at runtime.",
      example: `List<String> names = new ArrayList<>();
names.add("Ravi");
// names.add(42);       // compile error: type safety
String n = names.get(0); // no cast needed

// Producer extends: read from it
static double sum(List<? extends Number> nums) {
    double total = 0;
    for (Number x : nums) total += x.doubleValue();
    return total;
}

// Consumer super: write into it
static void fill(List<? super Integer> target) {
    target.add(1);
    target.add(2);
}`,
      interviewPoints: [
        'Generics give compile-time type safety and remove the need for casts.',
        'Collections cannot hold primitives; use wrapper types (List<Integer>, not List<int>).',
        'PECS: ? extends for reading (producer), ? super for writing (consumer).',
      ],
    },
    {
      id: 'immutable-collections',
      title: 'Immutable Collections',
      explanation: "An immutable collection cannot be changed after it is created: `add`, `remove` and `set` throw `UnsupportedOperationException`. Java 9 added factory methods `List.of()`, `Set.of()` and `Map.of()`, and Java 10 added `List.copyOf()`. These do not allow null elements.\n\n`Collections.unmodifiableList(list)` is different: it is a read-only view. You cannot change it through the view, but if someone changes the original list, the view shows the change. Immutable collections are safe to share between threads and to return from methods without defensive copies.",
      example: `List<String> colors = List.of("red", "green");
// colors.add("blue");     // UnsupportedOperationException
// List.of("a", null);     // NullPointerException

Map<String, Integer> ages = Map.of("Asha", 30, "Ravi", 25);

List<String> original = new ArrayList<>(List.of("x"));
List<String> view = Collections.unmodifiableList(original);
original.add("y");
System.out.println(view);   // [x, y]  view reflects change

List<String> copy = List.copyOf(original); // true immutable snapshot
original.add("z");
System.out.println(copy);   // [x, y]`,
      interviewPoints: [
        'List.of/Set.of/Map.of are truly immutable and reject nulls.',
        'Collections.unmodifiableX returns a read-only view of a collection that may still change underneath.',
        'Arrays.asList() is fixed-size: set() works, add()/remove() throw.',
      ],
    },
    {
      id: 'time-complexity',
      title: 'Collection Time Complexity',
      explanation: "Knowing the Big-O cost of common operations helps you pick the right collection. Big-O describes how the time grows as the number of elements n grows: O(1) is constant, O(log n) grows slowly, and O(n) grows linearly.\n\nArrayList: get O(1), add at end O(1) amortized, insert/remove in middle O(n), contains O(n). LinkedList: add/remove at ends O(1), get(i) O(n), contains O(n). HashMap/HashSet: get/put/contains/remove O(1) average. TreeMap/TreeSet: O(log n) for all main operations. PriorityQueue: offer/poll O(log n), peek O(1). ArrayDeque: add/remove at either end O(1).",
      example: `// Checking membership many times? Choose a Set, not a List.
List<Integer> list = new ArrayList<>();   // contains -> O(n)
Set<Integer> set = new HashSet<>();       // contains -> O(1) average

for (int i = 0; i < 1_000_000; i++) {
    list.add(i);
    set.add(i);
}
boolean a = list.contains(999_999); // scans up to 1 million elements
boolean b = set.contains(999_999);  // one hash lookup`,
      interviewPoints: [
        'HashMap O(1) average, O(log n) worst case (treeified bucket).',
        'TreeMap/TreeSet O(log n) because of the red-black tree.',
        'ArrayList add is O(1) amortized: occasional O(n) resize spread across many adds.',
      ],
    },
  ],

  commonMistakes: [
    'Removing elements from a list inside a for-each loop, which throws ConcurrentModificationException; use Iterator.remove() or removeIf().',
    'Overriding equals() without hashCode(), so HashSet and HashMap fail to find objects that are logically equal.',
    'Using a mutable object as a HashMap key and then changing its fields, making the entry impossible to find.',
    'Calling list.remove(1) on a List<Integer> expecting to remove the value 1, when it actually removes the element at index 1.',
    'Trying to add to a list returned by List.of() or Arrays.asList(), which throws UnsupportedOperationException.',
    'Choosing LinkedList for "faster inserts" and then calling get(i) in a loop, which makes the code O(n squared).',
    'Expecting HashMap or HashSet to keep insertion order; use LinkedHashMap or LinkedHashSet for that.',
  ],

  interviewTips: [
    'When asked about HashMap internals, walk through put() step by step: hashCode, bucket index, collision handling with equals(), treeification, and resizing at the load factor.',
    'For any "which collection would you use?" question, state the requirements first (order, duplicates, sorting, thread-safety) and then justify your choice with time complexity.',
    'Always mention the equals()/hashCode() contract when discussing HashSet or HashMap keys.',
    'Mention modern APIs like List.of(), Map.merge() and computeIfAbsent(); it shows you write current Java, not Java 6.',
    'If thread-safety comes up, recommend ConcurrentHashMap or CopyOnWriteArrayList rather than Hashtable, Vector or Collections.synchronizedMap.',
  ],

  interviewQuestions: [
    {
      id: 'java-collections-q1',
      question: 'What is the Java Collections Framework and what are its main interfaces?',
      answer: "The Java Collections Framework is a set of interfaces and classes in `java.util` for storing and processing groups of objects. It gives you ready-made, well-tested data structures and algorithms so you do not have to write your own.\n\nThe main interfaces are `Collection` (the root for single elements), with children `List` (ordered, allows duplicates), `Set` (unique elements) and `Queue`/`Deque` (elements waiting to be processed). `Map` stores key-value pairs and is part of the framework but does not extend `Collection`.",
      points: [
        'Collection -> List, Set, Queue; Map is separate.',
        'Common implementations: ArrayList, LinkedList, HashSet, TreeSet, HashMap, TreeMap, ArrayDeque, PriorityQueue.',
        'Collections (plural) is a utility class with static methods like sort() and unmodifiableList().',
      ],
      difficulty: 'Beginner',
    },
    {
      id: 'java-collections-q2',
      question: 'What is the difference between ArrayList and LinkedList?',
      answer: "`ArrayList` is backed by a resizable array, so `get(index)` is O(1), but inserting or removing in the middle is O(n) because elements must shift. `LinkedList` is a doubly linked list, so adding or removing at the ends is O(1), but `get(index)` is O(n) because it must walk node by node.\n\nIn practice `ArrayList` is almost always faster and uses less memory, because arrays are stored contiguously and are CPU-cache friendly. `LinkedList` also implements `Deque`, but `ArrayDeque` is usually a better queue.",
      points: [
        'ArrayList: dynamic array, fast random access.',
        'LinkedList: nodes with prev/next pointers, fast insert/remove at the ends.',
        'LinkedList uses more memory per element.',
        'Default to ArrayList unless you have a measured reason not to.',
      ],
      difficulty: 'Beginner',
    },
    {
      id: 'java-collections-q3',
      question: 'What is the difference between List, Set and Map?',
      answer: "A `List` is an ordered collection with index-based access that allows duplicates. A `Set` holds unique elements only and generally has no index. A `Map` stores key-value pairs where each key is unique but values can repeat.\n\nChoose `List` for sequences (a shopping cart), `Set` for uniqueness or fast membership checks (unique visitor ids), and `Map` for lookups by key (user id to user).",
      example: `List<String> list = List.of("a", "b", "a");   // [a, b, a]
Set<String> set = new HashSet<>(list);          // [a, b]
Map<String, Integer> map = Map.of("a", 1, "b", 2);`,
      points: [
        'List: ordered, duplicates allowed, access by index.',
        'Set: no duplicates, uniqueness via equals()/hashCode().',
        'Map: unique keys mapping to values; not a Collection.',
      ],
      difficulty: 'Beginner',
    },
    {
      id: 'java-collections-q4',
      question: 'How does HashMap work internally?',
      answer: "A `HashMap` holds an array of buckets. On `put(key, value)` it calls `key.hashCode()`, spreads the bits (`h ^ (h >>> 16)`), and computes the bucket index as `hash & (capacity - 1)`. If the bucket is empty, a new node is stored there. If not, it walks the nodes in the bucket and uses `equals()` to check whether the key already exists; if it does, the value is replaced, otherwise a new node is added. `get()` follows the same path.\n\nMany keys in one bucket is a collision. Since Java 8, a bucket with more than 8 nodes is converted from a linked list into a red-black tree (if capacity is at least 64), making worst-case lookup O(log n). When the number of entries exceeds capacity x load factor (16 x 0.75 = 12 by default), the table doubles in size and entries are redistributed.",
      points: [
        'hashCode() picks the bucket; equals() finds the exact key in the bucket.',
        'Collisions are handled by chaining, with treeification after 8 nodes.',
        'Default capacity 16, load factor 0.75, capacity always a power of two.',
        'Average O(1) get/put; allows one null key (stored in bucket 0).',
      ],
      difficulty: 'Intermediate',
    },
    {
      id: 'java-collections-q5',
      question: 'Why must you override hashCode() when you override equals()?',
      answer: "Hash-based collections like `HashMap` and `HashSet` first use `hashCode()` to find a bucket and only then use `equals()` inside that bucket. The contract says that equal objects must return the same hash code.\n\nIf you override only `equals()`, two logically equal objects will usually have different identity-based hash codes, land in different buckets, and never be compared with `equals()`. The result: a `HashSet` stores duplicates and `map.get(key)` returns null even though an equal key is present.",
      example: `class User {
    String email;
    User(String email) { this.email = email; }

    @Override
    public boolean equals(Object o) {
        return o instanceof User u && email.equals(u.email);
    }
    // hashCode() missing!
}

Set<User> users = new HashSet<>();
users.add(new User("a@x.com"));
users.add(new User("a@x.com"));
System.out.println(users.size()); // usually 2, not 1`,
      points: [
        'a.equals(b) implies a.hashCode() == b.hashCode().',
        'Same hash code does not imply equals() is true.',
        'Use the same fields in both methods; Objects.hash() helps.',
      ],
      difficulty: 'Intermediate',
    },
    {
      id: 'java-collections-q6',
      question: 'What is the difference between HashMap, LinkedHashMap and TreeMap?',
      answer: "All three implement `Map`. `HashMap` gives O(1) average operations with no ordering guarantee. `LinkedHashMap` is a `HashMap` plus a linked list, so it iterates in insertion order (or access order, useful for LRU caches) at a little extra memory cost.\n\n`TreeMap` is a red-black tree that keeps keys sorted by natural order or a `Comparator`. Its operations are O(log n), it does not allow null keys, and it offers navigation methods like `floorKey()`, `ceilingKey()`, `headMap()` and `tailMap()`.",
      points: [
        'HashMap: fastest, unordered, one null key allowed.',
        'LinkedHashMap: predictable insertion or access order.',
        'TreeMap: sorted keys, O(log n), no null keys.',
      ],
      difficulty: 'Intermediate',
    },
    {
      id: 'java-collections-q7',
      question: 'What is the difference between Comparable and Comparator?',
      answer: "`Comparable` is implemented by the class itself through `compareTo(T other)` and defines its single natural ordering, for example `String` and `Integer` are Comparable. `Comparator` is a separate object with `compare(T a, T b)` that defines an external, custom ordering, so you can sort the same class in many different ways.\n\nUse `Comparable` for the obvious default order, and `Comparator` when you need other orders or cannot modify the class. Java 8 helpers like `Comparator.comparing(Employee::getSalary).reversed().thenComparing(Employee::getName)` make comparators short and readable.",
      example: `List<String> words = new ArrayList<>(List.of("pear", "fig", "banana"));
Collections.sort(words);                            // natural: [banana, fig, pear]
words.sort(Comparator.comparingInt(String::length)); // by length: [fig, pear, banana]`,
      points: [
        'Comparable: java.lang, compareTo(), one natural order.',
        'Comparator: java.util, compare(), many custom orders.',
        'TreeSet/TreeMap use these, not equals(), to decide uniqueness.',
      ],
      difficulty: 'Intermediate',
    },
    {
      id: 'java-collections-q8',
      question: 'What is ConcurrentModificationException and how do you avoid it?',
      answer: "It is thrown by fail-fast iterators when a collection is structurally modified (elements added or removed) while you are iterating over it by any means other than the iterator itself. Collections keep a `modCount` counter, and the iterator checks on each `next()` that the counter has not changed unexpectedly.\n\nTo avoid it, remove through `Iterator.remove()`, use `removeIf()`, collect changes and apply them after the loop, or use a concurrent collection such as `CopyOnWriteArrayList` or `ConcurrentHashMap`, whose iterators are fail-safe (weakly consistent).",
      example: `List<String> list = new ArrayList<>(List.of("a", "b", "c"));
// for (String s : list) if (s.equals("b")) list.remove(s); // throws
list.removeIf(s -> s.equals("b"));   // safe`,
      points: [
        'Caused by modifying a collection during iteration, even in a single thread.',
        'Fail-fast behaviour is best-effort, not guaranteed.',
        'Fixes: Iterator.remove(), removeIf(), or concurrent collections.',
      ],
      difficulty: 'Intermediate',
    },
    {
      id: 'java-collections-q9',
      question: 'What is the difference between HashMap, Hashtable and ConcurrentHashMap?',
      answer: "`HashMap` is not thread-safe, allows one null key and multiple null values, and is the fastest choice for single-threaded code. `Hashtable` is a legacy class where every method is synchronized on the whole table, so only one thread at a time can access it; it rejects null keys and values.\n\n`ConcurrentHashMap` is the modern thread-safe map. Reads are mostly lock-free, and writes lock only a single bucket (using CAS operations and synchronized on the bucket head), so many threads can work in parallel. It rejects nulls because null would be ambiguous in concurrent code (missing key vs null value). It also provides atomic methods like `putIfAbsent()`, `computeIfAbsent()` and `merge()`.",
      points: [
        'HashMap: unsynchronized, nulls allowed.',
        'Hashtable: whole-table locking, legacy, no nulls.',
        'ConcurrentHashMap: bucket-level locking/CAS, high concurrency, no nulls.',
        'Its iterators are weakly consistent and never throw ConcurrentModificationException.',
      ],
      difficulty: 'Advanced',
    },
    {
      id: 'java-collections-q10',
      question: 'What happens when a HashMap resizes, and why is capacity always a power of two?',
      answer: "When the number of entries exceeds the threshold (capacity x load factor), `HashMap` creates a new bucket array twice as large and moves every entry. Because capacity is a power of two, the index is computed with a fast bitwise AND, `hash & (n - 1)`, instead of a slower modulo. It also makes resizing cheap: each entry either stays at the same index or moves to `index + oldCapacity`, depending on one extra bit of the hash, so Java 8 splits each bucket into a low and high list without recomputing hashes.\n\nResizing is O(n), so if you know you will store about N entries, create the map with an initial capacity of about N / 0.75 to avoid repeated resizes. Before Java 8, concurrent resizing of a plain `HashMap` could even create an infinite loop, one more reason never to share it between threads.",
      example: `// Expect about 10_000 entries: avoid several resizes
Map<Long, String> cache = new HashMap<>((int) (10_000 / 0.75f) + 1);

// Java 19+ convenience
Map<Long, String> cache2 = HashMap.newHashMap(10_000);`,
      points: [
        'Resize doubles capacity when size > capacity x load factor.',
        'Power-of-two capacity allows hash & (n - 1) indexing.',
        'Each entry stays in place or moves by exactly oldCapacity.',
        'Lower load factor = fewer collisions but more memory; 0.75 is the default trade-off.',
      ],
      difficulty: 'Advanced',
    },
    {
      id: 'java-collections-q11',
      question: 'What is the difference between List.of(), Arrays.asList() and Collections.unmodifiableList()?',
      answer: "`List.of()` (Java 9) creates a truly immutable list: no add, remove or set, and null elements are rejected. `Arrays.asList()` returns a fixed-size list backed by the original array: you can `set()` elements (which also changes the array) but `add()` and `remove()` throw `UnsupportedOperationException`, and nulls are allowed.\n\n`Collections.unmodifiableList(list)` returns a read-only view over an existing list. You cannot modify through the view, but changes made to the underlying list are visible through it. For a real immutable snapshot of an existing list, use `List.copyOf()`.",
      example: `String[] arr = {"a", "b"};
List<String> fixed = Arrays.asList(arr);
fixed.set(0, "z");
System.out.println(arr[0]); // z  (backed by the array)

List<String> base = new ArrayList<>(List.of("x"));
List<String> view = Collections.unmodifiableList(base);
base.add("y");
System.out.println(view);   // [x, y]`,
      points: [
        'List.of: immutable, no nulls.',
        'Arrays.asList: fixed-size, writable through set(), backed by the array.',
        'unmodifiableList: read-only view, not a copy.',
        'List.copyOf: immutable copy.',
      ],
      difficulty: 'Advanced',
    },
    {
      id: 'java-collections-q12',
      question: 'Why does a HashMap key need to be immutable, and why is String a good key?',
      answer: "The bucket for a key is chosen from its hash code at the moment of insertion. If you later change a field used in `hashCode()`, the key now hashes to a different bucket, so `get()` looks in the wrong place and returns null, and the old entry becomes a memory leak that you cannot remove normally.\n\n`String` is an excellent key because it is immutable, it correctly overrides `equals()` and `hashCode()`, and it caches its hash code after the first computation, so repeated lookups are fast. Records, wrapper types like `Integer` and enums are also safe keys.",
      example: `class Key {
    int id;
    Key(int id) { this.id = id; }
    @Override public boolean equals(Object o) { return o instanceof Key k && k.id == id; }
    @Override public int hashCode() { return Integer.hashCode(id); }
}

Map<Key, String> map = new HashMap<>();
Key k = new Key(1);
map.put(k, "one");
k.id = 2;                       // mutate the key!
System.out.println(map.get(k)); // null
System.out.println(map.size()); // 1  (entry is stranded)`,
      points: [
        'Mutating a key after insertion breaks lookups.',
        'String is immutable and caches its hash code.',
        'Prefer immutable keys: String, Integer, enums, records with immutable fields.',
      ],
      difficulty: 'Advanced',
    },
  ],
}

export default topic
