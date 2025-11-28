<!DOCTYPE html>
<html lang="zh">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>花朵</title>
    <style>
        body {
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            background-color: #f0f8ff;
        }
        .flower {
            display: flex;
            flex-direction: column;
            align-items: center;
        }
        .petal {
            width: 50px;
            height: 100px;
            background-color: #ff69b4;
            border-radius: 50%;
            position: relative;
            margin: 5px;
        }
        .petal:nth-child(1) { transform: rotate(0deg); }
        .petal:nth-child(2) { transform: rotate(60deg); }
        .petal:nth-child(3) { transform: rotate(120deg); }
        .petal:nth-child(4) { transform: rotate(180deg); }
        .petal:nth-child(5) { transform: rotate(240deg); }
        .petal:nth-child(6) { transform: rotate(300deg); }
        .center {
            width: 50px;
            height: 50px;
            background-color: #ffd700;
            border-radius: 50%;
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
        }
    </style>
</head>
<body>
    <div class="flower">
        <div class="petal"></div>
        <div class="petal"></div>
        <div class="petal"></div>
        <div class="petal"></div>
        <div class="petal"></div>
        <div class="petal"></div>
        <div class="center"></div>
    </div>
</body>
</html>