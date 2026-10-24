import { createRouter, createWebHistory } from 'vue-router'
import { auth } from './auth'
import Login from './views/Login.vue'
import Register from './views/Register.vue'
import Dashboard from './views/Dashboard.vue'
import Orders from './views/Orders.vue'
import OrderNew from './views/OrderNew.vue'
import OrderDetail from './views/OrderDetail.vue'
import Complaints from './views/Complaints.vue'
import Users from './views/Users.vue'
import Notifications from './views/Notifications.vue'
import Requests from './views/Requests.vue'
import Board from './views/Board.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/masuk', component: Login, meta: { public: true } },
    { path: '/daftar', component: Register, meta: { public: true } },
    { path: '/', component: Dashboard },
    { path: '/order', component: Orders },
    { path: '/order/baru', component: OrderNew, meta: { admin: true } },
    { path: '/order/:id', component: OrderDetail, props: true },
    { path: '/komplain', component: Complaints },
    { path: '/jemput', component: Requests },
    { path: '/papan', component: Board },
    { path: '/notifikasi', component: Notifications },
    { path: '/penghuni', component: Users, meta: { admin: true } },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
})

router.beforeEach((to) => {
  if (!to.meta.public && !auth.token) return '/masuk'
  if (to.meta.public && auth.token) return '/'
  if (to.meta.admin && !auth.isAdmin) return '/'
})

export default router
