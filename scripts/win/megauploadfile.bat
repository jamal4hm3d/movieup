@echo off

mega-login %1 %2 && mega-put %3 && mega-import %4 && mega-mv * files/ && mega-export -a -f files && mega-logout && mega-quit