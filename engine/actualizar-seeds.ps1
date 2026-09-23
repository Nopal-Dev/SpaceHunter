# Descarga las listas de seeds farmeadas más recientes de Ten Lines (FireRed/LeafGreen).
# Downloads the latest farmed FireRed/LeafGreen seed lists from Ten Lines.
# Uso: clic derecho > "Ejecutar con PowerShell", o desde una terminal:
#   powershell -ExecutionPolicy Bypass -File actualizar-seeds.ps1
#
# Solo actualiza los datos (data/*.bin); el motor (engine.js) no se toca, porque una
# versión nueva del motor podría no ser compatible con la interfaz de Easy Lines.

$ErrorActionPreference = 'Stop'
$base = 'https://lincoln-lm.github.io/ten-lines/generated'
$dest = Join-Path $PSScriptRoot 'data'
$files = 'fr_eng', 'fr_eng_mgba', 'fr_eng_nx', 'fr_jpn_1_0', 'fr_jpn_1_1', 'fr_jpn_nx',
         'lg_eng', 'lg_eng_mgba', 'lg_eng_nx', 'lg_jpn', 'lg_jpn_nx'

foreach ($name in $files) {
    $target = Join-Path $dest "$name.bin"
    $tmp = "$target.tmp"
    try {
        Invoke-WebRequest -Uri "$base/$name.bin" -OutFile $tmp -UseBasicParsing
        Move-Item -Force $tmp $target
        Write-Host "OK      $name.bin"
    } catch {
        if (Test-Path $tmp) { Remove-Item $tmp }
        Write-Host "ERROR   $name.bin  ($($_.Exception.Message))" -ForegroundColor Red
    }
}
Write-Host "`nListo. Recarga Easy Lines con Ctrl+F5."
