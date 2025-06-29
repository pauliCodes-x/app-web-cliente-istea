console.log("index.js load test");

export const API_URL = "https://686068538e74864084432d05.mockapi.io/api/v1/products";

export async function getProducts() {
    try {
        const response = await fetch(API_URL);
        if (!response.ok) {
            throw new Error(`Error: ${response.status}`);
        }
        const data = await response.json();
        console.log("Data fetched from API:", data);
        return data;
    } catch (error) {
        console.error("Error fetching products:", error);
        return [];
    }
}

export async function searchProducts(searchTerm) {
    try {
        const products = await getProducts();
        if (!searchTerm) return products;
        
        searchTerm = searchTerm.toLowerCase();
        return products.filter(product => 
            product.name.toLowerCase().includes(searchTerm) || 
            product.description.toLowerCase().includes(searchTerm)
        );
    } catch (error) {
        console.error("Error searching products:", error);
        return [];
    }
}