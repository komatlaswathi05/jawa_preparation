const topic = {
  id: 'security-oauth2',
  category: 'security',
  title: 'OAuth2 & OpenID Connect in Depth',
  description: "The OAuth2 roles, tokens and grant types step by step, Spring Boot resource servers and clients, Keycloak roles, service-to-service calls, token relay and testing.",
  difficulty: 'Advanced',
  overview: "Writing your own login endpoint and signing your own JWTs works for small applications, but most companies centralise identity in an authorization server such as Keycloak, Okta, Auth0, Microsoft Entra ID or Google. Your Spring Boot services then stop handling passwords at all. They either act as OAuth2 clients (redirecting users to log in and receiving tokens) or as resource servers (APIs that accept and validate access tokens).\n\nThink of a hotel. You show your passport once at reception (the authorization server), and they give you a key card (the access token). The key card opens your room and the gym (the resource servers), expires at checkout, and does not reveal your passport number to the gym. Different guests get cards that open different doors (scopes and roles).\n\nThe fundamentals topic introduced the four OAuth2 roles and OIDC. This topic goes deeper: how each flow works step by step, why PKCE exists, how to configure Spring Boot as a resource server and as a client, how to map Keycloak roles to Spring authorities, how microservices call each other with client credentials, and how to test secured endpoints. Examples use a shop with an `order-service` API, an `inventory-service` and a Keycloak realm called `shop`.",

  subtopics: [
    {
      id: 'roles-and-tokens',
      title: 'Roles, tokens and scopes',
      explanation: "OAuth2 has four roles. The resource owner is the user. The client is the application that wants to act on the user's behalf (a single-page app, a mobile app, a backend). The authorization server authenticates the user and issues tokens. The resource server is the API that accepts tokens.\n\nThree kinds of tokens appear: the access token (sent to APIs in the `Authorization: Bearer` header, short-lived, often a JWT), the refresh token (used by the client to get a new access token without asking the user to log in again) and, with OpenID Connect, the ID token (a JWT describing the user, meant only for the client). Scopes such as `orders.read` describe what the client is allowed to do; the user sees them on the consent screen.",
      example: `# a decoded access token issued by Keycloak (payload only)
{
  "iss": "https://auth.shop.example.com/realms/shop",
  "sub": "5b1c7e0a-6f2d-4e2b-9a57-0c1d2e3f4a5b",
  "aud": "order-service",
  "azp": "shop-web",
  "exp": 1790000300,
  "iat": 1790000000,
  "scope": "openid orders.read orders.write",
  "preferred_username": "asha",
  "realm_access": { "roles": ["CUSTOMER"] }
}

# the client calls the API
GET /api/orders HTTP/1.1
Host: api.shop.example.com
Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...`,
      interviewPoints: [
        "Resource owner, client, authorization server, resource server.",
        "Access token for APIs, refresh token for renewal, ID token for identity.",
        "Scopes limit what the client may do.",
        "iss, sub, aud, exp are the key claims.",
      ],
    },
    {
      id: 'authorization-code-pkce',
      title: 'Authorization Code flow with PKCE, step by step',
      explanation: "This is the flow for anything a user logs into: web apps, SPAs and mobile apps.\n\n1. The client generates a random `code_verifier` and derives `code_challenge = BASE64URL(SHA-256(code_verifier))`.\n2. It redirects the browser to the authorization server's `/authorize` endpoint with `response_type=code`, its `client_id`, `redirect_uri`, `scope`, a random `state` and the `code_challenge`.\n3. The user logs in (and consents) on the authorization server's own page; the client never sees the password.\n4. The authorization server redirects back to `redirect_uri` with a short-lived, single-use `code` and the same `state`.\n5. The client checks `state` (against CSRF) and sends the `code` plus the original `code_verifier` to the `/token` endpoint.\n6. The server hashes the verifier, compares it to the challenge, and returns the access token, refresh token and ID token.\n\nPKCE (Proof Key for Code Exchange) protects against an attacker who intercepts the code: without the verifier, which never left the client, the code is useless. It is required for public clients (SPAs, mobile apps) and recommended for all clients in OAuth 2.1.",
      example: `# step 2: browser redirect
GET https://auth.shop.example.com/realms/shop/protocol/openid-connect/auth
    ?response_type=code
    &client_id=shop-web
    &redirect_uri=https://shop.example.com/callback
    &scope=openid%20orders.read
    &state=af0ifjsldkj
    &code_challenge=E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM
    &code_challenge_method=S256

# step 4: redirect back
HTTP/1.1 302 Found
Location: https://shop.example.com/callback?code=SplxlOBeZQQYbYS6WxSbIA&state=af0ifjsldkj

# step 5: back-channel token request
POST /realms/shop/protocol/openid-connect/token
Content-Type: application/x-www-form-urlencoded

grant_type=authorization_code
&code=SplxlOBeZQQYbYS6WxSbIA
&redirect_uri=https://shop.example.com/callback
&client_id=shop-web
&code_verifier=dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk

# step 6: response
{ "access_token": "eyJ...", "refresh_token": "eyJ...", "id_token": "eyJ...",
  "token_type": "Bearer", "expires_in": 300 }`,
      interviewPoints: [
        "User logs in on the authorization server, not in the client.",
        "Code is exchanged for tokens over a back channel.",
        "PKCE binds the code to the client that started the flow.",
        "state protects against CSRF on the redirect.",
      ],
    },
    {
      id: 'client-credentials',
      title: 'Client Credentials flow',
      explanation: "When there is no user, for example a nightly job in `order-service` calling `inventory-service`, the client authenticates as itself. It sends its `client_id` and `client_secret` (or a signed JWT, or mutual TLS) to the token endpoint with `grant_type=client_credentials` and receives an access token. There is no refresh token; the client simply requests a new access token when the old one expires.\n\nThe token represents the service, not a person, so authorization is based on the client's scopes or roles (for example `inventory.reserve`). Keep the client secret in a secret store, never in the Git repository.",
      example: `POST /realms/shop/protocol/openid-connect/token
Content-Type: application/x-www-form-urlencoded
Authorization: Basic b3JkZXItc2VydmljZTpzM2NyM3Q=   # client_id:client_secret

grant_type=client_credentials&scope=inventory.reserve

{ "access_token": "eyJ...", "token_type": "Bearer", "expires_in": 300 }`,
      interviewPoints: [
        "Machine-to-machine, no user involved.",
        "Client authenticates with its own credentials.",
        "No refresh token; request a new token when it expires.",
        "Authorize by client scopes/roles.",
      ],
    },
    {
      id: 'deprecated-grants',
      title: 'Deprecated grants: Implicit and Password',
      explanation: "The Implicit grant returned the access token directly in the redirect URL fragment. It was designed for browsers before CORS existed, but tokens in URLs leak through browser history, logs and referrer headers, and there is no way to bind them to the client. SPAs should use Authorization Code with PKCE instead.\n\nThe Resource Owner Password Credentials grant had the client collect the user's username and password and send them to the token endpoint. It defeats the purpose of OAuth2 (the client sees the password), cannot support multi-factor authentication or social login, and trains users to type passwords into third-party apps. Both are removed in OAuth 2.1. The Device Authorization grant exists for devices without a browser, such as smart TVs.",
      example: `# Implicit (deprecated): token in the URL fragment
https://shop.example.com/callback#access_token=eyJ...&token_type=Bearer

# Password (deprecated): the client handles the password
grant_type=password&username=asha&password=hunter2&client_id=shop-web

# Use instead
grant_type=authorization_code + PKCE     # users
grant_type=client_credentials            # services
urn:ietf:params:oauth:grant-type:device_code   # TVs, CLIs`,
      interviewPoints: [
        "Implicit leaks tokens via URLs; replaced by code + PKCE.",
        "Password grant exposes the password to the client.",
        "Both removed in OAuth 2.1.",
        "Device grant for input-constrained devices.",
      ],
    },
    {
      id: 'resource-server',
      title: 'Spring Boot as a resource server (JWT)',
      explanation: "An API that accepts access tokens needs `spring-boot-starter-oauth2-resource-server`. Set `issuer-uri` and, at startup, Spring reads the issuer's OpenID discovery document to find its JWK Set URI (the public keys). For every request it then validates the token's signature with those keys, plus `exp`, `nbf` and `iss`. Keys are cached and refreshed automatically when the server rotates them.\n\nAlso validate the audience (`aud`) so a token issued for another API cannot be replayed against yours. Spring Boot 3.2+ supports `audiences` in configuration. By default, each scope becomes an authority with the `SCOPE_` prefix, so `hasAuthority(\"SCOPE_orders.read\")` checks for the `orders.read` scope.",
      example: `# application.yml
spring:
  security:
    oauth2:
      resourceserver:
        jwt:
          issuer-uri: https://auth.shop.example.com/realms/shop
          audiences: order-service

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    SecurityFilterChain api(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())                 // stateless API with bearer tokens
            .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/actuator/health/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/orders/**").hasAuthority("SCOPE_orders.read")
                .requestMatchers("/api/orders/**").hasAuthority("SCOPE_orders.write")
                .anyRequest().authenticated())
            .oauth2ResourceServer(oauth2 -> oauth2.jwt(Customizer.withDefaults()));
        return http.build();
    }
}

@GetMapping("/api/orders/me")
public List<OrderDto> myOrders(@AuthenticationPrincipal Jwt jwt) {
    return orderService.findByCustomer(jwt.getSubject());
}`,
      interviewPoints: [
        "issuer-uri: discovery, JWK Set, signature and claim validation.",
        "Validate aud to prevent token reuse across APIs.",
        "Scopes become SCOPE_ authorities.",
        "Access claims with @AuthenticationPrincipal Jwt.",
      ],
    },
    {
      id: 'mapping-roles',
      title: 'Mapping Keycloak roles to Spring authorities',
      explanation: "Keycloak puts realm roles in a nested claim, `realm_access.roles`, and Spring does not read it by default. To use `hasRole(\"ADMIN\")`, provide a `JwtAuthenticationConverter` with a converter that reads the roles, adds the `ROLE_` prefix and merges them with the scope authorities. You can also set the principal name to a friendlier claim such as `preferred_username`.\n\nFor flat claims, such as a top-level `roles` array from another provider, `JwtGrantedAuthoritiesConverter` with `setAuthoritiesClaimName(\"roles\")` and `setAuthorityPrefix(\"ROLE_\")` is enough.",
      example: `@Bean
JwtAuthenticationConverter jwtAuthenticationConverter() {
    JwtGrantedAuthoritiesConverter scopes = new JwtGrantedAuthoritiesConverter();   // SCOPE_xxx

    Converter<Jwt, Collection<GrantedAuthority>> authorities = jwt -> {
        Collection<GrantedAuthority> result = new ArrayList<>(scopes.convert(jwt));

        Map<String, Object> realmAccess = jwt.getClaimAsMap("realm_access");
        if (realmAccess != null && realmAccess.get("roles") instanceof Collection<?> roles) {
            roles.forEach(role -> result.add(new SimpleGrantedAuthority("ROLE_" + role)));
        }
        return result;
    };

    JwtAuthenticationConverter converter = new JwtAuthenticationConverter();
    converter.setJwtGrantedAuthoritiesConverter(authorities);
    converter.setPrincipalClaimName("preferred_username");
    return converter;
}

// Spring Boot picks up the JwtAuthenticationConverter bean automatically
@PreAuthorize("hasRole('ADMIN')")
@DeleteMapping("/api/orders/{id}")
public void cancel(@PathVariable Long id) { ... }`,
      interviewPoints: [
        "Default mapping only covers scopes (SCOPE_ prefix).",
        "Keycloak roles live in realm_access.roles.",
        "Custom JwtAuthenticationConverter adds ROLE_ authorities.",
        "setPrincipalClaimName for a readable principal.",
      ],
    },
    {
      id: 'opaque-tokens',
      title: 'JWT vs opaque tokens and introspection',
      explanation: "A JWT access token is self-contained: the resource server validates it locally with the public key, which is fast and needs no network call per request. The downside is that it cannot be revoked before it expires, so lifetimes are kept short (5 to 15 minutes).\n\nAn opaque token is a random string with no readable content. The resource server must ask the authorization server's introspection endpoint whether it is active and what it contains. This allows instant revocation but adds latency and load on the authorization server; results are often cached briefly. Spring supports both.",
      example: `# opaque tokens
spring:
  security:
    oauth2:
      resourceserver:
        opaquetoken:
          introspection-uri: https://auth.shop.example.com/realms/shop/protocol/openid-connect/token/introspect
          client-id: order-service
          client-secret: \${INTROSPECTION_SECRET}

http.oauth2ResourceServer(oauth2 -> oauth2.opaqueToken(Customizer.withDefaults()));

# introspection response
{ "active": true, "sub": "5b1c...", "scope": "orders.read", "exp": 1790000300 }`,
      interviewPoints: [
        "JWT: local validation, fast, hard to revoke.",
        "Opaque: introspection call, revocable, slower.",
        "Short JWT lifetime compensates for no revocation.",
      ],
    },
    {
      id: 'oauth2-login',
      title: 'Spring Boot as a client: oauth2Login()',
      explanation: "When your Spring Boot application renders pages or acts as a backend for a frontend, it is an OAuth2 client. Add `spring-boot-starter-oauth2-client`, register the provider and call `http.oauth2Login()`. Spring redirects unauthenticated users to the provider, handles the callback at `/login/oauth2/code/{registrationId}`, exchanges the code (with PKCE), validates the ID token and creates an HTTP session containing an `OidcUser`.\n\nFor common providers such as Google and GitHub, Spring Boot already knows the endpoints. For Keycloak or any OIDC provider, set `issuer-uri` and Spring discovers the rest. The tokens are stored server-side in an `OAuth2AuthorizedClientService`, so they never reach the browser.",
      example: `spring:
  security:
    oauth2:
      client:
        registration:
          keycloak:
            client-id: shop-web
            client-secret: \${SHOP_WEB_SECRET}
            scope: openid, profile, email, orders.read
        provider:
          keycloak:
            issuer-uri: https://auth.shop.example.com/realms/shop

@Bean
SecurityFilterChain web(HttpSecurity http) throws Exception {
    http
        .authorizeHttpRequests(auth -> auth
            .requestMatchers("/", "/css/**").permitAll()
            .anyRequest().authenticated())
        .oauth2Login(Customizer.withDefaults())
        .logout(logout -> logout.logoutSuccessUrl("/"));
    return http.build();
}

@GetMapping("/profile")
public String profile(@AuthenticationPrincipal OidcUser user, Model model) {
    model.addAttribute("name", user.getFullName());
    model.addAttribute("email", user.getEmail());
    return "profile";
}`,
      interviewPoints: [
        "oauth2Login handles redirect, callback, code exchange and ID token validation.",
        "issuer-uri enables discovery for any OIDC provider.",
        "Result is a session with an OidcUser principal.",
        "Tokens are kept server-side.",
      ],
    },
    {
      id: 'bff',
      title: 'SPAs and the Backend-for-Frontend pattern',
      explanation: "A React or Angular SPA can run the Authorization Code + PKCE flow itself and hold tokens in memory, but any token accessible to JavaScript can be stolen by an XSS attack, and refresh tokens in the browser are especially risky.\n\nThe Backend-for-Frontend (BFF) pattern, now recommended for browser apps, moves the OAuth2 client to a small server-side component, often Spring Cloud Gateway or a Spring Boot app with `oauth2Login()`. The browser only gets an HttpOnly, Secure, SameSite session cookie. The BFF keeps the tokens, refreshes them, and adds the access token when forwarding API calls to resource servers. Because it is cookie-based, CSRF protection must be enabled on the BFF.",
      example: `Browser (React)                BFF (Spring Cloud Gateway)          order-service
     |  GET /api/orders  (cookie)      |                                  |
     | ------------------------------> |  session -> access token         |
     |                                 |  GET /api/orders                 |
     |                                 |  Authorization: Bearer eyJ...    |
     |                                 | -------------------------------> |
     |                                 | <------------------------------- |
     | <------------------------------ |                                  |

Set-Cookie: SESSION=4f1c...; HttpOnly; Secure; SameSite=Lax; Path=/`,
      interviewPoints: [
        "Tokens in JavaScript are exposed to XSS.",
        "BFF keeps tokens server-side, browser gets a cookie.",
        "BFF relays the access token to APIs.",
        "Cookie-based means CSRF protection is needed.",
      ],
    },
    {
      id: 'service-to-service',
      title: 'Service-to-service calls with client credentials',
      explanation: "When `order-service` calls `inventory-service` on its own behalf, register a client with `authorization-grant-type: client_credentials`. Spring's `OAuth2AuthorizedClientManager` obtains the token, caches it and requests a new one shortly before it expires.\n\nWith Spring Security 6.4+, `OAuth2ClientHttpRequestInterceptor` plugs this into `RestClient`: every request gets a valid `Authorization: Bearer` header automatically. For WebClient, use `ServletOAuth2AuthorizedClientExchangeFilterFunction`. If the call should carry the end user's identity instead, forward the user's token (token relay) or use Token Exchange (RFC 8693).",
      example: `spring:
  security:
    oauth2:
      client:
        registration:
          inventory-client:
            provider: keycloak
            client-id: order-service
            client-secret: \${ORDER_SERVICE_SECRET}
            authorization-grant-type: client_credentials
            scope: inventory.reserve
        provider:
          keycloak:
            issuer-uri: https://auth.shop.example.com/realms/shop

import static org.springframework.security.oauth2.client.web.client.RequestAttributeClientRegistrationIdResolver.clientRegistrationId;

@Configuration
public class InventoryClientConfig {

    @Bean
    RestClient inventoryRestClient(RestClient.Builder builder,
                                   OAuth2AuthorizedClientManager authorizedClientManager) {
        return builder
            .baseUrl("http://inventory-service")
            .requestInterceptor(new OAuth2ClientHttpRequestInterceptor(authorizedClientManager))
            .build();
    }
}

@Service
public class InventoryClient {

    private final RestClient inventoryRestClient;

    public InventoryClient(RestClient inventoryRestClient) {
        this.inventoryRestClient = inventoryRestClient;
    }

    public void reserve(ReserveRequest request) {
        inventoryRestClient.post()
            .uri("/api/reservations")
            .attributes(clientRegistrationId("inventory-client"))   // which registration to use
            .body(request)
            .retrieve()
            .toBodilessEntity();
    }
}`,
      interviewPoints: [
        "client_credentials registration for service identity.",
        "OAuth2AuthorizedClientManager fetches and caches tokens.",
        "OAuth2ClientHttpRequestInterceptor for RestClient (Security 6.4+).",
        "Token relay or token exchange to keep the user's identity.",
      ],
    },
    {
      id: 'token-relay',
      title: 'Token relay through the API gateway',
      explanation: "In a microservice system, the gateway is often the OAuth2 client (the BFF) and the downstream services are resource servers. Spring Cloud Gateway's `TokenRelay` filter takes the access token of the logged-in user from the session and adds it as a bearer token to the proxied request, refreshing it if needed. Each downstream service validates the token independently, so there is no implicit trust in the network.\n\nWhen a resource server itself calls another resource server as part of the same user request, it can forward the incoming bearer token so the next service knows who the user is, as long as that service accepts the audience. For stricter setups, Token Exchange issues a new, narrower token for the downstream audience.",
      example: `# Spring Cloud Gateway (also an OAuth2 client with oauth2Login)
spring:
  cloud:
    gateway:
      routes:
        - id: orders
          uri: http://order-service
          predicates:
            - Path=/api/orders/**
          filters:
            - TokenRelay=

# forwarding the incoming token from order-service to another resource server
@GetMapping("/api/orders/{id}/shipment")
public ShipmentDto shipment(@PathVariable Long id, @AuthenticationPrincipal Jwt jwt) {
    return restClient.get()
        .uri("http://shipping-service/api/shipments/order/{id}", id)
        .headers(h -> h.setBearerAuth(jwt.getTokenValue()))
        .retrieve()
        .body(ShipmentDto.class);
}`,
      interviewPoints: [
        "TokenRelay filter forwards the user's access token.",
        "Every service validates tokens: zero trust.",
        "Forwarding requires matching audience.",
        "Token Exchange for narrower downstream tokens.",
      ],
    },
    {
      id: 'keycloak',
      title: 'Keycloak and Spring Authorization Server',
      explanation: "Keycloak is a popular open-source identity and access management server. You create a realm (an isolated tenant, such as `shop`), register clients (`shop-web` as a confidential client with the standard flow, `order-service` with service accounts enabled for client credentials), define roles and client scopes, and manage users or connect an existing LDAP or social login. It exposes standard OIDC endpoints, so Spring only needs the `issuer-uri`.\n\nSpring Authorization Server is a framework for building your own authorization server in Spring Boot, useful when you need full control or want to embed it. For most teams, a managed service (Okta, Auth0, Entra ID, Cognito) or Keycloak is less work and less risk than running custom identity code.",
      example: `# run Keycloak locally
docker run -p 8081:8080 \\
  -e KC_BOOTSTRAP_ADMIN_USERNAME=admin \\
  -e KC_BOOTSTRAP_ADMIN_PASSWORD=admin \\
  quay.io/keycloak/keycloak:26.0 start-dev

# discovery document Spring reads from issuer-uri
GET http://localhost:8081/realms/shop/.well-known/openid-configuration
{
  "issuer": "http://localhost:8081/realms/shop",
  "authorization_endpoint": ".../protocol/openid-connect/auth",
  "token_endpoint": ".../protocol/openid-connect/token",
  "jwks_uri": ".../protocol/openid-connect/certs",
  ...
}`,
      interviewPoints: [
        "Realm, clients, roles, client scopes, users.",
        "Standard OIDC discovery; Spring needs only issuer-uri.",
        "Service accounts enable client credentials.",
        "Prefer a proven server over custom identity code.",
      ],
    },
    {
      id: 'testing-oauth2',
      title: 'Testing secured endpoints',
      explanation: "You do not need a running authorization server to test controllers. Spring Security Test provides request post-processors that put a mock authentication into the security context. `jwt()` creates a `JwtAuthenticationToken` with claims and authorities you choose; `oidcLogin()` and `oauth2Login()` do the same for client applications.\n\nFor integration tests that must validate real tokens end to end, run Keycloak in a Testcontainer (for example with the `dasniko/testcontainers-keycloak` library), import a realm file and obtain tokens with a client credentials request.",
      example: `import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;

@WebMvcTest(OrderController.class)
@Import(SecurityConfig.class)
class OrderControllerTest {

    @Autowired MockMvc mockMvc;
    @MockitoBean OrderService orderService;

    @Test
    void readsOrdersWithScope() throws Exception {
        mockMvc.perform(get("/api/orders")
                .with(jwt().authorities(new SimpleGrantedAuthority("SCOPE_orders.read"))))
            .andExpect(status().isOk());
    }

    @Test
    void rejectsMissingScope() throws Exception {
        mockMvc.perform(get("/api/orders").with(jwt()))
            .andExpect(status().isForbidden());
    }

    @Test
    void rejectsAnonymous() throws Exception {
        mockMvc.perform(get("/api/orders"))
            .andExpect(status().isUnauthorized());
    }
}`,
      interviewPoints: [
        "jwt() post-processor mocks a bearer token.",
        "Test 401 (no token) and 403 (wrong scope).",
        "oidcLogin() for client apps.",
        "Keycloak Testcontainer for end-to-end tests.",
      ],
    },
  ],

  commonMistakes: [
    "Saying OAuth2 is an authentication protocol; it is delegated authorization, and OIDC adds authentication.",
    "Using the access token to identify the user in the client instead of the ID token, or sending the ID token to APIs.",
    "Not validating the audience, so a token issued for another API is accepted.",
    "Expecting hasRole('ADMIN') to work with Keycloak tokens without a custom JwtAuthenticationConverter.",
    "Still using the Implicit or Password grant in new applications.",
    "Storing access and refresh tokens in localStorage in a SPA, where any XSS can steal them.",
    "Hard-coding client secrets in application.yml committed to Git.",
    "Disabling CSRF on a cookie-based BFF because the downstream APIs are stateless.",
    "Issuing long-lived JWT access tokens that cannot be revoked.",
    "Letting internal services trust any request from inside the network instead of validating tokens.",
  ],

  interviewTips: [
    "Describe the Authorization Code + PKCE flow as numbered steps; interviewers love a clear sequence.",
    "Always pair flows with use cases: code + PKCE for users, client credentials for services, device code for TVs.",
    "Explain what issuer-uri does in Spring: discovery, JWK Set, signature, exp and iss validation.",
    "Mention audience validation and short token lifetimes when talking about security.",
    "Bring up the BFF pattern when asked about SPAs; it shows current best practice.",
    "Know how Keycloak roles become Spring authorities; it is a very common real-world question.",
  ],

  interviewQuestions: [
    {
      id: 'security-oauth2-q1',
      question: "Walk me through the Authorization Code flow with PKCE.",
      answer: "The client creates a random code_verifier and its SHA-256 hash, the code_challenge. It redirects the user's browser to the authorization server with client_id, redirect_uri, scopes, a random state and the code_challenge. The user logs in on the authorization server's page. The server redirects back to redirect_uri with a one-time authorization code and the state. The client checks the state, then makes a back-channel POST to the token endpoint with the code and the original code_verifier. The server hashes the verifier, checks it matches the challenge, and returns an access token, a refresh token and, with OIDC, an ID token. The client then calls APIs with the access token as a bearer token.",
      points: [
        "Redirect to /authorize with code_challenge and state.",
        "User authenticates at the authorization server.",
        "Code returned to redirect_uri.",
        "Code + code_verifier exchanged for tokens.",
      ],
      difficulty: 'Intermediate',
    },
    {
      id: 'security-oauth2-q2',
      question: "What problem does PKCE solve?",
      answer: "The authorization code travels through the browser in a redirect URL, so it can be intercepted, for example by a malicious app registered for the same custom URL scheme on a phone, or leaked through logs. Public clients such as SPAs and mobile apps cannot keep a client secret, so without PKCE anyone with the code could exchange it for tokens. With PKCE, the client proves at the token endpoint that it is the same client that started the flow by sending the code_verifier, whose hash was sent earlier as the code_challenge. An interceptor has the code but not the verifier. OAuth 2.1 requires PKCE for all clients using the authorization code flow.",
      points: [
        "Protects against authorization code interception.",
        "Needed because public clients have no secret.",
        "Verifier stays with the client; challenge is its hash.",
        "Required by OAuth 2.1.",
      ],
      difficulty: 'Intermediate',
    },
    {
      id: 'security-oauth2-q3',
      question: "Which OAuth2 grant type would you use for a web app, a mobile app, a microservice calling another, and a smart TV?",
      answer: "Web app: Authorization Code with PKCE, ideally with a confidential server-side client or BFF holding the tokens. Mobile app: Authorization Code with PKCE through the system browser. Microservice to microservice with no user: Client Credentials. Smart TV or CLI with limited input: the Device Authorization grant, where the user completes login on another device. The Implicit and Resource Owner Password grants should not be used; they are deprecated and removed in OAuth 2.1.",
      points: [
        "Users: authorization code + PKCE.",
        "Services: client credentials.",
        "Input-constrained devices: device code.",
        "Implicit and password: deprecated.",
      ],
      difficulty: 'Beginner',
    },
    {
      id: 'security-oauth2-q4',
      question: "What is the difference between an access token, a refresh token and an ID token?",
      answer: "The access token authorizes calls to resource servers; it is sent in the Authorization: Bearer header, is short-lived and its audience is the API. The refresh token is sent only to the authorization server's token endpoint to obtain new access tokens without user interaction; it lives longer, must be stored securely and is often rotated on each use. The ID token is an OpenID Connect JWT describing the authenticated user (sub, name, email, auth_time) and its audience is the client; the client uses it to know who logged in and should not send it to APIs.",
      points: [
        "Access token: for APIs, short-lived.",
        "Refresh token: for the token endpoint only.",
        "ID token: identity for the client (OIDC).",
      ],
      difficulty: 'Beginner',
    },
    {
      id: 'security-oauth2-q5',
      question: "How does a Spring Boot resource server validate a JWT access token?",
      answer: "With spring-boot-starter-oauth2-resource-server and spring.security.oauth2.resourceserver.jwt.issuer-uri, Spring fetches the issuer's OpenID discovery document at startup to find the jwks_uri. BearerTokenAuthenticationFilter extracts the token from the Authorization header, and a JwtDecoder checks the signature with the matching public key from the JWK Set (by kid, cached and refreshed on rotation), then validates exp, nbf and iss, and aud if audiences are configured. If validation succeeds, a JwtAuthenticationConverter turns the claims into a JwtAuthenticationToken with authorities (SCOPE_ from scopes by default), which is placed in the SecurityContext. Invalid or missing tokens produce a 401 with a WWW-Authenticate header.",
      example: `spring:
  security:
    oauth2:
      resourceserver:
        jwt:
          issuer-uri: https://auth.shop.example.com/realms/shop
          audiences: order-service`,
      points: [
        "Discovery document gives the JWK Set.",
        "Signature checked with the public key.",
        "exp, nbf, iss and aud validated.",
        "Claims converted to authorities; 401 on failure.",
      ],
      difficulty: 'Intermediate',
    },
    {
      id: 'security-oauth2-q6',
      question: "Your Keycloak token contains roles, but hasRole('ADMIN') always returns false. Why, and how do you fix it?",
      answer: "By default, Spring's JwtAuthenticationConverter only maps the scope or scp claim to authorities with the SCOPE_ prefix. Keycloak places realm roles in the nested claim realm_access.roles (and client roles in resource_access.<client>.roles), which Spring ignores. hasRole('ADMIN') looks for the authority ROLE_ADMIN. The fix is to define a JwtAuthenticationConverter bean whose granted-authorities converter reads realm_access.roles, adds the ROLE_ prefix and combines them with the scope authorities. Spring Boot picks the bean up automatically.",
      example: `Map<String, Object> realmAccess = jwt.getClaimAsMap("realm_access");
if (realmAccess != null && realmAccess.get("roles") instanceof Collection<?> roles) {
    roles.forEach(r -> authorities.add(new SimpleGrantedAuthority("ROLE_" + r)));
}`,
      points: [
        "Default mapping reads scopes only.",
        "Keycloak roles are nested in realm_access.",
        "hasRole needs the ROLE_ prefix.",
        "Custom JwtAuthenticationConverter bean.",
      ],
      difficulty: 'Intermediate',
    },
    {
      id: 'security-oauth2-q7',
      question: "JWT or opaque access tokens: which would you choose?",
      answer: "JWTs are validated locally with the issuer's public key, so there is no network call per request, which scales well and suits microservices. They cannot be revoked before expiry without extra infrastructure, and their claims are readable by anyone holding them. Opaque tokens are random references that the resource server checks through the introspection endpoint; they can be revoked instantly and reveal nothing, but every request (or cache miss) costs a call to the authorization server. A common choice is short-lived JWT access tokens (5-15 minutes) with rotated refresh tokens, and opaque tokens where immediate revocation is critical.",
      points: [
        "JWT: local validation, scalable, hard to revoke.",
        "Opaque: introspection, revocable, extra latency.",
        "Short-lived JWTs are the usual compromise.",
      ],
      difficulty: 'Intermediate',
    },
    {
      id: 'security-oauth2-q8',
      question: "How should a React SPA handle OAuth2 tokens securely?",
      answer: "The current best practice is the Backend-for-Frontend pattern. A server-side component (for example Spring Cloud Gateway or a Spring Boot app with oauth2Login) acts as a confidential OAuth2 client, performs the Authorization Code + PKCE flow, and keeps the access and refresh tokens server-side. The browser gets only an HttpOnly, Secure, SameSite session cookie, so JavaScript, and therefore an XSS attack, cannot read tokens. The BFF attaches the access token when proxying API calls (TokenRelay) and refreshes it when needed. Since authentication is cookie-based, CSRF protection must be on. If a BFF is not possible, the SPA should use code + PKCE, keep tokens in memory rather than localStorage, and use refresh token rotation.",
      points: [
        "BFF keeps tokens off the browser.",
        "HttpOnly, Secure, SameSite cookie.",
        "TokenRelay to downstream APIs.",
        "Enable CSRF protection on the BFF.",
      ],
      difficulty: 'Advanced',
    },
    {
      id: 'security-oauth2-q9',
      question: "How do microservices authenticate calls to each other with OAuth2?",
      answer: "If a service calls another on its own behalf, for example a scheduled job, it uses the Client Credentials grant: it has its own client in the authorization server with specific scopes, obtains an access token and sends it as a bearer token. In Spring, register a client_credentials registration and use OAuth2AuthorizedClientManager with OAuth2ClientHttpRequestInterceptor for RestClient (or the OAuth2 filter function for WebClient) so tokens are fetched, cached and renewed automatically. If the call is part of a user's request and the downstream service needs the user's identity, relay the user's access token (the gateway's TokenRelay filter, or forwarding the incoming Jwt) or use Token Exchange to get a token for the downstream audience. The receiving service is a resource server that validates the token and checks scopes, instead of trusting the internal network.",
      points: [
        "Client credentials for service identity.",
        "AuthorizedClientManager caches and renews tokens.",
        "Token relay / token exchange for user context.",
        "Every service validates tokens (zero trust).",
      ],
      difficulty: 'Advanced',
    },
  ],
}

export default topic
