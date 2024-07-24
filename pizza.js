document.addEventListener("alpine:init", () => {
  Alpine.data("pizzaCart", () => {
    return {
      title: "Pizza Cart API",
      pizzas: [],
      featuredPizzas: [],
      username: "",
      cartId: "",
      cartPizzas: [],
      cartTotal: 0.0,
      pizzaId: 0,
      paymentAmount: "",
      message: "",
      messageStatus: "",
      change: 0,
      historicalOrders: [],
      cartData: {},
      pizzas: [],
      
      login() {
        if (this.username.length > 2) {
          localStorage["username"] = this.username;
          this.createCart().then(() => {
            this.fetchHistoryCart();
            this.showCartData();
          });
        } else {
          alert("Username too short!");
        }
      },

      logout() {
        if (confirm("Do you want to logout?")) {
          this.username = "";
          this.featuredPizzas = [];
          this.cartId = "";
          localStorage.clear();
        }
      },

      fetchHistoryCart() {
        axios
        .get(`https://pizza-api.projectcodex.net/api/pizza-cart/username/${this.username}`)
        .then ((res) => {
          const carts = res.data;
          carts.forEach((cart) => {
            if (cart.status === 'paid') {
              const cartCode = cart.cart_code;
              axios
              .get(`https://pizza-api.projectcodex.net/api/pizza-cart/${cartCode}/get`)
              .then((res) => {
                const cartData = res.data;
                this.historicalOrders.push(cartData);
               
              });
            }
          });
        });
      },

      createCart() {
        if (!this.username) {
          return Promise.resolve();
        }
        const cartId = localStorage["cartId"];
        // console.log(cartId);

        if (cartId) {
          this.cartId = cartId;
          this.showCartData();
          return Promise.resolve();
        } else {
          const createCartURL = `https://pizza-api.projectcodex.net/api/pizza-cart/create?username=${this.username}`;
          return axios.get(createCartURL).then((result) => {
            this.cartId = result.data.cart_code;
            localStorage["cartId"] = this.cartId;
          });
        }
      },

      getCart() {
        const getCartURL = `https://pizza-api.projectcodex.net/api/pizza-cart/${this.cartId}/get`;
        return axios.get(getCartURL);
      },

      addPizza(pizzaId) {
        return axios.post(
          `https://pizza-api.projectcodex.net/api/pizza-cart/add`,
          {
            cart_code: this.cartId,
            pizza_id: pizzaId,
          }
        );
        
      },

      removePizza(pizzaId) {
        return axios.post(
          `https://pizza-api.projectcodex.net/api/pizza-cart/remove`,
          {
            cart_code: this.cartId,
            pizza_id: pizzaId,
          }
        );
       
      },

      pay(amount) {
        return axios.post(
          `https://pizza-api.projectcodex.net/api/pizza-cart/pay`,
          {
            cart_code: this.cartId,
            amount,
          }
        );
      },

      fetchFeaturedPizzas() {
        const featuredPizzasURL = `https://pizza-api.projectcodex.net/api/pizzas/featured?username=${this.username}`;
        return axios.get(featuredPizzasURL).then((result) => {
          this.featuredPizzas = result.data.pizzas || [];
        });
      },

      manageFeaturedPizza(pizzaId) {
        const featuredPizzasURL = `https://pizza-api.projectcodex.net/api/pizzas/featured`;
        axios
          .post(featuredPizzasURL, {
            username: this.username,
            pizza_id: pizzaId,
          })
          .then(() => {
            this.fetchFeaturedPizzas() || [];
          });
      },

      showCartData() {
        this.getCart().then((result) => {
          this.cartPizzas = result.data.pizzas;
          const cartData = result.data;
          this.cartData = cartData;
          this.cartPizzas = cartData.pizzas.map((p) => {
            return {
              ...p,
              total: p.total.toFixed(2),
            };
          });
          this.cartTotal = cartData.total.toFixed(2);
          // this.saveCartData();
        });
      },

      
      
      init() {
        const storedUsername = localStorage["username"];
        if (storedUsername) {
          this.username = storedUsername;
      
        }

        axios
          .get(`https://pizza-api.projectcodex.net/api/pizzas`)
          .then((result) => {
            this.pizzas = result.data.pizzas;
          });

        if (!this.cartId) {
          this.createCart().then(() => {
            this.showCartData();
          });
        }
        this.fetchFeaturedPizzas();
        this.fetchHistoryCart();
        this.fetchHistoricalOrders();
      
      },

      addPizzaToCart(pizzaId) {
        this.addPizza(parseInt(pizzaId))
          .then(() => {
            this.showCartData();
          })
          .then(() => {
            this.showCartData();
          });
      },
      removePizzaFromCart(pizzaId) {
        this.removePizza(pizzaId).then(() => {
          this.showCartData();
        });
      },

      payForCart() {
        this.pay(this.paymentAmount).then((result) => {
          if (result.data.status == "failure") {
            this.message = result.data.message;
            this.messageStatus = "failure";

            setTimeout(() => (this.message = ""), 3000);
          } else {
            this.message = "Payment received!";
            // this.messageStatus = "success"; 
            if (this.paymentAmount >= this.cartTotal) {
              this.change = this.paymentAmount - this.cartTotal;
            } else {
              this.change = 0;
            }
            setTimeout(() => {
              this.message = "";
              this.change = 0;
              this.cartPizzas = [];
              this.cartTotal = 0.0;
              this.cartId = "";
              this.paymentAmount = "";
              localStorage["cartId"] = "";
              this.createCart();
            }, 3000);
          }
          this.historicalOrders.push(this.cartData);
          localStorage.setItem(
            "historicalOrders",
            JSON.stringify(this.historicalOrders)
          );
        });
      },
    };
  });
});
