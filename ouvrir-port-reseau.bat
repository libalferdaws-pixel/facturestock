@echo off
:: Script d'ouverture du port 13000 dans le pare-feu Windows
:: Lancer en tant qu'Administrateur

echo.
echo ========================================
echo  FactureStock - Configuration reseau
echo ========================================
echo.
echo Ouverture du port 13000 pour le reseau local...

netsh advfirewall firewall delete rule name="FactureStock" >nul 2>&1
netsh advfirewall firewall add rule name="FactureStock" dir=in action=allow protocol=TCP localport=13000

if %errorlevel% == 0 (
    echo.
    echo [OK] Port 13000 ouvert avec succes !
    echo.
    echo Les autres PC du reseau peuvent maintenant acceder a FactureStock.
    echo.
    echo Pour trouver l'adresse IP de ce PC, tapez : ipconfig
    echo Cherchez "Adresse IPv4" sous votre connexion reseau.
    echo.
) else (
    echo.
    echo [ERREUR] Lancez ce script en tant qu'Administrateur.
    echo Clic droit sur le fichier -^> "Executer en tant qu'administrateur"
    echo.
)

pause
