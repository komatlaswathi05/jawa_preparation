const topic = {
  id: 'microservices-kafka',
  category: 'microservices',
  title: 'Kafka & Messaging',
  description: 'Asynchronous messaging with Apache Kafka and RabbitMQ in Spring Boot: topics, partitions, consumer groups, delivery guarantees, outbox, dead-letter topics and idempotent consumers.',
  difficulty: 'Advanced',
  overview: "Messaging lets services talk without waiting for each other. Instead of calling the Inventory service directly, the Order service drops a message into a broker, and Inventory picks it up when it is ready. It works like a post office: the sender hands over a letter and goes home; the post office stores it safely and delivers it, even if the receiver was away for a while.\n\nApache Kafka is a distributed, durable event log. Messages are appended to topics, split into partitions for scale, replicated across brokers for safety, and kept for a retention period so consumers can re-read them. RabbitMQ is a traditional message broker that routes messages through exchanges to queues and removes them once they are acknowledged. Both integrate with Spring Boot through Spring Kafka (`KafkaTemplate`, `@KafkaListener`) and Spring AMQP (`RabbitTemplate`, `@RabbitListener`).\n\nMessaging brings its own challenges: messages can be delivered more than once, arrive out of order, fail repeatedly, or get lost if you write to the database and the broker separately. Interviewers expect you to know delivery semantics, consumer groups and ordering, the outbox pattern, dead-letter topics and idempotent consumers.",

  subtopics: [
    {
      id: 'messaging-basics',
      title: 'Messaging basics',
      explanation: "A message broker sits between producers (who send messages) and consumers (who process them). Two main styles exist. Point-to-point (a queue): each message is processed by exactly one consumer, which is good for distributing work. Publish-subscribe (a topic): each message is delivered to every interested subscriber, which is good for broadcasting events.\n\nMessaging decouples services in time (the consumer can be offline), absorbs traffic spikes (messages wait in the broker), and makes it easy to add new consumers. The trade-offs are eventual consistency, duplicate and out-of-order messages, and an extra piece of infrastructure to run.",
      interviewPoints: [
        'Producer -> broker -> consumer.',
        'Queue (point-to-point) vs topic (publish-subscribe).',
        'Benefits: decoupling, buffering, scalability.',
        'Costs: eventual consistency, duplicates, operational complexity.',
      ],
    },
    {
      id: 'kafka-topics-partitions',
      title: 'Kafka topics, partitions & offsets',
      explanation: "A topic is a named stream of records, like `orders`. Each topic is split into partitions, and each partition is an ordered, append-only log. Every record in a partition gets a sequential number called the offset. Records are not deleted when read; they stay until the retention period (for example 7 days) or size limit is reached, so consumers can replay them.\n\nThe record key decides the partition: records with the same key (for example the same `orderId`) always go to the same partition, so they are processed in order. Kafka guarantees ordering only within a partition, not across the whole topic. More partitions means more parallelism.",
      example: `Topic "orders" with 3 partitions

Partition 0: [0: order-17 created] [1: order-17 paid] [2: order-42 created] ...
Partition 1: [0: order-8 created]  [1: order-8 cancelled] ...
Partition 2: [0: order-99 created] ...

key "order-17" -> hash(key) % 3 -> always partition 0 -> ordered`,
      interviewPoints: [
        'Topic = named stream; partition = ordered log; offset = position in the log.',
        'Ordering is guaranteed only within one partition.',
        'Same key -> same partition -> ordered per key.',
        'Records are retained and can be replayed.',
      ],
    },
    {
      id: 'kafka-brokers-replication',
      title: 'Brokers & replication',
      explanation: "A Kafka cluster is made of servers called brokers. Partitions are spread across brokers so load is shared. Each partition has a replication factor (commonly 3): one replica is the leader that handles reads and writes, and the others are followers that copy it. The followers that are up to date form the in-sync replica set (ISR).\n\nIf the leader's broker dies, an in-sync follower becomes the new leader, so no data is lost. Producers with `acks=all` wait until all in-sync replicas have the record, and `min.insync.replicas=2` ensures at least two copies exist before a write succeeds. Modern Kafka uses KRaft for cluster metadata instead of ZooKeeper.",
      interviewPoints: [
        'Broker = Kafka server; cluster = several brokers.',
        'Each partition has one leader and N-1 followers.',
        'acks=all + min.insync.replicas=2 + replication factor 3 is a common durable setup.',
        'KRaft replaced ZooKeeper (Kafka 4.0 removes ZooKeeper entirely).',
      ],
    },
    {
      id: 'kafka-producers',
      title: 'Producers',
      explanation: "A producer sends records to a topic. It chooses the partition from the key (or spreads keyless records across partitions), batches records for throughput and waits for acknowledgements depending on `acks`: `0` (fire and forget), `1` (leader only) or `all` (all in-sync replicas, the safest).\n\nWith `enable.idempotence=true` (the default in modern Kafka clients) the broker removes duplicates caused by producer retries, so retries do not create duplicate records in a partition.",
      example: `# application.yml
spring:
  kafka:
    bootstrap-servers: localhost:9092
    producer:
      key-serializer: org.apache.kafka.common.serialization.StringSerializer
      value-serializer: org.springframework.kafka.support.serializer.JsonSerializer
      acks: all
      properties:
        enable.idempotence: true`,
      interviewPoints: [
        'The key determines the partition.',
        'acks: 0, 1 or all (durability vs latency).',
        'Idempotent producer prevents duplicates from retries.',
        'Batching (linger.ms, batch.size) improves throughput.',
      ],
    },
    {
      id: 'kafka-consumers-groups',
      title: 'Consumers & consumer groups',
      explanation: "A consumer reads records from partitions and periodically commits its offset (how far it has read) back to Kafka, so after a restart it continues where it left off. Consumers with the same `group.id` form a consumer group: each partition is assigned to exactly one consumer in the group, so the group shares the work.\n\nIf a topic has 6 partitions and the group has 3 consumers, each reads 2 partitions; with 6 consumers each reads 1; a 7th consumer would sit idle. Different groups each receive all records, which is how several services (inventory, email, analytics) all consume the same `orders` topic independently. When consumers join or leave, Kafka rebalances the partition assignment.",
      interviewPoints: [
        'One partition -> at most one consumer per group.',
        'Max useful consumers in a group = number of partitions.',
        'Different groups get their own copy of every record.',
        'Offsets are committed per group and partition; rebalancing redistributes partitions.',
      ],
    },
    {
      id: 'delivery-semantics',
      title: 'Delivery semantics: at-most-once, at-least-once, exactly-once',
      explanation: "At-most-once: the consumer commits the offset before processing. If it crashes during processing, the message is lost but never duplicated. At-least-once: the consumer processes first and commits afterwards. If it crashes after processing but before committing, the message is processed again. This is the most common choice, combined with idempotent consumers.\n\nExactly-once: each message affects the result once. Kafka supports it for read-process-write flows inside Kafka using idempotent producers plus transactions (`transactional.id`) and consumers with `isolation.level=read_committed`. As soon as a side effect leaves Kafka (a database write, an email, an HTTP call), you are back to at-least-once and need idempotency in your own code.",
      interviewPoints: [
        'At-most-once: commit then process; may lose messages.',
        'At-least-once: process then commit; may duplicate. The usual default.',
        'Exactly-once in Kafka = idempotent producer + transactions + read_committed.',
        'External side effects still require idempotent consumers.',
      ],
    },
    {
      id: 'spring-kafka-template',
      title: 'Spring Kafka: KafkaTemplate',
      explanation: "Add `spring-kafka` and Spring Boot auto-configures a `KafkaTemplate` from `spring.kafka.*` properties. `send(topic, key, value)` sends asynchronously and returns a `CompletableFuture<SendResult>`, so you can log success or handle failure without blocking.\n\nUse a meaningful key (for example the order id) so related events stay ordered in one partition. With `JsonSerializer` you can send Java records or objects directly.",
      example: `public record OrderPlacedEvent(String orderId, String customerId, BigDecimal total) { }

@Service
public class OrderEventPublisher {

    private static final Logger log = LoggerFactory.getLogger(OrderEventPublisher.class);
    private final KafkaTemplate<String, OrderPlacedEvent> kafkaTemplate;

    public OrderEventPublisher(KafkaTemplate<String, OrderPlacedEvent> kafkaTemplate) {
        this.kafkaTemplate = kafkaTemplate;
    }

    public void publish(OrderPlacedEvent event) {
        kafkaTemplate.send("orders", event.orderId(), event)
                .whenComplete((result, ex) -> {
                    if (ex != null) {
                        log.error("Failed to publish order {}", event.orderId(), ex);
                    } else {
                        log.info("Published order {} to partition {} offset {}",
                                event.orderId(),
                                result.getRecordMetadata().partition(),
                                result.getRecordMetadata().offset());
                    }
                });
    }
}`,
      interviewPoints: [
        'KafkaTemplate is auto-configured by Spring Boot.',
        'send() is asynchronous and returns CompletableFuture<SendResult>.',
        'Key controls partition and ordering.',
      ],
    },
    {
      id: 'spring-kafka-listener',
      title: 'Spring Kafka: @KafkaListener',
      explanation: "Annotate a method with `@KafkaListener(topics = \"orders\", groupId = \"inventory-service\")` and Spring creates a listener container that polls Kafka and calls your method for each record. With `JsonDeserializer` the payload is converted to your class; remember to configure trusted packages.\n\nBy default Spring commits offsets after the listener returns successfully (at-least-once). `concurrency` starts several consumer threads in the same group, up to the number of partitions. If the method throws, the container's error handler retries and can finally send the record to a dead-letter topic.",
      example: `@Component
public class InventoryListener {

    private final InventoryService inventoryService;

    public InventoryListener(InventoryService inventoryService) {
        this.inventoryService = inventoryService;
    }

    @KafkaListener(topics = "orders", groupId = "inventory-service", concurrency = "3")
    public void onOrderPlaced(OrderPlacedEvent event,
                              @Header(KafkaHeaders.RECEIVED_PARTITION) int partition) {
        inventoryService.reserveStock(event.orderId());
    }
}

# application.yml
spring:
  kafka:
    consumer:
      group-id: inventory-service
      auto-offset-reset: earliest
      key-deserializer: org.apache.kafka.common.serialization.StringDeserializer
      value-deserializer: org.springframework.kafka.support.serializer.JsonDeserializer
      properties:
        spring.json.trusted.packages: "com.shop.events"`,
      interviewPoints: [
        '@KafkaListener creates a managed consumer in a group.',
        'Offsets are committed after successful processing by default.',
        'concurrency should not exceed the partition count.',
        'auto-offset-reset decides where a new group starts: earliest or latest.',
      ],
    },
    {
      id: 'dead-letter-topics',
      title: 'Dead-letter topics & error handling',
      explanation: "Some messages will always fail, for example because of invalid data (a 'poison pill'). If the consumer keeps retrying, the whole partition is blocked. The solution is to retry a few times, then move the message to a dead-letter topic (DLT) such as `orders.DLT`, commit the offset and continue. The DLT can be monitored, inspected and replayed after a fix.\n\nIn Spring Kafka, configure a `DefaultErrorHandler` with a `DeadLetterPublishingRecoverer` and a back-off. For non-blocking retries with delays, `@RetryableTopic` creates retry topics and a DLT automatically. Mark errors that will never succeed (like validation errors) as not retryable.",
      example: `@Bean
public DefaultErrorHandler errorHandler(KafkaTemplate<Object, Object> template) {
    DeadLetterPublishingRecoverer recoverer = new DeadLetterPublishingRecoverer(template);
    // 3 retries, 1 second apart, then publish to "<topic>.DLT"
    DefaultErrorHandler handler = new DefaultErrorHandler(recoverer, new FixedBackOff(1000L, 3));
    handler.addNotRetryableExceptions(IllegalArgumentException.class);
    return handler;
}

// Or: non-blocking retries with retry topics
@RetryableTopic(attempts = "4", backoff = @Backoff(delay = 1000, multiplier = 2))
@KafkaListener(topics = "payments", groupId = "payment-service")
public void onPayment(PaymentEvent event) {
    paymentService.process(event);
}

@DltHandler
public void onDeadLetter(PaymentEvent event) {
    log.error("Payment event moved to DLT: {}", event);
}`,
      interviewPoints: [
        'Poison pills block a partition if retried forever.',
        'Retry a limited number of times, then publish to a DLT.',
        'DefaultErrorHandler + DeadLetterPublishingRecoverer, or @RetryableTopic.',
        'Monitor and replay the DLT.',
      ],
    },
    {
      id: 'idempotent-consumers',
      title: 'Idempotent consumers',
      explanation: "With at-least-once delivery, a consumer will sometimes see the same message twice (after a crash, a rebalance or a producer retry). An idempotent consumer makes sure processing a duplicate has no additional effect.\n\nThe usual technique: every event has a unique id. In the same database transaction as the business change, insert the event id into a `processed_events` table with a unique constraint. If the insert fails because the id already exists, skip the message. Alternatives are naturally idempotent operations (set status to PAID instead of incrementing a counter) or upserts.",
      example: `@KafkaListener(topics = "payments", groupId = "order-service")
@Transactional
public void onPaymentCompleted(PaymentCompletedEvent event) {
    if (processedEventRepository.existsById(event.eventId())) {
        return;                                        // duplicate: already handled
    }
    orderRepository.markPaid(event.orderId());         // business change
    processedEventRepository.save(new ProcessedEvent(event.eventId()));  // same transaction
}
// processed_events.event_id has a PRIMARY KEY, so concurrent duplicates fail and roll back`,
      interviewPoints: [
        'Duplicates are normal with at-least-once delivery.',
        'Store processed event ids with a unique constraint.',
        'Record the id in the same transaction as the business change.',
        'Prefer naturally idempotent operations where possible.',
      ],
    },
    {
      id: 'outbox-pattern',
      title: 'Transactional outbox pattern',
      explanation: "The dual-write problem: a service saves an order in its database and then publishes `OrderPlaced` to Kafka. If the app crashes between the two, the order exists but no event was sent (or the event was sent but the database transaction rolled back). You cannot put a database and Kafka in one simple transaction.\n\nThe outbox pattern fixes this: in the same local database transaction as the business change, insert the event into an `outbox` table. A separate process then reads the outbox and publishes to Kafka, marking rows as sent. This can be a scheduled poller or change data capture (CDC) with Debezium reading the database log. Delivery becomes at-least-once, so consumers must be idempotent.",
      example: `@Transactional
public Order placeOrder(CreateOrderRequest request) {
    Order order = orderRepository.save(Order.from(request));
    outboxRepository.save(new OutboxEvent(
            UUID.randomUUID(), "Order", order.getId().toString(),
            "OrderPlaced", toJson(order)));
    return order;                     // both rows commit or neither does
}

// Relay: publish pending outbox rows
@Scheduled(fixedDelay = 1000)
@Transactional
public void publishOutbox() {
    for (OutboxEvent e : outboxRepository.findTop100BySentFalseOrderByCreatedAt()) {
        kafkaTemplate.send("orders", e.getAggregateId(), e.getPayload()).join();
        e.markSent();
    }
}`,
      interviewPoints: [
        'Solves the dual-write problem between database and broker.',
        'Event is written to an outbox table in the same transaction.',
        'Relay via polling or CDC (Debezium).',
        'Results in at-least-once delivery: consumers must be idempotent.',
      ],
    },
    {
      id: 'rabbitmq',
      title: 'RabbitMQ: exchanges, queues & routing',
      explanation: "In RabbitMQ producers never send directly to a queue. They publish to an exchange with a routing key, and bindings decide which queues receive the message. Exchange types: direct (routing key must match exactly), topic (pattern match with `*` for one word and `#` for many, like `order.*`), fanout (broadcast to all bound queues) and headers (match on headers).\n\nConsumers read from queues and acknowledge messages; acknowledged messages are removed. Unacknowledged messages are redelivered, and rejected messages can go to a dead-letter exchange. In Spring Boot, `spring-boot-starter-amqp` gives you `RabbitTemplate` and `@RabbitListener`.",
      example: `@Configuration
public class RabbitConfig {

    @Bean
    TopicExchange ordersExchange() {
        return new TopicExchange("orders.exchange");
    }

    @Bean
    Queue emailQueue() {
        return QueueBuilder.durable("email.queue")
                .deadLetterExchange("orders.dlx")
                .build();
    }

    @Bean
    Binding emailBinding(Queue emailQueue, TopicExchange ordersExchange) {
        return BindingBuilder.bind(emailQueue).to(ordersExchange).with("order.*");
    }

    @Bean
    MessageConverter jsonConverter() {
        return new Jackson2JsonMessageConverter();
    }
}

// Producer
rabbitTemplate.convertAndSend("orders.exchange", "order.placed", event);

// Consumer
@RabbitListener(queues = "email.queue")
public void sendConfirmation(OrderPlacedEvent event) {
    emailService.sendOrderConfirmation(event);
}`,
      interviewPoints: [
        'Producer -> exchange -> binding (routing key) -> queue -> consumer.',
        'Exchange types: direct, topic, fanout, headers.',
        'Messages are removed after acknowledgement.',
        'Dead-letter exchanges handle rejected or expired messages.',
      ],
    },
    {
      id: 'kafka-vs-rabbitmq',
      title: 'Kafka vs RabbitMQ',
      explanation: "Kafka is a distributed, persistent log. Messages are retained after consumption, consumers track their own offsets and can replay history, throughput is very high, and ordering is per partition. It fits event streaming, event sourcing, analytics pipelines and many independent consumers of the same events.\n\nRabbitMQ is a classic message broker with smart routing (exchanges and bindings), per-message acknowledgements, priorities and delayed or TTL messages. Messages are removed once acknowledged. It fits task queues, complex routing and request/reply style work where each message is a job to be done once. Many companies use both.",
      interviewPoints: [
        'Kafka: log, retention and replay, pull-based, huge throughput, partition ordering.',
        'RabbitMQ: routing via exchanges, push-based, message removed after ack.',
        'Kafka for event streams; RabbitMQ for task queues and flexible routing.',
      ],
    },
    {
      id: 'event-driven-architecture',
      title: 'Event-driven architecture',
      explanation: "In an event-driven architecture services communicate by publishing events, which are immutable facts about something that happened (`OrderPlaced`, `PaymentFailed`). Interested services subscribe and react. The publisher does not know who consumes its events, so new features can be added by adding consumers.\n\nDistinguish events from commands: an event says 'this happened' and may have many consumers; a command says 'please do this' and has one intended handler. Good events carry an id, a type, a timestamp, the aggregate id and a version. Design for schema evolution (add fields, do not remove them) and use a schema registry with Avro or Protobuf in larger systems.",
      example: `public record OrderPlacedEvent(
        UUID eventId,
        String eventType,     // "OrderPlaced"
        int version,          // schema version
        Instant occurredAt,
        String orderId,
        String customerId,
        BigDecimal total) { }`,
      interviewPoints: [
        'Events are past-tense facts; commands are requests.',
        'Loose coupling and easy extension with new consumers.',
        'Eventual consistency and harder end-to-end tracing.',
        'Plan for schema evolution.',
      ],
    },
  ],

  commonMistakes: [
    'Assuming Kafka keeps global order across a topic; ordering only holds within a single partition, so related events need the same key.',
    'Running more consumers in a group than there are partitions and expecting more throughput; extra consumers sit idle.',
    'Writing to the database and then to Kafka in two separate steps, losing events on a crash instead of using the outbox pattern.',
    'Writing consumers that are not idempotent, so a redelivered message charges a customer or sends an email twice.',
    'Retrying a poison-pill message forever, blocking the partition, instead of sending it to a dead-letter topic.',
    'Using acks=1 or acks=0 for critical data and then losing messages when a leader broker fails.',
    'Believing Kafka exactly-once semantics also cover database writes or HTTP calls made by the consumer.',
  ],

  interviewTips: [
    'Draw a topic with partitions and a consumer group; showing that one partition goes to one consumer answers many questions at once.',
    'State that at-least-once plus idempotent consumers is the practical default, and explain where Kafka exactly-once really applies.',
    'Mention the dual-write problem and the outbox pattern whenever you describe publishing events after a database change.',
    'Compare Kafka and RabbitMQ with concrete use cases instead of saying one is better.',
    'Show Spring knowledge: KafkaTemplate, @KafkaListener, DefaultErrorHandler with DeadLetterPublishingRecoverer, @RetryableTopic, RabbitTemplate and @RabbitListener.',
  ],

  interviewQuestions: [
    {
      id: 'microservices-kafka-q1',
      question: 'What is Apache Kafka and what are topics, partitions and offsets?',
      answer: "Kafka is a distributed, durable event streaming platform. Producers write records to topics, and consumers read them, but unlike a classic queue records stay in Kafka for a configured retention time, so they can be re-read.\n\nA topic is a named stream of records such as `orders`. It is split into partitions, each an ordered append-only log stored on brokers, which lets Kafka scale by spreading partitions across servers and consumers. An offset is the sequential position of a record within a partition; consumers commit offsets to remember how far they have read.",
      points: [
        'Topic = named stream; partition = ordered log; offset = position.',
        'Records are retained and replayable.',
        'Partitions provide parallelism and scalability.',
      ],
      difficulty: 'Beginner',
    },
    {
      id: 'microservices-kafka-q2',
      question: 'What is the difference between a queue and publish-subscribe messaging?',
      answer: "In point-to-point (queue) messaging each message is consumed by exactly one consumer. Adding consumers spreads the work, which is ideal for background jobs such as sending emails or resizing images.\n\nIn publish-subscribe messaging each message is delivered to all subscribers. It is used for events that many services care about, like `OrderPlaced` consumed by inventory, billing and analytics. Kafka supports both with consumer groups: consumers in the same group share partitions (queue behaviour), while different groups each receive every message (pub-sub behaviour).",
      points: [
        'Queue: one consumer per message.',
        'Pub-sub: every subscriber gets a copy.',
        'Kafka consumer groups provide both behaviours.',
      ],
      difficulty: 'Beginner',
    },
    {
      id: 'microservices-kafka-q3',
      question: 'How do you produce and consume Kafka messages in Spring Boot?',
      answer: "Add the `spring-kafka` dependency and configure `spring.kafka.bootstrap-servers`, serializers and deserializers in application.yml. Spring Boot auto-configures a `KafkaTemplate` for producing and a listener container factory for consuming.\n\nTo produce, inject `KafkaTemplate<String, MyEvent>` and call `send(topic, key, event)`, which returns a `CompletableFuture<SendResult>`. To consume, annotate a method with `@KafkaListener(topics = \"orders\", groupId = \"inventory-service\")`; Spring polls Kafka, deserializes each record and calls your method, committing the offset after it returns successfully.",
      example: `kafkaTemplate.send("orders", event.orderId(), event);

@KafkaListener(topics = "orders", groupId = "inventory-service")
public void handle(OrderPlacedEvent event) {
    inventoryService.reserveStock(event.orderId());
}`,
      points: [
        'KafkaTemplate for sending; send() is asynchronous.',
        '@KafkaListener for consuming within a consumer group.',
        'Configure serializers/deserializers (for example JSON).',
      ],
      difficulty: 'Beginner',
    },
    {
      id: 'microservices-kafka-q4',
      question: 'How do consumer groups work and how does Kafka scale consumption?',
      answer: "A consumer group is a set of consumers with the same `group.id` that cooperate to read a topic. Kafka assigns each partition to exactly one consumer in the group, so the work is split and each record is processed once per group. When a consumer joins, leaves or crashes, a rebalance reassigns partitions.\n\nThe maximum parallelism of a group equals the number of partitions: with 6 partitions, up to 6 consumers are active and any extra ones stay idle. To scale further you must add partitions (which changes key-to-partition mapping for new records). Separate groups are independent, and each receives every record.",
      points: [
        'One partition per consumer within a group.',
        'Parallelism limited by partition count.',
        'Rebalancing on membership changes.',
        'Different groups each consume everything.',
      ],
      difficulty: 'Intermediate',
    },
    {
      id: 'microservices-kafka-q5',
      question: 'How does Kafka guarantee message ordering?',
      answer: "Kafka guarantees ordering only within a single partition: records are appended in order and a consumer reads them in offset order. There is no ordering guarantee across partitions of a topic.\n\nTo keep related events in order, give them the same key, such as the order id. The default partitioner hashes the key, so all events for that order land in the same partition and are consumed in sequence by one consumer. The idempotent producer (default in modern clients) also keeps order during retries. Processing records in parallel inside a consumer, or changing the partition count, can break per-key ordering.",
      points: [
        'Order is per partition, not per topic.',
        'Same key -> same partition -> ordered.',
        'Idempotent producer keeps order on retries.',
        'Changing partition count changes key mapping.',
      ],
      difficulty: 'Intermediate',
    },
    {
      id: 'microservices-kafka-q6',
      question: 'Explain at-most-once, at-least-once and exactly-once delivery.',
      answer: "At-most-once: the consumer commits the offset before processing, so if it crashes mid-processing the message is skipped. There are no duplicates, but messages can be lost. At-least-once: the consumer processes the message first and commits afterwards. A crash between the two causes redelivery, so there is no loss but duplicates are possible. This is the common default and is paired with idempotent consumers.\n\nExactly-once: every message affects the outcome once. Kafka achieves it for consume-transform-produce flows inside Kafka with idempotent producers, transactions (a `transactional.id` that commits consumer offsets and output records atomically) and `isolation.level=read_committed` on consumers. For side effects outside Kafka, such as database writes, you approximate exactly-once with at-least-once delivery plus idempotent processing or the outbox pattern.",
      points: [
        'At-most-once: may lose, never duplicates.',
        'At-least-once: never loses, may duplicate.',
        'Exactly-once: Kafka transactions for Kafka-to-Kafka flows.',
        'External effects need idempotency.',
      ],
      difficulty: 'Intermediate',
    },
    {
      id: 'microservices-kafka-q7',
      question: 'What is the difference between Kafka and RabbitMQ, and when would you choose each?',
      answer: "Kafka is a distributed commit log. Messages are persisted and retained regardless of consumption, consumers pull and track offsets, many consumer groups can read the same data, history can be replayed, and throughput is very high. Ordering is per partition.\n\nRabbitMQ is a message broker implementing AMQP. Producers publish to exchanges that route messages to queues via bindings (direct, topic, fanout, headers). It pushes messages to consumers, removes them after acknowledgement, and supports per-message TTL, priorities and dead-letter exchanges. Choose Kafka for event streaming, event sourcing, high-volume pipelines and multiple independent consumers of the same events. Choose RabbitMQ for work queues, complex routing rules and lower-volume messaging where each message is a task processed once.",
      points: [
        'Kafka: retained log, replay, very high throughput.',
        'RabbitMQ: flexible routing, per-message ack, removed after consumption.',
        'Kafka for streams; RabbitMQ for task queues and routing.',
      ],
      difficulty: 'Intermediate',
    },
    {
      id: 'microservices-kafka-q8',
      question: 'What is the transactional outbox pattern and what problem does it solve?',
      answer: "It solves the dual-write problem. A service that saves data to its database and then publishes an event to Kafka can fail between the two steps, leaving the database and the event stream inconsistent: an order without an OrderPlaced event, or an event for an order that was rolled back.\n\nWith the outbox pattern the service writes the business row and an event row into an `outbox` table in the same local transaction, so they commit or roll back together. A separate relay then publishes outbox rows to Kafka and marks them as sent, either by polling the table or by change data capture with Debezium reading the database's transaction log. Because the relay may publish a row more than once, consumers must be idempotent.",
      points: [
        'Dual write: database and broker cannot be updated atomically.',
        'Outbox row written in the same transaction as the business data.',
        'Relay by polling or CDC (Debezium).',
        'At-least-once: pair with idempotent consumers.',
      ],
      difficulty: 'Advanced',
    },
    {
      id: 'microservices-kafka-q9',
      question: 'How do you handle messages that keep failing in a Kafka consumer?',
      answer: "A message that always fails, a poison pill, will block its partition if the consumer retries it forever, because later records in that partition cannot be processed. The standard approach is limited retries with back-off, then sending the record to a dead-letter topic and moving on.\n\nIn Spring Kafka you configure a `DefaultErrorHandler` with a `DeadLetterPublishingRecoverer` and a `FixedBackOff` or `ExponentialBackOff`; after the retries the record goes to `<topic>.DLT` with headers describing the exception. Mark permanent errors such as validation or deserialization failures as not retryable. For long delays without blocking, `@RetryableTopic` routes the record through retry topics and finally a DLT handled by `@DltHandler`. The DLT should be monitored and messages replayed once the bug is fixed.",
      example: `@Bean
DefaultErrorHandler errorHandler(KafkaTemplate<Object, Object> template) {
    var handler = new DefaultErrorHandler(
            new DeadLetterPublishingRecoverer(template),
            new FixedBackOff(1000L, 3));
    handler.addNotRetryableExceptions(ValidationException.class);
    return handler;
}`,
      points: [
        'Poison pills block partitions.',
        'Limited retries with back-off, then DLT.',
        'DefaultErrorHandler + DeadLetterPublishingRecoverer or @RetryableTopic.',
        'Do not retry permanent errors; monitor and replay the DLT.',
      ],
      difficulty: 'Advanced',
    },
    {
      id: 'microservices-kafka-q10',
      question: 'What is an idempotent consumer and how do you implement one?',
      answer: "An idempotent consumer produces the same result whether a message is processed once or several times. It is required because at-least-once delivery, consumer rebalances, producer retries and the outbox pattern all cause occasional duplicates.\n\nThe usual implementation gives every event a unique id. Inside one database transaction, the consumer checks or inserts the id into a `processed_events` table with a primary key, and performs the business change. If the id already exists, the message is skipped; if two copies race, the unique constraint makes one transaction fail and roll back. Alternatives include naturally idempotent operations (setting a status instead of incrementing), upserts keyed by a business id, and version checks that ignore older events.",
      example: `@KafkaListener(topics = "payments", groupId = "order-service")
@Transactional
public void on(PaymentCompletedEvent event) {
    if (processedEvents.existsById(event.eventId())) return;
    orders.markPaid(event.orderId());
    processedEvents.save(new ProcessedEvent(event.eventId()));
}`,
      points: [
        'Duplicates are expected in real systems.',
        'Unique event id stored with a unique constraint.',
        'Dedup record and business change in one transaction.',
        'Naturally idempotent operations and upserts help.',
      ],
      difficulty: 'Advanced',
    },
  ],
}

export default topic
