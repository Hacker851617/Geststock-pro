import { type Product, type InsertProduct, type StockMovement, type InsertStockMovement } from "@shared/schema";
import { randomUUID } from "crypto";
import fs from "fs/promises";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");
const PRODUCTS_FILE = path.join(DATA_DIR, "products.json");
const MOVEMENTS_FILE = path.join(DATA_DIR, "stock_movements.json");

export interface IStorage {
  // Products
  getProducts(): Promise<Product[]>;
  getProduct(id: string): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: string, product: Partial<InsertProduct>): Promise<Product | undefined>;
  deleteProduct(id: string): Promise<boolean>;
  
  // Stock movements
  getStockMovements(): Promise<StockMovement[]>;
  createStockMovement(movement: InsertStockMovement): Promise<StockMovement>;
  
  // Stats
  getStats(): Promise<{
    totalProducts: number;
    totalStock: number;
    lowStock: number;
    outOfStock: number;
  }>;
}

export class MemStorage implements IStorage {
  private products: Map<string, Product>;
  private stockMovements: Map<string, StockMovement>;

  constructor() {
    this.products = new Map();
    this.stockMovements = new Map();
    this.loadData();
  }

  private async ensureDataDir() {
    try {
      await fs.mkdir(DATA_DIR, { recursive: true });
    } catch (error) {
      // Directory might already exist
    }
  }

  private async loadData() {
    await this.ensureDataDir();
    
    try {
      const productsData = await fs.readFile(PRODUCTS_FILE, 'utf-8');
      const products = JSON.parse(productsData) as Product[];
      products.forEach(product => {
        this.products.set(product.id, product);
      });
    } catch (error) {
      // File doesn't exist yet, start with empty data
    }

    try {
      const movementsData = await fs.readFile(MOVEMENTS_FILE, 'utf-8');
      const movements = JSON.parse(movementsData) as StockMovement[];
      movements.forEach(movement => {
        this.stockMovements.set(movement.id, movement);
      });
    } catch (error) {
      // File doesn't exist yet, start with empty data
    }
  }

  private async saveProducts() {
    await this.ensureDataDir();
    const products = Array.from(this.products.values());
    await fs.writeFile(PRODUCTS_FILE, JSON.stringify(products, null, 2));
  }

  private async saveMovements() {
    await this.ensureDataDir();
    const movements = Array.from(this.stockMovements.values());
    await fs.writeFile(MOVEMENTS_FILE, JSON.stringify(movements, null, 2));
  }

  async getProducts(): Promise<Product[]> {
    return Array.from(this.products.values()).sort((a, b) => 
      new Date(b.lastModified!).getTime() - new Date(a.lastModified!).getTime()
    );
  }

  async getProduct(id: string): Promise<Product | undefined> {
    return this.products.get(id);
  }

  async createProduct(insertProduct: InsertProduct): Promise<Product> {
    const id = randomUUID();
    const product: Product = {
      ...insertProduct,
      id,
      lastModified: new Date(),
      description: insertProduct.description || null,
      sku: insertProduct.sku || null,
      minStock: insertProduct.minStock || null,
      quantity: insertProduct.quantity || 0,
    };
    this.products.set(id, product);
    await this.saveProducts();
    return product;
  }

  async updateProduct(id: string, updates: Partial<InsertProduct>): Promise<Product | undefined> {
    const existingProduct = this.products.get(id);
    if (!existingProduct) return undefined;

    const updatedProduct: Product = {
      ...existingProduct,
      ...updates,
      lastModified: new Date(),
    };
    this.products.set(id, updatedProduct);
    await this.saveProducts();
    return updatedProduct;
  }

  async deleteProduct(id: string): Promise<boolean> {
    const deleted = this.products.delete(id);
    if (deleted) {
      await this.saveProducts();
    }
    return deleted;
  }

  async getStockMovements(): Promise<StockMovement[]> {
    return Array.from(this.stockMovements.values()).sort((a, b) => 
      new Date(b.timestamp!).getTime() - new Date(a.timestamp!).getTime()
    );
  }

  async createStockMovement(insertMovement: InsertStockMovement): Promise<StockMovement> {
    const id = randomUUID();
    const movement: StockMovement = {
      ...insertMovement,
      id,
      timestamp: new Date(),
      reason: insertMovement.reason || null,
      unitPrice: insertMovement.unitPrice || null,
      totalPrice: insertMovement.totalPrice || null,
      reference: insertMovement.reference || null,
    };
    this.stockMovements.set(id, movement);
    await this.saveMovements();
    
    // Update product quantity
    const product = this.products.get(insertMovement.productId);
    if (product) {
      const newQuantity = insertMovement.type === 'add' 
        ? product.quantity + insertMovement.quantity
        : Math.max(0, product.quantity - insertMovement.quantity);
      
      await this.updateProduct(insertMovement.productId, { quantity: newQuantity });
      
      // Auto-delete product if quantity reaches 0 and it's a removal
      if (newQuantity === 0 && insertMovement.type === 'remove') {
        await this.deleteProduct(insertMovement.productId);
      }
    }
    
    return movement;
  }

  async getStats(): Promise<{
    totalProducts: number;
    totalStock: number;
    lowStock: number;
    outOfStock: number;
  }> {
    const products = Array.from(this.products.values());
    
    return {
      totalProducts: products.length,
      totalStock: products.reduce((sum, p) => sum + p.quantity, 0),
      lowStock: products.filter(p => p.quantity > 0 && p.quantity <= (p.minStock || 5)).length,
      outOfStock: products.filter(p => p.quantity === 0).length,
    };
  }
}

export const storage = new MemStorage();
