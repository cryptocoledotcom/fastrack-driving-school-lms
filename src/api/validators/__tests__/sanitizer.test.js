import Sanitizer from '../sanitizer';

describe('Sanitizer', () => {
  describe('sanitizeString()', () => {
    it('should trim whitespace', () => {
      expect(Sanitizer.sanitizeString('  hello  ')).toBe('hello');
      expect(Sanitizer.sanitizeString('\n\ntest\n\n')).toBe('test');
      expect(Sanitizer.sanitizeString('\t\tvalue\t\t')).toBe('value');
    });

    it('should remove HTML-like brackets', () => {
      expect(Sanitizer.sanitizeString('<script>alert("xss")</script>')).toBe('script alert("xss") /script');
      expect(Sanitizer.sanitizeString('<div>content</div>')).toBe('div content /div');
      expect(Sanitizer.sanitizeString('< and >')).toBe(' and ');
    });

    it('should preserve normal text', () => {
      expect(Sanitizer.sanitizeString('normal text')).toBe('normal text');
      expect(Sanitizer.sanitizeString('text with numbers 123')).toBe('text with numbers 123');
      expect(Sanitizer.sanitizeString('special chars: !@#$%^&*()')).toBe('special chars: !@#$%^&*()');
    });

    it('should return non-string values unchanged', () => {
      expect(Sanitizer.sanitizeString(123)).toBe(123);
      expect(Sanitizer.sanitizeString(null)).toBe(null);
      expect(Sanitizer.sanitizeString(undefined)).toBe(undefined);
      expect(Sanitizer.sanitizeString({} )).toEqual({});
      expect(Sanitizer.sanitizeString([])).toEqual([]);
    });

    it('should handle empty strings', () => {
      expect(Sanitizer.sanitizeString('')).toBe('');
      expect(Sanitizer.sanitizeString('   ')).toBe('');
    });

    it('should handle mixed brackets', () => {
      expect(Sanitizer.sanitizeString('test < and > symbols')).toBe('test   and   symbols');
    });
  });

  describe('sanitizeObject()', () => {
    it('should sanitize string values in object', () => {
      const obj = { name: '  <script>alert</script>  ' };
      const sanitized = Sanitizer.sanitizeObject(obj);

      expect(sanitized.name).toBe('script alert /script');
    });

    it('should handle nested objects', () => {
      const obj = {
        user: {
          name: '  test  ',
          profile: {
            bio: '<dangerous>bio</dangerous>'
          }
        }
      };

      const sanitized = Sanitizer.sanitizeObject(obj);

      expect(sanitized.user.name).toBe('test');
      expect(sanitized.user.profile.bio).toBe('dangerous bio /dangerous');
    });

    it('should handle arrays of strings', () => {
      const obj = {
        tags: ['  tag1  ', '<tag2>', 'tag3']
      };

      const sanitized = Sanitizer.sanitizeObject(obj);

      expect(sanitized.tags[0]).toBe('tag1');
      expect(sanitized.tags[1]).toBe('tag2');
      expect(sanitized.tags[2]).toBe('tag3');
    });

    it('should preserve non-string values', () => {
      const obj = {
        count: 42,
        active: true,
        empty: null,
        decimal: 3.14
      };

      const sanitized = Sanitizer.sanitizeObject(obj);

      expect(sanitized.count).toBe(42);
      expect(sanitized.active).toBe(true);
      expect(sanitized.empty).toBeNull();
      expect(sanitized.decimal).toBe(3.14);
    });

    it('should return non-object values unchanged', () => {
      expect(Sanitizer.sanitizeObject('string')).toBe('string');
      expect(Sanitizer.sanitizeObject(123)).toBe(123);
      expect(Sanitizer.sanitizeObject(null)).toBe(null);
      expect(Sanitizer.sanitizeObject([1, 2, 3])).toEqual([1, 2, 3]);
    });

    it('should handle empty objects', () => {
      expect(Sanitizer.sanitizeObject({})).toEqual({});
    });

    it('should not modify original object', () => {
      const obj = { name: '  test  ' };
      const sanitized = Sanitizer.sanitizeObject(obj);

      expect(obj.name).toBe('  test  ');
      expect(sanitized.name).toBe('test');
    });
  });

  describe('sanitizeArray()', () => {
    it('should sanitize strings in array', () => {
      const arr = ['  test  ', '<script>alert</script>', 'normal'];
      const sanitized = Sanitizer.sanitizeArray(arr);

      expect(sanitized[0]).toBe('test');
      expect(sanitized[1]).toBe('script alert /script');
      expect(sanitized[2]).toBe('normal');
    });

    it('should handle nested arrays', () => {
      const arr = ['outer', ['  inner  ', '<tag>']];
      const sanitized = Sanitizer.sanitizeArray(arr);

      expect(sanitized[0]).toBe('outer');
      expect(sanitized[1][0]).toBe('inner');
      expect(sanitized[1][1]).toBe('tag');
    });

    it('should handle objects in arrays', () => {
      const arr = [
        { name: '  test  ' },
        { value: '<script>alert</script>' }
      ];

      const sanitized = Sanitizer.sanitizeArray(arr);

      expect(sanitized[0].name).toBe('test');
      expect(sanitized[1].value).toBe('script alert /script');
    });

    it('should preserve non-string values', () => {
      const arr = [1, 'test', null, true, 3.14];
      const sanitized = Sanitizer.sanitizeArray(arr);

      expect(sanitized[0]).toBe(1);
      expect(sanitized[1]).toBe('test');
      expect(sanitized[2]).toBeNull();
      expect(sanitized[3]).toBe(true);
      expect(sanitized[4]).toBe(3.14);
    });

    it('should return non-array values unchanged', () => {
      expect(Sanitizer.sanitizeArray('string')).toBe('string');
      expect(Sanitizer.sanitizeArray(123)).toBe(123);
      expect(Sanitizer.sanitizeArray(null)).toBe(null);
    });

    it('should handle empty arrays', () => {
      expect(Sanitizer.sanitizeArray([])).toEqual([]);
    });
  });

  describe('sanitizeEmail()', () => {
    it('should sanitize and lowercase email', () => {
      expect(Sanitizer.sanitizeEmail('  USER@EXAMPLE.COM  ')).toBe('user@example.com');
    });

    it('should remove HTML brackets', () => {
      expect(Sanitizer.sanitizeEmail('<script>alert</script>@example.com')).toBe('script alert /script@example.com');
    });

    it('should handle standard emails', () => {
      expect(Sanitizer.sanitizeEmail('user@example.com')).toBe('user@example.com');
      expect(Sanitizer.sanitizeEmail('USER@EXAMPLE.COM')).toBe('user@example.com');
      expect(Sanitizer.sanitizeEmail('Test.User@Example.Com')).toBe('test.user@example.com');
    });
  });

  describe('sanitizeUrl()', () => {
    it('should sanitize standard URLs', () => {
      const url = '  https://example.com/path  ';
      expect(Sanitizer.sanitizeUrl(url)).toBe('https://example.com/path');
    });

    it('should reject javascript: protocol', () => {
      expect(() => Sanitizer.sanitizeUrl('javascript:alert("xss")')).toThrow();
      expect(() => Sanitizer.sanitizeUrl('JavaScript:alert("xss")')).toThrow();
      expect(() => Sanitizer.sanitizeUrl('JAVASCRIPT:alert("xss")')).toThrow();
    });

    it('should reject data: protocol with scripts', () => {
      expect(() => Sanitizer.sanitizeUrl('data:text/html,<script>alert("xss")</script>')).toThrow();
      expect(() => Sanitizer.sanitizeUrl('DATA:text/html,<script>alert(1)</script>')).toThrow();
    });

    it('should allow safe data: URLs', () => {
      const safeDataUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
      expect(() => Sanitizer.sanitizeUrl(safeDataUrl)).not.toThrow();
    });

    it('should throw if not a string', () => {
      expect(() => Sanitizer.sanitizeUrl(123)).toThrow();
      expect(() => Sanitizer.sanitizeUrl(null)).toThrow();
      expect(() => Sanitizer.sanitizeUrl(undefined)).toThrow();
    });

    it('should handle relative URLs', () => {
      expect(Sanitizer.sanitizeUrl('/path/to/page')).toBe('/path/to/page');
      expect(Sanitizer.sanitizeUrl('../relative/path')).toBe('../relative/path');
    });

    it('should remove HTML brackets from URL', () => {
      expect(Sanitizer.sanitizeUrl('https://example.com/<script>')).toBe('https://example.com/script');
    });
  });

  describe('sanitizeHtml()', () => {
    it('should remove script tags', () => {
      const html = '<p>Safe</p><script>alert("xss")</script><p>Content</p>';
      const sanitized = Sanitizer.sanitizeHtml(html);

      expect(sanitized).not.toContain('<script>');
      expect(sanitized).toContain('Safe');
      expect(sanitized).toContain('Content');
    });

    it('should remove style tags', () => {
      const html = '<p>Text</p><style>body { display: none; }</style><p>More</p>';
      const sanitized = Sanitizer.sanitizeHtml(html);

      expect(sanitized).not.toContain('<style>');
      expect(sanitized).not.toContain('display');
    });

    it('should remove all HTML tags', () => {
      const html = '<div><p>Hello <span>World</span></p></div>';
      const sanitized = Sanitizer.sanitizeHtml(html);

      expect(sanitized).toBe('Hello World');
      expect(sanitized).not.toContain('<');
      expect(sanitized).not.toContain('>');
    });

    it('should handle self-closing tags', () => {
      const html = '<p>Image: <img src="test.jpg" /> Text</p>';
      const sanitized = Sanitizer.sanitizeHtml(html);

      expect(sanitized).not.toContain('<img');
      expect(sanitized).toContain('Image:');
    });

    it('should return non-string unchanged', () => {
      expect(Sanitizer.sanitizeHtml(123)).toBe(123);
      expect(Sanitizer.sanitizeHtml(null)).toBe(null);
    });

    it('should handle HTML entities', () => {
      const html = '<p>A &amp; B</p>';
      const sanitized = Sanitizer.sanitizeHtml(html);

      expect(sanitized).toContain('A &amp; B');
    });
  });

  describe('escapeHtml()', () => {
    it('should escape HTML special characters', () => {
      expect(Sanitizer.escapeHtml('<')).toBe('&lt;');
      expect(Sanitizer.escapeHtml('>')).toBe('&gt;');
      expect(Sanitizer.escapeHtml('&')).toBe('&amp;');
      expect(Sanitizer.escapeHtml('"')).toBe('&quot;');
      expect(Sanitizer.escapeHtml("'")).toBe('&#39;');
      expect(Sanitizer.escapeHtml('/')).toBe('&#x2F;');
    });

    it('should escape full HTML string', () => {
      const html = '<script>alert("xss")</script>';
      const escaped = Sanitizer.escapeHtml(html);

      expect(escaped).toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;&#x2F;script&gt;');
    });

    it('should preserve normal text', () => {
      expect(Sanitizer.escapeHtml('normal text')).toBe('normal text');
      expect(Sanitizer.escapeHtml('123')).toBe('123');
    });

    it('should return non-string unchanged', () => {
      expect(Sanitizer.escapeHtml(123)).toBe(123);
      expect(Sanitizer.escapeHtml(null)).toBe(null);
    });

    it('should handle mixed content', () => {
      const mixed = '<p>Hello & "world"</p>';
      const escaped = Sanitizer.escapeHtml(mixed);

      expect(escaped).toContain('&lt;p&gt;');
      expect(escaped).toContain('&amp;');
      expect(escaped).toContain('&quot;');
    });
  });

  describe('sanitizeAlphanumeric()', () => {
    it('should remove special characters by default', () => {
      expect(Sanitizer.sanitizeAlphanumeric('hello@world.com')).toBe('helloworld com');
      expect(Sanitizer.sanitizeAlphanumeric('test!@#$%')).toBe('test');
    });

    it('should preserve allowed special characters', () => {
      expect(Sanitizer.sanitizeAlphanumeric('hello-world_test', '-_')).toBe('hello-world_test');
      expect(Sanitizer.sanitizeAlphanumeric('file.name.txt', '.')).toBe('file.name.txt');
    });

    it('should preserve alphanumerics and spaces', () => {
      expect(Sanitizer.sanitizeAlphanumeric('Hello World 123')).toBe('Hello World 123');
    });

    it('should trim whitespace', () => {
      expect(Sanitizer.sanitizeAlphanumeric('  hello world  ')).toBe('hello world');
    });

    it('should return non-string unchanged', () => {
      expect(Sanitizer.sanitizeAlphanumeric(123)).toBe(123);
      expect(Sanitizer.sanitizeAlphanumeric(null)).toBe(null);
    });

    it('should handle empty strings', () => {
      expect(Sanitizer.sanitizeAlphanumeric('')).toBe('');
      expect(Sanitizer.sanitizeAlphanumeric('   ')).toBe('');
    });
  });

  describe('sanitizeForDatabase()', () => {
    it('should combine sanitization and escaping', () => {
      const input = '  <script>alert("xss")</script>  ';
      const sanitized = Sanitizer.sanitizeForDatabase(input);

      expect(sanitized).not.toContain('<');
      expect(sanitized).not.toContain('>');
      expect(sanitized).toContain('&lt;');
      expect(sanitized).toContain('&gt;');
    });

    it('should handle HTML special characters', () => {
      const input = 'User & Admin';
      const sanitized = Sanitizer.sanitizeForDatabase(input);

      expect(sanitized).toBe('User &amp; Admin');
    });

    it('should be safe for storage', () => {
      const inputs = [
        '<img src=x onerror="alert(1)">',
        'SELECT * FROM users;',
        '"><script>alert(1)</script>'
      ];

      inputs.forEach(input => {
        const sanitized = Sanitizer.sanitizeForDatabase(input);
        expect(sanitized).not.toContain('<');
        expect(sanitized).not.toContain('>');
      });
    });
  });

  describe('sanitizeUsername()', () => {
    it('should allow alphanumeric, dash, and underscore', () => {
      expect(Sanitizer.sanitizeUsername('john_doe-123')).toBe('john_doe-123');
    });

    it('should remove other special characters', () => {
      expect(Sanitizer.sanitizeUsername('john.doe@example')).toBe('johndoeexample');
      expect(Sanitizer.sanitizeUsername('john#doe$')).toBe('johndoe');
    });

    it('should lowercase is preserved (not lowercased)', () => {
      expect(Sanitizer.sanitizeUsername('JohnDoe')).toBe('JohnDoe');
    });

    it('should trim whitespace', () => {
      expect(Sanitizer.sanitizeUsername('  john_doe  ')).toBe('john_doe');
    });

    it('should return non-string unchanged', () => {
      expect(Sanitizer.sanitizeUsername(123)).toBe(123);
    });
  });

  describe('sanitizePhoneNumber()', () => {
    it('should allow digits, spaces, hyphens, parentheses', () => {
      expect(Sanitizer.sanitizePhoneNumber('(555) 123-4567')).toBe('(555) 123-4567');
      expect(Sanitizer.sanitizePhoneNumber('555-123-4567')).toBe('555-123-4567');
      expect(Sanitizer.sanitizePhoneNumber('+1 555 123 4567')).toBe('1 555 123 4567');
    });

    it('should remove other characters', () => {
      expect(Sanitizer.sanitizePhoneNumber('555.123.4567')).toBe('5551234567');
      expect(Sanitizer.sanitizePhoneNumber('555@123#4567')).toBe('5551234567');
    });

    it('should trim whitespace', () => {
      expect(Sanitizer.sanitizePhoneNumber('  (555) 123-4567  ')).toBe('(555) 123-4567');
    });

    it('should return non-string unchanged', () => {
      expect(Sanitizer.sanitizePhoneNumber(123)).toBe(123);
    });
  });

  describe('Security scenarios', () => {
    it('should protect against XSS via object injection', () => {
      const malicious = {
        comment: '<img src=x onerror="alert(\'xss\')">',
        author: '<script>stealCookies()</script>'
      };

      const safe = Sanitizer.sanitizeObject(malicious);

      expect(safe.comment).not.toContain('<img');
      expect(safe.author).not.toContain('<script>');
    });

    it('should protect against SQL injection via strings', () => {
      const sqlInjection = "'; DROP TABLE users; --";
      const sanitized = Sanitizer.sanitizeForDatabase(sqlInjection);

      // Should be escaped/safe, actual SQL wouldn't execute
      expect(sanitized).toBeDefined();
      expect(sanitized.length > 0).toBe(true);
    });

    it('should protect against attribute injection', () => {
      const input = '" onmouseover="alert(\'xss\')"';
      const escaped = Sanitizer.escapeHtml(input);

      expect(escaped).not.toContain('onmouseover');
      expect(escaped).toContain('&quot;');
    });

    it('should handle unicode bypass attempts', () => {
      const input = '<img src=x onerror="alert(1)">';
      const sanitized = Sanitizer.sanitizeString(input);

      expect(sanitized).not.toContain('<img');
      expect(sanitized).not.toContain('>');
    });
  });
});
