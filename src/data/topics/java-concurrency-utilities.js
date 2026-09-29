const topic = {
  id: 'java-concurrency-utilities',
  category: 'java',
  title: 'Concurrency Synchronizers & Memory Model',
  description: "Coordinate threads with CountDownLatch, CyclicBarrier, Semaphore and Phaser, use ConcurrentHashMap atomically, split work with Fork/Join, and understand happens-before and ThreadLocal.",
  difficulty: 'Advanced',
  overview: "The Multithreading topic covers the basics: creating threads, `synchronized`, `volatile`, locks, atomic classes and executors. Real systems also need threads to coordinate: wait until five services have started, let at most ten threads call a rate-limited API, or make four workers finish a phase before any starts the next. The `java.util.concurrent` package provides ready-made synchronizers for exactly these situations, so you rarely need `wait()` and `notify()`.\n\nThink of a relay race. A CountDownLatch is the starting pistol that fires once every runner is on the track. A CyclicBarrier is the handover zone where the team regroups after every lap. A Semaphore is the limited number of lanes: only so many runners at a time.\n\nThis topic also covers the rules that make concurrent code correct at all: the Java Memory Model and its happens-before relationships, which explain why a thread sometimes does not see another thread's write. It finishes with ConcurrentHashMap's atomic operations, the Fork/Join framework behind parallel streams, ThreadLocal, and classic thread-coordination interview problems. Examples use an order-processing service.",

  subtopics: [
    {
      id: 'count-down-latch',
      title: 'CountDownLatch',
      explanation: "A CountDownLatch starts with a count. Threads call `countDown()` to decrease it, and any thread calling `await()` blocks until the count reaches zero. Once it reaches zero it stays open forever; a latch cannot be reset.\n\nTypical uses: the main thread waits for N worker threads to finish their start-up or their part of a job, or N threads wait for one signal to start at the same moment (a latch with count 1). Always call `countDown()` in a `finally` block so a failing worker does not leave everyone waiting forever, and prefer `await(timeout, unit)` in production code.",
      example: `ExecutorService pool = Executors.newFixedThreadPool(3);
CountDownLatch ready = new CountDownLatch(3);

for (String service : List.of("inventory", "payment", "shipping")) {
    pool.submit(() -> {
        try {
            warmUp(service);                    // e.g. load caches, open connections
        } finally {
            ready.countDown();                  // always count down
        }
    });
}

if (!ready.await(30, TimeUnit.SECONDS)) {
    throw new IllegalStateException("services did not start in time");
}
System.out.println("All services ready, accepting orders");
pool.shutdown();`,
      interviewPoints: [
        "One-shot: count goes down to zero and cannot be reset.",
        "await() blocks until the count reaches zero.",
        "countDown() in finally; await with a timeout.",
        "Use for \"wait for N events\" or a start signal.",
      ],
    },
    {
      id: 'cyclic-barrier',
      title: 'CyclicBarrier',
      explanation: "A CyclicBarrier makes a fixed number of threads wait for each other at a common point. Each thread calls `await()`; when the last one arrives, an optional barrier action runs (once, on the last arriving thread) and all threads are released together. Then the barrier resets automatically for the next round, which is why it is called cyclic.\n\nUse it for work done in phases, such as a simulation where each step needs all partial results from the previous step. If a thread is interrupted or times out while waiting, the barrier becomes broken and the other waiting threads get a `BrokenBarrierException`.",
      example: `int workers = 4;
CyclicBarrier barrier = new CyclicBarrier(workers,
    () -> System.out.println("--- all partitions done, merging results ---"));

for (int w = 0; w < workers; w++) {
    int id = w;
    new Thread(() -> {
        try {
            for (int round = 1; round <= 3; round++) {
                processPartition(id, round);
                barrier.await();                // wait for the other workers
            }
        } catch (InterruptedException | BrokenBarrierException e) {
            Thread.currentThread().interrupt();
        }
    }).start();
}`,
      interviewPoints: [
        "Threads wait for each other, not for an event.",
        "Reusable: resets after each round.",
        "Optional barrier action runs when all arrive.",
        "BrokenBarrierException if one waiter fails.",
      ],
    },
    {
      id: 'latch-vs-barrier',
      title: 'CountDownLatch vs CyclicBarrier',
      explanation: "The difference is who waits for whom. With a latch, one or more threads wait for events counted down by other threads; the threads counting down do not wait. With a barrier, the same group of threads all wait for each other, and nobody continues until everyone has arrived.\n\nA latch is single-use; a barrier can be reused for many rounds. A latch's count can be decreased by any code, even the same thread several times, while a barrier counts distinct threads calling `await()`.",
      example: `// Latch: main waits for workers; workers do NOT wait
CountDownLatch done = new CountDownLatch(3);
// worker:  work(); done.countDown();
// main:    done.await();

// Barrier: every worker waits for every other worker, round after round
CyclicBarrier sync = new CyclicBarrier(3);
// worker:  step1(); sync.await(); step2(); sync.await();`,
      interviewPoints: [
        "Latch: waiters and counters are different threads.",
        "Barrier: the same threads wait for each other.",
        "Latch is one-shot, barrier is reusable.",
      ],
    },
    {
      id: 'semaphore',
      title: 'Semaphore',
      explanation: "A Semaphore holds a number of permits. `acquire()` takes one (blocking if none are available) and `release()` gives one back. It limits how many threads can do something at the same time, for example at most five concurrent calls to a partner API that throttles you, or a pool of ten expensive connections.\n\nPermits are not owned by threads, so any thread may release, which is different from a lock. Always release in a `finally` block. A fair semaphore (`new Semaphore(n, true)`) hands out permits in arrival order, at some cost in throughput. `tryAcquire(timeout, unit)` lets callers give up instead of waiting forever.",
      example: `public class PaymentGatewayClient {

    private final Semaphore permits = new Semaphore(5);   // max 5 concurrent calls

    public PaymentResult charge(Order order) throws InterruptedException {
        if (!permits.tryAcquire(2, TimeUnit.SECONDS)) {
            throw new IllegalStateException("payment gateway busy, try again");
        }
        try {
            return callGateway(order);
        } finally {
            permits.release();
        }
    }
}`,
      interviewPoints: [
        "Limits concurrent access to N.",
        "acquire/release; release in finally.",
        "Permits are not tied to a thread.",
        "A semaphore with 1 permit acts like a (non-reentrant) mutex.",
      ],
    },
    {
      id: 'phaser-exchanger',
      title: 'Phaser and Exchanger (brief)',
      explanation: "A Phaser is a flexible barrier: parties can register and deregister dynamically, and it counts phases. `arriveAndAwaitAdvance()` behaves like a barrier await; `arriveAndDeregister()` lets a party leave. It is useful when the number of participating threads changes between phases.\n\nAn Exchanger lets exactly two threads swap objects at a meeting point: each calls `exchange(value)` and receives the other thread's value. A typical example is double buffering, where a producer hands over a full buffer and gets an empty one back. Both are asked about less often than latches, barriers and semaphores.",
      example: `Phaser phaser = new Phaser(1);                 // register the main thread
for (int i = 0; i < 3; i++) {
    phaser.register();
    new Thread(() -> {
        loadData();
        phaser.arriveAndAwaitAdvance();         // end of phase 0
        transform();
        phaser.arriveAndDeregister();           // done, leave
    }).start();
}
phaser.arriveAndAwaitAdvance();                 // main waits for phase 0
phaser.arriveAndDeregister();

Exchanger<List<Order>> exchanger = new Exchanger<>();
// producer: buffer = exchanger.exchange(fullBuffer);   receives an empty one
// consumer: buffer = exchanger.exchange(emptyBuffer);  receives the full one`,
      interviewPoints: [
        "Phaser: dynamic parties, numbered phases.",
        "Exchanger: two threads swap objects.",
        "Know they exist; latch, barrier and semaphore matter most.",
      ],
    },
    {
      id: 'blocking-queues',
      title: 'BlockingQueue implementations',
      explanation: "A BlockingQueue is the simplest way to hand work from producer threads to consumer threads: `put()` waits while the queue is full and `take()` waits while it is empty, so no manual `wait`/`notify` is needed. (A complete producer-consumer program is in the Coding Questions under Basic Java.)\n\nChoose the implementation by its behaviour. `ArrayBlockingQueue` is bounded with a fixed array. `LinkedBlockingQueue` is optionally bounded; the no-argument constructor is effectively unbounded, which is the queue used by `Executors.newFixedThreadPool` and can grow until memory runs out. `PriorityBlockingQueue` orders elements by priority. `DelayQueue` releases elements only after their delay expires. `SynchronousQueue` has no capacity at all: each put waits for a matching take, which is what `newCachedThreadPool` uses.",
      example: `BlockingQueue<Order> orders = new ArrayBlockingQueue<>(100);   // bounded: back-pressure

// producer
orders.put(order);                                // waits if full
boolean accepted = orders.offer(order, 1, TimeUnit.SECONDS);  // or give up

// consumer
Order next = orders.take();                       // waits if empty
Order maybe = orders.poll(500, TimeUnit.MILLISECONDS);        // null on timeout`,
      interviewPoints: [
        "put/take block; offer/poll can time out.",
        "Prefer bounded queues for back-pressure.",
        "newFixedThreadPool uses an unbounded LinkedBlockingQueue.",
        "SynchronousQueue has zero capacity.",
      ],
    },
    {
      id: 'chm-atomic-ops',
      title: 'ConcurrentHashMap: atomic compound operations',
      explanation: "Each individual ConcurrentHashMap operation is thread-safe, but a sequence of them is not. The check-then-act pattern `if (!map.containsKey(k)) map.put(k, v)` or read-modify-write `map.put(k, map.get(k) + 1)` can lose updates when two threads interleave.\n\nUse the atomic methods instead: `putIfAbsent`, `computeIfAbsent` (for caches), `merge` (for counters), and `compute`. They run the whole update atomically for that key. Keep the functions short and never modify the same map from inside them. For high-contention counters, `LongAdder` (or `map.computeIfAbsent(k, x -> new LongAdder()).increment()`) scales better than `AtomicLong`.",
      example: `ConcurrentHashMap<String, Integer> ordersPerCity = new ConcurrentHashMap<>();

// WRONG: two threads can read the same old value and one update is lost
Integer old = ordersPerCity.get(city);
ordersPerCity.put(city, old == null ? 1 : old + 1);

// RIGHT: atomic per key
ordersPerCity.merge(city, 1, Integer::sum);

// atomic lazy initialisation (cache)
Map<Long, Customer> cache = new ConcurrentHashMap<>();
Customer c = cache.computeIfAbsent(id, customerRepository::load);

// high-contention counters
ConcurrentHashMap<String, LongAdder> hits = new ConcurrentHashMap<>();
hits.computeIfAbsent("/api/orders", k -> new LongAdder()).increment();`,
      interviewPoints: [
        "Single operations are safe, sequences are not.",
        "Use merge, compute, computeIfAbsent, putIfAbsent.",
        "Keep remapping functions short and side-effect free.",
        "LongAdder for hot counters.",
      ],
    },
    {
      id: 'fork-join',
      title: 'Fork/Join framework and parallel streams',
      explanation: "Fork/Join is built for divide-and-conquer on the CPU: split a big task into halves until they are small enough, compute the small ones directly, and combine the results. Extend `RecursiveTask<V>` (returns a value) or `RecursiveAction` (no result), `fork()` one half, compute the other directly and `join()` the first.\n\nForkJoinPool uses work stealing: each worker has its own deque of tasks, and idle workers steal tasks from the tail of busy workers' deques, which keeps all cores busy. Parallel streams run on the shared `ForkJoinPool.commonPool()`, sized to the number of cores minus one. Never do blocking I/O in parallel streams or common-pool tasks, because that starves every other user of the pool, and remember that parallelism only pays off for large, CPU-bound workloads.",
      example: `class SumTask extends RecursiveTask<Long> {
    private static final int THRESHOLD = 10_000;
    private final long[] data;
    private final int from, to;

    SumTask(long[] data, int from, int to) {
        this.data = data; this.from = from; this.to = to;
    }

    @Override
    protected Long compute() {
        if (to - from <= THRESHOLD) {
            long sum = 0;
            for (int i = from; i < to; i++) sum += data[i];
            return sum;
        }
        int mid = (from + to) >>> 1;
        SumTask left = new SumTask(data, from, mid);
        left.fork();                                   // run asynchronously
        long right = new SumTask(data, mid, to).compute();
        return left.join() + right;
    }
}

long total = ForkJoinPool.commonPool().invoke(new SumTask(values, 0, values.length));

// the same idea, done for you
long total2 = Arrays.stream(values).parallel().sum();`,
      interviewPoints: [
        "Divide and conquer: fork, compute, join.",
        "Work stealing keeps cores busy.",
        "Parallel streams use the common pool.",
        "No blocking I/O in the common pool; only CPU-bound, large workloads.",
      ],
    },
    {
      id: 'java-memory-model',
      title: 'Java Memory Model and happens-before',
      explanation: "CPUs and the JIT compiler reorder instructions and cache values in registers and core-local caches. Without synchronization, a thread may never see another thread's write, or see writes in a different order. The Java Memory Model (JMM) defines when a write is guaranteed to be visible to a read: when there is a happens-before relationship between them.\n\nThe main happens-before rules: actions in one thread happen in program order; unlocking a monitor happens-before every later lock of the same monitor; a write to a `volatile` field happens-before every later read of it; `Thread.start()` happens-before the started thread's actions; a thread's actions happen-before another thread returns from `join()` on it; and happens-before is transitive. Everything written before a volatile write or an unlock is visible after the matching read or lock. Concurrent collections and executors document their own happens-before guarantees, for example putting an object into a BlockingQueue happens-before taking it out.",
      example: `class Config {
    private Map<String, String> settings;   // plain field
    private volatile boolean loaded;         // volatile flag

    void load() {                            // thread A
        settings = readFromDisk();           // 1. plain write
        loaded = true;                       // 2. volatile write
    }

    String get(String key) {                 // thread B
        if (loaded) {                        // 3. volatile read
            return settings.get(key);        // 4. guaranteed to see the write in 1
        }
        return null;
    }
}
// Without volatile on loaded, B could see loaded == true but settings == null,
// or never see loaded become true at all.`,
      interviewPoints: [
        "Visibility and ordering are not guaranteed without synchronization.",
        "happens-before defines what a read is guaranteed to see.",
        "Rules: program order, monitor, volatile, start, join, transitivity.",
        "Writes before a volatile write are visible after the volatile read.",
      ],
    },
    {
      id: 'safe-publication',
      title: 'Safe publication and double-checked locking',
      explanation: "Publishing an object means making it reachable by other threads. If you assign a newly created object to a plain field without synchronization, another thread can see the reference before the object's fields are fully written, and observe a half-constructed object.\n\nSafe ways to publish: initialise it in a static initializer, store it in a `volatile` or `final` field, store it in a field guarded by a lock, or put it in a concurrent collection. Final fields have a special guarantee: once the constructor finishes, other threads see their correct values, which is why immutable objects are always thread-safe. This is also why double-checked locking for a singleton needs the field to be `volatile`.",
      example: `public class ConnectionManager {

    private static volatile ConnectionManager instance;   // volatile is essential

    public static ConnectionManager getInstance() {
        ConnectionManager local = instance;
        if (local == null) {                               // 1st check, no lock
            synchronized (ConnectionManager.class) {
                local = instance;
                if (local == null) {                       // 2nd check, with lock
                    instance = local = new ConnectionManager();
                }
            }
        }
        return local;
    }
}

// Simpler and lazy: the holder idiom (class init is thread-safe)
public class Registry {
    private Registry() { }
    private static class Holder { static final Registry INSTANCE = new Registry(); }
    public static Registry getInstance() { return Holder.INSTANCE; }
}`,
      interviewPoints: [
        "Unsafe publication can expose half-built objects.",
        "Publish via static init, volatile, final, locks or concurrent collections.",
        "Final fields are safely visible after construction.",
        "Double-checked locking requires volatile; holder idiom is simpler.",
      ],
    },
    {
      id: 'thread-local',
      title: 'ThreadLocal and its pitfalls',
      explanation: "A ThreadLocal gives each thread its own independent copy of a value. It is used for per-request context such as the current user, a transaction or a correlation id (Spring's SecurityContextHolder, TransactionSynchronizationManager and SLF4J's MDC all use it), and for objects that are not thread-safe, such as the old SimpleDateFormat.\n\nIn thread pools, threads live forever and are reused for different requests. If you do not call `remove()`, the next request on that thread sees stale data, which can leak one user's identity into another user's request, and the values are never garbage collected. Always clear it in a `finally` block. Values are also not passed to other threads, such as @Async methods or CompletableFuture tasks, unless you copy them explicitly. Scoped values (Java 25) are the modern, safer alternative.",
      example: `public final class RequestContext {

    private static final ThreadLocal<String> CORRELATION_ID = new ThreadLocal<>();

    public static void set(String id) { CORRELATION_ID.set(id); }
    public static String get() { return CORRELATION_ID.get(); }
    public static void clear() { CORRELATION_ID.remove(); }
}

// servlet filter
public void doFilter(ServletRequest req, ServletResponse res, FilterChain chain)
        throws IOException, ServletException {
    RequestContext.set(UUID.randomUUID().toString());
    try {
        chain.doFilter(req, res);
    } finally {
        RequestContext.clear();              // essential in a thread pool
    }
}`,
      interviewPoints: [
        "One value per thread.",
        "Used for request context: security, transactions, MDC.",
        "Always remove() in finally with thread pools.",
        "Not inherited by async tasks.",
      ],
    },
    {
      id: 'odd-even-threads',
      title: 'Classic problem: print odd and even numbers with two threads',
      explanation: "A very common interview exercise: two threads must print 1 to N in order, one printing odd numbers and the other even numbers, strictly alternating. It tests whether you can make threads take turns.\n\nWith semaphores it is clean: the odd thread waits on `oddTurn` (starting with 1 permit), prints, then releases `evenTurn`; the even thread does the opposite. Each thread only runs when the other has handed it the turn. The same pattern extends to three threads printing in sequence with three semaphores. The classic alternative uses a shared lock with `wait()`/`notifyAll()` in a `while` loop that checks whose turn it is.",
      example: `public class OddEvenPrinter {

    private final int max;
    private final Semaphore oddTurn = new Semaphore(1);    // odd goes first
    private final Semaphore evenTurn = new Semaphore(0);

    OddEvenPrinter(int max) { this.max = max; }

    void printOdd() throws InterruptedException {
        for (int i = 1; i <= max; i += 2) {
            oddTurn.acquire();
            System.out.println(Thread.currentThread().getName() + ": " + i);
            evenTurn.release();
        }
    }

    void printEven() throws InterruptedException {
        for (int i = 2; i <= max; i += 2) {
            evenTurn.acquire();
            System.out.println(Thread.currentThread().getName() + ": " + i);
            oddTurn.release();
        }
    }

    public static void main(String[] args) {
        OddEvenPrinter p = new OddEvenPrinter(10);
        new Thread(() -> { try { p.printOdd(); } catch (InterruptedException ignored) { } }, "odd").start();
        new Thread(() -> { try { p.printEven(); } catch (InterruptedException ignored) { } }, "even").start();
    }
}`,
      interviewPoints: [
        "Two semaphores hand the turn back and forth.",
        "Starting permits decide who goes first.",
        "Alternative: wait/notifyAll in a while loop.",
        "Extends to N threads in sequence.",
      ],
    },
  ],

  commonMistakes: [
    "Forgetting to call countDown() in a finally block, so a failing worker leaves await() blocked forever.",
    "Calling await() without a timeout in production code.",
    "Trying to reuse a CountDownLatch; it cannot be reset, use a CyclicBarrier or a new latch.",
    "Acquiring a Semaphore permit without releasing it in finally, slowly leaking permits.",
    "Using get() followed by put() on a ConcurrentHashMap and losing updates instead of using merge or compute.",
    "Running blocking I/O inside parallel streams, which starves the shared common pool.",
    "Assuming a plain field written by one thread will eventually be seen by another without volatile or synchronization.",
    "Writing double-checked locking without volatile.",
    "Not calling ThreadLocal.remove() in thread pools, leaking data between requests.",
    "Using an unbounded LinkedBlockingQueue (the newFixedThreadPool default) for work that can arrive faster than it is processed.",
  ],

  interviewTips: [
    "For each synchronizer, give one concrete use case: latch for start-up, barrier for phases, semaphore for rate limiting.",
    "Clearly explain the latch vs barrier difference in terms of who waits for whom and reusability.",
    "When asked about visibility bugs, talk about happens-before instead of just saying \"use volatile\".",
    "Show that you know ConcurrentHashMap's compound operations: merge for counters, computeIfAbsent for caches.",
    "Be ready to code odd/even printing or three threads in sequence; practise the semaphore version.",
    "Connect ThreadLocal to Spring (SecurityContextHolder, @Transactional) and mention the thread-pool leak.",
  ],

  interviewQuestions: [
    {
      id: 'java-concurrency-utilities-q1',
      question: "What is a CountDownLatch and when would you use it?",
      answer: "A CountDownLatch is a synchronizer initialised with a count. Threads call countDown() to decrement it, and threads calling await() block until the count reaches zero, after which the latch stays open permanently. It is used when one or more threads must wait for a set of events to complete: the main thread waiting for N workers to finish loading data, a test waiting for asynchronous callbacks, or several threads waiting on a single start signal (count 1). countDown() should be in a finally block and await() should normally have a timeout. It cannot be reset.",
      example: `CountDownLatch latch = new CountDownLatch(3);
// each worker: try { work(); } finally { latch.countDown(); }
latch.await(10, TimeUnit.SECONDS);`,
      points: [
        "Count down to zero, then waiters are released.",
        "One-shot, not reusable.",
        "Use for waiting on N events or a start signal.",
      ],
      difficulty: 'Intermediate',
    },
    {
      id: 'java-concurrency-utilities-q2',
      question: "What is the difference between CountDownLatch and CyclicBarrier?",
      answer: "With a CountDownLatch, some threads wait while other threads count down; the counting threads do not block, and the count can be decremented any number of times by any thread. Once it reaches zero it cannot be reused. With a CyclicBarrier, a fixed group of threads all wait for each other: each calls await() and blocks until all parties have arrived; then an optional barrier action runs and all continue. It automatically resets, so it can be used for many rounds, and if one party fails the barrier breaks for everyone. Latch: \"wait until these things happen\"; barrier: \"let's all meet here before continuing\".",
      points: [
        "Latch: waiters vs counters, one-shot.",
        "Barrier: peers wait for each other, reusable.",
        "Barrier has an optional action and can break.",
      ],
      difficulty: 'Intermediate',
    },
    {
      id: 'java-concurrency-utilities-q3',
      question: "What is a Semaphore? How is it different from a lock?",
      answer: "A Semaphore manages a set of permits. acquire() takes a permit, blocking if none are left, and release() returns one. It limits how many threads can access a resource at the same time, such as at most five concurrent calls to a throttled API or a fixed pool of connections. A lock allows only one thread at a time and has an owner: only the thread that locked it can unlock it, and ReentrantLock can be re-entered by the owner. Semaphore permits have no owner, any thread may release one, and it is not reentrant: a thread acquiring twice uses two permits. A semaphore with one permit can serve as a simple mutex.",
      example: `Semaphore permits = new Semaphore(5);
permits.acquire();
try { callApi(); } finally { permits.release(); }`,
      points: [
        "Controls N concurrent accesses.",
        "Permits have no owner; locks do.",
        "Not reentrant.",
        "Release in finally.",
      ],
      difficulty: 'Intermediate',
    },
    {
      id: 'java-concurrency-utilities-q4',
      question: "Is this code thread-safe? map.put(key, map.get(key) + 1) where map is a ConcurrentHashMap.",
      answer: "No. get and put are each thread-safe, but together they form a read-modify-write sequence. Two threads can both read 5 and both write 6, losing one increment. ConcurrentHashMap makes individual operations atomic, not sequences of them. Use map.merge(key, 1, Integer::sum), which performs the update atomically for that key, or map.compute(...). For heavily updated counters, store a LongAdder per key with computeIfAbsent(key, k -> new LongAdder()).increment().",
      example: `map.merge(key, 1, Integer::sum);`,
      points: [
        "Compound actions are not atomic.",
        "Lost update race.",
        "Use merge/compute/computeIfAbsent.",
        "LongAdder for hot counters.",
      ],
      difficulty: 'Intermediate',
    },
    {
      id: 'java-concurrency-utilities-q5',
      question: "What is the happens-before relationship in the Java Memory Model?",
      answer: "Happens-before is the JMM's guarantee about visibility and ordering: if action A happens-before action B, then B sees all effects of A and everything that happened before A. Without such a relationship, the compiler and CPU may reorder or cache operations, so another thread may see stale or out-of-order values. The main rules are: program order within a thread; an unlock of a monitor happens-before every subsequent lock of the same monitor; a volatile write happens-before every subsequent read of that variable; Thread.start() happens-before the actions of the started thread; a thread's actions happen-before another thread's successful return from join(); and the relation is transitive. java.util.concurrent classes add their own, such as put into a BlockingQueue happens-before the corresponding take.",
      points: [
        "Defines what a thread is guaranteed to see.",
        "Rules: program order, monitor, volatile, start, join.",
        "Transitive.",
        "Concurrent utilities provide their own guarantees.",
      ],
      difficulty: 'Advanced',
    },
    {
      id: 'java-concurrency-utilities-q6',
      question: "Why must the instance field be volatile in double-checked locking?",
      answer: "Creating an object involves allocating memory, running the constructor and assigning the reference. Without volatile, the JIT or CPU may reorder these so the reference is assigned before the constructor finishes. A second thread performing the first, unsynchronized check could then see a non-null reference and use a partially constructed object. Making the field volatile creates a happens-before edge between the write of the fully constructed object and any read of the field, preventing that reordering. The simpler alternatives are an enum singleton or the initialization-on-demand holder idiom, which rely on the JVM's thread-safe class initialization.",
      points: [
        "Reference can be published before construction completes.",
        "volatile forbids that reordering and ensures visibility.",
        "Holder idiom or enum are simpler alternatives.",
      ],
      difficulty: 'Advanced',
    },
    {
      id: 'java-concurrency-utilities-q7',
      question: "How does the Fork/Join framework work, and how does it relate to parallel streams?",
      answer: "Fork/Join executes divide-and-conquer tasks. A RecursiveTask splits its work into subtasks until they are below a threshold, forks one subtask to run asynchronously, computes the other itself and joins the results. ForkJoinPool uses work stealing: each worker thread has its own deque, pushes and pops its own tasks at one end, and idle threads steal tasks from the other end of busy threads' deques, which balances load with little contention. Parallel streams split their source with a Spliterator and run the pieces as Fork/Join tasks on the shared ForkJoinPool.commonPool(), whose size is based on the number of CPU cores. Because the pool is shared by the whole JVM, parallel streams should only be used for large CPU-bound work, never for blocking I/O.",
      points: [
        "Split, fork, compute, join.",
        "Work stealing with per-thread deques.",
        "Parallel streams use the common pool.",
        "CPU-bound only; no blocking I/O.",
      ],
      difficulty: 'Advanced',
    },
    {
      id: 'java-concurrency-utilities-q8',
      question: "What is ThreadLocal and what problems can it cause in a web application?",
      answer: "ThreadLocal stores a separate value for each thread, so code deeper in the call stack can access per-request data such as the current user or a correlation id without passing it through every method. Spring uses it for SecurityContextHolder and transaction synchronization, and logging frameworks use it for MDC. In a web application, requests run on pooled threads that are reused. If a value is not removed at the end of the request, the next request on that thread can see the previous user's data, a security bug, and the values leak memory because the threads never die. Values also do not flow to other threads, such as @Async methods or CompletableFuture tasks, unless copied explicitly. Always set and remove in a try/finally, typically in a filter or interceptor.",
      points: [
        "Per-thread value for request context.",
        "Pooled threads: stale data and memory leaks.",
        "remove() in finally.",
        "Not propagated to async threads.",
      ],
      difficulty: 'Intermediate',
    },
    {
      id: 'java-concurrency-utilities-q9',
      question: "How would you make three threads print \"A\", \"B\" and \"C\" in order, ten times (ABCABC...)?",
      answer: "Use three semaphores, one per thread, where only the first starts with a permit. Thread A acquires semA, prints A and releases semB; thread B acquires semB, prints B and releases semC; thread C acquires semC, prints C and releases semA. Each thread can only run when the previous one has passed it the turn, so the output is strictly ABC repeated. An alternative uses one lock with a shared turn variable and a Condition per thread (or wait/notifyAll with a while loop that checks turn), but the semaphore version is shorter and less error-prone.",
      example: `Semaphore a = new Semaphore(1), b = new Semaphore(0), c = new Semaphore(0);

Runnable printer(String text, Semaphore mine, Semaphore next) {
    return () -> {
        for (int i = 0; i < 10; i++) {
            try { mine.acquire(); } catch (InterruptedException e) { return; }
            System.out.print(text);
            next.release();
        }
    };
}

new Thread(printer("A", a, b)).start();
new Thread(printer("B", b, c)).start();
new Thread(printer("C", c, a)).start();`,
      points: [
        "One semaphore per thread.",
        "Only the first starts with a permit.",
        "Each thread releases the next one's semaphore.",
      ],
      difficulty: 'Advanced',
    },
  ],
}

export default topic
