# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Development Commands

### Running the Application
```bash
# Navigate to the project directory first
cd crm_system

# Start development server with Turbopack
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run ESLint
npm run lint
```

### Database Initialization
```bash
# Initialize admin account
npm run init-admin

# Initialize test accounts
npm run init-test-accounts
```

## Architecture Overview

### Technology Stack
- **Frontend**: Next.js 15 with React 19, TypeScript, TailwindCSS
- **Backend**: Next.js API Routes
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT tokens with session management
- **State Management**: React Context (AuthContext, SidebarContext)

### Project Structure
```
crm_system/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/               # API routes
│   │   │   ├── auth/          # Authentication endpoints
│   │   │   ├── attendance/    # Attendance management
│   │   │   └── users/         # User management
│   │   ├── components/        # Shared React components
│   │   ├── attendance/        # Attendance management pages
│   │   └── account_management/# User account pages
│   └── contexts/              # React Context providers
├── scripts/                   # Database initialization scripts
└── public/                    # Static assets
```

### Core Features
1. **CRM System**: Customer/member relationship management for training activities
2. **Attendance Tracking**: QR code scanning, manual check-in, attendance reports
3. **User Management**: Multi-role system (admin, trainer, member) with different permissions
4. **Mobile Optimized**: Responsive design with mobile-specific optimizations

### Authentication & Authorization
- JWT-based authentication with HTTP-only cookies
- Session timeout after 30 minutes of inactivity
- Role-based access control (admin, trainer, member, user)
- Automatic logout on browser close using sessionStorage
- Protected routes with middleware.ts

### Mobile Optimizations
- Custom mobile layout with sidebar navigation
- Touch gesture support for menu interactions
- Optimized mobile UI components
- Performance optimizations for mobile scrolling

### API Structure
The API follows RESTful conventions with the following main endpoints:
- `/api/auth/*` - Authentication and session management
- `/api/attendance/*` - Attendance tracking and reporting
- `/api/users/*` - User account management

### Context Providers
- **AuthContext**: User authentication state and session management
- **SidebarContext**: Mobile navigation state and responsive layout control

### Key Configuration Files
- `middleware.ts`: Authentication middleware for protected routes
- `tsconfig.json`: TypeScript configuration with path aliases (@/*)
- `package.json`: Dependencies and custom scripts for database initialization

### Development Notes
- Uses Turbopack for faster development builds
- Includes mobile-specific click handling and debug helpers
- Session security with automatic cleanup mechanisms
- Comprehensive documentation in MOBILE_OPTIMIZATION.md and SESSION_SECURITY.md

# Development Guidelines

## Philosophy

### Core Beliefs

- **Incremental progress over big bangs** - Small changes that compile and pass tests
- **Learning from existing code** - Study and plan before implementing
- **Pragmatic over dogmatic** - Adapt to project reality
- **Clear intent over clever code** - Be boring and obvious

### Simplicity Means

- Single responsibility per function/class
- Avoid premature abstractions
- No clever tricks - choose the boring solution
- If you need to explain it, it's too complex

## Process

### 1. Planning & Staging

Break complex work into 3-5 stages. Document in `IMPLEMENTATION_PLAN.md`:

```markdown
## Stage N: [Name]
**Goal**: [Specific deliverable]
**Success Criteria**: [Testable outcomes]
**Tests**: [Specific test cases]
**Status**: [Not Started|In Progress|Complete]
```
- Update status as you progress
- Remove file when all stages are done

### 2. Implementation Flow

1. **Understand** - Study existing patterns in codebase
2. **Test** - Write test first (red)
3. **Implement** - Minimal code to pass (green)
4. **Refactor** - Clean up with tests passing
5. **Commit** - With clear message linking to plan

### 3. When Stuck (After 3 Attempts)

**CRITICAL**: Maximum 3 attempts per issue, then STOP.

1. **Document what failed**:
   - What you tried
   - Specific error messages
   - Why you think it failed

2. **Research alternatives**:
   - Find 2-3 similar implementations
   - Note different approaches used

3. **Question fundamentals**:
   - Is this the right abstraction level?
   - Can this be split into smaller problems?
   - Is there a simpler approach entirely?

4. **Try different angle**:
   - Different library/framework feature?
   - Different architectural pattern?
   - Remove abstraction instead of adding?

## Technical Standards

### Architecture Principles

- **Composition over inheritance** - Use dependency injection
- **Interfaces over singletons** - Enable testing and flexibility
- **Explicit over implicit** - Clear data flow and dependencies
- **Test-driven when possible** - Never disable tests, fix them

### Code Quality

- **Every commit must**:
  - Compile successfully
  - Pass all existing tests
  - Include tests for new functionality
  - Follow project formatting/linting

- **Before committing**:
  - Run formatters/linters
  - Self-review changes
  - Ensure commit message explains "why"

### Error Handling

- Fail fast with descriptive messages
- Include context for debugging
- Handle errors at appropriate level
- Never silently swallow exceptions

## Decision Framework

When multiple valid approaches exist, choose based on:

1. **Testability** - Can I easily test this?
2. **Readability** - Will someone understand this in 6 months?
3. **Consistency** - Does this match project patterns?
4. **Simplicity** - Is this the simplest solution that works?
5. **Reversibility** - How hard to change later?

## Project Integration

### Learning the Codebase

- Find 3 similar features/components
- Identify common patterns and conventions
- Use same libraries/utilities when possible
- Follow existing test patterns

### Tooling

- Use project's existing build system
- Use project's test framework
- Use project's formatter/linter settings
- Don't introduce new tools without strong justification

## Quality Gates

### Definition of Done

- [ ] Tests written and passing
- [ ] Code follows project conventions
- [ ] No linter/formatter warnings
- [ ] Commit messages are clear
- [ ] Implementation matches plan
- [ ] No TODOs without issue numbers

### Test Guidelines

- Test behavior, not implementation
- One assertion per test when possible
- Clear test names describing scenario
- Use existing test utilities/helpers
- Tests should be deterministic

## Important Reminders

**NEVER**:
- Use `--no-verify` to bypass commit hooks
- Disable tests instead of fixing them
- Commit code that doesn't compile
- Make assumptions - verify with existing code

**ALWAYS**:
- Commit working code incrementally
- Update plan documentation as you go
- Learn from existing implementations
- Stop after 3 failed attempts and reassess