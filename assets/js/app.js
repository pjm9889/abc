const App = {
    init() {
        this.initTimeFilter();
        this.applyFilters();
        this.startClock();
    },

    startClock() {
        setInterval(() => {
            document.getElementById('live-clock').innerText = new Date().toLocaleTimeString();
        }, 1000);
    },

    switchTab(tabId, element) {
        document.querySelectorAll('.sidebar-menu li').forEach(li => li.classList.remove('active'));
        element.classList.add('active');

        document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
        document.getElementById('tab-' + tabId).classList.add('active');

        const titles = {
            'dashboard': ['실시간 프로세스 모니터링 대시보드', '시스템 자원 점유율 상위 프로세스 상태 분석'],
            'processes': ['프로세스 Top 20 상세 내역', '수집된 프로세스 전체 목록 및 세부 정보'],
            'analytics': ['상세 성능 분석', '메모리, 스레드, CPU 간의 상관관계 산점도'],
            'system': ['시스템 하드웨어 정보', '모니터링 대상 호스트의 하드웨어 및 OS 스펙']
        };
        document.getElementById('page-title').innerText = titles[tabId][0];
    },

    initTimeFilter() {
        const times = [...new Set(rawData.map(item => item.CapturedAt))];
        const select = document.getElementById('filter-time');
        times.forEach(time => {
            const opt = document.createElement('option');
            opt.value = time;
            opt.innerText = time;
            select.appendChild(opt);
        });
    },

    resetFilters() {
        document.getElementById('filter-time').value = 'all';
        document.getElementById('filter-search').value = '';
        document.getElementById('filter-sort').value = 'memory';
        this.applyFilters();
    },

    applyFilters() {
        const selectedTime = document.getElementById('filter-time').value;
        const searchQuery = document.getElementById('filter-search').value.toLowerCase();
        const sortBy = document.getElementById('filter-sort').value;

        let filtered = rawData.filter(item => {
            const matchTime = (selectedTime === 'all' || item.CapturedAt === selectedTime);
            const matchSearch = item.ProcessName.toLowerCase().includes(searchQuery) || item.ProcessId.toString().includes(searchQuery);
            return matchTime && matchSearch;
        });

        filtered.sort((a, b) => {
            if (sortBy === 'memory') return b.Memory_MB - a.Memory_MB;
            if (sortBy === 'cpu') return b.CPU_TotalSeconds - a.CPU_TotalSeconds;
            if (sortBy === 'threads') return b.Threads - a.Threads;
            if (sortBy === 'handles') return b.Handles - a.Handles;
            return 0;
        });

        this.updateKPIs(filtered);
        this.renderTables(filtered);
        ChartManager.renderAll(filtered);
    },

    updateKPIs(data) {
        document.getElementById('kpi-total-records').innerText = data.length;
        if (data.length > 0) {
            const avgMem = data.reduce((acc, curr) => acc + curr.Memory_MB, 0) / data.length;
            document.getElementById('kpi-avg-memory').innerText = avgMem.toFixed(1) + ' MB';

            const maxProc = [...data].sort((a, b) => b.Memory_MB - a.Memory_MB)[0];
            document.getElementById('kpi-max-proc').innerText = maxProc.ProcessName;
            document.getElementById('kpi-max-proc-val').innerText = `${maxProc.Memory_MB.toLocaleString()} MB (PID: ${maxProc.ProcessId})`;

            document.getElementById('kpi-unique-procs').innerText = new Set(data.map(i => i.ProcessName)).size;
            document.getElementById('header-computer').innerText = data[0].ComputerName;
            document.getElementById('header-ram').innerText = data[0].TotalRAM_GB + ' GB';
            document.getElementById('header-uptime').innerText = data[0].Uptime_Hours + 'h';
        }
    },

    renderTables(data) {
        const tbody1 = document.getElementById('process-table-body');
        const tbody2 = document.getElementById('full-process-table-body');
        document.getElementById('table-count').innerText = `총 ${data.length}개 항목`;

        let html1 = '', html2 = '';
        data.forEach(item => {
            const isHigh = item.Memory_MB > 500;
            html1 += `<tr>
                <td><strong>#${item.RankByMemory}</strong></td>
                <td><i class="fa-solid fa-cube" style="color: var(--accent-primary); margin-right: 6px;"></i>${item.ProcessName}</td>
                <td>${item.ProcessId}</td>
                <td>${item.Memory_MB.toLocaleString()} MB</td>
                <td>${item.CPU_TotalSeconds.toLocaleString()}s</td>
                <td>${item.Threads}</td>
                <td>${item.Handles.toLocaleString()}</td>
                <td style="font-size: 0.8rem; color: var(--text-muted);">${item.StartTime}</td>
                <td><span class="status-badge ${isHigh ? 'high' : 'normal'}">${isHigh ? 'High RAM' : 'Normal'}</span></td>
            </tr>`;

            html2 += `<tr>
                <td style="font-size: 0.8rem; color: var(--text-muted);">${item.CapturedAt}</td>
                <td>${item.ComputerName}</td>
                <td>#${item.RankByMemory}</td>
                <td><strong>${item.ProcessName}</strong></td>
                <td>${item.ProcessId}</td>
                <td>${item.Memory_MB.toLocaleString()} MB</td>
                <td>${item.CPU_TotalSeconds.toLocaleString()}s</td>
                <td>${item.Threads}</td>
                <td>${item.Handles.toLocaleString()}</td>
            </tr>`;
        });

        tbody1.innerHTML = html1 || `<tr><td colspan="9" style="text-align: center; color: var(--text-muted);">데이터가 없습니다.</td></tr>`;
        tbody2.innerHTML = html2 || `<tr><td colspan="9" style="text-align: center; color: var(--text-muted);">데이터가 없습니다.</td></tr>`;
    },

    exportCSV() {
        let csv = "data:text/csv;charset=utf-8,\uFEFFCapturedAt,ComputerName,RankByMemory,ProcessName,ProcessId,Memory_MB,CPU_TotalSeconds,Threads,Handles\r\n";
        rawData.forEach(r => {
            csv += `\"${r.CapturedAt}\",\"${r.ComputerName}\",${r.RankByMemory},\"${r.ProcessName}\",${r.ProcessId},${r.Memory_MB},${r.CPU_TotalSeconds},${r.Threads},${r.Handles}\r\n`;
        });
        const link = document.createElement("a");
        link.href = encodeURI(csv);
        link.download = "system_process_export.csv";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
};

document.addEventListener('DOMContentLoaded', () => App.init());
