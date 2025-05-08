<template>
  <div class="user-management">
    <h1 class="admin-title">管理员界面</h1>

    <el-pagination @size-change="handleSizeChange" @current-change="handleCurrentChange" :current-page="currentPage"
      :page-sizes="[5, 10, 20, 30, 40]" :page-size="pageSize" layout="total, sizes, prev, pager, next, jumper"
      :total="totalUsers" class="pagination"></el-pagination>
    <div class="search-bar">
      <el-input v-model="keyword" placeholder="请输入用户名进行搜索，可以直接回车搜索..." prefix-icon="el-icon-search"
        @keyup.enter="handleSearch" class="search-input" clearable />
      <el-button type="primary" @click="handleSearch" class="search-button">搜索</el-button>
      <el-button type="default" @click="handleReset" class="reset-button">重置</el-button>
      <el-dropdown>
        <el-button type="success" class="export-button">
          导入/导出<i class="el-icon-arrow-down el-icon--right"></i>
        </el-button>
        <template v-slot:dropdown>
          <el-dropdown-item @click="exportUsers('csv')">导出CSV</el-dropdown-item>
          <el-dropdown-item @click="exportUsers('xlsx')">导出Excel</el-dropdown-item>
          <el-dropdown-item @click="downloadTemplate('csv')">下载CSV模板</el-dropdown-item>
          <el-dropdown-item @click="downloadTemplate('xlsx')">下载Excel模板</el-dropdown-item>
          <el-dropdown-item @click="showAddUserDialog">添加用户</el-dropdown-item>
          <el-dropdown-item @click="showImportDialog">导入用户</el-dropdown-item>
        </template>
      </el-dropdown>
    </div>

    <div class="table-container animated-container">
      <el-table :data="pagedUsers" :height="tableHeight" :key="tableKey">
        <el-table-column prop="username" label="用户名" min-width="180" align="center" sortable></el-table-column>
        <el-table-column prop="email" label="邮箱" min-width="250" align="center" sortable></el-table-column>
        <el-table-column prop="phone" label="电话" min-width="180" align="center" sortable></el-table-column>
        <el-table-column label="头像" min-width="100" align="center">
          <template v-slot="scope">
            <img :src="'http://115.235.191.234:3000' + scope.row.userface" alt="头像" class="userface">
          </template>
        </el-table-column>
        <el-table-column label="操作" min-width="180" align="center">
          <template v-slot="scope">
            <el-button type="primary" @click="handleEdit(scope.row)" size="small">编辑</el-button>
            <el-button type="danger" @click="handleDelete(scope.row)" size="small">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <el-dialog v-model="importDialogVisible" title="导入用户" class="animated-dialog">
      <el-form label-position="top">
        <el-form-item label="选择导入方式">
          <el-radio-group v-model="importType">
            <el-radio label="batch">批量导入</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="选择文件" class="left-align">
          <input type="file" @change="importUsers" class="import-input" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="importDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="importUsers">导入</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="dialogVisible" title="用户信息" class="animated-dialog">
      <el-form :model="currentUser" label-position="top">
        <el-form-item label="用户名">
          <el-input v-model="currentUser.username"></el-input>
        </el-form-item>
        <el-form-item label="邮箱">
          <el-input v-model="currentUser.email"></el-input>
        </el-form-item>
        <el-form-item label="电话">
          <el-input v-model="currentUser.phone"></el-input>
        </el-form-item>
        <el-form-item label="密码" v-if="!isEdit">
          <el-input v-model="currentUser.password" type="password"></el-input>
        </el-form-item>
        <el-form-item v-if="isEdit" label="头像">
          <input type="file" @change="handleFileChange" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveUser">保存</el-button>
      </template>
    </el-dialog>

  </div>
</template>

<script>
import axios from 'axios';
import { ref, reactive, onMounted, computed, watch } from 'vue';
import { ElMessageBox, ElMessage } from 'element-plus';

export default {
  name: 'UserManagement',
  setup() {
    const users = ref([]); // 用户列表
    const currentPage = ref(1); // 当前页码
    const pageSize = ref(5); // 每页显示的记录数
    const totalUsers = ref(0); // 用户总数
    const tableKey = ref(0); // 用于强制重新渲染表格
    const tableHeight = ref(400); // 表格高度

    const dialogVisible = ref(false); // 对话框是否可见
    const importDialogVisible = ref(false); // 导入对话框是否可见
    const isEdit = ref(false); // 是否为编辑模式
    const currentUser = reactive({
      username: '',
      email: '',
      phone: '',
      password: '', // 新增密码字段
      userface: ''
    });
    const selectedFile = ref(null); // 选中的文件
    const importType = ref('batch'); // 导入类型

    const keyword = ref('');

    // 获取用户数据
    const fetchUsers = async (searchKeyword = '') => {
      try {
        const response = await axios.get('http://115.235.191.234:3000/api/users', {
          params: { keyword: searchKeyword }
        });
        users.value = response.data;
        totalUsers.value = response.data.length;
        tableKey.value += 1; // 强制重新渲染表格
      } catch (error) {
        console.error('获取用户信息时出错:', error);
        ElMessage.error('获取用户信息失败');
      }
    };

    // 计算当前页的用户数据
    const pagedUsers = computed(() => {
      const start = (currentPage.value - 1) * pageSize.value;
      const end = start + pageSize.value;
      return users.value.slice(start, end);
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

    // 组件挂载时获取用户数据
    onMounted(() => {
      fetchUsers();
      adjustTableHeight();
    });

    // 监听 pageSize 变化
    watch(pageSize, adjustTableHeight);

    // 编辑用户信息
    const handleEdit = (row) => {
      Object.assign(currentUser, row);
      isEdit.value = true;
      dialogVisible.value = true;
    };

    // 删除用户信息
    const handleDelete = (row) => {
      ElMessageBox.confirm('确定要删除这条记录吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(async () => {
        try {
          await axios.post('http://115.235.191.234:3000/api/deleteUser', { username: row.username });
          fetchUsers();
          ElMessage.success('删除成功');
        } catch (error) {
          console.error('删除用户时出错:', error);
          ElMessage.error('删除失败');
        }
      }).catch(() => {
        ElMessage.info('已取消删除');
      });
    };

    // 显示导入对话框
    const showImportDialog = () => {
      importDialogVisible.value = true;
    };

    // 显示添加用户对话框
    const showAddUserDialog = () => {
      isEdit.value = false;
      dialogVisible.value = true;
    };

    // 处理文件选择
    const handleFileChange = (event) => {
      selectedFile.value = event.target.files[0];
    };

    // 保存用户信息
    const saveUser = async () => {
      try {
        if (isEdit.value && selectedFile.value) {
          const formData = new FormData();
          formData.append('file', selectedFile.value);
          formData.append('username', currentUser.username);

          const uploadResponse = await axios.post('http://115.235.191.234:3000/api/uploadAvatar', formData, {
            headers: {
              'Content-Type': 'multipart/form-data'
            }
          });

          currentUser.userface = uploadResponse.data.url;
        }

        if (isEdit.value) {
          await axios.post('http://115.235.191.234:3000/api/updateUser', currentUser);
          ElMessage.success('更新成功');
        } else {
          await axios.post('http://115.235.191.234:3000/api/register', currentUser);
          ElMessage.success('添加成功');
        }
        fetchUsers();
        dialogVisible.value = false;
      } catch (error) {
        console.error('保存用户信息时出错:', error);
        ElMessage.error('保存失败');
      }
    };

    // 导出用户数据
    const exportUsers = async (format) => {
      try {
        const response = await axios.get(`http://115.235.191.234:3000/api/exportUsers/${format}`, {
          responseType: 'blob'
        });
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `users.${format === 'xlsx' ? 'xlsx' : format}`);
        document.body.appendChild(link);
        link.click();
      } catch (error) {
        console.error('导出用户数据时出错:', error);
        ElMessage.error('导出失败');
      }
    };

    // 下载模板
    const downloadTemplate = async (format) => {
      try {
        const response = await axios.get(`http://115.235.191.234:3000/api/downloadTemplate/${format}`, {
          responseType: 'blob'
        });
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `template.${format === 'xlsx' ? 'xlsx' : format}`);
        document.body.appendChild(link);
        link.click();
      } catch (error) {
        console.error('下载模板时出错:', error);
        ElMessage.error('下载模板失败');
      }
    };

    // 导入用户数据
    const importUsers = async (event) => {
      const file = event.target.files[0];
      if (!file) return;

      const formData = new FormData();
      formData.append('file', file);

      const format = file.name.split('.').pop();

      try {
        await axios.post(`http://115.235.191.234:3000/api/importUsers/${format}`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        ElMessage.success('导入成功');
        fetchUsers();
        importDialogVisible.value = false;
      } catch (error) {
        console.error('导入用户数据时出错:', error);
        ElMessage.error('导入失败');
      }
    };

    const handleSearch = () => {
      fetchUsers(keyword.value);
    };

    const handleReset = () => {
      keyword.value = '';
      fetchUsers();
    };

    return {
      users,
      pagedUsers,
      currentPage,
      pageSize,
      totalUsers,
      dialogVisible,
      importDialogVisible,
      isEdit,
      currentUser,
      selectedFile,
      importType,
      handleEdit,
      handleDelete,
      showImportDialog,
      showAddUserDialog,
      handleFileChange,
      saveUser,
      handleSizeChange,
      handleCurrentChange,
      tableKey,
      tableHeight,
      keyword,
      handleSearch,
      handleReset,
      exportUsers,
      importUsers,
      downloadTemplate
    };
  }
};
</script>

<style scoped>
.user-management {
  padding: 20px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
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

.el-button+.el-button {
  margin-left: 0px;
  /* 调整按钮之间的间距 */
}

.el-button {
  margin-right: 12px;
}

.search-button,
.reset-button,
.export-button,
.add-user-button {
  flex-shrink: 0;
  transition: background-color 0.3s ease, transform 0.3s ease;
}

.search-button:hover,
.reset-button:hover,
.export-button:hover,
.add-user-button:hover {
  background-color: #409eff;
  color: #fff;
  transform: scale(1.05);
}

.table-container {
  flex: 1;
  display: flex;
  justify-content: center;
  width: 100%;
  animation: fadeIn 1s ease-in-out;
}

.userface {
  border-radius: 50%;
  border: 2px solid #ddd;
  width: 50px;
  height: 50px;
  object-fit: cover;
}

.el-pagination {
  margin-bottom: 20px;
  text-align: center;
  transition: opacity 0.5s ease;
}

.el-dialog {
  width: 400px;
  animation: fadeIn 1s ease-in-out;
}

.el-form-item {
  margin-bottom: 20px;
}

.import-input {
  display: block;
  width: 200px;
}

.el-table th,
.el-table td {
  text-align: center;
}

.animated-container {
  animation: fadeIn 1s ease-in-out;
}

.left-align {
  text-align: left;
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