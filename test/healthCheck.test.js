import expect from "expect.js";
import HealthCheck from "../src/healthCheck.js";
import { healthStatusValues, healthStatusCodes, timeFormats } from "../src/healthEnums.js";

describe("HealthCheck constructor", () => {
    it("should create an instance with default values when no arguments are provided", () => {
        const defaultHealthCheck = new HealthCheck();

        expect(defaultHealthCheck.description).to.be(undefined);
        expect(defaultHealthCheck.timeFormat).to.be(timeFormats.iso);
        expect(defaultHealthCheck.callback).to.be.a("function");
        expect(defaultHealthCheck.callback().status).to.be(healthStatusValues.healthy);
    });

    it("should fail if a non-string description if is provided", () => {
        expect(() => {
            new HealthCheck({
                description: 123,
            });
        }).to.throwError();
    });

    it("should create an instance with different description if it is provided", () => {
        const descriptionHealthCheck = new HealthCheck({
            description: "Test Health Check",
        });

        expect(descriptionHealthCheck.description).to.be("Test Health Check");
        expect(descriptionHealthCheck.timeFormat).to.be(timeFormats.iso);
        expect(descriptionHealthCheck.callback).to.be.a("function");
        expect(descriptionHealthCheck.callback().status).to.be(healthStatusValues.healthy);
    });

    it("should fail if a non expected timeFormat is provided", () => {
        expect(() => {
            new HealthCheck({
                timeFormat: "invalid_format",
            });
        }).to.throwError();
    });

    it("should create an instance with different timeFormat if it is provided", () => {
        const calendarHealthCheck = new HealthCheck({
            timeFormat: timeFormats.calendar,
        });

        expect(calendarHealthCheck.description).to.be(undefined);
        expect(calendarHealthCheck.timeFormat).to.be(timeFormats.calendar);
        expect(calendarHealthCheck.callback).to.be.a("function");
        expect(calendarHealthCheck.callback().status).to.be(healthStatusValues.healthy);
    });

    it("should fail if a non function callback is provided", () => {
        expect(() => {
            new HealthCheck({
                callback: "non_function",
            });
        }).to.throwError();
    });

    it("should create an instance with different callback if it is provided", () => {
        const unknownHealthCheck = new HealthCheck({
            callback: () => ({ 
                status: healthStatusValues.unknown,
            }),
        });

        expect(unknownHealthCheck.description).to.be(undefined);
        expect(unknownHealthCheck.timeFormat).to.be(timeFormats.iso);
        expect(unknownHealthCheck.callback).to.be.a("function");
        expect(unknownHealthCheck.callback().status).to.be(healthStatusValues.unknown);
    });

    it("should create an instance with different async callback if it is provided", async () => {
        const asyncHealthCheck = new HealthCheck({
            callback: async () => {
                return new Promise((resolve) => {
                    setTimeout(() => {
                        resolve({
                            status: healthStatusValues.unknown,
                        });
                    }, 100);
                });
            },
        });

        expect(asyncHealthCheck.description).to.be(undefined);
        expect(asyncHealthCheck.timeFormat).to.be(timeFormats.iso);
        expect(asyncHealthCheck.callback).to.be.a("function");
        expect((await asyncHealthCheck.callback()).status).to.be(healthStatusValues.unknown);
    });
});

describe("HealthCheck result", () => {
    it("should be a healthy instance when no arguments are provided and the callback is called", async () => {
        const defaultHealthCheck = new HealthCheck();
        await defaultHealthCheck.callCallbackFunction();

        expect(defaultHealthCheck.isHealthy()).to.be(true);
        expect(defaultHealthCheck.isUnhealthy()).to.be(false);
        expect(defaultHealthCheck.isUnknown()).to.be(false);
        expect(defaultHealthCheck.status).to.be(healthStatusValues.healthy);

        expect(defaultHealthCheck.statusCode).to.be(healthStatusCodes.healthy);
        expect(defaultHealthCheck.statusCode).to.be(200);
        expect(healthStatusCodes.healthy).to.be(200);
    });

    it("should fail if an unexpected status is provided", async () => {
        const errorHealthCheck = new HealthCheck({
            callback: () => ({ 
                status: "unexpected_status",
            }),
        });
        
        try {
            await errorHealthCheck.callCallbackFunction();
            expect(false).to.be(true);
        } catch (error) {
            expect(error).to.be.an("object");
        }
    });

    it("should be an unhealthy instance when an unhealthy callback is provided and the callback is called", async () => {
        const unhealthyHealthCheck = new HealthCheck({
            callback: () => ({
                status: healthStatusValues.unhealthy,
            }),
        });

        await unhealthyHealthCheck.callCallbackFunction();

        expect(unhealthyHealthCheck.isHealthy()).to.be(false);
        expect(unhealthyHealthCheck.isUnhealthy()).to.be(true);
        expect(unhealthyHealthCheck.isUnknown()).to.be(false);
        expect(unhealthyHealthCheck.status).to.be(healthStatusValues.unhealthy);

        expect(unhealthyHealthCheck.statusCode).to.be(healthStatusCodes.unhealthy);
        expect(unhealthyHealthCheck.statusCode).to.be(503);
        expect(healthStatusCodes.unhealthy).to.be(503);
    });

    it("should be an unknown instance when an unknown callback is provided and the callback is called", async () => {
        const unknownHealthCheck = new HealthCheck({
            callback: () => ({
                status: healthStatusValues.unknown,
            }),
        });

        await unknownHealthCheck.callCallbackFunction();

        expect(unknownHealthCheck.isHealthy()).to.be(false);
        expect(unknownHealthCheck.isUnhealthy()).to.be(false);
        expect(unknownHealthCheck.isUnknown()).to.be(true);
        expect(unknownHealthCheck.status).to.be(healthStatusValues.unknown);

        expect(unknownHealthCheck.statusCode).to.be(healthStatusCodes.unknown);
        expect(unknownHealthCheck.statusCode).to.be(500);
        expect(healthStatusCodes.unknown).to.be(500);
    });
});

describe("HealthCheck mapping to response objects", () => {
    it("should create an object with default values when no arguments are provided", async () => {
        const defaultHealthCheck = new HealthCheck();
        const responseObject = await defaultHealthCheck.mapToObject();

        expect(responseObject).to.only.have.keys([
            "description",
            "status",
            "statusCode",
            "timestamp",
            "processTime",
            "uptime",
        ]);

        expect(responseObject.description).to.be(undefined);
        expect(responseObject.status).to.be(healthStatusValues.healthy);
        expect(responseObject.statusCode).to.be(healthStatusCodes.healthy);
        expect(responseObject.timestamp).to.be.a("string");
        expect(responseObject.processTime).to.be.a("number");
        expect(responseObject.processTime).to.be.within(0, 1);
        expect(responseObject.uptime).to.be.a("number");
    });

    it("should create an object with unhealthy values when arguments are provided", async () => {
        const unhealthyHealthCheck = new HealthCheck({
            description: "Test Unhealthy Check",
            callback: () => ({
                status: healthStatusValues.unhealthy,
            }),
        });

        const responseObject = await unhealthyHealthCheck.mapToObject();

        expect(responseObject).to.only.have.keys([
            "description",
            "status",
            "statusCode",
            "timestamp",
            "processTime",
            "uptime",
        ]);

        expect(responseObject.description).to.be("Test Unhealthy Check");
        expect(responseObject.status).to.be(healthStatusValues.unhealthy);
        expect(responseObject.statusCode).to.be(healthStatusCodes.unhealthy);
        expect(responseObject.timestamp).to.be.a("string");
        expect(responseObject.processTime).to.be.a("number");
        expect(responseObject.processTime).to.be.within(0, 1);
        expect(responseObject.uptime).to.be.a("number");
    });

    it("should create an object with unknown values when arguments are provided", async () => {
        const unknownHealthCheck = new HealthCheck({
            description: "Test Unknown Check",
            callback: () => ({
                status: healthStatusValues.unknown
            }),
        });

        const responseObject = await unknownHealthCheck.mapToObject();

        expect(responseObject).to.only.have.keys([
            "description",
            "status",
            "statusCode",
            "timestamp",
            "processTime",
            "uptime",
        ]);

        expect(responseObject.description).to.be("Test Unknown Check");
        expect(responseObject.status).to.be(healthStatusValues.unknown);
        expect(responseObject.statusCode).to.be(healthStatusCodes.unknown);
        expect(responseObject.timestamp).to.be.a("string");
        expect(responseObject.processTime).to.be.a("number");
        expect(responseObject.processTime).to.be.within(0, 1);
        expect(responseObject.uptime).to.be.a("number");
    });

    it("should create an object with a different time format when arguments are provided", async () => {
        const unixHealthCheck = new HealthCheck({
            timeFormat: timeFormats.unix,
        });

        const responseObject = await unixHealthCheck.mapToObject();

        expect(responseObject).to.only.have.keys([
            "description",
            "status",
            "statusCode",
            "timestamp",
            "processTime",
            "uptime",
        ]);

        expect(responseObject.description).to.be(undefined);
        expect(responseObject.status).to.be(healthStatusValues.healthy);
        expect(responseObject.statusCode).to.be(healthStatusCodes.healthy);
        expect(responseObject.timestamp).to.be.a("number");
        expect(responseObject.timestamp).to.be.within(0, Math.floor(Date.now() / 1_000));
        expect(responseObject.processTime).to.be.a("number");
        expect(responseObject.processTime).to.be.within(0, 1);
        expect(responseObject.uptime).to.be.a("number");
    });
});

describe("HealthCheck timestamp", () => {
    it("should return a time in ISO format if no arguments are provided", () => {
        const defaultHealthCheck = new HealthCheck();

        const date = new Date("2023-10-15T13:14:15Z");
        const timestamp = defaultHealthCheck.getTimestamp(date);

        expect(timestamp).to.be("2023-10-15T13:14:15.000Z");
    });

    it("should return a time in ISO format if provided", () => {
        const isoHealthCheck = new HealthCheck({
            timeFormats: timeFormats.iso,
        });

        const date = new Date("2023-10-15T13:14:15Z");
        const timestamp = isoHealthCheck.getTimestamp(date);

        expect(timestamp).to.be("2023-10-15T13:14:15.000Z");
    });

    it("should return a time in UTC format if provided", () => {
        const utcHealthCheck = new HealthCheck({
            timeFormat: timeFormats.utc,
        });

        const date = new Date("2023-10-15T13:14:15Z");
        const timestamp = utcHealthCheck.getTimestamp(date);

        expect(timestamp).to.be("Sun, 15 Oct 2023 13:14:15 GMT");
    });

    it("should return a time in Unix format if provided", () => {
        const unixHealthCheck = new HealthCheck({
            timeFormat: timeFormats.unix,
        });

        const date = new Date("2023-10-15T13:14:15Z");
        const timestamp = unixHealthCheck.getTimestamp(date);

        expect(timestamp).to.be(1697375655);
    });

    it("should return a time in Calendar format if provided", () => {
        const calendarHealthCheck = new HealthCheck({
            timeFormat: timeFormats.calendar,
        });

        const date = new Date("2023-10-15T13:14:15Z");
        const timestamp = calendarHealthCheck.getTimestamp(date);

        expect(timestamp).to.contain("15");
        expect(timestamp).to.contain("10");
        expect(timestamp).to.contain("2023");
        expect(timestamp).to.contain("14");
        expect(timestamp).to.contain("15");
    });
});
