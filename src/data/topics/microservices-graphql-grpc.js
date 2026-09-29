const topic = {
  id: 'microservices-graphql-grpc',
  category: 'microservices',
  title: 'GraphQL & gRPC',
  description: "Two alternatives to REST: GraphQL with Spring for GraphQL (schemas, queries, mutations, @SchemaMapping, the N+1 problem and @BatchMapping, errors, security, testing) and gRPC with Protocol Buffers (service definitions, streaming, schema evolution, deadlines, load balancing).",
  difficulty: 'Advanced',
  overview: "REST is the default for HTTP APIs, but it is not the only option. GraphQL lets clients ask for exactly the data they need in one request, which suits front ends that show data from many resources on one screen. gRPC uses compact binary messages over HTTP/2 with generated clients, which suits fast, strongly typed communication between internal services.\n\nThink of ordering food. REST is a set menu per counter: you visit the burger counter, then the drinks counter, and each gives you a fixed tray whether you want everything on it or not. GraphQL is a waiter who takes one custom order (\"burger without the pickles, a small drink, and the dessert menu\") and brings exactly that. gRPC is the kitchen's internal intercom: short, coded messages between staff who share the same vocabulary, very fast but not meant for guests.\n\nThis topic explains how each works, how to build them with Spring, their typical pitfalls (the N+1 problem in GraphQL, load balancing and schema evolution in gRPC), and how to choose between REST, GraphQL and gRPC. Examples use an order system with `Order`, `Customer` and `Stock` types.",

  subtopics: [
    {
      id: 'comparison',
      title: 'REST vs GraphQL vs gRPC',
      explanation: "REST exposes many resource URLs with standard HTTP methods and usually JSON. It is simple, cacheable with plain HTTP caching, works everywhere and is easy to debug with curl. Its weaknesses are over-fetching (endpoints return more than a screen needs) and under-fetching (a screen needs several round trips).\n\nGraphQL exposes one endpoint and a typed schema; each client query selects exactly the fields it needs, across related types, in one round trip. It shines for flexible front ends and aggregating several back ends, but HTTP caching, rate limiting and query cost control are harder. gRPC defines services and messages in Protocol Buffers, generates client and server code in many languages, and sends compact binary messages over HTTP/2 with streaming in both directions. It is fast and strongly typed, ideal for internal service-to-service calls, but browsers need gRPC-Web and messages are not human-readable.",
      example: `                 REST                     GraphQL                    gRPC
Transport        HTTP/1.1 or 2            HTTP (usually POST)        HTTP/2
Format           JSON (text)              JSON (text)                Protocol Buffers (binary)
Contract         OpenAPI (optional)       schema (required, SDL)     .proto (required)
Endpoints        many resource URLs       one (/graphql)             service methods
Data shape       server decides           client selects fields      fixed messages
Streaming        SSE / WebSocket          subscriptions              native, bidirectional
HTTP caching     easy                     hard                       not applicable
Best for         public APIs, CRUD        flexible front ends, BFF   internal low-latency calls`,
      interviewPoints: [
        "REST: simple, cacheable, universal.",
        "GraphQL: client-selected fields, one round trip.",
        "gRPC: binary, HTTP/2, generated code, streaming.",
        "Choose per use case; they can coexist.",
      ],
    },
    {
      id: 'graphql-basics',
      title: 'GraphQL schema, queries and mutations',
      explanation: "A GraphQL API is described by a schema written in SDL (Schema Definition Language). Object types have fields with types; `!` means non-null; `[Order!]!` is a non-null list of non-null orders. The special root types are `Query` for reads, `Mutation` for writes, and `Subscription` for real-time streams. Input types describe structured arguments.\n\nA client sends a query document selecting fields, possibly nested through relationships, and gets back JSON with exactly that shape. All requests usually go to a single endpoint as POST. The response has a `data` field and, if something went wrong, an `errors` array; partial data with errors is possible. Introspection lets tools such as GraphiQL discover the schema and offer autocompletion.",
      example: `# schema: src/main/resources/graphql/schema.graphqls
type Query {
  orderById(id: ID!): Order
  orders(status: OrderStatus, first: Int = 20): [Order!]!
}

type Mutation {
  placeOrder(input: PlaceOrderInput!): Order!
}

type Order {
  id: ID!
  status: OrderStatus!
  total: Float!
  customer: Customer!
  items: [OrderItem!]!
}

type Customer { id: ID!  name: String!  email: String! }
type OrderItem { sku: String!  quantity: Int!  price: Float! }
enum OrderStatus { NEW PAID SHIPPED CANCELLED }
input PlaceOrderInput { customerId: ID!  items: [ItemInput!]! }
input ItemInput { sku: String!  quantity: Int! }

# client query: exactly the fields this screen needs
query {
  orderById(id: "42") {
    status
    total
    customer { name }
  }
}

# response
{ "data": { "orderById": { "status": "PAID", "total": 89.97, "customer": { "name": "Asha" } } } }`,
      interviewPoints: [
        "Schema in SDL with types, non-null and lists.",
        "Query, Mutation, Subscription root types.",
        "Client selects fields; response mirrors the query.",
        "One endpoint; data plus errors in the response.",
      ],
    },
    {
      id: 'spring-graphql',
      title: 'Spring for GraphQL: @QueryMapping and @MutationMapping',
      explanation: "Add `spring-boot-starter-graphql` (plus `spring-boot-starter-web` or `-webflux`) and put schema files in `src/main/resources/graphql`. Spring Boot exposes the API at `/graphql` and can enable the GraphiQL UI with `spring.graphql.graphiql.enabled=true`.\n\nHandlers are methods in `@Controller` classes. `@QueryMapping` binds a method to a field of the `Query` type with the same name, `@MutationMapping` to a field of `Mutation`, and `@SubscriptionMapping` to `Subscription` (returning a Flux). `@Argument` binds GraphQL arguments, including input types mapped to records. Methods can return plain objects, `Optional`, `CompletableFuture` or Reactor types. Spring Security works as usual, including `@PreAuthorize` on handler methods.",
      example: `@Controller
public class OrderGraphQlController {

    private final OrderService orderService;

    public OrderGraphQlController(OrderService orderService) {
        this.orderService = orderService;
    }

    @QueryMapping
    public Order orderById(@Argument Long id) {
        return orderService.find(id).orElse(null);           // null -> "orderById": null
    }

    @QueryMapping
    public List<Order> orders(@Argument OrderStatus status, @Argument int first) {
        return orderService.search(status, first);
    }

    @MutationMapping
    @PreAuthorize("hasRole('CUSTOMER')")
    public Order placeOrder(@Argument PlaceOrderInput input) {
        return orderService.place(input);
    }
}

public record PlaceOrderInput(Long customerId, List<ItemInput> items) {}
public record ItemInput(String sku, int quantity) {}

# application.yml
spring:
  graphql:
    graphiql:
      enabled: true          # UI at /graphiql, for development`,
      interviewPoints: [
        "Schema files in resources/graphql; endpoint /graphql.",
        "@QueryMapping / @MutationMapping / @SubscriptionMapping.",
        "@Argument binds arguments and input types.",
        "Security annotations work on handlers.",
      ],
    },
    {
      id: 'schema-mapping',
      title: '@SchemaMapping and field resolvers',
      explanation: "By default, GraphQL resolves a field by reading the property with the same name from the parent object, so `status` on `Order` comes from `order.getStatus()` or the record component. For fields that are not simple properties, such as `Order.customer` when the entity only stores `customerId`, write a field resolver with `@SchemaMapping(typeName = \"Order\", field = \"customer\")`. The method receives the parent object (the source) and returns the field's value.\n\nField resolvers only run when the client selects that field, which is the core efficiency idea of GraphQL: a query that does not ask for the customer never loads it. The catch is that they run once per parent object, which leads to the N+1 problem.",
      example: `@Controller
public class OrderFieldsController {

    private final CustomerClient customerClient;

    public OrderFieldsController(CustomerClient customerClient) {
        this.customerClient = customerClient;
    }

    // resolves Order.customer only when the query selects it
    @SchemaMapping(typeName = "Order", field = "customer")
    public Customer customer(Order order) {
        return customerClient.get(order.customerId());       // one call per order!
    }
}

# this query triggers the resolver for each of the 50 orders -> 50 customer calls
query { orders(first: 50) { id customer { name } } }`,
      interviewPoints: [
        "Fields default to same-named properties.",
        "@SchemaMapping for computed or related fields.",
        "Resolvers run only when the field is selected.",
        "Runs per parent object: watch for N+1.",
      ],
    },
    {
      id: 'n-plus-one',
      title: 'The N+1 problem and @BatchMapping',
      explanation: "When a query returns N orders and selects `customer`, a per-object field resolver makes N separate calls to load customers, plus the one query for the orders: N+1 calls, often to the same few customers. With nested lists, this multiplies quickly and can overload databases and downstream services.\n\nThe solution is batching with a DataLoader: the resolvers for all N orders register the keys they need, and one batch function loads them all at once. Spring for GraphQL makes this simple with `@BatchMapping`: the method receives the list of parent objects and returns a `Map` from parent to value (or a list in the same order). Spring registers a DataLoader behind the scenes, so the example below makes one call for all distinct customers. DataLoaders also cache within a single request, so the same customer is loaded only once.",
      example: `@Controller
public class OrderFieldsController {

    private final CustomerClient customerClient;

    public OrderFieldsController(CustomerClient customerClient) {
        this.customerClient = customerClient;
    }

    // replaces the per-order @SchemaMapping: one batched call for all orders in the response
    @BatchMapping
    public Map<Order, Customer> customer(List<Order> orders) {
        Set<Long> ids = orders.stream().map(Order::customerId).collect(Collectors.toSet());
        Map<Long, Customer> byId = customerClient.getAll(ids).stream()
            .collect(Collectors.toMap(Customer::id, c -> c));
        return orders.stream().collect(Collectors.toMap(o -> o, o -> byId.get(o.customerId())));
    }
}

# before: 1 query for orders + 50 customer calls
# after:  1 query for orders + 1 batched customer call`,
      interviewPoints: [
        "Per-parent resolvers cause N+1 calls.",
        "DataLoader batches and caches keys per request.",
        "@BatchMapping: list of parents in, map of results out.",
        "Field name and type inferred from the method.",
      ],
    },
    {
      id: 'graphql-errors',
      title: 'Errors in GraphQL',
      explanation: "GraphQL usually returns HTTP 200 even when parts of a query fail. Errors are reported in an `errors` array with a message, a `path` showing which field failed, and optional `extensions` such as a classification. Other fields can still return data, so clients must always check `errors`. A failed nullable field becomes null; a failed non-null field makes its nearest nullable parent null.\n\nBy default, Spring for GraphQL turns unhandled exceptions into a generic `INTERNAL_ERROR` without leaking details. Map your own exceptions to meaningful classifications by implementing `DataFetcherExceptionResolverAdapter`, for example `OrderNotFoundException` to `NOT_FOUND` and access-denied to `FORBIDDEN`. Validation errors on the query itself (unknown fields, wrong types) are rejected before execution.",
      example: `@Component
public class GraphQlExceptionResolver extends DataFetcherExceptionResolverAdapter {

    @Override
    protected GraphQLError resolveToSingleError(Throwable ex, DataFetchingEnvironment env) {
        if (ex instanceof OrderNotFoundException) {
            return GraphqlErrorBuilder.newError(env)
                .errorType(ErrorType.NOT_FOUND)
                .message(ex.getMessage())
                .build();
        }
        return null;      // let other resolvers / the default handle it
    }
}

# response with partial data
{
  "data": { "orderById": null, "orders": [ { "id": "7" } ] },
  "errors": [
    {
      "message": "Order 42 not found",
      "path": ["orderById"],
      "extensions": { "classification": "NOT_FOUND" }
    }
  ]
}`,
      interviewPoints: [
        "HTTP 200 with an errors array; partial data possible.",
        "path shows which field failed.",
        "Default hides internal details.",
        "DataFetcherExceptionResolverAdapter maps exceptions.",
      ],
    },
    {
      id: 'graphql-security-performance',
      title: 'GraphQL security, cost control and caching',
      explanation: "Because clients write the queries, a single request can be very expensive: deeply nested relationships (`orders { customer { orders { customer ... } } }`), huge lists, or many aliases of the same field. Protect the server with a maximum query depth and complexity (graphql-java's `MaxQueryDepthInstrumentation` and `MaxQueryComplexityInstrumentation`, registered as beans), pagination limits on list fields, timeouts, and rate limiting based on query cost rather than request count.\n\nAuthorization must be enforced per field or per resolver, not just at the endpoint, because one endpoint serves everything. Consider disabling introspection and GraphiQL in production for private APIs, and use persisted queries (an allow-list of known query documents identified by a hash) for first-party clients, which also enables GET requests and HTTP caching. Since plain HTTP caching does not work well with POST bodies, caching usually happens in the client (Apollo, Relay) or with DataLoaders and application caches on the server.",
      example: `@Configuration
public class GraphQlLimits {

    @Bean
    Instrumentation maxDepth() {
        return new MaxQueryDepthInstrumentation(8);
    }

    @Bean
    Instrumentation maxComplexity() {
        return new MaxQueryComplexityInstrumentation(200);
    }
}

# dangerous query without limits
query {
  orders(first: 1000) {
    customer { orders(first: 1000) { customer { orders(first: 1000) { id } } } }
  }
}

# production settings
spring:
  graphql:
    graphiql:
      enabled: false
    schema:
      introspection:
        enabled: false        # for private APIs`,
      interviewPoints: [
        "Clients control cost: limit depth and complexity.",
        "Paginate lists; cost-based rate limiting.",
        "Authorize per field/resolver.",
        "Persisted queries; client-side or DataLoader caching.",
      ],
    },
    {
      id: 'graphql-testing',
      title: 'Testing GraphQL with GraphQlTester',
      explanation: "`@GraphQlTest` is a test slice that loads the GraphQL infrastructure and the specified controllers, similar to `@WebMvcTest`. Inject `GraphQlTester`, send a query document, and assert on values by path. Dependencies such as services are mocked with `@MockitoBean`.\n\nFor end-to-end tests over HTTP, use `@SpringBootTest` with `HttpGraphQlTester` (built on WebTestClient). Query documents can be kept in `src/test/resources/graphql-test` and referenced by name with `documentName(...)`, which keeps tests readable.",
      example: `@GraphQlTest(OrderGraphQlController.class)
class OrderGraphQlControllerTest {

    @Autowired GraphQlTester graphQlTester;
    @MockitoBean OrderService orderService;

    @Test
    void returnsOrderStatus() {
        when(orderService.find(42L)).thenReturn(Optional.of(new Order(42L, OrderStatus.PAID, 89.97, 7L)));

        graphQlTester.document("""
                { orderById(id: 42) { id status } }
                """)
            .execute()
            .path("orderById.status").entity(String.class).isEqualTo("PAID");
    }

    @Test
    void returnsNullForUnknownOrder() {
        when(orderService.find(99L)).thenReturn(Optional.empty());

        graphQlTester.document("{ orderById(id: 99) { id } }")
            .execute()
            .path("orderById").valueIsNull();
    }
}`,
      interviewPoints: [
        "@GraphQlTest slice with GraphQlTester.",
        "Assert by path on the response.",
        "HttpGraphQlTester for full HTTP tests.",
        "Keep query documents in test resources.",
      ],
    },
    {
      id: 'grpc-basics',
      title: 'gRPC and Protocol Buffers',
      explanation: "In gRPC you define services and messages in a `.proto` file using Protocol Buffers (protobuf). The protobuf compiler generates message classes, a server base class and client stubs for Java (and for Go, Python, C# and others), so every service speaks exactly the same contract with type-checked code.\n\nMessages are encoded in a compact binary format that is much smaller and faster to parse than JSON. Calls run over HTTP/2, which multiplexes many concurrent calls over one connection and supports four call types: unary (one request, one response), server streaming, client streaming, and bidirectional streaming. Each field has a number (tag) that identifies it on the wire; names are not sent.",
      example: `// src/main/proto/inventory.proto
syntax = "proto3";

package shop.inventory.v1;

option java_multiple_files = true;
option java_package = "com.shop.inventory.grpc";

service InventoryService {
  rpc GetStock (GetStockRequest) returns (Stock);                    // unary
  rpc WatchStock (WatchStockRequest) returns (stream Stock);         // server streaming
  rpc ReserveItems (stream ReserveRequest) returns (ReserveSummary); // client streaming
}

message GetStockRequest   { string sku = 1; }
message WatchStockRequest { repeated string skus = 1; }
message Stock             { string sku = 1; int32 available = 2; }
message ReserveRequest    { string sku = 1; int32 quantity = 2; }
message ReserveSummary    { int32 reserved = 1; repeated string failed_skus = 2; }`,
      interviewPoints: [
        "Contract in .proto; code generated for many languages.",
        "Binary protobuf: small and fast.",
        "HTTP/2 multiplexing.",
        "Unary, server, client and bidirectional streaming.",
      ],
    },
    {
      id: 'grpc-java',
      title: 'Implementing gRPC services and clients in Java',
      explanation: "The generated code gives you an abstract `InventoryServiceImplBase` to extend on the server and stubs for clients. Server methods receive the request and a `StreamObserver` for responses: call `onNext` for each response, then `onCompleted`, or `onError` with a gRPC `Status` such as `NOT_FOUND` or `INVALID_ARGUMENT`.\n\nIn Spring Boot, a starter registers your implementation and runs the gRPC server: the official Spring gRPC project or the community grpc-spring-boot-starter, both using an annotation such as `@GrpcService`, and both able to create client channels from configuration. On the client, a blocking stub is the simplest; async and future stubs exist too. Always set a deadline on each call (`withDeadlineAfter`), which propagates to downstream calls so a whole chain gives up together.",
      example: `@GrpcService
public class InventoryGrpcService extends InventoryServiceGrpc.InventoryServiceImplBase {

    private final StockRepository stockRepository;

    public InventoryGrpcService(StockRepository stockRepository) {
        this.stockRepository = stockRepository;
    }

    @Override
    public void getStock(GetStockRequest request, StreamObserver<Stock> responseObserver) {
        stockRepository.findBySku(request.getSku()).ifPresentOrElse(
            s -> {
                responseObserver.onNext(Stock.newBuilder()
                    .setSku(s.getSku())
                    .setAvailable(s.getAvailable())
                    .build());
                responseObserver.onCompleted();
            },
            () -> responseObserver.onError(Status.NOT_FOUND
                .withDescription("unknown sku " + request.getSku())
                .asRuntimeException()));
    }
}

// client in order-service
ManagedChannel channel = ManagedChannelBuilder.forAddress("inventory-service", 9090)
    .usePlaintext()                       // use TLS in production
    .build();

InventoryServiceGrpc.InventoryServiceBlockingStub inventory =
    InventoryServiceGrpc.newBlockingStub(channel);

try {
    Stock stock = inventory.withDeadlineAfter(2, TimeUnit.SECONDS)
        .getStock(GetStockRequest.newBuilder().setSku("KB-01").build());
} catch (StatusRuntimeException e) {
    if (e.getStatus().getCode() == Status.Code.NOT_FOUND) { /* handle */ }
    if (e.getStatus().getCode() == Status.Code.DEADLINE_EXCEEDED) { /* timeout */ }
}`,
      interviewPoints: [
        "Extend the generated ImplBase; respond via StreamObserver.",
        "Errors as gRPC Status codes.",
        "Blocking, async and future stubs.",
        "Always set deadlines; they propagate.",
      ],
    },
    {
      id: 'protobuf-evolution',
      title: 'Evolving Protocol Buffers schemas',
      explanation: "Because fields are identified by number on the wire, protobuf schemas can evolve safely if you follow a few rules. You may add new fields with new numbers: old clients ignore them, and new code sees default values (0, empty string, false) when they are missing. You may rename a field, because names are not transmitted (but renaming breaks JSON mappings and generated code users).\n\nNever change a field's number or its type in an incompatible way, and never reuse the number of a deleted field; mark removed numbers and names as `reserved` so nobody reuses them by accident. In proto3, scalar fields have no \"not set\" state unless declared `optional` or wrapped, so design with defaults in mind. Put a version in the package name (`shop.inventory.v1`) for breaking changes, and use tools such as Buf to lint schemas and detect breaking changes in CI.",
      example: `import "google/protobuf/timestamp.proto";

message Stock {
  reserved 3;                 // was: int32 reserved_quantity = 3;
  reserved "reserved_quantity";

  string sku = 1;
  int32 available = 2;
  optional string warehouse = 4;      // new field: old clients ignore it
  google.protobuf.Timestamp updated_at = 5;
}

// Safe:     add fields with new numbers, rename fields, add new RPC methods
// Breaking: change a field number or type, reuse a deleted number,
//           change a field between repeated and singular, remove an RPC in use

$ buf breaking --against '.git#branch=main'     # detect breaking changes in CI`,
      interviewPoints: [
        "Fields identified by number, not name.",
        "Add fields with new numbers; old clients ignore them.",
        "Never change or reuse numbers; use reserved.",
        "Version packages for breaking changes; Buf in CI.",
      ],
    },
    {
      id: 'grpc-operations',
      title: 'gRPC in production: load balancing, browsers and observability',
      explanation: "HTTP/2 keeps long-lived connections and multiplexes all calls over them. A layer-4 (TCP) load balancer balances connections, not requests, so all calls from one client can end up on the same server instance while others sit idle. Use layer-7 load balancing that understands HTTP/2 (Envoy, Linkerd, Istio, NGINX with gRPC support), client-side load balancing in gRPC with DNS resolution of all pod IPs (for example a Kubernetes headless Service), or a service mesh.\n\nBrowsers cannot speak native gRPC, so web front ends need gRPC-Web through a proxy such as Envoy, or a REST/GraphQL gateway in front. For observability, use interceptors (the gRPC equivalent of filters) for logging, metrics, tracing and authentication; gRPC has a standard health checking protocol and server reflection for tools like grpcurl. Enable TLS (or mTLS inside a service mesh).",
      example: `# Kubernetes: headless Service so the client sees every pod IP
apiVersion: v1
kind: Service
metadata:
  name: inventory-service
spec:
  clusterIP: None            # headless
  selector:
    app: inventory-service
  ports:
    - name: grpc
      port: 9090

// client-side round robin across all resolved addresses
ManagedChannel channel = ManagedChannelBuilder
    .forTarget("dns:///inventory-service:9090")
    .defaultLoadBalancingPolicy("round_robin")
    .useTransportSecurity()
    .build();

$ grpcurl -plaintext localhost:9090 list                     # needs server reflection
$ grpcurl -plaintext -d '{"sku":"KB-01"}' localhost:9090 shop.inventory.v1.InventoryService/GetStock`,
      interviewPoints: [
        "L4 balancers pin long-lived HTTP/2 connections.",
        "Use L7/mesh or client-side round robin.",
        "Browsers need gRPC-Web or a gateway.",
        "Interceptors, health checks, reflection, TLS.",
      ],
    },
  ],

  commonMistakes: [
    "Choosing GraphQL or gRPC because it is fashionable when a simple REST API would do.",
    "Writing per-object @SchemaMapping resolvers for related data and causing N+1 calls instead of @BatchMapping.",
    "Exposing a public GraphQL API without depth, complexity or pagination limits.",
    "Checking authorization only on the /graphql endpoint instead of per resolver or field.",
    "Assuming a GraphQL HTTP 200 response means success and ignoring the errors array.",
    "Leaving GraphiQL and introspection enabled on private production APIs.",
    "Reusing or changing protobuf field numbers, silently corrupting data between versions.",
    "Making gRPC calls without deadlines, so slow services hang whole call chains.",
    "Putting gRPC services behind a plain TCP load balancer and getting uneven load.",
    "Trying to call gRPC directly from browsers without gRPC-Web or a gateway.",
  ],

  interviewTips: [
    "Answer \"REST vs GraphQL vs gRPC\" with use cases: public/CRUD, flexible front ends, internal high-performance calls.",
    "Explain over-fetching and under-fetching as the problems GraphQL solves.",
    "Always bring up the N+1 problem and DataLoader/@BatchMapping when GraphQL is discussed.",
    "Mention query cost control and per-field authorization as GraphQL security essentials.",
    "For gRPC, cover protobuf, HTTP/2, code generation, streaming, deadlines and schema evolution rules.",
    "Show operational awareness: gRPC load balancing and gRPC-Web for browsers.",
  ],

  interviewQuestions: [
    {
      id: 'microservices-graphql-grpc-q1',
      question: "When would you choose GraphQL, gRPC or REST?",
      answer: "REST is the default for public APIs and CRUD services: it is simple, uses standard HTTP semantics and caching, is easy to debug with any tool, and every client can use it. GraphQL fits when many different clients, especially web and mobile front ends, need different subsets of data spread across several resources: it removes over-fetching and under-fetching with one flexible query and a typed schema, and works well as a backend-for-frontend aggregating several services. gRPC fits internal service-to-service communication where performance, strict contracts and streaming matter: compact binary messages, HTTP/2 multiplexing, generated clients in many languages and deadlines. Many systems combine them, for example gRPC between internal services, GraphQL or REST at the edge for front ends, and REST for public partners.",
      points: [
        "REST: public, CRUD, caching, universal.",
        "GraphQL: flexible front ends, aggregation.",
        "gRPC: internal, fast, typed, streaming.",
        "Combine them where each fits.",
      ],
      difficulty: 'Intermediate',
    },
    {
      id: 'microservices-graphql-grpc-q2',
      question: "What problems does GraphQL solve compared with REST?",
      answer: "Over-fetching: REST endpoints return a fixed representation, so a mobile screen that needs three fields still receives fifty. Under-fetching: a screen that shows an order, its customer and its items may need several REST calls, one per resource, each adding latency. With GraphQL the client sends one query selecting exactly the fields it needs across related types and gets back a response of exactly that shape in one round trip. The strongly typed schema also serves as a contract and documentation, supports tooling such as autocompletion through introspection, and lets the API evolve by adding fields and deprecating old ones with @deprecated rather than versioning endpoints. The trade-offs are more complex server implementation, harder HTTP caching, and the need to control query cost.",
      points: [
        "Over-fetching and under-fetching.",
        "One round trip with selected fields.",
        "Typed schema, introspection, deprecation.",
        "Trade-offs: caching and cost control.",
      ],
      difficulty: 'Beginner',
    },
    {
      id: 'microservices-graphql-grpc-q3',
      question: "What is the N+1 problem in GraphQL and how does Spring for GraphQL solve it?",
      answer: "GraphQL resolves fields per object. If a query returns 50 orders and selects each order's customer, a field resolver for Order.customer runs 50 times, making 50 database queries or HTTP calls in addition to the one that loaded the orders, often fetching the same customers repeatedly. Nested lists multiply this. The standard solution is the DataLoader pattern: during execution, resolvers only register the keys they need; the DataLoader then calls a batch function once with all collected keys and caches results within the request. In Spring for GraphQL you write an @BatchMapping method that receives the list of parent objects and returns a Map from each parent to its value, or a list in matching order; Spring registers the DataLoader and wires it to the field automatically. The result is one batched call instead of N.",
      example: `@BatchMapping
public Map<Order, Customer> customer(List<Order> orders) { ... }`,
      points: [
        "Per-object resolvers cause N extra calls.",
        "DataLoader batches and caches keys.",
        "@BatchMapping returns a map of parent to value.",
        "One batched call instead of N.",
      ],
      difficulty: 'Intermediate',
    },
    {
      id: 'microservices-graphql-grpc-q4',
      question: "How do you secure a GraphQL API?",
      answer: "Authenticate requests at the HTTP layer as usual, for example with JWT bearer tokens and Spring Security. Because a single endpoint serves every operation, authorization must be applied per operation and per field: use @PreAuthorize on handler methods, check ownership in resolvers, and consider hiding sensitive fields for some roles. Protect against expensive or malicious queries with maximum query depth and complexity limits, limits on list sizes with mandatory pagination, execution timeouts, and rate limiting based on query cost. Disable GraphiQL and, for private APIs, introspection in production, and use persisted queries so only known query documents are accepted from first-party clients. Validate input types as with REST, avoid leaking internal exception details in errors, and log operations with their names for auditing.",
      points: [
        "Authenticate at HTTP; authorize per field/resolver.",
        "Depth, complexity, pagination and timeouts.",
        "Disable introspection/GraphiQL; persisted queries.",
        "Safe error messages and auditing.",
      ],
      difficulty: 'Advanced',
    },
    {
      id: 'microservices-graphql-grpc-q5',
      question: "How are errors handled in GraphQL?",
      answer: "A GraphQL response normally has HTTP status 200 and contains a data field and an optional errors array. Each error has a message, a path identifying the field that failed, locations in the query, and extensions such as a classification like NOT_FOUND or FORBIDDEN. Execution continues for other fields, so a response can contain partial data and errors together; a failed nullable field becomes null, while a failed non-null field propagates null to its nearest nullable parent. Syntax and validation errors in the query are returned before execution. In Spring for GraphQL, unhandled exceptions become a generic INTERNAL_ERROR without details, and you map your own exceptions to classifications and safe messages with a DataFetcherExceptionResolverAdapter. Clients must always inspect the errors array rather than relying on the HTTP status.",
      points: [
        "HTTP 200 with data and errors.",
        "path and classification per error.",
        "Partial data; null propagation.",
        "DataFetcherExceptionResolverAdapter.",
      ],
      difficulty: 'Intermediate',
    },
    {
      id: 'microservices-graphql-grpc-q6',
      question: "What is gRPC and why is it faster than REST with JSON?",
      answer: "gRPC is a remote procedure call framework in which services and messages are defined in Protocol Buffers .proto files, from which client stubs and server base classes are generated for many languages. It is faster for several reasons: protobuf messages are a compact binary encoding that identifies fields by number, so payloads are smaller and much cheaper to serialize and parse than text JSON; it runs over HTTP/2, which multiplexes many concurrent calls over one long-lived connection with header compression, avoiding connection setup and head-of-line blocking at the HTTP level; and generated code avoids reflection-heavy mapping. It also supports streaming in both directions and deadlines. The costs are that messages are not human-readable, browsers need gRPC-Web, and load balancing requires HTTP/2-aware infrastructure.",
      points: [
        "Contract-first with .proto and code generation.",
        "Binary protobuf: small, fast to parse.",
        "HTTP/2 multiplexing and header compression.",
        "Trade-offs: readability, browsers, load balancing.",
      ],
      difficulty: 'Intermediate',
    },
    {
      id: 'microservices-graphql-grpc-q7',
      question: "What are the four types of gRPC calls?",
      answer: "Unary: the client sends one request and receives one response, like a normal function or REST call, for example GetStock. Server streaming: the client sends one request and the server returns a stream of responses, for example WatchStock pushing stock updates, or returning a large result in chunks. Client streaming: the client sends a stream of messages and the server replies once at the end, for example uploading many reservations and getting a summary. Bidirectional streaming: both sides send independent streams of messages over the same call, for example a chat or a real-time pricing feed with subscriptions changing over time. In the .proto file, streaming is declared with the stream keyword on the request, the response or both.",
      example: `rpc GetStock (GetStockRequest) returns (Stock);
rpc WatchStock (WatchStockRequest) returns (stream Stock);
rpc ReserveItems (stream ReserveRequest) returns (ReserveSummary);
rpc Chat (stream Message) returns (stream Message);`,
      points: [
        "Unary.",
        "Server streaming.",
        "Client streaming.",
        "Bidirectional streaming.",
      ],
      difficulty: 'Beginner',
    },
    {
      id: 'microservices-graphql-grpc-q8',
      question: "How do you evolve a Protocol Buffers schema without breaking clients?",
      answer: "Fields in protobuf are identified on the wire by their numbers, not their names. You can safely add new fields with new, unused numbers: old readers skip unknown fields and new readers see default values when the field is absent. You can add new RPC methods and rename fields in the schema, since names are not transmitted, although renaming affects generated code and JSON mappings. You must not change a field's number, change its type incompatibly, switch between singular and repeated, or reuse the number of a deleted field; instead, mark removed numbers and names as reserved. Remember that proto3 scalars default to zero values, so use optional or wrapper types when you need to distinguish unset from zero. For breaking changes, create a new versioned package such as shop.inventory.v2 and run both for a while, and use a tool like Buf to lint schemas and detect breaking changes in CI.",
      points: [
        "Fields are identified by number.",
        "Add fields with new numbers; old readers skip them.",
        "Never change or reuse numbers; reserved.",
        "Versioned packages; Buf breaking checks.",
      ],
      difficulty: 'Advanced',
    },
    {
      id: 'microservices-graphql-grpc-q9',
      question: "Why can gRPC load balancing be tricky in Kubernetes, and how do you solve it?",
      answer: "gRPC uses HTTP/2, which keeps a long-lived TCP connection and multiplexes all calls over it. A standard Kubernetes ClusterIP Service balances at layer 4, meaning it picks a backend pod once per connection. Since a gRPC client typically opens one connection and reuses it, all its calls go to the same pod, so load is uneven and new pods added by autoscaling receive no traffic from existing clients. Solutions: use a layer-7, HTTP/2-aware proxy or service mesh (Envoy, Istio, Linkerd) that balances individual requests; or use gRPC client-side load balancing, pointing the client at a headless Service so DNS returns all pod IPs, with the round_robin policy; or use a lookaside or xDS-based balancer. Periodically cycling connections with a maximum connection age on the server also helps spread load when pods are added.",
      points: [
        "HTTP/2 connections are long-lived.",
        "L4 balancing pins clients to one pod.",
        "L7 proxy/mesh or client-side round robin with headless Service.",
        "Max connection age to rebalance.",
      ],
      difficulty: 'Advanced',
    },
  ],
}

export default topic
