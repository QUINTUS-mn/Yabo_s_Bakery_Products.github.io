/**
 * Sales.js - Real-time Shopping Cart, Secure Checkout (ZAR / Rands), Separate Card Fields, and Receipt Generator
 * Yabo's Bakery (South Africa)
 */

(function() {
    // Prevent multiple initializations
    if (window.BhwSalesInitialized) return;
    window.BhwSalesInitialized = true;

    // Inject CSS for Cart Drawer, Checkout Modal, Quantity controls, and Notifications
    const style = document.createElement('style');
    style.textContent = `
        .bhw-cart-float {
            position: fixed;
            bottom: 25px;
            right: 5px;
            background: #ff007f;
            color: #fff;
            border: none;
            border-radius: 50px;
            padding: 12px 10px;
            font-size: 13px;
            font-weight: bold;
            cursor: pointer;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            z-index: 9999;
            display: flex;
            align-items: center;
            gap: 10px;
            transition: background 0.3s;
        }
        .bhw-cart-float:hover {
            background: #ff007f;
        }
        .bhw-modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.7);
            z-index: 10000;
            display: flex;
            justify-content: center;
            align-items: center;
            opacity: 0;
            pointer-events: none;
            transition: opacity 0.3s ease;
        }
        .bhw-modal-overlay.active {
            opacity: 1;
            pointer-events: auto;
        }
        .bhw-modal-content {
            background: #ffffff;
            color: #222;
            width: 90%;
            max-width: 520px;
            border-radius: 12px;
            padding: 25px;
            box-shadow: 0 8px 24px rgba(0,0,0,0.4);
            max-height: 90vh;
            overflow-y: auto;
            position: relative;
        }
        .bhw-modal-close {
            position: absolute;
            top: 15px;
            right: 20px;
            background: none;
            border: none;
            font-size: 24px;
            cursor: pointer;
            color: #666;
        }
        .bhw-modal-content h2 {
            margin-bottom: 15px;
            color: #ff007f;
            font-family: 'Montserrat', sans-serif;
        }
        .bhw-cart-items-list {
            list-style: none;
            margin-bottom: 20px;
            max-height: 200px;
            overflow-y: auto;
            border-bottom: 1px solid #eee;
            padding-bottom: 10px;
        }
        .bhw-cart-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 12px;
            font-size: 14px;
            gap: 10px;
            border-bottom: 1px dashed #f0f0f0;
            padding-bottom: 8px;
        }
        .bhw-qty-controls {
            display: flex;
            align-items: center;
            gap: 6px;
        }
        .bhw-qty-btn {
            background: #ff007f;
            border: none;
            width: 26px;
            height: 26px;
            border-radius: 4px;
            cursor: pointer;
            font-weight: bold;
        }
        .bhw-qty-btn:hover {
            background: #ff007f;
            color: white;
        }
        .bhw-form-group {
            margin-bottom: 15px;
        }
        .bhw-form-group label {
            display: block;
            margin-bottom: 5px;
            font-weight: bold;
            font-size: 13px;
        }
        .bhw-form-group input, .bhw-form-group select {
            width: 100%;
            padding: 10px;
            border: 1px solid #ccc;
            border-radius: 6px;
            font-size: 14px;
        }
        .bhw-card-row {
            display: flex;
            gap: 10px;
        }
        .bhw-card-row .bhw-form-group {
            flex: 1;
        }
        .bhw-checkout-btn {
            width: 100%;
            background: #ff007f;
            color: white;
            border: none;
            padding: 12px;
            border-radius: 6px;
            font-size: 16px;
            font-weight: bold;
            cursor: pointer;
            transition: background 0.3s;
        }
        .bhw-checkout-btn:hover {
            background: #ff007f;
        }
        .bhw-notification {
            position: fixed;
            top: 20px;
            right: 20px;
            background: #ff007f;
            color: white;
            padding: 12px 20px;
            border-radius: 6px;
            z-index: 10001;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            font-weight: bold;
            opacity: 0;
            transition: opacity 0.3s ease;
        }
        .bhw-notification.show {
            opacity: 1;
        }
    `;
    document.head.appendChild(style);

    // Cart State
    let cart = JSON.parse(localStorage.getItem('bhw_cart')) || [];

    // Create Floating Cart Button
    const cartButton = document.createElement('button');
    cartButton.className = 'bhw-cart-float';
    cartButton.innerHTML = `<i class="fas fa-shopping-cart"></i>(<span id="cart-count">0</span>)`;
    document.body.appendChild(cartButton);

    // Create Checkout Modal HTML with separate card input fields
    const modalOverlay = document.createElement('div');
    modalOverlay.className = 'bhw-modal-overlay';
    modalOverlay.innerHTML = `
        <div class="bhw-modal-content">
            <button type="button" class="bhw-modal-close"> &times; </button>
            <h2>Checkout & Secure Payment (ZAR)</h2>
            <div id="cart-summary">
                <ul class="bhw-cart-items-list" id="modal-cart-items"></ul>
                <p style="text-align: right; font-weight: bold; margin-bottom: 20px;">Total: R<span id="cart-total">0.00</span></p>
            </div>
            <form id="bhw-checkout-form">
                <div class="bhw-form-group">
                    <label for="cust-name">Full Name</label>
                    <input type="text" id="cust-name" required placeholder="Thabo Mokoena">
                </div>
                <div class="bhw-form-group">
                    <label for="cust-email">Email Address</label>
                    <input type="email" id="cust-email" required placeholder="thabo@example.co.za">
                </div>
                <div class="bhw-form-group">
                    <label for="cust-address">South African Delivery Address</label>
                    <input type="text" id="cust-address" required placeholder="123 Nelson Mandela Drive, Johannesburg, 2001">
                </div>
                <div class="bhw-form-group">
                    <label for="card-number">Card Number</label>
                    <input type="text" id="card-number" required placeholder="4242 4242 4242 4242" maxlength="19">
                </div>
                <div class="bhw-card-row">
                    <div class="bhw-form-group">
                        <label for="card-expiry">Card Expiry Date</label>
                        <input type="text" id="card-expiry" required placeholder="MM/YY" maxlength="5">
                    </div>
                    <div class="bhw-form-group">
                        <label for="card-cvc">CVC / CVV</label>
                        <input type="password" id="card-cvc" required placeholder="123" maxlength="4">
                    </div>
                </div>
                <button type="submit" class="bhw-checkout-btn" id="submit-payment">Complete Purchase</button>
                <button type="button" class="bhw-checkout-btn" id="clear-details" style="background-color: #555; margin-top: 10px;">Clear Details</button>

            </form>
        </div>
    `;
    document.body.appendChild(modalOverlay);

    // Notification toast element
    const notification = document.createElement('div');
    notification.className = 'bhw-notification';
    document.body.appendChild(notification);

    function showNotification(message) {
        notification.textContent = message;
        notification.classList.add('show');
        setTimeout(() => {
            notification.classList.remove('show');
        }, 3000);
    }

    function updateCartUI() {
        const countSpan = document.getElementById('cart-count');
        const modalItemsList = document.getElementById('modal-cart-items');
        const cartTotalSpan = document.getElementById('cart-total');

        const totalCount = cart.reduce((sum, item) => sum + item.quantity, 0);
        if (countSpan) countSpan.textContent = totalCount;

        if (modalItemsList && cartTotalSpan) {
            modalItemsList.innerHTML = '';
            let total = 0;
            if (cart.length === 0) {
                modalItemsList.innerHTML = '<li class="bhw-cart-item">Your cart is empty.</li>';
            } else {
                cart.forEach((item, index) => {
                    const itemTotal = item.price * item.quantity;
                    total += itemTotal;
                    const li = document.createElement('li');
                    li.className = 'bhw-cart-item';
                    li.innerHTML = `
                        <div>
                            <strong>${item.name}</strong><br>
                            <small>R${item.price.toFixed(2)} each</small>
                        </div>
                        <div class="bhw-qty-controls">
                            <button type="button" class="bhw-qty-btn decrease-qty" data-index="${index}">-</button>
                            <span>${item.quantity}</span>
                            <button type="button" class="bhw-qty-btn increase-qty" data-index="${index}">+</button>
                        </div>
                        <span><strong>R${itemTotal.toFixed(2)}</strong></span>
                    `;
                    modalItemsList.appendChild(li);
                });

                // Attach event listeners to quantity buttons inside modal
                modalItemsList.querySelectorAll('.increase-qty').forEach(btn => {
                    btn.addEventListener('click', () => {
                        const idx = parseInt(btn.getAttribute('data-index'));
                        cart[idx].quantity += 1;
                        updateCartUI();
                    });
                });
                modalItemsList.querySelectorAll('.decrease-qty').forEach(btn => {
                    btn.addEventListener('click', () => {
                        const idx = parseInt(btn.getAttribute('data-index'));
                        if (cart[idx].quantity > 1) {
                            cart[idx].quantity -= 1;
                        } else {
                            cart.splice(idx, 1);
                        }
                        updateCartUI();
                    });
                });
            }
            cartTotalSpan.textContent = total.toFixed(2);
        }
        localStorage.setItem('bhw_cart', JSON.stringify(cart));
    }

    // Attach click listeners to "Add to Cart" buttons (ensuring no duplicate listeners)
    function initAddToCartButtons() {
        const buttons = document.querySelectorAll('.product-card .shop-now-button');
        buttons.forEach((btn, index) => {
            if (btn.getAttribute('data-cart-bound') === 'true') return;
            btn.setAttribute('data-cart-bound', 'true');

            btn.addEventListener('click', function(e) {
                e.preventDefault();
                const card = btn.closest('.product-card');
                const nameEl = card ? card.querySelector('h3') : null;
                const name = nameEl ? nameEl.textContent : `Product ${index + 1}`;

                // Ensure every product price is strictly under R100
                const cappedPrices = [49.99, 59.50, 79.00, 89.99, 65.00, 45.00, 99.00, 75.00];
                const price = cappedPrices[index % cappedPrices.length];

                const existingItem = cart.find(item => item.name === name);
                if (existingItem) {
                    existingItem.quantity += 1;
                } else {
                    cart.push({ name, price, quantity: 1 });
                }
                updateCartUI();
                showNotification(`Added ${name} to cart (Qty: 1)!`);
            });
        });
    }

    // Modal Events
    cartButton.addEventListener('click', () => {
        updateCartUI();
        modalOverlay.classList.add('active');
    });

    modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay || e.target.closest('.bhw-modal-close')) {
            modalOverlay.classList.remove('active');
        }
    });

    // Handle Form Submit & Receipt Generation
    const checkoutForm = document.getElementById('bhw-checkout-form');
    const clearDetailsBtn = document.getElementById('clear-details');
    if (clearDetailsBtn) {
        clearDetailsBtn.addEventListener('click', function(e) {
            e.preventDefault();
            checkoutForm.reset();
            showNotification('Checkout details cleared.');
        });
    }
    checkoutForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        if (cart.length === 0) {
            alert('Your cart is empty!');
            return;
        }

        const name = document.getElementById('cust-name').value;
        const email = document.getElementById('cust-email').value;
        const address = document.getElementById('cust-address').value;
        const cardNumber = document.getElementById('card-number').value;
        const cardExpiry = document.getElementById('card-expiry').value;
        const cardCvc = document.getElementById('card-cvc').value;

        const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

        const submitButton = document.getElementById('submit-payment');
        submitButton.disabled = true;
        submitButton.textContent = 'Processing Payment (ZAR)...';

        // Simulate secure payment processing & transaction completion
        setTimeout(() => {
            // Generate Text File Receipt in Rands
            generateTextReceipt({
                name,
                email,
                address,
                last4: cardNumber.slice(-4) || '****',
                items: cart,
                total: totalAmount,
                date: new Date().toLocaleString(),
                transactionId: 'ZAR-TXN-' + Math.random().toString(36).substring(2, 11).toUpperCase()
            });

            submitButton.disabled = false;
            submitButton.textContent = 'Complete Purchase';
            modalOverlay.classList.remove('active');

            // Clear cart & form
            cart = [];
            updateCartUI();
            checkoutForm.reset();
            showNotification('Purchase successful! ZAR receipt downloaded.');
        }, 1500);
    });

    // Generate and download text file receipt in Rands
    function generateTextReceipt(orderData) {
        let receiptText = `========================================\n`;
        receiptText += `   YABO'S BAKERY (RSA)   \n`;
        receiptText += `========================================\n`;
        receiptText += `Transaction ID : ${orderData.transactionId}\n`;
        receiptText += `Date & Time    : ${orderData.date}\n`;
        receiptText += `----------------------------------------\n`;
        receiptText += `CUSTOMER INFORMATION:\n`;
        receiptText += `Name           : ${orderData.name}\n`;
        receiptText += `Email          : ${orderData.email}\n`;
        receiptText += `Delivery Addr  : ${orderData.address}\n`;
        receiptText += `Payment Card   : **** **** **** ${orderData.last4}\n`;
        receiptText += `----------------------------------------\n`;
        receiptText += `PURCHASED ITEMS:\n`;

        orderData.items.forEach((item, idx) => {
            const subtotal = item.price * item.quantity;
            receiptText += `${idx + 1}. ${item.name} (x${item.quantity}) @ R${item.price.toFixed(2)} = R${subtotal.toFixed(2)}\n`;
        });

        receiptText += `----------------------------------------\n`;
        receiptText += `TOTAL PAID     : R${orderData.total.toFixed(2)} (ZAR)\n`;
        receiptText += `========================================\n`;
        receiptText += `Thank you for shopping with Yabo's Bakery!\n`;
        receiptText += `========================================\n`;

        // Create Blob and trigger download
        const blob = new Blob([receiptText], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `BetterHealthWays_RSA_Receipt_${orderData.transactionId}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    // Initialize on load
    window.addEventListener('DOMContentLoaded', () => {
        initAddToCartButtons();
        updateCartUI();
    });

    // Also run immediately in case DOM is already loaded
    setTimeout(() => {
        initAddToCartButtons();
        updateCartUI();
    }, 300);

})();
