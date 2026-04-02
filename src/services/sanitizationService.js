class SanitizationService {
    // Remove potentially dangerous characters
    sanitizeString(str) {
        if (typeof str !== 'string') return str;
        return str
            .replace(/[<>]/g, '')
            .trim();
    }

    // Sanitize email
    sanitizeEmail(email) {
        return email.toLowerCase().trim();
    }

    // Sanitize object recursively
    sanitizeObject(obj) {
        if (Array.isArray(obj)) {
            return obj.map(item => this.sanitizeObject(item));
        }

        if (obj !== null && typeof obj === 'object') {
            const sanitized = {};
            for (const [key, value] of Object.entries(obj)) {
                // Skip certain fields
                if ((key === 'password' || key === 'token' || key === '__v')) {
                    continue;
                }
                sanitized[key] = this.sanitizeObject(value);
            }
            return sanitized;
        }

        if (typeof obj === 'string') {
            return this.sanitizeString(obj);
        }

        return obj;
    }

    // Validate URL
    isValidUrl(url) {
        try {
            const parsed = new URL(url);
            return ['http:', 'https:'].includes(parsed.protocol);
        } catch {
            return false;
        }
    }

    // Prevent NoSQL injection in queries
    sanitizeQuery(query) {
        const sanitized = {};
        for (const [key, value] of Object.entries(query)) {
            if (typeof value === 'string') {
                sanitized[key] = this.sanitizeString(value);
            } else {
                sanitized[key] = value;
            }
        }
        return sanitized;
    }
}

module.exports = new SanitizationService();
