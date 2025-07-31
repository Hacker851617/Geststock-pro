
import React, { useState, useEffect } from 'react';
import './App.css';

interface Product {
  id: string;
  name: string;
  sku?: string;
  category: string;
  quantity: number;
  minStock: number;
  description?: string;
  lastModified: string;
}

interface StockMovement {
  id: string;
  productId: string;
  type: 'in' | 'out' | 'purchase' | 'sale' | 'adjustment';
  quantity: number;
  reason?: string;
  createdAt: string;
}

interface Stats {
  totalProducts: number;
  totalStock: number;
  lowStockCount: number;
  recentMovements: number;
}

const API_BASE = 'http://localhost:5001/api';

function GestStockApp() {
  const [products, setProducts] = useState<Product[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(false);

  // Formulaires
  const [newProduct, setNewProduct] = useState({
    name: '',
    sku: '',
    category: '',
    quantity: 0,
    minStock: 5,
    description: ''
  });

  const [newMovement, setNewMovement] = useState({
    productId: '',
    type: 'in' as const,
    quantity: 0,
    reason: ''
  });

  // Charger les données
  const fetchData = async () => {
    setLoading(true);
    try {
      const [productsRes, movementsRes, statsRes] = await Promise.all([
        fetch(`${API_BASE}/products`),
        fetch(`${API_BASE}/stock-movements`),
        fetch(`${API_BASE}/stats`)
      ]);

      if (productsRes.ok) setProducts(await productsRes.json());
      if (movementsRes.ok) setMovements(await movementsRes.json());
      if (statsRes.ok) setStats(await statsRes.json());
    } catch (error) {
      console.error('Erreur lors du chargement:', error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Ajouter un produit
  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_BASE}/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProduct)
      });

      if (response.ok) {
        setNewProduct({ name: '', sku: '', category: '', quantity: 0, minStock: 5, description: '' });
        fetchData();
      }
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  // Ajouter un mouvement
  const handleAddMovement = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_BASE}/stock-movements`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newMovement)
      });

      if (response.ok) {
        setNewMovement({ productId: '', type: 'in', quantity: 0, reason: '' });
        fetchData();
      }
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>🏪 GestStock Pro</h1>
        <nav>
          <button 
            className={activeTab === 'dashboard' ? 'active' : ''}
            onClick={() => setActiveTab('dashboard')}
          >
            📊 Tableau de bord
          </button>
          <button 
            className={activeTab === 'products' ? 'active' : ''}
            onClick={() => setActiveTab('products')}
          >
            📦 Produits
          </button>
          <button 
            className={activeTab === 'movements' ? 'active' : ''}
            onClick={() => setActiveTab('movements')}
          >
            📈 Mouvements
          </button>
        </nav>
      </header>

      <main className="app-main">
        {loading && <div className="loading">Chargement...</div>}

        {activeTab === 'dashboard' && (
          <div className="dashboard">
            <h2>📊 Tableau de Bord</h2>
            {stats && (
              <div className="stats-grid">
                <div className="stat-card">
                  <h3>Produits</h3>
                  <div className="stat-value">{stats.totalProducts}</div>
                </div>
                <div className="stat-card">
                  <h3>Stock Total</h3>
                  <div className="stat-value">{stats.totalStock}</div>
                </div>
                <div className="stat-card">
                  <h3>Stock Faible</h3>
                  <div className="stat-value">{stats.lowStockCount}</div>
                </div>
                <div className="stat-card">
                  <h3>Mouvements (24h)</h3>
                  <div className="stat-value">{stats.recentMovements}</div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'products' && (
          <div className="products">
            <h2>📦 Gestion des Produits</h2>
            
            <form onSubmit={handleAddProduct} className="product-form">
              <h3>Ajouter un produit</h3>
              <div className="form-row">
                <input
                  type="text"
                  placeholder="Nom du produit"
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                  required
                />
                <input
                  type="text"
                  placeholder="SKU"
                  value={newProduct.sku}
                  onChange={(e) => setNewProduct({...newProduct, sku: e.target.value})}
                />
              </div>
              <div className="form-row">
                <select
                  value={newProduct.category}
                  onChange={(e) => setNewProduct({...newProduct, category: e.target.value})}
                  required
                >
                  <option value="">Sélectionner une catégorie</option>
                  <option value="electronique">Électronique</option>
                  <option value="vetement">Vêtement</option>
                  <option value="alimentaire">Alimentaire</option>
                  <option value="autres">Autres</option>
                </select>
                <input
                  type="number"
                  placeholder="Quantité"
                  value={newProduct.quantity}
                  onChange={(e) => setNewProduct({...newProduct, quantity: parseInt(e.target.value)})}
                  required
                />
                <input
                  type="number"
                  placeholder="Stock minimum"
                  value={newProduct.minStock}
                  onChange={(e) => setNewProduct({...newProduct, minStock: parseInt(e.target.value)})}
                />
              </div>
              <textarea
                placeholder="Description"
                value={newProduct.description}
                onChange={(e) => setNewProduct({...newProduct, description: e.target.value})}
              />
              <button type="submit">Ajouter</button>
            </form>

            <div className="products-list">
              <h3>Liste des produits</h3>
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Nom</th>
                      <th>SKU</th>
                      <th>Catégorie</th>
                      <th>Stock</th>
                      <th>Min</th>
                      <th>Statut</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map(product => (
                      <tr key={product.id} className={product.quantity <= product.minStock ? 'low-stock' : ''}>
                        <td>{product.name}</td>
                        <td>{product.sku}</td>
                        <td>{product.category}</td>
                        <td>{product.quantity}</td>
                        <td>{product.minStock}</td>
                        <td>
                          {product.quantity <= product.minStock ? (
                            <span className="status low">⚠️ Stock faible</span>
                          ) : (
                            <span className="status ok">✅ OK</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'movements' && (
          <div className="movements">
            <h2>📈 Mouvements de Stock</h2>
            
            <form onSubmit={handleAddMovement} className="movement-form">
              <h3>Enregistrer un mouvement</h3>
              <div className="form-row">
                <select
                  value={newMovement.productId}
                  onChange={(e) => setNewMovement({...newMovement, productId: e.target.value})}
                  required
                >
                  <option value="">Sélectionner un produit</option>
                  {products.map(product => (
                    <option key={product.id} value={product.id}>{product.name}</option>
                  ))}
                </select>
                <select
                  value={newMovement.type}
                  onChange={(e) => setNewMovement({...newMovement, type: e.target.value as any})}
                  required
                >
                  <option value="in">Entrée</option>
                  <option value="out">Sortie</option>
                  <option value="purchase">Achat</option>
                  <option value="sale">Vente</option>
                  <option value="adjustment">Ajustement</option>
                </select>
              </div>
              <div className="form-row">
                <input
                  type="number"
                  placeholder="Quantité"
                  value={newMovement.quantity}
                  onChange={(e) => setNewMovement({...newMovement, quantity: parseInt(e.target.value)})}
                  required
                />
                <input
                  type="text"
                  placeholder="Motif"
                  value={newMovement.reason}
                  onChange={(e) => setNewMovement({...newMovement, reason: e.target.value})}
                />
              </div>
              <button type="submit">Enregistrer</button>
            </form>

            <div className="movements-list">
              <h3>Historique des mouvements</h3>
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Produit</th>
                      <th>Type</th>
                      <th>Quantité</th>
                      <th>Motif</th>
                    </tr>
                  </thead>
                  <tbody>
                    {movements.map(movement => {
                      const product = products.find(p => p.id === movement.productId);
                      return (
                        <tr key={movement.id}>
                          <td>{new Date(movement.createdAt).toLocaleDateString()}</td>
                          <td>{product?.name || 'Produit supprimé'}</td>
                          <td>
                            <span className={`movement-type ${movement.type}`}>
                              {movement.type === 'in' ? '📥 Entrée' :
                               movement.type === 'out' ? '📤 Sortie' :
                               movement.type === 'purchase' ? '🛒 Achat' :
                               movement.type === 'sale' ? '💰 Vente' : '⚖️ Ajustement'}
                            </span>
                          </td>
                          <td>{movement.quantity}</td>
                          <td>{movement.reason}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default GestStockApp;
