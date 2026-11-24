const menuBtn = document.getElementById('dropdown-btn');
const dropdownMenu = document.getElementById('dropdown-menu');
const shopNowButton = document.getElementById('shop-now-button');



menuBtn.addEventListener('click', function() {
    dropdownMenu.classList.toggle('show');
});

window.addEventListener('click', function(event) {
    if (!menuBtn.contains(event.target) && !dropdownMenu.contains(event.target)) {
        dropdownMenu.classList.remove('show');
    }
});
if (shopNowButton) {
    shopNowButton.addEventListener('click', function() {
        window.location.href = 'Products.html';
    });
}

