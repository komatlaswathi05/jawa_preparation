const topic = {
  id: 'jpa-spring-data',
  category: 'jpa',
  title: 'Spring Data JPA',
  description: "Map Java classes to database tables and read or write data with repositories, derived queries, JPQL, paging and auditing, without writing JDBC code.",
  difficulty: 'Intermediate',
  overview: "Almost every backend stores data in a relational database such as PostgreSQL. Talking to it with plain JDBC means writing SQL strings, opening connections and copying each column into a Java object by hand. That is slow to write and easy to get wrong.\n\nORM (Object-Relational Mapping) solves this. You describe how a Java class maps to a table, and a library turns objects into rows and rows back into objects. JPA (Jakarta Persistence API) is the standard Java specification for ORM, Hibernate is the most popular library that implements it, and Spring Data JPA sits on top and writes the repository code for you.\n\nThink of it like a translator at a meeting. You speak Java (objects, fields, methods), the database speaks SQL (tables, columns, rows). JPA is the rulebook for translation, Hibernate is the translator doing the work, and Spring Data JPA is the assistant who already knows the common phrases, so you only say `findByEmail` and it knows the SQL.\n\nIn interviews you are expected to explain these layers, map a simple entity, use repositories and queries, page through results, and know how database schema changes are managed with Flyway or Liquibase.",

  subtopics: [
    {
      id: 'orm',
      title: 'ORM (Object-Relational Mapping)',
      explanation: "ORM is a technique that maps Java classes to database tables, fields to columns and object references to foreign keys. Instead of writing `INSERT` statements and reading a `ResultSet` by hand, you save and load objects.\n\nThe ORM handles the 'impedance mismatch' between the object world (inheritance, references, collections) and the relational world (tables, rows, joins). You still need to understand SQL, because the ORM generates SQL for you and bad mappings produce bad SQL.",
      example: `// Without ORM (plain JDBC)
PreparedStatement ps = conn.prepareStatement("SELECT id, name FROM users WHERE id = ?");
ps.setLong(1, 42L);
ResultSet rs = ps.executeQuery();
User u = null;
if (rs.next()) {
    u = new User(rs.getLong("id"), rs.getString("name"));
}

// With an ORM (Spring Data JPA)
User user = userRepository.findById(42L).orElseThrow();`,
      interviewPoints: [
        'ORM maps classes to tables and objects to rows',
        'It removes boilerplate but does not remove the need to understand SQL',
      ],
    },
    {
      id: 'jpa',
      title: 'JPA (Jakarta Persistence API)',
      explanation: "JPA is a specification: a set of interfaces and annotations (`@Entity`, `@Id`, `EntityManager`, JPQL) that describe how ORM should work in Java. It has no working code of its own.\n\nSince Spring Boot 3, the package is `jakarta.persistence` (it used to be `javax.persistence`). Because your code depends on the standard API, you could in theory swap the provider without rewriting your entities.",
      example: `import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;

@Repository
public class UserDao {

    @PersistenceContext
    private EntityManager em;

    public User find(Long id) {
        return em.find(User.class, id);
    }

    public void save(User user) {
        em.persist(user);
    }
}`,
      interviewPoints: [
        'JPA is a specification, not an implementation',
        'Spring Boot 3 uses jakarta.persistence, not javax.persistence',
        'EntityManager is the core JPA interface for working with entities',
      ],
    },
    {
      id: 'hibernate-provider',
      title: 'Hibernate as the JPA provider',
      explanation: "Hibernate is the library that actually implements JPA. It generates SQL, tracks changes to your objects and manages caching. When you add `spring-boot-starter-data-jpa`, Spring Boot pulls in Hibernate 6 and configures it automatically.\n\nHibernate also offers extra features beyond JPA (for example `@BatchSize`, extra annotations and its own `Session` API), but most application code should stick to standard JPA annotations.",
      example: `# application.yml
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/shop
    username: shop
    password: secret
  jpa:
    hibernate:
      ddl-auto: validate   # never 'update' or 'create' in production
    show-sql: false
    properties:
      hibernate:
        format_sql: true`,
      interviewPoints: [
        'JPA = spec, Hibernate = implementation (other providers: EclipseLink)',
        'ddl-auto=validate or none in production; use migrations to change the schema',
      ],
    },
    {
      id: 'spring-data-jpa',
      title: 'Spring Data JPA',
      explanation: "Spring Data JPA is a Spring project on top of JPA. You declare an interface that extends `JpaRepository`, and Spring generates the implementation at startup. You get CRUD methods, paging, sorting and query generation from method names for free.\n\nSo the stack is: your code, then Spring Data JPA (repositories), then JPA (API), then Hibernate (implementation), then JDBC, then the database.",
      example: `<!-- pom.xml -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-data-jpa</artifactId>
</dependency>
<dependency>
    <groupId>org.postgresql</groupId>
    <artifactId>postgresql</artifactId>
    <scope>runtime</scope>
</dependency>`,
      interviewPoints: [
        'Spring Data JPA generates repository implementations from interfaces',
        'It still uses Hibernate underneath via the EntityManager',
      ],
    },
    {
      id: 'entity-table',
      title: '@Entity and @Table',
      explanation: "`@Entity` marks a class as a JPA entity: a Java object whose instances are stored as rows in a table. An entity needs a no-argument constructor (can be `protected`) and a primary key field marked with `@Id`.\n\n`@Table` is optional and lets you choose the table name, schema, and add unique constraints or indexes. Without it, the table name is derived from the class name.",
      example: `import jakarta.persistence.*;

@Entity
@Table(name = "customers",
       uniqueConstraints = @UniqueConstraint(columnNames = "email"))
public class Customer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;
    private String email;

    protected Customer() { } // required by JPA

    public Customer(String name, String email) {
        this.name = name;
        this.email = email;
    }

    // getters and setters
}`,
      interviewPoints: [
        'Entities need a no-arg constructor and an @Id',
        'Do not make entities final: Hibernate creates proxy subclasses for lazy loading',
        'Java records cannot be entities (they are final and immutable)',
      ],
    },
    {
      id: 'id-generated-value',
      title: '@Id and @GeneratedValue',
      explanation: "`@Id` marks the primary key. `@GeneratedValue` tells JPA the database or Hibernate should create the value.\n\nThe main strategies are `IDENTITY` (database auto-increment column, like PostgreSQL `GENERATED ... AS IDENTITY`), `SEQUENCE` (a database sequence, the best choice for PostgreSQL because Hibernate can batch inserts), `UUID` (random UUIDs) and `AUTO` (let the provider decide). With `IDENTITY`, Hibernate must run the INSERT immediately to learn the id, which disables JDBC insert batching.",
      example: `@Entity
public class Order {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "order_seq")
    @SequenceGenerator(name = "order_seq", sequenceName = "order_seq", allocationSize = 50)
    private Long id;
}

@Entity
public class ApiKey {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
}`,
      interviewPoints: [
        'IDENTITY is simple but prevents insert batching',
        'SEQUENCE with allocationSize lets Hibernate pre-fetch ids and batch inserts',
        'Use wrapper types (Long) for ids so null means not yet saved',
      ],
    },
    {
      id: 'column',
      title: '@Column and other field mappings',
      explanation: "`@Column` customises how a field maps to a column: its name, whether it can be null, its length, and whether it is unique or updatable. Fields without `@Column` are still mapped using default names.\n\nOther useful mappings: `@Enumerated(EnumType.STRING)` stores enums as text (safer than the default ordinal number), `@Transient` excludes a field from the table, and `@Lob` is for large text or binary data. Note that `nullable` and `length` only affect generated DDL; use Bean Validation (`@NotNull`, `@Size`) for runtime checks.",
      example: `@Entity
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "product_name", nullable = false, length = 120)
    private String name;

    @Column(precision = 10, scale = 2)
    private BigDecimal price;

    @Enumerated(EnumType.STRING)
    private ProductStatus status;

    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @Transient
    private boolean selected; // not stored
}`,
      interviewPoints: [
        'Always use EnumType.STRING; ORDINAL breaks if you reorder the enum',
        'Use BigDecimal for money, never double',
      ],
    },
    {
      id: 'crud-vs-jpa-repository',
      title: 'CrudRepository vs JpaRepository',
      explanation: "Spring Data has a hierarchy of repository interfaces. `CrudRepository` gives basic create, read, update, delete methods. `ListCrudRepository` returns `List` instead of `Iterable`. `PagingAndSortingRepository` adds paging and sorting.\n\n`JpaRepository` extends all of these and adds JPA-specific methods such as `flush()`, `saveAndFlush()`, `deleteAllInBatch()` and `getReferenceById()`. In a JPA project, `JpaRepository` is the usual choice.",
      example: `public interface CustomerRepository extends JpaRepository<Customer, Long> {
    // first type = entity, second type = type of the @Id
}

// A smaller API if you want to expose less
public interface TagRepository extends CrudRepository<Tag, Long> {
}`,
      interviewPoints: [
        'Hierarchy: Repository -> CrudRepository -> PagingAndSortingRepository -> JpaRepository',
        'JpaRepository returns List and adds flush/batch methods',
        'No @Repository annotation needed on Spring Data interfaces',
      ],
    },
    {
      id: 'crud-methods',
      title: 'save(), findById(), findAll(), deleteById()',
      explanation: "These are the everyday repository methods. `save(entity)` inserts a new entity or updates an existing one (it calls `persist` if the entity is new, otherwise `merge`) and returns the saved instance. `findById(id)` returns an `Optional`, so you must handle the not-found case. `findAll()` loads every row, which is dangerous on large tables, so prefer paging. `deleteById(id)` loads the entity and removes it.\n\nInside a `@Transactional` method you usually do not need to call `save()` after changing a loaded entity, because Hibernate's dirty checking writes changes automatically at commit.",
      example: `@Service
public class CustomerService {

    private final CustomerRepository repo;

    public CustomerService(CustomerRepository repo) {
        this.repo = repo;
    }

    public Customer create(String name, String email) {
        return repo.save(new Customer(name, email));
    }

    public Customer get(Long id) {
        return repo.findById(id)
                .orElseThrow(() -> new CustomerNotFoundException(id));
    }

    @Transactional
    public void rename(Long id, String newName) {
        Customer c = get(id);
        c.setName(newName); // no save() needed: dirty checking
    }

    public void delete(Long id) {
        repo.deleteById(id);
    }
}`,
      interviewPoints: [
        'save() both inserts and updates; always use the returned instance',
        'findById returns Optional; getReferenceById returns a lazy proxy without hitting the DB',
        'Avoid findAll() on big tables',
      ],
    },
    {
      id: 'derived-queries',
      title: 'Derived queries',
      explanation: "Spring Data can build a query just from a method name. It parses names like `findByEmail`, `findByStatusAndCreatedAtAfter` or `countByCity` and generates the JPQL for you at startup. If a property name is misspelled, the application fails to start, which is a nice safety net.\n\nKeywords include `And`, `Or`, `Between`, `LessThan`, `GreaterThan`, `Like`, `Containing`, `In`, `IsNull`, `OrderBy`, `Top`/`First`, `existsBy`, `countBy` and `deleteBy`. For long or complex conditions, switch to `@Query` because method names become unreadable.",
      example: `public interface CustomerRepository extends JpaRepository<Customer, Long> {

    Optional<Customer> findByEmail(String email);

    List<Customer> findByCityAndActiveTrue(String city);

    List<Customer> findByNameContainingIgnoreCase(String part);

    List<Customer> findTop5ByOrderByCreatedAtDesc();

    boolean existsByEmail(String email);

    long countByCity(String city);
}`,
      interviewPoints: [
        'Method names are validated at startup',
        'Great for simple queries; use @Query when the name gets long',
      ],
    },
    {
      id: 'jpql-query',
      title: 'JPQL and @Query',
      explanation: "JPQL (Jakarta Persistence Query Language) looks like SQL but works with entity class names and field names, not table and column names. Hibernate translates it into the SQL dialect of your database.\n\nWith `@Query` you write JPQL directly on a repository method. Use named parameters (`:email` with `@Param`) so values are bound safely, which prevents SQL injection. Never build queries by concatenating user input.",
      example: `public interface OrderRepository extends JpaRepository<Order, Long> {

    @Query("SELECT o FROM Order o WHERE o.customer.id = :customerId AND o.total > :min")
    List<Order> findBigOrders(@Param("customerId") Long customerId,
                              @Param("min") BigDecimal min);

    @Query("SELECT o FROM Order o JOIN FETCH o.items WHERE o.id = :id")
    Optional<Order> findWithItems(@Param("id") Long id);
}`,
      interviewPoints: [
        'JPQL uses entity and field names; SQL uses table and column names',
        'Parameters are bound, not concatenated, so JPQL is safe from SQL injection',
        'JOIN FETCH in JPQL loads associations in the same query',
      ],
    },
    {
      id: 'native-queries',
      title: 'Native queries',
      explanation: "A native query is plain SQL for your specific database. You mark it with `nativeQuery = true`. Use it when you need database-specific features JPQL does not support, like PostgreSQL window functions, `ON CONFLICT`, JSONB operators or full-text search.\n\nThe trade-off is portability: native SQL is tied to one database and refers to table and column names, so renaming a field in Java will not update it.",
      example: `public interface ProductRepository extends JpaRepository<Product, Long> {

    @Query(value = """
        SELECT * FROM product
        WHERE to_tsvector('english', product_name) @@ plainto_tsquery('english', :term)
        LIMIT 20
        """, nativeQuery = true)
    List<Product> search(@Param("term") String term);
}`,
      interviewPoints: [
        'nativeQuery = true runs raw SQL',
        'Use for DB-specific features; you lose portability and compile-time field checks',
      ],
    },
    {
      id: 'modifying',
      title: '@Modifying queries',
      explanation: "By default `@Query` is expected to be a SELECT. For UPDATE or DELETE statements, add `@Modifying` and run it inside a transaction. The method returns the number of rows affected.\n\nBulk updates go straight to the database and bypass the persistence context, so entities already loaded in memory become stale. Use `@Modifying(clearAutomatically = true)` to clear the persistence context afterwards, and `flushAutomatically = true` to flush pending changes first.",
      example: `public interface CustomerRepository extends JpaRepository<Customer, Long> {

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Transactional
    @Query("UPDATE Customer c SET c.active = false WHERE c.lastLogin < :cutoff")
    int deactivateInactive(@Param("cutoff") Instant cutoff);
}`,
      interviewPoints: [
        '@Modifying is required for UPDATE/DELETE with @Query',
        'Needs a transaction',
        'Bulk operations skip dirty checking, callbacks and the first-level cache',
      ],
    },
    {
      id: 'pagination-sorting',
      title: 'Pagination and Sorting',
      explanation: "Loading thousands of rows at once is slow and uses lots of memory. Pagination loads one page at a time. You pass a `Pageable` (page number, page size, sort) to a repository method. Page numbers start at 0.\n\nReturning `Page<T>` also runs a COUNT query so you know the total number of pages. If you do not need the total (for example infinite scroll), return `Slice<T>` which skips the count and is cheaper. `Sort` can be passed on its own for sorted, unpaged results.",
      example: `public interface ProductRepository extends JpaRepository<Product, Long> {
    Page<Product> findByCategory(String category, Pageable pageable);
    Slice<Product> findByActiveTrue(Pageable pageable);
    List<Product> findByPriceLessThan(BigDecimal max, Sort sort);
}

// In a service
Pageable pageable = PageRequest.of(0, 20, Sort.by("price").ascending());
Page<Product> page = productRepository.findByCategory("books", pageable);
page.getContent();       // the 20 products
page.getTotalElements(); // total matching rows
page.getTotalPages();

// In a controller: GET /products?page=0&size=20&sort=price,asc
@GetMapping("/products")
public Page<Product> list(Pageable pageable) {
    return productRepository.findAll(pageable);
}`,
      interviewPoints: [
        'Pages are zero-based',
        'Page runs an extra COUNT query; Slice does not',
        'Always cap the page size a client can request',
        'For very deep pages, keyset (cursor) pagination beats OFFSET',
      ],
    },
    {
      id: 'projections',
      title: 'Projections',
      explanation: "Often you only need a few columns, not the whole entity. A projection lets a repository return a smaller type. An interface projection declares getters for the fields you want. A DTO (class or record) projection uses a constructor.\n\nProjections make queries faster (fewer columns), avoid loading associations, and the results are not managed entities, so there is no dirty-checking overhead. They are ideal for read-only list screens and API responses.",
      example: `// Interface projection
public interface CustomerSummary {
    Long getId();
    String getName();
}

// Record (DTO) projection
public record CustomerDto(Long id, String name, String email) { }

public interface CustomerRepository extends JpaRepository<Customer, Long> {

    List<CustomerSummary> findByCity(String city);

    List<CustomerDto> findByActiveTrue(); // Spring Data maps to the record constructor

    @Query("SELECT new com.example.shop.CustomerDto(c.id, c.name, c.email) FROM Customer c WHERE c.city = :city")
    List<CustomerDto> findDtosByCity(@Param("city") String city);
}`,
      interviewPoints: [
        'Projections select only needed columns',
        'Results are read-only DTOs, not managed entities',
        'JPQL constructor expressions need the fully qualified class name',
      ],
    },
    {
      id: 'auditing',
      title: 'Auditing (@CreatedDate, @LastModifiedDate, @EnableJpaAuditing)',
      explanation: "Auditing fills in fields like 'created at', 'updated at', 'created by' automatically. Turn it on with `@EnableJpaAuditing` on a configuration class, add `@EntityListeners(AuditingEntityListener.class)` to the entity (often via a shared `@MappedSuperclass`), and annotate fields with `@CreatedDate` and `@LastModifiedDate`.\n\nFor `@CreatedBy` and `@LastModifiedBy` you also provide an `AuditorAware` bean that returns the current user, usually from Spring Security.",
      example: `@Configuration
@EnableJpaAuditing
public class JpaConfig {

    @Bean
    public AuditorAware<String> auditorAware() {
        return () -> Optional.ofNullable(SecurityContextHolder.getContext().getAuthentication())
                .map(Authentication::getName);
    }
}

@MappedSuperclass
@EntityListeners(AuditingEntityListener.class)
public abstract class BaseEntity {

    @CreatedDate
    @Column(updatable = false)
    private Instant createdAt;

    @LastModifiedDate
    private Instant updatedAt;

    @CreatedBy
    @Column(updatable = false)
    private String createdBy;

    @LastModifiedBy
    private String updatedBy;
}

@Entity
public class Invoice extends BaseEntity {
    @Id
    @GeneratedValue
    private Long id;
}`,
      interviewPoints: [
        '@EnableJpaAuditing + AuditingEntityListener are both required',
        '@MappedSuperclass shares audit columns across entities',
        'Hibernate alternatives: @CreationTimestamp and @UpdateTimestamp',
      ],
    },
    {
      id: 'flyway',
      title: 'Flyway',
      explanation: "A database schema changes as the app evolves: new tables, new columns, new indexes. Flyway manages these changes as versioned SQL files (migrations) stored in your code repository. On startup, Spring Boot runs any migrations that have not yet been applied, in order, and records them in a `flyway_schema_history` table.\n\nFiles are named like `V1__create_customers.sql`, `V2__add_phone.sql` (two underscores). Never edit a migration that has already run in a shared environment; add a new one instead, because Flyway checks checksums and fails if an old file changes.",
      example: `-- src/main/resources/db/migration/V1__create_customers.sql
CREATE TABLE customers (
  id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name       VARCHAR(120) NOT NULL,
  email      VARCHAR(255) NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- src/main/resources/db/migration/V2__add_customer_phone.sql
ALTER TABLE customers ADD COLUMN phone VARCHAR(20);

# pom.xml needs flyway-core and flyway-database-postgresql
# application.yml
spring:
  jpa:
    hibernate:
      ddl-auto: validate
  flyway:
    enabled: true`,
      interviewPoints: [
        'Migrations are versioned, ordered and run exactly once',
        'Never modify an applied migration; add a new version',
        'Pair with ddl-auto=validate so Hibernate checks the schema but never changes it',
      ],
    },
    {
      id: 'liquibase',
      title: 'Liquibase',
      explanation: "Liquibase solves the same problem as Flyway but describes changes as 'changesets' in XML, YAML, JSON or SQL. Each changeset has an id and author and is tracked in a `DATABASECHANGELOG` table.\n\nLiquibase can generate database-specific SQL from a neutral format and has stronger built-in rollback support. Flyway is simpler and SQL-first. Pick one per project; both are auto-configured by Spring Boot when on the classpath.",
      example: `# src/main/resources/db/changelog/db.changelog-master.yaml
databaseChangeLog:
  - changeSet:
      id: 1
      author: asha
      changes:
        - createTable:
            tableName: customers
            columns:
              - column:
                  name: id
                  type: BIGINT
                  autoIncrement: true
                  constraints:
                    primaryKey: true
              - column:
                  name: email
                  type: VARCHAR(255)
                  constraints:
                    nullable: false
                    unique: true`,
      interviewPoints: [
        'Flyway: SQL-first, simple versioned files',
        'Liquibase: changesets in XML/YAML/JSON/SQL, database-neutral, rollback support',
      ],
    },
  ],

  commonMistakes: [
    "Using `spring.jpa.hibernate.ddl-auto=update` in production instead of versioned migrations with Flyway or Liquibase.",
    "Calling `findById(id).get()` without handling the empty `Optional`, which throws `NoSuchElementException` instead of a clear 404.",
    "Calling `findAll()` on a large table and filtering in Java instead of querying with a WHERE clause and pagination.",
    "Storing enums with the default `EnumType.ORDINAL`, so reordering the enum silently corrupts existing data.",
    "Forgetting `@Modifying` (and a transaction) on an UPDATE or DELETE `@Query`, which causes an exception at runtime.",
    "Returning JPA entities directly from REST controllers, which leaks internal fields and can trigger lazy-loading errors or infinite JSON recursion.",
    "Building JPQL or native queries by concatenating user input, which opens the door to SQL injection.",
  ],

  interviewTips: [
    "Explain the layers clearly: JPA is the specification, Hibernate is the implementation, Spring Data JPA generates repositories on top.",
    "When asked about queries, say when you would pick each option: derived query for simple filters, JPQL @Query for joins, native query for database-specific features, projections for read-only views.",
    "Mention pagination and projections when talking about performance; they show you think about large data sets.",
    "Say that in production the schema is managed with Flyway or Liquibase and Hibernate only validates it.",
    "Remember Spring Boot 3 uses `jakarta.persistence` imports; mentioning it shows you are up to date.",
  ],

  interviewQuestions: [
    {
      id: 'jpa-spring-data-q1',
      question: 'What is the difference between JPA, Hibernate and Spring Data JPA?',
      answer: "JPA (Jakarta Persistence API) is a specification: it defines annotations like `@Entity` and interfaces like `EntityManager`, but contains no working code. Hibernate is an implementation of JPA; it actually generates SQL, manages the persistence context and caching.\n\nSpring Data JPA is a Spring abstraction on top of JPA. You declare repository interfaces and Spring generates the implementation, including CRUD methods, paging and queries derived from method names. Under the hood it still uses the JPA `EntityManager`, which Hibernate implements.",
      points: [
        'JPA = specification (jakarta.persistence)',
        'Hibernate = most popular JPA provider',
        'Spring Data JPA = repository abstraction that reduces boilerplate',
      ],
      difficulty: 'Beginner',
    },
    {
      id: 'jpa-spring-data-q2',
      question: 'What is an entity and what are the minimum requirements for a JPA entity?',
      answer: "An entity is a Java class whose instances are stored as rows in a database table. It must be annotated with `@Entity`, have a primary key field marked with `@Id`, and have a no-argument constructor (public or protected).\n\nThe class should not be `final`, and persistent methods should not be final, because Hibernate creates proxy subclasses for lazy loading. That is also why Java records cannot be entities.",
      example: `@Entity
public class Customer {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    protected Customer() { }
}`,
      points: [
        '@Entity + @Id + no-arg constructor',
        'Not final, so Hibernate can create proxies',
        'Records cannot be entities but are great for DTOs/projections',
      ],
      difficulty: 'Beginner',
    },
    {
      id: 'jpa-spring-data-q3',
      question: 'What is the difference between CrudRepository and JpaRepository?',
      answer: "`CrudRepository` provides basic CRUD operations such as `save`, `findById`, `findAll`, `count` and `deleteById`, with `findAll` returning `Iterable`. `JpaRepository` extends `ListCrudRepository` and `ListPagingAndSortingRepository`, so it also supports paging and sorting and returns `List`.\n\nOn top of that, it adds JPA-specific methods like `flush()`, `saveAndFlush()`, `saveAllAndFlush()`, `deleteAllInBatch()` and `getReferenceById()`. In most JPA applications you extend `JpaRepository`.",
      points: [
        'CrudRepository: basic CRUD, generic across Spring Data stores',
        'JpaRepository: CRUD + paging/sorting + flush and batch methods',
        'Choose a smaller interface if you want to expose fewer operations',
      ],
      difficulty: 'Beginner',
    },
    {
      id: 'jpa-spring-data-q4',
      question: 'How does save() decide whether to insert or update?',
      answer: "`SimpleJpaRepository.save()` checks if the entity is new. By default, an entity is new when its id is `null` (or 0 for primitive ids), or, if it has a `@Version` field, when the version is null. New entities are passed to `EntityManager.persist()` (INSERT); others go to `merge()`, which loads the existing row and copies the state onto a managed instance (UPDATE).\n\nIf you assign ids yourself (for example UUIDs set in the constructor), every save looks like an update and Hibernate runs an extra SELECT before inserting. You can fix that by implementing `Persistable<ID>` and its `isNew()` method, or using a `@Version` field.",
      example: `@Entity
public class Device implements Persistable<UUID> {
    @Id
    private UUID id = UUID.randomUUID();

    @Transient
    private boolean isNew = true;

    @Override
    public UUID getId() { return id; }

    @Override
    public boolean isNew() { return isNew; }

    @PostLoad
    @PostPersist
    void markNotNew() { this.isNew = false; }
}`,
      points: [
        'New entity -> persist (INSERT), existing -> merge (UPDATE)',
        'Default check: id is null, or @Version is null',
        'Always use the instance returned by save()',
        'Persistable.isNew() customises the check',
      ],
      difficulty: 'Advanced',
    },
    {
      id: 'jpa-spring-data-q5',
      question: 'What are derived query methods, and when would you stop using them?',
      answer: "Derived query methods let Spring Data build a query from the method name, for example `findByEmailAndActiveTrue(String email)` becomes a WHERE clause on `email` and `active`. Spring parses the name at startup and fails fast if a property does not exist.\n\nThey are perfect for simple filters. Once a name becomes long and hard to read, or you need joins, grouping, fetch joins or projections with calculated fields, switch to `@Query` with JPQL, or to Specifications or Querydsl for dynamic filters.",
      example: `List<Order> findByStatusAndCreatedAtBetweenOrderByCreatedAtDesc(
        OrderStatus status, Instant from, Instant to);`,
      points: [
        'Generated from method name keywords: And, Or, Between, Like, OrderBy, Top...',
        'Validated at startup',
        'Switch to @Query for complex logic',
      ],
      difficulty: 'Beginner',
    },
    {
      id: 'jpa-spring-data-q6',
      question: 'What is the difference between JPQL and a native query?',
      answer: "JPQL is an object-oriented query language that uses entity class names and field names; Hibernate translates it into SQL for whatever database you use, so it is portable. A native query (`nativeQuery = true`) is raw SQL for a specific database and uses table and column names.\n\nUse JPQL by default. Use native queries for features JPQL lacks, such as window functions in older versions, `ON CONFLICT` upserts, JSONB operators or full-text search. The downside is that native queries are not portable and are not checked against your entity model.",
      example: `@Query("SELECT c FROM Customer c WHERE c.email = :email")
Optional<Customer> byEmailJpql(@Param("email") String email);

@Query(value = "SELECT * FROM customers WHERE email = :email", nativeQuery = true)
Optional<Customer> byEmailNative(@Param("email") String email);`,
      points: [
        'JPQL: entities and fields, portable',
        'Native: tables and columns, database-specific',
        'Both support safe named parameters',
      ],
      difficulty: 'Intermediate',
    },
    {
      id: 'jpa-spring-data-q7',
      question: 'Why do you need @Modifying, and what are the side effects of bulk updates?',
      answer: "`@Query` methods are treated as SELECT queries by default. For UPDATE or DELETE JPQL you must add `@Modifying`, and the method must run inside a transaction; it returns the number of affected rows.\n\nBulk statements go straight to the database and bypass the persistence context. Entities already loaded in the current transaction keep their old values, and entity lifecycle callbacks, cascades and `@Version` increments do not happen. Use `clearAutomatically = true` so later reads load fresh data, and `flushAutomatically = true` so pending changes are written first.",
      example: `@Modifying(clearAutomatically = true, flushAutomatically = true)
@Transactional
@Query("UPDATE Product p SET p.price = p.price * :factor WHERE p.category = :cat")
int reprice(@Param("cat") String category, @Param("factor") BigDecimal factor);`,
      points: [
        '@Modifying required for UPDATE/DELETE queries',
        'Needs an active transaction',
        'Bypasses first-level cache, callbacks and optimistic locking',
      ],
      difficulty: 'Intermediate',
    },
    {
      id: 'jpa-spring-data-q8',
      question: 'How do you implement pagination and sorting in Spring Data JPA? What is the difference between Page and Slice?',
      answer: "Add a `Pageable` parameter to a repository method and create it with `PageRequest.of(page, size, Sort.by(...))`. In a controller, Spring can resolve `Pageable` directly from `?page=0&size=20&sort=name,asc`. Page numbers are zero-based.\n\n`Page<T>` contains the content plus total elements and total pages, which costs an extra COUNT query. `Slice<T>` only knows whether there is a next page (it fetches size + 1 rows), so it is cheaper and good for infinite scrolling. For very deep pages OFFSET gets slow, so keyset pagination (WHERE id > lastSeenId) is better.",
      example: `Pageable pageable = PageRequest.of(2, 20, Sort.by("createdAt").descending());
Page<Order> page = orderRepository.findByCustomerId(customerId, pageable);
List<Order> orders = page.getContent();
long total = page.getTotalElements();`,
      points: [
        'Pageable = page + size + sort',
        'Page runs a COUNT query, Slice does not',
        'Limit maximum page size (spring.data.web.pageable.max-page-size)',
        'Keyset pagination for large offsets',
      ],
      difficulty: 'Intermediate',
    },
    {
      id: 'jpa-spring-data-q9',
      question: 'What are projections and why are they useful?',
      answer: "A projection is a way to return only part of an entity from a repository. With interface projections, you declare an interface with getters (`getName()`), and Spring Data selects just those columns. With class or record DTO projections, results are mapped into a constructor, either automatically for derived queries or with a JPQL `SELECT new ...` expression.\n\nProjections reduce the number of columns read, avoid loading associations, and return plain read-only objects that Hibernate does not track, so they are faster and avoid lazy-loading problems. They are the best choice for list pages and API responses.",
      example: `public record OrderSummary(Long id, BigDecimal total, OrderStatus status) { }

@Query("SELECT new com.example.shop.OrderSummary(o.id, o.total, o.status) FROM Order o WHERE o.customer.id = :cid")
List<OrderSummary> summaries(@Param("cid") Long customerId);`,
      points: [
        'Interface projections, DTO/record projections, dynamic projections (Class<T> type parameter)',
        'Fewer columns, no dirty checking, no lazy-loading surprises',
        'Ideal for read-only use cases',
      ],
      difficulty: 'Intermediate',
    },
    {
      id: 'jpa-spring-data-q10',
      question: 'How does JPA auditing work in Spring Data?',
      answer: "Enable it with `@EnableJpaAuditing` on a configuration class. Add `@EntityListeners(AuditingEntityListener.class)` to your entities, usually on a shared `@MappedSuperclass`, and annotate fields with `@CreatedDate`, `@LastModifiedDate`, `@CreatedBy` and `@LastModifiedBy`.\n\nThe listener fills the dates automatically before insert and update. For the 'by' fields, you register an `AuditorAware<T>` bean that returns the current user, typically read from the Spring Security context. Remember that bulk `@Modifying` updates bypass the listener.",
      points: [
        '@EnableJpaAuditing turns it on',
        'AuditingEntityListener fills the fields on persist/update',
        'AuditorAware supplies the current user',
        'Bulk JPQL updates do not trigger auditing',
      ],
      difficulty: 'Intermediate',
    },
    {
      id: 'jpa-spring-data-q11',
      question: 'Why should you use Flyway or Liquibase instead of ddl-auto=update in production?',
      answer: "`ddl-auto=update` lets Hibernate guess schema changes from your entities. It never drops or renames columns, cannot migrate data, can produce surprising DDL, and leaves no history of what changed. On a production database that is risky and not reviewable.\n\nFlyway and Liquibase store each change as a versioned migration in source control. Changes are reviewed, applied in the same order in every environment, run exactly once and recorded in a history table. The recommended setup is migrations to change the schema, plus `ddl-auto=validate` so Hibernate only checks that entities match.",
      points: [
        'Migrations are versioned, reviewed and repeatable across environments',
        'Can migrate data, rename columns, add indexes safely',
        'Never edit an applied migration; add a new version',
        'Use ddl-auto=validate or none in production',
      ],
      difficulty: 'Advanced',
    },
    {
      id: 'jpa-spring-data-q12',
      question: 'Which @GeneratedValue strategy would you choose for PostgreSQL, and why does it matter?',
      answer: "For PostgreSQL, `GenerationType.SEQUENCE` is usually the best choice. Hibernate can fetch a block of ids from the sequence in one call (controlled by `allocationSize`, default 50), assign them in memory and then send many INSERT statements in a single JDBC batch.\n\n`IDENTITY` uses an auto-increment column, so Hibernate must execute each INSERT immediately to learn the generated id, which disables JDBC insert batching. `UUID` is useful when ids must be generated outside the database or must not be guessable, but random UUIDs make larger, more scattered indexes than sequential numbers.",
      example: `@Id
@GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "customer_seq")
@SequenceGenerator(name = "customer_seq", sequenceName = "customer_seq", allocationSize = 50)
private Long id;`,
      points: [
        'SEQUENCE enables insert batching and pre-allocation',
        'IDENTITY forces an immediate INSERT per entity',
        'allocationSize must match the sequence INCREMENT BY',
        'UUIDs: globally unique but bigger, less index-friendly',
      ],
      difficulty: 'Advanced',
    },
  ],
}

export default topic
