# YRO.ps1
$YROPath = Join-Path $PSScriptRoot "../lib/binaries/CLI.js"
node $YROPath $args
