const topic = {
  id: 'sql-subqueries',
  category: 'sql',
  title: 'Subqueries',
  description: "Queries inside queries: scalar, multi-row, correlated and derived-table subqueries, EXISTS vs IN, and how they compare to joins.",
  difficulty: 'Intermediate',
  overview: "A subquery (also called an inner query or nested query) is a SELECT written inside another SQL statement. The outer query uses the inner query's result as a value, a list of values, or a temporary table. Subqueries let you answer questions in steps, such as \"find employees who earn more than the company average\": first compute the average, then compare against it.\n\nThink of it like asking a colleague a quick question in the middle of your own task. You pause, get the answer (the average salary), and continue using it.\n\nSubqueries can appear in WHERE, in SELECT, in FROM (derived tables) and in HAVING. Examples use `employees(id, name, email, salary, department_id, manager_id)`, `departments(id, name)`, `customers(id, name, email, city)` and `orders(id, customer_id, amount, status, created_at)`.",

  subtopics: [
    {
      id: 'what-is-a-subquery',
      title: 'What is a subquery?',
      explanation: "A subquery is a SELECT enclosed in parentheses and used inside another statement. It can be used in SELECT, INSERT, UPDATE and DELETE. Subqueries are classified by what they return (one value, one column of many values, or a whole table) and by whether they depend on the outer query (correlated) or not (non-correlated).",
      example: `SELECT name, salary
FROM employees
WHERE salary > (SELECT AVG(salary) FROM employees);`,
      interviewPoints: [
        "Always wrapped in parentheses.",
        "Non-correlated subqueries run once; correlated ones conceptually run per outer row.",
      ],
    },
    {
      id: 'scalar-subquery',
      title: 'Scalar subqueries',
      explanation: "A scalar subquery returns exactly one row with one column, so it can be used anywhere a single value is allowed: in WHERE, in SELECT or in an expression. If it returns no rows, the value is NULL. If it returns more than one row, PostgreSQL raises the error \"more than one row returned by a subquery used as an expression\".",
      example: `SELECT name,
       salary,
       salary - (SELECT AVG(salary) FROM employees) AS diff_from_avg
FROM employees;`,
      interviewPoints: [
        "Must return at most one row and one column.",
        "Zero rows becomes NULL; more than one row is an error.",
      ],
    },
    {
      id: 'multi-row-subquery',
      title: 'Multi-row subqueries: IN, ANY, ALL',
      explanation: "A multi-row subquery returns a single column with many rows. You compare against it with `IN` (equal to any value in the list), `= ANY` (same as IN), `> ANY` (greater than at least one value) or `> ALL` (greater than every value).\n\n`> ALL` over an empty list is TRUE, and `NOT IN` over a list containing a NULL is never TRUE, two edge cases worth remembering.",
      example: `-- employees in the Engineering or Sales departments
SELECT name FROM employees
WHERE department_id IN (
  SELECT id FROM departments WHERE name IN ('Engineering', 'Sales')
);

-- earns more than everyone in department 2
SELECT name, salary FROM employees
WHERE salary > ALL (SELECT salary FROM employees WHERE department_id = 2);

-- earns more than at least one person in department 2
SELECT name, salary FROM employees
WHERE salary > ANY (SELECT salary FROM employees WHERE department_id = 2);`,
      interviewPoints: [
        "IN is equivalent to = ANY.",
        "NOT IN is equivalent to <> ALL, and both break with NULLs.",
        "> ALL on an empty set returns TRUE for every row.",
      ],
    },
    {
      id: 'correlated-subquery',
      title: 'Correlated subqueries',
      explanation: "A correlated subquery references a column from the outer query, so its result depends on the current outer row. Conceptually it runs once per outer row. The classic example is \"employees who earn more than the average of their own department\": the average must be computed per department of the current employee.\n\nThey are easy to read but can be slow on large tables if the optimizer cannot rewrite them; window functions or joins with pre-aggregated data are common alternatives.",
      example: `SELECT e.name, e.salary, e.department_id
FROM employees e
WHERE e.salary > (
  SELECT AVG(e2.salary)
  FROM employees e2
  WHERE e2.department_id = e.department_id   -- refers to outer row
);`,
      interviewPoints: [
        "Correlated = inner query uses an outer column.",
        "Conceptually executed per outer row.",
        "Can often be rewritten with a JOIN or window function.",
      ],
    },
    {
      id: 'exists-vs-in',
      title: 'EXISTS vs IN',
      explanation: "`EXISTS (subquery)` is TRUE if the subquery returns at least one row; it does not care what the columns are, so `SELECT 1` is common. It usually stops at the first match. `IN (subquery)` checks whether a value appears in the list the subquery returns.\n\nFor positive checks, PostgreSQL usually turns both into the same semi-join, so performance is similar. The big difference is with negation: `NOT EXISTS` behaves correctly with NULLs, while `NOT IN` returns no rows if the subquery produces any NULL.",
      example: `-- customers who have at least one order
SELECT c.name FROM customers c
WHERE EXISTS (SELECT 1 FROM orders o WHERE o.customer_id = c.id);

SELECT c.name FROM customers c
WHERE c.id IN (SELECT o.customer_id FROM orders o);

-- safe negation
SELECT c.name FROM customers c
WHERE NOT EXISTS (SELECT 1 FROM orders o WHERE o.customer_id = c.id);`,
      interviewPoints: [
        "EXISTS checks for presence of rows; IN compares values.",
        "Prefer NOT EXISTS over NOT IN.",
        "EXISTS is usually correlated; IN is usually not.",
      ],
    },
    {
      id: 'derived-tables',
      title: 'Subqueries in FROM (derived tables)',
      explanation: "A subquery in FROM produces a temporary result set, called a derived table or inline view, that the outer query treats like a normal table. It must have an alias. Derived tables are useful when you need to aggregate first and then filter or join on the aggregated result, or when you want to filter on a window function result.",
      example: `SELECT dept_stats.department_id, dept_stats.avg_salary
FROM (
  SELECT department_id, AVG(salary) AS avg_salary
  FROM employees
  GROUP BY department_id
) AS dept_stats
WHERE dept_stats.avg_salary > 70000;`,
      interviewPoints: [
        "A derived table needs an alias.",
        "CTEs (WITH) are a more readable way to write the same thing.",
        "Needed to filter on window function results.",
      ],
    },
    {
      id: 'subqueries-in-dml',
      title: 'Subqueries in UPDATE, DELETE and INSERT',
      explanation: "Subqueries are not only for SELECT. You can delete rows based on another table, update values using a computed figure, or insert the result of a query into a table. PostgreSQL also offers `UPDATE ... FROM` and `DELETE ... USING` as join-style alternatives.",
      example: `-- give a 5% raise to employees in Engineering
UPDATE employees
SET salary = salary * 1.05
WHERE department_id = (SELECT id FROM departments WHERE name = 'Engineering');

-- delete orders of customers from a closed city
DELETE FROM orders
WHERE customer_id IN (SELECT id FROM customers WHERE city = 'ClosedTown');

-- archive old orders
INSERT INTO orders_archive
SELECT * FROM orders WHERE created_at < now() - interval '2 years';`,
      interviewPoints: [
        "INSERT ... SELECT copies data in one statement.",
        "UPDATE ... FROM and DELETE ... USING are PostgreSQL join syntax for DML.",
      ],
    },
    {
      id: 'subquery-vs-join',
      title: 'Subquery vs JOIN performance',
      explanation: "Modern optimizers, including PostgreSQL's, often rewrite IN and EXISTS subqueries into semi-joins and anti-joins, so performance is frequently identical. Differences appear with correlated subqueries in SELECT that the optimizer cannot flatten: they may run once per row, which is slow on big tables.\n\nRule of thumb: use a JOIN when you need columns from both tables, EXISTS when you only need to test for existence (it avoids duplicate rows), and always check the real plan with EXPLAIN ANALYZE instead of guessing.",
      example: `-- JOIN: may return a customer many times (one per order)
SELECT DISTINCT c.name
FROM customers c JOIN orders o ON o.customer_id = c.id;

-- EXISTS: each customer once, no DISTINCT needed
SELECT c.name
FROM customers c
WHERE EXISTS (SELECT 1 FROM orders o WHERE o.customer_id = c.id);`,
      interviewPoints: [
        "JOIN can create duplicates; EXISTS cannot.",
        "The optimizer often produces the same plan for both.",
        "Measure with EXPLAIN ANALYZE.",
      ],
    },
  ],

  commonMistakes: [
    "Using a subquery that returns several rows with `=` instead of `IN`, which causes a runtime error.",
    "Using `NOT IN (SELECT col ...)` when `col` can be NULL, so the query silently returns no rows.",
    "Forgetting to alias a derived table in FROM, which PostgreSQL rejects.",
    "Writing a correlated subquery in SELECT for every row of a huge table instead of joining pre-aggregated data.",
    "Using a JOIN only to test existence and then adding DISTINCT to hide the duplicates it created.",
  ],

  interviewTips: [
    "Say what kind of subquery you are writing (scalar, multi-row, correlated, derived); it shows clear thinking.",
    "When asked EXISTS vs IN, always bring up the NOT IN NULL trap.",
    "Offer an alternative: \"I could also write this with a JOIN or a window function\" and explain the trade-off.",
    "Do not claim subqueries are always slower than joins; say the optimizer often makes them equal and you would verify with EXPLAIN.",
  ],

  interviewQuestions: [
    {
      id: 'sql-subqueries-q1',
      question: "What is a subquery, and where can it be used?",
      answer: "A subquery is a SELECT statement nested inside another statement and wrapped in parentheses. It can be used in the WHERE clause (to filter), in the SELECT list (to compute a value per row), in FROM (as a derived table), in HAVING, and inside INSERT, UPDATE and DELETE statements.",
      example: `SELECT name FROM employees
WHERE department_id IN (SELECT id FROM departments WHERE name = 'Sales');`,
      points: [
        "Also called inner or nested query.",
        "Can return a single value, a list, or a table.",
        "Can be correlated or non-correlated.",
      ],
      difficulty: 'Beginner',
    },
    {
      id: 'sql-subqueries-q2',
      question: "Write a query to find employees who earn more than the average salary.",
      answer: "Compute the company average in a scalar subquery and compare each employee's salary against it. The subquery is non-correlated, so it runs only once.",
      example: `SELECT id, name, salary
FROM employees
WHERE salary > (SELECT AVG(salary) FROM employees)
ORDER BY salary DESC;`,
      points: [
        "Scalar subquery returns one value.",
        "Aggregates cannot go directly in WHERE, so the subquery is needed.",
      ],
      difficulty: 'Beginner',
    },
    {
      id: 'sql-subqueries-q3',
      question: "Write a query to find the employee(s) with the highest salary.",
      answer: "Find the maximum salary in a subquery and return every employee whose salary equals it. This correctly returns all employees tied for the top salary, unlike `ORDER BY salary DESC LIMIT 1`, which returns only one of them arbitrarily.",
      example: `SELECT id, name, salary
FROM employees
WHERE salary = (SELECT MAX(salary) FROM employees);`,
      points: [
        "Handles ties correctly.",
        "LIMIT 1 hides ties.",
        "Per department, use a correlated subquery or RANK().",
      ],
      difficulty: 'Beginner',
    },
    {
      id: 'sql-subqueries-q4',
      question: "What is a correlated subquery? Write one that finds employees earning more than their department's average.",
      answer: "A correlated subquery references a column of the outer query, so its value changes for each outer row. Here the inner query calculates the average salary only for the department of the current outer employee, and the outer query keeps the employee if their salary is higher.",
      example: `SELECT e.name, e.salary, e.department_id
FROM employees e
WHERE e.salary > (
  SELECT AVG(e2.salary)
  FROM employees e2
  WHERE e2.department_id = e.department_id
);`,
      points: [
        "Inner query depends on the outer row.",
        "Conceptually runs once per outer row.",
        "Alternative: AVG(salary) OVER (PARTITION BY department_id).",
      ],
      difficulty: 'Intermediate',
    },
    {
      id: 'sql-subqueries-q5',
      question: "What is the difference between EXISTS and IN?",
      answer: "IN checks whether a value is contained in the list of values returned by the subquery. EXISTS checks whether the subquery returns any row at all, and it can stop at the first match. For positive checks PostgreSQL typically plans both as a semi-join with similar performance.\n\nThe important difference is NULL handling in the negated form: `NOT IN` returns no rows if the subquery yields a NULL, whereas `NOT EXISTS` works correctly. That is why NOT EXISTS is the recommended anti-join.",
      example: `-- returns nothing if any orders.customer_id is NULL
SELECT name FROM customers
WHERE id NOT IN (SELECT customer_id FROM orders);

-- always correct
SELECT name FROM customers c
WHERE NOT EXISTS (SELECT 1 FROM orders o WHERE o.customer_id = c.id);`,
      points: [
        "EXISTS = any row? IN = value in list?",
        "NOT IN + NULL = empty result.",
        "Similar performance for positive checks in PostgreSQL.",
      ],
      difficulty: 'Intermediate',
    },
    {
      id: 'sql-subqueries-q6',
      question: "Write a query to find the highest-paid employee(s) in each department.",
      answer: "Use a correlated subquery that finds the maximum salary within the current employee's department and keep employees whose salary equals it. Ties are included. The same result can be produced with a derived table joined on department and max salary, or with RANK() partitioned by department.",
      example: `SELECT e.department_id, e.name, e.salary
FROM employees e
WHERE e.salary = (
  SELECT MAX(e2.salary)
  FROM employees e2
  WHERE e2.department_id = e.department_id
)
ORDER BY e.department_id;

-- join to a derived table
SELECT e.department_id, e.name, e.salary
FROM employees e
JOIN (
  SELECT department_id, MAX(salary) AS max_salary
  FROM employees GROUP BY department_id
) m ON m.department_id = e.department_id AND m.max_salary = e.salary;`,
      points: [
        "Correlated MAX per group.",
        "Derived table + join is often faster on big tables.",
        "Ties are returned in both versions.",
      ],
      difficulty: 'Intermediate',
    },
    {
      id: 'sql-subqueries-q7',
      question: "What is a derived table and when do you need one?",
      answer: "A derived table is a subquery in the FROM clause that acts as a temporary table for the outer query, and it must have an alias. You need one when you want to work with the result of an aggregation or window function as if it were a table: filter on it, join it to other tables or aggregate it again. For example, to filter on ROW_NUMBER() you must compute it in a derived table first, because window functions cannot appear in WHERE.",
      example: `SELECT *
FROM (
  SELECT name, salary,
         ROW_NUMBER() OVER (ORDER BY salary DESC) AS rn
  FROM employees
) ranked
WHERE rn <= 3;`,
      points: [
        "Subquery in FROM with a mandatory alias.",
        "Lets you filter on aggregates or window results.",
        "A CTE is the named, more readable equivalent.",
      ],
      difficulty: 'Intermediate',
    },
    {
      id: 'sql-subqueries-q8',
      question: "Write a query to find the nth highest salary (for example, the 3rd highest) using a subquery.",
      answer: "One portable approach uses a correlated subquery: a salary is the nth highest if exactly n minus 1 distinct salaries are greater than it. A more efficient PostgreSQL approach is DISTINCT with ORDER BY and OFFSET n minus 1. For large tables or per-group variants, DENSE_RANK() is the standard answer.",
      example: `-- correlated version, N = 3
SELECT DISTINCT e1.salary
FROM employees e1
WHERE 2 = (
  SELECT COUNT(DISTINCT e2.salary)
  FROM employees e2
  WHERE e2.salary > e1.salary
);

-- OFFSET version
SELECT DISTINCT salary
FROM employees
ORDER BY salary DESC
OFFSET 2 LIMIT 1;`,
      points: [
        "Count distinct salaries greater than the candidate.",
        "Correlated version is O(n squared) conceptually; fine for small tables only.",
        "DENSE_RANK handles ties and per-group cases cleanly.",
      ],
      difficulty: 'Advanced',
    },
    {
      id: 'sql-subqueries-q9',
      question: "Are subqueries slower than joins? How would you decide which to use?",
      answer: "Not necessarily. PostgreSQL's planner rewrites IN and EXISTS subqueries into semi-joins or anti-joins and often produces the same plan as the equivalent JOIN. Performance problems usually come from correlated scalar subqueries in the SELECT list that cannot be flattened, which run once per outer row, and from NOT IN, which cannot be turned into an efficient anti-join.\n\nChoose by intent: JOIN when you need columns from the other table, EXISTS when you only test existence (no duplicates), and a pre-aggregated derived table or CTE when you need per-group numbers. Then confirm with EXPLAIN ANALYZE.",
      example: `-- slow on big tables: per-row subquery
SELECT c.name,
       (SELECT SUM(o.amount) FROM orders o WHERE o.customer_id = c.id) AS total
FROM customers c;

-- usually faster: aggregate once, then join
SELECT c.name, COALESCE(t.total, 0) AS total
FROM customers c
LEFT JOIN (
  SELECT customer_id, SUM(amount) AS total FROM orders GROUP BY customer_id
) t ON t.customer_id = c.id;`,
      points: [
        "The optimizer often makes them equivalent.",
        "Correlated scalar subqueries in SELECT are the usual culprit.",
        "An index on the correlated column (orders.customer_id) helps a lot.",
        "Always verify with EXPLAIN ANALYZE.",
      ],
      difficulty: 'Advanced',
    },
    {
      id: 'sql-subqueries-q10',
      question: "Explain ANY and ALL with examples, including their edge cases.",
      answer: "`x > ANY (subquery)` is TRUE if x is greater than at least one value returned; `x > ALL (subquery)` is TRUE if x is greater than every value. `= ANY` is the same as IN, and `<> ALL` is the same as NOT IN.\n\nEdge cases: over an empty subquery, ANY is FALSE and ALL is TRUE (so every row passes a `> ALL` test against an empty department). If the subquery contains NULL and no definite answer is found, the result is UNKNOWN, so the row is filtered out.",
      example: `-- earns more than every employee in department 3
SELECT name FROM employees
WHERE salary > ALL (
  SELECT salary FROM employees WHERE department_id = 3 AND salary IS NOT NULL
);`,
      points: [
        "ANY = at least one; ALL = every.",
        "Empty set: ANY is FALSE, ALL is TRUE.",
        "Filter NULLs out of the subquery to avoid UNKNOWN.",
      ],
      difficulty: 'Advanced',
    },
  ],
}

export default topic
