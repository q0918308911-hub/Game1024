@echo off
@set /P code=Please enter the game code:
@set gameCode=Game%code%
@echo %gameCode%
D:\ProgramData\cocos\editors\Creator\3.8.3\CocosCreator.exe --project .\ --build "configPath=.\buildConfig\%gameCode%.json"
@pause

::node compress.js
::@pause