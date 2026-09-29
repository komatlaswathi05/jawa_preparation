const topic = {
  id: 'spring-rest-advanced',
  category: 'spring-boot',
  title: 'REST API Design in Depth',
  description: "Design APIs that last: resource modelling, evolving without breaking clients, versioning strategies, content negotiation, ETags and optimistic locking, PATCH semantics, idempotency keys, cursor pagination, async and bulk operations, HATEOAS and HTTP caching.",
  difficulty: 'Advanced',
  overview: "The REST APIs topic covers the building blocks: HTTP methods, status codes, controllers, DTOs, basic pagination, a first look at versioning and idempotency. Senior interviews go further: how do you change an API that hundreds of clients use without breaking them? How do you stop two users from overwriting each other's edits? What should happen when a mobile app retries a payment request because the network dropped?\n\nThink of an API as a published contract, like the menu and ordering rules of a restaurant chain. Adding a new dish is easy. Renaming a dish or changing its price format confuses every waiter and app that already uses the menu. Good API design is about making the common things obvious, the dangerous things safe, and change possible without surprises.\n\nThis topic covers resource modelling, backward-compatible evolution and versioning, content negotiation, conditional requests with ETags, PATCH formats, robust idempotency keys, cursor-based pagination, long-running and bulk operations, hypermedia with Spring HATEOAS, and HTTP caching. Error responses use RFC 9457 Problem Details, covered in the Exception Handling topic. Examples use an order API.",

  subtopics: [
    {
      id: 'resource-modelling',
      title: 'Resource modelling and URL design',
      explanation: "Model the API around resources (nouns), not procedures: `/orders/42`, not `/getOrder?id=42`. Use plural collection names, identify items by id, and nest only for true containment where the child cannot exist without the parent (`/orders/42/items`). Avoid deep nesting beyond one level; `/customers/7/orders/42/items/3` couples clients to a hierarchy and makes URLs fragile.\n\nSome operations do not map neatly to CRUD. Options: model the action as a state change (`PATCH /orders/42` with `{\"status\": \"CANCELLED\"}`), or as a sub-resource representing the action or its result (`POST /orders/42/cancellation`, `POST /payments/9/refunds`). Keep conventions consistent across the whole API: naming style (camelCase JSON fields), ISO-8601 dates in UTC, money as a decimal string plus a currency code, and the same pagination and error formats everywhere.",
      example: `Good                                      Avoid
----------------------------------------  -----------------------------------
GET    /api/orders?status=PAID            GET  /api/getPaidOrders
GET    /api/orders/42                     GET  /api/order?id=42
POST   /api/orders                        POST /api/createOrder
GET    /api/orders/42/items               GET  /api/customers/7/orders/42/items/3
POST   /api/orders/42/cancellation        POST /api/cancelOrder/42
POST   /api/payments/9/refunds            GET  /api/orders/42/delete

{
  "id": "42",
  "status": "PAID",
  "total": { "amount": "89.97", "currency": "EUR" },
  "createdAt": "2026-09-29T10:15:00Z"
}`,
      interviewPoints: [
        "Nouns, plural collections, ids in the path.",
        "Nest only one level for true containment.",
        "Actions as state changes or sub-resources.",
        "Consistent naming, dates, money and errors.",
      ],
    },
    {
      id: 'evolution',
      title: 'Evolving an API without breaking clients',
      explanation: "Most changes can be made without a new version if you only make backward-compatible changes: add optional request fields, add response fields, add new endpoints, add new optional query parameters, and relax validation. Breaking changes include removing or renaming fields, changing a field's type or meaning, making an optional field required, changing status codes or error formats, and adding new values to an enum that clients switch on without a default.\n\nClients should be tolerant readers: ignore unknown JSON fields (Jackson's `FAIL_ON_UNKNOWN_PROPERTIES` is disabled in Spring Boot by default) and handle unknown enum values. To remove something, use expand-and-contract: add the new field alongside the old, migrate clients, mark the old one deprecated (in OpenAPI and with the `Deprecation` and `Sunset` headers), monitor usage, and only then remove it.",
      example: `Backward compatible (no new version)       Breaking (needs a new version or migration)
------------------------------------       -------------------------------------------
+ new optional field "giftMessage"         - remove field "customerName"
+ new response field "estimatedDelivery"   ~ rename "total" to "amount"
+ new endpoint GET /orders/42/invoice      ~ change "id" from number to string
+ new optional query ?sort=createdAt       ! make "phone" required
                                           ! 200 -> 202 for an existing endpoint

# expand-and-contract for a rename: total -> amount
1. respond with both   { "total": "89.97", "amount": "89.97" }
2. announce            Deprecation: @1790812800          (RFC 9745: deprecated since 2026-10-01)
                       Sunset: Wed, 31 Mar 2027 23:59:59 GMT
                       Link: <https://docs.shop.example.com/migrations/amount>; rel="deprecation"
3. monitor usage of "total", then remove it`,
      interviewPoints: [
        "Additive changes are backward compatible.",
        "Removing, renaming or retyping fields breaks clients.",
        "Clients should ignore unknown fields.",
        "Expand-and-contract with Deprecation/Sunset headers.",
      ],
    },
    {
      id: 'versioning-strategies',
      title: 'API versioning strategies',
      explanation: "When a breaking change is unavoidable, a new version lets old clients keep working. URI versioning (`/api/v2/orders`) is the most common: visible, easy to route, cache and document, but it treats each version as a separate API. Header versioning (`X-API-Version: 2` or `API-Version`) keeps URLs stable. Media-type versioning (`Accept: application/vnd.shop.order.v2+json`) versions each representation individually and is the most RESTful, but harder to test in a browser. Query parameter versioning (`?version=2`) is simple but easy to forget.\n\nWhatever you choose, version the whole public API (not every endpoint differently), support at most two or three versions at once, publish a deprecation schedule, and implement versions as thin adapters over shared services. Spring Framework 7 (Spring Boot 4) adds built-in API versioning with a `version` attribute on mapping annotations and configurable resolution from the path, a header, a query parameter or the media type.",
      example: `// URI versioning: separate controllers, shared service
@RestController
@RequestMapping("/api/v1/orders")
class OrderControllerV1 {
    @GetMapping("/{id}") OrderV1 get(@PathVariable long id) { return OrderV1.from(service.find(id)); }
}

@RestController
@RequestMapping("/api/v2/orders")
class OrderControllerV2 {
    @GetMapping("/{id}") OrderV2 get(@PathVariable long id) { return OrderV2.from(service.find(id)); }
}

// media-type versioning in the same controller
@GetMapping(value = "/api/orders/{id}", produces = "application/vnd.shop.order.v1+json")
OrderV1 getV1(@PathVariable long id) { ... }

@GetMapping(value = "/api/orders/{id}", produces = "application/vnd.shop.order.v2+json")
OrderV2 getV2(@PathVariable long id) { ... }

// Spring Framework 7 / Boot 4
@GetMapping(path = "/api/orders/{id}", version = "2")
OrderV2 get(@PathVariable long id) { ... }
# spring.mvc.apiversion.use.header=API-Version`,
      interviewPoints: [
        "URI, header, media type or query parameter.",
        "URI versioning is simplest and most common.",
        "Few concurrent versions, published deprecation schedule.",
        "Versions as thin adapters over one service layer.",
      ],
    },
    {
      id: 'content-negotiation',
      title: 'Content negotiation and media types',
      explanation: "The client says what it sends with `Content-Type` and what it wants back with `Accept`. Spring picks an `HttpMessageConverter` that matches: Jackson for `application/json`, others for XML, CSV or custom types. Restrict what an endpoint handles with `consumes` and `produces`. If the client sends a body type the endpoint does not accept, Spring answers `415 Unsupported Media Type`; if it cannot produce any type the client accepts, `406 Not Acceptable`.\n\nContent negotiation lets one resource have several representations, for example a JSON order and a PDF invoice of the same order, or a CSV export of a collection. Vendor media types (`application/vnd.shop.order.v2+json`) carry versioning or profile information. Avoid format suffixes like `.json` in URLs; Spring disables suffix pattern matching by default.",
      example: `@GetMapping(value = "/api/orders/{id}", produces = MediaType.APPLICATION_JSON_VALUE)
public OrderDto json(@PathVariable long id) { return orderService.find(id); }

@GetMapping(value = "/api/orders/{id}", produces = MediaType.APPLICATION_PDF_VALUE)
public ResponseEntity<byte[]> pdf(@PathVariable long id) {
    return ResponseEntity.ok()
        .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=order-" + id + ".pdf")
        .body(invoiceService.render(id));
}

@PostMapping(value = "/api/orders", consumes = MediaType.APPLICATION_JSON_VALUE)
public ResponseEntity<OrderDto> create(@Valid @RequestBody CreateOrderRequest request) { ... }

# requests
GET /api/orders/42   Accept: application/pdf         -> 200, PDF invoice
GET /api/orders/42   Accept: application/xml         -> 406 Not Acceptable
POST /api/orders     Content-Type: text/plain        -> 415 Unsupported Media Type`,
      interviewPoints: [
        "Content-Type for the request body, Accept for the response.",
        "consumes / produces restrict endpoints.",
        "415 vs 406.",
        "Multiple representations of one resource.",
      ],
    },
    {
      id: 'etags',
      title: 'ETags and conditional requests',
      explanation: "An ETag is an identifier for a specific version of a resource, sent in the `ETag` response header. Clients use it in two ways.\n\nFor caching, a client sends `If-None-Match: \"<etag>\"` on a later GET; if the resource has not changed, the server returns `304 Not Modified` with no body, saving bandwidth. Spring's `ShallowEtagHeaderFilter` does this automatically by hashing the response body, which saves bandwidth but not server work. For efficiency, compute the ETag from a version or last-modified value and call `WebRequest.checkNotModified(etag)` before building the response.\n\nFor safe updates (optimistic concurrency), the client sends `If-Match: \"<etag>\"` with its PUT or PATCH; if the resource changed since it was read, the server returns `412 Precondition Failed` instead of silently overwriting another user's changes. Deriving the ETag from the JPA `@Version` field connects HTTP and database optimistic locking. Returning `428 Precondition Required` when `If-Match` is missing forces clients to use it.",
      example: `@GetMapping("/api/orders/{id}")
public ResponseEntity<OrderDto> get(@PathVariable long id, WebRequest request) {
    Order order = orderService.load(id);
    String etag = "\\"" + order.getVersion() + "\\"";
    if (request.checkNotModified(etag)) {
        return null;                          // Spring sends 304 Not Modified
    }
    return ResponseEntity.ok().eTag(etag).body(OrderDto.from(order));
}

@PutMapping("/api/orders/{id}")
public ResponseEntity<OrderDto> update(@PathVariable long id,
                                       @RequestHeader(value = HttpHeaders.IF_MATCH, required = false) String ifMatch,
                                       @Valid @RequestBody UpdateOrderRequest body) {
    if (ifMatch == null) {
        return ResponseEntity.status(HttpStatus.PRECONDITION_REQUIRED).build();      // 428
    }
    Order order = orderService.load(id);
    if (!ifMatch.equals("\\"" + order.getVersion() + "\\"")) {
        return ResponseEntity.status(HttpStatus.PRECONDITION_FAILED).build();        // 412
    }
    Order saved = orderService.update(order, body);        // @Version also guards the DB write
    return ResponseEntity.ok().eTag("\\"" + saved.getVersion() + "\\"").body(OrderDto.from(saved));
}`,
      interviewPoints: [
        "ETag identifies a resource version.",
        "If-None-Match -> 304 Not Modified for caching.",
        "If-Match -> 412 Precondition Failed prevents lost updates.",
        "Derive ETags from @Version; 428 if If-Match is missing.",
      ],
    },
    {
      id: 'patch',
      title: 'PATCH semantics: JSON Merge Patch vs JSON Patch',
      explanation: "PUT replaces the whole resource: fields missing from the body are reset. PATCH applies a partial change, but the format of that change must be defined. JSON Merge Patch (RFC 7396, `application/merge-patch+json`) sends a partial document: present fields are set, fields set to `null` are removed, absent fields are untouched. It is simple, but it cannot set a field to null explicitly and cannot change individual array elements.\n\nJSON Patch (RFC 6902, `application/json-patch+json`) sends a list of operations (`add`, `remove`, `replace`, `move`, `copy`, `test`), which is precise and can include a `test` operation as a guard, but is more complex for clients. In Java, the key difficulty with merge patch is distinguishing \"absent\" from \"null\" once JSON is bound to a DTO; bind to a `JsonNode` or `Map`, or use `Optional`/`JsonNullable` fields, then validate the resulting object before saving.",
      example: `Current resource
{ "name": "Asha", "phone": "+91 98765 43210", "newsletter": true, "tags": ["vip", "early"] }

JSON Merge Patch  (Content-Type: application/merge-patch+json)
{ "phone": null, "newsletter": false }
-> { "name": "Asha", "newsletter": false, "tags": ["vip", "early"] }     phone removed

JSON Patch        (Content-Type: application/json-patch+json)
[
  { "op": "test",    "path": "/newsletter", "value": true },
  { "op": "replace", "path": "/newsletter", "value": false },
  { "op": "remove",  "path": "/tags/1" }
]
-> { "name": "Asha", "phone": "+91 98765 43210", "newsletter": false, "tags": ["vip"] }

@PatchMapping(value = "/api/customers/{id}", consumes = "application/merge-patch+json")
public CustomerDto patch(@PathVariable long id, @RequestBody JsonNode patch) throws Exception {
    Customer current = customerService.load(id);
    JsonNode currentJson = objectMapper.valueToTree(CustomerDto.from(current));
    JsonNode merged = JsonMergePatch.fromJson(patch).apply(currentJson);   // java-json-tools json-patch
    CustomerDto updated = objectMapper.treeToValue(merged, CustomerDto.class);
    validator.validate(updated);                         // re-validate the full result
    return customerService.save(id, updated);
}`,
      interviewPoints: [
        "PUT replaces; PATCH changes part of a resource.",
        "Merge Patch: partial document, null deletes.",
        "JSON Patch: explicit operations, includes test.",
        "Distinguish absent from null; re-validate after patching.",
      ],
    },
    {
      id: 'idempotency-keys',
      title: 'Idempotency keys in depth',
      explanation: "POST is not idempotent: if a mobile app sends \"create payment\", the network drops the response, and the app retries, the customer may be charged twice. The client solves this by generating a unique `Idempotency-Key` (a UUID) per logical operation and sending it with every retry.\n\nOn the server: look up the key (scoped to the client or user). If it is new, record it as \"in progress\" atomically (a unique constraint or Redis `SET NX`), process the request, then store the status code and response body with the key. If the key exists and is completed, return the stored response without processing again. If it is still in progress, return `409 Conflict` (or wait). If the same key arrives with a different request body, reject it with `422` or `400`. Keep keys for a limited time (for example 24 hours). Store the key record in the same database transaction as the business change where possible, so the two cannot diverge.",
      example: `CREATE TABLE idempotency_keys (
  key          VARCHAR(100) NOT NULL,
  client_id    VARCHAR(100) NOT NULL,
  request_hash CHAR(64)     NOT NULL,
  status       VARCHAR(20)  NOT NULL,         -- IN_PROGRESS | COMPLETED
  http_status  INT,
  response     JSONB,
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT now(),
  PRIMARY KEY (client_id, key)
);

@PostMapping("/api/payments")
public ResponseEntity<PaymentDto> pay(@RequestHeader("Idempotency-Key") String key,
                                      @Valid @RequestBody PaymentRequest request,
                                      @AuthenticationPrincipal Jwt jwt) {
    String hash = sha256(request);
    Optional<StoredResponse> previous = idempotency.begin(jwt.getSubject(), key, hash);
    //   begin(): INSERT ... IN_PROGRESS; on duplicate key:
    //            different hash -> 422, IN_PROGRESS -> 409, COMPLETED -> stored response
    if (previous.isPresent()) {
        return previous.get().toResponseEntity(PaymentDto.class);
    }
    PaymentDto payment = paymentService.charge(request);              // runs once
    idempotency.complete(jwt.getSubject(), key, 201, payment);
    return ResponseEntity.status(HttpStatus.CREATED).body(payment);
}`,
      interviewPoints: [
        "Client sends a unique key per operation and reuses it on retry.",
        "Atomically claim the key, then store the response.",
        "Same key + different body is an error; in-progress is 409.",
        "Scope keys per client, expire them, store with the business change.",
      ],
    },
    {
      id: 'cursor-pagination',
      title: 'Cursor (keyset) pagination',
      explanation: "Offset pagination (`?page=500&size=20`, SQL `OFFSET 10000`) is simple but gets slower as the offset grows, because the database still reads and discards all skipped rows. It is also unstable: if rows are inserted or deleted while a client pages, items are skipped or shown twice.\n\nCursor (keyset) pagination remembers where the last page ended, using the sort key of the last item, and asks for items after it: `WHERE (created_at, id) < (:lastCreatedAt, :lastId) ORDER BY created_at DESC, id DESC LIMIT 20`. With a matching index this is fast at any depth and stable under inserts. The server returns an opaque cursor (for example Base64-encoded JSON) and a `next` link. The trade-off is that clients cannot jump to page 500 directly. Spring Data 3.1+ supports this with `ScrollPosition.keyset()` and `Window<T>`.",
      example: `-- offset: reads and throws away 100,000 rows
SELECT * FROM orders ORDER BY created_at DESC, id DESC OFFSET 100000 LIMIT 20;

-- keyset: seeks directly using the index on (created_at DESC, id DESC)
SELECT * FROM orders
WHERE (created_at, id) < ('2026-09-01T10:00:00Z', 81234)
ORDER BY created_at DESC, id DESC
LIMIT 20;

// Spring Data 3.1+
Window<Order> findFirst20ByCustomerIdOrderByCreatedAtDescIdDesc(Long customerId, ScrollPosition position);

Window<Order> page = repo.findFirst20ByCustomerIdOrderByCreatedAtDescIdDesc(7L, ScrollPosition.keyset());
if (page.hasNext()) {
    ScrollPosition next = page.positionAt(page.size() - 1);   // encode as an opaque cursor
}

// response
{
  "items": [ ... 20 orders ... ],
  "next": "/api/orders?cursor=eyJjcmVhdGVkQXQiOiIyMDI2LTA5LTAxVDEwOjAwOjAwWiIsImlkIjo4MTIzNH0"
}`,
      interviewPoints: [
        "Offset gets slow and unstable at depth.",
        "Keyset: continue after the last seen sort key.",
        "Needs a unique, indexed sort order (add id as tie-breaker).",
        "Opaque cursors; no random page access.",
      ],
    },
    {
      id: 'async-operations',
      title: 'Long-running operations: 202 Accepted',
      explanation: "Some requests take too long to complete within an HTTP timeout: generating a large report, importing a file, or a process involving other systems. Instead of keeping the connection open, accept the request, return `202 Accepted` immediately with a `Location` header pointing to a status resource, and process it in the background (a queue, `@Async`, a batch job).\n\nThe client polls the status resource, which reports `PENDING`, `RUNNING`, `SUCCEEDED` or `FAILED`, and on success links to the result. Alternatives to polling are webhooks (the server calls the client back) or Server-Sent Events. Combine with idempotency keys so a retried submission does not start the work twice.",
      example: `POST /api/reports   { "type": "SALES", "month": "2026-09" }
-> 202 Accepted
   Location: /api/report-jobs/7f3c
   { "id": "7f3c", "status": "PENDING" }

GET /api/report-jobs/7f3c
-> 200 { "id": "7f3c", "status": "RUNNING", "progress": 40 }

GET /api/report-jobs/7f3c
-> 200 { "id": "7f3c", "status": "SUCCEEDED", "result": "/api/reports/7f3c.csv" }

@PostMapping("/api/reports")
public ResponseEntity<JobDto> request(@Valid @RequestBody ReportRequest request) {
    ReportJob job = reportJobs.create(request);        // status PENDING
    reportWorker.runAsync(job.getId());                 // @Async or publish to a queue
    return ResponseEntity.accepted()
        .location(URI.create("/api/report-jobs/" + job.getId()))
        .body(JobDto.from(job));
}`,
      interviewPoints: [
        "Return 202 with a Location for the job status.",
        "Process in the background.",
        "Client polls, or use webhooks/SSE.",
        "Idempotency keys for submissions.",
      ],
    },
    {
      id: 'bulk-operations',
      title: 'Bulk and batch operations',
      explanation: "Clients sometimes need to create or update many items at once, for example importing 500 products. One request per item is slow; one bulk endpoint is faster but raises questions: is the batch all-or-nothing (atomic) or can some items fail? Atomic batches are simpler to reason about and fit a single database transaction. Partial success is more practical for large imports: process each item independently and return a per-item result.\n\nFor partial results, respond with `200 OK` (or `207 Multi-Status` from WebDAV) and a body listing each item's status and errors, keyed by the client's index or reference. Limit the batch size, validate it up front, and use asynchronous processing with 202 for very large batches.",
      example: `POST /api/products/batch
[
  { "ref": "a", "sku": "KB-01", "name": "Keyboard", "price": "49.99" },
  { "ref": "b", "sku": "",      "name": "Mouse",    "price": "19.99" },
  { "ref": "c", "sku": "HS-03", "name": "Headset",  "price": "-5" }
]

-> 207 Multi-Status
{
  "succeeded": 1,
  "failed": 2,
  "results": [
    { "ref": "a", "status": 201, "id": 901 },
    { "ref": "b", "status": 422, "errors": [ { "field": "sku", "message": "must not be blank" } ] },
    { "ref": "c", "status": 422, "errors": [ { "field": "price", "message": "must be positive" } ] }
  ]
}`,
      interviewPoints: [
        "Decide atomic vs partial success explicitly.",
        "Per-item results keyed by client reference.",
        "200/207 with details for partial success.",
        "Limit size; go async for large batches.",
      ],
    },
    {
      id: 'hateoas',
      title: 'HATEOAS and Spring HATEOAS',
      explanation: "HATEOAS (Hypermedia As The Engine Of Application State) means responses include links to related resources and to the actions currently possible. A client does not build URLs or re-implement business rules: if an order can be cancelled, the response contains a `cancel` link; if not, the link is absent. This is the highest level of the Richardson Maturity Model (level 3).\n\nSpring HATEOAS provides `EntityModel`, `CollectionModel` and `PagedModel` and builds links from controller methods with `linkTo(methodOn(...))`, rendering them in the HAL format (`_links`). In practice, most public APIs stop at level 2 (resources plus HTTP verbs), but links are genuinely useful for pagination, discoverability and state-dependent actions.",
      example: `@GetMapping("/api/orders/{id}")
public EntityModel<OrderDto> get(@PathVariable long id) {
    OrderDto order = orderService.find(id);
    EntityModel<OrderDto> model = EntityModel.of(order,
        linkTo(methodOn(OrderController.class).get(id)).withSelfRel(),
        linkTo(methodOn(OrderController.class).items(id)).withRel("items"));
    if (order.status() == Status.PAID) {
        model.add(linkTo(methodOn(OrderController.class).cancel(id)).withRel("cancel"));
    }
    return model;
}

// HAL response
{
  "id": 42,
  "status": "PAID",
  "_links": {
    "self":   { "href": "https://api.shop.example.com/api/orders/42" },
    "items":  { "href": "https://api.shop.example.com/api/orders/42/items" },
    "cancel": { "href": "https://api.shop.example.com/api/orders/42/cancellation" }
  }
}`,
      interviewPoints: [
        "Responses include links to related resources and allowed actions.",
        "Richardson level 3.",
        "Spring HATEOAS: EntityModel, linkTo(methodOn(...)), HAL.",
        "Most APIs stop at level 2; links still help pagination and actions.",
      ],
    },
    {
      id: 'http-caching',
      title: 'HTTP caching headers',
      explanation: "HTTP caching lets browsers, CDNs and proxies reuse responses without calling your server. `Cache-Control` controls it: `max-age=60` allows reuse for 60 seconds; `public` allows shared caches such as CDNs, `private` only the user's browser; `no-cache` means the cache must revalidate with the server (using ETag or Last-Modified) before reuse; `no-store` forbids storing at all, which is right for sensitive data. `stale-while-revalidate` lets caches serve a slightly stale response while refreshing in the background.\n\nUse long caching for immutable, versioned static assets, short public caching for public catalogue data, and `private, no-store` for personal data. Spring Security adds `no-cache, no-store` headers to responses by default, so you must set caching explicitly on endpoints that should be cacheable. `Vary: Accept, Accept-Language` tells caches which request headers change the response.",
      example: `// public product data: CDN may cache for 5 minutes
@GetMapping("/api/products/{id}")
public ResponseEntity<ProductDto> product(@PathVariable long id) {
    return ResponseEntity.ok()
        .cacheControl(CacheControl.maxAge(Duration.ofMinutes(5)).cachePublic()
                                  .staleWhileRevalidate(Duration.ofMinutes(1)))
        .eTag("\\"" + productService.version(id) + "\\"")
        .body(productService.find(id));
}

// personal data: never store
@GetMapping("/api/me/orders")
public ResponseEntity<List<OrderDto>> myOrders(@AuthenticationPrincipal Jwt jwt) {
    return ResponseEntity.ok()
        .cacheControl(CacheControl.noStore())
        .body(orderService.forCustomer(jwt.getSubject()));
}

# versioned static assets
Cache-Control: public, max-age=31536000, immutable`,
      interviewPoints: [
        "Cache-Control: max-age, public/private, no-cache, no-store.",
        "Revalidation with ETag / Last-Modified.",
        "Long caching only for immutable, versioned assets.",
        "Spring Security disables caching by default.",
      ],
    },
  ],

  commonMistakes: [
    "Using verbs in URLs (/createOrder, /getOrders) instead of resources and HTTP methods.",
    "Nesting URLs several levels deep, coupling clients to a hierarchy.",
    "Renaming or removing fields without a deprecation period or new version.",
    "Clients failing on unknown JSON fields or unknown enum values.",
    "Mixing versioning strategies across endpoints, or supporting too many versions at once.",
    "Accepting updates without If-Match, so concurrent edits silently overwrite each other.",
    "Implementing PATCH by binding to a DTO and treating missing fields as null, wiping data.",
    "Relying on client-side retries for POST without idempotency keys, causing double charges.",
    "Using deep OFFSET pagination on large tables, which is slow and skips or repeats items.",
    "Keeping HTTP connections open for minutes instead of returning 202 with a status resource.",
    "Bulk endpoints with unclear semantics: callers cannot tell which items failed.",
    "Marking personal data responses as publicly cacheable, or never caching public static data.",
  ],

  interviewTips: [
    "Frame API design as a long-lived contract: consistency, evolvability and safety.",
    "Give concrete examples of backward-compatible vs breaking changes.",
    "Compare versioning strategies and state which you would choose and why (URI for public APIs is a fine answer).",
    "Explain lost updates and show If-Match / 412 with ETags derived from @Version.",
    "Walk through idempotency-key handling step by step, including concurrent duplicates.",
    "Mention cursor pagination whenever large collections or infinite scroll come up.",
  ],

  interviewQuestions: [
    {
      id: 'spring-rest-advanced-q1',
      question: "How do you evolve a REST API without breaking existing clients?",
      answer: "Prefer backward-compatible, additive changes: new optional request fields, new response fields, new endpoints and new optional parameters. Avoid removing or renaming fields, changing types or meanings, making optional fields required, or changing status codes. Clients should be tolerant readers that ignore unknown fields and handle unknown enum values. When a breaking change is necessary, use expand-and-contract: introduce the new field or endpoint alongside the old one, migrate clients, mark the old one deprecated in the OpenAPI specification and with Deprecation and Sunset headers, monitor its usage, and remove it only when usage has stopped. For larger breaking changes, release a new API version and support the old one for a published period. Contract tests with consumers catch accidental breaking changes before release.",
      points: [
        "Additive changes are safe.",
        "Tolerant readers.",
        "Expand-and-contract with deprecation headers.",
        "New version for big breaks; contract tests.",
      ],
      difficulty: 'Intermediate',
    },
    {
      id: 'spring-rest-advanced-q2',
      question: "Compare the different API versioning strategies.",
      answer: "URI versioning, such as /api/v2/orders, is explicit, easy to route in gateways, easy to cache and to try in a browser, and is the most widely used; its downside is that the version is part of the resource identifier, so each version looks like a different API. Header versioning with a custom header like API-Version keeps URLs clean but is less visible and needs care with caching (Vary). Media-type versioning, such as Accept: application/vnd.shop.order.v2+json, versions representations individually and is considered the most RESTful, but it is harder to use and test. Query parameter versioning is simple but easy to omit and mixes with filters. The choice matters less than consistency: pick one strategy for the whole API, support few versions at a time, and publish deprecation timelines. Spring Framework 7 adds first-class support for resolving versions from any of these sources.",
      points: [
        "URI: simple, visible, common.",
        "Header: clean URLs, less visible.",
        "Media type: most RESTful, most complex.",
        "Consistency and few versions matter most.",
      ],
      difficulty: 'Intermediate',
    },
    {
      id: 'spring-rest-advanced-q3',
      question: "What is an ETag and how can it prevent lost updates?",
      answer: "An ETag is an opaque identifier of a particular version of a resource, returned in the ETag response header. For caching, the client sends it back in If-None-Match, and the server replies 304 Not Modified if the resource is unchanged. For concurrency control, the client sends the ETag it last read in an If-Match header with its PUT or PATCH. The server compares it with the current version: if they differ, someone else changed the resource in the meantime, and the server responds 412 Precondition Failed instead of overwriting their changes. The client must reload and reapply its change. In Spring, deriving the ETag from the JPA @Version field connects this HTTP-level check to database optimistic locking, which still guards against races between the check and the write. Returning 428 Precondition Required when If-Match is missing enforces the pattern.",
      points: [
        "ETag = resource version identifier.",
        "If-None-Match -> 304 for caching.",
        "If-Match -> 412 prevents lost updates.",
        "Derive from @Version; 428 if missing.",
      ],
      difficulty: 'Intermediate',
    },
    {
      id: 'spring-rest-advanced-q4',
      question: "What is the difference between PUT and PATCH, and between JSON Merge Patch and JSON Patch?",
      answer: "PUT replaces the entire resource with the representation in the request; it is idempotent, and fields not included are reset or removed. PATCH applies a partial modification described in a patch document, and its semantics depend on the patch format. JSON Merge Patch (RFC 7396) sends a partial JSON document: included fields are set, fields set to null are removed, and absent fields are unchanged. It is easy to use but cannot set a value to null explicitly and replaces arrays as a whole. JSON Patch (RFC 6902) sends an array of operations such as add, remove, replace, move, copy and test with JSON Pointer paths; it is precise, can modify array elements and can include test operations as preconditions, but is more complex for clients. When implementing merge patch in Spring, bind to JsonNode or use wrappers such as JsonNullable to distinguish absent from null, apply the patch to the current representation, and validate the result before saving.",
      points: [
        "PUT replaces; PATCH modifies part.",
        "Merge Patch: partial document, null deletes.",
        "JSON Patch: operations with paths and test.",
        "Absent vs null; validate after applying.",
      ],
      difficulty: 'Intermediate',
    },
    {
      id: 'spring-rest-advanced-q5',
      question: "How would you implement idempotency keys for a payment endpoint?",
      answer: "The client generates a unique Idempotency-Key, such as a UUID, for each logical payment and sends it with the POST and any retries. The server scopes keys to the client or user and stores them in a table with a unique constraint on client and key, plus a hash of the request body, a status, and later the response status and body. When a request arrives, the server tries to insert the key as IN_PROGRESS. If the insert succeeds, it processes the payment, then stores the response and marks the key COMPLETED, ideally in the same transaction as the payment record. If the key already exists with a COMPLETED status and the same request hash, it returns the stored response without charging again; if it is IN_PROGRESS, it returns 409 Conflict so the client retries later; if the hash differs, it rejects the request with 422 because the key was reused for a different operation. Keys expire after a retention period such as 24 hours. The payment provider call itself should also receive an idempotency key where supported.",
      points: [
        "Client-generated key reused on retries.",
        "Atomic claim with unique constraint.",
        "Return stored response; 409 in progress; 422 on mismatch.",
        "Scope per client, expire, same transaction.",
      ],
      difficulty: 'Advanced',
    },
    {
      id: 'spring-rest-advanced-q6',
      question: "What is cursor-based pagination and when is it better than offset pagination?",
      answer: "Offset pagination uses page and size, translated to SQL LIMIT and OFFSET. The database must still read and discard all skipped rows, so deep pages become slow, and if rows are inserted or deleted between requests, clients see duplicates or miss items. Cursor-based (keyset) pagination instead remembers the sort key of the last item returned and asks for the next items after it, such as WHERE (created_at, id) < (last_created_at, last_id) ORDER BY created_at DESC, id DESC LIMIT 20. With an index matching the sort order, each page is a fast index seek regardless of depth, and results are stable under concurrent inserts. The server returns an opaque cursor encoding the position and a next link. It is better for large or frequently changing collections, feeds and infinite scrolling; its downside is that clients cannot jump to an arbitrary page or easily show total page counts. Spring Data supports it with ScrollPosition.keyset() and Window.",
      points: [
        "Offset: slow at depth and unstable.",
        "Keyset: seek after the last sort key.",
        "Unique indexed sort with a tie-breaker.",
        "No random page access; Spring Data Window.",
      ],
      difficulty: 'Intermediate',
    },
    {
      id: 'spring-rest-advanced-q7',
      question: "How do you design an endpoint for a task that takes several minutes?",
      answer: "Do not hold the HTTP request open, since gateways, load balancers and clients time out. Accept the request, validate it, create a job record with status PENDING, and hand the work to a background mechanism such as a message queue, an @Async executor or a batch job. Respond immediately with 202 Accepted, a Location header pointing to a job status resource, and optionally the job representation. The client polls GET /jobs/{id}, which returns the status (PENDING, RUNNING, SUCCEEDED, FAILED), progress and, when finished, a link to the result or error details; a Retry-After header can suggest a polling interval. Alternatively, notify the client with a webhook or Server-Sent Events. Use an idempotency key on submission so retries do not create duplicate jobs, and make the job itself resumable or safely retryable.",
      points: [
        "202 Accepted with Location.",
        "Background processing with a job record.",
        "Polling, webhooks or SSE.",
        "Idempotent submission.",
      ],
      difficulty: 'Intermediate',
    },
    {
      id: 'spring-rest-advanced-q8',
      question: "What is HATEOAS? Would you use it?",
      answer: "HATEOAS, Hypermedia As The Engine Of Application State, is the REST constraint that responses contain links describing related resources and the state transitions currently available, so clients navigate the API by following links rather than constructing URLs and duplicating business rules. For example, an order in status PAID includes a cancel link, while a shipped order does not. It corresponds to level 3 of the Richardson Maturity Model. Spring HATEOAS supports it with EntityModel, CollectionModel and PagedModel, builds links from controller methods with linkTo(methodOn(...)) and renders HAL. In practice many APIs, especially those consumed by a known front end, stop at level 2 because clients are generated from OpenAPI specs and rarely follow links dynamically. Using links selectively for pagination, related resources and state-dependent actions still adds value without the full overhead.",
      points: [
        "Links to related resources and allowed actions.",
        "Richardson level 3.",
        "Spring HATEOAS and HAL.",
        "Pragmatic: use links where they add value.",
      ],
      difficulty: 'Intermediate',
    },
    {
      id: 'spring-rest-advanced-q9',
      question: "How would you design an endpoint that imports hundreds of products at once?",
      answer: "First decide the semantics. If the batch must be all-or-nothing, validate everything up front and process it in one transaction, returning 201 on success or a 422 with all validation errors. For large imports, partial success is usually more useful: process items independently and return a per-item result, keyed by an index or a client-supplied reference, with each item's status, the created id or its errors, plus summary counts, using 200 or 207 Multi-Status. Limit the batch size, for example to 500 items, and reject larger payloads with 413. For very large imports or file uploads, accept the job with 202 and a status resource, process it asynchronously in chunks, and report progress and errors there. Make the import idempotent, using an idempotency key or natural keys such as SKU with upsert semantics, so a retried batch does not create duplicates.",
      points: [
        "Atomic vs partial success decided explicitly.",
        "Per-item results with references.",
        "Size limits; async for big imports.",
        "Idempotent via keys or upserts.",
      ],
      difficulty: 'Advanced',
    },
  ],
}

export default topic
