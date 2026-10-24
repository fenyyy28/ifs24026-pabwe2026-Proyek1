import { createRouter, createWebHistory } from 'vue-router'
import Dashboard from './views/Dashboard.vue'
import Orders from './views/Orders.vue'
import OrderNew from './views/OrderNew.vue'
import OrderDetail from './views/OrderDetail.vue'
import Complaints from './views/Complaints.vue'
import Users from './views/Users.vue'

export default createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: Dashboard },
    { path: '/order', component: Orders },
    { path: '/order/baru', component: OrderNew },
    { path: '/order/:id', component: OrderDetail, props: true },
    { path: '/komplain', component: Complaints },
    { path: '/penghuni', component: Users },
  ],
})
