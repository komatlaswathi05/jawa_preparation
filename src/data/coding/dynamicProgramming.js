const questions = [
  {
    id: 'dynamic-programming-01',
    category: 'Dynamic Programming',
    topicId: 'java-fundamentals',
    title: 'Climbing Stairs (Memoization vs Tabulation)',
    problem: 'You climb a staircase of n steps, taking 1 or 2 steps at a time. In how many distinct ways can you reach the top? Solve it top-down with memoization, bottom-up with a table, and finally in O(1) space.',
    input: 'n = 5',
    output: '8',
    explanation: "Dynamic programming (DP) solves a problem by combining answers to smaller overlapping subproblems and remembering them. To reach step n, your last move was either from step n - 1 or from step n - 2, so ways(n) = ways(n - 1) + ways(n - 2), with ways(1) = 1 and ways(2) = 2.\n\nThere are two styles. Top-down (memoization) keeps the natural recursion but caches each result. Bottom-up (tabulation) fills an array from the smallest case upwards and needs no recursion. When each state only depends on the previous two, you can keep just two variables. In an interview, state the recurrence first, then choose the style.",
    solution: `// 1. Top-down: recursion + memo
public static int climbMemo(int n) {
    return climb(n, new int[n + 1]);
}

private static int climb(int n, int[] memo) {
    if (n <= 2) return n;
    if (memo[n] != 0) return memo[n];
    return memo[n] = climb(n - 1, memo) + climb(n - 2, memo);
}

// 2. Bottom-up: table
public static int climbTable(int n) {
    if (n <= 2) return n;
    int[] dp = new int[n + 1];
    dp[1] = 1;
    dp[2] = 2;
    for (int i = 3; i <= n; i++) {
        dp[i] = dp[i - 1] + dp[i - 2];
    }
    return dp[n];
}

// 3. Bottom-up with O(1) space
public static int climbStairs(int n) {
    if (n <= 2) return n;
    int twoBack = 1, oneBack = 2;
    for (int i = 3; i <= n; i++) {
        int current = oneBack + twoBack;
        twoBack = oneBack;
        oneBack = current;
    }
    return oneBack;
}`,
    complexity: 'Time: O(n); Space: O(n) for memo/table, O(1) for the last version',
    difficulty: 'Easy',
  },
  {
    id: 'dynamic-programming-02',
    category: 'Dynamic Programming',
    topicId: 'java-fundamentals',
    title: 'House Robber',
    problem: 'Houses along a street hold some money each. You cannot rob two adjacent houses. Return the maximum amount you can rob.',
    input: 'nums = [2, 7, 9, 3, 1]',
    output: '12   (2 + 9 + 1)',
    explanation: "At each house you make a choice: skip it and keep the best total up to the previous house, or rob it and add its money to the best total up to the house before the previous one. So best(i) = max(best(i - 1), best(i - 2) + nums[i]).\n\nThe choice at each step is what makes this DP rather than a greedy problem: always robbing the richest house can block two good neighbours. Only the last two results are needed, so two variables are enough.",
    solution: `public static int rob(int[] nums) {
    int prev2 = 0;          // best up to house i - 2
    int prev1 = 0;          // best up to house i - 1
    for (int money : nums) {
        int current = Math.max(prev1, prev2 + money);   // skip or rob
        prev2 = prev1;
        prev1 = current;
    }
    return prev1;
}`,
    complexity: 'Time: O(n), Space: O(1)',
    difficulty: 'Medium',
  },
  {
    id: 'dynamic-programming-03',
    category: 'Dynamic Programming',
    topicId: 'java-fundamentals',
    title: 'Coin Change (Minimum Coins)',
    problem: 'Given coin denominations and an amount, return the fewest coins needed to make that amount, or -1 if it cannot be made. You have unlimited coins of each type.',
    input: 'coins = [1, 2, 5], amount = 11',
    output: '3   (5 + 5 + 1)',
    explanation: "Greedy (always take the biggest coin) fails for some coin systems: with coins [1, 3, 4] and amount 6, greedy gives 4 + 1 + 1 but 3 + 3 is better. DP checks every option: dp[a] is the fewest coins for amount a, and dp[a] = 1 + min(dp[a - coin]) over all coins that fit.\n\nFill dp from 0 up to the amount, with dp[0] = 0. Initialise the rest to amount + 1, a value larger than any real answer, which acts as \"impossible\" without the overflow risk of Integer.MAX_VALUE + 1.",
    solution: `public static int coinChange(int[] coins, int amount) {
    int[] dp = new int[amount + 1];
    Arrays.fill(dp, amount + 1);            // "infinity"
    dp[0] = 0;
    for (int a = 1; a <= amount; a++) {
        for (int coin : coins) {
            if (coin <= a) {
                dp[a] = Math.min(dp[a], dp[a - coin] + 1);
            }
        }
    }
    return dp[amount] > amount ? -1 : dp[amount];
}`,
    complexity: 'Time: O(amount * coins), Space: O(amount)',
    difficulty: 'Medium',
  },
  {
    id: 'dynamic-programming-04',
    category: 'Dynamic Programming',
    topicId: 'java-fundamentals',
    title: 'Coin Change II (Number of Ways)',
    problem: 'Given coin denominations and an amount, return the number of different combinations of coins that add up to the amount. Order does not matter.',
    input: 'coins = [1, 2, 5], amount = 5',
    output: '4   (5, 2+2+1, 2+1+1+1, 1+1+1+1+1)',
    explanation: "dp[a] counts the ways to make amount a, with dp[0] = 1 (one way to make zero: use nothing). For each coin, every amount a >= coin gains dp[a - coin] new ways that end with that coin.\n\nThe loop order is the important detail. Looping over coins on the outside counts combinations: each combination is built in coin order, so 1+2 and 2+1 are counted once. Swapping the loops (amounts outside) would count permutations instead, giving a different answer. Interviewers often ask exactly this.",
    solution: `public static int change(int amount, int[] coins) {
    int[] dp = new int[amount + 1];
    dp[0] = 1;
    for (int coin : coins) {                 // coins outer: combinations
        for (int a = coin; a <= amount; a++) {
            dp[a] += dp[a - coin];
        }
    }
    return dp[amount];
}`,
    complexity: 'Time: O(amount * coins), Space: O(amount)',
    difficulty: 'Medium',
  },
  {
    id: 'dynamic-programming-05',
    category: 'Dynamic Programming',
    topicId: 'java-fundamentals',
    title: 'Longest Increasing Subsequence',
    problem: 'Return the length of the longest strictly increasing subsequence of an array. A subsequence keeps the original order but may skip elements.',
    input: 'nums = [10, 9, 2, 5, 3, 7, 101, 18]',
    output: '4   (for example 2, 3, 7, 18)',
    explanation: "The O(n^2) DP: dp[i] is the length of the longest increasing subsequence ending at index i. It is 1 plus the best dp[j] for any earlier j with nums[j] < nums[i]. The answer is the maximum dp value.\n\nThe O(n log n) solution keeps an array `tails`, where tails[k] is the smallest possible tail of an increasing subsequence of length k + 1. For each number, binary-search the first tail that is >= it and replace it (or append if the number is bigger than every tail). The length of `tails` is the answer. `tails` is not itself a valid subsequence, only its length is meaningful.",
    solution: `// O(n^2) dynamic programming
public static int lengthOfLIS(int[] nums) {
    int[] dp = new int[nums.length];
    int best = 0;
    for (int i = 0; i < nums.length; i++) {
        dp[i] = 1;
        for (int j = 0; j < i; j++) {
            if (nums[j] < nums[i]) {
                dp[i] = Math.max(dp[i], dp[j] + 1);
            }
        }
        best = Math.max(best, dp[i]);
    }
    return best;
}

// O(n log n) with binary search
public static int lengthOfLISFast(int[] nums) {
    int[] tails = new int[nums.length];
    int size = 0;
    for (int x : nums) {
        int lo = 0, hi = size;
        while (lo < hi) {                    // first tail >= x
            int mid = (lo + hi) >>> 1;
            if (tails[mid] < x) lo = mid + 1;
            else hi = mid;
        }
        tails[lo] = x;
        if (lo == size) size++;
    }
    return size;
}`,
    complexity: 'Time: O(n^2) or O(n log n); Space: O(n)',
    difficulty: 'Medium',
  },
  {
    id: 'dynamic-programming-06',
    category: 'Dynamic Programming',
    topicId: 'java-fundamentals',
    title: 'Longest Common Subsequence',
    problem: 'Return the length of the longest subsequence common to two strings.',
    input: 'a = "abcde", b = "ace"',
    output: '3   ("ace")',
    explanation: "This is the classic two-string DP. dp[i][j] is the LCS length of the first i characters of a and the first j characters of b. If a[i - 1] equals b[j - 1], that character extends the LCS of the shorter prefixes: dp[i][j] = dp[i - 1][j - 1] + 1. Otherwise drop the last character of one string or the other: dp[i][j] = max(dp[i - 1][j], dp[i][j - 1]).\n\nRow 0 and column 0 represent empty prefixes and stay 0. The same table shape is used by diff tools (such as git diff) and in DNA sequence comparison.",
    solution: `public static int longestCommonSubsequence(String a, String b) {
    int m = a.length(), n = b.length();
    int[][] dp = new int[m + 1][n + 1];
    for (int i = 1; i <= m; i++) {
        for (int j = 1; j <= n; j++) {
            if (a.charAt(i - 1) == b.charAt(j - 1)) {
                dp[i][j] = dp[i - 1][j - 1] + 1;
            } else {
                dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
            }
        }
    }
    return dp[m][n];
}`,
    complexity: 'Time: O(m * n), Space: O(m * n) (reducible to O(n) with two rows)',
    difficulty: 'Medium',
  },
  {
    id: 'dynamic-programming-07',
    category: 'Dynamic Programming',
    topicId: 'java-fundamentals',
    title: 'Edit Distance',
    problem: 'Return the minimum number of single-character insertions, deletions or replacements needed to turn word1 into word2.',
    input: 'word1 = "horse", word2 = "ros"',
    output: '3   (horse -> rorse -> rose -> ros)',
    explanation: "dp[i][j] is the edit distance between the first i characters of word1 and the first j characters of word2. Turning a prefix into the empty string costs its length, so dp[i][0] = i and dp[0][j] = j.\n\nIf the last characters match, no edit is needed: dp[i][j] = dp[i - 1][j - 1]. Otherwise take the cheapest of three operations plus one: replace (dp[i - 1][j - 1]), delete from word1 (dp[i - 1][j]) or insert into word1 (dp[i][j - 1]). This Levenshtein distance powers spell checkers and fuzzy search.",
    solution: `public static int minDistance(String word1, String word2) {
    int m = word1.length(), n = word2.length();
    int[][] dp = new int[m + 1][n + 1];
    for (int i = 0; i <= m; i++) dp[i][0] = i;
    for (int j = 0; j <= n; j++) dp[0][j] = j;

    for (int i = 1; i <= m; i++) {
        for (int j = 1; j <= n; j++) {
            if (word1.charAt(i - 1) == word2.charAt(j - 1)) {
                dp[i][j] = dp[i - 1][j - 1];
            } else {
                dp[i][j] = 1 + Math.min(dp[i - 1][j - 1],        // replace
                               Math.min(dp[i - 1][j],            // delete
                                        dp[i][j - 1]));          // insert
            }
        }
    }
    return dp[m][n];
}`,
    complexity: 'Time: O(m * n), Space: O(m * n)',
    difficulty: 'Hard',
  },
  {
    id: 'dynamic-programming-08',
    category: 'Dynamic Programming',
    topicId: 'java-fundamentals',
    title: '0/1 Knapsack',
    problem: 'Given item weights, item values and a bag capacity, return the maximum total value you can carry. Each item can be taken at most once.',
    input: 'weights = [1, 3, 4, 5], values = [1, 4, 5, 7], capacity = 7',
    output: '9   (items with weights 3 and 4)',
    explanation: "For each item you either leave it or take it (if it fits). dp[c] is the best value for capacity c using the items processed so far. Taking item i gives values[i] + dp[c - weights[i]].\n\nWith a one-dimensional array, loop the capacity downwards. That way dp[c - weight] still holds the value from before this item was considered, so each item is used at most once. Looping upwards would let the same item be added repeatedly, which solves the unbounded knapsack instead. That subtle difference is a favourite follow-up question.",
    solution: `public static int knapsack(int[] weights, int[] values, int capacity) {
    int[] dp = new int[capacity + 1];
    for (int i = 0; i < weights.length; i++) {
        for (int c = capacity; c >= weights[i]; c--) {      // downwards: each item once
            dp[c] = Math.max(dp[c], values[i] + dp[c - weights[i]]);
        }
    }
    return dp[capacity];
}`,
    complexity: 'Time: O(items * capacity), Space: O(capacity)',
    difficulty: 'Medium',
  },
  {
    id: 'dynamic-programming-09',
    category: 'Dynamic Programming',
    topicId: 'java-fundamentals',
    title: 'Word Break',
    problem: 'Return true if a string can be split into a sequence of one or more words from a dictionary. Words can be reused.',
    input: 's = "applepenapple", dict = ["apple", "pen"]',
    output: 'true   ("apple pen apple")',
    explanation: "dp[i] is true if the first i characters can be split into dictionary words. dp[0] is true (the empty prefix). For each end position i, look for a split point j where dp[j] is true and the substring s[j, i) is a dictionary word.\n\nPut the dictionary in a HashSet for O(1) lookups. Without DP, plain recursion re-checks the same suffixes many times and becomes exponential for inputs like \"aaaaaaaab\" with words \"a\", \"aa\", \"aaa\".",
    solution: `public static boolean wordBreak(String s, List<String> words) {
    Set<String> dict = new HashSet<>(words);
    boolean[] dp = new boolean[s.length() + 1];
    dp[0] = true;
    for (int i = 1; i <= s.length(); i++) {
        for (int j = 0; j < i; j++) {
            if (dp[j] && dict.contains(s.substring(j, i))) {
                dp[i] = true;
                break;
            }
        }
    }
    return dp[s.length()];
}`,
    complexity: 'Time: O(n^2) substring checks, each costing O(n), so O(n^3); Space: O(n)',
    difficulty: 'Medium',
  },
  {
    id: 'dynamic-programming-10',
    category: 'Dynamic Programming',
    topicId: 'java-fundamentals',
    title: 'Minimum Path Sum in a Grid',
    problem: 'Given a grid of non-negative numbers, find a path from the top-left to the bottom-right corner, moving only right or down, that minimises the sum of the numbers along it.',
    input: 'grid =\n1 3 1\n1 5 1\n4 2 1',
    output: '7   (1 -> 3 -> 1 -> 1 -> 1)',
    explanation: "Each cell can only be reached from the cell above or the cell on the left, so the cheapest way to reach it is its own value plus the cheaper of those two. The first row can only be reached from the left, and the first column only from above.\n\nFill the table row by row. Because each row only needs the previous row, a single one-dimensional array is enough: dp[c] holds the value from the row above until it is overwritten, and dp[c - 1] is the cell on the left in the current row.",
    solution: `public static int minPathSum(int[][] grid) {
    int rows = grid.length, cols = grid[0].length;
    int[] dp = new int[cols];
    for (int r = 0; r < rows; r++) {
        for (int c = 0; c < cols; c++) {
            if (r == 0 && c == 0) {
                dp[c] = grid[0][0];
            } else if (r == 0) {
                dp[c] = dp[c - 1] + grid[r][c];              // only from the left
            } else if (c == 0) {
                dp[c] = dp[c] + grid[r][c];                  // only from above
            } else {
                dp[c] = Math.min(dp[c], dp[c - 1]) + grid[r][c];
            }
        }
    }
    return dp[cols - 1];
}`,
    complexity: 'Time: O(rows * cols), Space: O(cols)',
    difficulty: 'Medium',
  },
  {
    id: 'dynamic-programming-11',
    category: 'Dynamic Programming',
    topicId: 'java-fundamentals',
    title: 'Partition Equal Subset Sum',
    problem: 'Return true if an array of positive integers can be split into two subsets with equal sums.',
    input: 'nums = [1, 5, 11, 5]',
    output: 'true   ([1, 5, 5] and [11])',
    explanation: "If the total is odd, it is impossible. Otherwise the question becomes: is there a subset that sums to exactly total / 2? That is a 0/1 knapsack where you only care whether a sum is reachable.\n\ncan[s] is true if some subset of the numbers processed so far sums to s, with can[0] = true. For each number, loop the sums downwards (so each number is used once) and set can[s] |= can[s - num]. You can stop early as soon as the target becomes reachable.",
    solution: `public static boolean canPartition(int[] nums) {
    int total = 0;
    for (int x : nums) total += x;
    if (total % 2 != 0) return false;

    int target = total / 2;
    boolean[] can = new boolean[target + 1];
    can[0] = true;
    for (int num : nums) {
        for (int s = target; s >= num; s--) {    // downwards: each number once
            can[s] = can[s] || can[s - num];
        }
        if (can[target]) return true;
    }
    return can[target];
}`,
    complexity: 'Time: O(n * sum), Space: O(sum)',
    difficulty: 'Medium',
  },
  {
    id: 'dynamic-programming-12',
    category: 'Dynamic Programming',
    topicId: 'java-fundamentals',
    title: 'Longest Palindromic Substring',
    problem: 'Return the longest substring of s that reads the same forwards and backwards.',
    input: 's = "babad"',
    output: '"bab"   ("aba" is also valid)',
    explanation: "A DP table where dp[i][j] says whether s[i..j] is a palindrome works in O(n^2) time and space: s[i..j] is a palindrome if its end characters match and s[i+1..j-1] is a palindrome.\n\nThe simpler O(1)-space version expands around centres, using the same idea. Every palindrome mirrors around a centre, which is either a character (odd length) or the gap between two characters (even length). For each of the 2n - 1 centres, expand outwards while the characters match and remember the longest palindrome found.",
    solution: `public static String longestPalindrome(String s) {
    if (s.isEmpty()) return s;
    int start = 0, end = 0;
    for (int i = 0; i < s.length(); i++) {
        int odd = expand(s, i, i);           // centre on a character
        int even = expand(s, i, i + 1);      // centre between two characters
        int len = Math.max(odd, even);
        if (len > end - start + 1) {
            start = i - (len - 1) / 2;
            end = i + len / 2;
        }
    }
    return s.substring(start, end + 1);
}

// returns the length of the palindrome around the centre
private static int expand(String s, int left, int right) {
    while (left >= 0 && right < s.length() && s.charAt(left) == s.charAt(right)) {
        left--;
        right++;
    }
    return right - left - 1;
}`,
    complexity: 'Time: O(n^2), Space: O(1)',
    difficulty: 'Medium',
  },
]

export default questions
