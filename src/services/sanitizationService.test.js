const SanitizationService = require('./sanitizationService');

describe('SanitizationService', () => {
    describe('sanitizeString', () => {
        it('should remove HTML tags', () => {
            const input = '<script>alert("xss")</script>';
            const result = SanitizationService.sanitizeString(input);
            expect(result).not.toContain('<');
            expect(result).not.toContain('>');
        });

        it('should trim whitespace', () => {
            const input = '  hello world  ';
            const result = SanitizationService.sanitizeString(input);
            expect(result).toBe('hello world');
        });

        it('should return non-string inputs as is', () => {
            expect(SanitizationService.sanitizeString(123)).toBe(123);
            expect(SanitizationService.sanitizeString(null)).toBe(null);
        });
    });

    describe('sanitizeEmail', () => {
        it('should lowercase email', () => {
            const input = 'JOHN@EXAMPLE.COM';
            const result = SanitizationService.sanitizeEmail(input);
            expect(result).toBe('john@example.com');
        });

        it('should trim whitespace', () => {
            const input = '  john@example.com  ';
            const result = SanitizationService.sanitizeEmail(input);
            expect(result).toBe('john@example.com');
        });
    });

    describe('sanitizeObject', () => {
        it('should sanitize all string values', () => {
            const input = {
                name: '<script>alert("xss")</script>',
                email: '  john@example.com  ',
            };
            const result = SanitizationService.sanitizeObject(input);
            expect(result.name).not.toContain('<');
            expect(result.email).toBe('john@example.com');
        });

        it('should remove password field', () => {
            const input = {
                name: 'John',
                password: 'secret123',
                email: 'john@example.com',
            };
            const result = SanitizationService.sanitizeObject(input);
            expect(result.password).toBeUndefined();
        });

        it('should handle arrays', () => {
            const input = {
                items: ['<script>test</script>', '  safe  '],
            };
            const result = SanitizationService.sanitizeObject(input);
            expect(result.items[0]).not.toContain('<');
            expect(result.items[1]).toBe('safe');
        });
    });

    describe('isValidUrl', () => {
        it('should validate correct URLs', () => {
            expect(SanitizationService.isValidUrl('https://example.com')).toBe(true);
            expect(SanitizationService.isValidUrl('http://localhost:3000')).toBe(true);
        });

        it('should reject invalid URLs', () => {
            expect(SanitizationService.isValidUrl('not-a-url')).toBe(false);
            expect(SanitizationService.isValidUrl('htp://example.com')).toBe(false);
        });
    });
});
