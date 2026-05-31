/**
 * Data Masking Layer
 *
 * This demonstrates how to implement data masking similar to
 * SAP AI Core Orchestration's masking module.
 *
 * It masks sensitive information before sending to LLM and
 * unmasks it in the response.
 */

export interface MaskingRule {
  type: 'email' | 'phone' | 'creditCard' | 'ssn' | 'custom';
  pattern: RegExp;
  maskWith?: string;
}

export interface MaskingResult {
  maskedText: string;
  entities: Array<{
    original: string;
    masked: string;
    type: string;
    start: number;
    end: number;
  }>;
}

/**
 * Default masking rules for common PII
 */
export const DEFAULT_MASKING_RULES: MaskingRule[] = [
  {
    type: 'email',
    pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
    maskWith: '[EMAIL]'
  },
  {
    type: 'phone',
    pattern: /\b(\+?1[-.]?)?\(?\d{3}\)?[-.]?\d{3}[-.]?\d{4}\b/g,
    maskWith: '[PHONE]'
  },
  {
    type: 'creditCard',
    pattern: /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g,
    maskWith: '[CREDIT_CARD]'
  },
  {
    type: 'ssn',
    pattern: /\b\d{3}-\d{2}-\d{4}\b/g,
    maskWith: '[SSN]'
  }
];

/**
 * Mask sensitive information in text
 */
export function maskText(
  text: string,
  rules: MaskingRule[] = DEFAULT_MASKING_RULES
): MaskingResult {
  let maskedText = text;
  const entities: MaskingResult['entities'] = [];

  for (const rule of rules) {
    const matches = Array.from(text.matchAll(rule.pattern));

    for (const match of matches) {
      if (match[0] && match.index !== undefined) {
        const original = match[0];
        const masked = rule.maskWith || `[${rule.type.toUpperCase()}]`;

        entities.push({
          original,
          masked,
          type: rule.type,
          start: match.index,
          end: match.index + original.length
        });

        // Replace in masked text
        maskedText = maskedText.replace(original, masked);
      }
    }
  }

  return {
    maskedText,
    entities
  };
}

/**
 * Unmask text using stored entities
 */
export function unmaskText(
  maskedText: string,
  entities: MaskingResult['entities']
): string {
  let unmaskedText = maskedText;

  // Unmask in reverse order to maintain positions
  for (const entity of entities.reverse()) {
    unmaskedText = unmaskedText.replace(entity.masked, entity.original);
  }

  return unmaskedText;
}

/**
 * Custom masking function with pattern preservation
 * This keeps the format of the sensitive data visible
 */
export function maskWithPatternPreservation(text: string): MaskingResult {
  const entities: MaskingResult['entities'] = [];
  let maskedText = text;

  // Credit card - show last 4 digits
  const creditCardPattern = /\b(\d{4})[-\s]?(\d{4})[-\s]?(\d{4})[-\s]?(\d{4})\b/g;
  const ccMatches = Array.from(text.matchAll(creditCardPattern));

  for (const match of ccMatches) {
    if (match[0] && match.index !== undefined) {
      const original = match[0];
      const lastFour = match[4];
      const masked = `****-****-****-${lastFour}`;

      entities.push({
        original,
        masked,
        type: 'creditCard',
        start: match.index,
        end: match.index + original.length
      });

      maskedText = maskedText.replace(original, masked);
    }
  }

  // Email - show domain
  const emailPattern = /\b([A-Za-z0-9._%+-]+)@([A-Za-z0-9.-]+\.[A-Z|a-z]{2,})\b/g;
  const emailMatches = Array.from(text.matchAll(emailPattern));

  for (const match of emailMatches) {
    if (match[0] && match.index !== undefined) {
      const original = match[0];
      const domain = match[2];
      const masked = `****@${domain}`;

      entities.push({
        original,
        masked,
        type: 'email',
        start: match.index,
        end: match.index + original.length
      });

      maskedText = maskedText.replace(original, masked);
    }
  }

  // Phone - show last 4 digits
  const phonePattern = /\b(\+?1[-.]?)?\(?(\d{3})\)?[-.]?(\d{3})[-.]?(\d{4})\b/g;
  const phoneMatches = Array.from(text.matchAll(phonePattern));

  for (const match of phoneMatches) {
    if (match[0] && match.index !== undefined) {
      const original = match[0];
      const lastFour = match[4];
      const masked = `***-***-${lastFour}`;

      entities.push({
        original,
        masked,
        type: 'phone',
        start: match.index,
        end: match.index + original.length
      });

      maskedText = maskedText.replace(original, masked);
    }
  }

  return {
    maskedText,
    entities
  };
}

/**
 * Example: Demonstrate masking capabilities
 */
export function demonstrateMasking() {
  console.log('\n┌──────────────────────────────────────────────┐');
  console.log('│  Data Masking Demonstration                 │');
  console.log('└──────────────────────────────────────────────┘\n');

  const examples = [
    'My email is john.doe@example.com and phone is 555-123-4567',
    'Please charge my card 4532-1234-5678-9010',
    'Contact me at jane@company.org or call 1-800-555-0199',
    'SSN: 123-45-6789, CC: 5555-4444-3333-2222'
  ];

  for (const example of examples) {
    console.log('Original:', example);

    // Full masking
    const fullMask = maskText(example);
    console.log('Masked (full):', fullMask.maskedText);

    // Pattern-preserving masking
    const patternMask = maskWithPatternPreservation(example);
    console.log('Masked (pattern):', patternMask.maskedText);

    // Show entities found
    console.log('Entities found:', fullMask.entities.length);
    fullMask.entities.forEach(entity => {
      console.log(`  - ${entity.type}: ${entity.original} → ${entity.masked}`);
    });

    console.log('');
  }
}

/**
 * Helper to mask messages array (for chat history)
 */
export function maskMessages(
  messages: Array<{ role: string; content: string }>,
  usePatternPreservation = false
): {
  maskedMessages: Array<{ role: string; content: string }>;
  allEntities: MaskingResult['entities'];
} {
  const maskedMessages = [];
  const allEntities: MaskingResult['entities'] = [];

  for (const message of messages) {
    const maskResult = usePatternPreservation
      ? maskWithPatternPreservation(message.content)
      : maskText(message.content);

    maskedMessages.push({
      role: message.role,
      content: maskResult.maskedText
    });

    allEntities.push(...maskResult.entities);
  }

  return {
    maskedMessages,
    allEntities
  };
}

// // Run demonstration if executed directly
// if (require.main === module) {
//   demonstrateMasking();
// }
