# Gimbiya Mall — Project TODO

## Database & Schema
- [x] Design complete database schema (users, products, orders, commissions, inventory, etc.)
- [x] Create Drizzle schema migrations
- [x] Set up database relationships and constraints
- [x] Add stock_manager to User role enum (MongoDB model)

## Backend - Authentication & RBAC
- [x] Implement role-based access control (RBAC) middleware
- [x] Create protected procedures for each role (7 roles total)
- [x] Set up role validation at API level
- [x] stockManagerProcedure — stock_manager only
- [x] inventoryProcedure — shared: admin, manager, stock_manager, developer
- [x] staffProcedure — includes stock_manager

## Backend - Pricing (single source of truth)
- [x] Create server/pricing.ts — calcFinalPrice, calcTransactionFee, calcCommissionSplit, calcOrderTotals
- [x] Replace inline calcFinalPrice in routers.ts with import from pricing.ts
- [x] Commission split defined: with referrer (50/20/20/10), without (0/30/60/10)

## Backend - Product Management
- [x] Create product CRUD endpoints
- [x] Implement product categories
- [ ] Add product image upload to S3
- [x] Implement product search and filtering
- [x] Add pricing and stock management endpoints

## Backend - Order Management
- [x] Create order creation endpoint (uses calcOrderTotals from pricing.ts)
- [x] Implement order status tracking
- [x] Add order history retrieval
- [x] Create order cancellation logic (with stock restock)
- [x] Implement order status update endpoints

## Backend - Payment Integration
- [x] Set up Monnify API integration
- [x] Create payment initiation endpoint
- [x] Implement payment verification
- [x] Add payment status tracking to orders

## Backend - Commission & Affiliate System
- [x] Implement commission calculation logic
- [x] Create affiliate referral tracking
- [x] Add commission ledger endpoints
- [x] Implement earnings calculation for affiliates

## Backend - Inventory Management
- [x] Create inventory tracking system (shared inventory.* routes)
- [x] Implement low-stock alert logic (inventory.lowStock, stockManager.lowStockAlerts)
- [x] Add stock adjustment endpoints (inventory.adjustStock + stockManager.adjustStock)
- [x] Stock restock request (stockManager.requestRestock)
- [ ] Full inventory log table in DB (Phase 2 — currently uses console log)

## Backend - Delivery Management
- [x] Create delivery assignment endpoints
- [x] Implement delivery status update logic
- [x] Add rider order list endpoints
- [x] Create delivery confirmation endpoints

## Backend - Stock Manager (NEW ROLE)
- [x] stock_manager seed account (stock@sahadstores.com / Stock@123456)
- [x] stockManager.summary — dashboard stats
- [x] stockManager.products — inventory read
- [x] stockManager.lowStockAlerts — alerts list
- [x] stockManager.adjustStock — write permission
- [x] stockManager.requestRestock — restock requests

## Backend - Admin Extended
- [x] admin.onboardStockManager — create stock_manager user
- [x] admin.listStaff — list all staff in store
- [x] admin.toggleUserActive — enable/disable users
- [x] admin.enableAffiliate — promote buyer → reader

## Backend - Developer Extended
- [x] developer.stores.list / create / toggle — store management
- [x] developer.branches.list / create / toggle — branch management
- [x] developer.users.list / create / toggle / updateRole — full user management

## Backend - Tests
- [x] server/pricing.test.ts — 30+ tests for all fee calculations
- [x] server/rbac.test.ts — all 7 procedures tested (allow + block per role)
- [x] server/stockmanager.test.ts — stock manager routes + input validation
- [x] server/commission.test.ts — existing commission module tests
- [x] server/auth.logout.test.ts — existing auth tests
- [ ] Integration tests (Phase: production branch)

## Frontend - Authentication & Navigation
- [x] Build login/signup flow
- [x] Remove role selection from signup - all new users are buyers
- [x] Implement role-based navigation
- [x] Create protected routes
- [x] Build credentials-based login for testing all roles
- [x] Build user profile pages — order stats, address manager, password change

## Frontend - Stock Manager Dashboard (NEW)
- [x] StockManagerDashboard.tsx — summary cards + low stock preview
- [x] StockAdjustment.tsx — batch +/- controls, reason dropdown, notes
- [x] LowStockAlerts.tsx — filterable alerts + restock request form
- [x] InventoryHistory.tsx — paginated activity log

## Frontend - Developer Dashboard
- [x] DeveloperDashboard.tsx exists with complete UI
- [x] Wire mock data to real tRPC (developer.stores.*, developer.branches.*, developer.users.*)
  → Mock data works for DEMO; wire to tRPC before production promotion

## Frontend - Product Catalog
- [x] Build product listing page with featured products
- [x] Create product detail page
- [ ] Implement product search and filters
- [ ] Add product image gallery

## Frontend - Shopping Cart & Checkout
- [x] Implement shopping cart functionality with item management
- [x] Build cart page with quantity controls
- [x] Create checkout flow with address form
- [x] Integrate Monnify payment form
- [x] Add order confirmation page — order ID + estimated delivery shown

## Frontend - Admin Dashboard
- [x] Build admin dashboard layout
- [x] Create sales analytics charts
- [x] Implement revenue visualization
- [x] Create affiliate enablement interface
- [x] Create platform statistics widgets

## Frontend - Manager Dashboard
- [x] Manager dashboard with product management
- [x] Inventory management page
- [x] Category management

## Frontend - Delivery Dashboard
- [x] Delivery rider dashboard
- [x] Assigned orders list
- [ ] Delivery location map integration (Phase 5)

## Frontend - Affiliate/Reader Dashboard
- [x] Affiliate dashboard
- [x] Referral link generation
- [x] Earnings display

## Frontend - App.tsx
- [x] Stock manager routes: /stock-manager, /stock-manager/adjust, /stock-manager/low-stock, /stock-manager/history
- [x] DemoNav: 🗂 StockMgr button (#00695c)
- [x] Sub-page links for stock-manager section

## Docs
- [x] Full branding rename: Sahad Stores → Gimbiya Mall across all server, client, shared files
- [x] Cookie renamed gimbiya_session, DB default gimbiya_mall
- [x] stock_manager added to DashboardHeader nav, roleBadge, roleLabel
- [x] ROLE_CREDENTIALS.md — updated for 7 roles + permissions matrix
- [x] TEST_CREDENTIALS.md — updated with stock manager + all sub-pages
- [x] server/auth.ts header — updated for 7 roles
- [x] server/mongodb.ts header — updated for 7 roles

## Deployment & GitHub
- [ ] Push GIMBIYA MALL branch to GitHub
- [ ] Create production branch from GIMBIYA MALL (after checklist complete)
- [ ] Create deployment branch from production (after staging smoke test)
- [ ] Set up CI/CD pipeline
- [ ] Tag v1.0.0-demo release

## .env Variables Required for Production
- [ ] MONGODB_URI — MongoDB Atlas connection string
- [ ] MONGODB_DB_NAME — gimbiya_mall
- [ ] JWT_SECRET — 64-char random hex (generate fresh, never reuse)
- [ ] MONNIFY_API_KEY — from Monnify dashboard
- [ ] MONNIFY_SECRET_KEY — from Monnify dashboard
- [ ] MONNIFY_CONTRACT_CODE — from Monnify dashboard
- [ ] VITE_APP_URL — production domain
- [ ] NODE_ENV — production
- [ ] FEATURE_TRANSACTION_FEE — false (enable in Phase 2)
