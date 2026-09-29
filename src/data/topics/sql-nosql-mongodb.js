const topic = {
  id: 'sql-nosql-mongodb',
  category: 'sql',
  title: 'NoSQL & MongoDB',
  description: "SQL vs NoSQL, the main NoSQL families, MongoDB documents, queries, embedding vs referencing, indexes, the aggregation pipeline, Spring Data MongoDB, transactions, replica sets and when to choose it.",
  difficulty: 'Intermediate',
  overview: "Relational databases store data in tables with a fixed schema and join them at query time. NoSQL (\"not only SQL\") databases trade some of that structure for flexibility, horizontal scale or speed for specific access patterns. There is no single NoSQL: document stores (MongoDB), key-value stores (Redis, DynamoDB), wide-column stores (Cassandra) and graph databases (Neo4j) solve very different problems.\n\nThink of a relational database as a set of spreadsheets linked by ID columns: to see an order with its items, you look up rows in several sheets. A document database is like a folder of complete order forms: each form contains the customer's name, the delivery address and every line item, so one read returns everything. That is fast and natural for the common case, but updating the customer's address on every form is harder.\n\nMongoDB is the most widely used document database and has first-class support in Spring Data. Interviewers ask when you would choose it over PostgreSQL, how you model data without joins, how indexes and the aggregation pipeline work, and what consistency guarantees it offers. Examples use an online shop with `orders`, `customers` and `products` collections.",

  subtopics: [
    {
      id: 'sql-vs-nosql',
      title: 'SQL vs NoSQL',
      explanation: "Relational (SQL) databases have a fixed schema, normalised tables, powerful joins and ad-hoc queries, and strong ACID transactions across any rows. They scale up well and scale out with replicas, but sharding writes is harder. They are the default for most business systems.\n\nNoSQL databases usually have a flexible or no schema, are designed around specific access patterns, often denormalise data, and many are built to scale out across many nodes from the start, sometimes with weaker (eventual) consistency by default. The choice is not about fashion: model your data and queries first, then choose the store that fits them. Many systems use both, for example PostgreSQL for orders and payments, Redis for caching and sessions, and Elasticsearch for search.",
      example: `                     Relational (PostgreSQL)          Document (MongoDB)
Data model           tables, rows, fixed columns       collections of JSON-like documents
Schema               defined up front, migrations      flexible, optional validation
Relationships        foreign keys + joins              embedding, references, $lookup
Transactions         ACID across any rows              atomic per document; multi-doc since 4.0
Scaling              vertical + read replicas          replica sets + built-in sharding
Query language       SQL (standardised)                MongoDB query API / aggregation
Best for             complex queries, strong integrity  evolving schemas, aggregate-shaped reads`,
      interviewPoints: [
        "SQL: fixed schema, joins, strong transactions.",
        "NoSQL: flexible schema, access-pattern driven, scale-out.",
        "Choose by data shape and queries, not hype.",
        "Polyglot persistence is common.",
      ],
    },
    {
      id: 'nosql-types',
      title: 'Types of NoSQL databases',
      explanation: "Document stores (MongoDB, Couchbase) store JSON-like documents that can be queried by any field; good for product catalogues, content and user profiles. Key-value stores (Redis, DynamoDB, Memcached) look up a value by its key extremely fast; good for caches, sessions, counters and shopping carts. Wide-column stores (Cassandra, ScyllaDB, HBase) organise data into partitions and are optimised for huge write volumes and time-series data, but you must design tables for each query. Graph databases (Neo4j) store nodes and relationships and excel at traversals such as social networks, recommendations and fraud detection.\n\nSearch engines (Elasticsearch, OpenSearch) are often grouped with NoSQL: they provide full-text search, relevance ranking and analytics, usually fed from a primary database.",
      example: `Document     { "_id": 1, "name": "Asha", "addresses": [ { "city": "Pune" } ] }
Key-value    SET session:9f2c "{userId: 1, roles: [CUSTOMER]}"  EX 1800
Wide-column  PRIMARY KEY ((sensor_id, day), ts)  -> all readings for a sensor-day in one partition
Graph        (Asha)-[:BOUGHT]->(Laptop)<-[:BOUGHT]-(Ravi)  "people who bought this also bought"
Search       GET /products/_search { "query": { "match": { "name": "wireless headphones" } } }`,
      interviewPoints: [
        "Document, key-value, wide-column, graph.",
        "Each is optimised for different access patterns.",
        "Search engines complement a primary store.",
      ],
    },
    {
      id: 'mongodb-basics',
      title: 'MongoDB documents and collections',
      explanation: "MongoDB stores documents in collections (roughly, rows in tables). A document is a BSON (binary JSON) object with fields that can hold strings, numbers, dates, arrays and nested documents. Every document has a unique `_id`, by default an `ObjectId`: a 12-byte value that contains a creation timestamp, so ObjectIds are roughly sortable by time.\n\nDocuments in the same collection do not have to share the same fields, which makes schema changes easy, but in practice you still keep a consistent shape per collection and can enforce it with JSON Schema validation. A single document is limited to 16 MB, which matters when arrays can grow without limit.",
      example: `// one order document: customer snapshot and line items embedded
{
  "_id": ObjectId("66f9a1c2e4b0a1b2c3d4e5f6"),
  "customerId": ObjectId("66f9a0f1e4b0a1b2c3d4e001"),
  "customerName": "Asha",
  "status": "PAID",
  "items": [
    { "sku": "KB-01", "name": "Keyboard", "qty": 1, "price": 49.99 },
    { "sku": "MS-02", "name": "Mouse",    "qty": 2, "price": 19.99 }
  ],
  "total": 89.97,
  "shippingAddress": { "city": "Pune", "zip": "411001" },
  "createdAt": ISODate("2026-09-29T10:15:00Z")
}`,
      interviewPoints: [
        "Collections of BSON documents.",
        "_id is required; ObjectId includes a timestamp.",
        "Flexible schema, optional JSON Schema validation.",
        "16 MB document size limit.",
      ],
    },
    {
      id: 'queries',
      title: 'Querying and updating documents',
      explanation: "Queries are documents too. `find` takes a filter and an optional projection; operators start with `$`: `$eq`, `$gt`, `$in`, `$and`, `$or`, `$exists`, `$regex`, `$elemMatch` for arrays. Dot notation reaches into nested fields and arrays: `\"items.sku\": \"KB-01\"` matches orders containing that item.\n\nUpdates use operators that modify documents in place and atomically per document: `$set`, `$unset`, `$inc`, `$push`, `$pull`, `$addToSet`. An update with `{ upsert: true }` inserts the document if nothing matches. Because each single-document update is atomic, patterns such as \"decrement stock only if enough is left\" can be done safely in one operation without a transaction.",
      example: `// find paid orders over 50, newest first, only some fields
db.orders.find(
  { status: "PAID", total: { $gt: 50 } },
  { customerName: 1, total: 1, createdAt: 1 }
).sort({ createdAt: -1 }).limit(20)

// orders containing a given product (array of sub-documents)
db.orders.find({ "items.sku": "KB-01" })

// atomic conditional update: reserve stock only if available
db.products.updateOne(
  { _id: "KB-01", stock: { $gte: 1 } },
  { $inc: { stock: -1 }, $set: { updatedAt: new Date() } }
)   // matchedCount 0 means out of stock

// add a tag once, remove another
db.products.updateOne({ _id: "KB-01" }, { $addToSet: { tags: "wireless" }, $pull: { tags: "wired" } })`,
      interviewPoints: [
        "Filters and projections are documents.",
        "Dot notation for nested fields and arrays.",
        "Update operators: $set, $inc, $push, $pull, $addToSet.",
        "Single-document updates are atomic.",
      ],
    },
    {
      id: 'embed-vs-reference',
      title: 'Data modelling: embedding vs referencing',
      explanation: "The central modelling rule is: data that is accessed together should be stored together. Embed related data in the parent document when it is read with the parent, belongs to it (one-to-few), and is bounded in size: order line items, a user's addresses, a product's attributes. One read then returns everything, and updates to the whole aggregate are atomic.\n\nReference (store the other document's `_id`) when the related data is large or unbounded (a product's millions of reviews), shared by many parents and updated independently (the current customer profile), or queried on its own. A common hybrid is the extended reference: store the referenced id plus the few fields you need to display (customer name on the order), accepting that the copy may become stale. Avoid unbounded arrays inside documents; they approach the 16 MB limit and make updates slow.",
      example: `// EMBED: items belong to the order and are always read with it
{ "_id": 1, "status": "PAID", "items": [ { "sku": "KB-01", "qty": 1 } ] }

// REFERENCE: reviews are unbounded and read separately
// products:  { "_id": "KB-01", "name": "Keyboard", "avgRating": 4.6, "reviewCount": 1873 }
// reviews:   { "_id": ..., "productId": "KB-01", "rating": 5, "text": "Great" }

// EXTENDED REFERENCE: id plus a snapshot of display fields
{ "_id": 1, "customer": { "id": ObjectId("..."), "name": "Asha" }, "items": [ ... ] }

// ANTI-PATTERN: unbounded array
{ "_id": "KB-01", "reviews": [ /* grows forever -> 16 MB limit */ ] }`,
      interviewPoints: [
        "Store together what is read together.",
        "Embed one-to-few, owned, bounded data.",
        "Reference large, shared or unbounded data.",
        "Extended references trade freshness for fewer lookups.",
      ],
    },
    {
      id: 'indexes',
      title: 'Indexes in MongoDB',
      explanation: "Without an index, MongoDB scans every document in the collection (COLLSCAN). Indexes are B-trees, just as in relational databases. MongoDB supports single-field and compound indexes, multikey indexes (automatically created when you index an array field, one entry per element), unique indexes, partial indexes, TTL indexes (documents expire automatically after a time, ideal for sessions and tokens), text indexes and geospatial indexes.\n\nFor compound indexes, follow the ESR rule: put fields used for Equality first, then fields used for Sort, then fields used in Range filters. Use `explain(\"executionStats\")` to check that a query uses an index (IXSCAN) and how many documents it examined compared with how many it returned.",
      example: `// compound index following ESR: equality (status), sort (createdAt), range (total)
db.orders.createIndex({ status: 1, createdAt: -1, total: 1 })

db.orders.find({ status: "PAID", total: { $gt: 50 } }).sort({ createdAt: -1 })
  .explain("executionStats")
// winningPlan: IXSCAN { status: 1, createdAt: -1, total: 1 }
// totalDocsExamined should be close to nReturned

db.users.createIndex({ email: 1 }, { unique: true })
db.orders.createIndex({ "items.sku": 1 })                              // multikey
db.sessions.createIndex({ createdAt: 1 }, { expireAfterSeconds: 1800 }) // TTL: auto-delete`,
      interviewPoints: [
        "No index means a collection scan.",
        "Compound, multikey, unique, partial, TTL, text.",
        "ESR rule: Equality, Sort, Range.",
        "Verify with explain(\"executionStats\").",
      ],
    },
    {
      id: 'aggregation',
      title: 'The aggregation pipeline',
      explanation: "The aggregation pipeline processes documents through a sequence of stages, each transforming the stream: `$match` filters (put it first so it can use indexes), `$project` or `$addFields` reshape documents, `$unwind` turns an array into one document per element, `$group` aggregates (like SQL GROUP BY with `$sum`, `$avg`, `$max`), `$sort` and `$limit` order and trim, and `$lookup` performs a left outer join with another collection.\n\nIt is MongoDB's equivalent of SQL's GROUP BY, joins and window functions, and it is how reports and analytics are written. Pipelines are limited to 100 MB of memory per stage unless `allowDiskUse` is enabled. Frequent heavy use of `$lookup` is a sign the data might be better modelled by embedding, or better stored in a relational database.",
      example: `// top 5 customers by paid revenue this year, with the customer name
db.orders.aggregate([
  { $match: { status: "PAID", createdAt: { $gte: ISODate("2026-01-01") } } },
  { $group: { _id: "$customerId", revenue: { $sum: "$total" }, orders: { $sum: 1 } } },
  { $sort: { revenue: -1 } },
  { $limit: 5 },
  { $lookup: { from: "customers", localField: "_id", foreignField: "_id", as: "customer" } },
  { $unwind: "$customer" },
  { $project: { _id: 0, name: "$customer.name", revenue: 1, orders: 1 } }
])

// best-selling products: unwind the items array first
db.orders.aggregate([
  { $unwind: "$items" },
  { $group: { _id: "$items.sku", unitsSold: { $sum: "$items.qty" } } },
  { $sort: { unitsSold: -1 } },
  { $limit: 10 }
])`,
      interviewPoints: [
        "Stages: $match, $group, $sort, $project, $unwind, $lookup.",
        "$match early to use indexes.",
        "$lookup is a left outer join.",
        "Heavy $lookup use suggests remodelling.",
      ],
    },
    {
      id: 'spring-data-mongodb',
      title: 'Spring Data MongoDB',
      explanation: "Add `spring-boot-starter-data-mongodb` and set `spring.data.mongodb.uri`. Map classes with `@Document(collection = ...)`, `@Id` (a String or ObjectId is converted automatically), `@Field` to rename fields and `@Indexed` / `@CompoundIndex` for indexes. Note that automatic index creation from annotations is disabled by default since Spring Data MongoDB 3.0; enable it with `spring.data.mongodb.auto-index-creation=true` or, better, create indexes explicitly in a migration tool such as Mongock.\n\n`MongoRepository` gives CRUD, paging and derived queries (`findByStatusAndTotalGreaterThan`), and `@Query` accepts a JSON filter. For dynamic queries, partial updates and aggregations, inject `MongoTemplate` and use `Criteria`, `Update` and `Aggregation`. Auditing annotations (`@CreatedDate`, `@LastModifiedDate`) and optimistic locking with `@Version` work as in JPA.",
      example: `@Document(collection = "orders")
@CompoundIndex(name = "status_created", def = "{'status': 1, 'createdAt': -1}")
public class Order {
    @Id private String id;
    @Indexed private String customerId;
    private String status;
    private List<OrderItem> items;          // embedded
    private BigDecimal total;
    @CreatedDate private Instant createdAt;
    @Version private Long version;
}

public interface OrderRepository extends MongoRepository<Order, String> {
    List<Order> findByCustomerIdOrderByCreatedAtDesc(String customerId);
    Page<Order> findByStatus(String status, Pageable pageable);

    @Query("{ 'items.sku': ?0, 'status': 'PAID' }")
    List<Order> paidOrdersContaining(String sku);
}

// MongoTemplate for atomic partial updates and aggregations
public boolean reserve(String sku) {
    Query q = Query.query(Criteria.where("_id").is(sku).and("stock").gte(1));
    Update u = new Update().inc("stock", -1);
    return mongoTemplate.updateFirst(q, u, Product.class).getModifiedCount() == 1;
}

public List<CustomerRevenue> topCustomers() {
    Aggregation agg = Aggregation.newAggregation(
        Aggregation.match(Criteria.where("status").is("PAID")),
        Aggregation.group("customerId").sum("total").as("revenue"),
        Aggregation.sort(Sort.Direction.DESC, "revenue"),
        Aggregation.limit(5));
    return mongoTemplate.aggregate(agg, "orders", CustomerRevenue.class).getMappedResults();
}`,
      interviewPoints: [
        "@Document, @Id, @Field, @Indexed, @CompoundIndex.",
        "Auto index creation is off by default.",
        "MongoRepository for CRUD and derived queries.",
        "MongoTemplate for dynamic queries, updates, aggregations.",
      ],
    },
    {
      id: 'transactions',
      title: 'Atomicity and transactions',
      explanation: "In MongoDB, every operation on a single document is atomic, including updates to its embedded arrays and sub-documents. Because a well-designed document often contains a whole aggregate (an order with its items), many use cases need no multi-document transaction at all.\n\nSince MongoDB 4.0 (replica sets) and 4.2 (sharded clusters), multi-document ACID transactions are available for cases that do span documents, such as transferring credit between two wallets. They require a replica set (even a single-node one in development), have a default time limit of 60 seconds, and cost more than single-document writes, so they should be the exception rather than the rule. In Spring, Boot does not auto-configure a transaction manager for MongoDB: declare a `MongoTransactionManager` bean, after which `@Transactional` works.",
      example: `@Configuration
public class MongoConfig {
    @Bean
    MongoTransactionManager transactionManager(MongoDatabaseFactory factory) {
        return new MongoTransactionManager(factory);
    }
}

@Service
public class WalletService {

    private final MongoTemplate mongo;

    public WalletService(MongoTemplate mongo) { this.mongo = mongo; }

    @Transactional
    public void transfer(String fromId, String toId, long amount) {
        UpdateResult debit = mongo.updateFirst(
            Query.query(Criteria.where("_id").is(fromId).and("balance").gte(amount)),
            new Update().inc("balance", -amount), Wallet.class);
        if (debit.getModifiedCount() == 0) {
            throw new InsufficientFundsException(fromId);    // rolls back
        }
        mongo.updateFirst(Query.query(Criteria.where("_id").is(toId)),
            new Update().inc("balance", amount), Wallet.class);
    }
}`,
      interviewPoints: [
        "Single-document operations are always atomic.",
        "Model aggregates as documents to avoid transactions.",
        "Multi-document transactions need a replica set.",
        "Declare MongoTransactionManager for @Transactional.",
      ],
    },
    {
      id: 'replication-sharding',
      title: 'Replica sets, write concern, read preference and sharding',
      explanation: "A replica set is a primary plus secondaries that replicate its operation log. If the primary fails, the members elect a new primary within seconds, and drivers reconnect automatically. Write concern controls when a write is acknowledged: `w: 1` (primary only) is faster, `w: \"majority\"` (the default in modern MongoDB) waits until most members have it, so it survives a failover. Read preference chooses where reads go: `primary` (default, freshest) or `secondary`/`nearest` (scales reads but may be stale).\n\nSharding splits a collection across multiple replica sets by a shard key, with `mongos` routers directing queries. The shard key is the most important decision: it should have high cardinality, spread writes evenly, and appear in most queries so they target a single shard. A monotonically increasing key such as a timestamp or ObjectId sends all inserts to one shard; hashed sharding avoids that hotspot.",
      example: `# connection string with a replica set, majority writes, reads from primary
spring:
  data:
    mongodb:
      uri: mongodb://m1:27017,m2:27017,m3:27017/shop?replicaSet=rs0&w=majority&readPreference=primary

// shard orders by hashed customerId: even distribution, customer queries hit one shard
sh.enableSharding("shop")
sh.shardCollection("shop.orders", { customerId: "hashed" })

// BAD shard key: { createdAt: 1 } -> every new order goes to the same shard`,
      interviewPoints: [
        "Replica set: primary, secondaries, automatic failover.",
        "Write concern majority survives failover.",
        "Secondary reads scale but may be stale.",
        "Shard key: high cardinality, even writes, in most queries.",
      ],
    },
    {
      id: 'when-mongodb',
      title: 'When to choose MongoDB (and when not)',
      explanation: "MongoDB fits well when data is naturally aggregate-shaped and read as a whole (product catalogues with varied attributes, content management, user profiles and preferences, event and IoT data), when the schema evolves quickly or differs between records, when you need built-in horizontal scaling, or when the application works with JSON end to end.\n\nA relational database is usually the better choice when data is highly relational and queried in many different ways with joins, when you need complex transactions across many entities (accounting, inventory with strict integrity), when reporting relies on ad-hoc SQL, or when the team and tools are built around SQL. PostgreSQL's JSONB columns also give you document-style flexibility inside a relational database, which is often enough.",
      example: `Good MongoDB fits                         Better in PostgreSQL
-------------------------------------     ----------------------------------------
Product catalogue with varied attributes  Double-entry accounting, payments
CMS pages and blocks                      Inventory with strict constraints
User profiles and settings                Many-to-many heavy data, ad-hoc joins
Event logs, IoT readings                  BI reporting in SQL
Rapidly evolving prototypes               Team and tooling built on SQL

-- PostgreSQL middle ground: document column inside a relational table
CREATE TABLE products (id BIGSERIAL PRIMARY KEY, name TEXT, attributes JSONB);
CREATE INDEX ON products USING GIN (attributes);
SELECT * FROM products WHERE attributes @> '{"color": "black"}';`,
      interviewPoints: [
        "MongoDB: aggregate-shaped, evolving schema, scale-out.",
        "Relational: many joins, strict integrity, ad-hoc SQL.",
        "PostgreSQL JSONB as a middle ground.",
        "Decide from access patterns and consistency needs.",
      ],
    },
  ],

  commonMistakes: [
    "Choosing MongoDB because it is \"schemaless\" and then struggling with inconsistent documents; still design and validate a schema.",
    "Modelling MongoDB collections exactly like normalised SQL tables and then using $lookup everywhere.",
    "Embedding unbounded arrays (all reviews, all log entries) that grow toward the 16 MB document limit.",
    "Forgetting indexes, so queries do collection scans; not checking explain().",
    "Ordering compound index fields without the ESR rule.",
    "Expecting @Indexed annotations to create indexes automatically in Spring Data MongoDB 3+.",
    "Expecting @Transactional to work without a MongoTransactionManager bean or a replica set.",
    "Using multi-document transactions for everything instead of modelling aggregates as single documents.",
    "Reading from secondaries and being surprised by stale data.",
    "Choosing a monotonically increasing shard key, which sends all writes to one shard.",
    "Performing read-then-write updates instead of atomic update operators such as $inc with a condition.",
  ],

  interviewTips: [
    "Start the SQL vs NoSQL answer with access patterns and consistency needs, not with \"NoSQL scales better\".",
    "Explain embedding vs referencing with a concrete example: order items embedded, reviews referenced.",
    "Mention that single-document operations are atomic and that good modelling reduces the need for transactions.",
    "Know the ESR rule for compound indexes and how to read explain() output.",
    "Be able to write a short aggregation pipeline: $match, $group, $sort, $limit.",
    "Show the Spring side: @Document, MongoRepository, MongoTemplate with Criteria and Update.",
  ],

  interviewQuestions: [
    {
      id: 'sql-nosql-mongodb-q1',
      question: "What are the differences between SQL and NoSQL databases? How do you choose?",
      answer: "Relational databases store data in tables with a predefined schema, normalise it to avoid duplication, use joins at query time and provide ACID transactions across any rows, with SQL as a standard, expressive query language. NoSQL databases cover several models: document, key-value, wide-column and graph. They usually have flexible schemas, are designed around specific access patterns with denormalised data, and many scale horizontally by design, sometimes with eventual consistency by default. To choose, start from the data and its access patterns: if data is highly relational, queried in many ad-hoc ways and needs strict integrity, choose relational; if it is aggregate-shaped, read by key or as a whole document, has a variable schema, or needs massive scale-out, a NoSQL store may fit better. Many systems combine both.",
      points: [
        "Schema, relationships and query model differ.",
        "Transactions and consistency trade-offs.",
        "Scaling approach.",
        "Choose from access patterns; polyglot is fine.",
      ],
      difficulty: 'Beginner',
    },
    {
      id: 'sql-nosql-mongodb-q2',
      question: "When would you embed documents and when would you reference them in MongoDB?",
      answer: "Embed when the related data is read together with the parent, is owned by it, and has a bounded, small size: one-to-few relationships such as order line items, addresses or product variants. You get the whole aggregate in one read and atomic updates. Reference when the related data is large or grows without bound (reviews, comments, events), is shared by many parents and changes independently (customer or product master data), or is frequently queried on its own. A common hybrid is the extended reference: store the id along with a few frequently displayed fields, accepting that the copy can become stale or updating it asynchronously. Avoid unbounded arrays, because documents are limited to 16 MB and large arrays make updates expensive.",
      points: [
        "Embed: read together, owned, bounded.",
        "Reference: large, unbounded, shared, independent.",
        "Extended reference hybrid.",
        "16 MB limit and unbounded arrays.",
      ],
      difficulty: 'Intermediate',
    },
    {
      id: 'sql-nosql-mongodb-q3',
      question: "Does MongoDB support transactions?",
      answer: "Every single-document operation in MongoDB is atomic, including changes to embedded arrays and sub-documents, so modelling an aggregate as one document often removes the need for transactions. Since version 4.0, MongoDB supports multi-document ACID transactions on replica sets, and since 4.2 on sharded clusters. They provide snapshot isolation and all-or-nothing commits, but they have a default 60-second limit, add overhead and should not be the default way of working. In Spring Data MongoDB you must register a MongoTransactionManager bean, because Spring Boot does not auto-configure one, and then use @Transactional; the database must run as a replica set, even a single-node one in development or tests.",
      points: [
        "Single-document operations are atomic.",
        "Multi-document transactions since 4.0.",
        "Requires a replica set; has overhead.",
        "MongoTransactionManager + @Transactional.",
      ],
      difficulty: 'Intermediate',
    },
    {
      id: 'sql-nosql-mongodb-q4',
      question: "How do indexes work in MongoDB, and what is the ESR rule?",
      answer: "MongoDB indexes are B-tree structures on one or more fields, like relational indexes. Without a suitable index, a query performs a collection scan. Index types include single-field, compound, multikey (automatically used for array fields, with one entry per element), unique, partial, TTL (automatically deleting documents after a period), text and geospatial. The ESR rule guides field order in compound indexes: first fields tested for Equality, then fields used for Sort, then fields used in Range conditions such as $gt or $lt. This lets the index narrow to exact matches, return documents already sorted and then scan the range, avoiding in-memory sorts. Check with explain(\"executionStats\") that the plan is an IXSCAN and that documents examined are close to documents returned.",
      example: `db.orders.createIndex({ status: 1, createdAt: -1, total: 1 })
// find({ status: "PAID", total: { $gt: 50 } }).sort({ createdAt: -1 })`,
      points: [
        "B-tree indexes; otherwise COLLSCAN.",
        "Compound, multikey, unique, TTL, text.",
        "ESR: Equality, Sort, Range.",
        "Verify with explain().",
      ],
      difficulty: 'Intermediate',
    },
    {
      id: 'sql-nosql-mongodb-q5',
      question: "What is the aggregation pipeline? Give an example.",
      answer: "The aggregation pipeline processes documents through an ordered list of stages, where each stage transforms the documents it receives and passes the results on. Common stages are $match to filter, $project and $addFields to reshape, $unwind to flatten arrays, $group to aggregate with accumulators like $sum and $avg, $sort, $limit and $skip, and $lookup for left outer joins with another collection. It is used for reporting and analytics, similar to SQL's GROUP BY, joins and computed columns. Put $match as early as possible so it can use indexes and reduce the documents flowing through later stages, and be aware of the 100 MB per-stage memory limit unless allowDiskUse is set.",
      example: `db.orders.aggregate([
  { $match: { status: "PAID" } },
  { $group: { _id: "$customerId", revenue: { $sum: "$total" } } },
  { $sort: { revenue: -1 } },
  { $limit: 5 }
])`,
      points: [
        "Ordered stages transform a stream of documents.",
        "$match, $group, $sort, $project, $unwind, $lookup.",
        "$match early for indexes.",
        "Memory limits per stage.",
      ],
      difficulty: 'Intermediate',
    },
    {
      id: 'sql-nosql-mongodb-q6',
      question: "What is the difference between MongoRepository and MongoTemplate in Spring Data MongoDB?",
      answer: "MongoRepository is the repository abstraction: you declare an interface and get CRUD operations, paging and sorting, derived queries from method names such as findByStatusAndTotalGreaterThan, and @Query methods with JSON filters, without writing implementation code. It is ideal for straightforward access by id or simple criteria. MongoTemplate is the lower-level, more flexible API: you build queries with Criteria, perform partial and atomic updates with the Update class (such as $inc with a condition), use upserts, run aggregation pipelines with the Aggregation API, and work with bulk operations. Many applications use both, and a custom repository fragment can combine them.",
      points: [
        "Repository: declarative CRUD and derived queries.",
        "Template: Criteria, Update, Aggregation, bulk ops.",
        "Use template for atomic partial updates.",
        "Combine via custom repository fragments.",
      ],
      difficulty: 'Beginner',
    },
    {
      id: 'sql-nosql-mongodb-q7',
      question: "How would you prevent overselling stock in MongoDB without a transaction?",
      answer: "Use a single atomic conditional update on the product document: filter on the product id and on stock being greater than or equal to the requested quantity, and apply $inc with the negative quantity. MongoDB evaluates the filter and applies the update atomically for that document, so two concurrent requests cannot both succeed when only one unit is left: the second one matches no document. Check the matched or modified count to decide whether the reservation succeeded. This avoids the race condition of reading the stock, checking it in Java and then writing it back. If the order and the stock change must be atomic together, either embed the reservation in the product document, use a multi-document transaction, or use a saga with compensation.",
      example: `Query q = Query.query(Criteria.where("_id").is(sku).and("stock").gte(qty));
boolean reserved = mongoTemplate.updateFirst(q, new Update().inc("stock", -qty), Product.class)
                                .getModifiedCount() == 1;`,
      points: [
        "Conditional filter + $inc in one operation.",
        "Single-document atomicity prevents the race.",
        "Check matched/modified count.",
        "Avoid read-check-write in application code.",
      ],
      difficulty: 'Advanced',
    },
    {
      id: 'sql-nosql-mongodb-q8',
      question: "Explain replica sets, write concern and read preference in MongoDB.",
      answer: "A replica set is a group of MongoDB servers holding the same data: one primary that accepts writes and secondaries that replicate its oplog. If the primary becomes unavailable, the remaining members elect a new primary automatically, usually within seconds. Write concern defines how many members must acknowledge a write before it is considered successful: w:1 means only the primary, which is faster but can lose writes on failover, while w:\"majority\", the default in modern versions, guarantees the write survives a primary failure. Read preference defines where reads go: primary (default, always the latest data), primaryPreferred, secondary, secondaryPreferred or nearest. Reading from secondaries spreads load and can reduce latency across regions, but results may be stale because of replication lag.",
      points: [
        "Primary + secondaries with automatic failover.",
        "Write concern: w:1 vs majority.",
        "Read preference: primary vs secondaries.",
        "Secondary reads may be stale.",
      ],
      difficulty: 'Intermediate',
    },
    {
      id: 'sql-nosql-mongodb-q9',
      question: "How do you choose a good shard key?",
      answer: "The shard key determines how documents are distributed across shards and how queries are routed, and changing it later is costly. A good shard key has high cardinality (many distinct values), distributes writes evenly so no single shard becomes a hotspot, and is included in most queries so that mongos can target one shard instead of broadcasting to all. Monotonically increasing keys such as timestamps or ObjectIds are poor choices for ranged sharding because every new document goes to the same shard; hashed sharding on such a field spreads writes but makes range queries scatter. A compound key, such as customerId plus orderDate, can combine good distribution with efficient queries for one customer's orders. Low-cardinality fields such as status or country lead to jumbo chunks that cannot be split.",
      points: [
        "High cardinality and even write distribution.",
        "Present in most queries for targeted routing.",
        "Avoid monotonically increasing ranged keys.",
        "Hashed vs ranged vs compound keys.",
      ],
      difficulty: 'Advanced',
    },
  ],
}

export default topic
