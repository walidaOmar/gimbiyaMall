/**
 * server/rbac.test.ts
 *
 * Tests that every RBAC procedure correctly allows its intended role
 * and blocks all other roles.
 *
 * Strategy: create a minimal TrpcContext with a mocked user, call a
 * lightweight route that uses each procedure, and assert FORBIDDEN vs success.
 */

import { describe, it, expect, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import type { IUser } from "./models/User";

// Mock Mongoose models to prevent database connection attempts during tests
vi.mock("./models/Product", () => {
  const Product = {
    find: vi.fn().mockReturnThis(),
    populate: vi.fn().mockReturnThis(),
    skip: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    lean: vi.fn().mockResolvedValue([]),
    select: vi.fn().mockReturnThis(),
    sort: vi.fn().mockReturnThis(),
    create: vi.fn().mockResolvedValue({ _id: "000000000000000000000001" }),
    countDocuments: vi.fn().mockResolvedValue(0),
    findById: vi.fn().mockResolvedValue(null),
    findByIdAndUpdate: vi.fn().mockResolvedValue({}),
  };
  return { Product };
});

vi.mock("./models/Category", () => {
  const Category = {
    find: vi.fn().mockReturnThis(),
    lean: vi.fn().mockResolvedValue([]),
    create: vi.fn().mockResolvedValue({ _id: "000000000000000000000001" }),
    findByIdAndUpdate: vi.fn().mockResolvedValue({}),
  };
  return { Category };
});

vi.mock("./models/User", () => {
  const User = {
    find: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    sort: vi.fn().mockReturnThis(),
    skip: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    lean: vi.fn().mockResolvedValue([]),
    findOne: vi.fn().mockResolvedValue(null),
    countDocuments: vi.fn().mockResolvedValue(0),
    aggregate: vi.fn().mockResolvedValue([{ total: 0 }]),
    create: vi.fn().mockResolvedValue({ _id: "000000000000000000000001" }),
    findByIdAndUpdate: vi.fn().mockResolvedValue({}),
  };
  return { User };
});

vi.mock("./models/Order", () => {
  const Order = {
    find: vi.fn().mockReturnThis(),
    sort: vi.fn().mockReturnThis(),
    skip: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    populate: vi.fn().mockReturnThis(),
    lean: vi.fn().mockResolvedValue([]),
    findOne: vi.fn().mockResolvedValue(null),
    countDocuments: vi.fn().mockResolvedValue(0),
    aggregate: vi.fn().mockResolvedValue([{ total: 0 }]),
    create: vi.fn().mockResolvedValue({ _id: "000000000000000000000001" }),
    findOneAndUpdate: vi.fn().mockResolvedValue({}),
  };
  return { Order };
});

vi.mock("./models/CartItem", () => {
  const CartItem = {
    find: vi.fn().mockReturnThis(),
    populate: vi.fn().mockReturnThis(),
    lean: vi.fn().mockResolvedValue([]),
    deleteMany: vi.fn().mockResolvedValue({}),
    findByIdAndUpdate: vi.fn().mockResolvedValue({}),
  };
  return { CartItem };
});

vi.mock("./models/Store", () => {
  const Store = {
    find: vi.fn().mockReturnThis(),
    populate: vi.fn().mockReturnThis(),
    skip: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue([]),
    findById: vi.fn().mockResolvedValue(null),
    create: vi.fn().mockResolvedValue({ _id: "000000000000000000000001" }),
    findByIdAndUpdate: vi.fn().mockResolvedValue({}),
  };
  return { Store };
});

// ─── Context factory ──────────────────────────────────────────────────────────

type Role = IUser["role"];

function makeCtx(role: Role | null): TrpcContext {
  const user: IUser | null =
    role === null
      ? null
      : ({
          _id:         { toString: () => "000000000000000000000001" } as any,
          id:          "000000000000000000000001",
          name:        `Test ${role}`,
          email:       `${role}@test.com`,
          passwordHash:"$2b$12$fakehash",
          role,
          isActive:    true,
          isAffiliate: role === "reader",
          createdAt:   new Date(),
          updatedAt:   new Date(),
          lastSignedIn:new Date(),
          comparePassword: async () => false,
        } as unknown as IUser);

  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
      cookie:      () => {},
    } as unknown as TrpcContext["res"],
  };
}

function caller(role: Role | null) {
  return appRouter.createCaller(makeCtx(role));
}

// ─── Helper ───────────────────────────────────────────────────────────────────

async function expectForbidden(promise: Promise<unknown>): Promise<void> {
  await expect(promise).rejects.toMatchObject({ code: "FORBIDDEN" });
}

async function expectUnauthorized(promise: Promise<unknown>): Promise<void> {
  await expect(promise).rejects.toMatchObject({ code: "UNAUTHORIZED" });
}

// ─── Public routes (no auth required) ────────────────────────────────────────
describe("Public procedures — accessible to all", () => {
  it("products.list is accessible without login", async () => {
    // Returns an array (empty in test env — no MongoDB). Should not throw UNAUTHORIZED.
    await expect(
      caller(null).products.list({ limit: 5, offset: 0 })
    ).resolves.toBeDefined();
  });

  it("categories.list is accessible without login", async () => {
    await expect(
      caller(null).categories.list()
    ).resolves.toBeDefined();
  });
});

// ─── Unauthenticated access to protected routes ───────────────────────────────
describe("Protected procedures — reject unauthenticated requests", () => {
  it("admin.stats rejects null user with UNAUTHORIZED", async () => {
    await expectUnauthorized(caller(null).admin.stats());
  });

  it("stockManager.summary rejects null user with UNAUTHORIZED", async () => {
    await expectUnauthorized(caller(null).stockManager.summary());
  });

  it("developer.platformStats rejects null user with UNAUTHORIZED", async () => {
    await expectUnauthorized(caller(null).developer.platformStats());
  });
});

// ─── adminProcedure ──────────────────────────────────────────────────────────
describe("adminProcedure", () => {
  const roles: Role[] = ["manager", "stock_manager", "delivery", "reader", "buyer", "developer"];

  it("allows admin role", async () => {
    const p = caller("admin").admin.stats();
    await expect(p).resolves.toBeDefined();
  });

  for (const role of roles) {
    it(`blocks ${role}`, async () => {
      await expectForbidden(caller(role).admin.stats());
    });
  }
});

// ─── managerProcedure ────────────────────────────────────────────────────────
describe("managerProcedure", () => {
  const blockedRoles: Role[] = ["admin", "stock_manager", "delivery", "reader", "buyer", "developer"];

  const input = {
    name: "Test Product", categoryId: "000000000000000000000001",
    costPrice: 100, baseSalePrice: 200, commissionPercent: 10,
    stockQuantity: 50, images: [],
  };

  it("allows manager role past the RBAC gate", async () => {
    const p = caller("manager").products.create(input);
    await expect(p).resolves.toBeDefined();
  });

  for (const role of blockedRoles) {
    it(`blocks ${role}`, async () => {
      await expectForbidden(caller(role).products.create(input));
    });
  }
});

// ─── stockManagerProcedure ───────────────────────────────────────────────────
describe("stockManagerProcedure", () => {
  const blockedRoles: Role[] = ["admin", "manager", "delivery", "reader", "buyer", "developer"];

  it("allows stock_manager role", async () => {
    const p = caller("stock_manager").stockManager.summary();
    await expect(p).resolves.toBeDefined();
  });

  for (const role of blockedRoles) {
    it(`blocks ${role}`, async () => {
      await expectForbidden(caller(role).stockManager.summary());
    });
  }
});

// ─── inventoryProcedure (shared) ─────────────────────────────────────────────
describe("inventoryProcedure — shared access", () => {
  const allowedRoles: Role[] = ["admin", "manager", "stock_manager", "developer"];
  const blockedRoles: Role[] = ["buyer", "reader", "delivery"];

  for (const role of allowedRoles) {
    it(`allows ${role}`, async () => {
      const p = caller(role).inventory.list({ limit: 5, offset: 0 });
      await expect(p).resolves.toBeDefined();
    });
  }

  for (const role of blockedRoles) {
    it(`blocks ${role}`, async () => {
      await expectForbidden(caller(role).inventory.list({ limit: 5, offset: 0 }));
    });
  }
});

// ─── developerProcedure ──────────────────────────────────────────────────────
describe("developerProcedure", () => {
  const blockedRoles: Role[] = ["admin", "manager", "stock_manager", "delivery", "reader", "buyer"];

  it("allows developer role", async () => {
    const p = caller("developer").developer.platformStats();
    await expect(p).resolves.toBeDefined();
  });

  for (const role of blockedRoles) {
    it(`blocks ${role}`, async () => {
      await expectForbidden(caller(role).developer.platformStats());
    });
  }
});

// ─── deliveryProcedure ───────────────────────────────────────────────────────
describe("deliveryProcedure", () => {
  const blockedRoles: Role[] = ["admin", "manager", "stock_manager", "reader", "buyer", "developer"];

  it("allows delivery role", async () => {
    const p = caller("delivery").delivery.myOrders({ limit: 5, offset: 0 });
    await expect(p).resolves.toBeDefined();
  });

  for (const role of blockedRoles) {
    it(`blocks ${role}`, async () => {
      await expectForbidden(caller(role).delivery.myOrders({ limit: 5, offset: 0 }));
    });
  }
});

// ─── buyerProcedure (buyer + reader) ─────────────────────────────────────────
describe("buyerProcedure — buyer AND reader can access", () => {
  const allowedRoles: Role[] = ["buyer", "reader"];
  const blockedRoles: Role[] = ["admin", "manager", "stock_manager", "delivery", "developer"];

  for (const role of allowedRoles) {
    it(`allows ${role}`, async () => {
      const p = caller(role).cart.list();
      await expect(p).resolves.toBeDefined();
    });
  }

  for (const role of blockedRoles) {
    it(`blocks ${role}`, async () => {
      await expectForbidden(caller(role).cart.list());
    });
  }
});

// ─── staffProcedure (all staff except buyer/reader) ──────────────────────────
describe("staffProcedure — all staff roles", () => {
  const allowedRoles: Role[] = ["admin", "manager", "stock_manager", "delivery", "developer"];
  const blockedRoles: Role[] = ["buyer", "reader"];

  const input = { orderId: "ORD-TEST1234567", status: "processing" as const };

  for (const role of allowedRoles) {
    it(`allows ${role}`, async () => {
      const p = caller(role).orders.updateStatus(input);
      await expect(p).resolves.toBeDefined();
    });
  }

  for (const role of blockedRoles) {
    it(`blocks ${role}`, async () => {
      await expectForbidden(caller(role).orders.updateStatus(input));
    });
  }
});

// ─── readerProcedure ─────────────────────────────────────────────────────────
describe("readerProcedure", () => {
  const blockedRoles: Role[] = ["admin", "manager", "stock_manager", "delivery", "buyer", "developer"];

  it("allows reader role", async () => {
    const p = caller("reader").affiliate.getReferralLink();
    // Use resolves instead of rejects since it should pass RBAC and succeed (mocked)
    await expect(p).resolves.toBeDefined();
  });

  for (const role of blockedRoles) {
    it(`blocks ${role}`, async () => {
      await expectForbidden(caller(role).affiliate.getReferralLink());
    });
  }
});

// ─── Developer user management ────────────────────────────────────────────────
describe("developer.users routes", () => {
  it("developer can list users", async () => {
    const p = caller("developer").developer.users.list({ limit: 5, offset: 0 });
    await expect(p).resolves.toBeDefined();
  });

  it("admin cannot list developer users", async () => {
    await expectForbidden(caller("admin").developer.users.list({ limit: 5, offset: 0 }));
  });

  it("developer.users.create blocked for admin", async () => {
    const input = { name: "Test", email: "x@x.com", password: "Pass@1234", role: "manager" as const };
    await expectForbidden(caller("admin").developer.users.create(input));
  });
});

// ─── Admin staff management ───────────────────────────────────────────────────
describe("admin staff management routes", () => {
  it("admin can access onboardStockManager route (past RBAC)", async () => {
    const p = caller("admin").admin.onboardStockManager({
      name: "Test Stock", email: "s@test.com", password: "Pass@1234",
    });
    await expect(p).resolves.toBeDefined();
  });

  it("manager cannot onboard stock managers", async () => {
    await expectForbidden(
      caller("manager").admin.onboardStockManager({
        name: "Test", email: "t@t.com", password: "Pass@1234",
      })
    );
  });

  it("admin can list staff", async () => {
    const p = caller("admin").admin.listStaff({});
    await expect(p).resolves.toBeDefined();
  });
});
