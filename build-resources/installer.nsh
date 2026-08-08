; NSIS custom script — FactureStock installer
; Adds firewall rule and shows LAN info at end of install

!macro customInstall
  ; Allow port 13000 through Windows Firewall
  DetailPrint "Ouverture du port 13000 dans le pare-feu Windows..."
  nsExec::ExecToLog 'netsh advfirewall firewall delete rule name="FactureStock Port 13000"'
  nsExec::ExecToLog 'netsh advfirewall firewall add rule name="FactureStock Port 13000" dir=in action=allow protocol=TCP localport=13000'
  nsExec::ExecToLog 'netsh advfirewall firewall add rule name="FactureStock Port 13000 OUT" dir=out action=allow protocol=TCP localport=13000'
  DetailPrint "Port 13000 ouvert."
!macroend

!macro customUninstall
  ; Remove firewall rule on uninstall
  nsExec::ExecToLog 'netsh advfirewall firewall delete rule name="FactureStock Port 13000"'
  nsExec::ExecToLog 'netsh advfirewall firewall delete rule name="FactureStock Port 13000 OUT"'
!macroend
