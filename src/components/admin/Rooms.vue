<template>
  <div class="room-management">
    <h1 class="admin-title">房间管理</h1>
    <el-pagination
      @size-change="handleSizeChange"
      @current-change="handleCurrentChange"
      :current-page="currentPage"
      :page-sizes="[5, 10, 20, 30, 40]"
      :page-size="pageSize"
      layout="total, sizes, prev, pager, next, jumper"
      :total="totalRooms"
      class="pagination"
    ></el-pagination>
    <div class="search-bar">
      <el-input
        v-model="keyword"
        placeholder="请输入房间ID或用户名进行搜索，可以直接回车搜索..."
        prefix-icon="el-icon-search"
        @keyup.enter="handleSearch"
        class="search-input"
        clearable
      />
      <el-button type="primary" @click="handleSearch" class="search-button">搜索</el-button>
      <el-button type="default" @click="handleReset" class="reset-button">重置</el-button>
    </div>

    <div class="card-container">
      <el-row :gutter="120">
        <el-col :span="8" v-for="room in pagedRooms" :key="room.id" class="animated-card">
          <el-card class="room-card">
            <template v-slot:header>
              <span>房间ID: {{ room.id }}</span>
            </template>
            <div class="card-content">
              <p class="players-title">玩家:</p>
              <ul class="players-list">
                <li v-for="(player, index) in room.players" :key="index" class="player-item">{{ player }}</li>
              </ul>
              <el-button type="danger" @click="handleDelete(room)" size="small" class="delete-button">删除</el-button>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import { ref, onMounted, computed, watch } from 'vue';
import { ElMessageBox, ElMessage } from 'element-plus';

export default {
  name: 'RoomManagement',
  setup() {
    const rooms = ref([]); // 房间列表
    const currentPage = ref(1); // 当前页码
    const pageSize = ref(5); // 每页显示的记录数
    const totalRooms = ref(0); // 房间总数
    const tableKey = ref(0); // 用于强制重新渲染表格
    const tableHeight = ref(400); // 表格高度

    const keyword = ref('');

    // 获取房间数据
    const fetchRooms = async (searchKeyword = '') => {
      try {
        const response = await axios.get('http://115.235.191.234:3000/api/rooms', {
          params: { keyword: searchKeyword }
        });
        rooms.value = response.data;
        totalRooms.value = response.data.length;
        tableKey.value += 1; // 强制重新渲染表格
      } catch (error) {
        console.error('获取房间信息时出错:', error);
        ElMessage.error('获取房间信息失败');
      }
    };

    // 计算当前页的房间数据
    const pagedRooms = computed(() => {
      const start = (currentPage.value - 1) * pageSize.value;
      const end = start + pageSize.value;
      return rooms.value.slice(start, end);
    });

    // 处理每页显示记录数变化
    const handleSizeChange = (newSize) => {
      pageSize.value = newSize;
      adjustTableHeight();
    };

    // 处理页码变化
    const handleCurrentChange = (newPage) => {
      currentPage.value = newPage;
    };

    // 调整表格高度
    const adjustTableHeight = () => {
      const rowHeight = 50; // 每行的高度
      const headerHeight = 50; // 表头的高度
      const paginationHeight = 50; // 分页组件的高度
      tableHeight.value = headerHeight + paginationHeight + (pageSize.value * rowHeight);
    };

    // 组件挂载时获取房间数据
    onMounted(() => {
      fetchRooms();
      adjustTableHeight();
    });

    // 监听 pageSize 变化
    watch(pageSize, adjustTableHeight);

    // 删除房间信息
    const handleDelete = (room) => {
      ElMessageBox.confirm('确定要删除这个房间吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(async () => {
        try {
          await axios.post('http://115.235.191.234:3000/api/deleteRoom', { roomId: room.id });
          fetchRooms();
          ElMessage.success('删除成功');
        } catch (error) {
          console.error('删除房间时出错:', error);
          ElMessage.error('删除失败');
        }
      }).catch(() => {
        ElMessage.info('已取消删除');
      });
    };

    const handleSearch = () => {
      fetchRooms(keyword.value);
    };

    const handleReset = () => {
      keyword.value = '';
      fetchRooms();
    };

    return {
      rooms,
      pagedRooms,
      currentPage,
      pageSize,
      totalRooms,
      tableKey,
      tableHeight,
      keyword,
      handleSearch,
      handleReset,
      handleDelete,
      handleSizeChange,
      handleCurrentChange
    };
  }
};
</script>

<style scoped>
.room-management {
  padding: 20px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  width: auto;
  height: auto; /* 确保填充父容器 */
  display: flex;
  flex-direction: column;
  animation: fadeIn 1s ease-in-out;
}

.admin-title {
  font-size: 2em;
  margin-bottom: 20px;
  color: #333;
  text-align: center;
  animation: slideIn 1s ease-in-out;
}

.search-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 20px;
  animation: fadeIn 1s ease-in-out;
}

.search-input {
  flex: 1;
}

.search-button,
.reset-button {
  flex-shrink: 0;
  transition: background-color 0.3s ease, transform 0.3s ease;
}

.search-button:hover,
.reset-button:hover {
  background-color: #409eff;
  transform: scale(1.05);
}

.card-container {
  flex: 1; /* 确保卡片容器填充剩余空间 */
  display: flex;
  flex-wrap: wrap;
  gap: 40px; /* 调整卡片之间的间距 */
  justify-content: flex-start; /* 卡片靠左对齐 */
  animation: fadeIn 1s ease-in-out;
}

.el-pagination {
  margin-bottom: 20px; /* 调整分页组件的间距 */
  text-align: center;
  transition: opacity 0.5s ease;
}

.el-card {
  width: 100%;
}

.room-card {
  width: 200px; /* 设置卡片的宽度 */
  min-height: 200px; /* 设置卡片的最小高度 */
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  animation: fadeIn 0.5s ease-in-out;
}

.card-content {
  padding: 10px;
}

.players-title {
  font-weight: bold;
  margin-bottom: 10px;
}

.players-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.player-item {
  background-color: #f0f0f0;
  padding: 5px 10px;
  border-radius: 4px;
  margin-bottom: 5px;
}

.delete-button {
  align-self: flex-end;
  transition: background-color 0.3s ease, transform 0.3s ease;
}

.delete-button:hover {
  background-color: #ff4d4f;
  transform: scale(1.05);
}

.animated-card {
  animation: fadeIn 0.5s ease-in-out;
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
    transform: translateY(-20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}
</style>