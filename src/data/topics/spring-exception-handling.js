const topic = {
  id: 'spring-exception-handling',
  category: 'spring-boot',
  title: 'Exception Handling in Spring',
  description: 'Turning errors into clean, consistent HTTP responses with @ExceptionHandler, @RestControllerAdvice, custom exceptions, ProblemDetail and safe logging.',
  difficulty: 'Intermediate',
  overview: "Things go wrong in every application: a customer asks for an order that does not exist, a request is invalid, a payment provider is down, or a bug throws a `NullPointerException`. Exception handling decides what the client sees when that happens. Good APIs return the right HTTP status code and a clear, consistent JSON error body; bad APIs return a 500 with a stack trace for everything.\n\nThink of a customer service desk. When something goes wrong, customers should get a polite, clear explanation and a reference number, not a view into the messy back office. Spring's exception handling is that desk: your code throws exceptions, and one central place translates them into friendly, predictable responses while the details are logged internally.\n\nSpring MVC provides `@ExceptionHandler` methods, global handlers with `@ControllerAdvice` / `@RestControllerAdvice`, `@ResponseStatus` and `ResponseStatusException`, and since Spring 6 built-in support for the RFC 7807 / RFC 9457 `ProblemDetail` error format.",

  subtopics: [
    {
      id: 'exception-handler',
      title: '@ExceptionHandler',
      explanation: "`@ExceptionHandler` marks a method that handles specific exception types thrown by controller methods. The handler method can return a DTO, a `ResponseEntity` or a `ProblemDetail`, and can receive the exception, the `HttpServletRequest` or a `WebRequest` as parameters.\n\nIf declared inside a controller, it only handles exceptions from that controller. Declared inside a `@ControllerAdvice` class, it applies globally. When several handlers match, Spring picks the one for the closest exception type in the class hierarchy.",
      example: `@RestController
@RequestMapping("/api/orders")
public class OrderController {

    @GetMapping("/{id}")
    public OrderDto get(@PathVariable Long id) {
        return orderService.findById(id); // may throw OrderNotFoundException
    }

    // Local handler: only for exceptions thrown by this controller
    @ExceptionHandler(OrderNotFoundException.class)
    public ResponseEntity<String> handleNotFound(OrderNotFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ex.getMessage());
    }
}`,
      interviewPoints: [
        'Handles specific exception types thrown from handler methods.',
        'Local to a controller unless placed in a @ControllerAdvice.',
        'Most specific exception type wins.',
      ],
    },
    {
      id: 'controller-advice',
      title: '@ControllerAdvice & @RestControllerAdvice',
      explanation: "`@ControllerAdvice` is a special component whose `@ExceptionHandler` (and `@InitBinder`, `@ModelAttribute`) methods apply to all controllers. `@RestControllerAdvice` is `@ControllerAdvice` plus `@ResponseBody`, so handler return values are written as JSON, which is what REST APIs need.\n\nYou can limit an advice's scope with attributes such as `basePackages`, `assignableTypes` or `annotations`, and order multiple advices with `@Order`. Controller-local handlers take priority over global ones.",
      example: `@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(ResourceNotFoundException.class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    public ErrorResponse handleNotFound(ResourceNotFoundException ex, HttpServletRequest req) {
        return new ErrorResponse(404, "Not Found", ex.getMessage(), req.getRequestURI(), Instant.now());
    }
}

// Limit to one package
@RestControllerAdvice(basePackages = "com.shop.admin")
public class AdminExceptionHandler { }`,
      interviewPoints: [
        '@RestControllerAdvice = @ControllerAdvice + @ResponseBody.',
        'Applies to all controllers; can be scoped by package or type.',
        'Local @ExceptionHandler beats global advice.',
      ],
    },
    {
      id: 'custom-exceptions',
      title: 'Custom exceptions',
      explanation: "Custom exceptions describe business problems in your own language: `OrderNotFoundException`, `InsufficientStockException`, `DuplicateEmailException`. They make service code readable and let the global handler map each type to the right HTTP status.\n\nExtend `RuntimeException` (unchecked), so you do not need `throws` clauses everywhere and Spring's `@Transactional` rolls back by default. A small hierarchy with a common base class, optionally carrying an error code, keeps handling simple.",
      example: `public abstract class BusinessException extends RuntimeException {
    private final String errorCode;

    protected BusinessException(String errorCode, String message) {
        super(message);
        this.errorCode = errorCode;
    }

    public String getErrorCode() { return errorCode; }
}

public class ResourceNotFoundException extends BusinessException {
    public ResourceNotFoundException(String resource, Object id) {
        super("NOT_FOUND", resource + " with id " + id + " was not found");
    }
}

public class InsufficientStockException extends BusinessException {
    public InsufficientStockException(Long productId) {
        super("INSUFFICIENT_STOCK", "Product " + productId + " is out of stock");
    }
}

// Usage in a service
public OrderDto findById(Long id) {
    return orderRepository.findById(id)
            .map(OrderDto::from)
            .orElseThrow(() -> new ResourceNotFoundException("Order", id));
}`,
      interviewPoints: [
        'Extend RuntimeException for business errors.',
        'Unchecked exceptions trigger @Transactional rollback by default.',
        'Include a machine-readable error code for clients.',
      ],
    },
    {
      id: 'global-exception-handling',
      title: 'Global exception handling',
      explanation: "A global handler is one `@RestControllerAdvice` class that handles all exceptions for the whole API. It typically covers your custom business exceptions, validation exceptions, malformed JSON, and a final catch-all for `Exception` that returns a generic 500.\n\nA convenient approach is to extend `ResponseEntityExceptionHandler`. It already handles Spring MVC's own exceptions (missing parameters, unsupported media type, method not allowed, validation errors and more) and returns `ProblemDetail` bodies, and you override only what you want to customise. Setting `spring.mvc.problemdetails.enabled=true` registers such a handler automatically if you do not write one.",
      example: `@RestControllerAdvice
public class GlobalExceptionHandler extends ResponseEntityExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(ResourceNotFoundException.class)
    public ProblemDetail handleNotFound(ResourceNotFoundException ex) {
        return ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, ex.getMessage());
    }

    @ExceptionHandler(InsufficientStockException.class)
    public ProblemDetail handleStock(InsufficientStockException ex) {
        return ProblemDetail.forStatusAndDetail(HttpStatus.CONFLICT, ex.getMessage());
    }

    @ExceptionHandler(Exception.class)
    public ProblemDetail handleUnexpected(Exception ex) {
        log.error("Unexpected error", ex);
        return ProblemDetail.forStatusAndDetail(HttpStatus.INTERNAL_SERVER_ERROR,
                "Something went wrong. Please try again later.");
    }
}`,
      interviewPoints: [
        'One central place for all error responses.',
        'ResponseEntityExceptionHandler covers built-in Spring MVC exceptions.',
        'Always add a catch-all handler that returns a safe 500.',
      ],
    },
    {
      id: 'error-response-dto',
      title: 'Standard API error response: custom error DTO',
      explanation: "Clients should receive the same error structure from every endpoint, so they can parse it reliably. A common custom error DTO includes a timestamp, HTTP status, a short error title, a human-readable message, a machine-readable code, the request path, and optionally a list of field errors and a trace or correlation id.\n\nKeep it stable: once clients rely on your error format, changing it is a breaking change, just like changing a normal response.",
      example: `public record ErrorResponse(
        Instant timestamp,
        int status,
        String error,
        String code,
        String message,
        String path,
        List<FieldError> fieldErrors) {

    public record FieldError(String field, String message) { }
}

// Example body
// {
//   "timestamp": "2026-03-10T09:15:30Z",
//   "status": 409,
//   "error": "Conflict",
//   "code": "INSUFFICIENT_STOCK",
//   "message": "Product 12 is out of stock",
//   "path": "/api/orders",
//   "fieldErrors": []
// }`,
      interviewPoints: [
        'Same error shape for every endpoint.',
        'Include status, message, code, path, timestamp, field errors.',
        'Error format is part of the API contract.',
      ],
    },
    {
      id: 'problem-detail',
      title: 'RFC 7807 ProblemDetail',
      explanation: "RFC 7807 (updated by RFC 9457) defines a standard JSON error format called Problem Details, with the media type `application/problem+json`. Its standard fields are `type` (a URI identifying the error type), `title`, `status`, `detail` and `instance` (the request path), and you can add custom properties.\n\nSpring 6 supports it with the `ProblemDetail` class. You can return a `ProblemDetail` from any `@ExceptionHandler`, add extra fields with `setProperty`, and Spring's built-in exceptions produce it automatically when you extend `ResponseEntityExceptionHandler` or set `spring.mvc.problemdetails.enabled=true`. Using a standard format saves you from inventing and documenting your own.",
      example: `@ExceptionHandler(InsufficientStockException.class)
public ProblemDetail handleStock(InsufficientStockException ex, HttpServletRequest req) {
    ProblemDetail pd = ProblemDetail.forStatusAndDetail(HttpStatus.CONFLICT, ex.getMessage());
    pd.setType(URI.create("https://api.shop.com/errors/insufficient-stock"));
    pd.setTitle("Insufficient stock");
    pd.setInstance(URI.create(req.getRequestURI()));
    pd.setProperty("code", ex.getErrorCode());
    pd.setProperty("timestamp", Instant.now());
    return pd;
}

// Content-Type: application/problem+json
// {
//   "type": "https://api.shop.com/errors/insufficient-stock",
//   "title": "Insufficient stock",
//   "status": 409,
//   "detail": "Product 12 is out of stock",
//   "instance": "/api/orders",
//   "code": "INSUFFICIENT_STOCK",
//   "timestamp": "2026-03-10T09:15:30Z"
// }`,
      interviewPoints: [
        'Standard fields: type, title, status, detail, instance.',
        'Media type application/problem+json.',
        'Spring 6 ProblemDetail class; setProperty for extensions.',
        'Enable for built-in errors with spring.mvc.problemdetails.enabled=true.',
      ],
    },
    {
      id: 'response-status',
      title: '@ResponseStatus',
      explanation: "`@ResponseStatus` sets the HTTP status for a response. On a controller method, it changes the success status, for example `@ResponseStatus(HttpStatus.CREATED)` on a POST. On a custom exception class, it tells Spring which status to return whenever that exception escapes a controller, without writing a handler.\n\nIt is simple but limited: you cannot build a custom body, and the `reason` attribute makes Spring use `sendError`, which returns an HTML/whitelabel-style error rather than your JSON format. For APIs, a global handler usually gives more control.",
      example: `@ResponseStatus(HttpStatus.NOT_FOUND)
public class CustomerNotFoundException extends RuntimeException {
    public CustomerNotFoundException(Long id) {
        super("Customer " + id + " not found");
    }
}

@PostMapping("/api/customers")
@ResponseStatus(HttpStatus.CREATED)
public CustomerDto create(@Valid @RequestBody CreateCustomerRequest req) {
    return customerService.create(req);
}`,
      interviewPoints: [
        'On methods: sets the success status code.',
        'On exception classes: maps the exception to a status.',
        'No control over the body; handlers are more flexible.',
      ],
    },
    {
      id: 'response-status-exception',
      title: 'ResponseStatusException',
      explanation: "`ResponseStatusException` lets you throw an exception with a status code and reason directly, without creating a custom exception class: `throw new ResponseStatusException(HttpStatus.NOT_FOUND, \"Order not found\")`. It implements Spring's `ErrorResponse`, so it renders as a `ProblemDetail` when Problem Details are enabled.\n\nIt is handy for quick prototypes or one-off cases. The downside is that it couples your code to HTTP; throwing it from the service layer mixes web concerns into business logic. For larger apps, prefer domain exceptions mapped in a global handler.",
      example: `@GetMapping("/api/coupons/{code}")
public CouponDto get(@PathVariable String code) {
    return couponRepository.findByCode(code)
            .map(CouponDto::from)
            .orElseThrow(() -> new ResponseStatusException(
                    HttpStatus.NOT_FOUND, "Coupon " + code + " not found"));
}`,
      interviewPoints: [
        'Throw a status and reason without a custom class.',
        'Good for controllers and prototypes.',
        'Avoid in services: it ties business code to HTTP.',
      ],
    },
    {
      id: 'mapping-exceptions',
      title: 'Mapping exceptions to status codes',
      explanation: "Each type of failure should map to a meaningful status. Not found maps to 404. Validation errors and malformed JSON (`MethodArgumentNotValidException`, `HttpMessageNotReadableException`, `MethodArgumentTypeMismatchException`) map to 400. Authentication failures map to 401 and authorisation failures (`AccessDeniedException`) to 403. Business conflicts such as duplicates, invalid state transitions or optimistic locking failures map to 409. Rate limiting maps to 429, a failing downstream dependency to 502/503/504, and anything unexpected to 500.\n\nNote that Spring Security's 401/403 errors are raised in the filter chain before reaching controllers, so they are handled by `AuthenticationEntryPoint` and `AccessDeniedHandler`, not by `@ControllerAdvice`, unless they come from method security.",
      example: `@ExceptionHandler(DataIntegrityViolationException.class)
public ProblemDetail handleConflict(DataIntegrityViolationException ex) {
    log.warn("Data integrity violation: {}", ex.getMostSpecificCause().getMessage());
    return ProblemDetail.forStatusAndDetail(HttpStatus.CONFLICT,
            "The request conflicts with existing data.");
}

@ExceptionHandler(ObjectOptimisticLockingFailureException.class)
public ProblemDetail handleOptimisticLock(ObjectOptimisticLockingFailureException ex) {
    return ProblemDetail.forStatusAndDetail(HttpStatus.CONFLICT,
            "The resource was modified by someone else. Reload and try again.");
}

@ExceptionHandler(MethodArgumentTypeMismatchException.class)
public ProblemDetail handleTypeMismatch(MethodArgumentTypeMismatchException ex) {
    return ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST,
            "Invalid value for parameter '" + ex.getName() + "'");
}`,
      interviewPoints: [
        '4xx for client mistakes, 5xx for server failures.',
        'Conflicts and optimistic lock failures: 409.',
        'Security filter errors are handled outside @ControllerAdvice.',
      ],
    },
    {
      id: 'logging-errors',
      title: 'Logging errors',
      explanation: "Log errors in one place, usually the global handler, so each failure is logged exactly once with full context. Expected client errors (404, validation) are normally logged at `WARN` or `DEBUG` without a stack trace, while unexpected 500 errors are logged at `ERROR` with the stack trace.\n\nPass the exception as the last argument to the logger so the stack trace is recorded. Include a correlation or trace id (for example via MDC or Micrometer Tracing) and return it to the client, so support can find the exact log entry. Avoid logging sensitive data such as passwords, tokens or full card numbers, and avoid log-and-rethrow patterns that print the same error several times.",
      example: `@ExceptionHandler(Exception.class)
public ProblemDetail handleUnexpected(Exception ex, HttpServletRequest req) {
    String errorId = UUID.randomUUID().toString();
    log.error("Unhandled error id={} path={}", errorId, req.getRequestURI(), ex);

    ProblemDetail pd = ProblemDetail.forStatusAndDetail(HttpStatus.INTERNAL_SERVER_ERROR,
            "An unexpected error occurred.");
    pd.setProperty("errorId", errorId); // client can quote this to support
    return pd;
}`,
      interviewPoints: [
        'Log once, centrally, with context.',
        'WARN for expected client errors, ERROR with stack trace for 500s.',
        'Return a correlation/error id; never log secrets.',
      ],
    },
    {
      id: 'not-leaking-stack-traces',
      title: 'Not leaking stack traces',
      explanation: "Stack traces, SQL messages and exception class names in API responses reveal internal details (framework versions, table names, file paths) that attackers can use, and they confuse clients. The response should contain only a safe, generic message for unexpected errors, while full details go to the logs.\n\nSpring Boot's default error handling already hides stack traces, but check these settings: `server.error.include-stacktrace=never`, `server.error.include-message=never` (or `on_param` only in development), and `server.error.include-exception=false`. Never put `ex.getMessage()` of unknown exceptions into the response, because it may contain SQL or internal data; only expose messages from your own business exceptions.",
      example: `# application-prod.yml
server:
  error:
    include-stacktrace: never
    include-message: never
    include-binding-errors: never
    include-exception: false`,
      interviewPoints: [
        'Generic message for 500s; details only in logs.',
        'Configure server.error.include-* properties.',
        'Only expose messages from your own, safe exceptions.',
      ],
    },
  ],

  commonMistakes: [
    "Catching exceptions in every controller method with try/catch instead of using one global `@RestControllerAdvice`.",
    "Returning `ex.getMessage()` from unexpected exceptions to the client, leaking SQL errors or internal details.",
    "Using `@ControllerAdvice` without `@ResponseBody` in a REST API, so Spring tries to resolve the return value as a view name.",
    "Forgetting a catch-all `Exception` handler, so some errors return a different format than the rest of the API.",
    "Returning 500 for client mistakes such as not-found or invalid input, or 200 with an error message in the body.",
    "Logging the same exception in the service, the controller and the handler, filling logs with duplicates.",
  ],

  interviewTips: [
    "Describe your standard setup: custom exception hierarchy, one `@RestControllerAdvice`, a consistent error body (ideally `ProblemDetail`) and a catch-all 500 handler.",
    "Mention RFC 7807 / `ProblemDetail` by name; it shows you know modern Spring 6 features.",
    "Explain how you map specific exceptions to 400, 404, 409 and 500, with one example each.",
    "Bring up security: no stack traces in responses, error ids for correlation, and full details only in logs.",
  ],

  interviewQuestions: [
    {
      id: 'spring-exception-handling-q1',
      question: 'How do you handle exceptions globally in Spring Boot?',
      answer: "Create a class annotated with `@RestControllerAdvice` and add `@ExceptionHandler` methods for the exception types you care about. Each method builds the HTTP response: status code plus a consistent error body. Because the advice applies to all controllers, error handling logic lives in one place instead of try/catch blocks in every endpoint.\n\nA good global handler covers custom business exceptions, validation and malformed-request exceptions, and a final `Exception` catch-all that logs the error and returns a generic 500.",
      example: `@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(ResourceNotFoundException.class)
    public ProblemDetail notFound(ResourceNotFoundException ex) {
        return ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, ex.getMessage());
    }
}`,
      points: [
        '@RestControllerAdvice + @ExceptionHandler methods.',
        'Single place, consistent responses.',
        'Include a catch-all handler.',
      ],
      difficulty: 'Beginner',
    },
    {
      id: 'spring-exception-handling-q2',
      question: 'What is the difference between @ControllerAdvice and @RestControllerAdvice?',
      answer: "Both declare global handlers that apply across controllers. `@RestControllerAdvice` is simply `@ControllerAdvice` combined with `@ResponseBody`, so the return value of each `@ExceptionHandler` method is serialised directly into the response body (JSON).\n\nWith plain `@ControllerAdvice`, return values are treated like MVC controller results, for example a view name, unless you add `@ResponseBody` or return a `ResponseEntity`. For REST APIs, use `@RestControllerAdvice`.",
      points: [
        '@RestControllerAdvice = @ControllerAdvice + @ResponseBody.',
        'Use @ControllerAdvice for server-rendered views.',
        'ResponseEntity return types work with either.',
      ],
      difficulty: 'Beginner',
    },
    {
      id: 'spring-exception-handling-q3',
      question: 'What does @ExceptionHandler do and what is its scope?',
      answer: "`@ExceptionHandler` marks a method that handles one or more exception types thrown during request handling. The method can accept the exception and request objects as parameters and return a DTO, `ResponseEntity` or `ProblemDetail`.\n\nIf the method is inside a controller, it handles only exceptions from that controller. Inside a `@ControllerAdvice` class, it applies to all (or a scoped set of) controllers. Controller-local handlers take precedence over global ones, and among matching handlers Spring picks the most specific exception type.",
      points: [
        'Handles specified exception types.',
        'Controller-local or global via advice.',
        'Local beats global; most specific type wins.',
      ],
      difficulty: 'Beginner',
    },
    {
      id: 'spring-exception-handling-q4',
      question: 'Why and how would you create custom exceptions in a Spring application?',
      answer: "Custom exceptions express business failures clearly, like `OrderNotFoundException` or `InsufficientStockException`, instead of generic `RuntimeException`s. The service throws them, and the global handler maps each type to an HTTP status and error code, keeping HTTP concerns out of the service layer.\n\nMake them extend `RuntimeException` so they are unchecked and cause `@Transactional` rollback by default. A common base class such as `BusinessException` with an `errorCode` field lets one handler deal with many exceptions consistently.",
      example: `public class InsufficientStockException extends RuntimeException {
    public InsufficientStockException(Long productId, int requested, int available) {
        super("Requested " + requested + " of product " + productId
                + " but only " + available + " available");
    }
}`,
      points: [
        'Readable, domain-specific failures.',
        'Extend RuntimeException.',
        'Mapped to status codes centrally.',
      ],
      difficulty: 'Beginner',
    },
    {
      id: 'spring-exception-handling-q5',
      question: 'What is ProblemDetail and RFC 7807?',
      answer: "RFC 7807, updated by RFC 9457, standardises a JSON format for HTTP API errors with media type `application/problem+json`. It defines the fields `type` (URI identifying the problem type), `title` (short summary), `status`, `detail` (explanation for this occurrence) and `instance` (URI of the specific occurrence), and allows extra custom fields.\n\nSpring Framework 6 provides the `ProblemDetail` class to represent it. You can return `ProblemDetail` from `@ExceptionHandler` methods and add custom fields with `setProperty`. Built-in Spring MVC exceptions produce ProblemDetail responses when you extend `ResponseEntityExceptionHandler` or set `spring.mvc.problemdetails.enabled=true`.",
      example: `ProblemDetail pd = ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, "Order 42 not found");
pd.setTitle("Order not found");
pd.setType(URI.create("https://api.shop.com/errors/order-not-found"));
pd.setProperty("orderId", 42);
return pd;`,
      points: [
        'Standard error format: type, title, status, detail, instance.',
        'Media type application/problem+json.',
        'Spring 6 ProblemDetail with custom properties.',
      ],
      difficulty: 'Intermediate',
    },
    {
      id: 'spring-exception-handling-q6',
      question: 'What is the difference between @ResponseStatus and ResponseStatusException?',
      answer: "`@ResponseStatus` is an annotation placed on an exception class (or controller method). Whenever that exception is thrown and not otherwise handled, Spring returns the configured status. It is static: every instance of the exception gets the same status.\n\n`ResponseStatusException` is an exception you throw with the status passed at runtime, such as `throw new ResponseStatusException(HttpStatus.NOT_FOUND, \"...\")`, so you do not need a custom class. Both are quick solutions, but neither gives full control over the response body, and both tie code to HTTP. For bigger APIs, domain exceptions plus a global handler are preferred.",
      points: [
        '@ResponseStatus: static mapping on the class.',
        'ResponseStatusException: dynamic status at throw time.',
        'Global handlers give more control over the body.',
      ],
      difficulty: 'Intermediate',
    },
    {
      id: 'spring-exception-handling-q7',
      question: 'Which HTTP status codes would you map common exceptions to?',
      answer: "Map not-found exceptions (for example `EntityNotFoundException` or your own `ResourceNotFoundException`) to 404. Map validation and bad input, such as `MethodArgumentNotValidException`, `HttpMessageNotReadableException`, `MethodArgumentTypeMismatchException` and `MissingServletRequestParameterException`, to 400. Map duplicates (`DataIntegrityViolationException` on a unique key), invalid state transitions and optimistic locking failures to 409.\n\nAuthentication problems map to 401 and `AccessDeniedException` to 403. Failures in downstream services map to 502, 503 or 504, and anything unexpected maps to 500 with a generic message.",
      points: [
        '404 not found, 400 invalid input, 409 conflict.',
        '401 unauthenticated, 403 forbidden.',
        '5xx for server and dependency failures.',
      ],
      difficulty: 'Intermediate',
    },
    {
      id: 'spring-exception-handling-q8',
      question: 'What is ResponseEntityExceptionHandler and why would you extend it?',
      answer: "`ResponseEntityExceptionHandler` is a Spring-provided base class for `@ControllerAdvice` that already contains handlers for Spring MVC's built-in exceptions: `MethodArgumentNotValidException`, `HttpRequestMethodNotSupportedException`, `HttpMediaTypeNotSupportedException`, `MissingServletRequestParameterException`, `NoResourceFoundException` and others. In Spring 6 they return `ProblemDetail` bodies with correct status codes.\n\nExtending it means you get correct, standard handling of framework errors for free, and you override specific methods (for example `handleMethodArgumentNotValid`) to customise them, while adding your own `@ExceptionHandler` methods for business exceptions. Do not also declare `@ExceptionHandler` for the same exceptions it handles, or startup fails with an ambiguous mapping.",
      example: `@RestControllerAdvice
public class ApiExceptionHandler extends ResponseEntityExceptionHandler {

    @Override
    protected ResponseEntity<Object> handleMethodArgumentNotValid(
            MethodArgumentNotValidException ex, HttpHeaders headers,
            HttpStatusCode status, WebRequest request) {
        ProblemDetail pd = ex.getBody();
        pd.setProperty("errors", ex.getBindingResult().getFieldErrors().stream()
                .map(fe -> Map.of("field", fe.getField(), "message", fe.getDefaultMessage()))
                .toList());
        return handleExceptionInternal(ex, pd, headers, status, request);
    }
}`,
      points: [
        'Pre-built handlers for Spring MVC exceptions.',
        'Returns ProblemDetail in Spring 6.',
        'Override methods to customise; do not duplicate handlers.',
      ],
      difficulty: 'Advanced',
    },
    {
      id: 'spring-exception-handling-q9',
      question: 'Why do Spring Security exceptions not reach @ControllerAdvice, and how do you handle them?',
      answer: "Spring Security runs as a servlet filter chain before the request reaches the `DispatcherServlet`. When authentication fails or access is denied at the URL level, the `ExceptionTranslationFilter` handles it, calling the `AuthenticationEntryPoint` (401) or `AccessDeniedHandler` (403). Because this happens outside Spring MVC, `@ControllerAdvice` never sees these exceptions.\n\nTo produce your standard JSON error format, configure a custom `AuthenticationEntryPoint` and `AccessDeniedHandler` in the `SecurityFilterChain` that write the error body. Exceptions thrown by method security (`@PreAuthorize`) inside controllers or services do pass through MVC, so an `AccessDeniedException` handler in your advice can catch those, but make sure it returns 403 rather than your generic 500.",
      example: `@Bean
SecurityFilterChain api(HttpSecurity http, ObjectMapper mapper) throws Exception {
    return http
            .authorizeHttpRequests(a -> a.anyRequest().authenticated())
            .exceptionHandling(e -> e.authenticationEntryPoint((req, res, ex) -> {
                ProblemDetail pd = ProblemDetail.forStatusAndDetail(
                        HttpStatus.UNAUTHORIZED, "Authentication required");
                res.setStatus(401);
                res.setContentType("application/problem+json");
                mapper.writeValue(res.getOutputStream(), pd);
            }))
            .build();
}`,
      points: [
        'Security filters run before DispatcherServlet.',
        'Use AuthenticationEntryPoint (401) and AccessDeniedHandler (403).',
        'Method-security exceptions can reach advice; map them to 403.',
      ],
      difficulty: 'Advanced',
    },
    {
      id: 'spring-exception-handling-q10',
      question: 'How do you make sure error responses do not leak sensitive information?',
      answer: "Never return stack traces, SQL messages or exception class names to clients. For unexpected exceptions, return a generic message such as \"An unexpected error occurred\" plus an error or correlation id, and log the full exception with its stack trace on the server. Only expose messages from your own business exceptions, which you write to be safe.\n\nConfigure Spring Boot's default error handling safely: `server.error.include-stacktrace=never`, `include-message=never`, `include-exception=false`. Also secure Actuator endpoints, avoid logging secrets, and make sure framework errors (malformed JSON, type mismatches) return concise messages rather than internal parser details.",
      points: [
        'Generic messages plus error id for unexpected errors.',
        'Full details only in server logs.',
        'server.error.include-* set to never in production.',
        'Only expose messages you control.',
      ],
      difficulty: 'Advanced',
    },
    {
      id: 'spring-exception-handling-q11',
      question: 'How are exceptions thrown from a controller processed internally by Spring MVC?',
      answer: "When a handler method throws, the `DispatcherServlet` passes the exception to its chain of `HandlerExceptionResolver`s. First, `ExceptionHandlerExceptionResolver` looks for a matching `@ExceptionHandler`, checking the controller class itself and then `@ControllerAdvice` beans in order. Next, `ResponseStatusExceptionResolver` handles `ResponseStatusException` and exceptions annotated with `@ResponseStatus`. Then `DefaultHandlerExceptionResolver` maps standard Spring MVC exceptions to status codes.\n\nIf no resolver handles it, the exception propagates to the servlet container, which forwards to the `/error` path. Spring Boot's `BasicErrorController` then renders the default error response (JSON for API clients, a whitelabel page for browsers), shaped by `server.error.*` settings.",
      points: [
        'HandlerExceptionResolver chain in DispatcherServlet.',
        'Order: @ExceptionHandler, @ResponseStatus, default MVC resolver.',
        'Unhandled: /error and BasicErrorController.',
      ],
      difficulty: 'Advanced',
    },
  ],
}

export default topic
