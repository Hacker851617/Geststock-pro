import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 5000;

app.use(cors());
app.use(express.json());

// Ensure data directory exists
const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Initialize data files if they don't exist
const productsFile = path.join(dataDir, 'products.json');
const movementsFile = path.join(dataDir, 'movements.json');

if (!fs.existsSync(productsFile)) {
  fs.writeFileSync(productsFile, JSON.stringify([], null, 2));
}
if (!fs.existsSync(movementsFile)) {
  fs.writeFileSync(movementsFile, JSON.stringify([], null, 2));
}

// Helper functions
const readJSON = (filePath: string) => {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch {
    return [];
  }
};

const writeJSON = (filePath: string, data: any) => {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
};

// Routes

// GET /api/stats
app.get('/api/stats', (req, res) => {
  try {
    const products = readJSON(productsFile);
    const movements = readJSON(movementsFile);
    
    const totalProducts = products.length;
    const totalStock = products.reduce((sum: number, p: any) => sum + (p.quantity || 0), 0);
    const lowStockProducts = products.filter((p: any) => p.quantity <= (p.minStock || 0));
    const recentMovements = movements.filter((m: any) => {
      const moveDate = new Date(m.createdAt);
      const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      return moveDate >= dayAgo;
    });

    res.json({
      totalProducts,
      totalStock,
      lowStockCount: lowStockProducts.length,
      recentMovements: recentMovements.length
    });
  } catch (error) {
    res.status(500).json({ error: 'Error fetching stats' });
  }
});

// GET /api/products
app.get('/api/products', (req, res) => {
  try {
    const products = readJSON(productsFile);
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching products' });
  }
});

// POST /api/products
app.post('/api/products', (req, res) => {
  try {
    const products = readJSON(productsFile);
    const newProduct = {
      ...req.body,
      id: `product_${Date.now()}`,
      lastModified: new Date().toISOString()
    };
    products.push(newProduct);
    writeJSON(productsFile, products);
    res.status(201).json(newProduct);
  } catch (error) {
    res.status(500).json({ error: 'Error creating product' });
  }
});

// PATCH /api/products/:id
app.patch('/api/products/:id', (req, res) => {
  try {
    const products = readJSON(productsFile);
    const productIndex = products.findIndex((p: any) => p.id === req.params.id);
    
    if (productIndex === -1) {
      return res.status(404).json({ error: 'Product not found' });
    }

    products[productIndex] = {
      ...products[productIndex],
      ...req.body,
      lastModified: new Date().toISOString()
    };
    
    writeJSON(productsFile, products);
    res.json(products[productIndex]);
  } catch (error) {
    res.status(500).json({ error: 'Error updating product' });
  }
});

// DELETE /api/products/:id
app.delete('/api/products/:id', (req, res) => {
  try {
    const products = readJSON(productsFile);
    const filteredProducts = products.filter((p: any) => p.id !== req.params.id);
    
    if (products.length === filteredProducts.length) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    writeJSON(productsFile, filteredProducts);
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Error deleting product' });
  }
});

// GET /api/stock-movements
app.get('/api/stock-movements', (req, res) => {
  try {
    const movements = readJSON(movementsFile);
    // Sort by date, most recent first
    movements.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    res.json(movements);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching movements' });
  }
});

// POST /api/stock-movements
app.post('/api/stock-movements', (req, res) => {
  try {
    const movements = readJSON(movementsFile);
    const products = readJSON(productsFile);
    
    const newMovement = {
      ...req.body,
      id: `movement_${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    
    // Update product quantity
    const productIndex = products.findIndex((p: any) => p.id === req.body.productId);
    if (productIndex !== -1) {
      const quantityChange = req.body.type === 'in' || req.body.type === 'purchase' 
        ? req.body.quantity 
        : -req.body.quantity;
      
      products[productIndex].quantity = Math.max(0, 
        (products[productIndex].quantity || 0) + quantityChange
      );
      products[productIndex].lastModified = new Date().toISOString();
      
      writeJSON(productsFile, products);
    }
    
    movements.push(newMovement);
    writeJSON(movementsFile, movements);
    
    res.status(201).json(newMovement);
  } catch (error) {
    res.status(500).json({ error: 'Error creating movement' });
  }
});

// GET /api/export/products
app.get('/api/export/products', (req, res) => {
  try {
    const products = readJSON(productsFile);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=products.csv');
    
    if (products.length === 0) {
      return res.send('');
    }
    
    const headers = Object.keys(products[0]).join(',');
    const rows = products.map((p: any) => 
      Object.values(p).map(v => `"${v}"`).join(',')
    ).join('\n');
    
    res.send(`${headers}\n${rows}`);
  } catch (error) {
    res.status(500).json({ error: 'Error exporting products' });
  }
});

// GET /api/export/movements
app.get('/api/export/movements', (req, res) => {
  try {
    const movements = readJSON(movementsFile);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=movements.csv');
    
    if (movements.length === 0) {
      return res.send('');
    }
    
    const headers = Object.keys(movements[0]).join(',');
    const rows = movements.map((m: any) => 
      Object.values(m).map(v => `"${v}"`).join(',')
    ).join('\n');
    
    res.send(`${headers}\n${rows}`);
  } catch (error) {
    res.status(500).json({ error: 'Error exporting movements' });
  }
});

// Health check
app.get('/', (req, res) => {
  res.json({ 
    message: 'GestStock Pro API', 
    status: 'running',
    timestamp: new Date().toISOString()
  });
});

// Start server
import { createServer } from "http";
import { setupVite, serveStatic } from "./vite"; // ataovy izay hahita an'i vite.ts

const server = createServer(app);

(async () => {
  if (process.env.NODE_ENV !== "production") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

    const PORT = process.env.PORT ? parseInt(process.env.PORT) : 5001;
    ;
  server.listen(PORT, () => {
    console.log(`✅ GestStock Pro API + UI running at http://localhost:${PORT}`);
  });
})();
