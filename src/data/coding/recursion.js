const questions = [
  {
    id: 'recursion-01',
    category: 'Recursion',
    topicId: 'java-fundamentals',
    title: 'Factorial of a Number',
    problem: 'Write a recursive method that returns n! (n factorial), which is n * (n - 1) * ... * 1. By definition 0! = 1.',
    input: 'n = 5',
    output: '120',
    explanation: 'Every recursive method needs a base case (when to stop) and a recursive case (how to shrink the problem). Here the base case is n <= 1, which returns 1.\n\nOtherwise, n! = n * (n - 1)!, so the method calls itself with n - 1. The calls stack up until n reaches 1, then the results are multiplied on the way back. We use `long` because factorials grow very fast (20! is the largest that fits in a long).',
    solution: `public static long factorial(int n) {
    if (n < 0) {
        throw new IllegalArgumentException("n must be >= 0");
    }
    if (n <= 1) {
        return 1;                    // base case
    }
    return n * factorial(n - 1);     // recursive case
}`,
    complexity: 'Time: O(n), Space: O(n) for the call stack',
    difficulty: 'Easy',
  },
  {
    id: 'recursion-02',
    category: 'Recursion',
    topicId: 'java-fundamentals',
    title: 'Fibonacci Number (Plain and Memoized)',
    problem: 'Return the nth Fibonacci number, where fib(0) = 0, fib(1) = 1 and fib(n) = fib(n - 1) + fib(n - 2). Write the simple recursive version and then a faster memoized version.',
    input: 'n = 10',
    output: '55',
    explanation: 'The plain version follows the definition directly, but it recomputes the same values again and again: fib(5) calls fib(3) twice, fib(2) three times, and so on. That makes it exponential, O(2^n).\n\nMemoization means remembering answers you already computed. We store each result in a `Map` (or array); before computing, we check whether the answer is already there. Each value is now computed once, so the time drops to O(n).',
    solution: `// Plain recursion: simple but slow, O(2^n)
public static long fib(int n) {
    if (n <= 1) {
        return n;
    }
    return fib(n - 1) + fib(n - 2);
}

// Memoized recursion: each value computed once, O(n)
public static long fibMemo(int n) {
    return fibMemo(n, new HashMap<>());
}

private static long fibMemo(int n, Map<Integer, Long> memo) {
    if (n <= 1) {
        return n;
    }
    if (memo.containsKey(n)) {
        return memo.get(n);
    }
    long result = fibMemo(n - 1, memo) + fibMemo(n - 2, memo);
    memo.put(n, result);
    return result;
}`,
    complexity: 'Time: O(2^n) plain, O(n) memoized; Space: O(n)',
    difficulty: 'Easy',
  },
  {
    id: 'recursion-03',
    category: 'Recursion',
    topicId: 'java-fundamentals',
    title: 'Sum of Digits',
    problem: 'Given a non-negative integer, return the sum of its digits using recursion.',
    input: 'n = 1234',
    output: '10   (1 + 2 + 3 + 4)',
    explanation: '`n % 10` gives the last digit and `n / 10` removes it. So the sum of digits of n is the last digit plus the sum of digits of the rest.\n\nThe base case is n == 0, where the sum is 0.',
    solution: `public static int sumOfDigits(int n) {
    if (n == 0) {
        return 0;
    }
    return n % 10 + sumOfDigits(n / 10);
}`,
    complexity: 'Time: O(d), Space: O(d) where d is the number of digits',
    difficulty: 'Easy',
  },
  {
    id: 'recursion-04',
    category: 'Recursion',
    topicId: 'java-fundamentals',
    title: 'Power Function (Fast Exponentiation)',
    problem: 'Compute x raised to the power n (x^n) where n can be negative, in O(log n) time. Do not use `Math.pow`.',
    input: 'x = 2.0, n = 10',
    output: '1024.0   (for x = 2.0, n = -2 the answer is 0.25)',
    explanation: 'Multiplying x by itself n times is O(n). Instead, use the fact that x^n = (x^(n/2))^2 when n is even, and x * (x^(n/2))^2 when n is odd. Each call halves n, so there are only about log n calls.\n\nCompute the half power once and reuse it; calling it twice would destroy the speed-up. For a negative n, compute x^(-n) and take 1 divided by it. We convert n to `long` first because negating `Integer.MIN_VALUE` would overflow.',
    solution: `public static double power(double x, int n) {
    long exp = n;                 // long avoids overflow for Integer.MIN_VALUE
    if (exp < 0) {
        return 1.0 / fastPow(x, -exp);
    }
    return fastPow(x, exp);
}

private static double fastPow(double x, long n) {
    if (n == 0) {
        return 1.0;
    }
    double half = fastPow(x, n / 2);
    if (n % 2 == 0) {
        return half * half;
    }
    return half * half * x;
}`,
    complexity: 'Time: O(log n), Space: O(log n) for the call stack',
    difficulty: 'Medium',
  },
  {
    id: 'recursion-05',
    category: 'Recursion',
    topicId: 'java-fundamentals',
    title: 'Reverse a String Recursively',
    problem: 'Reverse a string using recursion, without using `StringBuilder.reverse()` or loops.',
    input: 'str = "hello"',
    output: '"olleh"',
    explanation: 'The reverse of a string is the reverse of everything after the first character, followed by the first character. For "hello" that is reverse("ello") + "h".\n\nThe base case is a string of length 0 or 1, which is already its own reverse. Note that `substring` creates new strings, so this is fine for learning but a loop is more efficient in real code.',
    solution: `public static String reverse(String str) {
    if (str.length() <= 1) {
        return str;
    }
    return reverse(str.substring(1)) + str.charAt(0);
}`,
    complexity: 'Time: O(n^2) because of substring copies, Space: O(n^2)',
    difficulty: 'Easy',
  },
  {
    id: 'recursion-06',
    category: 'Recursion',
    topicId: 'java-fundamentals',
    title: 'Check Palindrome Recursively',
    problem: 'Check whether a string reads the same forwards and backwards, using recursion.',
    input: 'str = "racecar"',
    output: 'true   (for "hello" the answer is false)',
    explanation: 'Compare the first and last characters. If they differ, it is not a palindrome. If they match, check the inner part of the string the same way.\n\nWe pass two indexes (left and right) instead of creating substrings, so no extra strings are made. The base case is when the indexes meet or cross.',
    solution: `public static boolean isPalindrome(String str) {
    return isPalindrome(str, 0, str.length() - 1);
}

private static boolean isPalindrome(String str, int left, int right) {
    if (left >= right) {
        return true;
    }
    if (str.charAt(left) != str.charAt(right)) {
        return false;
    }
    return isPalindrome(str, left + 1, right - 1);
}`,
    complexity: 'Time: O(n), Space: O(n) for the call stack',
    difficulty: 'Easy',
  },
  {
    id: 'recursion-07',
    category: 'Recursion',
    topicId: null,
    title: 'Recursive Binary Search',
    problem: 'Given a sorted array and a target, return the index of the target using recursive binary search, or -1 if it is not present.',
    input: 'nums = [1, 3, 5, 7, 9, 11], target = 7',
    output: '3',
    explanation: 'Look at the middle element. If it is the target, we are done. If the target is smaller, search the left half; if bigger, search the right half.\n\nEach call throws away half the array, so it takes O(log n) calls. The base case is low > high, meaning the range is empty. `low + (high - low) / 2` is used instead of `(low + high) / 2` to avoid integer overflow on huge arrays.',
    solution: `public static int binarySearch(int[] nums, int target) {
    return binarySearch(nums, target, 0, nums.length - 1);
}

private static int binarySearch(int[] nums, int target, int low, int high) {
    if (low > high) {
        return -1;                          // not found
    }
    int mid = low + (high - low) / 2;
    if (nums[mid] == target) {
        return mid;
    } else if (target < nums[mid]) {
        return binarySearch(nums, target, low, mid - 1);
    } else {
        return binarySearch(nums, target, mid + 1, high);
    }
}`,
    complexity: 'Time: O(log n), Space: O(log n) for the call stack',
    difficulty: 'Easy',
  },
  {
    id: 'recursion-08',
    category: 'Recursion',
    topicId: 'java-fundamentals',
    title: 'Generate All Subsets',
    problem: 'Given an array of distinct integers, return all possible subsets (the power set). The order of subsets does not matter.',
    input: 'nums = [1, 2, 3]',
    output: '[[], [3], [2], [2, 3], [1], [1, 3], [1, 2], [1, 2, 3]]',
    explanation: 'For every element we make a choice: leave it out or take it. Recursion explores both choices, moving to the next index each time. When the index reaches the end, the current list is one complete subset.\n\nThis pattern is called backtracking: we add an element, recurse, then remove it again ("undo the choice") before trying the other branch. With n elements there are 2^n subsets.',
    solution: `public static List<List<Integer>> subsets(int[] nums) {
    List<List<Integer>> result = new ArrayList<>();
    build(nums, 0, new ArrayList<>(), result);
    return result;
}

private static void build(int[] nums, int index, List<Integer> current,
                          List<List<Integer>> result) {
    if (index == nums.length) {
        result.add(new ArrayList<>(current));   // copy the finished subset
        return;
    }
    // Choice 1: skip nums[index]
    build(nums, index + 1, current, result);

    // Choice 2: take nums[index]
    current.add(nums[index]);
    build(nums, index + 1, current, result);
    current.remove(current.size() - 1);        // backtrack
}`,
    complexity: 'Time: O(n * 2^n), Space: O(n) recursion depth (plus the output)',
    difficulty: 'Medium',
  },
  {
    id: 'recursion-09',
    category: 'Recursion',
    topicId: 'java-fundamentals',
    title: 'All Permutations of a String',
    problem: 'Given a string with distinct characters, return all its permutations (every possible ordering of its characters).',
    input: 'str = "abc"',
    output: '[abc, acb, bac, bca, cab, cba]',
    explanation: 'Pick each character in turn to be the first one, then recursively find all permutations of the remaining characters and put the chosen character in front.\n\nWe carry a `prefix` (characters chosen so far) and `remaining` (characters still to place). When nothing remains, the prefix is a full permutation. A string of length n has n! permutations. If the string can contain duplicate characters, collect results in a `Set` to remove repeats.',
    solution: `public static List<String> permutations(String str) {
    List<String> result = new ArrayList<>();
    permute("", str, result);
    return result;
}

private static void permute(String prefix, String remaining, List<String> result) {
    if (remaining.isEmpty()) {
        result.add(prefix);
        return;
    }
    for (int i = 0; i < remaining.length(); i++) {
        char chosen = remaining.charAt(i);
        String rest = remaining.substring(0, i) + remaining.substring(i + 1);
        permute(prefix + chosen, rest, result);
    }
}`,
    complexity: 'Time: O(n * n!), Space: O(n) recursion depth (plus the output)',
    difficulty: 'Medium',
  },
  {
    id: 'recursion-10',
    category: 'Recursion',
    topicId: 'java-fundamentals',
    title: 'Tower of Hanoi',
    problem: 'There are three rods (A, B, C) and n disks of different sizes stacked on rod A, largest at the bottom. Move all disks to rod C, one disk at a time, never placing a larger disk on a smaller one. Print each move.',
    input: 'n = 2, from = A, to = C, via = B',
    output: 'Move disk 1 from A to B\nMove disk 2 from A to C\nMove disk 1 from B to C',
    explanation: 'Think of it in three steps. First, move the top n - 1 disks out of the way onto the helper rod. Second, move the biggest disk directly to the target. Third, move the n - 1 disks from the helper rod onto the target.\n\nSteps one and three are the same problem with one fewer disk, so recursion handles them. The base case is n == 0 (nothing to move). The total number of moves is 2^n - 1.',
    solution: `public static void hanoi(int n, char from, char to, char via) {
    if (n == 0) {
        return;
    }
    hanoi(n - 1, from, via, to);   // move n-1 disks out of the way
    System.out.println("Move disk " + n + " from " + from + " to " + to);
    hanoi(n - 1, via, to, from);   // move them onto the biggest disk
}

// Usage: hanoi(3, 'A', 'C', 'B');`,
    complexity: 'Time: O(2^n), Space: O(n) for the call stack',
    difficulty: 'Medium',
  },
  {
    id: 'recursion-11',
    category: 'Recursion',
    topicId: 'java-fundamentals',
    title: 'Flatten a Nested List',
    problem: 'Given a list whose elements are either integers or other lists (which can be nested to any depth), return a flat list of all the integers in order.',
    input: 'nested = [1, [2, [3, 4]], 5, [[6]]]',
    output: '[1, 2, 3, 4, 5, 6]',
    explanation: 'Loop through the elements. If an element is an `Integer`, add it to the result. If it is itself a `List`, call the same method on it, which flattens that inner list into the same result.\n\nThe recursion naturally handles any depth. Java 17 pattern matching for `instanceof` lets us check the type and cast in one step.',
    solution: `public static List<Integer> flatten(List<?> nested) {
    List<Integer> result = new ArrayList<>();
    flattenInto(nested, result);
    return result;
}

private static void flattenInto(List<?> nested, List<Integer> result) {
    for (Object item : nested) {
        if (item instanceof Integer number) {
            result.add(number);
        } else if (item instanceof List<?> inner) {
            flattenInto(inner, result);    // recurse into the sub-list
        } else {
            throw new IllegalArgumentException("Unsupported element: " + item);
        }
    }
}

// Usage:
// List<Object> nested = List.of(1, List.of(2, List.of(3, 4)), 5, List.of(List.of(6)));
// flatten(nested); // [1, 2, 3, 4, 5, 6]`,
    complexity: 'Time: O(n) where n is the total number of elements and lists, Space: O(d) for depth d',
    difficulty: 'Hard',
  },
  {
    id: 'recursion-12',
    category: 'Recursion',
    topicId: 'java-fundamentals',
    title: 'Count Paths in a Grid',
    problem: 'A robot starts at the top-left corner of an m x n grid and wants to reach the bottom-right corner. It can only move right or down. Count the number of unique paths.',
    input: 'm = 3, n = 3',
    output: '6',
    explanation: 'To reach cell (r, c), the robot must come from the cell above (r - 1, c) or the cell on the left (r, c - 1). So paths(r, c) = paths(r - 1, c) + paths(r, c - 1). Any cell in the first row or first column has exactly 1 path.\n\nPlain recursion recomputes the same cells many times (exponential time). Memoization stores each cell answer in a 2D array, so every cell is computed once, giving O(m * n).',
    solution: `public static long countPaths(int m, int n) {
    long[][] memo = new long[m][n];
    return paths(m - 1, n - 1, memo);
}

private static long paths(int row, int col, long[][] memo) {
    if (row == 0 || col == 0) {
        return 1;                       // only one straight path
    }
    if (memo[row][col] != 0) {
        return memo[row][col];          // already computed
    }
    memo[row][col] = paths(row - 1, col, memo) + paths(row, col - 1, memo);
    return memo[row][col];
}`,
    complexity: 'Time: O(m * n), Space: O(m * n)',
    difficulty: 'Hard',
  },
]

export default questions
