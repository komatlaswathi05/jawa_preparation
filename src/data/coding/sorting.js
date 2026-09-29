const questions = [
  {
    id: 'sorting-01',
    category: 'Sorting',
    topicId: null,
    title: 'Bubble Sort',
    problem: 'Sort an array of integers in ascending order using bubble sort.',
    input: 'nums = [5, 1, 4, 2, 8]',
    output: '[1, 2, 4, 5, 8]',
    explanation: 'Bubble sort walks through the array and swaps neighbours that are in the wrong order. After each full pass, the largest remaining element has "bubbled up" to the end, so the next pass can stop one position earlier.\n\nIf a pass makes no swaps, the array is already sorted and we stop early. That makes the best case (an already sorted array) O(n).',
    solution: `public static void bubbleSort(int[] nums) {
    int n = nums.length;
    for (int pass = 0; pass < n - 1; pass++) {
        boolean swapped = false;
        for (int i = 0; i < n - 1 - pass; i++) {
            if (nums[i] > nums[i + 1]) {
                int temp = nums[i];
                nums[i] = nums[i + 1];
                nums[i + 1] = temp;
                swapped = true;
            }
        }
        if (!swapped) {
            break;              // already sorted
        }
    }
}`,
    complexity: 'Time: O(n^2) worst/average, O(n) best, Space: O(1)',
    difficulty: 'Easy',
  },
  {
    id: 'sorting-02',
    category: 'Sorting',
    topicId: null,
    title: 'Selection Sort',
    problem: 'Sort an array of integers in ascending order using selection sort.',
    input: 'nums = [64, 25, 12, 22, 11]',
    output: '[11, 12, 22, 25, 64]',
    explanation: 'Selection sort splits the array into a sorted left part and an unsorted right part. On each step it finds the smallest element in the unsorted part and swaps it into the next position of the sorted part.\n\nIt always does about n^2 / 2 comparisons, even on sorted input, but it makes at most n - 1 swaps, which can matter when writes are expensive. It is not stable (equal elements may change order).',
    solution: `public static void selectionSort(int[] nums) {
    int n = nums.length;
    for (int i = 0; i < n - 1; i++) {
        int minIndex = i;
        for (int j = i + 1; j < n; j++) {
            if (nums[j] < nums[minIndex]) {
                minIndex = j;
            }
        }
        int temp = nums[i];
        nums[i] = nums[minIndex];
        nums[minIndex] = temp;
    }
}`,
    complexity: 'Time: O(n^2) in all cases, Space: O(1)',
    difficulty: 'Easy',
  },
  {
    id: 'sorting-03',
    category: 'Sorting',
    topicId: null,
    title: 'Insertion Sort',
    problem: 'Sort an array of integers in ascending order using insertion sort.',
    input: 'nums = [12, 11, 13, 5, 6]',
    output: '[5, 6, 11, 12, 13]',
    explanation: 'Insertion sort works like sorting playing cards in your hand. Take the next element (the key) and shift every larger element in the sorted left part one step to the right, then drop the key into the gap.\n\nIt is stable, sorts in place and is very fast on small or nearly sorted arrays, which is why Java uses it inside its sort for tiny sub-arrays.',
    solution: `public static void insertionSort(int[] nums) {
    for (int i = 1; i < nums.length; i++) {
        int key = nums[i];
        int j = i - 1;
        while (j >= 0 && nums[j] > key) {
            nums[j + 1] = nums[j];   // shift larger element right
            j--;
        }
        nums[j + 1] = key;
    }
}`,
    complexity: 'Time: O(n^2) worst/average, O(n) best, Space: O(1)',
    difficulty: 'Easy',
  },
  {
    id: 'sorting-04',
    category: 'Sorting',
    topicId: null,
    title: 'Merge Sort',
    problem: 'Sort an array of integers in ascending order using merge sort.',
    input: 'nums = [38, 27, 43, 3, 9, 82, 10]',
    output: '[3, 9, 10, 27, 38, 43, 82]',
    explanation: 'Merge sort is a divide and conquer algorithm. Split the array in half, sort each half recursively, then merge the two sorted halves into one sorted result.\n\nMerging uses two pointers, one per half, always copying the smaller front element into a temporary array. It is always O(n log n) and stable, but needs O(n) extra memory. Java uses a merge sort variant (TimSort) to sort objects.',
    solution: `public static void mergeSort(int[] nums) {
    if (nums.length < 2) {
        return;
    }
    mergeSort(nums, new int[nums.length], 0, nums.length - 1);
}

private static void mergeSort(int[] nums, int[] temp, int left, int right) {
    if (left >= right) {
        return;
    }
    int mid = left + (right - left) / 2;
    mergeSort(nums, temp, left, mid);
    mergeSort(nums, temp, mid + 1, right);
    merge(nums, temp, left, mid, right);
}

private static void merge(int[] nums, int[] temp, int left, int mid, int right) {
    int i = left, j = mid + 1, k = left;
    while (i <= mid && j <= right) {
        if (nums[i] <= nums[j]) {        // <= keeps the sort stable
            temp[k++] = nums[i++];
        } else {
            temp[k++] = nums[j++];
        }
    }
    while (i <= mid) {
        temp[k++] = nums[i++];
    }
    while (j <= right) {
        temp[k++] = nums[j++];
    }
    for (int x = left; x <= right; x++) {
        nums[x] = temp[x];
    }
}`,
    complexity: 'Time: O(n log n) in all cases, Space: O(n)',
    difficulty: 'Medium',
  },
  {
    id: 'sorting-05',
    category: 'Sorting',
    topicId: null,
    title: 'Quick Sort',
    problem: 'Sort an array of integers in ascending order using quick sort.',
    input: 'nums = [10, 7, 8, 9, 1, 5]',
    output: '[1, 5, 7, 8, 9, 10]',
    explanation: 'Quick sort picks a pivot and partitions the array so that everything smaller than the pivot goes to its left and everything larger to its right. The pivot is now in its final position. Then the left and right parts are sorted recursively.\n\nThis uses the Lomuto partition with the last element as pivot. On average it is O(n log n) and very fast in practice, but a bad pivot (for example, already sorted input) gives O(n^2). Picking a random pivot avoids that in practice.',
    solution: `public static void quickSort(int[] nums) {
    quickSort(nums, 0, nums.length - 1);
}

private static void quickSort(int[] nums, int low, int high) {
    if (low < high) {
        int p = partition(nums, low, high);
        quickSort(nums, low, p - 1);
        quickSort(nums, p + 1, high);
    }
}

private static int partition(int[] nums, int low, int high) {
    int pivot = nums[high];
    int i = low - 1;                    // end of the "smaller" zone
    for (int j = low; j < high; j++) {
        if (nums[j] < pivot) {
            i++;
            swap(nums, i, j);
        }
    }
    swap(nums, i + 1, high);            // put pivot in its final place
    return i + 1;
}

private static void swap(int[] nums, int a, int b) {
    int temp = nums[a];
    nums[a] = nums[b];
    nums[b] = temp;
}`,
    complexity: 'Time: O(n log n) average, O(n^2) worst, Space: O(log n) average for recursion',
    difficulty: 'Medium',
  },
  {
    id: 'sorting-06',
    category: 'Sorting',
    topicId: null,
    title: 'Counting Sort',
    problem: 'Sort an array of non-negative integers whose values are small (for example, 0 to 100) in linear time using counting sort.',
    input: 'nums = [4, 2, 2, 8, 3, 3, 1]',
    output: '[1, 2, 2, 3, 3, 4, 8]',
    explanation: 'Instead of comparing elements, counting sort counts how many times each value occurs. Make a `count` array of size max + 1 and increase `count[value]` for every element.\n\nThen walk the count array from 0 upward and write each value back as many times as it was counted. It runs in O(n + k), where k is the range of values, so it only makes sense when k is not much larger than n.',
    solution: `public static void countingSort(int[] nums) {
    if (nums.length == 0) {
        return;
    }
    int max = Arrays.stream(nums).max().getAsInt();
    int[] count = new int[max + 1];
    for (int n : nums) {
        count[n]++;
    }
    int index = 0;
    for (int value = 0; value <= max; value++) {
        while (count[value] > 0) {
            nums[index++] = value;
            count[value]--;
        }
    }
}`,
    complexity: 'Time: O(n + k), Space: O(k) where k is the max value',
    difficulty: 'Easy',
  },
  {
    id: 'sorting-07',
    category: 'Sorting',
    topicId: null,
    title: 'Sort 0s, 1s and 2s (Dutch National Flag)',
    problem: 'Given an array containing only 0s, 1s and 2s, sort it in place in a single pass without using a library sort.',
    input: 'nums = [2, 0, 2, 1, 1, 0]',
    output: '[0, 0, 1, 1, 2, 2]',
    explanation: 'Use three pointers: `low` (next place for a 0), `mid` (current element) and `high` (next place for a 2). Everything before `low` is 0, everything after `high` is 2.\n\nIf `nums[mid]` is 0, swap it to `low` and move both forward. If it is 1, just move `mid`. If it is 2, swap it to `high` and move `high` back, but do not move `mid`, because the element swapped in has not been checked yet.',
    solution: `public static void sortColors(int[] nums) {
    int low = 0, mid = 0, high = nums.length - 1;
    while (mid <= high) {
        if (nums[mid] == 0) {
            swap(nums, low++, mid++);
        } else if (nums[mid] == 1) {
            mid++;
        } else {
            swap(nums, mid, high--);   // don't move mid: new value is unchecked
        }
    }
}

private static void swap(int[] nums, int a, int b) {
    int temp = nums[a];
    nums[a] = nums[b];
    nums[b] = temp;
}`,
    complexity: 'Time: O(n), Space: O(1)',
    difficulty: 'Medium',
  },
  {
    id: 'sorting-08',
    category: 'Sorting',
    topicId: 'java-collections',
    title: 'Sort a Map by Values',
    problem: 'Given a map from names to scores, return a new map with the entries sorted by score in descending order. If two scores are equal, sort those names alphabetically.',
    input: 'scores = {Asha=85, Ravi=92, Meera=85, John=70}',
    output: '{Ravi=92, Asha=85, Meera=85, John=70}',
    explanation: 'A `HashMap` has no order, so we stream its entries, sort them with a comparator, and collect into a `LinkedHashMap`, which remembers insertion order.\n\n`Map.Entry.comparingByValue(Comparator.reverseOrder())` sorts scores from high to low, and `thenComparing(Map.Entry.comparingByKey())` breaks ties by name. The merge function `(a, b) -> a` is required by that `toMap` overload but never used, because keys are already unique.',
    solution: `public static Map<String, Integer> sortByValueDesc(Map<String, Integer> scores) {
    return scores.entrySet().stream()
            .sorted(Map.Entry.<String, Integer>comparingByValue(Comparator.reverseOrder())
                    .thenComparing(Map.Entry.comparingByKey()))
            .collect(Collectors.toMap(
                    Map.Entry::getKey,
                    Map.Entry::getValue,
                    (a, b) -> a,
                    LinkedHashMap::new));
}`,
    complexity: 'Time: O(n log n), Space: O(n)',
    difficulty: 'Medium',
  },
  {
    id: 'sorting-09',
    category: 'Sorting',
    topicId: 'java-collections',
    title: 'Sort Strings by Length, Then Alphabetically',
    problem: 'Sort a list of strings by their length (shortest first). Strings with the same length should be sorted alphabetically.',
    input: 'words = ["banana", "kiwi", "apple", "fig", "pear"]',
    output: '[fig, kiwi, pear, apple, banana]',
    explanation: '`Comparator.comparingInt(String::length)` compares by length. When two lengths are equal, `thenComparing(Comparator.naturalOrder())` falls back to normal alphabetical order.\n\n`List.sort` sorts the list in place. It uses TimSort, which is stable, so elements that compare as equal keep their original relative order.',
    solution: `public static List<String> sortByLengthThenAlpha(List<String> words) {
    List<String> result = new ArrayList<>(words);   // don't modify the input
    result.sort(Comparator.comparingInt(String::length)
            .thenComparing(Comparator.naturalOrder()));
    return result;
}`,
    complexity: 'Time: O(n log n), Space: O(n)',
    difficulty: 'Easy',
  },
  {
    id: 'sorting-10',
    category: 'Sorting',
    topicId: 'java-collections',
    title: 'Kth Largest Element',
    problem: 'Find the kth largest element in an unsorted array. Note it is the kth largest in sorted order, not the kth distinct element.',
    input: 'nums = [3, 2, 1, 5, 6, 4], k = 2',
    output: '5',
    explanation: 'The simplest approach sorts the array and returns `nums[n - k]`, which is O(n log n).\n\nA better approach keeps a min-heap (`PriorityQueue`) of size k. Every number is added; whenever the heap grows beyond k, the smallest is removed. At the end the heap holds the k largest numbers and its top (the smallest of them) is the answer. This is O(n log k), which is great when k is small.',
    solution: `// Approach 1: sort, O(n log n)
public static int kthLargestBySort(int[] nums, int k) {
    int[] copy = nums.clone();
    Arrays.sort(copy);
    return copy[copy.length - k];
}

// Approach 2: min-heap of size k, O(n log k)
public static int kthLargest(int[] nums, int k) {
    PriorityQueue<Integer> minHeap = new PriorityQueue<>();
    for (int n : nums) {
        minHeap.offer(n);
        if (minHeap.size() > k) {
            minHeap.poll();          // drop the smallest
        }
    }
    return minHeap.peek();
}`,
    complexity: 'Time: O(n log k) with the heap, Space: O(k)',
    difficulty: 'Medium',
  },
  {
    id: 'sorting-11',
    category: 'Sorting',
    topicId: 'java-collections',
    title: 'Merge Overlapping Intervals',
    problem: 'Given a list of intervals [start, end], merge all overlapping intervals and return the result.',
    input: 'intervals = [[1, 3], [8, 10], [2, 6], [15, 18]]',
    output: '[[1, 6], [8, 10], [15, 18]]',
    explanation: 'First sort the intervals by start time, so overlapping intervals end up next to each other. Then walk through them, keeping the last merged interval.\n\nIf the current interval starts before (or exactly when) the last one ends, they overlap, so extend the end to the larger of the two ends. Otherwise, start a new merged interval.',
    solution: `public static int[][] merge(int[][] intervals) {
    if (intervals.length == 0) {
        return new int[0][];
    }
    int[][] sorted = intervals.clone();
    Arrays.sort(sorted, Comparator.comparingInt(interval -> interval[0]));

    List<int[]> merged = new ArrayList<>();
    int[] current = sorted[0].clone();
    merged.add(current);
    for (int[] next : sorted) {
        if (next[0] <= current[1]) {
            current[1] = Math.max(current[1], next[1]);   // overlap: extend
        } else {
            current = next.clone();                        // gap: new interval
            merged.add(current);
        }
    }
    return merged.toArray(new int[0][]);
}`,
    complexity: 'Time: O(n log n), Space: O(n)',
    difficulty: 'Hard',
  },
  {
    id: 'sorting-12',
    category: 'Sorting',
    topicId: 'java-collections',
    title: 'Sort Objects with Comparator Chains',
    problem: 'Given a list of employees with department, salary and name, sort them by department (A to Z), then by salary (highest first), then by name (A to Z).',
    input: 'Employee("Ravi", "IT", 90000), Employee("Asha", "HR", 60000), Employee("Meera", "IT", 90000), Employee("John", "IT", 120000)',
    output: '[Asha HR 60000, John IT 120000, Meera IT 90000, Ravi IT 90000]',
    explanation: '`Comparator.comparing(Employee::department)` builds a comparator from a getter. `thenComparing` adds a tie-breaker that is used only when the previous comparison is equal.\n\nFor the salary we use `Comparator.comparingDouble(Employee::salary).reversed()` inside `thenComparing`, so only the salary part is reversed. A common mistake is calling `.reversed()` at the end of the whole chain, which reverses every level, not just one.',
    solution: `public record Employee(String name, String department, double salary) {}

public static List<Employee> sortEmployees(List<Employee> employees) {
    Comparator<Employee> order = Comparator
            .comparing(Employee::department)
            .thenComparing(Comparator.comparingDouble(Employee::salary).reversed())
            .thenComparing(Employee::name);

    return employees.stream()
            .sorted(order)
            .collect(Collectors.toList());
}`,
    complexity: 'Time: O(n log n), Space: O(n)',
    difficulty: 'Hard',
  },
]

export default questions
