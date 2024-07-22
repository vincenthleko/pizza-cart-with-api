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
      paymentAmount: '',
      message: "",
      change: 0,
      historicalOrders: [],
      cartData: {},
      // paymentEntered: false,
      login() {
        if (this.username.length > 2) {
          localStorage['username'] = this.username;
          this.createCart();
        } else {
          alert("Username too short!");
        }
      },

      logout() {
        if (confirm('Do you want to logout?')) {
          this.username = '';
          this.featuredPizzas = [];
          this.cartId = '';
          localStorage.clear();
      
        }

      },

      createCart() {
        if (!this.username) {
          return Promise.resolve();
        }
        const cartId = localStorage["cartId"];
        console.log(cartId)

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
            "cart_code" : this.cartId,
            "pizza_id" : pizzaId,
          }
        );
      },

      removePizza(pizzaId) {
        return axios.post(
          `https://pizza-api.projectcodex.net/api/pizza-cart/remove`,
          {
            "cart_code" : this.cartId,
            "pizza_id" : pizzaId,
          }
        );
      },

      pay(amount) {
        return axios.post(
          `https://pizza-api.projectcodex.net/api/pizza-cart/pay`,
          {
            "cart_code" : this.cartId,
            amount,
          }
        );
      },

      fetchFeaturedPizzas() {
        const featuredPizzasURL = `https://pizza-api.projectcodex.net/api/pizzas/featured?username=${this.username}`;
        return axios.get(featuredPizzasURL).then((result) => {
          this.featuredPizzas = result.data.pizzas;
        });
      },

      manageFeaturedPizza(pizzaId) {
        const featuredPizzasURL = `https://pizza-api.projectcodex.net/api/pizzas/featured`;
        axios.post(featuredPizzasURL, {
          "username": this.username,
          "pizza_id": pizzaId
        }).then(() => {
          this.fetchFeaturedPizzas();
        });
      },

      showCartData() {
        this.getCart().then((result) => {
          this.cartPizzas = result.data.pizzas;
          const cartData = result.data;
          this.cartData = cartData;
          this.cartPizzas = cartData.pizzas.map(p => {
            return {
              ...p,
              total: p.total.toFixed(2)
            }
          })
          this.cartTotal = cartData.total.toFixed(2);
        });
      },

      fetchHistoricalOrders() {
        this.historicalOrders = JSON.parse(localStorage.getItem('historicalOrders') || []);
        console.log(this.historicalOrders, 'u');
        // const historicalOrdersURL = `https://pizza-api.projectcodex.net/api/pizza-cart/${this.username}/:username`;
        // axios.get(historicalOrdersURL).then((result) => {
        //   this.historicalOrders = result.data.orders;
        // });
      },

      init() {

        const storedUsername = localStorage['username'];
        if (storedUsername) {
          this.username = storedUsername;
        }

        axios
          .get(`https://pizza-api.projectcodex.net/api/pizzas`)
          .then((result) => {
            // console.log(result.data);
            this.pizzas = result.data.pizzas
            // this.pizzaId = result.data.pizzas.id;
          });

        if (!this.cartId) {
           this
              .createCart()
              .then(() => {
                  this.showCartData();
              });
            }
            this.fetchFeaturedPizzas();
      },

      addPizzaToCart(pizzaId) {
        // alert(pizzaId)
        this.addPizza(parseInt(pizzaId))
          .then(() => {
            // alert("inside add Pizza");
            this.showCartData();
          })
          .then(() => {
            this.showCartData();
          });
        // console.log(parseInt(pizzaId))
      },
      removePizzaFromCart(pizzaId) {
        // alert(pizzaId)
        this.removePizza(pizzaId).then(() => {
          this.showCartData();
        });
      },


      payForCart() {
        // alert("pay now: " + this.paymentAmount)
        this.pay(this.paymentAmount).then((result) => {
          if (result.data.status == "failure") {
            this.message = result.data.message;
            setTimeout(() => (this.message = ""), 3000);
          } else {
            this.message = "Payment received!";
            this.historicalOrders.push(this.cartData)
            localStorage.setItem('historicalOrders', JSON.stringify(this.historicalOrders))
            if (this.paymentAmount >= this.cartTotal) {
              this.change = this.paymentAmount - this.cartTotal;
            } else {
              this.change = 0;
            }
            setTimeout(() => {
              this.message = '';
              this.change = 0;
              this.cartPizzas = [];
              this.featuredPizzas = [];
              this.cartTotal = 0.0;
              this.cartId = '';
              this.paymentAmount = '';
              localStorage["cartId"] = '';
              this.createCart();
              // this.username = '';
            }, 3000);
          }
        });
      },
    };
  });
});
