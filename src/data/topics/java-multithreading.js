const topic = {
  id: 'java-multithreading',
  category: 'java',
  title: 'Multithreading & Concurrency',
  description: 'Running work in parallel safely: threads, synchronization, executors, CompletableFuture, locks and concurrent collections.',
  difficulty: 'Advanced',
  overview: "Multithreading means one program doing several things at the same time. A thread is a single path of execution inside your program. A web server like Spring Boot handles each incoming request on its own thread, so hundreds of users can be served at once.\n\nImagine a restaurant kitchen. One cook (a single thread) makes dishes one after another. Several cooks (multiple threads) can prepare dishes in parallel, which is much faster, but now they share the same fridge, knives and stove. If two cooks grab the last egg at the same moment, or each waits for the other's pan forever, things go wrong. Concurrency is the art of letting cooks work together without these accidents.\n\nJava gives you tools at several levels: low-level `Thread`, `synchronized`, `volatile`, `wait()`/`notify()`; and high-level tools in `java.util.concurrent` such as `ExecutorService`, `CompletableFuture`, `ConcurrentHashMap`, atomic classes and `ReentrantLock`. In real projects you mostly use the high-level tools.\n\nInterviewers test whether you understand the dangers (race conditions, deadlocks, visibility problems) and know the right tool to avoid each one.",

  subtopics: [
    {
      id: 'process-vs-thread',
      title: 'Process vs Thread',
      explanation: "A process is a running program with its own separate memory space; for example, each JVM you start is a process. A thread is a lightweight unit of execution inside a process. All threads of a process share the same heap memory (objects), but each thread has its own stack (local variables and method calls).\n\nCreating and switching between threads is much cheaper than between processes, and threads can communicate easily through shared objects. That sharing is also the source of every concurrency bug.",
      interviewPoints: [
        'Processes have separate memory; threads share the heap of their process.',
        'Each thread has its own stack and program counter.',
        'A crash in one process does not affect another; a bad thread can corrupt shared state for the whole process.',
      ],
    },
    {
      id: 'thread-runnable',
      title: 'Thread & Runnable',
      explanation: "There are two classic ways to create a thread: extend the `Thread` class and override `run()`, or implement the `Runnable` interface and pass it to a `Thread`. Implementing `Runnable` (usually as a lambda) is preferred because your class stays free to extend something else and the task is separated from the thread that runs it.\n\nAlways call `start()`, not `run()`. `start()` creates a new thread which then calls `run()`; calling `run()` directly just executes the code on the current thread like a normal method call. `join()` waits for a thread to finish. Java 21 also adds lightweight virtual threads via `Thread.ofVirtual()` and `Executors.newVirtualThreadPerTaskExecutor()`.",
      example: `// Option 1: extend Thread
class Worker extends Thread {
    @Override
    public void run() {
        System.out.println("Running in " + Thread.currentThread().getName());
    }
}

// Option 2: Runnable (preferred)
Runnable task = () -> System.out.println("Task on " + Thread.currentThread().getName());

public static void main(String[] args) throws InterruptedException {
    Thread t1 = new Worker();
    Thread t2 = new Thread(task, "my-thread");
    t1.start();
    t2.start();
    t1.join();   // wait for t1 to finish
    t2.join();

    // Java 21 virtual thread
    Thread v = Thread.ofVirtual().start(task);
    v.join();
}`,
      interviewPoints: [
        'Prefer Runnable over extending Thread.',
        'start() creates a new thread; run() does not.',
        'Calling start() twice throws IllegalThreadStateException.',
      ],
    },
    {
      id: 'thread-lifecycle',
      title: 'Thread Lifecycle',
      explanation: "A Java thread moves through the states in the `Thread.State` enum. NEW: created but `start()` not called yet. RUNNABLE: running or ready to run, waiting for CPU time. BLOCKED: waiting to acquire a monitor lock to enter a `synchronized` block. WAITING: waiting indefinitely for another thread, via `wait()`, `join()` or `LockSupport.park()`. TIMED_WAITING: waiting with a timeout, via `sleep(ms)`, `wait(ms)` or `join(ms)`. TERMINATED: `run()` has finished.\n\nThese are exactly the states you see in a thread dump when debugging a stuck application.",
      example: `Thread t = new Thread(() -> {
    try {
        Thread.sleep(500);
    } catch (InterruptedException e) {
        Thread.currentThread().interrupt();
    }
});
System.out.println(t.getState()); // NEW
t.start();
System.out.println(t.getState()); // RUNNABLE (or TIMED_WAITING shortly after)
t.join();
System.out.println(t.getState()); // TERMINATED`,
      interviewPoints: [
        'Six states: NEW, RUNNABLE, BLOCKED, WAITING, TIMED_WAITING, TERMINATED.',
        'BLOCKED is specifically waiting for a monitor lock; WAITING is waiting for a signal.',
        'sleep() keeps any locks held; wait() releases the monitor lock.',
      ],
    },
    {
      id: 'callable-future',
      title: 'Callable & Future',
      explanation: "`Runnable.run()` cannot return a value or throw a checked exception. `Callable<V>` fixes both: its `call()` method returns a value of type V and can throw `Exception`.\n\nWhen you submit a `Callable` to an `ExecutorService`, you get back a `Future<V>`, a placeholder for a result that will be available later. `future.get()` blocks until the result is ready (use `get(timeout, unit)` to avoid waiting forever), `isDone()` checks without blocking, and `cancel()` tries to stop the task. If the task threw, `get()` throws `ExecutionException` wrapping the original exception.",
      example: `ExecutorService pool = Executors.newFixedThreadPool(2);

Callable<Integer> slowSquare = () -> {
    Thread.sleep(1000);
    return 7 * 7;
};

Future<Integer> future = pool.submit(slowSquare);
System.out.println("Doing other work...");

try {
    Integer result = future.get(2, TimeUnit.SECONDS); // blocks up to 2s
    System.out.println(result); // 49
} catch (ExecutionException e) {
    System.out.println("Task failed: " + e.getCause());
} catch (TimeoutException | InterruptedException e) {
    future.cancel(true);
} finally {
    pool.shutdown();
}`,
      interviewPoints: [
        'Callable returns a value and can throw checked exceptions; Runnable cannot.',
        'Future.get() is blocking.',
        'Exceptions from the task are wrapped in ExecutionException.',
      ],
    },
    {
      id: 'race-condition',
      title: 'Race Condition',
      explanation: "A race condition happens when the result depends on the unpredictable timing of threads accessing shared data. The classic example is `count++`: it looks like one step but is really three (read, add one, write). Two threads can both read 5, both write 6, and one increment is lost.\n\nThe code section that touches shared mutable state is called a critical section. You fix races by making the critical section atomic, using `synchronized`, a `Lock`, or an atomic class like `AtomicInteger`, or by avoiding shared mutable state entirely.",
      example: `class Counter {
    private int count = 0;

    public void increment() {
        count++;              // NOT atomic: read, modify, write
    }

    public int get() { return count; }
}

Counter c = new Counter();
Thread a = new Thread(() -> { for (int i = 0; i < 10_000; i++) c.increment(); });
Thread b = new Thread(() -> { for (int i = 0; i < 10_000; i++) c.increment(); });
a.start(); b.start();
a.join(); b.join();
System.out.println(c.get()); // often less than 20000!`,
      interviewPoints: [
        'count++ is a read-modify-write, not atomic.',
        'Check-then-act (if absent then put) is another classic race.',
        'Race conditions are timing-dependent and hard to reproduce in tests.',
      ],
    },
    {
      id: 'synchronized',
      title: 'synchronized',
      explanation: "The `synchronized` keyword lets only one thread at a time execute a block of code guarded by the same lock. Every Java object has a built-in lock called a monitor. A synchronized instance method locks on `this`, a synchronized static method locks on the `Class` object, and a synchronized block locks on whatever object you specify.\n\n`synchronized` gives two guarantees: mutual exclusion (only one thread inside) and visibility (changes made inside are seen by the next thread that acquires the same lock). It is reentrant: a thread that already holds a lock can enter another block guarded by the same lock. Keep synchronized sections small to avoid slowing everything down.",
      example: `class SafeCounter {
    private int count = 0;
    private final Object lock = new Object();

    public synchronized void increment() {  // locks on this
        count++;
    }

    public void add(int n) {
        synchronized (lock) {                // locks on a private object
            count += n;
        }
    }

    public synchronized int get() {
        return count;
    }
}`,
      interviewPoints: [
        'Provides both atomicity and visibility.',
        'Instance method locks this; static method locks ClassName.class.',
        'Locks are reentrant.',
        'Locking on a private final object prevents outside code from interfering with your lock.',
      ],
    },
    {
      id: 'deadlock',
      title: 'Deadlock',
      explanation: "A deadlock happens when two or more threads each hold a lock and wait forever for a lock held by another. Thread 1 holds lock A and wants B; thread 2 holds B and wants A. Neither can move, and the application hangs without any exception.\n\nThe most common prevention is to always acquire multiple locks in the same global order. Other options: use `tryLock()` with a timeout so a thread can give up and retry, keep lock scopes small, and avoid calling unknown code while holding a lock. You can detect deadlocks with a thread dump (`jstack`), which reports \"Found one Java-level deadlock\".",
      example: `Object lockA = new Object();
Object lockB = new Object();

// Thread 1: A then B
new Thread(() -> {
    synchronized (lockA) {
        sleepQuietly(100);
        synchronized (lockB) { System.out.println("T1 done"); }
    }
}).start();

// Thread 2: B then A  -> DEADLOCK
new Thread(() -> {
    synchronized (lockB) {
        sleepQuietly(100);
        synchronized (lockA) { System.out.println("T2 done"); }
    }
}).start();

// Fix: make Thread 2 also lock A first, then B.`,
      interviewPoints: [
        'Four conditions: mutual exclusion, hold and wait, no preemption, circular wait.',
        'Break circular wait by using a consistent lock ordering.',
        'tryLock(timeout) from ReentrantLock can avoid waiting forever.',
      ],
    },
    {
      id: 'volatile',
      title: 'volatile',
      explanation: "Each CPU core can cache variables, and the compiler can reorder instructions, so one thread may never see a change made by another thread. Marking a field `volatile` guarantees visibility: every read goes to main memory and sees the latest write, and it prevents harmful reordering around that field.\n\n`volatile` does NOT make compound operations atomic: `volatileCount++` is still a race. Use it for simple flags and state written by one thread and read by others, like a `running` flag to stop a worker. For counters, use `AtomicInteger`.",
      example: `class Worker implements Runnable {
    private volatile boolean running = true;

    public void stop() {
        running = false;          // visible to the worker thread immediately
    }

    @Override
    public void run() {
        while (running) {
            // do work
        }
        System.out.println("Stopped");
    }
}
// Without volatile, the loop might never see running == false.`,
      interviewPoints: [
        'volatile = visibility and ordering, not atomicity.',
        'Good for status flags; not for counters.',
        'Used in the double-checked locking singleton pattern.',
      ],
    },
    {
      id: 'wait-notify',
      title: 'wait(), notify() & notifyAll()',
      explanation: "These `Object` methods let threads coordinate: one thread waits until a condition becomes true, another thread changes the condition and wakes it up. They must be called while holding the object's monitor (inside `synchronized` on the same object), otherwise you get `IllegalMonitorStateException`.\n\n`wait()` releases the lock and suspends the thread. `notify()` wakes one waiting thread (which one is not specified), and `notifyAll()` wakes all of them; they then compete for the lock. Always call `wait()` inside a `while` loop that rechecks the condition, because of spurious wakeups and because another thread may have changed the state first. In modern code, prefer `BlockingQueue` or `Condition` from `java.util.concurrent`.",
      example: `class Mailbox {
    private String message;

    public synchronized void put(String msg) throws InterruptedException {
        while (message != null) {
            wait();                 // wait until the box is empty
        }
        message = msg;
        notifyAll();                // wake up consumers
    }

    public synchronized String take() throws InterruptedException {
        while (message == null) {
            wait();                 // wait until there is a message
        }
        String m = message;
        message = null;
        notifyAll();                // wake up producers
        return m;
    }
}`,
      interviewPoints: [
        'Must be called inside synchronized on the same object.',
        'wait() releases the monitor; sleep() does not.',
        'Always wait in a while loop, never an if.',
        'notifyAll() is safer than notify() when several conditions share a monitor.',
      ],
    },
    {
      id: 'executorservice-thread-pools',
      title: 'ExecutorService & Thread Pools',
      explanation: "Creating a new thread for every task is expensive and uncontrolled. A thread pool keeps a fixed set of reusable worker threads and a queue of tasks. `ExecutorService` is the interface for submitting tasks to a pool: `execute(Runnable)`, `submit(Callable)` returning a `Future`, and `invokeAll()`.\n\nThe `Executors` factory offers `newFixedThreadPool(n)`, `newCachedThreadPool()`, `newSingleThreadExecutor()`, `newScheduledThreadPool(n)` and, in Java 21, `newVirtualThreadPerTaskExecutor()`. In production, prefer building a `ThreadPoolExecutor` yourself with a bounded queue, because the fixed and cached factory pools can grow an unbounded queue or unbounded threads and cause `OutOfMemoryError`. Always call `shutdown()` when finished, or use try-with-resources (Java 19+).",
      example: `ExecutorService pool = Executors.newFixedThreadPool(4);
List<Future<String>> results = new ArrayList<>();
for (int i = 1; i <= 10; i++) {
    int id = i;
    results.add(pool.submit(() -> "order-" + id + " on " + Thread.currentThread().getName()));
}
for (Future<String> f : results) {
    System.out.println(f.get());
}
pool.shutdown();
pool.awaitTermination(10, TimeUnit.SECONDS);

// Production style: bounded pool and queue
ThreadPoolExecutor custom = new ThreadPoolExecutor(
        4,                                  // core pool size
        8,                                  // max pool size
        60, TimeUnit.SECONDS,               // idle thread keep-alive
        new ArrayBlockingQueue<>(100),      // bounded queue
        new ThreadPoolExecutor.CallerRunsPolicy()); // what to do when full`,
      interviewPoints: [
        'Pools reuse threads and limit concurrency.',
        'shutdown() lets queued tasks finish; shutdownNow() interrupts running ones.',
        'Fixed pool has an unbounded queue; cached pool has unbounded threads.',
        'CPU-bound pool size is about the number of cores; I/O-bound pools can be larger.',
      ],
    },
    {
      id: 'completablefuture',
      title: 'CompletableFuture',
      explanation: "`CompletableFuture` (Java 8) is a `Future` you can chain and combine without blocking. You start async work with `supplyAsync()` or `runAsync()`, then attach callbacks: `thenApply()` transforms the result, `thenAccept()` consumes it, `thenCompose()` chains another async call, `thenCombine()` merges two futures, and `allOf()`/`anyOf()` wait for many.\n\nErrors are handled with `exceptionally()` or `handle()`. By default async tasks run on `ForkJoinPool.commonPool()`; for I/O calls in a server, pass your own executor. This is how you call several microservices in parallel and merge the answers.",
      example: `ExecutorService io = Executors.newFixedThreadPool(10);

CompletableFuture<User> userF =
        CompletableFuture.supplyAsync(() -> userService.find(42), io);
CompletableFuture<List<Order>> ordersF =
        CompletableFuture.supplyAsync(() -> orderService.forUser(42), io);

CompletableFuture<Profile> profileF = userF
        .thenCombine(ordersF, (user, orders) -> new Profile(user, orders))
        .orTimeout(3, TimeUnit.SECONDS)
        .exceptionally(ex -> Profile.empty());

Profile profile = profileF.join(); // join() throws unchecked CompletionException

CompletableFuture<Void> all = CompletableFuture.allOf(userF, ordersF);`,
      interviewPoints: [
        'Non-blocking chaining: thenApply, thenAccept, thenCompose, thenCombine.',
        'thenApply is like map; thenCompose is like flatMap.',
        'Use a custom executor for blocking I/O instead of the common pool.',
        'join() throws unchecked CompletionException; get() throws checked exceptions.',
      ],
    },
    {
      id: 'concurrent-collections',
      title: 'Concurrent Collections',
      explanation: "Regular collections like `HashMap` and `ArrayList` are not thread-safe. `java.util.concurrent` offers safe, high-performance alternatives. `ConcurrentHashMap` allows many readers and writers at once with fine-grained locking and atomic methods like `computeIfAbsent()` and `merge()`. `CopyOnWriteArrayList` copies the array on every write, so reads are lock-free; great for lists read often and changed rarely, like listeners.\n\n`BlockingQueue` implementations (`ArrayBlockingQueue`, `LinkedBlockingQueue`) make producer-consumer code easy: `put()` blocks when full and `take()` blocks when empty. `ConcurrentLinkedQueue` is a non-blocking queue.",
      example: `ConcurrentHashMap<String, Integer> hits = new ConcurrentHashMap<>();
hits.merge("/home", 1, Integer::sum);         // atomic increment per key

BlockingQueue<String> jobs = new ArrayBlockingQueue<>(10);

Thread producer = new Thread(() -> {
    try {
        for (int i = 0; i < 5; i++) jobs.put("job-" + i); // blocks if full
    } catch (InterruptedException e) {
        Thread.currentThread().interrupt();
    }
});

Thread consumer = new Thread(() -> {
    try {
        while (true) System.out.println("Processing " + jobs.take()); // blocks if empty
    } catch (InterruptedException e) {
        Thread.currentThread().interrupt();
    }
});`,
      interviewPoints: [
        'ConcurrentHashMap beats Hashtable and synchronizedMap under contention.',
        'Compound actions still need atomic methods: use merge/compute, not get-then-put.',
        'CopyOnWriteArrayList: cheap reads, expensive writes.',
        'BlockingQueue is the standard producer-consumer tool.',
      ],
    },
    {
      id: 'atomic-classes',
      title: 'Atomic Classes',
      explanation: "Classes in `java.util.concurrent.atomic`, such as `AtomicInteger`, `AtomicLong`, `AtomicBoolean` and `AtomicReference`, perform single-variable updates atomically without locks. They use CAS (compare-and-swap), a CPU instruction that says \"set the value to X only if it is still Y\"; if another thread changed it, the operation retries.\n\nThey are faster than `synchronized` for simple counters and flags. Under very heavy contention, `LongAdder` is even faster for counters because it spreads updates across several cells.",
      example: `AtomicInteger counter = new AtomicInteger();
counter.incrementAndGet();          // 1, atomic
counter.addAndGet(5);               // 6
counter.compareAndSet(6, 100);      // true, now 100
counter.updateAndGet(x -> x * 2);   // 200

AtomicReference<String> status = new AtomicReference<>("NEW");
status.compareAndSet("NEW", "PROCESSING");

LongAdder requests = new LongAdder();
requests.increment();
System.out.println(requests.sum());`,
      interviewPoints: [
        'Lock-free, based on CAS.',
        'Atomic for one variable only; for updating several variables together use a lock.',
        'LongAdder scales better than AtomicLong for hot counters.',
      ],
    },
    {
      id: 'locks',
      title: 'Locks (ReentrantLock, ReadWriteLock)',
      explanation: "The `Lock` interface gives more control than `synchronized`. `ReentrantLock` supports `tryLock()` (try without waiting, or wait with a timeout), `lockInterruptibly()`, optional fairness (longest-waiting thread goes first), and multiple `Condition` objects for waiting on different conditions.\n\nYou must release the lock yourself in a `finally` block; forgetting it leaves the lock held forever. `ReentrantReadWriteLock` allows many readers at the same time but only one writer, which helps read-heavy data. `StampedLock` adds optimistic reads for even more performance.",
      example: `class BankAccount {
    private final ReentrantLock lock = new ReentrantLock();
    private double balance;

    public boolean withdraw(double amount) throws InterruptedException {
        if (lock.tryLock(1, TimeUnit.SECONDS)) {
            try {
                if (balance >= amount) {
                    balance -= amount;
                    return true;
                }
                return false;
            } finally {
                lock.unlock();         // ALWAYS in finally
            }
        }
        return false;                  // could not get the lock in time
    }
}

ReadWriteLock rw = new ReentrantReadWriteLock();
rw.readLock().lock();
try { /* many readers at once */ } finally { rw.readLock().unlock(); }`,
      interviewPoints: [
        'ReentrantLock: tryLock, timeouts, interruptible, fairness, Conditions.',
        'Always unlock in finally.',
        'ReadWriteLock: concurrent readers, exclusive writer.',
        'Use synchronized for simple cases; Lock when you need its extra features.',
      ],
    },
  ],

  commonMistakes: [
    'Calling thread.run() instead of thread.start(), so the code runs on the current thread and nothing is parallel.',
    'Assuming volatile makes count++ thread-safe; it only guarantees visibility, not atomicity.',
    'Forgetting to call lock.unlock() in a finally block, leaving the lock held forever after an exception.',
    'Using if instead of while around wait(), which breaks on spurious wakeups or when another thread changes the state first.',
    'Swallowing InterruptedException with an empty catch instead of restoring the flag with Thread.currentThread().interrupt().',
    'Never shutting down an ExecutorService, which keeps the JVM alive and leaks threads.',
    'Doing get-then-put on a ConcurrentHashMap and thinking it is atomic; use computeIfAbsent or merge.',
    'Acquiring locks in different orders in different places, which leads to deadlock.',
  ],

  interviewTips: [
    'For every concurrency problem, name the risk (race condition, visibility, deadlock) and then the tool that fixes it.',
    'Explain the difference between atomicity and visibility clearly; it separates synchronized, volatile and AtomicInteger.',
    'Mention that in real Spring Boot apps you rarely create raw threads: you use ExecutorService, @Async with a configured pool, or CompletableFuture.',
    'Know how to take a thread dump (jstack or jcmd Thread.print) and how a deadlock appears in it.',
    'If asked about Java 21, mention virtual threads: cheap threads that make blocking I/O code scale without reactive programming.',
  ],

  interviewQuestions: [
    {
      id: 'java-multithreading-q1',
      question: 'What is the difference between a process and a thread?',
      answer: "A process is an independent running program with its own memory space, managed by the operating system. A thread is a smaller unit of execution inside a process. All threads in a process share its heap memory and resources such as open files, but each thread has its own call stack and program counter.\n\nThreads are cheaper to create and switch between, and they communicate easily through shared objects. The downside is that shared memory requires synchronization to avoid bugs, whereas processes are isolated from each other.",
      points: [
        'Process: own memory, heavyweight, isolated.',
        'Thread: shares heap, own stack, lightweight.',
        'A JVM is one process running many threads.',
      ],
      difficulty: 'Beginner',
    },
    {
      id: 'java-multithreading-q2',
      question: 'What are the ways to create a thread in Java, and which is preferred?',
      answer: "You can extend `Thread` and override `run()`, implement `Runnable` and pass it to a `Thread`, implement `Callable` and submit it to an `ExecutorService` to get a result, or (Java 21) start a virtual thread with `Thread.ofVirtual().start(task)`.\n\nImplementing `Runnable` or `Callable` is preferred over extending `Thread` because Java has single inheritance, and separating the task from the execution mechanism lets you run the same task on a pool. In real applications you usually submit tasks to an `ExecutorService` instead of creating threads manually.",
      example: `new Thread(() -> System.out.println("runnable")).start();

ExecutorService pool = Executors.newFixedThreadPool(2);
Future<Integer> f = pool.submit(() -> 42);   // Callable
pool.shutdown();`,
      points: [
        'Extend Thread, implement Runnable, use Callable with an executor.',
        'Runnable/Callable keep the class free to extend something else.',
        'Always call start(), never run(), to launch a new thread.',
      ],
      difficulty: 'Beginner',
    },
    {
      id: 'java-multithreading-q3',
      question: 'Explain the lifecycle of a thread in Java.',
      answer: "A thread is NEW after construction. After `start()` it becomes RUNNABLE, meaning it is running or ready to run when the scheduler gives it CPU time. It becomes BLOCKED while waiting to enter a `synchronized` block whose lock another thread holds. It becomes WAITING when it calls `wait()`, `join()` or `LockSupport.park()` without a timeout, and TIMED_WAITING for `sleep(ms)`, `wait(ms)` or `join(ms)`. When `run()` finishes, normally or with an exception, it is TERMINATED and cannot be restarted.",
      points: [
        'NEW -> RUNNABLE -> (BLOCKED / WAITING / TIMED_WAITING) -> TERMINATED.',
        'BLOCKED = waiting for a monitor lock.',
        'A terminated thread cannot be started again.',
      ],
      difficulty: 'Beginner',
    },
    {
      id: 'java-multithreading-q4',
      question: 'What is a race condition and how do you prevent it?',
      answer: "A race condition occurs when two or more threads access shared mutable data at the same time and at least one writes, so the outcome depends on timing. For example, two threads doing `count++` can both read the same old value and one update is lost. Another classic case is check-then-act: two threads both see that a key is missing and both insert it.\n\nPrevent races by making the critical section atomic with `synchronized` or a `Lock`, by using atomic classes like `AtomicInteger`, by using atomic methods of concurrent collections (`ConcurrentHashMap.merge`), or by designing without shared mutable state (immutable objects, thread confinement).",
      example: `AtomicInteger count = new AtomicInteger();
count.incrementAndGet();   // safe replacement for count++`,
      points: [
        'Caused by unsynchronized access to shared mutable state.',
        'Read-modify-write and check-then-act are the typical patterns.',
        'Fix with synchronized, locks, atomics, or immutability.',
      ],
      difficulty: 'Intermediate',
    },
    {
      id: 'java-multithreading-q5',
      question: 'What is the difference between synchronized and volatile?',
      answer: "`volatile` guarantees visibility and ordering: a write to a volatile field is immediately visible to all threads that read it, and the compiler/CPU will not reorder around it. It does not provide mutual exclusion, so compound actions like `x++` are still unsafe.\n\n`synchronized` provides both mutual exclusion (only one thread at a time in the block) and visibility (everything written before releasing the lock is visible to the next thread that acquires it). Use `volatile` for simple flags written by one thread and read by others; use `synchronized` (or a lock) when several steps must happen together.",
      points: [
        'volatile: visibility only, no locking, no atomicity for compound operations.',
        'synchronized: atomicity plus visibility, but threads may block.',
        'volatile applies to fields; synchronized applies to methods and blocks.',
      ],
      difficulty: 'Intermediate',
    },
    {
      id: 'java-multithreading-q6',
      question: 'What is the difference between wait() and sleep()?',
      answer: "`sleep()` is a static method of `Thread` that pauses the current thread for a given time. It does not release any locks the thread holds, and it can be called anywhere.\n\n`wait()` is a method of `Object` used for coordination between threads. It must be called while holding that object's monitor (inside `synchronized`), and it releases the monitor while waiting, allowing other threads to enter. The thread wakes up when another thread calls `notify()`/`notifyAll()` on the same object, when a timeout expires, or spuriously, so `wait()` is always called in a loop that rechecks the condition.",
      points: [
        'sleep: Thread method, keeps locks, time-based.',
        'wait: Object method, releases the monitor, signal-based.',
        'wait outside synchronized throws IllegalMonitorStateException.',
      ],
      difficulty: 'Intermediate',
    },
    {
      id: 'java-multithreading-q7',
      question: 'What is an ExecutorService and why use a thread pool?',
      answer: "`ExecutorService` is a high-level API for running tasks asynchronously on a pool of worker threads. You submit `Runnable` or `Callable` tasks, and it manages thread creation, reuse, queueing and shutdown.\n\nThread pools avoid the cost of creating a thread per task, limit how many tasks run at once so the system is not overloaded, and give you `Future` objects to get results. Always shut the executor down. For production, configure a `ThreadPoolExecutor` with bounded queues and a rejection policy, because `newFixedThreadPool` uses an unbounded queue and `newCachedThreadPool` can create unlimited threads.",
      example: `ExecutorService pool = Executors.newFixedThreadPool(4);
try {
    List<Callable<Integer>> tasks = List.of(() -> 1, () -> 2, () -> 3);
    int sum = 0;
    for (Future<Integer> f : pool.invokeAll(tasks)) sum += f.get();
    System.out.println(sum); // 6
} finally {
    pool.shutdown();
}`,
      points: [
        'Reuses threads and bounds concurrency.',
        'submit() returns a Future; execute() does not.',
        'shutdown() vs shutdownNow().',
        'Prefer bounded queues in production.',
      ],
      difficulty: 'Intermediate',
    },
    {
      id: 'java-multithreading-q8',
      question: 'What is a deadlock and how can you prevent and detect it?',
      answer: "A deadlock is when threads wait forever for locks held by each other, for example thread 1 holds lock A and waits for B while thread 2 holds B and waits for A. It needs four conditions: mutual exclusion, hold and wait, no preemption, and circular wait.\n\nPrevent it by acquiring locks in a consistent global order (which breaks circular wait), by using `ReentrantLock.tryLock()` with a timeout and backing off, by holding locks for as short a time as possible, and by not calling external code while holding a lock. Detect it with a thread dump using `jstack <pid>` or `jcmd <pid> Thread.print`, which prints \"Found one Java-level deadlock\" with the threads and locks involved, or with `ThreadMXBean.findDeadlockedThreads()`.",
      example: `// Consistent ordering: always lock the account with the smaller id first
void transfer(Account from, Account to, double amount) {
    Account first = from.id() < to.id() ? from : to;
    Account second = first == from ? to : from;
    synchronized (first) {
        synchronized (second) {
            from.debit(amount);
            to.credit(amount);
        }
    }
}`,
      points: [
        'Circular wait on locks causes deadlock.',
        'Lock ordering is the simplest prevention.',
        'tryLock with timeout lets threads back off.',
        'jstack/jcmd thread dumps reveal deadlocks.',
      ],
      difficulty: 'Advanced',
    },
    {
      id: 'java-multithreading-q9',
      question: 'What is CompletableFuture and how is it better than Future?',
      answer: "A plain `Future` only lets you block with `get()` or poll with `isDone()`; you cannot chain actions, combine several futures, or handle errors in a fluent way. `CompletableFuture` supports non-blocking composition: `thenApply` (transform), `thenAccept` (consume), `thenCompose` (chain another async call), `thenCombine` (merge two results), `allOf`/`anyOf` (wait for many), and error handling with `exceptionally`, `handle` or `whenComplete`. It can also be completed manually and supports timeouts with `orTimeout()` and `completeOnTimeout()`.\n\nBy default async stages run on `ForkJoinPool.commonPool()`, so for blocking I/O you should supply your own executor.",
      example: `CompletableFuture<String> price = CompletableFuture.supplyAsync(() -> fetchPrice("AAPL"), ioPool);
CompletableFuture<String> news = CompletableFuture.supplyAsync(() -> fetchNews("AAPL"), ioPool);

String page = price.thenCombine(news, (p, n) -> p + " | " + n)
        .exceptionally(ex -> "Data unavailable")
        .join();`,
      points: [
        'Chaining and combining without blocking.',
        'Built-in error handling and timeouts.',
        'thenCompose avoids nested CompletableFuture<CompletableFuture<T>>.',
        'Provide a custom executor for I/O-bound tasks.',
      ],
      difficulty: 'Advanced',
    },
    {
      id: 'java-multithreading-q10',
      question: 'How do atomic classes work, and when would you use ReentrantLock instead of synchronized?',
      answer: "Atomic classes such as `AtomicInteger` use compare-and-swap (CAS), a hardware instruction that updates a value only if it still equals the expected value. If another thread changed it in between, the operation retries. This gives lock-free, thread-safe updates for a single variable and is usually faster than locking. Under heavy contention on a counter, `LongAdder` scales better.\n\n`ReentrantLock` is useful when you need features `synchronized` lacks: `tryLock()` to avoid waiting forever, timeouts, `lockInterruptibly()`, a fairness policy, or several `Condition` queues. The trade-off is that you must call `unlock()` in a `finally` block yourself. For simple mutual exclusion, `synchronized` is shorter and less error-prone.",
      example: `AtomicInteger stock = new AtomicInteger(10);
boolean reserved = false;
while (!reserved) {
    int current = stock.get();
    if (current == 0) break;
    reserved = stock.compareAndSet(current, current - 1); // CAS loop
}`,
      points: [
        'CAS = optimistic, lock-free, retry on conflict.',
        'Atomics protect single variables only.',
        'ReentrantLock: tryLock, timeouts, interruptibility, fairness, Conditions.',
        'Always unlock in finally.',
      ],
      difficulty: 'Advanced',
    },
    {
      id: 'java-multithreading-q11',
      question: 'Why is ConcurrentHashMap better than a synchronized HashMap?',
      answer: "`Collections.synchronizedMap(new HashMap<>())` and `Hashtable` use one lock for the whole map, so only one thread can read or write at a time, which becomes a bottleneck. You also must manually synchronize while iterating.\n\n`ConcurrentHashMap` allows concurrent reads without locking and locks only a single bucket during writes (using CAS for empty buckets), so many threads work in parallel. Its iterators are weakly consistent: they never throw `ConcurrentModificationException`. It offers atomic compound operations like `putIfAbsent`, `computeIfAbsent`, `compute` and `merge`, and it rejects null keys and values so that a null result from `get()` always means \"absent\".",
      example: `ConcurrentHashMap<String, LongAdder> counts = new ConcurrentHashMap<>();
counts.computeIfAbsent("login", k -> new LongAdder()).increment();`,
      points: [
        'Fine-grained locking vs one global lock.',
        'Lock-free reads.',
        'Atomic compound methods avoid check-then-act races.',
        'No nulls; weakly consistent iterators.',
      ],
      difficulty: 'Advanced',
    },
    {
      id: 'java-multithreading-q12',
      question: 'What is the difference between Runnable and Callable?',
      answer: "Both represent a task that can run on another thread. `Runnable` has `void run()`: it cannot return a result and cannot throw checked exceptions. `Callable<V>` has `V call() throws Exception`: it returns a result and can throw checked exceptions.\n\nYou can pass a `Runnable` to a `Thread` or an executor. A `Callable` is submitted to an `ExecutorService`, which returns a `Future<V>` for retrieving the result; if `call()` throws, `future.get()` throws an `ExecutionException` that wraps it.",
      example: `Runnable r = () -> System.out.println("no result");
Callable<Integer> c = () -> 21 * 2;

ExecutorService pool = Executors.newSingleThreadExecutor();
pool.execute(r);
Future<Integer> answer = pool.submit(c);
System.out.println(answer.get()); // 42
pool.shutdown();`,
      points: [
        'Runnable: no return value, no checked exceptions.',
        'Callable: returns V, may throw Exception.',
        'Callable results come back through a Future.',
      ],
      difficulty: 'Beginner',
    },
  ],
}

export default topic
