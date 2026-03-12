package main

import (
	"context"
	"flag"
	"fmt"
	"os"
	"time"

	"github.com/kerberos-io/agent/machinery/src/capture"
	"github.com/kerberos-io/agent/machinery/src/components"
	"github.com/kerberos-io/agent/machinery/src/log"
	"github.com/kerberos-io/agent/machinery/src/models"
	"github.com/kerberos-io/agent/machinery/src/onvif"
	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/attribute"
	"go.opentelemetry.io/otel/exporters/otlp/otlptrace"
	"go.opentelemetry.io/otel/exporters/otlp/otlptrace/otlptracehttp"
	"go.opentelemetry.io/otel/sdk/resource"
	"go.opentelemetry.io/otel/sdk/trace"
	semconv "go.opentelemetry.io/otel/semconv/v1.4.0"

	configService "github.com/kerberos-io/agent/machinery/src/config"
	"github.com/kerberos-io/agent/machinery/src/routers"
	"github.com/kerberos-io/agent/machinery/src/utils"
)

var VERSION = utils.VERSION

func startTracing(agentKey string, otelEndpoint string) (*trace.TracerProvider, error) {
	serviceName := "agent-" + agentKey
	headers := map[string]string{
		"content-type": "application/json",
	}

	exporter, err := otlptrace.New(
		context.Background(),
		otlptracehttp.NewClient(
			otlptracehttp.WithEndpoint(otelEndpoint),
			otlptracehttp.WithHeaders(headers),
			otlptracehttp.WithInsecure(),
		),
	)
	if err != nil {
		return nil, fmt.Errorf("creating new exporter: %w", err)
	}

	tracerprovider := trace.NewTracerProvider(
		trace.WithBatcher(
			exporter,
			trace.WithMaxExportBatchSize(trace.DefaultMaxExportBatchSize),
			trace.WithBatchTimeout(trace.DefaultScheduleDelay*time.Millisecond),
			trace.WithMaxExportBatchSize(trace.DefaultMaxExportBatchSize),
		),
		trace.WithResource(
			resource.NewWithAttributes(
				semconv.SchemaURL,
				semconv.ServiceNameKey.String(serviceName),
				attribute.String("environment", "develop"),
			),
		),
	)

	otel.SetTracerProvider(tracerprovider)

	return tracerprovider, nil
}

func main() {

	// Start the show ;)
	// We'll parse the flags (named variables), and start the agent.

	var action string
	var configDirectory string
	var name string
	var port string
	var timeout string

	flag.StringVar(&action, "action", "version", "Tell us what you want do 'run' or 'version'")
	flag.StringVar(&configDirectory, "config", ".", "Where is the configuration stored")
	flag.StringVar(&name, "name", "agent", "Provide a name for the agent")
	flag.StringVar(&port, "port", "80", "On which port should the agent run")
	flag.StringVar(&timeout, "timeout", "2000", "Number of milliseconds to wait for the ONVIF discovery to complete")
	flag.Parse()

	// Specify the level of loggin: "info", "warning", "debug", "error" or "fatal."
	logLevel := os.Getenv("LOG_LEVEL")
	if logLevel == "" {
		logLevel = "info"
	}
	// Specify the output formatter of the log: "text" or "json".
	logOutput := os.Getenv("LOG_OUTPUT")
	if logOutput == "" {
		logOutput = "text"
	}
	// Specify the timezone of the log: "UTC" or "Local".
	timezone, _ := time.LoadLocation("CET")
	log.Log.Init(logLevel, logOutput, configDirectory, timezone)

	switch action {

	case "version":
		{
			log.Log.Info("main.Main(): You are currrently running Kerberos Agent " + VERSION)
		}
	case "discover":
		{
			// Convert duration to int
			timeout, err := time.ParseDuration(timeout + "ms")
			if err != nil {
				log.Log.Fatal("main.Main(): could not parse timeout: " + err.Error())
				return
			}
			onvif.Discover(timeout)
		}
	case "decrypt":
		{
			log.Log.Info("main.Main(): Decrypting: " + flag.Arg(0) + " with key: " + flag.Arg(1))
			symmetricKey := []byte(flag.Arg(1))

			if len(symmetricKey) == 0 {
				log.Log.Fatal("main.Main(): symmetric key should not be empty")
				return
			}
			if len(symmetricKey) != 32 {
				log.Log.Fatal("main.Main(): symmetric key should be 32 bytes")
				return
			}

			utils.Decrypt(flag.Arg(0), symmetricKey)
		}

	case "run":
		{
			// Print Agent ASCII art
			utils.PrintASCIIArt()

			// Print the environment variables which include "AGENT_" as prefix.
			utils.PrintEnvironmentVariables()

			// Read the config on start, and pass it to the other
			// function and features. Please note that this might be changed
			// when saving or updating the configuration through the REST api or MQTT handler.
			var configuration models.Configuration
			configuration.Name = name
			configuration.Port = port

			// Open this configuration either from Agent or Factory.
			configService.OpenConfig(configDirectory, &configuration)

			// We will override the configuration with the environment variables
			configService.OverrideWithEnvironmentVariables(&configuration)

			// Start OpenTelemetry tracing
			if otelEndpoint := os.Getenv("OTEL_EXPORTER_OTLP_ENDPOINT"); otelEndpoint == "" {
				log.Log.Info("main.Main(): No OpenTelemetry endpoint provided, skipping tracing")
			} else {
				log.Log.Info("main.Main(): Starting OpenTelemetry tracing with endpoint: " + otelEndpoint)
				agentKey := configuration.Config.Key
				traceProvider, err := startTracing(agentKey, otelEndpoint)
				if err != nil {
					log.Log.Error("traceprovider: " + err.Error())
				}
				defer func() {
					if err := traceProvider.Shutdown(context.Background()); err != nil {
						log.Log.Error("traceprovider: " + err.Error())
					}
				}()
			}

			// Printing final configuration
			utils.PrintConfiguration(&configuration)

			// Check the folder permissions, it might be that we do not have permissions to write
			// recordings, update the configuration or save snapshots.
			utils.CheckDataDirectoryPermissions(configDirectory)

			// Set timezone
			timezone, _ := time.LoadLocation(configuration.Config.Timezone)
			log.Log.Init(logLevel, logOutput, configDirectory, timezone)

			// Check if we have a device Key or not, if not
			// we will generate one.
			if configuration.Config.Key == "" {
				key := utils.RandStringBytesMaskImpr(30)
				configuration.Config.Key = key
				err := configService.StoreConfig(configDirectory, configuration.Config)
				if err == nil {
					log.Log.Info("main.Main(): updated unique key for agent to: " + key)
				} else {
					log.Log.Info("main.Main(): something went wrong while trying to store key: " + key)
				}
			}

			// Create a cancelable context, which will be used to cancel and restart.
			// This is used to restart the agent when the configuration is updated.
			ctx, cancel := context.WithCancel(context.Background())

			// We create a capture object, this will contain all the streaming clients.
			// And allow us to extract media from within difference places in the agent.
			capture := capture.Capture{
				RTSPClient:    nil,
				RTSPSubClient: nil,
			}

			// Bootstrapping the agent
			communication := models.Communication{
				Context:         &ctx,
				CancelContext:   &cancel,
				HandleBootstrap: make(chan string, 1),
			}

			go components.Bootstrap(ctx, configDirectory, &configuration, &communication, &capture)

			// Start the REST API.
			routers.StartWebserver(configDirectory, &configuration, &communication, &capture)
		}
	default:
		{
			log.Log.Error("main.Main(): Sorry I don't understand :(")
		}
	}
}
// 2025-10-16T13:26:00 feat: notification routing
// 2025-12-20T17:29:00 chore: update config
// 2025-09-27T20:26:00 feat: draft engine
// 2025-12-24T16:13:00 feat: draft engine
// 2025-10-27T16:15:00 feat: calendar sync
// 2026-01-24T13:30:00 fix: escalation rules
// 2025-11-07T19:26:00 fix: escalation rules
// 2025-11-11T19:34:00 feat: batch processor
// 2026-01-23T11:52:00 feat: draft engine
// 2025-10-03T14:18:00 chore: bump deps
// 2025-09-15T18:27:00 feat: draft engine
// 2026-01-29T12:58:00 fix: memory optimization
// 2025-11-08T15:49:00 feat: inbox agent pipeline
// final update
// 2025-08-25T10:35:00 fix: cors handler
// 2025-08-02T11:10:00 fix: websocket reconnect
// 2025-10-25T16:47:00 feat: session cache
// 2025-12-05T14:21:00 refactor: router config
// 2025-09-21T14:16:00 fix: websocket reconnect
// 2026-01-15T17:54:00 fix: websocket reconnect
// machinery fix
// 2025-10-31T17:31:00 fix: embedding normalization
// 2026-02-03T11:11:00 chore: model config
// 2026-03-14T15:15:00 refactor: narrative encoder
// 2026-03-15T13:27:00 fix: cross-album linking
// 2025-11-28T17:17:00 chore: model config
// 2026-03-15T16:03:00 chore: model config
// 2026-02-19T15:20:00 feat: curiosity scoring
// 2026-01-31T17:05:00 feat: corpus ingestion pipeline
// 2026-02-13T13:04:00 chore: model config
// 2025-10-25T15:38:00 feat: corpus ingestion pipeline
// 2026-02-09T19:42:00 fix: panel segmentation
// 2025-11-26T13:49:00 refactor: narrative encoder
// 2025-12-09T15:18:00 refactor: narrative encoder
// 2026-01-15T17:17:00 feat: curiosity scoring
// 2025-10-25T18:35:00 feat: curiosity scoring
// 2025-12-25T11:22:00 refactor: character tracker
// 2026-01-16T15:24:00 feat: tension model
// 2026-02-25T16:56:00 feat: curiosity scoring
// 2026-01-16T19:56:00 chore: model config
// 2025-12-07T10:48:00 chore: model config
// 2026-01-10T12:19:00 chore: model config
// 2025-10-25T19:45:00 feat: dialogue extraction
// 2025-12-08T15:06:00 fix: panel segmentation
// 2026-01-06T18:15:00 fix: embedding normalization
// 2026-03-05T18:10:00 feat: tension model
// 2026-01-16T09:44:00 feat: curiosity scoring
// 2026-01-15T09:24:00 chore: model config
// 2026-01-31T10:29:00 refactor: character tracker
// 2025-12-30T15:53:00 refactor: character tracker
// 2026-01-28T19:19:00 chore: model config
// 2026-01-28T11:03:00 fix: timeline alignment
// 2025-11-21T11:45:00 feat: dialogue extraction
// 2026-02-05T12:43:00 fix: OCR accuracy
// 2026-01-06T09:43:00 refactor: narrative encoder
// 2026-02-12T19:04:00 fix: embedding normalization
// 2025-12-27T10:32:00 refactor: narrative encoder
// 2025-08-28T10:08:00 refactor: character tracker
// 2026-03-12T13:43:00 feat: curiosity scoring
