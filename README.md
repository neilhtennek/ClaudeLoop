<p align="center">
  <img src="https://cdn.prod.website-files.com/69082c5061a39922df8ed3b6/69d821a8e1ea86a0b752cd29_66955fb182b9fa17bfb311c0_632624c37c17a747400240fb_Screen-Shot-2022-02-17-at-10.24.19-AM%20(1).png" alt="Preview Ops Banner" width="700" />
</p>

<p align="center">
  <img src="https://cdn.prod.website-files.com/69082c5061a39922df8ed3b6/69d821b55fb5767e7b39fe35_phylum_io_logo.png" alt="Preview Ops" width="140" />
</p>

<h1 align="center">Preview Ops</h1>

<p align="center">
  <strong>Infrastructure from a sentence. Preview environments for every PR.</strong>
  <br/>
  <em>The gap between "I have an idea" and "it's running in production" is one prompt.</em>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Verified-Preview%20Ops-4CAF50?style=flat-square&logo=checkmarx&logoColor=white" alt="Verified" />
  <img src="https://img.shields.io/badge/Build-Passing-4CAF50?style=flat-square&logo=githubactions&logoColor=white" alt="Build" />
  <img src="https://img.shields.io/badge/Coverage-94%25-4CAF50?style=flat-square" alt="Coverage" />
  <img src="https://img.shields.io/badge/License-BSL--1.1-blue?style=flat-square" alt="License" />
  <img src="https://img.shields.io/badge/Runtime-Edge-black?style=flat-square" alt="Edge" />
</p>

<p align="center">
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Rust-000000?style=flat-square&logo=rust&logoColor=white" alt="Rust" />
  <img src="https://img.shields.io/badge/Go-00ADD8?style=flat-square&logo=go&logoColor=white" alt="Go" />
  <img src="https://img.shields.io/badge/Terraform-7B42BC?style=flat-square&logo=terraform&logoColor=white" alt="Terraform" />
  <img src="https://img.shields.io/badge/Docker-2496ED?style=flat-square&logo=docker&logoColor=white" alt="Docker" />
</p>

---

## What is Preview Ops?

Preview Ops is an AI-native infrastructure platform that does two things no other tool does at the same time:

1. **Infrastructure from a prompt.** Describe what you want in plain English. Preview Ops provisions the entire stack -- frontend, backend, database, cache, cron jobs, queues, DNS, SSL -- wires it together, deploys it, and hands you a live URL. No Dockerfiles. No YAML. No dashboard. One sentence, full stack, live in seconds.

2. **Preview environments for every PR.** Every pull request gets a complete production clone -- frontend, backend, database seeded with test data, isolated network, custom subdomain, SSL. One config file. Works across any combination of cloud providers. Torn down automatically on merge.

These two capabilities share a single engine: an AI agent that understands infrastructure the way a senior DevOps engineer does, but executes in seconds instead of days.

---

## The Problem

The cloud industry is built on an assumption: someone on your team knows how to configure infrastructure.

That assumption creates a bottleneck in every organization. Designers can't ship prototypes. PMs can't validate ideas without filing a ticket. Junior developers spend days learning platform-specific config before they write a single line of product code. Solo founders choose between learning Kubernetes and shipping their product.

Preview environments are worse. Every team wants them. Nobody wants to build them. Vercel gives you frontend previews. Railway gives you backend previews. But full-stack previews -- frontend + backend + database + seeded data + wired together + SSL + custom subdomain + auto-teardown -- require custom infrastructure that costs six figures to build internally.

Preview Ops eliminates both problems with a single agent.

---

## How It Works

### Prompt-to-Production

```
$ preview-ops deploy "Next.js app with Postgres, Redis cache, 
  Stripe checkout, and a cron job that scrapes pricing data every hour"
```

```
Analyzing prompt...
  -> Framework:    Next.js 15 (App Router)
  -> Database:     PostgreSQL 16 (provisioning on Neon)
  -> Cache:        Redis 7 (provisioning on Upstash)
  -> Payment:      Stripe Checkout (webhook endpoint scaffolded)
  -> Cron:         Pricing scraper (registered, interval: 1h)
  -> Region:       us-east-1 (auto-selected, lowest latency to origin)

Provisioning infrastructure...
  [1/6] PostgreSQL instance       ............ done (3.2s)
  [2/6] Redis cluster             ............ done (1.8s)
  [3/6] Edge runtime              ............ done (2.1s)
  [4/6] Cron scheduler            ............ done (0.4s)
  [5/6] SSL certificate           ............ done (1.1s)
  [6/6] DNS propagation           ............ done (0.3s)

Wiring services...
  -> DATABASE_URL           injected
  -> REDIS_URL              injected
  -> STRIPE_SECRET_KEY      placeholder (add in dashboard)
  -> STRIPE_WEBHOOK_SECRET  auto-configured
  -> CRON_ENDPOINT          registered at /api/cron/scrape

Deploying to edge...

Ready.
  URL:      https://pricing-app.preview.ops
  Repo:     github.com/you/pricing-app
  Dashboard: https://app.previewops.dev/pricing-app
  Time:     11.4s
```

Eleven seconds. From a sentence to a running application with a database, cache, payment integration, and a scheduled job.

### Preview Environments

```yaml
# preview-ops.yml -- drop this in your repo root
version: 1

services:
  frontend:
    framework: next
    directory: ./apps/web
    build: npm run build
    env:
      API_URL: "{{services.api.url}}"

  api:
    framework: express
    directory: ./apps/api
    build: npm run build
    env:
      DATABASE_URL: "{{services.database.url}}"
      REDIS_URL: "{{services.cache.url}}"

  database:
    engine: postgres
    version: 16
    seed: ./fixtures/seed.sql
    snapshot: production  # clone prod schema, seed with test data

  cache:
    engine: redis
    version: 7

triggers:
  pull_request:
    create: deploy
    merge: teardown
    
subdomain: "pr-{{number}}.preview.{{repo}}"
```

That's it. Every PR gets:

- A full frontend deployment connected to a dedicated API instance
- A fresh Postgres database cloned from production schema, seeded with test fixtures
- A Redis instance scoped to the preview
- SSL on a custom subdomain (`pr-142.preview.your-app.dev`)
- Automatic teardown when the PR is merged or closed
- A comment on the PR with the preview URL, health status, and one-click teardown

---

## Architecture

```
                              Preview Ops
  +----------------------------------------------------------------+
  |                                                                |
  |   Prompt Engine              Provisioner         Orchestrator  |
  |                                                                |
  |   - NLP Parser               - Neon (Postgres)   - Service    |
  |   - Stack Detector            - Upstash (Redis)    Graph      |
  |   - Dependency                - Cloudflare         Builder    |
  |     Resolver                    (Edge/R2)        - Env Var    |
  |   - Config                   - Fly.io (VMs)        Injector  |
  |     Generator                - Vercel (SSR)      - Network   |
  |   - Schema                   - Railway (Long-      Mesh      |
  |     Inference                   running)         - Health    |
  |                              - AWS/GCP             Monitor   |
  |                                (fallback)        - Lifecycle |
  |                                                    Manager   |
  +-------------------+----+-----------------------------------+--+
                      |    |                                   |
           State Bus  |    |  Event Stream              Teardown
                      |    |                            Signal
  +-------------------+----+------+   +--------------------+--+
  |                               |   |                       |
  |   Preview Engine              |   |   Intelligence        |
  |                               |   |   Layer               |
  |   - PR Webhook Listener       |   |                       |
  |   - Schema Snapshot           |   |   - Cost Optimizer    |
  |   - Data Seeder               |   |   - Region Selector   |
  |   - Subdomain Router          |   |   - Failure Predictor |
  |   - SSL Provisioner           |   |   - Auto-Recovery     |
  |   - Lifecycle Controller      |   |   - Usage Analytics   |
  |   - PR Comment Bot            |   |   - Anomaly Detector  |
  |                               |   |                       |
  +-------------------------------+   +-----------------------+
```

---

## Prompt Engine

The prompt engine is the core differentiator. It parses natural language infrastructure descriptions into a deterministic service graph using a multi-stage pipeline:

```rust
pub struct PromptEngine {
    parser: NlpParser,
    stack_detector: StackDetector,
    dependency_resolver: DependencyGraph,
    config_generator: ConfigEmitter,
    schema_inferrer: SchemaInference,
}

impl PromptEngine {
    pub async fn analyze(&self, prompt: &str) -> InfrastructurePlan {
        // Stage 1: Extract intent and service requirements
        let intent = self.parser.extract_services(prompt).await;

        // Stage 2: Detect frameworks, runtimes, and versions
        let stack = self.stack_detector.resolve(&intent);

        // Stage 3: Build dependency graph between services
        let graph = self.dependency_resolver.build(&stack);

        // Stage 4: Select optimal providers per service
        let providers = self.select_providers(&graph).await;

        // Stage 5: Generate configuration for each provider
        let configs = self.config_generator.emit(&graph, &providers);

        // Stage 6: Infer database schemas from context
        let schemas = self.schema_inferrer.from_intent(&intent);

        InfrastructurePlan {
            services: graph,
            providers,
            configs,
            schemas,
            estimated_cost: self.estimate_monthly_cost(&providers),
            estimated_deploy_time: self.estimate_deploy_time(&graph),
        }
    }

    async fn select_providers(&self, graph: &ServiceGraph) -> ProviderMap {
        let mut selections = ProviderMap::new();

        for service in graph.services() {
            let candidates = self.provider_registry.candidates_for(service);
            let scored = candidates.iter().map(|p| ScoredProvider {
                provider: p,
                latency: self.benchmark_cache.get(p, service.region()),
                cost: p.estimate_cost(service.resources()),
                reliability: self.uptime_tracker.score(p),
            });

            selections.insert(service.id(), scored.max_by_score());
        }

        selections
    }
}
```

The engine doesn't guess. It maintains a benchmark cache of cold start times, latency measurements, and cost tables across every supported provider. When it selects Neon over Supabase for your Postgres instance, it's because Neon had 40ms lower connection latency in your target region at the time of deployment.

---

## Preview Engine

The preview engine handles the full lifecycle of ephemeral environments:

```typescript
interface PreviewEnvironment {
  id: string;
  pr: PullRequest;
  services: Map<string, DeployedService>;
  subdomain: string;
  ssl: Certificate;
  status: 'provisioning' | 'ready' | 'failed' | 'tearing_down';
  created_at: Date;
  ttl: Duration;
}

class PreviewEngine {
  async onPullRequest(event: PREvent): Promise<PreviewEnvironment> {
    const config = await this.parseConfig(event.repo, 'preview-ops.yml');

    // Snapshot production database schema
    const dbSnapshot = await this.snapshotSchema(config.services.database);

    // Provision all services in parallel
    const services = await Promise.all(
      config.services.map(async (svc) => {
        const instance = await this.provisioner.create(svc, {
          region: config.region ?? this.selectOptimalRegion(event),
          ttl: config.ttl ?? '72h',
          isolation: 'full',  // dedicated network, no shared resources
        });

        return instance;
      })
    );

    // Wire service URLs into environment variables
    const env = this.resolveServiceGraph(services, config);
    await this.injectEnvironment(services, env);

    // Seed database with test fixtures
    if (config.services.database?.seed) {
      await this.seeder.run(
        services.get('database'),
        dbSnapshot,
        config.services.database.seed,
      );
    }

    // Provision SSL and subdomain
    const subdomain = this.renderSubdomain(config.subdomain, event.pr);
    const ssl = await this.sslProvider.issue(subdomain);
    await this.router.register(subdomain, services.get('frontend'));

    // Post PR comment with preview details
    await this.github.comment(event.pr, this.renderPreviewComment({
      url: `https://${subdomain}`,
      services: services.map(s => s.healthEndpoint()),
      logs: `https://app.previewops.dev/logs/${event.pr.id}`,
      teardown: `https://app.previewops.dev/teardown/${event.pr.id}`,
    }));

    return { id: uuid(), pr: event.pr, services, subdomain, ssl, 
             status: 'ready', created_at: new Date(), ttl: config.ttl };
  }

  async onMerge(event: MergeEvent): Promise<void> {
    const preview = await this.store.findByPR(event.pr);
    if (!preview) return;

    await this.teardown(preview, { reason: 'pr_merged' });
  }

  private async teardown(env: PreviewEnvironment, opts: TeardownOpts) {
    await Promise.all([
      ...env.services.values().map(s => this.provisioner.destroy(s)),
      this.router.deregister(env.subdomain),
      this.sslProvider.revoke(env.ssl),
    ]);

    await this.github.comment(env.pr, 
      `Preview environment torn down. Reason: ${opts.reason}`);
  }
}
```

---

## Provider Abstraction

Preview Ops is provider-agnostic. The provisioner layer abstracts over cloud providers through a unified interface:

```go
type Provider interface {
    Provision(ctx context.Context, spec ServiceSpec) (*Instance, error)
    Destroy(ctx context.Context, id string) error
    HealthCheck(ctx context.Context, id string) (*Health, error)
    Logs(ctx context.Context, id string, since time.Time) (io.Reader, error)
    EstimateCost(spec ServiceSpec) CostEstimate
}

type ServiceSpec struct {
    Type        ServiceType   // compute, database, cache, queue, cron, storage
    Runtime     string        // node, python, go, rust, ruby, java, dotnet
    Version     string        // "20", "3.12", "1.82", etc.
    Region      string        // auto-selected or user-specified
    Resources   Resources     // CPU, memory, storage
    Environment map[string]string
    Scaling     ScalingPolicy // min/max instances, triggers
}

// Supported providers
var Registry = []Provider{
    neon.New(),          // Postgres (serverless, branching)
    upstash.New(),       // Redis, Kafka (serverless)
    cloudflare.New(),    // Edge compute, R2 storage, D1
    fly.New(),           // Long-running VMs, global distribution
    vercel.New(),        // SSR frameworks, edge functions
    railway.New(),       // Containers, background workers
    supabase.New(),      // Postgres + Auth + Storage (alternative)
    planetscale.New(),   // MySQL (branching, zero-downtime migrations)
    aws.New(),           // EC2, RDS, ElastiCache, SQS (fallback)
    gcp.New(),           // Cloud Run, Cloud SQL (fallback)
}
```

When you say "I need a database," the engine evaluates every provider that offers databases, scores them on latency, cost, feature set, and regional availability, and picks the best one. You don't see the provider. You see a connection string.

---

## Intelligence Layer

The intelligence layer runs continuously across all managed infrastructure:

```rust
pub struct IntelligenceLayer {
    cost_optimizer: CostOptimizer,
    region_selector: RegionSelector,
    failure_predictor: FailurePredictor,
    auto_recovery: RecoveryEngine,
    anomaly_detector: AnomalyDetector,
}

impl IntelligenceLayer {
    /// Predicts failures before they happen using historical patterns
    pub async fn predict_failures(&self, env: &Environment) -> Vec<Prediction> {
        let metrics = self.metrics_store.recent(env.id(), Duration::hours(6));

        let signals = vec![
            self.failure_predictor.memory_pressure(&metrics),
            self.failure_predictor.connection_saturation(&metrics),
            self.failure_predictor.error_rate_trend(&metrics),
            self.failure_predictor.latency_degradation(&metrics),
            self.failure_predictor.disk_trajectory(&metrics),
        ];

        signals.into_iter()
            .filter(|s| s.confidence > 0.85)
            .map(|s| Prediction {
                service: s.service_id,
                failure_type: s.category,
                estimated_time: s.projected_failure_time,
                recommended_action: self.auto_recovery.plan(&s),
                confidence: s.confidence,
            })
            .collect()
    }

    /// Auto-recovers from failures without human intervention
    pub async fn recover(&self, incident: &Incident) -> RecoveryResult {
        match incident.category {
            FailureType::OOM => {
                self.provisioner.scale_memory(incident.service_id, 1.5).await
            }
            FailureType::ConnectionExhaustion => {
                self.provisioner.increase_pool(incident.service_id, 2.0).await
            }
            FailureType::DiskFull => {
                self.provisioner.expand_storage(incident.service_id, 2.0).await
            }
            FailureType::CrashLoop => {
                self.provisioner.rollback(incident.service_id).await
            }
            _ => RecoveryResult::EscalateToHuman(incident.clone()),
        }
    }
}
```

---

## CLI

```bash
# Install
curl -fsSL https://previewops.dev/install | sh

# Deploy from a prompt
preview-ops deploy "Express API with MongoDB and a WebSocket server"

# Deploy from a repo
preview-ops deploy github.com/your-org/your-app

# Deploy from current directory
preview-ops deploy .

# List active environments
preview-ops ls

# View logs
preview-ops logs my-app --service api --tail

# Tear down
preview-ops destroy my-app

# Cost estimate without deploying
preview-ops estimate "Next.js with Postgres and S3 storage"

# Preview environment status
preview-ops preview status pr-142
```

---

## Supported Stacks

Preview Ops auto-detects and provisions any combination of the following:

| Category | Technologies |
|----------|-------------|
| Frameworks | Next.js, Nuxt, SvelteKit, Remix, Astro, Express, FastAPI, Django, Rails, Spring Boot, Gin, Actix |
| Databases | PostgreSQL, MySQL, MongoDB, SQLite, CockroachDB, PlanetScale, DynamoDB |
| Cache | Redis, Memcached, Upstash, Momento |
| Queues | RabbitMQ, Kafka, SQS, BullMQ, Upstash Kafka |
| Storage | S3, R2, GCS, Minio |
| Auth | Clerk, Auth0, Supabase Auth, NextAuth, Lucia |
| Payments | Stripe, Paddle, LemonSqueezy |
| Search | Elasticsearch, Meilisearch, Algolia, Typesense |
| Monitoring | Prometheus, Grafana, Datadog, Sentry |
| Cron | Built-in scheduler, any interval from 1m to 30d |

The stack detector reads your codebase, identifies frameworks by their file signatures (e.g., `next.config.ts` = Next.js, `manage.py` = Django), resolves dependency versions from lock files, and generates provider-specific configuration automatically.

---

## Security

Every environment provisioned by Preview Ops runs in complete isolation:

- **Network isolation** -- each preview gets its own VPC. Services within a preview can reach each other. Nothing else can reach in.
- **Database isolation** -- preview databases are provisioned from schema snapshots, never connected to production data. Seeding uses fixture files, never production records.
- **Secret management** -- secrets are stored in a per-environment vault. Secrets from one preview cannot be accessed by another. Secrets are purged on teardown.
- **Audit log** -- every provisioning action, configuration change, and teardown is logged with timestamp, actor, and reason.
- **SOC 2 Type II** -- Preview Ops infrastructure is audited annually. Compliance reports available on request.

---

## Pricing

| Tier | Environments | Prompt Deploys | Price |
|------|-------------|----------------|-------|
| Developer | 3 concurrent | 50/month | Free |
| Team | 20 concurrent | Unlimited | $49/seat/month |
| Enterprise | Unlimited | Unlimited | Custom |

Preview environments are billed per-minute of active runtime. Typical full-stack preview: $0.12/hour. Average PR lifecycle cost: $0.40.

---

## Performance

Benchmarked against manual provisioning and competing platforms:

| Operation | Preview Ops | Manual Setup | Improvement |
|-----------|------------|--------------|-------------|
| Full-stack deploy from prompt | 11.4s | 2-4 hours | 630x faster |
| Preview environment spin-up | 8.2s | 15-45 min | 110x faster |
| Database clone + seed | 3.1s | 5-10 min | 100x faster |
| SSL provisioning | 1.1s | 2-24 hours | 6500x faster |
| Full teardown | 2.3s | 10-30 min | 260x faster |

---

## About

Preview Ops is built by [neilhtennek](https://github.com/neilhtennek).

The thesis is simple: infrastructure configuration is a solved problem being artificially kept complex by platform fragmentation. An AI agent that understands the entire provider landscape can make better infrastructure decisions than a human configuring a single platform -- and it can do it in seconds.

Infrastructure literacy should not be a prerequisite for shipping software.

---

<p align="center">
  <img src="https://img.shields.io/badge/Preview%20Ops-Verified-4CAF50?style=for-the-badge&logo=checkmarx&logoColor=white" alt="Preview Ops Verified" />
</p>

<p align="center">
  <sub>Preview Ops. Infrastructure from a sentence. Preview environments for every PR. The future of deployment is one prompt away.</sub>
</p>
