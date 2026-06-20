// Common Goods — admin dashboard logic (admin.html)

let editingProductId = null;

function guardAdmin() {
  const user = getStoredUser();
  if (!user || user.role !== 'admin') {
    window.location.href = 'index.html';
  }
  return user;
}

function setView(view) {
  document.getElementById('productsPanel').style.display = view === 'products' ? 'block' : 'none';
  document.getElementById('ordersPanel').style.display = view === 'orders' ? 'block' : 'none';
  document.getElementById('navProducts').classList.toggle('active', view === 'products');
  document.getElementById('navOrders').classList.toggle('active', view === 'orders');
  if (view === 'products') loadAdminProducts();
  if (view === 'orders') loadAdminOrders();
}

// ---------- Products ----------

async function loadAdminProducts() {
  const tbody = document.getElementById('productsTableBody');
  tbody.innerHTML = `<tr><td colspan="6">Loading…</td></tr>`;
  try {
    const { products } = await apiRequest('/products');
    if (products.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6">No products yet. Add the first one.</td></tr>`;
      return;
    }
    tbody.innerHTML = products
      .map(
        (p) => `
      <tr>
        <td>${escapeHtml(p.name)}</td>
        <td>${escapeHtml(p.category || '')}</td>
        <td class="num">${formatMoney(p.price)}</td>
        <td class="num">${p.stock}</td>
        <td>${escapeHtml(p.description || '')}</td>
        <td>
          <button class="btn small secondary" data-edit="${p._id}">Edit</button>
          <button class="btn small danger" data-del="${p._id}">Delete</button>
        </td>
      </tr>`
      )
      .join('');

    tbody.querySelectorAll('[data-edit]').forEach((btn) =>
      btn.addEventListener('click', () => openProductModal(products.find((p) => p._id === btn.dataset.edit)))
    );
    tbody.querySelectorAll('[data-del]').forEach((btn) =>
      btn.addEventListener('click', () => deleteProduct(btn.dataset.del))
    );
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="6">Could not load products: ${err.message}</td></tr>`;
  }
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function openProductModal(product) {
  editingProductId = product ? product._id : null;
  document.getElementById('productModalTitle').textContent = product ? 'Edit product' : 'Add product';
  document.getElementById('pName').value = product ? product.name : '';
  document.getElementById('pCategory').value = product ? product.category : '';
  document.getElementById('pPrice').value = product ? product.price : '';
  document.getElementById('pStock').value = product ? product.stock : '';
  document.getElementById('pDescription').value = product ? product.description : '';
  document.getElementById('productError').classList.remove('show');
  document.getElementById('productModalOverlay').classList.add('open');
}
function closeProductModal() {
  document.getElementById('productModalOverlay').classList.remove('open');
}

async function handleProductSubmit(e) {
  e.preventDefault();
  const body = {
    name: document.getElementById('pName').value.trim(),
    category: document.getElementById('pCategory').value.trim() || 'General',
    price: parseFloat(document.getElementById('pPrice').value),
    stock: parseInt(document.getElementById('pStock').value, 10),
    description: document.getElementById('pDescription').value.trim(),
  };
  const errBox = document.getElementById('productError');

  try {
    if (editingProductId) {
      await apiRequest(`/products/${editingProductId}`, { method: 'PUT', body });
      showToast('Product updated.');
    } else {
      await apiRequest('/products', { method: 'POST', body });
      showToast('Product added.');
    }
    closeProductModal();
    loadAdminProducts();
  } catch (err) {
    errBox.textContent = err.message;
    errBox.classList.add('show');
  }
}

async function deleteProduct(id) {
  if (!confirm('Delete this product? This cannot be undone.')) return;
  try {
    await apiRequest(`/products/${id}`, { method: 'DELETE' });
    showToast('Product deleted.');
    loadAdminProducts();
  } catch (err) {
    showToast(err.message);
  }
}

// ---------- Orders ----------

const STATUSES = ['pending', 'paid', 'shipped', 'completed', 'cancelled'];

async function loadAdminOrders() {
  const tbody = document.getElementById('ordersTableBody');
  tbody.innerHTML = `<tr><td colspan="6">Loading…</td></tr>`;
  try {
    const { orders } = await apiRequest('/orders');
    if (orders.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6">No orders yet.</td></tr>`;
      return;
    }
    tbody.innerHTML = orders
      .map(
        (o) => `
      <tr>
        <td class="mono">${o._id.slice(-8).toUpperCase()}</td>
        <td>${escapeHtml(o.user ? o.user.name : 'Unknown')}</td>
        <td>${o.items.reduce((s, i) => s + i.quantity, 0)} item(s)</td>
        <td class="num">${formatMoney(o.totalAmount)}</td>
        <td><span class="status-badge status-${o.status}">${o.status}</span></td>
        <td>
          <select data-status="${o._id}">
            ${STATUSES.map((s) => `<option value="${s}" ${s === o.status ? 'selected' : ''}>${s}</option>`).join('')}
          </select>
        </td>
      </tr>`
      )
      .join('');

    tbody.querySelectorAll('[data-status]').forEach((select) =>
      select.addEventListener('change', () => updateOrderStatus(select.dataset.status, select.value))
    );
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="6">Could not load orders: ${err.message}</td></tr>`;
  }
}

async function updateOrderStatus(id, status) {
  try {
    await apiRequest(`/orders/${id}/status`, { method: 'PUT', body: { status } });
    showToast('Order status updated.');
    loadAdminOrders();
  } catch (err) {
    showToast(err.message);
  }
}

// ---------- Wire up ----------

document.addEventListener('DOMContentLoaded', () => {
  const user = guardAdmin();
  if (!user) return;
  document.getElementById('adminUserName').textContent = user.name;

  document.getElementById('navProducts').addEventListener('click', () => setView('products'));
  document.getElementById('navOrders').addEventListener('click', () => setView('orders'));
  document.getElementById('addProductBtn').addEventListener('click', () => openProductModal(null));
  document.getElementById('productModalClose').addEventListener('click', closeProductModal);
  document.getElementById('productForm').addEventListener('submit', handleProductSubmit);
  document.getElementById('logoutBtnAdmin').addEventListener('click', () => {
    clearSession();
    window.location.href = 'index.html';
  });

  setView('products');
});
