const topic = {
  id: 'sql-normalization',
  category: 'sql',
  title: 'Normalization',
  description: "Organise tables to remove redundancy and anomalies: functional dependencies, 1NF, 2NF, 3NF, BCNF and when to denormalize.",
  difficulty: 'Intermediate',
  overview: "Normalization is the process of organising data into tables so that each fact is stored in exactly one place. It removes duplicated data and the bugs that duplication causes, called anomalies. The result is a set of smaller, focused tables linked by keys.\n\nImagine a single spreadsheet where every order row repeats the customer's name, email and city. If a customer changes email, you must fix it on every row; miss one and your data contradicts itself. Normalization splits this into a customers table and an orders table, so the email lives in one row and every order simply points to it with `customer_id`.\n\nNormalization is described as a series of normal forms (1NF, 2NF, 3NF, BCNF), each removing a specific kind of redundancy. Most real systems aim for 3NF and then denormalize selectively for read performance. Examples use `employees(id, name, email, salary, department_id, manager_id)`, `departments(id, name)`, `customers(id, name, email, city)` and `orders(id, customer_id, amount, status, created_at)`.",

  subtopics: [
    {
      id: 'why-normalize',
      title: 'Why normalize?',
      explanation: "Normalization reduces redundancy (the same fact stored many times), prevents anomalies, keeps data consistent, saves storage and makes the schema easier to evolve. The trade-off is that queries need more joins to reassemble the data.",
      example: `-- Unnormalized: customer data repeated on every order
-- order_id | customer_name | customer_email   | city   | amount
-- 1        | Asha          | asha@example.com | Pune   | 250
-- 2        | Asha          | asha@example.com | Pune   | 120
-- 3        | Ravi          | ravi@example.com | Mumbai | 900

-- Normalized
CREATE TABLE customers (
  id    BIGSERIAL PRIMARY KEY,
  name  TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  city  TEXT
);

CREATE TABLE orders (
  id          BIGSERIAL PRIMARY KEY,
  customer_id BIGINT NOT NULL REFERENCES customers(id),
  amount      NUMERIC(10, 2) NOT NULL
);`,
      interviewPoints: [
        "Goal: each fact stored once.",
        "Benefits: integrity, less redundancy, fewer anomalies.",
        "Cost: more joins.",
      ],
    },
    {
      id: 'anomalies',
      title: 'Insert, update and delete anomalies',
      explanation: "An update anomaly happens when the same fact is stored in several rows and an update changes only some of them, leaving contradictory data. An insert anomaly happens when you cannot store one fact without another: in a combined employee-department table you cannot add a new department until it has an employee. A delete anomaly happens when deleting one fact removes another: deleting the last employee of a department also deletes all knowledge of that department.",
      example: `-- employee_department(emp_id, emp_name, dept_id, dept_name, dept_location)
-- 1 | Asha | 10 | Engineering | Pune
-- 2 | Ravi | 10 | Engineering | Pune
-- 3 | Meena| 20 | Sales       | Delhi

-- Update anomaly: move Engineering to Bangalore, forget one row
UPDATE employee_department SET dept_location = 'Bangalore' WHERE emp_id = 1;
-- now Engineering is both in Pune and Bangalore

-- Delete anomaly: removing Meena erases the Sales department entirely
DELETE FROM employee_department WHERE emp_id = 3;

-- Insert anomaly: cannot add a 'Marketing' department with no employees
-- without inventing a fake employee or using NULL keys`,
      interviewPoints: [
        "Update anomaly: inconsistent copies.",
        "Insert anomaly: cannot add a fact independently.",
        "Delete anomaly: losing unrelated facts.",
      ],
    },
    {
      id: 'functional-dependencies',
      title: 'Functional dependencies and keys',
      explanation: "A functional dependency X -> Y means that if you know X, Y is determined: for each value of X there is exactly one value of Y. For example `employee_id -> name` and `department_id -> department_name`. Normal forms are defined in terms of these dependencies.\n\nA candidate key is a minimal set of columns that determines all other columns; one of them is chosen as the primary key. A prime attribute is a column that is part of some candidate key. A partial dependency is when a non-key column depends on only part of a composite key. A transitive dependency is when a non-key column depends on another non-key column (A -> B -> C).",
      example: `-- order_items(order_id, product_id, quantity, product_name, order_date)
-- Candidate key: (order_id, product_id)
--
-- (order_id, product_id) -> quantity        full dependency
-- product_id             -> product_name    partial dependency
-- order_id               -> order_date      partial dependency
--
-- employees(id, name, department_id, department_name)
-- id -> department_id -> department_name    transitive dependency`,
      interviewPoints: [
        "X -> Y: X determines Y.",
        "Partial dependency breaks 2NF.",
        "Transitive dependency breaks 3NF.",
      ],
    },
    {
      id: 'first-normal-form',
      title: 'First Normal Form (1NF)',
      explanation: "A table is in 1NF when every column holds atomic (single, indivisible) values, there are no repeating groups such as `phone1, phone2, phone3`, and each row is uniquely identifiable by a key. A comma-separated list of phone numbers in one column violates 1NF, because you cannot easily search, index or constrain individual values.\n\nThe fix is to move repeating values into a separate child table with one row per value.",
      example: `-- Violates 1NF
-- customers(id, name, phones)
-- 1 | Asha | '98200 11111, 98200 22222'

-- 1NF
CREATE TABLE customer_phones (
  customer_id BIGINT NOT NULL REFERENCES customers(id),
  phone       TEXT NOT NULL,
  PRIMARY KEY (customer_id, phone)
);

INSERT INTO customer_phones VALUES (1, '98200 11111'), (1, '98200 22222');`,
      interviewPoints: [
        "Atomic values, no repeating groups, a primary key.",
        "Comma-separated lists and phone1/phone2 columns break 1NF.",
        "PostgreSQL arrays and JSONB technically bend 1NF; use them deliberately.",
      ],
    },
    {
      id: 'second-normal-form',
      title: 'Second Normal Form (2NF)',
      explanation: "A table is in 2NF when it is in 1NF and every non-key column depends on the whole primary key, not just part of it. 2NF only matters for tables with a composite key. In `order_items(order_id, product_id, quantity, product_name)`, `product_name` depends only on `product_id`, which is a partial dependency. Move it to a products table.",
      example: `-- Violates 2NF
-- order_items(order_id, product_id, quantity, product_name, unit_price)
-- product_name and unit_price depend only on product_id

-- 2NF
CREATE TABLE products (
  id         BIGSERIAL PRIMARY KEY,
  name       TEXT NOT NULL,
  unit_price NUMERIC(10, 2) NOT NULL
);

CREATE TABLE order_items (
  order_id   BIGINT REFERENCES orders(id),
  product_id BIGINT REFERENCES products(id),
  quantity   INT NOT NULL CHECK (quantity > 0),
  PRIMARY KEY (order_id, product_id)
);`,
      interviewPoints: [
        "1NF + no partial dependencies.",
        "Only relevant with composite keys.",
        "A table with a single-column key in 1NF is automatically in 2NF.",
      ],
    },
    {
      id: 'third-normal-form',
      title: 'Third Normal Form (3NF)',
      explanation: "A table is in 3NF when it is in 2NF and no non-key column depends on another non-key column (no transitive dependencies). In `employees(id, name, department_id, department_name)`, `department_name` depends on `department_id`, not directly on the employee id. Move department data to its own table. A popular summary: every non-key column must depend on \"the key, the whole key, and nothing but the key\".",
      example: `-- Violates 3NF
-- employees(id, name, salary, department_id, department_name)

-- 3NF
CREATE TABLE departments (
  id   SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE
);

CREATE TABLE employees (
  id            BIGSERIAL PRIMARY KEY,
  name          TEXT NOT NULL,
  email         TEXT NOT NULL UNIQUE,
  salary        NUMERIC(10, 2),
  department_id INT REFERENCES departments(id),
  manager_id    BIGINT REFERENCES employees(id)
);`,
      interviewPoints: [
        "2NF + no transitive dependencies.",
        "\"The key, the whole key, and nothing but the key.\"",
        "3NF is the usual target for OLTP schemas.",
      ],
    },
    {
      id: 'bcnf',
      title: 'Boyce-Codd Normal Form (BCNF)',
      explanation: "BCNF is a slightly stricter 3NF: for every non-trivial functional dependency X -> Y, X must be a superkey (it must uniquely identify rows). 3NF allows an exception when Y is part of a candidate key; BCNF does not. The difference shows up only with overlapping candidate keys.\n\nClassic example: `enrollments(student, course, instructor)` where each instructor teaches exactly one course (instructor -> course) and a student takes a course from one instructor. The candidate keys are (student, course) and (student, instructor). instructor -> course holds, but instructor is not a superkey, so the table is in 3NF but not BCNF. Splitting into `instructors(instructor, course)` and `enrollments(student, instructor)` fixes it.",
      example: `-- Not BCNF: instructor -> course, but instructor is not a key
-- enrollments(student, course, instructor)

-- BCNF decomposition
CREATE TABLE instructors (
  instructor TEXT PRIMARY KEY,
  course     TEXT NOT NULL
);

CREATE TABLE enrollments (
  student    TEXT NOT NULL,
  instructor TEXT NOT NULL REFERENCES instructors(instructor),
  PRIMARY KEY (student, instructor)
);`,
      interviewPoints: [
        "Every determinant must be a superkey.",
        "Differs from 3NF only with overlapping candidate keys.",
        "BCNF decomposition may lose some dependency checks (here, one instructor per course per student).",
      ],
    },
    {
      id: 'higher-normal-forms',
      title: 'Beyond BCNF (4NF, 5NF)',
      explanation: "4NF removes multi-valued dependencies: independent lists stored in the same table, such as an employee's skills and languages in one table, which forces every combination to be stored. 5NF deals with join dependencies. They are rarely asked in detail; knowing that they exist and that 3NF/BCNF is the practical target is usually enough.",
      example: `-- Violates 4NF: skills and languages are independent
-- employee_skill_language(employee_id, skill, language)

-- 4NF
CREATE TABLE employee_skills    (employee_id BIGINT, skill TEXT,    PRIMARY KEY (employee_id, skill));
CREATE TABLE employee_languages (employee_id BIGINT, language TEXT, PRIMARY KEY (employee_id, language));`,
      interviewPoints: [
        "4NF: no multi-valued dependencies.",
        "Practical target is usually 3NF or BCNF.",
      ],
    },
    {
      id: 'denormalization',
      title: 'Denormalization trade-offs',
      explanation: "Denormalization deliberately adds redundancy to speed up reads, by avoiding joins or repeated aggregation. Examples: storing `order_total` on orders instead of summing order items every time, copying `customer_name` onto invoices, keeping a `comment_count` on posts, or building reporting tables and materialized views.\n\nThe costs are more storage, slower and more complex writes, and the risk of the copies drifting out of sync. Keep them in sync with triggers, application logic in the same transaction, or scheduled refreshes, and only denormalize after measuring a real performance need. Some copies are actually correct by design: an invoice should keep the price and address at the time of purchase, even if they change later.",
      example: `ALTER TABLE orders ADD COLUMN item_count INT NOT NULL DEFAULT 0;

-- keep it in sync inside the same transaction
BEGIN;
INSERT INTO order_items (order_id, product_id, quantity) VALUES (1, 7, 2);
UPDATE orders SET item_count = item_count + 2 WHERE id = 1;
COMMIT;

-- or precompute reports
CREATE MATERIALIZED VIEW customer_order_summary AS
SELECT customer_id, COUNT(*) AS orders, SUM(amount) AS total
FROM orders
GROUP BY customer_id;`,
      interviewPoints: [
        "Trade write complexity and consistency risk for read speed.",
        "Common in reporting, analytics (star schemas) and read-heavy APIs.",
        "Historical snapshots (price at purchase time) are legitimate copies.",
        "Measure before denormalizing.",
      ],
    },
  ],

  commonMistakes: [
    "Storing comma-separated values in a single column, which breaks 1NF and makes searching and constraints impossible.",
    "Repeating descriptive data like department name on every employee row instead of referencing a departments table.",
    "Creating columns like phone1, phone2, phone3 instead of a child table.",
    "Over-normalizing into many tiny tables (for example a separate table for every attribute) and paying for joins with no real benefit.",
    "Denormalizing up front without a measured performance problem, then fighting data that goes out of sync.",
    "Treating a snapshot value, such as the price on a historical invoice, as redundant and replacing it with a live lookup that changes history.",
  ],

  interviewTips: [
    "Walk through one messy table step by step to 1NF, 2NF and 3NF; a worked example beats reciting definitions.",
    "Remember the phrase \"the key, the whole key, and nothing but the key\" for 1NF, 2NF and 3NF.",
    "Always name the anomalies (insert, update, delete) when explaining why normalization matters.",
    "Show balance: say you normalize to 3NF by default and denormalize selectively for measured read performance.",
    "Relate to JPA: normalized tables map naturally to entities with @ManyToOne and @OneToMany relationships.",
  ],

  interviewQuestions: [
    {
      id: 'sql-normalization-q1',
      question: "What is normalization and why is it important?",
      answer: "Normalization is the process of structuring a relational database so that each fact is stored once, by splitting data into related tables linked by keys. It removes redundancy and prevents insert, update and delete anomalies, which keeps data consistent and makes the schema easier to maintain. The cost is that queries need joins to combine the data again.",
      points: [
        "Removes redundancy.",
        "Prevents anomalies.",
        "Improves data integrity.",
        "Trade-off: more joins.",
      ],
      difficulty: 'Beginner',
    },
    {
      id: 'sql-normalization-q2',
      question: "What are insert, update and delete anomalies? Give an example of each.",
      answer: "Consider one table storing employees together with their department name and location. An update anomaly: changing the department's location requires updating every employee row, and missing one leaves conflicting data. An insert anomaly: you cannot record a new department until someone is hired into it. A delete anomaly: deleting the last employee of a department also deletes the only record of that department. Splitting departments into their own table removes all three.",
      points: [
        "Update: inconsistent duplicates.",
        "Insert: cannot add a fact on its own.",
        "Delete: losing unrelated information.",
      ],
      difficulty: 'Beginner',
    },
    {
      id: 'sql-normalization-q3',
      question: "Explain 1NF, 2NF and 3NF with examples.",
      answer: "1NF: every column holds a single atomic value, there are no repeating groups, and rows have a key. A `phones` column containing '111, 222' breaks it; move phones to a child table.\n\n2NF: 1NF plus every non-key column depends on the entire primary key. In `order_items(order_id, product_id, quantity, product_name)`, product_name depends only on product_id, so it moves to a products table.\n\n3NF: 2NF plus no non-key column depends on another non-key column. In `employees(id, name, department_id, department_name)`, department_name depends on department_id, so it moves to a departments table.",
      example: `-- 3NF result
CREATE TABLE departments (id SERIAL PRIMARY KEY, name TEXT NOT NULL);
CREATE TABLE employees (
  id            BIGSERIAL PRIMARY KEY,
  name          TEXT NOT NULL,
  department_id INT REFERENCES departments(id)
);`,
      points: [
        "1NF: atomic values.",
        "2NF: no partial dependency on a composite key.",
        "3NF: no transitive dependency.",
      ],
      difficulty: 'Beginner',
    },
    {
      id: 'sql-normalization-q4',
      question: "What is a functional dependency? What are partial and transitive dependencies?",
      answer: "A functional dependency X -> Y means that each value of X is associated with exactly one value of Y, so knowing X tells you Y, for example `email -> customer_id` or `department_id -> department_name`. A partial dependency is when a non-key column depends on only part of a composite primary key; removing these gives 2NF. A transitive dependency is when a non-key column depends on the key only through another non-key column (id -> department_id -> department_name); removing these gives 3NF.",
      points: [
        "X -> Y: X determines Y.",
        "Partial: depends on part of the key (fix for 2NF).",
        "Transitive: depends via another non-key column (fix for 3NF).",
      ],
      difficulty: 'Intermediate',
    },
    {
      id: 'sql-normalization-q5',
      question: "Normalize this table to 3NF: orders_flat(order_id, order_date, customer_id, customer_name, customer_city, product_id, product_name, unit_price, quantity).",
      answer: "The key of the flat table is (order_id, product_id), since an order can contain many products. order_date and customer_id depend only on order_id (partial), product_name and unit_price depend only on product_id (partial), and customer_name and customer_city depend on customer_id (transitive). Removing these gives four tables: customers, products, orders (with customer_id) and order_items (order_id, product_id, quantity, and optionally the price paid, as a deliberate historical snapshot).",
      example: `CREATE TABLE customers (
  id   BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  city TEXT
);

CREATE TABLE products (
  id         BIGSERIAL PRIMARY KEY,
  name       TEXT NOT NULL,
  unit_price NUMERIC(10, 2) NOT NULL
);

CREATE TABLE orders (
  id          BIGSERIAL PRIMARY KEY,
  customer_id BIGINT NOT NULL REFERENCES customers(id),
  order_date  DATE NOT NULL
);

CREATE TABLE order_items (
  order_id   BIGINT REFERENCES orders(id),
  product_id BIGINT REFERENCES products(id),
  quantity   INT NOT NULL CHECK (quantity > 0),
  price_paid NUMERIC(10, 2) NOT NULL,   -- snapshot of price at purchase
  PRIMARY KEY (order_id, product_id)
);`,
      points: [
        "Identify the key first: (order_id, product_id).",
        "Remove partial dependencies (orders, products).",
        "Remove transitive dependencies (customers).",
        "Price at purchase is a valid historical attribute.",
      ],
      difficulty: 'Intermediate',
    },
    {
      id: 'sql-normalization-q6',
      question: "What is denormalization and when would you use it?",
      answer: "Denormalization intentionally stores redundant or precomputed data to make reads faster, for example keeping an order total on the orders row, a follower count on users, or a flat reporting table. It is useful for read-heavy workloads, dashboards and analytics (star schemas in data warehouses), and for avoiding expensive joins on hot API paths.\n\nThe costs are extra storage, more complex writes and the risk of inconsistency, so the redundant data must be kept in sync with transactions, triggers or scheduled refreshes. Apply it only after measuring a real performance problem.",
      points: [
        "Adds redundancy for read speed.",
        "Common in reporting and read-heavy systems.",
        "Must keep copies in sync.",
        "Measure first.",
      ],
      difficulty: 'Intermediate',
    },
    {
      id: 'sql-normalization-q7',
      question: "What is BCNF and how does it differ from 3NF?",
      answer: "BCNF (Boyce-Codd Normal Form) requires that for every non-trivial functional dependency X -> Y, X is a superkey. 3NF is slightly looser: it also allows X -> Y when Y is a prime attribute (part of some candidate key). The two differ only when a table has overlapping composite candidate keys.\n\nExample: `enrollments(student, course, instructor)` where each instructor teaches one course. instructor -> course holds but instructor is not a superkey, so the table is in 3NF but not BCNF. Decompose into `instructors(instructor, course)` and `enrollments(student, instructor)`. Note that BCNF decomposition can make some dependencies impossible to enforce with a simple constraint, which is why 3NF is sometimes preferred.",
      points: [
        "Every determinant must be a superkey.",
        "Stricter than 3NF.",
        "Matters with overlapping candidate keys.",
        "May not preserve all dependencies.",
      ],
      difficulty: 'Advanced',
    },
    {
      id: 'sql-normalization-q8',
      question: "Is storing JSONB or arrays in PostgreSQL a violation of normalization? When is it acceptable?",
      answer: "Strictly, a JSONB document or array holds non-atomic values, so it bends 1NF. It is acceptable when the data is truly schema-less or varies per row (product attributes that differ by category, third-party webhook payloads, user preferences), when it is always read and written as a whole, and when you rarely need to join or enforce constraints on individual elements.\n\nIt is a bad idea for data you filter, join or aggregate often, or that needs foreign keys and uniqueness, such as order items or tags that must be unique. Those belong in normal columns or child tables. If you do query inside JSONB, add a GIN index or expression index.",
      example: `CREATE TABLE products (
  id         BIGSERIAL PRIMARY KEY,
  name       TEXT NOT NULL,
  price      NUMERIC(10, 2) NOT NULL,       -- core, relational
  attributes JSONB NOT NULL DEFAULT '{}'    -- flexible, per category
);

CREATE INDEX idx_products_attributes ON products USING GIN (attributes);

SELECT name FROM products WHERE attributes @> '{"color": "red"}';`,
      points: [
        "JSONB/arrays relax 1NF.",
        "Good for flexible, whole-document data.",
        "Bad for data needing joins, FKs or uniqueness.",
        "Index with GIN if queried.",
      ],
      difficulty: 'Advanced',
    },
    {
      id: 'sql-normalization-q9',
      question: "How would you decide between a normalized OLTP schema and a denormalized design for reporting?",
      answer: "OLTP systems (the Spring Boot backend handling orders and payments) have many small concurrent writes and need strong integrity, so a normalized 3NF schema is the default: each update touches one place and constraints protect correctness. Reporting and analytics run large read-only aggregations over history, where joins across many normalized tables are slow, so a denormalized design such as a star schema (a central fact table like sales with dimension tables like date, customer and product), materialized views, or a separate data warehouse fed by ETL/CDC works better.\n\nOften you use both: a normalized source of truth for transactions, and derived, denormalized read models for dashboards, refreshed on a schedule or via events (the CQRS idea).",
      points: [
        "OLTP: normalized, write-optimized, strong integrity.",
        "OLAP/reporting: denormalized, read-optimized.",
        "Star schema: fact table + dimension tables.",
        "Keep one source of truth; derive read models from it.",
      ],
      difficulty: 'Advanced',
    },
  ],
}

export default topic
