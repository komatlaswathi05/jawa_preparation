const topic = {
  id: 'spring-async-events',
  category: 'spring',
  title: 'Async, Scheduling & Application Events',
  description: "Run work in the background with @Async, schedule jobs with @Scheduled, decouple components with application events, and avoid the proxy and multi-instance pitfalls.",
  difficulty: 'Intermediate',
  overview: "Not every piece of work has to happen while the user waits. Sending a welcome email, generating a report or cleaning up expired tokens can run in the background. Spring gives you three tools for this: `@Async` runs a method on another thread, `@Scheduled` runs a method on a timer, and application events let one component announce that something happened so that others can react without being called directly.\n\nThink of a restaurant. The waiter takes your order and hands it to the kitchen (`@Async`): the waiter does not stand at the stove until the food is ready. The cleaner comes every night at 11 pm (`@Scheduled`). When an order is paid, a bell rings (`ApplicationEvent`) and whoever cares, the kitchen or the loyalty desk, reacts to it.\n\nAll three features are built on Spring proxies and thread pools, so the interview questions are mostly about how they work under the hood: which thread runs the code, what happens to exceptions and transactions, and what goes wrong when you run several instances of the application. Examples use an online shop with `OrderService`, `EmailService` and `ReportService`.",

  subtopics: [
    {
      id: 'enable-async',
      title: '@EnableAsync and @Async',
      explanation: "Add `@EnableAsync` to a configuration class and annotate a public method with `@Async`. When another bean calls it, Spring's proxy submits the method to a `TaskExecutor` and returns immediately; the caller does not wait for the method to finish.\n\nIn Spring Boot, a `ThreadPoolTaskExecutor` named `applicationTaskExecutor` is auto-configured, and you can tune it with `spring.task.execution.*` properties. Async methods are ideal for fire-and-forget work such as sending emails, push notifications or calling a slow third-party API whose result the user does not need immediately.",
      example: `@Configuration
@EnableAsync
public class AsyncConfig {
}

@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    @Async
    public void sendWelcomeEmail(String email) {
        log.info("Sending email on thread {}", Thread.currentThread().getName());
        // slow SMTP call...
    }
}

@Service
public class UserService {

    private final EmailService emailService;

    public UserService(EmailService emailService) {
        this.emailService = emailService;
    }

    public User register(UserRequest request) {
        User user = saveUser(request);
        emailService.sendWelcomeEmail(user.getEmail());   // returns immediately
        return user;
    }
}`,
      interviewPoints: [
        "@EnableAsync turns on async processing.",
        "@Async methods run on a TaskExecutor thread.",
        "Works through a proxy, so the method must be public and called from another bean.",
        "Boot auto-configures applicationTaskExecutor.",
      ],
    },
    {
      id: 'async-return-types',
      title: 'Async return types: void and CompletableFuture',
      explanation: "An `@Async` method can return `void` (fire and forget) or a `CompletableFuture<T>` when the caller needs the result later. Returning a future lets you start several slow calls in parallel and then combine them, which is much faster than calling them one after another.\n\nInside the async method you return `CompletableFuture.completedFuture(value)`. The caller can then use `thenApply`, `thenCombine` or `CompletableFuture.allOf(...)` and finally `join()` to wait for the results. Any other return type is not supported.",
      example: `@Service
public class PriceService {

    @Async
    public CompletableFuture<BigDecimal> priceFromSupplierA(String sku) {
        BigDecimal price = supplierAClient.getPrice(sku);   // 2 seconds
        return CompletableFuture.completedFuture(price);
    }

    @Async
    public CompletableFuture<BigDecimal> priceFromSupplierB(String sku) {
        BigDecimal price = supplierBClient.getPrice(sku);   // 2 seconds
        return CompletableFuture.completedFuture(price);
    }
}

// caller: both calls run in parallel, total about 2 seconds instead of 4
CompletableFuture<BigDecimal> a = priceService.priceFromSupplierA("SKU-1");
CompletableFuture<BigDecimal> b = priceService.priceFromSupplierB("SKU-1");

BigDecimal best = a.thenCombine(b, BigDecimal::min).join();`,
      interviewPoints: [
        "void for fire-and-forget.",
        "CompletableFuture<T> when the caller needs a result.",
        "Parallel calls: start all, then combine and join.",
      ],
    },
    {
      id: 'custom-executor',
      title: 'Configuring the thread pool (TaskExecutor)',
      explanation: "The default executor in Spring Boot has 8 core threads and an unbounded queue, which means tasks never get rejected but can pile up in memory if they arrive faster than they finish. For production you should size the pool deliberately and give each type of work its own executor, so slow report generation cannot starve email sending.\n\nDefine a `ThreadPoolTaskExecutor` bean and reference it by name with `@Async(\"reportExecutor\")`. Set core size, max size, queue capacity, a thread name prefix (for readable logs) and a rejection policy. With `CallerRunsPolicy`, when the pool and queue are full, the caller's thread runs the task itself, which naturally slows down producers.",
      example: `@Configuration
@EnableAsync
public class AsyncConfig {

    @Bean(name = "reportExecutor")
    public ThreadPoolTaskExecutor reportExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(4);
        executor.setMaxPoolSize(8);
        executor.setQueueCapacity(100);
        executor.setThreadNamePrefix("report-");
        executor.setRejectedExecutionHandler(new ThreadPoolExecutor.CallerRunsPolicy());
        executor.setWaitForTasksToCompleteOnShutdown(true);
        executor.setAwaitTerminationSeconds(30);
        executor.initialize();
        return executor;
    }
}

@Async("reportExecutor")
public CompletableFuture<Report> generateReport(Long customerId) { ... }

# application.yml: tune the default executor instead
spring:
  task:
    execution:
      pool:
        core-size: 8
        max-size: 16
        queue-capacity: 500
      thread-name-prefix: async-`,
      interviewPoints: [
        "Default pool: 8 core threads, unbounded queue.",
        "Separate executors per workload.",
        "Threads grow beyond core size only when the queue is full.",
        "Choose a rejection policy; CallerRunsPolicy applies back-pressure.",
      ],
    },
    {
      id: 'async-exceptions',
      title: 'Exception handling in async methods',
      explanation: "Exceptions thrown by an `@Async` method do not reach the caller, because the caller has already moved on. For methods returning `CompletableFuture`, the exception is stored in the future: the caller sees it when calling `join()` (wrapped in `CompletionException`) or can handle it with `exceptionally` or `handle`.\n\nFor `void` methods there is nobody to receive the exception, so by default Spring just logs it. Implement `AsyncConfigurer.getAsyncUncaughtExceptionHandler()` to log it properly, raise an alert or record the failure.",
      example: `@Configuration
@EnableAsync
public class AsyncConfig implements AsyncConfigurer {

    private static final Logger log = LoggerFactory.getLogger(AsyncConfig.class);

    @Override
    public AsyncUncaughtExceptionHandler getAsyncUncaughtExceptionHandler() {
        return (ex, method, params) ->
            log.error("Async method {} failed with params {}", method.getName(), params, ex);
    }
}

// CompletableFuture: handle the failure in the caller
priceService.priceFromSupplierA("SKU-1")
    .exceptionally(ex -> {
        log.warn("Supplier A failed, using fallback price", ex);
        return BigDecimal.ZERO;
    });`,
      interviewPoints: [
        "The caller never sees exceptions from void async methods.",
        "Use AsyncUncaughtExceptionHandler for void methods.",
        "CompletableFuture carries the exception; handle with exceptionally/handle.",
      ],
    },
    {
      id: 'async-pitfalls',
      title: 'Async pitfalls: self-invocation, transactions and context',
      explanation: "`@Async` is applied by a Spring proxy, so the same rules as `@Transactional` apply. Calling an async method from another method in the same class (`this.sendEmail()`) bypasses the proxy and runs synchronously. The method must be public and the bean must be managed by Spring.\n\nThe async method runs on a different thread, so it does not join the caller's transaction and it does not see thread-bound context: the `SecurityContext`, MDC logging values and request attributes are empty unless you propagate them. If the async task needs its own transaction, put `@Transactional` on the async method. If it must only run after the caller's transaction commits, use `@TransactionalEventListener` instead (see below). To propagate context, configure a `TaskDecorator` on the executor.",
      example: `@Service
public class OrderService {

    public void placeOrder(Order order) {
        save(order);
        notifyWarehouse(order);   // WRONG: self-invocation, runs synchronously
    }

    @Async
    public void notifyWarehouse(Order order) { ... }
}

// Propagate the MDC (correlation id) to async threads
@Bean
public ThreadPoolTaskExecutor applicationTaskExecutor() {
    ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
    executor.setTaskDecorator(runnable -> {
        Map<String, String> context = MDC.getCopyOfContextMap();
        return () -> {
            if (context != null) MDC.setContextMap(context);
            try {
                runnable.run();
            } finally {
                MDC.clear();
            }
        };
    });
    executor.initialize();
    return executor;
}`,
      interviewPoints: [
        "Self-invocation bypasses the proxy: no async.",
        "Async code runs outside the caller's transaction.",
        "SecurityContext and MDC are not propagated by default.",
        "TaskDecorator copies context to the worker thread.",
      ],
    },
    {
      id: 'scheduling',
      title: '@EnableScheduling and @Scheduled',
      explanation: "`@EnableScheduling` turns on scheduled tasks, and `@Scheduled` on a method (with no parameters, returning void) runs it periodically. `fixedRate` starts the method every N milliseconds, measured from the start of the previous run. `fixedDelay` waits N milliseconds after the previous run finishes, so runs never overlap. `initialDelay` delays the first run. `cron` runs at calendar times.\n\nDurations can be written as strings such as `\"PT5M\"` or with a `timeUnit`, and values can come from configuration with placeholders, so different environments can have different schedules.",
      example: `@Configuration
@EnableScheduling
public class SchedulingConfig {
}

@Component
public class CleanupJobs {

    // every 5 minutes, counted from the start of each run
    @Scheduled(fixedRate = 5, timeUnit = TimeUnit.MINUTES)
    public void refreshExchangeRates() { ... }

    // 10 seconds after the previous run finished; first run after 30 seconds
    @Scheduled(fixedDelay = 10_000, initialDelay = 30_000)
    public void processOutbox() { ... }

    // from configuration: cleanup.cron=0 0 2 * * *
    @Scheduled(cron = "\${cleanup.cron}", zone = "Asia/Kolkata")
    public void deleteExpiredTokens() { ... }
}`,
      interviewPoints: [
        "fixedRate: from start to start; fixedDelay: from end to start.",
        "cron for calendar schedules, with an optional zone.",
        "Method takes no arguments and returns void.",
        "Externalise schedules with property placeholders.",
      ],
    },
    {
      id: 'cron-expressions',
      title: 'Cron expressions in Spring',
      explanation: "Spring cron expressions have six fields: second, minute, hour, day of month, month, day of week. (Unix cron has five; Spring adds seconds at the front.) `*` means every value, `*/15` means every 15, `1-5` is a range, `MON-FRI` names days, and `?` can stand for \"no specific value\" in the day fields.\n\nSpring also supports macros such as `@daily`, `@hourly` and `@weekly`. Always set `zone` for business-hour schedules, otherwise the server's time zone is used, which is often UTC in containers.",
      example: `// sec min hour day-of-month month day-of-week
"0 0 2 * * *"         // every day at 02:00:00
"0 */15 * * * *"      // every 15 minutes
"0 0 9-17 * * MON-FRI" // every hour from 9 to 17 on weekdays
"0 30 23 L * *"       // 23:30 on the last day of the month
"0 0 0 1 1 *"         // midnight on 1 January
"@daily"              // same as "0 0 0 * * *"

@Scheduled(cron = "0 0 9 * * MON-FRI", zone = "Europe/London")
public void sendDailySummary() { ... }`,
      interviewPoints: [
        "Six fields in Spring, starting with seconds.",
        "Use zone to avoid surprises with UTC servers.",
        "Macros such as @daily and @hourly are supported.",
      ],
    },
    {
      id: 'scheduler-thread-pool',
      title: 'Scheduler thread pool and long-running jobs',
      explanation: "By default all `@Scheduled` methods share a single thread. If one job takes ten minutes, every other job waits. Increase the pool with `spring.task.scheduling.pool.size`, or make the long job hand its work to an async executor.\n\nWith `fixedRate`, if a run takes longer than the rate, the next run starts as soon as the previous one ends (on a single thread they never overlap). With a larger pool and `@Async` on the method, runs can overlap, which is usually not what you want for jobs that touch the same data.",
      example: `# application.yml
spring:
  task:
    scheduling:
      pool:
        size: 4
      thread-name-prefix: scheduler-

@Component
public class ReportJobs {

    private final ReportService reportService;

    public ReportJobs(ReportService reportService) {
        this.reportService = reportService;
    }

    @Scheduled(cron = "0 0 1 * * *")
    public void nightlyReports() {
        reportService.generateAllReports();   // @Async on reportExecutor
    }
}`,
      interviewPoints: [
        "Default: one scheduler thread for all jobs.",
        "A slow job delays others; increase pool size.",
        "Be careful about overlapping runs of the same job.",
      ],
    },
    {
      id: 'shedlock',
      title: 'Scheduled jobs on multiple instances (ShedLock)',
      explanation: "`@Scheduled` runs in every instance of your application. If you deploy three pods, a nightly billing job runs three times, which can send duplicate emails or charge customers twice. Spring does not coordinate instances for you.\n\nThe common solution is ShedLock: before running, a job takes a named lock in a shared store (a database table, Redis, ZooKeeper). Only the instance that gets the lock runs the job. `lockAtMostFor` releases the lock if the instance crashes, and `lockAtLeastFor` prevents a very fast job from running again on another instance whose clock is slightly different. Alternatives are running the job as a separate Kubernetes CronJob, or using Quartz in cluster mode.",
      example: `CREATE TABLE shedlock (
  name       VARCHAR(64)  PRIMARY KEY,
  lock_until TIMESTAMP    NOT NULL,
  locked_at  TIMESTAMP    NOT NULL,
  locked_by  VARCHAR(255) NOT NULL
);

@Configuration
@EnableScheduling
@EnableSchedulerLock(defaultLockAtMostFor = "PT10M")
public class SchedulingConfig {

    @Bean
    public LockProvider lockProvider(DataSource dataSource) {
        return new JdbcTemplateLockProvider(
            JdbcTemplateLockProvider.Configuration.builder()
                .withJdbcTemplate(new JdbcTemplate(dataSource))
                .usingDbTime()
                .build());
    }
}

@Scheduled(cron = "0 0 2 1 * *")   // 02:00 on the 1st of every month
@SchedulerLock(name = "monthlyBilling", lockAtMostFor = "PT30M", lockAtLeastFor = "PT1M")
public void runBilling() { ... }`,
      interviewPoints: [
        "@Scheduled runs on every instance.",
        "ShedLock: a shared lock so only one instance runs the job.",
        "lockAtMostFor protects against crashed instances.",
        "Alternatives: Kubernetes CronJob, Quartz cluster mode.",
      ],
    },
    {
      id: 'application-events',
      title: 'Application events: ApplicationEventPublisher and @EventListener',
      explanation: "Application events implement the observer pattern inside one Spring application. A publisher calls `applicationEventPublisher.publishEvent(new OrderPlacedEvent(...))`, and any bean method annotated with `@EventListener` that accepts that event type is called. The publisher does not know who listens, so you can add a new reaction (loyalty points, analytics) without touching `OrderService`.\n\nEvents can be any object; a record is a good choice. By default, listeners run synchronously on the publisher's thread, inside its transaction, in an order you can control with `@Order`. If a synchronous listener throws, the exception propagates to the publisher. Spring itself publishes events such as `ApplicationReadyEvent` and `ContextClosedEvent`.",
      example: `public record OrderPlacedEvent(Long orderId, Long customerId, BigDecimal amount) {
}

@Service
public class OrderService {

    private final OrderRepository orderRepository;
    private final ApplicationEventPublisher events;

    public OrderService(OrderRepository orderRepository, ApplicationEventPublisher events) {
        this.orderRepository = orderRepository;
        this.events = events;
    }

    @Transactional
    public Order placeOrder(OrderRequest request) {
        Order order = orderRepository.save(Order.from(request));
        events.publishEvent(new OrderPlacedEvent(order.getId(), order.getCustomerId(), order.getAmount()));
        return order;
    }
}

@Component
public class LoyaltyListener {

    @EventListener
    public void onOrderPlaced(OrderPlacedEvent event) {
        // add loyalty points
    }
}

@Component
public class StartupListener {

    @EventListener(ApplicationReadyEvent.class)
    public void warmUpCache() { ... }
}`,
      interviewPoints: [
        "Observer pattern inside the application; loose coupling.",
        "Any object can be an event.",
        "Listeners are synchronous by default, same thread and transaction.",
        "Built-in events such as ApplicationReadyEvent.",
      ],
    },
    {
      id: 'transactional-event-listener',
      title: '@TransactionalEventListener',
      explanation: "A plain `@EventListener` runs immediately, while the publisher's transaction is still open. If the listener sends an email and the transaction later rolls back, the customer gets a confirmation for an order that does not exist.\n\n`@TransactionalEventListener` delays the listener until a transaction phase: `AFTER_COMMIT` (the default), `AFTER_ROLLBACK`, `AFTER_COMPLETION` or `BEFORE_COMMIT`. It is the right tool for side effects that must only happen once data is really saved: emails, messages to Kafka, cache eviction.\n\nIn the AFTER_COMMIT phase the original transaction is finished, so if the listener needs to write to the database, it should start a new transaction with `@Transactional(propagation = REQUIRES_NEW)`. Combine it with `@Async` so the slow work does not delay the response.",
      example: `@Component
public class OrderEmailListener {

    private final EmailService emailService;

    public OrderEmailListener(EmailService emailService) {
        this.emailService = emailService;
    }

    @Async
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void sendConfirmation(OrderPlacedEvent event) {
        emailService.sendOrderConfirmation(event.orderId());
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_ROLLBACK)
    public void logFailure(OrderPlacedEvent event) {
        // metrics, alerting
    }
}`,
      interviewPoints: [
        "Runs the listener after commit by default.",
        "Prevents side effects for rolled-back data.",
        "Needs REQUIRES_NEW to write to the database after commit.",
        "If there is no transaction, the listener is not called (unless fallbackExecution = true).",
      ],
    },
    {
      id: 'events-vs-messaging',
      title: 'Application events vs message brokers',
      explanation: "Spring application events live in memory inside one JVM. They are lost if the application crashes after the commit but before the listener finishes, and other services cannot receive them. They are great for decoupling modules inside one application.\n\nWhen another microservice must react, or the event must not be lost, publish to a broker such as Kafka or RabbitMQ. To make the database write and the message atomic, use the transactional outbox pattern: save the event to an outbox table in the same transaction and let a relay publish it. Spring Modulith provides an event publication registry that persists application events for exactly this reason.",
      example: `// in-process, same JVM: fine for module decoupling
events.publishEvent(new OrderPlacedEvent(...));

// other services must react, and nothing may be lost: outbox + Kafka
@Transactional
public Order placeOrder(OrderRequest request) {
    Order order = orderRepository.save(Order.from(request));
    outboxRepository.save(OutboxEvent.of("OrderPlaced", order));   // same transaction
    return order;
}

@Scheduled(fixedDelay = 1000)
public void relayOutbox() {
    outboxRepository.findUnpublished().forEach(e -> {
        kafkaTemplate.send("orders", e.getPayload());
        e.markPublished();
    });
}`,
      interviewPoints: [
        "Application events are in-memory and single-JVM.",
        "Can be lost on crash; not visible to other services.",
        "Use Kafka/RabbitMQ with the outbox pattern across services.",
      ],
    },
    {
      id: 'virtual-threads',
      title: 'Virtual threads in Spring Boot',
      explanation: "With Java 21 and Spring Boot 3.2+, setting `spring.threads.virtual.enabled=true` makes Tomcat, the async `applicationTaskExecutor` and the task scheduler use virtual threads. Virtual threads are very cheap, so blocking I/O (JDBC, HTTP calls) no longer ties up a scarce platform thread, and you can handle many more concurrent requests without reactive code.\n\nVirtual threads do not make CPU-bound work faster, and the database connection pool is still limited, so they move the bottleneck rather than removing it. On Java versions before 24, blocking inside `synchronized` blocks can pin a virtual thread to its carrier; prefer `ReentrantLock` in hot paths.",
      example: `# application.yml (Java 21+, Spring Boot 3.2+)
spring:
  threads:
    virtual:
      enabled: true

// @Async and @Scheduled methods now run on virtual threads
@Async
public void sendWelcomeEmail(String email) {
    log.info("virtual = {}", Thread.currentThread().isVirtual());   // true
}`,
      interviewPoints: [
        "One property switches Tomcat, @Async and scheduling to virtual threads.",
        "Great for blocking I/O, not for CPU-heavy work.",
        "Connection pools still limit throughput.",
        "Watch for pinning in synchronized blocks on older JDKs.",
      ],
    },
  ],

  commonMistakes: [
    "Forgetting @EnableAsync or @EnableScheduling, so the annotations silently do nothing.",
    "Calling an @Async method from the same class, which bypasses the proxy and runs synchronously.",
    "Expecting an @Async method to join the caller's transaction or see the SecurityContext.",
    "Leaving the default executor with an unbounded queue in production, so tasks pile up in memory under load.",
    "Swallowing exceptions in void @Async methods because no AsyncUncaughtExceptionHandler is configured.",
    "Running @Scheduled jobs on several instances without a lock, causing duplicate billing or emails.",
    "Using the single default scheduler thread for a long job, which blocks all other scheduled jobs.",
    "Sending emails or Kafka messages from a plain @EventListener before the transaction commits.",
    "Writing five cron fields (Unix style) instead of Spring's six, or forgetting the time zone.",
  ],

  interviewTips: [
    "Explain that @Async, @Scheduled and @TransactionalEventListener all rely on proxies and thread pools, then discuss the consequences.",
    "Always mention the multi-instance problem with @Scheduled and a solution such as ShedLock or a Kubernetes CronJob.",
    "Clearly contrast fixedRate and fixedDelay with a timeline example.",
    "Use the order-confirmation email as the example for @TransactionalEventListener(AFTER_COMMIT).",
    "Show you know the limits: application events are in-memory, so use Kafka with an outbox across services.",
  ],

  interviewQuestions: [
    {
      id: 'spring-async-events-q1',
      question: "How does @Async work in Spring?",
      answer: "@EnableAsync registers a bean post-processor that wraps beans containing @Async methods in a proxy. When another bean calls an @Async method, the proxy submits the actual invocation to a TaskExecutor and returns immediately: nothing for void methods, or a CompletableFuture that completes when the method finishes. In Spring Boot the default executor is applicationTaskExecutor, a ThreadPoolTaskExecutor configurable with spring.task.execution.* properties, and you can choose a specific executor with @Async(\"beanName\").",
      example: `@Async
public CompletableFuture<Report> generateReport(Long id) {
    return CompletableFuture.completedFuture(build(id));
}`,
      points: [
        "Proxy-based, enabled with @EnableAsync.",
        "Runs on a TaskExecutor thread.",
        "Returns void or CompletableFuture.",
        "Executor can be chosen per method.",
      ],
      difficulty: 'Beginner',
    },
    {
      id: 'spring-async-events-q2',
      question: "Why is my @Async method running synchronously?",
      answer: "The usual causes are: @EnableAsync is missing; the method is called from within the same class (self-invocation), so the call does not pass through the proxy; the method is not public; or the object was created with new instead of being a Spring bean. The fix for self-invocation is to move the async method into a separate bean and inject it. You can check by logging Thread.currentThread().getName() inside the method.",
      example: `// WRONG
public void register(User u) { save(u); this.sendEmail(u); }
@Async public void sendEmail(User u) { ... }

// RIGHT: EmailService is a separate bean
public void register(User u) { save(u); emailService.sendEmail(u); }`,
      points: [
        "Missing @EnableAsync.",
        "Self-invocation bypasses the proxy.",
        "Method must be public and on a Spring bean.",
      ],
      difficulty: 'Intermediate',
    },
    {
      id: 'spring-async-events-q3',
      question: "How are exceptions handled in @Async methods?",
      answer: "If the method returns a CompletableFuture, the exception completes the future exceptionally; the caller sees it as a CompletionException from join() or can handle it with exceptionally(), handle() or whenComplete(). If the method returns void, the exception cannot reach the caller, so Spring passes it to an AsyncUncaughtExceptionHandler, which by default only logs it. Implement AsyncConfigurer and override getAsyncUncaughtExceptionHandler() to handle it properly, for example by logging with context and publishing a metric.",
      points: [
        "CompletableFuture carries the exception.",
        "void methods: AsyncUncaughtExceptionHandler.",
        "Default handler only logs.",
      ],
      difficulty: 'Intermediate',
    },
    {
      id: 'spring-async-events-q4',
      question: "What is the difference between fixedRate, fixedDelay and cron in @Scheduled?",
      answer: "fixedRate runs the method at a fixed interval measured from the start of each run: with fixedRate = 5000, runs start at 0s, 5s, 10s and so on (if a run takes longer than 5 seconds, the next one starts right after it finishes on the single scheduler thread). fixedDelay waits a fixed time after the previous run completes: a 3-second job with fixedDelay = 5000 runs at 0s, 8s, 16s. cron runs at calendar times, such as every weekday at 9 am, and accepts a zone. initialDelay postpones the first run for fixed schedules.",
      example: `@Scheduled(fixedRate = 5000)            // start-to-start
@Scheduled(fixedDelay = 5000)           // end-to-start
@Scheduled(cron = "0 0 9 * * MON-FRI", zone = "Asia/Kolkata")`,
      points: [
        "fixedRate: interval between starts.",
        "fixedDelay: gap after completion.",
        "cron: calendar-based, six fields in Spring.",
      ],
      difficulty: 'Beginner',
    },
    {
      id: 'spring-async-events-q5',
      question: "Your application runs on three pods and a @Scheduled job sends monthly invoices. What goes wrong and how do you fix it?",
      answer: "Every pod has its own scheduler, so the job runs three times and customers receive three invoices. Spring does not coordinate instances. Solutions: use ShedLock, which takes a named lock in a shared database or Redis before running so only one instance executes the job, with lockAtMostFor to release it if the instance crashes; run the job as a separate process such as a Kubernetes CronJob; or use Quartz in clustered mode. The job itself should also be idempotent (for example, skip customers already invoiced this month) as a second line of defence.",
      example: `@Scheduled(cron = "0 0 2 1 * *")
@SchedulerLock(name = "monthlyInvoices", lockAtMostFor = "PT1H")
public void sendInvoices() { ... }`,
      points: [
        "@Scheduled runs on every instance.",
        "ShedLock with a shared lock store.",
        "Or Kubernetes CronJob / Quartz cluster.",
        "Make the job idempotent too.",
      ],
      difficulty: 'Intermediate',
    },
    {
      id: 'spring-async-events-q6',
      question: "What are Spring application events and when would you use them?",
      answer: "Application events are Spring's implementation of the observer pattern. A component publishes an event object through ApplicationEventPublisher, and every bean method annotated with @EventListener for that type is invoked. The publisher does not depend on the listeners, so you can add new behaviour such as loyalty points, analytics or cache eviction without changing the publishing service. Listeners run synchronously on the publisher's thread by default; add @Async to run them in the background. Use them for decoupling modules inside one application, not for communication between services.",
      points: [
        "Observer pattern, loose coupling.",
        "publishEvent + @EventListener.",
        "Synchronous by default.",
        "In-process only.",
      ],
      difficulty: 'Beginner',
    },
    {
      id: 'spring-async-events-q7',
      question: "What is @TransactionalEventListener and why is it useful?",
      answer: "@TransactionalEventListener is an event listener bound to the publisher's transaction. By default it runs in the AFTER_COMMIT phase, so the listener only executes if the transaction actually commits. This prevents side effects such as confirmation emails or Kafka messages for data that was rolled back. Other phases are AFTER_ROLLBACK, AFTER_COMPLETION and BEFORE_COMMIT. If no transaction is active, the listener is skipped unless fallbackExecution = true. Because the original transaction has ended, a listener that writes to the database needs @Transactional(propagation = REQUIRES_NEW).",
      example: `@Async
@TransactionalEventListener
public void sendConfirmation(OrderPlacedEvent event) {
    emailService.sendOrderConfirmation(event.orderId());
}`,
      points: [
        "Runs after commit by default.",
        "Avoids side effects for rolled-back data.",
        "Skipped without a transaction unless fallbackExecution.",
        "Use REQUIRES_NEW for DB writes in the listener.",
      ],
      difficulty: 'Intermediate',
    },
    {
      id: 'spring-async-events-q8',
      question: "Does an @Async method participate in the caller's transaction and security context?",
      answer: "No. Transactions and the SecurityContext are bound to the current thread through ThreadLocal, and an @Async method runs on a different thread. It will not see uncommitted data from the caller's transaction and cannot be rolled back with it; if it needs a transaction, it must declare its own @Transactional. The SecurityContextHolder and MDC values are empty on the worker thread unless you propagate them, for example with DelegatingSecurityContextAsyncTaskExecutor for security or a TaskDecorator for MDC. A common bug is an async method reading an entity the caller has not yet committed.",
      points: [
        "Different thread: no shared transaction.",
        "Declare @Transactional on the async method if needed.",
        "SecurityContext and MDC need explicit propagation.",
        "Beware reading uncommitted data.",
      ],
      difficulty: 'Advanced',
    },
    {
      id: 'spring-async-events-q9',
      question: "How would you size and configure a ThreadPoolTaskExecutor for @Async tasks?",
      answer: "Understand how ThreadPoolExecutor grows: it starts up to corePoolSize threads, then queues tasks, and only when the queue is full does it add threads up to maxPoolSize; after that, the rejection policy applies. The Boot default has an unbounded queue, so it never grows beyond the core size and never rejects, but can run out of memory. For I/O-bound work, use more threads (limited by what downstream systems, such as the connection pool, can handle); for CPU-bound work, use roughly the number of cores. Set a bounded queue, a rejection policy (CallerRunsPolicy for back-pressure), a thread name prefix, and graceful shutdown with waitForTasksToCompleteOnShutdown. Use separate executors per workload and monitor them with Micrometer metrics.",
      points: [
        "Core threads, then queue, then max threads, then reject.",
        "Default unbounded queue is risky.",
        "I/O-bound: more threads; CPU-bound: about the number of cores.",
        "Separate pools, graceful shutdown, metrics.",
      ],
      difficulty: 'Advanced',
    },
  ],
}

export default topic
