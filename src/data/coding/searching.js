const questions = [
  {
    id: 'searching-01',
    category: 'Searching',
    topicId: 'java-fundamentals',
    title: 'Linear Search',
    problem: 'Given an array of integers and a target, return the index of the first occurrence of the target, or -1 if it is not present. The array is not sorted.',
    input: 'nums = [4, 8, 1, 9, 3], target = 9',
    output: '3',
    explanation: 'Check every element from left to right. As soon as one equals the target, return its index. If the loop finishes without a match, return -1.\n\nLinear search works on any array, sorted or not, but it is O(n). When the data is sorted, binary search is much faster.',
    solution: `public static int linearSearch(int[] nums, int target) {
    for (int i = 0; i < nums.length; i++) {
        if (nums[i] == target) {
            return i;
        }
    }
    return -1;
}`,
    complexity: 'Time: O(n), Space: O(1)',
    difficulty: 'Easy',
  },
  {
    id: 'searching-02',
    category: 'Searching',
    topicId: 'java-fundamentals',
    title: 'Binary Search (Iterative)',
    problem: 'Given a sorted array of integers and a target, return the index of the target using an iterative binary search, or -1 if it is not present.',
    input: 'nums = [-1, 0, 3, 5, 9, 12], target = 9',
    output: '4',
    explanation: 'Keep a search range from `low` to `high`. Look at the middle element: if it equals the target, return it; if it is smaller than the target, the answer must be to the right, so move `low` to mid + 1; otherwise move `high` to mid - 1.\n\nEvery step halves the range, so even a million elements need only about 20 steps. `low + (high - low) / 2` avoids the integer overflow that `(low + high) / 2` can cause on very large arrays.',
    solution: `public static int binarySearch(int[] nums, int target) {
    int low = 0;
    int high = nums.length - 1;
    while (low <= high) {
        int mid = low + (high - low) / 2;
        if (nums[mid] == target) {
            return mid;
        } else if (nums[mid] < target) {
            low = mid + 1;
        } else {
            high = mid - 1;
        }
    }
    return -1;
}`,
    complexity: 'Time: O(log n), Space: O(1)',
    difficulty: 'Easy',
  },
  {
    id: 'searching-03',
    category: 'Searching',
    topicId: 'java-fundamentals',
    title: 'First and Last Occurrence',
    problem: 'Given a sorted array that may contain duplicates, find the first and last index of a target value. Return [-1, -1] if the target is not found. Aim for O(log n).',
    input: 'nums = [5, 7, 7, 8, 8, 10], target = 8',
    output: '[3, 4]',
    explanation: 'Run binary search twice. When we find the target, we do not stop: we record the index and keep searching. To find the first occurrence we continue to the left (`high = mid - 1`); to find the last we continue to the right (`low = mid + 1`).\n\nA boolean flag lets one helper method do both searches.',
    solution: `public static int[] searchRange(int[] nums, int target) {
    return new int[] { findBound(nums, target, true), findBound(nums, target, false) };
}

private static int findBound(int[] nums, int target, boolean first) {
    int low = 0, high = nums.length - 1;
    int result = -1;
    while (low <= high) {
        int mid = low + (high - low) / 2;
        if (nums[mid] == target) {
            result = mid;               // remember it, keep looking
            if (first) {
                high = mid - 1;         // look further left
            } else {
                low = mid + 1;          // look further right
            }
        } else if (nums[mid] < target) {
            low = mid + 1;
        } else {
            high = mid - 1;
        }
    }
    return result;
}`,
    complexity: 'Time: O(log n), Space: O(1)',
    difficulty: 'Medium',
  },
  {
    id: 'searching-04',
    category: 'Searching',
    topicId: 'java-fundamentals',
    title: 'Search in Rotated Sorted Array',
    problem: 'A sorted array of distinct integers has been rotated at an unknown pivot (for example [0, 1, 2, 4, 5, 6, 7] became [4, 5, 6, 7, 0, 1, 2]). Find the index of a target in O(log n), or return -1.',
    input: 'nums = [4, 5, 6, 7, 0, 1, 2], target = 0',
    output: '4',
    explanation: 'Even after rotation, when you split the array at `mid`, at least one half is still normally sorted. Check which half it is by comparing `nums[low]` with `nums[mid]`.\n\nIf the left half is sorted and the target lies inside its range, search left; otherwise search right. Do the mirror check when the right half is sorted. Each step still throws away half the array.',
    solution: `public static int searchRotated(int[] nums, int target) {
    int low = 0, high = nums.length - 1;
    while (low <= high) {
        int mid = low + (high - low) / 2;
        if (nums[mid] == target) {
            return mid;
        }
        if (nums[low] <= nums[mid]) {                 // left half is sorted
            if (target >= nums[low] && target < nums[mid]) {
                high = mid - 1;
            } else {
                low = mid + 1;
            }
        } else {                                      // right half is sorted
            if (target > nums[mid] && target <= nums[high]) {
                low = mid + 1;
            } else {
                high = mid - 1;
            }
        }
    }
    return -1;
}`,
    complexity: 'Time: O(log n), Space: O(1)',
    difficulty: 'Hard',
  },
  {
    id: 'searching-05',
    category: 'Searching',
    topicId: 'java-fundamentals',
    title: 'Find a Peak Element',
    problem: 'A peak element is strictly greater than its neighbours. Given an array where no two neighbours are equal, return the index of any peak in O(log n). Imagine nums[-1] and nums[n] are negative infinity.',
    input: 'nums = [1, 2, 3, 1]',
    output: '2   (nums[2] = 3 is a peak)',
    explanation: 'Compare `nums[mid]` with `nums[mid + 1]`. If the next element is bigger, we are walking uphill, so a peak must exist to the right. Otherwise we are going downhill (or at a peak), so a peak exists at mid or to its left.\n\nWe shrink the range until `low == high`, and that index is a peak. This is binary search on the "slope", not on a sorted array.',
    solution: `public static int findPeakElement(int[] nums) {
    int low = 0, high = nums.length - 1;
    while (low < high) {
        int mid = low + (high - low) / 2;
        if (nums[mid] < nums[mid + 1]) {
            low = mid + 1;      // uphill: peak is to the right
        } else {
            high = mid;         // downhill: peak is mid or to the left
        }
    }
    return low;
}`,
    complexity: 'Time: O(log n), Space: O(1)',
    difficulty: 'Hard',
  },
  {
    id: 'searching-06',
    category: 'Searching',
    topicId: 'java-fundamentals',
    title: 'Integer Square Root with Binary Search',
    problem: 'Given a non-negative integer x, return the square root of x rounded down to the nearest integer. Do not use `Math.sqrt`.',
    input: 'x = 8',
    output: '2   (the real square root is 2.828...)',
    explanation: 'The answer lies between 0 and x, and the squares of those numbers are in sorted order, so we can binary search for the largest number whose square is at most x.\n\nWhen `mid * mid <= x`, mid is a possible answer, so we save it and try bigger numbers. Otherwise we go smaller. We use `long` for `mid * mid` because the square of a large int overflows.',
    solution: `public static int mySqrt(int x) {
    if (x < 2) {
        return x;
    }
    long low = 1, high = x / 2;
    long answer = 1;
    while (low <= high) {
        long mid = low + (high - low) / 2;
        if (mid * mid <= x) {
            answer = mid;       // mid works, try a bigger one
            low = mid + 1;
        } else {
            high = mid - 1;
        }
    }
    return (int) answer;
}`,
    complexity: 'Time: O(log x), Space: O(1)',
    difficulty: 'Easy',
  },
  {
    id: 'searching-07',
    category: 'Searching',
    topicId: 'java-fundamentals',
    title: 'Search in a 2D Matrix',
    problem: 'Given an m x n matrix where each row is sorted and the first number of each row is greater than the last number of the previous row, return true if a target exists.',
    input: 'matrix = [[1, 3, 5, 7], [10, 11, 16, 20], [23, 30, 34, 60]], target = 3',
    output: 'true',
    explanation: 'Because of the rules, reading the matrix row by row gives one long sorted list of m * n numbers. So we binary search over indexes 0 to m * n - 1.\n\nTo turn a flat index into a cell, use row = index / n and column = index % n. No extra copying is needed.',
    solution: `public static boolean searchMatrix(int[][] matrix, int target) {
    if (matrix.length == 0 || matrix[0].length == 0) {
        return false;
    }
    int rows = matrix.length, cols = matrix[0].length;
    int low = 0, high = rows * cols - 1;
    while (low <= high) {
        int mid = low + (high - low) / 2;
        int value = matrix[mid / cols][mid % cols];
        if (value == target) {
            return true;
        } else if (value < target) {
            low = mid + 1;
        } else {
            high = mid - 1;
        }
    }
    return false;
}`,
    complexity: 'Time: O(log(m * n)), Space: O(1)',
    difficulty: 'Medium',
  },
  {
    id: 'searching-08',
    category: 'Searching',
    topicId: 'java-fundamentals',
    title: 'Find Minimum in Rotated Sorted Array',
    problem: 'A sorted array of distinct integers has been rotated an unknown number of times. Find the minimum element in O(log n).',
    input: 'nums = [3, 4, 5, 1, 2]',
    output: '1',
    explanation: 'Compare the middle element with the last element of the range. If `nums[mid] > nums[high]`, the "drop" (where the minimum is) must be to the right of mid. Otherwise the right part from mid to high is sorted, so the minimum is at mid or to its left.\n\nWe stop when `low == high`, which points to the minimum.',
    solution: `public static int findMin(int[] nums) {
    int low = 0, high = nums.length - 1;
    while (low < high) {
        int mid = low + (high - low) / 2;
        if (nums[mid] > nums[high]) {
            low = mid + 1;      // minimum is to the right of mid
        } else {
            high = mid;         // minimum is mid or to the left
        }
    }
    return nums[low];
}`,
    complexity: 'Time: O(log n), Space: O(1)',
    difficulty: 'Medium',
  },
  {
    id: 'searching-09',
    category: 'Searching',
    topicId: 'java-fundamentals',
    title: 'Count Occurrences in a Sorted Array',
    problem: 'Given a sorted array and a target, count how many times the target appears, in O(log n) time.',
    input: 'nums = [1, 2, 2, 2, 3, 4], target = 2',
    output: '3',
    explanation: 'Find the first index where the value is at least the target (the lower bound) and the first index where the value is greater than the target (the upper bound). The count is upper minus lower.\n\nBoth bounds use the same binary search shape with `high = nums.length` and `low < high`; only the comparison changes. If the target is missing, both bounds are equal and the count is 0.',
    solution: `public static int countOccurrences(int[] nums, int target) {
    return upperBound(nums, target) - lowerBound(nums, target);
}

// first index with nums[i] >= target
private static int lowerBound(int[] nums, int target) {
    int low = 0, high = nums.length;
    while (low < high) {
        int mid = low + (high - low) / 2;
        if (nums[mid] < target) {
            low = mid + 1;
        } else {
            high = mid;
        }
    }
    return low;
}

// first index with nums[i] > target
private static int upperBound(int[] nums, int target) {
    int low = 0, high = nums.length;
    while (low < high) {
        int mid = low + (high - low) / 2;
        if (nums[mid] <= target) {
            low = mid + 1;
        } else {
            high = mid;
        }
    }
    return low;
}`,
    complexity: 'Time: O(log n), Space: O(1)',
    difficulty: 'Medium',
  },
  {
    id: 'searching-10',
    category: 'Searching',
    topicId: 'java-fundamentals',
    title: 'Floor and Ceiling in a Sorted Array',
    problem: 'Given a sorted array and a value x, find the floor (the largest element less than or equal to x) and the ceiling (the smallest element greater than or equal to x). Use -1 when one does not exist.',
    input: 'nums = [1, 2, 8, 10, 10, 12, 19], x = 5',
    output: 'floor = 2, ceiling = 8',
    explanation: 'Do a normal binary search, but remember candidates as you go. When `nums[mid] <= x`, mid is a possible floor, so save it and look right for a bigger one. When `nums[mid] >= x`, it is a possible ceiling, so save it and look left for a smaller one.\n\nIf x itself is in the array, it is both the floor and the ceiling.',
    solution: `public static int[] floorAndCeiling(int[] nums, int x) {
    int floor = -1, ceiling = -1;
    int low = 0, high = nums.length - 1;
    while (low <= high) {
        int mid = low + (high - low) / 2;
        if (nums[mid] == x) {
            return new int[] { nums[mid], nums[mid] };
        } else if (nums[mid] < x) {
            floor = nums[mid];      // candidate floor, try bigger
            low = mid + 1;
        } else {
            ceiling = nums[mid];    // candidate ceiling, try smaller
            high = mid - 1;
        }
    }
    return new int[] { floor, ceiling };
}`,
    complexity: 'Time: O(log n), Space: O(1)',
    difficulty: 'Easy',
  },
  {
    id: 'searching-11',
    category: 'Searching',
    topicId: 'java-fundamentals',
    title: 'Find the Missing Number with Binary Search',
    problem: 'A sorted array contains the numbers 1 to n with exactly one number missing (so it has n - 1 elements). Find the missing number in O(log n).',
    input: 'nums = [1, 2, 3, 4, 6, 7, 8]',
    output: '5',
    explanation: 'Before the missing number, every element sits at index `value - 1` (1 at index 0, 2 at index 1, and so on). After the gap, every element is one position "late": `nums[i] == i + 2`.\n\nSo we binary search for the first index where `nums[mid] != mid + 1`. The missing number is that index + 1. If no such index exists, the missing number is n (the last one). A sum-based O(n) approach also works for unsorted input: expected sum n(n+1)/2 minus the actual sum.',
    solution: `public static int findMissing(int[] nums) {
    int low = 0, high = nums.length - 1;
    while (low <= high) {
        int mid = low + (high - low) / 2;
        if (nums[mid] == mid + 1) {
            low = mid + 1;      // everything up to mid is in place
        } else {
            high = mid - 1;     // the gap is at mid or to the left
        }
    }
    return low + 1;
}`,
    complexity: 'Time: O(log n), Space: O(1)',
    difficulty: 'Medium',
  },
  {
    id: 'searching-12',
    category: 'Searching',
    topicId: 'java-fundamentals',
    title: 'Pair with Target Sum in a Sorted Array (Two Pointers)',
    problem: 'Given a sorted array and a target, return the indices of two different elements that add up to the target, or [-1, -1] if no pair exists. Use O(1) extra space.',
    input: 'nums = [1, 2, 4, 7, 11, 15], target = 15',
    output: '[2, 4]   (4 + 11 = 15)',
    explanation: 'Put one pointer at the start and one at the end. If their sum is too small, move the left pointer right to get a bigger number. If it is too big, move the right pointer left to get a smaller number.\n\nBecause the array is sorted, each move safely rules out one element, so we find the pair (or prove there is none) in a single pass, without a HashMap.',
    solution: `public static int[] pairWithSum(int[] nums, int target) {
    int left = 0, right = nums.length - 1;
    while (left < right) {
        int sum = nums[left] + nums[right];
        if (sum == target) {
            return new int[] { left, right };
        } else if (sum < target) {
            left++;             // need a bigger sum
        } else {
            right--;            // need a smaller sum
        }
    }
    return new int[] { -1, -1 };
}`,
    complexity: 'Time: O(n), Space: O(1)',
    difficulty: 'Easy',
  },
]

export default questions
