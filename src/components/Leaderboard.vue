<template>
  <div class="leaderboard">
    <el-card class="box-card animated-card">
      <div class="header">
        <h2 class="centered-title animated-title">胜率图表</h2>
      </div>
      <div ref="winRateChart" class="chart animated-chart"></div>
    </el-card>

    <el-card class="box-card animated-card">
      <div class="header">
        <h2 class="centered-title animated-title">场次图表</h2>
      </div>
      <div ref="gamesPlayedChart" class="chart animated-chart"></div>
    </el-card>
  </div>
</template>

<script>
import axios from 'axios';
import * as echarts from 'echarts';

export default {
  name: 'GameLeaderboard',
  data() {
    return {
      winRateLeaderboard: [],
      gamesPlayedLeaderboard: []
    };
  },
  created() {
    this.fetchWinRateLeaderboard();
    this.fetchGamesPlayedLeaderboard();
  },
  methods: {
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
    renderWinRateChart() {
      const chart = echarts.init(this.$refs.winRateChart);
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
      chart.setOption(option);
    },
    renderGamesPlayedChart() {
      const chart = echarts.init(this.$refs.gamesPlayedChart);
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
      chart.setOption(option);
    }
  }
};
</script>

<style scoped>
.leaderboard {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 20px;
}

.box-card {
  margin-bottom: 20px; /* 增加卡片之间的间隔 */
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  transition: box-shadow 0.3s;
}

.box-card:hover {
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.2);
}

.header {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 20px;
}

.centered-title {
  margin: 0;
  color: #409EFF;
  text-align: center;
  width: 100%;
}

.chart {
  width: 100%;
  height: 400px;
}

.animated-card {
  animation: fadeIn 1s ease-in-out;
  opacity: 0;
  animation-fill-mode: forwards;
}

.animated-title {
  animation: slideIn 1s ease-in-out;
  animation-delay: 0.2s;
  opacity: 0;
  animation-fill-mode: forwards;
}

.animated-chart {
  animation: slideIn 1s ease-in-out;
  animation-delay: 0.4s;
  opacity: 0;
  animation-fill-mode: forwards;
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