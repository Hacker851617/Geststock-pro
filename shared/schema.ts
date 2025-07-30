import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const products = pgTable("products", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  sku: text("sku"),
  category: text("category").notNull(),
  quantity: integer("quantity").notNull().default(0),
  minStock: integer("min_stock").default(5),
  description: text("description"),
  lastModified: timestamp("last_modified").defaultNow(),
});

export const stockMovements = pgTable("stock_movements", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  productId: varchar("product_id").notNull().references(() => products.id),
  type: text("type").notNull(), // 'add' or 'remove'
  movementType: text("movement_type").notNull(), // 'sale', 'purchase', 'adjustment', 'return'
  quantity: integer("quantity").notNull(),
  reason: text("reason"),
  unitPrice: integer("unit_price"), // price in cents
  totalPrice: integer("total_price"), // price in cents
  reference: text("reference"), // invoice number, order number, etc.
  timestamp: timestamp("timestamp").defaultNow(),
});

export const insertProductSchema = createInsertSchema(products).omit({
  id: true,
  lastModified: true,
});

export const insertStockMovementSchema = createInsertSchema(stockMovements).omit({
  id: true,
  timestamp: true,
});

export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = typeof products.$inferSelect;
export type InsertStockMovement = z.infer<typeof insertStockMovementSchema>;
export type StockMovement = typeof stockMovements.$inferSelect;
