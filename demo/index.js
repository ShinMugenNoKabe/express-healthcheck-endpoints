import express from "express";
import HealthCheck from "express-healthcheck-endpoints/healthCheck";
import HealthCheckRegistry from "express-healthcheck-endpoints/registry";
import { healthStatusValues, healthStatusCodes, timeFormats } from "express-healthcheck-endpoints/healthEnums";

const app = express();
const registry = new HealthCheckRegistry();

const simpleHealthCheck = new HealthCheck();
registry.register("simple", simpleHealthCheck);

// Simp
const simpleUnixHealthCheck = new HealthCheck({
    timeFormat: timeFormats.unix,
    description: "This is a simple check with Unix time format",
});
registry.register("simpleUnix", simpleUnixHealthCheck);

const unhealthyHealthCheck = new HealthCheck({
    description: "This is an unhealthy check",
    callback: () => ({
        status: healthStatusValues.unhealthy,
        statusCode: healthStatusCodes.unhealthy,
    })
});
registry.register("unhealthy", unhealthyHealthCheck);

const unknownHealthCheck = new HealthCheck({
    description: "This is an unknown check",
    callback: () => ({
        status: healthStatusValues.unknown,
        statusCode: healthStatusCodes.unknown,
    })
});
registry.register("unknown", unknownHealthCheck);

const heavyHealthCheck = new HealthCheck({
    description: "Heavy task that takes 3 seconds to complete",
    callback: () => {
        return new Promise(resolve => {
            setTimeout(() => resolve({
                statusCode: healthStatusCodes.healthy,
                status: healthStatusValues.healthy,
            }), 3_000);
        });
    }
});
registry.register("heavy", heavyHealthCheck);

const fetchHealthCheck = new HealthCheck({
    description: "Fetches data from an external API",
    callback: async () => {
        const response = await fetch("https://pokeapi.co/api/v2/pokemon/meowth");

        if (!response.ok) {
            return {
                status: healthStatusValues.unhealthy,
                statusCode: healthStatusCodes.unhealthy,
            };
        }

        return {
            status: healthStatusValues.healthy,
            statusCode: healthStatusCodes.healthy,
        };
    }
});
registry.register("fetch", fetchHealthCheck);

app.get("/health/all", await registry.handler());
app.get("/health", await simpleHealthCheck.handler());
app.get("/health/unix", await simpleUnixHealthCheck.handler());
app.get("/health/unhealthy", await unhealthyHealthCheck.handler());
app.get("/health/unknown", await unknownHealthCheck.handler());
app.get("/health/heavy", await heavyHealthCheck.handler());
app.get("/health/fetch", await fetchHealthCheck.handler());

const PORT = process.env.PORT || 3_000;

app.listen(PORT, () => {
    console.log(`Server listening on http://localhost:${PORT}`);
});
