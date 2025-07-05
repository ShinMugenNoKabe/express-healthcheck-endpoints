import { healthStatusValues, healthStatusCodes, timeFormats } from "./healthEnums.js";

class HealthCheck {
    constructor({ description, timeFormat, callback } = {}) {
        if (description && typeof description !== "string") {
            throw new Error("Invalid description provided. Must be a string.");
        }

        timeFormat = timeFormat || timeFormats.iso;

        const VALID_TIME_FORMATS = Object.values(timeFormats);

        if (timeFormat && !VALID_TIME_FORMATS.includes(timeFormat)) {
            throw new Error(`Invalid timeFormat provided. Must be one of: ${VALID_TIME_FORMATS.join(", ")}.`);
        }

        if (callback !== null && callback !== undefined && typeof callback !== "function") {
            throw new Error("Invalid callback provided. Must be a function.");
        }

        if (callback === null || callback === undefined) {
            callback = () => ({
                status: healthStatusValues.healthy,
            });
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
        return this.status === healthStatusValues.unknown;
    }

    getTimestamp(date) {
        const datesMap = {
            [timeFormats.iso]: date.toISOString(),
            [timeFormats.utc]: date.toUTCString(),
            [timeFormats.unix]: Math.floor(date.getTime() / 1_000),
            [timeFormats.calendar]: date.toLocaleString(),
        };
        
        return datesMap[this.timeFormat] || datesMap[timeFormats.iso];
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
            timestamp: this.getTimestamp(new Date()),
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
