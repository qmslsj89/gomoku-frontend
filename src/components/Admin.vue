<template>
  <div>
    <div v-if="isMobile" class="mobile-warning">
      请使用电脑端浏览器访问此页面。
    </div>
    <div v-else class="admin-panel">
      <el-container>
        <el-aside class="admin-aside animated-aside" :style="{ width: isCollapse ? '64px' : '200px', overflow: isCollapse ? 'hidden' : 'auto' }">
          <div class="collapse-button">
            <el-radio-group v-model="isCollapse">
              <el-radio-button v-if="isCollapse" :label="false">
                <el-icon>
                  <Expand />
                </el-icon>
              </el-radio-button>
              <el-radio-button v-else :label="true">
                <el-icon>
                  <Fold />
                </el-icon>
              </el-radio-button>
            </el-radio-group>
          </div>
          <el-menu :default-active="activeMenu" class="el-menu-vertical-demo" :collapse="isCollapse"
            background-color="#409eff" text-color="#fff" active-text-color="#ffd04b" @select="handleMenuSelect">
            <el-menu-item v-for="item in menuItems" :key="item.index" :index="item.index"
              :class="{ 'collapsed': isCollapse }">
              <el-icon>
                <component :is="item.icon" />
              </el-icon>
              <template v-slot:title>{{ item.title }}</template>
            </el-menu-item>
          </el-menu>
        </el-aside>
        <el-main class="admin-main" :class="{ collapsed: isCollapse, 'animated-main': true }">
          <el-breadcrumb separator-class="el-icon-arrow-right" v-if="currentComponent !== 'Users'&& currentComponent !== 'Games' && currentComponent !== 'Rooms'&& currentComponent !== 'Stats'">
            <el-breadcrumb-item>{{ currentComponent }}</el-breadcrumb-item>
          </el-breadcrumb>
          <component :is="currentComponent" class="full-height"></component>
        </el-main>
      </el-container>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import { User, Grid, OfficeBuilding, DataAnalysis, Expand, Fold } from '@element-plus/icons-vue';
import Users from './admin/Users.vue';
import Games from './admin/Games.vue';
import Rooms from './admin/Rooms.vue';
import Stats from './admin/Stats.vue';

export default {
  name: 'AdminPanel',
  components: {
    Users,
    Games,
    Rooms,
    Stats,
    User,
    Grid,
    OfficeBuilding,
    DataAnalysis,
    Expand,
    Fold
  },
  setup() {
    const isCollapse = ref(true);
    const activeMenu = ref('users');
    const currentComponent = ref('Users');
    const isMobile = ref(false);

    const menuItems = [
      { index: 'users', icon: User, title: '用户管理' },
      { index: 'games', icon: Grid, title: '对局管理' },
      { index: 'rooms', icon: OfficeBuilding, title: '房间管理' },
      { index: 'stats', icon: DataAnalysis, title: '统计信息' }
    ];

    const handleMenuSelect = (key) => {
      activeMenu.value = key;
      currentComponent.value = key.charAt(0).toUpperCase() + key.slice(1);
    };

    const checkIfMobile = () => {
      isMobile.value = window.innerWidth <= 768;
    };

    onMounted(() => {
      checkIfMobile();
      window.addEventListener('resize', checkIfMobile);
    });

    return {
      isCollapse,
      activeMenu,
      currentComponent,
      menuItems,
      handleMenuSelect,
      isMobile
    };
  }
};
</script>

<style scoped>
.admin-panel {
  display: flex;
  height: 100vh;
}

.admin-aside {
  background-color: #409eff;
  color: #fff;
  display: flex;
  flex-direction: column;
  height: auto;
  position: fixed;
  top: 87px;
  left: 8px;
  transition: width 0.5s ease, overflow 0.5s ease; /* 调整过渡效果 */
  z-index: 1000;
  box-shadow: 2px 0 12px rgba(0, 0, 0, 0.1);
  border-radius: 8px;
}

.collapse-button {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 10px 0;
  background-color: #409eff;
  width: 100%;
  border-radius: 8px 8px 0 0;
  /* 顶部圆角 */
}

.el-menu-vertical-demo {
  width: 100%;
  flex: 1;
  border-right: none;
  overflow-y: auto;
  border-radius: 0 0 8px 8px;
  /* 底部圆角 */
}

.el-menu-vertical-demo::-webkit-scrollbar {
  display: none; /* 隐藏滚动条 */
}

.el-menu-item {
  display: flex;
  align-items: center;
  padding: 0 20px;
  height: 50px;
  margin-bottom: 10px;
  transition: padding 0.5s ease, background-color 0.3s ease, transform 0.3s ease; /* 调整过渡效果 */
  border-radius: 8px;
  /* 添加圆角 */
}

.el-menu-item:hover {
  background-color: #66b1ff;
  transform: scale(1.05);
}

.el-menu-item i {
  margin-right: 10px;
  font-size: 18px;
}

.collapsed .el-menu-item {
  justify-content: center;
  padding: 0;
}

.collapsed .el-menu-item i {
  margin-right: 0;
}

.admin-main {
  flex: 1;
  margin-left: 200px;
  transition: margin-left 0.5s ease; /* 调整过渡效果 */
  display: flex;
  flex-direction: column;
  border: none;
  padding: 0;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  max-height: 700px; /* 设置最小高度 */
}

.admin-main.collapsed {
  margin-left: 64px;
  /* 折叠状态下的左边距 */
}

.animated-main {
  animation: fadeIn 1s ease-in-out;
}

.animated-aside {
  animation: fadeIn 1s ease-in-out, slideIn 1s ease-in-out;
}

.full-height {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.el-breadcrumb {
  margin-bottom: 20px;
}

.mobile-warning {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  font-size: 1.5em;
  color: #333;
  text-align: center;
  padding: 20px;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideIn {
  from {
    transform: translateX(-20px);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

@media (max-width: 768px) {
  .admin-aside {
    width: 64px;
  }

  .admin-main {
    margin-left: 64px;
  }

  .el-menu-item {
    justify-content: center;
    padding: 0;
  }

  .el-menu-item i {
    margin-right: 0;
  }
}

@media (max-width: 360px) {
  .admin-panel {
    flex-direction: column;
  }

  .admin-aside {
    width: 100%;
    height: auto;
    position: relative;
    top: 0;
    left: 0;
    flex-direction: row;
    justify-content: space-between;
    padding: 10px;
  }

  .collapse-button {
    display: none;
  }

  .el-menu-vertical-demo {
    flex-direction: row;
    overflow-x: auto;
    white-space: nowrap;
  }

  .el-menu-item {
    display: inline-flex;
    justify-content: center;
    padding: 0 10px;
    margin-bottom: 0;
  }

  .admin-main {
    margin-left: 0;
    margin-top: 10px;
  }
}
</style>