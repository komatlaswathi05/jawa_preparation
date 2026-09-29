const topic = {
  id: 'security-fundamentals',
  category: 'security',
  title: 'Spring Security',
  description: 'Authentication, authorization, password hashing, the security filter chain, CORS, CSRF, OAuth2 and method-level security in Spring Boot 3.',
  difficulty: 'Intermediate',
  overview: "Spring Security is the standard framework for protecting Spring applications. It answers two questions for every request: who are you (authentication) and what are you allowed to do (authorization). Think of an office building: the security desk checks your ID card at the entrance (authentication), and your card only opens the doors of the floors you work on (authorization).\n\nUnder the hood, Spring Security is a chain of servlet filters that runs before your controllers. Each filter has one job: read a login form, check a token, reject a forbidden request, add security headers, and so on. In Spring Boot 3 (Spring Security 6) you configure this chain by declaring a `SecurityFilterChain` bean with the lambda DSL. The old `WebSecurityConfigurerAdapter` class has been removed.\n\nAs soon as you add `spring-boot-starter-security`, every endpoint is locked down and a default user with a generated password is created. From there you plug in your own users (`UserDetailsService`), a safe password encoder (`BCryptPasswordEncoder`), URL rules, CORS and CSRF settings, and method-level rules like `@PreAuthorize`. Interviewers expect you to explain these building blocks clearly and know how a request flows through them.",

  subtopics: [
    {
      id: 'authentication',
      title: 'Authentication',
      explanation: "Authentication means proving who you are, for example with a username and password, a token, or a certificate. In Spring Security, a successful login produces an `Authentication` object that holds the principal (the user), the credentials and the granted authorities.\n\nThat object is stored in the `SecurityContextHolder`, which is thread-local, so any code handling the same request can ask 'who is the current user?'. The `AuthenticationManager` (usually a `ProviderManager`) delegates the actual check to `AuthenticationProvider`s such as `DaoAuthenticationProvider`, which loads the user from a `UserDetailsService` and compares passwords.",
      example: `@GetMapping("/me")
public String me() {
    Authentication auth = SecurityContextHolder.getContext().getAuthentication();
    return "Logged in as " + auth.getName();
}

// Or let Spring inject it
@GetMapping("/me2")
public String me2(@AuthenticationPrincipal UserDetails user) {
    return "Logged in as " + user.getUsername();
}`,
      interviewPoints: [
        'Authentication = who you are; it happens before authorization.',
        'The result is an Authentication object stored in the SecurityContextHolder (thread-local by default).',
        'AuthenticationManager -> AuthenticationProvider -> UserDetailsService + PasswordEncoder.',
        'A failed authentication returns HTTP 401 Unauthorized.',
      ],
    },
    {
      id: 'authorization',
      title: 'Authorization',
      explanation: "Authorization decides whether an already-authenticated user may perform an action or access a resource. It is checked after authentication. In Spring Security 6 you define URL rules with `authorizeHttpRequests`, and each rule is evaluated in order, so put specific rules first and a catch-all such as `anyRequest().authenticated()` last.\n\nIf the user is known but not allowed, Spring returns 403 Forbidden. If the user is not logged in at all, it returns 401 Unauthorized (or redirects to the login page for form login).",
      example: `http.authorizeHttpRequests(auth -> auth
        .requestMatchers("/api/public/**").permitAll()
        .requestMatchers(HttpMethod.DELETE, "/api/products/**").hasRole("ADMIN")
        .requestMatchers("/api/orders/**").hasAnyRole("USER", "ADMIN")
        .anyRequest().authenticated());`,
      interviewPoints: [
        'Authorization = what you can do; it needs an authenticated user (or anonymous).',
        '401 means not authenticated, 403 means authenticated but not allowed.',
        'Rules are matched top to bottom: the first match wins.',
      ],
    },
    {
      id: 'spring-security-setup',
      title: 'Spring Security in Spring Boot 3',
      explanation: "Add `spring-boot-starter-security` and Spring Boot auto-configures security: every endpoint requires login, form login and HTTP Basic are enabled, and a user named `user` with a random password (printed in the logs) is created.\n\nTo customize it you write a `@Configuration` class with `@EnableWebSecurity` and declare beans: a `SecurityFilterChain`, a `PasswordEncoder` and usually a `UserDetailsService`. Configuration is done with the lambda DSL (`http.csrf(csrf -> ...)`). The old `WebSecurityConfigurerAdapter` and chained `.and()` style are removed in Spring Security 6.",
      example: `<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-security</artifactId>
</dependency>`,
      interviewPoints: [
        'Adding the starter secures everything by default (secure by default).',
        'Spring Security 6 removed WebSecurityConfigurerAdapter; you declare beans instead.',
        'antMatchers/mvcMatchers were replaced by requestMatchers.',
      ],
    },
    {
      id: 'security-filter-chain',
      title: 'Security Filter Chain',
      explanation: "Every HTTP request passes through a `DelegatingFilterProxy`, which hands it to Spring's `FilterChainProxy`. That proxy picks the first matching `SecurityFilterChain` and runs its filters in order, for example `CorsFilter`, `CsrfFilter`, `UsernamePasswordAuthenticationFilter`, `BearerTokenAuthenticationFilter`, `ExceptionTranslationFilter` and finally `AuthorizationFilter`.\n\nYou can have several chains (for example one for `/api/**` that is stateless and one for the web UI with form login) by declaring several `SecurityFilterChain` beans with `securityMatcher` and `@Order`. You can also insert your own filter with `addFilterBefore`.",
      example: `@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())            // stateless REST API
            .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/auth/**", "/actuator/health").permitAll()
                .requestMatchers("/api/admin/**").hasRole("ADMIN")
                .anyRequest().authenticated())
            .httpBasic(Customizer.withDefaults());
        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}`,
      interviewPoints: [
        'DelegatingFilterProxy -> FilterChainProxy -> SecurityFilterChain -> ordered filters.',
        'Security runs in filters, before the DispatcherServlet and your controllers.',
        'Multiple chains are possible with securityMatcher and @Order.',
        'ExceptionTranslationFilter turns security exceptions into 401/403 responses.',
      ],
    },
    {
      id: 'password-hashing-bcrypt',
      title: 'Password hashing & BCrypt',
      explanation: "Never store passwords in plain text or with fast hashes like MD5 or SHA-256. Use a slow, salted, adaptive hash. Hashing is one-way: you cannot decode it; at login you hash the typed password again and compare.\n\n`BCryptPasswordEncoder` adds a random salt to every password (so two users with the same password get different hashes) and has a cost factor (strength, default 10) that makes each hash deliberately slow, which defeats brute force. `PasswordEncoderFactories.createDelegatingPasswordEncoder()` stores the algorithm in a prefix like `{bcrypt}` so you can migrate algorithms later. Argon2 and SCrypt are also supported.",
      example: `PasswordEncoder encoder = new BCryptPasswordEncoder(12);

String hash = encoder.encode("secret123");
// $2a$12$Vq3... (salt and cost are stored inside the hash)

boolean ok = encoder.matches("secret123", hash);   // true
boolean bad = encoder.matches("wrong", hash);      // false`,
      interviewPoints: [
        'Hashing is one-way; encryption is two-way. Passwords must be hashed.',
        'BCrypt is salted and adaptive (configurable cost factor).',
        'Use matches(raw, hash) to compare; never compare hashes with equals.',
        'DelegatingPasswordEncoder uses prefixes like {bcrypt} to support migration.',
      ],
    },
    {
      id: 'userdetails-userdetailsservice',
      title: 'UserDetails & UserDetailsService',
      explanation: "`UserDetails` is Spring Security's view of a user: username, password hash, authorities and account flags (enabled, locked, expired). `UserDetailsService` has a single method, `loadUserByUsername`, that Spring calls during login to fetch the user.\n\nYou usually implement it by reading your own `users` table through a JPA repository and throwing `UsernameNotFoundException` when the user does not exist. For demos you can use `InMemoryUserDetailsManager`.",
      example: `@Service
public class DbUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    public DbUserDetailsService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        AppUser user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + email));

        return User.withUsername(user.getEmail())
                .password(user.getPasswordHash())
                .roles(user.getRole().name())      // e.g. "ADMIN" becomes ROLE_ADMIN
                .build();
    }
}`,
      interviewPoints: [
        'UserDetailsService.loadUserByUsername is called by DaoAuthenticationProvider during login.',
        'UserDetails carries username, password hash, authorities and account status flags.',
        'Throw UsernameNotFoundException when the user is missing.',
        'If a UserDetailsService and PasswordEncoder bean exist, Spring Boot wires them automatically.',
      ],
    },
    {
      id: 'roles-authorities',
      title: 'Roles & Permissions (authorities)',
      explanation: "A `GrantedAuthority` is any string permission a user has, like `order:read` or `ROLE_ADMIN`. A role is just an authority with the `ROLE_` prefix. `hasRole('ADMIN')` checks for the authority `ROLE_ADMIN`, while `hasAuthority('order:read')` checks the exact string.\n\nRoles are coarse-grained (ADMIN, USER), permissions are fine-grained (order:read, order:delete). Many real systems give each role a set of permissions and check permissions in code, so a new role does not require code changes.",
      example: `UserDetails admin = User.withUsername("asha")
        .password(encoder.encode("pw"))
        .authorities("ROLE_ADMIN", "order:read", "order:delete")
        .build();

http.authorizeHttpRequests(auth -> auth
        .requestMatchers(HttpMethod.GET, "/api/orders/**").hasAuthority("order:read")
        .requestMatchers("/api/admin/**").hasRole("ADMIN")   // checks ROLE_ADMIN
        .anyRequest().authenticated());`,
      interviewPoints: [
        'A role is an authority with the ROLE_ prefix.',
        'hasRole("ADMIN") == hasAuthority("ROLE_ADMIN").',
        'Do not write hasRole("ROLE_ADMIN"): the prefix is added for you.',
      ],
    },
    {
      id: 'cors',
      title: 'CORS',
      explanation: "CORS (Cross-Origin Resource Sharing) is a browser rule. By default, JavaScript running on `https://shop.com` cannot read responses from `https://api.shop.com` because it is a different origin (scheme + host + port). The server must send headers like `Access-Control-Allow-Origin` to allow it. For non-simple requests the browser first sends an OPTIONS 'preflight' request.\n\nIn Spring Security enable CORS with `http.cors(...)` and provide a `CorsConfigurationSource` bean, so preflight requests are handled before authentication rejects them. CORS protects users in browsers; it is not a server-side security control against tools like curl or Postman.",
      example: `@Bean
public CorsConfigurationSource corsConfigurationSource() {
    CorsConfiguration config = new CorsConfiguration();
    config.setAllowedOrigins(List.of("https://shop.com"));
    config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE"));
    config.setAllowedHeaders(List.of("Authorization", "Content-Type"));
    config.setAllowCredentials(true);

    UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
    source.registerCorsConfiguration("/api/**", config);
    return source;
}

// in the SecurityFilterChain
http.cors(Customizer.withDefaults());`,
      interviewPoints: [
        'CORS is enforced by browsers, not by servers or API clients like curl.',
        'Origin = scheme + host + port.',
        'Preflight = OPTIONS request sent before non-simple cross-origin requests.',
        'allowCredentials(true) cannot be combined with allowed origin "*".',
      ],
    },
    {
      id: 'csrf',
      title: 'CSRF',
      explanation: "CSRF (Cross-Site Request Forgery) tricks a logged-in user's browser into sending a request to your site, for example a hidden form on an evil page that posts to `/transfer`. Because browsers send cookies automatically, the request looks authenticated.\n\nSpring Security enables CSRF protection by default: state-changing requests (POST, PUT, DELETE) must include a secret CSRF token that an evil site cannot read. It matters when authentication is based on cookies (sessions). A stateless REST API that uses `Authorization: Bearer` headers is not vulnerable in the same way, so disabling CSRF there is common and acceptable.",
      example: `// Session/cookie based app used by a JavaScript SPA:
http.csrf(csrf -> csrf
        .csrfTokenRepository(CookieCsrfTokenRepository.withHttpOnlyFalse()));
// the SPA reads the XSRF-TOKEN cookie and sends it back in the X-XSRF-TOKEN header

// Stateless API using bearer tokens:
http.csrf(csrf -> csrf.disable());`,
      interviewPoints: [
        'CSRF abuses cookies being sent automatically by the browser.',
        'Enabled by default in Spring Security for POST/PUT/PATCH/DELETE.',
        'Safe to disable for stateless APIs that use bearer tokens in headers, not cookies.',
        'SameSite cookies are an additional defence.',
      ],
    },
    {
      id: 'oauth2-basics',
      title: 'OAuth2 basics',
      explanation: "OAuth2 is an authorization framework that lets an application access resources on behalf of a user without seeing the user's password. The roles are: resource owner (the user), client (your app), authorization server (Google, Keycloak, Okta) that issues tokens, and resource server (the API that accepts tokens).\n\nThe most common flow for web and mobile apps is Authorization Code with PKCE: the user logs in on the authorization server, the client receives a short code and exchanges it for an access token. Machine-to-machine calls use the Client Credentials flow. In Spring Boot, `spring-boot-starter-oauth2-resource-server` validates incoming JWT access tokens, and `spring-boot-starter-oauth2-client` handles login for your app.",
      example: `# application.yml for a resource server (an API that accepts JWTs)
spring:
  security:
    oauth2:
      resourceserver:
        jwt:
          issuer-uri: https://auth.example.com/realms/shop

// SecurityFilterChain
http.oauth2ResourceServer(oauth2 -> oauth2.jwt(Customizer.withDefaults()));`,
      interviewPoints: [
        'OAuth2 is about delegated authorization, not about login by itself.',
        'Four roles: resource owner, client, authorization server, resource server.',
        'Authorization Code + PKCE for users; Client Credentials for service-to-service.',
        'The Implicit and Password grants are deprecated.',
      ],
    },
    {
      id: 'openid-connect',
      title: 'OpenID Connect basics',
      explanation: "OpenID Connect (OIDC) is a thin identity layer on top of OAuth2. OAuth2 gives you an access token to call APIs; OIDC adds an ID token (a JWT) that tells the client who the user is, plus a standard `userinfo` endpoint and the `openid` scope.\n\n'Login with Google' is OIDC. In Spring Boot you add `spring-boot-starter-oauth2-client`, configure the provider's client id and secret, and call `http.oauth2Login(...)`. Spring handles the redirects, code exchange and ID token validation for you.",
      example: `spring:
  security:
    oauth2:
      client:
        registration:
          google:
            client-id: your-client-id
            client-secret: your-client-secret
            scope: openid, profile, email

// SecurityFilterChain
http.oauth2Login(Customizer.withDefaults());`,
      interviewPoints: [
        'OIDC = authentication (identity) on top of OAuth2 (authorization).',
        'ID token is for the client; access token is for the API.',
        'Requested with the openid scope.',
      ],
    },
    {
      id: 'method-security',
      title: 'Method-level security (@PreAuthorize, @EnableMethodSecurity)',
      explanation: "URL rules are coarse. Method security lets you protect individual service methods. Add `@EnableMethodSecurity` to a configuration class (it replaces the old `@EnableGlobalMethodSecurity`), then use `@PreAuthorize` with SpEL expressions that are checked before the method runs.\n\nExpressions can reference method arguments (`#username`) and the current `authentication`. `@PostAuthorize` checks after the method returns (using `returnObject`), and `@Secured` / `@RolesAllowed` are simpler role-only alternatives. Method security works through Spring proxies, so calling the method from inside the same class skips the check.",
      example: `@Configuration
@EnableMethodSecurity
public class MethodSecurityConfig { }

@Service
public class OrderService {

    @PreAuthorize("hasRole('ADMIN')")
    public void deleteOrder(Long id) { /* ... */ }

    @PreAuthorize("hasAuthority('order:read') and #username == authentication.name")
    public List<Order> findOrdersFor(String username) { /* ... */ return List.of(); }

    @PostAuthorize("returnObject.owner == authentication.name")
    public Order getOrder(Long id) { /* ... */ return null; }
}`,
      interviewPoints: [
        '@EnableMethodSecurity enables @PreAuthorize/@PostAuthorize by default.',
        '@PreAuthorize runs before the method, @PostAuthorize after (can inspect returnObject).',
        'Works through AOP proxies: self-invocation bypasses it.',
        'A denied call throws AccessDeniedException, which becomes 403.',
      ],
    },
  ],

  commonMistakes: [
    'Still extending WebSecurityConfigurerAdapter, which no longer exists in Spring Security 6; declare a SecurityFilterChain bean instead.',
    'Storing passwords in plain text or with MD5/SHA-256 instead of a slow salted hash like BCrypt.',
    'Writing hasRole("ROLE_ADMIN"), which actually checks for ROLE_ROLE_ADMIN.',
    'Placing anyRequest().authenticated() before more specific rules, so the specific rules never match.',
    'Disabling CSRF in a session/cookie based application just because a form submission failed.',
    'Setting allowed origins to "*" together with allowCredentials(true), or thinking CORS protects the API from non-browser clients.',
    'Calling a @PreAuthorize method from another method in the same class and expecting the check to run.',
  ],

  interviewTips: [
    'Start every answer with the distinction: authentication is who you are, authorization is what you can do, and mention 401 vs 403.',
    'Be ready to draw the request flow: DelegatingFilterProxy, FilterChainProxy, filters, SecurityContextHolder, controller.',
    'Show you are up to date: SecurityFilterChain beans, lambda DSL, requestMatchers and @EnableMethodSecurity.',
    'When asked about CSRF, explain when it is needed (cookies) and when it is safe to disable (stateless bearer tokens).',
    'For OAuth2 questions, name the four roles and the Authorization Code with PKCE flow, then say how OIDC adds the ID token.',
  ],

  interviewQuestions: [
    {
      id: 'security-fundamentals-q1',
      question: 'What is the difference between authentication and authorization?',
      answer: "Authentication verifies identity: it answers 'who are you?', for example by checking a username and password or validating a token. Authorization happens afterwards and answers 'what are you allowed to do?', for example whether this user may delete an order.\n\nIn Spring Security, authentication produces an `Authentication` object stored in the `SecurityContextHolder`; authorization rules (`authorizeHttpRequests`, `@PreAuthorize`) then check its authorities. A missing or invalid login gives 401 Unauthorized, while a valid user without permission gets 403 Forbidden.",
      points: [
        'Authentication first, authorization second.',
        '401 = not authenticated, 403 = not authorized.',
        'Authorities in the Authentication object drive authorization decisions.',
      ],
      difficulty: 'Beginner',
    },
    {
      id: 'security-fundamentals-q2',
      question: 'What happens when you add spring-boot-starter-security to a Spring Boot application?',
      answer: "Spring Boot auto-configures a default security setup. Every endpoint now requires authentication, form login and HTTP Basic are enabled, CSRF protection is on, and security headers are added. A single in-memory user named `user` is created with a random password printed in the startup log.\n\nOnce you declare your own `SecurityFilterChain` bean, the default chain backs off; once you declare a `UserDetailsService`, the generated user disappears.",
      points: [
        'Secure by default: all endpoints protected.',
        'Default user "user" with a generated password in the logs.',
        'Your own beans replace the auto-configured ones.',
      ],
      difficulty: 'Beginner',
    },
    {
      id: 'security-fundamentals-q3',
      question: 'Why should passwords be hashed with BCrypt instead of encrypted or hashed with SHA-256?',
      answer: "Encryption is reversible: anyone with the key can recover every password. Hashing is one-way, which is what you want. But fast hashes like MD5 or SHA-256 can be computed billions of times per second on GPUs, so leaked hashes are easy to brute-force, and without a salt identical passwords produce identical hashes.\n\nBCrypt adds a random salt per password and has a configurable cost factor that makes each hash slow (tens of milliseconds). You can raise the cost as hardware gets faster. In Spring you use `BCryptPasswordEncoder.encode()` when saving and `matches()` when logging in.",
      example: `@Bean
public PasswordEncoder passwordEncoder() {
    return new BCryptPasswordEncoder();
}

user.setPasswordHash(passwordEncoder.encode(request.password()));`,
      points: [
        'Hashing is one-way; encryption can be reversed.',
        'Salt makes identical passwords hash differently and defeats rainbow tables.',
        'The cost factor makes brute force expensive.',
        'Compare with matches(), not by re-encoding and using equals.',
      ],
      difficulty: 'Beginner',
    },
    {
      id: 'security-fundamentals-q4',
      question: 'How do you configure security in Spring Security 6 now that WebSecurityConfigurerAdapter is removed?',
      answer: "You declare beans instead of extending a base class. A `SecurityFilterChain` bean receives an `HttpSecurity` builder, you configure it with the lambda DSL and return `http.build()`. Users come from a `UserDetailsService` bean, passwords are checked with a `PasswordEncoder` bean, and if you need the `AuthenticationManager` you get it from `AuthenticationConfiguration`.\n\nOther changes: `authorizeRequests` became `authorizeHttpRequests`, `antMatchers` became `requestMatchers`, and `@EnableGlobalMethodSecurity` became `@EnableMethodSecurity`.",
      example: `@Bean
SecurityFilterChain api(HttpSecurity http) throws Exception {
    return http
            .authorizeHttpRequests(auth -> auth
                    .requestMatchers("/public/**").permitAll()
                    .anyRequest().authenticated())
            .formLogin(Customizer.withDefaults())
            .build();
}

@Bean
AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
    return config.getAuthenticationManager();
}`,
      points: [
        'Component-based configuration: SecurityFilterChain, UserDetailsService and PasswordEncoder beans.',
        'Lambda DSL replaces the .and() chaining style.',
        'requestMatchers replaces antMatchers/mvcMatchers.',
      ],
      difficulty: 'Intermediate',
    },
    {
      id: 'security-fundamentals-q5',
      question: 'Explain how a request flows through the Spring Security filter chain.',
      answer: "The servlet container calls `DelegatingFilterProxy`, a normal servlet filter that delegates to the Spring bean `FilterChainProxy`. `FilterChainProxy` selects the first `SecurityFilterChain` whose matcher fits the request and runs its filters in a fixed order.\n\nEarly filters handle CORS, CSRF and headers. Authentication filters (form login, HTTP Basic, bearer token, or your custom JWT filter) try to authenticate and put the result in the `SecurityContextHolder`. `ExceptionTranslationFilter` catches security exceptions and turns them into 401 or 403 responses, and `AuthorizationFilter` finally checks the URL rules. Only if everything passes does the request reach the `DispatcherServlet` and your controller.",
      points: [
        'DelegatingFilterProxy bridges the servlet container and Spring beans.',
        'FilterChainProxy picks one SecurityFilterChain per request.',
        'Authentication filters populate the SecurityContext.',
        'AuthorizationFilter runs near the end and enforces URL rules.',
      ],
      difficulty: 'Intermediate',
    },
    {
      id: 'security-fundamentals-q6',
      question: 'What is the role of UserDetailsService and UserDetails?',
      answer: "`UserDetailsService` is the interface Spring Security uses to load a user by username during authentication. `DaoAuthenticationProvider` calls `loadUserByUsername`, gets back a `UserDetails` object, and checks the submitted password against the stored hash with the `PasswordEncoder`.\n\n`UserDetails` contains the username, password hash, granted authorities and account flags (enabled, non-locked, non-expired). In a real app you implement `UserDetailsService` on top of your user repository and throw `UsernameNotFoundException` if the user does not exist.",
      points: [
        'loadUserByUsername is the only method of UserDetailsService.',
        'UserDetails carries authorities used later for authorization.',
        'The password check itself is done by the provider using the PasswordEncoder.',
      ],
      difficulty: 'Intermediate',
    },
    {
      id: 'security-fundamentals-q7',
      question: 'What is the difference between hasRole and hasAuthority?',
      answer: "Both check the user's granted authorities. `hasAuthority('order:read')` checks for that exact string. `hasRole('ADMIN')` automatically adds the `ROLE_` prefix and checks for `ROLE_ADMIN`.\n\nRoles are typically coarse groups like ADMIN or USER, while authorities are often fine-grained permissions like `order:delete`. A common design is to map each role to a set of permissions and check permissions in code.",
      example: `.requestMatchers("/api/admin/**").hasRole("ADMIN")          // needs ROLE_ADMIN
.requestMatchers("/api/reports/**").hasAuthority("report:read")`,
      points: [
        'hasRole adds the ROLE_ prefix; hasAuthority does not.',
        'Never pass "ROLE_ADMIN" to hasRole.',
        'Permissions give finer control than roles.',
      ],
      difficulty: 'Beginner',
    },
    {
      id: 'security-fundamentals-q8',
      question: 'What is CSRF and when is it safe to disable CSRF protection?',
      answer: "Cross-Site Request Forgery is an attack where a malicious site makes the victim's browser send a request to your application. Because the browser attaches cookies automatically, a session-based app would treat it as a legitimate request from the logged-in user.\n\nSpring Security defends against it by requiring a secret CSRF token on state-changing requests. It is safe to disable when the API is stateless and clients authenticate with a token in the `Authorization` header, because a foreign site cannot make the browser add that header. If you store tokens in cookies, you need CSRF protection again.",
      points: [
        'CSRF exploits automatically-sent cookies.',
        'Protection = unpredictable token that the attacker cannot read.',
        'Disable only for stateless APIs using header-based bearer tokens.',
        'SameSite cookie attribute is a useful extra layer.',
      ],
      difficulty: 'Intermediate',
    },
    {
      id: 'security-fundamentals-q9',
      question: 'What is CORS and how do you configure it with Spring Security?',
      answer: "CORS is a browser mechanism that controls whether JavaScript from one origin can read responses from another origin. The server opts in by returning headers such as `Access-Control-Allow-Origin`, and for non-simple requests the browser first sends an OPTIONS preflight.\n\nWith Spring Security you call `http.cors(Customizer.withDefaults())` and define a `CorsConfigurationSource` bean listing allowed origins, methods and headers. Configuring it in the security chain matters because the preflight has no credentials; without it, the authentication filters would reject the preflight with 401 before your MVC CORS configuration runs.",
      points: [
        'CORS is enforced by the browser; it does not stop curl or server-to-server calls.',
        'Preflight OPTIONS requests must be allowed without authentication.',
        'List explicit origins, especially with credentials.',
      ],
      difficulty: 'Intermediate',
    },
    {
      id: 'security-fundamentals-q10',
      question: 'How does method-level security work, and what is a common pitfall?',
      answer: "You enable it with `@EnableMethodSecurity` and annotate methods with `@PreAuthorize` or `@PostAuthorize` using SpEL, for example `@PreAuthorize(\"hasRole('ADMIN') or #userId == authentication.principal.id\")`. Spring wraps the bean in an AOP proxy that evaluates the expression before (or after) the method call and throws `AccessDeniedException` if it fails.\n\nThe common pitfall is self-invocation: if a method in the same class calls the annotated method directly, the call does not go through the proxy, so no check runs. Other pitfalls are annotating private methods or forgetting to enable method security at all.",
      example: `@PreAuthorize("hasRole('ADMIN') or #userId == authentication.name")
public UserProfile getProfile(String userId) {
    return profileRepository.findByUserId(userId).orElseThrow();
}`,
      points: [
        '@EnableMethodSecurity replaces @EnableGlobalMethodSecurity.',
        'SpEL can use method arguments and the authentication object.',
        'Implemented with proxies: self-invocation and private methods are not secured.',
      ],
      difficulty: 'Advanced',
    },
    {
      id: 'security-fundamentals-q11',
      question: 'Explain OAuth2 and how OpenID Connect differs from it.',
      answer: "OAuth2 is a framework for delegated authorization: a client application gets an access token from an authorization server so it can call a resource server on the user's behalf, without ever seeing the user's password. The main flows are Authorization Code with PKCE for apps with users and Client Credentials for service-to-service calls.\n\nOAuth2 alone does not define how to identify the user. OpenID Connect adds that: when the client requests the `openid` scope it also receives an ID token, a signed JWT with claims like `sub`, `email` and `name`, plus a standard userinfo endpoint. So OAuth2 answers 'can this app call the API?', and OIDC answers 'who is the logged-in user?'. In Spring Boot, `oauth2Login()` implements the OIDC client and `oauth2ResourceServer().jwt()` validates access tokens in APIs.",
      points: [
        'OAuth2 roles: resource owner, client, authorization server, resource server.',
        'Access token is for APIs; ID token is for the client to learn identity.',
        'Authorization Code + PKCE is the recommended user flow.',
        'Spring has separate starters for oauth2-client and oauth2-resource-server.',
      ],
      difficulty: 'Advanced',
    },
    {
      id: 'security-fundamentals-q12',
      question: 'How would you configure different security rules for a REST API and a web UI in the same application?',
      answer: "Declare two `SecurityFilterChain` beans. Each uses `securityMatcher` to claim a set of URLs, and `@Order` decides which chain is checked first, because only the first matching chain handles a request.\n\nThe API chain (`/api/**`) is stateless, disables CSRF and uses bearer tokens or HTTP Basic. The UI chain handles everything else with form login, sessions and CSRF enabled. This keeps each chain simple and avoids mixing cookie-based and token-based rules.",
      example: `@Bean
@Order(1)
SecurityFilterChain apiChain(HttpSecurity http) throws Exception {
    return http.securityMatcher("/api/**")
            .csrf(csrf -> csrf.disable())
            .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth.anyRequest().authenticated())
            .oauth2ResourceServer(o -> o.jwt(Customizer.withDefaults()))
            .build();
}

@Bean
@Order(2)
SecurityFilterChain webChain(HttpSecurity http) throws Exception {
    return http
            .authorizeHttpRequests(auth -> auth
                    .requestMatchers("/login", "/css/**").permitAll()
                    .anyRequest().authenticated())
            .formLogin(Customizer.withDefaults())
            .build();
}`,
      points: [
        'Multiple SecurityFilterChain beans are allowed.',
        'securityMatcher scopes a chain; @Order sets priority.',
        'The first matching chain is the only one applied to a request.',
      ],
      difficulty: 'Advanced',
    },
  ],
}

export default topic
