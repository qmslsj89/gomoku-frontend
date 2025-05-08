<template>
  <div class="game-management">
    <h1 class="admin-title">对局管理</h1>
    <el-pagination
      @size-change="handleSizeChange"
      @current-change="handleCurrentChange"
      :current-page="currentPage"
      :page-sizes="[5, 10, 20, 30, 40]"
      :page-size="pageSize"
      layout="total, sizes, prev, pager, next, jumper"
      :total="totalGames"
      class="pagination"
    ></el-pagination>
    <div class="search-bar">
      <el-input
        v-model="keyword"
        placeholder="请输入用户名进行搜索，可以直接回车搜索..."
        prefix-icon="el-icon-search"
        @keyup.enter="handleSearch"
        class="search-input"
        clearable
      />
      <el-button type="primary" @click="handleSearch" class="search-button">搜索</el-button>
      <el-button type="default" @click="handleReset" class="reset-button">重置</el-button>
    </div>

    <div class="table-container">
      <el-table :data="pagedGames" :height="tableHeight" :key="tableKey" class="animated-table">
        <el-table-column prop="player1_username" label="玩家1" min-width="180" align="center" sortable></el-table-column>
        <el-table-column prop="player2_username" label="玩家2" min-width="180" align="center" sortable></el-table-column>
        <el-table-column prop="winner_username" label="获胜者" min-width="180" align="center" sortable></el-table-column>
        <el-table-column prop="created_at" label="创建时间" min-width="250" align="center" sortable></el-table-column>
        <el-table-column label="操作" min-width="180" align="center">
          <template v-slot="scope">
            <el-button type="danger" @click="handleDelete(scope.row)" size="small">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import { ref, onMounted, computed, watch } from 'vue';
import { ElMessageBox, ElMessage } from 'element-plus';

export default {
  name: 'GamesManager',
  setup() {
    const games = ref([]); // 对局列表
    const currentPage = ref(1); // 当前页码
    const pageSize = ref(5); // 每页显示的记录数
    const totalGames = ref(0); // 对局总数
    const tableKey = ref(0); // 用于强制重新渲染表格
    const tableHeight = ref(400); // 表格高度

    const keyword = ref('');

    // 获取对局数据
    const fetchGames = async (searchKeyword = '') => {
      try {
        const response = await axios.get('http://115.235.191.234:3000/api/games', {
          params: { keyword: searchKeyword }
        });
        games.value = response.data;
        totalGames.value = response.data.length;
        tableKey.value += 1; // 强制重新渲染表格
      } catch (error) {
        console.error('获取对局信息时出错:', error);
        ElMessage.error('获取对局信息失败');
      }
    };

    // 计算当前页的对局数据
    const pagedGames = computed(() => {
      const start = (currentPage.value - 1) * pageSize.value;
      const end = start + pageSize.value;
      return games.value.slice(start, end);
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

    // 组件挂载时获取对局数据
    onMounted(() => {
      fetchGames();
      adjustTableHeight();
    });

    // 监听 pageSize 变化
    watch(pageSize, adjustTableHeight);

    // 删除对局信息
    const handleDelete = (row) => {
      ElMessageBox.confirm('确定要删除这条记录吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(async () => {
        try {
          await axios.post('http://115.235.191.234:3000/api/deleteGame', { gameId: row.id });
          fetchGames();
          ElMessage.success('删除成功');
        } catch (error) {
          console.error('删除对局时出错:', error);
          ElMessage.error('删除失败');
        }
      }).catch(() => {
        ElMessage.info('已取消删除');
      });
    };

    const handleSearch = () => {
      fetchGames(keyword.value);
    };

    const handleReset = () => {
      keyword.value = '';
      fetchGames();
    };

    return {
      games,
      pagedGames,
      currentPage,
      pageSize,
      totalGames,
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
.game-management {
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

.table-container {
  flex: 1; /* 确保表格容器填充剩余空间 */
  display: flex;
  justify-content: center;
  width: 100%;
  animation: fadeIn 1s ease-in-out;
}

.el-pagination {
  margin-bottom: 20px; /* 调整分页组件的间距 */
  text-align: center;
  transition: opacity 0.5s ease;
}

.el-table th,
.el-table td {
  text-align: center;
  animation: fadeIn 1s ease-in-out;
}

.animated-table .el-table__row {
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