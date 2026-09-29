const topic = {
  id: 'sql-indexes',
  category: 'sql',
  title: 'Indexes',
  description: "How indexes speed up lookups: B-trees, composite, unique, covering and partial indexes, when they hurt, and reading EXPLAIN plans.",
  difficulty: 'Intermediate',
  overview: "An index is a separate data structure that helps the database find rows quickly without reading the whole table. Without an index, finding an employee by email means checking every row (a sequential scan). With an index on email, the database jumps almost straight to the right row.\n\nIt works like the index at the back of a textbook. Instead of reading every page to find \"transactions\", you look it up alphabetically in the index and go straight to page 212. The index costs extra pages and must be updated whenever the book changes, which is exactly the trade-off in databases: faster reads, slower writes and more storage.\n\nIndexes are the number one tool for fixing slow queries in a Spring Boot application. Examples use `employees(id, name, email, salary, department_id, manager_id)`, `departments(id, name)`, `customers(id, name, email, city)` and `orders(id, customer_id, amount, status, created_at)`.",

  subtopics: [
    {
      id: 'what-is-an-index',
      title: 'What is an index?',
      explanation: "An index stores the values of one or more columns in a sorted, searchable structure, with a pointer to where each row lives in the table (in PostgreSQL, a tuple id, or TID). Queries that filter, join or sort on those columns can use the index instead of scanning every row.\n\nPostgreSQL automatically creates an index for every PRIMARY KEY and UNIQUE constraint. All other indexes you create yourself.",
      example: `CREATE INDEX idx_employees_department_id ON employees (department_id);

-- can now use the index
SELECT * FROM employees WHERE department_id = 3;

-- list indexes of a table in psql:  \\d employees
DROP INDEX idx_employees_department_id;`,
      interviewPoints: [
        "Index = sorted copy of column values + pointers to rows.",
        "PK and UNIQUE constraints create indexes automatically.",
        "Speeds up WHERE, JOIN, ORDER BY and MIN/MAX.",
      ],
    },
    {
      id: 'b-tree',
      title: 'B-tree indexes and how lookups work',
      explanation: "The default index type is the B-tree (balanced tree). The root page points to internal pages, which point to leaf pages holding the sorted keys and row pointers. Because the tree stays balanced, finding a key takes only a few page reads, even for millions of rows (the cost grows logarithmically, O(log n)). Leaf pages are linked, so range scans (`BETWEEN`, `>`, `ORDER BY`) just walk along the leaves.\n\nB-trees support `=`, `<`, `<=`, `>`, `>=`, `BETWEEN`, `IN`, `IS NULL` and prefix `LIKE 'abc%'` (with the right collation or `text_pattern_ops`). Other PostgreSQL types: Hash (equality only), GIN (JSONB, arrays, full-text), GiST (geometric, ranges) and BRIN (very large, naturally ordered tables like logs).",
      example: `-- B-tree is the default
CREATE INDEX idx_orders_created_at ON orders (created_at);

-- range query walks the leaf pages
SELECT * FROM orders
WHERE created_at >= '2026-01-01' AND created_at < '2026-02-01';

-- other index types
CREATE INDEX idx_events_payload ON events USING GIN (payload);
CREATE INDEX idx_logs_time      ON logs   USING BRIN (logged_at);`,
      interviewPoints: [
        "B-tree lookups are O(log n): root, internal, leaf, then heap.",
        "B-trees handle equality, ranges and sorting.",
        "GIN for JSONB/arrays/full-text; BRIN for huge append-only tables.",
      ],
    },
    {
      id: 'index-scan-types',
      title: 'Scan types: Seq Scan, Index Scan, Index Only Scan, Bitmap Scan',
      explanation: "A Seq Scan reads the whole table; it is actually best when a query needs a large fraction of rows. An Index Scan walks the index and fetches each matching row from the table (the heap). An Index Only Scan answers the query from the index alone, without touching the heap. A Bitmap Index Scan collects matching row locations first, then a Bitmap Heap Scan reads them in physical order; it is used for medium-sized result sets and for combining several indexes.",
      example: `EXPLAIN SELECT * FROM employees WHERE id = 5;
-- Index Scan using employees_pkey on employees

EXPLAIN SELECT * FROM employees WHERE salary > 0;
-- Seq Scan on employees (almost every row matches)`,
      interviewPoints: [
        "Seq Scan is not always bad; for many rows it is fastest.",
        "Index Only Scan needs all columns in the index and an up-to-date visibility map (VACUUM).",
      ],
    },
    {
      id: 'composite-indexes',
      title: 'Composite indexes and column order',
      explanation: "A composite (multi-column) index covers several columns, sorted by the first column, then by the second within equal first values, and so on, like a phone book sorted by last name then first name. Because of this, the index is useful for queries that filter on a leftmost prefix of its columns. An index on `(department_id, salary)` helps `WHERE department_id = 3` and `WHERE department_id = 3 AND salary > 50000`, but not `WHERE salary > 50000` alone.\n\nGood column order: columns used with equality first, then columns used for ranges or sorting.",
      example: `CREATE INDEX idx_orders_customer_created
  ON orders (customer_id, created_at DESC);

-- uses the index fully: equality then sort
SELECT * FROM orders
WHERE customer_id = 42
ORDER BY created_at DESC
LIMIT 10;

-- cannot use it efficiently: skips the first column
SELECT * FROM orders WHERE created_at > now() - interval '1 day';`,
      interviewPoints: [
        "Leftmost-prefix rule.",
        "Equality columns first, range/sort columns last.",
        "One composite index can replace several single-column ones.",
      ],
    },
    {
      id: 'unique-indexes',
      title: 'Unique indexes',
      explanation: "A unique index enforces that no two rows have the same value (or combination of values) in the indexed columns, and it also speeds up lookups. A UNIQUE constraint is implemented with a unique index. Unique indexes can be built on expressions, such as `LOWER(email)`, for case-insensitive uniqueness, or be partial, such as unique only among active rows.",
      example: `CREATE UNIQUE INDEX uq_employees_email_lower
  ON employees (LOWER(email));

-- only one active subscription per customer
CREATE UNIQUE INDEX uq_active_subscription
  ON subscriptions (customer_id)
  WHERE status = 'ACTIVE';`,
      interviewPoints: [
        "Enforces uniqueness and speeds up lookups.",
        "Expression indexes need the query to use the same expression.",
        "Multiple NULLs are allowed unless NULLS NOT DISTINCT is specified.",
      ],
    },
    {
      id: 'covering-indexes',
      title: 'Covering indexes',
      explanation: "A covering index contains every column a query needs, so PostgreSQL can answer with an Index Only Scan and never read the table. PostgreSQL 11+ has `INCLUDE`, which stores extra columns in the leaf pages without making them part of the search key. This keeps the key small while still covering the query.",
      example: `CREATE INDEX idx_orders_customer_incl
  ON orders (customer_id) INCLUDE (amount, status);

-- all needed columns are in the index: Index Only Scan
SELECT amount, status
FROM orders
WHERE customer_id = 42;`,
      interviewPoints: [
        "Covering = query satisfied from the index alone.",
        "INCLUDE adds payload columns that are not searchable.",
        "Index Only Scan still depends on the visibility map being current.",
      ],
    },
    {
      id: 'partial-indexes',
      title: 'Partial indexes',
      explanation: "A partial index only indexes rows that match a WHERE condition. It is smaller, faster to maintain and fits better in memory. It is ideal when queries target a small subset, such as pending orders or non-deleted rows. The query's WHERE must imply the index condition for the planner to use it.",
      example: `CREATE INDEX idx_orders_pending
  ON orders (created_at)
  WHERE status = 'PENDING';

-- uses the partial index
SELECT * FROM orders
WHERE status = 'PENDING'
ORDER BY created_at
LIMIT 50;`,
      interviewPoints: [
        "Indexes only a subset of rows.",
        "Great for soft deletes and status queues.",
        "The query condition must match the index predicate.",
      ],
    },
    {
      id: 'when-indexes-hurt',
      title: 'When indexes hurt or are not used',
      explanation: "Every index slows down INSERT, UPDATE and DELETE, because the index must be updated too, and it uses disk and memory. Unused or duplicate indexes are pure cost.\n\nIndexes are also skipped when they cannot help: low-selectivity columns (like a boolean where half the rows are true), wrapping the column in a function (`WHERE LOWER(email) = ...` without an expression index), leading wildcards (`LIKE '%son'`), type mismatches, a composite index whose first column is not filtered, or tiny tables where a Seq Scan is cheaper.",
      example: `-- index on email is NOT used
SELECT * FROM employees WHERE LOWER(email) = 'asha@example.com';
SELECT * FROM employees WHERE email LIKE '%@example.com';

-- fix the first with an expression index
CREATE INDEX idx_emp_email_lower ON employees (LOWER(email));

-- find unused indexes
SELECT relname, indexrelname, idx_scan
FROM pg_stat_user_indexes
WHERE idx_scan = 0;`,
      interviewPoints: [
        "Indexes trade write speed and storage for read speed.",
        "Functions on columns, leading wildcards and low selectivity defeat indexes.",
        "pg_stat_user_indexes shows how often each index is used.",
      ],
    },
    {
      id: 'explain-analyze',
      title: 'EXPLAIN and EXPLAIN ANALYZE',
      explanation: "`EXPLAIN` shows the plan the optimizer intends to use, with estimated cost and row counts. `EXPLAIN ANALYZE` actually runs the query and adds real timing and real row counts, so you can see where time is spent and whether estimates are wrong. Add `BUFFERS` to see how many pages were read from cache or disk.\n\nRead a plan from the innermost (most indented) node outwards. Look for Seq Scans on large tables, big differences between estimated and actual rows (run `ANALYZE` to refresh statistics), and expensive sorts or nested loops. Remember that EXPLAIN ANALYZE really executes the statement, so wrap an UPDATE or DELETE in a transaction and roll it back.",
      example: `EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM orders
WHERE customer_id = 42
ORDER BY created_at DESC
LIMIT 10;

-- Limit  (cost=0.43..8.95 rows=10) (actual time=0.03..0.05 rows=10 loops=1)
--   ->  Index Scan using idx_orders_customer_created on orders
--         Index Cond: (customer_id = 42)
-- Planning Time: 0.1 ms
-- Execution Time: 0.07 ms

BEGIN;
EXPLAIN ANALYZE DELETE FROM orders WHERE status = 'CANCELLED';
ROLLBACK;`,
      interviewPoints: [
        "EXPLAIN = estimated plan; EXPLAIN ANALYZE = runs it with real numbers.",
        "Compare estimated rows vs actual rows.",
        "Run ANALYZE to update planner statistics.",
      ],
    },
    {
      id: 'index-on-foreign-keys',
      title: 'Indexing foreign keys',
      explanation: "PostgreSQL indexes the referenced primary key automatically, but not the foreign key column in the child table. Without an index on `orders.customer_id`, joins from customers to orders are slow, and deleting or updating a customer forces a full scan of orders to check for referencing rows. As a rule, index foreign key columns that are used in joins or whose parent rows get deleted.",
      example: `CREATE INDEX idx_orders_customer_id    ON orders (customer_id);
CREATE INDEX idx_employees_manager_id  ON employees (manager_id);

-- build without blocking writes on a busy production table
CREATE INDEX CONCURRENTLY idx_employees_dept ON employees (department_id);`,
      interviewPoints: [
        "PostgreSQL does not auto-index FK columns (MySQL InnoDB does).",
        "Missing FK indexes slow joins and parent deletes.",
        "Use CREATE INDEX CONCURRENTLY in production to avoid blocking writes.",
      ],
    },
  ],

  commonMistakes: [
    "Adding an index on every column \"just in case\", which slows down every write and wastes memory.",
    "Creating a composite index in the wrong column order, so the most common query cannot use it.",
    "Wrapping an indexed column in a function, such as `WHERE DATE(created_at) = ...`, instead of using a range or an expression index.",
    "Forgetting to index foreign key columns like `orders.customer_id` in PostgreSQL.",
    "Assuming a Seq Scan in EXPLAIN is always wrong; for small tables or large result sets it is the right choice.",
    "Running EXPLAIN ANALYZE on a DELETE or UPDATE outside a transaction and actually changing data.",
    "Creating an index with plain CREATE INDEX on a busy production table and blocking writes; use CONCURRENTLY.",
  ],

  interviewTips: [
    "Start with the book index analogy, then explain the B-tree and O(log n) lookups.",
    "Always mention the trade-off: faster reads, slower writes, more storage.",
    "When asked to speed up a query, say you would run EXPLAIN ANALYZE first, then choose an index that matches the WHERE and ORDER BY.",
    "Explain the leftmost-prefix rule with a concrete two-column example.",
    "Link to Spring Boot: slow repository methods or N+1 queries are often fixed with the right index, and JPA can declare them with `@Table(indexes = ...)`, though migrations (Flyway/Liquibase) are better.",
  ],

  interviewQuestions: [
    {
      id: 'sql-indexes-q1',
      question: "What is an index and why do we use it?",
      answer: "An index is a separate data structure, usually a B-tree, that stores column values in sorted order with pointers to the table rows. It lets the database find matching rows in a few page reads instead of scanning the whole table, which speeds up WHERE filters, joins, ORDER BY and MIN/MAX. The cost is extra storage and slower writes, because each INSERT, UPDATE and DELETE must also update the index.",
      example: `CREATE INDEX idx_employees_email ON employees (email);
SELECT * FROM employees WHERE email = 'asha@example.com';`,
      points: [
        "Like a book index.",
        "Faster reads, slower writes.",
        "B-tree is the default type.",
      ],
      difficulty: 'Beginner',
    },
    {
      id: 'sql-indexes-q2',
      question: "Which indexes does PostgreSQL create automatically?",
      answer: "PostgreSQL automatically creates a unique B-tree index for every PRIMARY KEY and every UNIQUE constraint (and for exclusion constraints). It does not create indexes on foreign key columns, and it does not create indexes for columns you frequently filter on; those you must add yourself.",
      points: [
        "PRIMARY KEY and UNIQUE get indexes.",
        "Foreign keys do not.",
        "Check with \\d table in psql.",
      ],
      difficulty: 'Beginner',
    },
    {
      id: 'sql-indexes-q3',
      question: "What is a composite index and why does column order matter?",
      answer: "A composite index is built on more than one column and is sorted by the first column, then the second, and so on. The database can use it efficiently only for a leftmost prefix of those columns. An index on `(customer_id, created_at)` serves `WHERE customer_id = ?` and `WHERE customer_id = ? AND created_at > ?` and `WHERE customer_id = ? ORDER BY created_at`, but not a query filtering only on `created_at`.\n\nPut columns used with equality first and range or sort columns last.",
      example: `CREATE INDEX idx_orders_cust_date ON orders (customer_id, created_at);

-- efficient
SELECT * FROM orders WHERE customer_id = 7 AND created_at > '2026-01-01';

-- not efficient with this index
SELECT * FROM orders WHERE created_at > '2026-01-01';`,
      points: [
        "Leftmost-prefix rule.",
        "Equality first, range last.",
        "Can also satisfy ORDER BY without sorting.",
      ],
      difficulty: 'Intermediate',
    },
    {
      id: 'sql-indexes-q4',
      question: "When would an index NOT be used even though it exists?",
      answer: "The planner skips an index when it thinks a Seq Scan is cheaper, for example on small tables or when the condition matches a large share of rows (low selectivity). It also cannot use it when the query does not match the index: a function or cast applied to the column, a leading wildcard in LIKE, a composite index whose first column is not filtered, or a comparison with a different data type. Outdated statistics can also mislead the planner; running ANALYZE helps.",
      example: `-- cannot use a plain index on created_at
SELECT * FROM orders WHERE DATE(created_at) = '2026-03-01';

-- rewrite as a range so the index is usable
SELECT * FROM orders
WHERE created_at >= '2026-03-01' AND created_at < '2026-03-02';`,
      points: [
        "Low selectivity or tiny table.",
        "Function on column, leading wildcard, type mismatch.",
        "Composite index without its leading column.",
        "Stale statistics.",
      ],
      difficulty: 'Intermediate',
    },
    {
      id: 'sql-indexes-q5',
      question: "What is the difference between EXPLAIN and EXPLAIN ANALYZE?",
      answer: "EXPLAIN shows the execution plan the optimizer chose, with estimated costs and estimated row counts, without running the query. EXPLAIN ANALYZE actually executes the query and reports real execution time and real row counts for each plan node. Comparing estimated rows with actual rows reveals bad statistics. Because it really runs the statement, use it inside a transaction you roll back for INSERT, UPDATE and DELETE.",
      example: `EXPLAIN ANALYZE
SELECT e.name, d.name
FROM employees e JOIN departments d ON d.id = e.department_id
WHERE d.name = 'Engineering';`,
      points: [
        "EXPLAIN = estimates only.",
        "EXPLAIN ANALYZE = executes and measures.",
        "Add BUFFERS for I/O details.",
      ],
      difficulty: 'Intermediate',
    },
    {
      id: 'sql-indexes-q6',
      question: "What is a covering index and what is an Index Only Scan?",
      answer: "A covering index contains all the columns a query needs, both for filtering and for output. PostgreSQL can then perform an Index Only Scan, reading only the index and skipping the table (heap) lookups, which is much faster. You can add non-key payload columns with `INCLUDE`. The heap is still checked for pages not marked all-visible in the visibility map, so regular VACUUM keeps Index Only Scans efficient.",
      example: `CREATE INDEX idx_emp_dept_incl ON employees (department_id) INCLUDE (name, salary);

SELECT name, salary FROM employees WHERE department_id = 3;`,
      points: [
        "All needed columns live in the index.",
        "INCLUDE for extra output columns.",
        "Depends on the visibility map (VACUUM).",
      ],
      difficulty: 'Intermediate',
    },
    {
      id: 'sql-indexes-q7',
      question: "What is a partial index? Give a use case.",
      answer: "A partial index indexes only the rows that satisfy a WHERE predicate. It is smaller, cheaper to maintain and more cache-friendly than a full index. A common use is a job queue or orders table where queries almost always look at a small subset, such as `status = 'PENDING'`, or soft-deleted tables where only `deleted_at IS NULL` rows are queried. A partial unique index can also enforce business rules, such as one active subscription per customer.",
      example: `CREATE INDEX idx_customers_active_email
  ON customers (email)
  WHERE deleted_at IS NULL;`,
      points: [
        "Indexes a subset of rows.",
        "Query must include the same condition.",
        "Partial unique index enforces conditional uniqueness.",
      ],
      difficulty: 'Intermediate',
    },
    {
      id: 'sql-indexes-q8',
      question: "Explain how a B-tree index lookup works and why it is fast.",
      answer: "A B-tree is a balanced tree of fixed-size pages. The root and internal pages hold separator keys and pointers to child pages; the leaf pages hold the sorted keys with pointers (TIDs) to table rows, and leaves are linked to their neighbours. To find a value, the database starts at the root, follows the pointer whose range contains the key, and descends to a leaf, usually in 3 or 4 page reads even for millions of rows because each page has hundreds of entries (a high fan-out). Then it fetches the row from the heap. For ranges it finds the start key and then walks the linked leaves.",
      points: [
        "Balanced: every leaf is at the same depth.",
        "High fan-out means very few levels, O(log n).",
        "Linked leaves make range scans and ORDER BY cheap.",
        "Heap fetch afterwards unless it is an Index Only Scan.",
      ],
      difficulty: 'Advanced',
    },
    {
      id: 'sql-indexes-q9',
      question: "Why should you index foreign key columns in PostgreSQL?",
      answer: "PostgreSQL indexes the referenced primary key but not the referencing foreign key column. Queries that join parent to child (customers to orders) then scan the whole child table. Worse, deleting or updating a parent row requires checking for child rows, which becomes a full scan of the child table for every delete and can hold locks for a long time. Indexing `orders.customer_id` fixes both.",
      example: `CREATE INDEX CONCURRENTLY idx_orders_customer_id ON orders (customer_id);`,
      points: [
        "FK columns are not auto-indexed.",
        "Affects joins and ON DELETE checks.",
        "Use CONCURRENTLY on live systems.",
      ],
      difficulty: 'Advanced',
    },
    {
      id: 'sql-indexes-q10',
      question: "A query filtering on orders by customer and sorting by date is slow. How would you troubleshoot and fix it?",
      answer: "First run `EXPLAIN (ANALYZE, BUFFERS)` to see the real plan: probably a Seq Scan on orders followed by a Sort. Check that statistics are current (`ANALYZE orders`) and that estimated rows are close to actual rows. Then create an index that matches both the filter and the sort, with the equality column first: `(customer_id, created_at DESC)`. The planner can then read exactly the needed rows in order and stop after LIMIT, with no sort step. Create it CONCURRENTLY in production, and verify the new plan with EXPLAIN ANALYZE again.",
      example: `EXPLAIN (ANALYZE, BUFFERS)
SELECT id, amount, created_at
FROM orders
WHERE customer_id = 42
ORDER BY created_at DESC
LIMIT 20;

CREATE INDEX CONCURRENTLY idx_orders_customer_created
  ON orders (customer_id, created_at DESC) INCLUDE (amount);`,
      points: [
        "Measure first with EXPLAIN ANALYZE.",
        "Match the index to WHERE and ORDER BY.",
        "INCLUDE can make it an Index Only Scan.",
        "Re-check the plan afterwards.",
      ],
      difficulty: 'Advanced',
    },
  ],
}

export default topic
