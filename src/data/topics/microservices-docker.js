const topic = {
  id: 'microservices-docker',
  category: 'microservices',
  title: 'Docker & CI/CD',
  description: 'Packaging Spring Boot apps as Docker images, running them with Docker Compose, building images with buildpacks, automating CI/CD pipelines and a first look at Kubernetes.',
  difficulty: 'Intermediate',
  overview: "Docker packages your application together with everything it needs to run (a Java runtime, libraries, configuration) into an image. Anyone can run that image as a container on any machine with Docker, and it behaves the same everywhere. It is like a shipping container: the ship does not care whether it carries bananas or laptops, because the box has a standard shape. 'Works on my machine' stops being a problem.\n\nFor Spring Boot developers Docker is used in three places: running infrastructure locally (PostgreSQL, Redis, Kafka) with Docker Compose, shipping the application itself as an image, and running tests against real databases with Testcontainers. Spring Boot can build optimised images for you with buildpacks (`mvn spring-boot:build-image`), or you can write your own multi-stage Dockerfile.\n\nCI/CD (Continuous Integration / Continuous Delivery) automates the path from a git push to production: build, run tests, build and push an image, then deploy it, often to Kubernetes. Interviewers expect you to write a sensible Dockerfile, explain images vs containers, layers and caching, ports, volumes and environment variables, and describe a typical pipeline.",

  subtopics: [
    {
      id: 'docker-intro',
      title: 'What is Docker?',
      explanation: "Docker is a platform for building and running containers. A container is an isolated process on the host that has its own filesystem, network and process space, but shares the host operating system's kernel. Because there is no full guest operating system, containers start in seconds and use far less memory than virtual machines.\n\nThe main pieces are the Docker Engine (daemon) that runs containers, the `docker` CLI, images that define what runs, and registries such as Docker Hub, GitHub Container Registry or AWS ECR where images are stored and shared.",
      interviewPoints: [
        'Containers share the host kernel; VMs each run a full guest OS.',
        'Containers are lightweight, fast to start and portable.',
        'Images are stored in registries (Docker Hub, GHCR, ECR).',
      ],
    },
    {
      id: 'images-vs-containers',
      title: 'Images vs containers',
      explanation: "An image is a read-only template: a stack of filesystem layers plus metadata such as the start command. A container is a running (or stopped) instance of an image, with a thin writable layer on top. The relationship is like a class and its objects: one image, many containers.\n\nImages are identified by name and tag, such as `shop/order-service:1.4.0`. Avoid relying on `latest` in production, because it does not tell you which version is running. Anything written inside a container's writable layer disappears when the container is removed, which is why data goes into volumes.",
      example: `docker pull postgres:16-alpine         # download an image
docker images                          # list local images
docker run -d --name db postgres:16-alpine   # create + start a container from it
docker ps -a                           # list containers (running and stopped)
docker rm -f db                        # remove the container (image stays)
docker rmi postgres:16-alpine          # remove the image`,
      interviewPoints: [
        'Image = read-only template; container = running instance.',
        'One image can run as many containers.',
        'Container filesystem changes are lost when it is removed.',
        'Use explicit version tags, not latest.',
      ],
    },
    {
      id: 'dockerfile-multistage',
      title: 'Dockerfile for a Spring Boot app (multi-stage build)',
      explanation: "A Dockerfile is a recipe that builds an image step by step. A multi-stage build uses one stage with the full JDK and Maven to compile and package the jar, and a second, much smaller stage with only a JRE that copies in the finished jar. The final image contains no source code or build tools, so it is smaller and has fewer vulnerabilities.\n\nGood practices: copy `pom.xml` and download dependencies before copying the source so that dependency layers are cached; run as a non-root user; use a specific base image tag; and add a `.dockerignore` file so `target/`, `.git` and IDE files are not sent to the build.",
      example: `# ---- Stage 1: build ----
FROM eclipse-temurin:21-jdk AS build
WORKDIR /app
COPY .mvn/ .mvn/
COPY mvnw pom.xml ./
RUN ./mvnw dependency:go-offline -B      # cached until pom.xml changes
COPY src/ src/
RUN ./mvnw package -DskipTests -B

# ---- Stage 2: run ----
FROM eclipse-temurin:21-jre
WORKDIR /app
RUN groupadd --system spring && useradd --system --gid spring spring
USER spring
COPY --from=build /app/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]`,
      interviewPoints: [
        'Multi-stage: build with JDK, run with a slim JRE image.',
        'Copy pom.xml and resolve dependencies before copying source for better caching.',
        'Run as a non-root user.',
        'Use exec-form ENTRYPOINT so the JVM receives stop signals.',
      ],
    },
    {
      id: 'layers-caching',
      title: 'Layers and build caching',
      explanation: "Each instruction in a Dockerfile (`FROM`, `COPY`, `RUN`) creates a layer. Docker caches layers and reuses them if the instruction and its inputs have not changed. Once one layer changes, every layer after it is rebuilt. So order instructions from least to most frequently changing: base image, dependencies, then your code.\n\nA Spring Boot fat jar puts dependencies and your classes in one file, so any code change invalidates the whole jar layer (often 50+ MB). Spring Boot's layered jar support splits it into `dependencies`, `spring-boot-loader`, `snapshot-dependencies` and `application` layers; copying them separately means a code change only rebuilds and pushes the small application layer.",
      example: `FROM eclipse-temurin:21-jre AS builder
WORKDIR /builder
COPY target/*.jar application.jar
RUN java -Djarmode=tools -jar application.jar extract --layers --destination extracted

FROM eclipse-temurin:21-jre
WORKDIR /application
COPY --from=builder /builder/extracted/dependencies/ ./
COPY --from=builder /builder/extracted/spring-boot-loader/ ./
COPY --from=builder /builder/extracted/snapshot-dependencies/ ./
COPY --from=builder /builder/extracted/application/ ./     # only this changes on a code change
ENTRYPOINT ["java", "-jar", "application.jar"]`,
      interviewPoints: [
        'Each instruction creates a cached layer.',
        'A changed layer invalidates all layers after it.',
        'Put rarely-changing steps first.',
        'Spring Boot layered jars separate dependencies from application code.',
      ],
    },
    {
      id: 'docker-cli',
      title: 'docker build, run, ps, logs',
      explanation: "The everyday commands: `docker build -t name:tag .` builds an image from the Dockerfile in the current directory. `docker run` creates and starts a container; `-d` runs it in the background, `--name` names it, `-p` publishes ports and `-e` sets environment variables. `docker ps` lists running containers (`-a` includes stopped ones).\n\n`docker logs -f name` follows a container's output, which for Spring Boot is your application log. `docker exec -it name sh` opens a shell inside a running container for debugging, and `docker stop` / `docker rm` stop and remove it.",
      example: `docker build -t shop/order-service:1.0.0 .

docker run -d --name order-service -p 8080:8080 \\
  -e SPRING_PROFILES_ACTIVE=dev \\
  shop/order-service:1.0.0

docker ps                          # is it running?
docker logs -f order-service       # follow the Spring Boot log
docker exec -it order-service sh   # shell inside the container
docker stop order-service && docker rm order-service`,
      interviewPoints: [
        'build -t tags an image; run -d -p -e --name starts a container.',
        'ps lists containers; logs -f follows output.',
        'exec -it opens a shell for debugging.',
      ],
    },
    {
      id: 'ports-volumes',
      title: 'Ports and volumes',
      explanation: "A container has its own network. `EXPOSE 8080` in a Dockerfile only documents the port; to reach it from your machine you publish it with `-p hostPort:containerPort`, for example `-p 9090:8080` makes the app available at `localhost:9090`.\n\nContainers are disposable, so data that must survive (like a database's files) goes into a volume. A named volume (`-v pgdata:/var/lib/postgresql/data`) is managed by Docker and is best for databases. A bind mount (`-v ./config:/app/config`) maps a host folder into the container, which is handy for local config or development.",
      example: `# Publish container port 5432 on host port 5433
# and keep database files in a named volume
docker run -d --name pg \\
  -p 5433:5432 \\
  -e POSTGRES_PASSWORD=secret \\
  -v pgdata:/var/lib/postgresql/data \\
  postgres:16-alpine

docker volume ls`,
      interviewPoints: [
        '-p host:container publishes a port; EXPOSE only documents it.',
        'Container data is lost on removal unless stored in a volume.',
        'Named volumes for databases; bind mounts for host files.',
      ],
    },
    {
      id: 'environment-variables',
      title: 'Environment variables',
      explanation: "The same image should run in every environment; only configuration changes. Spring Boot reads environment variables through relaxed binding: `SPRING_DATASOURCE_URL` maps to `spring.datasource.url`, and `SPRING_PROFILES_ACTIVE=prod` activates a profile. Pass them with `-e` or `--env-file`, or in Docker Compose and Kubernetes manifests.\n\nNever bake passwords or API keys into an image or a Dockerfile, because anyone who can pull the image can read them. Use secrets from the platform (Kubernetes Secrets, a vault, CI secrets) instead.",
      example: `docker run -d -p 8080:8080 \\
  -e SPRING_PROFILES_ACTIVE=prod \\
  -e SPRING_DATASOURCE_URL=jdbc:postgresql://db:5432/shop \\
  -e SPRING_DATASOURCE_USERNAME=shop \\
  --env-file ./secrets.env \\
  shop/order-service:1.0.0`,
      interviewPoints: [
        'Build once, configure per environment.',
        'Relaxed binding: SPRING_DATASOURCE_URL -> spring.datasource.url.',
        'Do not put secrets in images.',
      ],
    },
    {
      id: 'docker-compose',
      title: 'Docker Compose (app + PostgreSQL + Redis)',
      explanation: "Docker Compose describes several containers in one `compose.yaml` file and starts them together with `docker compose up`. Services on the same Compose network reach each other by service name, so the app connects to `jdbc:postgresql://postgres:5432/shop`, not `localhost`.\n\nUse `depends_on` with `condition: service_healthy` and a healthcheck so the app waits until PostgreSQL is ready. Spring Boot 3.1+ also has `spring-boot-docker-compose` support, which starts the services in your `compose.yaml` automatically when you run the app in development and wires the connection details for you.",
      example: `# compose.yaml
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: shop
      POSTGRES_USER: shop
      POSTGRES_PASSWORD: \${POSTGRES_PASSWORD:-secret}
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U shop -d shop"]
      interval: 5s
      retries: 10

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  app:
    build: .
    ports:
      - "8080:8080"
    environment:
      SPRING_DATASOURCE_URL: jdbc:postgresql://postgres:5432/shop
      SPRING_DATASOURCE_USERNAME: shop
      SPRING_DATASOURCE_PASSWORD: \${POSTGRES_PASSWORD:-secret}
      SPRING_DATA_REDIS_HOST: redis
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_started

volumes:
  pgdata:

# docker compose up -d --build     start everything
# docker compose logs -f app       follow app logs
# docker compose down              stop (add -v to delete volumes)`,
      interviewPoints: [
        'One file describes the whole local stack.',
        'Services reach each other by service name on the Compose network.',
        'depends_on + healthcheck to wait for readiness.',
        'spring-boot-docker-compose can manage it during development.',
      ],
    },
    {
      id: 'buildpacks',
      title: 'Spring Boot buildpacks (spring-boot:build-image)',
      explanation: "Cloud Native Buildpacks build an OCI (Docker-compatible) image from your project without a Dockerfile. Run `./mvnw spring-boot:build-image` (or `./gradlew bootBuildImage`) and the Paketo buildpacks pick a JRE, use Spring Boot's layered jar, set memory options for the JVM, and run as a non-root user.\n\nIt is a great default when you do not need full control over the image, and base images can be patched by rebuilding. You need Docker running locally, and you can set the image name and environment variables in the plugin configuration. Adding a GraalVM native image build is also possible through the same mechanism.",
      example: `./mvnw spring-boot:build-image -Dspring-boot.build-image.imageName=shop/order-service:1.0.0

docker run -p 8080:8080 shop/order-service:1.0.0

<!-- pom.xml: optional configuration -->
<plugin>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-maven-plugin</artifactId>
    <configuration>
        <image>
            <name>shop/order-service:\${project.version}</name>
        </image>
    </configuration>
</plugin>`,
      interviewPoints: [
        'No Dockerfile needed: spring-boot:build-image / bootBuildImage.',
        'Produces layered, non-root, JVM-tuned images.',
        'Requires a running Docker daemon.',
      ],
    },
    {
      id: 'cicd-basics',
      title: 'CI/CD pipeline basics',
      explanation: "Continuous Integration means every push is automatically built and tested, so problems are found within minutes. Continuous Delivery means every change that passes is ready to release with one click; Continuous Deployment goes further and deploys automatically.\n\nA typical Spring Boot pipeline: 1) check out code, 2) build and run unit and integration tests (`mvn verify`, often with Testcontainers), 3) static analysis and coverage checks, 4) build a Docker image tagged with the commit SHA or version, 5) scan and push it to a registry, 6) deploy to a staging environment, run smoke tests, 7) promote the same image to production. Tools include GitHub Actions, GitLab CI, Jenkins and Argo CD.",
      example: `# .github/workflows/ci.yml
name: ci
on:
  push:
    branches: [main]
  pull_request:

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-java@v4
        with:
          distribution: temurin
          java-version: 21
          cache: maven
      - name: Build and test
        run: ./mvnw -B verify
      - name: Log in to registry
        if: github.ref == 'refs/heads/main'
        run: echo "\${{ secrets.GITHUB_TOKEN }}" | docker login ghcr.io -u \${{ github.actor }} --password-stdin
      - name: Build and push image
        if: github.ref == 'refs/heads/main'
        run: |
          docker build -t ghcr.io/acme/order-service:\${{ github.sha }} .
          docker push ghcr.io/acme/order-service:\${{ github.sha }}`,
      interviewPoints: [
        'CI = build and test on every change; CD = always releasable (or auto-deployed).',
        'Stages: build, test, analyse, image, push, deploy, verify.',
        'Build the image once and promote the same image across environments.',
        'Tag images with the commit SHA or a version for traceability.',
      ],
    },
    {
      id: 'kubernetes-glance',
      title: 'Kubernetes at a glance',
      explanation: "Kubernetes (K8s) runs containers across a cluster of machines and keeps them in the state you declare. Key objects: a Pod is one or more containers running together; a Deployment keeps N replicas of a Pod running and performs rolling updates; a Service gives Pods a stable name and load-balances between them; ConfigMaps and Secrets provide configuration; an Ingress routes external HTTP traffic.\n\nSpring Boot integrates well: Actuator exposes liveness and readiness probes at `/actuator/health/liveness` and `/actuator/health/readiness` (enabled automatically on Kubernetes), graceful shutdown finishes in-flight requests, and environment variables from ConfigMaps map to properties. Kubernetes Services and DNS also replace Eureka for discovery.",
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
        - name: order-service
          image: ghcr.io/acme/order-service:1.0.0
          ports:
            - containerPort: 8080
          env:
            - name: SPRING_PROFILES_ACTIVE
              value: prod
          readinessProbe:
            httpGet:
              path: /actuator/health/readiness
              port: 8080
          livenessProbe:
            httpGet:
              path: /actuator/health/liveness
              port: 8080
          resources:
            requests: { cpu: "250m", memory: "512Mi" }
            limits: { memory: "768Mi" }
---
apiVersion: v1
kind: Service
metadata:
  name: order-service
spec:
  selector:
    app: order-service
  ports:
    - port: 80
      targetPort: 8080`,
      interviewPoints: [
        'Pod, Deployment, Service, ConfigMap/Secret, Ingress.',
        'Declarative: Kubernetes reconciles actual state to desired state.',
        'Readiness probe controls traffic; liveness probe triggers restarts.',
        'Spring Boot Actuator provides both probe endpoints.',
      ],
    },
  ],

  commonMistakes: [
    'Using a full JDK plus Maven image to run the app in production instead of a multi-stage build with a slim JRE image.',
    'Copying the whole project before downloading dependencies, so every code change re-downloads all dependencies.',
    'Connecting to localhost from inside a container when the database is another container; use the Compose service name instead.',
    'Storing database data inside the container without a volume and losing it when the container is removed.',
    'Baking passwords or API keys into the image or Dockerfile.',
    'Deploying images tagged latest, making it unclear which version is running and impossible to roll back reliably.',
    'Running the application as root inside the container.',
  ],

  interviewTips: [
    'Start with the image vs container analogy (class vs object) and containers vs VMs (shared kernel).',
    'Be ready to write a multi-stage Dockerfile from memory and explain why each line is there.',
    'Explain layer caching and how Spring Boot layered jars or buildpacks make image rebuilds fast.',
    'Describe a pipeline end to end: push, build, test, image tagged by commit, push to registry, deploy to staging, promote to production.',
    'Mention production concerns: non-root user, health probes, graceful shutdown, resource limits and secrets management.',
  ],

  interviewQuestions: [
    {
      id: 'microservices-docker-q1',
      question: 'What is Docker and how is a container different from a virtual machine?',
      answer: "Docker is a platform to package an application with its runtime and dependencies into an image and run it as an isolated container anywhere Docker is installed, giving consistent behaviour from a laptop to production.\n\nA virtual machine emulates hardware and runs a complete guest operating system on a hypervisor, so it is heavy (gigabytes) and slow to boot. A container is an isolated process that shares the host's kernel and only contains the application and its libraries, so it is small, starts in seconds and many can run on one host. The trade-off is weaker isolation than a VM.",
      points: [
        'Containers share the host kernel; VMs run a full guest OS.',
        'Containers are lighter and faster to start.',
        'VMs offer stronger isolation.',
      ],
      difficulty: 'Beginner',
    },
    {
      id: 'microservices-docker-q2',
      question: 'What is the difference between a Docker image and a container?',
      answer: "An image is an immutable, read-only template made of layers: the base OS files, the Java runtime, your jar and the start command. A container is a running instance of an image with its own writable layer, network and process space.\n\nYou can start many containers from the same image, just like creating many objects from one class. Changes made inside a container are lost when it is removed unless they are stored in a volume.",
      points: [
        'Image = template (class); container = instance (object).',
        'Images are immutable and layered.',
        'Container writes are ephemeral without volumes.',
      ],
      difficulty: 'Beginner',
    },
    {
      id: 'microservices-docker-q3',
      question: 'How do you write a Dockerfile for a Spring Boot application?',
      answer: "Use a multi-stage build. The first stage starts from a JDK image, copies the Maven wrapper and `pom.xml`, downloads dependencies (cached as a layer), then copies the source and runs `./mvnw package`. The second stage starts from a small JRE image, creates and switches to a non-root user, copies only the built jar from the first stage, exposes port 8080 and starts the app with `ENTRYPOINT [\"java\", \"-jar\", \"app.jar\"]`.\n\nThis gives a small, secure runtime image without build tools or source code. Add a `.dockerignore` to exclude `target/` and `.git`, and consider Spring Boot's layered jar extraction for faster rebuilds.",
      example: `FROM eclipse-temurin:21-jdk AS build
WORKDIR /app
COPY .mvn/ .mvn/
COPY mvnw pom.xml ./
RUN ./mvnw dependency:go-offline -B
COPY src/ src/
RUN ./mvnw package -DskipTests -B

FROM eclipse-temurin:21-jre
WORKDIR /app
RUN groupadd --system spring && useradd --system --gid spring spring
USER spring
COPY --from=build /app/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]`,
      points: [
        'Multi-stage: JDK to build, JRE to run.',
        'Dependencies before source for caching.',
        'Non-root user and exec-form ENTRYPOINT.',
      ],
      difficulty: 'Beginner',
    },
    {
      id: 'microservices-docker-q4',
      question: 'How do Docker ports and volumes work?',
      answer: "Each container has its own network namespace, so its ports are not reachable from the host by default. `-p 8080:8080` publishes container port 8080 on host port 8080 (the format is host:container). `EXPOSE` in a Dockerfile only documents which port the app uses.\n\nA container's filesystem is discarded when the container is removed, so persistent data must live in a volume. Named volumes (`-v pgdata:/var/lib/postgresql/data`) are managed by Docker and ideal for databases; bind mounts map a host directory into the container and are useful for local configuration or development.",
      points: [
        '-p host:container publishes ports.',
        'EXPOSE is documentation only.',
        'Volumes persist data beyond the container lifecycle.',
        'Named volumes vs bind mounts.',
      ],
      difficulty: 'Beginner',
    },
    {
      id: 'microservices-docker-q5',
      question: 'How does Docker layer caching work and how do you optimise build time?',
      answer: "Every Dockerfile instruction produces a layer, and Docker reuses a cached layer if the instruction and its input files are unchanged. As soon as one layer changes, all following layers must be rebuilt.\n\nTo optimise, put instructions that change rarely first: base image, then copying `pom.xml` and downloading dependencies, and only then copying the source code. That way a code change reuses the dependency layer. For the runtime image, extract Spring Boot's layered jar (dependencies, loader, snapshot dependencies, application) into separate `COPY` steps, so only the small application layer changes on each release; this also makes pushes and pulls faster. A `.dockerignore` keeps unnecessary files out of the build context.",
      points: [
        'One cached layer per instruction.',
        'A changed layer invalidates all later layers.',
        'Order from least to most frequently changing.',
        'Spring Boot layered jars keep the changing layer small.',
      ],
      difficulty: 'Intermediate',
    },
    {
      id: 'microservices-docker-q6',
      question: 'How would you run a Spring Boot app with PostgreSQL and Redis locally using Docker Compose?',
      answer: "Create a `compose.yaml` with three services: `postgres` (image, database credentials as environment variables, a named volume for data, a healthcheck with `pg_isready`), `redis`, and `app` (built from the Dockerfile, port 8080 published). The app gets its configuration through environment variables such as `SPRING_DATASOURCE_URL=jdbc:postgresql://postgres:5432/shop` and `SPRING_DATA_REDIS_HOST=redis`; the hostnames are the service names on the Compose network.\n\nAdd `depends_on` with `condition: service_healthy` so the app starts after PostgreSQL is ready. Then `docker compose up -d --build` starts everything, `docker compose logs -f app` shows logs, and `docker compose down` stops it. With Spring Boot 3.1+ you can also add `spring-boot-docker-compose` so running the app from the IDE starts the Compose services automatically.",
      points: [
        'Services communicate by service name, not localhost.',
        'Environment variables configure Spring via relaxed binding.',
        'Healthcheck + depends_on condition for startup order.',
        'Named volume keeps database data.',
      ],
      difficulty: 'Intermediate',
    },
    {
      id: 'microservices-docker-q7',
      question: 'What are Spring Boot buildpacks and when would you use them instead of a Dockerfile?',
      answer: "Spring Boot's Maven and Gradle plugins can build a container image using Cloud Native Buildpacks (Paketo) with `./mvnw spring-boot:build-image` or `./gradlew bootBuildImage`. No Dockerfile is needed: the buildpack chooses a suitable JRE, uses the layered jar for efficient layers, configures JVM memory settings for container limits and runs as a non-root user.\n\nBuildpacks are a good choice when you want secure, well-optimised images with little effort and consistent standards across many services. A handwritten Dockerfile is better when you need full control, such as extra OS packages, a specific base image required by your company, or unusual startup scripts.",
      points: [
        'spring-boot:build-image / bootBuildImage.',
        'Layered, non-root, memory-tuned images without a Dockerfile.',
        'Dockerfile when you need full control.',
      ],
      difficulty: 'Intermediate',
    },
    {
      id: 'microservices-docker-q8',
      question: 'Describe a CI/CD pipeline for a Spring Boot microservice.',
      answer: "On every push or pull request the CI server (GitHub Actions, GitLab CI, Jenkins) checks out the code, sets up Java with a dependency cache, and runs `./mvnw verify`, which compiles, runs unit tests and integration tests (for example with Testcontainers) and checks coverage. Static analysis and dependency vulnerability scans run as well. A failing step stops the pipeline and the pull request cannot be merged.\n\nOn the main branch, the pipeline builds a Docker image tagged with the commit SHA or release version, scans it, and pushes it to a registry. The CD part deploys that exact image to staging (for example by updating a Kubernetes manifest or through Argo CD), runs smoke tests, and then promotes the same image to production, ideally with a rolling or canary deployment and an easy rollback to the previous tag.",
      points: [
        'CI: build, unit and integration tests, analysis on every change.',
        'Image tagged with commit SHA, pushed to a registry.',
        'Deploy to staging, verify, promote the same image.',
        'Rolling/canary deployments with quick rollback.',
      ],
      difficulty: 'Advanced',
    },
    {
      id: 'microservices-docker-q9',
      question: 'What are the main Kubernetes objects, and how does a Spring Boot app fit into Kubernetes?',
      answer: "A Pod runs one or more containers together. A Deployment declares how many Pod replicas to run, replaces crashed Pods and performs rolling updates. A Service provides a stable DNS name and load-balances traffic to the Pods. ConfigMaps and Secrets hold configuration and credentials, and an Ingress exposes HTTP routes to the outside world.\n\nFor Spring Boot, you package the app as an image, reference it in a Deployment, and pass configuration as environment variables from ConfigMaps and Secrets. Actuator provides `/actuator/health/liveness` and `/actuator/health/readiness` for probes, so Kubernetes restarts stuck Pods and only sends traffic to ready ones. Enable graceful shutdown (`server.shutdown=graceful`) so rolling updates do not drop requests, and set CPU and memory requests and limits.",
      points: [
        'Pod, Deployment, Service, ConfigMap, Secret, Ingress.',
        'Actuator liveness and readiness probes.',
        'Graceful shutdown for zero-downtime rolling updates.',
        'Service DNS replaces client-side discovery like Eureka.',
      ],
      difficulty: 'Advanced',
    },
    {
      id: 'microservices-docker-q10',
      question: 'What are best practices for production-ready Docker images of Java applications?',
      answer: "Use a multi-stage build or buildpacks so the final image contains only a JRE and the application, not build tools or source. Pick a small, maintained base image with a pinned version and rebuild regularly to get security patches. Run as a non-root user, and use an exec-form `ENTRYPOINT` so the JVM receives SIGTERM and Spring Boot can shut down gracefully.\n\nMake the JVM container-aware: modern JVMs respect container memory limits, and you can size the heap with `-XX:MaxRAMPercentage=75`. Keep secrets out of the image and pass configuration through environment variables. Use layered jars for fast rebuilds, tag images with immutable versions or commit SHAs rather than `latest`, scan images for vulnerabilities in CI, and expose health endpoints for orchestrator probes.",
      example: `ENTRYPOINT ["java", "-XX:MaxRAMPercentage=75", "-jar", "app.jar"]`,
      points: [
        'Minimal JRE image, pinned and regularly patched.',
        'Non-root user and exec-form ENTRYPOINT.',
        'Container-aware heap sizing with MaxRAMPercentage.',
        'No secrets in images; immutable tags; vulnerability scans.',
      ],
      difficulty: 'Advanced',
    },
  ],
}

export default topic
