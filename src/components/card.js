import { getProducts } from '../api/index.js';

export function templateCard() {
    let containerCard = document.querySelector("#listado-productos");
    containerCard.innerHTML = '';
    
    getProducts().then((products) => {
        if (products.length === 0) {
            containerCard.innerHTML = '<div class="col-12 text-center">No se encontraron productos</div>';
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
            
            containerCard.innerHTML += template;
        });
        
        addViewDetailsEvents();
    });
}

function addViewDetailsEvents() {
    const detailButtons = document.querySelectorAll('.view-details');
    detailButtons.forEach(button => {
        button.addEventListener('click', function() {
            const productId = this.getAttribute('data-id');
            window.dispatchEvent(new CustomEvent('showProductDetails', {
                detail: { productId }
            }));
        });
    });
}