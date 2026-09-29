const topic = {
  id: 'jpa-hibernate',
  category: 'jpa',
  title: 'Hibernate & Entity Relationships',
  description: "How Hibernate manages entities behind the scenes: relationships, fetching, caching, the N+1 problem and locking.",
  difficulty: 'Advanced',
  overview: "Hibernate is the engine behind Spring Data JPA. Every time you load, change or save an entity, Hibernate decides which SQL to send and when. Most real performance and correctness bugs in JPA applications come from not understanding what Hibernate does automatically.\n\nThe central idea is the persistence context: a per-transaction workspace where Hibernate keeps the entities it has loaded. Think of it like a shopping cart. Items you pick up (load) go into the cart, Hibernate remembers what they looked like, and at checkout (commit) it compares and writes only what changed.\n\nOn top of that come relationships between entities (one-to-many, many-to-many and so on), which decide how tables are joined, and fetching strategies (lazy vs eager), which decide when related data is loaded. Get these wrong and you get the famous N+1 query problem or a LazyInitializationException.\n\nFinally, when many users update the same data at once, you need locking. Optimistic locking with `@Version` and pessimistic locking with `@Lock` are standard interview topics for senior roles.",

  subtopics: [
    {
      id: 'hibernate',
      title: 'Hibernate',
      explanation: "Hibernate ORM is the most widely used JPA implementation and the default in Spring Boot. It translates entity operations into SQL, manages a persistence context per transaction, performs dirty checking, supports lazy loading through proxies and offers first- and second-level caching.\n\nSpring Boot 3 uses Hibernate 6, which works with `jakarta.persistence`. You mostly use it through the JPA `EntityManager` or Spring Data repositories, and can unwrap the native `Session` if you need Hibernate-only features.",
      example: `@PersistenceContext
private EntityManager em;

public void hibernateSpecific() {
    Session session = em.unwrap(Session.class);
    session.setDefaultReadOnly(true);
}`,
      interviewPoints: [
        'Spring Boot 3 ships Hibernate 6',
        'EntityManager (JPA) is backed by Session (Hibernate)',
      ],
    },
    {
      id: 'persistence-context-states',
      title: 'Persistence context and entity states',
      explanation: "The persistence context is a set of managed entities tied to one `EntityManager`, which in Spring normally lives as long as the transaction. Inside it, each database row is represented by at most one Java object.\n\nAn entity can be in four states. Transient (new): created with `new`, not known to Hibernate. Managed (persistent): attached to the persistence context; changes are tracked and saved automatically. Detached: was managed, but the context was closed or cleared; changes are no longer tracked. Removed: scheduled for deletion at flush.",
      example: `@Transactional
public void states() {
    Customer c = new Customer("Asha", "asha@example.com"); // transient
    em.persist(c);                                          // managed
    c.setName("Asha K");                                    // tracked, UPDATE at flush

    em.detach(c);                                           // detached
    c.setName("ignored");                                   // not tracked

    Customer managed = em.merge(c);                         // copy state onto a managed instance
    em.remove(managed);                                     // removed, DELETE at flush
}`,
      interviewPoints: [
        'States: transient, managed, detached, removed',
        'One persistence context per transaction by default in Spring',
        'merge() returns a new managed instance; the argument stays detached',
      ],
    },
    {
      id: 'one-to-one',
      title: 'One-to-One',
      explanation: "A one-to-one relationship means each row links to exactly one row in another table, for example a User and their Profile. The side that has the foreign key column uses `@OneToOne` with `@JoinColumn`.\n\nA simple, efficient option is `@MapsId`, where the child shares the parent's primary key. Note that the non-owning side of a one-to-one cannot be reliably lazy in Hibernate, because Hibernate must query to know whether it is null or not.",
      example: `@Entity
public class User {
    @Id
    @GeneratedValue
    private Long id;

    @OneToOne(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    private Profile profile;
}

@Entity
public class Profile {
    @Id
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @MapsId            // profile.id = user.id, and it is the FK too
    @JoinColumn(name = "user_id")
    private User user;

    private String bio;
}`,
      interviewPoints: [
        '@OneToOne is EAGER by default; set LAZY on the owning side',
        '@MapsId shares the primary key and is the most efficient mapping',
      ],
    },
    {
      id: 'one-to-many-many-to-one',
      title: 'One-to-Many and Many-to-One',
      explanation: "This is the most common relationship: one Order has many OrderItems, and each OrderItem belongs to one Order. In the database, the foreign key `order_id` lives in the `order_items` table.\n\nMap it as a bidirectional relationship: `@ManyToOne` on the child (the owning side, with `@JoinColumn`) and `@OneToMany(mappedBy = ...)` on the parent. Add helper methods on the parent that set both sides so the objects stay in sync. A unidirectional `@OneToMany` without `mappedBy` makes Hibernate use an extra join table or extra UPDATE statements, so avoid it.",
      example: `@Entity
@Table(name = "orders")
public class Order {
    @Id
    @GeneratedValue
    private Long id;

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<OrderItem> items = new ArrayList<>();

    public void addItem(OrderItem item) {
        items.add(item);
        item.setOrder(this);
    }

    public void removeItem(OrderItem item) {
        items.remove(item);
        item.setOrder(null);
    }
}

@Entity
@Table(name = "order_items")
public class OrderItem {
    @Id
    @GeneratedValue
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "order_id")
    private Order order;

    private String sku;
    private int quantity;
}`,
      interviewPoints: [
        '@ManyToOne is the owning side and holds the FK',
        '@ManyToOne is EAGER by default: always set LAZY',
        'Use add/remove helper methods to sync both sides',
      ],
    },
    {
      id: 'many-to-many',
      title: 'Many-to-Many',
      explanation: "A many-to-many relationship, like Students and Courses, needs a join table (`student_course`) holding pairs of foreign keys. JPA maps it with `@ManyToMany` and `@JoinTable` on the owning side and `mappedBy` on the other.\n\nUse a `Set` instead of a `List` (Hibernate handles removals from a `List` bag by deleting and re-inserting all rows). Never use `CascadeType.REMOVE` on many-to-many, because deleting one student would delete shared courses. If the link needs extra columns (like enrollment date), model the join table as its own entity with two `@ManyToOne` relationships.",
      example: `@Entity
public class Student {
    @Id
    @GeneratedValue
    private Long id;

    @ManyToMany
    @JoinTable(name = "student_course",
               joinColumns = @JoinColumn(name = "student_id"),
               inverseJoinColumns = @JoinColumn(name = "course_id"))
    private Set<Course> courses = new HashSet<>();

    public void enroll(Course c) {
        courses.add(c);
        c.getStudents().add(this);
    }
}

@Entity
public class Course {
    @Id
    @GeneratedValue
    private Long id;

    @ManyToMany(mappedBy = "courses")
    private Set<Student> students = new HashSet<>();
}`,
      interviewPoints: [
        'Needs a join table',
        'Prefer Set over List',
        'No CascadeType.REMOVE or ALL on many-to-many',
        'Extra columns on the link -> promote to its own entity',
      ],
    },
    {
      id: 'mapped-by-owning-side',
      title: 'mappedBy and the owning side',
      explanation: "In a bidirectional relationship, only one side controls the foreign key column in the database. That is the owning side. The other side (the inverse side) uses `mappedBy` to point at the field on the owning side.\n\nHibernate only looks at the owning side when writing SQL. If you add an item to `order.getItems()` but never call `item.setOrder(order)`, the foreign key will be null. For `@OneToMany`/`@ManyToOne`, the `@ManyToOne` side is always the owner.",
      example: `// Inverse side: mappedBy names the field in OrderItem
@OneToMany(mappedBy = "order")
private List<OrderItem> items = new ArrayList<>();

// Owning side: this field decides the order_id column value
@ManyToOne(fetch = FetchType.LAZY)
@JoinColumn(name = "order_id")
private Order order;

// Wrong: FK stays null because only the inverse side was set
order.getItems().add(item);

// Right: set the owning side (helper method does both)
order.addItem(item);`,
      interviewPoints: [
        'Owning side = the side with @JoinColumn / the FK',
        'mappedBy goes on the inverse side',
        'Hibernate ignores changes made only on the inverse side',
      ],
    },
    {
      id: 'cascade-type',
      title: 'CascadeType',
      explanation: "Cascading means an operation on a parent is automatically applied to its children. With `cascade = CascadeType.ALL` on `Order.items`, persisting an Order also persists its items, and removing it removes the items.\n\nTypes are `PERSIST`, `MERGE`, `REMOVE`, `REFRESH`, `DETACH` and `ALL`. Cascade from parent to child in a true ownership relationship (an order owns its items). Do not cascade from child to parent (`@ManyToOne`) or across many-to-many links, or you may delete data you did not mean to.",
      example: `@OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
private List<OrderItem> items = new ArrayList<>();

@Transactional
public Order placeOrder() {
    Order order = new Order();
    order.addItem(new OrderItem("SKU-1", 2));
    order.addItem(new OrderItem("SKU-2", 1));
    return orderRepository.save(order); // items saved too thanks to PERSIST cascade
}`,
      interviewPoints: [
        'Cascade parent -> child for ownership relationships only',
        'Never cascade REMOVE on @ManyToOne or @ManyToMany',
        'Cascade is about entity operations; it is not the same as ON DELETE CASCADE in SQL',
      ],
    },
    {
      id: 'orphan-removal',
      title: 'orphanRemoval',
      explanation: "`orphanRemoval = true` deletes a child row when the child is removed from the parent's collection (or the reference is set to null). The child becomes an 'orphan' with no parent, so Hibernate deletes it.\n\nThis is different from `CascadeType.REMOVE`, which only deletes children when the parent itself is deleted. Use orphanRemoval when children cannot exist without their parent, like order items.",
      example: `@Transactional
public void removeLine(Long orderId, Long itemId) {
    Order order = orderRepository.findById(orderId).orElseThrow();
    order.getItems().removeIf(i -> i.getId().equals(itemId));
    // with orphanRemoval = true -> DELETE FROM order_items WHERE id = ?
}`,
      interviewPoints: [
        'orphanRemoval: delete child when removed from the collection',
        'CascadeType.REMOVE: delete children when the parent is deleted',
        'Do not replace the collection with a new one; clear() and addAll() instead',
      ],
    },
    {
      id: 'fetch-type',
      title: 'FetchType, Lazy loading and Eager loading',
      explanation: "FetchType decides when related data is loaded. `LAZY` loads it only when you first access it; Hibernate puts a proxy or a special collection in the field and runs the query on first use. `EAGER` loads it immediately with the parent, every time.\n\nDefaults: `@ManyToOne` and `@OneToOne` are EAGER, `@OneToMany` and `@ManyToMany` are LAZY. Best practice is to make everything LAZY and fetch what each use case needs explicitly with JOIN FETCH or an entity graph. EAGER cannot be turned off per query and often causes extra queries you did not ask for.",
      example: `@ManyToOne(fetch = FetchType.LAZY)       // override the EAGER default
@JoinColumn(name = "customer_id")
private Customer customer;

@OneToMany(mappedBy = "order")            // LAZY by default
private List<OrderItem> items;

@Transactional(readOnly = true)
public void show(Long id) {
    Order o = orderRepository.findById(id).orElseThrow(); // 1 query for order
    o.getCustomer().getName();                            // query for customer now
    o.getItems().size();                                  // query for items now
}`,
      interviewPoints: [
        'Defaults: *ToOne = EAGER, *ToMany = LAZY',
        'Make all associations LAZY and fetch per use case',
        'Lazy loading only works while the persistence context is open',
      ],
    },
    {
      id: 'lazy-initialization-exception',
      title: 'LazyInitializationException',
      explanation: "This exception happens when you access a lazy association after the persistence context is closed, for example in a controller or during JSON serialization after the service transaction has finished. The proxy has no open session to load its data.\n\nFixes: load what you need inside the transaction with JOIN FETCH or `@EntityGraph`, or return a DTO built inside the transaction. Avoid the 'fixes' that hide the problem: switching to EAGER, or `hibernate.enable_lazy_load_no_trans`. Spring Boot enables Open Session In View by default (`spring.jpa.open-in-view=true`), which hides the error but keeps a DB connection for the whole web request; many teams turn it off.",
      example: `// Throws LazyInitializationException in the controller
@GetMapping("/orders/{id}")
public List<String> skus(@PathVariable Long id) {
    Order order = orderService.find(id); // transaction already committed
    return order.getItems().stream().map(OrderItem::getSku).toList(); // boom
}

// Fix: fetch in the query and map to a DTO inside the service
@Query("SELECT o FROM Order o JOIN FETCH o.items WHERE o.id = :id")
Optional<Order> findWithItems(@Param("id") Long id);

// application.yml
// spring.jpa.open-in-view: false`,
      interviewPoints: [
        'Cause: touching a lazy proxy outside an open persistence context',
        'Fix with JOIN FETCH, @EntityGraph or DTOs',
        'EAGER and enable_lazy_load_no_trans are anti-patterns',
        'Open Session In View is on by default; consider disabling it',
      ],
    },
    {
      id: 'dirty-checking',
      title: 'Dirty checking',
      explanation: "When Hibernate loads an entity, it keeps a snapshot of its original values. At flush time (before commit, or before a query that could be affected), it compares each managed entity with its snapshot. Any entity whose fields changed is 'dirty', and Hibernate issues an UPDATE for it.\n\nThis is why you do not need to call `save()` after modifying a loaded entity in a transaction. It also means an accidental setter call in a transaction will be written to the database. `@Transactional(readOnly = true)` lets Hibernate skip snapshots and dirty checking for better performance.",
      example: `@Transactional
public void changeEmail(Long id, String email) {
    Customer c = customerRepository.findById(id).orElseThrow();
    c.setEmail(email);
    // no save() call: at commit Hibernate sees the change and runs
    // UPDATE customers SET email = ? ... WHERE id = ?
}`,
      interviewPoints: [
        'Snapshot compared at flush; changed entities get UPDATEs',
        'Works only for managed entities',
        'readOnly transactions skip dirty checking',
      ],
    },
    {
      id: 'first-level-cache',
      title: 'First-level cache',
      explanation: "The persistence context itself is the first-level cache. Within one transaction, loading the same entity by id twice returns the same Java object and only hits the database once. It is always on and cannot be disabled.\n\nIt is scoped to a single `EntityManager` (usually a single transaction), so it does not help across requests. In long batch jobs it can grow huge, so call `flush()` and `clear()` every few hundred entities.",
      example: `@Transactional
public void sameInstance(Long id) {
    Customer a = customerRepository.findById(id).orElseThrow(); // SELECT
    Customer b = customerRepository.findById(id).orElseThrow(); // no SQL, from cache
    System.out.println(a == b); // true
}`,
      interviewPoints: [
        'Always on, per EntityManager / transaction',
        'Guarantees one object per row inside the context',
        'JPQL queries still hit the DB (but return cached instances)',
      ],
    },
    {
      id: 'second-level-cache',
      title: 'Second-level cache',
      explanation: "The second-level (L2) cache is shared across all sessions in the application. It stores entity data by id so that a `find` in another transaction can skip the database. It is off by default and needs a provider such as Ehcache, Caffeine (via JCache) or Infinispan.\n\nUse it for data that is read often and changes rarely, like countries or product categories. Mark entities with `@Cacheable` (jakarta.persistence) and a Hibernate `@Cache` concurrency strategy. In multi-instance deployments you need a clustered provider or you risk stale data. Many teams prefer Spring's application-level cache instead.",
      example: `# application.yml
spring:
  jpa:
    properties:
      hibernate:
        cache:
          use_second_level_cache: true
          region.factory_class: jcache
      jakarta.persistence.sharedCache.mode: ENABLE_SELECTIVE

// Entity
@Entity
@Cacheable
@org.hibernate.annotations.Cache(usage = CacheConcurrencyStrategy.READ_WRITE)
public class Country {
    @Id
    private String code;
    private String name;
}`,
      interviewPoints: [
        'L1: per transaction, always on. L2: shared, opt-in',
        'Best for read-mostly reference data',
        'Query cache is separate and rarely worth it',
      ],
    },
    {
      id: 'n-plus-one',
      title: 'N+1 problem and fixes (JOIN FETCH, @EntityGraph, batch size)',
      explanation: "The N+1 problem: you run 1 query to load N parents, then Hibernate runs 1 more query per parent to load a lazy association, so N+1 queries in total. With 100 orders that is 101 round trips instead of 1 or 2. It often hides in loops or in JSON serialization.\n\nFixes: JOIN FETCH in JPQL loads parents and children in one query. `@EntityGraph(attributePaths = ...)` does the same declaratively on a repository method. `@BatchSize` or `hibernate.default_batch_fetch_size` loads lazy associations for many parents at once with `WHERE id IN (...)`, turning N queries into N/size. For read-only screens, DTO projections avoid the problem entirely. Detect it by enabling SQL logging or Hibernate statistics in tests.",
      example: `// N+1: 1 query for orders + 1 per order for customer
List<Order> orders = orderRepository.findAll();
orders.forEach(o -> System.out.println(o.getCustomer().getName()));

// Fix 1: JOIN FETCH
@Query("SELECT o FROM Order o JOIN FETCH o.customer WHERE o.status = :status")
List<Order> findWithCustomer(@Param("status") OrderStatus status);

// Fix 2: EntityGraph
@EntityGraph(attributePaths = {"customer", "items"})
List<Order> findByStatus(OrderStatus status);

// Fix 3: batch fetching (application.yml)
// spring.jpa.properties.hibernate.default_batch_fetch_size: 50`,
      interviewPoints: [
        '1 query for parents + N for children',
        'JOIN FETCH / @EntityGraph: one query',
        'Batch size: IN queries in chunks; good for collections and paging',
        'Do not JOIN FETCH a collection with pagination: Hibernate paginates in memory',
      ],
    },
    {
      id: 'optimistic-locking',
      title: 'Optimistic locking (@Version)',
      explanation: "Optimistic locking assumes conflicts are rare. Add a `@Version` field; Hibernate includes it in every UPDATE: `UPDATE ... SET ..., version = 6 WHERE id = ? AND version = 5`. If another transaction updated the row first, zero rows match and Hibernate throws `OptimisticLockException` (Spring wraps it as `ObjectOptimisticLockingFailureException`).\n\nNo database locks are held, so it scales well. It prevents the 'lost update' problem where two users overwrite each other. Handle the exception by retrying or returning HTTP 409 Conflict to the client.",
      example: `@Entity
public class Account {
    @Id
    @GeneratedValue
    private Long id;

    private BigDecimal balance;

    @Version
    private Long version;
}

@Retryable(retryFor = ObjectOptimisticLockingFailureException.class, maxAttempts = 3)
@Transactional
public void deposit(Long id, BigDecimal amount) {
    Account a = accountRepository.findById(id).orElseThrow();
    a.setBalance(a.getBalance().add(amount));
}`,
      interviewPoints: [
        '@Version is checked and incremented on every update',
        'Conflict -> OptimisticLockException, no DB lock held',
        'Best when conflicts are rare; retry or return 409',
      ],
    },
    {
      id: 'pessimistic-locking',
      title: 'Pessimistic locking (@Lock)',
      explanation: "Pessimistic locking assumes conflicts are likely and locks the row in the database when reading it, usually with `SELECT ... FOR UPDATE`. Other transactions that want to lock or update the same row wait until the first one commits.\n\nUse `@Lock(LockModeType.PESSIMISTIC_WRITE)` on a repository method. It guarantees correctness for hot rows (stock counters, seat booking) but reduces concurrency and can cause deadlocks, so keep these transactions short and set a lock timeout.",
      example: `public interface ProductRepository extends JpaRepository<Product, Long> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @QueryHints(@QueryHint(name = "jakarta.persistence.lock.timeout", value = "3000"))
    @Query("SELECT p FROM Product p WHERE p.id = :id")
    Optional<Product> findForUpdate(@Param("id") Long id);
}

@Transactional
public void reserve(Long productId, int qty) {
    Product p = productRepository.findForUpdate(productId).orElseThrow(); // SELECT ... FOR UPDATE
    if (p.getStock() < qty) {
        throw new OutOfStockException(productId);
    }
    p.setStock(p.getStock() - qty);
}`,
      interviewPoints: [
        'PESSIMISTIC_WRITE -> SELECT ... FOR UPDATE',
        'Must run inside a transaction; lock released at commit',
        'Safer for high contention but slower; watch for deadlocks',
      ],
    },
  ],

  commonMistakes: [
    "Leaving `@ManyToOne` and `@OneToOne` at their default EAGER fetch type, which silently adds extra queries everywhere.",
    "Setting only the inverse side of a bidirectional relationship (`order.getItems().add(item)`) and wondering why the foreign key is null.",
    "Using `CascadeType.ALL` or `REMOVE` on `@ManyToMany` or `@ManyToOne`, which can delete shared parent data.",
    "Fixing `LazyInitializationException` by switching to EAGER instead of fetching the data needed for that use case.",
    "Using `@Data` from Lombok or including lazy collections in `equals`, `hashCode` or `toString`, which triggers lazy loading and infinite recursion.",
    "Combining JOIN FETCH on a collection with pagination, which makes Hibernate load everything and paginate in memory (warning HHH90003004).",
    "Not noticing N+1 queries because SQL logging is off during development.",
  ],

  interviewTips: [
    "When asked about N+1, describe the cause, show how to detect it (SQL logs, Hibernate statistics) and list at least two fixes with trade-offs.",
    "Always mention that you make associations LAZY by default and fetch per use case; it is the answer most interviewers look for.",
    "Explain owning side vs mappedBy with a concrete example (Order and OrderItem, FK in order_items).",
    "For locking questions, compare optimistic and pessimistic in terms of contention, scalability and how you handle failures (retry or 409).",
    "Draw the entity lifecycle (transient, managed, detached, removed) if you have a whiteboard; it makes dirty checking and merge easy to explain.",
  ],

  interviewQuestions: [
    {
      id: 'jpa-hibernate-q1',
      question: 'What is the persistence context, and what are the entity states in JPA?',
      answer: "The persistence context is the set of entity instances managed by an `EntityManager`. In Spring it usually lasts for one transaction. It guarantees that each database row is represented by one object, tracks changes for dirty checking, and acts as the first-level cache.\n\nEntity states: transient (new object, not associated with the context), managed (in the context, changes are tracked and flushed), detached (was managed, but the context closed or it was evicted, so changes are ignored), and removed (scheduled for deletion at flush).",
      points: [
        'Persistence context = unit of work + first-level cache',
        'Transient, managed, detached, removed',
        'persist/merge/detach/remove move entities between states',
      ],
      difficulty: 'Intermediate',
    },
    {
      id: 'jpa-hibernate-q2',
      question: 'What is the difference between FetchType.LAZY and FetchType.EAGER? What are the defaults?',
      answer: "LAZY loads an association only when it is first accessed, using a proxy or a lazy collection. EAGER loads it immediately together with the owning entity, every time the entity is loaded.\n\nDefaults are EAGER for `@ManyToOne` and `@OneToOne`, and LAZY for `@OneToMany` and `@ManyToMany`. The recommended approach is to declare everything LAZY and fetch what each query needs with JOIN FETCH or entity graphs, because EAGER cannot be switched off per query and often causes unwanted queries.",
      example: `@ManyToOne(fetch = FetchType.LAZY)
@JoinColumn(name = "customer_id")
private Customer customer;`,
      points: [
        'LAZY = on first access, EAGER = always with the parent',
        '*ToOne default EAGER, *ToMany default LAZY',
        'Prefer LAZY everywhere and fetch explicitly',
      ],
      difficulty: 'Beginner',
    },
    {
      id: 'jpa-hibernate-q3',
      question: 'What is the N+1 select problem and how do you fix it?',
      answer: "It happens when you load a list of N entities with one query and then access a lazy association on each, causing Hibernate to run one extra query per entity: N+1 queries in total. It kills performance as data grows.\n\nFixes: use JOIN FETCH in a JPQL query or `@EntityGraph` on a repository method to load the association in the same query; configure `@BatchSize` or `hibernate.default_batch_fetch_size` so lazy associations load in batches with IN clauses; or use DTO projections that select exactly the needed columns. Detect it with SQL logging, Hibernate statistics or tests that assert query counts.",
      example: `@EntityGraph(attributePaths = "customer")
List<Order> findByStatus(OrderStatus status);

@Query("SELECT DISTINCT o FROM Order o JOIN FETCH o.items WHERE o.status = :s")
List<Order> findWithItems(@Param("s") OrderStatus s);`,
      points: [
        '1 query + N lazy loads',
        'JOIN FETCH / @EntityGraph',
        'Batch fetching with IN queries',
        'DTO projections for read-only views',
      ],
      difficulty: 'Intermediate',
    },
    {
      id: 'jpa-hibernate-q4',
      question: 'What causes LazyInitializationException and how should you solve it?',
      answer: "It is thrown when code accesses a lazy association (a proxy or lazy collection) after the persistence context that loaded the entity has been closed, typically in a controller or during JSON serialization after the `@Transactional` service method returned.\n\nGood fixes: fetch the association inside the transaction using JOIN FETCH or `@EntityGraph`, or map the entity to a DTO inside the service while the transaction is open. Bad fixes: switching to EAGER, enabling `hibernate.enable_lazy_load_no_trans`, or relying on Open Session In View, which keeps a database connection open for the entire HTTP request.",
      points: [
        'Lazy proxy accessed outside an open session',
        'Fetch what you need inside the transaction',
        'Return DTOs from the service layer',
        'Avoid EAGER, lazy_load_no_trans and relying on OSIV',
      ],
      difficulty: 'Intermediate',
    },
    {
      id: 'jpa-hibernate-q5',
      question: 'What is the owning side of a relationship and what does mappedBy do?',
      answer: "In a bidirectional relationship, the owning side is the one that controls the foreign key column; Hibernate only reads the owning side when generating INSERT and UPDATE statements. The inverse side declares `mappedBy` with the name of the field on the owning side, which tells JPA that this side is just a mirror.\n\nFor one-to-many, the `@ManyToOne` side always owns the relationship. If you only update the inverse collection, nothing changes in the database, so use helper methods that set both sides.",
      example: `// Inverse side
@OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
private List<OrderItem> items = new ArrayList<>();

public void addItem(OrderItem item) {
    items.add(item);
    item.setOrder(this); // owning side
}`,
      points: [
        'Owning side has the FK / @JoinColumn',
        'mappedBy marks the inverse side',
        'Keep both sides in sync with helper methods',
      ],
      difficulty: 'Intermediate',
    },
    {
      id: 'jpa-hibernate-q6',
      question: 'What is the difference between CascadeType.REMOVE and orphanRemoval?',
      answer: "`CascadeType.REMOVE` deletes the children when the parent entity itself is deleted. `orphanRemoval = true` additionally deletes a child when it is removed from the parent's collection or its reference is set to null, even though the parent still exists.\n\nUse orphanRemoval for children whose life depends entirely on the parent, such as order items or address lines. Both should only be used on parent-to-child ownership relationships, never on `@ManyToMany` or `@ManyToOne`.",
      points: [
        'REMOVE: parent deleted -> children deleted',
        'orphanRemoval: child removed from collection -> child deleted',
        'Only for true ownership (composition)',
      ],
      difficulty: 'Beginner',
    },
    {
      id: 'jpa-hibernate-q7',
      question: 'How does dirty checking work in Hibernate?',
      answer: "When Hibernate loads an entity into the persistence context, it stores a snapshot of its state. At flush time (before commit, before certain queries, or on an explicit `flush()`), it compares each managed entity with its snapshot and generates UPDATE statements for those that changed.\n\nThis means that inside a transaction you can modify a loaded entity and it is saved automatically without calling `save()`. Detached entities are not dirty-checked. Read-only transactions let Hibernate skip snapshots, saving memory and CPU.",
      example: `@Transactional
public void activate(Long id) {
    User u = userRepository.findById(id).orElseThrow();
    u.setActive(true); // UPDATE issued at commit automatically
}`,
      points: [
        'Snapshot + comparison at flush',
        'Only managed entities are checked',
        'No save() needed for loaded entities in a transaction',
        'readOnly = true skips dirty checking',
      ],
      difficulty: 'Beginner',
    },
    {
      id: 'jpa-hibernate-q8',
      question: 'What is the difference between the first-level and second-level cache in Hibernate?',
      answer: "The first-level cache is the persistence context itself. It is always enabled and scoped to one `EntityManager`, typically one transaction. Loading the same entity by id twice in a transaction returns the same object with one SQL query.\n\nThe second-level cache is optional, shared across all sessions in the application (the `SessionFactory`), and requires a provider such as Ehcache, Caffeine via JCache or Infinispan. It suits read-mostly reference data. It adds complexity: you must choose a concurrency strategy, and in a cluster you need a distributed cache or accept stale data.",
      points: [
        'L1: per session, mandatory, same object identity',
        'L2: per application, opt-in, stores dehydrated entity data',
        'Use L2 for read-heavy, rarely changing entities',
      ],
      difficulty: 'Intermediate',
    },
    {
      id: 'jpa-hibernate-q9',
      question: 'Explain optimistic locking with @Version. When would you use it?',
      answer: "You add a `@Version` numeric or timestamp field to the entity. On every update Hibernate adds `AND version = ?` to the WHERE clause and increments the version. If another transaction changed the row in between, no rows are updated and Hibernate throws `OptimisticLockException` (in Spring, `ObjectOptimisticLockingFailureException`).\n\nIt holds no database locks, so it scales well, and it prevents lost updates. It fits cases where conflicts are rare, such as users editing profiles or admin screens. On conflict you retry the operation or return HTTP 409 so the user can reload.",
      example: `UPDATE account SET balance = ?, version = 8 WHERE id = ? AND version = 7`,
      points: [
        'Version checked and bumped on each UPDATE',
        'No DB locks; fails fast on conflict',
        'Handle with retry or 409 Conflict',
        'Also works across HTTP requests if the client sends the version back',
      ],
      difficulty: 'Advanced',
    },
    {
      id: 'jpa-hibernate-q10',
      question: 'Compare optimistic and pessimistic locking.',
      answer: "Optimistic locking (`@Version`) lets transactions proceed without locks and detects conflicts at update time. It is cheap and scalable but some transactions fail and must retry, which is fine when conflicts are rare.\n\nPessimistic locking (`@Lock(LockModeType.PESSIMISTIC_WRITE)`) locks the row with `SELECT ... FOR UPDATE` when reading, so other writers wait. It prevents conflicts up front and suits hot rows with frequent contention, like inventory counters or seat booking, but reduces throughput, holds connections longer and can cause deadlocks. Keep pessimistic transactions short and set a lock timeout.",
      example: `@Lock(LockModeType.PESSIMISTIC_WRITE)
@Query("SELECT s FROM Seat s WHERE s.id = :id")
Optional<Seat> lockSeat(@Param("id") Long id);`,
      points: [
        'Optimistic: detect conflicts, low contention',
        'Pessimistic: prevent conflicts, high contention',
        'Pessimistic needs a transaction and a timeout',
        'Deadlock risk with pessimistic locks',
      ],
      difficulty: 'Advanced',
    },
    {
      id: 'jpa-hibernate-q11',
      question: 'Why is JOIN FETCH on a collection combined with pagination a problem, and how do you solve it?',
      answer: "When you JOIN FETCH a one-to-many collection, the SQL result has one row per child, so the database cannot apply LIMIT/OFFSET to parents correctly. Hibernate 6 therefore loads all matching rows into memory and paginates there, logging warning HHH90003004 (or failing if `hibernate.query.fail_on_pagination_over_collection_fetch` is set). With big tables this can exhaust memory.\n\nSolutions: page over parent ids first, then fetch those parents with their collections in a second query; or skip the fetch join and rely on `default_batch_fetch_size` so collections load in IN batches; or use DTO projections. Fetch joins on `@ManyToOne` are fine with pagination because they do not multiply rows.",
      example: `@Query("SELECT o.id FROM Order o WHERE o.status = :s")
Page<Long> findIds(@Param("s") OrderStatus s, Pageable pageable);

@Query("SELECT DISTINCT o FROM Order o JOIN FETCH o.items WHERE o.id IN :ids")
List<Order> findWithItems(@Param("ids") List<Long> ids);`,
      points: [
        'Collection fetch joins multiply rows',
        'Hibernate paginates in memory (HHH90003004)',
        'Two-query approach: ids page, then fetch',
        'Batch fetching is a simple alternative',
      ],
      difficulty: 'Advanced',
    },
    {
      id: 'jpa-hibernate-q12',
      question: 'How should you implement equals() and hashCode() for JPA entities?',
      answer: "Entities have a generated id that is null before persist, and Hibernate may give you proxies, so default Lombok `@Data` or all-fields equality breaks things: an entity's hash changes after save and it gets lost in a `HashSet`, and lazy fields may trigger loading or infinite recursion.\n\nCommon safe approaches: use a natural business key that never changes (like an ISBN or email) if you have one; or compare by id only when it is non-null and return a constant `hashCode()` from the class, so the hash stays stable across the entity's lifecycle. Use `instanceof` checks or Hibernate's class resolution rather than `getClass()` to handle proxies, and exclude associations from `toString`.",
      example: `@Override
public boolean equals(Object o) {
    if (this == o) return true;
    if (!(o instanceof Product other)) return false;
    return id != null && id.equals(other.getId());
}

@Override
public int hashCode() {
    return Product.class.hashCode(); // constant, stable before and after persist, same for proxies
}`,
      points: [
        'Avoid Lombok @Data / @EqualsAndHashCode on entities',
        'Id-based equality with a constant hashCode, or a natural key',
        'Use getters and instanceof so proxies work',
        'Never include lazy associations',
      ],
      difficulty: 'Advanced',
    },
  ],
}

export default topic
