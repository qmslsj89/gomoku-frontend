import { createRouter, createWebHistory } from 'vue-router';
import HelloWorld from './components/HelloWorld.vue';
import GomokuBoard from './components/GomokuBoard.vue';
import Login from './components/Login.vue';
import Register from './components/Register.vue';
import Leaderboard from './components/Leaderboard.vue';
import Admin from './components/Admin.vue';
import Users from './components/admin/Users.vue';
import Games from './components/admin/Games.vue';
import Rooms from './components/admin/Rooms.vue';
import Stats from './components/admin/Stats.vue';
import MyAi from './components/MyAi.vue';

const routes = [
  {
    path: '/',
    name: 'Home',
    component: HelloWorld
  },
  {
    path: '/MyAi',
    name: 'MyAi',
    component: MyAi
  },
  {
    path: '/board',
    name: 'GomokuBoard',
    component: GomokuBoard
  },
  {
    path: '/login',
    name: 'Login',
    component: Login
  },
  {
    path: '/register',
    name: 'Register',
    component: Register
  },
  {
    path: '/leaderboard',
    name: 'Leaderboard',
    component: Leaderboard
  },
  {
    path: '/admin',
    name: 'Admin',
    component: Admin,
    children: [
      {
        path: 'users',
        name: 'Users',
        component: Users
      },
      {
        path: 'games',
        name: 'Games',
        component: Games
      },
      {
        path: 'rooms',
        name: 'Rooms',
        component: Rooms
      },
      {
        path: 'stats',
        name: 'Stats',
        component: Stats
      }
    ]
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

export default router;