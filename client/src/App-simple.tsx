import React, { useState, useEffect } from 'react';

interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  quantity: number;
  minStock: number;
  description?: string;
  lastModified: string;
}

interface Movement {
  id: string;
  productId: string;
  productName?: string;
  type: 'in' | 'out' | 'sale' | 'purchase' | 'adjustment';
  quantity: number;
  price?: number;
  reference?: string;
  notes?: string;
  createdAt: string;
}

interface Stats {
  totalProducts: number;
  totalStock: number;
  lowStockCount: number;
  recentMovements: number;
}

const API_BASE = 'http://localhost:5000/api';

function GestStockApp() {
  const [products, setProducts] = useState<Product[]>([]);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [currentPage, setCurrentPage] = useState<'dashboard' | 'products' | 'movements' | 'reports'>('dashboard');
  const [loading, setLoading] = useState(false);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [showAddMovement, setShowAddMovement] = useState(false);

  // Fetch data functions
  const fetchStats = async () => {
    try {
      const response = await fetch(`${API_BASE}/stats`);
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Erreur lors du chargement des statistiques:', error);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await fetch(`${API_BASE}/products`);
      const data = await response.json();
      setProducts(data);
    } catch (error) {
      console.error('Erreur lors du chargement des produits:', error);
    }
  };

  const fetchMovements = async () => {
    try {
      const response = await fetch(`${API_BASE}/stock-movements`);
      const data = await response.json();
      // Enrich movements with product names
      const enrichedMovements = data.map((movement: Movement) => {
        const product = products.find(p => p.id === movement.productId);
        return {
          ...movement,
          productName: product?.name || 'Produit inconnu'
        };
      });
      setMovements(enrichedMovements);
    } catch (error) {
      console.error('Erreur lors du chargement des mouvements:', error);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchProducts();
  }, []);

  useEffect(() => {
    if (products.length > 0) {
      fetchMovements();
    }
  }, [products]);

  const addProduct = async (productData: Omit<Product, 'id' | 'lastModified'>) => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData)
      });
      if (response.ok) {
        await fetchProducts();
        await fetchStats();
        setShowAddProduct(false);
      }
    } catch (error) {
      console.error('Erreur lors de l\'ajout du produit:', error);
    } finally {
      setLoading(false);
    }
  };

  const addMovement = async (movementData: Omit<Movement, 'id' | 'createdAt'>) => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/stock-movements`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(movementData)
      });
      if (response.ok) {
        await fetchProducts();
        await fetchMovements();
        await fetchStats();
        setShowAddMovement(false);
      }
    } catch (error) {
      console.error('Erreur lors de l\'ajout du mouvement:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getMovementTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'in': 'Entrée',
      'out': 'Sortie',
      'sale': 'Vente',
      'purchase': 'Achat',
      'adjustment': 'Ajustement'
    };
    return labels[type] || type;
  };

  const getMovementTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      'in': 'text-green-600 bg-green-100',
      'purchase': 'text-green-600 bg-green-100',
      'out': 'text-red-600 bg-red-100',
      'sale': 'text-blue-600 bg-blue-100',
      'adjustment': 'text-yellow-600 bg-yellow-100'
    };
    return colors[type] || 'text-gray-600 bg-gray-100';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-blue-600">GestStock Pro</h1>
            </div>
            <div className="flex space-x-4">
              {['dashboard', 'products', 'movements', 'reports'].map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page as any)}
                  className={`px-4 py-2 rounded-md font-medium ${
                    currentPage === page
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {page === 'dashboard' && 'Tableau de bord'}
                  {page === 'products' && 'Produits'}
                  {page === 'movements' && 'Mouvements'}
                  {page === 'reports' && 'Rapports'}
                </button>
              ))}
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Dashboard */}
        {currentPage === 'dashboard' && (
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Tableau de bord</h2>
            
            {/* Stats Cards */}
            {stats && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-white p-6 rounded-lg shadow">
                  <h3 className="text-sm font-medium text-gray-500">Total Produits</h3>
                  <p className="text-3xl font-bold text-gray-900">{stats.totalProducts}</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow">
                  <h3 className="text-sm font-medium text-gray-500">Stock Total</h3>
                  <p className="text-3xl font-bold text-gray-900">{stats.totalStock}</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow">
                  <h3 className="text-sm font-medium text-gray-500">Alertes Stock Faible</h3>
                  <p className="text-3xl font-bold text-red-600">{stats.lowStockCount}</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow">
                  <h3 className="text-sm font-medium text-gray-500">Mouvements Récents</h3>
                  <p className="text-3xl font-bold text-blue-600">{stats.recentMovements}</p>
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="bg-white p-6 rounded-lg shadow mb-8">
              <h3 className="text-lg font-semibold mb-4">Actions rapides</h3>
              <div className="flex space-x-4">
                <button
                  onClick={() => setShowAddProduct(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                >
                  Ajouter un produit
                </button>
                <button
                  onClick={() => setShowAddMovement(true)}
                  className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
                >
                  Nouveau mouvement
                </button>
              </div>
            </div>

            {/* Recent Products */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b">
                <h3 className="text-lg font-semibold">Produits récents</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nom</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {products.slice(0, 5).map((product) => (
                      <tr key={product.id}>
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">{product.name}</td>
                        <td className="px-6 py-4 text-sm text-gray-500">{product.sku}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">{product.quantity}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            product.quantity <= product.minStock
                              ? 'bg-red-100 text-red-800'
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {product.quantity <= product.minStock ? 'Stock faible' : 'OK'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Products Page */}
        {currentPage === 'products' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-3xl font-bold text-gray-900">Gestion des Produits</h2>
              <button
                onClick={() => setShowAddProduct(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              >
                Ajouter un produit
              </button>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nom</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Catégorie</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock Min</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dernière Modif</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {products.map((product) => (
                    <tr key={product.id}>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{product.name}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{product.sku}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{product.category}</td>
                      <td className={`px-6 py-4 text-sm font-medium ${
                        product.quantity <= product.minStock ? 'text-red-600' : 'text-gray-900'
                      }`}>
                        {product.quantity}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">{product.minStock}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{formatDate(product.lastModified)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Movements Page */}
        {currentPage === 'movements' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-3xl font-bold text-gray-900">Mouvements de Stock</h2>
              <button
                onClick={() => setShowAddMovement(true)}
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
              >
                Nouveau mouvement
              </button>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Produit</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantité</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Prix</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Référence</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {movements.map((movement) => (
                    <tr key={movement.id}>
                      <td className="px-6 py-4 text-sm text-gray-900">{formatDate(movement.createdAt)}</td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{movement.productName}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-xs rounded-full ${getMovementTypeColor(movement.type)}`}>
                          {getMovementTypeLabel(movement.type)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">{movement.quantity}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {movement.price ? `${movement.price}€` : '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">{movement.reference || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Reports Page */}
        {currentPage === 'reports' && (
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Rapports et Alertes</h2>
            
            {/* Low Stock Alert */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h3 className="text-lg font-semibold text-red-600 mb-4">⚠️ Alertes Stock Faible</h3>
              <div className="space-y-2">
                {products.filter(p => p.quantity <= p.minStock).map((product) => (
                  <div key={product.id} className="flex justify-between items-center p-3 bg-red-50 rounded-md">
                    <div>
                      <span className="font-medium">{product.name}</span>
                      <span className="text-sm text-gray-500 ml-2">({product.sku})</span>
                    </div>
                    <div className="text-right">
                      <div className="text-red-600 font-medium">Stock: {product.quantity}</div>
                      <div className="text-sm text-gray-500">Min: {product.minStock}</div>
                    </div>
                  </div>
                ))}
                {products.filter(p => p.quantity <= p.minStock).length === 0 && (
                  <p className="text-gray-500">Aucune alerte de stock faible</p>
                )}
              </div>
            </div>

            {/* Export Options */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">Exporter les données</h3>
              <div className="flex space-x-4">
                <a
                  href={`${API_BASE}/export/products`}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 inline-block"
                >
                  Exporter Produits (CSV)
                </a>
                <a
                  href={`${API_BASE}/export/movements`}
                  className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 inline-block"
                >
                  Exporter Mouvements (CSV)
                </a>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add Product Modal */}
      {showAddProduct && (
        <ProductModal
          onClose={() => setShowAddProduct(false)}
          onSave={addProduct}
          loading={loading}
        />
      )}

      {/* Add Movement Modal */}
      {showAddMovement && (
        <MovementModal
          products={products}
          onClose={() => setShowAddMovement(false)}
          onSave={addMovement}
          loading={loading}
        />
      )}
    </div>
  );
}

// Product Modal Component
function ProductModal({ onClose, onSave, loading }: {
  onClose: () => void;
  onSave: (data: any) => void;
  loading: boolean;
}) {
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    category: '',
    quantity: 0,
    minStock: 0,
    description: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold mb-4">Ajouter un nouveau produit</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Nom du produit"
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            className="w-full p-2 border rounded-md"
            required
          />
          <input
            type="text"
            placeholder="SKU"
            value={formData.sku}
            onChange={(e) => setFormData({...formData, sku: e.target.value})}
            className="w-full p-2 border rounded-md"
            required
          />
          <input
            type="text"
            placeholder="Catégorie"
            value={formData.category}
            onChange={(e) => setFormData({...formData, category: e.target.value})}
            className="w-full p-2 border rounded-md"
            required
          />
          <input
            type="number"
            placeholder="Quantité initiale"
            value={formData.quantity}
            onChange={(e) => setFormData({...formData, quantity: parseInt(e.target.value) || 0})}
            className="w-full p-2 border rounded-md"
            min="0"
          />
          <input
            type="number"
            placeholder="Stock minimum"
            value={formData.minStock}
            onChange={(e) => setFormData({...formData, minStock: parseInt(e.target.value) || 0})}
            className="w-full p-2 border rounded-md"
            min="0"
          />
          <textarea
            placeholder="Description (optionnel)"
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
            className="w-full p-2 border rounded-md"
            rows={3}
          />
          <div className="flex space-x-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-600 border rounded-md hover:bg-gray-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Ajout...' : 'Ajouter'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Movement Modal Component
function MovementModal({ products, onClose, onSave, loading }: {
  products: Product[];
  onClose: () => void;
  onSave: (data: any) => void;
  loading: boolean;
}) {
  const [formData, setFormData] = useState({
    productId: '',
    type: 'in' as const,
    quantity: 0,
    price: 0,
    reference: '',
    notes: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      price: formData.price || undefined
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold mb-4">Nouveau mouvement de stock</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <select
            value={formData.productId}
            onChange={(e) => setFormData({...formData, productId: e.target.value})}
            className="w-full p-2 border rounded-md"
            required
          >
            <option value="">Sélectionner un produit</option>
            {products.map((product) => (
              <option key={product.id} value={product.id}>
                {product.name} ({product.sku})
              </option>
            ))}
          </select>
          <select
            value={formData.type}
            onChange={(e) => setFormData({...formData, type: e.target.value as any})}
            className="w-full p-2 border rounded-md"
          >
            <option value="in">Entrée</option>
            <option value="out">Sortie</option>
            <option value="sale">Vente</option>
            <option value="purchase">Achat</option>
            <option value="adjustment">Ajustement</option>
          </select>
          <input
            type="number"
            placeholder="Quantité"
            value={formData.quantity}
            onChange={(e) => setFormData({...formData, quantity: parseInt(e.target.value) || 0})}
            className="w-full p-2 border rounded-md"
            min="1"
            required
          />
          <input
            type="number"
            placeholder="Prix unitaire (optionnel)"
            value={formData.price}
            onChange={(e) => setFormData({...formData, price: parseFloat(e.target.value) || 0})}
            className="w-full p-2 border rounded-md"
            step="0.01"
            min="0"
          />
          <input
            type="text"
            placeholder="Référence (optionnel)"
            value={formData.reference}
            onChange={(e) => setFormData({...formData, reference: e.target.value})}
            className="w-full p-2 border rounded-md"
          />
          <textarea
            placeholder="Notes (optionnel)"
            value={formData.notes}
            onChange={(e) => setFormData({...formData, notes: e.target.value})}
            className="w-full p-2 border rounded-md"
            rows={2}
          />
          <div className="flex space-x-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-600 border rounded-md hover:bg-gray-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? 'Ajout...' : 'Ajouter'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default GestStockApp;