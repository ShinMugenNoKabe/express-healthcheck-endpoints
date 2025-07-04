import { healthStatusValues, healthStatusCodes, timeFormats } from "./healthEnums.js";

class HealthCheck {
    constructor({ description, timeFormat, callback } = {}) {
        if (description && typeof description !== "string") {
            throw new Error("Invalid description provided. Must be a string.");
        }

        if (callback === null || callback === undefined) {
            callback = () => ({
                status: healthStatusValues.healthy,
            });
        }

        timeFormat = timeFormat || timeFormats.iso;

        const VALID_TIME_FORMATS = Object.values(timeFormats);

        if (timeFormat && !VALID_TIME_FORMATS.includes(timeFormat)) {
            throw new Error(`Invalid timeFormat provided. Must be one of: ${VALID_TIME_FORMATS.join(", ")}.`);
        }

        this.description = description;
        this.timeFormat = timeFormat;
        this.callback = callback;
    }

    isHealthy() {
        return this.status === healthStatusValues.healthy;
    }

    isUnhealthy() {
        return this.status === healthStatusValues.unhealthy;
    }

    isUnknown() {
        return this.status === healthStatusValues.unknown
    }

    getTimestamp() {
        if (this.timeFormat === timeFormats.iso) {
            return new Date().toISOString();
        } else if (this.timeFormat === timeFormats.utc) {
            return new Date().toUTCString();
        } else if (this.timeFormat === timeFormats.unix) {
            return Math.floor(Date.now() / 1_000);
        } else if (this.timeFormat === timeFormats.calendar) {
            return new Date().toLocaleString();
        }

        return null;
    }

    async callCallbackFunction() {
        let resultStatus = null;

        try {
            const callbackResults = await this.callback();

            resultStatus = (callbackResults.status || healthStatusValues.healthy).toLowerCase();
        } catch (error) {
            resultStatus = healthStatusValues.unhealthy;
        }

        const VALID_STATUSES = Object.values(healthStatusValues);

        if (resultStatus && !VALID_STATUSES.includes(resultStatus)) {
            throw new Error(`Invalid status provided. Must be one of: ${VALID_STATUSES.join(", ")}.`);
        }

        this.status = resultStatus;
        
        if (this.isHealthy()) {
            this.statusCode = healthStatusCodes.healthy;
        } else if (this.isUnhealthy()) {
            this.statusCode = healthStatusCodes.unhealthy;
        } else if (this.isUnknown()) {
            this.statusCode = healthStatusCodes.unknown;
        }
    }

    async mapToObject() {
        const startTime = Date.now();

        await this.callCallbackFunction();
        
        const endTime = Date.now();
        const processTime = (endTime - startTime) / 1_000; // Convert milliseconds to seconds

        return {
            description: this.description || undefined,
            status: this.status,
            statusCode: this.statusCode,
            timestamp: this.getTimestamp(),
            processTime,
            uptime: process.uptime(),
        }
    }

    async handler() {
        return async (_, res) => {
            // Call this first to set the values of status and statusCode
            const responseObject = await this.mapToObject();

            return res
                .status(this.statusCode)
                .json(responseObject);
        }
    }
}

export default HealthCheck;
