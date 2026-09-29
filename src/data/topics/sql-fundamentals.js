const topic = {
  id: 'sql-fundamentals',
  category: 'sql',
  title: 'SQL Fundamentals',
  description: "Tables, keys, constraints, CRUD statements, filtering, sorting, grouping, aggregates, views and PostgreSQL basics.",
  difficulty: 'Beginner',
  overview: "SQL (Structured Query Language) is the language you use to talk to a relational database. You describe what data you want, and the database figures out how to get it. Almost every Spring Boot backend stores its data in a relational database such as PostgreSQL or MySQL, so SQL is a core backend skill.\n\nThink of a database as a very organised set of spreadsheets. Each spreadsheet is a table, each row is one record (one employee), and each column is one piece of information about that record (name, salary). Unlike a spreadsheet, the database enforces rules: every employee must have an id, emails must be unique, salaries cannot be negative.\n\nIn this topic you will learn how tables are built (keys and constraints), how to read and change data (SELECT, INSERT, UPDATE, DELETE), and how to summarise data (GROUP BY and aggregate functions). Most examples use this sample schema: `employees(id, name, email, salary, department_id, manager_id)`, `departments(id, name)`, `customers(id, name, email, city)` and `orders(id, customer_id, amount, status, created_at)`.",

  subtopics: [
    {
      id: 'database-fundamentals',
      title: 'Database fundamentals',
      explanation: "A database is an organised collection of data managed by software called a DBMS (Database Management System). A relational database (RDBMS) stores data in tables that can be linked to each other through keys. PostgreSQL, MySQL, Oracle and SQL Server are all relational databases.\n\nSQL commands are often grouped into DDL (Data Definition Language: `CREATE`, `ALTER`, `DROP`), DML (Data Manipulation Language: `INSERT`, `UPDATE`, `DELETE`), DQL (`SELECT`), DCL (`GRANT`, `REVOKE`) and TCL (`COMMIT`, `ROLLBACK`).",
      example: `-- DDL: define structure
CREATE TABLE departments (
  id   SERIAL PRIMARY KEY,
  name TEXT NOT NULL
);

-- DML: change data
INSERT INTO departments (name) VALUES ('Engineering');

-- DQL: read data
SELECT * FROM departments;`,
      interviewPoints: [
        "SQL is declarative: you say what you want, not how to fetch it.",
        "Know the DDL / DML / DQL / DCL / TCL grouping.",
        "RDBMS = tables + relationships + constraints + transactions.",
      ],
    },
    {
      id: 'tables-rows-columns',
      title: 'Tables, Rows & Columns',
      explanation: "A table stores data about one kind of thing, such as employees. A column defines one attribute and has a fixed data type (for example `salary NUMERIC(10,2)`). A row is one record, a single employee with a value for each column.\n\nA missing value is represented by `NULL`, which means unknown or not applicable. `NULL` is not zero and not an empty string.",
      example: `CREATE TABLE employees (
  id            BIGSERIAL PRIMARY KEY,
  name          TEXT NOT NULL,
  email         TEXT NOT NULL UNIQUE,
  salary        NUMERIC(10, 2),
  department_id INT REFERENCES departments(id),
  manager_id    BIGINT REFERENCES employees(id)
);`,
      interviewPoints: [
        "Rows are also called records or tuples; columns are also called attributes or fields.",
        "Rows in a table have no guaranteed order unless you use ORDER BY.",
      ],
    },
    {
      id: 'primary-key',
      title: 'Primary key',
      explanation: "A primary key is the column (or set of columns) that uniquely identifies each row. It must be unique and can never be NULL. A table can have only one primary key, and the database automatically creates a unique index on it.\n\nMost tables use a surrogate key: an auto-generated number or UUID with no business meaning. A natural key uses real data such as an email, but real data can change, which makes it risky as a key.",
      example: `-- single-column primary key
CREATE TABLE customers (
  id    BIGSERIAL PRIMARY KEY,
  name  TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  city  TEXT
);

-- composite primary key (two columns together are unique)
CREATE TABLE employee_projects (
  employee_id BIGINT,
  project_id  BIGINT,
  PRIMARY KEY (employee_id, project_id)
);`,
      interviewPoints: [
        "Primary key = UNIQUE + NOT NULL, only one per table.",
        "A composite key uses more than one column.",
        "Surrogate keys (id) are preferred over natural keys (email) because they never change.",
      ],
    },
    {
      id: 'foreign-key',
      title: 'Foreign key',
      explanation: "A foreign key is a column that points to the primary key of another table. It creates a relationship and enforces referential integrity: you cannot insert an employee with a `department_id` that does not exist in `departments`.\n\nYou can choose what happens when the parent row is deleted using `ON DELETE`: `RESTRICT`/`NO ACTION` (block it, the default), `CASCADE` (delete children too) or `SET NULL`.",
      example: `CREATE TABLE orders (
  id          BIGSERIAL PRIMARY KEY,
  customer_id BIGINT NOT NULL
              REFERENCES customers(id) ON DELETE CASCADE,
  amount      NUMERIC(10, 2) NOT NULL,
  status      TEXT NOT NULL DEFAULT 'NEW',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- fails: customer 999 does not exist
INSERT INTO orders (customer_id, amount) VALUES (999, 50.00);`,
      interviewPoints: [
        "A foreign key can be NULL (unless declared NOT NULL) and can have duplicates.",
        "ON DELETE CASCADE deletes child rows automatically; use it with care.",
        "PostgreSQL does not auto-index foreign key columns; add an index yourself.",
      ],
    },
    {
      id: 'constraints',
      title: 'Constraints: NOT NULL, UNIQUE, CHECK, DEFAULT',
      explanation: "Constraints are rules the database enforces on every insert and update, so bad data never gets in, no matter which application writes it.\n\n`NOT NULL` forbids missing values. `UNIQUE` forbids duplicates (but in PostgreSQL several NULLs are allowed). `CHECK` validates a condition such as `salary > 0`. `DEFAULT` supplies a value when the insert does not provide one. `PRIMARY KEY` and `FOREIGN KEY` are constraints too.",
      example: `CREATE TABLE products (
  id         SERIAL PRIMARY KEY,
  sku        TEXT NOT NULL UNIQUE,
  name       TEXT NOT NULL,
  price      NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
  stock      INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- add a constraint to an existing table
ALTER TABLE employees
  ADD CONSTRAINT salary_positive CHECK (salary > 0);`,
      interviewPoints: [
        "Constraints protect data even if a buggy app bypasses your Java validation.",
        "UNIQUE allows multiple NULLs in PostgreSQL (use NULLS NOT DISTINCT in v15+ to change that).",
        "DEFAULT is used only when the column is omitted from the INSERT.",
      ],
    },
    {
      id: 'select',
      title: 'SELECT',
      explanation: "`SELECT` reads data. You list the columns you want, the table in `FROM`, and optional filters, grouping and sorting. Use aliases with `AS` to rename columns in the result, and `DISTINCT` to remove duplicate rows.\n\nAvoid `SELECT *` in application code: it fetches columns you do not need and breaks when columns are added.",
      example: `SELECT name, salary * 12 AS annual_salary
FROM employees;

SELECT DISTINCT department_id
FROM employees;`,
      interviewPoints: [
        "Logical order of execution: FROM, WHERE, GROUP BY, HAVING, SELECT, ORDER BY, LIMIT.",
        "That is why a column alias from SELECT cannot be used in WHERE.",
      ],
    },
    {
      id: 'insert-update-delete',
      title: 'INSERT, UPDATE & DELETE',
      explanation: "`INSERT` adds rows, `UPDATE` changes existing rows and `DELETE` removes rows. Always use a `WHERE` clause with UPDATE and DELETE, otherwise every row in the table is affected.\n\nPostgreSQL supports `RETURNING`, which gives back the affected rows (handy for getting a generated id) and `ON CONFLICT` for upserts (insert or update).",
      example: `INSERT INTO employees (name, email, salary, department_id)
VALUES ('Asha', 'asha@example.com', 75000, 1)
RETURNING id;

UPDATE employees
SET salary = salary * 1.10
WHERE department_id = 1;

DELETE FROM employees
WHERE id = 42;

-- upsert
INSERT INTO customers (name, email) VALUES ('Ravi', 'ravi@example.com')
ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name;`,
      interviewPoints: [
        "UPDATE or DELETE without WHERE touches every row.",
        "DELETE removes rows one by one and can be rolled back; TRUNCATE empties the whole table quickly.",
        "RETURNING and ON CONFLICT are PostgreSQL features worth mentioning.",
      ],
    },
    {
      id: 'where',
      title: 'WHERE',
      explanation: "`WHERE` filters rows before grouping. You can combine conditions with `AND`, `OR` and `NOT`, and use operators such as `=`, `<>`, `>`, `BETWEEN`, `IN`, `LIKE` (pattern match, `%` means any characters) and `ILIKE` (case-insensitive, PostgreSQL only).\n\nTo check for NULL you must use `IS NULL` or `IS NOT NULL`. Writing `= NULL` never matches anything, because any comparison with NULL is unknown.",
      example: `SELECT name, salary
FROM employees
WHERE salary BETWEEN 50000 AND 90000
  AND department_id IN (1, 2)
  AND email ILIKE '%@example.com'
  AND manager_id IS NOT NULL;`,
      interviewPoints: [
        "Use IS NULL, never = NULL.",
        "AND binds tighter than OR; add parentheses to be safe.",
      ],
    },
    {
      id: 'order-by-limit',
      title: 'ORDER BY & LIMIT',
      explanation: "`ORDER BY` sorts the result, ascending (`ASC`, the default) or descending (`DESC`). You can sort by several columns. `LIMIT` restricts how many rows come back and `OFFSET` skips rows, which is the simplest way to paginate.\n\nWithout ORDER BY the database may return rows in any order, so LIMIT without ORDER BY gives unpredictable results.",
      example: `-- top 5 earners
SELECT name, salary
FROM employees
ORDER BY salary DESC, name ASC
LIMIT 5;

-- page 3 with 10 rows per page
SELECT id, name
FROM employees
ORDER BY id
LIMIT 10 OFFSET 20;`,
      interviewPoints: [
        "PostgreSQL puts NULLs last in ASC order; use NULLS FIRST / NULLS LAST to control it.",
        "Large OFFSET values are slow; keyset pagination (WHERE id > last_id) scales better.",
      ],
    },
    {
      id: 'aggregate-functions',
      title: 'Aggregate functions: COUNT, SUM, AVG, MIN, MAX',
      explanation: "Aggregate functions take many rows and return one value. `COUNT` counts rows, `SUM` adds, `AVG` averages, `MIN` and `MAX` find the smallest and largest value.\n\n`COUNT(*)` counts all rows, while `COUNT(column)` counts only rows where that column is not NULL. All aggregates except `COUNT(*)` ignore NULLs.",
      example: `SELECT COUNT(*)            AS total_employees,
       COUNT(manager_id)   AS with_manager,
       SUM(salary)         AS payroll,
       ROUND(AVG(salary), 2) AS avg_salary,
       MIN(salary)         AS lowest,
       MAX(salary)         AS highest
FROM employees;`,
      interviewPoints: [
        "COUNT(*) counts rows; COUNT(col) skips NULLs; COUNT(DISTINCT col) counts unique values.",
        "AVG ignores NULLs, so it averages only known values.",
      ],
    },
    {
      id: 'group-by-having',
      title: 'GROUP BY & HAVING',
      explanation: "`GROUP BY` splits rows into groups that share the same value, then runs aggregates per group, for example the average salary per department. Every column in SELECT must either be in GROUP BY or be inside an aggregate function.\n\n`HAVING` filters groups after aggregation, while `WHERE` filters individual rows before grouping. Use WHERE whenever you can, because it reduces the rows that need grouping.",
      example: `SELECT department_id,
       COUNT(*)    AS headcount,
       AVG(salary) AS avg_salary
FROM employees
WHERE salary IS NOT NULL      -- row filter
GROUP BY department_id
HAVING COUNT(*) >= 3          -- group filter
ORDER BY avg_salary DESC;`,
      interviewPoints: [
        "WHERE filters rows before grouping; HAVING filters groups after.",
        "You cannot use an aggregate in WHERE.",
        "Non-aggregated SELECT columns must appear in GROUP BY.",
      ],
    },
    {
      id: 'views',
      title: 'Views',
      explanation: "A view is a saved query that behaves like a virtual table. It stores no data itself: each time you select from it, the underlying query runs. Views simplify complex queries, give a stable interface, and can hide sensitive columns.\n\nA materialized view in PostgreSQL stores the result physically. It is fast to read but must be refreshed with `REFRESH MATERIALIZED VIEW` to see new data.",
      example: `CREATE VIEW employee_directory AS
SELECT e.id, e.name, e.email, d.name AS department
FROM employees e
LEFT JOIN departments d ON d.id = e.department_id;

SELECT * FROM employee_directory WHERE department = 'Engineering';

CREATE MATERIALIZED VIEW dept_salary_stats AS
SELECT department_id, AVG(salary) AS avg_salary
FROM employees
GROUP BY department_id;

REFRESH MATERIALIZED VIEW dept_salary_stats;`,
      interviewPoints: [
        "A normal view stores only the query, not the data.",
        "Materialized views cache results and need manual refresh.",
        "Views can be used for security by exposing only some columns.",
      ],
    },
    {
      id: 'postgresql-basics',
      title: 'PostgreSQL basics: psql and data types',
      explanation: "`psql` is PostgreSQL's command-line client. Useful meta-commands: `\\l` lists databases, `\\c dbname` connects, `\\dt` lists tables, `\\d employees` describes a table, `\\q` quits.\n\nCommon types: `SERIAL`/`BIGSERIAL` (auto-incrementing int/bigint; modern style is `GENERATED ALWAYS AS IDENTITY`), `UUID` (128-bit unique id, `gen_random_uuid()` generates one), `TEXT` (string of any length), `VARCHAR(n)`, `NUMERIC(p,s)` (exact decimals, use for money), `BOOLEAN`, `DATE`, `TIMESTAMPTZ` (timestamp with time zone, stored in UTC) and `JSONB` (binary JSON you can query and index).",
      example: `-- psql -h localhost -U postgres -d shop

CREATE TABLE events (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seq        BIGINT GENERATED ALWAYS AS IDENTITY,
  title      TEXT NOT NULL,
  price      NUMERIC(10, 2),
  active     BOOLEAN NOT NULL DEFAULT true,
  payload    JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- query inside JSONB
SELECT title, payload ->> 'source' AS source
FROM events
WHERE payload @> '{"type": "signup"}';`,
      interviewPoints: [
        "Use NUMERIC, not FLOAT/DOUBLE, for money to avoid rounding errors.",
        "Prefer TIMESTAMPTZ over TIMESTAMP so time zones are handled correctly.",
        "JSONB is stored parsed and supports GIN indexes; JSON is stored as plain text.",
        "In PostgreSQL TEXT and VARCHAR perform the same.",
      ],
    },
  ],

  commonMistakes: [
    "Writing `WHERE manager_id = NULL` instead of `WHERE manager_id IS NULL`, which returns no rows.",
    "Running UPDATE or DELETE without a WHERE clause and changing every row in the table.",
    "Using an aggregate like `AVG(salary)` inside WHERE instead of HAVING.",
    "Selecting a column that is neither in GROUP BY nor inside an aggregate, which PostgreSQL rejects.",
    "Using LIMIT without ORDER BY and expecting the same rows every time.",
    "Storing money in FLOAT or DOUBLE PRECISION and getting rounding errors instead of using NUMERIC.",
    "Assuming `COUNT(column)` counts all rows when it actually skips NULLs.",
  ],

  interviewTips: [
    "Explain the logical query order (FROM, WHERE, GROUP BY, HAVING, SELECT, ORDER BY, LIMIT); it answers many tricky follow-ups.",
    "When writing a query on a whiteboard, first state the tables and columns you assume, then write it step by step.",
    "Mention edge cases out loud: NULLs, duplicates, ties and empty tables.",
    "Relate constraints to your Java code: Bean Validation checks input, but database constraints are the final safety net.",
    "Know a few PostgreSQL-specific features (RETURNING, ON CONFLICT, JSONB, ILIKE); they show real-world experience.",
  ],

  interviewQuestions: [
    {
      id: 'sql-fundamentals-q1',
      question: "What is the difference between a primary key and a unique key?",
      answer: "Both guarantee that values are unique. A primary key also forbids NULL and there can be only one per table; it is the main identifier of a row and is usually what foreign keys reference.\n\nA table can have many unique constraints, and in PostgreSQL a unique column can contain several NULLs because NULL is not considered equal to another NULL.",
      points: [
        "Primary key = UNIQUE + NOT NULL.",
        "One primary key per table, many unique keys.",
        "Unique columns may hold NULLs.",
        "Both automatically create a unique index.",
      ],
      difficulty: 'Beginner',
    },
    {
      id: 'sql-fundamentals-q2',
      question: "What is a foreign key and why do we use it?",
      answer: "A foreign key is a column in one table that references the primary key of another table, such as `employees.department_id` referencing `departments.id`. It enforces referential integrity: the database rejects rows that point to a non-existent parent, and blocks (or cascades) deletion of a parent that still has children.",
      example: `ALTER TABLE employees
  ADD CONSTRAINT fk_emp_dept
  FOREIGN KEY (department_id) REFERENCES departments(id)
  ON DELETE SET NULL;`,
      points: [
        "Prevents orphan rows.",
        "ON DELETE options: NO ACTION/RESTRICT, CASCADE, SET NULL, SET DEFAULT.",
        "Foreign key columns can be NULL and non-unique.",
      ],
      difficulty: 'Beginner',
    },
    {
      id: 'sql-fundamentals-q3',
      question: "What is the difference between WHERE and HAVING?",
      answer: "WHERE filters individual rows before they are grouped, so it cannot use aggregate functions. HAVING filters groups after GROUP BY has run, so it can use aggregates like `COUNT(*)` or `AVG(salary)`.\n\nIf a condition does not need an aggregate, put it in WHERE: it removes rows earlier and makes the query cheaper.",
      example: `SELECT department_id, AVG(salary) AS avg_salary
FROM employees
WHERE salary > 0
GROUP BY department_id
HAVING AVG(salary) > 60000;`,
      points: [
        "WHERE runs before GROUP BY, HAVING runs after.",
        "Aggregates are allowed in HAVING, not in WHERE.",
        "HAVING without GROUP BY treats the whole table as one group.",
      ],
      difficulty: 'Beginner',
    },
    {
      id: 'sql-fundamentals-q4',
      question: "What is the difference between DELETE, TRUNCATE and DROP?",
      answer: "DELETE removes selected rows (or all rows) one by one, fires row triggers and can use a WHERE clause. TRUNCATE removes all rows at once by deallocating the data, which is much faster, and can reset identity sequences. DROP removes the whole table, including its structure, indexes and constraints.\n\nIn PostgreSQL all three are transactional and can be rolled back inside a transaction, which is not true in every database (for example, MySQL auto-commits TRUNCATE and DROP).",
      example: `DELETE FROM orders WHERE status = 'CANCELLED';
TRUNCATE TABLE orders RESTART IDENTITY;
DROP TABLE orders;`,
      points: [
        "DELETE is DML and supports WHERE.",
        "TRUNCATE is DDL-like, fast, no WHERE.",
        "DROP removes the table definition too.",
      ],
      difficulty: 'Beginner',
    },
    {
      id: 'sql-fundamentals-q5',
      question: "Write a query to find the second-highest salary from the employees table.",
      answer: "Take the distinct salaries, sort them in descending order, skip the first one and take the next. Using DISTINCT matters: if two people share the top salary, the second-highest is the next different value.\n\nAn alternative that works in any SQL dialect is to take the maximum salary that is lower than the overall maximum. Both return nothing (or NULL) if there is only one distinct salary.",
      example: `-- Option 1: LIMIT / OFFSET
SELECT DISTINCT salary
FROM employees
ORDER BY salary DESC
LIMIT 1 OFFSET 1;

-- Option 2: subquery, returns NULL if there is no second salary
SELECT MAX(salary) AS second_highest
FROM employees
WHERE salary < (SELECT MAX(salary) FROM employees);`,
      points: [
        "Use DISTINCT so ties at the top are handled.",
        "The MAX-less-than-MAX version returns NULL instead of no row.",
        "DENSE_RANK is the general solution for the nth highest.",
      ],
      difficulty: 'Intermediate',
    },
    {
      id: 'sql-fundamentals-q6',
      question: "Write a query to find duplicate emails in the employees table.",
      answer: "Group rows by email and keep only the groups that contain more than one row. HAVING is required because the condition uses `COUNT(*)`, an aggregate. Using `LOWER(email)` also catches duplicates that differ only by letter case.",
      example: `SELECT LOWER(email) AS email, COUNT(*) AS occurrences
FROM employees
GROUP BY LOWER(email)
HAVING COUNT(*) > 1
ORDER BY occurrences DESC;`,
      points: [
        "GROUP BY + HAVING COUNT(*) > 1 is the classic duplicate finder.",
        "Normalise case and whitespace if the business treats them as equal.",
        "Prevent it in future with a UNIQUE index, e.g. on LOWER(email).",
      ],
      difficulty: 'Beginner',
    },
    {
      id: 'sql-fundamentals-q7',
      question: "Write a query to show department-wise average salary, only for departments with more than 2 employees.",
      answer: "Group employees by department, compute the average and the count per group, and use HAVING to keep only groups with more than two employees. Joining departments gives a readable department name; grouping by both id and name keeps the query valid.",
      example: `SELECT d.id, d.name,
       COUNT(*)                AS headcount,
       ROUND(AVG(e.salary), 2) AS avg_salary
FROM employees e
JOIN departments d ON d.id = e.department_id
GROUP BY d.id, d.name
HAVING COUNT(*) > 2
ORDER BY avg_salary DESC;`,
      points: [
        "Aggregate per group with GROUP BY.",
        "Filter groups with HAVING.",
        "ROUND makes the output readable.",
      ],
      difficulty: 'Intermediate',
    },
    {
      id: 'sql-fundamentals-q8',
      question: "What is the difference between COUNT(*), COUNT(column) and COUNT(DISTINCT column)?",
      answer: "`COUNT(*)` counts every row, including rows full of NULLs. `COUNT(column)` counts only rows where that column is not NULL. `COUNT(DISTINCT column)` counts unique non-NULL values.\n\nFor example, if 10 employees exist, 7 have a manager, and those 7 report to 3 different managers, the three counts on `manager_id` are 10, 7 and 3.",
      example: `SELECT COUNT(*)                   AS all_rows,
       COUNT(manager_id)          AS with_manager,
       COUNT(DISTINCT manager_id) AS distinct_managers
FROM employees;`,
      points: [
        "COUNT(*) never ignores rows.",
        "COUNT(col) skips NULLs.",
        "COUNT(DISTINCT col) removes duplicates and NULLs.",
      ],
      difficulty: 'Intermediate',
    },
    {
      id: 'sql-fundamentals-q9',
      question: "In what order does the database logically process a SELECT query, and why does it matter?",
      answer: "The logical order is FROM (and JOINs), WHERE, GROUP BY, HAVING, SELECT, DISTINCT, ORDER BY, and finally LIMIT/OFFSET. This explains several rules: you cannot use a SELECT alias in WHERE (the alias does not exist yet), aggregates are not allowed in WHERE (groups do not exist yet), but you can use aliases in ORDER BY (it runs after SELECT).\n\nThe optimizer may physically execute steps differently, but the result must be as if this order were followed.",
      example: `-- fails: alias not visible in WHERE
SELECT salary * 12 AS annual FROM employees WHERE annual > 100000;

-- works
SELECT salary * 12 AS annual FROM employees WHERE salary * 12 > 100000
ORDER BY annual DESC;`,
      points: [
        "FROM, WHERE, GROUP BY, HAVING, SELECT, ORDER BY, LIMIT.",
        "Aliases work in ORDER BY but not in WHERE.",
        "Logical order is not the same as physical execution order.",
      ],
      difficulty: 'Intermediate',
    },
    {
      id: 'sql-fundamentals-q10',
      question: "What is a view? How is a materialized view different?",
      answer: "A view is a named, stored query. Selecting from it runs the underlying query each time, so it always shows current data and uses no extra storage. It is used to simplify complex joins, provide a stable interface and restrict access to certain columns.\n\nA materialized view stores the query result on disk like a table. Reads are fast and it can be indexed, but data becomes stale until you run `REFRESH MATERIALIZED VIEW` (optionally `CONCURRENTLY`, which needs a unique index, so readers are not blocked).",
      example: `CREATE MATERIALIZED VIEW monthly_sales AS
SELECT date_trunc('month', created_at) AS month, SUM(amount) AS total
FROM orders
GROUP BY 1;

CREATE UNIQUE INDEX ON monthly_sales (month);
REFRESH MATERIALIZED VIEW CONCURRENTLY monthly_sales;`,
      points: [
        "View = saved query, always fresh, no data stored.",
        "Materialized view = cached result, fast, needs refresh.",
        "Good for dashboards and expensive reports.",
      ],
      difficulty: 'Intermediate',
    },
    {
      id: 'sql-fundamentals-q11',
      question: "How does NULL behave in comparisons, aggregates and UNIQUE constraints?",
      answer: "SQL uses three-valued logic: TRUE, FALSE and UNKNOWN. Any comparison with NULL, even `NULL = NULL`, is UNKNOWN, and WHERE keeps only TRUE rows, so you must use `IS NULL` or `IS DISTINCT FROM`. `NOT IN` with a subquery that returns a NULL gives no rows at all, a classic bug.\n\nAggregates such as SUM and AVG ignore NULLs, and SUM over zero rows returns NULL (use `COALESCE(SUM(x), 0)`). In a UNIQUE column, PostgreSQL allows many NULLs by default because NULLs are not considered equal.",
      example: `SELECT COALESCE(SUM(amount), 0) AS total
FROM orders
WHERE customer_id = 123;

SELECT * FROM employees
WHERE manager_id IS DISTINCT FROM 5;  -- includes NULL managers`,
      points: [
        "NULL = NULL is UNKNOWN, not TRUE.",
        "NOT IN with NULLs returns nothing.",
        "Use COALESCE to replace NULL with a default.",
        "UNIQUE permits multiple NULLs unless NULLS NOT DISTINCT is used.",
      ],
      difficulty: 'Advanced',
    },
    {
      id: 'sql-fundamentals-q12',
      question: "Which PostgreSQL data types would you choose for ids, money, timestamps and flexible attributes, and why?",
      answer: "For ids, use `BIGINT GENERATED ALWAYS AS IDENTITY` (or `BIGSERIAL`) for compact, fast, ordered keys, or `UUID` when ids must be generated outside the database or be hard to guess. For money, use `NUMERIC(p,s)` because floating types cannot represent decimal values exactly.\n\nFor timestamps, use `TIMESTAMPTZ`, which stores an absolute moment in UTC and converts to the session time zone on output. For flexible, schema-less attributes use `JSONB`: it is stored in a parsed binary form, supports operators like `->>` and `@>`, and can be indexed with GIN. Keep core, frequently filtered fields in normal columns.",
      example: `CREATE TABLE payments (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id   BIGINT NOT NULL REFERENCES orders(id),
  amount     NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  metadata   JSONB NOT NULL DEFAULT '{}',
  paid_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_payments_metadata ON payments USING GIN (metadata);`,
      points: [
        "BIGINT identity vs UUID: size and ordering vs global uniqueness.",
        "NUMERIC for money, never FLOAT.",
        "TIMESTAMPTZ avoids time-zone bugs.",
        "JSONB over JSON for querying and indexing.",
      ],
      difficulty: 'Advanced',
    },
  ],
}

export default topic
