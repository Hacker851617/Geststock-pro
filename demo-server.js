const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

// Ensure data directory exists
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Initialize data files with sample data
const productsFile = path.join(dataDir, 'products.json');
const movementsFile = path.join(dataDir, 'movements.json');

// Sample data
const sampleProducts = [
  {
    id: "samsung-s21",
    name: "Samsung Galaxy S21",
    sku: "SM-G991B/DS",
    category: "Électronique",
    quantity: 67,
    minStock: 7,
    description: "Smartphone haut de gamme Samsung Galaxy S21 avec écran 6.2 pouces",
    lastModified: new Date().toISOString()
  },
  {
    id: "hp-laptop",
    name: "Ordinateur portable HP",
    sku: "HP-8GEN-001",
    category: "Électronique",
    quantity: 48,
    minStock: 12,
    description: "Ordinateur portable HP 8ème génération Intel Core i5",
    lastModified: new Date().toISOString()
  }
];

const sampleMovements = [
  {
    id: "move-001",
    productId: "samsung-s21",
    type: "sale",
    quantity: 2,
    price: 599.99,
    reference: "VENTE-001",
    notes: "Vente Samsung Galaxy S21",
    createdAt: new Date().toISOString()
  }
];

if (!fs.existsSync(productsFile)) {
  fs.writeFileSync(productsFile, JSON.stringify(sampleProducts, null, 2));
}
if (!fs.existsSync(movementsFile)) {
  fs.writeFileSync(movementsFile, JSON.stringify(sampleMovements, null, 2));
}

// Helper functions
const readJSON = (filePath) => {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch {
    return [];
  }
};

const writeJSON = (filePath, data) => {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
};

// Routes
app.get('/api/stats', (req, res) => {
  try {
    const products = readJSON(productsFile);
    const movements = readJSON(movementsFile);
    
    const totalProducts = products.length;
    const totalStock = products.reduce((sum, p) => sum + (p.quantity || 0), 0);
    const lowStockProducts = products.filter(p => p.quantity <= p.minStock);
    const recentMovements = movements.filter(m => {
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

app.get('/api/products', (req, res) => {
  try {
    const products = readJSON(productsFile);
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching products' });
  }
});

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

app.get('/api/stock-movements', (req, res) => {
  try {
    const movements = readJSON(movementsFile);
    movements.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    res.json(movements);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching movements' });
  }
});

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
    const productIndex = products.findIndex(p => p.id === req.body.productId);
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

app.get('/', (req, res) => {
  res.json({ 
    message: 'GestStock Pro API - Système de gestion commerciale', 
    status: 'running',
    timestamp: new Date().toISOString(),
    endpoints: [
      'GET /api/stats - Statistiques générales',
      'GET /api/products - Liste des produits',
      'POST /api/products - Ajouter un produit',
      'GET /api/stock-movements - Mouvements de stock',
      'POST /api/stock-movements - Enregistrer un mouvement'
    ]
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ GestStock Pro API running on http://localhost:${PORT}`);
  console.log('📊 Système de gestion de stock commercial avec:');
  console.log('   • Gestion des produits');
  console.log('   • Suivi des mouvements (entrées/sorties/ventes)');
  console.log('   • Alertes de stock faible');
  console.log('   • Interface en français');
  console.log('   • Dates précises pour tous les mouvements');
});