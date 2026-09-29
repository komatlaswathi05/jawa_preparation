const topic = {
  id: 'spring-validation',
  category: 'spring-boot',
  title: 'Validation',
  description: 'Validating incoming data in Spring Boot with Jakarta Bean Validation: built-in constraints, @Valid vs @Validated, nested objects, groups and custom validators.',
  difficulty: 'Beginner',
  overview: "Validation means checking that incoming data is acceptable before your application uses it: a name is not empty, an email looks like an email, a quantity is at least 1. Clients can send anything, by mistake or on purpose, so every API must validate its input.\n\nThink of a nightclub bouncer checking IDs at the door. It is much easier to stop the problem at the entrance than to deal with it once it is inside. Validation is the bouncer for your API: bad requests get a clear `400 Bad Request` with a helpful message, and your service code can trust the data it receives.\n\nSpring Boot uses Jakarta Bean Validation (the `jakarta.validation` API, implemented by Hibernate Validator). You declare rules as annotations on your DTO fields, such as `@NotBlank` and `@Email`, and trigger them with `@Valid`. Add the `spring-boot-starter-validation` dependency to enable it.",

  subtopics: [
    {
      id: 'bean-validation',
      title: 'Bean Validation (jakarta.validation)',
      explanation: "Bean Validation is a Java standard (Jakarta Validation 3.x in Spring Boot 3) for declaring constraints as annotations on fields, method parameters and return values. Hibernate Validator is the reference implementation, and `spring-boot-starter-validation` adds it to your project.\n\nConstraints live in the `jakarta.validation.constraints` package. Spring integrates the validator automatically, so it runs on controller inputs, on `@Validated` beans and on `@ConfigurationProperties` classes. You can also inject a `jakarta.validation.Validator` and validate objects manually.",
      example: `<dependency>
  <groupId>org.springframework.boot</groupId>
  <artifactId>spring-boot-starter-validation</artifactId>
</dependency>

import jakarta.validation.constraints.*;

public record RegisterRequest(
        @NotBlank String name,
        @NotBlank @Email String email,
        @NotNull @Min(18) Integer age) { }`,
      interviewPoints: [
        'Standard API: jakarta.validation; implementation: Hibernate Validator.',
        'Spring Boot 3 needs spring-boot-starter-validation (not included in starter-web).',
        'Declarative: rules live next to the data they describe.',
      ],
    },
    {
      id: 'valid',
      title: '@Valid',
      explanation: "`@Valid` (from `jakarta.validation`) tells Spring or the validator to validate an object. On a controller parameter such as `@Valid @RequestBody CreateUserRequest req`, Spring validates the body before calling your method. If any constraint fails, the method is not called and Spring throws `MethodArgumentNotValidException`, which results in `400 Bad Request` by default.\n\n`@Valid` is also used on fields to cascade validation into nested objects and collection elements.",
      example: `@PostMapping("/api/users")
@ResponseStatus(HttpStatus.CREATED)
public UserDto register(@Valid @RequestBody RegisterRequest request) {
    return userService.register(request); // only reached if valid
}`,
      interviewPoints: [
        'Triggers validation of the annotated object.',
        'On @RequestBody failure: MethodArgumentNotValidException, 400.',
        'Also marks nested properties for cascaded validation.',
      ],
    },
    {
      id: 'validated',
      title: '@Validated',
      explanation: "`@Validated` is Spring's own annotation (`org.springframework.validation.annotation`). It does two things `@Valid` cannot. First, it supports validation groups: `@Validated(OnCreate.class)` validates only constraints in that group. Second, placed on a class, it enables method-level validation through an AOP proxy, so constraints on method parameters and return values of that bean are checked.\n\nSince Spring Framework 6.1, controllers validate constraint annotations on `@PathVariable` and `@RequestParam` parameters natively, without `@Validated` on the class. For services and other beans, `@Validated` on the class is still required for method validation.",
      example: `@Service
@Validated
public class TransferService {

    public void transfer(@NotBlank String fromAccount,
                         @NotBlank String toAccount,
                         @Positive BigDecimal amount) {
        // throws ConstraintViolationException if arguments are invalid
    }
}`,
      interviewPoints: [
        '@Valid: standard, cascading. @Validated: Spring, supports groups.',
        '@Validated on a class enables method validation via proxy.',
        'Service method violations throw ConstraintViolationException.',
      ],
    },
    {
      id: 'built-in-constraints',
      title: '@NotNull, @NotBlank, @Size, @Email, @Min, @Max, @Pattern',
      explanation: "`@NotNull` rejects `null` but allows empty strings. `@NotEmpty` rejects `null` and empty strings or collections. `@NotBlank` (strings only) rejects `null`, empty and whitespace-only strings, and is usually what you want for text input. `@Size(min, max)` limits the length of strings or the size of collections.\n\n`@Email` checks email format, `@Min` and `@Max` bound numeric values, and `@Pattern(regexp = ...)` matches a regular expression. Others worth knowing are `@Positive`, `@PositiveOrZero`, `@DecimalMin`, `@Digits`, `@Past`, `@Future` and `@AssertTrue`. Most constraints treat `null` as valid, so combine them with `@NotNull` or `@NotBlank` when the value is required. Every constraint accepts a `message` attribute.",
      example: `public record CreateProductRequest(
        @NotBlank(message = "name is required")
        @Size(max = 100, message = "name must be at most 100 characters")
        String name,

        @NotNull @Min(1) @Max(1_000_000)
        Long priceInPaise,

        @NotBlank
        @Pattern(regexp = "^[A-Z]{3}-\\\\d{4}$", message = "sku must look like ABC-1234")
        String sku,

        @Email
        String supportEmail,

        @Size(max = 10)
        List<@NotBlank String> tags) { }`,
      interviewPoints: [
        '@NotNull < @NotEmpty < @NotBlank in strictness for strings.',
        'Most constraints consider null valid; pair with @NotNull.',
        'Constraints can be placed on type arguments, e.g. List<@NotBlank String>.',
        'Customise text with the message attribute or ValidationMessages.properties.',
      ],
    },
    {
      id: 'path-query-params',
      title: 'Validating path and query parameters',
      explanation: "You can put constraints directly on `@PathVariable` and `@RequestParam` parameters, such as `@Min(1) Long id` or `@Size(max = 50) String q`. In Spring Boot 3.2+ (Spring Framework 6.1+), Spring MVC applies these automatically as built-in method validation.\n\nWhen they fail, Spring throws `HandlerMethodValidationException` (400). On older versions you needed `@Validated` on the controller class, and failures threw `ConstraintViolationException`, which returns 500 unless you handle it, so always add a handler for it if you use `@Validated` beans.",
      example: `@RestController
@RequestMapping("/api/products")
public class ProductController {

    @GetMapping("/{id}")
    public ProductDto get(@PathVariable @Min(1) Long id) {
        return productService.findById(id);
    }

    @GetMapping
    public List<ProductDto> search(
            @RequestParam @NotBlank @Size(max = 50) String q,
            @RequestParam(defaultValue = "20") @Min(1) @Max(100) int size) {
        return productService.search(q, size);
    }
}`,
      interviewPoints: [
        'Constraints can annotate simple controller parameters.',
        'Spring 6.1+: built-in, throws HandlerMethodValidationException.',
        'Older/@Validated style: ConstraintViolationException, handle it yourself.',
      ],
    },
    {
      id: 'nested-validation',
      title: 'Nested validation',
      explanation: "By default, validation does not go inside nested objects. If `OrderRequest` has a field `AddressRequest shippingAddress`, the address's constraints are ignored unless you mark the field with `@Valid`. This is called cascaded validation.\n\nThe same applies to collections: annotate the list itself with `@Valid` (or write `List<@Valid OrderItemRequest>`) so each element is validated. Error field paths then look like `items[0].quantity`.",
      example: `public record OrderRequest(
        @NotNull @Valid AddressRequest shippingAddress,
        @NotEmpty List<@Valid OrderItemRequest> items) { }

public record AddressRequest(
        @NotBlank String line1,
        @NotBlank String city,
        @Pattern(regexp = "\\\\d{6}") String pinCode) { }

public record OrderItemRequest(
        @NotNull Long productId,
        @Min(1) int quantity) { }`,
      interviewPoints: [
        'Nested objects are not validated without @Valid.',
        'Use @Valid on the field, or on the type argument for lists.',
        'Error paths include the nesting, e.g. items[1].quantity.',
      ],
    },
    {
      id: 'validation-groups',
      title: 'Validation groups',
      explanation: "Sometimes the same DTO needs different rules in different situations. For example, `id` must be null when creating but required when updating. Validation groups solve this: you define marker interfaces, assign constraints to groups with `groups = ...`, and choose which group to validate with `@Validated(Group.class)`.\n\nConstraints without a `groups` attribute belong to the `Default` group. If you validate only `OnUpdate`, constraints in `Default` are not checked unless your group extends `Default`. Many teams prefer separate create and update DTOs instead, because groups can make code harder to follow.",
      example: `public interface OnCreate { }
public interface OnUpdate { }

public record ProductRequest(
        @Null(groups = OnCreate.class) @NotNull(groups = OnUpdate.class) Long id,
        @NotBlank(groups = {OnCreate.class, OnUpdate.class}) String name) { }

@PostMapping("/api/products")
public ProductDto create(@Validated(OnCreate.class) @RequestBody ProductRequest req) {
    return productService.create(req);
}

@PutMapping("/api/products")
public ProductDto update(@Validated(OnUpdate.class) @RequestBody ProductRequest req) {
    return productService.update(req);
}`,
      interviewPoints: [
        'Groups are marker interfaces.',
        'Only @Validated (not @Valid) lets you pick groups.',
        'Unassigned constraints belong to the Default group.',
        'Separate DTOs are often simpler than groups.',
      ],
    },
    {
      id: 'custom-validation',
      title: 'Custom validation (custom annotation + ConstraintValidator)',
      explanation: "When built-in constraints are not enough, create your own. Step one: define an annotation marked with `@Constraint(validatedBy = ...)` that has `message`, `groups` and `payload` attributes. Step two: implement `ConstraintValidator<YourAnnotation, FieldType>` with an `isValid` method. Spring creates the validator as a bean, so you can inject dependencies into it, for example a repository to check uniqueness.\n\nFor rules that involve several fields (such as `password` equals `confirmPassword`, or `endDate` after `startDate`), put the annotation on the class and validate the whole object. Return `true` for `null` values and let `@NotNull` handle required-ness, so constraints stay composable.",
      example: `@Target({ElementType.FIELD, ElementType.PARAMETER})
@Retention(RetentionPolicy.RUNTIME)
@Constraint(validatedBy = IndianMobileValidator.class)
public @interface IndianMobile {
    String message() default "must be a valid 10-digit Indian mobile number";
    Class<?>[] groups() default {};
    Class<? extends Payload>[] payload() default {};
}

public class IndianMobileValidator implements ConstraintValidator<IndianMobile, String> {
    @Override
    public boolean isValid(String value, ConstraintValidatorContext context) {
        if (value == null) {
            return true; // let @NotNull decide whether it is required
        }
        return value.matches("[6-9]\\\\d{9}");
    }
}

// Cross-field validation on the class
@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
@Constraint(validatedBy = DateRangeValidator.class)
public @interface ValidDateRange {
    String message() default "endDate must be after startDate";
    Class<?>[] groups() default {};
    Class<? extends Payload>[] payload() default {};
}

public class DateRangeValidator implements ConstraintValidator<ValidDateRange, BookingRequest> {
    @Override
    public boolean isValid(BookingRequest req, ConstraintValidatorContext ctx) {
        if (req.startDate() == null || req.endDate() == null) {
            return true;
        }
        return req.endDate().isAfter(req.startDate());
    }
}

@ValidDateRange
public record BookingRequest(@NotNull LocalDate startDate, @NotNull LocalDate endDate,
                             @NotBlank @IndianMobile String phone) { }`,
      interviewPoints: [
        'Annotation needs message, groups and payload attributes.',
        'Validator implements ConstraintValidator<A, T>.isValid.',
        'Class-level constraints handle cross-field rules.',
        'Return true for null to keep constraints composable.',
      ],
    },
    {
      id: 'handling-validation-errors',
      title: 'Handling MethodArgumentNotValidException',
      explanation: "When `@Valid @RequestBody` fails, Spring throws `MethodArgumentNotValidException`. The default response is a `400` with a generic body, which is not very helpful to clients. Handle it in a `@RestControllerAdvice` and return a clear list of field errors taken from `ex.getBindingResult().getFieldErrors()`.\n\nAlso handle `HandlerMethodValidationException` (parameter validation in Spring 6.1+) and `ConstraintViolationException` (method validation on `@Validated` beans). The Exception Handling topic covers building a standard error format such as RFC 7807 `ProblemDetail`.",
      example: `@RestControllerAdvice
public class ValidationErrorHandler {

    public record FieldErrorDto(String field, String message) { }
    public record ValidationErrorResponse(int status, String error, List<FieldErrorDto> errors) { }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ValidationErrorResponse handle(MethodArgumentNotValidException ex) {
        List<FieldErrorDto> errors = ex.getBindingResult().getFieldErrors().stream()
                .map(fe -> new FieldErrorDto(fe.getField(), fe.getDefaultMessage()))
                .toList();
        return new ValidationErrorResponse(400, "Validation failed", errors);
    }
}

// Response:
// {"status":400,"error":"Validation failed",
//  "errors":[{"field":"email","message":"must be a well-formed email address"}]}`,
      interviewPoints: [
        '@RequestBody failures: MethodArgumentNotValidException.',
        'Read field errors from getBindingResult().getFieldErrors().',
        'Also handle HandlerMethodValidationException and ConstraintViolationException.',
      ],
    },
  ],

  commonMistakes: [
    "Forgetting the `spring-boot-starter-validation` dependency, so annotations like `@NotBlank` are silently ignored.",
    "Adding constraints to the DTO but forgetting `@Valid` on the `@RequestBody` parameter, so nothing is validated.",
    "Using `@NotNull` on a String when you really mean `@NotBlank`, which lets empty and whitespace-only values through.",
    "Expecting nested objects or list elements to be validated without marking them with `@Valid`.",
    "Importing `javax.validation` annotations in a Spring Boot 3 project instead of `jakarta.validation`.",
    "Relying only on frontend validation; the backend must always validate because clients can be bypassed.",
  ],

  interviewTips: [
    "Explain the difference between `@NotNull`, `@NotEmpty` and `@NotBlank` with a quick example of each; it is a classic question.",
    "Be ready to write a small custom constraint annotation and its `ConstraintValidator` from memory.",
    "Mention how you return a helpful 400 response with field-level errors, not just that validation exists.",
    "Say that validation belongs at the boundary (DTOs) while business rules that need the database, like stock checks, usually live in the service layer.",
  ],

  interviewQuestions: [
    {
      id: 'spring-validation-q1',
      question: 'How do you validate a request body in Spring Boot?',
      answer: "Add `spring-boot-starter-validation`, put Jakarta Bean Validation constraints such as `@NotBlank`, `@Email` and `@Size` on the fields of the request DTO, and annotate the controller parameter with `@Valid @RequestBody`.\n\nSpring validates the object before calling the method. If any constraint fails, it throws `MethodArgumentNotValidException` and returns `400 Bad Request`. You typically handle that exception in a `@RestControllerAdvice` to return a clear list of field errors.",
      example: `public record SignupRequest(@NotBlank String name, @NotBlank @Email String email) { }

@PostMapping("/api/signup")
public ResponseEntity<Void> signup(@Valid @RequestBody SignupRequest req) {
    userService.signup(req);
    return ResponseEntity.status(HttpStatus.CREATED).build();
}`,
      points: [
        'Dependency: spring-boot-starter-validation.',
        'Constraints on DTO fields, @Valid on the parameter.',
        'Failure: MethodArgumentNotValidException, 400.',
      ],
      difficulty: 'Beginner',
    },
    {
      id: 'spring-validation-q2',
      question: 'What is the difference between @NotNull, @NotEmpty and @NotBlank?',
      answer: "`@NotNull` only checks that the value is not `null`; an empty string `\"\"` passes. `@NotEmpty` checks that the value is not `null` and not empty, and works for strings, collections, maps and arrays; `\" \"` (a single space) passes. `@NotBlank` works only on character sequences and checks that the value is not `null` and contains at least one non-whitespace character.\n\nFor required text fields such as names, use `@NotBlank`. For required lists, use `@NotEmpty`. For required numbers, dates or objects, use `@NotNull`.",
      points: [
        '@NotNull: not null.',
        '@NotEmpty: not null and size/length > 0.',
        '@NotBlank: not null and not only whitespace (strings only).',
      ],
      difficulty: 'Beginner',
    },
    {
      id: 'spring-validation-q3',
      question: 'What is the difference between @Valid and @Validated?',
      answer: "`@Valid` is the standard Jakarta annotation. It triggers validation of a parameter or return value and marks fields for cascaded validation into nested objects. It does not support validation groups.\n\n`@Validated` is Spring's annotation. On a parameter it works like `@Valid` but lets you specify validation groups, such as `@Validated(OnCreate.class)`. On a class, it enables method-level validation for that bean through an AOP proxy, so constraints on service method parameters are enforced. For nested cascading you still use `@Valid` on the field.",
      points: [
        '@Valid: jakarta standard, supports cascading, no groups.',
        '@Validated: Spring, supports groups.',
        '@Validated on a class enables method validation.',
      ],
      difficulty: 'Beginner',
    },
    {
      id: 'spring-validation-q4',
      question: 'How do you validate nested objects and lists?',
      answer: "Bean Validation does not cascade into nested objects by default. Mark the nested field with `@Valid` to validate its constraints too. For collections, annotate the collection field with `@Valid` or use a type-argument constraint like `List<@Valid ItemRequest>`, which validates each element.\n\nYou can combine these with constraints on the container itself, such as `@NotEmpty` or `@Size(max = 50)` on the list. Error paths reflect the nesting, for example `items[2].quantity`.",
      example: `public record CheckoutRequest(
        @NotNull @Valid AddressRequest address,
        @NotEmpty @Size(max = 50) List<@Valid CartItem> items) { }`,
      points: [
        'No cascading without @Valid.',
        '@Valid on the field or on list element types.',
        'Container constraints (@NotEmpty, @Size) still apply to the list.',
      ],
      difficulty: 'Intermediate',
    },
    {
      id: 'spring-validation-q5',
      question: 'How do you validate @PathVariable and @RequestParam values?',
      answer: "Put constraint annotations directly on the parameters, for example `@PathVariable @Min(1) Long id` or `@RequestParam @Size(max = 50) String q`. In Spring Boot 3.2+ (Spring Framework 6.1+), Spring MVC applies built-in method validation to controller methods automatically and throws `HandlerMethodValidationException`, returning 400.\n\nIn older versions you had to annotate the controller class with `@Validated`, which enabled AOP-based method validation that throws `ConstraintViolationException`. That exception returns 500 by default, so you must map it to 400 in a `@RestControllerAdvice`.",
      example: `@GetMapping("/api/users/{id}")
public UserDto get(@PathVariable @Positive Long id) {
    return userService.find(id);
}`,
      points: [
        'Constraints go directly on the parameters.',
        'Spring 6.1+: HandlerMethodValidationException (400).',
        'Older/@Validated style: ConstraintViolationException, map to 400.',
      ],
      difficulty: 'Intermediate',
    },
    {
      id: 'spring-validation-q6',
      question: 'What are validation groups and when would you use them?',
      answer: "Validation groups let you apply different subsets of constraints to the same class in different situations. You define marker interfaces such as `OnCreate` and `OnUpdate`, assign constraints to them with the `groups` attribute, and select a group at the validation point with `@Validated(OnCreate.class)`.\n\nA typical use is an `id` field that must be null on create but present on update. Constraints without `groups` belong to `Default`, and are skipped when you validate only a custom group unless the group interface extends `Default`. Separate request DTOs for create and update are often clearer, so use groups sparingly.",
      example: `public record AccountRequest(
        @Null(groups = OnCreate.class) @NotNull(groups = OnUpdate.class) Long id,
        @NotBlank(groups = {OnCreate.class, OnUpdate.class}) String owner) { }

@PostMapping
public AccountDto create(@Validated(OnCreate.class) @RequestBody AccountRequest req) {
    return accountService.create(req);
}`,
      points: [
        'Marker interfaces select subsets of constraints.',
        'Requires @Validated, not @Valid.',
        'Default group behaviour can surprise you.',
      ],
      difficulty: 'Intermediate',
    },
    {
      id: 'spring-validation-q7',
      question: 'How do you create a custom validation annotation?',
      answer: "First, define an annotation with `@Constraint(validatedBy = MyValidator.class)`, `@Target` and `@Retention(RUNTIME)`, and the three required attributes `message`, `groups` and `payload`. Second, implement `ConstraintValidator<MyAnnotation, T>` and put the logic in `isValid(value, context)`.\n\nBest practices: return `true` for `null` and let `@NotNull` enforce presence; keep validators fast and side-effect free. In Spring, validators are created as beans, so you can inject dependencies, for example to check that a username is not already taken, though database checks are often better placed in the service layer to avoid race conditions.",
      example: `@Target(ElementType.FIELD)
@Retention(RetentionPolicy.RUNTIME)
@Constraint(validatedBy = NoProfanityValidator.class)
public @interface NoProfanity {
    String message() default "contains inappropriate words";
    Class<?>[] groups() default {};
    Class<? extends Payload>[] payload() default {};
}

public class NoProfanityValidator implements ConstraintValidator<NoProfanity, String> {
    private static final Set<String> BANNED = Set.of("badword1", "badword2");

    @Override
    public boolean isValid(String value, ConstraintValidatorContext context) {
        if (value == null) return true;
        String lower = value.toLowerCase();
        return BANNED.stream().noneMatch(lower::contains);
    }
}`,
      points: [
        'Annotation with @Constraint and message/groups/payload.',
        'ConstraintValidator implementation with isValid.',
        'Return true for null; combine with @NotNull.',
        'Validators can have Spring dependencies injected.',
      ],
      difficulty: 'Intermediate',
    },
    {
      id: 'spring-validation-q8',
      question: 'How do you implement cross-field validation, such as password and confirmPassword matching?',
      answer: "Field-level constraints only see one value, so cross-field rules need a class-level constraint. Create an annotation with `@Target(ElementType.TYPE)` and a `ConstraintValidator` whose type parameter is the whole DTO. In `isValid`, compare the fields.\n\nTo attach the error to a specific field instead of the object, disable the default violation and build a new one with a property node, so the client sees the error on `confirmPassword`.",
      example: `public class PasswordsMatchValidator
        implements ConstraintValidator<PasswordsMatch, ChangePasswordRequest> {

    @Override
    public boolean isValid(ChangePasswordRequest req, ConstraintValidatorContext ctx) {
        if (req.password() == null || req.password().equals(req.confirmPassword())) {
            return true;
        }
        ctx.disableDefaultConstraintViolation();
        ctx.buildConstraintViolationWithTemplate("passwords do not match")
           .addPropertyNode("confirmPassword")
           .addConstraintViolation();
        return false;
    }
}

@PasswordsMatch
public record ChangePasswordRequest(@NotBlank @Size(min = 8) String password,
                                    @NotBlank String confirmPassword) { }`,
      points: [
        'Use a class-level (TYPE) constraint.',
        'Validator receives the whole object.',
        'addPropertyNode attaches the error to a specific field.',
      ],
      difficulty: 'Advanced',
    },
    {
      id: 'spring-validation-q9',
      question: 'How do you return meaningful validation error responses to clients?',
      answer: "Handle the validation exceptions centrally in a `@RestControllerAdvice`. For `MethodArgumentNotValidException`, iterate over `getBindingResult().getFieldErrors()` and build a list of field name and message pairs; include global (object-level) errors too. Return `400 Bad Request` with a consistent structure, ideally an RFC 7807 `ProblemDetail` with an `errors` property.\n\nAlso handle `HandlerMethodValidationException` for parameter validation and `ConstraintViolationException` for `@Validated` service methods, so all validation failures produce the same shape. Do not include stack traces or internal class names in the response.",
      example: `@ExceptionHandler(MethodArgumentNotValidException.class)
public ProblemDetail onInvalid(MethodArgumentNotValidException ex) {
    ProblemDetail pd = ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, "Validation failed");
    Map<String, String> errors = new LinkedHashMap<>();
    ex.getBindingResult().getFieldErrors()
      .forEach(fe -> errors.putIfAbsent(fe.getField(), fe.getDefaultMessage()));
    pd.setProperty("errors", errors);
    return pd;
}`,
      points: [
        'Central handling in @RestControllerAdvice.',
        'Field-level errors from the BindingResult.',
        'Consistent format such as ProblemDetail.',
        'Cover all three validation exception types.',
      ],
      difficulty: 'Advanced',
    },
    {
      id: 'spring-validation-q10',
      question: 'Where should validation happen: controller, service or database?',
      answer: "Use layers. At the API boundary, validate the shape and format of input with Bean Validation on DTOs: required fields, lengths, formats and ranges. This gives fast, clear 400 responses. In the service layer, enforce business rules that need context or data, such as \"stock must be available\" or \"a user can only have one active subscription\"; `@Validated` method validation can also protect service contracts.\n\nIn the database, use constraints such as `NOT NULL`, `UNIQUE`, `CHECK` and foreign keys as the final safety net, especially for rules that are vulnerable to race conditions like uniqueness. Relying on a validator that checks \"username not taken\" alone is unsafe under concurrency; the unique index is the real guarantee.",
      points: [
        'Controller/DTO: format and shape.',
        'Service: business rules.',
        'Database: integrity constraints as the final guarantee.',
        'Uniqueness checks need a DB constraint because of race conditions.',
      ],
      difficulty: 'Advanced',
    },
  ],
}

export default topic
