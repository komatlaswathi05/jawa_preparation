const topic = {
  id: 'spring-boot-fundamentals',
  category: 'spring-boot',
  title: 'Spring Boot Fundamentals',
  description: 'How Spring Boot gets a production-ready Spring application running fast: starters, auto-configuration, embedded servers, configuration, logging, Actuator and packaging.',
  difficulty: 'Beginner',
  overview: "Spring Boot is a project built on top of the Spring Framework that makes it quick to create stand-alone, production-ready applications. Plain Spring gives you powerful building blocks, but you have to choose library versions, configure a web server, set up JSON, logging and database connections yourself. Spring Boot does that setup for you with sensible defaults, so you can write business code on day one.\n\nThink of plain Spring as buying furniture flat-packed with a long instruction manual, and Spring Boot as moving into a furnished apartment. Everything is already in place, but you can still move or replace any piece you want. Boot's defaults are opinions, not locks.\n\nThe key ideas are starters (curated dependency bundles), auto-configuration (beans created automatically based on what is on the classpath), an embedded server (your app is a runnable JAR with Tomcat inside), externalised configuration (`application.yml`, environment variables, profiles) and production features such as Actuator health checks and metrics. Spring Boot 3 requires Java 17+ and is based on Spring Framework 6 and Jakarta EE 9+ (`jakarta.*` packages).",

  subtopics: [
    {
      id: 'spring-boot',
      title: 'Spring Boot',
      explanation: "Spring Boot is an opinionated extension of Spring that removes most setup work. It provides starter dependencies, automatic configuration, an embedded web server and production-ready features, so a working REST service needs only a few lines of code.\n\nIt does not replace Spring: everything you know about beans, DI and AOP still applies. Boot simply configures Spring for you and lets you override any default.",
      example: `@SpringBootApplication
public class HelloApplication {
    public static void main(String[] args) {
        SpringApplication.run(HelloApplication.class, args);
    }
}

@RestController
class HelloController {
    @GetMapping("/hello")
    String hello() {
        return "Hello, Spring Boot!";
    }
}`,
      interviewPoints: [
        'Opinionated defaults plus easy overrides.',
        'Stand-alone apps with an embedded server, no WAR deployment needed.',
        'Spring Boot 3: Java 17+, Spring Framework 6, jakarta.* packages.',
      ],
    },
    {
      id: 'spring-vs-spring-boot',
      title: 'Spring vs Spring Boot',
      explanation: "The Spring Framework provides the core features: the IoC container, DI, AOP, Spring MVC, transactions and so on. With plain Spring you configure a lot manually: dependency versions, `DispatcherServlet`, a `DataSource`, JSON converters, and you deploy a WAR to an external Tomcat.\n\nSpring Boot sits on top of Spring and automates that work: starters manage compatible versions, auto-configuration creates common beans, an embedded server lets you run with `java -jar`, and Actuator adds health checks and metrics. In short, Spring is the engine; Spring Boot is the ready-to-drive car.",
      interviewPoints: [
        'Spring = framework features; Boot = convention-over-configuration on top.',
        'Boot adds starters, auto-configuration, embedded server, Actuator.',
        'Boot is not a different framework; it configures Spring.',
      ],
    },
    {
      id: 'spring-initializr',
      title: 'Spring Initializr',
      explanation: "Spring Initializr (start.spring.io) is a web tool that generates a ready-to-run Spring Boot project. You choose the build tool (Maven or Gradle), language, Spring Boot version, Java version, group and artifact ids, and the dependencies (starters) you want, then download a zip.\n\nThe same generator is built into IntelliJ IDEA, VS Code and the Spring Boot CLI, so you rarely create a Boot project by hand.",
      interviewPoints: [
        'start.spring.io generates project skeletons.',
        'Includes the Maven/Gradle wrapper, main class, test class and application.properties.',
      ],
    },
    {
      id: 'project-structure',
      title: 'Project structure',
      explanation: "A typical Spring Boot project follows the Maven standard layout. Java code lives in `src/main/java`, configuration and static files in `src/main/resources`, and tests in `src/test/java`. The main class sits in the root package so component scanning finds everything below it.\n\nInside the root package, code is usually organised by layer (controller, service, repository) or, in larger apps, by feature (order, customer, payment), each containing its own layers.",
      example: `shop/
  pom.xml
  mvnw, mvnw.cmd                 (Maven wrapper)
  src/main/java/com/shop/
    ShopApplication.java         (main class, root package)
    order/
      OrderController.java
      OrderService.java
      OrderRepository.java
      Order.java
    customer/
      ...
  src/main/resources/
    application.yml
    application-prod.yml
    static/                      (static web files)
    templates/                   (server-side templates)
  src/test/java/com/shop/
    ShopApplicationTests.java`,
      interviewPoints: [
        'Main class in the root package so component scanning covers all code.',
        'Configuration in src/main/resources/application.properties or .yml.',
        'Package by feature scales better than package by layer for big apps.',
      ],
    },
    {
      id: 'maven-pom',
      title: 'Maven & pom.xml',
      explanation: "Maven is a build tool that downloads dependencies, compiles code, runs tests and packages your application. Its configuration lives in `pom.xml` (Project Object Model). A Spring Boot `pom.xml` usually inherits from `spring-boot-starter-parent`, which provides dependency versions, sensible plugin configuration and the Java version setting.\n\nThe `spring-boot-maven-plugin` repackages your app into an executable fat JAR. Common commands are `./mvnw spring-boot:run` to run the app, `./mvnw test` to run tests, and `./mvnw clean package` to build the JAR. Gradle is a popular alternative with the same concepts.",
      example: `<project>
  <modelVersion>4.0.0</modelVersion>
  <parent>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-parent</artifactId>
    <version>3.3.4</version>
  </parent>

  <groupId>com.shop</groupId>
  <artifactId>shop</artifactId>
  <version>0.0.1-SNAPSHOT</version>

  <properties>
    <java.version>17</java.version>
  </properties>

  <dependencies>
    <dependency>
      <groupId>org.springframework.boot</groupId>
      <artifactId>spring-boot-starter-web</artifactId>
    </dependency>
    <dependency>
      <groupId>org.springframework.boot</groupId>
      <artifactId>spring-boot-starter-test</artifactId>
      <scope>test</scope>
    </dependency>
  </dependencies>

  <build>
    <plugins>
      <plugin>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-maven-plugin</artifactId>
      </plugin>
    </plugins>
  </build>
</project>`,
      interviewPoints: [
        'spring-boot-starter-parent manages versions, so starters need no version tag.',
        'spring-boot-maven-plugin builds an executable fat JAR.',
        'Use the Maven wrapper (mvnw) so everyone uses the same Maven version.',
      ],
    },
    {
      id: 'dependencies-starters',
      title: 'Dependencies & Starters',
      explanation: "A dependency is a library your project uses. Spring Boot starters are curated dependency bundles for a feature: add one starter and you get all the compatible libraries needed. For example, `spring-boot-starter-web` brings Spring MVC, Jackson for JSON, validation support hooks and embedded Tomcat.\n\nOther common starters are `spring-boot-starter-data-jpa`, `spring-boot-starter-validation`, `spring-boot-starter-security`, `spring-boot-starter-actuator` and `spring-boot-starter-test`. Versions come from Spring Boot's dependency management (a BOM), so you almost never write version numbers for them, and they are tested to work together.",
      example: `<dependency>
  <groupId>org.springframework.boot</groupId>
  <artifactId>spring-boot-starter-data-jpa</artifactId>
</dependency>
<dependency>
  <groupId>org.postgresql</groupId>
  <artifactId>postgresql</artifactId>
  <scope>runtime</scope>
</dependency>`,
      interviewPoints: [
        'Starter = one dependency that pulls a tested set of libraries.',
        'Versions are managed by the Spring Boot BOM.',
        'Naming: official ones are spring-boot-starter-*; third-party ones are *-spring-boot-starter.',
      ],
    },
    {
      id: 'auto-configuration',
      title: 'Auto-configuration',
      explanation: "Auto-configuration is Spring Boot's way of creating beans for you based on what is on the classpath, which beans already exist and which properties are set. If Boot sees `spring-webmvc` and Tomcat on the classpath, it configures a `DispatcherServlet` and embedded server. If it sees a JDBC driver and `spring.datasource.url`, it creates a `DataSource` connection pool (HikariCP).\n\nAuto-configuration classes use conditions such as `@ConditionalOnClass`, `@ConditionalOnMissingBean` and `@ConditionalOnProperty`. `@ConditionalOnMissingBean` is why you can override defaults: define your own bean and Boot backs off. In Boot 3, auto-configurations are listed in `META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports`. Run with `--debug` to see the condition evaluation report.",
      example: `// Simplified idea of a Boot auto-configuration
@AutoConfiguration
@ConditionalOnClass(ObjectMapper.class)
public class JacksonAutoConfiguration {

    @Bean
    @ConditionalOnMissingBean // backs off if you define your own ObjectMapper
    public ObjectMapper objectMapper() {
        return new ObjectMapper();
    }
}

// Excluding an auto-configuration
@SpringBootApplication(exclude = DataSourceAutoConfiguration.class)
public class BatchApp { }`,
      interviewPoints: [
        'Driven by classpath, existing beans and properties.',
        'Conditional annotations; @ConditionalOnMissingBean lets you override.',
        'Boot 3 registers them in AutoConfiguration.imports (spring.factories is gone for this).',
        'Debug with --debug or the Actuator conditions endpoint.',
      ],
    },
    {
      id: 'springbootapplication',
      title: '@SpringBootApplication',
      explanation: "`@SpringBootApplication` is a convenience annotation placed on the main class. It combines three annotations: `@SpringBootConfiguration` (a specialised `@Configuration`), `@EnableAutoConfiguration` (turns on auto-configuration) and `@ComponentScan` (scans the current package and sub-packages).\n\n`SpringApplication.run(...)` in the `main` method bootstraps the app: it creates the `ApplicationContext`, loads configuration, runs auto-configuration, starts the embedded server, and runs any `CommandLineRunner` or `ApplicationRunner` beans.",
      example: `@SpringBootApplication
public class ShopApplication {

    public static void main(String[] args) {
        SpringApplication.run(ShopApplication.class, args);
    }

    @Bean
    CommandLineRunner startupMessage() {
        return args -> System.out.println("Shop started");
    }
}`,
      interviewPoints: [
        '= @SpringBootConfiguration + @EnableAutoConfiguration + @ComponentScan.',
        'Place it in the root package.',
        'SpringApplication.run creates the context and starts the server.',
      ],
    },
    {
      id: 'embedded-tomcat',
      title: 'Embedded Tomcat',
      explanation: "With `spring-boot-starter-web`, Tomcat is included as a library inside your application instead of being installed separately. When the app starts, it starts Tomcat on port 8080 by default. This means your app is a single self-contained JAR you can run anywhere Java is installed, which fits Docker and cloud deployments well.\n\nYou can change the port with `server.port`, and swap Tomcat for Jetty or Undertow by excluding `spring-boot-starter-tomcat` and adding another server starter.",
      example: `# application.yml
server:
  port: 9090
  servlet:
    context-path: /shop
  shutdown: graceful`,
      interviewPoints: [
        'Default port is 8080; change with server.port (0 = random port).',
        'Tomcat is the default; Jetty and Undertow are alternatives.',
        'No external server or WAR deployment needed.',
      ],
    },
    {
      id: 'application-properties',
      title: 'application.properties',
      explanation: "`src/main/resources/application.properties` is the default file for configuring a Spring Boot app. Each line is a `key=value` pair. You use it both for Boot's own settings (server port, database URL, logging levels) and for your own custom settings.\n\nValues can reference other properties or environment variables with placeholders, and can provide defaults with a colon.",
      example: `server.port=8080
spring.application.name=shop
spring.datasource.url=jdbc:postgresql://localhost:5432/shop
spring.datasource.username=shop
spring.datasource.password=\${DB_PASSWORD:localdev}
spring.jpa.hibernate.ddl-auto=validate
logging.level.com.shop=DEBUG
app.orders.max-items=50`,
      interviewPoints: [
        'Located in src/main/resources, loaded automatically.',
        'Placeholders with default values: \${VAR:default}.',
        'Same keys can be overridden by env vars and command-line args.',
      ],
    },
    {
      id: 'application-yml',
      title: 'application.yml',
      explanation: "`application.yml` is an alternative to `application.properties` using YAML, a format that expresses hierarchy through indentation. It is less repetitive for nested settings and supports lists naturally. Indentation must use spaces, never tabs.\n\nIf both files exist, both are loaded, and `.properties` wins on conflicting keys. A single YAML file can also contain several documents separated by `---`, each activated for a profile with `spring.config.activate.on-profile`.",
      example: `spring:
  application:
    name: shop
  datasource:
    url: jdbc:postgresql://localhost:5432/shop
    username: shop
    password: \${DB_PASSWORD:localdev}

app:
  orders:
    max-items: 50
    allowed-countries:
      - IN
      - US
---
spring:
  config:
    activate:
      on-profile: prod
logging:
  level:
    root: WARN`,
      interviewPoints: [
        'Hierarchical and less repetitive than .properties.',
        'Spaces only; wrong indentation silently changes meaning.',
        'Multi-document files with --- and on-profile.',
      ],
    },
    {
      id: 'environment-variables',
      title: 'Environment variables & property precedence',
      explanation: "Spring Boot reads configuration from many sources and merges them in a fixed order, where later sources override earlier ones. Roughly, from lowest to highest priority: defaults, `application.yml` inside the JAR, profile-specific files, config files outside the JAR, OS environment variables, Java system properties (`-D`), and command-line arguments (`--server.port=9000`).\n\nEnvironment variables map to properties with relaxed binding: uppercase, dots become underscores, and dashes are removed. So `SPRING_DATASOURCE_URL` sets `spring.datasource.url` and `APP_ORDERS_MAXITEMS` sets `app.orders.max-items`. This is how you configure the same JAR differently in each environment and keep secrets out of source code.",
      example: `# Same JAR, different environments
export SPRING_PROFILES_ACTIVE=prod
export SPRING_DATASOURCE_URL=jdbc:postgresql://db.internal:5432/shop
export SPRING_DATASOURCE_PASSWORD=supersecret
java -jar shop.jar --server.port=8081`,
      interviewPoints: [
        'Command-line args > system properties > env vars > config files.',
        'Relaxed binding: SPRING_DATASOURCE_URL -> spring.datasource.url.',
        'Keep secrets in env vars or a secret manager, never in Git.',
      ],
    },
    {
      id: 'profiles',
      title: 'Profiles',
      explanation: "Profiles let one application behave differently in different environments. Spring Boot loads `application.yml` first and then `application-{profile}.yml` for each active profile, whose values override the base file. Beans can also be limited to profiles with `@Profile`.\n\nActivate profiles with `spring.profiles.active=prod`, the `SPRING_PROFILES_ACTIVE` environment variable, or `--spring.profiles.active=prod` on the command line. In tests, use `@ActiveProfiles(\"test\")`.",
      example: `# application.yml (shared defaults)
spring:
  jpa:
    show-sql: false

# application-dev.yml
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/shop_dev
  jpa:
    show-sql: true

# application-prod.yml
spring:
  datasource:
    url: \${DATABASE_URL}`,
      interviewPoints: [
        'application-{profile}.yml overrides application.yml.',
        'Several profiles can be active; the last one wins on conflicts.',
        'Combine with @Profile to switch beans per environment.',
      ],
    },
    {
      id: 'configuration-properties',
      title: 'Configuration properties (@ConfigurationProperties, @Value)',
      explanation: "`@Value(\"\${key}\")` injects a single property into a field or constructor parameter. It is fine for one or two values, supports defaults like `\${key:default}`, and supports SpEL expressions.\n\n`@ConfigurationProperties(prefix = \"app.orders\")` binds a whole group of properties to a typed class or record. It is the recommended approach for structured settings: it is type-safe, supports relaxed binding, lists, maps, durations and nested objects, and can be validated with `@Validated`. Register it with `@EnableConfigurationProperties` or `@ConfigurationPropertiesScan`.",
      example: `// application.yml:
// app:
//   orders:
//     max-items: 50
//     payment-timeout: 30s

@Validated
@ConfigurationProperties(prefix = "app.orders")
public record OrderProperties(
        @Min(1) int maxItems,
        Duration paymentTimeout) { }

@SpringBootApplication
@ConfigurationPropertiesScan
public class ShopApplication { }

@Service
public class OrderService {
    private final OrderProperties props;
    private final String appName;

    public OrderService(OrderProperties props,
                        @Value("\${spring.application.name}") String appName) {
        this.props = props;
        this.appName = appName;
    }
}`,
      interviewPoints: [
        '@Value: single values, supports SpEL, no relaxed binding for complex types.',
        '@ConfigurationProperties: grouped, type-safe, validated, relaxed binding.',
        'Records work well as immutable properties classes.',
      ],
    },
    {
      id: 'logging',
      title: 'Logging',
      explanation: "Spring Boot uses SLF4J as the logging API and Logback as the default implementation, configured automatically to log to the console. In your classes you get a logger from `LoggerFactory` (or Lombok's `@Slf4j`) and log with levels TRACE, DEBUG, INFO, WARN and ERROR.\n\nSet levels per package with `logging.level.<package>=DEBUG`, write to a file with `logging.file.name`, and use `{}` placeholders instead of string concatenation. Spring Boot 3.4+ also supports structured JSON logging with `logging.structured.format.console`. For advanced setups add a `logback-spring.xml`.",
      example: `@Service
public class OrderService {
    private static final Logger log = LoggerFactory.getLogger(OrderService.class);

    public void place(Order order) {
        log.info("Placing order {} for customer {}", order.getId(), order.getCustomerId());
        try {
            // ...
        } catch (PaymentException ex) {
            log.error("Payment failed for order {}", order.getId(), ex);
            throw ex;
        }
    }
}

// application.yml
// logging:
//   level:
//     root: INFO
//     com.shop: DEBUG
//     org.hibernate.SQL: DEBUG`,
      interviewPoints: [
        'SLF4J API + Logback by default.',
        'Configure levels per package with logging.level.*.',
        'Use {} placeholders; pass the exception as the last argument to log its stack trace.',
      ],
    },
    {
      id: 'actuator',
      title: 'Actuator',
      explanation: "Spring Boot Actuator adds production-ready endpoints for monitoring and managing your app. Add `spring-boot-starter-actuator` and you get endpoints such as `/actuator/health` (is the app and its database up?), `/actuator/info`, `/actuator/metrics`, `/actuator/loggers` and `/actuator/prometheus` (with Micrometer's Prometheus registry).\n\nBy default only `health` is exposed over HTTP. Expose others carefully with `management.endpoints.web.exposure.include`, and protect them with Spring Security or a separate management port, because some reveal sensitive information. Kubernetes liveness and readiness probes are available at `/actuator/health/liveness` and `/actuator/health/readiness`.",
      example: `management:
  endpoints:
    web:
      exposure:
        include: health,info,metrics,prometheus
  endpoint:
    health:
      show-details: when-authorized
      probes:
        enabled: true
  server:
    port: 8081   # management endpoints on a separate port`,
      interviewPoints: [
        'Health, metrics, info, loggers, env and more.',
        'Only health is exposed over HTTP by default.',
        'Secure actuator endpoints; env and heapdump can leak secrets.',
        'Metrics are powered by Micrometer.',
      ],
    },
    {
      id: 'devtools',
      title: 'DevTools',
      explanation: "`spring-boot-devtools` improves the local development loop. It automatically restarts the application when classes on the classpath change (much faster than a cold start, because it uses two class loaders), supports LiveReload for browser refresh, and disables template caching.\n\nDevTools is automatically disabled when running a packaged JAR with `java -jar`, and should be declared as optional or developmentOnly so it never ships to production.",
      example: `<dependency>
  <groupId>org.springframework.boot</groupId>
  <artifactId>spring-boot-devtools</artifactId>
  <scope>runtime</scope>
  <optional>true</optional>
</dependency>`,
      interviewPoints: [
        'Automatic restart on classpath changes.',
        'Disabled automatically for fully packaged apps.',
        'Development only; never rely on it in production.',
      ],
    },
    {
      id: 'running-jar',
      title: 'Running the JAR',
      explanation: "`./mvnw clean package` produces an executable fat JAR in `target/`. It contains your classes, all dependency JARs and the embedded server, plus a small launcher. You run it with `java -jar target/shop-0.0.1-SNAPSHOT.jar`, passing JVM options and Spring properties on the command line if needed.\n\nThis single artifact is easy to put in a Docker image. Spring Boot can also build an optimised container image directly with `./mvnw spring-boot:build-image` (Cloud Native Buildpacks), and supports layered JARs for better Docker layer caching.",
      example: `./mvnw clean package
java -Xmx512m -jar target/shop-0.0.1-SNAPSHOT.jar \\
     --spring.profiles.active=prod \\
     --server.port=8080`,
      interviewPoints: [
        'Fat JAR = your code + dependencies + embedded server.',
        'Run with java -jar; configure with args or env vars.',
        'spring-boot:build-image creates an OCI image without a Dockerfile.',
      ],
    },
    {
      id: 'production-configuration',
      title: 'Production configuration',
      explanation: "In production, configuration should come from outside the JAR: environment variables, mounted config files, or a config server or secret manager. Never commit passwords or API keys. Use a `prod` profile for safe defaults, such as quieter logging, `spring.jpa.hibernate.ddl-auto=validate` (or `none`) with Flyway or Liquibase for schema changes, and hidden error details.\n\nOther good practices are graceful shutdown (`server.shutdown=graceful`), secured Actuator health endpoints for load balancers and Kubernetes probes, sensible connection pool sizes, JVM memory settings that fit the container, and structured logs sent to a central system.",
      example: `# application-prod.yml
server:
  shutdown: graceful
  error:
    include-stacktrace: never
    include-message: never
spring:
  datasource:
    url: \${DATABASE_URL}
    username: \${DATABASE_USER}
    password: \${DATABASE_PASSWORD}
    hikari:
      maximum-pool-size: 20
  jpa:
    hibernate:
      ddl-auto: validate
  lifecycle:
    timeout-per-shutdown-phase: 30s
logging:
  level:
    root: INFO`,
      interviewPoints: [
        'Externalise config and secrets; same JAR in every environment.',
        'Never use ddl-auto=update/create in production; use Flyway/Liquibase.',
        'Graceful shutdown, health probes, no stack traces in responses.',
      ],
    },
  ],

  commonMistakes: [
    "Putting the main class in a sub-package, so controllers and services in sibling packages are never scanned and endpoints return 404.",
    "Adding version numbers to Spring Boot starters and ending up with incompatible library versions instead of letting the Boot BOM manage them.",
    "Committing database passwords or API keys in `application.yml` instead of using environment variables or a secret manager.",
    "Using `spring.jpa.hibernate.ddl-auto=update` in production, which can silently alter or break the database schema.",
    "Exposing all Actuator endpoints with `include: \"*\"` on a public port, leaking environment details, heap dumps and more.",
    "Mixing tabs and spaces in `application.yml`, causing properties to be ignored or startup to fail.",
  ],

  interviewTips: [
    "Explain auto-configuration concretely: classpath detection plus `@ConditionalOnMissingBean`, and mention that defining your own bean makes Boot back off.",
    "Know what `@SpringBootApplication` is composed of; it is one of the most frequently asked Boot questions.",
    "Be ready to describe how you would run the same JAR in dev and prod: profiles plus environment variables and externalised secrets.",
    "Mention Actuator health checks and metrics when talking about production readiness; it shows real-world awareness.",
  ],

  interviewQuestions: [
    {
      id: 'spring-boot-fundamentals-q1',
      question: 'What is Spring Boot and how is it different from the Spring Framework?',
      answer: "The Spring Framework provides core capabilities such as the IoC container, dependency injection, AOP, Spring MVC and transaction management, but it requires a lot of manual configuration and usually deployment to an external server.\n\nSpring Boot is built on top of Spring and applies convention over configuration. It adds starters for dependency management, auto-configuration that sets up beans based on the classpath, an embedded server so the app runs as a JAR, externalised configuration and production features like Actuator. It does not replace Spring; it configures it for you.",
      points: [
        'Spring = core framework; Boot = opinionated setup on top.',
        'Boot adds starters, auto-configuration, embedded server, Actuator.',
        'All Boot defaults can be overridden.',
      ],
      difficulty: 'Beginner',
    },
    {
      id: 'spring-boot-fundamentals-q2',
      question: 'What does @SpringBootApplication do?',
      answer: "`@SpringBootApplication` is a shortcut for three annotations. `@SpringBootConfiguration` marks the class as a configuration source (a special `@Configuration`). `@EnableAutoConfiguration` turns on Spring Boot's auto-configuration. `@ComponentScan` scans the class's package and all sub-packages for components.\n\nBecause of the component scan, the main class should be in the root package of the application.",
      example: `@SpringBootApplication
public class ShopApplication {
    public static void main(String[] args) {
        SpringApplication.run(ShopApplication.class, args);
    }
}`,
      points: [
        '@SpringBootConfiguration + @EnableAutoConfiguration + @ComponentScan.',
        'Scans from the main class package downwards.',
        'Can exclude auto-configurations with the exclude attribute.',
      ],
      difficulty: 'Beginner',
    },
    {
      id: 'spring-boot-fundamentals-q3',
      question: 'What are Spring Boot starters?',
      answer: "Starters are dependency descriptors that bundle all the libraries needed for a feature into one dependency. For example, `spring-boot-starter-web` brings Spring MVC, Jackson and embedded Tomcat; `spring-boot-starter-data-jpa` brings Spring Data JPA, Hibernate and HikariCP.\n\nTheir versions are managed by Spring Boot's dependency management (via `spring-boot-starter-parent` or the `spring-boot-dependencies` BOM), so the libraries are tested to work together and you do not specify versions yourself.",
      points: [
        'One dependency pulls a curated, compatible set.',
        'Versions managed by the Boot BOM.',
        'Examples: web, data-jpa, security, validation, actuator, test.',
      ],
      difficulty: 'Beginner',
    },
    {
      id: 'spring-boot-fundamentals-q4',
      question: 'How does Spring Boot auto-configuration work?',
      answer: "When `@EnableAutoConfiguration` is active, Boot loads the auto-configuration classes listed in `META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports` from every JAR on the classpath. Each class is guarded by conditions such as `@ConditionalOnClass` (a library is present), `@ConditionalOnProperty` (a property is set) and `@ConditionalOnMissingBean` (you have not defined the bean yourself).\n\nOnly configurations whose conditions pass are applied. That is why adding a JDBC driver creates a `DataSource`, and why defining your own `ObjectMapper` bean makes Boot's default back off. You can see decisions with `--debug` or the Actuator `conditions` endpoint, and exclude a configuration with `@SpringBootApplication(exclude = ...)`.",
      points: [
        'Candidate configs listed in AutoConfiguration.imports (Boot 3).',
        'Conditional annotations decide what is applied.',
        '@ConditionalOnMissingBean lets user beans override defaults.',
        'Inspect with --debug; exclude with exclude=.',
      ],
      difficulty: 'Intermediate',
    },
    {
      id: 'spring-boot-fundamentals-q5',
      question: 'What is the difference between application.properties and application.yml?',
      answer: "Both configure a Spring Boot application and support the same keys. `application.properties` uses flat `key=value` lines. `application.yml` uses YAML, which represents hierarchy with indentation, so it is less repetitive for nested keys and handles lists nicely. YAML also allows several profile-specific documents in one file separated by `---`.\n\nIf both exist in the same location, both are loaded and `.properties` takes precedence for duplicate keys. YAML is sensitive to indentation and does not allow tabs.",
      example: `# properties
spring.datasource.url=jdbc:postgresql://localhost:5432/shop

# yaml
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/shop`,
      points: [
        'Same configuration model, different syntax.',
        'YAML: hierarchical, lists, multi-document.',
        '.properties wins on conflicts when both exist.',
      ],
      difficulty: 'Beginner',
    },
    {
      id: 'spring-boot-fundamentals-q6',
      question: 'What is the difference between @Value and @ConfigurationProperties?',
      answer: "`@Value(\"\${app.name}\")` injects one property at a time. It supports default values and SpEL expressions, but it is scattered across classes, not validated as a group, and does not support relaxed binding for complex structures.\n\n`@ConfigurationProperties(prefix = \"app\")` binds a whole tree of properties to a typed class or record. It supports relaxed binding (`max-items`, `maxItems`, `APP_MAXITEMS`), nested objects, lists, maps, `Duration` and `DataSize` conversion, IDE auto-completion via metadata, and validation with `@Validated`. It is the recommended choice for anything more than a couple of values.",
      example: `@Validated
@ConfigurationProperties(prefix = "app.mail")
public record MailProperties(@NotBlank String from, Duration timeout, List<String> bcc) { }`,
      points: [
        '@Value: single values, SpEL, quick use.',
        '@ConfigurationProperties: grouped, type-safe, validated, relaxed binding.',
        'Register with @ConfigurationPropertiesScan or @EnableConfigurationProperties.',
      ],
      difficulty: 'Intermediate',
    },
    {
      id: 'spring-boot-fundamentals-q7',
      question: 'What is the order of precedence for configuration properties in Spring Boot?',
      answer: "Spring Boot merges many property sources, and higher-priority sources override lower ones. From lowest to highest, the main ones are: default properties, `application.properties/yml` packaged inside the JAR, profile-specific files inside the JAR, config files outside the JAR (for example `./config/application.yml`), OS environment variables, Java system properties (`-Dkey=value`), and command-line arguments (`--key=value`). Test annotations like `@TestPropertySource` sit higher still.\n\nThis ordering lets you ship one JAR and override just what differs per environment using environment variables or arguments, while keeping sensible defaults in the packaged file.",
      points: [
        'Command-line args override almost everything.',
        'Env vars override packaged config files.',
        'Profile-specific files override the base file.',
        'External files override packaged ones.',
      ],
      difficulty: 'Advanced',
    },
    {
      id: 'spring-boot-fundamentals-q8',
      question: 'What is an embedded server and what are its advantages?',
      answer: "An embedded server means the web server (Tomcat by default, or Jetty or Undertow) is packaged as a library inside your application. When you run `java -jar app.jar`, the app starts the server itself, rather than you deploying a WAR file into a separately installed server.\n\nAdvantages: a single self-contained artifact, identical behaviour on every machine, simple Docker images, easy horizontal scaling, and server settings kept in application config (`server.port`, `server.shutdown`). You can switch servers by excluding `spring-boot-starter-tomcat` and adding another starter.",
      points: [
        'Server runs inside the app; no external installation.',
        'Default Tomcat on port 8080.',
        'Great fit for containers and microservices.',
      ],
      difficulty: 'Beginner',
    },
    {
      id: 'spring-boot-fundamentals-q9',
      question: 'What is Spring Boot Actuator and how do you secure it?',
      answer: "Actuator adds production-ready endpoints for monitoring and managing an application: `health`, `info`, `metrics`, `loggers`, `env`, `threaddump`, `prometheus` and more. Health can include database, disk and custom indicators, and exposes Kubernetes liveness and readiness groups.\n\nOnly `health` is exposed over HTTP by default. To secure Actuator, expose just the endpoints you need with `management.endpoints.web.exposure.include`, run them on a separate internal port with `management.server.port`, require authentication via Spring Security for anything beyond basic health, and set `show-details` to `when-authorized`. Endpoints like `env` and `heapdump` can reveal secrets.",
      points: [
        'Health, metrics (Micrometer), info, loggers and more.',
        'Only health exposed by default over HTTP.',
        'Limit exposure, separate port, protect with Spring Security.',
      ],
      difficulty: 'Intermediate',
    },
    {
      id: 'spring-boot-fundamentals-q10',
      question: 'How do you override or disable an auto-configured bean?',
      answer: "The simplest way is to define your own bean of the same type. Most auto-configurations use `@ConditionalOnMissingBean`, so Boot backs off and uses yours. Many defaults can also be tuned purely with properties, such as `spring.jackson.*` or `spring.datasource.hikari.*`, without writing a bean at all.\n\nTo turn off an entire auto-configuration, use `@SpringBootApplication(exclude = DataSourceAutoConfiguration.class)` or the property `spring.autoconfigure.exclude`. To understand why something was or was not configured, run with `--debug` to print the condition evaluation report.",
      example: `@Configuration
public class JacksonConfig {
    @Bean
    public ObjectMapper objectMapper() { // Boot's default ObjectMapper backs off
        return JsonMapper.builder()
                .findAndAddModules()
                .disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS)
                .build();
    }
}`,
      points: [
        'Define your own bean; @ConditionalOnMissingBean backs off.',
        'Prefer properties for simple tweaks.',
        'exclude= or spring.autoconfigure.exclude to disable fully.',
      ],
      difficulty: 'Intermediate',
    },
    {
      id: 'spring-boot-fundamentals-q11',
      question: 'How would you create your own Spring Boot starter?',
      answer: "Create two modules. The autoconfigure module contains an `@AutoConfiguration` class with conditional beans (`@ConditionalOnClass`, `@ConditionalOnMissingBean`, `@ConditionalOnProperty`) plus a `@ConfigurationProperties` class for settings, and lists the configuration class in `META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports`. The starter module is an almost empty POM that depends on the autoconfigure module and the required libraries.\n\nFollow the naming convention `acme-spring-boot-starter` (the `spring-boot-starter-*` prefix is reserved for official ones), make every bean overridable with `@ConditionalOnMissingBean`, and test it with `ApplicationContextRunner`.",
      example: `@AutoConfiguration
@ConditionalOnClass(AuditClient.class)
@EnableConfigurationProperties(AuditProperties.class)
public class AuditAutoConfiguration {

    @Bean
    @ConditionalOnMissingBean
    @ConditionalOnProperty(prefix = "acme.audit", name = "enabled", havingValue = "true", matchIfMissing = true)
    public AuditClient auditClient(AuditProperties props) {
        return new AuditClient(props.url());
    }
}`,
      points: [
        'Autoconfigure module + starter module.',
        'Register in AutoConfiguration.imports (Boot 3).',
        'Conditional, overridable beans with @ConditionalOnMissingBean.',
        'Name it xyz-spring-boot-starter.',
      ],
      difficulty: 'Advanced',
    },
    {
      id: 'spring-boot-fundamentals-q12',
      question: 'What would you configure differently for a production deployment of a Spring Boot app?',
      answer: "Externalise all environment-specific values and secrets using environment variables, mounted files or a secret manager, and activate a `prod` profile. Disable schema auto-generation (`ddl-auto=validate` or `none`) and manage schema with Flyway or Liquibase. Hide error details (`server.error.include-stacktrace=never`) and set appropriate log levels with structured logs shipped to a central system.\n\nEnable graceful shutdown, expose only the needed Actuator endpoints (health probes, metrics) on a protected or internal port, size the HikariCP pool and JVM memory to the container limits, and make sure DevTools is not on the classpath. Finally, run the same built artifact in every environment so what you tested is what you ship.",
      points: [
        'Externalised config and secrets; prod profile.',
        'No ddl-auto update; use migrations.',
        'Graceful shutdown, secured Actuator, no stack traces.',
        'Tuned pools and JVM memory; one artifact for all environments.',
      ],
      difficulty: 'Advanced',
    },
  ],
}

export default topic
