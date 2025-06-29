import { templateCard } from './components/card.js';
import { searchProducts } from './api/index.js';

const CART_STORAGE_KEY = 'isteaShopCart';

function initApp() {
    templateCard();

    updateCartCounter();
    initCartEvents();
    
    initSearch();
}

function initSearch() {
    const searchInput = document.getElementById('search-input');
    if (!searchInput) return;
    
    let debounceTimeout;
    
    searchInput.addEventListener('input', () => {
        clearTimeout(debounceTimeout);
        debounceTimeout = setTimeout(() => {
            const searchTerm = searchInput.value.trim();
            
            searchProducts(searchTerm)
                .then(products => {
                    const container = document.querySelector("#listado-productos");
                    container.innerHTML = '';
                    
                    if (products.length === 0) {
                        container.innerHTML = '<div class="col-12 text-center">No se encontraron productos que coincidan con la búsqueda</div>';
                        return;
                    }
                    
                    products.forEach((product) => {
                        let template = `
                        <div class="col">
                            <div class="card h-100">
                                <img src="${product.img || 'https://via.placeholder.com/300'}" class="card-img-top" alt="${product.name}">
                                <div class="card-body">
                                    <h5 class="card-title">${product.name}</h5>
                                    <p class="card-text text-truncate">${product.description}</p>
                                    <div class="d-flex justify-content-between align-items-center">
                                        <strong class="text-primary">$${product.price}</strong>
                                        <button type="button" class="btn btn-outline-primary view-details" data-id="${product.id}">
                                            Ver detalles
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>`;
                        
                        container.innerHTML += template;
                    });
                    
                    document.querySelectorAll('.view-details').forEach(button => {
                        button.addEventListener('click', function() {
                            const productId = this.getAttribute('data-id');
                            showProductDetails(productId);
                        });
                    });
                });
        }, 300);
    });
}

function initCartEvents() {
    const cartButton = document.getElementById('cart-button');
    if (cartButton) {
        cartButton.addEventListener('click', () => {
            showCart();
        });
    }
    
    const clearCartBtn = document.getElementById('clear-cart-btn');
    if (clearCartBtn) {
        clearCartBtn.addEventListener('click', () => {
            clearCart();
        });
    }
    
    const checkoutBtn = document.getElementById('checkout-btn');
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', () => {
            checkout();
        });
    }
    
    updateCartButtonsState();
}

function updateCartButtonsState() {
    const cart = getCartFromStorage();
    const clearCartBtn = document.getElementById('clear-cart-btn');
    const checkoutBtn = document.getElementById('checkout-btn');
    
    if (clearCartBtn) {
        clearCartBtn.disabled = cart.length === 0;
    }
    
    if (checkoutBtn) {
        checkoutBtn.disabled = cart.length === 0;
    }
}

let cartSidebarInstance = null;

function showCart(forceReopen = false) {
    const cart = getCartFromStorage();
    const cartItemsContainer = document.getElementById('cart-items');
    let totalPrice = 0;
    
    if (!cartItemsContainer) return;
    
    cartItemsContainer.innerHTML = '';
    
    const clearCartBtn = document.getElementById('clear-cart-btn');
    const checkoutBtn = document.getElementById('checkout-btn');
    
    if (cart.length === 0) {
        cartItemsContainer.innerHTML = '<p class="text-center text-muted">El carrito está vacío</p>';
        
        if (clearCartBtn) clearCartBtn.disabled = true;
        if (checkoutBtn) checkoutBtn.disabled = true;
    } else {
        if (clearCartBtn) clearCartBtn.disabled = false;
        if (checkoutBtn) checkoutBtn.disabled = false;
        
        cart.forEach((item, index) => {
            const itemTotal = item.price * item.quantity;
            totalPrice += itemTotal;
            
            const itemElement = document.createElement('div');
            itemElement.className = 'card mb-3';
            itemElement.innerHTML = `
                <div class="card-body">
                    <div class="d-flex">
                        <div class="cart-item-image me-3">
                            <img src="${item.image || 'https://via.placeholder.com/80'}" alt="${item.name}" class="img-thumbnail" style="width: 80px; height: 80px; object-fit: cover;">
                        </div>
                        <div class="flex-grow-1">
                            <div class="d-flex justify-content-between align-items-start mb-2">
                                <h6 class="card-title mb-0">${item.name}</h6>
                                <button class="btn btn-sm btn-outline-danger remove-item" data-index="${index}">
                                    <i class="bi bi-trash"></i>
                                </button>
                            </div>
                            <p class="card-text text-muted small mb-2">Precio: $${item.price}</p>
                            <div class="d-flex align-items-center justify-content-between">
                                <div class="input-group input-group-sm" style="max-width: 120px;">
                                    <button class="btn btn-outline-secondary decrease-quantity" data-index="${index}" ${item.quantity <= 1 ? 'disabled' : ''}>-</button>
                                    <span class="input-group-text bg-white" style="width: 40px; text-align: center;">${item.quantity}</span>
                                    <button class="btn btn-outline-secondary increase-quantity" data-index="${index}">+</button>
                                </div>
                                <strong>$${itemTotal}</strong>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            cartItemsContainer.appendChild(itemElement);
        });
        
        const cartItemsDiv = document.getElementById('cart-items');
        if (cartItemsDiv) {
            const newCartItemsDiv = cartItemsDiv.cloneNode(true);
            cartItemsDiv.parentNode.replaceChild(newCartItemsDiv, cartItemsDiv);
            
            newCartItemsDiv.addEventListener('click', function(e) {
                if (e.target.closest('.decrease-quantity')) {
                    const button = e.target.closest('.decrease-quantity');
                    const index = parseInt(button.getAttribute('data-index'));
                    decreaseItemQuantity(index);
                } else if (e.target.closest('.increase-quantity')) {
                    const button = e.target.closest('.increase-quantity');
                    const index = parseInt(button.getAttribute('data-index'));
                    increaseItemQuantity(index);
                } else if (e.target.closest('.remove-item')) {
                    const button = e.target.closest('.remove-item');
                    const index = parseInt(button.getAttribute('data-index'));
                    removeCartItem(index);
                }
            });
        }
    }
    
    document.getElementById('cart-total').textContent = totalPrice;
    
    const cartSidebarElement = document.getElementById('cart-sidebar');

    if (forceReopen || !cartSidebarInstance) {
        if (cartSidebarInstance) {
            cartSidebarInstance.dispose();
            
            const backdrops = document.querySelectorAll('.offcanvas-backdrop');
            backdrops.forEach(backdrop => {
                backdrop.remove();
            });
            
            document.body.classList.remove('offcanvas-open');
            document.body.style.overflow = '';
            document.body.style.paddingRight = '';
        }
        
        cartSidebarInstance = new bootstrap.Offcanvas(cartSidebarElement);
        
        cartSidebarElement.addEventListener('hidden.bs.offcanvas', function () {

            setTimeout(() => {
                const backdrops = document.querySelectorAll('.offcanvas-backdrop');
                backdrops.forEach(backdrop => backdrop.remove());
                document.body.style.overflow = '';
                document.body.style.paddingRight = '';
            }, 300);
        }, { once: true });
    }
    
    cartSidebarInstance.show();
}

function getCartFromStorage() {
    const cartJson = localStorage.getItem(CART_STORAGE_KEY);
    return cartJson ? JSON.parse(cartJson) : [];
}

function saveCartToStorage(cart) {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    updateCartCounter();
    updateCartButtonsState();
}

function updateCartCounter() {
    const counter = document.getElementById('cart-counter');
    if (!counter) return;
    
    const cart = getCartFromStorage();
    const itemCount = cart.reduce((total, item) => total + item.quantity, 0);
    
    counter.textContent = itemCount;
    counter.style.display = itemCount > 0 ? 'inline-block' : 'none';
}

function addToCart(product, quantity = 1) {
    const cart = getCartFromStorage();
    
    const existingItemIndex = cart.findIndex(item => item.id === product.id);
    
    if (existingItemIndex >= 0) {

        cart[existingItemIndex].quantity += quantity;
    } else {

        cart.push({
            id: product.id,
            name: product.name,
            price: product.price,
            image: product.img,
            quantity: quantity
        });
    }
    
    saveCartToStorage(cart);
    updateCartCounter();
}

function removeCartItem(index) {
    const cart = getCartFromStorage();
    
    if (index >= 0 && index < cart.length) {
        cart.splice(index, 1);
        saveCartToStorage(cart);
        updateCartView();
    }
}

function increaseItemQuantity(index) {
    const cart = getCartFromStorage();
    
    if (index >= 0 && index < cart.length) {
        cart[index].quantity += 1;
        saveCartToStorage(cart);
        updateCartView();
    }
}

function decreaseItemQuantity(index) {
    const cart = getCartFromStorage();
    
    if (index >= 0 && index < cart.length && cart[index].quantity > 1) {
        cart[index].quantity -= 1;
        saveCartToStorage(cart);
        updateCartView();
    }
}

function updateCartView() {
    const cart = getCartFromStorage();
    const cartItemsContainer = document.getElementById('cart-items');
    let totalPrice = 0;
    
    if (!cartItemsContainer) return;
    
    cartItemsContainer.innerHTML = '';
    
    const clearCartBtn = document.getElementById('clear-cart-btn');
    const checkoutBtn = document.getElementById('checkout-btn');
    
    if (cart.length === 0) {
        cartItemsContainer.innerHTML = '<p class="text-center text-muted">El carrito está vacío</p>';
        
        if (clearCartBtn) clearCartBtn.disabled = true;
        if (checkoutBtn) checkoutBtn.disabled = true;
    } else {
        if (clearCartBtn) clearCartBtn.disabled = false;
        if (checkoutBtn) checkoutBtn.disabled = false;
        
        cart.forEach((item, index) => {
            const itemTotal = item.price * item.quantity;
            totalPrice += itemTotal;
            
            const itemElement = document.createElement('div');
            itemElement.className = 'card mb-3';
            itemElement.innerHTML = `
                <div class="card-body">
                    <div class="d-flex">
                        <div class="cart-item-image me-3">
                            <img src="${item.image || 'https://via.placeholder.com/80'}" alt="${item.name}" class="img-thumbnail" style="width: 80px; height: 80px; object-fit: cover;">
                        </div>
                        <div class="flex-grow-1">
                            <div class="d-flex justify-content-between align-items-start mb-2">
                                <h6 class="card-title mb-0">${item.name}</h6>
                                <button class="btn btn-sm btn-outline-danger remove-item" data-index="${index}">
                                    <i class="bi bi-trash"></i>
                                </button>
                            </div>
                            <p class="card-text text-muted small mb-2">Precio: $${item.price}</p>
                            <div class="d-flex align-items-center justify-content-between">
                                <div class="input-group input-group-sm" style="max-width: 120px;">
                                    <button class="btn btn-outline-secondary decrease-quantity" data-index="${index}" ${item.quantity <= 1 ? 'disabled' : ''}>-</button>
                                    <span class="input-group-text bg-white" style="width: 40px; text-align: center;">${item.quantity}</span>
                                    <button class="btn btn-outline-secondary increase-quantity" data-index="${index}">+</button>
                                </div>
                                <strong>$${itemTotal}</strong>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            cartItemsContainer.appendChild(itemElement);
        });
    }
    
    document.getElementById('cart-total').textContent = totalPrice;
}

function clearCart() {
    const cart = getCartFromStorage();
    
    if (cart.length === 0) {
        showNotification('El carrito ya está vacío');
        return;
    }

    saveCartToStorage([]);
    updateCartView();
    showNotification('Carrito vaciado');
}

function checkout() {
    const cart = getCartFromStorage();
    
    if (cart.length === 0) {
        showNotification('El carrito está vacío');
        return;
    }
    
    const totalCompra = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    
    saveCartToStorage([]);
    
    if (cartSidebarInstance) {
        cartSidebarInstance.hide();
        
        setTimeout(() => {
            cartSidebarInstance = null;
            
            const backdrops = document.querySelectorAll('.offcanvas-backdrop');
            backdrops.forEach(backdrop => {
                backdrop.remove();
            });
            
            document.body.classList.remove('offcanvas-open');
            document.body.style.overflow = '';
            document.body.style.paddingRight = '';
            
            Swal.fire({
                title: '¡Compra Finalizada!',
                text: `Gracias por tu compra de $${totalCompra}. Tu pedido ha sido procesado correctamente.`,
                icon: 'success',
                confirmButtonText: 'Continuar',
                confirmButtonColor: '#28a745',
                timer: 5000,
                timerProgressBar: true
            });
        }, 500);
    } else {
        updateCartCounter();
        
        Swal.fire({
            title: '¡Compra Finalizada!',
            text: `Gracias por tu compra de $${totalCompra}. Tu pedido ha sido procesado correctamente.`,
            icon: 'success',
            confirmButtonText: 'Continuar',
            confirmButtonColor: '#28a745',
            timer: 5000,
            timerProgressBar: true
        });
    }
}

function showNotification(message) {
    const toastEl = document.getElementById('notification-toast');
    if (!toastEl) return;
    
    const existingToast = bootstrap.Toast.getInstance(toastEl);
    if (existingToast) {
        existingToast.dispose();
    }
    
    const toast = new bootstrap.Toast(toastEl, {
        delay: 3000,
        autohide: true
    });
    
    const toastBody = document.querySelector('.toast-body');
    if (toastBody) {
        toastBody.textContent = message;
    }
    
    toast.show();
}

async function showProductDetails(productId) {
    try {
        const products = await searchProducts();
        const product = products.find(p => p.id === productId);
        
        if (!product) {
            console.error('Producto no encontrado');
            return;
        }
        
        const detailContent = document.getElementById('product-detail-content');
        detailContent.innerHTML = `
            <div class="text-center mb-3">
                <img src="${product.img || 'https://via.placeholder.com/300'}" class="img-fluid rounded" alt="${product.name}" style="max-height: 200px;">
            </div>
            <h3>${product.name}</h3>
            <p class="text-muted">${product.category || 'Sin categoría'}</p>
            <p>${product.description}</p>
            <div class="d-flex flex-wrap justify-content-between align-items-center">
                <h4 class="text-primary me-2">$${product.price}</h4>
                <div class="quantity-selector d-flex align-items-center mt-2 mt-md-0">
                    <label for="product-quantity" class="me-2 mb-0">Cantidad:</label>
                    <div class="input-group quantity-controls">
                        <button class="btn btn-outline-secondary" type="button" id="decrease-quantity-btn">-</button>
                        <input type="number" id="product-quantity" class="form-control text-center" value="1" min="1">
                        <button class="btn btn-outline-secondary" type="button" id="increase-quantity-btn">+</button>
                    </div>
                </div>
            </div>
            <style>
                .quantity-controls {
                    width: 140px;
                    flex-wrap: nowrap;
                }
                .quantity-controls input {
                    flex: 0 0 40px;
                    text-align: center;
                    padding-left: 0;
                    padding-right: 0;
                }
                .quantity-controls .btn {
                    width: 40px;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                }
            </style>
        `;
        
        const quantityInput = document.getElementById('product-quantity');
        const decreaseBtn = document.getElementById('decrease-quantity-btn');
        const increaseBtn = document.getElementById('increase-quantity-btn');
        
        const updateQuantityButtonsState = () => {
            const currentQuantity = parseInt(quantityInput.value) || 1;
            decreaseBtn.disabled = currentQuantity <= 1;
        };
        
        decreaseBtn.addEventListener('click', () => {
            const currentQuantity = parseInt(quantityInput.value) || 1;
            if (currentQuantity > 1) {
                quantityInput.value = currentQuantity - 1;
                updateQuantityButtonsState();
            }
        });
        
        increaseBtn.addEventListener('click', () => {
            const currentQuantity = parseInt(quantityInput.value) || 1;
            quantityInput.value = currentQuantity + 1;
            updateQuantityButtonsState();
        });
        
        quantityInput.addEventListener('change', () => {
            let value = parseInt(quantityInput.value) || 1;
            if (value < 1) value = 1;
            quantityInput.value = value;
            updateQuantityButtonsState();
        });
        
        updateQuantityButtonsState();
        
        const addToCartBtn = document.getElementById('add-to-cart-btn');
        addToCartBtn.onclick = () => {
            const quantity = parseInt(document.getElementById('product-quantity').value) || 1;
            
            if (quantity < 1) {
                showNotification('La cantidad debe ser al menos 1');
                return;
            }
            
            addToCart(product, quantity);
            
            const modal = bootstrap.Modal.getInstance(document.getElementById('product-detail-modal'));
            if (modal) {
                modal.hide();
                
                setTimeout(() => {
                    const backdrop = document.querySelector('.modal-backdrop');
                    if (backdrop) {
                        backdrop.remove();
                    }
                    document.body.classList.remove('modal-open');
                    document.body.style.overflow = '';
                    document.body.style.paddingRight = '';
                    
                    setTimeout(() => {
                        showNotification('Producto agregado al carrito');
                    }, 100);
                }, 300);
            } else {
                showNotification('Producto agregado al carrito');
            }
        };
        
        const modal = new bootstrap.Modal(document.getElementById('product-detail-modal'));
        modal.show();
        
    } catch (error) {
        console.error('Error al mostrar detalles del producto:', error);
    }
}

window.addEventListener('showProductDetails', (event) => {
    const { productId } = event.detail;
    showProductDetails(productId);
});

document.addEventListener('DOMContentLoaded', initApp);
