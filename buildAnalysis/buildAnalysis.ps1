<#
    BuildAnalysis - 包體大小分析工具
    
    vs code 偵錯執行:
    1. RUN AND DEBUG 選擇 PowerShell
    2. 選擇 launch current file
    3. 按下 Shift + Ctrl + P
    4. 選擇 PowerShell: Show Session Menu
    5. 選擇 "Windows PowerShell x64"
    6. 按 F5 執行

    注意:
    第 3 ~ 5 點目的為指定 PowerShell 為 Windows 內建版本
    因為打包成 exe 後只能運作在該內建版本，所以必須確保程式使用的語法可以支援內建版本

    環境設定與打包:
    執行 setup.exe 腳本進行自動化安裝與打包
    .\setup.exe
    
    該腳本會自動檢查環境並安裝必要的 ps2exe 模組
#>

<#
    跳出錯誤訊息視窗
    @param [string[]] $errorMessage 錯誤訊息字串
    @param [string] $errorTitle 錯誤視窗標題
#>
function Show-ErrorMessage {
    param(
        [string[]]$errorMessage,
        [string]$errorTitle
    )
    [System.Windows.Forms.MessageBox]::Show($errorMessage, $errorTitle, [System.Windows.Forms.MessageBoxButtons]::OK, [System.Windows.Forms.MessageBoxIcon]::Error) | Out-Null
}

# 匯入必要的 .NET 類別
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

# 根目錄
$projectRoot = Get-Location
$buildRoot = Join-Path $projectRoot "build"

$form = New-Object System.Windows.Forms.Form
$form.Text = "包體大小列表工具 - PowerShell"
$form.Size = New-Object System.Drawing.Size(1400, 600)
$form.StartPosition = "CenterScreen"
$form.BackColor = [System.Drawing.Color]::FromArgb(30, 30, 30)

# 設置字型
$font = New-Object System.Drawing.Font("Microsoft JhengHei", 12)
$form.ForeColor = [System.Drawing.Color]::White

# 標籤: 選擇包體目錄
$labelComboBuild = New-Object System.Windows.Forms.Label
$labelComboBuild.Text = "選擇包體目錄: "
$labelComboBuild.AutoSize = $true
$labelComboBuild.Location = New-Object System.Drawing.Point(10, 13)
$labelComboBuild.Font = $font
$form.Controls.Add($labelComboBuild)

# 下拉選單: 選擇 build 子資料夾
$comboBuild = New-Object System.Windows.Forms.ComboBox
$comboBuild.Location = New-Object System.Drawing.Point(130, 10)
$comboBuild.Size = New-Object System.Drawing.Size(300, 30)
$comboBuild.Font = $font
$comboBuild.FlatStyle = [System.Windows.Forms.FlatStyle]::Flat
$comboBuild.DropDownStyle = [System.Windows.Forms.ComboBoxStyle]::DropDownList
$comboBuild.Items.Insert(0, "-- 選擇包體資料夾 --")
$comboBuild.SelectedIndex = 0
$form.Controls.Add($comboBuild)

# 初始化下拉選單
if (Test-Path $buildRoot) {
    $subFolders = Get-ChildItem -Path $buildRoot -Directory | Select-Object -ExpandProperty Name
    if ($subFolders) {
        $comboBuild.Items.AddRange($subFolders)
    }
    else {
        $errorMessage = @(
            "資料夾 $buildRoot 中沒有任何子資料夾"
            "請先進行構建發布操作"
        ) -join "`r`n"
        Show-ErrorMessage -errorMessage $errorMessage -errorTitle "錯誤"
        exit
    }
}
else {
    $errorMessage = @(
        "找不到資料夾 $buildRoot"
        "請先進行構建發布操作"
    ) -join "`r`n"
    Show-ErrorMessage -errorMessage $errorMessage -errorTitle "錯誤"
    exit
}

# 標籤: 讀取檔案提示
$labelLoading = New-Object System.Windows.Forms.Label
$labelLoading.Text = ""
$labelLoading.AutoSize = $true
$labelLoading.Location = New-Object System.Drawing.Point(450, 13)
$labelLoading.Font = $font
$form.Controls.Add($labelLoading)

# 標籤: 總檔案大小
$labelTotal = New-Object System.Windows.Forms.Label
$labelTotal.Text = "總檔案大小:"
$labelTotal.AutoSize = $true
$labelTotal.Location = New-Object System.Drawing.Point(10, 50)
$labelTotal.Font = $font
$form.Controls.Add($labelTotal)

# 標籤: 包體路徑
$labelBasePath = New-Object System.Windows.Forms.Label
$labelBasePath.Text = "包體路徑: "
$labelBasePath.AutoSize = $true
$labelBasePath.Location = New-Object System.Drawing.Point(10, 75)
$labelBasePath.Font = $font
$form.Controls.Add($labelBasePath)

# 標籤: 操作說明
$labelTip = New-Object System.Windows.Forms.Label
$labelTip.Text = "點擊或使用方向鍵選中檔案會在右側顯示資源在專案中的檔案名稱和路徑"
$labelTip.AutoSize = $true
$labelTip.Location = New-Object System.Drawing.Point(10, 100)
$labelTip.Font = $font
$form.Controls.Add($labelTip)

# 樹狀結構: 顯示檔案列表
$tree = New-Object System.Windows.Forms.TreeView
$tree.Location = New-Object System.Drawing.Point(10, 130)
$tree.Size = New-Object System.Drawing.Size(850, 430)
$tree.Font = $font
$tree.BackColor = [System.Drawing.Color]::FromArgb(30, 30, 30)
$tree.ForeColor = [System.Drawing.Color]::White
$tree.HideSelection = $false
$tree.Anchor = [System.Windows.Forms.AnchorStyles]::Top -bor `
    [System.Windows.Forms.AnchorStyles]::Bottom -bor `
    [System.Windows.Forms.AnchorStyles]::Left -bor `
    [System.Windows.Forms.AnchorStyles]::Right
$form.Controls.Add($tree)

# 檔案資訊區塊: 顯示檔案名稱，可選取複製
$txtSelectedFileInfo = New-Object System.Windows.Forms.TextBox
$txtSelectedFileInfo.Multiline = $true
$txtSelectedFileInfo.WordWrap = $false
$txtSelectedFileInfo.ReadOnly = $true
$txtSelectedFileInfo.ScrollBars = "Both"
$txtSelectedFileInfo.Font = $font
$txtSelectedFileInfo.BackColor = [System.Drawing.Color]::FromArgb(40, 40, 40)
$txtSelectedFileInfo.ForeColor = [System.Drawing.Color]::White
$txtSelectedFileInfo.Location = New-Object System.Drawing.Point(870, 130)
$txtSelectedFileInfo.Size = New-Object System.Drawing.Size(510, 430)
$txtSelectedFileInfo.Anchor = [System.Windows.Forms.AnchorStyles]::Top -bor `
    [System.Windows.Forms.AnchorStyles]::Bottom -bor `
    [System.Windows.Forms.AnchorStyles]::Right
$form.Controls.Add($txtSelectedFileInfo)

$currentFolder = ""
$uuidMap = @{}
$mainConfigJson = @{}
$resourcesConfigJson = @{}
$isProcessingSelect = $false

# 初始化 Base64 對照表 (解壓uuid用)
$Base64KeyChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"
$AsciiTo64 = @{}
for ($i = 0; $i -lt 64; $i++) {
    $AsciiTo64[[byte][char]$Base64KeyChars[$i]] = $i
}

<#
    列出指定資料夾下所有檔案，依副檔名分類並顯示於樹狀結構
    @param [string] $folder 指定資料夾路徑
#>

function Show-Files {
    param([string]$folder)
    if (-not (Test-Path $folder)) { return }

    $tree.Nodes.Clear()
    $totalSize = 0
    $fileDict = @{}

    $labelTotal.Text = "總檔案大小: "
    $labelBasePath.Text = "包體路徑: "
    $txtSelectedFileInfo.Text = ""

    $readConfigJsonSuccess = Set-ConfigJson $folder
    if (-not $readConfigJsonSuccess) {
        return
    }

    Get-ChildItem -Path $folder -Recurse -File | ForEach-Object {
        $ext = $_.Extension
        if ([string]::IsNullOrEmpty($ext)) { $ext = "No Extension" }
        if (-not $fileDict.ContainsKey($ext)) { $fileDict[$ext] = @() }
        $fileDict[$ext] += $_
        $totalSize += $_.Length
    }

    # 計算每個副檔名的總大小
    $extTotalSize = @{}
    foreach ($ext in $fileDict.Keys) {
        $extTotalSize[$ext] = ($fileDict[$ext] | Measure-Object Length -Sum).Sum
    }

    # 依副檔名總大小排序
    $sortedExt = $fileDict.Keys | Sort-Object { - $extTotalSize[$_] }

    # 建立樹狀節點
    foreach ($ext in $sortedExt) {
        $extSize = $extTotalSize[$ext]
        $percent = ($extSize / $totalSize * 100)
        $parentNode = $tree.Nodes.add("[$ext] " + (Format-Size $extSize) + " ( {0:N2}% )" -f $percent)
        foreach ($file in $fileDict[$ext] | Sort-Object Length -Descending) {
            $relativePath = Get-RelativePath -basePath $folder -targetPath $file.fullName
            $parentNode.Nodes.Add("(" + (Format-Size $file.Length) + ") " + $relativePath) | Out-Null
        }
        $parentNode.Collapse()
    }

    $labelTotal.Text = "總檔案大小: " + (Format-Size $totalSize)
    $labelBasePath.Text = "包體路徑: " + $folder
}

<#
    讀取 config.json
    @return [bool] 是否讀取成功
#>
function Set-ConfigJson {
    param([string]$folder)
    <#
        構建時未啟用 md5 cache 的情況，檔名會是config.json
        構建時有啟用 md5 cache 的情況，檔名會是config.<hash>.json
    #>
    try {
        $mainFolder = Join-Path $folder "assets\main"
        if (Test-Path $mainFolder) {
            $mainConfigFile = Get-ChildItem -Path $mainFolder -Filter "config*.json" |
            Where-Object { $_.Name -match '^config(\.[a-zA-Z0-9]+)?\.json$' } |
            Select-Object -First 1
            $Script:mainConfigJson = Get-Content $mainConfigFile.FullName -Raw | ConvertFrom-Json
        }
        else {
            throw
        }
    }
    catch {
        $errorMessage = @(
            "路徑: $mainFolder"
            "嘗試讀取 config.json 失敗"
            "請確認檔案及資料夾是否存在、json 內容是否正確"
        ) -join "`r`n"
        Show-ErrorMessage -errorMessage $errorMessage -errorTitle "錯誤"
        return $false
    }

    try {
        $resourcesFolder = Join-Path $folder "assets\resources"
        if (Test-Path $resourcesFolder) {
            $resourcesConfigFile = Get-ChildItem -Path $resourcesFolder -Filter "config*.json" |
            Where-Object { $_.Name -match '^config(\.[a-zA-Z0-9]+)?\.json$' } |
            Select-Object -First 1
            $Script:resourcesConfigJson = Get-Content $resourcesConfigFile.FullName -Raw | ConvertFrom-Json
        }
        else {
            throw
        }
    }
    catch {
        $errorMessage = @(
            "路徑: $resourcesFolder"
            "嘗試讀取 config.json 失敗"
            "請確認檔案及資料夾是否存在、json 內容是否正確"
        ) -join "`r`n"
        Show-ErrorMessage -errorMessage $errorMessage -errorTitle "錯誤"
        return $false
    }
    return $true
}

<#
    檔案大小格式化函式
    @param [long] $bytes 檔案大小 bytes 值
    @return [string] 格式化後的檔案大小
#>
function Format-Size {
    param([long]$bytes)

    $byteString = ""

    if ($bytes -ge 1GB) {
        $byteString = "{0:N2} GB" -f ($bytes / 1GB)
    }
    elseif ($bytes -ge 1MB) {
        $byteString = "{0:N2} MB" -f ($bytes / 1MB)
    }
    elseif ($bytes -ge 1KB) {
        $byteString = "{0:N2} KB" -f ($bytes / 1KB)
    }
    else {
        $byteString = "$bytes B"
    }

    return $byteString
}

<#
    獲取相對路徑
    @param [string] $basePath 基準資料夾絕對路徑
    @param [string] $targetPath 目標資料夾/檔案絕對路徑
    @return [string] 
#>
function Get-RelativePath {
    param(
        [string]$basePath,
        [string]$targetPath
    )

    # 如果 targetPath 不在 basePath 下，回傳 null
    if (-not $targetPath.StartsWith($basePath, [System.StringComparison]::OrdinalIgnoreCase)) {
        return $null
    }

    # 直接刪掉 BasePath 部分(包含開頭的\)
    $relativePath = $targetPath.Substring($basePath.Length + 1)

    return $relativePath
}


# 下拉選單選擇事件
$comboBuild.Add_SelectedIndexChanged({
        $selectedIndex = $comboBuild.SelectedIndex
        if ($selectedIndex -gt 0) {
            $selected = $comboBuild.SelectedItem
            $Script:currentFolder = Join-Path $buildRoot $selected
            Show-Files $Script:currentFolder
        }
    })

# treeView 節點選中事件(方向鍵 or 被點擊)
$tree.Add_AfterSelect({
        param($eventSender, $e)
        # 正在處理圖集資訊時跳過
        if ($isProcessingSelect) { return }
        # 鎖住操作，不讓使用者馬上觸發其他檔案處理
        $isProcessingSelect = $true
        $nodeText = $e.Node.Text
        if ($nodeText -match "^\(([0-9,]+(?:\.[0-9]+)?) [KMG]?B\) (.+)$") {
            $relativePath = $matches[2]
            $fullPath = Join-Path $Script:currentFolder $relativePath
            $uuid = Get-UuidByPath $fullPath
            
            if ($Script:uuidMap.ContainsKey($uuid)) {
                Set-FileInfoByUuid $uuid
            }
            else {
                $allFilePath = @()
                if ($fullPath.contains("assets\main") -or $fullPath.Contains("assets\resources")) {
                    $jsonData = if ($fullPath.Contains("assets\main") ) { $Script:mainConfigJson } else { $Script:resourcesConfigJson }
                    $allFilePath = Get-AutoPacAllImagePath -jsonData $jsonData -autoPacUuid $uuid
                }
                if ($allFilePath.Length -gt 0) {
                    Set-FileInfoByAutoPac $allFilePath
                }
                else {
                    $relativePath = Get-RelativePath -basePath $projectRoot -targetPath $fullPath
                    $hierarchyText = Get-TreeText $relativePath

                    if ($uuid -eq "") {
                        $extension = [System.IO.Path]::GetExtension($fullPath).ToLower()
                        $txtSelectedFileInfo.text = @(
                            "檔案路徑:"
                            "$hierarchyText"
                            "uuid:"
                            "無 uuid"
                            ""
                            "檔案副檔名為不需要找到資源的類型: $extension"
                        ) -join "`r`n"
                    }
                    else {
                        $txtSelectedFileInfo.text = @(
                            "檔案路徑:"
                            "$hierarchyText"
                            "uuid:"
                            "$uuid"
                            ""
                            "無法在 assets 資料夾底下找到資源"
                            "可複製 uuid 到編輯器中的資源管理器確認:"
                            " - 檔案不是 internal 資源"
                            " - 若找不到檔案，請重新 build 一次遊戲後再重啟工具"
                            ""
                            "若上述處理步驟無法解決問題，請回報給作者"
                        ) -join "`r`n"
                    }
                } 
            }
        }
        $isProcessingSelect = $false
    })
    
<#
    根據檔案路徑取得 uuid 
    @param [string] $fullPath 檔案絕對路徑
    @return [string] 資源 uuid
#>
function Get-UuidByPath {
    param([string]$fullPath)
    $extension = [System.IO.Path]::GetExtension($fullPath).ToLower()
    $excludeExtension = @(
        ".json"
        ".css"
        ".html"
        ".ico"
        ".js"
        ".wasm"
    )
    if ($extension -eq ".ttf") {
        # .ttf 路徑會是 xxx/xxx/<uuid>/<檔案名稱>.ttf
        $fileName = Split-Path $fullPath -Parent | Split-Path -Leaf
    }
    elseif ($excludeExtension.Contains($extension)) {
        # 部分檔案沒有或不需要顯示資源資訊
        $fileName = ''
    }
    else {
        # 資源檔案路徑會是 xxx/xxx/<檔案名稱>.<副檔名>
        $fileName = [System.IO.Path]::GetFileNameWithoutExtension($fullPath)
    }

    # 如果檔名中有 md5 cache 標記 (例如 "logo.7f2a1")
    if ($filename -match '^(?<name>.+?)\.[a-f0-9]{4,}$') {
        $uuid = $matches['name']
    }
    else {
        $uuid = $filename
    }

    return $uuid
}

<#
    顯示非圖集資源的資訊
    @param [string] $uuid 資源 uuid
#>
function Set-FileInfoByUuid {
    param([string]$uuid)
    $filePath = $Script:uuidMap[$uuid]
    $relativePath = Get-RelativePath -basePath $projectRoot -targetPath $filePath

    $hierarchyText = Get-TreeText -files $relativePath
    $txtSelectedFileInfo.Text = @(
        "資源路徑:"
        "$hierarchyText"
    ) -join "`r`n"
}

<#
    獲取圖集中所有小圖片的路徑
    @param [object] $jsonData config.json 資料
    @param [string] $autoPacUuid 自動圖集 uuid (從檔名取得，而非專案中 .pac 檔案的 uuid)
    @return [string[]]
#>
function Get-AutoPacAllImagePath {
    param(
        [object]$jsonData,
        [string]$autoPacUuid
    )

    <#
        假設一張圖片是自動圖集合圖後的結果 檔案路徑為: D:\project\Web_Slot\build\web-mobile\assets\main\native\13\13b390736.png
        圖集的 key 值會是檔案名稱的前兩碼減0x10: 03b390736
        該 key值可以在 config.json 找到圖集內所有小圖片壓縮後的 uuid
    #>
    $allFilePath = @()
    if ($autoPacUuid -match '^[0-9a-fA-F]+$') {
        $prefix = $autoPacUuid.Substring(0, 2)
        $subDirNum = "{0:x2}" -f (([Convert]::ToInt32($prefix, 16)) - 0x10)
        $dataKey = $subDirNum + $autoPacUuid.Substring(2)
        $pack = $jsonData.packs.$dataKey;
        foreach ($data in $pack) {
            $compressedUuid = $jsonData.uuids[$data] -replace "@[0-9a-fA-F]+$"
            $uuid = Get-DecompressedUuid $compressedUuid
            $filePath = $Script:uuidMap[$uuid]
            $relativePath = Get-RelativePath -basePath $projectRoot -targetPath $filePath
            $allFilePath += $relativePath
        }
    }
    return $allFilePath
}

<#
    顯示圖集圖檔的資訊
    @param [string[]] $allFilePath 圖擊內所有小圖片的相對路徑(相對於根目錄路徑)
#>
function Set-FileInfoByAutoPac {
    param([string[]]$allFilePath)

    $hierarchyText = Get-TreeText $allFilePath
    $txtSelectedFileInfo.Text = @(
        "圖集圖片檔案:"
        "$hierarchyText"
    ) -join "`r`n"
}

<#
    把檔案路徑整理成樹狀結構字串 (遞迴方法)
    @param [string[]] $files 檔案字串陣列
    @param [string] $prefix 節點字串前綴
    @param [bool] $isRoot 是否為根目錄 (外部呼叫時為 true)
    @return [string]
#>
function Get-TreeText {
    param(
        [string[]]$files,
        [string]$prefix = "",
        [bool]$isRoot = $true
    )

    # 分組 (資料夾/檔案)
    $groups = @($files | Group-Object {
            $parts = $_ -split "\\"
            if ($parts.Count -gt 1) { $parts[0] } else { "" }
        })

    $text = ""

    foreach ($groupIndex in 0..($groups.Count - 1)) {
        $group = $groups[$groupIndex]
        $isLastGroup = ($groupIndex -eq $groups.Count - 1)

        $branch = ""
        if (-not $isRoot) {
            $branch = if ($isLastGroup) { "└ " } else { "├ " }
        }

        if ($group.Name -eq "") {
            # 同層所有檔案
            for ($i = 0; $i -lt $group.Group.Count; $i++) {
                $file = $group.Group[$i]
                # 判斷最後一個項目（檔案 + 後續資料夾）
                $isLastItem = ($i -eq $group.Group.Count - 1) -and $isLastGroup
                $fileBranch = if ($isLastItem) { "└ " } else { "├ " }
                $text += "$prefix$fileBranch$file`r`n"
            }
        }
        else {
            # 資料夾
            $text += "$prefix$branch$($group.Name)\`r`n"

            # 新前綴
            $newPrefix = $prefix
            if (-not $isRoot) {
                $newPrefix += if ($isLastGroup) { "    " } else { "│   " }
            }

            # 遞迴處理子目錄
            $subFiles = $group.Group | Where-Object { $_ -and $_ -match "\\" } | ForEach-Object {
                ($_ -split "\\")[1..(($_ -split "\\").Count - 1)] -join "\"
            }

            if ($subFiles.Count -gt 0) {
                $text += Get-TreeText -files $subFiles -prefix $newPrefix -isRoot:$false
            }
        }
    }

    return $text
}

<#
    解壓 uuid
    @param [string] $uuid 壓縮過的 uuid
    @return [string]
#>
function Get-DecompressedUuid {
    param([string]$str)
    if ($str.Length -eq 23) {
        $hexChars = @()
        for ($i = 5; $i -lt 23; $i += 2) {
            $lhs = $AsciiTo64[[byte][char]$str[$i]]
            $rhs = $AsciiTo64[[byte][char]$str[$i + 1]]

            $hexChars += ('{0:x}' -f ($lhs -shr 2))
            $hexChars += ('{0:x}' -f ((($lhs -band 3) -shl 2) -bor ($rhs -shr 4)))
            $hexChars += ('{0:x}' -f ($rhs -band 0xF))
        }
        $str = $str.Substring(0, 5) + ($hexChars -join '')
    }
    elseif ($str.Length -eq 22) {
        $hexChars = @()
        for ($i = 2; $i -lt 22; $i += 2) {
            $lhs = $AsciiTo64[[byte][char]$str[$i]]
            $rhs = $AsciiTo64[[byte][char]$str[$i + 1]]

            $hexChars += ('{0:x}' -f ($lhs -shr 2))
            $hexChars += ('{0:x}' -f ((($lhs -band 3) -shl 2) -bor ($rhs -shr 4)))
            $hexChars += ('{0:x}' -f ($rhs -band 0xF))
        }
        $str = $str.Substring(0, 2) + ($hexChars -join '')
    }
    else {
        return $str
    }

    # 轉成 UUID 格式
    return ($str.Substring(0, 8) + "-" +
        $str.Substring(8, 4) + "-" +
        $str.Substring(12, 4) + "-" +
        $str.Substring(16, 4) + "-" +
        $str.Substring(20))
}

<#
    啟用異步方法
    @param [string] $projectRoot: 根目錄
    @return [object] uuidMap<資源uuid,資源絕對路徑>
#>
$job = Start-Job -ArgumentList $projectRoot -ScriptBlock {
    param([string]$projectRoot)

    # 讀取資源檔案並放置到 Map 內
    function Set-AssetFileMap {
        param($folderPath)
        $uuidMap = @{}

        if (-not (Test-Path $folderPath)) {
            Add-Type -AssemblyName System.Windows.Forms
            [System.Windows.Forms.MessageBox]::Show("資料夾不存在: $folderPath", "錯誤") | Out-Null
            exit
        }

        # 讀取 .meta 檔案，以 key=<uuid>、value=<去掉.meta後綴的完整檔案路徑> 放入 uuidMap
        $metaFiles = Get-ChildItem -Path $folderPath -Filter "*.meta" -Recurse -File
        $totalFileCount = $metaFiles.Length
        $completedFileCount = 0;
        foreach ($file in $metaFiles) {
            try {
                $json = Get-Content $file.FullName -Raw | ConvertFrom-Json
                $completedFileCount += 1
                $progressRatio = $completedFileCount / $totalFileCount
                Write-Output $progressRatio
                if ($json.importer -and $json.importer -ne "directory" -and $json.uuid) {
                    $resourcePath = $file.FullName.Replace(".meta", "")
                    $uuidMap[$json.uuid] = $resourcePath
                }
            }
            catch {
                # 有些檔案無法轉json
            }
        }

        return @{
            uuidMap = $uuidMap
        }
    }

    $assetFolder = Join-Path $projectRoot "assets"
    Set-AssetFileMap -folderPath $assetFolder
}

# 使用 Timer 檢查 Job 是否完成
$timer = New-Object System.Windows.Forms.Timer
$timer.Interval = 200 
$timer.Add_Tick({
        if ($Script:job.State -eq "Completed") {
            $timer.Stop()
            $result = Receive-Job $job
            Remove-Job $job

            # 更新全域變數
            $Script:uuidMap = $result.uuidMap
            $comboBuild.Enabled = $true
            $labelLoading.Text = ""
            $Script:job = $null
        }    
        else {
            $outputs = Receive-Job $job -Keep
            if ($outputs) {
                $progress = $outputs[-1] * 100
                $labelLoading.Text = "讀取檔案中... 進度：{0:N2} %" -f $progress
            }
        }
    })
$timer.Start()

# 檔案載入完成前禁用操作
$comboBuild.Enabled = $false
$labelLoading.Text = "讀取檔案中..."

# 視窗關閉時強制停止異步方法
$form.Add_FormClosing({
        $timer.Stop()
        if ($Script:job) {
            if ($Script:job.State -eq "Running") {
                Stop-Job $Script:job
            }
            if (Get-Job -Id $Script:job.Id) {
                Remove-Job $Script:job
            }
        }
    })

$form.Add_Shown({ $form.Activate() })
# 顯示 UI
[void]$form.ShowDialog()