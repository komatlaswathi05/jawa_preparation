const topic = {
  id: 'dev-tooling',
  category: 'spring-boot',
  title: 'Developer Tooling: Git, Maven/Gradle & Linux',
  description: "The everyday tools interviewers expect you to know: Git workflows, merge vs rebase, resolving conflicts, undoing mistakes, cherry-pick and bisect; Maven lifecycle, dependency management and multi-module builds; Gradle; and Linux commands for debugging a running service.",
  difficulty: 'Beginner',
  overview: "Writing Java is only part of a backend developer's job. Every day you also branch, commit and merge with Git, build and manage dependencies with Maven or Gradle, and log in to servers or containers to find out why a service is slow or down. Interviewers ask about these tools because they reveal real working experience: how you would undo a bad commit on a shared branch, why a dependency version is not the one you expected, or which commands you run when a production pod is using 100% CPU.\n\nThink of these tools as the workshop around the code. Git is the logbook recording every change and who made it, with the ability to try ideas on separate pages. Maven or Gradle is the assembly line that fetches parts, builds, tests and packages the product in the same way every time. Linux commands are the mechanic's instruments for inspecting a running engine.\n\nThis topic focuses on practical knowledge: the commands and concepts that come up in interviews and in daily work. JVM-specific diagnostic tools (jcmd, jstack, heap dumps, JFR) are covered in the JVM topic. Examples use an `order-service` project.",

  subtopics: [
    {
      id: 'git-model',
      title: 'Git fundamentals: working tree, staging area and commits',
      explanation: "Git tracks three areas: the working tree (your files), the staging area or index (what will go into the next commit, prepared with `git add`), and the repository (commits). A commit is a snapshot of the whole project plus metadata and a pointer to its parent commit(s), identified by a SHA hash. A branch is just a movable pointer to a commit, and `HEAD` points to the branch you are on.\n\nGit is distributed: your clone contains the full history. `git fetch` downloads new commits from the remote without changing your branches; `git pull` is fetch plus merge (or rebase, with `--rebase` or `pull.rebase=true`); `git push` uploads your commits. Write small, focused commits with clear messages explaining why a change was made.",
      example: `git clone git@github.com:shop/order-service.git
git switch -c feature/order-cancellation     # create and switch to a branch

git status                                    # what changed?
git diff                                      # unstaged changes
git add src/main/java/com/shop/order/CancelService.java
git diff --staged                             # what will be committed
git commit -m "Allow customers to cancel unpaid orders"

git fetch origin                              # download, do not change branches
git log --oneline --graph --all               # visualise history
git push -u origin feature/order-cancellation`,
      interviewPoints: [
        "Working tree, staging area, repository.",
        "Commit = snapshot + parent pointer; branch = movable pointer.",
        "fetch downloads; pull = fetch + merge/rebase.",
        "Small commits with meaningful messages.",
      ],
    },
    {
      id: 'merge-vs-rebase',
      title: 'Merge vs rebase',
      explanation: "Both integrate changes from one branch into another. `git merge main` (on your feature branch) creates a merge commit with two parents, preserving exactly what happened; if your branch has no new commits, Git simply fast-forwards the pointer. History stays truthful but can become cluttered with merge commits.\n\n`git rebase main` replays your commits one by one on top of the latest main, creating new commits with new hashes, which gives a clean, linear history. Interactive rebase (`git rebase -i`) lets you squash, reorder, reword or drop commits before opening a pull request. The golden rule: never rebase commits that others have already based work on (shared branches such as main), because rewriting them forces everyone else to fix their history. After rebasing your own pushed feature branch, push with `--force-with-lease`, which refuses to overwrite commits you have not seen.",
      example: `# before:     A---B---C  main
#                   \\
#                    D---E  feature

git switch feature
git merge main
#             A---B---C------M  feature (M has parents E and C)
#                  \\        /
#                   D------E

git rebase main
#             A---B---C---D'---E'  feature (new commits, linear)

git rebase -i HEAD~3            # squash / reword the last 3 commits
git push --force-with-lease     # safe force-push of your own branch`,
      interviewPoints: [
        "Merge preserves history with a merge commit.",
        "Rebase rewrites commits for a linear history.",
        "Never rebase shared/public branches.",
        "--force-with-lease instead of --force.",
      ],
    },
    {
      id: 'conflicts',
      title: 'Resolving merge conflicts',
      explanation: "A conflict happens when two branches changed the same lines (or one deleted a file the other changed), so Git cannot decide automatically. Git stops, marks the file with conflict markers, and waits. `<<<<<<<` to `=======` is your side (for a merge, HEAD), `=======` to `>>>>>>>` is the incoming side.\n\nEdit the file to the correct combined result (often neither side exactly), remove the markers, run the tests, `git add` the file and continue with `git commit` (merge) or `git rebase --continue` (rebase). You can always abort with `git merge --abort` or `git rebase --abort`. IDEs provide three-way merge tools. To reduce conflicts: integrate from main frequently, keep branches short-lived, and avoid mass reformatting mixed with real changes.",
      example: `git merge main
# CONFLICT (content): Merge conflict in src/main/java/com/shop/order/PriceService.java

<<<<<<< HEAD
    private static final BigDecimal FREE_SHIPPING_THRESHOLD = new BigDecimal("50");
=======
    private static final BigDecimal FREE_SHIPPING_THRESHOLD = new BigDecimal("40");
>>>>>>> main

# decide the correct result, remove the markers, then:
git add src/main/java/com/shop/order/PriceService.java
./mvnw test
git commit                      # completes the merge
# (during a rebase: git rebase --continue)

git merge --abort               # or give up and return to the previous state`,
      interviewPoints: [
        "Conflicts: same lines changed on both sides.",
        "Edit, remove markers, test, add, continue.",
        "--abort returns to the previous state.",
        "Integrate often, keep branches short.",
      ],
    },
    {
      id: 'undoing',
      title: 'Undoing changes: restore, reset, revert, reflog',
      explanation: "Discard uncommitted changes in a file with `git restore <file>`, or unstage it with `git restore --staged <file>`. Fix the last commit (message or forgotten file) with `git commit --amend`, but only before pushing.\n\n`git reset` moves the current branch pointer back: `--soft` keeps the changes staged, `--mixed` (the default) keeps them in the working tree unstaged, and `--hard` throws them away. Because reset rewrites history, use it only on local, unpushed commits. On shared branches use `git revert <sha>`, which creates a new commit that undoes an earlier one, so nobody's history is rewritten. If you lose commits (after a hard reset or a bad rebase), `git reflog` lists every position HEAD has had, so you can recover them.",
      example: `git restore src/main/resources/application.yml       # discard local edits
git restore --staged pom.xml                         # unstage

git commit --amend -m "Fix typo in cancel endpoint"   # before pushing only

git reset --soft HEAD~1      # undo last commit, keep changes staged
git reset HEAD~1             # undo last commit, keep changes unstaged (mixed)
git reset --hard HEAD~1      # undo last commit and DISCARD its changes

git revert 3f2a9c1           # safe on shared branches: new commit that undoes 3f2a9c1

git reflog                   # find lost commits
# 3f2a9c1 HEAD@{2}: commit: Add cancellation endpoint
git reset --hard 3f2a9c1     # or: git branch rescue 3f2a9c1`,
      interviewPoints: [
        "restore for files; amend for the last local commit.",
        "reset --soft / --mixed / --hard.",
        "revert on shared branches.",
        "reflog recovers lost commits.",
      ],
    },
    {
      id: 'cherry-pick-stash-bisect',
      title: 'cherry-pick, stash and bisect',
      explanation: "`git cherry-pick <sha>` applies the changes of one commit onto the current branch as a new commit. It is typically used to bring an urgent fix from main to a release branch without merging everything else.\n\n`git stash` saves uncommitted work temporarily so you can switch branches, and `git stash pop` brings it back. `git bisect` finds the commit that introduced a bug by binary search: mark a known bad and a known good commit, and Git checks out commits in between for you to test, halving the range each time. With `git bisect run <script>` (for example running one test), it does the whole search automatically.",
      example: `# hotfix: copy one commit from main to the release branch
git switch release/2.4
git cherry-pick 9b1e7d2
git push

# park unfinished work
git stash push -m "wip: refund validation"
git switch main && git pull
git switch feature/refunds
git stash pop

# find which commit broke the price calculation
git bisect start
git bisect bad                  # current commit is broken
git bisect good v2.3.0          # this release was fine
git bisect run ./mvnw -q test -Dtest=PriceServiceTest
# -> "4c7d0e5 is the first bad commit"
git bisect reset`,
      interviewPoints: [
        "cherry-pick copies a single commit.",
        "stash parks uncommitted work.",
        "bisect binary-searches for the bad commit.",
        "bisect run automates it with a test.",
      ],
    },
    {
      id: 'branching-strategies',
      title: 'Branching strategies and pull requests',
      explanation: "GitHub Flow: main is always deployable; every change is a short-lived feature branch merged through a pull request after review and green CI. Trunk-based development goes further: everyone integrates into main at least daily with very small changes, using feature flags to hide unfinished work; it is the model most associated with continuous delivery. Git Flow uses long-lived develop and main branches plus feature, release and hotfix branches; it suits products with scheduled releases and multiple supported versions, but it is heavyweight for continuously deployed services.\n\nWhatever the model, use pull requests for review, require CI checks (build, tests, static analysis) before merging, protect main from direct pushes, and choose a merge style (merge commit, squash or rebase) consistently. Conventional commit messages (`feat:`, `fix:`) help generate changelogs and version numbers.",
      example: `GitHub Flow / trunk-based
main  ──●────●────●────●────●──   always deployable
         \\  /      \\  /
          ●●        ●●            short-lived branches, PR + CI, merged within days

Git Flow
main     ──●───────────────●──────  releases only (tagged)
develop  ──●──●──●──●──●──●───────  integration
feature      \\──●──●──/
release                \\──●──/     stabilisation
hotfix   (from main, merged into main and develop)

Conventional commits
feat(orders): allow cancelling unpaid orders
fix(payments): retry on gateway timeout
chore(deps): bump spring-boot to 3.4.1`,
      interviewPoints: [
        "GitHub Flow: main deployable, short branches, PRs.",
        "Trunk-based: tiny changes, daily integration, feature flags.",
        "Git Flow: develop/release/hotfix for scheduled releases.",
        "Protected main, required CI and reviews.",
      ],
    },
    {
      id: 'maven-lifecycle',
      title: 'Maven build lifecycle, phases and plugins',
      explanation: "Maven's default lifecycle is an ordered list of phases. The important ones are `validate`, `compile`, `test` (unit tests), `package` (build the JAR), `verify` (integration tests and checks), `install` (copy the artifact to your local `~/.m2` repository) and `deploy` (upload it to a remote repository). Running a phase runs all phases before it, so `mvn package` also compiles and tests. The separate `clean` lifecycle deletes the `target` directory.\n\nPlugins do the actual work, and their goals are bound to phases: the compiler plugin to `compile`, Surefire runs unit tests (`*Test`) in `test`, Failsafe runs integration tests (`*IT`) in `integration-test`/`verify`, and the Spring Boot plugin repackages the JAR into an executable fat JAR during `package`. Use the Maven wrapper (`./mvnw`) so everyone and CI use the same Maven version.",
      example: `./mvnw clean verify              # full build: compile, unit tests, package, integration tests
./mvnw -DskipTests package       # build the JAR without running tests
./mvnw test -Dtest=OrderServiceTest#cancelsUnpaidOrder   # one test method
./mvnw spring-boot:run           # run the application
./mvnw -pl order-api -am install # build one module plus the modules it depends on

validate -> compile -> test -> package -> verify -> install -> deploy
                        |         |          |
                    Surefire  spring-boot  Failsafe
                    (*Test)   repackage    (*IT)`,
      interviewPoints: [
        "Phases run in order; a phase runs all previous ones.",
        "package builds, install copies to ~/.m2, deploy uploads.",
        "Surefire for unit tests, Failsafe for integration tests.",
        "Use the Maven wrapper.",
      ],
    },
    {
      id: 'maven-dependencies',
      title: 'Maven dependency management and conflicts',
      explanation: "Dependencies have scopes: `compile` (default, everywhere), `provided` (needed to compile, supplied at runtime, such as the servlet API in a WAR), `runtime` (only at runtime, such as JDBC drivers), and `test`. Dependencies bring their own transitive dependencies, so the same library can be requested in several versions.\n\nMaven resolves version conflicts with \"nearest wins\": the version declared closest to your project in the dependency tree is chosen, and at equal depth the first declaration wins. This can silently pick an older version. Diagnose with `mvn dependency:tree -Dverbose -Dincludes=groupId:artifactId`, then fix by declaring the version in `<dependencyManagement>` (which controls versions without adding dependencies), or by excluding a transitive dependency with `<exclusions>`. Import BOMs (Bills of Materials) such as Spring Boot's or Testcontainers' in `dependencyManagement` so related libraries stay aligned. The Maven Enforcer plugin can fail the build on dependency convergence problems.",
      example: `<dependencyManagement>
  <dependencies>
    <!-- align all Testcontainers modules with one BOM -->
    <dependency>
      <groupId>org.testcontainers</groupId>
      <artifactId>testcontainers-bom</artifactId>
      <version>1.20.4</version>
      <type>pom</type>
      <scope>import</scope>
    </dependency>
    <!-- force a patched version of a transitive dependency -->
    <dependency>
      <groupId>com.fasterxml.jackson.core</groupId>
      <artifactId>jackson-databind</artifactId>
      <version>2.18.2</version>
    </dependency>
  </dependencies>
</dependencyManagement>

<dependency>
  <groupId>com.legacy</groupId>
  <artifactId>legacy-client</artifactId>
  <version>1.4.0</version>
  <exclusions>
    <exclusion>
      <groupId>commons-logging</groupId>
      <artifactId>commons-logging</artifactId>
    </exclusion>
  </exclusions>
</dependency>

$ ./mvnw dependency:tree -Dverbose -Dincludes=com.fasterxml.jackson.core
$ ./mvnw versions:display-dependency-updates`,
      interviewPoints: [
        "Scopes: compile, provided, runtime, test.",
        "Conflicts resolved by nearest wins.",
        "dependency:tree to diagnose.",
        "dependencyManagement, BOMs and exclusions to fix.",
      ],
    },
    {
      id: 'multi-module',
      title: 'Multi-module projects',
      explanation: "Larger codebases are split into modules built together from a parent POM with `<packaging>pom</packaging>` and a `<modules>` list. Typical splits are by layer or by capability: an `order-api` module with DTOs and client interfaces shared with other services, an `order-domain` module with business logic that has no Spring web dependencies, and an `order-app` module that assembles the Spring Boot application.\n\nThe parent holds shared configuration: `dependencyManagement` for versions, `pluginManagement`, properties such as the Java version. Maven builds modules in dependency order (the reactor). Benefits are enforced boundaries and faster, targeted builds (`-pl module -am`); the cost is more build configuration. For microservices, keep one service per repository or clear per-service modules, and avoid a shared \"common\" module that couples everything.",
      example: `order-service/
├── pom.xml                 <packaging>pom</packaging>, <modules>, dependencyManagement
├── order-api/pom.xml       DTOs, client interfaces (published for other services)
├── order-domain/pom.xml    business logic, depends on order-api
└── order-app/pom.xml       Spring Boot app, depends on order-domain, spring-boot-maven-plugin

<!-- parent pom.xml -->
<modules>
  <module>order-api</module>
  <module>order-domain</module>
  <module>order-app</module>
</modules>

$ ./mvnw -pl order-app -am verify     # build order-app and what it depends on`,
      interviewPoints: [
        "Parent POM with packaging pom and modules.",
        "Shared versions and plugin config in the parent.",
        "Reactor builds modules in dependency order.",
        "Avoid a catch-all shared common module.",
      ],
    },
    {
      id: 'gradle',
      title: 'Gradle vs Maven',
      explanation: "Gradle configures builds with code (Kotlin DSL `build.gradle.kts` or Groovy) instead of XML, organised as tasks with dependencies between them. It is usually faster thanks to incremental builds (only rerunning tasks whose inputs changed), a build cache that can be shared across machines, and a long-running daemon. It is very flexible, which is powerful for complex builds but can lead to inconsistent, hard-to-read build scripts. Dependency configurations are `implementation` (not exposed to consumers), `api` (exposed, in library modules), `compileOnly`, `runtimeOnly` and `testImplementation`. When versions conflict, Gradle picks the highest requested version by default.\n\nMaven is convention-based, declarative and very predictable, with a huge ecosystem; its builds look the same everywhere. Both use the same Maven Central repositories, both support BOMs (`platform(...)` in Gradle), and both have a wrapper (`./gradlew`, `./mvnw`). Choose by team familiarity and build complexity; Android and many large multi-project builds use Gradle, many enterprise Spring projects use Maven.",
      example: `// build.gradle.kts
plugins {
    java
    id("org.springframework.boot") version "3.4.1"
    id("io.spring.dependency-management") version "1.1.7"
}

java { toolchain { languageVersion = JavaLanguageVersion.of(21) } }

dependencies {
    implementation("org.springframework.boot:spring-boot-starter-web")
    implementation("org.springframework.boot:spring-boot-starter-data-jpa")
    runtimeOnly("org.postgresql:postgresql")
    testImplementation("org.springframework.boot:spring-boot-starter-test")
    testImplementation(platform("org.testcontainers:testcontainers-bom:1.20.4"))
    testImplementation("org.testcontainers:postgresql")
}

tasks.test { useJUnitPlatform() }

$ ./gradlew build                     # compile, test, package
$ ./gradlew bootRun
$ ./gradlew dependencies --configuration runtimeClasspath
$ ./gradlew build --build-cache`,
      interviewPoints: [
        "Gradle: code-based, tasks, incremental, build cache.",
        "Maven: declarative XML, strong conventions.",
        "implementation vs api; highest version wins by default.",
        "Both use Maven Central, BOMs and wrappers.",
      ],
    },
    {
      id: 'linux-processes',
      title: 'Linux: processes, ports and resources',
      explanation: "When a service misbehaves, first find its process and see what it is using. `ps aux | grep java` or `pgrep -fl java` lists Java processes; `top` or `htop` shows live CPU and memory per process (press `H` in top to see threads). `free -h` shows memory, `df -h` disk space per filesystem (a full disk often breaks logging and databases), and `du -sh *` which directories are large.\n\nFor networking, `ss -tlnp` (or the older `netstat -tlnp`) lists listening ports and which process owns them, and `lsof -i :8080` shows what uses a port, which answers \"Address already in use\". `kill <pid>` sends SIGTERM for a graceful shutdown; `kill -9` (SIGKILL) forces it and skips shutdown hooks, so use it only as a last resort. `kill -3 <pid>` makes a JVM print a thread dump to its standard output. `ulimit -n` shows the open file limit, and \"Too many open files\" errors mean it is exhausted or files and sockets are leaking.",
      example: `$ pgrep -fl java
48213 java -jar order-service.jar

$ top -p 48213                  # CPU / memory of the service; press H for threads
$ free -h
               total   used   free   shared  buff/cache  available
Mem:            15Gi   11Gi  512Mi    120Mi       3.4Gi      3.1Gi
$ df -h /var/log
Filesystem      Size  Used Avail Use% Mounted on
/dev/nvme0n1p1   50G   49G  1.0G  98% /
$ du -sh /var/log/* | sort -h | tail -3

$ ss -tlnp | grep 8080          # who is listening on 8080?
LISTEN 0 100 *:8080 *:* users:(("java",pid=48213,fd=45))
$ lsof -i :8080

$ kill 48213                    # SIGTERM: graceful shutdown
$ kill -3 48213                 # JVM thread dump to stdout
$ kill -9 48213                 # SIGKILL: last resort, no shutdown hooks
$ ls /proc/48213/fd | wc -l     # open file descriptors`,
      interviewPoints: [
        "ps/pgrep, top/htop for processes and threads.",
        "free, df, du for memory and disk.",
        "ss/netstat and lsof for ports.",
        "SIGTERM vs SIGKILL; kill -3 for thread dumps.",
      ],
    },
    {
      id: 'linux-logs',
      title: 'Linux: logs, searching and HTTP checks',
      explanation: "Logs are the first place to look. `tail -f app.log` follows a log live; `less +F` does the same but lets you scroll and search. `grep` finds lines: `-i` ignores case, `-n` shows line numbers, `-C 5` shows 5 lines of context, `-r` searches directories, and `zgrep` searches compressed rotated logs. Combine with pipes to count or summarise: `grep ERROR app.log | awk '{print $5}' | sort | uniq -c | sort -rn | head` lists the most frequent error sources. For services managed by systemd, `journalctl -u order-service -f --since \"10 min ago\"`; in containers, `docker logs -f` or `kubectl logs -f`.\n\n`curl` checks endpoints directly: `-i` shows headers, `-v` shows the connection and TLS details, `-w` prints timings, and it can call the health endpoint from inside the container to separate application problems from network problems. `jq` pretty-prints and filters JSON responses and JSON logs.",
      example: `$ tail -f /var/log/order-service/app.log
$ grep -n -C 3 "OrderNotFoundException" app.log
$ zgrep "correlationId=7f3c" app.log.*.gz

# top 5 exception types in today's log
$ grep -o "[A-Za-z.]*Exception" app.log | sort | uniq -c | sort -rn | head -5
    412 java.net.SocketTimeoutException
     37 org.springframework.dao.DataIntegrityViolationException

$ journalctl -u order-service --since "10 min ago" -f
$ kubectl logs -f deploy/order-service --since=10m

$ curl -i http://localhost:8080/actuator/health
$ curl -s -o /dev/null -w "status=%{http_code} total=%{time_total}s\\n" http://localhost:8080/api/orders/42
$ curl -s http://localhost:8080/actuator/health | jq '.components.db.status'`,
      interviewPoints: [
        "tail -f / less +F to follow logs.",
        "grep with -n, -C, -i, zgrep for rotated logs.",
        "Pipes with sort, uniq -c to summarise.",
        "curl -i/-v/-w and jq for HTTP checks.",
      ],
    },
    {
      id: 'debugging-running-service',
      title: 'Debugging a slow or failing service: a checklist',
      explanation: "A structured approach beats random commands. 1) Is it up? Check the process or pod status and the health endpoint. 2) What changed? A recent deployment, configuration change or traffic spike explains most incidents. 3) Look at metrics and logs: error rates, latency, the most frequent exceptions, and correlation ids of failing requests. 4) Check resources: CPU (top, with H for hot threads), memory and GC (is it close to the heap limit or OOMKilled?), disk space, file descriptors and connection pools. 5) Check dependencies: database connections and slow queries, downstream service latency, DNS and network with curl from inside the container.\n\nFor JVM-level detail, take several thread dumps a few seconds apart (`jcmd <pid> Thread.print`) to find stuck or hot threads, check GC with `jcmd <pid> GC.heap_info` or `jstat -gcutil`, and record a JFR profile; these are covered in the JVM topic. Mitigate first (roll back, scale out, restart, disable a feature flag), then find the root cause, and write it down in a post-mortem.",
      example: `High CPU on order-service pod:

$ kubectl top pod order-service-7d9f8c6b5c-2xkqp          # confirm CPU
$ kubectl exec -it order-service-7d9f8c6b5c-2xkqp -- sh
$ top -H -p 1                                             # hottest thread ids, e.g. 57
$ printf '%x\\n' 57                                        # -> 39 (hex thread id)
$ jcmd 1 Thread.print > /tmp/td1.txt                       # repeat 2-3 times
$ grep -A 20 "nid=0x39" /tmp/td1.txt                       # what is that thread doing?
"http-nio-8080-exec-12" ... nid=0x39 runnable
   at java.util.regex.Pattern$Loop.match(...)              # catastrophic regex backtracking

$ jstat -gcutil 1 1000 5                                   # is it GC instead?
  S0     S1     E      O      M     YGC   FGC   GCT
  0.00  100.00  63.2   97.8   96.1   812    54   88.3      # old gen full, frequent full GCs`,
      interviewPoints: [
        "Is it up? What changed? Metrics and logs.",
        "Resources: CPU, memory/GC, disk, file descriptors, pools.",
        "Dependencies: DB, downstream services, network.",
        "Thread dumps, GC stats, JFR; mitigate first, then root cause.",
      ],
    },
  ],

  commonMistakes: [
    "Rebasing or force-pushing shared branches, rewriting other people's history.",
    "Using git push --force instead of --force-with-lease on your own branches.",
    "Using git reset --hard on commits that were already pushed instead of git revert.",
    "Committing secrets, build output or IDE files; not using .gitignore.",
    "Huge, long-lived feature branches that produce painful merge conflicts.",
    "Resolving conflicts by blindly taking one side without running the tests.",
    "Running mvn install when package or verify is enough, or skipping tests by habit.",
    "Not understanding \"nearest wins\" and being surprised by an old transitive dependency version.",
    "Hard-coding versions in every module instead of using dependencyManagement and BOMs.",
    "Using kill -9 by default, which skips graceful shutdown and shutdown hooks.",
    "Restarting a broken service before collecting thread dumps and logs, losing the evidence.",
    "Forgetting to check disk space and file descriptor limits when a service fails strangely.",
  ],

  interviewTips: [
    "Explain merge vs rebase with a small diagram and state the golden rule of rebasing.",
    "Know how to undo a pushed bad commit (revert) versus a local one (reset or amend).",
    "Mention git bisect when asked how you would find when a bug was introduced; it impresses interviewers.",
    "Describe how you would diagnose a dependency conflict with dependency:tree and fix it with dependencyManagement.",
    "Have a structured incident checklist ready: status, recent changes, logs and metrics, resources, dependencies, JVM tools.",
    "Mention the Maven/Gradle wrapper and reproducible builds in CI.",
  ],

  interviewQuestions: [
    {
      id: 'dev-tooling-q1',
      question: "What is the difference between git merge and git rebase? When would you use each?",
      answer: "Both combine work from two branches. git merge creates a new merge commit with two parents, preserving the complete history of how branches diverged and came together, and it never changes existing commits; if there are no diverging commits it simply fast-forwards. git rebase takes the commits on your branch and replays them on top of another branch, creating new commits with new hashes, which produces a linear history without merge commits. Use rebase to update your own local or personal feature branch with the latest main and to clean up commits with interactive rebase before a pull request. Use merge to integrate into shared branches, or when you want to preserve the exact history. Never rebase commits that others have pulled, because rewriting published history forces everyone to reconcile their copies; if you must update a pushed personal branch, use push --force-with-lease.",
      points: [
        "Merge: merge commit, preserves history.",
        "Rebase: replays commits, linear history, new hashes.",
        "Rebase own branches; merge shared ones.",
        "Never rebase public history; --force-with-lease.",
      ],
      difficulty: 'Beginner',
    },
    {
      id: 'dev-tooling-q2',
      question: "You pushed a commit to main that breaks production. How do you undo it?",
      answer: "Use git revert <sha>, which creates a new commit that applies the inverse of the bad commit, then push it through the normal pipeline. This undoes the change without rewriting history, so other developers' clones and CI remain consistent. For a merge commit, use git revert -m 1 <sha> to specify the mainline parent. Do not use git reset --hard and force-push on a shared branch, because that rewrites history others already have, and branch protection usually forbids it anyway. If the fastest mitigation is redeploying the previous release or turning off a feature flag, do that first, then revert in Git, and later fix the problem properly with a new commit, keeping in mind that re-merging a reverted change requires reverting the revert.",
      example: `git revert 3f2a9c1
git push origin main`,
      points: [
        "git revert creates an inverse commit.",
        "No history rewrite on shared branches.",
        "revert -m 1 for merge commits.",
        "Mitigate via rollback or feature flag first.",
      ],
      difficulty: 'Beginner',
    },
    {
      id: 'dev-tooling-q3',
      question: "Explain git reset --soft, --mixed and --hard.",
      answer: "All three move the current branch pointer to another commit, for example HEAD~1, effectively removing the later commits from the branch. They differ in what happens to the changes those commits contained. --soft keeps the changes staged in the index, ready to be committed again, which is useful for squashing the last few commits into one. --mixed, the default, keeps the changes in the working tree but unstages them, so you can re-add them selectively. --hard discards the changes from both the index and the working tree, losing them unless you recover the commit through git reflog. Because reset rewrites branch history, use it only on commits that have not been pushed to a shared branch; for shared history use git revert.",
      points: [
        "All move the branch pointer.",
        "--soft: changes stay staged.",
        "--mixed: changes stay unstaged.",
        "--hard: changes discarded; reflog to recover.",
      ],
      difficulty: 'Intermediate',
    },
    {
      id: 'dev-tooling-q4',
      question: "How would you find which commit introduced a bug?",
      answer: "Use git bisect, which performs a binary search through history. Start with git bisect start, mark the current broken commit with git bisect bad, and mark a commit or tag where the behaviour was correct with git bisect good v2.3.0. Git checks out a commit halfway between; you test it and mark it good or bad, and Git halves the range each time, so even a thousand commits need only about ten steps. If the bug can be detected by a script or a single test, git bisect run ./mvnw -q test -Dtest=PriceServiceTest automates the whole search, because the script's exit code tells Git whether each commit is good or bad. At the end Git reports the first bad commit, and git bisect reset returns you to where you started.",
      points: [
        "git bisect: binary search over commits.",
        "Mark good and bad, test midpoints.",
        "bisect run automates with a test.",
        "log2(n) steps.",
      ],
      difficulty: 'Intermediate',
    },
    {
      id: 'dev-tooling-q5',
      question: "Explain the Maven build lifecycle.",
      answer: "Maven has three built-in lifecycles: clean, default and site. The default lifecycle is an ordered sequence of phases, the most important being validate, compile, test, package, verify, install and deploy. Invoking a phase executes every phase before it, so mvn verify compiles, runs unit tests, packages and runs integration tests. Phases themselves do nothing; plugin goals bound to them do the work: the compiler plugin compiles, Surefire runs unit tests in the test phase, the JAR and Spring Boot plugins package an executable JAR in package, Failsafe runs integration tests around verify, install copies the artifact to the local ~/.m2 repository so other local projects can use it, and deploy uploads it to a remote repository such as Nexus or Artifactory. mvn clean runs the clean lifecycle, removing the target directory.",
      points: [
        "clean, default, site lifecycles.",
        "Phases run in order, including all previous ones.",
        "Plugin goals bound to phases do the work.",
        "install = local repo; deploy = remote repo.",
      ],
      difficulty: 'Beginner',
    },
    {
      id: 'dev-tooling-q6',
      question: "How does Maven resolve dependency version conflicts, and how do you fix a wrong version?",
      answer: "When the same artifact appears several times in the dependency tree with different versions, Maven uses dependency mediation with the nearest-wins rule: the version closest to your project in the tree is chosen, and if two are at the same depth, the one declared first wins. It does not pick the highest version, so an older transitive version can win silently and cause NoSuchMethodError or ClassNotFoundException at runtime. Diagnose with mvn dependency:tree -Dverbose -Dincludes=group:artifact, which shows which paths bring in which versions and which were omitted. Fix it by declaring the desired version in dependencyManagement, importing a BOM that aligns a family of libraries, declaring the dependency directly, or excluding the unwanted transitive dependency. The Enforcer plugin's dependencyConvergence rule can catch such conflicts in CI.",
      points: [
        "Nearest wins, then first declaration.",
        "Not highest version.",
        "dependency:tree -Dverbose to diagnose.",
        "dependencyManagement, BOMs, exclusions, Enforcer.",
      ],
      difficulty: 'Intermediate',
    },
    {
      id: 'dev-tooling-q7',
      question: "What are the differences between Maven and Gradle?",
      answer: "Maven uses declarative XML (pom.xml) and a fixed lifecycle with strong conventions, so every Maven project looks and builds similarly; it is predictable and easy to understand, but customisation requires plugins and can be verbose. Gradle uses build scripts in Kotlin or Groovy, modelled as a graph of tasks, which makes it very flexible for complex builds. Gradle is usually faster because of incremental task execution, a local and remote build cache, and the Gradle daemon. Dependency handling differs: Gradle's implementation and api configurations control what is exposed to consumers, and conflicts are resolved to the highest version by default, whereas Maven uses nearest wins. Both use Maven repositories, support BOMs and have wrappers for reproducible builds. The choice usually depends on team experience and build complexity.",
      points: [
        "Maven: declarative XML, conventions, predictable.",
        "Gradle: code-based tasks, flexible.",
        "Gradle: incremental builds, build cache, daemon.",
        "Conflict resolution: nearest vs highest.",
      ],
      difficulty: 'Beginner',
    },
    {
      id: 'dev-tooling-q8',
      question: "A Spring Boot service fails to start with \"Port 8080 was already in use\". How do you investigate?",
      answer: "Find out which process holds the port with ss -tlnp | grep 8080 or lsof -i :8080, which show the listening socket and the owning process id. Often it is a previous instance of the same application that did not shut down, an IDE run configuration still running, or another local service. Check the process with ps -fp <pid> and stop it gracefully with kill <pid>, using kill -9 only if it does not respond. Alternatively run the new instance on another port with --server.port=8081 or SERVER_PORT, or use server.port=0 in tests to pick a random free port. In containers or Kubernetes this error usually means two processes in the same container or pod, or a misconfigured hostNetwork, since each pod has its own network namespace.",
      example: `$ lsof -i :8080
COMMAND   PID  USER   FD   TYPE  NODE NAME
java    48213 rahul   45u  IPv6  TCP  *:http-alt (LISTEN)
$ kill 48213`,
      points: [
        "ss -tlnp or lsof -i to find the owner.",
        "Stop gracefully with kill; -9 as last resort.",
        "Or change server.port; port 0 in tests.",
        "In pods: separate network namespaces.",
      ],
      difficulty: 'Beginner',
    },
    {
      id: 'dev-tooling-q9',
      question: "A Java service on a Linux server is using 100% CPU. What steps do you take?",
      answer: "Confirm with top which process uses the CPU and whether it is the Java service. Check whether it is GC rather than application code: jstat -gcutil <pid> 1000 or the GC logs show if the old generation is full and full GCs are running constantly, which points to a memory leak or an undersized heap. If it is application code, find the hot threads with top -H -p <pid>, convert the busiest thread id to hexadecimal, take a thread dump with jcmd <pid> Thread.print (or kill -3), and find the thread whose nid matches; its stack trace shows the code consuming CPU. Take two or three dumps a few seconds apart to see whether it stays in the same place, such as an infinite loop, a catastrophic regular expression, or heavy serialization. A short JFR recording gives a fuller CPU profile. Meanwhile check recent deployments and traffic, and mitigate by scaling out or rolling back if users are affected, preserving the diagnostics first.",
      points: [
        "top to confirm the process.",
        "Rule out GC with jstat or GC logs.",
        "top -H, hex thread id, thread dumps, match nid.",
        "Several dumps, JFR; check recent changes, mitigate.",
      ],
      difficulty: 'Advanced',
    },
  ],
}

export default topic
