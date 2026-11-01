Dar Home – Full Stack E-commerce Store

A full stack furniture store built with Node.js, Express and MongoDB, with a vanilla HTML, CSS and JavaScript single page frontend.

Built as Task 1 (Simple E-commerce Store) of the CodeAlpha Full Stack Development internship.
What the project does

Visitors can browse a furniture catalogue, search and filter it, add items to a cart and, after creating an account, place an order and track it.

Features
Product listing with live search, category filter and price sorting
Product details page with image, description and stock status (in stock, low stock, sold out)
Shopping cart saved in the browser, with quantity controls and stock limits
User registration and login using JSON Web Tokens
Order processing: shipping address, stock check, order confirmation
Order history page for each user
Responsive design that works on phones, tablets and desktops
Loading skeletons, empty states, error messages and fallback images
Project structure:
CodeAlpha_EcommerceStore/
├── server.js            Express app (exported for Vercel, listens locally)
├── seed.js              Fills the database with sample products
├── imageLinks.js        Image URL for each sample product
├── config/db.js         MongoDB connection (cached for serverless)
├── models/              User, Product, Order schemas
├── middleware/auth.js   JWT check for protected routes
├── routes/              auth, products, orders
└── public/              Frontend
    ├── index.html
    ├── style.css
    ├── images/placeholder.svg
    └── js/              api.js, auth.js, cart.js, app.js

Live demo:https://code-alpha-ecommerce-store-gamma.vercel.app/
