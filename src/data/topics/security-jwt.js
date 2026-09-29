const topic = {
  id: 'security-jwt',
  category: 'security',
  title: 'JWT Authentication',
  description: 'How JSON Web Tokens work and how to build stateless login with access tokens, refresh tokens and a custom JWT filter in Spring Security 6.',
  difficulty: 'Advanced',
  diagram: 'jwt-flow',
  overview: "A JWT (JSON Web Token) is a compact, signed string that says 'this user is Asha, she has role USER, and this statement is valid until 10:15'. The server creates it when the user logs in, and the client sends it back on every request in the `Authorization: Bearer <token>` header. Think of it like a festival wristband: once you are checked at the gate you get a wristband, and every stall just looks at the wristband instead of asking for your ID again.\n\nBecause the token itself carries the user's identity and is protected by a signature, the server does not need to keep a session in memory. That is called stateless authentication, and it makes it easy to scale APIs horizontally and to share authentication across microservices.\n\nIn Spring Security 6 you implement JWT login by exposing a login endpoint that authenticates the user and returns tokens, and a filter (a `OncePerRequestFilter`, or the built-in OAuth2 resource server support) that validates the token on each request and fills the `SecurityContext`. You also need a plan for expiry, refresh tokens, logout and safe storage, because a JWT that leaks is valid until it expires.",

  subtopics: [
    {
      id: 'what-is-jwt',
      title: 'JWT structure: header.payload.signature',
      explanation: "A JWT is three Base64URL-encoded parts joined by dots: `header.payload.signature`. The header says which algorithm signed the token (for example `HS256` or `RS256`). The payload contains claims, which are facts about the user. The signature is computed over the header and payload with a secret or private key.\n\nImportant: the payload is only encoded, not encrypted. Anyone can decode it (paste it into jwt.io). The signature only guarantees that nobody changed it. So never put passwords or sensitive personal data in a JWT.",
      example: `// header (decoded)
{ "alg": "HS256", "typ": "JWT" }

// payload (decoded)
{ "sub": "asha@example.com", "roles": ["USER"], "iat": 1727600000, "exp": 1727600900 }

// signature
HMACSHA256(base64Url(header) + "." + base64Url(payload), secretKey)

// final token
eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJhc2hhQGV4YW1wbGUuY29tIn0.4pcPyMD09olPSyXnrXCjTwXyr4BsezdI1AVTmud2fU4`,
      interviewPoints: [
        'Three parts: header, payload, signature, separated by dots.',
        'Base64URL encoding is not encryption; payload is readable by anyone.',
        'The signature provides integrity and authenticity, not confidentiality.',
        'JWE is the encrypted variant, rarely needed for access tokens.',
      ],
    },
    {
      id: 'claims',
      title: 'Claims',
      explanation: "Claims are the key-value pairs in the payload. Registered claims have standard short names: `sub` (subject, usually user id), `iss` (issuer), `aud` (audience, who the token is for), `exp` (expiry time), `iat` (issued at), `nbf` (not before) and `jti` (unique token id). You can also add custom claims such as `roles` or `tenantId`.\n\nKeep tokens small, because they travel with every request. When validating, always check `exp`, and in larger systems also `iss` and `aud`, so a token issued for another service is not accepted.",
      interviewPoints: [
        'Registered claims: sub, iss, aud, exp, iat, nbf, jti.',
        'exp is a Unix timestamp in seconds.',
        'Validate iss and aud, not just the signature.',
        'Claims are a snapshot: role changes are not visible until a new token is issued.',
      ],
    },
    {
      id: 'signing',
      title: 'Signing: HS256 vs RS256',
      explanation: "HS256 (HMAC with SHA-256) uses one shared secret for signing and verifying. It is simple but every service that verifies tokens must hold the secret, and so could also create tokens. The secret must be long and random (at least 256 bits).\n\nRS256 or ES256 use asymmetric keys: the authentication server signs with a private key, and other services verify with the public key, often published at a JWKS URL. This is the standard choice for microservices and OAuth2 providers.",
      example: `// jjwt 0.12: create a key for HS256 from a Base64 secret (at least 32 bytes)
SecretKey key = Keys.hmacShaKeyFor(Decoders.BASE64.decode(base64Secret));

// Or with Spring Security's resource server using an RSA public key
@Bean
JwtDecoder jwtDecoder(RSAPublicKey publicKey) {
    return NimbusJwtDecoder.withPublicKey(publicKey).build();
}`,
      interviewPoints: [
        'HS256 = symmetric shared secret; RS256/ES256 = private key signs, public key verifies.',
        'Prefer asymmetric keys when several services verify tokens.',
        'Never accept alg "none"; pin the expected algorithm.',
        'Rotate keys using a key id (kid) in the header.',
      ],
    },
    {
      id: 'access-token',
      title: 'Access token',
      explanation: "The access token is the JWT sent with every API call. It should be short-lived, typically 5 to 15 minutes, because it cannot easily be revoked: if it is stolen, the attacker can use it only until it expires.\n\nIt carries what the API needs to authorize the request, such as the user id and roles, and is sent in the `Authorization: Bearer` header.",
      example: `GET /api/orders HTTP/1.1
Host: api.shop.com
Authorization: Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJhc2hhIn0.abc123`,
      interviewPoints: [
        'Short-lived (minutes), sent on every request.',
        'Stateless: validated by signature and expiry only.',
        'Contains just enough claims to authorize requests.',
      ],
    },
    {
      id: 'refresh-token',
      title: 'Refresh token',
      explanation: "A refresh token is a long-lived credential (days or weeks) used only to get a new access token when the old one expires, so the user does not have to log in again. It is sent only to a single endpoint such as `/api/auth/refresh`, never to normal APIs.\n\nUnlike access tokens, refresh tokens are usually stored server-side (in a database or Redis, ideally as a hash), so they can be revoked on logout, password change or suspected theft. They can be opaque random strings; they do not need to be JWTs.",
      example: `@PostMapping("/api/auth/refresh")
public TokenResponse refresh(@RequestBody RefreshRequest request) {
    RefreshToken stored = refreshTokenService.validate(request.refreshToken()); // exists, not expired, not revoked
    AppUser user = stored.getUser();
    String newAccess = jwtService.generateAccessToken(user);
    String newRefresh = refreshTokenService.rotate(stored);                   // revoke old, issue new
    return new TokenResponse(newAccess, newRefresh);
}`,
      interviewPoints: [
        'Long-lived, used only to obtain new access tokens.',
        'Stored and revocable on the server.',
        'Should be rotated on every use.',
      ],
    },
    {
      id: 'stateless-authentication',
      title: 'Stateless authentication',
      explanation: "With classic session authentication the server stores a session and the browser sends a `JSESSIONID` cookie; every server instance needs access to the session store. With stateless authentication, the token itself proves who the user is, so any instance can validate it with just the key.\n\nIn Spring Security you tell the framework not to create sessions with `SessionCreationPolicy.STATELESS`. The trade-off: you gain easy horizontal scaling and cross-service use, but you lose instant revocation and must handle token expiry and refresh.",
      example: `http.sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS));`,
      interviewPoints: [
        'No server-side session: each request carries its own proof.',
        'Scales horizontally without sticky sessions or a shared session store.',
        'Trade-off: harder logout and revocation.',
      ],
    },
    {
      id: 'jwt-flow',
      title: 'The full flow: login, token, request, filter validation',
      explanation: "1. The client POSTs username and password to `/api/auth/login`. 2. The controller calls `AuthenticationManager.authenticate(...)`, which uses your `UserDetailsService` and `PasswordEncoder`. 3. On success the server creates a signed access token (and a refresh token) and returns them. 4. The client stores them and sends `Authorization: Bearer <token>` on each request.\n\n5. On every request the JWT filter reads the header, verifies the signature and expiry, loads the user or reads the roles from the claims, and puts an `Authentication` into the `SecurityContextHolder`. 6. `AuthorizationFilter` checks the URL rules, and the controller runs. 7. If the token is missing or invalid the context stays empty and the request ends with 401. 8. When the access token expires, the client calls `/api/auth/refresh` to get a new one.",
      example: `@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;

    public AuthController(AuthenticationManager authenticationManager, JwtService jwtService) {
        this.authenticationManager = authenticationManager;
        this.jwtService = jwtService;
    }

    public record LoginRequest(String username, String password) { }
    public record TokenResponse(String accessToken) { }

    @PostMapping("/login")
    public TokenResponse login(@RequestBody LoginRequest request) {
        Authentication auth = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.username(), request.password()));
        UserDetails user = (UserDetails) auth.getPrincipal();
        return new TokenResponse(jwtService.generateToken(user));
    }
}`,
      interviewPoints: [
        'Login once with credentials, then send the token on every request.',
        'The filter validates the token and fills the SecurityContext.',
        'Invalid or missing token = 401; valid token without permission = 403.',
      ],
    },
    {
      id: 'jwt-service',
      title: 'Creating and validating tokens (JwtService)',
      explanation: "A small service class creates and parses tokens. The example uses the popular jjwt library (version 0.12 API). `generateToken` sets the subject, roles, issue time and expiry, and signs with the key. `extractUsername` parses the token; parsing throws a `JwtException` if the signature is wrong or the token is expired, so a successful parse means the token is valid.\n\nThe secret comes from configuration (an environment variable in production), never hard-coded in the source.",
      example: `@Service
public class JwtService {

    private final SecretKey key;
    private final Duration ttl = Duration.ofMinutes(15);

    public JwtService(@Value("\${app.jwt.secret}") String base64Secret) {
        this.key = Keys.hmacShaKeyFor(Decoders.BASE64.decode(base64Secret));
    }

    public String generateToken(UserDetails user) {
        Instant now = Instant.now();
        List<String> roles = user.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .toList();
        return Jwts.builder()
                .subject(user.getUsername())
                .claim("roles", roles)
                .issuer("shop-auth")
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plus(ttl)))
                .signWith(key)
                .compact();
    }

    public Claims parse(String token) {
        // throws ExpiredJwtException, SignatureException, MalformedJwtException ...
        return Jwts.parser()
                .verifyWith(key)
                .requireIssuer("shop-auth")
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    public String extractUsername(String token) {
        return parse(token).getSubject();
    }
}`,
      interviewPoints: [
        'Parsing with verifyWith checks signature and expiry in one step.',
        'Keep the secret out of source code; load it from environment or a vault.',
        'Use a short TTL for access tokens.',
      ],
    },
    {
      id: 'jwt-filter',
      title: 'Implementing a JWT filter (OncePerRequestFilter)',
      explanation: "`OncePerRequestFilter` guarantees the filter runs exactly once per request. The filter reads the `Authorization` header; if there is no Bearer token it simply continues the chain (public endpoints still work, protected ones will get 401 later). If there is a token, it validates it, builds a `UsernamePasswordAuthenticationToken` with the user's authorities and stores it in the `SecurityContextHolder`.\n\nRegister it with `addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class)` in a stateless `SecurityFilterChain`. Alternatively, Spring Security's built-in `oauth2ResourceServer().jwt()` does all of this for you and is preferred for production.",
      example: `@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final UserDetailsService userDetailsService;

    public JwtAuthenticationFilter(JwtService jwtService, UserDetailsService userDetailsService) {
        this.jwtService = jwtService;
        this.userDetailsService = userDetailsService;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain chain) throws ServletException, IOException {
        String header = request.getHeader(HttpHeaders.AUTHORIZATION);
        if (header == null || !header.startsWith("Bearer ")) {
            chain.doFilter(request, response);
            return;
        }
        String token = header.substring(7);
        try {
            String username = jwtService.extractUsername(token);
            if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                UserDetails user = userDetailsService.loadUserByUsername(username);
                var auth = new UsernamePasswordAuthenticationToken(user, null, user.getAuthorities());
                auth.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                SecurityContextHolder.getContext().setAuthentication(auth);
            }
        } catch (JwtException e) {
            SecurityContextHolder.clearContext();   // invalid token: stay unauthenticated -> 401
        }
        chain.doFilter(request, response);
    }
}

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    SecurityFilterChain securityFilterChain(HttpSecurity http,
                                            JwtAuthenticationFilter jwtFilter) throws Exception {
        return http
                .csrf(csrf -> csrf.disable())
                .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/api/auth/**").permitAll()
                        .anyRequest().authenticated())
                .exceptionHandling(ex -> ex
                        .authenticationEntryPoint(new HttpStatusEntryPoint(HttpStatus.UNAUTHORIZED)))
                .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class)
                .build();
    }

    @Bean
    AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}`,
      interviewPoints: [
        'Extend OncePerRequestFilter and always call chain.doFilter.',
        'Do not throw on a missing token; let authorization decide.',
        'Register with addFilterBefore(..., UsernamePasswordAuthenticationFilter.class).',
        'Mark the chain STATELESS and disable CSRF for header-based tokens.',
      ],
    },
    {
      id: 'expiry-rotation',
      title: 'Token expiry and rotation',
      explanation: "Every access token must have an `exp` claim. Short expiry limits the damage of a stolen token. When the API returns 401 because the token expired, the client calls the refresh endpoint and retries the request.\n\nRefresh token rotation means every refresh returns a brand-new refresh token and invalidates the old one. If an old refresh token is ever used again, that is a sign of theft, so the server revokes the whole token family and forces a new login. Signing keys should also be rotated periodically, using a `kid` (key id) header so old and new keys can be valid during the switch.",
      interviewPoints: [
        'Access token: minutes. Refresh token: days, rotated on every use.',
        'Reuse of a rotated refresh token signals theft: revoke the family.',
        'Allow a little clock skew (for example 30 to 60 seconds) when checking exp.',
        'Rotate signing keys with a kid header and a JWKS endpoint.',
      ],
    },
    {
      id: 'client-storage',
      title: 'Where to store tokens on the client',
      explanation: "`localStorage` is easy but any JavaScript on the page can read it, so a single XSS bug leaks the token. An `HttpOnly`, `Secure`, `SameSite` cookie cannot be read by JavaScript, which protects against XSS theft, but because cookies are sent automatically you then need CSRF protection.\n\nA common balanced approach for browser apps: keep the short-lived access token in memory (a JavaScript variable) and store the refresh token in an `HttpOnly` `SameSite=Strict` cookie scoped to the refresh endpoint. Many teams go further and use the Backend-for-Frontend pattern, where the browser only has a session cookie and the server holds the tokens. Mobile apps use the platform's secure storage (Keychain, Keystore).",
      example: `ResponseCookie cookie = ResponseCookie.from("refresh_token", refreshToken)
        .httpOnly(true)
        .secure(true)
        .sameSite("Strict")
        .path("/api/auth/refresh")
        .maxAge(Duration.ofDays(7))
        .build();
response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());`,
      interviewPoints: [
        'localStorage is vulnerable to XSS.',
        'HttpOnly cookies resist XSS but need CSRF protection.',
        'Access token in memory + refresh token in HttpOnly cookie is a common compromise.',
        'BFF pattern keeps tokens out of the browser entirely.',
      ],
    },
    {
      id: 'revocation-logout',
      title: 'Revocation and logout strategies',
      explanation: "A JWT stays valid until `exp`, even after logout, because the server does not track it. Options: 1) keep access tokens short and on logout delete the refresh token from the server and the client; 2) keep a denylist of revoked token ids (`jti`) in Redis until they expire; 3) store a `tokenVersion` per user and put it in the token, then bump it to invalidate all tokens (for example after a password change); 4) use opaque tokens with introspection when instant revocation is critical.\n\nEach extra check brings back some state, so choose based on how quickly revocation must take effect.",
      example: `// Denylist check inside the JWT filter
Claims claims = jwtService.parse(token);
if (Boolean.TRUE.equals(redisTemplate.hasKey("jwt:denylist:" + claims.getId()))) {
    throw new JwtException("Token revoked");
}

// On logout: denylist until the token would expire anyway
Duration remaining = Duration.between(Instant.now(), claims.getExpiration().toInstant());
redisTemplate.opsForValue().set("jwt:denylist:" + claims.getId(), "1", remaining);`,
      interviewPoints: [
        'Logout on the client alone does not invalidate a JWT.',
        'Short access tokens + revocable refresh tokens is the usual baseline.',
        'Denylist by jti in Redis with TTL equal to remaining lifetime.',
        'Token version per user invalidates all sessions at once.',
      ],
    },
    {
      id: 'jwt-mistakes',
      title: 'Common JWT security mistakes',
      explanation: "Typical mistakes are: accepting the `none` algorithm or letting the token header choose the algorithm (algorithm confusion); using a short guessable HMAC secret; not checking `exp`, `iss` or `aud`; putting sensitive data in the payload; very long-lived access tokens with no refresh strategy; storing tokens in `localStorage` in an app with XSS risk; logging full tokens; and sending tokens over plain HTTP.\n\nUsing a well-tested library (jjwt, Nimbus via Spring's resource server) and letting it perform validation avoids most of these.",
      interviewPoints: [
        'Pin the algorithm; never accept alg none.',
        'Use a strong secret (at least 256 bits) or asymmetric keys.',
        'Validate exp, iss and aud.',
        'No secrets or PII in the payload; always use HTTPS.',
      ],
    },
  ],

  commonMistakes: [
    'Thinking the JWT payload is encrypted and putting passwords, card numbers or other sensitive data in it.',
    'Issuing access tokens valid for days or weeks, so a leaked token cannot be stopped.',
    'Hard-coding a short HMAC secret like "secret" in application.properties or source control.',
    'Throwing an exception in the JWT filter when the Authorization header is missing, which breaks public endpoints.',
    'Forgetting SessionCreationPolicy.STATELESS, so Spring still creates HTTP sessions alongside the tokens.',
    'Assuming logout on the client invalidates the token, while it remains usable until it expires.',
    'Not validating issuer and audience, so tokens meant for another service are accepted.',
  ],

  interviewTips: [
    'Draw or describe the flow step by step: login, token issued, Bearer header, filter validates, SecurityContext, controller.',
    'Always mention the trade-off: stateless scaling versus difficult revocation, and how refresh tokens bridge the gap.',
    'Be explicit that Base64URL is encoding, not encryption, and that the signature gives integrity only.',
    'Mention that Spring Security has built-in JWT support via oauth2ResourceServer().jwt(), which shows you know the production-grade option.',
    'When asked about storage, compare localStorage (XSS) with HttpOnly cookies (CSRF) instead of claiming one is perfect.',
  ],

  interviewQuestions: [
    {
      id: 'security-jwt-q1',
      question: 'What is a JWT and what are its three parts?',
      answer: "A JSON Web Token is a compact, URL-safe token that carries claims about a user and is digitally signed. It has three Base64URL-encoded parts separated by dots: the header (token type and signing algorithm, for example HS256), the payload (claims such as `sub`, `exp` and roles) and the signature (computed over header and payload with a secret or private key).\n\nThe server verifies the signature to be sure the token was issued by a trusted party and has not been modified. The payload can be decoded by anyone, so it must not contain secrets.",
      points: [
        'header.payload.signature',
        'Encoded, not encrypted.',
        'Signature ensures integrity and authenticity.',
      ],
      difficulty: 'Beginner',
    },
    {
      id: 'security-jwt-q2',
      question: 'What is the difference between an access token and a refresh token?',
      answer: "The access token is short-lived (minutes) and is sent with every API request to prove who the user is. The refresh token is long-lived (days) and is used only to obtain a new access token from a dedicated refresh endpoint when the old one expires.\n\nThis split means a stolen access token is only useful briefly, while the user still does not have to log in every 15 minutes. Refresh tokens are stored on the server so they can be revoked, and they should be rotated on each use.",
      points: [
        'Access token: short-lived, sent to every API.',
        'Refresh token: long-lived, sent only to the refresh endpoint.',
        'Refresh tokens are revocable and rotated.',
      ],
      difficulty: 'Beginner',
    },
    {
      id: 'security-jwt-q3',
      question: 'What does stateless authentication mean and what are its pros and cons?',
      answer: "Stateless authentication means the server keeps no session for the user. Each request carries a self-contained token that the server can verify with only a key, checking the signature and expiry.\n\nPros: any instance can handle any request (no sticky sessions or shared session store), which makes horizontal scaling and microservices easier, and it works well for mobile and third-party clients. Cons: tokens cannot be revoked instantly, role changes are not reflected until a new token is issued, tokens are larger than a session id, and you must manage expiry and refresh.",
      points: [
        'No server session; the token is the proof.',
        'Easy horizontal scaling.',
        'Hard to revoke; claims can be stale.',
      ],
      difficulty: 'Beginner',
    },
    {
      id: 'security-jwt-q4',
      question: 'Walk through the JWT authentication flow in a Spring Boot application.',
      answer: "The client sends credentials to a public `/api/auth/login` endpoint. The controller calls `AuthenticationManager.authenticate` with a `UsernamePasswordAuthenticationToken`; this uses the `UserDetailsService` and `PasswordEncoder`. On success a `JwtService` builds a signed token with the username, roles and expiry, and returns it (plus a refresh token).\n\nThe client then sends `Authorization: Bearer <token>` on each request. A custom `OncePerRequestFilter`, registered before `UsernamePasswordAuthenticationFilter`, extracts and validates the token, creates an `Authentication` with the user's authorities and stores it in the `SecurityContextHolder`. The authorization rules then allow or deny the request. The chain is configured as stateless with CSRF disabled.",
      points: [
        'Login endpoint authenticates via AuthenticationManager and returns tokens.',
        'Bearer token in the Authorization header on each request.',
        'OncePerRequestFilter validates and populates the SecurityContext.',
        'STATELESS session policy.',
      ],
      difficulty: 'Intermediate',
    },
    {
      id: 'security-jwt-q5',
      question: 'How do you implement a JWT filter in Spring Security 6?',
      answer: "Create a class extending `OncePerRequestFilter` and override `doFilterInternal`. Read the `Authorization` header; if it is missing or does not start with `Bearer `, call `chain.doFilter` and return. Otherwise extract the token, validate it (signature, expiry, issuer), load the user or read authorities from claims, create a `UsernamePasswordAuthenticationToken(principal, null, authorities)` and set it on the `SecurityContextHolder`. Always continue the chain at the end.\n\nThen register it in the `SecurityFilterChain` bean with `addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class)`, set the session policy to STATELESS and permit the auth endpoints.",
      example: `String header = request.getHeader("Authorization");
if (header == null || !header.startsWith("Bearer ")) {
    chain.doFilter(request, response);
    return;
}
String username = jwtService.extractUsername(header.substring(7));
UserDetails user = userDetailsService.loadUserByUsername(username);
SecurityContextHolder.getContext().setAuthentication(
        new UsernamePasswordAuthenticationToken(user, null, user.getAuthorities()));
chain.doFilter(request, response);`,
      points: [
        'OncePerRequestFilter runs once per request.',
        'Pass through when no token is present.',
        'Set an authenticated token with authorities in the SecurityContext.',
        'addFilterBefore UsernamePasswordAuthenticationFilter.',
      ],
      difficulty: 'Intermediate',
    },
    {
      id: 'security-jwt-q6',
      question: 'What is the difference between HS256 and RS256, and which would you use for microservices?',
      answer: "HS256 is symmetric: the same secret signs and verifies tokens. Every service that verifies tokens must know the secret, which also lets it create valid tokens, so a leak anywhere compromises everything.\n\nRS256 (and ES256) is asymmetric: only the auth server has the private key to sign, while all other services verify with the public key, usually fetched from a JWKS endpoint. For microservices RS256/ES256 is the better choice, because services can verify but not forge tokens, and keys can be rotated using the `kid` header.",
      points: [
        'HS256 = shared secret; RS256 = private/public key pair.',
        'Asymmetric keys let services verify without being able to sign.',
        'JWKS endpoint + kid supports key rotation.',
      ],
      difficulty: 'Intermediate',
    },
    {
      id: 'security-jwt-q7',
      question: 'Where should a browser application store JWTs?',
      answer: "There is no perfect answer, only trade-offs. `localStorage` or `sessionStorage` is readable by any script, so an XSS vulnerability leaks the token. An `HttpOnly` `Secure` `SameSite` cookie cannot be read by JavaScript, protecting against XSS theft, but the browser sends it automatically, so you need CSRF protection.\n\nA common recommendation is to keep the short-lived access token in memory and put the refresh token in an `HttpOnly` cookie limited to the refresh path. For high-security apps the Backend-for-Frontend pattern keeps tokens on the server and gives the browser only a session cookie.",
      points: [
        'localStorage: simple but XSS-exposed.',
        'HttpOnly cookie: XSS-resistant but needs CSRF defence.',
        'Access token in memory, refresh token in HttpOnly cookie.',
        'BFF pattern for the strongest isolation.',
      ],
      difficulty: 'Intermediate',
    },
    {
      id: 'security-jwt-q8',
      question: 'How do you implement logout or revoke a JWT before it expires?',
      answer: "Because the server does not store JWTs, you cannot simply delete them. Common strategies: keep access tokens short and, on logout, delete the refresh token from the server so no new access tokens can be issued; maintain a denylist of revoked `jti` values in Redis with a TTL equal to the token's remaining lifetime and check it in the filter; or keep a `tokenVersion` on the user record, include it as a claim and reject tokens with an older version (useful after a password change).\n\nIf revocation must be instant everywhere, use opaque tokens with an introspection endpoint instead. Each approach adds some state back, trading pure statelessness for control.",
      points: [
        'Client-side deletion alone is not revocation.',
        'Revoke the server-stored refresh token on logout.',
        'Denylist jti in Redis with TTL.',
        'Token version per user for global logout.',
      ],
      difficulty: 'Advanced',
    },
    {
      id: 'security-jwt-q9',
      question: 'What is refresh token rotation and how does it detect token theft?',
      answer: "With rotation, every time a refresh token is used the server issues a new refresh token and immediately invalidates the old one. The tokens from one login form a 'family' stored in the database.\n\nIf an attacker steals a refresh token and both the attacker and the real user try to use it, one of them will present a token that has already been used. The server detects this reuse, assumes theft, revokes every token in that family and forces the user to log in again. This limits the lifetime of a stolen refresh token to a single use.",
      points: [
        'New refresh token on every refresh; old one invalidated.',
        'Reuse of an old token signals theft.',
        'Revoke the whole token family on reuse.',
        'Store refresh tokens hashed, like passwords.',
      ],
      difficulty: 'Advanced',
    },
    {
      id: 'security-jwt-q10',
      question: 'What are the most common JWT security mistakes and how do you avoid them?',
      answer: "Common mistakes: accepting the `none` algorithm or letting the token choose its algorithm, which allows forged tokens; using a weak HMAC secret that can be brute-forced; skipping validation of `exp`, `iss` and `aud`; storing sensitive data in the readable payload; issuing long-lived access tokens with no revocation plan; storing tokens in `localStorage` in an app with XSS risk; logging full tokens; and not using HTTPS.\n\nAvoid them by using a mature library with a pinned algorithm, a strong key (256-bit secret or RSA/EC keys) kept in a vault or environment variable, short access token lifetimes with rotated refresh tokens, full claim validation, and HTTPS everywhere. In Spring, the built-in resource server (`oauth2ResourceServer().jwt()`) handles most validation correctly by default.",
      points: [
        'Pin the algorithm and reject alg none.',
        'Strong keys stored outside the code.',
        'Validate exp, iss, aud.',
        'Short lifetimes, HTTPS, no sensitive claims, no token logging.',
      ],
      difficulty: 'Advanced',
    },
  ],
}

export default topic
