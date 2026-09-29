const topic = {
  id: 'security-owasp',
  category: 'security',
  title: 'OWASP Top 10 & Web Security',
  description: "The most common web vulnerabilities and how to prevent them in Spring Boot: injection, XSS, broken access control and IDOR, mass assignment, SSRF, misconfiguration, vulnerable dependencies, deserialization, file uploads and safe logging.",
  difficulty: 'Intermediate',
  overview: "Authentication and authorization (covered in the other security topics) decide who a user is and what they may do. Most real breaches, however, come from ordinary coding mistakes: a SQL query built with string concatenation, an endpoint that forgets to check whether the order belongs to the caller, a debug endpoint left open in production, or an outdated library with a known vulnerability.\n\nThe OWASP (Open Worldwide Application Security Project) Top 10 is the industry's list of the most critical web application risks. Interviewers use it to check that you think like a defender: never trust input, check authorization on every object, keep secrets and errors out of responses and logs, and keep dependencies up to date.\n\nThink of your API as a shop. Authentication is the door guard checking IDs. Security is also making sure a customer cannot walk behind the counter (broken access control), cannot slip an instruction into the order form that the cashier obeys (injection), and that the back door is not left open (misconfiguration). Examples use a Spring Boot order API with `Order`, `User` and `Document` entities.",

  subtopics: [
    {
      id: 'owasp-top-10',
      title: 'The OWASP Top 10',
      explanation: "The 2021 list, still the one most often quoted, is: A01 Broken Access Control, A02 Cryptographic Failures, A03 Injection (including XSS), A04 Insecure Design, A05 Security Misconfiguration, A06 Vulnerable and Outdated Components, A07 Identification and Authentication Failures, A08 Software and Data Integrity Failures (including insecure deserialization), A09 Security Logging and Monitoring Failures, and A10 Server-Side Request Forgery (SSRF).\n\nThe 2025 update keeps Broken Access Control at number one, moves Security Misconfiguration up, adds Software Supply Chain Failures and Mishandling of Exceptional Conditions, and folds SSRF into Broken Access Control. You do not need to memorise the numbering; you do need to explain the main risks and the Spring defences for each.",
      example: `Risk                           Typical Spring Boot defence
-----------------------------  ---------------------------------------------------------
Broken access control / IDOR   ownership checks, @PreAuthorize, deny by default
Cryptographic failures         BCrypt/Argon2, TLS everywhere, secrets in a vault
Injection / XSS                parameterised queries, output encoding, CSP
Insecure design                threat modelling, rate limits, business-rule checks
Security misconfiguration      lock down Actuator, no stack traces, secure headers
Vulnerable components          Dependabot, OWASP Dependency-Check, SBOM, quick upgrades
Authentication failures        Spring Security, MFA, lockout, short-lived tokens
Integrity / deserialization    no Java serialization of untrusted data, signed artifacts
Logging and monitoring         audit security events, alerting, no secrets in logs
SSRF                           allow-list outbound URLs, block internal addresses`,
      interviewPoints: [
        "Industry list of the most critical web risks.",
        "Broken access control is number one.",
        "Know the defence for each, not the exact numbering.",
        "2025 edition adds supply chain and exception handling.",
      ],
    },
    {
      id: 'sql-injection',
      title: 'SQL and JPQL injection',
      explanation: "Injection happens when untrusted input is concatenated into a query or command, so the input can change its structure. With `\"... WHERE email = '\" + email + \"'\"`, an attacker sending `' OR '1'='1` reads every row, and worse payloads can modify or delete data.\n\nThe fix is parameterised queries: `PreparedStatement` with `?`, JdbcTemplate arguments, Spring Data derived queries, or `@Query` with named parameters. The database then treats the input strictly as data. JPQL and native queries built by concatenation are just as vulnerable as raw SQL. Parameters cannot be used for identifiers such as column names in ORDER BY, so validate those against an allow-list. The Criteria API and Spring Data `Sort` are safe ways to build dynamic queries.",
      example: `// VULNERABLE: input becomes part of the SQL
String sql = "SELECT * FROM users WHERE email = '" + email + "'";
jdbcTemplate.queryForList(sql);
// email = "' OR '1'='1"  ->  returns every user

// SAFE: parameters are sent separately from the SQL
jdbcTemplate.queryForList("SELECT * FROM users WHERE email = ?", email);

@Query("SELECT u FROM User u WHERE u.email = :email")      // JPQL named parameter
Optional<User> findByEmail(@Param("email") String email);

// VULNERABLE JPQL: concatenation is still injection
em.createQuery("SELECT o FROM Order o WHERE o.status = '" + status + "'");

// ORDER BY cannot be a parameter: allow-list it
private static final Set<String> SORTABLE = Set.of("createdAt", "amount", "status");
Sort sort = SORTABLE.contains(field) ? Sort.by(field) : Sort.by("createdAt");
orderRepository.findAll(PageRequest.of(page, 20, sort));`,
      interviewPoints: [
        "Never concatenate input into SQL or JPQL.",
        "Use PreparedStatement, named parameters, derived queries.",
        "Allow-list identifiers such as sort columns.",
        "Least-privilege database users limit the damage.",
      ],
    },
    {
      id: 'other-injection',
      title: 'Command, log and other injection',
      explanation: "The same mistake appears wherever input reaches an interpreter. OS command injection: `Runtime.exec(\"convert \" + fileName + \" out.png\")` lets `a.png; rm -rf /` run extra commands. Use `ProcessBuilder` with a list of arguments (no shell) and validate input, or better, use a library instead of shelling out.\n\nLog injection (CRLF injection): if user input containing newline characters is logged as-is, an attacker can forge fake log lines, and a log viewer that renders HTML may execute scripts. Encode or strip control characters, and use structured (JSON) logging. Other variants include LDAP injection, XPath injection, expression language injection (evaluating user input as SpEL) and NoSQL injection.",
      example: `// VULNERABLE: runs through a shell
Runtime.getRuntime().exec("sh -c convert " + fileName + " out.png");

// SAFER: no shell, arguments passed separately, input validated
if (!fileName.matches("[A-Za-z0-9_-]{1,64}\\\\.png")) {
    throw new IllegalArgumentException("invalid file name");
}
new ProcessBuilder("convert", fileName, "out.png").start();

// Log injection: input "bob\\n2026-09-29 INFO Admin login successful"
log.info("Login failed for user {}", username.replaceAll("[\\\\r\\\\n]", "_"));

// NEVER evaluate user input as an expression
new SpelExpressionParser().parseExpression(userInput).getValue();   // remote code execution`,
      interviewPoints: [
        "Any interpreter can be injected: shell, logs, LDAP, SpEL.",
        "ProcessBuilder with separate arguments, no shell.",
        "Strip CR/LF from logged input; use structured logs.",
        "Never evaluate user input as code.",
      ],
    },
    {
      id: 'xss',
      title: 'Cross-Site Scripting (XSS)',
      explanation: "XSS happens when an application includes untrusted data in a web page without proper encoding, so the browser runs attacker-supplied JavaScript in your site's origin. The script can steal session data, act as the user or change the page. Stored XSS saves the payload (for example in a product review) and serves it to every visitor; reflected XSS bounces it from the request (a search parameter) straight into the response; DOM-based XSS happens entirely in client-side JavaScript.\n\nDefences: encode output for its context (HTML body, attribute, JavaScript, URL). Template engines do this by default: Thymeleaf's `th:text` escapes, while `th:utext` does not; React escapes values in JSX, but `dangerouslySetInnerHTML` does not. When you must accept rich HTML, sanitise it with an allow-list library such as OWASP Java HTML Sanitizer. Add a Content-Security-Policy header to block inline and third-party scripts, and mark session cookies HttpOnly so scripts cannot read them.",
      example: `<!-- Thymeleaf -->
<p th:text="\${review.comment}">escaped: &lt;script&gt; shown as text</p>
<p th:utext="\${review.comment}">UNSAFE: script executes</p>

// React
<p>{review.comment}</p>                                           {/* escaped */}
<p dangerouslySetInnerHTML={{ __html: review.comment }} />        {/* UNSAFE */}

// sanitise rich text on input (OWASP Java HTML Sanitizer)
PolicyFactory policy = Sanitizers.FORMATTING.and(Sanitizers.LINKS);
String safeHtml = policy.sanitize(untrustedHtml);

// Content Security Policy with Spring Security
http.headers(headers -> headers
    .contentSecurityPolicy(csp -> csp.policyDirectives("default-src 'self'; script-src 'self'; object-src 'none'")));`,
      interviewPoints: [
        "Stored, reflected and DOM-based XSS.",
        "Context-aware output encoding is the main defence.",
        "th:text / JSX escape; th:utext / dangerouslySetInnerHTML do not.",
        "CSP and HttpOnly cookies as extra layers.",
      ],
    },
    {
      id: 'access-control-idor',
      title: 'Broken access control and IDOR',
      explanation: "Broken access control is the most common serious vulnerability. The classic form is an Insecure Direct Object Reference (IDOR): `GET /api/orders/1043` returns order 1043 to any logged-in user, so changing the number reveals other customers' orders. Authentication passed, but nobody checked that this user may see this object.\n\nCheck authorization on every request for every object, on the server side: load the object scoped to the current user (`findByIdAndCustomerId`), or check ownership with `@PreAuthorize` or `@PostAuthorize`. Deny by default (`anyRequest().authenticated()` is not enough for object-level rules). Return 404 rather than 403 for objects that belong to someone else, so attackers cannot probe which IDs exist. Random UUIDs make guessing harder but are not a substitute for the check. Also protect function-level access: admin endpoints must check roles, not just be hidden in the UI.",
      example: `// VULNERABLE: any authenticated user can read any order
@GetMapping("/api/orders/{id}")
public OrderDto get(@PathVariable Long id) {
    return orderService.findById(id);
}

// SAFE: query scoped to the caller
@GetMapping("/api/orders/{id}")
public OrderDto get(@PathVariable Long id, @AuthenticationPrincipal Jwt jwt) {
    return orderRepository.findByIdAndCustomerId(id, jwt.getSubject())
        .map(OrderDto::from)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
}

// or declaratively
@PostAuthorize("returnObject.customerId == authentication.name or hasRole('ADMIN')")
public OrderDto findById(Long id) { ... }

// function-level: admin endpoints need a role check
http.authorizeHttpRequests(auth -> auth
    .requestMatchers("/api/admin/**").hasRole("ADMIN")
    .anyRequest().authenticated());`,
      interviewPoints: [
        "Authentication is not authorization.",
        "Check ownership for every object, server-side.",
        "Scope queries to the current user; 404 for others' objects.",
        "Protect admin functions with role checks, not hidden UI.",
      ],
    },
    {
      id: 'mass-assignment',
      title: 'Mass assignment and over-posting',
      explanation: "If a controller binds the request body directly to a JPA entity, clients can set fields they should never control. A user updating their profile could send `\"role\": \"ADMIN\"` or `\"balance\": 1000000`, and Jackson happily fills them in before the entity is saved.\n\nUse dedicated request DTOs (records work well) that contain only the fields a client may change, validate them with Bean Validation, and map them to the entity explicitly. The same applies to responses: return response DTOs rather than entities, so internal fields such as password hashes are never serialized by accident.",
      example: `// VULNERABLE: client controls every field of User, including role
@PutMapping("/api/users/me")
public User update(@RequestBody User user) {
    return userRepository.save(user);
}

// SAFE: explicit DTO with only editable fields
public record UpdateProfileRequest(
        @NotBlank @Size(max = 100) String displayName,
        @Email String email) {}

@PutMapping("/api/users/me")
public UserResponse update(@Valid @RequestBody UpdateProfileRequest req,
                           @AuthenticationPrincipal Jwt jwt) {
    User user = userRepository.findBySubject(jwt.getSubject()).orElseThrow();
    user.setDisplayName(req.displayName());
    user.setEmail(req.email());
    return UserResponse.from(userRepository.save(user));   // no passwordHash, no role
}`,
      interviewPoints: [
        "Never bind request bodies directly to entities.",
        "Request DTOs with only editable fields.",
        "Response DTOs prevent leaking internal fields.",
        "Validate DTOs with Bean Validation.",
      ],
    },
    {
      id: 'ssrf',
      title: 'Server-Side Request Forgery (SSRF)',
      explanation: "SSRF happens when the server fetches a URL supplied by the user, for example \"import product image from URL\" or a webhook callback. An attacker supplies an internal address instead: `http://localhost:8080/actuator/env`, an internal admin service, or the cloud metadata endpoint `http://169.254.169.254/`, which can return cloud credentials. The request comes from inside your network, so firewalls do not stop it.\n\nDefences: prefer an allow-list of domains; resolve the host name and reject private, loopback and link-local addresses; allow only http/https; disable automatic redirects (or re-check each one); set short timeouts and size limits; and use network-level egress rules so application servers cannot reach metadata endpoints or internal services they do not need. On AWS, requiring IMDSv2 blocks the simple metadata attack.",
      example: `public byte[] fetchImage(String url) throws IOException, InterruptedException {
    URI uri = URI.create(url);
    if (!Set.of("http", "https").contains(uri.getScheme())) {
        throw new IllegalArgumentException("unsupported scheme");
    }
    for (InetAddress addr : InetAddress.getAllByName(uri.getHost())) {
        if (addr.isLoopbackAddress() || addr.isSiteLocalAddress()
                || addr.isLinkLocalAddress() || addr.isAnyLocalAddress()) {
            throw new IllegalArgumentException("internal addresses are not allowed");
        }
    }
    HttpClient client = HttpClient.newBuilder()
        .followRedirects(HttpClient.Redirect.NEVER)       // redirects could point inside
        .connectTimeout(Duration.ofSeconds(3))
        .build();
    HttpRequest request = HttpRequest.newBuilder(uri).timeout(Duration.ofSeconds(5)).build();
    return client.send(request, HttpResponse.BodyHandlers.ofByteArray()).body();
}
// Notes: isSiteLocalAddress() does not cover IPv6 unique-local (fc00::/7) addresses,
// and DNS can change between the check and the request (DNS rebinding);
// egress firewall rules are the stronger control.`,
      interviewPoints: [
        "Server fetches attacker-chosen URLs.",
        "Targets: localhost, internal services, cloud metadata.",
        "Allow-list hosts, block private IPs, no redirects.",
        "Network egress rules as defence in depth.",
      ],
    },
    {
      id: 'crypto-failures',
      title: 'Cryptographic failures',
      explanation: "This category covers sensitive data that is not protected properly: passwords stored in plain text or with fast hashes (MD5, SHA-256), data sent over plain HTTP, weak or home-made encryption, hard-coded keys, and predictable random values used as tokens.\n\nRules: hash passwords with a slow, salted algorithm (BCrypt, Argon2, scrypt or PBKDF2, via Spring Security's `PasswordEncoder`); use TLS for all traffic, including between internal services where possible; use well-known libraries and algorithms (AES-GCM) and never invent your own; keep keys and secrets in a secret manager, not in the code or Git; use `SecureRandom` for tokens, never `Random` or `Math.random()`; and avoid storing sensitive data you do not need at all.",
      example: `@Bean
PasswordEncoder passwordEncoder() {
    return PasswordEncoderFactories.createDelegatingPasswordEncoder();   // {bcrypt} by default
}

String hash = passwordEncoder.encode(rawPassword);          // salted, slow
boolean ok = passwordEncoder.matches(rawPassword, hash);

// secure random token for password-reset links
byte[] bytes = new byte[32];
new SecureRandom().nextBytes(bytes);
String token = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);

// WRONG
String md5 = DigestUtils.md5Hex(password);                  // fast, unsalted, cracked instantly
String weakToken = String.valueOf(new Random().nextInt());  // predictable`,
      interviewPoints: [
        "Slow salted hashes for passwords (BCrypt/Argon2).",
        "TLS everywhere; standard algorithms only.",
        "Secrets in a vault, never in code.",
        "SecureRandom for tokens.",
      ],
    },
    {
      id: 'security-headers',
      title: 'Security headers',
      explanation: "HTTP response headers instruct browsers to enable protections. Spring Security adds sensible defaults: `X-Content-Type-Options: nosniff` (no MIME sniffing), `X-Frame-Options: DENY` (no framing, which prevents clickjacking), `Cache-Control: no-cache, no-store` for authenticated responses, and `Strict-Transport-Security` (HSTS, forcing HTTPS) on HTTPS requests.\n\nYou should add a `Content-Security-Policy` suited to your front end, a `Referrer-Policy`, and a `Permissions-Policy` to disable unused browser features. For cookies, set `Secure`, `HttpOnly` and `SameSite`. Tools such as securityheaders.com and OWASP ZAP check them.",
      example: `http.headers(headers -> headers
    .contentSecurityPolicy(csp -> csp.policyDirectives(
        "default-src 'self'; img-src 'self' https://cdn.shop.example.com; frame-ancestors 'none'"))
    .referrerPolicy(ref -> ref.policy(ReferrerPolicyHeaderWriter.ReferrerPolicy.STRICT_ORIGIN_WHEN_CROSS_ORIGIN))
    .httpStrictTransportSecurity(hsts -> hsts.maxAgeInSeconds(31_536_000).includeSubDomains(true)));

# session cookie flags (application.yml)
server:
  servlet:
    session:
      cookie:
        secure: true
        http-only: true
        same-site: lax`,
      interviewPoints: [
        "Spring Security adds nosniff, X-Frame-Options, cache headers, HSTS.",
        "Add CSP, Referrer-Policy, Permissions-Policy.",
        "Cookies: Secure, HttpOnly, SameSite.",
        "Check with securityheaders.com or ZAP.",
      ],
    },
    {
      id: 'misconfiguration',
      title: 'Security misconfiguration',
      explanation: "Many breaches need no clever exploit, just an open door. Common Spring Boot examples: exposing all Actuator endpoints (`/actuator/env` and `/actuator/heapdump` can leak secrets), leaving the H2 console or Swagger UI enabled in production, returning stack traces or SQL errors to clients, default passwords, overly permissive CORS (`*` with credentials), verbose server headers, and debug logging of request bodies.\n\nExpose only the Actuator endpoints you need (health, info, prometheus) and secure the rest or put them on a separate management port. Disable error details in responses (`server.error.include-stacktrace=never`, which is the default) and return RFC 9457 Problem Details with safe messages. Use profiles so development conveniences never reach production, and review configuration in CI.",
      example: `# application-prod.yml
management:
  endpoints:
    web:
      exposure:
        include: health, info, prometheus      # not "*"
  endpoint:
    health:
      show-details: never
  server:
    port: 8081                                 # internal-only management port

server:
  error:
    include-stacktrace: never
    include-message: never

spring:
  h2:
    console:
      enabled: false
springdoc:
  swagger-ui:
    enabled: false`,
      interviewPoints: [
        "Expose only needed Actuator endpoints; secure the rest.",
        "No stack traces or internal errors in responses.",
        "Disable dev tools (H2 console, Swagger) in production.",
        "Profiles and config review in CI.",
      ],
    },
    {
      id: 'vulnerable-components',
      title: 'Vulnerable and outdated dependencies',
      explanation: "A typical Spring Boot application has well over a hundred transitive dependencies, and each can contain known vulnerabilities (CVEs). Log4Shell (CVE-2021-44228) in Log4j 2 and Spring4Shell (CVE-2022-22965) showed how one library can expose thousands of applications to remote code execution.\n\nKeep dependencies current: use the Spring Boot BOM so versions are managed consistently, upgrade regularly, and enable automated tools such as Dependabot or Renovate for update pull requests. Scan builds with OWASP Dependency-Check, Snyk, GitHub code scanning or Trivy (for container images), and fail the build for critical CVEs. Generate an SBOM (CycloneDX) so you can quickly answer \"are we affected?\" when the next major CVE is announced. The software supply chain also includes build plugins, base images and CI actions.",
      example: `<!-- Maven: fail the build on high-severity CVEs -->
<plugin>
    <groupId>org.owasp</groupId>
    <artifactId>dependency-check-maven</artifactId>
    <configuration>
        <failBuildOnCVSS>7</failBuildOnCVSS>
    </configuration>
</plugin>

<!-- SBOM -->
<plugin>
    <groupId>org.cyclonedx</groupId>
    <artifactId>cyclonedx-maven-plugin</artifactId>
</plugin>

# .github/dependabot.yml
version: 2
updates:
  - package-ecosystem: maven
    directory: /
    schedule:
      interval: weekly

$ mvn dependency:tree -Dincludes=org.apache.logging.log4j   # "are we affected?"`,
      interviewPoints: [
        "Transitive dependencies carry CVEs.",
        "Automate updates (Dependabot/Renovate).",
        "Scan in CI and fail on critical issues.",
        "SBOM for fast incident response.",
      ],
    },
    {
      id: 'deserialization',
      title: 'Insecure deserialization',
      explanation: "Java's native serialization (`ObjectInputStream.readObject`) can instantiate arbitrary classes on the classpath while reading data. With an attacker-controlled byte stream and the right library classes present (gadget chains), this leads to remote code execution. Never deserialize untrusted data with Java serialization; use JSON or Protocol Buffers with explicit schemas instead. If you cannot avoid it, configure an `ObjectInputFilter` (Java 9+) with an allow-list of classes.\n\nJSON is not automatically safe. Jackson's polymorphic typing (`activateDefaultTyping`, or `@JsonTypeInfo(use = Id.CLASS)`) lets the payload choose which class to instantiate, which has caused many CVEs. Use `@JsonTypeInfo(use = Id.NAME)` with explicitly listed `@JsonSubTypes`, or sealed interfaces, and keep Jackson updated. YAML parsers should be used in safe mode for untrusted input.",
      example: `// DANGEROUS with untrusted input
Object obj = new ObjectInputStream(request.getInputStream()).readObject();

// If you must: allow-list classes (Java 9+)
ObjectInputStream in = new ObjectInputStream(input);
in.setObjectInputFilter(ObjectInputFilter.Config.createFilter("com.shop.dto.*;java.base/*;!*"));

// Jackson: DANGEROUS - payload chooses the class
mapper.activateDefaultTyping(mapper.getPolymorphicTypeValidator(), ObjectMapper.DefaultTyping.EVERYTHING);

// Jackson: SAFE - closed set of logical type names
@JsonTypeInfo(use = JsonTypeInfo.Id.NAME, property = "type")
@JsonSubTypes({
    @JsonSubTypes.Type(value = CardPayment.class, name = "card"),
    @JsonSubTypes.Type(value = UpiPayment.class, name = "upi")
})
public sealed interface Payment permits CardPayment, UpiPayment { }`,
      interviewPoints: [
        "Java deserialization of untrusted data can mean RCE.",
        "Use JSON/Protobuf with explicit types.",
        "ObjectInputFilter allow-lists if unavoidable.",
        "Avoid Jackson default typing; use named subtypes.",
      ],
    },
    {
      id: 'file-uploads',
      title: 'Input validation and file uploads',
      explanation: "Validate all input on the server: types, lengths, ranges and formats with Bean Validation, preferably with allow-lists (what is permitted) rather than block-lists. Client-side validation is only for usability; attackers call the API directly.\n\nFile uploads need extra care. Limit the size (`spring.servlet.multipart.max-file-size`). Do not trust the file name or the Content-Type header: generate your own name, check the actual content (magic bytes, or Apache Tika), and keep an allow-list of extensions. Prevent path traversal: a name such as `../../etc/cron.d/job` must never be joined to a directory unchecked; normalise the path and verify it stays inside the upload directory. Store uploads outside the web root or in object storage, serve them with `Content-Disposition: attachment`, and scan them for malware if users share files.",
      example: `# application.yml
spring:
  servlet:
    multipart:
      max-file-size: 5MB
      max-request-size: 5MB

private static final Set<String> ALLOWED = Set.of("image/png", "image/jpeg", "application/pdf");

public String store(MultipartFile file) throws IOException {
    String detected = tika.detect(file.getInputStream());       // real type, not the header
    if (!ALLOWED.contains(detected)) {
        throw new IllegalArgumentException("file type not allowed");
    }
    String name = UUID.randomUUID() + extensionFor(detected);   // never the user's file name
    Path base = uploadDir.toRealPath();
    Path target = base.resolve(name).normalize();
    if (!target.startsWith(base)) {                             // path traversal guard
        throw new SecurityException("invalid path");
    }
    Files.copy(file.getInputStream(), target);
    return name;
}`,
      interviewPoints: [
        "Server-side validation with allow-lists.",
        "Limit upload size; detect the real content type.",
        "Generate file names; guard against path traversal.",
        "Store outside the web root; serve as attachment.",
      ],
    },
    {
      id: 'logging-monitoring',
      title: 'Security logging without leaking data',
      explanation: "You need logs to detect and investigate attacks: failed and successful logins, access-denied events, password and permission changes, and unusual activity, each with a timestamp, user id, source IP and correlation id. Spring Security publishes authentication events (`AuthenticationSuccessEvent`, `AbstractAuthenticationFailureEvent`, `AuthorizationDeniedEvent`) that you can listen to. Send logs to a central system and alert on patterns such as many failed logins.\n\nAt the same time, logs must not become a leak themselves. Never log passwords, tokens, API keys, full card numbers or session ids, and minimise personal data (mask emails and phone numbers). Be careful with logging whole request bodies or entities through `toString()`. Protect log storage and set retention periods that respect privacy regulations such as GDPR.",
      example: `@Component
public class SecurityAuditListener {

    private static final Logger audit = LoggerFactory.getLogger("SECURITY_AUDIT");

    @EventListener
    public void onFailure(AbstractAuthenticationFailureEvent event) {
        audit.warn("login_failed user={} reason={}",
            mask(event.getAuthentication().getName()),
            event.getException().getClass().getSimpleName());
    }

    @EventListener
    public void onDenied(AuthorizationDeniedEvent<?> event) {
        audit.warn("access_denied user={}", event.getAuthentication().get().getName());
    }

    private static String mask(String email) {
        int at = email.indexOf('@');
        return at > 1 ? email.charAt(0) + "***" + email.substring(at) : "***";
    }
}

// NEVER
log.info("Login request: {}", loginRequest);   // toString() may include the password
log.debug("Calling API with token {}", token);`,
      interviewPoints: [
        "Log security events with context for detection.",
        "Alert on suspicious patterns.",
        "Never log secrets, tokens or passwords; mask PII.",
        "Beware toString() of requests and entities.",
      ],
    },
  ],

  commonMistakes: [
    "Building SQL, JPQL or native queries with string concatenation.",
    "Checking only that a user is logged in, not that they own the requested object (IDOR).",
    "Binding request bodies directly to JPA entities, allowing clients to set roles or prices.",
    "Rendering user content with th:utext or dangerouslySetInnerHTML without sanitising it.",
    "Exposing all Actuator endpoints or leaving the H2 console and Swagger UI on in production.",
    "Returning stack traces, SQL errors or internal exception messages to clients.",
    "Fetching user-supplied URLs from the server without blocking internal addresses.",
    "Hashing passwords with MD5 or SHA-256 instead of BCrypt or Argon2.",
    "Using java.util.Random for reset tokens or session identifiers.",
    "Ignoring dependency updates and vulnerability scans until the next Log4Shell.",
    "Deserializing untrusted data with ObjectInputStream or Jackson default typing.",
    "Logging passwords, tokens or full request bodies.",
    "Relying on client-side validation or hidden UI buttons as security controls.",
  ],

  interviewTips: [
    "Name the vulnerability, show a vulnerable snippet, then the fix; interviewers love before-and-after.",
    "Always mention IDOR when discussing APIs: authentication is not authorization.",
    "Tie each defence to Spring: parameterised queries, @PreAuthorize, PasswordEncoder, security headers, Actuator exposure.",
    "Talk about defence in depth: input validation, output encoding, least privilege and monitoring together.",
    "Mention supply-chain security: Dependabot, dependency scanning and SBOMs.",
    "If asked how you would secure an existing API, walk through a checklist based on the OWASP Top 10.",
  ],

  interviewQuestions: [
    {
      id: 'security-owasp-q1',
      question: "What is SQL injection and how do you prevent it in Spring Boot?",
      answer: "SQL injection occurs when user input is concatenated into a SQL statement, allowing the input to change the query's structure, for example ' OR '1'='1 turning a lookup into a query that returns all rows, or appended statements that modify data. Prevention: always use parameterised queries, which send the SQL and the values separately so the database treats input only as data. In Spring that means JdbcTemplate with ? placeholders, Spring Data derived queries, @Query with named parameters, and the Criteria API for dynamic queries. JPQL and native queries built by concatenation are also vulnerable. Identifiers such as sort columns cannot be parameters, so validate them against an allow-list or use Spring Data's Sort. Additionally, connect with a least-privilege database user and validate input.",
      example: `jdbcTemplate.query("SELECT * FROM users WHERE email = ?", mapper, email);`,
      points: [
        "Concatenated input changes query structure.",
        "Parameterised queries everywhere.",
        "JPQL/native concatenation is also vulnerable.",
        "Allow-list identifiers; least-privilege DB user.",
      ],
      difficulty: 'Beginner',
    },
    {
      id: 'security-owasp-q2',
      question: "What is IDOR and how do you prevent it?",
      answer: "An Insecure Direct Object Reference is a broken access control flaw where an endpoint uses an identifier from the request, such as /api/orders/1043, to load an object without checking that the caller is allowed to access it. Any authenticated user can change the ID and read or modify other users' data. Prevention: enforce object-level authorization on the server for every request. Load objects scoped to the current user (findByIdAndCustomerId), or check ownership with @PreAuthorize or @PostAuthorize expressions or in the service layer. Return 404 for objects the user may not access so IDs cannot be enumerated. Random UUIDs make guessing harder but are not a replacement for the check. Write tests that try to access another user's resources.",
      points: [
        "Object loaded by ID without an ownership check.",
        "Check authorization for every object.",
        "Scope queries to the current user.",
        "404 instead of 403; UUIDs are not enough.",
      ],
      difficulty: 'Intermediate',
    },
    {
      id: 'security-owasp-q3',
      question: "Explain XSS and how to protect a Spring Boot application with a React front end.",
      answer: "Cross-Site Scripting lets an attacker run JavaScript in other users' browsers under your site's origin by getting untrusted data rendered as HTML or script. Stored XSS persists the payload in the database, reflected XSS returns it from request parameters, and DOM-based XSS occurs in client-side code. React escapes values rendered in JSX by default, so the main risks are dangerouslySetInnerHTML, setting href to user-controlled javascript: URLs, and third-party libraries that write HTML. If rich text is needed, sanitise it on the server with an allow-list sanitizer such as the OWASP Java HTML Sanitizer, or with DOMPurify on the client. Add a strict Content-Security-Policy via Spring Security headers to block inline and unknown scripts, keep session or refresh cookies HttpOnly so scripts cannot read them, and validate input.",
      points: [
        "Untrusted data executed as script in your origin.",
        "Output encoding; React escapes by default.",
        "Sanitise rich HTML with an allow-list.",
        "CSP and HttpOnly cookies.",
      ],
      difficulty: 'Intermediate',
    },
    {
      id: 'security-owasp-q4',
      question: "Why should you not use JPA entities directly as request and response bodies?",
      answer: "As request bodies, entities enable mass assignment: Jackson binds every JSON property to a matching field, so a client could set fields such as role, balance, price or id that should never be client-controlled. As response bodies, entities can leak internal data such as password hashes, internal flags or audit fields, can trigger lazy-loading exceptions or huge serialized object graphs, and tightly couple the API contract to the database schema. Use dedicated request DTOs containing only editable fields, validated with Bean Validation, and response DTOs that expose exactly what the client needs, mapping explicitly (manually or with MapStruct).",
      points: [
        "Mass assignment of protected fields.",
        "Leaking sensitive or internal fields.",
        "Lazy loading and coupling to the schema.",
        "Request and response DTOs.",
      ],
      difficulty: 'Beginner',
    },
    {
      id: 'security-owasp-q5',
      question: "What is SSRF and how would you prevent it?",
      answer: "Server-Side Request Forgery happens when an application makes HTTP requests to URLs supplied by users, for example importing an image from a URL or calling a user-configured webhook. An attacker supplies an internal URL instead, such as localhost admin endpoints, internal microservices, or the cloud metadata service at 169.254.169.254, which may return credentials. Because the request originates inside the network, perimeter firewalls do not help. Prevention: allow-list destination domains where possible; permit only http and https; resolve the host and reject loopback, private, link-local and other internal addresses; disable redirects or re-validate each hop; set timeouts and size limits; and enforce egress rules at the network level so application servers cannot reach metadata endpoints or unrelated internal systems. On AWS, requiring IMDSv2 mitigates metadata theft.",
      points: [
        "Server fetches attacker-chosen URLs.",
        "Internal services and cloud metadata at risk.",
        "Allow-list, block internal IPs, no redirects.",
        "Network egress controls; IMDSv2.",
      ],
      difficulty: 'Intermediate',
    },
    {
      id: 'security-owasp-q6',
      question: "Which Spring Boot misconfigurations are common security risks?",
      answer: "Exposing all Actuator endpoints with management.endpoints.web.exposure.include=*, which can reveal environment variables, configuration properties, heap dumps and thread dumps; leaving the H2 console, Swagger UI or DevTools enabled in production; returning stack traces or exception messages in error responses; permissive CORS such as allowing all origins with credentials; disabling CSRF on cookie-based applications; running with default or shared credentials; using the same secrets across environments or committing them to Git; verbose logging of requests; and running containers as root. Fixes include exposing only health, info and metrics endpoints (secured or on a separate management port), production profiles that disable development tools, safe error handling with Problem Details, and automated configuration checks in CI.",
      points: [
        "Actuator exposure and heap dumps.",
        "Dev tools and stack traces in production.",
        "Permissive CORS, disabled CSRF.",
        "Secrets and default credentials.",
      ],
      difficulty: 'Intermediate',
    },
    {
      id: 'security-owasp-q7',
      question: "How do you manage vulnerable dependencies in a Java project?",
      answer: "Use the Spring Boot dependency BOM so library versions are consistent and tested together, and upgrade Spring Boot and other dependencies regularly rather than in big, rare jumps. Automate update pull requests with Dependabot or Renovate. Scan dependencies in CI with OWASP Dependency-Check, Snyk, GitHub Dependabot alerts or similar, and fail the build for high-severity CVEs, with a documented process for suppressing false positives. Scan container images with Trivy or Grype, since base images carry vulnerabilities too. Generate an SBOM with the CycloneDX plugin so you can quickly determine whether a newly announced CVE, like Log4Shell, affects your services, and use mvn dependency:tree to find which dependency pulls in a vulnerable library.",
      points: [
        "Spring Boot BOM and regular upgrades.",
        "Automated update PRs.",
        "CI scanning of libraries and images.",
        "SBOM for incident response.",
      ],
      difficulty: 'Intermediate',
    },
    {
      id: 'security-owasp-q8',
      question: "Why is Java deserialization of untrusted data dangerous?",
      answer: "ObjectInputStream.readObject reconstructs objects of whatever classes the byte stream names, and runs code in methods such as readObject, readResolve and finalize, and in the constructors or methods they trigger. Attackers combine classes that already exist on the classpath, from libraries such as Commons Collections, into gadget chains whose execution during deserialization runs arbitrary commands. The application does not even need to use the resulting object. Mitigations: never deserialize untrusted data with Java serialization; use JSON or Protocol Buffers with explicit target types; if it cannot be avoided, apply an ObjectInputFilter allow-list of permitted classes; and avoid Jackson's default typing or class-name-based polymorphism, using named subtypes instead.",
      points: [
        "Stream chooses the classes to instantiate.",
        "Gadget chains lead to remote code execution.",
        "Use JSON/Protobuf with explicit types.",
        "ObjectInputFilter; no Jackson default typing.",
      ],
      difficulty: 'Advanced',
    },
    {
      id: 'security-owasp-q9',
      question: "How would you securely implement a file upload endpoint?",
      answer: "Require authentication and authorization for the upload and for downloads. Limit the file size with spring.servlet.multipart.max-file-size and the request size. Do not trust the client-supplied file name or Content-Type: detect the real type from the content (magic bytes, for example with Apache Tika) and check it against an allow-list. Generate a new random file name and never use the user's name as a path; if paths are built, normalise them and check they remain inside the upload directory to prevent path traversal. Store files outside the web root, ideally in object storage with private access, and serve them through the application with Content-Disposition: attachment and correct content types, or with short-lived signed URLs. Scan files for malware when they are shared with other users, and rate-limit uploads.",
      points: [
        "Auth, size limits, rate limits.",
        "Detect real content type; allow-list.",
        "Random names; path traversal guard.",
        "Store privately; serve as attachment; scan.",
      ],
      difficulty: 'Advanced',
    },
  ],
}

export default topic
