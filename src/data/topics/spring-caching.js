const topic = {
  id: 'spring-caching',
  category: 'spring-boot',
  title: 'Caching',
  description: "Speed up your application by keeping frequently used data in memory with Spring's cache abstraction, Caffeine and Redis.",
  difficulty: 'Intermediate',
  overview: "A cache is a fast, temporary store for data that is expensive to get again, such as the result of a slow database query or a call to another service. Instead of doing the expensive work every time, you do it once, keep the result, and return the saved copy on the next request.\n\nThink of a cache like keeping your most-used spices on the kitchen counter instead of in the basement storeroom. Grabbing them from the counter is instant; you only go to the basement when the counter does not have what you need, and you bring it back up for next time. The catch is that the counter copy can get out of date, and the counter has limited space.\n\nSpring Boot provides a cache abstraction: you annotate methods with `@Cacheable`, `@CachePut` and `@CacheEvict`, and Spring handles storing and reading results. The actual storage is pluggable: an in-memory library like Caffeine for a single instance, or Redis for a cache shared across many instances.\n\nThe hard part of caching is not adding it but keeping it correct: choosing good keys, expiring data (TTL), invalidating entries when data changes, and protecting the database when many requests miss the cache at once.",

  subtopics: [
    {
      id: 'why-cache',
      title: 'Why cache?',
      explanation: "Caching reduces response time (memory reads take microseconds, database or network calls take milliseconds), reduces load on databases and downstream services, and can keep the app responsive when a dependency is slow.\n\nCache data that is read often, changes rarely, and is expensive to compute or fetch: product catalogues, configuration, user permissions, exchange rates, results of heavy reports. Do not cache data that must always be perfectly fresh (like an account balance used for payments) unless you have a reliable invalidation strategy.",
      interviewPoints: [
        'Good candidates: read-heavy, rarely changing, expensive data',
        'Trade-off: speed vs freshness and memory',
        'Measure hit ratio to know if a cache is useful',
      ],
    },
    {
      id: 'cache-abstraction',
      title: 'Spring Cache abstraction and @EnableCaching',
      explanation: "Spring's cache abstraction separates what to cache (annotations on your methods) from where it is stored (a `CacheManager` implementation). Your code does not depend on Caffeine or Redis directly, so you can switch providers with configuration.\n\nAdd `spring-boot-starter-cache`, put `@EnableCaching` on a configuration class, and Spring Boot auto-configures a `CacheManager` based on what is on the classpath. With nothing else present, it uses a simple `ConcurrentHashMap`-based cache, which is fine for demos but has no expiry or size limit. Like `@Transactional`, caching works through proxies, so self-invocation bypasses it.",
      example: `@SpringBootApplication
@EnableCaching
public class ShopApplication {
    public static void main(String[] args) {
        SpringApplication.run(ShopApplication.class, args);
    }
}`,
      interviewPoints: [
        '@EnableCaching turns on the caching proxies',
        'CacheManager is the pluggable storage',
        'Proxy-based: internal this.method() calls skip the cache',
      ],
    },
    {
      id: 'cacheable',
      title: '@Cacheable',
      explanation: "`@Cacheable` means: before running the method, look in the cache for the key. If found (a cache hit), return the cached value without running the method. If not found (a miss), run the method, store the result, and return it.\n\nUse `condition` to decide whether to use the cache based on arguments, and `unless` to skip storing based on the result (for example do not cache null). `sync = true` makes concurrent callers for the same missing key wait for a single computation, which helps against stampedes on a single instance.",
      example: `@Service
public class ProductService {

    @Cacheable(cacheNames = "products", key = "#id", unless = "#result == null")
    public ProductDto getProduct(Long id) {
        simulateSlowCall();
        return productRepository.findById(id).map(ProductDto::from).orElse(null);
    }

    @Cacheable(cacheNames = "productsByCategory", key = "#category", sync = true)
    public List<ProductDto> byCategory(String category) {
        return productRepository.findByCategory(category).stream().map(ProductDto::from).toList();
    }
}`,
      interviewPoints: [
        'Hit: method skipped. Miss: method runs and result is stored',
        'condition checks arguments, unless checks the result',
        'Cache DTOs, not JPA entities',
      ],
    },
    {
      id: 'cacheput',
      title: '@CachePut',
      explanation: "`@CachePut` always runs the method and then puts the result into the cache. It is used on update methods so the cache holds the new value right away, instead of waiting for the next read to reload it.\n\nDo not put `@Cacheable` and `@CachePut` on the same method; they mean opposite things. The key of `@CachePut` must match the key used by `@Cacheable` for the same data.",
      example: `@CachePut(cacheNames = "products", key = "#result.id")
@Transactional
public ProductDto updatePrice(Long id, BigDecimal price) {
    Product p = productRepository.findById(id).orElseThrow();
    p.setPrice(price);
    return ProductDto.from(p);
}`,
      interviewPoints: [
        '@CachePut always executes the method',
        'Used to refresh the cache on writes',
        'Key must match the @Cacheable key',
      ],
    },
    {
      id: 'cacheevict',
      title: '@CacheEvict',
      explanation: "`@CacheEvict` removes entries from the cache, usually when data is deleted or changed. Remove one key with `key`, or clear the whole cache with `allEntries = true`.\n\nBy default eviction happens after the method succeeds. Set `beforeInvocation = true` to evict even if the method throws. Evicting is often safer than `@CachePut` because the next read reloads fresh data from the source.",
      example: `@CacheEvict(cacheNames = "products", key = "#id")
public void deleteProduct(Long id) {
    productRepository.deleteById(id);
}

@CacheEvict(cacheNames = "productsByCategory", allEntries = true)
public void importCatalogue(List<ProductDto> products) {
    // bulk import: clear everything
}`,
      interviewPoints: [
        'Evict on delete and on update',
        'allEntries = true clears a whole cache',
        'Eviction runs after success unless beforeInvocation = true',
      ],
    },
    {
      id: 'caching-annotation',
      title: '@Caching',
      explanation: "Spring's cache annotations are not repeatable, yet one method often needs to touch several caches. `@Caching` groups multiple `@Cacheable`, `@CachePut` and `@CacheEvict` annotations on one method.\n\nA typical use is an update that refreshes the entry by id and evicts list caches that might contain the old value.",
      example: `@Caching(
    put = @CachePut(cacheNames = "products", key = "#result.id"),
    evict = {
        @CacheEvict(cacheNames = "productsByCategory", allEntries = true),
        @CacheEvict(cacheNames = "featuredProducts", allEntries = true)
    }
)
@Transactional
public ProductDto update(Long id, UpdateProductRequest req) {
    Product p = productRepository.findById(id).orElseThrow();
    p.apply(req);
    return ProductDto.from(p);
}`,
      interviewPoints: [
        '@Caching combines several cache operations',
        'Common for updates that affect single-item and list caches',
      ],
    },
    {
      id: 'cache-keys',
      title: 'Cache keys',
      explanation: "Every cached value is stored under a key. By default Spring builds the key from all method parameters with `SimpleKeyGenerator`: no params gives `SimpleKey.EMPTY`, one param uses that param, several params build a `SimpleKey` of all of them.\n\nYou can write a SpEL (Spring Expression Language) expression with `key`, like `#id`, `#user.id`, or `#country + ':' + #page`. Keys must uniquely identify the result, including anything that changes it (such as locale, tenant or page number), and key objects must have correct `equals` and `hashCode`. For Redis, the cache name is added as a prefix, like `products::42`.",
      example: `@Cacheable(cacheNames = "prices", key = "#productId + ':' + #currency")
public Money price(Long productId, String currency) { return null; }

@Cacheable(cacheNames = "userOrders", key = "#user.id + ':' + #pageable.pageNumber")
public List<OrderDto> orders(User user, Pageable pageable) { return List.of(); }

// Custom generator bean for special cases
@Bean
public KeyGenerator tenantKeyGenerator() {
    return (target, method, params) -> TenantContext.current() + ":" + Arrays.toString(params);
}`,
      interviewPoints: [
        'Default key = method parameters (SimpleKeyGenerator)',
        'SpEL key expressions: #param, #param.field, #result (for put/evict)',
        'Include everything that affects the result (tenant, locale, page)',
      ],
    },
    {
      id: 'ttl',
      title: 'TTL (time to live)',
      explanation: "TTL is how long an entry stays in the cache before it expires automatically. Expiry is your safety net: even if you forget to evict something, stale data disappears after the TTL.\n\nSpring's annotations do not have a TTL attribute; TTL is configured on the provider. Choose it based on how stale the data may be: seconds for stock levels, minutes for product details, hours for reference data. Add a small random jitter so many keys do not expire at the same moment.",
      example: `# application.yml
spring:
  cache:
    type: redis
    redis:
      time-to-live: 10m
      cache-null-values: false

# Or with Caffeine
spring:
  cache:
    type: caffeine
    cache-names: products,productsByCategory
    caffeine:
      spec: maximumSize=10000,expireAfterWrite=10m`,
      interviewPoints: [
        'TTL is configured in the provider, not the annotation',
        'Short TTL = fresher but more misses',
        'Add jitter to avoid mass expiry',
      ],
    },
    {
      id: 'providers',
      title: 'Cache providers (Caffeine, Redis)',
      explanation: "Caffeine is a high-performance in-process (local) cache library for Java. It lives in your application's heap, so reads are extremely fast, and it supports size limits, TTL and smart eviction. But each application instance has its own copy, so instances can disagree, and the cache is lost on restart.\n\nRedis is an external in-memory data store used as a distributed cache. All instances share one cache, it survives app restarts, and it can be large. Each read is a network call (still sub-millisecond on a local network) and values must be serialized. Many systems use both: Caffeine for small hot data, Redis for shared data.",
      example: `<!-- Caffeine -->
<dependency>
    <groupId>com.github.ben-manes.caffeine</groupId>
    <artifactId>caffeine</artifactId>
</dependency>

<!-- Redis -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-data-redis</artifactId>
</dependency>

// Per-cache TTL with Redis
@Bean
public RedisCacheManagerBuilderCustomizer cacheCustomizer() {
    return builder -> builder
            .withCacheConfiguration("products",
                    RedisCacheConfiguration.defaultCacheConfig().entryTtl(Duration.ofMinutes(10)))
            .withCacheConfiguration("exchangeRates",
                    RedisCacheConfiguration.defaultCacheConfig().entryTtl(Duration.ofSeconds(60)));
}`,
      interviewPoints: [
        'Caffeine: local, fastest, per instance',
        'Redis: distributed, shared, survives restarts, network + serialization cost',
        'Two-level caching combines both',
      ],
    },
    {
      id: 'cache-patterns',
      title: 'Cache-aside and write-through',
      explanation: "Cache-aside (lazy loading) is the most common pattern and is what `@Cacheable` does: the application checks the cache, on a miss reads from the database, then stores the result in the cache. Writes go to the database and the cache entry is evicted.\n\nWrite-through means every write goes to the cache and the database together, so the cache is always up to date (similar to `@CachePut`). Write-behind (write-back) writes to the cache first and updates the database later asynchronously; it is fast but risks losing data. Read-through means the cache itself knows how to load missing data.",
      example: `// Cache-aside written by hand with RedisTemplate
public ProductDto get(Long id) {
    String key = "product:" + id;
    ProductDto cached = redis.opsForValue().get(key);
    if (cached != null) {
        return cached;                                        // hit
    }
    ProductDto fresh = ProductDto.from(repo.findById(id).orElseThrow()); // miss
    redis.opsForValue().set(key, fresh, Duration.ofMinutes(10));
    return fresh;
}

public void update(Long id, UpdateProductRequest req) {
    service.updateInDb(id, req);
    redis.delete("product:" + id);                            // invalidate
}`,
      interviewPoints: [
        'Cache-aside: app manages the cache; most common',
        'Write-through: write cache and DB together',
        'Write-behind: fast, but risk of data loss',
      ],
    },
    {
      id: 'invalidation-stale-data',
      title: 'Cache invalidation and stale data',
      explanation: "Stale data is a cached value that no longer matches the database. It happens when the database changes but the cache is not updated: another service writes directly to the DB, an eviction is forgotten, or a local cache on another instance still has the old value.\n\nStrategies: evict on every write path (prefer delete over update to avoid race conditions), always set a TTL as a safety net, evict after the transaction commits so readers do not re-cache old data, and for local caches across instances broadcast invalidations (for example via Redis pub/sub or Kafka) or keep TTLs short.",
      example: `@Transactional
public void changePrice(Long id, BigDecimal price) {
    productRepository.findById(id).orElseThrow().setPrice(price);
    eventPublisher.publishEvent(new ProductChanged(id));
}

@TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
public void onProductChanged(ProductChanged e) {
    cacheManager.getCache("products").evict(e.id()); // evict only after commit
}`,
      interviewPoints: [
        'Invalidation is the hardest part of caching',
        'Prefer evict over update to avoid races',
        'Evict after commit',
        'TTL as the safety net',
      ],
    },
    {
      id: 'cache-stampede',
      title: 'Cache stampede',
      explanation: "A cache stampede (thundering herd) happens when a popular key expires and hundreds of requests miss at the same moment. They all hit the database together to recompute the same value, which can overload it.\n\nFixes: `@Cacheable(sync = true)` so only one thread per instance computes the value; a distributed lock so only one instance recomputes; refresh-ahead (Caffeine `refreshAfterWrite`) so entries refresh in the background before they expire; random TTL jitter so keys do not expire together; and serving slightly stale data while a refresh is in progress.",
      example: `@Cacheable(cacheNames = "homepage", key = "'v1'", sync = true)
public HomepageDto homepage() {
    return buildExpensiveHomepage(); // only one thread computes on a miss
}

// Caffeine refresh-ahead (refreshAfterWrite needs a CacheLoader)
@Bean
public CacheManager cacheManager(HomepageBuilder builder) {
    CaffeineCacheManager manager = new CaffeineCacheManager("homepage");
    manager.setCaffeine(Caffeine.newBuilder()
            .maximumSize(10_000)
            .expireAfterWrite(Duration.ofMinutes(10))
            .refreshAfterWrite(Duration.ofMinutes(8)));
    manager.setCacheLoader(key -> builder.build());
    return manager;
}`,
      interviewPoints: [
        'Many simultaneous misses on one hot key',
        'sync = true (per instance), distributed lock (across instances)',
        'Refresh-ahead and TTL jitter',
      ],
    },
  ],

  commonMistakes: [
    "Forgetting `@EnableCaching`, so the annotations do nothing and every call hits the database.",
    "Calling a `@Cacheable` method from inside the same class, which bypasses the proxy and the cache.",
    "Caching JPA entities instead of DTOs, which leads to lazy-loading errors and serialization problems, especially with Redis.",
    "Using the default simple cache in production, which has no TTL or size limit and can cause OutOfMemoryError.",
    "Updating data without evicting or updating the cached copy, so users see stale values.",
    "Choosing keys that miss a parameter that changes the result (for example the tenant or page number), so users get each other's data.",
    "Putting `@Cacheable` and `@CachePut` on the same method.",
  ],

  interviewTips: [
    "Start by saying what you would cache and why (read-heavy, rarely changing, expensive), and what you would not cache.",
    "Always pair caching with an invalidation plan and a TTL; interviewers want to hear you think about stale data.",
    "Compare local (Caffeine) and distributed (Redis) caches in terms of speed, consistency across instances and memory.",
    "Mention cache stampede and a fix like `sync = true` or refresh-ahead to stand out.",
    "Explain that caching annotations are proxy-based, just like `@Transactional`, so self-invocation does not work.",
  ],

  interviewQuestions: [
    {
      id: 'spring-caching-q1',
      question: 'What is caching and when should you use it?',
      answer: "Caching stores the result of an expensive operation, like a database query or remote API call, in fast storage (usually memory) so later requests can reuse it instead of repeating the work. It lowers latency and reduces load on databases and downstream services.\n\nUse it for data that is read much more often than it changes and is expensive to produce, such as product details, configuration or reference data. Avoid it, or use very short TTLs, for data that must always be exactly current, and always plan how cached data will be invalidated.",
      points: [
        'Faster responses and less backend load',
        'Best for read-heavy, rarely changing, expensive data',
        'Trade-off: possible stale data and memory usage',
      ],
      difficulty: 'Beginner',
    },
    {
      id: 'spring-caching-q2',
      question: 'How do you enable caching in a Spring Boot application?',
      answer: "Add `spring-boot-starter-cache` (and optionally a provider such as Caffeine or `spring-boot-starter-data-redis`), then put `@EnableCaching` on a `@Configuration` or the main application class. Spring Boot auto-configures a `CacheManager` for the provider it finds on the classpath, or a simple in-memory map if none is present.\n\nThen annotate service methods with `@Cacheable`, `@CachePut` and `@CacheEvict`. Configure cache names, TTL and size through `spring.cache.*` properties or a provider-specific customizer bean.",
      example: `@Configuration
@EnableCaching
public class CacheConfig { }

// application.yml: spring.cache.type=caffeine, spring.cache.caffeine.spec=maximumSize=1000,expireAfterWrite=5m`,
      points: [
        'Starter + @EnableCaching',
        'CacheManager auto-configured from classpath',
        'Annotate methods; configure TTL in the provider',
      ],
      difficulty: 'Beginner',
    },
    {
      id: 'spring-caching-q3',
      question: 'What is the difference between @Cacheable, @CachePut and @CacheEvict?',
      answer: "`@Cacheable` checks the cache first: on a hit it returns the cached value and does not run the method; on a miss it runs the method and stores the result. `@CachePut` always runs the method and writes its result into the cache, which keeps the cache updated after writes. `@CacheEvict` removes one entry (by key) or all entries (`allEntries = true`) from a cache, typically on update or delete.\n\n`@Caching` lets you combine several of these on one method, for example updating the item cache and evicting list caches.",
      example: `@Cacheable(cacheNames = "users", key = "#id")
public UserDto get(Long id) { return null; }

@CachePut(cacheNames = "users", key = "#result.id")
public UserDto update(Long id, UpdateUserRequest r) { return null; }

@CacheEvict(cacheNames = "users", key = "#id")
public void delete(Long id) { }`,
      points: [
        '@Cacheable: read-through, skips method on hit',
        '@CachePut: always runs, refreshes cache',
        '@CacheEvict: removes entries',
      ],
      difficulty: 'Beginner',
    },
    {
      id: 'spring-caching-q4',
      question: 'How are cache keys generated in Spring, and how can you customise them?',
      answer: "By default Spring uses `SimpleKeyGenerator`: with no parameters the key is `SimpleKey.EMPTY`, with one parameter the key is that parameter, and with several it is a `SimpleKey` combining all of them. So key objects must implement `equals` and `hashCode` correctly.\n\nYou can customise with a SpEL expression in the `key` attribute (`#id`, `#user.email`, `#root.methodName`, `#result.id` for put/evict), or register a `KeyGenerator` bean and reference it with `keyGenerator`. The key must include everything that changes the result, like tenant id, locale or paging, or different users may receive the wrong cached data.",
      example: `@Cacheable(cacheNames = "search", key = "#tenantId + ':' + #query + ':' + #page")
public List<ResultDto> search(String tenantId, String query, int page) { return List.of(); }`,
      points: [
        'Default SimpleKeyGenerator uses all parameters',
        'SpEL key expressions',
        'Custom KeyGenerator bean',
        'Include every input that affects the result',
      ],
      difficulty: 'Intermediate',
    },
    {
      id: 'spring-caching-q5',
      question: 'Caffeine or Redis: which cache would you choose?',
      answer: "Caffeine is an in-process cache: extremely fast (no network, no serialization), easy to set up, with size limits and TTL. Its downsides are that each instance has its own copy, so instances can serve different values, cached data is lost on restart, and it uses the JVM heap.\n\nRedis is a distributed cache shared by all instances. It keeps data consistent across instances, survives app restarts and can hold much more data, at the cost of a network hop, serialization and running another piece of infrastructure. For a single instance or small, rarely changing data, Caffeine is great. For multiple instances or shared data, choose Redis, or combine both as a two-level cache.",
      points: [
        'Caffeine: local, fastest, per-instance copies',
        'Redis: shared, consistent across instances, network cost',
        'Two-level: Caffeine in front of Redis',
      ],
      difficulty: 'Intermediate',
    },
    {
      id: 'spring-caching-q6',
      question: 'How do you set a TTL for cached entries in Spring Boot?',
      answer: "The Spring caching annotations have no TTL attribute; TTL is a feature of the cache provider. With Redis you set a global default using `spring.cache.redis.time-to-live`, and per-cache TTLs with a `RedisCacheManagerBuilderCustomizer` and `RedisCacheConfiguration.entryTtl(...)`. With Caffeine you use a spec like `expireAfterWrite=10m` or build a `CaffeineCacheManager` with different specs per cache.\n\nPick TTLs based on how stale the data may safely be, and add jitter for hot keys to avoid many entries expiring at the same time.",
      example: `@Bean
public RedisCacheManagerBuilderCustomizer ttlCustomizer() {
    return builder -> builder.withCacheConfiguration("products",
            RedisCacheConfiguration.defaultCacheConfig()
                    .entryTtl(Duration.ofMinutes(10))
                    .disableCachingNullValues());
}`,
      points: [
        'TTL lives in the provider config',
        'Redis: time-to-live property or RedisCacheConfiguration',
        'Caffeine: expireAfterWrite / expireAfterAccess',
      ],
      difficulty: 'Intermediate',
    },
    {
      id: 'spring-caching-q7',
      question: 'What is the cache-aside pattern and how does it differ from write-through?',
      answer: "In cache-aside, the application owns the cache logic: on a read it checks the cache, on a miss it loads from the database and populates the cache; on a write it updates the database and evicts the cache entry. Spring's `@Cacheable` plus `@CacheEvict` implements cache-aside.\n\nIn write-through, every write updates both the cache and the database at the same time, so reads almost always hit and the cache is fresh, but every write pays the extra cost and you may cache data nobody reads. Write-behind writes to the cache first and flushes to the database later, which is fast but can lose data if the cache fails.",
      points: [
        'Cache-aside: load on miss, evict on write',
        'Write-through: write cache and DB together',
        'Write-behind: async DB write, risk of loss',
      ],
      difficulty: 'Intermediate',
    },
    {
      id: 'spring-caching-q8',
      question: 'Why does @Cacheable sometimes not work?',
      answer: "The most common reasons: `@EnableCaching` is missing; the method is called from another method in the same class (self-invocation), so the call bypasses the Spring proxy; the method is `private` or `final`; the class is not a Spring bean (created with `new`); or the key differs between calls because a parameter lacks proper `equals`/`hashCode`.\n\nOther causes include a `condition` or `unless` expression that excludes the value, or the default simple cache being used when you expected Redis because the provider was not configured.",
      points: [
        'Missing @EnableCaching',
        'Self-invocation bypasses the proxy',
        'private/final methods or non-bean objects',
        'Unstable keys (bad equals/hashCode)',
      ],
      difficulty: 'Intermediate',
    },
    {
      id: 'spring-caching-q9',
      question: 'How do you prevent stale data in a cache?',
      answer: "Combine several techniques. Evict (or update) the cache on every write path, preferably deleting the key rather than writing a new value, which avoids race conditions where an older value overwrites a newer one. Evict after the database transaction commits, for example with `@TransactionalEventListener(phase = AFTER_COMMIT)`, so a concurrent reader does not re-cache the old value. Always set a TTL as a safety net.\n\nWith local caches on several instances, send invalidation messages to all instances (Redis pub/sub, Kafka) or keep TTLs short. If other systems write directly to the database, use change data capture or accept a TTL-bounded staleness window.",
      points: [
        'Evict on every write, after commit',
        'Prefer delete over update',
        'TTL as a safety net',
        'Broadcast invalidations for local caches',
      ],
      difficulty: 'Advanced',
    },
    {
      id: 'spring-caching-q10',
      question: 'What is a cache stampede and how can you prevent it?',
      answer: "A cache stampede happens when a heavily used key expires or is evicted and many concurrent requests miss at the same time. All of them go to the database or remote service to rebuild the same value, which can overload it and cause cascading failures.\n\nPrevention: `@Cacheable(sync = true)` lets only one thread per instance compute the value while others wait; a distributed lock (for example in Redis) extends this across instances; refresh-ahead (Caffeine `refreshAfterWrite`) reloads entries in the background before they expire; random jitter on TTLs spreads expiries; and serving stale data while one request refreshes keeps latency low.",
      example: `@Cacheable(cacheNames = "trending", key = "'all'", sync = true)
public List<ProductDto> trending() {
    return computeTrending(); // expensive aggregation
}`,
      points: [
        'Many misses on one hot key at once',
        'sync = true within an instance',
        'Distributed lock across instances',
        'Refresh-ahead and TTL jitter',
      ],
      difficulty: 'Advanced',
    },
    {
      id: 'spring-caching-q11',
      question: 'Why should you cache DTOs instead of JPA entities, especially with Redis?',
      answer: "JPA entities may contain lazy-loading proxies and collections tied to a persistence context. When you serialize them into Redis you can trigger `LazyInitializationException`, accidentally serialize huge object graphs, or hit infinite recursion on bidirectional relationships. When read back, they are detached objects that Hibernate does not manage, which can cause confusing bugs if you try to save them.\n\nDTOs (often Java records) are small, contain exactly the data needed, serialize cleanly to JSON and do not depend on Hibernate. Configure a JSON serializer for Redis values so cached data stays readable and version-tolerant.",
      points: [
        'Entities carry lazy proxies and persistence state',
        'Serialization issues and huge payloads',
        'DTOs are small, immutable and serializer-friendly',
      ],
      difficulty: 'Advanced',
    },
  ],
}

export default topic
