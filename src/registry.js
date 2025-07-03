import { healthStatusValues, healthStatusCodes } from "./healthEnums.js";

class HealthCheckRegistry {
    constructor() {
        this.checks = new Map();
    }

    register(name, healthCheck) {
        if (this.checks.has(name)) {
            throw new Error(`Health check with name '${name}' is already registered.`);
        }

        this.checks.set(name, healthCheck);
    }

    getResults() {
        return Array
            .from(this.checks.entries())
            .map(async ([name, check]) => ({
                [name]: await check.mapToObject(),
            }));
    }

    async handler() {
        return async (_, res) => {
            const arrResults = await Promise.all(this.getResults());
            const results = Object.assign({}, ...arrResults);

            const healthChecks = Array.from(this.checks.values());

            // Determine overall status
            const areAllUnknown = healthChecks.length === 0 || healthChecks.every(r => r.isUnknown());
            const hasUnhealthy = healthChecks.some(r => r.isUnhealthy());

            let overallStatus = healthStatusValues.healthy;
            let overallStatusCode = healthStatusCodes.healthy

            if (areAllUnknown) {
                overallStatus = healthStatusValues.unknown;
                overallStatusCode = healthStatusCodes.unknown;
            } else if (hasUnhealthy) {
                overallStatus = healthStatusValues.unhealthy;
                overallStatusCode = healthStatusCodes.unhealthy;
            }

            return res
                .status(overallStatusCode)
                .json({
                    overallStatus: overallStatus,
                    uptime: process.uptime(),
                    results,
                });
        };
    }
}

export default HealthCheckRegistry;
