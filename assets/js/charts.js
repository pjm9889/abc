const ChartManager = {
    instances: { memory: null, cpuPie: null, scatter: null },

    renderAll(data) {
        this.renderMemoryChart(data);
        this.renderCpuPieChart(data);
        this.renderScatterChart(data);
    },

    renderMemoryChart(data) {
        const top10 = [...data].sort((a, b) => b.Memory_MB - a.Memory_MB).slice(0, 10);
        const labels = top10.map(i => `${i.ProcessName} (${i.ProcessId})`);
        const memData = top10.map(i => i.Memory_MB);

        const ctx = document.getElementById('memoryChart').getContext('2d');
        if (this.instances.memory) this.instances.memory.destroy();

        this.instances.memory = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: '메모리 점유량 (MB)',
                    data: memData,
                    backgroundColor: 'rgba(56, 189, 248, 0.6)',
                    borderColor: 'rgba(56, 189, 248, 1)',
                    borderWidth: 1,
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    x: { ticks: { color: '#94a3b8', font: { size: 10 } }, grid: { display: false } },
                    y: { ticks: { color: '#94a3b8' }, grid: { color: '#334155' } }
                }
            }
        });
    },

    renderCpuPieChart(data) {
        const top5 = [...data].sort((a, b) => b.Memory_MB - a.Memory_MB).slice(0, 5);
        const labels = top5.map(i => i.ProcessName);
        const cpuData = top5.map(i => i.CPU_TotalSeconds);

        const ctx = document.getElementById('cpuPieChart').getContext('2d');
        if (this.instances.cpuPie) this.instances.cpuPie.destroy();

        this.instances.cpuPie = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: cpuData,
                    backgroundColor: ['#38bdf8', '#818cf8', '#34d399', '#fbbf24', '#f87171'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                plugins: { legend: { position: 'bottom', labels: { color: '#94a3b8', font: { size: 11 } } } }
            }
        });
    },

    renderScatterChart(data) {
        const ctx = document.getElementById('scatterChart').getContext('2d');
        if (this.instances.scatter) this.instances.scatter.destroy();

        const points = data.map(i => ({ x: i.Threads, y: i.Memory_MB, label: i.ProcessName }));

        this.instances.scatter = new Chart(ctx, {
            type: 'scatter',
            data: {
                datasets: [{
                    label: '스레드 수 vs 메모리 (MB)',
                    data: points,
                    backgroundColor: 'rgba(129, 140, 248, 0.8)'
                }]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: (ctx) => `${ctx.raw.label}: 스레드 ${ctx.raw.x}개, 메모리 ${ctx.raw.y} MB`
                        }
                    }
                },
                scales: {
                    x: { title: { display: true, text: '스레드 수', color: '#94a3b8' }, ticks: { color: '#94a3b8' }, grid: { color: '#334155' } },
                    y: { title: { display: true, text: '메모리 (MB)', color: '#94a3b8' }, ticks: { color: '#94a3b8' }, grid: { color: '#334155' } }
                }
            }
        });
    }
};
