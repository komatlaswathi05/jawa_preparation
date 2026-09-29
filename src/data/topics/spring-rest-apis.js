const topic = {
  id: 'spring-rest-apis',
  category: 'spring-boot',
  title: 'REST APIs',
  description: 'Designing and building RESTful HTTP APIs with Spring Boot: HTTP methods, status codes, controllers, DTOs, pagination, versioning, CORS, OpenAPI and idempotency.',
  difficulty: 'Intermediate',
  overview: "A REST API lets programs talk to your backend over HTTP, the same protocol your browser uses. A mobile app, a web frontend or another service sends a request such as `GET /api/orders/42`, and your application answers with a status code and usually a JSON body. REST (Representational State Transfer) is a set of design principles that make these APIs predictable: everything is a resource with a URL, and standard HTTP methods say what to do with it.\n\nThink of a library. Each book has a shelf location (the URL). You can look at a book (GET), add a new one (POST), replace it (PUT), fix a page (PATCH) or remove it (DELETE). The librarian's reply, such as \"here it is\", \"not found\" or \"you are not allowed\", is the HTTP status code.\n\nSpring Boot makes building REST APIs straightforward with `@RestController`, mapping annotations like `@GetMapping`, automatic JSON conversion via Jackson, and `ResponseEntity` for full control over the response. Good API design, including correct status codes, DTOs, validation, pagination, versioning and idempotency, is a core backend interview topic.",

  subtopics: [
    {
      id: 'rest',
      title: 'REST',
      explanation: "REST is an architectural style for designing networked APIs, described by Roy Fielding. In a REST API, the things your system manages (orders, users, products) are resources, each identified by a URL. Clients manipulate resources by sending HTTP requests and receive representations of them, usually JSON.\n\nREST is not a protocol or a library; it is a set of constraints. An API that follows them is called RESTful.",
      interviewPoints: [
        'Resources identified by URIs, manipulated with HTTP methods.',
        'Representations (JSON, XML) are transferred, not the resource itself.',
        'REST is a style, not a standard or protocol.',
      ],
    },
    {
      id: 'rest-principles',
      title: 'REST principles',
      explanation: "The main REST constraints are: client-server separation; statelessness, meaning every request carries all information needed (such as an auth token) and the server stores no client session; cacheability, meaning responses say whether they can be cached; a uniform interface, meaning standard methods, resource URIs and self-descriptive messages; a layered system, where proxies and gateways can sit in between; and optional code on demand.\n\nIn practice, good REST design means noun-based, plural URLs (`/api/orders/42/items`), HTTP methods for actions instead of verbs in URLs (not `/getOrder`), meaningful status codes and consistent JSON.",
      example: `GOOD                              BAD
GET    /api/orders                GET  /api/getAllOrders
GET    /api/orders/42             POST /api/order/fetch?id=42
POST   /api/orders                POST /api/createOrder
PATCH  /api/orders/42             POST /api/updateOrderStatus
DELETE /api/orders/42             GET  /api/deleteOrder?id=42
GET    /api/customers/7/orders`,
      interviewPoints: [
        'Stateless: no server-side session between requests.',
        'Uniform interface: nouns in URLs, verbs as HTTP methods.',
        'Cacheable, layered, client-server.',
      ],
    },
    {
      id: 'http',
      title: 'HTTP basics',
      explanation: "HTTP is a request-response protocol. A request has a method (GET, POST...), a path with optional query string, headers, and an optional body. A response has a status code, headers and an optional body.\n\nTwo properties of methods matter a lot. A safe method does not change server state (GET, HEAD, OPTIONS). An idempotent method gives the same result no matter how many times the same request is repeated (GET, PUT, DELETE, HEAD, OPTIONS). POST is neither safe nor idempotent, and PATCH is not guaranteed to be idempotent.",
      example: `POST /api/orders HTTP/1.1
Host: shop.example.com
Content-Type: application/json
Authorization: Bearer eyJhbGciOi...

{"productId": 12, "quantity": 2}

HTTP/1.1 201 Created
Location: /api/orders/42
Content-Type: application/json

{"id": 42, "status": "NEW", "total": 1998}`,
      interviewPoints: [
        'Request: method, URI, headers, body. Response: status, headers, body.',
        'Safe: GET, HEAD, OPTIONS. Idempotent: plus PUT and DELETE.',
        'POST is neither safe nor idempotent.',
      ],
    },
    {
      id: 'http-methods',
      title: 'GET, POST, PUT, PATCH, DELETE',
      explanation: "GET reads a resource or a collection and must not change anything. POST creates a new resource (the server picks the id) or triggers a process. PUT replaces a resource entirely with the body you send, and can also create it at a client-chosen URL. PATCH partially updates a resource, sending only the fields to change. DELETE removes a resource.\n\nPUT is idempotent: sending the same full representation twice leaves the same state. DELETE is idempotent too: after the first call the resource is gone, and repeating it does not change that (the second call may return 404, but state is the same).",
      example: `GET    /api/products/5        -> 200 OK with product
POST   /api/products          -> 201 Created + Location header
PUT    /api/products/5        -> 200 OK (whole product replaced)
PATCH  /api/products/5        -> 200 OK (only price changed)
       {"price": 899}
DELETE /api/products/5        -> 204 No Content`,
      interviewPoints: [
        'PUT = full replace; PATCH = partial update.',
        'POST creates with a server-generated id; not idempotent.',
        'DELETE is idempotent even if a repeat returns 404.',
      ],
    },
    {
      id: 'http-status-codes',
      title: 'HTTP status codes',
      explanation: "Status codes tell the client what happened. 2xx means success: `200 OK`, `201 Created` (with a `Location` header), `204 No Content`. 3xx means redirection, for example `304 Not Modified`. 4xx means the client made a mistake: `400 Bad Request` (invalid input), `401 Unauthorized` (not authenticated), `403 Forbidden` (authenticated but not allowed), `404 Not Found`, `405 Method Not Allowed`, `409 Conflict` (e.g. duplicate email or version clash), `415 Unsupported Media Type`, `422 Unprocessable Content`, `429 Too Many Requests`.\n\n5xx means the server failed: `500 Internal Server Error`, `502 Bad Gateway`, `503 Service Unavailable`, `504 Gateway Timeout`. Returning `200 OK` with an error message in the body is a common anti-pattern.",
      interviewPoints: [
        '2xx success, 3xx redirect, 4xx client error, 5xx server error.',
        '401 = who are you? 403 = I know you, but no.',
        '201 for creation, 204 for success with no body.',
        'Never return 200 for errors.',
      ],
    },
    {
      id: 'headers',
      title: 'Headers',
      explanation: "Headers carry metadata about the request or response. Common request headers are `Content-Type` (format of the body you send), `Accept` (format you want back), `Authorization` (credentials such as a Bearer token) and custom ones like `Idempotency-Key` or `X-Request-Id`. Common response headers include `Location` (URL of a created resource), `Cache-Control`, `ETag` and `Retry-After`.\n\nIn Spring you read headers with `@RequestHeader` and set them through `ResponseEntity` or `HttpServletResponse`.",
      example: `@GetMapping("/api/reports/{id}")
public ResponseEntity<ReportDto> getReport(
        @PathVariable Long id,
        @RequestHeader(value = "X-Request-Id", required = false) String requestId) {

    ReportDto report = reportService.find(id);
    return ResponseEntity.ok()
            .header("X-Request-Id", requestId)
            .cacheControl(CacheControl.maxAge(Duration.ofMinutes(5)))
            .body(report);
}`,
      interviewPoints: [
        'Content-Type describes the body; Accept requests a format (content negotiation).',
        'Authorization carries credentials such as Bearer JWTs.',
        '@RequestHeader to read, ResponseEntity to set.',
      ],
    },
    {
      id: 'json',
      title: 'JSON',
      explanation: "JSON (JavaScript Object Notation) is the standard format for REST API bodies: human-readable key-value objects, arrays, strings, numbers, booleans and null. Spring Boot uses the Jackson library to convert Java objects to JSON (serialisation) and JSON to Java objects (deserialisation) automatically.\n\nYou can customise mapping with annotations like `@JsonProperty`, `@JsonIgnore` and `@JsonFormat`, or globally with `spring.jackson.*` properties. Java records work very well as JSON DTOs.",
      example: `public record ProductDto(
        Long id,
        String name,
        @JsonProperty("price_in_paise") long price,
        @JsonFormat(pattern = "yyyy-MM-dd") LocalDate launchDate) { }

// Serialised as:
// {"id":5,"name":"Kettle","price_in_paise":89900,"launchDate":"2024-03-01"}`,
      interviewPoints: [
        'Jackson handles JSON conversion via HttpMessageConverters.',
        'Customise with @JsonProperty, @JsonIgnore, @JsonFormat or spring.jackson.*.',
        'Records make concise, immutable JSON DTOs.',
      ],
    },
    {
      id: 'restcontroller',
      title: '@RestController',
      explanation: "`@RestController` marks a class as a web controller whose method return values are written directly to the response body (as JSON by default). It is a combination of `@Controller` and `@ResponseBody`.\n\nA plain `@Controller` is used for server-side rendered pages: its methods return view names that a template engine like Thymeleaf renders. For REST APIs, always use `@RestController`.",
      example: `@RestController
@RequestMapping("/api/products")
public class ProductController {

    private final ProductService productService;

    public ProductController(ProductService productService) {
        this.productService = productService;
    }

    @GetMapping("/{id}")
    public ProductDto get(@PathVariable Long id) {
        return productService.findById(id); // converted to JSON
    }
}`,
      interviewPoints: [
        '@RestController = @Controller + @ResponseBody.',
        'Return values are serialised by HttpMessageConverters (Jackson).',
        'Keep controllers thin: delegate logic to services.',
      ],
    },
    {
      id: 'request-mapping',
      title: '@RequestMapping and @GetMapping, @PostMapping, @PutMapping, @PatchMapping, @DeleteMapping',
      explanation: "`@RequestMapping` maps HTTP requests to controller classes or methods. On a class it usually sets a common base path. It can also match by method, headers, parameters, `consumes` (request content type) and `produces` (response content type).\n\nThe shortcut annotations `@GetMapping`, `@PostMapping`, `@PutMapping`, `@PatchMapping` and `@DeleteMapping` are `@RequestMapping` with the HTTP method preset. They are clearer and the recommended choice on methods.",
      example: `@RestController
@RequestMapping("/api/orders")
public class OrderController {

    private final OrderService orderService;

    public OrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    @GetMapping
    public List<OrderDto> list() { return orderService.findAll(); }

    @GetMapping("/{id}")
    public OrderDto get(@PathVariable Long id) { return orderService.findById(id); }

    @PostMapping
    public ResponseEntity<OrderDto> create(@Valid @RequestBody CreateOrderRequest req) {
        OrderDto created = orderService.create(req);
        URI location = URI.create("/api/orders/" + created.id());
        return ResponseEntity.created(location).body(created);
    }

    @PutMapping("/{id}")
    public OrderDto replace(@PathVariable Long id, @Valid @RequestBody UpdateOrderRequest req) {
        return orderService.replace(id, req);
    }

    @PatchMapping("/{id}")
    public OrderDto patchStatus(@PathVariable Long id, @RequestBody OrderStatusPatch patch) {
        return orderService.updateStatus(id, patch.status());
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) { orderService.delete(id); }
}`,
      interviewPoints: [
        '@RequestMapping on the class for the base path.',
        'Method-specific shortcuts are preferred on handler methods.',
        'consumes/produces restrict content types.',
      ],
    },
    {
      id: 'path-variable-request-param',
      title: '@PathVariable & @RequestParam',
      explanation: "`@PathVariable` binds a part of the URL path, such as the `42` in `/api/orders/42`. Use it to identify a specific resource. `@RequestParam` binds a query string parameter, such as `status=SHIPPED` in `/api/orders?status=SHIPPED`. Use it for optional filters, search terms, sorting and paging.\n\nRequest params can be optional (`required = false`) or have a `defaultValue`. Spring converts strings to the parameter type (numbers, enums, dates) automatically and returns `400 Bad Request` if conversion fails.",
      example: `// GET /api/customers/7/orders?status=SHIPPED&from=2024-01-01
@GetMapping("/api/customers/{customerId}/orders")
public List<OrderDto> customerOrders(
        @PathVariable Long customerId,
        @RequestParam(required = false) OrderStatus status,
        @RequestParam(defaultValue = "2000-01-01")
        @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from) {
    return orderService.find(customerId, status, from);
}`,
      interviewPoints: [
        'PathVariable identifies a resource; RequestParam filters or modifies.',
        'RequestParam supports required=false and defaultValue.',
        'Type conversion failures result in 400.',
      ],
    },
    {
      id: 'request-body',
      title: '@RequestBody',
      explanation: "`@RequestBody` tells Spring to read the HTTP request body and convert it (usually from JSON using Jackson) into a Java object. It is used with POST, PUT and PATCH. The request must have a matching `Content-Type`, typically `application/json`, or Spring returns `415 Unsupported Media Type`.\n\nIf the JSON is malformed, Spring throws `HttpMessageNotReadableException`, which results in `400 Bad Request`. Add `@Valid` to trigger Bean Validation on the object.",
      example: `public record CreateCustomerRequest(
        @NotBlank String name,
        @Email @NotBlank String email) { }

@PostMapping("/api/customers")
@ResponseStatus(HttpStatus.CREATED)
public CustomerDto create(@Valid @RequestBody CreateCustomerRequest request) {
    return customerService.create(request);
}`,
      interviewPoints: [
        'Deserialises the body via HttpMessageConverters.',
        'Needs a matching Content-Type, otherwise 415.',
        'Combine with @Valid for validation.',
      ],
    },
    {
      id: 'response-entity',
      title: 'ResponseEntity',
      explanation: "`ResponseEntity<T>` represents the entire HTTP response: status code, headers and body. Returning a plain object always gives `200 OK`; returning a `ResponseEntity` lets you choose `201 Created` with a `Location` header, `204 No Content`, `404 Not Found` and so on.\n\nIt has a fluent builder API: `ResponseEntity.ok(body)`, `ResponseEntity.created(uri).body(body)`, `ResponseEntity.noContent().build()`, `ResponseEntity.notFound().build()` and `ResponseEntity.status(HttpStatus.ACCEPTED).body(body)`.",
      example: `@GetMapping("/{id}")
public ResponseEntity<ProductDto> get(@PathVariable Long id) {
    return productService.findOptional(id)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
}

@PostMapping
public ResponseEntity<ProductDto> create(@Valid @RequestBody CreateProductRequest req) {
    ProductDto saved = productService.create(req);
    URI location = ServletUriComponentsBuilder.fromCurrentRequest()
            .path("/{id}").buildAndExpand(saved.id()).toUri();
    return ResponseEntity.created(location).body(saved);
}`,
      interviewPoints: [
        'Full control over status, headers and body.',
        'Use created(uri) for POST so clients get the Location header.',
        'Alternatives: @ResponseStatus for fixed status codes.',
      ],
    },
    {
      id: 'dto',
      title: 'DTO (Data Transfer Object)',
      explanation: "A DTO is a simple object that defines exactly what data goes in or out of your API. Instead of exposing JPA entities directly, you map entities to response DTOs and accept request DTOs as input.\n\nThis prevents leaking internal or sensitive fields (like password hashes), avoids lazy-loading and infinite recursion problems with entity relationships, protects against mass assignment (a client setting `role=ADMIN`), and lets your database model evolve without breaking API clients. Records are ideal for DTOs; mapping can be manual or done with MapStruct.",
      example: `// Entity (internal)
@Entity
public class Customer {
    @Id @GeneratedValue private Long id;
    private String name;
    private String email;
    private String passwordHash;
    private String role;
}

// DTOs (public contract)
public record CreateCustomerRequest(@NotBlank String name, @Email String email, @Size(min = 8) String password) { }
public record CustomerResponse(Long id, String name, String email) {

    public static CustomerResponse from(Customer c) {
        return new CustomerResponse(c.getId(), c.getName(), c.getEmail());
    }
}`,
      interviewPoints: [
        'Separates the API contract from the persistence model.',
        'Prevents leaking sensitive fields and mass assignment.',
        'Separate request and response DTOs; records are a good fit.',
      ],
    },
    {
      id: 'validation-brief',
      title: 'Validation (overview)',
      explanation: "Never trust client input. Spring Boot integrates Jakarta Bean Validation: put constraints like `@NotBlank`, `@Email` and `@Size` on DTO fields and add `@Valid` to the `@RequestBody` parameter. If validation fails, Spring throws `MethodArgumentNotValidException` and returns `400 Bad Request`.\n\nYou need the `spring-boot-starter-validation` dependency. Validating path and query parameters, nested objects, groups and custom constraints are covered in depth in the Validation topic, and turning validation errors into a clean response is covered in Exception Handling.",
      example: `public record CreateProductRequest(
        @NotBlank @Size(max = 100) String name,
        @Positive long price) { }

@PostMapping("/api/products")
public ResponseEntity<ProductDto> create(@Valid @RequestBody CreateProductRequest req) {
    // only reached if the request is valid
    return ResponseEntity.status(HttpStatus.CREATED).body(productService.create(req));
}`,
      interviewPoints: [
        'Add spring-boot-starter-validation.',
        '@Valid on @RequestBody triggers validation.',
        'Failures produce 400 via MethodArgumentNotValidException.',
      ],
    },
    {
      id: 'pagination-sorting',
      title: 'Pagination & Sorting',
      explanation: "Returning thousands of rows in one response is slow and wasteful. Pagination returns data in pages, for example `?page=0&size=20`, and sorting orders it, for example `?sort=createdAt,desc`. With Spring Data, a `Pageable` parameter in the controller is filled automatically from these query parameters and passed straight to the repository.\n\nReturn a stable DTO structure rather than exposing Spring's `PageImpl` directly (Spring Data 3.3+ warns about this and offers `@EnableSpringDataWebSupport(pageSerializationMode = VIA_DTO)`). Limit the maximum page size (`spring.data.web.pageable.max-page-size`), and for very large or fast-changing datasets consider keyset (cursor) pagination instead of offsets.",
      example: `// GET /api/products?page=0&size=20&sort=price,asc
@GetMapping("/api/products")
public PageResponse<ProductDto> list(
        @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC)
        Pageable pageable) {
    Page<ProductDto> page = productRepository.findAll(pageable).map(ProductDto::from);
    return new PageResponse<>(page.getContent(), page.getNumber(),
            page.getSize(), page.getTotalElements(), page.getTotalPages());
}

public record PageResponse<T>(List<T> content, int page, int size,
                              long totalElements, int totalPages) { }`,
      interviewPoints: [
        'Pageable is resolved from page, size and sort query params.',
        'Page numbers are zero-based by default.',
        'Cap page size; consider keyset pagination for big tables.',
      ],
    },
    {
      id: 'filtering',
      title: 'Filtering',
      explanation: "Filtering lets clients narrow a collection using query parameters, such as `GET /api/products?category=kitchen&minPrice=500`. Filters are optional `@RequestParam`s, or a small filter object bound from the query string.\n\nFor simple cases use derived query methods in Spring Data. For many optional filters, build the query dynamically with JPA Specifications or Querydsl, so you do not end up with dozens of repository methods. Always validate and whitelist filterable fields.",
      example: `public record ProductFilter(String category, Long minPrice, Long maxPrice) { }

// GET /api/products?category=kitchen&minPrice=500
@GetMapping("/api/products")
public Page<ProductDto> search(ProductFilter filter, Pageable pageable) {
    return productService.search(filter, pageable); // uses a JPA Specification
}`,
      interviewPoints: [
        'Filters are query params on the collection URL.',
        'A record or class without annotations binds from query params.',
        'Specifications / Querydsl for dynamic filters.',
      ],
    },
    {
      id: 'api-versioning',
      title: 'API versioning',
      explanation: "Once clients depend on your API, breaking changes (renaming a field, changing a type) need a new version so old clients keep working. Common strategies are URI versioning (`/api/v1/orders`), a request header (`X-API-Version: 2`), a query parameter (`?version=2`), or media-type versioning (`Accept: application/vnd.shop.v2+json`).\n\nURI versioning is the simplest and most widely used, and works well with caches and documentation. Prefer additive, backward-compatible changes (new optional fields) so you rarely need a new version. Spring Framework 7 / Spring Boot 4 add first-class versioning support via a `version` attribute on mapping annotations; in Spring Boot 3 you implement it with paths, headers or `produces`.",
      example: `@RestController
@RequestMapping("/api/v1/orders")
public class OrderControllerV1 { /* old contract */ }

@RestController
@RequestMapping("/api/v2/orders")
public class OrderControllerV2 { /* new contract */ }

// Header-based alternative in Spring Boot 3
@GetMapping(value = "/api/orders/{id}", headers = "X-API-Version=2")
public OrderDtoV2 getV2(@PathVariable Long id) { return service.findV2(id); }`,
      interviewPoints: [
        'URI, header, query param or media-type versioning.',
        'URI versioning is simplest and most common.',
        'Prefer backward-compatible, additive changes.',
      ],
    },
    {
      id: 'cors',
      title: 'CORS',
      explanation: "Browsers enforce the same-origin policy: JavaScript on `https://app.shop.com` cannot call `https://api.shop.com` unless the API allows it. CORS (Cross-Origin Resource Sharing) is the mechanism by which the server tells the browser which origins, methods and headers are allowed. For non-simple requests the browser first sends a preflight `OPTIONS` request.\n\nIn Spring, allow CORS per controller with `@CrossOrigin` or globally with a `WebMvcConfigurer`. If you use Spring Security, also enable `http.cors(...)` so preflight requests are not blocked before reaching MVC. Avoid `allowedOrigins(\"*\")` together with credentials; list specific origins. CORS only affects browsers, so it is not an authentication mechanism.",
      example: `@Configuration
public class CorsConfig implements WebMvcConfigurer {
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
                .allowedOrigins("https://app.shop.com")
                .allowedMethods("GET", "POST", "PUT", "PATCH", "DELETE")
                .allowedHeaders("*")
                .allowCredentials(true)
                .maxAge(3600);
    }
}`,
      interviewPoints: [
        'Browser-enforced; servers declare allowed origins.',
        'Preflight OPTIONS for non-simple requests.',
        '@CrossOrigin or a global WebMvcConfigurer; enable in Spring Security too.',
      ],
    },
    {
      id: 'openapi-swagger',
      title: 'Swagger / OpenAPI (springdoc)',
      explanation: "OpenAPI is a standard, machine-readable description of a REST API: its endpoints, parameters, request and response schemas and error codes. Swagger UI renders that description as interactive documentation where you can try requests in the browser.\n\nFor Spring Boot 3, use `springdoc-openapi` (the older Springfox library does not support Boot 3). Add `springdoc-openapi-starter-webmvc-ui` and you get the spec at `/v3/api-docs` and the UI at `/swagger-ui.html`, generated from your controllers. Enrich it with annotations like `@Operation`, `@Tag` and `@ApiResponse`, and generate typed clients from the spec.",
      example: `<dependency>
  <groupId>org.springdoc</groupId>
  <artifactId>springdoc-openapi-starter-webmvc-ui</artifactId>
  <version>2.6.0</version>
</dependency>

@Tag(name = "Orders")
@RestController
@RequestMapping("/api/orders")
public class OrderController {

    @Operation(summary = "Get an order by id")
    @ApiResponse(responseCode = "200", description = "Order found")
    @ApiResponse(responseCode = "404", description = "Order not found")
    @GetMapping("/{id}")
    public OrderDto get(@PathVariable Long id) { return orderService.findById(id); }
}`,
      interviewPoints: [
        'OpenAPI = spec; Swagger UI = interactive docs.',
        'springdoc-openapi for Boot 3; Springfox is obsolete.',
        'Spec at /v3/api-docs, UI at /swagger-ui.html.',
      ],
    },
    {
      id: 'idempotency',
      title: 'Idempotency',
      explanation: "An operation is idempotent if doing it once or many times has the same effect. This matters because networks fail: a client may send a request, time out and retry, not knowing whether the first one succeeded. GET, PUT and DELETE are idempotent by design; POST is not, so retrying \"create payment\" could charge a customer twice.\n\nThe common solution is an idempotency key: the client sends a unique `Idempotency-Key` header (such as a UUID) with each logical operation. The server stores the key with the result; if the same key arrives again, it returns the stored result instead of repeating the action. A unique database constraint on the key protects against concurrent duplicates.",
      example: `@PostMapping("/api/payments")
public ResponseEntity<PaymentDto> pay(
        @RequestHeader("Idempotency-Key") String key,
        @Valid @RequestBody PaymentRequest request) {

    return idempotencyStore.find(key)
            .map(saved -> ResponseEntity.ok(saved))            // replay stored result
            .orElseGet(() -> {
                PaymentDto result = paymentService.charge(request);
                idempotencyStore.save(key, result);            // unique constraint on key
                return ResponseEntity.status(HttpStatus.CREATED).body(result);
            });
}`,
      interviewPoints: [
        'Idempotent = same effect when repeated.',
        'GET, PUT, DELETE idempotent; POST and PATCH are not guaranteed.',
        'Idempotency-Key header plus stored results for safe POST retries.',
        'Enforce with a unique constraint to handle concurrent retries.',
      ],
    },
  ],

  commonMistakes: [
    "Using verbs in URLs, like `/api/createOrder`, instead of nouns plus the right HTTP method (`POST /api/orders`).",
    "Returning `200 OK` for every response, including errors, instead of meaningful status codes like 400, 404 and 409.",
    "Exposing JPA entities directly in responses, which leaks sensitive fields and can cause infinite recursion or lazy-loading exceptions.",
    "Forgetting `@RequestBody` on a POST parameter, so Spring tries to bind query params and the object arrives with all fields `null`.",
    "Returning unbounded lists from collection endpoints instead of paginating, which breaks when the table grows.",
    "Using `GET` for operations that change data, which crawlers, prefetchers and caches may trigger unexpectedly.",
  ],

  interviewTips: [
    "When asked to design an endpoint, state the URL, method, request body, success status code and main error codes; that structure impresses interviewers.",
    "Be precise about PUT vs PATCH and about which methods are idempotent; these are the most common trick questions.",
    "Mention DTOs and validation whenever you show a POST endpoint; it signals production experience.",
    "Know the difference between 401 and 403, and between 400 and 422, and give an example of each.",
  ],

  interviewQuestions: [
    {
      id: 'spring-rest-apis-q1',
      question: 'What is REST and what are its main principles?',
      answer: "REST (Representational State Transfer) is an architectural style for networked APIs where the system exposes resources, each identified by a URI, and clients manipulate them through a uniform interface, the standard HTTP methods, exchanging representations such as JSON.\n\nIts key constraints are client-server separation, statelessness (each request carries everything needed, no server session), cacheability, a uniform interface, and a layered system. Code on demand is optional.",
      points: [
        'Resources with URIs; HTTP methods as operations.',
        'Stateless, cacheable, layered, client-server.',
        'Uniform interface: nouns in URLs, standard methods and status codes.',
      ],
      difficulty: 'Beginner',
    },
    {
      id: 'spring-rest-apis-q2',
      question: 'What is the difference between PUT and PATCH?',
      answer: "PUT replaces the whole resource with the representation in the request body. Fields you leave out are typically reset or removed, and PUT is idempotent: sending the same body twice leaves the same state.\n\nPATCH applies a partial update, sending only the fields that should change. It is not guaranteed to be idempotent; for example, a patch that says \"increment stock by 1\" gives different results when repeated. PATCH bodies can be plain partial JSON or a standard format like JSON Merge Patch or JSON Patch.",
      example: `PUT /api/users/7
{"name": "Asha", "email": "asha@example.com", "phone": "9876543210"}

PATCH /api/users/7
{"phone": "9123456780"}`,
      points: [
        'PUT = full replacement, idempotent.',
        'PATCH = partial update, not necessarily idempotent.',
        'Missing fields in PUT usually mean cleared values.',
      ],
      difficulty: 'Beginner',
    },
    {
      id: 'spring-rest-apis-q3',
      question: 'Which HTTP status codes would you return for common REST operations?',
      answer: "For reads, return `200 OK`, or `404 Not Found` if the resource does not exist. For creation with POST, return `201 Created` with a `Location` header pointing to the new resource. For updates, return `200 OK` with the updated body or `204 No Content`. For deletes, return `204 No Content`.\n\nFor client errors: `400 Bad Request` for invalid input, `401 Unauthorized` when not authenticated, `403 Forbidden` when authenticated but not permitted, `409 Conflict` for duplicates or version conflicts, and `429 Too Many Requests` for rate limits. Use `500` for unexpected server errors and `503` when temporarily unavailable.",
      points: [
        'GET 200/404, POST 201 + Location, PUT/PATCH 200 or 204, DELETE 204.',
        '400 validation, 401 unauthenticated, 403 forbidden, 409 conflict.',
        '5xx only for server-side failures.',
      ],
      difficulty: 'Beginner',
    },
    {
      id: 'spring-rest-apis-q4',
      question: 'What is the difference between @Controller and @RestController?',
      answer: "`@Controller` is used for traditional MVC applications where handler methods return a view name that a template engine (such as Thymeleaf) renders into HTML. To return data directly from a `@Controller` method, you must add `@ResponseBody`.\n\n`@RestController` is `@Controller` plus `@ResponseBody` on every method, so return values are serialised directly into the response body, as JSON via Jackson by default. It is the standard choice for REST APIs.",
      points: [
        '@Controller returns views; @RestController returns data.',
        '@RestController = @Controller + @ResponseBody.',
        'Serialisation handled by HttpMessageConverters.',
      ],
      difficulty: 'Beginner',
    },
    {
      id: 'spring-rest-apis-q5',
      question: 'What is the difference between @PathVariable, @RequestParam and @RequestBody?',
      answer: "`@PathVariable` binds a segment of the URL path, such as the id in `/api/orders/{id}`, and usually identifies a specific resource. `@RequestParam` binds a query-string parameter, such as `?status=NEW&page=2`, and is used for filtering, sorting, paging or optional inputs; it supports defaults and optional values.\n\n`@RequestBody` converts the whole request body (usually JSON) into a Java object using Jackson, and is used for POST, PUT and PATCH payloads. Only one `@RequestBody` is allowed per method.",
      example: `@PutMapping("/api/stores/{storeId}/products/{productId}")
public ProductDto update(@PathVariable Long storeId,
                         @PathVariable Long productId,
                         @RequestParam(defaultValue = "false") boolean notify,
                         @Valid @RequestBody UpdateProductRequest body) {
    return productService.update(storeId, productId, body, notify);
}`,
      points: [
        'PathVariable: identifies the resource.',
        'RequestParam: query string options.',
        'RequestBody: JSON payload, one per method.',
      ],
      difficulty: 'Beginner',
    },
    {
      id: 'spring-rest-apis-q6',
      question: 'Why should you use DTOs instead of exposing entities in a REST API?',
      answer: "Entities represent your database model, while DTOs represent your API contract. Exposing entities couples clients to your schema, so a column rename becomes a breaking API change. Entities may also contain sensitive fields (password hashes, internal flags) that get serialised by accident.\n\nEntities with bidirectional relationships can cause infinite JSON recursion or `LazyInitializationException`, and accepting entities as input allows mass assignment, where a client sets fields like `role` or `id` they should not control. DTOs let you shape, validate and version each request and response independently.",
      points: [
        'Decouples API contract from persistence model.',
        'Prevents leaking sensitive fields and mass assignment.',
        'Avoids lazy-loading and recursion problems.',
        'Separate request and response DTOs.',
      ],
      difficulty: 'Intermediate',
    },
    {
      id: 'spring-rest-apis-q7',
      question: 'What is ResponseEntity and when would you use it?',
      answer: "`ResponseEntity<T>` represents the full HTTP response: status code, headers and body. Returning a plain object from a controller always produces `200 OK`, while `ResponseEntity` lets you set the status and headers dynamically.\n\nUse it when the status depends on the outcome (200 vs 404), for `201 Created` with a `Location` header, for `204 No Content`, or when you need custom headers such as caching or ETags. If a method always returns the same non-200 status, `@ResponseStatus` is a simpler alternative.",
      example: `@PostMapping("/api/users")
public ResponseEntity<UserDto> create(@Valid @RequestBody CreateUserRequest req) {
    UserDto user = userService.create(req);
    return ResponseEntity
            .created(URI.create("/api/users/" + user.id()))
            .body(user);
}`,
      points: [
        'Controls status, headers and body.',
        'Builder methods: ok, created, noContent, notFound, status.',
        '@ResponseStatus for fixed statuses.',
      ],
      difficulty: 'Intermediate',
    },
    {
      id: 'spring-rest-apis-q8',
      question: 'How do you implement pagination and sorting in a Spring Boot REST API?',
      answer: "Add a `Pageable` parameter to the controller method. Spring Data's web support fills it from the query parameters `page` (zero-based), `size` and `sort` (for example `sort=price,desc`), and `@PageableDefault` sets defaults. Pass it to a repository method that returns `Page<T>` or `Slice<T>`.\n\nMap entities to DTOs and return a stable page structure containing content and metadata such as total elements and total pages. Protect the database with a maximum page size, and use `Slice` (no count query) or keyset pagination (`WHERE id > :lastId ORDER BY id LIMIT n`) for very large tables where `OFFSET` gets slow.",
      example: `@GetMapping("/api/orders")
public Page<OrderDto> list(@PageableDefault(size = 20, sort = "createdAt",
                                            direction = Sort.Direction.DESC) Pageable pageable) {
    return orderRepository.findAll(pageable).map(OrderDto::from);
}`,
      points: [
        'Pageable from page, size and sort params.',
        'Page includes a count query; Slice does not.',
        'Cap page size; keyset pagination for large data.',
      ],
      difficulty: 'Intermediate',
    },
    {
      id: 'spring-rest-apis-q9',
      question: 'What are the common API versioning strategies and which would you choose?',
      answer: "The main options are URI versioning (`/api/v1/orders`), header versioning (`X-API-Version: 2`), query parameter versioning (`?version=2`) and media-type or content negotiation versioning (`Accept: application/vnd.shop.v2+json`).\n\nURI versioning is the most common choice because it is explicit, easy to route, test, cache and document. Header and media-type versioning keep URLs clean but are harder to use from a browser and less visible. Whatever you choose, prefer backward-compatible changes such as adding optional fields, so new versions are rare, and give clients a deprecation period before removing old versions.",
      points: [
        'URI, header, query param, media type.',
        'URI versioning: simplest and most visible.',
        'Minimise breaking changes; deprecate gradually.',
      ],
      difficulty: 'Intermediate',
    },
    {
      id: 'spring-rest-apis-q10',
      question: 'What is CORS and how do you configure it in Spring Boot?',
      answer: "CORS (Cross-Origin Resource Sharing) is a browser security mechanism. By default a browser blocks JavaScript from reading responses from a different origin (scheme, host or port). The server can allow specific origins by returning headers like `Access-Control-Allow-Origin`; for non-simple requests the browser first sends a preflight `OPTIONS` request.\n\nIn Spring MVC you configure it with `@CrossOrigin` on controllers or globally via `WebMvcConfigurer.addCorsMappings`. With Spring Security you must also call `http.cors(Customizer.withDefaults())`, otherwise preflight requests can be rejected by the security filter before reaching MVC. Allow specific origins rather than `*`, especially when credentials are allowed.",
      example: `@Bean
SecurityFilterChain api(HttpSecurity http) throws Exception {
    return http
            .cors(Customizer.withDefaults()) // uses the CorsConfigurationSource / MVC config
            .authorizeHttpRequests(auth -> auth.anyRequest().authenticated())
            .build();
}`,
      points: [
        'Browser-enforced same-origin policy exception mechanism.',
        'Preflight OPTIONS for non-simple requests.',
        'Configure in MVC and enable in Spring Security.',
        'Not a replacement for authentication.',
      ],
      difficulty: 'Advanced',
    },
    {
      id: 'spring-rest-apis-q11',
      question: 'What is idempotency and how do you make a POST endpoint safe to retry?',
      answer: "An operation is idempotent when performing it multiple times has the same effect as performing it once. GET, PUT and DELETE are idempotent by definition, but POST is not, so a client retrying a timed-out \"create payment\" request could create a duplicate payment.\n\nTo make POST safe, require an `Idempotency-Key` header with a unique value per logical operation. On the first request, process it and store the key together with the response (with a unique constraint on the key and an expiry). On a repeated key, return the stored response without processing again. Handle concurrent duplicates by relying on the unique constraint or a lock, and reject the same key used with a different request body.",
      points: [
        'Retries are inevitable due to timeouts and network failures.',
        'Client sends Idempotency-Key; server stores key and result.',
        'Unique constraint handles concurrent duplicates.',
        'Also detect key reuse with a different payload.',
      ],
      difficulty: 'Advanced',
    },
    {
      id: 'spring-rest-apis-q12',
      question: 'How does Spring convert a request into a controller method call and the return value into JSON?',
      answer: "Every request goes to the `DispatcherServlet`, which asks `HandlerMapping`s (mainly `RequestMappingHandlerMapping`) to find the controller method matching the path, HTTP method, and `consumes`/`produces` conditions. A `HandlerAdapter` then invokes the method, using `HandlerMethodArgumentResolver`s to build each argument: path variables, request params, headers, `Pageable`, and `@RequestBody` via an `HttpMessageConverter`.\n\nFor the return value, a `HandlerMethodReturnValueHandler` takes over. For `@ResponseBody` or `@RestController` methods, content negotiation picks a media type from the `Accept` header and the `produces` attribute, and an `HttpMessageConverter` such as `MappingJackson2HttpMessageConverter` serialises the object into JSON. Exceptions along the way go to `HandlerExceptionResolver`s, which is where `@ExceptionHandler` and `@ControllerAdvice` plug in.",
      points: [
        'DispatcherServlet is the front controller.',
        'HandlerMapping finds the method; HandlerAdapter invokes it.',
        'Argument resolvers and HttpMessageConverters handle input.',
        'Content negotiation plus Jackson converter produce JSON.',
      ],
      difficulty: 'Advanced',
    },
  ],
}

export default topic
