# Save the 20 processes using the most memory and append them to the dashboard asset path (Every 5 minutes)

$ErrorActionPreference = "Stop"

# 반복 실행 간격 설정 (300초 = 5분)
$IntervalSeconds = 300

$csvPath = ".\assets\data\process_top20.csv"
$outputDir = [System.IO.Path]::GetDirectoryName($csvPath)

Write-Host "=== 시스템 프로세스 모니터링 시작 (주기: 5분) ===" -ForegroundColor Cyan
Write-Host "대상 저장 파일: $csvPath" -ForegroundColor Cyan
Write-Host "중지하려면 콘솔 창에서 [Ctrl + C]를 누르세요." -ForegroundColor Yellow

while ($true) {
    try {
        # 저장 폴더가 없으면 자동 생성
        New-Item -ItemType Directory -Path $outputDir -Force | Out-Null

        $capturedAt = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
        $computer = Get-CimInstance Win32_ComputerSystem
        $os = Get-CimInstance Win32_OperatingSystem
        $cpu = Get-CimInstance Win32_Processor | Select-Object -First 1
        $uptimeHours = [math]::Round(((Get-Date) - $os.LastBootUpTime).TotalHours, 2)

        $rows = Get-Process |
            Sort-Object WorkingSet64 -Descending |
            Select-Object -First 20 |
            ForEach-Object {
                $startTime = $null
                try { $startTime = $_.StartTime.ToString("yyyy-MM-dd HH:mm:ss") } catch {}

                [PSCustomObject]@{
                    CapturedAt       = $capturedAt
                    ComputerName     = $env:COMPUTERNAME
                    Manufacturer     = $computer.Manufacturer
                    Model            = $computer.Model
                    OS               = $os.Caption
                    CPU              = $cpu.Name.Trim()
                    TotalRAM_GB      = [math]::Round($computer.TotalPhysicalMemory / 1GB, 2)
                    Uptime_Hours     = $uptimeHours
                    RankByMemory     = 0
                    ProcessName      = $_.ProcessName
                    ProcessId        = $_.Id
                    Memory_MB        = [math]::Round($_.WorkingSet64 / 1MB, 2)
                    CPU_TotalSeconds = if ($null -eq $_.CPU) { $null } else { [math]::Round($_.CPU, 2) }
                    Threads          = $_.Threads.Count
                    Handles          = $_.HandleCount
                    StartTime        = $startTime
                }
            }

        for ($index = 0; $index -lt $rows.Count; $index++) {
            $rows[$index].RankByMemory = $index + 1
        }

        # 파일이 존재하면 이어쓰기(Append), 없으면 새로 생성
        if (Test-Path $csvPath) {
            $rows | Export-Csv -Path $csvPath -NoTypeInformation -Encoding UTF8 -Append
        }
        else {
            $rows | Export-Csv -Path $csvPath -NoTypeInformation -Encoding UTF8
        }

        $currentTime = Get-Date -Format "HH:mm:ss"
        Write-Host "[$currentTime] 저장 완료 (20건): $csvPath" -ForegroundColor Green
    }
    catch {
        Write-Error "프로세스 정보 수집 실패: $($_.Exception.Message)"
    }

    # 다음 실행까지 5분 대기
    Start-Sleep -Seconds $IntervalSeconds
}