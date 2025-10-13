# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Prerequisites

**Environment Setup:**
- Node.js and npm installed
- MongoDB database (connection URI is in `src/lib/mongodb.ts`)
- **Note**: MongoDB URI is currently hardcoded in `src/lib/mongodb.ts` - consider moving to environment variables for production

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

### Database Setup
```bash
# Initialize admin account (creates default admin user)
npm run init-admin

# Initialize test accounts (creates sample users for testing)
npm run init-test-accounts
```

**Additional database scripts** (in `scripts/` directory):
- `fix-quota-fields.js` - Migrate and fix member quota/ticket fields
- `migrate-renewal-count.js` - Migrate renewal count data
- `migrate-ticket-fields.js` - Migrate ticket system fields
- `cleanup-non-member-records.js` - Clean up invalid member records

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
│   │   ├── api/               # API routes (Next.js API Routes)
│   │   │   ├── auth/          # Authentication endpoints
│   │   │   ├── attendance/    # Attendance management
│   │   │   ├── accounts/      # Account CRUD operations
│   │   │   ├── qrcode/        # QR code generation/scanning
│   │   │   ├── activities/    # Activity management
│   │   │   └── financial-records/ # Financial records
│   │   ├── components/        # Shared React components
│   │   ├── attendance/        # Attendance pages (scan, check, by_name, etc.)
│   │   ├── account_management/# Account pages (admin, trainer, member)
│   │   ├── financial_management/ # Financial pages
│   │   ├── qrcode/            # QR code generation page
│   │   ├── member_management/ # Member profile pages
│   │   ├── activity_management/ # Activity pages
│   │   └── page.tsx           # Homepage
│   ├── contexts/              # React Context providers
│   ├── models/                # Mongoose schemas
│   ├── lib/                   # Utilities (mongodb, auth, cache)
│   └── config/                # Configuration files (PDF templates)
├── scripts/                   # Database initialization/migration scripts
└── public/                    # Static assets
```

### Core Features
1. **CRM System**: Customer/member relationship management for training activities
2. **Attendance Tracking**: QR code scanning, manual check-in, attendance reports
3. **User Management**: Multi-role system (admin, trainer, member) with different permissions
4. **QR Code Generation**: Generate QR codes for payment with PDF export (configurable templates)
5. **Financial Management**: Track financial records, member payments, and activity costs
6. **Member Management**: Track member profiles, quotas, tickets, and renewal history
7. **Mobile Optimized**: Responsive design with mobile-specific optimizations

### Authentication & Authorization
- JWT-based authentication with HTTP-only cookies
- Session timeout after 30 minutes of inactivity
- Automatic logout on browser close using sessionStorage
- Protected routes managed by AuthContext (not middleware.ts)

**User Roles:**
- `admin` - Full system access, can manage all accounts and view all data
- `trainer` - Can access attendance management and view activities
- `member` / `regular-member` / `premium-member` - Member-level access
- `user` - Basic user access

**Role-Based Access:**
- Admins: Access all pages including account management, QR code generation, financial records
- Trainers: Access homepage and attendance management only
- Members/Users: Limited access based on role (currently permissive, can be restricted)
- Access control logic in `src/contexts/AuthContext.tsx` via `hasRouteAccess()` function

### Mobile Optimizations
- Custom mobile layout with sidebar navigation
- Touch gesture support for menu interactions
- Optimized mobile UI components
- Performance optimizations for mobile scrolling

### API Structure
The API follows RESTful conventions with the following main endpoints:
- `/api/auth/*` - Authentication and session management
- `/api/attendance/*` - Attendance tracking and reporting
- `/api/accounts/*` - User account management (CRUD, quota management, member validation)
- `/api/qrcode/*` - QR code generation, scanning, and tracking
- `/api/financial-records/*` - Financial records management
- `/api/activities/*` - Activity management
- `/api/trainer-profile/*` - Trainer profile management

### Context Providers
- **AuthContext**: User authentication state and session management
- **SidebarContext**: Mobile navigation state and responsive layout control

### Database Models
- **Account**: User accounts with roles (admin, trainer, member types)
- **Attendance**: Attendance records with activity linking
- **Activity**: Training activities with location and trainer info
- **QRCode**: QR code generation tracking with sequential numbering
- **FinancialRecord**: Financial transactions and member payments
- **TrainerProfile**: Extended trainer information
- **Counter**: Auto-incrementing counters for QR codes and other entities

### Key Configuration Files
- `src/config/pdfTemplateConfig.ts`: Configurable PDF templates for QR code export (see README_PDF_CONFIG.md)
- `src/lib/mongodb.ts`: MongoDB connection with caching
- `src/lib/auth.ts`: JWT token generation and verification
- `tsconfig.json`: TypeScript configuration with path aliases (@/*)
- `package.json`: Dependencies and custom scripts for database initialization

### Important Features
- **QR Code System**: Sequential numbering (0001, 0002...) with region codes (WC, WTS, SM)
- **PDF Templates**: Highly configurable templates for QR code printing with custom styling
- **Member Ticket System**: Track initial tickets, added tickets, used tickets, and remaining quota
- **Location-Based Access**: Users can be restricted to specific locations (灣仔, 黃大仙, 石門)
- **Trainer Assignment**: Members must have a trainer introducer, optional referrer field
- **Session Security**: 30-minute inactivity timeout, automatic logout on browser close

### Location/Region Codes
The system uses three location codes consistently across the codebase:
- **WC** - 灣仔 (Wan Chai)
- **WTS** - 黃大仙 (Wong Tai Sin)
- **SM** - 石門 (Shek Mun)

These codes are used for:
- User location permissions (`locations` array in Account model)
- QR code region identification
- Activity location tracking
- Access control for trainers and members

### Development Notes
- Uses Turbopack for faster development builds
- Uses html2canvas and jsPDF for QR code PDF generation
- Uses `\u00A0` (non-breaking space) for preserving multiple spaces in PDF templates
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