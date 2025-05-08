<template>
  <div class="stats-container">
    <h2 class="stats-title">统计信息</h2>
    <div class="stats-content">
      <el-row :gutter="20">
        <el-col :span="24">
          <div class="table-container animated-container">
            <el-table :data="statsData" style="width: 100%">
              <el-table-column prop="label" label="统计项" width="180"></el-table-column>
              <el-table-column prop="value" label="数值"></el-table-column>
            </el-table>
          </div>
        </el-col>
        <el-col :span="24">
          <div class="chart-container animated-container">
            <h2 class="centered-title">胜率图表</h2>
            <div ref="winRateChart" class="chart"></div>
          </div>
        </el-col>
        <el-col :span="24">
          <div class="chart-container animated-container">
            <h2 class="centered-title">场次图表</h2>
            <div ref="gamesPlayedChart" class="chart"></div>
          </div>
        </el-col>
      </el-row>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import * as echarts from 'echarts';

export default {
  name: 'StatsComponent',
  data() {
    return {
      stats: {
        totalGames: 0,
        botWins: 0,
        playerWins: 0
      },
      winRateLeaderboard: [],
      gamesPlayedLeaderboard: [],
      winRateChartInstance: null,
      gamesPlayedChartInstance: null
    };
  },
  computed: {
    statsData() {
      return [
        { label: '总对局数', value: this.stats.totalGames },
        { label: '机器人胜利数', value: this.stats.botWins },
        { label: '玩家胜利数', value: this.stats.playerWins }
      ];
    }
  },
  created() {
    this.fetchStats();
    this.fetchWinRateLeaderboard();
    this.fetchGamesPlayedLeaderboard();
  },
  mounted() {
    this.initCharts();
    window.addEventListener('resize', this.handleResize);
  },
  beforeUnmount() {
    if (this.winRateChartInstance) {
      this.winRateChartInstance.dispose();
    }
    if (this.gamesPlayedChartInstance) {
      this.gamesPlayedChartInstance.dispose();
    }
    window.removeEventListener('resize', this.handleResize);
  },
  methods: {
    async fetchStats() {
      try {
        const response = await axios.get('http://115.235.191.234:3000/api/stats');
        this.stats = response.data;
      } catch (error) {
        console.error('获取统计信息时出错:', error);
      }
    },
    async fetchWinRateLeaderboard() {
      try {
        const response = await axios.get('http://115.235.191.234:3000/api/winRateLeaderboard');
        this.winRateLeaderboard = response.data;
        this.renderWinRateChart();
      } catch (error) {
        console.error('获取胜率排行榜时出错:', error);
      }
    },
    async fetchGamesPlayedLeaderboard() {
      try {
        const response = await axios.get('http://115.235.191.234:3000/api/gamesPlayedLeaderboard');
        this.gamesPlayedLeaderboard = response.data;
        this.renderGamesPlayedChart();
      } catch (error) {
        console.error('获取场次排行榜时出错:', error);
      }
    },
    initCharts() {
      this.winRateChartInstance = echarts.init(this.$refs.winRateChart);
      this.gamesPlayedChartInstance = echarts.init(this.$refs.gamesPlayedChart);
      this.renderWinRateChart();
      this.renderGamesPlayedChart();
    },
    renderWinRateChart() {
      if (!this.winRateChartInstance) return;
      const option = {
        title: {
          text: '胜率排行榜',
          left: 'center',
          textStyle: {
            color: '#409EFF',
            fontSize: 20
          }
        },
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type: 'shadow'
          }
        },
        xAxis: {
          type: 'category',
          data: this.winRateLeaderboard.map(item => item.username),
          axisLabel: {
            rotate: 45,
            interval: 0,
            textStyle: {
              color: '#333'
            }
          }
        },
        yAxis: {
          type: 'value',
          axisLabel: {
            formatter: '{value} %',
            textStyle: {
              color: '#333'
            }
          }
        },
        series: [
          {
            name: '胜率',
            type: 'bar',
            data: this.winRateLeaderboard.map(item => item.winRate),
            itemStyle: {
              color: '#409EFF'
            },
            animationEasing: 'elasticOut',
            animationDelay: (idx) => idx * 100
          }
        ]
      };
      this.winRateChartInstance.setOption(option);
    },
    renderGamesPlayedChart() {
      if (!this.gamesPlayedChartInstance) return;
      const option = {
        title: {
          text: '场次排行榜',
          left: 'center',
          textStyle: {
            color: '#67C23A',
            fontSize: 20
          }
        },
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type: 'shadow'
          }
        },
        xAxis: {
          type: 'category',
          data: this.gamesPlayedLeaderboard.map(item => item.username),
          axisLabel: {
            rotate: 45,
            interval: 0,
            textStyle: {
              color: '#333'
            }
          }
        },
        yAxis: {
          type: 'value',
          axisLabel: {
            textStyle: {
              color: '#333'
            }
          }
        },
        series: [
          {
            name: '总场次',
            type: 'bar',
            data: this.gamesPlayedLeaderboard.map(item => item.totalGames),
            itemStyle: {
              color: '#67C23A'
            },
            animationEasing: 'elasticOut',
            animationDelay: (idx) => idx * 100
          }
        ]
      };
      this.gamesPlayedChartInstance.setOption(option);
    },
    handleResize() {
      if (this.winRateChartInstance) {
        this.winRateChartInstance.resize();
      }
      if (this.gamesPlayedChartInstance) {
        this.gamesPlayedChartInstance.resize();
      }
    }
  }
};
</script>

<style scoped>
.stats-container {
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  width: 100%;
  height: auto; /* 确保填充父容器 */
  display: flex;
  flex-direction: column;
  align-items: center; /* 居中对齐 */
  animation: fadeIn 1s ease-in-out;
}

.stats-title {
  font-size: 2em;
  margin-bottom: 20px;
  color: #333;
  text-align: center; /* 居中对齐 */
  animation: slideIn 1s ease-in-out;
}

.stats-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
  width: 100%; /* 确保内容宽度为100% */
  max-width: 1200px; /* 设置最大宽度 */
  align-items: center; /* 居中对齐 */
}

.table-container {
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  padding: 30px;
  width: 100%; /* 确保容器宽度为100% */
  max-width: 800px; /* 设置最大宽度 */
  margin: auto;
  margin-bottom: 20px;
  text-align: center;
  animation: fadeIn 1s ease-in-out;
}

.chart-container {
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  padding: 30px;
  width: 100%; /* 确保容器宽度为100% */
  max-width: 800px; /* 设置最大宽度 */
  margin: auto;
  margin-bottom: 20px;
  text-align: center;
  animation: fadeIn 1s ease-in-out;
}

.centered-title {
  margin: 0;
  color: #409EFF;
  text-align: center; /* 居中对齐 */
  width: 100%;
}

.chart {
  width: 100%;
  height: 500px; /* 设置图表的高度 */
}

.animated-container {
  animation: fadeIn 1s ease-in-out;
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