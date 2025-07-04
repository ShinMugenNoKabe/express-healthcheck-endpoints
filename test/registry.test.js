import expect from "expect.js";
import HealthCheckRegistry from "../src/registry.js";
import HealthCheck from "../src/healthCheck.js";
import { healthStatusValues, healthStatusCodes } from "../src/healthEnums.js";

describe("HealthCheckRegistry constructor", () => {
    it("should create two instances with an empty check list", () => {
        const registry1 = new HealthCheckRegistry();
        expect(Array.from(registry1.checks)).to.be.empty();

        const registry2 = new HealthCheckRegistry();
        expect(Array.from(registry2.checks)).to.be.empty();
    });
});

describe("HealthCheckRegistry register", () => {
    it("should create an instance with one check an another instance with an empty check list", () => {
        const registry1 = new HealthCheckRegistry();
        registry1.register("testCheck", new HealthCheckRegistry());
        expect(Array.from(registry1.checks.values())).not.to.be.empty();

        const registry2 = new HealthCheckRegistry();
        expect(Array.from(registry2.checks.values())).to.be.empty();
    });

    it("should create two instances with diferents amounts of checks", () => {
        const registry1 = new HealthCheckRegistry();
        registry1.register("testCheck1", new HealthCheckRegistry());
        registry1.register("testCheck2", new HealthCheckRegistry());
        registry1.register("testCheck3", new HealthCheckRegistry());
        expect(Array.from(registry1.checks.values())).have.length(3);

        const registry2 = new HealthCheckRegistry();
        registry2.register("testCheck1", new HealthCheckRegistry());
        registry2.register("testCheck2", new HealthCheckRegistry());
        registry2.register("testCheck3", new HealthCheckRegistry());
        registry2.register("testCheck4", new HealthCheckRegistry());
        registry2.register("testCheck5", new HealthCheckRegistry());
        registry2.register("testCheck6", new HealthCheckRegistry());
        expect(Array.from(registry2.checks.values())).to.have.length(6);
    });

    it("should fail if there is a duplicate health check name", () => {
        const registry1 = new HealthCheckRegistry();
        registry1.register("testCheck", new HealthCheckRegistry());
        expect(() => registry1.register("testCheck", new HealthCheckRegistry())).to.throwError();

        const registry2 = new HealthCheckRegistry();
        expect(() => registry2.register("testCheck", new HealthCheckRegistry())).not.to.throwError();
    });
});

describe("HealthCheckRegistry getResults", () => {
    it("should return a healthy result if all checks are healthy", async () => {
        const healthyRegistry = new HealthCheckRegistry();

        const healthyCheck1 = new HealthCheck();
        await healthyCheck1.callCallbackFunction();
        healthyRegistry.register("healthyCheck1", healthyCheck1);

        const healthyCheck2 = new HealthCheck({
            callback: () => ({
                status: healthStatusValues.healthy,
            }),
        });
        await healthyCheck2.callCallbackFunction();
        healthyRegistry.register("healthyCheck2", healthyCheck2);

        const healthChecks = Array.from(healthyRegistry.checks.values());
        const { overallStatus, overallStatusCode } = healthyRegistry.getOverallStatusResponse(healthChecks);

        expect(overallStatus).to.be(healthStatusValues.healthy);
        expect(overallStatusCode).to.be(healthStatusCodes.healthy);
    });

    it("should return an unhealthy result if some checks are unhealthy", async () => {
        const unhealthyRegistry = new HealthCheckRegistry();

        const unhealthyCheck1 = new HealthCheck();
        await unhealthyCheck1.callCallbackFunction();
        unhealthyRegistry.register("unhealthyCheck1", unhealthyCheck1);

        const unhealthyCheck2 = new HealthCheck({
            callback: () => ({ 
                status: healthStatusValues.unhealthy,
            }),
        });
        await unhealthyCheck2.callCallbackFunction();
        unhealthyRegistry.register("unhealthyCheck2", unhealthyCheck2);

        const unhealthyCheck3 = new HealthCheck({
            callback: () => ({
                status: healthStatusValues.healthy,
            }),
        });
        await unhealthyCheck3.callCallbackFunction();
        unhealthyRegistry.register("unhealthyCheck3", unhealthyCheck3);

        const unhealthyCheck4 = new HealthCheck({
            callback: () => ({
                status: healthStatusValues.unknown,
            }),
        });
        await unhealthyCheck4.callCallbackFunction();
        unhealthyRegistry.register("unhealthyCheck4", unhealthyCheck4);

        const healthChecks = Array.from(unhealthyRegistry.checks.values());
        const { overallStatus, overallStatusCode } = unhealthyRegistry.getOverallStatusResponse(healthChecks);

        expect(overallStatus).to.be(healthStatusValues.unhealthy);
        expect(overallStatusCode).to.be(healthStatusCodes.unhealthy);
    });

    it("should return an unhealthy result if all checks are unknown", async () => {
        const unknownRegistry = new HealthCheckRegistry();

        const unknownCheck1 = new HealthCheck({
            callback: () => ({ 
                status: healthStatusValues.unknown,
            }),
        });
        await unknownCheck1.callCallbackFunction();
        unknownRegistry.register("unknownCheck1", unknownCheck1);

        const unknownCheck2 = new HealthCheck({
            callback: () => ({ 
                status: healthStatusValues.unknown,
            }),
        });
        await unknownCheck2.callCallbackFunction();
        unknownRegistry.register("unknownCheck2", unknownCheck2);

        const healthChecks = Array.from(unknownRegistry.checks.values());
        const { overallStatus, overallStatusCode } = unknownRegistry.getOverallStatusResponse(healthChecks);

        expect(overallStatus).to.be(healthStatusValues.unknown);
        expect(overallStatusCode).to.be(healthStatusCodes.unknown);
    });

    it("should different registries have different results", async () => {
        const unhealthyRegistry = new HealthCheckRegistry();

        const unhealthyCheck1 = new HealthCheck();
        await unhealthyCheck1.callCallbackFunction();
        unhealthyRegistry.register("unhealthyCheck1", unhealthyCheck1);

        const unhealthyCheck2 = new HealthCheck({
            callback: () => ({ 
                status: healthStatusValues.unhealthy,
            }),
        });
        await unhealthyCheck2.callCallbackFunction();
        unhealthyRegistry.register("unhealthyCheck2", unhealthyCheck2);

        const unhealthyCheck3 = new HealthCheck({
            callback: () => ({
                status: healthStatusValues.healthy,
            }),
        });
        await unhealthyCheck3.callCallbackFunction();
        unhealthyRegistry.register("unhealthyCheck3", unhealthyCheck3);

        const unhealthyCheck4 = new HealthCheck({
            callback: () => ({
                status: healthStatusValues.unknown,
            }),
        });
        await unhealthyCheck4.callCallbackFunction();
        unhealthyRegistry.register("unhealthyCheck4", unhealthyCheck4);

        const unhealthyHealthChecks = Array.from(unhealthyRegistry.checks.values());
        const unhealthyHealthResults = unhealthyRegistry.getOverallStatusResponse(unhealthyHealthChecks);

        expect(unhealthyHealthResults.overallStatus).to.be(healthStatusValues.unhealthy);
        expect(unhealthyHealthResults.overallStatusCode).to.be(healthStatusCodes.unhealthy);

        const unknownRegistry = new HealthCheckRegistry();

        const unknownCheck1 = new HealthCheck({
            callback: () => ({ 
                status: healthStatusValues.unknown,
            }),
        });
        await unknownCheck1.callCallbackFunction();
        unknownRegistry.register("unknownCheck1", unknownCheck1);

        const unknownCheck2 = new HealthCheck({
            callback: () => ({ 
                status: healthStatusValues.unknown,
            }),
        });
        await unknownCheck2.callCallbackFunction();
        unknownRegistry.register("unknownCheck2", unknownCheck2);

        const unknownHealthChecks = Array.from(unknownRegistry.checks.values());
        const unknownHealthResults = unknownRegistry.getOverallStatusResponse(unknownHealthChecks);

        expect(unknownHealthResults.overallStatus).to.be(healthStatusValues.unknown);
        expect(unknownHealthResults.overallStatusCode).to.be(healthStatusCodes.unknown);
    });
});
