const questions = [
  {
    id: 'arrays-01',
    category: 'Arrays',
    topicId: 'java-fundamentals',
    title: 'Find Maximum and Minimum in an Array',
    problem: 'Find the largest and smallest values in an integer array using a single loop.',
    input: 'nums = [7, 2, 9, -4, 5]',
    output: 'Max: 9, Min: -4',
    explanation: 'Start by assuming the first element is both the max and the min. Then loop through the rest of the array: if an element is bigger than the current max, it becomes the new max; if it is smaller than the current min, it becomes the new min. Starting from the first element (instead of 0) makes it work for all-negative arrays too.',
    solution: `public static void findMaxAndMin(int[] nums) {
    if (nums.length == 0) {
        throw new IllegalArgumentException("Array must not be empty");
    }
    int max = nums[0];
    int min = nums[0];
    for (int i = 1; i < nums.length; i++) {
        if (nums[i] > max) {
            max = nums[i];
        }
        if (nums[i] < min) {
            min = nums[i];
        }
    }
    System.out.println("Max: " + max + ", Min: " + min);
}`,
    complexity: 'Time: O(n), Space: O(1)',
    difficulty: 'Easy',
  },
  {
    id: 'arrays-02',
    category: 'Arrays',
    topicId: 'java-fundamentals',
    title: 'Reverse an Array In Place',
    problem: 'Reverse the elements of an array without creating a new array.',
    input: 'nums = [1, 2, 3, 4, 5]',
    output: '[5, 4, 3, 2, 1]',
    explanation: 'Use two pointers: `left` starts at index 0 and `right` at the last index. Swap the two elements, then move `left` forward and `right` backward. Stop when they meet in the middle. Each element is touched once and no extra array is needed.',
    solution: `public static void reverse(int[] nums) {
    int left = 0;
    int right = nums.length - 1;
    while (left < right) {
        int temp = nums[left];
        nums[left] = nums[right];
        nums[right] = temp;
        left++;
        right--;
    }
}`,
    complexity: 'Time: O(n), Space: O(1)',
    difficulty: 'Easy',
  },
  {
    id: 'arrays-03',
    category: 'Arrays',
    topicId: 'java-fundamentals',
    title: 'Second Largest Element',
    problem: 'Find the second largest distinct value in an array in a single pass. Return -1 if it does not exist.',
    input: 'nums = [12, 35, 1, 10, 34, 35]',
    output: '34',
    explanation: 'Track two values, `largest` and `secondLargest`. They are `long` and start at `Long.MIN_VALUE`, a value no `int` can ever have, so it safely means "not found yet". When a number is bigger than `largest`, the old largest moves down to second place. When a number is smaller than `largest` but bigger than `secondLargest`, it becomes the new second largest. Numbers equal to `largest` are skipped, so duplicates of the max are not counted as second.',
    solution: `public static int secondLargest(int[] nums) {
    long largest = Long.MIN_VALUE;
    long secondLargest = Long.MIN_VALUE;   // Long.MIN_VALUE means "not found yet"
    for (int num : nums) {
        if (num > largest) {
            secondLargest = largest;       // old max becomes second
            largest = num;
        } else if (num < largest && num > secondLargest) {
            secondLargest = num;
        }
    }
    return secondLargest == Long.MIN_VALUE ? -1 : (int) secondLargest;
}`,
    complexity: 'Time: O(n), Space: O(1)',
    difficulty: 'Easy',
  },
  {
    id: 'arrays-04',
    category: 'Arrays',
    topicId: 'java-fundamentals',
    title: 'Remove Duplicates from a Sorted Array',
    problem: 'Given a sorted array, remove duplicates in place so each value appears once. Return the number of unique elements; the first k positions should hold them.',
    input: 'nums = [1, 1, 2, 3, 3, 3, 4]',
    output: '4 (array starts with [1, 2, 3, 4])',
    explanation: 'Because the array is sorted, duplicates sit next to each other. Keep a "write" index pointing to the last unique value placed. Scan with a "read" index; whenever the value differs from the last unique one, move the write index forward and copy the value there. At the end, `writeIndex + 1` is the number of unique elements.',
    solution: `public static int removeDuplicates(int[] nums) {
    if (nums.length == 0) {
        return 0;
    }
    int writeIndex = 0;             // position of the last unique value
    for (int readIndex = 1; readIndex < nums.length; readIndex++) {
        if (nums[readIndex] != nums[writeIndex]) {
            writeIndex++;
            nums[writeIndex] = nums[readIndex];
        }
    }
    return writeIndex + 1;
}`,
    complexity: 'Time: O(n), Space: O(1)',
    difficulty: 'Easy',
  },
  {
    id: 'arrays-05',
    category: 'Arrays',
    topicId: 'java-fundamentals',
    title: 'Move Zeros to the End',
    problem: 'Move all zeros in an array to the end while keeping the relative order of the non-zero elements. Do it in place.',
    input: 'nums = [0, 1, 0, 3, 12]',
    output: '[1, 3, 12, 0, 0]',
    explanation: 'Keep an index `insertPos` for where the next non-zero value should go. Loop through the array and copy every non-zero value to `insertPos`, then advance it. After the loop, all non-zero values are packed at the front in their original order, so fill the remaining positions with zeros.',
    solution: `public static void moveZerosToEnd(int[] nums) {
    int insertPos = 0;
    for (int num : nums) {
        if (num != 0) {
            nums[insertPos] = num;
            insertPos++;
        }
    }
    while (insertPos < nums.length) {
        nums[insertPos] = 0;        // fill the rest with zeros
        insertPos++;
    }
}`,
    complexity: 'Time: O(n), Space: O(1)',
    difficulty: 'Medium',
  },
  {
    id: 'arrays-06',
    category: 'Arrays',
    topicId: 'java-fundamentals',
    title: 'Find the Missing Number',
    problem: 'An array contains n distinct numbers taken from the range 0 to n. Exactly one number in that range is missing. Find it.',
    input: 'nums = [3, 0, 1]',
    output: '2',
    explanation: 'The sum of all numbers from 0 to n is n × (n + 1) / 2. Subtract the actual sum of the array from this expected sum, and what is left is the missing number. Using `long` for the sums avoids overflow on large inputs. An XOR-based solution works too and never overflows.',
    solution: `public static int findMissingNumber(int[] nums) {
    int n = nums.length;
    long expectedSum = (long) n * (n + 1) / 2;
    long actualSum = 0;
    for (int num : nums) {
        actualSum += num;
    }
    return (int) (expectedSum - actualSum);
}`,
    complexity: 'Time: O(n), Space: O(1)',
    difficulty: 'Medium',
  },
  {
    id: 'arrays-07',
    category: 'Arrays',
    topicId: 'java-fundamentals',
    title: 'Two Sum',
    problem: 'Given an array of integers and a target, return the indexes of the two numbers that add up to the target. Assume exactly one solution exists.',
    input: 'nums = [2, 7, 11, 15], target = 9',
    output: '[0, 1]',
    explanation: 'The brute-force approach checks every pair in O(n²). Instead, use a `HashMap` from value to index. For each number, compute the `complement` we need (`target - num`). If the complement is already in the map, we found the pair. Otherwise store the current number and its index and keep going. Each lookup is O(1) on average.',
    solution: `import java.util.HashMap;
import java.util.Map;

public static int[] twoSum(int[] nums, int target) {
    Map<Integer, Integer> indexByValue = new HashMap<>();
    for (int i = 0; i < nums.length; i++) {
        int complement = target - nums[i];
        if (indexByValue.containsKey(complement)) {
            return new int[] { indexByValue.get(complement), i };
        }
        indexByValue.put(nums[i], i);
    }
    return new int[0];              // no pair found
}`,
    complexity: 'Time: O(n), Space: O(n)',
    difficulty: 'Medium',
  },
  {
    id: 'arrays-08',
    category: 'Arrays',
    topicId: 'java-fundamentals',
    title: 'Rotate an Array to the Right by k Steps',
    problem: 'Rotate an array to the right by k positions, in place. Elements pushed off the end wrap around to the front.',
    input: 'nums = [1, 2, 3, 4, 5, 6, 7], k = 3',
    output: '[5, 6, 7, 1, 2, 3, 4]',
    explanation: 'Use the reversal trick. First reduce k with `k % n`, because rotating n times gives the same array. Then reverse the whole array, reverse the first k elements, and reverse the remaining n - k elements. For the example: reverse all gives [7,6,5,4,3,2,1], reverse first 3 gives [5,6,7,4,3,2,1], reverse the rest gives [5,6,7,1,2,3,4].',
    solution: `public static void rotate(int[] nums, int k) {
    int n = nums.length;
    if (n == 0) {
        return;
    }
    k = k % n;                      // rotating by n changes nothing
    reverse(nums, 0, n - 1);
    reverse(nums, 0, k - 1);
    reverse(nums, k, n - 1);
}

private static void reverse(int[] nums, int start, int end) {
    while (start < end) {
        int temp = nums[start];
        nums[start] = nums[end];
        nums[end] = temp;
        start++;
        end--;
    }
}`,
    complexity: 'Time: O(n), Space: O(1)',
    difficulty: 'Medium',
  },
  {
    id: 'arrays-09',
    category: 'Arrays',
    topicId: 'java-fundamentals',
    title: 'Merge Two Sorted Arrays',
    problem: 'Merge two sorted arrays into one new sorted array.',
    input: 'a = [1, 3, 5, 7], b = [2, 4, 6]',
    output: '[1, 2, 3, 4, 5, 6, 7]',
    explanation: 'Keep one pointer in each array. Compare the two current elements, copy the smaller one into the result and advance that pointer. When one array runs out, copy whatever is left of the other one. This is the same "merge" step used in merge sort.',
    solution: `public static int[] mergeSorted(int[] a, int[] b) {
    int[] merged = new int[a.length + b.length];
    int i = 0;                      // pointer in a
    int j = 0;                      // pointer in b
    int k = 0;                      // pointer in merged
    while (i < a.length && j < b.length) {
        if (a[i] <= b[j]) {
            merged[k++] = a[i++];
        } else {
            merged[k++] = b[j++];
        }
    }
    while (i < a.length) {
        merged[k++] = a[i++];       // leftovers from a
    }
    while (j < b.length) {
        merged[k++] = b[j++];       // leftovers from b
    }
    return merged;
}`,
    complexity: 'Time: O(n + m), Space: O(n + m)',
    difficulty: 'Medium',
  },
  {
    id: 'arrays-10',
    category: 'Arrays',
    topicId: 'java-fundamentals',
    title: 'Maximum Subarray Sum (Kadane\'s Algorithm)',
    problem: 'Find the largest possible sum of a contiguous subarray (at least one element).',
    input: 'nums = [-2, 1, -3, 4, -1, 2, 1, -5, 4]',
    output: '6 (subarray [4, -1, 2, 1])',
    explanation: 'Kadane\'s algorithm walks through the array once. At each element it decides: is it better to extend the previous subarray or to start a new one here? That is `currentSum = max(num, currentSum + num)`. A negative running sum only drags things down, so we drop it. We keep the best `currentSum` ever seen in `maxSum`. Starting both at `nums[0]` handles arrays where every number is negative.',
    solution: `public static int maxSubArray(int[] nums) {
    int currentSum = nums[0];
    int maxSum = nums[0];
    for (int i = 1; i < nums.length; i++) {
        // either extend the previous subarray or start fresh at nums[i]
        currentSum = Math.max(nums[i], currentSum + nums[i]);
        maxSum = Math.max(maxSum, currentSum);
    }
    return maxSum;
}`,
    complexity: 'Time: O(n), Space: O(1)',
    difficulty: 'Hard',
  },
  {
    id: 'arrays-11',
    category: 'Arrays',
    topicId: 'java-fundamentals',
    title: 'Find Duplicate Elements',
    problem: 'Find all values that appear more than once in an integer array. Each duplicate value should be reported only once.',
    input: 'nums = [4, 3, 2, 7, 8, 2, 3, 1, 3]',
    output: '[2, 3]',
    explanation: 'Use two sets. `seen` remembers every value we have met so far. If `seen.add(num)` returns false, the value was already there, so it is a duplicate and we add it to `duplicates`. Because `duplicates` is also a set, a value that appears three times is still reported once. `LinkedHashSet` keeps the order in which duplicates were found.',
    solution: `import java.util.HashSet;
import java.util.LinkedHashSet;
import java.util.Set;

public static Set<Integer> findDuplicates(int[] nums) {
    Set<Integer> seen = new HashSet<>();
    Set<Integer> duplicates = new LinkedHashSet<>();
    for (int num : nums) {
        if (!seen.add(num)) {       // add() returns false if already present
            duplicates.add(num);
        }
    }
    return duplicates;
}`,
    complexity: 'Time: O(n), Space: O(n)',
    difficulty: 'Easy',
  },
  {
    id: 'arrays-12',
    category: 'Arrays',
    topicId: 'java-fundamentals',
    title: 'Product of Array Except Self',
    problem: 'Return an array where each position i holds the product of every element except nums[i]. Do not use division, and aim for O(n) time.',
    input: 'nums = [1, 2, 3, 4]',
    output: '[24, 12, 8, 6]',
    explanation: 'The answer at i is (product of everything to the left of i) × (product of everything to the right of i). In a first pass from left to right, store the running left product in `result[i]`. In a second pass from right to left, keep a running right product and multiply it into `result[i]`. No division is needed, so zeros in the input are handled correctly.',
    solution: `public static int[] productExceptSelf(int[] nums) {
    int n = nums.length;
    int[] result = new int[n];

    // Pass 1: result[i] = product of all elements to the LEFT of i
    int leftProduct = 1;
    for (int i = 0; i < n; i++) {
        result[i] = leftProduct;
        leftProduct *= nums[i];
    }

    // Pass 2: multiply in the product of all elements to the RIGHT of i
    int rightProduct = 1;
    for (int i = n - 1; i >= 0; i--) {
        result[i] *= rightProduct;
        rightProduct *= nums[i];
    }
    return result;
}`,
    complexity: 'Time: O(n), Space: O(1) extra (the output array is not counted)',
    difficulty: 'Hard',
  },
]

export default questions
