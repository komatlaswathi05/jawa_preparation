const topic = {
  id: 'microservices-kubernetes',
  category: 'microservices',
  title: 'Kubernetes Basics',
  description: "Run Spring Boot containers in production with Pods, Deployments, Services, Ingress, ConfigMaps, Secrets, health probes, rolling updates and autoscaling.",
  difficulty: 'Intermediate',
  overview: "Docker packages your Spring Boot application into an image. Kubernetes (often written K8s) runs those images across a cluster of machines and keeps them running. You describe the state you want in YAML (\"three copies of order-service, version 1.4, each with 512 MB of memory, reachable at /orders\") and Kubernetes continuously works to make reality match: it starts containers, restarts crashed ones, replaces failed machines, spreads traffic and rolls out new versions without downtime.\n\nThink of Kubernetes as a building manager for your containers. You hand over a plan saying how many flats of each type you need; the manager finds space, fixes anything that breaks, and gives each service a fixed address so tenants can find each other, even though the people inside move around.\n\nBackend developers are not expected to be cluster administrators, but interviewers do expect you to know the core objects, how configuration and secrets reach your application, and how Spring Boot Actuator health checks connect to Kubernetes probes. Examples deploy an `order-service` Spring Boot application image `ghcr.io/acme/order-service`.",

  subtopics: [
    {
      id: 'why-kubernetes',
      title: 'What Kubernetes does',
      explanation: "Kubernetes is a container orchestrator. Its main jobs are scheduling (deciding which machine, called a node, runs each container), self-healing (restarting crashed containers and replacing those on failed nodes), service discovery and load balancing (giving a stable name to a changing set of containers), rolling updates and rollbacks, scaling (manually or automatically), and configuration and secret management.\n\nIt works declaratively: you apply YAML that describes the desired state, controllers watch the actual state and correct any difference. A cluster has a control plane (API server, scheduler, controllers, etcd storing the state) and worker nodes running your containers through the kubelet.",
      example: `# desired state: "I want 3 replicas of order-service"
kubectl apply -f order-service.yaml

# a pod crashes -> the Deployment controller notices 2/3 and starts a new one
kubectl get pods
# NAME                             READY   STATUS    RESTARTS
# order-service-7d9f8c6b5c-2xkqp   1/1     Running   0
# order-service-7d9f8c6b5c-9mzlt   1/1     Running   1
# order-service-7d9f8c6b5c-vw4hd   1/1     Running   0`,
      interviewPoints: [
        "Orchestrates containers across a cluster of nodes.",
        "Declarative: desired state vs actual state.",
        "Self-healing, scaling, rolling updates, service discovery.",
        "Control plane (API server, scheduler, etcd) and worker nodes.",
      ],
    },
    {
      id: 'pods',
      title: 'Pods',
      explanation: "A Pod is the smallest unit Kubernetes runs: one or more containers that share a network address and can share volumes. Usually a Pod has exactly one application container, such as your Spring Boot app, sometimes with a sidecar (for example a log shipper or service-mesh proxy).\n\nPods are disposable. They get a new IP address every time they are recreated, and you almost never create them directly. Instead you create a Deployment, which creates and manages Pods for you.",
      example: `apiVersion: v1
kind: Pod
metadata:
  name: order-service-debug
  labels:
    app: order-service
spec:
  containers:
    - name: app
      image: ghcr.io/acme/order-service:1.4.0
      ports:
        - containerPort: 8080

# normally used only for experiments:
kubectl apply -f pod.yaml
kubectl logs order-service-debug
kubectl delete pod order-service-debug`,
      interviewPoints: [
        "Smallest deployable unit; one or more containers.",
        "Containers in a Pod share an IP and localhost.",
        "Pods are ephemeral and get new IPs.",
        "Managed by Deployments, not created by hand.",
      ],
    },
    {
      id: 'deployments',
      title: 'Deployments and ReplicaSets',
      explanation: "A Deployment describes a stateless application: which image to run, how many replicas, and how to update them. It creates a ReplicaSet, whose job is to keep exactly N Pods matching a label selector running. When you change the image, the Deployment creates a new ReplicaSet and gradually moves Pods from the old one to the new one.\n\nLabels connect everything: the Deployment's `selector.matchLabels` must match the Pod template's labels, and Services find Pods by the same labels.",
      example: `apiVersion: apps/v1
kind: Deployment
metadata:
  name: order-service
spec:
  replicas: 3
  selector:
    matchLabels:
      app: order-service
  template:
    metadata:
      labels:
        app: order-service
    spec:
      containers:
        - name: app
          image: ghcr.io/acme/order-service:1.4.0
          ports:
            - containerPort: 8080
          env:
            - name: SPRING_PROFILES_ACTIVE
              value: prod`,
      interviewPoints: [
        "Deployment manages ReplicaSets, which manage Pods.",
        "replicas sets the desired number of Pods.",
        "Labels and selectors link Deployments, Pods and Services.",
        "Use Deployments for stateless apps; StatefulSets for databases.",
      ],
    },
    {
      id: 'services',
      title: 'Services (ClusterIP, NodePort, LoadBalancer)',
      explanation: "Because Pods come and go with new IPs, other applications need a stable address. A Service gives a set of Pods (selected by labels) a fixed virtual IP and a DNS name, and load-balances connections across the ready Pods.\n\n`ClusterIP` (the default) is reachable only inside the cluster, which is right for service-to-service calls: `payment-service` calls `http://order-service:8080`. `NodePort` opens a port on every node. `LoadBalancer` asks the cloud provider for an external load balancer. This built-in DNS-based discovery is why you usually do not need Eureka when running on Kubernetes.",
      example: `apiVersion: v1
kind: Service
metadata:
  name: order-service
spec:
  type: ClusterIP
  selector:
    app: order-service
  ports:
    - port: 80          # port of the Service
      targetPort: 8080  # port the container listens on

# from another pod in the same namespace
curl http://order-service/api/orders/1
# full DNS name
curl http://order-service.shop.svc.cluster.local/api/orders/1

# Spring: payment-service configuration
order-service:
  base-url: http://order-service`,
      interviewPoints: [
        "Stable virtual IP and DNS name for a set of Pods.",
        "ClusterIP for internal, LoadBalancer for external traffic.",
        "Only ready Pods receive traffic.",
        "Replaces a separate service registry like Eureka.",
      ],
    },
    {
      id: 'ingress',
      title: 'Ingress',
      explanation: "An Ingress routes external HTTP(S) traffic to Services based on host names and paths, so one public load balancer can serve many services: `/orders` goes to order-service and `/payments` to payment-service. An Ingress controller (NGINX Ingress, Traefik, a cloud controller) must be installed to implement the rules. It usually also terminates TLS.\n\nThe newer Gateway API is the successor to Ingress with richer routing. An API gateway such as Spring Cloud Gateway can sit behind the Ingress when you need application-level features like authentication, rate limiting or request transformation.",
      example: `apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: shop
spec:
  ingressClassName: nginx
  tls:
    - hosts: [api.shop.example.com]
      secretName: shop-tls
  rules:
    - host: api.shop.example.com
      http:
        paths:
          - path: /orders
            pathType: Prefix
            backend:
              service:
                name: order-service
                port:
                  number: 80
          - path: /payments
            pathType: Prefix
            backend:
              service:
                name: payment-service
                port:
                  number: 80`,
      interviewPoints: [
        "HTTP routing by host and path to Services.",
        "Needs an Ingress controller.",
        "Terminates TLS.",
        "Gateway API is the modern successor.",
      ],
    },
    {
      id: 'configmaps',
      title: 'ConfigMaps',
      explanation: "A ConfigMap stores non-secret configuration outside the image, so the same image runs in dev, test and prod with different settings. You can expose entries as environment variables or mount them as files.\n\nSpring Boot's relaxed binding makes environment variables easy: `SPRING_DATASOURCE_URL` maps to `spring.datasource.url`. Alternatively, mount an `application.yml` from a ConfigMap and point Spring at it with `spring.config.import`. Pods do not see changed environment variables until they restart; mounted files are updated but Spring reads them only at startup unless you use a refresh mechanism.",
      example: `apiVersion: v1
kind: ConfigMap
metadata:
  name: order-service-config
data:
  SPRING_PROFILES_ACTIVE: prod
  SPRING_DATASOURCE_URL: jdbc:postgresql://orders-db:5432/orders
  application.yml: |
    app:
      order:
        max-items: 50

# in the Deployment's container spec
envFrom:
  - configMapRef:
      name: order-service-config
env:
  - name: SPRING_CONFIG_IMPORT
    value: optional:file:/config/application.yml
volumeMounts:
  - name: config
    mountPath: /config
volumes:
  - name: config
    configMap:
      name: order-service-config
      items:
        - key: application.yml
          path: application.yml`,
      interviewPoints: [
        "Externalises non-secret configuration.",
        "Consumed as environment variables or files.",
        "Spring relaxed binding maps SPRING_DATASOURCE_URL.",
        "Changes usually require a Pod restart.",
      ],
    },
    {
      id: 'secrets',
      title: 'Secrets',
      explanation: "A Secret is like a ConfigMap for sensitive data such as database passwords, API keys and TLS certificates. It is consumed the same way (environment variables or mounted files) and access can be restricted with RBAC.\n\nImportant: Secret values are only base64-encoded, not encrypted. Anyone who can read the Secret object can decode it. Production clusters enable encryption at rest for etcd and often keep the real secrets in an external store (HashiCorp Vault, AWS Secrets Manager) synced into Kubernetes with tools like External Secrets Operator. Never commit Secret YAML with real values to Git.",
      example: `kubectl create secret generic order-db \\
  --from-literal=username=orders \\
  --from-literal=password='s3cr3t!'

apiVersion: v1
kind: Secret
metadata:
  name: order-db
type: Opaque
stringData:              # written as plain text, stored base64-encoded
  username: orders
  password: s3cr3t!

# in the container spec
env:
  - name: SPRING_DATASOURCE_USERNAME
    valueFrom:
      secretKeyRef:
        name: order-db
        key: username
  - name: SPRING_DATASOURCE_PASSWORD
    valueFrom:
      secretKeyRef:
        name: order-db
        key: password`,
      interviewPoints: [
        "For passwords, tokens and certificates.",
        "Base64 is encoding, not encryption.",
        "Enable encryption at rest and restrict with RBAC.",
        "External secret stores for production.",
      ],
    },
    {
      id: 'resources',
      title: 'Resource requests and limits',
      explanation: "Each container should declare `requests` (what it needs; the scheduler uses this to pick a node) and `limits` (the maximum it may use). A container exceeding its memory limit is killed with `OOMKilled`; one exceeding its CPU limit is throttled, which can make a Spring Boot app start very slowly.\n\nFor Java, the JVM is container-aware: it reads the memory limit and by default uses only 25% of it for the heap. Set `-XX:MaxRAMPercentage=75` (via `JAVA_TOOL_OPTIONS`) so the heap uses most of the limit while leaving room for metaspace, threads and direct buffers. Many teams set a memory limit equal to the request and avoid a CPU limit, or set it generously, to prevent throttling.",
      example: `containers:
  - name: app
    image: ghcr.io/acme/order-service:1.4.0
    resources:
      requests:
        cpu: 500m        # half a CPU core
        memory: 768Mi
      limits:
        memory: 768Mi    # exceeding it -> OOMKilled
    env:
      - name: JAVA_TOOL_OPTIONS
        value: "-XX:MaxRAMPercentage=75 -XX:+ExitOnOutOfMemoryError"`,
      interviewPoints: [
        "Requests for scheduling, limits for enforcement.",
        "Memory over limit: OOMKilled; CPU over limit: throttled.",
        "JVM respects container limits; tune MaxRAMPercentage.",
        "Leave headroom for non-heap memory.",
      ],
    },
    {
      id: 'probes',
      title: 'Liveness, readiness and startup probes',
      explanation: "Probes tell Kubernetes about your application's health. A readiness probe answers \"can this Pod receive traffic now?\"; if it fails, the Pod is removed from the Service's endpoints but not restarted. A liveness probe answers \"is this Pod stuck beyond recovery?\"; if it fails repeatedly, the container is restarted. A startup probe gives slow-starting applications time to boot before the liveness probe begins.\n\nSpring Boot Actuator detects Kubernetes and exposes `/actuator/health/liveness` and `/actuator/health/readiness`. Keep liveness checks shallow: do not include the database, otherwise a database outage causes every Pod to be restarted in a loop, which makes things worse. Put external dependencies in readiness if at all.",
      example: `# application.yml
management:
  endpoint:
    health:
      probes:
        enabled: true      # automatic when running on Kubernetes
      group:
        readiness:
          include: readinessState, db

# container spec
startupProbe:
  httpGet:
    path: /actuator/health/liveness
    port: 8080
  failureThreshold: 30
  periodSeconds: 5        # up to 150 s to start
livenessProbe:
  httpGet:
    path: /actuator/health/liveness
    port: 8080
  periodSeconds: 10
readinessProbe:
  httpGet:
    path: /actuator/health/readiness
    port: 8080
  periodSeconds: 5`,
      interviewPoints: [
        "Readiness failure: no traffic. Liveness failure: restart.",
        "Startup probe protects slow-starting JVM apps.",
        "Actuator provides liveness and readiness groups.",
        "Never put the database in the liveness check.",
      ],
    },
    {
      id: 'rolling-updates',
      title: 'Rolling updates, rollback and graceful shutdown',
      explanation: "When you change a Deployment's image, Kubernetes performs a rolling update by default: it starts new Pods, waits until they are ready, then terminates old ones. `maxSurge` controls how many extra Pods may exist during the update and `maxUnavailable` how many may be missing. If the new version fails its readiness probe, the rollout stalls and the old Pods keep serving. `kubectl rollout undo` goes back to the previous ReplicaSet.\n\nFor zero downtime, the application must also shut down gracefully: when a Pod is terminated, Kubernetes sends SIGTERM, removes it from Service endpoints, and waits up to `terminationGracePeriodSeconds` (default 30). Enable `server.shutdown=graceful` so Spring Boot stops accepting new requests and finishes in-flight ones.",
      example: `spec:
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  template:
    spec:
      terminationGracePeriodSeconds: 40

# application.yml
server:
  shutdown: graceful
spring:
  lifecycle:
    timeout-per-shutdown-phase: 30s

kubectl set image deployment/order-service app=ghcr.io/acme/order-service:1.5.0
kubectl rollout status deployment/order-service
kubectl rollout history deployment/order-service
kubectl rollout undo deployment/order-service`,
      interviewPoints: [
        "RollingUpdate replaces Pods gradually.",
        "Readiness probes gate the rollout.",
        "rollout undo for quick rollback.",
        "Graceful shutdown finishes in-flight requests.",
      ],
    },
    {
      id: 'hpa',
      title: 'Horizontal Pod Autoscaler',
      explanation: "The Horizontal Pod Autoscaler (HPA) changes a Deployment's replica count based on metrics, most commonly average CPU utilisation relative to the CPU request. When load rises above the target, it adds Pods; when load drops, it removes them, within `minReplicas` and `maxReplicas`.\n\nHPA needs the metrics server, and CPU-based scaling only works if CPU requests are set. You can also scale on custom metrics such as request rate or Kafka consumer lag (for example with KEDA). Remember that scaling out an application also multiplies its database connections: 20 Pods with a Hikari pool of 10 means 200 connections.",
      example: `apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: order-service
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: order-service
  minReplicas: 3
  maxReplicas: 10
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70

kubectl get hpa`,
      interviewPoints: [
        "Scales replicas on CPU, memory or custom metrics.",
        "Requires resource requests and the metrics server.",
        "KEDA for event-driven scaling (e.g. Kafka lag).",
        "More Pods means more database connections.",
      ],
    },
    {
      id: 'namespaces-stateful',
      title: 'Namespaces, StatefulSets, Jobs and CronJobs',
      explanation: "Namespaces divide a cluster into logical groups (for example `shop-dev` and `shop-prod`, or one per team), with separate resource quotas and access rules.\n\nOther workload types complement Deployments: a StatefulSet gives each Pod a stable name and its own persistent volume, which databases and Kafka brokers need (though many teams use a managed database instead). A Job runs Pods until a task completes, such as a database migration. A CronJob runs a Job on a schedule, which is a good alternative to `@Scheduled` when a task must run exactly once across the cluster.",
      example: `kubectl create namespace shop-prod
kubectl -n shop-prod get pods

apiVersion: batch/v1
kind: CronJob
metadata:
  name: monthly-invoices
spec:
  schedule: "0 2 1 * *"          # standard 5-field cron
  concurrencyPolicy: Forbid
  jobTemplate:
    spec:
      template:
        spec:
          restartPolicy: OnFailure
          containers:
            - name: invoices
              image: ghcr.io/acme/billing-job:1.0.0
              args: ["--job=monthly-invoices"]`,
      interviewPoints: [
        "Namespaces isolate environments or teams.",
        "StatefulSet: stable identity and storage.",
        "Job for one-off tasks, CronJob for schedules.",
        "CronJob runs once per schedule across the cluster.",
      ],
    },
    {
      id: 'kubectl',
      title: 'kubectl essentials and debugging',
      explanation: "`kubectl` is the command-line client for the Kubernetes API. The commands you need daily are: `apply` to create or update resources from YAML, `get` to list them, `describe` to see details and recent events, `logs` to read container output, `exec` to run a command inside a container, and `port-forward` to reach a Pod or Service from your laptop.\n\nWhen a Pod will not start, check its status: `ImagePullBackOff` means the image name or registry credentials are wrong; `CrashLoopBackOff` means the app keeps exiting (read `logs --previous`); `Pending` usually means no node has enough requested CPU or memory; `OOMKilled` means the memory limit is too low.",
      example: `kubectl apply -f k8s/
kubectl get pods -l app=order-service -o wide
kubectl describe pod order-service-7d9f8c6b5c-2xkqp   # events at the bottom
kubectl logs -f deployment/order-service
kubectl logs order-service-7d9f8c6b5c-2xkqp --previous # logs of the crashed container
kubectl exec -it order-service-7d9f8c6b5c-2xkqp -- sh
kubectl port-forward svc/order-service 8080:80        # http://localhost:8080
kubectl scale deployment order-service --replicas=5
kubectl top pods                                       # CPU/memory usage`,
      interviewPoints: [
        "apply, get, describe, logs, exec, port-forward.",
        "describe shows events: the first place to look.",
        "Know CrashLoopBackOff, ImagePullBackOff, Pending, OOMKilled.",
      ],
    },
    {
      id: 'helm-compose',
      title: 'Helm, and Kubernetes vs Docker Compose',
      explanation: "Real applications need many YAML files, with small differences per environment. Helm is a package manager for Kubernetes: a chart is a set of templated YAML files plus a `values.yaml`, and you install it with different values for each environment. Kustomize is a template-free alternative built into kubectl that applies overlays to base YAML.\n\nDocker Compose runs multiple containers on one machine and is perfect for local development and integration tests. Kubernetes runs containers across many machines with self-healing, scaling and rolling updates, which you need in production. Many teams use Compose (or Spring Boot's Docker Compose support) locally and Kubernetes in shared environments.",
      example: `# Helm
helm create order-service
helm install order-service ./order-service -f values-prod.yaml -n shop-prod
helm upgrade order-service ./order-service --set image.tag=1.5.0
helm rollback order-service 1

# values-prod.yaml
replicaCount: 3
image:
  repository: ghcr.io/acme/order-service
  tag: 1.4.0
resources:
  requests:
    cpu: 500m
    memory: 768Mi`,
      interviewPoints: [
        "Helm: templated charts with per-environment values.",
        "Kustomize: overlays without templates.",
        "Compose: one host, local development.",
        "Kubernetes: cluster, production features.",
      ],
    },
  ],

  commonMistakes: [
    "Creating bare Pods instead of Deployments, so nothing recreates them when they die.",
    "Putting the database check in the liveness probe, causing restart loops during a database outage.",
    "Not using a startup probe, so a slow JVM is killed by the liveness probe before it finishes starting.",
    "Setting no memory limit, or a limit below what the JVM actually uses, leading to OOMKilled Pods.",
    "Leaving the JVM heap at the default 25% of the container memory.",
    "Treating Secrets as encrypted and committing their YAML to Git.",
    "Baking environment-specific configuration into the Docker image instead of using ConfigMaps and Secrets.",
    "Using the latest tag, which makes rollouts and rollbacks unpredictable.",
    "Forgetting graceful shutdown, so requests fail during every rolling update.",
    "Autoscaling without checking the database connection limit.",
  ],

  interviewTips: [
    "Walk through a request: Ingress to Service to one of the ready Pods managed by a Deployment.",
    "Explain the difference between liveness and readiness clearly, and connect them to Actuator endpoints.",
    "Mention that Kubernetes DNS-based Services often replace Eureka and client-side discovery.",
    "Show JVM awareness: memory limits, MaxRAMPercentage and startup probes.",
    "Describe zero-downtime deployment as rolling update + readiness probes + graceful shutdown.",
    "Know a few failure states (CrashLoopBackOff, ImagePullBackOff, OOMKilled) and how you would debug them.",
  ],

  interviewQuestions: [
    {
      id: 'microservices-kubernetes-q1',
      question: "What is Kubernetes and why do we need it if we already have Docker?",
      answer: "Docker builds images and runs containers on a single machine. Kubernetes orchestrates containers across a cluster of machines. You declare the desired state, such as three replicas of order-service version 1.4, and Kubernetes schedules the containers onto nodes, restarts them if they crash, replaces them if a node fails, load-balances traffic through Services, performs rolling updates and rollbacks, scales them automatically and injects configuration and secrets. Docker answers \"how do I package and run this?\"; Kubernetes answers \"how do I run many of these reliably in production?\"",
      points: [
        "Docker: package and run on one host.",
        "Kubernetes: orchestrate across a cluster.",
        "Self-healing, scaling, rolling updates, discovery.",
        "Declarative desired state.",
      ],
      difficulty: 'Beginner',
    },
    {
      id: 'microservices-kubernetes-q2',
      question: "Explain Pod, Deployment, ReplicaSet and Service.",
      answer: "A Pod is the smallest unit: one or more containers sharing a network address, usually one Spring Boot container. Pods are temporary and get new IPs when recreated. A ReplicaSet keeps a specified number of identical Pods running. A Deployment manages ReplicaSets and adds versioned rolling updates and rollbacks; it is what you create for a stateless application. A Service gives a set of Pods, selected by labels, a stable IP and DNS name and load-balances across the ready ones, so other services can call http://order-service without knowing individual Pod IPs.",
      points: [
        "Pod: container(s), ephemeral.",
        "ReplicaSet: keeps N Pods.",
        "Deployment: manages ReplicaSets and rollouts.",
        "Service: stable address and load balancing.",
      ],
      difficulty: 'Beginner',
    },
    {
      id: 'microservices-kubernetes-q3',
      question: "What is the difference between liveness and readiness probes? How do you configure them for Spring Boot?",
      answer: "A readiness probe decides whether a Pod should receive traffic. If it fails, Kubernetes removes the Pod from Service endpoints but leaves it running, which is useful during startup, warm-up or temporary dependency problems. A liveness probe decides whether the container is broken; if it fails repeatedly, Kubernetes restarts it. A startup probe delays liveness checks until a slow application has started.\n\nSpring Boot Actuator exposes /actuator/health/liveness and /actuator/health/readiness, and enables them automatically on Kubernetes. Keep liveness limited to the application's own state; do not include the database, or a database outage will restart every Pod. Dependencies can go into the readiness group.",
      example: `livenessProbe:
  httpGet: { path: /actuator/health/liveness, port: 8080 }
readinessProbe:
  httpGet: { path: /actuator/health/readiness, port: 8080 }
startupProbe:
  httpGet: { path: /actuator/health/liveness, port: 8080 }
  failureThreshold: 30
  periodSeconds: 5`,
      points: [
        "Readiness: receive traffic or not.",
        "Liveness: restart if stuck.",
        "Startup probe for slow starts.",
        "Actuator liveness/readiness groups.",
      ],
      difficulty: 'Intermediate',
    },
    {
      id: 'microservices-kubernetes-q4',
      question: "How do you pass configuration and secrets to a Spring Boot application in Kubernetes?",
      answer: "Keep the image the same for every environment and inject environment-specific values at runtime. Non-secret settings go in a ConfigMap and sensitive values (passwords, API keys) in a Secret. Both can be exposed as environment variables, which Spring Boot maps with relaxed binding (SPRING_DATASOURCE_URL becomes spring.datasource.url), or mounted as files such as an application.yml. Secrets are only base64-encoded, so enable encryption at rest, restrict access with RBAC and, in production, often sync them from Vault or a cloud secret manager with External Secrets Operator. Changes normally take effect after a rolling restart.",
      example: `envFrom:
  - configMapRef: { name: order-service-config }
env:
  - name: SPRING_DATASOURCE_PASSWORD
    valueFrom:
      secretKeyRef: { name: order-db, key: password }`,
      points: [
        "ConfigMap for config, Secret for sensitive values.",
        "Environment variables or mounted files.",
        "Relaxed binding maps env vars to properties.",
        "Secrets are not encrypted by default.",
      ],
      difficulty: 'Intermediate',
    },
    {
      id: 'microservices-kubernetes-q5',
      question: "How do you achieve zero-downtime deployments on Kubernetes?",
      answer: "Use a Deployment with the RollingUpdate strategy, for example maxSurge 1 and maxUnavailable 0, so new Pods start before old ones are removed. Configure a readiness probe so traffic only goes to new Pods once they are really ready; if they never become ready, the rollout stops and old Pods keep serving. Enable graceful shutdown in Spring Boot (server.shutdown=graceful) and make terminationGracePeriodSeconds longer than the shutdown timeout so in-flight requests complete after SIGTERM. Keep database migrations backward-compatible so old and new versions can run side by side. If something goes wrong, kubectl rollout undo restores the previous version.",
      points: [
        "RollingUpdate with maxUnavailable 0.",
        "Readiness probes gate traffic.",
        "Graceful shutdown on SIGTERM.",
        "Backward-compatible schema changes; rollout undo.",
      ],
      difficulty: 'Intermediate',
    },
    {
      id: 'microservices-kubernetes-q6',
      question: "What are resource requests and limits, and what should you watch out for with Java applications?",
      answer: "Requests are the CPU and memory a container is guaranteed; the scheduler places Pods on nodes with enough unrequested capacity. Limits are maximums: exceeding the memory limit kills the container (OOMKilled), and exceeding the CPU limit throttles it. For Java, the JVM reads container limits but by default uses only 25% of memory for the heap, so set -XX:MaxRAMPercentage to around 70-75% and leave room for metaspace, thread stacks and direct buffers. Low CPU limits make Spring Boot start slowly and can trigger liveness failures, so many teams avoid strict CPU limits and use a startup probe.",
      example: `resources:
  requests: { cpu: 500m, memory: 768Mi }
  limits:   { memory: 768Mi }
env:
  - name: JAVA_TOOL_OPTIONS
    value: "-XX:MaxRAMPercentage=75"`,
      points: [
        "Requests for scheduling, limits for enforcement.",
        "Memory limit: OOMKilled; CPU limit: throttling.",
        "Tune MaxRAMPercentage for the JVM.",
        "CPU throttling slows JVM startup.",
      ],
      difficulty: 'Intermediate',
    },
    {
      id: 'microservices-kubernetes-q7',
      question: "Do you need Eureka or Spring Cloud Gateway when running on Kubernetes?",
      answer: "Usually not Eureka. Kubernetes Services already provide service discovery and load balancing through DNS: a service simply calls http://payment-service and Kubernetes routes to a ready Pod. Running Eureka on top duplicates this. An API gateway can still be useful: an Ingress (or Gateway API) handles routing and TLS at the edge, but if you need application-level features such as authentication with JWT validation, rate limiting per user, request aggregation or token relay, Spring Cloud Gateway can run inside the cluster behind the Ingress. Spring Cloud Kubernetes can also read ConfigMaps and Secrets as property sources if needed.",
      points: [
        "Kubernetes Services replace Eureka.",
        "Ingress for edge routing and TLS.",
        "Spring Cloud Gateway for app-level concerns.",
      ],
      difficulty: 'Intermediate',
    },
    {
      id: 'microservices-kubernetes-q8',
      question: "A Pod is in CrashLoopBackOff. How do you debug it?",
      answer: "CrashLoopBackOff means the container keeps starting and exiting, and Kubernetes waits longer between restarts. First run kubectl describe pod to see the events, exit code and last state; OOMKilled or exit code 137 points to memory limits. Then run kubectl logs <pod> --previous to read the output of the crashed container; for a Spring Boot application this is usually a startup exception such as a missing environment variable, a wrong database URL or password, or a failed Flyway migration. Also check whether the liveness probe is killing a slow-starting application (add a startup probe) and whether the ConfigMaps and Secrets it references exist.",
      example: `kubectl describe pod order-service-7d9f8c6b5c-2xkqp
kubectl logs order-service-7d9f8c6b5c-2xkqp --previous
kubectl get events --sort-by=.lastTimestamp`,
      points: [
        "describe for events and exit reason.",
        "logs --previous for the crash output.",
        "Common causes: config, DB connection, OOM, probes.",
      ],
      difficulty: 'Intermediate',
    },
    {
      id: 'microservices-kubernetes-q9',
      question: "How does the Horizontal Pod Autoscaler work, and what can go wrong when you scale a Spring Boot service?",
      answer: "The HPA periodically reads metrics, usually average CPU utilisation as a percentage of the CPU request, and adjusts the Deployment's replicas to bring it towards the target, between minReplicas and maxReplicas. It needs the metrics server and resource requests; custom metrics such as request rate or Kafka lag can be used with an adapter or KEDA.\n\nProblems when scaling: every new Pod opens its own database connection pool, so 20 Pods with 10 connections each can exhaust the database; JVM startup and warm-up mean new Pods take time to help, so scale early and use readiness probes; in-memory caches and sessions are not shared between Pods, so use Redis or stateless JWT; @Scheduled jobs run on every replica unless locked; and Kafka consumers cannot scale beyond the number of partitions.",
      points: [
        "Scales replicas toward a target metric.",
        "Needs requests and metrics server.",
        "Watch DB connections, warm-up and local state.",
        "Scheduled jobs and Kafka partition limits.",
      ],
      difficulty: 'Advanced',
    },
  ],
}

export default topic
