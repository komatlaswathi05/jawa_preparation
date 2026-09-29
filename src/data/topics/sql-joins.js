const topic = {
  id: 'sql-joins',
  category: 'sql',
  title: 'SQL Joins',
  description: "Combine rows from multiple tables with INNER, LEFT, RIGHT, FULL, CROSS and self joins, plus the anti-join pattern.",
  difficulty: 'Beginner',
  overview: "A join combines rows from two or more tables based on a related column. Relational databases split data into separate tables (employees in one, departments in another) to avoid repetition, and joins are how you put that data back together when you query it.\n\nImagine two lists: a list of employees with a department number, and a list of department numbers with names. A join is like matching each employee to the department with the same number, so you can print \"Asha works in Engineering\". The different join types only decide what happens to rows that have no match.\n\nExamples use `employees(id, name, email, salary, department_id, manager_id)`, `departments(id, name)`, `customers(id, name, email, city)` and `orders(id, customer_id, amount, status, created_at)`.",

  subtopics: [
    {
      id: 'inner-join',
      title: 'INNER JOIN',
      explanation: "An INNER JOIN returns only rows that have a match in both tables. An employee with no department (NULL `department_id`) and a department with no employees are both left out. Writing just `JOIN` means INNER JOIN.",
      example: `SELECT e.name, d.name AS department
FROM employees e
INNER JOIN departments d ON d.id = e.department_id;`,
      interviewPoints: [
        "JOIN and INNER JOIN are the same.",
        "Unmatched rows from either side are dropped.",
        "Use table aliases (e, d) to keep queries short and unambiguous.",
      ],
    },
    {
      id: 'left-join',
      title: 'LEFT JOIN',
      explanation: "A LEFT JOIN (LEFT OUTER JOIN) returns every row from the left table, plus matching rows from the right table. When there is no match, the right-side columns are filled with NULL. Use it when the left-side rows must appear even without related data, for example all customers including those who never ordered.",
      example: `SELECT c.name, o.id AS order_id, o.amount
FROM customers c
LEFT JOIN orders o ON o.customer_id = c.id
ORDER BY c.name;`,
      interviewPoints: [
        "All left rows are kept; missing right values become NULL.",
        "A customer with 3 orders appears 3 times; with 0 orders appears once with NULLs.",
      ],
    },
    {
      id: 'right-join',
      title: 'RIGHT JOIN',
      explanation: "A RIGHT JOIN is the mirror image of a LEFT JOIN: every row from the right table is kept, and left-side columns are NULL when there is no match. Any RIGHT JOIN can be rewritten as a LEFT JOIN by swapping the table order, which most teams prefer for readability.",
      example: `-- all departments, even those with no employees
SELECT d.name AS department, e.name AS employee
FROM employees e
RIGHT JOIN departments d ON d.id = e.department_id;

-- same result, written as LEFT JOIN
SELECT d.name AS department, e.name AS employee
FROM departments d
LEFT JOIN employees e ON e.department_id = d.id;`,
      interviewPoints: [
        "A RIGHT JOIN B equals B LEFT JOIN A.",
        "Rarely used in practice; LEFT JOIN is the convention.",
      ],
    },
    {
      id: 'full-join',
      title: 'FULL OUTER JOIN',
      explanation: "A FULL JOIN (FULL OUTER JOIN) returns all rows from both tables. Matched rows are combined; unmatched rows from either side appear with NULLs for the other side. It is useful for comparing two data sets and finding what exists only on one side. PostgreSQL supports it; MySQL does not (you emulate it with LEFT JOIN UNION RIGHT JOIN).",
      example: `SELECT e.name AS employee, d.name AS department
FROM employees e
FULL JOIN departments d ON d.id = e.department_id;
-- includes employees with no department AND departments with no employees`,
      interviewPoints: [
        "FULL JOIN = LEFT JOIN results + unmatched right rows.",
        "MySQL has no FULL JOIN; emulate with UNION.",
      ],
    },
    {
      id: 'cross-join',
      title: 'CROSS JOIN',
      explanation: "A CROSS JOIN pairs every row of the first table with every row of the second, producing a Cartesian product. With 100 employees and 10 departments you get 1,000 rows. It has no ON condition. It is useful for generating combinations, such as every product in every size, or filling a calendar grid; by accident it causes huge, wrong results.",
      example: `SELECT s.size, c.color
FROM (VALUES ('S'), ('M'), ('L')) AS s(size)
CROSS JOIN (VALUES ('Red'), ('Blue')) AS c(color);
-- 3 x 2 = 6 rows`,
      interviewPoints: [
        "Result size = rows(A) x rows(B).",
        "A forgotten join condition effectively becomes a cross join.",
      ],
    },
    {
      id: 'self-join',
      title: 'Self Join',
      explanation: "A self join joins a table to itself. It is used when rows in a table relate to other rows in the same table, such as `employees.manager_id` pointing to another employee's id. You must give the table two different aliases so the database knows which copy you mean.",
      example: `SELECT e.name AS employee, m.name AS manager
FROM employees e
LEFT JOIN employees m ON m.id = e.manager_id;
-- LEFT JOIN keeps the CEO, whose manager is NULL`,
      interviewPoints: [
        "Self join is not a separate keyword; it is any join of a table with itself.",
        "Aliases are mandatory.",
        "Classic uses: employee/manager, comparing rows within the same table.",
      ],
    },
    {
      id: 'on-vs-where',
      title: 'Join conditions (ON) vs WHERE filters',
      explanation: "For INNER JOINs, putting a filter in ON or in WHERE gives the same result. For OUTER JOINs it matters a lot. A condition in ON decides which right-side rows match, and unmatched left rows are still kept. A condition in WHERE runs after the join and removes rows, so filtering on a right-table column in WHERE silently turns a LEFT JOIN into an INNER JOIN, because NULL values fail the test.",
      example: `-- all customers, with only their DELIVERED orders (others show NULL)
SELECT c.name, o.id
FROM customers c
LEFT JOIN orders o
  ON o.customer_id = c.id AND o.status = 'DELIVERED';

-- only customers who have a DELIVERED order (behaves like INNER JOIN)
SELECT c.name, o.id
FROM customers c
LEFT JOIN orders o ON o.customer_id = c.id
WHERE o.status = 'DELIVERED';`,
      interviewPoints: [
        "ON = how to match; WHERE = which final rows to keep.",
        "WHERE on the right table of a LEFT JOIN removes the NULL rows.",
        "Exception: WHERE right.col IS NULL is the anti-join pattern.",
      ],
    },
    {
      id: 'multiple-joins',
      title: 'Joining multiple tables',
      explanation: "You can chain as many joins as you need; each join adds one more table to the result built so far. Be careful of row multiplication: joining a customer to both orders and addresses gives orders x addresses rows per customer, which inflates SUM and COUNT. Aggregate in a subquery or CTE first when joining several one-to-many relationships.",
      example: `SELECT e.name       AS employee,
       d.name       AS department,
       m.name       AS manager
FROM employees e
JOIN departments d ON d.id = e.department_id
LEFT JOIN employees m ON m.id = e.manager_id
WHERE d.name = 'Engineering';`,
      interviewPoints: [
        "Joins are evaluated as a chain; the optimizer picks the physical order.",
        "Joining two one-to-many tables causes a fan-out that inflates aggregates.",
      ],
    },
    {
      id: 'anti-join',
      title: 'Anti-join pattern',
      explanation: "An anti-join finds rows in one table that have no match in another, such as customers who never placed an order. The two common ways are LEFT JOIN with `WHERE right.id IS NULL`, and `NOT EXISTS`. Both are safe with NULLs and PostgreSQL optimizes both into the same anti-join plan. Avoid `NOT IN (subquery)` if the subquery column can be NULL, because a single NULL makes it return no rows. The opposite, a semi-join, finds rows that do have a match, usually written with EXISTS.",
      example: `-- LEFT JOIN / IS NULL
SELECT c.id, c.name
FROM customers c
LEFT JOIN orders o ON o.customer_id = c.id
WHERE o.id IS NULL;

-- NOT EXISTS (often the clearest)
SELECT c.id, c.name
FROM customers c
WHERE NOT EXISTS (
  SELECT 1 FROM orders o WHERE o.customer_id = c.id
);`,
      interviewPoints: [
        "Check IS NULL on a non-nullable column of the right table, such as its primary key.",
        "Prefer NOT EXISTS over NOT IN when NULLs are possible.",
      ],
    },
  ],

  commonMistakes: [
    "Filtering on a right-table column in WHERE after a LEFT JOIN, which turns it into an INNER JOIN.",
    "Forgetting the ON condition (or using a wrong one) and producing a huge Cartesian product.",
    "Using INNER JOIN when rows without matches, such as employees without a department, must still appear.",
    "Summing values after joining two one-to-many tables, so totals are multiplied by the fan-out.",
    "Not aliasing tables in a self join, making column references ambiguous.",
    "Using NOT IN with a subquery that can return NULL, which returns zero rows.",
  ],

  interviewTips: [
    "Draw two small tables with 3 rows each and show which rows each join type returns; interviewers love this.",
    "Always say what happens to unmatched rows; that is the real difference between join types.",
    "Mention the ON vs WHERE trap for outer joins; it shows practical experience.",
    "For \"find X without Y\" questions, reach for LEFT JOIN ... IS NULL or NOT EXISTS.",
    "Relate joins to JPA: `@ManyToOne` and `JOIN FETCH` generate these SQL joins under the hood.",
  ],

  interviewQuestions: [
    {
      id: 'sql-joins-q1',
      question: "What are the different types of joins in SQL?",
      answer: "INNER JOIN returns only matching rows from both tables. LEFT JOIN returns all rows from the left table plus matches (NULL if none). RIGHT JOIN returns all rows from the right table plus matches. FULL OUTER JOIN returns all rows from both, with NULLs where there is no match. CROSS JOIN returns every combination of rows. A self join is any of these where a table is joined with itself.",
      points: [
        "INNER: only matches.",
        "LEFT / RIGHT: keep all of one side.",
        "FULL: keep everything.",
        "CROSS: Cartesian product.",
      ],
      difficulty: 'Beginner',
    },
    {
      id: 'sql-joins-q2',
      question: "What is the difference between INNER JOIN and LEFT JOIN?",
      answer: "INNER JOIN keeps only rows that match in both tables. LEFT JOIN keeps every row from the left table; if a row has no match, the columns from the right table come back as NULL. For example, listing employees with their department: INNER JOIN drops employees without a department, LEFT JOIN keeps them with a NULL department name.",
      example: `SELECT e.name, d.name AS department
FROM employees e
LEFT JOIN departments d ON d.id = e.department_id;`,
      points: [
        "LEFT JOIN result count is always >= left table count (if right side is unique).",
        "Unmatched right columns are NULL.",
      ],
      difficulty: 'Beginner',
    },
    {
      id: 'sql-joins-q3',
      question: "Write a query to list employees who are not assigned to any department.",
      answer: "If the department reference is simply missing, `department_id IS NULL` is enough. To also catch employees whose `department_id` points to a department that no longer exists (possible if there is no foreign key), use a LEFT JOIN to departments and keep rows where the department side is NULL.",
      example: `-- simple case
SELECT id, name
FROM employees
WHERE department_id IS NULL;

-- robust: missing OR dangling department reference
SELECT e.id, e.name
FROM employees e
LEFT JOIN departments d ON d.id = e.department_id
WHERE d.id IS NULL;`,
      points: [
        "Use IS NULL, never = NULL.",
        "LEFT JOIN + IS NULL is the anti-join pattern.",
        "A foreign key constraint prevents dangling references.",
      ],
      difficulty: 'Beginner',
    },
    {
      id: 'sql-joins-q4',
      question: "What is a self join? Write a query to show each employee with their manager's name.",
      answer: "A self join joins a table with itself using two aliases. In the employees table, `manager_id` refers to another row in the same table, so we join `employees e` to `employees m` on `m.id = e.manager_id`. A LEFT JOIN keeps the top-level employee, who has no manager.",
      example: `SELECT e.name AS employee,
       COALESCE(m.name, 'No manager') AS manager
FROM employees e
LEFT JOIN employees m ON m.id = e.manager_id
ORDER BY manager, employee;`,
      points: [
        "Two aliases of the same table.",
        "LEFT JOIN so employees without a manager still appear.",
        "For multi-level hierarchies use a recursive CTE.",
      ],
      difficulty: 'Beginner',
    },
    {
      id: 'sql-joins-q5',
      question: "Write a query to find employees who earn more than their managers.",
      answer: "Self join the employees table so each row holds an employee and their manager side by side, then compare the two salaries. An INNER JOIN is correct here because employees without a manager cannot earn more than one.",
      example: `SELECT e.name AS employee, e.salary,
       m.name AS manager, m.salary AS manager_salary
FROM employees e
JOIN employees m ON m.id = e.manager_id
WHERE e.salary > m.salary;`,
      points: [
        "Self join brings parent and child into one row.",
        "Compare columns from both aliases in WHERE.",
      ],
      difficulty: 'Intermediate',
    },
    {
      id: 'sql-joins-q6',
      question: "Why can a condition in WHERE turn a LEFT JOIN into an INNER JOIN?",
      answer: "The LEFT JOIN first keeps unmatched left rows with NULL right-side columns. WHERE is applied afterwards, and a condition such as `o.status = 'PAID'` evaluates to UNKNOWN for those NULLs, so the rows are removed. The result is the same as an INNER JOIN.\n\nIf you want all left rows but only certain right rows attached, put the condition into the ON clause instead.",
      example: `-- all customers, with only PAID orders attached
SELECT c.name, COUNT(o.id) AS paid_orders
FROM customers c
LEFT JOIN orders o
  ON o.customer_id = c.id AND o.status = 'PAID'
GROUP BY c.id, c.name;`,
      points: [
        "ON controls matching; WHERE filters the final result.",
        "NULL compared to anything is UNKNOWN, so the row is filtered out.",
        "COUNT(o.id) gives 0 for customers without matches; COUNT(*) would give 1.",
      ],
      difficulty: 'Intermediate',
    },
    {
      id: 'sql-joins-q7',
      question: "Write a query to find customers who have never placed an order.",
      answer: "This is an anti-join. Either LEFT JOIN orders and keep rows where the order id is NULL, or use NOT EXISTS with a correlated subquery. Both handle NULLs correctly and PostgreSQL plans them as a hash or merge anti-join. Avoid NOT IN because a NULL `customer_id` in orders would make it return nothing.",
      example: `SELECT c.id, c.name
FROM customers c
WHERE NOT EXISTS (
  SELECT 1 FROM orders o WHERE o.customer_id = c.id
);

-- equivalent
SELECT c.id, c.name
FROM customers c
LEFT JOIN orders o ON o.customer_id = c.id
WHERE o.id IS NULL;`,
      points: [
        "Anti-join = rows with no match.",
        "NOT EXISTS and LEFT JOIN / IS NULL are NULL-safe.",
        "NOT IN breaks when the subquery returns NULL.",
      ],
      difficulty: 'Intermediate',
    },
    {
      id: 'sql-joins-q8',
      question: "Write a query to count employees in every department, including departments with zero employees.",
      answer: "Start from departments and LEFT JOIN employees so empty departments survive. Count a column from the employees side, such as `e.id`, not `*`: for an empty department the joined row has `e.id` NULL, so `COUNT(e.id)` returns 0 while `COUNT(*)` would wrongly return 1.",
      example: `SELECT d.name, COUNT(e.id) AS employee_count
FROM departments d
LEFT JOIN employees e ON e.department_id = d.id
GROUP BY d.id, d.name
ORDER BY employee_count DESC;`,
      points: [
        "Put the table whose rows must all appear on the left.",
        "COUNT(right.id), not COUNT(*).",
      ],
      difficulty: 'Intermediate',
    },
    {
      id: 'sql-joins-q9',
      question: "What is a CROSS JOIN and when would you use it?",
      answer: "A CROSS JOIN returns the Cartesian product: every row of the first table paired with every row of the second, with no join condition. It is used to generate combinations, such as every store for every date in a report so missing days show zero, or all product/size combinations. Because the output grows as rows(A) x rows(B), it must be used deliberately.",
      example: `SELECT d.day::date, s.id AS store_id
FROM generate_series('2026-01-01'::date, '2026-01-07', interval '1 day') AS d(day)
CROSS JOIN stores s;`,
      points: [
        "No ON clause.",
        "Output size multiplies.",
        "Good for building complete grids before a LEFT JOIN to facts.",
      ],
      difficulty: 'Intermediate',
    },
    {
      id: 'sql-joins-q10',
      question: "How does the database physically execute a join? Explain nested loop, hash join and merge join.",
      answer: "A nested loop join takes each row from the outer table and looks up matches in the inner table; it is great when the outer side is small and the inner side has an index on the join column. A hash join builds an in-memory hash table from the smaller input and probes it with the larger input; it is fast for large, unsorted, equality joins. A merge join sorts both inputs on the join key (or reads them in index order) and walks them together; it is efficient when inputs are already sorted.\n\nThe PostgreSQL planner picks the algorithm based on table statistics; you can see the choice with EXPLAIN.",
      example: `EXPLAIN ANALYZE
SELECT c.name, o.amount
FROM customers c
JOIN orders o ON o.customer_id = c.id
WHERE c.city = 'Pune';`,
      points: [
        "Nested loop: small outer set + index on inner.",
        "Hash join: big equality joins, needs memory (work_mem).",
        "Merge join: sorted inputs, also supports range-friendly ordering.",
        "Run ANALYZE so the planner has good statistics.",
      ],
      difficulty: 'Advanced',
    },
    {
      id: 'sql-joins-q11',
      question: "Why do totals become too large when you join a customer to both orders and payments, and how do you fix it?",
      answer: "Both orders and payments are one-to-many from customers. Joining both at once gives every combination of a customer's orders with that customer's payments, so a customer with 3 orders and 2 payments produces 6 rows, and `SUM(o.amount)` counts each order twice. This is called fan-out or row explosion.\n\nThe fix is to aggregate each child table separately, in a subquery or CTE, and then join the already-aggregated results, which have one row per customer.",
      example: `WITH order_totals AS (
  SELECT customer_id, SUM(amount) AS total_ordered
  FROM orders GROUP BY customer_id
), payment_totals AS (
  SELECT customer_id, SUM(amount) AS total_paid
  FROM payments GROUP BY customer_id
)
SELECT c.name,
       COALESCE(ot.total_ordered, 0) AS total_ordered,
       COALESCE(pt.total_paid, 0)    AS total_paid
FROM customers c
LEFT JOIN order_totals ot   ON ot.customer_id = c.id
LEFT JOIN payment_totals pt ON pt.customer_id = c.id;`,
      points: [
        "Two independent one-to-many joins multiply rows.",
        "Aggregate first, then join.",
        "COUNT(DISTINCT ...) hides the problem for counts but not for sums.",
      ],
      difficulty: 'Advanced',
    },
  ],
}

export default topic
