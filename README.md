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

### Request

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

### Response

```json
{
    "status": "healthy",
    "statusCode": 200,
    "timestamp": "2025-07-03T22:22:17.384Z",
    "processTime": 0,
    "uptime": 733.1416337
}
```

## Custom Health Check

You can provide your own health check logic. See the below table for more information.

### Request

```js
import express from "express";
import HealthCheck from "express-healthcheck-endpoints/healthCheck";

const app = express();

const fetchHealthCheck = new HealthCheck({
    description: "Fetches data from an external API and checks if it responds successfully",
    timeFormat: "unix",
    callback: async () => {
        const response = await fetch("https://pokeapi.co/api/v2/pokemon/meowth");

        if (!response.ok) {
            return {
                status: "unhealthy",
                statusCode: 503,
            };
        }

        return {
            status: "healthy",
            statusCode: 200,
        };
    }
});

app.get("/health/fetch", await fetchHealthCheck.handler());

const PORT = 3_000;

app.listen(PORT, () => {
    console.log(`Server listening on http://localhost:${PORT}`);
});
```

### Response
```json
{
    "description": "Fetches data from an external API",
    "status": "healthy",
    "statusCode": 200,
    "timestamp": "2025-07-03T22:26:16.465Z",
    "processTime": 0.054,
    "uptime": 972.2222452
}
```

## Health Check Groups

You can also group certain health check endpoints together in one single endpoint that will execute every health check set. Every health check must have its unique name.

### Request

```js
import express from "express";
import HealthCheck from "express-healthcheck-endpoints/healthCheck";
import HealthCheckRegistry from "express-healthcheck-endpoints/registry";

const app = express();
const registry = new HealthCheckRegistry();

const simpleHealthCheck = new HealthCheck();
registry.register("simple", simpleHealthCheck);

const simpleUnixHealthCheck = new HealthCheck({
    timeFormat: "unix",
    description: "This is a simple check with Unix time format",
});
registry.register("simpleUnix", simpleUnixHealthCheck);

const unhealthyHealthCheck = new HealthCheck({
    description: "This is an unhealthy check",
    callback: () => ({
        status: "unhealthy",
        statusCode: 503,
    }),
});
registry.register("unhealthy", unhealthyHealthCheck);

app.get("/health/all", await registry.handler());

const PORT = 3_000;

app.listen(PORT, () => {
    console.log(`Server listening on http://localhost:${PORT}`);
});
```

### Response

```json
{
    "overallStatus": "unhealthy",
    "uptime": 8.3872264,
    "results": {
        "simple": {
            "status": "healthy",
            "statusCode": 200,
            "timestamp": "2025-07-03T22:52:42.215Z",
            "processTime": 0.001,
            "uptime": 8.3870766
        },
        "simpleUnix": {
            "description": "This is a simple check with Unix time format",
            "status": "healthy",
            "statusCode": 200,
            "timestamp": 1751583162,
            "processTime": 0.002,
            "uptime": 8.3870959
        },
        "unhealthy": {
            "description": "This is an unhealthy check",
            "status": "unhealthy",
            "statusCode": 503,
            "timestamp": "2025-07-03T22:52:42.216Z",
            "processTime": 0.002,
            "uptime": 8.3871048
        }
    }
}
```

## Supported Values

There is a module that contains every supported value in the API. Example:

```js
import express from "express";
import HealthCheck from "express-healthcheck-endpoints/healthCheck";
import { healthStatusValues, healthStatusCodes, timeFormats } from "express-healthcheck-endpoints/healthEnums";

const app = express();

const simpleHealthCheck = new HealthCheck({
    timeFormat: timeFormats.utc,
    callback: () => ({
        status: healthStatusValues.healthy,
        statusCode: healthStatusCodes.healthy,
    }),
});

app.get("/health", await simpleHealthCheck.handler());

const PORT = 3_000;

app.listen(PORT, () => {
    console.log(`Server listening on http://localhost:${PORT}`);
});
```

## Configuration

| Option | Type | Remarks | Required | Default Value | Allowed Values |
| ------ | ---- | ------- | :------: | ------------- | -------------- |
| [`timeFormat`] | `string` | The time format used in the response for the `timestamp` field. | ❌ | [`"iso"`] | [`"iso"`], [`"unix"`], [`"utc"`], [`"calendar"`] |
| [`description`] | `string` | Description of the health check shown in the response. | ❌ | [`undefined`] | |
| [`callback`] | `function` | Callback function used by the health check function to check if it goes successfully or not. This callback may or may not be [`async`], takes no arguments and **must return an object containing the [`status`] and [`statusCode`] attributes**. | ❌ | [`() => ({ status: healthStatusValues.healthy, statusCode: healthStatusCodes.healthy, })`] | **[`status`]:** [`healthy`], [`unhealthy`], [`unknown`] <br/><br/>  **[`statusCode`]:** [`200`], [`503`], [`500`] |

## License

MIT
