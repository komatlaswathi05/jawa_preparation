const topic = {
  id: 'jpa-transactions',
  category: 'jpa',
  title: 'Transactions with @Transactional',
  description: "How Spring manages database transactions with @Transactional: proxies, propagation, isolation, rollback rules and the classic pitfalls.",
  difficulty: 'Advanced',
  overview: "A transaction is a group of database operations that must succeed or fail together. Transferring money is the classic example: subtracting from one account and adding to another must both happen, or neither. If the second step fails, the first must be undone (rolled back).\n\nIn Spring you rarely write `begin`, `commit` and `rollback` yourself. You put `@Transactional` on a method, and Spring wraps the call: it starts a transaction before the method runs, commits when it returns normally, and rolls back when it throws a runtime exception. It works like a safety net under a trapeze act: the performer (your method) does the work, and the net (Spring) catches failures and puts everything back.\n\nThat convenience hides a lot of rules. Spring uses proxies, so calling a transactional method from the same class skips the transaction. Checked exceptions do not roll back by default. Propagation decides what happens when one transactional method calls another, and isolation decides what concurrent transactions can see. These details are favourite interview questions because they cause real production bugs.",

  subtopics: [
    {
      id: 'transactional-basics',
      title: '@Transactional',
      explanation: "`@Transactional` (use `org.springframework.transaction.annotation.Transactional`) marks a method or class as transactional. Spring Boot auto-configures a `JpaTransactionManager` when you use Spring Data JPA, so it works out of the box.\n\nOn a class, it applies to every public method; a method-level annotation overrides the class-level one. Inside the transaction, all repository calls share the same database connection and persistence context, so they commit or roll back together.",
      example: `@Service
public class TransferService {

    private final AccountRepository accounts;

    public TransferService(AccountRepository accounts) {
        this.accounts = accounts;
    }

    @Transactional
    public void transfer(Long fromId, Long toId, BigDecimal amount) {
        Account from = accounts.findById(fromId).orElseThrow();
        Account to = accounts.findById(toId).orElseThrow();
        from.withdraw(amount);   // throws InsufficientFundsException (runtime) if too low
        to.deposit(amount);
        // commit here: both UPDATEs or none
    }
}`,
      interviewPoints: [
        'Starts before the method, commits on normal return, rolls back on RuntimeException/Error',
        'Prefer the Spring annotation over jakarta.transaction.Transactional (more options)',
        'Class-level applies to all public methods',
      ],
    },
    {
      id: 'proxy',
      title: 'How the proxy works',
      explanation: "Spring does not change your class. At startup it creates a proxy object (a JDK dynamic proxy or a CGLIB subclass) that wraps your bean, and injects the proxy wherever your bean is needed. When a caller invokes a transactional method, the call hits the proxy first, which asks the `PlatformTransactionManager` to begin a transaction, then calls your real method, then commits or rolls back.\n\nBecause the logic lives in the proxy, only calls that go through the proxy are transactional. Since Spring 6, `protected` and package-private methods can be transactional with CGLIB proxies, but `private` and `final` methods cannot be intercepted.",
      example: `// Roughly what the proxy does for you
public void transfer(Long from, Long to, BigDecimal amount) {
    TransactionStatus tx = transactionManager.getTransaction(definition);
    try {
        target.transfer(from, to, amount); // your real method
        transactionManager.commit(tx);
    } catch (RuntimeException | Error e) {
        transactionManager.rollback(tx);
        throw e;
    }
}`,
      interviewPoints: [
        'Implemented with AOP proxies around the bean',
        'Only external calls through the proxy are intercepted',
        'private/final methods are never transactional',
      ],
    },
    {
      id: 'self-invocation',
      title: 'Self-invocation pitfall',
      explanation: "If a method in a bean calls another method of the same bean using `this`, the call does not go through the proxy, so the second method's `@Transactional` settings are ignored. This is the most famous Spring transaction bug: a `REQUIRES_NEW` method called internally runs in the outer transaction, or a method called internally runs with no transaction at all.\n\nFixes: move the method to a separate bean (the cleanest), inject the bean into itself lazily, or use `TransactionTemplate` for programmatic control.",
      example: `@Service
public class OrderService {

    public void importAll(List<OrderDto> dtos) {
        for (OrderDto dto : dtos) {
            importOne(dto); // this.importOne(): proxy bypassed, NOT transactional
        }
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void importOne(OrderDto dto) { }
}

// Fix: separate bean
@Service
public class OrderImporter {
    private final OrderWriter writer; // writer.importOne is @Transactional(REQUIRES_NEW)

    public OrderImporter(OrderWriter writer) {
        this.writer = writer;
    }

    public void importAll(List<OrderDto> dtos) {
        dtos.forEach(writer::importOne); // goes through the proxy
    }
}`,
      interviewPoints: [
        'this.method() bypasses the proxy',
        'Annotations on the inner method are silently ignored',
        'Fix: extract to another bean or use TransactionTemplate',
      ],
    },
    {
      id: 'propagation',
      title: 'Propagation (REQUIRED, REQUIRES_NEW, NESTED, etc.)',
      explanation: "Propagation defines what happens when a transactional method is called while a transaction may already be running.\n\n`REQUIRED` (default): join the existing transaction, or start one if none. `REQUIRES_NEW`: suspend the current transaction and start a brand-new independent one (it commits or rolls back on its own, using a second connection). `NESTED`: run inside the current transaction using a savepoint, so an inner failure can roll back to the savepoint without killing the outer transaction (JDBC savepoints; not supported by `JpaTransactionManager` with Hibernate by default). `SUPPORTS`: use a transaction if there is one, otherwise run without. `NOT_SUPPORTED`: suspend any transaction and run without. `MANDATORY`: require an existing transaction or throw. `NEVER`: throw if a transaction exists.",
      example: `@Service
public class AuditService {

    // Audit log must be saved even if the business transaction rolls back
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void log(String action) {
        auditRepository.save(new AuditEntry(action));
    }
}

@Service
public class PaymentService {

    @Transactional // REQUIRED
    public void pay(Long orderId) {
        auditService.log("PAY_ATTEMPT " + orderId); // committed independently
        chargeCard(orderId);                        // if this throws, only payment rolls back
    }
}`,
      interviewPoints: [
        'REQUIRED is the default and joins the outer transaction',
        'REQUIRES_NEW uses a separate transaction and connection',
        'NESTED uses savepoints within the same transaction',
        'Watch pool size: REQUIRES_NEW holds two connections at once',
      ],
    },
    {
      id: 'isolation',
      title: 'Isolation levels',
      explanation: "Isolation controls how much concurrent transactions can see of each other's uncommitted or recently committed changes. Levels from weakest to strongest: `READ_UNCOMMITTED` (dirty reads possible), `READ_COMMITTED` (no dirty reads, but a row may change between two reads: non-repeatable read), `REPEATABLE_READ` (rows you read stay the same; phantoms possible in the SQL standard), and `SERIALIZABLE` (transactions behave as if run one after another).\n\n`Isolation.DEFAULT` uses the database default, which is READ COMMITTED for PostgreSQL. Higher isolation is safer but can cause more blocking or serialization failures that need retries. Many apps keep the default and use optimistic or pessimistic locking for specific conflicts.",
      example: `@Transactional(isolation = Isolation.SERIALIZABLE)
public void allocateSeat(Long flightId, Long passengerId) {
    // PostgreSQL may throw a serialization failure here under contention:
    // catch it at a higher level and retry the whole transaction
}`,
      interviewPoints: [
        'Anomalies: dirty read, non-repeatable read, phantom read, lost update',
        'PostgreSQL default is READ COMMITTED; MySQL InnoDB default is REPEATABLE READ',
        'Stronger isolation means more contention and retries',
      ],
    },
    {
      id: 'rollback-rules',
      title: 'Rollback rules (checked vs unchecked, rollbackFor)',
      explanation: "By default Spring rolls back only on unchecked exceptions (`RuntimeException` and its subclasses) and `Error`. If a method throws a checked exception (like `IOException` or a custom `Exception` subclass), the transaction is committed, which surprises many people.\n\nUse `rollbackFor = Exception.class` (or a specific checked type) to roll back on checked exceptions, and `noRollbackFor` to keep committing for a specific runtime exception. If you catch an exception inside the method and do not rethrow it, the proxy never sees it and commits. You can mark the transaction for rollback manually with `TransactionAspectSupport.currentTransactionStatus().setRollbackOnly()`.",
      example: `@Transactional(rollbackFor = Exception.class)
public void importFile(Path file) throws IOException {
    List<String> lines = Files.readAllLines(file); // IOException now rolls back
    lines.forEach(this::saveLine);
}

@Transactional(noRollbackFor = EmailFailedException.class)
public void register(User user) {
    userRepository.save(user);
    emailClient.sendWelcome(user); // failure here keeps the user saved
}`,
      interviewPoints: [
        'Default: rollback on RuntimeException and Error only',
        'Checked exceptions commit unless rollbackFor is set',
        'Swallowed exceptions do not trigger rollback',
      ],
    },
    {
      id: 'unexpected-rollback',
      title: 'UnexpectedRollbackException (rollback-only)',
      explanation: "When an inner `REQUIRED` method throws a runtime exception, Spring marks the whole shared transaction as rollback-only, even if the outer method catches the exception. When the outer method then tries to commit, Spring rolls back and throws `UnexpectedRollbackException`.\n\nThis happens because both methods are in one physical transaction; it cannot be half committed. If the inner work should be allowed to fail independently, give it `REQUIRES_NEW` (or `NESTED` with a JDBC transaction manager) or avoid throwing across the boundary.",
      example: `@Transactional
public void outer() {
    try {
        inner.doWork(); // @Transactional (REQUIRED) and throws RuntimeException
    } catch (RuntimeException e) {
        // caught, but the shared transaction is already rollback-only
    }
} // commit attempt -> UnexpectedRollbackException`,
      interviewPoints: [
        'Inner failure marks the shared transaction rollback-only',
        'Catching the exception outside does not undo that',
        'Use REQUIRES_NEW for independently failing work',
      ],
    },
    {
      id: 'read-only',
      title: 'readOnly',
      explanation: "`@Transactional(readOnly = true)` is a hint that the method will not modify data. With JPA, Spring sets Hibernate's flush mode to MANUAL and marks the session read-only, so Hibernate skips dirty-check snapshots and never flushes, saving memory and CPU. The JDBC connection is also set read-only, which some drivers or routing data sources use to send queries to a read replica.\n\nA common pattern is `@Transactional(readOnly = true)` on the service class and plain `@Transactional` on write methods. Spring Data's own repository methods already use read-only transactions for queries.",
      example: `@Service
@Transactional(readOnly = true)
public class ProductService {

    public List<ProductDto> search(String term) { return List.of(); }  // read-only

    @Transactional // overrides: read-write
    public ProductDto update(Long id, UpdateProductRequest req) { return null; }
}`,
      interviewPoints: [
        'Skips dirty checking and flushing in Hibernate',
        'Can route to read replicas',
        'It is an optimisation hint, not a security guarantee',
      ],
    },
    {
      id: 'service-layer',
      title: 'Transactions at the service layer',
      explanation: "Put `@Transactional` on service methods that represent one business operation (a use case), such as 'place order' or 'transfer money'. That way all repository calls inside that use case are atomic.\n\nAvoid putting it on controllers (they should handle HTTP, not data consistency) and do not rely only on the per-method transactions of repositories, because then each repository call commits separately and a failure halfway leaves data inconsistent.",
      example: `@RestController
@RequestMapping("/orders")
public class OrderController {
    private final OrderService orderService;

    public OrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    @PostMapping
    public OrderResponse place(@RequestBody @Valid PlaceOrderRequest req) {
        return orderService.placeOrder(req); // transaction lives in the service
    }
}

@Service
public class OrderService {
    @Transactional
    public OrderResponse placeOrder(PlaceOrderRequest req) {
        // reserve stock, create order, create payment record: all or nothing
        return null;
    }
}`,
      interviewPoints: [
        'One business use case = one transaction',
        'Service layer is the transaction boundary',
        'Repository-only transactions commit each call separately',
      ],
    },
    {
      id: 'transactions-lazy-loading',
      title: 'Transactions and lazy loading',
      explanation: "The persistence context normally lives exactly as long as the transaction. Lazy associations can be loaded only while it is open. Once the `@Transactional` service method returns, the entities become detached and touching an unloaded lazy field throws `LazyInitializationException`.\n\nSo design service methods to load everything the caller needs (with JOIN FETCH or `@EntityGraph`) and return DTOs, rather than returning entities and letting the web layer navigate them. Open Session In View (on by default in Spring Boot) keeps the context open during the web request, but it hides the problem and holds connections longer.",
      example: `@Transactional(readOnly = true)
public OrderDetailsDto getDetails(Long id) {
    Order order = orderRepository.findWithItems(id).orElseThrow(); // JOIN FETCH items
    return OrderDetailsDto.from(order); // mapped while the context is open
}`,
      interviewPoints: [
        'Lazy loading needs an open persistence context',
        'Map to DTOs inside the transaction',
        'Consider spring.jpa.open-in-view=false',
      ],
    },
    {
      id: 'long-transactions',
      title: 'Long transactions',
      explanation: "A transaction holds a database connection from the pool and, for writes, row locks until it ends. If a transaction also calls a slow external HTTP API, sends email or processes a huge file, connections run out, other requests wait for locks and deadlocks become more likely.\n\nKeep transactions short: do remote calls and heavy computation outside, then open a short transaction just for the database writes. For large batch jobs, commit in chunks (for example every 500 records) instead of one giant transaction. If you need to react after commit (send email only if the save succeeded), use `@TransactionalEventListener(phase = AFTER_COMMIT)`.",
      example: `// Bad: HTTP call inside the transaction holds a connection for seconds
@Transactional
public void checkout(Long orderId) {
    Order order = orderRepository.findById(orderId).orElseThrow();
    paymentGateway.charge(order);   // slow remote call
    order.markPaid();
}

// Better: remote call outside, short transaction for the write
public void checkout(Long orderId) {
    OrderDto order = orderQueries.get(orderId);
    PaymentResult result = paymentGateway.charge(order);
    orderWriter.markPaid(orderId, result.reference()); // @Transactional, fast
}

@TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
public void onOrderPaid(OrderPaidEvent event) {
    emailService.sendReceipt(event.orderId());
}`,
      interviewPoints: [
        'Long transactions exhaust the connection pool and hold locks',
        'No remote calls inside transactions',
        'Chunked commits for batch work',
        'AFTER_COMMIT listeners for side effects',
      ],
    },
    {
      id: 'programmatic',
      title: 'Programmatic transactions (TransactionTemplate)',
      explanation: "Sometimes you need fine-grained control, for example a transaction around only part of a method, or a loop that commits each chunk separately. `TransactionTemplate` lets you run a lambda inside a transaction without annotations or proxies, which also avoids the self-invocation problem.\n\nIt uses the same transaction manager and supports the same settings (propagation, isolation, timeout, read-only).",
      example: `@Service
public class BulkImporter {
    private final TransactionTemplate tx;
    private final ProductRepository repo;

    public BulkImporter(PlatformTransactionManager tm, ProductRepository repo) {
        this.tx = new TransactionTemplate(tm);
        this.repo = repo;
    }

    public void importAll(List<List<Product>> chunks) {
        for (List<Product> chunk : chunks) {
            tx.executeWithoutResult(status -> repo.saveAll(chunk)); // one commit per chunk
        }
    }
}`,
      interviewPoints: [
        'TransactionTemplate = programmatic alternative',
        'No proxy needed, so no self-invocation issue',
      ],
    },
  ],

  commonMistakes: [
    "Calling a `@Transactional` method from another method in the same class and expecting the annotation to apply.",
    "Putting `@Transactional` on a `private` method, which Spring silently ignores.",
    "Expecting a checked exception to roll back the transaction without setting `rollbackFor`.",
    "Catching an exception inside a transactional method and not rethrowing it, so the transaction commits partial work.",
    "Making slow HTTP calls or sending emails inside a transaction, which holds database connections and locks for too long.",
    "Using `REQUIRES_NEW` heavily without realising each one needs an extra pooled connection, which can deadlock the connection pool.",
    "Importing `jakarta.transaction.Transactional` and then looking for Spring-only options like `readOnly` or `propagation`.",
  ],

  interviewTips: [
    "Start any answer about `@Transactional` by explaining the proxy; self-invocation, private methods and rollback behaviour all follow from it.",
    "Know the default rollback rule by heart: runtime exceptions and errors roll back, checked exceptions commit.",
    "When explaining propagation, use a concrete example like an audit log that must survive a rollback (REQUIRES_NEW).",
    "Mention that the service layer is the transaction boundary and that transactions should be short.",
    "Name the PostgreSQL default isolation (READ COMMITTED) and the anomalies each level prevents.",
  ],

  interviewQuestions: [
    {
      id: 'jpa-transactions-q1',
      question: 'What does @Transactional do in Spring?',
      answer: "`@Transactional` tells Spring to run the method inside a database transaction. Spring wraps the bean in a proxy; when the method is called through the proxy, it begins a transaction (or joins an existing one), runs the method, commits if it returns normally and rolls back if it throws a runtime exception or error.\n\nAll repository calls inside share one connection and persistence context, so they succeed or fail together. You can configure propagation, isolation, timeout, read-only and rollback rules through its attributes.",
      points: [
        'Declarative transaction management via AOP proxy',
        'Commit on success, rollback on RuntimeException/Error',
        'Attributes: propagation, isolation, readOnly, timeout, rollbackFor',
      ],
      difficulty: 'Beginner',
    },
    {
      id: 'jpa-transactions-q2',
      question: 'Does Spring roll back a transaction when a checked exception is thrown?',
      answer: "No, not by default. Spring follows the EJB convention: unchecked exceptions (`RuntimeException` subclasses) and `Error` trigger a rollback, while checked exceptions are treated as expected business outcomes and the transaction commits.\n\nTo roll back on checked exceptions, set `rollbackFor = Exception.class` or name the specific type. Conversely, `noRollbackFor` keeps committing for a given runtime exception. Also remember that an exception you catch and swallow inside the method never reaches the proxy, so it cannot cause a rollback.",
      example: `@Transactional(rollbackFor = Exception.class)
public void process(Path file) throws IOException {
    // any exception, checked or not, rolls back
}`,
      points: [
        'Default rollback: RuntimeException and Error',
        'Checked exceptions commit by default',
        'rollbackFor / noRollbackFor change the rules',
      ],
      difficulty: 'Beginner',
    },
    {
      id: 'jpa-transactions-q3',
      question: 'Why does @Transactional not work when a method calls another method in the same class?',
      answer: "Spring implements `@Transactional` with a proxy that wraps the bean. External callers get the proxy, so their calls are intercepted. But when a method inside the bean calls `this.otherMethod()`, it calls the real object directly and never passes through the proxy, so the transactional settings of `otherMethod` are ignored.\n\nFixes: move the method into a separate Spring bean and inject it, use `TransactionTemplate` for programmatic transactions, or (less clean) inject a lazy self-reference. AspectJ weaving also solves it but is rarely used.",
      example: `@Service
public class ReportService {
    public void generateAll() {
        generate(1L); // not transactional: bypasses proxy
    }

    @Transactional
    public void generate(Long id) { }
}`,
      points: [
        'Proxy-based AOP only intercepts external calls',
        'this.method() skips the proxy',
        'Extract to another bean or use TransactionTemplate',
      ],
      difficulty: 'Intermediate',
    },
    {
      id: 'jpa-transactions-q4',
      question: 'Explain the difference between REQUIRED, REQUIRES_NEW and NESTED propagation.',
      answer: "`REQUIRED` (default) joins the current transaction if one exists, otherwise starts a new one. Everything shares one physical transaction, so any failure rolls back all of it.\n\n`REQUIRES_NEW` suspends the current transaction and starts a completely independent one on a new connection. It commits or rolls back on its own; the outer transaction resumes afterwards. Useful for audit logs or 'record the failure' writes. `NESTED` stays in the same physical transaction but sets a savepoint; if the inner part fails, only work since the savepoint is rolled back, and the outer transaction can continue. Nested requires savepoint support (for example `DataSourceTransactionManager`); `JpaTransactionManager` does not support it with Hibernate by default.",
      points: [
        'REQUIRED: join or create, one physical transaction',
        'REQUIRES_NEW: independent transaction, extra connection',
        'NESTED: savepoint within the same transaction',
        'Other options: SUPPORTS, NOT_SUPPORTED, MANDATORY, NEVER',
      ],
      difficulty: 'Intermediate',
    },
    {
      id: 'jpa-transactions-q5',
      question: 'What are transaction isolation levels and which anomalies do they prevent?',
      answer: "Isolation levels define how concurrent transactions see each other's changes. READ UNCOMMITTED allows dirty reads (seeing uncommitted data). READ COMMITTED prevents dirty reads but allows non-repeatable reads (a row changes between two reads). REPEATABLE READ also prevents non-repeatable reads; the SQL standard still allows phantom reads (new rows appearing in a range), though PostgreSQL's implementation prevents them. SERIALIZABLE prevents all anomalies, making transactions behave as if executed one at a time.\n\nIn Spring, set it with `@Transactional(isolation = Isolation.REPEATABLE_READ)`; `Isolation.DEFAULT` uses the database default (READ COMMITTED in PostgreSQL). Higher levels mean more locking or serialization errors that you must retry.",
      points: [
        'Dirty read, non-repeatable read, phantom read',
        'READ_UNCOMMITTED < READ_COMMITTED < REPEATABLE_READ < SERIALIZABLE',
        'PostgreSQL default: READ COMMITTED',
        'Stronger isolation = more retries/contention',
      ],
      difficulty: 'Intermediate',
    },
    {
      id: 'jpa-transactions-q6',
      question: 'What does readOnly = true do, and should you use it?',
      answer: "`readOnly = true` signals that the transaction only reads data. With JPA/Hibernate, Spring sets the session flush mode to MANUAL and marks it read-only, so Hibernate does not keep dirty-checking snapshots and never flushes changes. The JDBC connection is also flagged read-only, which a routing data source can use to send the query to a read replica.\n\nYes, it is a good practice for query methods: it reduces memory and CPU and documents intent. A common pattern is class-level `@Transactional(readOnly = true)` with method-level `@Transactional` on write methods.",
      points: [
        'Hibernate skips snapshots and flushes',
        'Connection marked read-only (replica routing)',
        'Class-level readOnly, override for writes',
      ],
      difficulty: 'Beginner',
    },
    {
      id: 'jpa-transactions-q7',
      question: 'Why can @Transactional be ignored on a private or final method?',
      answer: "Spring's transaction support is applied by a proxy. A JDK dynamic proxy only implements interface methods, and a CGLIB proxy is a subclass that overrides methods. A subclass cannot override `private` or `final` methods, so the proxy cannot intercept them and the annotation has no effect, without any error.\n\nSince Spring 6, class-based proxies can also intercept `protected` and package-private methods, but public service methods remain the standard. Put `@Transactional` on public methods that are called from other beans.",
      points: [
        'Proxies intercept by overriding or implementing methods',
        'private/final methods cannot be overridden',
        'No warning: it silently runs without a transaction',
      ],
      difficulty: 'Intermediate',
    },
    {
      id: 'jpa-transactions-q8',
      question: 'What is UnexpectedRollbackException and when does it happen?',
      answer: "It happens when an inner method joins the outer transaction (propagation REQUIRED), throws a runtime exception, and the outer method catches that exception and tries to continue. When the inner method's proxy sees the exception, it marks the shared transaction as rollback-only. At the end, the outer method tries to commit, Spring finds the rollback-only flag, rolls back, and throws `UnexpectedRollbackException` to tell you your 'successful' method did not commit.\n\nTo let the inner work fail without affecting the outer work, run it with `REQUIRES_NEW` (or NESTED where supported), or restructure so the exception is not thrown through a transactional boundary.",
      example: `@Transactional
public void placeOrder(Order o) {
    orderRepository.save(o);
    try {
        loyaltyService.addPoints(o); // @Transactional, throws RuntimeException
    } catch (RuntimeException ignored) { }
} // -> UnexpectedRollbackException, order NOT saved`,
      points: [
        'Inner REQUIRED failure marks transaction rollback-only',
        'Catching the exception does not clear the flag',
        'Use REQUIRES_NEW for optional side work',
      ],
      difficulty: 'Advanced',
    },
    {
      id: 'jpa-transactions-q9',
      question: 'Why should transactions be short, and how do you keep them short?',
      answer: "While a transaction is open it holds a connection from the pool (HikariCP defaults to 10) and any row locks it has taken. Long transactions, especially ones that wait for remote HTTP calls or process large files, starve other requests of connections, increase lock waits and deadlocks, and in PostgreSQL delay vacuum cleanup.\n\nKeep them short by doing remote calls and heavy computation outside the transaction, loading only needed data, committing batch work in chunks, using `@TransactionalEventListener(phase = AFTER_COMMIT)` for side effects like email, and setting a `timeout` on transactions that might hang.",
      points: [
        'Transactions hold connections and locks',
        'No remote calls inside a transaction',
        'Chunked commits for batch jobs',
        'AFTER_COMMIT events and timeouts',
      ],
      difficulty: 'Advanced',
    },
    {
      id: 'jpa-transactions-q10',
      question: 'How are transactions related to lazy loading and LazyInitializationException?',
      answer: "In Spring, the JPA persistence context is bound to the transaction. Lazy associations are loaded through that context, so they can only be initialised while the transaction is active. When a `@Transactional` service method returns, the context closes and returned entities become detached; accessing an unloaded lazy field later, for example in the controller or Jackson serialization, throws `LazyInitializationException`.\n\nThe proper fix is to fetch everything the use case needs inside the transaction (JOIN FETCH, `@EntityGraph`) and return DTOs. Open Session In View (`spring.jpa.open-in-view`, enabled by default) extends the context to the whole web request, which hides the error but keeps a connection busy for the entire request and triggers queries from the view layer.",
      points: [
        'Persistence context lives as long as the transaction',
        'Detached entities cannot lazy-load',
        'Fetch inside the service and return DTOs',
        'OSIV hides the problem; many teams disable it',
      ],
      difficulty: 'Advanced',
    },
  ],
}

export default topic
