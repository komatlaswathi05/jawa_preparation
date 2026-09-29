const topic = {
  id: 'java-oop',
  category: 'java',
  title: 'Object-Oriented Programming (OOP)',
  description: 'Classes, objects and the four pillars of OOP (encapsulation, inheritance, polymorphism, abstraction), plus interfaces, object relationships and the core Object methods.',
  difficulty: 'Beginner',
  overview: "Object-Oriented Programming (OOP) is a way of organising code around objects: things that bundle data (fields) together with the behaviour that works on that data (methods). A class is the blueprint and an object is a real thing built from it. Think of a class as the architectural drawing of a house and objects as the actual houses built from that drawing, each with its own paint colour and furniture.\n\nJava is built around OOP. The four pillars you must know for every interview are encapsulation (hide internal data), inheritance (reuse code from a parent class), polymorphism (one interface, many behaviours) and abstraction (show what an object does, hide how).\n\nBeyond the pillars, interviewers ask about constructors, `this` and `super`, abstract classes versus interfaces, access modifiers, `static` and `final`, object relationships (association, aggregation, composition), and the `equals()`/`hashCode()` contract. These ideas are also the foundation of Spring, which is all about wiring objects together.",

  subtopics: [
    {
      id: 'class-and-object',
      title: 'Class & Object',
      explanation: "A class is a template that defines what data (fields) and behaviour (methods) its objects will have. An object is an instance of a class, created with the `new` keyword, and it lives in heap memory.\n\nEach object has its own copy of instance fields, so two `Car` objects can have different colours while sharing the same methods.",
      example: `public class Car {
    String color;
    int speed;

    void accelerate(int amount) {
        speed += amount;
    }
}

Car red = new Car();
red.color = "red";
red.accelerate(30);

Car blue = new Car();   // separate object, separate fields
blue.color = "blue";`,
      interviewPoints: [
        'A class is a blueprint; an object is an instance of it',
        'Objects are created with `new` and stored on the heap',
        'Every class implicitly extends java.lang.Object',
      ],
    },
    {
      id: 'constructors',
      title: 'Constructors & Constructor Overloading',
      explanation: "A constructor is a special method that runs when an object is created. It has the same name as the class and no return type, not even `void`. Its job is to put the new object into a valid starting state.\n\nIf you write no constructor, the compiler adds a no-argument default constructor. As soon as you write any constructor, that default disappears. Constructor overloading means having several constructors with different parameter lists; one can call another with `this(...)` to avoid duplicated code.",
      example: `public class Account {
    private final String owner;
    private double balance;

    public Account(String owner) {
        this(owner, 0.0);          // delegates to the other constructor
    }

    public Account(String owner, double openingBalance) {
        this.owner = owner;
        this.balance = openingBalance;
    }
}

Account a = new Account("Asha");
Account b = new Account("Ravi", 500.0);`,
      interviewPoints: [
        'Constructors have no return type and share the class name',
        'The default constructor is only generated if you define none',
        'Use `this(...)` to chain constructors; it must be the first statement',
        'Constructors are not inherited and cannot be overridden',
      ],
    },
    {
      id: 'this-and-super',
      title: 'this & super',
      explanation: "`this` refers to the current object. Use it to tell a field apart from a parameter with the same name (`this.name = name`), to call another constructor of the same class (`this(...)`), or to pass the current object to another method.\n\n`super` refers to the parent class. Use `super.method()` to call the parent's version of an overridden method, and `super(...)` in a constructor to call the parent's constructor. If you don't write `super(...)`, the compiler inserts a call to the parent's no-arg constructor automatically.",
      example: `class Animal {
    protected String name;

    Animal(String name) {
        this.name = name;
    }

    String sound() {
        return "...";
    }
}

class Dog extends Animal {
    Dog(String name) {
        super(name);               // must be first line
    }

    @Override
    String sound() {
        return super.sound() + " Woof";  // calls parent version
    }
}`,
      interviewPoints: [
        '`this()` and `super()` must be the first statement in a constructor, so you cannot use both',
        '`this` and `super` cannot be used in a static context',
      ],
    },
    {
      id: 'encapsulation',
      title: 'Encapsulation',
      explanation: "Encapsulation means keeping an object's data private and exposing it only through controlled methods. It's like a bank: you can't walk into the vault, but you can deposit and withdraw through the counter, where rules are enforced.\n\nIn Java you make fields `private` and provide public methods (often getters and setters) that validate changes. This protects the object from being put into an invalid state and lets you change the internals later without breaking callers.",
      example: `public class BankAccount {
    private double balance;   // hidden from outside

    public double getBalance() {
        return balance;
    }

    public void deposit(double amount) {
        if (amount <= 0) {
            throw new IllegalArgumentException("Amount must be positive");
        }
        balance += amount;
    }
}`,
      interviewPoints: [
        'Private fields plus public methods = encapsulation',
        'Enables validation and protects invariants',
        'Don\'t blindly add setters for every field; expose behaviour instead',
      ],
    },
    {
      id: 'inheritance',
      title: 'Inheritance',
      explanation: "Inheritance lets a class (child or subclass) reuse and extend the fields and methods of another class (parent or superclass) using `extends`. It models an \"is-a\" relationship: a `Dog` is an `Animal`.\n\nJava supports single inheritance for classes: a class can extend only one class. This avoids the \"diamond problem\" where two parents have the same method. Private members are not accessible in the child, and constructors are not inherited.",
      example: `class Vehicle {
    protected int wheels;

    void start() {
        System.out.println("Vehicle starting");
    }
}

class Bike extends Vehicle {
    Bike() {
        wheels = 2;
    }

    void wheelie() {
        System.out.println("Doing a wheelie!");
    }
}

Bike bike = new Bike();
bike.start();    // inherited
bike.wheelie();  // own method`,
      interviewPoints: [
        'Inheritance represents an is-a relationship',
        'A class can extend only one class in Java',
        'Types: single, multilevel, hierarchical (multiple only via interfaces)',
        'Prefer composition over inheritance when the relationship is has-a',
      ],
    },
    {
      id: 'polymorphism',
      title: 'Polymorphism',
      explanation: "Polymorphism means \"many forms\": the same method call behaves differently depending on the object. There are two kinds.\n\nCompile-time (static) polymorphism is method overloading: the compiler picks the method based on arguments. Runtime (dynamic) polymorphism is method overriding: a parent-type reference holds a child object, and the JVM calls the child's version at runtime. This is also called dynamic method dispatch.",
      example: `Animal a1 = new Dog("Rex");
Animal a2 = new Cat("Tom");

// Same call, different behaviour decided at runtime
System.out.println(a1.sound());  // Woof
System.out.println(a2.sound());  // Meow

List<Animal> zoo = List.of(a1, a2);
for (Animal a : zoo) {
    System.out.println(a.sound());
}`,
      interviewPoints: [
        'Overloading = compile-time polymorphism',
        'Overriding = runtime polymorphism (dynamic dispatch)',
        'The reference type decides which methods you can call; the object type decides which implementation runs',
      ],
    },
    {
      id: 'method-overloading',
      title: 'Method Overloading',
      explanation: "Overloading means having several methods with the same name in the same class but different parameter lists (different number, types or order of parameters). The compiler picks the right one based on the arguments.\n\nChanging only the return type is not enough and causes a compile error. `System.out.println` is a classic example: it is overloaded for int, String, double and more.",
      example: `class Calculator {
    int add(int a, int b) {
        return a + b;
    }

    int add(int a, int b, int c) {
        return a + b + c;
    }

    double add(double a, double b) {
        return a + b;
    }
}

Calculator c = new Calculator();
c.add(1, 2);        // int version
c.add(1.5, 2.5);    // double version`,
      interviewPoints: [
        'Same name, different parameter list, same class (or inherited)',
        'Return type alone cannot distinguish overloads',
        'Resolved at compile time',
        'static and private methods can be overloaded',
      ],
    },
    {
      id: 'method-overriding',
      title: 'Method Overriding',
      explanation: "Overriding means a subclass provides its own implementation of a method already defined in its parent, with the same name, parameters and a compatible return type. Always add `@Override` so the compiler catches typos.\n\nRules: the overriding method cannot have a weaker access modifier (a public method can't become private), cannot throw broader checked exceptions, and may return a subtype (covariant return). `static`, `private` and `final` methods cannot be overridden.",
      example: `class Shape {
    double area() {
        return 0;
    }
}

class Circle extends Shape {
    private final double radius;

    Circle(double radius) {
        this.radius = radius;
    }

    @Override
    public double area() {        // widening access is allowed
        return Math.PI * radius * radius;
    }
}`,
      interviewPoints: [
        'Same signature in parent and child; resolved at runtime',
        'Cannot reduce visibility or throw broader checked exceptions',
        'static methods are hidden, not overridden',
        'Use @Override to get compiler checks',
      ],
    },
    {
      id: 'abstraction',
      title: 'Abstraction',
      explanation: "Abstraction means showing only what an object does and hiding how it does it. When you drive a car you use the steering wheel and pedals without knowing how the engine injects fuel.\n\nIn Java, abstraction is achieved with abstract classes and interfaces. Callers depend on the abstract type (for example `PaymentService`), and the actual implementation can be swapped without changing their code. This is exactly how Spring dependency injection works.",
      example: `interface PaymentService {
    void pay(double amount);
}

class CardPaymentService implements PaymentService {
    public void pay(double amount) {
        System.out.println("Charging card: " + amount);
    }
}

class CheckoutService {
    private final PaymentService payments;   // depends on the abstraction

    CheckoutService(PaymentService payments) {
        this.payments = payments;
    }
}`,
      interviewPoints: [
        'Abstraction hides implementation, encapsulation hides data',
        'Achieved through abstract classes and interfaces',
        'Program to an interface, not an implementation',
      ],
    },
    {
      id: 'abstract-class',
      title: 'Abstract Class',
      explanation: "An abstract class is declared with `abstract` and cannot be instantiated. It can contain abstract methods (no body, subclasses must implement them) as well as normal methods, fields and constructors.\n\nUse an abstract class when related classes share common state or code, and you want to force them to fill in specific steps. It's a partially built blueprint.",
      example: `abstract class Report {
    private final String title;

    protected Report(String title) {
        this.title = title;
    }

    // Template: shared flow, one step left to subclasses
    public final String generate() {
        return title + "\\n" + body();
    }

    protected abstract String body();
}

class SalesReport extends Report {
    SalesReport() {
        super("Sales");
    }

    @Override
    protected String body() {
        return "Total sales: 1000";
    }
}

// Report r = new Report("x");  // compile error: abstract`,
      interviewPoints: [
        'Cannot be instantiated, but can have constructors',
        'Can mix abstract and concrete methods, and hold state',
        'A class with any abstract method must be declared abstract',
      ],
    },
    {
      id: 'interface',
      title: 'Interface',
      explanation: "An interface is a contract: it lists methods a class promises to provide. A class uses `implements` to sign the contract. All interface methods are public by default, and fields are implicitly `public static final` constants.\n\nSince Java 8, interfaces can have `default` methods (with a body, inherited by implementers) and `static` methods. Since Java 9 they can have `private` helper methods. An interface with exactly one abstract method is a functional interface and can be used with lambdas.",
      example: `interface Notifier {
    int MAX_RETRIES = 3;                 // public static final

    void send(String message);           // abstract

    default void sendAll(List<String> messages) {  // Java 8+
        messages.forEach(this::send);
    }

    static Notifier console() {          // static factory
        return msg -> System.out.println(msg);
    }
}

class EmailNotifier implements Notifier {
    @Override
    public void send(String message) {
        System.out.println("Email: " + message);
    }
}`,
      interviewPoints: [
        'Interface methods are public; fields are public static final',
        'Default and static methods since Java 8; private methods since Java 9',
        'Interfaces cannot have instance state or constructors',
      ],
    },
    {
      id: 'multiple-inheritance-interfaces',
      title: 'Multiple Inheritance through Interfaces',
      explanation: "A class can extend only one class, but it can implement many interfaces. This gives you the flexibility of multiple inheritance of type without the diamond problem of state.\n\nIf two interfaces provide default methods with the same signature, the class must override the method to resolve the conflict, and can pick one using `InterfaceName.super.method()`.",
      example: `interface Flyer {
    default String move() {
        return "Flying";
    }
}

interface Swimmer {
    default String move() {
        return "Swimming";
    }
}

class Duck implements Flyer, Swimmer {
    @Override
    public String move() {          // must resolve the conflict
        return Flyer.super.move() + " and " + Swimmer.super.move();
    }
}`,
      interviewPoints: [
        'A class can implement multiple interfaces',
        'Default-method conflicts must be resolved by overriding',
        'Use `X.super.method()` to call a specific interface default',
      ],
    },
    {
      id: 'access-modifiers',
      title: 'Access Modifiers',
      explanation: "Access modifiers control who can see a class, field or method. `private` is visible only inside the same class. No modifier (package-private or default) is visible within the same package. `protected` is visible in the same package plus subclasses in other packages. `public` is visible everywhere.\n\nA good rule is to start with the most restrictive access (`private`) and open things up only when needed. Top-level classes can only be `public` or package-private.",
      example: `package com.shop;

public class Product {
    private double cost;          // only Product
    String sku;                   // package-private: com.shop only
    protected String category;    // com.shop + subclasses anywhere
    public String name;           // everyone
}`,
      interviewPoints: [
        'From most to least restrictive: private, default, protected, public',
        'protected also includes package access',
        'Overriding methods cannot reduce visibility',
      ],
    },
    {
      id: 'static-keyword',
      title: 'static',
      explanation: "`static` means \"belongs to the class, not to any single object\". A static field is shared by all instances, and a static method can be called without creating an object, like `Math.max(3, 5)`.\n\nStatic methods cannot use `this` or access instance fields directly, because there is no object. Static blocks run once when the class is loaded and are used for one-time setup.",
      example: `public class User {
    private static int count = 0;   // shared by all users
    private final String name;

    static {
        System.out.println("User class loaded");
    }

    public User(String name) {
        this.name = name;
        count++;
    }

    public static int getCount() {  // no object needed
        return count;
    }
}

new User("A");
new User("B");
System.out.println(User.getCount());  // 2`,
      interviewPoints: [
        'Static members belong to the class, loaded once',
        'Static methods cannot access instance members or `this`',
        'Static methods can be hidden but not overridden',
        'main is static so the JVM can call it without an object',
      ],
    },
    {
      id: 'final-keyword',
      title: 'final',
      explanation: "`final` means \"cannot be changed\". A final variable can be assigned only once. A final method cannot be overridden. A final class cannot be extended; `String` is a famous example.\n\nImportant: a final reference cannot point to another object, but the object itself can still change. A `final List` can still have items added.",
      example: `final int MAX = 10;
// MAX = 20;                 // compile error

final List<String> names = new ArrayList<>();
names.add("Asha");           // allowed: object is mutable
// names = new ArrayList<>(); // compile error: reference is final

final class Money { }        // cannot be subclassed

class Base {
    final void audit() { }   // cannot be overridden
}`,
      interviewPoints: [
        'final variable: assign once; final method: no override; final class: no subclass',
        'final reference does not make the object immutable',
        'final, finally and finalize() are unrelated',
      ],
    },
    {
      id: 'association-aggregation-composition',
      title: 'Association, Aggregation & Composition',
      explanation: "Association is any relationship where one object uses or knows another, like a `Teacher` and a `Student`. Both can exist independently.\n\nAggregation is a weak \"has-a\" relationship: a `Department` has `Professor`s, but professors still exist if the department is closed. Composition is a strong \"has-a\" (\"part-of\") relationship: a `House` has `Room`s, and the rooms do not exist without the house. In composition the owner usually creates and controls the lifecycle of its parts.",
      example: `// Aggregation: professors are passed in and live independently
class Department {
    private final List<Professor> professors;

    Department(List<Professor> professors) {
        this.professors = professors;
    }
}

// Composition: rooms are created and owned by the house
class House {
    private final List<Room> rooms = new ArrayList<>();

    House(int roomCount) {
        for (int i = 0; i < roomCount; i++) {
            rooms.add(new Room());
        }
    }
}`,
      interviewPoints: [
        'Association: general uses-a relationship',
        'Aggregation: has-a, parts can live independently',
        'Composition: part-of, parts die with the owner',
        'Favour composition over inheritance for flexible designs',
      ],
    },
    {
      id: 'coupling-and-cohesion',
      title: 'Coupling & Cohesion',
      explanation: "Coupling measures how much one class depends on the details of another. Tight coupling (e.g. creating a concrete class with `new` inside your class) makes changes ripple everywhere. Loose coupling (depending on interfaces and receiving dependencies from outside) makes code easy to test and change.\n\nCohesion measures how focused a class is. High cohesion means a class does one job well, like `InvoiceCalculator` only calculating invoices. The goal is always low coupling and high cohesion.",
      example: `// Tight coupling: hard-wired to one implementation
class OrderServiceTight {
    private final MySqlOrderRepository repo = new MySqlOrderRepository();
}

// Loose coupling: depends on an interface, injected from outside
class OrderService {
    private final OrderRepository repo;

    OrderService(OrderRepository repo) {
        this.repo = repo;
    }
}`,
      interviewPoints: [
        'Aim for low coupling and high cohesion',
        'Dependency injection (as in Spring) reduces coupling',
        'High cohesion aligns with the Single Responsibility Principle',
      ],
    },
    {
      id: 'equals-hashcode',
      title: 'equals() & hashCode()',
      explanation: "`equals()` decides whether two objects are logically equal. The default version in `Object` just compares references, like `==`. Override it when two different objects with the same data should count as equal, such as two `Point(1, 2)` objects.\n\n`hashCode()` returns an int used by hash-based collections like `HashMap` and `HashSet` to find the right bucket. The contract: if two objects are equal by `equals()`, they must return the same `hashCode()`. If you override one, always override the other, or your objects will get \"lost\" in HashSets and HashMaps.",
      example: `public class Point {
    private final int x;
    private final int y;

    public Point(int x, int y) {
        this.x = x;
        this.y = y;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof Point other)) return false;
        return x == other.x && y == other.y;
    }

    @Override
    public int hashCode() {
        return Objects.hash(x, y);
    }
}

Set<Point> set = new HashSet<>();
set.add(new Point(1, 2));
System.out.println(set.contains(new Point(1, 2)));  // true`,
      interviewPoints: [
        'Equal objects must have equal hash codes; the reverse is not required',
        'Override both or neither',
        'equals must be reflexive, symmetric, transitive, consistent, and false for null',
        'Java records generate equals, hashCode and toString automatically',
      ],
    },
    {
      id: 'tostring',
      title: 'toString()',
      explanation: "`toString()` returns a human-readable text version of an object. It is called automatically when you print an object or concatenate it with a String.\n\nThe default from `Object` prints the class name and a hex hash, like `Point@1b6d3586`, which is useless for debugging. Override it to show the important fields, but never include secrets like passwords.",
      example: `public class User {
    private final String name;
    private final int age;

    public User(String name, int age) {
        this.name = name;
        this.age = age;
    }

    @Override
    public String toString() {
        return "User{name='" + name + "', age=" + age + "}";
    }
}

System.out.println(new User("Asha", 28));  // User{name='Asha', age=28}`,
      interviewPoints: [
        'Called implicitly by println and string concatenation',
        'Default format is ClassName@hexHashCode',
        'Avoid logging sensitive data in toString',
      ],
    },
    {
      id: 'inner-classes',
      title: 'Inner Classes',
      explanation: "An inner class is a non-static class defined inside another class. Each inner class object is tied to an instance of the outer class and can access all its fields, even private ones.\n\nBecause it holds a hidden reference to the outer object, you create it through an outer instance: `outer.new Inner()`. Local classes (declared inside a method) are another kind of inner class.",
      example: `public class Library {
    private final String name = "City Library";

    class Book {                          // inner class
        private final String title;

        Book(String title) {
            this.title = title;
        }

        String describe() {
            return title + " at " + name;  // accesses outer field
        }
    }
}

Library lib = new Library();
Library.Book book = lib.new Book("Clean Code");
System.out.println(book.describe());`,
      interviewPoints: [
        'Inner classes need an outer instance',
        'They can access private members of the outer class',
        'The hidden outer reference can cause memory leaks if the inner object outlives the outer',
      ],
    },
    {
      id: 'static-nested-classes',
      title: 'Static Nested Classes',
      explanation: "A static nested class is declared with `static` inside another class. It does not hold a reference to an outer instance, so it behaves like a normal top-level class that is just grouped inside another for organisation.\n\nIt can access the outer class's static members, but not instance members directly. A very common use is the Builder pattern.",
      example: `public class Pizza {
    private final String size;
    private final boolean cheese;

    private Pizza(Builder b) {
        this.size = b.size;
        this.cheese = b.cheese;
    }

    public static class Builder {      // static nested class
        private String size = "medium";
        private boolean cheese;

        public Builder size(String size) {
            this.size = size;
            return this;
        }

        public Builder cheese(boolean cheese) {
            this.cheese = cheese;
            return this;
        }

        public Pizza build() {
            return new Pizza(this);
        }
    }
}

Pizza p = new Pizza.Builder().size("large").cheese(true).build();`,
      interviewPoints: [
        'No outer instance needed: `new Outer.Nested()`',
        'Cannot access outer instance fields directly',
        'Prefer static nested over inner classes unless you need the outer instance',
      ],
    },
    {
      id: 'anonymous-classes',
      title: 'Anonymous Classes',
      explanation: "An anonymous class is a class without a name, declared and instantiated in one expression. It is used to provide a one-off implementation of an interface or subclass, often for callbacks or comparators.\n\nFor interfaces with a single abstract method, a lambda is usually shorter and clearer. Anonymous classes are still useful when you need state, multiple methods, or to extend an abstract class.",
      example: `Comparator<String> byLength = new Comparator<String>() {
    @Override
    public int compare(String a, String b) {
        return Integer.compare(a.length(), b.length());
    }
};

// Same thing as a lambda (Java 8+)
Comparator<String> byLengthLambda = (a, b) -> Integer.compare(a.length(), b.length());

List<String> words = new ArrayList<>(List.of("pear", "fig", "banana"));
words.sort(byLength);   // [fig, pear, banana]`,
      interviewPoints: [
        'Declared and instantiated at the same time, no name',
        'Can only use effectively final local variables from the enclosing scope',
        'In an anonymous class `this` refers to the anonymous object; in a lambda it refers to the enclosing object',
      ],
    },
  ],

  commonMistakes: [
    'Overriding `equals()` without overriding `hashCode()`, so equal objects end up in different HashMap buckets and lookups fail.',
    'Writing `public boolean equals(Point p)` instead of `equals(Object o)`, which overloads rather than overrides and is silently ignored by collections.',
    'Adding a parameterised constructor and then being surprised that `new MyClass()` no longer compiles because the default constructor is gone.',
    'Thinking a `final` field or variable makes the referenced object immutable, when only the reference is fixed.',
    'Using inheritance just to reuse code when the relationship is really has-a, creating fragile class hierarchies.',
    'Calling an overridable method from a constructor, which can run subclass code before the subclass fields are initialised.',
  ],

  interviewTips: [
    'For the four pillars, give a one-line definition plus a real example for each (bank account, animal sounds, payment interface).',
    'When comparing abstract class vs interface, mention state, constructors, multiple inheritance and Java 8 default methods.',
    'Always mention the equals/hashCode contract and what breaks in a HashMap if it is violated.',
    'Connect OOP to Spring: loose coupling through interfaces and constructor injection shows you understand why OOP matters.',
    'Say "favour composition over inheritance" and be ready to explain why with an example.',
  ],

  interviewQuestions: [
    {
      id: 'java-oop-q1',
      question: 'What are the four pillars of OOP?',
      answer: "Encapsulation: bundle data with the methods that operate on it and hide the data behind private fields. Inheritance: a class reuses and extends another class using `extends`, modelling an is-a relationship.\n\nPolymorphism: one reference type can refer to objects of different classes, and the same method call behaves differently (overloading at compile time, overriding at runtime). Abstraction: expose what an object does through abstract classes or interfaces, and hide how it does it.",
      points: [
        'Encapsulation: private fields + public methods',
        'Inheritance: code reuse through is-a',
        'Polymorphism: overloading and overriding',
        'Abstraction: abstract classes and interfaces',
      ],
      difficulty: 'Beginner',
    },
    {
      id: 'java-oop-q2',
      question: 'What is the difference between a class and an object?',
      answer: "A class is a blueprint or template that defines fields and methods. It exists in code and is loaded once by the JVM. An object is a concrete instance of that class, created at runtime with `new`, occupying memory on the heap with its own values for the fields.\n\nOne class can produce many objects. For example, `Car` is the class, while `myCar` and `yourCar` are two objects with different colours and speeds.",
      points: [
        'Class = blueprint, object = instance',
        'Objects are created with new and live on the heap',
        'Many objects can be created from one class',
      ],
      difficulty: 'Beginner',
    },
    {
      id: 'java-oop-q3',
      question: 'What is the difference between method overloading and method overriding?',
      answer: "Overloading means multiple methods with the same name but different parameter lists, usually in the same class. The compiler chooses which one to call based on the arguments, so it is compile-time polymorphism. Return type alone cannot differ.\n\nOverriding means a subclass redefines a parent method with the same signature. The JVM chooses the implementation based on the actual object type at runtime, so it is runtime polymorphism. Overriding cannot reduce visibility or throw broader checked exceptions, and does not apply to static, private or final methods.",
      example: `class Printer {
    void print(int x) { }         // overload 1
    void print(String s) { }      // overload 2
}

class ColorPrinter extends Printer {
    @Override
    void print(String s) { }      // override
}`,
      points: [
        'Overloading: same name, different parameters, compile time',
        'Overriding: same signature in subclass, runtime',
        'static methods can be overloaded but not overridden',
      ],
      difficulty: 'Beginner',
    },
    {
      id: 'java-oop-q4',
      question: 'What is the difference between an abstract class and an interface?',
      answer: "An abstract class can have instance fields (state), constructors, and both abstract and concrete methods with any access modifier. A class can extend only one abstract class.\n\nAn interface defines a contract. It cannot hold instance state or have constructors; its fields are constants and its methods are public (abstract, default or static, plus private helpers since Java 9). A class can implement many interfaces. Use an abstract class for closely related classes sharing code and state; use an interface to define a capability that unrelated classes can have, like `Comparable`.",
      points: [
        'Abstract class: state, constructors, single inheritance',
        'Interface: no instance state, multiple implementation',
        'Java 8 default methods narrowed the gap but not state',
        'Interfaces are preferred for defining APIs and for DI',
      ],
      difficulty: 'Intermediate',
    },
    {
      id: 'java-oop-q5',
      question: 'Why does Java not support multiple inheritance of classes, and how do interfaces solve it?',
      answer: "If a class could extend two classes that both define the same method or field, it would be ambiguous which one to inherit. This is the diamond problem, and it gets worse with state because you'd have two copies of parent fields.\n\nJava allows a class to implement multiple interfaces instead. Interfaces carry no instance state, and if two interfaces provide conflicting default methods, the compiler forces the class to override the method and choose explicitly using `InterfaceName.super.method()`.",
      points: [
        'Diamond problem: ambiguity about which parent implementation to use',
        'Interfaces have no instance state',
        'Default-method conflicts must be resolved explicitly',
      ],
      difficulty: 'Intermediate',
    },
    {
      id: 'java-oop-q6',
      question: 'What is the contract between equals() and hashCode()?',
      answer: "If two objects are equal according to `equals()`, they must return the same `hashCode()`. If they are not equal, their hash codes may still collide, but good hash functions minimise that. The hash code must also stay consistent as long as the fields used in `equals` don't change.\n\nHashMap and HashSet first use `hashCode()` to find a bucket, then `equals()` to find the exact match. If you override `equals()` but not `hashCode()`, two equal objects likely land in different buckets, so `set.contains(x)` returns false and duplicates sneak into sets.",
      example: `@Override
public boolean equals(Object o) {
    if (this == o) return true;
    if (!(o instanceof Email e)) return false;
    return address.equalsIgnoreCase(e.address);
}

@Override
public int hashCode() {
    return address.toLowerCase().hashCode(); // consistent with equals
}`,
      points: [
        'Equal objects must have equal hash codes',
        'Unequal objects may share a hash code (collision)',
        'Violating the contract breaks HashMap and HashSet',
        'Don\'t use mutable fields as keys in hash-based collections',
      ],
      difficulty: 'Intermediate',
    },
    {
      id: 'java-oop-q7',
      question: 'Explain the static and final keywords.',
      answer: "`static` makes a member belong to the class rather than to instances. Static fields are shared by all objects, static methods can be called without an object and cannot use `this`, and static blocks run once when the class loads.\n\n`final` prevents change: a final variable can be assigned once, a final method cannot be overridden, and a final class cannot be subclassed. They are often combined for constants, like `public static final int MAX_SIZE = 100;`.",
      points: [
        'static: class-level, shared, no `this`',
        'final: no reassignment, no override, no subclass',
        'static final is used for constants',
        'final reference does not make the object immutable',
      ],
      difficulty: 'Beginner',
    },
    {
      id: 'java-oop-q8',
      question: 'What is the difference between aggregation and composition?',
      answer: "Both are has-a relationships. In aggregation, the contained objects can exist independently of the container: a `Team` has `Player`s, but players still exist if the team is disbanded, and a player could belong to another team.\n\nIn composition, the parts are owned by the whole and share its lifecycle: an `Order` has `OrderLine`s, and the lines make no sense without the order. Typically the owner creates the parts itself and never shares them. In JPA terms, composition often maps to `cascade = ALL` with `orphanRemoval = true`.",
      points: [
        'Aggregation: weak has-a, independent lifecycle',
        'Composition: strong part-of, shared lifecycle',
        'Association is the general umbrella term for both',
      ],
      difficulty: 'Intermediate',
    },
    {
      id: 'java-oop-q9',
      question: 'Why is "composition over inheritance" recommended?',
      answer: "Inheritance creates tight coupling: the subclass depends on the parent's implementation details, so a change in the parent can silently break children (the fragile base class problem). It is also fixed at compile time and you only get one parent.\n\nComposition means a class holds references to other objects and delegates work to them. You can swap the parts at runtime, combine many behaviours, and test each piece independently by passing mocks. A classic example is Java's `Stack extends Vector`, which exposes unwanted methods like `add(index, e)` and breaks stack semantics; wrapping a `Deque` would have been better.",
      example: `// Composition: behaviour is delegated and swappable
class Logger {
    private final Formatter formatter;
    private final Writer writer;

    Logger(Formatter formatter, Writer writer) {
        this.formatter = formatter;
        this.writer = writer;
    }

    void log(String msg) throws IOException {
        writer.write(formatter.format(msg));
    }
}`,
      points: [
        'Inheritance couples child to parent implementation',
        'Composition allows runtime flexibility and easier testing',
        'Use inheritance only for a true is-a relationship',
        'Stack extends Vector is a well-known misuse',
      ],
      difficulty: 'Advanced',
    },
    {
      id: 'java-oop-q10',
      question: 'What is the difference between an inner class, a static nested class and an anonymous class?',
      answer: "An inner class is a non-static class inside another class. Each instance holds a hidden reference to an outer instance, so it can access the outer object's fields, and you create it with `outer.new Inner()`.\n\nA static nested class has no link to an outer instance; it is like a top-level class grouped inside another, commonly used for builders. An anonymous class has no name and is declared and instantiated in one expression to give a one-off implementation. Prefer static nested classes by default, because inner classes' hidden outer reference can keep large objects alive and cause memory leaks.",
      points: [
        'Inner: needs outer instance, can access its members',
        'Static nested: independent, no outer reference',
        'Anonymous: unnamed one-off implementation',
        'Inner and anonymous classes can leak the outer instance',
      ],
      difficulty: 'Advanced',
    },
    {
      id: 'java-oop-q11',
      question: 'Can you override a static or private method in Java?',
      answer: "No. Private methods are not visible to subclasses, so a method with the same name in a child class is simply a new, unrelated method.\n\nStatic methods belong to the class, not the object. If a subclass declares a static method with the same signature, it hides the parent's method rather than overriding it. The call is resolved at compile time based on the reference type, not the runtime object, so there is no polymorphism.",
      example: `class Parent {
    static String who() { return "Parent"; }
}

class Child extends Parent {
    static String who() { return "Child"; }  // hides, not overrides
}

Parent p = new Child();
System.out.println(p.who());  // Parent (resolved by reference type)`,
      points: [
        'Private methods are not inherited, so they cannot be overridden',
        'Static methods are hidden, not overridden',
        'Method hiding is resolved at compile time',
        '@Override on a static method gives a compile error',
      ],
      difficulty: 'Advanced',
    },
    {
      id: 'java-oop-q12',
      question: 'What are coupling and cohesion, and what should you aim for?',
      answer: "Coupling is the degree to which one class depends on another's internals. Tight coupling, like creating concrete dependencies with `new` inside a class, makes code hard to change and test. Loose coupling relies on interfaces and receives dependencies from outside, which is what Spring's dependency injection does.\n\nCohesion is how closely related the responsibilities inside one class are. A highly cohesive class does one thing well. You should aim for low coupling and high cohesion, which leads to modular, testable and maintainable code.",
      points: [
        'Low coupling: depend on abstractions, inject dependencies',
        'High cohesion: one focused responsibility per class',
        'Relates directly to SOLID principles and Spring DI',
      ],
      difficulty: 'Intermediate',
    },
  ],
}

export default topic
