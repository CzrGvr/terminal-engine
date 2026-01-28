/**
 * Validator - JSON Schema validation for narrative configurations
 */

class Validator {
    constructor() {
        this.schemas = new Map();
        this.initializeSchemas();
    }

    /**
     * Initialize built-in schemas
     */
    initializeSchemas() {
        // Narrative config schema
        this.schemas.set('narrative', {
            type: 'object',
            required: ['narrative', 'version', 'startContext'],
            properties: {
                narrative: { type: 'string' },
                version: { type: 'string' },
                startContext: { type: 'string' },
                systems: { type: 'array' },
                progression: { type: 'object' },
                dialogues: { type: 'object' }
            }
        });
    }

    /**
     * Validate data against schema
     * @param {*} data - Data to validate
     * @param {string} schemaName - Schema name
     * @returns {Object} Validation result
     */
    validate(data, schemaName) {
        const schema = this.schemas.get(schemaName);
        
        if (!schema) {
            return {
                valid: false,
                errors: [`Schema '${schemaName}' not found`]
            };
        }

        const errors = [];

        // Type check
        if (schema.type && typeof data !== schema.type && !Array.isArray(data)) {
            if (!(schema.type === 'array' && Array.isArray(data))) {
                errors.push(`Expected type ${schema.type}, got ${typeof data}`);
            }
        }

        // Required fields
        if (schema.required && schema.type === 'object') {
            schema.required.forEach(field => {
                if (!(field in data)) {
                    errors.push(`Missing required field: ${field}`);
                }
            });
        }

        // Property validation
        if (schema.properties && schema.type === 'object') {
            Object.entries(schema.properties).forEach(([key, propSchema]) => {
                if (key in data) {
                    const value = data[key];
                    if (propSchema.type && typeof value !== propSchema.type && !Array.isArray(value)) {
                        if (!(propSchema.type === 'array' && Array.isArray(value))) {
                            errors.push(`Field '${key}': expected ${propSchema.type}, got ${typeof value}`);
                        }
                    }
                }
            });
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }

    /**
     * Register custom schema
     * @param {string} name - Schema name
     * @param {Object} schema - Schema definition
     */
    registerSchema(name, schema) {
        this.schemas.set(name, schema);
    }

    /**
     * Validate narrative configuration
     * @param {Object} config - Narrative config
     * @returns {Object} Validation result
     */
    validateNarrative(config) {
        return this.validate(config, 'narrative');
    }
}

const validator = new Validator();

export { validator, Validator };
"
Observation: Create successful: /app/terminal-engine/utils/validator.js
