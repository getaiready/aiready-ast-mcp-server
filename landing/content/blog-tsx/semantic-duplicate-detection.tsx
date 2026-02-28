import meta from './semantic-duplicate-detection.meta';
import React from 'react';
import CodeBlock from '../../components/CodeBlock';

const Post = () => (
  <>
    <p>
      You've just asked your AI assistant to add email validation to your new
      signup form. It writes this:
    </p>

    <CodeBlock lang="typescript">{`function validateEmail(email: string): boolean {
  return email.includes('@') && email.includes('.');
}`}</CodeBlock>

    <p>
      Simple enough. But here's the problem: this exact logic—checking for '@'
      and '.'—already exists in four other places in your codebase, just written
      differently:
    </p>

    <CodeBlock lang="typescript">{`// In src/utils/validators.ts
const isValidEmail = (e) => e.indexOf('@') !== -1 && e.indexOf('.') !== -1;

// In src/api/auth.ts
if (user.email.match(/@/) && user.email.match(/\\./)) { /* ... */ }

// In src/components/EmailForm.tsx
const checkEmail = (val) => val.split('').includes('@') && val.split('').includes('.');

// In src/services/user-service.ts
return email.search('@') >= 0 && email.search('.') >= 0;`}</CodeBlock>

    <p>
      Your AI didn't see these patterns. Why? Because they look different
      syntactically, even though they're semantically identical. This is{' '}
      <strong>semantic duplication</strong>—and it's one of the biggest hidden
      costs in AI-assisted development.
    </p>

    <div className="my-12 max-w-2xl mx-auto">
      <img
        src="/series-4-semantic-duplicate-detection.png"
        alt="Semantic Duplicate Detection - How AI keeps rewriting the same logic in different ways"
        className="rounded-3xl shadow-2xl border border-slate-200 dark:border-zinc-800 w-full"
      />
      <p className="text-center text-sm text-slate-500 mt-4 italic">
        How AI models miss semantic duplicates: same logic, different syntax,
        invisible to traditional analysis.
      </p>
    </div>

    <h2>The Problem: Syntax Blinds AI Models</h2>
    <p>
      Traditional duplicate detection tools look for <em>exact</em> or
      near-exact text matches. They catch copy-paste duplicates, but miss logic
      that's been rewritten with different:
    </p>
    <ul>
      <li>
        Variable names (<code>email</code> vs <code>e</code> vs <code>val</code>
        )
      </li>
      <li>
        Methods (<code>includes()</code> vs <code>indexOf()</code> vs{' '}
        <code>match()</code> vs <code>search()</code>)
      </li>
      <li>Structure (inline vs function vs arrow function)</li>
    </ul>
    <p>
      AI models suffer from the same limitation. When they scan your codebase
      for context, they see these five implementations as completely unrelated.
      Each one consumes precious context window tokens, yet provides zero new
      information.
    </p>

    <h2>Real-World Impact: The receiptclaimer Story</h2>
    <p>
      When I ran <code>@aiready/pattern-detect</code> on{' '}
      <a href="https://receiptclaimer.com">receiptclaimer</a>'s codebase, I
      found <strong>23 semantic duplicate patterns</strong> scattered across 47
      files. Here's what that looked like:
    </p>

    <p>
      <strong>Before:</strong>
    </p>
    <ul>
      <li>23 duplicate patterns (validation, formatting, error handling)</li>
      <li>8,450 wasted context tokens</li>
      <li>AI suggestions kept reinventing existing logic</li>
      <li>Code reviews: "Didn't we already have this somewhere?"</li>
    </ul>

    <p>
      <strong>After consolidation:</strong>
    </p>
    <ul>
      <li>3 remaining patterns (acceptable, different contexts)</li>
      <li>1,200 context tokens (85% reduction)</li>
      <li>AI now references existing patterns</li>
      <li>Faster code reviews, cleaner suggestions</li>
    </ul>

    <p>
      The math: Each duplicate pattern cost ~367 tokens on average. When AI
      assistants tried to understand feature areas, they had to load multiple
      variations of the same logic, quickly exhausting their context window.
    </p>

    <h2>How It Works: Jaccard Similarity on AST Tokens</h2>
    <p>
      <code>@aiready/pattern-detect</code> uses a technique called{' '}
      <strong>Jaccard similarity</strong> on{' '}
      <strong>Abstract Syntax Tree (AST) tokens</strong> to detect semantic
      duplicates. Let me break that down.
    </p>

    <h3>Step 1: Parse to AST</h3>
    <p>
      First, we parse your code into an Abstract Syntax Tree—a structural
      representation that ignores syntax and focuses on meaning:
    </p>

    <CodeBlock lang="typescript">{`// Original code
function validateEmail(email) {
  return email.includes('@') && email.includes('.');
}

// AST tokens (simplified)
[
  'FunctionDeclaration',
  'Identifier:validateEmail',
  'Identifier:email',
  'ReturnStatement',
  'LogicalExpression:&&',
  'CallExpression:includes',
  'MemberExpression:email',
  'StringLiteral:@',
  'CallExpression:includes',
  'MemberExpression:email',
  'StringLiteral:.'
]`}</CodeBlock>

    <h3>Step 2: Normalize</h3>
    <p>We normalize these tokens by:</p>
    <ul>
      <li>Removing specific identifiers (variable/function names)</li>
      <li>Keeping operation types (CallExpression, LogicalExpression)</li>
      <li>Preserving structure (nesting, flow control)</li>
    </ul>

    <CodeBlock lang="typescript">{`// Normalized tokens
[
  'FunctionDeclaration',
  'ReturnStatement',
  'LogicalExpression:&&',
  'CallExpression:includes',
  'StringLiteral',
  'CallExpression:includes',
  'StringLiteral'
]`}</CodeBlock>

    <h3>Step 3: Calculate Jaccard Similarity</h3>
    <p>Jaccard similarity measures how similar two sets are:</p>

    <CodeBlock lang="text">{`Jaccard(A, B) = |A ∩ B| / |A ∪ B|`}</CodeBlock>

    <p>Where:</p>
    <ul>
      <li>
        <strong>A ∩ B</strong> = tokens in both sets (intersection)
      </li>
      <li>
        <strong>A ∪ B</strong> = tokens in either set (union)
      </li>
    </ul>

    <p>
      <strong>Example:</strong>
    </p>

    <CodeBlock lang="typescript">{`// Pattern A (normalized)
Set A = ['FunctionDeclaration', 'ReturnStatement', 'LogicalExpression:&&', 
         'CallExpression:includes', 'StringLiteral']

// Pattern B (normalized)
Set B = ['FunctionDeclaration', 'ReturnStatement', 'LogicalExpression:&&', 
         'CallExpression:indexOf', 'StringLiteral']

// Intersection
A ∩ B = ['FunctionDeclaration', 'ReturnStatement', 'LogicalExpression:&&', 
         'StringLiteral']
|A ∩ B| = 4

// Union
A ∪ B = ['FunctionDeclaration', 'ReturnStatement', 'LogicalExpression:&&', 
         'CallExpression:includes', 'CallExpression:indexOf', 'StringLiteral']
|A ∪ B| = 6

// Jaccard similarity
Jaccard(A, B) = 4 / 6 = 0.67 (67%)`}</CodeBlock>

    <p>
      By default, <code>pattern-detect</code> flags patterns with{' '}
      <strong>≥70% similarity</strong> as duplicates. This catches most semantic
      duplicates while avoiding false positives.
    </p>

    <h2>Pattern Classification</h2>
    <p>The tool automatically classifies patterns into categories:</p>

    <h3>1. Validators</h3>
    <p>Logic that checks conditions and returns boolean:</p>
    <CodeBlock lang="typescript">{`// Pattern: Email validation
function validateEmail(email) { return email.includes('@'); }
const isValidEmail = (e) => e.indexOf('@') !== -1;`}</CodeBlock>

    <h3>2. Formatters</h3>
    <p>Logic that transforms input to output:</p>
    <CodeBlock lang="typescript">{`// Pattern: Phone number formatting
function formatPhone(num) { return num.replace(/\\D/g, ''); }
const cleanPhone = (n) => n.split('').filter(c => /\\d/.test(c)).join('');`}</CodeBlock>

    <h3>3. API Handlers</h3>
    <p>Request/response processing logic:</p>
    <CodeBlock lang="typescript">{`// Pattern: Error response handling
function handleError(err) { return { status: 500, message: err.message }; }
const errorResponse = (e) => ({ status: 500, message: e.message });`}</CodeBlock>

    <h3>4. Utilities</h3>
    <p>General helper functions:</p>
    <CodeBlock lang="typescript">{`// Pattern: Array deduplication
function unique(arr) { return [...new Set(arr)]; }
const dedupe = (a) => Array.from(new Set(a));`}</CodeBlock>

    <h2>When to Extract vs When to Tolerate</h2>
    <p>
      Not all semantic duplicates should be eliminated. Here's how to decide:
    </p>

    <h3>✅ Extract When:</h3>
    <ul>
      <li>
        <strong>High similarity (&gt;85%):</strong> Nearly identical logic,
        definitely consolidate
      </li>
      <li>
        <strong>Frequent reuse:</strong> Used in 3+ places
      </li>
      <li>
        <strong>Core business logic:</strong> Validation, formatting,
        calculations
      </li>
      <li>
        <strong>High maintenance cost:</strong> Logic that changes often
      </li>
    </ul>

    <h3>⚠️ Consider Context:</h3>
    <ul>
      <li>
        <strong>Medium similarity (70-85%):</strong> Review case-by-case
      </li>
      <li>
        <strong>Different domains:</strong> User validation vs product
        validation might be intentionally separate
      </li>
      <li>
        <strong>Performance critical:</strong> Sometimes duplication for
        optimization is justified
      </li>
    </ul>

    <h3>❌ Tolerate When:</h3>
    <ul>
      <li>
        <strong>Low similarity (&lt;70%):</strong> Probably not semantic
        duplicates
      </li>
      <li>
        <strong>Test code:</strong> Tests often duplicate assertions
        intentionally
      </li>
      <li>
        <strong>Isolated modules:</strong> If modules should remain independent
      </li>
      <li>
        <strong>One-off logic:</strong> Used once or twice, extraction overhead
        not worth it
      </li>
    </ul>

    <h2>Example: Refactoring receiptclaimer's Validation Logic</h2>
    <p>Here's a real refactoring from receiptclaimer:</p>

    <p>
      <strong>Before: 5 duplicate email validators</strong>
    </p>

    <CodeBlock lang="typescript">{`// src/api/auth/signup.ts
function validateSignupEmail(email: string) {
  return email.includes('@') && email.length > 5;
}

// src/api/auth/login.ts
const checkLoginEmail = (e: string) => 
  e.indexOf('@') !== -1 && e.length > 5;

// src/services/user-service.ts
function isValidEmail(email: string) {
  return /@/.test(email) && email.length > 5;
}

// src/components/EmailForm.tsx
const validateEmail = (val: string) => 
  val.includes('@') && val.trim().length > 5;

// src/utils/validators.ts
export const emailValid = (email: string) => 
  email.search('@') >= 0 && email.length > 5;`}</CodeBlock>

    <p>
      <strong>Similarity scores:</strong>
    </p>
    <ul>
      <li>signup vs login: 89%</li>
      <li>signup vs user-service: 87%</li>
      <li>signup vs EmailForm: 85%</li>
      <li>signup vs validators: 91%</li>
    </ul>

    <p>
      <strong>After: Consolidated to core utility</strong>
    </p>

    <CodeBlock lang="typescript">{`// src/utils/validators.ts
export function isValidEmail(email: string): boolean {
  return email.includes('@') && email.trim().length > 5;
}

// Usage everywhere else
import { isValidEmail } from '@/utils/validators';`}</CodeBlock>

    <p>
      <strong>Impact:</strong>
    </p>
    <ul>
      <li>5 implementations → 1</li>
      <li>~1,850 tokens → ~370 tokens (80% reduction)</li>
      <li>AI now finds and reuses the pattern</li>
      <li>Single source of truth for email validation</li>
    </ul>

    <h2>Integration with CI/CD</h2>
    <p>Make semantic duplicate detection part of your workflow:</p>

    <h3>GitHub Actions Example</h3>

    <CodeBlock lang="yaml">{`name: Code Quality
on: [pull_request]

jobs:
  semantic-analysis:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      
      - name: Detect semantic duplicates
        run: npx @aiready/pattern-detect ./src --threshold 70
        
      - name: Comment on PR
        if: failure()
        uses: actions/github-script@v6
        with:
          script: |
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: '⚠️ Semantic duplicates detected. Run \`npx @aiready/pattern-detect\` locally for details.'
            })`}</CodeBlock>

    <h3>Pre-commit Hook</h3>

    <CodeBlock lang="bash">{`#!/bin/sh
# .git/hooks/pre-commit

echo "Checking for semantic duplicates..."
npx @aiready/pattern-detect ./src --threshold 70 --quiet

if [ $? -ne 0 ]; then
  echo "❌ Semantic duplicates detected. Review and consolidate before committing."
  exit 1
fi`}</CodeBlock>

    <h2>Advanced Configuration</h2>
    <p>Customize pattern detection for your project:</p>

    <CodeBlock lang="json">{`{
  "pattern-detect": {
    "threshold": 70,
    "minTokens": 10,
    "ignorePatterns": [
      "**/tests/**",
      "**/*.test.ts",
      "**/mocks/**"
    ],
    "categories": {
      "validators": {
        "enabled": true,
        "threshold": 75
      },
      "formatters": {
        "enabled": true,
        "threshold": 70
      }
    }
  }
}`}</CodeBlock>

    <h2>Best Practices</h2>
    <ol>
      <li>
        <strong>Run regularly:</strong> Make it part of your CI/CD, not a
        one-time audit
      </li>
      <li>
        <strong>Start with high thresholds:</strong> Begin at 85%, lower
        gradually as you understand your codebase
      </li>
      <li>
        <strong>Review context:</strong> Don't blindly consolidate—understand
        why duplicates exist
      </li>
      <li>
        <strong>Educate your team:</strong> Share findings in code reviews,
        explain semantic vs syntactic
      </li>
      <li>
        <strong>Track progress:</strong> Measure token reduction over time
      </li>
    </ol>

    <h2>The Bottom Line</h2>
    <p>
      Semantic duplication is invisible to traditional tools and AI models
      alike. But it's costing you:
    </p>
    <ul>
      <li>
        <strong>Context window waste:</strong> 30-50% of tokens in typical
        AI-assisted projects
      </li>
      <li>
        <strong>Slower AI responses:</strong> Models process redundant logic
        repeatedly
      </li>
      <li>
        <strong>Inconsistent suggestions:</strong> AI doesn't know which pattern
        to follow
      </li>
      <li>
        <strong>Higher maintenance:</strong> Changes must be made in multiple
        places
      </li>
    </ul>

    <p>
      <code>@aiready/pattern-detect</code> makes the invisible visible. It shows
      you where your AI is wasting context, where your patterns diverge, and
      where consolidation will have the biggest impact.
    </p>

    <h2>Try It Yourself</h2>

    <CodeBlock lang="bash">{`# Analyze your codebase
npx @aiready/pattern-detect ./src

# With custom threshold
npx @aiready/pattern-detect ./src --threshold 80

# Output to JSON
npx @aiready/pattern-detect ./src --output json > report.json

# Unified CLI with all metrics
npx @aiready/cli scan --score`}</CodeBlock>

    <p>
      <strong>Resources:</strong>
    </p>
    <ul>
      <li>
        GitHub:{' '}
        <a href="https://github.com/caopengau/aiready-cli">
          github.com/caopengau/aiready-cli
        </a>
      </li>
      <li>
        Docs: <a href="https://aiready.dev">aiready.dev</a>
      </li>
      <li>
        Report issues:{' '}
        <a href="https://github.com/caopengau/aiready-cli/issues">
          github.com/caopengau/aiready-cli/issues
        </a>
      </li>
    </ul>

    <hr className="my-12 border-slate-200 dark:border-zinc-800" />

    <p>
      <strong>Found semantic duplicates in your codebase?</strong> Share your
      before/after numbers in the comments—I'd love to hear your results.
    </p>

    <hr className="my-12 border-slate-200 dark:border-zinc-800" />

    <p>
      <strong>Read the full series:</strong>
    </p>
    <ul className="list-disc pl-6 mb-4 space-y-2">
      <li>
        <a href="/blog/ai-code-debt-tsunami">
          Part 1: The AI Code Debt Tsunami is Here (And We&apos;re Not Ready)
        </a>
      </li>
      <li>
        <a href="/blog/invisible-codebase">
          Part 2: Why Your Codebase is Invisible to AI (And What to Do About It)
        </a>
      </li>
      <li>
        <a href="/blog/metrics-that-actually-matter">
          Part 3: AI Code Quality Metrics That Actually Matter
        </a>
      </li>
      <li>
        <strong>
          Part 4: Deep Dive: Semantic Duplicate Detection with AST Analysis ←
          You are here
        </strong>
      </li>
      <li>
        <a href="/blog/hidden-cost-import-chains">
          Part 5: The Hidden Cost of Import Chains
        </a>
      </li>
      <li>
        <a href="/blog/visualizing-invisible">
          Part 6: Visualizing the Invisible: Seeing the Shape of AI Code Debt
        </a>
      </li>
    </ul>

    <hr className="my-12 border-slate-200 dark:border-zinc-800" />

    <p className="text-sm italic text-slate-500">
      *Peng Cao is the founder of{' '}
      <a href="https://receiptclaimer.com">receiptclaimer</a> and creator of{' '}
      <a href="https://github.com/caopengau/aiready-cli">aiready</a>, an
      open-source suite for measuring and optimizing codebases for AI adoption.*
    </p>
  </>
);

export default Post;
