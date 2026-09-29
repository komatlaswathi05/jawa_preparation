const questions = [
  {
    id: 'basicJava-01',
    category: 'Basic Java',
    topicId: 'java-fundamentals',
    title: 'FizzBuzz',
    problem: 'Print the numbers from 1 to n. For multiples of 3 print "Fizz" instead of the number, for multiples of 5 print "Buzz", and for multiples of both 3 and 5 print "FizzBuzz".',
    input: 'n = 15',
    output: '1 2 Fizz 4 Buzz Fizz 7 8 Fizz Buzz 11 Fizz 13 14 FizzBuzz',
    explanation: 'Loop from 1 to n and use the modulo operator `%` to check divisibility. Check "divisible by 15" first, because a number divisible by both 3 and 5 would otherwise be caught by the "divisible by 3" branch and print only "Fizz". If none of the rules match, print the number itself.',
    solution: `public static void fizzBuzz(int n) {
    for (int i = 1; i <= n; i++) {
        if (i % 15 == 0) {          // divisible by both 3 and 5
            System.out.println("FizzBuzz");
        } else if (i % 3 == 0) {
            System.out.println("Fizz");
        } else if (i % 5 == 0) {
            System.out.println("Buzz");
        } else {
            System.out.println(i);
        }
    }
}`,
    complexity: 'Time: O(n), Space: O(1)',
    difficulty: 'Easy',
  },
  {
    id: 'basicJava-02',
    category: 'Basic Java',
    topicId: 'java-fundamentals',
    title: 'Check if a Number is Prime',
    problem: 'Write a method that returns true if a given number is prime. A prime number is greater than 1 and divisible only by 1 and itself.',
    input: 'n = 29',
    output: 'true',
    explanation: 'Numbers less than 2 are not prime. For anything else, try dividing by every number from 2 up to the square root of n. If n had a factor bigger than its square root, it would also have a matching factor smaller than the square root, so checking up to the square root is enough. Writing the condition as `i * i <= n` avoids calling `Math.sqrt`.',
    solution: `public static boolean isPrime(int n) {
    if (n < 2) {
        return false;               // 0, 1 and negatives are not prime
    }
    for (int i = 2; (long) i * i <= n; i++) {
        if (n % i == 0) {
            return false;           // found a divisor, so not prime
        }
    }
    return true;
}`,
    complexity: 'Time: O(√n), Space: O(1)',
    difficulty: 'Easy',
  },
  {
    id: 'basicJava-03',
    category: 'Basic Java',
    topicId: 'java-fundamentals',
    title: 'Factorial (Iterative)',
    problem: 'Calculate the factorial of a non-negative integer n without using recursion. The factorial n! is 1 × 2 × 3 × ... × n, and 0! is 1.',
    input: 'n = 5',
    output: '120',
    explanation: 'Start with a result of 1 and multiply it by every number from 2 to n. Use `long` because factorials grow very fast: 13! already overflows an `int`, and even `long` only holds up to 20!. For bigger values you would use `BigInteger`.',
    solution: `public static long factorial(int n) {
    if (n < 0) {
        throw new IllegalArgumentException("n must be non-negative");
    }
    long result = 1;
    for (int i = 2; i <= n; i++) {
        result *= i;
    }
    return result;
}`,
    complexity: 'Time: O(n), Space: O(1)',
    difficulty: 'Easy',
  },
  {
    id: 'basicJava-04',
    category: 'Basic Java',
    topicId: 'java-fundamentals',
    title: 'Fibonacci Series',
    problem: 'Print the first n numbers of the Fibonacci series, where each number is the sum of the two before it, starting with 0 and 1.',
    input: 'n = 10',
    output: '0 1 1 2 3 5 8 13 21 34',
    explanation: 'Keep two variables holding the last two numbers of the series. In each step, print the current one, compute the next as their sum, and shift both variables forward by one. This iterative version uses constant memory, unlike the naive recursive version which recomputes the same values many times.',
    solution: `public static void printFibonacci(int n) {
    long previous = 0;
    long current = 1;
    for (int i = 0; i < n; i++) {
        System.out.print(previous + " ");
        long next = previous + current;
        previous = current;
        current = next;
    }
    System.out.println();
}`,
    complexity: 'Time: O(n), Space: O(1)',
    difficulty: 'Easy',
  },
  {
    id: 'basicJava-05',
    category: 'Basic Java',
    topicId: 'java-fundamentals',
    title: 'Palindrome Number and Sum of Digits',
    problem: 'Using only arithmetic (no String conversion), write two methods: one that checks whether an integer reads the same forwards and backwards, and one that returns the sum of its digits.',
    input: 'n = 12321',
    output: 'isPalindrome -> true, sumOfDigits -> 9',
    explanation: 'Both methods use the same digit trick: `n % 10` gives the last digit and `n / 10` removes it. For the palindrome check, build a reversed number with `reversed * 10 + lastDigit` and compare it with the original (negative numbers are never palindromes because of the minus sign). For the sum of digits, simply add each last digit to a running total; `Math.abs` makes negative inputs work too.',
    solution: `public static boolean isPalindrome(int n) {
    if (n < 0) {
        return false;
    }
    int original = n;
    long reversed = 0;              // long avoids overflow for large inputs
    while (n > 0) {
        int lastDigit = n % 10;
        reversed = reversed * 10 + lastDigit;
        n = n / 10;
    }
    return reversed == original;
}

public static int sumOfDigits(int n) {
    n = Math.abs(n);
    int sum = 0;
    while (n > 0) {
        sum += n % 10;   // add the last digit
        n /= 10;         // remove the last digit
    }
    return sum;
}`,
    complexity: 'Time: O(d) where d is the number of digits, Space: O(1)',
    difficulty: 'Easy',
  },
  {
    id: 'basicJava-06',
    category: 'Basic Java',
    topicId: 'java-fundamentals',
    title: 'Armstrong Number',
    problem: 'An Armstrong number is equal to the sum of its own digits, each raised to the power of the number of digits. For example 153 = 1³ + 5³ + 3³. Check whether a given number is an Armstrong number.',
    input: 'n = 153',
    output: 'true',
    explanation: 'First count the digits, because that count is the power to use. Then take each digit with `% 10`, raise it to that power, and add it to a running sum. If the sum equals the original number, it is an Armstrong number. A small helper loop is used for the power so we stay in exact integer arithmetic instead of using `Math.pow` with doubles.',
    solution: `public static boolean isArmstrong(int n) {
    if (n < 0) {
        return false;
    }
    int digitCount = String.valueOf(n).length();
    int remaining = n;
    long sum = 0;
    while (remaining > 0) {
        int digit = remaining % 10;
        sum += power(digit, digitCount);
        remaining /= 10;
    }
    return sum == n;
}

private static long power(int base, int exponent) {
    long result = 1;
    for (int i = 0; i < exponent; i++) {
        result *= base;
    }
    return result;
}`,
    complexity: 'Time: O(d²) where d is the number of digits (effectively constant for int), Space: O(1)',
    difficulty: 'Medium',
  },
  {
    id: 'basicJava-07',
    category: 'Basic Java',
    topicId: 'java-fundamentals',
    title: 'Swap Two Numbers Without a Temp Variable',
    problem: 'Swap the values of two integer variables without using a third temporary variable.',
    input: 'a = 5, b = 10',
    output: 'a = 10, b = 5',
    explanation: 'Using arithmetic: store the sum in `a`, then `b = a - b` gives the old `a`, and `a = a - b` gives the old `b`. The XOR trick works the same way and cannot overflow: `a ^= b; b ^= a; a ^= b;`. Note that Java passes primitives by value, so this is shown inside one method rather than as a `swap(a, b)` helper, which could not change the caller\'s variables.',
    solution: `public static void main(String[] args) {
    int a = 5;
    int b = 10;

    // Approach 1: arithmetic
    a = a + b;   // a = 15
    b = a - b;   // b = 5  (old a)
    a = a - b;   // a = 10 (old b)
    System.out.println("a = " + a + ", b = " + b);

    // Approach 2: XOR (no overflow risk) - swaps them back
    a = a ^ b;
    b = a ^ b;
    a = a ^ b;
    System.out.println("a = " + a + ", b = " + b);
}`,
    complexity: 'Time: O(1), Space: O(1)',
    difficulty: 'Easy',
  },
  {
    id: 'basicJava-08',
    category: 'Basic Java',
    topicId: 'java-fundamentals',
    title: 'GCD and LCM of Two Numbers',
    problem: 'Find the greatest common divisor (GCD) and least common multiple (LCM) of two positive integers.',
    input: 'a = 12, b = 18',
    output: 'GCD = 6, LCM = 36',
    explanation: 'The Euclidean algorithm says GCD(a, b) = GCD(b, a % b), and GCD(a, 0) = a. We loop until the second number becomes 0. Once we have the GCD, the LCM follows from the formula a × b = GCD × LCM. Dividing before multiplying (`a / gcd * b`) keeps the intermediate value small and avoids overflow.',
    solution: `public static int gcd(int a, int b) {
    while (b != 0) {
        int remainder = a % b;
        a = b;
        b = remainder;
    }
    return a;
}

public static long lcm(int a, int b) {
    return (long) a / gcd(a, b) * b;
}`,
    complexity: 'Time: O(log(min(a, b))), Space: O(1)',
    difficulty: 'Medium',
  },
  {
    id: 'basicJava-09',
    category: 'Basic Java',
    topicId: 'java-fundamentals',
    title: 'Leap Year Check',
    problem: 'Check whether a given year is a leap year. A year is a leap year if it is divisible by 4, except century years (divisible by 100), which must also be divisible by 400.',
    input: 'year = 2000',
    output: 'true (1900 -> false, 2024 -> true, 2023 -> false)',
    explanation: 'Translate the rule directly into a boolean expression: divisible by 400 is always a leap year; otherwise it must be divisible by 4 and not by 100. In real code you can also use `java.time.Year.isLeap(year)`.',
    solution: `public static boolean isLeapYear(int year) {
    return (year % 400 == 0) || (year % 4 == 0 && year % 100 != 0);
}`,
    complexity: 'Time: O(1), Space: O(1)',
    difficulty: 'Easy',
  },
  {
    id: 'basicJava-10',
    category: 'Basic Java',
    topicId: 'java-exceptions',
    title: 'Create and Use a Custom Exception',
    problem: 'Create a custom checked exception `InsufficientFundsException` and use it in a `BankAccount.withdraw` method that fails when the balance is too low.',
    input: 'balance = 500, withdraw(800)',
    output: 'Error: Insufficient funds. Balance: 500.0, requested: 800.0',
    explanation: 'A custom checked exception extends `Exception` (a custom unchecked one would extend `RuntimeException`). Pass a message to the `super` constructor and store any extra data in fields. The `withdraw` method declares it with `throws`, so callers are forced by the compiler to handle it with `try/catch`. This makes business errors explicit and easy to read.',
    solution: `public class InsufficientFundsException extends Exception {
    private final double shortfall;

    public InsufficientFundsException(String message, double shortfall) {
        super(message);
        this.shortfall = shortfall;
    }

    public double getShortfall() {
        return shortfall;
    }
}

public class BankAccount {
    private double balance;

    public BankAccount(double balance) {
        this.balance = balance;
    }

    public void withdraw(double amount) throws InsufficientFundsException {
        if (amount > balance) {
            throw new InsufficientFundsException(
                "Insufficient funds. Balance: " + balance + ", requested: " + amount,
                amount - balance);
        }
        balance -= amount;
    }

    public static void main(String[] args) {
        BankAccount account = new BankAccount(500);
        try {
            account.withdraw(800);
        } catch (InsufficientFundsException e) {
            System.out.println("Error: " + e.getMessage());
            System.out.println("Short by: " + e.getShortfall());
        }
    }
}`,
    complexity: 'Time: O(1), Space: O(1)',
    difficulty: 'Medium',
  },
  {
    id: 'basicJava-11',
    category: 'Basic Java',
    topicId: 'java-design-patterns',
    title: 'Thread-Safe Singleton',
    problem: 'Implement a Singleton class (only one instance can ever exist) that is lazily created and safe to use from multiple threads.',
    input: 'Two threads call Singleton.getInstance() at the same time',
    output: 'Both threads receive the same instance (same hashCode)',
    explanation: 'The constructor is private so nobody outside can call `new`. `getInstance` uses double-checked locking: the first check skips locking once the instance exists (fast path), and the second check inside `synchronized` makes sure only one thread creates it. The field must be `volatile` so other threads never see a half-constructed object. A simpler alternative is the holder-class idiom or an `enum` singleton.',
    solution: `public final class Singleton {
    // volatile prevents other threads from seeing a partly built object
    private static volatile Singleton instance;

    private Singleton() {
        // private constructor: no one else can create instances
    }

    public static Singleton getInstance() {
        if (instance == null) {                    // 1st check, no locking
            synchronized (Singleton.class) {
                if (instance == null) {            // 2nd check, with lock
                    instance = new Singleton();
                }
            }
        }
        return instance;
    }
}

// Simpler alternative: the JVM loads Holder lazily and thread-safely
public final class LazyHolderSingleton {
    private LazyHolderSingleton() { }

    private static class Holder {
        private static final LazyHolderSingleton INSTANCE = new LazyHolderSingleton();
    }

    public static LazyHolderSingleton getInstance() {
        return Holder.INSTANCE;
    }
}`,
    complexity: 'Time: O(1) per call, Space: O(1)',
    difficulty: 'Hard',
  },
  {
    id: 'basicJava-12',
    category: 'Basic Java',
    topicId: 'java-multithreading',
    title: 'Producer–Consumer with BlockingQueue',
    problem: 'Implement the producer–consumer problem: one thread produces numbers and puts them in a shared bounded buffer, another thread takes and processes them. The producer must wait when the buffer is full and the consumer must wait when it is empty.',
    input: 'Buffer capacity = 3, producer creates items 1 to 5',
    output: 'Produced 1, Consumed 1, Produced 2, ... Consumed 5 (order of lines may interleave)',
    explanation: '`ArrayBlockingQueue` is a thread-safe queue with a fixed capacity. `put` blocks automatically while the queue is full and `take` blocks while it is empty, so we do not need `wait`/`notify` ourselves. The producer sends a special "poison pill" value (-1) at the end so the consumer knows when to stop. `join` makes main wait for both threads to finish.',
    solution: `import java.util.concurrent.ArrayBlockingQueue;
import java.util.concurrent.BlockingQueue;

public class ProducerConsumer {
    private static final int POISON_PILL = -1;   // signals "no more items"

    public static void main(String[] args) throws InterruptedException {
        BlockingQueue<Integer> buffer = new ArrayBlockingQueue<>(3);

        Thread producer = new Thread(() -> {
            try {
                for (int item = 1; item <= 5; item++) {
                    buffer.put(item);            // waits if buffer is full
                    System.out.println("Produced " + item);
                }
                buffer.put(POISON_PILL);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
        });

        Thread consumer = new Thread(() -> {
            try {
                while (true) {
                    int item = buffer.take();    // waits if buffer is empty
                    if (item == POISON_PILL) {
                        break;
                    }
                    System.out.println("Consumed " + item);
                }
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
        });

        producer.start();
        consumer.start();
        producer.join();
        consumer.join();
    }
}`,
    complexity: 'Time: O(n) for n items, Space: O(capacity)',
    difficulty: 'Hard',
  },
]

export default questions
