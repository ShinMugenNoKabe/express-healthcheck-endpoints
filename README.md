# express-healthcheck-endpoints

A simple and customizable set of health check endpoints for Express.js applications.

## Features

- Lightweight and easy to use
- Customizable health check logic
- Supports async checks
- Returns standard HTTP status codes
- Full JSON support

## Installation

```bash
npm install express-healthcheck-endpoints
```

## Sample Usage

### Server

```js
import express from "express";
import HealthCheck from "express-healthcheck-endpoints/healthCheck";

const app = express();

app.get("/health", await new HealthCheck().handler());

const PORT = 3_000;

app.listen(PORT, () => {
    console.log(`Server listening on http://localhost:${PORT}`);
});
```

### Request

```curl
curl http://localhost:3000/health
```

### Response

```json
{
    "status": "healthy",
    "statusCode": 200,
    "timestamp": "2025-07-05T11:30:23.691Z",
    "processTime": 0,
    "uptime": 10.1798468
}
```

## Custom Health Check

You can provide your own health check logic. See the below table for more information.

### Server

```js
import express from "express";
import HealthCheck from "express-healthcheck-endpoints/healthCheck";
import { healthStatusValues, timeFormats } from "express-healthcheck-endpoints/healthEnums";

const app = express();

const fetchHealthCheck = new HealthCheck({
    description: "Fetches data from an external API and checks if it responds successfully",
    timeFormat: timeFormats.unix,
    callback: async () => {
        const response = await fetch("https://pokeapi.co/api/v2/pokemon/meowth");

        if (!response.ok) {
            return {
                status: healthStatusValues.unhealthy,
            };
        }

        return {
            status: healthStatusValues.healthy,
        };
    }
});

app.get("/health/fetch", await fetchHealthCheck.handler());

const PORT = 3_000;

app.listen(PORT, () => {
    console.log(`Server listening on http://localhost:${PORT}`);
});
```

### Request

```curl
curl http://localhost:3000/health/fetch
```

### Response

```json
{
    "description": "Fetches data from an external API and checks if it responds successfully",
    "status": "healthy",
    "statusCode": 200,
    "timestamp": 1751715071,
    "processTime": 0.129,
    "uptime": 5.8805614
}
```

## Health Check Groups

You can also group certain health check endpoints together in one single endpoint that will execute every health check set. Every health check must have its unique name.

### Server

```js
import express from "express";
import HealthCheck from "express-healthcheck-endpoints/healthCheck";
import HealthCheckRegistry from "express-healthcheck-endpoints/registry";
import { healthStatusValues, timeFormats } from "express-healthcheck-endpoints/healthEnums";

const app = express();
const registry = new HealthCheckRegistry();

const simpleHealthCheck = new HealthCheck();
registry.register("simple", simpleHealthCheck);

const simpleUnixHealthCheck = new HealthCheck({
    timeFormat: timeFormats.unix,
    description: "This is a simple check with Unix time format",
});
registry.register("simpleUnix", simpleUnixHealthCheck);

const unhealthyHealthCheck = new HealthCheck({
    description: "This is an unhealthy check",
    callback: () => ({
        status: healthStatusValues.unhealthy,
    }),
});
registry.register("unhealthy", unhealthyHealthCheck);

app.get("/health/all", await registry.handler());

const PORT = 3_000;

app.listen(PORT, () => {
    console.log(`Server listening on http://localhost:${PORT}`);
});
```

### Request

```curl
curl http://localhost:3000/health/all
```

### Response

```json
{
    "overallStatus": "unhealthy",
    "overallStatusCode": 503,
    "uptime": 5.3380016,
    "results": {
        "simple": {
            "status": "healthy",
            "statusCode": 200,
            "timestamp": "2025-07-05T11:32:15.678Z",
            "processTime": 0.001,
            "uptime": 5.3378379
        },
        "simpleUnix": {
            "description": "This is a simple check with Unix time format",
            "status": "healthy",
            "statusCode": 200,
            "timestamp": 1751715135,
            "processTime": 0.002,
            "uptime": 5.3378542
        },
        "unhealthy": {
            "description": "This is an unhealthy check",
            "status": "unhealthy",
            "statusCode": 503,
            "timestamp": "2025-07-05T11:32:15.679Z",
            "processTime": 0.002,
            "uptime": 5.3378611
        }
    }
}
```

## Synchronous Endpoints

In a context where the `await` keyword cannot be used, you can resolve every `handler` promise asynchronously and register the endpoint; for both single health checks and registries endpoints.

### Server

```js
import express from "express";
import HealthCheck from "express-healthcheck-endpoints/healthCheck";
import HealthCheckRegistry from "express-healthcheck-endpoints/registry";
import { healthStatusValues, timeFormats } from "express-healthcheck-endpoints/healthEnums";

const app = express();
const registry = new HealthCheckRegistry();

// Resolve promise asynchronously
const simpleHealthCheck1 = new HealthCheck();

simpleHealthCheck1.handler()
    .then(handler => {
        app.get("/health/simple1", handler);
    })
    .catch(err => {
        console.error("Error setting up health check handler:", err);
    });

registry.register("simple1", simpleHealthCheck1);

// Resolve promise synchronously
const simpleHealthCheck2 = new HealthCheck();
app.get("/health/simple2", await simpleHealthCheck2.handler());
registry.register("simple2", simpleHealthCheck2);

// Resolve promise asynchronously
registry.handler()
    .then(handler => {
        app.get("/health/all", handler);
    })
    .catch(err => {
        console.error("Error setting up health check handler:", err);
    });

const PORT = 3_000;

app.listen(PORT, () => {
    console.log(`Server listening on http://localhost:${PORT}`);
});

```
### Request

```curl
curl http://localhost:3000/health/all
```

### Response

```json
{
    "overallStatus": "healthy",
    "overallStatusCode": 200,
    "uptime": 3.2312097,
    "results": {
        "simple1": {
            "status": "healthy",
            "statusCode": 200,
            "timestamp": "2025-07-05T11:49:42.695Z",
            "processTime": 0.001,
            "uptime": 3.2310578
        },
        "simple2": {
            "status": "healthy",
            "statusCode": 200,
            "timestamp": "2025-07-05T11:49:42.696Z",
            "processTime": 0.002,
            "uptime": 3.2310708
        }
    }
}
```

## Configuration

| Option | Type | Remarks | Required | Default Value | Allowed Values |
| ------ | ---- | ------- | :------: | ------------- | -------------- |
| [`timeFormat`] | `string` | The time format used in the response for the `timestamp` field. | ❌ | [`"iso"`] | [`"iso"`], [`"unix"`], [`"utc"`], [`"calendar"`] |
| [`description`] | `string` | Description of the health check shown in the response. | ❌ | [`undefined`] | |
| [`callback`] | `function` | Callback function used by the health check function to check if it goes successfully or not. This callback may or may not be [`async`], takes no arguments and **must return an object containing a [`status`] attribute**. If not provided, it is assumed that the health check is healthy. | ❌ | [`() => ({ status: healthStatusValues.healthy, })`] | **[`status`]:** [`healthy`], [`unhealthy`], [`unknown`] |

### Statuses

|     Status    | Result Status Code |      Description      |
| :-----------: | :----------------: | :-------------------: |
| **Healthy**   |         200        | OK                    |
| **Unhealthy** |         503        | Service Unavailable   |
| **Unknown**   |         500        | Internal Server Error |

## License

MIT
