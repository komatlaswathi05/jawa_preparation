const topic = {
  id: 'spring-redis',
  category: 'spring-boot',
  title: 'Redis',
  description: "Use Redis, the fast in-memory data store, from Spring Boot for caching, sessions, rate limiting, locks and leaderboards.",
  difficulty: 'Intermediate',
  overview: "Redis (REmote DIctionary Server) is an in-memory key-value data store. It keeps data in RAM, so reads and writes usually take well under a millisecond. Unlike a simple map, the values can be rich data structures: strings, hashes, lists, sets and sorted sets, each with its own fast commands.\n\nThink of Redis as a shared whiteboard in the middle of the office. Every application instance (every team member) can read and write it instantly, and you can write things with an expiry time so they wipe themselves off. It is not your filing cabinet (the main database); it is the place for fast, shared, often temporary data.\n\nIn Spring Boot, Spring Data Redis gives you `RedisTemplate` and `StringRedisTemplate` for direct access, and Redis can back Spring's cache abstraction with no code changes. Common uses are caching, HTTP session storage, rate limiting, distributed locks, counters and leaderboards.\n\nInterviewers expect you to know the core data structures and when to use each, how expiry and eviction work, how Redis persists data (RDB and AOF), and what trade-offs come from keeping everything in memory.",

  subtopics: [
    {
      id: 'what-is-redis',
      title: 'What Redis is',
      explanation: "Redis is an open-source, in-memory data structure store used as a cache, database, message broker and more. It executes commands on a single main thread, so each command is atomic: two clients running `INCR` on the same key will never lose an update.\n\nBecause data lives in RAM, Redis is fast but memory is limited and more expensive than disk. It can persist data to disk, but it is usually used alongside a primary database like PostgreSQL rather than instead of it. Redis 7.4+ changed its licence; the Linux Foundation fork Valkey is a compatible alternative, and Spring Data Redis works with both.",
      example: `# redis-cli
SET greeting "hello"
GET greeting            # "hello"
INCR page:views         # 1
INCR page:views         # 2
EXPIRE greeting 60      # delete after 60 seconds
TTL greeting            # 59`,
      interviewPoints: [
        'In-memory key-value store with rich data types',
        'Single-threaded command execution makes each command atomic',
        'Typically complements, not replaces, the main database',
      ],
    },
    {
      id: 'strings',
      title: 'Strings',
      explanation: "The simplest type: a key maps to a value of up to 512 MB, which can be text, a number, JSON or binary data. Strings support atomic counters with `INCR`, `INCRBY` and `DECR`, which makes them great for page views and rate limiting.\n\n`SET key value NX EX 30` sets a value only if the key does not exist, with a 30-second expiry, in one atomic command. That is the building block of simple distributed locks.",
      example: `SET user:42:name "Asha"
GET user:42:name
SET session:abc123 "{json}" EX 1800     # expires in 30 minutes
INCRBY stock:sku-1 -2                   # atomic decrement by 2
SET lock:order:7 "instance-1" NX EX 10  # only if absent`,
      interviewPoints: [
        'Strings hold text, numbers, JSON or bytes',
        'INCR/DECR are atomic counters',
        'SET NX EX = set-if-absent with expiry',
      ],
    },
    {
      id: 'hashes',
      title: 'Hashes',
      explanation: "A hash is a map of fields to values stored under one key, like a small object: `user:42` with fields `name`, `email`, `plan`. You can read or update a single field without loading the whole object, and `HINCRBY` increments a numeric field atomically.\n\nHashes are memory-efficient for many small objects and are what Spring Data Redis repositories use to store entities.",
      example: `HSET user:42 name "Asha" email "asha@example.com" plan "pro"
HGET user:42 email
HGETALL user:42
HINCRBY user:42 loginCount 1
HDEL user:42 plan`,
      interviewPoints: [
        'Field-value map under one key',
        'Read/update individual fields',
        'Good for object-like data',
      ],
    },
    {
      id: 'lists',
      title: 'Lists',
      explanation: "A list is an ordered sequence of strings, implemented as a linked list-like structure. You push and pop at both ends in O(1): `LPUSH`, `RPUSH`, `LPOP`, `RPOP`. `LRANGE` reads a range and `LTRIM` keeps only the first N items.\n\nLists fit recent-activity feeds (keep the last 100 events) and simple queues. `BRPOP` blocks until an item arrives, which enables a basic work queue; for reliable messaging with consumer groups, Redis Streams or Kafka are better.",
      example: `LPUSH feed:42 "liked post 9"
LPUSH feed:42 "commented on post 3"
LTRIM feed:42 0 99      # keep latest 100
LRANGE feed:42 0 9      # latest 10
RPUSH jobs "job-1"
BRPOP jobs 5            # wait up to 5 s for a job`,
      interviewPoints: [
        'Ordered, allows duplicates',
        'O(1) push/pop at the ends',
        'Feeds, recent items, simple queues',
      ],
    },
    {
      id: 'sets',
      title: 'Sets',
      explanation: "A set is an unordered collection of unique strings. Adding the same member twice has no effect. `SISMEMBER` checks membership in O(1), and `SINTER`, `SUNION` and `SDIFF` combine sets.\n\nUse sets for tags, unique visitors per day, 'users who liked this post' and friend lists (common friends with `SINTER`).",
      example: `SADD post:9:likes 42 17 88
SADD post:9:likes 42          # ignored, already a member
SISMEMBER post:9:likes 17     # 1 (true)
SCARD post:9:likes            # 3
SINTER user:42:friends user:17:friends   # mutual friends`,
      interviewPoints: [
        'Unique, unordered members',
        'O(1) add/remove/membership',
        'Set operations: intersection, union, difference',
      ],
    },
    {
      id: 'sorted-sets',
      title: 'Sorted sets',
      explanation: "A sorted set (ZSET) is like a set, but each member has a numeric score and members are kept ordered by score. Adding or updating is O(log N) and you can fetch by rank or score range quickly.\n\nThis is the go-to structure for leaderboards (score = points), priority queues, and sliding-window rate limiting (score = timestamp). `ZINCRBY` adds to a member's score atomically.",
      example: `ZADD leaderboard 1500 "asha" 1200 "ravi" 1800 "meera"
ZINCRBY leaderboard 50 "ravi"
ZREVRANGE leaderboard 0 2 WITHSCORES   # top 3
ZREVRANK leaderboard "asha"            # 0-based rank
ZRANGEBYSCORE leaderboard 1000 1600`,
      interviewPoints: [
        'Members ordered by score',
        'O(log N) insert/update',
        'Leaderboards, priority queues, time-window data',
      ],
    },
    {
      id: 'ttl-expiry',
      title: 'TTL and expiry',
      explanation: "Any key can have a time to live. After it expires, Redis deletes the key automatically. Set it with `EXPIRE key seconds`, or in one step with `SET key value EX seconds`. `TTL key` shows the remaining seconds (-1 means no expiry, -2 means the key does not exist). `PERSIST` removes the expiry.\n\nRedis removes expired keys lazily (when you access them) and actively (a background job samples keys with expiry). Expiry is what makes Redis perfect for sessions, one-time codes, rate-limit windows and cache entries. Note: overwriting a key with `SET` clears its TTL unless you set a new one or use `KEEPTTL`.",
      example: `SET otp:+919800000000 "482913" EX 300   # OTP valid 5 minutes
TTL otp:+919800000000                   # 297
EXPIRE cart:42 86400
PERSIST cart:42                         # remove expiry

// Java
redisTemplate.opsForValue().set("otp:" + phone, code, Duration.ofMinutes(5));`,
      interviewPoints: [
        'Expiry per key; deleted automatically',
        'Lazy + active expiration',
        'SET without EX/KEEPTTL removes the existing TTL',
      ],
    },
    {
      id: 'spring-data-redis',
      title: 'Spring Data Redis',
      explanation: "Spring Data Redis integrates Redis with Spring. Add `spring-boot-starter-data-redis`; it uses the Lettuce client by default (thread-safe and non-blocking) and auto-configures a connection factory, `RedisTemplate` and `StringRedisTemplate` from `spring.data.redis.*` properties.\n\nIt also supports Redis repositories (`@RedisHash` entities with `CrudRepository`), pub/sub messaging, and serves as the backend for Spring Cache and Spring Session.",
      example: `<!-- pom.xml -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-data-redis</artifactId>
</dependency>

# application.yml
spring:
  data:
    redis:
      host: localhost
      port: 6379
      password: \${REDIS_PASSWORD:}
      timeout: 2s`,
      interviewPoints: [
        'Starter uses Lettuce by default (Jedis is an alternative)',
        'Properties under spring.data.redis in Boot 3',
        'Provides templates, repositories, pub/sub, cache and session support',
      ],
    },
    {
      id: 'redis-template',
      title: 'RedisTemplate and StringRedisTemplate',
      explanation: "`RedisTemplate<K, V>` is the main class for talking to Redis. It exposes operations per data type: `opsForValue()` (strings), `opsForHash()`, `opsForList()`, `opsForSet()` and `opsForZSet()`. It converts Java objects to bytes using serializers.\n\nThe default `RedisTemplate` uses JDK serialization, which produces unreadable binary keys and values. Prefer `StringRedisTemplate` for string data, or configure a `RedisTemplate` with `StringRedisSerializer` for keys and a JSON serializer for values.",
      example: `@Configuration
public class RedisConfig {

    @Bean
    public RedisTemplate<String, Object> redisTemplate(RedisConnectionFactory cf) {
        RedisTemplate<String, Object> t = new RedisTemplate<>();
        t.setConnectionFactory(cf);
        t.setKeySerializer(new StringRedisSerializer());
        t.setValueSerializer(new GenericJackson2JsonRedisSerializer());
        t.setHashKeySerializer(new StringRedisSerializer());
        t.setHashValueSerializer(new GenericJackson2JsonRedisSerializer());
        return t;
    }
}

@Service
public class LeaderboardService {
    private final StringRedisTemplate redis;

    public LeaderboardService(StringRedisTemplate redis) {
        this.redis = redis;
    }

    public void addPoints(String player, double points) {
        redis.opsForZSet().incrementScore("leaderboard", player, points);
    }

    public Set<String> top(int n) {
        return redis.opsForZSet().reverseRange("leaderboard", 0, n - 1);
    }
}`,
      interviewPoints: [
        'opsForValue/Hash/List/Set/ZSet per data type',
        'Default JDK serialization is unreadable: configure JSON/String serializers',
        'StringRedisTemplate for plain strings',
      ],
    },
    {
      id: 'redis-cache-provider',
      title: 'Redis as Spring Cache provider',
      explanation: "With `spring-boot-starter-data-redis` and `@EnableCaching`, set `spring.cache.type=redis` and Spring Boot creates a `RedisCacheManager`. Your `@Cacheable` methods now store results in Redis, shared by every instance of your app.\n\nKeys look like `cacheName::key` (for example `products::42`). Configure a default TTL and a JSON value serializer so entries expire and stay readable. Cached classes must be serializable by the chosen serializer; records and simple DTOs work well.",
      example: `# application.yml
spring:
  cache:
    type: redis
    redis:
      time-to-live: 10m
      key-prefix: "shop:"
      cache-null-values: false

@Bean
public RedisCacheConfiguration cacheConfiguration() {
    return RedisCacheConfiguration.defaultCacheConfig()
            .entryTtl(Duration.ofMinutes(10))
            .disableCachingNullValues()
            .serializeValuesWith(RedisSerializationContext.SerializationPair
                    .fromSerializer(new GenericJackson2JsonRedisSerializer()));
}`,
      interviewPoints: [
        'spring.cache.type=redis creates RedisCacheManager',
        'Shared cache across instances',
        'Set TTL and a JSON serializer',
      ],
    },
    {
      id: 'use-case-caching-sessions',
      title: 'Use cases: caching and sessions',
      explanation: "Caching is the most common use: store expensive query results or API responses with a TTL so all instances benefit.\n\nSession storage: when an app runs on several instances behind a load balancer, an in-memory HTTP session on one instance is invisible to the others. Spring Session with Redis stores sessions centrally, so any instance can serve any request and sessions survive restarts. Add `spring-session-data-redis` and set a timeout.",
      example: `<!-- pom.xml -->
<dependency>
    <groupId>org.springframework.session</groupId>
    <artifactId>spring-session-data-redis</artifactId>
</dependency>

# application.yml
server:
  servlet:
    session:
      timeout: 30m
spring:
  session:
    redis:
      namespace: shop:session`,
      interviewPoints: [
        'Shared cache for all instances',
        'Spring Session + Redis for stateless app instances',
        'Sessions expire via Redis TTL',
      ],
    },
    {
      id: 'use-case-rate-limiting',
      title: 'Use case: rate limiting',
      explanation: "Rate limiting caps how many requests a client can make in a time window, for example 100 requests per minute per API key. Because Redis is shared and `INCR` is atomic, all instances see the same counter.\n\nThe simplest approach is a fixed window: `INCR` a key like `rate:apikey:202609291230` and set a 60-second expiry on first use. It allows bursts at window edges; sliding windows with sorted sets or token buckets (Bucket4j with Redis) are smoother.",
      example: `@Component
public class RateLimiter {
    private final StringRedisTemplate redis;

    public RateLimiter(StringRedisTemplate redis) {
        this.redis = redis;
    }

    public boolean allow(String clientId, int limitPerMinute) {
        long minute = Instant.now().getEpochSecond() / 60;
        String key = "rate:" + clientId + ":" + minute;
        Long count = redis.opsForValue().increment(key);
        if (count != null && count == 1) {
            redis.expire(key, Duration.ofSeconds(60));
        }
        return count != null && count <= limitPerMinute;
    }
}`,
      interviewPoints: [
        'Atomic INCR + EXPIRE',
        'Fixed window is simple; sliding window/token bucket are smoother',
        'Return HTTP 429 Too Many Requests when over the limit',
      ],
    },
    {
      id: 'use-case-distributed-locks',
      title: 'Use case: distributed locks',
      explanation: "When several instances must not run the same job at once (for example a nightly report or processing one order), you need a lock that works across machines. Redis offers `SET key token NX PX 30000`: it succeeds only if the key does not exist and expires automatically so a crashed holder cannot block forever.\n\nRelease the lock only if you still own it: compare the token and delete atomically with a Lua script. In practice use a library like Redisson (`RLock`, with automatic lease renewal) or ShedLock for scheduled jobs. For correctness-critical locks, remember that Redis locks can fail during failover; add fencing tokens or rely on database constraints too.",
      example: `public boolean tryLock(String name, String token, Duration ttl) {
    Boolean ok = redis.opsForValue().setIfAbsent("lock:" + name, token, ttl); // SET NX PX
    return Boolean.TRUE.equals(ok);
}

private static final DefaultRedisScript<Long> UNLOCK = new DefaultRedisScript<>(
        "if redis.call('get', KEYS[1]) == ARGV[1] then return redis.call('del', KEYS[1]) else return 0 end",
        Long.class);

public void unlock(String name, String token) {
    redis.execute(UNLOCK, List.of("lock:" + name), token);
}`,
      interviewPoints: [
        'SET NX with expiry acquires the lock',
        'Unique token + Lua script for safe release',
        'Use Redisson or ShedLock in real projects',
        'Not a perfect guarantee during failover',
      ],
    },
    {
      id: 'use-case-leaderboards',
      title: 'Use case: leaderboards and counters',
      explanation: "Sorted sets make real-time leaderboards trivial: `ZINCRBY` adds points, `ZREVRANGE` returns the top N and `ZREVRANK` gives a player's position, all in O(log N). Doing the same in SQL with millions of rows and constant updates would require heavy sorting.\n\nFor simple counters (likes, views), `INCR` on a string or `HINCRBY` on a hash field are atomic and fast. You can periodically flush counters to the main database.",
      example: `redis.opsForZSet().incrementScore("game:leaderboard", "asha", 50);
Set<ZSetOperations.TypedTuple<String>> top10 =
        redis.opsForZSet().reverseRangeWithScores("game:leaderboard", 0, 9);
Long rank = redis.opsForZSet().reverseRank("game:leaderboard", "asha"); // 0 = first`,
      interviewPoints: [
        'Sorted sets for rankings',
        'O(log N) updates and rank lookups',
        'INCR/HINCRBY for counters',
      ],
    },
    {
      id: 'persistence',
      title: 'Persistence (RDB and AOF)',
      explanation: "Redis keeps data in memory but can save it to disk so it survives restarts. RDB (Redis Database) takes point-in-time snapshots at intervals, producing a compact file that is fast to load. The downside is you can lose the changes since the last snapshot.\n\nAOF (Append Only File) logs every write command. With `appendfsync everysec` (the usual setting) you lose at most about one second of data; AOF files are larger and replay is slower, so Redis rewrites them in the background. Many setups enable both. For a pure cache, persistence can be turned off entirely.",
      example: `# redis.conf
save 900 1          # RDB snapshot if at least 1 change in 15 min
save 300 10
appendonly yes      # enable AOF
appendfsync everysec`,
      interviewPoints: [
        'RDB: periodic snapshots, compact, may lose recent writes',
        'AOF: logs every write, more durable, bigger files',
        'Both can be combined; caches can disable persistence',
      ],
    },
    {
      id: 'eviction-policies',
      title: 'Eviction policies',
      explanation: "When Redis reaches its `maxmemory` limit, the eviction policy decides what happens. `noeviction` (the default) rejects writes with an error. `allkeys-lru` evicts the least recently used keys from all keys, the usual choice for a cache. `allkeys-lfu` evicts the least frequently used. `volatile-lru`, `volatile-lfu`, `volatile-ttl` and `volatile-random` only evict keys that have an expiry. `allkeys-random` evicts random keys.\n\nFor a pure cache use `allkeys-lru` or `allkeys-lfu`. If Redis also stores important data without TTL (like sessions or locks), use a `volatile-*` policy or run a separate instance.",
      example: `# redis.conf
maxmemory 512mb
maxmemory-policy allkeys-lru

# or at runtime
CONFIG SET maxmemory-policy allkeys-lfu`,
      interviewPoints: [
        'Triggered only when maxmemory is reached',
        'noeviction is the default',
        'allkeys-lru/lfu for caches, volatile-* when mixing data',
      ],
    },
    {
      id: 'redis-docker',
      title: 'Redis in Docker for local development',
      explanation: "The easiest way to run Redis locally is Docker. One command starts a Redis server on port 6379. For a full dev environment, add it to `docker-compose.yml` next to PostgreSQL. Spring Boot 3.1+ can even start services from a compose file automatically with `spring-boot-docker-compose`.\n\nFor integration tests, Testcontainers starts a throwaway Redis container per test run, and `@ServiceConnection` wires the connection properties automatically.",
      example: `# Start Redis
docker run -d --name redis -p 6379:6379 redis:7

# Open the CLI
docker exec -it redis redis-cli PING   # PONG

# docker-compose.yml
services:
  redis:
    image: redis:7
    ports:
      - "6379:6379"
    command: ["redis-server", "--appendonly", "yes"]

// Test with Testcontainers
@Testcontainers
@SpringBootTest
class CacheIT {
    @Container
    @ServiceConnection(name = "redis")
    static GenericContainer<?> redis = new GenericContainer<>("redis:7").withExposedPorts(6379);
}`,
      interviewPoints: [
        'docker run -p 6379:6379 redis:7',
        'docker-compose for app dependencies',
        'Testcontainers + @ServiceConnection for tests',
      ],
    },
  ],

  commonMistakes: [
    "Using the default `RedisTemplate` JDK serialization, which stores unreadable binary keys like `\\xac\\xed...` and breaks when classes change.",
    "Storing keys without a TTL in a cache, so memory fills up until writes fail under the default `noeviction` policy.",
    "Running `KEYS *` in production, which blocks the single-threaded server while it scans every key; use `SCAN` instead.",
    "Treating Redis as the only copy of important data without enabling persistence or replication.",
    "Implementing a lock with separate `SETNX` and `EXPIRE` calls (not atomic) or deleting a lock without checking the owner token.",
    "Storing very large values or huge collections under a single key (big keys), which slows down commands and replication.",
    "Leaving Redis exposed to the internet without a password or network restrictions.",
  ],

  interviewTips: [
    "For each use case, name the data structure you would use: strings for counters and locks, hashes for objects, sorted sets for leaderboards, sets for unique members.",
    "Explain that Redis is fast because it is in memory and single-threaded per command, which also makes commands atomic.",
    "Compare RDB and AOF, and eviction policies, in one or two sentences each; these come up often.",
    "Mention serialization configuration (String keys, JSON values) when talking about RedisTemplate; it shows hands-on experience.",
    "Be honest about limits: memory cost, data loss risk without persistence, and the caveats of Redis-based distributed locks.",
  ],

  interviewQuestions: [
    {
      id: 'spring-redis-q1',
      question: 'What is Redis and why is it so fast?',
      answer: "Redis is an open-source in-memory key-value store that supports rich data structures such as strings, hashes, lists, sets and sorted sets. It is commonly used as a cache, session store, message broker and for counters and leaderboards.\n\nIt is fast because data is kept in RAM (no disk seeks on reads), its data structures are optimised in C, and it executes commands on a single main thread with an event loop, which avoids locking and context-switching overhead. A side effect of single-threaded execution is that each command is atomic.",
      points: [
        'In-memory store with rich data types',
        'RAM access + efficient C data structures',
        'Single-threaded command execution: no locks, atomic commands',
      ],
      difficulty: 'Beginner',
    },
    {
      id: 'spring-redis-q2',
      question: 'Which data structures does Redis support, and what is each one good for?',
      answer: "Strings store text, numbers or serialized objects and support atomic counters; used for caching values, counters and locks. Hashes are field-value maps under one key; used for objects like user profiles. Lists are ordered sequences with fast push and pop at both ends; used for feeds and simple queues. Sets hold unique unordered members; used for tags, unique visitors and set operations like mutual friends. Sorted sets hold unique members ordered by a score; used for leaderboards, priority queues and time-based windows.\n\nRedis also offers streams, bitmaps, HyperLogLog (approximate unique counts), geospatial indexes and more.",
      points: [
        'Strings: values, counters, locks',
        'Hashes: objects',
        'Lists: feeds, queues',
        'Sets: unique members; Sorted sets: rankings',
      ],
      difficulty: 'Beginner',
    },
    {
      id: 'spring-redis-q3',
      question: 'How does key expiry (TTL) work in Redis?',
      answer: "You can attach a time to live to any key with `EXPIRE`, or set it with the value using `SET key value EX seconds`. When the time passes, Redis removes the key. `TTL` returns the remaining seconds, -1 if the key has no expiry and -2 if it does not exist.\n\nRedis deletes expired keys in two ways: lazily when a client accesses them, and actively through a background process that samples keys with expiries. Overwriting a key with `SET` without `EX` or `KEEPTTL` removes its TTL. In Spring, pass a `Duration` to `opsForValue().set(...)` or configure `time-to-live` for caches.",
      example: `redisTemplate.opsForValue().set("otp:" + userId, code, Duration.ofMinutes(5));
Long remaining = redisTemplate.getExpire("otp:" + userId); // seconds`,
      points: [
        'EXPIRE / SET EX set a TTL',
        'Lazy + active expiration',
        'SET without EX clears the TTL',
      ],
      difficulty: 'Beginner',
    },
    {
      id: 'spring-redis-q4',
      question: 'What is the difference between RedisTemplate and StringRedisTemplate?',
      answer: "Both are Spring Data Redis helpers that wrap connections and expose operations per data type (`opsForValue`, `opsForHash`, `opsForList`, `opsForSet`, `opsForZSet`). `StringRedisTemplate` is a `RedisTemplate<String, String>` preconfigured with string serializers for keys and values, so what you see in `redis-cli` matches what you wrote.\n\nA plain `RedisTemplate<Object, Object>` uses JDK serialization by default, producing binary data that other languages cannot read and that breaks when classes change. When storing objects, define your own `RedisTemplate<String, Object>` with `StringRedisSerializer` for keys and `GenericJackson2JsonRedisSerializer` (or a typed Jackson serializer) for values.",
      points: [
        'StringRedisTemplate: String keys and values',
        'RedisTemplate default: JDK serialization',
        'Configure JSON serializers for objects',
      ],
      difficulty: 'Intermediate',
    },
    {
      id: 'spring-redis-q5',
      question: 'How do you use Redis as the cache provider for Spring Cache?',
      answer: "Add `spring-boot-starter-data-redis`, enable caching with `@EnableCaching`, and set `spring.cache.type=redis` (Boot picks Redis automatically if it is the only provider). Spring Boot creates a `RedisCacheManager`, and all `@Cacheable`, `@CachePut` and `@CacheEvict` methods now use Redis.\n\nConfigure a default TTL with `spring.cache.redis.time-to-live`, per-cache TTLs with a `RedisCacheManagerBuilderCustomizer`, and a JSON value serializer via `RedisCacheConfiguration`. Keys are stored as `cacheName::key`. Because the cache is shared, all application instances see the same entries and evictions.",
      points: [
        'Starter + @EnableCaching + spring.cache.type=redis',
        'RedisCacheManager auto-configured',
        'Set TTL and serializer',
        'Shared across instances',
      ],
      difficulty: 'Intermediate',
    },
    {
      id: 'spring-redis-q6',
      question: 'How would you implement rate limiting with Redis?',
      answer: "A simple fixed-window limiter uses an atomic counter per client per time window. For each request, run `INCR rate:{client}:{minute}`; if the result is 1, set `EXPIRE` to 60 seconds. If the counter exceeds the limit, reject the request with HTTP 429. Because Redis is shared and `INCR` is atomic, it works across all application instances.\n\nFixed windows allow bursts at window boundaries. A sliding window uses a sorted set of request timestamps (`ZADD`, `ZREMRANGEBYSCORE`, `ZCARD`) in a Lua script or transaction, and a token bucket (for example Bucket4j with a Redis backend) gives smooth limits with allowed bursts.",
      example: `Long count = redis.opsForValue().increment(key);
if (count != null && count == 1) {
    redis.expire(key, Duration.ofMinutes(1));
}
if (count != null && count > limit) {
    throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS);
}`,
      points: [
        'INCR + EXPIRE per window',
        'Shared counter across instances',
        'Sliding window with sorted sets, or token bucket',
        'Respond with 429',
      ],
      difficulty: 'Intermediate',
    },
    {
      id: 'spring-redis-q7',
      question: 'How do you implement a distributed lock with Redis, and what are the pitfalls?',
      answer: "Acquire the lock with a single atomic command: `SET lock:name <unique-token> NX PX 30000`. NX means only if absent, PX sets an expiry so a crashed holder does not block others forever. Release it with a Lua script that deletes the key only if its value still equals your token, so you never delete a lock someone else acquired after yours expired.\n\nPitfalls: the lock can expire while work is still running (use lease renewal, as Redisson's watchdog does); separate SETNX and EXPIRE calls are not atomic; and during a Redis failover a lock can be lost, so two holders may briefly exist. For critical correctness, add fencing tokens or database constraints. In practice use Redisson or ShedLock rather than writing your own.",
      points: [
        'SET NX PX with a unique token',
        'Lua script compare-and-delete to release',
        'Expiry vs long-running work: lease renewal',
        'Not fully safe across failover; use fencing',
      ],
      difficulty: 'Advanced',
    },
    {
      id: 'spring-redis-q8',
      question: 'What is the difference between RDB and AOF persistence?',
      answer: "RDB creates point-in-time snapshots of the whole dataset at configured intervals (for example if 100 keys changed in 5 minutes). Snapshots are compact and quick to load, which makes them good for backups and fast restarts, but writes made after the last snapshot are lost if Redis crashes.\n\nAOF appends every write command to a log file. With `appendfsync everysec` you lose at most about one second of writes. AOF files are larger and restart is slower, so Redis periodically rewrites them compactly. Production setups often enable both, while pure caches may disable persistence entirely.",
      points: [
        'RDB: snapshots, compact, possible data loss between saves',
        'AOF: write log, more durable, bigger and slower to replay',
        'Use both for durability; none for pure cache',
      ],
      difficulty: 'Intermediate',
    },
    {
      id: 'spring-redis-q9',
      question: 'What are Redis eviction policies and which one would you choose for a cache?',
      answer: "Eviction policies decide what Redis does when memory reaches `maxmemory`. `noeviction` (default) returns errors on writes. `allkeys-lru` and `allkeys-lfu` evict the least recently or least frequently used keys among all keys. `volatile-lru`, `volatile-lfu`, `volatile-random` and `volatile-ttl` only evict keys that have an expiry set. `allkeys-random` evicts random keys.\n\nFor a dedicated cache, choose `allkeys-lru` (or `allkeys-lfu` if some keys are consistently popular). If the same Redis also holds data that must not be evicted, like sessions or locks without TTL, use a `volatile-*` policy, or better, separate instances.",
      points: [
        'Only applies when maxmemory is reached',
        'Default noeviction rejects writes',
        'allkeys-lru/lfu for caches',
        'volatile-* protects keys without TTL',
      ],
      difficulty: 'Advanced',
    },
    {
      id: 'spring-redis-q10',
      question: 'Why should you avoid the KEYS command in production, and what should you use instead?',
      answer: "`KEYS pattern` scans the entire keyspace in one go. Because Redis executes commands on a single thread, a `KEYS *` on millions of keys blocks every other client until it finishes, which can cause timeouts across your whole system.\n\nUse `SCAN` instead: it iterates with a cursor and returns a small batch per call, so other commands can run in between. In Spring use `redisTemplate.scan(ScanOptions.scanOptions().match(\"user:*\").count(100).build())`. Better still, design keys so you do not need pattern scans, for example keep related keys in a set.",
      points: [
        'KEYS is O(N) and blocks the single thread',
        'SCAN iterates incrementally with a cursor',
        'Design key structures to avoid scans',
      ],
      difficulty: 'Advanced',
    },
    {
      id: 'spring-redis-q11',
      question: 'How do you store HTTP sessions in Redis with Spring Boot, and why would you?',
      answer: "By default, the servlet container keeps HTTP sessions in the memory of one instance. With several instances behind a load balancer, a user whose next request goes to another instance loses their session, and all sessions are lost on restart. Sticky sessions are a workaround but make scaling and deployments harder.\n\nSpring Session with Redis stores sessions centrally. Add `spring-session-data-redis`, configure the Redis connection, and set `server.servlet.session.timeout`. Sessions are saved as Redis hashes with a TTL, any instance can serve any request, and your app instances become stateless.",
      points: [
        'In-memory sessions do not work well with multiple instances',
        'spring-session-data-redis stores sessions centrally',
        'Sessions expire through Redis TTL',
      ],
      difficulty: 'Intermediate',
    },
  ],
}

export default topic
